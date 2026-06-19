/**
 * layouts/ClientLayout.tsx
 * Layout клиента: кремовая главная, серые остальные экраны,
 * нижняя навигация (Главная / Профиль) на верхнеуровневых экранах.
 */

import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStepFromPath } from '../routes';
import { useFormStore } from '../store';
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
              const color = active ? 'rgb(var(--brand))' : 'rgb(var(--muted))';
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="flex-1 flex flex-col items-center gap-1 py-3"
                  style={{ color }}
                >
                  <Icon name={tab.icon} size={24} strokeWidth={1.8} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
