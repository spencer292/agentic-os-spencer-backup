# Skill Update Check — 2026-07-31

**Previous check:** 2026-07-30 at 16:04:18 UTC

## Summary

- **On disk:** 70 skill folders installed
- **In catalog:** 14 skills registered (+ 5 core skills = 19 total)
- **Gap:** 51 skills on disk but not registered in catalog.json

## Issues Found

### Critical: Catalog Severely Out of Date

The `.claude/skills/_catalog/catalog.json` contains only 14 optional skills and 5 core skills, but **70 skill folders** exist on disk. The catalog file is a template snapshot that has not been synced with the actual installation.

**Missing from catalog (51 skills on disk):**

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
- mkt-longform-article
- mkt-short-form-posting
- mkt-social-showing
- mkt-youtube-content-package

**Operations Skills**
- ops-blog-pipeline
- ops-cms-content
- ops-google-ads
- ops-phone-roleplay _(local skill, registered in CLAUDE.local.md)_

**Strategy Skills**
- str-ai-seo-local
- str-authority-strategy
- str-cro-audit
- str-internal-links
- str-keyword-strategy
- str-onpage-audit
- str-question-harvester
- str-security-audit

**Tool Skills**
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
- tool-browser _(local skill, registered in CLAUDE.local.md)_

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

## Recommendation

Rebuild `catalog.json` from the actual skills on disk using a reconciliation sweep. The `.claude/skills/_catalog/installed.json` file is also missing — this appears to be a template install that was never fully initialized.

**Action:** Run `bash scripts/add-skill.sh` with a catalog rebuild, or manually regenerate `catalog.json` to reflect the current 70 skills.
