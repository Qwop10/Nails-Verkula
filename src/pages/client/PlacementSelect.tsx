/**
 * pages/client/PlacementSelect.tsx
 * Экран выбора места расположения татуировки (Шаг 1 формы)
 */

import React from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { getStep, TOTAL_STEPS } from '../../config/flow.config';
import { SegmentedControl } from '../../components/forms';
import { useNav } from '../../hooks';
import { getNextFormStepPath, getPrevFormStepPath } from '../../routes';
import { PLACEMENT_OPTIONS, PLACEMENT_KEYS } from '../../constants';
import type { TattooPlacement } from '../../types';

export const PlacementSelect: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();

  const placementOptions = PLACEMENT_KEYS.map((key) => ({
    id: key,
    label: PLACEMENT_OPTIONS[key],
  }));

  const handleChange = (value: string) => {
    form.setPlacement(value as TattooPlacement);
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

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <FormHeader
          title={getStep('placement').title}
          pageTitle={getStep('placement').pageTitle}
          step={form.currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handlePrev}
        />

        <SegmentedControl
          options={placementOptions}
          value={form.placement}
          onChange={handleChange}
          columns={2}
          error={form.errors.placement}
        />
      </div>

      <FormFooter
        onNext={handleNext}
        onPrev={handlePrev}
        isNextDisabled={!form.placement}
        showNext
        showPrev
      />
    </div>
  );
};
