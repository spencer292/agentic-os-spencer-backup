# Tavis out 2026-09-21..24 — swap dry run

**Instruction (Spencer, 2026-09-19):** Tavis Alexander is out of town Mon 09-21 through Thu 09-24.
Move Tavis's visits on those dates to Cory Ventura, and Cory's visits on those dates to Spencer Hill,
then re-plan the four days in OptimoRoute with the new drivers. Friday 09-25 is untouched.

**Status: DRY RUN. Nothing was written.** Every Jobber call in this folder was a GraphQL *query*;
every OptimoRoute call was `get_routes` or `search_orders`. The route-engine write gate
(`projects/briefs/route-engine/write-authority.json`) reads `writesEnabled: false` and stayed closed
for the whole exercise — every script here prints `[write-gate] writes BLOCKED — writes disabled: Revoked.`
on start.

**Data pulled live from Jobber and OptimoRoute at 2026-09-19 12:12:32 PT.** Every count below is
that pull. This is the second pull of the session, taken after Spencer said he had finished adding
visits to the week; the first was at 12:03:05 PT and the two are **identical** — zero visits added,
zero removed, zero assignee or date changes across the four dates. The earlier snapshot is kept as
`live-pull1.json` for the comparison.

Files: `pull.mjs` (read-only pull) → `live.json`; `probe-drivers.mjs` → `probe-drivers.json`;
`analyze.mjs` → `dry-run.json`; `live-run.mjs` (the live implementation, **not executed**).

---

## 1. Live Jobber — who holds what

431 visits sit on the four dates. None is complete, none is unassigned, none falls on a weekend,
and **no visit has more than one assignee — there are zero ride-alongs in this window**, so every
replacement assignee list is a single user id.

| Date | DOW | All visits | Tavis | Cory | Spencer | Unassigned |
|---|---|---:|---:|---:|---:|---:|
| 2026-09-21 | Mon | 112 | 27 | 18 | 0 | 0 |
| 2026-09-22 | Tue | 103 | 32 | 18 | 0 | 0 |
| 2026-09-23 | Wed | 103 | 17 | 19 | 0 | 0 |
| 2026-09-24 | Thu | 113 | 26 | 30 | 0 | 0 |
| **Total** | | **431** | **102** | **85** | **0** | **0** |

**Spencer Hill holds zero visits of his own on all four dates.** The brief assumed his Tuesday
peninsula run would add to his load; on the live board it does not exist. Everything he would carry
comes from Cory. Whether that is correct or whether the peninsula Tuesday is simply not booked yet is
a question for Spencer.

Full per-visit detail — visit id, job number, client, city, zip, date, current assignee list,
replacement list, title — is in `dry-run.json` → `plan.passA_coryToSpencer` and `plan.passB_tavisToCory`.

### The ground being handed over

This is a **cross-territory** cover, not a like-for-like swap. Tavis runs the north metro; Cory is
currently running Pierce County.

| Date | Tavis → Cory | Cory → Spencer |
|---|---|---|
| Mon 09-21 | Seattle 19, Shoreline 5, Kenmore 1, Lake Forest Park 1, Bellevue 1 | Orting 5, Graham 6, Eatonville 3, Yelm 2, Renton 1, Pierce County 1 |
| Tue 09-22 | Seattle 23, Burien 6, Normandy Park 3 | Orting 6, Graham 6, Eatonville 4, Yelm 2 |
| Wed 09-23 | Bellevue 7, Mercer Island 6, Clyde Hill 2, Carnation 1, Seattle 1 | Buckley 7, Bonney Lake 6, Lake Tapps 3, Maple Valley 1, Sumner 1, Pierce County 1 |
| Thu 09-24 | Renton 19, North Bend 2, Newcastle 2, Bellevue 1, Issaquah 1, Fall City 1 | Puyallup 21, Covington 3, Kent 2, Renton 1, Auburn 1, Milton 1, Edgewood 1 |

Cory lives in Buckley (98321). Mon and Tue send him to Shoreline, Kenmore and north Seattle —
roughly the length of the metro from his door, each way, twice. **That commute is not in any hours
figure below** and it is the single biggest thing this plan does not price.

