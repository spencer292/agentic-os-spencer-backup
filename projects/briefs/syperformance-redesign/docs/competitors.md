# Competitors, catalogue structure, and the product-copy spec

**Researched 2026-08-26.** Three competitors named by Spencer: SpeedFactory Racing, JackSpania Racing, Ichiban Parts. What they actually do, where the opening is, and what SYPerformance should do about it.

---

## 1. What the competition actually looks like

| | SpeedFactory Racing | JackSpania Racing | Ichiban Parts |
|---|---|---|---|
| **Site** | speedfactoryracing.net | jackspaniaracing.shop | ichibanparts.com |
| **What they are** | Honda specialist, **makes own parts** + resells | Honda/Acura, mostly resells | Canadian reseller, 300+ brands |
| **Menu depth** | **4 levels** | 3 levels | 3 levels |
| **Primary axis** | System → sub-system → platform → engine family | System, plus a separate "Shop by Vehicle" | Brand, Category, and Make → Model |
| **Fitment tool** | **None** | None | **Year / Make / Model selector** |
| **Own-brand product copy** | **208 words**, no spec table | not assessed | n/a — reseller |
| **Resold product copy** | **25 words** | short | supplier boilerplate |
| **Spec table** | No | No | No |
| **Structured fitment** | No — prose line | No | Via the YMM selector |
| **Reviews on product pages** | No | Testimonials on home only | No |

### The three findings that matter

**1. SpeedFactory is the real competitor, and their catalogue is deeper than ours.** They're the closest analogue — Honda specialists who manufacture their own parts alongside a resold catalogue. Their menu goes four levels: `Engine Components → Engine Block Parts → Pistons → Honda/Acura Pistons → B Series / K Series`. Ours is **flat**: 33 collections, all top level, and `syp-billet` is a single page holding 110 products. That is the thing Spencer is reacting to, and he's right.

**2. Nobody in this set writes real product copy.** SpeedFactory's best page — one of their *own* flagship products, a $200 billet fuel rail — is 208 words with no spec table, no structured fitment, no part number beyond a SKU, and no reviews. Their resold parts are worse: a $345 Insane Shafts intermediate shaft gets **25 words**, quoted in full:

> "K-series mt intermediate shafts
> Insane shafts 2002-2005 honda civic, 2002-2006 crv, 2003-2010 element, 2002-2006 acura rsx-s 500"

That is the bar. A 400-word page with a spec table, structured fitment and a genuine explanation of the failure mode isn't incrementally better than that — it's a different category of page, and it is exactly what both Google and AI answer engines reward.

**3. Only Ichiban has a fitment selector, and they're a reseller.** SpeedFactory, the manufacturer, makes you navigate manually. SYPerformance already has a fitment selector (Phase 3) and a manufacturer story. That combination doesn't currently exist in this set.

### Where SYPerformance already wins, and where it doesn't

**Already ahead:** the manufacturer position stated plainly, the fitment selector, collection intro copy that actually explains the category (all three competitors ship bare grids), and site performance — mobile 96–98 against a rebuilt-from-scratch theme.

**Behind:** catalogue depth. One flat level against SpeedFactory's four.

**Level with everyone, which is to say bad:** product copy. The B-series rockers currently read, in full: *"Cnc billet rockers Anodized green Lightweight and strong B series vtec."* Nine words. SpeedFactory's own-brand page is 208. Everyone in this market is bad at this, which is precisely why it's the cheapest place to win.

---

## 2. Proposed catalogue structure

Three browsable levels, cross-cut by the fitment selector. The rule: **no page should ask a buyer to scan more than about 30 products.**

```
Level 1  PLATFORM              Level 2  SYSTEM            Level 3  PART TYPE
─────────────────────────      ──────────────────────     ─────────────────────────
Honda K-Series          →      Drivetrain          →      Halfshafts
Honda B/D/H-Series             Forced Induction           Halfshaft carriers
Mitsubishi Evo 7/8/9           Cooling                    Bellhousings
Mitsubishi Evo X               Valvetrain                 Transfer case block-offs
BMW / Toyota B58               Fabrication                Shift selectors
                               Engine internals           Synchros & rebuild kits
                                                          Gearsets & final drives
```

