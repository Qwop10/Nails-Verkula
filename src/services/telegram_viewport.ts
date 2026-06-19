/**
 * services/telegram/viewport.ts
 * Управление Telegram viewport
 */

import { getTgApp } from './telegram_init';

/**
 * Получает высоту viewport
 */
export function getViewportHeight(): number {
  const tg = getTgApp();
  if (!tg) return window.innerHeight;
  return tg.viewportHeight || window.innerHeight;
}

/**
 * Получает стабильную высоту viewport (когда клавиатура скрыта)
 */
export function getViewportStableHeight(): number {
  const tg = getTgApp();
  if (!tg) return window.innerHeight;
  return tg.viewportStableHeight || window.innerHeight;
}

/**
 * Проверяет, развёрнуто ли приложение
 */
export function isExpanded(): boolean {
  const tg = getTgApp();
  if (!tg) return false;
  return tg.isExpanded || false;
}

/**
 * Разворачивает приложение на полный экран
 */
export function expand(): void {
  const tg = getTgApp();
  if (!tg?.expand) return;

  try {
    tg.expand();
  } catch (error) {
    console.error('[Telegram] Failed to expand:', error);
  }
}

/**
 * Закрывает приложение
 */
export function closeApp(): void {
  const tg = getTgApp();
  if (!tg?.close) return;

  try {
    tg.close();
  } catch (error) {
    console.error('[Telegram] Failed to close app:', error);
  }
}
