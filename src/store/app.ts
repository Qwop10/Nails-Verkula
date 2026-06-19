/**
 * APP STORE - Zustand store для глобального состояния приложения
 * Управляет ролью пользователя, Telegram данными, UI состоянием
 */

import { create } from 'zustand';
import { UserRole, TelegramUser } from '../types';

// ============================================================================
// TYPES
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface AppStoreState {
  // User & Auth
  userRole: UserRole | null;
  telegramUser: TelegramUser | null;
  isInitialized: boolean;

  // UI State
  toasts: Toast[];
  isLoading: boolean;
  darkMode: boolean;

  // Actions
  setUserRole: (role: UserRole) => void;
  setTelegramUser: (user: TelegramUser | null) => void;
  setInitialized: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;

  // Toasts
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number
  ) => void;
  removeToast: (id: string) => void;

  // Loading
  setLoading: (value: boolean) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useAppStore = create<AppStoreState>((set) => ({
  // Initial state
  userRole: null,
  telegramUser: null,
  isInitialized: false,
  toasts: [],
  isLoading: false,
  darkMode: false,

  // ====================================================================
  // USER & AUTH
  // ====================================================================

  setUserRole: (role: UserRole) => {
    set({ userRole: role });
  },

  setTelegramUser: (user: TelegramUser | null) => {
    set({ telegramUser: user });
  },

  setInitialized: (value: boolean) => {
    set({ isInitialized: value });
  },

  // ====================================================================
  // UI
  // ====================================================================

  setDarkMode: (value: boolean) => {
    set({ darkMode: value });
    // TODO: Применить тему в DOM
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // ====================================================================
  // TOASTS
  // ====================================================================

  showToast: (
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
  ) => {
    const id = `toast_${Date.now()}_${Math.random()}`;

    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          type,
          message,
          duration,
        },
      ],
    }));

    // Auto-remove toast после duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // ====================================================================
  // LOADING
  // ====================================================================

  setLoading: (value: boolean) => {
    set({ isLoading: value });
  },
}));

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Получает роль пользователя
 */
export const useUserRole = (): UserRole | null => {
  return useAppStore((state) => state.userRole);
};

/**
 * Проверяет, является ли пользователь мастером
 */
export const useIsMaster = (): boolean => {
  return useAppStore((state) => state.userRole === 'master');
};

/**
 * Проверяет, является ли пользователь клиентом
 */
export const useIsClient = (): boolean => {
  return useAppStore((state) => state.userRole === 'client');
};

/**
 * Получает Telegram пользователя
 */
export const useTelegramUser = (): TelegramUser | null => {
  return useAppStore((state) => state.telegramUser);
};

/**
 * Получает текущие toasts
 */
export const useToasts = (): Toast[] => {
  return useAppStore((state) => state.toasts);
};

/**
 * Получает статус инициализации
 */
export const useIsInitialized = (): boolean => {
  return useAppStore((state) => state.isInitialized);
};

/**
 * Удобная функция для показа уведомлений
 */
export const useNotification = () => {
  const showToast = useAppStore((state) => state.showToast);

  return {
    success: (message: string, duration?: number) =>
      showToast(message, 'success', duration),
    error: (message: string, duration?: number) =>
      showToast(message, 'error', duration),
    info: (message: string, duration?: number) =>
      showToast(message, 'info', duration),
    warning: (message: string, duration?: number) =>
      showToast(message, 'warning', duration),
  };
};
