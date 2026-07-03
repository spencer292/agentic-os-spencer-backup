# Got Moles — Agency Recon + Paid Strategy Pivot

**Date:** 2026-04-23
**Owner:** Roy + Claude Code
**Status:** Decision locked — proceed with cold-start, LSA-first
**Feeds:** `got-moles-measurement-setup`, `google-ads-campaigns`, `seo-geo-reinforcement`, website DNS switch (2026-04-27 target)

---

## TL;DR

Competitive recon via Google Ads Transparency Center + SpyFu Basic + SERP mapping surfaced three facts that collapse the prior "must get handover from previous agency" urgency:

1. **The agency is White Marketing Services** — small, non-national, running 5 unique ad creatives across the entire 3-year Transparency Center history for Got Moles.
2. **SpyFu's estimate: $60.36/month Google Ads spend, 1 active paid keyword, 2 monthly clicks, 295 lifetime keywords now abandoned.** This is a wound-down account, not an optimised one. The previously-reported $844/month "ad spend" figure is almost certainly 90%+ LSA spend, not Search.
3. **The market is soft.** Of 10 direct/adjacent WA mole-control competitors, none shows aggressive paid-search activity. Google's SpyFu Venn shows only 3 overlapping paid competitors. National giants (Orkin, Terminix) distort CPCs on generic pest terms but don't dominate mole-specific queries.

**Decision:** Abandon the agency handover fight. Cold-start Google + Bing Search, take direct ownership of LSAs via Spencer's GBP (not the agency's MCC), build conversion-optimised landing pages from the new site's design system. Launch by 2026-05-05 to catch peak pest season (May-September).

**Expected outcome by 2026-07-31 (90 days post-launch, base case):**
- 250-400 paid leads/month (2.5-4× current ~75/month)
- Blended CPL: $12-20 (vs historical $10.28, which looks LSA-inflated)
- Paid ROAS: 3-5× on $4-6K/month ad spend
- Total lead flow (paid + organic): 400-600/month

---

## Part 1 — What the agency is actually doing

### Google Ads Transparency Center (public, free)

`https://adstransparency.google.com` → domain `got-moles.com`:

- **Verified advertiser:** White Marketing Services
- **Last 30 days:** 4 active ads
- **All time (since Transparency Center launch, March 2023):** 5 unique ad creatives total
- **Ad mix:** Text + image (no video, no Demand Gen)
- **Geo:** King + Pierce County
- **Notable ads:**
  - "Mole Control Seattle | Mole Exterminator Seattle | Got Moles?" (text)
  - "Got Moles? - Family & Pet Friendly" (image)
  - "Mole Control [dynamically generated location]" (Dynamic Keyword Insertion)
  - "Your Neighborhood Mole Expert" (image)
  - "Veteran owned business" (retired, image + CTA)

Benchmark: a competently-managed pest-control account typically runs 20-50+ ad variants over 3 years. Five is an order of magnitude below baseline.

### SpyFu Domain Overview + PPC Research

`spyfu.com/overview/domain?query=got-moles.com`:

| Metric | Value | Read |
|---|---|---|
| Organic keywords ranking | 860 | Solid for a local-service business |
| Monthly organic clicks (est.) | 1,365 | Steady but declining |
| Monthly organic rank change | **−46** | Active erosion (no SEO maintenance) |
| Paid keywords (current) | **1** | Near-dormant |
| Paid keywords (lifetime) | 295 | Was once active, now wound down |
| Monthly PPC clicks (est.) | 2 | Effectively zero |
| Monthly Google Ads budget (est.) | **$60.36** | Vs $844/mo reported → 14× gap |
| SpyFu history depth | 6 years, 10 months | Back to ~Jun 2019 |
| Traffic from Google | 99% organic | The entire business runs on SEO |

### The $844 vs $60 reconciliation

The measurement-setup brief cites "~75 leads/month at $844/month" as the previous agency's baseline. SpyFu detects only $60/month in Google Ads spend. The gap has to be one of:

