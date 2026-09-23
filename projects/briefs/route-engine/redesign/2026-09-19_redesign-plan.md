---
project: route-engine-redesign
status: plan-for-decision
level: 3
created: 2026-09-19
supersedes: stages/S4-design.md
---

# Route Engine Redesign — the plan, and what it is built on

Prepared for Spencer, 2026-09-19. Everything below rests on data pulled and measured in the last 24 hours: 2,793 Jobber completion stamps, 2,577 OptimoRoute stops as driven, 1,063 jobs with contracts and coordinates, 3,637 FleetSharp GPS stops and 1,126 trips, and five weeks of Gusto clock-ins. The design was written fresh, backtested against the weeks of 08-24 and 08-31, reviewed hostilely by Codex (gpt-6-astra), and every one of its 32 findings checked against the code. Stage files are in `projects/briefs/route-engine/redesign/`.

## 1. What the data settled

| Fact | Measured | Where |
|---|---|---|
| The field runs the board it is given | 97% same day, 98.5% same tech over 2,577 planned stops | S2 |
| Planned clock times are noise | median arrival error 38 min, p10–p90 ±130 min for every tech | S2 |
| Ownership is real and stable | 83% of customers stay with one tech; a static owner map reproduces 87–90% of a golden week | S3a, S5 |
| Weekday structure is real where geography makes it so | Peninsula 29/29 Wed, north Seattle 57/57 Tue, Sammamish 55/56 Fri; elsewhere 75.6% weekday hold on completed visits (88.9% tech hold) and Cory 4% stable | S3a, S3b-corrected |
| The office books one cadence regardless of what the tech found | next visit booked 14 days out after a catch, a miss, low, high or nothing; delivered TMCP gap median 7 days | S3b (verified) |
| Half the active book is behind its own field | 54% of active jobs unsatisfied against their Next Action; 19% hard overdue, median 22 days (corrected 09-19: 112 appointments were booked, passed and never completed, and had been counted as "arranged") | S3b-corrected |
| Capacity fits on paper only | weekly-after-any-activity = 195 h (GPS) against 200 h; 10 route-days over 8 h; Alias's book alone is 50.5 h | S3b, S2c |
| The paid day is first job to last job | clock-in 41 min after leaving home, clock-out 49 min before arriving; 164 unpaid commute hours in the month | S2b, S2c |
| Overtime is one person | Alias 42.6 of 61 overtime hours, 15 of his 23 days red; 8 of 20 tech-weeks successful by payroll | S2b |
| The directed service times are wrong for everyone | GPS on-site median: Cory 8.1, Tavis 9.0, Luke 12.2, Robert 12.3, Alias 14.3 min against 12/15 directed; within-tech spread is wider than between-tech | S2c |
| Drive per stop is a property of the ground | Robert 6.5, Cory 7.1, Tavis 8.1, Alias 8.5, Luke 11.9 min | S2c |
| OptimoRoute holds no truth about time | every stop "scheduled", no completion, no route start or end | S1 |
| Jobber has coordinates for every property | 100% of jobs and visits, geoStatus FOUND | S1 |
| Late bookings are structural | ~9% of a week's stops did not exist on the Friday before | S5 |
| Homes | Alias Snohomish 98290, Tavis Auburn 98092, Cory Buckley 98321, Robert Maple Valley 98038, Luke Edgewood 98372 | S2c |

Two earlier beliefs died: OptimoRoute is not the only geocoder, and the stamp-derived split of a day into service and drive was badly wrong even though its total was right. Tavis was credited 2.8 hours of service that never happened and 4.4 hours of driving was hidden.

## 2. The model (revised after review)

The first design said "master territory, not master route." Codex was right that this overcorrects: geography gives some customers a weekday as firmly as it gives them a tech. The model that fits the evidence has four objects, each changed by a different clock, and one writer.

