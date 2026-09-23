# Codex routing review (RAW, untriaged) - 2026-09-18

Independent second-opinion review of the Jobber -> n8n -> OptimoRoute pipeline by OpenAI Codex CLI 0.155.0, model gpt-6-astra, reasoning effort xhigh, 187,631 tokens. Input: the brief in this folder plus a numbered bundle of the specs, core scripts, write gate, API clients, cron specs and live n8n exports (Codex had no shell access on this machine, so it reviewed inline source; failure cases are constructed, not executed). Triage against the real code follows in `2026-09-18_codex-routing-review.md`.

Run by Spencer / Claude, session 72deac38.

---

### A. Diagnosis in one page

**The pipeline does not implement one consistent scheduling contract.** Depending on which script runs, Jobber controls the day and technician, a territory file controls them, or OptimoRoute can change both. The owner’s current requirement is simpler: preserve approved service days and territory ownership, optimize each day’s sequence, and propose specific day moves only for approved overtime relief.

The top causes, ranked:

1. **DESIGN — competing scheduling authorities.** `push-week` creates orders without technician locks and allows ordinary visits to move across dates; `optimize-week` defaults to `ON_FORCE` balancing and can write the resulting technician and day back to Jobber. `jobber-to-optimo-sync` follows a different model, preserving Jobber’s day and technician. Those paths cannot safely substitute for one another. The extension chain selects the first, incompatible combination. [push-week.mjs:285](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:285), [optimize-week.mjs:199](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:199), [optimize-week.mjs:299](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:299), [extend-horizon.mjs:143](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:143).

2. **DEFECT — approval does not protect the approved state.** Writers can apply stale snapshots, cross the freeze, partially succeed, and report completion without verifying the result. Most seriously, `drift-check fix` can detect a deliberate Jobber day move, then reverse that same move when processing another booking on the old day. Holding a write grant does not prevent any of these errors. [drift-check.mjs:258](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/drift-check.mjs:258), [drift-check.mjs:412](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/drift-check.mjs:412), [optimize-week.mjs:335](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:335).

3. **DESIGN / DATA — the planning inputs describe conflicting businesses.** The September territory review reports only 60% agreement on owner and 52% on weekday between the map and actual work. That warrants adjudication, not automatic enforcement. Even the signed rules file still says per-tech rates are disabled, while the service-time configuration correctly contains the subsequently directed rates. Historical service days should inform proposals; neither a zip majority nor an old grid should automatically overturn an approved visit. [30-day review:25](C:/Agentic-os-got-moles/projects/briefs/route-engine/2026-09-17_30-day-route-territory-review-FERRY.md:25), [scheduling-rules.json:194](C:/Agentic-os-got-moles/projects/briefs/route-engine/rules/scheduling-rules.json:194), [tech-service-times.json:23](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/tech-service-times.json:23).

4. **OPERATIONAL — there is no reliable completion and recovery process.** The supplied ledger evidence establishes that the 332-write September plan was applied. Its continued occupation of `optimize-plan.json` is a bookkeeping stall. Standalone write-back never marks that plan complete; extension treats a different saved window as pending indefinitely. Replaying it now could overwrite later September 17 work. Disabled routing crons and revoked authority are intentional controls, not defects to bypass. [optimize-week.mjs:396](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:396), [extend-horizon.mjs:122](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:122), [write-authority.json:21](C:/Agentic-os-got-moles/projects/briefs/route-engine/write-authority.json:21).

5. **DESIGN / DEFECT — “planned” is mistaken for “usable.”** One routed stop makes a day count as planned; unrouted visits and ghosts can remain advisory; the rebalance “ceiling” only prints a warning. None establishes that every required customer is covered, approved days are preserved, or each technician’s first-job-to-last-job hours are acceptable. [extend-horizon.mjs:89](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:89), [rebalance-week.mjs:484](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:484), [rebalance-week.mjs:530](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:530).

**n8n is dead weight in the current routing operation.** Your supplied execution facts place it outside the loop, and the exports confirm inactivity. The weekly parent still references the v1 child, not the two v2 workflows. Re-enabling it would restore another obsolete implementation. Archive the routing workflows and finish one supervised local path. [WF-1 export:5](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/YxKaiU1IAAmMkDLh.json:5), [WF-2 export:5](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/QEKz72NTP8YRZsUS.json:5), [parent export:108](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/XLhh2TB89NwSlBRX.json:108).

### B. Concrete defects — the code

“CONFIRMED” below means traced through the supplied source. The examples are constructed counterexamples, not executed tests.

**B01 — BLOCKER — CONFIRMED: drift repair reverses a known manual day move.**

- **Evidence:** Day drift is recorded, but the repair locks existing orders to their **OptimoRoute** dates. Its write-back then joins against all active Jobber visits and writes the route’s date, without excluding recorded day drift. [drift-check.mjs:258](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/drift-check.mjs:258), [drift-check.mjs:367](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/drift-check.mjs:367), [drift-check.mjs:412](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/drift-check.mjs:412).
- **Failure:** Spencer moves visit A from Tuesday to Wednesday in Jobber. OR still has Tuesday. A new Tuesday booking triggers a repair. A remains Tuesday in OR, passes verification against the old OR route, and gets written back to Tuesday in Jobber.
- **Fix:** Keep `fix` retired. For a replacement, reconcile every affected order to the approved Jobber date before planning; exclude conflicts from write-back. Verification must compare against the approved Jobber snapshot, not the previous OR route.

