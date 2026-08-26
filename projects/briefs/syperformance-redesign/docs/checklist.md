# Finalization checklist

Everything deferred, blocked, or left for a decision, in one place. Kept current as phases land.

**Last updated:** 2026-08-26, end of Phase 3
**Phases complete:** 0 (audit) · 1 (foundation) · 2 (IA — **executed**) · 3 (fitment) · 4 (product page) · 5 (homepage) · 6 (trust pages)
**Not started:** 7 (SEO) · 8 (performance) · 9 (pre-launch)

---

## 1. Blocking — nothing downstream moves without these

| # | Item | Who | Blocks | Notes |
|---|---|---|---|---|
| 1.1 | ~~Shopify Admin API token~~ | — | — | **DONE 2026-08-26.** Verified live: connected to "SYPerformance Build", 198 products. Phase 2 executed, metafield definitions created, values written. |
| 1.2 | **The 51 unclassified products** — in-house or resold? | Spencer | Phase 4 correctness | `data/unknowns-review.csv`, `ownerDecision` column. All 51 currently render as **resold** so nothing gets an unearned MADE IN-HOUSE badge. |

---

## 2. Content Spencer has to supply — I will not invent these

| # | Item | Where it lands | Why I won't guess |
|---|---|---|---|
| 2.1 | **Warranty terms** | `page.warranty`, plus every in-house product page | It's a promise the business has to honor. Section ships blank and warns in the theme editor. |
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
| 4.8 | **Eight in-house compare-at prices** | Remove them. Ten-minute job, lands in Phase 7. |

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

## 7. Phases not yet started

- **Phase 3 — fitment selector.** Metafield definitions, the platform → chassis → system selector, collection filtering, and the fits/doesn't-fit state on product pages. The header already carries the entry point. Data half blocked on 1.1.
- **Phase 7 — SEO.** Title standardization, JSON-LD, the `brand` fix, unique meta titles and descriptions, canonicals, the article templates, internal linking, the redirect map execution.
- **Phase 8 — performance.** Lazy-loading audit, `srcset` sizing, deferred JS, app script audit, Lighthouse mobile 85+ against the Phase 0 baseline.
- **Phase 9 — pre-launch.** `docs/launch-checklist.md`, purchase test, real device testing, redirect verification, alt text, form delivery, analytics, rollback plan.