**Ownership register.** Every customer → one owner tech, stored on the Jobber job, changed only by a dated event: handover, hire, or a seam decision Spencer signs. **Coverage is a separate column.** A tech who runs another's route for a day is recorded as covering, never as owning. Deriving ownership from history every run is what poisoned the backtest after Cory covered Luke on 08-28. The register starts from the S3a as-built map (345 stable customers, 74 clean handovers, the rest by neighbour vote) and the five seams Spencer must decide: Buckley/Bonney Lake/Sumner, Kent North/Maple Valley, the 98059 and 98092 ties, the 51 island customers, Snoqualmie Valley.

**Route patterns.** Each owner's book carries a small number of recurring geographic day patterns: an area and its weekday. Customers inherit the pattern of their area. Patterns persist; they are reviewed monthly against GPS and changed by a decision, not re-clustered on every run. Where the data already shows a hard pattern (the peninsula on Wednesday) the pattern is a commitment. Where it shows none (most of Cory's ground) the weekday is a preference and the weekly solve may move it.

**Service obligation ledger.** Separate from the Jobber visit. Each obligation records why service is due (catch, miss, activity, quiet cycle, Quick Fix visit n of 5, new sale), its window, what completes it, and any approved exception. Obligations are generated from the visit note the moment it lands. Quick Fix terminates at visit five with a sales flag. The cadence rule that fits the book and the hours is P2: active (catch, miss or any activity) → due in 5–9 days; quiet → next month, same ordinal weekday, 26–35 days; Quick Fix → 5–9 days for five visits. The office's current 14-days-for-everything booking is replaced by the ledger.

**Weekly repair with controlled exceptions.** Every Friday, per owner: take the obligations whose window intersects next week, place them on the pattern day, and repair only what does not fit. Capacity is measured in minutes: GPS on-site per tech plus road drive per stop for that ground, and the wall is the paid span, first job to last job. When a week does not fit, the solver does not stretch the day silently; it produces an exception list in a fixed priority order that Spencer sets once: coverage by the float, overtime within the limit, or explicit deferral with the customer told. Late bookings and new notes go to a daily add queue that places into the owner's unfrozen days inside the window, and escalates to the exception list rather than deferring past the window.

**One writer.** Unchanged from the verified requirements: refetch and diff before every write, freeze evaluated per write in Pacific calendar time, per-visit before/after in the ledger, verify after write, partial runs stay partial, ceiling preflighted. Approval is an explicit go on the reviewed week. Nothing writes on a timer until the shadow phase has passed.

**Feedback loops.** Weekly: on-site and drive per stop per tech per area from GPS. Weekly: paid hours per route-day versus planned, the capacity meter and hiring signal. Daily: obligations past their window. Monthly: pattern and seam review with proposals only.

## 3. What the backtest proved and did not

The harness is real and reproducible, and it validated itself: replaying the actual board scores 100% tech, 100% day, hours ratio 1.00 on every route-day. Two policies were then tested against the golden weeks.

| Policy | Same tech | Same day | Hours ±10% | Over 9.5 h | Overflow |
|---|---|---|---|---|---|
| Static master (dominant tech + weekday from history) | 87–90% | 69–76% | 5–7 of 24 | – | – |
| Week-solve (owner + windows + capacity wall) | 87.5–89.2% | 73% / 48% | 13/24, 5/24 | 0 at cycle time | 16 / 4 |

What this supports: the window machinery holds; the capacity wall holds at measured pace; the overflow is one tech (Alias, 134 stops against 118 of capacity) while Cory carries about 70 stops of slack every week; ownership must be signed, not modelled.

What it does not support, per Codex and verification: the harness reconstructs the Friday board from today's records, so coordinates, service times and the roster carry hindsight; the "actual" board is part execution and part schedule; the window was too short for any customer to read as quiet, so the monthly branch was never exercised; the sequencer's drive-time win is inside the estimator's 6% error and is not claimed. The scores are directional. The next test has to be a chronological replay with immutable weekly snapshots, which is the first build item.

## 4. Build order

Effort is days unless marked. Each item names what it unblocks.

