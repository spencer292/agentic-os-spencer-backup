# Template Conventions

This is the style guide for Claude when writing `template.html` and `instructions.md` per ref. It is NOT a strict schema — it's the shape of conventions to follow so templates stay consistent across the brand.

If a convention here doesn't fit your specific ref, deviate with a comment explaining why. The conventions are defaults, not laws.

---

## File structure (1 template = 1 folder)

```
brand_context/templates/{pool}/{slug}/
├── ref.png             ← copy of the original ref (audit trail)
├── bg.png              ← cleaned via gpt-image-2 (OR absent if bg is pure CSS)
├── template.html       ← the actual template (this file's conventions below)
├── instructions.md     ← per-template spec sheet (see below)
└── preview.png         ← render with sample text (shown at approval)
```

The `{pool}` is platform-specific (`linkedin-carousel`, `instagram-carousel`, etc).
The `{slug}` is a kebab-case name you choose based on the ref's visual signature (e.g., `accent-color-numbered-chapter`, `magazine-cover-with-creator-pill`, `paper-typography-body`). Avoid baking specific text from the ref into the slug — slugs describe the LAYOUT pattern, not the content.

---

## template.html — anatomy

The minimum viable template.html:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="../_shared/styles.css">
</head>
<body>
  <div class="slide">
    <!-- BACKGROUND -->
    <!-- Use ONE of these patterns: -->
    <div class="bg" style="background-image: url('bg.png'); background-size: cover; background-position: center;"></div>
    <!-- OR for CSS-only bg: -->
    <!-- <div class="bg" style="background: var(--brand-bg-light);"></div> -->

    <!-- CHROME (masthead at top) — only if the brand has chrome.masthead.labels configured -->
    <div class="masthead">
      <span class="masthead-slot left">{{MASTHEAD_LEFT}}</span>
      <span class="masthead-slot center">{{MASTHEAD_CENTER}}</span>
      <span class="masthead-slot right">{{MASTHEAD_RIGHT}}</span>
    </div>

    <!-- TEXT ZONES — one div per zone. position:absolute by bbox. -->
    <div class="zone"
         style="left:4%; top:13%; width:92%; height:22%;
                font-family: var(--brand-display);
                font-size: 28cqw;
                font-style: italic;
                font-weight: 700;
                color: var(--brand-text-on-light);
                text-align: center;">{{HERO}}</div>

    <div class="zone"
         style="left:10%; top:8%; width:80%; height:4%;
                font-family: var(--brand-display);
                font-size: 10cqw;
                font-weight: 900;
                color: var(--brand-text-on-light);
                text-align: center;">{{SUBHEAD}}</div>

    <!-- PILL (if present in ref) -->
    <div class="pill"
         style="left:42%; top:50%; width:16%; height:6%;
                background: var(--brand-accent);
                color: var(--brand-text-on-dark);
                font-family: var(--brand-body);
                font-weight: 700;
                font-size: 2.4cqw;">{{CLAUDE_BADGE}}</div>

    <!-- CHROME (pagination dots at bottom) — only if brand has chrome.pagination -->
    <div class="dots">
      {{#DOTS}}<span class="dot {{#ACTIVE}}is-active{{/ACTIVE}}"></span>{{/DOTS}}
    </div>
  </div>
</body>
</html>
```

### Key conventions

1. **Canvas is 1080×1350** (4:5 LinkedIn carousel). All `cqw` units are % of canvas width.
2. **Positioning is `position:absolute` + percentages.** Use bbox `[x, y, w, h]` directly in inline styles. No flex magic, no zone classes. This makes positions self-evident and editable by hand.
3. **Brand vars are CSS custom properties** loaded via `_shared/styles.css`:
   - `--brand-display`, `--brand-body`, `--brand-micro` — font families
   - `--brand-text-on-light`, `--brand-text-on-dark` — text colors
   - `--brand-accent`, `--brand-accent-secondary` — accent colors
   - `--brand-bg-light`, `--brand-bg-dark` — bg colors
4. **Sample text is the default in Mustache slots.** When the renderer doesn't get a value for `{{HERO}}`, render_template.py uses the sample defined in `instructions.md > slots > HERO.sample`. So previews look like the ref out of the box.
5. **One `.zone` div per text region.** Don't combine. If two pieces of text live in different bboxes, they get different divs.
6. **Inline styles for bbox + per-zone overrides** (font-size, alignment, opacity). CSS classes for type-role visuals (`.zone`, `.pill`, `.masthead`, `.dots`). Mixing both is fine — inline is the per-zone exception, CSS is the per-brand default.
7. **Font-size uses `cqw` (container-query width).** This scales the text proportionally to the canvas regardless of render resolution. Avoid `px` for typography.
8. **Opacity goes on the zone div** as `opacity: 0.3` inline when the ref shows faded/ghostly text (e.g., a large background word at low opacity that anchors the slide visually).
9. **Z-stacking for depth illusions:** when text needs to appear OVER a foreground subject in the bg (e.g., a large display word crossing a person photographed in the cleaned bg), use `z-index: 10` on that zone. Default zones are z-index 1.

---

## AI image zones — what they are and how to declare them

An **AI image zone** is a rectangle in the template that holds an entire AI-generated composition at render time. The template provides the rectangle (position + size); the AI prompt generates everything inside it (subject, sketch overlays, supporting cards/callouts, decorative bg patterns, framing borders).

### What belongs inside an AI image zone vs as HTML template chrome

| Belongs in the AI image (one slot) | Belongs in HTML (template chrome) |
|---|---|
| The slide's subject (robot, cabinet, character, product) | Text zones (headline, body, captions) — Mustache slots |
| Sketch/marker overlay drawn on the subject | Brand-wide chrome from `tokens.json` (dot-grid corner, masthead, pagination, logo stamp) |
| Annotation card/callout with pill + text lines that supports the subject | Page indicator pill in a fixed brand corner |
| Arrow/leader line connecting subject and annotation | Framed body-card border (when defined as brand-wide in tokens) |
| Decorative bg pattern *inside* the illustration zone (graph paper, dots) | Slide bg color (`var(--brand-bg-light)` / `--brand-bg-dark`) |
| Hairline border *bounding* the illustration zone | — |

**The boundary test (THREE-WAY — the binary above is incomplete):** for each element ask two questions:

1. **Does it vary per post?** No → **HTML brand chrome** (fixed, unchanged every slide: masthead, creator wordmark, decorative marks, page indicator).
2. **If it varies — is it a third-party tool/brand logo, or the photographic/illustrated subject?**
   - Third-party tool/brand logo of *whatever the post is about* → **`brand-badge`** (HTML, but per-post — see below).
   - The photographic/illustrated subject → **AI image content** (generated inside the image zone).

### Third category — `brand-badge` (the per-post logo slot)

A `brand-badge` holds the logo of the **tool/brand the post talks about**. It is NOT there because the template is "about" that tool — it is there because the slot receives the logo of whatever the post is about. So it is HTML (a crisp vector mark) yet it **varies per post** — it fails the old binary's "appears UNCHANGED" test while still being HTML, not AI content.

Three distinct logo roles — do not conflate:

| Role | Varies? | How declared |
|---|---|---|
| **creator brand chrome** (the creator's own wordmark/logo) | fixed | HTML chrome, from `tokens.json` |
| **decorative mark** (a brand-owned ornament) | fixed | HTML chrome / a `moves.md` move with an original asset |
| **`brand-badge`** (third-party tool/brand the post is about) | **per-post** | HTML slot `{{BRAND_LOGO_PATH}}`, resolved per post |

**Briefing / inventory annotation for a brand-badge:**
```yaml
- kind: brand-badge
  slot: BRAND_LOGO_PATH
  variability: per-post
  resolution: commons lookup (by the post's subject tool) → fetch_icon.py → plain text
  desc: "logo of the tool/brand the post talks about"
  example: "Claude → commons/ai/claude.svg"   # canonical SUBJECT only — NOT the fixed slot value
```

The `example` is the **canonical subject** used for the preview, never the locked value. A post about Notion fills `BRAND_LOGO_PATH` with `commons/productivity/notion.svg`; a post about GitHub fills it with `commons/social/github.svg`; etc.

**The slot MUST end in `_PATH`.** The renderer only inlines image paths that arrive through a Mustache slot if the slot name ends in `_PATH` (`embed_paths_as_data_uris` keys on that suffix and runs BEFORE Mustache fill; `_inline_relative_urls` only catches LITERAL paths in the raw HTML). A badge slot named `BRAND_LOGO` (no `_PATH`) renders BROKEN. The path value may be absolute, template-dir-relative (`assets/x.svg`), or brand_context-relative — all three resolve.

**Placement — never a hardcoded mock, never over the subject:**
- **Default (crisp):** HTML overlay `<img src="{{BRAND_LOGO_PATH}}">` at the badge bbox; per post the path is resolved by the commons→fetch→text chain. Keeps the logo vector-crisp.
- **Position the overlay bbox in a CLEAR zone**, not where the scene's subject lands. A full-bleed image template has a focal subject (a seated figure's head, a face) — a centered badge bbox collides with it (the Claude badge landed on the figure's head on the agent-view cover). When the template carries a full-bleed `image_zone` with a likely-centered subject, place the badge in a margin/corner or the calm upper band — never dead-center over the focal area. State the safe zone in the Template Card.
- **In-scene integration (better composition):** when the badge must sit *within* the photographic scene (so any fixed overlay position would collide with the subject), pass the resolved `BRAND_LOGO_PATH` as an ADDITIONAL `--input-image` to the edit-from-ref generation and instruct the prompt to place it naturally relative to the subject (on the laptop lid, a wall, a held card). Trade-off: the model may redraw the mark (less crisp) — use only when overlay reads as "pasted on". This is the deliberate exception to "no logos in the photo" (that rule blocks *hallucinated* logos; a `brand-badge` is an explicit, provided input).

Never bake the canonical example (e.g. Claude) as a fixed `<img>` — that is the "mocked badge" failure: the template would show the same tool on every post.

### `[ai-image-zone:N]` comment block — format

Every AI image zone in `template.html` requires a matching `[ai-image-zone:N]` comment block at the top of the file (above `<style>`, inside one HTML comment). One block per zone, numbered from 1.

**Structural principle: the canonical ref IS the composition guide AND the generation input.** The block declares a `generation_route`; the prompt states ONLY the delta. There are three routes (see `ssc-template-builder.md` Step 3 for the full decision tree):

- **Route A — `edit-from-ref`** *(default — image-zone with a variable subject):* the ref (`assets/ref-canonical.png`) is passed as `--input-image`; `prompt_delta` describes only the per-post subject + the template's fixed style. Generated per post.
- **Route C — `texture-extract`** *(textured bg, no variable subject):* `bg.png` is generated ONCE at template creation by stripping the ref to its background texture. Fixed template asset — NO per-post generation.
- **Route B — pure CSS** *(solid-color bg, no image-zone):* needs no block at all.

**Route A — `edit-from-ref`:**
```
<!--
[ai-image-zone:1]
slot_path: PHOTO_MAIN_PATH                                # Mustache slot the rendered image fills
generation_route: edit-from-ref
ref_input: assets/ref-canonical.png                       # the canonical family ref → --input-image
brand_style_source: visual-identity/ai-image-style.md     # brand contract (palette, lighting, medium)
output_aspect: 4:5

prompt_delta: |
  Same composition and layout as the reference. Change the subject to: {PHOTO_SUBJECT}.
  Keep <template FIXED style — grade / lighting / treatment, deferring to brand_style_source>.
  Keep the subject <position — e.g. seated lower-center>.
  No text, no logos, no saturated color. Portrait 4:5.

variables:
  - name: subject
    slot: PHOTO_SUBJECT                                   # Mustache slot ssc-designer fills
    description: the per-post subject that carries the scene
    example_values:
      - "two founders seated reviewing documents"
      - "a solo founder in a tailored jacket reviewing printed pages"
[/ai-image-zone]
-->
```

**Route C — `texture-extract`:**
```
<!--
[ai-image-zone:bg]
generation_route: texture-extract
ref_input: assets/ref-canonical.png
output: bg.png
generated: once-on-template-creation
[/ai-image-zone]
-->
```

### How the runtime uses these blocks

1. `ssc-designer` plans the slide and fills the Mustache slot values for the zone's `variables` (e.g., `AI_SUBJECT="filing cabinet"`, `ANNOTATION_LABEL="Memory"`).
2. `ssc-image-generator` parses every `[ai-image-zone:N]…[/ai-image-zone]` block in `template.html` via regex. For each:
   - Reads `generation_route` and branches:
     - `edit-from-ref` → load `brand_style_source` cues, substitute every `{var}` in `prompt_delta`, then call the image API with `--input-image {template_dir}/{ref_input}` (the ref carries the composition; the delta carries the subject). GPT only — it is the script that supports `--input-image`.
     - `texture-extract` → NO per-post call; `bg.png` already exists as a fixed template asset. Skip generation for this zone.
     - *(legacy, no `generation_route`)* a block with `composition_prompt` → substitute `{var}`s, concatenate `brand_style + composition_prompt_filled`, generate txt2img. Kept only for un-migrated templates.
   - Calls the image API at the `output_aspect` ratio; writes the result to a per-post asset path and populates `slot_path` (`PHOTO_MAIN_PATH`) in the render data.
3. `render_template.py` renders the template with the AI image filled into its slot via standard Mustache + data-URI inlining.

### Rules

- **One block per image slot.** Two image slots → two blocks (`:1`, `:2`).
- **No prompt content lives in `manifest.json`.** Manifest declares slots (input contract). Composition prompt lives where the layout lives — in `template.html`.
- **No prompt content lives in a sidecar `.prompt.md` file.** One template = one file. The comment block keeps prompt and HTML next to each other so they evolve together.
- **No brand-wide style duplication.** Medium, lighting, palette, accent rules live in `visual-identity/ai-image-style.md` only.
- **No hardcoded per-post subject.** Use `{var}` placeholders. If `prompt_delta` names the ref's actual subject ("two elderly men reading newspapers") instead of `{PHOTO_SUBJECT}`, the template is broken — every post generates the same image.
- **The delta is ONLY the delta.** `prompt_delta` never re-describes the composition (zones, proportions, focal points) — the ref carries it via `--input-image`. Re-describing the composition in text is the exact failure mode `edit-from-ref` exists to prevent.
- **`clean_ref` / texture-extract is Route C only.** Never use it to produce a variable subject — that is Route A (edit-from-ref).
- **Every template keeps `assets/ref-canonical.png`.** It is the composition anchor and the `--input-image`. Never deleted.

---

## instructions.md — anatomy

This is the **spec sheet** of the template. Both human-readable (user opens and understands the template) and machine-readable (render_template.py uses the slot definitions).

```markdown
# Template: <slug>

source_ref: ../../../visual_refs/<ref-name>.png
canvas: 1080x1350 (4:5 LinkedIn carousel)
strategy: html-overlay   # OR ai-edit-fallback OR mixed

## Inventory

The strict enumeration of what's visible in the ref. Validator (`validate_brand.py`)
reads this block to enforce Gates G1 (decision-reason) and G3 (photo-zone presence).
Write this BEFORE template.html — without enumeration, drift happens.

\`\`\`yaml
ignore_screenshot_chrome:
  - carousel-dot-indicators-at-very-bottom-edge (S1 rule)
  - browser-scrollbar-on-right
  - left-right-carousel-arrows

bg_treatment:
  kind: textured-paint  # See "Background route decision" section. Values:
                        #   scene-with-figures (Route 1) — people/products/photo backdrop
                        #   textured-paint     (Route 3) — analog texture CSS CAN'T reproduce
                        #   pure-typography    (Route 2) — text on simple bg CSS CAN reproduce
                        #   solid-color        (Route 2) — flat single color
  has_baked_overlays: true
  needs_clean_ref: true
  cleaned_bg_path: bg.png

# G3 — set requires_photo_zone:true when ref has photo, silhouette, cutout,
# scene-with-figures, or full-bleed POV photo. If true, template.html MUST contain
# at least one element with class containing "photo-zone", id starting with "photo-",
# or data-zone="photo". If false AND ref carries photo elements, set zone_skip_reason
# with a non-banned reason (validator rejects cost/easier/faster/CSS-only/etc).
requires_photo_zone: true
photo_zones:
  - kind: silhouette-shadow  # OR: full-bleed-bg, cutout, embedded-photo, hero-overlay
    bbox: [10, 30, 80, 60]
    source: clean_ref         # OR: ai-gen-on-demand, user-uploaded-asset
    notes: "low-opacity silhouette of seated figure behind body text"

elements:
  - name: numeral-5
    bbox: [5, 8, 12, 11]
    type: pill
    shape: rounded-square  # NOT circle, NOT rectangle — observe carefully
    content: "5"
    decision: slot          # render via HTML overlay; NUMERAL slot
    notes: "white bg, coral text, ~1:1 aspect ratio"

  - name: italic-preamble
    bbox: [5, 24, 90, 8]
    type: text
    content: "<italic preamble sample>"
    decision: slot          # HERO_ITALIC slot
    style_observed:
      font_appears: italic-serif
      color: white
    brand_font_resolution:
      use: "Inter, italic"
      reason: "Brand declares no italic-serif; using Inter italic preserves editorial cadence without inventing a font"

  # Example of a skip-like decision — G1 requires >=20-char reason that is NOT
  # one of: cost / easier / faster / skip-photo / CSS-only / deterministic / save-API
  - name: decorative-grunge-splatter
    bbox: [80, 5, 18, 12]
    type: vector
    decision: skip
    reason: "User chose minimalist variant of the brand; decorative splatter is removed from all body slides per brand variant rules."

chrome_observed:
  masthead_visible_in_ref: false
  pagination_dots_visible_in_ref: false
  page_indicator_visible_in_ref: true
\`\`\`

## Visual summary

One paragraph: what does this template look like? When would I use it?

Example: "Coral solid bg with a numbered pill (top-left), display-italic + display-bold headline (upper-middle, left), body paragraph (middle), and a brand-accent CTA pill (bottom). Use for numbered insight slides in a series carousel."

## Slots

- **NUMERAL** — single digit, the slide index in a numbered series (e.g., "5")
  - bbox: 4% 8% 12% 10%
  - style: display-bold, 12cqw, white on coral
  - sample: "5"

- **HERO** — italic preamble
  - bbox: 4% 22% 92% 7%
  - style: display-italic, 8cqw, white on coral, left-align
  - sample: "<italic preamble sample>"

- **HEADLINE** — main bold display
  - bbox: 4% 30% 92% 11%
  - style: display-bold, 9cqw, white on coral, left-align
  - sample: "<bold headline sample>"
  - max_chars: 60 (auto-shrink to 7cqw if longer)

- **BODY** — body paragraph
  - bbox: 4% 47% 92% 22%
  - style: body, 2.4cqw, white on coral, left-align, supports `<br>` and `<strong>`
  - sample: "<body paragraph sample…>"

- **CALLOUT_PILL** — bottom CTA
  - bbox: 18% 88% 64% 8%
  - style: pill, brand-accent fill, white text, display-bold 2.8cqw
  - sample: "<CTA punchline sample>"

## Strategy notes

- All zones are html-overlay. No ai-edit needed.
- Chrome injected: masthead (top, 3 slots) + carousel dots (bottom).
- Bg is solid coral via CSS — no bg.png file.

## Fixed elements (not slot-editable)

- The coral bg color comes from the brand's accent color
- The numeral pill shape (circle) is hardcoded

## Possible future variations

- Allow user to override the pill fill color (currently locked to accent)
- Allow the body sample text to be paraphrased per slide
```

### Strategy field values

- **`html-overlay`** — all text zones render as HTML divs over bg.png (or CSS bg). Most common.
- **`ai-edit-fallback`** — html-overlay by default, but if user rejects the preview, re-render via `gpt-image-2 edit` on bg.png with the slot text baked in (for cases like text on a blackboard, where HTML overlay looks flat).
- **`mixed`** — some zones html-overlay, others ai-edit. Annotate per-zone in the slot description.

### Bbox notation

Always `x% y% w% h%` (4 numbers, % of canvas). Both in instructions.md (`bbox: 4% 22% 92% 7%`) and template.html inline style (`left:4%; top:22%; width:92%; height:7%`). Same numbers.

---

## Background route decision (apply BEFORE writing inventory)

**Pure CSS is the EXCEPTION, not the default. ANY sign of texture means it's NOT CSS anymore.**

This rule is the most-violated decision in the pipeline. Sub-Claude tends to look at a ref, see "mostly text, some bg noise", and decide CSS noise filters can replicate it. They almost never can — and even when they sort-of can, the result reads as digital sterile noise instead of the brand's analog/editorial signature.

The acceptance test for pure-CSS routes (`pure-typography`, `solid-color`) is **far stricter** than it sounds:

- ✅ **`solid-color` only when the bg is 100% one uniform color.** Eyedropper at 5 different spots returns identical hex. Zero gradient, zero noise, zero grain, zero edge fading. Examples: a flat coral wall, a clean white card with crisp edges, a solid black panel.
- ✅ **`pure-typography` only when the bg is solid OR a simple flat gradient with zero noise.** Like a Tailwind preset gradient. If you can see ANY grain when zoomed, it's not this route.
- ❌ **Paper-grain, scan lines, photocopy feel, dust marks, fading edges, halftone print, aged/torn paper, organic non-uniform noise → NEVER pure CSS.** No matter how clever the `feTurbulence` filter, CSS produces uniform DIGITAL noise. The brand's signature is the ANALOG directional artifacts. They look different. They feel different. CSS cannot replicate them.
- ❌ **Anything with people, products, scenes, photos, illustrations, screenshots → never pure CSS** (that's Route 1).

**Decision table.** Walk top-to-bottom; the FIRST matching row wins. Pure-CSS routes are at the bottom because they're rare.

| If the ref shows … | Then kind = | Route | clean_ref.py? |
|---|---|---|---|
| people, products, scene objects, building, brick wall, photo backdrop, silhouette | `scene-with-figures` | **1** | yes — clean the scene |
| paper-grain, scan lines, photocopy artifacts, dust marks, fading edges, halftone print, aged/torn paper, organic non-uniform noise — **any sign of texture** | `textured-paint` | **3** | **yes** — bg.png IS the texture |
| (rare) flat single color, no texture, no gradient, eyedropper confirms 100% uniform | `solid-color` | **2** | no — `background: var(--brand-bg)` |
| (very rare) clean flat color OR simple gradient, **zero noise/grain visible at any zoom level** | `pure-typography` | **2** | no — CSS only |

**The CSS-reproducibility test, sharpened.**

Don't ask "could CSS get close?". Ask:

> Is the bg 100% one solid color (or a simple gradient with literally zero noise)? Zoom into the ref at 200%. Do you see ANY pattern, ANY variation, ANY grain? If you see anything other than the same color, it's NOT a pure-CSS route.

**Default for ambiguity = `textured-paint`.** When you're not sure, you're wrong about it being CSS. Bias hard toward Route 3.

**Cost of choosing wrong:**
- Wrong CSS → wrong (your brand-signature texture is gone forever)
- Wrong textured-paint → $0.04 spent on a clean_ref call that produced a flat bg you could have done in CSS

The asymmetry says: when in doubt, choose textured-paint. The downside of false-textured is a few cents. The downside of false-CSS is the brand reads off-brand on every slide.

**Failure mode this prevents.** When refs carry paper-grain texture with silhouette photos behind body text and get classified as `pure-typography` ("the text is the main thing, bg is just texture, CSS noise will do it"), the templates ship as 100% CSS — brand-signature paper grain gone, silhouettes gone, output reads as a generic SaaS deck. The few cents saved on AI gen destroy the entire visual identity. **This is exactly what this section exists to prevent.**

---

## When the ref has a photo / person / scene (scene-template route)

1. **clean_ref.py** generates `bg.png` (cleaned via gpt-image-2 edit, with your prompt).
2. template.html uses `background-image: url('bg.png');`.
3. Text zones overlay on top of bg.png.

Worked example for <ref-name> (the figures in the ref + <creator-tool pill> + system text):
- bg.png = the figures in the ref + brick wall, cleaned (your prompt removed "<a methodology name>" text, removed <creator-tool pill>, repainted orange accent → brand coral)
- HERO zone over the upper-half ("<a methodology name>" can be re-typed by user)
- CLAUDE_BADGE pill div positioned between the figures (16% × 6%, center)

## When the ref is pure typography on texture/color (no scene)

1. NO clean step. Skip clean_ref.py.
2. template.html uses CSS bg: `background: var(--brand-bg-light);` or layered gradient + noise.
3. Text zones overlay on the CSS bg.

Worked example for <ref-name> (coral wall, numbered pill, headline + body + CTA pill):
- bg = `background: var(--brand-accent);` (CSS solid)
- 5 zone divs for: numeral pill, hero italic, headline bold, body, CTA pill

## When the ref needs a complex bg you can't approximate in CSS (textured paper that pure SVG noise doesn't capture)

1. clean_ref.py with prompt that ASKS for the texture: "Generate a clean version of this paper-grain background. Remove all text. Preserve the warm cream tone and the subtle grain noise. Output 1080x1350."
2. template.html uses `background-image: url('bg.png');` even though there are no scene subjects — bg.png IS the texture.

---

## Chrome auto-inject (STRICT — honors tokens.json verbatim)

Chrome blocks (masthead row at top, pagination dots at bottom, optional brand wordmark) are CONDITIONAL based on the brand's `tokens.json > chrome` config AND the per-template `chrome_observed_in_ref` flag in the inventory.

**The matrix:**

| `tokens.chrome.masthead.enabled` | `chrome_observed.masthead_visible_in_ref` | Result in template.html |
|---|---|---|
| true | true | masthead `<div>` INCLUDED with `{{MASTHEAD_LEFT}}` / `{{MASTHEAD_CENTER}}` / `{{MASTHEAD_RIGHT}}` slots |
| true | false | masthead `<div>` ABSENT — this specific ref doesn't carry masthead even though brand has it globally |
| false | true | masthead `<div>` ABSENT — brand globally disabled it; ignore ref evidence |
| false | false | masthead `<div>` ABSENT |

Same matrix for `chrome.pagination` ↔ `chrome_observed.pagination_dots_visible_in_ref`.

**Critical rules:**

- **When chrome is disabled, the `<div>` is REMOVED from template.html — not emptied with placeholder text.** A `<div class="masthead"></div>` with empty content still occupies layout space and reads as a broken chrome bar. If chrome is off, the markup is GONE.
- **NEVER hardcode chrome content** like `<div class="masthead"><span>GROWITHALEX</span></div>`. Always use `{{MASTHEAD_*}}` Mustache placeholders that read from tokens at render time. Hardcoded chrome means changing the brand name requires editing every template.
- **The matrix overrides ref observation.** If `tokens.chrome.masthead.enabled:false`, the template MUST NOT render masthead — even if the ref is a screenshot that clearly shows a 3-slot masthead row at the top. The user opted out at brand level; that decision wins.
- **Carousel viewer UI ≠ slide chrome.** Carousel-viewer pagination dots, arrows, and scroll-bars at the very bottom edge of LinkedIn/Instagram screenshots are screenshot artifacts, NOT slide design. Set `chrome_observed.pagination_dots_visible_in_ref: false` for these — they were the viewer's UI, not the slide's content.

**Validator enforcement (Gate G6):** `validate_brand.py --template-dir <path>` checks:
- If `tokens.chrome.masthead.enabled:false` AND template.html contains `<div class="masthead">` (uncommented) → FAIL
- If `tokens.chrome.pagination:null` AND template.html contains `<div class="dots">` (uncommented) → FAIL
- If template hardcodes brand text inside masthead/pagination (no Mustache placeholders) → FAIL

If the user later wants a brand-wide chrome change, edit `tokens.json > chrome` ONCE; every template that uses Mustache placeholders picks it up at next render.

---

## Anti-patterns (these have all happened in production — do not repeat)

### Brand-fidelity violations

- ❌ **Adding a font that is NOT in tokens.json > fonts.** If the brand declares `Inter Tight + Inter`, you MUST NOT add Fraunces, Playfair, Geist, etc. — even if the visual ref appears to use one. The ref is from OTHER brands; the brand's font catalog is final. If the ref shows italic-serif but the brand only has `Inter`, use Inter italic (`font-style: italic` on the Inter family) — never substitute a serif. **Why:** adding a serif font to a brand whose tokens only declare sans-serif produces "almost-on-brand" output that reads as a different studio's work.

- ❌ **Copying elements between sibling templates.** Each template extracts from EXACTLY ONE ref. If ref-A has a CTA pill and ref-B does not, template-B does NOT get a CTA pill — no matter how much it would "complete" the design. **Why:** copying a CTA pill from one template into another whose ref had no such pill silently invents chrome the brand never used.

- ❌ **Adding chrome from `tokens.json > chrome` when this ref doesn't show it.** The brand may have a 3-slot masthead declared globally, but a specific ref might NOT have one. Chrome auto-inject is OFF by default per template; opt-in by adding `<!-- chrome: masthead -->` and `<!-- chrome: dots -->` markers in template.html only when the ref clearly carries them.

- ❌ **Treating carousel-viewer UI as slide chrome.** The pagination-dot row at the very bottom edge of a LinkedIn/Instagram screenshot is **the viewer's UI, not the slide's design**. S1 rule (clean-prompt-patterns.md) says ignore. **Why:** rendering pagination dots the ref never had bakes the carousel viewer's progress indicator — accidentally captured in the user's screenshot — into the slide design.

- ❌ **Classifying paper-grain / scan / photocopy textures as `pure-typography`.** The texture IS the brand signature — CSS noise filters (`feTurbulence`, fractal, gradients) produce uniform digital noise, NOT the organic directional artifacts (scan lines, fading edges, dust marks) of an analog scan. Apply the CSS-reproducibility test in "Background route decision" above: if 5-10 lines of CSS can't get within 90% of the ref's bg, it's Route 3 (`textured-paint`), not Route 2. **Why:** classifying an editorial paper-grain ref as `pure-typography` + CSS noise loses the entire editorial-zine signature — it renders as generic gray noise on white.

- ❌ **Recreating photorealistic / AI-illustrated subjects using CSS or SVG shape primitives.** When the ref's main subject is a 3D-rendered character, a photorealistic product, an AI-generated illustration, or anything that fails the **Subject Reproducibility Test** (`ssc-template-builder.md > Step 0`: "could I recreate this with ≤10 shapes WITHOUT losing recognizability?"), the template MUST use an `<img>` slot — never `<svg>` paths or nested `<div>` rectangles. **Why:** recreating a photorealistic 3D-rendered subject (say, a robot in a business suit with red hand-drawn sketch annotations) out of grey `<div>` rectangles, circle eyes, and a line antenna destroys the brand-signature photorealism and drops the sketch overlay — the result is a child's drawing in place of the brand's editorial 3D aesthetic. Rule: if the subject's source is AI gen / photo / 3D render, the template carries a `<img src="{{PHOTO_*_PATH}}">` slot AND `manifest.json[id].ai_image_prompt` populated from `ai-image-style.md > prompt_template`. The render pipeline (HYBRID_AI v3 in `render_template.py`) fills the slot at render time.

- ❌ **Generating only PURE_CSS templates when `moves.md` catalogs photo moves.** If any move in `moves.md` has a `<!--meta-->` block with `image_bearing: true` (silhouette, cutout, photo-overlay, scene-backdrop, etc.), the template manifest MUST contain ≥1 ready template with a photo-zone slot. Documenting a move you can't render is worse than not declaring it — downstream agents (`ssc-designer`) filter templates by move support, find zero matches, and fall back to generic output. **Why:** when refs with photo/silhouette/cutout elements get compressed to PURE_CSS typographic templates because "deterministic is cheaper", a move like "Desaturated silhouette photography" declared in moves.md ends up with zero supporting templates — and output goes off-brand on every photo slide. **Gate G2** enforces this mechanically — but the rule applies even before the gate trips: if you find yourself thinking "I'll skip the photos to keep it CSS-only", STOP.

### Process violations

- ❌ **Marking an element `decision: skip` or `decision: simplify` with a cost/speed-driven reason.** Banned tokens (caught mechanically by Gate G1): `cost`, `cheap`, `expensive`, `easier`, `faster`, `quick`, `skip-photo`, `CSS-only`, `deterministic`, `save-API`, dollar/cent amounts. The element's decision drives whether your template captures the brand's signature or strips it. Cost is NOT a brand-fidelity reason. Acceptable reasons reference a brand-level rationale: "user chose minimalist variant", "element is screenshot chrome not slide design", "ref was corrupted in that region". Minimum reason length: 20 chars. **Why:** marking a silhouette photo behind body text as `decision: skip` with `reason: "deterministic is cheaper than clean_ref"` ships a template without the silhouette — the brand-signature feel is gone, and the few cents saved destroy the brand-fidelity payoff.

- ❌ **Writing template.html without first writing the `## Inventory` block in `instructions.md`.** Without enumeration, drift happens — you'll add things "that look like they belong" but aren't in the ref. The inventory is the contract: if an element isn't in the inventory, it CAN'T be in the template.html.

- ❌ **Rendering preview without composing a `_comparison.png` (ref + preview side-by-side).** Reading ref and preview separately misses obvious mismatches because the eye averages between reads. Compose the side-by-side, then read THAT.

### Hard-rule violations (visual)

- ❌ Building complex flex/grid layouts to "be responsive". The canvas is fixed 1080×1350. Use absolute positioning.
- ❌ Hardcoding hex colors in template.html. Always use `var(--brand-*)`. The brand kit substitutes at render.
- ❌ Defining new CSS classes per template. Use the shared ones (`.zone`, `.pill`, `.masthead`, `.dots`). If a template needs something the shared classes don't cover, propose adding to `_shared/styles.css` (one-time addition, then reused).
- ❌ Re-extracting fonts from the ref. Fonts come from brand_kit, period.
- ❌ Treating instructions.md as just docs. The render_template.py reads it for slot defaults and strategy routing.

---

## Validation gates (single validator runs all four)

One script enforces every mechanical gate:

```bash
# Per-template gates G1 (reason) + G3 (photo-zone contract)
uv run .claude/skills/mkt-visual-identity/scripts/validate_brand.py \
    --template-dir brand_context/templates/{pool}/{slug}/

# Brand-level gates G2 (moves vs templates) + G4 (moves.md meta sanity)
uv run .claude/skills/mkt-visual-identity/scripts/validate_brand.py \
    --brand-context brand_context/

# Combined pre-promotion check
uv run .claude/skills/mkt-visual-identity/scripts/validate_brand.py \
    --brand-context brand_context/ \
    --template-dir brand_context/templates/{pool}/{slug}/
```

**G1** reads the `## Inventory` YAML in `instructions.md`. Any element with `decision: skip` / `simplify` / `drop` / `omit` requires a `reason:` ≥20 chars that does NOT match the banned regex (`cost`, `cheap`, `easier`, `faster`, `quick`, `skip-photo`, `CSS-only`, `deterministic`, `save-API`, dollar/cent amounts).

**G3** also reads the `## Inventory` block, then matches `template.html` against three photo-zone patterns:
- `class` attribute containing `photo-zone`
- `id` attribute starting with `photo-`
- `data-zone="photo"`

If `requires_photo_zone: true`, ≥1 match is required. Inconsistencies also fail: `scene-with-figures` bg + `requires_photo_zone:false`; populated `photo_zones[]` with the flag off; photo elements in the ref + flag off + no `zone_skip_reason`.

**G4** parses `brand_context/visual-identity/moves.md` looking for `<!--meta ... -->` HTML comment blocks under each `## N. ...` section heading. Each block must parse as YAML and provide at minimum `name` (kebab-case slug) + `image_bearing` (bool). When `image_bearing: true`, `required_zone_types` must be a non-empty list of recognized tokens.

**G2** cross-checks: every `image_bearing: true` move must have ≥1 template (status `ready`, or `ready+draft` with `--include-draft`) whose `supports_zone_types` intersects the move's `required_zone_types`. The fallback for manifests without `supports_zone_types`: any template with `image_zone != "none"` is treated as supporting `photo-zone`.

The art-director QA gate calls the per-template invocation before composing the side-by-side preview. The brand-level invocation runs in Phase 5.5 (between Phase 5 template-builder loop and Phase 6 PDF regen). The failure mode where refs with photo/silhouette/cutout get compressed to PURE_CSS templates is now structurally blocked.

### ai-image-style.md format *(brand AI image contract)*

`{brand_context}/visual-identity/ai-image-style.md` captures the brand's AI image style ONCE per brand. Subsequent templates and `ssc-image-generator` content runs read this file to produce visually-consistent AI imagery across the brand.

Same pattern as `moves.md`: human-readable markdown with one `<!--meta-->` HTML comment block holding the machine-readable contract.

```markdown
# AI Image Style — <Brand Name>

<!--meta
medium: photorealistic-3d-render  # OR: flat-illustration | watercolor | sketch | mixed
palette:
  - "#FFFFFF (bg)"
  - "#888888 (subject base)"
  - "#E2473D (accent)"
lighting: studio-flat-soft   # OR: dramatic | natural | none
subject_treatment: isolated-on-light-bg   # OR: full-bleed | inset-with-shadow | cutout
typical_subjects:
  - robot
  - tech-object
  - character
aspect_ratio: "1:1"   # most-used; per-template can override
prompt_template: "Photorealistic 3D-rendered {subject}, metallic textures, business attire when applicable, isolated on light grey background, soft studio lighting, no harsh shadows, square aspect"
annotation_overlay:
  enabled: true
  style: hand-drawn-sketch
  color: var(--brand-accent)
-->

## Style description

One paragraph describing the brand's AI image aesthetic in plain prose. What makes a slide image read as "on-brand"? What does the eye notice?

## Generation guidelines

- Subject: always include `{subject}` placeholder when generating; fill per-slide.
- Brand cues: <fixed palette / lighting / framing rules>
- What to NEVER include: <e.g., depth-of-field, harsh shadows, gradient backgrounds>
- Annotation: apply the brand's hand-drawn sketch overlay AFTER AI gen completes. It's a MOVE (in `moves.md`), not part of the AI prompt.

## Per-template overrides

Templates may override `aspect_ratio` or `subject_treatment` via `manifest.json[id].ai_image_prompt`. Other fields are brand-fixed.
```

**Who writes it:**
- `ssc-template-builder` Step 4 Case D-main — on FIRST encounter of an AI illustration ref. Inferred from vision analysis of that ref. Subsequent refs validate against it.
- User can hand-edit anytime. The skill never silently overwrites — divergent refs surface a popup.

**Who reads it:**
- `ssc-template-builder` (next templates herdam o estilo)
- `ssc-image-generator` (content gen uses `prompt_template` filled with the slide's subject)
- `generate_brand_bible_pdf.py` (PDF includes an "AI image style" page in v2 regen)

**Why it exists:** without this artifact, every template + every content run re-infers the style from scratch — drift on every slide. With it, the brand has ONE source of truth for "what AI images on this brand look like".

### moves.md meta-block format

The brand's `moves.md` carries structured metadata inline — one `<!--meta-->` block per move section, right under the heading:

```markdown
## 1. Red Hand-Drawn Sketch Overlay *(THE signature move)*

<!--meta
name: red-hand-drawn-sketch-overlay
image_bearing: true
required_zone_types: [photo-zone, annotation-overlay]
keywords: [sketch, annotation, hand-drawn, arrow, circle]
-->

**Universal principle implemented:** functional decoration ...
```

Allowed `required_zone_types` tokens (kept in sync with the validator's whitelist):

| Token | Means |
|---|---|
| `photo-zone` | A slot for a real or AI-generated photo. |
| `silhouette-bg` | Background photo treated as silhouette (low-opacity, behind text). |
| `cutout` | Photo with bg removed, placed as a visual object. |
| `hero-overlay` | Hero slide with photo behind headline. |
| `illustration-overlay` | AI-generated illustration overlaid on the slide. |
| `annotation-overlay` | SVG annotation paths (sketches, arrows, circles) drawn on top. |
| `icon-zone` | Brand/tool/product logos rendered as SVG icons. |
| `text-zone` | Pure text content. |
| `pill` | Rounded callout pill. |
| `callout-card` | Framed inset card. |
| `page-indicator` | Carousel slide number indicator. |
| `masthead` | Top-edge editorial chrome row. |
| `dots` | Pagination dots row. |

A move is `image_bearing: true` when its rendering REQUIRES a non-text visual asset. Test: would the move still read correctly if the slide had ZERO photos / illustrations / screenshots? If yes → `image_bearing: false`. If no → `image_bearing: true`.
