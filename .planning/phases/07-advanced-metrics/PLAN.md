# Phase 7: Advanced Metrics - Plan

**Created:** 2026-04-10
**Status:** Ready for execution
**Mode:** auto-planned

## Phase Overview

**Goal:** Add power analysis and battery impact metrics to acceleration attempts.

**Scope:** Build on existing power/battery/temperature calculations in AccelerationAttempt to provide deeper insights through visualization, derived metrics, filtering, and thresholding.

**Requirements:** REQ-049

## Implementation Plans

### Plan 7.1: Add Advanced Power Metrics to AccelerationAttempt

**Objective:** Extend AccelerationAttempt type with derived power efficiency metrics calculated during detection.

**Steps:**
1. Add new fields to AccelerationAttempt interface in `src/types.ts`:
   - `powerEfficiency: number` - power per speed unit (W/(km/h))
   - `powerConsistency: number` - standard deviation of power values (0-1 score)
   - `powerDistribution: { low: number; medium: number; high: number }` - percentage of time in power bands

2. Update `detectAccelerations` in `src/utils/acceleration.ts`:
   - Calculate power efficiency: `peakPower / (endSpeed - startSpeed)` (handle divide by zero)
   - Calculate power consistency: standard deviation of power values normalized to 0-1
   - Calculate power distribution: bucket power values into low (<1000W), medium (1000-2000W), high (>2000W)
   - Store these metrics in AccelerationAttempt objects

3. Test with existing CSV data to verify calculations are reasonable

**Files:**
- `src/types.ts` - Add new fields to AccelerationAttempt
- `src/utils/acceleration.ts` - Add calculation logic

**Dependencies:** None (builds on existing power calculations)

---

### Plan 7.2: Add Battery Impact Metrics to AccelerationAttempt

**Objective:** Extend AccelerationAttempt with battery drop rate and energy consumption metrics.

**Steps:**
1. Add new fields to AccelerationAttempt interface in `src/types.ts`:
   - `batteryDropRate: number` - battery drop per second (%/s)
   - `energyPerKm: number` - energy consumption per km (Wh/km)

2. Update `detectAccelerations` in `src/utils/acceleration.ts`:
   - Calculate battery drop rate: `batteryDrop / time` (handle divide by zero)
   - Calculate energy per km: `(averagePower * time / 3600) / (distance / 1000)` (convert to Wh/km)
   - Store these metrics in AccelerationAttempt objects

3. Test with existing CSV data to verify calculations are reasonable

**Files:**
- `src/types.ts` - Add new fields to AccelerationAttempt
- `src/utils/acceleration.ts` - Add calculation logic

**Dependencies:** None (builds on existing battery calculations)

---

### Plan 7.3: Add Temperature Impact Metrics to AccelerationAttempt

**Objective:** Add temperature correlation and efficiency metrics to analyze temperature impact on performance.

**Steps:**
1. Add new fields to AccelerationAttempt interface in `src/types.ts`:
   - `temperaturePowerCorrelation: number` - correlation coefficient between temperature and power (-1 to 1)
   - `temperatureEfficiency: number` - normalized efficiency score based on temperature

2. Update `detectAccelerations` in `src/utils/acceleration.ts`:
   - Calculate temperature-power correlation using Pearson correlation formula
   - Calculate temperature efficiency: normalize average temperature to 0-1 efficiency score (optimal range 20-35°C)
   - Store these metrics in AccelerationAttempt objects

3. Test with existing CSV data to verify calculations are reasonable

**Files:**
- `src/types.ts` - Add new fields to AccelerationAttempt
- `src/utils/acceleration.ts` - Add calculation logic

**Dependencies:** None (builds on existing temperature calculations)

---

### Plan 7.4: Add Power Curve Toggle to AccelerationComparison

**Objective:** Add toggleable power curve visualization overlay on acceleration comparison charts.

**Steps:**
1. Add state to AccelerationComparison component:
   - `showPowerCurve: boolean` - toggle for power curve overlay

2. Add toggle button in AccelerationComparison header (next to filter buttons):
   - Label: "Мощность" (Power)
   - Toggle state on click

3. Add power dataset to chart when `showPowerCurve` is true:
   - Use dual-axis chart: speed on left Y-axis, power on right Y-axis
   - Add second Y-axis configuration for power (0-3000W range)
   - Map power values from attempt data (Power field in TripEntry)

4. Style power curves differently from speed curves (dashed line, different color)

5. Test with selected attempts to verify dual-axis chart works correctly

**Files:**
- `src/components/AccelerationComparison.tsx` - Add power curve toggle and visualization

**Dependencies:** Plan 7.1 (requires power data from attempt)

---

### Plan 7.5: Add Advanced Metrics to AccelerationTable

**Objective:** Add new metric columns to AccelerationTable for advanced power/battery/temperature metrics.

**Steps:**
1. Update columnLabels in AccelerationTable.tsx:
   - Add labels for new metrics: "Эфф. мощн.", "Согл. мощн.", "Пад. бат./с", "Энерг./км", "Корр. темп."

2. Update table rendering to handle new fields:
   - Add column rendering for each new metric
   - Format values appropriately (decimals, units)

