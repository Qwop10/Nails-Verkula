/**
 * components/forms/SegmentedControl.tsx
 * Компонент для выбора одного варианта из нескольких (как кнопки)
 */

import React from 'react';
import { classNames } from '../../utils';

interface SegmentedControlOption {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  columns?: number;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  label,
  error,
  columns = 2,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-3">
          {label}
        </label>
      )}

      <div
        className={classNames(
          'grid gap-3',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3',
          columns === 4 && 'grid-cols-4'
        )}
      >
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={classNames(
              'px-4 py-4 rounded-2xl font-medium transition-colors border text-[15px]',
              value === option.id
                ? 'bg-brand text-brand-contrast border-brand'
                : 'bg-card text-white border-transparent hover:bg-card-2'
            )}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
};
