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
import { getProfile } from '../../services/requestsApi';

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

  // Автозаполнение из сохранённого профиля (имя/телефон с прошлой записи).
  // Если профиль полный — сразу «авторизуем» клиента (разблокируем вкладки),
  // чтобы не вводить данные повторно.
  useEffect(() => {
    if (clientName && clientPhone) return; // уже авторизован (localStorage)
    let active = true;
    getProfile()
      .then((p) => {
        if (!active || !p.name || !p.phone) return;
        const formatted = formatPhone(p.phone);
        setName((cur) => cur || p.name);
        setPhone((cur) => cur || formatted);
        if (p.name.trim().length >= 2 && p.phone.replace(/\D/g, '').length === 11) {
          setClient(p.name, formatted);
        }
      })
      .catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phoneDigits = phone.replace(/\D/g, '');
  const isValid = name.trim().length >= 2 && phoneDigits.length === 11;
  // Телефон вводится один раз; сменить можно только после подтверждения.
  const [phoneUnlocked, setPhoneUnlocked] = useState(false);
  const phoneSaved = clientPhone.replace(/\D/g, '').length === 11;
  const phoneLocked = phoneSaved && !phoneUnlocked;

  const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  const CHANGED_KEY = 'nv_phone_changed_at';

  const requestPhoneChange = () => {
    const tg = (window as unknown as { Telegram?: { WebApp?: { showConfirm?: (m: string, cb: (ok: boolean) => void) => void; showAlert?: (m: string) => void } } }).Telegram?.WebApp;
    let last = 0;
    try { last = Number(localStorage.getItem(CHANGED_KEY) || '0'); } catch { last = 0; }
    // Лимит: менять номер можно раз в месяц.
    if (last && Date.now() - last < MONTH_MS) {
      const next = new Date(last + MONTH_MS).toLocaleDateString('ru-RU');
      const m = `Менять номер можно раз в месяц. Следующая смена будет доступна ${next}.`;
      if (tg?.showAlert) tg.showAlert(m); else window.alert(m);
      return;
    }
    const msg = 'Изменить номер телефона? Сменить его снова можно будет только через месяц.';
    if (tg?.showConfirm) tg.showConfirm(msg, (ok) => { if (ok) setPhoneUnlocked(true); });
    else if (window.confirm(msg)) setPhoneUnlocked(true);
  };

  const handleContinue = () => {
    if (!isValid) return;
    // Если меняли номер — фиксируем дату смены (для лимита «раз в месяц»).
    if (phoneUnlocked && phone.trim() !== clientPhone.trim()) {
      try { localStorage.setItem(CHANGED_KEY, String(Date.now())); } catch { /* ignore */ }
    }
    selectionHaptic();
    setClient(name.trim(), phone.trim());
    navigate(CLIENT_ROUTES.CATALOG);
  };

  const inputCls =
    'w-full bg-card border border-line rounded-card px-4 py-3 text-[15px] text-fg placeholder-hint outline-none focus:border-brand transition-colors';

  return (
    <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden px-1">
      <FloralDecor />

      {/* Флакончики лака (как в оригинале) */}
      <div className="flex items-end justify-center gap-1.5 mb-4">
        <svg width="14" height="20" viewBox="0 0 11 16"><rect x="1" y="5" width="9" height="10" rx="4.5" fill="#f5ead0" /><rect x="2" y="1" width="7" height="6" rx="3.5" fill="#b8922a" /><ellipse cx="5.5" cy="5" rx="2.5" ry="1.4" fill="#fff0d0" opacity=".8" /></svg>
        <svg width="17" height="24" viewBox="0 0 13 19"><rect x="1" y="6" width="11" height="12" rx="5.5" fill="#ede0b8" /><rect x="2" y="1" width="9" height="8" rx="4.5" fill="#9a7020" /><ellipse cx="6.5" cy="6" rx="3" ry="1.6" fill="#fff8e8" opacity=".8" /></svg>
        <svg width="20" height="28" viewBox="0 0 15 22"><rect x="1" y="7" width="13" height="14" rx="6.5" fill="#f0d888" /><rect x="2" y="1" width="11" height="9" rx="5.5" fill="#c9a84c" /><ellipse cx="7.5" cy="7" rx="3.5" ry="2" fill="#fff8e8" opacity=".8" /></svg>
        <svg width="17" height="24" viewBox="0 0 13 19"><rect x="1" y="6" width="11" height="12" rx="5.5" fill="#ede0b8" /><rect x="2" y="1" width="9" height="8" rx="4.5" fill="#9a7020" /><ellipse cx="6.5" cy="6" rx="3" ry="1.6" fill="#fff8e8" opacity=".8" /></svg>
        <svg width="14" height="20" viewBox="0 0 11 16"><rect x="1" y="5" width="9" height="10" rx="4.5" fill="#f5ead0" /><rect x="2" y="1" width="7" height="6" rx="3.5" fill="#b8922a" /><ellipse cx="5.5" cy="5" rx="2.5" ry="1.4" fill="#fff0d0" opacity=".8" /></svg>
      </div>

      {/* Заголовок */}
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#1a1208', marginBottom: 4 }}>
        Добро пожаловать
      </div>
      <div style={{ fontSize: 12, color: '#b09050', marginBottom: 20, fontStyle: 'italic' }}>
        {BRAND.name}
      </div>

      {/* Форма — все поля обязательны */}
      <div className="w-full flex flex-col gap-2.5">
        <input
          className={inputCls}
          placeholder="Имя и фамилия"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={20}
        />
        {/* @username — заполняется автоматически из Telegram, только для чтения */}
        <div className="relative">
          <input
            className={`${inputCls} pr-10`}
            placeholder="@username — заполняется автоматически"
            value={tgUsername}
            readOnly
          />
          {tgUsername && (
            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="relative">
          <input
            className={`${inputCls} ${phoneLocked ? 'pr-10 text-muted' : ''}`}
            placeholder="+7 (___) ___-__-__"
            value={phone}
            onChange={(e) => { if (!phoneLocked) setPhone(formatPhone(e.target.value)); }}
            inputMode="tel"
            autoComplete="tel"
            maxLength={18}
            readOnly={phoneLocked}
          />
          {phoneLocked && (
            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        {phoneLocked && (
          <button
            type="button"
            onClick={requestPhoneChange}
            className="self-start text-[11px] text-brand underline -mt-1"
          >
            Изменить номер
          </button>
        )}
      </div>

      {/* Заметка про бронь */}
      <div style={{ marginTop: 14, width: '100%', background: '#fdf8ee', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="6" cy="6" r="5" stroke="#9b6db5" strokeWidth="1" />
          <rect x="5.4" y="3" width="1.2" height="4" rx=".6" fill="#9b6db5" />
          <rect x="5.4" y="8" width="1.2" height="1.2" rx=".6" fill="#9b6db5" />
        </svg>
        <span style={{ fontSize: 11, color: '#7a4098', lineHeight: 1.5 }}>
          Для всех клиентов при записи взимается бронь {BRAND.booking.fee} ₽
        </span>
      </div>

      <div className="mt-4 w-full">
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