---

## 2. Live OptimoRoute

### Routes as currently held

| Date | Driver | Stops | Duration (min) | Distance (km) |
|---|---|---:|---:|---:|
| 2026-09-21 | Alias Franks | 29 | 716 | 202.1 |
| 2026-09-21 | Tavis Alexander | 26 | 668 | 213.3 |
| 2026-09-21 | Robert Norton | 19 | 456 | 117.5 |
| 2026-09-21 | Luke LaVergne | 19 | 539 | 222.0 |
| 2026-09-21 | Cory Ventura | 17 | 464 | 259.7 |
| 2026-09-22 | Tavis Alexander | 31 | 718 | 166.5 |
| 2026-09-22 | Robert Norton | 30 | 615 | 104.5 |
| 2026-09-22 | Cory Ventura | 18 | 490 | 250.9 |
| 2026-09-22 | Luke LaVergne | 5 | 182 | 97.7 |
| 2026-09-22 | Alias Franks | 4 | 244 | 192.3 |
| 2026-09-23 | Alias Franks | 29 | 717 | 204.2 |
| 2026-09-23 | Cory Ventura | 18 | 312 | 90.4 |
| 2026-09-23 | Luke LaVergne | 17 | 589 | 261.1 |
| 2026-09-23 | Robert Norton | 17 | 417 | 120.6 |
| 2026-09-23 | Tavis Alexander | 16 | 478 | 191.7 |
| 2026-09-24 | Tavis Alexander | 24 | 608 | 199.6 |
| 2026-09-24 | Cory Ventura | 23 | 414 | 128.1 |
| 2026-09-24 | Luke LaVergne | 19 | 510 | 196.8 |
| 2026-09-24 | Robert Norton | 16 | 384 | 106.2 |
| 2026-09-24 | Alias Franks | 3 | 151 | 102.6 |

OptimoRoute holds 380 stops against Jobber's 431. `search_orders` returns 389 orders in the window,
all of them ours (`<jobNumber>-<visitId>`, zero foreign). The gap is real and is covered under
risks below.

Per-order state for every moving visit — orderNo, current `assignedTo` serial, order date — is in
`dry-run.json` → `optimoroute`. Every order's date agrees with its Jobber date; there are no
date mismatches.

### Is Spencer Hill an OptimoRoute driver?

**Yes.** `get_drivers` and `get_vehicles` both return `AUTH_KEY_UNKNOWN` on this API key and
`get_drivers_parameters` is a 404, so the roster cannot be listed directly. The read-only probe
that does work is history: `get_routes` across 60 weekdays shows a route under the serial
`Spencer Hill` on 2026-07-21, 07-22, 07-23, 07-24, 07-29, 07-30 and 07-31 — 147 stops. The driver
record exists and the serial string is exactly `Spencer Hill`.

**Is he enabled on Mon–Thu 09-21..24? Unverifiable read-only, and almost certainly no.** His last
route was 2026-07-31, seven weeks ago, and `set-driver-days.mjs` disables anyone not in the grid's
`works` list. There is no read endpoint for per-date availability, so the live run must set it
explicitly rather than assume. Cory and Tavis both hold routes on all four dates, so both are
currently enabled.

### Exactly which OptimoRoute calls the live run would make

1. **Per-order assignment**, one call per moving visit, 171 of them:
   `create_order {operation:"UPDATE", orderNo:"<job>-<visit>", assignedTo:{serial:"<new tech>"}}`.
   **UPDATE only. Never SYNC** — SYNC unschedules everything it touches.
2. **Driver availability**, one `update_drivers_parameters` call carrying 12 rows: for each of the
   four dates, `Spencer Hill enabled:true`, `Tavis Alexander enabled:false`, `Cory Ventura enabled:true`.
   This call unschedules the dates it touches, which is why it runs *before* planning, not after.
