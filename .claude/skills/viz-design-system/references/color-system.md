# Color System Reference

Deep reference for building, naming, and maintaining color systems for websites.
Covers palette generation, accessibility compliance, semantic naming, dark mode, and CTA strategy.

---

## Building a Color Palette from Brand Colors

### Starting from Existing Brand Colors

Most brands arrive with 1-2 colors. The design system extends them into a full,
functional palette. The process is mechanical, not creative — follow the steps.

**Step 1: Generate tint/shade scales.**

For each brand color, create a scale from 50 (lightest tint) to 950 (darkest shade).
The 500 value should be close to the original brand color.

Basic method — HSL manipulation:
- Keep hue constant
- For tints (50-400): increase lightness, decrease saturation slightly
- For shades (600-950): decrease lightness, increase saturation slightly
- Problem: HSL is not perceptually uniform. Mid-tones (300-400) often look muddy.
  Yellow and green hues shift visibly when you only change lightness.

Better method — OKLCH color space:
- OKLCH separates lightness (L), chroma (C), and hue (H) in a way that matches
  human perception. Equal numeric steps produce visually equal steps.
- Supported in modern CSS: `oklch(0.65 0.15 250)`
- For the scale: keep hue constant, step lightness linearly from ~0.97 (50) to
  ~0.15 (950), and adjust chroma to peak at mid-range and taper at extremes.
- This eliminates the muddy mid-tones and hue shifts that plague HSL scales.

Recommended scale steps: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950.
That is 11 stops — enough granularity without becoming unmanageable.

**Step 2: Derive neutrals from brand colors.**

