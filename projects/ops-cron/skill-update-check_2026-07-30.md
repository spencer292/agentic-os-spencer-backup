# Skill Update Check — 2026-07-30

**Last run:** 2026-07-29 at 16:07:29 UTC

## Summary

- **Catalog entries:** 14 skills defined
- **On-disk folders:** 70 skills installed
- **Status:** Catalog is severely out of sync — only ~20% of installed skills are documented
- **Issues:** `installed.json` file missing (expected registry file)

---

## Not Installed (Available in Catalog but Not on Disk)

None. The catalog is smaller than the on-disk footprint.

---

## Issues

### Critical: Incomplete Catalog

The catalog file contains only 14 skills:

- `tool-humanizer`
- `tool-firecrawl-scraper`
- `tool-youtube`
- `str-trending-research`
- `mkt-copywriting`
- `mkt-content-repurposing`
- `mkt-ugc-scripts`
- `viz-excalidraw-diagram`
- `viz-nano-banana`
- `str-ai-seo`
- `viz-interface-design`
- `tool-stitch`
- `viz-stitch-design`
- `ops-cron`

However, **70 skills are installed on disk** (as of 2026-07-30), including:

- All pipeline skills (00-* family): `00-longform-to-shortform`, `00-slides`, `00-social-content`, `00-video-studio`, `00-youtube-to-ebook`
- All meta skills: `meta-memory-write`, `meta-skill-creator`, `meta-skill-system-creator`, `meta-synthesize-locals`, `meta-wrap-up`
- All marketing skills (mkt-*): brand-voice, positioning, icp, longform-article, short-form-posting, social-showing, visual-identity, youtube-content-package, authority-content, content-analytics
- All strategy skills (str-*): ai-seo-local, authority-strategy, cro-audit, internal-links, keyword-strategy, onpage-audit, question-harvester, security-audit
- All operations skills: ops-blog-pipeline, ops-cms-content, ops-google-ads, ops-phone-roleplay (added 2026-07-27)
- All visual/video skills (viz-*, vid-*): component-library, design-system, frontend-slides, hyperframes, image-gen, page-architect, remotion-video, clip-extractor, clip-selection, condensed-edit, ffmpeg-edit
- All utility tools (tool-*): fact-checker, image-search, jobber, linkedin-scraper, n8n, optimoroute, pdf-generator, platform-security, publisher, screenshot-annotator, transcription, video-screenshots, video-upload, web-screenshot, website-security, zernio-social, browser (added 2026-07-06)

### Missing: `installed.json`

The expected registry file `.claude/skills/_catalog/installed.json` does not exist. This file should track which skills are currently active/installed. Recommendation: regenerate this file by running the install reconciliation script.

### Recently Added Skills (On-Disk Only)

- `ops-phone-roleplay` (2026-07-27) — Claude plays realistic callers for phone training roleplay
- `tool-browser` (2026-07-06) — Visible CDP-driven Chrome browser with persistent login profile

Both are tracked locally in `CLAUDE.local.md` registry but absent from the canonical catalog.

---

## Recommendations

1. **Refresh catalog.json** — Run the skill catalog generator to capture all 70 installed skills
2. **Regenerate installed.json** — Re-run installation reconciliation to rebuild the registry
3. **Align local skills** — Confirm `ops-phone-roleplay` and `tool-browser` are intentionally local-only (they are); consider promoting to the main catalog if they're stable
4. **Validate all skill folders** — Spot-check SKILL.md frontmatter against on-disk folder names

---

**Next check:** 2026-07-31
