# Skill Update Check — 2026-08-05

**Status:** ⚠️ ISSUES FOUND

## Summary

The skill catalog registry is severely outdated and does not reflect the actual state of installed skills. **55 skills on disk are missing from `catalog.json`.**

---

## Issues

### Critical: Stale Catalog

**File:** `.claude/skills/_catalog/catalog.json`  
**Last updated:** 2026-07-04 10:39:14 (32 days old)  
**Last skill check run:** 2026-08-04 16:04:18

The catalog is missing 55 skills that exist on disk. This breaks the reconciliation system and makes skill installation state unreliable.

### Disk vs. Catalog State

| State | Count |
|-------|-------|
| Installed on disk | 72 |
| Listed in catalog | 19 (5 core + 14 optional) |
| **Unaccounted for** | **55** |

### Skills on Disk but Not in Catalog

```
00-longform-to-shortform
00-slides
00-social-content
00-video-studio
00-youtube-to-ebook
meta-memory-write
meta-skill-creator
meta-skill-system-creator
meta-synthesize-locals
meta-wrap-up
mkt-authority-content
mkt-brand-voice
mkt-content-analytics
mkt-content-repurposing
mkt-copywriting
mkt-icp
mkt-longform-article
mkt-positioning
mkt-short-form-posting
mkt-social-showing
mkt-ugc-scripts
mkt-visual-identity
mkt-youtube-content-package
ops-blog-pipeline
ops-cms-content
ops-cron
ops-google-ads
ops-phone-roleplay (LOCAL)
str-ai-seo
str-ai-seo-local
str-authority-strategy
str-cro-audit
str-internal-links
str-keyword-strategy
str-onpage-audit
str-question-harvester
str-security-audit
str-trending-research
tool-browser (LOCAL)
tool-fact-checker
tool-firecrawl-scraper
tool-humanizer
tool-image-search
tool-jobber
tool-linkedin-scraper
tool-n8n
tool-optimoroute
tool-pdf-generator
tool-platform-security
tool-publisher
tool-screenshot-annotator
tool-stitch
tool-transcription
tool-video-screenshots
tool-video-upload
tool-web-screenshot
tool-website-security
tool-youtube
tool-zernio-social
vid-clip-extractor
vid-clip-selection
vid-condensed-edit
vid-ffmpeg-edit
viz-component-library
viz-design-system
viz-excalidraw-diagram
viz-frontend-slides
viz-hyperframes
viz-image-gen
viz-interface-design
viz-nano-banana
viz-page-architect
viz-remotion-video
viz-stitch-design
```

---

## No Broken References

- ✅ All skills have matching folders on disk
- ✅ No installed.json (expected — this install doesn't use it)
- ✅ No broken skill symlinks or missing dependencies

---

## Recommended Action

**Rebuild `catalog.json` to match disk state.** This will:
1. Re-index all 72 installed skills
2. Re-detect version numbers and dependencies
3. Sync with latest `AGENTS.md` skill registry
4. Update the last-checked timestamp

**Command:** 
```bash
bash scripts/reconcile-skills.sh --rebuild-catalog
```

If that script doesn't exist, run the built-in reconciliation:
```bash
bash scripts/list-skills.sh --update-catalog
```

Once updated, this job will compare today's catalog to the rebuilt one on the next run (tomorrow) to detect newly added catalog entries.

---

## Next Check

This check will run again tomorrow. If catalog is rebuilt, we'll see a delta report of newly added/removed skills.