Never use pure grey (#808080 and friends). Tinted neutrals create warmth and cohesion
that pure greys cannot.

- Warm neutrals: Start with grey, add 2-5% saturation of the primary brand hue.
  Works for most brands. The tint should be barely perceptible — if you can
  obviously see the color in your grey, you have added too much.
- Cool neutrals: Desaturate the primary color toward blue-grey (hue 220-240).
  Good for tech, finance, and professional services brands.

Generate the same 50-950 scale for neutrals. These are used for text, borders,
backgrounds, and disabled states — they appear more than any other color.

**Step 3: Add semantic colors.**

Every system needs feedback colors. These communicate state, not brand.

| Purpose  | Hue Range | Notes |
|----------|-----------|-------|
| Success  | 140-160 (green) | Confirmations, completed states, positive metrics |
| Warning  | 40-50 (amber)   | Caution states, approaching limits, pending actions |
| Error    | 0-10 (red)      | Validation errors, destructive actions, failures |
| Info     | 210-230 (blue)  | Informational banners, tooltips, neutral alerts |

These must feel cohesive with the brand palette. Technique: match the chroma and
lightness curve of your brand scales. A muted brand palette with vivid red errors
looks disjointed.

Generate 3 shades per semantic color: a light tint (backgrounds), a mid value
(icons/borders), and a dark value (text on light backgrounds).

### Palette Size Rules

- 3-5 core colors maximum: primary, secondary, accent, plus 1-2 optional
- Each core color: 8-11 scale steps
- One neutral scale: 8-11 steps
- Four semantic colors: 3 shades each
- Total named tokens: 50-80

More than 80 tokens indicates scope creep. Audit for unused values before adding.
Every token is a maintenance burden and a decision point for developers.

---

## WCAG 2.2 Contrast Requirements

### The Numbers

| Element | Minimum Contrast Ratio | WCAG Level |
|---------|----------------------|------------|
| Body text (under 24px regular, under 18.5px bold) | 4.5:1 | AA (required) |
| Large text (24px+ regular, 18.5px+ bold) | 3:1 | AA (required) |
| UI components and graphical objects | 3:1 | AA (required) |
| Body text (enhanced) | 7:1 | AAA (aspirational) |

AA is the legal and practical baseline. AAA is worth pursuing for body text —
the readability improvement is significant, especially on mobile screens in
variable lighting conditions.

### Common Failures

83.6% of the top million websites fail on color contrast (WebAIM 2024).
It is the number one accessibility violation globally.

Check EVERY text/background combination. The failures hide in the edges:

- Light grey text on white backgrounds — "secondary" text set at #999 on #FFF
  produces only 2.85:1. Minimum safe grey on white: #767676 (4.54:1).
- Brand color on brand tint — primary-600 text on primary-50 background.
  Calculate, do not assume.
- Placeholder text in form inputs — browser defaults often fail. Style explicitly.
- Disabled state text — WCAG does not require contrast for disabled elements,
  but users still need to read them. Aim for 3:1 minimum even on disabled.
- Captions and metadata — small text set in light grey "because it is secondary"
  still needs 4.5:1. Being secondary does not exempt it from being readable.
- Text on images or gradients — check the worst-case overlap point, not the average.

### Verification Approach

- Use the relative luminance formula (WCAG 2.x defined). Do not trust your eyes.
- Automate checks in CI with tools like axe-core or Pa11y.
- Test with color blindness simulation — 8% of men have some form of color vision
  deficiency. The most common (deuteranomaly) makes red and green hard to
  distinguish. Never rely on color alone to convey meaning.
- Check every state: default, hover, focus, active, disabled, selected, error.
  Each state changes colors and each needs its own contrast verification.

---

## Semantic Color Naming

### Why Semantic Naming Matters

`blue-500` tells you what the color IS. `primary-500` tells you what it DOES.

When the brand refreshes and blue becomes green, semantic names survive unchanged.
Literal color names force a find-and-replace across the entire codebase — and the
ones you miss become bugs.

### Three-Tier Naming System

```
Tier 1 — Primitive (raw palette values):
  --blue-500: #3B82F6;
  --blue-600: #2563EB;
  --green-600: #16A34A;
  --neutral-900: #171717;
  --neutral-600: #525252;
  --neutral-200: #E5E5E5;
  --neutral-50: #FAFAFA;

Tier 2 — Semantic (purpose-driven):
  --color-primary: var(--blue-500);
  --color-primary-hover: var(--blue-600);
  --color-success: var(--green-600);
  --color-text-primary: var(--neutral-900);
  --color-text-secondary: var(--neutral-600);
  --color-text-inverse: var(--white);
  --color-surface-primary: var(--white);
  --color-surface-secondary: var(--neutral-50);
  --color-border-default: var(--neutral-200);
  --color-border-strong: var(--neutral-400);

Tier 3 — Component (specific use):
  --button-primary-bg: var(--color-primary);
  --button-primary-bg-hover: var(--color-primary-hover);
  --button-primary-text: var(--color-text-inverse);
  --card-bg: var(--color-surface-primary);
  --card-border: var(--color-border-default);
  --input-border: var(--color-border-default);
  --input-border-focus: var(--color-primary);
  --input-border-error: var(--color-error);
```

**Usage rule:** Application code references Tier 2 and Tier 3 names only. Tier 1
exists solely in the palette definition file. If a developer writes
`background: var(--blue-500)` anywhere outside the token definitions, that is a
code review rejection.

Tier 3 is optional for small projects. It becomes essential when components have
complex state variations (buttons with 5+ states, form inputs with validation).

---

## Surface Hierarchy

Define distinct background levels to create visual depth without relying on
drop shadows (which fail in dark mode).

| Level | Name | Light Mode Example | Purpose |
|-------|------|--------------------|---------|
| 0 | Background | #FFFFFF or neutral-50 | Page canvas |
| 1 | Surface | neutral-50 or white | Cards, content containers |
| 2 | Elevated | white or neutral-100 | Modals, dropdowns, popovers |
| 3 | Overlay | rgba(0,0,0,0.5) | Scrim behind modals |

Rules:
- Adjacent surfaces must have visible contrast (not necessarily WCAG ratios,
  but perceptible). A card on a page background should be distinguishable
  without relying solely on borders.
- All text on every surface level must meet WCAG contrast requirements. Check
  each text color against each surface color.
- In dark mode, the stacking often reverses: the page background is the darkest
  value and elevated surfaces are progressively lighter.

---

## Dark Mode Considerations

### Core Principles

Dark mode is a separate design, not an inverted light palette. Mechanical
inversion produces unreadable text, vibrating colors, and broken hierarchy.

1. **Use dark greys, never pure black.** Recommended range: #121212 to #1E1E1E.
   Pure black (#000000) on OLED screens creates a stark contrast with colored
   elements that causes halation (a glow effect around white text). It is also
   visually harsh in low-light environments.

2. **Reduce saturation by 10-20%.** Saturated colors on dark backgrounds produce
   a vibrating optical effect that causes eye fatigue. Desaturating slightly
   neutralizes this while maintaining the color's identity.

3. **Maintain contrast ratios.** Dark mode is not permission to make text harder
   to read. Light text on dark backgrounds still needs 4.5:1 for body text.
   White (#FFFFFF) on dark grey (#1E1E1E) produces roughly 15.4:1 — usually
   too high. Off-white (neutral-100, ~#F5F5F5) is often more comfortable.

4. **Replace shadows with surface elevation.** Drop shadows are invisible on
   dark backgrounds. Use progressively lighter surface colors or thin
   (1px) borders with low-opacity light strokes to create depth.

5. **Watch the primary color.** Your brand's primary on a light background is
   designed for that context. On a dark background, it may need lightening
   or desaturation. Define separate primary values for dark mode.

### Implementation

CSS custom properties make dark mode token mapping straightforward:

```css
:root {
  --color-surface-primary: #FFFFFF;
  --color-text-primary: #171717;
}

[data-theme="dark"] {
  --color-surface-primary: #1E1E1E;
  --color-text-primary: #F5F5F5;
}
```

Pair with `prefers-color-scheme` for system-preference detection:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-surface-primary: #1E1E1E;
    --color-text-primary: #F5F5F5;
  }
}
```

This gives users a manual override (`data-theme`) while respecting system
preference as the default. Semantic tokens mean every component follows
automatically — no per-component dark mode styles needed.

---

## Accent Color Strategy for CTAs

The CTA button color is the single most tested element in conversion rate
optimization. What the research shows:

- **There is no universally "best" CTA color.** Orange does not beat green.
  Red does not beat blue. What matters is contrast with surrounding content.
- **The CTA must be the most visually distinct element in any viewport.**
  Test: squint at the page. If the CTA disappears into the design, it needs
  more contrast. If it pops, it is working.
- **Reserve the accent color exclusively for interactive elements.** Buttons,
  text links, toggle states, active tabs. This trains the user's eye to
  associate that color with "something I can click." The moment you use it
  for a decorative border or background gradient, you dilute the action signal.
- **Never use the CTA color for non-interactive decoration.** Background
  illustrations, divider lines, icon fills — all of these weaken the
  CTA's visual priority when they share its color.
- **Adjacent contrast matters more than absolute color.** A blue CTA on a
  blue-tinted page has low salience regardless of its hex value. An orange
  CTA on the same page would dominate. The palette must be designed so the
  accent color has maximum contrast with the dominant surface and text colors.

---

## Color and ICP Alignment

Color palettes communicate before the user reads a single word. Match the
palette mood to the audience:

| Palette Style | Signal | Best For |
|---------------|--------|----------|
| Earthy, muted, desaturated | Credibility, experience, groundedness | Established business audiences, coaches, consultants |
| Bright, saturated, high-energy | Innovation, speed, disruption | Startup audiences, younger demographics, tech products |
| Monochromatic with single accent | Sophistication, precision, restraint | Premium and luxury audiences, high-end services |
| High-contrast, bold primaries | Confidence, authority, conviction | Audiences who need to trust before they buy |
| Warm pastels, soft gradients | Approachability, safety, care | Wellness, education, community-focused products |
| Dark with neon accents | Edge, technical prowess, exclusivity | Developer tools, gaming, crypto/web3 audiences |

This is not decoration advice — it is positioning. A coaching brand for
corporate executives using bright saturated primary colors sends a conflicting
signal. A startup targeting Gen Z with muted earth tones looks stale.

Load `brand_context/icp.md` and `brand_context/positioning.md` before
selecting palette mood. The color system should reinforce the brand's
positioning with the target audience, not undermine it.
