---
last_updated: 2026-05-08
methodology_version: 1.1
data_sources:
  - GSC export 2026-05-05 (1,000 queries / 382 pages, 3-month window)
  - GSC 90-day baseline 2026-05-02 (cornerstone-url-recovery brief)
  - Agency rankings tracker (2,668 keywords, 635 #1, $10.28 CPL Jan-Nov 2025)
  - Spencer Hill SEO Fix Plan 2026-05 (`projects/briefs/seo-foundation-recovery/spencer-docs/seo-fix-plan-extract.txt`)
  - Spencer Hill Keyword Research xlsx 2026-05 (`projects/briefs/seo-foundation-recovery/spencer-docs/keyword-research-extract.txt`) — 40 priority targets + 25-city battle map + 40 blog topics + methodology
  - Pixelmojo Radar AI Visibility Report 2026-05-08 (`~/Downloads/ai-visibility-report-got-moles.com-2026-05-08.json`)
  - mole-content-authority/keyword-gap-analysis.md (350+ queries vs 7 live posts + 26-post plan)
  - mole-content-authority/search-intent-map.md (full intent inventory)
  - brand_context/positioning.md
  - brand_context/icp.md
geographic_scope: Western Washington (King, Pierce, Snohomish, Thurston, Kitsap, Lewis counties — 6 counties, 92 cities; regional service business; the ICP is local, NOT global)
research_status: research-thin on VoC (Reddit/forum mining via str-trending-research still pending). v1.1 incorporates Spencer's keyword research + Pixelmojo AEO benchmark. v1.2 to incorporate VoC research if it lands.
canonical_facts:
  - communities: "92+ communities across 6 counties" (was "70+ communities" — corrected from city-data.ts count 2026-05-08)
  - counties: "King, Pierce, Snohomish, Thurston, Kitsap, Lewis" (was 4-county list — corrected)
  - clients: "nearly 5,000 properties served"
  - founded: 2017
  - founder: Spencer Hill, US Army veteran
  - pricing: TMCP $100/month; OMP $450 flat + $150 setup; Commercial custom-quoted
---

# Target Keywords — Got Moles

The canonical keyword + intent + page-mapping foundation for got-moles.com. Downstream skills (str-ai-seo-local, str-cro-audit, mkt-copywriting, mkt-authority-content, ops-blog-pipeline, ops-cms-content, str-internal-links) read this doc as Context.

---

## Brand-Disambiguation Strategy

**The core SEO problem.** "Mole" is a homonym. Three meanings dominate Google's index:
1. **Lawn mole** (Got Moles' product) — Talpidae mammal, tunnels, mounds, lawn damage
2. **Skin mole** (dermatology) — pigmented skin lesion, removal, cancer screening
3. **Mole (chemistry / cooking / pop culture)** — SI unit, Mexican sauce, novelty

Google's AI Overviews regularly **collapse to dermatology intent** for ambiguous queries. Live AI Overview testing (cornerstone-url-recovery brief) confirmed cost queries (`how much does mole removal cost`) and recurrence queries (`why do moles keep coming back`) get hijacked by dermatology results unless the query has unambiguous lawn/yard signal.

### Disambiguation Rules

**Rule 1 — Title + H1 carry an unambiguous lawn signal.** Every page targeting an ambiguous root term must include one of: `yard`, `lawn`, `garden`, `ground`, `pest`, `exterminator`, `trapping`, `Washington`, `Western WA`, `Seattle`/`Tacoma`/`Olympia`, or `Got Moles` in the H1 and `<title>`. Never let a page rank on `mole removal` alone — always `yard mole removal`, `lawn mole removal`, `professional mole control`, or `mole exterminator [city]`. Spencer's research (P1 keywords) confirms `yard` and `exterminator` carry the strongest commercial intent + lowest derm overlap; both should appear in homepage + service-page H1/title.

**Rule 2 — Pivot away from "mole removal cost".** Dermatology dominates this SERP nationally. Use these alternatives for cost-intent pages:
- `mole control cost Washington`
- `lawn mole removal cost`
- `professional mole trapping cost`
- `how much does mole control cost in Washington`

**Rule 3 — Use "mole control" over "mole removal" as the head-term where possible.** Agency tracker shows "mole control" cluster ranks cleanly; "mole removal" overlaps dermatology more. Service-page H1s default to `Mole Control`.

**Rule 4 — Brand entity reinforcement.** Got Moles + Western Washington is unambiguous. Anchor framing: include the geo modifier in metadata even when content is national-scope (e.g. seasonal posts).

**Rule 5 — Internal anchor text matters.** Link to the cost post with anchor `mole control cost in Washington`, not `mole removal cost`. Posture A reminder applies to anchor text — generic "trapping" / "professional service" is fine; never `body-gripping`, `scissor`, `harpoon`, `spear`, `kill`.

### Queries to AVOID (never target these)

These six clusters are dermatology / pop-culture / DIY-product traffic that pollutes intent and burns ad spend. They appear as Google Ads account-level negatives (see `feedback_mole_negative_keywords_medical.md`); they should NOT appear as title/H1 targets, FAQ targets, or blog post primary keywords.

| Cluster | Example queries | Why avoid |
|---|---|---|
| **Dermatology / skin** | `mole removal cost`, `mole removal near me` (when ambiguous), `how to remove a mole`, `mole on face removal`, `flat mole removal`, `raised mole removal`, `mole biopsy cost` | Skin-mole intent — wrong audience, zero conversion |
| **Cosmetic DIY** | `apple cider vinegar mole removal`, `mole removal cream`, `mole removal pen`, `mole removal patch`, `mole removal kit`, `freeze off mole at home` | DIY skin product searches; brand-damaging association |
| **Medical / cancer** | `is this mole cancerous`, `melanoma vs mole`, `atypical mole`, `dysplastic nevus`, `dermatologist near me mole` | Health queries — wrong vertical entirely |
| **Pop culture / food** | `mole sauce recipe`, `chicken mole`, `mole the spy`, `the mole season`, `Avogadro's mole` | Cooking / chemistry / TV |
| **Adjacent animals (when generic)** | `vole removal near me`, `gopher trapping cost` (target only on educational comparison pages, never as primary KW for service pages) | Wrong species; gopher service is an adjacent product but Got Moles does not lead with it |
| **Body-gripping product searches** | `body-gripping mole trap`, `scissor mole trap`, `harpoon mole trap`, `spear mole trap`, `kill traps for moles` | Posture A: silent on mechanism. Don't court these searches even though they're lawn-mole intent |

**Inverse rule — queries we DO want.** Anything containing `lawn`, `yard`, `garden`, `tunnel`, `mound`, `molehill`, `exterminator`, `trapper`, `trapping service`, `Washington`, `Seattle`, `Tacoma`, `Bellevue`, `Sammamish`, `professional`, `pest`, `Talpidae` is unambiguous lawn-mole intent. Lean into these modifiers in title-tag and H1 construction.

---

## Brand Defense Strategy

**Primary brand-name target.** The query `got moles` (200-500 monthly volume per Spencer's research) is a P1 brand defense priority. **Threat:** Mole Patrol (42-year domain, primary long-term competitor) uses "got moles?" in their meta keywords — they're attempting to erode our brand-name SERP. Confirm `/` ranks #1 nationally for `got moles` and `got moles seattle` / `got moles washington` queries.

**Brand-name owned terms (defend at all costs):**

| Query | Volume | Page | Notes |
|---|---|---|---|
| `got moles` | 200-500 | `/` | P1 brand defense. Monitor monthly. |
| `got moles seattle` | VL | `/` or `/mole-control-seattle/` | |
| `got moles washington` | VL | `/` | |
| `got moles reviews` | VL | `/reviews/` | |
| `got moles pricing` / `got moles cost` | VL | `/services/` | Hallucination correction surface — Pixelmojo flagged AI providers fabricating prices |
| `spencer hill mole control` | VL | `/about/` | Founder entity defense |
| `veteran owned mole control washington` | 20-80 | `/about/` | **OWN this — no competitor can claim it.** P2 priority per Spencer; uncontested. |

**Anchor-city seeding rule (homepage + service pages).** Per Spencer P2.7: name **Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton** in the first 200 words of homepage + every service page. These are the highest-volume + highest-LTV cities; explicit naming reinforces local entity signal for AI Overviews.

---

## Seasonality Calendar (publish + push schedule)

Spencer's methodology: Western WA mole search behaviour peaks **twice yearly**:

| Period | Behaviour | Action |
|---|---|---|
| **Mar-May** | Peak: spring dispersal, fresh mounds appearing | Highest demand window. Aggressive paid spend; surface seasonal content. |
| **Jun-Aug** | Trough: moles dig deeper, less surface activity | Publish PNW seasonal content + content for Sep-Nov peak (4-6 weeks lead). |
| **Sep-Nov** | Peak: autumn rains return, mounds reappear | Second highest demand. Content for spring peak should publish in Feb. |
| **Dec-Feb** | Trough: frozen ground masks activity | Publish spring-peak content; Feb is the prime publish month. |

**Content calendar rule:** publish content **4-6 weeks before each peak**. Mar-May peak → publish Feb. Sep-Nov peak → publish Aug. Long-tail seasonal posts (`mole season washington calendar`, `when are moles most active`, `spring mole damage`) should target these windows.

---

## Cluster: mole-control (head + commercial intent)

**Pillar page:** `/how-to-get-rid-of-moles-in-your-yard/` (legacy-root cornerstone, already linked from 8+ posts)
**Primary intent:** Instruction (head) + Commercial (sub-pages)
**Cluster rationale:** This is the head-term cluster. `how to get rid of moles in your yard` is the H-volume national query; the commercial spokes (`mole control near me`, `mole removal Washington`, programme pages) carry conversion intent. The whole cluster sits on top of the funnel and feeds into service / city pages.

### Queries

| Query | Primary intent | Secondary | Assigned page | GSC impressions (90d) | GSC position | Volume bucket | Target | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| how to get rid of moles in your yard | Instruction | Commercial | `/how-to-get-rid-of-moles-in-your-yard/` | 760 | 19.1 | H | Top 3 | P0 | Pillar. Ranking 19 — major lift opportunity |
| how to get rid of moles | Instruction | Commercial | `/how-to-get-rid-of-moles-in-your-yard/` | (national) | — | H | Top 5 | P0 | Same pillar, head-term |
| how to get rid of moles in lawn | Instruction | Commercial | `/how-to-get-rid-of-moles-in-your-yard/` | (national) | — | M | Top 5 | P0 | Pillar |
| how to get rid of ground moles with vinegar | Instruction | Myth | `/how-to-get-rid-of-ground-moles-with-vinegar/` | 20,701 | 3.9 | M | Top 3 | P0 | Already a top-clicks performer (226 clicks). Defend & internal-link |
| best way to get rid of moles | Instruction | Commercial | `/how-to-get-rid-of-moles-in-your-yard/` | (national) | — | M | Top 5 | P1 | Pillar |
| mole control near me | Commercial | Local | `/services/total-mole-control-program/` (or homepage) | (handled by GBP + city pages) | — | M | Local pack | P0 | Local-pack play; relies on GBP |
| mole control | Informational/Commercial | — | `/services/` (or service hub) | 2,261 | 37.8 | L | Top 10 | P1 | Currently underserved. Likely needs a `/services/` hub or hero copy fix |
| mole pest control | Commercial | — | `/services/total-mole-control-program/` | 75 | 11.1 | L | Top 5 | P1 | Already moderate, push higher with internal links |
| professional mole removal | Commercial | — | `/services/one-time-mole-removal/` | — | — | L | Top 5 | P1 | OMP service page primary |
| year-round mole control | Commercial | — | `/services/total-mole-control-program/` | — | — | VL | Top 3 | P0 | TMCP USP-aligned |
| mole control Washington | Commercial | Local | Homepage `/` | — | — | L | Top 3 | P0 | Brand+geo anchor; reinforces disambiguation |
| **mole exterminator near me** | Commercial | Local | Homepage `/` + city pages | — | — | M (300-700 Spencer) | Top 5 + Local Pack | **P0** | **NEW v1.1.** Spencer P1 — Mole Patrol (42-yr domain) dominates this. Add `exterminator` to homepage title + every city page H1 |
| **mole exterminator [city]** | Commercial | Local | `/mole-control-{city}/` (every city page) | — | — | VL-L per city | Top 5 | **P0** | **NEW v1.1.** Spencer P2. Update every city page's secondary anchor pattern to include `mole exterminator {city}` alongside existing `mole control {city}` |
| **yard mole removal** | Commercial | — | Homepage `/` + service pages | — | — | M (200-500 Spencer) | Top 3 | **P0** | **NEW v1.1.** Spencer P1. `yard` modifier disambiguates from skin moles — primary parallel to `lawn` |
| **yard mole control** | Commercial | — | Homepage `/` | — | — | M (Spencer estimate) | Top 3 | **P0** | **NEW v1.1.** Spencer recommends as homepage H1 anchor: `Yard Mole Control in Western Washington` |
| lawn mole removal | Commercial | — | Homepage `/` + service pages | — | — | M (150-300 Spencer) | Top 3 | P1 | NEW v1.1. Parallel to `yard mole removal` for keyword diversity |
| **best mole control company** | Commercial | Decision | `/blog/best-mole-control-company-washington/` (NEW PAGE) | — | — | M (100-250 Spencer) | Top 5 | **P1** | **NEW v1.1 GAP.** Spencer flags as missing comparison/why-us page. Build a "Why Got Moles" decision-stage landing page |
| mole control company | Decision | Commercial | `/blog/how-to-choose-a-mole-control-company/` | — | — | L | Top 5 | P1 | Already live blog, decision-stage |
| how to choose a mole control company | Decision | Commercial | `/blog/how-to-choose-a-mole-control-company/` | — | — | L | Top 3 | P1 | Live blog, lock in |
| mole removal company | Decision | Commercial | `/blog/how-to-choose-a-mole-control-company/` | — | — | L | Top 5 | P2 | Same target |
| chemical free mole control | Commercial | Differentiator | `/services/total-mole-control-program/` (or `/how-it-works/`) | — | — | VL | Top 3 | P1 | Brand differentiator query |

### Cannibalisation notes
- `how to get rid of moles` and `how to get rid of moles in your yard` are the same intent. Pillar covers both — do NOT split into two posts. Make sure no city or service page targets these.
- `mole control` (head) at position 37.8 on `/mole-control/` is suspicious — likely a legacy thin URL. Audit and either upgrade to a true hub or 301 to `/services/`.

### Coverage gaps
- No dedicated `/services/` hub page (overview of all three services). Currently the homepage carries this load. Consider a thin `/services/` index page if internal-link audit shows it's needed.
- `chemical free mole control [city]` — VL volume but high differentiation; consider weaving into city-page intro copy as a secondary anchor.
- **`best mole control company` (M, 100-250 Spencer)** — no comparison/why-us decision page. **NEW v1.1 PAGE: build `/blog/best-mole-control-company-washington/`** — Got Moles vs Mole Patrol vs Mole Masters vs DIY, citing 219+ reviews, ~5,000 properties, chemical-free, veteran-owned, 8-year focused-on-moles. Anchored on decision-stage commercial intent.

---

## Cluster: biology (informational, top-of-funnel — the GSC traffic engine)

**Pillar page:** `/blog/mole-vs-vole-vs-gopher/` (or upgrade `/voles-vs-moles-whats-the-difference/` to canonical)
**Primary intent:** Informational
**Cluster rationale:** Biology queries are the #1 traffic source in GSC (do moles have eyes = 23,961 imp; vole vs mole = 15,017; voles vs moles = 12,382). Got Moles already ranks 1.3-2.5 on most of these. The cluster is a Tier-A asset for GEO citations and brand awareness, but commercial conversion is low. Defend, don't expand aggressively. Use it for internal linking down to commercial pages.

### Queries

| Query | Primary intent | Secondary | Assigned page | GSC impressions (90d) | GSC position | Volume bucket | Target | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| do moles have eyes | Informational | — | `/how-many-eyes-do-moles-have/` | 23,961 | 1.3 | H | Top 1 | P0 | DEFEND. Top-clicks driver (119 clicks) |
| are moles blind | Informational | — | `/blog/are-moles-blind/` | 5,150 | 3.2 | M | Top 1 | P0 | At #3, push to #1 — duplicate of `/blog/are-moles-blind/` exists; consolidate |
| can moles see | Informational | — | `/how-many-eyes-do-moles-have/` (FAQ section) | 3,639 | 2.2 | L | Top 1 | P1 | Sub-query of pillar |
| mole eyes | Informational | — | `/how-many-eyes-do-moles-have/` | 4,623 | 1.8 | L | Top 1 | P1 | Sub-query |
| vole vs mole | Comparison | — | `/voles-vs-moles-whats-the-difference/` | 15,017 | 1.4 | M | Top 1 | P0 | DEFEND. Massive impression count |
| voles vs moles | Comparison | — | `/voles-vs-moles-whats-the-difference/` | 12,382 | 1.3 | M | Top 1 | P0 | DEFEND |
| mole vs vole | Comparison | — | `/voles-vs-moles-whats-the-difference/` | 8,038 | 1.4 | M | Top 1 | P0 | DEFEND |
| moles and voles | Comparison | — | `/voles-vs-moles-whats-the-difference/` | 1,241 | 2.8 | L | Top 3 | P1 | Sub-query |
| moles vs gophers | Comparison | — | `/moles-vs-gopher-mounds/` | 17,924 | 3.2 | M | Top 1 | P0 | At #3, push to #1 |
| mole vs gopher | Comparison | — | `/moles-vs-gopher-mounds/` | (national) | — | M | Top 1 | P0 | Same target |
| mole vs vole vs gopher | Comparison | — | `/blog/mole-vs-vole-vs-gopher/` | 71 | 12.0 | M | Top 5 | P1 | New blog post — needs lift via internal links |
| do moles bite | Informational | Safety | `/do-moles-bite/` | 5,196 | 1.8 | M | Top 1 | P0 | DEFEND. Top-clicks driver (148 clicks) |
| do moles bite humans | Informational | Safety | `/do-moles-bite/` | 654 | 1.8 | L | Top 1 | P1 | Sub-query |
| can moles bite | Informational | Safety | `/do-moles-bite/` | 823 | 1.8 | L | Top 1 | P1 | Sub-query |
| are moles venomous | Informational | Safety | `/are-moles-venomous/` | 10,401 | 2.8 | M | Top 1 | P0 | At #3, push to #1 |
| are moles poisonous | Informational | Safety | `/are-moles-poisonous-or-venomous/` | (sub-query) | — | L | Top 1 | P1 | Sub-query |
| how deep do moles dig | Informational | — | `/how-deep-do-moles-dig/` | 39,158 | 4.5 | M | Top 1 | P0 | DEFEND. Top-clicks performer (323 clicks) — push from 4.5 to <2 |
| how deep do moles burrow | Informational | — | `/how-deep-do-moles-dig/` | 671 | 1.2 | L | Top 1 | P1 | Sub-query |
| how deep do moles tunnel | Informational | — | `/how-deep-do-moles-dig/` | 178 | 1.4 | L | Top 1 | P1 | Sub-query |
| how deep are mole tunnels | Informational | — | `/how-deep-do-moles-dig/` | 528 | 1.6 | L | Top 1 | P1 | Sub-query |
| what do mole holes look like | Informational | Diagnosis | `/what-do-mole-holes-look-like/` | 34,326 | 4.9 | M | Top 1 | P0 | DEFEND. 198 clicks — push from 4.9 to <2 |
| mole hole | Informational | Diagnosis | `/what-do-mole-holes-look-like/` | 2,486 | 2.5 | L | Top 1 | P1 | Sub-query |
| mole holes in yard | Informational | Diagnosis | `/what-do-mole-holes-look-like/` | 718 | 3.7 | L | Top 1 | P1 | Sub-query |
| mole mounds | Informational | Diagnosis | `/what-do-mole-holes-look-like/` (or new dedicated) | 1,114 | 5.9 | L | Top 3 | P2 | May warrant own post per content plan #25 |
| what eats moles | Informational | — | `/what-eats-moles/` | 21,206 | 3.6 | L | Top 1 | P0 | DEFEND. 44 clicks |
| what do moles eat | Informational | — | `/what-do-moles-eat/` | 16,265 | 6.6 | M | Top 3 | P1 | Push from 6.6 to <3 |
| do moles hibernate | Informational | Seasonal | `/do-moles-hibernate/` | 7,344 | 5.5 | M | Top 3 | P1 | Push from 5.5 |
| are moles nocturnal | Informational | Seasonal | `/are-moles-nocturnal/` | 13,318 | 4.2 | L | Top 3 | P1 | Push from 4.2 |
| do moles live in groups | Informational | — | `/do-moles-live-in-groups/` | 5,588 | 3.5 | L | Top 3 | P1 | Modest defence |
| how many babies do moles have | Informational | Reproduction | `/how-many-babies-do-moles-have/` | 5,517 | 5.6 | L | Top 3 | P2 | Push from 5.6 |
| do moles carry diseases | Informational | Safety | `/do-moles-carry-diseases/` | 17,790 | 5.1 | L | Top 3 | P0 | High-impression. Push from 5.1 |
| is a mole a rodent | Informational | — | `/is-a-mole-a-rodent/` | 18,490 | 3.8 | L | Top 3 | P1 | Push from 3.8 |
| are moles rodents | Informational | — | `/is-a-mole-a-rodent/` | 4,849 | 4.0 | L | Top 3 | P1 | Sub-query |
| can moles swim | Informational | — | `/can-moles-swim/` | 2,287 | 4.5 | L | Top 3 | P2 | Modest |
| how long do moles live | Informational | — | `/blog/how-long-do-moles-live/` | 97 | 7.6 | L | Top 5 | P2 | Newer post, lift via internal links |
| how to find active mole tunnels | Instruction | DIY | `/blog/how-to-find-active-mole-tunnels/` | 87 | 6.3 | L | Top 3 | P1 | Newer post — entire cluster gap closer |
| why do moles make molehills | Informational | Diagnosis | `/why-do-moles-make-molehills/` | 5,363 | 6.0 | L | Top 3 | P1 | Push from 6.0 |
| what attracts moles to your yard | Informational | Root cause | `/what-attracts-moles-to-your-yard/` | 3,457 | 5.0 | M | Top 3 | P1 | Push from 5.0 — feeds into commercial cluster |

### Cannibalisation notes
- ~~`/blog/are-moles-blind/` and `/how-many-eyes-do-moles-have/` overlap heavily~~ **RESOLVED 2026-05-08 — sustain both with bidirectional cross-link.** Decision rationale: intents differ (is/isn't question vs anatomy question); both rank top-3; consolidating risks losing 5,150 imp on the blind post for marginal upside. Spencer xlsx Blog Topic Map says "Sustain" for `are moles blind`. Bidirectional cross-link added 2026-05-08 (eyes post → blind post + blind post → eyes post in "Do Moles Have Eyes?" section).
- `/blog/types-of-moles-in-washington/` and `/what-species-of-moles-live-in-washington-state/` overlap. **CANONICAL = `/blog/types-of-moles-in-washington/`** (per Spencer SEO Fix Plan P1.1, 2026-05). 301 `/what-species-of-moles-live-in-washington-state/` → `/blog/types-of-moles-in-washington/`. Update internal links accordingly.
- Multiple pages have both legacy-root and `/blog/` versions (e.g. `/are-moles-nocturnal` AND `/are-moles-nocturnal/`, `/blog/best-mole-traps` AND `/blog/best-mole-traps/`). 301 redirects needed for trailing-slash + duplicate-prefix variants. **This is a P0 cannibalisation cleanup.**

### Coverage gaps
- `mole tunnels in yard` (M volume) — no dedicated page; covered partially by `/what-do-mole-holes-look-like/`. May warrant a dedicated `/blog/mole-tunnels-explained/` post.
- `something digging in my yard at night` (L) — no coverage; could be answered in a "what's tearing up my lawn" pillar.

---

## Cluster: safety

**Pillar page:** `/blog/mole-control-safe-for-pets/` (existing live post)
**Primary intent:** Informational + Safety + Conversion-support
**Cluster rationale:** ICP-critical. Jennifer & Mike Thompson have a golden retriever and two kids. Pet/child safety is the #2 objection ("Is it safe for my kids and dog?"). Also a strong differentiator vs poison-using competitors. Cluster ranks well already; defend + lean into chemical-free positioning.

### Queries

| Query | Primary intent | Secondary | Assigned page | GSC impressions (90d) | GSC position | Volume bucket | Target | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| is mole poison safe for dogs | Safety | Conversion | `/blog/mole-control-safe-for-pets/` | — | — | M | Top 3 | P0 | Pillar primary |
| pet safe mole control | Safety | Commercial | `/blog/mole-control-safe-for-pets/` | — | — | L | Top 3 | P0 | Differentiator |
| mole control safe for pets | Safety | Commercial | `/blog/mole-control-safe-for-pets/` | 210 | 5.3 | L | Top 3 | P0 | Lift from 5.3 |
| dog ate mole bait what to do | Safety | Emergency | `/blog/dog-ate-mole-poison/` (planned) | — | — | L | Top 5 | P1 | Planned post #12 — prioritise |
| are moles dangerous | Safety | — | `/blog/are-moles-dangerous/` (planned) | — | — | L | Top 5 | P1 | Planned post #11 |
| can moles damage foundation | Safety | Property | `/blog/mole-foundation-damage/` (planned) | — | — | L | Top 5 | P1 | Planned post #9 |
| do moles carry diseases | Safety | — | `/do-moles-carry-diseases/` | 17,790 | 5.1 | L | Top 3 | P0 | (Cross-cluster — also under biology) |
| are moles dangerous to dogs | Safety | Pets | `/blog/mole-control-safe-for-pets/` (FAQ) | — | — | VL | Top 3 | P2 | FAQ section |
| chemical free mole control | Safety | Commercial | `/services/total-mole-control-program/` | — | — | VL | Top 3 | P1 | Cross-cluster — primary on TMCP page |

### Cannibalisation notes
- The pet-safety blog covers both pet-poison danger AND chemical-free positioning. Make sure the TMCP page targets `chemical free mole control` as primary and the blog targets `is mole poison safe for dogs` — different intents, no overlap.

### Coverage gaps
- `child safe mole removal` (VL) — uncovered; weave into pet-safety FAQ.
- Commercial buyer concern: `mole control safe for sports field` / `school grounds mole control` — covered by `/services/commercial-mole-control/` but not optimised. Consider commercial-specific FAQ.

---

## Cluster: cost-value

**Pillar page:** `/blog/mole-removal-cost-washington/` (existing — but rename per disambiguation rules)
**Primary intent:** Commercial / Decision
**Cluster rationale:** Money-keyword cluster. AI Overviews here heavily collide with dermatology — disambiguation discipline is critical. Pivot all primary KWs to `mole control cost` framing where possible, keep `mole removal cost` as a hard-disambiguated secondary in body copy only.

### Queries

| Query | Primary intent | Secondary | Assigned page | GSC impressions (90d) | GSC position | Volume bucket | Target | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| how much does mole removal cost in Washington | Commercial | Local | `/blog/mole-removal-cost-washington/` | — | — | M | Top 3 | P0 | Pillar primary — Washington qualifier disambiguates |
| mole control cost | Commercial | — | `/blog/mole-removal-cost-washington/` (or new `/blog/mole-control-cost/`) | — | — | L | Top 5 | P0 | Disambiguation pivot — preferred over `mole removal cost` |
| professional mole trapping cost | Commercial | — | `/blog/mole-removal-cost-washington/` | — | — | L | Top 5 | P1 | Strong intent |
| lawn mole removal cost | Commercial | — | `/blog/mole-removal-cost-washington/` | — | — | L | Top 5 | P1 | Disambiguation-safe |
| mole exterminator cost | Commercial | — | `/blog/mole-removal-cost-washington/` | — | — | L | Top 5 | P1 | Strong intent, low derm overlap |
| mole removal service cost | Commercial | — | `/blog/mole-removal-cost-washington/` | — | — | L | Top 5 | P2 | |
| monthly mole control plan | Commercial | TMCP | `/services/total-mole-control-program/` | — | — | VL | Top 3 | P0 | TMCP USP query |
| mole removal monthly plan | Commercial | TMCP | `/services/total-mole-control-program/` | — | — | VL | Top 3 | P1 | Same target |
| mole control warranty | Decision | — | `/services/one-time-mole-removal/` (guarantee section) | — | — | VL | Top 3 | P1 | Guarantee — programme-specific (per memory) |
| mole removal guarantee | Decision | — | `/services/one-time-mole-removal/` | — | — | VL | Top 3 | P1 | Same target. Memory: guarantee attaches to OMP only |
| do mole companies guarantee work | Decision | — | `/blog/how-to-choose-a-mole-control-company/` | — | — | VL | Top 5 | P2 | |

### Cannibalisation notes
- The cost post and the TMCP page both naturally pull `mole control cost` queries. Differentiate: cost post = informational, ranges, what-affects-price; TMCP page = "this is what we charge for the programme." Internal-link cost post → TMCP page in conversion section.

### Coverage gaps
- `mole removal cost near me` (M, ambiguous) — high derm overlap. Don't target as primary; serve via city pages with `Tacoma mole control cost` framing.

---

## Cluster: seasonal

**Pillar page:** `/when-are-moles-most-active/` (existing legacy-root cornerstone)
**Primary intent:** Informational + Conversion (seasonal urgency)
**Cluster rationale:** Drives consistent year-round traffic + creates seasonal urgency hooks for paid + email. Already ranks well; expand sub-cluster around breeding / month-by-month with internal links.

### Queries

| Query | Primary intent | Secondary | Assigned page | GSC impressions (90d) | GSC position | Volume bucket | Target | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| when are moles most active | Informational | — | `/when-are-moles-most-active/` | 21,268 | 5.2 | M | Top 1 | P0 | DEFEND. Push from 5.2 |
| mole season | Informational | — | `/when-are-moles-most-active/` | — | — | L | Top 3 | P1 | Sub-query |
| do moles hibernate | Informational | — | `/do-moles-hibernate/` | 7,344 | 5.5 | M | Top 3 | P1 | Cross-cluster |
| are moles active in winter | Informational | — | `/when-are-moles-most-active/` (winter section) | — | — | L | Top 3 | P2 | |
| best time of year for mole control | Commercial | Seasonal | `/when-are-moles-most-active/` | — | — | L | Top 3 | P1 | Conversion bridge |
| when is the best time to trap moles | Commercial | Seasonal | `/when-are-moles-most-active/` | — | — | L | Top 3 | P1 | |
| mole breeding season | Informational | — | `/blog/mole-breeding-season/` (planned #21) | — | — | L | Top 5 | P2 | |
| spring mole damage | Informational | Seasonal | `/when-are-moles-most-active/` | — | — | VL | Top 5 | P2 | |
| are moles worse after rain | Informational | Seasonal | `/when-are-moles-most-active/` (FAQ) | — | — | L | Top 5 | P2 | |
| moles in spring | Informational | Seasonal | `/when-are-moles-most-active/` | — | — | L | Top 3 | P2 | |
| moles in fall | Informational | Seasonal | `/when-are-moles-most-active/` | — | — | VL | Top 5 | P2 | |

### Coverage gaps
- Calendar-style content (`mole activity by month`, `January mole activity`) is uncovered. May not warrant standalone post — fold into seasonal pillar as a calendar table.

---

## Cluster: diy-vs-pro (myth-busting + decision)

**Pillar page:** `/blog/diy-mole-removal-vs-professional/` (existing) — or expand into a true "10 mole myths" pillar
**Primary intent:** Comparison / Myth-busting / Decision
**Cluster rationale:** This is the conversion-defence cluster. ICP has tried DIY and a general pest co already. Posts that demolish DIY myths (sonic stakes, vinegar, grub control, gum, mothballs) stop the customer from going back to the DIY rabbit hole and route them toward booking. Strong GEO citation potential — AI Overviews need authoritative myth-bust content.

### Queries

| Query | Primary intent | Secondary | Assigned page | GSC impressions (90d) | GSC position | Volume bucket | Target | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| DIY mole control vs professional | Comparison | Decision | `/blog/diy-mole-removal-vs-professional/` | — | — | L | Top 3 | P0 | Pillar |
| can I trap moles myself | Comparison | DIY | `/blog/diy-mole-removal-vs-professional/` | — | — | L | Top 5 | P1 | |
| is it worth hiring a mole exterminator | Decision | — | `/blog/diy-mole-removal-vs-professional/` | — | — | L | Top 3 | P1 | |
| does castor oil work for moles | Myth | — | `/blog/does-castor-oil-work-for-moles/` (planned) | — | — | M | Top 3 | P0 | Planned post #8 — prioritise |
| how to get rid of ground moles with vinegar | Myth | — | `/how-to-get-rid-of-ground-moles-with-vinegar/` | 20,701 | 3.9 | M | Top 1 | P0 | DEFEND. 226 clicks |
| does grub control stop moles | Myth | — | `/blog/does-grub-control-stop-moles/` | 55 | 8.1 | M | Top 3 | P0 | Lift from 8.1 |
| do sonic mole repellers work | Myth | — | `/blog/do-mole-repellents-work/` | 175 | 5.8 | M | Top 3 | P0 | Lift from 5.8 |
| do mole repellents work | Myth | — | `/blog/do-mole-repellents-work/` | — | — | L | Top 3 | P0 | Same target |
| best mole repellent | Comparison | Product | `/blog/do-mole-repellents-work/` | — | — | M | Top 3 | P1 | Honest "what works / what doesn't" angle |
| best mole traps | Comparison | Product | `/blog/best-mole-traps/` | 125 | 6.0 | M | Top 3 | P0 | Lift from 6.0. Posture A: review traps without naming body-gripping mechanism explicitly |
| do mothballs keep moles away | Myth | — | `/blog/mole-myths/` (planned #7) | — | — | L | Top 5 | P2 | |
| does juicy fruit gum kill moles | Myth | — | `/blog/mole-myths/` (planned #7) | — | — | L | Top 5 | P2 | |
| do moles come back after trapping | Decision | Conversion | `/blog/do-moles-come-back-after-trapping/` (rename Post 7 from "moles keep coming back") | — | — | M | Top 3 | P0 | Conversion-defence pillar adjacent |
| will moles go away on their own | Decision | Conversion | `/blog/will-moles-go-away-on-their-own/` (planned #20) | — | — | M | Top 3 | P1 | |
| how to get rid of moles humanely | Decision | Ethical | `/blog/humane-mole-removal/` | 36 | 5.9 | L | Top 3 | P1 | Existing newer post — push from 5.9 |
| are moles good for the garden | Informational | Balanced | `/blog/are-moles-good-for-your-yard/` | 18 | 7.5 | L | Top 5 | P2 | Newer post — lift |

### Cannibalisation notes
- `/blog/do-mole-repellents-work/` has both trailing-slash and non-trailing-slash variants in GSC (175 + 154 imp respectively). Same canonicalisation P0.
- `best mole repellent` and `do sonic mole repellers work` could split into two posts or stay combined. Keep combined — broader is better here.

### Coverage gaps
- `does flooding mole tunnels work` (L), `can you drown moles` (L) — uncovered; fold into mole myths post #7.
- `do cats get rid of moles` / `will a dog get rid of moles` (L each) — covered by planned post #22 (natural predators).

**NEW v1.1 — Spencer-surfaced blog GAPS to build:**

| # | Topic | Vol (Spencer) | Priority | Why |
|---|---|---|---|---|
| G1 | `moles in lawn pacific northwest` (PNW guide cornerstone) | 100-250 | P2 | Regional ownership term; Got Moles should own this geo-term |
| G2 | `mole damage repair lawn` | 300-600 | P2 | Practical post-trap content (recovery / reseed / level) — Spencer flags as missing |
| G3 | `when to call mole exterminator` | 100-250 | P2 | Bottom-funnel decision driver |
| G4 | **`are mole traps legal in washington`** | 100-300 | **P1** | **WA-specific answer-engine bait** — high AEO leverage. Posture A: discuss `trapping` generically, never name body-gripping mechanisms |
| G5 | `mole season washington calendar` | 100-200 | P2 | Seasonal infographic post — drives Mar-May + Sep-Nov peak traffic |
| G6 | `best time to call for mole control` | 50-150 | P2 | Booking-driver content, seasonality-anchored |

---

## Cluster: location-services (city pages — the local-pack engine)

**Pillar page:** Homepage `/` + `/service-areas/` index
**Primary intent:** Commercial / Local
**Cluster rationale:** This is where the money lives. 93 city pages already exist using the `/mole-control-{city}/` pattern. Agency tracker confirms 635 #1 rankings on city-keyword combos. The cluster is templated — keyword pattern is `mole control {city}` (primary) + `mole removal {city}` / `mole trapper {city}` (secondary) per page.

### Templated query pattern (per city)

| Pattern | Primary intent | Volume bucket | Target | Notes |
|---|---|---|---|---|
| `mole control {city}` | Commercial / Local | VL-L | Top 3 + Local Pack | Primary H1 & title-tag pattern for every city page |
| `mole removal {city}` | Commercial / Local | VL-L | Top 5 | Secondary anchor; in body copy |
| `mole trapper {city}` | Commercial / Local | VL | Top 5 | Secondary; high-intent |
| `mole exterminator {city}` | Commercial / Local | VL-L | Top 5 | Secondary |
| `mole control near me` | Commercial / Local | M | Local Pack | Served by GBP, not city page directly — but city pages reinforce signal |
| `mole repellant {city}` | Comparison / Local | VL | Top 5 | Surprisingly common pattern in GSC — at least 12 `mole-repellant-{city}/` legacy URLs ranking 20-58 |

### Priority cities (Tier A — dense ICP, highest volume / commercial value)

These cities have the highest population × ICP-density × competitive headroom. Prioritise content depth + internal links + GBP optimisation. **v1.1 enriched** with Spencer's City Battle Map (named competitors + page-quality + strategic notes):

| # | City | County | Vol/mo | Top competitors | Their page quality | Strategic note (Spencer) |
|---|---|---|---|---|---|---|
| 1 | **Seattle** | King | 300-600 | Mole Patrol / Mole Masters | Mid | Hardest fight — but volume justifies. `mole exterminators seattle` (currently #56) is a big lift opp |
| 2 | **Bellevue** | King | 100-250 | Mole Masters / Mole Patrol | Thin | **Highest-value commercial market in WA** |
| 3 | **Sammamish** | King | 50-150 | Mole Masters / Mole Patrol | Thin | **Wealthy lots, recurring TMCP gold mine — overinvest.** Primary persona lives here |
| 4 | **Mercer Island** | King | 30-80 | Mole Masters | Thin | Wealthy + small market = uncontested winnable |
| 5 | **Medina** | King | 10-40 | Mole Masters / Mole Patrol | Thin | Bezos-tier market — TMCP target |
| 6 | **Kirkland** | King | 80-200 | Moody Moles / Mole Patrol | Weak (Moody Moles broken Wix) | Beat Moody Moles |
| 7 | **Redmond** | King | 80-200 | Mole Patrol / Mole Masters | Thin | Battle for tech employee homeowners |
| 8 | **Issaquah** | King | 60-150 | Mole Masters | Thin | Forested edges = persistent moles, recurring revenue |
| 9 | **Tacoma** | Pierce | 150-300 | Mole Masters / Sound Pest | Thin | Pierce stronghold — hometown advantage |
| 10 | **Puyallup** | Pierce | 80-200 | The Mole Man / Mole Busters | Thin | Local rivals — protect home turf |
| 11 | **Auburn** | King | 60-150 | Mole Control & More (Corey, since 2000) | Mid | Battle Mole Control & More |
| 12 | **Renton** | King | 60-150 | Mole Masters | Thin | Solid volume, weak competition |
| 13 | **Kent** | King | 60-150 | Mole Masters | Thin | Solid Pierce-adjacent volume |
| 14 | **Federal Way** | King | 50-120 | Mole Masters | Thin | Easy market, minimal competition |

### Tier A+ — secondary high-priority (per Spencer Battle Map P2-P3)

| City | County | Vol/mo | Strategic note |
|---|---|---|---|
| Enumclaw | King | 20-60 | HQ city — brand authority play |
| Bonney Lake | Pierce | 30-80 | Mole Busters' home — defend strongly |
| Maple Valley | King | 30-80 | Forested = chronic mole pressure |
| Covington | King | 20-50 | Easy ranking opportunity |
| Lake Tapps | Pierce | 20-60 | High-end lakefront, TMCP target |
| Gig Harbor | Pierce | 30-80 | Wealthy waterfront, TMCP play |
| Bremerton | Kitsap | 20-60 | Kitsap expansion target — first-mover |
| Bainbridge Island | Kitsap | 20-60 | Wealthy island, TMCP gold |
| Silverdale | Kitsap | 15-40 | Open competitive opportunity |
| Olympia | Thurston | 60-150 | South Sound — minimal competition |
| Lacey | Thurston | 30-80 | Olympia overflow market |

**Competitor RAG (Spencer methodology section):**
- **Mole Patrol** — 42-yr domain, primary long-term threat. Dominates `mole exterminator seattle`. Uses "got moles?" in meta keywords (brand defense priority)
- **Mole Masters** — 49 thin pages, dominates `yard mole control [city]` via page volume
- **Moody Moles** — broken Wix site, easy to beat (Kirkland)
- **NW Mole Pros** — WordPress, identical templated pages
- **NW Mole King** — broken site (Yext placeholder errors)
- **The Mole Man (Murray, Puyallup)** — 25-yr local brand
- **Mole Control & More (Corey, Auburn)** — South King since 2000
- **Mole Busters** — founded 2024, weakest threat (Bonney Lake)
- **Croach** — national chain w/ Seattle pages
- **Sound Pest / Sunrise Pest** — Kitsap presence

### Tier B — service-area cities (templated, lower priority)

The remaining ~80 city pages follow the same `mole control {city}` pattern. Long-tail layer per city = neighbourhood/suburb/landmark queries (e.g. `mole control downtown Bellevue`, `mole control Sammamish plateau`). These don't need their own pages — fold as H2 sub-sections inside each city page.

### Cannibalisation notes
- **MASSIVE issue.** GSC shows multiple URL variants for the same city: `/bellevue/`, `/bellevue-mole-removal`, `/bellevue-mole-extermination/`, `/bellevue-mole-extermination`, `/medina-mole-extermination/`, `/medina/`, `/medina-mole-control`, etc. All competing on the same intent. **P0 cleanup:** designate one canonical URL per city (`/mole-control-{city}/`), 301 every variant. Agency tracker should reveal which variant has equity to keep.
- `/mole-repellant-{city}/` URLs (Kirkland, Bellevue, Tacoma, Federal Way, Renton, Puyallup, Issaquah, Olympia, Enumclaw, Orting, Seattle) — 11 thin "repellant" landing pages still indexed, ranking 20-58. Decide: 301 to city page or rebuild as repellent-comparison content. Not high priority but should be cleaned up.

### Coverage gaps
- `Pierce County mole control` / `King County mole control` / `Snohomish County mole control` — VL each but unambiguous county-level queries. Could be served by a `/service-areas/` index page acting as county hub.
- `commercial mole control [city]` — uncovered at city level. Decision: keep `/services/commercial-mole-control/` as the single commercial page with city call-outs, don't fork per-city.

---

## Page → Primary Keyword Map (Sitewide)

The canonical reference for downstream skills. Every existing page on got-moles.com gets a primary keyword and intent.

### Tier 1 — Authority pages (highest priority)

| Page URL | Primary keyword | Intent | Cluster | Current rank | Recommended H1 | Notes |
|---|---|---|---|---|---|---|
| `/` | **Yard mole control + mole exterminator Western Washington** (dual-anchor) | Commercial | mole-control | 19.1 (legacy host) | **"Yard Mole Control in Western Washington"** (Spencer P2.4) | **v1.1 update.** Previous current H1 was "Mole Control in Western Washington" — already corrected. Spencer recommends adding `Yard` prefix (lawn signal, Spencer P1 200-500 vol on `yard mole removal`) AND title tag should include `Exterminators` (Spencer P1 300-700 vol on `mole exterminator near me`). New title: `"Yard Mole Control & Exterminators in Western Washington \| Got Moles"`. Anchor-city seeding rule applies — name Seattle/Tacoma/Bellevue/Sammamish/Puyallup/Renton in first 200 words. |
| `/services/total-mole-control-program/` | Year-round mole control program | Commercial | mole-control | 15.1 | "Total Mole Control Program — Year-Round Mole Control in Western Washington" | Currently underranking. Add geo + clear primary KW |
| `/services/one-time-mole-removal/` | Professional mole removal Washington | Commercial | mole-control | 16.3 | "Professional Mole Removal in Western Washington" | AVOID `mole removal cost` as primary — derm hijack. Use `professional mole removal` |
| `/services/commercial-mole-control/` | Commercial mole control Washington | Commercial | mole-control | 10.4 | "Commercial Mole Control for Property Managers in Western Washington" | B2B; lean into "property manager" / "facilities" language per ICP segment 2 |
| `/how-to-get-rid-of-moles-in-your-yard/` | how to get rid of moles in your yard | Instruction | mole-control | 19.1 | "How to Get Rid of Moles in Your Yard: The Complete Guide" | Pillar of cluster 1. 19.1 is recoverable — internal-link audit + content refresh |
| `/voles-vs-moles-whats-the-difference/` | vole vs mole | Comparison | biology | 2.1 | "Voles vs Moles: How to Tell What's Tearing Up Your Lawn" | DEFEND — pillar of biology cluster |
| `/how-it-works/` | how mole trapping works | Process | mole-control | — | "How We Get Moles Out of Your Yard" | Process page — supports decision stage |
| `/about/` | Got Moles Spencer Hill mole specialist | Brand | — | — | "About Got Moles — Western Washington's Mole Specialists" | E-E-A-T; founder authority |

### Tier 2 — Supporting hubs

| Page URL | Primary keyword | Intent | Cluster | Notes |
|---|---|---|---|---|
| `/reviews/` | Got Moles reviews | Brand | — | Social proof page |
| `/reviews/commercial-case-studies/` | commercial mole control case studies | Decision | mole-control | B2B social proof |
| `/service-areas/` | mole control service areas Washington | Local | location-services | County/city hub |
| `/faq/` | mole control FAQ | Informational | — | (FAQ aggregated per recent commit fa72038) |
| `/contact/` | contact mole control company Washington | Commercial | — | |
| `/author/spencer/` | Spencer Hill mole specialist Washington | Brand / E-E-A-T | — | Author authority page |
| `/blog/` | mole control blog | Informational | — | Blog index |

### Tier 3 — City pages (93 total)

**Pattern.** Every `/mole-control-{city}/` page targets `mole control {city}` as primary, `mole removal {city}` and `mole trapper {city}` as secondary. H1 = `Mole Control in {City}, WA`. Title = `Mole Control in {City}, WA | Got Moles`.

**Tier A cities (12) — see "Priority cities" list above.** Treat as standalone pages with bespoke top-of-funnel intro and 3-5 neighbourhood call-outs. Already producing rankings (per agency tracker, 635 #1s sit largely in this tier).

**Tier B cities (~81) — templated.** Same primary KW pattern, lighter content depth, programmatic generation OK.

**P0 cleanup.** 11+ legacy `/mole-repellant-{city}/`, `/mole-control-{city}` (no trailing slash), `/{city}/` (bare slug), `/{city}-mole-extermination/` variants need 301s to canonical `/mole-control-{city}/` — see Cannibalisation notes in location-services cluster.

### Tier 3 — Blog posts (35 total — primary keyword per post)

#### Live posts (the original 7 + recently added)

| URL | Primary keyword | Cluster | Recommended action |
|---|---|---|---|
| `/blog/how-to-choose-a-mole-control-company/` | how to choose a mole control company | mole-control | Keep as-is |
| `/blog/diy-mole-removal-vs-professional/` | DIY mole control vs professional | diy-vs-pro | Update primaryKeyword from "DIY mole removal vs..." |
| `/blog/mole-removal-cost-washington/` | how much does mole removal cost in Washington | cost-value | Confirm Washington qualifier is in title-tag for derm disambiguation |
| `/blog/mole-control-safe-for-pets/` | is mole poison safe for dogs | safety | Update primaryKeyword from awkward "mole poison safe dogs" |
| `/blog/monthly-vs-one-time-mole-control/` | monthly mole control plan | cost-value | Conversion-support; low traffic expected |
| `/blog/when-are-moles-most-active-washington/` | when are moles most active | seasonal | Update primaryKeyword; keep WA in title-tag for disambiguation |
| `/blog/do-moles-come-back-after-trapping/` | do moles come back after trapping | diy-vs-pro | Renamed from "moles keep coming back" — actual search query |
| `/blog/are-moles-blind/` | are moles blind | biology | Consolidate with `/how-many-eyes-do-moles-have/` (cannibalisation) |
| `/blog/best-mole-traps/` | best mole traps | diy-vs-pro | Posture A reminder: silent on mechanism |
| `/blog/do-mole-repellents-work/` | do mole repellents work | diy-vs-pro | Includes sonic, ultrasonic, plants |
| `/blog/does-grub-control-stop-moles/` | does grub control stop moles | diy-vs-pro | Lift from pos 8.1 |
| `/blog/how-long-do-moles-live/` | how long do moles live | biology | Newer post — internal link from biology pillar |
| `/blog/how-to-find-active-mole-tunnels/` | how to find active mole tunnels | diy-vs-pro | Closes entire active-tunnel cluster gap |
| `/blog/humane-mole-removal/` | how to get rid of moles humanely | diy-vs-pro | Growing humane-search trend |
| `/blog/are-moles-good-for-your-yard/` | are moles good for the garden | biology | Balanced GEO-citation play |
| `/blog/mole-vs-vole-vs-gopher/` | mole vs vole vs gopher | biology | Newer post — lift via internal links |
| `/blog/types-of-moles-in-washington/` | types of moles in Washington state | biology | Consolidate with `/what-species-of-moles-live-in-washington-state/` |
| `/blog/what-do-moles-eat/` | what do moles eat | biology | Already covered by legacy `/what-do-moles-eat/` — cannibalisation |

#### Legacy-root posts (21 — high-equity, retain URLs)

These are the GSC traffic engines. Migrate-don't-redirect per `feedback_preserve_indexed_urls.md`.

| URL | Primary keyword | Cluster | GSC impressions (90d) | GSC position | Action |
|---|---|---|---|---|---|
| `/how-many-eyes-do-moles-have/` | do moles have eyes | biology | 65,549 | 2.5 | DEFEND; consolidate `/blog/are-moles-blind/` here |
| `/voles-vs-moles-whats-the-difference/` | vole vs mole | biology | 60,447 | 2.1 | DEFEND |
| `/how-deep-do-moles-dig/` | how deep do moles dig | biology | 39,158 | 4.5 | Push from 4.5 to <2 |
| `/what-do-mole-holes-look-like/` | what do mole holes look like | biology | 34,326 | 4.9 | Push from 4.9 to <2 |
| `/do-moles-bite/` | do moles bite | biology+safety | 26,350 | 2.8 | DEFEND |
| `/when-are-moles-most-active/` | when are moles most active | seasonal | 21,268 | 5.2 | Push from 5.2 |
| `/what-eats-moles/` | what eats moles | biology | 21,206 | 3.6 | Push from 3.6 |
| `/how-to-get-rid-of-ground-moles-with-vinegar/` | how to get rid of ground moles with vinegar | diy-vs-pro | 20,701 | 3.9 | DEFEND; honest myth-bust angle |
| `/is-a-mole-a-rodent/` | is a mole a rodent | biology | 18,490 | 3.8 | Push from 3.8 |
| `/moles-vs-gopher-mounds/` | mole vs gopher | biology | 17,924 | 3.2 | Push from 3.2 |
| `/do-moles-carry-diseases/` | do moles carry diseases | safety+biology | 17,790 | 5.1 | Push from 5.1 |
| `/what-do-moles-eat/` | what do moles eat | biology | 16,265 | 6.6 | Push from 6.6 |
| `/are-moles-nocturnal/` | are moles nocturnal | biology | 13,318 | 4.2 | Push from 4.2 |
| `/are-moles-venomous/` | are moles venomous | biology+safety | 10,401 | 2.8 | Push from 2.8 |
| `/do-moles-hibernate/` | do moles hibernate | seasonal | 7,344 | 5.5 | Push from 5.5 |
| `/do-moles-live-in-groups/` | do moles live in groups | biology | 5,588 | 3.5 | Modest defence |
| `/how-many-babies-do-moles-have/` | how many babies do moles have | biology | 5,517 | 5.6 | Push from 5.6 |
| `/why-do-moles-make-molehills/` | why do moles make molehills | biology | 5,363 | 6.0 | Push from 6.0 |
| `/are-moles-poisonous-or-venomous/` | are moles poisonous | biology+safety | 3,990 | 4.2 | Push from 4.2 |
| `/what-attracts-moles-to-your-yard/` | what attracts moles to your yard | biology+commercial | 3,457 | 5.0 | Push from 5.0 — high commercial bridge value |
| `/what-species-of-moles-live-in-washington-state/` | types of moles in Washington state | biology | 2,766 | 6.9 | Consolidate with `/blog/types-of-moles-in-washington/` |
| `/can-moles-swim/` | can moles swim | biology | 2,287 | 4.5 | Modest |

---

## Top 10 Gap Opportunities

High-leverage keywords NOT yet adequately targeted by any existing page (or under-served given commercial value).

| # | Query | Volume | Priority | Recommendation |
|---|---|---|---|---|
| 1 | `mole control cost` (geo-disambiguated) | M | P0 | Current cost post leans on `mole removal cost` — pivot primary KW to `mole control cost in Washington` to escape derm AI Overview hijack |
| 2 | `mole tunnels in yard` | M | P0 | Dedicated `/blog/mole-tunnels-explained/` post — covers active vs inactive, depth, how to spot. Consolidates 3-4 sub-queries currently split across `/how-deep-do-moles-dig/` + `/what-do-mole-holes-look-like/` |
| 3 | `professional mole trapping cost` / `lawn mole removal cost` | L (combined L+) | P0 | Disambiguation-safe cost variants. Add as H2 sections inside the cost pillar |
| 4 | `chemical free mole control [city]` | VL × 12 cities | P1 | Weave into every Tier-A city page intro as differentiator anchor |
| 5 | `mole control for pets` / `dog safe mole control` | L | P1 | The pet-safety post targets the danger angle (`is mole poison safe for dogs`); add a complementary positive-framing FAQ block targeting `pet safe` and `dog safe` queries |
| 6 | `Pierce County mole control` / `King County mole control` / `Snohomish County mole control` | VL each | P1 | County-level hub via `/service-areas/` page. Add county H2 sections |
| 7 | `commercial mole control HOA` / `mole control property manager` | VL each | P1 | Existing `/services/commercial-mole-control/` should target these as H2 sub-sections, not standalone pages |
| 8 | `Seattle mole exterminator` / `Tacoma mole exterminator` | L each | P1 | Tier-A city pages need `exterminator` as a secondary anchor in body copy — currently orphaned (e.g. `/mole-exterminators-seattle/` ranks #56 from a thin legacy URL) |
| 9 | `does flooding mole tunnels work` / `can you drown moles` | L | P2 | Fold into mole myths post (#7 in plan); 2-3 more L queries closed for ~600 extra words |
| 10 | `Townsend's mole` / `Pacific mole` / `shrew mole` | L each | P2 | WA species cluster — natural sub-pages of `/what-species-of-moles-live-in-washington-state/` (or an H2 per species) |

---

## Pillar designation per cluster

The 6 cluster pillars + 1 sitewide commercial pillar = 7 anchors for the hub-and-spoke topology:

| Cluster | Pillar URL | Why it's the pillar |
|---|---|---|
| **mole-control (head + commercial)** | `/how-to-get-rid-of-moles-in-your-yard/` | H-volume head term; already the de-facto cornerstone with 8+ inbound links |
| **biology** | `/voles-vs-moles-whats-the-difference/` | Highest impression count (60,447) and ranks 2.1; the AI Overview anchor for the species-comparison query family |
| **safety** | `/blog/mole-control-safe-for-pets/` | Anchors the chemical-free differentiator; ICP-critical objection coverage |
| **cost-value** | `/blog/mole-removal-cost-washington/` | Money-keyword cluster pillar; needs disambiguation discipline (Washington qualifier mandatory) |
| **seasonal** | `/when-are-moles-most-active/` | 21,268 imp pillar; year-round traffic + seasonal urgency hook |
| **diy-vs-pro** | `/blog/diy-mole-removal-vs-professional/` | Conversion-defence pillar; head decision-stage post |
| **location-services** | Homepage `/` + `/service-areas/` index | Local-pack engine; 93 city pages spoke off this hub |

---

## Hub-and-Spoke topology

Each cluster pillar gets 8-12 spoke pages internally linking back to it (per AI Overview citation research minimum thresholds for topical authority).

### Cluster 1: mole-control hub
- **Pillar:** `/how-to-get-rid-of-moles-in-your-yard/`
- **Spokes (10):** `/services/total-mole-control-program/`, `/services/one-time-mole-removal/`, `/services/commercial-mole-control/`, `/blog/how-to-choose-a-mole-control-company/`, `/blog/diy-mole-removal-vs-professional/`, `/blog/do-moles-come-back-after-trapping/`, `/blog/will-moles-go-away-on-their-own/` (planned), `/blog/what-attracts-moles-to-your-yard/` (legacy `/what-attracts-moles-to-your-yard/`), `/blog/humane-mole-removal/`, `/how-it-works/`

### Cluster 2: biology hub
- **Pillar:** `/voles-vs-moles-whats-the-difference/`
- **Spokes (12):** `/how-many-eyes-do-moles-have/`, `/how-deep-do-moles-dig/`, `/what-do-mole-holes-look-like/`, `/do-moles-bite/`, `/what-eats-moles/`, `/what-do-moles-eat/`, `/are-moles-nocturnal/`, `/are-moles-venomous/`, `/moles-vs-gopher-mounds/`, `/is-a-mole-a-rodent/`, `/why-do-moles-make-molehills/`, `/what-species-of-moles-live-in-washington-state/`

### Cluster 3: safety hub
- **Pillar:** `/blog/mole-control-safe-for-pets/`
- **Spokes (8):** `/do-moles-carry-diseases/`, `/are-moles-venomous/`, `/are-moles-poisonous-or-venomous/`, `/do-moles-bite/`, `/blog/dog-ate-mole-poison/` (planned), `/blog/are-moles-dangerous/` (planned), `/blog/mole-foundation-damage/` (planned), `/services/total-mole-control-program/` (chemical-free anchor)

### Cluster 4: cost-value hub
- **Pillar:** `/blog/mole-removal-cost-washington/`
- **Spokes (8):** `/services/total-mole-control-program/`, `/services/one-time-mole-removal/`, `/services/commercial-mole-control/`, `/blog/monthly-vs-one-time-mole-control/`, `/blog/how-to-choose-a-mole-control-company/`, `/blog/diy-mole-removal-vs-professional/`, `/how-it-works/`, `/reviews/`

### Cluster 5: seasonal hub
- **Pillar:** `/when-are-moles-most-active/`
- **Spokes (8):** `/do-moles-hibernate/`, `/are-moles-nocturnal/`, `/blog/mole-breeding-season/` (planned), `/what-attracts-moles-to-your-yard/`, `/how-many-babies-do-moles-have/`, `/blog/how-long-do-moles-live/`, `/services/total-mole-control-program/` (year-round CTA), `/blog/will-moles-go-away-on-their-own/` (planned)

### Cluster 6: diy-vs-pro hub
- **Pillar:** `/blog/diy-mole-removal-vs-professional/`
- **Spokes (12):** `/how-to-get-rid-of-ground-moles-with-vinegar/`, `/blog/best-mole-traps/`, `/blog/do-mole-repellents-work/`, `/blog/does-grub-control-stop-moles/`, `/blog/does-castor-oil-work-for-moles/` (planned), `/blog/mole-myths/` (planned), `/blog/how-to-find-active-mole-tunnels/`, `/blog/humane-mole-removal/`, `/blog/do-moles-come-back-after-trapping/`, `/blog/will-moles-go-away-on-their-own/` (planned), `/blog/are-moles-good-for-your-yard/`, `/services/one-time-mole-removal/`

### Cluster 7: location-services hub
- **Pillar:** `/` + `/service-areas/`
- **Spokes:** all 93 `/mole-control-{city}/` pages, plus `/services/*` and `/reviews/commercial-case-studies/`

**Linking rule:** every spoke links to its pillar in-content (not just nav/footer). Pillar links to every spoke via curated H2 sections. Cross-cluster links use natural anchor text — e.g. biology pages link DOWN to commercial pages via "Tired of dealing with mole damage? Here's how our [Total Mole Control Program] works year-round →".

---

## Refresh triggers

Re-run the keyword strategy when ANY of these occur:

1. **Quarterly cadence** — minimum every 90 days. Re-pull GSC export, refresh top-200 query table, identify new emerging queries.
2. **Voice-of-customer research wave lands** — if str-trending-research is run on Reddit/forums (currently skipped in v1.0), incorporate VoC language into FAQ and meta-description targets.
3. **New offering** — Spencer launches a new programme, commercial vertical, or service area. New page = new primary KW row in this doc.
4. **Significant GSC traction change** — any query moves >5 positions or any page gains/loses >50% impressions w-o-w. Investigate, re-prioritise.
5. **AI Overview shift** — if a target query starts surfacing AI Overviews where it didn't before (or stops), re-evaluate disambiguation language and entity signals.
6. **Cannibalisation cleanup completion** — once the 30+ duplicate URL variants are resolved, re-baseline.

---

## Methodology version log

- **v1.1 (2026-05-08)** — Spencer Hill research integration + Pixelmojo benchmark. Added: `mole exterminator` head term cluster (P0); `yard` parallel modifier to Rule 1 (alongside `lawn`); homepage H1/title update (`Yard Mole Control & Exterminators in Western Washington`); Brand Defense section (`got moles` defense vs Mole Patrol; `veteran owned mole control washington` ownership); anchor-city seeding rule (Seattle/Tacoma/Bellevue/Sammamish/Puyallup/Renton in first 200 words); Seasonality Calendar (Mar-May + Sep-Nov peaks; publish Feb + Aug); 6 blog GAP topics (PNW guide, mole damage repair, when-to-call, **WA legal AEO bait**, season calendar, best-time-to-call); `best mole control company` GAP page; 14 Tier A cities enriched with Spencer's competitor + page-quality + strategic notes; Competitor RAG section; species-page canonical resolved (`/blog/types-of-moles-in-washington/` wins per Spencer P1.1); canonical_facts frontmatter (92+ communities / 6 counties / 5,000 properties / 2017 / Spencer Hill / pricing) for hallucination correction.
- **v1.0 (2026-05-06)** — Initial post-launch foundation. Research-thin: no Reddit/forum VoC mining, no SERP scraping, no Wikidata entity-graph audit. Built from first-party GSC + agency rankings tracker + existing keyword-gap-analysis.md + search-intent-map.md + ICP + positioning. 6 cluster pillars + 1 sitewide commercial pillar designated. ~130 pages mapped to primary keywords. Brand-disambiguation strategy formalised with 6 clusters of medical/cosmetic queries to AVOID and 5 anchor-framing rules.

### v1.2 candidates (next refresh)

- Run str-trending-research on Reddit r/lawncare, r/landscaping, r/Seattle for current mole-discussion language; reconcile with Q3 search-intent-map
- Pull SERP samples for top 30 priority queries to capture ranked competitor titles + AI Overview citation patterns
- Wikidata entity audit for "Got Moles" — verify Q-id, sameAs links, knowledge-panel status
- Reconcile this doc with agency tracker's full 2,668-keyword export (currently sampled top-50)
- Add city-level priority cuts based on SpyFu/agency CPC data (where ad spend is most efficient = where organic is most valuable to defend)
- Validate Spencer's volume estimates against actual Google Keyword Planner pulls (Spencer notes are "calibrated estimates", not GKP numbers)
- Mid-June 2026 Pixelmojo re-baseline; if AEO 27/F → 50+ doesn't materialise, revisit cluster weights
