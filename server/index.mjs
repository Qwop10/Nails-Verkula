/**
 * server/index.mjs
 * Express: фронтенд + REST API под модель Nails «заявка на рассмотрение».
 * Цикл: создать → (мастер) одобрить/правка/отклонить → оплата брони → подтверждение.
 * Оплата — через провайдер (ЮKassa / demo). Авторизация — Telegram initData.
 */
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { nailServiceLabels } from '../shared/domain.js';
import { initStorage, getStorageDir } from './storage.mjs';
import {
  sendMessage,
  hasBotToken,
  sendWelcome,
  setWebhook,
  WEBHOOK_SECRET,
  APP_URL,
} from './telegram.mjs';
import * as db from './db.mjs';
import { MASTER_IDS, isMaster, newId, ok, escapeHtml, auth, requireMaster } from './lib.mjs';
import { STUDIO_ADDRESS, MEMO_TEXT, CONTRA_TEXT } from './content.mjs';
import { getPaymentProvider, PAYMENTS_ENABLED } from './payments/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 3000;
const BOOKING_FEE = Number(process.env.BOOKING_FEE) || 500;
const REFUND_HOURS = 24;

const app = express();
app.use(express.json({ limit: '1mb' }));

const labelsOf = (r) => nailServiceLabels(r.mainId, r.addonIds).join(' + ') || 'услуга';
const fmtRu = (n) => `${Number(n).toLocaleString('ru-RU')} ₽`;
const prettyDate = (iso) => (iso ? iso.split('-').reverse().join('.') : '—');

/** Уведомить клиента о подтверждении + памятка + адрес. */
async function notifyConfirmed(r) {
  const address = STUDIO_ADDRESS
    ? `\n📍 Адрес: ${STUDIO_ADDRESS}`
    : `\n📍 Адрес мастер пришлёт отдельно.`;
  await sendMessage(
    r.clientId,
    `✅ <b>Запись подтверждена!</b>\n🗓 ${prettyDate(r.date)} · ${r.time}\n${labelsOf(r)}` +
      `\nБронь оплачена: ${fmtRu(r.bookingFee)} · Остаток на месте: ${fmtRu(r.total - r.bookingFee)}` +
      `${address}\n\nНапоминание придёт за 24 часа. Спасибо!`
  );
  await sendMessage(r.clientId, MEMO_TEXT);
  await sendMessage(r.clientId, CONTRA_TEXT);
}

// ---- Health ----
app.get('/api/health', async (_req, res) => {
  let dbOk = false;
  try { await db.pool.query('SELECT 1'); dbOk = true; } catch { dbOk = false; }
  res.json({ ok: true, bot: hasBotToken(), db: dbOk, payments: PAYMENTS_ENABLED });
});

app.get('/api/me', auth, (req, res) =>
  ok(res, { id: req.user.id, isMaster: isMaster(req.user.id) })
);

// ============================ CLIENT ============================

