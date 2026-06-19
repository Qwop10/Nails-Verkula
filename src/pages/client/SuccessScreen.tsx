/**
 * pages/client/SuccessScreen.tsx
 * Экран успешной отправки заявки
 */

import React, { useEffect } from 'react';
import { useNav } from '../../hooks';
import { hideBackButton } from '../../services';
import { Button, Card } from '../../components/ui';
import { notificationHaptic } from '../../services';
import { CLIENT_ROUTES } from '../../routes';

export const SuccessScreen: React.FC = () => {
  const { navigate } = useNav();

  useEffect(() => {
    hideBackButton();
    notificationHaptic('success');
  }, []);

  const handleGoHome = () => {
    navigate(CLIENT_ROUTES.HOME);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-8">
      {/* Success icon */}
      <div className="w-24 h-24 rounded-full bg-brand-tint border-2 border-brand flex items-center justify-center">
        <svg
          className="w-16 h-16 text-brand-contrast"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">
          Запись получена
        </h1>
        <p className="text-base text-muted">
          Мастер изучит эскиз, рассчитает стоимость и предложит удобные дату и
          время сеанса — вы выберете подходящий вариант.
        </p>
      </div>

      {/* Info cards */}
      <div className="w-full space-y-3">
        <Card className="text-center">
          <div className="flex items-center justify-center gap-3 text-muted">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-10H9v4l3.25 1.95.75-1.23-2-1.2V6z" />
            </svg>
            <span className="text-sm">
              Обычно мастер отвечает в течение <strong>24 часов</strong>
            </span>
          </div>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-center gap-3 text-muted">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
            </svg>
            <span className="text-sm">
              Ответ придёт <strong>в этом чате</strong>
            </span>
          </div>
        </Card>
      </div>

      {/* CTA Button */}
      <div className="w-full pt-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleGoHome}
        >
          Вернуться на главную
        </Button>
      </div>

      {/* Footer note */}
      <p className="text-xs text-hint text-center">
        Вы можете закрыть это окно. Мастер свяжется с вами через Telegram.
      </p>
    </div>
  );
};
