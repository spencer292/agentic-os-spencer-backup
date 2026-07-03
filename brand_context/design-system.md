# Design System — Got Moles

This document is the Got Moles design implementation. It inherits from `brand_context/design-principles.md` (the cross-client unified design principles) and applies Got Moles brand tokens.

**Read `brand_context/design-principles.md` first** — it defines the universal design rules (no dividers, no boxes, dark-first, progressive disclosure, mobile-first, etc.). This file defines Got Moles-specific colors, typography, and component details.

---

## Design Principles

### 1. Five-Second Clarity
**ICP trait:** Busy 42-45 year olds with high time pressure. Searching on a phone between tasks. If they can't tell what Got Moles does and why it's different in 5 seconds, they're gone.
**Design rule:** One CTA per viewport. Hero section answers "what, for whom, why trust us" above the fold. No competing actions. No cleverness that delays comprehension.
**Violation test:** Squint at any viewport. If the CTA doesn't pop or the headline is ambiguous, it fails.

**Source of truth:** Test pages at `/test/homepage`, `/test/how-it-works`, `/test/city`. These override any conflicting rule in this document.

### 2. Calm Authority
**ICP trait:** Frustrated, slightly defeated. They've tried DIY traps and generalist pest companies. They arrive stressed. Cluttered or aggressive design confirms their fear that this is "another thing to deal with."
**Design rule:** Generous whitespace between sections. Dark, earthy palette (Grass, Blue) reads as grounded and established. No urgency timers, no flashing elements, no hype. No decorative dividers, no visible card borders — spacing and tonal shifts create hierarchy. The design should feel like a deep breath.
**Violation test:** Does any element demand attention through motion or visual noise rather than content? Does any decorative element (line, border, box) exist that could be replaced by whitespace? Remove it.

### 3. Proof Over Promise
**ICP trait:** Medium sophistication, skeptical from being burned by generalists. Generic claims are ignored. They need specific, verifiable proof from people like them.
**Design rule:** Named testimonials with outcomes, not anonymous quotes. Real numbers (5,000 clients, 219+ reviews) in trust bars. Spencer's story with real credentials (Army veteran, 2017 founder). Maximum 3 trust signal types per page section. Over-proofing triggers distrust.
**Violation test:** Is any trust element generic or unverifiable? Replace it with a specific.

### 4. Specialist Signal
**ICP trait:** Their primary decision driver is "will this actually work this time?" They've hired generalists who failed. The design itself must signal "specialist, not generalist."
**Design rule:** Restrained palette. No clip-art, no generic stock. The mole skull illustrations and earthy brand identity do the work. Clean, professional typography (Lexend + Zilla Slab) reads as established. Nothing that looks like a template or a franchise.
**Violation test:** Could this design belong to a general pest control company? If yes, it fails.

### 5. Mobile-First, Thumb-Zone CTAs
**ICP trait:** Jennifer is searching "mole removal Sammamish" on her phone. 70%+ of traffic will be mobile. Mobile is the product. Desktop is the enhancement.
**Design rule:** Single-column below 768px. Primary CTA (click-to-call) in thumb zone or sticky at bottom. 48px touch targets. No horizontal scroll. Sticky header under 56px. Forms: minimal fields, large inputs.
**Violation test:** Can a user complete the primary action (call or request inspection) with one thumb on a 390px screen without scrolling past the fold?

### 6. Speed is Trust
**ICP trait:** Search-primary audience. They clicked one of 3-5 Google results. If the page takes more than 2 seconds, they hit back and click the next one. For this audience, slow = untrustworthy.
**Design rule:** LCP under 2.5s (target under 2s). Hero image preloaded, never lazy-loaded. Total page weight under 1MB. Maximum 3 font files. CSS-only animations. No carousels, no video backgrounds, no animation libraries.
**Violation test:** Does any design element add visual weight without adding conversion value? Cut it.

---

## Typography System

