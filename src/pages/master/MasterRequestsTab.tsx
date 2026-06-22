/**
 * pages/master/MasterRequestsTab.tsx
 * Вкладка «Заявки»: статистика, режим «Заболела», вкладки по статусам
 * (На рассмотрении / Ожидают оплаты / Чек на проверке / Подтверждённые / Возврат),
 * сортировка по дате записи (ближайшие сверху), редактор расписания.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAsyncData } from '../../hooks';
import { getClientMessages, sendToClient, getConversations, type ChatMessage, type Conversation } from '../../services/chatApi';

const SEEN_KEY = 'nv_master_seen';
const readSeen = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; } };
const writeSeen = (m: Record<string, string>) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(m)); } catch { /* ignore */ } };
import { useNotification } from '../../store';
import { Button } from '../../components/ui';
import { EditRequestModal } from '../../components/EditRequestModal';
import { MasterScheduleEditor } from '../../components/master/MasterScheduleEditor';
import {
  getMasterRequests,
  getStats,
  approveRequest,
  rejectRequest,
  confirmPayment,
  getSick,
  setSick,
  markRefunded,
  serviceLabels,
  requestTotal,
  allSlots,
  type MasterRequest,
} from '../../services/masterApi';

const fmt = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const prettyDate = (iso: string) => iso.split('-').reverse().join('.');

/** Подтверждение действия (Telegram-диалог с фолбэком на window.confirm). */
function confirmAction(message: string): Promise<boolean> {
  const tg = (window as unknown as { Telegram?: { WebApp?: { showConfirm?: (m: string, cb: (ok: boolean) => void) => void } } }).Telegram?.WebApp;
  if (tg?.showConfirm) return new Promise((resolve) => tg.showConfirm!(message, resolve));
  return Promise.resolve(window.confirm(message));
}

type TabKey = 'pending_review' | 'payment_pending' | 'receipt_review' | 'confirmed' | 'refunds';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending_review', label: 'На рассмотрении' },
  { key: 'payment_pending', label: 'Ожидают оплаты' },
  { key: 'receipt_review', label: 'Чек на проверке' },
  { key: 'confirmed', label: 'Подтверждённые' },
  { key: 'refunds', label: 'Возврат' },
];

// Сортировка по дате+времени записи — ближайшие сверху.
const byAppointment = (a: MasterRequest, b: MasterRequest) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

