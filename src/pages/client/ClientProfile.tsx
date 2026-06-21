/**
 * pages/client/ClientProfile.tsx
 * S7 — Профиль: данные клиента, текущая заявка/запись (по статусу — действия),
 * история посещений. Без верификации и портфолио. Все состояния: loading/empty/error.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNav, useAsyncData } from '../../hooks';
import { CLIENT_ROUTES } from '../../routes';
import { useBookingStore, useNotification } from '../../store';
import { Button } from '../../components/ui';
import { CancelModal } from '../../components/CancelModal';
import {
  getMyRequests,
  withdrawRequest,
  type ClientRequest,
} from '../../services/requestsApi';
import { getMyMessages } from '../../services/chatApi';
import {
  REQUEST_STATUS_LABELS,
  isActiveRequest,
  type RequestStatus,
} from '../../config/services.config';

const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const prettyDate = (iso: string) => iso.split('-').reverse().join('.');

const STATUS_TONE: Record<RequestStatus, string> = {
  pending_review: 'text-brand bg-brand/10',
  payment_pending: 'text-brand-dark bg-brand/15',
  receipt_review: 'text-brand-dark bg-brand/15',
  confirmed: 'text-brand-dark bg-brand/15',
  completed: 'text-muted bg-card-2',
  rejected: 'text-muted bg-card-2',
  withdrawn: 'text-muted bg-card-2',
  cancelled: 'text-muted bg-card-2',
};

export const ClientProfile: React.FC = () => {
  const { navigate } = useNav();
  const notify = useNotification();
  const { clientName, clientPhone } = useBookingStore();
  const [reloadKey, setReloadKey] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<ClientRequest | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  // Непрочитанные сообщения от мастера (для точки на кнопке чата).
  useEffect(() => {
    let active = true;
    const check = () => {
      getMyMessages().then((m) => {
        if (!active) return;
        const last = m[m.length - 1];
        let seen = 0;
        try { seen = Number(localStorage.getItem('nv_chat_seen') || '0'); } catch { seen = 0; }
        setHasUnread(!!last && last.sender === 'master' && last.id > seen);
      }).catch(() => {});
    };
    check();
    const t = setInterval(check, 10000);
    return () => { active = false; clearInterval(t); };
  }, []);

  const fetcher = useCallback(() => getMyRequests(), [reloadKey]);
  const { data, isLoading, error } = useAsyncData<ClientRequest[]>(fetcher, [reloadKey]);
  const reload = () => setReloadKey((k) => k + 1);

  const requests = data ?? [];
  // Активная = не терминальная и не завершённая.
  const active = requests.filter((r) => isActiveRequest(r.status) && r.status !== 'completed');
  const history = requests.filter((r) => r.status === 'completed');

  const handleWithdraw = async (r: ClientRequest) => {
    await withdrawRequest(r.id);
    notify.success('Заявка отозвана');
    reload();
  };

  const StatusBadge = ({ status }: { status: RequestStatus }) => (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_TONE[status]}`}>
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );

  const name = clientName || 'Гость';
  const initial = name.trim().charAt(0).toUpperCase() || '·';

  return (
    <div className="flex-1 flex flex-col">
      {/* Шапка профиля */}
      <div className="flex flex-col items-center text-center pt-2 mb-5">
        <div className="w-14 h-14 rounded-full bg-card border-2 border-brand flex items-center justify-center font-serif text-xl text-brand mb-2">
          {initial}
        </div>
        <div className="font-serif text-lg text-fg">{name}</div>
        {clientPhone && <div className="text-xs text-muted mt-0.5">{clientPhone}</div>}
      </div>


      {/* Текущая заявка/запись */}
      <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Моя заявка</p>

      {isLoading && (
        <div className="rounded-card bg-card border border-line p-4 animate-pulse">
          <div className="h-3 w-1/2 bg-card-2 rounded mb-3" />
          <div className="h-3 w-3/4 bg-card-2 rounded mb-2" />
          <div className="h-3 w-1/3 bg-card-2 rounded" />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-card bg-card border border-line p-4 text-center">
          <p className="text-sm text-muted mb-3">Не удалось загрузить заявки</p>
          <Button variant="secondary" onClick={reload}>
            Повторить
          </Button>
        </div>
      )}

      {!isLoading && !error && active.length === 0 && (
        <div className="rounded-card bg-card border border-line p-5 text-center">
          <p className="text-sm text-muted mb-3">Активных заявок пока нет</p>
          <Button variant="primary" onClick={() => navigate(CLIENT_ROUTES.HOME)}>
            Записаться
          </Button>
        </div>
      )}

      {!isLoading &&
        !error &&
        active.map((r) => (
          <div key={r.id} className="rounded-card bg-card border border-brand p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-fg">
                {prettyDate(r.date)} · {r.time}
              </span>
              <StatusBadge status={r.status} />
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-xs text-muted">Услуга</span>
              <span className="text-xs text-fg text-right">{r.serviceLabels.join(' + ')}</span>
            </div>
            {r.wishes && (
              <div className="py-0.5">
                <span className="text-xs text-muted">Пожелания</span>
                <p className="text-xs text-fg break-words [overflow-wrap:anywhere] whitespace-pre-wrap mt-0.5">{r.wishes}</p>
              </div>
            )}
            <div className="flex justify-between py-0.5">
              <span className="text-xs text-muted">Бронь</span>
              <span className="text-xs text-fg text-right">
                {r.bookingPaid ? `✓ ${fmt(r.bookingFee)}` : 'Ожидает оплаты'}
              </span>
            </div>
            <div className="font-serif text-lg text-brand mt-1">{fmt(r.total)}</div>

            {/* Чат с мастером — доступен только в рамках заявки */}
            <button
              onClick={() => navigate(CLIENT_ROUTES.CHAT)}
              className="w-full flex items-center gap-2 rounded-tile bg-card-2 border border-line px-3 py-2 mt-3 hover:bg-brand/5 transition-colors"
            >
              <span className="relative">💬{hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />}</span>
              <span className="text-sm text-fg flex-1 text-left">Чат с мастером{hasUnread && <span className="text-red-500"> • новое</span>}</span>
              <span className="text-brand">›</span>
            </button>

            <div className="mt-2">
              {r.status === 'pending_review' && (
                <Button variant="ghost" fullWidth onClick={() => handleWithdraw(r)}>
                  Отозвать заявку
                </Button>
              )}
              {r.status === 'payment_pending' && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate(`/requests/${r.id}`)}
                >
                  Оплатить бронь {fmt(r.bookingFee)}
                </Button>
              )}
              {r.status === 'receipt_review' && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate(`/requests/${r.id}`)}
                >
                  Чек на проверке у мастера
                </Button>
              )}
              {r.status === 'confirmed' && (
                <Button variant="ghost" fullWidth onClick={() => setCancelTarget(r)}>
                  Отменить запись
                </Button>
              )}
            </div>
          </div>
        ))}

      {/* История */}
      <p className="text-[11px] uppercase tracking-wider text-muted mb-2 mt-3">История посещений</p>
      {!isLoading && !error && history.length === 0 && (
        <p className="text-xs text-hint">Здесь появятся завершённые записи.</p>
      )}
      {history.length > 0 && (
        <div className="rounded-card bg-card border border-line divide-y divide-line">
          {history.map((r) => (
            <div key={r.id} className="flex justify-between items-center px-4 py-2.5">
              <div>
                <div className="text-sm text-fg">{r.serviceLabels.join(' + ')}</div>
                <div className="text-xs text-hint">{prettyDate(r.date)}</div>
              </div>
              <div className="text-sm font-medium text-muted">{fmt(r.total)}</div>
            </div>
          ))}
        </div>
      )}

      {cancelTarget && (
        <CancelModal
          request={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            setCancelTarget(null);
            notify.success('Запись отменена');
            reload();
          }}
        />
      )}
    </div>
  );
};
