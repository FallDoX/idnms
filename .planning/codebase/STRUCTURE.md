# Directory Structure

## Root Directory Layout

```
log-analyzer/
├── .git/                          # Git repository
├── .planning/                     # GSD workflow artifacts
│   ├── config.json               # GSD configuration
│   └── codebase/                # Codebase documentation (this directory)
├── .windsurf/                    # Windsurf IDE configuration
├── bot/                          # Telegram bot source (optional feature)
│   ├── bot.ts                   # Bot entry point
│   ├── handlers/                # Bot command handlers
│   └── utils/                   # Bot utilities
├── bot-dist/                     # Compiled bot output
├── data/                         # Test/demo data files
│   ├── demo-trip.csv            # Demo trip log for testing
│   └── [other test files]
├── dist/                         # Vite build output (gitignored)
├── node_modules/                 # Dependencies (gitignored)
├── public/                       # Static assets
│   ├── vite.svg
│   └── [other assets]
├── prod-package/                 # Production package artifacts
├── release/                      # Release builds
├── src/                          # Application source code
│   ├── App.tsx                  # Main application component (~2500 lines)
│   ├── App.css                  # Global styles
│   ├── index.css                # Base styles
│   ├── main.tsx                 # Application entry point
│   ├── assets/                  # Asset files
│   ├── components/              # React components
│   ├── tests/                   # Test scripts
│   ├── types.ts                 # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   └── i18n.ts                  # Internationalization
├── build.bat / build.sh         # Build scripts
├── start.bat / start.sh         # Start scripts
├── eslint.config.js             # ESLint configuration
├── generate-enhanced-demo.cjs  # Demo data generator
├── index.html                   # HTML entry point
├── netlify.toml                 # Netlify deployment config
├── package.json                 # Dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── test-csv.mjs                 # CSV testing script
├── test-wh-km.cjs               # Wheel hub motor testing script
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # App TypeScript config
├── tsconfig.bot.json            # Bot TypeScript config
├── tsconfig.node.json           # Build tool TypeScript config
├── vite.config.ts               # Vite configuration
└── visual-test.py               # Playwright visual regression tests
```

## Source Code Organization

### `src/` - Application Source

**Core Files:**

- `main.tsx` - Application entry point with ErrorBoundary wrapper
- `App.tsx` - Main application component (~1800 lines after refactoring)
- `index.css` - Base CSS styles
- `App.css` - Component-specific styles

**Type Definitions:**

- `types.ts` - TypeScript interfaces:
  - `TripEntry` - Single data point from CSV
  - `TripSummary` - Calculated trip statistics
  - `CSVFormat` - Format type ('old' | 'new')

**Internationalization:**

- `i18n.ts` - Translation system:
  - `translations` object (English, Russian)
  - `detectLanguage()` - Browser language detection
  - `createI18n()` - Returns i18n singleton
  - Exported `i18n` singleton for app-wide use

### `src/components/` - React Components

**Component Files:**

- `TripOverview.tsx` - Trip summary cards with settings panel
- `ErrorBoundary.tsx` - React error boundary wrapper
- `FloatingDataPanel.tsx` - Draggable data overlay panel
- `ScatterPlot.tsx` - Generic scatter plot component
- `TimeRangeSlider.tsx` - Interactive time range selector
- `Tooltip.tsx` - Custom tooltip component with portal

**Component Pattern:**
- Functional components with hooks
- TypeScript interfaces for props
- Tailwind CSS for styling
- No component-specific CSS files

### `src/utils/` - Utility Functions

**Utility Files:**

- `parser.ts` (~20KB) - CSV parsing and data processing:
  - `parseTripData()` - Main CSV parser
  - `parseOldDate()` - Old format date parser
  - `parseNewDate()` - New format date parser
  - `detectFormat()` - Auto-detect CSV format
  - `calculateSummary()` - Trip statistics calculation
  - `downsample()` - Data point reduction for performance
  - `filterData()` - Anomaly removal

- `performance.ts` (~3KB) - Performance utilities:
  - `throttle()` - Rate limiting function
  - `debounce()` - Delayed function execution
  - `memoize()` - Function result caching

### `src/hooks/` - Custom React Hooks

**Hook Files:**