export const MasterRequestsTab: React.FC = () => {
  const notify = useNotification();
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<TabKey>('pending_review');
  const [editTarget, setEditTarget] = useState<MasterRequest | null>(null);
  const [msgTarget, setMsgTarget] = useState<MasterRequest | null>(null);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [seen, setSeen] = useState<Record<string, string>>(readSeen());
  const [sick, setSickState] = useState(false);
  const [sickBusy, setSickBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reload = () => setReloadKey((k) => k + 1);

  // Опрос диалогов — для индикатора непрочитанных на кнопках «Написать».
  useEffect(() => {
    let active = true;
    const load = () => { getConversations().then((c) => { if (active) setConvs(c); }).catch(() => {}); };
    load();
    const t = setInterval(load, 10000);
    return () => { active = false; clearInterval(t); };
  }, []);

  // Текущий режим «мастер заболел».
  useEffect(() => {
    let active = true;
    getSick().then((s) => { if (active) setSickState(s); }).catch(() => {});
    return () => { active = false; };
  }, [reloadKey]);

  // Есть ли непрочитанное сообщение от клиента.
  const isUnread = (clientId: string): boolean => {
    const c = convs.find((x) => x.clientId === clientId);
    return !!c && c.lastSender === 'client' && (!seen[clientId] || c.lastAt > seen[clientId]);
  };

  // Загрузка и опрос переписки с выбранным клиентом.
  useEffect(() => {
    if (!msgTarget) return;
    const cid = String(msgTarget.clientTgId);
    let active = true;
    const load = () => { getClientMessages(cid).then((m) => { if (active) setChat(m); }).catch(() => {}); };
    load();
    const t = setInterval(load, 4000);
    return () => { active = false; clearInterval(t); };
  }, [msgTarget]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const reqFetcher = useCallback(() => getMasterRequests(), [reloadKey]);
  const statsFetcher = useCallback(() => getStats(), [reloadKey]);
  const { data: requests, isLoading, error } = useAsyncData<MasterRequest[]>(reqFetcher, [reloadKey]);
  const { data: stats } = useAsyncData(statsFetcher, [reloadKey]);

  const all = requests ?? [];
  const refunds = all.filter((r) => r.refundPending).sort(byAppointment);
  const listForTab = (key: TabKey): MasterRequest[] =>
    key === 'refunds' ? refunds : all.filter((r) => r.status === key).sort(byAppointment);
  const countFor = (key: TabKey) => listForTab(key).length;
  const current = listForTab(tab);

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
  const handleConfirmPayment = async (r: MasterRequest) => {
    await confirmPayment(r.id);
    notify.success('Оплата подтверждена — запись подтверждена');
    reload();
  };
  const handleRefunded = async (r: MasterRequest) => {
    if (!(await confirmAction(`Вы вернули клиенту ${r.clientName} бронь ${fmt(r.bookingFee)}?`))) return;
    await markRefunded(r.id);
    notify.success('Отмечено как возвращённое');
    reload();
  };
  const handleToggleSick = async () => {
    const msg = sick
      ? 'Снова открыть запись для клиентов?'
      : 'Отметить, что мастер заболел? Все активные записи будут отменены, а запись для новых клиентов закроется.';
    if (!(await confirmAction(msg))) return;
    setSickBusy(true);
    try {
      const res = await setSick(!sick);
      setSickState(res.sick);
      notify.success(
        res.sick
          ? `Запись закрыта. Отменено записей: ${res.cancelled}. Кому вернуть деньги — во вкладке «Возврат».`
          : 'Запись снова открыта'
      );
      reload();
    } catch {
      notify.error('Не удалось изменить статус');
    } finally {
      setSickBusy(false);
    }
  };

  const openMessage = (r: MasterRequest) => {
    setMsgText(''); setChat([]); setMsgTarget(r);
    const cid = String(r.clientTgId);
    const c = convs.find((x) => x.clientId === cid);
    const next = { ...seen, [cid]: c?.lastAt || new Date().toISOString() };
    setSeen(next); writeSeen(next);
  };
  const handleSendMessage = async () => {
    if (!msgTarget || !msgText.trim()) return;
    setSending(true);
    try {
      const msg = await sendToClient(String(msgTarget.clientTgId), msgText.trim());
      setChat((c) => [...c, msg]);
      setMsgText('');
    } catch {
      notify.error('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  // ── Карточка заявки (вид зависит от вкладки/статуса) ──────────────
  const Card = ({ r }: { r: MasterRequest }) => {
    const onReview = r.status === 'receipt_review';
    const isRefund = tab === 'refunds';
    return (
      <div className={`rounded-card bg-card border p-4 mb-3 ${tab === 'pending_review' || onReview || isRefund ? 'border-l-2 border-l-brand border-line' : 'border-line'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-fg">{r.clientName}</span>
          <span className="text-sm font-semibold text-brand">{fmt(requestTotal(r))}</span>
        </div>
        <p className="text-xs text-muted">
          {prettyDate(r.date)} · {r.time} · {serviceLabels(r).join(' + ')}
        </p>
        {r.wishes && (
          <p className="text-xs text-hint italic mt-0.5 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">«{r.wishes}»</p>
        )}
        {r.photos && r.photos.length > 0 && (
          <div className="flex gap-2 mt-2">
            {r.photos.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-tile overflow-hidden border border-line block">
                <img src={src} alt={`фото ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}
        <p className="text-xs text-brand-dark mt-1">{r.clientPhone}</p>

        {/* Чек, присланный клиентом (на вкладке «Чек на проверке») */}
        {onReview && r.receipt && (
          <a href={r.receipt} target="_blank" rel="noreferrer" className="block mt-2 rounded-tile overflow-hidden border border-line">
            <img src={r.receipt} alt="чек оплаты" className="w-full max-h-56 object-contain bg-card-2" />
          </a>
        )}

        {/* Сумма к возврату */}
        {isRefund && (
          <p className="text-xs text-muted mt-1">К возврату: <span className="font-medium text-fg">{fmt(r.bookingFee)}</span></p>
        )}

        {/* Действия по статусу */}
        <div className="mt-3 flex flex-col gap-2">
          {tab === 'pending_review' && (
            <>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditTarget(r)} className="flex-1">Изменить</Button>
                <Button variant="ghost" size="sm" onClick={() => handleReject(r)} className="flex-1">Отклонить</Button>
              </div>
              <Button variant="primary" size="sm" fullWidth onClick={() => handleApprove(r)}>
                Одобрить и отправить на оплату
              </Button>
            </>
          )}
          {onReview && (
            <Button variant="primary" size="sm" fullWidth onClick={() => handleConfirmPayment(r)}>
              Подтвердить оплату
            </Button>
          )}
          {isRefund && (
            <Button variant="primary" size="sm" fullWidth onClick={() => handleRefunded(r)}>
              Деньги возвращены
            </Button>
          )}
          <Button variant="secondary" size="sm" fullWidth className="relative" onClick={() => openMessage(r)}>
            Написать клиенту
            {isUnread(String(r.clientTgId)) && <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500" />}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="grid grid-cols-3 gap-2 mb-4">
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

      {/* Режим «Заболела» */}
      {sick && (
        <div className="rounded-card border border-red-500/60 bg-red-500/10 px-4 py-2.5 mb-3 text-xs text-red-500">
          Запись закрыта — мастер заболел. Новые клиенты записаться не могут.
        </div>
      )}
      <Button
        variant={sick ? 'primary' : 'danger'}
        size="lg"
        fullWidth
        isLoading={sickBusy}
        onClick={handleToggleSick}
        className="mb-4 font-semibold shadow-md"
      >
        {sick ? '✅ Открыть запись (выздоровела)' : '😷 Заболела — закрыть запись'}
      </Button>

      {/* Вкладки по статусам */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          const n = countFor(t.key);
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active ? 'bg-brand text-[color:rgb(var(--brand-contrast))] border-brand' : 'bg-card text-muted border-line'
              }`}
            >
              {t.label}{n > 0 && <span className={`ml-1 ${active ? '' : 'text-brand'}`}>{n}</span>}
            </button>
          );
        })}
      </div>

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
      {!isLoading && !error && current.length === 0 && (
        <p className="text-xs text-hint mb-3">
          {tab === 'refunds' ? 'Возвратов нет.' : 'Здесь пока пусто.'}
        </p>
      )}

      {!isLoading && !error && current.map((r) => <Card key={r.id} r={r} />)}

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

      {/* Чат с клиентом */}
      {msgTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setMsgTarget(null)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-2xl flex flex-col"
            style={{ height: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-line">
              <div>
                <h2 className="font-serif text-base text-fg leading-tight">{msgTarget.clientName}</h2>
                <p className="text-[11px] text-muted">{msgTarget.clientPhone}</p>
              </div>
              <button onClick={() => setMsgTarget(null)} className="text-brand text-xl leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {chat.length === 0 && (
                <p className="text-xs text-hint text-center mt-6">Переписки пока нет. Напишите первым.</p>
              )}
              {chat.map((m) => {
                const mine = m.sender === 'master';
                return (
                  <div key={m.id} className={`max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      mine
                        ? 'bg-brand text-[color:rgb(var(--brand-contrast))] rounded-br-sm'
                        : 'bg-card-2 border border-line text-fg rounded-bl-sm'
                    }`}>
                      {m.text}
                    </div>
                    <div className={`text-[10px] text-hint mt-0.5 ${mine ? 'text-right' : 'text-left'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-end gap-2 px-4 py-3 border-t border-line">
              <textarea
                rows={1}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Сообщение клиенту…"
                className="flex-1 bg-card border border-line rounded-2xl px-4 py-2.5 text-sm text-fg placeholder-hint outline-none focus:border-brand resize-none max-h-24"
              />
              <button
                onClick={handleSendMessage}
                disabled={!msgText.trim() || sending}
                className="shrink-0 w-10 h-10 rounded-full bg-brand text-[color:rgb(var(--brand-contrast))] flex items-center justify-center disabled:opacity-40"
                aria-label="Отправить"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
