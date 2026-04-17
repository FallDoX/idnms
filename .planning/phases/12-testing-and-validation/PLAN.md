# Phase 12: Testing and Validation - Plan

**Created:** 2026-04-17
**Status:** Planned

## Phase Overview

**Goal:** Add comprehensive testing and validation.

**Scope:** Add unit tests, integration tests, E2E tests, performance tests, and visual regression tests to ensure code quality and prevent regressions.

## Implementation Plans

### Plan 12.1: Add Unit Tests for Acceleration Detection

**Objective:** Add unit tests for core acceleration detection logic.

**Steps:**
1. Install testing dependencies:
   - Vitest (if not already installed)
   - @testing-library/react (for component tests)
   - @testing-library/jest-dom

2. Create test file: `src/utils/acceleration.test.ts`
3. Test cases:
   - detectAccelerations with empty data
   - detectAccelerations with single threshold pair
   - detectAccelerations with multiple threshold pairs
   - Handle data gaps correctly
   - Calculate metrics correctly (time, distance, power)
   - Handle incomplete attempts
   - Edge cases (no speed data, constant speed, etc.)

**Files:**
- `src/utils/acceleration.test.ts` - New test file
- `package.json` - Add test scripts if needed

**Dependencies:** None

---

### Plan 12.2: Add Unit Tests for Acceleration Components

**Objective:** Add unit tests for React components.

**Steps:**
1. Create test files for components:
   - `src/components/AccelerationTable.test.tsx`
   - `src/components/AccelerationComparison.test.tsx`
   - `src/components/AccelerationConfig.test.tsx`
   - `src/components/AccelerationTab.test.tsx`

2. Test cases for AccelerationTable:
   - Renders with data
   - Renders empty state
   - Filters incomplete attempts
   - Sorts by columns
   - Toggles column selection

3. Test cases for AccelerationComparison:
   - Renders with selected attempts
   - Renders empty state
   - Filters by best/worst
   - Toggles power curve
   - Configurable filter limit

4. Test cases for AccelerationConfig:
   - Renders threshold inputs
   - Applies presets correctly
   - Validates thresholds (from < to)
   - Debounces changes

**Files:**
- `src/components/AccelerationTable.test.tsx` - New test file
- `src/components/AccelerationComparison.test.tsx` - New test file
- `src/components/AccelerationConfig.test.tsx` - New test file
- `src/components/AccelerationTab.test.tsx` - New test file

**Dependencies:** Plan 12.1 (testing infrastructure)

---

### Plan 12.3: Add Integration Tests

**Objective:** Add integration tests for component interactions.

**Steps:**
1. Create integration test file: `src/integration/acceleration-flow.test.tsx`
2. Test scenarios:
   - Load CSV file → Detect accelerations → Display in table
   - Change threshold → Re-detect → Update table
   - Select attempts → Open comparison → Display chart
   - Filter table → Update results
   - Toggle columns → Update table display

3. Mock CSV data for consistent testing
4. Test localStorage persistence
5. Test state updates and reactivity

**Files:**
- `src/integration/acceleration-flow.test.tsx` - New test file
- `src/fixtures/sample-csv.ts` - Mock CSV data

**Dependencies:** Plan 12.2 (component tests)

---

### Plan 12.4: Add E2E Tests with Playwright

**Objective:** Add end-to-end tests for user workflows.

**Steps:**
1. Review existing Playwright config: `playwright.config.ts`
2. Create E2E test file: `e2e/acceleration.spec.ts`
3. Test scenarios:
   - Load CSV file
   - Navigate to acceleration tab
   - Configure thresholds
   - View acceleration table
   - Select attempts for comparison
   - View comparison chart
   - Filter and sort table
   - Toggle columns
   - Test responsive design

4. Use sample CSV files from `public/` directory

**Files:**
- `e2e/acceleration.spec.ts` - New E2E test file
- `playwright.config.ts` - Review and update if needed

**Dependencies:** Plan 12.3 (integration tests)

