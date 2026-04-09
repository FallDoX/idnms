# Testing

## Testing Overview

The project has minimal automated testing infrastructure. Testing is primarily manual through visual regression tests and manual test scripts.

## Visual Regression Testing

### Playwright Tests

**File:** `visual-test.py` (Python)

**Framework:** Playwright (Python)

**Purpose:** Visual regression testing for UI consistency across viewports

**Viewports Tested:**
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x667

**Test Flow:**
1. Launches dev server (`npm run dev`)
2. Navigates to local URL
3. Captures screenshots for each viewport
4. Compares against baseline (if exists)
5. Saves screenshots to output directory

**Usage:**
```bash
python visual-test.py
```

**Limitations:**
- Manual execution required
- No CI/CD integration
- No automated diff reporting
- Baseline management manual

## Manual Test Scripts

### Location

**Directory:** `src/tests/`

**Test Files:**
- `analyze-distance.mjs` - Distance calculation analysis
- `analyze-gps.mjs` - GPS data analysis
- `analyze-logs.mjs` - Log data analysis
- `test-distance.mjs` - Distance calculation tests
- `user-tests.mjs` - User-defined test scenarios

**Format:** JavaScript (MJS) modules

**Purpose:** Manual validation of data processing logic

**Usage:**
```bash
node src/tests/analyze-distance.mjs
node src/tests/test-distance.mjs
```

**Limitations:**
- No automated assertions
- No test framework (Jest, Vitest, etc.)
- Manual execution and verification
- No coverage reporting

## Demo Data Generation

### Script

**File:** `generate-enhanced-demo.cjs`

**Purpose:** Generates synthetic CSV data for testing

**Usage:**
```bash
node generate-enhanced-demo.cjs
```

**Output:** Creates demo CSV file with realistic trip data

**Features:**
- Simulates realistic EUC telemetry
- Includes acceleration phases
- GPS coordinates
- Sensor data variations

## Test Data

### Location

**Directory:** `data/`

**Files:**
- `demo-trip.csv` - Demo trip log for application testing

**Usage:**
- Loaded via "Load Demo Trip" button in app
- Used for manual testing and development
- Included in production build

## Unit Testing

### Status: None

**No unit test framework configured:**
- No Jest
- No Vitest
- No Mocha
- No testing library in dependencies

**No test files in src:**
- No `*.test.ts` or `*.test.tsx` files
- No `*.spec.ts` or `*.spec.tsx` files

**Recommendation:** Add Vitest for unit testing React components and utility functions

## Integration Testing

### Status: None

**No integration tests:**
- No E2E test framework (Cypress, Playwright E2E)
- No API testing (no external APIs)
- No database testing (no database)

## Code Quality Tools

### ESLint

**Config:** `eslint.config.js` (flat config)

**Rules:**
- TypeScript ESLint recommended
- React Hooks rules
- React Refresh rules

**Usage:**
```bash
npm run lint
```

**Coverage:** Lints all TypeScript files in project

**Limitations:**
- No test coverage integration
- No pre-commit hooks
- Manual execution only

### TypeScript Type Checking

**Config:** Multiple tsconfig files

**Usage:**
```bash
npm run build
```

**Type Safety:**
- Strict type checking enabled
- No implicit any
- All files must compile

**Limitations:**
- Type errors only caught at build time
- No watch mode for development

## Manual Testing Practices

### Browser Testing

**Browsers Tested:**
- Chrome (primary)
- Firefox
- Safari (iOS)
- Edge

**Devices Tested:**
- Desktop (Windows/Mac)
- Laptop
- Tablet (iPad/Android)
- Mobile (iPhone/Android)

### CSV Format Testing

**Formats Tested:**
- Old format: Single timestamp column
- New format: Separate date/time columns with extended sensors

**Edge Cases:**
- Empty files
- Corrupted data
- Missing columns
- Invalid dates
- Large files (>10MB)

## Testing Gaps

### Missing Automated Tests

**Unit Tests:**
- Parser functions (`parseTripData`, `calculateSummary`)
- Utility functions (`downsample`, `filterData`)
- Component rendering
- State management

**Integration Tests:**
- CSV upload to visualization flow
- Chart interactions
- Acceleration calculations
- Data filtering pipeline

**E2E Tests:**
- Full user journey (upload → analyze → export)
- Cross-browser compatibility
- Mobile responsiveness

### Missing Test Infrastructure

**No CI/CD:**
- No automated test runs on PR
- No pre-merge validation
- No deployment gates

**No Coverage Reporting:**
- No code coverage metrics
- No coverage thresholds
- No coverage trend tracking

**No Mocking:**
- No test mocks for external dependencies
- No test data factories
- No fixture management

## Recommendations

### Immediate Improvements

1. **Add Vitest** for unit testing:
   - Test utility functions in `src/utils/`
   - Test component rendering
   - Test parser logic

2. **Add React Testing Library**:
   - Test component interactions
   - Test user flows
   - Test accessibility

3. **Add Pre-commit Hooks**:
   - Run lint on staged files
   - Run type check
   - Prevent broken commits

### Medium-term Improvements

1. **Add E2E Testing**:
   - Playwright or Cypress
   - Test critical user journeys
   - Cross-browser testing

2. **Add Coverage Reporting**:
   - Configure coverage thresholds
   - Add coverage badges
   - Track coverage trends

3. **Add CI/CD Integration**:
   - GitHub Actions or similar
   - Automated test runs
   - Deployment gates

### Long-term Improvements

1. **Add Visual Regression CI**:
   - Integrate `visual-test.py` into CI
   - Automated diff detection
   - Baseline management

2. **Add Performance Testing**:
   - Lighthouse integration
   - Bundle size monitoring
   - Load time tracking

3. **Add Accessibility Testing**:
   - Axe-core integration
   - A11y compliance checks
