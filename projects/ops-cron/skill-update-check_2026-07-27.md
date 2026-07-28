# Skill Update Check — 2026-07-27

**Run at:** 2026-07-27 (status from last check: failure on 2026-07-24)

---

## Summary

- **Skills on disk:** 74 (including local additions)
- **Skills in catalog:** 19 (5 core + 14 in registry)
- **Catalog freshness:** severely outdated — catalog last reflects ~Jul 4 state
- **Critical gap:** `installed.json` is missing; no authoritative record of intended installations

---

## Issues

### Missing: `.claude/skills/_catalog/installed.json`

The installed registry file does not exist. This is the authoritative record of which skills are explicitly installed vs. just sitting on disk. Without it:
- We cannot distinguish between "this skill is managed" and "this is dead code"
- Skill reconciliation cannot run (AGENTS.md reconciliation step depends on this file)
- The Skill Registry in AGENTS.md may be stale or misaligned

**Action needed:** Rebuild `installed.json` via reconciliation, or manually create it with the currently-active skill list.

---

## Catalog Outdated

The catalog is ~23 days old (last update appears to be Jul 4). On disk since then:
- `ops-phone-roleplay` (local, modified Jul 27 — registered in CLAUDE.local.md)
- Likely other changes not captured

**On disk but NOT in catalog (62 skills):**

| Skill | Category | Notes |
|-------|----------|-------|
| 00-longform-to-shortform | pipeline | |
| 00-slides | pipeline | |
| 00-social-content | pipeline | |
| 00-video-studio | pipeline | |
| 00-youtube-to-ebook | pipeline | |
| meta-memory-write | meta | |
| meta-skill-creator | meta | Core skill |
| meta-skill-system-creator | meta | |
| meta-synthesize-locals | meta | |
| meta-wrap-up | meta | Core skill |
| mkt-authority-content | marketing | |
| mkt-brand-voice | marketing | Core skill |
| mkt-content-analytics | marketing | |
| mkt-icp | marketing | Core skill |
| mkt-longform-article | marketing | |
| mkt-positioning | marketing | Core skill |
| mkt-short-form-posting | marketing | |
| mkt-social-showing | marketing | |
| mkt-visual-identity | marketing | |
| mkt-youtube-content-package | marketing | |
| ops-blog-pipeline | operations | |
| ops-cms-content | operations | |
| ops-google-ads | operations | |
| ops-phone-roleplay | operations | **Local; registered 2026-07-20** |
| str-ai-seo-local | strategy | |
| str-authority-strategy | strategy | |
| str-cro-audit | strategy | |
| str-internal-links | strategy | |
| str-keyword-strategy | strategy | |
| str-onpage-audit | strategy | |
| str-question-harvester | strategy | |
| str-security-audit | strategy | |
| tool-browser | utility | **Local; registered 2026-07-26** |
| tool-fact-checker | utility | |
| tool-image-search | utility | |
| tool-jobber | utility | |
| tool-linkedin-scraper | utility | |
| tool-n8n | utility | |
| tool-optimoroute | utility | |
| tool-pdf-generator | utility | |
| tool-platform-security | utility | |
| tool-publisher | utility | |
| tool-screenshot-annotator | utility | |
| tool-transcription | utility | |
| tool-video-screenshots | utility | |
| tool-video-upload | utility | |
| tool-web-screenshot | utility | |
| tool-website-security | utility | |
| tool-zernio-social | utility | |
| vid-clip-extractor | video | |
| vid-clip-selection | video | |
| vid-condensed-edit | video | |
| vid-ffmpeg-edit | video | |
| viz-component-library | visual | |
| viz-design-system | visual | |
| viz-frontend-slides | visual | |
| viz-hyperframes | visual | |
| viz-image-gen | visual | |
| viz-page-architect | visual | |
| viz-remotion-video | visual | |

---

## Recommendations

1. **Rebuild installed.json** — run skill reconciliation or manually author the list of currently-installed skills
2. **Update catalog.json** — regenerate from disk to include all 74 skills and their current state
3. **Verify last update date** — confirm when catalog and installed were last maintained

The system is currently operating with a stale manifest, which may block automated skill matching and registration flows.
