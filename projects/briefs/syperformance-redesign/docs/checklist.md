# Finalization checklist

Everything deferred, blocked, or left for a decision, in one place. Kept current as phases land.

**Last updated:** 2026-08-26, after the collection hub + brand-ownership correction
**Phases complete:** 0 (audit) · 1 (foundation) · 2 (IA — **executed**) · 3 (fitment) · 4 (product page) · 5 (homepage) · 6 (trust pages) · 7 (SEO) · 8 (performance)
**Not started:** 9 (pre-launch)

**Phase 8 landed:** mobile Lighthouse 96–98 against a Phase 0 baseline of 59 / 77 / 65, all Core Web Vitals green. Full report and method in `docs/performance.md`.

---

## 1. Blocking — nothing downstream moves without these

| # | Item | Who | Blocks | Notes |
|---|---|---|---|---|
| 1.1 | ~~Shopify Admin API token~~ | — | — | **DONE 2026-08-26.** Verified live: connected to "SYPerformance Build", 198 products. Phase 2 executed, metafield definitions created, values written. |
| 1.2 | **The 51 unclassified products** — in-house or resold? | Spencer | Phase 4 correctness | `data/unknowns-review.csv`, `ownerDecision` column. All 51 currently render as **resold** so nothing gets an unearned MADE IN-HOUSE badge. |

---

## 1b. THE MANUFACTURING CLAIM — settled 2026-08-26

Spencer flagged that most parts are made by subcontractors while the site said "made in house". Two claims had been collapsed into one, and only one of them was false.

**SYPerformance IS the manufacturer — use it.** It owns the designs, the drawings and the specs, contracts production to them, inspects and warranties. That is the standard industry meaning of the word; most respected brands in this space are structured the same way. It is also the authoritative claim and the one that cannot be disproved.

**What must never appear:** anything naming a physical shop floor — *machined in our own shop*, *cut here*, *on our machines*, *our facility*. Specific, checkable, and not ours to claim. In this scene people work out who cuts what, and a brand caught claiming a floor it does not have loses more authority than one that never claimed it.

**Nothing on the site mentions subcontracting.** It was never necessary to; only the false half needed removing.

**Final wording, live and verified:** badge = `SYPerformance` (the brand itself — strongest signal, nothing to defend) · hero = *"We make the drivetrain parts that break first"* · eyebrow = *"Billet manufacturing · Western Washington"* · story heading = *"We manufacture our own parts. We don't rebadge someone else's."* · step 2 = *"Built to our spec"* · footer = *"Designed and manufactured to our spec"*.

Verified by scanning rendered pages — homepage, product, `syp-billet`, About — for both the forbidden phrases (none) and the authority words (all present). The rule is restated at the top of `docs/ia.md` §4 and in `snippets/syp-badge.liquid`.

| # | Item | Owner | Note |
|---|---|---|---|
| 1b.1 | **Metafield still named `custom.made_in_house`** | to do | Nothing customer-facing, but misleading in the admin. Renaming the key is a data migration; change the display name first. |
| 1b.2 | **Audit the other inherited claims** | Spencer | The plan and Phase 0 also assert "110 in-house SKUs", "over a hundred of its own SKUs" and the 5-week Quick Fix structure. Worth testing now rather than at launch. |

**The process lesson, kept deliberately:** I refused to invent warranty terms and lead times, then wrote manufacturing claims without applying the same test — because they came from the plan rather than from me. An inherited claim is still a shipped claim.

---

## 2. Content Spencer has to supply — I will not invent these

