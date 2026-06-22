/**
 * pages/master/MasterDashboard.tsx
 * Оболочка панели мастера: шапка + 4 вкладки (Заявки/Услуги/Отчёт/Профиль) + нижняя навигация.
 */
import React, { useState } from 'react';
import { MasterRequestsTab } from './MasterRequestsTab';
import { MasterCalendarTab } from './MasterCalendarTab';
import { MasterServicesTab } from './MasterServicesTab';
import { MasterReportTab } from './MasterReportTab';
import { MasterProfileTab } from './MasterProfileTab';
import { BRAND } from '../../config/brand';
import { useAppStore } from '../../store';

type TabKey = 'requests' | 'calendar' | 'services' | 'report' | 'profile';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'requests', label: 'Заявки', icon: (<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>) },
  { key: 'calendar', label: 'Календарь', icon: (<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="14" x2="8" y2="14" /><line x1="12" y1="14" x2="12" y2="14" /><line x1="16" y1="14" x2="16" y2="14" /></>) },
  { key: 'services', label: 'Услуги', icon: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>) },
  { key: 'report', label: 'Отчёт', icon: (<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>) },
  { key: 'profile', label: 'Профиль', icon: (<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>) },
];

export const MasterDashboard: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('requests');
  const setUserRole = useAppStore((s) => s.setUserRole);

  return (
    <div className="flex flex-col h-screen surface-gray">
      {/* Шапка */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-line">
        <div>
          <h1 className="font-serif text-lg text-fg">Панель мастера</h1>
          <p className="text-xs text-muted">{BRAND.name}</p>
        </div>
        <button
          onClick={() => setUserRole('client')}
          className="text-[11px] font-medium px-3 py-1 rounded-full border border-brand text-brand hover:bg-brand/10 transition-colors"
        >
          👁 Как клиент
        </button>
      </div>

      {/* Контент вкладки */}
      {tab === 'requests' && <MasterRequestsTab />}
      {tab === 'calendar' && <MasterCalendarTab />}
      {tab === 'services' && <MasterServicesTab />}
      {tab === 'report' && <MasterReportTab />}
      {tab === 'profile' && <MasterProfileTab />}

      {/* Нижняя навигация */}
      <nav className="flex-shrink-0 flex border-t border-line bg-card">
        {TABS.map((t) => {
          const active = tab === t.key;
          const color = active ? 'rgb(var(--brand))' : 'rgb(var(--muted))';
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
              style={{ color }}
            >
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                style={active ? { filter: 'drop-shadow(0 0 4px rgba(201,168,76,.55))' } : undefined}
              >
                {t.icon}
              </svg>
              <span className="text-[11px] font-medium">{t.label}</span>
              {active && (
                <span
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ bottom: 6, width: 18, height: 2, borderRadius: 2, background: 'rgb(var(--brand))', opacity: 0.7 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
