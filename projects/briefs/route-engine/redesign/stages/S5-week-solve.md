# S5 — `week-solve`: the S4 design, backtested

Written 2026-09-19. The planning policy from S4 sections 2 and 5 is now a real
policy in the harness (`scripts/policies/week-solve.mjs`), scored on both golden
weeks against the board the field actually ran. Everything is offline. Run logs
are in `backtest/logs/`; scorecards in `backtest/<week>/week-solve/` and
`backtest/sens/<variant>/<week>/week-solve/`.

```bash
cd projects/briefs/route-engine/redesign
node scripts/backtest.mjs --week=2026-08-24 --policy=week-solve
node scripts/backtest.mjs --week=2026-08-31 --policy=week-solve
```

---

## What the policy does

**Layer 1 — the owner map, no lookahead.** For every job, the dominant tech over
completed visits strictly before the golden week's Friday 14:00 PT cutoff, ties
broken by the most recent. A tech off the week's roster does not count, so a
handed-over book re-homes rather than vanishing. A job with no owner-bearing
history is voted in by its ten nearest jobs that have one, weighted by inverse
distance. `master-asbuilt.json`'s own `routeDay` is deliberately **not** used:
it was derived over a window that contains both golden weeks.

**Layer 2 — due windows.** Computed from the job's last completed visit before
the cutoff, per the S4 state table: `[+5, +9]` days for active TMCP and for a
Quick Fix series, `[+26, +35]` for quiet TMCP. Where the harness cannot
determine the state offline, the window is the visit's own scheduled day plus or
minus two weekdays. Every window carries its tier onto the scorecard.

**Day-zones.** Per tech, k-medoids with k=5 over the coordinates of that tech's
completed stops before the week, deterministic farthest-point seeding. Each zone
takes the weekday its stops were most often served on, one weekday per zone,
ties spread across the free weekdays. The zone's cycle time is that tech and
weekday's median span-per-stop from `route-day-drive_2026-08-17_2026-09-17.json`,
cut at the week start: 25 route-days of evidence before week one, 49 before week
two. Every tech-weekday resolved at the `tech+weekday` tier in both weeks, so no
cycle-time fallback was needed.

**Layer 3 — the week.** Per tech: greedy by window urgency (fewest legal days
first, then the window closing soonest), then a move-and-swap local search
minimising capacity penalty (quadratic above 8.0 h, hard wall 9.5 h at zone
cycle time times stops), zone distance in km from the day's medoid, and a small
weekday-drift term. Owner tech and Monday-to-Friday are hard. A visit that
cannot fit under the wall goes to `overflow` and is left unplaced, so it is
counted as a drop rather than hidden. Sequencing is the harness's, identical for
every policy.

Weights, overridable by environment variable for sensitivity runs: capacity 30
per squared hour above 8.0 (`WS_CAP_W`), compactness 1 per km (`WS_ZONE_W`),
weekday drift 1 per drifted visit (`WS_DRIFT_W`), overdue lateness 2 per weekday
(`WS_LATE_W`), overdue handling (`WS_OVERDUE=monday|week`, default `monday`).

## What was added to the scorecard

The harness now scores the S4 section 5 items for every policy, in
`scripts/backtest.mjs` rather than a fork:

- **Due-window compliance**, when a policy supplies `proposal.windows` — share
  inside the raw window and inside the window clamped to the five weekdays,
  broken out by window tier.
- **Capacity** — route-days over 8 h and over 9.5 h on the harness's own
  modelled travel-plus-service time, for the proposal and for the actual.
- **Compactness** — route-days whose total route time is within 5% of the
  OptimoRoute day, `travel.mjs` on both sides.
- **Overflow** — from `proposal.overflow`.
- **Late bookings** — promoted from a coverage line to a named gate, since it is
  the add-queue load.

`keep-actual` still scores 24/24 and 25/25 on board-only hours after the change,
which is the harness saying it is still wired right.

---

## Scorecard — 2026-08-24