**B02 — BLOCKER — CONFIRMED: freeze enforcement is missing or evaluated too early.**

- **Evidence:** `rebalance-week` and `write-times-from-plan` write without a freeze check. `assign-by-territory` likewise changes assignees without one. `optimize-week` filters the batch once using only the **destination** date; `write-optimo-times` checks once per day. `replan-day` only rejects today/past. [rebalance-week.mjs:557](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:557), [write-times-from-plan.mjs:69](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/write-times-from-plan.mjs:69), [assign-by-territory.mjs:244](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/assign-by-territory.mjs:244), [optimize-week.mjs:363](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:363), [write-optimo-times.mjs:83](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/write-optimo-times.mjs:83), [replan-day.mjs:43](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/replan-day.mjs:43).
- **Failure:** A batch starting at 13:59 continues after tomorrow freezes at 14:00. Separately, an old plan moving a visit from **today** to a future writable day passes the destination-only check.
- **Fix:** Check the current source date and destination date immediately before every mutation, including retries. Protect OR route mutations as well as Jobber writes. Reject weekends independently. Routine execution must not use freeze-bypass flags.

**B03 — BLOCKER — CONFIRMED: saved plans can overwrite subsequent edits; a “times” writer can move dates.**

- **Evidence:** `optimize-week write` reads the saved instructions and executes them without refetching visits. `write-optimo-times` uses a disk snapshot; a date mismatch merely prevents its unchanged shortcut, after which it writes the OR date. Neither establishes that the current route is the revision the owner approved. [optimize-week.mjs:335](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:335), [optimize-week.mjs:370](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:370), [write-optimo-times.mjs:73](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/write-optimo-times.mjs:73), [write-optimo-times.mjs:95](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/write-optimo-times.mjs:95).
- **Failure:** After planning, Spencer moves a visit to Wednesday or completes it. An old Tuesday snapshot still causes a Tuesday schedule mutation.
- **Fix:** Persist expected-before values and the approved route revision; refetch before writing. A time-only writer must reject any day or driver mismatch. Changed, completed, missing, and newly introduced records need explicit conflict handling.

**B04 — BLOCKER — CONFIRMED: the default horizon chain can redistribute territories.**

- **Evidence:** The `push-week` order object has no `assignedTo`; `--grid` supplies date constraints, not a technician lock. The optimizer defaults to `ON_FORCE`, and the extension chain supplies no override. Write-back can then replace the Jobber assignee. [push-week.mjs:290](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:290), [optimize-week.mjs:199](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:199), [extend-horizon.mjs:146](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:146), [optimize-week.mjs:378](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:378).
- **Failure:** A Cory visit is priced at 12 minutes, assigned to another enabled driver, and written back to that driver despite the territory rule.
- **Fix:** Require a verified driver lock and exact approved date on every order; use balancing `OFF`. Quarantine missing owners instead of allowing the optimizer to choose. Changing only the balancing default is insufficient.

**B05 — MAJOR — CONFIRMED: `SYNC` destroys scheduling state where `UPDATE` is required.**

- **Evidence:** All three major push paths use `operation: 'SYNC'`, including the script advertised as safe create/update reconciliation. Its `--no-replan` option only excludes the subsequent planning step. [push-week.mjs:293](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:293), [rebalance-week.mjs:428](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:428), [jobber-to-optimo-sync.mjs:302](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:302), [jobber-to-optimo-sync.mjs:254](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:254).
- **Failure:** An existing routed order needs a technician correction. `SYNC` unschedules it; a failed planning step or `--no-replan` leaves it off the route. Identical order numbers do not make this scheduling-idempotent.
- **Fix:** Inventory orders, including unscheduled orders. Use `CREATE` for genuinely absent orders and `UPDATE` for existing ones. For approved day moves, update `date` and `allowedDates` before planning either affected day.

**B06 — MAJOR — CONFIRMED: the rebalance design cannot perform the day balancing its planning call promises.**

- **Evidence:** `chooseDays` chooses dates locally, then each order receives a single-day `allowedDates`. Switching OR balancing to `ON` cannot free those dates. The local load model excludes SET visits, while the requested hours ceiling is only reported. [rebalance-week.mjs:245](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:245), [rebalance-week.mjs:279](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:279), [rebalance-week.mjs:425](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:425), [rebalance-week.mjs:453](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:453), [rebalance-week.mjs:530](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:530).
- **Failure:** Monday contains four hours of fixed SET work. The greedy load starts Monday at zero and adds ordinary visits as though it were empty. OR must keep those dates, and `live` can write the overlong result.
- **Fix:** Remove this from the standard weekly path. For overtime proposals, include all fixed work and evaluate actual source/destination routes. The September 17 balancing change does not repair the underlying day-selection algorithm.

**B07 — MAJOR — CONFIRMED: rebalancing does not preserve recurring-series spacing or justify moves by overtime.**