1. **Repair the measurement primitives** (1 day). Completed-to-completed gaps, visit-linked notes, completed-only hold statistics, completed-only Quick Fix counts, the plural "misses" pattern. Unblocks: trustworthy cadence numbers.
2. **Immutable weekly snapshots** (2 days). Every Friday 12:00 PT capture the full book: visits, assignees, findings, coordinates, roster, availability, hashed. Start this Friday, 09-25. Unblocks: a fair backtest and every future audit.
3. **Ownership register with coverage** (2 days plus Spencer's sitting). S3a map, five seams decided, written to the Jobber job as `Route Owner`, coverage recorded per date. No bulk recurrence rewrite yet. Unblocks: 100% tech agreement by construction; ends the weekly 200-write patching.
4. **Service obligation ledger** (1 week). Note processor → obligation with window; Quick Fix termination; unknown-state and overdue exceptions surfaced daily. Unblocks: demand that is generated, not discovered.
5. **Capacity in minutes** (3 days). GPS on-site and drive per tech per area, weekly refresh; paid-span wall; retire the 12/15-minute directed numbers in OptimoRoute in favour of measured ones. Unblocks: a wall that means something and a hiring signal that is arithmetic.
6. **Route patterns and the weekly repair solve** (1–2 weeks). Persistent patterns from S3a and GPS; exact feasibility check; exception list in Spencer's priority order; add queue; chronological replay across September with the snapshots from item 2. Unblocks: the shadow phase.
7. **Keep the writer requirements, audit the writer code** (3 days). The one guarded writer, UPDATE/CREATE semantics, ledger with before/after. Unblocks: a supervised live week.

Refused for now, on Codex's advice and mine: a bulk rewrite of the recurring series through 2027, autonomous daily add-queue writes, and any replacement for OptimoRoute as the day sequencer. Each waits until items 1–6 have run in shadow.

## 5. The test that counts

- **Phase A, replay.** Items 1–2 done. Re-run the golden weeks from snapshots with no hindsight inputs. Gates: 100% owner agreement against the signed register; every obligation inside its window or on the exception list; no day over the paid-span wall; late bookings replayed through the add queue, not counted.
- **Phase B, shadow.** Four Fridays starting 10-02. The system produces next week's board; Spencer produces his. Both are written down before Monday. Compare on Saturday: tech, day, hours per route-day, exception list versus what Spencer actually did. Zero writes. Pass: three consecutive weeks where every difference is explained and Spencer would have accepted the system's board.
- **Phase C, one supervised live week.** Spencer says go on the reviewed board; the writer applies it; GPS and Gusto score it the following Monday.

## 6. Decisions only Spencer can make

1. Sign the ownership register after the five seams (S3a appendix). Which past cover days were coverage and which were handovers.
2. Which weekday commitments are promises to customers and must stay hard, because the history cannot tell a promise from a habit.
3. The exception priority when a week does not fit: float coverage, overtime within a limit, or deferral, in that order or another.
4. Cory as the float: what reserve he keeps for absences and late work, and what non-route duties count against it.
5. What the daily wall includes: first job to last job (the paid definition), or door to door. GPS says the commute is 70–105 minutes a day per tech and unpaid.
6. Alias's book: 50.5 hours a week from a home in Snohomish. Move work to Cory, hire, or accept the overtime as policy. The data does not offer a fourth option.
7. The monthly anchor rule: same ordinal weekday held from the original date, or reset from the quiet visit.

## 7. Readiness report against the three buckets

- **Needed your approval:** the four defaults (accepted), the FleetSharp token and host (resolved together in the browser), the Gusto export (received). Nothing was written to Jobber or OptimoRoute; the write gate stayed closed throughout.
- **Paused when Claude stopped:** nothing was lost; every stage wrote to disk. The FleetSharp pull needed your hands because the local permission system blocked this session from the host, which is the guardrail working.
- **Stalled silently:** nothing. Jobber throttling did not bite; Codex ran to completion in one pass; every OptimoRoute date except Labor Day returned routes.
