/**
 * pages/client/ConsultForm.tsx
 * Короткая форма бесплатной консультации: вопрос + фото по желанию.
 */
import React, { useState } from 'react';
import { useNav } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { Input } from '../../components/ui';
import { FileUpload } from '../../components/forms';
import { orderService } from '../../services';
import { useNotification, useAppStore } from '../../store';
import { compressImageToDataUrl } from '../../utils';
import { CLIENT_ROUTES } from '../../routes';

export const ConsultForm: React.FC = () => {
  const { navigate } = useNav();
  const notify = useNotification();
  const setLoading = useAppStore((s) => s.setLoading);
  const [question, setQuestion] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      notify.error('Опишите ваш вопрос');
      return;
    }
    setSubmitting(true);
    setLoading(true);
    try {
      let sketchUrl = '';
      if (photo) {
        try {
          sketchUrl = await compressImageToDataUrl(photo);
        } catch {
          sketchUrl = '';
        }
      }
      const res = await orderService.createOrder({
        serviceType: 'consultation',
        wishes: question.trim(),
        sketchUrl,
        status: 'pending',
      });
      if (res.success && res.data) {
        notify.success('Заявка на консультацию отправлена');
        navigate(CLIENT_ROUTES.FORM_SUCCESS);
      } else {
        const msg =
          (res as { message?: string }).message ||
          res.error?.message ||
          'Ошибка при отправке';
        notify.error(msg);
      }
    } catch {
      notify.error('Ошибка при отправке');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-6">
        <FormHeader
          title="Бесплатная консультация"
          pageTitle="Консультация"
          subtitle="Опишите вопрос — мастер ответит и предложит удобное время"
          onBack={() => navigate(CLIENT_ROUTES.SERVICES)}
        />

        <Input
          label="Ваш вопрос"
          placeholder="Например: подойдёт ли мой эскиз, можно ли перекрыть старую тату, уход после сеанса..."
          multiline
          rows={5}
          maxLength={500}
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
        />

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
            Фото (по желанию)
          </p>
          <FileUpload
            accept="image/jpeg,image/png,image/webp"
            onFileSelect={setPhoto}
            file={photo}
          />
        </div>
      </div>

      <FormFooter
        onSubmit={handleSubmit}
        isNextLoading={submitting}
        isNextDisabled={!question.trim()}
        showSubmit
        showNext={false}
        submitLabel="Отправить"
      />
    </div>
  );
};
