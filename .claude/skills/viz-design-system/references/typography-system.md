# Typography System Reference

Deep reference for typography decisions in web design systems. Covers type scales,
font selection, responsive typography, and performance optimization.

---

## Type Scales

A type scale defines the mathematical relationship between font sizes. Choose a ratio
based on how many distinct sizes you need and how dramatic the contrast should be.

### Scale Ratios

| Ratio | Name | Best for | Character |
|-------|------|----------|-----------|
| 1.333 | Perfect Fourth | Content-heavy sites, blogs, editorial | Gradual progression, many usable sizes |
| 1.25 | Major Third | UI-heavy apps, dashboards | Tighter range, subtle distinctions |
| 1.2 | Minor Third | Compact UIs, dense data displays | Very tight, minimal contrast between levels |
| Custom | — | Brands with strong typographic identity | Needs justification — don't deviate without reason |

### When to Use Each

**Perfect Fourth (1.333)** — the default recommendation. Produces enough contrast between
heading levels that hierarchy is immediately clear, while keeping the progression gentle
enough that you don't run out of usable sizes. If in doubt, start here.

**Major Third (1.25)** — when the interface is primarily interactive (forms, cards, tables)
rather than long-form reading. The tighter scale keeps UI elements compact without
feeling cramped.

**Minor Third (1.2)** — specialist use. Data-dense dashboards, admin panels, or interfaces
where vertical space is precious. The differences between sizes are subtle, so you must
rely on weight and color to reinforce hierarchy.

**Custom scales** — valid when a brand's existing typography dictates specific sizes, or
when a designer has tested a bespoke progression. Always document the rationale. A custom
scale without reasoning will drift over time.

### Perfect Fourth Scale (Concrete Example)

Base size: 16px. Each step multiplies by 1.333.

```
Token             Size    Line-height   Weight   Usage
──────────────────────────────────────────────────────────────
--text-display    67px    1.1           700      Hero headlines, landing pages
--text-h1         50px    1.15          700      Page titles
--text-h2         38px    1.2           700      Section headings
--text-h3         28px    1.25          700      Subsection headings
--text-h4         21px    1.3           600      Card titles, sidebar headings
--text-h5         18px    1.4           600      Minor headings, labels
--text-h6         16px    1.5           600      Same as body, distinguished by weight
--text-body       16px    1.6           400      Default body text
--text-body-lg    18px    1.6           400      Lead paragraphs, featured text
--text-small      14px    1.5           400      Captions, metadata, helper text
--text-xs         12px    1.4           400      Legal, footnotes (use sparingly)
```

The math: 16 → 21 (×1.333) → 28 (×1.333) → 38 (×1.333) → 50 (×1.333) → 67 (×1.333).
Round to the nearest pixel for clean rendering.

---

## Font Selection Criteria

Choose typefaces based on brand personality, audience expectations, and technical
requirements. Every font must earn its place — each additional font file costs
performance.

### Serif Fonts — Authority, Warmth, Established

Best for: coaching, consulting, professional services, finance, luxury, editorial.

| Font | Source | Strengths | Watch out for |
|------|--------|-----------|---------------|
| Georgia | Web-safe | Excellent readability, warm, no download cost | Dated if used alone |
| Lora | Google Fonts | Elegant, great body text, variable weight | Slightly decorative for UI |
| Merriweather | Google Fonts | Designed for screens, strong readability | Heavy file size without subsetting |
| Playfair Display | Google Fonts | Editorial authority, dramatic display | Display only — poor at body sizes |
| Source Serif Pro | Adobe | Clean, modern serif, professional | Less personality than Lora |

### Sans-Serif Fonts — Clarity, Modernity, Clean

Best for: SaaS, tech, modern brands, any audience valuing simplicity and clarity.

| Font | Source | Strengths | Watch out for |
|------|--------|-----------|---------------|
| Inter | Google Fonts | Dominant UI font 2024-2026, excellent at all sizes, variable | Ubiquitous — may feel generic |
| DM Sans | Google Fonts | Geometric, clean, slightly warmer than Inter | Limited character set in some weights |
| Plus Jakarta Sans | Google Fonts | Geometric, modern, good weight range | Less tested at very small sizes |
| Outfit | Google Fonts | Clean, contemporary, excellent readability | Newer — less ecosystem support |
| Manrope | Google Fonts | Semi-condensed, modern, good for headings | Can feel narrow at body size |

