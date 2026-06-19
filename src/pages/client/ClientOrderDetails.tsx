/**
 * pages/client/ClientOrderDetails.tsx
 * Просмотр клиентом своей заявки: что отправил + оплата (реквизиты, чек).
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNav } from '../../hooks';
import { orderService } from '../../services';
import { useNotification } from '../../store';
import { Card, Button, LoadingSpinner, Modal, Input } from '../../components/ui';
import { FileUpload } from '../../components/forms';
import {
  formatPlacement,
  formatSize,
  formatPrice,
  formatTimeAgo,
  formatSlot,
  compressImageToDataUrl,
} from '../../utils';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  SERVICE_LABELS,
} from '../../constants';
import { CLIENT_ROUTES } from '../../routes';
import { BRAND } from '../../config/brand';
import type { Order } from '../../types';

export const ClientOrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { navigate } = useNav();
  const notify = useNotification();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [replyModal, setReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState(false);

  const handleSelectSlot = async (slot: string) => {
    if (!orderId) return;
    setSelectingSlot(true);
    try {
      const res = await orderService.selectSlot(orderId, slot);
      if (res.success && res.data) {
        setOrder(res.data);
        notify.success('Время выбрано');
      } else {
        notify.error('Не удалось выбрать время');
      }
    } catch {
      notify.error('Ошибка при выборе времени');
    } finally {
      setSelectingSlot(false);
    }
  };

  const load = async () => {
    if (!orderId) return;
    const res = await orderService.getOrder(orderId);
    if (res.success && res.data) setOrder(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleReceipt = async (file: File | null) => {
    if (!file || !orderId) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, 1200, 0.6);
      const res = await orderService.uploadReceipt(orderId, dataUrl);
      if (res.success && res.data) {
        setOrder(res.data);
        notify.success('Чек отправлен мастеру');
      } else {
        notify.error('Не удалось отправить чек');
      }
    } catch {
      notify.error('Ошибка при загрузке чека');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Загрузка..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-muted">Запись не найдена</p>
        <Button variant="secondary" onClick={() => navigate(CLIENT_ROUTES.HOME)}>
          На главную
        </Button>
      </div>
    );
  }

  const sketchIsImg = !!order.sketchUrl && /^(https?:|data:|\/)/.test(order.sketchUrl);
  const hasPrice = !!order.totalPrice;
  const isPriceSet = order.status === 'price_set';
  const isPaying = order.status === 'payment_pending';
  const isConfirmed = order.status === 'confirmed';
  const isClarify = order.status === 'awaiting_price';
  const isConsult = order.serviceType === 'consultation';
  const proposedSlots = order.proposedSlots || [];
  const canDelete = ['rejected', 'confirmed', 'cancelled'].includes(order.status);

  const handleReply = async () => {
    if (!orderId || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await orderService.replyToOrder(orderId, replyText.trim());
      if (res.success && res.data) {
        setOrder(res.data);
        notify.success('Ответ отправлен мастеру');
        setReplyModal(false);
        setReplyText('');
      } else {
        notify.error('Не удалось отправить ответ');
      }
    } catch {
      notify.error('Ошибка при отправке ответа');
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async () => {
    if (!orderId) return;
    if (!window.confirm('Удалить эту запись?')) return;
    const res = await orderService.deleteOrder(orderId);
    if (res.success) {
      notify.success('Запись удалена');
      navigate(CLIENT_ROUTES.HOME);
    } else {
      notify.error('Не удалось удалить запись');
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-5 pb-6">
      {/* Назад */}
      <button
        onClick={() => navigate(CLIENT_ROUTES.HOME)}
        className="inline-flex items-center gap-1 text-brand font-medium text-sm self-start"
      >
        ‹ На главную
      </button>

      {/* Заголовок */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">Ваша запись</h1>
          <p className="text-xs text-muted mt-1">
            {formatTimeAgo(new Date(order.createdAt))}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            ORDER_STATUS_COLORS[order.status] || ''
          }`}
        >
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Тип услуги */}
      <div className="-mt-2">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(171,189,163,0.3)', color: '#FFFFFF' }}
        >
          {SERVICE_LABELS[order.serviceType || 'tattoo']}
          {isConsult ? ' · бесплатно' : ''}
        </span>
      </div>

      {/* Эскиз / фото */}
      {(sketchIsImg || !isConsult) && (
        <div className="w-full aspect-[4/3] rounded-2xl border border-line bg-card-2 overflow-hidden flex items-center justify-center">
          {sketchIsImg ? (
            <img
              src={order.sketchUrl}
              alt="Фото"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs text-hint">Эскиз не приложен</span>
          )}
        </div>
      )}

      {/* Параметры (не для консультации) */}
      {!isConsult && order.size && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Расположение', value: formatPlacement(order.placement) },
            { label: 'Размер', value: formatSize(order.size.height, order.size.width) },
            { label: 'Возраст', value: `${order.clientAge ?? '—'} лет` },
            {
              label: 'Опыт',
              value: order.experience?.hasTattoos
                ? `${order.experience.tattooCount || 1} тату`
                : 'Первая',
            },
          ].map((it) => (
            <Card key={it.label}>
              <p className="text-xs font-semibold text-muted uppercase mb-1">
                {it.label}
              </p>
              <p className="text-lg font-bold text-white break-words">{it.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Здоровье */}
      {(order.health?.contraindications?.length ||
        order.health?.otherHealth) && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            Здоровье
          </p>
          {!!order.health?.contraindications?.length && (
            <div className="flex flex-wrap gap-2">
              {order.health.contraindications.map((c) => {
                const ok = c === 'Нет противопоказаний';
                return (
                  <span
                    key={c}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    style={
                      ok
                        ? { background: 'rgba(171,189,163,0.3)', color: '#2F3A2B' }
                        : { background: 'rgba(224,75,74,0.25)', color: '#ffd9d9' }
                    }
                  >
                    {c}
                  </span>
                );
              })}
            </div>
          )}
          {order.health?.otherHealth && (
            <p className="text-white text-sm mt-3 whitespace-pre-wrap break-words">
              {order.health.otherHealth}
            </p>
          )}
        </Card>
      )}

      {/* Пожелания / вопрос */}
      {order.wishes && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            {isConsult ? 'Ваш вопрос' : 'Ваши пожелания'}
          </p>
          <p className="text-white whitespace-pre-wrap break-words">
            {order.wishes}
          </p>
        </Card>
      )}

      {/* Выбор времени (когда мастер предложил слоты) */}
      {proposedSlots.length > 0 && !isConfirmed && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-3">
            Выберите удобное время
          </p>
          <div className="space-y-2">
            {proposedSlots.map((s) => {
              const active = order.selectedSlot === s;
              return (
                <button
                  key={s}
                  disabled={selectingSlot}
                  onClick={() => handleSelectSlot(s)}
                  className="w-full text-left rounded-xl px-4 py-3 text-sm font-medium border-2 transition-colors disabled:opacity-60"
                  style={
                    active
                      ? { background: 'rgb(var(--brand))', color: 'rgb(var(--brand-contrast))', borderColor: 'rgb(var(--brand))' }
                      : { background: 'rgb(var(--surface-2))', color: 'rgb(var(--text))', borderColor: 'transparent' }
                  }
                >
                  {formatSlot(s)}
                </button>
              );
            })}
          </div>
          {order.selectedSlot && (
            <p className="text-xs text-muted mt-3">
              Время выбрано. {isConsult ? 'Ждите подтверждения мастера.' : 'Осталось оплатить ниже.'}
            </p>
          )}
        </Card>
      )}

      {/* Ответ мастера */}
      {order.masterFeedback && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            {order.status === 'rejected' ? 'Причина отклонения' : 'Сообщение мастера'}
          </p>
          <p className="text-white whitespace-pre-wrap break-words">
            {order.masterFeedback}
          </p>
        </Card>
      )}

      {/* Ответ клиента на уточнение */}
      {isClarify && (
        <Button variant="primary" fullWidth onClick={() => setReplyModal(true)}>
          Ответить мастеру
        </Button>
      )}

      {/* Стоимость + оплата */}
      {hasPrice && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-muted uppercase mb-1">
                Стоимость
              </p>
              <p className="text-xl font-bold text-white">
                {formatPrice(order.totalPrice!.amount, order.totalPrice!.currency)}
              </p>
            </div>
            {order.prepayment && (
              <div className="text-right">
                <p className="text-xs font-semibold text-muted uppercase mb-1">
                  Предоплата
                </p>
                <p className="text-lg font-bold text-brand">
                  {formatPrice(order.prepayment.amount, order.prepayment.currency)}
                </p>
              </div>
            )}
          </div>

          {/* Оплата брони (TODO: ЮKassa — см. server/payments). Экран будет переработан. */}
          <div className="rounded-xl bg-card-2 border border-line p-4">
            <p className="text-xs font-semibold text-muted uppercase mb-2">
              Оплата брони
            </p>
            <p className="text-sm text-muted">
              Бронь {BRAND.booking.fee} ₽ оплачивается через Telegram после одобрения мастером.
            </p>
          </div>
        </Card>
      )}

      {/* Загрузка чека / статус оплаты (не для бесплатной консультации) */}
      {isPriceSet && hasPrice && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-3">
            Чек об оплате
          </p>
          {uploading ? (
            <LoadingSpinner size="md" text="Отправляем чек..." />
          ) : (
            <FileUpload
              accept="image/jpeg,image/png,image/webp"
              onFileSelect={handleReceipt}
              file={null}
            />
          )}
        </Card>
      )}

      {isPaying && (
        <Card>
          <p className="text-sm text-white mb-3">
            ✅ Чек отправлен. Ожидайте подтверждения от мастера.
          </p>
          {order.paymentProofUrl && (
            <img
              src={order.paymentProofUrl}
              alt="Чек"
              className="w-full max-h-64 object-contain rounded-xl border border-line"
            />
          )}
        </Card>
      )}

      {isConfirmed && (
        <Card className="text-center">
          <p className="text-base font-semibold text-brand">
            ✅ Запись подтверждена
          </p>
          <p className="text-sm text-muted mt-1">
            Мастер ждёт вас. Спасибо!
          </p>
        </Card>
      )}

      {canDelete && (
        <button
          onClick={handleDelete}
          className="self-center mt-2 text-sm text-red-400 font-medium"
        >Удалить запись
        </button>
      )}

      {/* Модалка ответа на уточнение */}
      <Modal
        isOpen={replyModal}
        onClose={() => setReplyModal(false)}
        title="Ответ мастеру"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReplyModal(false)}>
              Отменить
            </Button>
            <Button variant="primary" onClick={handleReply} isLoading={replying}>
              Отправить
            </Button>
          </>
        }
      >
        <Input
          label="Ваш ответ"
          placeholder="Напишите ответ на вопрос мастера..."
          multiline
          rows={3}
          maxLength={300}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value.slice(0, 300))}
        />
      </Modal>
    </div>
  );
};
