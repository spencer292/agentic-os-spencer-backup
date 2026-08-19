# Phase 0 — Store Audit

**Store:** syperformance.net (Shopify, shop ID 58061357125)
**Date:** 2026-08-18
**Status:** Complete for everything reachable without Admin access. Three items are blocked and listed in §8.

---

## 0. How this was measured

Everything here was pulled from the **public storefront only** — no Admin API, no credentials, no writes. Nothing on the live store was touched.

| Data | Source |
|---|---|
| Sitemap, pages, blog | `/sitemap.xml` and its 5 child sitemaps |
| 198 products, 57 collections | `/products.json`, `/collections.json` |
| Theme, nav, markup | Rendered HTML of home / collection / product |
| Apps and pixels | Live request capture in headless Chrome + `webPixelsConfigList` |
| Performance | Headless Chrome over DevTools Protocol, Lighthouse-equivalent mobile throttling |

**On Lighthouse specifically:** Google's free PageSpeed API is rate-limited to nothing without an API key, and the Lighthouse CLI isn't installed on this machine. Rather than skip the baseline I measured the same underlying metrics directly in Chrome under Lighthouse's own mobile conditions (4× CPU slowdown, 1.6 Mbps / 150 ms RTT). The numbers in §6 are real and directly comparable to the post-build re-run. Getting *official* scored Lighthouse reports needs one of two small approvals — see §8.

Raw data lives in `../data/`, scripts in `../scripts/`.

---

## 1. Sitemap — the whole store

| Type | Count |
|---|---|
| Products | 198 |
| Collections | 57 |
| Pages | **2** (`/pages/contact`, `/pages/collab`) |
| Blogs | 1 (`/blogs/news`) — **0 articles published** |
| Policy pages | 3 (privacy, refund, terms) |

That is the entire site. **There is no About page, no shop tour, no warranty page, no lead times page, no dealer program page, and not one article.** Everything in Phase 6 of the plan is being built from zero, which is exactly as the plan assumed.

**Templates in use** (inferred from rendered pages — exact template list needs theme access): `index`, `collection`, `product`, `page`, `blog`, `article`, `cart`, `search`, `404`, `list-collections`.

### Theme

**Dawn 12.0.0**, theme ID 125654270021, one theme, unmodified store-theme install (asset path `/cdn/shop/t/1/` — this is the first and only theme ever installed).

Two things follow from that, and both are Phase 1 decisions for you:

1. Dawn 12.0.0 is old — Dawn is on v15.x now.
2. **Dawn is no longer Shopify's reference theme.** [Horizon](https://themes.shopify.com/themes/horizon/presets/horizon) replaced it and is what Shopify now recommends as the foundation for new theme work; it's on v1.0.5 as of 10 August 2026 and uses the newer theme-blocks architecture. I checked this rather than assuming it, as the plan asked.

Since nothing has ever been customised on this theme, there is no custom work to preserve — which makes forking Horizon materially cheaper than it usually is. My recommendation is Horizon. Flagging it rather than deciding it, because it affects everything downstream.

---

## 2. Navigation — confirmed broken, and worse than the plan describes

The plan's complaint is accurate. Captured from the live header:

- **`SHOP BY BRAND` and `SHOP BY PRODUCT` both point at `/collections`** — the same URL, twice, in the top nav.
- **Five individual products sit at category level:** HD Vanjen Clamps, Stainless Vband Assembly, Flex Bellow, K Billet Bellhousing, K AWD Tcase Block Off.
- **One nav link points at a URL Google is told not to crawl.** "Shift Selector" links to `/collections/shift-selector/Selector-rod+shift-selector` — a tag-filtered URL. `robots.txt` carries `Disallow: /collections/*+*`. That link is dead weight for SEO and always has been.
- **Typos live in the navigation:** "Scatter Sheild" (shield), "Intercoolers/ Piping" (stray space), "Lsd" (should be LSD), "Wiring/Ecu/Electronics".
- There is no fitment entry point anywhere, as expected.

---

## 3. Collections — the single biggest quiet problem

**All 57 collections have an empty description. Not one has a word of intro copy.**

