/**
 * utils/validation.ts
 * Функции валидации
 */

import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../constants';
import type { ValidationError, FormValidationResult } from '../types';
import { LEGAL_AGE } from '../constants';

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Проверяет валидность телефона формата +7 (XXX) XXX-XX-XX
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+7\s?\(\d{3}\)\s?\d{3}-?\d{2}-?\d{2}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Форматирует и валидирует телефон
 */
export const validateAndFormatPhone = (phone: string): string | null => {
  if (!isValidPhone(phone)) {
    return null;
  }
  return phone;
};

// ============================================================================
// AGE VALIDATION
// ============================================================================

/**
 * Проверяет валидность возраста
 */
export const isValidAge = (age: number): boolean => {
  return age >= 1 && age <= 120;
};

/**
 * Проверяет, является ли возраст младше 18 лет
 */
export const isMinor = (age: number): boolean => {
  return age < LEGAL_AGE;
};

// ============================================================================
// SIZE VALIDATION
// ============================================================================

/**
 * Проверяет валидность размера татуировки
 */
export const isValidSize = (height: number, width: number): boolean => {
  return height > 0 && width > 0 && height <= 100 && width <= 100;
};

// ============================================================================
// STRING VALIDATION
// ============================================================================

/**
 * Проверяет, что строка не пуста
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Проверяет минимальную длину строки
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Валидирует файл эскиза
 */
export const validateSketchFile = (file: File): ValidationError | null => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      field: 'sketch',
      message: 'Размер файла не должен превышать 20 МБ',
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      field: 'sketch',
      message: 'Поддерживаются только форматы JPG, PNG, WEBP',
    };
  }

  return null;
};

// ============================================================================
// FORM STEP VALIDATION
// ============================================================================

interface StepValidationData {
  sketch?: File | null;
  placement?: string | null;
  size?: { height: number; width: number } | null;
  clientAge?: number | null;
  parentName?: string;
  parentPhone?: string;
  hasTattoos?: boolean | null;
}

/**
 * Валидирует конкретный шаг формы
 */
export const validateFormStep = (
  step: number,
  data: StepValidationData
): FormValidationResult => {
  const errors: ValidationError[] = [];

  switch (step) {
    case 0: // Sketch
      if (!data.sketch) {
        errors.push({
          field: 'sketch',
          message: 'Пожалуйста, загрузите эскиз',
        });
      } else {
        const fileError = validateSketchFile(data.sketch);
        if (fileError) {
          errors.push(fileError);
        }
      }
      break;

    case 1: // Placement
      if (!data.placement) {
        errors.push({
          field: 'placement',
          message: 'Пожалуйста, выберите место расположения',
        });
      }
      break;

    case 2: // Size
      if (!data.size) {
        errors.push({
          field: 'size',
          message: 'Пожалуйста, укажите размер татуировки',
        });
      } else if (!isValidSize(data.size.height, data.size.width)) {
        errors.push({
          field: 'size',
          message: 'Размер должен быть от 1 до 100 см',
        });
      }
      break;

    case 3: // Age & Parent
      if (data.clientAge === null || data.clientAge === undefined) {
        errors.push({
          field: 'clientAge',
          message: 'Пожалуйста, укажите возраст',
        });
      } else if (!isValidAge(data.clientAge)) {
        errors.push({
          field: 'clientAge',
          message: 'Возраст должен быть от 1 до 120 лет',
        });
      }

      if (isMinor(data.clientAge || 0)) {
        if (!isNotEmpty(data.parentName || '')) {
          errors.push({
            field: 'parentName',
            message: 'Пожалуйста, укажите имя родителя',
          });
        }
        if (!isValidPhone(data.parentPhone || '')) {
          errors.push({
            field: 'parentPhone',
            message: 'Пожалуйста, укажите корректный телефон родителя',
          });
        }
      }
      break;

    case 5: // Experience
      if (data.hasTattoos === null || data.hasTattoos === undefined) {
        errors.push({
          field: 'hasTattoos',
          message: 'Пожалуйста, выберите опцию',
        });
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
