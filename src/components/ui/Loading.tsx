/**
 * components/ui/Loading.tsx
 * Компоненты для загрузки: спиннер, скелет
 */

import React from 'react';
import { classNames } from '../../utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
}) => {
  const sizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        className={classNames(
          'animate-spin text-brand',
          sizeStyles[size]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {text && <p className="mt-4 text-muted">{text}</p>}
    </div>
  );
};

/**
 * Скелет для эмуляции загрузки контента
 */
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={classNames(
        'bg-card rounded animate-pulse',
        className
      )}
    />
  );
};

/**
 * Полноэкранный экран загрузки
 */
interface FullScreenLoadingProps {
  text?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  text = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-page z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};