### Font Pairing Rules

1. **One serif + one sans-serif is the safest pairing.** Serif for headings with sans
   for body, or the reverse. The contrast creates natural hierarchy.
2. **Single-family sites work well.** Differentiate through weight and size alone.
   This is simpler to maintain and loads faster.
3. **Maximum 2 typefaces per site.** Three is a red flag that needs justification.
   Four or more creates visual chaos.
4. **Test at body size first (16-18px).** Headings are forgiving — nearly any font
   looks acceptable at 36px+. Body text is where poor choices become obvious.
5. **Match x-height.** When pairing fonts, ensure their x-heights are similar so
   they feel balanced when used together on the same line or in adjacent elements.

---

## Responsive Typography

### Fluid Type with clamp()

The modern approach eliminates breakpoint-based font-size changes entirely. CSS `clamp()`
provides smooth scaling between a minimum and maximum.

```css
/* Format: clamp(minimum, preferred, maximum) */

/* Body: 16px at 320px viewport → 18px at 1200px+ */
--text-body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);

/* H1: 32px at 320px → 56px at 1200px+ */
--text-h1: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);

/* H2: 26px at 320px → 38px at 1200px+ */
--text-h2: clamp(1.625rem, 1.25rem + 1.875vw, 2.375rem);

/* H3: 22px at 320px → 28px at 1200px+ */
--text-h3: clamp(1.375rem, 1.15rem + 1.125vw, 1.75rem);

/* Display: 36px at 320px → 67px at 1200px+ */
--text-display: clamp(2.25rem, 1.5rem + 3.75vw, 4.188rem);
```

### Responsive Rules

- **Body text minimum: 16px.** Never go below this on any device. 18px is ideal on
  desktop for long-form reading.
- **Headings scale more aggressively.** An h1 might be 32px on mobile and 56px on
  desktop — a 1.75x ratio. Body text only shifts from 16px to 18px — a 1.125x ratio.
- **Line length: 45-75 characters per line.** The optimal range for reading comfort.
  Enforce with `max-width: 65ch` on text containers. This single rule prevents the
  most common readability problem on wide screens.
- **Never use viewport units alone for font size.** `font-size: 3vw` breaks user zoom
  (WCAG accessibility violation). Always use `clamp()` with a rem minimum.
- **Test at 320px, 768px, and 1440px.** These represent the realistic extremes and
  midpoint. If typography works at all three, it works everywhere.

---

## Line Height

Line height (leading) controls the vertical rhythm of text. It varies by context.

| Context | Line-height | Rationale |
|---------|-------------|-----------|
| Body text | 1.5 – 1.7 | Readability. 1.6 is the sweet spot for most fonts |
| Headings | 1.1 – 1.3 | Tight — large text creates excessive gaps at normal leading |
| Small text / captions | 1.4 – 1.5 | Slightly tighter than body but still readable |
| Display / hero text | 1.0 – 1.15 | Very tight — visual impact matters more than line separation |
| Buttons / labels | 1.0 – 1.2 | Single-line elements — leading is effectively padding |

**Key principle:** As font size increases, line-height ratio should decrease. A 16px
paragraph at 1.6 leading has 9.6px of space between lines. A 50px heading at 1.6 would
have 30px — far too much. Headings use 1.1-1.2 to keep the text visually cohesive.

---

## Font Weight System

Each weight is a separate file download (unless using a variable font). Limit to 3
weights to control performance.

### Recommended Weight Set

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, general content, descriptions |
| Medium | 500 | Emphasis, subheadings, labels, navigation items |
| Bold | 700 | Headings, CTAs, strong emphasis |

**Semi-bold (600)** is acceptable as a replacement for either Medium or Bold — not in
addition to both. Pick three weights total and commit to them.

**Italic:** Include only if the brand voice uses emphasis frequently (editorial, coaching).
Each italic style is another file. If emphasis is rare, use bold or color instead.

---

## Font Loading Strategy

