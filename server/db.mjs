/**
 * server/db.mjs
 * PostgreSQL: пул, схема и запросы под модель Nails «заявка на рассмотрение».
 */
import pg from 'pg';
import { nailTotal, REQUEST_TERMINAL } from '../shared/domain.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

/** Создаёт таблицы, если их ещё нет. */
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id          TEXT PRIMARY KEY,
      name        TEXT,
      phone       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id            TEXT PRIMARY KEY,
      client_id     TEXT NOT NULL,
      client_name   TEXT,
      client_phone  TEXT,
      main_id       TEXT,
      addon_ids     JSONB NOT NULL DEFAULT '[]'::jsonb,
      req_date      DATE,
      req_time      TEXT,
      wishes        TEXT,
      total         INTEGER NOT NULL DEFAULT 0,
      booking_fee   INTEGER NOT NULL DEFAULT 500,
      status        TEXT NOT NULL DEFAULT 'pending_review',
      master_note   TEXT,
      booking_paid  BOOLEAN NOT NULL DEFAULT false,
      payment_id    TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_requests_client ON requests(client_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);`);
}

function rowToRequest(r) {
  if (!r) return null;
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name || '',
    clientPhone: r.client_phone || '',
    mainId: r.main_id || null,
    addonIds: r.addon_ids || [],
    date: r.req_date ? new Date(r.req_date).toISOString().slice(0, 10) : null,
    time: r.req_time || null,
    wishes: r.wishes || '',
    total: r.total,
    bookingFee: r.booking_fee,
    status: r.status,
    masterNote: r.master_note || undefined,
    bookingPaid: r.booking_paid,
    paymentId: r.payment_id || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Клиенты ───────────────────────────────────────────────────
export async function upsertClient({ id, name, phone }) {
  await pool.query(
    `INSERT INTO clients (id, name, phone) VALUES ($1,$2,$3)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone`,
    [String(id), name || null, phone || null]
  );
}

export async function getAllClientIds() {
  const { rows } = await pool.query(`SELECT id FROM clients`);
  return rows.map((r) => r.id);
}

// ── Заявки ────────────────────────────────────────────────────
export async function createRequest(o) {
  const total = nailTotal(o.mainId, o.addonIds || []);
  const { rows } = await pool.query(
    `INSERT INTO requests
       (id, client_id, client_name, client_phone, main_id, addon_ids,
        req_date, req_time, wishes, total, booking_fee, status)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,'pending_review')
     RETURNING *`,
    [
      o.id, String(o.clientId), o.clientName || '', o.clientPhone || '',
      o.mainId || null, JSON.stringify(o.addonIds || []),
      o.date || null, o.time || null, o.wishes || '', total, o.bookingFee ?? 500,
    ]
  );
  return rowToRequest(rows[0]);
}

export async function getRequest(id) {
  const { rows } = await pool.query(`SELECT * FROM requests WHERE id = $1`, [id]);
  return rowToRequest(rows[0]);
}

export async function getClientRequests(clientId) {
  const { rows } = await pool.query(
    `SELECT * FROM requests WHERE client_id = $1 ORDER BY created_at DESC`,
    [String(clientId)]
  );
  return rows.map(rowToRequest);
}

export async function countActiveClientRequests(clientId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM requests
     WHERE client_id = $1 AND status <> ALL($2)`,
    [String(clientId), REQUEST_TERMINAL]
  );
  return rows[0].c;
}

export async function getAllRequests() {
  const { rows } = await pool.query(`SELECT * FROM requests ORDER BY created_at DESC`);
  return rows.map(rowToRequest);
}

/** Смена статуса с опциональной проверкой текущего (для безопасных переходов). */
export async function setStatus(id, status, fromStatuses = null) {
  const params = [id, status];
  let where = `id = $1`;
  if (fromStatuses) {
    params.push(fromStatuses);
    where += ` AND status = ANY($3)`;
  }
  const { rows } = await pool.query(
    `UPDATE requests SET status = $2, updated_at = now() WHERE ${where} RETURNING *`,
    params
  );
  return rowToRequest(rows[0]);
}

/** Мастер правит состав/время → пересчёт суммы → ожидает оплаты. */
export async function updateRequest(id, { mainId, addonIds, time, masterNote }) {
  const total = nailTotal(mainId, addonIds || []);
  const { rows } = await pool.query(
    `UPDATE requests
       SET main_id = $2, addon_ids = $3::jsonb, req_time = COALESCE($4, req_time),
           total = $5, master_note = $6, status = 'payment_pending', updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, mainId || null, JSON.stringify(addonIds || []), time || null, total, masterNote || null]
  );
  return rowToRequest(rows[0]);
}

/** Отметка оплаты брони → подтверждено. */
export async function markBookingPaid(id, paymentId) {
  const { rows } = await pool.query(
    `UPDATE requests SET booking_paid = true, payment_id = $2,
       status = 'confirmed', updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, paymentId || null]
  );
  return rowToRequest(rows[0]);
}

export async function deleteRequest(id) {
  await pool.query(`DELETE FROM requests WHERE id = $1`, [id]);
}
