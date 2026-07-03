---
plan: seo-foundation-recovery
date: 2026-05-07
parent_brief: brief.md
supersedes_breadth_of: 2026-05-07_h1-h2-review.md (kept as reference, not the execution path)
status: ready-for-approval
data_sources:
  - gsc-query-by-page-2026-05-07.json (Phase 1, 16,857 rows / 326 pages)
  - firecrawl-serp-2026-05-07.json (Phase 2, 31 priority queries)
  - target-keywords.md (Sub 1, ~130 pages mapped)
---

# Got Moles SEO Recovery Plan

## Headline

Stop bleeding, then build. Six phases, run in order, each gate must clear
before the next starts. Targeted surgery on 20-25 high-impact pages first;
sitewide sweep waits until the targeted work proves the pattern.

## The four truths Phase 1+2 gave us

1. Sitewide CTR is 0.24% (340,954 imp / 802 clk over 90 days). That's
   well below the 1.5-3% baseline for a ranking site. We rank, we just
   don't get clicked.
2. Biology cluster ranks (5/8 in top 10, multiple position 1s) but the
   AI Overview eats the clicks. Fix = BLUF capture, not better ranking.
3. Commercial cluster is GONE: 0/4 service-specific in top 10, 2/6
   commercial head terms in top 10. molemasters.biz + mole-patrol.com
   eating the slots.
4. Bellevue (largest market) is NOT in top 10. Sammamish/Tacoma/Kirkland
   are. So it's not a brand-strength issue — it's a per-page issue we
   can fix.

## Triage logic

| Priority | Why |
|---|---|
| 1. Money pages first | Commercial pages = booked jobs. Out-of-top-10 = zero revenue. Highest ROI per fix. |
| 2. Bellevue + city outliers | Same template as Tacoma/Kirkland (which rank). Diff isolates the fix. Replicate to weak cities. |
| 3. Biology BLUF capture | Cheap, repeatable. Recovers clicks we already earned the impressions for. |
| 4. Cannibalisation cleanup | 11 thin /mole-repellant-{city}/ + dup URL variants — splitting equity. |
| 5. Coverage gaps | New pages where Phase 2 shows queries we have no page for. |
| 6. Authority + sitewide sweep | Compounds over months. Runs after the surgery proves the pattern. |

Don't reverse this. Sitewide sweep before money-page surgery = same
mistake we made pre-launch.

---

## Phase A — Money Page Surgery (3-5 days)

**Goal:** move 6 commercial pages from out-of-top-10 → top-5.

**Pages:**
| Page | Target query | Phase 2 status |
|---|---|---|
| `/` (homepage) | "mole control western washington" + "mole control washington" | pos 5 best (commercial head terms gone) |
| `/year-round-mole-control/` (TMCP) | "year round mole control" + "professional mole control" | NOT in top 10 |
| `/one-time-removal/` | "professional mole removal" + "lawn mole removal cost" | NOT in top 10 |
| `/commercial/` | "commercial mole control" | NOT in top 10 |
| `/services/` (or service hub) | "lawn mole control" + "mole exterminator near me" | NOT in top 10 |
| `/about/` (Spencer authority) | "spencer ham mole control" + Person schema | (not measured but anchors authority) |

**Per page:**
1. H1 must include the exact target query phrase (homepage H1 already
   flagged, must change from brand-led to query-led).
2. Title tag = `{Target Query} | Got Moles` (under 60 chars).
3. Meta description = BLUF answer to the query, ≤155 chars, ends with CTA.
4. H2 structure must answer the top 3 PAA-style questions for that
   query (we don't have PAA yet, so use top GSC queries to that page +
   competitor H2 patterns from molemasters.biz / mole-patrol.com).
5. First 60 words = direct BLUF (lead with WHO/WHERE/WHAT, not story).
6. Schema check — Service schema with `serviceArea`, `areaServed`,
   `aggregateRating: {ratingValue: 5, reviewCount: 219}`.
7. Internal links — at least 3 contextual inbound from blog/city pages
   (per `feedback_per_post_topical_linking.md`).

**Gate to pass:** GSC position improvement on each target query within
14 days, OR documented reason why not (e.g., proximity-locked Map Pack).

**Deliverable:** `2026-05-07_phase-a-money-pages.md` — page-by-page
spec sheet (current H1/H2/title/meta vs proposed). Roy approves before
commits.

---

## Phase B — Bellevue + City Outlier Diagnosis (1-2 days)

**Goal:** find why Bellevue is out of top 10 when Sammamish/Tacoma/Kirkland
rank.

**Method:**
1. Diff `/mole-control-bellevue/` against `/mole-control-tacoma/` (pos 2)
   and `/mole-control-kirkland/` (pos 2). H1, H2, body length, schema,
   internal links inbound, service-area mentions.
2. Identify the variable that differs between ranking and non-ranking
   cities.
3. Apply the fix to Bellevue + the next 5 weakest city pages (Phase 2
   only sampled 4 cities; pull GSC data for all 92 to identify outliers).

**Gate:** Bellevue moves into top 10 within 30 days, OR documented
proximity issue.

