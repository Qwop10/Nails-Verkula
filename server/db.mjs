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
  // Флаги отправленных напоминаний (за 24 часа и за 2 часа до записи).
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS reminded BOOLEAN NOT NULL DEFAULT false;`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS reminded2h BOOLEAN NOT NULL DEFAULT false;`);
  // Фото-референсы клиента (пути /uploads/...), до 3 шт.
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb;`);

  // Чат: переписка клиента и мастера.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id          SERIAL PRIMARY KEY,
      client_id   TEXT NOT NULL,
      sender      TEXT NOT NULL,            -- 'client' | 'master'
      text        TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_client ON messages(client_id);`);

  // Расписание мастера: один ряд на день недели.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedule (
      day      TEXT PRIMARY KEY,            -- 'mon'..'sun'
      working  BOOLEAN NOT NULL DEFAULT true,
      slots    JSONB   NOT NULL DEFAULT '[]'::jsonb
    );
  `);
  // Засев по умолчанию (только если таблица пустая).
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM schedule`);
  if (rows[0].c === 0) {
    const work = ['10:00', '11:00', '12:00', '13:00'];
    const def = [
      ['mon', true,  work],
      ['tue', true,  work],
      ['wed', true,  work],
      ['thu', true,  work],
      ['fri', true,  work],
      ['sat', false, []],
      ['sun', false, []],
    ];
    for (const [day, working, slots] of def) {
      await pool.query(
        `INSERT INTO schedule (day, working, slots) VALUES ($1,$2,$3::jsonb)`,
        [day, working, JSON.stringify(slots)]
      );
    }
  }
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
    photos: r.photos || [],
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

/** Профиль клиента по Telegram id (имя/телефон) — для автозаполнения. */
export async function getClient(id) {
  const { rows } = await pool.query(`SELECT id, name, phone FROM clients WHERE id = $1`, [String(id)]);
  const r = rows[0];
  return r ? { id: r.id, name: r.name || '', phone: r.phone || '' } : null;
}

// ── Чат ───────────────────────────────────────────────────────
function rowToMessage(r) {
  return { id: r.id, clientId: r.client_id, sender: r.sender, text: r.text, createdAt: r.created_at };
}

export async function addMessage(clientId, sender, text) {
  const { rows } = await pool.query(
    `INSERT INTO messages (client_id, sender, text) VALUES ($1,$2,$3) RETURNING *`,
    [String(clientId), sender, text]
  );
  return rowToMessage(rows[0]);
}

export async function getMessages(clientId) {
  const { rows } = await pool.query(
    `SELECT * FROM messages WHERE client_id = $1 ORDER BY created_at ASC`,
    [String(clientId)]
  );
  return rows.map(rowToMessage);
}

/** Автоочистка: удалить сообщения старше N дней. Возвращает число удалённых. */
export async function deleteOldMessages(days = 30) {
  const { rowCount } = await pool.query(
    `DELETE FROM messages WHERE created_at < now() - ($1 * interval '1 day')`,
    [days]
  );
  return rowCount;
}

/** Список диалогов для мастера: клиент + последнее сообщение. */
export async function getConversations() {
  const { rows } = await pool.query(`
    SELECT m.client_id, c.name, c.phone, m.text AS last_text, m.created_at AS last_at, m.sender AS last_sender
      FROM messages m
      JOIN (SELECT client_id, MAX(created_at) AS mx FROM messages GROUP BY client_id) t
        ON t.client_id = m.client_id AND t.mx = m.created_at
      LEFT JOIN clients c ON c.id = m.client_id
     ORDER BY m.created_at DESC
  `);
  return rows.map((r) => ({
    clientId: r.client_id,
    name: r.name || 'Клиент',
    phone: r.phone || '',
    lastText: r.last_text,
    lastAt: r.last_at,
    lastSender: r.last_sender,
  }));
}

// ── Напоминания ───────────────────────────────────────────────
/** Подтверждённые будущие записи + флаги отправленных напоминаний. */
export async function getConfirmedForReminders() {
  const { rows } = await pool.query(
    `SELECT * FROM requests WHERE status = 'confirmed' AND req_date IS NOT NULL`
  );
  return rows.map((r) => ({ ...rowToRequest(r), reminded: r.reminded, reminded2h: r.reminded2h }));
}

export async function markReminded(id) {
  await pool.query(`UPDATE requests SET reminded = true WHERE id = $1`, [id]);
}