| | keep-actual | dominant-routeday | **week-solve** |
|---|---:|---:|---:|
| Due visits known at the cutoff | 552 | 552 | 552 |
| Placed | 552 | 552 | **536** |
| Dropped (= overflow) | 0 | 0 | **16** |
| Same tech | 100% | 86.8% | **87.5%** |
| Same day | 100% | 69.2% | **72.8%** |
| Same tech and day | 100% | 62.9% | **64.6%** |
| Inside the due window, clamped to the week | - | - | **100%** |
| Inside the raw due window | - | - | **98.3%** |
| Route-day hours within +-10% | 21/24 | 6/24 | **13/24** |
| Board-only hours within +-10% | 24/24 | 5/24 | **9/24** |
| Board-only median ratio | 1.00 | 0.99 | **1.01** |
| Compactness: route-day time within +-5% | 13/24 | 2/24 | **5/24** |
| Route-day ratio range | 0.87 - 1.00 | 0.43 - 1.73 | **0.36 - 1.53** |
| Route-days over 9.5 h (modelled travel + service) | 1/24 | 5/25 | **3/25** |
| Route-days over 9.5 h (at measured cycle time) | - | - | **0/25** |
| Longest route-day, modelled hours | 10.2 | 11.3 | **11.4** |
| Weekend placements | 0 | 0 | **0** |
| Late bookings held out | 55 | 55 | 55 |

## Scorecard — 2026-08-31

| | keep-actual | dominant-routeday | **week-solve** |
|---|---:|---:|---:|
| Due visits known at the cutoff | 532 | 532 | 532 |
| Placed | 532 | 532 | **528** |
| Dropped (= overflow) | 0 | 0 | **4** |
| Same tech | 100% | 90.2% | **89.2%** |
| Same day | 100% | 75.9% | **47.7%** |
| Same tech and day | 100% | 71.8% | **45.3%** |
| Inside the due window, clamped to the week | - | - | **100%** |
| Inside the raw due window | - | - | **84.5%** |
| Route-day hours within +-10% | 21/25 | 9/24 | **5/24** |
| Board-only hours within +-10% | 25/25 | 7/24 | **4/24** |
| Board-only median ratio | 1.00 | 0.98 | **1.09** |
| Compactness: route-day time within +-5% | 14/25 | 5/24 | **2/24** |
| Route-day ratio range | 0.82 - 1.00 | 0.62 - 1.32 | **0.22 - 1.77** |
| Route-days over 9.5 h (modelled travel + service) | 3/25 | 2/25 | **6/25** |
| Route-days over 9.5 h (at measured cycle time) | - | - | **0/25** |
| Longest route-day, modelled hours | 10.2 | 10.9 | **12.8** |
| Weekend placements | 0 | 0 | **0** |
| Late bookings held out | 54 | 54 | 54 |

---

## Window tiers and fallback counts

How many due visits got each kind of window, and how often the owner map had to
fall back to a neighbour vote.

| | 2026-08-24 | 2026-08-31 |
|---|---:|---:|
| Owner from a dominant tech in the history | 623 jobs | 787 jobs |
| Owner from the 10-nearest-neighbour vote | **125 jobs** | **47 jobs** |
| Owner from the roster floor (no coordinate) | 0 | 0 |
| Median dominant-tech share, where measurable | 1.00 | 1.00 |
| History available before the cutoff | 725 visits, 7 days | 1,329 visits, 12 days |

| Window tier | 2026-08-24 | 2026-08-31 | Window used |
|---|---:|---:|---|
| `active-measured` — last delivered gap <= 12 d | 48 | 237 | `[+5, +9]` |
| `quiet-measured` — last delivered gap >= 20 d | **0** | **0** | `[+26, +35]` |
| `active-assumed` — a TMCP anchor, only one visit before the cutoff | 250 | 119 | `[+5, +9]` |
| `active-series` — Quick Fix | 112 | 117 | `[+5, +9]` |
| `ambiguous-gap` — gap 13-19 d | 0 | 1 | scheduled +-2 |
| `other-product` — barter, bid, other | 17 | 11 | scheduled +-2 |
| `no-anchor` — no completed visit before the cutoff | 125 | 47 | scheduled +-2 |
| **Windows clamped: already overdue at the cutoff** | **9** | **82** | window closed before Monday |
| Windows clamped: opening after the week | 0 | 0 | |

Two things in that table matter more than the rest.

**No job in either week reads as quiet.** Of the 64 and 339 jobs with two or
more completed visits before the cutoff, **every single measured gap is 12 days
or under**. The `[+26, +35]` quiet branch never fired. The recurring series does
not help either: 416 of 551 due jobs in week one carry a `Monthly on the Nth
weekday` recurrence while the field delivers them weekly, so the recurrence
string describes the template, not the cadence. That is S3b's "the office runs
one cadence" and "nobody re-sizes the master" showing up from a different angle.

**The design's quiet/active split cannot be tested offline.** It needs the
per-visit note, which the Jobber pull does not carry. Everything scored here
tests the active branch and the fallback.

---

## Sensitivity

