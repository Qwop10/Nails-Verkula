/**
 * components/ConsentScreen.tsx
 * Экран согласия на обработку персональных данных — показывается до авторизации.
 * Принять → вход в приложение. Отказаться → приложение закрывается.
 */
import React from 'react';
import { BRAND } from '../config/brand';
import { Button } from './ui';
import { FloralDecor } from './FloralDecor';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export const ConsentScreen: React.FC<Props> = ({ onAccept, onDecline }) => (
  <div className="min-h-screen bg-page text-fg flex flex-col justify-center px-6 py-8 relative overflow-hidden">
    <FloralDecor />

    <div className="text-center mb-5">
      <h1 className="font-serif text-2xl text-fg">{BRAND.name}</h1>
      <p className="text-sm text-muted italic mt-0.5">{BRAND.tagline}</p>
    </div>

    <div className="rounded-card bg-card border border-line p-5">
      <h2 className="font-serif text-lg text-fg mb-2">Обработка персональных данных</h2>
      <p className="text-sm text-muted leading-relaxed">
        Для записи нам нужны ваши имя, номер телефона и Telegram-аккаунт. Нажимая
        «Принимаю», вы соглашаетесь на обработку персональных данных для оформления
        и подтверждения записи. Данные используются только мастером студии и не
        передаются третьим лицам.
      </p>
    </div>

    <div className="mt-6 flex flex-col gap-3">
      <Button variant="primary" size="lg" fullWidth onClick={onAccept}>
        Принимаю
      </Button>
      <Button variant="ghost" size="lg" fullWidth onClick={onDecline}>
        Не принимаю
      </Button>
    </div>
  </div>
);
