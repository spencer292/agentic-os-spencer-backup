# Memory — Working Scratchpad

> Curated durable facts, loaded at session start. Capped at 2,500 characters.

## Active Threads
- **Route automation (Got Moles):** n8n OFF — do not reactivate. **Weekly flow (MANDATORY): push-week → mirror-lastweek → optimize plan → verify-mirror → Spencer review → write. NEVER present the raw optimize baseline — it floats everything.** Territory map+rules: `projects/briefs/technician-route-automation/2026-07-19_week-0720-territory-map.md`. Mirror = last completed weekday+tech per job (hand edits persist). Committed: day=Jobber promise; tech needs explicit assignedTo. New customers → territory-grid.json. Spencer = overflow — ask first. Priority always M. Wk 07-20 WRITTEN to Jobber 07-19 (525/525) + verified. #8162 Montano = Luke Mondays. Jobber churns visits — diff manifest vs live before writes. Weekly write lands BEFORE 14:00 PT Sun. Drift cron 9-17 PT/2h auto-fix. Next: WF-1/2 rebuild (mirror+tech-lock+churn-diff+drift); Spencer calls 8102/8175/8185; arrival-window sweep (canary #7778). EOD tag = last stop → `eod-reroute.mjs`.
- **Cash-flow projection:** n8n wf `Aly1V11tqwSQhTls` (INACTIVE) → Notion "Cash-Flow Snapshots" DB; user to connect cred + share DB.
- **TMCP tagging gap:** signups #8030+ aren't auto-tagged `TMCP - Active`. Leak: Karen Porter #5007 (~$2,900 uninvoiced since 2024-02) — Spencer to review. Drop Kaiser's `TMCP Churned` + 6 stale tags (TMCP $66.8k/mo).
- **Wk 07-20 reconciled (07-19, notes+forms):** 31 dupes deleted, 19 visits added, 3 pulled, techs set; form beats note (Cavanaugh). Open: new jobs Chirillo #7992/Foth #7993/Charles #8096 (Spencer). Drift-check 21:45 PT: 526/526 in sync, 0 drift (#8186 auto-fixed → Luke Tue).

## Environment Notes
- Cron stopgap (07-10): daemon launches Claude via `AGENTIC_OS_CLAUDE_BIN=C:\Users\spenc\.local\bin\claude.exe` (setx-persisted). Rerun `start-crons` after reboot.
- `tool-browser` drives Chrome via CDP, profile `C:\Users\spenc\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber n8n auth = cred `NitrghZSAjZamvqp` (Auth=Body, unreliable). `job.notes` returns OLDEST-first — use `notes(last: 40)`. Visits date-filter = interval-overlap.
- OptimoRoute Pro (`OPTIMOROUTE_API_KEY`): start_planning `{dateRange:{from,to},balancing:'OFF'}`; SYNC unschedules, op UPDATE safe on planned orders; verify via get_routes.

## Pending Decisions
- LinkedIn growth (07-06): Spencer fixes profile, then daily connecting. Plan in `projects/tool-browser/`.
