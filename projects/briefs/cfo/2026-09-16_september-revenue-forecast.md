# September 2026 — Month-End Revenue Forecast

**As of:** 2026-09-16 (day 16 of 30) · **Source:** live Jobber pull, 2026-09-16
**Rebuild with:** `node projects/briefs/cfo/scripts/forecast-month.mjs 2026-09`

> **Revision 2 (same day).** The first version of this forecast put TMCP MRR at $69,109 and
> "corrected" `MEMORY.md` downward. That was wrong. It classified recurring revenue by invoice
> size (≤$200), which threw out 19 commercial accounts that bill monthly — City of Renton,
> Plemmons Industries, GC Bellefield, City of Burien, Marymoor Park, four Prologis sites and
> others — worth **$11,000/month**. It also pulled the job book without `includeUnscheduled: true`,
> missing 16 more live contracts. True MRR is **$83,477**. The month total is unchanged: the
> forecast was built on an invoice-to-invoice model that never depended on the classification.

---

## The answer

| Lens | Low | **Base** | High |
|---|---|---|---|
| **Billings** (invoices issued in September) | $117,600 | **$136,400** | $144,500 |
| **Cash collected** in September | — | **$125,000** | — |

Base case is **~$136K billed, ~$125K collected**.
**+24% over August** ($109,966) and **+69% over September last year** ($80,468).
TTM billings through September: **$971,000**.

**Contracted MRR is $83,477 — an ARR of $1,001,726. The recurring book has crossed $1M.**

---

## Contracted MRR — the real number

Every recurring cadence, converted to a monthly equivalent. A job's `total` is **one billing
cycle**, so a quarterly contract's total is three months of revenue and must be divided down.

| Cadence | Jobs | Per cycle | Monthly equivalent |
|---|---:|---:|---:|
| TMCP — monthly | 719 | $79,048 | **$79,048** |
| TMCP — yearly | 16 | $7,925/yr | $660 |
| TMCP — quarterly / every 90 days | 4 | $5,606/qtr | $1,869 |
| Quick Fix on monthly billing | 3 | $1,825 | $1,825 |
| Other monthly | 1 | $75 | $75 |
| **Total** | **743** | | **$83,477/mo** |

Not counted as MRR: 6 barter jobs, 5 TMCP marked "don't remind me to invoice", 3 TMCP billed on
completion, 131 Quick Fix jobs billed on completion ($54,655 of one-off work in flight).

**The 19 commercial monthly accounts are $11,000/month on their own** — 13% of MRR concentrated in
19 relationships. Largest: City of Renton $1,550, Plemmons $1,500, GC Bellefield $1,500, City of
Burien $950, Marymoor Park $833, Western Plaza $700, Prologis (4 sites) $1,370 combined.

---

## How September actually bills

Got Moles does not bill evenly. It bills in **two streams**, and one of them is a single day.

| Stream | What it is | When | August 2026 |
|---|---|---|---|
| **Daily** | New Quick Fix sales + setup fees, invoiced at booking | Weekdays | $31,945 (29%) |
| **Month-end batch** | The recurring book, billed in one run | Last calendar day | $78,021 (71%) |

**Two-thirds of September's revenue has not been invoiced yet and will not be until September 30.**
Anything read off "we're at $26,620 on day 16" is wrong by a factor of five.

The batch is almost entirely recurring contract revenue — not a mix of recurring plus job finals:

| Batch day | Total | Recurring contracts | One-off / ended jobs |
|---|---:|---:|---:|
| Jun 30 | $61,440 | $59,121 (96%) | $2,318 |
| Jul 31 | $66,881 | $65,421 (98%) | $1,460 |
| Aug 31 | $78,021 | $73,036 (94%) | $4,985 |

---

## The build

| Component | Amount | Confidence | Basis |
|---|---|---|---|
| Booked Sept 1–16 | **$26,620** | `KNOWN` | 69 invoices, live pull |
| Daily stream, Sept 17–29 | **$21,100** | `ESTIMATE` | $2,420/working weekday × 9 weekdays × 0.97 |
| **Sept 30 batch** | **$88,600** | `ESTIMATE` | two independent methods, below |
| **Total** | **$136,400** | | |

### The Sept 30 batch, two ways

**Top-down — measured retention plus new billers**, validated on four real month-end pairs:

| Transition | Prior batch | $ retention | New billers | New $ | Avg new |
|---|---:|---:|---:|---:|---:|
| Aug 31 → Sep 30 **2025** | $34,494 | **89.8%** | 32 | $7,320 | $229 |
| May 31 → Jun 30 2026 | $56,395 | 98.8% | 37 | $5,708 | $154 |
| Jun 30 → Jul 31 2026 | $61,440 | 96.8% | 66 | $7,305 | $111 |
| Jul 31 → Aug 31 2026 | $66,781 | 98.6% | 93 | $12,170 | $131 |

