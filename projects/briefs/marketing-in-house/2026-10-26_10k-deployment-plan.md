# $10K Marketing Deployment Plan

**Date:** 2026-10-26 · **Seat:** mkt-cmo (plan mode) · **Status:** DRAFT. Nothing is spent, launched or sent without Spencer's yes on the exact budget, segment and copy.

## Answer

The $10K can't all be spent usefully on marketing right now. About $3.5K has a clear use before spring:

- a campaign to existing customers
- a small Google push in the one territory with spare hours

Hold the remaining ~$6.5K until February. By then two things will be known: what the first $3.5K booked, and whether the planned May 1 hire needs funding. The seasonal staffing analysis says 2027 peak needs 6–7 techs against 5 today. From summer 2027 the limit is techs, not leads.

## What the data says

| Fact | Value | Tag |
|---|---|---|
| Current advertising spend | ~$5.2K/mo ($57K, Oct 2025–Aug 2026) | KNOWN, cfo/brief.md |
| 2027 plan ad budget | up to ~$9K/mo Feb–Sep | KNOWN, got-moles-scale/2026-10-20_2027-revenue-plan.md |
| Revenue from existing customers | 82% | KNOWN, cfo/brief.md |
| New customers, last Nov / Dec / Jan / Feb | 56 / 30 / 6 / 14 | KNOWN, cfo/brief.md |
| Calls from GBP + organic | majority. Google Ads ~20% of calls (Jul) | KNOWN, CallRail 2026-07-31 brief |
| First-time callers, Aug / Sep / Oct-to-date | 276 / 269 / 269 | KNOWN, CallRail live pull 2026-10-26 |
| Repeat Quick Fix, never on program, last job within 24 mo | 357 (300 never quoted the program) | KNOWN, tmcp-conversion 2026-08-06 |
| Ex-program winback pool | 84 | KNOWN, same pull |
| Repeat QF spend | median ~$775–925/yr | KNOWN, same pull |
| TMCP churn | 1.14%/mo, measured in peak | KNOWN, 2027 plan |
| TMCP variable cost | ~$41/mo per job | ESTIMATE, cfo 2026-09-29 unit economics |
| Spare tech hours, week of 10-26 | Cory ~16 h. All others at or over 40 h | KNOWN, route files 10-26 |
| Trough slack, Dec–Feb | ~1 tech-equivalent across the roster | ESTIMATE, seasonal staffing analysis |
| Google Ads live data | **UNAVAILABLE**: API returns 401 | KNOWN, 2026-10-26 |
| Cost per booked job, any channel | UNKNOWN. Recent clients are 18% null source, but "CallRail" is a tracking source, not a channel | KNOWN gap |

## The plan

### Step 0: Measurement (now, ~$0, needs Spencer)

1. **Re-authorize the Google Ads API.** Run `node .claude/skills/ops-got-moles-ads/scripts/get-google-ads-refresh-token.mjs` and complete the consent step in the browser. Without it there is no spend, conversion or budget-limited data, and no kill criterion for paid can be checked.
2. **Make "how did you hear about us" required at intake.** This applies to office and Voice Assist bookings, and "Google" must be split into GBP, ad or search. This is F-01.

### Step 1: Repeat Quick Fix customers to the program (Nov 1 – Dec 20, budget ~$2,000)

| | |
|---|---|
| Segment | 357 repeat-QF within 24 months + 84 ex-program = **441** |
| Offer | Join the program at today's rate before the Jan 1 new-sale price change (**only true if Spencer confirms the Jan 1 list change**; otherwise a different offer) |
| Channels | Text + email (≈$0), postcard to the 441 (~$550 ESTIMATE), office follow-up call to the LIVE/HOT tiers (198) |
| Incentive cap | ~$1,450 (Spencer chooses: waived setup, first visit free, or none) |
| Expected | 8–15% convert = 35–66 program signups (ESTIMATE; the 2027 plan assumes 15%) |
| Value | Each repeat-QF customer already pays ~$850/yr. On the program they pay ~$1,320/yr, so the gain is **about +$500/yr each, recurring** (ESTIMATE). Total is +$17–33K/yr of revenue, plus moving one-off revenue into recurring, which raises the valuation multiple |
| CPBJ | ~$30–57 per program signup (ESTIMATE) |
| Capacity | ~2 visits/mo each, so 70–130 visits/mo. This lands in the trough, where about 400 visits/mo of slack exists |
| Kill | Under 15 signups by Dec 1 → stop the postcard follow-up and the incentive |
| Timing guard | Finish before the Jan 5 grandfathered-price notice. Do not send anything to existing program customers in the 30 days around either price notice |

This moves the 2027 plan's Jan–Mar winback into Nov–Dec. Earlier is better: the rate-lock reason is real, and the slack arrives in December.

### Step 2: Google Search in Cory's ground (Nov 1–30, budget ~$1,500)

| | |
|---|---|
| Area | Enumclaw, Buckley, Bonney Lake, Lake Tapps, Sumner, Puyallup, Edgewood (Cory's routes, ~16 h/wk open) |
| Why November | Last November still brought 56 new customers (seasonality index 1.15). December falls to 30 and January to 6 |
| Prerequisite | Step 0.1 done. No launch on an account that can't be read |
| Expected | 4–7 booked jobs at a $200–400 CAC benchmark (ESTIMATE). Gross value per lead is ~$640 (KNOWN) |
| Kill | Fewer than 2 first-time-caller bookings per $500 by mid-November (CallRail + Jobber) → stop |
| Policy | Posture-A copy, ~120 medical negatives, claims gate |

### Step 3: Hold (Dec – Feb, $0 paid)

January brought 6 new customers last year. Paid spend in the trough buys very little. Hold the ~$6,500 balance.

### Step 4: Decide in February (~$6,500)

Choose based on the measured results from Steps 1–2:

- **If paid CPBJ beats $300 and payback is under 6 months:** add the money to the spring ramp (Mar–May) and an LSA test (rodent category, F-11). This sits on top of the 2027 plan's $9K/mo, not instead of it.
- **If spring demand looks capped by techs:** put it toward the May 1 hire's ramp-up (training weeks before the hire is productive). An unserved lead is worth nothing.

## Decisions for Spencer

1. Confirm the Jan 1 new-sale price change ($110/$135/$165). Step 1's offer depends on it.
2. Choose the Step 1 incentive (or none).
3. Re-authorize the Google Ads API (one browser consent step).
4. Approve Step 1 copy and segment, then Step 2 budget and ads. These are separate approvals, drafted next.

## Open questions this plan does not answer

- How the $5.2K/mo ad line splits across Google, Bing, Meta and the DigiHammer retainer (UNKNOWN; the snapshot shows Google at ~$40/day in Sept).
- Quick Fix contribution margin (UNKNOWN; no file models it).
- Winter churn on the program (measured only in peak).
