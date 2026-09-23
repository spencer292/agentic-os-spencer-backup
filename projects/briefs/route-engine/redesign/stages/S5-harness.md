# S5 — Backtest harness

How we decide whether a redesigned route engine is better than the board that
actually ran. Replay a real week from what was knowable before it started, let a
policy propose a board, and score that board against what the techs really did.

Everything is offline. No script here makes a network call.

---

## Running it

```bash
cd projects/briefs/route-engine/redesign
node scripts/backtest.mjs --week=2026-08-24 --policy=keep-actual
node scripts/backtest.mjs --all            # every policy x every golden week
```

| Flag | Meaning |
|---|---|
| `--week=YYYY-MM-DD` | Monday of the golden week. Default `2026-08-24`. |
| `--policy=<name>` | A module under `scripts/policies/`. Default `keep-actual`. |
| `--all` | Every policy against every golden week, then a summary table. |
| `--out=<dir>` | Output root. Default `redesign/backtest`. |
| `--no-orOpt` | 2-opt only, skip the Or-opt pass. |
| `--quiet` | Scorecard files only, no console table. |

Output lands in `backtest/<week>/<policy>/` as `scorecard.md`, `scorecard.json`
and `board.json`. Run logs are under `backtest/logs/`. A full `--all` run takes
about 8 seconds.

## The pieces

| File | Job |
|---|---|
| `scripts/backtest-data.mjs` | Loads every input, reconstructs the week as of the Friday cutoff, builds the actual board. |
| `scripts/sequence.mjs` | Orders one tech's day: nearest-neighbour from their start area, then 2-opt and Or-opt over `travel.mjs`. |
| `scripts/policies/*.mjs` | A policy exports `name`, `description`, `usesOracle` and `propose(snapshot)`. |
| `scripts/backtest.mjs` | Orchestrates, scores, writes. |

A policy receives the snapshot and returns `{ assignments: [{key, tech, date}], notes }`.
It never sequences anything. The harness sequences every proposal the same way,
so two policies are compared on their board, not on their routing code.

`snapshot.actual` is the oracle. Only a policy that declares `usesOracle = true`
may read it, and only `keep-actual` does.

---

## Reconstructing the week as of Friday 14:00 PT

The cutoff is 14:00 Pacific on the Friday before the golden week, resolved
through `Intl` against `America/Los_Angeles` rather than assumed, so it survives
a daylight-saving boundary.

1. **Candidate visits.** Every Jobber visit whose `startAt` falls Monday to
   Friday of the golden week in Pacific time, plus any visit whose `completedAt`
   falls in that window. The union catches work that ran in the week but carries
   a scheduled date outside it.
2. **Known or late.** A candidate with `createdAt` after the cutoff is a **late
   booking**. It is held out of the due set, counted, and reported on its own
   line. A policy planning on Friday afternoon could not have known about it, so
   scoring it would punish the policy for the calendar.
3. **Coordinates.** Where a visit was routed, the harness takes OptimoRoute's
   coordinate for it, because that is the point the real route was built on.
   Otherwise the Jobber visit coordinate, then the job's property coordinate.
   No due visit in either golden week was missing coordinates.
4. **Service minutes.** Taken from the OptimoRoute stop where the visit was
   routed, otherwise that tech's median. Proposal and actual are timed with the
   same per-visit service minutes, so the hours comparison is about the board and
   the driving, never about a service-time assumption.
5. **Start areas.** `travel-model.json` → `inferredStartArea`, one point per
   tech, with a centroid fallback for a tech who has none.
6. **History.** Every completed visit strictly before the golden week's Monday,
   for policies that learn from the past. Cutting it at Monday is what stops a
   "learned" policy from reading the answer.

### The known limitation

Jobber was pulled once, on 2026-09-18. A visit's `startAt` is therefore its
*final* scheduled date, not the date it held on the Friday before the week. If a
visit was moved after the cutoff, the harness sees the moved date and credits the
policy with knowing it. The `plan-vs-actual` join measures this directly: 11
moved days across 2,577 planned stops, 0.4%. Small enough to live with, worth
restating whenever a result turns on a fraction of a percent.

---

## The join

OptimoRoute's `orderNo` is `<jobNumber>-<visitNumericId>`, where the numeric id
is the tail of the base64-decoded Jobber visit gid:

```
Z2lkOi8vSm9iYmVyL1Zpc2l0LzIwMzc2MTM4NTE=  ->  gid://Jobber/Visit/2037613851  ->  2037613851
```

