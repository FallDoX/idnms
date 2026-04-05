# Trip Log Analyzer - Production Deployment

## 📦 Версия 2.0.0

---

## 🚀 Быстрый старт

### Веб-приложение (Static Site)

```bash
cd web
npx serve . -l 5174
```

Откройте http://localhost:5174

### Telegram Bot

```bash
cd bot
npm install
echo "BOT_TOKEN=your_token_here" > .env
npm start
```

---

## 📁 Структура пакета

```
prod-package/
├── web/                    # Веб-приложение (готово к деплою)
│   ├── index.html
│   ├── assets/
│   └── favicon.svg
├── bot/                    # Telegram бот
│   ├── bot/
│   ├── src/
│   └── package.json
├── DEPLOY.md              # Инструкции по деплою
└── start.bat              # Быстрый запуск Windows
```

---

## 🌐 Деплой веб-приложения

### Вариант 1: Netlify (рекомендуется)

1. Перетащите папку `web/` на [Netlify Drop](https://app.netlify.com/drop)
2. Получите URL
3. Готово!

### Вариант 2: Vercel

```bash
cd web
npx vercel --prod
```

### Вариант 3: Любой static hosting

Загрузите содержимое `web/` на любой хостинг:
- GitHub Pages
- AWS S3
- Nginx
- Apache

---

## 🤖 Деплой Telegram бота

### Требования
- Node.js 18+
- NPM

### Установка

```bash
cd bot
npm install --production
echo "BOT_TOKEN=7919748217:AAH2nLOPmW7XMzEEgfqyuM_pbFcdN5TRJAg" > .env
npm start
```

### PM2 (для продакшена)

```bash
npm install -g pm2
pm2 start bot/bot.js --name trip-analyzer-bot
pm2 save
pm2 startup
```

---

## ⚙️ Переменные окружения (Bot)

| Переменная | Описание | Обязательно |
|------------|----------|-------------|
| `BOT_TOKEN` | Токен от @BotFather | ✅ |

---

## 📋 Проверка работоспособности

### Веб
- [ ] Открывается без ошибок
- [ ] Загрузка CSV работает
- [ ] Графики отображаются
- [ ] Scatter plot работает
- [ ] Переводы на RU/EN

### Бот
- [ ] Бот отвечает на /start
- [ ] Принимает CSV файлы
- [ ] Отправляет графики
- [ ] Показывает сводку

---

## 🔧 Техподдержка

- Версия: 2.0.0
- Дата сборки: 2026-04-05
- Telegram: @Ksndr3000_bot
