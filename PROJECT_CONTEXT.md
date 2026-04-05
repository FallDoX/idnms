# Trip Log Analyzer - Проектный контекст

## 📋 Общее описание
Кроссплатформенное веб-приложение для анализа телеметрии поездок из CSV логов. 
Работает в любом браузере (Windows, macOS, Linux).

## 🛠️ Технологический стек
- **React 19** + **TypeScript**
- **Vite 8** - сборщик
- **Tailwind CSS 4** - стилизация
- **Chart.js 4** + react-chartjs-2 - графики
- **PapaParse** - парсинг CSV
- **lucide-react** - иконки

## 📁 Структура проекта
```
log-analyzer/
├── src/
│   ├── App.tsx                    # Главный компонент
│   ├── types.ts                   # TypeScript типы
│   ├── utils/
│   │   └── parser.ts              # Парсер CSV + расчёт ускорения
│   ├── components/
│   │   ├── AccelerationChart.tsx  # График попыток разгона
│   │   ├── AccelerationTable.tsx  # Пороги ускорения + потребление
│   │   └── TimeRangeSlider.tsx    # Шкала времени (не используется в основном графике)
│   └── main.tsx                   # Entry point
├── dist/                          # Сборка (npm run build)
├── package.json
└── vite.config.ts
```

## 📊 Поддерживаемые форматы CSV

### Старый формат:
- Колонки: `Date`, `Speed`, `Voltage`, `PWM`, `Current`, `Power`, `Battery level`, `Total mileage`, `Temperature`, `GPS Speed`, `Latitude`, `Longitude`, `Altitude`
- Дата: `"02.04.2026 09:33:15.123"`

### Новый формат:
- Колонки: `date`, `time`, `speed`, `voltage`, `pwm`, `current`, `power`, `battery_level`, `totaldistance`, `system_temp`, `phase_current`, `torque`, `temp2`, `gps_speed`, `latitude`, `longitude`, `gps_alt`
- Дата раздельно: `date="2026-03-22"`, `time="11:30:38.234"`

**Автоопределение формата** - парсер сам определяет по заголовкам.

## 🎨 Дизайн
- Тёмная тема: `bg-slate-950` градиенты
- Glassmorphism: `backdrop-blur-xl`, `bg-white/5`
- Градиентные карточки статистики
- Toggle chips для метрик графика

## 🖱️ Интерактивность графиков

### Основной график (App.tsx):
- **Горизонтальный свайп** - сдвиг (pan)
- **Вертикальный свайп** - zoom
- **Двойной клик** - сброс zoom
- **Мини-шкала времени** с растягиваемыми краями:
  - Тяни левый/правый край = изменить zoom границы
  - Тяни синюю зону = сдвиг viewport
  - Клик вне зоны = центрировать

### График попыток разгона (AccelerationChart.tsx):
- Аналогичное управление
- Относительная шкала времени (0с - maxRunTime)
- Мини-шкала с зелёными акцентами

## 📈 Метрики на основном графике (чекбоксы)
- Speed (вкл по умолчанию)
- GPS Speed
- Power (вкл)
- Current
- Phase Current (только новый формат)
- Voltage (вкл)
- Battery %
- Temperature (вкл)
- Temp 2 (только новый формат)
- Torque (только новый формат)
- PWM (вкл по умолчанию) - ось Y5, 0-100%

## ⚡ Секция ускорения
1. **Потребление в движении** - мини-сводка:
   - Средняя мощность (W)
   - Разряд батареи (%)
   - Эффективность (Wh/km)
   - Пиковая мощность (W)

2. **Пороги ускорения** - компактный список:
   - Быстрые пресеты: 25, 50, 60, 80, 100, 120 км/ч
   - Редактирование по клику (Enter/Enter)
   - Временные бары с цветовой кодировкой

## 🔧 Ключевые файлы для понимания

### parser.ts:
- `parseTripData(csv)` - парсит оба формата CSV
- `calculateSummary(data)` - расчёт статистики
- `findAccelerationRuns(data)` - поиск попыток разгона
- `getAccelerationForThresholds(data, thresholds)` - времена по порогам
- `downsample(data, limit)` - оптимизация для графика

### App.tsx:
- State: `chartZoom`, `thresholds`, `chartToggles`, `timeRange`
- Handlers: pan, zoom, timeline drag
- Главный layout: header → settings → stat cards → chart → acceleration

## 🚀 Команды
```bash
npm run dev      # Dev сервер
npm run build    # Сборка в dist/
npm run preview  # Превью сборки
```

## 📦 Бекап
Текущая версия сохранена в `src-backup-v3/`

## ⚠️ Известные особенности
- TimeRangeSlider.tsx существует но не используется (удалён из основного графика)
- Zoom основного графика: min/max в миллисекундах (timestamp)
- Zoom attempts chart: min/max в секундах (relative time)
- Electron полностью удалён (версия 2.0.0+)

## 🎯 Что можно улучшить (TODO)
- Сенсорный экран (touch events)
- Экспорт графикв в PNG
- Сохранение настроек в localStorage
- Поддержка нескольких файлов
- Карта с GPS треком
