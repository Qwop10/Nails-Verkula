/**
 * FORM STORE - Zustand store для управления данными формы
 * Автоматически сохраняет в localStorage при изменении
 * Позволяет пользователю закрыть Mini App и продолжить позже
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FormState, TattooPlacement, Size } from '../types';
import { LEGAL_AGE } from '../constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'tattoo_form_state';

// Initial state
const initialState: FormState = {
  serviceType: 'tattoo',
  sketch: null,
  placement: null,
  size: null,
  clientName: '',
  clientPhone: '',
  clientAge: null,
  parentName: '',
  parentPhone: '',
  contraindications: [],
  otherHealth: '',
  hasTattoos: null,
  tattooCount: null,
  wishes: '',
  currentStep: 0,
  isValid: false,
  errors: {},
};

// ============================================================================
// STORE
// ============================================================================

interface FormStoreState extends FormState {
  // Service
  setServiceType: (type: FormState['serviceType']) => void;

  // Sketch
  setSketch: (file: File | null) => void;

  // Placement
  setPlacement: (placement: TattooPlacement) => void;

  // Size
  setSize: (size: Size) => void;

  // Client info
  setClientName: (name: string) => void;
  setClientPhone: (phone: string) => void;

  // Age & Parent info
  setClientAge: (age: number | null) => void;
  setParentName: (name: string) => void;
  setParentPhone: (phone: string) => void;

  // Health
  setContraindications: (items: string[]) => void;
  toggleContraindication: (item: string) => void;
  setOtherHealth: (text: string) => void;

  // Experience
  setHasTattoos: (value: boolean) => void;
  setTattooCount: (count: number | null) => void;

  // Wishes
  setWishes: (text: string) => void;

  // Form navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Validation
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;

  // Reset
  resetForm: () => void;
  resetStep: (step: number) => void;
}

export const useFormStore = create<FormStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setServiceType: (type) => set({ serviceType: type }),

      // ====================================================================
      // SKETCH
      // ====================================================================
      setSketch: (file: File | null) => {
        set({ sketch: file });
        if (file) {
          set((state) => ({ errors: { ...state.errors, sketch: '' } }));
        }
      },

      // ====================================================================
      // PLACEMENT
      // ====================================================================
      setPlacement: (placement: TattooPlacement) => {
        set({ placement });
        set((state) => ({ errors: { ...state.errors, placement: '' } }));
      },

      // ====================================================================
      // SIZE
      // ====================================================================
      setSize: (size: Size) => {
        set({ size });
        set((state) => ({ errors: { ...state.errors, size: '' } }));
      },

      // ====================================================================
      // CLIENT INFO
      // ====================================================================
      setClientName: (name: string) => {
        set({ clientName: name });
      },

      setClientPhone: (phone: string) => {
        set({ clientPhone: phone });
      },

      // ====================================================================
      // AGE & PARENT INFO
      // ====================================================================
      setClientAge: (age: number | null) => {
        set({ clientAge: age });
        if (age !== null) {
          set((state) => ({ errors: { ...state.errors, clientAge: '' } }));
        }
      },

      setParentName: (name: string) => {
        set({ parentName: name });
      },

      setParentPhone: (phone: string) => {
        set({ parentPhone: phone });
      },

      // ====================================================================
      // HEALTH
      // ====================================================================
      setContraindications: (items: string[]) => {
        set({ contraindications: items });
        set((state) => ({
          errors: { ...state.errors, contraindications: '' },
        }));
      },

      toggleContraindication: (item: string) => {
        const current = get().contraindications;
        const updated = current.includes(item)
          ? current.filter((i) => i !== item)
          : [...current, item];
        set({ contraindications: updated });
      },

      setOtherHealth: (text: string) => {
        set({ otherHealth: text });
      },

      // ====================================================================
      // EXPERIENCE
      // ====================================================================
      setHasTattoos: (value: boolean) => {
        set({
          hasTattoos: value,
          tattooCount: value ? null : null,
        });
        set((state) => ({
          errors: { ...state.errors, hasTattoos: '' },
        }));
      },

      setTattooCount: (count: number | null) => {
        set({ tattooCount: count });
      },

      // ====================================================================
      // WISHES
      // ====================================================================
      setWishes: (text: string) => {
        set({ wishes: text });
      },

      // ====================================================================
      // FORM NAVIGATION
      // ====================================================================
      setCurrentStep: (step: number) => {
        set({ currentStep: step });
      },

      nextStep: () => {
        set((state) => ({ currentStep: state.currentStep + 1 }));
      },

      prevStep: () => {
        set((state) => ({
          currentStep: Math.max(0, state.currentStep - 1),
        }));
      },

      // ====================================================================
      // VALIDATION
      // ====================================================================
      setError: (field: string, message: string) => {
        set((state) => ({
          errors: { ...state.errors, [field]: message },
        }));
      },

      clearError: (field: string) => {
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[field];
          return { errors: newErrors };
        });
      },

      clearErrors: () => {
        set({ errors: {} });
      },

      // ====================================================================
      // RESET
      // ====================================================================
      resetForm: () => {
        set(initialState);
      },

      /**
       * Очищает данные конкретного шага (для редактирования)
       */
      resetStep: (step: number) => {
        const stepsReset: Partial<FormState> = {};

        switch (step) {
          case 0: // Sketch
            stepsReset.sketch = null;
            break;
          case 1: // Placement
            stepsReset.placement = null;
            break;
          case 2: // Size
            stepsReset.size = null;
            break;
          case 3: // Age
            stepsReset.clientAge = null;
            stepsReset.parentName = '';
            stepsReset.parentPhone = '';
            break;
          case 4: // Health
            stepsReset.contraindications = [];
            stepsReset.otherHealth = '';
            break;
          case 5: // Experience
            stepsReset.hasTattoos = null;
            stepsReset.tattooCount = null;
            break;
          case 6: // Wishes
            stepsReset.wishes = '';
            break;
        }

        set(stepsReset);
      },
    }),
    {
      name: STORAGE_KEY,
      // Кастомная функция для сохранения только необходимых полей
      // (не сохраняем состояние, которое хранится не в форме)
      partialize: (state) => ({
        serviceType: state.serviceType,
        sketch: state.sketch,
        placement: state.placement,
        size: state.size,
        clientName: state.clientName,
        clientPhone: state.clientPhone,
        clientAge: state.clientAge,
        parentName: state.parentName,
        parentPhone: state.parentPhone,
        contraindications: state.contraindications,
        otherHealth: state.otherHealth,
        hasTattoos: state.hasTattoos,
        tattooCount: state.tattooCount,
        wishes: state.wishes,
        currentStep: state.currentStep,
      }),
      // Опция для JSON сериализации (File объект не может быть сохранён)
      storage: {
        getItem: (name: string) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name: string, value: any) => {
          // Специальная обработка для File объекта
          if (value.state && value.state.sketch instanceof File) {
            value.state.sketch = null; // Не сохраняем File в localStorage
          }
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

// ============================================================================
// HELPER HOOKS (для удобства в компонентах)
// ============================================================================

/**
 * Проверяет, нужны ли поля для родителя
 */
export const useShowParentFields = (): boolean => {
  const age = useFormStore((state) => state.clientAge);
  return age !== null && age < LEGAL_AGE;
};

/**
 * Получает текущий шаг
 */
export const useCurrentStep = (): number => {
  return useFormStore((state) => state.currentStep);
};

/**
 * Получает ошибку конкретного поля
 */
export const useFieldError = (field: string): string => {
  return useFormStore((state) => state.errors[field] || '');
};

/**
 * Проверяет валидность конкретного шага
 */
export const useStepValid = (step: number): boolean => {
  const state = useFormStore();

  switch (step) {
    case 0: // Sketch
      return state.sketch !== null;

    case 1: // Placement
      return state.placement !== null;

    case 2: // Size
      return state.size !== null && state.size.height > 0 && state.size.width > 0;

    case 3: // Age & Parent
      if (state.clientAge === null || state.clientAge < 1 || state.clientAge > 120) {
        return false;
      }
      if (state.clientAge < LEGAL_AGE) {
        return (
          state.parentName.trim() !== '' &&
          state.parentPhone.trim() !== ''
        );
      }
      return true;

    case 4: // Health (всегда валидно - это опциональный выбор)
      return true;

    case 5: // Experience
      return state.hasTattoos !== null;

    case 6: // Wishes (всегда валидно - опционально)
      return true;

    default:
      return false;
  }
};
