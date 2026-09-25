# Channel Economics

How this seat judges whether a channel deserves another dollar. Read before any number leaves
the building.

Every figure below carries a tag: `KNOWN` (traced to live data, with a date), `ESTIMATE` (a
benchmark or reasoned assumption), `UNKNOWN` (not available — say so, do not fill it in).

---

## The three numbers, computed

### 1. CPBJ — cost per booked job

```
CPBJ = channel spend in period ÷ jobs booked and attributed to that channel in period
```

Not cost per lead. Not cost per call. Not cost per form fill. **Booked jobs.** A lead that rang,
got a quote and never converted cost the same as one that did and returned nothing.

Attribution window matters in a seasonal, considered-purchase business: a homeowner who sees a
March ad may not call until the lawn tears up in October. Use a **90-day window** as the working
default (`ESTIMATE`) and say so when quoting a number; tighten it once real source data exists.

### 2. Payback — months to recover the acquisition cost

```
payback (months) = CPBJ ÷ monthly contribution margin from that customer
```

Contribution margin is `UNKNOWN` today — the cost side of the business is not live in this repo;
it is ingested from the bookkeeper into `cfo-private/` by `acc-cfo`. **Ask `acc-cfo` for it rather
than assuming a margin.** A payback quoted on an assumed margin is a guess wearing a suit.

Rules of thumb once margin is real:

- A TMCP subscriber at $100–150/mo recovers a $300 CAC in **2–3 months of revenue**, longer on margin.
- A one-off Quick Fix at $450–600 either pays back **immediately or never** — there is no second bite
  unless the customer converts to the program or comes back next season.

### 3. Mix effect — Quick Fix or TMCP?

The same dollar spent can buy two very different assets:

| Bought | What it is worth |
|---|---|
| **A Quick Fix customer** | One transaction, $450–600, plus an option on a future one |
| **A TMCP subscriber** | $1,200–1,800 a year, recurring, and it moves the **valuation multiple**, not just this year's profit |

Recurring revenue is valued at a materially higher multiple than one-off service revenue. That is
`acc-cfo`'s Value lens and it is routinely the largest number on the page. A channel with a worse
CPBJ that delivers program subscribers can beat a cheaper channel that delivers one-offs. **Always
report the mix, never just the volume.**

---

## The attribution problem — F-01

**`KNOWN`: 85% of Jobber client records carry `leadSource: unknown`.**

Consequence: CPBJ by channel is **not computable** for most of the book today. Any per-channel
number produced now is `ESTIMATE` and must be labeled as such.

This is the highest-leverage fix available to this seat, and it is not a marketing campaign — it is
an intake behavior. The fix has three parts:

1. **Make source a required field at intake** — office and Voice Assist both. "How did you hear
   about us?" asked and recorded on every booking, not most.
2. **Wire the channels that can self-report** — CallRail tracking numbers per channel already give
   source for calls; the gap is that the source does not land on the Jobber client record.
3. **Close the quiz loop** — ScoreApp quiz *completion* is the warmest lead signal Got Moles has
   and it happens off-site, untied to GA4 and untied to the Jobber record (logged as OI-02 in the
   marketing-os reality doc). Warmest signal, zero attribution.

Until at least (1) and (2) are done, report channel performance as directional and say why.

---

## What is known about the channels today

### Paid search — the historical record

`KNOWN`, from the previous agency's actuals (`website-rebuild-rebrand` PPC workbook):

| Metric | 2024 full year | Jan 1 – Nov 30 2025 |
|---|---|---|
| Google spend | $6,780.69 | $6,127.14 |
| Bing spend | $1,978.60 | $3,159.22 |
| **Total spend** | **$8,759.29** | **$9,286.36** |
| Leads | 874 | 903 |
| **CPL** | **$10.02** | **$10.28** |

**Do not celebrate this.** US pest-control CPL benchmarks run **$40–120** (`ESTIMATE`). A $10 CPL
is roughly four times better than the best of that band, which means one of two things is true:

- the "lead" definition is loose — form fills and clicks counted as leads, not qualified inquiries; or
- the campaigns ran on hyper-local long-tail with almost no competitive density.

Either way the number is **not a CPBJ** and cannot be compared to anything. The first paid audit's
job is to establish what a "lead" meant in that workbook.

Note also the total: under **$9,300 a year** of paid spend against ~$857K of revenue is roughly
**1% of revenue on paid acquisition**. Pest-control companies commonly run 5–10% (`ESTIMATE`).
Got Moles is not over-spending on ads; it may be dramatically under-spending — but that case has
to be made on CPBJ, not on the fact that the ratio looks low.

### The account that exists now

Google Ads account **1665761172**, driven by `ops-google-ads` (API v24). Posture-A policy and the
~120 medical-cluster negatives are mandatory — see `claims-gate.md` §4. The imported client scripts
in `scripts/` are pinned to v23 and should be refreshed when next touched.

