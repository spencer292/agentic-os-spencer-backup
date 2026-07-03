---
project: got-moles-marketing-plan
status: complete
level: 2
created: 2026-04-10
completed: 2026-05-10
superseded-by: got-moles-marketing-os
---

> **SUPERSEDED 2026-05-10.** Pre-launch master plan replaced by the post-launch L3 GSD `got-moles-marketing-os` (2026-05-08). Retained for history.


# Got Moles — Complete Marketing Launch Plan

## Context

Got Moles is migrating from WordPress to Next.js 16 + Payload CMS. The site currently holds **635 #1 keywords** and **1,409 top-3 rankings**. A domain switch risks temporary ranking loss. This plan covers every marketing angle to: (a) protect rankings during migration, (b) fill any organic traffic gap with paid channels, (c) build long-term authority across every viable channel, and (d) drive growth through referrals, commercial, social, and content.

**Business snapshot:** ~$800K ARR, ~500 TMCP subscribers at $100/mo, 5-person team, 3 GBP locations, 219+ five-star reviews, 77 city pages, 15 blog posts live.

**NOTE: This plan needs Spencer's review before finalizing.** Numbers, budgets, and channel priorities are starting positions — Spencer knows his business best.

---

## Phase 1: Pre-Launch (Now → DNS Switch)

### 1.1 SEO Preservation (Ranking Protection)

| Action | Priority | Status |
|--------|----------|--------|
| Validate all 291 redirects (old WP URLs → new Next.js routes) | P0 | Redirect map exists, needs testing |
| Schema markup on every page (13 types: LocalBusiness, FAQPage, Service, Person, HowTo, Article, AggregateRating, BreadcrumbList, Organization, Speakable, Review, CollectionPage, SiteNavigationElement) | P0 | Partially implemented |
| Meta title/description audit against keyword mapping | P0 | Phase 2 mapping exists |
| Core Web Vitals test (target: all green mobile + desktop) | P0 | Not yet tested |
| Sitemap.ts validation (all 108+ pages) | P1 | Auto-generated |
| robots.txt: staging blocks crawlers, production allows AI crawlers | P1 | Done |
| llms.txt published at /llms.txt | P1 | Draft exists, needs deployment |
| Internal linking audit (zero 404s) | P1 | Not yet run |

### 1.2 Paid Ads — Safety Net for Ranking Dip

**Goal:** Have paid traffic running BEFORE DNS switch so there's zero gap if organic drops.

**Prerequisite (added 2026-04-17):** Tracking infrastructure must be built before any campaign spend. Two new sibling L2 projects own this — they unblock everything in 1.2:
- `meta-ads-tracking` — Pixel + Conversions API (CAPI) + event dedup + Event Match Quality + contact form handler (Resend). Without this: 30-72% signal loss on mobile, no retargeting, no Smart Delivery optimization. Blocks `meta-ads-tmcp-quiz`.
- `google-ads-tracking` — Tag + Enhanced Conversions (June 2026 single-switch) + user-provided hashed data + 3 Conversion Actions (phone/form/quote). Without this: Smart Bidding flies blind, 5-15% conversion lift unrealized.

Current `site/src/components/Analytics.tsx` is browser-side only. These projects complete the measurement layer.

**Zernio's ads connection — parked.** Confirmed 2026-04-17 that Zernio's `/ads/boost` endpoint is post-boosting on 6 networks, NOT a replacement for proper Pixel/CAPI/Enhanced Conversions. Potential Phase 3 add-on: n8n workflow auto-boosts winning organic posts at $20-50 spend. Tactical efficiency layer, not foundational.

**Google Ads (Search)**
- Budget: $1,500-2,000/month (highest-intent channel)
- Target keywords: "mole removal near me", "mole control [city]", "mole exterminator [county]"
- CPC estimate: $15-40 for pest control
- Landing pages: 4 AdWords LPs already built (noindex)
- Conversion tracking: GA4 + Google Ads tag (MUST be configured before launch)
- Start: 2 weeks before DNS switch — build Quality Score on staging URLs, switch targets at go-live

