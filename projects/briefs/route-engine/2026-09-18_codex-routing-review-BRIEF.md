# Review brief: Got Moles technician routing pipeline (Jobber -> n8n -> OptimoRoute -> Jobber)

You are an independent senior reviewer (routing/VRP + integration engineering). You have READ-ONLY access to this repo. Do not edit files. Do not make network calls (no credentials are available and `.env` is off-limits). Work from the code, the specs, and the live-state facts recorded below. Budget: about 45 minutes of investigation. Be thorough, be concrete, and be willing to say the design is wrong.

## The business
Got Moles: mole-control company, Western Washington. 4-5 field techs, each owning one highway-bounded territory. ~500 customer visits per week, ~100-130 stops per weekday, Monday-Friday only. Most work is recurring monthly (Total Mole Control Program, TMCP) plus 5-week weekly "Quick Fix" series. Jobber is the CRM and the SOURCE OF TRUTH for visits (date, assignee, time, arrival window). OptimoRoute is the route optimizer. n8n was the original orchestration layer. Customer arrival-window texts come out of Jobber the afternoon before (14:00 PT D-1), so a day "freezes" then.

## The complaint (owner, 2026-09-18)
"Between n8n and Jobber, on OptimoRoute, we're not getting a useful solution out yet." After ~10 weeks of work the owner still does not get a weekly plan he can trust and run without hand-editing. Your job: identify why, and what to change to get a usable plan out within days, not weeks.

## Live state measured today (2026-09-18, by the orchestrating agent - treat as ground truth)
- n8n: ALL routing workflows are INACTIVE and have ZERO recorded executions. Last edited 2026-07-10. Exported copies of the live definitions are in `.scratch-n8n/live-2026-09-18/*.json` (repo root, gitignored). Workflow names: "Route v2 WF-1 - Push Jobber -> OptimoRoute" (YxKaiU1IAAmMkDLh), "Route v2 WF-2 - Optimize + write-back OR -> Jobber" (QEKz72NTP8YRZsUS), "Route Sync WEEKLY (parent)" (XLhh2TB89NwSlBRX), plus older v1 attempts (gr8kf904tjC2ckcA, gAn73X31rEMQ2cpL, fGNPaCBprD82GG02). The only ACTIVE n8n workflow is an unrelated bare webhook sink. Conclusion to test: n8n is not in the loop at all; the pipeline actually runs as local Node scripts in `projects/briefs/technician-route-automation/` driven by hand (crons for routing were disabled by owner decision 2026-08-12 / 2026-08-21).
- OptimoRoute planned horizon: routes exist through 2026-09-25 only. 2026-09-28 .. 2026-10-09 (10 weekdays) are UNPLANNED. Target horizon is 21 days.
- `extend-horizon.mjs dry` ABORTS: `optimize-plan.json` holds a plan for 2026-09-15..2026-09-20 (332 Jobber writes, 1 unrouted, 1 orphan, 0 day moves, generated 2026-09-14T19:00Z) and it is unknown whether it was ever written back. The script refuses to plan a new window over it.
- Write gate (`projects/briefs/route-engine/write-authority.json`): writesEnabled=false, reason "Revoked.", updated 2026-09-17T18:45Z. Only standing grant: `arrival-window-sweep.mjs` jobEdit. Last live writes: 2026-09-17 ~18:45Z, `rebalance-week.mjs` `visitEditSchedule` x hundreds under a time-boxed grant (ledger `projects/briefs/route-engine/ledger/2026-09-17.jsonl`).
- Cron jobs: `cron/jobs/route-drift-check.md` (RETIRED - in fix mode it re-planned days under the owner while he hand-edited), `cron/jobs/route-horizon-extend.md` (disabled; had been aborting every morning on a stale optimize-plan.json since ~08-07), `cron/jobs/jobber-visit-followups.md` (disabled), `cron/jobs/jobber-arrival-window-sweep.md` (active, jobEdit only).
- The scratch prefix `_` files in technician-route-automation are one-off experiments/logs (355 files in the folder). Non-underscore `.mjs` files are the real pipeline.

## Where to read (in this order)
1. `projects/briefs/technician-route-automation/brief.md` - the v2 architecture and the history.
2. `projects/briefs/route-engine/brief.md`, `projects/briefs/route-engine/2026-08-15_route-engine-spec-v2.md` (spec v2, incl. open questions + defect list), `projects/briefs/route-engine/rules/scheduling-rules.json` (owner-resolved rules), `projects/briefs/route-engine/2026-09-17_30-day-route-territory-review-FERRY.md` (as-built vs intended territories, last 30 days of real visits).
3. Core scripts (technician-route-automation/): `jobber-to-optimo-sync.mjs`, `push-week.mjs`, `optimize-week.mjs`, `extend-horizon.mjs`, `drift-check.mjs`, `rebalance-week.mjs`, `assign-by-territory.mjs`, `write-times-from-plan.mjs`, `write-optimo-times.mjs`, `prune-stale-orders.mjs`, `fetch-window-visits.mjs`, `service-time.mjs` + `tech-service-times.json`, `set-driver-days.mjs`, `replan-day.mjs`, `overtime-relief.mjs`, `rebalance-overflow.mjs`, `geo-side.mjs`, `territories.json`, `territory-grid.json`, `home-slots.json`, `route-config-trials.json`, `optimize-plan.json` (the stuck plan), `route-quality-report.json`, `analyze-route-quality.mjs`.
4. `projects/briefs/route-engine/lib/write-gate.mjs`, `projects/briefs/route-engine/scripts/*.mjs` (snapshot/restore, v9 territories, driver homes).
5. OptimoRoute API client: `.claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs` and `.claude/skills/tool-optimoroute/SKILL.md`. Jobber client: `.claude/skills/tool-jobber/` (scripts + SKILL.md).
6. n8n live exports in `.scratch-n8n/live-2026-09-18/` and repo copies `n8n-workflow.json`, `n8n-parent.json`.
7. `context/learnings.md` sections `## tool-jobber`, `## tool-optimoroute` (search headings) - hard-won API gotchas.

