/**
 * layouts/MasterLayout.tsx
 * Layout для кабинета мастера
 * Отдельный модуль для возможности extraction в отдельное приложение
 */

import React from 'react';
import type { ReactNode } from 'react';
import { getBackgroundProps, isAuroraBackground, hasGrain } from '../config/theme.config';
import { AuroraBackground } from '../components/AuroraBackground';
import { GrainOverlay } from '../components/GrainOverlay';

interface MasterLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
}

export const MasterLayout: React.FC<MasterLayoutProps> = ({
  children,
  showSidebar = true,
  showHeader = true,
}) => {
  const bg = getBackgroundProps();

  return (
    <div
      className={`flex min-h-screen surface-gray text-white ${bg.className}`}
      style={bg.style}
    >
      {isAuroraBackground() && <AuroraBackground />}
      {hasGrain() && <GrainOverlay />}
      {/* Sidebar будет добавлен в следующем этапе */}
      {showSidebar && (
        <aside className="hidden md:block w-64 bg-card border-r border-line">
          {/* Sidebar content */}
        </aside>
      )}

      {/* Main content. min-w-0 — чтобы flex-колонка могла сжиматься до
          ширины экрана и контент не вылезал за границы (важно для мобильного). */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header будет добавлен в следующем этапе */}
        {showHeader && (
          <header className="bg-card border-b border-line">{/* Header content */}</header>
        )}

        {/* Content */}
        <main className="flex-1 p-5 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
