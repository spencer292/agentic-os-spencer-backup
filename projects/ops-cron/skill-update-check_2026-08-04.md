# Skill Reconciliation Report — 2026-08-04

**Generated:** 2026-08-04  
**Status:** ⚠️ **Critical Mismatch Detected**

---

## Summary

- **Catalog version:** 1.0.0 (19 skills registered)
- **Installed on disk:** 75 skills
- **Unregistered skills:** 56 (74% of installed)
- **Missing folders:** 0
- **Previous run:** 2026-07-31 (4 days ago, success)

---

## Issues

### Critical: Catalog Severely Outdated

The catalog.json is incomplete and only registers **19 of 75 installed skills**. This means:

1. **56 skills on disk have no registry entry** — they are untracked in the canonical catalog
2. **Skill reconciliation is broken** — new skills cannot be auto-detected through the catalog mechanism
3. **Dependency tracking unavailable** — downstream systems that rely on the catalog (skill system creator, skill installer, etc.) have incomplete metadata

---

## Not Installed (Catalog-to-Disk Sync)

✅ **All registered skills are present on disk** — no broken references.

- ✓ Core skills (5/5 on disk): meta-skill-creator, meta-wrap-up, mkt-brand-voice, mkt-positioning, mkt-icp
- ✓ Optional skills (14/14 on disk): tool-humanizer, tool-firecrawl-scraper, tool-youtube, str-trending-research, mkt-copywriting, mkt-content-repurposing, mkt-ugc-scripts, viz-excalidraw-diagram, viz-nano-banana, str-ai-seo, viz-interface-design, tool-stitch, viz-stitch-design, ops-cron

---

## Unregistered Skills (56 Total)

These skills exist on disk but are **absent from catalog.json** and will not be detected by automated skill reconciliation.

### Pipeline Skills (5)
- `00-longform-to-shortform` — Full pipeline: video → shorts
- `00-slides` — Presentation slide deck orchestrator
- `00-social-content` — Social media content pipeline
- `00-video-studio` — Video processing and studio inbox
- `00-youtube-to-ebook` — Convert YouTube videos to ebooks

### Meta/System Skills (3)
- `meta-memory-write` — Memory file management
- `meta-skill-system-creator` — Build skill systems
- `meta-synthesize-locals` — Sync local overrides

### Marketing Skills (9)
- `mkt-authority-content` — Authority blog articles
- `mkt-content-analytics` — Social media post analytics
- `mkt-longform-article` — Long-form content from transcripts
- `mkt-short-form-posting` — Post reels to social platforms
- `mkt-social-showing` — Optimize posts for virality
- `mkt-visual-identity` — Brand identity design system
- `mkt-youtube-content-package` — YouTube SEO packaging

### Operations Skills (5)
- `ops-blog-pipeline` — Blog publication pipeline
- `ops-cms-content` — CMS content seeding
- `ops-google-ads` — Google Ads account management
- `ops-phone-roleplay` — Phone training roleplay (local skill, 2026-07-20)

### Strategy Skills (9)
- `str-ai-seo-local` — Local AI SEO audits
- `str-authority-strategy` — Backlink & entity strategy
- `str-cro-audit` — Conversion rate optimization
- `str-internal-links` — Internal link audit
- `str-keyword-strategy` — Keyword planning
- `str-onpage-audit` — On-page SEO audits
- `str-question-harvester` — PAA question harvesting
- `str-security-audit` — Website security audits

### Utility/Tool Skills (21)
- `tool-browser` — CDP-driven Chrome browser (local skill, 2026-07-26)
- `tool-fact-checker` — Fact-check claims
- `tool-image-search` — Stock photo search
- `tool-jobber` — Jobber account driver
- `tool-linkedin-scraper` — LinkedIn profile scraping
- `tool-n8n` — Workflow automation builder
- `tool-optimoroute` — Route optimization
- `tool-pdf-generator` — PDF generation
- `tool-platform-security` — Secret scanning
- `tool-publisher` — Social media publisher
- `tool-screenshot-annotator` — Screenshot annotation
- `tool-transcription` — Audio transcription
- `tool-video-screenshots` — Extract frames from video
- `tool-video-upload` — Video upload & compression
- `tool-web-screenshot` — Website screenshot
- `tool-website-security` — Website security audits
- `tool-zernio-social` — Zernio social posting

### Video Processing Skills (4)
- `vid-clip-extractor` — Extract and reframe clips
- `vid-clip-selection` — Find best clips in video
- `vid-condensed-edit` — Condensed highlights edit
- `vid-ffmpeg-edit` — Video editing with captions

### Visual/Design Skills (10)
- `viz-component-library` — UI component specs
- `viz-design-system` — Design system & tokens
- `viz-frontend-slides` — HTML presentation slides
- `viz-hyperframes` — Motion graphics videos
- `viz-image-gen` — AI image generation
- `viz-page-architect` — Page structure planning
- `viz-remotion-video` — Animated explainer videos

---

## Recommendation

**Update catalog.json with all 75 installed skills** to restore automated skill reconciliation. This is a one-time maintenance task to sync the source-of-truth registry with the actual installation state. Without it:

- Skill manager tools operate on incomplete data
- New skills added locally won't be tracked
- Downstream automation that depends on catalog metadata fails silently

The 56 unregistered skills are legitimate and functional — they need registry entries, not deletion.

---

## Metadata

- **installed.json status:** Does not exist (catalog has no install tracker)
- **Catalog format:** Valid JSON, version 1.0.0
- **Disk conflicts:** None detected
- **Previous check run:** 2026-07-31 16:04:08 UTC (success)