**Google Local Services Ads (LSA)**
- Budget: Pay-per-lead (~$25-50/lead)
- "Google Verified" badge (replaced "Google Guaranteed" Oct 2025)
- Requirements: pest control license, insurance, background checks
- Appears ABOVE regular search ads — highest visibility
- Start: Apply now — approval takes 1-3 weeks

**Meta Ads (Facebook/Instagram)**
- Budget: $600/month (confirmed)
- Funnel 1: Quiz → Quote Request ($400/mo)
- Funnel 2: TMCP Email Capture ($200/mo)
- Audiences: 3,000 past clients (custom), 1% lookalike, interest-based (homeowners + lawn/garden + Western WA)
- Creatives: 6 static images (approved), 2 video scripts (pending production)
- **Blocker:** Meta Pixel must be installed on site + ScoreApp quiz BEFORE launch
- Start: Pixel install now, campaigns go live at DNS switch

**Nextdoor Ads**
- Budget: $300-500/month
- Hyperlocal CPM targeting by neighborhood
- Best for: awareness + trust in specific service areas
- Start: Post-launch (Month 1)

**ChatGPT/AI Ads (Emerging)**
- OpenAI announced "sponsored results" in ChatGPT search (April 2025)
- Currently US-only, limited advertisers
- **Action:** Monitor for availability, register interest early
- Got Moles' GEO strategy means organic AI citations come first — paid AI ads are bonus layer
- Budget: TBD when available ($200-500/month test)

**Bing/Microsoft Ads**
- Import Google Ads campaigns directly
- Lower CPC (typically 30-40% cheaper than Google)
- Feeds into Copilot/Bing AI results
- Budget: $300-500/month
- Start: Month 1 post-launch

**YouTube Ads (Pre-roll)**
- Budget: $200-400/month
- $0.10-0.30 per view
- Target: lawn care, pest control, home maintenance content viewers in WA
- Requires video content (see Phase 2)
- Start: Month 2 (after first videos produced)

### 1.3 Spencer's 7 Confirmations

Before any build work, Spencer must confirm:
- [ ] Fife county assignment (King, Pierce, or both?)
- [ ] TMCP value prop placement on page
- [ ] Discreet service copy placement on commercial page
- [ ] Team photos for Tavis, Brayden, Lukas
- [ ] Unique bio details per team member
- [ ] "Same day" vs "fast" response commitment
- [ ] Blog depth strategy (educate-not-instruct endorsed)

### 1.4 Analytics & Tracking Setup

- [ ] GA4 Measurement ID configured in Vercel env vars
- [ ] Google Ads Conversion ID configured
- [ ] Meta Pixel installed on site + ScoreApp quiz
- [ ] Google Search Console verified for new domain
- [ ] Bing Webmaster Tools verified
- [ ] Call tracking numbers set up (if applicable)

---

## Phase 2: Launch Week (DNS Switch + First 30 Days)

### 2.1 Launch Day Checklist

1. Final redirect validation (all 291)
2. DNS switch
3. Submit new sitemap to Google Search Console
4. Submit to Bing Webmaster Tools
5. Request indexing for all priority pages
6. Verify all paid ads pointing to new URLs
7. Monitor Google Search Console for crawl errors (daily for first week)
8. Monitor keyword positions (track top 50 keywords daily)

### 2.2 Content Blitz (First 30 Days)

**Blog posts to publish immediately (Tier 1 — highest SEO value):**
1. "How to Get Rid of Moles in Your Yard" (cornerstone — 6,600/mo search volume)
2. "Mole Removal Cost Guide: What to Expect in Washington" (2,400/mo)
3. "Do Sonic Mole Repellers Actually Work?" (1,100/mo)
4. "Best Mole Traps 2026: Professional vs DIY" (1,600/mo)
5. "Why Moles Keep Coming Back After Removal" (480/mo — decision-stage, drives TMCP signups)

