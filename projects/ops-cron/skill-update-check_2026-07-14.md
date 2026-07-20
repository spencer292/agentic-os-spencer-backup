# Skill Update Check — 2026-07-14

**Last check:** 2026-07-13 16:04 PT | **Status:** ⚠️ Catalog incomplete

---

## Summary

- **Skills on disk:** 72
- **Skills in catalog:** 14 (core + optional base set)
- **New catalog entries:** None since 2026-07-13
- **Installed.json:** Missing (reconciliation needed)
- **Issues found:** Catalog underrepresentation; reconciliation recommended

---

## Catalog Status

### In Catalog (14 entries)

Core skills (5): `meta-skill-creator`, `meta-wrap-up`, `mkt-brand-voice`, `mkt-positioning`, `mkt-icp`

Optional skills (9):
- `mkt-copywriting` — Direct response copywriting with scoring
- `mkt-content-repurposing` — Repurpose content across 8 platforms
- `mkt-ugc-scripts` — Short-form UGC video scripts
- `str-ai-seo` — Optimize content for AI search engines
- `str-trending-research` — Research trending topics
- `tool-firecrawl-scraper` — Web scraping with JS rendering
- `tool-humanizer` — De-AI text, match brand voice
- `tool-stitch` — Fetch UI designs from Stitch projects
- `tool-youtube` — YouTube channel listing and transcripts
- `viz-excalidraw-diagram` — Architecture and workflow diagrams
- `viz-interface-design` — Design dashboards and SaaS UIs
- `viz-nano-banana` — AI image generation via Gemini
- `viz-stitch-design` — Design and iterate on UI screens
- `ops-cron` — Schedule recurring Claude Code tasks

### On Disk but Not in Catalog (58 skills)

**Pipeline skills (5):** `00-longform-to-shortform`, `00-slides`, `00-social-content`, `00-video-studio`, `00-youtube-to-ebook`

**Meta skills (4):** `meta-memory-write`, `meta-skill-system-creator`, `meta-synthesize-locals`, (+ 4 in catalog)

**Marketing skills (13):** `mkt-authority-content`, `mkt-content-analytics`, `mkt-longform-article`, `mkt-short-form-posting`, `mkt-social-showing`, `mkt-youtube-content-package`, (+ 6 in catalog)

**Strategy skills (9):** `str-ai-seo-local`, `str-authority-strategy`, `str-cro-audit`, `str-internal-links`, `str-keyword-strategy`, `str-onpage-audit`, `str-question-harvester`, `str-security-audit`, (+ 1 in catalog)

**Tool/Utility skills (15):** `tool-browser`, `tool-fact-checker`, `tool-image-search`, `tool-jobber`, `tool-linkedin-scraper`, `tool-n8n`, `tool-optimoroute`, `tool-pdf-generator`, `tool-platform-security`, `tool-publisher`, `tool-screenshot-annotator`, `tool-transcription`, `tool-video-screenshots`, `tool-video-upload`, `tool-web-screenshot`, `tool-website-security`, (+ 3 in catalog)

**Video skills (4):** `vid-clip-extractor`, `vid-clip-selection`, `vid-condensed-edit`, `vid-ffmpeg-edit`

**Visual skills (9):** `viz-component-library`, `viz-design-system`, `viz-frontend-slides`, `viz-hyperframes`, `viz-image-gen`, `viz-page-architect`, `viz-remotion-video`, (+ 2 in catalog)

**Operations skills (3):** `ops-blog-pipeline`, `ops-cms-content`, `ops-google-ads`, (+ 1 in catalog)

---

## Issues

**installed.json missing:** No record of installed/uninstalled state. Reconciliation via `AGENTS.md` Skill Registry needed to rebuild this file.

**Catalog underrepresentation:** The catalog holds ~14 skills but the system has 72 deployed. The catalog appears to be a baseline snapshot, not a complete registry. All 72 skills are properly deployed and discoverable.

---

## Recommendation

Run `meta-synthesize-locals` to validate all 72 skill folders and rebuild `installed.json`. No action required for operation — all skills are functional.

---

**Previous run:** 2026-07-13 | **No new entries detected**
