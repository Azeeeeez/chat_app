import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { ConversationSummary, MessagePayload, PresenceState } from "../types";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

interface ChatContextValue {
  conversations: ConversationSummary[];
  messagesByConversation: Record<string, MessagePayload[]>;
  presenceByUser: Record<string, PresenceState>;
  typingByConversation: Record<string, string[]>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  markRead: (conversationId: string) => void;
  startConversation: (usernames: string[], name?: string) => Promise<string>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, MessagePayload[]>
  >({});
  const [presenceByUser, setPresenceByUser] = useState<Record<string, PresenceState>>({});
  const [typingByConversation, setTypingByConversation] = useState<Record<string, string[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConversationRef = useRef<string | null>(null);
  activeConversationRef.current = activeConversationId;

  const refreshConversations = useCallback(async () => {
    if (!token) return;
    const list = await api.getConversations(token);
    setConversations(list);
  }, [token]);

  // Initial load once authenticated.
  useEffect(() => {
    if (token) refreshConversations();
  }, [token, refreshConversations]);

  // Load history when switching into a conversation for the first time.
  useEffect(() => {
    if (!token || !activeConversationId) return;
    if (messagesByConversation[activeConversationId]) return;

    api.getMessages(token, activeConversationId).then((history) => {
      setMessagesByConversation((prev) => ({ ...prev, [activeConversationId]: history }));
    });
    
  }, [token, activeConversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessageNew = (payload: MessagePayload) => {
      setMessagesByConversation((prev) => ({
        ...prev,
        [payload.conversationId]: [...(prev[payload.conversationId] ?? []), payload],
      }));
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === payload.conversationId);
        if (idx === -1) {
          refreshConversations();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], lastMessage: payload, lastMessageAt: payload.createdAt };
        return updated.sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });

      if (payload.conversationId === activeConversationRef.current && payload.sender.id !== user?.id) {
        socket.emit("message:read", { conversationId: payload.conversationId });
      }
    };

    const onPresenceUpdate = (payload: { userId: string; online: boolean; lastSeen: string }) => {
      setPresenceByUser((prev) => ({
        ...prev,
        [payload.userId]: { online: payload.online, lastSeen: payload.lastSeen },
      }));
    };

    const onTypingUpdate = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      setTypingByConversation((prev) => {
        const current = new Set(prev[payload.conversationId] ?? []);
        if (payload.isTyping) current.add(payload.userId);
        else current.delete(payload.userId);
        return { ...prev, [payload.conversationId]: [...current] };
      });
    };

    const onReadUpdate = (payload: { conversationId: string; userId: string }) => {
      setMessagesByConversation((prev) => {
        const list = prev[payload.conversationId];
        if (!list) return prev;
        return {
          ...prev,
          [payload.conversationId]: list.map((m) =>
            m.readBy.includes(payload.userId) ? m : { ...m, readBy: [...m.readBy, payload.userId] }
          ),
        };
      });
    };

    socket.on("message:new", onMessageNew);
    socket.on("presence:update", onPresenceUpdate);
    socket.on("typing:update", onTypingUpdate);
    socket.on("message:read:update", onReadUpdate);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("presence:update", onPresenceUpdate);
      socket.off("typing:update", onTypingUpdate);
      socket.off("message:read:update", onReadUpdate);
    };
  }, [token, user?.id, refreshConversations]);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    getSocket()?.emit("message:send", { conversationId, content });
  }, []);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    getSocket()?.emit(isTyping ? "typing:start" : "typing:stop", { conversationId });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    getSocket()?.emit("message:read", { conversationId });
  }, []);

  const startConversation = useCallback(
    async (usernames: string[], name?: string) => {
      if (!token) throw new Error("Not authenticated");
      const res = await api.createConversation(token, usernames, name);
      await refreshConversations();
      return res.id;
    },
    [token, refreshConversations]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messagesByConversation,
        presenceByUser,
        typingByConversation,
        activeConversationId,
        setActiveConversationId,
        sendMessage,
        setTyping,
        markRead,
        startConversation,
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
