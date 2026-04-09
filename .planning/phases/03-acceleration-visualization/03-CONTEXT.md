# Phase 3: Acceleration Visualization - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Source:** User discussion

<domain>
## Phase Boundary

Phase 3 adds acceleration visualization to the Trip Telemetry chart as a mode switch, not a separate component. The acceleration attempts are displayed as curves on the existing chart infrastructure with a mode toggle to switch between telemetry view and acceleration view.

</domain>

<decisions>
## Implementation Decisions

### Chart Integration
- **Acceleration visualization uses the existing Trip Telemetry chart** - NOT a separate AccelerationChart component
- **Mode switch added to chart control panel** - toggle between "Telemetry" mode and "Acceleration" mode
- **Different button sets per mode** - telemetry mode shows metric toggles (speed, power, current, etc.), acceleration mode shows attempt selection buttons
- **Reuse existing Chart.js infrastructure** - same chart component, same zoom/pan controls, same data structures

### Mode Switch Behavior
- **Mode toggle button placement** - in the chart control panel, likely near the existing toggle chips
- **Toggle behavior** - switches the entire chart view and button set
- **Default mode** - telemetry mode (existing behavior)
- **Mode persistence** - remember selected mode when switching tabs or re-rendering

### Acceleration Mode Button Set
- **Attempt selection buttons** - one button per acceleration attempt
- **Button behavior** - click to select/deselect attempts, highlight selected attempts on chart
- **Multi-selection support** - user can select multiple attempts to compare
- **Button labeling** - attempt number or time range (e.g., "Attempt 1 (0-60 km/h)")

### Acceleration Curve Visualization
- **Line chart format** - speed vs time for each selected attempt
- **Color coding** - each attempt has a distinct color
- **Highlighting** - selected attempts are fully visible, non-selected attempts are dimmed or hidden
- **Curve styling** - follow existing chart styling (tension, grid lines, etc.)

### Attempt Details
- **Details panel** - reuse or adapt existing FloatingDataPanel to show attempt details
- **Panel content** - attempt metrics (peak power, average power, distance, battery drop, time duration)
- **Panel behavior** - show on attempt selection, hide on deselection
- **Panel placement** - same floating panel as telemetry data

### Claude's Discretion
- **Attempt button layout** - horizontal scroll, grid, or dropdown (choose based on attempt count)
- **Color palette for attempts** - assign distinct colors automatically or use preset palette
- **Performance optimization** - downsampling strategy for large numbers of attempts
- **Chart axis scaling** - whether to auto-scale or use fixed ranges for acceleration curves

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/01-acceleration-detection-core/01-CONTEXT.md` - Acceleration detection algorithm and data structure
- `.planning/phases/02-acceleration-configuration-ui/02-CONTEXT.md` - Threshold configuration and re-detection behavior

### Codebase
- `src/App.tsx` - Main chart implementation with chartToggles state and chart controls
- `src/hooks/useChartState.ts` - Chart state management hook
- `src/components/FloatingDataPanel.tsx` - Floating data panel implementation
- `src/utils/acceleration.ts` - Acceleration detection algorithm

### Requirements
- `.planning/REQUIREMENTS.md` - All requirements including acceleration visualization (REQ-047, REQ-048)

</canonical_refs>

<specifics>
## Specific Ideas

- Mode toggle button labeled "Ускорение" (Acceleration) to switch from telemetry view
- Attempt buttons use attempt number from accelerationAttempts array
- Selected attempts rendered as line chart datasets with speed vs time data
- Non-selected attempts either hidden or dimmed to 20% opacity
- Floating panel shows attempt metrics: peak power, average power, distance, battery drop, duration
- Attempt data structure already includes all needed metrics from Phase 1

</specifics>

<deferred>
## Deferred Ideas

None - all decisions captured.

</deferred>

---
*Phase: 03-acceleration-visualization*
*Context gathered: 2026-04-09 via user discussion*
