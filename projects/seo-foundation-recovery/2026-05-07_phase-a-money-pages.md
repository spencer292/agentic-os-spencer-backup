---
phase: A
date: 2026-05-07
parent_plan: 2026-05-07_recovery-plan.md
status: awaiting-approval
pages: 5
runbook: BUILD-METHODOLOGY.md (Page Build Checklist)
playbook: PAGE-BUILD-REFERENCE.md (CMS-wins-after-seed, friendly slugs, deploy flow)
---

# Phase A — Money Page Surgery Spec

5 pages (services hub `/services/` does not exist — moved to Phase E coverage gap).

Each page edited in `site/src/lib/pages-data.ts`, then `npm run seed -- --reseed {friendly-name}`, build, push.

---

## Diagnosis snapshot

| Page | GSC 90d imp | GSC 90d clk | CTR | Phase 2 position |
|---|---:|---:|---:|---|
| `/` (home) | 3,648 | 31 | 0.85% | pos 5 best (head terms) |
| `/services/total-mole-control-program/` | **0 in top-15** | 0 | — | NOT in top 10 |
| `/services/one-time-mole-removal/` | **0 in top-15** | 0 | — | NOT in top 10 |
| `/services/commercial-mole-control/` | **0 in top-15** | 0 | — | NOT in top 10 |
| `/about/` | **0 in top-15** | 0 | — | not measured |

**Headline:** Homepage gets impressions but for the wrong queries (city searches that should go to city pages). The 3 service pages and About are ghosts — fewer impressions than the GSC top-15 cutoff for any query. They're not being seen as topically relevant for any search.

This is bigger than H1 wording. Likely root causes (treat each as a check, not a fix):
1. H1 doesn't match target query (homepage + about confirmed; TMCP/one-time/commercial actually have decent H1s)
2. Insufficient inbound internal links from blog + city pages (anchor diversity gap from internal-linking-recovery)
3. Schema gaps (Service schema must include `serviceArea` + `areaServed` + `aggregateRating`)
4. Content depth vs competitors (molemasters.biz + mole-patrol.com)

---

## Page 1: Homepage (`/`)

**Reseed slug:** `home` (friendly map → CMS slug `/`)

**Pages-data.ts export:** `homeBlocks`, `homeMeta` (verify exact names before editing)

### Current

| Field | Current value |
|---|---|
| Title | Got Moles \| Western Washington Mole Control Specialists |
| Meta | Western Washington's mole-exclusive specialist. Chemical-free, proven results. Nearly 5,000 clients served since 2017. Call (253) 750-0211. |
| H1 | Your Lawn Deserves Better Than Moles. We Make Sure It Gets It. |
| H2 #1 | You've Tried Everything. The Moles Keep Winning. |

### Diagnosis

H1 is brand-led storytelling. Zero target-keyword signal. Phase 2 shows we don't reach top 10 for "mole control near me", "lawn mole control", "professional mole control", "mole exterminator near me". Homepage is the natural target for at least one of these.

GSC is ranking the homepage on city queries (edmonds, lake city, clyde hill, shoreline, mill creek) — content/internal-link strength is enough that Google substitutes the homepage for city pages that don't rank as well. Means the homepage is *seen* but not for what it should be.

### Proposed

| Field | Proposed | Why |
|---|---|---|
| Title | Mole Control in Western Washington \| Got Moles | Lead with target query, brand at end. 47 chars. |
| Meta | Got Moles is Western Washington's mole-exclusive specialist. Chemical-free, 219+ five-star reviews, 5,000+ properties served since 2017. Call (253) 750-0211. | BLUF; lead with WHO+WHERE+WHAT; ends CTA. 158 chars (1 over — trim "5,000+ properties served since 2017" → "5,000 yards"). |
| H1 | **Mole Control in Western Washington** | Exact target query. Brand register kept via subtitle/eyebrow above. |
| Eyebrow above H1 | Got Moles. | Preserves brand presence. |
| H2 #1 | (keep current "You've Tried Everything…") | Pain-point block stays — drives scroll + emotion. |
| New H2 to add | What Is Professional Mole Control? | AEO BLUF capture. Define the service in 2-3 sentences. AI Overview citation target. |
| New H2 to add | How Got Moles Removes Moles | "How" question block. Step-by-step (2-3 sentences each). Names trapping technique generically per Posture A. |

