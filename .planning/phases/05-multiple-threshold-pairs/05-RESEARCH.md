# Phase 5: Multiple Threshold Pairs - Research

**Researched:** 2026-04-10
**Status:** Complete
**Source:** Manual codebase analysis

## Current Implementation Analysis

### Threshold State (useAccelerationState.ts)
- **Current:** `accelerationThreshold: number` (single target speed)
- **Storage:** localStorage key `acceleration_threshold`
- **Type:** Simple number (e.g., 60 for 0-60 km/h)
- **Usage:** Passed to `detectAccelerations(data, accelerationThreshold)`

### Threshold UI (AccelerationConfig.tsx)
- **Current:** Two input fields (fromSpeed, toSpeed) + preset buttons
- **Presets:** 0-25, 0-60, 0-90, 0-100
- **Validation:** Auto-swap if from > to
- **Pattern:** Expandable panel with settings icon

### Detection Algorithm (acceleration.ts)
- **Current signature:** `detectAccelerations(data: TripEntry[], targetSpeed: number): AccelerationAttempt[]`
- **Logic:** Single-pass detection for one target speed
- **Algorithm:**
  1. Iterate through data points
  2. Detect when speed crosses from below targetSpeed to above targetSpeed
  3. Track attemptStart and startIndex
  4. Calculate metrics when target reached
  5. Handle data gaps (> 500ms)
  6. Handle incomplete attempts at end of data
- **Output:** Array of AccelerationAttempt objects with `targetSpeed` field

### AccelerationAttempt Type
- **Current fields:** id, startTimestamp, endTimestamp, startSpeed, endSpeed, targetSpeed, time, distance, averagePower, peakPower, averageCurrent, averageVoltage, batteryDrop, averageTemperature, isComplete
- **Missing:** No field to identify which threshold pair produced this attempt

## Proposed Implementation Strategy

### 1. Data Structure Change

**New type:**
```typescript
type ThresholdPair = { from: number; to: number };
```

**State change:**
```typescript
// Current
const [accelerationThreshold, setAccelerationThreshold] = useState<number>(60);

// New
const [thresholdPairs, setThresholdPairs] = useState<ThresholdPair[]>([
  { from: 0, to: 60 }
]);
```

**Storage change:**
- localStorage key: `acceleration_threshold_pairs` (array of objects)
- Migration: Old `acceleration_threshold` value becomes default pair `{from: 0, to: value}`

### 2. Detection Algorithm Update

**New signature:**
```typescript
detectAccelerations(data: TripEntry[], thresholdPairs: ThresholdPair[]): Map<ThresholdPair, AccelerationAttempt[]>
```

**Algorithm options:**

**Option A: Single-pass with all thresholds (Recommended)**
- Iterate through data once
- For each point, check against all threshold pairs
- Maintain separate attempt tracking for each threshold
- Performance: O(n * m) where n = data points, m = threshold pairs
- Memory: O(m) for tracking attempts

**Option B: Multiple passes (Simpler but slower)**
- Call detectAccelerations once per threshold pair
- Merge results
- Performance: O(n * m) but with repeated data access
- Memory: O(1) per call but called m times

**Recommendation:** Option A for better cache locality and single data traversal

### 3. AccelerationAttempt Type Update

**Add field:**
```typescript
thresholdPair: ThresholdPair; // Which threshold produced this attempt
```

**Alternative:** Store threshold pair index or ID if memory is concern

### 4. UI Implementation

**Threshold list UI pattern:**
```
[Threshold 1: 0-60 km/h] [X]
[Threshold 2: 30-100 km/h] [X]
[+ Add Threshold]
```

**Each row:**
- From input field
- To input field
- Remove button
- Validation (from < to, auto-swap)

**Presets:**
- Standard presets add to list (not replace)
- Custom presets for threshold pairs (future enhancement)

### 5. Table Update

**Add column:** "Порог" or "Threshold"
- Display: "0-60", "30-100", etc.
- Sortable: Can sort by threshold range

### 6. Visualization Selector

**Pattern:**
- Preset buttons for standard single thresholds (existing pattern)
- Dropdown for custom threshold pairs
- Or: Button list for all active threshold pairs

**State:** `selectedThresholdPair: ThresholdPair | null`

## Technical Considerations

### Performance
- **Data size:** Large CSV files (10,000+ points)
- **Threshold count:** Typically 2-5 pairs
- **Algorithm complexity:** O(n * m) acceptable for m < 10
- **Memoization:** Critical - only re-detect when data or thresholds change

### localStorage Limits
- **Size limit:** ~5-10MB per domain
- **Threshold pairs:** Minimal storage impact (array of small objects)
- **No migration needed:** Can detect old format and convert

### Backward Compatibility
- **Old format:** Single number in localStorage
- **Migration strategy:**
  ```typescript
  const oldThreshold = localStorage.getItem('acceleration_threshold');
  if (oldThreshold && !localStorage.getItem('acceleration_threshold_pairs')) {
    const value = JSON.parse(oldThreshold);
    setThresholdPairs([{ from: 0, to: value }]);
  }
  ```

### Edge Cases
- **Duplicate threshold pairs:** Allow duplicates (user may want multiple analyses)
- **Overlapping ranges:** Allow overlapping (e.g., 0-60 and 0-90)
- **Empty threshold list:** Prevent (require at least one threshold)
- **Invalid values:** Auto-correct (negative → 0, from > to → swap)

## Integration Points

### Files to Modify
1. `src/hooks/useAccelerationState.ts` - State structure change
2. `src/components/AccelerationConfig.tsx` - UI for list management
3. `src/utils/acceleration.ts` - Detection algorithm
4. `src/types.ts` - AccelerationAttempt type update
5. `src/components/AccelerationTable.tsx` - Add threshold column
6. `src/components/AccelerationTab.tsx` - Threshold selector in visualization

### Files to Reference
- `src/components/TripOverview.tsx` - Settings panel pattern
- `src/hooks/useChartState.ts` - Hook pattern reference

## Pitfalls to Avoid

1. **Performance regression:** Single-pass algorithm is critical
2. **State explosion:** Don't track too many threshold pairs
3. **UI complexity:** Keep list UI simple (add/remove only)
4. **Type safety:** Ensure ThresholdPair type is used consistently
5. **localStorage corruption:** Handle parse errors gracefully
6. **Migration bugs:** Test old format conversion

## Validation Architecture

### Dimension 1: Functional Correctness
- Detection produces correct attempts for each threshold pair
- Threshold pair field correctly set on each attempt
- Table displays correct threshold for each row
- Visualization selector switches between thresholds correctly

### Dimension 2: Performance
- Detection time scales linearly with data size (not exponentially)
- No unnecessary re-detection on unrelated state changes
- Memoization works correctly

### Dimension 3: UX
- Add/remove thresholds works smoothly
- Validation feedback is clear
- Presets work as expected
- Threshold selector is intuitive

### Dimension 4: Data Integrity
- Threshold pairs persist correctly to localStorage
- Migration from old format works
- Clear settings removes all threshold data

---

*Phase: 05-multiple-threshold-pairs*
*Research completed: 2026-04-10*
