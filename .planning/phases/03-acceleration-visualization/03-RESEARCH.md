# Phase 3: Acceleration Visualization - Research

**Mode:** Ecosystem
**Phase:** 03-acceleration-visualization
**Research Date:** 2026-04-09

## Standard Stack

### Chart.js Integration
- **Chart.js 4.x** - Already in use in the project (see `src/App.tsx`)
- **Line chart type** - Standard for speed vs time visualization
- **Dataset management** - Chart.js supports dynamic dataset updates via `chart.data.datasets`
- **Mode switching** - Achieved by swapping entire dataset arrays based on mode state

### React State Management
- **useState** - For mode state (telemetry vs acceleration)
- **useMemo** - For dataset computation (performance optimization)
- **useCallback** - For event handlers (attempt selection, mode toggle)

### Component Structure
- **ToggleChip** - Already exists in `src/App.tsx` for metric toggles
- **FloatingDataPanel** - Already exists for telemetry data, can be reused for attempt details
- **Memoized components** - Use React.memo for attempt buttons to prevent re-renders

## Architecture Patterns

### Mode Switching Pattern
```typescript
// Mode state
const [chartMode, setChartMode] = useState<'telemetry' | 'acceleration'>('telemetry');

// Conditional dataset rendering
const chartData = useMemo(() => {
  if (chartMode === 'telemetry') {
    return telemetryChartData; // existing implementation
  } else {
    return accelerationChartData; // new implementation
  }
}, [chartMode, chartToggles, selectedAttempts]);
```

### Button Set Switching Pattern
```typescript
// Conditional button rendering
{chartMode === 'telemetry' && (
  <ToggleChip label={i18n.t('speed')} active={chartToggles.speed} ... />
)}
{chartMode === 'acceleration' && (
  <AttemptButton attempt={attempt} selected={selected} onSelect={...} />
)}
```

### Attempt Selection Pattern
```typescript
// Multi-selection state
const [selectedAttempts, setSelectedAttempts] = useState<Set<number>>(new Set());

// Toggle selection
const toggleAttempt = (attemptIndex: number) => {
  setSelectedAttempts(prev => {
    const next = new Set(prev);
    if (next.has(attemptIndex)) {
      next.delete(attemptIndex);
    } else {
      next.add(attemptIndex);
    }
    return next;
  });
};
```

### Color Assignment Pattern
```typescript
// Predefined color palette for attempts
const ATTEMPT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#f97316', '#06b6d4', '#a78bfa', '#fb923c'
];

// Assign color by index modulo palette length
const attemptColor = ATTEMPT_COLORS[attemptIndex % ATTEMPT_COLORS.length];
```

## Don't Hand-Roll

### Chart.js Features
- **Dataset visibility** - Use `chart.setDatasetVisibility(index, visible)` instead of manual opacity manipulation
- **Legend filtering** - Use Chart.js built-in legend filtering instead of custom button logic
- **Responsive sizing** - Use Chart.js `maintainAspectRatio: false` with container sizing

### React Patterns
- **Context API** - Don't use for simple mode state (useState is sufficient)
- **Redux** - Don't add Redux for mode state (over-engineering)
- **Custom hooks** - Don't create custom hook for mode switching (useState is sufficient)

### Performance
- **Debounce** - Use existing `throttle` utility from `src/utils/performance`
- **Virtual scrolling** - Don't implement for attempt buttons (horizontal scroll is sufficient for < 50 attempts)
- **Web Workers** - Don't use for dataset computation (client-side processing is fast enough)

## Common Pitfalls

### Chart.js Pitfalls
1. **Dataset memory leaks** - Always destroy old chart instances before creating new ones
   - **Solution:** Use `chart.destroy()` before `new Chart()`
2. **Performance with many datasets** - Rendering > 20 datasets can be slow
   - **Solution:** Limit selected attempts to 10-12, show warning for more
3. **Axis scaling conflicts** - Telemetry mode uses multiple y-axes (y, y1, y2, etc.)
   - **Solution:** Reset to single y-axis for acceleration mode, restore on mode switch

### React Pitfalls
1. **Unnecessary re-renders** - Attempt buttons re-render on every mode change
   - **Solution:** Memoize attempt buttons with React.memo