1. **LSAs carry 90%+ of paid spend (most likely)** — Google Local Services Ads are invisible to both SpyFu and the Transparency Center. LSA CPL benchmarks of $20-30 for well-managed pest control match Spencer's reported CPL.
2. Performance Max hiding spend (unlikely — PMax typically shows more than 5 assets in 3 years).
3. The agency's reported numbers were inflated or aggregated with organic attribution.

Verification path: Spencer's GBP dashboard and `ads.google.com/local-services-ads/` should show LSA activity if it exists. Still outstanding — Spencer to complete this week.

### Organic signal — the silent decline

-46 keyword ranking change, net loss of ~50-75 rankings across recent tracking period. Agency is not maintaining SEO either. Both channels (Search + SEO) show the signature of a set-and-forget account that's being actively de-prioritised by the agency.

---

## Part 2 — The WA mole control competitive landscape

### Tier 1 — Direct competitors (mole-only or mole-specialist)

| # | Domain | Location | Tenure | Scale signal |
|---|---|---|---|---|
| 1 | **got-moles.com** | Enumclaw + 3 GBP | 15+ yrs (Spencer) | 219+ reviews, 5K clients, 3 GBPs |
| 2 | moodymoles.com | Kirkland | 10+ yrs | Claims 10K properties, direct rival |
| 3 | molemasters.biz | PNW | 30+ yrs | King + Pierce coverage |
| 4 | mole-patrol.com | King + Snohomish | Since 1983 | Long tenure, small |
| 5 | molecontrolandmore.com | South King | Since 2000 | Chemical-free positioning |
| 6 | themolebustersllc.com | OR + WA | Family-owned | Smaller regional footprint |

### Tier 2 — WA pest companies with mole pages (generalists)

| # | Domain | Note |
|---|---|---|
| 7 | willardspestcontrol.com | Local King County, mole as one service |
| 8 | sunrisepest.com | Multi-county since 1978, generalist |
| 9 | croach.com | Multi-state franchise |
| 10 | seattlewildlifecontrol.com | Wildlife + moles |
| 11 | edenpest.com | WA regional (not verified against mole queries yet) |
| 12 | cascadepestcontrol.com | WA regional (not verified) |
| 13 | whitworthpest.com | PNW regional (not verified) |

### Tier 3 — National giants (CPC distortion only)

| # | Domain | Note |
|---|---|---|
| 14 | orkin.com | Huge budget, weak mole authority |
| 15 | terminix.com | Same |

### Tier 4 — Lead aggregators (displacement pressure on CPCs)

| # | Domain | Note |
|---|---|---|
| 16 | angi.com | Bids on local pest queries, pushes CPCs up |
| 17 | thumbtack.com | Same |
| 18 | homeadvisor.com | Angi subsidiary |

### Competitor recon — still to run in SpyFu

Priority order for the $39 SpyFu month:

1. **moodymoles.com** (highest) — pacesetter for the direct-rival cohort
2. **molemasters.biz** — benchmark for long-running ad creatives
3. **molecontrolandmore.com** — "chemical-free" positioning comparison
4. **themolebustersllc.com** — regional benchmark
5. **willardspestcontrol.com** — generalist WA benchmark
6. **croach.com** — franchise spend level

What to capture per competitor: estimated monthly ad spend, paid keyword count + top terms, ad creative history (Ads History tab), PPC Competitors Venn to triangulate the auction map.

### Agency conflict-of-interest check — still to run

Click "White Marketing Services" advertiser name inside Google Ads Transparency Center. This opens the agency's full advertiser profile listing every domain they run ads for. If any WA mole/pest competitor appears on that list → direct fiduciary breach, Spencer has a clean termination lever regardless of contract terms.

---

## Part 3 — Ramp-up projection (three scenarios)

### Assumptions

