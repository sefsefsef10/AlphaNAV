# Design Guidelines: NAV Lending Operations Platform

## Design Approach
**Selected System**: Carbon Design System (IBM) with modern financial SaaS influences  
**Justification**: This is a data-intensive B2B financial operations platform requiring professional reliability, complex table management, and dashboard capabilities. Carbon excels at enterprise data applications while maintaining clarity and usability.

**Key Influences**: Linear (for clean modern aesthetics), Stripe Dashboard (for financial data presentation), Notion (for flexible table interfaces)

**Design Principles**:
1. **Clarity over decoration** - Every element serves a functional purpose
2. **Data density with breathing room** - Pack information efficiently without overwhelming
3. **Consistent patterns** - Reduce cognitive load through predictable interactions
4. **Professional trust** - Visual design reflects financial sector credibility

---

## Core Design Elements

### A. Color Palette

**Dark Mode Primary** (default):
- Background: `222 10% 10%` (near-black with subtle warmth)
- Surface: `222 10% 14%` (elevated panels)
- Surface Elevated: `222 10% 18%` (cards, modals)
- Border: `222 10% 25%` (subtle divisions)

**Light Mode**:
- Background: `220 15% 97%`
- Surface: `0 0% 100%`
- Surface Elevated: `220 15% 99%`
- Border: `220 10% 88%`

**Brand Colors**:
- Primary: `220 90% 56%` (professional blue - trust and stability)
- Primary Hover: `220 90% 48%`
- Success: `142 76% 36%` (compliance met, positive metrics)
- Warning: `38 92% 50%` (attention needed)
- Danger: `0 84% 60%` (covenant breaches, critical alerts)

**Data Visualization Palette** (for charts/graphs):
- Series 1: `220 90% 56%`
- Series 2: `280 65% 60%`
- Series 3: `160 60% 45%`
- Series 4: `30 85% 55%`
- Series 5: `200 70% 50%`

**Text Colors (Dark Mode)**:
- Primary: `0 0% 95%`
- Secondary: `0 0% 70%`
- Tertiary: `0 0% 50%`

### B. Typography

**Font Families**:
- Primary: 'Inter' (Google Fonts) - body text, UI elements, data tables
- Monospace: 'JetBrains Mono' (Google Fonts) - financial figures, IDs, codes

**Type Scale**:
- Display: 32px / font-bold / tracking-tight (dashboard headers)
- H1: 24px / font-semibold (page titles)
- H2: 20px / font-semibold (section headers)
- H3: 16px / font-medium (card headers)
- Body: 14px / font-normal / leading-relaxed (default)
- Small: 12px / font-normal (metadata, captions)
- Tiny: 11px / font-medium / tracking-wide / uppercase (labels, badges)

**Financial Data Typography**:
- Use tabular numbers (font-variant-numeric: tabular-nums)
- Monospace font for currency values and percentages
- Right-align numerical columns in tables

### C. Layout System

**Spacing Primitives**: Use Tailwind units of **1, 2, 3, 4, 6, 8, 12, 16, 24**
- Compact spacing (1, 2) for table cells, tight UI
- Standard spacing (4, 6) for form fields, card padding
- Generous spacing (8, 12, 16) for section separation
- Major spacing (24) for page-level divisions

**Grid System**:
- 12-column grid for main layouts
- Dashboard uses 24-column for flexibility
- Sidebar: Fixed 240px (collapsed: 64px icon-only)
- Main content: min-w-0 flex-1 (fluid)
- Max content width: 1600px (accommodates wide tables)

### D. Component Library

**Navigation**:
- Top bar: 64px height, surface elevated background
- Left sidebar: Collapsible, icon + label format
- Breadcrumbs: Use for deep navigation (secondary text, separator: `/`)

**Data Tables (Critical Component)**:
- Header: Sticky, surface background, 48px row height
- Body rows: 44px height, hover state with subtle background shift
- Borders: Horizontal only (lighter weight than full grid)
- Actions: Right-aligned, icon buttons appear on row hover
- Pagination: Bottom-aligned, show 10/25/50/100 options
- Sortable headers: Arrow indicators, click to toggle
- Filters: Dropdown above table, chip display for active filters

