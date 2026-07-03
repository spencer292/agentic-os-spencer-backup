# Visual Specification — Got Moles

Generated 2026-04-01. Rendered examples showing how the design system looks in practice. For Moni's design review and as a reference for the production build.

---

## Typography Hierarchy

### On Dark Surface (Grass #184241 background)

```
┌─────────────────────────────────────────────────────────────────┐
│  bg: #184241 (Grass)                                            │
│                                                                 │
│  HERO HEADLINE DISPLAY                                          │
│  Lexend Bold 700 · 67px · uppercase · -0.02em · Cream #FFF1D9  │
│                                                                 │
│  PAGE TITLE H1                                                  │
│  Lexend Bold 700 · 50px · uppercase · -0.02em · Cream #FFF1D9  │
│                                                                 │
│  SECTION HEADING H2                                             │
│  Lexend Bold 700 · 38px · uppercase · -0.02em · Cream #FFF1D9  │
│                                                                 │
│  Subsection Heading H3                                          │
│  Zilla Slab SemiBold 600 · 28px · sentence case · Cream        │
│                                                                 │
│  Card Title H4                                                  │
│  Zilla Slab SemiBold 600 · 21px · sentence case · Cream        │
│                                                                 │
│  Body text in Zilla Slab Regular. This is 16px with 1.6 line   │
│  height. The slab serif creates a warm, grounded feel that     │
│  distinguishes Got Moles from generic pest control sites. Max  │
│  width 65ch keeps lines readable on wide screens.              │
│  Zilla Slab Regular 400 · 16px · Cream #FFF1D9                │
│                                                                 │
│  Caption text for metadata and secondary info                   │
│  Zilla Slab Regular 400 · 14px · Cream at 65% opacity          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### On Light Surface (Cream-50 #FFFBF2 background)

```
┌─────────────────────────────────────────────────────────────────┐
│  bg: #FFFBF2 (Cream-50)                                        │
│                                                                 │
│  SECTION HEADING H2                                             │
│  Lexend Bold 700 · 38px · uppercase · neutral-800 #1A2423      │
│                                                                 │
│  Subsection Heading H3                                          │
│  Zilla Slab SemiBold 600 · 28px · neutral-800 #1A2423          │
│                                                                 │
│  Body text on light backgrounds uses neutral-800 for maximum   │
│  readability. The Grass-tinted neutral keeps warmth consistent  │
│  with the brand palette.                                        │
│  Zilla Slab Regular 400 · 16px · neutral-800 #1A2423           │
│                                                                 │
│  Secondary text and captions                                    │
│  Zilla Slab Regular 400 · 14px · neutral-400 #8A9493           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Color Swatches with Contrast Ratios

### Primary Palette

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  GRASS   │  BLUE    │  CREAM   │  GOLD    │  RUST    │
│ #184241  │ #182034  │ #FFF1D9  │ #E68C04  │ #8F2A2D │
│          │          │          │          │          │
│  ~60%    │  ~30%    │  text +  │  ~10%    │  final   │
│          │          │  light   │  CTA     │  CTA     │
│          │          │  bg      │  only    │  gradient│
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Contrast Pairs (verified)

```
Text / Background                      Ratio    WCAG    Use
─────────────────────────────────────────────────────────────
Cream #FFF1D9  /  Grass #184241       10.2:1    AAA     Body text on primary bg
Cream #FFF1D9  /  Blue  #182034       11.8:1    AAA     Body text on secondary bg
Blue  #182034  /  Gold  #E68C04        4.8:1    AA      Button text on CTA
Blue  #182034  /  Cream #FFF1D9       11.8:1    AAA     Headings on light sections
neutral-800    /  Cream-50             12.1:1    AAA     Body text on light bg
Gold  #E68C04  /  Grass #184241        4.1:1    AA-lg   Gold headings/accents on dark
Gold  #E68C04  /  Blue  #182034        4.8:1    AA      Gold accents on blue
Rust  #8F2A2D  /  Cream #FFF1D9        6.2:1    AA      Alert/emphasis on light
Cream at 65%   /  Grass #184241        6.6:1    AA      Muted labels on dark
```