- **Evidence:** Every eligible non-SET visit is independently assigned among region dates. There is no per-job spacing constraint, original-day preference, or overtime requirement; the query does not fetch product or series information. [rebalance-week.mjs:242](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:242), [rebalance-week.mjs:318](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:318).
- **Failure:** Two visits for one job in the same week can both be placed on its region’s only weekday. Across a longer window, separate weekly visits can be packed into dates that violate their interval.
- **Fix:** Preserve each existing visit’s approved date by default. Represent an overtime exception as an explicit visit-specific move, and verify spacing against adjacent visits outside the planning window. Routing existing visits is not a substitute for the TMCP/Quick Fix cadence check.

**B08 — MAJOR — CONFIRMED: a two-week extension can pull second-week visits into the first week.**

- **Evidence:** `push-week` computes one `MONDAY` from the window start and derives every grid date from it. Flexible orders are assigned that grid date regardless of their original week. [push-week.mjs:204](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:204), [push-week.mjs:217](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:217), [push-week.mjs:300](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:300).
- **Failure:** For today’s missing September 28–October 9 tail, an ordinary monthly visit booked Tuesday October 6, with no other visit in the window, is assigned Tuesday September 29.
- **Fix:** Use the visit’s approved date. If retaining a geographic-day proposal mode, anchor candidates to each visit’s intended service week and enforce cadence. Process extension one week at a time until this is corrected.

**B09 — BLOCKER for horizon advancement — CONFIRMED: plan completion is not represented.**

- **Evidence:** Extension refuses a saved plan with a different window. Standalone `optimize-week write` leaves the file unchanged. Archiving exists only after extension itself runs the writer. Direct `plan` also overwrites the single slot without the extension guard. [extend-horizon.mjs:127](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:127), [optimize-week.mjs:326](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:326), [optimize-week.mjs:396](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:396), [extend-horizon.mjs:187](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:187).
- **Failure:** The supplied September 14 application succeeded, but the next window remains blocked indefinitely.
- **Fix:** Archive this known-applied artifact with its receipt; do not replay it. Replace the single mutable slot with uniquely identified runs carrying explicit pending, partially applied, verified, and superseded states.

**B10 — BLOCKER — CONFIRMED: partial failures can become successful chain completion.**

- **Evidence:** `push-week`, `set-driver-days`, and `optimize-week write` print failures without returning a failing exit status. Extension treats exit zero as success and archives the plan after the chain. The optimizer writer also performs schedule and assignment as separate mutations, stopping that visit after the first reported error. [push-week.mjs:356](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:356), [set-driver-days.mjs:76](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/set-driver-days.mjs:76), [optimize-week.mjs:373](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:373), [optimize-week.mjs:396](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:396), [extend-horizon.mjs:164](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:164).
- **Failure:** Schedule succeeds, recurring assignment returns “required to handle future items,” and the visit is left on the new schedule with the old crew. The child still exits zero; extension archives the plan.
- **Fix:** Require a valid successful response for each operation; persist per-operation results, retry specifically recognized transient failures, and verify afterward. Unresolved operations must leave the run partial and return nonzero. Resume only unresolved work after fresh-state checks.

**B11 — MAJOR — CONFIRMED: stale stops remain in the optimization problem, and pruning trusts an unverified snapshot.**

- **Evidence:** The sync path pins existing OR orders even when absent from `want`; its verification checks missing expected visits but not extra stops. Extension includes no prune step. The prune script accepts an arbitrary snapshot and allows deletion of exactly half the order inventory. [jobber-to-optimo-sync.mjs:329](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:329), [jobber-to-optimo-sync.mjs:360](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:360), [extend-horizon.mjs:143](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:143), [prune-stale-orders.mjs:30](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/prune-stale-orders.mjs:30), [prune-stale-orders.mjs:72](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/prune-stale-orders.mjs:72).
- **Failure:** A canceled visit stays routed and consumes travel time. Conversely, a stale 450-visit snapshot against 500 legitimate orders permits 50 wrongful deletions.
- **Fix:** Validate snapshot scope, completeness, age, and identity; recheck deletion candidates against current Jobber state; impose a small approved absolute deletion ceiling. Reconcile membership before and after planning. Date-range-only inventory also leaves the documented undated-order blind spot. [prune-stale-orders.mjs:45](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/prune-stale-orders.mjs:45), [spec-v2.md:315](C:/Agentic-os-got-moles/projects/briefs/route-engine/2026-08-15_route-engine-spec-v2.md:315).

**B12 — MAJOR — CONFIRMED: the horizon checker certifies incomplete days and cannot distinguish empty days from missing plans.**

- **Evidence:** Any positive stop count means “planned”; zero means “unplanned.” The survey includes today, and any later planned day causes an abort if an earlier day is empty. Drift checking examines only planned dates and stops at 19 days. [extend-horizon.mjs:83](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:83), [extend-horizon.mjs:105](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/extend-horizon.mjs:105), [drift-check.mjs:52](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/drift-check.mjs:52), [drift-check.mjs:241](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/drift-check.mjs:241).
- **Failure:** One of 100 visits routes and the day appears complete. A legitimately empty day can block extension. September 8-style “no planned days” conditions would be reported as nothing to check rather than missing coverage.
- **Fix:** Measure coverage against expected Jobber visit IDs across the full 21 days. Represent empty, incomplete, frozen, and ready days separately. Plan explicitly selected unfrozen gaps without treating every existing route as untouchable forever.

