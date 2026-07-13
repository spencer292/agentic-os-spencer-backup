# Memory — Working Scratchpad

> Curated durable facts, loaded at session start. Capped at 2,500 characters.

## Active Threads
- **Route automation (Got Moles):** n8n OFF — do not reactivate. home-slots.json = source of truth (grid for new customers). POLICY (07-12): ALL OR orders priority M — priority makes OR serve high-prio EARLIER, warping routes (~20% worse); real promises = OR timeWindows only; visit times never carry week-to-week. Push scripts fixed, 70 stray C/H normalized, 07-14..17 re-planned locked to day+tech (−371 km/wk) + written to Jobber. Next: (1) WF-1/WF-2 rebuild w/ daily DRIFT CHECK (new Jobber bookings absent from OR: #8158/#8138/#7546; diff boards); (2) push wk 07-20 to OR; (3) arrival-window per-job sweep ~5k jobs (canary #7778). Tavis out (ZIPs→Cory temp); Brayden gone (→Luke).
- **Jobber notes automation:** n8n report wf `2dxtg73X1JUvLUTr` active daily 18:00 PT + cron `jobber-visit-followups` 18:15 — confirm recent runs succeeded. `engine.mjs --execute` proven live 07-10 but not yet unattended. Pending: regenerate leaked Jobber client secret/refresh token.
- **Cash-flow projection:** n8n wf `Aly1V11tqwSQhTls` (INACTIVE) → Notion "Cash-Flow Snapshots" DB. Next: user connects Notion cred + shares DB, then Execute.
- **TMCP tagging gap:** signups #8030+ aren't auto-tagged `TMCP - Active`. Leak candidate: Karen Porter #5007 (~$2,900 owed, uninvoiced since 2024-02) — Spencer to review.

## Environment Notes
- Local cron runtime fixed (stopgap, 07-10): daemon launches Claude via `AGENTIC_OS_CLAUDE_BIN=C:\Users\spenc\.local\bin\claude.exe` (setx-persisted). Rerun `start-crons` after reboot.
- Browser control: `tool-browser` drives Chrome via CDP; profile `C:\Users\spenc\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber n8n auth = cred `NitrghZSAjZamvqp` (Auth=Body, unreliable). `job.notes` returns OLDEST-first — use `notes(last: 40)`. `visitEditAssignedUsers(visitId:, input:{assignedUserIds:[…]})`. Visits date-filter = interval-overlap.
- OptimoRoute on Pro (`OPTIMOROUTE_API_KEY` in .env): start_planning shape `{dateRange:{from,to}, balancing:'OFF'}`; SYNC unschedules but op UPDATE is safe on planned orders; verify via get_routes (get_scheduling_info is GET-only, 405 via raw).

## Pending Decisions
- LinkedIn growth (from 07-06): user to fix profile, then daily connecting. Plan + targets in `projects/tool-browser/`.
