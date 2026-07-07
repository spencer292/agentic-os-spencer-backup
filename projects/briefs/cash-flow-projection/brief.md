---
project: cash-flow-projection
status: active
level: 2
created: 2026-07-06
---

# Cash-Flow Projection (Jobber)

## Goal
A repeatable monthly cash-flow projection for Got Moles, driven by live Jobber
invoice data. Bill at the start of the month → invoices sent → customers pay in
due course. Model *when* that billed money actually turns into cash.

## Deliverables
- `scripts/pull-invoices.mjs` — read-only paginated pull of Jobber invoices
  (12-month history cohort + all currently-open A/R). Handles cost-throttle
  backoff. Writes `data/invoices-raw.json`.
- `scripts/build-projection.mjs` — pure-compute model. Builds the dollar-weighted
  collection curve (issue→received lag) and projects cash from open A/R over the
  next 4 months. Writes the dated markdown report + `data/projection.json`.
- `cash-flow-projection_{date}.md` — the report (pushed to Notion for review).

## Method
1. **Collection curve** — for invoices billed in month M, what % of eventual cash
   lands in M, M+1, M+2… (dollar-weighted, from issue date to received date).
2. **Projection** — apply that curve to current open receivables, aged by how
   long each invoice has already been outstanding, scaled by (1 − bad-debt rate).

## How to re-run each month
```
node projects/briefs/cash-flow-projection/scripts/pull-invoices.mjs 12
node projects/briefs/cash-flow-projection/scripts/build-projection.mjs
```
First command hits Jobber (a few minutes); second is instant and re-runnable.

## Constraints
- Read-only against Jobber. No mutations.
- US English throughout (Got Moles is a US company).
- Projects only cash from *already-billed* open invoices; layer expected new
  billings (~avg monthly billed) on top for a full forward view.

## Open questions / caveats
- Some invoices record a payment *before* the issued date (deposits / prepaid /
  scheduled billing) — confirm how deposits are handled so the model is exact.
- Assumes historical payment behaviour holds going forward.
