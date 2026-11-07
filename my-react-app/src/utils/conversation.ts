import type { ConversationSummary, PublicUser } from "../types";

export function getOtherParticipant(
  conversation: ConversationSummary,
  selfId: string
): PublicUser | undefined {
  return conversation.participants.find((p) => p.id !== selfId);
}

export function getConversationDisplayName(conversation: ConversationSummary, selfId: string): string {
  if (conversation.isGroup) {
    return conversation.name || conversation.participants.map((p) => p.username).join(", ");
  }
  return getOtherParticipant(conversation, selfId)?.username ?? "Unknown";
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
