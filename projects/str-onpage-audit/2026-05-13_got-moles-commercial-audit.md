---
site: got-moles.com
date: 2026-05-13
page: https://got-moles.com/services/commercial-mole-control/
sitewide_score: N/A (single-page audit)
pages_audited: 1
fixes_p1: 6
fixes_p2: 5
fixes_p3: 3
status: draft
---

# On-Page Audit — Commercial Mole Control

**URL:** `https://got-moles.com/services/commercial-mole-control/`
**Tier:** 1 (B2B flagship — only programmatic page targeting `commercial mole control [city]` queries; ICP segment 2 per positioning.md: property managers, HOAs, schools, sports facilities)
**Cluster:** mole-control (commercial intent, B2B segment)
**Page score:** **65.2 / 100** — Needs work (P1)

---

## Foundation-doc lookup (Rule F)

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `commercial mole control Washington` (line 437) + cluster gap targets: `commercial mole control HOA` (VL, P1), `mole control property manager` (VL, P1), `commercial mole control [city]` (decision: single page, not forked per-city — line 422) | H1 = "Commercial Mole Control for Western Washington"; title carries `Commercial Mole Control` + `Property Managers, HOAs & Sports Facilities` | ✅ **H1 carries primary KW + geo + Rule 1 disambiguation** (Washington). Best of the 3 service-page H1s. |
| Recommended H1 | `"Commercial Mole Control for Property Managers in Western Washington"` (line 437) | "Commercial Mole Control for Western Washington" | ⚠️ **close** — drops "Property Managers" specifier. Compensated in title tag, but H1 weakening costs ICP-segment-2 query alignment. |
| Disambiguation signal (Rule 1) | one of: `yard / lawn / garden / ground / pest / exterminator / trapping / Washington / Western WA / etc.` in H1+title | H1: "Western Washington" ✅. Title: "Property Managers, HOAs, Sports Facilities" + "Got Moles" brand ✅ | ✅ **PASS** — geo signal in H1, ICP + brand in title. |
| Secondary cluster KWs (≥2) | from cluster: `commercial mole control HOA`, `mole control property manager`, `mole control safe for sports field`, `school grounds mole control`, `commercial mole control case studies` | H3s carry: "Property Management", "Sports Clubs & Facilities", "Schools & Campuses", "Property Developers", "Hotels & Hospitality" — ICP segment names but not exact secondary KWs. H2 "Mole Damage on Commercial Grounds Is a Professional Problem" + "Trusted for Commercial Grounds Across Western Washington" carry `commercial grounds` (close to `commercial mole control`). | ⚠️ **PARTIAL** — ICP segment names ≠ secondary KW phrases. H2/H3 are written in marketing terminology rather than search terminology. |
| Queries-to-avoid | dermatology / kill-mechanism vocabulary | scan ✅ | ✅ none |

**Disambiguation severity:** Strongest of the 3. Geo + ICP + brand all present. Primary lift here is **secondary KW alignment** — the H2/H3 ICP-segment names need to be rewritten or augmented to carry the actual search terms (`HOA mole control`, `property manager`, `school grounds mole control`).

---

## Live verification (Rule C)

- **Schema (raw HTML extractor, GPTBot UA, 2026-05-13):** 6 JSON-LD blocks parsed:
  1. Organization (sitewide entity — knowsAbout[8] including "Commercial mole control" ✅) ✅
  2. WebPage with Speakable cssSelector `["h1", "main h2"]` ✅
  3. BreadcrumbList (Services → Commercial Mole Control) ✅
  4. Service: name "Commercial Mole Control", provider `@id`, areaServed "Western Washington", **NO `offers` field** (custom-quoted) — acceptable but means no pricing signal in schema; consider `serviceType` + `audience` enrichment ✅ but minimal
  5. WebPageElement (`#geo-definition` speakable) ✅
  6. FAQPage with 5 mainEntity Q&A ✅
