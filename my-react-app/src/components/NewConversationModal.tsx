import { useEffect, useState } from "react";
import type { PublicUser } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import Avatar from "./Avatar";
import "./NewConversationModal.css";

export default function NewConversationModal({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const { startConversation, setActiveConversationId } = useChat();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const handle = setTimeout(() => {
      api.searchUsers(token, search).then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [token, search]);

  const handleSelect = async (user: PublicUser) => {
    setStarting(true);
    try {
      const id = await startConversation([user.username]);
      setActiveConversationId(id);
      onClose();
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Start a conversation</h2>
        <input
          className="modal-search"
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <ul className="modal-results">
          {results.map((user) => (
            <li key={user.id}>
              <button
                className="modal-result-row"
                onClick={() => handleSelect(user)}
                disabled={starting}
              >
                <Avatar username={user.username} color={user.avatarColor} size={32} />
                <span>{user.username}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="modal-empty">No users found</li>}
        </ul>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
