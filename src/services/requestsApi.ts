/**
 * services/requestsApi.ts
 * Заявки клиента — реальные вызовы /api (раньше был мок).
 */
import type { RequestStatus } from '../config/services.config';
import { getService } from '../config/services.config';
import { api } from './api';

export interface ClientRequest {
  id: string;
  status: RequestStatus;
  serviceLabels: string[];
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  total: number;
  bookingFee: number;
  bookingPaid: boolean;
  wishes?: string;
  masterNote?: string;
  receipt?: string;
  createdAt: string;
}

/** Сырой ответ сервера (db.rowToRequest). */
interface ServerRequest {
  id: string;
  status: RequestStatus;
  mainId: string | null;
  addonIds: string[];
  date: string | null;
  time: string | null;
  total: number;
  bookingFee: number;
  bookingPaid: boolean;
  wishes?: string;
  masterNote?: string;
  receipt?: string;
  createdAt: string;
}

function toClientRequest(r: ServerRequest): ClientRequest {
  const labels = [
    r.mainId ? getService(r.mainId)?.label : null,
    ...(r.addonIds || []).map((id) => getService(id)?.label),
  ].filter(Boolean) as string[];
  return {
    id: r.id,
    status: r.status,
    serviceLabels: labels,
    date: r.date || '',
    time: r.time || '',
    total: r.total,
    bookingFee: r.bookingFee,
    bookingPaid: r.bookingPaid,
    wishes: r.wishes,
    masterNote: r.masterNote,
    receipt: r.receipt,
    createdAt: r.createdAt,
  };
}

export interface CreateRequestPayload {
  clientName: string;
  clientPhone: string;
  mainId: string | null;
  addonIds: string[];
  wishes: string;
  date: string;
  time: string;
  photos?: string[]; // data URL, до 3 фото
}

/** Создать заявку (статус pending_review). Бросает Error с .code при ошибке (напр. 'limit'). */
export async function createRequest(p: CreateRequestPayload): Promise<ClientRequest> {
  const r = await api.post<ServerRequest>('/api/requests', p);
  return toClientRequest(r);
}

/** Сохранённый профиль клиента (имя/телефон/согласие) для автозаполнения. */
export async function getProfile(): Promise<{ name: string; phone: string; consent: boolean }> {
  const c = await api.get<{ name?: string; phone?: string; consent?: boolean }>('/api/profile');
  return { name: c?.name || '', phone: c?.phone || '', consent: !!c?.consent };
}

/** Зафиксировать согласие на обработку персональных данных на сервере. */
export async function saveConsent(): Promise<void> {
  await api.post('/api/consent');
}

export async function getMyRequests(): Promise<ClientRequest[]> {
  const rows = await api.get<ServerRequest[]>('/api/requests/mine');
  return rows.map(toClientRequest);
}

export async function getRequest(id: string): Promise<ClientRequest | null> {
  const r = await api.get<ServerRequest>(`/api/requests/${id}`);
  return r ? toClientRequest(r) : null;
}

export async function withdrawRequest(id: string): Promise<void> {
  await api.post(`/api/requests/${id}/withdraw`);
}

export async function cancelRequest(id: string): Promise<{ refunded: boolean }> {
  return api.post<{ refunded: boolean }>(`/api/requests/${id}/cancel`);
}

/** Отправить чек об оплате брони на проверку мастеру (data URL изображения). */
export async function submitReceipt(id: string, receipt: string): Promise<ClientRequest> {
  const r = await api.post<ServerRequest>(`/api/requests/${id}/submit-receipt`, { receipt });
  return toClientRequest(r);
}
