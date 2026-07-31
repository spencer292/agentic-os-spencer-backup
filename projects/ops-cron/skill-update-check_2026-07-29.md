# Skill Update Check — 2026-07-29

**Status:** ⚠️ **SYNC ISSUES FOUND**

---

## Summary

- **74 skills on disk**
- **19 skills in catalog.json**
- **55 skills missing from catalog registration**
- **Catalog last updated:** 2026-07-04
- **Recent additions detected:** tool-browser (07-06), ops-phone-roleplay (07-27)

---

## Issues

### 1. Catalog Out of Sync

The `catalog.json` file was last updated on 2026-07-04, but multiple skills have been added since:
- **tool-browser** (2026-07-06) — not in catalog, registered in CLAUDE.local.md
- **ops-phone-roleplay** (2026-07-27) — not in catalog, registered in CLAUDE.local.md

### 2. Missing Registrations (55 skills)

The following 55 skills are on disk but **not** in `.claude/skills/_catalog/catalog.json`:

**Pipeline Skills (5):**
- 00-longform-to-shortform
- 00-slides
- 00-social-content
- 00-video-studio
- 00-youtube-to-ebook

**Meta Skills (3):**
- meta-memory-write
- meta-skill-system-creator
- meta-synthesize-locals

**Marketing Skills (6):**
- mkt-authority-content
- mkt-content-analytics
- mkt-longform-article
- mkt-short-form-posting
- mkt-social-showing
- mkt-visual-identity
- mkt-youtube-content-package

**Operations Skills (4):**
- ops-blog-pipeline
- ops-cms-content
- ops-google-ads
- ops-phone-roleplay ← **newly added 07-27**

**Strategy Skills (6):**
- str-ai-seo-local
- str-authority-strategy
- str-cro-audit
- str-internal-links
- str-keyword-strategy
- str-onpage-audit
- str-question-harvester
- str-security-audit

**Utility/Tool Skills (13):**
- tool-browser ← **newly added 07-06** (registered in CLAUDE.local.md)
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

**Video Skills (4):**
- vid-clip-extractor
- vid-clip-selection
- vid-condensed-edit
- vid-ffmpeg-edit

**Visual Skills (8):**
- viz-component-library
- viz-design-system
- viz-frontend-slides
- viz-hyperframes
- viz-image-gen
- viz-page-architect
- viz-remotion-video

### 3. Missing `installed.json`

No `installed.json` file exists at `.claude/skills/_catalog/installed.json` to track active installations.

---

## Local Skills (Not in Catalog)

These skills are properly registered in `CLAUDE.local.md` as user-owned local skills:

| Skill | Status | Notes |
|-------|--------|-------|
| `tool-browser` | Active | Added 2026-07-06; CDP-driven Chrome with persistent profile |
| `ops-phone-roleplay` | Active | Added 2026-07-27; phone training roleplay for Muhammad |

---

## Recommendations

1. **Regenerate catalog.json** — Run the catalog generation script to include all 74 installed skills with their current metadata
2. **Create installed.json** — Maintain a list of actively installed skills for future sync checks
3. **Local skills are properly documented** — No action needed for tool-browser and ops-phone-roleplay; they're correctly registered in CLAUDE.local.md per the personal skill registry pattern

---

**Last check:** 2026-07-29 at 09:06 UTC
