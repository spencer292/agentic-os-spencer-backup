# Ninety Scorecard — Live Audit (2026-07-22)

Pulled via API: 96 KPIs (41 weekly, 13 monthly, 21 quarterly, 21 annual). Raw data:
`data/2026-07-22_ninety-kpis.json`. Companion plan: `2026-07-22_ninety-scorecard-plan.md`.

## Headline findings

1. **The scorecard has stopped being filled in.** 28 of 41 weekly KPIs have *never* had a score entered.
   The ~10 that were maintained all stopped at the week of **2026-06-26** (~4 weeks stale). The only KPI
   updated since is "Total TMCP Jobs active" (Spencer, 7/05). This is exactly the problem automation fixes —
   the scorecard died of manual data entry.
2. **Duplicates & typos:** "TMCP MRR" exists 3× (all never scored), "Quick fix created" vs "quick fix jobs
   created" 2×, "TCMP - Converted" (typo), several titles with trailing spaces.
3. **The 12-KPI lead-source matrix (Facebook/Google/Website/Email/Referral/Phone × leads+converted) has
   never been scored once** — unsurprising, since 85% of Jobber client records have no lead source. Twelve
   empty rows every week is scorecard noise until attribution is fixed at intake.
4. **Almost nothing has an owner** (1 of 41 weekly) and most goals are 0 (no target). EOS-wise every
   measurable needs an owner and a goal.
