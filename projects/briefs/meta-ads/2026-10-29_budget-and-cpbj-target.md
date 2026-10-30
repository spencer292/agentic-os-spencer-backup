# Meta Budget and CPBJ Target: Proposal

**Date:** 2026-10-29 · **Seat:** mkt-cmo (plan mode), executed by `ops-meta-ads` · **Status:**
DRAFT for Spencer. Nothing changes in the ad account until he approves a specific budget.

## Answer

> **Checked against Google, 2026-10-29** (`2026-10-29_google-ads-cpbj-audit.md`): Google's real cost per booked job, May–Oct, is ~$180–221. The ~$63 figure is Google's cost per *conversion* (a lead). Meta is held to Google parity: **target ≤ $220**, ceiling $300.

- **Target cost per booked job (CPBJ): $200.** Ceiling **$300**. A booked Total Mole Control (TMCP)
  signup is worth about 5x a Quick Fix, so a campaign that books mostly TMCP may run to **$400**.
- **Target cost per lead: $50** (ceiling $75). This is what Meta's numbers are judged against
  day to day.
- **Budget:**
  - **Nov–Jan:** ~$200/mo, a measured version of today's call campaign.
  - **Feb 15–Mar 31:** a ~$1,900 angle test.
  - **Apr–Sep:** up to $3,000/mo, only if CPBJ comes in under $200 and the techs have room.
  - **Through March:** about $2,500 in total.
- **Kill line:** if Meta's CPBJ is still above $300 after $1,500 of measured spend, stop
  prospecting on Meta and move the money to Google/LSA.

## Where the target comes from

| Input | Value | Tag |
|---|---|---|
| New-customer mix (May–Jul) | 58% Quick Fix / 42% TMCP by count | KNOWN, close-rate report 2026-07-31 |
| Quick Fix average sale | $423 | KNOWN, same |
| Quick Fix contribution per job | ~$250 (5 visits at ~$35 fully loaded, plus setup) | ESTIMATE |
| TMCP price, cost | $100–150/mo; ~$70/mo cost (2 visits × $34.80) | KNOWN price; ESTIMATE cost (cfo 2026-09-29) |
| TMCP contribution | ~$45/mo blended across tiers | ESTIMATE |
| TMCP churn | 1.14%/mo (measured in peak only) | KNOWN, 2027 plan |
| TMCP contribution, first 3 years after churn | ~$1,300 | ESTIMATE |
| **Blended contribution per booked job** | 0.58 × $250 + 0.42 × $1,300 ≈ **$690** | ESTIMATE |
| Industry CAC benchmark | $200–400 | ESTIMATE |

- **$200 target.** About 3.5:1 contribution to acquisition cost. A Quick Fix pays it back on the
  first job, and a TMCP signup in ~4–5 months. The $10K plan's $300 / 6-month gate is the outer
  edge, so it becomes the ceiling.
- **$400 TMCP allowance.** At ~$45/mo, $400 pays back in about 9 months, against ~$1,300 of
  contribution.

All of this rests on two `UNKNOWN`s: true contribution margin (acc-cfo has no Quick Fix model) and
winter churn. If margin is 20% lower, the target falls to ~$160.

### From CPBJ to cost per lead

Of new-lead calls with a real conversation, **27.8% booked** (May–Jul), rising to 37% in July
(`KNOWN`). Meta is interruption traffic, colder than someone searching on Google, so plan on
**25%** (`ESTIMATE`) until the first Meta cohort matures.

```
target CPL  = $200 × 0.25 = $50
ceiling CPL = $300 × 0.25 = $75
```

A "lead" here means a qualified form submission (once Roy's Lead event is live) or a CallRail call
on the Facebook tracker (253) 528-8152 that lasts 30 seconds or more.

**Read on the current DigiHammer campaign:** it pays **$42 per Meta-counted 20-second call**, under
the $50 target. If a quarter of those calls book, its CPBJ is ~$170. It might be fine. We can't
know, because it rings the untracked main line. That's why we measure it before killing it.

## The budget, by season

Seasonality drives this. New customers last winter ran Nov 56, Dec 30, Jan 6, Feb 14 (KNOWN). The
techs have room from Dec to Feb, and none in peak.

| Phase | Dates | Daily | Total | What it's for |
|---|---|---|---|---|
| 0. Baseline | On approval → Jan 31 (call ads need only the phone tracker, not the pixel) | ~$7 | ~$200/mo | Replace DigiHammer's call campaign with our copy of it, same structure but on the 528-8152 tracker. First measured Meta CPBJ, cheaply. Pause theirs the day ours goes live. |
| 1. Angle test | Feb 15 → Mar 31 | $45 (3 ad sets × $15) | ~$1,900 | Three angles, 2–3 ads each, broad inside the service area. Fits under Meta's current $47/day cap. |
| 2. Spring scale | Apr 1 → May 31 | $45 → up to $100 | ≤ $3,000/mo | Winners only. Budget goes up 10% every 72 hours, only when the scaling gate passes. |
| 3. Peak | Jun → Sep | Held at whatever level passes the gate | ≤ $3,000/mo | Inside the 2027 plan's ≤ $9K/mo total ad budget, so Meta is at most a third of paid. |

**Through March 31: ~$2,500.** It comes out of the $5.2K/mo ad line that already exists, plus the
2027 plan's spring ramp. It does not touch the $6.5K held in the $10K plan.

Why not test now: December ad prices are inflated by holiday retail, January has almost no new
customers, and the techs couldn't take a spike before Feb anyway. Meanwhile the creative, landing
page and customer list get built over the winter.

## Kill and scale rules

Rules are from `ops-meta-ads` operating rules §2–3, with these numbers:

| Level | Rule |
|---|---|
| Single ad, no leads | Spends $150 (3× target CPL) with zero leads → pause that ad |
| Single ad, with leads | After 3+ leads: CPL ≤ $50 keep; $50–65 hold; $65–75 gray zone; > $75 pause or iterate |
| Angle | Weekly booked-job cohort: 3+ booked jobs at CPBJ > $300 → kill the angle |
| Scale gate | CPBJ ≤ $200 on a matured cohort, the route board has room for the next 2 weeks, speed-to-lead healthy, nothing changed in 72 h, Spencer OKs the new daily budget |
| **Program** | By Mar 31, if measured Meta CPBJ > $300 on ≥ $1,500 of spend → stop Meta prospecting. Keep only retargeting and existing-customer ads, and move the money to Google/LSA |

## Report

Weekly, in `ops-meta-ads` REPORT mode: spend, leads, CPL, booked jobs (Jobber), CPBJ, Quick Fix /
TMCP mix, and payback, each against the prior week. Monthly, it rolls into the marketing review.

## Decisions for Spencer

1. Approve the **$200 target / $300 ceiling / $400 TMCP allowance**.
2. Approve **Phase 0**: our copy of the call campaign at ~$7/day on the Facebook tracker, built as a
   paused draft for your review, with DigiHammer's version paused the day ours goes live. It needs
   only the phone tracker, so it can start before Roy's pixel work.
3. Approve the **Feb–Mar test budget (~$1,900)** in principle. The ads themselves come to you
   for sign-off in early February.