$78,021 × 97.5% + 95 new billers × $132 = **$88,605**.

**Bottom-up — from the contracted book:**

| | |
|---|---:|
| Monthly billers on the book today (723 jobs) | $80,948 |
| Adds Sept 17–30 (~35 jobs at the current add rate) | +$3,700 |
| Churn to Sept 30 (~1.5%) | −$1,200 |
| Yearly/quarterly contracts renewing in September | ~$0 |
| One-off job finals landing on the 30th | +$5,000 |
| **Bottom-up total** | **$88,450** |

**Two methods that share no inputs agree to 0.2%.** That is the strongest thing in this document.

*(Note: only one yearly contract has a September anniversary and it is a $0 job, so there is no
annual-renewal bump this month. Madera West is prepaid through ~Jan 2027 and will not invoice.)*

---

## What could move it — ranked

**1. September churn (the LOW case, −$10K).**
The one September in the sample — 2025 — retained only **89.8%** of the prior batch's dollars,
against 96.8–98.8% in every other month measured. Quick Fix series finish in the fall and some
don't convert. If it repeats, the batch comes in at ~$79K instead of $88.6K. Largest downside.

**2. The Quick Fix surge holding (±$10K).**
The daily stream is running at **$2,420/weekday against August's $1,597** — up 52%. Mole-season
peak plus the ads work landing. In 2024 and 2025 the one-off stream *fell* 19–21% from August to
September; this year it has done the opposite. If the back half reverts hard, the daily stream
contributes ~$12K instead of ~$21K.

**3. Commercial concentration (±$3K, and a standing risk).**
$11,000/month sits in 19 accounts. Losing City of Renton and Plemmons together is $3,050/month —
$36,600 a year — and it would not look like churn in the job count at all. Worth a named-account
retention check that the count-based retention metric will never surface.

**Hard floor: ~$116K** — daily stream cut in half *and* the Sept 30 batch growing zero over
August. September beating August is not in question, only by how much.

---

## Cash, not billings

| | Amount |
|---|---:|
| Collected Sept 1–16 | **$44,424** `KNOWN` |
| Sept 17–29 (August's same window, +5%) | $32,800 |
| **Sept 30 same-day autopay** | **$47,800** |
| **September cash** | **~$125,000** |

The batch charges cards the day it issues: **54% of the August 31 batch ($42,063) collected on
August 31 itself.** The month-end spike is a cash event, not just an AR event.

Collection is fast and clean — June's batch is 98.1% collected, July's 96.9%, August's already
79.6% at 16 days. Bad debt across 26 months and 10,435 invoices: 10 invoices. No collections problem.

---

## The number in `MEMORY.md`

`context/MEMORY.md` carries "TMCP MRR $74.2K (2026-08-11)." **That was right for the date it was
written.** TMCP-only MRR today is **$81,577** ($83,477 including the Quick Fix and other monthly
contracts) — the book added roughly $7K of MRR in five weeks. Update the figure, don't distrust it.

The other stale number is real: `projects/briefs/got-moles-scale/2026-07-21_baseline-model.md`
reports $857,312 TTM as of July. TTM through September is **$971,000**.

---

## The shape underneath

Realized recurring billing, from the batch series: **$59.1K → $65.4K → $73.0K → ~$83.5K forecast.**
That is compounding at roughly 10–12% a month, and it has not lost more than 3.2% of its dollars
in any month measured this year.

More than 60% of September is recurring revenue under contract. In 2024 and 2025 September fell
13–17% from August because the one-off stream collapsed after the summer peak — that cannot happen
now, because the majority of the month is a book that renews rather than a book that has to be
re-sold. It is also the single biggest lever on enterprise value: recurring revenue moves the
multiple, not just the profit.

---

## Data pulled for this

| File | What |
|---|---|
| `data/invoice-history.json` | 10,435 invoices, issued Jul 2024 – Sep 2026 |
| `data/active-book.json` | 913 active jobs with line items **and invoice schedules** |
| `data/batch-2026-08-31.json` + 4 others | Month-end batches with job links |
| `data/payments.json` | 15,173 payment records, 15 months |
| `data/forecast-2026-09.json` | This forecast, machine-readable |

Scripts: `pull-invoice-history.mjs`, `pull-active-book.mjs`, `pull-batch-day.mjs`,
`pull-payments.mjs`, `forecast-month.mjs` — all read-only, all re-runnable.

**Two traps to avoid re-running this:** always pass `includeUnscheduled: true` on the jobs query,
and never classify recurring revenue by invoice size — read `invoiceSchedule.scheduleSummary`.
