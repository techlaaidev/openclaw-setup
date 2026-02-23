# OpenClaw Web Dashboard - Design Guidelines

**Version:** 1.0
**Last Updated:** 2026-02-23
**Design Style:** Refined Minimalism, Professional Dashboard

---

## Design Philosophy

OpenClaw Web Dashboard follows a **refined minimalist** approach with a focus on:
- **Clarity**: Data-first design with clear visual hierarchy
- **Professionalism**: Business-appropriate aesthetics without playful elements
- **Consistency**: Systematic use of colors, spacing, and typography
- **Smoothness**: Subtle animations that enhance UX without distraction
- **Accessibility**: WCAG AA compliance with high contrast ratios

**Key Constraints:**
- ❌ No gradients
- ❌ No emojis in UI
- ✅ Smooth animations (250-300ms)
- ✅ Fully responsive
- ✅ Primary color: #B0383A (burgundy red)

---

## Color System

### Primary Color: Burgundy Red

The primary color #B0383A is used strategically for:
- Primary action buttons
- Active navigation states
- Important status indicators
- Accent bars on cards
- Focus states

**Primary Scale:**
```css
primary-50:  #FEF2F2  /* Lightest backgrounds */
primary-100: #FEE2E2  /* Light backgrounds */
primary-200: #FECACA  /* Subtle accents */
primary-300: #FCA5A5  /* Hover states */
primary-400: #F87171  /* Lighter interactive */
primary-500: #B0383A  /* Main brand color */
primary-600: #8B2C2E  /* Button hover */
primary-700: #6B2123  /* Pressed states */
primary-800: #4A1719  /* Dark accents */
primary-900: #2D0E0F  /* Darkest */
```

### Neutral Grays

Used for text, backgrounds, borders, and UI elements:

```css
gray-50:  #F9FAFB  /* Page background */
gray-100: #F3F4F6  /* Card background alt */
gray-200: #E5E7EB  /* Borders */
gray-300: #D1D5DB  /* Disabled states */
gray-400: #9CA3AF  /* Placeholder text */
gray-500: #6B7280  /* Secondary text */
gray-600: #4B5563  /* Body text */
gray-700: #374151  /* Headings */
gray-800: #1F2937  /* Dark text */
gray-900: #111827  /* Darkest text */
```

### Semantic Colors

```css
/* Success - Green */
success:       #10B981
success-light: #D1FAE5

/* Warning - Amber */
warning:       #F59E0B
warning-light: #FEF3C7

/* Error - Red */
error:         #EF4444
error-light:   #FEE2E2

/* Info - Blue */
info:          #3B82F6
info-light:    #DBEAFE
```

### Color Usage Guidelines

**Backgrounds:**
- Main page: `gray-50`
- Cards: `white` with subtle shadow
- Sidebar: `white` or `gray-900` (dark mode)
- Active nav: `primary-50` with `primary-500` accent

**Text:**
- Headings: `gray-700` to `gray-900`
- Body text: `gray-600`
- Secondary text: `gray-500`
- Placeholder: `gray-400`

**Borders:**
- Default: `gray-200`
- Focus: `primary-500`
- Error: `error`

---

## Typography

### Font Families

**Display/Headings: Manrope**
- Geometric, modern, excellent readability
- Weights: 400, 500, 600, 700, 800
- Use for: Page titles, section headings, card titles

**Body/Interface: DM Sans**
- Neutral, highly legible at small sizes
- Weights: 400, 500, 600, 700
- Use for: Body text, buttons, labels, form inputs

**Monospace: JetBrains Mono** (for code/logs)
- Use for: Log viewer, code snippets, terminal output

### Font Scale

```css
text-xs:   12px / 0.75rem   /* Small labels, captions */
text-sm:   14px / 0.875rem  /* Secondary text, badges */
text-base: 16px / 1rem      /* Body text, inputs */
text-lg:   18px / 1.125rem  /* Card titles */
text-xl:   20px / 1.25rem   /* Section headings */
text-2xl:  24px / 1.5rem    /* Page titles */
text-3xl:  30px / 1.875rem  /* Hero headings */
text-4xl:  36px / 2.25rem   /* Large displays */
```

### Typography Hierarchy

**Page Titles:**
- Size: `text-2xl` to `text-3xl`
- Weight: `font-bold` (700)
- Color: `gray-900`
- Font: Manrope

