---
wave: 1
depends_on: []
files_modified:
  - src/hooks/useAccelerationState.ts
  - src/components/AccelerationConfig.tsx
  - src/utils/acceleration.ts
  - src/types.ts
  - src/components/AccelerationTable.tsx
  - src/components/AccelerationTab.tsx
autonomous: true
---

# Phase 5: Multiple Threshold Pairs - Plan

**Phase:** 05-multiple-threshold-pairs
**Goal:** Support multiple threshold configurations simultaneously
**Mode:** Standard

## Task 1: Add ThresholdPair type to types.ts

**Objective:** Define the ThresholdPair type for representing threshold pairs.

**<read_first>**
- `src/types.ts` - Existing type definitions, AccelerationAttempt type

**<action>**
Add the ThresholdPair type definition to `src/types.ts`:
```typescript
export type ThresholdPair = {
  from: number;
  to: number;
};
```

**<acceptance_criteria>**
- `src/types.ts` contains `export type ThresholdPair = { from: number; to: number; };`
- TypeScript compilation succeeds with no errors
- Type can be imported in other files

**<requirements>**
- None specific (architectural improvement)

---

## Task 2: Update useAccelerationState hook for threshold pairs

**Objective:** Extend useAccelerationState to manage array of threshold pairs instead of single threshold.

**<read_first>**
- `src/hooks/useAccelerationState.ts` - Current implementation with single accelerationThreshold
- `.planning/phases/04-acceleration-state-refactoring/04-CONTEXT.md` - Hook design decisions
- `.planning/phases/05-multiple-threshold-pairs/05-CONTEXT.md` - Multiple threshold decisions

**<action>**
Update `src/hooks/useAccelerationState.ts`:
1. Change state from `accelerationThreshold: number` to `thresholdPairs: ThresholdPair[]`
2. Update localStorage key from `acceleration_threshold` to `acceleration_threshold_pairs`
3. Add migration logic: if old `acceleration_threshold` exists, convert to `[{from: 0, to: value}]`
4. Update `setAccelerationThreshold` to `setThresholdPairs` with array manipulation functions
5. Update memoization to pass `thresholdPairs` to detectAccelerations
6. Update `clearSettings` to remove `acceleration_threshold_pairs` key
7. Return `thresholdPairs` and `setThresholdPairs` instead of `accelerationThreshold` and `setAccelerationThreshold`

**<acceptance_criteria>**
- State is `thresholdPairs: ThresholdPair[]` initialized with default `[{from: 0, to: 60}]`
- localStorage key is `acceleration_threshold_pairs`
- Migration logic: old `acceleration_threshold` value converts to `[{from: 0, to: value}]`
- Returns `thresholdPairs`, `setThresholdPairs` (not accelerationThreshold, setAccelerationThreshold)
- Memoization dependency includes `thresholdPairs`
- clearSettings removes `acceleration_threshold_pairs` key
- TypeScript compilation succeeds

**<requirements>**
- None specific (architectural improvement)

---

## Task 3: Update detectAccelerations for multiple thresholds

**Objective:** Modify detection algorithm to handle multiple threshold pairs in a single pass.

**<read_first>**
- `src/utils/acceleration.ts` - Current single-threshold detection algorithm
- `.planning/phases/05-multiple-threshold-pairs/05-RESEARCH.md` - Algorithm analysis and recommendations
- `src/types.ts` - AccelerationAttempt type (needs thresholdPair field)

**<action>**
Update `src/utils/acceleration.ts`:
1. Change signature from `detectAccelerations(data: TripEntry[], targetSpeed: number)` to `detectAccelerations(data: TripEntry[], thresholdPairs: ThresholdPair[])`
2. Change return type from `AccelerationAttempt[]` to `AccelerationAttempt[]` (flat array with thresholdPair field)
3. Implement single-pass algorithm:
   - Maintain separate attempt tracking for each threshold pair: `Map<ThresholdPair, {attemptStart: TripEntry | null, startIndex: number}>`
   - For each data point, check against all threshold pairs
   - When speed crosses threshold pair's range, track attempt for that pair
   - Calculate metrics and add to results when threshold reached
4. Add `thresholdPair: ThresholdPair` field to each AccelerationAttempt
5. Handle edge cases: empty thresholdPairs array, duplicate pairs, overlapping ranges

**<acceptance_criteria>**
- Function signature is `detectAccelerations(data: TripEntry[], thresholdPairs: ThresholdPair[]): AccelerationAttempt[]`
- Each AccelerationAttempt has `thresholdPair: ThresholdPair` field
- Algorithm uses single-pass approach (not multiple calls to old function)
- Returns flat array of all attempts from all threshold pairs
- Handles empty thresholdPairs array (returns empty array)
- TypeScript compilation succeeds

