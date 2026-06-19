# LALI - Tattoo Artist Mini App

Веб-приложение для записи к мастеру татуировок через Telegram Mini App.

## 🚀 Быстрый старт

### 1️⃣ Создание Telegram бота (бесплатно)

Откройте Telegram и найдите бота **@BotFather**:

```
/start
/newbot
Укажите имя: LALI Tattoo Booking
Укажите username: lali_tattoo_bot (или ваш вариант)
```

Скопируйте полученный **API Token** (выглядит как: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2️⃣ Клонирование и установка

```bash
# Клонируем репозиторий
git clone https://github.com/YOUR_USERNAME/lali-tattoo-artist.git
cd lali-tattoo-artist

# Устанавливаем зависимости
npm install
# или yarn install
```

### 3️⃣ Конфигурация

Копируем `.env.example` в `.env.local` и добавляем токен бота:

```bash
cp .env.example .env.local
```

Откройте `.env.local` и вставьте токен:

```
VITE_TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
VITE_API_URL=http://localhost:3001/api
VITE_ENV=development
```

### 4️⃣ Локальный запуск

```bash
npm run dev
```

Приложение откроется на `http://localhost:3000`

## 🌐 Запуск в Telegram

### На локальной машине (Development)

1. **Установите Telegram Desktop** (или используйте web.telegram.org)

2. **В @BotFather** установите Web App:
```
/mybots
Выберите ваш бот
Bot Settings
Menu button
Web App
```

Укажите:
- **URL:** `http://localhost:3000`
- **Title:** Start Booking

3. **В чате с вашим ботом** нажмите на кнопку внизу → откроется ваше приложение

### На сервере (Production)

Когда будете готовы к выпуску:

1. Задеплойте приложение на хостинг (Vercel, Netlify, GitHub Pages - бесплатно)
2. Обновите URL в @BotFather на production URL
3. Подключите backend API

## 📝 Структура проекта

```
src/
├── api/              # API клиент и mock реализация
├── components/       # React компоненты
│   ├── ui/          # Базовые UI компоненты
│   ├── forms/       # Form компоненты
│   ├── common/      # Общие компоненты
│   ├── client/      # Экраны клиента
│   └── master/      # Экраны мастера
├── hooks/           # Custom React hooks
├── layouts/         # Layout компоненты
├── pages/           # Страницы приложения
├── routes/          # Маршрутизация
├── services/        # Бизнес-логика сервисов
├── store/           # Zustand stores
├── types/           # TypeScript типы
├── utils/           # Утилиты и хелперы
├── constants/       # Константы
├── styles/          # CSS стили
├── App.tsx          # Главный компонент
└── main.tsx         # Entry point
```

## 🔧 Доступные команды

```bash
# Запуск в development режиме
npm run dev

# Build для production
npm run build

# Preview production build
npm run preview

# Проверка типов
npm run type-check
```

## 📱 Тестирование ролей

По умолчанию открывается как **Клиент**.

Для тестирования **Мастера**:

1. Откройте DevTools (F12)
2. Console:
```javascript
localStorage.setItem('user_role', 'master')
```
3. Refresh страницы

## 🏗️ Architecture

### State Management
- **Zustand** - глобальное состояние
- **localStorage** - персистентность форм

### API Layer
- **Mock API** - для разработки
- Легко заменяется на реальный backend
- Все запросы через service layer

### Routing
- **React Router v6** - навигация
- Условный routing на основе роли пользователя

### Styling
- **Tailwind CSS** - утилиты
- **CSS переменные** - design tokens
- **Dark mode** - встроенная поддержка

## 🚀 Деплой (Бесплатно)

### Vercel (рекомендуется)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### GitHub Pages

```bash
# Build
npm run build

# Результат в папке dist/
# Залейте на GitHub Pages
```

### Netlify

Просто драгните папку `dist/` на https://app.netlify.com

## 🔐 Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте `.env` файл
- Используйте `.env.example` как шаблон
- На production используйте переменные окружения хостинга
- TODO Backend: Проверяйте подпись Telegram данных

## 📚 Дополнительные ресурсы

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
- [Vite](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com)

## 💡 Советы для разработки

1. **Mock API** работает со всеми данными локально
2. **Telegram simulator** - открывайте приложение через обычный браузер на localhost
3. **DevTools** - используйте React DevTools для отладки состояния
4. **HotReload** - все изменения автоматически обновляются

## 🐛 Troubleshooting

**"Cannot find module 'react'"**
```bash
npm install
```

**"Port 3000 already in use"**
```bash
# Используйте другой порт
npm run dev -- --port 3001
```

**"Telegram Web App script not loaded"**
- Убедитесь, что используете Telegram приложение
- На обычном браузере используйте DevTools для симуляции

## 🧩 Новый клиент из шаблона (ребрендинг)

Чтобы запустить мини-апп под другого клиента/нишу, меняются **только эти точки**:

| Что | Где |
|---|---|
| Имя, лого, реквизиты оплаты, id админов | `src/config/brand.ts` |
| Логотип-картинка | `public/` (путь указать в `brand.ts`) |
| Палитра и шрифты | `tailwind.config.js` (токены) + `src/styles/index.css` (`.surface-*`) |
| Услуги, статусы и их лейблы | `shared/domain.js` (общий для фронта и бэка) |
| Шаги анкеты, расположения, противопоказания | `src/constants/constants_order.ts` |
| Тексты бота (памятка, противопоказания, приветствие) | `server/telegram.mjs`, `server/index.mjs` |
| Секреты и адрес студии | переменные окружения (см. `.env.example`) |

Движок переиспользуем: Telegram-авторизация (initData HMAC), поток заявки
(оценка → время → оплата → подтверждение), уведомления, рассылка, роли по
`MASTER_TELEGRAM_IDS`.

## ⚙️ Переменные окружения

См. `.env.example`. Ключевые: `BOT_TOKEN`, `DATABASE_URL`, `MASTER_TELEGRAM_IDS`,
`STUDIO_ADDRESS`. На Railway `DATABASE_URL` подключается через Variable Reference
`${{Postgres.DATABASE_URL}}`, домен берётся из `RAILWAY_PUBLIC_DOMAIN`.

### Хранилище изображений
Эскизы и чеки хранятся **файлами**, а не в БД. На Railway добавьте сервису
**Volume с mount path `/data`** (Settings → Volumes) — файлы переживут редеплой,
БД останется лёгкой. Картинки отдаются по `/uploads/<name>`. Для CDN позже легко
заменить `server/storage.mjs` на S3/R2 (это единственный файл хранилища).

## 📄 License

MIT

## 👨‍💻 Автор

Создано для LALI Tattoo Artist - 2024

---

**Готово к production!** 🎉
