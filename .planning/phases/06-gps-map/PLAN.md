---
phase: 06-gps-map
status: planned
created: 2026-04-17
---

# Phase 6: GPS Map Visualization

## Objective
Visualize GPS coordinates from CSV data on an interactive map.

## Scope

**GPS map features:**
- Add map library (Leaflet)
- Parse GPS coordinates from CSV
- Render route on map
- Sync map with chart time range

## Implementation Plans

### Plan 6.1: Add Map Library
**Description:** Install and configure Leaflet map library.

**Files to modify:**
- package.json

**Actions:**
- Install leaflet and react-leaflet
- Install @types/leaflet for TypeScript
- Import Leaflet CSS
- Configure map container

**Verification:**
- Library installed successfully
- Types work correctly
- CSS imported

---

### Plan 6.2: Check for GPS Data
**Description:** Check if CSV contains GPS coordinates.

**Files to modify:**
- src/utils/parser.ts

**Actions:**
- Check for GPS columns (Latitude, Longitude)
- Add GPS data validation
- Return GPS availability flag

**Verification:**
- GPS data detection works
- Validation is correct

---

### Plan 6.3: Create Map Component
**Description:** Create Leaflet map component for route visualization.

**Files to create:**
- src/components/GPSMap.tsx

**Actions:**
- Create map container
- Add Leaflet map instance
- Add tile layer (OpenStreetMap)
- Add polyline for route
- Add markers for start/end

**Verification:**
- Map renders correctly
- Route displays on map
- Markers show correctly

---

### Plan 6.4: Integrate Map into App
**Description:** Add GPS map to main application.

**Files to modify:**
- src/App.tsx

**Actions:**
- Add map state
- Render map component when GPS data available
- Position map in layout
- Add toggle for map visibility

**Verification:**
- Map shows when GPS data available
- Toggle works correctly
- Layout looks good

---

### Plan 6.5: Sync Map with Chart
**Description:** Sync map markers with chart time range.

**Files to modify:**
- src/components/GPSMap.tsx
- src/App.tsx

**Actions:**
- Add current time marker on map
- Update marker when chart time changes
- Show current position on route
- Add hover tooltip with time

**Verification:**
- Marker syncs with chart
- Position updates correctly
- Tooltip shows time

---

### Plan 6.6: Test GPS Map
**Description:** Test GPS map functionality.

**Files to test:**
- src/components/GPSMap.tsx
- src/App.tsx

**Actions:**
- Test with GPS data
- Test without GPS data
- Test map interactions
- Test sync with chart

**Verification:**
- Map works with GPS data
- Gracefully handles no GPS data
- Interactions work correctly
- Sync works correctly

---

## Success Criteria

- Map library installed
- GPS data detected
- Map renders route
- Map syncs with chart
- Works with/without GPS data

## Estimated Duration

**Total:** 2-3 hours

## Dependencies

- Depends on: Phase 4 completion
- Blocked by: None

## Notes

Use Leaflet for map rendering. OpenStreetMap for tiles. Only show map when GPS data is available. Keep it simple - just route visualization and current position marker.
