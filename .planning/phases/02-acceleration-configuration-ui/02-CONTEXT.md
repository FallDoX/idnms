# Phase 2: Acceleration Configuration UI - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Source:** discuss-phase

## Phase Boundary

Add user interface for custom threshold configuration in the Acceleration tab. The phase includes:
- Creating AccelerationConfig component
- Adding threshold state to App.tsx
- Implementing threshold change handler with re-detection
- Adding preset buttons (default: 25, 60, 90, 100 km/h)
- Adding custom threshold input fields
- Implementing debounce for threshold changes
- Adding threshold validation (from < to)
- Adding visual examples for threshold configuration

## Implementation Decisions

### UI Placement
- Configuration UI placed inside the Acceleration tab (not as a separate tab or dashboard control)
- Pattern similar to TripOverview component (settings panel within the tab)

### Input Method
- Both preset buttons and custom input fields available
- Preset buttons placed next to input fields (not in separate section)
- Default presets: 25, 60, 90, 100 km/h
- User can add custom presets (preset management feature included)

### Re-detection Behavior
- Re-detection triggers on blur from input fields (not on every keystroke or explicit button)
- Debounce applied to prevent excessive re-detection with large CSV files

### Validation Feedback
- Automatic correction to valid range when invalid values entered
- If user enters "from: 60, to: 30", automatically swap to "from: 30, to: 60"
- No error messages or disabled buttons - auto-correct inline

### Claude's Discretion
- Exact debounce timing value (research suggests 300-500ms, adjust based on testing)
- Preset management UI details (how users add/remove custom presets)
- Visual examples for threshold configuration (what examples to show)
- Integration with existing acceleration state in App.tsx

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Context
- `.planning/phases/01-acceleration-detection-core/01-CONTEXT.md` - Acceleration detection decisions, default threshold preset (0-60 km/h), table integration pattern

### Research
- `.planning/research/STACK.md` - Stack recommendations (no additional libraries needed)
- `.planning/research/FEATURES.md` - Feature complexity and dependencies
- `.planning/research/ARCHITECTURE.md` - Component structure and build order
- `.planning/research/PITFALLS.md` - Common pitfalls to avoid (performance with large CSV files)

### Project Documentation
- `.planning/PROJECT.md` - Project context and constraints (privacy, performance, browser compatibility)
- `.planning/REQUIREMENTS.md` - Requirements (REQ-044, REQ-045, REQ-046)
- `.planning/ROADMAP.md` - Phase 2 plans and success criteria
- `.planning/codebase/CONVENTIONS.md` - Code conventions (React patterns, state management, styling)
- `.planning/codebase/ARCHITECTURE.md` - Current application architecture
- `.planning/codebase/STRUCTURE.md` - File structure and component organization

### Codebase
- `src/App.tsx` - Main component structure and state management patterns (acceleration state from Phase 1)
- `src/components/TripOverview.tsx` - Settings panel pattern (glassmorphism, toggle switches)
- `src/components/AccelerationTable.tsx` - Existing acceleration table component (for integration reference)
- `src/types.ts` - AccelerationAttempt type (from Phase 1)

No external specs - requirements fully captured in decisions above.

## Specific Ideas

- Presets next to input fields (not separate section)
- Auto-swap invalid threshold pairs (from > to → to > from)
- Re-detection on blur (not on keystroke)
- User can add custom presets
- Pattern like TripOverview for settings panel

## Deferred Ideas

None - discussion stayed within phase scope.

---

*Phase: 02-acceleration-configuration-ui*
*Context gathered: 2026-04-09 via discuss-phase*
