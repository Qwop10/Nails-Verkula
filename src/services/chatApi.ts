/**
 * services/chatApi.ts
 * Чат клиент ↔ мастер. Сообщения хранятся на сервере (таблица messages).
 */
import { api } from './api';

export interface ChatMessage {
  id: number;
  clientId: string;
  sender: 'client' | 'master';
  text: string;
  createdAt: string;
}

export interface Conversation {
  clientId: string;
  name: string;
  phone: string;
  lastText: string;
  lastAt: string;
  lastSender: 'client' | 'master';
}

// ── Клиент ────────────────────────────────────────────────────
export function getMyMessages(): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>('/api/messages');
}
export function sendMyMessage(text: string): Promise<ChatMessage> {
  return api.post<ChatMessage>('/api/messages', { text });
}

// ── Мастер ────────────────────────────────────────────────────
export function getConversations(): Promise<Conversation[]> {
  return api.get<Conversation[]>('/api/admin/conversations');
}
export function getClientMessages(clientId: string): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(`/api/admin/messages?clientId=${encodeURIComponent(clientId)}`);
}
export function sendToClient(clientId: string, text: string): Promise<ChatMessage> {
  return api.post<ChatMessage>('/api/admin/messages', { clientId, text });
}