**Deliverable:** `2026-05-07_phase-b-city-diff.md` — diff report + fix
template that propagates to weak cities.

---

## Phase C — Biology BLUF Capture (2-3 days)

**Goal:** recover clicks the AI Overview is currently eating.

**Pages:** the 8 biology cluster pages from Phase 2 (`voles-vs-moles`,
`how-many-eyes-do-moles-have`, `are-moles-blind`, `do-moles-bite`, etc.)
plus any Phase 1 GSC top-impression-low-CTR pages.

**Per page:**
1. Add a 40-60 word BLUF answer in `<p>` immediately under the H1, before
   any H2.
2. Under each H2, add a 1-2 sentence direct answer block (the H2 *is*
   the question; the first paragraph is the answer; supporting content
   follows).
3. Add `FAQPage` or `QAPage` schema where the H2 structure is
   question-shaped.
4. Add `Person` schema attribution to Spencer for authority.
5. Internal link from each biology page to the relevant commercial page
   (Biology → "What to do about it" → service page).

**Gate:** CTR on these pages moves from baseline (~0.1-0.3% per Phase 1)
toward 1%+ within 30 days.

**Deliverable:** `2026-05-07_phase-c-bluf-capture.md` — list of pages,
the BLUF block per page (writeable from current content + GSC top
queries to each page).

---

## Phase D — Cannibalisation Cleanup (Sub 1.5, 1 day)

**Goal:** consolidate equity-splitting duplicates.

**Targets** (already identified in target-keywords.md):
- 11 thin `/mole-repellant-{city}/` pages — merge into a single
  `/mole-repellents-dont-work/` post + redirect city variants.
- 30+ duplicate URL variants (legacy /blog/* + /* doubles, slug-only
  drift). Audit, pick canonical, 301 the rest.

**Method:**
1. Pull all 92 city pages + 35 blog posts from sitemap.
2. Group by intent.
3. For each group with >1 page: pick the canonical (highest GSC traffic
   over 90d), 301 the rest, update internal links.

**Gate:** GSC sees 11 + 30 = ~40 fewer indexed thin pages within 30 days.

**Deliverable:** `2026-05-07_phase-d-canonicalization.md` — redirect
list + internal-link update list.

---

## Phase E — Coverage Gap New Pages (5-7 days)

**Goal:** create pages for queries Phase 2 showed are searchable but
where we have no page.

Held until Phase A-D ship. Can't justify new pages while existing pages
are bleeding.

**Deliverable:** spec list — to be written after Phase A-D learnings.

---

## Phase F — Sitewide Sweep + Authority + Linking Resume

**Goal:** apply the learnings from Phase A-C to the remaining ~110 pages.
Runs after Phase A-D prove the pattern works.

**Components (in parallel where possible):**
- Sub 2: `str-authority-strategy` (now justified with target-keywords +
  Phase 2 competitor data)
- Sub 3: build `str-onpage-audit` skill (codify Phase A pattern as
  reusable)
- Sub 4: sitewide audit + fix (the 110 pages not touched in A-C)
- Internal-linking-recovery resume (Phase 1B-extension, 1C, 2)
- Phase 3 SerpAPI (PAA + AIO + Map Pack data) — optional, ~$50/mo

**Deliverable:** rolling. Re-baseline GSC at end of Phase A-D, then
plan F as its own brief.

---

## Decision gates

| Gate | Trigger | If we pass | If we fail |
|---|---|---|---|
| A→B | 6 money pages spec'd, Roy approved, code merged, deployed | Run Phase B | Stop, diagnose why approval blocked |
| B→C | Bellevue diagnosed, fix template defined | Run Phase C | Pull more GSC data, may need SerpAPI Map Pack |
| C→D | BLUF blocks shipped on 8 biology pages | Run Phase D | Skip if BLUF can't be applied (technical block) |
| D→E | Redirects shipped, GSC index drops to expected | Run Phase E | Re-audit redirect logic |
| E→F | New pages live, GSC starts attributing | Plan Phase F | Pause, re-baseline |

---

## What's out of scope (this plan)

- New blog post creation (deferred until coverage gaps in Phase E)
- Authority strategy execution (Phase F, Sub 2)
- Internal-linking-recovery Phase 1B-extension (Phase F)
- Microsoft Clarity UX findings (separate track — wait for first 30 days
  of session data after Spencer creates project)
- Phase 3 SerpAPI subscription (decision in Phase F)

## Estimated total active days

Phase A: 3-5
Phase B: 1-2
Phase C: 2-3
Phase D: 1
Phase E: 5-7
**Total to end of Phase E: 12-18 working days**

Phase F runs in parallel where possible; full recovery cycle 4-6 weeks.

---

## Approval needed

Confirm or change:
1. Phase order (A→B→C→D→E→F)
2. Page list for Phase A (the 6 commercial pages)
3. Whether to skip the master H1/H2 review markup (this plan replaces it
   as the execution path; the review stays as a reference doc)
4. Whether Phase 3 SerpAPI is in or out (current default: out for now)
