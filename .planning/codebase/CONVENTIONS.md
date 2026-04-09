# Code Conventions

## Code Style

### TypeScript/JavaScript

**Imports:**
- Group imports: React, libraries, local components, utils, types
- Named imports preferred over default imports
- Example:
  ```typescript
  import React, { useState, useMemo } from 'react';
  import { Line } from 'react-chartjs-2';
  import { AccelerationTable } from './components/AccelerationTable';
  import { parseTripData } from './utils/parser';
  import type { TripEntry } from './types';
  ```

**Component Definition:**
- Functional components with hooks (no class components)
- Props interfaces defined before component
- Memo wrapper for performance-critical components
- Example:
  ```typescript
  interface StatCardProps {
    title: string;
    value: string | number;
  }

  const StatCard = memo(({ title, value }: StatCardProps) => {
    // component logic
  });
  ```

**TypeScript Usage:**
- Explicit type annotations for function parameters
- Type inference for return values
- Interface for object shapes, type for unions/primitives
- Type assertions avoided when possible
- Example:
  ```typescript
  function parseTripData(csv: string): TripEntry[] {
    // implementation
  }
  ```

## Naming Conventions

### Variables & Functions
- **camelCase** for variables and functions
- Descriptive names, avoid abbreviations
- Example: `parseTripData`, `filteredData`, `chartZoom`

### Components
- **PascalCase** for React components
- Descriptive names matching functionality
- Example: `AccelerationChart`, `FloatingDataPanel`, `StatCard`

### Types & Interfaces
- **PascalCase** for interfaces and type aliases
- Descriptive names ending with type suffix when helpful
- Example: `TripEntry`, `TripSummary`, `AccelerationRun`, `CSVFormat`

### Constants
- **UPPER_SNAKE_CASE** for constants
- Example: `IDLE_THRESHOLD_KMH`, `MAX_PEAK_ACCEL`

### CSS Classes
- **kebab-case** for Tailwind utility classes (framework convention)
- Custom CSS classes use camelCase or kebab-case consistently
- Example: `bg-gradient-to-br`, `backdrop-blur-xl`

## Code Organization

### File Structure
- One component per file (except small inline components)
- Related utilities grouped in `utils/` directory
- Types in `types.ts` (centralized type definitions)
- i18n in `i18n.ts` (centralized translations)

### Component Organization
- Imports at top
- Type definitions
- Sub-components (if any)
- Main component
- Exports at bottom
- Example:
  ```typescript
  import React from 'react';
  import type { Props } from './types';

  // Sub-components
  const Header = () => { ... };

  // Main component
  export const Component = () => { ... };
  ```

### Function Organization
- Helper functions before main functions
- Pure functions preferred
- Side effects isolated

## React Patterns

### Hooks Usage
- Functional components with hooks (no class components)
- Custom hooks not currently used (opportunity)
- `useState` for local state
- `useMemo` for expensive computations
- `useCallback` for event handlers
- `useEffect` for side effects

### State Management
- Local component state with `useState`
- No global state management (Redux, Zustand, Context)
- Props drilling for nested components
- Singleton pattern for i18n (not React state)

### Component Patterns
- `memo()` for performance-critical components
- Fragment `<>...</>` for grouping elements
- Conditional rendering with ternary operators
- List rendering with `.map()`

## Error Handling

### Try-Catch Usage
- CSV parsing: try-catch in date parsing functions
- Returns `NaN` or empty arrays on failure
- No global error boundary fallback UI
- Example:
  ```typescript
  try {
    const date = new Date(...);
    return date.getTime();
  } catch (e) {
    return NaN;
  }
  ```

### Error Boundaries
- ErrorBoundary wraps entire app in `main.tsx`
- Catches React component errors
- No custom fallback UI implemented

### User Feedback
- Alert dialogs for critical errors
- Console logging for debugging
- No toast notifications or inline error messages

## Performance Patterns

### Memoization
- `useMemo()` for expensive computations:
  - `filteredData` - Data filtering
  - `displayData` - Data downsampling
  - `combinedChartData` - Chart data transformation
- `memo()` for components:
  - `StatCard` - Summary cards
  - `ToggleChip` - Metric toggles

### Throttling
- `throttle()` utility from `performance.ts`
- Used for chart hover events (rate limiting)
- Prevents excessive re-renders

### Data Downsampling
- `downsample()` function reduces data points
- Adaptive limit: 2000 points (4000 when zoomed)
- Critical for large CSV files

## Styling Conventions

### Tailwind CSS
- Utility-first approach
- No custom CSS classes in most cases
- Responsive design with mobile-first approach
- Example: `flex-col sm:flex-row`, `text-sm lg:text-base`

### Gradient Patterns
- Consistent gradient usage for visual hierarchy
- Example: `bg-gradient-to-br from-indigo-900/90 via-slate-900/95 to-purple-900/90`

### Color Scheme
- Dark theme with slate/indigo/purple gradients
- Amber/gold for highlights
- Consistent color palette across components

## Internationalization

### Translation Keys
- camelCase keys in translation object
- Nested structure for organization
- Example: `appTitle`, `maxSpeed`, `accelerationAnalysis`

### Usage Pattern
- Global i18n singleton
- Template interpolation with `{{key}}` syntax
- Example:
  ```typescript
  const text = i18n.t('zoomInfo', { minutes: 5, percent: 25 });
  ```

### Language Detection
- Browser language detection via `navigator.language`
- Falls back to English if unsupported
- Manual language switching available

## Comments & Documentation

### Code Comments
- Minimal inline comments (code should be self-documenting)
- Comments for complex algorithms
- No JSDoc or extensive documentation

### Function Documentation
- No function documentation comments
- TypeScript interfaces serve as documentation
- Descriptive function names

## File Encoding & Line Endings
- UTF-8 encoding
- LF line endings (git configured)
- No BOM

## Git Conventions

### Branching
- Main branch for production
- Feature branches not strictly enforced
- Direct commits to main allowed

### Commit Messages
- Not following conventional commits strictly
- Descriptive messages
- Example: "Fix acceleration section layout for mobile"

## Anti-Patterns

### Avoid
- Class components (use functional components)
- Default imports (use named imports)
- Any type (use specific types)
- Prop drilling without Context (consider Context API)
- Large monolithic components (split App.tsx)
- Global variables (use React state)
- Inline styles (use Tailwind classes)

### Currently Present
- Large monolithic `App.tsx` (~2500 lines)
- Props drilling (no Context API)
- No state management library
- Singleton i18n (not React state)
- Minimal error handling
