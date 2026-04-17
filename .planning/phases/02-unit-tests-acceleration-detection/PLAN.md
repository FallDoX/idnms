# Phase 2: Unit Tests for Acceleration Detection - Plan

**Created:** 2026-04-17
**Status:** Planned
**Milestone:** v1.1

## Phase Overview

**Goal:** Add unit tests for core acceleration detection logic.

**Scope:** Test the detectAccelerations function with various scenarios including edge cases.

## Implementation Plans

### Plan 2.1: Test Empty Data Handling
**Objective:** Ensure acceleration detection handles empty data gracefully.

**Steps:**
1. Create test file: src/utils/acceleration.test.ts
2. Test with empty array
3. Verify returns empty array
4. Test with null/undefined if applicable

**Files:**
- `src/utils/acceleration.test.ts` - New test file

**Dependencies:** Phase 1 complete

---

### Plan 2.2: Test Single Threshold Pair
**Objective:** Test acceleration detection with single threshold pair.

**Steps:**
1. Test with 0-60 km/h threshold
2. Verify acceleration attempts detected
3. Verify metrics calculated correctly
4. Verify threshold pair assigned

**Files:**
- `src/utils/acceleration.test.ts` - Add tests

**Dependencies:** Plan 2.1

---

### Plan 2.3: Test Multiple Threshold Pairs
**Objective:** Test acceleration detection with multiple threshold pairs.

**Steps:**
1. Test with [0-60, 0-90, 0-100] thresholds
2. Verify attempts detected for each threshold
3. Verify threshold pair assignment
4. Verify no duplicate attempts

**Files:**
- `src/utils/acceleration.test.ts` - Add tests

**Dependencies:** Plan 2.2

---

### Plan 2.4: Test Metrics Calculation
**Objective:** Verify all metrics are calculated correctly.

**Steps:**
1. Test time calculation
2. Test distance calculation
3. Test peak power calculation
4. Test average power calculation
5. Test battery drop calculation
6. Test temperature calculations

**Files:**
- `src/utils/acceleration.test.ts` - Add tests

**Dependencies:** Plan 2.2

---

### Plan 2.5: Test Incomplete Attempt Handling
**Objective:** Verify incomplete attempts are handled correctly.

**Steps:**
1. Test with data that doesn't reach target speed
2. Verify isComplete flag set to false
3. Verify metrics still calculated
4. Verify attempt still returned

**Files:**
- `src/utils/acceleration.test.ts` - Add tests

**Dependencies:** Plan 2.2

---

### Plan 2.6: Test Edge Cases
**Objective:** Test edge cases and error conditions.

**Steps:**
1. Test with data gaps
2. Test with negative values
3. Test with zero values
4. Test with very large values
5. Test with invalid threshold pairs (from >= to)

**Files:**
- `src/utils/acceleration.test.ts` - Add tests

**Dependencies:** Plan 2.5

---

### Plan 2.7: Test Advanced Metrics
**Objective:** Verify advanced metrics are calculated correctly.

**Steps:**
1. Test power efficiency calculation
2. Test power consistency calculation
3. Test power distribution calculation
4. Test battery drop rate calculation
5. Test energy per km calculation
6. Test temperature-power correlation
7. Test temperature efficiency calculation

**Files:**
- `src/utils/acceleration.test.ts` - Add tests

**Dependencies:** Plan 2.4

---

## Execution Order

**Sequential Execution:**
- Plans must run in order (2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7)

## Success Criteria

- All tests pass
- Test coverage > 70% for acceleration.ts
- Edge cases covered
- Mock data used appropriately
- Tests are fast and reliable

## Notes

**Testing Approach:**
- Use mock data from src/fixtures/acceleration-mocks.ts
- Test function behavior, not implementation details
- Use describe blocks for grouping related tests
- Use descriptive test names
- Keep tests simple and focused

**Coverage Goals:**
- Target > 70% code coverage
- Focus on critical paths (main detection logic)
- Test error handling paths
- Test edge cases
