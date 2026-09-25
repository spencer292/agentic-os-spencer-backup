# TMCP Audit — Tag + Billing — 2026-09-25

Run: `node projects/tool-jobber/scripts/tmcp-billing-audit.mjs 2026-09-25`
Source: live Jobber sweep, 894 live jobs across all 8 non-archived statuses. **Read-only — nothing was changed.**
Data: `data/2026-09-25_tmcp-billing-audit.json` · `data/2026-09-25_tmcp-jobs.jsonl` (761 rows)
Compares against the 09-15 run (10 days).

## Headline

| | 09-15 | 09-25 | |
|---|---|---|---|
| Live TMCP jobs | 747 | **761** | +14 |
| Distinct clients | 724 | 738 | +14 |
| MRR (script) | $81,577.18 | **$83,967.18** | +$2,390 |
| MRR (corrected, +$618.75 yearly-schedule fix) | $82,195.93 | **$84,585.93** | |
| Jobs missing the tag | 3 | **4** | 3 real + Trent Bryan |
| MRR behind the tag gap | $425 | **$1,480** | $1,280 excl. Trent |
| Jobs with a billing defect | 35 | **36** | 0 fixed, 1 new |
| Serviced with no recurring charge | 10 | 10 | — |
| Tagged Active with no live job | 0 | **2** | Rob Chadek, Hector Soto-Garcia |
| Autopay (by job) | 29.3% | **29.0%** (221/761) | −0.3pt |

## 1. Tag gap — 3 real misses, all new bookings

Both 09-15 misses (#8578 Eric Hill, #8579 Gurwinder Sandhu) are now tagged. The three new ones are all fresh jobs on clients with an empty tag list:

| Job | Client | Age | $/mo |
|---|---|---|---|
| #8628 | Connie Schlimgen (Maple Valley 98038) | 0d | 100 |
| #8629 | Dustin Quaschnik (Maple Valley 98038) | 0d | 100 |
| #8613 | Steve Burns (Medina 98039) | 4d | 1,080 — see §3 |
| #8219 | Trent Bryan | 57d | 200 — WA semi-annual exception, not a defect |

Tagged-at-creation this period: 11 of 14 new jobs (79%), in line with the 83% last run. Two of the three misses were booked today, so they may still be same-sitting lag.

**New:** two clients carry `TMCP - Active` but have no live job — Rob Chadek and Hector Soto-Garcia. Either the job was closed/archived and the tag should flip to Churned, or a job is missing.

## 2. Billing defects — 36 jobs, 1 new

Same 35 as 09-15, none fixed, plus:

- **#8358 Paul Watson** (Buckley, $100/mo, created 08-11, monthly on last day of month) — `NEVER_INVOICED`. Should have billed 08-31; 45 days in, $0 invoiced.

Breakdown (a job can carry more than one):

| Defect | Jobs | Note |
|---|---|---|
| BILLS_YEARLY | 16 | 8 are true prepays; 8 carry a monthly price on a yearly schedule ($675/mo under-counted) |
| ZERO_PRICE | 7 | $0 line item, serviced |
| NEVER_INVOICED | 7 | incl. new #8358 |
| BELOW_FLOOR_NO_DISCOUNT | 7 | $50/mo with no discount line item |
| NO_INVOICE_SCHEDULE | 5 | cadence NEVER |
| BILLS_QUARTERLY | 4 | Madera West is intentional ($3,825/qtr) |
| BILLS_ON_CLOSE | 3 | Kaplan, Shah, Hewitt |

## 3. Not flagged by the script but looks wrong — #8613 Steve Burns

$1,080 on a **monthly** schedule, TMC price $1,200 (=12 × $100) with a 10% reduction. That is the shape of an annual prepay, but the schedule will invoice **$1,080 on 09-30 and every month after**. If it is a prepay, the schedule should be yearly. Untagged too. Worth a look before month-end.

## Fix list

1. Tag #8628, #8629, #8613 `TMCP - Active`.
2. Check #8613 Steve Burns schedule (monthly vs yearly) before 09-30.
3. Invoice #8358 Paul Watson — missed 08-31.
4. Resolve Rob Chadek + Hector Soto-Garcia: churn the tag or restore the job.
5. Standing 35 from 09-15 still open.
