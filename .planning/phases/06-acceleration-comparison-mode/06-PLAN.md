---
wave: 1
depends_on:
files_modified:
  - src/App.tsx
  - src/components/AccelerationTable.tsx
  - src/components/AccelerationComparison.tsx
  - src/types.ts
autonomous: true
requirements:
  - REQ-047
  - REQ-048
  - REQ-049
  - REQ-050
---

# Phase 6: Acceleration Comparison Mode - Plan

## Overview

Add comparison mode for multiple acceleration attempts. This phase creates a new "Comparison" tab with checkbox selection in the table, overlaid chart visualization, and delta metrics table.

## Tasks

### Task 1: Add Selection State to App.tsx

<read_first>
- src/App.tsx
- src/types.ts
</read_first>

<action>
Add selectedAttempts state to App.tsx:
- Add `selectedAttempts: Set<string>` state initialized to empty Set
- Add `toggleSelection(attemptId: string)` handler function
- Add `clearSelection()` handler function
- Add `getBestAttempt(attempts: AccelerationAttempt[])` helper function to find attempt with minimum time
</action>

<acceptance_criteria>
- src/App.tsx contains `const [selectedAttempts, setSelectedAttempts] = useState<Set<string>>(new Set())`
- src/App.tsx contains `toggleSelection` function that adds/removes attempt ID from Set
- src/App.tsx contains `clearSelection` function that clears the Set
- src/App.tsx contains `getBestAttempt` function that returns attempt with minimum time
- All functions are properly typed with TypeScript
</acceptance_criteria>

### Task 2: Add Checkbox Column to AccelerationTable

<read_first>
- src/components/AccelerationTable.tsx
- src/App.tsx
</read_first>

<action>
Add checkbox selection column to AccelerationTable:
- Add `onSelectionToggle?: (attemptId: string) => void` prop to AccelerationTableProps interface
- Add `selectedAttempts?: Set<string>` prop to AccelerationTableProps interface
- Add checkbox column as first column in table header (before "№")
- Add checkbox input in each table row cell before attempt number
- Checkbox calls onSelectionToggle with attempt.id when changed
- Checkbox is checked if attempt.id is in selectedAttempts Set
- Style checkbox to match existing table styling (slate theme)
</action>

<acceptance_criteria>
- AccelerationTableProps interface has `onSelectionToggle?: (attemptId: string) => void`
- AccelerationTableProps interface has `selectedAttempts?: Set<string>`
- Table header has checkbox column before "№" column
- Each table row has checkbox input before attempt number cell
- Checkbox calls onSelectionToggle(attempt.id) on change
- Checkbox checked state matches `selectedAttempts.has(attempt.id)`
- Checkbox styling matches existing table theme
</acceptance_criteria>

### Task 3: Create AccelerationComparison Component

<read_first>
- src/components/AccelerationTab.tsx
- src/types.ts
</read_first>

<action>
Create src/components/AccelerationComparison.tsx component:
- Component props: accelerationAttempts, selectedAttempts, data (TripEntry[])
- Import Chart.js and adapters (same as AccelerationTab)
- Import ATTEMPT_COLORS array from AccelerationTab or define locally
- Create useMemo to filter selected attempts from accelerationAttempts
- Create useMemo to calculate best attempt (minimum time) from selected attempts
- Create useMemo to generate chart datasets for selected attempts (overlaid Line charts)
- Create useMemo to calculate delta metrics for each selected attempt relative to best attempt
- Render Chart.js Line component with overlaid curves
- Render delta metrics table with columns: attempt #, time, distance, peak power, avg power, battery drop, Δtime, Δdistance, Δpeak power, Δavg power, Δbattery
- Style delta values: positive deltas in green, negative in red (or reverse based on metric)
- Highlight best attempt in chart (thicker line, different color)
- Show empty state when no attempts selected
- Use glassmorphism styling pattern (bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10)
</action>

<acceptance_criteria>
- src/components/AccelerationComparison.tsx file exists
- Component exports AccelerationComparison
- Component accepts accelerationAttempts, selectedAttempts, data props
- Chart renders only selected attempts (no attempts when selection empty)
- Chart uses overlaid Line curves with distinct colors
- Best attempt highlighted (thicker line or different color)
- Delta metrics table shows all selected attempts
- Delta values calculated correctly (attempt.value - best.value)
- Empty state displayed when no attempts selected
- Component uses glassmorphism styling
- TypeScript types are correct
</acceptance_criteria>