**Cards**:
- Standard: 16px padding, rounded-lg, border or subtle shadow
- Elevated: 20px padding, rounded-xl, stronger shadow
- Stat cards: Icon top-left, large number display, trend indicator

**Forms**:
- Input height: 40px
- Label: Above input, 12px font-medium, mb-2
- Dark mode inputs: Background `222 10% 18%`, border `222 10% 30%`
- Focus state: Primary color border, subtle ring
- Error state: Danger color border, helper text below

**Buttons**:
- Primary: Filled with primary color, 40px height, medium font-weight
- Secondary: Outline with border, transparent background
- Ghost: No border, subtle hover background
- Icon buttons: 40px square, rounded-lg
- Button groups: Connected with borders, no gap

**Dashboard Widgets**:
- KPI Cards: Large number, label, trend arrow/percentage, sparkline chart
- Chart containers: White/surface background, 16px padding, title + controls
- Alert banners: Left border accent (4px width), icon, dismiss button

**Document Upload**:
- Drag-and-drop zone: Dashed border, hover state with primary tint
- File list: Icon + name + size + status badge + remove action
- Progress bars: Primary color fill, percentage overlay

**Modals/Dialogs**:
- Overlay: backdrop-blur-sm with dark/light tint
- Container: Max-width 600px (small), 900px (large), 1200px (xlarge for tables)
- Header: 64px with title and close button
- Footer: Right-aligned actions, cancel + confirm pattern

**Badges & Status**:
- Pill shape (rounded-full), px-3 py-1
- Colors match semantic meaning (success, warning, danger)
- Status dots: 8px circle, inline with text

**Charts & Visualizations**:
- Use Recharts or Chart.js libraries
- Line charts: 2px stroke, smooth curves, gradient fill optional
- Bar charts: 8px border-radius on top corners
- Grid lines: Subtle, dashed, low opacity
- Tooltips: Dark card with white text, arrow pointer

### E. Interactions & Animations

**Minimal Animation Philosophy**:
- Transitions: 150ms for micro-interactions (hover, focus)
- Page transitions: None (instant for data-heavy apps)
- Loading states: Skeleton screens for tables, spinner for actions
- Hover states: Subtle background color shift (5-10% opacity change)

**NO animations for**:
- Page loads
- Section reveals
- Scroll effects
- Hero elements (this is an operations platform, not marketing)

---

## Layout Patterns

**Dashboard Layout**:
- Top: Metric summary cards in 4-column grid (lg:grid-cols-4 md:grid-cols-2)
- Middle: Charts in 2-column grid (lg:grid-cols-2)
- Bottom: Recent activity table (full-width)

**Table/Deal Flow Layout**:
- Full-width table with horizontal scroll
- Filters bar above (sticky)
- Bulk actions toolbar (appears when rows selected)

**Detail Pages** (Loan/Fund details):
- Left: 2/3 width main content (metrics, timeline, documents)
- Right: 1/3 width sidebar (quick actions, related items, activity feed)

**Form Layouts**:
- Single column for simplicity, max-width 600px
- Group related fields with section headers
- Sticky footer for submit/cancel actions

---

## Accessibility & Polish

- Focus indicators: 2px ring with primary color, 4px offset
- Keyboard navigation: Full support, visible focus states
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Dark mode default with light mode toggle (icon in top bar)
- All form fields have associated labels (no placeholders-only)
- Error messages appear below fields with danger color
- Loading states prevent interaction (disabled buttons, overlay)

---

## Images & Iconography

**Icons**: Font Awesome (duotone style for visual interest in financial context)
- Navigation: 20px size
- Buttons: 16px size
- Table actions: 18px size
- Status indicators: 14px size

**Images**: Not applicable - this is a data operations platform with minimal image usage. Any brand logo should be SVG, placed in top-left of navigation.

**No hero images** - This is an internal operations tool, not a marketing site.