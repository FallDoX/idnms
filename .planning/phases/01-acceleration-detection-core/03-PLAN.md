---
phase: 01-acceleration-detection-core
plan: 03
type: execute
wave: 3
depends_on: [01, 02]
files_modified: [src/components/AccelerationTable.tsx]
autonomous: true
requirements: [REQ-042, REQ-043]
user_setup: []

must_haves:
  truths:
    - AccelerationTable component displays acceleration attempts in table format
    - Table shows all metrics (time, distance, power, current, voltage, battery, temperature)
    - Column selector allows user to choose which metrics to display
    - Incomplete attempts shown in different color (gray/muted)
    - Toggle shows/hides incomplete attempts (default hidden)
    - Styling matches existing glassmorphism patterns
  artifacts:
    - src/components/AccelerationTable.tsx exists
    - Component accepts accelerationAttempts, showIncomplete, selectedColumns props
  key_links:
    - Per CONTEXT.md: Table metrics - all metrics available with user-selectable columns
    - Per CONTEXT.md: Incomplete attempts shown in different color with toggle, default hidden
    - Per UI-SPEC: Use shadcn table component, glassmorphism styling, 8-point spacing
---

<objective>
Create AccelerationTable component for displaying acceleration attempts

Purpose: Build table UI to display detected acceleration attempts with column selection and incomplete attempt filtering
Output: AccelerationTable component with glassmorphism styling
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
@.planning/phases/01-acceleration-detection-core/01-UI-SPEC.md
@src/types.ts
@src/components/TripOverview.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create AccelerationTable component</name>
  <files>src/components/AccelerationTable.tsx</files>
  <read_first>src/components/TripOverview.tsx</read_first>
  <action>Create src/components/AccelerationTable.tsx component with:
- Props: accelerationAttempts (AccelerationAttempt[]), showIncomplete (boolean), selectedColumns (Set<string>), onShowIncompleteToggle (function), onColumnToggle (function)
- Use shadcn Table component (install via npx shadcn add table if not present)
- Glassmorphism styling matching TripOverview pattern (backdrop-blur, gradients, borders)
- 8-point spacing per UI-SPEC (4, 8, 16, 24, 32, 48, 64px)
- Typography per UI-SPEC (body 14px, label 12px, heading 18px)
- Color per UI-SPEC (slate-900 dominant, glassmorphism secondary, blue-500 accent for interactive elements)
- Table columns based on selectedColumns prop (time, distance, averagePower, peakPower, averageCurrent, averageVoltage, batteryDrop, averageTemperature)
- Incomplete attempts (isComplete: false) shown with gray/muted text color (text-slate-400)
- Toggle switch for show/hide incomplete attempts (use shadcn Switch component)
- Column selector with checkboxes for each metric
- Empty state display when no acceleration attempts found (per UI-SPEC copywriting: "No acceleration attempts found" + "Try loading a CSV file with speed data to detect acceleration attempts.")

Per CONTEXT.md: All metrics available with user-selectable columns via settings.
Per CONTEXT.md: Incomplete attempts shown in different color with toggle to show/hide, default hidden.
Per UI-SPEC: Primary CTA "Show incomplete attempts" for toggle.
Per UI-SPEC: Registry includes shadcn official components (table, button, switch, tabs).</action>
  <verify>
    <automated>grep -q "export.*AccelerationTable" src/components/AccelerationTable.tsx && grep -q "isComplete" src/components/AccelerationTable.tsx && grep -q "showIncomplete" src/components/AccelerationTable.tsx</automated>
  </verify>
  <done>AccelerationTable component created with table display, column selector, and incomplete attempt toggle</done>
</task>

<task type="auto">
  <name>Task 2: Install shadcn table component</name>
  <files>src/components/ui/table.tsx</files>
  <read_first>components.json</read_first>
  <action>Run npx shadcn add table to install the shadcn Table component if not already present in src/components/ui/table.tsx.
This adds the Table, TableHeader, TableRow, TableHead, TableBody, TableCell components needed for the acceleration table.</action>
  <verify>
    <automated>test -f src/components/ui/table.tsx</automated>
  </verify>
  <done>shadcn Table component installed and available for use</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Component Props | Props passed from parent component - no external trust boundary |
| State Management | Component state - no persistence trust boundary |

## Input Validation

- accelerationAttempts: Validate array structure before rendering
- selectedColumns: Validate Set contains only known metric names
- showIncomplete: Validate boolean type

## Output Sanitization

- All table values from validated AccelerationAttempt objects
- No user-controlled HTML in table cells
- Column selector uses safe checkbox inputs

## Security Considerations

- No external API calls
- No code execution from props
- Component is presentational only
</threat_model>
