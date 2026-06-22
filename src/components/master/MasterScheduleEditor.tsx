/**
 * components/master/MasterScheduleEditor.tsx
 * Расписание на месяц вставкой текста. Мастер копирует свой список дат
 * («1(ср) 10:00;12:00;…»), выбирает месяц, видит превью и сохраняет.
 */
import React, { useMemo, useState } from 'react';
import { useNotification } from '../../store';
import { Button } from '../../components/ui';
import { parseSchedule } from '../../utils/scheduleParser';
import { saveMonthSchedule } from '../../services/masterApi';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const PLACEHOLDER = `1(ср) 10:00;12:00;14:00;16:00
3(пт) 10:00;12:00;14:00;16:00
5(вс) 12:00;14:00;16:00
…`;

export const MasterScheduleEditor: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const notify = useNotification();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  // Месяцы: текущий + 2 вперёд.
  const monthOptions = useMemo(() => {
    const now = new Date();
    return [0, 1, 2].map((off) => {
      const d = new Date(now.getFullYear(), now.getMonth() + off, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
    });
  }, []);
  const [selIdx, setSelIdx] = useState(0);
  const sel = monthOptions[selIdx];

  const parsed = useMemo(() => parseSchedule(text), [text]);
  const totalSlots = parsed.entries.reduce((s, e) => s + e.slots.length, 0);

  const handleSave = async () => {
    if (parsed.entries.length === 0) { notify.error('Нечего сохранять — вставьте расписание'); return; }
    setSaving(true);
    try {
      const { saved } = await saveMonthSchedule(sel.year, sel.month, parsed.entries);
      notify.success(`Сохранено: ${saved} дней на ${MONTHS[sel.month - 1]}`);
      onSaved?.();
    } catch {
      notify.error('Не удалось сохранить расписание');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Выбор месяца */}
      <div className="flex gap-1.5 mb-3">
        {monthOptions.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelIdx(i)}
            className={`flex-1 py-2 rounded-tile text-xs font-medium border transition-colors ${
              selIdx === i
                ? 'bg-brand text-[color:rgb(var(--brand-contrast))] border-brand'
                : 'bg-card text-fg border-line'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Поле вставки */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={8}
        className="w-full bg-card border border-line rounded-card px-3 py-2.5 text-sm text-fg placeholder-hint outline-none focus:border-brand resize-none font-mono"
      />
      <p className="text-[11px] text-hint mt-1">
        Вставьте список: одна строка = один день. Формат времени ЧЧ:ММ. Даты не из списка — закрыты.
      </p>

      {/* Превью */}
      {text.trim() && (
        <div className="mt-3 rounded-card bg-card border border-line p-3">
          <div className="text-sm font-medium text-brand-dark mb-2">
            Распознано: {parsed.entries.length} дней · {totalSlots} окошек
          </div>
          <div className="max-h-44 overflow-y-auto flex flex-col gap-1">
            {parsed.entries.map((e) => {
              const dow = DOW[new Date(sel.year, sel.month - 1, e.day).getDay()];
              return (
                <div key={e.day} className="text-xs text-fg">
                  <span className="text-muted">{e.day} {MONTHS_GEN[sel.month - 1]} ({dow}):</span>{' '}
                  {e.slots.join(', ')}
                </div>
              );
            })}
          </div>
          {parsed.skipped.length > 0 && (
            <div className="mt-2 pt-2 border-t border-line">
              {parsed.skipped.map((s, i) => (
                <div key={i} className="text-[11px] text-red-500">⚠️ «{s.line}» — {s.reason}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <Button variant="primary" size="md" fullWidth className="mt-3" isLoading={saving} onClick={handleSave}>
        Сохранить расписание на {MONTHS[sel.month - 1]}
      </Button>
    </div>
  );
};