2. **State synchronization** - Selected attempts not cleared when mode switches
   - **Solution:** Clear selected attempts when switching to telemetry mode
3. **Event handler closure** - Attempt selection handlers capture stale state
   - **Solution:** Use useCallback with proper dependencies

### UX Pitfalls
1. **Mode confusion** - Users don't know which mode is active
   - **Solution:** Clear visual indication (active button state, mode label)
2. **Empty state** - No attempts selected in acceleration mode
   - **Solution:** Show "Select attempts to view" message or auto-select first attempt
3. **Color collision** - Same color for different attempts
   - **Solution:** Use distinct color palette with sufficient contrast

## Code Examples

### Mode Toggle Implementation
```typescript
// In App.tsx
const [chartMode, setChartMode] = useState<'telemetry' | 'acceleration'>('telemetry');

// Mode toggle button
<button
  onClick={() => setChartMode(prev => prev === 'telemetry' ? 'acceleration' : 'telemetry')}
  className={cn(
    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
    chartMode === 'acceleration' ? "bg-blue-500/20 border-blue-500/40 text-blue-200" : "bg-slate-700/50 border-slate-600 text-slate-400"
  )}
>
  Ускорение
</button>
```

### Acceleration Dataset Construction
```typescript
const accelerationChartData = useMemo(() => {
  const datasets = accelerationAttempts
    .filter((_, index) => selectedAttempts.has(index))
    .map((attempt, index) => ({
      label: `Attempt ${index + 1} (${attempt.fromSpeed}-${attempt.toSpeed} km/h)`,
      data: attempt.dataPoints.map(dp => ({ x: dp.timestamp, y: dp.speed })),
      borderColor: ATTEMPT_COLORS[index % ATTEMPT_COLORS.length],
      backgroundColor: `${ATTEMPT_COLORS[index % ATTEMPT_COLORS.length]}20`,
      fill: false,
      tension: 0.1,
      pointRadius: 0,
    }));

  return { datasets };
}, [accelerationAttempts, selectedAttempts]);
```

### Attempt Button Component
```typescript
const AttemptButton = memo(({ attempt, index, selected, onSelect, color }: AttemptButtonProps) => (
  <button
    onClick={() => onSelect(index)}
    className={cn(
      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
      selected
        ? `${color}20 border ${color}50 text-white`
        : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
    )}
  >
    {index + 1} ({attempt.fromSpeed}-{attempt.toSpeed})
  </button>
));
```

## Validation Architecture

### Performance Validation
- **Dataset count** - Limit to 10-12 selected attempts
- **Render time** - Chart render < 500ms for 10 datasets
- **Memory usage** - No memory leaks when switching modes

### UX Validation
- **Mode clarity** - Active mode visually distinct
- **Empty state** - Helpful message when no attempts selected
- **Color accessibility** - WCAG AA contrast ratio for attempt colors

### Integration Validation
- **Telemetry mode** - Existing functionality unchanged
- **Acceleration mode** - New functionality works independently
- **Mode switch** - Seamless transition without state corruption

## Summary

**Key Findings:**
1. Chart.js already supports dynamic dataset switching - no new library needed
2. Mode switching can be achieved with simple useState + useMemo pattern
3. Attempt selection follows standard multi-selection pattern (Set<number>)
4. Color assignment uses predefined palette with modulo indexing
5. Performance is manageable with < 20 datasets, limit to 10-12 for safety
6. FloatingDataPanel can be reused for attempt details (minor adaptation needed)

**Implementation Approach:**
- Add chartMode state to App.tsx
- Create accelerationChartData useMemo
- Create AttemptButton component (memoized)
- Add mode toggle button to chart controls
- Conditional rendering for button sets (telemetry vs acceleration)
- Clear selected attempts on mode switch to telemetry
- Limit selection to 10-12 attempts with warning

**Risks:**
- Low: Chart.js dataset switching complexity (well-documented pattern)
- Low: Performance with many datasets (mitigated by selection limit)
- Low: State synchronization issues (mitigated by clear mode switch logic)

**Confidence:** High - All patterns are standard Chart.js/React patterns, no novel approaches required.

---

## RESEARCH COMPLETE