- New site live from 2026-04-27 DNS switch, fully tracked by Week 2
- LSAs under Spencer's ownership by end of Week 2 (no agency cooperation needed — tied to GBP + business verification)
- Cold-start new Google + Bing Search accounts by Week 3
- Peak pest season (May-September) overlaps the ramp window
- Conservative, Base, Aggressive scenarios reflect budget + speed-of-handover variance

### Conservative — defensive rebuild, DNS drag, delayed LSA access

| Month | Search | LSA | Bing | Total | CPL | Budget |
|---|---|---|---|---|---|---|
| 1 | 25-40 | 30-50 | 15-25 | **70-115** | $20-28 | $2.0K-2.5K |
| 2 | 40-65 | 50-75 | 20-35 | **110-175** | $16-24 | $2.5K-3.5K |
| 3 | 60-90 | 70-100 | 30-45 | **160-235** | $13-20 | $3.0K-4.5K |
| 6 (peak) | 80-120 | 100-150 | 40-60 | **220-330** | $11-18 | $4.0K-6.0K |

### Base — clean rebuild, LSA transferred, campaigns live by 2026-05-05

| Month | Search | LSA | Bing | Total | CPL | Budget |
|---|---|---|---|---|---|---|
| 1 | 40-60 | 50-80 | 20-35 | **110-175** | $18-24 | $2.5K-3.5K |
| 2 | 70-100 | 80-120 | 35-55 | **185-275** | $14-20 | $3.5K-5.0K |
| 3 | 100-140 | 110-160 | 50-75 | **260-375** | $12-17 | $4.5K-6.0K |
| 6 (peak) | 130-180 | 150-220 | 70-100 | **350-500** | $10-15 | $5.5K-8.0K |

### Aggressive — full budget, seasonal tailwind, LSAs dominant

| Month | Total | CPL | Budget |
|---|---|---|---|
| 1 | 150-200 | $15-22 | $3.5K-5K |
| 2 | 250-350 | $12-18 | $5K-7K |
| 3 | 350-500 | $10-15 | $6K-9K |
| 6 (peak) | 500-700 | $9-14 | $8K-12K |

Aggressive is cap-bounded by Spencer's operational capacity (trucks, trappers). At 500+ leads/month, the bottleneck shifts from leads to delivery.

### Revenue implications (base case, Month 3)

- 260-375 paid leads × ~22% blended close rate (LSA 35% + Search 8% weighted) = **55-85 new customers/month**
- At $100-200 avg customer value: **$5-15K/month in new MRR**
- Annualised pace at peak: **$60K-180K new ARR per month of acquisition**
- Net of $4-6K/month ad spend: **3-5× ROAS on paid alone** before counting SEO + LSAs' brand-building halo

---

## Part 4 — The pivot decision

### Fire the agency this week — evidence package

Spencer sends White Marketing Services one email containing these facts:

1. 5 unique ad creatives across 3 years of tracked history (public Google data).
2. 295 paid keywords at peak → 1 active paid keyword today = 99.7% wind-down.
3. $60.36/month estimated Google Ads spend vs reported $844/month = 14× gap.
4. -46 organic ranking decline indicates no SEO maintenance either.
5. Request: account handover (Google Ads, Bing Ads, GSC, GA4) + LSA access transfer within 7 days, or the agreement terminates.

Outcome of this email is probably irrelevant to the paid strategy below — we assume no handover and proceed accordingly. Any handover that does arrive is a bonus (historical data for baseline comparison).

### LSA-first campaign architecture

**Priority 1: LSA ownership transfer (Week 1-2)**

- Confirm LSA is running (Spencer checks `business.google.com` → Local Services / Leads section of each GBP)
- If running → remove White Marketing's manager access, reassign billing to Spencer's card
- If not running → run Google Guaranteed verification (license + insurance + Checkr background check on Spencer) — 2-3 week window, start immediately
- **LSAs are tied to Spencer's GBP + business verification, NOT the agency's Google Ads MCC.** Agency cooperation is not required for the transfer.

**Priority 2: Landing page conversion architecture (Week 2-3)**

The new site's design system + CRO audit + component library are already in place. Gap to close before launch:

