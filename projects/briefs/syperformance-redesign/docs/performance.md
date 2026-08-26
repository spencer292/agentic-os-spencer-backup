# Phase 8 — Performance

**Target (PLAN Phase 8.5):** Lighthouse mobile performance 85+, all Core Web Vitals green, reported against the Phase 0 baseline.

**Result: 96–98 on mobile across the homepage, a collection page and a product page. All Core Web Vitals green.**

---

## 1. The headline

Mobile, Lighthouse throttling (4× CPU, 1.6 Mbps, 150 ms RTT):

| Page | Phase 0 baseline (live site, Dawn) | Phase 8 (rebuilt theme, optimised) |
|---|---|---|
| Home | **59** | **98** |
| Collection | **77** | **96** |
| Product | **65** | **97** |

**Measured on the live theme: 98 / 98 / 96.** The rebuild was published on the build store on 2026-08-26 (theme `157153820829`), so this is no longer an estimate with the preview-only scripts subtracted — it is what a visitor gets: no preview cookie, no preview bar, no hot-reload client.

These scores move by a point or two between runs — the mobile profile is 1.6 Mbps against a real network, so a single slow request shifts FCP by 100 ms. Across every batch measured, the three pages sat in a **96–98** band and never dropped below 96. The target was 85.

Metric by metric, mobile — medians of three runs:

| | Home | | Collection | | Product | |
|---|---|---|---|---|---|---|
| | baseline | now | baseline | now | baseline | now |
| **LCP** | 5,296 ms | **1,732 ms** | 2,980 ms | **1,844 ms** | 4,352 ms | **2,136 ms** |
| **FCP** | 1,356 ms | 1,732 ms | 1,392 ms | 1,844 ms | 1,528 ms | 1,952 ms |
| **CLS** | 0 | 0.011 | 0 | **0** | 0.034 | **0** |
| **Blocking time** | ~700 ms | **96 ms** | ~620 ms | **155 ms** | ~656 ms | **100 ms** |
| **Requests** | 165 | 133 | 158 | 158 | 221 | 154 |
| **Transfer** | 2,167 KB | **826 KB** | 1,633 KB | 1,395 KB | 2,041 KB | 1,414 KB |
| **DOM nodes** | 4,500 | **808** | 3,649 | 2,192 | 3,013 | **898** |
| **Stylesheet links** | 125 | **8** | 60 | **8** | — | **9** |

Core Web Vitals thresholds: LCP good < 2,500 ms, CLS good < 0.1. Every page is inside both. The baseline had two pages in the red LCP band (> 4,000 ms).

**FCP is the one metric that went backwards**, and it is worth being straight about why: the old site painted a mostly-empty frame early and then took another four seconds to finish. The rebuilt page paints later but paints the actual content — LCP and FCP are now the same event on the homepage and the collection page, and 180 ms apart on the product page. Trading a 380 ms-later first paint for a 3.5-second-earlier largest paint is the right trade, but it is a trade, not a free win.

**Where the credit belongs.** Most of this was already won before Phase 8 started. The rebuilt theme scored 96 / 96 / 95 the moment it was measured — the gains above come overwhelmingly from Phases 1–7 replacing a 4,500-node, 125-stylesheet Dawn homepage. Phase 8 itself moved the scores 96 → 98, 96 → 96, 95 → 97, and cut mobile FCP by 100–340 ms. Real, but a polish pass on top of a rebuild, not the rebuild.

---

## 2. What Phase 8 actually changed

### 2.1 Every SYPerformance stylesheet moved into `<head>`

The biggest single defect. Horizon's convention puts `{{ 'x.css' | asset_url | stylesheet_tag }}` inside each section, which emits the `<link>` partway down `<body>`. The browser only discovers it when the parser reaches that section, and a stylesheet blocks rendering of everything after it — so a page with a header, seven sections and a footer paid a serial round trip per discovery, at 150 ms each.

Measured on the homepage before the change: **22 `<link>` elements, the first at line 1,497 of the document**, the last at 2,122. After: **8 links, all in `<head>` by line 76**, discovered by the preload scanner in the first kilobyte and downloaded in parallel.

They are now declared once in `snippets/stylesheets.liquid`, template-conditionally, and the per-section tags are gone. The snippet carries a note saying not to reintroduce them.

### 2.2 The collection grid stopped loading 24 full-size images before first paint

Horizon's `card-gallery.liquid` marks every card eager if its section is one of the first five on the page. That is correct for a featured row of four products and wrong for a paginated grid: `/collections/syp-billet` fired **24 eager image requests, 22 of them below the fold**, for 1,153 KB.

