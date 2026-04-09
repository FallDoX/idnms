# Phase 4: Acceleration State Refactoring - Research

**Researched:** 2026-04-10
**Status:** Complete

## Research Questions

### 1. React Custom Hook Best Practices for State Management

**Findings:**
- Single responsibility: Hooks should focus on one domain of state
- Return value: Object with state and setters is most common pattern
- Destructuring: `const { state, setState } = useHook()` is idiomatic
- Dependencies: Hooks should accept dependencies as parameters, not read from global state
- Reusability: Hooks should be pure functions with no side effects except React hooks

**Codebase patterns:**
- `useChartState.ts`: Returns object with all state and setters, follows idiomatic pattern
- `useChartOptions.ts`: Pure function returning configuration, no state

**Recommendation:** Follow `useChartState` pattern - return object with all state and setters for destructuring.

---

### 2. localStorage Integration Patterns in React Hooks

**Findings:**
- Initialization: Read from localStorage in useState initial value
- Synchronization: Use useEffect to write to localStorage when state changes
- Error handling: Wrap localStorage access in try-catch (private mode throws errors)
- Serialization: Use JSON.stringify/JSON.parse for complex types
- Key namespacing: Use prefix to avoid collisions (e.g., `acceleration_threshold`)

**Pattern:**
```typescript
const [value, setValue] = useState(() => {
  try {
    const saved = localStorage.getItem('key');
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
});

useEffect(() => {
  try {
    localStorage.setItem('key', JSON.stringify(value));
  } catch {
    // Silent fail - localStorage unavailable
  }
}, [value]);
```

**Set serialization:** Convert Set to Array for JSON, Array to Set on read.

**Recommendation:** Use lazy initialization in useState with try-catch, useEffect for writes with try-catch.

---

### 3. Memoization Strategies in Custom Hooks

**Findings:**
- useMemo: For expensive computations that depend on specific values
- useCallback: For function references that should not change unnecessarily
- Current codebase: `accelerationAttemptsMemoized` uses useMemo with `[data, accelerationThreshold]` dependencies
- Inside hook: Memoization should be hidden from hook consumer
- Performance: Memoization is worthwhile for `detectAccelerations` as it processes large arrays

**Pattern:**
```typescript
const computedValue = useMemo(() => {
  return expensiveComputation(data, threshold);
}, [data, threshold]);
```

**Recommendation:** Keep useMemo inside hook with same dependencies as current implementation.

---

### 4. Hook Composition Patterns (Single Hook vs Multiple Focused Hooks)

**Findings:**
- Single hook: Simpler for small domains, easier to import
- Multiple hooks: Better for large domains with clear subdomains (e.g., `useAuth`, `useUser`)
- Current state: Acceleration state is small (4 state variables) - single hook appropriate
- Future: If acceleration state grows significantly, can split into `useAccelerationDetection` and `useAccelerationConfig`

**Codebase context:**
- Chart state uses single hook (`useChartState`) for all chart-related state
- This pattern works well for the project

**Recommendation:** Single hook `useAccelerationState` as decided in context. Split only if becomes unwieldy (>10 state variables).

---

### 5. State Cleanup Patterns on Unmount

**Findings:**
- useEffect cleanup: Return function from useEffect to clean up on unmount
- Common use cases: Timers, event listeners, subscriptions
- Acceleration state: No external resources (timers, listeners) - cleanup not needed
- localStorage: No cleanup needed - persists across sessions by design

**Recommendation:** No cleanup needed for acceleration state. Remove from phase scope.

---

### 6. Unit Testing Patterns for React Hooks

**Findings:**
- @testing-library/react-hooks: Standard library for testing hooks
- Pattern: `const { result } = renderHook(() => useHook())`
- Test scenarios: Initial state, state updates, side effects (localStorage)
- localStorage testing: Mock localStorage with jest or vi
- Integration testing: Test hook in component context for full behavior

**Example:**
```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useAccelerationState } from './useAccelerationState';

test('initializes with localStorage value', () => {
  // Mock localStorage
  const { result } = renderHook(() => useAccelerationState(mockData));
  expect(result.current.threshold).toBe(60);
});
```

**Recommendation:** Add unit tests for hook using @testing-library/react-hooks. Test localStorage integration with mocks.

---

## Validation Architecture

This phase requires validation for:
- Hook API correctness (returns expected values)
- localStorage integration (save/load works correctly)
- Memoization (performance maintained)
- Component integration (App.tsx and AccelerationTab work with hook)

**Validation strategy:**
1. Manual verification: Test hook in development environment
2. Code review: Verify hook follows patterns from `useChartState`
3. Integration test: Load CSV file, verify acceleration state works
4. localStorage test: Change threshold, reload page, verify persisted

---

## Key Technical Decisions

### localStorage Error Handling
- Use try-catch for all localStorage access
- Silent fail on error (private mode)
- Fall back to default values

### Set Serialization
- Convert Set<string> to Array<string> for localStorage
- Convert Array<string> back to Set<string> on read
- Use JSON.stringify/JSON.parse

### Clear Settings Function
- Remove specific keys: `acceleration_threshold`, `acceleration_selected_columns`
- Don't clear all localStorage (might affect other features)
- Return boolean indicating success/failure

---

## Pitfalls to Avoid

1. **localStorage quota exceeded** - Unlikely for small settings, but handle errors
2. **Set serialization issues** - Always convert Set to Array before JSON.stringify
3. **Memoization dependency mismatch** - Keep same dependencies as current implementation
4. **Hook dependency array issues** - Ensure all external dependencies are in dependency arrays
5. **Testing localStorage in production** - Only mock in tests, use real localStorage in development

---

## Code References

- `src/hooks/useChartState.ts` - Pattern for hook structure
- `src/App.tsx` lines 173-176 - Current acceleration state
- `src/App.tsx` lines 701-703 - Current memoization pattern
- `src/components/AccelerationTab.tsx` - Component using acceleration state

---

## Summary

Phase 4 is straightforward refactoring with clear patterns to follow:
1. Create `useAccelerationState` hook following `useChartState` pattern
2. Move state from App.tsx to hook
3. Add localStorage integration with lazy initialization and error handling
4. Keep memoization inside hook
5. Add `clearSettings` function for localStorage cleanup
6. Update App.tsx and AccelerationTab to use hook
7. No cleanup on unmount needed
8. Add unit tests using @testing-library/react-hooks

No new libraries needed - use existing React patterns.

---

*Phase: 04-acceleration-state-refactoring*
*Research completed: 2026-04-10*
