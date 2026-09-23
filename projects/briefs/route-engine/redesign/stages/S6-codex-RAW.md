## A. Is the model right?

**Reject S4 as an implementation specification. Use permanent ownership, recurring geographic day patterns, and controlled scheduling exceptions.** The reported implementation fails its ownership, zero-drop, route-day hours, and compactness requirements; its claimed window pass depends on replacing expired windows with new permitted dates. (`stages/S5-week-solve.md:214–225`)

The evidence supports making ownership more stable than execution day. It does **not** support S4’s categorical statement that customers never belonged to weekdays. S3a reports Peninsula/Gig Harbor at 29 of 29 on Wednesday, North Seattle at 57 of 57 on Tuesday, and Sammamish/Issaquah Highlands at 55 of 56 on Friday. Robert and Tavis have recognizable geographic blocks spanning two days. Those are useful route patterns to preserve or improve, not evidence for discarding weekday structure. (`stages/S4-design.md:19`; `stages/S3a-master-territory.md:139–161`)

Two headline statistics are weaker than presented:

- The 32.5% STABLE share includes 224 single-observation jobs and 66 future-only jobs in its denominator; these lack enough evidence to establish stability, rather than demonstrating instability. The population also includes 177 archived jobs. (`stages/S3a-master-territory.md:30–37`, `:352–353`)
- The code producing 66.6% weekday hold and 83.2% tech hold counts **completed and future scheduled visits**, despite their use as evidence about field behavior. (`scripts/derive-cadence.mjs:284–292`)

S2 establishes that technicians generally execute the board they receive. It does not establish that customers have no weekday commitments, that weekday changes are desirable, or that the resulting board is efficient. Likewise, beating a crude historical-majority assignment is not a comparison against a maintained, capacity-aware route template. (`stages/S2-plan-vs-actual.md:22–35`; `scripts/policies/dominant-routeday.mjs:96–124`)

The missing central object is a **service obligation**, separate from a scheduled Jobber visit: why service is required, its original window, its completion condition, and any approved exception. S4 stores one current window on a job while retaining recurring visits, but does not define how those appointments satisfy, duplicate, or supersede obligations. It also makes owner-only assignment hard while proposing float coverage, without defining a separate executing technician. (`stages/S4-design.md:25–49`, `:58–67`)

For a Rollins/Terminix-style branch at this size, I would use a rolling horizon covering monthly demand, persistent geographic route patterns, workload measured in minutes, explicit customer commitments, and dispatcher-approved coverage exceptions. The weekly solve would repair that structure around actual demand. **SUSPECTED:** the bundle supplies no evidence of either company’s actual internal architecture, so S4’s specific Rollins comparison is unverified. (`stages/S4-design.md:25`, `:69–77`)

## B. The week-solve policy

### 1. Owner map without lookahead — suitable for proposing a map, unsuitable as operational authority

The policy correctly recuts completion history at its declared Friday cutoff. However, it reconstructs ownership on every invocation using majority counts and recency ties, whereas S4 requires a persisted owner changed only through dated events. It neither distinguishes coverage from ownership nor implements the sustained-handover logic available in the derivation script. (`scripts/policies/week-solve.mjs:269–279`, `:315–365`; `stages/S4-design.md:25`; `scripts/derive-master.mjs:165–189`)

**Silent dependencies:** historical owner decisions, coverage labels, a roster known at planning time, and reliable coordinates. The current roster comes from routes actually held during the test week; jobs without usable ownership evidence can fall to the first roster entry. (`scripts/backtest-data.mjs:382–401`; `scripts/policies/week-solve.mjs:341–365`)

**Bad week:** the reported Luke-to-Cory coverage day teaches the policy that Cory owns customers Luke subsequently serves, producing 24 such mismatches in week two. Signing today’s map would establish future authority; it would not retrospectively validate historical ownership or eliminate legitimate coverage differences. (`stages/S5-week-solve.md:229–243`)

### 2. Five day-zones — useful geographic guidance, unjustified as a mandatory five-way partition

