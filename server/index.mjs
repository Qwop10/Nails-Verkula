/**
 * server/index.mjs
 * Express: фронтенд + REST API под модель Nails «заявка на рассмотрение».
 * Цикл: создать → (мастер) одобрить/правка/отклонить → оплата брони → подтверждение.
 * Оплата — через провайдер (ЮKassa / demo). Авторизация — Telegram initData.
 */
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { nailServiceLabels, nailServiceLabel } from '../shared/domain.js';
import { initStorage, getStorageDir, saveDataUrl } from './storage.mjs';
import {
  sendMessage,
  sendPhoto,
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
app.use(express.json({ limit: '8mb' })); // с запасом под фото-референсы (data URL)

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
  // Памятка и противопоказания — картинками (с текстовым фолбэком).
  if (!(await sendPhoto(r.clientId, `${APP_URL}/photo/memo.jpg`, '📋 Памятка клиенту'))) {
    await sendMessage(r.clientId, MEMO_TEXT);
  }
  if (!(await sendPhoto(r.clientId, `${APP_URL}/photo/contraindications.jpg`, '⚠️ Основания для отказа в процедуре'))) {
    await sendMessage(r.clientId, CONTRA_TEXT);
  }
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

// Профиль клиента (сохранённые имя/телефон) — для автозаполнения формы.
app.get('/api/profile', auth, async (req, res) => {
  try {
    const c = await db.getClient(req.user.id);
    ok(res, c || { id: String(req.user.id), name: '', phone: '' });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// ── Чат: клиент ───────────────────────────────────────────────
app.get('/api/messages', auth, async (req, res) => {
  try { ok(res, await db.getMessages(req.user.id)); }
  catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

app.post('/api/messages', auth, async (req, res) => {
  try {
    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ success: false, error: 'empty' });
    const clientId = String(req.user.id);
    const msg = await db.addMessage(clientId, 'client', text);
    // сохраним имя клиента, если есть
    const name = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ');
    if (name) await db.upsertClient({ id: clientId, name, phone: '' });
    // пуш мастеру
    const who = escapeHtml(name || 'Клиент');
    for (const mid of MASTER_IDS) {
      sendMessage(mid, `💬 <b>Сообщение от клиента</b> ${who}:\n${escapeHtml(text)}`,
        { reply_markup: { inline_keyboard: [[{ text: 'Открыть чат', web_app: { url: APP_URL } }]] } }).catch(() => {});
    }
    ok(res, msg);
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Расписание (для клиента — какие дни/слоты доступны).
app.get('/api/schedule', auth, async (_req, res) => {
  try { ok(res, await db.getSchedule()); }
  catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Доступные слоты на конкретную дату (?date=YYYY-MM-DD).
app.get('/api/slots', auth, async (req, res) => {
  try {
    const date = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ success: false, error: 'bad_date' });
    ok(res, await db.getDayAvailability(date));
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Управление расписанием (мастер).
app.post('/api/admin/schedule/day', auth, requireMaster, async (req, res) => {
  try {
    await db.setDayWorking(req.body?.day, !!req.body?.working);
    ok(res, await db.getSchedule());
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

app.post('/api/admin/schedule/slot', auth, requireMaster, async (req, res) => {
  try {
    const { day, time, action } = req.body || {};
    if (!day || !/^\d{2}:\d{2}$/.test(time || '')) return res.status(400).json({ success: false, error: 'bad_input' });
    if (action === 'remove') await db.removeScheduleSlot(day, time);
    else await db.addScheduleSlot(day, time);
    ok(res, await db.getSchedule());
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

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
    // Защита от двойной записи: слот уже занят другой активной заявкой.
    if (await db.isSlotTaken(b.date, b.time)) {
      return res.status(409).json({ success: false, error: 'slot_taken', message: 'Это время только что заняли. Выберите другое.' });
    }
    const clientName = (b.clientName || [req.user.first_name, req.user.last_name].filter(Boolean).join(' ')).trim();
    const clientPhone = (b.clientPhone || '').trim();
    if (!clientName || !clientPhone) {
      return res.status(400).json({ success: false, error: 'no_contact' });
    }

    // Фото-референсы (data URL) → сохраняем файлами, максимум 3.
    const rawPhotos = Array.isArray(b.photos) ? b.photos.slice(0, 3) : [];
    const photos = [];
    for (const p of rawPhotos) {
      const path = await saveDataUrl(p, 'ref');
      if (path) photos.push(path);
    }

    const r = await db.createRequest({
      id: newId(), clientId, clientName, clientPhone,
      mainId, addonIds, wishes: b.wishes || '', date: b.date, time: b.time, bookingFee: BOOKING_FEE,
      photos,
    });
    await db.upsertClient({ id: clientId, name: clientName, phone: clientPhone });

    const mention = `<a href="tg://user?id=${clientId}">${escapeHtml(clientName)}</a>`;
    const note =
      `🆕 <b>Новая заявка</b>\n${mention}\n${prettyDate(r.date)} · ${r.time} · ${labelsOf(r)}` +
      (r.wishes ? `\n«${escapeHtml(r.wishes)}»` : '') +
      (photos.length ? `\n📷 фото: ${photos.length}` : '') +
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

    // Автоматический возврат брони, если отмена вовремя и бронь была оплачена.
    let refunded = false;
    if (refundable && r.bookingPaid && r.paymentId) {
      try {
        const result = await getPaymentProvider().refund({ paymentId: r.paymentId, amount: r.bookingFee });
        refunded = result.status === 'succeeded' || result.status === 'pending';
      } catch (e) {
        console.error('refund error:', e.message);
        // Возврат не прошёл автоматически — уведомим мастера сделать вручную.
      }
    }

    for (const mid of MASTER_IDS) {
      const tail = r.bookingPaid
        ? refunded
          ? ' · бронь возвращена автоматически ✅'
          : refundable
          ? ' · ⚠️ возврат не прошёл — вернуть вручную'
          : ' · бронь не возвращается (отмена поздно)'
        : '';
      sendMessage(mid, `❌ Отмена записи: ${escapeHtml(r.clientName)} · ${prettyDate(r.date)} ${r.time}${tail}`);
    }
    // Клиенту — подтверждение возврата.
    if (refunded) {
      sendMessage(r.clientId, `↩️ Запись отменена. Бронь ${fmtRu(r.bookingFee)} возвращается на карту в течение нескольких дней.`);
    }

    ok(res, { ...updated, refunded });
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

// Отчёт за период (день/неделя/месяц/год).
app.get('/api/admin/report', auth, requireMaster, async (req, res) => {
  try {
    const period = ['day', 'week', 'month', 'year'].includes(req.query.period) ? req.query.period : 'week';
    const r = await db.getReport(period);
    ok(res, {
      revenue: r.revenue,
      visits: r.visits,
      avg: r.avg,
      popular: r.popular.map((p) => ({ label: nailServiceLabel(p.mainId), count: p.count })),
    });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// Сообщение клиенту от мастера (приходит пушем в Telegram).
app.post('/api/admin/requests/:id/message', auth, requireMaster, async (req, res) => {
  try {
    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ success: false, error: 'empty' });
    const r = await db.getRequest(req.params.id);
    if (!r) return res.status(404).json({ success: false, error: 'not_found' });
    await db.addMessage(r.clientId, 'master', text);
    const sent = await sendMessage(r.clientId, `💬 <b>Сообщение от мастера</b>\n${escapeHtml(text)}\n\n<i>Ответьте на это сообщение здесь, в чате.</i>`);
    ok(res, { sent });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

// ── Чат: мастер ───────────────────────────────────────────────
app.get('/api/admin/conversations', auth, requireMaster, async (_req, res) => {
  try { ok(res, await db.getConversations()); }
  catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

app.get('/api/admin/messages', auth, requireMaster, async (req, res) => {
  try {
    const clientId = String(req.query.clientId || '');
    if (!clientId) return res.status(400).json({ success: false, error: 'no_client' });
    ok(res, await db.getMessages(clientId));
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
});

app.post('/api/admin/messages', auth, requireMaster, async (req, res) => {
  try {
    const clientId = String(req.body?.clientId || '');
    const text = (req.body?.text || '').trim();
    if (!clientId || !text) return res.status(400).json({ success: false, error: 'bad_input' });
    const msg = await db.addMessage(clientId, 'master', text);
    await sendMessage(clientId, `💬 <b>Сообщение от мастера</b>\n${escapeHtml(text)}\n\n<i>Ответьте здесь или в приложении.</i>`);
    ok(res, msg);
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'server_error' }); }
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
    const caption =
      `✅ <b>Заявка одобрена</b>\n${prettyDate(r.date)} · ${r.time} · ${labelsOf(r)}\n` +
      `К оплате бронь ${fmtRu(r.bookingFee)}. Откройте приложение, чтобы оплатить 👇`;
    const keyboard = { reply_markup: { inline_keyboard: [[{ text: '💳 Оплатить бронь', web_app: { url: APP_URL } }]] } };
    // С картинкой; если фото не отправилось — обычным текстом.
    const photoOk = await sendPhoto(r.clientId, `${APP_URL}/photo/approved.jpg`, caption, keyboard);
    if (!photoOk) await sendMessage(r.clientId, caption, keyboard);
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
    const rejectText = `К сожалению, мастер не может принять вашу заявку.`;
    const photoOk = await sendPhoto(r.clientId, `${APP_URL}/photo/rejected.jpg`, rejectText);
    if (!photoOk) await sendMessage(r.clientId, rejectText);
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
  const fromId = msg?.from?.id;
  if (!msg?.chat?.id || !text) return;

  if (/^\/start(@\w+)?$/.test(text)) {
    sendWelcome(msg.chat.id).catch(() => {});
    return;
  }
  // Любое другое сообщение от клиента (не мастера) → сохраняем в чат + пуш мастеру.
  if (fromId && !isMaster(fromId)) {
    const who = msg.from.first_name || msg.from.username || fromId;
    const tag = msg.from.username ? ` (@${msg.from.username})` : '';
    db.addMessage(fromId, 'client', text).catch(() => {});
    for (const mid of MASTER_IDS) {
      sendMessage(mid, `💬 <b>Ответ клиента</b> ${escapeHtml(String(who))}${escapeHtml(tag)}:\n${escapeHtml(text)}`,
        { reply_markup: { inline_keyboard: [[{ text: 'Открыть чат', web_app: { url: APP_URL } }]] } }).catch(() => {});
    }
  }
});

// ============================ REMINDERS ============================
// Раз в 15 минут шлём напоминание клиентам, у кого запись в ближайшие 24 часа.
async function runReminders() {
  try {
    const rows = await db.getConfirmedForReminders();
    const now = Date.now();
    for (const r of rows) {
      const appt = new Date(`${r.date}T${r.time || '00:00'}:00`).getTime();
      const hoursLeft = (appt - now) / 3_600_000;
      if (hoursLeft <= 0) continue;

      // За 24 часа.
      if (!r.reminded && hoursLeft <= 24) {
        const sent = await sendMessage(
          r.clientId,
          `🔔 <b>Напоминание о записи</b>\n🗓 ${prettyDate(r.date)} · ${r.time} · ${labelsOf(r)}\nЖдём вас в Nails Verkula 💅`
        );
        if (sent) await db.markReminded(r.id);
      }
      // За 2 часа.
      if (!r.reminded2h && hoursLeft <= 2) {
        const sent = await sendMessage(
          r.clientId,
          `⏰ <b>Скоро запись!</b>\nЧерез ~2 часа: ${r.time} · ${labelsOf(r)}\nДо встречи в Nails Verkula 💅`
        );
        if (sent) await db.markReminded2h(r.id);
      }
    }
  } catch (e) {
    console.warn('[reminders] error:', e.message);
  }
}

// Автоочистка истории чата: сообщения старше N дней удаляются.
const CHAT_RETENTION_DAYS = Number(process.env.CHAT_RETENTION_DAYS) || 30;
async function cleanupChat() {
  try {
    const n = await db.deleteOldMessages(CHAT_RETENTION_DAYS);
    if (n) console.log(`[chat] удалено старых сообщений: ${n}`);
  } catch (e) {
    console.warn('[chat] cleanup error:', e.message);
  }
}

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
      // Планировщик напоминаний: сразу и далее каждые 15 минут.
      runReminders();
      setInterval(runReminders, 15 * 60 * 1000);
      // Автоочистка чата: сразу и далее каждые 6 часов.
      cleanupChat();
      setInterval(cleanupChat, 6 * 60 * 60 * 1000);
    });
  })
  .catch((e) => {
    console.error('DB init failed:', e);
    app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on 0.0.0.0:${PORT} (DB ERROR)`));
  });