Every one of these is a page you want ranking, and every one of them currently gives Google a bare product grid, an auto-generated `<h1>` reading "Collection: Syperformance", and **no meta description at all**. The collection page I measured has a 13-character `<title>` — literally just "Syperformance".

This is bigger than the plan's "every collection gets a real intro paragraph." It's 57 pages from zero, and it's probably the cheapest ranking work available on the site.

Collection sizes (top of the list):

| Collection | Products | Note |
|---|---|---|
| SALE SPECIAL | **118** | 60% of the catalog — see §5 |
| Frontpage ("All Brands") | 97 | |
| Syperformance | 73 | The in-house collection |
| Forced Induction | 56 | |
| Transmission Rebuild Parts | 43 | |
| Synchro Solutionz | 40 | |
| FEATURED | 29 | |
| Mitsubishi Evo Parts | 27 | |
| Transmission/Drivetrain/Axles | 26 | The moat, buried |

There are also 12 collections holding 1–2 products each (Pie Cuts: 1, Billet Case: 1, Exterior: 1, Tires: 1, Traction Bars: 1, Scatter Sheild: 1, Shifters/Cables: 1, Clamps: 2, Mandrel Bends: 2, Gearsets: 2, Shift Selector: 2, Comp 1 Clutch: 2). Thin collections split ranking signal and make the nav feel empty. Phase 2 should merge most of them.

---

## 4. Product inventory — 198 products

Full flagged export: **`../data/product-audit.csv`** (one row per product, 26 columns). Summary:

### 4.1 In-house vs resold — the plan's estimate is low

The plan says "~64 in-house SKUs." The real number is higher:

| Origin | Count |
|---|---|
| **IN-HOUSE — SYPerformance** | 75 |
| **IN-HOUSE — Synchro Solutionz** | 33 |
| **IN-HOUSE — Comp 1 Clutch** | 2 |
| **Needs your review** | 52 |
| Resold (identifiable brand) | 36 |

**110 confirmed in-house, plus 52 I can't call from public data.** Those 52 are products where the vendor field says Syperformance but the title isn't a recognisable in-house part family — things like "Flush Mount Hood Pins," "Vacuum block," "Flywheels." Some are genuinely yours; some are resold goods mislabelled. That list is in the CSV filtered on `origin = UNKNOWN` and I need you to mark them.

**The reason I can't tell automatically is itself a finding.** The `vendor` field is being used as *the store's name*, not as *the brand*. It says "Syperformance" on Walbro fuel pumps, Mickey Thompson tires, AEM sensors, Hondata KPro, Injector Dynamics injectors, DeatschWerks regulators and Vibrant mufflers. That is precisely the Phase 7 point about `brand` in structured data — and it is worse than the plan assumed, because it isn't a gap, it's actively wrong data telling Google that SYPerformance manufactures Hondata ECUs. Meanwhile the same `vendor` field is spelled four different ways: `Syperformance` (126), `syperformance` (13), `SYP` (2), plus `SYNCHRO SOLUTIONZ` / `synchro solutions` / `synchro solutionz` across the sub-brand.

### 4.2 Platform coverage

| Platform | Products |
|---|---|
| Honda K | 61 |
| Unclassified | 49 |
| B58 / BMW-Toyota | 17 |
| Evo 8/9 | 17 |
| Universal / fab | 16 |
| Honda B | 11 |
| Honda H/F | 11 |
| Honda B + H/F | 6 |
| Honda K + B | 5 |
| Evo X | 3 |
| Honda D | 1 |

Honda K is a third of the catalog. **Evo X has three products** — worth knowing before it gets equal billing in the nav. The 49 unclassified are mostly universal fab parts and the ambiguous ones from §4.1; they're the same list that needs your pass.

Supporting data quality: **164 of 198 products have an empty `product_type`**, and the 34 that have one use 27 different freeform values including "syncros hubs sliders", "hubs sliders synchros" and "synchros hubs sliders" as three separate types. **38 products have no tags at all.** None of this is usable as a filter basis, which is why Phase 3's metafields are the right call rather than trying to salvage tags.

### 4.3 Descriptions — this is where the money is leaking

| State | Count |
|---|---|
| **EMPTY** (no description at all) | 23 |
| **STUB** (under 120 characters) | 82 |
| THIN (120–400 characters) | 67 |
| OK (400+ characters) | **26** |

