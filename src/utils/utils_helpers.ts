/**
 * utils/helpers.ts
 * Вспомогательные функции общего назначения
 */

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Генерирует уникальный ID
 */
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// DELAY & ASYNC
// ============================================================================

/**
 * Имитирует сетевую задержку (для mock API)
 */
export const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Отменяет обещание через определённое время
 */
export const timeoutPromise = <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Promise timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
};

// ============================================================================
// TELEGRAM DETECTION
// ============================================================================

/**
 * Проверяет, доступен ли Telegram WebApp API
 */
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp;
};

/**
 * Получает Telegram WebApp API
 */
export const getTelegramWebApp = () => {
  if (!isTelegramWebApp()) {
    return null;
  }
  return (window as any).Telegram.WebApp;
};

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Глубокое слияние объектов
 */
export const deepMerge = <T extends object>(target: T, source: Partial<T>): T => {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue as object, sourceValue) as any;
      } else {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
};

/**
 * Удаляет пустые значения из объекта
 */
export const removeEmpty = <T extends object>(obj: T): Partial<T> => {
  const result: Partial<T> = {};

  for (const key in obj) {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
  }

  return result;
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Группирует массив элементов по ключу
 */
export const groupBy = <T extends object, K extends keyof T>(
  array: T[],
  key: K
): Map<T[K], T[]> => {
  const map = new Map<T[K], T[]>();

  for (const item of array) {
    const itemKey = item[key];
    if (!map.has(itemKey)) {
      map.set(itemKey, []);
    }
    map.get(itemKey)!.push(item);
  }

  return map;
};

/**
 * Уникальные элементы массива
 */
export const unique = <T>(array: T[], by?: (item: T) => any): T[] => {
  if (!by) {
    return Array.from(new Set(array));
  }

  const seen = new Set();
  return array.filter((item) => {
    const key = by(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

// ============================================================================
// CLASS NAME UTILITIES
// ============================================================================

/**
 * Условно объединяет класс CSS имена
 * classNames('px-4', condition && 'py-2')
 */
export const classNames = (
  ...classes: (string | undefined | false | null)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

// ============================================================================
// CLIPBOARD
// ============================================================================

/**
 * Копирует текст в буфер обмена
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
