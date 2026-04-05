# 🚀 Подробная инструкция по бесплатному хостингу

## Trip Log Analyzer v2.0.0

---

## 📋 Содержание

1. [Веб-приложение (Frontend)](#веб-приложение)
2. [Telegram Bot](#telegram-bot)
3. [Вариант "Всё в одном" (Render)](#вариант-всё-в-одном)

---

## 🌐 Веб-приложение

### Вариант 1: Netlify (САМЫЙ ПРОСТОЙ) ⭐ Рекомендуется

**Стоимость:** Бесплатно (до 100GB трафика/месяц)

#### Шаг 1: Подготовка
```bash
cd prod-package/web
```

#### Шаг 2: Способ A - Drag & Drop (мгновенный)
1. Откройте https://app.netlify.com/drop
2. Перетащите папку `web/` в браузер
3. Получите URL типа `https://trip-analyzer-abc123.netlify.app`
4. Готово! 🎉

#### Шаг 2: Способ B - Git (с автообновлением)
1. Создайте репозиторий на GitHub
2. Загрузите папку `web/` в репозиторий
3. На Netlify: "Add new site" → "Import an existing project"
4. Выберите GitHub репо
5. Build command: оставьте пустым (уже собрано)
6. Publish directory: `/` (корень)
7. Deploy!

#### Плюсы Netlify:
- ✅ HTTPS автоматически
- ✅ CDN по всему миру
- ✅ Автодеплой при push в GitHub
- ✅ Предпросмотр PR
- ✅ Кастомный домен (бесплатно)

---

### Вариант 2: Vercel

**Стоимость:** Бесплатно (до 100GB трафика/месяц)

#### Способ A: CLI
```bash
cd prod-package/web
npx vercel --prod
```

#### Способ B: GitHub
1. Загрузите `web/` на GitHub
2. Зайдите на https://vercel.com
3. "Add New Project" → Импортируйте из GitHub
4. Framework Preset: "Other"
5. Build Output Directory: оставьте как есть
6. Deploy!

#### Плюсы Vercel:
- ✅ Быстрый CDN
- ✅ Аналитика
- ✅ Предпросмотр деплоев
- ✅ Интеграция с GitHub

---

### Вариант 3: GitHub Pages (100% бесплатно)

**Стоимость:** Бесплатно (1GB, 100GB трафика)

#### Шаг 1: Создайте репозиторий
```bash
# В папке web
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/trip-analyzer-web.git
git push -u origin main
```

#### Шаг 2: Настройка GitHub Pages
1. Зайдите в Settings репозитория
2. Перейдите в раздел "Pages" (слева)
3. Source: Deploy from a branch
4. Branch: main, folder: / (root)
5. Save
6. Через 1-2 минуты сайт доступен по `https://yourusername.github.io/trip-analyzer-web`

#### Важно для GitHub Pages:
- Добавьте в `index.html` базовый путь если нужно:
```html
<base href="/trip-analyzer-web/">
```

---

### Вариант 4: Surge.sh (быстрый и простой)

**Стоимость:** Бесплатно (базовый домен *.surge.sh)

```bash
cd prod-package/web
npm install -g surge
surge
# Укажите домен: trip-analyzer.surge.sh
```

#### Плюсы Surge:
- ✅ Нет регистрации
- ✅ Мгновенный деплой
- ✅ Поддержка CLI
- ✅ Кастомный домен

---

## 🤖 Telegram Bot

### Вариант 1: Render.com (САМЫЙ ПРОСТОЙ) ⭐ Рекомендуется

**Стоимость:** Бесплатно (спит через 15 мин неактивности)

#### Шаг 1: Подготовка кода
```bash
cd prod-package/bot
# Создайте .env файл
echo "BOT_TOKEN=7919748217:AAH2nLOPmW7XMzEEgfqyuM_pbFcdN5TRJAg" > .env
```

#### Шаг 2: Загрузка на GitHub
```bash
git init
git add .
git commit -m "Bot v2.0.0"
git remote add origin https://github.com/YOUR_USERNAME/trip-analyzer-bot.git
git push -u origin main
```

#### Шаг 3: Настройка на Render
1. Зайдите на https://render.com
2. "New" → "Web Service"
3. Connect GitHub repo
4. Настройки:
   - **Name:** trip-analyzer-bot
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Добавьте Environment Variable:
   - Key: `BOT_TOKEN`
   - Value: `7919748217:AAH2nLOPmW7XMzEEgfqyuM_pbFcdN5TRJAg`
6. Create Web Service

#### Важно для Render Free:
- Бот "засыпает" через 15 мин неактивности
- Первое сообщение после сна - задержка 30 сек (просыпается)
- Для 24/7 нужен крон-запрос (см. ниже)

#### Держать бота awake 24/7:
Добавьте в `bot.js` (уже есть):
```javascript
// Автопинг каждые 10 минут
setInterval(() => {
  console.log('Ping:', new Date().toISOString());
}, 600000);
```

Или используйте внешний сервис:
- https://cron-job.org (бесплатно)
- Настройте запрос к URL бота каждые 10 минут

---

### Вариант 2: Railway.app

**Стоимость:** Бесплатно (до 5$ в месяц кредитов)

#### Шаги:
1. Загрузите бот на GitHub
2. Зайдите на https://railway.app
3. "New Project" → "Deploy from GitHub repo"
4. Выберите репозиторий
5. Переменные окружения в Dashboard → Variables:
   - `BOT_TOKEN=your_token`
6. Deploy!

#### Плюсы Railway:
- ✅ Не засыпает на бесплатном тарифе (но есть лимит $5)
- ✅ Автодеплой из GitHub
- ✅ Логи в реальном времени

---

### Вариант 3: Fly.io

**Стоимость:** Бесплатно (до 5$ в месяц)

#### Установка CLI:
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

#### Деплой:
```bash
cd prod-package/bot
# Создайте fly.toml
cat > fly.toml << 'EOF'
app = "trip-analyzer-bot"
primary_region = "ams"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"

[processes]
  app = "node bot/bot.js"
EOF

fly launch
fly secrets set BOT_TOKEN=your_token_here
fly deploy
```

---

### Вариант 4: Heroku (с оговорками)

**Стоимость:** Требует кредитную карту (но есть альтернатива)

**ВАЖНО:** Heroku убрал бесплатный тариф в 2022.

**Альтернатива:** Heroku Eco (5$/мес) - минимальная стоимость.

---

### Вариант 5: Домашний сервер / Raspberry Pi

Если есть старый компьютер или Raspberry Pi:

```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Копирование бота
scp -r prod-package/bot pi@raspberrypi.local:~/bot
ssh pi@raspberrypi.local

cd bot
npm install
echo "BOT_TOKEN=your_token" > .env

# Запуск через PM2
sudo npm install -g pm2
pm2 start bot/bot.js --name trip-bot
pm2 startup
pm2 save
```

**Плюсы:**
- ✅ 100% контроль
- ✅ Никаких ограничений
- ✅ Работает 24/7

**Минусы:**
- ⚠️ Нужен статический IP или DDNS
- ⚠️ Настройка роутера (проброс портов не нужен для бота)

---

## 🔧 Вариант "Всё в одном" (Render Web Service + Static Site)

Можно разместить и веб, и бот на одном сервисе Render:

### Структура моно-репо:
```
trip-analyzer/
├── package.json
├── server.js          # Express сервер
├── bot/               # Telegram bot
│   └── bot.js
└── web/               # Статические файлы
    ├── index.html
    └── assets/
```

### package.json:
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "telegraf": "^4.16.3",
    "canvas": "^3.2.3",
    "chart.js": "^4.5.1"
  }
}
```

### server.js:
```javascript
import express from 'express';
import { Telegraf } from 'telegraf';
import { handler } from './bot/bot.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы веб-приложения
app.use(express.static('web'));

// Telegram webhook
const bot = new Telegraf(process.env.BOT_TOKEN);
app.use(bot.webhookCallback('/webhook'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 📊 Сравнение вариантов

### Веб-приложение:

| Сервис | Сложность | Лимиты | HTTPS | Кастомный домен |
|--------|-----------|--------|-------|-----------------|
| **Netlify** | ⭐ Легко | 100GB/мес | ✅ | ✅ |
| **Vercel** | ⭐ Легко | 100GB/мес | ✅ | ✅ |
| **GitHub Pages** | ⭐ Легко | 1GB, 100GB/мес | ✅ | ✅ |
| **Surge.sh** | ⭐ Легко | Базовый домен | ✅ | ✅ |

### Telegram Bot:

| Сервис | Сложность | Сон | Лимиты | Логи |
|--------|-----------|-----|--------|------|
| **Render** | ⭐ Легко | Да (15 мин) | 750 часов/мес | ✅ |
| **Railway** | ⭐ Легко | Нет | $5/мес | ✅ |
| **Fly.io** | ⭐⭐ Средне | Нет | $5/мес | ✅ |
| **Домой** | ⭐⭐⭐ Сложно | Нет | Нет | ✅ |

---

## 🎯 Рекомендуемая комбинация

**Для максимальной бесплатности:**

1. **Веб:** Netlify или GitHub Pages
2. **Бот:** Render.com (с крон-запросом для awake)

**Для минимальной задержки:**

1. **Веб:** Netlify
2. **Бот:** Railway.app (не засыпает, но $5/мес лимит)

---

## ⚡ Быстрый чек-лист деплоя

### Веб на Netlify:
- [ ] Перетащить папку `web/` на https://app.netlify.com/drop
- [ ] Проверить URL
- [ ] Проверить загрузку CSV
- [ ] Done! ✅

### Бот на Render:
- [ ] Загрузить бот на GitHub
- [ ] Создать Web Service на Render
- [ ] Добавить `BOT_TOKEN` в Environment Variables
- [ ] Проверить работу бота
- [ ] (Опционально) Настроить крон для keep-alive
- [ ] Done! ✅

---

## 🆘 Типичные проблемы

### Бот не отвечает на Render:
```
Причина: Бот уснул
Решение: Отправьте сообщение, ждите 30 сек
```

### Веб не грузит CSV:
```
Причина: Неверный MIME type
Решение: Проверьте, что сервер отдает .csv файлы
```

### Ошибка "Cannot find module":
```
Причина: Не установлены зависимости
Решение: npm install
```

### Canvas не работает на Linux:
```bash
# Установите зависимости canvas
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

---

## 📞 Поддержка

- Токен бота: `7919748217:AAH2nLOPmW7XMzEEgfqyuM_pbFcdN5TRJAg`
- Бот: @Ksndr3000_bot
- Версия: 2.0.0
