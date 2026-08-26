# Build environment

The redesign is built on a separate Shopify development store and handed over as a
theme zip. **SY's live store is never accessed.**

## Shopify Partner organization

| | |
|---|---|
| Organization | Rainier Power Wash LLC |
| Partner org ID | 5126610 |
| Account | spencer@got-moles.com |
| Created | 2026-08-18 |

Outstanding: **email address still needs verifying** (Partner dashboard → Get started guide).

## Development store

| | |
|---|---|
| Name | SYPerformance Build |
| Domain | `syperformance-build.myshopify.com` |
| Admin | https://admin.shopify.com/store/syperformance-build |
| Type | Dev (testing/staging) — *not* client-transfer |
| Simulated plan | Basic |
| Test data | none — deliberately not generated |
| Cost | free, no time limit |

**Why Basic:** the build must work on whatever plan SY actually runs. Building against
Basic guarantees it works on every tier above it. Nothing in the plan needs Grow, Advanced
or Plus — metafields, metaobjects and theme blocks are available on all plans.

**Why Dev and not Client transfer:** we are handing over a theme file, not a store. SY keeps
his existing store, orders and history.

## Catalog replica

The full live catalog was rebuilt from the Phase 0 public capture — no admin access needed.

| | |
|---|---|
| Products | 198 |
| Variants | 931 |
| Images | 494 (fetched from SY's live CDN by URL) |
| Import file | `../data/shopify-import-products.csv` (1,016 rows) |
| Generator | `../scripts/build-import-csv.mjs` |
| Imported | 2026-08-18 |

Verified after import: 198 products across 4 admin pages; spot-check on
`K Series Single Lobe Billet Rockers` confirmed 6 images, $795 price, $835 compare-at,
and the full description intact.

**The replica deliberately mirrors the live store's data problems** — wrong vendors,
ALL-CAPS titles, missing SKUs, empty product types. The theme has to be built against real
conditions. Data corrections are a deliberate Phase 7 step delivered as a CSV for approval.

Not replicated (yet): collections, navigation, pages, blog. Those are Phase 2 and Phase 6
work built fresh rather than copied.

## Where the build lives

| | |
|---|---|
| **Store** | `syperformance-build.myshopify.com`, storefront password in `SHOPIFY_BUILD_STORE_PASSWORD` |
| **Theme** | `157153820829` — "SYPerformance Rebuild", **published** on the build store |
| **Review link** | `https://syperformance-build.myshopify.com/` — nothing else needed |
| **Rollback** | stock `Horizon` (`156984213661`) sits unpublished on the store, one click away |

Published on 2026-08-26, replacing development theme `157001318557`. Two reasons, both
learned the hard way:

- **Development themes are temporary.** Shopify deletes them after roughly a week of
  inactivity, and the entire Phases 1-8 build was sitting on one.
- **An unpublished theme needs a `?preview_theme_id=` link and a cookie to match**, and the
  Shopify preview bar puts an "Exit preview" button next to it. One click sends the reviewer
  to whatever theme is published — which was stock Horizon, so the site appeared to revert to
  an untouched Shopify demo. It cost a round trip to diagnose. Publishing on the build store
  removes the failure mode entirely; SY's real store is untouched either way.

Point any script at a different theme with `SYP_THEME_ID=<id>`, which is how a candidate
theme gets verified before it replaces the published one.

## Handover model

1. Build here on the dev store.
2. Export the finished theme as a zip.
3. SY uploads it in his admin → Themes → Add theme → Upload zip. It lands in **Draft**.
4. He previews against his own live products, publishes when satisfied.
5. Store-side data (menus, metafield definitions, collections, pages, redirects) is applied
   from a runbook — see `handover.md` when it is written in Phase 9.

His live theme stays published throughout and remains in the theme list afterwards, so
rollback is one click.

**Known limitation:** real payment methods (Shop Pay, Apple Pay, PayPal, Venmo, cards)
cannot be tested on a development store. The Phase 9 purchase test happens on SY's store,
against the draft theme, before he publishes.
