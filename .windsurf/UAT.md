# WFEUCAPP - User Acceptance Testing (UAT)

## Project: WFEUCAPP v2.0.0
## Date: 2026-04-05
## Status: Ready for Testing

---

## Test Cases

### TC-01: CSV File Upload
**Priority:** High | **Status:** ✅ Ready to Test

**Steps:**
1. Open application at http://localhost:5174/
2. Click "Загрузить CSV" button
3. Select a valid CSV log file from EUC World/WheelLog
4. Verify file loads successfully

**Expected Result:**
- File name displayed in header
- Summary cards appear with metrics
- Chart renders with telemetry data
- No errors in console

---

### TC-02: Drag & Drop Upload
**Priority:** High | **Status:** ✅ Ready to Test

**Steps:**
1. Drag CSV file onto application window
2. Verify drag overlay appears
3. Drop file
4. Verify file loads

**Expected Result:**
- Drag overlay with animation shows
- File uploads successfully
- Data displayed correctly

---

### TC-03: Screenshot Creation
**Priority:** High | **Status:** ✅ Ready to Test

**Steps:**
1. Load any CSV file
2. Click "Share" button (camera icon)
3. Wait for screenshot generation
4. Verify PNG download starts

**Expected Result:**
- Loading indicator shows "Создание скриншота..."
- PNG file downloads successfully
- No OKLCH color errors
- Image contains all visible data

---

### TC-04: Chart Zoom - Double Click
**Priority:** High | **Status:** ✅ Ready to Test

**Steps:**
1. Load CSV file
2. Double-click on chart at specific time point
3. Verify zoom in occurs

**Expected Result:**
- Chart zooms in 2x centered on click point
- Time range updates in timeline
- Desktop hint shows: "Двойной клик = приближение"

---

### TC-05: Chart Zoom - Shift+Scroll
**Priority:** Medium | **Status:** ✅ Ready to Test

**Steps:**
1. Hold Shift key
2. Scroll mouse wheel up/down on chart
3. Verify zoom in/out

**Expected Result:**
- Zoom centers on mouse position
- Smooth zoom animation
- No page scroll while Shift held

---

### TC-06: Battery Drop Tiles
**Priority:** High | **Status:** ✅ Ready to Test

**Steps:**
1. Load CSV with battery data
2. Check "Общий разряд батареи" tile
3. Check "Макс. просадка от пика" tile

**Expected Result:**
- Tile names are clear and descriptive
- Values calculate correctly
- Units show as "%"

---

### TC-07: Filter Configuration
**Priority:** Medium | **Status:** ✅ Ready to Test

**Steps:**
1. Click "Настройки отображения"
2. Expand "Настройки фильтра данных"
3. Adjust sliders (GPS speed, time gaps, etc.)
4. Verify data filters apply

**Expected Result:**
- All sliders functional
- Values update in real-time
- Data filters correctly
- Reset button works

---

### TC-08: High-Power Wheel Support (250V+)
**Priority:** High | **Status:** ✅ Ready to Test

**Steps:**
1. Load CSV from high-voltage wheel (>250V)
2. Check voltage display
3. Check power calculations

**Expected Result:**
- Voltage displays correctly (up to 400V)
- Speed limits up to 400 km/h
- Power up to 25kW displays correctly

---

### TC-09: Mobile Touch Gestures
**Priority:** Medium | **Status:** ✅ Ready to Test

**Steps:**
1. Open on mobile device
2. Test single finger pan
3. Test two-finger pinch zoom

**Expected Result:**
- Pan works with one finger
- Pinch zoom works
- No page scroll interference

---

### TC-10: Acceleration Analysis
**Priority:** Medium | **Status:** ✅ Ready to Test

**Steps:**
1. Load CSV with acceleration data
2. Check "Анализ ускорения" section
3. Verify 0-60, 0-100 times displayed

**Expected Result:**
- Acceleration times calculate correctly
- Table shows all thresholds
- Chart renders acceleration curve

---

## Test Results Log

| Test ID | Date | Tester | Result | Notes |
|---------|------|--------|--------|-------|
| TC-01 | - | - | ⏳ Pending | - |
| TC-02 | - | - | ⏳ Pending | - |
| TC-03 | - | - | ⏳ Pending | - |
| TC-04 | - | - | ⏳ Pending | - |
| TC-05 | - | - | ⏳ Pending | - |
| TC-06 | - | - | ⏳ Pending | - |
| TC-07 | - | - | ⏳ Pending | - |
| TC-08 | - | - | ⏳ Pending | - |
| TC-09 | - | - | ⏳ Pending | - |
| TC-10 | - | - | ⏳ Pending | - |

---

## Known Issues

None critical. Minor warnings:
- Chunk size >500KB (performance optimization needed for Phase 3)
- React Compiler warnings in AccelerationTable (non-critical)

---

## Sign-Off

**Tester:** _________________  **Date:** _________________

**Result:** ☐ Pass  ☐ Pass with Minor Issues  ☐ Fail

**Comments:**
_________________________________
_________________________________
_________________________________