### Schema check

- [ ] `LocalBusiness` schema with `aggregateRating: { ratingValue: 5, reviewCount: 219 }` — verify `localBusinessSchema()` in `src/lib/schema.tsx` includes this
- [ ] `serviceArea` + `areaServed` listing all major counties (King, Pierce, Snohomish, Thurston)
- [ ] `Organization.sameAs` array populated with all 3 GBPs + Yelp + BBB + Facebook (brand disambiguation per Step 6 in str-ai-seo-local)
- [ ] `Person` schema for Spencer linked via `@id` to Organization

### Internal links to add (per `feedback_per_post_topical_linking.md` — surgical, not blanket)

- 3 contextual links FROM the homepage TO `/services/total-mole-control-program/`, `/services/one-time-mole-removal/`, `/services/commercial-mole-control/` (already there via service grid — verify)
- Audit: top 5 highest-traffic blog posts must link to homepage with anchor `mole control in Western Washington` or close variant

### Acceptance

- Build passes (`npx next build`)
- Staging URL renders with new H1 visible
- Schema validates in Google Rich Results Test
- Within 14 days of deploy: GSC position improves on `mole control western washington` from out-of-top-100 → top 30, OR documented reason

### Risk

H1 is a published, indexed asset. Changing wholesale is high-impact. Mitigation: keep the brand voice in the eyebrow + H2 #1, only the H1 itself becomes query-led.

---

## Page 2: Total Mole Control Program (`/services/total-mole-control-program/`)

**Reseed slug:** `tmcp` (friendly → CMS slug `total-mole-control-program`)

### Current

| Field | Current value |
|---|---|
| Title | Total Mole Control Program \| $100/Month Year-Round Protection \| Got Moles |
| H1 | Year-Round Mole Protection for $100/Month |

### Diagnosis

H1 has "year-round" + "mole protection" but not the exact commercial query "year round mole control" or "professional mole control". Decent but not optimised.

ZERO GSC data in top-15-queries cutoff = page is invisible. Even with a decent H1, no traffic. Likely cause: insufficient inbound internal links + competitors with more domain authority (molemasters.biz, mole-patrol.com).

### Proposed

