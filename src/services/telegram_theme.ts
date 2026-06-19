/**
 * services/telegram/theme.ts
 * Управление темой Telegram
 */

import { getTgApp } from './telegram_init';
import { ACTIVE_THEME } from '../config/theme.config';

/**
 * Получает текущую тему (light/dark)
 */
export function getTelegramTheme(): 'light' | 'dark' {
  const tg = getTgApp();
  if (!tg) return 'light';
  return tg.colorScheme || 'light';
}

/**
 * Получает параметры темы Telegram
 */
export function getTelegramThemeParams(): Record<string, string> {
  const tg = getTgApp();
  if (!tg) return {};
  return tg.themeParams || {};
}

/**
 * Применяет Telegram тему к приложению
 */
export function applyTelegramTheme(): void {
  const theme = getTelegramTheme();
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Применяем цвета из themeParams
  const params = getTelegramThemeParams();
  if (params.bg_color) {
    root.style.setProperty('--telegram-bg-color', params.bg_color);
  }
  if (params.text_color) {
    root.style.setProperty('--telegram-text-color', params.text_color);
  }
}

/**
 * Красит шапку и фон Telegram под бренд (серый), чтобы не было чёрной полосы.
 */
export function setTelegramBrandColors(): void {
  const tg = getTgApp() as unknown as {
    setHeaderColor?: (c: string) => void;
    setBackgroundColor?: (c: string) => void;
  } | null;
  if (!tg) return;
  const pageColor = ACTIVE_THEME.colors.page;
  try {
    tg.setHeaderColor?.(pageColor);
    tg.setBackgroundColor?.(pageColor);
  } catch {
    // старые версии Telegram — игнорируем
  }
}

/**
 * React hook для применения Telegram темы
 */
import { useEffect } from 'react';

export function useTelegramTheme(): void {
  useEffect(() => {
    applyTelegramTheme();
    setTelegramBrandColors();

    // Переприменяем тему при изменении viewport
    const handleResize = () => {
      applyTelegramTheme();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}
