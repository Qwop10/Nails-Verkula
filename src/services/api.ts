/**
 * services/api.ts
 * Тонкий клиент REST API. Шлёт Telegram initData в заголовке для авторизации.
 * Сервер отвечает { success, data } | { success:false, error }.
 * База — относительная (тот же origin, что отдаёт фронт). Можно переопределить VITE_API_BASE.
 */
const BASE = import.meta.env.VITE_API_BASE || '';

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  const initData = tg?.initData || '';
  if (initData) h['X-Telegram-Init-Data'] = initData;
  // Локальная разработка без Telegram: dev-id (сервер примет только без BOT_TOKEN).
  if (import.meta.env.DEV && !initData) {
    const uid = new URLSearchParams(window.location.search).get('uid') || '628854840';
    h['X-Dev-User-Id'] = uid;
  }
  return h;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: { success?: boolean; data?: T; error?: string; message?: string } = {};
  try { json = await res.json(); } catch { /* пустой ответ */ }
  if (!res.ok || json.success === false) {
    const err = new Error(json.message || json.error || `HTTP ${res.status}`);
    (err as Error & { code?: string }).code = json.error;
    throw err;
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
};

/** Открыть внешнюю ссылку (для редиректа на оплату ЮKassa). */
export function openExternal(url: string): void {
  const tg = (window as unknown as { Telegram?: { WebApp?: { openLink?: (u: string) => void } } }).Telegram?.WebApp;
  if (tg?.openLink) tg.openLink(url);
  else window.location.href = url;
}
