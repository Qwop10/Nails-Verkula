/**
 * components/forms/NumberInput.tsx
 * Компонент для ввода чисел
 */

import React from 'react';
import { classNames } from '../../utils';

interface NumberInputProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  error?: string;
  helpText?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      value,
      onChange,
      min = 0,
      max = 100,
      unit,
      placeholder,
      error,
      helpText,
    },
    ref
  ) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === '' || inputValue === '-') {
        onChange(null);
      } else {
        const numValue = parseInt(inputValue, 10);
        if (!isNaN(numValue)) {
          onChange(numValue);
        }
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-3">
            {label}
          </label>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={ref}
            type="number"
            inputMode="numeric"
            value={value ?? ''}
            onChange={handleInputChange}
            min={min}
            max={max}
            placeholder={placeholder}
            className={classNames(
              'flex-1 w-full bg-card rounded-2xl px-5 py-5 text-center text-2xl font-semibold text-white',
              'placeholder-hint transition-colors border',
              'focus:outline-none focus:border-brand',
              error ? 'border-red-500/70' : 'border-transparent'
            )}
          />
          {unit && (
            <span className="text-lg text-muted shrink-0 w-7 text-center">
              {unit}
            </span>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        {helpText && !error && (
          <p className="mt-2 text-sm text-muted">{helpText}</p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
