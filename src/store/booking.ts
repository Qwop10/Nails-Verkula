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
  photos: string[]; // data URL, до 3 фото-референсов
  // Дата/время
  date: string | null; // 'YYYY-MM-DD'
  time: string | null; // 'HH:MM'

  setClient: (name: string, phone: string) => void;
  setPhotos: (photos: string[]) => void;
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

// Сохранённые данные клиента (чтобы авторизоваться один раз).
const LS_NAME = 'nv_client_name';
const LS_PHONE = 'nv_client_phone';
const lsGet = (k: string) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

const initial = {
  clientName: lsGet(LS_NAME),
  clientPhone: lsGet(LS_PHONE),
  mainId: null as string | null,
  addonIds: [] as string[],
  wishes: '',
  photos: [] as string[],
  date: null as string | null,
  time: null as string | null,
};

// Сбрасываем только данные текущей заявки, личность клиента сохраняем.
const bookingOnly = {
  mainId: null as string | null,
  addonIds: [] as string[],
  wishes: '',
  photos: [] as string[],
  date: null as string | null,
  time: null as string | null,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initial,

  setClient: (clientName, clientPhone) => {
    lsSet(LS_NAME, clientName);
    lsSet(LS_PHONE, clientPhone);
    set({ clientName, clientPhone });
  },

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

  setPhotos: (photos) => set({ photos }),
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

  // После отправки заявки сбрасываем выбор, но НЕ разлогиниваем клиента.
  reset: () => set({ ...bookingOnly }),
}));
