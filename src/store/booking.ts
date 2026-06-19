/**
 * store/booking.ts
 * Состояние оформления заявки (короткий поток Nails):
 * клиент → услуги → дата/время → отправка.
 */
import { create } from 'zustand';
import { calcTotal } from '../config/services.config';

interface BookingState {
  // Клиент (онбординг)
  clientName: string;
  clientPhone: string;
  // Выбор услуг
  mainId: string | null;
  addonIds: string[];
  wishes: string;
  // Дата/время
  date: string | null; // 'YYYY-MM-DD'
  time: string | null; // 'HH:MM'

  setClient: (name: string, phone: string) => void;
  setMain: (id: string | null) => void;
  toggleAddon: (id: string) => void;
  setAddonSingle: (id: string) => void;
  isVerified: () => boolean;
  setWishes: (w: string) => void;
  setDate: (d: string | null) => void;
  setTime: (t: string | null) => void;
  total: () => number;
  hasSelection: () => boolean;
  reset: () => void;
}

const initial = {
  clientName: '',
  clientPhone: '',
  mainId: null as string | null,
  addonIds: [] as string[],
  wishes: '',
  date: null as string | null,
  time: null as string | null,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initial,

  setClient: (clientName, clientPhone) => set({ clientName, clientPhone }),

  // Повторный клик по выбранной основной — снимает выбор (можно «только доп.»).
  setMain: (id) => set((s) => ({ mainId: s.mainId === id ? null : id })),

  toggleAddon: (id) =>
    set((s) => ({
      addonIds: s.addonIds.includes(id)
        ? s.addonIds.filter((x) => x !== id)
        : [...s.addonIds, id],
    })),

  // Одиночный выбор доп. услуги: повторный клик снимает, иначе заменяет выбор.
  setAddonSingle: (id) =>
    set((s) => ({ addonIds: s.addonIds[0] === id ? [] : [id] })),

  isVerified: () => {
    const { clientName, clientPhone } = get();
    return clientName.trim().length >= 2 && clientPhone.replace(/\D/g, '').length === 11;
  },

  setWishes: (wishes) => set({ wishes }),
  setDate: (date) => set({ date, time: null }), // смена даты сбрасывает время
  setTime: (time) => set({ time }),

  total: () => {
    const { mainId, addonIds } = get();
    return calcTotal(mainId, addonIds);
  },

  hasSelection: () => {
    const { mainId, addonIds } = get();
    return Boolean(mainId) || addonIds.length > 0;
  },

  reset: () => set({ ...initial }),
}));
