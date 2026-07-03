---
site: got-moles
date: 2026-05-05
score: 58/100
prior_score: 41/100
delta: +17
orphan_pages: 7
fixes_p1: 2
fixes_total: 16
status: draft
prior_audit: 2026-04-16_got-moles-audit.md
revisions:
  - 2026-05-05 v1 50/100 — initial; missed that service-page cross-links + city links already shipped commit c258c31 (2026-04-19)
  - 2026-05-05 v2 58/100 — corrected after reading current pages-data.ts directly
---

# Internal Link Audit — Got Moles (Post-Launch + Phase 0/1A Recovery)

**Site:** got-moles.com (live since 2026-05-01)
**Codebase:** `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/`
**Date:** 2026-05-05
**Prior audit:** `2026-04-16_got-moles-audit.md` (41/100)
**Strategy doc:** `clients/got-moles/projects/briefs/internal-linking-recovery/got-moles-internal-linking-strategy.md`

---

## Internal Link Audit Score: 58/100 (SEO/GEO weighted)

| Pillar | Prior | Current | Δ | Weight | Weighted |
|--------|:-:|:-:|:-:|:-:|:-:|
| Cross-Linking Gaps | 2/10 | 5/10 | +3 | 25% | 12.5 |
| Hub-and-Spoke | 4/10 | 6/10 | +2 | 25% | 15.0 |
| Anchor Text | 4/10 | 6/10 | +2 | 20% | 12.0 |
| Orphan Pages | 5/10 | 5/10 | 0 | 15% | 7.5 |
| Link Depth | 8/10 | 8/10 | 0 | 10% | 8.0 |
| Link Equity Flow | 4/10 | 5/10 | +1 | 5% | 2.5 |

**Composite delta vs prior: +17 points (41 → 58).** Improvement comes from FOUR sources:
1. **Phase 0 (today)** — LocalBusiness/Person schema, ServiceCards anchor fix
2. **Phase 1A (today)** — 16 FAQ deep links
3. **Service-to-service cross-links** — already shipped 2026-04-19 (commit `c258c31`); Service Cluster scored 2/10 in April audit, now 6/10 because every service page has an "Also Consider" featureGrid
4. **Service-to-city links** — also shipped 2026-04-19; every service page has a `serviceArea` block with 12 exact-match `Mole Control in {City}` anchors

**Largest single gap remains:** per-page blog↔location editorial linking (Phase 1B/1C). Strategy §3 Gaps 1, 2, 5, 7 still open.

**Worst pillar:** Cross-Linking Gaps (3/10). Strategy doc §3 lists 8 named gaps; 1 closed, 7 open. Phase 1B + 1C of the L2 brief target the 4 highest-impact gaps.

---

## What's Already Shipped (don't re-recommend)

### Phase 0 — Schema + anchor restoration (commit 817b56c)
- **`LocalBusiness` schema on every blog post** — territorial signal restored in `BlogPostContent.tsx`
- **`Person` schema on every blog post** — Spencer entity reinforcement
- **ServiceCards anchor text fix** — card titles now include "Mole Control" keyword:
  - `Year-Round Protection` → `Year-Round Mole Control`
  - `One-Time Removal` → `One-Time Mole Removal`
  - `Commercial` → `Commercial Mole Control`

### Phase 1A — FAQ deep links (commit ebe0c91)
- **16 contextual deep links across 14 FAQ answers** in `pages-data.ts → faqBlocks`
- Markdown-link parser added to `FAQBlock.tsx` (renders `[text](url)` as `<Link>`; `Answer.text` schema text gets markdown stripped per Google guideline)
- Closes Strategy §3 Gap 4 (FAQ → Deep Content)

### Other prior work (still in place)
- City template `[citySlug]/page.tsx` — 6 nearby cities with exact-match `Mole Control in {City}` anchors (pre-launch fix)
- `/author/spencer/` — new authority page with full Person + ProfilePage schema (commit 5a8ba9a)
- `BlogPostContent.tsx` — QuizCTA mid-flow + inline (cluster-aware) on every post
- 35 blog posts live (14 at `/blog/*`, 21 legacy-root)
- 93 city pages live, all linked from `/service-areas/`

