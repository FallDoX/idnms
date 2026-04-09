---
phase: 01-acceleration-detection-core
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/types.ts, src/utils/acceleration.ts]
autonomous: true
requirements: [REQ-040, REQ-041]
user_setup: []

must_haves:
  truths:
    - AccelerationAttempt type defined with all required fields
    - detectAccelerations function correctly identifies acceleration attempts from Speed field
    - Detection uses hardware wheel speed, not GPS
    - Incomplete attempts marked with isComplete flag
    - Data gaps > 500ms filtered out
  artifacts:
    - src/types.ts contains AccelerationAttempt interface
    - src/utils/acceleration.ts contains detectAccelerations function
  key_links:
    - detectAccelerations uses Speed field from TripEntry
    - AccelerationAttempt includes all metrics (time, distance, power, current, voltage, battery, temperature)
---

<objective>
Define acceleration data structures and implement detection algorithm

Purpose: Create the foundation for acceleration analysis by defining the data contract and detection logic
Output: AccelerationAttempt type and detectAccelerations function
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
@src/types.ts
@src/utils/parser.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add AccelerationAttempt type definition</name>
  <files>src/types.ts</files>
  <read_first>src/types.ts</read_first>
  <behavior>
    - Test 1: AccelerationAttempt interface exists with id, startTimestamp, endTimestamp, startSpeed, endSpeed, targetSpeed, time, distance, averagePower, peakPower, averageCurrent, averageVoltage, batteryDrop, averageTemperature, isComplete fields
    - Test 2: All fields have correct types (string, number, boolean)
    - Test 3: Interface is exported correctly
  </behavior>
  <action>Add AccelerationAttempt interface to src/types.ts with the following structure:
- id: string (unique identifier)
- startTimestamp: number
- endTimestamp: number
- startSpeed: number (km/h)
- endSpeed: number (km/h)
- targetSpeed: number (km/h)
- time: number (seconds)
- distance: number (meters)
- averagePower: number (watts)
- peakPower: number (watts)
- averageCurrent: number (amps)
- averageVoltage: number (volts)
- batteryDrop: number (percentage)
- averageTemperature: number (celsius)
- isComplete: boolean

Per CONTEXT.md decision: Use hardware wheel speed (Speed field) not GPS speed for detection.</action>
  <verify>
    <automated>grep -q "export interface AccelerationAttempt" src/types.ts && grep -q "isComplete: boolean" src/types.ts</automated>
  </verify>
  <done>AccelerationAttempt interface exists in src/types.ts with all required fields and correct types</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement acceleration detection algorithm</name>
  <files>src/utils/acceleration.ts</files>
  <read_first>src/types.ts</read_first>
  <behavior>
    - Test 1: detectAccelerations function exists and exports correctly
    - Test 2: Function accepts TripEntry[] and targetSpeed parameters
    - Test 3: Function returns AccelerationAttempt[]
    - Test 4: Threshold crossing detection works correctly
    - Test 5: Incomplete attempts marked with isComplete: false
    - Test 6: Data gaps > 500ms filtered out
    - Test 7: Metrics calculated correctly (time, distance, power, etc.)
  </behavior>
  <action>Create src/utils/acceleration.ts with detectAccelerations function that:
- Accepts TripEntry[] data and targetSpeed (number in km/h)
- Iterates through TripEntry[] using Speed field (hardware wheel speed per CONTEXT.md)
- Detects when speed crosses from below targetSpeed to above targetSpeed
- Tracks start point (speed first crosses targetSpeed) and end point (speed reaches targetSpeed)
- Calculates metrics:
  - Time: endTimestamp - startTimestamp (convert to seconds)
  - Distance: integrate speed over time using trapezoidal method (convert km/h to m/s)
  - Average power: mean(Power) during acceleration
  - Peak power: max(Power) during acceleration
  - Average current: mean(Current) during acceleration
  - Average voltage: mean(Voltage) during acceleration
  - Battery drop: BatteryLevel at end - BatteryLevel at start
  - Average temperature: mean(Temperature) during acceleration
- Marks isComplete: false if targetSpeed not reached
- Filters out attempts with gaps > 500ms between consecutive points
- Returns AccelerationAttempt[]

Per CONTEXT.md decision: Detect on raw data to preserve peak values (no downsampling).
Per CONTEXT.md decision: Ignore incomplete attempts (only show full accelerations where target speed reached).</action>
  <verify>
    <automated>grep -q "export function detectAccelerations" src/utils/acceleration.ts && grep -q "gap.*500" src/utils/acceleration.ts</automated>
  </verify>
  <done>detectAccelerations function correctly identifies acceleration attempts from Speed field with proper filtering and metric calculation</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CSV Input | User-provided CSV files parsed client-side - no server trust boundary |
| Browser Storage | All data remains in browser memory - no persistence trust boundary |

## Input Validation

- Speed field validation: Ensure Speed is finite number >= 0
- Timestamp validation: Ensure timestamps are monotonically increasing
- Data gap filtering: Filter gaps > 500ms to prevent false positives

## Output Sanitization

- All metric calculations use validated numeric inputs
- No user-controlled data in error messages
- No HTML/JS injection vectors in table display

## Security Considerations

- No external API calls or data transmission
- No code execution from CSV data
- No authentication required (client-side only)
</threat_model>
