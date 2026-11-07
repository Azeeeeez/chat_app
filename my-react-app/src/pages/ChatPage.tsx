import { useChat } from "../context/ChatContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import "./ChatPage.css";

export default function ChatPage() {
  const { activeConversationId, setActiveConversationId } = useChat();

  return (
    <div className={`chat-shell ${activeConversationId ? "chat-shell--chat-active" : ""}`}>
      <Sidebar />
      <ChatWindow onBack={() => setActiveConversationId(null)} />
    </div>
  );
}
