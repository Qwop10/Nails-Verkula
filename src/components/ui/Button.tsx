/**
 * components/ui/Button.tsx
 * Базовый компонент кнопки
 */

import React from 'react';
import { classNames } from '../../utils';
import {
  THEME,
  getButtonShapeClass,
  getButtonElevationClass,
} from '../../config/theme.config';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Форма/материал/объём кнопки берутся из theme.config.ts (★ настройка вида).
    const glass = THEME.button.material === 'glass';

    const baseStyles = classNames(
      'inline-flex items-center justify-center font-semibold transition-all focus:outline-none disabled:cursor-not-allowed',
      getButtonShapeClass(),
      glass ? 'btn-glass backdrop-blur-xl' : getButtonElevationClass(),
      THEME.button.uppercase && 'uppercase tracking-wider'
    );

    const primaryStyle = THEME.button.primaryGradient
      ? 'bg-gradient-to-br from-brand-light via-brand to-brand-dark text-brand-contrast hover:opacity-90 disabled:from-brand-muted disabled:to-brand-muted disabled:text-white/40'
      : 'bg-brand text-brand-contrast hover:bg-brand-dark disabled:bg-brand-muted disabled:text-white/40';

    // Жидкое стекло: полупрозрачная заливка + блюр (btn-glass даёт рамку-блик).
    const glassStyles = {
      primary:
        'bg-brand/25 text-white border border-white/20 hover:bg-brand/35 disabled:opacity-40',
      secondary:
        'bg-white/10 text-white border border-white/15 hover:bg-white/20 disabled:opacity-40',
      danger:
        'bg-red-500/25 text-white border border-red-200/25 hover:bg-red-500/35 disabled:opacity-40',
      ghost:
        'bg-transparent text-muted border border-transparent hover:bg-white/10 disabled:opacity-40',
    };

    const solidStyles = {
      primary: primaryStyle,
      secondary:
        'bg-card-2 text-fg border border-line hover:bg-card disabled:opacity-50',
      danger:
        'bg-red-600 text-white hover:bg-red-500 disabled:opacity-50',
      ghost:
        'bg-transparent text-muted hover:bg-card-2 disabled:opacity-50',
    };

    const variantStyles = glass ? glassStyles : solidStyles;

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-[17px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={classNames(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
