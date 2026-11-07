import { Server, Socket } from "socket.io";
import { Types } from "mongoose";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { User, IUser } from "../models/User";
import { toMessagePayload } from "../utils/serialize";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  JwtPayload,
} from "../types";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { user: JwtPayload };
};
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/** Verifies the socket's user actually belongs to the conversation before letting them act on it. */
async function assertMembership(conversationId: string, userId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(conversationId)) return false;
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  return !!conversation;
}

export function registerChatHandlers(io: AppServer, socket: AppSocket): void {
  const userId = socket.data.user.sub;

  socket.on("message:send", async ({ conversationId, content }) => {
    const trimmed = content?.trim();
    if (!trimmed) return;

    const isMember = await assertMembership(conversationId, userId);
    if (!isMember) {
      socket.emit("error", { message: "You are not part of this conversation" });
      return;
    }

    const [message, sender] = await Promise.all([
      Message.create({ conversation: conversationId, sender: userId, content: trimmed, readBy: [userId] }),
      User.findById(userId),
      Conversation.findByIdAndUpdate(conversationId, { lastMessageAt: new Date() }, { new: true }),
    ]);

    if (!sender) return;

    const payload = toMessagePayload(message, sender as IUser);
    io.to(conversationRoom(conversationId)).emit("message:new", payload);

  
    
  });

  socket.on("typing:start", async ({ conversationId }) => {
    if (!(await assertMembership(conversationId, userId))) return;
    socket.to(conversationRoom(conversationId)).emit("typing:update", {
      conversationId,
      userId,
      isTyping: true,
    });
  });

  socket.on("typing:stop", async ({ conversationId }) => {
    if (!(await assertMembership(conversationId, userId))) return;
    socket.to(conversationRoom(conversationId)).emit("typing:update", {
      conversationId,
      userId,
      isTyping: false,
    });
  });

  socket.on("message:read", async ({ conversationId }) => {
    if (!(await assertMembership(conversationId, userId))) return;
    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    socket.to(conversationRoom(conversationId)).emit("message:read:update", {
      conversationId,
      userId,
    });
  });
}