**B13 — MAJOR — CONFIRMED: corrected service durations do not reliably reach OR.**

- **Evidence:** Sync decides whether to update using only existence, day, and technician. `replan-day` updates locks and priority but never duration. Several callers omit the date needed for service-day overrides. [jobber-to-optimo-sync.mjs:234](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:234), [replan-day.mjs:97](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/replan-day.mjs:97), [jobber-to-optimo-sync.mjs:303](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:303), [rebalance-week.mjs:429](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:429), [service-time.mjs:63](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/service-time.mjs:63).
- **Failure:** Changing Cory’s duration or a cluster price leaves existing orders unchanged; running `replan-day` still uses the old numbers. Robert’s September 15 override is honored by `push-week` but ignored by callers omitting `visitDate`. [tech-service-times.json:64](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/tech-service-times.json:64).
- **Fix:** Reconcile every planning-relevant field, including duration, address, and genuine time restrictions. Pass the actual service date everywhere. Plan and write-back must remain independently runnable when order membership is unchanged.

**B14 — MAJOR — CONFIRMED: crew handling still treats an independent driver as a trainee.**

- **Evidence:** `optimize-week` preserves every Norton assignee as a ride-along. Territory assignment replaces the entire list with one user. Sync accepts a null technician, creates an unlocked order, and exempts it from the wrong-technician check. [optimize-week.mjs:246](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:246), [optimize-week.mjs:379](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:379), [assign-by-territory.mjs:245](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/assign-by-territory.mjs:245), [jobber-to-optimo-sync.mjs:239](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:239), [jobber-to-optimo-sync.mjs:362](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:362).
- **Failure:** Moving Robert’s visit to Cory creates `[Cory, Robert]`. Another path removes a legitimate trainee. An unassigned visit can obtain an OR driver while remaining unassigned in Jobber.
- **Fix:** Maintain explicit, dated driver/crew roles. Compare and replace the complete intended assignee set. Reject an unresolved primary driver. Do not use array position or a surname regex as the ownership model.

**B15 — MAJOR — CONFIRMED: unresolved geography can pass as verified, and ownership resolvers disagree.**

- **Evidence:** Assignment falls back to the first split region when no side resolves, then counts that result as coordinate-resolved. Rebalance collects fallback/unknown entries but does not include them in its final report; its verification checks the union of zip weekdays rather than the address’s resolved region. The assignment resolver uses the first applicable handover, while `crossesOwners` uses the last applicable entry. [assign-by-territory.mjs:70](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/assign-by-territory.mjs:70), [assign-by-territory.mjs:79](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/assign-by-territory.mjs:79), [rebalance-week.mjs:218](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:218), [rebalance-week.mjs:497](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:497), [geo-side.mjs:84](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/geo-side.mjs:84).
- **Failure:** A split-zip address lacking both cache and fallback is assigned to whichever region appears first. With successive handovers for one region, different helpers can report different owners.
- **Fix:** Use one date-aware resolver selecting the latest effective handover, preserve resolution provenance, and verify address-level ownership/day. Missing authoritative coordinates must remain visible. Actual repeated handovers in the truncated configuration are unverified.

**B16 — MAJOR — CONFIRMED: write ceilings and ledger records do not provide the promised transaction safeguards.**

- **Evidence:** `--max` truncates the write list. The transport ceiling rejects request N+1 after allowing N writes. The ledger stores a payload digest rather than visit identity and before/after values; it silently ignores ledger-write failures and treats an OR HTTP 200 as applied without checking `success`. [optimize-week.mjs:364](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:364), [write-gate.mjs:155](C:/Agentic-os-got-moles/projects/briefs/route-engine/lib/write-gate.mjs:155), [write-gate.mjs:119](C:/Agentic-os-got-moles/projects/briefs/route-engine/lib/write-gate.mjs:119), [write-gate.mjs:139](C:/Agentic-os-got-moles/projects/briefs/route-engine/lib/write-gate.mjs:139), [write-gate.mjs:170](C:/Agentic-os-got-moles/projects/briefs/route-engine/lib/write-gate.mjs:170).
- **Failure:** A 26-operation batch under a 25-operation ceiling partially applies. An OR response `{success:false}` with HTTP 200 becomes an `APPLIED` ledger entry.
- **Fix:** Preflight operation counts before any mutation, distinguish canary batches from complete plans, and record external IDs, expected values, intended values, approval, result, and verification. Refuse writes if the required journal cannot persist.

**B17 — MAJOR — CONFIRMED: the “global” write gate does not cover the supplied generic clients.**

