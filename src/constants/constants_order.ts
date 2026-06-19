/**
 * constants/order.ts
 * Константы для заказов
 */

import type { TattooPlacement, ServiceType } from '../types';

// Единый источник лейблов статусов/услуг — общий с бэкендом (shared/domain.js)
export { SERVICE_LABELS, ORDER_STATUS_LABELS } from '../../shared/domain.js';

// ============================================================================
// SERVICES
// ============================================================================

export const SERVICE_OPTIONS: {
  id: ServiceType;
  label: string;
  desc: string;
  icon: string;
  free?: boolean;
}[] = [
  { id: 'tattoo', label: 'Запись на тату', desc: 'Анкета · мастер оценит стоимость', icon: 'needle' },
  { id: 'coverup', label: 'Перекрытие', desc: 'Перекрыть старую тату', icon: 'layers' },
  { id: 'correction', label: 'Коррекция', desc: 'Обновить или поправить тату', icon: 'edit' },
  { id: 'consultation', label: 'Консультация', desc: 'Задать вопрос мастеру', icon: 'chat', free: true },
];

// ============================================================================
// PLACEMENT OPTIONS
// ============================================================================

export const PLACEMENT_OPTIONS: Record<TattooPlacement, string> = {
  arm: 'Рука',
  forearm: 'Предплечье',
  shoulder: 'Плечо',
  hand: 'Кисть',
  leg: 'Нога',
  thigh: 'Бедро',
  calf: 'Икра',
  back: 'Спина',
  chest: 'Грудь',
  neck: 'Шея',
  ribs: 'Рёбра',
  other: 'Другое',
};

export const PLACEMENT_KEYS = Object.keys(PLACEMENT_OPTIONS) as TattooPlacement[];

// ============================================================================
// HEALTH CONTRAINDICATIONS
// ============================================================================

export const CONTRAINDICATION_OPTIONS = [
  'Беременность',
  'Сахарный диабет',
  'Проблемы со свёртываемостью крови',
  'Кожные заболевания',
  'Аллергии',
  'Приём сильнодействующих препаратов',
  'Нет противопоказаний',
] as const;

// ORDER_STATUS_LABELS — см. ре-экспорт из shared/domain.js в начале файла.

// ============================================================================
// ORDER STATUS COLORS
// ============================================================================

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  awaiting_price: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  price_set: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  payment_pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};
