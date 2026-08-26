# Phase 7 — SEO

**Date:** 2026-08-26
**Status:** The automatable half is done and live. Three items need Spencer; two need a decision.

---

## 1. The vendor fix — done

Phase 0 called this *"arguably the highest-leverage single SEO change on the site and it costs nothing but a CSV."* It was not an inconsistency, it was wrong data: the `vendor` field was being used as the **store's** name rather than the **brand's**.

**191 products updated.** The spread:

| Change | Count |
|---|---|
| `Syperformance` → `SYPerformance` | 110 |
| `SYNCHRO SOLUTIONZ` / `synchro solutions` → `Synchro Solutionz` | 32 |
| `Syperformance` → the real manufacturer (AEM, Walbro, Hondata, Mickey Thompson, Vibrant, Turbosmart, Blox, DeatschWerks, Injector Dynamics) | 15 |
| casing normalised (`PULSAR`→`Pulsar`, `FIC`→`Fuel Injector Clinic`, `TRANSLAB`→`Translab`, `BF GEARS USA`→`BF Gears USA`) | 8 |
| Mislabelled house parts (`Competition Clutch`→`Comp 1 Clutch`, `BF GEARS USA`→`Synchro Solutionz`) | 3 |

**Why this fixed the schema too.** Horizon emits product structured data through Shopify's `structured_data` filter, which reads `brand` directly from `vendor`. Every resold product was telling Google that SYPerformance manufactures it. **Verified live:** the AEM fuel pump now reports `"brand": {"@type": "Brand", "name": "AEM"}` where it previously said SYPerformance. No template change was needed.

**Three reassignments were checked by hand** before applying, because they claimed SY manufactures something labelled as another brand:

- `Comp 1 Triple Disc Clutch` and `Comp 1 Twin Disc Clutch`, vendor `Competition Clutch` → **Comp 1 Clutch**. The title names the house line; the genuinely resold `Competition Clutch Kits-Single Disk` correctly stayed put.
- `K Series Synchro Solutionz Synchro Springs Set`, vendor `BF GEARS USA` → **Synchro Solutionz**.

In each case the audit derived brand from the **title**, which is a more trustworthy signal than a vendor field the audit had already proved unreliable.

**The 52 unconfirmed products got spelling normalisation only.** No manufacturer is asserted for a part nobody has confirmed — that is the exact mistake this work undoes. They are in `data/brand-review.csv`.

---

## 2. Structured data — done

| Schema | Where | Source |
|---|---|---|
| **Product** | every product page | Horizon's `structured_data` filter — now correct because `vendor` is |
| **Organization** | every page | `snippets/syp-schema.liquid` |
| **BreadcrumbList** | collection and product pages | same |

**Verified:** both blocks parse as valid JSON on a live collection page.

**Organization is the name-collision mitigation.** Phase 0 flagged that "SY Performance" collides with Superformance (Shelby Cobra replicas) and an unrelated Burbank personal training studio, and that `syperformance.com` is a documented typo of `superformance.com`. Schema cannot solve that — it is a business problem. What it can do is give Google an entity to attach the brand to: `name: SYPerformance`, `alternateName: SY Performance`, and `sameAs` pointing at the real social profiles.

**Needs Spencer:** the social URLs. Theme editor → Theme settings → **SYPerformance SEO**. `sameAs` is empty until they are filled, and an empty `sameAs` is most of the point of the block.

Product schema is deliberately **not** duplicated in our snippet — a second Product block would compete with Horizon's.

---

## 3. Collection meta titles and descriptions — done

Phase 0: *"All 57 collections have an empty description. Not one has a word of intro copy... no meta description at all... a 13-character `<title>` reading literally 'Syperformance'."*

All 34 collections now carry a meta title and a meta description, generated from the intro copy already written and reviewed in `docs/ia.md` §4 — so the description is the same words a human approved, not machine filler.

**Verified live:** `/collections/transmission-internals` returns
`Transmission Internals – SYPerformance Build` and a 155-character description.

One bug found and fixed on the way: the first pass appended `| SYPerformance` to the meta title, producing *"Transmission Internals | SYPerformance – SYPerformance Build"*. Shopify appends the shop name itself.

---

## 4. Product titles — proposed, awaiting review

`data/title-review.csv` — 198 rows, **124 proposed changes**, nothing applied.

| | |
|---|---|
| Were ALL CAPS | 21 |
| Gained the `SYPerformance` brand prefix | 72 |
| Already fine | 74 |

The plan is explicit that this goes to Spencer first, and titles are the most visible text on the site — a bad automated rewrite is worse than a messy human one. The CSV has `currentTitle`, `proposedTitle`, `reason` and an empty `approvedTitle` column. Edit that column and hand it back.

**What the proposals do:** fix ALL CAPS, normalise the four house-brand spellings to one, correct known typos (`Sheild`→`Shield`, `Titanuim`→`Titanium`, `Vband`→`V-Band`, `Bseries`→`B Series`), and prefix in-house parts with `SYPerformance`.

**What they deliberately do not do:** add the trailing `— [key spec/fitment]` the plan's target shape calls for. That needs knowledge of the part, not string rules.

Three rounds of casing bugs were caught by reading the output rather than trusting it: `Awd`→`AWD`, `Weld on`→`Weld On` (particles are not articles), and `B/d/f/h-series`→`B/D/F/H-Series`.

---

## 5. Redirects — done in Phase 2

45 URL redirects live, zero failures. See `docs/ia.md` §6. The `robots.txt`-blocked tag-filtered nav link (`/collections/shift-selector/Selector-rod+shift-selector`) is gone from the menu rather than redirected — Google was never allowed to crawl it.

---

## 6. Still open

| # | Item | Owner | Note |
|---|---|---|---|
| 7.1 | **Social profile URLs** | Spencer | Theme settings → SYPerformance SEO. `sameAs` is empty without them. |
| 7.2 | **Approve the title CSV** | Spencer | `data/title-review.csv`, `approvedTitle` column. |
| 7.3 | **The 52 unconfirmed brands** | Spencer | `data/brand-review.csv`. Same list as checklist 1.2. |
| 7.4 | **Product meta descriptions** | blocked | Needs `why_this_part` written first — the description should be drawn from real copy, the way collection descriptions were. |
| 7.5 | **Canonical tag verification** | to do | Products now sit in up to five collections. Horizon canonicalises to `/products/`; verify rather than assume. |
| 7.6 | **`robots.txt` / `sitemap.xml` check** | to do | Confirm nothing important is blocked and the 34 new collections are listed. |
| 7.7 | **Article templates + the 8 content targets** | to do | Blog has zero articles. `syp-articles` renders nothing until one exists. |
| 7.8 | **Internal linking** | to do | Every article links to relevant products, every product to relevant articles. Needs articles first. |
| 7.9 | **The Superformance collision** | Spencer | Business decision. Schema mitigates; it does not solve. |
| 7.10 | **Eight in-house compare-at prices** | Spencer | Ten-minute job, still outstanding from Phase 0 §5. |
