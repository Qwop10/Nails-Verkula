/**
 * server/telegram.mjs
 * Проверка Telegram initData (авторизация) и отправка сообщений ботом.
 */
import crypto from 'node:crypto';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const PUBLIC_DOMAIN =
  process.env.RAILWAY_PUBLIC_DOMAIN ||
  'nails-verkula-production.up.railway.app';
export const APP_URL = `https://${PUBLIC_DOMAIN}`;

// Секрет для проверки входящих webhook-запросов от Telegram
export const WEBHOOK_SECRET = BOT_TOKEN
  ? crypto.createHash('sha256').update(BOT_TOKEN).digest('hex').slice(0, 40)
  : 'dev-secret';

/**
 * Проверяет подпись initData от Telegram WebApp.
 * Возвращает объект пользователя { id, first_name, username, ... } или null.
 * Алгоритм: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData) {
  if (!initData) return null;

  // Локальная разработка без токена — доверяем dev-режиму
  if (!BOT_TOKEN) {
    try {
      const params = new URLSearchParams(initData);
      const userRaw = params.get('user');
      return userRaw ? JSON.parse(userRaw) : null;
    } catch {
      return null;
    }
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    const computed = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computed !== hash) return null;

    const userRaw = params.get('user');
    return userRaw ? JSON.parse(userRaw) : null;
  } catch {
    return null;
  }
}

/**
 * Отправляет текстовое сообщение пользователю/в чат.
 * Возвращает true при успехе. Ошибки не бросает (для рассылки).
 */
export async function sendMessage(chatId, text, extra = {}) {
  if (!BOT_TOKEN) {
    console.warn('[telegram] BOT_TOKEN не задан — сообщение не отправлено');
    return false;
  }
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...extra,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn('[telegram] sendMessage failed:', data.description);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[telegram] sendMessage error:', e.message);
    return false;
  }
}

/**
 * Приветственное сообщение при /start — с кнопкой открытия мини-аппа.
 */
export async function sendWelcome(chatId) {
  const text =
    '<b>Nails Verkula — студия маникюра</b>\n\n' +
    'Запишитесь за пару минут:\n' +
    '• выберите услуги\n' +
    '• выберите удобные дату и время\n' +
    '• отправьте заявку\n\n' +
    'Мастер рассмотрит заявку, при необходимости уточнит детали и пришлёт ссылку на оплату брони.\n\n' +
    'Нажмите кнопку ниже, чтобы открыть запись 👇';
  return sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [[{ text: '💅 Записаться', web_app: { url: APP_URL } }]],
    },
  });
}

/**
 * Регистрирует webhook у Telegram (чтобы получать /start и др. сообщения).
 */
export async function setWebhook() {
  if (!BOT_TOKEN) return false;
  const url = `${APP_URL}/api/tg/webhook`;
  try {
    const res = await fetch(`${API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ['message'],
        drop_pending_updates: false,
      }),
    });
    const data = await res.json();
    console.log(
      '[telegram] setWebhook:',
      data.ok ? `ok -> ${url}` : data.description
    );
    return !!data.ok;
  } catch (e) {
    console.warn('[telegram] setWebhook error:', e.message);
    return false;
  }
}

export const hasBotToken = () => !!BOT_TOKEN;
