/**
 * pages/client/SizeInput.tsx
 * Экран ввода размера татуировки (Шаг 2 формы)
 */

import React from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { getStep, TOTAL_STEPS } from '../../config/flow.config';
import { NumberInput } from '../../components/forms';
import { useNav } from '../../hooks';
import { getNextFormStepPath, getPrevFormStepPath } from '../../routes';

export const SizeInput: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();

  const handleHeightChange = (value: number | null) => {
    form.setSize({
      height: value ?? 0,
      width: form.size?.width ?? 0,
    });
  };

  const handleWidthChange = (value: number | null) => {
    form.setSize({
      height: form.size?.height ?? 0,
      width: value ?? 0,
    });
  };

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

  const isValid = form.size && form.size.height > 0 && form.size.width > 0;

  // Превью пропорций: фигура растёт вместе со значениями и упирается
  // в рамку (MAX_CM заполняет её целиком, дальше — клампится).
  const heightCm = form.size?.height ?? 0;
  const widthCm = form.size?.width ?? 0;
  const MAX_CM = 50;
  const FRAME = 180; // максимальная сторона фигуры, px
  const pxPerCm = FRAME / MAX_CM;
  const previewH = heightCm > 0 ? Math.min(Math.max(heightCm * pxPerCm, 24), FRAME) : 0;
  const previewW = widthCm > 0 ? Math.min(Math.max(widthCm * pxPerCm, 24), FRAME) : 0;
  const hasPreview = heightCm > 0 || widthCm > 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-6">
        <FormHeader
          title={getStep('size').title}
          pageTitle={getStep('size').pageTitle}
          subtitle={getStep('size').subtitle}
          step={form.currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handlePrev}
        />

        <NumberInput
          label="Высота"
          value={form.size?.height || null}
          onChange={handleHeightChange}
          min={1}
          max={100}
          unit="см"
          placeholder="10"
          error={form.errors.size}
        />

        <NumberInput
          label="Ширина"
          value={form.size?.width || null}
          onChange={handleWidthChange}
          min={1}
          max={100}
          unit="см"
          placeholder="8"
        />

        {/* Превью размера */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
            Превью
          </p>
          <div className="relative w-full h-56 rounded-2xl border border-line bg-card/40 flex items-center justify-center overflow-hidden p-4">
            {hasPreview ? (
              <div
                className="bg-brand/15 border-2 border-brand rounded-md flex items-center justify-center max-w-full max-h-full transition-all duration-200"
                style={{ width: previewW || 24, height: previewH || 24 }}
              >
                <span className="text-[11px] font-medium text-white whitespace-nowrap px-1">
                  {widthCm || 0}×{heightCm || 0} см
                </span>
              </div>
            ) : (
              <span className="text-sm text-hint">Введите размеры для превью</span>
            )}
          </div>
        </div>
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
