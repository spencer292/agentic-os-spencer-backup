---
project: seo-geo-reinforcement
status: complete
level: 2
created: 2026-04-20
completed: 2026-05-10
parent: got-moles-marketing-os
folded-into: WS5 External Authority Building (Track A citation surface) + WS6 Authority Content (comparison content + original research)
---

> **CLOSED 2026-05-10.** Pre-launch framing superseded by post-launch GSD rescope. Track A (third-party citation surface) folded into WS5 External Authority Building. Comparison content + original research folded into WS6 Authority Content. Service-area reconciliation work shipped pre-launch as part of website-rebuild-rebrand. Retained for history.


# Got Moles — SEO/GEO Reinforcement + Ads LPs + Service Area Reconciliation

## Goal

Close the depth gaps in the pre-launch SEO/GEO posture that yesterday's agent-led audit didn't address, rebuild the Google Ads landing page set so every campaign has a dedicated, conversion-optimized destination, and reconcile the service-area footprint so every ranked keyword on the previous agency's list resolves to a live, intent-matched page before the 2026-04-27 DNS switch.

Yesterday's audit (`projects/str-ai-seo/2026-04-20_full-seo-geo-report.md`) scored the site 87/100 on internal signals — schema, BLUFs, internal links, bot allowlist, cornerstone coverage. That score measures what's on the site. It doesn't measure what's around it (third-party citation surface), what's missing from it (comparison content, original research, LPs per campaign), or what's inconsistent across it (77 citySlugs vs 90 city pages, 17 uncovered URL patterns, 6 cities with ranked keywords but undecided coverage).

This L2 covers the three depth gaps in one coordinated pass because they share dependencies — service-area decisions change redirects.ts and sitemap surface, LP builds affect internal linking and conversion tracking, and presence/comparison content reinforces both organic and paid authority.

---

## Scope — 3 Tracks

### Track A — SEO/GEO Depth (Pillars 2 + 3, Princeton GEO study)

Yesterday's audit graded Pillar 1 (Structure). This track attacks Pillars 2 (Authority) and 3 (Presence) where the current baseline is thin or absent.

**A1 — Keyword coverage reconciliation (launch-critical)**
- Cross-reference the previous agency's Rankings sheet (3,024 tracked keywords, 1,409 top-3) against live page destinations.
- For each top-3 keyword, confirm its old URL redirects to a page that satisfies the query intent (not just any 200 response).
- Flag any query → destination mismatches (e.g., a city-service query redirecting to /service-areas when a city page exists).
- Output: `reports/keyword-coverage-map.md` — 1,409 top-3 rows with old URL, new URL, query intent, destination verdict.

**A2 — Comparison content expansion**
- str-ai-seo data: comparison pages capture ~33% of AI citation share. Got Moles has 2 (Mole vs Vole vs Gopher, Monthly vs One-Time).
- Plan 4 additions:
  - "Got Moles vs DIY (chemicals, traps, repellents)" — kills bottom-funnel objections, feeds TMCP campaign.
  - "Got Moles vs Moody Moles" (direct regional competitor) — captures branded comparison queries.
  - "Best mole control in Bellevue / Sammamish / Tacoma / Seattle / Puyallup" — 5 city-level comparison hubs, top-spend cities by Ads baseline.
  - "Monthly vs One-Time vs Commercial" — 3-way service comparison (expand existing 2-way).
- Each structured for extractability: comparison table (top), pros/cons by audience (middle), FAQ (bottom), 3-5 FAQPage schema entries.

**A3 — Original research from Spencer's 5,000-client dataset**
- Spencer's CRM holds client-level data no competitor has: mole counts per property, trap-to-catch days, seasonal recurrence rate, soil-type patterns, breed/species hit rate.
- Brief 1-2 proprietary-stat blogs: "How many moles live in the average Washington yard (5,000-client study)", "Why moles come back — recurrence data from 5,000 WA properties". Original research boosts AI citation 40% (Princeton GEO) and is unreproducible by competitors.
- Dependency: Spencer export or Jobber API read-access.

