## Learnings Health Check — 2026-08-04

_Note: the first Monday of August 2026 was 2026-08-03; this run fired a day late (Tuesday 2026-08-04) but is treated as the monthly first-Monday run since no full report has run yet this month._

### Summary
- Total lines: 251
- Skill sections: 76 installed skills (10 with learnings entries, 66 empty/missing)
- Issues found: 10

### Bloat

Total line count (251) is well within the 500-line cap, and no single section exceeds 100 lines. The real bloat problem is **structural fragmentation** — the same section header appears multiple times at different points in the file instead of once, so related learnings are scattered and harder to find:

- `### tool-optimoroute` appears twice — lines 46–74 (~29 lines) and again at lines 76–83 (~8 lines), back-to-back with only a blank line between them. Trivial to merge.
- `## tool-jobber` appears twice — lines 84–123 (~40 lines) and again at lines 163–167 (~5 lines), separated by four other sections.
- `### meta-wrap-up` (lines 25–29) and `## meta-wrap-up` (lines 175–179) — same skill, two locations, **and inconsistent heading level** (`###` vs `##`).
- `### ops-phone-roleplay` (lines 30–34) and `## ops-phone-roleplay` (lines 180–186) — same skill, two locations, same heading-level inconsistency.
- `## General` appears **three times** — lines 3–22, 147–154, and 245–251 — fragmenting the cross-skill "what works / doesn't work" notes into three disconnected blocks.
- `## technician-route-automation (route pipeline)` (lines 187–218) and `## technician-route-automation` (lines 219–244) — same topic, two headers with slightly different text, ~58 lines combined. (Also flagged under Gaps/Stale — this isn't an installed skill folder.)

Separately: from line 84 onward, every section header drops from `###` to `##`, which puts skill sections at the same markdown level as `## Individual Skills` itself rather than nested under it. Cosmetic, but it's what let the duplicate/scattered headers happen unnoticed.

### Contradictions

None found within a section. One near-miss worth a note (see Stale Entries): the 2026-07-19 `tool-optimoroute` weekly-flow entry (push-week → mirror-lastweek → optimize → verify-mirror → write) and the 2026-07-26 `technician-route-automation` weekly-flow entry (move in Jobber → push-week --grid → lock-techs → re-plan → write) describe two different "the correct weekly pipeline" sequences for what looks like the same job. They aren't logically contradictory (the second appears to supersede the first as the territory-grid system replaced the mirror-based one), but nothing marks the first as outdated, so a future reader could follow the wrong one.

### Gaps

10 of 76 installed skills have a learnings section with entries: `meta-wrap-up`, `ops-phone-roleplay`, `tool-pdf-generator`, `viz-image-gen`, `tool-optimoroute`, `tool-jobber`, `tool-n8n`, `ops-cron`, `tool-browser`, `ops-google-ads`.

66 installed skills have **no** learnings section at all. Highest-signal ones worth prioritizing first (skills that have clearly been run based on recent memory/deliverables but left no learnings):

- `mkt-brand-voice`, `mkt-positioning`, `mkt-icp`, `mkt-copywriting`, `mkt-content-repurposing`, `mkt-authority-content`, `mkt-visual-identity`
- `str-ai-seo`, `str-ai-seo-local`, `str-authority-strategy`, `str-keyword-strategy`, `str-onpage-audit`, `str-trending-research`
- `ops-blog-pipeline`, `ops-cms-content`
- `00-social-content`, `00-longform-to-shortform`, `00-slides`, `00-video-studio`, `00-youtube-to-ebook`
- `tool-humanizer`, `tool-firecrawl-scraper`, `tool-zernio-social`, `tool-pdf-generator`(has entries, ignore)

Remaining 47 with zero entries (lower priority — no clear recent-use signal): `meta-memory-write`, `meta-skill-creator`, `meta-skill-system-creator`, `meta-synthesize-locals`, `mkt-content-analytics`, `mkt-longform-article`, `mkt-short-form-posting`, `mkt-social-showing`, `mkt-ugc-scripts`, `mkt-youtube-content-package`, `str-cro-audit`, `str-internal-links`, `str-question-harvester`, `str-security-audit`, `tool-fact-checker`, `tool-image-search`, `tool-linkedin-scraper`, `tool-platform-security`, `tool-publisher`, `tool-screenshot-annotator`, `tool-stitch`, `tool-transcription`, `tool-video-screenshots`, `tool-video-upload`, `tool-web-screenshot`, `tool-website-security`, `tool-youtube`, `vid-clip-extractor`, `vid-clip-selection`, `vid-condensed-edit`, `vid-ffmpeg-edit`, `viz-component-library`, `viz-design-system`, `viz-excalidraw-diagram`, `viz-frontend-slides`, `viz-hyperframes`, `viz-interface-design`, `viz-nano-banana`, `viz-page-architect`, `viz-remotion-video`, `viz-stitch-design`.

### Stale Entries

- **`## technician-route-automation` is not an installed skill** — it's a project folder (`projects/briefs/technician-route-automation/`), not a `.claude/skills/` entry. Per AGENTS.md, learnings.md sections belong to skills (`{folder-name}`); route-pipeline learnings should live under the skills actually used (`tool-optimoroute`, `tool-jobber`) or in the project brief itself, not as a standalone pseudo-skill section.
- **2026-07-19 `tool-optimoroute` "proven weekly flow" (push-week → mirror-lastweek → optimize → verify-mirror.mjs → write) reads as superseded** by the 2026-07-26+ territory-grid flow (push-week --grid → lock-techs-to-grid → re-plan → write) documented later in the same section and in `technician-route-automation`. Nothing marks the mirror-lastweek approach as retired.
- **`### ops-cron` line 140 ends with "Roy's proper fix still pending."** (dated 2026-07-10, ~1 month old). Worth a one-line reverify next time cron is touched — either confirm still pending or close it out.

### Recommended Actions

- Merge the six duplicate/split headers into single sections in their first-occurrence location: `tool-optimoroute`, `tool-jobber`, `meta-wrap-up`, `ops-phone-roleplay`, `General` (×3 → 1), `technician-route-automation` (×2 → 1, and reconsider whether it belongs in learnings.md at all).
- Normalize all `# Individual Skills` subsection headers to the same level (`###`, matching the original convention at the top of the file) so `## General` stops sitting visually parallel to `## Individual Skills`.
- Add a one-line "superseded by <date> entry" note on the 2026-07-19 mirror-lastweek flow rather than deleting it (route-automation learnings are dense and hard-won — keep the history, just mark it dead).
- Pick 3-4 of the highest-signal gap skills (`mkt-brand-voice`, `str-ai-seo-local`, `ops-blog-pipeline`, `00-social-content`) and backfill a learnings section next time each runs — these clearly have execution history (brand_context/, projects/ output) but no captured learnings.
- If `technician-route-automation` stays in learnings.md long-term, register it as what it actually is (a project, not a skill) — e.g. rename the header to make that explicit, or move it under a `## Projects` top-level section separate from `## Individual Skills`.
