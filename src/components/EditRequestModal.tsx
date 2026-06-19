/**
 * components/EditRequestModal.tsx
 * S10 — Мастер правит заявку: состав (основная 0–1 + доп.) и время → пересчёт
 * суммы → «Сохранить и отправить на оплату» (статус → payment_pending).
 */
import React, { useState } from 'react';
import { Button } from './ui';
import {
  MAIN_SERVICES,
  ADDON_SERVICES,
  calcTotal,
} from '../config/services.config';
import {
  updateRequest,
  type MasterRequest,
} from '../services/masterApi';

const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

interface Props {
  request: MasterRequest;
  slots: string[];
  onClose: () => void;
  onSaved: () => void;
}

export const EditRequestModal: React.FC<Props> = ({ request, slots, onClose, onSaved }) => {
  const [mainId, setMainId] = useState<string | null>(request.mainId);
  const [addonIds, setAddonIds] = useState<string[]>(request.addonIds);
  const [time, setTime] = useState(request.time);
  const [busy, setBusy] = useState(false);

  const total = calcTotal(mainId, addonIds);
  const toggleAddon = (id: string) =>
    setAddonIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateRequest(request.id, { mainId, addonIds, time, masterNote: 'Уточнено мастером' });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs border transition-colors ${
      active ? 'bg-brand text-[color:rgb(var(--brand-contrast))] border-brand' : 'text-brand border-brand'
    }`;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-t-2xl p-5 pb-7 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-fg">Изменить заявку</h2>
          <button onClick={onClose} className="text-brand text-lg leading-none" aria-label="Закрыть">
            ✕
          </button>
        </div>
        <p className="text-xs text-muted mb-4">
          {request.clientName} · {request.clientPhone}
        </p>

        <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Основная услуга</p>
        {MAIN_SERVICES.map((s) => (
          <button
            key={s.id}
            onClick={() => setMainId((cur) => (cur === s.id ? null : s.id))}
            className={`w-full flex items-center justify-between rounded-card border px-4 py-2.5 mb-2 ${
              mainId === s.id ? 'border-brand bg-brand/5' : 'border-line'
            }`}
          >
            <span className="text-sm text-fg">{s.label}</span>
            <span className="text-sm text-brand">{fmt(s.price ?? 0)}</span>
          </button>
        ))}

        <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-2">Дополнительно</p>
        {ADDON_SERVICES.map((s) => (
          <button
            key={s.id}
            onClick={() => toggleAddon(s.id)}
            className={`w-full flex items-center justify-between rounded-card border px-4 py-2.5 mb-2 ${
              addonIds.includes(s.id) ? 'border-brand bg-brand/5' : 'border-line'
            }`}
          >
            <span className="text-sm text-fg">{s.label}</span>
            <span className="text-sm text-brand">{fmt(s.price ?? 0)}</span>
          </button>
        ))}

        <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-2">Время</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {slots.map((s) => (
            <button key={s} onClick={() => setTime(s)} className={pill(time === s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="rounded-card bg-card-2 px-4 py-3 mb-4">
          <span className="text-sm text-brand-dark font-medium">Новая сумма: {fmt(total)}</span>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="primary" fullWidth isLoading={busy} onClick={handleSave}>
            Сохранить и отправить на оплату
          </Button>
          <Button variant="ghost" fullWidth disabled={busy} onClick={onClose}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
};
