/**
 * pages/client/WishesInput.tsx
 * Экран ввода пожеланий (Шаг 6 формы, последний перед отправкой)
 */

import React, { useState } from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { getStep, TOTAL_STEPS } from '../../config/flow.config';
import { Input, Card } from '../../components/ui';
import { useNav } from '../../hooks';
import { getPrevFormStepPath, CLIENT_ROUTES } from '../../routes';
import { useAppStore, useNotification } from '../../store';
import { orderService } from '../../services';
import { compressImageToDataUrl } from '../../utils';

export const WishesInput: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();
  const notify = useNotification();
  const setLoading = useAppStore((state) => state.setLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLoading(true);

    try {
      // Сжимаем эскиз в data URL, чтобы мастер его увидел
      let sketchUrl = '';
      if (form.sketch) {
        try {
          sketchUrl = await compressImageToDataUrl(form.sketch);
        } catch {
          sketchUrl = '';
        }
      }

      // clientId и проверку лимита делает сервер по Telegram initData
      const orderData = {
        serviceType: form.serviceType,
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        clientAge: form.clientAge!,
        placement: form.placement!,
        size: form.size!,
        sketchUrl,
        health: {
          contraindications: form.contraindications,
          otherHealth: form.otherHealth,
        },
        experience: {
          hasTattoos: form.hasTattoos!,
          tattooCount: form.tattooCount,
        },
        wishes: form.wishes,
        status: 'pending' as const,
      };

      const response = await orderService.createOrder(orderData);

      if (response.success && response.data) {
        notify.success('Заявка отправлена успешно!');
        form.resetForm();
        navigate(CLIENT_ROUTES.FORM_SUCCESS);
      } else {
        const msg =
          (response as { message?: string }).message ||
          response.error?.message ||
          'Ошибка при отправке заявки';
        notify.error(msg);
      }
    } catch (error) {
      notify.error('Ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const prevPath = getPrevFormStepPath(form.currentStep);
    if (prevPath) {
      navigate(prevPath);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-6">
        <FormHeader
          title={getStep('wishes').title}
          pageTitle={getStep('wishes').pageTitle}
          subtitle={getStep('wishes').subtitle}
          step={form.currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handlePrev}
        />

        <Input
          label="Ваши пожелания и детали"
          placeholder="Например: хочу реалистичную розу в чёрно-серых тонах, без белых бликов..."
          value={form.wishes}
          onChange={(e) => form.setWishes(e.target.value.slice(0, 500))}
          multiline
          rows={5}
          maxLength={500}
        />

        <Card className="bg-brand-tint border-brand/30">
          <div className="flex gap-3">
            <div className="text-brand-contrast flex-shrink-0">ℹ️</div>
            <p className="text-sm text-brand-contrast">
              После отправки мастер рассчитает стоимость и предложит удобные дату
              и время сеанса — вы выберете подходящий вариант.
            </p>
          </div>
        </Card>
      </div>

      <FormFooter
        onSubmit={handleSubmit}
        onPrev={handlePrev}
        isNextDisabled={false}
        isNextLoading={isSubmitting}
        showSubmit
        showNext={false}
        showPrev
        submitLabel="Отправить заявку"
      />
    </div>
  );
};
