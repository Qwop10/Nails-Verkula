/**
 * api/api_http.ts
 * HTTP-клиент к нашему backend. Авторизация — через Telegram initData
 * (передаём в заголовке X-Telegram-Init-Data; backend проверяет подпись).
 */
import type { ApiResponse } from '../types';

function authHeaders(): Record<string, string> {
  const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } })
    .Telegram;
  const initData = tg?.WebApp?.initData || '';
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;

  // Локальная разработка без Telegram: подставляем dev-id для теста
  if (!initData) {
    const devId = localStorage.getItem('lali_dev_user_id');
    if (devId) headers['X-Dev-User-Id'] = devId;
  }
  return headers;
}

async function parse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: { code: String(res.status), message: 'Ошибка сети' },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`/api${path}`, { headers: authHeaders() });
    return parse<T>(res);
  } catch {
    return {
      success: false,
      error: { code: 'NETWORK', message: 'Нет соединения с сервером' },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function apiPost<T>(
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body ?? {}),
    });
    return parse<T>(res);
  } catch {
    return {
      success: false,
      error: { code: 'NETWORK', message: 'Нет соединения с сервером' },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return parse<T>(res);
  } catch {
    return {
      success: false,
      error: { code: 'NETWORK', message: 'Нет соединения с сервером' },
      timestamp: new Date().toISOString(),
    };
  }
}
