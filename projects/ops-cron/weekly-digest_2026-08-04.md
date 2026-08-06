## Week of 2026-08-03 — 2026-08-04

### Sessions
- 2026-08-03: **technician-route-automation / callrail-faq** — build Muhammad an address-lookup tool (types an address, gets the scheduled day) resolved against Jobber + OptimoRoute, not just the zip grid — shipped as an offline snapshot HTML; also scoped and partly built the intraday/new-booking routing gap (route-horizon-extend).
- 2026-08-04: Same project continued — address lookup published live as a claude.ai artifact; planning horizon raised 12→19 days; found and guarded a single-plan-slot design flaw in `optimize-week`. Later in the day: an emergency 37-job routing run to beat the Aug 5 OptimoRoute cutoff, plus ongoing per-day drift-fix monitoring running into the night (Aug 5 done clean, Aug 6/7 in progress at day's end). Separately, Muhammad's phone-training "Three Moves" scorecard (15/30, call graded against his own transcript) was written and pushed to Notion.

### Deliverables
- `projects/briefs/technician-route-automation/build-address-day-lookup.mjs` — read-only builder joining 4,427 Jobber properties + OptimoRoute planned routes to the territory grid.
- `projects/briefs/callrail-faq/service-day-lookup/address-day-lookup.html` (+ `muhammad-portable/` copy) — the office tool; now also published live at a claude.ai artifact URL (must republish with `url=` to keep the same link).
- `cron/jobs/service-day-sheet-refresh.md` — rewritten to build the address lookup before the zip sheet, model raised to opus.
- `cron/jobs/route-horizon-extend.md` (new) — weekdays 06:15, opus; keeps OptimoRoute planned ~19 days ahead so new bookings stay visible to drift-check.
- `cron/jobs/lead-alert.md` (new).
- `projects/briefs/technician-route-automation/set-driver-days.mjs` / `extend-horizon.mjs` (new) — chained day-extension scripts, dry-run verified.
- `projects/briefs/technician-route-automation/drift-check.mjs`, `optimize-plan.json`, `territory-grid-v5.json`, `last-push-manifest.txt` — HORIZON_DAYS 12→19, single-plan-slot guard added.
- `projects/briefs/technician-route-automation/drift-runs/2026-08-05T00-01-42-664Z.json` — abort report: 27 missing orders exceeded the 15-order safety cap for Aug 10-14, no writes made.
- `projects/briefs/callrail-faq/2026-08-03_service-day-scripts.md` — call script rewritten around the new address lookup.
- `projects/briefs/callrail-faq/2026-08-04_the-three-moves-muhammad.md` (+ Notion) — training handout and scorecard, mirrored to `muhammad-portable/`.
- `projects/briefs/callrail-faq/2026-08-04_closing-language-and-call-1-debrief.md`.

### Decisions
- OptimoRoute is the authority on **which day** a job is scheduled; Jobber only fills gaps beyond the planning horizon (Spencer, 2026-08-03).
- Address lookup ships as a baked offline snapshot (06:45 daily rebuild), same distribution pattern as the existing zip lookup — Jobber creds can't live on Muhammad's machine.
- Planning horizon raised 12→19 days; drift-check's scan window and extend-horizon's plan window must always match, or newly-planned days go stale silently.
- Emergency override authorized to insert 37 unrouted jobs ahead of the Aug 5 cutoff, accepting that ~30 already-communicated arrival windows would shift.
- Duplicate Jobber properties (81 addresses / 91 extra records) merged inside the lookup tool only — not fixed at the source; feeds the existing `jobber-duplicate-cleanup` thread.

### Scheduled Jobs
- 23 jobs configured. `route-drift-check` was the week's heaviest lane: 69 lifetime runs / 10 lifetime failures — 7 more runs happened this week with **zero new failures**, consistent with the Aug 5 emergency push and ongoing per-day drift-fix monitoring.
- `callrail-jobber-sync` has the highest overall volume (132 runs / 19 fails, ~14%) — no new deliverable or fix logged against it this week.
- **`weekly-cash-flow-projection` has not run since 2026-07-07 and its one run failed** — effectively dead for 4 weeks. Worth a look next session.
- All other jobs show a healthy last run and "success" status as of today (2026-08-04/05).

### Learnings Added
- None this week — most recent dated entries in `context/learnings.md` are from 2026-08-01 (territory/routing lessons from the prior grid re-cut).

### Open Threads
- **`extend-horizon.mjs live` for Aug 10-14 (357 writes) is still blocked** by the Claude Code permission classifier — needs Spencer to run it himself or grant the permission.
- **Drift-check aborted on Aug 10-14**: 27 missing orders exceed the 15-order safety cap, plus 155 day-drift / 156 tech-drift divergences between Jobber and OptimoRoute across the planned week. Needs Spencer's call on which system is source of truth before a fix pass runs.
- Two date clashes flagged 08-03 (#7662 James Harnish, #7962 Joann Mortenson — customers notified off the wrong date) were not confirmed corrected in this week's logs.
- Robert Norton (in the grid's `notWorking` list but not an OptimoRoute driver) still throws 5 benign `ERR_DRIVER_NOT_FOUND` fails every `set-driver-days` run — cosmetic but buries real failures in cron output.
- `weekly-cash-flow-projection` dead since 2026-07-07 (see Scheduled Jobs above).

### Freshness Check
- All 11 `brand_context/*.md` files (assets, authority-strategy, design-system, icp, mole-knowledge-base, positioning, samples, target-keywords, technician field guides, voice-profile) last committed **2026-07-03 — 32 days old**, past the 30-day flag. Nothing in this week's work touched brand context directly, but worth a refresh check before the next content or positioning push.