Typography is the #1 cause of Cumulative Layout Shift (CLS) and perceived slow loads.
These rules directly impact Core Web Vitals scores.

### Critical Rules

1. **`font-display: swap`** — prevents invisible text (FOIT). The browser shows fallback
   text immediately, then swaps to the custom font when loaded.

2. **Preload the primary body weight** — this is the font users see first:
   ```html
   <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
   ```

3. **WOFF2 only** — best compression, universal browser support since 2018. Drop WOFF,
   TTF, and EOT entirely.

4. **Self-host fonts** — avoid Google Fonts CDN. Self-hosting eliminates DNS lookups,
   gives better privacy compliance (GDPR), and loads faster. Download from
   google-webfonts-helper or fontsource.

5. **Variable fonts** — one file replaces 3-4 weight files. Inter Variable, for example,
   is a single ~100KB file covering all weights 100-900. Always prefer variable when
   the font offers it.

6. **Subset fonts** — strip unused glyphs (Cyrillic, Greek, Vietnamese, extended Latin
   if not needed). Can reduce file size by 70%+. Use `pyftsubset` or `glyphhanger`.

7. **Minimize CLS with fallback matching:**
   ```css
   @font-face {
     font-family: 'Inter';
     src: url('/fonts/inter-var.woff2') format('woff2');
     font-display: swap;
     size-adjust: 107%;
     ascent-override: 90%;
     descent-override: 22%;
     line-gap-override: 0%;
   }
   ```
   These overrides make the system fallback font (Arial, Helvetica) match the custom
   font's metrics, preventing text reflow when the swap happens.

---

## Practical Typography Rules

These are non-negotiable rules for any design system.

### Size and Hierarchy

- **Maximum 4 distinct text sizes per page.** More creates visual noise and weakens
  hierarchy. A typical page uses: body, one heading size, small text, and possibly
  a display size. That is enough.
- **Heading hierarchy must be logical.** h1 then h2 then h3 — never skip levels. Skipping
  h2 to go straight to h3 breaks screen reader navigation and implies missing structure.
- **One h1 per page.** Both an accessibility requirement (screen readers use it for page
  identification) and an SEO signal (search engines weight the h1 heavily).

### Spacing

- **Paragraph spacing > line spacing.** The space between paragraphs must be visibly
  greater than the space between lines within a paragraph. Typically 1.5x to 2x the
  line-height value. This is what creates readable text blocks.
- **Consistent vertical rhythm.** All spacing should derive from the base line-height.
  If body line-height produces 25.6px (16px × 1.6), use multiples of ~26px for
  margins and padding throughout the page.

### Letter Spacing

- **Leave it alone by default.** Most well-designed fonts have correct letter spacing
  built in.
- **Tighten large display text slightly:** -0.02em to -0.01em. Large text at default
  tracking looks loose.
- **Never tighten body text.** It hurts readability at small sizes.
- **All-caps text benefits from +0.05em to +0.1em tracking** to improve legibility.

### Alignment

- **Left-aligned for all body text.** Always. No exceptions in LTR languages.
- **Centered text only for:** short headlines (under ~8 words), CTAs, and single-line
  labels. Never center a paragraph.
- **Never use justified text on the web.** Unlike print, browsers cannot hyphenate
  reliably, creating uneven word spacing ("rivers of white") that hurts readability.
- **Right-aligned text** is acceptable only for numeric data in tables.

### Accessibility and Contrast

- **Body text: 4.5:1 contrast ratio minimum** (WCAG AA). This is the legal standard
  in many jurisdictions and the baseline for readable text.
- **Large text (24px+ regular or 18.5px+ bold): 3:1 minimum.** The larger the text,
  the less contrast it needs — but 3:1 is still the floor.
- **Enhanced contrast (WCAG AAA): 7:1 for body, 4.5:1 for large text.** Aim for this
  when the audience includes older users or those with visual impairments.
- **Never use color alone to convey meaning.** Pair color with weight, size, icons,
  or underlines. ~8% of men have some form of color vision deficiency.
- **Minimum touch target for linked text: 44×44px.** If text is a tap target on mobile,
  ensure the clickable area meets this size even if the text itself is smaller.
