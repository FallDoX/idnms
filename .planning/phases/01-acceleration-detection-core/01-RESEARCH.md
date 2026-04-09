# Phase 1 Research - Acceleration Detection Core

**Last updated:** 2026-04-09

## Phase Context

**Phase:** 1 - Acceleration Detection Core
**Goal:** Implement basic acceleration detection algorithm and display results in table format.

**User Decisions (from CONTEXT.md):**
- Detection: From any starting speed to target threshold using hardware wheel speed (Speed field), no GPS noise filtering
- Table integration: Separate tab "Acceleration" alongside existing chart views
- Metrics: All metrics available with user-selectable columns via settings
- Incomplete attempts: Show in different color with toggle to show/hide, default hidden
- Data source: Raw (unsampled) CSV data to preserve peak values

## Research Findings

### Acceleration Detection Algorithm

**Approach:** Simple threshold crossing detection on raw TripEntry[] data.

**Algorithm:**
1. Iterate through TripEntry[] (Speed field from wheel sensor)
2. Detect when speed crosses from below threshold to above threshold
3. Track start point (speed first crosses threshold)
4. Track end point (speed reaches target threshold)
5. Calculate metrics:
   - Time: end timestamp - start timestamp
   - Distance: integrate speed over time (trapezoidal method)
   - Average power: mean(Power) during acceleration
   - Peak power: max(Power) during acceleration
   - Current: mean(Current) during acceleration
   - Voltage: mean(Voltage) during acceleration
   - Battery drop: BatteryLevel at end - BatteryLevel at start
   - Temperature: mean(Temperature) during acceleration

**Edge cases:**
- Incomplete attempt: speed starts crossing threshold but never reaches target - mark as incomplete
- Data gaps: filter out attempts with gaps > 500ms between points
- Multiple thresholds: detect from any starting speed to target (not just 0)

### Data Type Structure

**AccelerationAttempt interface:**
```typescript
export interface AccelerationAttempt {
  id: string; // unique identifier
  startTimestamp: number;
  endTimestamp: number;
  startSpeed: number; // km/h
  endSpeed: number; // km/h
  targetSpeed: number; // km/h (threshold)
  time: number; // seconds
  distance: number; // meters
  averagePower: number; // watts
  peakPower: number; // watts
  averageCurrent: number; // amps
  averageVoltage: number; // volts
  batteryDrop: number; // percentage
  averageTemperature: number; // celsius
  isComplete: boolean; // true if target speed reached
}
```

### Integration Points

**CSV Parser Flow:**
- Location: `src/utils/parser.ts`
- Integration point: After parseTripData() returns TripEntry[]
- Call detectAccelerations(data, threshold) to get AccelerationAttempt[]
- Store in state alongside existing summary

**Component Structure:**
- New file: `src/utils/acceleration.ts` - detectAccelerations function
- New file: `src/components/AccelerationTable.tsx` - table component
- New file: `src/components/AccelerationTab.tsx` - tab wrapper
- Integration: Add to App.tsx tab system alongside existing chart tabs

### Performance Considerations

**Raw data processing:**
- Detection runs on full TripEntry[] (no downsampling)
- For large files (10,000+ points): detection may take 1-2 seconds
- Optimization: Memoize detection results, only re-run on file load or threshold change

**Table rendering:**
- If many attempts (>100): consider pagination or virtual scrolling
- Default: show all, add pagination if needed in future phase

### Dependencies

**Existing code:**
- `src/types.ts` - TripEntry type (Speed field)
- `src/utils/parser.ts` - CSV parsing (integration point)
- `src/App.tsx` - State management, tab system
- `src/components/TripOverview.tsx` - Styling patterns (glassmorphism cards)

**No new libraries needed** - pure TypeScript/JavaScript implementation

### Implementation Order

1. Add AccelerationAttempt type to types.ts
2. Create detectAccelerations function in src/utils/acceleration.ts
3. Add acceleration state to App.tsx (accelerationAttempts, showIncomplete, selectedColumns)
4. Call detectAccelerations in handleFile after parseTripData
5. Create AccelerationTable component
6. Create AccelerationTab component (wrapper with toggle)
7. Add AccelerationTab to App.tsx tab system
8. Add default threshold (0-60 km/h) to state

### Known Patterns from Codebase

**Type definitions:** Located in src/types.ts with clear interfaces
**Utility functions:** Located in src/utils/ with clear exports
**Components:** Located in src/components/ with memo() for performance
**Styling:** Tailwind CSS with glassmorphism patterns (backdrop-blur, gradients)
**State management:** React hooks (useState, useMemo, useCallback) in App.tsx
**Icons:** lucide-react for consistent iconography

## Validation Architecture

### Test Strategy

**Unit tests:** Test detectAccelerations function with mock data
- Test threshold crossing detection
- Test incomplete attempt detection
- Test data gap filtering (> 500ms)
- Test metric calculation (time, distance, power, etc.)

**Integration tests:** Test acceleration detection in CSV parser flow
- Test that detectAccelerations is called after parseTripData
- Test that acceleration attempts are stored in state
- Test that acceleration state is passed to AccelerationTab

**Manual verification:** Test with demo CSV files
- Load demo-trip.csv and verify acceleration attempts are detected
- Verify incomplete attempts are hidden by default
- Verify toggle shows incomplete attempts when enabled
- Verify column selector works

### Success Criteria

**Functional:**
- Acceleration attempts are detected correctly from Speed field
- Incomplete attempts are marked and hidden by default
- Toggle shows/hides incomplete attempts
- Column selector allows user to choose which metrics to display
- Default threshold (0-60 km/h) is applied

**Performance:**
- Detection on raw CSV data completes within 2 seconds for files up to 10,000 points
- Table renders without lag for up to 100 attempts
- Memoization prevents re-detection on unnecessary re-renders

**UI/UX:**
- Acceleration tab appears alongside existing chart tabs
- Table styling matches existing glassmorphism patterns
- Incomplete attempts are visually distinct (gray/muted color)
- Settings panel allows column selection

### Edge Cases to Validate

**Data gaps:** Attempts with gaps > 500ms between points should be filtered out
**Incomplete attempts:** Attempts that don't reach target speed should be marked incomplete
**No data:** Empty state should display when no acceleration attempts are found
**Large files:** Performance should remain acceptable for large CSV files
**Multiple thresholds:** Detection should work from any starting speed to target

---

*Phase: 01-acceleration-detection-core*
*Research gathered: 2026-04-09*
