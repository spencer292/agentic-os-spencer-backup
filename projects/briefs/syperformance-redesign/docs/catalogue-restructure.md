# Catalogue restructure — plan

**Built from the live catalogue, not from opinion.** `scripts/build-taxonomy.mjs` classifies all 198 products into system + part type (100% matched, no manual assignments), and `scripts/list-collections.mjs` reads live product counts off the store. Numbers below are measured.

---

## 1. The problem, quantified

Nine of the 35 live collections hold more than 30 products — the point at which a grid stops being browsable:

| Collection | Products |
|---|---|
| `syp-billet` | **110** |
| `honda` | **104** |
| `honda-k-series` | **66** |
| `universal-fabrication` | **56** |
| `syp-drivetrain` | **42** |
| `honda-b-d-h-series` | **38** |
| `transmission-internals` | **33** |
| `synchro-solutionz` | **33** |
| `syp-turbo-manifolds` | **31** |

For scale: SpeedFactory's equivalent leaf page (`K-Series Synchrotech Components`) holds about 10.

**These are two different problems wearing the same symptom.**

**Hubs.** `syp-billet` (110) and `honda` (104) already *have* children — `syp-drivetrain`, `syp-cooling`, `honda-k-series`, `honda-b-d-h-series`. They are not missing structure; they are rendering every product instead of showing the children. That is a template fix, not a taxonomy fix. See §3.

**Genuinely flat leaves.** `synchro-solutionz` (33), `syp-turbo-manifolds` (31) and the 35 drivetrain products inside `honda-k-series` have no children at all. Those need new collections. See §2.

---

## 2. New collections — twelve, all landing between 4 and 16 products

Every one is a real search term and a real buying decision, not a filing convenience.

| # | Handle | Title | Products | Splits |
|---|---|---|---|---|
| 1 | `k-series-synchros` | K-Series Synchros & Rebuild Kits | **16** | synchro-solutionz, transmission-internals |
| 2 | `b-h-series-synchros` | B/H-Series Synchros & Rebuild Kits | **11** | synchro-solutionz, transmission-internals |
| 3 | `k-series-transmission-hardware` | K-Series Bearings, Seals & Gears | **8** | honda-k-series drivetrain |
| 4 | `k-series-awd-driveline` | K-Series AWD, Halfshafts & Transfer Case | **6** | honda-k-series drivetrain |
| 5 | `honda-k-turbo-manifolds` | Honda K-Series Turbo Manifolds | **8** | syp-turbo-manifolds, turbo-manifolds |
| 6 | `evo-turbo-manifolds` | Mitsubishi Evo Turbo Manifolds | **7** | syp-turbo-manifolds, turbo-manifolds |
| 7 | `honda-b-d-h-turbo-manifolds` | Honda B/D/H Turbo Manifolds | **4** | syp-turbo-manifolds, turbo-manifolds |
| 8 | `honda-k-series-engine` | Honda K-Series Engine & Valvetrain | **9** | honda-k-series |
| 9 | `honda-k-series-electronics` | Honda K-Series Harnesses & Electronics | **7** | honda-k-series |
| 10 | `honda-k-series-cooling` | Honda K-Series Cooling | **6** | honda-k-series |
| 11 | `honda-b-d-h-forced-induction` | Honda B/D/H Forced Induction | **6** | honda-b-d-h-series |
| 12 | `b-d-h-series-driveline` | B/D/H Halfshafts, Carriers & AWD | **6** | honda-b-d-h-series drivetrain |

**Effect:** `synchro-solutionz` 33 → two pages of 16 and 11. `syp-turbo-manifolds` 31 → three platform pages plus the parent. `honda-k-series` 66 → five system children. No new page holds more than 16.

**Why platform-first.** SpeedFactory files system-first (`Engine Components → Pistons → Honda → K Series`). We go the other way because a buyer here knows their engine before they know their errand, and because the search demand already sitting in these products' tags is `B16 rockers` and `GSR rockers`, never `rockers Honda`.

**Nothing is deleted and no handle changes.** Every existing collection stays exactly where it is, so the Phase 2 redirect map holds and the live Google Ads and Merchant Center listings (audit §7) are untouched. This is purely additive.

---

## 3. The hub template — BUILT 2026-08-26

`sections/syp-collection-children.liquid` + `snippets/syp-collection-card.liquid`, wired into `templates/collection.json` between the header and the grid.

**It is a rule, not a template assignment.** The section reads the parent/child hierarchy out of the **navigation menu** and renders nothing at all when a collection has no children — so every collection gets hub behaviour the moment it earns it, and a new sub-collection needs no data change. That matters more than it first looked: the menu has **eleven** parents, not the two named above — `syp-billet`, `syp-drivetrain`, `honda`, `honda-k-series`, `honda-b-d-h-series`, `mitsubishi-evo-parts`, `mitsubishi-evo-7-8-9`, `forced-induction`, `universal-fabrication`, `engine`, `suspension`.

**Why the menu and not a metafield or a handle convention:** the menu is where the hierarchy is already maintained by hand, it is what the hover menu renders, and it is what the store owner edits in the admin. A second copy of the same tree is a second thing to keep in sync, and it would drift.

**The grid still renders below the cards.** Showing only products *not* in a child was the original proposal; it was dropped because filtering, sorting and pagination all act on the grid, and a hub is also a legitimate "show me everything" page. The cards come first, so the first screen is a handful of routes rather than a hundred thumbnails, and a line under them points at the full grid.

Verified on rendered pages: `syp-billet` 5 cards / 75 parts, `honda-k-series` 7 cards / 66 parts, `syp-cooling` (a leaf) renders no hub. Self-referencing links are skipped — the nav carries "Chassis & Suspension" pointing at `/collections/suspension` with itself as its own first child.

**Small gap left open:** 5 of `syp-billet`'s 75 products sit in none of its five children — `turbo-head-flanges`, `turbo-flanges-t3-t4-vband`, `turbo-vband-inlet-flanges`, `evo-7-8-9-vband-top-mount-turbo-kit` and the V2 billet throttle body. They are reachable through the grid and through `clamps-v-band-flanges`, so nothing is lost; three of them arguably belong in `syp-fabrication-hardware`. Taxonomy call, not a bug.

---

## 4. What ships with each new collection

Each needs intro copy in the same register as the existing 33 (`docs/ia.md` §4): what the category is, what decision the buyer is making, no HP figures, no tolerances, no lead times. Roughly 60–90 words each, drafted alongside the build script.

**Order of work, confirmed with Spencer:** restructure first, then product copy — so each of the 198 descriptions is written knowing which page it sits on and which phrase that page already owns.
