/**
 * pages/master/MasterProfileTab.tsx
 * Вкладка «Профиль мастера»: данные + настройки (уведомления/напоминания/автоодобрение).
 */
import React, { useState, useCallback } from 'react';
import { useAsyncData } from '../../hooks';
import { BRAND } from '../../config/brand';
import {
  getSettings,
  toggleSetting,
  type MasterSettings,
} from '../../services/masterApi';

const ROWS: { key: keyof MasterSettings; label: string }[] = [
  { key: 'notifications', label: 'Уведомления о заявках' },
  { key: 'reminders', label: 'Напоминания клиентам' },
];

export const MasterProfileTab: React.FC = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const fetcher = useCallback(() => getSettings(), [reloadKey]);
  const { data } = useAsyncData<MasterSettings>(fetcher, [reloadKey]);
  const onToggle = async (k: keyof MasterSettings) => {
    await toggleSetting(k);
    setReloadKey((x) => x + 1);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-card border-2 border-brand flex items-center justify-center font-serif text-xl text-brand mx-auto mb-2">
          {BRAND.name.charAt(0)}
        </div>
        <div className="font-serif text-lg text-fg">{BRAND.name}</div>
        <div className="text-xs text-muted mt-0.5">Мастер ногтевого сервиса</div>
      </div>

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Настройки</p>
      <div className="rounded-card bg-card border border-line divide-y divide-line">
        {ROWS.map((r) => {
          const on = data ? data[r.key] : false;
          return (
            <div key={r.key} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-fg">{r.label}</span>
              <button
                onClick={() => onToggle(r.key)}
                role="switch"
                aria-checked={on}
                className={`w-10 h-6 rounded-full relative transition-colors ${on ? 'bg-brand' : 'bg-card-2 border border-line'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
