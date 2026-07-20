## Week of 2026-07-06 — 2026-07-13

### Sessions
- 2026-07-06: Build hands-off Jobber⇄OptimoRoute automation — went LIVE, scrambled the board (visits moved to wrong days, tech assignments blown out); Spencer manually recovered most of it. Automation turned OFF, rebuild required.
- 2026-07-06: Build `tool-browser` (Chrome CDP driver) + LinkedIn audience-growth plan for Got Moles — prospect list, outreach drafts, profile rewrite delivered; not yet acted on.
- 2026-07-06: Build jobber-notes-automation v1 — notes → Job Custom Fields report live for 31 jobs; n8n report workflow created.
- 2026-07-06: Build cash-flow projection engine from Jobber invoices — Notion snapshot DB + n8n workflow created (inactive).
- 2026-07-06: Route automation status check — confirmed Spencer paused it deliberately pending fixes.
- 2026-07-09: Supervised one-day manual route run for Fri 07-10 — 90 OptimoRoute orders created, optimized, and written back to Jobber (90/90 visits updated, 0 failures).
- 2026-07-10: Route v2 rebuild — n8n WF-1/WF-2 created inactive, backfill script built, full week baseline (509 orders) pushed + optimized in OptimoRoute, Spencer's 256 manual board corrections applied.
- 2026-07-10: jobber-notes-automation resume — fixed a coverage bug (`jobs(first:N)` missed most of a day's visits) and a notes-ordering bug (`notes(first:40)` read 2024 history); report backfilled live; n8n report wf activated (daily 18:00 PT); weekend sweep (80 visits off Sunday) and dedupe (28 duplicates deleted) executed.
- 2026-07-10: TMCP job audit — 597 active TMCP jobs confirmed ($66,813/mo); 8 clients missing the tag found and tagged; Karen Porter (#5007, ~$2,900 uninvoiced) flagged as a leak candidate.
- 2026-07-10: Local cron runtime fixed (stopgap) — `AGENTIC_OS_CLAUDE_BIN` env var bypasses the broken npm-shim launcher.
- 2026-07-11: Finished the route rebuild — **508/508 visits written back to Jobber**, `home-slots.json` established as the template/source of truth. Overnight arrival-window backfill completed (64,156 visits, 273 failed on deleted visits, ~0.4%).
- 2026-07-12: Cory's Monday route fixed + root cause found (OptimoRoute front-loads high-priority orders, warping route shape) — policy set to all-priority-M going forward; full week 07-14..17 re-planned and pushed to Jobber (−371 km/−6.1h).
- 2026-07-13: Route drift-check cron went LIVE (auto-fix authorized, every 2h 9am-5pm PT) — first supervised run caught and fixed 2 real bookings missing from OptimoRoute (#6116, #4979). n8n Jobber credential reconnected (report workflow had failed its last 3 nightly runs on a dead cred).

### Deliverables
- `projects/briefs/technician-route-automation/` — brief.md, build-notes.md, `home-slots.json` (508-customer template), `territory-grid.json`, n8n WF-1/WF-2 (inactive), `backfill-time-windows.mjs`, `push-week.mjs`, `optimize-week.mjs`, `drift-check.mjs` (new, 07-13 — deterministic check/fix engine)
- `cron/jobs/route-drift-check.md` — new cron, every 2h 9-17 PT, auto-fix authorized
- `.claude/skills/tool-browser/SKILL.md` — new zero-dependency Chrome CDP driver skill
- `projects/tool-browser/` — LinkedIn prospect list, outreach drafts, growth engine plan, connection list
- `projects/briefs/jobber-notes-automation/` — engine.mjs, parse-note.mjs, report-sync.mjs (v2), `audit-schedule.mjs`, `dedupe-visits.mjs`, `weekend-sweep.mjs`
- `projects/briefs/cash-flow-projection/` — brief.md, pull-invoices.mjs, build-projection.mjs, dated report
- `projects/tool-jobber/2026-07-10_tmcp-job-audit.md` — full TMCP job/tag/revenue audit
- `context/memory/2026-07-11_gap-analysis.md`, `2026-07-12_gap-analysis.md`, `2026-07-13_gap-analysis.md` — weekly-memory-gaps cron output
- `projects/ops-cron/skill-update-check_2026-07-11/12/13.md` — daily skill/catalog health checks
- `projects/ops-cron/weekly-digest_2026-07-11.md`, `weekly-digest_2026-07-12.md` — prior digest runs (this cron appears to be firing more often than its Friday-only schedule states — worth checking `cron/jobs/weekly-activity-digest.md` days config against actual behavior)

### Scheduled Jobs
- 14 jobs configured; ~43 total runs logged, 2 failures — both pre-date the 07-10 launcher fix: **weekly-cash-flow-projection** (07-07, `spawn ...\npm\claude ENOENT`) and **daily-memory-distill** (07-11, transient mid-stream API error, self-resolved next run). No failures since.
- **Not a failure but not working either:** `gmail-daily-triage` and `meeting-clips-lane` report "success" every run but do zero real work — both exit cleanly at step 1 on missing credentials (`GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN` unset; Notion Meetings DB lives in Roy's workspace, no token here). These are shipped jobs that don't belong to this install; matches existing memory notes. Consider disabling both here rather than letting them "succeed" nightly without doing anything.
- `route-drift-check` (new today) ran 3 times so far, 0 failures, 1 real fix applied (2 bookings created + re-planned).

### Learnings Added
9 new entries in `context/learnings.md` this week (all Jobber/OptimoRoute/n8n-focused):
- Jobber GraphQL traps: `jobs(first:N)` misses same-day visits, `notes(first:N)` reads oldest-first, `visits(filter:{status:UPCOMING})` false-flags in-progress visits, tag filters need exact label match.
- OptimoRoute: priority warps route shape (not just order) — fixed by always-M policy; `operation:UPDATE` on a planned order is safe (doesn't unschedule).
- n8n: report workflow v2 rebuild pattern (native credential, Code-node GraphQL bodies).
- ops-cron: the `AGENTIC_OS_CLAUDE_BIN=...claude.exe` stopgap for the local launcher.

### Open Threads
- Route automation: WF-1/WF-2 rebuild around `home-slots.json` still pending (drift-check logic folds in); week 07-20 not yet pushed to OR; arrival-window per-job sweep on ~5k existing jobs parked behind the rebuild.
- Jobber notes automation: n8n report wf reconnected today (07-13) — verify tonight's 18:00 PT run succeeds.
- Cash-flow projection: still waiting on Spencer to connect a Notion credential + share the snapshots DB.
- TMCP tagging gap: signups #8030+ aren't auto-tagged; Karen Porter #5007 (~$2,900 uninvoiced) awaiting Spencer's review; several stale tags awaiting confirmation to remove.
- LinkedIn growth plan (from 07-06) — Spencer still hasn't updated his profile or started daily connecting.
- Skill catalog is stale: 73 skills on disk vs. 14 in `catalog.json`, `installed.json` missing entirely (flagged by today's skill-update-check).
- gmail-daily-triage and meeting-clips-lane crons are non-functional on this install (missing creds) — decide whether to disable rather than let them "succeed" while doing nothing.

### Freshness Check
- All 12 `brand_context/` files last modified 2026-07-04 (9 days old) — within the 30-day threshold. Nothing stale.
