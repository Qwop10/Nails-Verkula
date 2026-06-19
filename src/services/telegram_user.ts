/**
 * services/telegram/user.ts
 * Управление Telegram пользователем
 */

import type { TelegramUser, TelegramWebAppInitData } from '../types';
import { getTgApp } from './telegram_init';

/**
 * Получает данные пользователя из Telegram
 */
export function getTelegramUser(): TelegramUser | null {
  const tg = getTgApp();
  if (!tg) return null;

  const initData = tg.initDataUnsafe as TelegramWebAppInitData;
  return initData.user || null;
}

/**
 * Получает Raw init data (для проверки на backend)
 * TODO Backend: Проверить подпись HMAC-SHA256
 */
export function getTelegramInitData(): string {
  const tg = getTgApp();
  if (!tg) return '';
  return tg.initData || '';
}

/**
 * Получает параметры, переданные боту
 */
export function getTelegramStartParam(): string | undefined {
  const tg = getTgApp();
  if (!tg) return undefined;

  const initData = tg.initDataUnsafe as TelegramWebAppInitData;
  return initData.startParam;
}

/**
 * Проверяет, доступны ли данные пользователя
 */
export function hasUserData(): boolean {
  return getTelegramUser() !== null;
}

const CLIENT_ID_KEY = 'lali_client_id';

/**
 * Возвращает стабильный идентификатор клиента.
 * В Telegram — на основе user.id, иначе — сохранённый в localStorage.
 * Нужен, чтобы показывать «Мои заявки» и считать лимит.
 */
export function getClientId(): string {
  const user = getTelegramUser();
  if (user?.id) {
    return `client_tg_${user.id}`;
  }

  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
