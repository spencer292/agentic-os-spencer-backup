# Skill Update Check — 2026-07-13

**Status:** ⚠️ Critical Issue Detected

**Last check:** 2026-07-12 (via `cron/status/skill-update-check.json`)

---

## Summary

- **Skills on disk:** 73
- **Skills in catalog:** 14  
- **Discrepancy:** 59 skills installed but not listed in `catalog.json`
- **Missing state file:** `installed.json` does not exist

---

## Issues

### Critical: Catalog is Severely Out of Date

The `.claude/skills/_catalog/catalog.json` contains only 14 skill definitions, but 73 skill folders exist on disk. This represents a **81% gap** between catalog and disk state.

**Skills on disk but missing from catalog (59 total):**

- 00-longform-to-shortform
- 00-slides
- 00-social-content
- 00-video-studio
- 00-youtube-to-ebook
- meta-memory-write
- meta-skill-creator
- meta-skill-system-creator
- meta-synthesize-locals
- meta-wrap-up
- mkt-authority-content
- mkt-brand-voice
- mkt-content-analytics
- mkt-icp
- mkt-longform-article
- mkt-positioning
- mkt-short-form-posting
- mkt-social-showing
- mkt-visual-identity
- mkt-youtube-content-package
- ops-blog-pipeline
- ops-cms-content
- ops-google-ads
- str-ai-seo-local
- str-authority-strategy
- str-cro-audit
- str-internal-links
- str-keyword-strategy
- str-onpage-audit
- str-question-harvester
- str-security-audit
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
- vid-clip-extractor
- vid-clip-selection
- vid-condensed-edit
- vid-ffmpeg-edit
- viz-component-library
- viz-design-system
- viz-frontend-slides
- viz-hyperframes
- viz-image-gen
- viz-page-architect
- viz-remotion-video

### Missing: installed.json

The file `.claude/skills/_catalog/installed.json` does not exist. This file should track which skills are actively installed/enabled.

---

## Recommendations

1. **Rebuild catalog.json** — regenerate from disk to capture all 73 skills, or run `meta-synthesize-locals` to reconcile
2. **Create installed.json** — establish state tracking for future update checks
3. **Automate reconciliation** — consider running `AGENTS.md` Skill & MCP Reconciliation rules to keep catalog in sync

---

**Next run:** Scheduled per ops-cron policy (check `.claude/settings.json` for interval)