- **No Article schema** — correct.
- **No `dateModified`** on Service or WebPage ❌
- **No `aggregateRating`** ❌ — particularly costly here as B2B trust signal would be high-impact
- **Last-Modified HTTP header:** `null` ❌
- **Internal-link count in `<main>`:** 19 (18 unique) including 11 city pages, 2 sibling services, /contact/, /reviews/commercial-case-studies/, /service-areas/, /faq/. **Strongest link plan of the 3 service pages** — only one that links to /reviews/commercial-case-studies/ (B2B social proof).
- **Tables = 0. Ordered lists = 0. ULs = 3** (decorative).
- **BLUF first `<p>`:** "Annual contracts. Professional reporting. A specialist, not a generalist." — **fragmentary**, lacks canonical answer. Doesn't lead with "What is commercial mole control? A B2B mole control programme for property managers, HOAs, schools, and sports facilities across Western Washington."
- **Process H3 quartet (Site Inspection / Proposal / Ongoing Service / Account Management):** 4-step process — perfect `<ol>` candidate.
- **ICP segment H3 sextet (Property Management / Sports Clubs / Lawn Care / Property Developers / Schools / Hotels):** could be reformatted as a `<table>` (ICP segment × pain points × Got Moles approach).

---

## Three-Layer SoT (Rule A)

- **Live render:** verified via direct fetch 2026-05-13 (post-trailing-slash flip; canonical = self) ✅
- **HEAD:** `page.tsx` at `src/app/(frontend)/services/commercial-mole-control/page.tsx` confirmed; content blocks rendered from CMS via `getCmsPageContent('commercial-mole-control')`.
- **Working tree:** clean (audit-only mode).
- **CMS layer:** authoritative for block content. Schema is code-side (custom-quoted, no offers — consistent with positioning).

---

## Pillar scores

| # | Pillar | Wt | Raw | Score | Notes |
|---|---|---|---|---|---|
| 1 | Headings | 20% | 3.5/5 | 14.0 | H1 unique ✅. H1 close to recommended (drops "Property Managers") + geo ✅. **Rule 1 disambiguation ✅**. Cluster secondary KWs in H2/H3: partial — `commercial grounds` carried but `HOA`, `property manager`, `school grounds mole control` named as ICP labels not full search phrases → 0.5. No skipped levels ✅. |
| 2 | Meta + Canonical | 10% | 4.0/5 | 8.0 | Title 85 chars (well over 60) — biggest title-length offender of the 3. Description 180 chars (over 160). Canonical ✅. og:image generic. |
| 3 | Schema | 15% | 5.0/8 | 9.38 | Correct types ✅. BreadcrumbList ✅. Speakable ✅. Organization with knowsAbout including "Commercial mole control" ✅. FAQPage ✅. **Missing:** `aggregateRating` (high B2B impact), `dateModified`, `audience`/`serviceAudience` field (commercial-specific — `BusinessAudience`), and ideally `serviceType` enumeration. Service offers omitted by design (custom-quoted) — acceptable, but the absence is a missed B2B trust opportunity. |
| 4 | AEO Content Shape | 20% | 2.5/7 | 7.14 | **BLUF: fragmentary, no canonical answer** → 0. Q-format H2s: 0/11 → 0. **Stat block present** ("Got Moles by the Numbers") ✅ → 1.0. **Tables = 0** despite 6-ICP-segment grid being a textbook table candidate → 0. **OLs = 0** despite 4-step process (Site Inspection / Proposal / Ongoing Service / Account Management) → 0. Verified-fact callouts (5,000 properties, 219+ reviews) → 1.0. Queries-to-avoid scan ✅ → 1.0. |
| 5 | Internal Links | 15% | 4.5/5 | 13.5 | Inbound: linked from homepage, TMCP, OMP (verified ≥2) → 1.0. Outbound: 18 unique dests including /contact/, /reviews/commercial-case-studies/ (unique to this page ✅), 11 cities, sibling services, /service-areas/, /faq/ → 1.0. Anchor diversity: deferred → 0.5. No cannibalisation losers ✅ → 1.0. Hub-spoke: still no upward link to pillar `/how-to-get-rid-of-moles-in-your-yard/` → 0.5 only because the B2B case-study link partially compensates. |
| 6 | Images | 5% | 3.0/6 | 2.5 | CMS-driven; component-level verification deferred. og:image generic. Conservative scoring. |
| 7 | E-E-A-T | 10% | 3.0/5 | 6.0 | Author byline N/A (Service) — correct. **Outbound to authority: 0** ❌. **Founder quote: H2 "Why Commercial Is Different, From the Founder" ✅** + content presumed to carry Spencer attribution. Organization schema robust ✅. **B2B case-study link to `/reviews/commercial-case-studies/` is itself a strong E-E-A-T cue** → +0.5 over TMCP/OMP. |
| 8 | Freshness + Disambig | 5% | 1.5/4 | 1.88 | **dateModified missing** ❌. **Last-Modified header: null** ❌. **No visible "Last updated"** ❌. **Title + H1 disambiguation: ✅ both carry geo / ICP / brand** → 1.5. |

