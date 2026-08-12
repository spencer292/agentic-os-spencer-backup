## Week of 2026-08-03 — 2026-08-08

### Sessions
- 2026-08-03: Address-day lookup tool for Muhammad — built, then found overbuilt (customer-record tool vs. the simple day-lookup the office actually needed).
- 2026-08-04: Routing redesign diagnosis + Jobber-notes cadence engine rewrite; arrival-window freeze removed; `--execute` flipped live on visit-followups; address lookup published live as a Claude artifact; OptimoRoute planning horizon raised 12→19 days.
- 2026-08-05 (3 sessions): Jobber-truth routing model + cadence rewrite; Muhammad/Cory Jobber training SOPs (found and fixed two mispriced discount products); TMCP tag audit re-run (661 active jobs, tag gap closed, $200/mo billing recovered).
- 2026-08-06 (6 sessions): TMCP conversion target list (357 targets) + pitch framing; Muhammad's phone line built on Quo (CallRail limits worked around) and live-authorized for 2026-08-07; role-play coaching program + live cutover prep; territories.json rebuilt on Spencer's highway boundaries (v7, 4 territories) with cadence engine switched to `--execute`; Technician training Modules 4 & 8 drafted from Cory's real notes — produced the "miss counts as activity" cadence fix (44 visits corrected from monthly to weekly).
- 2026-08-07: Highway territory map finalized (v8, 22 regions/128 zips, geo-split lines for boundaries that cut through zips); live reassignment (854 visits) and Jobber/OptimoRoute sync completed, week rebalanced to nobody over 9h; simple office-facing service-day lookup published as a Claude artifact with a one-week exception overlay; Muhammad went live on phones today.
- 2026-08-08 (4 sessions, all scheduled cron runs — no interactive work): `extend-horizon` self-aborted at its dry-run guard, still blocked pending Spencer; `drift-check` ran three times — one self-aborted mid-replan (a stop vanished, zero writes made), one clean run (7 orders created, 52 Jobber writes), one clean run that surfaced a hard capacity wall (5 new Alias Franks orders for Thu Aug 14 created in OptimoRoute but rejected by the locked replan — unscheduled, 0 Jobber writes).

