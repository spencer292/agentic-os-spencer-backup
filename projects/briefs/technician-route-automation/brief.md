---
project: technician-route-automation
status: active
level: 2
created: 2026-07-06
---

# Technician Route Automation — Jobber ⇄ OptimoRoute

> **ARCHITECTURE v2 (2026-07-10) — supersedes the monolith below.** Spencer's decision: split into
> small single-purpose workflows. The v1 parent/child stack is deactivated + defused (dryRun=true,
> maxWrites=0) and will be retired once v2 is live. v1 content below kept for reference — the
> write-back mechanics, pagination, auth, and freeze-guard patterns all carry into v2.

## v2 — Multi-workflow architecture & rules (agreed 2026-07-10)

### WF-1 — Push (Jobber → OptimoRoute)
Create OR orders for active future visits in the window (today+1 → +7; morning variant includes today).
- **Safe creation only:** per-order `create_order` (the only endpoint that geocodes),
  `operation: CREATE`, orderNo unique per Jobber **visit** (never bare job number — recurring
  customers reuse job numbers; bulk update-matching by orderNo is what scrambled the board on 07-06).
- **Territory lock:** `assignedTo.serial = <Jobber tech full name>` — hard constraint; the optimizer
  can never hand a job to a different tech. Visit with no tech → flagged in Notion log, never guessed.
- **Day flexibility:** regular visits get `allowedDates {from: today+1, to: +7}` (any day that week).
  **Sets (first visits) are date-fixed** via `allowedDates {from: <day>, to: <day>}` — promised days
  hold; if a set doesn't fit its day, it comes back *unscheduled* and is flagged for Spencer's
  decision (toggle available to let sets slide instead).
- **Priority is ALWAYS `M`, on every order (policy 2026-07-12).** OR serves higher-priority orders
  earlier in the day, which warps routes (~20% worse — root cause of the Kenmore zigzag). Never
  encode promises as priority; real promised times go in as order `timeWindows` only.
- **Durations:** standard trap check = 10 min; set = 20 min (adjustable — Spencer said "a little longer").
- **Hygiene:** before pushing, delete only orders this automation created (own orderNo pattern) in
  the window. Never `delete_all_orders`. Never touch foreign orders.

### WF-2 — Optimize + write-back (OptimoRoute → Jobber)
- `start_planning` over the whole window with `dateRange`, `balanceBy: WT`, `clustering: true`
  (density = objective function; overflow jobs land on the day whose route passes closest — this IS
  the proximity rule), poll → `get_routes` per date.
- **Work window (hard):** all 3 techs 07:00–18:00 (`workTimeFrom/To` on each OR driver — verify
  once in OR UI; `update_driver_parameters` unschedules routes, so don't set it per-run). Target
  <10h/day, accepted that busy season runs longer — 18:00 is the ceiling.
- **Write-back:** `visitEditSchedule` (time + day move) with `userErrors` checked; +3h customer window.
- **Delta guard:** abort + loud Notion log if the plan moves >40% of a day's visits across days.
- **Move report:** EVERY cross-day move listed in the Notion log (sets called out separately) so
  Spencer can communicate with customers.

### WF-3 — Time-fix (parked until WF-1/2 proven)
Set a time on every future "anytime" visit. Runs only in the evening after field hours so no
customer gets a same-day notification about a visit that isn't coming.

### Drift check — LIVE as an Agentic OS cron (2026-07-13, interim until WF-1/2)
`cron/jobs/route-drift-check.md` runs `drift-check.mjs fix` every 2h, 09:00–17:00 PT daily
(Spencer authorized auto-fix). Diffs the Jobber board vs the OR plan for every OR-planned future
day: new Jobber bookings missing from OR are created (SYNC, geocoded, locked to Jobber day+tech,
priority M), that day is re-planned with all existing stops locked to day+tech (balancing OFF),
verified (any day/tech change on an existing stop aborts with zero writes), and times written back
to Jobber. Day/tech/time drift on EXISTING orders is report-only — a hand-move in Jobber may be
deliberate. Frozen days (14:00 PT D-1 email cutoff): order created in OR, no re-plan, no writes,
flagged. Max 15 creations/run. Reports in `drift-runs/`. This logic folds into WF-2 at rebuild.

### WF-4 — Tech-added-visit watcher (parked / later)
Jobber events already stream into n8n (`gFYppNw0cFZKuHpA` webhook, HMAC-signed) — future trigger source.

### Cadence & freeze rule (v2.1 — email-driven, agreed 2026-07-10)

**The real freeze line is the customer email: Jobber emails arrival windows the day before at
~14:00 PT. A date locks at 14:00 on D-1.** Today is never writable (its email went out yesterday).
After 14:00, tomorrow is locked too. Encoded as a hard guard in WF-1's Window node.

- **Weekly baseline (Friday):** window logic is week-based — Mon–Thu runs cover only the remainder
  of the current week; from Friday the window extends through the end of NEXT week. So Friday's
  run batch-optimizes the entire week ahead in one shot (max density, full freedom) = the baseline.
  Not a special mode — it emerges from the window rule + pin rule.
- **Pin rule (baseline → incremental, automatic):** any visit that already has a real time in
  Jobber was slated by a previous run → its DAY is pinned (`allowedDates` = that day only); the
  optimizer may only tighten its time until the email cutoff. Only still-"anytime" visits (new
  bookings) float across days. Sets always pinned. This is "once slated, those people stay;
  new callers get added into the routes."
- **Runs 2×/day: ~04:30 and ~13:00 PT.** The 13:00 run is the final pass for tomorrow before its
  14:00 emails; 04:30 catches overnight changes. (Manual fill-ins between runs remain fine.)

### Re-launch gate (unchanged)
Build → full dry run compared against a hand-routed day → single-visit live test → raise caps →
only then activate schedules. Both v1 workflows stay off throughout.

---

## v1 reference (superseded)

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
