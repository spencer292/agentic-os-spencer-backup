# S6 — Verification of the Codex review against the tree

Read-only audit of every code-level claim in sections B, C and D of
`stages/S6-codex-RAW.md`. Codex (gpt-6-astra) had no file access and cited line
numbers from `stages/S6-codex-bundle.md`. Its `file:line` references map directly
onto the real files; the two exceptions are noted in the table.

Every claim below was checked by reading the cited lines. Where Codex marked a
data effect **SUSPECTED**, it was measured against the raw extract and the
measured result is given.

Verified 2026-09-19. Nothing was changed.

---

## Verdict counts

| | B | C | D | total |
|---|---:|---:|---:|---:|
| CONFIRMED (mechanism and effect) | 6 | 10 | 5 | 21 |
| CONFIRMED mechanism, effect measured NEGLIGIBLE | 1 | 4 | 2 | 7 |
| PARTIAL (one half wrong) | 1 | 2 | 1 | 4 |
| REFUTED | 0 | 0 | 0 | 0 |

No claim in B, C or D is factually wrong about the code, and only one sub-claim
is wrong outright (the weekend half of C3). Three are wrong about the size of
the effect, and those three are the ones that matter, because two of them were
rated **High** by Codex and one turns out to be far worse than Codex could see.

Sections C and D were each additionally read end to end by an independent
verifier working from the same claim list without access to this analysis. Both
reached the same verdict on every mechanism. Their two disagreements with the
first pass are resolved in the table and noted at the end.

---

## B — the week-solve policy

| ID | Claim | Verdict | Lines read | What it means for the numbers |
|---|---|---|---|---|
| B1 | Owner map rebuilt every run from majority + recency; no persisted owner, no coverage/ownership split, no sustained-handover logic; jobs without evidence fall to the first roster entry | **CONFIRMED** | `week-solve.mjs:315-338` (majority + recency), `:341-366` (neighbour vote), `:347` (`ownerOf.set(jn, roster[0])`), vs `derive-master.mjs:165-189` (single-change-point, sustained ≥2 visits, tally restricted to the post-handover segment) | The roster floor never fired (0 jobs in both weeks), so the "first roster entry" worry is theoretical here. The recency tie-break is not: 34 jobs (wk1) and 100 jobs (wk2) show more than one tech in pre-cutoff history, and the tie-break awards every one of them to the *later* tech. With only 8 and 14 days of history, one coverage day is the whole record. |
| B2 | Five day-zones cluster historical completed visits each run; one-to-one zone/weekday forced by greedy bids; no workload balancing, no road travel in the objective | **CONFIRMED** | `:474-502` (k-medoids over `histByTech` completed stops, every call), `:238-257` (`zonesToWeekdays` greedy bids, `if (b.c === 0) ties += 1`), `:85-93` (haversine only) | Zones are re-derived from the same 8-14 days of history that everything else rests on, so a dense block that genuinely needs two days cannot get them. |
| B3 | Due windows come from the previous *interval*, not from the last visit's findings; one prior visit is assumed active; no Quick Fix five-visit termination; expired windows replaced with Monday or the whole week, early ones with Friday | **CONFIRMED** | `:394-405` (`gap <= 12` → active, `gap >= 20` → quiet, `gap == null` → `active-assumed`), `:390-393` (Quick Fix always `active-series`, no series-length check), `:431-445` (`allowed = [days[0]]` or `days.slice()` when overdue; `[days[4]]` when early) | This is the claim that combines with **NEW-1** below to invalidate the window tier table. |
| B4 | Objective is 30 per squared overtime hour, 1 per km to the **destination day's** medoid, 1 per weekday change, 2 per weekday of further delay for overdue work; no continuing window-position term; the tradeoff is uncalibrated | **PARTIAL** | `:63-68` (weights), `:554-562` (`capCost`, `itemCost`) | Every mechanism is exactly as described. The worked example is off: adding a 30-minute stop to an 8.0 h day costs `30 × 0.5² = 7.5` units, so it buys **7.5 km** of medoid distance, not ten. Direction and order of magnitude stand. |
| B5 | The wall is a stop-count ceiling `floor(570 / cycle)`; every stop on a day is priced at that day's cycle time; tech×**weekday** rather than tech×zone; five days available for every tech with no absence input | **CONFIRMED** | `:497` (`capStops = max(1, floor((9.5*60)/cycle))`), `:554` (`dayHours = n * cycleMin / 60`), `:461-462` (`cycleFor(tech, dow)`), `:525-529` (all five days built for every rostered tech) | Moving a hard stop to a historically fast weekday makes it cheaper without changing the work. There is no frozen-board or absence input, so the Friday-only test says nothing about the live freeze. |
| B6 | Overflow is not a diagnosis: unplaced visits carry no objective penalty, and cost-increasing moves are rejected even when they would open space | **CONFIRMED** | `:590-598` (`totalCost` sums capacity plus **placed** items only), `:625` (`if (-delta > bestGain)`), `:663-686` (reinsertion only opportunistic, after a move happens to free a slot) | The 16 and 4 drops are an upper bound on what this greedy search could place, not a proven infeasibility. |
| B7 | No add-queue replay exists; late bookings are counted, excluded, and given an always-passing advisory gate | **CONFIRMED** | `backtest-data.mjs:268-274` (late bookings split out of `due`), `backtest.mjs:529-534` (`pass: true`, hard-coded) | 55 and 54 visits per week, 9.1% and 9.2% of candidates, are removed from the test and never re-introduced. |

