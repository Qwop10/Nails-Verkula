/**
 * config/services.config.ts
 * ★ Каталог услуг Nails Verkula + модель заявки (статусы).
 * Двухуровневый выбор: основная (0–1) + дополнительные (0–many).
 * Минимум — хотя бы одна услуга любого типа.
 */

export type ServiceKind = 'main' | 'addon' | 'auto';

export interface NailService {
  id: string;
  label: string;
  /** Цена в рублях. Для kind: 'auto' — null (входит в стоимость). */
  price: number | null;
  kind: ServiceKind;
  /** Короткое примечание (напр. «входит в стоимость»). */
  note?: string;
}

export const NAIL_SERVICES: NailService[] = [
  // Основные — выбрать одну
  { id: 'combo', label: 'Комбинированный маникюр', price: 1500, kind: 'main' },
  { id: 'gel', label: 'Гелевое покрытие с укреплением', price: 3500, kind: 'main' },
  { id: 'ext_1_3', label: 'Наращивание (1–3 длина)', price: 4000, kind: 'main' },
  { id: 'ext_4_6', label: 'Наращивание (4–6 длина)', price: 4500, kind: 'main' },

  // Дополнительные — можно несколько
  { id: 'design', label: 'Дизайн', price: 300, kind: 'addon' },
  { id: 'gellak', label: 'Покрытие гель-лаком', price: 300, kind: 'addon' },
  { id: 'removal', label: 'Снятие чужой работы', price: 300, kind: 'addon' },

  // Авто — входит в стоимость, не выбирается вручную
  { id: 'repair', label: 'Ремонт / поднятие / коррекция', price: null, kind: 'auto', note: 'входит в стоимость' },
];

export const MAIN_SERVICES = NAIL_SERVICES.filter((s) => s.kind === 'main');
export const ADDON_SERVICES = NAIL_SERVICES.filter((s) => s.kind === 'addon');
export const AUTO_SERVICES = NAIL_SERVICES.filter((s) => s.kind === 'auto');

export function getService(id: string): NailService | undefined {
  return NAIL_SERVICES.find((s) => s.id === id);
}

/** Сумма выбранных услуг (main id + список addon id). */
export function calcTotal(mainId: string | null, addonIds: string[]): number {
  let sum = 0;
  if (mainId) sum += getService(mainId)?.price ?? 0;
  for (const id of addonIds) sum += getService(id)?.price ?? 0;
  return sum;
}

/* ============================================================
   Модель заявки: статусы потока «на рассмотрении».
   ============================================================ */
export type RequestStatus =
  | 'pending_review' // отправлена, ждёт мастера
  | 'payment_pending' // одобрена, ждёт оплаты брони
  | 'confirmed' // бронь оплачена → запись подтверждена
  | 'completed' // услуга оказана
  | 'rejected' // мастер отклонил
  | 'withdrawn' // клиент отозвал (до одобрения)
  | 'cancelled'; // отменена после подтверждения

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending_review: 'На рассмотрении',
  payment_pending: 'Ожидает оплаты',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  rejected: 'Отклонена',
  withdrawn: 'Отозвана',
  cancelled: 'Отменена',
};

/** Активные (учитываются в лимите 3): всё, кроме терминальных. */
export const TERMINAL_STATUSES: RequestStatus[] = ['completed', 'rejected', 'withdrawn', 'cancelled'];

export function isActiveRequest(status: RequestStatus): boolean {
  return !TERMINAL_STATUSES.includes(status);
}

/** Лимит активных заявок у клиента. */
export const MAX_ACTIVE_REQUESTS = 3;
