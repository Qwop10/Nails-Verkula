/**
 * shared/domain.d.ts
 * Типы для shared/domain.js (чтобы фронт на TS получал типы при импорте).
 */
export const SERVICES: readonly string[];
export const SERVICE_LABELS: Record<string, string>;
export const ORDER_STATUSES: readonly string[];
export const ORDER_STATUS_LABELS: Record<string, string>;
export const TERMINAL_STATUSES: readonly string[];
export function isActiveStatus(status: string): boolean;