---

## C — the backtest

| ID | Claim | Verdict | Lines read | Measured effect |
|---|---|---|---|---|
| C1 | The demand universe contains future knowledge: candidates are visits whose final scheduled date **or eventual completion** falls in the week | **CONFIRMED mechanism, effect negligible** | `backtest-data.mjs:249-253` (`if (daySet.has(sd) \|\| (cd && daySet.has(cd)))`) | **1 visit** in wk1 and **0** in wk2 entered only via the completion clause. The structural half of the claim stands and cannot be measured: a customer genuinely due with no visit record is invisible by construction. |
| C2 | Missing or invalid `createdAt` is accepted into the known set | **CONFIRMED mechanism, effect zero** | `:268-274` — `Number.isFinite(created) && created > cutoffMs` is the *only* exclusion. Both bad-value paths admit: `undefined` gives `NaN`, fails `isFinite`, falls to `else`; `null` gives **0**, which is finite and below the cutoff, so it also falls to `else` | **0 candidates** in either week have an unparseable `createdAt`. Latent bug, no current contamination. |
| C3 | Cutoff is 14:00 not noon; `dominant-routeday` consumes Friday-afternoon **and weekend** completions because history ends Monday; `week-solve`'s cycle-time loader still consumes complete Friday route-days | **PARTIAL — the weekend half is wrong** | `backtest-data.mjs:111-122` (14:00 PT), `:361-366` (history cut at `d >= week`, no createdAt or cutoff filter), `dominant-routeday.mjs:74` (`if (!WEEKDAYS.includes(h.dow)) continue; // ignore stray weekend stamps`), `week-solve.mjs:274-279` (re-cuts on the completion instant), `week-solve.mjs:132` (`r.day < week`) | **24 (wk1) and 28 (wk2)** history rows were completed after Friday 14:00 but before Monday. Split: **23 and 28 are Friday**, only **1 and 0 are weekend** — and `dominant-routeday` drops weekend rows explicitly at line 74, keeping 724 of 725 and 1,328 of 1,329. So the Friday-afternoon leak is real and reaches `dominant-routeday`; the weekend leak does not exist. `week-solve` re-cuts both out of its owner map but still consumes the whole Friday route-day in its cycle times. |
| C4 | Coordinates and service durations come from the test week's OptimoRoute routes; the service fallback uses the **actual** technician; the roster comes from held routes; the travel model has no training cutoff | **CONFIRMED, and this is the largest real leak** | `backtest-data.mjs:220-241` (`orCoord`/`orService` built over the test-week days), `:261-267` (OR coordinate overwrites the Jobber one), `:356-358` (`const a = actual.get(rec.key); const t = a?.tech;`), `:383` (roster from held routes), `travel.mjs:11-12` | **551/552 = 99.8%** (wk1) and **525/532 = 98.7%** (wk2) of due records take their coordinate from inside the test week. Those coordinates then drive the k-medoid zones, the compactness cost, and the neighbour-vote owner for **125 (wk1) and 47 (wk2)** jobs. Property coordinates are near-static so the positional error is small, but the service-minute fallback keyed on the actual technician is a direct oracle read. |
| C5 | Every policy receives the whole snapshot including `actual`, `stamps`, `optimoHeld` and `heldRouteDays`; `usesOracle` is not enforced by an input boundary | **CONFIRMED** | `backtest-data.mjs:404-421` (the returned object), `week-solve.mjs:56` (`usesOracle = false`, a declaration only) | `week-solve` does read `snap.stamps` (`:275`) — legitimately, to re-cut history — which proves nothing stops it reading `snap.actual` next. |
| C-join | The composite key does not assert uniqueness; `Map.set` silently overwrites duplicates | **CONFIRMED mechanism, effect zero** | `backtest-data.mjs:131-133`, `:245-246` | **0 duplicate keys** across all 4,290 visits. Latent. |
| C-actual (a) | A visit held Thursday but completed the following Monday is labelled Thursday, because the held-route fallback precedes the off-week completion | **CONFIRMED mechanism, effect ≤2 rows** | `backtest-data.mjs:299-309` (stamp-in-week, then `optimo-held`), `:310-319` (`stamp-offweek` third) | Source mix wk1: `stamp` 604, `optimo-held` 2, `schedule` 1. Wk2: `stamp` 583, `stamp-offweek` 1, `optimo-held` 1, `schedule` 1. |
| C-actual (b) | A never-completed visit can receive an "actual" assignment from its schedule | **CONFIRMED mechanism, effect 1 row per week** | `:320-322` (`source: 'schedule'`) | 1 row in each week. |
| C-actual (c) | Unrouted completed stops are appended after all routed stops rather than merged into a verified sequence | **CONFIRMED** | `backtest.mjs:222-234` assigns a sort rank of `held.seq` (a small integer) to a routed stop, `10000 + minutes` to a completion stamp, `20000 + minutes` to a bare schedule; `:245` sorts ascending | The bands cannot interleave by construction, so every routed stop precedes every unrouted one whatever time it actually ran. Affects the sequence comparison on days with unrouted completions, not the board agreement. |
| C-gates 1 | S4 says same-day is reported only; the scorer keeps same-day ≥95% as a **hard** gate | **CONFIRMED** | `backtest.mjs:477` — no `advisory` flag, unlike `:487`, `:506`, `:513`, `:519`, `:526`, `:533` | week-solve's 72.8% and 47.7% same-day are scored as failures of a gate the design does not ask for. |
| C-gates 2 | The policy's own replacement dates are binding; original-window compliance is advisory | **CONFIRMED** | `backtest.mjs:496-501` (clamped = hard), `:502-507` (`advisory: true` on the raw window) | The headline "100% inside the due window" is compliance with `allowed`, which the policy itself rewrote at `week-solve.mjs:431-445`. The honest figures are the advisory ones: **98.3% and 84.5%**. |
| C-gates 3 | Windows are accepted from the proposing policy, and assignments with no window are skipped | **CONFIRMED** | `backtest.mjs:359` (`proposal.windows`), `:368-369` (`if (!w) continue;` before `n += 1`) | No independent validation of demand windows anywhere in the harness. |
| C-gates 4 | Cycle-time compliance is reported through policy notes; modelled travel+service violations are advisory | **CONFIRMED** | `week-solve.mjs:758-763` (`capacityAtCycleTime` self-reported), `backtest.mjs:509-514` (`advisory: true`) | "0/25 route-days over 9.5 h" is the policy grading its own model; the independent model says 3/25 and 6/25. |
| C-gates 5 | Compactness is advisory and compares complete route-day totals with different stop sets | **CONFIRMED** | `backtest.mjs:515-520` | S5 already states the gate is unpassable: `keep-actual`, the oracle board, scores 13/24 and 14/25. |
| C-gates 6 | Duplicate, off-week and off-roster placements are counted without corresponding hard gates | **CONFIRMED** | `backtest.mjs:107-127` (collected), `:475-492` (gates list has dropped / invented / weekend only), `:544`, `:547` (duplicates and offWeekPlacements reported in `coverage` only) | An off-roster placement would not fail the run. |
| C-gates 7 | Agreement and window percentages exclude dropped visits; hours comparisons exclude route-days present on only one board | **CONFIRMED** | `backtest.mjs:136-146` (iterates `proposed`), `:367-369`, `:404-407` (`bothDays` filtered on `hoursRatio != null`) | week-solve's 87.5% / 89.2% tech agreement is computed over 536 and 528 placed visits, not the 552 and 532 due. |
| C-seq (a) | The "observed" pair values come from OptimoRoute history, not FleetSharp measurement | **CONFIRMED** | `travel.mjs:11-12` — "Observed place pairs come straight from the OptimoRoute history" | Reproducing them validates reconstruction of the planner's own estimates. |
| C-seq (b) | The 1.73% self-test uses travel **plus identical service minutes** in its denominator, so service cancels from the numerator and dilutes the result | **CONFIRMED, and measured** | `travel.mjs:190-194` (`actualMin = actualTravelSec/60 + actualService`), `:196-207` (`routeTime` gets the same `serviceDurationMin`, then `errPct = |errMin| / actualMin`) | Service is **72.5%** of the median route total. Recomputed on a travel-only denominator, estimator-only error is **6.21%, not 1.73%** — a 3.6× understatement. |
| C-seq (c) | The self-test replays the source routes while optimisation deliberately selects favourable estimated edges | **CONFIRMED** | `travel.mjs:178-204` (iterates the recorded routes in recorded order), `sequence.mjs:140-155` | Error cancellation on the original order is not evidence of cancellation on an optimised one. |
| C-addqueue | No add-queue replay; late bookings counted, excluded, always-passing advisory gate | **CONFIRMED** | `backtest-data.mjs:268-274`, `backtest.mjs:529-534` | See B7. |

