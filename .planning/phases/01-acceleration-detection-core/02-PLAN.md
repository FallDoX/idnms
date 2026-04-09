---
phase: 01-acceleration-detection-core
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified: [src/App.tsx, src/utils/parser.ts]
autonomous: true
requirements: [REQ-041]
user_setup: []

must_haves:
  truths:
    - detectAccelerations called after parseTripData in handleFile
    - Acceleration attempts stored in state
    - Default threshold (0-60 km/h) applied
    - Memoization prevents re-detection on unnecessary re-renders
  artifacts:
    - src/App.tsx has accelerationAttempts state
    - src/App.tsx calls detectAccelerations after parseTripData
    - src/utils/parser.ts exports detectAccelerations if needed
  key_links:
    - Acceleration detection integrated into CSV parser flow
    - State management follows existing patterns (useState, useMemo)
---

<objective>
Integrate acceleration detection into CSV parser flow

Purpose: Connect acceleration detection to existing file upload and parsing pipeline
Output: Acceleration attempts detected and stored in state on file load
</objective>

<execution_context>
@$HOME/.codeium/windsurf/get-shit-done/workflows/execute-plan.md
@$HOME/.codeium/windsurf/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-acceleration-detection-core/01-CONTEXT.md
@.planning/phases/01-acceleration-detection-core/01-RESEARCH.md
@.planning/phases/01-acceleration-detection-core/01-VALIDATION.md
@src/App.tsx
@src/utils/parser.ts
@src/utils/acceleration.ts
@src/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add acceleration detection to CSV parser flow</name>
  <files>src/App.tsx</files>
  <read_first>src/App.tsx</read_first>
  <action>Add acceleration state to App.tsx:
- Add accelerationAttempts state: useState<AccelerationAttempt[]>([])
- Add showIncomplete state: useState<boolean>(false) (per CONTEXT.md: toggle to show/hide incomplete, default hidden)
- Add selectedColumns state: useState<Set<string>>(new Set(['time', 'distance', 'averagePower', 'peakPower', 'batteryDrop'])) (per CONTEXT.md: user-selectable columns, default to key metrics)
- Add accelerationThreshold state: useState<number>(60) (per CONTEXT.md: default threshold 0-60 km/h)

In handleFile function, after parseTripData returns data:
- Call detectAccelerations(data, accelerationThreshold)
- Store result in accelerationAttempts state
- Use useMemo to memoize detection result, only re-run when data or threshold changes

Per CONTEXT.md decision: Detect on raw data to preserve peak values (pass full data, not downsampled).
Per CONTEXT.md decision: Default threshold preset: 0-60 km/h.</action>
  <verify>
    <automated>grep -q "accelerationAttempts" src/App.tsx && grep -q "detectAccelerations" src/App.tsx && grep -q "useMemo" src/App.tsx</automated>
  </verify>
  <done>Acceleration detection integrated into handleFile with memoization and default threshold applied</done>
</task>

<task type="auto">
  <name>Task 2: Export detectAccelerations from parser utils</name>
  <files>src/utils/acceleration.ts</files>
  <read_first>src/utils/acceleration.ts</read_first>
  <action>Ensure detectAccelerations is exported from src/utils/acceleration.ts so it can be imported in App.tsx.
Add export statement if not present: export { detectAccelerations }</action>
  <verify>
    <automated>grep -q "export.*detectAccelerations" src/utils/acceleration.ts</automated>
  </verify>
  <done>detectAccelerations exported and available for import in App.tsx</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CSV Input | User-provided CSV files parsed client-side - no server trust boundary |
| State Management | React state - no persistence trust boundary |

## Input Validation

- Acceleration threshold validation: Ensure threshold is finite number >= 0
- State initialization: Default values validated before use

## Output Sanitization

- All acceleration attempts validated before storage in state
- No user-controlled data in error messages
- No HTML/JS injection vectors in state storage

## Security Considerations

- No external API calls or data transmission
- No code execution from CSV data
- State remains in browser memory
</threat_model>
