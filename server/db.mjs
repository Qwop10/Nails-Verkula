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
      consent_at  TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Миграция для существующих БД: добавляем колонку согласия на обработку ПД.
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ`);
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
  // Чек об оплате брони (путь /uploads/...), который клиент прислал на проверку.
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS receipt TEXT;`);
  // Нужно ли вернуть клиенту бронь (отмена вовремя / болезнь мастера).
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS refund_pending BOOLEAN NOT NULL DEFAULT false;`);

  // Простое key-value хранилище настроек студии (напр. режим «мастер заболел»).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      k  TEXT PRIMARY KEY,
      v  TEXT
    );
  `);

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
  await seedScheduleIfEmpty();

  // Расписание по конкретным датам (приоритетнее недельного шаблона).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedule_dates (
      d      DATE PRIMARY KEY,
      slots  JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `);
}

/** Создаёт дефолтное расписание, если таблица пустая. Идемпотентно. */
async function seedScheduleIfEmpty() {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM schedule`);
  if (rows[0].c > 0) return false;
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
      `INSERT INTO schedule (day, working, slots) VALUES ($1,$2,$3::jsonb)
       ON CONFLICT (day) DO NOTHING`,
      [day, working, JSON.stringify(slots)]
    );
  }
  return true;
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
    receipt: r.receipt || '',
    refundPending: !!r.refund_pending,
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

/** Профиль клиента по Telegram id (имя/телефон/согласие) — для автозаполнения. */
export async function getClient(id) {
  const { rows } = await pool.query(`SELECT id, name, phone, consent_at FROM clients WHERE id = $1`, [String(id)]);
  const r = rows[0];
  return r ? { id: r.id, name: r.name || '', phone: r.phone || '', consent: !!r.consent_at } : null;
}