### Font Pairing

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headings (display, h1, h2) | Lexend | Bold (700) | Uppercase, tight tracking. Commanding on dark backgrounds. |
| Subheadings (h3, h4) | Zilla Slab | SemiBold (600) | Sentence case. Warm authority. |
| Body | Zilla Slab | Regular (400) | Distinctive slab serif. Specialist Signal. |

### Type Scale (Perfect Fourth, 1.333)

| Token | Desktop | Mobile | Line-height | Font/Weight | Usage |
|-------|---------|--------|-------------|-------------|-------|
| `--text-display` | 67px | 36px | 1.1 | Lexend/700 | Hero headlines only |
| `--text-h1` | 50px | 32px | 1.15 | Lexend/700 | Page titles |
| `--text-h2` | 38px | 26px | 1.2 | Lexend/700 | Section headings |
| `--text-h3` | 28px | 22px | 1.25 | Zilla Slab/600 | Subsection headings |
| `--text-h4` | 21px | 18px | 1.3 | Zilla Slab/600 | Card titles, sidebar |
| `--text-body-lg` | 18px | 18px | 1.6 | Zilla Slab/400 | Lead paragraphs |
| `--text-body` | 16px | 16px | 1.6 | Zilla Slab/400 | Default body text |
| `--text-small` | 14px | 14px | 1.5 | Zilla Slab/400 | Captions, metadata |
| `--text-xs` | 12px | 12px | 1.4 | Zilla Slab/400 | Legal, footnotes |

### Body Text — One Size Rule

**All primary body content uses `text-body-lg`** (18-20px via clamp). `text-body` is allowed for intentional hierarchy within a component (e.g., supporting testimonial quotes are `text-body` to visually defer to the featured quote).

| Element | Class | Size |
|---------|-------|------|
| All body copy (paragraphs, cards, steps, FAQs) | `text-body-lg` | 18-20px |
| Featured testimonial quote | `text-body-lg` | 18-20px |
| Supporting testimonial quotes | `text-body` | 16px (intentional hierarchy) |
| Card titles (h4) | `text-h4 lg:text-2xl` | 18→24px |
| Empathy/emotional headings | `text-display` | 36-67px |
| Form inputs, labels | `text-body` | 16px |
| Captions, links, metadata | `text-sm` | 14px |
| Legal, footnotes | `text-xs` | 12px |

### Typography Rules

- Display, h1, h2: **uppercase**, letter-spacing -0.02em
- h3, h4: **sentence case**, default tracking
- Body text minimum: 16px on all devices
- Max line length: 65ch on text containers
- **Alignment is context-driven.** Centered headings above grids/cards (service cards, feature grids, FAQ, testimonials). Left-aligned headings above prose/steps (hero, how it works, content sections, CTA form). Text containers with `max-w-[65ch]` are always `mx-auto` centered on the page. Never center body paragraphs or descriptions.
- No justified text
- **Line-break discipline:** No orphan dashes at line ends. No single orphan words on final heading lines. Use `text-wrap: balance` on headings. Manual `<br>` for critical headlines. `hyphens: none` on headings.
- Font files: 3 total (Lexend Bold, Zilla Slab Regular, Zilla Slab SemiBold). Self-hosted, WOFF2, Latin subset. Under 150KB total.
- Font loading: `font-display: swap`, preload Zilla Slab Regular (body font loads first)

---

## Color Palette

### Brand Colors

| Name | Hex | RGB | Role | Usage % |
|------|-----|-----|------|---------|
| Grass | #184241 | 24, 66, 65 | Primary | **~90%** |
| Blue | #182034 | 24, 32, 52 | Secondary (accent only) | **~5%** (final CTA gradient only) |
| Cream | #FFF1D9 | 255, 241, 217 | Neutral/Light | Text on dark backgrounds only. Never as section background. |
| Gold | #E68C04 | 230, 140, 4 | Accent/CTA | ~10%, interactive only |
| Rust | #8F2A2D | 143, 42, 45 | Accent/Urgency | Final CTA gradient only |

### Grass Scale

