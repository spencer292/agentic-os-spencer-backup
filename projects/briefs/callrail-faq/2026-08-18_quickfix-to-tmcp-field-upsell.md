# The field upsell lane — how much of the Quick Fix book becomes TMCP

**Question:** if Muhammad closes mostly Quick Fix, how much of that annual value do the field techs
recover later? **Measured 2026-08-18** against live Jobber data — every job created since
2026-01-01, grouped by client, checking whether a Quick Fix was followed by a TMCP job.
Script: `scripts/quickfix-to-tmcp.mjs` (read-only).

---

## The number

| | |
|---|---:|
| Quick Fix jobs since 2026-01-01 | **350** |
| …matured (45+ days, series has had time to run) | 192 |
| **Upgraded to TMCP** | **41 / 192 = 21%** |
| Median lag from Quick Fix to upgrade | **38 days** |
| Upgrades that happened *inside* the 5-week series | **17 of 41 (41%)** |
| Quick Fix jobs live in the window right now | **158** |

**You are right, and it is worth about 21%.** One in five Quick Fix customers becomes an annual
customer. That materially changes how the phone number should be read.

---

## What it does to Muhammad's plan-mix gap

I told you on 08-18 that his 15% TMCP share against your 47–58% was worth roughly **$8,500** across
his 27 sales. That figure ignored the field lane. Corrected:

| | |
|---|---:|
| His wins so far | 27 (23 Quick Fix, 4 TMCP) |
| TMCP at point of sale | 15% |
| Expected upgrades from his 23 Quick Fix at 21% | **~4.8** |
| **Effective TMCP share once the field lane runs** | **~33%** |
| Residual gap vs your point-of-sale mix | **~$2,900**, not $8,500 |

So roughly **two-thirds of the gap I flagged is recoverable in the field**, and a good chunk of it
will recover on its own without anyone doing anything differently.

**And his book should upgrade at better than 21%.** Look at the upgrade rate by who sold the
Quick Fix:

| Sold by | Upgraded |
|---|---:|
| Cory Ventura | 5 / 14 = **36%** |
| Courtney | 8 / 28 = **29%** |
| (unassigned) | 16 / 68 = 24% |
| **Spencer Hill** | **11 / 80 = 14%** |

Your own Quick Fix customers upgrade *least often* — and that is not a criticism, it is selection.
You convert 47–58% to TMCP on the phone, so the ones who still choose Quick Fix are the committed
one-month buyers. Muhammad's Quick Fix book is barely filtered by comparison, which means it contains
far more people who would have taken the annual if asked properly. **His upgrade rate should run
above the 21% average, not below it.**

---

## Per-tech upgrade rate — and what the flatness of it tells you

Every tech who worked at least five matured Quick Fix series. A job counts for each tech who worked
any visit on it, so the counts sum to more than 192.

| Tech | Quick Fix series worked | Upgraded | Rate |
|---|---:|---:|---:|
| Tavis Alexander | 59 | 17 | **29%** |
| Spencer Hill | 49 | 12 | 24% |
| Cory Ventura | 81 | 18 | 22% |
| Brayden Rich | 32 | 7 | 22% |
| Cammeron Anderson | 53 | 11 | 21% |
| Luke LaVergne | 75 | 14 | 19% |
| Robert Norton | 11 | 2 | 18% |
| Alias Franks | 13 | 2 | 15% |

**The interesting thing here is how flat it is.** Best to worst is 29% against 15%, and six of the
eight sit between 18% and 24%. If techs were actively selling the annual in the yard you would expect
a wide spread — selling is a skill and skill varies. A tight band clustered near the average is what
it looks like when **nobody is really selling it and the upgrades are happening on their own**,
driven by the customer rather than the tech.

That reading matches the timing exactly: median lag 38 days, only 41% inside the series. The 21% is
close to a passive baseline — what happens when the moles come back and the customer calls in.

**Which is good news.** It means the 21% is a floor produced by doing nothing deliberate, not a
ceiling produced by trying hard. Tavis's 29% is the closest thing to evidence that working it moves
the number, and even that is only one tech, one sample.

---

## The part worth more than any of that

**Only 41% of upgrades happen while the tech is still on the property.** Median lag is 38 days — the
5-week series is 35 days — so the typical upgrade lands *after* the last visit, which means it is
mostly not a tech-in-the-yard close at all. It is a customer coming back later, usually because the
moles did.

That is the opposite of the strongest moment to sell. During the series a tech is standing in the
yard holding the evidence, on a property with a known-active mole, in front of a customer who has
already paid. After the series he is a phone call competing with everything else.

**158 Quick Fix jobs are inside that window right now.** At the current 21% about 33 will upgrade. If
the in-series half were worked deliberately, that number should be much higher.

Annualised, the arithmetic is large: 350 Quick Fix jobs in seven and a half months is roughly **560 a
year**. Every point of upgrade rate is ~5.6 more annual customers, and the incremental value of an
upgrade is about **$1,150**. Moving 21% → 30% is worth on the order of **$55,000–60,000 a year** —
far more than anything available on the phone side.

---

## What I would do

1. **Give the techs one line and one moment.** At the visit where they catch the first mole:
   *"This one's out. The thing is they're territorial — the tunnel's still here, so the next one
   moves in. That's what the year-round plan is for, and the $150 you already paid counts toward
   it."* That is beat 5 plus the credit bridge, which the phone team already says verbatim.
2. **Make the 5th visit a decision point, not an exit.** Right now the series ends and the customer
   leaves the system. It should end with an explicit ask.
3. **Track upgrade rate per tech monthly.** The table above is the baseline to beat. Tavis is the
   only one meaningfully above the pack; if the line above works, everyone should move toward 29%
   and past it.
4. **Read Muhammad's number as ~33% effective, not 15%.** His phone mix still matters — an upgrade
   costs a visit series to earn, where a phone TMCP costs nothing — but the gap is a third of what
   the raw comparison suggests.

---

## Method / caveats

- Upgrade = a client with a Quick Fix job who later has a TMCP job. Matched on client ID, so a
  customer who upgraded under a duplicate client record would be missed — and duplicates run at
  roughly 22% of new records (see `2026-08-13_duplicate-client-records.md`). **The true upgrade rate
  is therefore likely somewhat higher than 21%.**
- "Matured" = 45+ days old, giving the 5-week series time to finish. 158 newer Quick Fix jobs are
  excluded from the rate and listed as live targets instead.
- Window starts 2026-01-01, so upgrades from a 2025 Quick Fix are not counted.
- The annualised $55–60k is an extrapolation from 7.5 months at a constant rate and a constant
  $1,150 incremental value. Treat it as an order of magnitude, not a forecast.
- Per-tech attribution needs `Visit.assignedUsers`; nesting visits inside the jobs query blows
  Jobber's query-cost limit, so it is a separate lighter pull (25 jobs/page, 6 visits). A series
  worked by two techs counts for both, so per-tech totals sum above 192.
