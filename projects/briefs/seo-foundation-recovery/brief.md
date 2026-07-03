---
project: seo-foundation-recovery
status: complete
level: 2
created: 2026-05-06
completed: 2026-05-10
parent: got-moles-marketing-os
absorbed-into: onpage-audit-sweep
---

> **COMPLETE 2026-05-10.** Subs 1-3 shipped (foundation skills run, target-keywords.md + authority-strategy.md written, str-onpage-audit skill patched with Rules A-G). Sub 4 (per-page remediation) absorbed into the L2 `onpage-audit-sweep` queue.


# Got Moles SEO Foundation Recovery

Parent project for the foundation work that should have run before the website was built. Discovered 2026-05-06: `str-keyword-strategy` and `str-authority-strategy` were never run for Got Moles, so every page on the new build was constructed without a keyword-page mapping or authority strategy as input. This caused systemic H1/title/meta misalignment site-wide — first surfaced as the homepage rank slip 6.7 → 8.3, but almost certainly affects service pages, About, How-It-Works, Reviews, and possibly the 35 blog posts and 93 city pages.

## Why this exists

Per `feedback_run_foundation_skills_first.md` (memory):
> The Got Moles website was built (35 blog posts, 93 city pages, 3 service pages, homepage) WITHOUT running `str-keyword-strategy` first. ... H1 had been changed from keyword-led "Mole Control Seattle" (ranking) to brand-led "Your Lawn Deserves Better Than Moles" (no keyword signal). Site lost rank position 6.7 → 8.3 on homepage and almost certainly has the same issue across all major pages because the BUILD-METHODOLOGY page checklist steps "Keywords assigned" + "SEO verification: H1 matches target keyword" had no source-of-truth doc to read from.

## Goal

Run the missing foundation skills, build the missing per-page audit skill, then systematically remediate H1 / title / meta / schema / alt-text alignment across every page on the site against a validated keyword + authority foundation.

## Sub-projects (sequenced — each gates the next)

