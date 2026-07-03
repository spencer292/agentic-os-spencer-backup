---
site: got-moles.com
page: /mole-control-seattle/
date: 2026-05-13
mode: first audit
tier: 3 (Tier A — Priority City #1, vol 300-600/mo, "hardest fight" per Spencer Battle Map)
page_score: 65.5/100 (D)
target: ≥75/100 (Tier 3 Tier-A city — treat as elevated; Spencer P1 Seattle is highest-volume Tier 3)
status: P1 NEEDS WORK — 65.5/D puts page well below Tier-A target. 5 P1 fixes + 4 P2 + 3 P3. Most fixes templated → propagate to all 93 city pages in one pass.
fixes_p1: 5
fixes_p2: 4
fixes_p3: 3
related_commits: 9348db5, c0a46f1 (trailing-slash flip 2026-05-13 — sitewide, this page benefits as link destination)
---

# Got Moles Seattle City Page Audit — `/mole-control-seattle/`

Tier 3 city page audit. Seattle is the **highest-volume city target** (300-600/mo, per target-keywords.md line 369 + Spencer Battle Map). Top competitors: Mole Patrol + Mole Masters. Spencer flags `mole exterminators seattle` (currently #56) as a "big lift opp." Audit reveals templated city-page pattern with strong foundations but several AEO-extractability + cluster-keyword gaps that limit the page below its competitive ceiling.

## Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` — location-services cluster (lines 346-422), Tier 3 city pattern (line 457), Brand-Disambiguation Rule 1, anchor-city seeding rule (line 90), Tier A Priority City #1 row (line 369), Coverage gaps row 8 (`Seattle mole exterminator` P1, line 534).

| Field | target-keywords.md says | Live (2026-05-13) | Match |
|---|---|---|---|
| Primary KW | `mole control Seattle` (Tier 3 city pattern, line 457) | "Mole Control in Seattle" in H1 + title carries "Seattle Mole Control" | ✅ |
| Recommended H1 | "Mole Control in {City}, WA" (line 457 pattern) | "Mole Control in Seattle" (no "WA" suffix) | ⚠️ close-variant — missing "WA" |
| Recommended title | "Mole Control in {City}, WA \| Got Moles" (line 457) | "Seattle Mole Control \| Proven Results \| Got Moles" (49 chars) | ⚠️ different framing — reverses noun order, adds "Proven Results", omits "WA" |
| Disambiguation Rule 1 (lawn / yard / exterminator / Washington / city / brand) | required where ambiguous root term targeted | H1 has "Seattle" (city signal) + brand via page; title has "Seattle" + "Got Moles" brand. No "yard"/"lawn"/"exterminator"/"WA" disambiguation | ⚠️ partial — city + brand only; lacking lawn/yard or "Washington" |
| Secondary cluster KWs (≥2 in H2/H3) | `mole removal Seattle`, `mole trapper Seattle`, `mole exterminator Seattle` per Tier 3 pattern (line 357-359) | H2s: "Why Moles Thrive in Seattle", "Moles in Seattle Neighborhoods", "How We Help Seattle Homeowners", "How It Works", "Seattle Mole Control FAQ", "Ready for Mole-Free Living in Seattle?". H3s: service-card titles + 4-step labels + footer cols. NONE carry `mole removal Seattle`, `mole trapper Seattle`, or `mole exterminator Seattle` as H2/H3 phrasing | ❌ MISSING — Seattle name in 5 H2s but no secondary cluster KW variation; particularly missing `mole exterminator Seattle` which Spencer flagged at #56 = P1 lift opp (line 534) |
| Queries-to-avoid scan | no "WA's #1", no I-713 claims, no "free inspection/quote/estimate" without context, no "the only mole-exclusive" | **"Free inspection. No obligation."** in CTAblock subtext (CityPage component line 364). Trust strip "219+ Five-Star Google Reviews" ✅ accurate | ⚠️ "Free inspection" — fact-correct (Spencer offers free inspection per ICP doc) but conflicts with "queries-to-avoid" hygiene; verify with Roy whether intentional |
| canonical_facts on page | 219+ five-star reviews ✅; nearly 5,000 clients ✅; 2017 founding ✅ | All 3 in hero trust strip + intro text + LocalBusiness schema | ✅ |
| Anchor-city seeding (NOT homepage rule; city-page neighbourhood seeding) | name distinct Seattle neighborhoods in body | Magnolia, Queen Anne, Wallingford, Ravenna, West Seattle, Lincoln Park, Rainier Valley, Ballard, Discovery Park, Carkeek named in whyMolesThrive + localDetails | ✅ rich neighborhood signal |

**Hallucination-correction status:** all canonical facts consistent with `authority-strategy.md` matrix. No drift.

## Live verification (Rule C)

Method: live HTML fetch + cross-reference `schema-extract-2026-05-13.json` Seattle row.

### Response

- Status 200, 94,386 bytes, `text/html; charset=utf-8`
- **No `Last-Modified` header** (Vercel SSG default — sitewide gap)
- Canonical: `https://got-moles.com/mole-control-seattle/` (trailing slash present post-flip ✅)

### Meta

- title 49 chars — under target 50-60 (lower-bound miss; can extend by 10-15 chars without truncation)
- description 132 chars — under target 150-160
- canonical aligned ✅
- og:title / og:description / og:image / twitter:card all present per `[citySlug]/page.tsx:54-71`

### Headings

- 1 H1 ✅ — "Mole Control in Seattle"
- **6 H2** (templated — uniform across all city pages): Why Moles Thrive in Seattle · Moles in Seattle Neighborhoods · How We Help Seattle Homeowners · How It Works · Seattle Mole Control FAQ · Ready for Mole-Free Living in Seattle?
- **10 H3**: 3 service-card titles · 4 process-step labels · 3 footer column titles
- No skipped levels ✅

### Schema (raw HTML JSON-LD parse via schema-extract-2026-05-13.json)

6 blocks emitted, all parse cleanly:

| # | @type | Notes |
|---|---|---|
| 1 | Organization | sameAs ×8, knowsAbout ×8, hasOfferCatalog ✅ |
| 2 | BreadcrumbList | "Mole Control in Seattle" item ✅ |
| 3 | LocalBusiness | aggregateRating 5.0/219 ✅ (per `cityLocalBusinessSchema`) |
| 4 | Service | name "Mole Control in Seattle", chemical-free description ✅ |
| 5 | FAQPage | 5 Q/A from `cityData.seattle.faqs` ✅ |
| 6 | WebPage | Speakable cssSelector `#geo-definition` ✅ (per `[citySlug]/page.tsx:194-207`) |

**Schema gaps vs Tier 1 ideal:**
- ❌ **No `dateModified` field on WebPage or Service** — sitewide city/services gap
- ❌ **No Article/AboutPage with `dateModified`** — city pages don't get Article schema (correct — they're service pages, not articles), but the WebPage block should carry dateModified for AI-engine freshness
- ❌ **No Person schema reference** — Spencer not surfaced on city pages even though "veteran-owned" is a brand pillar
- ❌ **No `parentOrganization` linkage** in cityLocalBusinessSchema — best-practice multi-location pattern would link the city LocalBusiness `@id` to Got Moles Organization `@id` (verify `cityLocalBusinessSchema` in `schema.tsx`)

### Images

Source: live HTML grep + `PageHero` component (referenced in `[citySlug]/page.tsx:174-183`).

- Hero `hero-king-county.webp` (county-level image for Seattle — King County map per line 142-148)
- Hero alt: `Professional mole control in Seattle, Washington` (descriptive, geo-tagged ✅)
- PageHero component likely emits `priority` for above-fold hero — verify in `src/components/PageHero.tsx` (not read this audit; assume per HeroBlock pattern)
- No image dimensions surfaced in raw HTML grep

### Internal links (live HTML count)

- **32 internal anchors, 22 unique destinations**
- Service pages: 3 (TMCP / OMP / Commercial via ServiceCards component)
- City pages (Tier 3 nearby cities, 6 nearest via `getNearestCities(slug, 6)`): 6 — Bellevue, Renton + 4 others (anchor format: "Mole Control in {City}" per `[citySlug]/page.tsx:347` — Zyppy 5× anchor-lift pattern ✅)
- Hub pages: 7 (about / contact / how-it-works / service-areas / reviews / faq / blog)
- `/service-areas` link ✅
- Self/nav: 3
- Footer columns

**Inbound link audit (cross-check with homepage):** Seattle is among the 12 city anchors on homepage serviceArea block + footer ✅. Also linked from /service-areas/ index page (assumed). Each nearby city page that has Seattle as one of its 6 nearest also points here.

### External links

- **0 external links** — no outbound to any authority anchor (WSU / WDFW / Seattle Times / Seattle Chamber / King County Master Gardener per `authority-strategy.md` Cluster 1 + Section 5)

### AEO content shape signals (live HTML grep)

- HTML tables: **0** — gap
- Ordered lists `<ol>`: **0** — gap (4-step "How It Works" is div-pattern not `<ol>`)
- Unordered lists `<ul>`: 3 / 15 `<li>` — footer nav + small lists
- No stat block on city page (Pillar 4 + Pillar 7 lift opportunity — "92+ communities, 219+ reviews, nearly 5,000 clients" callouts would extract well)
- BLUF answer-first: `intro` paragraph from `cityData.seattle.intro` answers "professional mole control in Seattle" in ~70 words ✅
- Question-format H2s: 1 ("Why Moles Thrive in Seattle" — declarative, not Q). FAQ block has 5 Q-form Q's inside but H2 itself is "Seattle Mole Control FAQ" (declarative). Could be stronger.
- Verified-fact callout: trust strip in hero `["219+ Five-Star Google Reviews", "Chemical-Free", "Proven Results"]` ✅

## Three-Layer SoT (Rule A)

| Layer | State |
|---|---|
| Live render | got-moles.com/mole-control-seattle/ 2026-05-13, 6 JSON-LD blocks per schema-extract |
| HEAD | post-trailing-slash flip `9348db5` + `c0a46f1`. `[citySlug]/page.tsx` last touched in flip series (verify via git log if pursuing fixes); `city-data.ts` clean since seed |
| Working tree | `_audit-tools/` script edits only; no `[citySlug]/page.tsx` or `city-data.ts` divergence |
| CMS layer | **City pages are NOT CMS-backed** — they render from static `cityData[]` in `src/lib/city-data.ts` (no Payload seed required) per `[citySlug]/page.tsx:4` + line 125 import. Changes are code-only, no reseed step. |

Live = HEAD = source: ✅ aligned.

## Pillar scores

| # | Pillar | Wt | Score | Weighted | Evidence anchor | Notes |
|---|---|---:|---:|---:|---|---|
| 1 | Headings | 20% | 14/20 | 14.0 | Foundation-doc row 5 | H1 close-variant match (missing "WA" suffix per template) −1; **NO H2/H3 carries secondary cluster KW** (`mole removal Seattle` / `mole exterminator Seattle` / `mole trapper Seattle`) — 6 H2s all use generic Seattle phrasing, missing the lift on `mole exterminator seattle` which Spencer specifically flagged at #56 (P1 lift opp per line 534). Single H1 ✅, no skipped levels ✅, disambiguation partial. |
| 2 | Meta + Canonical | 10% | 7/10 | 7.0 | Live meta extract | Title 49 chars — under target lower-bound (50-60); description 132 chars — under target lower-bound (150-160); canonical aligned post-flip ✅; OG/Twitter complete ✅. Title also missing "WA" disambiguation + cluster secondary KWs. **−3 total** for title/desc length + KW gaps. |
| 3 | Schema | 15% | 11/15 | 11.0 | Live verification table above | 6 blocks valid (Org / Breadcrumb / LocalBusiness w/aggRating / Service / FAQPage / WebPage Speakable); city LocalBusiness w/ aggregateRating ✅; FAQPage with 5 Q/A ✅. **Gaps:** no `dateModified` on WebPage/Service (−1.5), no Person schema reference (−1), no `parentOrganization` linkage on city LocalBusiness (−1.5). |
| 4 | Content AEO | 20% | 13/20 | 13.0 | Live AEO grep | BLUF answer-first ✅, 5-item FAQ ✅, neighborhood detail rich ✅, verified-fact callouts in hero trust strip ✅. **Gaps:** 0 tables (−1.5), 0 ordered lists (4-step process as div) (−1.5), no StatBlock (−1.5), only 1 Q-format H2 inline (−1), one of 5 FAQ Qs ("Is mole trapping legal in Washington?") — answer doesn't cite WSU/WDFW (missed Cluster-1 authority co-citation, −1.5). |
| 5 | Internal Links | 15% | 11/15 | 11.0 | Live link count + `[citySlug]/page.tsx` source | 32 internal, 22 unique. 6 nearest-city links use "Mole Control in {City}" exact-match anchors (Zyppy 5× pattern ✅). Service-card links to TMCP/OMP/Commercial ✅. **Gaps:** 0 outbound to authority anchors (Cluster 1 → WSU/WDFW/King County Master Gardener) (−2); no inbound link from `/how-to-get-rid-of-moles-in-your-yard/` (cluster pillar) — verify in str-internal-links audit (−1); no link to cluster pillar from this page body (−1). |
| 6 | Images | 5% | 4/5 | 4.0 | Live img grep + PageHero pattern | Hero `hero-king-county.webp` (county-level reuse — Seattle gets generic King County image, not Seattle-specific) — acceptable but reduces image-relevance signal; alt descriptive ✅; PageHero likely sets `priority` per component pattern (not verified this run). **−1 for unverified `priority` attr + county-level image (not Seattle-specific)** |
| 7 | E-E-A-T | 10% | 4/10 | 4.0 | Live HTML; `authority-strategy.md` Sec 2 | LocalBusiness schema founder ref via Organization (transitive) ✅; **Gaps:** no Spencer named on page body (no veteran-credential surface, no Person schema reference), no founder quote, no author byline (city pages aren't authored), 0 outbound to authority anchors (WSU/Seattle Times/Chamber per Sec 2 Cluster 1+5; HUGE miss for the highest-volume Tier 3 page), no named-technician for Seattle service. |
| 8 | Freshness | 5% | 1.5/5 | 1.5 | Live schema + visible string | **Gaps:** no `dateModified` on WebPage or Service schema (−1.5); no `Last-Modified` HTTP header (−1); no visible "Last updated" string in UI (−1); disambiguation H1 missing "WA" suffix (−0). Cumulative: 5 − 4 = 1, plus 0.5 for the city signal in H1 = 1.5. |
|   | **TOTAL** | 100% | | **65.5** | | …recalculating below |

### Score correction

Recomputing pillar weighted sums explicitly to avoid arithmetic drift:

| Pillar | Raw / Max | × Weight | Weighted |
|---|---|---|---|
| 1 Headings | 14/20 (3.5 sig of 5) → ratio 0.70 | × 20 | 14.0 |
| 2 Meta | 7/10 (3.5 sig of 5 weighted) → ratio 0.70 | × 10 | 7.0 |
| 3 Schema | 11/15 (≈5.87 sig of 8) → ratio 0.733 | × 15 | 11.0 |
| 4 Content AEO | 13/20 (4.55 sig of 7) → ratio 0.65 | × 20 | 13.0 |
| 5 Internal Links | 11/15 (3.67 sig of 5) → ratio 0.733 | × 15 | 11.0 |
| 6 Images | 4/5 (4.8 sig of 6) → ratio 0.80 | × 5 | 4.0 |
| 7 E-E-A-T | 4/10 (2 sig of 5) → ratio 0.40 | × 10 | 4.0 |
| 8 Freshness | 1.5/5 (1.2 sig of 4) → ratio 0.30 | × 5 | 1.5 |
| **TOTAL** | | | **65.5** |

Wait — I need to scale the per-pillar score within its own max. Re-checking: per `audit-checklist.md`, each pillar score is `(sum / max_signals) × weight`. The pillar scores I assigned in the notes column are already in weighted form (out of weight). Let me re-verify by summing weighted scores:

14.0 + 7.0 + 11.0 + 13.0 + 11.0 + 4.0 + 4.0 + 1.5 = **65.5/100 (D — Poor)**

That's substantially below the prior estimate. Adjusting verdict: **Seattle page scores 65.5/100 (D)** — well below Tier 3 Tier-A target. **This is a P1 page**, not P2. The gap is concentrated in Pillars 7 (E-E-A-T, 4/10) and 8 (Freshness, 1.5/5) plus Pillar 4 (AEO content shape, 13/20).

**Re-correcting frontmatter:** page_score 65.5/100 (D). Status: P1 NEEDS WORK. (Frontmatter at top of file will be updated by save.)

### Final verdict

**Score: 65.5/100 (D).** Tier 3 Tier-A target ≥75 for Spencer P1 priority city; gap 9.5 points. The page is structurally sound (templated, schema mostly valid, BLUF + neighborhood content rich) but missing the high-leverage AEO signals that would convert this from "templated city page" to "extractable AI-engine answer source" for `mole control seattle` + the P1 lift opp `mole exterminator seattle`.

## Per-page link plan

| Type | Present | Missing | Anchor candidates (from target-keywords.md) |
|---|---|---|---|
| Inbound (related cluster) | Homepage serviceArea + footer ✅; nearest 5 city pages link via `getNearestCities` ✅ | `/how-to-get-rid-of-moles-in-your-yard/` cluster pillar should link to Seattle as Tier 3 city example (or footer-style cluster→city anchor) | "Mole Control Seattle" / "Seattle Mole Removal" |
| Outbound to authority anchor | **0** — Cluster 1+7 Sec 2 names WSU, WDFW, King County Master Gardener; none cited | Add 1-2 inline outbounds: (a) WSU on Townsend's-mole soil-moisture claim in whyMolesThrive; (b) Seattle Chamber / King County Master Gardener for local credibility | "WSU Extension's Mole Management in Washington Backyards" / "King County Master Gardener" |
| Outbound to internal cluster pillars | TMCP / OMP / Commercial via ServiceCards ✅; `/service-areas` ✅ | `/how-to-get-rid-of-moles-in-your-yard/` (Cluster 1 pillar) NOT linked from body | "how to get rid of moles in your yard" / "complete guide" |
| Outbound to neighborhood / authority surfaces | none | Could link Seattle neighborhood references (Magnolia, Queen Anne, Wallingford) out to Seattle Magazine / Seattle Times local-coverage URLs for E-E-A-T (defer, lower priority) | — |
| Anchor diversity | Nearest-city anchors use Zyppy "Mole Control in {City}" exact-match ✅; service-card anchors templated; footer concise | Inbound from homepage uses bare "Seattle" — could be "Mole Control Seattle" but balance against anchor-diversity rule (variation across inbound URLs is healthy) | — |

## Per-page fix list

| P | Pillar | Gap | Recommended fix | File / surface |
|---|---|---|---|---|
| **P1** | 7 E-E-A-T | 0 outbound to authority anchor on Spencer P1 highest-volume Tier-A city. Cluster 1 + Sec 2 require ≥1 (WSU/WDFW/King County Master Gardener). | Add 1-2 inline outbound links: (a) cite WSU Extension's Mole Management in Washington Backyards in `whyMolesThrive` paragraph on the "Townsend's mole / earthworm" claim; (b) optionally cite King County Master Gardener for local-credibility on soil/lawn claim. Anchor format: descriptive, value-driven (per `feedback_outbound_links_must_earn_their_place.md` — must earn placement) | `src/lib/city-data.ts` `cityData.seattle.whyMolesThrive` (extend prose to support WSU citation) + render outbound in component — OR introduce a templated `cityData.{slug}.authorityCitations[]` field rendered by `[citySlug]/page.tsx` so all city pages can carry per-city authority citations consistently |
| **P1** | 4 Content AEO + 1 Headings | No H2/H3 carries `mole exterminator Seattle` — Spencer P1 lift opp at #56 (line 534). Pages currently uniform city H2 templates missing per-city KW variation | Add a dedicated H2 with the cluster secondary KW: e.g. "Seattle Mole Exterminator Services — What's Included" or "Working with a Mole Exterminator in Seattle". Place between "How We Help Seattle Homeowners" and "How It Works". This is a templated change applicable sitewide to all 93 city pages but Seattle is Tier-A P1. | `src/app/(frontend)/[citySlug]/page.tsx` — add new section block driven by cluster secondary-KW template OR add `cityData.{slug}.exterminatorBlock` field with city-specific copy + render in component |
| **P1** | 4 Content AEO + 8 Freshness | No `dateModified` on WebPage or Service schema; no visible "Last updated" string. Freshness pillar at 1.5/5 floor. | Add `dateModified` field to WebPage + Service schema (city-data.ts can carry a `lastUpdated` field per city; default to current date). Render visible "Last updated {Month YYYY}." string near FAQ block (same pattern as homepage). | `src/lib/schema.tsx` `cityLocalBusinessSchema` + `serviceSchema` builders (add `dateModified` param); `src/app/(frontend)/[citySlug]/page.tsx` add visible string + pass dateModified |
| **P1** | 4 Content AEO + 5 Internal Links | Title 49 chars (under target), missing "WA" disambiguation + Spencer P1 KW "exterminator" | Update title pattern in `[citySlug]/page.tsx:55` from `"{cityName} Mole Control \| Proven Results"` to `"Mole Control & Exterminators in {cityName}, WA \| Got Moles"` (~58 chars for Seattle). Extends to all 93 city pages — templated. | `src/app/(frontend)/[citySlug]/page.tsx` generateMetadata `title` template |
| **P1** | 4 Content AEO + 7 E-E-A-T | "Is mole trapping legal in Washington?" FAQ answer (city-data line 56) doesn't cite WSU/WDFW — missed Cluster 1+3 authority co-citation on a P1 G4 query (target-keywords.md line 340) | Extend Bellevue's existing FAQ answer + Seattle's if added to be Q5-aligned to cite WDFW on regulatory framing. Or add WDFW link inline. Seattle's `cityData.seattle.faqs` currently has 5 Qs, none matching this Q. **Add the legal-trapping FAQ Q to Seattle (matching Bellevue's Q4)** and cite WDFW. | `src/lib/city-data.ts` `cityData.seattle.faqs` — add Q on WA legal trapping with WDFW citation |
| P2 | 2 Meta | Description 132 chars (under 150-160 target) | Extend description by 20-25 chars: `"Professional yard mole control in Seattle, WA. Veteran-owned, chemical-free trapping. Nearly 5,000 clients served across Western Washington since 2017. Call (253) 750-0211."` (159 chars). Templated for all city pages. | `src/app/(frontend)/[citySlug]/page.tsx` generateMetadata `description` template |
| P2 | 3 Schema | No `parentOrganization` linkage on cityLocalBusinessSchema | Update `cityLocalBusinessSchema` to include `parentOrganization: { '@id': 'https://got-moles.com/#organization' }`. Multi-location best practice per `authority-strategy.md` Section 10. | `src/lib/schema.tsx` `cityLocalBusinessSchema` builder |
| P2 | 4 Content AEO | 4-step "How It Works" rendered as div pattern, not `<ol>` (line 280-294) | Convert to semantic `<ol>` markup. AEO extractability lift. Templated across all city pages. | `src/app/(frontend)/[citySlug]/page.tsx` lines 274-304 |
| P2 | 4 Content AEO | No StatBlock on city page; 92+ communities / nearly 5,000 clients / 8 years / 0 chemicals would extract well | Add a sitewide StatBlock to city template, below "How It Works" or above CTABlock. Reuses homepage stats. | `src/app/(frontend)/[citySlug]/page.tsx` — add StatBlock section |
| P3 | 6 Images | Hero is county-level (`hero-king-county.webp`), not Seattle-specific | Source / produce a Seattle-specific hero image (skyline + lawn / Magnolia bluff / Discovery Park edge). Defer — county-level is acceptable trade-off vs design lift. | `public/images/hero-seattle.webp` + `cityData.seattle` override field |
| P3 | 1 Headings | H1 "Mole Control in Seattle" missing "WA" suffix per Tier 3 template (line 457) | Update `[citySlug]/page.tsx:138` `headline` template from `"Mole Control in ${cityName}"` to `"Mole Control in ${cityName}, WA"`. Applies sitewide. | `src/app/(frontend)/[citySlug]/page.tsx:138` |
| P3 | 4 Content AEO | "Free inspection. No obligation." in CTABlock subtext — borderline queries-to-avoid hygiene (fact-correct but uses one of the flagged phrases) | Verify with Roy whether intentional. If conflicting with target-keywords.md hygiene rule, change to "Schedule your property assessment" or similar. Defer until clarified. | `src/app/(frontend)/[citySlug]/page.tsx:364` |

### Score recovery projection

Applying the 5 P1 fixes:
- Pillar 1: 14 → 16 (+2 for exterminator H2)
- Pillar 2: 7 → 8.5 (+1.5 for title with "WA" + exterminator)
- Pillar 4: 13 → 17.5 (+2 dateModified-flavored AEO, +1.5 WDFW FAQ citation, +1 added stat/H2 content)
- Pillar 7: 4 → 7 (+3 for WSU outbound + WDFW citation)
- Pillar 8: 1.5 → 4 (+2.5 for dateModified + visible string)

**Projected post-P1: 79.5/100 (B-).** Clears Tier 3 Tier-A target ≥75.

Adding P2 (description length + parentOrganization + `<ol>` + StatBlock): **~85/100 (B).**

Note: most P1 fixes are templated — apply once in `[citySlug]/page.tsx` + `cityData` schema, propagate to all 93 city pages. Single template change = sitewide lift across the highest-rank-equity cluster.

## Apply-mode handoff

**Templated fixes — apply once, propagate to 93 city pages.** Suggested commit clusters:

**Commit 1 — Template title/desc/H1 + visible last-updated string:**
1. Update title template: `Mole Control & Exterminators in {city}, WA | Got Moles`
2. Update description template (159 chars)
3. Update H1 template: `Mole Control in {city}, WA`
4. Add visible "Last updated {Month YYYY}" string near FAQ
5. Build → push (no reseed — city pages are not CMS-backed)

**Commit 2 — Per-city authority citation field:**
6. Add `cityData[].authorityCitations[]` field shape (e.g. `{anchor: string, url: string, claim: string}`)
7. Populate Seattle with WSU citation in whyMolesThrive
8. Render in component template via inline-link injection in the appropriate prose block
9. Add same data field for Bellevue + Tacoma + Enumclaw (top-priority cities) — defer remaining cities

**Commit 3 — Exterminator H2 + cluster KW variation:**
10. Add `cityData[].exterminatorBlock` field (string heading + paragraph)
11. Populate Seattle + Bellevue + Tacoma (Spencer P1 cities)
12. Render between "How We Help" and "How It Works"

**Commit 4 — Schema dateModified + parentOrganization + ordered list + StatBlock:**
13. Update `cityLocalBusinessSchema` + `serviceSchema` builders to accept + emit `dateModified`
14. Add `parentOrganization` linkage in cityLocalBusinessSchema
15. Convert 4-step process block to `<ol>` markup
16. Add StatBlock section to city template

**Commit 5 — WA legal trapping FAQ (Seattle + cities missing it):**
17. Add legal-trapping Q+A to seattle FAQ array (matches Bellevue's existing Q4) with WDFW citation

**Verification after each commit:** WebFetch + raw HTML extractor on `/mole-control-seattle/` (and Bellevue/Tacoma). Expect schema block count to remain 6 but field completeness to climb; H2 count to climb from 6 → 8 (+exterminator block, +StatBlock heading).

## Self-check (Rule G)

- [x] Foundation-doc lookup table present (8 rows)
- [x] Live verification section present (schema 6 blocks parsed, raw-HTML link/AEO count, component path noted)
- [x] Three-Layer SoT section present
- [x] Pillar scores reference evidence sections
- [x] Per-page fix list with explicit file paths (5 P1 + 4 P2 + 3 P3)
- [x] Apply-mode handoff with commit sequencing

Report passes self-check. **Note: page_score corrected from 73.5 to 65.5/D during pillar arithmetic verification in-line. Frontmatter reflects final value.**
