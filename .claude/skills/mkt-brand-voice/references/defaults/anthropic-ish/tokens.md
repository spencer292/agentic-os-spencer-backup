## Last Updated
2026-05-18 by defaults

# Default Brand — Design Tokens

Structural tokens that pair with `assets.md`. Editorial-leaning scale, balanced density.

## Type Scale

- **Display:** 96 — hero pages, oversized statements
- **H1:** 64 — section openers, primary headlines
- **H2:** 48 — slide titles
- **H3:** 32 — sub-headings
- **Body L:** 22 — pull quotes, captions on hero slides
- **Body M:** 18 — standard body copy
- **Body S:** 14 — annotations, footers
- **Caption:** 11 — image captions, ALL-CAPS eyebrows

### Type rules
- Tracking: display `-0.04em`, headings `-0.02em`, body `0`, caps `0.12em`
- Line height: display `0.95`, headings `1.05`, body `1.55`
- Weight pairing: Fraunces 400-500 display + Instrument Sans 400-600 body + JetBrains Mono 400-500 mono

## Spacing Scale

- `2xs` 4 · `xs` 8 · `sm` 12 · `md` 16 · `lg` 24 · `xl` 32 · `2xl` 48 · `3xl` 64 · `4xl` 96 · `5xl` 128

### Padding rules
- Slide outer padding: `lg` (24px) on 1080px canvas
- Card inner padding: `lg` (24px)
- Hero canvas: `2xl` (48px) of breathing room on top/sides

## Layout Grid

Carousel canvas: **1080×1350px**.

- Columns: 12
- Gutter: `md` (16px)
- Margin: `lg` (24px)
- Safe area for crops: 60px from edges

## Motion

- **Duration short:** 200ms
- **Duration medium:** 480ms
- **Duration long:** 800ms
- **Ease:** `cubic-bezier(0.22, 1, 0.36, 1)`

## Density & Tone

- **Density:** balanced
- **Tone alignment:** editorial

## Visual Aspect Ratios (per skill)

- linkedin-carousel: 1080×1350 (4:5)
- linkedin-infographic: 1080×1350 (4:5)
- instagram-carousel: 1080×1350 (4:5)
- one-pager: 1080×1920 (9:16)
- ebook: 1240×1754 (A4 @150dpi)
