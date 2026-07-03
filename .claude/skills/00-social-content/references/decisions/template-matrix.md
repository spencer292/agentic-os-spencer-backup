# Decision: Template id (pool-based)

**Owner:** `ssc-designer` (v2.0.0). The orchestrator no longer reads this file at execution time — the designer consults it during Phase 5.3b (slide outline construction). The orchestrator only reads it when interpreting what the designer returned.

**Stage 2 update (v2.0.1+):** the designer no longer picks a `template_family + layout` pair. The orchestrator always passes a `template_pool` (e.g., `"linkedin-carousel"`), and the designer picks a specific `template_id` from that pool's `manifest.json`. Pools live at `brand_context/templates/<pool>/manifest.json` (per-brand override) with `viz-image-gen/references/templates/<pool>/` as fallback for in-flight migrations. The legacy "Communication shape → Template family" mapping is now "Communication shape → candidate template_ids".

How the pipeline chooses **which template_id** to render each slide with. The template_id controls layout structure (where the text sits, whether there's an image zone, what kind of CTA the last slide uses). Palette, typography, and visual rhythm are decided **per post** by Phase 5.0 "Content Inference" — they no longer come from a fixed style preset.

## The core question

For each slide, ask:

> **"What does this slide need to communicate — and what kind of structure does that communication require?"**

| Communication shape | Candidate template_ids (linkedin-carousel pool) |
|---|---|
| Words ARE the message (statement, manifesto, single insight) | `photo-overlay-text` *(solid dark bg, large type, cross-imported from photo-overlay)*, `editorial-news-layout-statement` (giant typography, no image), `hero-typographic` (pure typo hook), `body-pullquote`, `body-data-stat` (number IS the visual) |
| Real image carries the punch (photo, logo, screenshot, product shot) | `photo-overlay-front` for slide 1; `photo-overlay-content`, `editorial-news-image-top`, `editorial-news-image-bottom`, `hero-photo-overlay`, `body-screenshot-annotated` for content slides |
| Multiple concepts compared (A vs B, before/after, two logos) | `body-comparison-2col` (native side-by-side) OR two consecutive `editorial-news-image-top` + `editorial-news-image-bottom` slides — one per side of the comparison |
| Sequential process / steps / numbered list | `editorial-news-numbered`, `body-numbered-list`, `body-step-number`, `body-timeline-vertical` |
| Q&A / engagement question | `body-question-answer`, `cta-question` |
| Tutorial / hand-explained walkthrough | Fase 9 migration target — `notebook-*` template_ids will be added to the pool. Until then, fall back to `editorial-news-numbered` or `body-numbered-list`. |
| Real screenshot with callouts / "look at THIS" moment | `body-screenshot-annotated` (chains `tool-screenshot-annotator` for hand-drawn circles + handwritten labels). Fase 9 may add additional `technical-annotation-*` ids. |
| Icon grid / multi-logo wall | `body-icon-grid` |
| Closing call-to-action | `cta-typographic`, `cta-author-card`, `cta-question`, `editorial-news-cta`, `photo-overlay-cta` (only when CTA carries a full-bleed image) |

The designer chooses **per slide**, not per carousel — see "Mixing rule" below.

## Slide 1 — cover rule

**Slide 1 ALWAYS uses a hook template with a full-bleed/background image zone** — no exceptions, regardless of what handles content slides. In the linkedin-carousel pool, that's `photo-overlay-front` (cross-imported) or one of the native `hero-photo-overlay` / `hero-split` entries. Photo-style covers stop the scroll; editorial-style covers look like blog articles.

### Background — what qualifies, what doesn't

The cover earns the swipe with a real visual stage. The strict subset:

| Source | Slide 1? | Notes |
|---|---|---|
| Real photo (tier 2) | ✅ | Faces win. |
| Real event / news photo (tier 3) | ✅ | Moment + tension. |
| Real UI screenshot (tier 4) | ✅ | Concrete product reality. |
| User asset (tier 5) | ✅ | Personal-brand authenticity. |
| Video frame (tier 6) | ✅ | Real moment from the source video. |
| AI-generated full-bleed photographic background (tier 7, HYBRID_AI) | ✅ | **Only with documentary-photography prompt.** No "cinematic 8k epic". |
| Logo / icon SVG (tier 1) | ❌ | A logo on a flat background is a card, not a hook. Floating SVG on black does not stop the scroll. Use logos on slides 2..N, never alone on slide 1. |

**If the inventory resolved only a logo/icon for slide 1**, escalate: broaden the query for a tier 2–6 hit OR generate a HYBRID_AI documentary backdrop that thematically matches the post. A logo can be composited via `HYBRID_FROM_REAL` ON TOP OF a real backdrop, but never as the lone subject.

### Headline — large overlay, not footer

Photo-overlay/front is a poster, not a blog header. The headline:

- Occupies **30–40% of the canvas height** — large, high-contrast, vertically centered or lower third.
- Font-weight 900 (or the closest available in the inferred typography), line-height tight.
- 1–2 keywords wrapped in `<mark>...</mark>` render in `var(--brand-accent)` — pick the words that carry the emotional punch of the hook. The template handles the color/styling; the designer only marks which words.
- No body text on slide 1 — the headline holds the whole hook.

If the rendered output shows headline as a small footer (≤15% of canvas) on a vast empty background, the template isn't being used right — verify slide 1 resolves to `photo-overlay-front` (or another hook template with a full-bleed image zone), not `photo-overlay-text` or a generic dark slide.

## Mixing rule — no monotony *(v2.0.0: now 4 blocking audits)*

Diversity is a **hard requirement**, not a suggestion. The designer runs four audits in Phase 5.3b.0 before showing the slide plan to the user. If any fails, the designer rebalances and retries — never shows a failing plan.

### Audit 1 — Per-slide logo/photo real check *(blocking)*

For every slide with `image_zone != "none"`, the designer MUST walk image-source-matrix tiers 1–6 before settling on `render_mode`. If a real source (logo, photo, screenshot, user asset, video frame) resolves, the slide is promoted out of HYBRID_AI into HYBRID_REAL or HYBRID_FROM_REAL. No walk = slide rejected.

### Audit 2 — Visual floor *(blocking)*

`ceil(2 × N / 3)` slides in the carousel must have `visual_weight ∈ {anchor, supporting}`. For N=6 → 4 minimum. For N=8 → 6. If under floor, the designer promotes the TEMPLATE slide with the most concrete `image_concept` until satisfied.

| N (total slides) | Floor required |
|---|---|
| 4 | 3 |
| 5 | 4 |
| 6 | 4 |
| 7 | 5 |
| 8 | 6 |
| 9 | 6 |
| 10 | 7 |

### Audit 3 — Icon-anchor classification *(audit, drives floor counting)*

Distinguishes "icon as composition lead" from "icon as decoration":

| Type | Criteria | Counts toward visual floor? |
|---|---|---|
| **Icon-anchor** | Icon occupies ≥25% of canvas AND is integrated to the composition (centered, framed, paired with typography as the main element) | Yes — `visual_weight: supporting` (or `anchor` if dominant) |
| **Icon-decorative** | Corner mark, bullet point, divider, small inline glyph, mini-logo at corner | No — `visual_weight: template` |

The "remove the icon and the slide looks the same" test: if removing it doesn't change the composition, it's decorative.

### Audit 4 — White-space audit *(blocking)*

Every slide's canvas must be occupied by ONE of:

1. A full-bleed or zoned image (`image_zone ∈ {background-blur, bottom-half, boxed-center}` with a resolved image_source).
2. An icon-anchor (per Audit 3).
3. A dense typographic composition — multiple type weights, bold keywords, dividers, marginalia, paired blocks. Headline alone on a blank canvas is NOT enough.
4. A pattern/texture/color block as background + typography on top.

If a slide is just `headline + body` floating on an empty canvas with no visual element, no dense composition, no pattern — REJECT and rebalance: either add an inventory asset, promote to a richer typographic composition (varied weights, bold keywords, dividers, marginalia — the editorial-magazine look), or merge with a neighbor.

### Audit 5 — Diversity (existing rule)

For carousels of 4+ slides:

- The carousel MUST mix at least **two different render modes** across content slides (TEMPLATE / HYBRID_REAL / HYBRID_FROM_REAL / HYBRID_AI). All-editorial-news-with-image-bottom is rejected.
- No 2 consecutive slides may share the same `(template_id, render_mode)` pair — prefer no 2 consecutive `template_id`s at all.
- At least one slide should be a **typographic-only TEMPLATE** (no image, words and weights do the work — the editorial-magazine look).
- At least one slide should carry a **real image** (logo, photo, screenshot) when the post mentions any real entity (brand/person/event/product). Naturally satisfied by Audit 2's promotion logic.

### Audit 6 — Creative variety *(BLOCKING — anti-raw output)*

Diversity prevents monotony in family/layout/render_mode. Creative variety prevents the deeper failure: **every slide is "headline + body + screenshot" with no creative move**. The result reads as raw — like a slide deck, not a piece of content.

For carousels ≥ 5 slides, at least ONE content slide must carry a **creative move**. The full list, with triggers and how to invoke, is below. The moves:

| Move | Use when |
|---|---|
| **Hand-drawn annotation overlay** | Screenshot/UI slide where ONE element is the point — "look at THIS metric / button / number". Designer sets `slide.annotate = { style: "hand-drawn", callouts: [...] }`. Image-generator chains `tool-screenshot-annotator`. Output: screenshot with a green/accent circle + handwritten label. |
| **Before/after composition** | Post argues a transformation, comparison, or contrast |
| **Data callout / number anchor** | Post cites a specific number, percentage, or stat — make the NUMBER the visual |
| **Comic panel / multi-frame** | Post tells a story with contrast |
| **Notebook sketch overlay** | Post is a teach/walkthrough |

If all content slides resolve to the same handful of stock template_ids (e.g., all `editorial-news-image-top` / `editorial-news-image-bottom` / `body-headline-body`) with no annotation/composition/comparison/numbered move → REJECT and promote one slide.

### Audit 7 — Screenshot routing *(audit)*

When `inferred_entities.ui` is non-empty OR the carousel uses 2+ video frames:

- **At least one screenshot slide should use `template_id: body-screenshot-annotated`** for `proof` / `insight` roles where the screenshot has a specific element to highlight. It has a dedicated callout zone — purpose-built for "here's what to look at" moments. Fase 9 may add additional `technical-annotation-*` ids for deeper annotation patterns.
- **Screenshots and frames render with `object-fit: contain`, not `cover`.** v2.0.0 CSS enforces this — frames keep their full content, the surrounding canvas letterboxes with `var(--brand-bg-soft)`. No more 16:9 frames cropped to 1:1.
- **Each frame used once.** The inventory cycles through `visual_inventory.video_frames` so different slides get different frames.

## Per-template_id signatures

This table is the visual summary; per-template details (slot vocabulary, image_zone, render_mode compatibility) live in `brand_context/templates/<pool>/manifest.json`. When adding a new template to a pool, add the entry to the manifest — this table updates secondarily.

| template_id (linkedin-carousel pool) | Visual signature | Best slide roles |
|---|---|---|
| `photo-overlay-front` | Full-bleed image + dark gradient overlay + large white headline | Slide 1 only |
| `photo-overlay-content` | Full-bleed image + headline + supporting body overlaid | Tension / emotional beat slides where the image carries 70%+ of meaning |
| `photo-overlay-text` | Solid dark background, words only, no image | Statement slides, manifesto beats, hot takes ("blank canvas" feel) |
| `photo-overlay-cta` | Image background + CTA pill | Closing slide when CTA carries a final image |
| `editorial-news-image-top` | Handle → image (top) → headline → body | Proof / solution slides where seeing comes before reading |
| `editorial-news-image-bottom` | Handle → headline → body → image zone (lower 40%) | Default content slide when both a strong line and a supporting visual |
| `editorial-news-layout-statement` | Handle → giant headline → body, no image zone | Slides where words ARE the visual (typographic-only diversity slide) |
| `editorial-news-numbered` | Disc digit + headline + bad/good quote boxes | Numbered teaching steps with framing quotes |
| `editorial-news-cta` | Headline + dark CTA pill | Closing slide on editorial-leaning carousels |
| `hero-typographic` | Massive Fraunces display, optional italic accent word | Word-led hook (no image) |
| `hero-photo-overlay` | Photo behind, large overlaid headline | Image-led hook |
| `hero-split` | Split layout image/text | Hook with side-by-side image and quote |
| `body-headline-body` | Standard editorial content layout | Default body slide |
| `body-trap-fix` | Two-column "trap" vs "fix" framing | Diagnose-then-prescribe insight |
| `body-numbered-list` | Numbered list with stagger | Step lists |
| `body-data-stat` | Oversized stat + label | Number anchor / data callout |
| `body-pullquote` | Centered quote-card | Manifesto / pull quote |
| `body-screenshot-annotated` | Screenshot zone + annotation overlay | "Look at THIS" moments (chains tool-screenshot-annotator) |
| `body-comparison-2col` | Two-column side-by-side | A/B comparison, before/after |
| `body-icon-grid` | Logo / icon wall | Multi-brand / multi-tool reference |
| `body-step-number` | Big step number + caption | Tutorial step |
| `body-question-answer` | Question card + answer | Q&A |
| `body-timeline-vertical` | Vertical timeline | Chronology / event sequence |
| `cta-typographic` | Typographic CTA | Closing on word-led carousels |
| `cta-author-card` | Author / brand sign-off | Personal brand close |
| `cta-question` | Open question + comment prompt | Engagement-driving close |

## Palette + typography (NEW — content-inferred, not preset)

Phase 5 produces an `inferred_palette` and `inferred_typography` block. The render uses these via `--brand-kit` to override the template's default CSS variables:

| Inference source | Example | Palette pulled |
|---|---|---|
| brand_context/assets.md exists | User's brand kit | Use user's palette (highest priority) |
| Post mentions a sport team | a red+black+white club | Team crest colors: red `#E10000`, black `#000000`, white `#FFFFFF` |
| Post mentions a known brand | "Anthropic Claude" | Anthropic orange `#CC785C` |
| Tech tooling post | "Cursor", "Vercel" | Brand-derived neon-on-dark |
| Tone — dramatic/emotional | a news-of-failure post | Dark base + 1 accent (red for drama, white for stark) |
| Tone — tech minimal | a SaaS × consumer-brand comparison | Off-white bg + black text + 1 subtle accent (editorial-tech feel) |
| No signal | Default | Off-white `#fafaf8` + near-black `#0a0a0a` + neon green `#a3ff00` accent |

The same applies to typography — see `pipeline-phases.md` Phase 5 "Content Inference" for the typography inference table.

## Carousel consistency rule (relaxed but still enforced)

**Hold a minimum identity, do not enforce uniformity.** The previous rule "one family per carousel" was wrong; it produced 6 identical slides. The new rule:

- All slides in the carousel share the **same palette** and **same primary typography**. Variation lives in `template_id` / `render_mode`, not in colors or fonts.
- Slide 1 always picks from the pool's `role: hook` templates with a full-bleed image zone (in linkedin-carousel: `photo-overlay-front` cross-import, `hero-photo-overlay`, `hero-split`).
- Content slides freely mix typographic-only (`photo-overlay-text`, `editorial-news-layout-statement`, `body-pullquote`, `body-data-stat`), image-led (`editorial-news-image-top`, `editorial-news-image-bottom`, `photo-overlay-content`), and creative-move templates (`body-screenshot-annotated`, `body-comparison-2col`, `body-numbered-list`, `body-timeline-vertical`).
- The last slide is a `role: cta` template with `image_zone: none` (e.g., `cta-typographic`, `cta-author-card`, `cta-question`, `editorial-news-cta`) — match the dominant tone of the content slides.

## Decision log format

```
- Slide N:
    template_id: editorial-news-layout-statement
    Reasoning: this slide's role is "insight" (the pivot) — the words ARE the punch; picking a
               statement template lets the headline grow to 108px and breathe. Also satisfies the
               diversity rule (this carousel needs at least one typographic-only slide).
    Palette: inherited from inferred_palette (team-crest red + black + white)
    Alternatives rejected:
      - photo-overlay-content: would force an image where none earns its place
      - editorial-news-image-bottom: monotone with slides 2 and 4 (same template_id rule)
```