| Stop | Hex | Usage |
|------|-----|-------|
| 50 | #E8F0F0 | Light backgrounds, hover tints |
| 100 | #C5D8D8 | Borders on light surfaces |
| 200 | #9BBCBB | Disabled states |
| 300 | #6E9E9D | Secondary icons |
| 400 | #3D7473 | Lighter text on dark |
| 500 | #1E524F | Slightly lighter than base |
| 600 | #184241 | Brand Grass |
| 700 | #133634 | Hover state |
| 800 | #0E2A28 | Deep sections |
| 900 | #091E1D | Darkest Grass |
| 950 | #051312 | Near-black |

### Blue Scale

| Stop | Hex | Usage |
|------|-----|-------|
| 50 | #EAEDF3 | Light Blue tint backgrounds |
| 100 | #C8CEE0 | Borders |
| 200 | #9BA5C4 | Muted elements |
| 300 | #6E7DA8 | Secondary text on light |
| 400 | #3F4E7A | Mid-range |
| 500 | #1E2D52 | Slightly lighter than base |
| 600 | #182034 | Brand Blue |
| 700 | #131A2A | Hover |
| 800 | #0E1420 | Deep Blue |
| 900 | #090E16 | Darkest Blue |
| 950 | #05080D | Near-black |

### Cream Scale

| Stop | Hex | Usage |
|------|-----|-------|
| 50 | #FFFBF2 | Lightest cream, page background |
| 100 | #FFF7E8 | Cards on cream background |
| 200 | #FFF1D9 | Brand Cream |
| 300 | #FFE8C2 | Hover tint |
| 400 | #FFDEA8 | Accent borders |
| 500 | #F5CE86 | Warm mid-tone |

### Gold Scale

| Stop | Hex | Usage |
|------|-----|-------|
| 50 | #FFF4E0 | Callout box backgrounds |
| 100 | #FFE4B3 | Light gold borders |
| 200 | #FFD080 | Soft highlight |
| 300 | #FFBB4D | Bright gold |
| 400 | #F5A31A | Lighter CTA option |
| 500 | #E68C04 | Brand Gold. Primary CTA. |
| 600 | #C47603 | CTA hover |
| 700 | #A26103 | CTA active/pressed |
| 800 | #7A4902 | Dark gold text |
| 900 | #523201 | Deepest gold |

### Rust Scale

| Stop | Hex | Usage |
|------|-----|-------|
| 50 | #F8EAEA | Warning callout backgrounds |
| 100 | #E8C4C5 | Light rust borders |
| 200 | #D49597 | Muted rust |
| 300 | #BF6568 | Mid rust |
| 400 | #A74548 | Lighter rust |
| 500 | #8F2A2D | Brand Rust |
| 600 | #782325 | Hover |
| 700 | #611C1E | Active |
| 800 | #4A1517 | Dark rust |
| 900 | #330E10 | Deepest rust |

### Neutral Palette (Grass-tinted)

| Token | Hex | Usage |
|-------|-----|-------|
| neutral-50 | #F7F9F8 | Alternate light section backgrounds |
| neutral-100 | #EEF1F0 | Card backgrounds on white |
| neutral-200 | #DCE0DF | Borders, dividers |
| neutral-300 | #B8BFBE | Disabled text, placeholder |
| neutral-400 | #8A9493 | Secondary/caption text on light |
| neutral-500 | #5E6A69 | Body text on light backgrounds |
| neutral-600 | #3D4A49 | Primary text on light backgrounds |
| neutral-700 | #2A3433 | Strong text on light |
| neutral-800 | #1A2423 | Heading text on light |
| neutral-900 | #0D1413 | Near-black text |

### Semantic Colors

| Purpose | Light (bg) | Mid (icon/border) | Dark (text) |
|---------|-----------|-------------------|-------------|
| Success | #E8F5E9 | #4A8B5C | #1E5631 |
| Warning | #FFF4E0 | #D49B2A | #7A4902 |
| Error | #F8EAEA | #A74548 | #611C1E |
| Info | #EAEDF3 | #3F4E7A | #182034 |

### Color Usage Rules