**<requirements>**
- None specific (architectural improvement)

---

## Task 4: Add thresholdPair field to AccelerationAttempt type

**Objective:** Update AccelerationAttempt type to include thresholdPair field.

**<read_first>**
- `src/types.ts` - Current AccelerationAttempt type definition

**<action>**
Add `thresholdPair: ThresholdPair` field to AccelerationAttempt type in `src/types.ts`:
```typescript
export interface AccelerationAttempt {
  id: string;
  startTimestamp: number;
  endTimestamp: number;
  startSpeed: number;
  endSpeed: number;
  targetSpeed: number; // Keep for backward compatibility
  thresholdPair: ThresholdPair; // New field
  time: number;
  distance: number;
  averagePower: number;
  peakPower: number;
  averageCurrent: number;
  averageVoltage: number;
  batteryDrop: number;
  averageTemperature: number;
  isComplete: boolean;
}
```

**<acceptance_criteria>**
- AccelerationAttempt interface has `thresholdPair: ThresholdPair` field
- TypeScript compilation succeeds
- detectAccelerations function compiles with updated type

**<requirements>**
- None specific (architectural improvement)

---

## Task 5: Update AccelerationConfig for threshold list UI

**Objective:** Replace single threshold UI with expandable list of threshold pairs.

**<read_first>**
- `src/components/AccelerationConfig.tsx` - Current single-threshold UI
- `.planning/phases/05-multiple-threshold-pairs/05-CONTEXT.md` - UI decisions (expandable list with add/remove)
- `src/components/TripOverview.tsx` - Settings panel pattern reference

**<action>**
Update `src/components/AccelerationConfig.tsx`:
1. Change props to accept `thresholdPairs: ThresholdPair[]` and `onThresholdPairsChange: (pairs: ThresholdPair[]) => void`
2. Remove `fromSpeed`, `toSpeed`, `onFromSpeedChange`, `onToSpeedChange` props
3. Replace single input fields with list UI:
   - Map over `thresholdPairs` to render rows
   - Each row has: from input, to input, remove button
   - Add "Add Threshold" button at bottom
4. Update preset buttons to add to list instead of replacing
5. Implement add function: `onThresholdPairsChange([...pairs, {from: 0, to: 60}])`
6. Implement remove function: `onThresholdPairsChange(pairs.filter((_, i) => i !== index))`
7. Implement update function: `onThresholdPairsChange(pairs.map((p, i) => i === index ? updatedPair : p))`
8. Keep auto-swap validation (from > to → swap)
9. Update header to show count: "Пороги: N пар"

**<acceptance_criteria>**
- Props are `thresholdPairs: ThresholdPair[]` and `onThresholdPairsChange`
- UI renders list of threshold pairs with from/to inputs and remove buttons
- "Add Threshold" button adds new pair to end of list
- Remove button removes corresponding pair
- Input changes update specific pair in array
- Preset buttons add to list (not replace)
- Auto-swap validation still works (from > to → swap)
- Header shows count of threshold pairs
- TypeScript compilation succeeds

**<requirements>**
- None specific (architectural improvement)

---

## Task 6: Update App.tsx to use new threshold state

**Objective:** Update App.tsx to use thresholdPairs instead of accelerationThreshold.

**<read_first>**
- `src/App.tsx` - Current usage of accelerationThreshold and setAccelerationThreshold
- `src/hooks/useAccelerationState.ts` - Updated hook interface (after Task 2)

**<action>**
Update `src/App.tsx`:
1. Change destructuring from `accelerationThreshold, setAccelerationThreshold` to `thresholdPairs, setThresholdPairs`
2. Update AccelerationConfig props: pass `thresholdPairs` and `onThresholdPairsChange` instead of fromSpeed/toSpeed
3. Remove any direct state manipulation of accelerationThreshold
4. Ensure all references to threshold use the new array structure

**<acceptance_criteria>**
- App.tsx destructures `thresholdPairs, setThresholdPairs` from useAccelerationState
- AccelerationConfig receives `thresholdPairs` and `onThresholdPairsChange` props
- No references to `accelerationThreshold` or `setAccelerationThreshold` in App.tsx
- TypeScript compilation succeeds
- App runs without runtime errors

**<requirements>**
- None specific (architectural improvement)

---

## Task 7: Add threshold column to AccelerationTable

