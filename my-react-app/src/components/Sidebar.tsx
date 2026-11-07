import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import Avatar from "./Avatar";
import NewConversationModal from "./NewConversationModal";
import { getConversationDisplayName, getOtherParticipant, formatRelativeTime } from "../utils/conversation";
import "./Sidebar.css";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { conversations, activeConversationId, setActiveConversationId, presenceByUser } = useChat();
  const [showModal, setShowModal] = useState(false);

  if (!user) return null;

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="sidebar-identity">
          <Avatar username={user.username} color={user.avatarColor} size={36} />
          <div>
            <p className="sidebar-username">{user.username}</p>
        
          </div>
        </div>
        <button className="btn btn-ghost sidebar-logout" onClick={logout}>
          Log out
        </button>
      </header>

      <button className="btn btn-primary sidebar-new-btn" onClick={() => setShowModal(true)}>
        New conversation
      </button>

      <ul className="conversation-list">
        {conversations.map((conversation) => {
          const other = getOtherParticipant(conversation, user.id);
          const online = other ? presenceByUser[other.id]?.online : false;
          const name = getConversationDisplayName(conversation, user.id);
          const isUnread =
            conversation.lastMessage &&
            conversation.lastMessage.sender.id !== user.id &&
            !conversation.lastMessage.readBy.includes(user.id);

          return (
            <li key={conversation.id}>
              <button
                className={`conversation-row ${
                  conversation.id === activeConversationId ? "conversation-row--active" : ""
                }`}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <Avatar
                  username={name}
                  color={other?.avatarColor ?? "#3A6B5C"}
                  size={40}
                  online={conversation.isGroup ? undefined : online}
                />
                <span className="conversation-row-text">
                  <span className="conversation-row-top">
                    <span className="conversation-row-name">{name}</span>
                    <span className="conversation-row-time">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </span>
                  </span>
                  <span className="conversation-row-preview">
                    {conversation.lastMessage?.content ?? "No messages yet"}
                  </span>
                </span>
                {isUnread && <span className="conversation-row-badge" aria-label="Unread" />}
              </button>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <p className="sidebar-empty">No conversations yet — start one above.</p>
        )}
      </ul>

      {showModal && <NewConversationModal onClose={() => setShowModal(false)} />}
    </aside>
  );
}