- **Evidence:** The OptimoRoute client allows arbitrary endpoints through `raw`; the Jobber client allows arbitrary GraphQL through `query`. Neither imports the project write gate. [optimoroute-api.mjs:33](C:/Agentic-os-got-moles/.claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs:33), [optimoroute-api.mjs:61](C:/Agentic-os-got-moles/.claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs:61), [jobber-api.mjs:76](C:/Agentic-os-got-moles/.claude/skills/tool-jobber/scripts/jobber-api.mjs:76), [jobber-api.mjs:121](C:/Agentic-os-got-moles/.claude/skills/tool-jobber/scripts/jobber-api.mjs:121).
- **Failure:** A separate CLI invocation can mutate either system while `writesEnabled=false`. Skill instructions provide a human authorization rule, not transport enforcement.
- **Fix:** Use a project-owned guarded client/entry point for all routing operations and prohibit raw-client mutation paths in that workflow. Do not edit the shipped skill clients on this consumer install.

**B18 — MAJOR — CONFIRMED: snapshot and join boundaries permit out-of-scope or completed visits.**

- **Evidence:** `fetch-window-visits` saves interval-overlap results without a local start-date clamp. `assign-by-territory` filters completeness but not actual local date. `optimize-week` includes completed visits in its lookup and matches only the visit suffix, ignoring the job-number prefix. [fetch-window-visits.mjs:61](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/fetch-window-visits.mjs:61), [assign-by-territory.mjs:154](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/assign-by-territory.mjs:154), [optimize-week.mjs:237](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:237), [optimize-week.mjs:268](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:268).
- **Failure:** A prior-day visit whose interval overlaps Monday can enter Monday’s reassignment run. A completed visit still represented by a ghost OR order can enter schedule write-back. Two differently prefixed OR orders sharing a valid visit suffix can generate conflicting writes.
- **Fix:** Clamp every snapshot to local start dates after pagination; validate active status again before writing; join the exact expected order number to the full Jobber visit ID; reject duplicates.

**B19 — MAJOR — CONFIRMED: hard-coded UTC−7 produces wrong winter windows.**

- **Evidence:** Query bounds and end-time calculations embed `-07:00`; `write-optimo-times` also derives dates by subtracting seven hours. [push-week.mjs:132](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:132), [optimize-week.mjs:374](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:374), [write-optimo-times.mjs:76](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/write-optimo-times.mjs:76).
- **Failure:** For a winter 09:00 Pacific start, interpreting `09:00-07:00`, adding three hours, and formatting in Pacific standard time produces an 11:00 end. The Jobber mutation therefore creates a two-hour interval.
- **Fix:** Use `America/Los_Angeles` calendar-aware conversion throughout. This does not explain September’s failure, but it is a deterministic upcoming defect.

**B20 — MAJOR if reactivated — CONFIRMED: the n8n definitions are incompatible with current policy, and WF-2 “dry” still plans live routes.**

- **Evidence:** WF-1 defaults technician locking off and builds 10/20-minute, SET-priority-C orders. WF-2 defaults `skipPlanning=false`; planning happens before its dry/live branch. It records technician mismatches but emits schedule-only mutations. Both window builders cap the span at 16 days. [WF-1:94](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/YxKaiU1IAAmMkDLh.json:94), [WF-1:222](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/YxKaiU1IAAmMkDLh.json:222), [WF-2:88](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/QEKz72NTP8YRZsUS.json:88), [WF-2:612](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/QEKz72NTP8YRZsUS.json:612), [WF-2:414](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/QEKz72NTP8YRZsUS.json:414), [WF-2:472](C:/Agentic-os-got-moles/.scratch-n8n/live-2026-09-18/QEKz72NTP8YRZsUS.json:472).
- **Failure:** A nominal dry run alters the OR plan; a later live run writes another driver’s timing to a visit without correcting or rejecting its assignee.
- **Fix:** Archive these routing workflows. Any future orchestration should call the same validated service, with no duplicate scheduling rules.

**B21 — MINOR — CONFIRMED: diagnostics overstate the precision of overtime relief and mislabel distance.**

- **Evidence:** Overtime relief estimates service time by subtracting travel from aggregate route duration and dividing evenly across stops. It selects landing days by straight-line proximity without checking cumulative inserted workload. `replan-day` labels raw route distance as miles, although the supplied API fact says kilometers. [overtime-relief.mjs:82](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/overtime-relief.mjs:82), [overtime-relief.mjs:88](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/overtime-relief.mjs:88), [replan-day.mjs:128](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/replan-day.mjs:128).
- **Failure:** A route containing SETs, checks, and waiting time assigns the same inferred service saving to every tail stop. Several suggestions can fill the same receiving day past its limit; nearby points across water can require substantial driving.
- **Fix:** Label these as candidate heuristics. Replan both affected days with actual service durations before approving a move; convert kilometers to miles explicitly.

**SUSPECTED / evidence limits**

