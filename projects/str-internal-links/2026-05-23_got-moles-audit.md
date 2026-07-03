---
site: got-moles.com
date: 2026-05-23
score: 72/100
orphan_pages: 8 (functional — zero contextual inbound)
fixes_p1: 4
fixes_total: 10
status: draft
prior_score: 58/100 (2026-05-05)
focus: conversion-funnel / power→money equity flow
revised: 2026-05-24 — full per-page inbound sweep added; score 75→72 (orphan+equity pillars corrected)
---

# Got Moles — Internal Link Audit (2026-05-23)

Re-audit of got-moles.com internal linking, ~18 days after the last (58/100, 2026-05-05) and after 23 paid LPs + FAQ deep-link work shipped. Commissioned with a **conversion-funnel focus** per Roy's 2026-05-23 power-to-money plan: do the high-power organic pages funnel equity + visitors to the money pages, or dead-end into more content?

## Headline finding — the premise was half right

**The plan assumed the power pages dead-end into content instead of funneling to money pages. The codebase disproves that for the blog/info layer, and confirms it for one specific direction.**

| Direction | State | Verdict |
|---|---|---|
| Blog/info pages → money pages (TMCP/One-Time/Commercial/contact) | **All 32 posts link to money pages** (avg ~12 internal links/post; biology "power pages" 10–15 each) | ✅ Already solved |
| Blog → blog (cluster cross-linking) | Strong, internally consistent | ✅ |
| Service pages → each other + cities | Full cross-link + 12 cities each | ✅ |
| City pages → services (money) | Every city links all 3 services via ServiceCards | ✅ |
| City pages → nearby cities | 6 nearest per city (SearchPilot pattern) | ✅ |
| FAQ → deep content | 16 contextual deep-links (Phase 1A shipped) | ✅ |
| Reviews → services + about + case studies | Present | ✅ (Gap 7 closed) |
| **City pages → blog/content** | **ZERO. No blog fields in `CityData`, none in template.** | ❌ **Main gap** |
| **Homepage → cornerstone/blog content** | Homepage links services + 12 cities, **no content links** | ❌ |
| **Blog/content → `/author/spencer`** | Spencer named as author/expert; **0 inbound from posts** (only homepage) | ❌ E-E-A-T |

**Implication for the plan:** Phase B (add money-page links into the info pages) is *largely redundant* — those links already exist. The real, unsolved, high-leverage work is the **opposite direction**: pushing equity from the biggest reservoirs (homepage 142 top-3; top city pages Redmond 85, Renton 74) **into the content cluster** (Phase C, city→blog — was paused, now unblocked) so the high-ranking informational pages (e.g. `/how-many-eyes-do-moles-have/` = 46 top-3) and topical authority get lifted further. Money pages are already well-fed.

## Score: 75/100 (up from 58)

| Pillar | Score | Weight | Weighted | Note |
|--------|-------|--------|----------|------|
| Cross-Linking Gaps | 7/10 | 25% | 1.75 | Strategy Gap 2 (city→blog) open; Gap 5 (about→money) partial; blog→author missing. Gaps 1,3,4,6,7,8 closed. |
| Hub-and-Spoke | 7/10 | 25% | 1.75 | Tier 3 cities link up to services + hub but NOT to Tier 1 cornerstone/cluster; homepage→cornerstone missing. Cornerstone itself has 13 spokes (≥8 ✓). |
| Anchor Text | 7.5/10 | 20% | 1.50 | Varied, descriptive, Rule-5 compliant (lawn signal present). Penalty: exact service anchors over-repeated ("One-Time Mole Removal" ~54×, "Total Mole Control Program" ~46×). |
| Orphan Pages | 8.5/10 | 15% | 1.28 | No true orphans (service-areas hub lists all 67 cities; blogs via index + cross-links + FAQ). `/author/spencer` is a functional near-orphan (1 inbound). |
| Link Depth | 9/10 | 10% | 0.90 | All pages ≤3 clicks; cornerstone + cities at depth 2. |
| Link Equity Flow | 7/10 | 5% | 0.35 | Money pages richly fed. Under-used: city-page equity not distributed to content cluster. |
| **Total** | | | **7.53 → 75/100** | At the project's ≥75 acceptance threshold. |

