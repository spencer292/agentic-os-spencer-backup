## Week of 2026-07-06 — 2026-07-12

### Sessions
- 2026-07-06: Build hands-off Jobber⇄OptimoRoute automation — went LIVE, scrambled the board (visits moved to wrong days, tech assignments blown out); Spencer manually recovered most of it. Automation turned OFF, rebuild required.
- 2026-07-06: Build `tool-browser` (Chrome CDP driver) + LinkedIn audience-growth plan for Got Moles — prospect list, outreach drafts, profile rewrite delivered; not yet acted on.
- 2026-07-06: Build jobber-notes-automation v1 — notes → Job Custom Fields report live for 31 jobs; n8n report workflow created.
- 2026-07-06: Build cash-flow projection engine from Jobber invoices — Notion snapshot DB + n8n workflow created (inactive).
- 2026-07-06: Route automation status check — confirmed Spencer paused it deliberately pending fixes.
- 2026-07-09: Supervised one-day manual route run for Fri 07-10 — 90 OptimoRoute orders created, optimized, and written back to Jobber (90/90 visits updated, 0 failures).
- 2026-07-10: Route v2 rebuild — n8n WF-1/WF-2 created inactive, backfill script built, full week baseline (509 orders) pushed + optimized in OptimoRoute, Spencer's 256 manual board corrections applied. Write-back not run yet by end of day (pivoted to a mirror-history board approach after zone-calendar attempts scattered areas).
- 2026-07-10: jobber-notes-automation resume — fixed a major coverage bug (`jobs(first:N)` missed most of a day's visits) and a notes-ordering bug (`notes(first:40)` read 2024 history on long-history clients); report backfilled live for 4 days; n8n report wf activated (daily 18:00 PT); weekend sweep (80 visits moved off Sunday) and dedupe (28 duplicate visits deleted) executed with Spencer's approval.
- 2026-07-10: TMCP job audit — 597 active TMCP jobs confirmed ($66,813/mo); 8 clients missing the tag found and tagged; Karen Porter (#5007, ~$2,900 uninvoiced) flagged as a leak candidate.
- 2026-07-10: Local cron runtime fixed (stopgap) — `AGENTIC_OS_CLAUDE_BIN` env var bypasses the broken npm-shim launcher; daemon restarted, `jobber-visit-followups` back on schedule.
- 2026-07-11: Finished the route rebuild — **508/508 visits written back to Jobber**, `home-slots.json` established as the template/source of truth for future weeks. Arrival-window backfill kicked off overnight.
- 2026-07-12: No dedicated session — automated maintenance only (see below). Overnight backfill completed: 64,156 visits given time windows, 273 failed (deleted visits, ~0.4%), 0 pending.

### Deliverables
- `projects/briefs/technician-route-automation/` — brief.md, build-notes.md, `home-slots.json` (508-customer template), `territory-grid.json`, n8n WF-1 `YxKaiU1IAAmMkDLh` + WF-2 `QEKz72NTP8YRZsUS` (both inactive), `backfill-time-windows.mjs`, `push-week.mjs`, `optimize-week.mjs`, `2026-07-10_optimized-routes-REVIEW.md`, `2026-07-11_morning-review.md`
- `.claude/skills/tool-browser/SKILL.md` — new zero-dependency Chrome CDP driver skill
- `projects/tool-browser/` — LinkedIn prospect list, outreach drafts, growth engine plan, connection list (4 files, 2026-07-06)
- `projects/briefs/jobber-notes-automation/` — engine.mjs, parse-note.mjs, report-sync.mjs (all rewritten v2), `audit-schedule.mjs`, `dedupe-visits.mjs`, `weekend-sweep.mjs`, plus `runs/` logs (audit, dedupe, weekend-sweep, dry-runs, executed runs)
- `cron/jobs/jobber-visit-followups.md` — trimmed to scheduling-only, rescheduled 18:15
- `projects/briefs/cash-flow-projection/` — brief.md, pull-invoices.mjs, build-projection.mjs, dated report, `CRON-RUNTIME-ISSUE-for-roy.md`
- `projects/tool-jobber/2026-07-10_tmcp-job-audit.md` — full TMCP job/tag/revenue audit
- `context/memory/2026-07-11_gap-analysis.md`, `2026-07-12_gap-analysis.md` — weekly-memory-gaps cron output

### Scheduled Jobs
- 12 jobs configured (daily-memory-distill, gmail-daily-triage, jobber-visit-followups, meeting-clips-lane, meeting-video-archive, monthly-learnings-health, nightly-memory-index, skill-update-check, weekly-activity-digest, weekly-cash-flow-projection, weekly-memory-curator, weekly-memory-gaps, zernio-analytics-snapshot).
- 2 failures on record this week, both tied to the same root cause: **weekly-cash-flow-projection** failed 2026-07-07 (`spawn ...\npm\claude ENOENT` — the local cron launcher bug); **daily-memory-distill** shows 1 failure across its 2 logged runs (same launcher-bug window). Both predate the 2026-07-10 stopgap fix (`AGENTIC_OS_CLAUDE_BIN` pointing at the native `.exe`); no failures logged since.
- All other jobs report 100% success (0 failures) as of their latest run.

### Learnings Added
9 new entries in `context/learnings.md` this week, all Jobber/n8n-focused:
- Jobber GraphQL traps: `jobs(first:N)` misses same-day visits (use visits-first pagination), `notes(first:N)` reads oldest-first (use `notes(last:N)`), `visits(filter:{status:UPCOMING})` false-flags in-progress/completed visits, tag filters need exact label match, partial "hidden due to permissions" errors need explicit filtering (not blanket failure).
- Client/job data model: recurring-job identity lives in `lineItems`, not title; `clientEdit(tagsToAdd:)` is additive; `invoiceSchedule`/`invoicedTotal` distinguish real comps from billing mistakes.
- n8n: report workflow v2 rebuild pattern (native credential, Code-node GraphQL bodies, per-item throttling).
- ops-cron: the `AGENTIC_OS_CLAUDE_BIN=...claude.exe` stopgap that unblocks the local cron launcher.

### Open Threads
- Route automation: n8n WF-1/WF-2 rebuild around `home-slots.json` + territory grid still blocked on a dedicated Jobber app for n8n (shared credential died twice); scripts are carrying the load in the meantime.
- Jobber notes automation: confirm the n8n report wf (18:00 PT) + `jobber-visit-followups` cron (18:15) are both running clean unattended; regenerate the Jobber client secret/refresh token that got exposed in an earlier transcript.
- Cash-flow projection: still waiting on Spencer to connect a Notion credential + share the snapshots DB before the n8n workflow can go live.
- TMCP tagging gap: Karen Porter #5007 (~$2,900 uninvoiced since 2024-02) needs Spencer's review; several stale tags awaiting his confirmation to remove.
- LinkedIn growth plan (from 2026-07-06) — Spencer still needs to paste the new headline/About and start daily connecting; approaching the 14-day stale-decision window with no activity yet.

### Freshness Check
- All 12 `brand_context/` files last modified 2026-07-04 (8 days old) — well within the 30-day threshold. Nothing stale.
