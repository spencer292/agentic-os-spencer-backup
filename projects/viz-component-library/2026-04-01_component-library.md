---
project: website-rebuild-rebrand
date: 2026-04-01
components: 7
status: draft
design_system: brand_context/design-system.md
---

# Component Library — Got Moles

Every component references design system tokens by name. Never raw values. Mobile-first: smallest screen specified first, then enhanced for desktop.

**ICP:** Jennifer Thompson (42), Sammamish homeowner, medium sophistication, mobile-first, frustrated, wants proof this time will be different.

**Design system:** `brand_context/design-system.md` (approved 2026-04-01)

---

## 1. Hero Section

### Purpose
First thing Jennifer sees. Answers who, what, why, next step in 5 seconds. Earns the scroll.

### Psychology
47% of users expect pages to load in under 2 seconds. The hero IS the LCP element. If it's slow, Jennifer hits back. The hero image is decorative context. The text and CTA are the conversion elements. Text panel approach (not full-dim overlay) gives faster LCP and better readability.

### Variants

**Variant A: Homepage Hero (text panel on image)**
- Layout: Full-bleed background image. Semi-opaque Grass panel behind text on left 60%. Text and CTAs sit on the panel.
- Mobile: Image becomes subtle background or hides. Text + CTAs take full width.

**Variant B: Service Page Hero (no image)**
- Layout: Full Grass-600 background. Centered text. No image needed.
- Mobile: Same layout, text scales down.

**Variant C: City Page Hero (compact)**
- Layout: Grass-600 background. Left-aligned text. Compact (less vertical space than homepage hero).
- Mobile: Same, stacked.

### Visual Structure

```
Desktop (Variant A):
┌──────────────────────────────────────────────────────┐
│ [Background Image - full bleed]                       │
│ ┌─────────────────────────────┐                      │
│ │ Grass-600 panel (opacity 90%)│                      │
│ │                              │                      │
│ │ H1 (--text-display)          │                      │
│ │ Lexend 700, uppercase        │                      │
│ │ --tracking-tight             │                      │
│ │ --cream-200                  │                      │
│ │                              │                      │
│ │ Subheadline (--text-body-lg) │                      │
│ │ Zilla Slab 400               │                      │
│ │ --cream-200                  │                      │
│ │                              │                      │
│ │ [Gold CTA] [Cream Outline]   │                      │
│ │                              │                      │
│ │ ★★★★★ micro-proof line       │                      │
│ │ --text-small, cream at 65%   │                      │
│ └─────────────────────────────┘                      │
└──────────────────────────────────────────────────────┘

Mobile (all variants):
┌──────────────────────┐
│ Grass-600 background  │
│                       │
│ H1 (--text-h1)        │
│ 32px, uppercase       │
│                       │
│ Subheadline           │
│ --text-body, 16px     │
│                       │
│ ┌───────────────────┐ │
│ │ GOLD CTA (full w) │ │
│ └───────────────────┘ │
│ ┌───────────────────┐ │
│ │ CREAM OUTLINE     │ │
│ └───────────────────┘ │
│                       │
│ ★★★★★ micro-proof     │
└──────────────────────┘
```

### Content Slots

| Slot | Max length | Token | Required |
|------|-----------|-------|----------|
| H1 | 80 chars | `--text-display` / `--text-h1` (mobile) | Yes |
| Subheadline | 150 chars | `--text-body-lg` | Yes |
| Primary CTA | 25 chars | Gold button system | Yes |
| Secondary CTA | 25 chars | Cream outline system | No |
| Micro-proof | 40 chars | `--text-small`, cream-200 at 65% | No |
| Background image | 1920x1080 min | Preloaded, WebP, srcset | Variant A only |

