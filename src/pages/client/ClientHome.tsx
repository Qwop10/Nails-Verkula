/**
 * pages/client/ClientHome.tsx
 * S1 — Онбординг: приветствие + имя/телефон (обязательны) + заметка про бронь.
 */
import React, { useEffect, useState } from 'react';
import { useNav } from '../../hooks';
import { hideMainButton, hideBackButton, selectionHaptic } from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { useBookingStore, useAppStore } from '../../store';
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

export const ClientHome: React.FC = () => {
  const { navigate } = useNav();
  const { clientName, clientPhone, setClient } = useBookingStore();
  const telegramUser = useAppStore((s) => s.telegramUser);

  // Имя — автозаполняется из Telegram, если клиент ещё не вводил.
  const tgFullName = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ')
    : '';
  const tgUsername = telegramUser?.username ? '@' + telegramUser.username : '';

  const [name, setName] = useState(clientName || tgFullName);
  const [phone, setPhone] = useState(clientPhone);

  useEffect(() => {
    hideBackButton();
    hideMainButton();
  }, []);

  // Подставить имя из Telegram, когда данные подгрузятся (если поле ещё пустое).
  useEffect(() => {
    if (!name && tgFullName) setName(tgFullName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tgFullName]);

  const phoneDigits = phone.replace(/\D/g, '');
  const isValid = name.trim().length >= 2 && phoneDigits.length === 11;

  const handleContinue = () => {
    if (!isValid) return;
    selectionHaptic();
    setClient(name.trim(), phone.trim());
    navigate(CLIENT_ROUTES.CATALOG);
  };

  const inputCls =
    'w-full bg-card border border-line rounded-card px-4 py-3 text-[15px] text-fg placeholder-hint outline-none focus:border-brand transition-colors';

  return (
    <div className="flex-1 flex flex-col justify-center relative overflow-hidden">
      <FloralDecor />
      {/* Заголовок */}
      <div className="text-center pt-2">
        <h1 className="font-serif text-2xl text-fg">Добро пожаловать</h1>
        <p className="text-sm text-muted italic mt-0.5">{BRAND.name}</p>
      </div>

      {/* Форма — все поля обязательны */}
      <div className="mt-6 flex flex-col gap-3">
        <input
          className={inputCls}
          placeholder="Имя и фамилия"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={40}
        />
        {/* @username — заполняется автоматически из Telegram, только для чтения */}
        <div className="relative">
          <input
            className={`${inputCls} ${tgUsername ? 'text-muted' : ''} pr-10`}
            placeholder="@username — заполняется автоматически"
            value={tgUsername}
            readOnly
          />
          {tgUsername && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand">✓</span>
          )}
        </div>
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
      <div className="mt-4 flex items-center gap-2 px-1">
        <span className="text-brand text-sm">ⓘ</span>
        <p className="text-xs text-brand-dark leading-relaxed">
          Для всех клиентов при записи взимается бронь {BRAND.booking.fee} ₽
        </p>
      </div>

      <div className="mt-6">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isValid}
          onClick={handleContinue}
        >
          Продолжить →
        </Button>
      </div>
    </div>
  );
};
