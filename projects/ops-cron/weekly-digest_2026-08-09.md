## Week of 2026-08-03 — 2026-08-09

### Sessions
- **2026-08-03**: Address-day lookup tool for Muhammad — resolve schedule day from a raw address, joining Jobber + OptimoRoute. Shipped, then intraday-drift/route-horizon investigation kicked off.
- **2026-08-04**: No standalone daily log (only the memory-gap health check ran). Horizon-extend fix approved and built; address lookup published as a live claude.ai artifact.
- **2026-08-05**: Routing redesign — Jobber made source of truth for day/tech, cadence engine rewritten (product + activity + catch, not free text). Muhammad/Cory Jobber onboarding SOPs written; Military/First Responder discount sign bug fixed live. TMCP tag audit re-run: 661 active jobs, MRR $73,090.
- **2026-08-06**: Heaviest day — TMCP-conversion target list (357 leads) + pitch; Quo phone cutover plan for Muhammad; phone-training coaching materials (roleplays #1-7, 63→75); **highway-boundary territory redesign** (v8, 4 territories) built and applied live, ~66% of forward visits were previously misassigned; "miss on a trap = activity" cadence rule shipped; Technician Training Modules 4 & 8 drafted from Cory's real notes; day-level rebalance applied for the week of 08-10.
- **2026-08-07**: No standalone daily log (health check only). Territory boundaries fully resolved (v8-highway "live"); Muhammad went live on phones with scoped duties.
- **2026-08-08**: Cron-only day — 4 route-drift/horizon runs. One clean run created 7 orders + 52 Jobber writes; the Aug 10-14 week has 5 Alias Franks orders that don't fit and were rejected twice — needs a Spencer capacity call.
- **2026-08-09** (today, Sunday): Cron-only day — meeting-clips lane blocked (missing Notion/Zoom/transcription creds, standing issue); CallRail→Jobber sync ran 4x, mostly quiet (Sunday), one repair — Jo Kim call matched to existing client Dongjo Kim, email + property + note filled in.

### Deliverables
- `projects/briefs/technician-route-automation/build-address-day-lookup.mjs`, `service-day-lookup/address-day-lookup.html` — address-first lookup tool for Muhammad (later judged over-built).
- `make-service-day-sheet.mjs` + published artifact `591eb026-…` — the simple grid-only tool the office actually needed, plus `--overlay-week` for one-off route exceptions.
- `cron/jobs/route-horizon-extend.md` (new), `extend-horizon.mjs`, `set-driver-days.mjs --dates=` — keeps OptimoRoute planned 19 days out automatically.
- `projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs`, `move-order.mjs`, `continuity-check.mjs` — Jobber-as-source-of-truth routing rewrite.
- `jobber-notes-automation/decide.mjs` + `engine.mjs` — cadence engine rewrite (product + activity + catch-driven), now live with the "miss = activity" rule.
- `territories.json` — highway-bounded v8 territory map (4 territories, 21 regions/126 zips), applied live (109 reassignments).
- `projects/briefs/callrail-faq/` — Muhammad & Cory Jobber SOPs, phone-training coaching plan + roleplay log, Quo cutover plan, 12 real-call training scenarios.
- `projects/briefs/tmcp-conversion/brief.md`, `target-list.csv` — 357-target reactive-vs-proactive TMCP pitch.
- Technician Training Modules 4 & 8 (`briefs/technician-training-program/`) drafted from Cory's 486 real notes.

### Scheduled Jobs
- 23 active jobs; cumulative totals (since each job's inception) sit at 878 runs / ~72 lifetime failures, current state all green (`last_run` result = success) except one.
- **`weekly-cash-flow-projection` is stuck failing** — last run 2026-07-07, `result: failure`, hasn't produced a successful run since (over a month stale). Needs a look.
- `route-drift-check` carries the most historical failures (11 of 107 runs, ~10%) — mostly benign `ERR_DRIVER_NOT_FOUND` noise from Robert Norton's grid mismatch, not yet cleaned up.
- `route-horizon-extend` self-aborted on 08-08 by design (guard against re-planning a live window) — the Aug 10-14 week still has 5 unplaceable Alias Franks visits pending a Spencer decision.
- Cron runtime itself needed a manual restart mid-week (was stopped since 07-31, discovered 08-03).

### Learnings Added
27 new entries in `context/learnings.md`, all logged on 2026-08-05 and 08-06 (none 08-03/04/07/08/09):
- **tool-jobber**: pagination needs an explicit sort key or rows silently duplicate/drop; `totalCount` on filtered queries is stale — enumerate instead; RRULE write/read prefix asymmetry; no invoice void mutation; classify TMCP/Quick Fix by line item text, not job duration (fixed a 213-client misclassification).
- **technician-route-automation**: date-scope any conformance audit to when the rule started (a "47% match" was really 80% post-cutover); `LEAVE` in the planner ≠ unscheduled; balanced visit counts ≠ balanced hours; a territory change isn't live until the assignment pass reruns.
- **callrail-faq / phone training**: CallRail's flow builder can't be automated (form never marks dirty); grade trainees against their own baseline, not the expert; a pass ceiling beats a hard gate for coachable behavior; mine real call transcripts for training scenarios instead of inventing them.
- **tmcp-conversion**: concurrent sessions can steal each other's commits via `git add -A` — stage explicitly.

### Open Threads
- Aug 10-14 week: 5 Alias Franks orders won't fit — needs Spencer to move or approve overtime.
- `weekly-cash-flow-projection` cron failing since 07-07 — needs diagnosis.
- Robert Norton's grid mismatch (`notWorking` list) still throwing spurious drift-check failures.
- TMCP-conversion Phase 1 texts (Banning/Marinella/Higgs/Ring) not yet sent.
- Quo phone cutover for Muhammad — production dial-destination flip not yet executed.
- Meeting-clips lane still blocked on this install (Notion/Zoom/transcription creds missing) — standing issue, belongs on the Elevate 360 install.
- Technician Training Modules 0-2, 5-7, 9-10 + Guide v2 not started.

### Freshness Check
- **All of `brand_context/`** (assets, authority-strategy, design-system, icp, mole-knowledge-base, positioning, samples, target-keywords, voice-profile, plus the rebrand guidelines and technician field guides) last touched **2026-07-03 — 37 days stale**. None of this week's work (routing, phone training, TMCP pitch) fed back into brand context; worth a check on whether anything from this week (e.g. TMCP pitch angle, phone-training scenario bank) belongs there.
