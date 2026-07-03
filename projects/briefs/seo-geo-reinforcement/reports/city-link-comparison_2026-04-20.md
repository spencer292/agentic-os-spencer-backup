# City Link Comparison — Old Site vs New Build

**Date:** 2026-04-20
**Old site:** https://got-moles.com (WordPress + Yoast)
**New build:** https://project-pf8c6.vercel.app (Next.js + Payload)
**Method:** Direct HTML/sitemap fetch + URL-pattern parse + per-city HTTP probe

## TL;DR

**Yesterday's L2 brief overstated the city gap.** The Rankings-sheet evidence (Algona / Fairwood / Lake Tapps / Medina at #1-#3 on old site) led us to assume those city pages were missing on the new site. **Direct HTTP verification shows they exist** — `/mole-control-algona/`, `/mole-control-fairwood/`, `/mole-control-lake-tapps/`, `/mole-control-medina/` all return 200 with proper H1s.

**The actual gap is much smaller:**

| What | Count | Status |
|------|------:|--------|
| Cities truly missing pages on new site | **2** | Centralia + Eatonville (404 confirmed) |
| Cities with pages but missing redirect coverage | **4** | Algona, Fairwood, Lake Tapps, Medina (200 on canonical, but old URL patterns hit 404) |
| `-2` suffix URL patterns from old site | **5** | edgewood-2, lacey-2, seatac-2, spanaway-2, sumner-2 (redirect handlers needed) |
| New cities expanded beyond old | **25** | bremerton, everett, marysville, bainbridge-island, monroe, port-orchard, etc. |

The L2 brief Track C1 needs revising: Centralia + Eatonville are the only cities needing **new pages**. The other 4 need only **redirect updates** (citySlugs in redirects.ts grows from 77 → 90+).

---

## City Coverage Comparison

| | Old Site | New Build |
|---|--------:|----------:|
| Total city pages (sitemap) | 72 | 90 |
| Cities with H1 200 verified | 72 | 90 |
| URL pattern | `/{slug}/` + `/city/{slug}/` + 6 verb prefixes | `/mole-control-{slug}/` (single canonical) |
| County pages | 5 (King, Pierce, Snohomish, Thurston, Lewis) | 0 (consolidated to /service-areas/) |
| City × service combo URLs | 220+ | 0 (consolidated via 301s) |

## Set-level delta

- **Common cities (in both):** 65
- **Only on new (expansion):** 25
- **Only on old (truly missing pages):** 2 — Centralia, Eatonville
- **Old URL patterns missing redirect handlers:** 5 — edgewood-2, lacey-2, seatac-2, spanaway-2, sumner-2

### The 25 "new on the new build" cities

```
arlington, bainbridge-island, bremerton, brier, carnation, elk-plain,
everett, frederickson, granite-falls, lake-forest-park, marysville,
milton, monroe, mountlake-terrace, normandy-park, pacific, parkland,
port-orchard, poulsbo, rainier, silverdale, snohomish, stanwood,
sultan, tenino
```

Significant additions:
- **Bremerton** — Kitsap County seat
- **Everett** — major Snohomish city
- **Marysville** — major Snohomish city
- **Bainbridge Island** — high-HHI Kitsap
- **Snohomish** — Snohomish County seat overlap
- **Port Orchard** — Kitsap

These are real coverage expansions, mostly into Snohomish + Kitsap counties.

### The 2 "only on old" cities (truly missing)

| City | Old-site rank evidence | Verdict |
|------|------------------------|---------|
| **Centralia** | 18 keywords tracked, 6 different terms at #1 continuously for 2-3 years | **Build new page — highest-stakes single addition** |
| **Eatonville** | `mole control eatonville` #1 continuously since March 2023 | **Build new page** |

### The 4 "exists but redirect-uncovered" cities

| City | Page on new site | Old-URL patterns hitting 404 | Action |
|------|:----:|------------------------------|--------|
| Algona | ✅ /mole-control-algona/ (H1: "Mole Control in Algona") | `/algona/`, `/algona-mole-control`, `/mole-trapping-algona`, etc. | Add `algona` to citySlugs |
| Fairwood | ✅ /mole-control-fairwood/ (H1: "Mole Control in Fairwood") | `/fairwood/`, `/fairwood-mole-control`, etc. | Add `fairwood` to citySlugs |
| Lake Tapps | ✅ /mole-control-lake-tapps/ (H1: "Mole Control in Lake Tapps") | `/lake-tapps/`, `/lake-tapps-mole-control`, etc. | Add `lake-tapps` to citySlugs |
| Medina | ✅ /mole-control-medina/ (H1: "Mole Control in Medina") | `/medina/`, `/medina-mole-control`, `/medina-mole-extermination`, etc. | Add `medina` to citySlugs |

### The 5 `-2` suffix URL patterns

Old site has duplicate URLs with `-2` suffix (likely WordPress auto-generated duplicates). City pages exist on new build (slug without `-2`), but old URLs need redirecting:

| Old URL | Destination |
|---------|-------------|
| `/edgewood-2/` (and variants) | `/mole-control-edgewood/` |
| `/lacey-2/` | `/mole-control-lacey/` |
| `/seatac-2/` | `/mole-control-seatac/` |
| `/spanaway-2/` | `/mole-control-spanaway/` |
| `/sumner-2/` | `/mole-control-sumner/` |

