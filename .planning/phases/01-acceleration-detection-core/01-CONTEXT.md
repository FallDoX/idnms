# Phase 1: Acceleration Detection Core - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Source:** discuss-phase

## Phase Boundary

Implement basic acceleration detection algorithm and display results in table format. The phase includes:
- Adding AccelerationAttempt type definition
- Implementing acceleration detection algorithm (detectAccelerations)
- Adding acceleration detection to CSV parser flow
- Creating AccelerationTable component
- Integrating acceleration table into dashboard
- Adding default threshold preset (0-60 km/h)
- Implementing minimum duration filter (prevent false positives)
- Handling edge cases (incomplete attempts, data gaps)

## Implementation Decisions

### Acceleration Detection Logic

**Definition of acceleration attempt:** Detect acceleration from any starting speed up to target speed threshold, up to peak speed. Use hardware wheel speed metric (Speed field in TripEntry) - no GPS noise filtering needed since data is from wheel sensor, not GPS.

**Detection approach:** Simple threshold crossing detection - identify when speed crosses from below threshold to above threshold. No complex noise filtering required since using hardware sensor data.

**Data source for detection:** Run detection on raw (unsampled) CSV data to preserve peak values - no downsampling to avoid smoothing out peak acceleration values.

### Table Integration

**UI placement:** Separate tab "Acceleration" alongside existing chart views. Users can switch between chart tabs and acceleration tab.

### Table Metrics

**Metrics displayed:** All metrics available (time, distance, average power, peak power, current, voltage, battery drop, temperature) with user-selectable columns via settings. Default to showing key metrics (time, distance, average power, peak power, battery drop).

### Incomplete Attempts

**Handling:** Ignore incomplete attempts - only show full acceleration attempts where target speed threshold is reached. If speed starts at 0 and reaches 50 km/h but target is 60 km/h, do not show this attempt.

### Default Threshold

**Default preset:** 0-60 km/h as the default acceleration threshold preset.

## Claude's Discretion

**Implementation details:**
- Acceleration detection algorithm specifics (how to identify start/end points, calculate time/distance)
- AccelerationAttempt type structure (what fields to include)
- Minimum duration filter value (research suggests 2 seconds, but adjust based on testing)
- Data gap handling strategy (filter gaps > 500ms per research)
- Table component implementation details (sorting, pagination, styling)
- Integration with existing App.tsx state management
- Performance optimizations for large CSV files (caching, memoization)

**Technical choices:**
- Whether to create custom hook for acceleration state (useAccelerationState)
- Whether to extract acceleration detection to separate utility file (src/utils/acceleration.ts)
- Specific Chart.js configuration if adding acceleration visualization later
- Tailwind CSS styling approach for table and tab UI

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/STACK.md` - Stack recommendations (no additional libraries needed)
- `.planning/research/FEATURES.md` - Feature complexity and dependencies
- `.planning/research/ARCHITECTURE.md` - Component structure and build order
- `.planning/research/PITFALLS.md` - Common pitfalls to avoid (GPS noise, performance, UX issues)
- `.planning/research/SUMMARY.md` - Key findings and implementation strategy

### Project Documentation
- `.planning/PROJECT.md` - Project context and constraints (privacy, performance, browser compatibility)
- `.planning/REQUIREMENTS.md` - Requirements (REQ-040, REQ-041, REQ-042, REQ-043)
- `.planning/ROADMAP.md` - Phase 1 plans and success criteria
- `.planning/codebase/ARCHITECTURE.md` - Current application architecture
- `.planning/codebase/STRUCTURE.md` - File structure and component organization
- `.planning/codebase/CONCERNS.md` - Technical debt and priority recommendations

### Codebase
- `src/types.ts` - Existing TripEntry and TripSummary types (for reference when adding AccelerationAttempt)
- `src/components/TripOverview.tsx` - Example component pattern and styling approach
- `src/utils/parser.ts` - Existing CSV parsing and data processing (for integration point)
- `src/App.tsx` - Main component structure and state management patterns

No external specs - requirements fully captured in decisions above.

## Specific Ideas

- Use hardware wheel speed (Speed field) not GPS speed for detection
- Default threshold preset: 0-60 km/h
- Table in separate tab "Acceleration"
- User-selectable table columns via settings
- Ignore incomplete attempts (target speed not reached)
- Detect on raw data to preserve peak values

## Deferred Ideas

None - phase scope is clear.

---

*Phase: 01-acceleration-detection-core*
*Context gathered: 2026-04-09 via discuss-phase*