// Создать заявку
app.post('/api/requests', auth, async (req, res) => {
  try {
    const clientId = String(req.user.id);
    if ((await db.countActiveClientRequests(clientId)) >= 3) {
      return res.status(409).json({ success: false, error: 'limit', message: 'Лимит: максимум 3 активные заявки' });
    }
    const b = req.body || {};
    const mainId = b.mainId || null;
    const addonIds = Array.isArray(b.addonIds) ? b.addonIds.filter((x) => typeof x === 'string') : [];
    if (!mainId && addonIds.length === 0) {
      return res.status(400).json({ success: false, error: 'no_services' });
    }
    if (!b.date || !b.time) {
      return res.status(400).json({ success: false, error: 'no_datetime' });
    }
    const clientName = (b.clientName || [req.user.first_name, req.user.last_name].filter(Boolean).join(' ')).trim();
    const clientPhone = (b.clientPhone || '').trim();
    if (!clientName || !clientPhone) {
      return res.status(400).json({ success: false, error: 'no_contact' });
    }

    const r = await db.createRequest({
      id: newId(), clientId, clientName, clientPhone,
      mainId, addonIds, wishes: b.wishes || '', date: b.date, time: b.time, bookingFee: BOOKING_FEE,
    });
    await db.upsertClient({ id: clientId, name: clientName, phone: clientPhone });

    const mention = `<a href="tg://user?id=${clientId}">${escapeHtml(clientName)}</a>`;
    const note =
      `🆕 <b>Новая заявка</b>\n${mention}\n${prettyDate(r.date)} · ${r.time} · ${labelsOf(r)}` +
      (r.wishes ? `\n«${escapeHtml(r.wishes)}»` : '') +
      `\nИтого: ${fmtRu(r.total)} · ${escapeHtml(clientPhone)}`;
    for (const mid of MASTER_IDS) sendMessage(mid, note);

    ok(res, r);
  } catch (e) {
    console.error('create request error:', e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

app.get('/api/requests/mine', auth, async (req, res) => {
  try { ok(res, await db.getClientRequests(String(req.user.id))); }
  catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

app.get('/api/requests/active-count', auth, async (req, res) => {
  try { ok(res, { count: await db.countActiveClientRequests(String(req.user.id)) }); }
  catch (e) { res.status(500).json({ success: false, error: 'server_error' }); }
});

app.get('/api/requests/:id', auth, async (req, res) => {
  try {
    const r = await db.getRequest(req.params.id);
    if (!r) return res.status(404).json({ success: false, error: 'not_found' });
    if (String(r.clientId) !== String(req.user.id) && !isMaster(req.user.id)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    ok(res, r);
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Отозвать (до одобрения)
app.post('/api/requests/:id/withdraw', auth, async (req, res) => {
  try {
    const r = await db.getRequest(req.params.id);
    if (!r) return res.status(404).json({ success: false, error: 'not_found' });
    if (String(r.clientId) !== String(req.user.id)) return res.status(403).json({ success: false, error: 'forbidden' });
    const updated = await db.setStatus(req.params.id, 'withdrawn', ['pending_review']);
    if (!updated) return res.status(409).json({ success: false, error: 'bad_status' });
    for (const mid of MASTER_IDS) sendMessage(mid, `↩️ Клиент отозвал заявку: ${escapeHtml(r.clientName)}`);
    ok(res, updated);
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Отменить запись (правило возврата 24 ч)
app.post('/api/requests/:id/cancel', auth, async (req, res) => {
  try {
    const r = await db.getRequest(req.params.id);
    if (!r) return res.status(404).json({ success: false, error: 'not_found' });
    if (String(r.clientId) !== String(req.user.id)) return res.status(403).json({ success: false, error: 'forbidden' });

    const appt = new Date(`${r.date}T${r.time || '00:00'}:00`);
    const hoursLeft = (appt.getTime() - Date.now()) / 3_600_000;
    const refundable = hoursLeft >= REFUND_HOURS;

    const updated = await db.setStatus(req.params.id, 'cancelled');
    // TODO(ЮKassa): при refundable && bookingPaid — вызвать возврат платежа (refunds API).
    for (const mid of MASTER_IDS) {
      sendMessage(mid, `❌ Отмена записи: ${escapeHtml(r.clientName)} · ${prettyDate(r.date)} ${r.time}` +
        (r.bookingPaid ? (refundable ? ' · бронь к возврату' : ' · бронь не возвращается') : ''));
    }
    ok(res, { ...updated, refunded: refundable && r.bookingPaid });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Оплата брони (после одобрения)
app.post('/api/requests/:id/pay-booking', auth, async (req, res) => {
  try {
    const r = await db.getRequest(req.params.id);
    if (!r) return res.status(404).json({ success: false, error: 'not_found' });
    if (String(r.clientId) !== String(req.user.id)) return res.status(403).json({ success: false, error: 'forbidden' });
    if (r.status !== 'payment_pending') return res.status(409).json({ success: false, error: 'bad_status' });

    const provider = getPaymentProvider();
    const payment = await provider.createBookingPayment({
      amount: r.bookingFee, requestId: r.id,
      description: `Бронь · ${labelsOf(r)}`, returnUrl: APP_URL,
    });

    // demo/мгновенный успех → подтверждаем сразу. Реальный ЮKassa → ждём вебхук.
    if (payment.status === 'succeeded') {
      const updated = await db.markBookingPaid(r.id, payment.id);
      await notifyConfirmed(updated);
      return ok(res, { status: 'succeeded', confirmationUrl: null, request: updated });
    }
    ok(res, { status: payment.status, confirmationUrl: payment.confirmationUrl });
  } catch (e) {
    console.error('pay-booking error:', e);
    res.status(500).json({ success: false, error: 'payment_error' });
  }
});

// ============================ MASTER ============================

app.get('/api/admin/requests', auth, requireMaster, async (_req, res) => {
  try { ok(res, await db.getAllRequests()); }
  catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

app.get('/api/admin/stats', auth, requireMaster, async (_req, res) => {
  try {
    const all = await db.getAllRequests();
    const today = all.filter((r) => r.status === 'confirmed').length;
    const pending = all.filter((r) => r.status === 'pending_review').length;
    const revenue = all.filter((r) => r.bookingPaid).reduce((s, r) => s + r.total, 0);
    ok(res, { today, pending, revenue });
  } catch (e) { res.status(500).json({ success: false, error: 'server_error' }); }
});

// Одобрить → ожидает оплаты
app.post('/api/admin/requests/:id/approve', auth, requireMaster, async (req, res) => {
  try {
    const r = await db.setStatus(req.params.id, 'payment_pending', ['pending_review']);
    if (!r) return res.status(409).json({ success: false, error: 'bad_status' });
    await sendMessage(
      r.clientId,
      `✅ <b>Заявка одобрена</b>\n${prettyDate(r.date)} · ${r.time} · ${labelsOf(r)}\n` +
        `К оплате бронь ${fmtRu(r.bookingFee)}. Откройте приложение, чтобы оплатить 👇`,
      { reply_markup: { inline_keyboard: [[{ text: '💳 Оплатить бронь', web_app: { url: APP_URL } }]] } }
    );
    ok(res, r);
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Правка (состав/время) → ожидает оплаты
app.patch('/api/admin/requests/:id', auth, requireMaster, async (req, res) => {
  try {
    const b = req.body || {};
    const addonIds = Array.isArray(b.addonIds) ? b.addonIds.filter((x) => typeof x === 'string') : [];
    const r = await db.updateRequest(req.params.id, {
      mainId: b.mainId || null, addonIds, time: b.time, masterNote: b.masterNote || 'Уточнено мастером',
    });
    if (!r) return res.status(404).json({ success: false, error: 'not_found' });
    await sendMessage(
      r.clientId,
      `✏️ <b>Мастер уточнил заявку</b>\n${prettyDate(r.date)} · ${r.time} · ${labelsOf(r)}\n` +
        `Новая сумма: ${fmtRu(r.total)}. К оплате бронь ${fmtRu(r.bookingFee)} 👇`,
      { reply_markup: { inline_keyboard: [[{ text: '💳 Оплатить бронь', web_app: { url: APP_URL } }]] } }
    );
    ok(res, r);
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Отклонить
app.post('/api/admin/requests/:id/reject', auth, requireMaster, async (req, res) => {
  try {
    const r = await db.setStatus(req.params.id, 'rejected', ['pending_review', 'payment_pending']);
    if (!r) return res.status(409).json({ success: false, error: 'bad_status' });
    await sendMessage(r.clientId, `К сожалению, мастер не может принять эту заявку. Попробуйте выбрать другое время.`);
    ok(res, r);
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Рассылка
app.post('/api/broadcast', auth, requireMaster, async (req, res) => {
  try {
    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ success: false, error: 'empty' });
    const ids = await db.getAllClientIds();
    let sent = 0;
    for (const id of ids) if (await sendMessage(id, `📢 ${text}`)) sent++;
    ok(res, { total: ids.length, sent });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// ============================ PAYMENTS WEBHOOK ============================
// ЮKassa шлёт уведомления об оплате. TODO: проверка источника (IP allowlist ЮKassa).
app.post('/api/payments/webhook', async (req, res) => {
  res.sendStatus(200); // отвечаем сразу
  try {
    const info = getPaymentProvider().parseWebhook(req.body);
    if (info?.event === 'payment.succeeded' && info.requestId) {
      const r = await db.getRequest(info.requestId);
      if (r && !r.bookingPaid) {
        const updated = await db.markBookingPaid(info.requestId, info.paymentId);
        await notifyConfirmed(updated);
      }
    }
  } catch (e) {
    console.warn('[payments] webhook error:', e.message);
  }
});

// ============================ TELEGRAM WEBHOOK ============================
app.post('/api/tg/webhook', (req, res) => {
  if (req.get('X-Telegram-Bot-Api-Secret-Token') !== WEBHOOK_SECRET) return res.sendStatus(401);
  res.sendStatus(200);
  const msg = req.body?.message;
  const text = typeof msg?.text === 'string' ? msg.text.trim() : '';
  if (msg?.chat?.id && /^\/start(@\w+)?$/.test(text)) sendWelcome(msg.chat.id).catch(() => {});
});

// ============================ STATIC ============================
app.use('/uploads', express.static(getStorageDir(), { maxAge: '365d', immutable: true }));
app.use(express.static(DIST));
app.get('*', (_req, res) => res.sendFile(join(DIST, 'index.html')));

// ============================ START ============================
Promise.all([db.initSchema(), initStorage()])
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on 0.0.0.0:${PORT} (bot: ${hasBotToken()}, payments: ${PAYMENTS_ENABLED})`);
      setWebhook();
    });
  })
  .catch((e) => {
    console.error('DB init failed:', e);
    app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on 0.0.0.0:${PORT} (DB ERROR)`));
  });
