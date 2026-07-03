---
project: internal-linking-recovery
type: plan
created: 2026-05-23
status: ready to execute (Got Moles build window — str-internal-links skill)
builds_on: got-moles-internal-linking-strategy.md (canonical) + the paused L2 recovery (was 58/100, target ≥75)
purpose: Channel link equity AND visitor clicks from the high-power organic pages to the money pages. Conversion-funnel direction, not just density recovery.
---

# Got Moles — Power-Pages → Money-Pages Internal Link Plan

## The problem (Roy, 2026-05-23)
The pages sitting on the most ranking power dead-end into more content instead of funneling
equity + visitors to the pages that convert. Fix the *direction* of internal linking.

## Grounding (don't restart cold)
- **Canonical method:** `got-moles-internal-linking-strategy.md` — 3-tier hub-and-spoke, per-post
  surgical contextual links, varied descriptive anchors. **Never footer city-block dumps**
  (flagged anti-pattern, `feedback_per_post_topical_linking.md`).
- **Prior work done:** Phase 0 schema + Phase 1A FAQ deep links + Phase 1B (top-10 blog posts).
  Audit 58/100. Paused: city-pages→blog (Phase 1C) + cross-cluster, blocked on `target-keywords.md`.

## The power pages (equity reservoirs — from the rankings corpus)
- **Info pages:** `/how-many-eyes-do-moles-have/` (**46 top-3 on one page**), `/do-moles-bite/`, and the biology Q&A cluster.
- **Top city pages:** Redmond (85 top-3), Renton (74), Tukwila, Woodinville, Shoreline, Maple Valley, Burien, Issaquah, Enumclaw, Puyallup.
- **Homepage** (142 top-3 keyword magnet).

## The money pages (link TARGETS)
1. **TMCP — Total Mole Control Program** ($100/mo recurring — highest LTV) ⟵ priority *(confirm with Roy)*
2. **One-Time Mole Removal** ($150/$450)
3. **Commercial Mole Control**
4. **Contact / call** (the conversion action)
5. High-intent **city pages** (for geo-relevant funneling)
- **Excluded:** the paid `/lp/{city}/` pages — they're `noindex`, never internal-link to them.

## Method
Per-post **in-content contextual links**, descriptive varied anchors matched to the destination's
keyword, placed in the body (not footers). Target counts per the strategy (info/FAQ pages 10-15,
city 5-8, blog 6-12). Add "Related / Next step" section-nav where natural.

## Plan (phased)
**Phase A — Audit current state (re-run, ~18 days stale + 23 LPs + FAQ blocks changed things):**
Run `str-internal-links` audit → map every internal link + score 6 pillars, **focused on equity
flow**: which high-power pages lack links to money pages, ranked by the equity they sit on. Output
the power→money gap list.

**Phase B — Power → money quick wins (highest leverage):**
- Add 2-3 contextual money-page links into each top **info page** (the 46-top-3 page first) — e.g.
  a biology page about mole damage links naturally to One-Time Removal + TMCP.
- Audit the **homepage** money-page link prominence; ensure clear paths to TMCP + One-Time.
- Add a tasteful "Got moles now? → [service]" in-content CTA on the highest-traffic info/city pages.

**Phase C — City pages → services + relevant blogs (revives Phase 1C):**
- Each city page links to all 3 services + Service Areas hub + 3-5 topically-relevant blogs.
- Archetype mapping (Eastside/Valley/Waterfront/Urban/Rural) **needs Got Moles `target-keywords.md`** —
  if it doesn't exist yet, do the simpler service-link pass now and the archetype blog pass after.

**Phase D — Blog within-cluster + Related Articles + fix dead-ends (Reviews page).**

**Phase E — Re-audit (target ≥75/100) + GSC monitor** (clicks ≥ baseline, impressions ≥4,500/day).

## Where / how
Run in the **Got Moles window** (`str-internal-links` skill = audit + apply modes, live codebase).
Apply per phase; reseed where city/blog data changes (city pages read `city-data.ts`; blog
`blog-data.ts`). Verify on staging → push `mine main` → prod.

## Open inputs
1. **Money-page priority ranking** — default assumed TMCP + One-Time primary; confirm with Roy.
2. **Got Moles `target-keywords.md`** — gates Phase C archetype mapping (the original pause reason). Confirm if it now exists.

## Acceptance
str-internal-links audit ≥75/100; every top info/city page + homepage carries ≥2 contextual
money-page links; no power page dead-ends; GSC clicks/impressions recover; anchors varied (none >5x).