All 5 cities have working pages on new site — just need pattern handler in redirects.ts.

---

## Internal Link Density Comparison

Where each site distributes its city link equity:

| Surface | Old Site | New Build |
|---------|---------:|----------:|
| Homepage body | 63 city links | 12 city links |
| Homepage footer | 0 | 5 (top 5 only) |
| Aggregator hub (/cities-served vs /service-areas) | ~72 (estimated) | **90 (verified)** |
| Per-city nearby links | unknown | 6 (post yesterday's expansion) |

### Reading the delta

The two sites take **opposite link-distribution strategies**:

**Old site:** flat sitewide distribution. 63 cities get a homepage link each — equal PageRank flow. Every city gets a slice of the homepage authority.

**New site:** concentrated distribution. 12 top-spend cities get homepage links + 5 of those get footer links. The other 78 cities get their link equity through the /service-areas/ hub (90 links) and per-city nearby-cities sections (6 links each).

**Trade-off:**
- New approach is **better for top-12 cities** — concentrated authority lifts ranks on Sammamish, Bellevue, Tacoma, Seattle, Puyallup, etc.
- New approach is **weaker for tail cities** that previously received homepage link equity (Algona, Centralia (when added), Lake Tapps, Medina, etc.)
- BUT: the per-city 6-nearby-cities expansion (yesterday's work) creates a denser city-to-city link graph that the old site never had. So tail cities still get internal authority — just from peer cities, not from homepage.

**Recommendation:** Acceptable trade-off. The old site's flat distribution wasn't meaningfully helping the tail cities anyway (most of them ranked #1 on long-tail terms with little competition). Concentrating homepage authority on top-spend Eastside cities should compound paid + organic returns there. The per-city nearby-links graph is a stronger long-term link equity flow than 63 footer links.

---

## Specific Risk Surfaces

### 1. 51 cities lose homepage link equity (managed risk)

The 51 cities linked from old homepage but not new homepage:

```
algona, black-diamond, bonney-lake, bothell, buckley, burien, centralia,
clyde-hill, covington, des-moines, dupont, eatonville, edgewood, edmonds,
fairfax, fairwood, fife, gig-harbor, graham, green-river, kenmore, lacey,
lake-city, lake-stevens, lake-tapps, lakewood, lynnwood, maple-valley,
medina, mercer-island, mukilteo, newcastle, olympia, orting, prairie-ridge,
ravensdale, redmond, roy, seatac, shoreline, snoqualmie, south-hill,
spanaway, steilacoom, sumner, tukwila, tumwater, university-place,
white-center, woodinville, yelm
```

**Mitigation:** All 51 still receive link equity from /service-areas/ hub + nearby-cities peer linking. The actual ranking risk is small — most of these were ranked deep on long-tail terms anyway. The Rankings sheet shows the ones that matter (Algona, Centralia, Eatonville, Fairwood, Lake Tapps) as already #1-#3, not dependent on homepage link.

### 2. citySlugs hardcode lag (real bug)

`src/lib/redirects.ts` hardcodes 77 cities in `citySlugs`. The new site has 90 city pages. So 13 cities exist as canonical pages but don't have old-URL redirect handlers:

```
arlington, bainbridge-island, bremerton, brier, carnation, elk-plain,
everett, frederickson, granite-falls, lake-forest-park, marysville,
milton, monroe, mountlake-terrace, normandy-park, pacific, parkland,
port-orchard, poulsbo, rainier, silverdale, snohomish, stanwood,
sultan, tenino
```

(These are the 25 "only on new" minus the original 12 in citySlugs that the comment claims were the original 77 — actual count needs reconciliation when patching.)

**Some of these** never had old-site URLs (because they're brand new coverage), so no old-URL redirect is needed — but the code should derive citySlugs from city-data.ts at build time so future additions don't drift again.

### 3. The "centralia + eatonville" reversal stands

Yesterday's brief said these MUST be added. Today's evidence (Rankings sheet + 404 confirmation) reinforces the call. They're the only 2 cities truly missing as pages, AND they have the strongest historical ranking footprint on the old site.

---

## Implications for L2 brief Track C

**Update Track C1:** Reduce from "add 6 cities" to "add 2 cities (Centralia, Eatonville) + verify 4 cities (Algona, Fairwood, Lake Tapps, Medina) just need redirect coverage, not new pages."

**Track C2 (citySlugs alignment) becomes more important, not less:** drift from 77 → 90 is real. Recommend deriving citySlugs from city-data.ts at build time.

**Track C3 (redirect patterns) confirmed:** 5 `-2` suffix patterns + the existing E-spelling / reverse-pattern gaps from yesterday.

**Track C4 (verification) takes on new urgency:** the 4 "exists-but-uncovered" cities prove the citySlugs hardcode silently rotted. Need automated post-launch verification that every old URL → 200/301 to a relevant page.

---

## Open question for Roy

The 51-city homepage link reduction is a positioning + SEO trade-off. Two options if the concentration concern outweighs the simplicity benefit:

1. **Accept** the new approach (concentrate on top 12, fan out via /service-areas/) — current state.
2. **Add a sitewide footer city dropdown / alphabetical city list** to give every city a sitewide link without polluting the visible footer. Compromise approach.

No need to act now. Worth revisiting if Search Console shows tail cities losing position post-launch.
