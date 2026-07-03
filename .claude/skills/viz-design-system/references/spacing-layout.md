# Spacing and Layout System Reference

## The 8pt Grid

The industry standard used by Apple (HIG), Google (Material Design), and most design systems.

### Why 8pt
- Divides evenly into common screen sizes (320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920)
- Creates visual rhythm — consistent spacing feels "right" even when viewers can't articulate why
- Simplifies decision-making — instead of choosing from infinite values, pick from a defined scale
- 4pt is the sub-unit for fine adjustments (icon padding, badge positioning, border offsets)

### The Scale
```
4px   — micro (icon padding, fine adjustments)
8px   — tight (related element gaps, inline spacing)
12px  — compact (form field gaps, list item spacing)
16px  — default (paragraph spacing, card padding on mobile)
24px  — comfortable (card padding desktop, between form groups)
32px  — spacious (between content blocks within a section)
48px  — section-internal (major breaks within a section)
64px  — section gap (between distinct page sections, mobile)
96px  — section gap (between distinct page sections, desktop)
128px — hero breathing room (generous section breaks)
```

### CSS Custom Properties for the Scale
```css
:root {
  --space-1:  4px;    /* 0.25rem */
  --space-2:  8px;    /* 0.5rem  */
  --space-3:  12px;   /* 0.75rem */
  --space-4:  16px;   /* 1rem    */
  --space-6:  24px;   /* 1.5rem  */
  --space-8:  32px;   /* 2rem    */
  --space-12: 48px;   /* 3rem    */
  --space-16: 64px;   /* 4rem    */
  --space-24: 96px;   /* 6rem    */
  --space-32: 128px;  /* 8rem    */
}
```

### Internal vs External Rule
A component's internal padding must always be LESS THAN OR EQUAL TO its external margin.
This creates the visual distinction between "things that belong together" (tight internal)
and "things that are separate" (spacious external).

Example:
- Card internal padding: 24px
- Gap between cards: 32px
- Section containing cards to next section: 96px

This three-tier nesting (internal < gap < section) is what gives layouts hierarchy
without needing visual dividers or borders.

---

## Responsive Breakpoints

### Standard breakpoints (mobile-first with min-width)
```css
/* Default (mobile first) — 0px+ */
/* sm: 640px — large phones, small tablets */
/* md: 768px — tablets */
/* lg: 1024px — small laptops, landscape tablets */
/* xl: 1280px — laptops and desktops */
/* 2xl: 1536px — large desktops */
```

### How to think about breakpoints
- Mobile-first means writing CSS for mobile, then adding `min-width` media queries for larger screens
- Content dictates breakpoints, not devices. If a layout breaks at 920px, add a breakpoint at 920px
- Standard breakpoints are starting points, not prisons
- Most sites only need 3 active breakpoints: mobile default, tablet (~768px), desktop (~1280px)
- Avoid "breakpoint bloat" — every breakpoint adds complexity. Justify each one with a real layout need

### Breakpoint naming convention
Name breakpoints by size category, not device type. "tablet" becomes meaningless as
device sizes evolve. "md" stays stable because it refers to a range, not a product.

---

## Container and Content Width

### Max-width strategy
```css
.container {
  max-width: 1280px;    /* Content never wider than this */
  margin: 0 auto;       /* Centered */
  padding: 0 16px;      /* Mobile gutter */
}

@media (min-width: 768px) {
  .container { padding: 0 24px; }  /* Tablet gutter */
}

@media (min-width: 1280px) {
  .container { padding: 0 32px; }  /* Desktop gutter */
}
```

### Common max-width values
```
640px  — narrow content (blog posts, long-form reading)
768px  — medium content (forms, settings panels)
1024px — wide content (dashboards, data-dense layouts)
1280px — standard container (most marketing sites)
1440px — wide container (e-commerce, portfolio sites)
```

### Text content width
Body text containers should max out at `65ch` (about 65 characters per line).
45-75 characters is the readable range. Below 45 feels cramped. Above 75, the eye loses
its place returning to the next line.

For headings: wider is fine — display text reads differently than body copy.

### Full-bleed vs contained
- Hero sections, background colors, and images: full viewport width
- Text content, forms, cards: contained within max-width
- Some sections use a wider container for visual layouts (e.g., 3-column features) but narrower for text-heavy content
- Pattern: outer wrapper is full-bleed (for backgrounds), inner wrapper is contained (for content)

---

## Grid System