3. Update "Основные" (Essential) columns button to include key advanced metrics:
   - Add power efficiency and energy per km to essential columns

4. Test with CSV data to verify new columns display correctly

**Files:**
- `src/components/AccelerationTable.tsx` - Add new column labels and rendering

**Dependencies:** Plans 7.1, 7.2, 7.3 (requires new metric fields in AccelerationAttempt)

---

### Plan 7.6: Add Sorting to AccelerationTable

**Objective:** Add sortable table headers for advanced metrics in AccelerationTable.

**Steps:**
1. Add sorting state to AccelerationTable component:
   - `sortColumn: string | null` - currently sorted column
   - `sortDirection: 'asc' | 'desc'` - sort direction

2. Add sort indicators to table headers:
   - Show up/down arrow on sorted column
   - Click header to toggle sort direction
   - Click different header to change sort column

3. Implement sorting logic for all numeric columns:
   - Sort attempts array based on selected column and direction
   - Handle string columns (thresholdPair) with appropriate sorting

4. Update table rendering to use sorted attempts

5. Test sorting on various columns to verify correct behavior

**Files:**
- `src/components/AccelerationTable.tsx` - Add sorting state and logic

**Dependencies:** Plan 7.5 (requires columns to be added first)

---

### Plan 7.7: Add Filtering to AccelerationTable

**Objective:** Add filtering controls for power thresholds and temperature ranges in AccelerationTable.

**Steps:**
1. Add filter state to AccelerationTable component:
   - `minPower: number | null` - minimum power threshold filter
   - `maxTemperature: number | null` - maximum temperature filter

2. Add filter UI section above table:
   - Power threshold input (min power in watts)
   - Temperature threshold input (max temperature in °C)
   - Clear filters button

3. Implement filtering logic:
   - Filter attempts based on minPower (show only attempts with peakPower >= minPower)
   - Filter attempts based on maxTemperature (show only attempts with averageTemperature <= maxTemperature)
   - Combine filters with AND logic

4. Update table rendering to use filtered attempts

5. Test filtering with various threshold values

**Files:**
- `src/components/AccelerationTable.tsx` - Add filter state, UI, and logic

**Dependencies:** Plan 7.5 (requires columns to be added first)

---

### Plan 7.8: Add Metrics Threshold Configuration to AccelerationConfig

**Objective:** Add user-configurable thresholds for power and temperature warnings in AccelerationConfig.

**Steps:**
1. Add threshold state to useAccelerationState hook:
   - `powerThreshold: number` - high power warning threshold (default 2500W)
   - `temperatureThreshold: number` - high temperature warning threshold (default 45°C)
   - Persist to localStorage with keys `power_threshold` and `temperature_threshold`

2. Add metrics threshold section to AccelerationConfig component:
   - Section header: "Пороги метрик" (Metrics Thresholds)
   - Power threshold input with label "Высокая мощность (Вт)"
   - Temperature threshold input with label "Высокая температура (°C)"
   - Preset buttons: "Стандарт" (2500W, 45°C), "Строгий" (2000W, 40°C), "Мягкий" (3000W, 50°C)

3. Add visual warnings in AccelerationTable for attempts exceeding thresholds:
   - Red badge or highlight for attempts with peakPower > powerThreshold
   - Orange badge or highlight for attempts with averageTemperature > temperatureThreshold

4. Test threshold configuration and warning display

**Files:**
- `src/hooks/useAccelerationState.ts` - Add threshold state and localStorage
- `src/components/AccelerationConfig.tsx` - Add metrics threshold UI
- `src/components/AccelerationTable.tsx` - Add threshold warning display

**Dependencies:** Plan 7.5 (requires table columns to display warnings)

---

## Execution Order

**Sequential Dependencies:**
1. Plans 7.1, 7.2, 7.3 can run in parallel (all add fields to AccelerationAttempt)
2. Plan 7.5 depends on 7.1, 7.2, 7.3 (requires new fields)
3. Plan 7.6 depends on 7.5 (requires columns first)
4. Plan 7.7 depends on 7.5 (requires columns first)
5. Plans 7.4 and 7.8 can run in parallel after 7.1
6. Plan 7.8 depends on 7.5 for warning display in table

**Recommended Sequence:**
1. Execute 7.1, 7.2, 7.3 in parallel
2. Execute 7.5
3. Execute 7.6, 7.7, 7.4, 7.8 in parallel

## Success Criteria

- All new metrics calculated correctly and stored in AccelerationAttempt
- Power curve visualization works with dual-axis chart
- Advanced metrics display in table with proper formatting
- Sorting works for all numeric columns
- Filtering works for power and temperature thresholds
- User-configurable thresholds persist to localStorage
- Visual warnings display for attempts exceeding thresholds
- No breaking changes to existing functionality

## Notes

- Power efficiency formula: `peakPower / (endSpeed - startSpeed)` - handle divide by zero by returning 0 or infinity
- Power distribution bands: low (<1000W), medium (1000-2000W), high (>2000W) - adjust based on typical values
- Temperature efficiency: optimal range 20-35°C, efficiency decreases outside this range
- Dual-axis chart: Chart.js supports multiple Y-axes with `scales` configuration
- Threshold warnings: use red badge for power, orange for temperature to distinguish
