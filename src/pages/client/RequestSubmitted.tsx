/**
 * pages/client/RequestSubmitted.tsx
 * S4 — Заявка отправлена и ждёт рассмотрения мастером.
 */
import React, { useEffect, useMemo } from 'react';
import { useNav } from '../../hooks';
import { hideMainButton } from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { useBookingStore } from '../../store';
import { BRAND } from '../../config/brand';
import { Button } from '../../components/ui';
import { getService } from '../../config/services.config';

export const RequestSubmitted: React.FC = () => {
  const { navigate } = useNav();
  const { mainId, addonIds, date, time, total } = useBookingStore();

  useEffect(() => {
    hideMainButton();
  }, []);

  const servicesText = useMemo(() => {
    const parts = [
      mainId ? getService(mainId)?.label : null,
      ...addonIds.map((id) => getService(id)?.label),
    ].filter(Boolean);
    return parts.join(' + ') || '—';
  }, [mainId, addonIds]);

  const dateText = date ? date.split('-').reverse().join('.') : '—';

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-card border-2 border-brand flex items-center justify-center mb-4">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--brand))" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12,7 12,12 15,14" />
        </svg>
      </div>

      <h1 className="font-serif text-xl text-fg mb-1">Заявка отправлена</h1>
      <p className="text-sm text-muted leading-relaxed mb-5">
        {dateText} · {time ?? '—'}
        <br />
        {servicesText}
      </p>

      <div className="w-full rounded-card bg-card border border-brand/50 px-4 py-3 mb-3 text-left">
        <p className="text-sm font-medium text-brand-dark mb-0.5">Мастер рассмотрит заявку</p>
        <p className="text-xs text-muted leading-relaxed">
          {BRAND.name} свяжется с вами в Telegram, уточнит детали и пришлёт ссылку на оплату брони
          {' '}{BRAND.booking.fee} ₽.
        </p>
      </div>

      <div className="w-full rounded-card bg-card border border-line px-4 py-3 mb-5 text-left">
        <div className="flex justify-between py-0.5">
          <span className="text-xs text-muted">Статус</span>
          <span className="text-xs font-medium text-brand">На рассмотрении</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-xs text-muted">Итого</span>
          <span className="text-xs text-fg">{total().toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(CLIENT_ROUTES.PROFILE)}>
          Мои заявки
        </Button>
        <Button variant="ghost" fullWidth onClick={() => navigate(CLIENT_ROUTES.HOME)}>
          На главную
        </Button>
      </div>
    </div>
  );
};