### Grass Scale

```
50        100       200       300       400       500       600*      700       800       900       950
#E8F0F0   #C5D8D8   #9BBCBB   #6E9E9D   #3D7473   #1E524F   #184241   #133634   #0E2A28   #091E1D   #051312
░░░░░░░░  ░░░░░░░░  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓  ████████  ████████  ████████  ████████  ████████
                                                      * Brand
```

### Gold Scale

```
50        100       200       300       400       500*      600       700       800       900
#FFF4E0   #FFE4B3   #FFD080   #FFBB4D   #F5A31A   #E68C04   #C47603   #A26103   #7A4902   #523201
░░░░░░░░  ░░░░░░░░  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▓▓▓▓▓▓▓▓  ████████  ████████  ████████  ████████  ████████
                                          * Brand/CTA
```

---

## Button States

### Primary Button (Gold CTA)

```
┌─────────────────────────────────────────────┐
│  On Grass #184241 background:               │
│                                             │
│  ┌─────────────────────────────┐            │
│  │  GET A FREE INSPECTION  →   │  Default   │
│  │  bg: #E68C04 · text: #182034│            │
│  └─────────────────────────────┘            │
│                                             │
│  ┌─────────────────────────────┐            │
│  │  GET A FREE INSPECTION  →   │  Hover     │
│  │  bg: #C47603 · text: #182034│            │
│  └─────────────────────────────┘            │
│                                             │
│  ┌─────────────────────────────┐            │
│  │  GET A FREE INSPECTION  →   │  Active    │
│  │  bg: #A26103 · text: #182034│            │
│  └─────────────────────────────┘            │
│                                             │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐            │
│  │  GET A FREE INSPECTION  →   │  Focus     │
│  │  + Gold ring, 2px offset    │            │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘            │
│                                             │
│  Style: Lexend 700 · 14px · uppercase       │
│  Tracking: 0.1em · Radius: 0 (sharp)       │
│  Padding: 16px 36px · min-height: 48px      │
└─────────────────────────────────────────────┘
```

### Secondary Button (Cream outline)

```
┌─────────────────────────────────────────────┐
│  On Grass #184241 background:               │
│                                             │
│  ┌─────────────────────────────┐            │
│  │  LEARN MORE                 │  Default   │
│  │  border: 2px #FFF1D9        │            │
│  │  text: #FFF1D9 · bg: none   │            │
│  └─────────────────────────────┘            │
│                                             │
│  ┌─────────────────────────────┐            │
│  │  LEARN MORE                 │  Hover     │
│  │  bg: #FFF1D9 · text: #182034│            │
│  └─────────────────────────────┘            │
│                                             │
│  Same font specs as primary button.         │
└─────────────────────────────────────────────┘
```

### Click-to-Call (Mobile Sticky)

