# Changelog — viz-image-gen

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [2.0.0] — 2026-05-26

### Added
- Template rendering engine `scripts/render_template.py` — renders per-brand template pools (`--template-pool`/`--template-id` via `manifest.json`) or a `--template-dir`, in TEMPLATE / FULL_AI / HYBRID_AI modes. Brand tokens (`visual-identity/tokens.json` fonts/colors/type-scale) drive the output; supports `.prompt.md` AI image slots with caching and WCAG auto-contrast text correction.
- `scripts/fetch_icon.py` — deterministic icon resolver: brand override → curated `commons/` → Simple Icons → Lobehub → Devicon CDN chain, cached to `brand_context/visual-identity/icons/`.
- `scripts/brand_kit_loader.py` — loads the brand kit from `visual-identity/tokens.json` (with legacy + defaults fallbacks).
- `preview/server.py` + `preview/index.html` — local LinkedIn-feed carousel preview with inline caption/slide editing and single-slide re-render.
- New references: `ref-to-template.md` (turn a user reference into a custom template), `extraction-schemas.md`, the `style-editorial-magazine.md` cover preset, and an `editorial/` icon category.
- New SKILL rules: transparent backgrounds require `gpt-image-1`; the icon resolver needs an exact filename; scripts don't auto-load `.env`; edit-mode drops `--background transparent`; recommended extract-from-reference (magenta key + rembg) workflow.

### Changed
- Default image model is now `gpt-image-2` (was `gpt-image-1`). For a transparent background, pass `--model gpt-image-1` explicitly.
- `generate_image_gpt.py` / `generate_image_gemini.py` now auto-load `.env` — API keys resolve without a manual export.
- `references/prompt-patterns-gpt.md` updated for GPT Image 2 (Anti-Text Directive, letter-by-letter brand spelling, 4-turn Layer Method).

## [1.0.0] — 2026-05-09

- Initial release.