3. **Plan each date**: `start_planning {dateRange:{from:D,to:D}, balancing:"OFF", startWith:"CURRENT", lockType:"NONE"}`,
   then poll `get_planning_status?planningId=...` to completion, then `get_routes?date=D`.
   **Balancing is OFF** — `ON_FORCE` lets OptimoRoute reassign stops between drivers after the
   assignment, which would undo the swap.

### Freeze

The arrival-window freeze in `jobber-to-optimo-sync.mjs` is a clock rule: a date is frozen once it is
today or past, and tomorrow freezes at 14:00 PT today. Running on 2026-09-19:

| Date | Freezes at | Writable today |
|---|---|---|
| 2026-09-21 | 2026-09-20 14:00 PT | yes |
| 2026-09-22 | 2026-09-21 14:00 PT | yes |
| 2026-09-23 | 2026-09-22 14:00 PT | yes |
| 2026-09-24 | 2026-09-23 14:00 PT | yes |

Monday 09-21 is the binding one: it freezes **Sunday 09-20 at 14:00 PT**. All four days are writable
now. Note the rule is a clock check only — it does not query Jobber to confirm whether notifications
actually went out.

---

## 3. The exact Jobber mutation list

**187 mutations**, all `visitEditAssignedUsers`, one per visit, full replacement list each time.
With zero ride-alongs in this window every list is a single id.

| Pass | Move | Count |
|---|---|---:|
| A | Cory Ventura → Spencer Hill | 85 |
| B | Tavis Alexander → Cory Ventura | 102 |

Per day: Mon A=18 B=27, Tue A=18 B=32, Wed A=19 B=17, Thu A=30 B=26.

Shape:

```
mutation { visitEditAssignedUsers(visitId: "<visit gid>",
  input: { assignedUserIds: ["<new user gid>"] }) { userErrors { message } } }
```

User ids, resolved live from `users(first:80)` filtered to `ACTIVATED`:

| Tech | Jobber user id |
|---|---|
| Tavis Alexander | `Z2lkOi8vSm9iYmVyL1VzZXIvMzE0NDEwNQ==` |
| Cory Ventura | `Z2lkOi8vSm9iYmVyL1VzZXIvMTI5NDM3Mg==` |
| Spencer Hill | `Z2lkOi8vSm9iYmVyL1VzZXIvMzgwNjE2` |

**Pass order is load-bearing.** Cory → Spencer runs first, against the original board. If
Tavis → Cory ran first, pass A would sweep the 102 visits it had just placed on Cory straight on to
Spencer. `live-run.mjs` builds both passes from one snapshot before writing anything, so the order is
enforced by construction rather than by remembering to run them the right way round.

`visitEditAssignedUsers` **replaces** the whole assignee list, so the replacement is built from each
visit's current list with one name swapped and every other assignee kept. It is the only assignment
write Jobber offers — there is no job-level assignment mutation.

The full 187-line mutation list, with job number, date, city, client and the before/after assignee
list on each, is printed by `node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/live-run.mjs`
(dry mode, the default) and lands in `live-run.log`.

### Verification query

After the passes, `live-run.mjs` re-runs the same live window query and asserts:

```
visits(filter:{ startAt:{ after:"2026-09-21T00:00:00-07:00", before:"2026-09-24T23:59:59-07:00" }})
  -> assignedUsers.name.full
```

Pass condition: **zero visits assigned to Tavis Alexander on those four dates**, Cory holding 102 and
Spencer 85, broken out per date. Any visit still on Tavis is printed by job number and the run exits
non-zero.

---

## 4. Projected load

Hours = stops × the tech's GPS cycle time for that weekday from
`redesign/data/cycle-times-gps.json`. Cory is priced at **his own measured rate**, as directed —
he is faster than the board average and pricing him at Tavis's rate would overstate the day. Spencer
has **no GPS row at all** (no field days in the 2026-08-17..09-17 measurement window), so he is
priced at the **all-tech median, 19.5 min/stop**. That is stated per row in `dry-run.json`.

Untouched techs are shown so the day reads whole.