**Section Headings:**
- Size: `text-xl` to `text-2xl`
- Weight: `font-semibold` (600)
- Color: `gray-800`
- Font: Manrope

**Card Titles:**
- Size: `text-lg` to `text-xl`
- Weight: `font-semibold` (600)
- Color: `gray-700`
- Font: Manrope

**Body Text:**
- Size: `text-base`
- Weight: `font-normal` (400)
- Color: `gray-600`
- Font: DM Sans

**Small Labels:**
- Size: `text-sm`
- Weight: `font-medium` (500)
- Color: `gray-500`
- Font: DM Sans

---

## Spacing System

Based on **8pt grid** for consistency:

```css
0:  0px    /* No spacing */
1:  4px    /* Minimal spacing */
2:  8px    /* Tight spacing */
3:  12px   /* Small spacing */
4:  16px   /* Base spacing */
5:  20px   /* Medium spacing */
6:  24px   /* Card padding */
8:  32px   /* Section spacing */
10: 40px   /* Large spacing */
12: 48px   /* Extra large */
16: 64px   /* Hero spacing */
20: 80px   /* Maximum spacing */
```

### Spacing Guidelines

**Card Padding:** `p-6` (24px)
**Section Gaps:** `gap-6` to `gap-8` (24-32px)
**Button Padding:** `px-6 py-3` (24px x 12px)
**Input Padding:** `px-4 py-2` (16px x 8px)
**Page Padding:** `p-6` to `p-8` (24-32px)

---

## Layout System

### Dashboard Layout

**Structure:**
```
┌─────────────┬──────────────────────────┐
│   Sidebar   │      Main Content        │
│   (260px)   │    (max-width: 1280px)   │
│             │                          │
│  Navigation │   Page Content           │
│             │                          │
│  User Info  │                          │
└─────────────┴──────────────────────────┘
```

**Sidebar:**
- Width: `260px` (fixed on desktop)
- Collapsible to icon-only: `72px`
- Background: `white`
- Border: `1px solid gray-200`

**Main Content:**
- Max-width: `max-w-7xl` (1280px)
- Padding: `p-6` to `p-8`
- Background: `gray-50`

### Grid System

**Dashboard Cards:**
```css
/* Desktop: 3 columns */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6

/* Stat Cards: 4 columns */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
gap-4
```

**Form Layouts:**
```css
/* Two-column forms */
grid-cols-1 md:grid-cols-2
gap-6
```

### Responsive Breakpoints

```css
sm:  640px   /* Mobile landscape */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large */
```

**Mobile Strategy:**
- Single column layouts
- Sidebar converts to overlay/hamburger
- Reduced padding and spacing
- Touch-friendly button sizes (min 44px)

---

## Components

### Buttons

**Primary Button:**
```jsx
<button className="btn btn-primary">
  Primary Action
</button>
```
- Background: `primary-500`
- Text: `white`
- Padding: `px-6 py-3`
- Border-radius: `rounded-lg` (8px)
- Hover: `primary-600` + shadow elevation
- Active: `primary-700` + scale 0.98

**Secondary Button:**
```jsx
<button className="btn btn-secondary">
  Secondary Action
</button>
```
- Background: `transparent`
- Border: `2px solid gray-300`
- Text: `gray-700`
- Hover: `gray-50` background

**Ghost Button:**
```jsx
<button className="btn btn-ghost">
  Ghost Action
</button>
```
- Background: `transparent`
- Text: `gray-600`
- Hover: `gray-100` background

### Cards

**Standard Card:**
```jsx
<div className="card">
  <h3 className="text-lg font-semibold text-gray-800">Card Title</h3>
  <p className="text-gray-600">Card content...</p>
</div>
```
- Background: `white`
- Border-radius: `rounded-xl` (12px)
- Padding: `p-6` (24px)
- Shadow: `shadow-sm`
- Hover: `shadow-md` elevation

**Stat Card with Accent:**
```jsx
<div className="card border-l-4 border-primary-500">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">Metric Name</p>
      <p className="text-2xl font-bold text-gray-900">1,234</p>
    </div>
    <div className="p-3 bg-primary-100 rounded-lg">
      <Icon className="w-6 h-6 text-primary-500" />
    </div>
  </div>
</div>
```

### Form Inputs

**Text Input:**
```jsx
<input
  type="text"
  className="input"
  placeholder="Enter text..."
/>
```
- Height: `h-10` (40px)
- Border: `1px solid gray-300`
- Border-radius: `rounded-lg` (8px)
- Padding: `px-4`
- Focus: `primary-500` border + `primary-50` background

