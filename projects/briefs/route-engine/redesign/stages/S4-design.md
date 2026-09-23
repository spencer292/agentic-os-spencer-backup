# S4 — The design, derived from what ran

Written 2026-09-18 from stages S1–S3 and the S5 baselines. Nothing here is carried over from the old rulebook unless the data re-derived it. Numbers cite the stage files.

## 1. What the data says the business actually is

| Fact | Measured | Source |
|---|---|---|
| Field executes the board it is given | 97.2% same day, 98.5% same tech across 2,577 planned stops | S2 |
| Planned clock times are noise | median arrival error 38 min, p10–p90 ±130 min, every driver | S2 |
| Tech ownership is settled | 83% tech hold per customer; a static tech map reproduces 87–90% of a golden week | S3a, S5 |
| Weekday is NOT settled | 67% weekday hold; only 32.5% of jobs stable on tech+weekday; Cory 4% | S3a |
| The office runs one cadence | booked next-visit is 14 days for every trigger (catch, miss, low, high, none); delivered TMCP gap median 7 days, 80% ≤10 | S3b |
| Demand fits the week, days do not | weekly-after-any-activity = 199 h against 200 h, but 11 of 25 route-days over 8 h | S3b |
| Nobody re-sizes the master | 46% of active jobs unsatisfied against their own Next Action; 15% hard overdue, median 22 d | S3b |
| Late bookings are structural | ~9% of a week's stops did not exist on the Friday before | S5 |
| OptimoRoute over-prices drive or service | planned drive exceeds stamp residual by ~20% both golden weeks | S2 |

The conclusion the old design missed: **the business has a master TERRITORY, not a master ROUTE.** Customers belong to a tech. They do not belong to a weekday, and the field never ran them that way. Every attempt to pin weekday per customer fought the field and lost.

## 2. The model: three layers, each changed by a different clock

### Layer 1 — Book of business (changes on an event, never on a schedule)

Every customer → exactly one **owner tech**. Derived from S3a: 345 stable + 74 clean handovers + neighbour-vote for the rest, then the seams adjudicated once by Spencer (Buckley/Bonney Lake/Sumner → Robert; Kent North/Maple Valley → Cory; the two exact ties 98059 and 98092; the 51 island customers; Snoqualmie Valley → Tavis Friday). After sign-off it is written to the Jobber job as a custom field `Route Owner` and to `visitSchedule.assignedTo`, and the recurring series is rewritten once so every future visit carries it. It changes only by: a handover (dated), a hire (new book seeded from the edges of the two fullest), or a seam decision. **No script ever derives ownership on the fly again.** Ownership lives on the customer record, where Rollins keeps it.

**Float:** Cory is salaried, runs 31 h against the others' 40–50, holds only 10 stable customers, and covered Luke's entire Friday on 08-28. The design names that explicitly: one tech is the float, his book is the lightest by design, and he is the first call for a sick day or an overflow day. That is a decision for Spencer, not a derivation, but the data already runs it.

### Layer 2 — Due window (changes after every visit)

Each job carries a state machine fed by the tech's visit note. The trigger set the field actually honours (S3b, per-visit sample): **miss, catch, or any activity → active; none → quiet.** The policy that fits 200 h and reproduces what already runs (P2):

| State | Product | Next visit due | Window |
|---|---|---|---|
| Active | TMCP | +7 days | day 5 to day 9 |
| Quiet | TMCP | +1 month, same ordinal weekday | day 26 to day 35 |
| Series | Quick Fix | +7 days, 5 visits | day 5 to day 9; after visit 5 with activity → **sales flag, never a 6th** |
| New | any | visit 1 as sold (human) | fixed |

The due window, not a date, is the demand. A window is what lets the planner choose the day. The window is computed the moment the note lands, from the per-visit fields, and stored on the job (`Next Due From`, `Next Due To`). The job-level "Latest Activity" snapshot is no longer the input; the visit note is.

### Layer 3 — The week (solved every Friday, adjusted mid-week)

Friday 12:00 PT, for each tech: take every visit whose window intersects next Mon–Fri. Assign each to a day by solving, per tech, with these costs in order of weight:

