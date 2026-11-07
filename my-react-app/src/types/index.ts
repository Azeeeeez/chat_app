export interface PublicUser {
  id: string;
  username: string;
  avatarColor: string;
  lastSeen: string;
}

export interface MessagePayload {
  id: string;
  conversationId: string;
  sender: PublicUser;
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface ConversationSummary {
  id: string;
  isGroup: boolean;
  name?: string;
  participants: PublicUser[];
  lastMessage: MessagePayload | null;
  lastMessageAt: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface PresenceState {
  online: boolean;
  lastSeen: string;
}