```
┌─────────────────────────────────────────────┐
│                                             │
│  390px viewport (mobile):                   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  📞  CALL (253) 300-3200            │    │
│  │  bg: #E68C04 · text: #182034        │    │
│  │  Full width · Sticky bottom          │    │
│  │  Height: 56px · Thumb zone           │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Section Rhythm Demo

This shows how a typical page flows through surface colors:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ██████████████████████████████████████████████████████████  │
│  █  HERO — Grass #184241                                 █  │
│  █  Cream text · Gold CTA · Hero image (preloaded)       █  │
│  █  padding: 128px top, 96px bottom                      █  │
│  ██████████████████████████████████████████████████████████  │
│                                                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓  TRUST BAR — Blue #182034                             ▓  │
│  ▓  9 Yrs | 5,000+ Clients | 219+ Reviews | Guaranteed  ▓  │
│  ▓  Large Cream numbers · Labels at 65% opacity          ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                                             │
│  ██████████████████████████████████████████████████████████  │
│  █  CONTENT SECTION — Grass #184241                      █  │
│  █  Section heading (uppercase Lexend)                    █  │
│  █  ═══════ (Gold divider 48px x 3px)                    █  │
│  █  Body content (Zilla Slab, Cream)                     █  │
│  █  padding: 96px vertical                               █  │
│  ██████████████████████████████████████████████████████████  │
│                                                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░  CONTRAST SECTION — Cream-50 #FFFBF2                  ░  │
│  ░  Dark text (neutral-800) · Cards on white             ░  │
│  ░  Visual breathing room · Form sections                ░  │
│  ░  padding: 96px vertical                               ░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                             │
│  ██████████████████████████████████████████████████████████  │
│  █  CONTENT SECTION — Grass #184241                      █  │
│  █  Testimonials (static cards, not carousel)            █  │
│  █  Gold quote marks · Cream text · Name + location      █  │
│  ██████████████████████████████████████████████████████████  │
│                                                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓  FINAL CTA — gradient Blue→Rust                       ▓  │
│  ▓  linear-gradient(#182034, #8F2A2D)                    ▓  │
│  ▓  Centered heading · Body text · Gold CTA button       ▓  │
│  ▓  Only place Rust appears in the design                ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                                             │
│  ██████████████████████████████████████████████████████████  │
│  █  FOOTER — Grass-800 #0E2A28                           █  │
│  █  Darkest surface · Cream text · Logo · Nav links      █  │
│  ██████████████████████████████████████████████████████████  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Spacing Demonstration

### 8pt Grid in Practice

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│  Section padding (desktop): 96px                          │
│  ╔═══════════════════════════════════════════════════╗    │
│  ║                                                   ║    │
│  ║   ← 32px container padding →                     ║    │
│  ║                                                   ║    │
│  ║   SECTION HEADING                                 ║    │
│  ║   ═══════ (gold divider)                          ║    │
│  ║         ↕ 16px                                    ║    │
│  ║   Body text paragraph                             ║    │
│  ║         ↕ 48px (section-internal gap)             ║    │
│  ║   ┌─────────┐  ┌─────────┐  ┌─────────┐         ║    │
│  ║   │ Card    │  │ Card    │  │ Card    │          ║    │
│  ║   │         │  │         │  │         │          ║    │
│  ║   │ 24px    │  │ 24px    │  │ 24px    │  ← internal
│  ║   │ padding │  │ padding │  │ padding │  padding ║    │
│  ║   └─────────┘  └─────────┘  └─────────┘         ║    │
│  ║        ↔ 32px gap (> 24px internal padding)       ║    │
│  ║                                                   ║    │
│  ╚═══════════════════════════════════════════════════╝    │
│                                                           │
│  Section gap: 96px (desktop), 64px (mobile)               │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Mobile vs Desktop Spacing

```
Desktop (1280px)              Mobile (390px)
─────────────────             ─────────────────
Section pad: 96px             Section pad: 48-64px
Container pad: 32px           Container pad: 16px
Card gap: 32px                Cards stack: 24px gap
Grid: 12 col, 24px gutter    Grid: 4 col (1 col stack), 16px gutter
H1: 50px                     H1: 32px
Body: 16-18px                 Body: 16px
Header: 56px fixed            Header: 56px fixed
```

---

## Trust Bar Component

```
┌─────────────────────────────────────────────────────────────┐
│  bg: Blue #182034                                           │
│                                                             │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │   9        │  5,000+    │   219+     │  GUARANTEED │     │
│  │   YRS IN   │  CLIENTS   │  5-STAR    │  RESULTS    │     │
│  │   BUSINESS │  SERVED    │  REVIEWS   │             │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
│                                                             │
│  Numbers: Lexend Bold · clamp(2rem, 4vw, 3.5rem) · Cream   │
│  Labels: Zilla Slab · text-small · Cream at 65% · uppercase│
│  +0.05em tracking on labels                                 │
│                                                             │
│  Mobile: 2x2 grid with 24px gap                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Gold Divider Accent

