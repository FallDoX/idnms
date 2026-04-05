# Telegram Bot for Trip Log Analyzer

Бот для анализа CSV логов поездок прямо в Telegram.

## Функционал

- 📤 Получает CSV файлы с логами
- 📊 Анализирует скорость, мощность, ток, напряжение
- 🚀 Рассчитывает ускорение (0-30, 0-50, 20-50, 30-50 км/ч)
- 🗺️ Показывает GPS трек
- 📈 Генерирует графики

## Команды

- `/start` - Начать работу с ботом
- `/help` - Помощь

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Сборка бота

```bash
npm run bot:build
```

### 3. Запуск бота

```bash
npm run bot:start
```

Или с переменной окружения:

```bash
BOT_TOKEN=your_token_here npm run bot:start
```

## Разработка

```bash
# Watch mode для разработки
npm run bot:dev
```

## Структура

```
bot/
├── bot.ts            # Основной файл бота
├── chart-generator.ts # Генератор графиков
└── types.ts          # Типы для бота
```

## Токен бота

Токен уже встроен в код: `7919748217:AAH2nLOPmW7XMzEEgfqyuM_pbFcdN5TRJAg`

Бот: [@Ksndr3000_bot](https://t.me/Ksndr3000_bot)
