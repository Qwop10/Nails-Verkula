/**
 * server/lib.mjs
 * Сквозные хелперы и middleware (auth, форматтеры, роли).
 */
import { verifyInitData, hasBotToken } from './telegram.mjs';

export const MASTER_IDS = (process.env.MASTER_TELEGRAM_IDS || '628854840')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const isMaster = (id) => MASTER_IDS.includes(String(id));

export const newId = () =>
  `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const ok = (res, data) => res.json({ success: true, data });

export const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const fmtPrice = (p) =>
  p ? `${p.amount.toLocaleString('ru-RU')} ₽` : '';

export const fmtSlot = (iso) => {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/** Авторизация по Telegram initData (заголовок X-Telegram-Init-Data). */
export function auth(req, res, next) {
  const initData = req.get('X-Telegram-Init-Data') || '';
  let user = verifyInitData(initData);

  // Dev-режим без токена: принимаем id из заголовка для локального теста
  if (!user && !hasBotToken()) {
    const devId = req.get('X-Dev-User-Id');
    if (devId) user = { id: Number(devId) || devId, first_name: 'Dev' };
  }

  if (!user || !user.id) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
  req.user = user;
  next();
}

export function requireMaster(req, res, next) {
  if (!isMaster(req.user.id)) {
    return res.status(403).json({ success: false, error: 'forbidden' });
  }
  next();
}