### Deliverables
- `projects/briefs/technician-route-automation/territories.json` — v8-highway, 22 regions/128 zips, replaces zip-name grid v1-v7
- `projects/briefs/technician-route-automation/assign-by-territory.mjs`, `rebalance-week.mjs`, `geo-side.mjs`, `geo-cache-build.mjs` — new routing tooling
- `projects/briefs/technician-route-automation/2026-08-07_highway-territory-map-REVIEW.md` — zip-by-zip map + open items
- `projects/briefs/jobber-notes-automation/decide.mjs`, `engine.mjs` — cadence engine rewrite (product + activity + catch/miss based), now running `--execute`
- `projects/briefs/tmcp-conversion/brief.md` + `data/target-list.csv` — 357 ranked upsell targets
- `projects/tool-jobber/2026-08-05_tmcp-tag-audit.md` — 661 active TMCP jobs, tag gap closed, $200/mo recovered
- `projects/briefs/callrail-faq/` — Muhammad phone training pack (closing-language debrief, three-moves card, five-beat card, coaching plan, ChatGPT roleplay prompt), Quo softphone cutover
- `projects/briefs/technician-training-program/modules/04-property-walk.md`, `08-jobber-notes.md` — new/promoted training modules
- `service-day-lookup` artifact (office tool) + `address-day-lookup` artifact (internal record lookup) — both live and republished nightly by `cron/jobs/service-day-sheet-refresh.md`
- `projects/briefs/technician-route-automation/drift-runs/2026-08-08T20-05-56-270Z.json`, `2026-08-08T21-02-56-773Z.json` — daily drift-check run reports (new this week's tail, cron-generated)

### Decisions
- Territories are bounded by highways, not zip/city names (Spencer, authoritative) — 4 territories, one owner each.
- Jobber is source of truth for day/tech; OptimoRoute only re-sequences and hands times back.
- Cadence: Quick Fix always weekly; TMCP weekly on any activity, catch, OR a trap miss (miss now counts as activity — 2026-08-06 rule); monthly only when truly quiet.
- Product identified by line item, not `jobType` — every Got Moles job is technically "Recurring."
- Muhammad live on phones 2026-08-07 with scoped duties (residential ≤5 acres; commercial/bids → Cory; refunds/legal → Spencer).
- Never compare tech workload by visit count — compare hours (drive-min/stop varies 4.5-18 min across the territory).
- No new redirection this week: 2026-08-08's sessions were all cron runs operating inside the above policies, not new decisions.

### Scheduled Jobs
- **~420 runs this week across 24 jobs, 2 real execution failures** (counted from each log's own START/SUCCESS/FAILURE/TIMEOUT markers, not narrative text — cross-checked against `status/*.json` lifetime totals, which matched exactly):
  - `route-drift-check` — 43 runs, 1 failure (2026-08-06 19:02, 67s: Jobber write-back rejected 2 of 22 writes, exit code 1). Session logs also show a *separate, correctly self-aborted* run on 2026-08-08 (post-replan verify caught a vanished stop, `8224-2281716866` — zero Jobber writes, no retry, working as designed, not counted as a failure).
  - `route-horizon-extend` — 4 runs, 1 failure (2026-08-05 13:16, 36s — its only-ever failed run; the job is brand new). Also self-aborted (not failed) at its dry-run guard on 2026-08-08, still blocked pending Spencer clearing the pending 08-10..08-14 plan.
  - Everything else this week — `callrail-jobber-sync` (65 runs), `lead-alert` (209 runs), `jobber-arrival-window-sweep` (9), and 18 more daily/weekly jobs (5 runs each) — clean, 0 failures.
- **`weekly-cash-flow-projection` had 0 runs this week** — still stalled since its one and only (failed) run on 2026-07-07, over a month ago. Unchanged from last week's flag — still needs a look.
- **Meeting-clips-lane and gmail-daily-triage ran clean (5/5, 0 failures) per their execution markers, but are known-broken on this install** (per standing memory: no Notion token / no Gmail OAuth creds in `.env`) — "success" likely reflects a graceful no-op rather than real work completed. Worth confirming they're not silently skipping.

### Learnings Added
- `context/learnings.md` touched in 8 commits, all landing 2026-08-05 and 2026-08-06 (nothing new committed 08-07 or 08-08): Jobber-source-of-truth routing model, cadence engine fix, TMCP tag-audit findings (multiple new `## tool-jobber` entries — RRULE prefix, no invoice-delete mutation, sweep-by-status, stale `totalCount`, product line-item classification, live-record-moves-mid-run, etc.), a dozen `## technician-route-automation` entries (region rhythm, driver availability per-date, OptimoRoute balances drivers not days, etc.), 6 `## ops-phone-roleplay` entries (grade-from-trainee's-level, mine real calls for scenarios, admin fields need a job), TMCP conversion pitch framing, and Muhammad/Cory Jobber onboarding SOPs.
- Note: `context/learnings.md` still has two separate `## tool-jobber` sections (pre-existing drift, not merged this week) — new entries keep going into the first/active one.

### Open Threads
- **NEW — Thursday Aug 14 is at capacity for Alias Franks.** 5 orders (#5201, #7472, #5004, #8224, #8213) have been created in OptimoRoute twice now (2026-08-08 sessions 3 and 4) but rejected by the locked replan — unscheduled, 0 Jobber writes. This will keep re-surfacing on every drift-check run until Spencer either moves them to another day/tech or accepts overtime.
- **`optimize-plan.json` for 2026-08-10..2026-08-14 is still unwritten** (2 pending Jobber writes, 2 tech changes) — confirmed still open as of 2026-08-08 Session 1. This is also why the tech-drift report-only backlog (29 entries: Robert↔Cory, Spencer↔Luke, Tavis↔Robert, Tavis↔Cory) hasn't cleared — it won't until the plan is applied or archived.
- Tavis Alexander's home address still unknown ahead of his 08-17 handover into Cory's territory.
- 44 already-booked TMCP visits from the miss=activity bug are not backfilled — the engine fix only affects notes dated after 2026-08-06.
- 16-visit Aug 3-4 cadence catch-up never run (needs an `--execute` approval); worst case is 36 days out.
- Muhammad's live-call days (2026-08-07 onward) still need grading against the same rubric as his role-play calls — the live-vs-roleplay delta remains unmeasured.
- `#7999` (Peter Kisbye) still fails Jobber reassignment ("required to handle future items") after repeated retries.
- `98363` Port Angeles zip on a Puyallup address (#7723 Chad Peterson) still unrouted — carried over multiple sessions.
- Two unresolved Jobber tag/billing anomalies from the TMCP audit: Mike Kaiser #5390 (holds both `TMCP - Active` and `TMCP Churned`), and a sweep for other clients with a manual "FINAL BILL" phantom past-due (same shape as the Larry Lemmon case) not yet run.
- `weekly-cash-flow-projection` cron still appears dead (see Scheduled Jobs) — needs a look.

### Freshness Check
- All 12 `brand_context/` files (including `rebrand/GOT_MOLES_BRAND_GUIDELINES.md`) last modified **2026-07-03** — 36 days ago, over the 30-day threshold. None updated this week. This week's work stayed almost entirely operational (routing, cadence, TMCP pitch, phone training) rather than brand/marketing, so this may still be a non-issue — flagging per the freshness check, not a hard recommendation.