The implementation clusters historical **completed visits**, including repeat observations and coverage work, each time the policy runs. S4 instead describes monthly clustering of each owner’s book. The implementation then forces a one-to-one zone/weekday assignment using greedy bids, without workload balancing or road travel in the clustering objective. (`scripts/policies/week-solve.mjs:153–157`, `:238–256`, `:474–501`; `stages/S4-design.md:48`, `:74`)

**Silent dependencies:** geography representative of the current owned book, sufficient observations, road connectivity, and demand weights. Five weekdays do not imply five natural geographic clusters, and historical visit frequency is not automatically the correct future workload weight.

**Bad week:** a dense geographic block needs two service days, as reported for Robert’s Buckley area. A mandatory one-zone/one-day mapping can concentrate it on one day or penalize its necessary second day. Conversely, neighboring coordinates separated by a difficult road connection can appear inexpensive under haversine distance. The latter’s actual effect on these runs is **SUSPECTED** without a road matrix. (`stages/S3a-master-territory.md:151–153`; `scripts/policies/week-solve.mjs:238–256`, `:534–538`)

### 3. Due windows — the abstraction is sound; this implementation does not implement the stated policy

S4 derives state from the last visit’s findings. The implementation derives it from the previous **interval**: short gap means active, long gap means quiet, and one prior visit means assumed active. That confuses service delivery with service need. (`stages/S4-design.md:31–40`; `scripts/policies/week-solve.mjs:370–405`)

**Silent dependencies:** visit-linked findings, missing-note handling, the monthly calendar anchor, Quick Fix visit counts, and reconciliation with existing appointments.

**Constructed bad week:** a TMCP customer receives a visit after a 28-day gap and has a catch; this implementation labels the customer quiet and assigns another 26–35-day window because it never reads that catch. It also has no five-visit Quick Fix termination check, and a first visit sold for a fixed date receives a flexible fallback window. (`scripts/policies/week-solve.mjs:390–426`; `stages/S4-design.md:35–38`)

Expired windows are replaced with Monday or the whole week; windows opening after the week are replaced with Friday. Neither operation makes the assignment compliant with the original window. Multiple visits for the same job also receive the same anchor without a minimum-spacing constraint. (`scripts/policies/week-solve.mjs:383–456`, `:563–587`)

### 4. Cost function and weights — an uncalibrated tradeoff, not S4’s ordered priorities

The objective combines 30 units per squared overtime hour, one unit per kilometer to the assigned day’s medoid, one per weekday change, and two per additional weekday for already-overdue work. There is no demonstrated business valuation connecting those units. (`scripts/policies/week-solve.mjs:63–68`, `:554–562`)

It differs from S4 in two material ways: every placement pays distance to the **destination day’s** medoid, rather than the specified out-of-home-zone penalty; and ordinary window position has no continuing objective term after the initial urgency sort. (`stages/S4-design.md:48–50`; `scripts/policies/week-solve.mjs:534–568`)

**Silent dependencies:** acceptable overtime versus travel tradeoffs, stable medoids, and accurate marginal workload.

**Constructed bad week:** adding a 30-minute stop to an eight-hour day costs 7.5 capacity units; avoiding ten kilometers of medoid-distance penalty can therefore justify that overtime. That is the literal objective, although ten kilometers of summed radial distance need not represent ten kilometers of saved driving. Local search can also delay an urgent visit whenever its remaining item costs improve. (`scripts/policies/week-solve.mjs:554–575`, `:610–636`)

### 5. Hard wall — a stop-count ceiling, not a demonstrated shift limit

Each day’s limit is `floor(570 / historical cycle minutes)`, and every stop assigned there receives that day’s cycle time. Moving a geographically difficult stop to a historically fast weekday therefore makes it cheaper without changing the work itself. S4 calls for tech-by-geographic-zone measurements; the implementation uses tech-by-weekday measurements. (`scripts/policies/week-solve.mjs:460–497`, `:554–563`; `stages/S4-design.md:47`)

