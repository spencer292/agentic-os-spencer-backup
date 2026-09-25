# Muhammad's actual close rate

> **Superseded 2026-08-14** by `2026-08-14_muhammad-week-1-close-rate.md`, the week-1 close-out.
> Week 1 finished at **64% banked (14/22), zero losses, $7,725 booked**. The 71–83% landing zone
> below was too optimistic: **none of the eight open opportunities converted in the following
> 24 hours**, which moves the honest expectation to **69–72%** unless the six never-opened quotes
> get chased. Everything else here still holds.

**Measured 2026-08-13** against live Jobber data — all 375 quotes and 388 jobs created since
2026-06-01, with salesperson attribution. Script: `scripts/close-rate.mjs` (read-only, re-runnable
with `--refetch`). Updates the 2026-08-12 analysis with two more days of data.

---

## The number

| Measure | Rate | |
|---|---:|---|
| **Jobber's salesperson report** — converted ÷ total quotes | **58%** | 14 / 24 |
| **Opportunity level** — one customer = one decision | **64%** | 14 / 22 |
| **Of everything actually decided** | **100%** | 14 / 14 |
| **Projected when his open quotes mature** | **71–83%** | see §4 |
| *Spencer's matured baseline (opportunity level)* | *83%* | *135 / 162* |

**His real close rate is 64% banked and heading for roughly 80%. The report says 58%.**

And the single most important fact in the data:

> **He has not lost a single quote.** Twenty-four quotes: **14 converted, 10 awaiting a response,
> zero archived, zero declined.** Every point of the gap between 58% and 100% is quotes that haven't
> answered yet — not quotes that said no.

---

## 1. Why the report reads low — two separate effects

### Effect A: two quotes to one customer (worth 6 points)

You were right that this is in there. Two of his leads got both a Quick Fix and a TMCP quote:

| Lead | Quotes | Status |
|---|---|---|
| Charles Hemphill | #13932 $450 + #13933 $1,200 | both open |
| Caitlin Mccormick | #13958 $450 + #13959 $1,200 | both open |

Four quotes, two decisions. Each customer can only convert once, so the pair lands in the denominator
twice and can only ever pay out once. Removing the duplication: **58% → 64%.**

Worth knowing: **this hurts you more than it hurts him.** You have 31 multi-quote leads in the same
period — 63 quotes for 31 decisions — which is why your own rate reads 75% at quote level and **83%
at opportunity level**. Your real close rate is understated by the report too, by 8 points.

### Effect B: measuring a race that isn't finished (worth ~16 points)

This is the bigger one. **Eight of his 22 opportunities are less than a week old**, and four are
younger than 36 hours. Built from your own 182 matured quotes, here is how fast a win actually lands:

| Days since the quote went out | % of eventual wins already realised |
|---|---:|
| 12 hours | 59% |
| 1 day | 64% |
| 2 days | 74% |
| 3 days | 82% |
| 5 days | 96% |
| 14 days | 100% |

Median time to a win is **0.4 days**. So a quote sent yesterday that hasn't converted is only weak
evidence, and a quote sent this morning is almost no evidence at all — but the report counts both as
losses today.

### Two corrections from the 08-12 analysis have already resolved themselves

- The two training-test quotes are **no longer in his denominator** — no quote in the current data has
  a client matching "Muhammad/Javed", and his book now starts cleanly at #13929 on 08-07.
- **#13961 Travis Bruce has moved `approved` → `converted`**, so it now scores as the win it always was.

---

## 2. His full book, all 24 quotes

| Date | Quote | Status | Value | Customer |
|---|---|---|---:|---|
| 08-07 | #13929 | converted | $450 | Laura Goodrich |
| 08-07 | #13930 | converted | $450 | Cheryl Balkenhol |
| 08-07 | #13931 | converted | $450 | Michael Adamov |
| 08-07 | #13932 + #13933 | **open** | $450 / $1,200 | Charles Hemphill |
| 08-07 | #13935 | converted | $375 | Dale Hoff |
| 08-10 | #13937 | converted | $1,200 | Donald Kaplan |
| 08-10 | #13938 | converted | $450 | Joe Kim |
| 08-10 | #13939 | converted | $1,200 | Ken Lohse |
| 08-10 | #13943 | converted | $450 | Carey Jenkins |
| 08-10 | #13944 | **open** | $375 | Amy Crenshaw-Burns |
| 08-11 | #13956 | converted | $450 | Brian Honig |
| 08-11 | #13958 + #13959 | **open** | $450 / $1,200 | Caitlin Mccormick |
| 08-11 | #13960 | converted | $450 | Anne-Marie Jones |
| 08-11 | #13961 | converted | $450 | Travis Bruce |
| 08-11 | #13962 | **open** | $1,200 | Joyce Hinkley |
| 08-12 | #13967 | converted | $450 | Johnny Evans |
| 08-12 | #13968 | converted | $450 | Daniel Hill |
| 08-12 | #13969 | converted | $450 | Betsy Monahan |
| 08-12 | #13970 | **open** | $450 | Mike Laidley |
| 08-12 | #13971 | **open** | $450 | Chris Breiland |
| 08-13 | #13973 | **open** | $450 | Melisa Yattaw |
| 08-13 | #13975 | **open** | $450 | Debbie Thompson |

