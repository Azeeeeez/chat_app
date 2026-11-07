const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request<{ token: string; user: import("../types").PublicUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  login: (identifier: string, password: string) =>
    request<{ token: string; user: import("../types").PublicUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
      forgotPassword: (email: string) =>
    request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
    updateEmail: (email: string) =>
    request<{ message: string }>("/api/auth/update-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: ( newPassword: string, token: string) =>
  request<{ message: string }>(`/api/auth/reset-password/${token}`, {
    method: "POST",
    body: JSON.stringify({ password: newPassword }),
  }),
    

  getConversations: (token: string) =>
    request<import("../types").ConversationSummary[]>("/api/conversations", {}, token),

  createConversation: (token: string, participantUsernames: string[], name?: string) =>
    request<{ id: string; reused: boolean }>(
      "/api/conversations",
      { method: "POST", body: JSON.stringify({ participantUsernames, name }) },
      token
    ),

  getMessages: (token: string, conversationId: string, before?: string) =>
    request<import("../types").MessagePayload[]>(
      `/api/conversations/${conversationId}/messages${before ? `?before=${before}` : ""}`,
      {},
      token
    ),

  searchUsers: (token: string, search: string) =>
    request<import("../types").PublicUser[]>(
      `/api/users?search=${encodeURIComponent(search)}`,
      {},
      token
    ),

  getVapidPublicKey: (token: string) =>
    request<{ publicKey: string }>("/api/push/vapid-public-key", {}, token),

  subscribePush: (token: string, subscription: PushSubscriptionJSON) =>
    request<{ message: string }>(
      "/api/push/subscribe",
      { method: "POST", body: JSON.stringify(subscription) },
      token
    ),

  unsubscribePush: (token: string, endpoint: string) =>
    request<{ message: string }>(
      "/api/push/unsubscribe",
      { method: "POST", body: JSON.stringify({ endpoint }) },
      token
    ),
};
