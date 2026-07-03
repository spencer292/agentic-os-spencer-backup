---
site: got-moles.com
page: /mole-control-bellevue/
date: 2026-05-13
mode: first audit
tier: 3 (Tier A — Priority City #2, vol 100-250/mo, "highest-value commercial market in WA" per Spencer Battle Map; ALSO paid LP target)
page_score: 67.0/100 (D+)
target: ≥75/100 (Tier 3 Tier-A city + paid LP — elevated standard; quality score affects paid CPC)
status: P1 NEEDS WORK — 67.0/D+ puts page well below Tier-A target and below paid-LP quality threshold. 5 P1 fixes + 4 P2 + 3 P3. Most fixes templated → applies sitewide.
fixes_p1: 5
fixes_p2: 4
fixes_p3: 3
related_commits: 9348db5, c0a46f1 (trailing-slash flip 2026-05-13 — sitewide; this page is a paid-LP destination so canonical hygiene matters extra)
---

# Got Moles Bellevue City Page Audit — `/mole-control-bellevue/`

Tier 3 city page audit. Bellevue is the **highest-value commercial market in WA** per Spencer Battle Map (line 370), Priority City #2 (vol 100-250/mo), AND a **Google Ads paid landing page target** per `reference_got_moles_paid_search_project.md`. The paid-LP duty raises the quality bar: Google Ads Quality Score correlates with landing-page experience (Pillar 4 + Pillar 6 most). Bellevue's audit shape mirrors Seattle's templated city pattern — most gaps are sitewide-template gaps surfacing on both pages.

## Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` — location-services cluster (lines 346-422), Tier 3 city pattern (line 457), Brand-Disambiguation Rule 1, Tier A Priority City #2 row (line 370 — "Highest-value commercial market in WA"), Coverage gaps row 8 (`Bellevue mole exterminator` implied by P1 pattern, line 534).

| Field | target-keywords.md says | Live (2026-05-13) | Match |
|---|---|---|---|
| Primary KW | `mole control Bellevue` (Tier 3 city pattern, line 457) | "Mole Control in Bellevue" in H1; title "Bellevue Mole Control" | ✅ |
| Recommended H1 | "Mole Control in {City}, WA" (line 457 pattern) | "Mole Control in Bellevue" (no "WA" suffix) | ⚠️ close-variant — missing "WA" |
| Recommended title | "Mole Control in {City}, WA \| Got Moles" (line 457) | "Bellevue Mole Control \| Proven Results \| Got Moles" (50 chars) | ⚠️ different framing — reverses noun order, adds "Proven Results", omits "WA" |
| Disambiguation Rule 1 (lawn / yard / exterminator / Washington / city / brand) | required where ambiguous root term targeted | H1 has "Bellevue" + brand via page; title has "Bellevue" + "Got Moles". No "yard"/"lawn"/"exterminator"/"WA" disambiguation | ⚠️ partial — city + brand only |
| Secondary cluster KWs (≥2 in H2/H3) | `mole removal Bellevue`, `mole trapper Bellevue`, `mole exterminator Bellevue` per Tier 3 pattern | 6 H2s all use generic Bellevue phrasing: "Why Moles Thrive in Bellevue", "Moles in Bellevue Neighborhoods", "How We Help Bellevue Homeowners", "How It Works", "Bellevue Mole Control FAQ", "Ready for Mole-Free Living in Bellevue?". H3s = service-card / process / footer templated. NONE carry `mole removal Bellevue`, `mole trapper Bellevue`, `mole exterminator Bellevue` | ❌ MISSING — same sitewide-template gap as Seattle |
| Queries-to-avoid scan | no "WA's #1", no I-713 claims, no "free inspection/quote/estimate" without context | **"Free inspection. No obligation."** in CTAblock subtext (same template). Trust strip "219+ Five-Star Google Reviews" ✅ accurate | ⚠️ same as Seattle — "Free inspection" is fact-correct but conflicts with hygiene rule; verify with Roy |
| Commercial-market signal (Spencer note: "highest-value commercial market in WA") | Bellevue page should make commercial signal stronger than other cities | Generic city template — no commercial-focused content blocks. Tech / wealthy / commercial-property cues absent (only consumer/homeowner framing in `intro` + `whyMolesThrive`) | ❌ MISSING — Bellevue's commercial-market opportunity not surfaced |
| canonical_facts | 219+ reviews, ~5,000 clients, founded 2017 | All present in hero trust strip + intro + LocalBusiness schema | ✅ |
| Neighborhood seeding | name distinct Bellevue neighborhoods in body | Somerset, Bridle Trails, Crossroads, Newport Hills, Eastgate, Wilburton, Coal Creek, Cougar Mountain, Lake Washington named in `whyMolesThrive` + `localDetails` | ✅ rich neighborhood signal |
| Paid-LP suitability checks | Google Ads landing-page experience: relevance, trustworthiness, usability | Page is on-topic ✅, has aggregateRating ✅, has phone + contact form via CTABlock ✅, no obvious trust friction. But missing structured proof elements (no StatBlock, no Service-tier pricing transparency above-fold for Bellevue-specific commercial framing) | ⚠️ pass for retail, weak for commercial-property-manager intent that the page targets |

**Hallucination-correction status:** all canonical facts consistent. No drift.

## Live verification (Rule C)

Method: live HTML fetch + cross-reference `schema-extract-2026-05-13.json` Bellevue row.

### Response

- Status 200, 95,776 bytes, `text/html; charset=utf-8`
- **No `Last-Modified` header** (Vercel SSG default)
- Canonical: `https://got-moles.com/mole-control-bellevue/` (trailing slash post-flip ✅)

### Meta

- title 50 chars — at lower bound of 50-60 target
- description 133 chars — under target 150-160 (under-bound)
- canonical aligned ✅
- og:title / og:description / og:image / twitter:card all present per template

### Headings

- 1 H1 ✅ — "Mole Control in Bellevue"
- **6 H2** (uniform templated): Why Moles Thrive in Bellevue · Moles in Bellevue Neighborhoods · How We Help Bellevue Homeowners · How It Works · Bellevue Mole Control FAQ · Ready for Mole-Free Living in Bellevue?
- **10 H3**: 3 service-card titles · 4 process-step labels · 3 footer columns
- No skipped levels ✅

### Schema (raw HTML JSON-LD parse via schema-extract-2026-05-13.json)

6 blocks emitted, all parse cleanly (identical pattern to Seattle):

| # | @type | Notes |
|---|---|---|
| 1 | Organization | sameAs ×8, knowsAbout ×8, hasOfferCatalog ✅ |
| 2 | BreadcrumbList | "Mole Control in Bellevue" item ✅ |
| 3 | LocalBusiness | aggregateRating 5.0/219 ✅ |
| 4 | Service | "Mole Control in Bellevue", chemical-free description ✅ |
| 5 | FAQPage | 5 Q/A from `cityData.bellevue.faqs` (includes the legal-trapping Q citing "Washington state wildlife regulations" generically — DOESN'T cite WDFW by name; missed Cluster 1+3 co-citation) |
| 6 | WebPage | Speakable cssSelector `#geo-definition` ✅ |

**Schema gaps (same as Seattle — sitewide template gaps):**
- ❌ No `dateModified` on WebPage or Service
- ❌ No Person schema reference
- ❌ No `parentOrganization` linkage in cityLocalBusinessSchema

### Images

- Hero `hero-king-county.webp` (county-level reuse — Bellevue gets generic King County image)
- Hero alt: `Professional mole control in Bellevue, Washington` ✅ descriptive
- PageHero likely sets `priority` (verify in `PageHero.tsx`)

### Internal links (live HTML count)

- **32 internal anchors, 22 unique destinations** (identical structure to Seattle)
- Service pages: 3 (TMCP / OMP / Commercial via ServiceCards)
- Nearby city pages: 6 ("Mole Control in Kirkland", "Mole Control in Sammamish", + 4 others — Zyppy exact-match pattern ✅)
- Hub pages: 7 (about / contact / how-it-works / service-areas / reviews / faq / blog)
- `/service-areas` link ✅
- Self/nav + footer: 3

**Inbound:** Bellevue is one of the 12 city anchors on homepage serviceArea + footer ✅. Inbound from Kirkland (line 80 cityData), Sammamish (assumed), and other neighbors via `getNearestCities`.

### External links

- **0 external links** — no outbound to authority anchors (same as Seattle)

### AEO content shape signals

- HTML tables: **0**
- Ordered lists `<ol>`: **0** (4-step "How It Works" div pattern)
- Unordered lists `<ul>`: 3 / 15 `<li>`
- No StatBlock
- BLUF answer-first: `intro` paragraph (~70 words on Bellevue commercial value framing) ✅
- Question-format H2s: 1 (one of the 6 is FAQ heading "Bellevue Mole Control FAQ" — declarative); 5 FAQ Q's inside are Q-form
- Verified-fact callout: trust strip ✅
- **Commercial-property cues:** the Bellevue `intro` references "Bridle Trails properties, with their larger lots and pastureland", "high property values" — but no commercial-segment-specific content block (no callout to property managers, HOAs, school districts — even though Bellevue is the "highest-value commercial market"). Generic homeowner-only framing.

## Three-Layer SoT (Rule A)

| Layer | State |
|---|---|
| Live render | got-moles.com/mole-control-bellevue/ 2026-05-13, 6 JSON-LD blocks per schema-extract |
| HEAD | post-trailing-slash flip `9348db5` + `c0a46f1`. `[citySlug]/page.tsx` + `city-data.ts` last touched in seed sweep |
| Working tree | clean for city pages; `_audit-tools/` only |
| CMS layer | **Not CMS-backed** — renders from `cityData.bellevue` in `src/lib/city-data.ts` (lines 41-61). Code-only changes; no reseed step. |

Live = HEAD = source: ✅ aligned.

## Pillar scores

| # | Pillar | Wt | Score | Weighted | Evidence anchor | Notes |
|---|---|---:|---:|---:|---|---|
| 1 | Headings | 20% | 14/20 | 14.0 | Foundation-doc row 5 | H1 close-variant (missing "WA") −1; NO H2/H3 carries secondary cluster KW (`mole exterminator Bellevue` / `mole removal Bellevue` / `mole trapper Bellevue`) — uniform-template gap; commercial-market signal not in any H2 (Spencer P1 cue). Single H1 ✅, no skipped levels ✅. |
| 2 | Meta + Canonical | 10% | 7.5/10 | 7.5 | Live meta extract | Title 50 chars (at lower bound, OK); description 133 chars (under bound by ~20); canonical aligned post-flip ✅; OG/Twitter complete ✅. Missing "WA" + Spencer P1 KW "exterminator" in title (paid-LP relevance hit). |
| 3 | Schema | 15% | 11/15 | 11.0 | Live verification table | 6 blocks valid; LocalBusiness aggregateRating ✅; FAQPage with 5 Q/A ✅; Speakable ✅. Same template gaps as Seattle: no dateModified (−1.5), no Person ref (−1), no parentOrganization (−1.5). |
| 4 | Content AEO | 20% | 13/20 | 13.0 | Live AEO grep | BLUF ✅; 5-item FAQ ✅; rich neighborhood detail ✅; trust strip ✅. **Gaps:** 0 tables (−1.5), 0 ordered lists (4-step process as div) (−1.5), no StatBlock (−1.5), only 1 Q-form H2 (−1), legal-trapping FAQ answer doesn't cite WDFW by name (−1.5) — missed Cluster 1+3 authority co-citation. |
| 5 | Internal Links | 15% | 11/15 | 11.0 | Live link count + `[citySlug]/page.tsx` source | 32 internal, 22 unique. 6 nearest-city links with Zyppy exact-match anchors ✅. Service-card links ✅. Same gaps as Seattle: 0 outbound authority (−2); no link to `/how-to-get-rid-of-moles-in-your-yard/` cluster pillar (−1); inbound from Kirkland + homepage but no link from Cluster 1 pillar (−1). |
| 6 | Images | 5% | 4/5 | 4.0 | Live img grep + PageHero pattern | Same as Seattle — county-level hero, alt descriptive, `priority` unverified at runtime. −1 for unverified `priority` + non-city-specific image. |
| 7 | E-E-A-T | 10% | 4.5/10 | 4.5 | Live HTML; `authority-strategy.md` Sec 2 | LocalBusiness aggRating ✅; founder ref transitive via Org ✅. **Gaps:** Spencer not named on page; no veteran credential surface (relevant on commercial market where credentials matter for property-manager decisions); 0 outbound to authority anchors (WSU/WDFW/Bellevue Chamber/King County Master Gardener per Sec 2 + 5); no named-technician; **commercial-segment proof missing** — for "highest-value commercial market", page should surface commercial case studies / property-manager testimonials / commercial Service tier prominence. +0.5 vs Seattle for `intro` framing that mentions commercial property values, but execution thin. |
| 8 | Freshness | 5% | 2/5 | 2.0 | Live schema + visible string | No `dateModified` (−1.5), no Last-Modified header (−1), no visible "Last updated" string (−1), disambiguation H1 missing "WA" (0.5 deducted via H1 partial signal). |
|   | **TOTAL** | 100% | | **67.0** | | **D+ — below Tier-A target ≥75 by 8 points; below paid-LP quality threshold** |

### Pillar arithmetic check

14.0 + 7.5 + 11.0 + 13.0 + 11.0 + 4.0 + 4.5 + 2.0 = **67.0/100**

### Delta vs Seattle (same date, same template)

Bellevue 67.0 vs Seattle 65.5 — +1.5 delta concentrated in Pillar 2 (title 50 chars vs 49 = at-bound vs under-bound, +0.5), Pillar 7 (commercial-market BLUF framing surfaces light commercial cue +0.5), Pillar 8 (visible commercial-market signal in `intro` reads as mild freshness/relevance +0.5). All other pillars identical because the city-page template is uniform.

**The implication:** fixes are sitewide-template fixes. Applying the P1 fix list to `[citySlug]/page.tsx` + `cityData` schema + `schema.tsx` builders lifts all 93 city pages in one pass.

## Per-page link plan

| Type | Present | Missing | Anchor candidates |
|---|---|---|---|
| Inbound (related cluster) | Homepage serviceArea + footer ✅; nearest 5 city pages via `getNearestCities` ✅; Kirkland direct cross-link ✅ | `/how-to-get-rid-of-moles-in-your-yard/` Cluster 1 pillar should cross-link to Bellevue as Tier 3 city example | "Mole Control Bellevue" / "Bellevue Mole Removal" |
| Outbound to authority anchor | **0** — Cluster 1+7 names WSU, WDFW, Bellevue Chamber, King County Master Gardener | Add 1-2 inline outbounds: (a) WSU on earthworm-density / Townsend's-mole claim in `whyMolesThrive`; (b) optionally Bellevue Chamber for local-credibility on commercial-market signal | WSU Extension fact sheet / Bellevue Chamber of Commerce |
| Outbound to internal cluster pillars | TMCP / OMP / Commercial via ServiceCards ✅; `/service-areas` ✅ | `/how-to-get-rid-of-moles-in-your-yard/` NOT linked | "complete mole control guide" |
| Commercial cross-links (for "highest-value commercial market") | None to `/services/commercial-mole-control/` from body (only via ServiceCards generic) | Add inline link to `/services/commercial-mole-control/` in `intro` paragraph where Bellevue's commercial cue lives | "Commercial Mole Control in Bellevue" |
| Anchor diversity | Nearest-city anchors Zyppy ✅; service-card anchors templated; footer concise | OK overall | — |

## Per-page fix list

| P | Pillar | Gap | Recommended fix | File / surface |
|---|---|---|---|---|
| **P1** | 7 E-E-A-T + 4 Content AEO | "Highest-value commercial market in WA" not surfaced — Bellevue page is generic homeowner template; commercial-property cluster intent (Spencer P1) absent. Affects paid-LP relevance for commercial-keyword traffic. | Add a **Bellevue-specific commercial callout block** between `intro` and `whyMolesThrive`: 2-3 sentences naming Bellevue's commercial property opportunity, link inline to `/services/commercial-mole-control/`, mention HOA + property-manager + facilities use cases. Either add as `cityData.bellevue.commercialCallout` rendered conditionally, or extend `cityData.bellevue.intro` directly. | `src/lib/city-data.ts` `cityData.bellevue` add field + `src/app/(frontend)/[citySlug]/page.tsx` render |
| **P1** | 7 E-E-A-T | 0 outbound to authority anchor on a paid-LP + Tier-A page. Cluster 1+7 require ≥1 (WSU/WDFW/Bellevue Chamber). | Same fix as Seattle: cite WSU Extension's Mole Management in Washington Backyards in `whyMolesThrive` on Townsend's-mole / earthworm claim. Per `feedback_outbound_links_must_earn_their_place.md` — must earn placement (not bolted-on). | `src/lib/city-data.ts` `cityData.bellevue.whyMolesThrive` extend + add templated `cityData.{slug}.authorityCitations[]` field rendered by component |
| **P1** | 4 Content AEO + 1 Headings | No H2/H3 carries `mole exterminator Bellevue` / `mole removal Bellevue` — uniform-template gap | Same fix as Seattle: add cluster-secondary-KW H2 + section ("Bellevue Mole Exterminator Services — What's Included" or "Working with a Mole Exterminator in Bellevue"). Templated via `cityData.{slug}.exterminatorBlock`. | `src/app/(frontend)/[citySlug]/page.tsx` + `src/lib/city-data.ts` schema extension |
| **P1** | 8 Freshness + 3 Schema | No `dateModified` on WebPage or Service schema; no visible "Last updated" string. Pillar 8 at 2/5. | Same fix as Seattle: add `dateModified` to schema builders + `cityData.{slug}.lastUpdated` field; render visible "Last updated {Month YYYY}." | `src/lib/schema.tsx` + `[citySlug]/page.tsx` + `cityData` schema |
| **P1** | 2 Meta + 4 Content AEO | Title 50 chars at lower bound, missing "WA" + Spencer P1 KW "exterminator" + commercial-market relevance for paid-LP intent; description 133 chars under bound | Same fix as Seattle: update title pattern → `"Mole Control & Exterminators in {cityName}, WA \| Got Moles"` (~58 chars Bellevue); extend description pattern to ~159 chars. | `src/app/(frontend)/[citySlug]/page.tsx` generateMetadata templates |
| P2 | 4 Content AEO + 7 E-E-A-T | Bellevue FAQ Q4 "Is mole trapping legal in Washington?" answer mentions "Washington state wildlife regulations" generically without naming WDFW | Update answer to cite WDFW by name + optionally link out: `"...comply with [Washington Department of Fish & Wildlife guidance](https://wdfw.wa.gov/...)"`. AEO + Cluster 1+3 co-citation lift. | `src/lib/city-data.ts` `cityData.bellevue.faqs[3].answer` |
| P2 | 3 Schema | No `parentOrganization` linkage on cityLocalBusinessSchema | Same fix as Seattle: update `cityLocalBusinessSchema` builder. Templated sitewide. | `src/lib/schema.tsx` |
| P2 | 4 Content AEO | 4-step "How It Works" rendered as div, not `<ol>` | Same fix as Seattle: convert to `<ol>`. Templated sitewide. | `[citySlug]/page.tsx` lines 274-304 |
| P2 | 4 Content AEO | No StatBlock | Same fix as Seattle: add StatBlock to city template (92+ communities / 5,000 clients / 219+ reviews / 0 chemicals). Templated sitewide. | `[citySlug]/page.tsx` |
| P3 | 6 Images | County-level hero, not Bellevue-specific | Defer — sourcing/producing 93 city-specific heroes is design lift. Acceptable trade-off. | `cityData` override field |
| P3 | 1 Headings | H1 missing "WA" suffix per Tier 3 template | Same fix as Seattle: update H1 template `[citySlug]/page.tsx:138`. Templated sitewide. | `[citySlug]/page.tsx:138` |
| P3 | 4 Content AEO | "Free inspection. No obligation." CTABlock subtext — borderline queries-to-avoid hygiene | Same flag as Seattle: verify intent with Roy | `[citySlug]/page.tsx:364` |

### Score recovery projection

Applying the 5 P1 fixes:
- Pillar 1: 14 → 16.5 (+2.5 for exterminator H2)
- Pillar 2: 7.5 → 9 (+1.5 title+desc fix)
- Pillar 4: 13 → 17.5 (+1.5 dateModified+visible, +1.5 commercial callout enriches AEO, +1.5 sitewide template lift via H2)
- Pillar 7: 4.5 → 8 (+3 commercial callout + outbound to commercial-service + WSU citation + Bellevue Chamber if added; +0.5 for surfacing Spencer / veteran credential on commercial market if added)
- Pillar 8: 2 → 4 (+2 dateModified + visible string)

**Projected post-P1: ~81/100 (B-).** Clears Tier 3 Tier-A target ≥75 AND comfortable for paid-LP quality score.

Adding P2 (WDFW citation + parentOrganization + `<ol>` + StatBlock): **~86/100 (B).**

## Apply-mode handoff

**All P1/P2 fixes are templated** — apply once to `[citySlug]/page.tsx` + `cityData` schema + `schema.tsx`, propagate to all 93 city pages. Bellevue + Seattle benefit equally from a single template pass.

Suggested commit sequence (mirrors Seattle audit):

**Commit 1 — Template title/desc/H1 + visible last-updated:** same as Seattle.

**Commit 2 — Per-city authority citation field:** populate Bellevue + Seattle + Tacoma + Enumclaw priority list with WSU citations.

**Commit 3 — Exterminator H2 + cluster KW variation:** populate Bellevue + Seattle + Tacoma.

**Commit 4 — Schema dateModified + parentOrganization + `<ol>` + StatBlock:** templated sitewide.

**Commit 5 — Bellevue commercial-market block (P1 unique to Bellevue):** add `cityData.bellevue.commercialCallout` field rendered between intro and whyMolesThrive. Bellevue is the only city with this Spencer P1 cue ("highest-value commercial market"); Seattle gets a different angle ("hardest fight, biggest volume opp on exterminator").

**Commit 6 — WDFW citation in Bellevue legal-trapping FAQ + add same Q to Seattle (Seattle doesn't have it yet).**

**Verification after each commit:** WebFetch + raw HTML extractor on Bellevue + Seattle. Expect H2 count to climb from 6 → 7-8, `<ol>` count from 0 → 1, schema `dateModified` field present, outbound count from 0 → 1-2.

## Paid-LP considerations

Bellevue is a Google Ads paid landing page per `reference_got_moles_paid_search_project.md`. Quality Score affects CPC. The P1 fixes above improve:

- **Landing-page experience:** dateModified + visible "Last updated" → freshness signal; commercial callout + WSU outbound → trustworthiness; `<ol>` for process → usability
- **Ad relevance:** title + H2 carrying "exterminator" + "WA" matches paid-keyword intent better
- **Expected click-through rate:** richer schema (Service + FAQPage + LocalBusiness aggRating) supports rich-result eligibility

Quality-score lift is plausible from D+ (currently) to B (post-P1) — typical CPC reduction in commercial-mole keyword cluster ~10-20% per Google Ads documentation.

## Self-check (Rule G)

- [x] Foundation-doc lookup table present (10 rows — includes paid-LP suitability + commercial-market check)
- [x] Live verification section present (schema 6 blocks parsed, link/AEO count, commercial-cue scan)
- [x] Three-Layer SoT section present
- [x] Pillar scores reference evidence sections
- [x] Per-page fix list with explicit file paths (5 P1 + 4 P2 + 3 P3)
- [x] Apply-mode handoff with commit sequencing
- [x] Paid-LP-specific considerations called out

Report passes self-check. Saved.