**Silent dependencies:** comparable route composition, service mix, shift boundaries, breaks, travel from and to home, and technician availability.

**Bad week:** the reported Cory Monday prices 36 stops at 8.4 hours under cycle time and 12.1 hours under travel plus service. Neither estimate is established as actual field time, but their disagreement invalidates treating the first as a reliable operational ceiling. (`stages/S5-week-solve.md:272–281`)

The policy also creates five available days for every rostered technician; it has no per-day absence or frozen-board input. Consequently, this Friday-only test says nothing about enforcing the live freeze. (`scripts/policies/week-solve.mjs:261–267`, `:521–528`)

### 6. Overflow — necessary reporting, incomplete diagnosis and resolution

Reporting unplaced work is appropriate. Calling it infeasible requires more than this greedy search: unplaced visits carry no objective penalty, and moves that increase the placement cost are rejected even when they could open space for overflow. (`scripts/policies/week-solve.mjs:565–599`, `:610–685`)

**Constructed counterexample:** suppose each weekday has one remaining slot; A can use Monday–Wednesday and prefers Tuesday, while four other visits can use Tuesday–Friday. Greedy placement puts A on Tuesday and drops one other visit. Moving A to Monday would fit everyone, but the search rejects that move if it increases A’s cost. This is an algorithmic failure case, not evidence that it caused the reported drops.

**Silent dependencies:** an exact feasibility check, approved substitute technicians, compatible windows, and the travel/service cost of transferring work.

The reported 16 and four overflows may be structural under the policy’s own count model, but Cory’s aggregate spare stop capacity does not prove he can absorb them on the required dates or at their locations. No float assignment is produced. (`stages/S5-week-solve.md:259–270`; `scripts/policies/week-solve.mjs:689–726`)

### 7. Add-queue — reasonable operating scope, unsafe admission rule, untested

S4’s queue selects an unfrozen owner day with capacity and otherwise defers to next week. It does not explicitly require the chosen date to satisfy the service window or define escalation when deferral would violate it. Its “tell the customer at intake” response applies to new sales, not existing follow-up obligations generated by notes. (`stages/S4-design.md:54`)

**Silent dependencies:** chronological event capture, deduplication, reserved capacity, customer commitments, current approved state, and a cross-week backlog.

**Bad week:** an active customer must be served by Friday, but the owner’s remaining eligible days are full; automatic deferral to next week violates the window instead of invoking coverage or an explicit exception. There is also a specification conflict: the queue may defer to next week, while its standing writer is restricted to the current week. (`stages/S4-design.md:49`, `:54`, `:67`)

There is no add-queue replay in the supplied code: late bookings are counted, excluded, and assigned an always-passing advisory gate. (`scripts/backtest-data.mjs:268–274`; `scripts/backtest.mjs:529–534`)

## C. The backtest

**This is a retrospective board-redistribution test, not a fair end-to-end test of S4.**

### As-of-Friday reconstruction and leakage

1. **The demand universe contains future knowledge.** Candidates are visits whose final scheduled date or eventual completion falls in the test week. A genuinely due customer with no such visit is invisible. A visit moved out after Friday can disappear, and a visit completed before planning can remain a candidate through its scheduled date. (`scripts/backtest-data.mjs:244–274`; `stages/S5-harness.md:272`)

2. **Creation time does not establish historical state.** Filtering `createdAt` cannot reconstruct earlier dates, assignments, cancellations, products, or commitments. Missing or invalid creation timestamps are accepted into the known set. The asserted 0.4% bound measures plan-versus-completion day differences, not all changes between Friday and execution. (`scripts/backtest-data.mjs:268–274`; `stages/S5-harness.md:80–85`; `stages/S2-plan-vs-actual.md:28–31`)

3. **The cutoff differs from the design.** S4 solves Friday at noon; the harness uses 14:00. `dominant-routeday` can additionally consume Friday-afternoon and weekend completions because its history ends Monday. `week-solve` recuts visit history, but its cycle-time loader still consumes complete Friday route-day summaries. (`stages/S4-design.md:44`; `scripts/backtest-data.mjs:108–121`, `:361–378`; `scripts/policies/dominant-routeday.mjs:69–83`; `scripts/policies/week-solve.mjs:132–137`, `:269–279`)