| # | Item | Where it lands | Why I won't guess |
|---|---|---|---|
| 2.1 | **Warranty terms — DECIDED 2026-08-26: not site-wide** | per product only | Spencer: *"dont make that warranty site wide."* Several products already state **"1 year warranty to the original purchaser with receipt"** in their own copy, and that is those products' term — it stays there. `page.warranty` does **not** get a blanket policy, nothing is added to a product that does not already carry it, and the page still needs Spencer to decide what, if anything, it says. The four hero pages that state a term state it because their own existing description did. |
| 2.2 | **Lead times per category** | `page.lead-times`, plus product pages | Same. `syp-lead-times` ships with zero rows on purpose. |
| 2.3 | **"Why this part exists"** × 110 in-house products | `custom.why_this_part` | Needs the failure mode, what changed, what it means. This is the single most important block on the site. **Metafield now exists and is empty on all 110.** |
| 2.4 | **"Before you buy"** × 110 in-house products | `custom.before_you_buy` | The honest caveats — what else you need, what needs modification. |
| 2.5 | **Spec tables** | `custom.specs` | Material, dimensions, tolerances, hardware, torque specs. |
| 2.6 | **HP ratings** | `custom.hp_rating` | Only where a real number exists. |
| 2.10 | **Chassis codes** | `custom.chassis` | Phase 3 wrote platform for 149 products and drivetrain for 14, both derived from the audit. **Chassis is empty on all 198** — it cannot be derived from a title, and it is what makes the fitment selector precise rather than broad. |
| 2.7 | **About / shop tour story** | `page.about` body | Who runs it, what machines, how long. Phase 0 called this the highest-ROI page on the site. |
| 2.8 | **Dealer program terms** | `page.dealer` | Do not state discount levels that aren't agreed. Form works without them. |
| 2.9 | **Collection intro copy — review** | 33 collections | I wrote all 33 (`docs/ia.md` §4). They state no HP figures, tolerances, materials, lead times or warranty terms. Needs your technical read before it goes live. |

---

## 3. Photography — the biggest limiter on how good this can look

| # | Item | Where |
|---|---|---|
| 3.1 | **Hero media** | Homepage. Currently type-led over a CSS grid — a deliberate design, not a placeholder, but real footage would be better. |
| 3.2 | **Shop / process photos** (3) | Homepage made-in-house, About page |
| 3.3 | **Build photos** | Proof section, Build Gallery — both currently invisible because they have no entries |
| 3.4 | **Product photography — the real problem** | White-background shots read as bright rectangles punched into a dark page. Phase 0: 100 products have one photo. Priority is the ~30 in-house drivetrain hero SKUs. |
| 3.5 | **Collection images** | 33 collections, all currently text-only cards |

---

## 4. Decisions outstanding

| # | Decision | My recommendation |
|---|---|---|
| 4.1 | **What SALE SPECIAL is for** — 118 of 198 products | Curate `clearance` by hand to genuinely discontinued stock, keep it out of primary nav. Built that way; not migrated. |
| 4.2 | **Part number scheme** | Create one. A manufacturer without part numbers undercuts the positioning. I'll propose a scheme. |
| 4.3 | **Heading typeface** | Currently Horizon's Inter. Brief suggests a condensed technical sans. Specs already use system mono with tabular figures and a slashed zero. |
| 4.4 | **Algorithmic cross-sell** | I removed Horizon's product-recommendations because the plan says cross-sell by what the part requires. Consequence: no cross-sell until `custom.complete_the_build` is populated. Reversible if you'd rather keep it meanwhile. |
| 4.5 | **`SYPerformance` vs `SYP`** | One word, `SYPerformance`, everywhere. Phase 7. |
| 4.9 | **Collection filtering — Search & Discovery** | Shopify's free first-party app is what turns the Phase 3 metafields into real storefront filters (`filter.p.m.custom.platform`). Without it, filtering a collection to what fits can only happen client-side, on the products already on the page — it would not change counts or pagination, which reads as broken. I have NOT installed it: it is an app, and the plan says ask first. Recommend installing it. |
| 4.6 | **Reviews platform** | Not yet evaluated — Phase 6 item still open. Shopify's own reviews app was retired; the realistic comparison is Judge.me free tier vs nothing. Needs a cost and page-speed report before anything is installed. |
| 4.7 | **The Superformance name collision** | Business decision, not a code fix. Phase 7 mitigates with consistent one-word usage and `sameAs` schema. |
| 4.8 | ~~Eight in-house compare-at prices~~ | **DONE 2026-08-26.** Cleared on all 8 via `scripts/clear-compare-at.mjs`; 15 variants in total, because `b58-6-port-cnc-turbo-flanges` and `b58-downpipe-bmw-supra` carried them per variant. The downpipe's compare-at was *below* its price on all four variants, so it had been rendering a SALE badge on a price increase. One resold product was cleared with them — `honda-lsd-b16-fwd-k-awd-fwd-b-awd` had compare-at **equal** to price on all three variants, a SALE badge advertising no discount. That is a data defect, not a pricing decision. Genuine resold discounts (Supra carbon, Translab block-offs) are untouched. |

---

## 5. Verification owed — things built but not yet proven

