/**
 * utils/formatting.ts
 * Функции форматирования данных для отображения
 */

import type { TattooPlacement } from '../types';

// ============================================================================
// PHONE FORMATTING
// ============================================================================

/**
 * Форматирует телефон для отображения
 * 79991234567 -> +7 (999) 123-45-67
 */
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  }

  return phone;
};

// ============================================================================
// PRICE FORMATTING
// ============================================================================

/**
 * Форматирует цену для отображения
 */
export const formatPrice = (
  amount: number,
  currency: string = 'RUB'
): string => {
  const symbol: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  };

  return `${amount.toLocaleString('ru-RU')} ${symbol[currency] || currency}`;
};

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Форматирует дату (18 июня 2024)
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Форматирует дату и время
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Форматирует слот времени сеанса (16 июня, 14:00)
 */
export const formatSlot = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/**
 * Форматирует время в прошедшем времени (2 часа назад)
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'прямо сейчас';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн назад`;

  return formatDate(date);
};

// ============================================================================
// PLACEMENT FORMATTING
// ============================================================================

/**
 * Получает русский текст для места расположения
 */
export const formatPlacement = (placement: TattooPlacement): string => {
  const placements: Record<TattooPlacement, string> = {
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

  return placements[placement] || placement;
};

// ============================================================================
// SIZE FORMATTING
// ============================================================================

/**
 * Форматирует размер татуировки (12×8 см)
 */
export const formatSize = (height: number, width: number): string => {
  return `${width}×${height} см`;
};

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Сокращает текст до определённой длины с многоточием
 */
export const truncate = (text: string, length: number = 100): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Капитализирует первый символ строки
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