| Concern | What is established and what remains unverified |
|---|---|
| Wrong driver homes or working hours | `set-driver-days` sends availability, not work-hour limits; current driver settings and home-management scripts were not supplied. Incorrect live settings remain **SUSPECTED**. [set-driver-days.mjs:54](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/set-driver-days.mjs:54) |
| Incorrect geocoding | Builders accept partial and multiple matches. Actual incorrect returned coordinates are **SUSPECTED**; no geocoder responses were supplied. This matters especially for the documented Puyallup/98363 mismatch. [push-week.mjs:306](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:306), [30-day review:208](C:/Agentic-os-got-moles/projects/briefs/route-engine/2026-09-17_30-day-route-territory-review-FERRY.md:208) |
| Polling failure mistaken for completion | The code accepts any status beginning with `F`. Whether OR can return a failure status matching that prefix is **SUSPECTED**, because the status contract was not appended. Use explicit verified terminal statuses. [optimize-week.mjs:213](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:213) |
| Cluster underpricing | Shares are calculated from configured membership, not the jobs actually present that day. A full 11-job cluster receives 121 minutes through rounding; the correct duration for a partial cluster is unverified. Material underpricing of a particular partial visit remains **SUSPECTED**. [service-time.mjs:46](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/service-time.mjs:46), [tech-service-times.json:6](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/tech-service-times.json:6) |
| Current territory tails | Specific current handovers and overrides cannot be confirmed from the HEAD excerpt. The September review itself contains a Federal Way loan statement contradicted by the supplied territory header, so it must not be applied wholesale. [30-day review:117](C:/Agentic-os-got-moles/projects/briefs/route-engine/2026-09-17_30-day-route-territory-review-FERRY.md:117), [territories.json:13](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/territories.json:13) |

The appended material does not include `rebalance-overflow.mjs`, the route-quality analyzer/report, snapshot/restore and other route-engine scripts, the learnings sections, or the actual stuck plan body. Their implementation is not verified here. The stuck plan’s application and current operating state are accepted from your supplied facts.

### C. Is OptimoRoute being used the way it should be?

**Daily-locked planning is the correct baseline for the current business rules.** With technician and service day fixed, the weekly problem separates into roughly 25 daily sequencing problems. OptimoRoute can optimize those sequences and show their capacity consequences. It cannot eliminate excess demand while preserving every fixed constraint.

A week-wide API call could also work if every order is correctly day-locked, but per-day calls make failures, approval, and retries easier to contain.

| Input | Required contract |
|---|---|
| Driver | Hard lock to the verified, approved technician. Missing ownership is an exception requiring resolution. |
| Date | `date` and `allowedDates` both identify the approved service date; allow Monday–Friday only. |
| Priority | Uniform `M`. |
| Duration | Cory 12/24; others 15/30; applicable dated overrides; reviewed cluster pricing. Recompute after any approved technician/date change. |
| Time windows | Only genuine customer restrictions become optimization constraints. Previously generated, unfrozen three-hour arrival windows should not automatically become hard appointment windows. |
| Location | Jobber’s property address, with validated OR coordinates where geography determines ownership. Ambiguous matches must be surfaced. |
| Start/end locations | Real, verified driver start/end configuration. Preserve physical travel costs while reporting unpaid commute separately. |
| Work hours | Explicit driver availability and work-window settings; an eight-hour target and any approved overflow reported using first-job-to-last-job elapsed time. |
| Balancing | `OFF`; territory ownership must not become an optimization variable. |

The local duration configuration already contains the directed rates. The problem is inconsistent propagation and subsequent assignment changes, not absence of per-tech support. [tech-service-times.json:12](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/tech-service-times.json:12), [service-time.mjs:63](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/service-time.mjs:63).

The minimal correct sequence is:

1. **Capture and validate the Jobber snapshot.** Complete pagination, clamp local start dates, identify active weekday visits, resolve primary driver and crew, and record expected-before values.
2. **Reconcile OR inventory.** Identify existing, missing, stale, unscheduled, and undated owned orders. Review deletions before making them. Any necessary availability change happens before planning and only on explicitly affected unfrozen dates.
3. **Create/update orders.** Per-order `CREATE` for new geocoded orders; `UPDATE` for existing orders. Update all relevant constraints and durations. Approved day moves require the new `date` plus `allowedDates` first.
4. **Call `start_planning` for an unfrozen day with balancing `OFF`.** Require a successful response and planning ID.
5. **Poll that planning ID.** Accept only a verified successful terminal status; errors, malformed responses, and timeouts leave the run unfinished.
6. **Fetch routes and verify membership and constraints.** Every expected visit appears exactly once, or has a named approved exception; no ghosts; correct driver/day; valid timestamps and durations.
7. **Present the exact revision for approval.** Include working hours, unresolved visits, and proposed overtime exceptions.
8. **Write approved changes, verify, and finish the run.** Recheck current Jobber state and freeze before every mutation. A partial run stays partial.

The existing per-day sync call has the appropriate balancing shape, but its destructive order writes, incomplete field reconciliation, and coupled write-back undermine it. [jobber-to-optimo-sync.mjs:341](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:341), [jobber-to-optimo-sync.mjs:302](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:302).

Verify driver homes and first-job timing in the UI before trusting capacity. The supplied code does not establish their current values. Do not interpret `--max-day-hours=9` as a configured OR limit: it is a reporting threshold. [rebalance-week.mjs:527](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:527).

### D. The Jobber ↔ OptimoRoute contract