| # | Item | Why it isn't verified |
|---|---|---|
| 5.1 | **Condense-on-scroll header** | The CDP Chrome window reports `visibilityState: hidden`, so `requestAnimationFrame` never fires. Sticky and the condensed CSS were verified by forcing the state. Needs a human scroll. |
| 5.2 | **Mobile drawer on a real device** | Verified by opening the dialog programmatically at desktop width only. |
| 5.3 | **Phase 6 page templates** | Previewed via `?view=` against the Contact page. Real verification needs the pages to exist — blocked on 1.1. |
| 5.4 | **Dealer form delivery** | Uses Shopify's native contact form. Must be tested end-to-end before launch. |
| 5.5 | **Footer email capture** | Same — needs to be confirmed writing to the right list. |
| 5.6 | **Canonical tags** | Products now sit in up to five collections. Horizon canonicalizes to `/products/`; verify rather than assume. Phase 7. |
| 5.7 | **Real device testing** | iOS and Android, not devtools. Phase 9. |
| 5.8 | **Purchase test** | Cannot be done on a development store — no real payment methods. Has to happen on SY's store against the draft theme before he publishes. |
| 5.9 | **Fitment selector on a real device** | Verified in-browser: verdict correct on both a matching and a non-matching product, bar renders under the header, header control shows the saved vehicle. Not yet tested on touch. |

---

## 6. Known limitations carried forward

| # | Item | Detail |
|---|---|---|
| 6.1 | **No backlink data** | No Search Console or Ahrefs access, so the Phase 2 redirect map redirects all 45 changed URLs rather than only the ones known to be linked. Redirecting an unlinked URL costs nothing; missing a linked one costs a 404. |
| 6.2 | **`/collections/frontpage` redirect may be rejected** | Shopify reserves the handle. The script reports it rather than aborting. |
| 6.3 | **Lighthouse baseline is measured, not official** | Phase 0 measured the same metrics directly in Chrome under Lighthouse's mobile conditions. Official scored reports need a local Lighthouse install (needs your approval) or a PageSpeed API key. |
| 6.4 | **Vendor field is actively wrong** | It says "Syperformance" on Walbro pumps, AEM sensors and Hondata ECUs. Guarded in the theme — resold parts with a house vendor show no brand rather than a wrong one — but the data fix is Phase 7. |
| 6.5 | **Evo X has 3 products, rockers have 3** | Both stay in the nav because they're real search terms and a flagship family. They will look thin next to a 66-product K-Series menu. The fix is more product, not more nav. |
| 6.6 | **Deployment** | SY uploads the theme zip himself; it lands in Draft. His live theme stays published throughout, so rollback is one click. |

---

## 9. The brand-ownership correction, the collection hub, and the accent recolour (2026-08-26)

### 9.1 Synchro Solutionz and Comp 1 Clutch — the correction that had only half landed

Spencer: **"Synchro Solutionz is its own brand, Comp 1 Clutch is its own brand. SYP is just a distributor."**

An earlier pass had already corrected the *fallback* list in `snippets/syp-in-house-handles.liquid` and the homepage spec label. Three places still claimed both brands as ours, and all three were live:

| Where | What it said | Now |
|---|---|---|
| `syp-billet` membership | 110 products — 75 SYPerformance, 33 Synchro Solutionz, 2 Comp 1 Clutch — under a description reading *"Every part on this page is manufactured by SYPerformance… not picked from someone else's catalog and rebadged"* | **75**, all confirmed in-house |
| `syp-drivetrain` membership | 42 products, of which **33 were Synchro Solutionz** — the SYP Drivetrain page was three-quarters someone else's brand | **7** |
| `custom.made_in_house` metafield | `true` on all 35 third-party products, so every one rendered a **"SYP design"** badge beside its own brand name | `false` |
| `syp-collection-header.liquid` | badged the `synchro-solutionz` and `comp-1-clutch` collection pages **SYPerformance** | no badge |
| Homepage hero | *"Halfshafts, carriers, bellhousings, **synchros** and single lobe rockers — our parts, our drawings, our name on them"* | synchros removed |
| Homepage drivetrain section | *"…and the **Synchro Solutionz internals** that go inside the box are the parts **we can build** better than anyone"* | rewritten; they are stocked alongside |
| `docs/ia.md` §4 | *"Synchro Solutionz is **our own** transmission internals line"*, *"Comp 1 Clutch is **our own** clutch line"*, *"the Synchro Solutionz line, **manufactured by us**"* | rewritten, with the rule restated at the top of §4 |

