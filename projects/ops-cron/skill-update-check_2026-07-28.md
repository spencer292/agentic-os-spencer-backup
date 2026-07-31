# Skill Update Check — 2026-07-28

**Catalog status:** `installed.json` missing; catalog.json exists but severely outdated.

---

## Issues

- **Missing installed.json:** No registry of which skills are marked as "installed" exists. The `.claude/skills/_catalog/installed.json` file does not exist. This is required to track which catalog skills are active.
- **Catalog severely outdated:** `catalog.json` lists only **19 skills** (14 regular + 5 core), but **74 skills are present on disk**. The catalog has not been reconciled with the actual skill folder contents.

---

## Skills on Disk but Missing from Catalog (55 unregistered)

| Skill | Category |
|-------|----------|
| 00-longform-to-shortform | pipeline |
| 00-slides | pipeline |
| 00-social-content | pipeline |
| 00-video-studio | pipeline |
| 00-youtube-to-ebook | pipeline |
| meta-memory-write | meta |
| meta-skill-system-creator | meta |
| meta-synthesize-locals | meta |
| mkt-authority-content | marketing |
| mkt-longform-article | marketing |
| mkt-social-showing | marketing |
| mkt-visual-identity | marketing |
| mkt-youtube-content-package | marketing |
| ops-blog-pipeline | operations |
| ops-cms-content | operations |
| ops-google-ads | operations |
| ops-phone-roleplay | operations |
| str-ai-seo-local | strategy |
| str-authority-strategy | strategy |
| str-cro-audit | strategy |
| str-internal-links | strategy |
| str-keyword-strategy | strategy |
| str-onpage-audit | strategy |
| str-question-harvester | strategy |
| str-security-audit | strategy |
| tool-browser | utility |
| tool-fact-checker | utility |
| tool-image-search | utility |
| tool-jobber | utility |
| tool-linkedin-scraper | utility |
| tool-n8n | utility |
| tool-optimoroute | utility |
| tool-pdf-generator | utility |
| tool-platform-security | utility |
| tool-publisher | utility |
| tool-screenshot-annotator | utility |
| tool-transcription | utility |
| tool-video-screenshots | utility |
| tool-video-upload | utility |
| tool-web-screenshot | utility |
| tool-website-security | utility |
| tool-zernio-social | utility |
| vid-clip-extractor | video |
| vid-clip-selection | video |
| vid-condensed-edit | video |
| vid-ffmpeg-edit | video |
| viz-component-library | visual |
| viz-design-system | visual |
| viz-frontend-slides | visual |
| viz-hyperframes | visual |
| viz-image-gen | visual |
| viz-page-architect | visual |
| viz-remotion-video | visual |

---

## Summary

**Status:** Major reconciliation needed.

The catalog.json is a stub—it has only 19 entries when 74 skills exist on disk. To make reconciliation meaningful:

1. Regenerate `installed.json` to reflect which skills are currently active
2. Update or rebuild `catalog.json` to include all 74 skills with proper metadata
3. Run the reconciliation check again to detect true additions/removals

**No actionable alerts today** — the catalog/installed mismatch is a known baseline state.
