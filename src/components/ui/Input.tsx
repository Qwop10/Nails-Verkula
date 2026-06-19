/**
 * components/ui/Input.tsx
 * Базовый компонент поля ввода (одно- и многострочный)
 */

import React from 'react';
import { classNames } from '../../utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  /** Рендерить как textarea */
  multiline?: boolean;
  /** Кол-во строк для textarea */
  rows?: number;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helpText, icon, className, multiline, rows = 4, ...props },
    ref
  ) => {
    const fieldClassName = classNames(
      'w-full px-5 py-4 border rounded-2xl transition-colors',
      'focus:outline-none focus:border-brand',
      'bg-card text-white placeholder-hint',
      error ? 'border-red-500/70' : 'border-transparent',
      icon && !multiline ? 'pl-11' : false,
      multiline ? 'resize-none leading-relaxed' : false,
      className
    );

    // Счётчик символов показываем, когда задан maxLength
    const maxLength =
      typeof props.maxLength === 'number' ? props.maxLength : undefined;
    const length =
      typeof props.value === 'string' || typeof props.value === 'number'
        ? String(props.value).length
        : 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-3">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && !multiline && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted">
              {icon}
            </div>
          )}

          {multiline ? (
            <textarea
              ref={ref as unknown as React.Ref<HTMLTextAreaElement>}
              rows={rows}
              className={fieldClassName}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input ref={ref} className={fieldClassName} {...props} />
          )}
        </div>

        {(error || helpText || maxLength !== undefined) && (
          <div className="mt-2 flex items-start justify-between gap-3">
            <p
              className={classNames(
                'text-sm',
                error ? 'text-red-400' : 'text-muted'
              )}
            >
              {error || (!error && helpText) || ''}
            </p>
            {maxLength !== undefined && (
              <span
                className={classNames(
                  'shrink-0 text-xs tabular-nums',
                  length >= maxLength ? 'text-red-400' : 'text-muted'
                )}
              >
                {length}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
