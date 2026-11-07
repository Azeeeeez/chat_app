import type { MessagePayload } from "./index";

export interface ClientToServerEvents {
  "message:send": (payload: { conversationId: string; content: string }) => void;
  "typing:start": (payload: { conversationId: string }) => void;
  "typing:stop": (payload: { conversationId: string }) => void;
  "message:read": (payload: { conversationId: string }) => void;
}

export interface ServerToClientEvents {
  "message:new": (payload: MessagePayload) => void;
  "typing:update": (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
  "presence:update": (payload: { userId: string; online: boolean; lastSeen: string }) => void;
  "message:read:update": (payload: { conversationId: string; userId: string }) => void;
  error: (payload: { message: string }) => void;
}