Same policy, one weight changed. `overdue-week` is not a weight but the handling
of a window that closed before the week opened: the default puts those visits on
Monday, the only day that honours the window at all; `week` lets them spread
across the week with a small cost per day of further delay.

### 2026-08-24

| Variant | Same tech | Same day | Hours +-10% | Board +-10% | Compact +-5% | Over 9.5 h | Longest day | Overflow |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| base | 87.5% | 72.8% | 13/24 | 9/24 | 5/24 | 3/25 | 11.4 | 16 |
| drift weight x5 | 87.5% | **75.4%** | 13/24 | 9/24 | **7/24** | 3/25 | 11.4 | 16 |
| compactness weight x0.5 | 87.5% | 73.1% | 13/24 | 9/24 | 5/24 | **2/25** | 11.4 | 16 |
| overdue spread across the week | 87.5% | 74.4% | 11/24 | **10/24** | 6/24 | 3/25 | **10.8** | 16 |

### 2026-08-31

| Variant | Same tech | Same day | Hours +-10% | Board +-10% | Compact +-5% | Over 9.5 h | Longest day | Overflow |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| base | 89.2% | 47.7% | 5/24 | 4/24 | 2/24 | 6/25 | 12.8 | 4 |
| drift weight x5 | 89.2% | **51.9%** | 5/24 | 4/24 | 3/24 | 6/25 | 12.8 | 4 |
| compactness weight x0.5 | 89.2% | 48.7% | 6/24 | 5/24 | 3/24 | **5/25** | 12.5 | 4 |
| overdue spread across the week | 89.2% | **60.0%** | **7/24** | **6/24** | 2/24 | **4/25** | **10.7** | 4 |

**Nothing moves the tech number**, because the owner map is fixed before the
solve and no weight can reach it.

**The weekday-drift weight is the only lever on same-day**, and it is a weak
one: five times the weight buys 2.6 and 4.2 points. Day agreement is set by the
window, not by the drift term.

**Halving the compactness weight slightly improves capacity** and, in week two,
the hours gates. The zone-distance term and the capacity term genuinely trade
against each other, and the base weighting leans a little too far toward
compactness.

**The overdue rule is the single biggest choice in the whole policy.** Spreading
82 overdue visits across week two instead of stacking them on Monday moves same
day from 47.7% to 60.0%, board-only hours from 4/24 to 6/24, days over the wall
from 6 to 4, and the longest modelled day from 12.8 h to 10.7 h. The strict
reading of "nothing leaves its window" is what produces the worst day in the
entire backtest.

---

## Does the design meet S4 section 5

| S4 section 5 requirement | Week one | Week two | Verdict |
|---|---|---|---|
| Same tech >= 95%, owner map with no lookahead | 87.5% | 89.2% | **No** |
| Every visit inside its due window | 100% clamped, 98.3% raw | 100% clamped, 84.5% raw | **Yes, with a caveat** |
| Zero weekend | 0 | 0 | Yes |
| Zero drops | 16 overflow | 4 overflow | **No** |
| Hours per route-day within +-10% of the field | 13/24 | 5/24 | **No** |
| No day over 9.5 h at measured cycle time | 0/25 | 0/25 | Yes, by construction |
| No day over 9.5 h, modelled travel + service | 3/25 | 6/25 | **No** |
| Compactness within 5% of the OptimoRoute day | 5/24 | 2/24 | **No** (see below) |
| Same day: reported, not gated | 72.8% | 47.7% | Reported |
| Late bookings reported separately | 55 | 54 | Yes |

### Reading it

**The owner map is the design's weakest link, and the backtest version is not
the design's version.** 87.5% and 89.2% same tech, against a 95% target and
against `dominant-routeday`'s 86.8% and 90.2% — that is, deriving ownership
from history is worth nothing over the crude static master. The mismatch list
says why. In week two the largest single group is 24 visits proposed for Cory
Ventura that Luke LaVergne actually worked, and that is the Friday 2026-08-28
cover day S5 already documents: OptimoRoute held 17 stops under Luke and Cory
worked all of them, so the dominant-tech vote learned Cory and handed him a book
that was never his. One cover day flipped ownership on two dozen customers. This
is precisely the failure S4 section 2 legislates against — *"no script ever
derives ownership on the fly again"*, ownership on the customer record, changed
only by a dated handover. The backtest cannot test the design's owner map
because that map does not exist yet; it can only show that the thing the design
forbids does not clear 95%. **Sign the owner map (S4 decision 1) and this number
is not a modelling question any more.**

