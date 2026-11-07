interface TypingIndicatorProps {
  label: string;
}

export default function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <div className="typing-indicator">
      <span>{label}</span>
      <span className="typing-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
