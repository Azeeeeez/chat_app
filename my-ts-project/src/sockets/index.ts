import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { Conversation } from "../models/Conversation";
import { User } from "../models/User";
import { presence } from "./presence";
import { registerChatHandlers } from "./chatHandlers";
import { ClientToServerEvents, ServerToClientEvents, JwtPayload } from "../types";
import '.././config'
const origin = process.env.CLIENT_ORIGIN;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { user: JwtPayload };
};

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

export function initializeSocket(httpServer: HttpServer): AppServer {
  const io: AppServer = new Server(httpServer, {
    cors: { origin: origin, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));
    try {
      const payload = verifyToken(token);
      (socket as AppSocket).data.user = payload;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const appSocket = socket as AppSocket;
    const userId = appSocket.data.user.sub;

    const conversations = await Conversation.find({ participants: userId }).select("_id");
    const rooms = conversations.map((c) => conversationRoom(c._id.toString()));
    await appSocket.join(rooms);
    await appSocket.join(`user:${userId}`);

    const cameOnline = presence.addSocket(userId, appSocket.id);
    if (cameOnline) {
      rooms.forEach((room) =>
        io.to(room).emit("presence:update", {
          userId,
          online: true,
          lastSeen: new Date().toISOString(),
        })
      );
    }

    registerChatHandlers(io, appSocket);

    appSocket.on("disconnect", async () => {
      const wentOffline = presence.removeSocket(userId, appSocket.id);
      if (wentOffline) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { lastSeen });
        rooms.forEach((room) =>
          io.to(room).emit("presence:update", {
            userId,
            online: false,
            lastSeen: lastSeen.toISOString(),
          })
        );
      }
    });
  });

  return io;
}
