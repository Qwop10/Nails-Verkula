/**
 * pages/master/MasterCalendarTab.tsx
 * Вкладка «Календарь»: месячный календарь с отметками дней, где есть записи.
 * Мастер выбирает день → видит записи на него, может изменить или удалить.
 * Внизу — редактор расписания по дням (вставка текста).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAsyncData } from '../../hooks';
import { useNotification } from '../../store';
import { Button } from '../../components/ui';
import { EditRequestModal } from '../../components/EditRequestModal';
import { MasterScheduleEditor } from '../../components/master/MasterScheduleEditor';
import {
  getMasterRequests,
  cancelRequestByMaster,
  getOpenDates,
  getDaySlots,
  setDateWorking,
  addDateSlot,
  removeDateSlot,
  serviceLabels,
  requestTotal,
  allSlots,
  type MasterRequest,
} from '../../services/masterApi';
import { REQUEST_STATUS_LABELS, type RequestStatus } from '../../config/services.config';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Записи, которые занимают день (не терминальные).
const ACTIVE: RequestStatus[] = ['pending_review', 'payment_pending', 'receipt_review', 'confirmed'];

function confirmAction(message: string): Promise<boolean> {
  const tg = (window as unknown as { Telegram?: { WebApp?: { showConfirm?: (m: string, cb: (ok: boolean) => void) => void } } }).Telegram?.WebApp;
  if (tg?.showConfirm) return new Promise((resolve) => tg.showConfirm!(message, resolve));
  return Promise.resolve(window.confirm(message));
}

export const MasterCalendarTab: React.FC = () => {
  const notify = useNotification();
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  const [editTarget, setEditTarget] = useState<MasterRequest | null>(null);

  const fetcher = useCallback(() => getMasterRequests(), [reloadKey]);
  const { data: requests, isLoading } = useAsyncData<MasterRequest[]>(fetcher, [reloadKey]);
  const all = requests ?? [];

  // Записи по датам (только активные).
  const byDate = useMemo(() => {
    const m = new Map<string, MasterRequest[]>();
    for (const r of all) {
      if (!r.date || !ACTIVE.includes(r.status)) continue;
      const list = m.get(r.date) ?? [];
      if (!m.has(r.date)) m.set(r.date, list);
      list.push(r);
    }
    for (const list of m.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return m;
  }, [all]);

  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => iso(today.getFullYear(), today.getMonth(), today.getDate()), [today]);
  const [ym, setYm] = useState(today.getFullYear() * 12 + today.getMonth());
  const year = Math.floor(ym / 12);
  const month = ym % 12;
  const [selected, setSelected] = useState<string | null>(null);

  // Открытые для записи даты (из расписания мастера) — чтобы видеть рабочие дни.
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 120);
    const isoOf = (d: Date) => d.toISOString().slice(0, 10);
    getOpenDates(isoOf(from), isoOf(to))
      .then((dates) => setOpenDates(new Set(dates)))
      .catch(() => {});
  }, [reloadKey]);

  // Слоты выбранного дня: все настроенные (slots) и занятые записями (taken).
  const [daySlots, setDaySlots] = useState<string[]>([]);
  const [dayTaken, setDayTaken] = useState<Set<string>>(new Set());
  const [newTime, setNewTime] = useState('');
  useEffect(() => {
    if (!selected) { setDaySlots([]); setDayTaken(new Set()); return; }
    let active = true;
    getDaySlots(selected)
      .then((r) => { if (!active) return; setDaySlots(r.slots || []); setDayTaken(new Set(r.taken || [])); })
      .catch(() => { if (active) { setDaySlots([]); setDayTaken(new Set()); } });
    return () => { active = false; };
  }, [selected, reloadKey]);

  const dayWorking = daySlots.length > 0;

  const handleSetWorking = async (working: boolean) => {
    if (!selected) return;
    try {
      await setDateWorking(selected, working);
      notify.success(working ? 'День сделан рабочим' : 'День сделан выходным');
      reload();
    } catch { notify.error('Не удалось изменить день'); }
  };
  const handleAddTime = async () => {
    if (!selected || !/^\d{2}:\d{2}$/.test(newTime)) { notify.error('Укажите время в формате ЧЧ:ММ'); return; }
    try {
      await addDateSlot(selected, newTime);
      setNewTime('');
      reload();
    } catch { notify.error('Не удалось добавить время'); }
  };
  const handleRemoveTime = async (time: string) => {
    if (!selected) return;
    if (dayTaken.has(time)) { notify.error('На это время уже есть запись — сначала отмените её'); return; }
    try {
      await removeDateSlot(selected, time);
      reload();
    } catch { notify.error('Не удалось удалить время'); }
  };

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Пн = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [year, month]);

  const dayList = selected ? byDate.get(selected) ?? [] : [];

  const handleDelete = async (r: MasterRequest) => {
    if (!(await confirmAction(`Удалить запись: ${r.clientName}, ${r.time}? Клиент получит уведомление об отмене${r.bookingPaid ? ', бронь попадёт в «Возврат»' : ''}.`))) return;
    try {
      await cancelRequestByMaster(r.id);
      notify.success('Запись удалена');
      reload();
    } catch {
      notify.error('Не удалось удалить запись');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <h2 className="font-serif text-lg text-fg mb-3">Календарь записей</h2>

      {/* Календарь */}
      <div className="rounded-card bg-card border border-line p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setYm((v) => v - 1)} className="text-brand px-2 text-lg leading-none" aria-label="Предыдущий месяц">‹</button>
          <span className="text-sm font-medium text-fg">{MONTHS[month]} {year}</span>
          <button onClick={() => setYm((v) => v + 1)} className="text-brand px-2 text-lg leading-none" aria-label="Следующий месяц">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-[10px] text-hint">{w}</span>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <span key={`e${i}`} />;
            const dIso = iso(year, month, d);
            const count = byDate.get(dIso)?.length ?? 0;
            const sel = selected === dIso;
            const past = dIso < todayIso;
            const open = openDates.has(dIso);
            const cls = sel
              ? 'bg-brand text-[color:rgb(var(--brand-contrast))]'
              : past
              ? 'text-hint/40'
              : open || count
              ? 'text-fg bg-brand/10'
              : 'text-hint';
            return (
              <button
                key={d}
                onClick={() => setSelected(dIso)}
                className={`relative mx-auto w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors ${cls}`}
              >
                {d}
                {count > 0 && !sel && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted mt-3 text-center">
          Выберите день, чтобы настроить рабочее время и посмотреть записи
        </p>
      </div>

      {/* Записи на выбранный день */}
      {selected && (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
            Записи на {selected.split('-').reverse().join('.')}
          </p>

          {/* Редактор рабочего времени дня (связан с календарём клиента) */}
          <div className="rounded-card bg-card-2 border border-line px-4 py-3 mb-3">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleSetWorking(true)}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  dayWorking ? 'bg-brand text-[color:rgb(var(--brand-contrast))] border-brand' : 'bg-card text-muted border-line'
                }`}
              >
                Рабочий день
              </button>
              <button
                onClick={() => handleSetWorking(false)}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !dayWorking ? 'bg-brand text-[color:rgb(var(--brand-contrast))] border-brand' : 'bg-card text-muted border-line'
                }`}
              >
                Выходной
              </button>
            </div>

            {dayWorking && (
              <>
                <p className="text-[11px] text-muted mb-1.5">Окошки времени (× — удалить):</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {daySlots.map((s) => {
                    const booked = dayTaken.has(s);
                    return (
                      <span
                        key={s}
                        className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 border ${
                          booked ? 'text-hint border-line bg-card' : 'text-brand border-brand/50'
                        }`}
                      >
                        {s}{booked && ' (занято)'}
                        {!booked && (
                          <button onClick={() => handleRemoveTime(s)} className="text-red-500 leading-none" aria-label={`Удалить ${s}`}>×</button>
                        )}
                      </span>
                    );
                  })}
                  {daySlots.length === 0 && <span className="text-[11px] text-hint">Окошек пока нет — добавьте ниже.</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="flex-1 min-w-0 bg-card border border-line rounded-tile px-3 py-1.5 text-sm text-fg outline-none focus:border-brand"
                  />
                  <Button variant="secondary" size="sm" onClick={handleAddTime}>Добавить</Button>
                </div>
              </>
            )}
          </div>

          {isLoading && <p className="text-xs text-hint">Загрузка…</p>}
          {!isLoading && dayList.length === 0 && (
            <p className="text-xs text-hint">Записей на этот день нет.</p>
          )}
          {dayList.map((r) => (
            <div key={r.id} className="rounded-card bg-card border border-line p-4 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-fg">{r.time} · {r.clientName}</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-brand-dark bg-brand/15">
                  {REQUEST_STATUS_LABELS[r.status]}
                </span>
              </div>
              <p className="text-xs text-muted">{serviceLabels(r).join(' + ')}</p>
              <p className="text-xs text-brand-dark mt-0.5">{r.clientPhone}</p>
              <p className="text-xs text-muted mt-0.5">{fmt(requestTotal(r))} · {r.bookingPaid ? 'бронь оплачена' : 'бронь не оплачена'}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditTarget(r)}>Изменить</Button>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleDelete(r)}>Удалить</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Расписание по дням */}
      <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-6">Расписание по дням</p>
      <MasterScheduleEditor onSaved={reload} />

      {editTarget && (
        <EditRequestModal
          request={editTarget}
          slots={allSlots()}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            notify.success('Изменения сохранены — отправлено на оплату');
            reload();
          }}
        />
      )}
    </div>
  );
};
