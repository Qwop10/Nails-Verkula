/**
 * pages/client/NailsCatalog.tsx
 * S2 — Каталог услуг: основная (0–1) + дополнительные (0–many) + пожелания + итог.
 */
import React, { useEffect } from 'react';
import { useNav } from '../../hooks';
import { hideMainButton, selectionHaptic } from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { useBookingStore, useNotification } from '../../store';
import { Button } from '../../components/ui';
import {
  MAIN_SERVICES,
  ADDON_SERVICES,
  AUTO_SERVICES,
  getService,
  shortLabel,
  type NailService,
} from '../../config/services.config';

const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

/** Сжимает изображение в JPEG data URL (≈1000px, q0.7) — чтобы не раздувать запрос. */
function compressImage(file: File, maxSize = 1000, quality = 0.7): Promise<string> {
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

export const NailsCatalog: React.FC = () => {
  const { navigate } = useNav();
  const notify = useNotification();
  const { mainId, addonIds, wishes, photos, setMain, setAddonSingle, setWishes, setPhotos, total, hasSelection } =
    useBookingStore();

  // Сводка выбора: «Комб. маникюр + Дизайн — 1 800 ₽»
  const mainSvc = mainId ? getService(mainId) : null;
  const addonSvc = addonIds[0] ? getService(addonIds[0]) : null;
  const summaryParts = [
    mainSvc ? shortLabel(mainSvc.label) : null,
    addonSvc ? addonSvc.label : null,
  ].filter(Boolean);
  const summaryText = summaryParts.join(' + ');

  useEffect(() => {
    hideMainButton();
  }, []);

  const handleNext = () => {
    if (!hasSelection()) {
      notify.error('Выберите хотя бы одну услугу');
      return;
    }
    selectionHaptic();
    navigate(CLIENT_ROUTES.DATETIME);
  };

  const onAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // позволяем выбрать тот же файл снова
    const free = 3 - photos.length;
    if (free <= 0) { notify.error('Можно прикрепить максимум 3 фото'); return; }
    try {
      const added = await Promise.all(files.slice(0, free).map((f) => compressImage(f)));
      setPhotos([...photos, ...added]);
    } catch {
      notify.error('Не удалось добавить фото');
    }
  };
  const removePhoto = (i: number) => setPhotos(photos.filter((_, idx) => idx !== i));

  const Row = ({ s, selected }: { s: NailService; selected: boolean }) => (
    <button
      onClick={() => (s.kind === 'main' ? setMain(s.id) : setAddonSingle(s.id))}
      className={`w-full text-left flex items-center gap-3 rounded-card border px-4 py-3 mb-2 transition-colors ${
        selected ? 'border-brand bg-brand/5' : 'border-line bg-card hover:bg-card-2'
      }`}
    >
      <div className="flex-1">
        <div className="text-sm text-fg">{s.label}</div>
        {s.price != null ? (
          <div className="text-sm font-medium text-brand">{fmt(s.price)}</div>
        ) : (
          <div className="text-xs text-hint italic">{s.note}</div>
        )}
      </div>
      <span
        className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center border ${
          selected ? 'bg-brand border-brand' : 'border-brand/60'
        }`}
      >
        {selected && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <polyline
              points="2,6 4.5,8.5 9,3"
              stroke="rgb(var(--brand-contrast))"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(CLIENT_ROUTES.HOME)}
          className="text-brand text-2xl leading-none -ml-1 px-1"
          aria-label="Назад на главную"
        >
          ‹
        </button>
        <h1 className="font-serif text-xl text-fg">Выберите услугу</h1>
      </div>
      <p className="text-sm text-muted mb-4">до 2: 1 основная + 1 дополнительная</p>

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
        Основные — выберите 1
      </p>
      {MAIN_SERVICES.map((s) => (
        <Row key={s.id} s={s} selected={mainId === s.id} />
      ))}

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-3">
        Дополнительно — выберите 1
      </p>
      {ADDON_SERVICES.map((s) => (
        <Row key={s.id} s={s} selected={addonIds.includes(s.id)} />
      ))}

      {AUTO_SERVICES.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between rounded-card border border-line bg-card-2 px-4 py-2.5 mb-2 opacity-80"
        >
          <span className="text-sm text-fg">{s.label}</span>
          <span className="text-xs text-hint italic">{s.note}</span>
        </div>
      ))}

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-3">Пожелания</p>
      <textarea
        className="w-full bg-card border border-line rounded-card px-4 py-3 text-sm text-fg placeholder-hint outline-none focus:border-brand transition-colors resize-none"
        rows={2}
        placeholder="Нюдовый дизайн, короткая длина…"
        value={wishes}
        onChange={(e) => setWishes(e.target.value)}
      />

      {/* Фото состояния ногтей (до 3) */}
      <p className="text-[11px] uppercase tracking-wider text-muted mb-1 mt-3">Фото ваших ногтей (по желанию)</p>
      <p className="text-[11px] text-hint mb-2">Сфотографируйте ногти, чтобы мастер видел текущее состояние и объём работы.</p>
      <div className="flex gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative w-16 h-16 rounded-tile overflow-hidden border border-line">
            <img src={src} alt={`фото ${i + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-0 right-0 w-5 h-5 bg-black/55 text-white text-xs flex items-center justify-center rounded-bl-md"
              aria-label="Удалить фото"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < 3 && (
          <label className="w-16 h-16 rounded-tile border border-dashed border-brand/70 flex flex-col items-center justify-center text-brand cursor-pointer hover:bg-brand/5">
            <span className="text-lg leading-none">＋</span>
            <span className="text-[9px]">фото</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onAddPhotos} />
          </label>
        )}
      </div>

      {summaryText && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-brand-dark">{summaryText}</span>
          <span className="text-sm font-medium text-brand whitespace-nowrap">{fmt(total())}</span>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-muted">Итого</span>
        <span className="font-serif text-xl text-brand">{fmt(total())}</span>
      </div>
      <div className="mt-3">
        <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
          Выбрать дату →
        </Button>
      </div>
    </div>
  );
};
