/**
 * pages/master/MasterReportTab.tsx
 * Вкладка «Отчёт»: период (День/Неделя/Месяц/Год), выручка/визиты/ср.чек, популярные услуги.
 */
import React, { useState, useCallback } from 'react';
import { useAsyncData } from '../../hooks';
import { getReport, type ReportPeriod } from '../../services/masterApi';

const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'year', label: 'Год' },
  { key: 'month', label: 'Месяц' },
  { key: 'week', label: 'Неделя' },
  { key: 'day', label: 'День' },
];

export const MasterReportTab: React.FC = () => {
  const [period, setPeriod] = useState<ReportPeriod>('year');
  const fetcher = useCallback(() => getReport(period), [period]);
  const { data, isLoading } = useAsyncData(fetcher, [period]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex gap-1.5 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-full text-xs transition-colors ${
              period === p.key ? 'bg-brand text-[color:rgb(var(--brand-contrast))]' : 'text-muted bg-card border border-line'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { l: 'Выручка', v: data ? fmt(data.revenue) : '—' },
          { l: 'Визитов', v: data ? String(data.visits) : '—' },
          { l: 'Ср. чек', v: data ? fmt(data.avg) : '—' },
        ].map((s) => (
          <div key={s.l} className="rounded-card bg-card border border-line p-3 text-center">
            <div className="text-[10px] text-muted">{s.l}</div>
            <div className="font-serif text-sm text-fg mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Популярные услуги</p>
      <div className="rounded-card bg-card border border-line divide-y divide-line">
        {isLoading && <div className="px-4 py-3 text-xs text-hint">Загрузка…</div>}
        {(data?.popular ?? []).map((p) => (
          <div key={p.label} className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-fg">{p.label}</span>
            <div className="text-right">
              <div className="text-sm font-medium text-brand leading-none">{p.count || '—'}</div>
              <div className="text-[10px] text-muted mt-1">записей</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
