# Changelog — mkt-brand-voice

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] — 2026-05-26

### Added
- `scripts/import_folder.py` — folder asset importer (Mode 5). Walks a path recursively, auto-classifies files into `brand_context/` subfolders (fonts/ logos/ icons/ templates/ visual_refs/ components/) by name+extension, sanitizes filenames, skips hidden/>50MB, never overwrites. Dry-run by default; `--apply` copies.
- `scripts/import_url.py` — Playwright URL scraper (Mode 4 Path A, no API key). Captures logo, top-fold hero, button/card/nav component screenshots, computed colors and fonts; writes `brand_context/_import-observations-<slug>.md`. Firecrawl branding extraction demoted to Path B.
- `references/tokens-template.md` — canonical schema for `brand_context/tokens.md` (type scale, spacing, layout grid, motion, per-skill aspect ratios) with a YAML loader block.
- `references/defaults/anthropic-ish/assets.md` and `references/defaults/anthropic-ish/tokens.md` — shipped default design system (off-white paper, charcoal ink, chartreuse + terracotta accents; Fraunces + Instrument Sans + JetBrains Mono), copied to `brand_context/` when the user opts out of full onboarding.
- `references/design-questions.md` — CLI/chat interactive Q&A flow that populates `assets.md` + `tokens.md` and copies uploaded files into `brand_context/` subfolders (incl. Step 8b design-tokens sub-flow).
- `references/assets-template.md` — canonical format spec for `brand_context/assets.md`, consumed by the carousel renderer and AI prompt brand-token blocks.
- `references/assets-example.md` — worked example using the Simon Scrapes brand.
- SKILL.md **Step 8 (Visual Brandbook, CLI-first)** and **Step 9 (Custom Templates from References)**.

### Changed
- Mode selection and the Build Quick/Deep fork are now `AskUserQuestion` popups in Portuguese; the legacy plain-text/numbered-list fallbacks were removed.
- SKILL.md "Paths" now documents the auto-created `brand_context/` subfolders and the three ways `assets.md` is populated.
- Mode 4 Auto-Scrape reworked around the Playwright Path A → seed-observations → Q&A confirmation pipeline.

## [1.0.1] — 2026-05-09

- Adapted from the agentic-os baseline for inclusion in
  @scrapes/skill-systems. See the parent system CHANGELOG for context.

## [1.0.0] — agentic-os baseline

- Originally shipped as part of agentic-os.
