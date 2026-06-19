/**
 * types/common.ts
 * Общие типы, используемые по всему приложению
 */

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export type UserRole = 'client' | 'master';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  telegramId?: string;
  createdAt: Date;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
  startParam?: string;
  authDate?: number;
  hash?: string;
}

// ============================================================================
// PRICE & CURRENCY TYPES
// ============================================================================

export interface Price {
  amount: number;
  currency: string; // ISO 4217 (RUB, USD, EUR)
}

// ============================================================================
// SIZE TYPES
// ============================================================================

export interface Size {
  height: number; // в см
  width: number;  // в см
}

// ============================================================================
// TOAST TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  timestamp: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface RequestState<T> {
  state: LoadingState;
  data?: T;
  error?: string;
}
