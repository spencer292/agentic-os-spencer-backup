---
project: cfo
status: active
level: 2
created: 2026-08-26
---

# CFO Function — Got Moles

## Goal

Replace gut-feel financial decisions with modeled ones. Spencer's words: *"I kind of just make the
financial decisions based on feeling, and I don't think that that's working."*

The Finance seat on the Ninety accountability chart is **vacant** as of 2026-07-22 — its card reads
"QuickBooks; revenue, job costing, P&L; AR/AP; payroll, tax filing; monthly reports; budgeting,
forecasting, pricing models." Spencer has been sitting in it by default. This project fills it.

## The diagnosis

**Got Moles is exceptionally well instrumented on revenue and completely blind on cost.**

Already live and better than most $1M companies: a dollar-weighted collection curve, AR aging with
a chase list, $857K trailing-twelve at +37% YoY, a 69% close rate, revenue per visit, per-tech
capacity and measured pace.

Nowhere in the business: payroll, fuel, vehicles, insurance, traps, software, ads spend, rent,
owner comp, taxes. **No P&L. No gross margin. No EBITDA.**

That gap is the whole reason decisions feel like feelings. It is not that Spencer lacks judgment —
it is that half the inputs do not exist.

## The decision policy

Spencer asked the CFO to optimize for all four north stars at once (enterprise value, cash out,
growth, self-funding). They partly conflict, so they resolve into one policy:

- **Primary objective:** maximize enterprise value
- **Hard constraint:** the owner draw floor comes out first, non-negotiable
- **Funding rule:** self-financed from operating cash flow; debt only for vehicles and equipment
- **Growth rate:** an output of the three above, never an input

**Consequence:** every recommendation reports three columns — **cash this year, profit, enterprise
value.** The tradeoff is shown, not buried.

## Scope

**In:** Got Moles operations — P&L, unit economics, pricing, hiring, marketing spend, cash.

**Inputs but not scope:** Rainier Power Wash LLC entity figures (tax election, owner comp, draws)
come from the CPA and feed the models. This project does not manage the entity or the other ventures.

**Out:** SYPerformance, the zero-touch kits, side projects, personal finances.

## Deliverables

| Item | Status |
|---|---|
| `.claude/skills/acc-cfo/SKILL.md` — the CFO skill | Built 2026-08-26 |
| `.claude/skills/acc-cfo/references/valuation.md` — the Value lens | Built 2026-08-26 |
| `data/assumptions.json` — every financial assumption, confidence-tagged | Built 2026-08-26 |
| `scripts/model-hire.mjs` — hiring decision model, growth and relief modes | Built + tested 2026-08-26 |
| `2026-08-26_bookkeeper-request.md` — the unblocking request list | Built 2026-08-26 |
| `cfo-private/` gitignored for raw statements | Configured 2026-08-26 |
| `scripts/model-pricing.mjs` | **Blocked on cost data** |
| `scripts/model-cac.mjs` | **Blocked on cost data AND ad spend AND lead attribution** |
| `scripts/model-cash.mjs` | **Blocked on cash on hand + fixed monthly cost** |
| Monthly close process | Blocked on first statement |

## Acceptance criteria

- Every number carries a confidence tag: `KNOWN` / `ESTIMATE` / `UNKNOWN`
- No recommendation is issued on an `UNKNOWN` foundation — the gap is named instead
- Every decision output shows all three lenses and states its flip point
- Conflicting numbers are surfaced as findings, never averaged or quietly picked between

## Constraints

- **Raw statements never enter git.** `cfo-private/` only. Aggregate figures may be tracked;
  a per-person payroll line may not. Same pattern as `hr-private/`.
- Read-only against Jobber. No financial cron may move money or file anything.
- US English throughout.

## Findings from the first session (2026-08-26)

Four things surfaced while building this, all from data already in the repo.

### 1. Two live numbers contradict each other by ~$400K

The baseline model reports **$857,312** trailing-twelve revenue (from 8,716 Jobber invoices).
`context/MEMORY.md` reports TMCP **MRR $74.2K**, which annualizes to **~$890K** — more than the
entire company collected. The recurring program cannot bill more than the whole business.

Both are in active use for planning a $5M target. Unresolved. Tracked as `open_conflicts` C1.

### 2. The seasonality story in the growth plan is wrong

`got-moles-scale/brief.md` says the business troughs **Nov–May**. Twelve months of actual billing
says otherwise:

| | Index |
|---|---|
| Sep (peak) | 1.358 |
| Oct | 1.201 |
| Nov | **1.145** |
| Dec–Feb (real trough) | **0.812** |
| Apr | 1.064 |
| Jun | 1.130 |

November is one of the strongest months, and April–June are essentially normal. **The dangerous
cash months are December, January and February — three months, not seven.** Hire timing and cash
reserve planning built on the "Nov–May trough" premise are built on a wrong premise.

Resolved in favor of the data. Tracked as `open_conflicts` C2.

### 3. Customer acquisition is violently seasonal — and the window is open now

New customers by month, trailing twelve:

| Aug | Sep | Oct | Nov | Dec | Jan | Feb | Mar | Apr | May | Jun |
|---|---|---|---|---|---|---|---|---|---|---|
| 65 | 54 | 70 | 56 | 30 | **6** | 14 | 11 | 11 | 17 | 17 |

**64.6% of all new customers arrive in Aug–Nov. January produced six.**

Marketing dollars are not fungible across months — a dollar in September is worth several times a
dollar in January. It is late August right now, which means the highest-leverage acquisition window
of the year is open and closing in roughly ten weeks.

Separately: **82% of revenue comes from existing customers**, and winter revenue is almost entirely
the recurring base. That is the financial argument for TMCP, stated in cash rather than in theory.

### 4. A possible unpaid-overtime liability

WA's 2026 exempt salary threshold is **$80,168.40/yr**. Anyone salaried below it is non-exempt and
owed overtime regardless of title. **Cory is salaried and runs a full route** (~103 visits/week).
If his salary is under the threshold, this is a live liability, not a rounding error. Needs checking
against the actual figure — flagged in the bookkeeper request as question 3.

## Open threads

- **Blocking:** bookkeeper statements into `cfo-private/`. Nothing past the hire model can be built
  without them, and the hire model's cost lines are all placeholders until they land.
- **Blocking:** Spencer's owner draw floor — the hard constraint. Only he can answer it.
- Resolve conflict C1 (TMCP MRR vs total revenue) against live Jobber billing.
- Lead-source attribution at intake: 85% of client records are `leadSource: unknown`, which blocks
  CAC by channel permanently until fixed. This is an ops fix, not a finance one, but finance is
  where the cost of not fixing it shows up.
- Google Ads API creds absent on this install — ad spend is invisible.
- Churn tagging hygiene: 20 churn tags against 597 active TMCP members. Blocks LTV and caps the
  valuation multiple regardless of what real retention is.
- Once two monthly closes have run by hand, evaluate a direct QuickBooks Online API connection.