Five working days. Fourteen sales. No losses.

---

## 3. The one thing that decides whether he lands at 71% or 83%

**Every single one of his 14 wins was a quote the customer opened. All 14.**
**Six of his eight open opportunities have never been opened at all.**

That matters because of what your own book says happens to a quote nobody reads:

| Your matured quotes | Win rate |
|---|---:|
| Customer opened it | **80%** (132/164) |
| Customer never opened it | **17%** (3/18) |

An unopened quote is worth about a fifth of an opened one. Right now **$4,125 of his $5,775 open
pipeline is sitting in quotes the customer has never looked at.**

| Open opportunity | Age | Opened? | Value | Lands if chased | Lands if left alone |
|---|---:|---|---:|---:|---:|
| Charles Hemphill | 6.0d | **no** | $1,200 | 15% | 1% |
| Amy Crenshaw-Burns | 3.0d | **no** | $375 | 40% | 3% |
| Caitlin Mccormick | 2.1d | **no** | $1,200 | 52% | 5% |
| Joyce Hinkley | 2.0d | yes | $1,200 | 52% | 52% |
| Mike Laidley | 1.2d | **no** | $450 | 59% | 7% |
| Chris Breiland | 1.1d | yes | $450 | 60% | 60% |
| Melisa Yattaw | 0.3d | **no** | $450 | 71% | 11% |
| Debbie Thompson | 0.1d | **no** | $450 | 77% | 14% |

**Left alone, he ends the week at ~71%. Chased until opened, ~83% — level with you.**

The mechanism is unchanged from 08-12 and the extra data confirms it. Average follow-up touches:

| | Touches |
|---|---:|
| Muhammad — quotes he won | 2.07 |
| **Muhammad — quotes still open** | **1.90** |
| Spencer — matured quotes he won | 3.31 |
| **Spencer — matured quotes he lost** | **3.49** |

You chase harder on the ones going badly. He sends it once and waits.

---

## 4. What to tell him, and what to change in reporting

**Tell him his close rate is 64% and climbing, not 58%, and that he has lost nothing.** For someone
five days on the phones that is a genuinely strong number, and the 08-12 "38%" panic was a
measurement artifact from end to end.

**Three changes:**

1. **Chase the six unopened quotes today** — Hemphill first, he's six days out and $1,200. That
   single list is the difference between 71% and 83%.
2. **Stop sending two quotes.** Recommend one plan, mention the other in the message body. It halves
   the measured rate on those customers and hands the buyer a decision they didn't ask for. Applies
   to your own quoting too — 31 leads' worth.
3. **Change what the report measures.** Read close rate at **opportunity level, on a 4-week rolling
   window, at day 14** — never on this week's quotes. Quote-level weekly numbers cannot carry the
   weight being put on them.

---

## Method / caveats

- Won = `converted` or `approved`. Opportunity = one client's quotes within a 14-day window.
- Realization curve and the opened/unopened base rates come from Spencer's 182 quotes with 21+ days
  to land, using `transitionedAt − createdAt`.
- **n = 22 opportunities.** The projection is an expectation, not a forecast; a single customer moves
  it ~4 points. The direction is solid, the decimal places are not.
- The projection applies Spencer's base rates to Muhammad's book. If his true rate differs, the
  projection moves with it — treat 71–83% as the honest range, not 80% as a point estimate.
- **Quote-based measurement cannot see leads that never became a quote.** Those are the real losses
  (08-10 call 6, the 08-11 Kirkland buyer, 98444 Parkland refused in-area) and they sit outside every
  number on this page. His lead-to-sale rate is lower than his quote-to-sale rate; the failure there
  is capture, not closing.
- One close was booked with no quote at all (Beverly Ott, existing customer, booked direct). It has no
  salesperson attribution and so appears nowhere in these totals — 110 quote-less jobs in the period
  have no salesperson set, making that lane unmeasurable as things stand.
