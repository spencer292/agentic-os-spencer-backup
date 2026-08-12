## Week of 2026-08-10 — 2026-08-10

Note: today (2026-08-10) is this week's Monday, so this digest covers a single day — the prior week (2026-08-03–08-09) is in `weekly-digest_2026-08-09.md`.

### Sessions
- **2026-08-10** (cron-only day so far, 3 runs):
  - Ninety scorecard push — clean. Weeks 07-20..08-03, 47 pushed / 0 failed. TMCP tags stable (647 active, 18 churned, no delta since 08-03).
  - Route-horizon-extend — **self-aborted at dry run**. It correctly found the next window to plan (08-17..08-28) but refused to proceed because `optimize-plan.json` still holds an unwritten plan for 08-10..08-14 (2 Jobber writes, 2 tech changes, generated 08-07). Planning ahead would overwrite it, so nothing was pushed.
  - Phone-lookup rebuild (address-day + service-day sheet) — ran clean against the pinned v5 grid (3,982 addresses, 126 zips, unrouted down to 2, tech-clash down to 0). Three things didn't go clean: hosted artifact publish is still broken (3rd straight day), the 08-17 overlay came back empty because OptimoRoute has no routes that far out yet, and the v5 grid roster is stale (missing Robert Norton, doesn't reflect the Cory→Tavis 08-17 handover).

### Deliverables
- `projects/briefs/got-moles-scale/scorecard-runs/2026-08-10*.json`, `runs.log` — Ninety scorecard push run record.
- `projects/briefs/technician-route-automation/service-day-lookup/*` — rebuilt phone-lookup outputs (address lookup + service day sheet), 2026-08-10 build stamp.

### Scheduled Jobs
- 24 active jobs; last 7 days (08-04–08-10): **0 failures** — every job's most recent run completed successfully. Scattered `is_error:true` entries in logs are transient retried tool calls inside otherwise-successful runs, not run failures.
- **`weekly-cash-flow-projection` still broken** — stuck on its one and only run, 2026-07-07, `result: failure`. Outside this week's window but over a month stale and unaddressed; needs a look.

### Learnings Added
- None this week. Last addition to `context/learnings.md` was 2026-08-06 (46 entries across 08-04–08-06 covering Jobber API gotchas, TMCP/Quick Fix misclassification, territory/routing rules, and phone-training scoring — already reported in the 08-09 digest).

### Open Threads
- `optimize-plan.json` for 2026-08-10..14 unresolved — Spencer needs to either run `optimize-week.mjs write` (if the 2 pending Jobber writes still need applying) or archive the file if already applied. Until cleared, the horizon stays frozen at 08-14 and the week of 08-17 has **no routes at all**.
- Two visits need a manual look: **#8336 Dale Hoff** (Tacoma 98407, Wed 08-12, Luke — post-plan booking, unrouted) and **#4962 Maureen Haley** (Auburn 98092, Tue 08-11, Robert — off-day for the grid).
- Hosted artifact publish is broken from this cron install for a 3rd consecutive day — office-facing lookup links are ≥3 days stale; needs either an interactive-session publish or a different host path this job can write to.
- v5 grid roster promotion to v8-highway still pending (Spencer's call) — must update both `--grid` pin points together when done.
- Longer-running threads from last week (5 Alias Franks orders that don't fit 08-10..14, Quo phone cutover, TMCP-conversion Phase 1 texts, meeting-clips lane blocked, Technician Training Modules 0-2/5-7/9-10) are not confirmed resolved or unresolved by today's logs — see `weekly-digest_2026-08-09.md` for status as of Sunday.

### Freshness Check
- **All of `brand_context/`** (voice-profile, positioning, icp, assets, design-system, authority-strategy, mole-knowledge-base, samples, target-keywords, technician field guides, rebrand asset set) last touched **2026-07-04 — 37 days stale**, unchanged from last week's check. Nothing from this week's work has fed back into brand context.
