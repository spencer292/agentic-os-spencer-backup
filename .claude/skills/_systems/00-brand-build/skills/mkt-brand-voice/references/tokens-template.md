# Design Tokens Template

Canonical format for `<project_root>/{brand_context}/tokens.md` — the structural side of a brand (type scale, spacing, grid, motion). Consumed by `viz-image-gen` template renderer and downstream visual skills.

Pairs with `assets.md` (cosmetic side: colors, logos, fonts). Together they form the complete design system. Either file can be `unknown`-filled if data is missing — the loader applies sensible defaults.

---

```markdown
## Last Updated
{YYYY-MM-DD} by {source: brandbook-ui | interactive-qa | defaults}

# {Brand} — Design Tokens

## Type Scale

Sizes in **px** (canvas-relative). Use a modular scale so headings feel proportional.

- **Display:** 96 — hero pages, cover slides, oversized statements
- **H1:** 64 — section openers, primary headlines
- **H2:** 48 — slide titles, mid-weight emphasis
- **H3:** 32 — sub-headings, intro lines
- **Body L:** 22 — pull quotes, captions on hero slides
- **Body M:** 18 — standard slide body copy
- **Body S:** 14 — annotations, footers, micro labels
- **Caption:** 11 — image captions, ALL-CAPS eyebrows, footnotes

### Type rules
- Tracking: display `-0.04em`, headings `-0.02em`, body `0`, caps `0.08–0.14em`
- Line height: display `0.95`, headings `1.05`, body `1.55`
- Weight pairing: 1 display weight + 1 body weight + 1 mono (max 3)
- Italic: reserve for emphasis or quotes — never for full sentences

## Spacing Scale

4-base steps. Use only these values throughout layouts — no magic numbers.

- `2xs` 4 · `xs` 8 · `sm` 12 · `md` 16 · `lg` 24 · `xl` 32 · `2xl` 48 · `3xl` 64 · `4xl` 96 · `5xl` 128

### Padding rules
- Slide outer padding: `lg` (24px) on 1080px canvas
- Card inner padding: `lg` (24px)
- Hero canvas: `2xl` (48px) of breathing room on top/sides

## Layout Grid

Carousel canvas: **1080×1350px** (Instagram portrait) unless overridden by the skill.

- Columns: 12
- Gutter: `md` (16px)
- Margin: `lg` (24px)
- Safe area for crops: 60px from edges (avoids platform UI overlays)
- Slide aspect ratios supported: 1:1 (square), 4:5 (portrait), 9:16 (story)

### Grid rules
- Image zones snap to columns (full-bleed, half, third, quarter)
- Text never crosses safe area
- Logo placement respects `assets.md → logo.placement` + 24px from edge

## Motion (optional)

Defaults that downstream slide-to-video skills can read.

- **Duration short:** 200ms — micro-interactions, hover, fade-in
- **Duration medium:** 480ms — slide transitions, reveal
- **Duration long:** 800ms — hero text staggers
- **Ease:** `cubic-bezier(0.22, 1, 0.36, 1)` — natural deceleration

## Density & Tone

- **Density:** {sparse | balanced | dense}
- **Tone alignment:** {editorial | corporate | playful | brutalist | minimal | maximalist}

These two adjectives drive AI-image-gen mood adjustments when no explicit override is given.

## Visual Aspect Ratios (per skill)

Per-skill canvas overrides. Used by `viz-image-gen` to size canvases correctly.

- linkedin-carousel: 1080×1350 (4:5)
- linkedin-infographic: 1080×1350 (4:5)
- instagram-carousel: 1080×1350 (4:5)
- one-pager: 1080×1920 (9:16) or A4 if print
- ebook: 1240×1754 (A4 @150dpi)
```

---

## Schema rules

1. All numeric values in **px** unless explicitly noted.
2. Type scale is **ordered** — display largest, caption smallest. Skip a step if not needed but maintain order.
3. Spacing scale uses **fixed names** (`2xs` … `5xl`) — downstream code reads these tokens.
4. Aspect ratios use `WIDTHxHEIGHT` format.
5. Missing sections fall back to defaults at `mkt-brand-voice/references/defaults/anthropic-ish/tokens.md`.

## Loader extraction

```yaml
type_scale:
  display: 96
  h1: 64
  h2: 48
  h3: 32
  body_l: 22
  body_m: 18
  body_s: 14
  caption: 11
type_rules:
  tracking:
    display: -0.04
    heading: -0.02
    body: 0
    caps: 0.12
  line_height:
    display: 0.95
    heading: 1.05
    body: 1.55
spacing:
  "2xs": 4
  xs: 8
  sm: 12
  md: 16
  lg: 24
  xl: 32
  "2xl": 48
  "3xl": 64
  "4xl": 96
  "5xl": 128
grid:
  canvas_width: 1080
  canvas_height: 1350
  columns: 12
  gutter: 16
  margin: 24
  safe_area: 60
motion:
  duration_short: 200
  duration_medium: 480
  duration_long: 800
  ease: "cubic-bezier(0.22, 1, 0.36, 1)"
density: balanced
tone: editorial
aspect_ratios:
  linkedin-carousel: [1080, 1350]
  linkedin-infographic: [1080, 1350]
  instagram-carousel: [1080, 1350]
  one-pager: [1080, 1920]
  ebook: [1240, 1754]
```

The loader merges with defaults — any missing key inherits.
