/**
 * shared/domain.js
 * Единый источник домена для фронта И бэка (статусы, услуги, лейблы).
 * Плейн-ESM, чтобы импортировался и из Vite/TS, и из Node (.mjs) без сборки.
 */

export const SERVICES = ['tattoo', 'coverup', 'correction', 'consultation'];

export const SERVICE_LABELS = {
  tattoo: 'Запись на тату',
  coverup: 'Перекрытие',
  correction: 'Коррекция',
  consultation: 'Консультация',
};

export const ORDER_STATUSES = [
  'pending',
  'awaiting_price',
  'price_set',
  'payment_pending',
  'confirmed',
  'rejected',
  'cancelled',
];

export const ORDER_STATUS_LABELS = {
  pending: 'Ожидает',
  awaiting_price: 'Запрашивает уточнение',
  price_set: 'Согласовано',
  payment_pending: 'Ожидание оплаты',
  confirmed: 'Подтверждено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
};

/** Терминальные статусы (можно удалять, не считаются активными). */
export const TERMINAL_STATUSES = ['rejected', 'cancelled', 'confirmed'];

/** Активная заявка = не отклонена и не отменена (учитывается в лимите). */
export function isActiveStatus(status) {
  return status !== 'rejected' && status !== 'cancelled';
}

/* ============================================================
   NAILS VERKULA — модель «заявка на рассмотрение».
   Серверу нужен общий источник цен/лейблов/статусов.
   ============================================================ */

export const NAIL_SERVICES = [
  { id: 'combo', label: 'Комбинированный маникюр', price: 1500, kind: 'main' },
  { id: 'gel', label: 'Гелевое покрытие с укреплением', price: 3500, kind: 'main' },
  { id: 'ext_1_3', label: 'Наращивание (1–3 длина)', price: 4000, kind: 'main' },
  { id: 'ext_4_6', label: 'Наращивание (4–6 длина)', price: 4500, kind: 'main' },
  { id: 'design', label: 'Дизайн', price: 300, kind: 'addon' },
  { id: 'gellak', label: 'Покрытие гель-лаком', price: 300, kind: 'addon' },
  { id: 'removal', label: 'Снятие чужой работы', price: 300, kind: 'addon' },
  { id: 'repair', label: 'Ремонт / поднятие / коррекция', price: null, kind: 'auto' },
];

const NAIL_MAP = Object.fromEntries(NAIL_SERVICES.map((s) => [s.id, s]));

export function nailServiceLabel(id) {
  return NAIL_MAP[id]?.label || id;
}

export function nailServiceLabels(mainId, addonIds = []) {
  return [
    mainId ? NAIL_MAP[mainId]?.label : null,
    ...addonIds.map((i) => NAIL_MAP[i]?.label),
  ].filter(Boolean);
}

export function nailTotal(mainId, addonIds = []) {
  let s = 0;
  if (mainId && NAIL_MAP[mainId]) s += NAIL_MAP[mainId].price || 0;
  for (const id of addonIds) s += NAIL_MAP[id]?.price || 0;
  return s;
}

export const REQUEST_STATUS_LABELS = {
  pending_review: 'На рассмотрении',
  payment_pending: 'Ожидает оплаты',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  rejected: 'Отклонена',
  withdrawn: 'Отозвана',
  cancelled: 'Отменена',
};

/** Терминальные (не активные, не учитываются в лимите 3). */
export const REQUEST_TERMINAL = ['completed', 'rejected', 'withdrawn', 'cancelled'];