Also fixed: `syp-product-flags.liquid` was suppressing both vendors as known-bad house spellings, so a Synchro Solutionz part showed **no brand at all**. Their vendor is now the correct brand to print.

**The lesson, and it is the same shape as the manufacturing-claim one.** The metafield is read *first* and the handle list only as a fallback, so correcting the list fixed a code path that never ran. Nothing caught it because the correction was verified against the source, not against a rendered product page. Enforcement now lives in one script — `scripts/fix-house-collections.mjs` — which checks **both** halves against the same 75-handle list and is safe to re-run.

**Open, and it needs SY:** on the old live site all three clutch products carried the vendor `Competition Clutch`. Phase 7's `apply-brands.mjs` rewrote two of them to `Comp 1 Clutch` from the audit's *derived* brand field, splitting one vendor into two brand pages — `comp-1-clutch` (2 products) and `brand-competition-clutch` (1), the two thinnest pages on the site. The tags on those products carry **both** names. Question for SY: **is "Comp 1" a Competition Clutch product line or a separate brand?** Same brand • merge into one page of 3. Separate • keep both. Either way it is a one-line fix, and it should be settled before the product copy is written. (Competition Clutch itself is definitely stocked: 16 priced variants, $160–$895, K/B/D-series and Evo 8, present on the old live site under the same handle. Its zero inventory means nothing — **none** of the 198 products track inventory.)

### 9.1b Product copy — pipeline built, hero tier written

Source of truth is `data/product-copy.json`, applied with `scripts/apply-product-copy.mjs`.
Copy lives in git so it is reviewable and diffable; the store is downstream. A re-run is
idempotent, and editing a description in the Shopify admin will be overwritten by the next run.

**Written and live: all 13 of the hero tier**, 604–899 words each (whole-page count, including the
spec table, so it compares like-for-like with the ETS figures in `competitors.md` §3b):
`evo-7-8-9-vband-top-mount-turbo-kit`, `k-series-awd-billet-bellhousing`,
`b58-6-port-top-mount-turbo-manifold`, `k-series-top-mount-turbo-manifold`,
`evo-8-9-top-mount-turbo-manifold`, `honda-b-series-sfwd-intercooler`,
`k-series-hd-shift-selector-hammer`, `b-series-single-lobe-billet-rockers`,
`k-series-single-lobe-billet-rockers`, `syperformance-honda-k-series-billet-halfshaft-carrier`,
`syp-bseries-billet-halfshaft-carrier-assembly`, `k-series-billet-halfshaft`,
`b-series-hydro-500hp-billet-halfshaft`.

**Item 2.10 is part-done as a side effect.** `custom.chassis` was empty on all 198; it is now
populated on the 13, because a chassis list is part of writing the fitment properly rather than
a separate data task. `custom.hp_rating` is set where a real figure exists and only there — 500
on the B-series hydro halfshaft (it is in the product title), 1200 on the Race K-series
manifold, 1400 on the SFWD intercooler. The K-series billet halfshaft carries tags referencing
500, 700 and 1000 hp and has **no** rating written, because tags are search terms, not tested
numbers.

**Correction made to my own pilot.** `copy-pilot.md` Pilot 1 stated the B-series rockers are
"sold as a set of 8". That was my invention, not SY's — the existing description says no such
thing, and only the K-series product states a set of 8. It now reads *(SY to confirm)* on the
B-series. Exactly the failure Rule 6 exists to catch, made by the person writing the rule down.

**The finding that changed the job: the specs already existed.** `copy-audit.md` §7 blocker A
said no hard spec number was available anywhere. That was wrong. The old descriptions are
unformatted fragment lists, and buried in them are 304 stainless, 1.5" Schedule 40 runners,
1/2" 1018 CNC flanges, TIG welded and **back-purged**, 7075 billet, 70A urethane, 27 splines,
6061 1/8" plate end tanks, 18 x 12 x 4.5 and 18 x 12 x 6 cores, M8x1.25 bungs, Honda part
24411-PPP-010. Every spec table written so far is extracted, not invented. **Blocker A is
substantially closed for the in-house parts; blockers B (a named build) and C (a real photo)
are not.**

