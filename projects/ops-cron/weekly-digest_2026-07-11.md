## Week of 2026-07-06 — 2026-07-11

### Sessions
- 2026-07-06: Rebuild Jobber⇄OptimoRoute route automation — went LIVE, scrambled the live board (visits moved to wrong days, blanket 7am–7pm placeholder). Partial manual recovery; **automation turned OFF, do not reactivate.**
- 2026-07-06: Built `tool-browser` (zero-dep Chrome CDP driver) + LinkedIn corporate-prospect research, growth plan, and 22 outreach drafts for Got Moles.
- 2026-07-06: Jobber notes automation — 8 Job Custom Fields created in Jobber; report went LIVE from tech notes; n8n report workflow built.
- 2026-07-06: Cash-flow projection — built deposit-aware collection-curve model from live Jobber invoices; n8n weekly workflow + Notion snapshots DB created (inactive, pending Notion credential).
- 2026-07-06: Route automation status check — confirmed parent workflow deliberately paused by Spencer pending fixes.
- 2026-07-09: Supervised one-day manual route run for Fri 07-10 — 90 OptimoRoute orders created + optimized + 90 Jobber visits written back, 0 failures.
- 2026-07-10: Route automation v2 rebuild — defused a stray-active child workflow, built WF-1/WF-2 (inactive), scanned 64,429 "anytime" visits for a time-window backfill. Evening: full week baseline pushed (509 orders), zone-calendar approach abandoned after Spencer feedback, pivoted to a mirror-last-week board.
- 2026-07-10: Jobber notes automation resumed — fixed two coverage bugs (notes returned oldest-first; `jobs(first:N)` missed same-day visits), rebuilt engine/report v2, activated the n8n report workflow, ran first live scheduling execution, weekend sweep + dedupe executed (Spencer-approved).
- 2026-07-10: TMCP job audit — counted 597 active TMCP jobs across 577 clients ($66,813/mo), tagged 8 missing clients, flagged zero-invoice leak candidates.
- 2026-07-10: Local cron runtime fixed (stopgap env var) — `jobber-visit-followups` scheduled daily 18:15.
- 2026-07-11: Route rebuild finished — **write-back complete, 508/508 visits live in Jobber**; `home-slots.json` established as the source-of-truth template for future weeks.

### Deliverables
- `projects/briefs/technician-route-automation/` — brief.md, build-notes.md, home-slots.json, territory-grid.json, zone-map artifacts, backfill-time-windows.mjs, 2026-07-10_optimized-routes-REVIEW.md, 2026-07-11_morning-review.md
- `browser/launch.mjs`, `browser/cdp.mjs`, `.claude/skills/tool-browser/SKILL.md` — new browser-control skill
- `projects/tool-browser/2026-07-06_linkedin-*.md` — prospect list, outreach drafts, growth engine plan, connection list
- `projects/briefs/jobber-notes-automation/` — brief.md, engine.mjs, parse-note.mjs, report-sync.mjs, audit-schedule.mjs, dedupe-visits.mjs, weekend-sweep.mjs, plus `runs/*` execution logs
- `projects/briefs/cash-flow-projection/` — brief.md, pull-invoices.mjs, build-projection.mjs, dated report, CRON-RUNTIME-ISSUE-for-roy.md
- `projects/tool-jobber/2026-07-10_tmcp-job-audit.md` — TMCP job/revenue audit
- `cron/jobs/jobber-visit-followups.md` — trimmed to scheduling-dry-run only (report half moved to n8n)
- n8n workflows: report `2dxtg73X1JUvLUTr` (active), cash-flow `Aly1V11tqwSQhTls` (inactive), route WF-1 `YxKaiU1IAAmMkDLh` / WF-2 `QEKz72NTP8YRZsUS` (both inactive)

### Scheduled Jobs
- 13 runs recorded this week across 12 status-tracked jobs, 2 failures (counters reflect since the 07-10 cron-runtime fix, not a full 7-day history — daemon was broken/down for part of the week).
- **daily-memory-distill** failed 2026-07-11 (exit code 1) — needs investigation.
- **weekly-cash-flow-projection** failed 2026-07-07 (exit code 1, 0ms duration — pre-dates the 07-10 stopgap fix, consistent with the known broken-launcher issue).
- All other tracked jobs (gmail-daily-triage, jobber-visit-followups, meeting-clips-lane, meeting-video-archive, monthly-learnings-health, nightly-memory-index, skill-update-check, weekly-memory-curator, weekly-memory-gaps, zernio-analytics-snapshot) show clean runs.

### Learnings Added
- **technician-route-automation:** OptimoRoute order-creation gotchas (bulk `create_or_update_orders` doesn't geocode and can silently drag orders across dates; use `create_order` with unique orderNo), tech-locking via `assignedTo.serial`, visit write-back patterns with `visitEditSchedule`.
- **tool-browser (new section):** zero-dependency CDP driver setup, persistent Chrome profile, LinkedIn people-search extraction pattern, network-hub prospecting insight.
- **tool-jobber:** invoice/deposit cash-flow modeling, token-rotation gotchas, writable custom fields without the config scope, visit-scheduling mutations, the notes-ordering bug (`notes(last:N)` not `first:N`), the `jobs(first:N)` coverage trap, client-tag filtering and additive tag writes.
- **tool-n8n:** preferring the native Jobber OAuth2 credential, the httpRequest empty-body gotcha (build dynamic bodies in a Code node), workflow-update API quirks.
- **ops-cron (new section):** root cause of the broken Windows cron launcher + the `.exe` env-var stopgap.
- **General:** hard-gate lesson from the route-automation incident — never flip a live-data-writing automation to production until the whole workflow is built and validated; "0 errors" isn't proof of correctness.

### Open Threads
- Backfill tail: 62,909 visits still pending time-window writes (resumable command in 2026-07-11 log).
- Rebuild n8n WF-1/WF-2 around home-slots + territory-grid; blocked on a dedicated Jobber app for n8n (shared credential has died twice).
- Arrival-window sweep for ~5k existing Jobber jobs — confirmed automatable, flagged as top task for next session.
- Security cleanup still pending: regenerate the Jobber app client secret + re-mint the refresh token (exposed in a 07-06 transcript).
- Cash-flow n8n workflow awaiting Spencer to connect a Notion credential + share the snapshots DB.
- LinkedIn growth: Spencer to paste new headline/About and start daily connecting (plan + targets ready).
- TMCP: stale-tag removals awaiting Spencer's confirmation; zero-invoice comps to review (Karen Porter #5007 ~$2,900).
- daily-memory-distill cron failure (2026-07-11) unexplained — check next session.

### Freshness Check
- All `brand_context/` files last touched 2026-07-04 (7 days old) — within the 30-day threshold, nothing stale.
