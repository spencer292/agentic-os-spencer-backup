---
name: viz-frontend-slides
version: 1.1.0
description: >
  Generate production-quality HTML presentations applying brand design tokens
  and 20 codified design principles. Zero-dependency, self-contained HTML with
  keyboard/touch/wheel navigation, responsive viewport fitting, and accessibility.
  Supports style presets, PPT conversion, and PDF export.
  Triggers on: "build slides", "generate the deck", "render presentation",
  "slide design", "HTML deck", "convert PPT to HTML".
  Does NOT trigger for content structuring or research — that is 00-slides.
  Does NOT trigger for brand token extraction — that is mkt-visual-identity.
---

# Frontend Slides

Generate self-contained HTML presentations that pass 20 research-backed design checks.


## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}` to absolute paths set by the installer. Substitute these placeholders wherever they appear below.

## Outcome

A single HTML file (or named `{topic}-slides.html`) that:
- Runs entirely in the browser with zero dependencies
- Applies brand design tokens from `{brand_context}/visual-identity/tokens.json`
- Passes all 20 design principle checks (see `references/design-principles.md`)
- Includes keyboard, touch, wheel navigation + progress indicator
- Respects `prefers-reduced-motion` and WCAG contrast requirements
- Fits every slide in one viewport with no scrolling

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `{brand_context}/visual-identity/tokens.json` | full | Colours, typography, spacing (JSON tokens → CSS vars, see § Resolve Style) |
| `{brand_context}/voice-profile.md` | tone only | Copy tone for text-heavy slides |
| `context/learnings.md` | `## viz-frontend-slides` | Past feedback |

## Before Generating

Read these references:
1. `references/design-principles.md` — the 20 rules with numeric thresholds. All non-negotiable.
2. `references/style-presets.md` — viewport-safe CSS base, preset catalog, CSS gotchas.
3. Brand tokens from `{brand_context}/visual-identity/tokens.json` if available.

## Workflow

### 1. Receive Content

This skill receives structured content (outline with slide breakdown) from the orchestrator or directly from the user. Inputs:
- Structured outline with slide-by-slide content
- Presentation type (pitch, teaching, conference, internal update)
- Style preset or mood preference
- Brand tokens (from `{brand_context}/visual-identity/tokens.json` or inline)

### 2. Resolve Style

If the user specifies a preset name, use it directly.

If a mood is given, map it using the mood table in `references/style-presets.md`.

If `{brand_context}/visual-identity/tokens.json` exists, override preset colours and typography with brand tokens. The preset provides layout and animation feel; the brand provides visual identity.

`tokens.json` is JSON (not markdown) — map it to the deck's CSS custom properties:
- `colors.*` → `--bg` (`bg_light`/`bg_dark`), `--fg` (`text_on_light`/`text_on_dark`), `--accent`, `--muted` (`text_muted`), `--hairline` (`border_subtle`).
- `fonts.{display,body,bold,mono}.{family,weight}` → `--font-display` / `--font-body` / `--font-mono` plus their weights.
- `type_scale.{role}.{size,line_height,letter_spacing}` → the type ramp. Sizes are calibrated to the source `canvas` (often a 1080×1350 carousel), so treat them as a **relative ramp**: preserve the proportions and re-fit to the 16:9 slide viewport with `clamp()` (see Viewport Enforcement). **Ignore the `canvas` field** — slides set their own 16:9 viewport.
- `spacing.scale.*` → the 8pt spacing steps.

These are the same CSS-var names the style presets use, so brand tokens override the preset cleanly.

If nothing is specified, default to a neutral, professional style.

### 3. Generate the Deck

Output a single self-contained HTML file. Must include:
- Valid HTML5, no external JS (Google Fonts CDN is acceptable)
- Brand colours, type, accent from design tokens
- Semantic structure (`main`, `section`, `nav`)
- The viewport-safe CSS base from `references/style-presets.md`
- CSS custom properties for all theme values
- Presentation controller: keyboard, wheel, touch/swipe navigation
- Intersection Observer for reveal animations
- Progress indicator or slide index
- `prefers-reduced-motion` support

### 4. Pre-Emit Checklist

Every slide must pass all 20 checks from `references/design-principles.md`:

- [ ] #1 One idea per slide. Max one headline + one supporting block.
- [ ] #2 Glanceable in 3 seconds or less.
- [ ] #3 Max 7 visual chunks; ideal 3-5.
- [ ] #4 Whitespace at least 40%. Hero slides at least 60%.
- [ ] #5 5% safe-zone on every side.
- [ ] #6 Type on a modular scale (1.25-1.618).
- [ ] #7 Max 4 type sizes per slide, 6 across the deck.
- [ ] #8 Body at least 24px, title at least 48px.
- [ ] #9 Line-height 1.4-1.6 body, 1.05-1.2 display.
- [ ] #10 Line length max 60 characters.
- [ ] #11 WCAG contrast at least 4.5:1 body, aim 7:1.
- [ ] #12 60-30-10 colour split.
- [ ] #13 One accent per slide.
- [ ] #14 Never encode meaning by hue alone.
- [ ] #15 8pt grid for all spacing.
- [ ] #16 Align everything to one grid.
- [ ] #17 Proximity: related items within 16px, unrelated at least 48px.
- [ ] #18 Data-ink ratio at least 80% on charts.
- [ ] #19 F-pattern: headline + key visual top-left.
- [ ] #20 Pick one mode (presenter or document) and stay in it.

### 5. Viewport Enforcement

Hard gate — no exceptions:
- Every `.slide` uses `height: 100vh; height: 100dvh; overflow: hidden;`
- All type and spacing scale with `clamp()`
- Content that doesn't fit gets split into multiple slides
- Never shrink text below readable sizes to fix overflow
- Never allow scrollbars inside a slide

### 6. Deliver

1. Save the HTML file.
2. Open in the default browser using the OS-appropriate command:
   - **macOS:** `open file.html`
   - **Linux:** `xdg-open file.html`
   - **Windows:** `start "" file.html` (cmd) or `Invoke-Item file.html` (PowerShell)
3. Show file path, preset used, slide count, and theme customisation points.

## PPT Conversion

For PowerPoint input:
1. Use Python with `python-pptx` to extract text, images, notes. Detect the
   right Python invocation per platform: `python3` (macOS/Linux), `python` or
   `py -3` (Windows). Use `shutil.which` from a small wrapper if scripting it.
2. If unavailable, ask to install or fall back to manual workflow.
3. Preserve slide order, speaker notes, extracted assets.
4. After extraction, run the same style workflow.

## PDF Export

When requested, convert using the browser print-to-PDF approach or `puppeteer` if available.

## Anti-Patterns

- Generic purple-gradient hero slides
- System fonts unless intentionally editorial
- Bullet walls or scrolling code blocks
- Fixed-height content boxes that break on short screens
- Multiple accent colours on one slide
- Centring everything (F-pattern means top-left focus)
- Ad-hoc spacing values (13px, 27px — use 8pt grid)
- Mixing presenter and document mode in one deck

## Rules

- Brand tokens override preset colours/typography but not layout principles.
- The 20 design principles are non-negotiable quality gates.
- Viewport fitting is a hard gate — split slides, never scroll.
- One accent colour per slide. One mode per deck.