**A4 — Third-party presence plan (Pillar 3)**
- AI systems cite external sources 6.5× more than own domains. Wikipedia = 7.8% of ChatGPT citations. Reddit = 1.8%. The site currently has no documented footprint on any of them.
- Plan entries per channel:
  - Reddit: seed r/Seattle / r/SeaWA / r/pnwgardening with long-form answers on the 4 cornerstones + species moats. Not spam — value-led expertise answers with username carrying Got Moles affiliation.
  - Wikipedia: edit the Townsend's mole, Mazama pocket gopher, and "Mole (animal)" entries with cited facts from Got Moles cornerstones (neutral third-party tone; no promotional language).
  - YouTube: 4-8 shorts from Spencer on species ID, trap mechanics, seasonal activity. Not production-heavy — talking-head.
  - Review sites: claim and optimize Yelp, Angi, Nextdoor, BBB. Currently only Google reviews documented.
  - Industry publications: pitch pest-control trade press (PCT, Pest Management Professional) with the "5,000-client dataset" angle.
- Output: `reports/third-party-presence-plan.md` — channel, action, owner, success metric.

**A5 — AI visibility pre-launch baseline**
- Yesterday deferred str-ai-seo Step 2 to post-launch. A pre-launch snapshot is needed so post-launch lift is measurable.
- Run the 15 priority queries from the full report (Bottom Line section) against ChatGPT, Perplexity, Claude, and Google AI Overviews today. Screenshot results. Note which competitors are cited where Got Moles isn't.
- Output: `reports/ai-visibility-baseline_2026-04-{NN}.md` — 15 queries × 4 engines = 60 data points with citations and screenshot anchors.

**A6 — Monitoring setup**
- Set up Otterly AI or Peec AI free-tier account for ongoing AI citation tracking, or a DIY monthly-run script that re-queries the 15 priority queries and diffs citations month over month.
- Output: monitoring cadence + owner documented.

### Track B — Google Ads: Campaign Type Completeness + Landing Pages

Current state of `google-ads-campaigns/brief.md`: 5 campaign types (Search, Bing mirror, LSA, Call-only, PMax/retargeting Month 2+). 4 LPs exist (`/lp/commercial`, `/lp/mole-protection-plan`, `/lp/mole-removal`, `/lp/mole-trapper`) — all page-level noindexed.

Web research 2026-04-20 surfaced three gaps in the current scope: the campaign set is missing three 2026-material types, Maps surface is not explicitly addressed, and the LP set doesn't cover all campaigns. Research sources: Wordstream 2025 Ads updates recap, Google Ads API docs, PCT Online pest-control Google Ads guide, multiple 2026 Ads strategy guides.

**B0 — Campaign type completeness audit (NEW — drives everything below)**

The 2026 Google Ads campaign-type landscape that a mole-control business should assess:

| Type | 2026 status | In current brief? | Verdict for Got Moles |
|------|-------------|-------------------|------------------------|
| **Search** (standard) | Core | Yes | Keep as-is for Brand + exact-match |
| **AI Max for Search** | Phase 1 voluntary now, Phase 2 auto-upgrade Sept 2026 (replaces DSA) | **No — GAP** | **Add** — enable on Search campaigns to leverage broad-match + keywordless targeting. Aligns with our 500+ internal link site structure. |
| **Performance Max (PMax)** | Mature, 2026 added negative keywords + brand exclusions + High Value Mode | Month 2+ retargeting only | **Expand** — full PMax (not just retargeting) once conversion data accumulates. Apply campaign-level negative keywords + brand list exclusions (new 2025 feature). |
| **Demand Gen** | Full roll across YouTube / Gmail / Discover / Maps | **No — GAP** | **Assess Month 3+** — mid-funnel "when you notice mounds" educational content drives awareness. Needs video/image assets first. |
| **Local Services Ads (LSA)** | Pay-per-lead, above all other ads on home-services queries | Month 2+ | **Priority 1 alongside Search** — highest-ROI format for home services per every 2026 guide. Requires Google Guarantee (Checkr background check, license, insurance). Start verification pre-launch. |
| **Maps Ads (Promoted Pins + Map Search Ads)** | Available on Search campaigns with location extensions + via LSA. Promoted Pins require **physical-address GBP** (not SAB) | Implicit only | **Assess — Spencer dependency.** See B1 below. |
| **Display retargeting** | Mature | Month 2+ | Keep as-is |
| **Video (YouTube)** | Core | Not in brief | Defer — no video assets yet |
| **Call-only** | Deprecated as standalone — rolled into Smart Bidding on Search | Yes | Replace standalone Call-only campaign with call-focused Search campaign + call assets |
| **Shopping / App** | — | No | Correct — N/A for service business |

