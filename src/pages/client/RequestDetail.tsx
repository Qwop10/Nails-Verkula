/**
 * pages/client/RequestDetail.tsx
 * S5 (оплата брони после одобрения) и S6 (запись подтверждена) — по статусу.
 * Оплата ручная: клиент переводит бронь по реквизитам и присылает фото чека
 * на проверку мастеру. Мастер подтверждает оплату в своём кабинете.
 */
import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useNav, useAsyncData } from '../../hooks';
import { CLIENT_ROUTES } from '../../routes';
import { useNotification } from '../../store';
import { BRAND } from '../../config/brand';
import { Button } from '../../components/ui';
import { getRequest, submitReceipt, type ClientRequest } from '../../services/requestsApi';

const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const prettyDate = (iso: string) => iso.split('-').reverse().join('.');

/** Сжимает изображение чека в JPEG data URL (≈1200px, q0.7). */
function compressImage(file: File, maxSize = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no ctx'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const RequestDetail: React.FC = () => {
  const { id = '' } = useParams();
  const { navigate } = useNav();
  const notify = useNotification();
  const [reloadKey, setReloadKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState(false);

  const fetcher = useCallback(() => getRequest(id), [id, reloadKey]);
  const { data, isLoading, error } = useAsyncData<ClientRequest | null>(fetcher, [id, reloadKey]);

  const onAddReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setReceipt(compressed);
      setReceiptError(false);
    } catch {
      notify.error('Не удалось добавить фото');
    }
  };

  const copyRequisites = async () => {
    try {
      await navigator.clipboard.writeText(BRAND.booking.requisites.card);
      notify.success('Номер карты скопирован');
    } catch {
      notify.info(BRAND.booking.requisites.card);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!data) return;
    if (!receipt) {
      setReceiptError(true);
      notify.error('Приложите фото чека оплаты');
      return;
    }
    setSending(true);
    try {
      await submitReceipt(data.id, receipt);
      notify.success('Чек отправлен на проверку');
      setReceipt(null);
      setReloadKey((k) => k + 1);
    } catch {
      notify.error('Не удалось отправить чек, попробуйте ещё раз');
    } finally {
      setSending(false);
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

  // ── Чек отправлен, ждём проверки мастером ───────────────────────
  if (r.status === 'receipt_review') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full bg-card border-2 border-brand flex items-center justify-center mb-4">
          <span className="text-2xl">🧾</span>
        </div>
        <h1 className="font-serif text-xl text-fg mb-1">Чек на проверке</h1>
        <p className="text-sm text-muted leading-relaxed mb-5">
          Мы получили ваш чек. Мастер проверит оплату и подтвердит запись —
          уведомление придёт в Telegram.
        </p>
        <div className="w-full rounded-card bg-card border border-line px-4 py-3 mb-5 text-left">
          <Row label="Дата" value={`${prettyDate(r.date)} · ${r.time}`} />
          <Row label="Услуги" value={r.serviceLabels.join(' + ')} />
          <Row label="Бронь" value={fmt(r.bookingFee)} accent />
        </div>
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(CLIENT_ROUTES.PROFILE)}>
          К моим заявкам
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
          <div className="rounded-card bg-card border border-brand p-4 mb-3">
            <p className="text-[11px] uppercase tracking-wider text-muted mb-1 text-center">К оплате сейчас</p>
            <div className="font-serif text-3xl text-brand my-1 text-center">{fmt(r.bookingFee)}</div>

            {/* Реквизиты для перевода */}
            <div className="rounded-tile bg-card-2 border border-line px-3 py-2.5 mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted">Реквизиты</p>
                <p className="text-sm text-fg font-medium tabular-nums break-all">
                  {BRAND.booking.requisites.card}
                </p>
                <p className="text-[11px] text-muted">{BRAND.booking.requisites.bank}</p>
              </div>
              <button
                onClick={copyRequisites}
                className="shrink-0 text-[11px] text-brand border border-brand/50 rounded-full px-3 py-1.5"
              >
                Копировать
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed mt-3">
              Переведите бронь {fmt(r.bookingFee)} по реквизитам выше и приложите фото чека —
              мастер проверит оплату и подтвердит запись.
            </p>
          </div>

          {/* Фото чека оплаты */}
          <p className="text-[11px] uppercase tracking-wider text-muted mb-1">
            Фото чека оплаты <span className="text-red-500">(обязательно!)</span>
          </p>
          {receiptError && (
            <p className="text-[11px] text-red-500 mb-1">Приложите фото чека оплаты</p>
          )}
          <div className="flex gap-2 mb-2">
            {receipt ? (
              <div className="relative w-20 h-20 rounded-tile overflow-hidden border border-line">
                <img src={receipt} alt="чек" className="w-full h-full object-cover" />
                <button
                  onClick={() => setReceipt(null)}
                  className="absolute top-0 right-0 w-5 h-5 bg-black/55 text-white text-xs flex items-center justify-center rounded-bl-md"
                  aria-label="Удалить чек"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                className={`w-20 h-20 rounded-tile border border-dashed flex flex-col items-center justify-center cursor-pointer ${
                  receiptError ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-brand/70 text-brand hover:bg-brand/5'
                }`}
              >
                <span className="text-lg leading-none">＋</span>
                <span className="text-[9px]">чек</span>
                <input type="file" accept="image/*" className="hidden" onChange={onAddReceipt} />
              </label>
            )}
          </div>

          <div className="rounded-card bg-card-2 px-4 py-3 mb-1 text-xs text-muted">
            Остаток на месте: {fmt(r.total - r.bookingFee)} · Итого: {fmt(r.total)}
          </div>

          <div className="mt-auto pt-4">
            <Button variant="primary" size="lg" fullWidth isLoading={sending} onClick={handleSubmitReceipt}>
              Отправить чек на проверку
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
