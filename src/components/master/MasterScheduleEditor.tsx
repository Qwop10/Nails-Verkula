/**
 * components/master/MasterScheduleEditor.tsx
 * Расписание по дням: выбор дня, вкл/выкл рабочего дня, добавление/удаление слотов.
 */
import React, { useState, useCallback } from 'react';
import { useAsyncData } from '../../hooks';
import {
  getSchedule,
  toggleWorkingDay,
  addSlot,
  removeSlot,
  type ScheduleDay,
} from '../../services/masterApi';

const FULL: Record<string, string> = {
  mon: 'Понедельник', tue: 'Вторник', wed: 'Среда', thu: 'Четверг',
  fri: 'Пятница', sat: 'Суббота', sun: 'Воскресенье',
};

export const MasterScheduleEditor: React.FC = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [curKey, setCurKey] = useState('mon');
  const [newTime, setNewTime] = useState('');
  const fetcher = useCallback(() => getSchedule(), [reloadKey]);
  const { data, isLoading } = useAsyncData<ScheduleDay[]>(fetcher, [reloadKey]);
  const reload = () => setReloadKey((k) => k + 1);

  const days = data ?? [];
  const cur = days.find((d) => d.key === curKey);

  const onToggleDay = async () => {
    await toggleWorkingDay(curKey);
    reload();
  };
  const onAdd = async () => {
    if (!newTime) return;
    await addSlot(curKey, newTime);
    setNewTime('');
    reload();
  };
  const onRemove = async (t: string) => {
    await removeSlot(curKey, t);
    reload();
  };

  if (isLoading && days.length === 0) {
    return <div className="h-20 rounded-card bg-card border border-line animate-pulse" />;
  }

  return (
    <div>
      {/* Дни недели */}
      <div className="flex gap-1.5 mb-3">
        {days.map((d) => (
          <button
            key={d.key}
            onClick={() => setCurKey(d.key)}
            className={`flex-1 py-2 rounded-tile text-xs font-medium border transition-colors ${
              curKey === d.key
                ? 'bg-brand text-[color:rgb(var(--brand-contrast))] border-brand'
                : d.working
                ? 'bg-card text-fg border-line'
                : 'bg-card-2 text-hint border-line'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {cur && (
        <>
          {/* Статус дня */}
          <div className="flex items-center justify-between rounded-card bg-card border border-line px-4 py-3 mb-3">
            <span className="text-sm text-fg font-medium">
              {FULL[cur.key]} — {cur.working ? 'рабочий день' : 'выходной'}
            </span>
            <button
              onClick={onToggleDay}
              role="switch"
              aria-checked={cur.working}
              className={`w-10 h-6 rounded-full relative transition-colors ${
                cur.working ? 'bg-brand' : 'bg-card-2 border border-line'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                  cur.working ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Слоты дня */}
          {cur.working && (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {cur.slots.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-brand text-[color:rgb(var(--brand-contrast))]"
                  >
                    {t}
                    <button onClick={() => onRemove(t)} aria-label={`Удалить ${t}`} className="opacity-70">
                      ✕
                    </button>
                  </span>
                ))}
                {cur.slots.length === 0 && (
                  <span className="text-xs text-hint">Слотов нет — добавьте время.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-card border border-line rounded-tile px-3 py-1.5 text-sm text-fg outline-none focus:border-brand"
                />
                <button
                  onClick={onAdd}
                  className="px-3 py-1.5 rounded-tile text-sm bg-brand text-[color:rgb(var(--brand-contrast))]"
                >
                  Добавить
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