4. **Other inputs use test-period or later information.** Coordinates and service durations come from the test week’s OptimoRoute routes; fallback service uses the actual technician; roster membership comes from held routes; current job records supply products. The travel model has no training cutoff. Actual post-cutoff product or coordinate changes affecting individual results are **SUSPECTED**, because the raw records are absent. (`scripts/backtest-data.mjs:225–230`, `:258–266`, `:331–401`; `scripts/travel.mjs:25–35`)

5. **The oracle restriction is a convention.** Every policy receives the entire snapshot, including actual assignments, completion stamps, and held routes; `usesOracle` is not enforced by an input boundary. This does not establish that the current policy reads `actual`, but it makes future leakage easy. (`scripts/backtest-data.mjs:404–420`; `scripts/backtest.mjs:814–824`)

The reported 9% late-created share is also not necessarily 9% unpredictable demand: an existing customer’s follow-up may be knowable before someone creates its visit record. The test measures record creation, not first knowledge of the obligation. (`stages/S5-harness.md:224–227`; `scripts/backtest-data.mjs:268–274`)

### Join and “actual” reference

The composite job number plus decoded visit ID is a defensible identity key, and the reported spot checks support it. But the implementation does not assert uniqueness or validate the decoded entity; `Map.set` silently overwrites duplicate keys. (`scripts/backtest-data.mjs:126–133`, `:244–246`; `stages/S5-harness.md:98–103`)

S2’s unmatched **completions** and S5’s unmatched **Jobber visit records** are different populations. Neither alone establishes that an order never completed or that its CRM record never existed. Keep unmatched, canceled, uncompleted, and missing-from-extract cases separate. (`stages/S2-plan-vs-actual.md:13–18`; `stages/S5-harness.md:105–107`)

The actual board also substitutes scheduled intentions for execution:

- A visit held Thursday but completed the following Monday is labeled Thursday because the held-route fallback precedes the off-week completion.
- A never-completed visit can receive an “actual” assignment from its schedule.
- Unrouted completed stops are appended after all routed stops, rather than merged into a verified execution sequence.  
  (`scripts/backtest-data.mjs:299–322`; `scripts/backtest.mjs:225–245`)

Thus the reference is partly execution, partly planning, and partly a constructed sequence.

### S4’s gates are not the implemented gates

| Requirement | What the scorer actually does |
|---|---|
| Same day is reported only | Retains same-day ≥95% as a hard gate. (`stages/S4-design.md:87`; `scripts/backtest.mjs:477`) |
| Every visit stays inside its original window | Makes the policy’s replacement dates binding and original-window compliance advisory. (`scripts/backtest.mjs:496–507`) |
| Independently validate demand windows | Accepts windows from the proposing policy and skips assignments without a supplied window. (`scripts/backtest.mjs:359–369`) |
| Enforce the operational wall | Reports cycle-time compliance through policy notes; modeled travel-plus-service violations are advisory. (`scripts/policies/week-solve.mjs:758–762`; `scripts/backtest.mjs:509–514`) |
| Compactness is an acceptance requirement | Makes it advisory and compares complete route-day totals, often with different stop sets. (`scripts/backtest.mjs:256–309`, `:515–520`) |
| Validate every placement | Counts duplicate, off-week, and off-roster placements without corresponding hard gates. (`scripts/backtest.mjs:110–126`, `:475–492`, `:538–548`) |

Agreement and window percentages exclude dropped visits, while hours comparisons exclude route-days present on only one board. The separate drop gate catches some consequences, but the headline percentages still describe selected subsets. (`scripts/backtest.mjs:136–145`, `:367–369`, `:404–407`)