1. **Hard:** owner tech only. Mon–Fri only. Frozen days untouched.
2. **Capacity:** day hours = Σ (that day-zone's measured cycle time × stops). Penalty rises steeply past 8.0 h, hard wall at 9.5 h. Cycle time is per tech per day-zone from the last 8 weeks of FleetSharp (interim: completion stamps, S1 route-day-drive).
3. **Compactness:** each tech's book is pre-clustered into 5 **day-zones** (k-medoids on coordinates, re-fit monthly). A stop pays a penalty for landing outside its home zone's day, proportional to distance from the zone medoid. This is what makes days tight without pinning a customer to a weekday for life.
4. **Window position:** a visit at the end of its window outranks one at the start. Nothing leaves its window; if a tech's week cannot hold all in-window visits under the hard wall, the overflow list goes to Spencer with the float as the proposed taker. Infeasibility is a report, never a silent long day.
5. **Weekday drift (soft, small):** prefer the weekday of the last visit. Small weight, because the field runs at 67% and the S5 baseline shows a hard pin costs 25–30% day mismatch for no capacity gain.

Output: per tech per day, a stop set. **OptimoRoute sequences each day** with driver lock, date lock, balancing OFF, uniform priority, `UPDATE` for existing orders, `CREATE` for new, never `SYNC`. The local sequencer in S5 is for backtests and shadow only; its 13% drive "win" is estimator noise (S5 note 1) and is not claimed.

**Mid-week adds (the 9%):** a new booking or a note that lands after Friday goes to an add queue. Each morning before 13:00 the queue is placed into the unfrozen day of the owner's week with the lowest zone-distance penalty and remaining capacity; if none fits, next week, and the customer is told next week at intake. The planner never re-solves a whole week for one add.

## 3. What is written where, and by whom

| Item | System of record | Written by | When |
|---|---|---|---|
| Owner tech, route zone | Jobber job custom fields + `visitSchedule.assignedTo` | one-time cutover script, then seam/handover events only | on event |
| Visit state, due window | Jobber job custom fields (`Next Due From/To`, `State`) | note processor, after each completed visit | per visit |
| Day per visit | Jobber visit `startAt` | week planner (Friday) and add-queue (daily), through ONE guarded writer | Friday + daily ≤13:00 |
| Sequence + ETA | OptimoRoute | OptimoRoute planning per day | after day assignment |
| Arrival window text | Jobber (3-h window) | existing sweep | unchanged |
| Actual on-site / drive / span | FleetSharp | pull nightly | feeds cycle times |

Rules for the one writer, all inherited from the S6-verified defect list: refetch before every write and diff against the approved snapshot; evaluate the freeze per write, Pacific calendar-aware; per-visit before/after in the ledger; verify after write; a partial run stays partial and exits non-zero; ceiling preflighted, not tripped mid-batch. Approval is an explicit go on the reviewed week; the add-queue is the one standing daily writer and it writes only unfrozen days of the current week.

## 4. Feedback loops (this is what the big operators have and we did not)

| Loop | Cadence | Input | Output |
|---|---|---|---|
| Cycle time per tech per day-zone | weekly | FleetSharp trips/stops (interim: stamps) | replaces the directed 12/15-min service numbers |
| Day-zones per tech | monthly | last 8 weeks of stop coordinates | re-fit medoids; a zone that drifts >1 km is reported |
| Capacity meter | weekly | planned vs FleetSharp hours per route-day | over-8-h streaks per tech; the hiring signal |
| Overdue meter | daily | due windows vs schedule | count of visits past window end, by tech |
| Seam report | monthly | customers within 1.5 km of another owner's | proposals only; Spencer decides |

## 5. What the backtest must show (policy `week-solve` in S5)

Against golden weeks 08-24 and 08-31, inputs as of the Friday before:

- Same tech ≥ 95% (owner map from data before the week, no lookahead).
- Every visit placed inside its due window; zero weekend; zero drops.
- Hours per route-day within ±10% of what the field delivered, **and** no day over 9.5 h at measured cycle time.
- Compactness: total route time per day (via `travel.mjs` on the same stops) within 5% of the OptimoRoute route the field drove.
- Same day: reported, not gated. The field's own day choice was "wherever there was room"; matching it above ~80% would mean copying its imbalance.
- Late bookings: reported separately as the add-queue load.

## 6. Decisions this design needs from Spencer

1. Sign the owner map after the five seams in S3a are adjudicated.
2. Confirm Cory as the float, or name another.
3. Accept that weekday is a preference, not a promise, for active customers. (Quiet monthly customers keep the ordinal weekday.)
4. The hard wall: 9.5 h at measured pace, or a different number.
5. Whether the add-queue may write unfrozen days daily without a go, or waits for one.
