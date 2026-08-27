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
| 7.10 | ~~Eight in-house compare-at prices~~ | — | **DONE 2026-08-26.** `scripts/clear-compare-at.mjs`, 15 variants. |
| 7.11 | **SEO title tag is unset on all 198 products** | to do | Measured 2026-08-26: `seo.title` and `seo.description` are empty on **every** product, so Shopify falls back to the product title. Effective title-tag length is a median of **34 characters** against a ~60-character budget — roughly 26 characters of the highest-leverage field on the page, unused, 198 times. The platform qualifier that buyers actually search (`B16`, `GSR`, `K20`, `Evo 8/9`) is what belongs in the gap. Do this with 7.2, not after it. |
| 7.12 | **`data/title-review.csv` carries stale ownership** | Spencer | 35 rows still read `origin=IN-HOUSE` for Synchro Solutionz and Comp 1 Clutch. The **proposed titles are safe** — none stamps SYPerformance onto a third-party brand, because the prefix is drawn from the `brand` column, which is right. Only the `origin` label is wrong. Worth knowing before approving 198 rows. |
| 7.13 | **Product copy length is not the SEO lever; thin pages are** | — | Measured: median **20 words**, 112 of 198 under 25, 23 with no copy at all. Only 7 products share an identical description, so internal duplication is not the problem — thinness is. See §7. |


---

## 7. Description length and SEO — answered 2026-08-26

Spencer asked what the optimal product description length is for SEO. The short version:
**there is no optimal length, and word count is not a ranking factor.** Google has said so
consistently for years. The studies showing long content ranks better are confounded — longer
pages tend to cover more query variations and attract more links, and those are the causes.

Length is a **proxy** for three things that do matter, and each has its own answer:

**1. Query coverage.** A page ranks when it answers what was searched. On a part like the
B-series rockers the real queries are `b series single lobe rockers`, `vtec killer rockers`,
`B16 rockers`, `GSR rockers` — one page, several phrasings, plus the question behind them
("why remove VTEC"). Covering that honestly lands around 350–450 words. Not because 400 is a
magic number, but because that is what the answer costs.

**2. Thinness, which is a site-level signal and not only a page-level one.** 198 pages at a
median of 20 words is the actual SEO problem on this catalog. Below roughly 50 words a product
page carries no ranking signal beyond its title. **That 50 is a working heuristic, not a
published Google threshold** — treat it as the floor below which a page is definitely thin,
not as a line above which it is definitely fine.

**3. Passage retrieval, which is where the real upside is.** AI answer engines and Google's own
passage ranking retrieve a **chunk**, not a page. The unit that gets quoted is a self-contained
120–200 word block that answers one question without needing the rest of the page. That is
exactly what `custom.why_this_part` is. **This is why the block structure beats one long blob at
the same word count** — five retrievable answers instead of one long document, each targeting a
different phrasing.

### So the tiering in `competitors.md` §3b stands

Nothing about SEO argues for changing it. 600–900 on ~12 hero parts, 350–450 on the rest of the
in-house 75, 120–180 on the 123 resold. The resold tier clears the thin floor comfortably
without padding a page about a part SYPerformance did not design — and padding actively hurts,
because it dilutes the primary phrase.

### The lengths that DO have hard optimal numbers are all unset

These matter more than body length and are cheaper to fix.

| Field | Optimal | Current |
|---|---|---|
| **Title tag** | 50–60 characters (~575px before truncation) | **unset on all 198**; falls back to the product title, median **34 chars** |
| **Meta description** | 150–160 characters | **unset on all 198**. Does not rank; it sets click-through from the result |
| **H1** | the product title | 21 titles are ALL-CAPS (7.2) |

**The title tag is the highest-leverage SEO field on a product page and 26 characters of it are
empty, 198 times over.** That gap is where the platform qualifier goes — the thing buyers
actually type.

### Honest limitation

There is no Search Console or Ahrefs access on this project (checklist 6.1), so none of the
above is validated against what actually ranks for these terms today. It is established
practice plus what is measurable on the catalog, not a measurement of SYPerformance's own
search performance. Getting GSC connected before launch would change that, and it is worth
doing in Phase 9.
