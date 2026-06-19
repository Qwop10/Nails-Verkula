/**
 * pages/client/AgeInput.tsx
 * Экран ввода возраста (Шаг 3 формы)
 * Динамически показывает поля для родителя если возраст < 18
 */

import React from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { getStep, TOTAL_STEPS } from '../../config/flow.config';
import { NumberInput, Input } from '../../components/forms';
import { useNav } from '../../hooks';
import { getNextFormStepPath, getPrevFormStepPath } from '../../routes';
import { LEGAL_AGE } from '../../constants';

export const AgeInput: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();
  const showParentFields = form.clientAge !== null && form.clientAge < LEGAL_AGE;

  const handleNext = () => {
    if (!form.validateCurrentStep()) {
      return;
    }

    const nextPath = getNextFormStepPath(form.currentStep);
    if (nextPath) {
      navigate(nextPath);
    }
  };

  const handlePrev = () => {
    const prevPath = getPrevFormStepPath(form.currentStep);
    if (prevPath) {
      navigate(prevPath);
    }
  };

  const isValid = form.clientAge !== null && form.clientAge >= 1 && form.clientAge <= 120
    ? !showParentFields ||
        (form.parentName.trim() !== '' && form.parentPhone.trim() !== '')
    : false;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-6">
        <FormHeader
          title={getStep('age').title}
          pageTitle={getStep('age').pageTitle}
          step={form.currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handlePrev}
        />

        <NumberInput
          value={form.clientAge}
          onChange={form.setClientAge}
          min={1}
          max={120}
          placeholder="25"
          error={form.errors.clientAge}
        />

        {/* Parent fields - show if age < 18 */}
        {showParentFields && (
          <>
            <div className="flex items-start gap-3 p-4 bg-warn-bg border border-warn-line rounded-xl">
              <svg
                className="w-5 h-5 text-warn-icon flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.9}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              <p className="text-[15px] leading-snug text-warn-text">
                Для записи потребуется согласие родителя или законного
                представителя.
              </p>
            </div>

            <Input
              label="ФИО родителя"
              placeholder="Иванова Мария Петровна"
              value={form.parentName}
              onChange={(e) => form.setParentName(e.target.value)}
              error={form.errors.parentName}
            />

            <Input
              label="Телефон родителя"
              placeholder="+7 (999) 000-00-00"
              value={form.parentPhone}
              onChange={(e) => form.setParentPhone(e.target.value)}
              error={form.errors.parentPhone}
            />
          </>
        )}
      </div>

      <FormFooter
        onNext={handleNext}
        onPrev={handlePrev}
        isNextDisabled={!isValid}
        showNext
        showPrev
      />
    </div>
  );
};
