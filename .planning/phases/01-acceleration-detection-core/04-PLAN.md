---
phase: 01-acceleration-detection-core
plan: 04
type: execute
wave: 4
depends_on: [02, 03]
files_modified: [src/App.tsx, src/components/AccelerationTab.tsx]
autonomous: true
requirements: [REQ-042, REQ-043]
user_setup: []

must_haves:
  truths:
    - Acceleration tab appears alongside existing chart tabs
    - AccelerationTable component rendered in AccelerationTab
    - Tab system includes "Acceleration" option
    - State management passes acceleration attempts to table
    - Toggle and column selector handlers connected
  artifacts:
    - src/components/AccelerationTab.tsx exists
    - src/App.tsx includes AccelerationTab in tab system
    - Tab state includes "acceleration" option
  key_links:
    - Per CONTEXT.md: Table integration - separate tab "Acceleration" alongside existing chart views
    - Per UI-SPEC: Use shadcn Tabs component for tab system
---

<objective>
Integrate acceleration table into dashboard with tab system

Purpose: Add acceleration tab to existing tab system and wire up AccelerationTable component
Output: Acceleration tab displaying acceleration attempts with full functionality
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
@src/App.tsx
@src/components/AccelerationTable.tsx
@src/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create AccelerationTab wrapper component</name>
  <files>src/components/AccelerationTab.tsx</files>
  <read_first>src/components/AccelerationTable.tsx</read_first>
  <action>Create src/components/AccelerationTab.tsx component with:
- Props: accelerationAttempts (AccelerationAttempt[]), showIncomplete (boolean), selectedColumns (Set<string>), onShowIncompleteToggle (function), onColumnToggle (function)
- Render AccelerationTable component with all props passed through
- Use memo() for performance optimization
- Export as default component

This wrapper component follows the pattern of existing components (TripOverview, etc.) with memo() optimization.</action>
  <verify>
    <automated>grep -q "export.*AccelerationTab" src/components/AccelerationTab.tsx && grep -q "memo" src/components/AccelerationTab.tsx</automated>
  </verify>
  <done>AccelerationTab wrapper component created with memo optimization</done>
</task>

<task type="auto">
  <name>Task 2: Install shadcn tabs component</name>
  <files>src/components/ui/tabs.tsx</files>
  <read_first>components.json</read_first>
  <action>Run npx shadcn add tabs to install the shadcn Tabs component if not already present in src/components/ui/tabs.tsx.
This adds the Tabs, TabsList, TabsTrigger, TabsContent components needed for the tab system.</action>
  <verify>
    <automated>test -f src/components/ui/tabs.tsx</automated>
  </verify>
  <done>shadcn Tabs component installed and available for use</done>
</task>

<task type="auto">
  <name>Task 3: Integrate acceleration tab into App.tsx</name>
  <files>src/App.tsx</files>
  <read_first>src/App.tsx</read_first>
  <action>In src/App.tsx:
- Import AccelerationTab component
- Add "acceleration" to tab state options (existing tab system likely uses string state for active tab)
- Add TabsTrigger for "Acceleration" tab in the tabs list
- Add TabsContent for "acceleration" that renders AccelerationTab
- Pass acceleration state props to AccelerationTab: accelerationAttempts, showIncomplete, selectedColumns, onShowIncompleteToggle, onColumnToggle
- Follow existing tab styling patterns (glassmorphism, consistent with other tabs)

Per CONTEXT.md: Table integration - separate tab "Acceleration" alongside existing chart views.
Per UI-SPEC: Use shadcn Tabs component, blue-500 accent for active tab state.</action>
  <verify>
    <automated>grep -q "AccelerationTab" src/App.tsx && grep -q "acceleration" src/App.tsx</automated>
  </verify>
  <done>Acceleration tab integrated into App.tsx tab system with proper state wiring</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Component Props | Props passed from parent component - no external trust boundary |
| Tab State | React state - no persistence trust boundary |

## Input Validation

- accelerationAttempts: Validate array structure before rendering
- Tab state: Validate string matches known tab options

## Output Sanitization

- All props validated before passing to child components
- No user-controlled HTML in tab labels

## Security Considerations

- No external API calls
- No code execution from props
- Tab system is presentational only
</threat_model>
