/**
 * services/masterApi.ts
 * Панель мастера. Заявки/статистика — реальный /api. Расписание/услуги/отчёт/
 * настройки пока МОК (их серверные эндпоинты будут добавлены отдельно).
 */
import type { RequestStatus } from '../config/services.config';
import { calcTotal, getService, NAIL_SERVICES } from '../config/services.config';
import { api } from './api';

export interface MasterRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  clientTgId: number; // = clientId (Telegram id), для «написать в чат бота»
  status: RequestStatus;
  mainId: string | null;
  addonIds: string[];
  date: string;
  time: string;
  wishes?: string;
  bookingPaid: boolean;
  masterNote?: string;
  photos?: string[];
}

export interface ScheduleDay { key: string; label: string; working: boolean; slots: string[]; }
export interface ServiceItem { id: string; label: string; price: number | null; kind: 'main' | 'addon' | 'auto'; active: boolean; }
export interface MasterSettings { notifications: boolean; reminders: boolean; autoApprove: boolean; }
export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export function serviceLabels(r: Pick<MasterRequest, 'mainId' | 'addonIds'>): string[] {
  return [
    r.mainId ? getService(r.mainId)?.label : null,
    ...r.addonIds.map((id) => getService(id)?.label),
  ].filter(Boolean) as string[];
}

export function requestTotal(r: Pick<MasterRequest, 'mainId' | 'addonIds'>): number {
  return calcTotal(r.mainId, r.addonIds);
}

/* ── Заявки — реальный API ─────────────────────────────────── */
interface ServerRequest {
  id: string; clientId: string; clientName: string; clientPhone: string;
  status: RequestStatus; mainId: string | null; addonIds: string[];
  date: string | null; time: string | null; wishes?: string;
  bookingPaid: boolean; masterNote?: string; photos?: string[];
}

function toMasterRequest(r: ServerRequest): MasterRequest {
  return {
    id: r.id,
    clientName: r.clientName || '',
    clientPhone: r.clientPhone || '',
    clientTgId: Number(r.clientId),
    status: r.status,
    mainId: r.mainId,
    addonIds: r.addonIds || [],
    date: r.date || '',
    time: r.time || '',
    wishes: r.wishes,
    bookingPaid: r.bookingPaid,
    masterNote: r.masterNote,
    photos: r.photos || [],
  };
}

export async function getMasterRequests(): Promise<MasterRequest[]> {
  const rows = await api.get<ServerRequest[]>('/api/admin/requests');
  return rows.map(toMasterRequest);
}

export async function getStats(): Promise<{ today: number; pending: number; revenue: number }> {
  return api.get('/api/admin/stats');
}

export async function approveRequest(id: string): Promise<void> {
  await api.post(`/api/admin/requests/${id}/approve`);
}

export async function rejectRequest(id: string): Promise<void> {
  await api.post(`/api/admin/requests/${id}/reject`);
}

export async function updateRequest(
  id: string,
  patch: { mainId: string | null; addonIds: string[]; time: string; masterNote?: string }
): Promise<void> {
  await api.patch(`/api/admin/requests/${id}`, patch);
}

/* ── Расписание / услуги / отчёт / настройки — пока МОК ──────
   TODO(backend): добавить эндпоинты и переключить на api, как заявки. */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let SERVICES: ServiceItem[] = NAIL_SERVICES.map((s) => ({
  id: s.id, label: s.label, price: s.price, kind: s.kind, active: true,
}));
let BOOKING_FEE = 500;
let SETTINGS: MasterSettings = { notifications: true, reminders: true, autoApprove: false };

// ── Расписание — реальный /api ────────────────────────────────
const DAY_LABEL: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};
interface ServerScheduleDay { day: string; working: boolean; slots: string[]; }

function toScheduleDay(d: ServerScheduleDay): ScheduleDay {
  return { key: d.day, label: DAY_LABEL[d.day] || d.day, working: d.working, slots: d.slots || [] };
}

