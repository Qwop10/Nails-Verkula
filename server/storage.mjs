/**
 * server/storage.mjs
 * Файловое хранилище для изображений (эскизы, чеки).
 * Картинки приходят как data URL, сохраняются файлами, в БД — короткий путь
 * /uploads/<name>. На Railway путь = смонтированный Volume (STORAGE_DIR=/data/uploads),
 * локально — ./.data/uploads. Абстракция: при желании заменить на S3/R2 — только этот файл.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import crypto from 'node:crypto';

const STORAGE_DIR =
  process.env.STORAGE_DIR ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? '/data/uploads'
    : join(process.cwd(), '.data', 'uploads'));

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function getStorageDir() {
  return STORAGE_DIR;
}

export async function initStorage() {
  await mkdir(STORAGE_DIR, { recursive: true });
  console.log('[storage] dir:', STORAGE_DIR);
}

export function isDataUrl(s) {
  return typeof s === 'string' && s.startsWith('data:');
}

/**
 * Сохраняет data URL в файл, возвращает публичный путь /uploads/<name>.
 * Не-data-URL (пусто или уже путь/ссылка) возвращает как есть.
 */
export async function saveDataUrl(dataUrl, prefix = 'img') {
  if (!isDataUrl(dataUrl)) return dataUrl || '';
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return '';
  const ext = EXT[m[1]] || 'jpg';
  const name = `${prefix}_${Date.now()}_${crypto
    .randomBytes(4)
    .toString('hex')}.${ext}`;
  try {
    await writeFile(join(STORAGE_DIR, name), Buffer.from(m[2], 'base64'));
    return `/uploads/${name}`;
  } catch (e) {
    console.warn('[storage] write failed:', e.message);
    return ''; // не валим заявку из-за картинки
  }
}
