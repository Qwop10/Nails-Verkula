/**
 * pages/master/MasterServicesTab.tsx
 * Вкладка «Услуги»: правка цены, вкл/выкл, добавление/удаление, сумма брони.
 * Изменения применяются сразу (мок-API; на бэкенде — те же вызовы).
 */
import React, { useState, useCallback } from 'react';
import { useAsyncData } from '../../hooks';
import { Button } from '../../components/ui';
import {
  getServices,
  setServicePrice,
  toggleServiceActive,
  addServiceItem,
  removeServiceItem,
  setBookingFee,
  type ServiceItem,
} from '../../services/masterApi';

export const MasterServicesTab: React.FC = () => {
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

  const Group = ({ title, kind }: { title: string; kind: 'main' | 'addon' | 'auto' }) => (
    <>
      <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-3">{title}</p>
      <div className="rounded-card bg-card border border-line divide-y divide-line">
        {services.filter((s) => s.kind === kind).map((s: ServiceItem) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-fg">{s.label}</div>
              {s.kind === 'auto' ? (
                <div className="text-xs text-hint italic">входит в стоимость</div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    defaultValue={s.price ?? 0}
                    onBlur={(e) => onPrice(s.id, e.target.value)}
                    className="w-24 bg-card-2 border border-line rounded-tile px-2 py-1 text-sm text-fg outline-none focus:border-brand"
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
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${s.active ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            {s.kind !== 'auto' && (
              <button onClick={() => onRemove(s.id)} aria-label="Удалить" className="text-hint hover:text-red-500 shrink-0">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {kind !== 'auto' && (
        addKind === kind ? (
          <div className="rounded-card bg-card border border-brand/50 p-3 mt-2 flex flex-col gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название услуги"
              className="bg-card-2 border border-line rounded-tile px-3 py-2 text-sm text-fg outline-none focus:border-brand"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Цена"
                className="w-24 bg-card-2 border border-line rounded-tile px-3 py-2 text-sm text-fg outline-none focus:border-brand"
              />
              <span className="text-xs text-muted">₽</span>
              <Button variant="primary" size="sm" onClick={onAdd} className="ml-auto">Добавить</Button>
              <Button variant="ghost" size="sm" onClick={() => setAddKind(null)}>Отмена</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddKind(kind)}
            className="w-full mt-2 py-2.5 rounded-card border border-dashed border-brand text-brand text-sm"
          >
            + Добавить услугу
          </button>
        )
      )}
    </>
  );

  if (isLoading && !data) {
    return <div className="flex-1 px-6 py-5"><div className="h-40 rounded-card bg-card border border-line animate-pulse" /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <Group title="Основные услуги" kind="main" />
      <Group title="Дополнительные услуги" kind="addon" />
      <Group title="Входит в стоимость" kind="auto" />

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-3">Бронь</p>
      <div className="rounded-card bg-card border border-line px-4 py-3 flex items-center gap-2">
        <span className="text-sm text-fg flex-1">Сумма бронирования</span>
        <input
          type="number"
          defaultValue={fee}
          onBlur={(e) => onFee(e.target.value)}
          className="w-24 bg-card-2 border border-line rounded-tile px-2 py-1 text-sm text-fg outline-none focus:border-brand"
        />
        <span className="text-xs text-muted">₽</span>
      </div>
    </div>
  );
};
