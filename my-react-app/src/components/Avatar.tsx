interface AvatarProps {
  username: string;
  color: string;
  size?: number;
  online?: boolean;
}

export default function Avatar({ username, color, size = 40, online }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <span
        className="avatar-circle"
        style={{ background: color, fontSize: size * 0.4 }}
        aria-hidden="true"
      >
        {initials}
      </span>
      {online !== undefined && (
        <span
          className={`avatar-presence ${online ? "avatar-presence--online" : ""}`}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </span>
  );
}