| Field | Proposed | Why |
|---|---|---|
| Title | Year-Round Mole Control \| $100/Month TMCP \| Got Moles | "mole control" exact, brand-product name, brand. |
| Meta | Year-round mole control for $100/month. Got Moles' Total Mole Control Program (TMCP) protects your yard with regular visits + post-visit reports. 219+ five-star reviews. | BLUF; pricing; proof. |
| H1 | **Year-Round Mole Control for $100/Month** | "control" not "protection" — matches target query. Pricing kept (commercial intent signal). |
| Eyebrow | Total Mole Control Program (TMCP) | Brand-product name kept. |
| New H2 to add | Why Continuous Mole Control Beats One-Time Trapping | AEO. Comparison content per Step 5 H2 audit. |
| New H2 to add | What's Included in Year-Round Mole Control | "What's included" matches PAA pattern. |
| H2 reorder | Move "What TMCP Members Say" earlier (currently #5 → propose #3) | Social proof closer to top per CRO. |

### Schema check

- [ ] `Service` schema with `serviceArea`, `areaServed`, `offers: { priceCurrency: USD, price: 100, priceValidUntil }`, `aggregateRating`
- [ ] `provider` references same Organization @id as homepage
- [ ] FAQ block already present — confirm `generateSchema: true` and `faqSchema()` rendered in page route

### Internal links to add

- From `/services/one-time-mole-removal/` and `/services/commercial-mole-control/` — "Also Consider" cross-link block already exists, verify text uses keyword anchor not "Learn More"
- From 5 top blog posts (Mole Control cluster): "What Attracts Moles", "Why Moles Keep Coming Back", "Seasonal Mole Activity", "DIY vs Professional", "Are Moles Damaging Your Lawn" → all should link to TMCP with anchor `Year-Round Mole Control` or `Total Mole Control Program`

### Acceptance

Same pattern as homepage. 14-day GSC check on "year round mole control" + "professional mole control".

---

## Page 3: One-Time Mole Removal (`/services/one-time-mole-removal/`)

**Reseed slug:** `one-time`

### Current

| Field | Current value |
|---|---|
| Title | One-Time Mole Removal \| $450 Flat Rate, Guaranteed \| Got Moles |
| H1 | Professional Mole Removal with a Guarantee |

### Diagnosis

H1 has "professional mole removal" exact match — strong. Title has "$450 Flat Rate" — strong commercial signal. Yet zero GSC traffic.

Almost certainly an authority/inbound-link issue, not on-page H1.

### Proposed

| Field | Proposed | Why |
|---|---|---|
| Title | One-Time Mole Removal \| $450 Flat Rate \| Got Moles | Drop "Guaranteed" from title, move to meta (more space for query). |
| Meta | Professional one-time mole removal for $450 flat rate (under 1 acre). Inspection + weekly visits + Got Moles guarantee. Serving Western Washington. | BLUF; price; proof; geo. |
| H1 | **Professional Mole Removal with a Guarantee** | KEEP — exact match for "professional mole removal". |
| New H2 to add | How Much Does Mole Removal Cost? | Cost cluster — owns the cost query (currently dermatology dominates per `feedback_mole_negative_keywords_medical.md`). BLUF: "$450 flat rate for under 1 acre…" |
| New H2 to add | One-Time Removal vs Year-Round Protection: Which Should You Choose? | Comparison; internal link to TMCP; capture decision-stage searchers. |

### Schema check

- [ ] `Service` schema with `offers: { price: 450 }` and explicit `description: "Professional mole removal..."` 
- [ ] FAQ schema for "Common Questions" block

### Internal links to add

- From cost-cluster blogs: "Professional Mole Trapping Cost", "DIY vs Professional Cost", "Why Cheap Mole Solutions Fail" → anchor `Professional Mole Removal` to this page
- From `/services/total-mole-control-program/` "Also Consider" block — verify keyword anchor

### Acceptance

14-day GSC check on "professional mole removal" + "lawn mole removal cost" + "professional mole trapping cost".

---

## Page 4: Commercial Mole Control (`/services/commercial-mole-control/`)

**Reseed slug:** `commercial`

### Current

| Field | Current value |
|---|---|
| Title | Commercial Mole Control \| Property Managers, HOAs & Sports Facilities \| Got Moles |
| H1 | Commercial Mole Control for Western Washington |

### Diagnosis

H1 is strong: exact match "commercial mole control" + geo. Title is strong with audience qualifiers. Yet zero GSC = invisible.

This is a thin-market query (commercial mole control is B2B niche). Phase 2 showed competitors don't dominate this either — it's an opportunity.

### Proposed

| Field | Proposed | Why |
|---|---|---|
| Title | (keep) | Already strong. |
| Meta | (keep) | Already strong. |
| H1 | (keep) | Exact match preserved. |
| New H2 to add | What Property Types Need Commercial Mole Control? | Audience-segment AEO; HOAs, sports facilities, golf courses, parks. |
| New H2 to add | How Commercial Mole Control Differs from Residential | Comparison; internal link back to one-time + TMCP. |

### Schema check

- [ ] `Service` schema with `audience: { audienceType: ["Property Manager", "HOA", "Sports Facility Manager"] }`
- [ ] `serviceArea` includes commercial-relevant counties

### Internal links to add

- From `/about/` — Spencer's authority page should link here with anchor `Commercial Mole Control`
- Add a footer or sitewide "For Property Managers" link in CmsHeader/CmsFooter (verify with Moni)

### Acceptance

14-day GSC check on "commercial mole control". Lower bar — niche query, position 11-20 acceptable as starting state.

---

## Page 5: About (`/about/`)

**Reseed slug:** `about`

### Current

| Field | Current value |
|---|---|
| Title | About Got Moles \| Founded by Spencer Hill, US Army Veteran \| Got Moles |
| H1 | Spencer Hill's Story |

### Diagnosis

H1 is brand-only ("Spencer Hill's Story"). About pages anchor authority (Person + Organization schema), so this matters for E-E-A-T even if About doesn't directly rank for commercial queries.

### Proposed

| Field | Proposed | Why |
|---|---|---|
| Title | About Got Moles \| Spencer Hill, Mole Control Specialist | Add "Mole Control Specialist" — authority signal. |
| Meta | Got Moles is Western Washington's mole-exclusive specialist. Founded 2017 by Spencer Hill, US Army veteran. Nearly 5,000 yards served, 219+ five-star reviews. | BLUF; provenance; proof. |
| H1 | **About Got Moles: Spencer Hill's Mole Control Story** | Adds "Mole Control" — authority anchor. Brand + topic. |
| Eyebrow | Founded 2017. Western Washington. | Geo + age. |
| New H2 to add | Why Got Moles Only Does Moles | Differentiation block — already in body but elevate to H2. |

### Schema check

- [ ] `Person` schema for Spencer (jobTitle, alumniOf, knowsAbout: ["Mole Control", "Pest Control", "Western Washington Wildlife"])
- [ ] `Organization.founder` references Spencer's Person @id
- [ ] `sameAs` links to Spencer's LinkedIn (if exists), military service references

### Internal links to add

- About should link to all 3 service pages with keyword-rich anchors (currently does — verify anchor text)
- Top 5 blog posts mentioning Spencer should link here with anchor `Spencer Hill, Got Moles founder` or similar

### Acceptance

About won't rank for commercial queries (not its job). Acceptance is schema validation + Person entity strength signal in Google Knowledge Graph (verify via `https://www.google.com/search?q=spencer+hill+got+moles` 30 days post-deploy).

---

## Build/Deploy sequence per page

For each of the 5 pages, run this loop. Do NOT batch all 5 into one push — do them in order, verify each on staging before moving to the next.

Order: home → tmcp → one-time → commercial → about (lowest risk first if any rollback needed).

```bash
# 1. Edit pages-data.ts (the relevant block exports)
# 2. Edit src/lib/schema.tsx if schema additions needed
# 3. Build
cd "C:\Claude\agent-os\clients\got-moles\projects\briefs\website-rebuild-rebrand\site"
npx next build

# 4. Reseed (CMS wins after seed — required for changes to render)
npm run seed -- --reseed home
# (or tmcp / one-time / commercial / about)

# 5. Verify reseed in local payload admin or DB if available
# 6. Commit (specific files, not git add -A)
cd "C:\Claude\agent-os"
git add clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/lib/pages-data.ts
git add clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/lib/schema.tsx
git commit -m "got-moles: Phase A page {N} — {H1 query-led + schema additions}"
git push mine main

# 7. Wait ~2 minutes. Verify on staging:
# https://project-pf8c6.vercel.app/{path}
# Check H1, title, meta description (view source), schema (Google Rich Results Test)

# 8. Mark page complete in this spec doc, move to next page
```

---

## Process discipline (per BUILD-METHODOLOGY § Process Discipline Rules)

- Skills first: this is `str-ai-seo-local` skill territory. Re-read its Rules before each page.
- Humanizer gate: any new H2 BLUF copy or meta description runs through `tool-humanizer` (deep mode, target 8.0+) before commit.
- One-page-at-a-time: full edit→build→seed→push→verify cycle per page. No batching.
- Stop on errors: 2+ build errors → stop and review fundamentals.
- Push to `mine` only.
- Verify on staging, never localhost (per `feedback_staging_not_localhost.md`).

---

## Approval needed

Mark up this doc (or reply with deltas):

1. **H1 changes** — homepage moves from brand-led to query-led ("Mole Control in Western Washington"). About goes from "Spencer Hill's Story" to "About Got Moles: Spencer Hill's Mole Control Story". OK to proceed?
2. **New H2 additions** — 8 new H2s across 5 pages (BLUF capture + comparison content). OK to proceed?
3. **Schema additions** — `aggregateRating`, `Service.offers.price`, `Person.knowsAbout`, expanded `sameAs`. OK to proceed?
4. **Internal-linking additions** — surgical per-blog-post mapping per `feedback_per_post_topical_linking.md`. OK as approach (specific blog→target maps written in implementation, not pre-listed here)?
5. **Order** — home first (highest risk, sets the pattern) → about last (lowest risk, schema-only). Or reverse to lowest-risk-first?
6. **Image changes** — none in this phase. Existing imagery stays. Confirm.

Once approved I'll start with homepage.
