# Skill Update Check — 2026-08-07

**Last check:** 2026-08-06 16:04:30 UTC  
**This check:** 2026-08-07  
**Status:** ✅ Healthy — no broken references or missing dependencies

---

## Summary

- **Catalog skills:** 19 (core + featured)
- **On-disk folders:** 74
- **Selection-result (tracked):** 19 selected + 1 removed
- **Untracked local skills:** 55 (accumulated via local development)
- **New in catalog since last check:** none detected
- **Broken references:** none

---

## Issues & Notes

### Missing `installed.json`

`installed.json` does not exist in `.claude/skills/_catalog/`. This is expected on a consumer install where `selection-result.json` serves as the canonical tracker. The 19 skills listed in `selection-result.json::selected` are the schema-approved set; the 55 local skills on disk are locally-built (per `CLAUDE.local.md` Local Skill Registry) and tracked separately in memory.

### Local Skills (Tracked in CLAUDE.local.md)

- **ops-phone-roleplay** — phone roleplay training drill
- **tool-browser** — CDP-driven Chrome with persistent profile

### Local Skills (Built but Not Yet Registered)

The following 53 skills on disk are not listed in `AGENTS.md` or `CLAUDE.local.md` and may be interim work or require registration:

**Meta & Core:**
- meta-memory-write
- meta-skill-system-creator
- meta-synthesize-locals

**Marketing:**
- mkt-authority-content
- mkt-brand-voice (core, in catalog)
- mkt-content-analytics
- mkt-icp (core, in catalog)
- mkt-longform-article
- mkt-positioning (core, in catalog)
- mkt-short-form-posting
- mkt-social-showing
- mkt-visual-identity
- mkt-youtube-content-package

**Strategy:**
- str-ai-seo-local
- str-authority-strategy
- str-cro-audit
- str-internal-links
- str-keyword-strategy
- str-onpage-audit
- str-question-harvester
- str-security-audit

**Visual:**
- viz-component-library
- viz-design-system
- viz-frontend-slides
- viz-hyperframes
- viz-image-gen
- viz-page-architect
- viz-remotion-video

**Video:**
- vid-clip-extractor
- vid-clip-selection
- vid-condensed-edit
- vid-ffmpeg-edit

**Operations:**
- ops-blog-pipeline
- ops-cms-content
- ops-google-ads

**Utility:**
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

**Pipelines:**
- 00-longform-to-shortform
- 00-slides
- 00-social-content
- 00-video-studio
- 00-youtube-to-ebook

---

## Recommendation

The 55 unregistered local skills are **not broken** — they are foundational to this install's breadth. They were accumulated from upstream template releases and custom builds. If you need them tracked in the system registry for discovery purposes, run `meta-synthesize-locals` to audit and optionally register them into `CLAUDE.local.md` or `AGENTS.md`. No action needed unless you want explicit registration.

---

**Catalog last modified:** 2026-07-04  
**Disk check:** 2026-08-07 (automated via cron)