**Select/Dropdown:**
```jsx
<select className="input">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```
- Same styling as text input
- Chevron icon on right

### Badges

**Status Badge:**
```jsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Error</span>
```
- Padding: `px-2.5 py-0.5`
- Border-radius: `rounded-full`
- Font-size: `text-xs`
- Font-weight: `font-medium`

---

## Animations & Transitions

### Timing Functions

```css
transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1)
transition-base:   200ms cubic-bezier(0.4, 0, 0.2, 1)
transition-smooth: 300ms cubic-bezier(0.4, 0, 0.1, 1)
```

### Common Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 300ms ease-out;
```

**Slide In:**
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: slideIn 300ms ease-out;
```

**Shimmer (Loading):**
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
animation: shimmer 2s infinite linear;
```

### Interaction Guidelines

**Button Hover:**
- Duration: 150ms
- Scale: 1.02 (subtle)
- Shadow: Elevation increase
- Color: Darken by one shade

**Card Hover:**
- Duration: 200ms
- Shadow: `shadow-sm` → `shadow-md`
- No scale (maintains layout)

**Page Transitions:**
- Duration: 300ms
- Effect: Fade + slight slide up (10px)
- Stagger: 50ms delay for list items

---

## Accessibility

### Contrast Ratios

**Text Contrast (WCAG AA):**
- Large text (18px+): 3:1 minimum
- Normal text: 4.5:1 minimum
- Primary color on white: 5.2:1 ✓

**Interactive Elements:**
- Focus indicators: 3:1 minimum
- Use `ring-2 ring-primary-500` for focus states

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Visible focus states on all focusable elements
- Logical tab order
- Skip links for main content

### Screen Readers

- Semantic HTML elements
- ARIA labels where needed
- Alt text for all images
- Status announcements for dynamic content

---

## Best Practices

### Do's ✅

- Use primary color sparingly for emphasis
- Maintain consistent spacing (8pt grid)
- Provide visual feedback for all interactions
- Use semantic colors for status (green=success, red=error)
- Keep animations subtle and smooth (250-300ms)
- Test on multiple screen sizes
- Ensure sufficient color contrast

### Don'ts ❌

- Don't use gradients
- Don't use emojis in UI
- Don't overuse primary color (causes fatigue)
- Don't use red for non-critical elements
- Don't create jarring animations (>400ms)
- Don't rely on color alone for information
- Don't use low-contrast text

---

## Implementation Notes

### Tailwind Configuration

The design system is implemented in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { /* burgundy red scale */ },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 300ms ease-out',
        slideIn: 'slideIn 300ms ease-out',
        shimmer: 'shimmer 2s infinite linear',
      }
    }
  }
}
```

### Utility Classes

Custom utility classes in `src/styles/index.css`:

```css
.card { /* Card styling */ }
.btn { /* Base button */ }
.btn-primary { /* Primary button */ }
.btn-secondary { /* Secondary button */ }
.btn-ghost { /* Ghost button */ }
.input { /* Form input */ }
.badge { /* Status badge */ }
```

---

## Design Rationale

### Why Burgundy Red (#B0383A)?

- **Professional**: Conveys authority and importance
- **Distinctive**: Stands out from common blue/purple dashboards
- **Attention**: Draws focus to primary actions
- **Balanced**: Not too bright, not too dark

### Why No Gradients?

- **Clarity**: Solid colors are easier to read
- **Performance**: Simpler rendering
- **Consistency**: Easier to maintain
- **Modern**: Aligns with current design trends

### Why Refined Minimalism?

- **Focus**: Reduces cognitive load
- **Efficiency**: Users can find information quickly
- **Scalability**: Easy to add features without clutter
- **Timeless**: Won't look dated quickly

---

## Future Considerations

### Dark Mode

When implementing dark mode:
- Invert gray scale (900 → 50)
- Reduce primary color saturation
- Use `gray-900` for backgrounds
- Maintain contrast ratios

### Theming

The design system supports theming by:
- Using CSS variables for colors
- Maintaining consistent spacing/typography
- Allowing color palette swaps
- Keeping semantic color meanings

---

**Version History:**
- v1.0 (2026-02-23): Initial design system implementation

**Maintained by:** OpenClaw Team
**Questions?** Refer to component examples in `/frontend/src/components/`
