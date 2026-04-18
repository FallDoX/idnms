# Trip Log Analyzer - Project

**Last updated:** 2026-04-09 after initialization

## What This Is

A cross-platform web-based tool for analyzing trip telemetry from CSV logs. Works on Windows, macOS, and Linux in any browser. The application processes CSV files locally in the browser, displays interactive charts, and provides trip statistics without server-side processing.

## Core Value

Fast, private trip log analysis - all data stays in the user's browser, no server uploads.

## Context

**Current State:** The application is production-ready with core functionality complete. Users can upload CSV files, view interactive charts (speed, power, voltage, temperature), filter by time range, and export statistics as screenshots.

**Future Goal:** Add acceleration analysis and comparison features (analysis and comparison of acceleration attempts from any speed to any speed).

## Requirements

### Validated

- ✓ CSV file upload via drag-and-drop or file picker
- ✓ CSV parsing with automatic format detection (old/new format)
- ✓ Trip statistics calculation (max speed, distance, peak power, battery drop, etc.)
- ✓ Interactive charts using Chart.js:
  - Speed profile (Speed vs GPS Speed)
  - Power and current
  - Voltage and battery level (%)
  - System temperature
- ✓ Time range filtering via slider
- ✓ Chart display toggles (show/hide metrics)
- ✓ Chart zoom functionality
- ✓ Draggable floating data panel
- ✓ Screenshot export (PNG)
- ✓ Internationalization (English, Russian)
- ✓ Demo data files for testing
- ✓ Performance optimizations (downsampling, throttling, memoization)
- ✓ Component refactoring (TripOverview component, custom hooks)

### Active

- [ ] Acceleration analysis - detect and analyze acceleration attempts
- [ ] Acceleration comparison - compare acceleration runs from different speeds
- [ ] Custom speed thresholds for acceleration analysis
- [ ] Acceleration attempt visualization (charts, tables)

### Out of Scope

- Server-side data processing - all processing remains client-side for privacy
- User accounts and data storage - no backend, no persistence
- Real-time data streaming - only static CSV file analysis
- Mobile app version - web-only application

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Client-side only | Privacy - user data never leaves browser | No backend required |
| React 19 + Vite | Modern, fast development experience | Chosen |
| Chart.js for visualization | Mature library, good performance | Chosen |
| Tailwind CSS | Rapid UI development | Chosen |
| No state management library | App is simple enough for React state | Pending re-evaluation if app grows |

## Constraints

**Privacy:** All data must remain client-side - no server uploads or storage

**Performance:** Must handle large CSV files (10,000+ data points) efficiently via downsampling

**Browser Compatibility:** Must work on Chrome, Edge, Firefox, Safari (Windows, macOS, Linux)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---

*Phase: 01-initialization*
*Context gathered: 2026-04-09 via gsd-new-project*
