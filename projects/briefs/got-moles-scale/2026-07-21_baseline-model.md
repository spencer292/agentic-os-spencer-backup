# Got Moles — Phase 0 Baseline Model

Generated 2026-07-21 (overnight diagnostic). Every number below is computed from live Jobber/CallRail pulls
(8,716 invoices · 4,243 clients · 1,130 quotes · 4,344 visits — raw data in `data/`).
Estimates are labeled ESTIMATE. Gaps are labeled GAP.

---

## 1. Revenue — where the business actually is

| Metric | Value |
|---|---|
| **Trailing 12-month revenue** (Jul 2025–Jun 2026) | **$857,312** |
| Prior 12 months (Aug 2024–Jul 2025) | ~$625,000 |
| **YoY growth** | **+37%** |
| Recent monthly pace (Apr–Jun 2026) | $69K–$78K/mo (~$890K annualized) |
| Best month ever | Sep 2025: $95,000 |
| Bad debt (24 mo) | $1,600 (0.1% — excellent) |

**Verdict:** the "$1M push" is real and on track — at +37% YoY the business crosses $1M run-rate around
fall 2026 without any new strategy. The question is entirely about the *next* 5x.

**Seasonality:** strong Aug–Nov (fall mole season, Sep peak), trough Nov–May. Any growth plan must
front-load acquisition ahead of August.

## 2. Revenue mix — what the money actually is

Top line-item families (24 mo):

| Family | Revenue | Signal |
|---|---|---|
| Monthly mole control ("1 month..." + regional variants) | ~$571K | The workhorse |
| TMCP / year-round program | ~$378K | The recurring asset — **597 active members** (tag count) |
| Annual service (one-shot annual, regional variants) | ~$425K | Large but renewal-dependent |
| Quick Fix | ~$57K | Entry product, upsell feeder |
| Setup/service fees, trip charges, misc | ~$40K | |

- **Avg revenue per invoiced client (24 mo): $944.** Median: $475. Top 10% of clients = 37% of revenue.
- 1,546 distinct clients invoiced in 24 mo; **636 active in the last 3 months**.
- "Neighboring property half price" already exists as a line item — the density play has a toehold.

## 3. Demand & conversion — the funnel

| Stage | Value |
|---|---|
| Calls (CallRail, May–Jul 2026) | 193 / 286 / 213 per month |
| Quotes sent (12 mo) | 1,130 |
| **Close rate** | **69%** (785 converted of 1,130) |
| Avg quote value | $925 |
| Quote value won (12 mo) | $668K |

**Verdict:** conversion is elite for home services (industry norm 30–50%). Growth is **lead-constrained,
not conversion-constrained**. Every incremental lead is worth ~$640 in expected value (0.69 × $925).

**GAP — attribution:** 85% of client records have `leadSource: unknown` (3,591 of 4,243). Known sources:
CallRail 410, Google 86, website 74, referrals/partners ~40, **ChatGPT 8 + Gemini 2** (AI referrals are
already real). CAC by channel is uncomputable until attribution is enforced at intake — and Ads spend
data is absent on this install (no API creds; snapshot JSONs are stale baseline only).

**Caveat — new-client spike:** May/Jun/Jul 2026 show 186/259/204 new client *records* vs 25–50/mo
historically. Part of this is genuine growth; part is the Voice Assist + CallRail sync creating records
for callers/leads (831 lead records in the system). Treat the spike as directional, not literal.

## 4. Capacity — the physical ceiling

Last 12 weeks: **4,344 completed visits ≈ 362/week**, avg 15 min on-site.

| Tech | Visits/week |
|---|---|
| Luke LaVergne | 125 |
| Cory Ventura | 103 |
| Cammeron Anderson | 78 |
| **Spencer Hill** | **43** |
| Tavis Alexander | 27 |
| Alias Franks | 3 |

**Verdicts:**
- Luke and Cory are at or near full route capacity (125 visits × 15 min + drive time = a full week).
- **Spencer is still a route tech 43 visits/week.** "Pure visionary" requires replacing him in the field —
  that's ~1 FTE of trapping capacity to hire before anything else.
- **Cory runs 103 visits/week.** "Cory at the helm" requires pulling him progressively off routes too —
  the GM job and a full route are incompatible. Every growth scenario starts with 2 hires just to free
  the two of you, before any *growth* hires.
