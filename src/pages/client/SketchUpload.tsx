/**
 * pages/client/SketchUpload.tsx
 * Экран загрузки эскиза (Шаг 0 формы)
 */

import React, { useState } from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { TOTAL_STEPS } from '../../config/flow.config';
import { FileUpload } from '../../components/forms';
import { useNav } from '../../hooks';
import { getNextFormStepPath } from '../../routes';
import { useNotification } from '../../store';

export const SketchUpload: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();
  const notify = useNotification();
  const [isLoading] = useState(false);

  // Файл просто кладём в стор; реальная картинка сжимается в data URL
  // и уходит на сервер при отправке заявки (WishesInput/ConsultForm).
  const handleFileSelect = (file: File | null) => {
    form.setSketch(file);
    if (file) notify.success('Эскиз прикреплён');
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
    navigate('/');
  };

  const isExisting =
    form.serviceType === 'coverup' || form.serviceType === 'correction';

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <FormHeader
          title={isExisting ? 'Фото текущей татуировки' : 'Загрузите эскиз'}
          pageTitle="Фото"
          subtitle={
            isExisting
              ? 'Загрузите фото татуировки, которую нужно перекрыть или поправить'
              : 'Прикрепите изображение желаемой татуировки'
          }
          step={form.currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handlePrev}
        />

        <FileUpload
          accept="image/jpeg,image/png,image/webp"
          onFileSelect={handleFileSelect}
          file={form.sketch}
          error={form.errors.sketch}
        />
      </div>

      <FormFooter
        onNext={handleNext}
        onPrev={handlePrev}
        isNextDisabled={!form.sketch}
        isNextLoading={isLoading}
        showNext
        showPrev={false}
      />
    </div>
  );
};
