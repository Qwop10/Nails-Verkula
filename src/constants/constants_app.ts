/**
 * constants/app.ts
 * Основные константы приложения
 */

import { BRAND } from '../config/brand';

// ============================================================================
// APP INFO
// ============================================================================

export const APP_NAME = `${BRAND.name} ${BRAND.tagline}`;
export const APP_VERSION = '1.0.0';

// ============================================================================
// ACCESS / ROLES
// ============================================================================

/**
 * Telegram id админов из config/brand.ts. Только они видят кабинет мастера.
 * ВАЖНО: фронтовая проверка для UX; реальная авторизация — на backend (initData).
 */
export const MASTER_TELEGRAM_IDS: number[] = [...BRAND.masterTelegramIds];

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const LEGAL_AGE = 18;
export const MIN_AGE = 1;
export const MAX_AGE = 120;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const TOAST_AUTO_CLOSE_DURATION = 3000; // ms
export const ANIMATION_DURATION = 300; // ms

export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================================================
// API CONSTANTS
// ============================================================================

export const API_TIMEOUT = 30000; // ms
export const NETWORK_DELAY = 500; // ms (для mock)

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  FORM_STATE: 'tattoo_form_state',
  TELEGRAM_USER: 'telegram_user_data',
  APP_THEME: 'app_theme',
  USER_ROLE: 'user_role',
} as const;

// ============================================================================
// FORM STEPS
// ============================================================================

export const FORM_STEPS = [
  'sketch',
  'placement',
  'size',
  'age',
  'health',
  'experience',
  'wishes',
] as const;

export const TOTAL_FORM_STEPS = FORM_STEPS.length;