**The due-window machinery works, and there is nothing quiet to test it on.**
Every placed visit sits inside its window once the window is clamped to the
week, in both weeks. The raw numbers, 98.3% and 84.5%, are entirely the overdue
backlog: 9 visits in week one and 82 in week two had a window that closed before
Monday. That 82 is 15.4% of the week, which lands on top of S3b's independently
measured 15% hard-overdue rate. The design's window arithmetic reproduces the
backlog the business already has. What it cannot do offline is tell active from
quiet: no gap in either golden week exceeds 12 days, so the `[+26, +35]` branch
never ran, and 250 and 119 visits rest on `active-assumed` — a TMCP anchor with
only one completed visit before the cutoff, which the delivered data says is
weekly but does not prove per job. **The state machine in S4 section 2 needs the
per-visit note, and the note is not in the Jobber pull. That is the one piece of
the design this harness cannot check.**

**Capacity is where the design is genuinely right and genuinely unfinished.**
The hard wall does what it says: zero route-days over 9.5 h at measured cycle
time, in both weeks, by construction. The overflow it produces is not noise, it
is a finding. In week one Alias Franks's book is 134 visits against a 118-stop
wall capacity — 46.6 modelled hours of work against a five-day week — while Cory
Ventura's 114 visits sit against 185 stops of capacity, 28.1 hours, 71 stops of
slack. Week two is the same shape: Alias 114 against 110, Cory 123 against 186.
**Every overflow visit in both golden weeks belongs to one tech, and the float
named in S4 section 2 has room for all of them on both weeks.** The design's
answer, an overflow list that goes to Spencer with the float as the proposed
taker, is exactly the right output; the backtest just shows it will be used
every week, not occasionally.

**The two capacity models disagree, and the wall is only as good as the one it
is built on.** At measured cycle time no day exceeds 9.5 h. On the harness's own
travel-plus-service model, 3 and 6 days do, topping out at 12.8 h. The gap is
worst for the fastest techs: Cory's measured Monday cycle is 14.1 minutes a
stop, so 36 stops reads as 8.4 h at cycle time and 12.1 h on travel plus service
with OptimoRoute's service durations. S2 already found OptimoRoute over-prices
drive or service by about 20%, and this is that same disagreement arriving in
the capacity check. **Before the wall can be trusted as an operational limit,
the cycle time behind it has to come from FleetSharp as S4 section 4 specifies,
not from span-per-stop over 25 route-days.**

**The compactness gate as written cannot be passed, by anything.** `keep-actual`
— the oracle, the exact board the field ran — scores 13/24 and 14/25 on
"route-day time within 5% of the OptimoRoute day". The reason is the sequencer,
not the board: our order finishes the same stop set faster, which pushes the
ratio below 0.95 on days where nothing about the board changed. The effective
ceiling in this harness is about 55%, so `week-solve`'s 5/24 and 2/24 should be
read against 13/24 and 14/25, not against 24/24. The board-only median ratio,
1.01 and 1.09, is the honest compactness read, and it says week one's board is
the same size as the field's and week two's is 9% bigger. **Restate the S4
section 5 compactness gate against the board-only ratio, or against a real
distance matrix, before holding any policy to it.**

**Same day is not a target and should not become one.** 72.8% in week one and
47.7% in week two, and the two numbers differ for a reason worth naming: week
one is dominated by fallback windows centred on the office's own scheduled day,
which partly copies the answer, while week two has enough history for 237
`active-measured` windows computed from the last visit alone. The moment the
window stops borrowing the office's choice, day agreement drops by 25 points.
That is the design working, not failing — S4 already says the field's day choice
was "wherever there was room" — but it does mean **any future scorecard that
quotes same day has to say which window tier produced it.**

### What to change

1. **Sign the owner map** (S4 decision 1). Derived ownership is worth nothing
   over the crude master and is corrupted by a single cover day.
2. **Get the visit note into the pull.** Without it the active/quiet state
   machine is untestable and 369 of the 1,064 placed visits across the two weeks
   rest on an assumed state.
3. **Rewrite the overdue rule in S4 section 2.** "Nothing leaves its window" has
   no meaning for a visit whose window already closed. Spreading the backlog
   across the week beats stacking it on Monday on every metric that moved.
4. **Move cycle time to FleetSharp** before the 9.5 h wall is treated as real.
   Two defensible models of the same day differ by up to 40% on the fastest
   tech.
5. **Re-state the compactness gate** against the board-only ratio. The oracle
   fails the current one.
6. **Plan for the overflow, weekly.** It is structural, it is one tech, and the
   float has the room.