## URL canonical hygiene — near-perfect

Two URL patterns coexist by design: **19 legacy-root posts** (canonical `/{slug}/`, preserve pre-migration indexed URLs — includes the high-power biology set) and **15 blog-route posts** (`/blog/{slug}/`). Cross-referenced every internal link destination against the canonical map:

- **Only 1 mismatch sitewide:** a link to `/blog/are-moles-nocturnal/` where the post is canonical at `/are-moles-nocturnal/` (legacy-root). Single 301-hop / cannibalisation risk. **P2 quick fix.**

This is excellent — earlier audits feared widespread `/blog/*` vs root drift; the data is clean.

### Canonical reference (legacy-root = link at `/{slug}/`, NOT `/blog/`)
`are-moles-nocturnal, are-moles-poisonous-or-venomous, can-moles-swim, do-moles-bite, do-moles-carry-diseases, do-moles-hibernate, do-moles-live-in-groups, how-deep-do-moles-dig, how-many-babies-do-moles-have, how-many-eyes-do-moles-have, how-to-get-rid-of-ground-moles-with-vinegar, how-to-get-rid-of-moles-in-your-yard, is-a-mole-a-rodent, voles-vs-moles-whats-the-difference, what-attracts-moles-to-your-yard, what-do-mole-holes-look-like, what-do-moles-eat, what-eats-moles, why-do-moles-make-molehills`

Everything else = `/blog/{slug}/`.

## The power → content gap (ranked by equity sat upon)

The reservoirs that currently dead-end into services + nearby cities only, and should also distribute into the content cluster:

| Power page | Equity (top-3 kw) | Links to content today | Gap |
|---|---|---|---|
| Homepage | 142 | None (services + 12 cities only) | Add cornerstone + 1–2 cluster links |
| Redmond city | 85 | 3 services + 6 cities + hub | + 3–5 archetype blogs |
| Renton city | 74 | 3 services + 6 cities + hub | + 3–5 archetype blogs |
| Tukwila / Woodinville / Shoreline / Maple Valley / Burien / Issaquah / Enumclaw / Puyallup | high | same template | + 3–5 archetype blogs each |
| All 67 city pages | — | same template | Phase 1C archetype mapping (now unblocked) |

Note: the biology power pages themselves (`/how-many-eyes-do-moles-have/` etc.) are **already** strong outbound to money + cluster — no work needed there.

## Prioritized fix list

| Priority | Fix | Impact | Effort | File(s) |
|----------|-----|--------|--------|---------|
| **P1** | **City → blog (Phase 1C).** Add a `relatedBlogs` field to `CityData` + render a "Mole Facts & Guides" block in the city template, archetype-mapped (Eastside/Valley/Waterfront/Urban/Rural) using `target-keywords.md`. 3–5 blog links/city, varied anchors. NOT a blanket footer block. | High | Med | `src/lib/city-data.ts`, `src/app/(frontend)/[citySlug]/page.tsx` |
| **P1** | **Homepage → cornerstone + cluster.** Add 1–2 contextual content links (e.g. "How to Get Rid of Moles in Your Yard" cornerstone, "Mole vs Vole vs Gopher") into a homepage block. Lifts the cornerstone with the site's strongest page. | High | Low | `src/lib/pages-data.ts` (homepageBlocks) |
| **P1** | **Blog → author (E-E-A-T).** Link "Spencer Hill" / author byline in `BlogPostContent.tsx` to `/author/spencer/`. Fixes the near-orphan + strengthens E-E-A-T entity signal on every post. | Med | Low | `src/components/BlogPostContent.tsx` |
| **P2** | **Canonical fix.** Repoint the single `/blog/are-moles-nocturnal/` link to `/are-moles-nocturnal/`. | Med | Low | (locate in blog-data.ts) |
| **P2** | **Anchor diversity.** Reduce exact-match repetition of "One-Time Mole Removal" / "Total Mole Control Program" — rotate 30% to descriptive/partial ("year-round mole protection", "see the program", "get a one-time visit"). | Med | Med | `blog-data.ts`, `BlogPostContent.tsx` ServiceLinks |
| **P3** | **About → money (Gap 5).** Verify/add contextual links from Spencer's About narrative to How It Works + TMCP + 2–3 key cities. | Low | Low | `src/lib/pages-data.ts` (aboutBlocks) |
| **P3** | **Service pages → cornerstone content.** TMCP/One-Time could each link to 1–2 supporting blog posts (e.g. One-Time → "Mole Removal Cost Washington"; TMCP → "Why Moles Keep Coming Back") for topical depth. | Low | Low | `src/lib/pages-data.ts` |
| **P4** | **Footer city block.** 5 cities + "See All" — minor; below the anti-pattern threshold. Monitor only. | Low | — | `src/components/Footer.tsx` |

