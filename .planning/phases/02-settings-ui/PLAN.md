---
phase: 02-settings-ui
status: planned
created: 2026-04-17
---

# Phase 2: Settings UI

## Objective
Add settings panel for managing user preferences.

## Scope

**Settings UI components:**
- SettingsPanel component with toggle button
- Metric visibility settings
- Chart view settings
- Reset to defaults button

## Implementation Plans

### Plan 2.1: Create SettingsPanel Component
**Description:** Create a component for displaying and managing settings.

**Files to create:**
- src/components/SettingsPanel.tsx (new file)

**Actions:**
- Create SettingsPanel component
- Add panel header with title
- Add close button
- Add panel container
- Style panel with existing design system
- Add animation for open/close

**Verification:**
- Component renders correctly
- Panel opens/closes correctly
- Styling matches existing UI

---

### Plan 2.2: Add Settings Toggle Button
**Description:** Add button to open/close settings panel.

**Files to modify:**
- src/App.tsx

**Actions:**
- Add Settings button to header
- Add onClick handler to toggle panel
- Style button with existing design system
- Add Settings icon from lucide-react
- Position button in header

**Verification:**
- Button displays correctly
- Clicking toggles panel
- Button styling matches existing buttons

---

### Plan 2.3: Add Metric Visibility Settings
**Description:** Add controls for toggling chart metric visibility.

**Files to modify:**
- src/components/SettingsPanel.tsx

**Actions:**
- Add section for chart metrics
- Add toggle buttons for each metric
- Connect to chartToggles state
- Use ToggleChip component for consistency
- Add section title

**Verification:**
- All metrics displayed
- Toggles work correctly
- State updates correctly

---

### Plan 2.4: Add Chart View Settings
**Description:** Add controls for chart view preferences.

**Files to modify:**
- src/components/SettingsPanel.tsx

**Actions:**
- Add section for chart view
- Add line/scatter toggle
- Add hide idle periods toggle
- Connect to chartView and hideIdlePeriods state
- Use ToggleChip component for consistency

**Verification:**
- View options displayed
- Toggles work correctly
- State updates correctly

---

### Plan 2.5: Add Reset to Defaults Button
**Description:** Add button to reset all settings to defaults.

**Files to modify:**
- src/components/SettingsPanel.tsx

**Actions:**
- Add reset button at bottom of panel
- Add confirmation dialog
- Call resetSettings utility
- Update state after reset
- Show success message

**Verification:**
- Button displays correctly
- Reset works correctly
- State updates to defaults
- Confirmation works

---

### Plan 2.6: Add Settings Validation
**Description:** Add validation for settings values.

**Files to modify:**
- src/components/SettingsPanel.tsx

**Actions:**
- Validate settings before applying
- Show error if invalid
- Prevent invalid settings
- Add validation feedback
- Handle validation errors gracefully

**Verification:**
- Invalid settings rejected
- Error messages display
- Valid settings accepted

---

### Plan 2.7: Style Settings Panel
**Description:** Style settings panel to match existing UI.

**Files to modify:**
- src/components/SettingsPanel.tsx

**Actions:**
- Use existing design tokens
- Match existing panel styling
- Add proper spacing
- Add proper typography
- Add proper colors
- Ensure responsive design

**Verification:**
- Styling matches existing UI
- Panel looks professional
- Responsive on different screen sizes

---

### Plan 2.8: Test Settings UI Interactions
**Description:** Test all settings UI interactions.

**Files to test:**
- src/components/SettingsPanel.tsx
- src/App.tsx

**Actions:**
- Test opening/closing panel
- Test toggling metrics
- Test changing view settings
- Test reset to defaults
- Test localStorage persistence
- Test error handling

**Verification:**
- All interactions work correctly
- Settings persist across sessions
- Reset works correctly
- Errors handled gracefully

---

## Success Criteria

- SettingsPanel component created
- Settings toggle button added
- Metric visibility settings work
- Chart view settings work
- Reset to defaults works
- Settings validation works
- Settings panel styled correctly
- All interactions tested

## Estimated Duration

**Total:** 2-3 hours

## Dependencies

- Depends on: Phase 1 completion (settings persistence)
- Blocked by: None

## Notes

Settings UI should be intuitive and match existing design patterns. Use existing components like ToggleChip for consistency. Panel should be dismissible and not block main content.