- Dedicated LPs per campaign type (6 needed per Track B of seo-geo-reinforcement brief)
- City-specific LP variants for top-spend cities: Bellevue, Sammamish, Tacoma, Seattle, Puyallup
- Objection-led variants: "DIY isn't working", "Safe for pets/kids", "Price concern"
- Phone click primary, form submit secondary, quiz as mid-funnel
- All LPs behind `/lp/*` with page-level noindex

**Priority 3: Google Search + Bing UET campaigns (Week 3-4)**

- Fresh Google Ads account created under Spencer's ownership from Day 1
- Brand campaign first (defend "Got Moles" branded searches)
- Removal + TMCP + Commercial campaigns next, mapped to dedicated LPs
- Call-focused Search (not standalone Call-only — deprecated)
- Bing Ads mirror on same structure (34% of historical paid mix)
- AI Max enabled on Brand first, expand to other campaigns Week 2 post-launch with Brand Settings + URL Rules guardrails

**Priority 4: Measurement layer (Week 1-2, parallel)**

- GA4 property created + env var in Vercel (`NEXT_PUBLIC_GA4_ID`)
- Meta Pixel + CAPI live (server-side CAPI route needed — new code)
- Bing UET tag added to `Analytics.tsx` (new code)
- `CONVERSION_LABEL` placeholder replaced with real conversion action labels once new Google Ads account is live
- `trackPhoneCall` + `trackFormSubmit` firing to all four: GA4, Meta Pixel, Google Ads, Bing UET

**Priority 5: Deferred to Month 2+**

- Performance Max (needs 30+ conversions before PMax Smart Bidding dials in)
- Demand Gen (requires video/image asset investment)
- Enhanced Conversions for Google Ads (depends on consent framework decision)

### Why this beats the handover path

Cold-start pain was previously estimated at 4-6 weeks + 2-3× CPL. Those assumptions relied on the agency having built mature Quality Score, optimised creative, and dialled negatives. Evidence shows none of that exists:

- There is no ad-copy optimisation equity to lose — 5 creatives in 3 years.
- There is no keyword list to inherit — 1 active keyword.
- Quality Score on a single nearly-dormant keyword is near-zero.
- Smart Bidding training data is thin-to-nonexistent at this activity level.
- LSAs transfer via Spencer's GBP ownership, not via the agency.

A fresh account with a better site, proper tracking, full conversion wiring, and a competent campaign structure will reach or exceed Spencer's historical baseline within 2-3 weeks of launch — and materially outperform by Month 2.

---

## Part 5 — Action plan (7 days)

| Day | Action | Owner |
|---|---|---|
| 1 (2026-04-23) | Email White Marketing Services — handover request + 7-day ultimatum | Spencer |
| 1 | GBP dashboard screenshot — confirm/refute LSA activity | Spencer |
| 1 | Click "White Marketing Services" advertiser profile in Transparency Center — screenshot full list of their other clients | Roy |
| 1-2 | Credit card audit — isolate "Google*Ads" direct charges vs agency bundled fee | Spencer |
| 2-3 | SpyFu Ads History + Bombed keywords + PPC Competitors tabs for Got Moles — export everything | Roy |
| 2-3 | SpyFu scans on Tier 1 competitors (moodymoles, molemasters, molecontrolandmore, themolebustersllc, mole-patrol) | Roy |
| 3-4 | Google Ads new account creation under Spencer's ownership | Spencer + Roy |
| 3-4 | Bing Ads new account | Spencer + Roy |
| 4-5 | GA4 property creation + env var in Vercel staging | Roy |
| 4-5 | LSA Google Guaranteed verification start (if not already verified) | Spencer |
| 5-6 | LP audit — map campaign-to-LP, identify gaps, prioritise builds | Roy + Claude |
| 5-6 | Bing UET + Meta CAPI code additions to `Analytics.tsx` | Claude |
| 6-7 | Campaign structure drafted (keywords, ad copy, LP mapping, budget allocation) | Roy + Claude |
| 7+ | DNS switch weekend — flip tracking env vars, verify firing, monitor indexation | Roy + Ian |

