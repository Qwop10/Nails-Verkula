/**
 * pages/master/MasterServicesTab.tsx
 * Вкладка «Услуги»: правка цены, вкл/выкл, добавление/удаление, сумма брони.
 * Изменения применяются сразу (мок-API; на бэкенде — те же вызовы).
 */
import React, { useState, useCallback } from 'react';
import { useAsyncData } from '../../hooks';
import { Button } from '../../components/ui';
import { useNotification } from '../../store';
import {
  getServices,
  setServicePrice,
  toggleServiceActive,
  addServiceItem,
  removeServiceItem,
  setBookingFee,
  type ServiceItem,
} from '../../services/masterApi';

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 3h10M4.5 3V2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M4.5 5.5v4M8.5 5.5v4M2.5 3l.6 7a.5.5 0 0 0 .5.5h5.8a.5.5 0 0 0 .5-.5l.6-7" />
  </svg>
);

export const MasterServicesTab: React.FC = () => {
  const notify = useNotification();
  const [reloadKey, setReloadKey] = useState(0);
  const [addKind, setAddKind] = useState<'main' | 'addon' | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const fetcher = useCallback(() => getServices(), [reloadKey]);
  const { data, isLoading } = useAsyncData(fetcher, [reloadKey]);
  const reload = () => setReloadKey((k) => k + 1);

  const services = data?.services ?? [];
  const fee = data?.bookingFee ?? 500;

  const onPrice = async (id: string, v: string) => {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) await setServicePrice(id, n);
    reload();
  };
  const onToggle = async (id: string) => { await toggleServiceActive(id); reload(); };
  const onRemove = async (id: string) => { await removeServiceItem(id); reload(); };
  const onAdd = async () => {
    if (!addKind || !newName.trim()) return;
    await addServiceItem(addKind, newName.trim(), parseInt(newPrice, 10) || 0);
    setNewName(''); setNewPrice(''); setAddKind(null); reload();
  };
  const onFee = async (v: string) => {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) await setBookingFee(n);
    reload();
  };

  // Строка одной услуги: название, цена/«входит в стоимость», тоггл, корзина.
  const Row = ({ s }: { s: ServiceItem }) => (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-fg">{s.label}</div>
        {s.kind === 'auto' ? (
          <div className="text-xs text-hint italic mt-1">входит в стоимость</div>
        ) : (
          <div className="flex items-center gap-1.5 mt-1.5">
            <input
              type="number"
              defaultValue={s.price ?? 0}
              onBlur={(e) => onPrice(s.id, e.target.value)}
              className="w-20 bg-card border border-line rounded-tile px-2.5 py-1.5 text-sm text-fg outline-none focus:border-brand"
            />
            <span className="text-xs text-muted">₽</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onToggle(s.id)}
        role="switch"
        aria-checked={s.active}
        className={`w-10 h-6 rounded-full relative shrink-0 transition-colors ${
          s.active ? 'bg-brand' : 'bg-card-2 border border-line'
        }`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${s.active ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      <button
        onClick={() => onRemove(s.id)}
        aria-label="Удалить"
        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-tile border text-hint hover:text-red-500 hover:border-red-300 transition-colors"
        style={{ borderColor: '#ecdff0' }}
      >
        <TrashIcon />
      </button>
    </div>
  );

  const AddBlock = ({ kind }: { kind: 'main' | 'addon' }) =>
    addKind === kind ? (
      <div className="rounded-card bg-card border border-brand/50 p-3 mt-2 flex flex-col gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Название услуги"
          className="bg-card border border-line rounded-tile px-3 py-2 text-sm text-fg outline-none focus:border-brand"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Цена"
            className="w-24 bg-card border border-line rounded-tile px-3 py-2 text-sm text-fg outline-none focus:border-brand"
          />
          <span className="text-xs text-muted">₽</span>
          <Button variant="primary" size="sm" onClick={onAdd} className="ml-auto">Добавить</Button>
          <Button variant="ghost" size="sm" onClick={() => setAddKind(null)}>Отмена</Button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => setAddKind(kind)}
        className="w-full mt-2 py-3 rounded-card border border-dashed border-brand/70 text-brand text-sm hover:bg-brand/5 transition-colors"
      >
        + Добавить услугу
      </button>
    );

  if (isLoading && !data) {
    return <div className="flex-1 px-6 py-5"><div className="h-40 rounded-card bg-card border border-line animate-pulse" /></div>;
  }

  const mainItems = services.filter((s) => s.kind === 'main');
  const addonItems = services.filter((s) => s.kind === 'addon' || s.kind === 'auto');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Основные услуги */}
        <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Основные услуги</p>
        <div className="rounded-card bg-card border border-line divide-y divide-line">
          {mainItems.map((s) => <Row key={s.id} s={s} />)}
        </div>
        <AddBlock kind="main" />

        {/* Дополнительные услуги (вкл. «входит в стоимость») */}
        <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-5">Дополнительные услуги</p>
        <div className="rounded-card bg-card border border-line divide-y divide-line">
          {addonItems.map((s) => <Row key={s.id} s={s} />)}
        </div>
        <AddBlock kind="addon" />

        {/* Бронь */}
        <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-5">Бронь</p>
        <div className="rounded-card bg-card border border-line px-4 py-3 flex items-center gap-2">
          <span className="text-sm text-fg flex-1">Сумма бронирования</span>
          <input
            type="number"
            defaultValue={fee}
            onBlur={(e) => onFee(e.target.value)}
            className="w-20 bg-card border border-line rounded-tile px-2.5 py-1.5 text-sm text-fg outline-none focus:border-brand"
          />
          <span className="text-xs text-muted">₽</span>
        </div>
      </div>

      {/* Сохранить изменения */}
      <div className="px-6 py-3 border-t border-line bg-card/70 backdrop-blur-xl">
        <Button variant="primary" size="lg" fullWidth onClick={() => notify.success('Изменения сохранены')}>
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
};