Paginated grids (collection, search) now use `loading="lazy"` with `sizes="auto"`, which also lets the browser ask the CDN for the width the card actually renders at rather than the `100vw` the static `sizes` string claimed. Collection page transfer: **2,020 KB → 1,395 KB**. The LCP element on these templates is text, so nothing above the fold was deferred.

### 2.3 The product gallery stopped loading every image twice, eagerly

`product-media.liquid` passes `loading` straight through to `image_tag`, and `product-media-gallery-content.liquid` never set it — so every product image loaded eagerly. Because the mobile slideshow and the desktop grid both render the full media set, **each image was fetched twice before first paint**: six eager requests for three images, 511 KB.

Now the first image in each gallery is eager with `fetchpriority="high"` (it is the LCP candidate) and the rest are lazy. Verified on the rendered page: 2 eager, 17 lazy.

### 2.4 Font preloads deduplicated

Horizon preloads body, subheading, heading and accent unconditionally. SYPerformance's four roles resolve to three Inter faces — heading and accent are both Inter 700 — so the same 38 KB woff2 was preloaded twice. Now three distinct preloads.

A note left in `snippets/fonts.liquid` for whoever touches it next: `capture` inside a `{% liquid %}` tag returns empty here, which silently collapses the dedupe to a single preload and drops two real faces. Use `assign` with the `font_url` filter.

### 2.5 The popover polyfill only loads where the browser lacks popover

`popover-polyfill.js` is 25 KB and its own last line is `if (!isSupported()) apply();` — every browser with native popover support (Chrome 114+, Safari 17+, Firefox 125+) downloaded it on the critical path in order to do nothing. Nothing imports it as a module, so the fetch is now gated on the same feature check it performs internally.

### 2.6 Five module scripts nothing renders were removed

Horizon loads roughly thirty module scripts on every template. `scripts/audit-scripts.mjs` fetches every template from the build store, reads which custom elements each script registers, and reports which of those elements actually appear anywhere. Five matched nothing, are imported by no other module, and have no dynamic path in: `layered-slideshow.js`, `video-background.js`, `volume-pricing.js`, `price-per-item.js`, `volume-pricing-info.js`.

**Everything reachable through the quick-add dialog was deliberately kept.** `quick-add.js` fetches the product page's HTML and injects it, and module scripts inside injected markup do not execute — so `variant-picker`, `product-form`, `product-price`, `quantity-selector` and `media-gallery` must stay loaded sitewide even though the audit shows their elements only on `/products`. Gating those to the product template would have broken add-to-cart from a collection page. That was the trap in this change and it is why the audit script exists rather than a guess.

Script count per page: 86–95 → 82–91.

### 2.7 A pre-existing accessibility bug, found by the regression check

Not a performance fix, but the Phase 8 verification tooling surfaced it. `sections/syp-header.liquid` renders a `<header-actions>` element with exactly the `ref="liveRegion"` and the `aria-controls="cart-drawer"` trigger that Horizon's `HeaderActions` component requires — but `header-actions.js` only ever loaded from `snippets/header-actions.liquid`, which belongs to Horizon's own header and this theme does not render.

So the element sat in the DOM unupgraded on every page since Phase 1: **the cart count was never announced to screen readers, and the cart button's `aria-expanded` never changed.** An undefined custom element fails silently rather than throwing, which is why nothing surfaced it. One line in `snippets/scripts.liquid` fixes it.

---

## 3. Where the remaining time goes, and why it stops here

FCP is now the binding constraint on every page, and one resource sets it: **`compiled_assets/styles.css`**, Shopify's concatenation of every `{% stylesheet %}` block in the theme. It is 49 KB, render-blocking, and served on every page whether or not the sections that own the CSS are present.

Critical path on the homepage after the fixes:

```
  297 ->  818 ms    6 KB  base.css                        }  all seven of the theme's
  298 ->  677 ms  1-2 KB  syp-*.css  (six files)          }  own stylesheets, parallel
  299 -> 1271 ms   49 KB  compiled_assets/styles.css      <- sets FCP
                          FCP at 1,736 ms
```

Everything else is done by 818 ms. The compiled bundle lands at 1,271 ms, and the remaining ~465 ms is CPU: parsing 483 KB of uncompressed CSS at 4× throttling.

Measured directly — blocking that one file takes mobile FCP from 1,732–1,952 ms to **~1,200 ms**, worth 530–750 ms. So the question is whether the bundle can be shrunk. `scripts/audit-css-bundle.mjs` walks the reachability graph from the real entry points and answers it:

| | unreachable | share of bundle |
|---|---|---|
| Files nothing can ever render | 92 KB | **19%** |
| Files the current templates don't render (`--strict`) | 110 KB | **23%** |

