import type { MessagePayload } from "../types";

interface MessageBubbleProps {
  message: MessagePayload;
  isOwn: boolean;
  showSender: boolean;
  seen: boolean;
}

export default function MessageBubble({ message, isOwn, showSender, seen }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`bubble-row ${isOwn ? "bubble-row--own" : ""}`}>
      <div className={`bubble ${isOwn ? "bubble--own" : "bubble--other"}`}>
        {showSender && !isOwn && <p className="bubble-sender">{message.sender.username}</p>}
        <p className="bubble-content">{message.content}</p>
        <span className="bubble-meta">
          {time}
          {isOwn && seen && " · Seen"}
        </span>
      </div>
    </div>
  );
}
