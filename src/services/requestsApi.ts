/**
 * services/requestsApi.ts
 * Заявки клиента — реальные вызовы /api (раньше был мок).
 */
import type { RequestStatus } from '../config/services.config';
import { getService } from '../config/services.config';
import { api, openExternal } from './api';

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
}

/** Создать заявку (статус pending_review). Бросает Error с .code при ошибке (напр. 'limit'). */
export async function createRequest(p: CreateRequestPayload): Promise<ClientRequest> {
  const r = await api.post<ServerRequest>('/api/requests', p);
  return toClientRequest(r);
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

/**
 * Оплата брони. Если провайдер вернул ссылку (ЮKassa) — редиректим на оплату.
 * Если demo/мгновенный успех — возвращаем { paid:true }.
 */
export async function payBooking(id: string): Promise<{ paid: boolean }> {
  const res = await api.post<{ status: string; confirmationUrl: string | null }>(
    `/api/requests/${id}/pay-booking`
  );
  if (res.confirmationUrl) {
    openExternal(res.confirmationUrl);
    return { paid: false }; // оплата продолжится на стороне ЮKassa → подтверждение по вебхуку
  }
  return { paid: res.status === 'succeeded' };
}