/** Стандартный набор времён (для выпадающего списка при правке заявки мастером). */
export function allSlots(): string[] {
  return ['09:00', '10:00', '11:00', '11:30', '12:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00', '18:00', '19:00'];
}

/** Доступность на дату: слоты расписания минус занятые. */
export async function getDaySlots(date: string): Promise<{ slots: string[]; taken: string[] }> {
  return api.get<{ slots: string[]; taken: string[] }>(`/api/slots?date=${encodeURIComponent(date)}`);
}

/** Открытые даты в диапазоне (для подсветки календаря). */
export async function getOpenDates(from: string, to: string): Promise<string[]> {
  return api.get<string[]>(`/api/open-dates?from=${from}&to=${to}`);
}

/** Сохранить расписание на месяц (год, месяц 1–12, список {day,slots}). */
export async function saveMonthSchedule(
  year: number,
  month: number,
  entries: { day: number; slots: string[] }[]
): Promise<{ saved: number }> {
  return api.post<{ saved: number }>('/api/admin/schedule/month', { year, month, entries });
}

export async function getSchedule(): Promise<ScheduleDay[]> {
  const rows = await api.get<ServerScheduleDay[]>('/api/schedule');
  return rows.map(toScheduleDay);
}
export async function toggleWorkingDay(key: string): Promise<void> {
  const cur = await getSchedule();
  const day = cur.find((d) => d.key === key);
  await api.post('/api/admin/schedule/day', { day: key, working: !day?.working });
}
export async function addSlot(key: string, time: string): Promise<void> {
  await api.post('/api/admin/schedule/slot', { day: key, time, action: 'add' });
}
export async function removeSlot(key: string, time: string): Promise<void> {
  await api.post('/api/admin/schedule/slot', { day: key, time, action: 'remove' });
}

export async function getServices(): Promise<{ services: ServiceItem[]; bookingFee: number }> {
  await delay(200); return { services: SERVICES.map((s) => ({ ...s })), bookingFee: BOOKING_FEE };
}
export async function setServicePrice(id: string, price: number): Promise<void> {
  await delay(100); SERVICES = SERVICES.map((s) => (s.id === id ? { ...s, price } : s));
}
export async function toggleServiceActive(id: string): Promise<void> {
  await delay(100); SERVICES = SERVICES.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
}
export async function addServiceItem(kind: 'main' | 'addon', label: string, price: number): Promise<void> {
  await delay(150); SERVICES = [...SERVICES, { id: `svc_${Date.now()}`, label, price, kind, active: true }];
}
export async function removeServiceItem(id: string): Promise<void> {
  await delay(100); SERVICES = SERVICES.filter((s) => s.id !== id);
}
export async function setBookingFee(fee: number): Promise<void> {
  await delay(100); BOOKING_FEE = fee;
}

export async function getReport(period: ReportPeriod): Promise<{
  revenue: number; visits: number; avg: number; popular: { label: string; count: number }[];
}> {
  const r = await api.get<{ revenue: number; visits: number; avg: number; popular: { label: string; count: number }[] }>(
    `/api/admin/report?period=${period}`
  );
  // Если за период ещё нет записей — показываем базовый список услуг с нулями.
  const popular = r.popular.length
    ? r.popular
    : [
        { label: 'Комбинированный маникюр', count: 0 },
        { label: 'Гелевое покрытие с укреплением', count: 0 },
        { label: 'Наращивание (1–3 длина)', count: 0 },
      ];
  return { revenue: r.revenue, visits: r.visits, avg: r.avg, popular };
}

/** Отправить клиенту сообщение от мастера (придёт пушем в Telegram). */
export async function sendClientMessage(requestId: string, text: string): Promise<void> {
  await api.post(`/api/admin/requests/${requestId}/message`, { text });
}

export async function getSettings(): Promise<MasterSettings> {
  await delay(150); return { ...SETTINGS };
}
export async function toggleSetting(key: keyof MasterSettings): Promise<void> {
  await delay(100); SETTINGS = { ...SETTINGS, [key]: !SETTINGS[key] };
}
