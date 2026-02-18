import type { ChatHistoryResponse, Contact, Message, SearchUser } from './types';

const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[messaging] ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/** GET /messaging/contacts */
export async function getContacts(): Promise<Contact[]> {
  return apiFetch<Contact[]>('/messaging/contacts');
}

/** GET /messaging/history/{user_id} */
export async function getChatHistory(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<ChatHistoryResponse> {
  return apiFetch<ChatHistoryResponse>(
    `/messaging/history/${userId}?limit=${limit}&offset=${offset}`,
  );
}

/** POST /messaging/send */
export async function sendMessageApi(
  receiverId: string,
  content: string,
): Promise<Message> {
  return apiFetch<Message>('/messaging/send', {
    method: 'POST',
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });
}

/** POST /messaging/read/{sender_id} */
export async function markAsRead(senderId: string): Promise<void> {
  await apiFetch<{ status: string }>(`/messaging/read/${senderId}`, {
    method: 'POST',
  });
}

/** GET /users?search=... */
export async function searchUsers(query: string): Promise<SearchUser[]> {
  if (!query.trim()) return [];
  return apiFetch<SearchUser[]>(
    `/users?search=${encodeURIComponent(query)}&limit=10`,
  );
}