- Revenue per completed visit ≈ $45. At 15-min visits the model is drive-time-dominated — **route density
  is the profit lever** (the neighboring-property discount is the seed of this).

## 5. Leakage — found money

| Item | Value |
|---|---|
| Open AR | $19,732 across 54 invoices |
| Past due | $5,589 across 29 invoices |
| Clients w/ open balance | 53 |
| TMCP Churned tag | only 20 tagged (vs 597 active) — churn is **not being tracked**, GAP |
| Known specifics | K. Porter #5007 ~$2.9k uninvoiced; TMCP #8030+ untagged |

Collections sweep + churn-tagging hygiene = a few thousand recovered now, and churn visibility forever.

## 6. Gap math — what $5M and $10M actually require

Model: recurring-heavy mix, TMCP-style membership at ~$1,300/yr blended (ESTIMATE from current tag base
and program pricing), one-time work continuing at today's share.

| | Today | $5M | $10M |
|---|---|---|---|
| Revenue | $857K | $5M (5.8x) | $10M (11.7x) |
| Active recurring members (~$1,300/yr) needed | ~600 | **~2,900** | **~5,800** |
| Completed visits/week | 362 | ~2,100 | ~4,200 |
| Field techs (@ ~100 visits/wk each) | 6 bodies (incl. Spencer) | **~21** | **~42** |
| Leads/month (at 69% close, $925 avg) | ~230 calls | ~1,100 | ~2,200 |
| Implied hiring pace (2–3 yrs) | — | ~6–8 techs/yr | ~12–15 techs/yr |

**The three binding constraints, in order:**
1. **Lead flow** — must grow ~5x. Conversion is already elite; marketing is the bottleneck.
2. **Tech hiring/training machine** — ~1 hire every 6–8 weeks sustained for years. This is Cory's real job.
3. **Route density** — at 15-min visits, revenue scales with stops-per-mile, not hours worked.

## 7. TAM — can Western WA carry $5–10M? (ESTIMATE)

Service regions in the data: North / Central / Valley / South (Puget Sound metro). Rough model:
~1.5–2M households in the service counties; ~60% with yards; 5–10% with an active mole problem in any
year → **50K–100K serviceable households/year**. At $500–$1,300 tickets that's a regional annual spend
potential in the tens of millions, mostly unserved or DIY. Competitors visible in the data (Cascade Pest,
Mole Busters, Mole Lady) are small/fragmented.

**Verdict:** **$5M in-region is a share-and-density problem, not a TAM problem.** $10M in-region gets
thin — the $10M paths are: (a) adjacent metros (Portland/Spokane) on the same AI ops stack, (b) service
adjacency (voles/gophers — brand decision), (c) acquiring competitors' books, (d) licensing the Route
playbook. Decision not needed until ~$3M run-rate.

## 8. Ranked vectors (draft — for the microscope session with Spencer)

1. **Lead engine 5x** — Ads relaunch (creds + campaigns), **Google Local Services Ads (not present in any
   data — likely the single biggest untapped local channel)**, GBP/review velocity, referral program,
   neighborhood density offers around existing stops.
2. **Free the founders** — hire 2 techs (Spencer's 43 + half of Cory's 103), promote Cory to GM with the
   hiring machine as his #1 metric.
3. **Recurring-first mix** — every Quick Fix and annual converts to TMCP by default;
   target: recurring >60% of revenue (multiplies LTV and smooths the Nov–May trough).
4. **Ops hygiene now** — AR sweep ($20K sitting), churn tagging, mandatory lead-source at intake
   (fixes CAC forever), TMCP tag backfill.
5. **Density pricing** — systematize neighboring-property offers; route-cluster targeting in ads.
6. **Ceiling-breakers ($10M tier, decide at ~$3M):** new metros / adjacency / acquisition / licensing.

## 9. Data gaps to close

- Google Ads creds on this install → real spend + CAC (application/API path documented in side project)
- Lead-source enforcement at intake (CSR script + VA already captures "how did you find us" — pipe it to the field)
- Churn definition + monthly cohort tracking (TMCP tag hygiene)
- CallRail pre-May history doesn't exist (account new) — funnel baselines start May 2026