**B1 — Maps advertising eligibility check (NEW)**

Key gate: Promoted Pins require a GBP listing with a **physical address publicly visible**. Service-area businesses (SAB) with hidden addresses are **ineligible** for Promoted Pins. They can still serve on Maps via:

- Map Search Ads (from Search campaigns with Location Assets enabled)
- LSAs on Maps (via Google Guaranteed)
- Sponsored Places card unit (in testing Feb 2026 — watch)

Got Moles has 3 GBP locations (per memory). Action:
- Confirm with Spencer whether each GBP has a visible address or is SAB-hidden.
- If any GBP shows address → Promoted Pins campaign eligible for that radius.
- If all GBPs are SAB-hidden → fall back to Location-Asset-enabled Search + LSA on Maps.
- Document outcome in `reports/maps-eligibility.md`.

**B2 — AI Max for Search enablement plan (NEW)**

AI Max is a feature suite on Search campaigns, not a separate type. Roll out by campaign with monitoring:

- Enable on Brand campaign first (lowest risk — brand intent is clear).
- After 2 weeks, enable on Removal + TMCP + Commercial Search campaigns with Brand Settings configured to protect brand term controls.
- Use URL Rules to constrain which LPs AI Max can serve — prevents drift to irrelevant pages (e.g. blog posts).
- Enable Text Customization (AI-generated headlines using site content) only after brand voice guardrails verified.
- Output: `reports/ai-max-rollout.md` — per-campaign enablement schedule + guardrails.

**B3 — LP audit against CRO principles**

- Run `str-cro-audit` (LIFT model + ResearchXL) on each of the 4 existing LPs.
- Score each on value proposition, relevance, clarity, urgency, anxiety, distraction.
- Output: `reports/lp-audit.md` — per-LP scored audit + prioritized fix list.

**B4 — LP gap identification**

Map 2026-revised campaign list (Search, AI Max-enabled Search, PMax, LSA, Bing mirror, Call-focused Search) to LPs:

- Brand → dedicated brand LP (not homepage). Message-match, ad-only content, stronger tracking isolation.
- PMax → dedicated LP with broader message-match (PMax serves across Search/Display/YouTube/Gmail/Maps so the LP must hold up under mixed traffic).
- Call-focused Search → LP with phone CTA hero, minimal form, trust bar.
- LSA doesn't need LPs — handled by Google's form.

**B5 — LP variant strategy**

- City-specific variants for top-spend cities: Bellevue, Sammamish, Tacoma, Seattle, Puyallup — geo-match ad copy to city-specific LP for Quality Score uplift.
- Objection-led variants: "DIY isn't working" LP (for the Reddit-research homeowner), "Safe for pets/kids" LP (for the anxious parent), "Price concern" LP (for the cost-comparison shopper).
- Not all 10+ variants ship Day 1 — phase across Month 1 + Month 2.

**B6 — Conversion tracking hooks**

- Audit `Analytics.tsx` for the `CONVERSION_LABEL` placeholder and replace with real labels once Google Ads account access resolves.
- Move to env vars: `NEXT_PUBLIC_GADS_CONVERSION_PHONE`, `NEXT_PUBLIC_GADS_CONVERSION_FORM`.
- Wire form submit events from each LP to both GA4 and Google Ads conversion actions.
- Verify Bing UET tag fires on LP form submits for Bing conversion import.
- **New 2026:** Ads can now appear in AI Overviews — requires Smart Bidding + highly relevant assets. Our GEO moat puts us in a strong position; tracking must capture AI Overview-sourced clicks distinctly.

