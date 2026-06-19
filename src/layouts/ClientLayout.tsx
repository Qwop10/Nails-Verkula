/**
 * layouts/ClientLayout.tsx
 * Layout клиента: кремовая главная, серые остальные экраны,
 * нижняя навигация (Главная / Профиль) на верхнеуровневых экранах.
 */

import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStepFromPath } from '../routes';
import { useFormStore, useBookingStore, useNotification } from '../store';
import { getBackgroundProps, isAuroraBackground, hasGrain } from '../config/theme.config';
import { AuroraBackground } from '../components/AuroraBackground';
import { GrainOverlay } from '../components/GrainOverlay';
import { Icon } from '../components/icons';
import type { IconName } from '../components/icons';

interface ClientLayoutProps {
  children: ReactNode;
}

const TABS: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: 'Главная', icon: 'home' },
  { path: '/catalog', label: 'Услуги', icon: 'search' },
  { path: '/profile', label: 'Профиль', icon: 'user' },
];

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const setCurrentStep = useFormStore((s) => s.setCurrentStep);
  const clientName = useBookingStore((s) => s.clientName);
  const clientPhone = useBookingStore((s) => s.clientPhone);
  const verified =
    clientName.trim().length >= 2 && clientPhone.replace(/\D/g, '').length === 11;
  const notify = useNotification();

  useEffect(() => {
    const step = getStepFromPath(pathname);
    if (step >= 0) setCurrentStep(step);
  }, [pathname, setCurrentStep]);

  const showTabBar = TABS.some((t) => t.path === pathname);

  const bg = getBackgroundProps();

  return (
    <div
      className={`flex flex-col min-h-screen surface-gray ${bg.className}`}
      style={bg.style}
    >
      {isAuroraBackground() && <AuroraBackground />}
      {hasGrain() && <GrainOverlay />}
      <main
        className={`flex-1 flex flex-col w-full max-w-md mx-auto px-6 py-5 ${
          showTabBar ? 'pb-24' : ''
        }`}
      >
        {children}
      </main>

      {showTabBar && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/70 backdrop-blur-xl border-line"
        >
          <div className="max-w-md mx-auto flex">
            {TABS.map((tab) => {
              const active = pathname === tab.path;
              // Вкладки кроме «Главная» заблокированы, пока клиент не заполнил данные.
              const locked = tab.path !== '/' && !verified;
              const color = active
                ? 'rgb(var(--brand))'
                : locked
                ? 'rgb(var(--hint))'
                : 'rgb(var(--muted))';
              const handleClick = () => {
                if (locked) {
                  notify.error('Сначала заполните данные на главной');
                  return;
                }
                navigate(tab.path);
              };
              return (
                <button
                  key={tab.path}
                  onClick={handleClick}
                  className="relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
                  style={{ color, opacity: locked ? 0.5 : 1 }}
                >
                  <span style={active ? { filter: 'drop-shadow(0 0 4px rgba(201,168,76,.55))' } : undefined}>
                    <Icon name={tab.icon} size={24} strokeWidth={1.8} />
                  </span>
                  <span className="text-xs font-medium">{tab.label}</span>
                  {active && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{ bottom: 8, width: 18, height: 2, borderRadius: 2, background: 'rgb(var(--brand))', opacity: 0.7 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