**Warranty terms are in there too** — *"1 year warranty to the original purchaser with
receipt"* appears on several products. **Spencer's call, same day: it does not become site-wide.**
It is a per-product term on the products that already state it, `page.warranty` gets no blanket
policy, and nothing is added to a product that did not already carry it.

**Power figures are claims, not guarantees** (Spencer, same day). The product badge now reads
**"Built for 1200 hp"** rather than *"Rated to 1200"*, and the product page carries the
distinction in words underneath: *"What the part is designed for, not a guarantee."* Every
figure in the copy was reworded to match — *built for*, never *rated to*. This amends Rule 6 of
`mkt-syp-trust-copy`, which had barred a power figure entirely without a dyno sheet or a named
car; a dyno sheet is now what makes the number **strong**, not what makes it **permitted**. The
K-series billet halfshaft still carries no figure, because its tags claim 500, 700 and 1000 hp
and those cannot all be right — a claim still has to be one number.

**Remaining:** ~62 in-house at 350–450, and 123 resold at 120–180. The pipeline makes each of those an entry in one JSON
file rather than a fresh piece of engineering.

**Second verification trap, and it costs a false negative:** the storefront serves a stale
page on the first request after a write, even with a unique cache-busting query string. Five of
the thirteen pages read as unchanged immediately after applying and were live on the very next
fetch a moment later. **Check twice before concluding a write failed** — the first seven looked
fine only because they had been written once already.

**API note worth keeping:** on 2025-07 `productUpdate` takes `ProductUpdateInput`, not
`ProductInput`. The mismatch throws a `variableMismatch` and fails the whole mutation. The
first apply run reported its word counts and then died on it — the counts printed, the writes
did not happen, and `tail` hid the stack trace. Verified against the rendered page afterward,
which is the only reason it was caught.

### 9.2 Collection hub

Built and live. Full write-up in `docs/catalogue-restructure.md` §3. Eleven collections get hub behaviour, not two, because the hierarchy is read from the navigation menu rather than assigned per template.

### 9.3 Accent recoloured amber → teal green

Spencer's call. `--syp-accent` `#f5a524` → **`#1ec8a5`**, hover `#3ddcb9`, press `#16a888`; `--syp-accent-ink` unchanged. The ramp was chosen to hold amber's *contrast*, not just swap its hue — the accent is used both as a solid button fill with dark ink on it and as link text on graphite, and those pull in opposite directions. Measured against `--syp-graphite-800`: base **8.50:1** (amber 8.88), hover 10.47 (10.52), press 6.03 (6.63).

