/**
 * pages/client/ClientChat.tsx
 * Чат клиента с мастером (история + отправка, опрос каждые 4 сек).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNav } from '../../hooks';
import { CLIENT_ROUTES } from '../../routes';
import { getMyMessages, sendMyMessage, type ChatMessage } from '../../services/chatApi';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export const ClientChat: React.FC = () => {
  const { navigate } = useNav();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = () => {
    getMyMessages()
      .then((m) => {
        setMessages(m);
        // помечаем переписку прочитанной
        const maxId = m.reduce((a, x) => Math.max(a, x.id), 0);
        try { localStorage.setItem('nv_chat_seen', String(maxId)); } catch { /* ignore */ }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const msg = await sendMyMessage(t);
      setMessages((m) => [...m, msg]);
      setText('');
    } catch { /* ignore */ } finally { setSending(false); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Шапка */}
      <div className="flex items-center gap-3 pb-3 border-b border-line">
        <button onClick={() => navigate(CLIENT_ROUTES.PROFILE)} className="text-brand text-xl leading-none">‹</button>
        <div>
          <h1 className="font-serif text-lg text-fg leading-tight">Чат с мастером</h1>
          <p className="text-[11px] text-muted">Nails Verkula</p>
        </div>
      </div>

      {/* Лента */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-xs text-hint text-center mt-6">Напишите мастеру — здесь появится переписка.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender === 'client';
          return (
            <div key={m.id} className={`max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
              <div
                className={`px-3 py-2 rounded-2xl text-sm ${
                  mine
                    ? 'bg-brand text-[color:rgb(var(--brand-contrast))] rounded-br-sm'
                    : 'bg-card border border-line text-fg rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
              <div className={`text-[10px] text-hint mt-0.5 ${mine ? 'text-right' : 'text-left'}`}>
                {fmtTime(m.createdAt)}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Ввод */}
      <div className="flex items-end gap-2 pt-2 border-t border-line">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Сообщение…"
          className="flex-1 bg-card border border-line rounded-2xl px-4 py-2.5 text-sm text-fg placeholder-hint outline-none focus:border-brand resize-none max-h-24"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-full bg-brand text-[color:rgb(var(--brand-contrast))] flex items-center justify-center disabled:opacity-40"
          aria-label="Отправить"
        >
          ➤
        </button>
      </div>
    </div>
  );
};
