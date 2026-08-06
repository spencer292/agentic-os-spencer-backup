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

Source data pulled from Jobber 2026-08-04: 6,961 jobs, 3,848 quotes, 2,907 clients.

---

## The book, segmented

| Segment | Clients |
|---|---|
| On an active program | 633 |
| **Repeat Quick Fix (2+), never on program** | **913** |
| Had a program, none active (churn/winback) | 40 |
| Single job or none | 1,665 |

**Historic spend of the 913 repeat customers: $792,932** — all of it reactive.

### Target pool (last job within 24 months) — 437 customers

| Tier | Definition | n | Never pitched | Avg jobs | Avg spent |
|---|---|---|---|---|---|
| **T1 — LIVE** | Quick Fix running right now | 55 | 43 | 4.1 | $1,259 |
| **T2 — HOT** | Last job ≤12 months | 193 | 151 | 3.2 | $1,012 |
| **T3 — WARM** | Last job 12–24 months | 189 | 169 | 3.1 | $937 |
| _Cold (>24mo)_ | _deprioritized_ | _476_ | _437_ | _3.0_ | _$737_ |

Full list with names, cities, spend, quote history and live-job end dates:
`data/target-list.csv`

---

## The three facts the whole pitch rests on

1. **Median gap between Quick Fix calls is 133 days.** The average repeat customer already
   buys ~2.7 Quick Fixes a year. At $375–450 each that is **$1,000–1,200/year already being
   spent reactively** — at or above the price of the program.
2. **174 of the 913 have already spent $1,200 or more.** They have paid more avoiding the
   program than the program costs.
3. **167 have shrinking gaps** — the interval between calls is getting *shorter*, because
   every completed job leaves a finished tunnel system and no traps in a yard full of worms.

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

**83 repeat customers have been sent a program quote and never converted.** The objection was
often never handled — we offered an exit before they had to decide. Kill that language.
Also retire Cory's Feb-13 template (*"our one-time customers keep calling us back… right?"*) —
it tells the customer their choice was dumb and got no reply.

**23 program quotes are open right now** on repeat customers (awaiting response / changes
requested). Those are the cheapest wins in the book — see CSV.

---

## Plan

**Phase 1 — this week (T1, 55 customers).**
Every live Quick Fix gets the "don't pull the traps" text before its final visit. Sequence the
sends by `live_job_ends`. ~14 jobs end in the next 10 days.

**Phase 2 — next 2 weeks (23 open quotes).**
One follow-up each, no exit language, with their own spend total in it.

**Phase 3 — weeks 3–6 (T2, 193 customers).**
Batch by how long since their last job. Lead with the reactive/proactive argument and their
personal number.

**Phase 4 — ongoing automation.**
- Trigger a conversion text on every Quick Fix final visit, automatically.
- Flag any client reaching their 2nd Quick Fix for a program pitch on the spot.
- Monthly sweep of T3 as their gap approaches the 133-day median.

**Phase 5 — winbacks (40 churned program customers).** Separate message; find out why they left.

---

## Revenue model

Target pool 437 customers, program value ~$1,100/yr average:

| Conversion | Customers | New recurring revenue |
|---|---|---|
| 15% | 65 | **$72,105/yr** |
| 25% | 109 | **$120,175/yr** |
| 35% | 152 | **$168,245/yr** |

Excludes the 476 cold customers and the 1,665 single-job clients.

---

## Data hygiene flagged

9 "live" Quick Fix jobs have end dates already in the past (earliest 2026-06-17, Jill Robinson)
but are still marked `upcoming` — they were never closed and invoiced. Worth a separate sweep.
