# Ostora Design System - Black & White Premium UI

## Overview
Minimalist, premium design system inspired by Apple's aesthetic with strict black & white color palette.

## Color Palette

### Primary Colors
- **Black**: `#000000` - Primary actions, headings
- **White**: `#FFFFFF` - Backgrounds, light elements

### Gray Scale (Depth & Hierarchy)
- `gray-50`: `#FAFAFA` - Page backgrounds
- `gray-100`: `#F5F5F5` - Subtle backgrounds
- `gray-200`: `#E5E5E5` - Borders, dividers
- `gray-300`: `#D4D4D4` - Disabled states
- `gray-400`: `#A3A3A3` - Placeholders, captions
- `gray-500`: `#737373` - Secondary text
- `gray-600`: `#525252` - Body text
- `gray-700`: `#404040` - Subheadings
- `gray-800`: `#262626` - Dark backgrounds
- `gray-900`: `#171717` - Primary text (softer than pure black)

## Typography

### Font Families
- **Primary**: Inter (Google Fonts)
- **Display**: Satoshi (optional, fallback to Inter)

### Font Sizes
- `display-lg`: 48px / 700 / -0.02em - Hero headings
- `display-md`: 36px / 700 / -0.01em - Section headings
- `display-sm`: 24px / 600 / -0.01em - Card headings
- `body-lg`: 18px / 400 / 1.6 - Large body text
- `body`: 16px / 400 / 1.5 - Default body text
- `body-sm`: 14px / 400 / 1.5 - Small text
- `caption`: 12px / 500 / 0.02em - Labels (uppercase)

### Best Practices
- Use **gray-900** for main text (not pure black)
- Use **negative letter-spacing** for large headings
- Use **positive letter-spacing** for small caps
- Line-height: **1.5-1.6** for readability

## Components

### Cards
```tsx
// Standard card with hover effect
<div className="card">Content</div>

// Flat card without hover
<div className="card-flat">Content</div>

// Overlapping card effect
<div className="card-overlay">Content</div>
```

**Specs:**
- Border radius: 20px
- Padding: 32px (8) / 24px (6)
- Shadow: Soft (0.05-0.08 opacity)
- Hover: translateY(-4px) + stronger shadow

### Buttons
```tsx
// Primary (Black)
<button className="btn-primary">Action</button>

// Secondary (White with border)
<button className="btn-secondary">Action</button>

// Ghost (Transparent)
<button className="btn-ghost">Action</button>
```

**Specs:**
- Border radius: 12px
- Padding: 12px 24px
- Hover: scale(1.02)
- Transition: 200ms

### Inputs
```tsx
<input className="input" />
<input className="input input-error" />
```

**Specs:**
- Border radius: 10px
- Padding: 12px 16px
- Focus: 2px black outline

### Badges
```tsx
<span className="badge">Label</span>
<span className="badge-dark">Featured</span>
```

## Layout

### Container
```tsx
<div className="container-app">
  {/* Max-width: 1280px, padding: 24px */}
</div>
```

### Asymmetric Grid
```tsx
<div className="grid-asymmetric">
  <div>Main content (1.2fr)</div>
  <div>Sidebar (0.8fr)</div>
</div>
```

## Spacing System (8px Grid)
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-5`: 24px
- `space-6`: 32px
- `space-7`: 48px
- `space-8`: 64px
- `space-9`: 96px

## Icons
- **Library**: Heroicons (outline style)
- **Stroke width**: 1.5px (thin, elegant)
- **Size**: 20-24px for UI icons
- **Color**: Inherit from parent

## Shadows
```css
/* Soft shadow for cards */
shadow-soft: 0 1px 3px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.08)

/* Hover shadow */
shadow-soft-hover: 0 4px 6px rgba(0,0,0,0.07), 0 20px 60px rgba(0,0,0,0.12)

/* Inner shadow */
shadow-inner-soft: inset 0 2px 4px rgba(0,0,0,0.06)
```

## Animations

### Transitions
- **Default**: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- **Fast**: 200ms (buttons, inputs)
- **Slow**: 400ms (page transitions)

### Micro-interactions
- **Hover scale**: scale(1.02)
- **Hover lift**: translateY(-4px)
- **Active**: scale(0.98)

## Usage Examples

### Job Card
```tsx
<article className="card-flat hover:shadow-soft hover:-translate-y-1">
  <div className="icon-wrapper">
    <svg className="w-6 h-6" />
  </div>
  <h3 className="text-display-sm">Job Title</h3>
  <p className="text-body text-gray-600">Company Name</p>
  <div className="flex gap-2">
    <span className="badge">Remote</span>
    <span className="badge">Full-time</span>
  </div>
</article>
```

### Navigation Link
```tsx
<Link href="/path" className="nav-link">
  Link Text
</Link>

<Link href="/path" className="nav-link-active">
  Active Link
</Link>
```

### Form Field
```tsx
<div>
  <label className="block text-body-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input
    type="email"
    className="input"
    placeholder="you@example.com"
  />
</div>
```

## Best Practices

### DO ✅
- Use gray-50 for backgrounds (not pure white)
- Use gray-900 for text (not pure black)
- Use generous whitespace (32-48px between sections)
- Use asymmetrical layouts for modern feel
- Use thin stroke icons (1.5px)
- Use subtle shadows (low opacity)
- Use scale(1.02) for hover effects
- Use 8px spacing grid

### DON'T ❌
- Don't use bright colors
- Don't use heavy shadows
- Don't use pure black (#000) for text
- Don't use pure white (#FFF) for backgrounds
- Don't clutter the UI
- Don't use equal grid columns (use 1.2fr + 0.8fr)
- Don't use thick stroke icons

## Accessibility
- Focus states: 2px black outline with 2px offset
- Contrast ratio: WCAG AA compliant
- Touch targets: Minimum 44x44px
- Keyboard navigation: Full support

## Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Wide: > 1280px
