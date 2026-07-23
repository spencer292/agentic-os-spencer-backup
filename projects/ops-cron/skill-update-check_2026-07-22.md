# Skill Registry Update Check — 2026-07-22

## Summary

**Status:** CRITICAL SYNC GAP DETECTED

- **Catalog entries:** 14 skills
- **Installed (disk):** 74 skills
- **Out of sync:** 60 skills on disk but missing from catalog.json
- **No broken references:** All installed skills have valid folders

## Issues

**Catalog is severely out of date.** The `catalog.json` only lists a small subset of the installed skill base. This is a maintenance issue — the catalog needs to be rebuilt to reflect the current state of the installed skills.

### Missing from Catalog (60 skills)

**Pipeline & Orchestration (5):**
- `00-longform-to-shortform`
- `00-slides`
- `00-social-content`
- `00-video-studio`
- `00-youtube-to-ebook`

**Meta System (5):**
- `meta-memory-write`
- `meta-skill-creator`
- `meta-skill-system-creator`
- `meta-synthesize-locals`
- `meta-wrap-up`

**Marketing (9):**
- `mkt-authority-content`
- `mkt-brand-voice`
- `mkt-content-analytics`
- `mkt-icp`
- `mkt-longform-article`
- `mkt-positioning`
- `mkt-short-form-posting`
- `mkt-social-showing`
- `mkt-visual-identity`
- `mkt-youtube-content-package`

**Operations (4):**
- `ops-blog-pipeline`
- `ops-cms-content`
- `ops-google-ads`
- `ops-phone-roleplay`

**Strategy (7):**
- `str-ai-seo-local`
- `str-authority-strategy`
- `str-cro-audit`
- `str-internal-links`
- `str-keyword-strategy`
- `str-onpage-audit`
- `str-question-harvester`
- `str-security-audit`

**Tools (16):**
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

**Video (4):**
- `vid-clip-extractor`
- `vid-clip-selection`
- `vid-condensed-edit`
- `vid-ffmpeg-edit`

**Visualization (6):**
- `viz-component-library`
- `viz-design-system`
- `viz-frontend-slides`
- `viz-hyperframes`
- `viz-image-gen`
- `viz-page-architect`
- `viz-remotion-video`

## In Catalog But Valid (14)

These are correctly listed in `catalog.json` and exist on disk:
- `mkt-content-repurposing` ✓
- `mkt-copywriting` ✓
- `mkt-ugc-scripts` ✓
- `ops-cron` ✓
- `str-ai-seo` ✓
- `str-trending-research` ✓
- `tool-firecrawl-scraper` ✓
- `tool-humanizer` ✓
- `tool-stitch` ✓
- `tool-youtube` ✓
- `viz-excalidraw-diagram` ✓
- `viz-interface-design` ✓
- `viz-nano-banana` ✓
- `viz-stitch-design` ✓

## Recommendation

The `catalog.json` file needs to be rebuilt with a complete scan of `.claude/skills/`. This would typically be done by running a reconciliation script that:
1. Scans all skill folders on disk
2. Reads each skill's YAML frontmatter
3. Updates `catalog.json` to reflect the true state

No immediate action needed for operations — all skills are installed correctly. This is a catalog maintenance issue only.

---

**Check completed:** 2026-07-22 at automated cron interval
**Prev run:** 2026-07-21 16:03:50 UTC