S4’s requirements themselves need revision: forcing each day within ±10% of the historically imbalanced day conflicts with deliberately redistributing work. Prediction accuracy, service compliance, and improvement in workload distribution are separate tests. Likewise, a symmetric ±5% compactness band penalizes a legitimate improvement greater than 5%. (`stages/S4-design.md:85–87`; `stages/S5-harness.md:181–185`)

### The sequencer comparison does not establish savings

The 11.7% figure describes coverage of candidate within-day pairs. The 42.6% estimated share describes legs actually selected by the local sequencer; OptimoRoute’s selected order needs only 7.3% estimated legs. These are different denominators, and the imbalance matters. (`stages/S1-travel-model.md:25–29`; `stages/S5-harness.md:240–246`)

More fundamentally:

- The “observed” pair values come from **OptimoRoute history**, not FleetSharp measurements of driving. Reproducing them validates reconstruction of the planner’s estimates. (`scripts/travel.mjs:11–15`)
- The 1.73% self-test uses travel **plus identical service minutes** in its denominator; service cancels from the error numerator and dilutes the percentage. It is not 1.73% drive-time accuracy. (`scripts/travel.mjs:187–207`)
- The self-test replays the source routes, while optimization deliberately selects favorable estimated edges. Error cancellation on those original routes does not establish cancellation on optimized routes. (`stages/S1-travel-model.md:49–65`; `scripts/sequence.mjs:140–155`)

The uniform-estimator control removes unequal lookup treatment but remains evaluation on the model influencing optimization. Its 8–10% result is **not a conservative bound on real savings**. An independent road-time matrix and held-out field measurements are necessary. (`stages/S5-harness.md:248–258`)

### What the scores support, and what is missing

The reported scores support rejecting this prototype as ready: 16/four drops, 87.5%/89.2% tech agreement, and only 9/24 and 4/24 board-only hours passes. They do not establish that flexible weekdays are wrong, that P2 fits, or that the float resolves the week. (`stages/S5-week-solve.md:81–95`, `:104–118`)

The quiet branch is particularly untested **by construction**: the available history before either golden week is too short to observe its required 20-day gap. Zero quiet classifications are not evidence that all customers were active, and the resemblance between 82 clamped windows and a separately measured 15% overdue rate is not independent validation. (`scripts/policies/week-solve.mjs:80`, `:397–399`; `stages/S3b-cadence-capacity.md:11`; `stages/S5-week-solve.md:136–158`, `:245–257`)

Before an operational shadow comparison, require a chronological event replay covering monthly transitions, with immutable planning inputs, full-book obligation generation, and no future observations entering decisions. Include constructed cases for coverage versus handover, missed visits, quiet-to-active transitions, Quick Fix termination, cross-week carryover, late notes, absences, and arrivals around the exact freeze boundary. Validate the proposed board independently.

For integration, require a dry-run state-transition test across Jobber and OptimoRoute: retries, concurrent edits, partial failures, and recovery before arrival texts. **SUSPECTED:** the writer’s actual safety properties cannot be verified; the bundle supplies requirements, not its implementation. (`stages/S4-design.md:52–67`)

## D. Cadence policy P2 and capacity

**The displayed arithmetic is consistent; the operational conclusion is not established.** Adding P2’s displayed rows gives 199.4 hours, 11 days over eight hours, and nine over nine hours. That leaves **36 minutes, or 0.3%, of nominal weekly capacity**—far below the document’s own roughly 10% modeling uncertainty. (`stages/S3b-cadence-capacity.md:207–240`, `:259–262`)

The same rows price Alias’s work at **50.5 hours** and Cory’s at **32.8 hours**. Alias’s existing mix exceeds five 9.5-hour days; it needs actual travel improvement or transferred work. Merely assigning those stops a faster weekday’s historical cycle rate does not demonstrate either. (`stages/S3b-cadence-capacity.md:207–216`; `scripts/policies/week-solve.mjs:554–563`)

### Defects in the evidence supporting cadence

**High — “delivered gaps” can start at an uncompleted visit.** The script computes intervals between all scheduled visits, then selects intervals whose ending visit is complete. Constructed example: completed August 17, skipped August 24, completed August 31 becomes a seven-day delivered interval instead of fourteen. Dates also come from `startAt`, not completion timestamps. The number of affected records is **SUSPECTED** without the raw data. (`scripts/derive-cadence.mjs:93–104`, `:113–138`)