So `Honda K-Series → Drivetrain → Halfshafts` lands on `/collections/honda-k-series-halfshafts` — a page with a handful of directly comparable parts, its own intro copy, and its own reason to rank.

**`SYP Billet — Our Own Parts` stays**, but stops being a 110-product wall. It becomes the manufacturer's index — the six system groups as cards, each opening into its own page. It is the most important page on the site for the positioning and it currently reads as a dump.

**Why platform-first rather than system-first** (the opposite of SpeedFactory): a buyer here knows their engine before they know what they want. "K-series" is the identity, "halfshafts" is the errand. It also matches how people search — the tags already on these products are `B16 rockers`, `GSR rockers`, `Civic si rockers`, not `rockers Honda`.

**Cost of this:** ~40 new collections on top of the 33 that exist, each needing intro copy. Mechanically it's the Phase 2 script again with a deeper map. The intro copy is the real work.

---

## 3. Product copy — the spec

**Target: 300–500 words per product, split across the metafields Phase 3 and 4 already created**, not one undifferentiated blob. Structure is what makes it skimmable and what makes it parse for AI answer engines.

| Block | Field | Words | What goes in it |
|---|---|---|---|
| Lead | `body_html` | 60–90 | What the part is, what it fits, what it replaces. The answer to "am I in the right place?" |
| **Why this part exists** | `custom.why_this_part` | 120–200 | The failure mode. What the stock part does under load, why it does it, what that costs the owner. **The most important block on the site.** |
| Before you buy | `custom.before_you_buy` | 60–100 | What else is needed, what has to be modified, what it does *not* fit |
| Spec table | `custom.specs` | table | Material, dimensions, hardware, torque — **blank until SY supplies real figures** |
| Fitment | `custom.chassis` / `platform` | list | Chassis codes — **blank on all 198, needs SY** |

### The claims rule for this work

I can write, truthfully, from what is knowable: what the part is, what it replaces, the platform, the well-established failure mode of the stock component, and what the choice implies for the rest of the build. That is genuinely 300–500 words per part and it is all defensible.

I cannot write: materials, tolerances, weights, horsepower ratings, heat-treat processes, test data, warranty terms or lead times. Those are SY's to supply, and inventing them is the same mistake as the manufacturing claims — an inherited-sounding specific that nobody can back. **Every one of those lands in a spec table that ships blank and is flagged, not guessed.**

Practical effect: a 400-word page where the reasoning is real and the numbers are pending beats a 200-word page with invented numbers, and it beats every competitor page in this document today.

### SEO / GEO approach

- **The keyword research is already done and sitting in the product tags.** `B series vtec killer rockers`, `GSR rockers`, `B16 rockers`, `Civic si rockers`, `Vtec rockers` — those are real search phrases, already attached to the right products. The copy uses the language that's there rather than inventing a keyword list.
- One primary phrase per product, in the H1, the lead sentence and the meta description; the variants used naturally in the body where they fit.
- The **"why this part exists"** block is written as an answer to a question a person actually asks ("why do K-series halfshafts break?"), because that is the unit AI answer engines quote. This is the single biggest GEO lever on the site.
- Collection pages carry the category-level phrase; product pages carry the part-level one. No two pages target the same phrase.
- Unblocks `docs/seo.md` §6 item 7.4 — product meta descriptions have been waiting on real copy to draw from.

---

## 3b. Product copy length — MEASURED, 2026-08-26

§1 and §3 above were written from three hand-read pages. Spencer asked for the real numbers
before the 198 get written. SpeedFactory and JackSpania are both Shopify, so `/products.json`
returns every product's description and the **whole catalogue** could be counted rather than
sampled. Ichiban is WooCommerce and was sampled evenly across its product sitemap.

Rerun with `node scripts/measure-competitor-copy.mjs --json`.

