# Five-territory cut — executed, week of 2026-08-17

Run 2026-08-13 evening. The map decided on 08-12 (Option A, highway) is **live**, next week is
**fully routed on five techs**, and every write landed. This is the as-built record, the numbers the
week actually came out at, and the one structural problem the live board exposed that the census
could not.

Companion to `2026-08-12_five-territory-cut-REVIEW.md`, which is the decision doc.

---

## What is now true

| | |
|---|---|
| Map | `territories.json` **v9 five-highway**, live (v8 kept at `technician-route-automation/territories-v8-backup-2026-08-13.json`) |
| Ownership | **216 assignee writes**, 0 failed. 498 open visits, every one on its territory owner |
| Route days + times | **498 writes, 311 changed weekday**, 0 failed, 0 unscheduled |
| Board defects | 0 unassigned, 0 on Spencer, 0 weekend, 0 without a time |
| Verified | Re-pulled from Jobber after the run; day/tech shape matches the plan exactly |

The live week of 08-10 was never touched: v9 encodes the change as **handovers effective 08-17**
with v8's `owner` values left alone, so no region changes hands before Monday.

---

## The week as routed

| Tech | Territory | Mon | Tue | Wed | Thu | Fri | Visits | h/wk |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **Alias** | Eastside — north of I-90, east of Lake WA | 9.1 | 9.4 | 9.3 | **10.5** | 9.8 | 108 | **47.9** |
| **Tavis** | Seattle + Renton | 9.0 | **10.2** | 8.5 | **10.1** | 8.8 | 120 | **46.6** |
| **Robert** | SR-18 corridor | 9.5 | 8.0 | 9.9 | 8.4 | 9.4 | 110 | **45.2** |
| **Luke** | I-705 west and south | 7.2 | 6.5 | 7.7 | 6.6 | 7.1 | 78 | 35.2 |
| **Cory** | SR-410 country | 6.1 | 6.0 | 5.5 | 7.8 | 5.5 | 85 | 30.9 |

**205.9 h across the week.** Every day is a tight geographic cluster — Alias's Tuesday is Sammamish
and the valley, Tavis's Wednesday is Bellevue South and Mercer, Cory's Thursday is Puyallup and
Edgewood. The region/day guard passed: no stop is on a day its region does not run.

---

## The structural problem the live board exposed

**The work is not where the slack is.** Alias 47.9, Tavis 46.6 and Robert 45.2 against Cory 30.9 and
Luke 35.2 — a 17-hour spread, and it is geographic, not schedulable. Cory and Luke are 60 miles
south of the overload; no amount of day-shuffling moves an Eastside trap check onto a Puyallup run.

This is not the same claim as the 08-12 review, and the difference matters:

- The census said the five territories land within ~3 h of each other (28.2–34.1 h/wk). That was
  measured on **typical volume** and **excluded the run out from home**. Both assumptions break on
  a real week: OptimoRoute charges real road time, and next week is booked heavy in the north.
- Alias holds **47.9 h**. Spread perfectly flat that is still **9.6 h every day**. Spreading cannot
  fix it — only moving ground or moving volume can. Same for Tavis (9.3) and Robert (9.0).
- Measured pace makes it worse than it reads, but **for Robert, not Alias** (corrected 2026-08-13,
  Spencer: "Robert is the slowest by far"). The 17.7 min/stop that had Robert near the front came
  from the 07-13..08-09 window — before he was in the field, so it was a handful of stops and
  meaningless. Re-measured over **08-10..08-13, the days he has actually worked** (494 completed
  visits, 419 measured gaps):

  | Tech | Stops | Median min/stop | Mean | Fastest quartile |
  |---|---:|---:|---:|---:|
  | Cory | 108 | **15.3** | 19.8 | 8.9 |
  | Alias | 127 | 19.7 | 22.0 | 15.8 |
  | Luke | 81 | 20.9 | 26.3 | 14.0 |
  | **Robert** | 107 | **21.2** | 23.5 | 15.3 |

  All-tech median 19.4. Cory is 28% faster than Robert. Since OptimoRoute plans everyone at one
  pace, **Robert's 45.2 h week is the one most understated** — his 9.5 h Monday is nearer 10.5 h at
  his own rate, and Cory's 30.9 h week is really lighter still.

**Two moves are available, both your call:**

1. **Enumclaw / Black Diamond / Ravensdale (27 visits, ~8 h) from Robert to Cory.** Clean: Enumclaw
   sits *on* SR-410 and Cory's territory is SR-410 country; Cory lives in Buckley, 15 minutes away.
   Takes Robert to ~37 h and Cory to ~39 h. No rule is bent. **The pace numbers make this the
   strongest move on the board** — it takes 8 h off the slowest tech and gives it to the fastest, so
   the real gain is bigger than the hours suggest. Cory's Buckley start is 8 miles from the Enumclaw
   work; Robert drives 15–19 miles to reach it.
2. **Issaquah Highlands 98029 (4 visits) from Alias to Robert.** Small, and it *bends the I-90 rule*
   — 98029 is north of I-90, Robert's ground is south. It is 5 minutes from the Issaquah South work
   he already runs, so it is cheap in drive time and expensive in map legibility. Only worth it as
   part of a bigger Eastside relief.

Neither closes Alias's gap. **At this volume the Eastside is more than one tech**, and that is the
finding to sit with before spring.

---

## Corrections to the 08-12 review