export async function markReminded2h(id) {
  await pool.query(`UPDATE requests SET reminded2h = true WHERE id = $1`, [id]);
}

// ── Расписание ────────────────────────────────────────────────
const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // Date.getDay() → ключ

export async function getSchedule() {
  const { rows } = await pool.query(`SELECT day, working, slots FROM schedule`);
  const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return rows
    .map((r) => ({ day: r.day, working: r.working, slots: r.slots || [] }))
    .sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
}

export async function setDayWorking(day, working) {
  await pool.query(`UPDATE schedule SET working = $2 WHERE day = $1`, [day, !!working]);
}

export async function addScheduleSlot(day, time) {
  await pool.query(
    `UPDATE schedule
        SET slots = (SELECT to_jsonb(array(
              SELECT DISTINCT t FROM jsonb_array_elements_text(slots || to_jsonb($2::text)) AS t ORDER BY t)))
      WHERE day = $1`,
    [day, time]
  );
}

export async function removeScheduleSlot(day, time) {
  await pool.query(
    `UPDATE schedule
        SET slots = (SELECT to_jsonb(array(
              SELECT t FROM jsonb_array_elements_text(slots) AS t WHERE t <> $2 ORDER BY t)))
      WHERE day = $1`,
    [day, time]
  );
}

/** Отчёт за период: выручка/визиты/средний чек/популярные услуги.
 *  Считаются подтверждённые записи (оплаченная бронь) по дате визита. */
export async function getReport(period) {
  const days = { day: 1, week: 7, month: 30, year: 365 }[period] || 7;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const startIso = start.toISOString().slice(0, 10);

  const { rows: agg } = await pool.query(
    `SELECT COALESCE(SUM(total),0)::int AS revenue, COUNT(*)::int AS visits
       FROM requests
      WHERE status = 'confirmed' AND req_date >= $1`,
    [startIso]
  );
  const revenue = agg[0].revenue;
  const visits = agg[0].visits;

  const { rows: pop } = await pool.query(
    `SELECT main_id, COUNT(*)::int AS count
       FROM requests
      WHERE status = 'confirmed' AND req_date >= $1 AND main_id IS NOT NULL
      GROUP BY main_id ORDER BY count DESC LIMIT 5`,
    [startIso]
  );

  return {
    revenue,
    visits,
    avg: visits ? Math.round(revenue / visits) : 0,
    popular: pop.map((p) => ({ mainId: p.main_id, count: p.count })),
  };
}

/** Доступные слоты на конкретную дату (с учётом расписания и уже занятых). */
export async function getDayAvailability(dateIso) {
  const dow = DOW_KEYS[new Date(dateIso + 'T00:00:00').getDay()];
  const { rows } = await pool.query(`SELECT working, slots FROM schedule WHERE day = $1`, [dow]);
  const row = rows[0];
  if (!row || !row.working) return { slots: [], taken: [] };
  const slots = row.slots || [];
  const { rows: taken } = await pool.query(
    `SELECT req_time FROM requests
      WHERE req_date = $1 AND status = ANY($2) AND req_time IS NOT NULL`,
    [dateIso, ['pending_review', 'payment_pending', 'confirmed']]
  );
  return { slots, taken: taken.map((t) => t.req_time) };
}

// ── Заявки ────────────────────────────────────────────────────
/** Занят ли слот (есть активная заявка на эту дату и время). */
export async function isSlotTaken(date, time) {
  const { rows } = await pool.query(
    `SELECT 1 FROM requests
      WHERE req_date = $1 AND req_time = $2
        AND status = ANY($3) LIMIT 1`,
    [date, time, ['pending_review', 'payment_pending', 'confirmed']]
  );
  return rows.length > 0;
}

export async function createRequest(o) {
  const total = nailTotal(o.mainId, o.addonIds || []);
  const { rows } = await pool.query(
    `INSERT INTO requests
       (id, client_id, client_name, client_phone, main_id, addon_ids,
        req_date, req_time, wishes, total, booking_fee, status, photos)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,'pending_review',$12::jsonb)
     RETURNING *`,
    [
      o.id, String(o.clientId), o.clientName || '', o.clientPhone || '',
      o.mainId || null, JSON.stringify(o.addonIds || []),
      o.date || null, o.time || null, o.wishes || '', total, o.bookingFee ?? 500,
      JSON.stringify(o.photos || []),
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