- `useChartOptions.ts` - Encapsulates common Chart.js options
- `useChartState.ts` - Manages chart-related state (zoom, view mode, toggles)

### `src/tests/` - Test Scripts

**Test Files:**

- `analyze-distance.mjs` - Distance analysis tests
- `analyze-gps.mjs` - GPS data analysis tests
- `analyze-logs.mjs` - Log analysis tests
- `test-distance.mjs` - Distance calculation tests
- `user-tests.mjs` - User-defined tests

**Note:** These are JavaScript test scripts, not automated test suites.

### `src/assets/` - Static Assets

Contains image and asset files referenced in the application.

## Configuration Files

### TypeScript Configuration

**Project References Setup:**

- `tsconfig.json` - Root config with references to app and node
- `tsconfig.app.json` - Application code compilation
- `tsconfig.node.json` - Build tool scripts (Vite config)
- `tsconfig.bot.json` - Telegram bot compilation

**Pattern:** Multi-config setup for different compilation targets

### Build Tool Configuration

- `vite.config.ts` - Vite bundler config:
  - React plugin
  - Base path: `./` for relative assets

- `tailwind.config.js` - Tailwind CSS config:
  - Content paths: `index.html`, `src/**/*.{js,ts,jsx,tsx}`
  - Default theme (no extensions)

- `postcss.config.js` - PostCSS processing

### Code Quality Configuration

- `eslint.config.js` - ESLint flat config:
  - TypeScript ESLint
  - React Hooks plugin
  - React Refresh plugin
  - Browser globals

### Deployment Configuration

- `netlify.toml` - Netlify static site deployment

## Build Artifacts

### Generated Directories

- `dist/` - Vite build output (gitignored)
- `bot-dist/` - Compiled bot output (gitignored)
- `node_modules/` - Dependencies (gitignored)

### Build Scripts

- `build.bat` / `build.sh` - Cross-platform build scripts
- `start.bat` / `start.sh` - Cross-platform start scripts

## Documentation Files

- `README.md` - Project documentation
- `PROJECT_CONTEXT.md` - Project context and overview
- `.gitignore` - Git ignore rules

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `AccelerationChart.tsx`)
- Utilities: `camelCase.ts` (e.g., `parser.ts`, `performance.ts`)
- Types: `camelCase.ts` (e.g., `types.ts`)
- Config: `kebab-case.js` or `.json` (e.g., `vite.config.ts`, `package.json`)
- Scripts: `kebab-case.bat/.sh` (e.g., `build.sh`)

**Directories:**
- `camelCase` for most directories (e.g., `components`, `utils`)
- `kebab-case` for some (e.g., `bot-dist`)

**TypeScript Types:**
- Interfaces: `PascalCase` (e.g., `TripEntry`, `AccelerationRun`)
- Type aliases: `PascalCase` (e.g., `CSVFormat`)
- Enums: Not used (union types instead)

## Key Locations

**Entry Points:**
- Web app: `src/main.tsx`
- Bot: `bot/bot.ts` (optional)

**Main Logic:**
- `src/App.tsx` - All application logic in one file
- `src/utils/parser.ts` - Data processing

**Component Library:**
- `src/components/` - Reusable UI components

**Configuration:**
- Root level: Build, deployment, linting configs
- `src/` level: Application-specific configs (none currently)

**Tests:**
- `src/tests/` - Manual test scripts
- `visual-test.py` - Playwright visual tests (root level)

## File Size Indicators

**Large Files (Potential Refactoring Candidates):**
- `src/App.tsx` - ~1800 lines (refactored from ~2500 lines)
- `src/utils/parser.ts` - ~20KB (acceleration functions removed)

**Moderate Files:**
- `src/i18n.ts` - ~324 lines
- `src/components/ScatterPlot.tsx` - ~10KB
- `src/components/TimeRangeSlider.tsx` - ~9KB
- `src/components/TripOverview.tsx` - ~8KB (new component)

**Small Files:**
- `src/types.ts` - ~65 lines (acceleration types removed)
- `src/utils/performance.ts` - ~3KB
- `src/components/Tooltip.tsx` - ~3KB
- `src/hooks/useChartOptions.ts` - ~2KB (new)
- `src/hooks/useChartState.ts` - ~2KB (new)
