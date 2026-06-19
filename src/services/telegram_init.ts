/**
 * services/telegram/init.ts
 * Инициализация Telegram WebApp
 */

import { getTelegramWebApp, isTelegramWebApp } from '../utils';

type TelegramWebAppAPI = any; // TODO: Добавить правильные типы

let tg: TelegramWebAppAPI | null = null;
let isInitialized = false;

/**
 * Инициализирует Telegram WebApp
 * Должна вызваться один раз при загрузке приложения
 */
export function initTelegram(): void {
  if (!isTelegramWebApp()) {
    console.warn('[Telegram] WebApp API is not available');
    return;
  }

  tg = getTelegramWebApp();

  if (!tg) {
    console.error('[Telegram] Failed to initialize Telegram WebApp');
    return;
  }

  try {
    // Сигнал о готовности приложения
    tg.ready();

    // Развернуть на полный экран
    tg.expand();

    isInitialized = true;
    console.log('[Telegram] Initialized successfully');
  } catch (error) {
    console.error('[Telegram] Initialization failed:', error);
  }
}

/**
 * Получает инициализированный Telegram WebApp API
 */
export function getTgApp(): TelegramWebAppAPI | null {
  return tg;
}

/**
 * Проверяет, инициализирован ли Telegram WebApp
 */
export function isTgInitialized(): boolean {
  return isInitialized && tg !== null;
}