5. **A P&L lives in the scorecard:** 13 monthly expense-category KPIs (Payroll, Fuel, Vehicle Payments, …
   incl. "Roy", "401K") plus weekly Gross Profit / Payroll % / Fleet Expenses — all never scored. No system
   on this install can feed these (that's QuickBooks territory); they'll stay manual or move monthly.
6. Quarterly/annual blocks are Ninety's default company templates (competency scores, EBITDA, etc.) — leave as-is.
7. Goals that exist are stale vs. baseline: TMCP active goal 524 (actual 597), Client visits goal 464
   (actual ~362 — aspirational or stale?).

## Restructure proposal — target weekly scorecard (Leadership)

**KEEP + AUTOMATE** (existing KPI, wired to auto-push):

| KPI (existing id) | Feed | Note |
|---|---|---|
| Phone Calls `68c43bbaee2b0f4086bf0f1e` | CallRail | rename → "New Leads (calls)" |
| New Clients `68c43c40ee2b0f4086bf0fd3` | Jobber | |
| TMCP - Quoted `68c43cfeee2b0f4086bf1160` | Jobber quotes | |
| TCMP - Converted `68c43d5bee2b0f4086bf1203` | Jobber quotes | fix typo → "TMCP - Converted" |
| Quick Fix - Quoted `6984f163e05d0ee69a2c255d` | Jobber quotes | |
| Quick Fix - Converted `6984f181e05d0ee69a2c2a9e` | Jobber quotes | |
| TOTAL REVENUE `69c5640dac5904cd09f444ce` | Jobber invoices | |
| Total TMCP Jobs active `68ffb70bd1b9801458ee1fbf` | Jobber tags | update goal 524 → track to 2,900 ($5M) |
| TMCP Net New `69c560e4ac5904cd09f3d948` | Jobber tags | |
| TMCP Cancellations `69c5609dac5904cd09f3cea1` | Jobber tags | needs churn-tag hygiene |
| TMCP MRR `69cadbd1386fa68ae083cf8d` | Jobber recurring jobs | keep this one, archive the other two |
| Past-Due Invoices `69c567efae5469d8e458e8bb` | Jobber AR | |
| Client visits `68c43ca3ee2b0f4086bf10c0` | Jobber visits | |

**ADD (new KPIs, Spencer creates in UI — API has no KPI-create):**

| New KPI | Feed | Why |
|---|---|---|
| Quote Close Rate % (rolling 4wk) | Jobber | the elite 69% — watch it as volume scales |
| Lead Source Captured % | Jobber | the attribution fix-forever metric; goal ≥90% |
| Recurring % of Revenue (rolling 4wk) | Jobber | mix target >60% |
| Stops per Route-Hour | OptimoRoute | the density/profit lever |
| Missed Calls | CallRail | each ≈ $640 expected value lost (0.69 × $925); set goal orientation *≤* (e.g. ≤2/wk) |
| New Google Reviews | scrape (semi-auto) | review velocity → LSA/GBP |
| Candidates in Hiring Pipeline | Cory (manual) | replaces "Open up hiring and begin interviews" |
| (optional) Spencer Field Visits | Jobber | "free the founders" — target 0 |

**ARCHIVE** (in Ninety UI): TMCP MRR dupes ×2 (`69c564e9…`, `69c56435…`), "quick fix jobs created"
(`6994a95d…`, dupe of Quick fix created — or keep whichever title they prefer and archive the other),
"Open up hiring and begin interviews" (`69334b35…`, it's a Rock not a measurable), the 12 per-source
lead/converted KPIs (restore later when Lead Source Captured % ≥90% — then they auto-fill from Jobber),
"Leads of Phone" (`68d6b31e…`, superseded by Phone Calls).

**DECIDE** (Spencer/Cory):
- Financial block (Gross Profit, Total Payroll, Payroll %, Fleet Expenses, CAC, Marketing Spend + the 13
  monthly expense lines): no data feed exists on this install. Options: (a) assign an owner who enters them
  monthly from QuickBooks, (b) archive weekly financials and keep monthly-only, (c) wire QuickBooks later.
  Recommendation: **(b)** now, revisit QuickBooks integration as its own project.
- "Total Jobs created" (`69331deb…`, goal 30, stale since Feb): keep+automate from Jobber, or archive as
  redundant with the Quoted/Converted funnel. Recommendation: keep, it's free to automate.
- Marketing Spend + CAC: leave unscored until Google Ads creds land, then auto-push spend; CAC becomes real
  once Lead Source Captured % is up.

Resulting weekly board: **~15 auto + 2 manual** (reviews semi-auto, hiring pipeline manual) — down from 41.

## Next build steps (after Spencer sign-off on the above)

1. Spencer does the UI pass: archive list above, create the 6-7 new KPIs, set owners + goals.
2. Claude re-pulls KPI list → writes `scripts/ninety-weekly-push.mjs` (Jobber+CallRail+OptimoRoute →
   compute → POST scores) keyed to a checked-in id-mapping file.
3. Backfill: compute weeks from 2026-05-01 (CallRail history floor) and push, so the L10 board has a
   trend line from day one.
4. Register the Monday cron via ops-cron; log runs to `scorecard-runs/`; never push a guessed number.

## Build status (2026-07-23)

- **DONE:** `scripts/ninety-weekly-push.mjs` + `scripts/ninety-kpi-map.json` built; **backfill pushed —
  166 scores across 12 weeks (2026-04-26 .. 2026-07-12), 13 metrics, 0 failures.** Sunday-start weeks
  (Spencer-confirmed), Pacific-time bucketing, run logs in `scorecard-runs/`.
- Call metrics floored at week 2026-05-17 (CallRail numbers went fully live mid-May; earlier weeks undercount).
- Past-due pushed to current week only (point-in-time): 30 invoices / $6,339, dollar total as a KPI note.
- **TMCP Cancellations intentionally NOT pushed** — computes 0 every week because early-cancelled jobs keep a
  future endAt in Jobber. Blocked on churn-tagging hygiene; disabled in the map with a note.
- Revenue is genuinely lumpy weekly ($55–70K month-end TMCP batch invoicing, small mid-month weeks) — sums to
  baseline pace (~$78K/4wk). Consider a "revenue (rolling 4wk)" KPI if the L10 finds the spikes noisy.
- **Still open:** Spencer UI pass (archives + new KPIs → then fill kpiIds in the map and enable missed_calls);
  Monday cron registration; OptimoRoute density metric (needs its KPI created first).
- Engineering notes: Jobber GraphQL sweeps must pass the cursor as a variable and cap nested `lineItems(first:15)` —
  an uncapped nested connection at first:100 exceeds Jobber's query-cost bucket and throttles forever.