Verified before use, on the first golden week: 574 of 576 OptimoRoute stops
resolved to a Jobber visit, 99.7%. On 20 hand-checked samples the client name,
the date and the tech agreed in every case, and the coordinates agreed to five
decimal places on 18 of 20, the other two being property re-geocodes rather than
join errors. This matches the 98.9% the `plan-vs-actual` worker reports across
the full 23-day window, so the two are using the same key.

Stops that resolve to nothing are **ghost orders** — OptimoRoute stops with no
Jobber visit behind them. Two in the first golden week, five in the second. They
are counted on the scorecard and excluded from scoring.

## The actual board

Two different things can be called "what happened", and the harness keeps both.

- **Actual run** — who stamped the visit complete, and on what Pacific date.
  Falls back to the OptimoRoute stop, then to the Jobber schedule. This is the
  primary reference for tech and day agreement.
- **OptimoRoute as held** — the engineered route for that date, its driver and
  its stop order. This is the reference for sequence quality.

They are keyed **off the completion stamp, not off the OptimoRoute driver name**,
and that matters. On Friday 2026-08-28 OptimoRoute held a 17-stop route under
Luke LaVergne and Cory Ventura worked every one of them. Keying route-days off
the OptimoRoute driver would have invented an empty day for one tech and an
unscoreable day for the other. Those 17 stops are the entire held-versus-stamp
tech disagreement for that week.

Inside a route-day, the actual stop order is OptimoRoute's engineered order
wherever the stop was routed that same date, and the completion-stamp order
otherwise. In practice that is 549 of 552 stops from OptimoRoute in week one and
524 of 532 in week two, so the sequence comparison really is against
OptimoRoute's order.

---

## Scorecard

| Gate | Threshold |
|---|---|
| Same tech | >= 95% |
| Same day | >= 95% |
| Route-day hours | within +-10% of actual |
| Dropped visits | 0 |
| Invented visits | 0 |
| Weekend placements | 0 |

Reported alongside: per-tech weekly hours, late bookings, ghost orders, and a
per-route-day table.

**Hours** are modelled with `travel.mjs` over each route-day in its own order,
including the inbound leg from the tech's inferred start area and excluding the
trip home, which the source data cannot pin down.

The headline hours ratio moves for two reasons at once, a different board and a
different stop order, so the scorecard also reports a **board-only** ratio: the
actual day's stop set re-sequenced by our own sequencer. What remains is purely
the board. On both golden weeks `keep-actual` scores exactly 1.00 on board-only
hours across every route-day, which is the harness telling us it is wired right.

**Sequence** is compared on the common stop set only: the stops a route-day has
in both boards, ordered each way, timed with the same model.

---

## Baseline results

### keep-actual — the oracle

Proposes the tech and day each visit actually got. It exists to validate the
harness, and it does.

| | 2026-08-24 | 2026-08-31 |
|---|---:|---:|
| Due visits known at the cutoff | 552 | 532 |
| Late bookings held out | 55 | 54 |
| Same tech | 100% | 100% |
| Same day | 100% | 100% |
| Board-only hours within +-10% | 24/24 | 25/25 |
| Board-only median ratio | 1.00 | 1.00 |
| Dropped / invented / weekend | 0 / 0 / 0 | 0 / 0 / 0 |
| Ghost OptimoRoute orders | 2 | 5 |

The raw hours gate reads 21/24 and 21/25 rather than clean, and the reason is
not the board. It is that the sequencer finishes the same day faster than the
route that was held, which drags the ratio below 0.90 on a few days. Board-only
is the number to read for a board; raw hours is a sequencer measurement wearing a
board's clothes.

### dominant-routeday — the static master route

Each job goes to the tech and weekday it was most often served on before the
golden week. No lookahead, no oracle. This is the crude master route, and it
answers how far a fixed weekly pattern gets on its own.

| | 2026-08-24 | 2026-08-31 |
|---|---:|---:|
| Same tech | 86.8% | 90.2% |
| Same day | 69.2% | 75.9% |
| Same tech **and** day | 62.9% | 71.8% |
| Board-only hours within +-10% | 5/24 | 7/24 |
| Board-only median ratio | 0.99 | 0.98 |
| Board-only ratio spread | 0.48 – 1.78 | 0.65 – 1.39 |
| Placed from the job's own history | 436 | 487 |
| Placed from ZIP history | 108 | 44 |
| Placed by nearest start area | 8 | 1 |
| History available | 725 visits, 7 days | 1,329 visits, 12 days |