### Task 4: Add Filter Buttons to AccelerationComparison

<read_first>
- src/components/AccelerationComparison.tsx
</read_first>

<action>
Add filtering functionality to AccelerationComparison:
- Add `comparisonFilter: 'all' | 'best' | 'worst'` state to component
- Add filter buttons: "Все", "Лучшие 5", "Худшие 5"
- Filter buttons styled as pill buttons (similar to preset buttons in AccelerationTab)
- When 'best' selected: sort selected attempts by time ascending, filter to top 5
- When 'worst' selected: sort selected attempts by time descending, filter to bottom 5
- When 'all' selected: show all selected attempts
- Update chart and delta table when filter changes
- Use useMemo to apply filtering
</action>

<acceptance_criteria>
- AccelerationComparison has comparisonFilter state
- Three filter buttons rendered: "Все", "Лучшие 5", "Худшие 5"
- "Лучшие 5" shows fastest 5 selected attempts
- "Худшие 5" shows slowest 5 selected attempts
- "Все" shows all selected attempts
- Filter buttons styled as pill buttons
- Chart updates when filter changes
- Delta table updates when filter changes
</acceptance_criteria>

### Task 5: Add Comparison Tab to App.tsx

<read_first>
- src/App.tsx
- src/components/AccelerationComparison.tsx
- src/components/AccelerationTable.tsx
</read_first>

<action>
Integrate Comparison tab into App.tsx:
- Add 'comparison' to tab state options (alongside 'telemetry' and 'acceleration')
- Add tab button "Сравнение" in tab navigation
- Render AccelerationComparison component when activeTab === 'comparison'
- Render AccelerationTable with selection props when activeTab === 'comparison'
- Pass selectedAttempts, toggleSelection, clearSelection to AccelerationTable
- Pass accelerationAttempts, selectedAttempts, data to AccelerationComparison
- Style comparison tab button to match existing tab styling
- Ensure tab switching preserves selectedAttempts state
</action>

<acceptance_criteria>
- App.tsx has 'comparison' in tab state
- Tab navigation includes "Сравнение" button
- AccelerationComparison renders when activeTab === 'comparison'
- AccelerationTable renders with selection props when activeTab === 'comparison'
- selectedAttempts passed to AccelerationTable
- toggleSelection passed to AccelerationTable
- clearSelection passed to AccelerationTable (or handled in header)
- Tab button styling matches existing tabs
- selectedAttempts persists across tab switches
</acceptance_criteria>

### Task 6: Add Clear Selection Button

<read_first>
- src/components/AccelerationTable.tsx
- src/App.tsx
</read_first>

<action>
Add clear selection button to Comparison tab:
- Add "Очистить выбор" button in AccelerationComparison header
- Button calls clearSelection handler on click
- Button styled as pill button (similar to other action buttons)
- Button disabled when selectedAttempts is empty
- Show confirmation dialog before clearing (optional)
- Button positioned in header area with other controls
</action>

<acceptance_criteria>
- AccelerationComparison has "Очистить выбор" button in header
- Button calls clearSelection on click
- Button disabled when selectedAttempts.size === 0
- Button styled as pill button
- Button positioned in header area
</acceptance_criteria>

## Verification

### Manual Verification Steps

1. Load CSV file with acceleration attempts
2. Navigate to "Сравнение" tab
3. Check checkboxes in AccelerationTable to select 2-3 attempts
4. Verify chart shows only selected attempts with overlaid curves
5. Verify delta metrics table shows correct differences
6. Click "Лучшие 5" filter - verify only fastest attempts shown
7. Click "Худшие 5" filter - verify only slowest attempts shown
8. Click "Очистить выбор" - verify selection cleared
9. Switch to other tabs and back - verify selection persists

### Type Checking

Run `npm run build` to ensure TypeScript compilation succeeds.

### Acceptance Criteria

- All tasks completed
- Comparison tab functional
- Checkbox selection works
- Chart displays selected attempts correctly
- Delta metrics calculated correctly
- Filtering works as expected
- Type checking passes
- Manual verification passes

## Notes

- Export functionality (plan 6.8) is not required in this phase per context
- Best attempt determined by minimum time per context decision
- Delta metrics: time, distance, peak power, average power relative to best attempt
- Use existing Chart.js infrastructure and styling patterns
