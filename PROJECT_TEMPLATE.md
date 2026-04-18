# WindFighter Telemetry App - Project Template

## Техническая документация проекта

### Стек технологий
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with zoom (ChartWithZoom component)
- **Build**: Vite
- **Deployment**: Netlify / GitHub Pages

### Структура проекта
```
src/
├── components/          # React компоненты
│   ├── AccelerationTab.tsx
│   ├── AccelerationComparison.tsx
│   ├── ChartWithZoom.tsx
│   ├── GPSMap.tsx
│   └── ...
├── types/              # TypeScript типы
│   └── index.ts
├── App.tsx             # Главный компонент
└── main.tsx            # Точка входа
```

### Основные компоненты

#### AccelerationTab
- Отображает попытки разгона
- Фильтрация по пресетам
- График с зумом
- Кастомные пресеты

#### AccelerationComparison
- Сравнение попыток разгона
- Таблица с результатами

#### GPSMap
- Карта маршрута
- Leaflet для отображения

### Ключевые типы данных

```typescript
interface AccelerationAttempt {
  id: string;
  thresholdPair: { from: number; to: number };
  time: number;
  distance: number;
  startTimestamp: number;
  endTimestamp: number;
}

interface TripEntry {
  timestamp: number;
  Speed: number;
  Latitude: number;
  Longitude: number;
  // ... другие поля
}
```

### Важные паттерны

#### 1. Использование useMemo для производительности
```typescript
const filteredData = useMemo(() => {
  return data.filter(item => item.Speed > 0);
}, [data]);
```

#### 2. Использование useState для состояния
```typescript
const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
```

#### 3. Обработка событий
```typescript
const handleClick = (id: string) => {
  setSelectedPresets(prev => {
    const next = new Set(prev);
    next.add(id);
    return next;
  });
};
```

### Git workflow

#### Правила работы с Git
1. **Маленькие коммиты** - один функционал = один коммит
2. **Описательные сообщения** - `feat: Add custom presets` или `fix: Fix infinite loop`
3. **Не откатывай назад без понимания** - используй `git log --oneline` чтобы понять историю
4. **Force push только когда нужно** - если уже запушил изменения

#### Команды Git
```bash
# Посмотреть историю
git log --oneline -10

# Откат на 1 коммит
git reset --hard HEAD~1

# Откат на конкретный коммит
git reset --hard <commit-hash>

# Вернуться к origin/main
git reset --hard origin/main

# Force push (осторожно!)
git push -f
```

### Развертывание

#### Netlify
- Автоматический деплой из GitHub
- URL: https://wfeucapp.netlify.app/

#### GitHub Pages
- URL: https://falldox.github.io/WindFighter-telemetry-app/

### Локальная разработка

```bash
npm install          # Установка зависимостей
npm run dev          # Запуск dev сервера (http://localhost:5173)
npm run build        # Сборка для продакшена
npm run preview      # Просмотр собранной версии
```

### Типичные проблемы и решения

#### 1. Бесконечный ререндер
- **Причина**: console.log в useMemo/useEffect или циклические зависимости
- **Решение**: Убрать console.log из хуков, проверить зависимости

#### 2. TypeError: Cannot read property
- **Причина**: Данные не загружены или null/undefined
- **Решение**: Добавить проверки `data?.length` или `data || []`

#### 3. Линтер ошибки
- **Причина**: Неиспользуемые переменные или неправильные типы
- **Решение**: Исправить или добавить `// eslint-disable-next-line`

### Мобильная адаптивность

Используй Tailwind классы с префиксами:
- `md:` для планшетов и выше
- `lg:` для десктопов
- `min-h-[44px]` для тач-таргетов

Пример:
```tsx
<button className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base">
  Кнопка
</button>
```

### Цветовая палитра

```typescript
const PRESET_COLORS = {
  '0-25': '#3b82f6',   // primary (blue)
  '0-60': '#10b981',   // success (green)
  '0-90': '#f59e0b',   // warning (orange)
  '0-100': '#ef4444',  // danger (red)
  'custom': '#8b5cf6', // info (purple)
};
```

### Работа с графиками

#### ChartWithZoom
- Поддержка зума и пана
- Временные маркеры
- Несколько датасетов

Пример:
```typescript
<ChartWithZoom
  data={chartData}
  timeRange={timeRange}
  timelineMarkers={markers}
  yLabel="Скорость (км/ч)"
  xLabel="Время (с)"
/>
```

### Логирование

**НЕ ИСПОЛЬЗУЙ console.log в useMemo/useEffect** - это вызывает бесконечный ререндер.

Для отладки используй:
```typescript
// В компоненте (не в хуках)
console.log('Debug:', { data, state });

// Или временно в useEffect (с осторожностью)
useEffect(() => {
  console.log('Effect triggered');
}, [dependency]);
```

### TypeScript

#### Строгая типизация
```typescript
interface Props {
  data: TripEntry[];
  onAction: (id: string) => void;
}

const Component: React.FC<Props> = ({ data, onAction }) => {
  // ...
};
```

#### Generics для переиспользования
```typescript
function filterArray<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.filter(predicate);
}
```

### Тестирование

#### Ручное тестирование
1. Открой браузер на http://localhost:5173
2. Проверь все табы
3. Проверь мобильную версию (devtools -> mobile view)
4. Проверь консоль на ошибки

#### Автоматическое тестирование (в будущем)
```bash
npm run test        # Юнит тесты
npm run e2e         # E2E тесты (Playwright)
```

### Безопасность

#### Токены и секреты
- **НЕ храни** в коде токены ботов, API ключи
- Используй переменные окружения: `.env`
- Добавь `.env` в `.gitignore`

Пример:
```typescript
// ПЛОХО
const BOT_TOKEN = '1234567890:ABC...';

// ХОРОШО
const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;
```

### Производительность

#### Ленивая загрузка компонентов
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### Виртуализация для больших списков
```typescript
import { FixedSizeList } from 'react-window';
```

#### Debouncing для input
```typescript
const debouncedSearch = useMemo(
  () => debounce((value: string) => setSearch(value), 300),
  []
);
```

### Доступность (Accessibility)

#### ARIA атрибуты
```tsx
<button
  aria-label="Закрыть"
  aria-pressed={isActive}
  onClick={handleClick}
>
  ×
</button>
```

#### Клавиатурная навигация
```tsx
<div
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleClick();
  }}
>
  Нажми Enter
</div>
```

### Международизация (i18n)

В будущем можно добавить:
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<button>{t('buttons.close')}</button>
```

### Плагины и расширения

#### Рекомендуемые VS Code расширения
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- GitLens

### Конфигурация

#### Vite (vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
```

#### Tailwind (tailwind.config.js)
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Полезные ссылки

- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

### Контакты и поддержка

- GitHub: https://github.com/FallDoX/WindFighter-telemetry-app
- Issues: https://github.com/FallDoX/WindFighter-telemetry-app/issues
