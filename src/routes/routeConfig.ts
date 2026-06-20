/**
 * routes/routeConfig.ts
 * Конфигурация маршрутов приложения
 * Разделена на две ветви: Client и Master
 */

// ============================================================================
// CLIENT ROUTES
// ============================================================================

export const CLIENT_ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  SERVICES: '/services',
  // Nails — короткий поток
  CATALOG: '/catalog',
  DATETIME: '/datetime',
  SUBMITTED: '/submitted',
  REQUEST_DETAIL: '/requests/:id',
  CHAT: '/chat',
  CONSULT: '/consult',
  FORM_SKETCH: '/form/sketch',
  FORM_PLACEMENT: '/form/placement',
  FORM_SIZE: '/form/size',
  FORM_AGE: '/form/age',
  FORM_HEALTH: '/form/health',
  FORM_EXPERIENCE: '/form/experience',
  FORM_WISHES: '/form/wishes',
  FORM_SUCCESS: '/form/success',
  ORDER_DETAIL: '/orders/:orderId',
  ORDER_CHAT: '/orders/:orderId/chat',
  ORDER_PAYMENT: '/orders/:orderId/payment',
} as const;

// ============================================================================
// MASTER ROUTES
// ============================================================================

export const MASTER_ROUTES = {
  HOME: '/master',
  DASHBOARD: '/master/dashboard',
  ORDER_DETAIL: '/master/orders/:orderId',
  ORDER_PRICE: '/master/orders/:orderId/price',
  ORDER_CHAT: '/master/orders/:orderId/chat',
} as const;

// ============================================================================
// ROUTE CONSTANTS
// ============================================================================

export const FORM_STEPS = [
  { path: CLIENT_ROUTES.FORM_SKETCH, label: 'Эскиз', step: 0 },
  { path: CLIENT_ROUTES.FORM_PLACEMENT, label: 'Расположение', step: 1 },
  { path: CLIENT_ROUTES.FORM_SIZE, label: 'Размер', step: 2 },
  { path: CLIENT_ROUTES.FORM_AGE, label: 'Возраст', step: 3 },
  { path: CLIENT_ROUTES.FORM_HEALTH, label: 'Здоровье', step: 4 },
  { path: CLIENT_ROUTES.FORM_EXPERIENCE, label: 'Опыт', step: 5 },
  { path: CLIENT_ROUTES.FORM_WISHES, label: 'Пожелания', step: 6 },
] as const;

/**
 * Получает путь следующего шага формы
 */
export function getNextFormStepPath(currentStep: number): string | null {
  if (currentStep >= FORM_STEPS.length - 1) {
    return CLIENT_ROUTES.FORM_SUCCESS;
  }
  return FORM_STEPS[currentStep + 1]?.path || null;
}

/**
 * Получает путь предыдущего шага формы
 */
export function getPrevFormStepPath(currentStep: number): string | null {
  if (currentStep <= 0) {
    return CLIENT_ROUTES.HOME;
  }
  return FORM_STEPS[currentStep - 1]?.path || null;
}

/**
 * Получает номер шага по пути
 */
export function getStepFromPath(path: string): number {
  const step = FORM_STEPS.find((s) => s.path === path);
  return step?.step ?? -1;
}
