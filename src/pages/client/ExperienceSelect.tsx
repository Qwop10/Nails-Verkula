/**
 * pages/client/ExperienceSelect.tsx
 * Экран выбора опыта татуировок (Шаг 5 формы)
 */

import React from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { getStep, TOTAL_STEPS } from '../../config/flow.config';
import { SegmentedControl, NumberInput } from '../../components/forms';
import { useNav } from '../../hooks';
import { getNextFormStepPath, getPrevFormStepPath } from '../../routes';

export const ExperienceSelect: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();

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

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-6">
        <FormHeader
          title={getStep('experience').title}
          pageTitle={getStep('experience').pageTitle}
          step={form.currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handlePrev}
        />

        <SegmentedControl
          options={[
            { id: 'true', label: 'Да' },
            { id: 'false', label: 'Нет' },
          ]}
          value={form.hasTattoos === null ? null : form.hasTattoos ? 'true' : 'false'}
          onChange={(value) => form.setHasTattoos(value === 'true')}
          columns={2}
          error={form.errors.hasTattoos}
        />

        {/* Show tattoo count if has experience */}
        {form.hasTattoos && (
          <NumberInput
            label="Сколько у вас тату?"
            value={form.tattooCount}
            onChange={(v) =>
              form.setTattooCount(
                v === null ? null : Math.min(Math.max(v, 1), 100)
              )
            }
            min={1}
            max={100}
            placeholder="5"
          />
        )}
      </div>

      <FormFooter
        onNext={handleNext}
        onPrev={handlePrev}
        isNextDisabled={form.hasTattoos === null}
        showNext
        showPrev
      />
    </div>
  );
};
