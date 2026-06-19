/**
 * components/common/FormHeader.tsx
 * Header для экранов формы
 */

import React from 'react';
import { useNav } from '../../hooks';
import { impactHaptic } from '../../services';

interface FormHeaderProps {
  /** Большой заголовок экрана */
  title: string;
  /** Короткий заголовок для верхней панели (таб) */
  pageTitle?: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  pageTitle,
  subtitle,
  step,
  totalSteps,
  onBack,
}) => {
  const { goBack } = useNav();

  const handleBack = () => {
    impactHaptic('light');
    onBack ? onBack() : goBack();
  };

  const showBack = onBack !== undefined || (step ?? 1) > 0;
  const progress =
    step !== undefined && totalSteps !== undefined
      ? ((step + 1) / totalSteps) * 100
      : 0;

  return (
    <div className="mb-7">
      {/* Top bar + progress (full-bleed) */}
      <div className="-mx-6">
        <div className="relative flex items-center justify-center h-11 px-4">
          {showBack && (
            <button
              onClick={handleBack}
              className="absolute left-2 inline-flex items-center gap-0.5 px-2 py-1 text-brand text-[16px] font-medium active:opacity-70 transition-opacity"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Назад
            </button>
          )}

          {pageTitle && (
            <span className="text-[17px] font-semibold text-white">
              {pageTitle}
            </span>
          )}
        </div>

        {/* Progress track */}
        {step !== undefined && totalSteps !== undefined && (
          <div className="h-[2px] w-full bg-line">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Subtitle */}
      <h1 className="mt-7 text-[28px] leading-tight font-bold text-white">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 text-[15px] leading-snug text-muted">{subtitle}</p>
      )}
    </div>
  );
};
