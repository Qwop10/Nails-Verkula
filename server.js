const express = require('express');
const { Pool } = require('pg');
const app = express();

app.use(express.static('.'));
app.use(express.json());

const db = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

// Инициализация таблиц при старте
async function initDB() {
  if (!db) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      tg_username TEXT,
      tg_name TEXT,
      phone TEXT,
      service TEXT,
      addon TEXT,
      date_label TEXT,
      time TEXT,
      wishes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      visible BOOLEAN DEFAULT TRUE
    );
    CREATE TABLE IF NOT EXISTS schedule (
      day TEXT PRIMARY KEY,
      active BOOLEAN DEFAULT TRUE,
      slots TEXT[] DEFAULT '{}'
    );
  `);
  console.log('DB ready');
}

// ── API ──────────────────────────────────────────────────────

// Создать заявку
app.post('/api/bookings', async (req, res) => {
  if (!db) return res.json({ ok: true, id: 0 });
  const { tg_username, tg_name, phone, service, addon, date_label, time, wishes } = req.body;
  const result = await db.query(
    `INSERT INTO bookings (tg_username,tg_name,phone,service,addon,date_label,time,wishes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [tg_username, tg_name, phone, service, addon, date_label, time, wishes]
  );
  res.json({ ok: true, id: result.rows[0].id });
});

// Получить все заявки (для мастера)
app.get('/api/bookings', async (req, res) => {
  if (!db) return res.json([]);
  const result = await db.query('SELECT * FROM bookings ORDER BY created_at DESC');
  res.json(result.rows);
});

// Изменить статус заявки
app.patch('/api/bookings/:id', async (req, res) => {
  if (!db) return res.json({ ok: true });
  const { status } = req.body;
  await db.query('UPDATE bookings SET status=$1 WHERE id=$2', [status, req.params.id]);
  res.json({ ok: true });
});

// Получить услуги
app.get('/api/services', async (req, res) => {
  if (!db) return res.json([]);
  const result = await db.query('SELECT * FROM services ORDER BY id');
  res.json(result.rows);
});

// Получить расписание
app.get('/api/schedule', async (req, res) => {
  if (!db) return res.json([]);
  const result = await db.query('SELECT * FROM schedule');
  res.json(result.rows);
});

// Сохранить расписание
app.post('/api/schedule', async (req, res) => {
  if (!db) return res.json({ ok: true });
  const { day, active, slots } = req.body;
  await db.query(
    `INSERT INTO schedule (day, active, slots) VALUES ($1,$2,$3)
     ON CONFLICT (day) DO UPDATE SET active=$2, slots=$3`,
    [day, active, slots]
  );
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
initDB().then(() => app.listen(PORT, () => console.log('Server on port', PORT)));
