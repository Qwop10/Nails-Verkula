/**
 * pages/client/RequestDetail.tsx
 * S5 (оплата брони после одобрения) и S6 (запись подтверждена) — по статусу.
 * Оплата: ЮKassa подключим позже (BRAND.payment.enabled). Пока — демо-подтверждение.
 */
import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useNav, useAsyncData } from '../../hooks';
import { CLIENT_ROUTES } from '../../routes';
import { useNotification } from '../../store';
import { BRAND } from '../../config/brand';
import { Button } from '../../components/ui';
import { getRequest, payBooking, type ClientRequest } from '../../services/requestsApi';

const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const prettyDate = (iso: string) => iso.split('-').reverse().join('.');

export const RequestDetail: React.FC = () => {
  const { id = '' } = useParams();
  const { navigate } = useNav();
  const notify = useNotification();
  const [reloadKey, setReloadKey] = useState(0);
  const [paying, setPaying] = useState(false);

  const fetcher = useCallback(() => getRequest(id), [id, reloadKey]);
  const { data, isLoading, error } = useAsyncData<ClientRequest | null>(fetcher, [id, reloadKey]);

  const handlePay = async () => {
    if (!data) return;
    setPaying(true);
    try {
      const res = await payBooking(data.id);
      if (res.paid) {
        notify.success('Бронь оплачена');
        setReloadKey((k) => k + 1);
      } else {
        notify.info('Открываю оплату…'); // редирект на ЮKassa; подтверждение придёт по вебхуку
      }
    } catch {
      notify.error('Не удалось начать оплату');
    } finally {
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
        <p className="text-sm text-muted">Заявка не найдена</p>
        <Button variant="secondary" onClick={() => navigate(CLIENT_ROUTES.PROFILE)}>
          К моим заявкам
        </Button>
      </div>
    );
  }

  const r = data;

  // ── S6: подтверждено ────────────────────────────────────────────
  if (r.status === 'confirmed') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full bg-card border-2 border-brand flex items-center justify-center mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <polyline points="4,12 9,17 20,7" stroke="rgb(var(--brand))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-serif text-xl text-fg mb-1">Запись оформлена!</h1>
        <p className="text-sm text-muted leading-relaxed mb-5">
          {prettyDate(r.date)} · {r.time}
          <br />
          {r.serviceLabels.join(' + ')}
        </p>

        <div className="w-full rounded-card bg-card-2 px-4 py-3 mb-3 text-left">
          <p className="text-sm font-medium text-brand-dark">Напоминание придёт за 24 часа</p>
          <p className="text-xs text-muted">в ваш Telegram</p>
        </div>

        <div className="w-full rounded-card bg-card border border-line px-4 py-3 mb-5 text-left">
          <Row label="Бронь оплачена" value={`✓ ${fmt(r.bookingFee)}`} />
          <Row label="Остаток на месте" value={fmt(r.total - r.bookingFee)} />
          <Row label="Итого" value={fmt(r.total)} accent />
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(CLIENT_ROUTES.PROFILE)}>
          Готово
        </Button>
      </div>
    );
  }

  // ── S5: оплата брони (одобрено мастером) ────────────────────────
  const canPay = r.status === 'payment_pending';
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="font-serif text-xl text-fg">
        {canPay ? 'Заявка одобрена ✓' : 'Заявка'}
      </h1>
      <p className="text-sm text-muted mb-4">
        {canPay ? `${BRAND.name} подтвердила запись` : 'Детали заявки'}
      </p>

      <div className="rounded-card bg-card border border-brand p-4 mb-3">
        <Row label="Услуги" value={r.serviceLabels.join(' + ')} />
        <Row label="Дата" value={`${prettyDate(r.date)} · ${r.time}`} />
        <Row label="Уточнено мастером" value={r.masterNote ?? 'Без изменений'} />
      </div>

      {canPay && (
        <>
          <div className="rounded-card bg-card border border-brand p-4 text-center mb-3">
            <p className="text-[11px] uppercase tracking-wider text-muted mb-1">К оплате сейчас</p>
            <div className="font-serif text-3xl text-brand my-1">{fmt(r.bookingFee)}</div>
            <p className="text-xs text-muted leading-relaxed">
              Бронь входит в стоимость процедуры. Возврат при отмене не позднее чем за{' '}
              {BRAND.booking.refundHours} ч.
            </p>
          </div>
          <div className="rounded-card bg-card-2 px-4 py-3 mb-1 text-xs text-muted">
            Остаток на месте: {fmt(r.total - r.bookingFee)} · Итого: {fmt(r.total)}
          </div>
          {!BRAND.payment.enabled && (
            <p className="text-[11px] text-hint mb-4 mt-1">
              Оплата ЮKassa подключается отдельно — сейчас демо-режим.
            </p>
          )}
          <div className="mt-auto pt-4">
            <Button variant="primary" size="lg" fullWidth isLoading={paying} onClick={handlePay}>
              Оплатить {fmt(r.bookingFee)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex justify-between py-1">
    <span className="text-xs text-muted">{label}</span>
    <span className={`text-xs text-right ${accent ? 'text-brand font-medium' : 'text-fg'}`}>
      {value}
    </span>
  </div>
);
