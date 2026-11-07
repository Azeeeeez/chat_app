import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import { getConversationDisplayName, getOtherParticipant } from "../utils/conversation";
import "./ChatWindow.css";

export default function ChatWindow({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    typingByConversation,
    presenceByUser,
    sendMessage,
    setTyping,
    markRead,
  } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];
  const typingUserIds = (activeConversationId && typingByConversation[activeConversationId]) || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typingUserIds.length]);

  useEffect(() => {
    if (activeConversationId) markRead(activeConversationId);
  }, [activeConversationId, messages.length, markRead]);

  if (!conversation || !user) {
    return (
      <div className="chat-window chat-window--empty">
        <p>Select a conversation to start chatting.</p>
      </div>
    );
  }

  const other = getOtherParticipant(conversation, user.id);
  const name = getConversationDisplayName(conversation, user.id);
  const online = other ? presenceByUser[other.id]?.online : false;
  const typingOthers = typingUserIds.filter((id) => id !== user.id);
  const typingLabel = conversation.isGroup
    ? conversation.participants.find((p) => typingOthers.includes(p.id))?.username
    : name;

  return (
    <div className="chat-window">
      <header className="chat-header">
        <button className="chat-back-btn" onClick={onBack} aria-label="Back to conversations">
          ‹
        </button>
        <Avatar
          username={name}
          color={other?.avatarColor ?? "#3A6B5C"}
          size={36}
          online={conversation.isGroup ? undefined : online}
        />
        <div>
          <p className="chat-header-name">{name}</p>
          <p className="chat-header-status">
            {conversation.isGroup
              ? `${conversation.participants.length} people`
              : online
              ? "Online"
              : "Offline"}
          </p>
        </div>
      </header>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((message, idx) => {
          const isOwn = message.sender.id === user.id;
          const prev = messages[idx - 1];
          const showSender = conversation.isGroup && (!prev || prev.sender.id !== message.sender.id);
          const seen =
            !conversation.isGroup && !!other && message.readBy.includes(other.id);
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showSender={showSender}
              seen={seen}
            />
          );
        })}
        {typingOthers.length > 0 && <TypingIndicator label={typingLabel ?? "Someone"} />}
      </div>

      <MessageInput
        onSend={(content) => sendMessage(conversation.id, content)}
        onTypingChange={(isTyping) => setTyping(conversation.id, isTyping)}
      />
    </div>
  );
}