**B7 — LP → campaign mapping doc**

- Single-source map of which LP every campaign/ad group sends to, updated when new LPs ship.
- Output: `reports/lp-campaign-map.md`.

### Track C — Service Area Reconciliation (launch-critical)

Current state: `citySlugs` in redirects.ts = 77 cities. Live site = 90 cities. 6 cities have ranked keywords on the old site but uncertain coverage: Centralia, Eatonville, Algona, Fairwood, Lake Tapps, Medina.

**C1 — City-by-city decision — REVISED AGAIN 2026-04-20 after live HTTP verification**

Direct HTTP probe of `/mole-control-{slug}/` on the new build (see `reports/city-link-comparison_2026-04-20.md`) reveals yesterday's "6 cities to add" framing was overstated. Algona / Fairwood / Lake Tapps / Medina **already exist on the new site as canonical pages** — the gap is in `redirects.ts`, not in `city-data.ts`.

| City | Page on new build | Old-URL redirect coverage | Action |
|------|:----:|:----:|--------|
| Algona | ✅ 200 — H1 "Mole Control in Algona" | ❌ Not in citySlugs (77-city hardcode) | Add to citySlugs only |
| Fairwood | ✅ 200 — H1 "Mole Control in Fairwood" | ❌ Not in citySlugs | Add to citySlugs only |
| Lake Tapps | ✅ 200 — H1 "Mole Control in Lake Tapps" | ❌ Not in citySlugs | Add to citySlugs only |
| Medina | ✅ 200 — H1 "Mole Control in Medina" | ❌ Not in citySlugs | Add to citySlugs only |
| **Centralia** | ❌ 404 | ❌ Not in citySlugs | **Build new page + add to citySlugs** |
| **Eatonville** | ❌ 404 | ❌ Not in citySlugs | **Build new page + add to citySlugs** |

**Net Track C1 work: build 2 city pages (Centralia + Eatonville)**, not 6. The other 4 just need redirect coverage in citySlugs.

