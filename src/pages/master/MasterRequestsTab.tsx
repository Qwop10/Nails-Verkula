/**
 * pages/master/MasterRequestsTab.tsx
 * Вкладка «Заявки»: статистика, заявки на рассмотрении (одобрить/изменить/отклонить/написать),
 * одобренные, редактор расписания. Состояния loading/empty/error.
 */
import React, { useState, useCallback } from 'react';
import { useAsyncData } from '../../hooks';
import { useNotification } from '../../store';
import { Button } from '../../components/ui';
import { EditRequestModal } from '../../components/EditRequestModal';
import { MasterScheduleEditor } from '../../components/master/MasterScheduleEditor';
import {
  getMasterRequests,
  getStats,
  approveRequest,
  rejectRequest,
  sendClientMessage,
  serviceLabels,
  requestTotal,
  allSlots,
  type MasterRequest,
} from '../../services/masterApi';

const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const prettyDate = (iso: string) => iso.split('-').reverse().join('.');

export const MasterRequestsTab: React.FC = () => {
  const notify = useNotification();
  const [reloadKey, setReloadKey] = useState(0);
  const [editTarget, setEditTarget] = useState<MasterRequest | null>(null);
  const [msgTarget, setMsgTarget] = useState<MasterRequest | null>(null);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const reload = () => setReloadKey((k) => k + 1);

  const reqFetcher = useCallback(() => getMasterRequests(), [reloadKey]);
  const statsFetcher = useCallback(() => getStats(), [reloadKey]);
  const { data: requests, isLoading, error } = useAsyncData<MasterRequest[]>(reqFetcher, [reloadKey]);
  const { data: stats } = useAsyncData(statsFetcher, [reloadKey]);

  const all = requests ?? [];
  const pending = all.filter((r) => r.status === 'pending_review');
  const approved = all.filter((r) => r.status === 'payment_pending' || r.status === 'confirmed');

  const handleApprove = async (r: MasterRequest) => {
    await approveRequest(r.id);
    notify.success('Одобрено — отправлено на оплату');
    reload();
  };
  const handleReject = async (r: MasterRequest) => {
    await rejectRequest(r.id);
    notify.info('Заявка отклонена');
    reload();
  };
  const openMessage = (r: MasterRequest) => { setMsgText(''); setMsgTarget(r); };
  const handleSendMessage = async () => {
    if (!msgTarget || !msgText.trim()) return;
    setSending(true);
    try {
      await sendClientMessage(msgTarget.id, msgText.trim());
      notify.success('Сообщение отправлено клиенту');
      setMsgTarget(null);
      setMsgText('');
    } catch {
      notify.error('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { l: 'Записей', v: stats ? String(stats.today) : '—' },
          { l: 'Новых заявок', v: stats ? String(stats.pending) : '—' },
          { l: 'Выручка', v: stats ? fmt(stats.revenue) : '—' },
        ].map((s) => (
          <div key={s.l} className="rounded-card bg-card border border-line p-3">
            <div className="text-[10px] text-muted">{s.l}</div>
            <div className="font-serif text-base text-fg mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Заявки на рассмотрении</p>

      {isLoading && (
        <div className="rounded-card bg-card border border-line p-4 animate-pulse mb-3">
          <div className="h-3 w-2/3 bg-card-2 rounded mb-2" />
          <div className="h-3 w-1/2 bg-card-2 rounded" />
        </div>
      )}
      {!isLoading && error && (
        <div className="rounded-card bg-card border border-line p-4 text-center mb-3">
          <p className="text-sm text-muted mb-3">Не удалось загрузить заявки</p>
          <Button variant="secondary" onClick={reload}>Повторить</Button>
        </div>
      )}
      {!isLoading && !error && pending.length === 0 && (
        <p className="text-xs text-hint mb-3">Новых заявок нет.</p>
      )}

      {pending.map((r) => (
        <div key={r.id} className="rounded-card bg-card border border-line border-l-2 border-l-brand p-4 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-fg">{r.clientName}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-brand bg-brand/10">
              На рассмотрении
            </span>
          </div>
          <p className="text-xs text-muted">
            {prettyDate(r.date)} · {r.time} · {serviceLabels(r).join(' + ')}
          </p>
          {r.wishes && <p className="text-xs text-hint italic mt-0.5">«{r.wishes}»</p>}
          <p className="text-xs text-brand-dark mt-1">{r.clientPhone}</p>
          <p className="text-xs text-muted mt-0.5 mb-3">Итого: {fmt(requestTotal(r))} · бронь не оплачена</p>

          <div className="flex gap-2 mb-2">
            <Button variant="secondary" size="sm" onClick={() => setEditTarget(r)} className="flex-1">Изменить</Button>
            <Button variant="ghost" size="sm" onClick={() => handleReject(r)} className="flex-1">Отклонить</Button>
            <Button variant="secondary" size="sm" onClick={() => openMessage(r)} className="flex-1">Написать</Button>
          </div>
          <Button variant="primary" size="sm" fullWidth onClick={() => handleApprove(r)}>
            Одобрить и отправить на оплату
          </Button>
        </div>
      ))}

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-2">Одобренные</p>
      {approved.length === 0 && <p className="text-xs text-hint mb-3">Пока нет.</p>}
      {approved.map((r) => (
        <div key={r.id} className="rounded-card bg-card border border-line p-3 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg">{r.clientName}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-brand-dark bg-brand/15">
              {r.bookingPaid ? '✓ Бронь оплачена' : 'Ожидает оплаты'}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {prettyDate(r.date)} · {r.time} · {serviceLabels(r).join(' + ')}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted">{r.bookingPaid ? 'Заработано за услугу' : 'К оплате'}</span>
            <span className="text-sm font-semibold text-brand">{fmt(requestTotal(r))}</span>
          </div>
          <Button variant="secondary" size="sm" fullWidth className="mt-2" onClick={() => openMessage(r)}>
            Написать клиенту
          </Button>
        </div>
      ))}

      <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-4">Расписание по дням</p>
      <MasterScheduleEditor />

      {editTarget && (
        <EditRequestModal
          request={editTarget}
          slots={allSlots()}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            notify.success('Изменения сохранены — отправлено на оплату');
            reload();
          }}
        />
      )}

      {/* Окно «Написать клиенту» */}
      {msgTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => !sending && setMsgTarget(null)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-2xl p-5 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-line mx-auto mb-4" />
            <h2 className="font-serif text-lg text-fg mb-0.5">Сообщение клиенту</h2>
            <p className="text-xs text-muted mb-3">{msgTarget.clientName} · придёт пушем в Telegram</p>
            <textarea
              autoFocus
              rows={4}
              value={msgText}
              maxLength={500}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Напишите сообщение…"
              className="w-full bg-card border border-line rounded-card px-4 py-3 text-sm text-fg placeholder-hint outline-none focus:border-brand resize-none mb-3"
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="md" onClick={() => setMsgTarget(null)} className="flex-1">Отмена</Button>
              <Button
                variant="primary"
                size="md"
                isLoading={sending}
                disabled={!msgText.trim()}
                onClick={handleSendMessage}
                className="flex-1"
              >
                Отправить →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