**High — a subsequent note is treated as delivered service.** The note analysis uses note creation dates and accepts the next note as evidence of a return visit without linking it to a completed visit. Administrative notes or delayed entry can therefore manufacture delivered intervals; their prevalence here is **SUSPECTED**. (`scripts/derive-cadence.mjs:227–250`)

**High — the parser can classify a miss as quiet.** A constructed note containing `2 misses N/A` does not match the miss expression, which recognizes forms such as `miss` and `missed`, while the activity expression recognizes N/A; the resulting trigger is quiet. This weakens the per-visit evidence before it ever reaches a scheduler. (`scripts/derive-cadence.mjs:211–215`, `:71–78`)

**Material — Quick Fix’s reported delivered series length includes future appointments.** `visitsPerJob` uses all visits in the window; the “clean” cohort only requires a sufficiently recent start and does not require five completed weeks of observation. A five-appointment template is not proof of five delivered visits. (`scripts/derive-cadence.mjs:260–277`; `stages/S3b-cadence-capacity.md:92–99`)

**Material — overdue counts can miss the longest-neglected work.** An old uncompleted appointment on or before the assessment date can suppress `hardOverdue`, and a job without future work whose last completion exceeds 45 days is excluded from the active population. The metric therefore cannot establish that all seriously neglected demand has been counted. (`scripts/derive-cadence.mjs:116–117`, `:150–154`)

### Why cycle time is not a reliable capacity model yet

S3b uses the **ratio of median span to median stops**; `week-solve` uses the **median of individual span/stop ratios**. These are different estimators. The latter has only 25 and 49 route-day observations across the fleet before the two tests, not eight weeks of zone-specific evidence. (`scripts/demand-model.mjs:37–40`; `scripts/policies/week-solve.mjs:132–146`; `stages/S5-week-solve.md:37–40`)

Both conflate service, geography, route composition, and timestamp behavior. The source itself documents evening administrative stamps and warns that cycle time does not scale linearly with route volume. **SUSPECTED:** whether the consumed `span` consistently clips late stamps, includes first-stop service, or accounts for travel and breaks; the span-producing implementation is absent. (`stages/S2-plan-vs-actual.md:163–182`; `scripts/demand-model.mjs:263–268`)

The “observed 615 stops/207.9 hours” baseline is a sum of route-day medians, not a measured complete week. P2 then applies one current state per job as a persistent weekly rate, treats missing findings as quiet, and omits Quick Fix endings, new sales, churn, and state transitions. Matching these aggregate totals cannot identify the correct cadence policy. (`scripts/demand-model.mjs:128–131`, `:155–175`, `:207–220`, `:263–267`)

### What FleetSharp changes

FleetSharp can separate travel from property dwell and expose completion-entry delays. It does not automatically identify service duration: observations still need matching to the correct driver, property, and visit, including coverage days and colocated customers. The necessary replacement is a measured route-hours model with service mix, road travel, defined shift boundaries, and uncertainty—not simply GPS-derived span divided by stops. (`stages/S4-design.md:65`, `:73`; `stages/S2-plan-vs-actual.md:128–135`; `stages/S1-travel-model.md:69–75`)

Whether corrected hours rise or fall is **SUSPECTED**. The bundle does not justify choosing the cheaper model.

### Is a float technician sound?

Yes, as an explicit coverage role with protected capacity and a permanent owner separate from the executing technician. The evidence establishes that Cory covered a route; it does not establish a generally light book or transferable productivity. His ten STABLE customers are ten customers stable on **both tech and weekday**, within a reported 223-job book. (`stages/S2-plan-vs-actual.md:58–60`; `stages/S3a-master-territory.md:51–70`)