**About 80% of that bundle is genuinely reachable**, so it cannot be meaningfully shrunk without deleting Horizon sections and blocks — which trades away theme-editor options and makes future Horizon updates messier, for maybe 80–100 ms. That is a decision about how much of Horizon SY wants to keep, not a performance tweak, so it is logged in the checklist rather than done. **Phase 8 has hit Horizon's floor.**

The other large number on the page is Shopify's own platform JavaScript — 335–418 KB across checkout-web, Web Pixels Manager, trekkie, shop-js and portable-wallets. Phase 0 §7 established that **no third-party app injects storefront scripts**, so PLAN item 8.4 has no work in it: there is nothing installed to remove, and none of the platform scripts are the theme's to drop.

---

## 4. How this was measured, and what the numbers are not

- `scripts/perf-measure.mjs` drives installed Chrome over CDP under **the same throttling as the Phase 0 baseline** — 4× CPU, 1.6 Mbps / 150 ms RTT, cache disabled — so the two are directly comparable. Three runs per page; **medians**, not means, because one stalled request skews a mean badly on a real network.
- `scripts/perf-score.mjs` applies **Lighthouse's own log-normal curves and weights** to those metrics. It does not run Lighthouse. Lighthouse itself needs a local install (checklist 6.3, still awaiting approval) and the PageSpeed API cannot reach a password-protected development store.
- **Speed Index is not measured**, so the scores are over the other 90% of the weighting, renormalised. **INP is not measured either** — TBT is a load-time proxy for it, not a substitute.
- The headline table was measured on development theme `157001318557`, which Shopify serves a hot-reload client, a preview bar and a perf kit that a published theme never gets. `--published` now authenticates *without* pinning a preview theme, so it measures the live published theme directly — `data/perf-phase8-after-published.json` is a measurement, not a subtraction. The two agree to within a point, which is the useful result: the preview overhead was never material (~30 KB, 4–5 requests).

**These are close estimates, not an official audit.** Confirm with a real Lighthouse run once the theme is published on SY's store — that belongs in Phase 9.

---

## 5. Verification

`scripts/check-templates.mjs` loads all eleven templates in a real browser and reports console errors, failing requests, and any custom element in the DOM whose defining script did not load — the only way to catch an over-aggressive script gate, since an unregistered custom element fails silently rather than throwing.

All eleven templates clean. Two items remain on the homepage, neither caused by Phase 8:

- `403 shop.app/pay/hop` — the Shop Pay iframe is refused on a password-protected store. Expected; will resolve on a live store, and is on the Phase 9 purchase test anyway.
- ~~`404 /favicon.ico`~~ — **fixed after the fact.** `settings.favicon` was unset, so Horizon emitted no `<link rel="icon">` and the browser fell back to a path that does not exist. Chasing it turned up that SYPerformance has no logo at all — the live site's header is text and serves no favicon either. The theme now ships its own mark at `theme/assets/syp-favicon.png`, built by `scripts/make-favicon.mjs`, with `settings.favicon` kept as the override. See checklist 8.1 and 8.6.

The manufacturing-claims rule was re-verified against the rendered homepage, product page, `syp-billet` and About after the theme was re-pushed: zero forbidden shop-floor phrases, all authority wording present.

---

## 6. Scripts added in this phase

| Script | What it does |
|---|---|
| `perf-measure.mjs` | Measures the build store under Phase 0's throttling. `<label> <runs> [--published] [--no-compiled-css]` |
| `perf-critical-path.mjs` | Prints what is render-blocking and what finished before FCP, in time order |
| `perf-score.mjs` | Applies Lighthouse's scoring curves to the measured metrics |
| `audit-scripts.mjs` | Maps each module script to the custom elements it registers, then reports which templates actually contain them |
| `audit-css-bundle.mjs` | Walks reachability to show how much of `compiled_assets/styles.css` any page can render |
| `check-templates.mjs` | Regression check: console errors, failed requests, unupgraded custom elements, across all templates |
| `fetch-page.mjs` | Fetches a rendered page from behind the storefront password on the preview theme |
| `make-favicon.mjs` | Renders the favicon mark plus a preview sheet at real tab sizes. `--compare` sheets the chamfer options |
| `_build-store.mjs` | Shared store handle, theme id and the authenticated cookie jar the others use |

**They need `SHOPIFY_BUILD_STORE_PASSWORD` in the repo-root `.env`** — the storefront password for the build store, the one typed on the "Enter using password" screen. It is a credential, so it is not in a tracked file; `.env` is permission-denied to me, so **SY or Spencer has to add that one line** before any of these will run again. Every script fails with that exact instruction if it is missing.

Run all of them from `projects/briefs/syperformance-redesign/`. On Git Bash, prefix with `MSYS_NO_PATHCONV=1` where a path-like argument (`/`, `/collections/...`) is passed, or the shell rewrites it into a Windows path before Node sees it.
