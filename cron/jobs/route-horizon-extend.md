---
name: Route Horizon Extend (19 days)
time: '06:15'
days: mon,tue,wed,thu,fri
active: 'true'
model: opus
notify: on_finish
description: 'Every weekday before the office opens: make sure OptimoRoute has routes planned 19 days out — two full weeks beyond the current one, so a new booking always has a day to land on. Without it, route-drift-check silently ignores every new client booked past the last planned day — which is most of them.'
timeout: 30m
retry: '0'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context. Background: `projects/briefs/technician-route-automation/brief.md`.

**Why this job exists.** `route-drift-check` inserts new Jobber bookings into OptimoRoute within two
hours, but only on days OptimoRoute has *already planned* — an unplanned day is not drift, so it is
skipped. On 2026-08-04 OptimoRoute was planned one week out while 312 Jobber visits sat on Aug 10-14
and 2,071 through October with no route to join. This job keeps the planned horizon ahead of the
booking window so that automation actually covers new clients (Spencer 2026-08-04).

1. From the repo root, run:
   `node projects/briefs/technician-route-automation/extend-horizon.mjs dry`

   Read the output. It reports which weekdays inside the 19-day horizon have no routes.

2. **If it says "Horizon already full" — stop and report one line.** That is the normal outcome most
   days. Do not run anything else.

3. **If it aborts with "already-planned day(s) fall inside the window" — stop and report loudly.**
   That means the horizon is not a clean tail and extending would re-plan live days. It needs
   Spencer, not a retry.

3b. **If it aborts with "optimize-plan.json holds an un-written plan" — stop and report loudly.**
   A previous week was planned but never written back to Jobber, so Jobber and OptimoRoute disagree
   about that week right now. Quote the window and the write count. **Never pass `--discard-plan`
   to clear it** — that throws away the only record of those pending writes. Running
   `optimize-week write` is a live Jobber write across hundreds of customer visits and is Spencer's
   call, not this job's.

4. Otherwise run:
   `node projects/briefs/technician-route-automation/extend-horizon.mjs live`

   This chains four already-guarded scripts over ONLY the unplanned days: `set-driver-days --dates=`,
   `push-week --from --to --grid`, `optimize-week plan`, `optimize-week write`. The chain stops at the
   first failure and runs nothing further.

5. Report:
   - The window added and the per-day stop counts.
   - Anything the chain refused: push-week's `zip-not-in-grid` count (those visits get no route —
     name them, they are a grid gap), and any `grid-day frozen` skips.
   - If `optimize-week write` reported userErrors or hit its delta guard, quote it verbatim.
   - If the chain stopped early, say exactly which step and that the day is now half-pushed.

Rules:
- **Never pass `--override-freeze`, and never widen the window by hand.** The window is computed from
  what OptimoRoute has already planned; that computation is the guard that keeps this off live days.
- The grid is pinned to `territory-grid-v5.json`. If Spencer promotes v5 to `territory-grid.json`,
  update the `--grid` default in `extend-horizon.mjs` in the same change.
- This job writes to live routes and to Jobber. It runs on opus deliberately (field-ops floor,
  CLAUDE.local.md 2026-07-26) — do not downgrade the model to save tokens.
- It runs weekdays only. A weekend run would plan days no one works.
- Expect a real run roughly once a week, when a fresh week enters the horizon; the other days are
  no-ops. A run that pushes hundreds of orders every single day means the horizon computation is
  broken — flag it.
