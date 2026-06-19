/**
 * server/payments/yookassa.mjs
 * Адаптер оплаты ЮKassa. Включается, когда заданы YOOKASSA_SHOP_ID и
 * YOOKASSA_SECRET_KEY. Реализует общий интерфейс провайдера оплаты.
 *
 * Создание платежа: POST https://api.yookassa.ru/v3/payments
 *   Basic-авторизация shopId:secretKey + заголовок Idempotence-Key.
 * Подтверждение: вебхук event=payment.succeeded → object.metadata.requestId.
 */
import crypto from 'node:crypto';

const API = 'https://api.yookassa.ru/v3';

export function createYooKassaProvider({ shopId, secret }) {
  const authHeader =
    'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64');

  return {
    name: 'yookassa',
    enabled: true,

    /**
     * Создаёт платёж за бронь, возвращает ссылку для оплаты (confirmation_url).
     * @returns {Promise<{id:string,status:string,confirmationUrl:string|null}>}
     */
    async createBookingPayment({ amount, requestId, description, returnUrl }) {
      const res = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Idempotence-Key': crypto.randomUUID(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: { value: Number(amount).toFixed(2), currency: 'RUB' },
          capture: true,
          confirmation: { type: 'redirect', return_url: returnUrl },
          description: description || `Бронь по заявке ${requestId}`,
          metadata: { requestId: String(requestId) },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(`yookassa: ${data?.description || res.status}`);
      }
      return {
        id: data.id,
        status: data.status, // 'pending' → редирект на confirmation_url
        confirmationUrl: data.confirmation?.confirmation_url || null,
      };
    },

    /**
     * Автоматический возврат брони (refunds API).
     * @returns {Promise<{id:string,status:string}>}
     */
    async refund({ paymentId, amount }) {
      const res = await fetch(`${API}/refunds`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Idempotence-Key': crypto.randomUUID(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: String(paymentId),
          amount: { value: Number(amount).toFixed(2), currency: 'RUB' },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`yookassa refund: ${data?.description || res.status}`);
      return { id: data.id, status: data.status };
    },

    /**
     * Разбирает входящий вебхук ЮKassa.
     * @returns {{requestId:string|null,status:string,paymentId:string}|null}
     */
    parseWebhook(body) {
      const obj = body?.object;
      if (!obj) return null;
      return {
        paymentId: obj.id,
        status: obj.status, // 'succeeded' | 'canceled' | ...
        requestId: obj.metadata?.requestId ?? null,
        event: body.event, // 'payment.succeeded' и т.п.
      };
    },
  };
}