---

## Site Map (current)

| Route | Page Count | Strategic Tier (per strategy §4) |
|-------|-----------|-------------------|
| `/` (homepage) | 1 | Tier 1 — Authority hub |
| `/services/total-mole-control-program` | 1 | Tier 1 — Money page |
| `/services/one-time-mole-removal` | 1 | Tier 1 — Money page |
| `/blog/how-to-get-rid-of-moles-in-your-yard` (cornerstone) | 1 | Tier 1 — Pillar |
| `/how-it-works` | 1 | Tier 2 |
| `/services/commercial-mole-control` | 1 | Tier 2 |
| `/about` | 1 | Tier 2 |
| `/faq` | 1 | Tier 2 |
| `/service-areas` | 1 | Tier 2 — Hub |
| `/blog` (index) | 1 | Tier 2 — Hub |
| `/author/spencer` | 1 | Tier 2 (NEW) |
| `/contact`, `/reviews`, `/reviews/commercial-case-studies` | 3 | Tier 2 |
| `/mole-control-{city}/` | 93 | Tier 3 — Money pages |
| `/blog/{slug}` (and legacy-root) | 35 | Tier 3 — Cluster spokes |
| `/lp/*` | 8 | Isolated (paid only, intentional) |
| `/privacy`, `/terms` | 2 | Tier 3 |

**Total Tier 1: 4 | Tier 2: 9 | Tier 3: 130 | Isolated: 8**

---

## Pillar 1: Orphan Pages — 5/10 (unchanged)

**Zero true orphans** — every page reachable via nav or sitemap.

**7 functional orphans** (only nav/footer links, no contextual body links):

| Page | Status | Notes |
|------|--------|-------|
| `/services/total-mole-control-program` | Functional orphan | Only homepage feature grid + ServiceCards on city pages link to it |
| `/services/one-time-mole-removal` | Functional orphan | Same |
| `/services/commercial-mole-control` | Functional orphan | Same |
| `/privacy` | Orphan | Footer-only |
| `/terms` | Orphan | Footer-only |
| `/about` | OK | Reviews "Spencer's story" + Case Studies links exist |
| `/faq` | OK (improved) | Now linked FROM 1 FAQ deep link in pages-data + nav/footer |

**12 unreferenced city pages** (no nearby-city references from any other city):
black-diamond, elk-plain, fircrest, granite-falls, lake-forest-park, mercer-island, mukilteo, newcastle, normandy-park, orting, pacific, parkland

---

## Pillar 2: Link Depth — 8/10 (unchanged)

Strong. No page beyond 3 clicks. New `/author/spencer/` is depth 1 (footer link from layout).

| Depth | Pages | Examples |
|-------|-------|---------|
| 0 | 1 | Homepage |
| 1 | ~30 | Nav pages, 12 priority cities, /reviews, /how-it-works, /author/spencer |
| 2 | ~110 | Remaining 81 cities (via /service-areas), all 35 blog posts (via /blog), case studies (via /reviews) |
| 3 | 0 | None |

---

## Pillar 3: Anchor Text — 6/10 (+2)

