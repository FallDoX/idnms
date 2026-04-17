# Phase 1: Testing Infrastructure Setup - Plan

**Created:** 2026-04-17
**Status:** Planned
**Milestone:** v1.1

## Phase Overview

**Goal:** Install and configure testing framework for the project.

**Scope:** Set up Vitest, @testing-library/react, configure test scripts, and establish testing infrastructure.

## Implementation Plans

### Plan 1.1: Install Vitest and Configure Test Environment

**Objective:** Install Vitest as the unit testing framework.

**Steps:**
1. Install Vitest: `npm install -D vitest @vitest/ui`
2. Install @testing-library/react: `npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`
3. Install @vitest/coverage-v8: `npm install -D @vitest/coverage-v8`
4. Create vitest.config.ts configuration file
5. Configure TypeScript support for tests
6. Configure environment for browser-like testing

**Files:**
- `package.json` - Add dev dependencies
- `vitest.config.ts` - New configuration file
- `tsconfig.json` - Update for test files

**Dependencies:** None

---

### Plan 1.2: Configure Test Scripts

**Objective:** Add test scripts to package.json.

**Steps:**
1. Add "test" script: `vitest`
2. Add "test:ui" script: `vitest --ui`
3. Add "test:coverage" script: `vitest --coverage`
4. Add "test:run" script: `vitest run`
5. Configure test environment variables if needed

**Files:**
- `package.json` - Add test scripts

**Dependencies:** Plan 1.1

---

### Plan 1.3: Create Test Utilities and Mocks

**Objective:** Create reusable test utilities and mocks.

**Steps:**
1. Create `src/test-utils.tsx` with render function
2. Create mock data fixtures for acceleration tests
3. Create mock CSV data for parser tests
4. Create mock hooks for React testing
5. Set up test environment globals

**Files:**
- `src/test-utils.tsx` - New test utilities
- `src/fixtures/acceleration-mocks.ts` - Mock acceleration data
- `src/fixtures/csv-mocks.ts` - Mock CSV data

**Dependencies:** Plan 1.2

---

### Plan 1.4: Create First Sample Test

**Objective:** Create a sample test to verify infrastructure works.

**Steps:**
1. Create `src/__tests__/example.test.ts`
2. Write simple unit test
3. Run test to verify setup
4. Verify test UI works
5. Verify coverage reporting works

**Files:**
- `src/__tests__/example.test.ts` - Sample test

**Dependencies:** Plan 1.3

---

### Plan 1.5: Update tsconfig for Test Files

**Objective:** Configure TypeScript to recognize test files.

**Steps:**
1. Update tsconfig.json to include test files
2. Create tsconfig.test.json if needed
3. Configure path aliases for test imports
4. Verify TypeScript compilation works for tests

**Files:**
- `tsconfig.json` - Update configuration
- `tsconfig.test.json` - New test configuration (optional)

**Dependencies:** Plan 1.4

---

## Execution Order

**Sequential Execution:**
- Plans must run in order (1.1 → 1.2 → 1.3 → 1.4 → 1.5)

## Success Criteria

- Vitest installed and configured
- Test scripts working in package.json
- Test utilities created
- Sample test passes
- Test UI accessible
- Coverage reporting working
- TypeScript compilation works for tests

## Notes

This phase establishes the testing infrastructure for the entire project. Once complete, subsequent phases can write tests using this infrastructure.

Vitest is chosen because:
- Fast (native ESM support)
- Compatible with Vite (same config)
- Good TypeScript support
- Built-in coverage with v8
- UI mode for debugging

@testing-library/react is chosen because:
- Standard for React component testing
- Encourages testing user behavior
- Good documentation
- Compatible with Vitest