**Only 26 of 198 products have a description longer than a tweet.** Ten of those stubs are in-house parts priced over $300:

| Price | Description | Product |
|---|---|---|
| $1,399 | **12 characters** | Comp 1 Twin Disc Clutch |
| $1,150 | 112 chars | Mitsubishi Evo 8/9 Turbo Manifold Factory Placement |
| $1,095 | 112 chars | Evo X Stock Placement Turbo Manifold |
| $795 | 98 chars | K Series Single Lobe Billet Rockers |
| $795 | 70 chars | B Series Single Lobe Billet Rockers |
| $625 | 105 chars | Honda LSD B16 FWD, K AWD/FWD, B AWD |
| $495 | 103 chars | Vertical Flow Intercooler |
| $375 | 93 chars | B Series Hydro Billet Halfshaft |
| $375 | 71 chars | K Series Billet Halfshaft |
| $305 | 77 chars | Honda K Series Coolant Fill Pot |

A $1,399 twin-disc clutch is being sold on twelve characters of copy. The Phase 4A "why this part exists" block has nothing to inherit — every one of these gets written from scratch, and that is content work from you and me, not code.

### 4.4 Titles

168 of 198 titles are structurally fine. The problems are concentrated:

- **21 ALL-CAPS titles** — `MITSUBISHI EVO X TOP MOUNT TURBO MANIFOLD V BAND`, `K SERIES LEAN TOP MOUNT TURBO MANIFOLD`, `HONDA K SERIES BILLET LOWER TIMING CHAIN GUIDE` and 18 others.
- **5 titles prefixed `SYP`** vs 1 prefixed `SYPerformance` vs 192 with no brand prefix at all. The plan calls for picking one — worth noting that today the site is effectively *inconsistent three ways*, not two.
- 3 with mixed-case inconsistency inside a single title.

Full normalisation CSV comes in Phase 7 for your review before any import, per the ground rules.

### 4.5 Part numbers — there aren't any

**All 198 products have no SKU on any variant. Zero.**

This matters for the build: Phase 4A calls for "part number in monospace" as a design element on the product page. There is no part number to render. Either we create a SKU scheme (I can propose one — platform/family/sequence) or that element comes out of the template. **This is a business decision and I need your call before Phase 4.**

### 4.6 Images

| Images per product | Count |
|---|---|
| 1 image | **100** |
| 2–3 images | 58 |
| 4+ images | 40 |

Half the catalog has a single photograph. The plan's design direction — "the product IS the hero, machined aluminium photographs beautifully, let it breathe" — needs photographs to work with. On a gallery-led product template, 100 single-image products will look broken. **Photography is likely the critical path for Phase 4**, and it's the one thing on this list I can't produce.

Alt text: **56 of 86 images on the homepage have no alt text**, including the hero. Every product card image on the homepage inherits the product title as alt (good), but section and hero imagery has none (fails WCAG, and the plan makes accessibility non-negotiable).

---

## 5. Pricing and discounting — the plan's premise needs correcting

The plan states: *"A large share of in-house SKUs currently show a struck-through price."*

**That isn't what's happening.** Only **13 of 198 products** carry a compare-at price. Here they are in full:

| Off | Price | Origin | Product |
|---|---|---|---|
| 5% | $795 ← $835 | in-house | B Series Single Lobe Billet Rockers |
| 5% | $795 ← $835 | in-house | K Series Single Lobe Billet Rockers |
| 10% | $265 ← $295 | in-house | Honda K Series Billet Halfshaft Carrier |
| 13% | $265 ← $305 | in-house | SYP Bseries Billet Halfshaft Carrier |
| 12% | $225 ← $255 | in-house | K Series HD Shift Selector Hammer |
| 24% | $225 ← $295 | in-house | B58 Downpipe Supra A90/A91 |
| 24% | $375 ← $495 | in-house | B58 6 Port CNC Turbo Flanges |
| 27% | $1,825 ← $2,495 | in-house | B58 6 Port Top Mount Turbo Manifold |
| 31% | $450 ← $650 | review | A90 Supra Carbon Fiber Fenders |
| 22% | $350 ← $450 | review | A90 Supra Carbon Door Guard Trim |
| 25% | $150 ← $200 | resold | Translab K-AWD Transfer Case Block Off |
| 25% | $150 ← $200 | resold | Translab B AWD-SBXM Block Off |
| 25% | $150 ← $200 | resold | Translab Billet Input Shaft Thrust Tool |