---

### Plan 12.5: Add Performance Tests

**Objective:** Add performance tests for acceleration detection.

**Steps:**
1. Create performance test file: `src/performance/acceleration-performance.test.ts`
2. Test scenarios:
   - Large CSV file parsing (1000+ rows)
   - Acceleration detection performance
   - Chart rendering performance
   - Table rendering with many attempts (100+)
   - Memory usage

3. Use performance APIs:
   - performance.now()
   - memory usage monitoring
   - Render time measurement

**Files:**
- `src/performance/acceleration-performance.test.ts` - New test file

**Dependencies:** Plan 12.1 (unit tests infrastructure)

---

### Plan 12.6: Add Visual Regression Tests

**Objective:** Add visual regression tests for UI components.

**Steps:**
1. Configure visual regression testing:
   - Use Playwright screenshot comparison
   - Add visual test configuration

2. Create visual test file: `e2e/visual-regression.spec.ts`
3. Test scenarios:
   - Acceleration table with data
   - Acceleration table empty state
   - Comparison chart with multiple attempts
   - Comparison chart empty state
   - Configuration UI
   - Responsive layouts

**Files:**
- `e2e/visual-regression.spec.ts` - New visual test file
- `playwright.config.ts` - Update for visual tests

**Dependencies:** Plan 12.4 (E2E tests)

---

### Plan 12.7: Validate with Real CSV Data

**Objective:** Test with real CSV files from production.

**Steps:**
1. Use existing demo CSV files:
   - `public/demo-trip-6hours.csv`
   - `public/demo-trip-acceleration.csv`
   - `public/demo-trip-small.csv`

2. Create validation test: `src/validation/real-data.test.ts`
3. Test scenarios:
   - Parse real CSV files successfully
   - Detect accelerations from real data
   - Handle edge cases in real data
   - Validate metrics are reasonable
   - Compare with expected results

4. Document any data quality issues found

**Files:**
- `src/validation/real-data.test.ts` - New validation test file

**Dependencies:** Plan 12.1 (unit tests)

---

### Plan 12.8: Fix Bugs from Testing

**Objective:** Fix any bugs discovered during testing.

**Steps:**
1. Review test results from all test plans
2. Identify failing tests
3. Categorize bugs:
   - Critical (blockers)
   - High priority
   - Medium priority
   - Low priority
4. Fix critical and high priority bugs
5. Document low priority bugs for future
6. Re-run tests to verify fixes
7. Update test expectations if needed

**Files:**
- All files where bugs are found

**Dependencies:** Plans 12.1-12.7 (all tests)

---

## Execution Order

**Sequential Execution:**
- Plans 12.1 must run first (testing infrastructure)
- Plans 12.2 depends on 12.1
- Plans 12.3 depends on 12.2
- Plans 12.4 depends on 12.3
- Plans 12.5 can run parallel with 12.2-12.4
- Plans 12.6 depends on 12.4
- Plans 12.7 can run parallel with 12.1-12.6
- Plan 12.8 must run last (after all tests)

**Recommended Sequence:**
1. Execute 12.1 (testing infrastructure)
2. Execute 12.2, 12.5, 12.7 in parallel
3. Execute 12.3 (integration tests)
4. Execute 12.4 (E2E tests)
5. Execute 12.6 (visual regression)
6. Execute 12.8 (fix bugs)

## Success Criteria

- Unit tests pass for acceleration detection
- Unit tests pass for all components
- Integration tests pass
- E2E tests pass for main workflows
- Performance tests meet acceptable thresholds
- Visual regression tests pass
- Real CSV data validates successfully
- All critical bugs fixed
- Test coverage > 70%

## Notes

Testing is critical for production readiness. This phase focuses on:
- Preventing regressions
- Ensuring code quality
- Validating functionality
- Performance optimization
- Visual consistency

Tests should be:
- Fast (unit tests)
- Reliable (consistent results)
- Maintainable (easy to update)
- Comprehensive (cover edge cases)
