# Skill Update Check — 2026-08-09

## Summary
Massive discrepancy detected: catalog lists 19 skills, disk has 74 installed. **Catalog is severely outdated.**

## Not Installed (on disk but missing from catalog)

The following 55 skills are on disk but NOT listed in `catalog.json`:

**Pipeline Skills (00-*)**
- 00-longform-to-shortform
- 00-slides
- 00-social-content
- 00-video-studio
- 00-youtube-to-ebook

**Meta Skills**
- meta-memory-write
- meta-skill-system-creator
- meta-synthesize-locals

**Marketing Skills**
- mkt-authority-content
- mkt-content-analytics
- mkt-longform-article
- mkt-short-form-posting
- mkt-social-showing
- mkt-visual-identity
- mkt-youtube-content-package

**Operations Skills**
- ops-blog-pipeline
- ops-cms-content
- ops-google-ads

**Strategy Skills**
- str-ai-seo-local
- str-authority-strategy
- str-cro-audit
- str-internal-links
- str-keyword-strategy
- str-onpage-audit
- str-question-harvester
- str-security-audit

**Utility / Tool Skills**
- tool-fact-checker
- tool-image-search
- tool-linkedin-scraper
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
- tool-n8n
- tool-jobber
- tool-optimoroute
- tool-browser *(local)*

**Video Skills**
- vid-clip-extractor
- vid-clip-selection
- vid-condensed-edit
- vid-ffmpeg-edit

**Visual Skills**
- viz-component-library
- viz-design-system
- viz-frontend-slides
- viz-hyperframes
- viz-image-gen
- viz-page-architect
- viz-remotion-video

**Local-only (registered in CLAUDE.local.md)**
- ops-phone-roleplay
- tool-browser

## Status Notes

- **No `installed.json` found** — this is the first run or it has been deleted
- **Last cron run:** 2026-08-08T16:06:45.196Z (success, 52ms)
- **Run history:** 20 runs, 2 failures

## Action Required

The catalog.json is functionally broken and should be rebuilt to match the actual disk state (74 skills). This blocks accurate skill reconciliation and audit tracking.