- **There are no Saturday visits.** The review carried "#8230 and #8204 booked Saturday 08-22" as a
  defect. They are not: Jobber returns `startAt` in UTC, Pacific is UTC-7, so any visit starting
  after 17:00 PT reads as the *next day* in the raw string. #8230 at `2026-08-22T01:00:00Z` is
  **Friday 08-21, 18:00 PT**. Checked in Pacific, the board has **zero** weekend visits. Deriving a
  weekday from `startAt.slice(0,10)` invents weekend work that is not there — and "fixing" it would
  have moved three visits off a day they were never on.
- **The churn is bigger than 26.8%.** 311 of 498 visits (62%) changed weekday, not the ~144 (26.8%)
  the review projected. The projection measured churn between two *steady-state maps*; the live
  board also carries ad-hoc bookings that were never on a grid day. No arrival emails had gone out
  for next week, so no customer had been told a day.
- **#8351 Tanya O'Bannon's missing postal code is fixed** — set to 98006 via `propertyEdit`. It was
  unroutable: every territory lookup keys off the zip, so it mapped to no region and no owner.
- **98102 Seattle (Eastlake/Montlake) was in no region at all**, in any map version. Added to
  Tavis's North Seattle block.

---

## Engine changes made to get here

The 08-12 review called the weekday-move pass "not built". It largely was — `rebalance-week.mjs`
already re-deals days from the region rhythm — but it read the *old* day map and balanced the wrong
quantity. Four changes, all in `technician-route-automation/`:

1. **`rebalance-week.mjs` is rhythm-date-aware.** v9 deliberately keeps `regions[].rhythm` at the v8
   values (service-day sheets read it for *today*) and puts the new days in `rhythmChanges`. The
   planner now uses `newRhythm` when the window starts on or after the effective date, and **aborts**
   rather than planning a window that straddles the change.
2. **`--rhythm-override=<file>`** — a week-level day map layered on top, scoped by
   `effective`/`expires` so it cannot outlive its week. Used here as
   `route-engine/data/day-override-2026-08-17.json`.
3. **The day chooser balances minutes, not stop count.** Counting stops assumes every stop costs the
   same; `driveMinPerStop` runs 4.5 in Burien to 18 on the peninsula, so an even split of visits
   still handed one tech a 10.9 h day next to an 8.2 h one.
4. **A balance sweep after the greedy pass.** One greedy pass cannot revisit a decision — whichever
   block settles first owns the light day. The sweep repeatedly moves the visit that most reduces the
   tech's heaviest day, *only* onto a day that visit's own region already runs. This took Tavis from
   6.3/11.1/9.6/9.9/8.5 to 9.0/10.2/8.5/10.1/8.8. The rule that a visit never leaves its region's
   days is untouched.

---

## Open items

- **Tavis's start location was never missing — it is set in OptimoRoute** (Spencer 2026-08-13), so
  next week's routes were planned from his real door and nothing needs re-running. The API key still
  cannot read the string back (`get_drivers` → `AUTH_KEY_UNKNOWN`, and `get_routes` carries no start
  field), so `territories.json` now records it as *set, not readable*, plus the triangulation.

  What the first legs say is worth more than the address anyway — **commute measured over the week
  as planned**:

  | Tech | Commute mi/wk | Hours | Closest first leg |
  |---|---:|---:|---|
  | Cory | **42** | 1.0 | 1.2 mi — Buckley |
  | Alias | 81 | 2.1 | 7.1 mi — Snohomish |
  | Robert | 87 | 2.4 | 8.1 mi — Enumclaw |
  | Luke | 99 | 2.4 | 4.9 mi — Federal Way |
  | **Tavis** | **109** | **2.8** | 14.4 mi — SE Renton |

  Tavis carries the **highest commute on the board**, and his first legs bracket home southeast of
  Renton (~14 mi to 98058, ~21 Normandy Park, ~30 Georgetown). The cut handed him Seattle + Renton
  partly because that ground is central — it is not central to *him*. Worth revisiting once he has
  a few weeks in.

  Two roster homes also look wrong against the routes: **Robert's** closest starts are Enumclaw at
  8.1 mi, which does not fit a Maple Valley 98038 door (~15 mi), and **Luke's** is Federal Way at
  4.9 mi, which does not fit Puyallup 98373 (~12 mi). Both are flagged in `territories.json`.
- **New visits keep landing.** The board moved 495 → 501 during this session alone, and five arrived
  mid-run on the wrong tech. **Re-run the ownership pass and a re-plan tomorrow before 14:00 PT**,
  when Monday's arrival windows email.
- **Ghost orders are still a live trap.** `prune-stale-orders` only sees orders that carry a date, so
  an *undated* leftover is invisible to it and gets pulled into the plan by `start_planning`. Five
  stops looked like ghosts here and turned out to be real new bookings — but the mechanism is real
  and the prune step should be run *after* planning too, not only before.
- **Three visits are marked complete on future dates** (#6400, #5511 Auburn; #6241 Orting). Correctly
  excluded from routing — but a completed visit dated next week is a data oddity worth a look.
- **23 addresses have never been geocoded** and fell back to their zip's default side on the
  geoSplit lines. Run `geo-cache-build.mjs --write` now that they are planned once.
- **Federal Way 98003/98023 is still on loan from Robert to Luke with no end date** — open since
  08-07. Luke has the slack, so leaving it is defensible; it should be a decision, not a drift.

---

## Files

- `data/day-override-2026-08-17.json` — the week's day map adjustment, with the reasoning per block
- `scripts/project-week.mjs` — read-only preview of ownership + day for a real week
- `../technician-route-automation/fix-defects-0817.mjs` — postal-code fix + Pacific-time weekend check
- `../technician-route-automation/drift-runs/rebalance-2026-08-14T01-25-00-383Z.json` — the run report
- `../technician-route-automation/territories-v8-backup-2026-08-13.json` — the v8 map, if this needs undoing