### Launch target: 2026-05-05 live campaigns

Five days after DNS to let tracking settle, redirects verify, and analytics baseline captures. First campaign run rides the May-June peak-season activity surge.

---

## Part 6 — Supporting evidence files

- `reports/_agency-recon-screenshots/` — Transparency Center + SpyFu screenshots (to be populated)
- `../seo-geo-reinforcement/brief.md` — Track B Google Ads scope, now reframed around cold-start
- `../google-ads-campaigns/brief.md` — campaign-type scope for the new account
- `../google-ads-campaigns/baseline-from-previous-agency.md` — historical ranking + CPL numbers
- `../../website-rebuild-rebrand/LAUNCH-CHECKLIST.md` — DNS day sequencing that feeds this

---

## Part 7 — Open questions

1. **LSA verification status.** Is Spencer's Google Guaranteed badge already active, or does verification need to start this week? Determines whether Month 1 includes LSA leads or not.
2. **Spencer's operational capacity.** Can he handle 250+ leads/month in Month 3, or does the aggressive scenario need to be rate-limited by delivery capacity? Answer shapes budget recommendation.
3. **Customer value.** What's the average new customer revenue (TMCP MRR + one-time)? Needed to lock ROAS targets.
4. **Budget authority.** Who approves scaling from $2.5K to $6K/month ad spend as performance proves out — Spencer directly, or does Roy present a case each step?
5. **Agency termination timing.** Does Spencer want to end the agreement formally via email this week, or let it lapse by non-payment? Legal/contract implications unknown.

---

*Report written 2026-04-23. Supersedes the "cold-start 4-6 weeks, agency handover critical" framing in earlier project memory and measurement-setup brief. Updates to downstream briefs follow.*

---

## Update — 2026-04-23 afternoon — corrections from the PPC Growth spreadsheet + LSA SERP check

Reviewed the agency's `Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx` spreadsheet (already in project root) and ran SERP checks on key WA queries. Findings force several corrections.

### The agency's own report (PPC Growth sheet) reconciles internally

| | 2024 (12 mo) | 2025 Jan-Nov (11 mo) |
|---|---|---|
| Google Spend | $6,781 ($565/mo) | $6,127 ($557/mo) |
| Bing Spend | $1,979 ($180/mo) | $3,159 ($287/mo) |
| Total Spend | $8,759 ($730/mo) | $9,286 ($844/mo) |
| Total Leads | 874 (73/mo) | 903 (82/mo) |
| CPL | $10.02 | $10.28 |

The $844/mo + 75-leads/mo baseline is mathematically consistent. Not fabricated.

### SEO is gaining, not declining

Agency's SEO Progress sheet (6/1/2025 vs current):
- Total keywords ranked: 1,012 → 1,057 (+45)
- First-page keywords: 806 → 889 (+83)
- **Top-3 keywords: 620 → 698 (+78)**

SpyFu's "−46" figure was misleading — different metric. **My earlier "SEO being neglected" framing was wrong. Retract.**

### LSA hypothesis likely wrong

Spencer's Seattle GBP SERP check (`mole removal seattle` on Google, US IP):
- **No Google Guaranteed / Screened box visible above ads** for any mole service
- Got Moles appeared as a regular **"Sponsored" Search Ad** (text ad with sitelinks)
- GBP Local Pack shows Got Moles with "You manage this Business Profile" — GBP ownership clean
- Mole Masters (356 reviews) and Insight Pest Control (7.1K reviews) also no LSA presence

If LSAs aren't running for anyone in this query, either:
- The query didn't trigger LSAs today (possible; Google's LSA eligibility varies by query intent + location)
- No mole-specialist has been verified for Google Guaranteed in WA
- LSAs exist under a different Google account Spencer doesn't control (agency-owned)