**City pages to create (Spencer's Pierce County expansion):**
- DuPont, Eatonville, Gig Harbor, Graham, Lakewood, Parkland, South Hill, Steilacoom, Wilkeson
- King County additions: Algona, Clyde Hill, Medina
- Each with unique content (community description, why moles thrive, local FAQ)

### 2.3 Google Business Profile Blitz

**All 3 locations (Seattle, Tacoma, Enumclaw):**
- Upload 50+ photos per location (97 professional photos available)
- Complete all service descriptions with pricing
- Pre-populate Q&A (10 questions per location)
- Start posting cadence: 3x/week per location
  - Monday: Customer success story (from review bank of 183)
  - Wednesday: Mole fact / seasonal tip
  - Friday: Service highlight or team spotlight
- Respond to every review within 24 hours

### 2.4 Review Generation System

**Automated flow (post-service):**
1. Technician completes service → system sends text within 2 hours
2. Text: "Thanks for choosing Got Moles! If you're happy with the service, a quick Google review helps us help more homeowners like you: [link]"
3. Follow-up email 48 hours later (if no review posted)
4. Rotation: 70% Google / 30% Yelp (Yelp currently at 13 reviews — urgent gap)

**Target:** 300+ Google reviews, 50+ Yelp within 6 months

---

## Phase 3: Months 1-3 (Authority Building)

### 3.1 Content Authority Engine

**Blog cadence:** 2 posts/week (from 33-post content plan)
- Tier 1 cornerstones first (highest search volume)
- Tier 2 myth-busting second (highest AI citation rate — 40-60% more citations)
- Every post runs through `ops-blog-pipeline` (write → humanize → image → seed → CMS → Notion)
- Every post links to service pages + 2-3 related posts + relevant city pages

**Topical authority cluster:**
- Pillar: "Complete Guide to Mole Control in Washington State"
- 10-12 cluster articles interlinked
- Internal linking map: every cluster article → pillar + 2-3 siblings
- Authority builds 90-180 days post-launch

### 3.2 YouTube Channel (First-Mover Advantage)

**No mole control YouTube channel exists at scale. This is a genuine first-mover opportunity.**

**Month 1 — Film first batch (4-6 videos):**
1. "How Professional Mole Trapping Works — Step by Step" (8-15 min)
2. "Mole Control Costs in Washington State" (5-10 min)
3. "DIY Mole Traps vs Professional Control" (10-15 min)
4. "What Happens on a Got Moles Service Call" (ride-along, 8-12 min)

**Month 2-3 — Scale to weekly:**
- 1 long-form video/week
- 3-5 YouTube Shorts/week (before/after reveals, myth-busting, oddly satisfying)
- Cross-post Shorts to Instagram Reels + TikTok

**Why this matters for ranking protection:**
- YouTube videos rank in Google search results
- Video thumbnails in search = higher CTR
- YouTube is the #2 search engine
- 94% of AI citations go to long-form video content (not Shorts)
- Spencer has the personality and expertise — this is authentic content

### 3.3 Social Media Engine

**LinkedIn (Spencer's Personal + Got Moles Company Page)**
- Spencer posts 2-3x/week: founder stories, team spotlights, commercial case studies
- Company page: job culture, service highlights, industry insights
- Target audience: property managers, HOA boards, commercial facility managers, real estate agents
- **KPI:** 5 commercial leads/month from LinkedIn by Month 6

**Facebook**
- Page posts: 3x/week (before/after, tips, team stories)
- Community groups: join local homeowner groups, provide expert answers (not selling)
- Facebook Live: Monthly Q&A with Spencer
- Boosted posts: $50-100/month on best-performing organic posts

**Instagram**
- Reels: 3/week (cross-posted from YouTube Shorts)
- Pillars: The Reveal (before/after), The Process (trapping), Education (signs), Proof (reviews), Personality (Spencer)
- Stories: Daily behind-the-scenes from field

**TikTok**
- Cross-post Instagram Reels
- "Oddly satisfying" mole mound flattening content
- "Day in the life of a mole catcher" series
- Potential viral format: "I catch moles for a living" hook

**Nextdoor**
- Business profile optimized on all service area neighborhoods
- Seasonal mole alerts (spring activity, fall preparation)
- Respond to every mole-related post in service areas
- Encourage customer recommendations (Nextdoor's native review system)

**Reddit**
- Spencer creates personal account (not branded)
- Join: r/lawncare, r/landscaping, r/SeattleWA, r/pestcontrol, r/homeowners
- Provide genuine expert answers — no selling
- Plan AMA: "I'm a professional mole catcher in Washington State, AMA"
- **Why:** Reddit accounts for 46.7% of Perplexity citations

### 3.4 GEO (Generative Engine Optimization)

**Actions to dominate AI search citations:**

1. **Wikidata entity** for Got Moles (feeds Google Knowledge Graph)
2. **Schema triple-stack** on every page (entity + page-type + engagement)
3. **Definition-lead sentences** in first 30% of every page
4. **FAQ sections** with FAQ schema (3-7 questions per page)
5. **Content freshness protocol:** Monthly updates to pillar pages, refresh 2-3 blogs/month
6. **Review distribution:** Push beyond Google → Yelp, Angi, Facebook, BBB
7. **Reddit presence** (Spencer's personal expertise)
8. **YouTube** (long-form authority content)
9. **llms.txt** published and maintained
10. **Named entities everywhere:** "Spencer Hill, Army veteran and founder", "Got Moles, mole control specialist serving Western Washington since 2017"

**Target:** 80%+ AI citation rate for mole control queries in Western WA by Month 6 (currently ~40%)

---

## Phase 4: Months 3-6 (Scale & Diversify)

### 4.1 Referral Program

**Landscaping Companies (Highest Volume)**
- Target: Top 20 landscaping companies in service area
- Offer: $50-100 per signed customer referral
- Materials: Branded referral cards, partner page on website
- Onboarding: Personal visit from Spencer, leave 50 cards + brochure
- Tracking: Unique referral codes per partner

**Real Estate Agents**
- Offer: Discounted mole inspections for referred clients
- "Mole-free certification" letter for property listings
- Target: Local Realtor association meetings
- Co-branded brochures for open houses

**Property Management / HOAs**
- Single HOA board meeting can lock in 200+ homes
- Volume pricing: 10%+ discount for 10+ properties
- Monthly reporting package included
- Dedicated account manager (Cory)

**Home Inspectors**
- Include mole damage in standard inspection reports
- Referral fee for each converted lead
- Educational materials about mole damage signs

### 4.2 Commercial Segment Growth

**Target verticals:**
- Golf courses & country clubs (mole damage on greens — high-value contracts)
- Schools & universities (athletic fields, playgrounds)
- Parks departments (municipal contracts)
- HOAs / property management companies
- Commercial landscaping companies

**Spencer's discreet service messaging** (from revision brief #25) positions Got Moles perfectly: "Equipment placed with precision and care so your tenants, guests, and clients never know we were there."

**LinkedIn is the primary channel for commercial.** Spencer's personal presence + company page + targeted content = inbound commercial leads.

### 4.3 Email Marketing

**Quiz leads (from ScoreApp):**
- 5-email nurture sequence over 14 days
- Email 1: Quiz results + personalized mole risk assessment
- Email 2: "Why moles keep coming back" (education)
- Email 3: Customer success story (social proof)
- Email 4: Quick Fix vs TMCP comparison
- Email 5: Limited-time offer or seasonal urgency

**TMCP subscriber retention:**
- Monthly service report email
- Seasonal mole activity alerts
- Anniversary recognition (1-year, 2-year)
- Referral program reminder (refer a neighbor, get $50 credit)

**Past customer reactivation:**
- Quarterly check-in: "Moles back? We're still here."
- Seasonal reminders: Spring activity surge, fall prevention

### 4.4 PR & Media

**Spencer's newsworthy angles:**
- Army veteran builds mole control business (veteran media, local news)
- Mole-focused specialist with subscription model (niche story, local business press)
- TMCP subscription model (business model innovation angle — recurring revenue in pest control)
- Mole biology education (seasonal story hook for local TV/radio)

**Target outlets:**
- Seattle Times, Tacoma News Tribune, South Sound Magazine
- Local TV morning shows (live demo potential — Spencer sets a trap on camera)
- Veteran business publications
- Home & garden podcasts (guest appearances)

**Industry authority:**
- NPMA membership ($500-1,500/yr)
- WSPMA membership ($200-500/yr)
- BBB accreditation (~$400/yr — also a backlink)
- Chamber of Commerce memberships (Enumclaw, Auburn, Tacoma)
- Guest articles for industry publications

---

## Phase 5: Months 6-12 (Dominance)

### 5.1 Ranking Recovery Assessment

**By Month 6, evaluate:**
- Are all 635 #1 keywords recovered? (target: 95%+ recovery)
- New keywords ranking from content blitz? (target: 60% of 180 new keywords in top 10)
- AI citation rate at 80%+?
- If rankings haven't recovered → increase paid spend, double content output

### 5.2 Geographic Expansion

**Phase 1 expansion (already planned):** Pierce County 12 new cities
**Phase 2 expansion:** Snohomish County gaps (Everett 112K pop, Marysville 70K pop)
**Phase 3 expansion:** Kitsap County (Bremerton, Bainbridge Island, Silverdale, Port Orchard, Poulsbo — 112K+ combined)
**Phase 4 expansion:** Whatcom/Skagit (Bellingham, Mount Vernon, Anacortes)

Each expansion = new city pages + targeted Google Ads + GBP posts.

### 5.3 Budget Scaling

**Start (launch):** ~$3,000-4,000/month total paid
| Channel | Monthly |
|---------|---------|
| Google Search Ads | $1,500-2,000 |
| Google LSA | $500-800 (pay per lead) |
| Meta Ads | $600 |
| Nextdoor | $300-500 |
| Bing Ads | $300-500 |

**Scale (Month 6+):** Based on CAC performance
- Scale winners: If Google Ads CAC < $100/lead, increase to $3,000/month
- Kill losers: Any channel with CAC > $200/lead after 90 days
- Add YouTube Ads: $200-400/month once 4+ videos live
- Add ChatGPT Ads: When available, $200-500/month test
- **Total Month 6 target:** $4,000-6,000/month (~7% of revenue at $800K ARR)

### 5.4 Spencer's KPIs

**Monthly dashboard:**
| KPI | Current | 6-Month Target | 12-Month Target |
|-----|---------|---------------|----------------|
| TMCP subscribers | ~500 | 600 | 750 |
| Monthly revenue | ~$67K | $75K | $90K |
| Google reviews | 219+ | 300+ | 400+ |
| Yelp reviews | 13 | 50+ | 80+ |
| Blog posts live | 15 | 45+ | 70+ |
| YouTube videos | 0 | 10+ | 30+ |
| City pages | 77 | 90+ | 100+ |
| Commercial contracts | ? | 5 | 15 |
| Referral partners active | 0 | 10 | 25 |
| AI citation rate | ~40% | 80%+ | 90%+ |
| LinkedIn followers (Spencer) | 0 | 500 | 1,500 |
| Organic traffic/month | ? | +3,000 | +8,000 |

---

## Risk Mitigation: Ranking Dip Protection

**The core risk:** Switching domains/platforms can cause a 2-8 week ranking dip. Here's the safety net:

1. **Paid ads running BEFORE DNS switch** — Google Ads, LSA, Meta all live and spending before organic might dip
2. **Redirect validation is a launch gate** — 291 redirects tested before DNS switch, not after
3. **Content velocity** — 2 posts/week from day 1 means fresh signals hitting Google immediately
4. **GBP activity** — 3 posts/week/location keeps local pack rankings stable (GBP is separate from organic)
5. **Schema markup** — Adding schema is pure upside (current site has zero), so even during a dip, rich results improve CTR
6. **30-day monitoring** — Daily keyword tracking for top 50 keywords, weekly for full set, immediate response if drops detected
7. **Rollback plan** — If catastrophic drop (>50% traffic loss), DNS can be reverted within hours (old WordPress site stays live on backup until confirmed stable)

---

## Deliverable

This plan becomes a Level 2 project brief at `projects/briefs/got-moles-marketing-plan/brief.md` with:
- Phased checklist (pre-launch, launch, months 1-3, 3-6, 6-12)
- Channel-by-channel budget tracker
- Spencer's KPI dashboard
- Monthly review cadence

**Verification:** Push to Notion for Spencer/Roy review. Track against KPIs monthly.

---

## Session log

### 2026-04-21 — Spencer execution playbooks (Reddit + US link-building)

Two 8-week playbooks produced for Spencer to run himself. Both scoped as "help first, sell never" — support Phase 3 authority building (sections 3.1–3.4) with channels the plan hadn't previously committed time to.

**Reddit Authority Playbook** — `2026-04-21_reddit-authority-playbook.md`
- 8-week cadence: account warmup (Wk 1) → first expert answers (Wk 2) → local go-deep (Wk 3) → myth-busting post (Wk 4) → seasonal push (Wk 5) → AMA prep (Wk 6) → AMA (Wk 7) → consolidate (Wk 8)
- 8 primary subreddits (r/lawncare, r/landscaping, r/homeimprovement, r/homeowners, r/PNWgardening, r/SeattleWA, r/SouthSoundWA, r/pestcontrol) + 7 secondary
- Part B: post structure, 6 post types, 30-topic bank, DM protocol, AMA template
- Commitment: ~30 min/day, 5 days/week, ~3.5 hrs/week total
- Notion: `3493d42c-4a9c-8122-be86-dbc0ae995a76`

**Link-Building Playbook (US)** — `2026-04-21_link-building-playbook.md`
- 5 categories: Core citations (16 sites), Industry directories (7), Local authority (9 incl. WSU Extension × 3 counties + WDFW + chambers), Content-driven (HARO / Qwoted / Featured / regional blogs / podcasts), Partnerships (landscapers / sod / nurseries / real estate / golf courses / arborists / irrigation)
- 8-week calendar delivering ~35 high-trust links
- Asset pack + NAP canonical form required from Spencer before submissions start (NAP by 2026-04-23, photos by 2026-04-25)
- Commitment: ~6 hrs across 8 weeks then ~30 min/week ongoing
- Notion (v2 after "only" fix): `3493d42c-4a9c-813b-93a0-c983c272ef53`. v1 archived.

### 2026-04-21 — Unsubstantiated "only mole-exclusive" claim removed

Roy flagged that "the only mole-exclusive pest control company in Western Washington" (and variants) was false. The claim had propagated to 20+ files, including live site code. Moody Moles (Kirkland), The Mole Man (Puyallup), and Flatline Mole Control all operate in Western Washington — they were named competitors inside positioning.md itself.

Fixed in one commit (`3f5e7b6`, pushed to `mine/main`):
- `brand_context/positioning.md` — angle renamed "The Only Specialist" → "The Mole Specialist"; anti-claim note added citing competitors
- Site code: `pages-data.ts` (reviews + commercial), `public/llms.txt`, `test/city/page.tsx` — **reviews and commercial-mole-control pages reseeded to CMS**
- 11 briefs/templates including `meta-ads-tmcp-quiz/brief.md` and `meta-ads-all-variants.md` (Specialist hook in Ad 3 softened — copy is now "Got Moles is a mole-exclusive company in Western Washington"; check ad performance if this was a strong performer)
- Memory rule saved (`feedback_got_moles_no_only_claim.md`) so future sessions grep for the claim before shipping

**Soft variant pending:** "Western Washington's mole-exclusive specialist" (possessive, no explicit "only") sits in footer/hero meta ~10 places. Awaiting Roy's call on whether to sweep.

**Knock-on for Section 1.2 ads:** Meta ad 3 "Specialist Hook" headline/description had used "WA's only mole-exclusive" — corrected variants saved. Re-approve before spending.