### Meta

Run by DigiHammer. Quality assessed by Spencer as poor and visibly AI-generated. Spend, account
ownership, pixel ownership and results are all `UNKNOWN` until the vendor audit runs —
`vendor-transition.md`.

### Email / newsletter

Monthly newsletter run by DigiHammer in HighLevel. List size, list source, deliverability, open
and click rates, and whether any of it produces booked jobs: all `UNKNOWN`. See `email-playbook.md`.

### Organic, GBP and the website

Not owned by this seat (Roy's lane), but it is where most volume lands. `KNOWN`: 3 GBP listings,
5.0 rating, 289 reviews / 283 five-star (2026-08-21), growing ~7/week. The website carried 635 #1
keywords and ~1,400 top-3 rankings pre-rebuild. Buyer-intent queries were the weak spot — *"mole
exterminator near me"* pos 28 and *"mole control near me"* pos 38 as of 2026-05-31 — while the
biology content ranked beautifully and converted nothing.

### The book itself — the cheapest channel in the business

`KNOWN`, Jobber pull 2026-08-06 (`projects/briefs/tmcp-conversion/`):

| Segment | Clients |
|---|---|
| On an active program | 642 |
| **Repeat Quick Fix (2+), never on a program** | **700** |
| Ex-program, none active (winback) | 84 |
| Single job or none | 1,831 |
| **Total client records** | **2,907** |

Job totals across the book: Quick Fix 4,609 · TMCP 1,478 · other/bid/comp 881.

**700 customers have bought a one-month Quick Fix at least twice and have never been put on the
program.** They have already paid, already had a good experience, and demonstrated the problem
recurs — which is the entire argument for TMCP. Reaching them costs an email. There is no paid
channel on earth with a CPBJ that competes with that, and it converts one-off revenue into
recurring revenue, which is the mix effect at its strongest.

The 24-month-recency target pool inside that segment is **357 customers**. Start there.

---

## Unit economics — what is real and what is missing

| Figure | Value | Tag |
|---|---|---|
| Trailing-12 revenue | $857,312, from 8,716 Jobber invoices (2026-07-21) | `KNOWN` — but see the conflict below |
| Quote → close rate | 0.69 | `KNOWN` (2026-07-31) |
| Average quote | $925 | `KNOWN` (2026-07-31) |
| Gross expected value per lead | ~$640 (0.69 × $925) | `KNOWN` — **gross, before any cost. This is not LTV and not what a lead is worth** |
| Contribution margin | — | `UNKNOWN` — ask `acc-cfo` |
| TMCP retention / churn | — | `UNKNOWN` — the single biggest hole in LTV |
| True LTV | — | `UNKNOWN` — needs margin and retention |
| CAC by channel | — | `UNKNOWN` — blocked on F-01 |
| Industry CAC benchmark | $200–400 | `ESTIMATE` |
| LTV:CAC target | ≥ 3:1 | `ESTIMATE`, standard |

**Open conflict, inherited from `acc-cfo` — do not model on either number until it resolves.**
Trailing-12 revenue reads **$857,312** (2026-07-21, from Jobber invoices), while `context/MEMORY.md`
reports TMCP **MRR $74.2K** (2026-08-11), which annualizes to ~$890K *from the recurring program
alone* — more than the whole company's trailing-12. At least one is wrong and the gap is roughly
$400K. That conflict *is* a finding; surface it, do not average it.

---

## Seasonality — the thing that breaks even allocation

Got Moles troughs **Nov–May** and peaks in the fall. Three consequences for spend:

1. **A flat monthly budget is wrong by construction.** Demand is not flat, so CPBJ is not flat.
2. **Trough spend has a different job than peak spend.** In the trough, paid is expensive per
   booked job and the better money goes into the book — winback, program conversion, prepay offers —
   where cost per booked job is near zero and cash lands before the season.
3. **Capacity is the real ceiling in peak.** Marketing that fills a week the techs cannot serve
   does not create revenue, it creates a scheduling problem and a bad review. Check route capacity
   with `tool-optimoroute` / `technician-route-automation` before scaling peak spend.

---

## How to decide

For any channel or campaign, in this order:

1. **Can it be measured?** If no, fix that first or do not spend.
2. **What is the CPBJ**, or the honest range if attribution is broken?
3. **What is the payback**, against a real margin from `acc-cfo`?
4. **What is the mix** — does it buy one-offs or subscribers?
5. **Does capacity exist** to serve what it brings?
6. **What gets cut** if it does not hit the number, and by when?

A channel with no answer to (6) has no exit and will run forever on hope. Name the kill criterion
before the first dollar, in writing, in the campaign brief.