Verification still needed from Spencer:
1. **Has Spencer ever completed a Checkr background check?** (Checkr is mandatory for Google Guaranteed — no Checkr = no LSA under his credentials)
2. **Do his credit card statements show any `GOOGLE*ADS` or `GOOGLE*LSA` charges over the last 12 months?** (direct billing vs agency bundled)

### Where is the $557/mo Google spend actually going?

If LSAs aren't running, the paid breakdown is probably:
- Google Search Ads visible to SpyFu: ~$60/mo
- Performance Max (invisible to SpyFu, serves across Display/YouTube/Gmail/Maps): ~$400-500/mo
- Display / remarketing: balance

PMax is the likeliest explanation. SpyFu has always been Search-only on ad visibility.

### Updated competitor intel from SERP recon

Competitors surfaced that weren't in the original Tier 1 list:
- **Holly Moley!** — new WA mole competitor (visible on `mole removal seattle` Knowledge Panel)
- **Insight Pest Control** — 7,100 GBP reviews in Seattle. Huge generalist. Not mole-specific but dominant local SEO signal.
- **Mole Masters** — 356 Seattle GBP reviews, **vs Got Moles' 135** on Seattle location alone (Spencer's 219+ combined total spans all 3 GBPs)

### Review-volume gap is a launch-window lever

Got Moles Seattle GBP has 135 reviews to Mole Masters' 356 — a meaningful gap on a critical local-SEO signal. A review-generation campaign (post-service SMS/email nudge, QR-code leave-behind) is cheap, high-ROI, and doesn't wait on DNS switch.

### Updated strategy read

- **Cold-start decision still holds** — the Google Search equity we'd be giving up is genuinely tiny (5 creatives, 1 keyword, $60/mo Search footprint)
- **But the agency isn't as neglectful as the earlier framing suggested** — they're delivering leads at $10.28 CPL consistently, and SEO is growing. Firing them is a value-for-money call, not a "they've done nothing" call
- **LSA opportunity may be greenfield** — if no WA mole competitor has Google Guaranteed verification, Spencer completing verification and launching LSAs is a first-mover advantage worth pursuing alongside (not instead of) Search + Bing
- **Paid strategy still: cold-start Google Search + Bing + Nextdoor + start LSA verification immediately** — but base expectations on $557/mo (not $60) as the spend we're replacing, and acknowledge the agency's current SEO output when scoping what Got Moles needs to match internally

### New launch-blocking gap surfaced — multi-location architecture

The current `site/src/globals/SiteSettings.ts` supports **one** phone number and **one** Google Business URL. Spencer has **three** GBPs (Seattle, Tacoma, Enumclaw).

Without a fix before DNS switch:
- Footer shows one phone for the whole site — wrong for Tacoma/Enumclaw service-area pages
- Contact page displays one location — wrong
- `LocalBusinessSchema.tsx` emits one JSON-LD entity — **2 of 3 local-SEO signals lost**, material LSA ranking impact
- No per-location pages (e.g. `/locations/seattle`, `/locations/tacoma`, `/locations/enumclaw`)

**Fix scope:** add a `Locations` global with array of location records (name, address, phone, hours, Place ID, GBP URL, service radius). Wire footer + contact page + LocalBusiness schema emitter. Pre-DNS delivery realistic. Launch-critical.

### Updated outstanding verifications

1. Spencer's Checkr history (LSA status)
2. Spencer's credit card statements for direct Google Ads billing
3. Click "White Marketing Services" advertiser profile in Transparency Center — conflict check (their other clients)
4. SpyFu Ads History tab on Got Moles — longest-running creative patterns worth preserving for cold-start rebuild
5. SpyFu scans on Tier 1 competitors (moodymoles, molemasters, molecontrolandmore, themolebustersllc, mole-patrol, + newly-added Holly Moley!)
6. **Spencer's 3 GBP data** — Place IDs, addresses, phones, hours, service radius per location — for the new Locations global
7. Spencer's current total monthly fee to White Marketing Services — decides fire-vs-renegotiate calculus
