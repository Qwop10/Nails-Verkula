/**
 * pages/client/ClientHome.tsx
 * S1 — Онбординг: приветствие + имя/телефон (обязательны) + заметка про бронь.
 */
import React, { useEffect, useState } from 'react';
import { useNav } from '../../hooks';
import { hideMainButton, hideBackButton, selectionHaptic } from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { useNotification, useBookingStore } from '../../store';
import { BRAND } from '../../config/brand';
import { Button } from '../../components/ui';
import { FloralDecor } from '../../components/FloralDecor';

/** Маска телефона +7 (XXX) XXX-XX-XX. */
function formatPhone(value: string): string {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d && !d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  if (!d) return '';
  let out = '+7';
  if (d.length > 1) out += ' (' + d.slice(1, 4);
  if (d.length > 4) out += ') ' + d.slice(4, 7);
  if (d.length > 7) out += '-' + d.slice(7, 9);
  if (d.length > 9) out += '-' + d.slice(9, 11);
  return out;
}

const PROCESS = [
  'Выберите услуги и удобное время',
  'Мастер рассмотрит заявку и подтвердит',
  'Бронь оплачивается онлайн после одобрения',
];

export const ClientHome: React.FC = () => {
  const { navigate } = useNav();
  const notify = useNotification();
  const { clientName, clientPhone, setClient } = useBookingStore();
  const [name, setName] = useState(clientName);
  const [phone, setPhone] = useState(clientPhone);

  useEffect(() => {
    hideBackButton();
    hideMainButton();
  }, []);

  const handleContinue = () => {
    if (name.trim().length < 2) {
      notify.error('Укажите имя и фамилию');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      notify.error('Укажите корректный номер телефона');
      return;
    }
    selectionHaptic();
    setClient(name.trim(), phone.trim());
    navigate(CLIENT_ROUTES.CATALOG);
  };

  const inputCls =
    'w-full bg-card border border-line rounded-card px-4 py-3 text-[15px] text-fg placeholder-hint outline-none focus:border-brand transition-colors';

  return (
    <div className="flex-1 flex flex-col justify-center relative overflow-hidden">
      <FloralDecor />
      {/* Логотип / заголовок */}
      <div className="text-center pt-2">
        <h1 className="font-serif text-2xl text-fg">{BRAND.name}</h1>
        <p className="text-sm text-muted italic mt-0.5">{BRAND.tagline}</p>
      </div>

      {/* Процесс */}
      <div className="mt-6 rounded-card bg-card border border-line p-4">
        {PROCESS.map((t, i) => (
          <div key={i} className="flex items-start gap-3 py-1.5">
            <span className="shrink-0 w-6 h-6 rounded-full bg-brand/15 text-brand text-xs flex items-center justify-center font-medium">
              {i + 1}
            </span>
            <p className="text-sm text-fg pt-0.5">{t}</p>
          </div>
        ))}
      </div>

      {/* Форма */}
      <div className="mt-5 flex flex-col gap-3">
        <input
          className={inputCls}
          placeholder="Имя и фамилия"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <input
          className={inputCls}
          placeholder="+7 (000) 000-00-00"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          inputMode="tel"
          autoComplete="tel"
        />
      </div>

      {/* Заметка про бронь */}
      <div className="mt-4 rounded-card bg-card border border-brand/50 px-4 py-3">
        <p className="text-xs text-brand-dark leading-relaxed">
          При записи взимается бронь {BRAND.booking.fee} ₽ — входит в стоимость процедуры.
          Возврат при отмене не позднее чем за {BRAND.booking.refundHours} ч.
        </p>
      </div>

      <div className="mt-6">
        <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
          Продолжить →
        </Button>
      </div>
    </div>
  );
};
