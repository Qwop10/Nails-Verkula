/**
 * pages/master/OrderDetails.tsx
 * Детали заявки для мастера
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMasterStore, useNotification } from '../../store';
import { orderService } from '../../services';
import {
  Button,
  Card,
  Modal,
  Input,
  LoadingSpinner,
} from '../../components/ui';
import { NumberInput } from '../../components/forms';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  SERVICE_LABELS,
} from '../../constants';
import { formatPlacement, formatSize, formatPrice, formatSlot } from '../../utils';
import { useNav } from '../../hooks';
import { MASTER_ROUTES } from '../../routes';

const WISHES_CLAMP = 160;

export const MasterOrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { navigate } = useNav();
  const selectedOrder = useMasterStore((s) => s.selectedOrder);
  const setOrders = useMasterStore((s) => s.setOrders);
  const setSelectedOrder = useMasterStore((s) => s.setSelectedOrder);
  const updateOrderStatus = useMasterStore((s) => s.updateOrderStatus);
  const updateOrderPrice = useMasterStore((s) => s.updateOrderPrice);
  const updateOrderFeedback = useMasterStore((s) => s.updateOrderFeedback);
  const notify = useNotification();

  const [priceModal, setPriceModal] = useState(false);
  const [priceAmount, setPriceAmount] = useState<number | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotInput, setSlotInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [timeModal, setTimeModal] = useState(false);

  const [sketchErr, setSketchErr] = useState(false);
  const [wishesOpen, setWishesOpen] = useState(false);

  const goBack = () => navigate(MASTER_ROUTES.DASHBOARD);

  // Если зашли по прямой ссылке/после перезагрузки — подтягиваем заявку с сервера
  useEffect(() => {
    if (!selectedOrder && orderId) {
      (async () => {
        const res = await orderService.getMasterOrders();
        if (res.success && res.data) {
          setOrders(res.data);
          setSelectedOrder(orderId);
        }
      })();
    }
  }, [selectedOrder, orderId, setOrders, setSelectedOrder]);

  if (!orderId || !selectedOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Загрузка..." />
      </div>
    );
  }

  const order = selectedOrder;

  const addSlot = () => {
    if (!slotInput) return;
    const iso = new Date(slotInput).toISOString();
    if (slots.includes(iso)) {
      setSlotInput('');
      return;
    }
    setSlots((prev) => [...prev, iso].sort());
    setSlotInput('');
  };

  const removeSlot = (iso: string) =>
    setSlots((prev) => prev.filter((s) => s !== iso));

  // Подхватываем время из поля, даже если не нажали «Добавить»
  const collectSlots = (): string[] => {
    if (!slotInput) return slots;
    try {
      const iso = new Date(slotInput).toISOString();
      if (Number.isNaN(Date.parse(iso))) return slots;
      return slots.includes(iso) ? slots : [...slots, iso].sort();
    } catch {
      return slots;
    }
  };

  const handleSetPrice = async () => {
    if (!priceAmount || priceAmount <= 0) {
      notify.error('Укажите корректную цену');
      return;
    }
    setIsSubmitting(true);
    try {
      const prepayment = { amount: Math.ceil(priceAmount * 0.2), currency: 'RUB' };
      const res = await orderService.setOrderPrice(
        orderId,
        { amount: priceAmount, currency: 'RUB' },
        collectSlots()
      );
      if (res.success) {
        updateOrderPrice(orderId, { amount: priceAmount, currency: 'RUB' }, prepayment);
        notify.success('Отправлено клиенту');
        setPriceModal(false);
        setPriceAmount(null);
        setSlots([]);
        goBack();
      }
    } catch {
      notify.error('Ошибка при установке цены');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestClarification = async () => {
    if (!feedback.trim()) {
      notify.error('Укажите вопрос или уточнение');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await orderService.requestClarification(orderId, feedback);
      if (res.success) {
        updateOrderFeedback(orderId, feedback);
        notify.success('Уточнение отправлено');
        setFeedbackModal(false);
        setFeedback('');
        goBack();
      }
    } catch {
      notify.error('Ошибка при отправке уточнения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Отклонить эту запись?')) return;
    try {
      const res = await orderService.rejectOrder(orderId, 'Отклонено мастером');
      if (res.success) {
        updateOrderStatus(orderId, 'rejected');
        notify.success('Запись отклонена');
        goBack();
      }
    } catch {
      notify.error('Ошибка при отклонении заявки');
    }
  };

  const handleProposeTime = async () => {
    const finalSlots = collectSlots();
    if (!finalSlots.length) {
      notify.error('Добавьте хотя бы один вариант времени');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await orderService.proposeTime(orderId, finalSlots);
      if (res.success) {
        notify.success('Время отправлено клиенту');
        setTimeModal(false);
        setSlots([]);
        goBack();
      }
    } catch {
      notify.error('Ошибка при отправке времени');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await orderService.confirmOrder(orderId);
      if (res.success) {
        updateOrderStatus(orderId, 'confirmed');
        notify.success('Запись подтверждена');
        goBack();
      }
    } catch {
      notify.error('Ошибка при подтверждении');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить эту запись безвозвратно?')) return;
    try {
      const res = await orderService.deleteOrder(orderId);
      if (res.success) {
        notify.success('Запись удалена');
        goBack();
      }
    } catch {
      notify.error('Ошибка при удалении');
    }
  };

  const showImg = !!order.sketchUrl && !sketchErr && /^(https?:|data:|\/)/.test(order.sketchUrl);
  const wishes = order.wishes || '';
  const wishesLong = wishes.length > WISHES_CLAMP;
  const isPending = order.status === 'pending';
  const isPaying = order.status === 'payment_pending';
  const isConsult = order.serviceType === 'consultation';
  const canConfirm =
    isPaying || (isConsult && order.status === 'price_set' && !!order.selectedSlot);
  const canDelete = ['rejected', 'confirmed', 'cancelled'].includes(order.status);

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-6">
      {/* Назад */}
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1 text-brand font-medium text-sm"
      >
        ‹ К записям
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">
            {order.clientName || 'Без имени'}
          </h1>
          {order.clientPhone && (
            <p className="text-muted mt-1 text-sm">{order.clientPhone}</p>
          )}
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

      {/* Эскиз / фото (скрываем для консультации без фото) */}
      {(showImg || !isConsult) && (
        <div className="w-full aspect-[4/3] rounded-2xl border border-line bg-card-2 overflow-hidden flex items-center justify-center">
          {showImg ? (
            <img
              src={order.sketchUrl}
              alt="Фото"
              className="w-full h-full object-contain"
              onError={() => setSketchErr(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-hint">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Эскиз недоступен</span>
            </div>
          )}
        </div>
      )}

      {/* Параметры (для консультации не показываем — анкеты нет) */}
      {!isConsult && order.size && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Возраст', value: `${order.clientAge ?? '—'} лет` },
            { label: 'Расположение', value: formatPlacement(order.placement) },
            { label: 'Размер', value: formatSize(order.size.height, order.size.width) },
            {
              label: 'Опыт',
              value: order.experience?.hasTattoos
                ? `${order.experience.tattooCount || 1} тату`
                : 'Первая',
            },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-xs font-semibold text-muted uppercase mb-1">
                {item.label}
              </p>
              <p className="text-lg font-bold text-white break-words">{item.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Здоровье / противопоказания */}
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

      {/* Цена (если назначена) */}
      {order.totalPrice && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase mb-1">
                Стоимость
              </p>
              <p className="text-xl font-bold text-white">
                {formatPrice(order.totalPrice.amount, order.totalPrice.currency)}
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
        </Card>
      )}

      {/* Дата и время (если предлагали слоты) */}
      {!!(order.proposedSlots && order.proposedSlots.length) && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            Дата и время
          </p>
          {order.selectedSlot ? (
            <p className="text-lg font-bold text-brand">
              {formatSlot(order.selectedSlot)}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted mb-2">
                Предложено {order.proposedSlots.length} — клиент ещё не выбрал
              </p>
              <div className="flex flex-wrap gap-2">
                {order.proposedSlots.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-card-2 text-white"
                  >
                    {formatSlot(s)}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Чек об оплате (если клиент прислал) */}
      {order.paymentProofUrl && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            Чек об оплате
          </p>
          <img
            src={order.paymentProofUrl}
            alt="Чек"
            className="w-full max-h-72 object-contain rounded-xl border border-line"
          />
        </Card>
      )}

      {/* Пожелания (сворачиваемые) */}
      {wishes && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            Пожелания клиента
          </p>
          <p
            className={`text-white whitespace-pre-wrap break-words ${
              wishesLong && !wishesOpen ? 'line-clamp-3' : ''
            }`}
          >
            {wishes}
          </p>
          {wishesLong && (
            <button
              onClick={() => setWishesOpen((v) => !v)}
              className="mt-2 text-sm text-brand font-medium"
            >
              {wishesOpen ? 'Свернуть' : 'Показать полностью'}
            </button>
          )}
        </Card>
      )}

      {/* Ответ мастера (если был) */}
      {order.masterFeedback && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            {order.status === 'rejected' ? 'Причина отклонения' : 'Запрошено уточнение'}
          </p>
          <p className="text-white whitespace-pre-wrap break-words">
            {order.masterFeedback}
          </p>
        </Card>
      )}

      {/* Действия */}
      {isPending && isConsult ? (
        <div className="space-y-3">
          <Button variant="primary" fullWidth onClick={() => setTimeModal(true)}>
            Предложить время
          </Button>
          <Button variant="danger" fullWidth onClick={handleReject}>
            Отклонить
          </Button>
        </div>
      ) : isPending ? (
        <div className="space-y-3">
          <Button variant="primary" fullWidth onClick={() => setPriceModal(true)}>
            Назначить стоимость
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setFeedbackModal(true)}>
              Запросить уточнение
            </Button>
            <Button variant="danger" onClick={handleReject}>
              Отклонить
            </Button>
          </div>
        </div>
      ) : canConfirm ? (
        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            Подтвердить запись
          </Button>
          <Button variant="secondary" fullWidth onClick={goBack}>
            ‹ Вернуться к записям
          </Button>
        </div>
      ) : (
        <Button variant="secondary" fullWidth onClick={goBack}>
          ‹ Вернуться к записям
        </Button>
      )}

      {/* Удаление завершённых/отклонённых */}
      {canDelete && (
        <button
          onClick={handleDelete}
          className="self-center mx-auto block mt-1 text-sm text-red-400 font-medium"
        >
          Удалить запись
        </button>
      )}

      {/* Модалка цены */}
      <Modal
        isOpen={priceModal}
        onClose={() => setPriceModal(false)}
        title="Назначить стоимость"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPriceModal(false)}>
              Отменить
            </Button>
            <Button variant="primary" onClick={handleSetPrice} isLoading={isSubmitting}>
              Установить цену
            </Button>
          </>
        }
      >
        <NumberInput
          label="Стоимость работы (₽)"
          value={priceAmount}
          onChange={setPriceAmount}
          min={1000}
          max={1000000}
          step={1000}
          placeholder="15000"
        />
        {priceAmount ? (
          <p className="text-sm text-muted mt-3">
            Предоплата (20%):{' '}
            <span className="text-white font-medium">
              {formatPrice(Math.ceil(priceAmount * 0.2))}
            </span>
          </p>
        ) : null}

        {/* Слоты времени */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            Предложите время
          </p>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={slotInput}
              onChange={(e) => setSlotInput(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="flex-1 min-w-0 bg-card border border-line rounded-xl px-3 py-2.5 text-white text-sm"
            />
            <Button variant="secondary" onClick={addSlot}>
              Добавить
            </Button>
          </div>
          {slots.length > 0 && (
            <div className="mt-3 space-y-2">
              {slots.map((s) => (
                <div
                  key={s}
                  className="flex items-center justify-between bg-card rounded-xl px-3 py-2"
                >
                  <span className="text-sm text-white">{formatSlot(s)}</span>
                  <button
                    onClick={() => removeSlot(s)}
                    className="text-red-400 text-xs font-medium"
                  >
                    Убрать
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-hint mt-2">
            Необязательно. Клиент выберет один из предложенных вариантов.
          </p>
        </div>
      </Modal>

      {/* Модалка «Предложить время» (консультация) */}
      <Modal
        isOpen={timeModal}
        onClose={() => setTimeModal(false)}
        title="Предложить время"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTimeModal(false)}>
              Отменить
            </Button>
            <Button
              variant="primary"
              onClick={handleProposeTime}
              isLoading={isSubmitting}
            >
              Отправить
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted mb-3">
          Добавьте варианты времени — клиент выберет удобный. Консультация
          бесплатная, оплата не нужна.
        </p>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={slotInput}
            onChange={(e) => setSlotInput(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="flex-1 min-w-0 bg-card border border-line rounded-xl px-3 py-2.5 text-white text-sm"
          />
          <Button variant="secondary" onClick={addSlot}>
            Добавить
          </Button>
        </div>
        {slots.length > 0 && (
          <div className="mt-3 space-y-2">
            {slots.map((s) => (
              <div
                key={s}
                className="flex items-center justify-between bg-card rounded-xl px-3 py-2"
              >
                <span className="text-sm text-white">{formatSlot(s)}</span>
                <button
                  onClick={() => removeSlot(s)}
                  className="text-red-400 text-xs font-medium"
                >
                  Убрать
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Модалка уточнения */}
      <Modal
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        title="Запросить уточнение"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFeedbackModal(false)}>
              Отменить
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestClarification}
              isLoading={isSubmitting}
            >
              Отправить
            </Button>
          </>
        }
      >
        <Input
          label="Ваше сообщение клиенту"
          placeholder="Что нужно уточнить?"
          multiline
          rows={3}
          maxLength={300}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value.slice(0, 300))}
        />
      </Modal>
    </div>
  );
};