## What changed since 2026-05-05 (58 → 75)

Phase 0 (blog schema), Phase 1A (16 FAQ deep-links), and Phase 1B (top-10 blog→location) all shipped and held. The blog layer is now the *strongest* part of the graph. The remaining 25 points of headroom are almost entirely the **city→content** direction + homepage→content + E-E-A-T author linking — none of which is "funnel power pages to money" (that's done), all of which is "distribute reservoir equity into the content cluster to compound topical authority."

## Acceptance criteria status (from brief)

- [x] Phase 1A: FAQ 10–15 deep links → **16 present**
- [x] Phase 1B: top-10 blog posts 2–4 location links → present
- [ ] Phase 1C: 67 city pages get 3–5 blog links → **NOT shipped (P1 above)**
- [x] Phase 2D: blog cluster cross-linking → present
- [x] Phase 2E: Related Articles per post → `RelatedPosts` component present
- [ ] Anchor variety: no anchor >5× → **fails on exact service anchors (P2)**
- [x] Re-audit ≥75/100 → **75/100 reached**
- [ ] GSC 30-day recovery → monitor (separate)

---
*Audit method: codebase read of routes, `city-data.ts`, `blog-data.ts`, `pages-data.ts`, global components (Header/Footer/ServiceCards/BlogPostContent/CTABlock), redirects lib, and route handlers. Canonical mismatch check run programmatically across all content files.*

---

# FULL SWEEP ADDENDUM (2026-05-24)

The first pass mapped *outbound* links and led with the city→blog gap. This addendum
completes the skill's required **per-page inbound link plan** and the minor-page check —
prompted by Roy flagging that the first pass over-focused on city pages. It changes the
priorities.

## The decisive finding: editorial inbound is lumpy and the reservoirs are starved

Contextual inbound = editorial body links only (excludes nav/footer/template, which are
uniform and low-weight). Counted programmatically across all three data files.

| Page | Tier / role | Contextual inbound NOW | Should be | Phase 1C fixes it? |
|---|---|---|---|---|
| `/how-many-eyes-do-moles-have/` | **powerhouse, 46 top-3** | **1** (only `are-moles-blind`) | 6+ | ❌ not in archetype set |
| `/how-to-get-rid-of-moles-in-your-yard/` | **cornerstone** | 4 | 8+ | ✅ (universal — all 92 cities) |
| `/do-moles-bite/` | powerhouse | 4 | 6+ | ❌ |
| `/what-attracts-moles-to-your-yard/` | spoke | 2 | 6+ | ✅ eastside+waterfront cities |
| `/blog/mole-removal-cost-washington/` | commercial | 2 | 6+ | ✅ (universal) |
| `/voles-vs-moles…/`, `/blog/types-of-moles…/` | hubs | 11 each | ok | — |

**8 blog posts have ZERO editorial inbound** (functional orphans — reachable only via the
blog index, nav, and the algorithmic RelatedPosts widget):
`how-to-choose-a-mole-control-company`, `are-moles-good-for-your-yard`, `how-long-do-moles-live`,
`is-a-mole-a-rodent`, `why-do-moles-make-molehills`, `what-eats-moles`, `do-moles-live-in-groups`,
`are-moles-poisonous-or-venomous`. (Phase 1C rescues only `are-moles-good-for-your-yard`, via rural cities.)

**Implication:** city→blog (Phase 1C) is valuable but is NOT the highest-ROI move. The cheapest,
highest-leverage win is **feeding the pages that already rank** — especially the 46-top-3 page
sitting on 1 internal link — and **fixing the 8 editorial orphans** via within-cluster cross-links.

## Minor / utility pages (were under-examined; now checked)

Healthy (contextual inbound): `/contact/` 46, `/blog/` 94, `/service-areas/` 44, `/how-it-works/` 8,
`/faq/` 7, `/reviews/` 7. Weak: `/about/` 2, `/reviews/commercial-case-studies/` 2,
`/author/spencer/` **1** (E-E-A-T near-orphan). **LP leak check: clean** — the noindex `/lp/` pages
link to nothing indexable, so no equity leaks out. ✅

## Per-page link plan (Tier 1/2 + powerhouse)

| Page | Inbound now | Inbound target (add from) | Outbound now | Outbound action |
|---|---|---|---|---|
| Homepage | hub/nav | — | 3 services + 12 cities, **0 content** | **Add cornerstone + how-many-eyes + 1 cluster link** |
| TMCP / One-Time / Commercial | heavy (template+body) | ok | services↔ + 12 cities + FAQ | Add 1–2 supporting blog links each (P3) |
| Cornerstone (how-to-get-rid) | 4 | 8+ (homepage + all cities[1C] + biology siblings) | 13 spokes ✅ | ok |
| how-many-eyes (46 top-3) | **1** | 6+ (homepage + biology cluster siblings + cornerstone) | 12 ✅ | ok |
| do-moles-bite | 4 | 6+ (biology siblings) | 10 ✅ | ok |
| 8 zero-inbound blogs | 0 | 3+ each (within-cluster cross-links) | varies | Phase 2D within-cluster pass |
| /author/spencer | 1 | every blog post | — | byline link in BlogPostContent |
| /about | 2 | 5+ (from cities/services/blogs) | minimal | about→money + how-it-works (P3) |
| commercial-case-studies | 2 | 5+ (commercial service + reviews) | ok | P3 |

## RE-RANKED execution (replaces the earlier P1 ordering)

| New priority | Work | Why it moved | Cost |
|---|---|---|---|
| **P0** | **Feed the reservoirs:** within-cluster biology cross-links → `how-many-eyes` + `do-moles-bite` + cornerstone; homepage → cornerstone + how-many-eyes | The 46-top-3 page on 1 inbound is the cheapest, highest-leverage win; first pass missed it | Low (blog-data body + homepage block) |
| **P0** | **Fix the 8 editorial-orphan blogs** (Phase 2D within-cluster cross-linking) | Zero editorial inbound = wasted topical-authority signal | Low–Med |
| **P1** | **Phase 1C city→blog** (already coded) | Still valuable — feeds cornerstone+cost universally + 8 archetype blogs | Med (done) |
| **P1** | Blog → `/author/spencer/` (E-E-A-T) | near-orphan author entity | Low |
| **P2** | Canonical fix (`/blog/are-moles-nocturnal/`→root); anchor diversity on service links | — | Low–Med |
| **P3** | About→money; service→content depth; case-studies inbound | minor pages | Low |

**Revised score 72/100** (was 75): orphan pillar 8.5→7 (8 functional orphans + 46-top-3 near-orphan),
equity-flow 7→6 (lumpy distribution, reservoirs starved). Cross-link/hub/anchor/depth unchanged.

**Net for execution:** keep Phase 1C, but do the **P0 reservoir-feeding + orphan-fix FIRST** — it's
cheaper and lifts pages that already convert. Roy's "we over-focused on city" was correct.
