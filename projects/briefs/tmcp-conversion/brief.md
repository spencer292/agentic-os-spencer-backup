---
project: tmcp-conversion
status: active
level: 2
created: 2026-08-04
---

# TMCP Conversion — Repeat Quick Fix Customers

**Goal:** convert repeat Quick Fix buyers onto Total Mole Control by replacing the reactive
model (customer finds damage → calls → 5 weeks → traps pulled) with the proactive one
(traps never leave the runs → ~9 of 10 moles caught before the customer knows).

Source data pulled from Jobber 2026-08-06: 6,968 jobs, 3,848 quotes, 2,907 clients.

**Classification method:** product is read from each job's **line items**, per the 2026-08-05 rule
— never from `jobType` or contract duration. Legacy names matter:

| Line item | Product | Era |
|---|---|---|
| `Total Mole Control Program -- Year round protection`, `Total Mole Control Package` | TMCP | 2022– |
| `Annual Mole Control Service (...)` | **TMCP (legacy, $85/mo, billed as 0-day one-offs)** | 2021–2025 |
| `The Quick Fix — One-Month Mole Control Program` | Quick Fix | 2026– |
| `1 Month of Mole Control Service (North/central/Valley/South)` | Quick Fix | 2020–2026 |
| `Monthly Mole Service (...)` | Quick Fix (one-month, old pricing) | 2019–2021 |

Job totals across the book: Quick Fix 4,609 · TMCP 1,478 · other/bid/comp 881.

---

## The book, segmented

| Segment | Clients |
|---|---|
| On an active program | 642 |
| **Repeat Quick Fix (2+), never on program** | **700** |
| Ex-program, none active (winback) | 84 |
| Single job or none | 1,831 |

### Target pool (last job within 24 months) — 357 customers

| Tier | Definition | n |
|---|---|---|
| **T1 — LIVE** | Quick Fix running right now | 41 |
| **T2 — HOT** | Last job ≤12 months | 157 |
| **T3 — WARM** | Last job 12–24 months | 159 |
| _Cold (>24mo)_ | _deprioritized_ | _343_ |

Of the 357: **300 have never been sent a program quote**, 113 have already spent $1,200+,
and **14 have a program quote open right now**.

Kathy Hill (Buckley) is excluded — family account, billed $0 by design.

Full list with names, cities, spend, quote history and live-job end dates:
`data/target-list.csv`

---

## The three facts the whole pitch rests on

1. **They come back, and most come back within the year.** Median gap from the end of one
   Quick Fix to the start of the next is **254 days**; **38% return inside 6 months and 74%
   inside 12**. While active, the median repeat customer buys **2.06 Quick Fixes a year** —
   at $375–450 each, roughly **$775–925/year already spent reactively**.
2. **113 of the 357 targets have already spent $1,200 or more** — more than the program costs.
3. **Every completed job leaves a finished tunnel system, the worms, and no traps.** That is
   the mechanism behind the return rate, and it is the argument.

---

## The argument (Spencer's framing, 2026-08-04)

Do not sell the program as a cheaper way to buy the same thing. It is a different product.

- Every reactive call starts the same way: **the customer walks outside and the damage is
  already done.** They have never once avoided it. They are buying a cleanup crew.
- **Their yard is the cause and it is permanent.** Watered, landscaped, healthy soil = worms.
  A mole eats ~70% of its body weight in worms daily, so in a dry summer a maintained yard is
  the only food source on the block. You cannot get rid of worms and would not want to.
- **The tunnel is a net, not a road.** Worms fall in, the mole patrols the runs and eats. When
  a run stops producing he digs new tunnel — that dirt is the mounds. So mounds mean a mole
  already established and now hungry, not a mole arriving.
- **Why they keep calling:** when a job ends we pull the traps but the runs and the food stay.
  Moles are territorial, so an empty territory with a finished tunnel system is the easiest
  real estate available. The next one moves in without digging.
- **What the program does:** traps never leave the runs. The next mole walks into something
  already set. **Nine times out of ten we catch them before the customer knows they have one.**
  They find out from our text, not their lawn.

**The one-line version:** *you stop finding out the hard way.*

---

## Closes, by situation

| Situation | Close |
|---|---|
| Live job (T1) | **"Don't pull the traps."** They stay in on the final visit — no restart, no setup, no gap. Saying yes is less work than saying no. |
| We just comped a visit | Fold it in: **"it's not a freebie, it's the first visit of month one."** Preserves pride, closes the sale. |
| Previously declined on price | Their own total: *"as-needed has cost you $X. The program is $1,020–1,200."* Hold the originally quoted price. |
| Stalls / "I'll think about it" | Do **not** re-argue. Convert to a walk-around at the next scheduled visit. |

---

## The thing we keep doing wrong

On both J.C Brummond (2026-05-08) and Mike Marinella (2026-03-31), the customer engaged with
the program quote — and we withdrew it:

> *"The quote is by no means a requirement and we just wanted you to know that it is an option.
> We will continue billing you on an as needed basis."*

**Program-value quotes across the book: 541 converted, 325 archived, 78 still awaiting a
response.** The objection was often never handled — we offered an exit before they had to
decide. Kill that language.
Also retire Cory's Feb-13 template (*"our one-time customers keep calling us back… right?"*) —
it tells the customer their choice was dumb and got no reply.

**14 program quotes are open right now** on target-pool customers (awaiting response /
changes requested). Those are the cheapest wins in the book — see CSV.

---

## Plan

**Phase 1 — this week (T1, 41 customers).**
Every live Quick Fix gets the "don't pull the traps" text before its final visit. Sequence the
sends by `live_job_ends`. 15 end between Aug 11 and Aug 25.

**Phase 2 — next 2 weeks (14 open quotes).**
One follow-up each, no exit language, with their own spend total in it.

**Phase 3 — weeks 3–6 (T2, 157 customers).**
Batch by how long since their last job. Lead with the reactive/proactive argument and their
personal number.

**Phase 4 — ongoing automation.**
- Trigger a conversion text on every Quick Fix final visit, automatically.
- Flag any client reaching their 2nd Quick Fix for a program pitch on the spot.
- Monthly sweep of T3 as their gap approaches the 254-day median.

**Phase 5 — winbacks (84 ex-program customers).** Separate message; find out why they left.
This group doubled once legacy `Annual Mole Control Service` jobs were classified correctly.

---

## Revenue model

Target pool 357 customers, program value ~$1,100/yr average:

| Conversion | Customers | New recurring revenue |
|---|---|---|
| 15% | 54 | **$58,905/yr** |
| 25% | 89 | **$98,175/yr** |
| 35% | 125 | **$137,445/yr** |

Excludes the 343 cold customers, the 1,831 single-job clients, and the 84 winbacks.

---

## Data hygiene flagged

6 live Quick Fix jobs have end dates already in the past (earliest 2026-06-17, Jill Robinson)
but are still marked `upcoming` — never closed and invoiced. Worth a separate sweep.
Kathy Hill's $0 job is **not** one of these — family account, $0 is correct.