Changed with it: `config/settings_data.json` primary-button background and border (Horizon's own buttons sit alongside ours), and the favicon — rebuilt teal via `node scripts/make-favicon.mjs` and copied to `theme/assets/syp-favicon.png`.

| # | Item | Owner | Note |
|---|---|---|---|
| 9.4 | **`--syp-ok` is now close to the accent** | to watch | The semantic "fits your vehicle" green is `#3fa06a` (hue 147) against an accent at hue 168. Distinguishable, but the fitment verdict is the one place a status green must not read as a button. Judge it on a real device in Phase 9 rather than pre-emptively moving it. |
| 9.5 | **Desktop header nav overflows into the search and cart** | to do | Visible at 1440px on every page: "Chassis & Suspension" renders *under* the search field and "Brands" collides with the cart icon. Nine top-level items is one or two too many since Brands was added, and it was never seen because that session verified against HTML. Not caused by this work, but it is the first thing a reviewer will notice. |

---

## 7. Phases not yet started

- **Phase 9 — pre-launch.** `docs/launch-checklist.md`, purchase test, real device testing, redirect verification, alt text, form delivery, analytics, rollback plan.

### 7a. Google Search Console — added to Phase 9, 2026-08-26 (Spencer)

Every SEO judgement on this project so far is established practice plus what is measurable on
the catalog. **None of it is validated against what actually ranks**, because there has been no
Search Console or Ahrefs access from Phase 0 onward (limitation 6.1). GSC closes that, and it is
free.

| # | Step | Owner | Note |
|---|---|---|---|
| 9a.1 | **Verify `got-moles.com`… no — `syperformance.net`** in Search Console | SY | Domain property via DNS TXT is best: it covers www/non-www and http/https in one. SY owns the domain, so this is his to do, and it is the only step nobody else can do for him. |
| 9a.2 | **Pull 16 months of query data before launch** | to do | This is the reason to do it *now* rather than after. GSC only retains 16 months, and the redirect map (limitation 6.1) currently redirects all 45 changed URLs blind, because there is no data on which old URLs carry traffic or links. One export turns that guess into a fact — and tells us which of the 45 actually matter. |
| 9a.3 | **Record the pre-launch baseline** | to do | Impressions, clicks, average position by page and by query, exported and committed. Without a baseline, nothing after launch can be attributed — a rebuild that changes 45 URLs, adds 12 collections and rewrites 198 descriptions is exactly the change you want a before-picture of. |
| 9a.4 | **Check which queries the 198 products already rank for** | to do | Feeds the copy directly. §7 of `seo.md` reasons about the target phrases from product tags; GSC would replace that inference with measurement, and it may well disagree. |
| 9a.5 | **Submit the new sitemap and watch coverage** | to do | Pairs with 7.6. After launch, watch for the 34 new collections indexing and for any spike in 404s that the redirect map missed. |
| 9a.6 | **Connect it to the live store, not the build store** | to do | The build store is password-protected and `noindex`. GSC cannot see it and never will, so this lands on SY's real store at handover, in the runbook. |

**Do 9a.1 and 9a.2 before launch, not after.** Everything else can follow. The query export is
the piece with an expiry date on it.

Phases 3, 7 and 8 are done. Phase 7's open items are in `docs/seo.md` §6; Phase 8's are in §8 below.

---

## 8. Phase 8 — what it left open

Everything in this section is either a decision for Spencer or a verification that can only happen on a published theme. Nothing here blocks Phase 9.

| # | Item | Owner | Note |
|---|---|---|---|
| 8.1 | ~~Favicon is missing~~ | — | **DONE.** The theme now ships its own mark at `theme/assets/syp-favicon.png` and `layout/theme.liquid` emits `rel="icon"` and `rel="apple-touch-icon"`, falling back to it whenever `settings.favicon` is unset. The `/favicon.ico` 404 is gone from every template. `settings.favicon` still wins if SY uploads one, so this is an override, not a lock-in. |
| 8.2 | **Official Lighthouse run** | to do, Phase 9 | The 96–98 figures are computed from measured metrics using Lighthouse's own curves, not produced by running it. Lighthouse needs a local install (6.3) and the PageSpeed API can't reach a password-protected store. Confirm once the theme is published on SY's store. |
| 8.3 | **INP is not measured** | to do, Phase 9 | TBT is a load-time proxy for it, not a substitute. INP needs real interaction on a real device — folds into 5.7. |
| 8.4 | **How much of Horizon to keep** | Spencer | `compiled_assets/styles.css` is 49 KB of render-blocking CSS on every page and it sets FCP. Blocking it outright takes mobile FCP from ~1,900 ms to ~1,200 ms — but only 19–23% of it is unreachable (`node scripts/audit-css-bundle.mjs`). Getting the rest means deleting Horizon sections and blocks, which costs theme-editor options and makes future Horizon updates messier, for maybe 80–100 ms. My recommendation: don't. We're at 96–98 and the trade is bad. |
| 8.5 | **Re-run the audits after any template change** | to do, ongoing | `audit-scripts.mjs` decides which module scripts are safe to omit by looking at what each template actually renders. Add a Horizon block to a template and the answer changes — an unregistered custom element fails silently rather than throwing. `check-templates.mjs` catches it. |
| 8.6 | **The logo — still open, and bigger than the favicon** | Spencer / SY | I built a favicon mark (chamfered amber tile, "SY" in Inter 800, `--syp-accent` on `--syp-accent-ink`) because the tab icon needed *something*. **It is a competent placeholder, not a brand identity** — I designed it, not a designer, and SYPerformance has never had a logo: the live site's header is text too. The header still renders a text wordmark, because a 512 px tab icon is not a header logo. If SY wants a real mark, `brand/favicon-512.png` is the thing to hand a designer as a starting point or to throw away. Rebuild any variant with `node scripts/make-favicon.mjs` (`--compare` shows the chamfer options that were weighed). |

**Fixed in passing, worth knowing about:** `<header-actions>` in the SYP header had been sitting in the DOM unupgraded since Phase 1 — the cart count was never announced to screen readers and the cart button's `aria-expanded` never changed, because `header-actions.js` was only ever loaded by Horizon's own header snippet, which this theme doesn't render. `docs/performance.md` §2.7.