| Information | Authority and permitted flow |
|---|---|
| Visit existence, completion/cancellation, recurring baseline | Jobber → planner. OR must not resurrect missing/completed visits or create recurring demand. |
| Property address, product, visit history | Jobber → planner. Product comes from line items; cadence uses the latest relevant visit findings. |
| Approved date and assignee set | Jobber → OR hard constraints. Territory discrepancies produce proposals; a stale territory file must not silently overwrite the board. |
| Coordinates | OR-derived planning input, validated for address and boundary use; not an excuse to overwrite Jobber addresses. |
| Sequence and estimated arrival | OR → approved plan → Jobber schedule. |
| Customer arrival window | Jobber-owned customer promise. Preserve the approved three-hour convention and frozen values; do not confuse it with service duration. |
| Overtime day move | Visit-specific proposal → owner approval → controlled date change → revised OR constraints and replanning. |
| Cadence addition | Separate approved scheduling decision. TMCP interim additions must not move the recurring baseline; exhausted Quick Fix series require a sales flag. |

**Identity:** use the full Jobber visit ID as the internal key. Preserve the existing `<jobNumber>-<visitNumericId>` OR order number through an explicit mapping. Verify the whole mapping on every join. Job number alone is not a visit key, and the suffix-only match in `optimize-week` is weaker than the contract. [optimize-week.mjs:268](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:268).

**Normal write-back:** change the approved arrival start and associated end/window representation using `visitEditSchedule`; leave date and assignees unchanged. An explicitly approved reassignment uses `visitEditAssignedUsers` with the entire intended crew list. The supplied code does not show a separate Jobber sequence-field mutation; do not promise one. Current writers encode sequencing through schedule times. [write-times-from-plan.mjs:76](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/write-times-from-plan.mjs:76), [optimize-week.mjs:380](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:380).

**Never overwrite implicitly:** owner-selected days, current crews, frozen arrival windows, completion state, addresses, product information, notes, or recurring-series definitions.

**Manual-edit collisions require an operating agreement plus code protection.** Capture expected-before values at proposal time, pause edits to the affected records during application, and reread before each write. If current state differs, quarantine that record and refresh the affected route. A reread alone still leaves a race between the read and mutation; the supplied mutation paths contain no conditional-update mechanism. New bookings after approval enter an add queue, not the approved batch. The previous design’s claim that moving review into OR makes collisions “dissolve” does not hold while Spencer continues editing Jobber. [route-engine brief.md:246](C:/Agentic-os-got-moles/projects/briefs/route-engine/brief.md:246), [optimize-week.mjs:376](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/optimize-week.mjs:376).

**Freeze:** date D becomes immutable at 14:00 Pacific on D−1; today is always frozen. Evaluate that against both the current and proposed dates immediately before every affected mutation. Approval of a plan before 14:00 does not authorize writes after the cutoff.

### E. Recommendations, ranked by value / effort

**1. THIS WEEK: produce one trustworthy week through a single supervised path.**

Proceed in this order:

1. **Resolve the bookkeeping stall without replaying old writes.** Archive the September 15–20 plan alongside the supplied 332-operation application evidence. Preserve its unresolved/orphan exceptions separately. Its current filename is not evidence that Jobber needs another application.

2. **Make September 21–25 the first acceptance week.** Capture a fresh board using `fetch-window-visits.mjs` after fixing its local-date clamp. Use current Jobber dates and assignees as the proposed baseline. Resolve missing owners, obvious address defects, and specific disputed territory assignments before routing. Do not run mass `assign-by-territory live` against the unadjudicated map.

3. **Patch the narrow execution path before granting writes.** The smallest useful scope is:
   - `jobber-to-optimo-sync.mjs`: safe existing-order `UPDATE`, complete input reconciliation, mandatory verified driver/day locks, weekend/freeze checks, and a durable proposal snapshot.
   - `write-times-from-plan.mjs`: approval tied to that proposal, fresh-state comparisons, driver/date validation, per-mutation freeze checks, verified responses, and resumable receipts.
   - `prune-stale-orders.mjs`: validated snapshot, candidate rechecks, absolute deletion ceiling, and nonzero failure exit.

   This is less work than repairing every historical writer. The current relevant gaps are at [sync:234](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs:234), [writer:43](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/write-times-from-plan.mjs:43), and [prune:30](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/prune-stale-orders.mjs:30).

4. **Account for demand before optimizing.** Manually verify required TMCP follow-ups and the five-visit Quick Fix series for this first week. These route-fetch queries do not contain the line items or visit findings required to establish cadence coverage. Missing visits cannot be repaired by sequencing the visits that happen to exist. [fetch-window-visits.mjs:61](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/fetch-window-visits.mjs:61).

5. **Clean and plan OR under a narrow, expiring grant.** Review the patched prune’s dry result, apply only confirmed stale-order removals, then use the patched `jobber-to-optimo-sync.mjs live --from=2026-09-21 --to=2026-09-25 --plan-only`. Ensure the planning stage runs for deliberately selected days even when membership is already synchronized. Verify driver homes, availability, and work windows first; avoid blanket driver-parameter rewrites.

6. **Review hours and exceptions.** Show each technician’s first arrival, last departure, service minutes, between-stop driving, and elapsed working hours. Show commute separately. If a day is too long, propose specific same-technician overtime moves and measure both affected routes. Apply approved moves in Jobber, update OR dates/locks, and replan. Do not let a general rebalance choose new days for the whole board.

