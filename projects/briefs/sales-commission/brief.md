---
project: sales-commission
status: active
level: 2
created: 2026-09-09
---

# Monthly commission run

## Goal

Pay commission from Jobber without hand-checking three reports. Cross-check the quote,
job and invoice records so the salesperson set on the quote actually carries through to
the invoice, then total commissionable revenue per person for the month.

## The problem this solves

Jobber's own Salesperson report reads the salesperson field **on the invoice**. That field
is blank on most invoices, because Jobber does not reliably propagate the seller from the
quote to the job to the invoice — and recurring TMCP bills raised years after the sale have
no seller of their own at all.

Measured on August 2026: 434 of 741 invoices had a broken chain, covering $57,274 of $108,956
invoiced. The mis-attribution runs in both directions — sales credited to nobody, and at least
one invoice crediting someone the quote says did not sell it.

## Commission rules

Source: `GotMoles_TechCompensation (4).docx` plus Spencer's verbal rules, both 2026-09-09.
All of it lives in `rates.json` — change the file, re-run, no code edits.

**Basis: invoiced in the month**, not cash collected.

### Technicians (Tavis, Robert, Luke, Alias)

- **5% on the life of every TMCP customer they convert**, paid on that customer's monthly
  billing for as long as they stay. **Quick Fix and everything else earn nothing** — the 5%
  is TMCP-only.
- **Monthly TMCP bonus** on *new* conversions, valued at **contracted annual value**
  (monthly plan × 12). Increments are whole $1,000s; the band the month's total lands in
  sets the rate and applies **retroactively** to every increment:

  | Monthly TMCP revenue | Rate |
  |---|---|
  | $0 – $3,599 | no bonus |
  | $3,600 – $7,199 | $50 per $1,000 |
  | $7,200 – $10,799 | $75 per $1,000 |
  | $10,800+ | $100 per $1,000, uncapped |

  All seven worked examples in the plan document reproduce exactly against this engine.
- Base hourly $25.00 / OT $37.50 are payroll and deliberately outside this tool.

### Outside the technician plan

- **Muhammad Javed** — flat 2% on everything invoiced with him as salesperson. No bonus
  tiers, no review bonus, no tips.
- **Cory Ventura** — has ownership; takes a percentage of **profit**, not sales commission.
  That comes off the P&L and belongs to `acc-cfo`, not here. He does take a tip share while
  he is still in the field.
- **Spencer** — owner, takes none. **Courtney** — a staging bucket, not a person.
- **Absence is not departure.** Paid medical leave, vacation, or a spell running routes
  without selling does not interrupt commission — the book keeps paying. A gap in someone's
  quote history is indistinguishable from a departure in Jobber, so ask; never infer it.
- **When someone leaves, their 5% stops.** No trailing residual, and it does not transfer to
  whoever takes the territory. Attribution stays tracked so the roll-off is visible.

### Tips

Split **evenly** amongst whoever is **in the field** — field work, not job title. Eligibility
is date-bounded (`tipsEligibleFrom` / `tipsEligibleUntil`) and resolved against the month
being calculated, never against today, so re-running an old month still pays who was
actually on a route then.

### Everything comes from Jobber

With the forfeiture gates and the review bonus retired, **nothing in the plan needs an input
Jobber does not already hold.** A month closes with no manual data entry. The `adjustments/`
folder is a retired leftover — see `adjustments/RETIRED.md`.

### Annual prepays

A TMCP job total is normally the monthly plan price, so annual contract value is ×12. A
customer who prepays a year is entered as the full annual figure instead, and ×12'ing that
would inflate the seller's bonus by an order of magnitude. Anything above $600/mo is treated
as already-annual and counted at face value, and the statement names each one. First
confirmed case: #8331 Belur Shivashankara, $1,050 prepaid for the year.

## What "in the month" means

The month is **Pacific calendar month**, boundaried at local midnight — for August 2026,
`2026-08-01T07:00:00Z` to `2026-09-01T07:00:00Z`. Invoices are selected on **issuedDate**,
and tips ride along on the invoice they are attached to.

This matters more than it sounds. Filtering in UTC instead shifts the window seven hours
early, which sweeps the *previous* month's overnight recurring-invoice batch in and pushes
the current month's batch out. Measured on August 2026 while the bug was live: 211 invoices
($20,650) issued 31 July evening PT were counted as August, and 218 invoices ($9,869+)
issued 31 August ~10 PM PT were dropped. The boundary helper handles PDT and PST, so a
January run is correct too.

### Known limitation: a late tip rewrites a closed month

A tip is recorded when the customer pays, but it attaches to the **invoice**, and the
invoice is selected by its issue date. So a customer who pays an August invoice in
September, and tips, adds to August's pool — after August has been paid out.

Re-running a closed month can therefore produce a different number than the run you paid
from. Treat the statement as a **snapshot**: keep the generated files as the record of what
was paid, and let any later delta fall into the next month rather than restating history.

## How attribution is resolved

In order, first hit wins:

1. **Quote** salesperson — the source of truth, since that is where the sale is made
2. **Job** salesperson
3. **Invoice** salesperson
4. **Client history** — the earliest seller on any quote or job for that customer, ever

Step 4 is what makes "5% for the life of the customer" actually payable: a recurring TMCP
invoice carries no seller, so the credit has to come from who originally brought the customer
in. It is an inference, and it is labelled as one in the output.

## Run it

```bash
# 1. pull the month (Jobber throttles on query cost; the script paces and retries)
node scripts/pull-commission-data.mjs 2026-08

# 2. recover sellers for invoices the chain leaves blank
node scripts/resolve-legacy-attribution.mjs 2026-08

# 3. audit the chain + fix list
node scripts/analyze-commission.mjs 2026-08

# 4. commission statement
node scripts/calc-commission.mjs 2026-08
```

With no month argument each script defaults to the previous complete month.
`--jobs-only` on step 1 tops up the jobs sweep without re-pulling every invoice.

## Outputs

| File | What it is |
|---|---|
| `{month}_commission-statement.md` | What to pay each person, and what Jobber's report would have got wrong |
| `{month}_commission-detail.csv` | Every invoice behind every number, with the basis for the credit |
| `{month}_commission-audit.md` | Attribution health and the per-problem breakdown |
| `{month}_fix-list.csv` | Every broken invoice with a direct Jobber link, worst first |
| `data/{month}_raw.json` | The raw pull, so nothing needs re-fetching |

## Not in scope

Cory's profit share. This tool reads Jobber, and Jobber knows revenue, not profit — no cost
side, no payroll, no overhead. Modelling an owner's percentage of profit needs the P&L, which
lives behind `acc-cfo` and the gitignored `cfo-private/` bookkeeper data. Keep the two separate:
this run pays sales commission, that one settles owner distributions.

## Open

- **Bonus tier table** — the numbers are not in the repo. New-sales-per-person is computed
  and shown so the tiers can be applied by hand until `rates.json` has them.
- **214 invoices ($25,052.75 in August)** have no seller anywhere in Jobber, including the
  customer's whole history. These are legacy customers sold before the field was used.
  Nobody can be paid on them without a human decision.

## Offboarding someone

Set their entry in `rates.json` to `role: "departed technician"`, `eligible: false`,
`tipsEligible: false`. Do not remove the person — deleting the entry makes their trailing
invoices look unattributed and pollutes the fix list with noise that cannot be fixed.
- **Fix forward:** 39 jobs sold in August carry no salesperson at all. Setting the seller on
  the quote at the time of sale is the only thing that stops this recurring.
