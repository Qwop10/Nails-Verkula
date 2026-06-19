/**
 * components/forms/Checkbox.tsx
 * Компонент для чекбокса
 */

import React from 'react';
import { classNames } from '../../utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <label className="flex items-start gap-3 bg-card rounded-2xl px-4 py-3.5 cursor-pointer">
        <div className="flex items-center h-6">
          <input
            ref={ref}
            type="checkbox"
            className={classNames(
              'w-5 h-5 rounded border-line bg-page text-brand',
              'focus:ring-brand focus:ring-offset-0',
              'transition-colors cursor-pointer accent-brand',
              className
            )}
            {...props}
          />
        </div>
        {label && (
          <div>
            <span className="text-[15px] font-medium text-white">{label}</span>
            {description && (
              <p className="text-sm text-muted mt-1">{description}</p>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * Компонент для группы чекбоксов
 */
interface CheckboxGroupProps {
  label?: string;
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  value: string[];
  onChange: (values: string[]) => void;
  error?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  value,
  onChange,
  error,
}) => {
  const handleChange = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter((v) => v !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-3">
          {label}
        </label>
      )}

      <div className="space-y-2.5">
        {options.map((option) => (
          <Checkbox
            key={option.id}
            id={option.id}
            label={option.label}
            description={option.description}
            checked={value.includes(option.id)}
            onChange={() => handleChange(option.id)}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
};
