# Changelog — 00-social-content

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [2.1.0] — 2026-05-26

### Added
- Per-carousel **style picker**: when a pool has a `styles.json` (≥2 styles), the orchestrator opens an always-ask `AskUserQuestion` and passes the chosen style's `template_style` + `allowed_template_ids` to `ssc-designer`, which scopes its template picks to that subset. No `styles.json` → full pool (unchanged). New `references/decisions/styles.md` documents the contract; Hard-Won Rule 17 covers it.

## [2.0.0] — 2026-05-26

### Added
- `ssc-designer` sub-agent owns the visual layer end-to-end: Visual Inventory (Phase 5.0.5), Slide Planning (Phase 5.3), Image Source Resolution (Phase 5.7). Returns a validated `slide_plan` + `visual_inventory` + `reasoning`.
- Blocking designer audits: per-slide real-image check, visual floor `ceil(2N/3)`, icon-anchor classification (≥25% canvas), white-space, render-mode diversity, and Story Framework (headline ≤6 words, body ≤3 lines, energy curve, image-less CTA).
- Phase 1 HARD GATE — content generation requires `brand_context/visual-identity/tokens.json` AND ≥1 template with `status: ready`; otherwise the pipeline stops and surfaces pending items. Voice is a soft enhancement, not a blocker.
- Phase 7.5 — blocking, script-only HTML LinkedIn preview (`preview_carousel.py`) before save; opt-out via `--no-preview`.
- `references/decisions/template-gallery.md` — Template + AI Style gallery (26-template `linkedin-carousel` pool + AI-style taxonomy + pairing matrix), read by the designer.
- Brand-context onboarding now offers visual-identity setup and uses `AskUserQuestion` popups + direct `Skill()` invocation (`mkt-brand-voice`, `mkt-visual-identity`).

### Changed
- Template selection is pool-based: the orchestrator passes a `template_pool` per `(format, platform)` and the designer picks a specific `template_id` from the pool manifest (`brand_context/templates/<pool>/`).
- `ssc-image-generator` is now an executor only — honors the designer's `slide_plan`; no longer decides template/source/render-mode (sole override: `FULL_AI`→`HYBRID_AI` on headline sanitization failure).
- Per-run `pipeline-log.md` moved from shared `{date}/logs/` to `{date}/{slug}/` (no same-day collisions).
- Image-provider selection removed from config — auto-detected from `.env` each run; soft tie-breaker preference lives in `sys-config.md > Generation > image_provider`.
- Scenarios A and E now run Phase 5.0 content inference + full visual planning instead of jumping straight to image generation.
- Brand-context visual contract path moved to `brand_context/visual-identity/tokens.json`.
- Default `defaults.format` changed from `auto` to `carousel`.
- `.env.example` / config template reference `gpt-image-2` (was `gpt-image-1`).

### Removed
- Config keys `images.provider` and `images.style` — the image backend is now auto-detected from your `.env` each run, and visual style is inferred per post.

### Fixed
- Pipeline-log overwrites across same-day runs (shared `logs/pipeline-log.md` path → per-run `{slug}/` path).

## [1.0.1] — 2026-05-09

- Adapted from the agentic-os baseline for inclusion in
  @scrapes/skill-systems. See the parent system CHANGELOG for context.

## [1.0.0] — agentic-os baseline

- Originally shipped as part of agentic-os.