### 12-column grid
- Desktop: 12 columns, 24px gutters
- Tablet: 8 columns, 16px gutters (or 12 with adjusted widths)
- Mobile: 4 columns, 16px gutters
- Common layouts: 12 (full), 6+6 (halves), 4+4+4 (thirds), 8+4 (content+sidebar), 3+3+3+3 (quarters)

### CSS Grid implementation
```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6); /* 24px */
}

@media (max-width: 767px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4); /* 16px */
  }
}
```

### CSS Grid vs Flexbox decision guide
- **Grid**: 2D layouts (rows AND columns), page-level structure, equal-height cards, complex overlaps
- **Flexbox**: 1D layouts (row OR column), component-level alignment, navbar items, button groups
- Both are valid. Grid for the skeleton, Flexbox for the organs.
- When in doubt: if items need to align both horizontally AND vertically with siblings, use Grid

---

## Mobile-First Layout Patterns

### Thumb Zone Design
75% of users interact with phones using one thumb.
- Natural zone (bottom center): Most comfortable taps
- Stretch zone (sides, upper-middle): Possible but slower
- Hard-to-reach zone (top corners): Requires grip change

Place primary actions in the natural zone. Navigation and secondary actions can live
in the stretch zone. Avoid placing critical interactions in top corners.

### Mobile-specific layout rules
- Stack all multi-column layouts into single column below 768px
- Primary CTA in thumb zone (bottom area) or sticky at bottom
- Touch targets minimum 44x44px (WCAG 2.2), recommended 48x48px
- Minimum 8px gap between touch targets to prevent mis-taps
- Bottom navigation bar for primary actions (reduces thumb travel)
- Sticky header: keep it thin (56-64px max) to preserve content space
- Collapsible/accordion for secondary content — saves vertical space without hiding it
- Swipeable cards for browsable content (100ms swipe vs 500ms find-and-tap)

### Section spacing on mobile
Reduce section gaps proportionally:
- Desktop 96px sections → Mobile 64px
- Desktop 128px sections → Mobile 80px
- Desktop 48px internal → Mobile 32px
- Never compress below 32px between sections — it loses the breathing room

### Responsive spacing with clamp()
Instead of breakpoint-based spacing jumps, use fluid spacing:
```css
section {
  padding-block: clamp(48px, 8vw, 96px);
}

h1 {
  margin-bottom: clamp(16px, 3vw, 32px);
}
```
This creates smooth scaling between mobile and desktop without hard breakpoints.

---

## Container Queries (Production-Ready 2025+)

Container queries let components respond to their CONTAINER size, not the viewport.
Use alongside media queries for different concerns:
- **Media queries**: page layout decisions (grid columns, navigation style)
- **Container queries**: component-level decisions (card layout, text truncation)

### Implementation
```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card { flex-direction: row; }
}

@container card (max-width: 399px) {
  .card { flex-direction: column; }
}
```

### When to use container queries
- Reusable components that appear in different-width contexts (sidebar vs main content)
- Widget-style components (dashboards, cards) that need layout autonomy
- Design system components that must work regardless of where they are placed

---

## Vertical Rhythm

### Line height and spacing alignment
When body text uses a line-height of 24px (1.5 on 16px font), all vertical spacing
should be a multiple of 24px to maintain rhythm:
- Paragraph margin-bottom: 24px (1 line)
- Heading margin-top: 48px (2 lines)
- Heading margin-bottom: 24px (1 line)
- List item spacing: 12px (half line — acceptable sub-rhythm)

### The rhythm test
Overlay a baseline grid (horizontal lines every 24px) on the page. Text baselines and
spacing gaps should roughly align. Perfect alignment is impossible with mixed font sizes,
but approximate alignment creates the calm, ordered feel that polished sites have.

---

## Common Anti-Patterns

### Spacing mistakes to avoid
1. **Inconsistent margins** — using 17px here, 23px there, 30px somewhere else. Pick from the scale.
2. **Equal spacing everywhere** — if every gap is 24px, nothing has hierarchy. Vary intentionally.
3. **Padding-only layouts** — using padding on children instead of gap on parents. Gap is more maintainable.
4. **Magic numbers** — spacing values that don't come from the scale. Every value should trace back to the 8pt grid.
5. **Forgetting the last child** — bottom margins that add unwanted space inside containers. Use `gap` or `:last-child` resets.
6. **Desktop-first spacing** — designing generous spacing for desktop then cramming on mobile. Start tight, expand outward.
7. **Ignoring content density** — data-heavy UIs need tighter spacing (8-16px), marketing pages need generous spacing (32-96px). Match the content type.