---

## D — cadence policy P2 and capacity

| ID | Claim | Verdict | Lines read | Measured effect |
|---|---|---|---|---|
| D-header | P2's displayed rows sum to 199.4 h, 11 days over 8 h, 9 over 9 h — 36 minutes of slack against a nominal 200 h; Alias 50.5 h against Cory 32.8 h | **CONFIRMED** | Arithmetic re-run over `stages/S3b-cadence-capacity.md:207-240` | Re-added: 199.4 h; 11 days >8 h; 9 days >9 h; Alias 50.5; Cory 32.8. All exact. The 0.6 h margin sits far inside S3b's own stated ~10% error bar. |
| D-interval | (Codex: **High**) Intervals are computed between all scheduled visits, then filtered on the *ending* visit being complete, so a skipped visit halves the measured gap; dates come from `startAt`, not completion stamps | **CONFIRMED mechanism, effect REFUTED as material** | `derive-cadence.mjs:113` (`for (let i=1; i<vs.length; i++) vs[i].intervalFromPrev = diffDays(vs[i-1].date, vs[i].date)` — all visits), `:137` (`completed.map(v => v.intervalFromPrev)`), `:94` (`pacDate(v.startAt)`) | Measured over all 1,063 jobs: **1 of 1,403** TMCP delivered intervals starts at an uncompleted visit (0.1%), 1 of 1,925 across all products. **The delivered-gap median is 7 days with or without them; p25 7, p75 9, mean 9.15 either way.** The bug is real and should be fixed, but it moves no number in S3b. The reason it does not bite: of 118 past-dated incomplete visits, almost none sit *between* two completed ones. The `startAt` half of the claim stands and is unmeasured. |
| D-note | The note cross-check uses note **creation** dates and accepts the next note as evidence of a return visit without linking it to a completed visit | **CONFIRMED** | `derive-cadence.mjs:230-232` (sorted and dated by `createdAt`), `:235` (`kind = 'next note'`), `:245` (`DELIVERED = r => r.kind === 'next note' \|\| r.kind === 'next completed visit'`) | Administrative or back-dated note entry manufactures a "delivered" interval. This feeds `triggerDelivered` in `demand-model.mjs:134-135`, which is P0's fallback interval. |
| D-miss | (Codex: **High**) The parser classifies a miss as quiet: `2 misses N/A` misses the miss regex while the activity regex catches `N/A` | **CONFIRMED mechanism, effect REFUTED as material** | `derive-cadence.mjs:213` — `/(\d+)\s*miss(?:ed)?\s*(u\|t)?\b/i` then `/miss(?:ed\|sd\|sed)\s*(\d+)/i`; `:214` — `/\b([nlmh])\/?a\b/`; `:71-78` `triggerOf` | Codex's regex reasoning is exactly right. Tested: `"2 misses N/A"` → `{misses: null, activity: "None"}` → **quiet**, while `"2 missed N/A"` → `{misses: 2}` → **miss**. But **zero of the 192 notes in the sample use the plural "misses"**. Of 42 notes stating a positive miss count in prose, 40 parse correctly and the 2 that do not ("Missing 2") land on *Low* and *catch*, never quiet. The 43 miss-word notes that do read quiet all say "No mole **No miss**", which is correct. Latent, not live. |
| D-quickfix | (Codex: **Material**) The reported Quick Fix delivered series length includes **future appointments**; the clean cohort only needs a recent start, not five completed weeks | **CONFIRMED, and worse than stated** | `derive-cadence.mjs:264` (`lens = c.map(r => r.nVisitsInWindow)` — all visits), `:262` (`qfClean = qf.filter(r => r.jobStartAt >= WIN.from)`) | **112 of the 134 clean-cohort jobs (83.6%) carry at least one incomplete visit in that count.** Median visits per job is **5 counting scheduled, 3 counting completed**. 131 of 134 have ≥5 *scheduled*; only **31** have ≥5 *completed*. S3b's "Series length delivered: median 5 visits — the 5-week design holds" is not a delivered measurement. The window itself is the constraint: it opens 2026-08-14 and the assessment date is 2026-09-18, so a five-week series can only be fully observed for a job starting in the first days of the window. |
| D-overdue | An old uncompleted appointment dated on or before the assessment date suppresses `hardOverdue`; a job with no future work whose last completion is >45 days old is excluded from the active population | **CONFIRMED** | `derive-cadence.mjs:116-117` (`after = vs.filter(v => v.date > last.date)`, `nextVisit = after[0]` — completion not required), `:150-152` (`!nextVisit \|\| nextVisit.date > AS_OF`), `:154` (`activeJob = ... && (!!nextSched \|\| daysSinceLast <= 45)`) | The overdue metric cannot see the most neglected work, which is exactly the population it exists to count. |
| D-cycle | S3b uses the **ratio of medians**; `week-solve` uses the **median of individual ratios**; different estimators on thin evidence | **PARTIAL** | `demand-model.mjs:63-68` and `:238-239` (`medianSpanH * 60 / medianStops`) vs `week-solve.mjs:136-146` (`rows.push(r.span / r.stops)` then `median`). Codex cited `demand-model.mjs:37-40`; the real lines are 63-68 and 238-239 | Confirmed as two different estimators. Measured across all 113 route-days they barely diverge: median difference **−0.10 min/stop**, worst case −4.79 (Luke Tuesday), and the derived 9.5 h stop cap differs by at most 4 stops on 1 of 25 tech-days. The evidence-thinness half of the claim stands: `week-solve.mjs:132` filters to `r.day < week`, leaving only **25 and 49** route-days in the two runs, not 113. |
| D-holdstats | The 66.6% weekday-hold and 83.2% tech-hold figures count completed **and future scheduled** visits | **CONFIRMED** | `derive-cadence.mjs:286-292` — denominator is `r.nVisitsInWindow` and the numerator scans `r.visits`, neither filtered on `isComplete` | With 1,248 of 4,290 visits in the future and all of them incomplete, these are hold rates of the *schedule template*, not of field behaviour. |
| D-p2 | P2 applies one current state per job as a persistent weekly rate, treats missing findings as quiet, and omits Quick Fix endings, new sales, churn and transitions; the 615 stops / 207.9 h baseline is a sum of route-day medians, not a measured week | **CONFIRMED — and the script says so itself** | `demand-model.mjs:155-158` (`hot = moles>0 \|\| misses>0 \|\| (activity && activity !== 'None')`, else 30 — so an all-null state falls to quiet), `:173-175` (Quick Fix pinned to 7 days by override, no series end), `:246-249` (`stopsPerWeek` and `hoursPerWeek` are `reduce(... + r.medianStops)` and `+ r.medianSpanH` across route-days). The caveats block at `:297` and `:300` states the omission verbatim: "It does not model the Quick Fix series ending, new sales arriving, or churn" and "P1/P2/P3 classify each job by one observation, not by a steady-state probability of catching" | Codex presents this as a discovered defect; it is a documented limitation the script prints in its own output. S3b likewise labels the ~10% band as noise. The point that survives is the one Codex closes on: matching two aggregate totals cannot identify the right cadence policy. |

