# Skill Registry Check — 2026-07-11

## Status Summary

**⚠️ CRITICAL MISMATCH:** Catalog registry is severely out of sync with disk state.

| Metric | Count |
|--------|-------|
| Skills in catalog.json | 19 |
| Skills on disk | 70 |
| Unregistered (on disk but not in catalog) | **51** |
| Missing from disk | 0 |

## Issues

### Registry Files
- `installed.json` — **MISSING** (cannot assess installation status)
- `cron/status/skill-update-check.json` — **MISSING** (no baseline for change detection)

### Unregistered Skills (51 total)

Skills present on disk but not documented in `catalog.json`:

**Pipelines (5)**
- `00-longform-to-shortform`
- `00-slides`
- `00-social-content`
- `00-video-studio`
- `00-youtube-to-ebook`

**Meta System (3)**
- `meta-memory-write`
- `meta-skill-system-creator`
- `meta-synthesize-locals`

**Marketing (6)**
- `mkt-authority-content`
- `mkt-content-analytics`
- `mkt-longform-article`
- `mkt-short-form-posting`
- `mkt-social-showing`
- `mkt-visual-identity`
- `mkt-youtube-content-package`

**Strategy (6)**
- `str-ai-seo-local`
- `str-authority-strategy`
- `str-cro-audit`
- `str-internal-links`
- `str-keyword-strategy`
- `str-onpage-audit`
- `str-question-harvester`
- `str-security-audit`

**Utilities (14)**
- `tool-browser`
- `tool-fact-checker`
- `tool-image-search`
- `tool-jobber`
- `tool-linkedin-scraper`
- `tool-n8n`
- `tool-optimoroute`
- `tool-pdf-generator`
- `tool-platform-security`
- `tool-publisher`
- `tool-screenshot-annotator`
- `tool-transcription`
- `tool-video-screenshots`
- `tool-video-upload`
- `tool-web-screenshot`
- `tool-website-security`
- `tool-zernio-social`

**Video (4)**
- `vid-clip-extractor`
- `vid-clip-selection`
- `vid-condensed-edit`
- `vid-ffmpeg-edit`

**Visual (7)**
- `viz-component-library`
- `viz-design-system`
- `viz-frontend-slides`
- `viz-hyperframes`
- `viz-image-gen`
- `viz-page-architect`
- `viz-remotion-video`

## Recommendations

1. **Regenerate catalog.json** — Run reconciliation to capture all 70 skills from disk
2. **Restore installed.json** — Create a baseline snapshot of currently installed skills
3. **Set up status baseline** — Save today's catalog hash to `cron/status/skill-update-check.json` for future change detection

The catalog appears to be a minimal template or outdated baseline. A full registry rebuild is needed to restore consistency.
