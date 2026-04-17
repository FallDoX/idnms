# Phase 3: Unit Tests for Components - Plan

**Created:** 2026-04-17
**Status:** Planned
**Milestone:** v1.1

## Phase Overview

**Goal:** Add unit tests for React components.

**Scope:** Test key components for rendering, user interactions, and state management.

## Implementation Plans

### Plan 3.1: Test AccelerationConfig Component
**Objective:** Test AccelerationConfig component rendering and interactions.

**Steps:**
1. Create test file: src/components/AccelerationConfig.test.tsx
2. Test component renders without errors
3. Test threshold pair inputs
4. Test add/remove threshold pairs
5. Test power and temperature threshold inputs

**Files:**
- `src/components/AccelerationConfig.test.tsx` - New test file

**Dependencies:** Phase 1 complete

---

### Plan 3.2: Test AccelerationTab Component
**Objective:** Test AccelerationTab component rendering and state.

**Steps:**
1. Create test file: src/components/AccelerationTab.test.tsx
2. Test component renders without errors
3. Test tab switching
4. Test data loading
5. Test empty state

**Files:**
- `src/components/AccelerationTab.test.tsx` - New test file

**Dependencies:** Phase 1 complete

---

### Plan 3.3: Test AccelerationComparison Component
**Objective:** Test AccelerationComparison component rendering.

**Steps:**
1. Create test file: src/components/AccelerationComparison.test.tsx
2. Test component renders without errors
3. Test empty state
4. Test selected attempts display
5. Test chart rendering

**Files:**
- `src/components/AccelerationComparison.test.tsx` - New test file

**Dependencies:** Phase 1 complete

---

### Plan 3.4: Test useAccelerationState Hook
**Objective:** Test useAccelerationState hook behavior.

**Steps:**
1. Create test file: src/hooks/useAccelerationState.test.ts
2. Test hook initialization
3. Test threshold pair management
4. Test persistence
5. Test show incomplete toggle

**Files:**
- `src/hooks/useAccelerationState.test.ts` - New test file

**Dependencies:** Phase 1 complete

---

## Execution Order

**Parallel Execution:**
- Plans 3.1, 3.2, 3.3 can run in parallel
- Plan 3.4 can run independently

## Success Criteria

- All component tests pass
- Hook tests pass
- Test coverage > 60% for components
- Tests verify rendering, interactions, and state

## Notes

**Testing Approach:**
- Use @testing-library/react for component testing
- Use render from test-utils.tsx
- Test user interactions with userEvent
- Mock hooks and props as needed
- Focus on behavior, not implementation details

**Coverage Goals:**
- Target > 60% code coverage for components
- Focus on critical paths (user interactions)
- Test error handling paths
- Test edge cases (empty data, etc.)
