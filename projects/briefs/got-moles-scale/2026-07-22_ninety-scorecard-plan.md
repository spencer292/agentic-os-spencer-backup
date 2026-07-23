# Ninety.io Scorecard — Overhaul & Automation Plan

Created 2026-07-22. Grounded in the Phase 0 baseline model (`2026-07-21_baseline-model.md`).
Status: **waiting on Ninety Personal Access Token** to pull the current scorecard and start pushing scores.

---

## 1. How the connection works (confirmed against Ninety's API docs)

- **API:** `https://api.public.ninety.io/v1` — Bearer auth with a Personal Access Token (PAT).
- **Plan gate:** API access is **Thrive plan only** (Accelerate/Essentials/Free have no API). Confirm plan first.
- **What it can do:** query the KPI/measurable list (`POST /v1/scorecard/kpis/query`), **write a score for any
  KPI + week** (`POST /v1/scorecard/kpis/{kpiId}/scores` with `value` + `periodStartDate`), write notes, list teams.
- **Known limitation:** v1 is write-only for score *values* — we can push numbers in but can't read historical
  scores back out. Fine for our purpose (we compute values from Jobber/CallRail and push). It also means we can
  backfill history: compute past weeks from source data and POST them.
- Rate limit 25 req/s — irrelevant at our volume.

### Setup steps (Spencer)

1. Confirm the Ninety subscription is **Thrive**.
2. In Ninety: avatar → **User Settings → Developer Settings** → generate a **Personal Access Token**.
3. Add one line to `.env` at the repo root: `NINETY_API_TOKEN=<token>` (Claude can't read/write `.env` — paste it in yourself).
4. Tell Claude "Ninety token is in" → Claude queries the KPI list, audits the live scorecard against this plan,
   maps every KPI to its data source, backfills history, and sets up the weekly push cron.

---

## 2. Recommended scorecard (weekly, leadership team)

Built around the three binding constraints from the baseline: **lead flow, hiring machine, route density** —
plus the recurring-mix and hygiene metrics that make the $5M math visible every week.

EOS guidance is 5–15 numbers on the leadership scorecard. The 13 below are the leadership set; the rest can
live on a departmental (marketing/ops) scorecard in Ninety if the L10 gets crowded.

### Leadership scorecard (13)

| # | Measurable | Why (ties to baseline) | Source | Auto? |
|---|---|---|---|---|
| 1 | **New leads (first-time callers + web)** | #1 constraint; growth is lead-limited. Baseline ~230/mo → ~55/wk | CallRail + Jobber requests | ✅ auto |
| 2 | **Lead source captured %** | 85% of clients are `leadSource: unknown` — CAC is uncomputable until this is ~90%+ | Jobber (new clients w/ leadSource set) | ✅ auto |
| 3 | **Quotes sent** | Funnel throughput. Baseline ~22/wk | Jobber | ✅ auto |
| 4 | **Close rate % (rolling 4 wk)** | Elite at 69% — watch it doesn't slip as lead volume scales | Jobber quotes | ✅ auto |
| 5 | **Revenue invoiced ($/wk)** | The line. Baseline ~$16–18K/wk | Jobber invoices | ✅ auto |
| 6 | **Recurring % of revenue (rolling 4 wk)** | Mix target >60% — the LTV/seasonality lever | Jobber line items | ✅ auto |
| 7 | **TMCP active members** | The recurring asset. Baseline 597; $5M needs ~2,900 | Jobber tags | ✅ auto |
| 8 | **TMCP net adds (new − cancels)** | Churn is currently invisible (only 20 churn tags vs 597 active) — this forces the hygiene | Jobber tags | ✅ once tagging is maintained |
| 9 | **Completed visits/week** | Capacity ceiling. Baseline 362; $5M needs ~2,100 | Jobber visits | ✅ auto |
| 10 | **Stops per route-hour (density)** | At 15-min visits, profit = stops-per-mile, not hours | OptimoRoute | ✅ auto |
| 11 | **AR past due ($)** | $5.6K past due / $19.7K open today — keep it on the wall until it's boring | Jobber | ✅ auto |
| 12 | **New Google reviews (wk)** | Review velocity feeds LSA + GBP ranking; 219+ base | GBP (scrape/SerpAPI weekly) | ⚙️ semi-auto |
| 13 | **Hiring pipeline (candidates in process)** | Constraint #2 — ~1 hire/6–8 wks sustained. Cory's number | Cory, manual entry | ✋ manual |

### Add when unblocked

| Measurable | Blocked on |
|---|---|
| **Google Ads spend + cost per lead** | Ads API creds not set up on this install (baseline gap #1). Once live, CPL by week is auto. |
| **LSA leads + spend** | LSA launch is gated on Spencer sign-in/COI/consents (see `2026-07-21_lsa-launch-checklist.md`). Add the KPI the week LSA goes live. |
| **Spencer field visits/week (target → 0)** | Nothing — worth adding now if Spencer wants the "free the founders" metric public. Baseline 43. |

### Deliberately NOT on the scorecard

- Vanity totals (total clients ever, lifetime revenue) — no weekly action attached.
- Anything monthly-only by nature (EBITDA %) — belongs on a monthly/quarterly view, not the weekly L10.

---

## 3. Automation architecture

Weekly cron (Agentic OS `ops-cron`, runs Monday early AM before the L10):

1. Pull the week's data: Jobber (invoices, quotes, visits, tags, AR), CallRail (calls), OptimoRoute (routes).
2. Compute the 11 automatable measurables above.
3. `POST` each score to Ninety with `periodStartDate` = the scorecard week.
4. Write a one-line note per KPI where context helps (e.g. close-rate numerator/denominator).
5. Log the run to `projects/briefs/got-moles-scale/scorecard-runs/`; on any pull failure, skip that KPI
   (never push a guessed number) and flag it in the log + note.

**Honest caveat (bucket-2):** the cron only fires while crons are running on this machine
(`bash scripts/start-crons.sh`). If the machine is off Monday morning, the push waits; any missed week can be
backfilled on demand since Ninety accepts historical `periodStartDate` writes.

Manual/semi-auto KPIs (reviews until scraping is wired, hiring pipeline always) stay human-entered in Ninety —
the cron never touches KPIs it doesn't own.

---

## 4. Open items

- [ ] Spencer: confirm Thrive plan + generate PAT + add `NINETY_API_TOKEN` to `.env`
- [ ] Claude: query live KPI list → audit current scorecard vs. section 2 (rename/retire/add), map KPI IDs
- [ ] Claude: build pull-and-push script + weekly cron; backfill from May 2026 (CallRail history starts there)
- [ ] Spencer decision: which of the 13 stay leadership vs. move to a departmental scorecard
- [ ] Tagging hygiene: TMCP churn tag discipline (needed before KPI #8 is trustworthy)
- [ ] Later: Google Ads creds → add spend/CPL; LSA live → add LSA leads