**Page total: 14.0 + 8.0 + 9.38 + 7.14 + 13.5 + 2.5 + 6.0 + 1.88 = 62.4 / 100**

**Commercial score = 62 / 100 (Poor — P1).** Highest of the 3 service pages by ~4 points — strongest disambiguation + strongest link plan. Same shared P1 gaps (tables/OLs/dateModified/authority outbound) as siblings; primary differentiated gaps are title length (85 chars) and B2B-specific secondary-KW alignment.

---

## Per-page link plan

| Direction | Status | Anchor / target | Notes |
|---|---|---|---|
| Inbound (present) | ✅ | Homepage, TMCP, OMP cross-links | Verified ≥2. |
| Inbound (missing) | ❌ | No link from any city page using anchor `commercial mole control` — per target-keywords.md line 422, decision was to keep single commercial page, but city pages should still link to it for B2B local queries (`commercial mole control bellevue`, etc.) | P1 |
| Inbound (missing) | ❌ | Pillar `/how-to-get-rid-of-moles-in-your-yard/` should have a B2B CTA section linking to commercial page | P2 |
| Inbound (missing) | ❌ | Blog `/blog/how-to-choose-a-mole-control-company/` should link to commercial page for B2B decision context | P2 |
| Outbound (present) | ✅ | 18 unique internal: 11 cities + 2 sibling services + /contact/ + **/reviews/commercial-case-studies/** + /service-areas/ + /faq/ | Strongest link plan among service pages. |
| Outbound (missing) | ❌ | No upward link to pillar `/how-to-get-rid-of-moles-in-your-yard/` | P2 |
| Outbound (missing) | ❌ | No outbound to authority (WSU Extension turf IPM, Sports Turf Managers Assoc, USDA NWRC, EPA biopesticide info — B2B audiences expect authority citations) | P1 — E-E-A-T |
| Outbound (missing) | ❌ | No link to `/about/` (Spencer veteran-owned credibility — relevant for HOA/school procurement) | P2 |
| Anchor candidates | — | `commercial mole control`, `commercial mole control Washington`, `HOA mole control`, `property manager mole control`, `school grounds mole control`, `commercial mole control case studies` | All carry Rule 1 disambiguation. |

---

## Per-page fix list

### P1

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 1 | 2 Meta | Title 85 chars (huge over-run) | Trim to ≤60 while keeping ICP + brand + primary KW: `Commercial Mole Control Washington | Got Moles` (47 chars) OR `Commercial Mole Control: HOAs & Property Managers | Got Moles` (60 chars — close). | `src/app/(frontend)/services/commercial-mole-control/page.tsx` FALLBACK.title + CMS meta override |
| 2 | 4 AEO | 4-step process H3 quartet (Site Inspection / Proposal / Ongoing Service / Account Management) in DIVs — should be `<ol>` | Convert process section to RichContent block with `<ol>` markup | `src/lib/pages-data.ts` → commercialBlocks process block; reseed |
| 3 | 4 AEO | 6-ICP-segment H3 grid is a textbook `<table>` candidate (highest-fidelity AI extraction) | Restructure ICP grid as `<table>` with columns: Segment / Common pain / Got Moles approach / Reporting frequency | `src/lib/pages-data.ts` → commercialBlocks ICP block; reseed |
| 4 | 1 Headings | H2/H3 use ICP marketing labels not search-aligned secondary KWs | Rewrite section H2s to carry secondary KWs: e.g. "Mole Control for HOAs and Property Managers", "School Grounds Mole Control", "Sports Field Mole Control" | `src/lib/pages-data.ts` → commercialBlocks; reseed |
| 5 | 3 Schema + 8 Freshness | No `dateModified`, no `aggregateRating`, no Last-Modified | Same global Service schema enhancement as TMCP/OMP fix; add commercial-specific `audience: BusinessAudience` field | `src/lib/schema.tsx` + `src/app/(frontend)/services/commercial-mole-control/page.tsx` serviceSchema call |
| 6 | 7 E-E-A-T | No outbound authority anchor | Add citation to WSU Extension turfgrass IPM or USDA NWRC mole biology integrated into "Why Commercial Is Different" prose | `src/lib/pages-data.ts` + Lexical link builder per Rule E |

### P2

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 7 | 2 Meta | Description 180 chars (over 160) | Trim to ≤160 preserving primary KW + ICP + value prop | same file |
| 8 | 4 AEO | BLUF fragmentary, doesn't lead with canonical answer | Rewrite to lead with: "Commercial Mole Control is Got Moles' B2B service for property managers, HOAs, schools, and sports facilities across Western Washington. Annual contracts, regular reporting, and reliable scheduling. Custom-quoted per portfolio." Humanize after. | pages-data.ts |
| 9 | 5 Links | No upward link to pillar `/how-to-get-rid-of-moles-in-your-yard/` | Add link in BLUF or stat block context | pages-data.ts |
| 10 | 5 Links | No link to `/about/` (Spencer veteran credibility — relevant for HOA / school B2B procurement) | Add `[veteran-owned](/about/)` anchor in founder section | pages-data.ts |
| 11 | 2 Meta | og:image generic | Create commercial-specific OG asset | `public/images/og-commercial.webp` |

### P3

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 12 | 4 AEO | No Q-format H2 | Reword one section (e.g. "How Commercial Contracts Work" already nearly Q-format — change to "How do commercial mole control contracts work?") | pages-data.ts |
| 13 | 4 AEO | Anchor-city seeding rule (Spencer P2.7) for B2B | Verify Seattle/Tacoma/Bellevue/Sammamish/Puyallup/Renton named in first 200 words of body copy with B2B framing | pages-data.ts |
| 14 | 3 Schema | Service `serviceType` field absent | Add `serviceType: "Commercial Mole Control"` + `category: ["Pest Control", "Commercial Services"]` to serviceSchema for the commercial call | `src/app/(frontend)/services/commercial-mole-control/page.tsx` |

---

## Cross-references

- **target-keywords.md line 422 (location-services cluster):** "decision: keep `/services/commercial-mole-control/` as the single commercial page with city call-outs, don't fork per-city" — confirms current IA approach. P1 fix 4 (H2 secondary-KW rewrite) is the way to capture city-level B2B queries without forking pages.
- **target-keywords.md line 237 (safety cluster gap):** "Commercial buyer concern: `mole control safe for sports field` / `school grounds mole control` — covered by `/services/commercial-mole-control/` but not optimised. Consider commercial-specific FAQ." — current FAQ has 5 Qs, one being "Are your methods safe for public spaces and schools?" ✅. Could expand to 7-8 Qs picking up the missed secondary KWs.
- **authority-strategy.md:** commercial / B2B audience expects authority citations more than residential — outbound to WSU Extension / Sports Turf Managers / EPA biopesticide info has high ICP-segment-2 trust impact.
- **Sitewide audit (2026-05-13):** /services/ hub returns 404 — affects commercial IA hierarchy too. Pixelmojo benchmark unchanged.
