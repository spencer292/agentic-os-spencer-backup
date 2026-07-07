---
project: technician-route-automation
status: active
level: 2
created: 2026-07-06
---

# Technician Route Automation — Jobber ⇄ OptimoRoute

## Goal

Automate the daily Jobber ⇄ OptimoRoute routing loop so each technician's route
(day, technician, time) is set correctly in Jobber automatically — eliminating
Spencer's ~several hours/week of manual work.

## Current manual process (what we're replacing)

1. **Ingest** — export the Jobber **Visit report** for the target day, import into OptimoRoute.
2. **Optimize** — manually run optimization in OptimoRoute.
3. **Write-back (the painful part)** — go into Jobber and, visit by visit, assign the correct
   technician + time, and occasionally move a visit to the correct day, to match OptimoRoute.
   Several hours per week.

## The automated loop

**Hard safety rule: the automation NEVER writes to the current day.** Once techs are dispatched,
today is frozen — no time-fixes, no re-assignment, no reschedule. All writes apply to
**tomorrow → day 7 only.** Same-day changes stay manual. The twice-daily cadence exists to keep the
*future* window accurate as new jobs arrive, not to edit today.

For each date **tomorrow → day 7** (rolling window), refreshed **twice daily** (evening + morning):

1. Pull that date's active Jobber **visits** via API (the visit-report equivalent).
1b. **Ensure every active visit has a time** — any visit missing one (legacy "anytime"
    visits, ~105/day) gets a wide **07:00–19:00** window set so it enters routing;
    OptimoRoute overwrites it with the real optimized time. (This is a Jobber write —
    gated behind dry-run like all writes.)
2. Create/update them as OptimoRoute orders (`orderNo` = Jobber job number).
3. Run OptimoRoute optimization: `start_planning` → poll `get_planning_status` until `Finished`.
4. Read the optimized routes: `get_routes`.
5. Write back to Jobber: assign technician (`visitEditAssignedUsers`) + set time / move day
   (`visitEditSchedule`), checking `userErrors` on every write.
6. Email `spencer@got-moles.com` a per-run summary.

## Design principles

- **Dynamic roster — no hardcoded technicians.** Read drivers live from OptimoRoute each run,
  match to Jobber users by exact full name (all 4 current drivers verified matching). Scales to
  4–5+ routes: add a driver in OptimoRoute + a Jobber login → auto-picked up, no code change.
- **Build around the existing OptimoRoute setup** — drivers, home start points, territories,
  7am-first-job timing, and overflow logic already work. Mirror OptimoRoute's output; don't re-solve.
- **Freeze today entirely** (see hard safety rule) — techs are dispatched; no writes to the current
  day. Optimize/write tomorrow → day 7 only.
- **Backlog time-fix sweep** (one-time) + ongoing: set 07:00–19:00 on active, not-completed,
  not-cancelled visits missing a time — **excluding today**. Then all such visits route.
- **Overflow (Spencer)** comes from his OptimoRoute driver working-days (currently Tue/Wed/Thu);
  when a full-time replacement is hired, they take a route and Spencer drops out — handled by driver
  availability, no code change.
- **Error-checked write-back** — Jobber returns HTTP 200 even on failures; check `userErrors` and
  surface every failure/skip in the email. Nothing dropped silently.
- **Jobber token refresh step** at run start (avoids the n8n HTTP-200 OAuth auto-refresh bug).

## Acceptance criteria

- Dry-run mode outputs an accurate "what I'd change in Jobber" list that matches a day Spencer
  routed by hand.
- All 4 current drivers resolve automatically (verified — exact name match).
- Adding a 5th driver needs no code change.
- Failures/skips reported by email, never silent.
- Runs unattended twice daily on n8n Cloud.

## Constraints

- n8n **Cloud** → HTTP Request nodes (no native or community Jobber/OptimoRoute node is usable).
- OptimoRoute API key moves into a stored n8n credential; **rotate the currently-exposed key**.
- Jobber GraphQL version `2025-04-16` is near expiry → pin the current latest at build time.
- n8n-only. No site deploy. Personal work stays in `projects/`.

## Verified against live data (2026-07-06 dry-run)

- **Join confirmed:** `orderNo` = Jobber job number. 96/96 OptimoRoute stops matched a Jobber visit,
  0 unmatched either way. Each visit = a distinct job (no same-day multi-visit collision).
- **Roster confirmed:** all 4 drivers (Cammeron Anderson, Cory Ventura, Luke LaVergne, Spencer Hill)
  resolve to Jobber users by exact full-name match.
- **The "204 vs 96" gap = missing times, not a filter:** ~105/day visits sit at "anytime" (00:00) and
  are excluded from routing only because they lack a time. Fix = set times (step 1b), then all route.

## Open build-time verifications

- Rotate OptimoRoute key; create n8n credentials (OptimoRoute query-auth + Jobber client/secret/refresh).
- Confirm Spencer's OptimoRoute working-days are set (Tue/Wed/Thu).
- Confirm "active visit" = not completed / not cancelled (the set-time step must skip those).

## Readiness for unattended running (3 buckets)

1. **Needs your approval/input:** rotated OptimoRoute key; dry-run validation against a hand-routed
   day; sign-off to flip live.
2. **Pauses if not automated:** none by design — ingest, optimize, and write-back all run inside the
   workflow on the n8n Cloud schedule (not dependent on Claude or a chat being open).
3. **Can stall silently (each detected + emailed):** Jobber HTTP-200 hidden errors → `userErrors`
   check; OptimoRoute planning error/timeout → status poll; token/key expiry → loud failure email;
   unmatched driver or unmatched order → flagged in the summary.
</content>
</invoke>
