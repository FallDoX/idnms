---
description: Systematic visual and UI/UX review of web applications
---

# Visual Review Skill

Perform comprehensive visual analysis of web applications to identify design inconsistencies, accessibility issues, and UX improvements.

## Review Checklist

### 1. Visual Hierarchy & Typography
- [ ] Heading hierarchy (H1 → H2 → H3) is clear and consistent
- [ ] Font sizes follow a consistent scale
- [ ] Text contrast meets WCAG AA standards (4.5:1 for normal text)
- [ ] Line heights and spacing are consistent
- [ ] No orphaned text or widows in important labels

### 2. Color System
- [ ] Consistent color palette across all components
- [ ] Primary/secondary/accent colors used purposefully
- [ ] Sufficient contrast for all text on backgrounds
- [ ] Hover/focus states are visually distinct
- [ ] Error/success/warning colors are consistent

### 3. Spacing & Layout
- [ ] Consistent padding/margins (use 4px or 8px grid)
- [ ] Alignment is consistent (left, center, right)
- [ ] Component heights are uniform where appropriate
- [ ] Responsive breakpoints handled gracefully
- [ ] No overlapping or clipping elements

### 4. Component Consistency
- [ ] Buttons have consistent styling (size, radius, padding)
- [ ] Input fields share same height and styling
- [ ] Cards/boxes have consistent shadows/borders
- [ ] Icons are same style (line vs filled) and size within groups
- [ ] Tooltips/popovers behave consistently

### 5. Interactive Elements
- [ ] All interactive elements have hover states
- [ ] Focus states are visible for accessibility
- [ ] Loading states don't cause layout shift
- [ ] Transitions are consistent (duration, easing)
- [ ] No dead clicks or confusing interactions

### 6. Data Visualization
- [ ] Chart colors are distinguishable
- [ ] Labels are readable at all sizes
- [ ] Legends are clear and positioned logically
- [ ] Empty/zero states are handled gracefully
- [ ] Tooltips on charts are consistent with app tooltips

### 7. Mobile/Responsive
- [ ] Touch targets are minimum 44x44px
- [ ] Text is readable without zooming
- [ ] Horizontal scrolling is avoided
- [ ] Critical info is visible above the fold
- [ ] Navigation works on small screens

### 8. Polish & Details
- [ ] No broken images or icons
- [ ] No console errors affecting UI
- [ ] Scrollbars styled consistently (or hidden gracefully)
- [ ] Empty states have helpful messaging
- [ ] No layout shifts on load

## Output Format

```markdown
## Visual Review: [App Name]

### Summary Score: X/10

### Critical Issues (Fix Immediately)
1. **[Issue]** - Location: `file.tsx:line`
   - Impact: [Why it matters]
   - Fix: [Recommended solution]

### Medium Priority
1. **[Issue]** - Location
   - Impact
   - Fix

### Nice to Have
1. **[Suggestion]**
   - Rationale
   - Implementation idea

### Consistency Audit
| Element | Locations | Status |
|---------|-----------|--------|
| Tooltips | 5 places | ⚠️ Inconsistent sizes |
| Buttons | 12 places | ✅ Consistent |

### Color Palette Review
- Primary: `#xxx` - Good contrast ✅
- Secondary: `#xxx` - Too light on dark bg ⚠️

### Recommendations
1. [High impact, low effort suggestion]
2. [Medium impact suggestion]
```

## Usage

Run this review on:
1. Main dashboard/overview page
2. Data visualization pages
3. Settings/configuration pages
4. Mobile viewport (if applicable)
