---
phase: 03
plan: 01
status: draft
created: 2026-04-09
requirements:
  - REQ-047
  - REQ-048
  - REQ-049
  - REQ-051
---

# Plan 01: Acceleration Visualization Mode

**Objective:** Add acceleration visualization to the Trip Telemetry chart as a mode switch, with attempt selection buttons and curve rendering.

## Overview

This plan implements acceleration visualization by integrating it into the existing Trip Telemetry chart infrastructure. Instead of creating a separate AccelerationChart component, we add a mode toggle to switch between telemetry view (existing metric toggles) and acceleration view (attempt selection buttons). Selected attempts are rendered as line chart datasets with speed vs time data.

## Tasks

### Task 1: Add chart mode state to App.tsx

**File:** `src/App.tsx`

**Actions:**
- Add `chartMode` state with type `'telemetry' | 'acceleration'` (default: 'telemetry')
- Add `setChartMode` handler
- Add mode toggle button to chart control panel (near existing toggle chips)
- Style mode toggle button to match existing ToggleChip pattern

**Acceptance Criteria:**
- Mode toggle button renders in chart control panel
- Button switches between 'telemetry' and 'acceleration' modes on click
- Button shows active state styling when in acceleration mode

**Verification:**
<automated>grep -q "chartMode" src/App.tsx && grep -q "setChartMode" src/App.tsx</automated>

### Task 2: Create acceleration dataset computation

**File:** `src/App.tsx`

**Actions:**
- Create `accelerationChartData` useMemo that computes datasets from selected attempts
- Map selected attempts to Chart.js dataset format with speed vs time data
- Assign colors from predefined palette (ATTEMPT_COLORS constant)
- Set dataset properties: borderColor, backgroundColor, fill: false, tension: 0.1, pointRadius: 0
- Filter datasets by selectedAttempts Set

**Acceptance Criteria:**
- accelerationChartData useMemo computes datasets correctly
- Each selected attempt becomes a line chart dataset
- Colors assigned from palette with modulo indexing
- Non-selected attempts not included in datasets

**Verification:**
<automated>grep -q "accelerationChartData" src/App.tsx && grep -q "useMemo" src/App.tsx</automated>

### Task 3: Add attempt selection state

**File:** `src/App.tsx`

**Actions:**
- Add `selectedAttempts` state with type `Set<number>` (default: empty Set)
- Add `toggleAttempt` handler using useCallback
- Clear selectedAttempts when switching to telemetry mode
- Auto-select first attempt when switching to acceleration mode (if no attempts selected)

**Acceptance Criteria:**
- selectedAttempts state manages multi-selection
- toggleAttempt adds/removes attempt index from Set
- Selection clears on mode switch to telemetry
- First attempt auto-selected when switching to acceleration mode

**Verification:**
<automated>grep -q "selectedAttempts" src/App.tsx && grep -q "toggleAttempt" src/App.tsx</automated>

### Task 4: Create AttemptButton component

**File:** `src/components/AttemptButton.tsx`

**Actions:**
- Create AttemptButton component with memo optimization
- Props: attempt (AccelerationAttempt), index (number), selected (boolean), onSelect (function), color (string)
- Render button with attempt number and speed range (e.g., "1 (0-60)")
- Apply active styling when selected, inactive when not selected
- Use color prop for border and text styling

**Acceptance Criteria:**
- AttemptButton component created with memo
- Button renders attempt number and speed range
- Selected state shows active styling with color
- Non-selected state shows inactive styling

**Verification:**
<automated>grep -q "export.*AttemptButton" src/components/AttemptButton.tsx && grep -q "memo" src/components/AttemptButton.tsx</automated>

### Task 5: Add attempt buttons to chart control panel

**File:** `src/App.tsx`

**Actions:**
- Import AttemptButton component
- Render attempt buttons in chart control panel when chartMode === 'acceleration'
- Hide metric toggle chips when chartMode === 'acceleration'
- Show metric toggle chips when chartMode === 'telemetry'
- Use horizontal scroll container for attempt buttons (flex overflow-x-auto)

**Acceptance Criteria:**
- Attempt buttons render in acceleration mode
- Metric toggles hide in acceleration mode
- Metric toggles show in telemetry mode
- Attempt buttons scroll horizontally if many attempts

**Verification:**
<automated>grep -q "AttemptButton" src/App.tsx && grep -q "chartMode === 'acceleration'" src/App.tsx</automated>

### Task 6: Update chart data to use mode-based rendering

**File:** `src/App.tsx`

**Actions:**
- Modify combinedChartData useMemo to conditionally return telemetry or acceleration data
- Return existing combinedChartData when chartMode === 'telemetry'
- Return accelerationChartData when chartMode === 'acceleration'
- Add chartMode to useMemo dependencies

**Acceptance Criteria:**
- Chart shows telemetry datasets in telemetry mode
- Chart shows acceleration datasets in acceleration mode
- Chart updates correctly on mode switch
- Mode switch does not break existing telemetry functionality

**Verification:**
<automated>grep -q "chartMode" src/App.tsx && grep -q "accelerationChartData" src/App.tsx</automated>

### Task 7: Add attempt selection limit warning

**File:** `src/App.tsx`

**Actions:**
- Add check in toggleAttempt to limit selection to 10 attempts
- Show warning toast/alert when user tries to select more than 10 attempts
- Use existing toast/notification pattern if available, or create simple alert
- Allow deselection even at limit

**Acceptance Criteria:**
- Selection limited to 10 attempts
- Warning shown when trying to select 11th attempt
- Deselection allowed at limit
- Warning message in Russian

**Verification:**
<automated>grep -q "10" src/App.tsx && grep -q "selectedAttempts.size" src/App.tsx</automated>

### Task 8: Update FloatingDataPanel for attempt details

**File:** `src/App.tsx` or `src/components/FloatingDataPanel.tsx`

**Actions:**
- Modify FloatingDataPanel to show attempt metrics when in acceleration mode
- Display: peak power, average power, distance, battery drop, duration
- Show attempt number and speed range in panel header
- Keep existing telemetry data display for telemetry mode

**Acceptance Criteria:**
- Floating panel shows attempt metrics in acceleration mode
- Panel shows telemetry data in telemetry mode
- Panel header shows attempt number and speed range
- All metrics display correctly

**Verification:**
<automated>grep -q "accelerationAttempts" src/App.tsx && grep -q "FloatingDataPanel" src/App.tsx</automated>

## Dependencies

### Blocking
- None (all dependencies from Phase 1 and Phase 2 are complete)

### Downstream
- None (this is the final phase in the acceleration feature set)

## Risks

- **Low:** Chart.js dataset switching complexity (well-documented pattern from research)
- **Low:** Performance with many datasets (mitigated by 10-attempt limit)
- **Low:** State synchronization issues (mitigated by clear mode switch logic)

## Done Criteria

- [ ] Chart mode toggle button renders and switches modes
- [ ] Attempt buttons render in acceleration mode with correct colors
- [ ] Selected attempts display as line chart curves
- [ ] Attempt selection limited to 10 with warning
- [ ] Floating panel shows attempt details
- [ ] Telemetry mode functionality unchanged
- [ ] All manual verification steps pass

---
*Plan 01 of 1 for Phase 03*