- **Gold is reserved for interactive elements only.** Buttons, text links, active states. Never decorative.
- **Gold body text on light backgrounds is prohibited.** Fails 4.5:1 contrast. Use for headings/buttons only.
- **Rust appears only in the final CTA section gradient** (Blue #182034 → Rust #8F2A2D). Not used mid-page.
- **Section rhythm:** Grass is ~90% of the page. Use subtle tonal shifts within the grass family (#184241 → #153635 → #133634) for section variety. Blue (#182034) appears only in the trust strip accent zone and final CTA gradient. NOT alternating Grass/Blue.
- **Section transitions:** Last ~8% of each section uses a CSS gradient to blend into the next section's shade. No hard color breaks.
- **No dark mode toggle.** The brand is already dark-forward.

### Contrast Verification (Critical Pairs)

| Combination | Ratio | WCAG |
|-------------|-------|------|
| Cream on Grass | 10.2:1 | AAA |
| Cream on Blue | 11.8:1 | AAA |
| Gold on Grass | 4.1:1 | AA large |
| Gold on Blue | 4.8:1 | AA |
| Blue on Gold | 4.8:1 | AA |
| Blue on Cream | 11.8:1 | AAA |
| neutral-800 on Cream-50 | 12.1:1 | AAA |
| Rust on Cream | 6.2:1 | AA |

---

## Surface Hierarchy

### Dark Surfaces (primary)

| Level | Color | Usage |
|-------|-------|-------|
| Background | Grass #184241 | Primary section background |
| Surface | Blue #182034 | Alternate dark sections, nav |
| Text | Cream #FFF1D9 | Body text on dark |
| Accent | Gold #E68C04 | CTAs, highlights |

### ~~Light Surfaces~~ — NOT USED

**No cream/light section backgrounds.** The site is fully dark-first. All content sections use Grass tonal shifts. Cream is only used for text color on dark backgrounds and form field outlines. If a future design requires a light section, revisit this rule — but as of the design migration (2026-04-06), no page uses cream as a section background.

---

## Button and CTA System

| Property | Value |
|----------|-------|
| Background | Gold #E68C04 |
| Text color | Blue #182034 |
| Font | Lexend Bold (700) |
| Text transform | Uppercase |
| Letter spacing | 0.1em |
| Border radius | **16px (`rounded-2xl`)** |
| Padding | `px-8 py-4` (standard) or `px-9 py-4` (sub-page CTAs) |
| Hover | Gold-600 #C47603 |
| Active | Gold-700 #A26103 |
| Contrast (text on button) | 4.8:1 (AA) |

### CTA Icon Rules (context-dependent)

Icons are **not** one-size-fits-all. The icon style signals what the button does:

| Context | Icon | Example |
|---------|------|---------|
| Navigation CTAs ("See How It Works", "Schedule Inspection") | **Circle-enclosed chevron** — `w-5 h-5` circle with `border border-blue-600/30`, chevron inside | Homepage hero, empathy section |
| Action CTAs ("Call", form submit) | **No icon** or inline arrow | How-it-works hero, CTA sections |
| In-card links ("Get Year-Round Protection") | **Inline arrow SVG** — `w-3.5 h-3.5`, arrow-right | Service cards, feature cards |
| Text links ("See All 219+ Reviews") | **Inline arrow SVG** — `w-4 h-4`, arrow-right | Review links, "see full process" |

**Secondary button:** Cream #FFF1D9 outline on dark backgrounds. Cream text, 2px Cream border, transparent fill, 16px radius. Hover: Cream fill, Blue text.

**Click-to-call (mobile):** Same Gold button. Sticky at bottom of viewport on mobile. Phone icon + text.

**One CTA per hero.** Phone number access via header and mobile sticky bar only.

**Form fields:** Match button radius (16px / `rounded-2xl`) for visual consistency. Transparent background, cream/gold outline on dark sections.

---

## Design Elements

### Header (global — all page types)

**Source of truth:** `/test/homepage/TestHeader.tsx`

| Property | Value |
|----------|-------|
| Position | `fixed top-0`, full width, `z-50` |
| Default state | Own gradient strip: `linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)` — darkens the top of the hero for legibility |
| Scrolled state (>80px) | `bg-grass-700/95 backdrop-blur-sm shadow-lg` |
| Height | `h-16 lg:h-20` |
| Transition | `duration-300` on background |

**Layout (desktop):**
- **Left:** "GOT MOLES?" logo — `text-xl lg:text-2xl`, Lexend Bold, cream, uppercase
- **Center:** Nav links in a **pill container** — `rounded-full border border-cream-200/25 bg-black/20 backdrop-blur-sm`, links inside with `px-4 py-2 rounded-full hover:bg-white/5`
- **Right:** Gold circle phone icon — `w-11 h-11 rounded-full bg-gold-500`, phone SVG inside

**Nav items (existing, all kept):**
- How It Works
- Services (dropdown: TMCP, One-Time Removal, Commercial)
- About
- Service Areas
- Contact

**Services dropdown:** `rounded-2xl`, `bg-grass-700/95 backdrop-blur-sm`, `border border-cream-200/10`, centered under trigger, chevron rotates on open.

**Layout (mobile):**
- **Left:** Logo
- **Right:** Gold phone circle (`w-10 h-10`) + hamburger icon
- **Menu:** Full-width slide-down, `bg-grass-700/95 backdrop-blur-sm`, Services accordion, gold `rounded-2xl` call CTA at bottom

---

### Hero Section (page-type dependent)

Hero height, CTA style, and trust strip placement vary by page type. All heroes share: full-width background image, gradient overlay, text at bottom (`mt-auto` or `items-end`), `text-display` heading, `textWrap: balance`.

| Page type | Height | CTA | Trust strip | Notes |
|-----------|--------|-----|-------------|-------|
| Homepage | `min-h-[100vh]` | Navigation ("See How It Works") + circle-chevron | Inside hero | Full-viewport impact. Single CTA — no phone button. |
| Sub-pages | `min-h-[85vh]` | Action ("Call") + inline arrow | Separate section below | Slightly shorter — content page, not landing. |
| City pages | `min-h-[70vh]` | Action ("Call") + circle-chevron | Inside hero | Compact — city pages have more content sections below. |

**Gradient overlay pattern (all page types):**
Dark edges + clear center — ensures header legibility at top and text legibility at bottom while letting the hero image show through in the middle.
```
linear-gradient(to bottom,
  rgba(21,54,53,0.6) 0%,    /* dark top — header area */
  rgba(21,54,53,0.15) 30%,  /* fades to clear */
  rgba(21,54,53,0.15) 50%,  /* clear middle — image shows */
  rgba(21,54,53,0.5) 70%,   /* starts darkening again */
  rgba(21,54,53,0.95) 100%  /* dark bottom — text area */
)
```
Sub-pages (85vh/70vh) use `0.9` at 100% instead of `0.95` (slightly less dark at bottom since there's less hero space).

---

### ~~Gold Divider~~ — REMOVED
~~A small accent bar used between section eyebrow/heading and body content.~~
**Replaced by:** Generous whitespace (24-32px) between heading and body content. No decorative elements. See unified design principles Section 1.

### Trust Strip (all page types — inside hero)

The trust strip is always inside the hero at the bottom, consistent across all page types. No separate Blue accent strip.

| Page type | Placement | Background |
|-----------|-----------|------------|
| All pages | **Inside hero** — sits at hero bottom, photo continues behind with gradient overlay | `linear-gradient(to bottom, transparent, rgba(24,66,65,0.85) 30%, #184241)` |

**Content (all placements):**
- Gold stars centered above flowing inline dot-separated stats
- Example: `5-Star Rated · Nearly 5,000 Clients Served · Since 2017 · Veteran-Owned · Safe for Pets & Kids`
- Cream text, `text-body-lg`, items separated by `·` with `mx-2 text-cream-200/40`
- Padding: `py-6 lg:py-8`
- Mobile: wraps naturally, centered
- Desktop: single flowing line, centered
- Schema: `AggregateRating` + `Organization` markup regardless of visual treatment

### Brand Illustrations as Watermarks — DEFERRED
- Mole skull line-art illustrations exist in cream (#fff1d9), grass, blue, and rust color variants
- SVG file ready at `public/images/mole-skull-cream.svg` (cream variant for dark backgrounds)
- **Do not implement until Moni confirms exact placement, sizing, and which sections**
- Tested during design iteration — placement is sensitive; wrong positioning looks awkward
- When implemented: 10-15% opacity, never over body text areas, large scale only

### Grass Tonal Shades (for section variation)

| Name | Hex | Usage |
|------|-----|-------|
| Grass | #184241 | Primary section background |
| Grass-darker | #153635 | Alternate dark sections |
| Grass-darkest | #133634 | Deepest section shade |

### Section Transitions
- Primary rhythm: Grass → Grass-darker → Grass → Grass-darker (subtle tonal shifts, NOT alternating colors)
- Content sections use `linear-gradient(to bottom, #shade1, #shade2)` for smooth blend
- Last ~8% of each section transitions into the next shade
- Final CTA section: gradient `linear-gradient(to bottom, #182034, #8F2A2D)` — only place Blue appears prominently
- Background tonal shift provides section separation — no dividers needed
- **Flat backgrounds allowed** for compact/transitional sections (geo-definition blocks, nearby-city link strips, trust strips). These are short utility sections where a gradient would be distracting. Use a flat Grass shade (`#184241` or `#153635`).

### Testimonials
- **Featured + supporting pattern** (not 3-card equal grid):
  - **Featured review:** Large centered blockquote, `text-body-lg`, gold `"` accent at `text-5xl`, gold stars above, full name + city as attribution, `cite` block with spacing (no divider line)
  - **Supporting reviews (optional):** 2 smaller quotes in `md:grid-cols-2` below, `text-body` (intentionally smaller), `pl-5` indent, lighter text (`cream-200/80`)
- No card backgrounds on any quotes — no containers, no borders, no decorative lines. Spacing and tonal shifts only.
- "See All 219+ Reviews" link below with inline arrow
- Section background: `linear-gradient(to bottom, #153635, #184241 50%, #182034)` — transitions into Blue
- Schema: `Review` markup on each testimonial

### Service Cards
- Dark/semi-transparent cards on dark backgrounds (5-10% white overlay for tonal difference)
- **No white or cream cards on dark backgrounds**
- **No visible borders** — tonal shift only
- Consistent sizing — all cards in a group are identical dimensions
- Full-card clickable on desktop, stacked on mobile

### Forms
- Transparent or very toned down background (10-20% opacity if using a photo)
- Form fields: outline/border style (Cream or Gold border, transparent fill) — not solid white
- Desktop: two-column layout (text/CTA left, form right)
- Mobile: single column, full-width fields
- Gold submit button, same 16px radius (`rounded-2xl`) as all buttons

### Service Area / City Links
- Left-aligned heading + description
- Map visual (embedded or static image)
- **City links must remain as visible HTML `<a>` tags** (SEO requirement)
- Mobile: county groups with expand/collapse (top cities visible by default)
- Desktop: multi-column grid grouped by county
- Never hide all city links behind a JavaScript-only dropdown or map interaction

### How It Works / Process Steps
- Gold circle bullet markers (not numbered boxes)
- Bold heading per step + one-sentence summary visible
- Full step detail available via progressive disclosure (`<details>` element)
- Left-aligned, clean layout on dark background with skull watermark
- `HowTo` schema reads the full expanded content

---

## Spacing System (8pt grid)

### Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Micro (icon padding, fine adjustments) |
| `--space-2` | 8px | Tight (related element gaps, inline) |
| `--space-3` | 12px | Compact (form field gaps, list items) |
| `--space-4` | 16px | Default (paragraph spacing, card padding mobile) |
| `--space-6` | 24px | Comfortable (card padding desktop, form groups) |
| `--space-8` | 32px | Spacious (between content blocks within section) |
| `--space-12` | 48px | Section-internal (major breaks within a section) |
| `--space-16` | 64px | Section gap (mobile) |
| `--space-24` | 96px | Section gap (desktop) |
| `--space-32` | 128px | Hero breathing room |

### Section Spacing (responsive, page-type dependent)

Section padding varies by page type. The homepage has the most generous spacing. Sub-pages and city pages use slightly tighter spacing to keep content density appropriate.

| Page type | Padding | Tailwind | Usage |
|-----------|---------|----------|-------|
| Homepage | 64px / 128px | `py-16 lg:py-32` | Maximum breathing room for flagship page |
| Sub-pages (How It Works, About, Services) | 48px / 96px | `py-12 lg:py-24` | Standard content pages |
| City pages | 64px / 128px (content), 40px / 64px (compact) | `py-16 lg:py-32` / `py-10 lg:py-16` | Full spacing for content sections, compact for link strips (geo-definition, nearby cities) |

```css
/* Homepage */
section { padding-block: clamp(64px, 10vw, 128px); }
/* Sub-pages */
section { padding-block: clamp(48px, 8vw, 96px); }
```

### Internal vs External Rule

Component internal padding is always less than or equal to external margin.
- Card internal padding: 24px
- Gap between cards: 32px
- Section containing cards to next section: 96px

### Container

- Max-width: 1280px, centered
- Padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Text content max-width: 65ch

### Grid

- Desktop: 12 columns, 24px gutters
- Mobile: 4 columns, 16px gutters
- Common layouts: 12 (full), 6+6 (halves), 4+4+4 (thirds), 8+4 (content + sidebar)

### Breakpoints

| Name | Value | Usage |
|------|-------|-------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Small laptops |
| xl | 1280px | Laptops and desktops |
| 2xl | 1536px | Large desktops |

---

## Motion and Interaction Rules

**Default: Minimal motion.** Content appears, it doesn't perform.

### Allowed

- Subtle fade-in on scroll: 200-300ms, ease-out, opacity only
- Hover state transitions: 150ms, ease-in-out
- Focus ring animations: immediate
- Loading state indicators

### Forbidden

- Parallax scrolling
- Auto-playing video backgrounds
- Animated backgrounds
- Content that moves while you're trying to read it
- Entrance animations that delay content visibility
- Carousels or auto-rotating content
- GSAP, Framer Motion, or any JavaScript animation library

### Technical

- Only animate: `transform`, `opacity`, `filter`, `clip-path` (GPU-accelerated)
- Never animate: `width`, `height`, `top`, `left`, `margin`, `padding` (trigger layout)
- Always respect `prefers-reduced-motion: reduce`
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes

---

## Accessibility Requirements (non-negotiable)

- WCAG 2.2 AA compliance minimum
- Color contrast: 4.5:1 text, 3:1 UI elements (verified above)
- Touch targets: 48px minimum
- Focus indicators: visible, 2px+ offset, sufficient contrast
- No drag-only interactions
- Skip navigation link
- Semantic HTML hierarchy (one h1 per page, logical heading order)
- Alt text on all images (descriptive, not decorative)
- Never use color alone to convey meaning
- Form inputs: visible labels, error messages in text (not color only)

---

## Performance Requirements (non-negotiable)

### Targets

| Metric | Target |
|--------|--------|
| LCP | Under 2.5s (aim for under 2s) |
| INP | Under 200ms |
| CLS | Under 0.1 |
| Total page weight | Under 1MB |
| JavaScript | Under 200KB compressed |
| CSS | Under 50KB compressed |
| Fonts | Under 150KB (3 files) |

### Image Rules

- Hero/LCP image: preloaded with `fetchpriority="high"`, NEVER lazy-loaded
- All below-fold images: `loading="lazy"`
- Format: WebP primary, AVIF where supported
- Explicit `width` and `height` on all images (prevents CLS)
- Responsive `srcset` and `sizes` attributes
- Target: under 200KB above-fold images

### Font Rules

- Self-hosted, WOFF2 only
- `font-display: swap` on all @font-face declarations
- Preload body font (Zilla Slab Regular)
- Subset to Latin characters
- Fallback font metrics matched with `size-adjust`, `ascent-override`, `descent-override`

### Build Rules

- CSS-only for all visual effects (gradients, shadows, borders)
- SVG for icons (not icon fonts)
- `content-visibility: auto` on below-fold sections
- No carousel/slider libraries
- No JavaScript animation libraries
- Defer non-critical JavaScript

---

## ScoreApp Design Reference

The ScoreApp quiz (score.got-moles.com) was the initial design reference. The main site has evolved beyond it based on Moni's design review (April 2026).

**Still adopted from ScoreApp:**
- Uppercase Lexend headings on dark backgrounds
- Section rhythm (Grass → Blue → Grass)
- Blue-to-Rust gradient for final CTA section

**Changed from ScoreApp based on Moni's review:**
- Sharp-cornered buttons → 16px rounded corners (`rounded-2xl`)
- Gold divider bars → removed entirely (whitespace replaces decoration)
- Trust bar columnar layout → flowing inline text with dot separators
- 3 testimonial cards → featured + supporting pattern (1 large + 2 small)
- White/cream cards on dark backgrounds → dark semi-transparent cards (`bg-white/5`)
- Centered headings → context-driven alignment (centered above grids, left above prose)
- Text panel hero → full-bleed photo with gradient overlay, text at bottom of viewport

**Overridden by principles (unchanged):**
- Lexend weight 900 → 700 (Calm Authority: restraint at website scale)
- Testimonial carousel → static single (Five-Second Clarity: no hidden content)
- "WA's #1" claim → removed (Proof Over Promise: unsubstantiated)

---

## Progressive Disclosure — Content Density Strategy

**Principle:** No content is deleted for visual cleanliness. SEO/GEO requires substantial, authoritative content. The design presents it cleanly.

**Implementation:** Use HTML `<details><summary>` elements for expandable sections. Content is always in the DOM for crawlers. Users see the clean version and expand for detail.

**Where it applies:**
- How It Works steps (short summary visible, full detail expandable)
- Service descriptions (value prop visible, full detail expandable)
- City pages (city intro visible, neighborhood detail expandable)
- FAQ sections (already accordion by nature)

**Where it does NOT apply:**
- Blog posts (full content always visible)
- Hero sections
- Trust strips
- Testimonials

---

## Page Structure Checklist (run against every page)

Every page in pages-data.ts must pass this checklist before deploy. No exceptions.

| # | Check | Rule |
|---|-------|------|
| 1 | Hero has `trustStrip` array | Trust strip is always inside the hero. No standalone `trustBar` blocks. |
| 2 | No `background: 'blue'` on any block | Blue is only in the gradient CTA (`linear-gradient #182034 → #8F2A2D`). Never as a standalone section. Use `grass-to-blue` for subtle blue tint. |
| 3 | No `background: 'cream'` on any block | Site is fully dark-first. Cream is text color only. |
| 4 | `background: 'gradient'` only on the LAST block | The blue-to-rust gradient is the final CTA. Never mid-page. |
| 5 | No standalone `trustBar` blocks | All trust data goes in the hero `trustStrip` prop. |
| 6 | Block order: hero → GEO → content → CTA | Content sections use grass/grass-alt alternating. Gradient CTA is always last. |
| 7 | Section backgrounds alternate | `grass` → `grass-alt` → `grass` (or `grass-to-blue` for emphasis). No two adjacent blocks with the same background. |

**When to run:** After any change to pages-data.ts, before reseed + push. Also run as part of any new page creation.

---

*Updated 2026-04-08. Source of truth: test pages at `/test/homepage`, `/test/how-it-works`, `/test/city`. Design spec aligned to match test page implementations. Read by all downstream skills: viz-page-architect, viz-component-library, str-cro-audit, mkt-copywriting, production build.*
