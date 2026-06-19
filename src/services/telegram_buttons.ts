/**
 * services/telegram/buttons.ts
 * Управление BackButton и MainButton
 */

import { useEffect, useRef } from 'react';
import { getTgApp } from './telegram_init';

// ============================================================================
// BACK BUTTON
// ============================================================================

let backButtonCallbacks: Set<() => void> = new Set();

/**
 * Показывает кнопку "Назад"
 */
export function showBackButton(): void {
  const tg = getTgApp();
  if (!tg?.BackButton) return;
  tg.BackButton.show();
}

/**
 * Скрывает кнопку "Назад"
 */
export function hideBackButton(): void {
  const tg = getTgApp();
  if (!tg?.BackButton) return;
  tg.BackButton.hide();
}

/**
 * Устанавливает callback на нажатие кнопки "Назад"
 */
export function onBackButton(callback: () => void): () => void {
  const tg = getTgApp();
  if (!tg?.BackButton) return () => {};

  backButtonCallbacks.add(callback);

  if (backButtonCallbacks.size === 1) {
    tg.BackButton.onClick(handleBackButtonClick);
  }

  // Возвращаем функцию для отписки
  return () => {
    backButtonCallbacks.delete(callback);
    if (backButtonCallbacks.size === 0) {
      getTgApp()?.BackButton?.offClick(handleBackButtonClick);
    }
  };
}

const handleBackButtonClick = (): void => {
  const callbacks = Array.from(backButtonCallbacks);
  if (callbacks.length > 0) {
    callbacks[callbacks.length - 1]();
  }
};

/**
 * React hook для Back Button
 */
export function useBackButton(
  callback: () => void,
  dependencies: any[] = []
): void {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    showBackButton();
    unsubscribeRef.current = onBackButton(callback);

    return () => {
      unsubscribeRef.current?.();
      hideBackButton();
    };
  }, [callback, ...dependencies]);
}

// ============================================================================
// MAIN BUTTON
// ============================================================================

/**
 * Показывает главную кнопку с текстом
 */
export function showMainButton(text: string): void {
  const tg = getTgApp();
  if (!tg?.MainButton) return;

  tg.MainButton.setText(text);
  tg.MainButton.show();
}

/**
 * Скрывает главную кнопку
 */
export function hideMainButton(): void {
  const tg = getTgApp();
  if (!tg?.MainButton) return;
  tg.MainButton.hide();
}

/**
 * Устанавливает callback на нажатие главной кнопки
 */
export function onMainButton(callback: () => void): () => void {
  const tg = getTgApp();
  if (!tg?.MainButton) return () => {};

  tg.MainButton.onClick(callback);

  return () => {
    getTgApp()?.MainButton?.offClick(callback);
  };
}

/**
 * Включает главную кнопку
 */
export function enableMainButton(): void {
  const tg = getTgApp();
  if (!tg?.MainButton) return;
  tg.MainButton.enable();
}

/**
 * Отключает главную кнопку
 */
export function disableMainButton(): void {
  const tg = getTgApp();
  if (!tg?.MainButton) return;
  tg.MainButton.disable();
}

/**
 * Показывает progress на главной кнопке
 */
export function showMainButtonProgress(): void {
  const tg = getTgApp();
  if (!tg?.MainButton) return;
  tg.MainButton.showProgress();
}

/**
 * Скрывает progress на главной кнопке
 */
export function hideMainButtonProgress(): void {
  const tg = getTgApp();
  if (!tg?.MainButton) return;
  tg.MainButton.hideProgress();
}

/**
 * React hook для Main Button
 */
export function useMainButton(
  text: string,
  callback: () => void,
  dependencies: any[] = []
): void {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    showMainButton(text);
    unsubscribeRef.current = onMainButton(callback);

    return () => {
      unsubscribeRef.current?.();
      hideMainButton();
    };
  }, [text, callback, ...dependencies]);
}