The specific examples the plan cites ($795 from $835, $265 from $295) are real and are on the rockers and halfshaft carriers. So the instinct is right — it's just that the practice is limited to 13 products, not widespread.

**The actual discounting problem is structural and bigger.** A collection named **SALE SPECIAL contains 118 of your 198 products** — 60% of the catalog — and it is surfaced in the main navigation as **"Coupon Limited Items."** A store where six products in ten live in a permanent sale collection reads exactly the way the plan is trying to avoid, and it does so without needing a single struck-through price. Killing the compare-at prices on 8 in-house SKUs is a ten-minute job. Deciding what SALE SPECIAL is actually for is the real decision, and it's yours.

---

## 6. Performance baseline

Measured in headless Chrome, cache disabled, Lighthouse mobile throttling (4× CPU, 1.6 Mbps, 150 ms RTT). Full data in `../data/perf-baseline.json`.

### Mobile

| Page | LCP | FCP | CLS | Blocking time | Requests | Transfer | DOM nodes |
|---|---|---|---|---|---|---|---|
| Home | **5,296 ms** | 1,356 ms | 0 | ~700 ms | 165 | 2,167 KB | 4,500 |
| Collection | **2,980 ms** | 1,392 ms | 0 | ~620 ms | 158 | 1,633 KB | 3,649 |
| Product | **4,352 ms** | 1,528 ms | 0.034 | ~656 ms | 221 | 2,041 KB | 3,013 |

### Desktop

| Page | LCP | FCP | CLS | Blocking time | Requests | Transfer |
|---|---|---|---|---|---|---|
| Home | 588 ms | 372 ms | 0 | ~0 ms | 170 | 1,889 KB |
| Collection | 360 ms | 324 ms | 0 | ~0 ms | 192 | 2,021 KB |
| Product | 1,192 ms | 592 ms | 0.006 | ~0 ms | 257 | 2,638 KB |

**Reading it plainly:** desktop is fine. Mobile is not. Google's threshold for "good" LCP is 2.5 s and "poor" is 4 s — the homepage is at 5.3 s and the product page at 4.35 s on a mid-range phone. Blocking time of 600–700 ms is in Lighthouse's red band. Hitting the plan's target of mobile 85+ is realistic but it is real work, not a tweak.

**What's causing it:**

- **927 KB–1.1 MB of JavaScript** across 70–108 script requests per page. On a store with almost no third-party apps, this is nearly all Shopify platform and Dawn.
- **125 stylesheet links on the homepage**, 60 on the collection page. Dawn loads CSS per-component; nobody has ever consolidated it.
- **731 KB of images on the homepage** across 14 requests. The hero is served at 1440 px wide.
- The good news: the hero image is correctly *not* lazy-loaded and carries `fetchpriority="high"`, 74 of 86 images below the fold *are* lazy, and `srcset` is properly populated (7–9 entries per image). Dawn's fundamentals are right — the weight is the problem, not the technique. CLS is essentially zero across the board, which is worth protecting through the rebuild.

---

## 7. Apps, pixels and tracking

No app is injecting scripts into the storefront markup — no review app, no fitment app, no page builder, no upsell app. Detected from the live page:

| What | ID | Status |
|---|---|---|
| Google & YouTube (Ads + Merchant Center) | `AW-16490778819`, `GT-K557F822`, `MC-ZJQ1BTX8B0` | Active, firing page_view / view_item / add_to_cart / begin_checkout / purchase |
| Facebook & Instagram (Meta Pixel) | `193245143402954` | Active |
| A third Shopify app pixel | api client `2775569` | Active, unidentified from public data |
| One custom pixel | — | Active |
| Shop Pay | — | Active |

**You are running Google Ads and Google Shopping against this store.** Conversion tracking is wired and firing correctly, which is good — and it also raises the stakes on the redirect map in Phase 7, because broken URLs will take Merchant Center listings down with them.

