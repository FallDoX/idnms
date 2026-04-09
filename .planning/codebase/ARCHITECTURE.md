# Architecture

## Architectural Pattern

**Single-Page Application (SPA)** with React 19 as the primary framework. The application follows a **component-based architecture** with custom hooks for logic separation. Main component (`App.tsx` ~1800 lines after refactoring).

## Application Structure

### Entry Point

```
src/main.tsx
  └─ ErrorBoundary wrapper
      └─ App (main component)
```

**Entry Point**: `src/main.tsx`
- React 19 StrictMode enabled
- ErrorBoundary wrapper for error handling
- Root element: `<div id="root">` in `index.html`

### Component Hierarchy

```
App (main container)
├─ File Upload Zone
├─ Dashboard (when data loaded)
│  ├─ TripOverview (component)
│  │  ├─ Summary Cards Grid
│  │  │  └─ StatCard (memoized)
│  │  └─ Settings Panel (expandable)
│  ├─ Main Chart Section
│  │  ├─ Chart Controls (toggles, zoom, filters)
│  │  └─ Chart.js Line/Scatter Component
│  │     └─ Custom Plugin: verticalCursor
│  └─ FloatingDataPanel (draggable overlay)
└─ Demo Buttons (for testing)
```

### Data Flow

**Unidirectional Data Flow** (React state):

```
CSV Upload → Parser → TripEntry[] → State
                                    ↓
                              Processing Pipeline
                                    ↓
                            Filtered/Downsampled Data
                                    ↓
                            Chart Components
                                    ↓
                            Visualization
```

**State Management**:
- All state in `App.tsx` using React hooks (`useState`, `useMemo`, `useEffect`)
- No external state management (Redux, Zustand, Context API)
- Props drilling for child components

### Key Abstractions

#### Data Processing Pipeline

1. **Raw Data**: `TripEntry[]` from CSV parser
2. **Filtered Data**: `filterData()` removes anomalies
3. **Downsampled Data**: `downsample()` reduces points for performance
4. **Chart Data**: `combinedChartData` transforms to Chart.js format


### Layers

**Presentation Layer**:
- React components (`src/components/`)
- Tailwind CSS for styling
- Chart.js for visualization

**Business Logic Layer**:
- `src/utils/parser.ts` - CSV parsing, calculations
- `src/utils/performance.ts` - Performance utilities
- `src/i18n.ts` - Internationalization

**Data Layer**:
- CSV file upload (client-side)
- In-memory state (no persistence)
- No database or API layer

### Design Patterns

**Custom Hook Pattern**:
- `createI18n()` - Returns i18n singleton with `t`, `setLanguage`, `getLanguage`
- `useChartOptions()` - Encapsulates common Chart.js options
- `useChartState()` - Manages chart-related state (zoom, view mode, toggles)

**Memoization**:
- `memo()` for `StatCard`, `ToggleChip` components
- `useMemo()` for expensive computations (filteredData, displayData, combinedChartData)
- `useCallback()` for event handlers

**Plugin Pattern**:
- Custom Chart.js plugin: `verticalCursorPlugin` for chart hover effects
- Registered globally in `App.tsx`

**Component Composition**:
- Small reusable components (`StatCard`, `ToggleChip`, `TripOverview`)
- Main component (`App.tsx`) refactored to ~1800 lines from ~2500

### Performance Optimizations

**Data Downsampling**:
- `downsample()` function reduces data points (default 2000, adaptive to 4000 when zoomed)
- Critical for large CSV files

**Throttling**:
- `throttle()` utility from `performance.ts` for rate-limiting chart hover events

**Memoization**:
- Expensive computations cached with `useMemo`
- Component re-renders prevented with `memo()`

### Chart Architecture

**Chart.js Integration**:
- Global registration of Chart.js components and plugins
- Time-scale adapter for date/time axes
- Custom plugin for vertical cursor line
- Line and Scatter chart support

**Chart Options Pattern**:
- Common options object shared across charts
- Per-chart customizations merged in
- Responsive design with maintainAspectRatio: false

### Error Handling

**ErrorBoundary Component**:
- Wraps entire app in `main.tsx`
- Catches React component errors
- Fallback UI not implemented (uses default)

**CSV Parsing**:
- Try-catch in date parsing functions
- Graceful handling of missing/invalid data
- Returns empty array on parse failure

### Internationalization Architecture

**i18n Singleton**:
- Global `i18n` object exported from `src/i18n.ts`
- Browser language detection via `navigator.language`
- Translation object with English and Russian
- Template interpolation support (`{{key}}` syntax)

**No React Context**:
- i18n is a singleton, not React state
- Direct function calls for translations

### File Upload Architecture

**Client-Side Processing**:
- File input with drag-and-drop support
- PapaParse for CSV parsing
- No server upload or storage
- All processing in browser memory

### Screenshot Generation Architecture

**html-to-image Integration**:
- `toPng()` function for PNG generation
- Captures entire DOM tree
- High-resolution output (1.5x scale)
- Downloads via Blob API

## Architectural Concerns

**Monolithic Component**:
- `App.tsx` is ~2500 lines - should be split into smaller components
- Mixing concerns: UI, state management, business logic, calculations

**No State Management**:
- All state in single component
- Props drilling for nested components
- Difficult to scale as app grows

**No Persistence**:
- All data in memory
- Lost on page refresh
- No local storage or database

**No Error Recovery**:
- ErrorBoundary catches errors but no fallback UI
- CSV parse errors show minimal feedback
