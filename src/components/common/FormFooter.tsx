/**
 * components/common/FormFooter.tsx
 * Footer с кнопками навигации для экранов формы
 */

import React from 'react';
import { Button } from '../ui';

interface FormFooterProps {
  onNext?: () => void;
  onPrev?: () => void;
  onSubmit?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  submitLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  showPrev?: boolean;
  showNext?: boolean;
  showSubmit?: boolean;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onNext,
  onPrev: _onPrev,
  onSubmit,
  nextLabel = 'Далее',
  prevLabel: _prevLabel = 'Назад',
  submitLabel = 'Отправить',
  isNextDisabled = false,
  isNextLoading = false,
  showPrev: _showPrev = true,
  showNext = true,
  showSubmit = false,
}) => {
  return (
    // В макете нижняя панель содержит только основное действие.
    // Кнопка «Назад» вынесена в верхнюю панель (FormHeader).
    <div className="mt-6 pt-2">
      {showNext && (
        <Button
          variant="primary"
          size="lg"
          onClick={onNext}
          disabled={isNextDisabled}
          isLoading={isNextLoading}
          fullWidth
        >
          {nextLabel}
        </Button>
      )}

      {showSubmit && (
        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit ?? onNext}
          disabled={isNextDisabled}
          isLoading={isNextLoading}
          fullWidth
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
};
