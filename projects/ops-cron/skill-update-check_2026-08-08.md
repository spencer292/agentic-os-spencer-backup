# Skill Update Check — 2026-08-08

**Status:** ⚠️ CRITICAL MISMATCH

## Catalog vs. Disk Reconciliation

- **Catalog entries:** 14 skills
- **Disk folders:** 76 skills
- **Mismatch:** 62 skills on disk are NOT in `catalog.json`

## Not in Catalog

The following 62 skills are installed on disk but missing from `.claude/skills/_catalog/catalog.json`:

**Meta skills (5):**
- meta-memory-write — Memory writing system
- meta-skill-creator — Build new skills
- meta-skill-system-creator — Package skill systems
- meta-synthesize-locals — Sync local overrides
- meta-wrap-up — Session end checklist

**Marketing skills (13):**
- mkt-authority-content — Authority SEO content
- mkt-brand-voice — Brand voice definition
- mkt-content-analytics — Post performance tracking
- mkt-icp — Ideal customer profile
- mkt-longform-article — Long-form content from transcript
- mkt-positioning — Brand positioning
- mkt-short-form-posting — Post shorts to platforms
- mkt-social-showing — Optimize posts for social
- mkt-visual-identity — Visual identity system
- mkt-youtube-content-package — YouTube SEO packaging

**Strategy skills (8):**
- str-ai-seo-local — Local AI visibility audit
- str-authority-strategy — Backlink and entity strategy
- str-cro-audit — Conversion optimization audit
- str-internal-links — Internal linking strategy
- str-keyword-strategy — Keyword planning
- str-onpage-audit — On-page SEO audit
- str-question-harvester — PAA question mining
- str-security-audit — Website security audit

**Operations skills (4):**
- ops-blog-pipeline — Blog publish pipeline
- ops-cms-content — CMS content management
- ops-google-ads — Google Ads operations
- ops-phone-roleplay — Phone training roleplay (local)

**Utility/Tool skills (24):**
- tool-browser — CDP-driven Chrome browser (local)
- tool-fact-checker — Fact verification
- tool-image-search — Stock photo search
- tool-jobber — Jobber account driver (local)
- tool-linkedin-scraper — LinkedIn scraping
- tool-n8n — n8n workflow automation (local)
- tool-optimoroute — OptimoRoute operations (local)
- tool-pdf-generator — Markdown to PDF
- tool-platform-security — Security audit
- tool-publisher — Content publishing
- tool-screenshot-annotator — Image annotation
- tool-transcription — Audio/video transcription
- tool-video-screenshots — Extract frames from video
- tool-video-upload — Video compression and upload
- tool-web-screenshot — Webpage screenshot
- tool-website-security — Website security check
- tool-zernio-social — Social media publishing

**Video skills (4):**
- vid-clip-extractor — Portrait/reframe video crops
- vid-clip-selection — Best clips from transcript
- vid-condensed-edit — Highlight edit
- vid-ffmpeg-edit — Subtitle burn and editing

**Visual/Design skills (8):**
- viz-component-library — Component specs
- viz-design-system — Design token system
- viz-frontend-slides — HTML presentation builder
- viz-hyperframes — Motion graphics video
- viz-image-gen — AI image generation
- viz-page-architect — Page structure planning
- viz-remotion-video — Programmatic video generation

**Pipeline skills (5):**
- 00-longform-to-shortform — Full video-to-shorts pipeline
- 00-slides — Presentation builder
- 00-social-content — End-to-end social content
- 00-video-studio — Footage-to-clips processing
- 00-youtube-to-ebook — Video-to-PDF eBook

## Issues

1. **Catalog severely outdated** — The `catalog.json` was last updated with only 14 skills, but the full system has 76. This was likely the initial seeding state and has not been kept in sync.

2. **No installed.json exists** — The `.claude/skills/_catalog/installed.json` file referenced in task instructions does not exist. This file should track which skills are currently enabled/active for this installation.

3. **No previous catalog snapshot** — Cannot detect which skills are newly added since the last check, as no historical snapshot is stored in `cron/status/`.

## Recommendation

Run `meta-synthesize-locals` to rebuild the skill registry, or manually update `catalog.json` to include all 76 installed skills for accurate reconciliation in future checks.
