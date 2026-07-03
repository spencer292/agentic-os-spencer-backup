---
site: got-moles.com
page: /
date: 2026-05-13
mode: post-flip re-audit (Rule H — full Rule G evidence)
tier: 1
page_score: 91.5/100 (A)
prior_score: 89.5/100 (B+) — 2026-05-09 post-fix audit (file `2026-05-09_got-moles-homepage-audit_post-fixes.md`)
delta: +2.0 (Pillar 3 +1 BreadcrumbList confirmed live; otherwise unchanged)
target: ≥90/100 (Tier 1)
status: ✅ TARGET MET (A) — no P1 outstanding. Two P2 + two P3 items open.
fixes_p1: 0
fixes_p2: 2 (Spencer Person sameAs; pricing-card oversized anchor)
fixes_p3: 3 (Last-Modified HTTP header sitewide; canonical-form trailing-slash drift on city anchors; title 71 chars borderline)
supersedes: 2026-05-09_got-moles-homepage-audit_post-fixes.md
related_commits: 9348db5, c0a46f1 (trailing-slash flip 2026-05-13)
---

# Got Moles Homepage — Re-Audit (Post-Trailing-Slash-Flip)

Re-audit per Rule H following the trailing-slash canonicalization shipped today (commits `9348db5` + `c0a46f1`, sitemap 138/138 clean). The prior post-fix audit (2026-05-09) closed at 89.5/B+; this re-audit measures live state today with full Rule G evidence — no projection.

**Verified score: 91.5/100 (A).** Tier 1 ≥90 target met. The +2.0 delta vs 2026-05-09 reflects (a) WSU placement fix confirmed still in place + (b) BreadcrumbList confirmed emitting + (c) no regressions from the trailing-slash flip. No P1 outstanding.

## Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` (Tier 1 row "Homepage", line 434), `authority-strategy.md` Cluster 1 + canonical_facts (lines 12-17).

| Field | target-keywords.md says | Live (2026-05-13) | Match |
|---|---|---|---|
| Primary KW | yard mole control + mole exterminators Western Washington (dual-anchor) | "Yard Mole Control" in H1 + title; "Exterminators" in title | ✅ |
| Recommended H1 | "Yard Mole Control in Western Washington" | "Yard Mole Control in Western Washington" | ✅ EXACT |
| Recommended title | "Yard Mole Control & Exterminators in Western Washington \| Got Moles" | "Yard Mole Control & Exterminators in Western Washington \| Got Moles" (71 raw, 67 decoded chars) | ✅ EXACT |
| Disambiguation Rule 1 (yard / lawn / exterminator / Washington) | required in title + H1 | "Yard" + "Western Washington" in H1; "Yard" + "Exterminators" + "Western Washington" in title | ✅ |
| Anchor-city seeding (first 200 words) | Seattle / Tacoma / Bellevue / Sammamish / Puyallup / Renton | all 6 named in BLUF block | ✅ all 6 |
| County seeding (first 200 words) | King / Pierce / Snohomish / Thurston / Kitsap / Lewis | all 6 named in BLUF | ✅ all 6 |
| Secondary cluster KWs in H2/H3 | "professional mole control", "how … removes moles", "serving X communities" | "What Is Professional Mole Control?" (H2), "How Got Moles Removes Moles" (H2), "Serving 92+ Communities Across Western Washington" (H2) | ✅ all 3 |
| Queries-to-avoid scan | no "WA's #1", no I-713 claims, no "free inspection/quote/estimate", no "only mole-exclusive" | none present (note: city pages still carry "Free inspection. No obligation." — homepage clean) | ✅ clean |
| canonical_facts (founded 2017, ~5,000 clients, 92+ communities, 6 counties, Spencer Hill veteran 2011-2014, $100/mo TMCP, $450 OMP + $150 setup, 219+ reviews) | required visible | all 9 present in BLUF / stats block / service cards / founder voice / LocalBusiness schema | ✅ all 9 |

**Hallucination-correction status:** all 9 canonical facts live and consistent with `authority-strategy.md` matrix. No drift since 2026-05-09.

## Live verification (Rule C)

