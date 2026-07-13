# Skill Update Check — 2026-07-12

**Status:** ⚠️ Catalog gap detected  
**Run at:** 2026-07-12T00:00:00Z  
**Previous check:** 2026-07-11

---

## Summary

The catalog (`catalog.json`) is **severely incomplete**. It documents only 14 skills, but **73 skill folders** exist on disk (69 real skills + 4 system folders). **54 skills are missing from the catalog.**

---

## Issues

### 🔴 Catalog is out of sync with disk

**Gap:** 54 undocumented skills exist on disk but are not in `catalog.json`:

- **Pipeline orchestrators (5):** `00-longform-to-shortform`, `00-slides`, `00-social-content`, `00-video-studio`, `00-youtube-to-ebook`
- **Meta skills (3):** `meta-memory-write`, `meta-skill-system-creator`, `meta-synthesize-locals`
- **Marketing (9):** `mkt-authority-content`, `mkt-content-analytics`, `mkt-longform-article`, `mkt-short-form-posting`, `mkt-social-showing`, `mkt-visual-identity`, `mkt-youtube-content-package` (+ `mkt-brand-voice`, `mkt-icp`, `mkt-positioning` in `core_skills` but not in `skills` section)
- **Operations (3):** `ops-blog-pipeline`, `ops-cms-content`, `ops-google-ads`
- **Strategy (8):** `str-ai-seo-local`, `str-authority-strategy`, `str-cro-audit`, `str-internal-links`, `str-keyword-strategy`, `str-onpage-audit`, `str-question-harvester`, `str-security-audit`
- **Tools (17):** `tool-browser`, `tool-fact-checker`, `tool-image-search`, `tool-jobber`, `tool-linkedin-scraper`, `tool-n8n`, `tool-optimoroute`, `tool-pdf-generator`, `tool-platform-security`, `tool-publisher`, `tool-screenshot-annotator`, `tool-transcription`, `tool-video-screenshots`, `tool-video-upload`, `tool-web-screenshot`, `tool-website-security`, `tool-zernio-social`
- **Video (4):** `vid-clip-extractor`, `vid-clip-selection`, `vid-condensed-edit`, `vid-ffmpeg-edit`
- **Visual (7):** `viz-component-library`, `viz-design-system`, `viz-frontend-slides`, `viz-hyperframes`, `viz-image-gen`, `viz-page-architect`, `viz-remotion-video`

### ⚠️ No installation tracking

**Status:** No `installed.json` exists. Installation state is unknown — can't detect broken references or unintentional removals.

---

## Recommendation

1. **Rebuild `catalog.json`** to include all 69 skills from disk with metadata (version, description, dependencies, services)
2. **Generate `installed.json`** as a snapshot of current disk state for future diffs
3. **Update `cron/status/skill-update-check.json`** to track catalog snapshots per run so changes are detectable

---

## Disk Inventory

**Total skills on disk:** 69  
**Documented in catalog:** 14  
**Missing from catalog:** 54

**By category:**
- Pipelines (00-*): 5/5 (0% documented)
- Meta: 4/4 (75% documented — missing `meta-memory-write`, `meta-skill-system-creator`, `meta-synthesize-locals`)
- Marketing (mkt-*): 10/10 (30% documented)
- Operations (ops-*): 4/4 (25% documented)
- Strategy (str-*): 9/9 (22% documented)
- Tools (tool-*): 18/18 (56% documented)
- Video (vid-*): 4/4 (0% documented)
- Visual (viz-*): 15/15 (27% documented)