| | Products counted | Median | p90 | Max |
|---|---:|---:|---:|---:|
| SpeedFactory — whole catalogue | 5,000 | **114** | 254 | 1,082 |
| SpeedFactory — own brand | 26 | **121** | 237 | **318** |
| JackSpania — whole catalogue | 1,505 | **96** | 224 | 1,099 |
| Ichiban — sampled | 14 | **12** | — | 207 |
| **SYPerformance today** | 198 | **20** | 82 | 264 |
| SYPerformance — the 75 in-house | 75 | **23** | — | 133 |

### Four things the numbers changed

**1. SpeedFactory is far bigger than the earlier read suggested — 5,000 products, not a
boutique.** Only 26 carry their own name. They are a reseller with a house line, and the house
line is 0.5% of the catalogue.

**2. The long tail is supplier boilerplate, not writing.** Every page over 500 words is
somebody else's marketing copy pasted in — the top five on SpeedFactory are Mishimoto lug nuts
and wheel spacers at 1,068–1,082 words. Counting those as "competitor copy" would set a target
against Mishimoto's copywriter, not SpeedFactory's.

**3. The real editorial bar is 318 words.** That is SpeedFactory's longest original page
(SFWD/AWD Billet Air-to-Air Intercooler). Their own-brand median is 121. Nobody in this set
writes a genuinely long original product page.

**4. SYPerformance's median is 20 words, and 112 of 198 products (57%) have under 25.** 23
have no description at all. The gap is not marginal — it is an order of magnitude, and it is
the cheapest advantage on the table because no competitor is defending it.

### Revised target: tier it

The flat 300–500 stands for the parts that carry the positioning, and comes down for the rest.
198 × 400 words is ~79,000 words all needing SY's technical read, and most of that spend would
land on parts SYPerformance did not design.

| Tier | Products | Target | Why |
|---|---:|---|---|
| **In-house** | 75 | **350–450**, full block structure | Beats SpeedFactory's best original page on every one, not just on average. These are the pages where the failure-mode explanation is genuinely ours to write and where the GEO lever sits. |
| **Resold** | 123 | **120–180**, lead + fitment + one honest caveat | Clears SpeedFactory's 114 median and Ichiban's 12 without pretending to deep knowledge of somebody else's part. Rule 2 proof cannot be met on a resold part anyway — there is no tolerance of ours to quote. |

Total drops from ~79,000 words to ~48,000, and the review burden concentrates on the 75 pages
where SY's technical read actually adds something.

**The 300-word floor on in-house is the number that matters.** At 300 every in-house page beats
the single best original page any of these three competitors has published. At 400 they sit
above the p90 of a 5,000-product catalogue.

---

## 4. Sequencing

1. **Pilot** — three products written in full, one from each of drivetrain / valvetrain / forced induction. Spencer and SY sign off on depth, voice and the claims line. *(Draft below.)*
2. **Catalogue restructure** — build the ~40 sub-collections and their intro copy. Do this *before* the bulk copy, so each product is written knowing which page it sits on.
3. **Bulk copy** — 110 in-house products first (they carry the positioning), then the 88 resold.
4. **Spec tables and chassis codes** — SY fills them; the blocks are already built and flagged.

**Honest note on scale:** 198 products at 400 words is 60,000–80,000 words. It is not a one-session job, and it should not be — it needs SY's technical read on each batch, or it becomes 80,000 words of confident-sounding text nobody has checked.

---

## Sources

- [SpeedFactory Racing](https://www.speedfactoryracing.net/)
- [SpeedFactory — Insane Shafts K-Series Intermediate Shaft](https://www.speedfactoryracing.net/products/insane-shafts-honda-acura-k-series-intermediate-shaft) (the 25-word page)
- [SpeedFactory — Billet K-Series Mega Flow Fuel Rail](https://www.speedfactoryracing.net/products/speedfactory-billet-k-series-10an-mega-flow-fuel-rail) (their best, 208 words)
- [JackSpania Racing](https://jackspaniaracing.shop/)
- [Ichiban Parts](https://www.ichibanparts.com/)

**Ambiguity worth resolving:** "Ichiban" returns two businesses — [Ichiban Parts](https://www.ichibanparts.com/) (Canadian reseller, assessed here) and [ichibanJDM](https://www.ebay.com/str/ichibanjdm) (used engine importer, eBay). If Spencer meant the second, that analysis needs redoing.
