import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingChange: (isTyping: boolean) => void;
}

const TYPING_STOP_DELAY_MS = 1500;

export default function MessageInput({ onSend, onTypingChange }: MessageInputProps) {
  const [value, setValue] = useState("");
  const typingRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notifyTyping = () => {
    if (!typingRef.current) {
      typingRef.current = true;
      onTypingChange(true);
    }
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      onTypingChange(false);
    }, TYPING_STOP_DELAY_MS);
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    clearTimeout(stopTimerRef.current);
    typingRef.current = false;
    onTypingChange(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className="message-input-row" onSubmit={handleSubmit}>
      <textarea
        className="message-input"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (e.target.value) notifyTyping();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Write a message…"
        rows={1}
      />
      <button className="btn btn-primary message-send-btn" type="submit" disabled={!value.trim()}>
        Send
      </button>
    </form>
  );
}
