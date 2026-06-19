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
  bookingPaid: boolean; masterNote?: string;
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

let SCHEDULE: ScheduleDay[] = [
  { key: 'mon', label: 'Пн', working: true, slots: ['10:00', '12:00'] },
  { key: 'tue', label: 'Вт', working: true, slots: ['10:00', '12:00'] },
  { key: 'wed', label: 'Ср', working: true, slots: ['10:00', '12:00'] },
  { key: 'thu', label: 'Чт', working: true, slots: ['10:00', '14:00'] },
  { key: 'fri', label: 'Пт', working: true, slots: ['10:00', '12:00', '15:30'] },
  { key: 'sat', label: 'Сб', working: false, slots: [] },
  { key: 'sun', label: 'Вс', working: false, slots: [] },
];
let SERVICES: ServiceItem[] = NAIL_SERVICES.map((s) => ({
  id: s.id, label: s.label, price: s.price, kind: s.kind, active: true,
}));
let BOOKING_FEE = 500;
let SETTINGS: MasterSettings = { notifications: true, reminders: true, autoApprove: false };

export function allSlots(): string[] {
  return [...new Set(SCHEDULE.flatMap((d) => d.slots))].sort();
}

export async function getSchedule(): Promise<ScheduleDay[]> {
  await delay(200); return SCHEDULE.map((d) => ({ ...d, slots: [...d.slots] }));
}
export async function toggleWorkingDay(key: string): Promise<void> {
  await delay(100); SCHEDULE = SCHEDULE.map((d) => (d.key === key ? { ...d, working: !d.working } : d));
}
export async function addSlot(key: string, time: string): Promise<void> {
  await delay(100);
  SCHEDULE = SCHEDULE.map((d) => (d.key === key && !d.slots.includes(time) ? { ...d, slots: [...d.slots, time].sort() } : d));
}
export async function removeSlot(key: string, time: string): Promise<void> {
  await delay(100); SCHEDULE = SCHEDULE.map((d) => (d.key === key ? { ...d, slots: d.slots.filter((s) => s !== time) } : d));
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
  await delay(250);
  const mult = { day: 1, week: 5, month: 20, year: 230 }[period];
  const visits = mult;
  const revenue = mult * 2400;
  return {
    revenue, visits, avg: visits ? Math.round(revenue / visits) : 0,
    popular: [
      { label: 'Комбинированный маникюр', count: Math.round(mult * 0.5) },
      { label: 'Гелевое покрытие', count: Math.round(mult * 0.3) },
      { label: 'Наращивание', count: Math.round(mult * 0.2) },
    ],
  };
}

export async function getSettings(): Promise<MasterSettings> {
  await delay(150); return { ...SETTINGS };
}
export async function toggleSetting(key: keyof MasterSettings): Promise<void> {
  await delay(100); SETTINGS = { ...SETTINGS, [key]: !SETTINGS[key] };
}