/** Записать согласие клиента на обработку ПД (создаёт запись, если её ещё нет). */
export async function setConsent(id) {
  await pool.query(
    `INSERT INTO clients (id, consent_at) VALUES ($1, now())
     ON CONFLICT (id) DO UPDATE SET consent_at = COALESCE(clients.consent_at, now())`,
    [String(id)]
  );
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

/** Автоочистка: удаляет переписку клиентов, у кого нет записи на сегодня/будущее.
 *  Т.е. после того как запись прошла (req_date < сегодня) — история чата удаляется. */
export async function cleanupFinishedChats() {
  const { rowCount } = await pool.query(`
    DELETE FROM messages m
     WHERE NOT EXISTS (
       SELECT 1 FROM requests r
        WHERE r.client_id = m.client_id
          AND r.status IN ('pending_review','payment_pending','confirmed')
          AND r.req_date >= CURRENT_DATE
     )
  `);
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
  let { rows } = await pool.query(`SELECT day, working, slots FROM schedule`);
  // Самовосстановление: если расписание очистили — пересоздаём дефолт.
  if (rows.length === 0) {
    await seedScheduleIfEmpty();
    ({ rows } = await pool.query(`SELECT day, working, slots FROM schedule`));
  }
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

// ── Расписание по датам ───────────────────────────────────────
/** Есть ли вообще расписание по конкретным датам (режим «по датам» активен). */
export async function hasPerDateSchedule() {
  const { rows } = await pool.query(`SELECT 1 FROM schedule_dates LIMIT 1`);
  return rows.length > 0;
}

/** Сохранить расписание на месяц (затирает существующее в этом месяце). */
export async function setMonthSchedule(year, month, entries) {
  const mm = String(month).padStart(2, '0');
  const firstDay = `${year}-${mm}-01`;
  await pool.query(
    `DELETE FROM schedule_dates WHERE date_trunc('month', d) = date_trunc('month', $1::date)`,
    [firstDay]
  );
  let saved = 0;
  for (const e of entries) {
    const slots = Array.isArray(e.slots) ? e.slots : [];
    if (!e.day || slots.length === 0) continue;
    const dd = String(e.day).padStart(2, '0');
    const iso = `${year}-${mm}-${dd}`;
    await pool.query(
      `INSERT INTO schedule_dates (d, slots) VALUES ($1, $2::jsonb)
       ON CONFLICT (d) DO UPDATE SET slots = $2::jsonb`,
      [iso, JSON.stringify(slots)]
    );
    saved++;
  }
  return saved;
}

/** Открытые даты в диапазоне (для подсветки календаря у клиента). */
export async function getOpenDates(fromIso, toIso) {
  if (await isSick()) return []; // мастер заболел — запись закрыта
  if (await hasPerDateSchedule()) {
    const { rows } = await pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS d FROM schedule_dates
        WHERE jsonb_array_length(slots) > 0 AND d BETWEEN $1 AND $2`,
      [fromIso, toIso]
    );
    return rows.map((r) => r.d);
  }
  // Фолбэк: недельный шаблон.
  const sched = await getSchedule();
  const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const workingDows = new Set();
  sched.forEach((s) => { if (s.working && (s.slots || []).length) workingDows.add(map[s.day]); });
  const out = [];
  const cur = new Date(fromIso + 'T00:00:00');
  const end = new Date(toIso + 'T00:00:00');
  while (cur <= end) {
    if (workingDows.has(cur.getDay())) out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Доступные слоты на конкретную дату (с учётом расписания и уже занятых). */
export async function getDayAvailability(dateIso) {
  if (await isSick()) return { slots: [], taken: [] }; // мастер заболел — запись закрыта
  const { rows: takenRows } = await pool.query(
    `SELECT req_time FROM requests
      WHERE req_date = $1 AND status = ANY($2) AND req_time IS NOT NULL`,
    [dateIso, ['pending_review', 'payment_pending', 'receipt_review', 'confirmed']]
  );
  const taken = takenRows.map((t) => t.req_time);

  // 1) Расписание по конкретной дате — приоритет.
  const { rows: pd } = await pool.query(`SELECT slots FROM schedule_dates WHERE d = $1`, [dateIso]);
  if (pd[0]) return { slots: pd[0].slots || [], taken };

  // 2) Если режим «по датам» активен, но этой даты нет — закрыто.
  if (await hasPerDateSchedule()) return { slots: [], taken: [] };

  // 3) Фолбэк: недельный шаблон.
  const dow = DOW_KEYS[new Date(dateIso + 'T00:00:00').getDay()];
  const { rows } = await pool.query(`SELECT working, slots FROM schedule WHERE day = $1`, [dow]);
  const row = rows[0];
  if (!row || !row.working) return { slots: [], taken };
  return { slots: row.slots || [], taken };
}

// ── Заявки ────────────────────────────────────────────────────
/** Занят ли слот (есть активная заявка на эту дату и время). */
export async function isSlotTaken(date, time) {
  const { rows } = await pool.query(
    `SELECT 1 FROM requests
      WHERE req_date = $1 AND req_time = $2
        AND status = ANY($3) LIMIT 1`,
    [date, time, ['pending_review', 'payment_pending', 'receipt_review', 'confirmed']]
  );
  return rows.length > 0;
}

// ── Настройки / режим «мастер заболел» ────────────────────────
export async function getSetting(k) {
  const { rows } = await pool.query(`SELECT v FROM settings WHERE k = $1`, [k]);
  return rows[0]?.v ?? null;
}

export async function setSetting(k, v) {
  await pool.query(
    `INSERT INTO settings (k, v) VALUES ($1, $2)
     ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v`,
    [k, v]
  );
}

export async function isSick() {
  return (await getSetting('sick')) === '1';
}

// ── Возвраты брони ────────────────────────────────────────────
/** Отменяет все активные записи (болезнь мастера). У оплативших ставит refund_pending.
 *  Возвращает список отменённых заявок (для уведомления клиентов). */
export async function cancelAllActiveForSick() {
  const { rows } = await pool.query(
    `UPDATE requests
        SET status = 'cancelled',
            refund_pending = (booking_paid OR refund_pending),
            updated_at = now()
      WHERE status = ANY($1)
      RETURNING *`,
    [['pending_review', 'payment_pending', 'receipt_review', 'confirmed']]
  );
  return rows.map(rowToRequest);
}

/** Список заявок, по которым нужно вернуть бронь клиенту. */
export async function getRefundsPending() {
  const { rows } = await pool.query(
    `SELECT * FROM requests WHERE refund_pending = true ORDER BY updated_at DESC`
  );
  return rows.map(rowToRequest);
}

export async function setRefundPending(id, value) {
  const { rows } = await pool.query(
    `UPDATE requests SET refund_pending = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, !!value]
  );
  return rowToRequest(rows[0]);
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

/** Клиент прислал чек об оплате → статус «на проверке». Переход только из payment_pending. */
export async function submitReceipt(id, receiptPath) {
  const { rows } = await pool.query(
    `UPDATE requests SET receipt = $2, status = 'receipt_review', updated_at = now()
     WHERE id = $1 AND status = 'payment_pending' RETURNING *`,
    [id, receiptPath || null]
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
