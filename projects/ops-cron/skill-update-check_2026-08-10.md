# Skill Update Check — 2026-08-10

**Run time:** 2026-08-10 (automated cron)

---

## Summary

**Status:** ⚠️ **CRITICAL RECONCILIATION ISSUE**

The catalog at `.claude/skills/_catalog/catalog.json` is severely out of date and incomplete. It lists only **19 skills**, while **73 skills** are currently installed on disk.

- **All catalog skills exist on disk** — no broken references
- **54 skills on disk are NOT in the catalog** — untracked inventory
- **No `installed.json`** — the tracking file does not exist

---

## Not Installed (Catalog vs. Disk)

All 19 skills in the catalog ARE installed on disk. No gaps to report.

---

## Skills on Disk But Not in Catalog

54 additional skills are present in `.claude/skills/` but missing from `catalog.json`:

### Core Pipelines
- 00-longform-to-shortform
- 00-slides
- 00-social-content
- 00-video-studio
- 00-youtube-to-ebook

### Meta / System
- meta-memory-write
- meta-skill-system-creator
- meta-synthesize-locals

### Marketing (9 untracked)
- mkt-authority-content
- mkt-content-analytics
- mkt-longform-article
- mkt-short-form-posting
- mkt-social-showing
- mkt-visual-identity
- mkt-youtube-content-package

### Operations (6 untracked)
- ops-blog-pipeline
- ops-cms-content
- ops-google-ads
- ops-phone-roleplay

### Strategy (9 untracked)
- str-ai-seo-local
- str-authority-strategy
- str-cro-audit
- str-internal-links
- str-keyword-strategy
- str-onpage-audit
- str-question-harvester
- str-security-audit

### Tools (19 untracked)
- tool-browser
- tool-fact-checker
- tool-image-search
- tool-jobber
- tool-linkedin-scraper
- tool-n8n
- tool-optimoroute
- tool-pdf-generator
- tool-platform-security
- tool-publisher
- tool-screenshot-annotator
- tool-transcription
- tool-video-screenshots
- tool-video-upload
- tool-web-screenshot
- tool-website-security
- tool-zernio-social

### Video (4 untracked)
- vid-clip-extractor
- vid-clip-selection
- vid-condensed-edit
- vid-ffmpeg-edit

### Visual (9 untracked)
- viz-component-library
- viz-design-system
- viz-frontend-slides
- viz-hyperframes
- viz-image-gen
- viz-page-architect
- viz-remotion-video

---

## Issues

1. **`installed.json` missing** — `.claude/skills/_catalog/installed.json` does not exist. The tracking file should mirror current disk state.
2. **Catalog completeness** — 54 skills (74% of the installed base) are untracked in `catalog.json`. This blocks skill registry reconciliation and catalog-based features.

---

## Recommendation

Rebuild `catalog.json` and `installed.json` from the current disk state using the skill reconciliation tooling. All 73 skills on disk should be represented in the catalog with their metadata intact.
