/**
 * server/payments/demo.mjs
 * Заглушка провайдера оплаты — когда ключи ЮKassa не заданы.
 * Платёж сразу «succeeded» (без реального списания) — для локалки/демо.
 */
import crypto from 'node:crypto';

export function createDemoProvider() {
  return {
    name: 'demo',
    enabled: false,

    async createBookingPayment({ amount, requestId }) {
      return {
        id: 'demo_' + crypto.randomBytes(4).toString('hex'),
        status: 'succeeded', // демо: считаем оплаченным сразу
        confirmationUrl: null,
        demo: true,
        amount,
        requestId,
      };
    },

    async refund({ paymentId, amount }) {
      // Демо: реального списания не было — «возвращаем» мгновенно.
      return { id: 'demo_refund', status: 'succeeded', paymentId, amount };
    },

    parseWebhook(body) {
      const obj = body?.object || {};
      return {
        paymentId: obj.id || 'demo',
        status: obj.status || 'succeeded',
        requestId: obj.metadata?.requestId ?? null,
        event: body?.event || 'payment.succeeded',
      };
    },
  };
}