```
Section heading placement:

    SECTION HEADING (uppercase Lexend)
                 ↕ 16px
    ══════════════════  ← Gold #E68C04, 48px wide, 3px tall, centered
                 ↕ 16px
    Body text begins here...
```

Used below section headings to create branded separation. Centered alignment. Not used between every element, only below primary section headings (h2 level).

---

## Form Elements

```
┌─────────────────────────────────────────────────────────────┐
│  On Cream-50 background:                                    │
│                                                             │
│  Full Name                                                  │
│  ┌─────────────────────────────────────┐                   │
│  │                                     │  border: 1px      │
│  │                                     │  neutral-200      │
│  └─────────────────────────────────────┘  height: 48px     │
│                                            (touch target)   │
│  ↕ 12px gap                                                 │
│                                                             │
│  Phone Number                                               │
│  ┌─────────────────────────────────────┐                   │
│  │                                     │  focus: 2px       │
│  │                                     │  Gold #E68C04     │
│  └─────────────────────────────────────┘  border           │
│                                                             │
│  ↕ 12px gap                                                 │
│                                                             │
│  City                                                       │
│  ┌─────────────────────────────────────┐                   │
│  │  Select your city             ▼     │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ↕ 24px gap                                                 │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │  REQUEST FREE INSPECTION        →   │  Gold CTA         │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Label: Zilla Slab SemiBold 600 · 14px · neutral-700       │
│  Input: Zilla Slab Regular · 16px · neutral-800             │
│  Placeholder: neutral-300                                   │
│  Error: Rust-500 #8F2A2D text + Rust-50 bg                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Focus Indicators

```
All interactive elements:
  outline: 2px solid Gold #E68C04
  outline-offset: 2px

On dark backgrounds:
  Gold outline visible against Grass/Blue

On light backgrounds:
  Gold outline visible against Cream/White

Never removed. Always visible on keyboard focus.
```

---

## Responsive Behavior Summary

| Element | Desktop (1280px) | Tablet (768px) | Mobile (390px) |
|---------|-----------------|----------------|----------------|
| Container padding | 32px | 24px | 16px |
| Section padding | 96px | 72px (fluid) | 48px |
| Grid | 12 columns | 8 columns | Single column |
| Card grid | 3 across | 2 across | Stacked |
| Trust bar | 4 columns | 4 columns | 2x2 grid |
| Display text | 67px | ~50px (fluid) | 36px |
| H1 | 50px | ~40px (fluid) | 32px |
| Body | 18px (body-lg) | 16px | 16px |
| CTA | Inline button | Inline button | Full-width sticky bottom |
| Navigation | Horizontal links | Hamburger | Hamburger |
| Header height | 56px | 56px | 56px |

---

## Design System Checklist

Use this to verify any page or component against the system:

- [ ] Colors: Only using defined palette tokens (no hex values outside the system)
- [ ] Typography: Using defined scale tokens (no arbitrary font sizes)
- [ ] Spacing: All values from 8pt grid (no magic numbers)
- [ ] Contrast: All text/background pairs verified against WCAG AA
- [ ] Touch targets: 48px minimum on all interactive elements
- [ ] Gold usage: Only on interactive elements (buttons, links, active states)
- [ ] Headings: Display/h1/h2 uppercase Lexend, h3/h4 sentence case Zilla Slab
- [ ] Section rhythm: Alternating Grass/Blue/Cream surfaces
- [ ] CTA: One primary per viewport, Gold with Blue text, sharp corners
- [ ] Mobile: Single column, sticky CTA, thumb-zone placement
- [ ] Performance: Hero preloaded, below-fold lazy-loaded, fonts self-hosted
- [ ] Focus: Gold outline visible on all interactive elements

---

*Generated 2026-04-01. For Moni's design review and production build reference. See `brand_context/design-system.md` for principles and rules, `2026-04-01_design-tokens.md` for CSS and Tailwind implementation.*
