---
project: full-audit-2026-05-13
status: active
level: 2
created: 2026-05-13
parent: got-moles-marketing-os
---

# Got Moles — Full SEO / AEO / GEO Audit + Close-Out

L2 project consolidating today's full-stack audit (sitewide + 10 page-level) and the remaining scope needed to close it. Single prioritized fix list feeds the marketing-os GSD execution backlog.

## Goal

Complete the full SEO / AEO / GEO audit of got-moles.com against 2026 standards, post the 2026-05-13 trailing-slash flip. Produce a single prioritized fix list (P1/P2/P3 × impact/effort) for marketing-os GSD execution. Defer or annotate any finding that lives inside another active brief — do not duplicate.

## Why this is a project, not a task

- Two skills × 10+ steps × 13+ pages × 3-4 outstanding workstreams = ~40-60 discrete touchpoints
- Cross-cuts AEO, traditional SEO, local SEO, performance, mobile, schema validation, external citation
- Some scope is blocked on Spencer access (GBP, external claim status)
- Some scope handled by sibling briefs (internal-linking-recovery, aeo-p0-content, etc.)
- Roll-up is the artefact that lets marketing-os prioritise execution

## Acceptance criteria

1. Sitewide audit saved + presented ✅
2. 10 page-level audits saved per Rule G ✅
3. Consolidated roll-up with P1/P2/P3 fix list ✅
4. Bucket 1 (quick wins) executed or explicitly punted
5. Bucket 2 items either completed by Spencer or formally deferred with owner + ETA
6. Bucket 3 items handed to named sibling briefs (handoff confirmed)
7. Memory updated with audit learnings
8. Re-audit cadence set (next Pixelmojo Radar pull + str-ai-seo-local run scheduled)

## Status

| Workstream | Status | File / next action |
|---|---|---|
| **Sitewide audit** (`str-ai-seo-local`) | ✅ Shipped 2026-05-13 | `projects/str-ai-seo-local/2026-05-13_audit.md` |
| **10 page-level audits** (`str-onpage-audit`) | ✅ Shipped 2026-05-13 | `projects/str-onpage-audit/2026-05-13_*.md` (10 files) |
| **Roll-up + prioritized fix list** | ✅ Shipped 2026-05-13 | `projects/str-ai-seo-local/2026-05-13_audit-rollup.md` |
| **Free-inspection strip** (subtask spawned during audit) | ✅ Shipped + verified live 2026-05-13 | Commits `e2375070`, `670ad46a`, `1fd9bb5c` (rebuild trigger). 25 edits, 8 files. Reseed + verify clean across 13 URLs. |
| **Bucket 1 — Quick wins this session** | 🔴 Pending | See breakdown below |
| **Bucket 2 — Needs Spencer access** | 🔴 Blocked | Awaiting Spencer GBP/Bing/Apple/Yelp access |
| **Bucket 3 — Handoff to sibling briefs** | 🟡 Partial | Handoff matrix below |

## Bucket 1 — Quick wins (≤2 hours, low risk)

| # | Task | Skill / tool | Effort |
|---|---|---|---|
| B1.1 | Spot-audit `/faq/` + `/reviews/` (Tier-1 conversion + trust pages) | `str-onpage-audit` (Rule G) | 45 min |
| B1.2 | Citation-gap study loop on 7 Pixelmojo-flagged competitor URLs (fetch with GPTBot UA → extract H1/BLUF/schema/stats → diff vs Got Moles equivalent) | Node fetch + manual diff | 1 hr |
| B1.3 | PageSpeed Insights run on 5 Tier-1 pages: home, about, TMCP, OMP, Seattle | PSI (manual or API) | 30 min |
| B1.4 | Google Rich Results Test on same 5 pages — confirm schema actually validates (not just present in HTML) | Rich Results Test UI | 20 min |
| B1.5 | First-party hallucination check — 5 facts × 4 providers (don't trust Radar's run alone) | Manual queries to ChatGPT, Claude, Perplexity, Gemini | 30 min |

## Bucket 2 — Needs Spencer (defer until access provided)

| # | Task | Owner | Blocker |
|---|---|---|---|
| B2.1 | 3-GBP audit (Seattle, Tacoma, Enumclaw) — primary category, NAP, photos, review velocity, posts cadence, Q&A, attributes, booking | Spencer | GBP dashboard access |
| B2.2 | External citation surface — Bing Places, Apple Business Connect, Yelp (Seattle + Tacoma), Nextdoor, BBB, Angi — claim status + NAP consistency | Spencer | Claim-status verification |
| B2.3 | Bing Webmaster Tools "AI Performance" report | Roy | Property must be verified for 7 days first (per `got-moles-measurement-setup` Track A2) |
| B2.4 | Service-area reconciliation vs previous-agency 1,409-keyword sheet — flag cities ranking ≥3 head terms but missing a live page | Roy | Keyword sheet location |

## Bucket 3 — Handoff to sibling briefs (don't redo here)

| Finding from audit | Hands off to | Status |
|---|---|---|
| Anchor diversity (Pillar 5 scored 0.5 across all 10 page audits) | `internal-linking-recovery` | Active brief — feed audit findings into Phase 1B+ |
| LP conversion / CRO on 4 paid LPs (`/lp/*`) | `str-cro-audit` skill or `city-page-cta-audit` brief | Both exist; LP work belongs to a CRO sub-brief |
| Backlinks profile | `str-authority-strategy` foundation doc | Already exists; pull live Ahrefs/Semrush on next refresh |
| Schema enrichment depth on Tier-2 citation targets (Speakable, expert quotes, stat blocks) | `aeo-p0-content` | Brief claims "shipped" — but Radar AEO 40/D suggests partial regression; needs Bucket 1 verification |
| Wikidata entity + Spencer Person sameAs LinkedIn | `wikidata-entity-strategy` | Active brief |
| Service-area coverage (citySlug-vs-page reconciliation, sitemap depth) | `seo-geo-reinforcement` Track A1 | Active brief |
| `/blog/how-to-get-rid-of-moles/` canonical bug (legacy-root duplicate route) | `cornerstone-url-recovery` | Active brief — append to scope |
| GBP / Bing / Apple / external claim status | `got-moles-measurement-setup` Track E | Active brief |
| Topic clusters / content depth | `mole-content-authority` | Active brief |

