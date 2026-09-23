# Review brief: Got Moles route-engine REDESIGN (design + backtest)

You are an independent senior reviewer: vehicle routing / field-service scheduling plus integration engineering. You have NO file or shell access; everything you may cite is in this bundle, with line numbers. Cite `bundle file:line`. Never invent a file. Budget: about 45 minutes. Be willing to say the design is wrong. No praise, no summary of what you read. US English.

## Context
Got Moles: mole-control company, Western Washington. Five field techs, ~600 customer visits a week, ~120 stops a weekday, Mon–Fri. Jobber is the CRM and system of record for visits; OptimoRoute sequences days; FleetSharp (Linxup) GPS on the trucks is being connected. Customer arrival-window texts leave Jobber at 14:00 PT the day before, so a day freezes then.

Ten weeks of a previous pipeline produced no plan the owner would run. Your predecessor review (Codex, 2026-09-18, on the OLD pipeline) found competing scheduling authorities, no approval-protected state, conflicting inputs, and 21 code defects. The owner then said: ignore the old rulebook, derive a new system from the data, backtest it against weeks that ran well, and get it reviewed.

The bundle contains, in order: S4 the design; S2/S3a/S3b the measured findings it rests on; S5 the backtest harness description and results including the design's own policy (`week-solve`); the harness source and policies; the travel model notes. Data files are summarized in the stage docs, not included.

## Owner-fixed facts (not up for review)
Five techs and their homes; Mon–Fri; the 14:00 D-1 freeze; products as sold (TMCP monthly, weekly when active, Quick Fix = 5 weekly visits then a sales decision); the owner does no field work beyond one Tuesday route. Zero automated writes until proven.

## What I want, in this structure

### A. Is the model right? (one page)
S4 claims the business has a master TERRITORY (customer → tech) not a master ROUTE (customer → tech + weekday), and that weekday should be solved weekly inside a due window under capacity and compactness costs. Argue for or against from the evidence in S2/S3/S5. Name what the model gets wrong, what it leaves undefined, and what a Rollins/Terminix-style operation would do differently at this size.

### B. The week-solve policy (concrete)
For each of: owner map without lookahead, day-zones (k-medoids, k=5), due windows, the cost function and its weights, the hard wall, overflow handling, the add-queue — say whether it is sound, what input it silently depends on, and one concrete case where it produces a bad week. Cite the harness code where the implementation deviates from S4.

### C. The backtest
Is the harness a fair test? Check: as-of-Friday reconstruction, the join key, lookahead leaks, the scorecard gates in S4 §5, the sequencer comparison (the travel estimator covers only ~12% of pairs; whole-route error ~2%, per-leg ~20%). Say whether the reported scores support the claims, and what test is missing before a live shadow run.

### D. Cadence policy P2 and capacity
S3b says weekly-after-any-activity fits 200 h with 11 route-days over 8 h. Is that arithmetic trustworthy given the cycle-time method (span/stops from completion stamps)? What changes when FleetSharp replaces stamps? Is the float-tech idea sound?

### E. What would you build first, and what would you refuse to build
Ranked by value/effort, at most eight items, each one sentence with the reason. Include what to keep from the old pipeline, if anything.

### F. Questions only the owner can answer
Max 6, one sentence each, with why it matters.

Rules: cite `file:line` from the bundle for every claim about the design or code; quote at most 3 lines per finding; mark anything you could not verify from the bundle as SUSPECTED.


# ===== BUNDLE =====


## [1] stages/S4-design.md

```
     1	# S4 — The design, derived from what ran
     2	
     3	Written 2026-09-18 from stages S1–S3 and the S5 baselines. Nothing here is carried over from the old rulebook unless the data re-derived it. Numbers cite the stage files.
     4	
     5	## 1. What the data says the business actually is
     6	
     7	| Fact | Measured | Source |
     8	|---|---|---|
     9	| Field executes the board it is given | 97.2% same day, 98.5% same tech across 2,577 planned stops | S2 |
    10	| Planned clock times are noise | median arrival error 38 min, p10–p90 ±130 min, every driver | S2 |
    11	| Tech ownership is settled | 83% tech hold per customer; a static tech map reproduces 87–90% of a golden week | S3a, S5 |
    12	| Weekday is NOT settled | 67% weekday hold; only 32.5% of jobs stable on tech+weekday; Cory 4% | S3a |
    13	| The office runs one cadence | booked next-visit is 14 days for every trigger (catch, miss, low, high, none); delivered TMCP gap median 7 days, 80% ≤10 | S3b |
    14	| Demand fits the week, days do not | weekly-after-any-activity = 199 h against 200 h, but 11 of 25 route-days over 8 h | S3b |
    15	| Nobody re-sizes the master | 46% of active jobs unsatisfied against their own Next Action; 15% hard overdue, median 22 d | S3b |
    16	| Late bookings are structural | ~9% of a week's stops did not exist on the Friday before | S5 |
    17	| OptimoRoute over-prices drive or service | planned drive exceeds stamp residual by ~20% both golden weeks | S2 |
    18	
    19	The conclusion the old design missed: **the business has a master TERRITORY, not a master ROUTE.** Customers belong to a tech. They do not belong to a weekday, and the field never ran them that way. Every attempt to pin weekday per customer fought the field and lost.
    20	
    21	## 2. The model: three layers, each changed by a different clock
    22	
    23	### Layer 1 — Book of business (changes on an event, never on a schedule)
    24	
    25	Every customer → exactly one **owner tech**. Derived from S3a: 345 stable + 74 clean handovers + neighbour-vote for the rest, then the seams adjudicated once by Spencer (Buckley/Bonney Lake/Sumner → Robert; Kent North/Maple Valley → Cory; the two exact ties 98059 and 98092; the 51 island customers; Snoqualmie Valley → Tavis Friday). After sign-off it is written to the Jobber job as a custom field `Route Owner` and to `visitSchedule.assignedTo`, and the recurring series is rewritten once so every future visit carries it. It changes only by: a handover (dated), a hire (new book seeded from the edges of the two fullest), or a seam decision. **No script ever derives ownership on the fly again.** Ownership lives on the customer record, where Rollins keeps it.
    26	
    27	**Float:** Cory is salaried, runs 31 h against the others' 40–50, holds only 10 stable customers, and covered Luke's entire Friday on 08-28. The design names that explicitly: one tech is the float, his book is the lightest by design, and he is the first call for a sick day or an overflow day. That is a decision for Spencer, not a derivation, but the data already runs it.
    28	
    29	### Layer 2 — Due window (changes after every visit)
    30	
    31	Each job carries a state machine fed by the tech's visit note. The trigger set the field actually honours (S3b, per-visit sample): **miss, catch, or any activity → active; none → quiet.** The policy that fits 200 h and reproduces what already runs (P2):
    32	
    33	| State | Product | Next visit due | Window |
    34	|---|---|---|---|
    35	| Active | TMCP | +7 days | day 5 to day 9 |
    36	| Quiet | TMCP | +1 month, same ordinal weekday | day 26 to day 35 |
    37	| Series | Quick Fix | +7 days, 5 visits | day 5 to day 9; after visit 5 with activity → **sales flag, never a 6th** |
    38	| New | any | visit 1 as sold (human) | fixed |
    39	
    40	The due window, not a date, is the demand. A window is what lets the planner choose the day. The window is computed the moment the note lands, from the per-visit fields, and stored on the job (`Next Due From`, `Next Due To`). The job-level "Latest Activity" snapshot is no longer the input; the visit note is.
    41	
    42	### Layer 3 — The week (solved every Friday, adjusted mid-week)
    43	
    44	Friday 12:00 PT, for each tech: take every visit whose window intersects next Mon–Fri. Assign each to a day by solving, per tech, with these costs in order of weight:
    45	
    46	1. **Hard:** owner tech only. Mon–Fri only. Frozen days untouched.
    47	2. **Capacity:** day hours = Σ (that day-zone's measured cycle time × stops). Penalty rises steeply past 8.0 h, hard wall at 9.5 h. Cycle time is per tech per day-zone from the last 8 weeks of FleetSharp (interim: completion stamps, S1 route-day-drive).
    48	3. **Compactness:** each tech's book is pre-clustered into 5 **day-zones** (k-medoids on coordinates, re-fit monthly). A stop pays a penalty for landing outside its home zone's day, proportional to distance from the zone medoid. This is what makes days tight without pinning a customer to a weekday for life.
    49	4. **Window position:** a visit at the end of its window outranks one at the start. Nothing leaves its window; if a tech's week cannot hold all in-window visits under the hard wall, the overflow list goes to Spencer with the float as the proposed taker. Infeasibility is a report, never a silent long day.
    50	5. **Weekday drift (soft, small):** prefer the weekday of the last visit. Small weight, because the field runs at 67% and the S5 baseline shows a hard pin costs 25–30% day mismatch for no capacity gain.
    51	
    52	Output: per tech per day, a stop set. **OptimoRoute sequences each day** with driver lock, date lock, balancing OFF, uniform priority, `UPDATE` for existing orders, `CREATE` for new, never `SYNC`. The local sequencer in S5 is for backtests and shadow only; its 13% drive "win" is estimator noise (S5 note 1) and is not claimed.
    53	
    54	**Mid-week adds (the 9%):** a new booking or a note that lands after Friday goes to an add queue. Each morning before 13:00 the queue is placed into the unfrozen day of the owner's week with the lowest zone-distance penalty and remaining capacity; if none fits, next week, and the customer is told next week at intake. The planner never re-solves a whole week for one add.
    55	
    56	## 3. What is written where, and by whom
    57	
    58	| Item | System of record | Written by | When |
    59	|---|---|---|---|
    60	| Owner tech, route zone | Jobber job custom fields + `visitSchedule.assignedTo` | one-time cutover script, then seam/handover events only | on event |
    61	| Visit state, due window | Jobber job custom fields (`Next Due From/To`, `State`) | note processor, after each completed visit | per visit |
    62	| Day per visit | Jobber visit `startAt` | week planner (Friday) and add-queue (daily), through ONE guarded writer | Friday + daily ≤13:00 |
    63	| Sequence + ETA | OptimoRoute | OptimoRoute planning per day | after day assignment |
    64	| Arrival window text | Jobber (3-h window) | existing sweep | unchanged |
    65	| Actual on-site / drive / span | FleetSharp | pull nightly | feeds cycle times |
    66	
    67	Rules for the one writer, all inherited from the S6-verified defect list: refetch before every write and diff against the approved snapshot; evaluate the freeze per write, Pacific calendar-aware; per-visit before/after in the ledger; verify after write; a partial run stays partial and exits non-zero; ceiling preflighted, not tripped mid-batch. Approval is an explicit go on the reviewed week; the add-queue is the one standing daily writer and it writes only unfrozen days of the current week.
    68	
    69	## 4. Feedback loops (this is what the big operators have and we did not)
    70	
    71	| Loop | Cadence | Input | Output |
    72	|---|---|---|---|
    73	| Cycle time per tech per day-zone | weekly | FleetSharp trips/stops (interim: stamps) | replaces the directed 12/15-min service numbers |
    74	| Day-zones per tech | monthly | last 8 weeks of stop coordinates | re-fit medoids; a zone that drifts >1 km is reported |
    75	| Capacity meter | weekly | planned vs FleetSharp hours per route-day | over-8-h streaks per tech; the hiring signal |
    76	| Overdue meter | daily | due windows vs schedule | count of visits past window end, by tech |
    77	| Seam report | monthly | customers within 1.5 km of another owner's | proposals only; Spencer decides |
    78	
    79	## 5. What the backtest must show (policy `week-solve` in S5)
    80	
    81	Against golden weeks 08-24 and 08-31, inputs as of the Friday before:
    82	
    83	- Same tech ≥ 95% (owner map from data before the week, no lookahead).
    84	- Every visit placed inside its due window; zero weekend; zero drops.
    85	- Hours per route-day within ±10% of what the field delivered, **and** no day over 9.5 h at measured cycle time.
    86	- Compactness: total route time per day (via `travel.mjs` on the same stops) within 5% of the OptimoRoute route the field drove.
    87	- Same day: reported, not gated. The field's own day choice was "wherever there was room"; matching it above ~80% would mean copying its imbalance.
    88	- Late bookings: reported separately as the add-queue load.
    89	
    90	## 6. Decisions this design needs from Spencer
    91	
    92	1. Sign the owner map after the five seams in S3a are adjudicated.
    93	2. Confirm Cory as the float, or name another.
    94	3. Accept that weekday is a preference, not a promise, for active customers. (Quiet monthly customers keep the ordinal weekday.)
    95	4. The hard wall: 9.5 h at measured pace, or a different number.
    96	5. Whether the add-queue may write unfrozen days daily without a go, or waits for one.
```

## [2] stages/S2-plan-vs-actual.md

```
     1	# S2 — Plan versus actual
     2	
     3	Ground truth for the route-engine redesign, interim until FleetSharp GPS arrives. The
     4	OptimoRoute plan as it was held for each day, joined stop-by-stop to the Jobber completion
     5	stamps for the same window.
     6	
     7	- Join: `scripts/join-plan-actual.mjs` → `data/plan-vs-actual.json` (1.5 MB)
     8	- Log: `data/join-plan-actual.log`
     9	- Window: 2026-08-17 .. 2026-09-17, 24 route-day files, 113 planned route-days, 2,577 planned stops, 2,793 Jobber completions
    10	
    11	## The join key holds
    12	
    13	OptimoRoute's `orderNo` is `<jobNumber>-<visitNumericId>`, and the numeric id is the tail of
    14	the base64-decoded Jobber visit gid (`Z2lkOi8vSm9iYmVyL1Zpc2l0LzIyOTE5MTQzNzY=` →
    15	`gid://Jobber/Visit/2291914376` → `5602-2291914376`). Every one of the 2,793 completions
    16	produced a key, and 2,548 of 2,577 planned stops (98.9%) resolved to one. No planned order
    17	appeared on two different days, so the key is unique on both sides and the remaining 29 are
    18	genuine never-completed stops, not join failures.
    19	
    20	## What the plan gets right, and what it does not
    21	
    22	**The day and the tech are close to true. The clock is not.** 97.2% of planned stops were
    23	completed the same day by the same tech. But of those matched stops, only 42% landed within
    24	30 minutes of their planned slot, and the median absolute error is 38 minutes.
    25	
    26	| Measure | Value |
    27	|---|---:|
    28	| Matched (same day, same tech) | 2,506 of 2,577 — 97.2% |
    29	| Moved to another day | 11 — 0.4% |
    30	| Completed by another tech | 31 — 1.2% |
    31	| Ghost (never completed in window) | 29 — 1.1% |
    32	| Off-map completions (no planned stop anywhere) | 245 |
    33	| Arrival delta, median | −5.6 min |
    34	| Arrival delta, absolute median / p90 | 37.8 / 104.4 min |
    35	| Stops within ±15 / ±30 / ±60 min of plan | 21% / 42% / 71% |
    36	
    37	Arrival delta is the completion stamp minus the planned **departure** (planned arrival plus
    38	service), because a Jobber stamp is a completion, not an arrival. Measured against planned
    39	arrival instead, the median is +8.7 min, which is just the service time reappearing.
    40	
    41	## Weekly
    42	
    43	| Week | Route-days | Stops planned | Matched | Moved day | Moved tech | Ghosts | Off-map | Completed | Evening stamps |
    44	|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
    45	| 2026-08-17 | 26 | 570 | 97.7% | 1.1% | 0.4% | 5 | 44 | 609 | 4 |
    46	| 2026-08-24 | 25 | 576 | 95.5% | 0.3% | 3.5% | 4 | 32 | 604 | 9 |
    47	| 2026-08-31 | 24 | 553 | 98.4% | 0.2% | 0.4% | 6 | 36 | 583 | 0 |
    48	| 2026-09-07 | 20 | 454 | 97.6% | 0.2% | 1.1% | 5 | 27 | 476 | 1 |
    49	| 2026-09-14 | 20 | 424 | 97.2% | 0.2% | 0.5% | 9 | 106 | 521 | 1 |
    50	
    51	Three of these numbers are artifacts, not operations:
    52	
    53	- **The 106 off-map in the week of 09-14 is a capture defect.** The plan snapshot for
    54	  2026-09-14 holds 52 stops across 5 routes where every other Monday holds 119 to 130. The
    55	  history pull ran on 09-18, by which time most of that day's orders were gone from
    56	  OptimoRoute. Eighty of the 106 sit on that one date. Exclude it and off-map runs 5 to 13 a
    57	  day, median 8, roughly 6% of completed volume.
    58	- **The 3.5% moved-tech in the week of 08-24 is one swap.** On Friday 08-28 Cory Ventura
    59	  worked all 20 of Luke LaVergne's planned stops. Across the whole window that leaves 11
    60	  genuine tech changes, under 0.5%.
    61	- **2026-09-07 is Labor Day** and 2026-08-28 and 2026-09-04 carry 4 planned routes, not 5.
    62	
    63	## Golden week 2026-08-24
    64	
    65	| Date | Tech | Stops plan/done | Planned span | Actual span | Δ span | Planned drive | Stamp drive | Ghost | Unplanned in | Evening |
    66	|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
    67	| 2026-08-24 | Alias Franks | 27/27 | 539.9 | 553 | +13.1 | 134.9 | 163 | 0 | 0 | 0 |
    68	| 2026-08-24 | Cory Ventura | 30/30 | 502.2 | 457.3 | −44.9 | 130.2 | 85.3 | 1 | 1 | 0 |
    69	| 2026-08-24 | Luke LaVergne | 23/23 | 592.3 | 486.5 | −105.8 | 232.3 | 141.5 | 0 | 0 | 0 |
    70	| 2026-08-24 | Robert Norton | 23/22 | 465.4 | 519.4 | +54 | 120.4 | 204.4 | 1 | 0 | 0 |
    71	| 2026-08-24 | Tavis Alexander | 27/26 | 530 | 463.9 | −66.1 | 125 | 73.9 | 0 | 0 | 0 |
    72	| 2026-08-25 | Alias Franks | 19/22 | 437.2 | 828.8 | +391.6 | 137.2 | 243.2 | 0 | 3 | 1 |
    73	| 2026-08-25 | Cory Ventura | 23/23 | 434.8 | 334.3 | −100.5 | 158.8 | 70.3 | 0 | 0 | 0 |
    74	| 2026-08-25 | Luke LaVergne | 17/17 | 497.6 | 479 | −18.6 | 227.6 | 97.7 | 0 | 0 | 0 |
    75	| 2026-08-25 | Robert Norton | 27/30 | 552.1 | 862.3 | +310.2 | 147.1 | 7.6 | 0 | 3 | 1 |
    76	| 2026-08-25 | Tavis Alexander | 28/33 | 653.7 | 799.7 | +146 | 188.7 | 40.4 | 0 | 5 | 1 |
    77	| 2026-08-26 | Alias Franks | 22/25 | 498.4 | 741.1 | +242.7 | 168.4 | 336.1 | 0 | 3 | 4 |
    78	| 2026-08-26 | Cory Ventura | 20/20 | 326.5 | 254.3 | −72.2 | 86.5 | 26.3 | 0 | 0 | 0 |
    79	| 2026-08-26 | Luke LaVergne | 14/14 | 437.1 | 396.6 | −40.5 | 227.1 | 186.6 | 0 | 0 | 0 |
    80	| 2026-08-26 | Robert Norton | 25/26 | 476.4 | 445.8 | −30.6 | 101.4 | 55.8 | 0 | 1 | 0 |
    81	| 2026-08-26 | Tavis Alexander | 32/33 | 568.3 | 442.5 | −125.8 | 120.3 | −4.8 | 0 | 1 | 0 |
    82	| 2026-08-27 | Alias Franks | 24/25 | 504.9 | 651.8 | +146.9 | 144.8 | 276.8 | 0 | 1 | 0 |
    83	| 2026-08-27 | Cory Ventura | 29/33 | 487.7 | 509 | +21.3 | 139.7 | 89 | 0 | 4 | 0 |
    84	| 2026-08-27 | Luke LaVergne | 20/21 | 494.6 | 565.3 | +70.7 | 194.6 | 141 | 1 | 2 | 0 |
    85	| 2026-08-27 | Robert Norton | 23/25 | 492.6 | 595.3 | +102.7 | 132.6 | 220.3 | 0 | 2 | 0 |
    86	| 2026-08-27 | Tavis Alexander | 26/26 | 530.2 | 457.9 | −72.3 | 140.2 | 67.9 | 1 | 2 | 0 |
    87	| 2026-08-28 | Alias Franks | 28/29 | 556.6 | 660.6 | +104 | 121.6 | 225.6 | 0 | 1 | 2 |
    88	| 2026-08-28 | Cory Ventura | 0/21 | — | 290.4 | — | — | 50.4 | — | — | 0 |
    89	| 2026-08-28 | Luke LaVergne | 20/0 | 426.9 | — | — | 126.9 | — | — | — | — |
    90	| 2026-08-28 | Robert Norton | 20/22 | 384.9 | 429 | +44.1 | 84.9 | 84 | 0 | 2 | 0 |
    91	| 2026-08-28 | Tavis Alexander | 29/31 | 628.1 | 555.2 | −72.9 | 193.1 | 90.2 | 0 | 2 | 0 |
    92	
    93	Week totals: planned span 12,018 min against actual 12,779, planned drive 3,584 against
    94	stamp-derived 2,973.
    95	
    96	## Golden week 2026-08-31
    97	
    98	| Date | Tech | Stops plan/done | Planned span | Actual span | Δ span | Planned drive | Stamp drive | Ghost | Unplanned in | Evening |
    99	|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
   100	| 2026-08-31 | Alias Franks | 25/25 | 497.9 | 467.2 | −30.7 | 122.9 | 107.2 | 0 | 0 | 0 |
   101	| 2026-08-31 | Cory Ventura | 27/26 | 478.3 | 359.3 | −119 | 118.3 | 23.3 | 1 | 0 | 0 |
   102	| 2026-08-31 | Luke LaVergne | 18/20 | 491.2 | 513.7 | +22.5 | 191.2 | 183.7 | 0 | 2 | 0 |
   103	| 2026-08-31 | Robert Norton | 21/21 | 428.5 | 357.4 | −71.1 | 113.5 | 57.4 | 0 | 0 | 0 |
   104	| 2026-08-31 | Tavis Alexander | 28/29 | 565.7 | 457 | −108.7 | 130.7 | 22 | 0 | 1 | 0 |
   105	| 2026-09-01 | Alias Franks | 28/27 | 652.5 | 587.4 | −65.1 | 172.5 | 152.4 | 0 | 0 | 0 |
   106	| 2026-09-01 | Cory Ventura | 22/22 | 431.3 | 383.7 | −47.6 | 143.3 | 107.7 | 0 | 0 | 0 |
   107	| 2026-09-01 | Luke LaVergne | 25/24 | 634.2 | 555.5 | −78.7 | 259.2 | 110.7 | 1 | 0 | 0 |
   108	| 2026-09-01 | Robert Norton | 25/25 | 524.5 | 513.5 | −11 | 149.5 | 153.5 | 0 | 0 | 0 |
   109	| 2026-09-01 | Tavis Alexander | 30/32 | 628.9 | 596.2 | −32.7 | 163.9 | 71.1 | 1 | 3 | 0 |
   110	| 2026-09-02 | Alias Franks | 21/22 | 517.3 | 604 | +86.7 | 172.3 | 259 | 0 | 1 | 0 |
   111	| 2026-09-02 | Cory Ventura | 23/29 | 358.1 | 383.5 | +25.4 | 82.1 | −12.5 | 0 | 6 | 0 |
   112	| 2026-09-02 | Luke LaVergne | 15/17 | 459.3 | 532 | +72.7 | 219.3 | 232 | 1 | 3 | 0 |
   113	| 2026-09-02 | Robert Norton | 22/22 | 450.5 | 448.9 | −1.6 | 120.5 | 133.9 | 0 | 0 | 0 |
   114	| 2026-09-02 | Tavis Alexander | 23/24 | 398.9 | 380.7 | −18.2 | 89.9 | 57.6 | 0 | 1 | 0 |
   115	| 2026-09-03 | Alias Franks | 21/21 | 471.5 | 493.1 | +21.6 | 156.5 | 193.1 | 0 | 0 | 0 |
   116	| 2026-09-03 | Cory Ventura | 22/24 | 364 | 374 | +10 | 100 | 86 | 0 | 2 | 0 |
   117	| 2026-09-03 | Luke LaVergne | 17/20 | 411.2 | 533.3 | +122.1 | 156.2 | 89.8 | 0 | 4 | 0 |
   118	| 2026-09-03 | Robert Norton | 25/26 | 512.9 | 515.9 | +3 | 122.9 | 125.9 | 0 | 1 | 0 |
   119	| 2026-09-03 | Tavis Alexander | 22/27 | 489.3 | 516.8 | +27.5 | 144.3 | 96.8 | 1 | 6 | 0 |
   120	| 2026-09-04 | Alias Franks | 26/25 | 545.7 | 481.3 | −64.4 | 155.7 | 121.3 | 0 | 0 | 0 |
   121	| 2026-09-04 | Luke LaVergne | 22/23 | 480.1 | 466.2 | −13.9 | 135.1 | 136.2 | 0 | 1 | 0 |
   122	| 2026-09-04 | Robert Norton | 25/27 | 504 | 615.5 | +111.5 | 129 | 180.5 | 1 | 3 | 0 |
   123	| 2026-09-04 | Tavis Alexander | 20/25 | 460.4 | 517.4 | +57 | 160.4 | 112.4 | 0 | 5 | 0 |
   124	
   125	Week totals: planned span 11,756 min against actual 11,654, planned drive 3,509 against
   126	stamp-derived 2,801.
   127	
   128	**Read the drive columns with care.** Planned drive is the sum of OptimoRoute's inter-stop
   129	legs, with the first stop's inbound leg excluded because it comes from an unknown origin.
   130	Stamp drive is not a measurement: `route-day-drive` derives it as span minus assumed service
   131	minus any gap over 90 minutes, so it inherits the directed service times and goes negative
   132	whenever two stops share an address. Planned drive exceeds it by about 20% in both weeks,
   133	which is consistent either with OptimoRoute overpricing travel or with real service running
   134	longer than the directed minutes. Nothing in this data separates the two. That separation is
   135	exactly what FleetSharp GPS is for.
   136	
   137	## Arrival delta by driver
   138	
   139	Delta is the completion stamp minus planned departure. A negative median means the tech
   140	finishes ahead of the planned slot.
   141	
   142	| Driver | Matched stops | Median | p10 | p90 | Absolute median | Within ±30 min |
   143	|---|---:|---:|---:|---:|---:|---:|
   144	| Alias Franks | 536 | +20.8 | −26.5 | +120.0 | 31.1 | 49% |
   145	| Cory Ventura | 501 | +11.8 | −51.3 | +83.0 | 37.2 | 40% |
   146	| Luke LaVergne | 397 | −34.5 | −80.5 | +55.8 | 44.5 | 27% |
   147	| Robert Norton | 500 | −4.8 | −58.1 | +70.3 | 29.6 | 51% |
   148	| Tavis Alexander | 572 | −31.0 | −103.1 | +37.0 | 43.3 | 38% |
   149	
   150	The spread matters more than the centre. Luke and Tavis run consistently ahead of the plan,
   151	Alias consistently behind, and the p10-to-p90 band is 128 to 146 minutes wide for every
   152	driver. A plan built on these timings cannot support a customer arrival window tighter than
   153	about two hours without GPS to tighten it.
   154	
   155	Route-day span error is unbiased but noisy: across 107 route-days with both sides (excluding
   156	09-14), the median span delta is +1.5 minutes, p10 −103 and p90 +113. Twenty-nine days ran
   157	more than an hour long, twenty-eight more than an hour short.
   158	
   159	## Worst 10 route-days by span overrun
   160	
   161	| Date | Tech | Plan span | Actual span | Δ | Stops plan/done | First plan→actual | Last plan→actual | Reason |
   162	|---|---|---:|---:|---:|---:|---|---|---|
   163	| 2026-08-25 | Alias Franks | 437.2 | 828.8 | +391.6 | 19/22 | 07:13 → 07:27 | 14:30 → 21:16 | one 21:16 stamp after a 241-minute gap, plus 3 unplanned stops; the field day ended mid-afternoon |
   164	| 2026-08-25 | Robert Norton | 552.1 | 862.3 | +310.2 | 27/30 | 07:15 → 07:05 | 16:27 → 21:28 | one 21:28 stamp after a 390-minute gap, plus 3 unplanned stops; evening admin, not work |
   165	| 2026-09-09 | Luke LaVergne | 538.9 | 800.8 | +261.9 | 17/16 | 07:31 → 07:18 | 16:30 → 20:39 | one 20:39 stamp after a 204-minute gap; a single late close-out |
   166	| 2026-09-14 | Luke LaVergne | 177.5 | 424.2 | +246.7 | 7/22 | 07:51 → 07:02 | 10:49 → 14:06 | plan capture defect — only 7 of 22 stops survived in the snapshot |
   167	| 2026-08-26 | Alias Franks | 498.4 | 741.1 | +242.7 | 22/25 | 07:05 → 07:29 | 15:23 → 19:51 | 4 evening stamps to 19:51 and 3 unplanned stops; a genuinely long day |
   168	| 2026-08-19 | Alias Franks | 499.7 | 739.1 | +239.4 | 22/27 | 06:56 → 07:17 | 15:16 → 19:36 | 3 evening stamps to 19:36 and 5 unplanned stops added to a 22-stop plan |
   169	| 2026-09-14 | Robert Norton | 186.5 | 415.7 | +229.2 | 9/22 | 07:36 → 07:35 | 10:43 → 14:31 | plan capture defect — 9 of 22 stops in the snapshot |
   170	| 2026-09-14 | Alias Franks | 248.9 | 471.9 | +223 | 13/28 | 07:17 → 07:28 | 11:26 → 15:20 | plan capture defect — 13 of 28 stops in the snapshot |
   171	| 2026-09-14 | Cory Ventura | 168.1 | 381.5 | +213.4 | 10/32 | 07:39 → 07:38 | 10:27 → 13:59 | plan capture defect — 10 of 32 stops in the snapshot |
   172	| 2026-09-14 | Tavis Alexander | 231.7 | 410.4 | +178.7 | 13/29 | 07:48 → 07:38 | 11:40 → 14:29 | plan capture defect — 13 of 29 stops in the snapshot |
   173	
   174	Five of the ten are the 09-14 capture defect. Of the five real ones, four are driven by a
   175	single evening stamp hours after the last field stop.
   176	
   177	## Evening stamps are admin, not work
   178	
   179	Only 15 stamps in the whole window land after 18:30, and 12 of them belong to Alias Franks.
   180	Three of those days sit in the worst-10 table purely because of them. Any span or utilisation
   181	figure must clip at 18:30 or it will read close-out paperwork as field time. The join carries
   182	`spanToLastDayStopMin` alongside `spanMin` for exactly this.
   183	
   184	## Ghosts cluster on the same customers
   185	
   186	Twenty-nine planned stops were never completed anywhere in the window, and they are not
   187	spread evenly. Becky Hohengarten (job #8261) was planned and dropped five separate times,
   188	Aaron Rutledge (#8465) three, Darren Mccullough (#8266) twice. Luke LaVergne carried five
   189	ghosts on 2026-09-15 alone. These read as problem jobs that keep getting re-scheduled and
   190	skipped rather than as router error, and they are worth a separate look against the cadence
   191	rules.
   192	
   193	## Carry into the redesign
   194	
   195	1. **Day and tech assignment is solid enough to backtest against.** 97.2% matched, and the
   196	   residual is 11 genuine tech changes and 11 day moves.
   197	2. **Planned clock times are not usable as a customer promise.** 58% of stops miss their
   198	   planned slot by more than half an hour.
   199	3. **Off-map work is real and steady at roughly 6% of daily volume**, 5 to 13 stops a day
   200	   once 09-14 is excluded. The engine has to plan with headroom for it, not treat it as noise.
   201	4. **Re-pull 2026-09-14** if that Monday is wanted as evidence. OptimoRoute history decays,
   202	   so any future plan snapshot has to be taken the same day it is held, not weeks later.
   203	5. **Drive time stays unresolved.** Plan says 20% more drive than the stamp residual leaves
   204	   room for, and stamps cannot tell drive from service. FleetSharp closes this, nothing else
   205	   here will.
```

## [3] stages/S3a-master-territory.md

```
     1	# S3a — The As-Built Master Route and the Territory That Actually Emerged
     2	
     3	**Findings only. No prescriptions, no rules proposed.**
     4	
     5	Derived 2026-09-18 from Jobber data alone. No rulebook was consulted while deriving:
     6	not `territories.json`, not `territory-grid*.json`, not `scheduling-rules.json`, not the
     7	territory rules in `CLAUDE.local.md`. The old files are read once, at the end, purely to
     8	say where the file and the field disagree.
     9	
    10	| Item | Value |
    11	|---|---|
    12	| Window | 2026-08-14 .. 2026-09-18 (5.14 weeks) |
    13	| Completed visits observed | 2,924 |
    14	| Actual throughput | 568.6 visits per week |
    15	| Jobs in scope | 1,063 (all geocoded, all assigned a route-day) |
    16	| Techs | 5 |
    17	| Route-days | 25 (5 techs x 5 weekdays), all populated |
    18	
    19	Scripts: `redesign/scripts/derive-master.mjs`, `redesign/scripts/derive-territory.mjs`.
    20	Outputs: `redesign/data/master-asbuilt.json`, `redesign/data/territory-asbuilt.json`,
    21	`redesign/data/territory-asbuilt.geojson`. Logs alongside them.
    22	
    23	---
    24	
    25	## 1. How much of the master route already exists
    26	
    27	A job is **STABLE** when at least 80% of its completed visits fell to the same tech *and*
    28	the same weekday. That set is the master route. It exists, but it is a minority of the book.
    29	
    30	| Class | Jobs | Share | Meaning |
    31	|---|---|---|---|
    32	| STABLE | 345 | 32.5% | Tech and weekday both settled. This is the master. |
    33	| DAY-FLIP | 291 | 27.4% | Tech settled, weekday wanders. |
    34	| SINGLE | 224 | 21.1% | Only one completed visit; nothing to confirm yet. |
    35	| BOTH-FLIP | 100 | 9.4% | Neither tech nor weekday settled. |
    36	| NONE | 66 | 6.2% | Future-only. All 66 were assigned by neighbour vote and marked INFERRED. |
    37	| TECH-FLIP | 37 | 3.5% | Weekday settled, tech wanders. |
    38	
    39	**428 jobs flip** (day, tech, or both). **224 more are unconfirmed singles.** Together that is
    40	**61% of the book with no settled place**. A further **200 customers sit in an overlap zone**,
    41	where their ten nearest settled neighbours do not agree on a tech; **51 of those are held by a
    42	tech other than the one that surrounds them**.
    43	
    44	A handover is not counted as a flip. A single sustained tech change, with at least two visits
    45	on the new tech afterwards, is recorded as a handover with its date. Seventy-four jobs changed
    46	hands that way inside the window, the largest block being **Alias Franks to Tavis Alexander, 28
    47	jobs, 19 of them on 2026-08-21**.
    48	
    49	### The finding that dominates everything else
    50	
    51	**Cory Ventura's book has no day structure at all.** Ten of his 223 jobs are STABLE — 4%. The
    52	other four techs run 34% to 48%.
    53	
    54	| Tech | Jobs | STABLE | Flipping | Single | Inferred |
    55	|---|---|---|---|---|---|
    56	| Alias Franks | 223 | 106 (48%) | 49 | 52 | 16 |
    57	| Robert Norton | 193 | 80 (41%) | 60 | 39 | 14 |
    58	| Tavis Alexander | 236 | 86 (36%) | 82 | 49 | 19 |
    59	| Luke LaVergne | 188 | 63 (34%) | 65 | 45 | 15 |
    60	| **Cory Ventura** | **223** | **10 (4%)** | **172** | **39** | **2** |
    61	
    62	Four of Cory's five route-days contain zero or one stable customer: Tuesday 1, Wednesday 3,
    63	Thursday 0, Friday 0. This is not a data artefact. Job #4515 Kelly Kunz in Kent was visited by
    64	Cory six times and landed on Friday, Friday, Thursday, Thursday, Wednesday, Monday. Job #4545
    65	Randy Stegmeier in Maple Valley got four visits on four different weekdays. His customers are
    66	being worked, on time, by the right person, on whatever day there is room.
    67	
    68	Cory also carries the second-largest book (223 jobs, 128.6 weekly-equivalent visits) at the
    69	lowest measured hours (31.4). His ground is dense, so he absorbs the overflow — and the price
    70	is that no customer of his can be told which day they are on.
    71	
    72	---
    73	
    74	## 2. Route-day load
    75	
    76	Weekly-equivalent visits are what each job actually consumed per week in the window. Hours use
    77	that route-day's own observed pace from `route-day-drive_2026-08-17_2026-09-17.json` (median
    78	on-site span divided by median stops), so a dense day and a spread day are not compared at one
    79	rate.
    80	
    81	| Tech | Day | Customers | Weekly-eq visits | Min/stop | Hours |
    82	|---|---|---:|---:|---:|---:|
    83	| Alias Franks | mon | 47 | 26.1 | 19.2 | 8.4 |
    84	| Alias Franks | tue | 54 | 28.0 | 23.6 | 11.0 |
    85	| Alias Franks | wed | 40 | 24.1 | 28.3 | 11.4 |
    86	| Alias Franks | thu | 38 | 22.9 | 25.3 | 9.7 |
    87	| Alias Franks | fri | 44 | 26.4 | 22.4 | 9.8 |
    88	| Cory Ventura | mon | 62 | 40.2 | 12.8 | 8.6 |
    89	| Cory Ventura | tue | 34 | 14.2 | 15.1 | 3.6 |
    90	| Cory Ventura | wed | 40 | 19.8 | 15.2 | 5.0 |
    91	| Cory Ventura | thu | 33 | 20.6 | 16.0 | 5.5 |
    92	| Cory Ventura | fri | 54 | 33.8 | 15.5 | 8.7 |
    93	| Luke LaVergne | mon | 49 | 23.3 | 22.1 | 8.6 |
    94	| Luke LaVergne | tue | 31 | 17.9 | 28.9 | 8.6 |
    95	| Luke LaVergne | wed | 32 | 18.3 | 32.1 | 9.8 |
    96	| Luke LaVergne | thu | 37 | 19.4 | 27.4 | 8.9 |
    97	| Luke LaVergne | fri | 39 | 22.4 | 20.0 | 7.5 |
    98	| Robert Norton | mon | 20 | 14.6 | 21.5 | 5.2 |
    99	| Robert Norton | tue | 36 | 21.0 | 19.9 | 7.0 |
   100	| Robert Norton | wed | 40 | 23.1 | 20.1 | 7.7 |
   101	| Robert Norton | thu | 44 | 26.6 | 21.1 | 9.4 |
   102	| Robert Norton | fri | 53 | 29.4 | 23.7 | 11.6 |
   103	| Tavis Alexander | mon | 50 | 28.0 | 16.4 | 7.6 |
   104	| Tavis Alexander | tue | 53 | 31.3 | 18.2 | 9.5 |
   105	| Tavis Alexander | wed | 37 | 23.9 | 15.0 | 6.0 |
   106	| Tavis Alexander | thu | 50 | 24.3 | 18.7 | 7.6 |
   107	| Tavis Alexander | fri | 46 | 26.0 | 21.1 | 9.2 |
   108	| **Total** | | **1,063** | **605.6** | | **205.9** |
   109	
   110	Weekly totals by tech: Alias 50.3 h, Luke 43.4 h, Robert 40.9 h, Tavis 39.9 h, Cory 31.4 h.
   111	The spread between the heaviest and lightest tech is **18.9 hours a week**, roughly two and a
   112	half working days.
   113	
   114	Four route-days sit above 10 hours: Robert Friday 11.6, Alias Wednesday 11.4, Alias Tuesday
   115	11.0, Luke Wednesday 9.8 is just under. Four sit below 6: Cory Tuesday 3.6, Cory Wednesday 5.0,
   116	Robert Monday 5.2, Cory Thursday 5.5.
   117	
   118	The 605.6 weekly-equivalent total exceeds the 568.6 actually worked because the 66 future-only
   119	jobs are costed at their product's median observed rate.
   120	
   121	---
   122	
   123	## 3. The territories that emerged
   124	
   125	Geometry is taken from STABLE customers only, so it describes settled ground rather than
   126	wherever an overflow visit happened to land.
   127	
   128	| Tech | Jobs | Stable | Hull km2 | The ground, in words |
   129	|---|---|---:|---:|---|
   130	| Alias Franks | 223 | 106 | 779 | The Eastside and north Seattle. Seattle 39, Sammamish 39, Redmond 30, Bellevue 22, Woodinville 21. |
   131	| Tavis Alexander | 236 | 86 | 951 | Seattle both sides of I-90, plus Renton/Newcastle and a Snoqualmie Valley outpost. Seattle 63, Bellevue 31, Renton 29, Burien 16, Issaquah 15. |
   132	| Robert Norton | 193 | 80 | 518 | SR-410 country and the Enumclaw plateau. Buckley 37, Enumclaw 31, Bonney Lake 26, Auburn 23, Federal Way 16. |
   133	| Luke LaVergne | 188 | 63 | 2,739 | Thurston, Tacoma and the peninsula. Olympia 48, Tacoma 32, Gig Harbor 20, Graham 19, Lacey 13. |
   134	| Cory Ventura | 223 | 10 | 454 | Renton, Kent, Maple Valley, Puyallup, Auburn. Compact, and the least settled. |
   135	
   136	Luke's hull is five times Robert's for fewer customers. That is the peninsula and Thurston
   137	reach, and it is why his minutes per stop run 20 to 32 against Cory's 13 to 16.
   138	
   139	### Weekday structure inside each territory
   140	
   141	Some techs run a clean day grid; some do not.
   142	
   143	**Luke LaVergne — the cleanest.** Peninsula/Gig Harbor is 29 of 29 on Wednesday. Thurston runs
   144	Monday north / Thursday south, 35 and 24. Only 25 cross-day pairs within 1.5 km on his whole
   145	territory.
   146	
   147	**Alias Franks — clean.** Sammamish/Issaquah Highlands is 55 of 56 Friday. North Seattle is 57
   148	of 57 Tuesday. Redmond/Woodinville splits Wednesday 21 / Thursday 22, which is a real two-day
   149	block, not scatter. 30 cross-day pairs.
   150	
   151	**Robert Norton — mostly clean, one real seam.** Buckley/Bonney Lake/Lake Tapps/Sumner runs
   152	Friday 53 / Wednesday 38. That is a genuine two-day block, but the two days interleave on the
   153	ground: 33 of his 43 cross-day pairs are Wednesday-against-Friday inside Buckley and Lake Tapps.
   154	
   155	**Tavis Alexander — two blocks, badly interleaved.** 151 cross-day pairs. Ninety-four of them
   156	are Monday-against-Tuesday inside Seattle (41), Burien (12) and Normandy Park (9). West
   157	Seattle/Burien splits almost exactly in half, Tuesday 35 / Monday 34, with no line between them.
   158	A further 45 are Wednesday-against-Thursday across Renton and Newcastle.
   159	
   160	**Cory Ventura — no structure.** 142 cross-day pairs across all ten day-combinations. The
   161	largest is Friday-against-Monday, 43 pairs, in Maple Valley, Renton and Kent.
   162	
   163	---
   164	
   165	## 4. The seams
   166	
   167	A seam is where two techs' customers sit within 1.5 km of each other. Note: run against STABLE
   168	customers only, the 1.5 km test returns nothing at all — the closest cross-tech stable pair in
   169	the whole fleet is 1.94 km apart, in Seattle. The scan below therefore runs over all 1,063
   170	assigned customers, with a stable-only tier at 3 km reported in the JSON (26 pairs).
   171	
   172	| Seam | Pairs < 1.5 km | Customers | Closest | Where it actually runs |
   173	|---|---:|---:|---:|---|
   174	| Cory Ventura / Robert Norton | 93 | 97 | 0.00 km | Buckley around Connells Prairie Road and 78th St E (14); Enumclaw around Cole St (8); Buckley around 241st Ave Ct E (8) |
   175	| Alias Franks / Tavis Alexander | 45 | 45 | 0.15 km | Medina/Clyde Hill around Evergreen Point Road and NE 28th St (14); North Bend around NE 12th St (6); Seattle around 40th Ave W (6) |
   176	| Cory Ventura / Tavis Alexander | 32 | 33 | 0.00 km | Renton/Newcastle around SE 100th St and 148th Ave SE (11); Issaquah/Sammamish around 238th Pl SE (6); Renton around SE 128th St (6) |
   177	| Cory Ventura / Luke LaVergne | 18 | 22 | 0.00 km | North Tacoma around N 33rd and N 39th St (8); Graham/Orting around 150th Ave E (6); Orting-Kapowsin Highway (3) |
   178	| Luke LaVergne / Robert Norton | 7 | 10 | 0.25 km | Puyallup/Edgewood around Valley Ave E (5); Federal Way around SW 349th St (5) |
   179	| Alias Franks / Cory Ventura | 1 | 2 | 0.75 km | Sammamish, SE 36th Ct / SE 30th St |
   180	
   181	A closest distance of 0.00 km means two customers at effectively the same address are held by
   182	different techs.
   183	
   184	### Overlap zones
   185	
   186	Two hundred customers have neighbours who disagree about who owns the ground. Fifty-one are
   187	held by a tech other than the one that surrounds them.
   188	
   189	| Zone | Customers | Held against their neighbours | Cities |
   190	|---|---:|---:|---|
   191	| Alias / Tavis | 52 | 10 | Bellevue 14, Seattle 12, Issaquah 9, Sammamish 6, Clyde Hill 4 |
   192	| Cory / Robert | 51 | 13 | Maple Valley 16, Kent 13, Auburn 7, Covington 7, Ravensdale 5 |
   193	| Cory / Tavis | 46 | 4 | Renton 18, Kent 15, Maple Valley 8, Issaquah 5 |
   194	| Luke / Robert | 36 | 19 | Tacoma 15, Graham 11, Puyallup 4, Orting 4 |
   195	| Robert / Tavis | 14 | 4 | Normandy Park 7, SeaTac 2, Kent 2, Des Moines 2 |
   196	| Luke / Tavis | 1 | 1 | Port Orchard 1 |
   197	
   198	The single worst pocket: **21 customers held by Cory sit inside ground that Robert's settled
   199	work surrounds** — Auburn 5, Graham 4, Ravensdale 3, Orting 3, Kent 3.
   200	
   201	### Zip codes that do not resolve
   202	
   203	Of 123 zips, **24 are not tech-clean** and **49 are not day-clean**. The largest splits:
   204	
   205	| Zip | City | Jobs | Tech split | Day split |
   206	|---|---|---:|---|---|
   207	| 98022 | Enumclaw | 41 | Robert 31, Cory 10 | tue 41 (clean) |
   208	| 98059 | Renton | 38 | Cory 19, Tavis 19 | wed 16, thu 13, fri 9 |
   209	| 98092 | Auburn | 28 | Cory 14, Robert 14 | mon 15, wed 6, tue 6, thu 1 |
   210	| 98338 | Graham | 25 | Luke 19, Cory 6 | tue 20, thu 3, mon 2 |
   211	| 98075 | Sammamish | 24 | Alias 19, Tavis 5 | fri 24 (clean) |
   212	| 98045 | North Bend | 19 | Tavis 15, Alias 4 | fri 19 (clean) |
   213	| 98004 | Bellevue | 14 | Tavis 7, Alias 7 | mon 9, thu 5 |
   214	| 98027 | Issaquah | 14 | Cory 9, Tavis 5 | thu 13, fri 1 |
   215	| 98023 | Federal Way | 13 | Robert 9, Luke 4 | thu 9, fri 4 |
   216	
   217	98059 Renton and 98092 Auburn are exact ties. Neither zip has an owner in the field.
   218	
   219	---
   220	
   221	## 5. File versus field
   222	
   223	`territories.json` v9 (2026-08-12, effective 2026-08-17) applied to the same 1,063 jobs, using
   224	each region's `ownerFrom_2026_08_17`. **The file predicts the right tech for 606 of 1,063
   225	customers — 57%.** Eight regions match at 95% or better; six match below 35%. A further six
   226	customers sit in zips that no region in the file covers at all.
   227	
   228	| Region | File says | Jobs | Match | The field actually runs |
   229	|---|---|---:|---:|---|
   230	| Buckley / Bonney Lake / Lake Tapps / Sumner | Cory Ventura | 93 | **6%** | Robert 87, Cory 6. Days fri 53 / wed 38, not the file's wed+fri under Cory. |
   231	| North of SR-516 (Des Moines / Kent North / Maple Valley) | Robert Norton | 88 | **6%** | Cory 77, Tavis 6, Robert 5 |
   232	| North Seattle / Shoreline | Tavis Alexander | 57 | **11%** | Alias 51, Tavis 6. Tuesday is clean, 57 of 57. |
   233	| Federal Way | Luke LaVergne | 20 | **20%** | Robert 16, Luke 4 |
   234	| Issaquah South | Robert Norton | 14 | **0%** | Cory 9, Tavis 5. Thursday 13 of 14. |
   235	| Graham / Orting / Eatonville / Roy | Cory Ventura | 53 | 34% | Luke 34, Cory 18 |
   236	| Snoqualmie Valley / Duvall | Alias Franks | 48 | 40% | Tavis 29, Alias 19 |
   237	| Renton / Newcastle | Tavis Alexander | 83 | 51% | Tavis 42, Cory 41 — an even split |
   238	| Puyallup / Edgewood / Milton | Cory Ventura | 48 | 58% | Cory 28, Robert 16, Luke 4 |
   239	| Peninsula / Gig Harbor / Kitsap | Luke LaVergne | 29 | 100% | Luke 29, Wednesday 29 of 29 |
   240	| West Seattle / Burien / Normandy Park | Tavis Alexander | 69 | 100% | Tavis 69 |
   241	| Thurston North | Luke LaVergne | 59 | 100% | Luke 59 |
   242	| Redmond / Woodinville | Alias Franks | 51 | 100% | Alias 51 |
   243	
   244	### Worked example — Tavis on Snoqualmie Valley
   245	
   246	The file puts the whole valley on Alias Franks as one unit, on Thursday. `CLAUDE.local.md`
   247	records this as a deliberate Spencer decision from 2026-08-07: North Bend, Snoqualmie, Fall
   248	City and Carnation go to T1 as one block, because the valley sits on I-90 east of the SR-18
   249	junction and the highway line cannot resolve it.
   250	
   251	The field runs it differently. Of 39 customers in those four cities, **28 are Tavis Alexander
   252	on Friday**, 7 are Alias on Thursday, 4 are Alias on Friday. North Bend 98045 alone is Tavis 15
   253	/ Alias 4, and Friday 19 of 19 — the weekday is completely clean, only the tech is contested.
   254	
   255	The existing memory note "Tavis on Snoqualmie is intentional" is confirmed by the data. Its
   256	warning is also confirmed: `assign-by-territory` reading v9 would hand all 39 back to Alias on
   257	Thursday, moving 28 customers and changing their service day.
   258	
   259	### Worked example — Robert on Buckley / Bonney Lake / Sumner
   260	
   261	The file gives this block to **Cory Ventura**, on Wednesday and Friday, as part of the v9
   262	five-way cut. Cory lives in Buckley 98321, which is the stated reason: it puts him on his own
   263	doorstep, the lowest commute on the board at 42 miles a week.
   264	
   265	The field never did it. Across Buckley, Bonney Lake, Lake Tapps and Sumner, **87 of 93
   266	customers are Robert Norton**; Cory holds 6. The days are Friday 53 / Wednesday 38, so the v9
   267	rhythm survived the cut but the owner did not. This block is the single largest disagreement
   268	between the file and the field, and it is also the largest seam on the board: 93 customer pairs
   269	within 1.5 km split between Cory and Robert, 14 of them clustered around Connells Prairie Road
   270	in Buckley, some at effectively the same address.
   271	
   272	Cory's compensating load is the Kent/Maple Valley block the file assigned to Robert, where 77
   273	of 88 customers are Cory. In effect the two men swapped the two blocks the cut gave them and
   274	nobody wrote it down.
   275	
   276	---
   277	
   278	## 6. What this leaves for the owner
   279	
   280	Stated as open questions, not recommendations.
   281	
   282	1. **Cory Ventura's route-days have no day structure.** 4% stable against a fleet average of
   283	   40%. Either his book becomes a day grid like everyone else's, or it is formally the overflow
   284	   lane and his customers are never given a day.
   285	2. **The Buckley block and the Kent block are swapped** against the file, for 165 customers
   286	   between them. One of the two records is wrong.
   287	3. **Two zips are exact ties**, 98059 Renton (Cory 19 / Tavis 19) and 98092 Auburn (Cory 14 /
   288	   Robert 14). No owner exists in the field to derive.
   289	4. **Load spread is 18.9 hours a week**, Alias 50.3 against Cory 31.4.
   290	5. **51 customers are held by a tech their neighbours contradict**, the worst pocket being 21
   291	   Cory customers inside Robert's settled ground.
   292	
   293	---
   294	
   295	## Appendix A — jobs needing a decision, by route-day
   296	
   297	Counts of jobs that are neither STABLE nor future-only, i.e. every job whose tech or weekday
   298	the field has not settled. Full per-job detail, including each job's own tech and weekday
   299	tally, is in `redesign/data/master-asbuilt.json` under `jobs[]`.
   300	
   301	| Route-day | Undecided jobs |
   302	|---|---:|
   303	| Cory Ventura / mon | 54 |
   304	| Cory Ventura / fri | 54 |
   305	| Tavis Alexander / mon | 44 |
   306	| Alias Franks / mon | 39 |
   307	| Cory Ventura / wed | 37 |
   308	| Luke LaVergne / mon | 35 |
   309	| Cory Ventura / tue | 33 |
   310	| Cory Ventura / thu | 33 |
   311	| Tavis Alexander / thu | 32 |
   312	| Tavis Alexander / tue | 32 |
   313	| Robert Norton / fri | 29 |
   314	| Luke LaVergne / fri | 28 |
   315	| Luke LaVergne / thu | 24 |
   316	| Robert Norton / wed | 19 |
   317	| Robert Norton / mon | 19 |
   318	| Luke LaVergne / tue | 18 |
   319	| Alias Franks / tue | 17 |
   320	| Alias Franks / thu | 17 |
   321	| Robert Norton / thu | 16 |
   322	| Robert Norton / tue | 16 |
   323	| Alias Franks / wed | 16 |
   324	| Alias Franks / fri | 12 |
   325	| Tavis Alexander / wed | 12 |
   326	| Tavis Alexander / fri | 11 |
   327	| Luke LaVergne / wed | 5 |
   328	
   329	Every Monday except Robert's is in the top six. Monday is where the board absorbs whatever the
   330	previous week did not finish.
   331	
   332	## Appendix B — method notes and cautions
   333	
   334	- **Weekday** is the Pacific (UTC-7) date of the visit's `startAt`. The whole window is PDT.
   335	- **Tech** is `techs[0]` on completed visits. Every completed visit in the window carries
   336	  exactly one tech; the standalone `completed-visits_2026-08-17_2026-09-17.json` file agrees
   337	  with `visits.json` on all 2,793 shared rows, with zero disagreements.
   338	- **Weekly-equivalent visits** are observed throughput (completed visits divided by window
   339	  weeks), not a cadence rule. Future-only jobs fall back to their product's median observed
   340	  rate. The spacing-derived alternative is kept per job as `weeklyEqSpacing` and runs about 15%
   341	  higher, because a job's scheduled forward visits are denser than what actually gets worked.
   342	- **Hours** use each route-day's own observed median span per stop. They are not comparable to
   343	  a flat service time, and they blend drive with on-site time, so dense ground flatters a tech
   344	  and spread ground penalises one. Luke and Alias are penalised by this; Cory is flattered.
   345	- **Inference** for the 66 future-only jobs is an inverse-distance-weighted vote of the 10
   346	  nearest STABLE jobs. Each carries `inferredFrom.confidence` and its runner-up route-day.
   347	- **The 1.5 km seam radius cannot be run on STABLE customers alone.** The settled set is too
   348	  sparse: its closest cross-tech pair is 1.94 km. Seams are therefore computed over all
   349	  assigned customers, which includes flipping ones whose tech is less certain.
   350	- **Convex hulls overstate territory.** They are a reach measure, not a boundary. Luke's 2,739
   351	  km2 hull spans water it contains no customers on.
   352	- **Archived jobs are included.** 177 of the 1,063 are archived; per-route-day active counts
   353	  are in `master-asbuilt.json` as `activeJobs`.
```

## [4] stages/S3b-cadence-capacity.md

```
     1	# S3b — Cadence as-built and route-day capacity
     2	
     3	Measured 2026-09-18 from Jobber. Findings only, no recommendations. Nothing here applies
     4	`scheduling-rules.json` or the cadence rules in `CLAUDE.local.md`; every number is derived from
     5	the visit and job data. Where a measured result agrees or disagrees with a written rule, that is
     6	reported as an observation.
     7	
     8	| | |
     9	|---|---|
    10	| Jobs | 1,063 (TMCP 752, Quick Fix 274) |
    11	| Visits | 4,290 over 2026-08-14 .. 2026-10-16 (2,924 completed) |
    12	| Notes sample | 192 notes on 40 jobs, used for true per-visit state |
    13	| Route-day cycle time | `data/route-day-drive_2026-08-17_2026-09-17.json`, 25 route-days |
    14	| Route-day assignment | `redesign/data/master-asbuilt.json` — all 881 active jobs matched, no fallback used |
    15	| Scripts | `scripts/derive-cadence.mjs` → `data/cadence-asbuilt.json`; `scripts/demand-model.mjs` → `data/demand-model.json` |
    16	
    17	---
    18	
    19	## 1. The measurement problem that shapes everything below
    20	
    21	The Jobber fields that record what a tech found — Latest Activity, Moles Caught, Misses, Next
    22	Action — are **job-level, not visit-level**. They hold only the state of the most recent completed
    23	visit. Each job therefore yields exactly one trigger-attributed interval, measured forward from its
    24	last completed visit.
    25	
    26	That forward interval is, by construction, always a **scheduled** date and never a delivered one.
    27	The script asserts this and it holds for all 810 rows. So the trigger table below measures what the
    28	office has **booked next**, not what the field delivered.
    29	
    30	Delivered cadence has to come from two other places: consecutive completed-visit gaps (large n, but
    31	unattributable to a trigger), and the notes sample (small n, but carries true per-visit state).
    32	All three views are reported separately and they disagree in an informative way.
    33	
    34	---
    35	
    36	## 2. Interval by trigger
    37	
    38	**Booked next** — one row per job, from the job-level fields. This is the standing schedule.
    39	
    40	| Trigger | n | median | p25 | p75 | share ≤10d |
    41	|---|---:|---:|---:|---:|---:|
    42	| quiet (None, no catch/miss) | 446 | 9 | 7 | 25 | 55% |
    43	| catch | 138 | 14 | 7 | 26 | 37% |
    44	| activity Low | 104 | 14 | 7 | 21 | 45% |
    45	| miss (no catch) | 104 | 14 | 7 | 25.5 | 44% |
    46	| activity Moderate | 13 | 14 | 13 | 21 | 23% |
    47	| activity High | 5 | 14 | 7 | 27 | 40% |
    48	
    49	**The booked schedule does not discriminate by trigger at all.** Every non-quiet trigger sits at a
    50	median of 14 days with a p75 in the 21-27 day range. A catch and a High-activity finding buy the
    51	customer exactly the same next appointment as a Low-activity one. Restricted to TMCP the quiet row
    52	also collapses to 14 days, so the 9-day quiet median above is a Quick Fix effect, not a signal that
    53	quiet jobs get seen sooner.
    54	
    55	**Delivered** — consecutive completed-visit gaps, unattributed.
    56	
    57	| Product | n | median | p25 | p75 | share ≤10d |
    58	|---|---:|---:|---:|---:|---:|
    59	| TMCP | 1,403 | 7 | 7 | 9 | 80% |
    60	| Quick Fix | 476 | 7 | 7 | 7 | 99.6% |
    61	| All | 1,925 | 7 | 7 | 8 | 85% |
    62	
    63	**Delivered by trigger** — notes sample, per-visit state, follow-up that actually happened.
    64	
    65	| Trigger | n | median | p25 | p75 | share ≤10d |
    66	|---|---:|---:|---:|---:|---:|
    67	| miss (no catch) | 36 | 7 | 7 | 7 | 94% |
    68	| activity Low | 43 | 7 | 7 | 7 | 88% |
    69	| catch | 22 | 7.5 | 7 | 11.5 | 73% |
    70	| quiet (None) | 42 | 7 | 7 | 16 | 57% |
    71	| activity Moderate | 4 | 7 | 6.8 | 7 | 100% |
    72	| activity High | 2 | 6.5 | 6.3 | 6.8 | 100% |
    73	
    74	The two views tell opposite stories, and both are true. The field **delivers** roughly weekly
    75	service to anything with a sign of activity. The standing schedule **holds** those same jobs at
    76	fortnightly-to-monthly. The gap between them is closed by hand, visit by visit, which is what the
    77	overdue count in section 5 is measuring.
    78	
    79	Note the ordering inside the delivered table: a **miss gets a faster return than a catch**
    80	(94% vs 73% within 10 days). A caught mole is treated as a problem partly solved; a miss is treated
    81	as one still running.
    82	
    83	The free-text Next Action written on a note predicts the delivered interval well: "Add visit"
    84	n=83 median 7d (89% ≤10d), "Add visit 1 week" n=15 median 7d, "2 weeks" n=11 median 14d,
    85	"Monthly" n=17 median 28d. The dropdown field has only three values and no "Add visit N weeks"
    86	option, so the note grammar carries more precision than the field it feeds.
    87	
    88	---
    89	
    90	## 3. Quick Fix series reality
    91	
    92	Clean cohort: 134 Quick Fix jobs whose job start falls inside the visit window, so the whole series
    93	is observable.
    94	
    95	- **Series length delivered: median 5 visits**, p25 5, p75 5, range 3-6. The 5-week design holds.
    96	- **Spacing: median 7 days**, p25 7, p75 7, range 3-11. 99.4% of gaps are ≤10 days.
    97	- **Ran past 5 visits: 11 of 134 scheduled a 6th; none has completed a 6th yet.** So the
    98	  "series exhausted with activity outstanding" case is roughly 8% of Quick Fix jobs, and it is
    99	  currently being handled by booking a 6th visit rather than by a sales conversation.
   100	- 108 of 134 still hold a future visit; 22 are archived.
   101	
   102	Quick Fix is the one part of the book that runs exactly as designed. It needs no cadence logic —
   103	it is a fixed weekly series — so it should be modeled as a fixed 1 visit/week per active job rather
   104	than being fed through a trigger rule.
   105	
   106	---
   107	
   108	## 4. TMCP quiet interval and weekday hold
   109	
   110	- **Quiet TMCP jobs are booked at a median of 14 days forward** (n=324, p25 7, p75 28). Only 34%
   111	  of those bookings fall in the 24-38 day band. So "quiet means monthly" is **not** what the
   112	  standing schedule does — it books quiet jobs at every interval from 4 to 42 days.
   113	- **Weekday hold: 66.6%.** Across 728 TMCP jobs with two or more visits, only two thirds of visits
   114	  land on the job's own dominant weekday, and only 169 jobs (23%) hold their weekday 100% of the time.
   115	- **Tech hold: 83.2%**, measured inside a window that contains real handovers, so the true figure
   116	  is higher. Ownership is considerably more stable than the weekday.
   117	
   118	The weekday is the weakest anchor in the system. A design that assumes "this job belongs to Tuesday"
   119	is assuming something that currently holds only two times in three.
   120	
   121	---
   122	
   123	## 5. Overdue as of 2026-09-18
   124	
   125	Scope is the 881 **active** jobs: not archived, and either holding a future visit or completed
   126	within 45 days. Two measures:
   127	
   128	- **Unsatisfied** — the job's own Next Action field is not met by the schedule. No visit after the
   129	  last completed one, or the next visit falls past the field's limit (Add visit 10d, 2 weeks 17d,
   130	  Monthly 33d, each target plus 3 days of grace).
   131	- **Hard overdue** — the limit date has already passed and nothing happened or is booked before today.
   132	
   133	| | count |
   134	|---|---:|
   135	| Active jobs | 881 |
   136	| Unsatisfied | **403** (46%) |
   137	| Hard overdue | **129** (15%) |
   138	| No future visit at all | 81 |
   139	
   140	By product: unsatisfied TMCP 393, Quick Fix 5, Barter 4, Friends and family 1. Hard overdue
   141	TMCP 125, Barter 3, Friends and family 1. **The problem is entirely a TMCP problem.**
   142	
   143	By the office's own instruction: 355 of the 403 unsatisfied jobs carry "Add visit", 33 carry
   144	"2 weeks", 15 carry "Monthly".
   145	
   146	By trigger, hard overdue: quiet 56, catch 29, miss 26, activity Low 15, activity Moderate 3.
   147	**Fifty-five of the 129 hard-overdue jobs had a catch or a miss on the last visit.**
   148	
   149	Days since last completed visit: all active jobs median 4 (p75 10). Hard-overdue jobs median 22
   150	(p25 17, p75 24, max 35).
   151	
   152	Per route-day (active / unsatisfied / hard):
   153	
   154	| Route-day | active | unsat | hard |
   155	|---|---:|---:|---:|
   156	| Cory Ventura / wed | 51 | 17 | 11 |
   157	| Cory Ventura / mon | 47 | 22 | 4 |
   158	| Tavis Alexander / thu | 42 | 21 | 9 |
   159	| Tavis Alexander / tue | 42 | 19 | 7 |
   160	| Robert Norton / tue | 41 | 18 | 7 |
   161	| Tavis Alexander / fri | 41 | 22 | 5 |
   162	| Robert Norton / wed | 39 | 23 | 4 |
   163	| Luke LaVergne / thu | 39 | 13 | 5 |
   164	| Robert Norton / fri | 38 | 11 | 5 |
   165	| Alias Franks / tue | 37 | 16 | 4 |
   166	| Alias Franks / wed | 37 | 14 | 6 |
   167	| Tavis Alexander / mon | 35 | 19 | 4 |
   168	| Alias Franks / fri | 34 | 11 | 1 |
   169	| Robert Norton / thu | 34 | 20 | 5 |
   170	| Alias Franks / thu | 34 | 12 | 7 |
   171	| Luke LaVergne / mon | 34 | 18 | 6 |
   172	| Alias Franks / mon | 32 | 18 | 2 |
   173	| Cory Ventura / thu | 32 | 14 | 6 |
   174	| Tavis Alexander / wed | 32 | 23 | 7 |
   175	| Cory Ventura / tue | 30 | 15 | 8 |
   176	| Luke LaVergne / fri | 30 | 16 | 8 |
   177	| Luke LaVergne / tue | 28 | 14 | 3 |
   178	| Cory Ventura / fri | 26 | 15 | 2 |
   179	| Robert Norton / mon | 23 | 6 | 2 |
   180	| Luke LaVergne / wed | 23 | 6 | 1 |
   181	
   182	The backlog is **spread evenly across all 25 route-days**, between 6 and 23 unsatisfied jobs each.
   183	No tech and no weekday is the cause. That rules out a local explanation and points at the scheduling
   184	mechanism itself.
   185	
   186	---
   187	
   188	## 6. Capacity under four cadence policies
   189	
   190	Weekly demand per job is `7 / interval`. Hours are `visits × that route-day's measured cycle time`,
   191	where cycle time is median span hours ÷ median stops for that tech and weekday, drive included.
   192	
   193	- **P0** — as the office actually runs it. Each job uses its own measured gap median, falling back
   194	  to its own next booked gap when it has only one completed visit, then to the product median.
   195	- **P1** — weekly after a catch, monthly otherwise.
   196	- **P2** — weekly after catch OR miss OR any activity, monthly otherwise.
   197	- **P3** — the Next Action field taken literally (Add visit 7d, 2 weeks 14d, Monthly 30d).
   198	
   199	Quick Fix is held at 7 days under all four, because it is a product definition rather than a cadence
   200	decision. The pure-policy variant is in `demand-model.json` under `policiesPure`.
   201	
   202	Observed baseline, what the five techs actually delivered over 08-17 .. 09-17: **615 stops/week,
   203	207.9 hours/week, 15 of 25 route-days already over 8 h, 6 over 9 h.**
   204	
   205	| Tech | Day | cycle min | obs stops | obs h | P0 v | P0 h | P1 v | P1 h | P2 v | P2 h | P3 v | P3 h |
   206	|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
   207	| Alias Franks | mon | 19.2 | 27.5 | 8.8 | 31.7 | 10.2 | 20.4 | 6.5 | 29.6 | 9.5 | 33.2 | 10.6 |
   208	| Alias Franks | tue | 23.6 | 27 | 10.6 | 32.5 | 12.8 | 18.8 | 7.4 | 23.4 | 9.2 | 32.2 | 12.6 |
   209	| Alias Franks | wed | 28.3 | 25 | 11.8 | 26.4 | 12.4 | 18.7 | 8.8 | 26.3 | 12.4 | 31.2 | 14.7 |
   210	| Alias Franks | thu | 25.3 | 23 | 9.7 | 26.7 | 11.3 | 12.5 | 5.3 | 24.0 | 10.1 | 31.2 | 13.2 |
   211	| Alias Franks | fri | 22.4 | 25.5 | 9.5 | 29.9 | 11.2 | 16.6 | 6.2 | 25.0 | 9.3 | 31.7 | 11.8 |
   212	| Cory Ventura | mon | 12.8 | 31 | 6.6 | 44.0 | 9.4 | 26.4 | 5.6 | 41.0 | 8.7 | 49.7 | 10.6 |
   213	| Cory Ventura | tue | 15.1 | 23 | 5.8 | 22.1 | 5.6 | 14.6 | 3.7 | 18.4 | 4.7 | 27.7 | 7.0 |
   214	| Cory Ventura | wed | 15.2 | 28 | 7.1 | 27.6 | 7.0 | 15.3 | 3.9 | 22.2 | 5.6 | 29.9 | 7.6 |
   215	| Cory Ventura | thu | 16.0 | 24 | 6.4 | 25.5 | 6.8 | 12.8 | 3.4 | 22.0 | 5.9 | 29.5 | 7.9 |
   216	| Cory Ventura | fri | 15.5 | 24 | 6.2 | 35.6 | 9.2 | 19.7 | 5.1 | 30.4 | 7.9 | 36.4 | 9.4 |
   217	| Luke LaVergne | mon | 22.1 | 22 | 8.1 | 28.7 | 10.6 | 23.6 | 8.7 | 27.4 | 10.1 | 38.7 | 14.3 |
   218	| Luke LaVergne | tue | 28.9 | 17 | 8.2 | 23.5 | 11.3 | 9.4 | 4.5 | 14.0 | 6.7 | 20.1 | 9.7 |
   219	| Luke LaVergne | wed | 32.1 | 17 | 9.1 | 22.2 | 11.9 | 11.2 | 6.0 | 14.3 | 7.6 | 22.2 | 11.9 |
   220	| Luke LaVergne | thu | 27.4 | 21 | 9.6 | 27.5 | 12.6 | 15.6 | 7.1 | 21.7 | 9.9 | 33.0 | 15.1 |
   221	| Luke LaVergne | fri | 20.0 | 24 | 8.0 | 20.7 | 6.9 | 11.7 | 3.9 | 17.0 | 5.7 | 24.2 | 8.1 |
   222	| Robert Norton | mon | 21.5 | 21.5 | 7.7 | 14.8 | 5.3 | 6.5 | 2.3 | 13.4 | 4.8 | 17.5 | 6.3 |
   223	| Robert Norton | tue | 19.9 | 25 | 8.3 | 24.4 | 8.1 | 15.4 | 5.1 | 21.5 | 7.1 | 28.4 | 9.4 |
   224	| Robert Norton | wed | 20.1 | 23 | 7.7 | 24.4 | 8.2 | 15.3 | 5.1 | 20.7 | 6.9 | 31.7 | 10.6 |
   225	| Robert Norton | thu | 21.1 | 25 | 8.8 | 26.6 | 9.4 | 14.8 | 5.2 | 21.0 | 7.4 | 30.7 | 10.8 |
   226	| Robert Norton | fri | 23.7 | 22 | 8.7 | 31.2 | 12.3 | 21.6 | 8.5 | 30.0 | 11.9 | 34.7 | 13.7 |
   227	| Tavis Alexander | mon | 16.4 | 27.5 | 7.5 | 29.9 | 8.2 | 21.3 | 5.8 | 30.5 | 8.3 | 36.4 | 9.9 |
   228	| Tavis Alexander | tue | 18.2 | 29 | 8.8 | 28.2 | 8.6 | 20.9 | 6.3 | 24.0 | 7.3 | 30.1 | 9.1 |
   229	| Tavis Alexander | wed | 15.0 | 32 | 8.0 | 23.3 | 5.8 | 12.1 | 3.0 | 19.0 | 4.8 | 27.5 | 6.9 |
   230	| Tavis Alexander | thu | 18.7 | 26 | 8.1 | 25.1 | 7.8 | 18.6 | 5.8 | 24.0 | 7.5 | 32.7 | 10.2 |
   231	| Tavis Alexander | fri | 21.1 | 25 | 8.8 | 36.3 | 12.8 | 18.0 | 6.3 | 28.7 | 10.1 | 35.7 | 12.6 |
   232	
   233	Totals against a 200-hour week (25 route-days × 8 h):
   234	
   235	| Policy | visits/wk | hours/wk | vs 200 h | vs observed 615 | days >8 h | days >9 h | tech-days needed at 8 h |
   236	|---|---:|---:|---:|---:|---:|---:|---:|
   237	| Observed | 615 | 207.9 | +7.9 | — | 15 | 6 | 26.0 |
   238	| P0 as-run | 688.8 | 235.4 | **+35.4** | +12% | 18 | 14 | 29.4 |
   239	| P1 catch-only | 411.8 | 139.7 | −60.3 | −33% | 3 | 0 | 17.5 |
   240	| P2 any-activity | 589.6 | 199.4 | **−0.6** | −4% | 11 | 9 | 24.9 |
   241	| P3 field literal | 776.2 | 263.9 | **+63.9** | +26% | 20 | 19 | 33.0 |
   242	
   243	### What the calibration says
   244	
   245	**P2 is the only policy that reproduces the business that actually runs.** At 589.6 visits and
   246	199.4 hours it sits 4% under the observed baseline and lands within 0.6 hours of the 200-hour
   247	capacity of the current five techs. The rule "any activity, a catch, or a miss means weekly, and
   248	nothing found means monthly" is, to within measurement error, a description of what Got Moles is
   249	already doing — not a change to it.
   250	
   251	**P1 is a service cut, not a simplification.** Catch-only weekly would remove a third of the
   252	delivered work. The misses and the Low-activity findings are carrying most of the follow-up volume.
   253	
   254	**P3 does not fit in the week.** Taking the office's own Next Action field literally needs 33
   255	tech-days against the 25 available — eight route-days, or about 1.6 extra techs. Since 896 of
   256	1,063 jobs carry "Add visit", the field is effectively a default rather than a decision, and no
   257	scheduler can honor it as written.
   258	
   259	**P0 runs 12% hot against the observed baseline.** P0 sums the current book at each job's own
   260	measured pace, while the 615-stop baseline is a five-week median over a slightly smaller book that
   261	lost a day to Labor Day. The gap is the model's error bar. Treat differences between policies as
   262	meaningful and differences under about 10% as noise.
   263	
   264	---
   265	
   266	## 7. Seasonality, 08-17 to 09-14
   267	
   268	| Week of | TMCP visits | share ≤10 d gap | visits per active TMCP job, 5-day-normalized |
   269	|---|---:|---:|---:|
   270	| 08-17 | 449 | 100% (biased) | 0.622 |
   271	| 08-24 | 444 | 97.5% | 0.615 |
   272	| 08-31 | 422 | 82.8% | 0.584 |
   273	| 09-07 | 321 | 84.7% | 0.556 |
   274	| 09-14 | 405 | 53.5% (partial) | 0.561 |
   275	
   276	Two caveats sit on this table. Week 1's ≤10-day share is **inflated to 100% by construction** — the
   277	lookback runs off the front of the visit window, so no long gap can be observed. Week 4 lost Labor
   278	Day and ran 4 field days, which pushed visits into week 5 and is the main reason week 5's share
   279	reads 53.5%. The normalized rate in the last column has neither problem.
   280	
   281	On that cleaner measure the delivered rate falls from **0.622 to 0.556 visits per active TMCP job
   282	per week across the month, about 10%** — cadence stretching from roughly 11.3 to 12.6 days. The
   283	median gap stays at 7 days throughout. So the change is entirely in the tail: the share of TMCP jobs
   284	still on a weekly footing is shrinking while the weekly ones stay weekly. That is consistent with
   285	mole activity easing into September, and it means a model calibrated on August will over-book October.
   286	
   287	---
   288	
   289	## 8. Facts the design must respect
   290	
   291	1. **The standing schedule is trigger-blind; humans close the gap by hand.** Booked-next medians
   292	   are 14 days for a catch, a miss, and every activity level alike, while delivered medians are
   293	   7 days. Everything the field does right about cadence currently lives outside the schedule.
   294	   Any engine that reads the booked schedule as intent will reproduce the wrong cadence.
   295	
   296	2. **A catch today is followed by a visit in a median of 7.5 days and is run as weekly 73% of the
   297	   time — but the schedule only books it inside 10 days 37% of the time.** A miss is treated more
   298	   urgently than a catch (94% weekly). A design that triggers on catches alone (P1) drops a third
   299	   of the delivered work.
   300	
   301	3. **P2 costs what the company already spends.** Weekly on catch, miss or any activity and monthly
   302	   on quiet comes to 199.4 hours against 200 hours of capacity. But it needs 11 of 25 route-days
   303	   over 8 hours and 9 over 9 hours, against 15 and 6 observed today. **The binding constraint is
   304	   balance between route-days, not total headcount** — the total fits, the distribution does not.
   305	
   306	4. **The weekday anchor holds only 66.6% of the time; tech ownership holds 83.2%.** Any design that
   307	   pins a job to a fixed weekday is enforcing something the current operation does not do. Ownership
   308	   is the stable axis.
   309	
   310	5. **46% of active jobs are already behind their own instruction and 15% are hard overdue, spread
   311	   evenly across all 25 route-days (6-23 per day).** Fifty-five of the 129 hard-overdue jobs had a
   312	   catch or a miss. This is a mechanism failure, not a tech or territory failure.
   313	
   314	6. **Quick Fix needs no cadence logic.** Median 5 visits, median 7-day spacing, 99.4% of gaps
   315	   within 10 days. Model it as a fixed weekly series with a flag when an 11-of-134 case wants a
   316	   sixth visit.
```

## [5] stages/S5-harness.md

```
     1	# S5 — Backtest harness
     2	
     3	How we decide whether a redesigned route engine is better than the board that
     4	actually ran. Replay a real week from what was knowable before it started, let a
     5	policy propose a board, and score that board against what the techs really did.
     6	
     7	Everything is offline. No script here makes a network call.
     8	
     9	---
    10	
    11	## Running it
    12	
    13	```bash
    14	cd projects/briefs/route-engine/redesign
    15	node scripts/backtest.mjs --week=2026-08-24 --policy=keep-actual
    16	node scripts/backtest.mjs --all            # every policy x every golden week
    17	```
    18	
    19	| Flag | Meaning |
    20	|---|---|
    21	| `--week=YYYY-MM-DD` | Monday of the golden week. Default `2026-08-24`. |
    22	| `--policy=<name>` | A module under `scripts/policies/`. Default `keep-actual`. |
    23	| `--all` | Every policy against every golden week, then a summary table. |
    24	| `--out=<dir>` | Output root. Default `redesign/backtest`. |
    25	| `--no-orOpt` | 2-opt only, skip the Or-opt pass. |
    26	| `--quiet` | Scorecard files only, no console table. |
    27	
    28	Output lands in `backtest/<week>/<policy>/` as `scorecard.md`, `scorecard.json`
    29	and `board.json`. Run logs are under `backtest/logs/`. A full `--all` run takes
    30	about 8 seconds.
    31	
    32	## The pieces
    33	
    34	| File | Job |
    35	|---|---|
    36	| `scripts/backtest-data.mjs` | Loads every input, reconstructs the week as of the Friday cutoff, builds the actual board. |
    37	| `scripts/sequence.mjs` | Orders one tech's day: nearest-neighbour from their start area, then 2-opt and Or-opt over `travel.mjs`. |
    38	| `scripts/policies/*.mjs` | A policy exports `name`, `description`, `usesOracle` and `propose(snapshot)`. |
    39	| `scripts/backtest.mjs` | Orchestrates, scores, writes. |
    40	
    41	A policy receives the snapshot and returns `{ assignments: [{key, tech, date}], notes }`.
    42	It never sequences anything. The harness sequences every proposal the same way,
    43	so two policies are compared on their board, not on their routing code.
    44	
    45	`snapshot.actual` is the oracle. Only a policy that declares `usesOracle = true`
    46	may read it, and only `keep-actual` does.
    47	
    48	---
    49	
    50	## Reconstructing the week as of Friday 14:00 PT
    51	
    52	The cutoff is 14:00 Pacific on the Friday before the golden week, resolved
    53	through `Intl` against `America/Los_Angeles` rather than assumed, so it survives
    54	a daylight-saving boundary.
    55	
    56	1. **Candidate visits.** Every Jobber visit whose `startAt` falls Monday to
    57	   Friday of the golden week in Pacific time, plus any visit whose `completedAt`
    58	   falls in that window. The union catches work that ran in the week but carries
    59	   a scheduled date outside it.
    60	2. **Known or late.** A candidate with `createdAt` after the cutoff is a **late
    61	   booking**. It is held out of the due set, counted, and reported on its own
    62	   line. A policy planning on Friday afternoon could not have known about it, so
    63	   scoring it would punish the policy for the calendar.
    64	3. **Coordinates.** Where a visit was routed, the harness takes OptimoRoute's
    65	   coordinate for it, because that is the point the real route was built on.
    66	   Otherwise the Jobber visit coordinate, then the job's property coordinate.
    67	   No due visit in either golden week was missing coordinates.
    68	4. **Service minutes.** Taken from the OptimoRoute stop where the visit was
    69	   routed, otherwise that tech's median. Proposal and actual are timed with the
    70	   same per-visit service minutes, so the hours comparison is about the board and
    71	   the driving, never about a service-time assumption.
    72	5. **Start areas.** `travel-model.json` → `inferredStartArea`, one point per
    73	   tech, with a centroid fallback for a tech who has none.
    74	6. **History.** Every completed visit strictly before the golden week's Monday,
    75	   for policies that learn from the past. Cutting it at Monday is what stops a
    76	   "learned" policy from reading the answer.
    77	
    78	### The known limitation
    79	
    80	Jobber was pulled once, on 2026-09-18. A visit's `startAt` is therefore its
    81	*final* scheduled date, not the date it held on the Friday before the week. If a
    82	visit was moved after the cutoff, the harness sees the moved date and credits the
    83	policy with knowing it. The `plan-vs-actual` join measures this directly: 11
    84	moved days across 2,577 planned stops, 0.4%. Small enough to live with, worth
    85	restating whenever a result turns on a fraction of a percent.
    86	
    87	---
    88	
    89	## The join
    90	
    91	OptimoRoute's `orderNo` is `<jobNumber>-<visitNumericId>`, where the numeric id
    92	is the tail of the base64-decoded Jobber visit gid:
    93	
    94	```
    95	Z2lkOi8vSm9iYmVyL1Zpc2l0LzIwMzc2MTM4NTE=  ->  gid://Jobber/Visit/2037613851  ->  2037613851
    96	```
    97	
    98	Verified before use, on the first golden week: 574 of 576 OptimoRoute stops
    99	resolved to a Jobber visit, 99.7%. On 20 hand-checked samples the client name,
   100	the date and the tech agreed in every case, and the coordinates agreed to five
   101	decimal places on 18 of 20, the other two being property re-geocodes rather than
   102	join errors. This matches the 98.9% the `plan-vs-actual` worker reports across
   103	the full 23-day window, so the two are using the same key.
   104	
   105	Stops that resolve to nothing are **ghost orders** — OptimoRoute stops with no
   106	Jobber visit behind them. Two in the first golden week, five in the second. They
   107	are counted on the scorecard and excluded from scoring.
   108	
   109	## The actual board
   110	
   111	Two different things can be called "what happened", and the harness keeps both.
   112	
   113	- **Actual run** — who stamped the visit complete, and on what Pacific date.
   114	  Falls back to the OptimoRoute stop, then to the Jobber schedule. This is the
   115	  primary reference for tech and day agreement.
   116	- **OptimoRoute as held** — the engineered route for that date, its driver and
   117	  its stop order. This is the reference for sequence quality.
   118	
   119	They are keyed **off the completion stamp, not off the OptimoRoute driver name**,
   120	and that matters. On Friday 2026-08-28 OptimoRoute held a 17-stop route under
   121	Luke LaVergne and Cory Ventura worked every one of them. Keying route-days off
   122	the OptimoRoute driver would have invented an empty day for one tech and an
   123	unscoreable day for the other. Those 17 stops are the entire held-versus-stamp
   124	tech disagreement for that week.
   125	
   126	Inside a route-day, the actual stop order is OptimoRoute's engineered order
   127	wherever the stop was routed that same date, and the completion-stamp order
   128	otherwise. In practice that is 549 of 552 stops from OptimoRoute in week one and
   129	524 of 532 in week two, so the sequence comparison really is against
   130	OptimoRoute's order.
   131	
   132	---
   133	
   134	## Scorecard
   135	
   136	| Gate | Threshold |
   137	|---|---|
   138	| Same tech | >= 95% |
   139	| Same day | >= 95% |
   140	| Route-day hours | within +-10% of actual |
   141	| Dropped visits | 0 |
   142	| Invented visits | 0 |
   143	| Weekend placements | 0 |
   144	
   145	Reported alongside: per-tech weekly hours, late bookings, ghost orders, and a
   146	per-route-day table.
   147	
   148	**Hours** are modelled with `travel.mjs` over each route-day in its own order,
   149	including the inbound leg from the tech's inferred start area and excluding the
   150	trip home, which the source data cannot pin down.
   151	
   152	The headline hours ratio moves for two reasons at once, a different board and a
   153	different stop order, so the scorecard also reports a **board-only** ratio: the
   154	actual day's stop set re-sequenced by our own sequencer. What remains is purely
   155	the board. On both golden weeks `keep-actual` scores exactly 1.00 on board-only
   156	hours across every route-day, which is the harness telling us it is wired right.
   157	
   158	**Sequence** is compared on the common stop set only: the stops a route-day has
   159	in both boards, ordered each way, timed with the same model.
   160	
   161	---
   162	
   163	## Baseline results
   164	
   165	### keep-actual — the oracle
   166	
   167	Proposes the tech and day each visit actually got. It exists to validate the
   168	harness, and it does.
   169	
   170	| | 2026-08-24 | 2026-08-31 |
   171	|---|---:|---:|
   172	| Due visits known at the cutoff | 552 | 532 |
   173	| Late bookings held out | 55 | 54 |
   174	| Same tech | 100% | 100% |
   175	| Same day | 100% | 100% |
   176	| Board-only hours within +-10% | 24/24 | 25/25 |
   177	| Board-only median ratio | 1.00 | 1.00 |
   178	| Dropped / invented / weekend | 0 / 0 / 0 | 0 / 0 / 0 |
   179	| Ghost OptimoRoute orders | 2 | 5 |
   180	
   181	The raw hours gate reads 21/24 and 21/25 rather than clean, and the reason is
   182	not the board. It is that the sequencer finishes the same day faster than the
   183	route that was held, which drags the ratio below 0.90 on a few days. Board-only
   184	is the number to read for a board; raw hours is a sequencer measurement wearing a
   185	board's clothes.
   186	
   187	### dominant-routeday — the static master route
   188	
   189	Each job goes to the tech and weekday it was most often served on before the
   190	golden week. No lookahead, no oracle. This is the crude master route, and it
   191	answers how far a fixed weekly pattern gets on its own.
   192	
   193	| | 2026-08-24 | 2026-08-31 |
   194	|---|---:|---:|
   195	| Same tech | 86.8% | 90.2% |
   196	| Same day | 69.2% | 75.9% |
   197	| Same tech **and** day | 62.9% | 71.8% |
   198	| Board-only hours within +-10% | 5/24 | 7/24 |
   199	| Board-only median ratio | 0.99 | 0.98 |
   200	| Board-only ratio spread | 0.48 – 1.78 | 0.65 – 1.39 |
   201	| Placed from the job's own history | 436 | 487 |
   202	| Placed from ZIP history | 108 | 44 |
   203	| Placed by nearest start area | 8 | 1 |
   204	| History available | 725 visits, 7 days | 1,329 visits, 12 days |
   205	
   206	### Reading it
   207	
   208	**A static master gets the tech roughly right and the day badly wrong.** Tech
   209	agreement sits at 87-90% while day agreement sits at 69-76%. Of the mismatches,
   210	roughly four in five are the day alone, with the tech correct. Territory is
   211	close to a fixed property of a job; the day is not. That is the cadence rules
   212	doing their work — activity and catches pull visits forward, and no fixed weekly
   213	pattern can reproduce that. A master route is a reasonable starting layout and a
   214	poor scheduler.
   215	
   216	**The static master's median hours look fine and its spread is ruinous.** The
   217	board-only median ratio is 0.99 and 0.98, near perfect, while only 5 of 24 and 7
   218	of 24 route-days land inside +-10%, with individual days between 0.48 and 1.78 of
   219	the hours that were really worked. Averaged over a week the work balances; on any
   220	given day a tech is at half load or seventy percent over. This is the single
   221	strongest argument in the backtest for keeping a capacity check in the engine
   222	rather than trusting a layout.
   223	
   224	**Late bookings are about 9% of the week**, 55 of 607 and 54 of 586. Roughly one
   225	visit in eleven in a given week did not exist when a Friday planner would have
   226	built it. Any design that assumes a week can be planned once on Friday and left
   227	alone needs an answer for that ninth visit.
   228	
   229	**The second week scores better than the first on every board metric**, and the
   230	likely reason is history depth: 12 days of completions available versus 7. A
   231	learned policy is still climbing at two weeks of history. Do not read a
   232	one-week-of-history result as the ceiling.
   233	
   234	### The sequencer, and why its win is not yet bankable
   235	
   236	Against the held OptimoRoute order, on the same stop set, our nearest-neighbour
   237	plus 2-opt plus Or-opt sequencer reports a median drive-time ratio of **0.87** on
   238	both golden weeks, beating OptimoRoute on 24 of 24 and 23 of 24 route-days.
   239	
   240	Treat that number with suspicion. OptimoRoute actually drove every leg in its own
   241	order, so those legs are real measurements sitting in the travel model's observed
   242	pair table. Any re-ordering invents legs nobody has driven, and those fall back
   243	to the haversine estimator, whose median per-leg error is 19.6% with a p90 of
   244	55%. The median share of legs our order has to estimate is **42.6%**; for
   245	OptimoRoute's own order it is **7.3%**. A sequencer minimising a noisy estimate
   246	will systematically pick the legs the estimate happens to understate.
   247	
   248	So the scorecard reports a **uniform-model control**: both orders timed with the
   249	estimator alone, neither side credited for having its legs already measured.
   250	Under that control the ratio moves to **0.92 and 0.90**, and the win narrows to
   251	22 of 24 and 21 of 24 route-days.
   252	
   253	An 8-10% drive-time saving is plausible and worth chasing. It is not proven here,
   254	because the sequencer is still being scored on the same estimator it optimises
   255	against. Proving it needs a real distance matrix for the stop pairs the sequencer
   256	wants to use, which is a network call and therefore out of scope for this stage.
   257	**Do not put the 13% figure in front of the owner. The defensible claim today is
   258	"8-10% under a conservative control, pending a real matrix".**
   259	
   260	---
   261	
   262	## Data problems that affect a fair backtest
   263	
   264	| Issue | Size | Effect |
   265	|---|---|---|
   266	| Single Jobber snapshot, so post-cutoff moves are invisible | 11 of 2,577 stops, 0.4% | Slightly flatters every policy |
   267	| Travel estimator error on unobserved legs | 19.6% median per leg, 42.6% of our legs | Flatters any re-ordering; handled by the uniform-model control |
   268	| OptimoRoute driver is not always who worked the route | 17 stops on 2026-08-28 | Handled by keying route-days off the completion stamp |
   269	| Ghost OptimoRoute orders with no Jobber visit | 2 and 5 | Counted, excluded from scoring |
   270	| Late bookings after the Friday cutoff | 55 and 54, about 9% | Held out of the due set, reported separately |
   271	| History depth | 7 days before week one, 12 before week two | Learned policies are still improving; not a ceiling |
   272	| One visit completed in the week before its own golden week | 1, week two | Creates a single out-of-week route-day, visible as `offWeekPlacements` |
   273	
   274	None of these blocks the backtest. The estimator bias is the only one that
   275	changes how a result should be stated, and the uniform-model control handles it.
   276	
   277	---
   278	
   279	## Adding a policy
   280	
   281	Drop a module in `scripts/policies/`:
   282	
   283	```js
   284	export const name = 'my-policy';
   285	export const description = 'One line for the scorecard header.';
   286	export const usesOracle = false;
   287	
   288	export function propose(snap) {
   289	  return {
   290	    assignments: snap.due.map((v) => ({ key: v.key, tech: '...', date: '2026-08-26' })),
   291	    notes: { anythingYouWantOnTheScorecard: true },
   292	  };
   293	}
   294	```
   295	
   296	It is picked up automatically by `--all` and by `--policy=my-policy`. Place every
   297	due visit: an unplaced visit is a drop and fails a gate. Read `snap.history`
   298	freely, it is already cut at the week's Monday. Do not read `snap.actual` unless
   299	the policy is an oracle and says so.
```

## [6] stages/S5-week-solve.md

```
     1	# S5 — `week-solve`: the S4 design, backtested
     2	
     3	Written 2026-09-19. The planning policy from S4 sections 2 and 5 is now a real
     4	policy in the harness (`scripts/policies/week-solve.mjs`), scored on both golden
     5	weeks against the board the field actually ran. Everything is offline. Run logs
     6	are in `backtest/logs/`; scorecards in `backtest/<week>/week-solve/` and
     7	`backtest/sens/<variant>/<week>/week-solve/`.
     8	
     9	```bash
    10	cd projects/briefs/route-engine/redesign
    11	node scripts/backtest.mjs --week=2026-08-24 --policy=week-solve
    12	node scripts/backtest.mjs --week=2026-08-31 --policy=week-solve
    13	```
    14	
    15	---
    16	
    17	## What the policy does
    18	
    19	**Layer 1 — the owner map, no lookahead.** For every job, the dominant tech over
    20	completed visits strictly before the golden week's Friday 14:00 PT cutoff, ties
    21	broken by the most recent. A tech off the week's roster does not count, so a
    22	handed-over book re-homes rather than vanishing. A job with no owner-bearing
    23	history is voted in by its ten nearest jobs that have one, weighted by inverse
    24	distance. `master-asbuilt.json`'s own `routeDay` is deliberately **not** used:
    25	it was derived over a window that contains both golden weeks.
    26	
    27	**Layer 2 — due windows.** Computed from the job's last completed visit before
    28	the cutoff, per the S4 state table: `[+5, +9]` days for active TMCP and for a
    29	Quick Fix series, `[+26, +35]` for quiet TMCP. Where the harness cannot
    30	determine the state offline, the window is the visit's own scheduled day plus or
    31	minus two weekdays. Every window carries its tier onto the scorecard.
    32	
    33	**Day-zones.** Per tech, k-medoids with k=5 over the coordinates of that tech's
    34	completed stops before the week, deterministic farthest-point seeding. Each zone
    35	takes the weekday its stops were most often served on, one weekday per zone,
    36	ties spread across the free weekdays. The zone's cycle time is that tech and
    37	weekday's median span-per-stop from `route-day-drive_2026-08-17_2026-09-17.json`,
    38	cut at the week start: 25 route-days of evidence before week one, 49 before week
    39	two. Every tech-weekday resolved at the `tech+weekday` tier in both weeks, so no
    40	cycle-time fallback was needed.
    41	
    42	**Layer 3 — the week.** Per tech: greedy by window urgency (fewest legal days
    43	first, then the window closing soonest), then a move-and-swap local search
    44	minimising capacity penalty (quadratic above 8.0 h, hard wall 9.5 h at zone
    45	cycle time times stops), zone distance in km from the day's medoid, and a small
    46	weekday-drift term. Owner tech and Monday-to-Friday are hard. A visit that
    47	cannot fit under the wall goes to `overflow` and is left unplaced, so it is
    48	counted as a drop rather than hidden. Sequencing is the harness's, identical for
    49	every policy.
    50	
    51	Weights, overridable by environment variable for sensitivity runs: capacity 30
    52	per squared hour above 8.0 (`WS_CAP_W`), compactness 1 per km (`WS_ZONE_W`),
    53	weekday drift 1 per drifted visit (`WS_DRIFT_W`), overdue lateness 2 per weekday
    54	(`WS_LATE_W`), overdue handling (`WS_OVERDUE=monday|week`, default `monday`).
    55	
    56	## What was added to the scorecard
    57	
    58	The harness now scores the S4 section 5 items for every policy, in
    59	`scripts/backtest.mjs` rather than a fork:
    60	
    61	- **Due-window compliance**, when a policy supplies `proposal.windows` — share
    62	  inside the raw window and inside the window clamped to the five weekdays,
    63	  broken out by window tier.
    64	- **Capacity** — route-days over 8 h and over 9.5 h on the harness's own
    65	  modelled travel-plus-service time, for the proposal and for the actual.
    66	- **Compactness** — route-days whose total route time is within 5% of the
    67	  OptimoRoute day, `travel.mjs` on both sides.
    68	- **Overflow** — from `proposal.overflow`.
    69	- **Late bookings** — promoted from a coverage line to a named gate, since it is
    70	  the add-queue load.
    71	
    72	`keep-actual` still scores 24/24 and 25/25 on board-only hours after the change,
    73	which is the harness saying it is still wired right.
    74	
    75	---
    76	
    77	## Scorecard — 2026-08-24
    78	
    79	| | keep-actual | dominant-routeday | **week-solve** |
    80	|---|---:|---:|---:|
    81	| Due visits known at the cutoff | 552 | 552 | 552 |
    82	| Placed | 552 | 552 | **536** |
    83	| Dropped (= overflow) | 0 | 0 | **16** |
    84	| Same tech | 100% | 86.8% | **87.5%** |
    85	| Same day | 100% | 69.2% | **72.8%** |
    86	| Same tech and day | 100% | 62.9% | **64.6%** |
    87	| Inside the due window, clamped to the week | - | - | **100%** |
    88	| Inside the raw due window | - | - | **98.3%** |
    89	| Route-day hours within +-10% | 21/24 | 6/24 | **13/24** |
    90	| Board-only hours within +-10% | 24/24 | 5/24 | **9/24** |
    91	| Board-only median ratio | 1.00 | 0.99 | **1.01** |
    92	| Compactness: route-day time within +-5% | 13/24 | 2/24 | **5/24** |
    93	| Route-day ratio range | 0.87 - 1.00 | 0.43 - 1.73 | **0.36 - 1.53** |
    94	| Route-days over 9.5 h (modelled travel + service) | 1/24 | 5/25 | **3/25** |
    95	| Route-days over 9.5 h (at measured cycle time) | - | - | **0/25** |
    96	| Longest route-day, modelled hours | 10.2 | 11.3 | **11.4** |
    97	| Weekend placements | 0 | 0 | **0** |
    98	| Late bookings held out | 55 | 55 | 55 |
    99	
   100	## Scorecard — 2026-08-31
   101	
   102	| | keep-actual | dominant-routeday | **week-solve** |
   103	|---|---:|---:|---:|
   104	| Due visits known at the cutoff | 532 | 532 | 532 |
   105	| Placed | 532 | 532 | **528** |
   106	| Dropped (= overflow) | 0 | 0 | **4** |
   107	| Same tech | 100% | 90.2% | **89.2%** |
   108	| Same day | 100% | 75.9% | **47.7%** |
   109	| Same tech and day | 100% | 71.8% | **45.3%** |
   110	| Inside the due window, clamped to the week | - | - | **100%** |
   111	| Inside the raw due window | - | - | **84.5%** |
   112	| Route-day hours within +-10% | 21/25 | 9/24 | **5/24** |
   113	| Board-only hours within +-10% | 25/25 | 7/24 | **4/24** |
   114	| Board-only median ratio | 1.00 | 0.98 | **1.09** |
   115	| Compactness: route-day time within +-5% | 14/25 | 5/24 | **2/24** |
   116	| Route-day ratio range | 0.82 - 1.00 | 0.62 - 1.32 | **0.22 - 1.77** |
   117	| Route-days over 9.5 h (modelled travel + service) | 3/25 | 2/25 | **6/25** |
   118	| Route-days over 9.5 h (at measured cycle time) | - | - | **0/25** |
   119	| Longest route-day, modelled hours | 10.2 | 10.9 | **12.8** |
   120	| Weekend placements | 0 | 0 | **0** |
   121	| Late bookings held out | 54 | 54 | 54 |
   122	
   123	---
   124	
   125	## Window tiers and fallback counts
   126	
   127	How many due visits got each kind of window, and how often the owner map had to
   128	fall back to a neighbour vote.
   129	
   130	| | 2026-08-24 | 2026-08-31 |
   131	|---|---:|---:|
   132	| Owner from a dominant tech in the history | 623 jobs | 787 jobs |
   133	| Owner from the 10-nearest-neighbour vote | **125 jobs** | **47 jobs** |
   134	| Owner from the roster floor (no coordinate) | 0 | 0 |
   135	| Median dominant-tech share, where measurable | 1.00 | 1.00 |
   136	| History available before the cutoff | 725 visits, 7 days | 1,329 visits, 12 days |
   137	
   138	| Window tier | 2026-08-24 | 2026-08-31 | Window used |
   139	|---|---:|---:|---|
   140	| `active-measured` — last delivered gap <= 12 d | 48 | 237 | `[+5, +9]` |
   141	| `quiet-measured` — last delivered gap >= 20 d | **0** | **0** | `[+26, +35]` |
   142	| `active-assumed` — a TMCP anchor, only one visit before the cutoff | 250 | 119 | `[+5, +9]` |
   143	| `active-series` — Quick Fix | 112 | 117 | `[+5, +9]` |
   144	| `ambiguous-gap` — gap 13-19 d | 0 | 1 | scheduled +-2 |
   145	| `other-product` — barter, bid, other | 17 | 11 | scheduled +-2 |
   146	| `no-anchor` — no completed visit before the cutoff | 125 | 47 | scheduled +-2 |
   147	| **Windows clamped: already overdue at the cutoff** | **9** | **82** | window closed before Monday |
   148	| Windows clamped: opening after the week | 0 | 0 | |
   149	
   150	Two things in that table matter more than the rest.
   151	
   152	**No job in either week reads as quiet.** Of the 64 and 339 jobs with two or
   153	more completed visits before the cutoff, **every single measured gap is 12 days
   154	or under**. The `[+26, +35]` quiet branch never fired. The recurring series does
   155	not help either: 416 of 551 due jobs in week one carry a `Monthly on the Nth
   156	weekday` recurrence while the field delivers them weekly, so the recurrence
   157	string describes the template, not the cadence. That is S3b's "the office runs
   158	one cadence" and "nobody re-sizes the master" showing up from a different angle.
   159	
   160	**The design's quiet/active split cannot be tested offline.** It needs the
   161	per-visit note, which the Jobber pull does not carry. Everything scored here
   162	tests the active branch and the fallback.
   163	
   164	---
   165	
   166	## Sensitivity
   167	
   168	Same policy, one weight changed. `overdue-week` is not a weight but the handling
   169	of a window that closed before the week opened: the default puts those visits on
   170	Monday, the only day that honours the window at all; `week` lets them spread
   171	across the week with a small cost per day of further delay.
   172	
   173	### 2026-08-24
   174	
   175	| Variant | Same tech | Same day | Hours +-10% | Board +-10% | Compact +-5% | Over 9.5 h | Longest day | Overflow |
   176	|---|---:|---:|---:|---:|---:|---:|---:|---:|
   177	| base | 87.5% | 72.8% | 13/24 | 9/24 | 5/24 | 3/25 | 11.4 | 16 |
   178	| drift weight x5 | 87.5% | **75.4%** | 13/24 | 9/24 | **7/24** | 3/25 | 11.4 | 16 |
   179	| compactness weight x0.5 | 87.5% | 73.1% | 13/24 | 9/24 | 5/24 | **2/25** | 11.4 | 16 |
   180	| overdue spread across the week | 87.5% | 74.4% | 11/24 | **10/24** | 6/24 | 3/25 | **10.8** | 16 |
   181	
   182	### 2026-08-31
   183	
   184	| Variant | Same tech | Same day | Hours +-10% | Board +-10% | Compact +-5% | Over 9.5 h | Longest day | Overflow |
   185	|---|---:|---:|---:|---:|---:|---:|---:|---:|
   186	| base | 89.2% | 47.7% | 5/24 | 4/24 | 2/24 | 6/25 | 12.8 | 4 |
   187	| drift weight x5 | 89.2% | **51.9%** | 5/24 | 4/24 | 3/24 | 6/25 | 12.8 | 4 |
   188	| compactness weight x0.5 | 89.2% | 48.7% | 6/24 | 5/24 | 3/24 | **5/25** | 12.5 | 4 |
   189	| overdue spread across the week | 89.2% | **60.0%** | **7/24** | **6/24** | 2/24 | **4/25** | **10.7** | 4 |
   190	
   191	**Nothing moves the tech number**, because the owner map is fixed before the
   192	solve and no weight can reach it.
   193	
   194	**The weekday-drift weight is the only lever on same-day**, and it is a weak
   195	one: five times the weight buys 2.6 and 4.2 points. Day agreement is set by the
   196	window, not by the drift term.
   197	
   198	**Halving the compactness weight slightly improves capacity** and, in week two,
   199	the hours gates. The zone-distance term and the capacity term genuinely trade
   200	against each other, and the base weighting leans a little too far toward
   201	compactness.
   202	
   203	**The overdue rule is the single biggest choice in the whole policy.** Spreading
   204	82 overdue visits across week two instead of stacking them on Monday moves same
   205	day from 47.7% to 60.0%, board-only hours from 4/24 to 6/24, days over the wall
   206	from 6 to 4, and the longest modelled day from 12.8 h to 10.7 h. The strict
   207	reading of "nothing leaves its window" is what produces the worst day in the
   208	entire backtest.
   209	
   210	---
   211	
   212	## Does the design meet S4 section 5
   213	
   214	| S4 section 5 requirement | Week one | Week two | Verdict |
   215	|---|---|---|---|
   216	| Same tech >= 95%, owner map with no lookahead | 87.5% | 89.2% | **No** |
   217	| Every visit inside its due window | 100% clamped, 98.3% raw | 100% clamped, 84.5% raw | **Yes, with a caveat** |
   218	| Zero weekend | 0 | 0 | Yes |
   219	| Zero drops | 16 overflow | 4 overflow | **No** |
   220	| Hours per route-day within +-10% of the field | 13/24 | 5/24 | **No** |
   221	| No day over 9.5 h at measured cycle time | 0/25 | 0/25 | Yes, by construction |
   222	| No day over 9.5 h, modelled travel + service | 3/25 | 6/25 | **No** |
   223	| Compactness within 5% of the OptimoRoute day | 5/24 | 2/24 | **No** (see below) |
   224	| Same day: reported, not gated | 72.8% | 47.7% | Reported |
   225	| Late bookings reported separately | 55 | 54 | Yes |
   226	
   227	### Reading it
   228	
   229	**The owner map is the design's weakest link, and the backtest version is not
   230	the design's version.** 87.5% and 89.2% same tech, against a 95% target and
   231	against `dominant-routeday`'s 86.8% and 90.2% — that is, deriving ownership
   232	from history is worth nothing over the crude static master. The mismatch list
   233	says why. In week two the largest single group is 24 visits proposed for Cory
   234	Ventura that Luke LaVergne actually worked, and that is the Friday 2026-08-28
   235	cover day S5 already documents: OptimoRoute held 17 stops under Luke and Cory
   236	worked all of them, so the dominant-tech vote learned Cory and handed him a book
   237	that was never his. One cover day flipped ownership on two dozen customers. This
   238	is precisely the failure S4 section 2 legislates against — *"no script ever
   239	derives ownership on the fly again"*, ownership on the customer record, changed
   240	only by a dated handover. The backtest cannot test the design's owner map
   241	because that map does not exist yet; it can only show that the thing the design
   242	forbids does not clear 95%. **Sign the owner map (S4 decision 1) and this number
   243	is not a modelling question any more.**
   244	
   245	**The due-window machinery works, and there is nothing quiet to test it on.**
   246	Every placed visit sits inside its window once the window is clamped to the
   247	week, in both weeks. The raw numbers, 98.3% and 84.5%, are entirely the overdue
   248	backlog: 9 visits in week one and 82 in week two had a window that closed before
   249	Monday. That 82 is 15.4% of the week, which lands on top of S3b's independently
   250	measured 15% hard-overdue rate. The design's window arithmetic reproduces the
   251	backlog the business already has. What it cannot do offline is tell active from
   252	quiet: no gap in either golden week exceeds 12 days, so the `[+26, +35]` branch
   253	never ran, and 250 and 119 visits rest on `active-assumed` — a TMCP anchor with
   254	only one completed visit before the cutoff, which the delivered data says is
   255	weekly but does not prove per job. **The state machine in S4 section 2 needs the
   256	per-visit note, and the note is not in the Jobber pull. That is the one piece of
   257	the design this harness cannot check.**
   258	
   259	**Capacity is where the design is genuinely right and genuinely unfinished.**
   260	The hard wall does what it says: zero route-days over 9.5 h at measured cycle
   261	time, in both weeks, by construction. The overflow it produces is not noise, it
   262	is a finding. In week one Alias Franks's book is 134 visits against a 118-stop
   263	wall capacity — 46.6 modelled hours of work against a five-day week — while Cory
   264	Ventura's 114 visits sit against 185 stops of capacity, 28.1 hours, 71 stops of
   265	slack. Week two is the same shape: Alias 114 against 110, Cory 123 against 186.
   266	**Every overflow visit in both golden weeks belongs to one tech, and the float
   267	named in S4 section 2 has room for all of them on both weeks.** The design's
   268	answer, an overflow list that goes to Spencer with the float as the proposed
   269	taker, is exactly the right output; the backtest just shows it will be used
   270	every week, not occasionally.
   271	
   272	**The two capacity models disagree, and the wall is only as good as the one it
   273	is built on.** At measured cycle time no day exceeds 9.5 h. On the harness's own
   274	travel-plus-service model, 3 and 6 days do, topping out at 12.8 h. The gap is
   275	worst for the fastest techs: Cory's measured Monday cycle is 14.1 minutes a
   276	stop, so 36 stops reads as 8.4 h at cycle time and 12.1 h on travel plus service
   277	with OptimoRoute's service durations. S2 already found OptimoRoute over-prices
   278	drive or service by about 20%, and this is that same disagreement arriving in
   279	the capacity check. **Before the wall can be trusted as an operational limit,
   280	the cycle time behind it has to come from FleetSharp as S4 section 4 specifies,
   281	not from span-per-stop over 25 route-days.**
   282	
   283	**The compactness gate as written cannot be passed, by anything.** `keep-actual`
   284	— the oracle, the exact board the field ran — scores 13/24 and 14/25 on
   285	"route-day time within 5% of the OptimoRoute day". The reason is the sequencer,
   286	not the board: our order finishes the same stop set faster, which pushes the
   287	ratio below 0.95 on days where nothing about the board changed. The effective
   288	ceiling in this harness is about 55%, so `week-solve`'s 5/24 and 2/24 should be
   289	read against 13/24 and 14/25, not against 24/24. The board-only median ratio,
   290	1.01 and 1.09, is the honest compactness read, and it says week one's board is
   291	the same size as the field's and week two's is 9% bigger. **Restate the S4
   292	section 5 compactness gate against the board-only ratio, or against a real
   293	distance matrix, before holding any policy to it.**
   294	
   295	**Same day is not a target and should not become one.** 72.8% in week one and
   296	47.7% in week two, and the two numbers differ for a reason worth naming: week
   297	one is dominated by fallback windows centred on the office's own scheduled day,
   298	which partly copies the answer, while week two has enough history for 237
   299	`active-measured` windows computed from the last visit alone. The moment the
   300	window stops borrowing the office's choice, day agreement drops by 25 points.
   301	That is the design working, not failing — S4 already says the field's day choice
   302	was "wherever there was room" — but it does mean **any future scorecard that
   303	quotes same day has to say which window tier produced it.**
   304	
   305	### What to change
   306	
   307	1. **Sign the owner map** (S4 decision 1). Derived ownership is worth nothing
   308	   over the crude master and is corrupted by a single cover day.
   309	2. **Get the visit note into the pull.** Without it the active/quiet state
   310	   machine is untestable and 369 of the 1,064 placed visits across the two weeks
   311	   rest on an assumed state.
   312	3. **Rewrite the overdue rule in S4 section 2.** "Nothing leaves its window" has
   313	   no meaning for a visit whose window already closed. Spreading the backlog
   314	   across the week beats stacking it on Monday on every metric that moved.
   315	4. **Move cycle time to FleetSharp** before the 9.5 h wall is treated as real.
   316	   Two defensible models of the same day differ by up to 40% on the fastest
   317	   tech.
   318	5. **Re-state the compactness gate** against the board-only ratio. The oracle
   319	   fails the current one.
   320	6. **Plan for the overflow, weekly.** It is structural, it is one tech, and the
   321	   float has the room.
```

## [7] stages/S1-travel-model.md

```
     1	# S1 — Travel model
     2	
     3	Offline travel-time model built from 24 pulled OptimoRoute route-days so the backtest can
     4	sequence and time routes with no API calls.
     5	
     6	- Builder: `scripts/build-travel-model.mjs` → `data/travel-model.json` (1.9 MB)
     7	- Lookup: `scripts/travel.mjs` — `travel(from, to, driver)` and `routeTime(stops, driver)`
     8	- Logs: `data/build-travel-model.log`, `data/travel-selftest.log`
     9	
    10	## Coverage
    11	
    12	| Item | Value |
    13	|---|---|
    14	| Route-days with routes | 23 of 24 (2026-09-07 is empty, Labor Day) |
    15	| Routes / stops / legs | 113 / 2,577 / 2,464 |
    16	| Distinct places (lat,lng to 5 dp) | 941, of which 241 were visited once |
    17	| Observed pairs, unordered | 1,676 (1,156 seen once) |
    18	| Observed pairs, directed A→B | 1,900 (1,479 seen once) |
    19	| Pairs driven both ways | 224, differing by a median 4.4% |
    20	
    21	The first stop of every route carries an inbound leg from an unknown origin. There is no
    22	depot in the data, so those 113 legs are excluded from pairs and the fit, and used only to
    23	derive route start.
    24	
    25	**The coverage number that matters is 11.7%, not 0.38%.** Against all 442,270 possible place
    26	pairs, 0.38% are observed, but that denominator is meaningless. The real question is what the
    27	backtest will ask for: re-sequencing a day freely needs every ordered pair inside that day's
    28	stop set, and only **11.7%** of those were ever driven (per route: median 12.0%, range 8.2 to
    29	33.3%). Roughly seven in eight legs the backtest prices will come from the estimator.
    30	
    31	## Estimator quality
    32	
    33	`metres = a + b × haversine`, then `seconds = c + d × metres`, fitted by least squares per
    34	driver because each driver's ground has its own road density. Error is end-to-end, from
    35	straight-line distance through to predicted seconds, on legs of 60 seconds or longer.
    36	
    37	| Driver | Legs | R² metres | R² seconds | Median abs error |
    38	|---|---|---|---|---|
    39	| Luke LaVergne | 406 | 0.886 | 0.926 | 17.8% |
    40	| Robert Norton | 488 | 0.791 | 0.918 | 19.0% |
    41	| Alias Franks | 518 | 0.888 | 0.851 | 19.3% |
    42	| Tavis Alexander | 558 | 0.837 | 0.876 | 19.7% |
    43	| Cory Ventura | 494 | 0.801 | 0.864 | 23.1% |
    44	| ALL (unknown-driver fallback) | 2,464 | 0.881 | 0.905 | 21.2% |
    45	
    46	All five are inside the 25% target. Cory is worst because his West Seattle and Renton ground
    47	is dense, so short legs dominate and a straight-line fit has little to work with.
    48	
    49	## Self-test
    50	
    51	Replaying all 113 real route-days through `routeTime`:
    52	
    53	| | Legs exact | Median route error | p90 | Max |
    54	|---|---|---|---|---|
    55	| Pairs + estimator | 2,353 / 2,464 (95.5%) | 0.00 min | 1.99 min | 4.89 min |
    56	| Estimator only | 0 | 1.73% | — | — |
    57	
    58	The 111 legs that do not reproduce exactly are all directed pairs driven more than once at
    59	different times of day; the model stores the median, so it lands a median 28 seconds off
    60	(max 172 s). Lookup order is directed pair, then the same pair driven in reverse, then the
    61	fit. Without the directed layer only 82.8% of legs replayed exactly, so direction matters.
    62	
    63	Route **totals** hold up far better than individual legs: with pairs disabled entirely, per-leg
    64	error runs 19.6% but whole-route error is 1.73%, because over- and under-estimates cancel
    65	across 20-plus legs. The backtest can trust day length; it should not trust any single leg.
    66	
    67	## Data quirks
    68	
    69	- **Barbee Mill is one 11-minute stop, not a cluster.** Job #7964 appears once a week on Tavis
    70	  as a single order at 4205 Williams Avenue North with 11 minutes of service. The 120-minute
    71	  cluster price in the operating rules is not in this data, so the backtest will under-time it.
    72	- **Service durations confirm the directed per-tech rates.** Cory runs 12 min check / 24 set,
    73	  everyone else 15 / 30. Two anomalies: 40 Tavis stops at 11 min and 23 Robert stops at 12 min
    74	  (Cory's rate), most likely orders created before a reassignment.
    75	- **9 zero-length legs**, all pairs of stops sharing one rounded coordinate. `travel()` returns
    76	  zero for these rather than estimating.
    77	- **190 distinct place pairs sit within 300 m of each other** — neighbor properties that the
    78	  5 dp rounding correctly keeps apart.
    79	- **2 legs over 60 minutes**, both Luke's peninsula and Yelm runs, and 17 over 30 minutes. They
    80	  are real, not errors, and they dominate his fit's intercept.
    81	- Every stop has coordinates, a service duration, and an in-sequence stop number. No route has
    82	  a single stop. Nothing was dropped for bad data.
```

## [8] scripts/backtest.mjs

```
     1	#!/usr/bin/env node
     2	/**
     3	 * backtest.mjs
     4	 *
     5	 * Replays a golden week against a routing policy and scores the result against
     6	 * what actually ran.
     7	 *
     8	 *   node scripts/backtest.mjs --week=2026-08-24 --policy=keep-actual
     9	 *   node scripts/backtest.mjs --week=2026-08-31 --policy=dominant-routeday
    10	 *   node scripts/backtest.mjs --all                      every policy x every golden week
    11	 *
    12	 * Flags
    13	 *   --week=YYYY-MM-DD    the Monday of the golden week (default 2026-08-24)
    14	 *   --policy=<name>      a module under scripts/policies/ (default keep-actual)
    15	 *   --all                run every policy against every golden week
    16	 *   --out=<dir>          output root (default redesign/backtest)
    17	 *   --no-orOpt           2-opt only, skip the Or-opt pass
    18	 *   --quiet              scorecard only, no per-route-day table
    19	 *
    20	 * Pipeline: load -> snapshot as of Friday 14:00 PT -> policy -> sequence ->
    21	 * score -> write backtest/<week>/<policy>/{scorecard.md,scorecard.json,board.json}.
    22	 *
    23	 * Offline only. Writes nothing outside the output root.
    24	 */
    25	
    26	import fs from 'node:fs';
    27	import path from 'node:path';
    28	import { fileURLToPath, pathToFileURL } from 'node:url';
    29	import { buildSnapshot, weekDays, dowOf, isWeekend, ptMinutes as ptMinutesOf, REDESIGN } from './backtest-data.mjs';
    30	import { sequenceStops, routeMinutes, pathSeconds, pathMetres, legMix, clearLegCache } from './sequence.mjs';
    31	
    32	const __dirname = path.dirname(fileURLToPath(import.meta.url));
    33	const POLICY_DIR = path.join(__dirname, 'policies');
    34	const DEFAULT_OUT = path.join(REDESIGN, 'backtest');
    35	
    36	export const GOLDEN_WEEKS = ['2026-08-24', '2026-08-31'];
    37	
    38	const THRESHOLDS = {
    39	  sameTechPct: 95,
    40	  sameDayPct: 95,
    41	  hoursTolerancePct: 10,
    42	  // S4 section 5: compactness is "total route time per day within 5% of the
    43	  // OptimoRoute route the field drove", and the hard wall is 9.5 h.
    44	  compactnessTolerancePct: 5,
    45	  wallHours: 9.5,
    46	  softHours: 8.0,
    47	};
    48	
    49	// ---------------------------------------------------------------- helpers
    50	
    51	const r1 = (n) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10) / 10);
    52	const r2 = (n) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 100) / 100);
    53	const pct = (num, den) => (den > 0 ? (num / den) * 100 : null);
    54	
    55	function median(xs) {
    56	  const s = xs.filter(Number.isFinite).sort((a, b) => a - b);
    57	  if (!s.length) return null;
    58	  const m = s.length >> 1;
    59	  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    60	}
    61	
    62	function parseArgs(argv) {
    63	  const out = { week: GOLDEN_WEEKS[0], policy: 'keep-actual', out: DEFAULT_OUT, orOpt: true };
    64	  for (const a of argv) {
    65	    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    66	    if (!m) continue;
    67	    const [, k, v] = m;
    68	    if (k === 'week') out.week = v;
    69	    else if (k === 'policy') out.policy = v;
    70	    else if (k === 'out') out.out = path.resolve(v);
    71	    else if (k === 'all') out.all = true;
    72	    else if (k === 'quiet') out.quiet = true;
    73	    else if (k === 'no-orOpt') out.orOpt = false;
    74	    else if (k === 'help') out.help = true;
    75	  }
    76	  return out;
    77	}
    78	
    79	export function listPolicies() {
    80	  return fs
    81	    .readdirSync(POLICY_DIR)
    82	    .filter((f) => f.endsWith('.mjs'))
    83	    .map((f) => f.replace(/\.mjs$/, ''))
    84	    .sort();
    85	}
    86	
    87	async function loadPolicy(name) {
    88	  const file = path.join(POLICY_DIR, `${name}.mjs`);
    89	  if (!fs.existsSync(file)) {
    90	    throw new Error(`unknown policy "${name}". Available: ${listPolicies().join(', ')}`);
    91	  }
    92	  const mod = await import(pathToFileURL(file).href);
    93	  if (typeof mod.propose !== 'function') throw new Error(`policy ${name} exports no propose()`);
    94	  return mod;
    95	}
    96	
    97	// ---------------------------------------------------------------- scoring
    98	
    99	/**
   100	 * Score a proposed board against the actual board.
   101	 * @param {object} snap
   102	 * @param {{assignments:Array<{key,tech,date}>, notes?:object}} proposal
   103	 */
   104	export function score(snap, proposal, opts = {}) {
   105	  const dueByKey = new Map(snap.due.map((v) => [v.key, v]));
   106	  const proposed = new Map();
   107	  const duplicates = [];
   108	  const invented = [];
   109	
   110	  for (const a of proposal.assignments) {
   111	    if (!dueByKey.has(a.key)) {
   112	      invented.push(a.key);
   113	      continue;
   114	    }
   115	    if (proposed.has(a.key)) duplicates.push(a.key);
   116	    proposed.set(a.key, a);
   117	  }
   118	  const dropped = [...dueByKey.keys()].filter((k) => !proposed.has(k));
   119	
   120	  // ---- coverage and placement
   121	  const weekend = [];
   122	  const offWeek = [];
   123	  for (const [k, a] of proposed) {
   124	    if (isWeekend(a.date)) weekend.push({ key: k, date: a.date, tech: a.tech });
   125	    else if (!snap.daySet.has(a.date)) offWeek.push({ key: k, date: a.date, tech: a.tech });
   126	    if (!snap.techs.includes(a.tech)) offWeek.push({ key: k, date: a.date, tech: a.tech, reason: 'tech off roster' });
   127	  }
   128	
   129	  // ---- tech / day agreement, against both actual definitions
   130	  const agree = {
   131	    run: { tech: 0, day: 0, both: 0, n: 0 },
   132	    held: { tech: 0, day: 0, both: 0, n: 0 },
   133	  };
   134	  const mismatches = [];
   135	  let noActual = 0;
   136	  for (const [k, a] of proposed) {
   137	    const act = snap.actual.get(k);
   138	    const held = snap.optimoHeld.get(k);
   139	    if (!act) noActual += 1;
   140	    if (act && act.tech && act.date) {
   141	      agree.run.n += 1;
   142	      const t = act.tech === a.tech;
   143	      const d = act.date === a.date;
   144	      if (t) agree.run.tech += 1;
   145	      if (d) agree.run.day += 1;
   146	      if (t && d) agree.run.both += 1;
   147	      if (!t || !d) {
   148	        mismatches.push({
   149	          key: k,
   150	          title: dueByKey.get(k)?.title,
   151	          zip: dueByKey.get(k)?.zip,
   152	          proposedTech: a.tech,
   153	          actualTech: act.tech,
   154	          proposedDate: a.date,
   155	          actualDate: act.date,
   156	          actualSource: act.source,
   157	          wrong: [!t ? 'tech' : null, !d ? 'day' : null].filter(Boolean).join('+'),
   158	        });
   159	      }
   160	    }
   161	    if (held) {
   162	      agree.held.n += 1;
   163	      const t = held.tech === a.tech;
   164	      const d = held.date === a.date;
   165	      if (t) agree.held.tech += 1;
   166	      if (d) agree.held.day += 1;
   167	      if (t && d) agree.held.both += 1;
   168	    }
   169	  }
   170	
   171	  // ---- build proposal route-days and sequence them
   172	  const propRouteDays = new Map(); // `${tech}|${date}` -> stops
   173	  for (const [k, a] of proposed) {
   174	    const v = dueByKey.get(k);
   175	    const id = `${a.tech}|${a.date}`;
   176	    if (!propRouteDays.has(id)) propRouteDays.set(id, []);
   177	    propRouteDays.get(id).push({
   178	      key: k,
   179	      lat: v.lat,
   180	      lng: v.lng,
   181	      serviceMin: snap.serviceMin.get(k) ?? 15,
   182	      title: v.title,
   183	      zip: v.zip,
   184	    });
   185	  }
   186	
   187	  const sequenced = new Map();
   188	  for (const [id, stops] of propRouteDays) {
   189	    const tech = id.split('|')[0];
   190	    const start = snap.startAreas[tech] || null;
   191	    const res = sequenceStops(stops, tech, start, { orOpt: opts.orOpt !== false });
   192	    sequenced.set(id, { tech, date: id.split('|')[1], stops: res.order, seqMeta: res, start });
   193	  }
   194	
   195	  // ---- actual route-days.
   196	  //
   197	  // Keyed off the ACTUAL BOARD (who really worked the stop, from the completion
   198	  // stamp), not off the OptimoRoute driver name. Those two disagree whenever a
   199	  // tech covers another tech's day — on 2026-08-28 OptimoRoute held 17 stops
   200	  // under one driver and a different tech worked every one of them. Keying off
   201	  // the OR driver would invent a phantom empty day for one tech and an
   202	  // unscoreable day for the other.
   203	  //
   204	  // Ordering inside the day is OptimoRoute's engineered stop order wherever the
   205	  // stop was routed that same date, so the sequence comparison really is
   206	  // "our order vs OptimoRoute's order". Where no OR stop exists it falls back
   207	  // to the completion-stamp order, i.e. the order the tech actually drove.
   208	  const actualRouteDays = new Map();
   209	  const orderSource = { optimo: 0, stamp: 0, scheduled: 0 };
   210	  for (const v of snap.due) {
   211	    const act = snap.actual.get(v.key);
   212	    if (!act || !act.tech || !act.date) continue;
   213	    const id = `${act.tech}|${act.date}`;
   214	    if (!actualRouteDays.has(id)) {
   215	      actualRouteDays.set(id, {
   216	        tech: act.tech,
   217	        date: act.date,
   218	        stops: [],
   219	        start: snap.startAreas[act.tech] || null,
   220	      });
   221	    }
   222	    const held = snap.optimoHeld.get(v.key);
   223	    let rank;
   224	    let src;
   225	    if (held && held.date === act.date) {
   226	      rank = held.seq;
   227	      src = 'optimo';
   228	    } else if (act.completedAt != null) {
   229	      rank = 10000 + (ptMinutesOf(act.completedAt) ?? 0);
   230	      src = 'stamp';
   231	    } else {
   232	      rank = 20000 + (ptMinutesOf(v.startAt) ?? 0);
   233	      src = 'scheduled';
   234	    }
   235	    orderSource[src] += 1;
   236	    actualRouteDays.get(id).stops.push({
   237	      key: v.key,
   238	      lat: v.lat,
   239	      lng: v.lng,
   240	      serviceMin: snap.serviceMin.get(v.key) ?? 15,
   241	      rank,
   242	      orderSource: src,
   243	    });
   244	  }
   245	  for (const rd of actualRouteDays.values()) rd.stops.sort((a, b) => a.rank - b.rank);
   246	
   247	  // ---- per route-day scoring
   248	  const routeDays = [];
   249	  const allIds = new Set([...sequenced.keys(), ...actualRouteDays.keys()]);
   250	  for (const id of [...allIds].sort()) {
   251	    const p = sequenced.get(id);
   252	    const a = actualRouteDays.get(id);
   253	    const [tech, date] = id.split('|');
   254	    const start = (p || a).start;
   255	
   256	    const pm = p ? routeMinutes(p.stops, tech, start) : null;
   257	    const am = a ? routeMinutes(a.stops, tech, start) : null;
   258	
   259	    // The same actual stop set, re-ordered by OUR sequencer. Comparing the
   260	    // proposal against this isolates board composition (who works what, when)
   261	    // from sequencing (what order they drive it in). Without it, a sequencer
   262	    // that simply beats OptimoRoute looks like a board that got the hours wrong.
   263	    let arm = null;
   264	    if (a && a.stops.length > 1) {
   265	      const rs = sequenceStops(a.stops, tech, start, { orOpt: opts.orOpt !== false });
   266	      arm = routeMinutes(rs.order, tech, start);
   267	    } else if (a) {
   268	      arm = am;
   269	    }
   270	
   271	    // sequence quality on the COMMON stop set only: same stops, two orders
   272	    let seqCmp = null;
   273	    if (p && a) {
   274	      const aKeys = new Set(a.stops.map((s) => s.key));
   275	      const common = p.stops.filter((s) => aKeys.has(s.key));
   276	      if (common.length >= 3) {
   277	        const commonKeys = new Set(common.map((s) => s.key));
   278	        const actualOrder = a.stops.filter((s) => commonKeys.has(s.key));
   279	        const pSec = pathSeconds(common, tech, start);
   280	        const aSec = pathSeconds(actualOrder, tech, start);
   281	        const pM = pathMetres(common, tech, start);
   282	        const aM = pathMetres(actualOrder, tech, start);
   283	        // Control: time both orders with the haversine estimator only. The
   284	        // actual order's legs were all really driven, so they sit in the
   285	        // observed-pair table; a re-ordering invents legs nobody has driven and
   286	        // those fall back to the estimator, whose median per-leg error is ~20%.
   287	        // Scoring the mixed model therefore flatters any re-ordering. Under the
   288	        // uniform model neither order gets that advantage.
   289	        const pSecU = pathSeconds(common, tech, start, true);
   290	        const aSecU = pathSeconds(actualOrder, tech, start, true);
   291	        const pMix = legMix(common, tech, start);
   292	        const aMix = legMix(actualOrder, tech, start);
   293	        seqCmp = {
   294	          commonStops: common.length,
   295	          proposalDriveMin: r1(pSec / 60),
   296	          actualDriveMin: r1(aSec / 60),
   297	          driveRatio: aSec > 0 ? r2(pSec / aSec) : null,
   298	          proposalMiles: r1(pM / 1609.344),
   299	          actualMiles: r1(aM / 1609.344),
   300	          distanceRatio: aM > 0 ? r2(pM / aM) : null,
   301	          uniformDriveRatio: aSecU > 0 ? r2(pSecU / aSecU) : null,
   302	          proposalEstimatedLegPct: r1(pMix.estimatedPct),
   303	          actualEstimatedLegPct: r1(aMix.estimatedPct),
   304	        };
   305	      }
   306	    }
   307	
   308	    const hoursRatio = pm && am && am.totalMin > 0 ? pm.totalMin / am.totalMin : null;
   309	    const boardRatio = pm && arm && arm.totalMin > 0 ? pm.totalMin / arm.totalMin : null;
   310	    routeDays.push({
   311	      id,
   312	      tech,
   313	      date,
   314	      dow: dowOf(date),
   315	      proposal: pm
   316	        ? {
   317	            stops: pm.stops,
   318	            driveMin: r1(pm.travelMin),
   319	            serviceMin: r1(pm.serviceMin),
   320	            totalMin: r1(pm.totalMin),
   321	            hours: r2(pm.totalMin / 60),
   322	            miles: r1(pm.travelMiles),
   323	            observedLegs: pm.observedLegs,
   324	            estimatedLegs: pm.estimatedLegs,
   325	            nnImprovedPct: r1(p.seqMeta.improvedPct),
   326	          }
   327	        : null,
   328	      actual: am
   329	        ? {
   330	            stops: am.stops,
   331	            driveMin: r1(am.travelMin),
   332	            serviceMin: r1(am.serviceMin),
   333	            totalMin: r1(am.totalMin),
   334	            hours: r2(am.totalMin / 60),
   335	            miles: r1(am.travelMiles),
   336	          }
   337	        : null,
   338	      actualResequenced: arm
   339	        ? { driveMin: r1(arm.travelMin), totalMin: r1(arm.totalMin), hours: r2(arm.totalMin / 60) }
   340	        : null,
   341	      hoursRatio: r2(hoursRatio),
   342	      hoursWithinTolerance:
   343	        hoursRatio == null ? null : Math.abs(hoursRatio - 1) * 100 <= THRESHOLDS.hoursTolerancePct,
   344	      boardRatio: r2(boardRatio),
   345	      boardWithinTolerance:
   346	        boardRatio == null ? null : Math.abs(boardRatio - 1) * 100 <= THRESHOLDS.hoursTolerancePct,
   347	      sequence: seqCmp,
   348	      only: p && a ? null : p ? 'proposal-only' : 'actual-only',
   349	    });
   350	  }
   351	
   352	  // ---- S4 section 5 additions -------------------------------------------------
   353	  //
   354	  // 1. Due-window compliance. A policy that carries a due window per visit hands
   355	  //    it over in `proposal.windows` as { key: {from, to, type, allowed} }. `from`
   356	  //    and `to` are the raw window; `allowed` is that window clamped to the five
   357	  //    weekdays of the golden week, which is what the solver could actually obey
   358	  //    when a window opened before the week or closed after it.
   359	  const windowSpec = proposal.windows || null;
   360	  let windowCompliance = null;
   361	  if (windowSpec) {
   362	    const byType = {};
   363	    let n = 0;
   364	    let insideRaw = 0;
   365	    let insideEffective = 0;
   366	    const violations = [];
   367	    for (const [k, a] of proposed) {
   368	      const w = windowSpec[k];
   369	      if (!w) continue;
   370	      n += 1;
   371	      const raw = w.from != null && w.to != null && a.date >= w.from && a.date <= w.to;
   372	      const eff = Array.isArray(w.allowed) ? w.allowed.includes(a.date) : raw;
   373	      if (raw) insideRaw += 1;
   374	      if (eff) insideEffective += 1;
   375	      const t = w.type || 'unknown';
   376	      if (!byType[t]) byType[t] = { n: 0, insideRaw: 0, insideEffective: 0 };
   377	      byType[t].n += 1;
   378	      if (raw) byType[t].insideRaw += 1;
   379	      if (eff) byType[t].insideEffective += 1;
   380	      if (!eff && violations.length < 40) {
   381	        violations.push({ key: k, date: a.date, from: w.from, to: w.to, type: t });
   382	      }
   383	    }
   384	    for (const t of Object.keys(byType)) {
   385	      byType[t].insideRawPct = r1(pct(byType[t].insideRaw, byType[t].n));
   386	      byType[t].insideEffectivePct = r1(pct(byType[t].insideEffective, byType[t].n));
   387	    }
   388	    windowCompliance = {
   389	      n,
   390	      insideRaw,
   391	      insideRawPct: r1(pct(insideRaw, n)),
   392	      insideEffective,
   393	      insideEffectivePct: r1(pct(insideEffective, n)),
   394	      byType,
   395	      violations,
   396	    };
   397	  }
   398	
   399	  // 2. Overflow: visits a policy could not fit under the hard wall. They are
   400	  //    reported here and still counted as unplaced by the drop gate, so an
   401	  //    infeasible week can never look like a clean one.
   402	  const overflow = Array.isArray(proposal.overflow) ? proposal.overflow : [];
   403	
   404	  const bothDays = routeDays.filter((d) => d.hoursRatio != null);
   405	  const hoursPass = bothDays.filter((d) => d.hoursWithinTolerance).length;
   406	  const boardDays = routeDays.filter((d) => d.boardRatio != null);
   407	  const boardPass = boardDays.filter((d) => d.boardWithinTolerance).length;
   408	  const seqDays = routeDays.filter((d) => d.sequence && d.sequence.driveRatio != null);
   409	
   410	  // ---- per-tech weekly hours
   411	  const perTech = [];
   412	  for (const tech of snap.techs) {
   413	    const pd = routeDays.filter((d) => d.tech === tech && d.proposal);
   414	    const ad = routeDays.filter((d) => d.tech === tech && d.actual);
   415	    perTech.push({
   416	      tech,
   417	      proposalDays: pd.length,
   418	      proposalStops: pd.reduce((s, d) => s + d.proposal.stops, 0),
   419	      proposalHours: r1(pd.reduce((s, d) => s + d.proposal.totalMin, 0) / 60),
   420	      actualDays: ad.length,
   421	      actualStops: ad.reduce((s, d) => s + d.actual.stops, 0),
   422	      actualHours: r1(ad.reduce((s, d) => s + d.actual.totalMin, 0) / 60),
   423	      hoursDelta: r1(
   424	        (pd.reduce((s, d) => s + d.proposal.totalMin, 0) - ad.reduce((s, d) => s + d.actual.totalMin, 0)) / 60
   425	      ),
   426	    });
   427	  }
   428	
   429	  // 3. Capacity, measured on the harness's own modelled route time (travel +
   430	  //    service), for the proposal and for the day the field actually worked.
   431	  //    A policy that also models capacity its own way reports that separately in
   432	  //    its notes; this is the harness's independent read.
   433	  const propDays = routeDays.filter((d) => d.proposal);
   434	  const actDays = routeDays.filter((d) => d.actual);
   435	  const capacity = {
   436	    proposal: {
   437	      routeDays: propDays.length,
   438	      over8h: propDays.filter((d) => d.proposal.hours > THRESHOLDS.softHours).length,
   439	      over95h: propDays.filter((d) => d.proposal.hours > THRESHOLDS.wallHours).length,
   440	      maxHours: propDays.length ? Math.max(...propDays.map((d) => d.proposal.hours)) : null,
   441	      medianHours: r2(median(propDays.map((d) => d.proposal.hours))),
   442	    },
   443	    actual: {
   444	      routeDays: actDays.length,
   445	      over8h: actDays.filter((d) => d.actual.hours > THRESHOLDS.softHours).length,
   446	      over95h: actDays.filter((d) => d.actual.hours > THRESHOLDS.wallHours).length,
   447	      maxHours: actDays.length ? Math.max(...actDays.map((d) => d.actual.hours)) : null,
   448	      medianHours: r2(median(actDays.map((d) => d.actual.hours))),
   449	    },
   450	  };
   451	
   452	  // 4. Compactness: per-day total route time against the OptimoRoute route the
   453	  //    field drove, both sides timed by travel.mjs. S4 asks for within 5%.
   454	  const compactPass = bothDays.filter(
   455	    (d) => Math.abs(d.hoursRatio - 1) * 100 <= THRESHOLDS.compactnessTolerancePct
   456	  ).length;
   457	  const compactBoardPass = boardDays.filter(
   458	    (d) => Math.abs(d.boardRatio - 1) * 100 <= THRESHOLDS.compactnessTolerancePct
   459	  ).length;
   460	  const compactness = {
   461	    routeDaysScored: bothDays.length,
   462	    within5Pct: compactPass,
   463	    within5PctShare: r1(pct(compactPass, bothDays.length)),
   464	    medianRatio: r2(median(bothDays.map((d) => d.hoursRatio))),
   465	    boardOnlyWithin5Pct: compactBoardPass,
   466	    boardOnlyRouteDays: boardDays.length,
   467	    ratioMin: bothDays.length ? Math.min(...bothDays.map((d) => d.hoursRatio)) : null,
   468	    ratioMax: bothDays.length ? Math.max(...bothDays.map((d) => d.hoursRatio)) : null,
   469	  };
   470	
   471	  const sameTechPct = pct(agree.run.tech, agree.run.n);
   472	  const sameDayPct = pct(agree.run.day, agree.run.n);
   473	  const hoursPassPct = pct(hoursPass, bothDays.length);
   474	
   475	  const gates = [
   476	    { gate: 'same tech >= 95%', value: r1(sameTechPct), pass: sameTechPct != null && sameTechPct >= THRESHOLDS.sameTechPct },
   477	    { gate: 'same day >= 95%', value: r1(sameDayPct), pass: sameDayPct != null && sameDayPct >= THRESHOLDS.sameDayPct },
   478	    {
   479	      gate: 'route-day hours within +-10%',
   480	      value: `${hoursPass}/${bothDays.length} (${r1(hoursPassPct)}%)`,
   481	      pass: bothDays.length > 0 && hoursPass === bothDays.length,
   482	    },
   483	    {
   484	      gate: 'route-day hours within +-10% (board only, same sequencer)',
   485	      value: `${boardPass}/${boardDays.length} (${r1(pct(boardPass, boardDays.length))}%)`,
   486	      pass: boardDays.length > 0 && boardPass === boardDays.length,
   487	      advisory: true,
   488	    },
   489	    { gate: 'no dropped visits', value: dropped.length, pass: dropped.length === 0 },
   490	    { gate: 'no invented visits', value: invented.length, pass: invented.length === 0 },
   491	    { gate: 'no weekend placements', value: weekend.length, pass: weekend.length === 0 },
   492	  ];
   493	
   494	  // S4 section 5 gates. Only the policies that carry the design's own inputs
   495	  // (a due window, an overflow list) are scored on them.
   496	  if (windowCompliance) {
   497	    gates.push({
   498	      gate: 'every visit inside its due window (clamped to the week)',
   499	      value: `${windowCompliance.insideEffective}/${windowCompliance.n} (${windowCompliance.insideEffectivePct}%)`,
   500	      pass: windowCompliance.n > 0 && windowCompliance.insideEffective === windowCompliance.n,
   501	    });
   502	    gates.push({
   503	      gate: 'inside the raw due window, before clamping to the week',
   504	      value: `${windowCompliance.insideRaw}/${windowCompliance.n} (${windowCompliance.insideRawPct}%)`,
   505	      pass: windowCompliance.n > 0 && windowCompliance.insideRaw === windowCompliance.n,
   506	      advisory: true,
   507	    });
   508	  }
   509	  gates.push({
   510	    gate: `no route-day over ${THRESHOLDS.wallHours} h (modelled travel + service)`,
   511	    value: `${capacity.proposal.over95h} of ${capacity.proposal.routeDays} (actual: ${capacity.actual.over95h}/${capacity.actual.routeDays})`,
   512	    pass: capacity.proposal.over95h === 0,
   513	    advisory: true,
   514	  });
   515	  gates.push({
   516	    gate: 'route-day total time within +-5% of the OptimoRoute day (compactness)',
   517	    value: `${compactness.within5Pct}/${compactness.routeDaysScored} (${compactness.within5PctShare}%)`,
   518	    pass: compactness.routeDaysScored > 0 && compactness.within5Pct === compactness.routeDaysScored,
   519	    advisory: true,
   520	  });
   521	  if (overflow.length || proposal.overflow) {
   522	    gates.push({
   523	      gate: 'no overflow (visits that would not fit under the wall)',
   524	      value: overflow.length,
   525	      pass: overflow.length === 0,
   526	      advisory: true,
   527	    });
   528	  }
   529	  gates.push({
   530	    gate: 'late bookings (created after the cutoff — the add-queue load)',
   531	    value: snap.lateBookings.length,
   532	    pass: true,
   533	    advisory: true,
   534	  });
   535	
   536	  return {
   537	    thresholds: THRESHOLDS,
   538	    coverage: {
   539	      dueVisits: snap.due.length,
   540	      lateBookings: snap.lateBookings.length,
   541	      proposed: proposed.size,
   542	      dropped: dropped.length,
   543	      invented: invented.length,
   544	      duplicates: duplicates.length,
   545	      noActual,
   546	      weekendPlacements: weekend.length,
   547	      offWeekPlacements: offWeek.length,
   548	      ghostOrders: snap.ghosts.length,
   549	    },
   550	    agreement: {
   551	      vsActualRun: {
   552	        n: agree.run.n,
   553	        sameTech: agree.run.tech,
   554	        sameTechPct: r1(sameTechPct),
   555	        sameDay: agree.run.day,
   556	        sameDayPct: r1(sameDayPct),
   557	        sameBoth: agree.run.both,
   558	        sameBothPct: r1(pct(agree.run.both, agree.run.n)),
   559	      },
   560	      vsOptimoHeld: {
   561	        n: agree.held.n,
   562	        sameTechPct: r1(pct(agree.held.tech, agree.held.n)),
   563	        sameDayPct: r1(pct(agree.held.day, agree.held.n)),
   564	        sameBothPct: r1(pct(agree.held.both, agree.held.n)),
   565	      },
   566	    },
   567	    hours: {
   568	      routeDaysScored: bothDays.length,
   569	      withinTolerance: hoursPass,
   570	      withinTolerancePct: r1(hoursPassPct),
   571	      medianRatio: r2(median(bothDays.map((d) => d.hoursRatio))),
   572	      boardOnly: {
   573	        routeDaysScored: boardDays.length,
   574	        withinTolerance: boardPass,
   575	        withinTolerancePct: r1(pct(boardPass, boardDays.length)),
   576	        medianRatio: r2(median(boardDays.map((d) => d.boardRatio))),
   577	      },
   578	      actualOrderSource: orderSource,
   579	      proposalOnlyDays: routeDays.filter((d) => d.only === 'proposal-only').length,
   580	      actualOnlyDays: routeDays.filter((d) => d.only === 'actual-only').length,
   581	      totalProposalHours: r1(routeDays.reduce((s, d) => s + (d.proposal?.totalMin || 0), 0) / 60),
   582	      totalActualHours: r1(routeDays.reduce((s, d) => s + (d.actual?.totalMin || 0), 0) / 60),
   583	    },
   584	    sequence: {
   585	      routeDaysCompared: seqDays.length,
   586	      medianDriveRatio: r2(median(seqDays.map((d) => d.sequence.driveRatio))),
   587	      medianDistanceRatio: r2(median(seqDays.map((d) => d.sequence.distanceRatio))),
   588	      medianUniformDriveRatio: r2(median(seqDays.map((d) => d.sequence.uniformDriveRatio))),
   589	      medianProposalEstimatedLegPct: r1(median(seqDays.map((d) => d.sequence.proposalEstimatedLegPct))),
   590	      medianActualEstimatedLegPct: r1(median(seqDays.map((d) => d.sequence.actualEstimatedLegPct))),
   591	      betterThanOptimo: seqDays.filter((d) => d.sequence.driveRatio < 1).length,
   592	      worseThanOptimo: seqDays.filter((d) => d.sequence.driveRatio > 1).length,
   593	      betterThanOptimoUniform: seqDays.filter((d) => d.sequence.uniformDriveRatio < 1).length,
   594	      totalProposalDriveMin: r1(seqDays.reduce((s, d) => s + d.sequence.proposalDriveMin, 0)),
   595	      totalActualDriveMin: r1(seqDays.reduce((s, d) => s + d.sequence.actualDriveMin, 0)),
   596	    },
   597	    windowCompliance,
   598	    capacity,
   599	    compactness,
   600	    overflow: { count: overflow.length, keys: overflow.slice(0, 40) },
   601	    gates,
   602	    passed: gates.filter((g) => !g.advisory).every((g) => g.pass),
   603	    perTech,
   604	    routeDays,
   605	    mismatches: mismatches.slice(0, 60),
   606	    mismatchTotal: mismatches.length,
   607	    droppedKeys: dropped.slice(0, 40),
   608	    inventedKeys: invented.slice(0, 40),
   609	    weekendKeys: weekend.slice(0, 40),
   610	  };
   611	}
   612	
   613	// ---------------------------------------------------------------- reporting
   614	
   615	function markdown(snap, policy, result, proposal) {
   616	  const L = [];
   617	  const yn = (b) => (b === true ? 'PASS' : b === false ? 'FAIL' : '-');
   618	  L.push(`# Backtest scorecard — ${snap.week} · ${policy.name}`);
   619	  L.push('');
   620	  L.push(`${policy.description}`);
   621	  L.push('');
   622	  L.push(`| | |`);
   623	  L.push(`|---|---|`);
   624	  L.push(`| Golden week | ${snap.week} (${snap.days[0]} .. ${snap.days[4]}) |`);
   625	  L.push(`| Plan-time cutoff | ${snap.asOf} (Friday 14:00 PT) |`);
   626	  L.push(`| Policy | \`${policy.name}\`${policy.usesOracle ? ' — reads the oracle' : ''} |`);
   627	  L.push(`| Techs | ${snap.techs.join(', ')} |`);
   628	  L.push(`| Overall | **${result.passed ? 'PASS' : 'FAIL'}** |`);
   629	  L.push('');
   630	
   631	  L.push('## Gates');
   632	  L.push('');
   633	  L.push('| Gate | Value | Result |');
   634	  L.push('|---|---:|:---:|');
   635	  for (const g of result.gates) {
   636	    L.push(`| ${g.gate}${g.advisory ? ' _(advisory)_' : ''} | ${g.value} | ${yn(g.pass)} |`);
   637	  }
   638	  L.push('');
   639	
   640	  const c = result.coverage;
   641	  L.push('## Coverage');
   642	  L.push('');
   643	  L.push('| Metric | Count |');
   644	  L.push('|---|---:|');
   645	  L.push(`| Visits due and known at the cutoff | ${c.dueVisits} |`);
   646	  L.push(`| Late bookings (created after the cutoff, excluded) | ${c.lateBookings} |`);
   647	  L.push(`| Visits the policy placed | ${c.proposed} |`);
   648	  L.push(`| Dropped (due, never placed) | ${c.dropped} |`);
   649	  L.push(`| Invented (placed, not due) | ${c.invented} |`);
   650	  L.push(`| Duplicate placements | ${c.duplicates} |`);
   651	  L.push(`| Placed on a weekend | ${c.weekendPlacements} |`);
   652	  L.push(`| Placed outside the golden week | ${c.offWeekPlacements} |`);
   653	  L.push(`| Due visits with no resolvable actual | ${c.noActual} |`);
   654	  L.push(`| OptimoRoute ghost orders (no Jobber visit) | ${c.ghostOrders} |`);
   655	  L.push('');
   656	
   657	  const a = result.agreement;
   658	  L.push('## Agreement with what ran');
   659	  L.push('');
   660	  L.push('| Reference | n | Same tech | Same day | Both |');
   661	  L.push('|---|---:|---:|---:|---:|');
   662	  L.push(
   663	    `| Actual run (completion stamps) | ${a.vsActualRun.n} | ${a.vsActualRun.sameTechPct}% | ${a.vsActualRun.sameDayPct}% | ${a.vsActualRun.sameBothPct}% |`
   664	  );
   665	  L.push(
   666	    `| OptimoRoute route as held | ${a.vsOptimoHeld.n} | ${a.vsOptimoHeld.sameTechPct}% | ${a.vsOptimoHeld.sameDayPct}% | ${a.vsOptimoHeld.sameBothPct}% |`
   667	  );
   668	  L.push('');
   669	
   670	  const h = result.hours;
   671	  L.push('## Hours per route-day');
   672	  L.push('');
   673	  L.push('| Metric | Value |');
   674	  L.push('|---|---:|');
   675	  L.push(`| Route-days with both a proposal and an actual | ${h.routeDaysScored} |`);
   676	  L.push(`| Within +-10% of actual | ${h.withinTolerance} (${h.withinTolerancePct}%) |`);
   677	  L.push(`| Median proposal/actual ratio | ${h.medianRatio} |`);
   678	  L.push(`| **Board only** — within +-10% when the actual day is re-sequenced by us | ${h.boardOnly.withinTolerance}/${h.boardOnly.routeDaysScored} (${h.boardOnly.withinTolerancePct}%) |`);
   679	  L.push(`| **Board only** — median ratio | ${h.boardOnly.medianRatio} |`);
   680	  L.push(`| Route-days only in the proposal | ${h.proposalOnlyDays} |`);
   681	  L.push(`| Route-days only in the actual | ${h.actualOnlyDays} |`);
   682	  L.push(`| Total proposal hours | ${h.totalProposalHours} |`);
   683	  L.push(`| Total actual hours | ${h.totalActualHours} |`);
   684	  L.push(
   685	    `| Actual stop order taken from | OptimoRoute ${h.actualOrderSource.optimo}, completion stamps ${h.actualOrderSource.stamp}, schedule ${h.actualOrderSource.scheduled} |`
   686	  );
   687	  L.push('');
   688	  L.push(
   689	    'The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.'
   690	  );
   691	  L.push('');
   692	
   693	  const s = result.sequence;
   694	  L.push('## Sequence quality (same stop set, two orders)');
   695	  L.push('');
   696	  L.push('| Metric | Value |');
   697	  L.push('|---|---:|');
   698	  L.push(`| Route-days compared | ${s.routeDaysCompared} |`);
   699	  L.push(`| Median drive-time ratio (ours / OptimoRoute) | ${s.medianDriveRatio} |`);
   700	  L.push(`| Median distance ratio | ${s.medianDistanceRatio} |`);
   701	  L.push(`| **Uniform-model control** — median drive ratio, estimator only | ${s.medianUniformDriveRatio} |`);
   702	  L.push(`| Legs our order has to estimate (median) | ${s.medianProposalEstimatedLegPct}% |`);
   703	  L.push(`| Legs OptimoRoute's order has to estimate (median) | ${s.medianActualEstimatedLegPct}% |`);
   704	  L.push(`| Route-days we beat OptimoRoute on drive time | ${s.betterThanOptimo} |`);
   705	  L.push(`| Route-days OptimoRoute beat us | ${s.worseThanOptimo} |`);
   706	  L.push(`| Route-days we beat it under the uniform control | ${s.betterThanOptimoUniform} |`);
   707	  L.push(`| Total drive minutes, ours vs OptimoRoute | ${s.totalProposalDriveMin} vs ${s.totalActualDriveMin} |`);
   708	  L.push('');
   709	  L.push(
   710	    'Read the uniform-model control, not the headline ratio. OptimoRoute actually drove every leg in its own order, so those legs are real measurements in the travel model; any re-ordering invents legs nobody has driven and they fall back to a haversine estimator whose median per-leg error is around 20%. The headline ratio therefore flatters any re-ordering. The control times both orders with the estimator alone, so neither side gets that advantage.'
   711	  );
   712	  L.push('');
   713	
   714	  L.push('## Design gates (S4 section 5)');
   715	  L.push('');
   716	  if (result.windowCompliance) {
   717	    const w = result.windowCompliance;
   718	    L.push('| Due-window compliance | Value |');
   719	    L.push('|---|---:|');
   720	    L.push(`| Visits carrying a window | ${w.n} |`);
   721	    L.push(`| Placed inside the window, clamped to the week | ${w.insideEffective} (${w.insideEffectivePct}%) |`);
   722	    L.push(`| Placed inside the raw window | ${w.insideRaw} (${w.insideRawPct}%) |`);
   723	    L.push('');
   724	    L.push('| Window type | n | Inside raw | Inside clamped |');
   725	    L.push('|---|---:|---:|---:|');
   726	    for (const [t, v] of Object.entries(w.byType).sort((a, b) => b[1].n - a[1].n)) {
   727	      L.push(`| ${t} | ${v.n} | ${v.insideRawPct}% | ${v.insideEffectivePct}% |`);
   728	    }
   729	    L.push('');
   730	    L.push(
   731	      'A window that opens before the golden week or closes after it cannot be obeyed inside a Monday-to-Friday solve. The clamped column is what the solver could actually hold; the raw column is the window the cadence rule asked for, and the gap between them is the design telling you how much work the office was already carrying late.'
   732	    );
   733	    L.push('');
   734	  } else {
   735	    L.push('This policy carries no due windows, so window compliance is not scored.');
   736	    L.push('');
   737	  }
   738	  const cap = result.capacity;
   739	  const cm = result.compactness;
   740	  L.push('| Capacity and compactness | Proposal | Actual |');
   741	  L.push('|---|---:|---:|');
   742	  L.push(`| Route-days | ${cap.proposal.routeDays} | ${cap.actual.routeDays} |`);
   743	  L.push(`| Over 8 h (modelled travel + service) | ${cap.proposal.over8h} | ${cap.actual.over8h} |`);
   744	  L.push(`| Over 9.5 h — the hard wall | ${cap.proposal.over95h} | ${cap.actual.over95h} |`);
   745	  L.push(`| Longest route-day, hours | ${cap.proposal.maxHours} | ${cap.actual.maxHours} |`);
   746	  L.push(`| Median route-day, hours | ${cap.proposal.medianHours} | ${cap.actual.medianHours} |`);
   747	  L.push(
   748	    `| Route-day time within +-5% of the OptimoRoute day | ${cm.within5Pct}/${cm.routeDaysScored} (${cm.within5PctShare}%) | - |`
   749	  );
   750	  L.push(`| Route-day ratio range | ${r2(cm.ratioMin)} - ${r2(cm.ratioMax)} | - |`);
   751	  L.push(`| Overflow — could not fit under the wall | ${result.overflow.count} | - |`);
   752	  L.push(`| Late bookings — the add-queue load | ${result.coverage.lateBookings} | - |`);
   753	  L.push('');
   754	
   755	  L.push('## Per-tech weekly hours');
   756	  L.push('');
   757	  L.push('| Tech | Days | Stops | Proposal h | Actual h | Delta h |');
   758	  L.push('|---|---:|---:|---:|---:|---:|');
   759	  for (const t of result.perTech) {
   760	    L.push(
   761	      `| ${t.tech} | ${t.proposalDays}/${t.actualDays} | ${t.proposalStops}/${t.actualStops} | ${t.proposalHours} | ${t.actualHours} | ${t.hoursDelta} |`
   762	    );
   763	  }
   764	  L.push('');
   765	
   766	  L.push('## Route-days');
   767	  L.push('');
   768	  L.push('| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |');
   769	  L.push('|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|');
   770	  for (const d of result.routeDays) {
   771	    const sq = d.sequence;
   772	    L.push(
   773	      `| ${d.date} | ${d.dow} | ${d.tech} | ${d.proposal?.stops ?? '-'}/${d.actual?.stops ?? '-'} | ${
   774	        d.proposal?.hours ?? '-'
   775	      } | ${d.actual?.hours ?? '-'} | ${d.hoursRatio ?? '-'} | ${yn(d.hoursWithinTolerance)} | ${
   776	        d.boardRatio ?? '-'
   777	      } | ${sq ? `${sq.proposalDriveMin}/${sq.actualDriveMin}` : '-'} | ${sq?.driveRatio ?? '-'} |`
   778	    );
   779	  }
   780	  L.push('');
   781	
   782	  if (result.mismatchTotal) {
   783	    L.push(`## Tech/day mismatches (${result.mismatchTotal} total, first 60)`);
   784	    L.push('');
   785	    L.push('| Visit | Zip | Wrong | Proposed | Actual |');
   786	    L.push('|---|---|---|---|---|');
   787	    for (const m of result.mismatches) {
   788	      L.push(
   789	        `| ${m.key} ${String(m.title || '').slice(0, 22)} | ${m.zip || ''} | ${m.wrong} | ${m.proposedTech} ${m.proposedDate} | ${m.actualTech} ${m.actualDate} |`
   790	      );
   791	    }
   792	    L.push('');
   793	  }
   794	
   795	  if (proposal.notes) {
   796	    L.push('## Policy notes');
   797	    L.push('');
   798	    L.push('```json');
   799	    L.push(JSON.stringify(proposal.notes, null, 2));
   800	    L.push('```');
   801	    L.push('');
   802	  }
   803	
   804	  L.push('---');
   805	  L.push('');
   806	  L.push(
   807	    'Hours are modelled with `travel.mjs` over each route-day in its own order, including the inbound leg from the tech\'s inferred start area and excluding the trip home. Proposal and actual are timed with the identical model and identical per-visit service minutes, so any difference is the board, not the clock.'
   808	  );
   809	  return L.join('\n');
   810	}
   811	
   812	// ---------------------------------------------------------------- run
   813	
   814	export async function runOne({ week, policyName, outRoot, orOpt = true, quiet = false }) {
   815	  const t0 = Date.now();
   816	  const policy = await loadPolicy(policyName);
   817	  const snap = buildSnapshot({ week });
   818	  clearLegCache();
   819	
   820	  const proposal = policy.propose(snap);
   821	  if (!proposal || !Array.isArray(proposal.assignments)) {
   822	    throw new Error(`policy ${policyName} returned no assignments array`);
   823	  }
   824	  const result = score(snap, proposal, { orOpt });
   825	
   826	  const dir = path.join(outRoot, week, policyName);
   827	  fs.mkdirSync(dir, { recursive: true });
   828	
   829	  const json = {
   830	    generatedAt: new Date().toISOString(),
   831	    week,
   832	    days: snap.days,
   833	    asOf: snap.asOf,
   834	    policy: { name: policy.name || policyName, description: policy.description || '', usesOracle: !!policy.usesOracle },
   835	    runtimeMs: Date.now() - t0,
   836	    ...result,
   837	    policyNotes: proposal.notes || null,
   838	  };
   839	  fs.writeFileSync(path.join(dir, 'scorecard.json'), JSON.stringify(json, null, 2));
   840	  fs.writeFileSync(path.join(dir, 'scorecard.md'), markdown(snap, { name: policyName, ...policy }, result, proposal));
   841	
   842	  // the proposed board itself, sequenced, so a human can eyeball a day
   843	  const board = { week, policy: policyName, asOf: snap.asOf, routeDays: [] };
   844	  for (const d of result.routeDays) {
   845	    if (!d.proposal) continue;
   846	    board.routeDays.push({ date: d.date, tech: d.tech, hours: d.proposal.hours, stops: d.proposal.stops });
   847	  }
   848	  board.assignments = proposal.assignments;
   849	  fs.writeFileSync(path.join(dir, 'board.json'), JSON.stringify(board, null, 2));
   850	
   851	  if (!quiet) {
   852	    console.log(`\n=== ${week} · ${policyName} ===`);
   853	    console.log(
   854	      `due ${result.coverage.dueVisits}  late ${result.coverage.lateBookings}  placed ${result.coverage.proposed}  dropped ${result.coverage.dropped}  invented ${result.coverage.invented}  weekend ${result.coverage.weekendPlacements}`
   855	    );
   856	    console.log(
   857	      `same tech ${result.agreement.vsActualRun.sameTechPct}%  same day ${result.agreement.vsActualRun.sameDayPct}%  both ${result.agreement.vsActualRun.sameBothPct}%  (n=${result.agreement.vsActualRun.n})`
   858	    );
   859	    console.log(
   860	      `hours within +-10%: ${result.hours.withinTolerance}/${result.hours.routeDaysScored} (median ratio ${result.hours.medianRatio})  |  board only: ${result.hours.boardOnly.withinTolerance}/${result.hours.boardOnly.routeDaysScored} (median ${result.hours.boardOnly.medianRatio})`
   861	    );
   862	    console.log(
   863	      `sequence drive ratio median ${result.sequence.medianDriveRatio} (uniform-model control ${result.sequence.medianUniformDriveRatio}) over ${result.sequence.routeDaysCompared} route-days  (ours ${result.sequence.totalProposalDriveMin} min vs OR ${result.sequence.totalActualDriveMin} min)`
   864	    );
   865	    if (result.windowCompliance) {
   866	      const w = result.windowCompliance;
   867	      console.log(
   868	        `due windows: inside clamped ${w.insideEffective}/${w.n} (${w.insideEffectivePct}%)  inside raw ${w.insideRaw}/${w.n} (${w.insideRawPct}%)  overflow ${result.overflow.count}`
   869	      );
   870	    }
   871	    console.log(
   872	      `capacity: proposal over 9.5h ${result.capacity.proposal.over95h}/${result.capacity.proposal.routeDays} (actual ${result.capacity.actual.over95h}/${result.capacity.actual.routeDays})  max ${result.capacity.proposal.maxHours}h  |  compactness within +-5%: ${result.compactness.within5Pct}/${result.compactness.routeDaysScored}`
   873	    );
   874	    console.log(`gates: ${result.gates.map((g) => `${g.pass ? 'PASS' : 'FAIL'} ${g.gate}`).join(' | ')}`);
   875	    console.log(`-> ${dir}  (${Date.now() - t0} ms)`);
   876	  }
   877	  return { week, policyName, result, dir };
   878	}
   879	
   880	async function main() {
   881	  const args = parseArgs(process.argv.slice(2));
   882	  if (args.help) {
   883	    console.log('usage: node scripts/backtest.mjs --week=YYYY-MM-DD --policy=<name> [--all] [--out=dir] [--no-orOpt] [--quiet]');
   884	    console.log('policies: ' + listPolicies().join(', '));
   885	    console.log('golden weeks: ' + GOLDEN_WEEKS.join(', '));
   886	    return;
   887	  }
   888	  const weeks = args.all ? GOLDEN_WEEKS : [args.week];
   889	  const policies = args.all ? listPolicies() : [args.policy];
   890	  const summary = [];
   891	  for (const w of weeks) {
   892	    for (const p of policies) {
   893	      const r = await runOne({ week: w, policyName: p, outRoot: args.out, orOpt: args.orOpt, quiet: args.quiet });
   894	      summary.push({
   895	        week: w,
   896	        policy: p,
   897	        sameTechPct: r.result.agreement.vsActualRun.sameTechPct,
   898	        sameDayPct: r.result.agreement.vsActualRun.sameDayPct,
   899	        hoursWithin: `${r.result.hours.withinTolerance}/${r.result.hours.routeDaysScored}`,
   900	        boardWithin: `${r.result.hours.boardOnly.withinTolerance}/${r.result.hours.boardOnly.routeDaysScored}`,
   901	        boardRatio: r.result.hours.boardOnly.medianRatio,
   902	        seqRatio: r.result.sequence.medianDriveRatio,
   903	        seqRatioUniform: r.result.sequence.medianUniformDriveRatio,
   904	        inWindowPct: r.result.windowCompliance ? r.result.windowCompliance.insideEffectivePct : null,
   905	        over95h: `${r.result.capacity.proposal.over95h}/${r.result.capacity.proposal.routeDays}`,
   906	        within5Pct: `${r.result.compactness.within5Pct}/${r.result.compactness.routeDaysScored}`,
   907	        overflow: r.result.overflow.count,
   908	        dropped: r.result.coverage.dropped,
   909	        weekend: r.result.coverage.weekendPlacements,
   910	        passed: r.result.passed,
   911	      });
   912	    }
   913	  }
   914	  if (summary.length > 1) {
   915	    console.log('\n=== SUMMARY ===');
   916	    console.table(summary);
   917	  }
   918	}
   919	
   920	if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
   921	  main().catch((e) => {
   922	    console.error(e.stack || String(e));
   923	    process.exit(1);
   924	  });
   925	}
```

## [9] scripts/backtest-data.mjs

```
     1	#!/usr/bin/env node
     2	/**
     3	 * backtest-data.mjs
     4	 *
     5	 * Loads every offline input the backtest needs and reconstructs a golden week
     6	 * "as it was known on the Friday before at 14:00 PT".
     7	 *
     8	 * Nothing here touches the network. Every file read is under redesign/data/ or
     9	 * ../data/ (the route-engine project data folder).
    10	 *
    11	 * Exports
    12	 *   ptDate(iso)                 -> 'YYYY-MM-DD' in America/Los_Angeles
    13	 *   ptMinutes(iso)              -> minutes past PT midnight
    14	 *   weekDays(mondayISO)         -> the five Mon..Fri ISO dates
    15	 *   loadRaw()                   -> cached raw files
    16	 *   buildSnapshot({ week })     -> the plan-time snapshot + the actual board
    17	 *
    18	 * Snapshot contract (what a policy is handed):
    19	 *   week, days[5], asOf            the Friday 14:00 PT cutoff, as an ISO instant
    20	 *   techs[]                        roster active in the golden week
    21	 *   startAreas{tech}               inferred home/start point from travel-model.json
    22	 *   due[]                          visits due that week and KNOWN at the cutoff
    23	 *   lateBookings[]                 visits due that week but created after the cutoff
    24	 *   history[]                      completed visits strictly before the week Monday
    25	 *   jobsByNumber{}                 job record incl. product + property coordinates
    26	 *   actual: Map(key -> {tech,date,source})     what actually ran (stamp-first)
    27	 *   optimoHeld: Map(key -> {tech,date,seq})    the OptimoRoute route as held
    28	 *   serviceMin: Map(key -> minutes)            service time, taken from OR where known
    29	 *   ghosts[]                       OR orders with no matching Jobber visit
    30	 *
    31	 * A visit key is `<jobNumber>-<visitNumericId>` — the same string OptimoRoute
    32	 * carries as orderNo. Verified at 99.7% on the golden weeks (see S5-harness.md).
    33	 */
    34	
    35	import fs from 'node:fs';
    36	import path from 'node:path';
    37	import { fileURLToPath } from 'node:url';
    38	
    39	const __dirname = path.dirname(fileURLToPath(import.meta.url));
    40	export const REDESIGN = path.resolve(__dirname, '..');
    41	export const PROJECT = path.resolve(REDESIGN, '..');
    42	
    43	const F = {
    44	  visits: path.join(REDESIGN, 'data', 'jobber', 'visits.json'),
    45	  jobs: path.join(REDESIGN, 'data', 'jobber', 'jobs.json'),
    46	  travelModel: path.join(REDESIGN, 'data', 'travel-model.json'),
    47	  optimoDir: path.join(REDESIGN, 'data', 'optimo-routes'),
    48	  optimoDrivers: path.join(REDESIGN, 'data', 'optimo-drivers.json'),
    49	  completed: path.join(PROJECT, 'data', 'completed-visits_2026-08-17_2026-09-17.json'),
    50	  planVsActual: path.join(REDESIGN, 'data', 'plan-vs-actual.json'),
    51	};
    52	
    53	// ---------------------------------------------------------------- PT clock
    54	
    55	const PT_TZ = 'America/Los_Angeles';
    56	const dateFmt = new Intl.DateTimeFormat('en-CA', {
    57	  timeZone: PT_TZ,
    58	  year: 'numeric',
    59	  month: '2-digit',
    60	  day: '2-digit',
    61	});
    62	const timeFmt = new Intl.DateTimeFormat('en-GB', {
    63	  timeZone: PT_TZ,
    64	  hour: '2-digit',
    65	  minute: '2-digit',
    66	  second: '2-digit',
    67	  hour12: false,
    68	});
    69	
    70	/** 'YYYY-MM-DD' for an instant, in Pacific time. */
    71	export function ptDate(iso) {
    72	  if (!iso) return null;
    73	  return dateFmt.format(new Date(iso));
    74	}
    75	
    76	/** Minutes past Pacific midnight for an instant. */
    77	export function ptMinutes(iso) {
    78	  if (!iso) return null;
    79	  const [h, m, s] = timeFmt.format(new Date(iso)).split(':').map(Number);
    80	  return h * 60 + m + s / 60;
    81	}
    82	
    83	const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    84	/** Day-of-week name for a 'YYYY-MM-DD' calendar date (no timezone shift). */
    85	export function dowOf(dateStr) {
    86	  const [y, m, d] = dateStr.split('-').map(Number);
    87	  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    88	}
    89	export function isWeekend(dateStr) {
    90	  const d = dowOf(dateStr);
    91	  return d === 'sat' || d === 'sun';
    92	}
    93	
    94	/** Mon..Fri ISO dates for a week given its Monday. */
    95	export function weekDays(mondayISO) {
    96	  const [y, m, d] = mondayISO.split('-').map(Number);
    97	  const base = Date.UTC(y, m - 1, d);
    98	  return [0, 1, 2, 3, 4].map((i) => new Date(base + i * 86400e3).toISOString().slice(0, 10));
    99	}
   100	
   101	/** Add days to a 'YYYY-MM-DD'. */
   102	export function addDays(dateStr, n) {
   103	  const [y, m, d] = dateStr.split('-').map(Number);
   104	  return new Date(Date.UTC(y, m - 1, d) + n * 86400e3).toISOString().slice(0, 10);
   105	}
   106	
   107	/**
   108	 * The plan-time cutoff: 14:00 PT on the Friday before the golden week.
   109	 * Returned as an ISO instant so it can be compared against raw createdAt values.
   110	 */
   111	export function fridayCutoff(mondayISO) {
   112	  const friday = addDays(mondayISO, -3);
   113	  // Find the UTC instant whose PT wall-clock is friday 14:00. Aug/Sep is PDT
   114	  // (UTC-7) but resolve it rather than assume, so the harness survives DST.
   115	  for (const offset of [7, 8]) {
   116	    const guess = new Date(`${friday}T${String(14 + offset).padStart(2, '0')}:00:00Z`);
   117	    if (ptDate(guess) === friday && Math.abs(ptMinutes(guess) - 840) < 0.01) {
   118	      return guess.toISOString();
   119	    }
   120	  }
   121	  throw new Error(`fridayCutoff: could not resolve 14:00 PT for ${friday}`);
   122	}
   123	
   124	// ---------------------------------------------------------------- loading
   125	
   126	/** Numeric tail of a base64 Jobber gid: 'gid://Jobber/Visit/2037613851' -> '2037613851'. */
   127	export function gidTail(gid) {
   128	  return Buffer.from(gid, 'base64').toString('utf8').split('/').pop();
   129	}
   130	
   131	export function visitKey(visit) {
   132	  return `${visit.jobNumber}-${gidTail(visit.id)}`;
   133	}
   134	
   135	let RAW = null;
   136	
   137	export function loadRaw() {
   138	  if (RAW) return RAW;
   139	  const visits = JSON.parse(fs.readFileSync(F.visits, 'utf8'));
   140	  const jobs = JSON.parse(fs.readFileSync(F.jobs, 'utf8'));
   141	  const travelModel = JSON.parse(fs.readFileSync(F.travelModel, 'utf8'));
   142	
   143	  let completed = [];
   144	  if (fs.existsSync(F.completed)) completed = JSON.parse(fs.readFileSync(F.completed, 'utf8'));
   145	
   146	  const optimoByDate = new Map();
   147	  if (fs.existsSync(F.optimoDir)) {
   148	    for (const f of fs.readdirSync(F.optimoDir).filter((x) => /^\d{4}-\d{2}-\d{2}\.json$/.test(x))) {
   149	      const day = JSON.parse(fs.readFileSync(path.join(F.optimoDir, f), 'utf8'));
   150	      optimoByDate.set(f.slice(0, 10), day);
   151	    }
   152	  }
   153	
   154	  const jobsByNumber = new Map();
   155	  for (const j of jobs) jobsByNumber.set(j.jobNumber, j);
   156	
   157	  RAW = { visits, jobs, jobsByNumber, travelModel, completed, optimoByDate };
   158	  return RAW;
   159	}
   160	
   161	/** Product from the job's line items — per the standing rule, NOT from jobType. */
   162	export function productOf(job) {
   163	  if (!job || !Array.isArray(job.lineItems)) return 'OTHER';
   164	  for (const li of job.lineItems) {
   165	    const n = String(li?.name || '').toLowerCase();
   166	    if (n.includes('total mole control')) return 'TMCP';
   167	    if (n.includes('quick fix')) return 'QUICK_FIX';
   168	  }
   169	  for (const li of job.lineItems) {
   170	    const n = String(li?.name || '').toLowerCase();
   171	    if (n.includes('barter')) return 'BARTER';
   172	  }
   173	  return job.lineItems.length ? 'OTHER' : 'BID';
   174	}
   175	
   176	function visitRecord(v, jobsByNumber) {
   177	  const job = jobsByNumber.get(v.jobNumber) || null;
   178	  const lat = v.lat ?? job?.property?.lat ?? null;
   179	  const lng = v.lng ?? job?.property?.lng ?? null;
   180	  return {
   181	    key: visitKey(v),
   182	    visitId: v.id,
   183	    jobNumber: v.jobNumber,
   184	    title: v.title,
   185	    clientName: v.clientName,
   186	    lat,
   187	    lng,
   188	    zip: v.postalCode ?? job?.property?.postalCode ?? null,
   189	    city: v.city ?? job?.property?.city ?? null,
   190	    startAt: v.startAt,
   191	    startDate: ptDate(v.startAt),
   192	    createdAt: v.createdAt,
   193	    completedAt: v.completedAt,
   194	    isComplete: !!v.isComplete,
   195	    visitStatus: v.visitStatus,
   196	    jobStatus: v.jobStatus,
   197	    scheduledTechs: v.techs || [],
   198	    durationMin: v.duration ?? null,
   199	    product: productOf(job),
   200	  };
   201	}
   202	
   203	// ---------------------------------------------------------------- snapshot
   204	
   205	/**
   206	 * Reconstruct a golden week.
   207	 * @param {{week:string, asOf?:string}} opts week = the Monday, 'YYYY-MM-DD'
   208	 */
   209	export function buildSnapshot({ week, asOf } = {}) {
   210	  const raw = loadRaw();
   211	  const days = weekDays(week);
   212	  const daySet = new Set(days);
   213	  const cutoff = asOf || fridayCutoff(week);
   214	  const cutoffMs = new Date(cutoff).getTime();
   215	
   216	  // --- the OptimoRoute route as held, for the five days of the week
   217	  const optimoHeld = new Map();
   218	  const orService = new Map();
   219	  const orCoord = new Map();
   220	  const heldRouteDays = new Map(); // `${tech}|${date}` -> [{key,seq,lat,lng,serviceMin}]
   221	  for (const date of days) {
   222	    const day = raw.optimoByDate.get(date);
   223	    if (!day || !day.routes) continue;
   224	    for (const route of day.routes) {
   225	      const tech = route.driverSerial || route.driverName || 'UNKNOWN';
   226	      const list = [];
   227	      for (const s of route.stops || []) {
   228	        optimoHeld.set(s.orderNo, { tech, date, seq: s.stopNumber });
   229	        if (s.serviceDurationMin != null) orService.set(s.orderNo, s.serviceDurationMin);
   230	        if (s.latitude != null) orCoord.set(s.orderNo, { lat: s.latitude, lng: s.longitude });
   231	        list.push({
   232	          key: s.orderNo,
   233	          seq: s.stopNumber,
   234	          lat: s.latitude,
   235	          lng: s.longitude,
   236	          serviceMin: s.serviceDurationMin ?? 0,
   237	        });
   238	      }
   239	      list.sort((a, b) => a.seq - b.seq);
   240	      heldRouteDays.set(`${tech}|${date}`, list);
   241	    }
   242	  }
   243	
   244	  // --- Jobber visits: the due universe
   245	  const byKey = new Map();
   246	  for (const v of raw.visits) byKey.set(visitKey(v), v);
   247	
   248	  const candidates = [];
   249	  for (const v of raw.visits) {
   250	    const sd = ptDate(v.startAt);
   251	    const cd = v.completedAt ? ptDate(v.completedAt) : null;
   252	    if (daySet.has(sd) || (cd && daySet.has(cd))) candidates.push(v);
   253	  }
   254	
   255	  const due = [];
   256	  const lateBookings = [];
   257	  for (const v of candidates) {
   258	    const rec = visitRecord(v, raw.jobsByNumber);
   259	    // prefer the OptimoRoute coordinate when the stop was actually routed: it is
   260	    // the coordinate the real route was built on.
   261	    const c = orCoord.get(rec.key);
   262	    if (c) {
   263	      rec.orLat = c.lat;
   264	      rec.orLng = c.lng;
   265	      rec.lat = c.lat;
   266	      rec.lng = c.lng;
   267	    }
   268	    const created = new Date(rec.createdAt).getTime();
   269	    if (Number.isFinite(created) && created > cutoffMs) {
   270	      rec.lateBooking = true;
   271	      lateBookings.push(rec);
   272	    } else {
   273	      due.push(rec);
   274	    }
   275	  }
   276	
   277	  // --- completion stamps: what actually ran
   278	  const stamps = new Map(); // key -> {tech, date, completedAt}
   279	  for (const c of raw.completed) {
   280	    const k = `${c.job}-${gidTail(c.id)}`;
   281	    if (!c.completedAt) continue;
   282	    stamps.set(k, { tech: c.tech, date: ptDate(c.completedAt), completedAt: c.completedAt });
   283	  }
   284	  // visits.json carries its own completion stamps and covers a wider window
   285	  for (const v of raw.visits) {
   286	    if (!v.isComplete || !v.completedAt) continue;
   287	    const k = visitKey(v);
   288	    if (stamps.has(k)) continue;
   289	    stamps.set(k, {
   290	      tech: (v.techs || [])[0] || null,
   291	      date: ptDate(v.completedAt),
   292	      completedAt: v.completedAt,
   293	    });
   294	  }
   295	
   296	  // --- the actual board, stamp-first, then the held OR route, then the schedule
   297	  const allDue = [...due, ...lateBookings];
   298	  const actual = new Map();
   299	  for (const rec of allDue) {
   300	    const st = stamps.get(rec.key);
   301	    if (st && st.tech && daySet.has(st.date)) {
   302	      actual.set(rec.key, { tech: st.tech, date: st.date, source: 'stamp', completedAt: st.completedAt });
   303	      continue;
   304	    }
   305	    const held = optimoHeld.get(rec.key);
   306	    if (held) {
   307	      actual.set(rec.key, { tech: held.tech, date: held.date, source: 'optimo-held', seq: held.seq });
   308	      continue;
   309	    }
   310	    if (st && st.tech) {
   311	      // ran, but on a day outside the golden week
   312	      actual.set(rec.key, {
   313	        tech: st.tech,
   314	        date: st.date,
   315	        source: 'stamp-offweek',
   316	        completedAt: st.completedAt,
   317	      });
   318	      continue;
   319	    }
   320	    if (rec.scheduledTechs.length) {
   321	      actual.set(rec.key, { tech: rec.scheduledTechs[0], date: rec.startDate, source: 'schedule' });
   322	    }
   323	  }
   324	
   325	  // --- OR orders with no matching Jobber visit
   326	  const ghosts = [];
   327	  for (const [k, held] of optimoHeld) {
   328	    if (!byKey.has(k)) ghosts.push({ key: k, ...held });
   329	  }
   330	
   331	  // --- service minutes per visit. Use the OptimoRoute figure where the stop was
   332	  // routed so proposal and actual are timed with identical service, which keeps
   333	  // the sequence comparison about travel. Otherwise fall back to the tech median.
   334	  const techServiceSamples = new Map();
   335	  for (const [k, mins] of orService) {
   336	    const held = optimoHeld.get(k);
   337	    if (!held) continue;
   338	    if (!techServiceSamples.has(held.tech)) techServiceSamples.set(held.tech, []);
   339	    techServiceSamples.get(held.tech).push(mins);
   340	  }
   341	  const techServiceMedian = new Map();
   342	  for (const [t, xs] of techServiceSamples) {
   343	    const s = xs.slice().sort((a, b) => a - b);
   344	    techServiceMedian.set(t, s[s.length >> 1]);
   345	  }
   346	  const allServiceMedian = (() => {
   347	    const xs = [...orService.values()].sort((a, b) => a - b);
   348	    return xs.length ? xs[xs.length >> 1] : 15;
   349	  })();
   350	  const serviceMin = new Map();
   351	  for (const rec of allDue) {
   352	    if (orService.has(rec.key)) {
   353	      serviceMin.set(rec.key, orService.get(rec.key));
   354	      continue;
   355	    }
   356	    const a = actual.get(rec.key);
   357	    const t = a?.tech;
   358	    serviceMin.set(rec.key, (t && techServiceMedian.get(t)) ?? allServiceMedian);
   359	  }
   360	
   361	  // --- history: completed strictly before the week Monday, for no-lookahead policies
   362	  const history = [];
   363	  for (const v of raw.visits) {
   364	    if (!v.isComplete || !v.completedAt) continue;
   365	    const d = ptDate(v.completedAt);
   366	    if (d >= week) continue;
   367	    const tech = (v.techs || [])[0];
   368	    if (!tech) continue;
   369	    history.push({
   370	      key: visitKey(v),
   371	      jobNumber: v.jobNumber,
   372	      tech,
   373	      date: d,
   374	      dow: dowOf(d),
   375	      zip: v.postalCode || null,
   376	      lat: v.lat ?? null,
   377	      lng: v.lng ?? null,
   378	    });
   379	  }
   380	  history.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
   381	
   382	  // --- roster: techs who actually held a route in the week
   383	  const techs = [...new Set([...heldRouteDays.keys()].map((k) => k.split('|')[0]))].sort();
   384	  const startAreas = {};
   385	  for (const t of techs) {
   386	    const sa = raw.travelModel.inferredStartArea?.[t];
   387	    if (sa) startAreas[t] = { lat: sa.lat, lng: sa.lng, address: sa.address, routeStartMinutes: sa.medianRouteStartMinutes };
   388	  }
   389	  // a tech with no inferred start falls back to the centroid of their week's stops
   390	  for (const t of techs) {
   391	    if (startAreas[t]) continue;
   392	    const pts = [];
   393	    for (const [k, list] of heldRouteDays) if (k.startsWith(`${t}|`)) pts.push(...list);
   394	    if (!pts.length) continue;
   395	    startAreas[t] = {
   396	      lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
   397	      lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
   398	      address: '(centroid fallback — no inferred start area)',
   399	      routeStartMinutes: 420,
   400	      fallback: true,
   401	    };
   402	  }
   403	
   404	  return {
   405	    week,
   406	    days,
   407	    daySet,
   408	    asOf: cutoff,
   409	    techs,
   410	    startAreas,
   411	    due,
   412	    lateBookings,
   413	    history,
   414	    jobsByNumber: raw.jobsByNumber,
   415	    actual,
   416	    optimoHeld,
   417	    heldRouteDays,
   418	    serviceMin,
   419	    ghosts,
   420	    stamps,
   421	  };
   422	}
```

## [10] scripts/sequence.mjs

```
     1	#!/usr/bin/env node
     2	/**
     3	 * sequence.mjs
     4	 *
     5	 * Orders one tech's stops for one day: nearest-neighbour from the tech's start
     6	 * point, then 2-opt improvement. Every distance and duration comes from
     7	 * travel.mjs, so the sequencer and the scorer share one travel model.
     8	 *
     9	 * Travel here is treated as ASYMMETRIC — the model holds directed pairs that
    10	 * differ by ~4% median — so a 2-opt reversal is costed by recomputing the path
    11	 * rather than by the usual symmetric delta shortcut.
    12	 *
    13	 *   sequenceStops(stops, driver, start, opts) -> { order, cost, improvedFrom, sweeps }
    14	 *   pathSeconds(stops, driver, start)         -> travel seconds incl. the inbound leg
    15	 *   routeMinutes(stops, driver, start)        -> { travelMin, serviceMin, totalMin, ... }
    16	 *
    17	 * A stop is { key, lat, lng, serviceMin }. `start` is { lat, lng } or null.
    18	 * Offline only.
    19	 */
    20	
    21	import { travel, placeId } from './travel.mjs';
    22	
    23	// travel() already does map lookups, but a 2-opt sweep asks for the same leg
    24	// thousands of times. Memoise on the rounded place pair + driver.
    25	const memo = new Map();
    26	function leg(a, b, driver, est = false) {
    27	  const k = `${placeId(a.lat, a.lng)}>${placeId(b.lat, b.lng)}|${driver}|${est ? 'E' : 'O'}`;
    28	  let v = memo.get(k);
    29	  if (v === undefined) {
    30	    v = travel(a, b, driver, est ? { forceEstimate: true } : undefined);
    31	    memo.set(k, v);
    32	  }
    33	  return v;
    34	}
    35	export function clearLegCache() {
    36	  memo.clear();
    37	}
    38	
    39	/**
    40	 * Travel seconds for an ordered stop list, including the inbound leg from `start`.
    41	 * `est` forces the haversine estimator even for legs that were really driven —
    42	 * used as a control, so two orders can be timed by one uniform model instead of
    43	 * one of them getting credit for having its legs in the observed-pair table.
    44	 */
    45	export function pathSeconds(stops, driver, start, est = false) {
    46	  let s = 0;
    47	  let prev = start || null;
    48	  for (const stop of stops) {
    49	    if (prev) s += leg(prev, stop, driver, est).seconds;
    50	    prev = stop;
    51	  }
    52	  return s;
    53	}
    54	
    55	/** Travel metres for an ordered stop list, including the inbound leg from `start`. */
    56	export function pathMetres(stops, driver, start, est = false) {
    57	  let m = 0;
    58	  let prev = start || null;
    59	  for (const stop of stops) {
    60	    if (prev) m += leg(prev, stop, driver, est).metres;
    61	    prev = stop;
    62	  }
    63	  return m;
    64	}
    65	
    66	/** How many of an ordered list's legs came from real observations. */
    67	export function legMix(stops, driver, start) {
    68	  let observed = 0;
    69	  let estimated = 0;
    70	  let prev = start || null;
    71	  for (const stop of stops) {
    72	    if (prev) (leg(prev, stop, driver).source === 'observed' ? observed++ : estimated++);
    73	    prev = stop;
    74	  }
    75	  return { observed, estimated, estimatedPct: observed + estimated ? (estimated / (observed + estimated)) * 100 : 0 };
    76	}
    77	
    78	/**
    79	 * Full route cost for an ordered stop list.
    80	 * Includes the inbound leg from the tech's start; excludes the trip home,
    81	 * which the source data cannot pin down.
    82	 */
    83	export function routeMinutes(stops, driver, start) {
    84	  let travelSec = 0;
    85	  let metres = 0;
    86	  let serviceMin = 0;
    87	  let observed = 0;
    88	  let estimated = 0;
    89	  let prev = start || null;
    90	  for (const stop of stops) {
    91	    serviceMin += Number(stop.serviceMin ?? stop.serviceDurationMin ?? 0);
    92	    if (prev) {
    93	      const t = leg(prev, stop, driver);
    94	      travelSec += t.seconds;
    95	      metres += t.metres;
    96	      if (t.source === 'observed') observed += 1;
    97	      else estimated += 1;
    98	    }
    99	    prev = stop;
   100	  }
   101	  return {
   102	    stops: stops.length,
   103	    travelMin: travelSec / 60,
   104	    travelMetres: metres,
   105	    travelMiles: metres / 1609.344,
   106	    serviceMin,
   107	    totalMin: travelSec / 60 + serviceMin,
   108	    observedLegs: observed,
   109	    estimatedLegs: estimated,
   110	  };
   111	}
   112	
   113	/** Nearest-neighbour construction from the tech's start point. */
   114	export function nearestNeighbour(stops, driver, start) {
   115	  const remaining = stops.slice();
   116	  const order = [];
   117	  let cur = start || remaining[0];
   118	  if (!start && remaining.length) order.push(remaining.shift());
   119	  while (remaining.length) {
   120	    let bestI = 0;
   121	    let bestSec = Infinity;
   122	    for (let i = 0; i < remaining.length; i++) {
   123	      const s = leg(cur, remaining[i], driver).seconds;
   124	      if (s < bestSec) {
   125	        bestSec = s;
   126	        bestI = i;
   127	      }
   128	    }
   129	    const next = remaining.splice(bestI, 1)[0];
   130	    order.push(next);
   131	    cur = next;
   132	  }
   133	  return order;
   134	}
   135	
   136	/**
   137	 * 2-opt. Reverses segment [i..j] and keeps the move when total path seconds drop.
   138	 * Costs are recomputed in full because the travel model is directed.
   139	 */
   140	export function twoOpt(order, driver, start, { maxSweeps = 40, minGainSec = 1 } = {}) {
   141	  let best = order.slice();
   142	  let bestCost = pathSeconds(best, driver, start);
   143	  let sweeps = 0;
   144	  let improved = true;
   145	  while (improved && sweeps < maxSweeps) {
   146	    improved = false;
   147	    sweeps += 1;
   148	    for (let i = 0; i < best.length - 1; i++) {
   149	      for (let j = i + 1; j < best.length; j++) {
   150	        const cand = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
   151	        const c = pathSeconds(cand, driver, start);
   152	        if (c < bestCost - minGainSec) {
   153	          best = cand;
   154	          bestCost = c;
   155	          improved = true;
   156	        }
   157	      }
   158	    }
   159	  }
   160	  return { order: best, cost: bestCost, sweeps };
   161	}
   162	
   163	/**
   164	 * Or-opt: relocate a run of 1..3 consecutive stops elsewhere in the order.
   165	 * Cheap, and it fixes the single-stop detours 2-opt cannot reach.
   166	 */
   167	export function orOpt(order, driver, start, { maxSweeps = 20, minGainSec = 1 } = {}) {
   168	  let best = order.slice();
   169	  let bestCost = pathSeconds(best, driver, start);
   170	  let sweeps = 0;
   171	  let improved = true;
   172	  while (improved && sweeps < maxSweeps) {
   173	    improved = false;
   174	    sweeps += 1;
   175	    for (let len = 1; len <= 3 && len < best.length; len++) {
   176	      for (let i = 0; i + len <= best.length; i++) {
   177	        const seg = best.slice(i, i + len);
   178	        const rest = best.slice(0, i).concat(best.slice(i + len));
   179	        for (let j = 0; j <= rest.length; j++) {
   180	          if (j === i) continue;
   181	          const cand = rest.slice(0, j).concat(seg, rest.slice(j));
   182	          const c = pathSeconds(cand, driver, start);
   183	          if (c < bestCost - minGainSec) {
   184	            best = cand;
   185	            bestCost = c;
   186	            improved = true;
   187	            i = Math.max(-1, i - 1); // restart scanning around the change
   188	            break;
   189	          }
   190	        }
   191	      }
   192	    }
   193	  }
   194	  return { order: best, cost: bestCost, sweeps };
   195	}
   196	
   197	/**
   198	 * Order a day's stops for one tech.
   199	 * @param {Array<{key:string,lat:number,lng:number,serviceMin:number}>} stops
   200	 * @param {string} driver
   201	 * @param {{lat:number,lng:number}|null} start
   202	 */
   203	export function sequenceStops(stops, driver, start, opts = {}) {
   204	  const usable = stops.filter((s) => s.lat != null && s.lng != null);
   205	  const unplaceable = stops.filter((s) => s.lat == null || s.lng == null);
   206	  if (usable.length <= 1) {
   207	    return { order: usable.concat(unplaceable), cost: 0, nnCost: 0, sweeps: 0, unplaceable: unplaceable.length };
   208	  }
   209	  const nn = nearestNeighbour(usable, driver, start);
   210	  const nnCost = pathSeconds(nn, driver, start);
   211	  const a = twoOpt(nn, driver, start, opts);
   212	  const b = opts.orOpt === false ? a : orOpt(a.order, driver, start, opts);
   213	  const final = b.cost <= a.cost ? b : a;
   214	  return {
   215	    order: final.order.concat(unplaceable),
   216	    cost: final.cost,
   217	    nnCost,
   218	    improvedPct: nnCost > 0 ? (1 - final.cost / nnCost) * 100 : 0,
   219	    sweeps: a.sweeps + b.sweeps,
   220	    unplaceable: unplaceable.length,
   221	  };
   222	}
```

## [11] scripts/policies/week-solve.mjs

```
     1	#!/usr/bin/env node
     2	/**
     3	 * Policy: week-solve
     4	 *
     5	 * The S4 design, implemented. Three layers, each with its own clock:
     6	 *
     7	 *   Layer 1  Book of business — every job has ONE owner tech, derived from
     8	 *            completed visits strictly before the Friday 14:00 PT cutoff.
     9	 *            A job with no owner-bearing history is voted in by its 10 nearest
    10	 *            neighbours that do have one. No lookahead: master-asbuilt's own
    11	 *            routeDay is deliberately NOT used, because it was computed over a
    12	 *            window that contains the golden weeks.
    13	 *
    14	 *   Layer 2  Due window — not a date. Computed from the job's last completed
    15	 *            visit before the cutoff and the state the harness can actually
    16	 *            determine offline:
    17	 *              active TMCP / Quick Fix  -> [last + 5, last + 9]
    18	 *              quiet TMCP               -> [last + 26, last + 35]
    19	 *              state undeterminable     -> the visit's own scheduled day +-2 weekdays
    20	 *            Every window is reported by tier so the reader can see how much of
    21	 *            the result rests on a measured state and how much on a fallback.
    22	 *
    23	 *   Layer 3  The week — solved per tech. Greedy by window urgency, then a
    24	 *            move/swap local search minimising
    25	 *              capacity (quadratic above 8.0 h, hard wall 9.5 h)
    26	 *            + compactness (km from the day-zone medoid)
    27	 *            + weekday drift (small)
    28	 *            subject to: owner tech only, Mon-Fri only, never outside the window.
    29	 *            Anything that cannot fit under the wall goes to `overflow` and is
    30	 *            left unplaced, so the scorecard counts it rather than hiding it.
    31	 *
    32	 * Day-zones: per tech, k-medoids (k=5) over the coordinates of that tech's
    33	 * completed stops before the week. Each zone takes the weekday it was most often
    34	 * served on, one weekday per zone, ties spread across the free weekdays. The
    35	 * zone's cycle time is that tech/weekday's median span-per-stop from the
    36	 * route-day-drive summary, also cut at the week start.
    37	 *
    38	 * Sequencing is NOT done here. The harness sequences every policy's board with
    39	 * the same sequencer, so policies are compared on the board, not the routing.
    40	 *
    41	 * Weight overrides for sensitivity runs, read from the environment:
    42	 *   WS_CAP_W    capacity weight, cost units per (hour above 8.0)^2   default 30
    43	 *   WS_ZONE_W   compactness weight, cost units per km from the medoid default 1
    44	 *   WS_DRIFT_W  weekday-drift weight, cost units per drifted visit    default 1
    45	 *
    46	 * Offline. No network, no oracle.
    47	 */
    48	
    49	import fs from 'node:fs';
    50	import path from 'node:path';
    51	import { dowOf, weekDays, PROJECT } from '../backtest-data.mjs';
    52	
    53	export const name = 'week-solve';
    54	export const description =
    55	  'The S4 design: owner map from history, due windows from the last visit, the week solved per tech under capacity, zone compactness and window constraints.';
    56	export const usesOracle = false;
    57	
    58	const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
    59	
    60	// ---- tuning -----------------------------------------------------------------
    61	
    62	const num = (v, d) => (v == null || v === '' || !Number.isFinite(Number(v)) ? d : Number(v));
    63	const W = {
    64	  cap: num(process.env.WS_CAP_W, 30), // per (hour above 8.0)^2
    65	  zone: num(process.env.WS_ZONE_W, 1), // per km from the day-zone medoid
    66	  drift: num(process.env.WS_DRIFT_W, 1), // per visit not on its last visit's weekday
    67	  late: num(process.env.WS_LATE_W, 2), // per weekday later, for an already-overdue visit
    68	};
    69	// How a visit whose window closed before the week opens is handled.
    70	//   'monday'  strict: its only legal day is the first day of the week
    71	//   'week'    any weekday, with a small cost pushing it early
    72	const OVERDUE_MODE = process.env.WS_OVERDUE === 'week' ? 'week' : 'monday';
    73	const SOFT_HOURS = 8.0;
    74	const WALL_HOURS = 9.5;
    75	const K_ZONES = 5;
    76	const NN_VOTE_K = 10;
    77	const ACTIVE_WINDOW = [5, 9];
    78	const QUIET_WINDOW = [26, 35];
    79	const ACTIVE_GAP_MAX = 12; // last delivered gap at or under this reads as active
    80	const QUIET_GAP_MIN = 20; // at or over this reads as quiet
    81	const FALLBACK_SPREAD = 2; // scheduled day +- this many weekdays
    82	
    83	// ---- small helpers ----------------------------------------------------------
    84	
    85	function haversineKm(aLat, aLng, bLat, bLng) {
    86	  const R = 6371.0088;
    87	  const toRad = (d) => (d * Math.PI) / 180;
    88	  const dLat = toRad(bLat - aLat);
    89	  const dLng = toRad(bLng - aLng);
    90	  const h =
    91	    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    92	  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    93	}
    94	
    95	function median(xs) {
    96	  const s = xs.filter(Number.isFinite).sort((a, b) => a - b);
    97	  if (!s.length) return null;
    98	  const m = s.length >> 1;
    99	  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
   100	}
   101	
   102	function addDaysISO(dateStr, n) {
   103	  const [y, m, d] = dateStr.split('-').map(Number);
   104	  return new Date(Date.UTC(y, m - 1, d) + n * 86400e3).toISOString().slice(0, 10);
   105	}
   106	
   107	function daysBetween(a, b) {
   108	  return (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400e3;
   109	}
   110	
   111	// ---- cycle times ------------------------------------------------------------
   112	
   113	/**
   114	 * Median minutes per stop, per tech per weekday, from the route-day-drive
   115	 * summary — cut at the golden week's Monday so nothing from inside the week (or
   116	 * after it) reaches the capacity model.
   117	 */
   118	function loadCycleTimes(week) {
   119	  const dir = path.join(PROJECT, 'data');
   120	  const out = { byTechDow: new Map(), byTech: new Map(), all: null, routeDaysUsed: 0, file: null };
   121	  let file = null;
   122	  if (fs.existsSync(dir)) {
   123	    const hit = fs
   124	      .readdirSync(dir)
   125	      .filter((f) => /^route-day-drive_.*\.json$/.test(f))
   126	      .sort();
   127	    if (hit.length) file = path.join(dir, hit[hit.length - 1]);
   128	  }
   129	  if (!file) return out;
   130	  out.file = path.basename(file);
   131	  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
   132	  const rows = (raw.routeDays || []).filter((r) => r.day < week && r.stops > 0 && r.span > 0);
   133	  out.routeDaysUsed = rows.length;
   134	  const byTechDow = new Map();
   135	  const byTech = new Map();
   136	  for (const r of rows) {
   137	    const cyc = r.span / r.stops;
   138	    const k = `${r.tech}|${r.dow}`;
   139	    if (!byTechDow.has(k)) byTechDow.set(k, []);
   140	    byTechDow.get(k).push(cyc);
   141	    if (!byTech.has(r.tech)) byTech.set(r.tech, []);
   142	    byTech.get(r.tech).push(cyc);
   143	  }
   144	  for (const [k, xs] of byTechDow) out.byTechDow.set(k, median(xs));
   145	  for (const [k, xs] of byTech) out.byTech.set(k, median(xs));
   146	  out.all = median(rows.map((r) => r.span / r.stops));
   147	  return out;
   148	}
   149	
   150	// ---- k-medoids --------------------------------------------------------------
   151	
   152	/** k-medoids over lat/lng points. Deterministic: farthest-point seeding. */
   153	function kMedoids(points, k, maxIter = 40) {
   154	  if (!points.length) return { medoids: [], labels: [] };
   155	  const n = points.length;
   156	  const kk = Math.min(k, n);
   157	  const d = (i, j) => haversineKm(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
   158	
   159	  // seed: the point nearest the centroid, then repeatedly the farthest point
   160	  // from the current medoid set. No randomness, so a re-run gives the same map.
   161	  const cLat = points.reduce((s, p) => s + p.lat, 0) / n;
   162	  const cLng = points.reduce((s, p) => s + p.lng, 0) / n;
   163	  let first = 0;
   164	  let bestD = Infinity;
   165	  for (let i = 0; i < n; i++) {
   166	    const dd = haversineKm(points[i].lat, points[i].lng, cLat, cLng);
   167	    if (dd < bestD) {
   168	      bestD = dd;
   169	      first = i;
   170	    }
   171	  }
   172	  const medoids = [first];
   173	  while (medoids.length < kk) {
   174	    let far = -1;
   175	    let farD = -1;
   176	    for (let i = 0; i < n; i++) {
   177	      if (medoids.includes(i)) continue;
   178	      let m = Infinity;
   179	      for (const mi of medoids) m = Math.min(m, d(i, mi));
   180	      if (m > farD) {
   181	        farD = m;
   182	        far = i;
   183	      }
   184	    }
   185	    if (far < 0) break;
   186	    medoids.push(far);
   187	  }
   188	
   189	  let labels = new Array(n).fill(0);
   190	  for (let iter = 0; iter < maxIter; iter++) {
   191	    let changed = false;
   192	    for (let i = 0; i < n; i++) {
   193	      let best = 0;
   194	      let bd = Infinity;
   195	      for (let c = 0; c < medoids.length; c++) {
   196	        const dd = d(i, medoids[c]);
   197	        if (dd < bd) {
   198	          bd = dd;
   199	          best = c;
   200	        }
   201	      }
   202	      if (labels[i] !== best) {
   203	        labels[i] = best;
   204	        changed = true;
   205	      }
   206	    }
   207	    // update: the member minimising total distance inside its cluster
   208	    let moved = false;
   209	    for (let c = 0; c < medoids.length; c++) {
   210	      const members = [];
   211	      for (let i = 0; i < n; i++) if (labels[i] === c) members.push(i);
   212	      if (!members.length) continue;
   213	      let best = medoids[c];
   214	      let bestSum = Infinity;
   215	      for (const cand of members) {
   216	        let s = 0;
   217	        for (const m of members) s += d(cand, m);
   218	        if (s < bestSum) {
   219	          bestSum = s;
   220	          best = cand;
   221	        }
   222	      }
   223	      if (best !== medoids[c]) {
   224	        medoids[c] = best;
   225	        moved = true;
   226	      }
   227	    }
   228	    if (!changed && !moved) break;
   229	  }
   230	  return { medoids: medoids.map((i) => ({ lat: points[i].lat, lng: points[i].lng })), labels };
   231	}
   232	
   233	/**
   234	 * One weekday per zone. Each zone bids for the weekday its stops were most often
   235	 * served on; the strongest bids are honoured first and every remaining zone is
   236	 * spread across the weekdays still free.
   237	 */
   238	function zonesToWeekdays(zoneDowCounts, nZones) {
   239	  const bids = [];
   240	  for (let z = 0; z < nZones; z++) {
   241	    const counts = zoneDowCounts[z] || {};
   242	    for (const dw of WEEKDAYS) bids.push({ z, dw, c: counts[dw] || 0 });
   243	  }
   244	  bids.sort((a, b) => b.c - a.c || WEEKDAYS.indexOf(a.dw) - WEEKDAYS.indexOf(b.dw) || a.z - b.z);
   245	  const zoneOf = new Map(); // dow -> zone
   246	  const dowOfZone = new Map(); // zone -> dow
   247	  let ties = 0;
   248	  for (const b of bids) {
   249	    if (dowOfZone.has(b.z) || zoneOf.has(b.dw)) continue;
   250	    if (b.c === 0) ties += 1;
   251	    dowOfZone.set(b.z, b.dw);
   252	    zoneOf.set(b.dw, b.z);
   253	  }
   254	  // any weekday still free gets the nearest-by-count zone already placed
   255	  for (const dw of WEEKDAYS) if (!zoneOf.has(dw)) zoneOf.set(dw, null);
   256	  return { zoneOf, dowOfZone, spreadTies: ties };
   257	}
   258	
   259	// ---- the policy -------------------------------------------------------------
   260	
   261	export function propose(snap) {
   262	  const days = weekDays(snap.week);
   263	  const dowToDate = new Map(days.map((d) => [dowOf(d), d]));
   264	  const dateToDow = new Map(days.map((d) => [d, dowOf(d)]));
   265	  const asOfMs = Date.parse(snap.asOf);
   266	  const roster = snap.techs.slice();
   267	  const rosterSet = new Set(roster);
   268	
   269	  // ---------------------------------------------------------------- history
   270	  // Every completed visit strictly before the Friday 14:00 PT cutoff. The
   271	  // snapshot's history is cut at the week's Monday, which is looser than the
   272	  // cutoff, so re-cut it on the completion instant where one is available.
   273	  const hist = [];
   274	  for (const h of snap.history) {
   275	    const st = snap.stamps.get(h.key);
   276	    const ms = st?.completedAt ? Date.parse(st.completedAt) : Date.parse(`${h.date}T23:59:59Z`);
   277	    if (!(ms < asOfMs)) continue;
   278	    hist.push({ ...h, ms });
   279	  }
   280	  hist.sort((a, b) => a.ms - b.ms);
   281	
   282	  const histByJob = new Map();
   283	  const histByTech = new Map();
   284	  for (const h of hist) {
   285	    if (!histByJob.has(h.jobNumber)) histByJob.set(h.jobNumber, []);
   286	    histByJob.get(h.jobNumber).push(h);
   287	    if (!histByTech.has(h.tech)) histByTech.set(h.tech, []);
   288	    histByTech.get(h.tech).push(h);
   289	  }
   290	
   291	  // ---------------------------------------------------------------- Layer 1
   292	  // Owner tech per job. Dominant tech over completed visits before the cutoff,
   293	  // ties broken by the most recent. A tech no longer on the roster does not
   294	  // count, so a handed-over book re-homes instead of vanishing.
   295	  const jobCoord = new Map();
   296	  for (const v of snap.due) {
   297	    if (v.lat != null && v.lng != null && !jobCoord.has(v.jobNumber)) {
   298	      jobCoord.set(v.jobNumber, { lat: v.lat, lng: v.lng });
   299	    }
   300	  }
   301	  for (const [jn, rows] of histByJob) {
   302	    if (jobCoord.has(jn)) continue;
   303	    const p = rows.find((r) => r.lat != null && r.lng != null);
   304	    if (p) jobCoord.set(jn, { lat: p.lat, lng: p.lng });
   305	  }
   306	  for (const v of snap.due) {
   307	    if (jobCoord.has(v.jobNumber)) continue;
   308	    const j = snap.jobsByNumber.get(v.jobNumber);
   309	    if (j?.property?.lat != null) jobCoord.set(v.jobNumber, { lat: j.property.lat, lng: j.property.lng });
   310	  }
   311	
   312	  const ownerOf = new Map();
   313	  const ownerBasis = { dominant: 0, neighbourVote: 0, rosterFloor: 0 };
   314	  const ownerSupport = [];
   315	  for (const [jn, rows] of histByJob) {
   316	    const counts = new Map();
   317	    const last = new Map();
   318	    for (const r of rows) {
   319	      if (!rosterSet.has(r.tech)) continue;
   320	      counts.set(r.tech, (counts.get(r.tech) || 0) + 1);
   321	      if (!last.has(r.tech) || r.ms > last.get(r.tech)) last.set(r.tech, r.ms);
   322	    }
   323	    let best = null;
   324	    let bc = -1;
   325	    let bl = -1;
   326	    for (const [t, c] of counts) {
   327	      const l = last.get(t);
   328	      if (c > bc || (c === bc && l > bl)) {
   329	        best = t;
   330	        bc = c;
   331	        bl = l;
   332	      }
   333	    }
   334	    if (best) {
   335	      ownerOf.set(jn, best);
   336	      ownerSupport.push(bc / rows.length);
   337	    }
   338	  }
   339	  ownerBasis.dominant = ownerOf.size;
   340	
   341	  // neighbour vote for a job with no owner-bearing history
   342	  const anchored = [...ownerOf.keys()].filter((jn) => jobCoord.has(jn)).map((jn) => ({ jn, ...jobCoord.get(jn) }));
   343	  const needOwner = [...new Set(snap.due.map((v) => v.jobNumber))].filter((jn) => !ownerOf.has(jn));
   344	  for (const jn of needOwner) {
   345	    const c = jobCoord.get(jn);
   346	    if (!c || !anchored.length) {
   347	      ownerOf.set(jn, roster[0]);
   348	      ownerBasis.rosterFloor += 1;
   349	      continue;
   350	    }
   351	    const near = anchored
   352	      .map((a) => ({ jn: a.jn, km: haversineKm(c.lat, c.lng, a.lat, a.lng) }))
   353	      .sort((a, b) => a.km - b.km)
   354	      .slice(0, NN_VOTE_K);
   355	    const votes = new Map();
   356	    for (const nb of near) {
   357	      const t = ownerOf.get(nb.jn);
   358	      // inverse-distance weighting, so a neighbour 0.2 km away outvotes one 8 km away
   359	      votes.set(t, (votes.get(t) || 0) + 1 / Math.max(0.25, nb.km));
   360	    }
   361	    let bt = roster[0];
   362	    let bv = -1;
   363	    for (const [t, v] of votes) if (v > bv) ((bt = t), (bv = v));
   364	    ownerOf.set(jn, bt);
   365	    ownerBasis.neighbourVote += 1;
   366	  }
   367	
   368	  // ---------------------------------------------------------------- Layer 2
   369	  // Due windows.
   370	  const lastVisitOf = new Map(); // jobNumber -> {date, dow, ms}
   371	  const lastGapOf = new Map(); // jobNumber -> delivered gap in days before the cutoff
   372	  for (const [jn, rows] of histByJob) {
   373	    const lastRow = rows[rows.length - 1];
   374	    lastVisitOf.set(jn, lastRow);
   375	    if (rows.length >= 2) lastGapOf.set(jn, daysBetween(rows[rows.length - 2].date, lastRow.date));
   376	  }
   377	
   378	  const windows = {};
   379	  const windowTiers = {};
   380	  const clamps = { none: 0, overdue: 0, early: 0 };
   381	  const bump = (o, k) => (o[k] = (o[k] || 0) + 1);
   382	
   383	  for (const v of snap.due) {
   384	    const lastV = lastVisitOf.get(v.jobNumber);
   385	    const gap = lastGapOf.get(v.jobNumber);
   386	    let tier = null;
   387	    let from = null;
   388	    let to = null;
   389	
   390	    if (lastV && v.product === 'QUICK_FIX') {
   391	      // standing rule: a Quick Fix series is weekly by construction
   392	      tier = 'active-series';
   393	      [from, to] = ACTIVE_WINDOW;
   394	    } else if (lastV && v.product === 'TMCP' && gap != null && gap <= ACTIVE_GAP_MAX) {
   395	      tier = 'active-measured';
   396	      [from, to] = ACTIVE_WINDOW;
   397	    } else if (lastV && v.product === 'TMCP' && gap != null && gap >= QUIET_GAP_MIN) {
   398	      tier = 'quiet-measured';
   399	      [from, to] = QUIET_WINDOW;
   400	    } else if (lastV && v.product === 'TMCP' && gap == null) {
   401	      // one completed visit before the cutoff: an anchor but no delivered gap.
   402	      // Every measurable TMCP gap in this window is weekly, so active is the
   403	      // supported read — flagged as assumed, not measured.
   404	      tier = 'active-assumed';
   405	      [from, to] = ACTIVE_WINDOW;
   406	    } else {
   407	      tier = lastV ? (v.product === 'TMCP' ? 'ambiguous-gap' : 'other-product') : 'no-anchor';
   408	    }
   409	
   410	    let winFrom;
   411	    let winTo;
   412	    if (from != null && lastV) {
   413	      winFrom = addDaysISO(lastV.date, from);
   414	      winTo = addDaysISO(lastV.date, to);
   415	    } else {
   416	      // the harness cannot determine state: fall back to the visit's own
   417	      // scheduled day, plus or minus two weekdays.
   418	      const sd = v.startDate;
   419	      const idx = days.indexOf(sd);
   420	      if (idx >= 0) {
   421	        winFrom = days[Math.max(0, idx - FALLBACK_SPREAD)];
   422	        winTo = days[Math.min(4, idx + FALLBACK_SPREAD)];
   423	      } else {
   424	        winFrom = days[0];
   425	        winTo = days[4];
   426	      }
   427	    }
   428	
   429	    let allowed = days.filter((d) => d >= winFrom && d <= winTo);
   430	    let clamp = 'none';
   431	    if (!allowed.length) {
   432	      if (winTo < days[0]) {
   433	        // the window closed before the week opened: the visit is already late.
   434	        // Strictly, the earliest day of the week is the only placement that
   435	        // honours the window at all; in practice a week of overdue work cannot
   436	        // all land on Monday, so 'week' mode lets it spread and pays a small
   437	        // cost per day of further delay.
   438	        allowed = OVERDUE_MODE === 'week' ? days.slice() : [days[0]];
   439	        clamp = 'overdue';
   440	      } else {
   441	        // the window opens after the week closes, yet the office booked it here
   442	        allowed = [days[4]];
   443	        clamp = 'early';
   444	      }
   445	    }
   446	    clamps[clamp] += 1;
   447	    bump(windowTiers, tier);
   448	    windows[v.key] = {
   449	      from: winFrom,
   450	      to: winTo,
   451	      type: tier,
   452	      clamp,
   453	      allowed,
   454	      anchor: lastV ? lastV.date : null,
   455	      lastDow: lastV ? lastV.dow : dateToDow.get(v.startDate) || null,
   456	    };
   457	  }
   458	
   459	  // ---------------------------------------------------------------- day-zones
   460	  const cyc = loadCycleTimes(snap.week);
   461	  const cycleFor = (tech, dw) =>
   462	    cyc.byTechDow.get(`${tech}|${dw}`) ?? cyc.byTech.get(tech) ?? cyc.all ?? 20;
   463	  const cycleSourceFor = (tech, dw) =>
   464	    cyc.byTechDow.has(`${tech}|${dw}`)
   465	      ? 'tech+weekday'
   466	      : cyc.byTech.has(tech)
   467	        ? 'tech median'
   468	        : cyc.all != null
   469	          ? 'all-tech median'
   470	          : 'default 20 min';
   471	
   472	  const zonesByTech = new Map();
   473	  const cycleSourceCounts = {};
   474	  for (const tech of roster) {
   475	    const pts = (histByTech.get(tech) || []).filter((h) => h.lat != null && h.lng != null);
   476	    const km = kMedoids(pts.map((p) => ({ lat: p.lat, lng: p.lng })), K_ZONES);
   477	    const nZones = km.medoids.length;
   478	    const zoneDowCounts = Array.from({ length: nZones }, () => ({}));
   479	    const zoneSize = new Array(nZones).fill(0);
   480	    km.labels.forEach((z, i) => {
   481	      zoneDowCounts[z][pts[i].dow] = (zoneDowCounts[z][pts[i].dow] || 0) + 1;
   482	      zoneSize[z] += 1;
   483	    });
   484	    const { zoneOf, spreadTies } = zonesToWeekdays(zoneDowCounts, nZones);
   485	    const byDow = new Map();
   486	    for (const dw of WEEKDAYS) {
   487	      const z = zoneOf.get(dw);
   488	      const medoid = z != null && km.medoids[z] ? km.medoids[z] : null;
   489	      const cycle = cycleFor(tech, dw);
   490	      const src = cycleSourceFor(tech, dw);
   491	      bump(cycleSourceCounts, src);
   492	      byDow.set(dw, {
   493	        zone: z,
   494	        medoid,
   495	        stops: z != null ? zoneSize[z] : 0,
   496	        cycleMin: cycle,
   497	        capStops: Math.max(1, Math.floor((WALL_HOURS * 60) / cycle)),
   498	        cycleSource: src,
   499	      });
   500	    }
   501	    zonesByTech.set(tech, { byDow, nZones, spreadTies, points: pts.length, medoids: km.medoids });
   502	  }
   503	
   504	  // ---------------------------------------------------------------- Layer 3
   505	  const byTech = new Map(roster.map((t) => [t, []]));
   506	  const offRoster = [];
   507	  for (const v of snap.due) {
   508	    const t = ownerOf.get(v.jobNumber);
   509	    if (!byTech.has(t)) {
   510	      offRoster.push(v.key);
   511	      byTech.get(roster[0]).push(v);
   512	      continue;
   513	    }
   514	    byTech.get(t).push(v);
   515	  }
   516	
   517	  const assignments = [];
   518	  const overflow = [];
   519	  const perTech = [];
   520	
   521	  for (const tech of roster) {
   522	    const visits = byTech.get(tech);
   523	    const zoneInfo = zonesByTech.get(tech);
   524	    const dayMeta = new Map();
   525	    for (const d of days) {
   526	      const dw = dateToDow.get(d);
   527	      const z = zoneInfo.byDow.get(dw);
   528	      dayMeta.set(d, { date: d, dow: dw, ...z });
   529	    }
   530	
   531	    // per-visit, per-day cost pieces that never change
   532	    const items = visits.map((v) => {
   533	      const w = windows[v.key];
   534	      const zoneKm = new Map();
   535	      for (const d of days) {
   536	        const m = dayMeta.get(d);
   537	        const km = m.medoid && v.lat != null ? haversineKm(v.lat, v.lng, m.medoid.lat, m.medoid.lng) : 0;
   538	        zoneKm.set(d, km);
   539	      }
   540	      return {
   541	        key: v.key,
   542	        v,
   543	        allowed: w.allowed,
   544	        zoneKm,
   545	        lastDow: w.lastDow,
   546	        winTo: w.to,
   547	        overdue: w.clamp === 'overdue',
   548	      };
   549	    });
   550	
   551	    const load = new Map(days.map((d) => [d, 0]));
   552	    const place = new Map();
   553	
   554	    const dayHours = (d, n) => (n * dayMeta.get(d).cycleMin) / 60;
   555	    const capCost = (d, n) => {
   556	      const h = dayHours(d, n);
   557	      return h > SOFT_HOURS ? W.cap * (h - SOFT_HOURS) ** 2 : 0;
   558	    };
   559	    const itemCost = (it, d) =>
   560	      W.zone * it.zoneKm.get(d) +
   561	      (it.lastDow && dateToDow.get(d) !== it.lastDow ? W.drift : 0) +
   562	      (it.overdue ? W.late * days.indexOf(d) : 0);
   563	    const feasible = (it, d) => it.allowed.includes(d) && load.get(d) < dayMeta.get(d).capStops;
   564	
   565	    // ---- greedy, most urgent first: fewest legal days, then the window closing soonest
   566	    const order = items
   567	      .slice()
   568	      .sort((a, b) => a.allowed.length - b.allowed.length || (a.winTo < b.winTo ? -1 : a.winTo > b.winTo ? 1 : 0));
   569	    for (const it of order) {
   570	      let bestD = null;
   571	      let bestC = Infinity;
   572	      for (const d of it.allowed) {
   573	        if (!feasible(it, d)) continue;
   574	        const n = load.get(d);
   575	        const c = itemCost(it, d) + (capCost(d, n + 1) - capCost(d, n));
   576	        if (c < bestC) {
   577	          bestC = c;
   578	          bestD = d;
   579	        }
   580	      }
   581	      if (!bestD) {
   582	        overflow.push(it.key);
   583	        continue;
   584	      }
   585	      place.set(it.key, bestD);
   586	      load.set(bestD, load.get(bestD) + 1);
   587	    }
   588	
   589	    // ---- local search: moves then swaps, until nothing improves
   590	    const totalCost = () => {
   591	      let c = 0;
   592	      for (const d of days) c += capCost(d, load.get(d));
   593	      for (const it of items) {
   594	        const d = place.get(it.key);
   595	        if (d) c += itemCost(it, d);
   596	      }
   597	      return c;
   598	    };
   599	    const placedItems = () => items.filter((it) => place.has(it.key));
   600	
   601	    let pass = 0;
   602	    let improved = true;
   603	    let moves = 0;
   604	    let swaps = 0;
   605	    let reinserted = 0;
   606	    while (improved && pass < 25) {
   607	      improved = false;
   608	      pass += 1;
   609	
   610	      // move
   611	      for (const it of placedItems()) {
   612	        const from = place.get(it.key);
   613	        let bestD = null;
   614	        let bestGain = 1e-9;
   615	        for (const d of it.allowed) {
   616	          if (d === from) continue;
   617	          if (load.get(d) >= dayMeta.get(d).capStops) continue;
   618	          const nf = load.get(from);
   619	          const nt = load.get(d);
   620	          const delta =
   621	            itemCost(it, d) -
   622	            itemCost(it, from) +
   623	            (capCost(from, nf - 1) - capCost(from, nf)) +
   624	            (capCost(d, nt + 1) - capCost(d, nt));
   625	          if (-delta > bestGain) {
   626	            bestGain = -delta;
   627	            bestD = d;
   628	          }
   629	        }
   630	        if (bestD) {
   631	          load.set(from, load.get(from) - 1);
   632	          load.set(bestD, load.get(bestD) + 1);
   633	          place.set(it.key, bestD);
   634	          improved = true;
   635	          moves += 1;
   636	        }
   637	      }
   638	
   639	      // swap: two visits exchange days. Capacity is unchanged by a swap, so only
   640	      // the item costs matter, which makes this the cheap half of the search.
   641	      const pl = placedItems();
   642	      for (let i = 0; i < pl.length; i++) {
   643	        const a = pl[i];
   644	        const da = place.get(a.key);
   645	        for (let j = i + 1; j < pl.length; j++) {
   646	          const b = pl[j];
   647	          const db = place.get(b.key);
   648	          if (da === db) continue;
   649	          if (!a.allowed.includes(db) || !b.allowed.includes(da)) continue;
   650	          const delta =
   651	            itemCost(a, db) + itemCost(b, da) - itemCost(a, da) - itemCost(b, db);
   652	          if (delta < -1e-9) {
   653	            place.set(a.key, db);
   654	            place.set(b.key, da);
   655	            improved = true;
   656	            swaps += 1;
   657	            break;
   658	          }
   659	        }
   660	      }
   661	
   662	      // a move may have freed room under the wall for something overflowed
   663	      if (overflow.length) {
   664	        for (let i = overflow.length - 1; i >= 0; i--) {
   665	          const it = items.find((x) => x.key === overflow[i]);
   666	          if (!it) continue;
   667	          let bestD = null;
   668	          let bestC = Infinity;
   669	          for (const d of it.allowed) {
   670	            if (load.get(d) >= dayMeta.get(d).capStops) continue;
   671	            const n = load.get(d);
   672	            const c = itemCost(it, d) + (capCost(d, n + 1) - capCost(d, n));
   673	            if (c < bestC) {
   674	              bestC = c;
   675	              bestD = d;
   676	            }
   677	          }
   678	          if (bestD) {
   679	            place.set(it.key, bestD);
   680	            load.set(bestD, load.get(bestD) + 1);
   681	            overflow.splice(i, 1);
   682	            improved = true;
   683	            reinserted += 1;
   684	          }
   685	        }
   686	      }
   687	    }
   688	
   689	    for (const [key, date] of place) assignments.push({ key, tech, date });
   690	
   691	    perTech.push({
   692	      tech,
   693	      visits: visits.length,
   694	      placed: place.size,
   695	      overflow: visits.length - place.size,
   696	      searchPasses: pass,
   697	      moves,
   698	      swaps,
   699	      reinserted,
   700	      finalCost: Math.round(totalCost()),
   701	      zonePoints: zoneInfo.points,
   702	      zones: zoneInfo.nZones,
   703	      days: days.map((d) => {
   704	        const m = dayMeta.get(d);
   705	        const n = load.get(d);
   706	        return {
   707	          date: d,
   708	          dow: m.dow,
   709	          stops: n,
   710	          cycleMin: Math.round(m.cycleMin * 10) / 10,
   711	          cycleSource: m.cycleSource,
   712	          capStops: m.capStops,
   713	          cycleHours: Math.round(dayHours(d, n) * 100) / 100,
   714	          over8: dayHours(d, n) > SOFT_HOURS,
   715	          over95: dayHours(d, n) > WALL_HOURS,
   716	        };
   717	      }),
   718	    });
   719	  }
   720	
   721	  const cycleHoursDays = perTech.flatMap((t) => t.days);
   722	
   723	  return {
   724	    assignments,
   725	    windows,
   726	    overflow,
   727	    notes: {
   728	      weights: { ...W, softHours: SOFT_HOURS, wallHours: WALL_HOURS, overdueMode: OVERDUE_MODE },
   729	      ownerMap: {
   730	        jobs: ownerOf.size,
   731	        ...ownerBasis,
   732	        medianDominantShare: Math.round((median(ownerSupport) ?? 0) * 100) / 100,
   733	        note: 'Dominant tech over completed visits strictly before the Friday 14:00 PT cutoff. master-asbuilt routeDay deliberately unused: it was derived over a window containing the golden weeks.',
   734	      },
   735	      windowTiers,
   736	      windowClamps: clamps,
   737	      windowTierNote:
   738	        'active-measured = last delivered gap <=12d. quiet-measured = >=20d. active-assumed = a TMCP anchor but only one completed visit before the cutoff, so no gap to measure. no-anchor / ambiguous-gap / other-product fall back to the scheduled day +-2 weekdays.',
   739	      dayZones: {
   740	        k: K_ZONES,
   741	        perTech: [...zonesByTech.entries()].map(([t, z]) => ({
   742	          tech: t,
   743	          points: z.points,
   744	          zones: z.nZones,
   745	          spreadTies: z.spreadTies,
   746	          weekdayMap: WEEKDAYS.map((dw) => {
   747	            const m = z.byDow.get(dw);
   748	            return `${dw}:z${m.zone ?? '-'}(${m.stops} pts, ${Math.round(m.cycleMin * 10) / 10} min/stop, cap ${m.capStops})`;
   749	          }).join(' '),
   750	        })),
   751	      },
   752	      cycleTimes: {
   753	        file: cyc.file,
   754	        routeDaysBeforeWeek: cyc.routeDaysUsed,
   755	        allTechMedianMinPerStop: Math.round((cyc.all ?? 0) * 100) / 100,
   756	        sources: cycleSourceCounts,
   757	      },
   758	      capacityAtCycleTime: {
   759	        routeDays: cycleHoursDays.length,
   760	        over8h: cycleHoursDays.filter((d) => d.over8).length,
   761	        over95h: cycleHoursDays.filter((d) => d.over95).length,
   762	        maxHours: Math.max(...cycleHoursDays.map((d) => d.cycleHours)),
   763	      },
   764	      overflowCount: overflow.length,
   765	      offRosterOwners: offRoster.length,
   766	      perTech,
   767	      historyVisitsBeforeCutoff: hist.length,
   768	      historyDays: new Set(hist.map((h) => h.date)).size,
   769	    },
   770	  };
   771	}
```

## [12] scripts/policies/dominant-routeday.mjs

```
     1	#!/usr/bin/env node
     2	/**
     3	 * Policy: dominant-routeday
     4	 *
     5	 * The crude static master route. For every job, look only at completed visits
     6	 * from BEFORE the golden week and take the (tech, weekday) pair that job was
     7	 * most often served on. Every due visit of that job goes to that tech on that
     8	 * weekday's date inside the golden week.
     9	 *
    10	 * Strictly no lookahead: it never reads snap.actual, and its history is cut at
    11	 * the week's Monday. That makes it an honest answer to "how far does a fixed
    12	 * master route get on its own, before any cadence or capacity logic".
    13	 *
    14	 * Fallback ladder, for jobs with no prior history (counted in notes.tiers):
    15	 *   1. job history        the job's own dominant (tech, weekday)
    16	 *   2. zip history        the dominant (tech, weekday) across that ZIP's history
    17	 *   3. nearest start      the tech whose inferred start area is closest, on that
    18	 *                         tech's busiest weekday in the history
    19	 *   4. floor              first tech in the roster, Wednesday
    20	 */
    21	
    22	import { dowOf, weekDays } from '../backtest-data.mjs';
    23	
    24	export const name = 'dominant-routeday';
    25	export const description =
    26	  'Static master route — each job to the tech and weekday it was most often served on before the week.';
    27	export const usesOracle = false;
    28	
    29	const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
    30	
    31	function haversineKm(aLat, aLng, bLat, bLng) {
    32	  const R = 6371.0088;
    33	  const toRad = (d) => (d * Math.PI) / 180;
    34	  const dLat = toRad(bLat - aLat);
    35	  const dLng = toRad(bLng - aLng);
    36	  const h =
    37	    Math.sin(dLat / 2) ** 2 +
    38	    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    39	  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    40	}
    41	
    42	/** Most frequent value; ties broken by the most recent observation. */
    43	function dominant(rows, keyFn) {
    44	  const counts = new Map();
    45	  const latest = new Map();
    46	  for (const r of rows) {
    47	    const k = keyFn(r);
    48	    counts.set(k, (counts.get(k) || 0) + 1);
    49	    if (!latest.has(k) || r.date > latest.get(k)) latest.set(k, r.date);
    50	  }
    51	  let best = null;
    52	  let bestCount = -1;
    53	  let bestDate = '';
    54	  for (const [k, c] of counts) {
    55	    const d = latest.get(k);
    56	    if (c > bestCount || (c === bestCount && d > bestDate)) {
    57	      best = k;
    58	      bestCount = c;
    59	      bestDate = d;
    60	    }
    61	  }
    62	  return best == null ? null : { value: best, count: bestCount, of: rows.length, lastSeen: bestDate };
    63	}
    64	
    65	export function propose(snap) {
    66	  const days = weekDays(snap.week);
    67	  const dateForDow = new Map(days.map((d) => [dowOf(d), d]));
    68	
    69	  // history is already cut at the week Monday by the snapshot builder
    70	  const byJob = new Map();
    71	  const byZip = new Map();
    72	  const byTech = new Map();
    73	  for (const h of snap.history) {
    74	    if (!WEEKDAYS.includes(h.dow)) continue; // ignore stray weekend stamps
    75	    if (!byJob.has(h.jobNumber)) byJob.set(h.jobNumber, []);
    76	    byJob.get(h.jobNumber).push(h);
    77	    if (h.zip) {
    78	      if (!byZip.has(h.zip)) byZip.set(h.zip, []);
    79	      byZip.get(h.zip).push(h);
    80	    }
    81	    if (!byTech.has(h.tech)) byTech.set(h.tech, []);
    82	    byTech.get(h.tech).push(h);
    83	  }
    84	
    85	  const techBusiestDow = new Map();
    86	  for (const [t, rows] of byTech) {
    87	    const d = dominant(rows, (r) => r.dow);
    88	    techBusiestDow.set(t, d ? d.value : 'wed');
    89	  }
    90	
    91	  const roster = snap.techs.slice();
    92	  const tiers = { job: 0, zip: 0, nearestStart: 0, floor: 0 };
    93	  const assignments = [];
    94	  const decisionsByJob = new Map();
    95	
    96	  for (const v of snap.due) {
    97	    let decision = decisionsByJob.get(v.jobNumber);
    98	    if (!decision) {
    99	      decision = decide(v);
   100	      decisionsByJob.set(v.jobNumber, decision);
   101	    }
   102	    tiers[decision.tier] += 1;
   103	    assignments.push({ key: v.key, tech: decision.tech, date: decision.date });
   104	  }
   105	
   106	  function decide(v) {
   107	    const jobRows = byJob.get(v.jobNumber) || [];
   108	    if (jobRows.length) {
   109	      const d = dominant(jobRows, (r) => `${r.tech}|${r.dow}`);
   110	      const [tech, dow] = d.value.split('|');
   111	      if (roster.includes(tech) && dateForDow.has(dow)) {
   112	        return { tier: 'job', tech, date: dateForDow.get(dow), support: d };
   113	      }
   114	      // the dominant tech has left the roster: keep the weekday, re-home the tech
   115	      if (dateForDow.has(dow)) {
   116	        const t = nearestTech(v);
   117	        if (t) return { tier: 'job', tech: t, date: dateForDow.get(dow), support: d };
   118	      }
   119	    }
   120	    const zipRows = v.zip ? byZip.get(v.zip) || [] : [];
   121	    if (zipRows.length) {
   122	      const d = dominant(zipRows, (r) => `${r.tech}|${r.dow}`);
   123	      const [tech, dow] = d.value.split('|');
   124	      if (roster.includes(tech) && dateForDow.has(dow)) {
   125	        return { tier: 'zip', tech, date: dateForDow.get(dow), support: d };
   126	      }
   127	    }
   128	    const t = nearestTech(v);
   129	    if (t) {
   130	      const dow = techBusiestDow.get(t) || 'wed';
   131	      return { tier: 'nearestStart', tech: t, date: dateForDow.get(dow) || dateForDow.get('wed') };
   132	    }
   133	    return { tier: 'floor', tech: roster[0], date: dateForDow.get('wed') || days[2] };
   134	  }
   135	
   136	  function nearestTech(v) {
   137	    if (v.lat == null) return roster[0] || null;
   138	    let best = null;
   139	    let bestKm = Infinity;
   140	    for (const t of roster) {
   141	      const sa = snap.startAreas[t];
   142	      if (!sa) continue;
   143	      const km = haversineKm(v.lat, v.lng, sa.lat, sa.lng);
   144	      if (km < bestKm) {
   145	        bestKm = km;
   146	        best = t;
   147	      }
   148	    }
   149	    return best;
   150	  }
   151	
   152	  return {
   153	    assignments,
   154	    notes: {
   155	      tiers,
   156	      jobsWithHistory: byJob.size,
   157	      historyVisits: snap.history.length,
   158	      historyDays: new Set(snap.history.map((h) => h.date)).size,
   159	      comment:
   160	        'History is every completed visit strictly before the golden week Monday. No lookahead, no oracle.',
   161	    },
   162	  };
   163	}
```

## [13] scripts/policies/keep-actual.mjs

```
     1	#!/usr/bin/env node
     2	/**
     3	 * Policy: keep-actual
     4	 *
     5	 * The oracle baseline. Proposes exactly the tech and day each visit actually
     6	 * got, so tech and day agreement land at 100% by construction. It exists to
     7	 * validate the harness: if keep-actual does not score ~100% on tech and day,
     8	 * the join or the scorer is broken, not the policy.
     9	 *
    10	 * It still gets sequenced by sequence.mjs like any other policy, which makes
    11	 * its route-time ratio a direct read on the sequencer: same stops, same days,
    12	 * same techs as OptimoRoute, only the order differs.
    13	 *
    14	 * This policy READS THE ORACLE (snap.actual). No other policy may.
    15	 */
    16	
    17	export const name = 'keep-actual';
    18	export const description = 'Oracle baseline — the tech and day each visit actually got.';
    19	export const usesOracle = true;
    20	
    21	export function propose(snap) {
    22	  const assignments = [];
    23	  const unresolved = [];
    24	  for (const v of snap.due) {
    25	    const a = snap.actual.get(v.key);
    26	    if (!a || !a.tech || !a.date) {
    27	      unresolved.push(v.key);
    28	      continue;
    29	    }
    30	    assignments.push({ key: v.key, tech: a.tech, date: a.date });
    31	  }
    32	  return {
    33	    assignments,
    34	    notes: {
    35	      unresolvedVisits: unresolved.length,
    36	      unresolvedKeys: unresolved.slice(0, 40),
    37	      comment:
    38	        'Visits with no resolvable actual are left unassigned and count as drops; they are the same visits the scorer cannot score.',
    39	    },
    40	  };
    41	}
```

## [14] scripts/travel.mjs

```
     1	#!/usr/bin/env node
     2	/**
     3	 * travel.mjs
     4	 *
     5	 * Offline travel-time lookup for the route-engine backtest.
     6	 *
     7	 *   travel(from, to, driver)      -> { seconds, metres, source: 'observed'|'estimated' }
     8	 *   routeTime(stops, driver)      -> { travelSeconds, serviceMinutes, totalMinutes, ... }
     9	 *
    10	 * `from` / `to` are { lat, lng } (also accepts latitude/longitude, or [lat, lng]).
    11	 * Observed place pairs come straight from the OptimoRoute history; anything unseen
    12	 * falls back to the per-driver haversine estimator fitted in build-travel-model.mjs.
    13	 *
    14	 * Self-test (run this file directly) replays every real route-day through routeTime
    15	 * and reports per-day error against the day's own recorded legs + service.
    16	 *
    17	 * Offline only. No network calls.
    18	 */
    19	
    20	import fs from 'node:fs';
    21	import path from 'node:path';
    22	import { fileURLToPath } from 'node:url';
    23	
    24	const __dirname = path.dirname(fileURLToPath(import.meta.url));
    25	const ROOT = path.resolve(__dirname, '..');
    26	const MODEL_FILE = path.join(ROOT, 'data', 'travel-model.json');
    27	const ROUTES_DIR = path.join(ROOT, 'data', 'optimo-routes');
    28	
    29	const COORD_DP = 5;
    30	
    31	let MODEL = null;
    32	
    33	export function loadModel(file = MODEL_FILE) {
    34	  if (!MODEL) MODEL = JSON.parse(fs.readFileSync(file, 'utf8'));
    35	  return MODEL;
    36	}
    37	
    38	export function placeId(lat, lng) {
    39	  return `${Number(lat).toFixed(COORD_DP)},${Number(lng).toFixed(COORD_DP)}`;
    40	}
    41	
    42	export function haversineMetres(aLat, aLng, bLat, bLng) {
    43	  const R = 6371008.8;
    44	  const toRad = (d) => (d * Math.PI) / 180;
    45	  const dLat = toRad(bLat - aLat);
    46	  const dLng = toRad(bLng - aLng);
    47	  const h =
    48	    Math.sin(dLat / 2) ** 2 +
    49	    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    50	  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    51	}
    52	
    53	function coord(p) {
    54	  if (Array.isArray(p)) return { lat: Number(p[0]), lng: Number(p[1]) };
    55	  const lat = p.lat ?? p.latitude;
    56	  const lng = p.lng ?? p.lon ?? p.longitude;
    57	  if (lat == null || lng == null) throw new Error(`travel: bad coordinate ${JSON.stringify(p)}`);
    58	  return { lat: Number(lat), lng: Number(lng) };
    59	}
    60	
    61	function fitFor(driver) {
    62	  const m = loadModel();
    63	  return m.estimator.drivers[driver] || m.estimator.drivers.ALL;
    64	}
    65	
    66	/**
    67	 * Travel between two points for a given driver.
    68	 * @param {{lat:number,lng:number}} from
    69	 * @param {{lat:number,lng:number}} to
    70	 * @param {string} driver
    71	 * @param {{forceEstimate?:boolean}} [opts]
    72	 * @returns {{seconds:number, metres:number, source:'observed'|'estimated'}}
    73	 */
    74	export function travel(from, to, driver, opts = {}) {
    75	  const m = loadModel();
    76	  const a = coord(from);
    77	  const b = coord(to);
    78	  const idA = placeId(a.lat, a.lng);
    79	  const idB = placeId(b.lat, b.lng);
    80	
    81	  if (!opts.forceEstimate) {
    82	    // 1. the exact directed leg A->B, if it was ever driven
    83	    const dp = m.directedPairs?.[`${idA}>${idB}`];
    84	    if (dp) {
    85	      return { seconds: dp.medianSeconds, metres: dp.medianMetres, source: 'observed', via: 'directed' };
    86	    }
    87	    // 2. the same pair driven the other way (travel is near-symmetric: median 4.4% apart)
    88	    const key = idA <= idB ? `${idA}|${idB}` : `${idB}|${idA}`;
    89	    const p = m.pairs[key];
    90	    if (p) {
    91	      return { seconds: p.medianSeconds, metres: p.medianMetres, source: 'observed', via: 'reverse' };
    92	    }
    93	    // 3. two stops at the same rounded location (clusters like Barbee Mill) are free
    94	    if (idA === idB) return { seconds: 0, metres: 0, source: 'observed', via: 'same-place' };
    95	  }
    96	
    97	  const fit = fitFor(driver);
    98	  const hav = haversineMetres(a.lat, a.lng, b.lat, b.lng);
    99	  const metres = Math.max(0, fit.metres.a + fit.metres.b * hav);
   100	  const seconds = Math.max(0, fit.seconds.c + fit.seconds.d * metres);
   101	  return { seconds, metres, source: 'estimated', via: 'haversine-fit' };
   102	}
   103	
   104	/**
   105	 * Total time for an ordered stop list. Does NOT include the inbound leg to the first
   106	 * stop: the source data has no depot, so a route's start location is unknown.
   107	 * @param {Array<object>} stops each {lat,lng,serviceMinutes|serviceDurationMin}
   108	 * @param {string} driver
   109	 */
   110	export function routeTime(stops, driver, opts = {}) {
   111	  const legs = [];
   112	  let travelSeconds = 0;
   113	  let travelMetres = 0;
   114	  let serviceMinutes = 0;
   115	  let observed = 0;
   116	  let estimated = 0;
   117	
   118	  for (let i = 0; i < stops.length; i++) {
   119	    const s = stops[i];
   120	    serviceMinutes += Number(s.serviceMinutes ?? s.serviceDurationMin ?? 0);
   121	    if (i === 0) continue;
   122	    const t = travel(stops[i - 1], s, driver, opts);
   123	    travelSeconds += t.seconds;
   124	    travelMetres += t.metres;
   125	    if (t.source === 'observed') observed += 1;
   126	    else estimated += 1;
   127	    legs.push({ index: i, ...t });
   128	  }
   129	
   130	  return {
   131	    stops: stops.length,
   132	    legs,
   133	    observedLegs: observed,
   134	    estimatedLegs: estimated,
   135	    travelSeconds,
   136	    travelMinutes: travelSeconds / 60,
   137	    travelMetres,
   138	    serviceMinutes,
   139	    totalMinutes: travelSeconds / 60 + serviceMinutes,
   140	  };
   141	}
   142	
   143	// ---------------------------------------------------------------- self-test
   144	
   145	function median(xs) {
   146	  if (!xs.length) return null;
   147	  const s = [...xs].sort((a, b) => a - b);
   148	  const m = s.length >> 1;
   149	  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
   150	}
   151	const r1 = (n) => Math.round(n * 10) / 10;
   152	const r2 = (n) => Math.round(n * 100) / 100;
   153	
   154	function selfTest() {
   155	  loadModel();
   156	  const files = fs
   157	    .readdirSync(ROUTES_DIR)
   158	    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
   159	    .sort();
   160	
   161	  const modes = [
   162	    { name: 'REPLAY (pairs + estimator)', opts: {} },
   163	    { name: 'ESTIMATOR ONLY (pairs disabled)', opts: { forceEstimate: true } },
   164	  ];
   165	
   166	  for (const mode of modes) {
   167	    console.log(`\n================ ${mode.name} ================`);
   168	    console.log(
   169	      'date        driver             stops  actualMin  modelMin   errMin   err%   obs/est'
   170	    );
   171	    const dayErrPct = [];
   172	    const legErrPct = [];
   173	    let exactRoutes = 0;
   174	    let totalRoutes = 0;
   175	    let exactLegs = 0;
   176	    let totalLegs = 0;
   177	
   178	    for (const f of files) {
   179	      const day = JSON.parse(fs.readFileSync(path.join(ROUTES_DIR, f), 'utf8'));
   180	      if (!day.routes || !day.routes.length) continue;
   181	      for (const route of day.routes) {
   182	        const driver = route.driverSerial || route.driverName || 'UNKNOWN';
   183	        const stops = (route.stops || []).filter((s) => s.latitude != null && s.longitude != null);
   184	        if (stops.length < 2) continue;
   185	        totalRoutes += 1;
   186	
   187	        // actual: legs from stop 2 onward (stop 1's inbound leg has no known origin) + service
   188	        let actualTravelSec = 0;
   189	        let actualService = 0;
   190	        for (let i = 0; i < stops.length; i++) {
   191	          actualService += stops[i].serviceDurationMin ?? 0;
   192	          if (i > 0) actualTravelSec += stops[i].travelTimeSec ?? 0;
   193	        }
   194	        const actualMin = actualTravelSec / 60 + actualService;
   195	
   196	        const rt = routeTime(
   197	          stops.map((s) => ({
   198	            lat: s.latitude,
   199	            lng: s.longitude,
   200	            serviceMinutes: s.serviceDurationMin ?? 0,
   201	          })),
   202	          driver,
   203	          mode.opts
   204	        );
   205	
   206	        const errMin = rt.totalMinutes - actualMin;
   207	        const errPct = actualMin > 0 ? Math.abs(errMin) / actualMin : 0;
   208	        dayErrPct.push(errPct);
   209	        if (Math.abs(errMin) < 0.0001) exactRoutes += 1;
   210	
   211	        // per-leg error
   212	        for (let i = 1; i < stops.length; i++) {
   213	          const act = stops[i].travelTimeSec ?? 0;
   214	          const pred = rt.legs[i - 1].seconds;
   215	          totalLegs += 1;
   216	          if (pred === act) exactLegs += 1;
   217	          if (act >= 60) legErrPct.push(Math.abs(pred - act) / act);
   218	        }
   219	
   220	        console.log(
   221	          [
   222	            day.date,
   223	            driver.padEnd(18),
   224	            String(stops.length).padStart(5),
   225	            String(r1(actualMin)).padStart(10),
   226	            String(r1(rt.totalMinutes)).padStart(9),
   227	            String(r1(errMin)).padStart(8),
   228	            String(r2(errPct * 100)).padStart(6),
   229	            `  ${rt.observedLegs}/${rt.estimatedLegs}`,
   230	          ].join(' ')
   231	        );
   232	      }
   233	    }
   234	
   235	    console.log(
   236	      `\n  routes tested: ${totalRoutes}  |  reproduced exactly: ${exactRoutes} (${r1(
   237	        (exactRoutes / totalRoutes) * 100
   238	      )}%)`
   239	    );
   240	    console.log(
   241	      `  legs tested: ${totalLegs}  |  reproduced exactly: ${exactLegs} (${r1(
   242	        (exactLegs / totalLegs) * 100
   243	      )}%)`
   244	    );
   245	    console.log(`  median route-total abs error: ${r2(median(dayErrPct) * 100)}%`);
   246	    console.log(`  median per-leg abs error (legs >= 60s): ${r2(median(legErrPct) * 100)}%`);
   247	    console.log(
   248	      `  p90 per-leg abs error: ${r2(
   249	        [...legErrPct].sort((a, b) => a - b)[Math.floor(legErrPct.length * 0.9)] * 100
   250	      )}%`
   251	    );
   252	  }
   253	}
   254	
   255	if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
   256	  selfTest();
   257	}
```

## [15] scripts/derive-cadence.mjs

```
     1	// derive-cadence.mjs - S3b. Measure how visit cadence ACTUALLY runs.
     2	// Derives from data only. Does not read scheduling-rules.json or any rulebook.
     3	// Inputs:  redesign/data/jobber/jobs.json, visits.json, notes-sample.json
     4	// Output:  redesign/data/cadence-asbuilt.json
     5	import fs from 'node:fs';
     6	import path from 'node:path';
     7	import { fileURLToPath } from 'node:url';
     8	
     9	const HERE = path.dirname(fileURLToPath(import.meta.url));
    10	const REDESIGN = path.resolve(HERE, '..');
    11	const DATA = path.join(REDESIGN, 'data');
    12	const JB = path.join(DATA, 'jobber');
    13	const AS_OF = '2026-09-18';
    14	
    15	const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));
    16	
    17	// ---------- date helpers (Pacific = UTC-7 in Aug/Sep 2026) ----------
    18	const PAC_OFFSET_H = 7;
    19	const pacDate = iso => {
    20	  const t = new Date(iso).getTime() - PAC_OFFSET_H * 3600e3;
    21	  return new Date(t).toISOString().slice(0, 10);
    22	};
    23	const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    24	const dowOf = ymd => DOW[new Date(ymd + 'T12:00:00Z').getUTCDay()];
    25	const dayNum = ymd => Math.round(new Date(ymd + 'T12:00:00Z').getTime() / 86400e3);
    26	const diffDays = (a, b) => dayNum(b) - dayNum(a);
    27	// addDays must round-trip through the SAME anchor dayNum uses, or week ends land a day late.
    28	const addDays = (ymd, n) => new Date(new Date(ymd + 'T12:00:00Z').getTime() + n * 86400e3).toISOString().slice(0, 10);
    29	
    30	// ---------- stats ----------
    31	const q = (arr, p) => {
    32	  if (!arr.length) return null;
    33	  const s = [...arr].sort((a, b) => a - b);
    34	  const i = (s.length - 1) * p;
    35	  const lo = Math.floor(i), hi = Math.ceil(i);
    36	  return +(s[lo] + (s[hi] - s[lo]) * (i - lo)).toFixed(1);
    37	};
    38	const dist = arr => ({
    39	  n: arr.length, median: q(arr, 0.5), p25: q(arr, 0.25), p75: q(arr, 0.75),
    40	  min: arr.length ? Math.min(...arr) : null, max: arr.length ? Math.max(...arr) : null,
    41	  shareWeekly: arr.length ? +(arr.filter(d => d <= 10).length / arr.length * 100).toFixed(1) : null,
    42	  shareMonthlyish: arr.length ? +(arr.filter(d => d >= 24 && d <= 38).length / arr.length * 100).toFixed(1) : null,
    43	});
    44	
    45	// ---------- product from line items ----------
    46	function productOf(job) {
    47	  const names = (job.lineItems || []).map(li => String(li.name || '').toLowerCase());
    48	  if (names.some(n => n.includes('total mole control'))) return 'TMCP';
    49	  if (names.some(n => n.includes('quick fix'))) return 'Quick Fix';
    50	  if (names.some(n => n.includes('friends and family'))) return 'Friends and family';
    51	  if (names.some(n => n.includes('barter'))) return 'Barter';
    52	  if (!names.length) return 'none (bid)';
    53	  return 'other';
    54	}
    55	
    56	// ---------- custom fields (labels carry trailing whitespace in Jobber) ----------
    57	function cf(job) {
    58	  const m = {};
    59	  for (const c of job.customFields || []) m[String(c.label).trim()] = c.value;
    60	  const norm = v => (v === '' || v === undefined) ? null : v;
    61	  return {
    62	    activity: norm(m['Latest Activity']),
    63	    moles: typeof m['Moles Caught (last visit)'] === 'number' ? m['Moles Caught (last visit)'] : null,
    64	    misses: typeof m['Misses (last visit)'] === 'number' ? m['Misses (last visit)'] : null,
    65	    nextAction: norm(m['Next Action']),
    66	    totalCaught: typeof m['Total Caught'] === 'number' ? m['Total Caught'] : null,
    67	  };
    68	}
    69	
    70	// trigger classification from a state record
    71	function triggerOf(st) {
    72	  if (st.moles > 0) return 'catch';
    73	  if (st.misses > 0) return 'miss (no catch)';
    74	  if (st.activity === 'High') return 'activity High (no catch/miss)';
    75	  if (st.activity === 'Moderate') return 'activity Moderate (no catch/miss)';
    76	  if (st.activity === 'Low') return 'activity Low (no catch/miss)';
    77	  if (st.activity === 'None') return 'quiet (None, no catch/miss)';
    78	  return 'unknown';
    79	}
    80	// how long the office's own Next Action field allows before the next visit (target + 3d grace)
    81	const NA_LIMIT = { 'Add visit': 10, Weekly: 10, '2 weeks': 17, Monthly: 33 };
    82	
    83	// ---------- load ----------
    84	const jobs = rd(path.join(JB, 'jobs.json'));
    85	const visits = rd(path.join(JB, 'visits.json'));
    86	const notesSample = rd(path.join(JB, 'notes-sample.json'));
    87	
    88	const visitDates = visits.map(v => pacDate(v.startAt)).sort();
    89	const WIN = { from: visitDates[0], to: visitDates[visitDates.length - 1] };
    90	
    91	// group visits by job
    92	const byJob = new Map();
    93	for (const v of visits) {
    94	  const d = pacDate(v.startAt);
    95	  const rec = {
    96	    date: d, dow: dowOf(d), isComplete: !!v.isComplete, status: v.visitStatus,
    97	    tech: (v.techs && v.techs[0]) || null,
    98	    visitId: v.id,
    99	  };
   100	  if (!byJob.has(v.jobNumber)) byJob.set(v.jobNumber, []);
   101	  byJob.get(v.jobNumber).push(rec);
   102	}
   103	for (const arr of byJob.values()) {
   104	  arr.sort((a, b) => a.date.localeCompare(b.date) || String(a.visitId).localeCompare(String(b.visitId)));
   105	}
   106	
   107	// ---------- per-job records ----------
   108	const recs = [];
   109	for (const job of jobs) {
   110	  const product = productOf(job);
   111	  const st = cf(job);
   112	  const vs = byJob.get(job.jobNumber) || [];
   113	  for (let i = 1; i < vs.length; i++) vs[i].intervalFromPrev = diffDays(vs[i - 1].date, vs[i].date);
   114	  const completed = vs.filter(v => v.isComplete);
   115	  const last = completed.length ? completed[completed.length - 1] : null;
   116	  const after = last ? vs.filter(v => v.date > last.date) : vs.slice();
   117	  const nextVisit = after.length ? after[0] : null;
   118	
   119	  // route-day: dominant (tech, dow) over completed visits, else over all visits
   120	  const tally = (list, keyf) => {
   121	    const m = new Map();
   122	    for (const v of list) { const k = keyf(v); if (!k) continue; m.set(k, (m.get(k) || 0) + 1); }
   123	    let best = null, bn = 0;
   124	    for (const [k, n] of m) if (n > bn) { best = k; bn = n; }
   125	    return best ? { key: best, n: bn } : null;
   126	  };
   127	  const src = completed.length ? completed : vs;
   128	  const tTech = tally(src, v => v.tech);
   129	  const tDow = tally(src, v => v.dow);
   130	  const routeDay = (tTech && tDow) ? {
   131	    tech: tTech.key, dow: tDow.key,
   132	    basis: completed.length ? 'completed visits' : 'scheduled visits',
   133	    techShare: +(tTech.n / src.length).toFixed(2),
   134	    dowShare: +(tDow.n / src.length).toFixed(2),
   135	  } : null;
   136	
   137	  const intervalsCompleted = completed.map(v => v.intervalFromPrev).filter(n => typeof n === 'number');
   138	  const ownMedian = intervalsCompleted.length ? q(intervalsCompleted, 0.5) : null;
   139	
   140	  const daysSinceLast = last ? diffDays(last.date, AS_OF) : null;
   141	  const nextSched = vs.find(v => v.date > AS_OF) || null;
   142	  const naLimit = st.nextAction ? (NA_LIMIT[st.nextAction] ?? null) : null;
   143	  let naSatisfied = null, naReason = null;
   144	  if (last && naLimit != null) {
   145	    const due = dayNum(last.date) + naLimit;
   146	    if (nextVisit && dayNum(nextVisit.date) <= due) { naSatisfied = true; naReason = 'next visit inside limit'; }
   147	    else if (!nextVisit) { naSatisfied = false; naReason = 'no visit scheduled after last completed'; }
   148	    else { naSatisfied = false; naReason = 'next visit ' + nextVisit.date + ' is ' + (dayNum(nextVisit.date) - due) + 'd past the ' + naLimit + 'd limit'; }
   149	  }
   150	  const hardOverdue = (last && naLimit != null)
   151	    ? (dayNum(AS_OF) > dayNum(last.date) + naLimit && (!nextVisit || nextVisit.date > AS_OF))
   152	    : null;
   153	
   154	  const activeJob = job.jobStatus !== 'archived' && (!!nextSched || (daysSinceLast != null && daysSinceLast <= 45));
   155	
   156	  recs.push({
   157	    jobNumber: job.jobNumber, product, jobStatus: job.jobStatus, client: job.client ? job.client.name : null,
   158	    zip: job.property ? job.property.postalCode : null, city: job.property ? job.property.city : null,
   159	    lat: job.property ? job.property.lat : null, lng: job.property ? job.property.lng : null,
   160	    recurrence: job.visitSchedule ? job.visitSchedule.recurrence : null,
   161	    jobStartAt: job.startAt ? pacDate(job.startAt) : null,
   162	    pastCountAllTime: job.visitsInfo ? job.visitsInfo.pastCount : null,
   163	    routeDay, active: activeJob,
   164	    latestState: st, trigger: triggerOf(st),
   165	    stateAppliesTo: last ? last.date : null,
   166	    visits: vs.map(v => ({ date: v.date, dow: v.dow, isComplete: v.isComplete, tech: v.tech, intervalFromPrev: v.intervalFromPrev ?? null })),
   167	    nVisitsInWindow: vs.length, nCompletedInWindow: completed.length,
   168	    intervalsCompleted, ownMedianInterval: ownMedian,
   169	    lastCompleted: last ? last.date : null,
   170	    intervalAfterLastCompleted: (last && nextVisit) ? diffDays(last.date, nextVisit.date) : null,
   171	    intervalAfterIsScheduled: (last && nextVisit) ? !nextVisit.isComplete : null,
   172	    nextVisit: nextVisit ? nextVisit.date : null,
   173	    nextScheduled: nextSched ? nextSched.date : null,
   174	    daysSinceLastCompleted: daysSinceLast,
   175	    nextActionLimitDays: naLimit, nextActionSatisfied: naSatisfied, nextActionReason: naReason,
   176	    hardOverdue,
   177	  });
   178	}
   179	
   180	// ---------- A. measured interval distributions by trigger (job-level latest state) ----------
   181	const byTrigger = {};
   182	for (const r of recs) {
   183	  const iv = r.intervalAfterLastCompleted;
   184	  if (iv == null || iv <= 0 || iv > 120) continue;
   185	  const k = r.trigger;
   186	  if (!byTrigger[k]) byTrigger[k] = { all: [], TMCP: [], 'Quick Fix': [], scheduledOnly: [], completedOnly: [] };
   187	  byTrigger[k].all.push(iv);
   188	  if (byTrigger[k][r.product]) byTrigger[k][r.product].push(iv);
   189	  (r.intervalAfterIsScheduled ? byTrigger[k].scheduledOnly : byTrigger[k].completedOnly).push(iv);
   190	}
   191	const intervalTable = {};
   192	for (const [k, v] of Object.entries(byTrigger)) {
   193	  intervalTable[k] = {
   194	    all: dist(v.all), TMCP: dist(v.TMCP), quickFix: dist(v['Quick Fix']),
   195	    scheduledForward: dist(v.scheduledOnly), alreadyCompleted: dist(v.completedOnly),
   196	  };
   197	}
   198	// STRUCTURAL: the job-level state describes the LAST completed visit, so the next visit after it
   199	// is by construction never yet completed. Everything in intervalTable is therefore a BOOKED
   200	// promise, not a delivered interval. Delivered cadence must come from completedIntervals /
   201	// notesCrossCheck below. Assert it so the claim stays true if the snapshot changes.
   202	const bookedOnly = Object.values(intervalTable).every(v => v.alreadyCompleted.n === 0);
   203	
   204	// ---------- B. notes-sample cross-check: per-VISIT state -> interval to next visit ----------
   205	function parseNoteLite(msg) {
   206	  const t = ' ' + String(msg).replace(/\s+/g, ' ').trim() + ' ';
   207	  const low = t.toLowerCase();
   208	  let moles = null;
   209	  if (/\bno mole/i.test(t)) moles = 0;
   210	  else { const m = t.match(/(\d+)\s*moles?\b/i) || t.match(/(\d+)\s*caught\b/i); if (m) moles = +m[1]; }
   211	  let misses = null;
   212	  if (/\bno miss/i.test(t)) misses = 0;
   213	  else { const m = t.match(/(\d+)\s*miss(?:ed)?\s*(u|t)?\b/i) || t.match(/miss(?:ed|sd|sed)\s*(\d+)/i); if (m) misses = +m[1]; }
   214	  const am = low.match(/\b([nlmh])\/?a\b/);
   215	  const activity = am ? { n: 'None', l: 'Low', m: 'Moderate', h: 'High' }[am[1]] : null;
   216	  let nextAction = null, naWeeks = null;
   217	  const aw = t.match(/\ba?d{1,2}\s+visit\s*(\d+)\s*week/i);
   218	  if (/convert to annual/i.test(t)) nextAction = 'Convert to annual';
   219	  else if (aw) { nextAction = 'Add visit ' + aw[1] + ' week'; naWeeks = +aw[1]; }
   220	  else if (/\bad{1,2}\s+visit/i.test(t)) nextAction = 'Add visit';
   221	  else if (/monthly/i.test(t)) nextAction = 'Monthly';
   222	  else if (/visit\s*2\s*weeks|2\s*weeks/i.test(t)) nextAction = '2 weeks';
   223	  else if (/weekly/i.test(t)) nextAction = 'Weekly';
   224	  return { moles, misses, activity, nextAction, naWeeks };
   225	}
   226	
   227	const noteRows = [];
   228	for (const j of notesSample) {
   229	  const vs = byJob.get(j.jobNumber) || [];
   230	  const ns = [...(j.notes || [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
   231	  for (let i = 0; i < ns.length; i++) {
   232	    const d = pacDate(ns[i].createdAt);
   233	    const p = parseNoteLite(ns[i].message);
   234	    let nextD = null, kind = null;
   235	    if (i + 1 < ns.length) { nextD = pacDate(ns[i + 1].createdAt); kind = 'next note'; }
   236	    const nv = vs.find(v => v.date > d);
   237	    if (nv && (!nextD || nv.date < nextD)) { nextD = nv.date; kind = nv.isComplete ? 'next completed visit' : 'next scheduled visit'; }
   238	    if (!nextD) continue;
   239	    const iv = diffDays(d, nextD);
   240	    if (iv <= 0 || iv > 120) continue;
   241	    noteRows.push({ jobNumber: j.jobNumber, product: j.product, date: d, interval: iv, kind, trigger: triggerOf(p), ...p });
   242	  }
   243	}
   244	// a note row is DELIVERED when the thing that followed it actually happened
   245	const DELIVERED = r => r.kind === 'next note' || r.kind === 'next completed visit';
   246	const noteByTrigger = {};
   247	const noteByTriggerDelivered = {};
   248	for (const r of noteRows) {
   249	  (noteByTrigger[r.trigger] = noteByTrigger[r.trigger] || []).push(r.interval);
   250	  if (DELIVERED(r)) (noteByTriggerDelivered[r.trigger] = noteByTriggerDelivered[r.trigger] || []).push(r.interval);
   251	}
   252	const noteIntervalTable = Object.fromEntries(Object.entries(noteByTrigger).map(([k, v]) => [k, dist(v)]));
   253	const noteDeliveredTable = Object.fromEntries(Object.entries(noteByTriggerDelivered).map(([k, v]) => [k, dist(v)]));
   254	const noteKindCounts = noteRows.reduce((m, r) => (m[r.kind] = (m[r.kind] || 0) + 1, m), {});
   255	const noteByNextAction = {};
   256	for (const r of noteRows) if (r.nextAction) (noteByNextAction[r.nextAction] = noteByNextAction[r.nextAction] || []).push(r.interval);
   257	const noteNextActionTable = Object.fromEntries(Object.entries(noteByNextAction).map(([k, v]) => [k, dist(v)]));
   258	const noteNextActionCounts = Object.fromEntries(Object.entries(noteByNextAction).map(([k, v]) => [k, v.length]));
   259	
   260	// ---------- C. Quick Fix series reality ----------
   261	const qf = recs.filter(r => r.product === 'Quick Fix');
   262	const qfClean = qf.filter(r => r.jobStartAt && r.jobStartAt >= WIN.from);
   263	const qfSeries = c => {
   264	  const lens = c.map(r => r.nVisitsInWindow);
   265	  const spacing = c.flatMap(r => r.visits.map(v => v.intervalFromPrev).filter(n => typeof n === 'number' && n > 0 && n <= 60));
   266	  return {
   267	    jobs: c.length,
   268	    visitsPerJob: dist(lens),
   269	    spacingDays: dist(spacing),
   270	    ranPastFiveScheduled: c.filter(r => r.nVisitsInWindow > 5).length,
   271	    ranPastFiveCompleted: c.filter(r => r.nCompletedInWindow > 5).length,
   272	    completedFiveOrMore: c.filter(r => r.nCompletedInWindow >= 5).length,
   273	    stillHaveFutureVisit: c.filter(r => r.nextScheduled).length,
   274	    archived: c.filter(r => r.jobStatus === 'archived').length,
   275	    shareSpacingWeeklyPct: spacing.length ? +(spacing.filter(d => d <= 10).length / spacing.length * 100).toFixed(1) : null,
   276	    withAnyCompleted: c.filter(r => r.nCompletedInWindow > 0).length,
   277	  };
   278	};
   279	
   280	// ---------- D. TMCP quiet interval + weekday hold ----------
   281	const tmcp = recs.filter(r => r.product === 'TMCP');
   282	const quiet = tmcp.filter(r => r.trigger.indexOf('quiet') === 0 && r.intervalAfterLastCompleted != null);
   283	const quietIv = quiet.map(r => r.intervalAfterLastCompleted).filter(n => n > 0 && n <= 120);
   284	let dowHoldNum = 0, dowHoldDen = 0, techHoldNum = 0, techHoldDen = 0;
   285	const perJobDowHold = [];
   286	for (const r of tmcp) {
   287	  if (!r.routeDay || r.nVisitsInWindow < 2) continue;
   288	  const same = r.visits.filter(v => v.dow === r.routeDay.dow).length;
   289	  dowHoldNum += same; dowHoldDen += r.nVisitsInWindow;
   290	  perJobDowHold.push(Math.round(same / r.nVisitsInWindow * 100));
   291	  const stc = r.visits.filter(v => v.tech === r.routeDay.tech).length;
   292	  techHoldNum += stc; techHoldDen += r.nVisitsInWindow;
   293	}
   294	const tmcpAllIv = tmcp.flatMap(r => r.intervalsCompleted).filter(n => n > 0 && n <= 120);
   295	
   296	// ---------- E. overdue view as of AS_OF ----------
   297	const activeRecs = recs.filter(r => r.active);
   298	const overdueRows = activeRecs.filter(r => r.nextActionSatisfied === false);
   299	const hardRows = activeRecs.filter(r => r.hardOverdue === true);
   300	const groupCount = (rows, keyf) => {
   301	  const m = {};
   302	  for (const r of rows) { const k = keyf(r) == null ? 'unassigned' : keyf(r); m[k] = (m[k] || 0) + 1; }
   303	  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
   304	};
   305	const rdKey = r => (r.routeDay ? r.routeDay.tech + ' / ' + r.routeDay.dow : null);
   306	
   307	const overdue = {
   308	  asOf: AS_OF,
   309	  definition: {
   310	    active: 'jobStatus != archived AND (a future visit exists OR last completed visit within 45 days)',
   311	    unsatisfied: "the job's own Next Action field is not met by the schedule: no visit after the last completed one, or the next visit falls past the field limit (Add visit 10d, 2 weeks 17d, Monthly 33d = target + 3d grace)",
   312	    hardOverdue: 'the limit date has already passed and no visit happened or is booked before today',
   313	  },
   314	  activeJobs: activeRecs.length,
   315	  unsatisfied: overdueRows.length,
   316	  hardOverdue: hardRows.length,
   317	  noFutureVisitAtAll: activeRecs.filter(r => !r.nextScheduled).length,
   318	  unsatisfiedByProduct: groupCount(overdueRows, r => r.product),
   319	  unsatisfiedByNextAction: groupCount(overdueRows, r => r.latestState.nextAction),
   320	  unsatisfiedByTrigger: groupCount(overdueRows, r => r.trigger),
   321	  unsatisfiedByRouteDay: groupCount(overdueRows, rdKey),
   322	  hardOverdueByProduct: groupCount(hardRows, r => r.product),
   323	  hardOverdueByTrigger: groupCount(hardRows, r => r.trigger),
   324	  hardOverdueByRouteDay: groupCount(hardRows, rdKey),
   325	  activeByProduct: groupCount(activeRecs, r => r.product),
   326	  activeByRouteDay: groupCount(activeRecs, rdKey),
   327	  daysSinceLastCompleted: {
   328	    allActive: dist(activeRecs.map(r => r.daysSinceLastCompleted).filter(n => n != null)),
   329	    unsatisfied: dist(overdueRows.map(r => r.daysSinceLastCompleted).filter(n => n != null)),
   330	    hardOverdue: dist(hardRows.map(r => r.daysSinceLastCompleted).filter(n => n != null)),
   331	  },
   332	  worst20: [...hardRows].sort((a, b) => (b.daysSinceLastCompleted || 0) - (a.daysSinceLastCompleted || 0)).slice(0, 20)
   333	    .map(r => ({
   334	      job: r.jobNumber, client: r.client, product: r.product, trigger: r.trigger,
   335	      nextAction: r.latestState.nextAction, lastCompleted: r.lastCompleted,
   336	      daysSince: r.daysSinceLastCompleted, nextVisit: r.nextVisit, routeDay: rdKey(r),
   337	    })),
   338	};
   339	
   340	// ---------- F. seasonality ----------
   341	// TRUNCATION: a visit's gap to its prior visit is only observable if that prior visit is inside
   342	// the window. For a <=10d test the lookback must reach WIN.from, so any week starting sooner than
   343	// WIN.from + 10d is biased upward and is flagged rather than reported as fact.
   344	const WEEKS = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14'];
   345	const tmcpActiveDenom = tmcp.filter(r => r.visits.some(v => v.isComplete && v.date >= '2026-08-17' && v.date <= '2026-09-17')).length;
   346	const seasonality = WEEKS.map(wstart => {
   347	  const wend = addDays(wstart, 6);
   348	  let weekly = 0, total = 0, visitsThisWeek = 0;
   349	  const ivs = [];
   350	  const daysSeen = new Set();
   351	  for (const r of tmcp) {
   352	    for (const v of r.visits) {
   353	      if (!v.isComplete) continue;
   354	      if (v.date < wstart || v.date > wend) continue;
   355	      visitsThisWeek++; daysSeen.add(v.date);
   356	      if (typeof v.intervalFromPrev !== 'number' || v.intervalFromPrev <= 0 || v.intervalFromPrev > 120) continue;
   357	      total++; ivs.push(v.intervalFromPrev);
   358	      if (v.intervalFromPrev <= 10) weekly++;
   359	    }
   360	  }
   361	  const lookbackObservable = dayNum(wstart) - 10 >= dayNum(WIN.from);
   362	  const partialWeek = wend > '2026-09-17';
   363	  const rate = tmcpActiveDenom ? visitsThisWeek / tmcpActiveDenom : null;
   364	  return {
   365	    weekStart: wstart, weekEnd: wend,
   366	    tmcpCompletedVisits: visitsThisWeek,
   367	    tmcpVisitsWithPriorVisit: total,
   368	    onWeeklyCadence: weekly,
   369	    shareWeeklyPct: total ? +(weekly / total * 100).toFixed(1) : null,
   370	    medianIntervalDays: q(ivs, 0.5),
   371	    lookbackObservable,
   372	    partialWeek,
   373	    // truncation-free alternative: visits delivered per active TMCP job that week
   374	    visitsPerActiveTmcpJob: rate == null ? null : +rate.toFixed(3),
   375	    impliedCadenceDays: rate ? +(7 / rate).toFixed(1) : null,
   376	    // the last week is cut off mid-week and one week holds Labor Day, so normalize by field day
   377	    fieldDaysObserved: daysSeen.size,
   378	    fieldDays: [...daysSeen].sort(),
   379	    tmcpVisitsPerFieldDay: daysSeen.size ? +(visitsThisWeek / daysSeen.size).toFixed(1) : null,
   380	    ratePerFieldDayNormalized: (rate != null && daysSeen.size)
   381	      ? +((visitsThisWeek / daysSeen.size * 5) / tmcpActiveDenom).toFixed(3) : null,
   382	    caveat: !lookbackObservable
   383	      ? 'BIASED: the <=10d lookback falls outside the visit window, so shareWeeklyPct is inflated toward 100 by construction. Use visitsPerActiveTmcpJob for this week.'
   384	      : (partialWeek ? 'PARTIAL: week extends past the last completed visit date, so counts are low.' : null),
   385	  };
   386	});
   387	
   388	// ---------- assemble ----------
   389	const out = {
   390	  generatedAt: new Date().toISOString(),
   391	  asOf: AS_OF,
   392	  visitWindow: WIN,
   393	  source: {
   394	    jobs: jobs.length, visits: visits.length, notesSampleJobs: notesSample.length,
   395	    notesSampleNotes: notesSample.reduce((a, j) => a + (j.notes || []).length, 0),
   396	  },
   397	  limitations: [
   398	    'Job custom fields (Latest Activity / Moles Caught / Misses / Next Action) are JOB-level, not visit-level. They describe only the LAST completed visit. Every trigger-attributed interval below is therefore one row per job, measured forward from that job last completed visit.',
   399	    'The forward interval for most jobs is a SCHEDULED date, not a delivered one. Scheduled-vs-completed splits are reported separately in intervalTable.*.scheduledForward / .alreadyCompleted.',
   400	    'Visits are only available for ' + WIN.from + '..' + WIN.to + '. Intervals that straddle the start of that window are not observable, so the first visit in the window has no intervalFromPrev.',
   401	    'The notes sample (40 jobs, 192 notes) carries true PER-VISIT state and is used as an independent cross-check of the job-level numbers. It is a small, product-stratified sample, not a random one.',
   402	    'Weekday/tech hold is measured inside the window only; a tech handover inside the window reads as a hold failure.',
   403	  ],
   404	  productCounts: recs.reduce((m, r) => (m[r.product] = (m[r.product] || 0) + 1, m), {}),
   405	  triggerCounts: recs.reduce((m, r) => (m[r.trigger] = (m[r.trigger] || 0) + 1, m), {}),
   406	  triggerCountsActive: activeRecs.reduce((m, r) => (m[r.trigger] = (m[r.trigger] || 0) + 1, m), {}),
   407	  intervalTable,
   408	  intervalTableIsBookedNotDelivered: bookedOnly,
   409	  deliveredIntervals: {
   410	    note: 'consecutive COMPLETED-visit gaps inside the window, unattributed to a trigger (the job-level fields cannot reach back this far). This is what the field actually delivered.',
   411	    TMCP: dist(tmcpAllIv),
   412	    quickFix: dist(recs.filter(r => r.product === 'Quick Fix').flatMap(r => r.intervalsCompleted).filter(n => n > 0 && n <= 120)),
   413	    allProducts: dist(recs.flatMap(r => r.intervalsCompleted).filter(n => n > 0 && n <= 120)),
   414	  },
   415	  notesCrossCheck: {
   416	    rows: noteRows.length, kindCounts: noteKindCounts,
   417	    byTrigger: noteIntervalTable, byTriggerDelivered: noteDeliveredTable,
   418	    byNextAction: noteNextActionTable, nextActionCounts: noteNextActionCounts,
   419	  },
   420	  quickFix: {
   421	    allJobs: qfSeries(qf),
   422	    cleanCohortStartedInWindow: qfSeries(qfClean),
   423	    note: 'cleanCohort = Quick Fix jobs whose job startAt falls inside the visit window, so the whole series is observable.',
   424	  },
   425	  tmcpQuiet: {
   426	    quietJobs: quiet.length,
   427	    forwardInterval: dist(quietIv),
   428	    allTmcpCompletedIntervals: dist(tmcpAllIv),
   429	    weekdayHoldPct: dowHoldDen ? +(dowHoldNum / dowHoldDen * 100).toFixed(1) : null,
   430	    techHoldPct: techHoldDen ? +(techHoldNum / techHoldDen * 100).toFixed(1) : null,
   431	    jobsMeasuredForHold: perJobDowHold.length,
   432	    jobsWith100PctDowHold: perJobDowHold.filter(p => p === 100).length,
   433	  },
   434	  seasonality,
   435	  overdue,
   436	  jobs: recs,
   437	};
   438	
   439	fs.mkdirSync(DATA, { recursive: true });
   440	fs.writeFileSync(path.join(DATA, 'cadence-asbuilt.json'), JSON.stringify(out, null, 1));
   441	
   442	// ---------- console report ----------
   443	const L = [];
   444	L.push('window ' + WIN.from + '..' + WIN.to + '  jobs ' + jobs.length + '  visits ' + visits.length + '  asOf ' + AS_OF);
   445	L.push('');
   446	L.push('DELIVERED cadence (consecutive completed-visit gaps, unattributed)');
   447	L.push('  TMCP       ' + JSON.stringify(out.deliveredIntervals.TMCP));
   448	L.push('  Quick Fix  ' + JSON.stringify(out.deliveredIntervals.quickFix));
   449	L.push('  all        ' + JSON.stringify(out.deliveredIntervals.allProducts));
   450	L.push('');
   451	L.push('BOOKED-NEXT interval after last completed visit, BY TRIGGER (1 row/job).');
   452	L.push('  NOTE: every row here is a SCHEDULED date, never a delivered one (bookedOnly=' + bookedOnly + ').');
   453	L.push('trigger'.padEnd(36) + 'n'.padStart(5) + 'med'.padStart(7) + 'p25'.padStart(7) + 'p75'.padStart(7) + '  %<=10d');
   454	for (const [k, v] of Object.entries(intervalTable).sort((a, b) => b[1].all.n - a[1].all.n)) {
   455	  L.push(k.padEnd(36) + String(v.all.n).padStart(5) + String(v.all.median).padStart(7) + String(v.all.p25).padStart(7) + String(v.all.p75).padStart(7) + String(v.all.shareWeekly).padStart(8));
   456	}
   457	L.push('');
   458	L.push('  TMCP only:');
   459	for (const [k, v] of Object.entries(intervalTable).sort((a, b) => b[1].TMCP.n - a[1].TMCP.n)) {
   460	  L.push('  ' + k.padEnd(34) + String(v.TMCP.n).padStart(5) + String(v.TMCP.median).padStart(7) + String(v.TMCP.p25).padStart(7) + String(v.TMCP.p75).padStart(7) + String(v.TMCP.shareWeekly).padStart(8));
   461	}
   462	L.push('');
   463	L.push('NOTES CROSS-CHECK (true per-visit state, 40-job sample)  rows=' + noteRows.length + '  ' + JSON.stringify(noteKindCounts));
   464	L.push('  -- all rows --');
   465	for (const [k, v] of Object.entries(noteIntervalTable).sort((a, b) => b[1].n - a[1].n)) {
   466	  L.push('  ' + k.padEnd(34) + String(v.n).padStart(5) + String(v.median).padStart(7) + '  %<=10d ' + v.shareWeekly);
   467	}
   468	L.push('  -- DELIVERED rows only (the follow-up actually happened) --');
   469	for (const [k, v] of Object.entries(noteDeliveredTable).sort((a, b) => b[1].n - a[1].n)) {
   470	  L.push('  ' + k.padEnd(34) + String(v.n).padStart(5) + String(v.median).padStart(7) + '  p25 ' + v.p25 + ' p75 ' + v.p75 + '  %<=10d ' + v.shareWeekly);
   471	}
   472	L.push('  -- by Next Action written on the note --');
   473	for (const [k, v] of Object.entries(noteNextActionTable).sort((a, b) => b[1].n - a[1].n)) {
   474	  L.push('  ' + k.padEnd(34) + String(v.n).padStart(5) + String(v.median).padStart(7) + '  %<=10d ' + v.shareWeekly);
   475	}
   476	L.push('');
   477	L.push('QUICK FIX all       ' + JSON.stringify(out.quickFix.allJobs));
   478	L.push('QUICK FIX clean     ' + JSON.stringify(out.quickFix.cleanCohortStartedInWindow));
   479	L.push('');
   480	L.push('TMCP QUIET ' + JSON.stringify(out.tmcpQuiet));
   481	L.push('');
   482	L.push('SEASONALITY (TMCP; denominator for the rate column = ' + tmcpActiveDenom + ' TMCP jobs with a completed visit 08-17..09-17)');
   483	for (const s of seasonality) {
   484	  L.push('  ' + s.weekStart + '  visits=' + String(s.tmcpCompletedVisits).padStart(4)
   485	    + '  weekly ' + String(s.shareWeeklyPct).padStart(5) + '%  median ' + String(s.medianIntervalDays).padStart(4) + 'd'
   486	    + '  visits/job ' + String(s.visitsPerActiveTmcpJob).padStart(5) + '  implied ' + String(s.impliedCadenceDays).padStart(5) + 'd'
   487	    + '  fieldDays ' + s.fieldDaysObserved + '  v/fieldDay ' + String(s.tmcpVisitsPerFieldDay).padStart(6)
   488	    + '  rate@5d ' + String(s.ratePerFieldDayNormalized).padStart(5)
   489	    + (s.caveat ? '  <<' + s.caveat.split(':')[0] : ''));
   490	}
   491	L.push('');
   492	L.push('OVERDUE as of ' + AS_OF);
   493	L.push('  active jobs ' + overdue.activeJobs + '  unsatisfied ' + overdue.unsatisfied + '  hard overdue ' + overdue.hardOverdue + '  no future visit ' + overdue.noFutureVisitAtAll);
   494	L.push('  unsatisfied by product    ' + JSON.stringify(overdue.unsatisfiedByProduct));
   495	L.push('  unsatisfied by NextAction ' + JSON.stringify(overdue.unsatisfiedByNextAction));
   496	L.push('  unsatisfied by trigger    ' + JSON.stringify(overdue.unsatisfiedByTrigger));
   497	L.push('  hard overdue by product   ' + JSON.stringify(overdue.hardOverdueByProduct));
   498	L.push('  unsatisfied by route-day:');
   499	for (const [k, n] of Object.entries(overdue.unsatisfiedByRouteDay)) L.push('    ' + k.padEnd(28) + n);
   500	L.push('  hard overdue by route-day:');
   501	for (const [k, n] of Object.entries(overdue.hardOverdueByRouteDay)) L.push('    ' + k.padEnd(28) + n);
   502	L.push('  worst 10: ' + overdue.worst20.slice(0, 10).map(w => '#' + w.job + ' ' + w.daysSince + 'd ' + w.trigger).join(' | '));
   503	console.log(L.join('\n'));
```

## [16] scripts/demand-model.mjs

```
     1	// demand-model.mjs - S3b. Weekly visit demand and capacity per route-day under four cadence policies.
     2	// Input:  redesign/data/cadence-asbuilt.json (from derive-cadence.mjs)
     3	//         data/route-day-drive_2026-08-17_2026-09-17.json (measured cycle time per route-day)
     4	//         redesign/data/master-asbuilt.json (route-day assignment, IF it exists)
     5	// Output: redesign/data/demand-model.json
     6	import fs from 'node:fs';
     7	import path from 'node:path';
     8	import { fileURLToPath } from 'node:url';
     9	
    10	const HERE = path.dirname(fileURLToPath(import.meta.url));
    11	const REDESIGN = path.resolve(HERE, '..');
    12	const ROOT = path.resolve(REDESIGN, '..');
    13	const DATA = path.join(REDESIGN, 'data');
    14	const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));
    15	
    16	const cad = rd(path.join(DATA, 'cadence-asbuilt.json'));
    17	const drive = rd(path.join(ROOT, 'data', 'route-day-drive_2026-08-17_2026-09-17.json'));
    18	
    19	// optional: a master route-day assignment from a sibling stage
    20	const MASTER = path.join(DATA, 'master-asbuilt.json');
    21	let master = null;
    22	if (fs.existsSync(MASTER)) {
    23	  try { master = rd(MASTER); } catch (e) { master = null; }
    24	}
    25	
    26	const DOWS = ['mon', 'tue', 'wed', 'thu', 'fri'];
    27	const med = arr => {
    28	  if (!arr.length) return null;
    29	  const s = [...arr].sort((a, b) => a - b);
    30	  const i = (s.length - 1) / 2;
    31	  return (s[Math.floor(i)] + s[Math.ceil(i)]) / 2;
    32	};
    33	
    34	// ---------- cycle time per route-day (minutes per stop, drive included) ----------
    35	const cycle = new Map();      // "tech|dow" -> {min, source}
    36	const byTechCycles = new Map();
    37	for (const r of drive.summary || []) {
    38	  if (!r.medianSpanH || !r.medianStops) continue;
    39	  const m = r.medianSpanH * 60 / r.medianStops;
    40	  cycle.set(r.tech + '|' + r.dow, { min: +m.toFixed(2), source: 'route-day measured', weeks: r.weeks, medianStops: r.medianStops, medianSpanH: r.medianSpanH });
    41	  if (!byTechCycles.has(r.tech)) byTechCycles.set(r.tech, []);
    42	  byTechCycles.get(r.tech).push(m);
    43	}
    44	const techCycle = new Map();
    45	for (const [t, arr] of byTechCycles) techCycle.set(t, +med(arr).toFixed(2));
    46	const globalCycle = +med([...cycle.values()].map(c => c.min)).toFixed(2);
    47	const cycleFor = (tech, dow) => {
    48	  const exact = cycle.get(tech + '|' + dow);
    49	  if (exact) return { min: exact.min, source: 'route-day measured' };
    50	  if (techCycle.has(tech)) return { min: techCycle.get(tech), source: 'tech median (no measured row for this weekday)' };
    51	  return { min: globalCycle, source: 'global median (tech not in drive summary)' };
    52	};
    53	
    54	// ---------- route-day assignment per job ----------
    55	// Preference: master-asbuilt.json -> dominant tech/dow from cadence -> nearest neighbor.
    56	const masterByJob = new Map();
    57	if (master) {
    58	  const rows = Array.isArray(master) ? master : (master.jobs || master.rows || []);
    59	  for (const r of rows) {
    60	    const jn = r.jobNumber ?? r.job ?? r.jobNo;
    61	    let tech = null, dow = null;
    62	    // master-asbuilt stores routeDay as the string "Tech Name|dow"
    63	    if (typeof r.routeDay === 'string' && r.routeDay.includes('|')) {
    64	      const parts = r.routeDay.split('|');
    65	      tech = parts[0]; dow = parts[1];
    66	    } else if (r.routeDay && typeof r.routeDay === 'object') {
    67	      tech = r.routeDay.tech; dow = r.routeDay.dow;
    68	    }
    69	    tech = tech || r.tech || r.dominantTech;
    70	    dow = dow || r.dow || r.dominantWeekday;
    71	    if (jn != null && tech && dow) masterByJob.set(Number(jn), { tech, dow, inferred: !!r.inferred, stability: r.stability || null });
    72	  }
    73	}
    74	
    75	const active = cad.jobs.filter(j => j.active);
    76	const assignedPool = [];   // for nearest-neighbor fallback
    77	const assign = new Map();
    78	for (const j of active) {
    79	  let a = null, src = null;
    80	  if (masterByJob.has(j.jobNumber)) { a = masterByJob.get(j.jobNumber); src = 'master-asbuilt.json'; }
    81	  else if (j.routeDay) { a = { tech: j.routeDay.tech, dow: j.routeDay.dow }; src = 'dominant ' + j.routeDay.basis; }
    82	  if (a) { assign.set(j.jobNumber, { ...a, src }); if (j.lat != null && j.lng != null) assignedPool.push({ lat: j.lat, lng: j.lng, ...a }); }
    83	}
    84	const hav = (a, b) => {
    85	  const R = 6371, t = Math.PI / 180;
    86	  const dLat = (b.lat - a.lat) * t, dLng = (b.lng - a.lng) * t;
    87	  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLng / 2) ** 2;
    88	  return 2 * R * Math.asin(Math.sqrt(s));
    89	};
    90	let nnUsed = 0, unassignable = 0;
    91	for (const j of active) {
    92	  if (assign.has(j.jobNumber)) continue;
    93	  if (j.lat == null || j.lng == null || !assignedPool.length) { unassignable++; continue; }
    94	  let best = null, bd = Infinity;
    95	  for (const p of assignedPool) { const d = hav(j, p); if (d < bd) { bd = d; best = p; } }
    96	  assign.set(j.jobNumber, { tech: best.tech, dow: best.dow, src: 'nearest neighbor (' + bd.toFixed(1) + ' km)' });
    97	  nnUsed++;
    98	}
    99	
   100	// ---------- policy intervals (days between visits) ----------
   101	// P0 as-run: the job's OWN measured median completed-visit gap; fall back to the delivered
   102	//            median for its product+trigger, then to the product median.
   103	const deliveredTmcp = cad.deliveredIntervals.TMCP.median;
   104	const deliveredQf = cad.deliveredIntervals.quickFix.median;
   105	const productMedian = p => (p === 'Quick Fix' ? deliveredQf : deliveredTmcp);
   106	// trigger-level delivered medians come from the notes cross-check (the only per-visit evidence)
   107	const triggerDelivered = {};
   108	for (const [k, v] of Object.entries(cad.notesCrossCheck.byTriggerDelivered || {})) triggerDelivered[k] = v.median;
   109	
   110	const isActivity = t => t.startsWith('activity');
   111	const QF = 'Quick Fix';
   112	
   113	// A job only HAS an own measured gap if it was visited twice inside a 5-week window, which by
   114	// construction selects the fast-cadence jobs. Using a short trigger median for the rest inflates
   115	// demand badly (it over-shot the observed baseline by 27%). The honest fallback for a job with a
   116	// single completed visit is the gap the office itself booked next, which is the only cadence
   117	// evidence that exists for it.
   118	function intervalP0(j) {
   119	  if (j.ownMedianInterval && j.ownMedianInterval > 0) return { d: j.ownMedianInterval, basis: 'own measured gap median' };
   120	  const booked = j.intervalAfterLastCompleted;
   121	  if (booked && booked > 0 && booked <= 60) return { d: booked, basis: 'own next booked gap (only one completed visit)' };
   122	  return { d: productMedian(j.product), basis: 'product delivered median (no gap evidence)' };
   123	}
   124	function intervalP1(j) {
   125	  const caught = (j.latestState.moles || 0) > 0;
   126	  return { d: caught ? 7 : 30, basis: caught ? 'catch' : 'no catch' };
   127	}
   128	function intervalP2(j) {
   129	  const s = j.latestState;
   130	  const hot = (s.moles || 0) > 0 || (s.misses || 0) > 0 || (s.activity && s.activity !== 'None');
   131	  return { d: hot ? 7 : 30, basis: hot ? 'catch/miss/activity' : 'quiet' };
   132	}
   133	const NA_DAYS = { 'Add visit': 7, Weekly: 7, '2 weeks': 14, Monthly: 30 };
   134	function intervalP3(j) {
   135	  const na = j.latestState.nextAction;
   136	  if (na && NA_DAYS[na]) return { d: NA_DAYS[na], basis: 'Next Action = ' + na };
   137	  return { d: 30, basis: 'Next Action blank -> treated as Monthly' };
   138	}
   139	const POLICIES = {
   140	  P0: { label: 'as the office actually runs it (measured intervals)', fn: intervalP0 },
   141	  P1: { label: 'weekly after a catch, monthly otherwise', fn: intervalP1 },
   142	  P2: { label: 'weekly after catch OR miss OR any activity, monthly otherwise', fn: intervalP2 },
   143	  P3: { label: "the office's own Next Action field taken literally", fn: intervalP3 },
   144	};
   145	
   146	// Quick Fix is a product definition (a 5-week weekly series), not a cadence judgment, so the
   147	// headline run holds it at 7 days under every policy. The pure-policy numbers are kept alongside.
   148	const QF_OVERRIDE_DAYS = 7;
   149	
   150	function runPolicy(key, qfWeekly) {
   151	  const fn = POLICIES[key].fn;
   152	  const cells = new Map();
   153	  const basisCount = {};
   154	  let unplaced = 0;
   155	  for (const j of active) {
   156	    const a = assign.get(j.jobNumber);
   157	    if (!a) { unplaced++; continue; }
   158	    let { d, basis } = fn(j);
   159	    if (qfWeekly && j.product === QF) { d = QF_OVERRIDE_DAYS; basis = 'Quick Fix product cadence (weekly series)'; }
   160	    if (!d || d <= 0) { d = productMedian(j.product); basis = 'fallback'; }
   161	    basisCount[basis] = (basisCount[basis] || 0) + 1;
   162	    const k = a.tech + '|' + a.dow;
   163	    if (!cells.has(k)) cells.set(k, { tech: a.tech, dow: a.dow, jobs: 0, visitsPerWeek: 0, byProduct: {} });
   164	    const c = cells.get(k);
   165	    c.jobs++;
   166	    c.visitsPerWeek += 7 / d;
   167	    c.byProduct[j.product] = +((c.byProduct[j.product] || 0) + 7 / d).toFixed(3);
   168	  }
   169	  const rows = [];
   170	  for (const tech of [...new Set([...cycle.keys()].map(k => k.split('|')[0]))].sort()) {
   171	    for (const dow of DOWS) {
   172	      const c = cells.get(tech + '|' + dow) || { tech, dow, jobs: 0, visitsPerWeek: 0, byProduct: {} };
   173	      const cy = cycleFor(tech, dow);
   174	      const v = +c.visitsPerWeek.toFixed(2);
   175	      const hours = +(v * cy.min / 60).toFixed(2);
   176	      rows.push({
   177	        tech, dow, jobs: c.jobs, visitsPerWeek: v,
   178	        cycleMinPerStop: cy.min, cycleSource: cy.source,
   179	        hoursPerWeek: hours,
   180	        hoursOver8: +(hours - 8).toFixed(2),
   181	        hoursOver9: +(hours - 9).toFixed(2),
   182	        over8: hours > 8, over9: hours > 9,
   183	        byProduct: c.byProduct,
   184	      });
   185	    }
   186	  }
   187	  const totalV = +rows.reduce((a, r) => a + r.visitsPerWeek, 0).toFixed(1);
   188	  const totalH = +rows.reduce((a, r) => a + r.hoursPerWeek, 0).toFixed(1);
   189	  return {
   190	    policy: key, label: POLICIES[key].label, quickFixHeldWeekly: !!qfWeekly,
   191	    rows,
   192	    totals: {
   193	      visitsPerWeek: totalV, hoursPerWeek: totalH,
   194	      routeDays: rows.length, capacityHoursAt8: rows.length * 8, capacityHoursAt9: rows.length * 9,
   195	      hoursOverCapacityAt8: +(totalH - rows.length * 8).toFixed(1),
   196	      hoursOverCapacityAt9: +(totalH - rows.length * 9).toFixed(1),
   197	      routeDaysOver8: rows.filter(r => r.over8).length,
   198	      routeDaysOver9: rows.filter(r => r.over9).length,
   199	      utilizationAt8Pct: +(totalH / (rows.length * 8) * 100).toFixed(1),
   200	      techDaysNeededAt8: +(totalH / 8).toFixed(1),
   201	    },
   202	    intervalBasisCounts: basisCount,
   203	    jobsUnplaced: unplaced,
   204	  };
   205	}
   206	
   207	// ---------- observed baseline: what the route actually delivered ----------
   208	const observed = (drive.summary || []).map(r => {
   209	  const cy = r.medianSpanH * 60 / r.medianStops;
   210	  return {
   211	    tech: r.tech, dow: r.dow, medianStops: r.medianStops, medianSpanH: r.medianSpanH,
   212	    cycleMinPerStop: +cy.toFixed(2), weeksObserved: r.weeks,
   213	    hoursOver8: +(r.medianSpanH - 8).toFixed(2), hoursOver9: +(r.medianSpanH - 9).toFixed(2),
   214	  };
   215	});
   216	const observedTotals = {
   217	  stopsPerWeek: +observed.reduce((a, r) => a + r.medianStops, 0).toFixed(1),
   218	  hoursPerWeek: +observed.reduce((a, r) => a + r.medianSpanH, 0).toFixed(1),
   219	  routeDaysOver8: observed.filter(r => r.medianSpanH > 8).length,
   220	  routeDaysOver9: observed.filter(r => r.medianSpanH > 9).length,
   221	};
   222	
   223	// ---------- assemble ----------
   224	const policies = {};
   225	const policiesPure = {};
   226	for (const k of Object.keys(POLICIES)) {
   227	  policies[k] = runPolicy(k, true);
   228	  policiesPure[k] = runPolicy(k, false);
   229	}
   230	
   231	// ---------- calibration: does each policy reproduce what actually ran? ----------
   232	const calibration = Object.keys(POLICIES).map(k => {
   233	  const t = policies[k].totals;
   234	  return {
   235	    policy: k,
   236	    visitsPerWeek: t.visitsPerWeek,
   237	    observedStopsPerWeek: observedTotals.stopsPerWeek,
   238	    deltaVisitsPct: +((t.visitsPerWeek - observedTotals.stopsPerWeek) / observedTotals.stopsPerWeek * 100).toFixed(1),
   239	    hoursPerWeek: t.hoursPerWeek,
   240	    observedHoursPerWeek: observedTotals.hoursPerWeek,
   241	    deltaHoursPct: +((t.hoursPerWeek - observedTotals.hoursPerWeek) / observedTotals.hoursPerWeek * 100).toFixed(1),
   242	  };
   243	});
   244	
   245	const out = {
   246	  generatedAt: new Date().toISOString(),
   247	  asOf: cad.asOf,
   248	  calibration,
   249	  calibrationNote: 'The observed baseline is what the five techs actually delivered. A policy whose visits/week sits far above it is describing a service level the company has never run, not a forecast of the same work.',
   250	  basis: {
   251	    activeJobs: active.length,
   252	    routeDayAssignment: master ? 'master-asbuilt.json where present, else dominant tech/weekday from this job visits' : 'dominant tech/weekday from each job completed visits (scheduled visits when it has none)',
   253	    masterAsbuiltPresent: !!master,
   254	    masterRowsParsed: masterByJob.size,
   255	    assignmentSources: [...assign.values()].reduce((m, a) => (m[a.src] = (m[a.src] || 0) + 1, m), {}),
   256	    nearestNeighborUsed: nnUsed,
   257	    unassignable,
   258	    cycleTime: 'median span hours / median stops for that tech x weekday, from route-day-drive summary (drive time included). Fallback: that tech median across their days, then the global median.',
   259	    globalCycleMinPerStop: globalCycle,
   260	    quickFixNote: 'Headline policies hold Quick Fix at 7 days because the product IS a weekly 5-week series; policiesPure applies each policy to Quick Fix too, for comparison.',
   261	    capacityReference: '25 route-days x 8h = 200h per week.',
   262	  },
   263	  caveats: [
   264	    'Demand is a steady-state rate: each job contributes 7/interval visits per week. It does not model the Quick Fix series ending, new sales arriving, or churn.',
   265	    'Cycle time is a route-day median measured over 3-5 weeks at the stop counts actually run. Pushing a route-day well past its observed stop count will not scale linearly - drive per stop falls as density rises, so hours at much higher volume are over-estimated, and at much lower volume under-estimated.',
   266	    'P0 uses each job own measured gap, which is itself the product of a schedule the office has been manually patching. It reproduces current behavior, including its defects.',
   267	    'Trigger state is job-level and describes only the last completed visit, so P1/P2/P3 classify each job by one observation, not by a steady-state probability of catching.',
   268	    'Cycle time is measured per tech, and techs differ by up to about 2x (Cory 12.8-16.0 min/stop, Luke 20.0-32.1). Hours per route-day are therefore not comparable between techs as a measure of workload difficulty.',
   269	  ],
   270	  observedBaseline: { rows: observed, totals: observedTotals,
   271	    note: 'What the five techs actually delivered over 08-17..09-17. The right sanity check for any policy total.' },
   272	  policies,
   273	  policiesPure,
   274	  seasonality: cad.seasonality,
   275	  seasonalityNote: 'Share of TMCP completed visits whose gap from the prior visit was <=10 days, by week. Week 1 is flagged BIASED (the lookback runs off the front of the visit window). Week 4 lost Labor Day (4 field days), which stretched gaps into week 5 and is the main reason week 5 reads low. The truncation-free companion is ratePerFieldDayNormalized: 0.622 -> 0.556 visits per active TMCP job per 5-day week across the month.',
   276	};
   277	
   278	fs.writeFileSync(path.join(DATA, 'demand-model.json'), JSON.stringify(out, null, 1));
   279	
   280	// ---------- console report ----------
   281	const L = [];
   282	L.push('active jobs ' + active.length + '  route-days 25  master-asbuilt ' + (master ? 'USED' : 'absent, computed own') + '  nearest-neighbor ' + nnUsed + '  unassignable ' + unassignable);
   283	L.push('');
   284	L.push('OBSERVED BASELINE (what actually ran 08-17..09-17)');
   285	L.push('  stops/week ' + observedTotals.stopsPerWeek + '  hours/week ' + observedTotals.hoursPerWeek + '  route-days over 8h ' + observedTotals.routeDaysOver8 + '  over 9h ' + observedTotals.routeDaysOver9);
   286	L.push('');
   287	for (const k of Object.keys(POLICIES)) {
   288	  const p = policies[k];
   289	  L.push(k + ' - ' + p.label + (p.quickFixHeldWeekly ? '  [Quick Fix held weekly]' : ''));
   290	  L.push('  tech             dow  jobs  visits/wk  cyc(min)  hours  over8  over9');
   291	  for (const r of p.rows) {
   292	    L.push('  ' + r.tech.padEnd(17) + r.dow.padEnd(5) + String(r.jobs).padStart(4) + String(r.visitsPerWeek).padStart(11)
   293	      + String(r.cycleMinPerStop).padStart(10) + String(r.hoursPerWeek).padStart(7)
   294	      + String(r.hoursOver8).padStart(7) + String(r.hoursOver9).padStart(7) + (r.cycleSource !== 'route-day measured' ? '  <' + r.cycleSource : ''));
   295	  }
   296	  const t = p.totals;
   297	  L.push('  TOTAL visits/wk ' + t.visitsPerWeek + '  hours/wk ' + t.hoursPerWeek + '  vs 200h = ' + (t.hoursOverCapacityAt8 > 0 ? '+' : '') + t.hoursOverCapacityAt8
   298	    + '  util ' + t.utilizationAt8Pct + '%  days>8h ' + t.routeDaysOver8 + '  days>9h ' + t.routeDaysOver9 + '  tech-days needed@8h ' + t.techDaysNeededAt8);
   299	  L.push('  interval basis: ' + JSON.stringify(p.intervalBasisCounts));
   300	  L.push('');
   301	}
   302	L.push('CALIBRATION vs observed (' + observedTotals.stopsPerWeek + ' stops/wk, ' + observedTotals.hoursPerWeek + ' h/wk)');
   303	for (const c of calibration) {
   304	  L.push('  ' + c.policy + '  visits/wk ' + String(c.visitsPerWeek).padStart(7) + ' (' + (c.deltaVisitsPct > 0 ? '+' : '') + c.deltaVisitsPct + '%)'
   305	    + '   hours/wk ' + String(c.hoursPerWeek).padStart(7) + ' (' + (c.deltaHoursPct > 0 ? '+' : '') + c.deltaHoursPct + '%)');
   306	}
   307	L.push('');
   308	L.push('ROUTE-DAY ASSIGNMENT SOURCE: ' + JSON.stringify([...assign.values()].reduce((m, a) => (m[a.src] = (m[a.src] || 0) + 1, m), {})));
   309	L.push('');
   310	L.push('PURE POLICY (Quick Fix NOT held weekly) totals:');
   311	for (const k of Object.keys(POLICIES)) {
   312	  const t = policiesPure[k].totals;
   313	  L.push('  ' + k + '  visits/wk ' + String(t.visitsPerWeek).padStart(7) + '  hours/wk ' + String(t.hoursPerWeek).padStart(7) + '  vs200 ' + String(t.hoursOverCapacityAt8).padStart(7) + '  days>8h ' + t.routeDaysOver8);
   314	}
   315	L.push('');
   316	L.push('SEASONALITY');
   317	for (const s of cad.seasonality) {
   318	  L.push('  ' + s.weekStart + '  TMCP visits ' + String(s.tmcpCompletedVisits).padStart(4) + '  share weekly ' + String(s.shareWeeklyPct).padStart(5) + '%'
   319	    + '  rate@5d ' + s.ratePerFieldDayNormalized + (s.caveat ? '  <<' + s.caveat.split(':')[0] : ''));
   320	}
   321	console.log(L.join('\n'));
```

## [17] scripts/derive-master.mjs

```
     1	#!/usr/bin/env node
     2	/**
     3	 * S3a - derive-master.mjs
     4	 *
     5	 * Derives the AS-BUILT master route from data alone: every job -> one route-day
     6	 * (tech x weekday), with a stability class saying how much the field actually
     7	 * agrees with itself. No rulebook is read. No rule is applied.
     8	 *
     9	 * Inputs (relative to projects/briefs/route-engine/):
    10	 *   redesign/data/jobber/jobs.json
    11	 *   redesign/data/jobber/visits.json
    12	 *   data/completed-visits_2026-08-17_2026-09-17.json   (cross-check only)
    13	 *   data/route-day-drive_2026-08-17_2026-09-17.json    (observed cycle times)
    14	 *
    15	 * Output: redesign/data/master-asbuilt.json
    16	 */
    17	
    18	import fs from 'node:fs';
    19	import path from 'node:path';
    20	import { fileURLToPath } from 'node:url';
    21	
    22	const __dirname = path.dirname(fileURLToPath(import.meta.url));
    23	const ROOT = path.resolve(__dirname, '..', '..'); // .../route-engine
    24	const OUT = path.join(ROOT, 'redesign', 'data', 'master-asbuilt.json');
    25	
    26	const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
    27	
    28	// ---------------------------------------------------------------- constants
    29	// Aug-Oct 2026 is entirely PDT (UTC-7); DST ends 2026-11-01.
    30	const PT_OFFSET_H = 7;
    31	const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    32	const WORKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
    33	const STABLE_THRESHOLD = 0.8;
    34	const NEIGHBOURS = 10;
    35	
    36	const ptDate = (iso) => new Date(new Date(iso).getTime() - PT_OFFSET_H * 3600e3);
    37	const ptDay = (iso) => ptDate(iso).toISOString().slice(0, 10);
    38	const ptDow = (iso) => DOW[ptDate(iso).getUTCDay()];
    39	
    40	const hav = (a, b) => {
    41	  const R = 6371;
    42	  const p = Math.PI / 180;
    43	  const dLat = (b.lat - a.lat) * p;
    44	  const dLng = (b.lng - a.lng) * p;
    45	  const s =
    46	    Math.sin(dLat / 2) ** 2 +
    47	    Math.cos(a.lat * p) * Math.cos(b.lat * p) * Math.sin(dLng / 2) ** 2;
    48	  return 2 * R * Math.asin(Math.sqrt(s));
    49	};
    50	
    51	const median = (xs) => {
    52	  if (!xs.length) return null;
    53	  const s = [...xs].sort((a, b) => a - b);
    54	  const m = s.length >> 1;
    55	  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    56	};
    57	
    58	const tally = (xs) => xs.reduce((a, x) => ((a[x] = (a[x] || 0) + 1), a), {});
    59	const top = (t) => {
    60	  const e = Object.entries(t).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    61	  return e.length ? { value: e[0][0], count: e[0][1] } : { value: null, count: 0 };
    62	};
    63	
    64	// ---------------------------------------------------------------- load
    65	const jobs = rd('redesign/data/jobber/jobs.json');
    66	const visits = rd('redesign/data/jobber/visits.json');
    67	const crossCheck = rd('data/completed-visits_2026-08-17_2026-09-17.json');
    68	const driveSummary = rd('data/route-day-drive_2026-08-17_2026-09-17.json').summary;
    69	
    70	const log = [];
    71	const say = (...a) => {
    72	  const s = a.join(' ');
    73	  log.push(s);
    74	  console.log(s);
    75	};
    76	
    77	// ---------------------------------------------------------------- product
    78	const productOf = (job) => {
    79	  const names = (job.lineItems || []).map((li) => (li.name || '').toLowerCase());
    80	  const j = names.join(' | ');
    81	  if (j.includes('total mole control')) return 'TMCP';
    82	  if (j.includes('quick fix')) return 'QUICK_FIX';
    83	  if (j.includes('barter') || j.includes('friends and family')) return 'BARTER';
    84	  if (!names.length || names.every((n) => !n.trim())) return 'BID_OR_EMPTY';
    85	  return 'OTHER';
    86	};
    87	
    88	const cf = (job, label) => {
    89	  const f = (job.customFields || []).find(
    90	    (x) => (x.label || '').trim().toLowerCase() === label.toLowerCase()
    91	  );
    92	  return f ? f.value : null;
    93	};
    94	
    95	// ---------------------------------------------------------------- index visits
    96	const byJob = new Map();
    97	for (const v of visits) {
    98	  if (!byJob.has(v.jobNumber)) byJob.set(v.jobNumber, []);
    99	  byJob.get(v.jobNumber).push(v);
   100	}
   101	for (const a of byJob.values()) a.sort((x, y) => x.startAt.localeCompare(y.startAt));
   102	
   103	// cross-check: does the standalone completed-visits file agree on tech?
   104	{
   105	  const vById = new Map(visits.map((v) => [v.id, v]));
   106	  let miss = 0;
   107	  let disagree = 0;
   108	  for (const c of crossCheck) {
   109	    const v = vById.get(c.id);
   110	    if (!v) {
   111	      miss++;
   112	      continue;
   113	    }
   114	    if ((v.techs || [])[0] !== c.tech) disagree++;
   115	  }
   116	  say(
   117	    `[cross-check] completed-visits file: ${crossCheck.length} rows, ${miss} absent from visits.json, ${disagree} tech disagreements`
   118	  );
   119	}
   120	
   121	const completedOf = (jn) =>
   122	  (byJob.get(jn) || [])
   123	    .filter((v) => v.isComplete && (v.techs || []).length)
   124	    .map((v) => ({
   125	      id: v.id,
   126	      date: ptDay(v.startAt),
   127	      weekday: ptDow(v.startAt),
   128	      tech: v.techs[0],
   129	      completedAt: v.completedAt || null,
   130	    }))
   131	    .sort((a, b) => a.date.localeCompare(b.date));
   132	
   133	// window actually observed
   134	const allCompletedDates = visits
   135	  .filter((v) => v.isComplete)
   136	  .map((v) => ptDay(v.startAt))
   137	  .sort();
   138	const WINDOW = { from: allCompletedDates[0], to: allCompletedDates[allCompletedDates.length - 1] };
   139	const WINDOW_WEEKS = (new Date(WINDOW.to) - new Date(WINDOW.from)) / (7 * 86400e3) + 1 / 7;
   140	say(`[window] completed visits ${WINDOW.from} .. ${WINDOW.to} (${WINDOW_WEEKS.toFixed(2)} weeks)`);
   141	
   142	// ---------------------------------------------------------------- cadence
   143	// Weekly-equivalent visits derived from the job own visit spacing in the file
   144	// (completed + scheduled future), never from a cadence rule.
   145	const cadenceOf = (jn) => {
   146	  const vs = byJob.get(jn) || [];
   147	  const days = [...new Set(vs.map((v) => ptDay(v.startAt)))].sort();
   148	  if (days.length < 2) return { weeklyEq: null, medianGapDays: null, basis: 'insufficient' };
   149	  const gaps = [];
   150	  for (let i = 1; i < days.length; i++) {
   151	    gaps.push((new Date(days[i]) - new Date(days[i - 1])) / 86400e3);
   152	  }
   153	  const g = median(gaps.filter((x) => x > 0));
   154	  if (!g) return { weeklyEq: null, medianGapDays: null, basis: 'insufficient' };
   155	  return { weeklyEq: Math.min(1, 7 / g), medianGapDays: g, basis: 'observed-spacing' };
   156	};
   157	
   158	// ---------------------------------------------------------------- build rows
   159	const rows = [];
   160	for (const job of jobs) {
   161	  const p = job.property || {};
   162	  const comp = completedOf(job.jobNumber);
   163	  const cad = cadenceOf(job.jobNumber);
   164	
   165	  // handover detection: exactly one tech change point, sustained after it
   166	  const techSeq = comp.map((c) => c.tech);
   167	  let handover = null;
   168	  if (techSeq.length >= 2) {
   169	    const changes = [];
   170	    for (let i = 1; i < techSeq.length; i++) if (techSeq[i] !== techSeq[i - 1]) changes.push(i);
   171	    if (changes.length === 1) {
   172	      const i = changes[0];
   173	      const before = new Set(techSeq.slice(0, i));
   174	      const after = new Set(techSeq.slice(i));
   175	      // sustained = at least two visits on the new tech, otherwise it is just scatter
   176	      if (before.size === 1 && after.size === 1 && techSeq.length - i >= 2) {
   177	        handover = {
   178	          from: techSeq[i - 1],
   179	          to: techSeq[i],
   180	          date: comp[i].date,
   181	          visitsBefore: i,
   182	          visitsAfter: techSeq.length - i,
   183	        };
   184	      }
   185	    }
   186	  }
   187	
   188	  // tech view: after a handover, only the post-handover segment defines the tech
   189	  const techPool = handover ? comp.filter((c) => c.date >= handover.date) : comp;
   190	  const techTally = tally(techPool.map((c) => c.tech));
   191	  const dayTally = tally(comp.map((c) => c.weekday));
   192	  const tTop = top(techTally);
   193	  const dTop = top(dayTally);
   194	  const techShare = techPool.length ? tTop.count / techPool.length : null;
   195	  const dayShare = comp.length ? dTop.count / comp.length : null;
   196	
   197	  let stability;
   198	  if (comp.length === 0) stability = 'NONE';
   199	  else if (comp.length === 1) stability = 'SINGLE';
   200	  else {
   201	    const tOk = handover ? true : techShare >= STABLE_THRESHOLD;
   202	    const dOk = dayShare >= STABLE_THRESHOLD;
   203	    if (tOk && dOk) stability = 'STABLE';
   204	    else if (!tOk && dOk) stability = 'TECH-FLIP';
   205	    else if (tOk && !dOk) stability = 'DAY-FLIP';
   206	    else stability = 'BOTH-FLIP';
   207	  }
   208	
   209	  rows.push({
   210	    jobNumber: job.jobNumber,
   211	    client: job.client?.name || job.title || null,
   212	    jobStatus: job.jobStatus,
   213	    product: productOf(job),
   214	    lat: p.lat ?? null,
   215	    lng: p.lng ?? null,
   216	    geoStatus: p.geoStatus || null,
   217	    zip: p.postalCode || null,
   218	    city: p.city || null,
   219	    street: p.street || null,
   220	    latestActivity: cf(job, 'Latest Activity'),
   221	    nextAction: cf(job, 'Next Action'),
   222	    molesCaught: cf(job, 'Moles Caught (last visit)'),
   223	    misses: cf(job, 'Misses (last visit)'),
   224	    totalCaught: cf(job, 'Total Caught'),
   225	    scheduledDefault: (job.visitSchedule?.assignedTo || []).map((x) => x?.name || x),
   226	    recurrence: job.visitSchedule?.recurrence || null,
   227	    completedVisits: comp,
   228	    completedCount: comp.length,
   229	    futureCount: (byJob.get(job.jobNumber) || []).filter((v) => !v.isComplete).length,
   230	    handover,
   231	    techTally,
   232	    dayTally,
   233	    dominantTech: tTop.value,
   234	    techShare: techShare === null ? null : +techShare.toFixed(3),
   235	    dominantWeekday: dTop.value,
   236	    dayShare: dayShare === null ? null : +dayShare.toFixed(3),
   237	    stability,
   238	    inferred: false,
   239	    // primary load measure: what this job actually consumed, per week, in the window
   240	    weeklyEq: comp.length ? +(comp.length / WINDOW_WEEKS).toFixed(3) : null,
   241	    weeklyEqSpacing: cad.weeklyEq === null ? null : +cad.weeklyEq.toFixed(3),
   242	    medianGapDays: cad.medianGapDays,
   243	    cadenceBasis: comp.length ? 'observed-throughput' : cad.basis,
   244	    routeDay: tTop.value && dTop.value ? `${tTop.value}|${dTop.value}` : null,
   245	  });
   246	}
   247	
   248	// ---------------------------------------------------------------- inference
   249	const stable = rows.filter((r) => r.stability === 'STABLE' && r.lat != null);
   250	const needInfer = rows.filter((r) => r.stability === 'NONE' && r.lat != null);
   251	
   252	for (const r of needInfer) {
   253	  const near = stable
   254	    .map((s) => ({ s, d: hav(r, s) }))
   255	    .sort((a, b) => a.d - b.d)
   256	    .slice(0, NEIGHBOURS);
   257	  if (!near.length) continue;
   258	  const votes = {};
   259	  for (const { s, d } of near) {
   260	    const w = 1 / Math.max(d, 0.1);
   261	    votes[s.routeDay] = (votes[s.routeDay] || 0) + w;
   262	  }
   263	  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
   264	  const total = ranked.reduce((a, [, w]) => a + w, 0);
   265	  const [rdKey, w] = ranked[0];
   266	  const [tech, weekday] = rdKey.split('|');
   267	  r.routeDay = rdKey;
   268	  r.dominantTech = tech;
   269	  r.dominantWeekday = weekday;
   270	  r.inferred = true;
   271	  r.inferredFrom = {
   272	    neighbours: near.length,
   273	    maxDistKm: +near[near.length - 1].d.toFixed(2),
   274	    confidence: +(w / total).toFixed(3),
   275	    runnerUp: ranked[1] ? ranked[1][0] : null,
   276	  };
   277	}
   278	
   279	// weeklyEq fallback for future-only jobs: median observed rate for the same product
   280	{
   281	  const byProd = {};
   282	  for (const r of rows) if (r.weeklyEq != null) (byProd[r.product] ||= []).push(r.weeklyEq);
   283	  const fallback = Object.fromEntries(Object.entries(byProd).map(([k, v]) => [k, median(v)]));
   284	  const globalFallback = median(rows.filter((r) => r.weeklyEq != null).map((r) => r.weeklyEq));
   285	  let n = 0;
   286	  for (const r of rows) {
   287	    if (r.weeklyEq == null) {
   288	      r.weeklyEq = +(fallback[r.product] ?? globalFallback).toFixed(3);
   289	      r.cadenceBasis = `product-median-rate(${r.product})`;
   290	      n++;
   291	    }
   292	  }
   293	  say(
   294	    `[cadence] observed weekly rate, product medians ${JSON.stringify(fallback)}; ${n} future-only jobs used the fallback`
   295	  );
   296	  const spacing = {};
   297	  for (const r of rows) if (r.weeklyEqSpacing != null) (spacing[r.product] ||= []).push(r.weeklyEqSpacing);
   298	  say(
   299	    `[cadence] cross-check, spacing-derived medians ${JSON.stringify(
   300	      Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, median(v)]))
   301	    )}`
   302	  );
   303	  const totalObserved = rows.reduce((a, r) => a + r.completedCount, 0);
   304	  say(
   305	    `[cadence] ${totalObserved} completed visits / ${WINDOW_WEEKS.toFixed(2)} weeks = ${(
   306	      totalObserved / WINDOW_WEEKS
   307	    ).toFixed(1)} actual visits per week`
   308	  );
   309	}
   310	
   311	// diagnostics: how scattered are the weekdays really?
   312	{
   313	  const multi = rows.filter((r) => r.completedCount >= 2);
   314	  const buckets = { '1.00': 0, '0.80-0.99': 0, '0.60-0.79': 0, '0.50-0.59': 0, '<0.50': 0 };
   315	  for (const r of multi) {
   316	    const s = r.dayShare;
   317	    if (s >= 1) buckets['1.00']++;
   318	    else if (s >= 0.8) buckets['0.80-0.99']++;
   319	    else if (s >= 0.6) buckets['0.60-0.79']++;
   320	    else if (s >= 0.5) buckets['0.50-0.59']++;
   321	    else buckets['<0.50']++;
   322	  }
   323	  say(`[diagnostic] weekday share among ${multi.length} multi-visit jobs: ${JSON.stringify(buckets)}`);
   324	  const distinct = tally(multi.map((r) => Object.keys(r.dayTally).length));
   325	  say(`[diagnostic] distinct weekdays per multi-visit job: ${JSON.stringify(distinct)}`);
   326	  const vc = tally(multi.map((r) => r.completedCount));
   327	  say(`[diagnostic] completed-visit count distribution: ${JSON.stringify(vc)}`);
   328	}
   329	
   330	// ---------------------------------------------------------------- summaries
   331	const classCounts = tally(rows.map((r) => r.stability));
   332	const inferredCount = rows.filter((r) => r.inferred).length;
   333	
   334	const cycle = {};
   335	for (const s of driveSummary) cycle[`${s.tech}|${s.dow}`] = s;
   336	
   337	const routeDays = {};
   338	for (const r of rows) {
   339	  if (!r.routeDay) continue;
   340	  const [tech, weekday] = r.routeDay.split('|');
   341	  const k = r.routeDay;
   342	  routeDays[k] ||= {
   343	    routeDay: k,
   344	    tech,
   345	    weekday,
   346	    jobs: 0,
   347	    stableJobs: 0,
   348	    inferredJobs: 0,
   349	    flipJobs: 0,
   350	    singleJobs: 0,
   351	    activeJobs: 0,
   352	    weeklyEqVisits: 0,
   353	    latSum: 0,
   354	    lngSum: 0,
   355	    geo: 0,
   356	    zips: {},
   357	    cities: {},
   358	    products: {},
   359	  };
   360	  const d = routeDays[k];
   361	  d.jobs++;
   362	  if (r.stability === 'STABLE') d.stableJobs++;
   363	  if (r.inferred) d.inferredJobs++;
   364	  if (r.stability.endsWith('FLIP')) d.flipJobs++;
   365	  if (r.stability === 'SINGLE') d.singleJobs++;
   366	  if (r.jobStatus !== 'archived') d.activeJobs++;
   367	  d.weeklyEqVisits += r.weeklyEq || 0;
   368	  if (r.lat != null) {
   369	    d.latSum += r.lat;
   370	    d.lngSum += r.lng;
   371	    d.geo++;
   372	  }
   373	  if (r.zip) d.zips[r.zip] = (d.zips[r.zip] || 0) + 1;
   374	  if (r.city) d.cities[r.city] = (d.cities[r.city] || 0) + 1;
   375	  d.products[r.product] = (d.products[r.product] || 0) + 1;
   376	}
   377	
   378	for (const d of Object.values(routeDays)) {
   379	  d.weeklyEqVisits = +d.weeklyEqVisits.toFixed(1);
   380	  d.centroid = d.geo
   381	    ? { lat: +(d.latSum / d.geo).toFixed(5), lng: +(d.lngSum / d.geo).toFixed(5) }
   382	    : null;
   383	  delete d.latSum;
   384	  delete d.lngSum;
   385	  delete d.geo;
   386	  const c = cycle[d.routeDay];
   387	  if (c) {
   388	    d.observed = {
   389	      medianStops: c.medianStops,
   390	      medianSpanH: c.medianSpanH,
   391	      medianDriveH: c.medianDriveH,
   392	      driveMinPerStop: c.driveMinPerStop,
   393	      weeks: c.weeks,
   394	    };
   395	    const spanPerStop = c.medianStops ? (c.medianSpanH * 60) / c.medianStops : null;
   396	    d.minutesPerStopObserved = spanPerStop ? +spanPerStop.toFixed(1) : null;
   397	    d.weeklyHours = spanPerStop ? +((spanPerStop * d.weeklyEqVisits) / 60).toFixed(1) : null;
   398	  } else {
   399	    d.observed = null;
   400	    d.minutesPerStopObserved = null;
   401	    d.weeklyHours = null;
   402	  }
   403	  d.topZips = Object.entries(d.zips).sort((a, b) => b[1] - a[1]).slice(0, 8);
   404	  d.topCities = Object.entries(d.cities).sort((a, b) => b[1] - a[1]).slice(0, 8);
   405	}
   406	
   407	const orderedRouteDays = Object.values(routeDays).sort(
   408	  (a, b) =>
   409	    a.tech.localeCompare(b.tech) || WORKDAYS.indexOf(a.weekday) - WORKDAYS.indexOf(b.weekday)
   410	);
   411	
   412	const handovers = {};
   413	for (const r of rows) {
   414	  if (!r.handover) continue;
   415	  const k = `${r.handover.from} -> ${r.handover.to}`;
   416	  handovers[k] ||= { pair: k, jobs: 0, dates: {} };
   417	  handovers[k].jobs++;
   418	  handovers[k].dates[r.handover.date] = (handovers[k].dates[r.handover.date] || 0) + 1;
   419	}
   420	
   421	const out = {
   422	  generatedAt: new Date().toISOString(),
   423	  source: 'jobs.json + visits.json (completed visits only); no rulebook consulted',
   424	  window: { ...WINDOW, weeks: +WINDOW_WEEKS.toFixed(2) },
   425	  method: {
   426	    weekday: 'Pacific (UTC-7) date of visit startAt',
   427	    tech: 'visits.json techs[0] on completed visits',
   428	    stableThreshold: STABLE_THRESHOLD,
   429	    handover: 'single sustained tech change point; post-handover segment defines the tech',
   430	    inference: `${NEIGHBOURS}-nearest STABLE jobs, inverse-distance weighted vote on tech|weekday`,
   431	    weeklyEq: 'min(1, 7 / median gap between the job own scheduled visit dates)',
   432	    weeklyHours: 'route-day observed median span per stop x weekly-equivalent stops',
   433	  },
   434	  summary: {
   435	    jobs: rows.length,
   436	    classCounts,
   437	    inferred: inferredCount,
   438	    withCoordinates: rows.filter((r) => r.lat != null).length,
   439	    unassigned: rows.filter((r) => !r.routeDay).length,
   440	    handovers: Object.values(handovers),
   441	    routeDayCount: orderedRouteDays.length,
   442	  },
   443	  routeDays: orderedRouteDays,
   444	  jobs: rows,
   445	};
   446	
   447	fs.mkdirSync(path.dirname(OUT), { recursive: true });
   448	fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
   449	
   450	say('');
   451	say('=== STABILITY CLASSES ===');
   452	for (const [k, v] of Object.entries(classCounts).sort((a, b) => b[1] - a[1]))
   453	  say(`  ${k.padEnd(10)} ${String(v).padStart(5)}  ${((v / rows.length) * 100).toFixed(1)}%`);
   454	say(`  INFERRED (subset of NONE): ${inferredCount}`);
   455	say(`  unassigned (no route-day at all): ${out.summary.unassigned}`);
   456	say('');
   457	say('=== HANDOVERS ===');
   458	for (const h of Object.values(handovers))
   459	  say(`  ${h.pair}: ${h.jobs} jobs; dates ${JSON.stringify(h.dates)}`);
   460	say('');
   461	say('=== ROUTE-DAY LOAD ===');
   462	say('  tech               dow  jobs  actv  stab infer  flip  wkEqVis  min/stop  hours');
   463	for (const d of orderedRouteDays) {
   464	  say(
   465	    `  ${d.tech.padEnd(18)} ${d.weekday.padEnd(4)} ${String(d.jobs).padStart(4)} ${String(
   466	      d.activeJobs
   467	    ).padStart(5)} ${String(d.stableJobs).padStart(5)} ${String(d.inferredJobs).padStart(
   468	      5
   469	    )} ${String(d.flipJobs).padStart(5)} ${String(d.weeklyEqVisits).padStart(8)} ${String(
   470	      d.minutesPerStopObserved ?? '-'
   471	    ).padStart(9)} ${String(d.weeklyHours ?? '-').padStart(6)}`
   472	  );
   473	}
   474	const totJobs = orderedRouteDays.reduce((a, d) => a + d.jobs, 0);
   475	const totVis = orderedRouteDays.reduce((a, d) => a + d.weeklyEqVisits, 0);
   476	const totH = orderedRouteDays.reduce((a, d) => a + (d.weeklyHours || 0), 0);
   477	say(`  TOTAL: ${totJobs} jobs, ${totVis.toFixed(1)} weekly-equivalent visits, ${totH.toFixed(1)} h/week`);
   478	say('');
   479	say(`wrote ${OUT}`);
   480	
   481	fs.writeFileSync(path.join(ROOT, 'redesign/data/derive-master.log'), log.join('\n') + '\n');
```