---

## New findings not in the Codex review

### NEW-1 — the quiet branch is not merely untested, it is arithmetically impossible

Codex called this **SUSPECTED** ("the available history before either golden week
is too short to observe its required 20-day gap"). It is measurable and it is
worse than that.

| | 2026-08-24 | 2026-08-31 |
|---|---|---|
| History span available before the cutoff | 2026-08-14 .. 2026-08-22 (8 days) | 2026-08-14 .. 2026-08-28 (14 days) |
| Jobs with ≥2 completed visits in that history | 86 | 467 |
| Largest gap physically observable anywhere in the data | 7 days | 14 days |
| `QUIET_GAP_MIN` required to classify a job quiet | 20 | 20 |
| `ACTIVE_GAP_MAX` required to classify a job active | 12 | 12 |

`week-solve.mjs:78-80` sets `QUIET_WINDOW = [26, 35]` behind `QUIET_GAP_MIN = 20`.
No two completed visits 20 days apart can exist in an 8- or 14-day window, so the
quiet branch **cannot fire**, in either week, for any job, under any data.

The consequence runs further than the zero. In week one the largest observable
gap is 7 days and `ACTIVE_GAP_MAX` is 12, so **every** job with two completed
visits is forced to `active-measured` by arithmetic. S5-week-solve states this
as a finding — "every single measured gap is 12 days or under… the office runs
one cadence" — and it is not a finding, it is the width of the history window.
In week two, where gaps up to 14 days are observable, exactly 1 job of 468
landed outside the active band.

The whole window-tier table therefore rests on a classifier that had no room to
disagree with itself. 48 + 237 `active-measured` and 250 + 119 `active-assumed`
windows are all `[+5, +9]` by construction.

### NEW-2 — the owner map's recency tie-break is doing real work

`week-solve.mjs:328` breaks ties on the most recent completion. Measured against
the pre-cutoff history: **34 jobs (wk1) and 100 jobs (wk2)** show more than one
technician. With 8-14 days of history most jobs have one or two completed
visits, so for those jobs "dominant tech" reduces to "whoever ran the last
visit". Re-running the same jobs under `derive-master.mjs`'s post-handover rule
flips **34 and 62** owners. Codex's "Luke-to-Cory coverage day teaches the policy
that Cory owns those customers" is visible in the data — jobs 7839, 7723 and
8272 are exactly that pattern.

### NEW-3 — the neighbour vote runs on test-week coordinates

The 10-nearest-neighbour owner vote (`week-solve.mjs:342-366`) reads `jobCoord`,
built at `:296-299` from `snap.due`, whose coordinates were overwritten with the
test week's OptimoRoute stop positions at `backtest-data.mjs:261-267`. **125
jobs (wk1) and 47 jobs (wk2)** got their owner from a vote over coordinates
observed inside the week being predicted.

---

## The three claims that move the S3b / S5 numbers most

**1. Quick Fix "delivered median 5 visits" is 3.** (D-quickfix, CONFIRMED.)
S3b section 3 reads "Series length delivered: median 5 visits… The 5-week design
holds." Counting only completed visits the median is **3**, and only 31 of 134
clean-cohort jobs have completed five. The 5-week template is confirmed; its
delivery is not observed in this window at all. Anything downstream that treats
"Quick Fix runs exactly as designed" as measured — including
`demand-model.mjs:173-175`, which pins Quick Fix to a 7-day interval under every
policy and so contributes to all four policy totals — is resting on the schedule,
not on the field.

**2. The travel self-test is 6.21% on drive time, not 1.73%.** (C-seq b,
CONFIRMED and measured.) S1's headline "whole-route error is 1.73%" is computed
with service minutes, which are 72.5% of a median route and cancel exactly from
the numerator, sitting in the denominator. On a travel-only denominator the
estimator-only error is **6.21%**. Every statement built on "the backtest can
trust day length" needs re-reading at that figure, including S5's 8-10%
uniform-estimator control, which is now the same order of magnitude as the
model's own error rather than comfortably above it.

**3. The window tier table measures the history window, not the book.** (NEW-1,
measured; Codex had it as SUSPECTED.) Zero quiet classifications is forced by
8 and 14 days of history against a 20-day threshold. In week one, 100%
`active-measured` is likewise forced. S5's reading — "no job in either week reads
as quiet… the office runs one cadence" — is not supported by this harness.
Neither is the pairing of 82 clamped-overdue windows in week two with S3b's
separately measured 15% overdue rate: with every job forced active on a `[+5,+9]`
window, an overdue clamp is close to automatic for anything last served more
than nine days before the Monday.

## Corrections to carry forward

| Figure as published | Corrected | Source |
|---|---|---|
| S3b: Quick Fix series length **delivered** median 5 | median 5 **scheduled**, median **3 completed**; 31/134 have completed ≥5 | measured over `data/jobber/visits.json` |
| S1: whole-route model error **1.73%** | **1.73%** of travel+service, **6.21%** of travel | re-run of `travel.mjs` self-test with a travel-only denominator |
| S5: window tiers, quiet-measured **0** | 0 is forced; the classifier cannot reach its own threshold | history spans 8 and 14 days vs `QUIET_GAP_MIN = 20` |
| S5: "100% inside the due window (clamped)" | the advisory raw-window figures, **98.3%** and **84.5%**, are the compliant ones | `backtest.mjs:496-507` |
| S3b: TMCP delivered gap median 7 | **unchanged at 7** — the Codex "High" interval defect touches 1 of 1,403 records | measured |
| S3b / notes: miss-as-quiet misclassification | **0 of 192** notes affected; the regex gap is real but unexercised | measured |
| S3b: weekday hold 66.6%, tech hold 83.2% | schedule-template hold, not delivered hold; 1,248 of 4,290 visits in the denominator are future and incomplete | `derive-cadence.mjs:286-292` |

---

## Where Codex's line references were wrong

Two of roughly sixty. `demand-model.mjs:37-40` was cited for the cycle-time
estimator; the real code is at `:65` and `:239`, with the per-tech median at
`:71-72` (lines 37-40 are the `master-asbuilt.json` load). Everything else in B,
C and D resolved to the code described.

## Disagreements between the two verification passes, resolved

Sections C and D were read twice, independently. Two conflicts arose and both
were settled by re-reading the files directly:

1. **C3, the weekend half.** The second pass found `dominant-routeday.mjs:74`,
   which the first pass had read but not credited. Re-checked and adopted: the
   line drops weekend rows explicitly, so Codex's weekend-leakage claim is
   wrong even though its Friday-afternoon claim holds. The table above is
   corrected to PARTIAL and carries the measured 23/1 and 28/0 split.
2. **D-cycle and D-p2 line numbers.** The second pass cited
   `demand-model.mjs:39-45` for the ratio-of-medians and `:129-131` for
   `intervalP2`. Re-read directly: line 39 is the closing brace of the
   `master-asbuilt` try/catch and 129-131 is a comment plus the
   `deliveredTmcp`/`deliveredQf` loads. The correct lines are `:65` and `:239`
   for the estimator and `:155-158` for `intervalP2`. The quoted code in both
   passes was identical and the verdicts agree; only the line numbers differed.

On every other claim in C and D the two passes agreed on mechanism, code quote
and verdict.
