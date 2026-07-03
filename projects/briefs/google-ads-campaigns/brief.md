---
project: google-ads-campaigns
status: superseded
level: 2
created: 2026-04-20
updated: 2026-04-20 (rewritten after previous-agency baseline surfaced)
superseded-by: ../../../../projects/briefs/got-moles-paid-search/ (ATP root)
---

> **SUPERSEDED 2026-05-10.** Paid search now run as ATP service work for Got Moles. Active project: `projects/briefs/got-moles-paid-search/` at the agent-os root. Retained for history.


# Got Moles — Paid Search (Google + Bing) Campaigns

## Goal

Drive qualified mole-control leads via paid search. Re-platform from the previous agency's setup onto the new site without losing the $10 CPL baseline they built. Expand Bing Ads (already 34% of paid mix — the original brief draft missed this). Layer in Local Services Ads (LSA) to capture queries above organic + paid search.

## Status: SCOPING — not yet ready to build

The first draft of this brief (commit `02bdca9`, 2026-04-20) forecast CPL of $35-80 and a $1,650/month budget — numbers invented from industry benchmarks without the real baseline. When Roy shared the previous agency's spreadsheet later the same day, the actual numbers landed:

- 2025 blended CPL: **$10.28** (not $35-80)
- 2025 monthly spend: **~$844** (not $1,650)
- **Bing Ads is 34% of paid spend** (my first draft didn't include it)

This rewrite anchors to real numbers. Additional inputs expected from Roy before final build.

See `baseline-from-previous-agency.md` in this folder for the full breakdown.

---

## The Baseline (what we must match or beat)

### 2025 Jan-Nov actuals

| Metric | Value |
|---|---|
| Google Ads spend | $6,127.14 ($557/mo) |
| Bing Ads spend | $3,159.22 ($287/mo) |
| **Total paid spend** | **$9,286.36 ($844/mo)** |
| **Total leads** | **903 (~75/mo)** |
| **Blended CPL** | **$10.28** |

### 2024 comparison

Same CPL ($10.02 blended), slightly lower spend ($8,759). CPL has held stable across two years — mature campaigns, stable Quality Score, no deterioration.

### What this means

- **Target CPL: match or beat $10.28.** Not $35-80. Not $75. Not "industry benchmark." Anything above $15 is a regression.
- **Bing Ads runs alongside Google**, not instead of. Same approximate CPL. Don't drop it.
- **Starting budget is whatever matches the existing run rate** (~$850/month) unless there's a capacity hypothesis saying Spencer can take more leads than he did this year.

---

## Strategy (revised)

### Channels

| Priority | Channel | Share target | Rationale |
|---|---|---|---|
| 1 | **Google Search Ads** | ~55-60% of paid | Core acquisition; continues the existing 2-year campaign history if we can inherit the account |
| 2 | **Microsoft Ads (Bing)** | ~30-35% of paid | Existing agency has this at $287/mo pulling the same $10 CPL. Never drop it. Bing converts well for older demographics typical of homeowners with lawn-care problems. |
| 3 | **Local Services Ads (LSA)** | Variable (pay-per-lead, not budgeted alongside CPC) | Above-search listings for local service queries. Requires Google Guarantee verification (license, insurance, Checkr). Additive to Search, not replacing it. |
| 4 | Call-only Ads | Small share inside Search budget | Mobile-only direct-dial ads. Cheap, direct. Implement as a separate campaign inside Google Search allocation. |
| 5 | Performance Max / Display retargeting | Month 2+ | Retargeting once the Ads tag is live and collecting site-visitor data. Don't launch cold. |

NOT using: Shopping (no products), Video (no video assets yet).

### Account Continuity

**Primary ask of Spencer:** obtain the previous agency's Google Ads account + Bing Ads account so we inherit:

- 2+ years of Quality Score history on high-CPC commercial terms
- Negative keyword list (hard-earned — DIY searchers, tool-buyers, animal disambiguation)
- Audience lists (remarketing pools built over time)
- Conversion tracking history for tCPA bidding baselines
- Historical performance data per keyword / ad group for diagnosis

Starting fresh wastes years of learning. This is the single biggest lever in the whole brief.

**Fallback if accounts are unrecoverable:** start new accounts but import the negative keyword list and audience seed data from the spreadsheet + Spencer's client CRM. Expect a 2-3 month ramp back to $10 CPL.

### Campaign Structure (draft — open for Roy revision)

5 campaigns starting:

| Campaign | Platform | LP | Focus |
|---|---|---|---|
| GM-GG-Search-Removal | Google Search | `/lp/mole-removal` | High-intent "get rid of moles" / "mole removal [city]" |
| GM-GG-Search-TMCP | Google Search | `/lp/mole-protection-plan` | "monthly mole control" / "year-round mole service" |
| GM-GG-Search-Commercial | Google Search | `/lp/commercial` | "commercial mole control" / "HOA mole control" |
| GM-GG-Search-Brand | Google Search | `/` | "got moles" + brand variants |
| GM-BG-Search-Mirror | Bing | Same LPs | Mirror of the 4 Google campaigns — separate account, same creative/keywords |
| (later) GM-LSA-Western-WA | Google LSA | — | Once Google Guarantee verification completes (2-3 week window) |

### Budget (starting)

Based on 2025 actuals:

| Line | Monthly |
|---|---|
| Google Search (Removal + TMCP + Commercial + Brand + Call-only) | $560 |
| Bing mirror | $290 |
| **Total starting** | **$850** |

Scale only if leads are closing at Spencer's capacity, not by default. 2025 delivered 75 leads/month at this spend; capacity check: can Spencer serve >75 new leads/month without dropping quality? If no, spend stays flat and we optimise for lower CPL.

LSA is additive, pay-per-lead (separate from CPC budget) — expect $35-90 per lead depending on category.

### Keyword & Negative Strategy

Inherit from previous agency if we get the accounts. If not, seed from the spreadsheet's top-performing organic ranking terms (those are proven commercial-intent queries).

- **Positives:** `mole control [city]`, `mole removal [city]`, `mole exterminator [city]`, `get rid of moles`, service-specific terms (`monthly mole control`, `year-round mole`), commercial-specific terms.
- **Negatives (must-haves):** how-to / DIY / home-remedy / natural / yourself / free / cheap / job / guide / Wikipedia / Reddit / YouTube / pocket gopher / gopher / vole / rat / mouse / mole cricket / mole concealer / mole removal skin|face|surgery / dermatology / amazon|home-depot|lowes|walmart.

### Conversion Tracking

- Phone calls from ad (call extensions + call-only): $50 conversion value
- Form submits from LP (via `Analytics.tsx` trackFormSubmit helper + GA4 import to Ads): $75 conversion value
- Quiz completion (ScoreApp → GA4, secondary): $25 conversion value

**Code task:** replace `CONVERSION_LABEL` literal placeholder in `src/components/Analytics.tsx` lines 96 + 120 with real labels. Consider moving to env vars `NEXT_PUBLIC_GADS_CONVERSION_PHONE` and `NEXT_PUBLIC_GADS_CONVERSION_FORM` for portability.

### Call Tracking

Start with Google forwarding numbers (free, built-in attribution). Revisit CallRail ($45-75/month) only if keyword-level call attribution becomes unclear post-launch.

### Location Targeting

Include: King, Pierce, Snohomish, Thurston, Kitsap counties + 35mi radius from Enumclaw for rural acreage. Bid modifiers +15% on Eastside high-HHI cities (Sammamish, Bellevue, Kirkland, Redmond, Issaquah, Mercer Island).

---

## Success Criteria

### Month 1 (launch to 30 days)

- Inherited (or rebuilt) campaigns live and pacing to $850/month baseline.
- Blended CPL ≤ $15 (allowing some drift during ramp).
- ≥60 total paid leads (vs 75/mo baseline; 80% retention during platform transition is acceptable).
- Conversion tracking firing cleanly in both GA4 and Ads (Google + Bing).
- LSA enrolled (verification in progress).

### Month 3 (steady state)

- Blended CPL ≤ $10.28 — back to baseline.
- ≥75 leads/month — match previous run rate.
- LSA live with ≥15 leads/month.
- tCPA bidding active on at least 3 of the 4 Google Search campaigns.
- Bing running at 30-35% of paid mix (protect the existing channel mix).

### Month 6+ (scale / optimise)

- Decision point: does Spencer have capacity for more leads? If yes, scale spend in $200/month increments with CPL cap at $12. If no, hold spend flat and compound Quality Score for a lower CPL.

---

## Open Decisions & Roy Inputs Needed

Roy signalled "a few things to add." Placeholders:

1. [ ] **Account access status** — does Spencer have the credentials for the previous agency's Google + Bing accounts? Key question before any build work.
2. [ ] **LSA enrolment timing** — start Google Guarantee verification before DNS switch (2-3 week window) or defer to Month 2?
3. [ ] **Budget ceiling** — is $850/month the right starting point, or does Spencer want to scale immediately? Anchored to 2025 actual run rate.
4. [ ] **Customer-match upload** — willing to share Spencer's 5,000-client list (hashed, privacy-compliant) for exclusion + lookalikes?
5. [ ] **Call tracking** — Google forwarding (free) at launch, or CallRail for richer attribution?
6. [ ] **Jobber urgency** — without the Jobber API, lead-to-sale ROI is blind. Push Spencer harder pre-launch?
7. [ ] **Roy's additions** — (Roy to fill in)

---

## Launch Dependencies

| Dependency | Status | Owner |
|---|---|---|
| DNS switch to got-moles.com | Week of 2026-04-27 | Ian + Roy |
| Redirect gap patches (15 uncovered URLs) | Planned, launch-critical | Claude Code (execute when approved) |
| Google Ads account access (previous agency handoff) | PENDING — priority ask | Spencer |
| Microsoft Ads account access (previous agency handoff) | PENDING — priority ask | Spencer |
| GA4 + Search Console handoff | PENDING | Spencer |
| `NEXT_PUBLIC_GADS_ID` in Vercel | Roy-unblocked | Roy |
| `CONVERSION_LABEL` replaced in Analytics.tsx | Post account setup | Claude Code |
| Google Guarantee verification for LSA | Not started | Spencer + Roy |
| Jobber API key (for sale-side attribution) | PENDING | Spencer |

---

## Team & Ownership

| Role | Person |
|---|---|
| Campaign strategy + brief | Roy (with Claude Code) |
| Account access + handoff | Spencer |
| Google Guarantee verification | Spencer + Roy |
| Ad copy drafts | Claude Code (humanizer pass, Roy sign-off) |
| Landing page conversion review | Roy |
| Conversion action setup | Roy (in Ads) + Claude Code (in Analytics.tsx) |
| Weekly optimisation | Roy or Claude Code via scheduled runs |
| Budget approval | Spencer |

---

## References

- `projects/briefs/google-ads-campaigns/baseline-from-previous-agency.md` — full breakdown of the spreadsheet
- Memory: `reference_got_moles_ppc_seo_baseline.md` — hard numbers for future sessions
- Parallel: `projects/briefs/meta-ads-tmcp-quiz/brief.md` — Meta Ads scope (complementary, not overlapping)
- `src/lib/redirects.ts` — redirect list (15 gaps to patch pre-launch)
- `src/components/Analytics.tsx` — tracking integration point
