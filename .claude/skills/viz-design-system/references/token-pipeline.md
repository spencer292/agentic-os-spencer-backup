# Token Pipeline: Seed Sources and Output Formats

Where the tokens come from, and the three shapes they leave in. Read the first half at Step 1 and
the second half at Step 9.

Sources checked September 2026:
- Tailwind CSS v4 theme variables, https://tailwindcss.com/docs/theme
- Tailwind CSS v4.0 announcement, https://tailwindcss.com/blog/tailwindcss-v4
- WCAG 2.2 Recommendation, https://www.w3.org/TR/WCAG22/

---

## Part 1: Seed Sources

### Source A: brand context (preferred)

`mkt-visual-identity` writes `brand_context/visual-identity/tokens.json`. When that file exists it is
the source of truth for colour, type and spacing. Do not re-derive what it already declares. Its
`locked_fields` array lists values the user typed by hand, and those are never overridden.

The file is written for a fixed social canvas, so the values need translating to a fluid web system.
Map it like this.

| `tokens.json` field | Web design system token | Translation rule |
|---------------------|-------------------------|------------------|
| `brand` | Brand name in the spec header | Verbatim |
| `colors.primary` | `--brand-primary-500`, then a 50 to 950 scale | Treat the given hex as the 500 stop and build the scale in OKLCH around it |
| `colors.accent` | `--color-accent`, reserved for interactive elements | Verify 4.5:1 against every surface before accepting it as the CTA colour |
| `colors.secondary` | `--brand-secondary-500` plus scale | Same scale treatment |
| `colors.bg_light` / `colors.bg_dark` | `--color-surface-primary` in light and dark themes | Surface level 0 in each theme |
| `colors.text_on_light` / `text_on_dark` | `--color-text-primary` per theme | Check against the matching surface |
| `colors.text_muted` | `--color-text-secondary` | Must still reach 4.5:1. Social canvases tolerate weaker muted text than web body copy does |
| `colors.border_subtle` | `--color-border-default` | 3:1 against the adjacent surface if it carries meaning |
| `fonts.display` / `fonts.body` / `fonts.mono` | `--font-display`, `--font-body`, `--font-mono` | Locked. Build the scale around them, never substitute |
| `type_scale.*.size` | Ratio, not pixels | The canvas is 1080 px wide. Derive the ratio between steps, then rebuild at a 16 px web base with `clamp()` |
| `type_scale.*.line_height` | `--leading-*` | Carry across directly |
| `type_scale.*.letter_spacing` | `--tracking-*` | Carry across directly |
| `spacing.scale` | `--space-*` | Already an 8pt family. Carry across and extend to 96 and 128 for section gaps |
| `canvas` | Ignore | Fixed social canvas, irrelevant to a fluid web layout |

Two fields that do not exist in `tokens.json` and must be created here: the semantic feedback colours
(success, warning, error, info) and the surface hierarchy above level 0. Generate both to match the
chroma and lightness curve of the brand scales so they do not look bolted on.

Say plainly which values were seeded and which were derived. The user should be able to tell what
came from their brand and what came from you.

### Source B: a live site's stylesheet

Use this when the user names a URL to match, extend, or rebuild against, and there is no brand
context. Lifting real values beats guessing at them. A demo build for a security-awareness client
lifted the cyan, the navy and Montserrat straight off the client's live site, which is why the demo
read as their brand from the first frame rather than as a generic template.

Procedure:

1. Fetch the page. `tool-firecrawl-scraper` returns HTML and linked CSS. If it is unavailable, ask
   the user to paste the stylesheet or the computed values from their browser inspector.
2. Pull declared custom properties first. Modern sites publish `:root { --... }` blocks, and those
   are the site's own token names. That is the highest-fidelity source available.
3. If there are no custom properties, extract by frequency: count hex, `rgb()`, `hsl()` and `oklch()`
   values across the stylesheet, and rank by number of rules that use them. The top three or four
   non-neutral values are almost always the brand palette.
4. Extract `font-family` stacks from the `body`, heading and button rules. Record the whole stack,
   not just the first name, because the fallbacks tell you the intent.
5. Extract the type scale from heading `font-size` declarations. Compute the ratio between adjacent
   levels and match it to the nearest named scale.
6. Extract spacing from the most frequent `padding`, `margin` and `gap` values. Snap them to the
   nearest 8pt step and flag any value that does not snap.
7. Screenshot the page with `tool-web-screenshot` and cross-check. CSS alone cannot tell you which
   colour is the CTA and which is decorative chrome.

Always report what was lifted, with the URL and the date, in the spec document. A lifted palette is a
starting point that the user still has to approve, not a finished decision.

Two failure modes to avoid. Do not lift a colour that appears once in a third-party widget and
promote it to a brand accent. Do not lift a value from an ad script, an embedded map, or a cookie
banner, because those stylesheets belong to somebody else.

### Source C: interview

No brand context and no site to match. Ask, in this order: who is the audience and what is their
sophistication level, what do you want them to feel in the first five seconds, what does a competitor
look like that you do not want to look like, do you have any fixed brand assets at all, and what is
the primary action on the site. Then propose two directions with the reasoning attached and let the
user pick. Never present more than two.