The Rankings evidence (see `reports/city-rank-evidence_2026-04-20.md`) still stands: Centralia has the strongest historical footprint in the entire dataset (6 keywords at #1 continuously 2-3 years), Eatonville has been #1 since March 2023. Building these two pages is the highest-stakes single addition on the launch list.

For Centralia + Eatonville: produce full city page via `ops-cms-content` + seed flow, then add to citySlugs (Track C2).

**Spencer dependency** still applies for Centralia + Eatonville: does Spencer service these areas (~60mi south of Enumclaw) or do the pages position as "regional info / outside our direct service area"? Pages must exist either way to preserve rankings; the messaging shifts based on Spencer's answer.

**Spencer dependency** (resolves messaging, not existence): Does Spencer actually service Centralia (Thurston, ~60 mi south of Enumclaw) and Eatonville (Pierce, ~30 mi south of Puyallup)? Two paths:
- If yes → standard city page: "We serve Centralia."
- If no → city page with honest positioning: "Based in Western WA — Centralia is outside our direct service area. Here's what's available regionally, and why DIY rarely works." Preserves the ranking + reader intent; refers to Jobber-partner or lists other WA options.

Either way, the pages must exist or we lose ~25 ranked commercial-intent keywords on DNS switch.

**Data limitation flagged:** We have rank position evidence, not click-through/call/form evidence. The Rankings sheet doesn't include CTR, impressions, or conversions. GSC + GA4 handoff from Spencer is needed to confirm rank → traffic conversion for these pages specifically. Ranking #1 for 3+ years is the strongest available proxy absent that data.

**C2 — citySlugs alignment (now the most critical Track C item)**

The hardcoded `citySlugs` array in redirects.ts (77 cities) has silently fallen behind `city-data.ts` (90 cities). 13 city pages exist as canonical URLs but their old-site URL patterns hit 404 — including the 4 "exists-but-uncovered" cities surfaced in C1 (Algona, Fairwood, Lake Tapps, Medina).

- Update `citySlugs` 77 → 92 (90 current + Centralia + Eatonville from C1).
- **Derive `citySlugs` from `city-data.ts` at build time** rather than hardcoding — eliminates the silent-drift class of bug.
- Verify every old URL in the Rankings sheet that matches `{city}-mole-{verb}` or `mole-{verb}-{city}` patterns now redirects via citySlugs pattern matching.

**C3 — Missing redirect patterns (now expanded with link-comparison findings)**

Patch redirects.ts for:

- `-2` suffix handler — confirmed via city link comparison: `edgewood-2`, `lacey-2`, `seatac-2`, `spanaway-2`, `sumner-2` (all have working canonical pages, just need pattern handler to strip `-2`).
- E-spelling `mole-repellent-*` (currently only A-spelling `mole-repellant-*` covered).
- Reverse pattern `{slug}-mole-extermination` (puyallup, medina, mill-creek, etc.).
- Reverse pattern `{slug}-mole-exterminator` (spanaway, etc.).
- Spelling variant `southhill` → `south-hill`.
- Bare `/{slug}/` pattern coverage for the 13 cities not currently in citySlugs (resolved automatically once C2 derives from city-data.ts).

**C4 — Redirect verification**
- Post-patch, verify every old URL in the Rankings sheet resolves to a new URL via automated test (curl -I vs expected destination, or Screaming Frog pre-launch).
- Output: `reports/redirect-verification.md` — pass/fail per URL.

**C5 — Sitemap regeneration + reseed**
- After city-data.ts updates, regenerate sitemap, reseed new cities into Payload, redeploy to staging for Ian's review.

### Track D — Old Blog Content Migration (NEW 2026-04-20, launch-critical)

The redirect audit originally proposed routing 27 old blog URLs to "closest cornerstone" on the new site. Roy flagged this as lossy — it forfeits ranked URLs when preservation is cheap. Content inventory (see `reports/old-blog-migration-plan_2026-04-20.md`) confirms the old site has 25 live blog posts totaling ~23,000 words and ~430 ranked keywords. Most have no equivalent on the new build.

**Principle:** 18 high-value old posts keep their URL, have content imported into Payload CMS with the new design system applied, and live at root `/{slug}/` — off the main menu (not featured, but indexed). 7 old posts where a new-site cornerstone genuinely covers the topic better get a 301 merge. No archives — nothing is low-value enough to justify redirect-only.

**D1 — Scraper + transformer script**
- `scripts/migrate-old-blogs.ts` — fetches each of 18 MIGRATE URLs, parses WordPress HTML → Payload Lexical, extracts H1/body/images/author/date.

**D2 — Payload schema addition**
- Add `urlPattern` field to BlogPost collection: `'blog'` (default, /blog/{slug}/) or `'legacy-root'` (/{slug}/). Backwards compatible.

**D3 — Catch-all route for legacy slugs**
- `src/app/(frontend)/[slug]/page.tsx` — resolves `legacy-root` posts by slug. Static routes (`/about/`, `/contact/`, `/faq/`, `/how-it-works/`, `/reviews/`, `/service-areas/`, `/blog/`) take precedence via Next.js routing; add a reserved-slug list for edge cases.

**D4 — Bulk content ingest + design system apply**
- For each of 18 posts: scrape → transform → inject FAQ schema where Q&A exists → add Speakable block → insert 2-3 internal links per post → regenerate hero image via `viz-nano-banana` → humanize to 8.0+ → seed to Payload. `ops-blog-pipeline` in migrate mode.

**D5 — Merge 7 posts into cornerstones + 301s**
- Audit each MERGE mapping: identify any content the old post has that the new cornerstone lacks, fold into new post. Add 7 hand-mapped 301 entries to `redirects.ts`.

**D6 — Sitemap update + verification**
- `src/app/sitemap.ts` lists both `/blog/{slug}/` and legacy-root `/{slug}/` URLs.
- Re-run `reports/_build-redirect-matrix.py` after migration: every old blog URL should return 200 (direct for 18) or 301→200 (for 7).

**Track D dependencies:** none external. Ian's review is additive (GSC data refines MIGRATE/MERGE bucketing) but not gating. Execution can happen independently of Spencer blockers.

---

## Paid Advertising Readiness — Prerequisites Inventory

**Do we have a paid ads plan?** Yes — two briefs, both `status: scoping`, neither live:
- `projects/briefs/google-ads-campaigns/brief.md` — Google Search, Bing, LSA, PMax/retargeting. CPL baseline $10.28 from previous agency.
- `projects/briefs/meta-ads-tmcp-quiz/brief.md` — Meta Ads TMCP funnel via ScoreApp quiz.

**Do we need one?** Yes — Spencer's previous agency was driving ~75 leads/month at $844/month. On DNS switch, that pipeline disappears unless we're ready to replace it.

**Structural prerequisites — what has to exist for ads to run at all:**

| # | Prerequisite | State | Owner | Launch-critical? |
|---|-------------|-------|-------|-------------------|
| 1 | **Jobber API wire on contact form** | ❌ Form has no backend. Submit fails on production. | Spencer (API key) + Claude (wire) | **YES — blocks ALL contact, not just ads** |
| 2 | **Account access handoff — Google Ads, Bing Ads, GA4, Search Console from previous agency** | ❌ Pending | Spencer | **YES — highest-leverage single item. 2+ years of Quality Score disappears if not recovered. Chase harder now.** |
| 3 | **LSA Google Guarantee verification** (license + insurance + Checkr) | ❌ Not started. 2-3 week window. | Spencer + Roy | **Start pre-launch.** If we want LSAs live at DNS switch, verification is already late. |
| 4 | **Tracking env vars in Vercel** — `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GADS_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | ❌ Code wired (`Analytics.tsx` GA4 + Google Ads + Meta Pixel via env vars), IDs not set | Roy | Can happen days post-DNS (no ads running yet) |
| 5 | **`CONVERSION_LABEL` placeholder replacement** (Analytics.tsx:96, 120) | ❌ Placeholder literal in code | Claude Code | Blocked on Spencer #2 (need Ads account to define conversion actions) |
| 6 | **Bing UET tag** | ❌ Not in Analytics.tsx at all — new code | Claude Code | Add pre-launch; IDs set post-DNS. Bing = 34% of paid mix historically. |
| 7 | **Meta CAPI** (server-side conversion events) | ❌ Pixel only, no CAPI | Claude Code | iOS14.5+ makes CAPI table stakes. Add before Meta Ads go live. |
| 8 | **GBP address visibility status** (SAB vs physical) | ❓ Unknown. 3 GBP locations exist. | Spencer | Determines Maps Promoted Pins eligibility (gating for Track B1). |
| 9 | **Phone tracking decision** — Google forwarding numbers (free) or CallRail ($45-75/mo) | ❌ Not decided | Roy | Google forwarding = free default. Defer decision until data shows attribution gaps. |
| 10 | **Call-tracking phone numbers on site** | ❌ Same number everywhere currently | Post #9 | Only matters once ads run. |
| 11 | **Cookie consent banner** | ❌ Not installed | Roy (risk call) | WA-local business = low legal risk. Deferrable. |
| 12 | **`NEXT_PUBLIC_GADS_CONVERSION_PHONE`, `NEXT_PUBLIC_GADS_CONVERSION_FORM` env vars** (move from hardcoded) | ❌ Hardcoded placeholder currently | Claude Code | Refactor with #5. |

**Launch-critical (cannot wait until after DNS switch):**

1. **Jobber API wire** (#1) — without it, DNS switch breaks the contact form entirely. This is urgent for *every* traffic channel, not just ads. Spencer-blocked on the API key. Escalate.
2. **Account access handoff** (#2) — the longer Spencer waits, the colder the previous agency becomes, and the higher the risk of starting from zero Quality Score on DNS switch. Chase this week.
3. **LSA verification kickoff** (#3) — if not started by the week of DNS switch, LSAs cannot be live at launch. 2-3 week window + LSAs are the highest-ROI format for home services per every 2026 guide. Start verification pre-launch even if accounts aren't handed over yet.
4. **Redirect patches + 6-city additions** (Track C of this L2) — already launch-critical. Covered in Phase 2.

**Can schedule post-launch (no blocker to DNS switch):**

- Tracking env vars install (#4) — no ads running, so no lost conversions. Days post-DNS is fine.
- `CONVERSION_LABEL` replacement (#5) — blocked on #2 anyway.
- Bing UET code addition (#6) + Meta CAPI (#7) — pre-launch code work but not DNS-blocking.
- Phone tracking + LP rebuilds + AI Max enablement + PMax/Demand Gen expansion — all Month 1-3+.

**Two independent urgencies live outside this L2 right now:** #1 (Jobber) and #2-3 (Spencer account access + LSA verification). Both are people problems, not code. This L2 can execute its full Phase 2 (redirects + cities + reseed) without either, but the paid side stays blocked until Spencer delivers.

---

## Phases

| Phase | Focus | Tracks touched | Gate |
|-------|-------|----------------|------|
| **Phase 1 — Diagnostic** | Audit + cross-reference, no code changes | A1, A5, B1, B2 | Roy review |
| **Phase 2 — Launch-critical execution** | Ship before 2026-04-27 DNS switch | C1, C2, C3, C4, C5, D1, D2, D3, D4, D5, D6 | Ian sign-off |
| **Phase 3 — Depth execution** | Comparison content, LP rebuilds, tracking | A2, B3, B4, B5 | Roy review |
| **Phase 4 — Presence + research** | Third-party presence, original research, monitoring | A3, A4, A6 | Ongoing (spans post-launch) |

Phases 1 + 2 run in parallel (diagnostic informs C1 decisions). Phases 3 + 4 start after DNS switch.

---

## Success Criteria

### Phase 2 (pre-DNS-switch, 2026-04-27)
- 0 uncovered URLs in the Rankings sheet — 100% resolve to intent-matched pages.
- `citySlugs` matches live city count (90 + any C1 additions), derived from city-data.ts.
- All 15 redirect pattern gaps patched.
- Redirect verification pass rate ≥99% (allowing for the 2 false positives already identified).

### Phase 3 (Month 1 post-launch)
- 4 new comparison pages live and indexed (Got Moles vs DIY, Got Moles vs Moody Moles, 5 city "best of" hubs, 3-way service comparison).
- All 6 Ads campaigns mapped to dedicated conversion-optimized LPs.
- `CONVERSION_LABEL` placeholder replaced, GA4 + Ads + Bing UET firing cleanly.
- Mobile LP CVR ≥5% (baseline from previous agency, if disclosed).

### Phase 4 (Month 2-3 post-launch)
- 1-2 original-research blogs published with Spencer's 5,000-client dataset stats.
- Documented Reddit presence: ≥10 value-led answers on pest / lawn / Seattle subreddits.
- Wikipedia citations confirmed on at least 1 entry (Townsend's mole, Mazama pocket gopher, or Mole).
- YouTube channel seeded with 4+ shorts.
- Yelp / Angi / Nextdoor / BBB profiles claimed and optimized.
- Monthly AI citation tracking running (Otterly, Peec, or DIY script).

---

## Dependencies

| Dependency | Status | Owner |
|------------|--------|-------|
| Previous-agency Rankings sheet full export | Have it (`baseline-from-previous-agency.md`) | — |
| Spencer confirm service area for Centralia + Eatonville | PENDING | Spencer |
| Spencer CRM / Jobber API for 5,000-client stats | PENDING | Spencer |
| Google Ads account access for CONVERSION_LABEL values | PENDING | Spencer |
| Moody Moles competitor research for comparison page | Ready to run | Claude |
| DNS switch window | Week of 2026-04-27 | Ian + Roy |
| Ian sign-off on redirect changes | Required pre-launch | Ian |

---

## Open Decisions

1. **Centralia + Eatonville — messaging only (not existence).** Rankings evidence says pages must exist. Spencer confirms whether they service these areas or the pages refer leads regionally. Default to "Add" regardless.
2. **GBP address visibility (Maps eligibility).** Are Spencer's 3 GBP locations set as service-area-business (hidden address) or physical-address? Determines whether Promoted Pins on Maps are available or we fall back to Location-Asset Search + LSA on Maps.
3. **AI Max for Search rollout order.** Brand-first (safer) or launch across all Search campaigns Day 1? Phase 2 auto-upgrade is September 2026 — voluntary phase is the opportunity to tune guardrails (Brand Settings, URL Rules, Text Customization) before it becomes mandatory.
4. **Demand Gen timing.** Add as Month 3+ experiment once video/image assets are produced, or defer to Year 2? Pest-control mid-funnel video isn't free to produce.
5. **City-level "Best mole control in X" comparison pages — build as /blog/ posts or as dedicated /compare/ route?** `/compare/` makes a cleaner hub but requires new page template; blog post is faster but mixes informational and comparison content.
6. **Original research gate — publish now with aggregate stats from CRM exports, or wait for Jobber API?** API gives clean automation; export is faster but one-off.
7. **Third-party presence — who operates the Reddit / YouTube accounts?** Spencer (authentic), Roy (efficient), or a contractor (scaled)?
8. **AI citation monitoring — Otterly (~$60/mo), Peec (free tier), or DIY cron script?**
9. **LP variant phasing — ship all objection-led variants Month 1, or A/B test top 1-2 first?**

---

## Supporting Files

- `projects/str-ai-seo/2026-04-20_full-seo-geo-report.md` — yesterday's internal audit, baseline for this L2.
- `projects/briefs/google-ads-campaigns/brief.md` — paid search scope that feeds Track B.
- `projects/briefs/google-ads-campaigns/baseline-from-previous-agency.md` — the Rankings sheet breakdown feeding A1 + C3.
- `projects/briefs/seo-geo-reinforcement/reports/city-rank-evidence_2026-04-20.md` — full per-city ranking evidence from the Rankings sheet.
- `projects/briefs/seo-geo-reinforcement/reports/city-link-comparison_2026-04-20.md` — old vs new site city link comparison + HTTP probe results that corrected C1 from "6 cities to add" to "2 to add + 4 redirect-only".
- `projects/briefs/website-rebuild-rebrand/LAUNCH-CHECKLIST.md` — DNS switch runbook this L2 feeds into.
- `src/lib/redirects.ts` — the file Track C patches.
- `src/lib/city-data.ts` — the file Track C reads from (and citySlugs should derive from).
- `src/app/(frontend)/lp/*` — the 4 existing LPs Track B audits.

**Research inputs (2026-04-20 web search, captured for traceability):**
- Wordstream — 11 Biggest Google Ads Updates of 2025 (Power Pack, AI Max for Search, PMax negatives + High Value Mode, Asset Studio, AI Overviews ads)
- Google Ads Help — Local Services campaigns API docs
- Google Ads Help — "Show local search ads on Google Maps" + "How to advertise in Google Maps"
- PCT Online — How to Win More Pest Control Jobs with Smarter Google Ads and AI Search Strategy
- ALM Corp — Google Tests "Sponsored Places" Ad Unit Feb 2026
- Shopify — Google Maps Ads 2026 definitive guide
- Wizard Creative Labs — 2026 Google Ads campaign types guide
- MediaPost — Google Replacing Dynamic Search Ads With AI Max 04/15/2026

---

## Team & Ownership

| Role | Person |
|------|--------|
| Brief + scope | Roy + Claude Code |
| Track A execution | Claude Code (content + research) |
| Track A content approval | Roy |
| Track B audit + new LPs | Claude Code |
| Track B conversion tracking | Roy (env vars) + Claude Code (wiring) |
| Track C execution | Claude Code |
| Track C Ian sign-off | Ian (external SEO) |
| Track C Spencer decisions | Spencer (service area) |
| Deployment | Vercel auto-deploy from main |

---

## Notion

Page: `3483d42c-4a9c-811b-b688-edb7159411bd`
URL: https://www.notion.so/Brief-SEO-GEO-Reinforcement-Ads-LPs-Service-Areas-2026-04-20-3483d42c4a9c811bb688edb7159411bd