| Date | Driver | Stops before | Stops after | min/stop | Hours | Flag |
|---|---|---:|---:|---:|---:|---|
| Mon 09-21 | Alias Franks | 29 | 29 | 17.5 | 8.46 | >8 |
| Mon 09-21 | **Cory Ventura** | 18 | **27** | 13.1 | 5.89 | |
| Mon 09-21 | Luke LaVergne | 20 | 20 | 23.4 | 7.80 | |
| Mon 09-21 | Robert Norton | 18 | 18 | 20.9 | 6.27 | |
| Mon 09-21 | **Spencer Hill** | 0 | **18** | 19.5 med | 5.85 | |
| Tue 09-22 | Robert Norton | 37 | 37 | 17.7 | 10.91 | **>9.5** |
| Tue 09-22 | **Cory Ventura** | 18 | **32** | 15.9 | 8.48 | >8 |
| Tue 09-22 | **Spencer Hill** | 0 | **18** | 19.5 med | 5.85 | |
| Tue 09-22 | Luke LaVergne | 10 | 10 | 25.7 | 4.28 | |
| Tue 09-22 | Alias Franks | 6 | 6 | 22.9 | 2.29 | |
| Wed 09-23 | Alias Franks | 31 | 31 | 27.7 | 14.31 | **>9.5** |
| Wed 09-23 | Luke LaVergne | 20 | 20 | 31.7 | 10.57 | **>9.5** |
| Wed 09-23 | **Spencer Hill** | 0 | **19** | 19.5 med | 6.17 | |
| Wed 09-23 | **Cory Ventura** | 19 | **17** | 14.4 | 4.08 | |
| Wed 09-23 | Robert Norton | 16 | 16 | 18.1 | 4.83 | |
| Thu 09-24 | **Spencer Hill** | 0 | **30** | 19.5 med | 9.75 | **>9.5** |
| Thu 09-24 | Luke LaVergne | 27 | 27 | 27.1 | 12.20 | **>9.5** |
| Thu 09-24 | **Cory Ventura** | 30 | **26** | 15.9 | 6.89 | |
| Thu 09-24 | Robert Norton | 19 | 19 | 20.3 | 6.43 | |
| Thu 09-24 | Alias Franks | 11 | 11 | 26.2 | 4.80 | |

**What the swap itself causes:** one flag, Spencer's Thursday at 9.75 h on 30 stops. Everything else
over 8 h — Robert's Tuesday 37 stops, Alias's Wednesday 31, Luke's Wednesday and Thursday — is
already on the board today and has nothing to do with Tavis being away.

**Spencer's Thursday is rate-sensitive.** Cory does those exact 30 stops in 7.95 h at his own
measured pace, because it is dense Puyallup ground. The 9.75 h figure is the all-tech median applied
to a tech with no measurement. Both numbers are in `dry-run.json` → `spencerSensitivity`:

| Date | Stops | At all-tech median (19.5) | At Cory's rate for that ground |
|---|---:|---:|---:|
| Mon 09-21 | 18 | 5.85 | 3.93 |
| Tue 09-22 | 18 | 5.85 | 4.77 |
| Wed 09-23 | 19 | 6.17 | 4.56 |
| Thu 09-24 | 30 | 9.75 | 7.95 |

**Cycle time excludes the home commute by definition** — it is first-customer arrival to
last-customer departure. Both receiving techs are on unfamiliar ground, and Cory's Mon/Tue run to
north Seattle from Buckley is a long drive at each end that no row above contains.

---

## 5. Risks and edge cases

**Customer-facing effect — low, but one part is UNKNOWN.**
Nothing in this plan changes a visit's date or time in Jobber. `live-run.mjs` re-plans in
OptimoRoute only and does **not** write optimized times back, so the arrival windows customers
already hold are untouched. Whether `visitEditAssignedUsers` on its own fires any customer
notification is **not recorded anywhere in this repo's learnings and is not verified** — the
documented Jobber notification behaviour here concerns arrival windows and schedule times, not
assignee. Treat it as unknown until tested on a single visit. The techs' sequence and arrival clock
*will* move, so anyone who was told a time by phone rather than by the standard window could be off.

