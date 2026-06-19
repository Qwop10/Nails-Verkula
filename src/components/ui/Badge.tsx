/**
 * components/ui/Badge.tsx
 * Компонент для отображения статусов и меток
 */

import React from 'react';
import { classNames } from '../../utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-card text-muted',
    success: 'bg-brand-tint text-brand-contrast',
    error: 'bg-red-500/15 text-red-300',
    warning: 'bg-warn-bg text-warn-text',
    info: 'bg-brand-tint text-brand-contrast',
  };

  return (
    <span
      className={classNames(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
