/**
 * hooks/useForm.ts
 * Hook для управления формой с валидацией
 */

import { useCallback } from 'react';
import { useFormStore, useShowParentFields, useFieldError } from '../store';
import { validateFormStep } from '../utils';

/**
 * Основной hook для формы
 */
export const useForm = () => {
  const store = useFormStore();
  const showParentFields = useShowParentFields();

  const validateCurrentStep = useCallback((): boolean => {
    const step = store.currentStep;
    const result = validateFormStep(step, {
      sketch: store.sketch,
      placement: store.placement,
      size: store.size,
      clientAge: store.clientAge,
      parentName: store.parentName,
      parentPhone: store.parentPhone,
      hasTattoos: store.hasTattoos,
    });

    // Очищаем старые ошибки
    store.clearErrors();

    // Добавляем новые ошибки
    result.errors.forEach((error) => {
      store.setError(error.field, error.message);
    });

    return result.isValid;
  }, [store]);

  const handleNextStep = useCallback((): boolean => {
    if (!validateCurrentStep()) {
      return false;
    }

    store.nextStep();
    return true;
  }, [validateCurrentStep, store]);

  const handlePrevStep = useCallback((): void => {
    store.prevStep();
  }, [store]);

  return {
    // State
    ...store,
    showParentFields,

    // Actions
    validateCurrentStep,
    handleNextStep,
    handlePrevStep,
  };
};

/**
 * Hook для получения ошибок поля
 */
export const useFormFieldError = (field: string): string => {
  return useFieldError(field);
};

/**
 * Hook для работы с загрузкой эскиза
 */
export const useSketchUpload = () => {
  const setSketch = useFormStore((state) => state.setSketch);

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (file) {
        setSketch(file);
      }
    },
    [setSketch]
  );

  return {
    sketch: useFormStore((state) => state.sketch),
    setSketch: handleFileSelect,
  };
};
