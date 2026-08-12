## Week of 2026-08-03 — 2026-08-07

### Sessions
- 2026-08-03: Address-day lookup tool for Muhammad — built, then found overbuilt (customer-record tool vs. the simple day-lookup the office actually needed).
- 2026-08-04: Routing redesign diagnosis + Jobber-notes cadence engine rewrite; arrival-window freeze removed; `--execute` flipped live on visit-followups.
- 2026-08-05 (3 sessions): Jobber-truth routing model + cadence rewrite; Muhammad/Cory Jobber training SOPs (found and fixed two mispriced discount products); TMCP tag audit re-run (661 active jobs, tag gap closed, $200/mo billing recovered).
- 2026-08-06 (6 sessions): TMCP conversion target list (357 targets) + pitch framing; Muhammad's phone line built on Quo (CallRail limits worked around) and live-authorized for 2026-08-07; role-play coaching program + live cutover prep; territories.json rebuilt on Spencer's highway boundaries (v7, 4 territories) with cadence engine switched to `--execute`; Technician training Modules 4 & 8 drafted from Cory's real notes — produced the "miss counts as activity" cadence fix (44 visits corrected from monthly to weekly).
- 2026-08-07: Highway territory map finalized (v8, 22 regions/128 zips, geo-split lines for boundaries that cut through zips); live reassignment (854 visits) and Jobber/OptimoRoute sync completed, week rebalanced to nobody over 9h; simple office-facing service-day lookup published as a Claude artifact with a one-week exception overlay; Muhammad went live on phones today.

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

### Decisions
- Territories are bounded by highways, not zip/city names (Spencer, authoritative) — 4 territories, one owner each.
- Jobber is source of truth for day/tech; OptimoRoute only re-sequences and hands times back.
- Cadence: Quick Fix always weekly; TMCP weekly on any activity, catch, OR a trap miss (miss now counts as activity — 2026-08-06 rule); monthly only when truly quiet.
- Product identified by line item, not `jobType` — every Got Moles job is technically "Recurring."
- Muhammad live on phones 2026-08-07 with scoped duties (residential ≤5 acres; commercial/bids → Cory; refunds/legal → Spencer).
- Never compare tech workload by visit count — compare hours (drive-min/stop varies 4.5-18 min across the territory).

### Scheduled Jobs
- 23 jobs tracked in `cron/status/`; all reporting `success` on their most recent run as of 2026-08-07 except one.
- **`weekly-cash-flow-projection` is stalled**: only 1 run ever recorded, failed, dated 2026-07-07 — a month with no successful (or retried) run. Worth checking whether this job is still wired up.
- Highest cumulative fail counts (all-time, not week-only): `route-drift-check` 11/96 (~11%), `weekly-memory-gaps` 3/18, `daily-memory-distill` 2/19, `jobber-visit-followups` 2/19, `meeting-clips-lane` 2/18, `weekly-activity-digest` 2/16, `weekly-memory-curator` 2/18, `monthly-learnings-health` 2/18, `skill-update-check` 2/19. Status files only carry cumulative totals, not week-scoped deltas.
- Cron runtime was confirmed **stopped** as of 2026-08-03 (last heartbeat 2026-07-31) — flagged as an open thread that week; status files now show runs through 2026-08-07/08, so it was restarted at some point this week (exact restart time not logged).
- `route-drift-check` aborted a write on 08-08 00:03 (post-replan verify caught a vanished stop, #8213) — correctly made zero Jobber writes and left a report for Spencer instead of guessing.

### Learnings Added
- `context/learnings.md` touched in 8 commits this week (2026-08-05 and 2026-08-06): Jobber-source-of-truth routing model, cadence engine fix, TMCP tag-audit findings (6 new `## tool-jobber` entries — RRULE prefix, no invoice-delete mutation, sweep-by-status, stale `totalCount`, etc.), TMCP conversion pitch framing, Muhammad/Cory Jobber onboarding SOPs, and the Muhammad phone-cutover plan.
- Note: `context/learnings.md` has two separate `## tool-jobber` sections (pre-existing drift, not merged this week) — new entries are going into the first/active one.

### Open Threads
- **Territory writeback pending Spencer's review** — `rebalance-week.mjs writeback` for Aug 10-14 not yet run.
- **Tavis Alexander's home address still unknown** ahead of his 08-17 handover into Cory's territory.
- **44 already-booked TMCP visits from the miss=activity bug are not backfilled** — the engine fix only affects notes dated after 2026-08-06.
- **16-visit Aug 3-4 cadence catch-up never run** (needs an `--execute` approval); worst case is 36 days out.
- Muhammad's first live-call day (2026-08-07) needs grading against the same rubric as his role-play calls — the live-vs-roleplay delta is still unmeasured.
- `#7999` (Peter Kisbye) still fails Jobber reassignment ("required to handle future items") after repeated retries.
- `98363` Port Angeles zip on a Puyallup address (#7723 Chad Peterson) still unrouted — carried over multiple sessions.
- Two unresolved Jobber tag/billing anomalies from the TMCP audit: Mike Kaiser #5390 (holds both `TMCP - Active` and `TMCP Churned`), and a sweep for other clients with a manual "FINAL BILL" phantom past-due (same shape as the Larry Lemmon case) not yet run.
- `weekly-cash-flow-projection` cron appears dead (see Scheduled Jobs) — needs a look.

### Freshness Check
- All 12 `brand_context/` files (including `rebrand/GOT_MOLES_BRAND_GUIDELINES.md`) last modified **2026-07-03** — 35 days ago, over the 30-day threshold. None updated this week. Given the volume of routing/training/pricing decisions made this week (territories, cadence rules, TMCP pitch), it may be worth a pass to fold anything brand-relevant back into `brand_context/` (most of this week's work was operational/routing rather than brand/marketing, so this may be a non-issue — flagging per the freshness check, not a hard recommendation).