### Sub 1 — Keyword strategy
**Brief:** to be created at `clients/got-moles/projects/briefs/keyword-strategy/brief.md` if scope grows; for now scoped under this parent.
**Skill:** `str-keyword-strategy`
**Output:** `brand_context/target-keywords.md` — page-by-page keyword + volume + intent + current rank
**Inputs:**
- Agency tracker xlsx: `clients/got-moles/projects/briefs/website-rebuild-rebrand/Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx` (2,668 KWs, 635 #1)
- Rankings export: `clients/got-moles/projects/briefs/website-rebuild-rebrand/rankings-export.csv`
- GSC export: `c:\Users\roy.castleman\Downloads\got-moles.com-Performance-on-Search-2026-05-05.xlsx` (1,000 queries, 382 pages)
- 90-day GSC baseline: `clients/got-moles/projects/briefs/cornerstone-url-recovery/gsc-baseline-2026-05-02.md`
**Brand-disambiguation requirement:** mole/medical confusion (cost + recurrence queries hijacked by dermatology) — keyword strategy must separate "mole CONTROL" / "lawn mole removal" / pest intent from "mole removal" / dermatology intent at strategy level.
**Status:** STARTING NOW

### Sub 2 — Authority strategy
**Skill:** `str-authority-strategy`
**Output:** `brand_context/authority-strategy.md`
**Depends on:** Sub 1 (`target-keywords.md` is required input)
**Status:** PENDING SUB 1

### Sub 3 — Build `str-onpage-audit` skill
**Skill:** does not exist — needs to be built via `meta-skill-creator`
**What it should do:**
- For every page on the site, read `target-keywords.md` to find its target keyword + intent
- Audit H1 / meta title / meta description / H2-H3 hierarchy / image alt text / schema type / word count against the target
- Flag misalignments per page with specific recommended changes
- Optional apply-fixes mode for systematic remediation
- Use `references/discovery-patterns.md` from `str-internal-links` for codebase scan patterns
**Depends on:** Sub 1 (`target-keywords.md`) — defer build until concrete input format is known
**Status:** PENDING SUB 1

### Sub 4 — Sitewide on-page audit + fix
**Skill:** `str-onpage-audit` (built in Sub 3)
**Output:** `clients/got-moles/projects/str-onpage-audit/{date}_audit.md` with per-page fix list
**Apply mode:** systematic remediation across homepage, service pages, About, How-It-Works, Reviews, FAQ, Service Areas, blog posts, city pages
**Depends on:** Sub 3
**Status:** PENDING SUB 3

### Existing related sub-briefs (continue in parallel where independent)

- **Internal Linking Recovery L2** (`internal-linking-recovery/brief.md`) — Phase 0 + 1A done, Phase 1B 10/35 posts done. **Now blocked on keyword strategy** for any further work because anchor text + city-archetype mapping needs validated keyword data. Park here, resume after Sub 1 completes.
- **Cornerstone URL Recovery L2** (`cornerstone-url-recovery/brief.md`) — Phase 1 deploy done 2026-05-02, in 14-30d re-index window. Continues independently.
- **Measurement Setup L2** (`got-moles-measurement-setup/brief.md`) — GTM, GA4, CallRail. Continues independently.

## Build methodology rule update (apply globally)

Per `feedback_run_foundation_skills_first.md`: BUILD-METHODOLOGY.md should be updated to hard-gate Phase 4 (Design Framework) and Phase 5 (Production Build) on the existence of `brand_context/target-keywords.md` and `brand_context/authority-strategy.md`. If either is missing, do NOT proceed to build. Add to BUILD-METHODOLOGY.md as part of this project.

## Acceptance criteria

- [ ] `brand_context/target-keywords.md` exists, covers all 130+ pages, validated against GSC + agency data
- [ ] `brand_context/authority-strategy.md` exists, builds on target keywords
- [ ] `str-onpage-audit` skill exists, registered, and runs against any page in the codebase
- [ ] Sitewide audit complete with per-page fix list
- [ ] Homepage H1 + service-page H1s + About + How-It-Works fixed against target keywords
- [ ] City page template H1 + meta verified or updated
- [ ] Blog post H1 + meta verified per cluster against keyword volume data
- [ ] BUILD-METHODOLOGY.md updated with foundation-skill gate
- [ ] GSC monitor at 30 days post-fix-deploy: rank recovery on homepage + at least 3 of the 6 same-URL rank-drops we identified

## Reversibility

Every fix is a single-commit revert. No destructive operations. Foundation docs (target-keywords.md, authority-strategy.md) are additive — they don't modify existing site content.

## Status

**Active 2026-05-06.** Sub 1 (keyword strategy) starting now via `str-keyword-strategy` skill. All other internal-linking and per-page work paused until foundation lands.

---

## Status update 2026-05-08 (now Phase 1+2 of marketing-os GSD)

This brief is now subsumed under `got-moles-marketing-os` GSD as Phase 1 (SEO Foundation) + Phase 2 (On-Page Audit Skill + Sweep). All sub statuses updated:

| Sub | Status | Commit |
|---|---|---|
| 1 — target-keywords.md | ✅ v1.0 (2026-05-06) → v1.1 (2026-05-08, Spencer's docs folded in) | `1ee8411` |
| 1.5 — Cannibalisation | ✅ DONE (species 301 + eyes pair sustain) | `2ee5eed` |
| 2 — authority-strategy.md | ✅ v1.0 (440 lines, 10 sections) | `57cfe02` |
| 3 — str-onpage-audit skill | ✅ Built at root with 8 pillars + audit-skill pattern | `1d3e61f` |
| 4 — Sitewide audit + fix | 🟡 IN PROGRESS — /about/ + sitewide schema architecture pass shipped | `d8dfa25` `04af75a` `ccf731f` |

Per `feedback_per_page_review_pattern.md`: Sub 4 is per-page apply, not bulk sweep. Homepage queue position next. See `.planning/PROJECT.md` for current GSD phase + page queue.
