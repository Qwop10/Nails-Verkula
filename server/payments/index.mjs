/**
 * server/payments/index.mjs
 * Фабрика провайдера оплаты. По умолчанию — ЮKassa (если заданы ключи),
 * иначе demo-заглушка. Чтобы подключить ЮKassa: задать в окружении
 *   YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY (см. .env.example).
 */
import { createYooKassaProvider } from './yookassa.mjs';
import { createDemoProvider } from './demo.mjs';

const SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';

export const PAYMENTS_ENABLED = !!(SHOP_ID && SECRET_KEY);

let _provider = null;

/** Возвращает активный провайдер оплаты (singleton). */
export function getPaymentProvider() {
  if (_provider) return _provider;
  _provider = PAYMENTS_ENABLED
    ? createYooKassaProvider({ shopId: SHOP_ID, secret: SECRET_KEY })
    : createDemoProvider();
  console.log(`[payments] provider: ${_provider.name}`);
  return _provider;
}
