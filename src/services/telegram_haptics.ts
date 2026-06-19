/**
 * services/telegram/haptics.ts
 * Haptic Feedback (вибрация)
 */

import { getTgApp } from './telegram_init';

/**
 * Вибрация при нажатии
 */
export function impactHaptic(
  style: 'light' | 'medium' | 'heavy' = 'light'
): void {
  const tg = getTgApp();
  if (!tg?.HapticFeedback) return;

  try {
    tg.HapticFeedback.impactOccurred(style);
  } catch (error) {
    console.debug('[Telegram] Haptic feedback not available:', error);
  }
}

/**
 * Вибрация уведомления
 */
export function notificationHaptic(
  type: 'error' | 'success' | 'warning' = 'success'
): void {
  const tg = getTgApp();
  if (!tg?.HapticFeedback) return;

  try {
    tg.HapticFeedback.notificationOccurred(type);
  } catch (error) {
    console.debug('[Telegram] Haptic feedback not available:', error);
  }
}

/**
 * Вибрация при выборе
 */
export function selectionHaptic(): void {
  const tg = getTgApp();
  if (!tg?.HapticFeedback) return;

  try {
    tg.HapticFeedback.selectionChanged();
  } catch (error) {
    console.debug('[Telegram] Haptic feedback not available:', error);
  }
}