**Objective:** Add column to display which threshold pair produced each attempt.

**<read_first>**
- `src/components/AccelerationTable.tsx` - Current table implementation
- `.planning/phases/05-multiple-threshold-pairs/05-CONTEXT.md` - Table display decision (show threshold for each attempt)

**<action>**
Update `src/components/AccelerationTable.tsx`:
1. Add "Порог" column to table header
2. Display threshold pair format: "0-60", "30-100", etc.
3. Use `attempt.thresholdPair.from` and `attempt.thresholdPair.to` for display
4. Make column sortable if other columns are sortable
5. Add to selectedColumns default set if needed

**<acceptance_criteria>**
- Table has "Порог" column
- Column displays format "X-Y" (e.g., "0-60")
- Uses attempt.thresholdPair.from and attempt.thresholdPair.to
- Column is sortable if other columns are sortable
- TypeScript compilation succeeds
- Table renders correctly with threshold data

**<requirements>**
- None specific (architectural improvement)

---

## Task 8: Add threshold selector in AccelerationTab visualization

**Objective:** Add UI to switch between threshold pairs in acceleration visualization.

**<read_first>**
- `src/components/AccelerationTab.tsx` - Current visualization with preset buttons
- `.planning/phases/05-multiple-threshold-pairs/05-CONTEXT.md` - Visualization selector decision (presets + dropdown for custom)

**<action>**
Update `src/components/AccelerationTab.tsx`:
1. Add state: `selectedThresholdPair: ThresholdPair | null`
2. Add UI selector:
   - Keep existing preset buttons (0-25, 0-60, 0-90, 0-100, custom)
   - For custom: add dropdown with all threshold pairs from props
   - Or: render button for each threshold pair in list
3. Filter accelerationAttempts by selected threshold pair
4. Update chart to show only attempts from selected threshold
5. Pass thresholdPairs as prop if not already passed

**<acceptance_criteria>**
- Component has `selectedThresholdPair` state
- UI allows switching between threshold pairs
- Chart/filtering shows only attempts from selected threshold pair
- Preset buttons work for standard thresholds
- Custom threshold pairs accessible via dropdown or buttons
- TypeScript compilation succeeds
- Visualization updates correctly on threshold selection

**<requirements>**
- REQ-046 (User can set "to speed" threshold)

---

## Task 9: Implement threshold pair presets (optional)

**Objective:** Add preset buttons for common threshold pair combinations.

**<read_first>**
- `src/components/AccelerationConfig.tsx` - Updated UI from Task 5
- `.planning/phases/05-multiple-threshold-pairs/05-CONTEXT.md` - Preset decision (deferred, can be future enhancement)

**<action>**
This task is optional per CONTEXT.md decision. Skip for now - can be added in future phase.

**<acceptance_criteria>**
- N/A (task skipped)

**<requirements>**
- None (optional task)

---

## Task 10: Add threshold pair save/load (optional)

**Objective:** Add functionality to save and load threshold pair configurations.

**<read_first>**
- `src/hooks/useAccelerationState.ts` - Current localStorage implementation
- `.planning/phases/05-multiple-threshold-pairs/05-CONTEXT.md` - Save/load decision (deferred, plan 5.8 optional)

**<action>**
This task is optional per CONTEXT.md decision. Skip for now - can be added in future phase.

**<acceptance_criteria>**
- N/A (task skipped)

**<requirements>**
- None (optional task)

---

## Verification Criteria

### Functional Correctness
- Multiple threshold pairs can be added, modified, and removed
- Detection algorithm correctly identifies acceleration attempts for each threshold pair
- Each attempt correctly identifies which threshold pair produced it
- Table displays threshold information for each attempt
- Visualization selector switches between threshold pairs correctly
- Migration from old single-threshold format works correctly

### Performance
- Detection time scales linearly with data size (not exponentially with threshold count)
- Memoization prevents unnecessary re-detection
- UI remains responsive with multiple threshold pairs

### Data Integrity
- Threshold pairs persist correctly to localStorage
- Old format migrates correctly to new format
- Clear settings removes threshold pair data

### Type Safety
- All TypeScript code compiles without errors
- ThresholdPair type used consistently across files
- AccelerationAttempt type includes thresholdPair field

## Must-Haves

- Multiple threshold pairs can be configured simultaneously
- Detection algorithm handles multiple thresholds efficiently
- Table shows which threshold produced each attempt
- Visualization allows switching between thresholds
- Backward compatibility with old single-threshold format

---

*Phase: 05-multiple-threshold-pairs*
*Plan created: 2026-04-10*