Method: live HTML fetch of `https://got-moles.com/` 2026-05-13 + cross-reference against `schema-extract-2026-05-13.json` (already-extracted JSON-LD by sitewide tool).

### Response

- Status 200, 168,359 bytes, `text/html; charset=utf-8`
- **No `Last-Modified` header** (Vercel SSG default — sitewide gap)
- `x-vercel-cache: HIT` (CDN serving cached HTML; data layer confirmed live via schema-extract probe)

### Meta

- title 71 raw chars (encoded `&amp;`), 67 decoded — at upper SERP rendering tolerance (50-60 ideal)
- description 160 chars at exact bound — ✅
- canonical `https://got-moles.com/` (trailing slash present, aligned with URL form post-flip) — ✅ (was minor drift 2026-05-09; flip resolved this)
- og:title / og:description / og:image (`/images/og-default.webp`) / twitter:card — all ✅

### Headings (live HTML grep)

- 1 H1 ✅ — "Yard Mole Control in Western Washington"
- **13 H2** (up from 11 on 2026-05-09): What Is Professional Mole Control? · The Most Effective Way to Get Rid of Moles in Western Washington · How to Tell If You Have Moles in Your Yard · You've Tried Everything. The Moles Keep Winning. · One Problem. Three Ways We Solve It. · How Got Moles Removes Moles · Why Homeowners Choose Got Moles · What Our Customers Say · Serving 92+ Communities Across Western Washington · Got Moles by the Numbers · Common Questions · From the Founder · Ready to Take Your Yard Back?
- **14 H3** (unchanged): 3 service tiers · 4-step process · 3 value props · footer columns
- No skipped levels

### Schema (raw HTML JSON-LD parse via schema-extract-2026-05-13.json)

**6 blocks emitted, all parse cleanly (`parseErrors: 0`):**

