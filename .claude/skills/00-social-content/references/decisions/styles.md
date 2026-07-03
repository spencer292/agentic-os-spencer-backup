# Brand Styles — coherent template subsets per pool

A **style** is a named, curated SUBSET of a pool's templates that look like a family.
Per carousel the user picks ONE style; `ssc-designer` then scopes every per-slide
`template_id` pick to that style's subset. This keeps a single carousel cohesive while
letting the brand rotate styles across posts (consistency within, variety across).

## What is (and isn't) a style

- A style = a genuinely DIFFERENT composition / layout family.
- A palette or icon change is **NOT** a style — that's brand tokens applied to the SAME
  template (same layout, re-themed at render). Don't create a style for a recolor.
- Templates — especially heroes and ctas — **CAN be shared across styles.** A style
  references template ids; the same id may appear in several styles.

> **Terminology — don't confuse with `ai_style`.** This "style" is a template/composition
> family (a subset of the pool). It is DISTINCT from `ai_style` (the per-slide AI-image
> generation style — `isometric`, `social-design`, `editorial-illustration`, …). The
> orchestrator passes the chosen style to `ssc-designer` as `template_style` (its `name`)
> + `allowed_template_ids` (its subset). `ai_style` stays a per-slide field, unchanged.

## Contract — `{brand_context}/templates/{pool}/styles.json`

```json
{
  "version": 1,
  "platform_pool": "linkedin-carousel",
  "styles": [
    {
      "name": "editorial-paper",
      "label": "Editorial Paper",
      "description": "Warm paper texture, serif display, calm typographic bodies.",
      "cover_preview": "styles/editorial-paper.png",
      "template_ids": [
        "photo-overlay-front",
        "editorial-news-layout-statement",
        "body-pullquote",
        "body-data-stat",
        "cta-typographic"
      ]
    },
    {
      "name": "bold-brutalist",
      "label": "Bold Brutalist",
      "description": "High-contrast full-bleed, oversized sans, hard color blocks.",
      "cover_preview": "styles/bold-brutalist.png",
      "template_ids": [
        "photo-overlay-front",
        "body-comparison-2col",
        "body-step-number",
        "cta-question"
      ]
    }
  ]
}
```

Note `photo-overlay-front` appears in BOTH styles — a shared hero is listed in each
style that uses it, not duplicated on disk.

Fields:
- `platform_pool` — the pool these styles partition (matches the dir name).
- `styles[]`:
  - `name` — kebab-case id.
  - `label` — human label shown in the picker.
  - `description` — one line for the picker.
  - `cover_preview` — pool-relative path to a representative thumbnail (shown in the picker).
  - `template_ids[]` — the subset (ids from the pool's `manifest.json`). Shared ids may
    repeat across styles.

## Role-completeness (REQUIRED per style)

Each style's `template_ids` MUST satisfy the designer's hard gates on its own — otherwise
a carousel can't be built within one style. Each style needs:
- **≥1 hero with a full-bleed image zone** (Cover rule — slide 1, see ssc-designer 7.0).
- **≥1 cta with `image_zone: none`** (CTA image-less rule — last slide, 7.9.6).
- **≥2 bodies spanning light + dark tone** (energy curve 7.9.4 + tonal alternation 7.9.5).

Shared heroes/ctas may be reused across styles to satisfy this cheaply.

## Runtime flow

1. **Detection (orchestrator).** After resolving `template_pool` from `(format, platform)`,
   check `{brand_context}/templates/{pool}/styles.json`. Present AND ≥2 styles → run the
   picker. Absent or ≤1 style → no picker; the designer uses the full pool (legacy
   behaviour). The generic fallback pool is always flat (no styles).
2. **Selection (orchestrator).** `AskUserQuestion` "Which style for this carousel?" — one
   option per style (`label` + `description`; the `cover_preview` path is surfaced for the
   user to glance at). **Always ask — no auto-pick.** The chosen style's `template_ids`
   becomes `allowed_template_ids`, passed to `ssc-designer`.
3. **Scoping (ssc-designer).** The designer restricts every `template_id` pick to
   `allowed_template_ids`. All existing audits (diversity 7.5, energy curve 7.9.4, tonal
   alternation 7.9.5, cover 7.0, cta-image-less 7.9.6) run UNCHANGED — just over the
   subset. The designer does NOT choose the style (the user does); it only picks within
   the given subset.

## Backward compatibility

No `styles.json` for the pool → nothing changes: the designer picks from the full pool as
today. Styles are purely additive — a brand opts in by having `mkt-visual-identity`
produce a `styles.json`.