Cory’s dense-route cycle time cannot be carried unchanged onto Alias’s or Luke’s geography. Structural weekly transfers also consume the reserve needed for absences and late work. Late-created visits may already be represented in P2’s steady-state demand, so do not blindly add another 9%; instead reserve capacity where and when uncertain work arrives. (`stages/S3a-master-territory.md:136–137`, `:342–344`; `stages/S5-week-solve.md:259–270`; `scripts/demand-model.mjs:263–268`)

## E. What I would build first, and refuse to build

1. **Repair the measurement primitives — high value, low effort:** completed-to-completed gaps, visit-linked notes, completed-only hold statistics, and completed Quick Fix counts must replace the contaminated evidence before further policy tuning. (`scripts/derive-cadence.mjs:113–138`, `:227–292`)

2. **Capture immutable planning snapshots and event history — high value, medium effort:** historical dates, ownership, findings, availability, and commitments must be reconstructible at the actual planning cutoff. (`stages/S5-harness.md:80–85`; `scripts/backtest-data.mjs:244–274`)

3. **Create a reviewed ownership register with separate coverage assignments — high value, low-to-medium effort:** a substitute’s completed route must never silently become a permanent handover. (`stages/S4-design.md:25–27`; `stages/S5-week-solve.md:229–243`)

4. **Build the service-obligation ledger — high value, medium effort:** it must generate unscheduled demand, preserve original windows, reconcile recurring appointments, terminate Quick Fix series, and expose unknown state and overdue exceptions. (`stages/S4-design.md:29–40`; `scripts/backtest-data.mjs:248–253`)

5. **Calibrate route hours with GPS and independent road times — high value, medium effort:** the existing capacity models disagree too substantially to enforce a meaningful hard wall or transfer workload confidently. (`stages/S5-week-solve.md:272–281`)

6. **Build an exact feasibility reference and chronological replay — high value, medium effort:** prove placement under the current constraints, then test additions, frozen days, coverage, and backlog instead of accepting greedy overflow as infeasibility. (`scripts/policies/week-solve.mjs:565–685`; `scripts/backtest.mjs:529–534`)

7. **Keep the old identity and writer-safety requirements — high value, low effort:** retain stable visit keys, UPDATE/CREATE semantics, approval snapshots, ledgers, and verification, while treating reuse of absent writer code as **SUSPECTED** until separately audited. (`scripts/backtest-data.mjs:126–133`; `stages/S4-design.md:52`, `:67`)

8. **Refuse bulk recurrence rewrites, autonomous live add-queue writes, and a replacement production sequencer at this stage**, because demand correctness, operational capacity, recovery behavior, and sequencing gains remain unproven. (`stages/S4-design.md:25`, `:54`; `stages/S5-week-solve.md:214–225`; `stages/S5-harness.md:253–258`)

## F. Questions only the owner can answer

1. Which existing customer weekday or access commitments must remain hard constraints, because treating them as preferences could break promises the historical data does not record? (`stages/S4-design.md:50`, `:94`)

2. Which job/property ownership assignments and dated handovers are authoritative, because completion history cannot distinguish permanent ownership from temporary coverage? (`stages/S4-design.md:25`; `stages/S5-week-solve.md:229–243`)

3. When eligible work exceeds capacity, what is the priority order among approved coverage, overtime within the limit, and explicitly deferred service, because the current owner-only, window, and wall constraints can conflict? (`stages/S4-design.md:46–49`)

4. What nonroute duties and protected reserve must Cory retain as the float, because his entire apparent spare capacity cannot simultaneously cover structural overflow, absences, and late work? (`stages/S4-design.md:27`; `stages/S5-week-solve.md:259–270`)

5. What exactly counts toward the daily hard wall—travel from and to home, breaks, service, and administration—because the current capacity measures use different boundaries? (`stages/S4-design.md:47`; `scripts/sequence.mjs:78–81`)

6. When active TMCP becomes quiet, does monthly service retain its original ordinal weekday or reset from the quiet visit, including months without that fifth weekday, because the next obligation cannot be calculated consistently until that calendar rule is explicit? (`stages/S4-design.md:35–40`, `:94`)