### Reading it

**A static master gets the tech roughly right and the day badly wrong.** Tech
agreement sits at 87-90% while day agreement sits at 69-76%. Of the mismatches,
roughly four in five are the day alone, with the tech correct. Territory is
close to a fixed property of a job; the day is not. That is the cadence rules
doing their work — activity and catches pull visits forward, and no fixed weekly
pattern can reproduce that. A master route is a reasonable starting layout and a
poor scheduler.

**The static master's median hours look fine and its spread is ruinous.** The
board-only median ratio is 0.99 and 0.98, near perfect, while only 5 of 24 and 7
of 24 route-days land inside +-10%, with individual days between 0.48 and 1.78 of
the hours that were really worked. Averaged over a week the work balances; on any
given day a tech is at half load or seventy percent over. This is the single
strongest argument in the backtest for keeping a capacity check in the engine
rather than trusting a layout.

**Late bookings are about 9% of the week**, 55 of 607 and 54 of 586. Roughly one
visit in eleven in a given week did not exist when a Friday planner would have
built it. Any design that assumes a week can be planned once on Friday and left
alone needs an answer for that ninth visit.

**The second week scores better than the first on every board metric**, and the
likely reason is history depth: 12 days of completions available versus 7. A
learned policy is still climbing at two weeks of history. Do not read a
one-week-of-history result as the ceiling.

### The sequencer, and why its win is not yet bankable

Against the held OptimoRoute order, on the same stop set, our nearest-neighbour
plus 2-opt plus Or-opt sequencer reports a median drive-time ratio of **0.87** on
both golden weeks, beating OptimoRoute on 24 of 24 and 23 of 24 route-days.

Treat that number with suspicion. OptimoRoute actually drove every leg in its own
order, so those legs are real measurements sitting in the travel model's observed
pair table. Any re-ordering invents legs nobody has driven, and those fall back
to the haversine estimator, whose median per-leg error is 19.6% with a p90 of
55%. The median share of legs our order has to estimate is **42.6%**; for
OptimoRoute's own order it is **7.3%**. A sequencer minimising a noisy estimate
will systematically pick the legs the estimate happens to understate.

So the scorecard reports a **uniform-model control**: both orders timed with the
estimator alone, neither side credited for having its legs already measured.
Under that control the ratio moves to **0.92 and 0.90**, and the win narrows to
22 of 24 and 21 of 24 route-days.

An 8-10% drive-time saving is plausible and worth chasing. It is not proven here,
because the sequencer is still being scored on the same estimator it optimises
against. Proving it needs a real distance matrix for the stop pairs the sequencer
wants to use, which is a network call and therefore out of scope for this stage.
**Do not put the 13% figure in front of the owner. The defensible claim today is
"8-10% under a conservative control, pending a real matrix".**

---

## Data problems that affect a fair backtest

| Issue | Size | Effect |
|---|---|---|
| Single Jobber snapshot, so post-cutoff moves are invisible | 11 of 2,577 stops, 0.4% | Slightly flatters every policy |
| Travel estimator error on unobserved legs | 19.6% median per leg, 42.6% of our legs | Flatters any re-ordering; handled by the uniform-model control |
| OptimoRoute driver is not always who worked the route | 17 stops on 2026-08-28 | Handled by keying route-days off the completion stamp |
| Ghost OptimoRoute orders with no Jobber visit | 2 and 5 | Counted, excluded from scoring |
| Late bookings after the Friday cutoff | 55 and 54, about 9% | Held out of the due set, reported separately |
| History depth | 7 days before week one, 12 before week two | Learned policies are still improving; not a ceiling |
| One visit completed in the week before its own golden week | 1, week two | Creates a single out-of-week route-day, visible as `offWeekPlacements` |

None of these blocks the backtest. The estimator bias is the only one that
changes how a result should be stated, and the uniform-model control handles it.

---

## Adding a policy

Drop a module in `scripts/policies/`:

```js
export const name = 'my-policy';
export const description = 'One line for the scorecard header.';
export const usesOracle = false;

export function propose(snap) {
  return {
    assignments: snap.due.map((v) => ({ key: v.key, tech: '...', date: '2026-08-26' })),
    notes: { anythingYouWantOnTheScorecard: true },
  };
}
```

It is picked up automatically by `--all` and by `--policy=my-policy`. Place every
due visit: an unplaced visit is a drop and fails a gate. Read `snap.history`
freely, it is already cut at the week's Monday. Do not read `snap.actual` unless
the policy is an oracle and says so.