## Net-new findings (NOT in any other brief — must land here or in marketing-os execution)

| Finding | Severity | Bucket |
|---|---|---|
| `/services/` hub returns 404 (no page.tsx) | HIGH | New page-build (B1 follow-up) |
| Zero `<table>` and zero `<ol>` across 12 sampled pages (AEO extractability) | HIGH | Lexical builder extension (B3-block-types) |
| `dateModified` missing on Service + city schema | MEDIUM | `schema.tsx` single-file edit |
| `Last-Modified` HTTP header on 0 HTML pages | MEDIUM | Vercel SSR / Next.js header config |
| 5 over-length titles (home, TMCP, 3 blog posts) | LOW | Template-level metadata edits |
| GoogleOther rule missing from `robots.txt` | LOW | One-line edit |

These need a single execution sub-brief OR direct allocation to marketing-os 8-WS workstreams. Recommend: bundle as a "P1 Net-New" workstream under marketing-os.

## Timeline

- **2026-05-13**: Audit + roll-up shipped, free-inspection strip live ✅
- **2026-05-14 → 2026-05-16**: Bucket 1 (~2 hrs total)
- **2026-05-17 → 2026-05-20**: Spencer's Bucket 2 (parallel)
- **2026-05-20 onwards**: P1 Net-New execution begins (Lexical builder block extensions, /services/ hub, schema.tsx dateModified + aggregateRating)
- **2026-06-13**: Re-run str-ai-seo-local + Pixelmojo Radar — verify Bucket 1 + P1 Net-New lift

## Constraints

- **US English** throughout (Got Moles is Washington State)
- **No code edits without explicit go-ahead** per `feedback_no_unauthorized_build_actions`
- **Audit-only mode** for analysis steps; fixes go through standard playbook (`PAGE-BUILD-REFERENCE.md`)
- **Per-page review pattern** for any production page edits per `feedback_per_page_review_pattern`
- **Reseed BEFORE push** per `feedback_reseed_before_push_not_after` (lesson from today's free-inspection deploy)
- **Don't duplicate sibling briefs** — annotate-and-defer is the default
- **All outputs stay inside this brief folder** per agent-os L2 containment rule (links to existing audit files outside the folder are fine — the canonical roll-up lives here)

## Files of record

**Inside this brief folder:**
- `brief.md` (this file)
- *(future bucket outputs land here)*

**Linked artefacts (outside, canonical locations):**
- Sitewide audit: `projects/str-ai-seo-local/2026-05-13_audit.md`
- 10 page audits: `projects/str-onpage-audit/2026-05-13_got-moles-*.md`
- Roll-up: `projects/str-ai-seo-local/2026-05-13_audit-rollup.md`
- Audit tooling: `projects/str-ai-seo-local/_audit-tools/schema-extract.mjs` + `schema-extract-2026-05-13.json`
- Pixelmojo benchmark: `~/Downloads/ai-visibility-report-got-moles.com-2026-05-13.json`

**Free-inspection sub-deliverable:**
- Commits: `e2375070` (25-edit strip), `670ad46a` (no-op), `1fd9bb5c` (regenerated payload-types — triggered the corrective Vercel rebuild)
- Verified clean on production across 13 URLs

## Sibling / parent briefs

- **Parent (GSD):** `got-moles-marketing-os` — this audit's roll-up feeds the marketing-os 8-WS prioritisation
- **Siblings (active):** `aeo-audit-2026`, `aeo-p0-content`, `cornerstone-url-recovery`, `internal-linking-recovery`, `seo-geo-reinforcement`, `got-moles-measurement-setup`, `gsc-tracking-automation`, `mole-content-authority`, `wikidata-entity-strategy`, `trailing-slash-canonical-alignment`, `onpage-audit-sweep`, `city-page-cta-audit`
- **Note on overlap with `onpage-audit-sweep`:** that brief tracks per-page-fix execution; today's 10 audits feed into it. This brief is the audit + close-out; `onpage-audit-sweep` is the execution tracker. They run alongside, not redundantly.

## Lessons learned (today)

1. **Read both BUILD-METHODOLOGY.md AND PAGE-BUILD-REFERENCE.md at session start.** Today I read only the former. PAGE-BUILD-REFERENCE.md has the deploy + reseed flow.
2. **Reseed BEFORE the push that ships the edit.** Pushing first means Vercel prerenders from stale Supabase. Captured in `feedback_reseed_before_push_not_after.md`.
3. **Verify on staging (project-pf8c6.vercel.app), not production, per playbook step 8.** Production may have edge cache delays even after staging is clean.
4. **Empty commits don't bust Vercel's static prerender.** If Vercel doesn't pick up a fresh build, push a REAL code change (even a regenerated type file).

## Next session resume

1. Read this brief
2. Pick Bucket 1 task(s) per Roy's priority
3. Run Rule G discipline on any new page audits
4. Update Status table as items close
5. When all 3 buckets resolved (executed or formally deferred), flip `status: complete` and feed final roll-up to `got-moles-marketing-os` GSD execution backlog
