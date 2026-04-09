# Phase 1 Validation - Acceleration Detection Core

**Created:** 2026-04-09
**Source:** RESEARCH.md Validation Architecture section

## Test Strategy

### Unit Tests

**Test detectAccelerations function with mock data:**
- Test threshold crossing detection
- Test incomplete attempt detection
- Test data gap filtering (> 500ms)
- Test metric calculation (time, distance, power, etc.)

### Integration Tests

**Test acceleration detection in CSV parser flow:**
- Test that detectAccelerations is called after parseTripData
- Test that acceleration attempts are stored in state
- Test that acceleration state is passed to AccelerationTab

### Manual Verification

**Test with demo CSV files:**
- Load demo-trip.csv and verify acceleration attempts are detected
- Verify incomplete attempts are hidden by default
- Verify toggle shows incomplete attempts when enabled
- Verify column selector works

## Success Criteria

### Functional

- Acceleration attempts are detected correctly from Speed field
- Incomplete attempts are marked and hidden by default
- Toggle shows/hides incomplete attempts
- Column selector allows user to choose which metrics to display
- Default threshold (0-60 km/h) is applied

### Performance

- Detection on raw CSV data completes within 2 seconds for files up to 10,000 points
- Table renders without lag for up to 100 attempts
- Memoization prevents re-detection on unnecessary re-renders

### UI/UX

- Acceleration tab appears alongside existing chart tabs
- Table styling matches existing glassmorphism patterns
- Incomplete attempts are visually distinct (gray/muted color)
- Settings panel allows column selection

## Edge Cases to Validate

- Data gaps: Attempts with gaps > 500ms between points should be filtered out
- Incomplete attempts: Attempts that don't reach target speed should be marked incomplete
- No data: Empty state should display when no acceleration attempts are found
- Large files: Performance should remain acceptable for large CSV files
- Multiple thresholds: Detection should work from any starting speed to target

---

*Phase: 01-acceleration-detection-core*
*Validation gathered: 2026-04-09*
