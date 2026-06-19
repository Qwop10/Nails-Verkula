/**
 * components/CancelModal.tsx
 * Подтверждение отмены записи. Бронь возвращается только при отмене
 * не позднее чем за BRAND.booking.refundHours часов до записи.
 */
import React, { useState } from 'react';
import { BRAND } from '../config/brand';
import { cancelRequest, type ClientRequest } from '../services/requestsApi';
import { Button } from './ui';

interface CancelModalProps {
  request: ClientRequest;
  onClose: () => void;
  onCancelled: () => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({ request, onClose, onCancelled }) => {
  const [busy, setBusy] = useState(false);

  const appt = new Date(`${request.date}T${request.time}:00`);
  const hoursLeft = (appt.getTime() - Date.now()) / 3_600_000;
  const refundable = hoursLeft >= BRAND.booking.refundHours;
  const prettyDate = `${request.date.split('-').reverse().join('.')} · ${request.time}`;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await cancelRequest(request.id);
      onCancelled();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-t-2xl p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-8 h-1 rounded-full bg-brand/50 mx-auto mb-4" />
        <h2 className="font-serif text-lg text-fg mb-1">Отменить запись?</h2>
        <p className="text-sm text-muted mb-3">
          <span className="text-fg font-medium">{prettyDate}</span> — {request.serviceLabels.join(' + ')}
        </p>

        <div
          className={`rounded-card px-4 py-3 mb-4 text-xs leading-relaxed ${
            refundable
              ? 'bg-card-2 text-muted'
              : 'bg-brand/10 border border-brand/50 text-brand-dark'
          }`}
        >
          {refundable ? (
            <>До записи более {BRAND.booking.refundHours} ч — бронь {request.bookingFee} ₽ вернётся.</>
          ) : (
            <>
              <b>Внимание:</b> до записи менее {BRAND.booking.refundHours} ч — бронь{' '}
              {request.bookingFee} ₽ не возвращается.
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="danger" fullWidth isLoading={busy} onClick={handleConfirm}>
            Да, отменить запись
          </Button>
          <Button variant="ghost" fullWidth disabled={busy} onClick={onClose}>
            Нет, оставить запись
          </Button>
        </div>
      </div>
    </div>
  );
};