### States
- Default: as rendered
- No hover states on the hero itself (it's not interactive)
- CTAs follow button state system (see CTA component)

### Accessibility
- H1 is the only `<h1>` on the page
- Background image: `alt=""` (decorative)
- CTAs: visible focus rings (`--focus-ring-color`, 2px offset)
- Text contrast: Cream on Grass = 10.2:1 (AAA)

### Performance
- Hero image: `fetchpriority="high"`, preloaded, NEVER lazy-loaded
- Responsive srcset: 400w, 800w, 1200w, 1600w
- Target: under 150KB for above-fold image
- Format: WebP primary

### Tokens Used
`--text-display`, `--text-h1`, `--text-body-lg`, `--text-small`, `--grass-600`, `--cream-200`, `--gold-500`, `--space-32` (top padding), `--section-padding` (bottom), `--tracking-tight`, `--font-heading`, `--font-body`

---

## 2. Trust Bar

### Purpose
Borrow credibility before Jennifer invests attention. She glances at this in 1 second. Numbers do the talking.

### Psychology
Social proof through metrics works best when: numbers are specific (not "hundreds"), placement is early (before content investment), and visual treatment is distinct from surrounding content. The trust bar sits between hero and first content section as a credibility bridge.

### Visual Structure

```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Blue-600 background, full-width                       │
│                                                       │
│   9          5,000+       219+       GUARANTEED       │
│   YRS IN     CLIENTS     5-STAR      RESULTS         │
│   BUSINESS   SERVED      REVIEWS                      │
│                                                       │
│   Numbers: Lexend 700, clamp(2rem, 4vw, 3.5rem)      │
│   Labels: Zilla Slab 400, --text-small, uppercase     │
│   Label opacity: 65%                                  │
└──────────────────────────────────────────────────────┘

Mobile (2x2 grid):
┌──────────────────────┐
│   9        5,000+    │
│   YRS IN   CLIENTS   │
│   BUSINESS SERVED    │
│                      │
│   219+     ✓         │
│   5-STAR   GUARANTEED│
│   REVIEWS  RESULTS   │
└──────────────────────┘
```

### Content Slots

| Slot | Max length | Token | Required |
|------|-----------|-------|----------|
| Metric number | 10 chars | `--font-heading`, `--weight-bold`, clamp(2rem, 4vw, 3.5rem) | Yes |
| Metric label | 20 chars | `--font-body`, `--text-small`, uppercase, `--tracking-wide` | Yes |

### Responsive Behavior
- Desktop: 4-column grid, `--space-6` gap
- Tablet: 4-column grid (fits)
- Mobile: 2x2 grid, `--space-6` gap
- Full viewport width (edge-to-edge, no container max-width)

### Accessibility
- Semantic: `<section aria-label="Company statistics">`
- Numbers: not wrapped in heading tags (they're stats, not headings)
- Screen reader: reads naturally as "9 years in business, 5,000+ clients served..."

### Tokens Used
`--blue-600`, `--cream-200`, `--font-heading`, `--font-body`, `--text-small`, `--weight-bold`, `--tracking-wide`, `--space-6`, `--space-12` (vertical padding)

---

## 3. Testimonial Section (Featured + Supporting)

### Purpose
Remove doubt with specific evidence from real customers. The two-tier layout gives visual drama to the lead review while covering multiple ICP concerns. Static layout, not carousel.

### Psychology
Named testimonials with location convert 34% better than anonymous quotes. Three voices addressing different concerns create a pattern ("multiple people like me chose this") that one voice alone cannot. Carousel testimonials have ~1% interaction rate beyond the first slide — static cards ensure all proof is seen. The featured/supporting hierarchy guides the eye: the lead review commands attention, the supporting reviews provide breadth.

### Visual Structure

```
Desktop:
┌─────────────────────────────────────────────────┐
│                   ★★★★★                         │
│                   "                              │
│          "Featured review text here              │
│           in large italic Zilla Slab."           │
│                                                  │
│              Brian Wozeniak                      │
│              Tacoma, WA                          │
│                                                  │
│             (generous margin)                    │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐     │
│  │ ▎"Supporting      │  │ ▎"Supporting      │     │
│  │ ▎ review text     │  │ ▎ review text     │     │
│  │ ▎ here..."        │  │ ▎ here..."        │     │
│  │ ▎                 │  │ ▎                 │     │
│  │ ▎ Sabra B.        │  │ ▎ Christina M.    │     │
│  │ ▎ Seattle, WA     │  │ ▎ Seattle, WA     │     │
│  └──────────────────┘  └──────────────────┘     │
│                                                  │
│           See All 219+ Reviews →                │
└─────────────────────────────────────────────────┘

Mobile:
┌─────────────────────────┐
│        ★★★★★            │
│        "                 │
│ "Featured review text    │
│  here in large italic."  │
│                          │
│    Brian Wozeniak        │
│    Tacoma, WA            │
│                          │
│      (margin)            │
│                          │
│ ▎"Supporting review      │
│ ▎ text here..."          │
│ ▎ Sabra B. · Seattle, WA│
│                          │
│ ▎"Supporting review      │
│ ▎ text here..."          │
│ ▎ Christina M. · Seattle │
│                          │
│  See All 219+ Reviews →  │
└─────────────────────────┘
```

### Content Slots — Featured Review

| Slot | Max length | Token | Required |
|------|-----------|-------|----------|
| Star rating | 5 stars | `--gold-500`, 20px | Yes |
| Quote mark | Fixed " | `--gold-500`, `--font-heading`, 48px | Yes |
| Review text | 250 chars | `--text-body-lg`, `--font-body`, `--cream-200`, italic | Yes |
| Name | 30 chars | `--text-sm`, font-semibold, `--cream-200` | Yes |
| City | 30 chars | `--text-sm`, `--cream-200` at 65% | Yes |

### Content Slots — Supporting Reviews (x2)

| Slot | Max length | Token | Required |
|------|-----------|-------|----------|
| Left border | 2px | `--gold-500` at 40% opacity | Yes |
| Review text | 200 chars | `--text-body`, `--font-body`, `--cream-200` at 80%, italic | Yes |
| Name | 30 chars | `--text-sm`, font-semibold, `--cream-200` at 90% | Yes |
| City | 30 chars | `--text-sm`, `--cream-200` at 50% | Yes |

### Responsive Behavior
- Featured review: centered, max-width 672px (2xl), full-width on mobile
- Supporting grid: max-width 768px (3xl), 2-column on md+, single column on mobile
- Gap: `--space-6` between supporting cards
- Featured-to-supporting margin: 56px (mb-14)
- NOT a carousel. All 3 visible on scroll.

### Section Styling
- Background: gradient matching adjacent sections (grass-600 family)
- Featured review: centered text alignment, generous vertical padding
- Supporting reviews: left-aligned text, gold left border (2px, `--gold-500/40`), padding-left 20px
- No card backgrounds on supporting reviews — border-left only for visual lightness
- Border-radius: 0 (sharp corners throughout)

### Review Selection Strategy
Each of the 3 reviews should address a different ICP concern:
- **Featured:** Strongest proof with specific numbers (e.g., "27 moles removed," "5-acre property")
- **Supporting 1:** Tried-everything story (DIY failure → Got Moles success)
- **Supporting 2:** Long-term loyalty (annual customer, multi-year relationship)

Source: Spencer's ranked Google reviews (`reference-data/reviews-ranked.md`, 183 reviews). Rotate reviews per page context (homepage vs. TMCP vs. city pages).

### Accessibility
- Featured: `<blockquote>` for review text, `<cite>` for attribution
- Supporting: `<blockquote>` with `<cite>` for each
- Star rating: `aria-label="5 out of 5 stars"`
- "See All 219+ Reviews" link is semantic `<a>` with descriptive text

### Tokens Used
`--grass-600`, `--cream-200`, `--gold-500`, `--font-heading`, `--font-body`, `--text-body-lg`, `--text-body`, `--text-sm`, `--space-6`, `--section-padding`

---

## 4. Service Card

### Purpose
Present the three services (TMCP, One-Time, Commercial) as scannable options for self-selection.

### Psychology
Pricing transparency builds trust with medium-sophistication ICP. Showing all three options together uses the center-stage effect (the middle option gets the most clicks). TMCP should be positioned first or highlighted as "Most Popular" to drive the highest-value conversion.

### Visual Structure

```
Desktop (3 cards in a row on Cream-50 background):
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ [Gold icon 48px] │ │ [Gold icon 48px] │ │ [Gold icon 48px] │
│                  │ │                  │ │                  │
│ YEAR-ROUND       │ │ ONE-TIME         │ │ COMMERCIAL       │
│ PROTECTION       │ │ REMOVAL          │ │                  │
│ H4, Zilla Semi   │ │ H4, Zilla Semi   │ │ H4, Zilla Semi   │
│                  │ │                  │ │                  │
│ $100/month       │ │ $450 flat rate   │ │ Custom quote     │
│ Gold, Lexend 700 │ │ Gold, Lexend 700 │ │ Gold, Lexend 700 │
│                  │ │                  │ │                  │
│ 2-3 lines of     │ │ 2-3 lines of     │ │ 2-3 lines of     │
│ description in   │ │ description in   │ │ description in   │
│ Zilla Slab 400   │ │ Zilla Slab 400   │ │ Zilla Slab 400   │
│                  │ │                  │ │                  │
│ Learn More →     │ │ Learn More →     │ │ Learn More →     │
│ Gold text link   │ │ Gold text link   │ │ Gold text link   │
└─────────────────┘ └─────────────────┘ └─────────────────┘

Mobile (stacked):
Cards stack single column, full-width. Each card tappable.
TMCP first (highest value).
```

### Content Slots

| Slot | Max length | Token | Required |
|------|-----------|-------|----------|
| Icon | 48px SVG | `--gold-500` stroke on card background | No |
| Title | 30 chars | `--text-h4`, `--font-body`, `--weight-semibold` | Yes |
| Price | 20 chars | `--font-heading`, `--weight-bold`, `--gold-500` | Yes |
| Description | 150 chars | `--text-body`, `--font-body` | Yes |
| Link text | 20 chars | `--gold-500`, `--weight-semibold` | Yes |
| Link URL | — | Internal link to service page | Yes |

### Card Styling
- Background: white (#FFFFFF) on `--cream-50` parent section
- Border: 1px `--neutral-200`
- Padding: `--space-6` (24px)
- Border-radius: 0 (sharp corners)
- Hover: subtle lift or border color change to `--gold-500`
- Entire card is clickable (not just the link text)

### Responsive Behavior
- Desktop: 3-column grid (`repeat(3, 1fr)`), `--space-8` gap
- Tablet: 3-column (still fits)
- Mobile: single column, `--space-6` gap. TMCP card first.

### Accessibility
- Each card: `<article>` or `<a>` wrapping the entire card
- Card title is an `<h3>` or `<h4>` (within section heading hierarchy)
- Link: descriptive aria-label if link text is generic ("Learn about the Total Mole Control Program")

### Tokens Used
`--cream-50`, `--neutral-200`, `--gold-500`, `--font-heading`, `--font-body`, `--text-h4`, `--text-body`, `--weight-semibold`, `--weight-bold`, `--space-6`, `--space-8`

---

## 5. City Page Content Blocks

### Purpose
Render city-specific content from the CityPages Payload collection. Same template, unique content per city.

### Components Used
City pages are assembled from existing components. No new components needed. The city page template uses:

| Section | Component | Content Source |
|---------|-----------|---------------|
| Hero | **Hero (Variant C)** | CityPages.headline + CityPages.introText |
| GEO Block | **GEO Definition** (inline) | CityPages.introText (first 2-3 sentences) |
| Mole Problem | **Rich Content** | CityPages.localDetails + CityPages.body |
| Services | **Service Card** (3 cards) | Static (same on all city pages) |
| How It Works | **Steps Process** (condensed) | Static (same on all city pages) |
| Trust Bar | **Trust Bar** | Static (same on all city pages) |
| Reviews | **Testimonial Card** | Filtered by CityPages.slug or county |
| FAQ | **FAQ Accordion** | CityPages.faqs (3 city-specific questions) |
| CTA | **CTA Block** (gradient) | Static + CityPages.cityName |

### City-Specific Rendering Rules
- H1: "MOLE CONTROL IN {CITYNAME}" (dynamic, uppercase)
- Final CTA: "READY FOR MOLE-FREE LIVING IN {CITYNAME}?" (dynamic)
- Testimonials: filter by city first. Fall back to county if < 2 reviews.
- Adjacent city links: 2-3 nearby city page links at bottom ("Also serving nearby: [City], [City], [City]")
- URL pattern: `/mole-control-{slug}/`

### No New Components Needed
All city page sections map to existing components. The uniqueness comes from the CMS content, not the component design.

---

## 6. CTA Components

### Purpose
Convert visitors at decision points. Three variants for different contexts.

### Variant A: Primary CTA Button (Gold)

```
┌─────────────────────────────────┐
│  CALL (253) 750-0211            │
│                                 │
│  bg: --gold-500                 │
│  text: --blue-600               │
│  font: Lexend 700, 14px         │
│  text-transform: uppercase      │
│  letter-spacing: 0.1em          │
│  padding: 16px 36px             │
│  border-radius: 0               │
│  min-height: 48px               │
└─────────────────────────────────┘
```

**States:**
| State | Background | Text | Additional |
|-------|-----------|------|------------|
| Default | `--gold-500` | `--blue-600` | — |
| Hover | `--gold-600` | `--blue-600` | `transition: 150ms ease-in-out` |
| Active | `--gold-700` | `--blue-600` | — |
| Focus | `--gold-500` | `--blue-600` | 2px `--gold-500` outline, 2px offset |
| Disabled | `--neutral-300` | `--neutral-500` | `cursor: not-allowed` |

**Micro-copy:** Always include micro-copy below the button. Increases clicks 10-20%.
- Examples: "Free inspection. No obligation." / "We respond within one business day."
- Token: `--text-small`, `--cream-200` at 65% (on dark) or `--neutral-400` (on light)

### Variant B: Secondary CTA Button (Cream Outline)

```
┌─────────────────────────────────┐
│  SEE HOW IT WORKS               │
│                                 │
│  bg: transparent                │
│  border: 2px --cream-200        │
│  text: --cream-200              │
│  Same font/size as primary      │
└─────────────────────────────────┘
```

**States:**
| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | transparent | `--cream-200` | `--cream-200` |
| Hover | `--cream-200` | `--cream-200` | `--blue-600` |
| Focus | transparent | `--cream-200` | `--cream-200` + outline |

### Variant C: Final CTA Section (Gradient Background)

Full-width section with gradient background, heading, body text, Gold CTA button, and optional form.

```
Desktop:
┌──────────────────────────────────────────────────────┐
│ gradient: --blue-600 to --rust-500                    │
│                                                       │
│           H2 (uppercase Lexend)                       │
│           Body text (Zilla Slab)                      │
│                                                       │
│           [GOLD CTA BUTTON]                           │
│           micro-copy below                            │
│                                                       │
│  ┌─────────────────────────────────────┐             │
│  │ White form card (optional)           │             │
│  │ Name | Phone | Zip | How can we help │             │
│  │ [REQUEST FREE INSPECTION]            │             │
│  │ "Every service comes with a          │             │
│  │  guarantee."                         │             │
│  └─────────────────────────────────────┘             │
│                                                       │
│  "Join 5,000+ homeowners who chose Got Moles"        │
│  --text-small, cream at 65%                           │
└──────────────────────────────────────────────────────┘
```

**Form fields:** 4 max. Large inputs (48px height). Single-column on mobile. Gold submit button full-width. Labels above fields (not placeholder-only).

### Variant D: Mobile Sticky CTA Bar

```
┌─────────────────────────────────────────┐
│ 📞  CALL (253) 750-0211                 │
│ bg: --gold-500  text: --blue-600        │
│ Fixed bottom. Height: 56px.             │
│ Appears after scrolling past hero.      │
│ Hides when form section is in view.     │
└─────────────────────────────────────────┘
```

- Only on mobile (below `--breakpoint-md`)
- z-index: above content, below modals
- Subtle upward shadow for elevation
- Touch target: entire bar is tappable

### Tokens Used (all CTA variants)
`--gold-500`, `--gold-600`, `--gold-700`, `--blue-600`, `--cream-200`, `--rust-500`, `--neutral-200`, `--neutral-300`, `--neutral-400`, `--font-heading`, `--weight-bold`, `--text-small`, `--space-6`, `--space-3`, `--duration-fast`, `--ease-in-out`, `--focus-ring-color`, `--focus-ring-offset`, `--gradient-cta`

---

## 7. FAQ Accordion

### Purpose
Handle objections disguised as helpfulness. FAQPage schema for Google and AI engine extraction.

### Psychology
Accordion pattern reduces cognitive load. One answer visible at a time prevents overwhelm for time-poor ICP. Question-format headings match how Jennifer searches ("are mole traps safe for dogs?").

### Visual Structure

```
Desktop + Mobile (identical layout):
┌──────────────────────────────────────────────────┐
│ Grass-600 background                              │
│                                                   │
│ H2: FREQUENTLY ASKED QUESTIONS                    │
│ ════════ Gold divider                             │
│                                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ ▸ Are your methods safe for pets and children?│ │
│ └──────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ ▾ How long does mole removal take?            │ │
│ │                                               │ │
│ │   Most properties see results within 2-4     │ │
│ │   weeks. Our eradication program runs for    │ │
│ │   one month with weekly visits. We set traps │ │
│ │   on active tunnels, check and adjust weekly,│ │
│ │   and give you a results report after every  │ │
│ │   visit.                                     │ │
│ │                                               │ │
│ └──────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ ▸ What if the moles come back?               │ │
│ └──────────────────────────────────────────────┘ │
│                                                   │
│ See all FAQs → (Gold text link to /faq/)          │
└──────────────────────────────────────────────────┘
```

### Content Slots

| Slot | Max length | Token | Required |
|------|-----------|-------|----------|
| Section heading | 40 chars | `--text-h2`, Lexend uppercase | No (can omit if standalone) |
| Gold divider | 48px x 3px | `--gold-500` | If heading present |
| Question | 80 chars | `--text-body`, `--font-body`, `--weight-semibold`, `--cream-200` | Yes |
| Answer | 50-100 words | `--text-body`, `--font-body`, `--cream-200` at 90% | Yes |
| Toggle icon | ▸/▾ or +/- | `--gold-500`, 16px | Yes |
| "More" link | 20 chars | `--gold-500`, `--text-small` | No |

### Interaction

| Action | Behavior |
|--------|----------|
| Tap/click question | Toggle answer open/closed. 200ms ease-out. |
| Open new question | Close previously open question (single-open mode). |
| Keyboard: Enter/Space | Toggle focused question. |
| Keyboard: Arrow down | Move focus to next question. |
| Keyboard: Arrow up | Move focus to previous question. |

### Styling
- Question row: full-width, 48px min-height (touch target), `--space-4` padding vertical
- Border: 1px bottom border, cream-200 at 10% opacity
- Open state: answer slides down with `max-height` animation, 200ms
- Toggle icon rotates 90 degrees on open

### Schema
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text"
      }
    }
  ]
}
```
Generated automatically when `generateSchema: true` is set in the FAQ block.

### Accessibility
- `<details>` / `<summary>` native elements, OR
- Custom: `role="button"`, `aria-expanded="true/false"`, `aria-controls="answer-id"`
- Answer: `role="region"`, `aria-labelledby="question-id"`
- Focus visible on all question rows

### Tokens Used
`--grass-600`, `--cream-200`, `--gold-500`, `--font-body`, `--weight-semibold`, `--text-body`, `--text-small`, `--space-4`, `--space-6`, `--duration-normal`, `--ease-out`

---

## Global Component Rules

### All Components

1. **Token-only values.** Never use raw hex, px, or font names. Reference design system tokens.
2. **Mobile-first.** Spec mobile layout first. Desktop is the enhancement.
3. **48px touch targets.** Every interactive element on mobile.
4. **One primary CTA per viewport.** Secondary CTAs visually subordinate.
5. **Sharp corners.** `border-radius: 0` on all buttons and cards. Per design system.
6. **Gold = interactive only.** Gold color reserved for buttons, links, active states, divider accents. Never decorative backgrounds.
7. **No carousel.** Static cards for all repeating content (testimonials, services, reviews).
8. **No animation libraries.** CSS transitions only. 150-300ms. Only animate `transform`, `opacity`.
9. **`prefers-reduced-motion: reduce`** respected on all motion.

### Background Color Usage

| Background | Text color | When to use |
|-----------|-----------|-------------|
| `--grass-600` | `--cream-200` | Primary sections (hero, content, testimonials) |
| `--blue-600` | `--cream-200` | Alternate dark (trust bar, differentiators) |
| `--cream-50` | `--neutral-800` | Light sections (service cards, forms, service area) |
| `--gradient-cta` | `--cream-200` | Final CTA section only |
| `--grass-800` | `--cream-200` | Footer only |

### Section Transitions
No hard color jumps between same-darkness sections. Alternate: dark → dark-alt → dark → light → dark.

---

*Generated 2026-04-01. Tasks 4.19-4.25. All 7 components specified. For Moni's review and production build reference.*
