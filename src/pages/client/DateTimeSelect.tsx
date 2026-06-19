/**
 * pages/client/DateTimeSelect.tsx
 * S3 — Выбор даты (календарь на 2 месяца вперёд) и времени (слоты).
 * Слоты пока мок; на этапе бэкенда заменим на доступность из расписания мастера.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNav } from '../../hooks';
import { hideMainButton, selectionHaptic } from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { useBookingStore, useNotification } from '../../store';
import { Button } from '../../components/ui';
import { createRequest } from '../../services/requestsApi';
import { getDaySlots } from '../../services/masterApi';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export const DateTimeSelect: React.FC = () => {
  const { navigate } = useNav();
  const notify = useNotification();
  const {
    date, time, total, hasSelection, setDate, setTime,
    clientName, clientPhone, mainId, addonIds, wishes,
  } = useBookingStore();
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = useMemo(() => new Date(), []);
  const minYM = today.getFullYear() * 12 + today.getMonth();
  const maxYM = minYM + 2; // 2 месяца вперёд
  const [ym, setYm] = useState(minYM);
  const year = Math.floor(ym / 12);
  const month = ym % 12;

  useEffect(() => {
    hideMainButton();
    if (!hasSelection()) navigate(CLIENT_ROUTES.CATALOG);
  }, [hasSelection, navigate]);

  // Слоты на выбранную дату — из расписания мастера (минус занятые).
  useEffect(() => {
    if (!date) { setSlots([]); setTaken(new Set()); return; }
    let active = true;
    setLoadingSlots(true);
    getDaySlots(date)
      .then((r) => {
        if (!active) return;
        setSlots(r.slots || []);
        setTaken(new Set(r.taken || []));
        // Если выбранное время больше недоступно — сбросить.
        if (time && (!r.slots.includes(time) || (r.taken || []).includes(time))) setTime(null);
      })
      .catch(() => { if (active) { setSlots([]); setTaken(new Set()); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // Сетка месяца (понедельник — первый день).
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [year, month]);

  const isPast = (d: number) => {
    const cmp = new Date(year, month, d);
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cmp < t0;
  };

  const handleSubmit = async () => {
    if (!date || !time) {
      notify.error('Выберите дату и время');
      return;
    }
    setSubmitting(true);
    try {
      await createRequest({ clientName, clientPhone, mainId, addonIds, wishes, date, time });
      selectionHaptic();
      navigate(CLIENT_ROUTES.SUBMITTED);
    } catch (e) {
      const code = (e as { code?: string }).code;
      notify.error(
        code === 'limit'
          ? 'Достигнут лимит: максимум 3 активные заявки'
          : code === 'no_contact'
          ? 'Заполните имя и телефон на первом экране'
          : 'Не удалось отправить заявку, попробуйте ещё раз'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="font-serif text-xl text-fg">Дата и время</h1>
      <p className="text-sm text-muted mb-4">{total().toLocaleString('ru-RU')} ₽ за выбранные услуги</p>

      {/* Календарь */}
      <div className="rounded-card bg-card border border-line p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            disabled={ym <= minYM}
            onClick={() => setYm((v) => Math.max(minYM, v - 1))}
            className="text-brand disabled:text-hint px-2 text-lg leading-none"
            aria-label="Предыдущий месяц"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-fg">
            {MONTHS[month]} {year}
          </span>
          <button
            disabled={ym >= maxYM}
            onClick={() => setYm((v) => Math.min(maxYM, v + 1))}
            className="text-brand disabled:text-hint px-2 text-lg leading-none"
            aria-label="Следующий месяц"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-[10px] text-hint">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <span key={`e${i}`} />;
            const dIso = iso(year, month, d);
            const past = isPast(d);
            const selected = date === dIso;
            return (
              <button
                key={d}
                disabled={past}
                onClick={() => setDate(dIso)}
                className={`mx-auto w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors ${
                  selected
                    ? 'bg-brand text-[color:rgb(var(--brand-contrast))]'
                    : past
                    ? 'text-hint/50'
                    : 'text-fg hover:bg-brand/10'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Слоты */}
      {date && (
        <>
          <p className="text-[11px] uppercase tracking-wider text-muted mt-5 mb-2">Время</p>
          {loadingSlots ? (
            <p className="text-xs text-hint">Загрузка…</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-hint">На этот день запись недоступна — выберите другую дату.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => {
                const isTaken = taken.has(s);
                const on = time === s;
                return (
                  <button
                    key={s}
                    disabled={isTaken}
                    onClick={() => setTime(s)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      isTaken
                        ? 'line-through text-hint border-line bg-card-2'
                        : on
                        ? 'bg-brand text-[color:rgb(var(--brand-contrast))] border-brand'
                        : 'text-brand border-brand hover:bg-brand/10'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {date && time && (
        <div className="mt-5 rounded-card bg-card-2 px-4 py-3">
          <p className="text-sm font-medium text-brand-dark">
            {date.split('-').reverse().join('.')} · {time} ✓
          </p>
        </div>
      )}

      <div className="mt-auto pt-6">
        <Button variant="primary" size="lg" fullWidth isLoading={submitting} onClick={handleSubmit}>
          Отправить заявку →
        </Button>
      </div>
    </div>
  );
};
