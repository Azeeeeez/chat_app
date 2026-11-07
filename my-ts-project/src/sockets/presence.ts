/**
 * Tracks which users currently have at least one open socket connection.
 * A user can have multiple tabs/devices open, so we count sockets per user
 * and only flip them "offline" once the last socket disconnects.
 */
class PresenceManager {
  private userToSockets = new Map<string, Set<string>>();

  /** Registers a socket for a user. Returns true if this is the user's first active connection. */
  addSocket(userId: string, socketId: string): boolean {
    const existing = this.userToSockets.get(userId);
    if (existing) {
      const wasOffline = existing.size === 0;
      existing.add(socketId);
      return wasOffline;
    }
    this.userToSockets.set(userId, new Set([socketId]));
    return true;
  }

  /** Removes a socket for a user. Returns true if the user has no remaining connections (now offline). */
  removeSocket(userId: string, socketId: string): boolean {
    const existing = this.userToSockets.get(userId);
    if (!existing) return true;
    existing.delete(socketId);
    return existing.size === 0;
  }

  isOnline(userId: string): boolean {
    return (this.userToSockets.get(userId)?.size ?? 0) > 0;
  }

  onlineUserIds(): string[] {
    return [...this.userToSockets.entries()]
      .filter(([, sockets]) => sockets.size > 0)
      .map(([userId]) => userId);
  }
}

export const presence = new PresenceManager();
