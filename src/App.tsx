/**
 * App.tsx
 * Главный компонент приложения
 * Устанавливает routing, провайдеры и инициализирует приложение
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore, useUserRole } from './store';
import { CLIENT_ROUTES, MASTER_ROUTES } from './routes';
import { initTelegram, useTelegramTheme } from './services';
import { getTelegramUser } from './services';
import { ClientLayout, MasterLayout } from './layouts';
import { ToastContainer } from './components/ui';
import { ConsentScreen } from './components/ConsentScreen';
import { getProfile, saveConsent } from './services/requestsApi';
import { MASTER_TELEGRAM_IDS } from './constants';

type UserRole = 'client' | 'master';

/**
 * Определяет роль пользователя.
 *  - В ПРОДЕ: только по Telegram id мастера (MASTER_TELEGRAM_IDS). Никакого
 *    переключателя — кабинет мастера откроется лишь у владельца. Сервер дополнительно
 *    защищает /api/admin/* через requireMaster (проверка initData).
 *  - В DEV (vite dev): доступен dev-override ?role=master|client для просмотра экранов.
 */
function resolveUserRole(telegramId?: number): UserRole {
  // Dev-override — ТОЛЬКО при локальной разработке, в прод-сборку не попадает.
  if (import.meta.env.DEV) {
    const urlRole = new URLSearchParams(window.location.search).get('role');
    if (urlRole === 'master' || urlRole === 'client') {
      localStorage.setItem('user_role', urlRole);
      return urlRole;
    }
    const saved = localStorage.getItem('user_role');
    if (saved === 'master' || saved === 'client') return saved;
  }

  // Прод: роль определяется только по Telegram id владельца.
  if (telegramId && MASTER_TELEGRAM_IDS.includes(telegramId)) return 'master';
  return 'client';
}

// Client Pages (Nails — короткий поток)
import {
  ClientHome,
  ClientProfile,
  NailsCatalog,
  DateTimeSelect,
  RequestSubmitted,
  RequestDetail,
  ClientChat,
} from './pages/client';

// Master Pages
import {
  MasterDashboard,
  MasterOrderDetails,
} from './pages/master';

/**
 * Главный компонент приложения
 */
const App: React.FC = () => {
  const setTelegramUser = useAppStore((state) => state.setTelegramUser);
  const setUserRole = useAppStore((state) => state.setUserRole);
  const setInitialized = useAppStore((state) => state.setInitialized);
  const userRole = useUserRole();
  // Согласие на обработку ПД — источник истины на сервере, чтобы при очистке
  // базы / повторной верификации экран согласия снова показывался.
  // null = ещё проверяем, true/false = известно.
  const [consented, setConsented] = React.useState<boolean | null>(null);

  useTelegramTheme();

  // Инициализация при загрузке
  useEffect(() => {
    // Инициализируем Telegram WebApp
    initTelegram();

    // Получаем данные пользователя из Telegram
    const tgUser = getTelegramUser();
    if (tgUser) {
      setTelegramUser(tgUser);
    }

    // Роль: мастер только у владельца (по Telegram id),
    // плюс dev-override через ?role= для локального просмотра.
    // TODO Backend: подтверждать роль на сервере (проверка initData).
    setUserRole(resolveUserRole(tgUser?.id));

    setInitialized(true);

    // Проверяем согласие на сервере (привязано к Telegram id клиента).
    getProfile()
      .then((p) => setConsented(p.consent))
      .catch(() => setConsented(false));
  }, [setTelegramUser, setUserRole, setInitialized]);

  // Загрузка / инициализация (роль или статус согласия ещё неизвестны).
  if (!userRole || consented === null) {
    return <div>Loading...</div>;
  }

  // Гейт согласия на обработку персональных данных — до входа в приложение.
  if (!consented) {
    return (
      <ConsentScreen
        onAccept={() => {
          saveConsent().catch(() => { /* ignore — повторим при следующем входе */ });
          setConsented(true);
        }}
        onDecline={() => {
          const tg = (window as unknown as { Telegram?: { WebApp?: { close?: () => void } } }).Telegram?.WebApp;
          tg?.close?.();
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* CLIENT ROUTES */}
        {userRole === 'client' && (
          <>
            <Route
              path={CLIENT_ROUTES.HOME}
              element={
                <ClientLayout>
                  <ClientHome />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.PROFILE}
              element={
                <ClientLayout>
                  <ClientProfile />
                </ClientLayout>
              }
            />
            {/* Nails — короткий поток */}
            <Route
              path={CLIENT_ROUTES.CATALOG}
              element={
                <ClientLayout>
                  <NailsCatalog />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.DATETIME}
              element={
                <ClientLayout>
                  <DateTimeSelect />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.SUBMITTED}
              element={
                <ClientLayout>
                  <RequestSubmitted />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.REQUEST_DETAIL}
              element={
                <ClientLayout>
                  <RequestDetail />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.CHAT}
              element={
                <ClientLayout>
                  <ClientChat />
                </ClientLayout>
              }
            />

            {/* Fallback для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to={CLIENT_ROUTES.HOME} replace />} />
          </>
        )}

        {/* MASTER ROUTES */}
        {userRole === 'master' && (
          <>
            {/* Панель мастера — самодостаточная оболочка (свои вкладки + нижняя навигация) */}
            <Route path={MASTER_ROUTES.HOME} element={<MasterDashboard />} />
            <Route path={MASTER_ROUTES.DASHBOARD} element={<MasterDashboard />} />
            <Route
              path={MASTER_ROUTES.ORDER_DETAIL}
              element={
                <MasterLayout>
                  <MasterOrderDetails />
                </MasterLayout>
              }
            />

            {/* Fallback для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to={MASTER_ROUTES.HOME} replace />} />
          </>
        )}
      </Routes>

      {/* Global Toast container */}
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