## Standing owner rules you must respect
- Mon-Fri only; any Sat/Sun visit is a defect.
- Product = the job's LINE ITEM (TMCP vs Quick Fix), not jobType. TMCP: any activity or a catch or a trap miss on the last visit -> next visit ~7 days; no activity -> monthly. Quick Fix: always weekly for 5 visits; when exhausted with activity outstanding, FLAG for sales, never auto-add.
- Territories are bounded by HIGHWAYS (I-90, SR-18, SR-410/SR-167, I-705), one tech per territory; three boundaries cut through zip codes and are resolved per address (`geo-side.mjs`).
- The owner sets the service DAYS; the router may move a day only for overtime and only with his approval. "SET" in a visit title is a guess, not a customer promise.
- Never compare tech load by visit count, compare hours. Working day = first job to last job; commute unpaid; one tech (Cory) is salaried.
- Per-tech service times are DIRECTED numbers (Cory 12 min check / 24 set; others 15/30) in `tech-service-times.json`; cluster pricing (e.g. 11 jobs in one condo complex priced as one 120-min stop).
- OptimoRoute facts learned: SYNC unschedules, UPDATE is safe; balancing=ON_FORCE reassigns - use OFF; `stop.distance` is metres, `route.distance` km; the OR map accumulates ghost stops (orders for cancelled/moved visits are never retired) - prune before judging; Jobber returns no lat/lng, coordinates come from OptimoRoute.
- Jobber: `visitEditAssignedUsers` REPLACES the assignee list; it can fail transiently with "required to handle future items" on recurring visits (retryable).
- Service day per zip should be derived from real Jobber visit history, not the territory grid (history matches 90% vs grid 73%).
- No automation writes on a timer until the pipeline is proven (owner decision 2026-08-21). A cron blocked by the write gate is the gate working.

## What I want from you
Produce a written review, markdown, in this structure:

### A. Diagnosis in one page
Why, after ten weeks, does this pipeline not produce a plan the owner can run? Name the top 3-5 root causes, ranked. Distinguish DESIGN causes (the shape of the pipeline: source of truth, sync direction, horizon, freeze rules, human gates) from DEFECT causes (bugs) from OPERATIONAL causes (stale state, disabled crons, unarchived plans, manual-edit collisions). Be blunt about whether the n8n layer is dead weight.

### B. Concrete defects (the code)
Each: severity (blocker / major / minor), file:line, what it does wrong, a concrete input/state where it produces a wrong route or a wrong Jobber write, and the fix. Mark each CONFIRMED (you traced the code) or SUSPECTED. Prioritize: the OptimoRoute request builders (orders: duration, time windows, priority, location, driver assignment, dates; planning params: balancing, start/end locations, working hours, service times; polling), the write-back path (which Jobber fields get written, idempotency, what happens on partial failure), horizon/extend and stuck-plan handling, ghost/stale order handling, and the assignee/territory resolution.

### C. Is OptimoRoute being used the way it should be?
Given ~500 stops/week, 5 drivers, fixed territories and fixed service days: is the daily-locked, per-day planning shape right? Should orders be created with driver locks, day locks, or neither? Are time windows / service durations / start locations / balancing set sensibly? What is the minimal correct call sequence (create/update orders -> start_planning -> poll -> get_routes -> write back) and where does the code deviate?

### D. The Jobber <-> OptimoRoute contract
State precisely what should flow in which direction, what is the key (visit id? order number?), what must never be overwritten, and where the current code violates that. Include the "owner hand-edits in Jobber while automation runs" collision problem and the D-1 14:00 freeze.

### E. Recommendations, ranked by (value / effort)
1. What to do THIS WEEK to get one usable, trustworthy week plan out (steps, in order, with the exact scripts or the smallest code changes).
2. What to delete or stop (scripts, crons, workflows, the n8n layer?).
3. What to build or change structurally (only if it is needed to get a usable solution; no wish lists).
4. How to verify it worked: 5-8 measurable checks (e.g. per-tech hours first-job-to-last-job, overtime hours, off-territory stops, weekend visits, ghost orders, unplanned weekdays inside 21 days, Jobber-vs-OR mismatch count).

### F. Questions only the owner can answer
Max 6, each one sentence, each with why it matters.

Rules for the write-up: cite `path:line` for every code claim; quote at most 3 lines of code per finding; never invent a file or function; if you did not verify something say SUSPECTED; no praise, no summary of what you read; US English.