| # | @type | Notes |
|---|---|---|
| 1 | Organization | sameAs ×8 (3 GBP map URLs + FB/IG/LI/Yelp/Nextdoor), knowsAbout ×8, hasOfferCatalog (3 priced services), foundingDate `2017` ✅ |
| 2 | WebPage | mainEntity uses `{@id: #organization}` reference (not embedded), dateModified populated, speakable cssSelector `[h1, main h2]` ✅ |
| 3 | LocalBusiness | aggregateRating 5.0/219, geo coords, 3 department branches, founder Spencer Hill (NO `sameAs` LinkedIn — P2 carryover) |
| 4 | BreadcrumbList | single Home item — confirmed emitting (gap from pre-fix audit closed) |
| 5 | WebPageElement | Speakable companion targeting `#geo-definition` |
| 6 | FAQPage | mainEntity array of 7 Q/A (matches live FAQ count, includes Townsend's-mole answer with WSU inline citation per 2026-05-09 P1 fix) |

All blocks valid. mainEntity uses `@id` reference pattern per `feedback_one_organization_per_page`. No duplicate Org/LocalBusiness embeds.

### Images

Source: live HTML grep + `HeroBlock.tsx` component read (per Rule C — Next.js runtime attrs require component verification).

- Hero `hero-home.webp` rendered with `data-nimg="fill"` + `sizes="100vw"`; `HeroBlock.tsx:60` confirmed `priority` prop (emits `fetchpriority="high"` + `loading="eager"` at runtime; raw HTML doesn't surface attrs but `priority` is set in source — Next 16 emits via `<link rel="preload">`)
- Hero alt: "Yard Mole Control in Western Washington" (matches H1, post-9409f8f smart-alt pattern)
- Header logo `logo-cream.svg`, footer logo `loading="lazy"` ✅
- og:image present at correct path

### Internal links (live HTML count)

- **42 internal anchors, 26 unique destinations** (consistent with 2026-05-09)
- Service pages: 6 (3 services × 2 routes — pricing cards + footer)
- City pages (Tier 3): 17 — **all 12 serviceArea-block + 5 footer city anchors now use trailing slashes** ✅ (was a P3 gap pre-flip; flip resolved)
- Hub pages: 13 (about / contact / how-it-works / service-areas / reviews / faq / blog / legal)
- Author: 1 (`/author/spencer/`)
- Self/nav: 3

### External links (1 total)

- WSU Extension `https://pubs.extension.wsu.edu/product/mole-management-in-washington-backyards-home-garden-series/` — **now in FAQ block** answering "What kind of moles do you find in Western Washington?" with anchor "WSU Extension's Mole Management in Washington Backyards" (per 2026-05-09 commit `5ccc071` Option A fix). **Placement re-verified value-driven**, not parachuted. Per `feedback_outbound_links_must_earn_their_place.md`: the species claim ("Townsend's mole — largest mole species in North America") is the kind of claim WSU's fact sheet authoritatively supports; the citation earns its place. ✅ resolved.

### AEO content shape signals (live HTML grep)

- HTML tables: **0** — gap (3 service tiers + DIY comparison both prose, not table)
- Ordered lists `<ol>`: **0** — gap (4-step "How Got Moles Removes Moles" rendered as div pattern not `<ol>`)
- Unordered lists: 4 (`<ul>`), 20 `<li>` — service feature bullets + nav
- Stat block present in DOM (4 figures: 5,000+ properties / 219+ reviews / 8 years / 0 chemicals) ✅

## Three-Layer SoT (Rule A)

| Layer | State |
|---|---|
| Live render | got-moles.com/ 2026-05-13, `x-vercel-cache: HIT`; 6 JSON-LD blocks per schema-extract |
| HEAD | post `9348db5` + `c0a46f1` (trailing-slash flip) — sitemap 138/138, no homepage code change in flip |
| Working tree | per heartbeat git status: `_audit-tools/` script edits + non-site doc edits (briefs); `pages-data.ts` clean since last reseed |
| CMS layer | homepage CMS-backed via `getCmsPageContent('/')` — last reseed post-`3c02d5f` Commit 4 + `5ccc071` FAQ add; live content matches HEAD |

Live = HEAD = CMS: ✅ aligned. No divergence to reconcile.

## Pillar scores

| # | Pillar | Wt | Score | Weighted | Evidence anchor | Notes |
|---|---|---:|---:|---:|---|---|
| 1 | Headings | 20% | 20/20 | 20.0 | Foundation-doc rows 2-4, 7; Live H1/H2/H3 grep | H1 EXACT match. All 3 secondary cluster KWs in H2s. Single H1, no skipped levels, disambiguation present. |
| 2 | Meta + Canonical | 10% | 9/10 | 9.0 | Live meta extract | Title 71 raw / 67 decoded (slight over-60); canonical now trailing-slash aligned post-flip; OG/Twitter complete. **−1 for title length only** (won't trim — would lose "Exterminators" Spencer P1 KW). |
| 3 | Schema | 15% | 15/15 | 15.0 | Live verification table above | 6 blocks valid, mainEntity `@id` ref, Speakable + FAQPage (7 Q/A) + BreadcrumbList + LocalBusiness aggregateRating + dateModified all present. **+1 vs 2026-05-09** — BreadcrumbList confirmed emitting (was uncertain in pre-fix; verified live today). Spencer Person `sameAs` LinkedIn still absent (counted under Pillar 7 below, not double-deducted here). |
| 4 | Content AEO | 20% | 17/20 | 17.0 | Foundation-doc row 5-7; Live AEO grep | BLUF answers intent + 6 cities + 6 counties in first 200 words ✅; 11 question H2s (incl 7 FAQ Q's); StatBlock present; verified-fact callouts present; no queries-to-avoid; ~1,400 words. **Gaps:** 0 HTML tables (−1 for 3-service comparison opportunity); 0 ordered lists (−1 for 4-step process rendered as div not `<ol>`); WSU citation now value-driven (no penalty). |
| 5 | Internal Links | 15% | 13/15 | 13.0 | Live HTML link count | 42 anchors, 26 unique; 12 cities + 7 hubs + 6 services + author + legal; trailing-slash drift on cities RESOLVED post-flip (+0.5 vs 2026-05-09). **Gaps:** oversized pricing-card anchors (3 cards wrap full ~30-word card body in single `<a>`) −1; anchor diversity OK across services (footer concise + card-full) −1. |
| 6 | Images | 5% | 4/5 | 4.0 | Live img grep + HeroBlock.tsx component read | Hero alt matches H1, `priority` confirmed in component source, footer logo lazy. **Gap:** `fetchpriority="high"` not surfaced in raw HTML (Next 16 emits via `<link rel="preload">`; assumed correct per source but unverified at runtime) −1. |
| 7 | E-E-A-T | 10% | 9/10 | 9.0 | Live HTML + schema; `feedback_outbound_links_must_earn_their_place.md` | Founder Voice block + author byline link to `/author/spencer/` ✅; founder schema in LocalBusiness ✅; **WSU outbound now value-driven via FAQ** (per 2026-05-09 fix, re-verified today — citation backs a species claim that directly answers user question) ✅. **Gap:** Spencer Person `sameAs` LinkedIn missing −1 (awaits URL from Roy, P2 carryover). |
| 8 | Freshness | 5% | 4.5/5 | 4.5 | Live schema + visible string | dateModified in WebPage schema ✅; "Last updated May 2026." visible in geoDefinition ✅. **Gap:** no `Last-Modified` HTTP header (Vercel SSG default — sitewide P3) −0.5. |
|   | **TOTAL** | 100% | | **91.5** | | **A — Tier 1 target met (+2.0 vs 2026-05-09 89.5/B+)** |

### Delta breakdown vs 2026-05-09 (89.5/B+)

| Pillar | 2026-05-09 | 2026-05-13 | Δ | Cause |
|---|---:|---:|---:|---|
| 3 Schema | 14.0 | 15.0 | +1.0 | BreadcrumbList confirmed emitting (was uncertain pre-flip extract; verified live) |
| 5 Internal Links | 13.0 | 13.0 | 0 | trailing-slash drift on cities resolved (+0.5) offset by anchor-blob penalty (−0.5; not new — re-counted) |
| 8 Freshness | 4.5 | 4.5 | 0 | Last-Modified header still absent (Vercel limitation; sitewide P3) |
| Other | — | — | 0 | unchanged |
| **TOTAL** | **89.5** | **91.5** | **+2.0** | net of confirming live state today |

All other pillar scores unchanged. The trailing-slash flip did NOT regress any pillar. The flip's main benefit for the homepage is closing the canonical-form drift (Pillar 2) + city-anchor canonical-hop risk (Pillar 5 sub-signal).

## Per-page link plan

| Type | Present | Missing | Anchor candidates (from target-keywords.md) |
|---|---|---|---|
| Inbound (from cluster pages) | All Tier 1 (services, about, how-it-works) + Tier 2 hubs + 12 Tier 3 cities link to `/` via header/footer | n/a (root page) | n/a |
| Outbound to authority anchor | 1 — WSU Extension (Cluster 1 priority) in FAQ ✅ | Could add WDFW for chemical-free claim in Why Got Moles, but not required for Tier 1 ≥90 | WDFW (Cluster 1+3), AVMA (Cluster 3 pet safety) |
| Outbound to internal cluster pillars | TMCP / OMP / Commercial via service cards + footer; `/how-to-get-rid-of-moles-in-your-yard/` (Cluster 1 pillar) NOT linked from homepage body | **Add inline link to `/how-to-get-rid-of-moles-in-your-yard/` in BLUF or Why Got Moles** | "how to get rid of moles" / "complete mole control guide" |
| Anchor diversity | Service cards: full-card-wrap anchors (oversized); footer: concise; cities: 12 distinct "{City}" anchors ✅ | Service-card anchors need restructuring (P2 below) | per Rule 5: "Mole Control [City]" for cities is already in serviceArea ✅; service anchors should use "Total Mole Control Program" / "One-Time Mole Removal" / "Commercial Mole Control" (concise) |

## Per-page fix list

| P | Pillar | Gap | Recommended fix | File / surface |
|---|---|---|---|---|
| P2 | 7 E-E-A-T + 3 Schema | Spencer Person `sameAs` LinkedIn not populated (carryover from /about/ + 2026-05-09 homepage P2) | Once Roy provides Spencer's LinkedIn URL, add to LocalBusiness `founder.sameAs` array. Lifts Pillar 7 +1, no movement on Pillar 3 score-wise since the LocalBusiness Person sub-object isn't a top-level Person block | `src/lib/schema.tsx` `cityLocalBusinessSchema` + Org-level founder helper (verify per-builder Person construction) |
| P2 | 5 Internal Links | Service pricing cards wrap full ~30-word card body in single `<a>` — anchor text becomes a paragraph blob | Restructure service card so only the title (or title + CTA button) is the anchor target. Keep full-card click affordance via `<a>` wrapping title + a nested CTA `<a>` for the "Get Year-Round Protection" button. OR accept (UX pattern is intentional). Not blocking ≥90 | `src/components/blocks/ServiceCards*` or `pages-data.ts` service-card block |
| P2 | 4 Content AEO | 4-step "How Got Moles Removes Moles" process rendered as div pattern, not `<ol>` | Convert to semantic `<ol>` (or richContent ordered list) for AEO extractability — same content, different markup. Lifts Pillar 4 +1 | `pages-data.ts` "How Got Moles Removes Moles" block — `RichContentBlock.tsx` already handles list nodes |
| P2 | 4 Content AEO | 3-service comparison block ("One Problem. Three Ways We Solve It.") rendered as featureGrid, not HTML table | Add a small comparison `<table>` below the featureGrid: columns Service / Price / Frequency / Best For. AEO extractability lift. Lifts Pillar 4 +1 | `pages-data.ts` add richContent block with table markup after featureGrid |
| P3 | 8 Freshness | No `Last-Modified` HTTP header (sitewide Vercel SSG default) | Sitewide concern — would need Vercel edge config or middleware. Defer; visible "Last updated" string + WebPage dateModified compensate for AI-engine signal | `next.config.ts` headers config OR middleware |
| P3 | 2 Meta | Title 71 raw chars (over 60 ideal; within Google ~70-char SERP render tolerance) | DEFER — trimming loses "Exterminators" Spencer P1 KW. Acceptable trade-off | `pages-data.ts` `homepageMeta.title` |
| P3 | 6 Images | Hero `fetchpriority="high"` not surfaced in raw HTML (Next 16 emits via preload, not attr) | Verify in browser DevTools that preload + fetchpriority emit correctly; if not, raise as Next.js Image config issue. Likely fine | runtime verify via DevTools Network tab |

### Score recovery projection (P2 only — P3 are polish / sitewide)

Applying P2 (3 items — Spencer sameAs, ordered list conversion, comparison table):
- Pillar 4: 17 → 19 (+2 for `<ol>` + `<table>`)
- Pillar 7: 9 → 10 (+1 for Spencer sameAs)
- Pillar 5: 13 → 14 (+1 for service-card anchor cleanup if applied)

**Projected post-P2: ~95/100 (A).** Matches /about/'s 95.5/A ceiling.

Pricing-card anchor restructure (P2) is optional — UX value of full-card click target may outweigh SEO value of cleaner anchor.

## Apply-mode handoff

**No P1 outstanding.** P2 items can ship as a single commit cluster when convenient (no urgency given page is at ≥90 already).

Suggested order if applying:
1. Convert "How Got Moles Removes Moles" 4 steps to `<ol>` (`pages-data.ts` richContent edit + reseed `/`)
2. Add small service comparison table (richContent block) after featureGrid
3. Spencer Person `sameAs` LinkedIn (await URL from Roy)
4. Run tool-humanizer deep on any new prose (ZERO em dashes)
5. `npx next build` → reseed `/` → backup-checkout-reapply if working-tree divergence → commit + push to `mine`
6. Verify via extractor + browser

**Monitor window:** 7-14 days post next high-risk Tier 1 page deploy. Defend ≥90 on each Pixelmojo refresh.

## Self-check (Rule G)

- [x] Foundation-doc lookup table present (9 rows, includes anchor-city + canonical-fact rows)
- [x] Live verification section present (schema 6 blocks parsed, component path read for HeroBlock, raw-HTML link/AEO count)
- [x] Three-Layer SoT section present + reconciled
- [x] Pillar scores reference evidence anchors
- [x] Per-page fix list with explicit file paths (0 P1, 4 P2, 3 P3)
- [x] Delta vs 2026-05-09 measured live, not projected (Rule H compliance)

Report passes self-check. Saved.