**What I cannot see:** the full installed-app list and what each costs. Apps that don't inject storefront scripts (fulfilment, inventory, accounting, email) are invisible from outside. That's item 3 of Phase 0 and it needs you — see below.

---

## 8. Blocked — what I need from you

Three Phase 0 items can't be completed from outside the store, plus two approvals.

**1. Installed apps and their monthly cost.** Shopify Admin → Settings → Apps and sales channels. A screenshot is fine. Then Settings → Billing → Subscriptions for what each actually costs.

**2. Metafield definitions.** Shopify Admin → Settings → Custom data → Products. I expect this to be empty — nothing in the storefront suggests any metafields exist — but Phase 3 builds directly on top of this and I shouldn't guess. Tell me what's listed there, even if it's "nothing."

**3. Shopify CLI + store access.** Nothing is installed on this machine yet. Once you approve, this is what you'll run — I'll walk you through each one as we get there:

```
npm install -g @shopify/cli@latest
shopify theme pull --store syperformance.net
```

The first pulls the toolkit; the second downloads a copy of the live theme to work from. Neither changes anything on the live store. `theme pull` is read-only, and every subsequent command targets a new unpublished development theme.

**4. Approval to install Lighthouse locally** (`npm install -g lighthouse`). This is a free, Google-published measurement tool that runs on this machine — it isn't a Shopify app, costs nothing, and never touches the store. It gets us official scored reports for the Phase 8 comparison. The alternative is a free Google PageSpeed API key from console.cloud.google.com, which needs a Google Cloud project. My recommendation is the local install — it's simpler and works offline. Either way, the §6 numbers already give us a valid baseline.

**5. The 52 unclassified products.** Open `../data/product-audit.csv`, filter `origin = UNKNOWN`, and mark each in-house or resold. This one gates Phase 4 — the whole point of the redesign is treating those two groups differently, and I can't split them on guesswork.

---

## 9. Decisions I need before the next phases

Not blocking Phase 1, but they land soon and they're yours, not mine:

| # | Decision | Needed by | My recommendation |
|---|---|---|---|
| 1 | **Horizon or Dawn** as the base theme | Phase 1 | **Horizon.** It's the current reference theme, and since your Dawn install has never been customised there's nothing to lose by moving |
| 2 | **Part numbers** — invent a SKU scheme, or drop part numbers from the product design | Phase 4 | Create them. A manufacturer without part numbers undercuts the whole positioning. I'll propose a scheme |
| 3 | **What SALE SPECIAL is for** — 60% of the catalog is in it | Phase 2 | Cut it to genuine clearance and drop it from primary nav |
| 4 | **`SYPerformance` or `SYP`** as the one written form | Phase 7 | `SYPerformance` everywhere, one word |
| 5 | **Product photography** — 100 products have one photo | Phase 4 | Prioritise the ~30 in-house drivetrain hero SKUs first |
| 6 | Warranty terms, real lead times per category | Phase 4/6 | You have to tell me — I won't invent claims |

---

## 10. What the audit changes about the plan

Four things worth flagging, all of which make the plan's core argument *stronger*, not weaker:

1. **In-house SKUs are 110+, not ~64.** The manufacturing story is bigger than the plan assumed.
2. **The permanent-discount problem isn't compare-at pricing** (13 products) **— it's a 118-product collection called SALE SPECIAL sitting in the main nav.** Same disease, different symptom, different fix.
3. **The `vendor` field is actively wrong, not just inconsistent.** It tells Google that SYPerformance manufactures Hondata ECUs and Mickey Thompson tires. Fixing this is arguably the highest-leverage single SEO change on the site and it costs nothing but a CSV.
4. **Content, not code, is the critical path.** 172 of 198 products have a description shorter than 400 characters, 57 of 57 collections have none, there are zero articles and no About page. Every template in this plan is a container for writing that doesn't exist yet. The build will be ready long before the words are — worth planning for now rather than discovering in Phase 5.

The brand collision with Superformance is noted and carried forward to Phase 7 as flagged; it's a business decision, not a code fix, and nothing in this audit changes that.

---

**Phase 0 complete. Stopping here for your review, per the plan.**
