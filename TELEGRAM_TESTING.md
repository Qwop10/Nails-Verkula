# 🤖 Тестирование в Telegram - Быстрая инструкция

## 📱 Способ 1: На локальной машине (БЕЗ интернета)

### Шаг 1: Запустите приложение

```bash
npm run dev
```

Откроется на `http://localhost:3000`

### Шаг 2: Симулируйте Telegram в браузере

Откройте DevTools (F12) → Console и выполните:

```javascript
// Симулируем Telegram WebApp
window.Telegram = {
  WebApp: {
    ready: () => {},
    expand: () => {},
    initData: "query_id=AAHJK",
    initDataUnsafe: {
      user: {
        id: 123456789,
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        language_code: "en"
      }
    },
    colorScheme: "light",
    themeParams: {
      bg_color: "#ffffff",
      text_color: "#000000"
    },
    BackButton: {
      isVisible: false,
      show: function() { this.isVisible = true; },
      hide: function() { this.isVisible = false; },
      onClick: function(callback) { this._callback = callback; },
      offClick: function() { this._callback = null; }
    },
    MainButton: {
      text: "Continue",
      isVisible: false,
      isActive: true,
      show: function() { this.isVisible = true; },
      hide: function() { this.isVisible = false; },
      setText: function(text) { this.text = text; },
      onClick: function(callback) { this._callback = callback; },
      offClick: function() { this._callback = null; },
      enable: function() { this.isActive = true; },
      disable: function() { this.isActive = false; },
      showProgress: function() { this.isProgressVisible = true; },
      hideProgress: function() { this.isProgressVisible = false; }
    },
    HapticFeedback: {
      impactOccurred: function() {},
      notificationOccurred: function() {},
      selectionChanged: function() {}
    }
  }
}
```

Теперь приложение работает как в Telegram!

### Шаг 3: Тестируйте

- Запускайте в браузере на localhost
- Все функции работают
- Используйте DevTools для отладки

## 📱 Способ 2: В реальном Telegram (с интернетом)

### Требуется:
- Задеплоить на бесплатный хостинг (Vercel, Netlify)
- Или использовать ngrok для туннеля

### Через Vercel (РЕКОМЕНДУЕТСЯ)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

Скопируйте URL production развертывания.

### Настройка в @BotFather

1. Откройте Telegram, найдите **@BotFather**
2. `/mybots`
3. Выберите вашего бота
4. Bot Settings
5. Menu button
6. Web App
7. Вставьте URL вашего приложения с Vercel

### Откройте приложение в Telegram

Откройте чат с вашим ботом → нажмите кнопку внизу → откроется Web App

## 🔧 Способ 3: ngrok (для локального тестирования в Telegram)

### Установите ngrok

Скачайте с https://ngrok.com/download или через brew:
```bash
brew install ngrok
```

### Запустите ngrok туннель

```bash
# В отдельном терминале
ngrok http 3000
```

Скопируйте URL (выглядит как: `https://xxxx-xx-xxx-xxx-xx.ngrok.io`)

### Настройте в @BotFather

Используйте ngrok URL как Web App URL в @BotFather

### Тестируйте

Откройте приложение в реальном Telegram и тестируйте локально!

## 🧪 Что тестировать

### Клиент
- [ ] Загрузка эскиза (drag & drop, нажатие)
- [ ] Все 7 шагов формы
- [ ] Back button работает
- [ ] Validation работает
- [ ] localStorage сохраняет данные
- [ ] Success screen отправляет данные
- [ ] Haptic feedback (вибрация)

### Мастер
- [ ] Dashboard загружает заявки
- [ ] Может открыть деталь заявки
- [ ] Может установить цену
- [ ] Может запросить уточнение
- [ ] Может отклонить

## 📝 Логирование

Если что-то не работает, откройте DevTools (F12) и смотрите:

```javascript
// Console показывает все ошибки
console.error('Error:', error)

// Проверьте состояние формы
localStorage.getItem('tattoo_form_state')

// Проверьте Telegram API
window.Telegram.WebApp
```

## 🚀 Production чек-лист

- [ ] Приложение работает локально (`npm run dev`)
- [ ] Валидация работает
- [ ] localStorage сохраняет данные
- [ ] Telegram API инициализирован
- [ ] Mock API работает
- [ ] Все экраны отображаются правильно
- [ ] Responsive дизайн на мобильном
- [ ] Dark mode работает
- [ ] Нет ошибок в консоли

---

**Готово к тестированию в Telegram!** 🎉
