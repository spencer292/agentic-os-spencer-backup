---
project: city-page-cta-audit
status: pending
level: 2
created: 2026-05-09
client: got-moles
trigger: 86 city-modified EXACT keywords added to T1 paid (2026-05-09) routing to 33 city pages — CTA effectiveness now directly determines paid CPL
---

# City Page CTA Audit (sitewide)

## Why this exists
On 2026-05-09 we added 86 EXACT city-modified keywords to T1 paid, each with a per-keyword final-URL override pointing to that city's strongest organic page (e.g. `mole control bellevue` → `/mole-control-bellevue/`). 33 city pages are now active paid LPs.

This unlocks Quality Score gains (page-keyword alignment) but also exposes a gap: **these pages were built for organic traffic and may not have CTAs optimised for paid-click conversion**. A weak CTA on a high-Quality-Score page = wasted paid click + Quality Score backslide as bounce signal accumulates.

## Goal
Every city page on got-moles.com has a clear, conversion-optimised CTA stack that:
1. Captures the visitor within 5 seconds of landing (above-the-fold call/form CTA)
2. Re-engages mid-scroll (sticky bar or repeated CTA)
3. Catches scroll-to-bottom intent (final CTA + secondary path)
4. Provides a fallback path to the quiz (`score.got-moles.com`) for non-immediate-buyers

## Scope
- All 90+ city pages on got-moles.com (`/mole-control-{city}/`, `/{city}/`, `/{city}-mole-removal/`, `/mole-trapping-{city}/`, `/mole-repellent-{city}/`)
- All page templates (city, service, blog) — but city pages are the priority because of paid spend exposure
- Mobile-first — most paid traffic is mobile

## Acceptance criteria
- Each city page has at minimum: (1) hero phone CTA visible without scroll, (2) mid-page form, (3) sticky-bottom mobile bar with phone, (4) footer CTA with quiz fallback
- All CTAs use canonical `(253) 750-0211` (CallRail swap handles tracking)
- All form submits fire `generate_lead` dataLayer event with ECL `user_data` payload (already wired)
- Scroll-depth + click-tracking instrumented via Microsoft Clarity (pending Clarity install)
- A/B test framework in place for CTA variants once Clarity gives baseline

## Constraints
- Posture A — silent on trap mechanism (CTAs cannot describe killing methods)
- Got Moles does NOT offer free inspections — CTAs cannot say "free inspection / free quote / free estimate" (per `feedback_got_moles_no_free_inspection`)
- "Free 2-Min Mole Quiz" is the only free claim allowed
- US English throughout
- Don't break the current SEO-strong page structure — CTAs are additions/refinements, not rewrites

## Phase plan
| Phase | What | Status |
|---|---|---|
| 0 | Brief scoped (this doc) | ✅ 2026-05-09 |
| 1 | Audit current city-page CTAs — sample 10 representative cities, document current CTA inventory + heuristic CRO score | pending |
| 2 | Define canonical city-page CTA component spec (hero + sticky + mid + footer) | pending |
| 3 | Implement once across all 33 paid-LP cities (priority) | pending |
| 4 | Roll to remaining 60+ city pages | pending |
| 5 | Wire scroll/click instrumentation via Clarity (depends on Clarity install — Spencer-side action F1 in prep doc) | pending |
| 6 | Bake in A/B test variants once 14d baseline collected | pending |

## Dependencies
- Microsoft Clarity install (Spencer creates project, Roy adds env var) — required for measuring CTA effectiveness
- `str-cro-audit` skill — runs the heuristic audit in Phase 1
- `viz-component-library` skill — produces the CTA component spec in Phase 2
- `ops-cms-content` skill — applies changes across pages in Phase 3+4

## Cross-references
- `projects/briefs/got-moles-paid-search/brief.md` (root) — paid context, why this matters
- `feedback_got_moles_no_free_inspection.md` — banned CTA claims
- `feedback_got_moles_posture_a_silent_mechanism.md` — Posture A applies to CTA copy
- `reference_callrail_got_moles_config.md` — phone CTA tracking infrastructure
- `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/` — the codebase to audit

## What this is NOT
- Not a redesign of the city pages
- Not a content rewrite
- Not a new page build
- Not an SEO/ranking concern (preserve existing organic strength)
- Not the same as the per-post topical-linking work

## Status
**Pending start.** Begin after Spencer call (need Clarity project ID for measurement) and after first 7-day data on the new city-modified keywords (~2026-05-16) to identify which city pages are getting the most paid traffic — those are the priority for Phase 3.