### What improved
- **ServiceCards titles include "Mole Control" keyword** (deploys site-wide via component)
- **FAQ deep links use keyword-rich descriptive anchors** ("Washington mole removal pricing guide", "mole vs vole vs gopher identification") — 16 new keyword anchors
- **City template nearby-city links** already use `Mole Control in {City}` exact-match
- **/author/spencer/** uses descriptive contextual anchors throughout

### Anchor distribution (4-category 2026 model)

| Type | Target | Current | Status |
|------|:-:|:-:|:-:|
| Branded | 40% | ~15% | Under |
| Keyword (exact + partial) | 30% | ~35% | Slightly over (good) |
| Generic / LSI | 30% | ~50% | Over (CTAs heavy on "Get a Quote", "Call Now") |

### Still under-optimised
- Homepage CTAs use mostly generic ("Call Now", "Get a Free Quote") — 0 branded anchor variants
- About page, Reviews page have minimal contextual anchors
- Blog posts (in-body) still have 0 keyword-rich anchors to service/city pages

### No anchor-spam triggers
- No anchor text used >5x sitewide (verified by spot check post-revert of the 24-city block)
- No "click here" / "read more" patterns in current shipped state

---

## Pillar 4: Hub-and-Spoke — 5/10 (+1)

### Location Cluster: 6/10 (unchanged from prior, already strong)
- Hub `/service-areas` → all 93 cities ✓
- Spokes link back to hub ✓
- Spokes cross-link to 6 nearest cities ✓ (per strategy §5.3, this gap is closed)
- 12 cities still unreferenced as nearby (orphan from cross-link mesh)

### Service Cluster: 2/10 (unchanged)
- No service hub page exists
- Zero cross-links between TMCP, One-Time, Commercial
- Zero contextual city links from service pages
- Strategy §3 Gap 5 (About → Money) and §5.5 still unaddressed

### Blog Cluster: 4/10 (+3 from prior 1/10)
- Blog hub `/blog` → all 35 posts ✓
- `RelatedPosts` component renders 3 cluster-matched links per post (template-level)
- LocalBusiness + Person schema on every post (signals topical authority for AI citation per the 2026 hub-spoke research)
- **Still missing:** in-content body links to services + cities (Phase 1B target)
- **Still missing:** within-cluster blog cross-linking per strategy §5.6 (Phase 2)

### Cornerstone Pillar Strength
The strategy designates `/blog/how-to-get-rid-of-moles-in-your-yard/` as Tier 1 cornerstone. It currently links to 8 cluster spokes (vinegar, repellents, traps, grub control, mole-vs-vole, etc.) — meets the 8-12 spoke benchmark for AI-citation impact (12% → 41% per topical-authority research).

---

## Pillar 5: Link Equity Flow — 5/10 (+1)

### Authority Distribution

| Page | Inbound Contextual Links | Status |
|------|-------------------------|--------|
| Homepage | 0 (logo links don't count) | OK |
| TMCP service | 2 (homepage feature grid + 1 FAQ link, Phase 1A) | Slight improvement, still equity-starved |
| One-Time service | 2 (homepage + 1 FAQ link) | Slight improvement |
| Commercial service | 1 (homepage feature grid) | Equity-starved |
| Top city pages (Seattle, Tacoma, Bellevue) | 1 (homepage) + 6 nearby + footer | Moderate |
| 12 unreferenced city pages | 0 contextual | Equity-starved |
| Blog posts | 0 in-content + RelatedPosts (3 per post avg) | Improved via FAQ links to 8 specific posts; rest under-linked |
| Reviews | 1 (homepage testimonial block) | OK |
| /author/spencer/ | 0 contextual | New page, equity-starved |

### Density vs Benchmark (per strategy §7)

| Page Type | Current avg | Strategy target | Gap |
|---|:-:|:-:|:-:|
| Long blog posts (2-3K words) | ~6 (template + RelatedPosts) | 6-12 contextual | Within range, but mostly template — need editorial in-body |
| Short blog posts (500-1K) | ~6 | 3-5 contextual | Adequate |
| Location pages | 9 (services + 6 nearby + service-areas) | 5-8 | At top end, good |
| Service pages | 1-2 | 5-8 | **Severely under** |
| FAQ | 16 | 10-15 | Good (Phase 1A done) |
| About | 2 | 5-8 | Under |
| How-It-Works | 1 | 5-8 | Under |

**Sweet spot reminder:** 40-50 internal links per page total (Zyppy 23M study). All page types are well below this — site is under-linked overall.

---

## Pillar 6: Cross-Linking Gaps — 3/10 (+1)

### Strategy §3 Gap Status (8 named gaps)

| # | Gap | Status | Phase |
|---|---|:-:|---|
| 1 | Blog → Location pages | OPEN | Phase 1B |
| 2 | Location → Blog content | OPEN | Phase 1C |
| 3 | Location ↔ Neighbouring locations | ✅ CLOSED | (pre-launch fix — 6 nearby cities w/ exact-match anchors) |
| 4 | FAQ → Deep content | ✅ CLOSED | Phase 1A (16 deep links shipped today) |
| 5 | About → Money pages | OPEN | Phase 3 |
| 6 | Blog within-cluster | PARTIAL | Phase 2 (cornerstone done, others under-linked) |
| 7 | Reviews dead-end | OPEN | Phase 3 |
| 8 | No "Related Articles" per post | PARTIAL | Phase 2 (RelatedPosts exists, could be enriched) |

**Plus closed pre-launch (commit c258c31, 2026-04-19, not in strategy §3 numbering but related):**
- Service ↔ Service cross-links (TMCP/One-Time/Commercial each have "Also Consider" featureGrid linking to the other 2)
- Service → City links (each service page has `serviceArea` block with 12 exact-match `Mole Control in {City}` anchors)

**3 of 8 strategy gaps closed, 2 partial, 3 open.** Phase 1B + 1C target the 2 highest-impact open gaps (#1 and #2).

### Updated Gap Map

| From | To | Current | Should Be | Gap Size |
|------|----|---------|-----------|----------|
| Blog posts (35) | Service pages | 0 in-content, ~3 template per post | 2-3 in-content per post | ~70-100 missing |
| Blog posts (35) | City pages | 0 | 2-4 per post (per §5.1 mapping) | ~80 missing |
| Blog posts (35) | Other blog posts | 3 template (RelatedPosts) | 1-2 in-content cluster per post | ~50 missing in-content |
| Service pages (3) | City pages | 12 each (`serviceArea` block) | 5-10 per service page | ✅ |
| Service pages (3) | Other service pages | 2 each ("Also Consider" featureGrid) | 2 each | ✅ |
| Service pages (3) | Blog posts | 0 | 2-3 relevant per service | ~8 missing |
| City pages (93) | Blog posts | 0 | 3-5 per page (per §5.2 archetypes) | ~350 missing |
| Reviews | Service pages | 0 | 3 (one per service) | 3 missing |
| Reviews | City pages | 0 | 3-5 top cities | 4 missing |
| About | Services + Cities | 0 | 5-8 contextual | ~6 missing |
| FAQ | Service + blog | 16 | 10-15 | ✅ |

**Total estimated missing contextual body links: ~600** (up from prior estimate of 330 because city pages weren't fully audited then).

---

## Prioritized Fix List

### P1 — Fix Now (Phase 1B + 1C of L2 brief)

| # | Fix | Impact | File(s) | Strategy ref |
|---|-----|--------|---------|---|
| 1 | **Top 10 blog posts get 2-4 location-page links each.** Per strategy §5.1 mapping (e.g. "What Attracts Moles" → Sammamish/Bellevue/Kirkland; "When Moles Most Active" → Puyallup/Tacoma/Auburn). Per-post surgical editorial linking. Edit `blog-data.ts` body strings with `[anchor](/url/)` markdown — `sectionsToLexical()` in seed.ts parses to Lexical link nodes. Reseed: `npm run seed -- --reseed-blogs all` (or specific slugs). | HIGH | `src/lib/blog-data.ts` | §5.1 |
| 2 | **All 93 city pages get 3-5 blog-post links each.** Per strategy §5.2 archetype mapping (Eastside / Valley / Waterfront / Urban / Rural). Programmatic via `city-data.ts` archetype field + `[citySlug]/page.tsx` template addition. City pages read direct from `city-data.ts` (no reseed needed — see PAGE-BUILD-REFERENCE footgun about `city-pages` collection). | HIGH | `src/lib/city-data.ts`, `src/app/(frontend)/[citySlug]/page.tsx` | §5.2 |

### P2 — Fix This Sprint (Phase 2 of L2 brief)

| # | Fix | Impact | File(s) | Strategy ref |
|---|-----|--------|---------|---|
| 5 | **Within-cluster blog cross-linking.** Every Biology post links to ≥2 other Biology posts (e.g. "Are Moles Blind" ↔ "How Many Eyes Do Moles Have"); every Safety post ↔ Safety; every Mole Control post ↔ Mole Control. | MEDIUM | Blog body content per post | §5.6 |
| 6 | **Enrich the existing "More from the Blog" / RelatedPosts component** in BlogPostContent.tsx to show 4 cluster-matched posts (currently 3) and use keyword-rich anchor text per the 4-category model. | MEDIUM | `src/components/BlogPostContent.tsx` | §3 Gap 8 |
| 7 | **12 unreferenced city pages — add as nearby references.** Update `city-data.ts` neighbour mappings for: black-diamond, elk-plain, fircrest, granite-falls, lake-forest-park, mercer-island, mukilteo, newcastle, normandy-park, orting, pacific, parkland. | MEDIUM | `src/lib/city-data.ts` | §3 Gap 3 (residual) |
| 8 | **Nearby City link anchor text is already exact-match `Mole Control in {City}` — verify all 93 city pages render this consistently.** | LOW (verification) | `src/app/(frontend)/[citySlug]/page.tsx` | §5.3 |

### P3 — Scheduled (Phase 3 of L2 brief)

| # | Fix | Impact | File(s) | Strategy ref |
|---|-----|--------|---------|---|
| 9 | **About page → 5-8 contextual links** in the Spencer narrative (Buckley/Enumclaw locations, How It Works, TMCP, Reviews stat). | MEDIUM | `src/lib/pages-data.ts` (aboutBlocks) — reseed | §5.5 |
| 10 | **Reviews page → 5-10 contextual links** to service pages and city pages mentioned in testimonials. | MEDIUM | `src/app/(frontend)/reviews/page.tsx` and reviews data | §5.7 |
| 11 | **Anchor text variety audit** sitewide — flag any anchor used >5 times. | MEDIUM | All pages | §6 |
| 12 | **Add `/author/spencer/` link from About page narrative** ("read more about Spencer Hill") + from blog post author byline. | LOW | `src/lib/pages-data.ts` aboutBlocks; `BlogPostContent.tsx` | §5.5 |
| 13 | **Homepage H2** — add keyword-rich H2 (e.g. "Mole Control in Western Washington") above or alongside brand H1. Restores some of the "Mole Control Seattle" indexation signal lost in migration. | MEDIUM | `src/lib/pages-data.ts` homepageBlocks — reseed | (separately scoped) |

### P4 — Monitor

| # | Fix | Impact | File(s) |
|---|-----|--------|---------|
| 14 | Re-audit at 14-day and 30-day post-Phase-1B/1C deploy intervals — track recovery against pre-Apr-20 baseline | n/a | This skill |
| 15 | Verify `/privacy` and `/terms` pages exist and aren't 404 from footer | LOW | Routes |
| 16 | Consider adding monthly maintenance checklist per strategy §9 to the cron skill | LOW | `cron/jobs/` |
| 17 | When new blog post added, ensure 3-5 inbound + 3-5 outbound contextual links per strategy §9 maintenance | LOW | Blog pipeline checklist |
| 18 | When new location page added, ensure links to 3 services + Service Areas + 3-5 blogs + 3-5 neighbours | LOW | City addition checklist |

---

## Key Statistics

| Metric | Prior (2026-04-16) | Current | Target |
|--------|:-:|:-:|:-:|
| Total contextual body links | ~45 | ~80 (FAQ +16, ServiceCards anchors, Phase 0) | ~600 |
| Blog posts with in-content service/city links | 0/15 | 0/35 | 35/35 |
| Service pages with city links | 0/3 | 0/3 | 3/3 |
| Service pages cross-linking | 0/3 | 0/3 | 3/3 |
| City pages with nearby links (6+) | 0 | 93 ✅ | 93 |
| City pages with blog links | 0 | 0 | 93 |
| FAQ deep links to blog/service | 0 | 16 ✅ | 10-15 |
| Exact-match keyword anchors sitewide | 0 | ~140 (from 93 city pages × ~1.5 + FAQ + ServiceCards) | 100+ |

---

## Got Moles-Specific Findings

Per the SKILL Got Moles guardrails:

1. **Strategy doc §3 gaps closed: 1 of 8 (Gap 4 FAQ).** Plus Gap 3 (nearby cities) was already closed pre-launch and Gap 8 (Related Articles) is partially closed via existing RelatedPosts component.

2. **`feedback_per_post_topical_linking.md` rule was tested today.** Initial implementation (commit 817b56c — 24-city footer block) violated the rule and was reverted in c63d7ec. Phase 1B + 1C must use surgical per-post mapping per §5.1 + §5.2.

3. **Cornerstone pillar `/blog/how-to-get-rid-of-moles-in-your-yard/` meets the 8-spoke benchmark** for AI-citation impact. Other pillar candidates (TMCP service page, One-Time service page) have <2 inbound contextual links each — under-supported as Tier 1 hubs.

4. **Schema downgrade** (LocalBusiness/Person/ImageObject/WebSite lost in WordPress→Next.js migration) is partially addressed: LocalBusiness + Person now restored on every blog post (Phase 0). ImageObject + WebSite still missing per page — Phase 2 candidate.

5. **2026-05-05 SEO/GEO audit context** (composite ~72/100, sitewide -1.5/-2 position slip post-Apr-20 deploy): internal-link density is the primary driver. Phase 1B + 1C should partially close this within 14-30 days post-deploy.

---

## Comparison to Prior Audit (2026-04-16)

| Pillar | 2026-04-16 | 2026-05-05 | Change |
|---|:-:|:-:|---|
| Cross-Linking Gaps | 2/10 | 3/10 | +1 (FAQ links) |
| Hub-and-Spoke | 4/10 | 5/10 | +1 (BlogCluster +3, others same) |
| Anchor Text | 4/10 | 6/10 | +2 (FAQ keyword anchors + ServiceCards keyword titles) |
| Orphan Pages | 5/10 | 5/10 | 0 |
| Link Depth | 8/10 | 8/10 | 0 |
| Link Equity Flow | 4/10 | 5/10 | +1 (FAQ deep links flowing equity to 8 specific posts) |
| **Composite** | **41/100** | **50/100** | **+9** |

Most improvement came from Phase 1A (FAQ deep links). Phase 0 schema work doesn't directly score here but supports Hub-and-Spoke / topical authority indirectly via AI citation pathway.

---

## Next Steps (per L2 brief phase ordering)

1. **Phase 1B** — Top 10 blog posts get 2-4 location links per §5.1 mapping. **Open question:** verify whether blog body edits go via `blog-data.ts` + reseed-blogs flag, or via Payload CMS admin directly (brief notes the runbook says 7 posts seeded in all-mode but 35 are live).
2. **Phase 1C** — All 93 city pages get 3-5 blog links per §5.2 archetype mapping. Programmatic via `city-data.ts` archetype field + template addition.
3. **Re-audit at 14 days post-Phase 1B/1C deploy** — should see Cross-Linking Gaps +3 to +5 points and overall score 65-70/100.

---

*Saved to: `clients/got-moles/projects/str-internal-links/2026-05-05_got-moles-audit.md`*

*Apply-fixes mode candidates: P1 #3 (service cross-links) and P1 #4 (service-to-city) are tractable single-PR scoped — could be applied via the skill's apply-fixes mode immediately. P1 #1 and #2 are the per-post editorial work that's the substantive content of Phase 1B/1C.*