---

## Part 2: Output Formats

Three artefacts, always all three, always in this order.

### Output 1: CSS custom properties, three tiers

Tier 1 holds raw palette values and exists only in the token definition file. Tier 2 holds
purpose-driven names. Tier 3 holds component-specific names and is optional on small projects.

```css
:root {
  /* Tier 1 primitive */
  --brand-500: oklch(0.62 0.14 232);
  --brand-600: oklch(0.54 0.14 232);
  --neutral-900: oklch(0.22 0.02 250);
  --neutral-600: oklch(0.50 0.01 250);
  --neutral-200: oklch(0.90 0.01 250);
  --neutral-50:  oklch(0.98 0.00 250);

  /* Tier 2 semantic */
  --color-primary: var(--brand-500);
  --color-primary-hover: var(--brand-600);
  --color-text-primary: var(--neutral-900);
  --color-text-secondary: var(--neutral-600);
  --color-surface-primary: #ffffff;
  --color-surface-secondary: var(--neutral-50);
  --color-border-default: var(--neutral-200);

  /* Tier 3 component */
  --button-primary-bg: var(--color-primary);
  --button-primary-bg-hover: var(--color-primary-hover);
  --input-border: var(--color-border-default);
  --input-border-focus: var(--color-primary);
}
```

The rule that keeps this honest: application code references Tier 2 and Tier 3 names only. A raw
`var(--brand-500)` anywhere outside the definition file is a code review rejection.

### Output 2: Tailwind v4 `@theme` block

Tailwind v4 moved configuration into CSS. There is no `tailwind.config.js` in the default setup, and
every theme variable becomes both a real CSS custom property and a generated utility class. Emit the
block in the namespaced form, because the namespace is what tells Tailwind which utilities to build.

```css
@import "tailwindcss";

@theme {
  /* --color-* generates bg-*, text-*, border-*, ring-* and friends */
  --color-brand-50:  oklch(0.97 0.02 232);
  --color-brand-500: oklch(0.62 0.14 232);
  --color-brand-600: oklch(0.54 0.14 232);
  --color-brand-900: oklch(0.30 0.09 232);
  --color-ink:       oklch(0.22 0.02 250);
  --color-paper:     oklch(0.99 0.00 250);
  --color-accent:    oklch(0.70 0.17 55);

  /* --font-* generates font-* */
  --font-display: "Your Display Face", ui-sans-serif, system-ui, sans-serif;
  --font-body:    "Your Body Face", ui-sans-serif, system-ui, sans-serif;

  /* --text-* generates text-*, with a paired line height */
  --text-body:    clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --text-body--line-height: 1.6;
  --text-h2:      clamp(1.625rem, 1.25rem + 1.875vw, 2.375rem);
  --text-h2--line-height: 1.2;
  --text-display: clamp(2.25rem, 1.5rem + 3.75vw, 4.188rem);
  --text-display--line-height: 1.05;

  /* --spacing sets the base step that every spacing utility multiplies */
  --spacing: 0.25rem;

  /* --radius-*, --shadow-*, --breakpoint-* follow the same pattern */
  --radius-md: 0.625rem;
  --breakpoint-3xl: 120rem;
}
```

Notes that save time later:

- The double-dash suffix (`--text-h2--line-height`) is how v4 attaches a default line height to a
  font-size utility. Use it so `text-h2` carries its leading without a second class.
- `--spacing` is a single base value, not a list. Every `p-*`, `m-*` and `gap-*` utility multiplies it,
  so an 8pt system comes from a `0.25rem` base used in even steps.
- To replace a default namespace wholesale rather than extend it, set the wildcard first, for example
  `--color-*: initial;` before your own colours. Only do this when the brand genuinely wants no
  default palette, because it removes every stock colour utility.
- Theme variables are emitted as real custom properties, so the Tier 2 semantic aliases in Output 1
  can point at them. Do not maintain two disconnected palettes.
- For theme switching, define the palette under `:root` and `[data-theme="dark"]` in plain CSS, then
  point the `@theme` variables at those custom properties. That keeps one source of truth.

### Output 3: the spec markdown

The human-readable document. It must contain, in this order:

1. Seed source and date. Which of A, B or C was used, and the URL if B.
2. The approved design principles from Step 3, each with its violation test.
3. Typography: the face, the scale table with size, line height, weight and usage, and the `clamp()`
   values.
4. Colour: every swatch with its hex or OKLCH value, its semantic name, and its measured contrast
   ratio against the surfaces it sits on. Mark anything that only just clears 4.5:1.
5. Spacing scale and the section spacing rules for mobile and desktop.
6. Motion rules and the reduced-motion behaviour.
7. Accessibility floors and performance budget as a checklist a developer can tick.
8. Rendered examples: heading hierarchy, button states, form field states, card, and a section with
   real spacing between blocks.

The spec is the document a designer or a client opens. The tokens file is what a developer copies.
Keep both in sync, and regenerate both when either changes.