7. **Approve and apply one exact revision.** Use the patched time-only writer for the selected days. Monday September 21 freezes Sunday September 20 at 14:00 Pacific; finish with margin. Reconcile every result immediately. Resolve the current 25-write policy versus larger scoped grants explicitly; do not rely on truncation to create a “safe” partial batch. The signed ceiling is 25, while the supplied authority file has a 2,000-request ceiling. [scheduling-rules.json:268](C:/Agentic-os-got-moles/projects/briefs/route-engine/rules/scheduling-rules.json:268), [write-authority.json:7](C:/Agentic-os-got-moles/projects/briefs/route-engine/write-authority.json:7).

8. **Extend with the same path, one week at a time.** Plan September 28–October 2, then October 5–9. This reaches the requested horizon without the current multiweek grid error. Keep those proposals independently identified and refresh them when approved Jobber bookings change.

If the guarded writer cannot be completed in time, deliver the reviewed OR week and apply the approved time list manually for that first acceptance run. A usable week need not wait for an automated cadence engine.

**2. Stop or archive these paths.**

- Keep the routing crons disabled and the default write gate closed.
- Keep `drift-check fix` retired; retain report-only functionality after fixing horizon coverage.
- Stop using `extend-horizon live` until its child failure handling and selected planning path are corrected.
- Stop routine use of `push-week` plus unrestricted `optimize-week`, and stop `rebalance-week live`.
- Retire duplicate time writers once the guarded time-only path works.
- Archive the inactive n8n routing workflows and preserve exports as history.
- Treat `home-slots.json` and old grids as historical artifacts unless a verified current consumer requires them; their supplied headers retain July-era assignments. [home-slots.json:2](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/home-slots.json:2), [territory-grid.json:6](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/territory-grid.json:6).

**3. Build only the structure needed to keep that week repeatable.**

- One supervised entry point for **snapshot → reconcile → plan → approve → apply → verify**.
- One project-owned API client with serialized Jobber token refresh and consistent response validation; the supplied scripts independently refresh and persist the shared token. [push-week.mjs:47](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/push-week.mjs:47), [rebalance-week.mjs:67](C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/rebalance-week.mjs:67).
- One versioned operational rule set that reflects current owner decisions, with history-derived service-day proposals and explicit address-level boundary exceptions.
- One immutable run manifest and per-operation receipt.
- One discrepancy report covering the full 21 days, independent of whether OR happens to have routes.

No solver replacement or new review UI is needed to reach the first usable week.

**4. Verify success with eight measurable checks.**

| Check | Acceptance |
|---|---|
| **Visit coverage** | Every eligible Jobber visit has exactly one corresponding planned stop or an explicitly approved off-route arrangement; zero unexplained missing, duplicate, or ghost stops. |
| **Day and technician agreement** | Zero unapproved Jobber-versus-OR date or primary-driver differences; exact intended crew membership after any approved reassignment. |
| **Working hours** | First-job arrival through last-job departure reported per technician/day and summed weekly; commute excluded; every excess above the eight-hour target explicitly accepted or resolved. Cory’s salaried status is reported separately from capacity. |
| **Territory integrity** | Zero unexplained off-territory stops against the approved map; every unresolved split-address decision listed and adjudicated. Zip-majority disagreement alone is not an error. |
| **Cadence coverage** | Zero unexplained overdue TMCP activity/catch/miss follow-ups; Quick Fix spacing and five-visit exhaustion checked; zero unauthorized additions after exhaustion. |
| **Freeze and weekdays** | Zero Saturday/Sunday visits in the accepted plan; zero mutations affecting frozen dates; compare frozen fields before and after application. |
| **Horizon completeness** | Zero unexplained unplanned demand-bearing weekdays through October 9; legitimately empty days explicitly identified. |
| **Application and usability** | Every approved operation verified or left visibly unresolved; no failed/partial run labeled done; unchanged rerun proposes zero writes; owner approval takes at most ten minutes with no unexplained route hand-editing. |

Before live use, exercise the selected path with simulated partial API failure, a manual edit after approval, and a batch crossing 14:00. Those tests directly cover the failures that currently make the plan untrustworthy.

### F. Questions only the owner can answer

1. Which specific ownership differences between the current Jobber board and the territory file should change for the first accepted week, especially Cory/Robert and Puyallup, so reconciliation does not trigger an unwanted mass reassignment?
2. What daily and weekly working-hour excess is acceptable for the trial, with Cory considered separately for labor cost, so an infeasible day receives an explicit decision?
3. What start/end locations and earliest first-job times should each driver use, so commute assumptions do not distort sequencing or capacity?
4. Which visits have genuine customer time restrictions beyond the standard arrival window, so the planner can distinguish real constraints from its own previous estimates?
5. Can edits to the affected Jobber visits and OR routes pause during each approved write batch, so last-second manual changes are not overwritten?
6. Should the 25-write ceiling remain per independently approved batch or become a larger plan-specific ceiling for the reviewed week, so application does not stop halfway through?