**The arrival-window safety net is off.** `bash scripts/status-crons.sh` reports
`runtime: stopped` — no cron runtime is active, so the twice-daily `jobber-arrival-window-sweep`
is not running. Any visit Spencer books between now and Monday goes out with no 3-hour window and
the customer sees an exact route ETA. That is independent of this swap but it lands inside the same
four days. Either start the crons or run
`node projects/tool-jobber/scripts/arrival-window-sweep.mjs` by hand before Sunday 14:00 PT.

**OptimoRoute is 51 stops behind Jobber.** Jobber has 431 visits on these dates; OptimoRoute holds
380 planned stops and 389 orders.

- **46 live Jobber visits have no OptimoRoute order at all.** 16 of those are visits this swap moves
  (#8603 Mary Hendrickson, #8605 Yara Chen, #8601 Kevin Shaver, #8607 Ben Mathes, #8597 Jeff Westcott,
  #6380 Rob Chadek, #8160 Sharry Kim, #4930 Plemmons Industries, #8488 Terry Wirth, #7697 Jennifer
  Cramer, #6953 Jean Brannen, #5602 Sandee Smith, #7407 Steven Friedrichsen, #8275 Damien Romanik,
  #8599 Anne-Marie Jones, #8602 Mike Laidley). `create_order operation:"UPDATE"` fails on an order
  that does not exist, so `live-run.mjs` refuses to run live until they are created —
  `jobber-to-optimo-sync.mjs live --from=2026-09-21 --to=2026-09-24` is the tool that creates them.
  Run that **before** the swap, or those 16 stops are simply absent from the re-planned days.
- **4 ghost stops** — an OptimoRoute stop whose visit no longer exists in the live Jobber window:
  `8439-2299131242` (Mon, Robert), `8142-2325408630` (Tue, Tavis), `8425-2334698805` (Wed, Robert),
  `8580-2332467733` (Thu, Tavis). `push-week` can create but never retire, so a cancelled or moved
  visit leaves its stop behind consuming route capacity. Run `prune-stale-orders.mjs` before judging
  any day's balance.

**Four jobs have two visits on the same day** — #8473 on 09-21, #4425 on 09-22, #6181 and #7875 on
09-24. Two of those pairs look like the recurring series and a cadence add-on landing together
(#4425 and #6181 each pair a new visit id with a much older one). Worth a look before Monday; none
of them blocks the swap.

**Tavis's Jobber visits run well past 09-24.** This swap covers only the four dates. His recurring
jobs keep generating visits in his name, and Jobber has no job-level assignment mutation, so nothing
here changes the underlying recurrence. Friday 09-25 is deliberately untouched per the instruction.

**Ownership rots after any cadence pull-forward.** If a cadence run pulls a visit into these four
days after the swap, it arrives carrying its old assignee. Re-check assignment before Monday morning
rather than assuming the swap holds.

---

## 6. Running it live

```
# 1. create the 16 missing OptimoRoute orders first
node projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs live --from=2026-09-21 --to=2026-09-24

# 2. clear the ghosts
node projects/briefs/technician-route-automation/prune-stale-orders.mjs

# 3. dry (default) — prints the full mutation and OptimoRoute call list to live-run.log
node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/live-run.mjs

# 4. Spencer opens the write gate, time-boxed
node projects/briefs/route-engine/scripts/write-authority.mjs enable --reason "Tavis out 09-21..24 swap" --ttl 90m

# 5. live
node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/live-run.mjs --execute
```

`live-run.mjs` rebuilds its plan from a **fresh** Jobber query every run — Spencer is adding visits
right now and the counts above will have moved by Monday. It hard-stops on the first `userErrors` or
GraphQL error after one retry (Jobber flakes transiently on recurring visits with "required to handle
future items"), tees every line to `live-run.log` with a numbered per-visit ledger line, guards
against weekend dates and a run larger than 260 mutations, skips any visit already complete, and
finishes with the verification query above.

**Stop the crons before any manual editing session on these days**
(`bash scripts/stop-crons.sh` — they are already stopped as of this dry run).
