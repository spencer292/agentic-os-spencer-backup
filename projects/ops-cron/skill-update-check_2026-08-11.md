# Skill Update Check — 2026-08-11

**Run time:** 2026-08-11 (previous run: 2026-08-10)  
**Status:** ⚠️ Catalog is significantly out of sync with disk

---

## Summary

- **Skills in catalog:** 14 (5 core + 9 optional)
- **Skills on disk:** 74
- **Mismatch:** 60 skills on disk are not registered in catalog.json
- **New in catalog today:** None
- **Broken references:** None

---

## Not Installed (per catalog)

All catalog skills **are** present on disk — no missing folders.

---

## Issues

**Major:** Catalog is incomplete. The following 60 skills exist on disk but are not registered in `.claude/skills/_catalog/catalog.json`:

- `00-slides`
- `00-social-content`
- `00-video-studio`
- `00-youtube-to-ebook`
- `meta-memory-write`
- `meta-skill-system-creator`
- `meta-synthesize-locals`
- `mkt-authority-content`
- `mkt-content-analytics`
- `mkt-longform-article`
- `mkt-short-form-posting`
- `mkt-social-showing`
- `mkt-visual-identity`
- `mkt-youtube-content-package`
- `ops-blog-pipeline`
- `ops-cms-content`
- `ops-google-ads`
- `ops-phone-roleplay` *(local skill, per CLAUDE.local.md)*
- `str-ai-seo-local`
- `str-authority-strategy`
- `str-cro-audit`
- `str-internal-links`
- `str-keyword-strategy`
- `str-onpage-audit`
- `str-question-harvester`
- `str-security-audit`
- `tool-browser` *(local skill, per CLAUDE.local.md)*
- `tool-fact-checker`
- `tool-image-search`
- `tool-jobber`
- `tool-linkedin-scraper`
- `tool-n8n`
- `tool-optimoroute`
- `tool-pdf-generator`
- `tool-platform-security`
- `tool-publisher`
- `tool-screenshot-annotator`
- `tool-transcription`
- `tool-video-screenshots`
- `tool-video-upload`
- `tool-web-screenshot`
- `tool-website-security`
- `tool-zernio-social`
- `vid-clip-extractor`
- `vid-clip-selection`
- `vid-condensed-edit`
- `vid-ffmpeg-edit`
- `viz-component-library`
- `viz-design-system`
- `viz-frontend-slides`
- `viz-hyperframes`
- `viz-image-gen`
- `viz-page-architect`
- `viz-remotion-video`

**Note:** `.claude/skills/_catalog/installed.json` does not exist, so installation state cannot be verified against the catalog. This is expected during initial setup.

**Action:** Catalog needs to be rebuilt to match disk state. Run `meta-skill-creator` or `meta-skill-system-creator` to rebuild the registry, or manually add all 60 skills to catalog.json.
