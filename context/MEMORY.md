# Memory — Working Scratchpad

> Curated durable facts, loaded at session start. Capped at 2,500 characters.

## Active Threads
- **Route automation (Got Moles):** n8n scheduled automation OFF — do not reactivate. 508/508 visits live in Jobber on `home-slots.json` (source of truth; `territory-grid.json` ~125 ZIPs for new customers only). Time-window backfill COMPLETE (07-12): 64,156 visits written — every future visit has a 7:00–19:00 window. Next: (1) **arrival-window per-job sweep** ~5k jobs (`jobEdit` accepts arrivalWindow; canary Spencer's job #7778); (2) rebuild n8n WF-1/WF-2 around home-slots+grid (04:30+13:00 PT; freeze: date locks 14:00 D-1; needs dedicated Jobber app — shared credential died 2x). Tavis out (ZIPs→Cory temp); Brayden gone (→Luke).
- **Jobber notes automation:** n8n report wf `2dxtg73X1JUvLUTr` active daily 18:00 PT + cron `jobber-visit-followups` 18:15 — confirm recent runs succeeded. `engine.mjs --execute` proven live 07-10 but not yet unattended. Pending: regenerate leaked Jobber client secret/refresh token.
- **Cash-flow projection:** n8n wf `Aly1V11tqwSQhTls` (INACTIVE) → Notion "Cash-Flow Snapshots" DB. Next: user connects Notion cred + shares DB, then Execute.
- **TMCP tagging gap:** signups #8030+ aren't auto-tagged `TMCP - Active`. Leak candidate: Karen Porter #5007 (~$2,900 owed, uninvoiced since 2024-02) — Spencer to review.

## Environment Notes
- Local cron runtime fixed (stopgap, 07-10): daemon launches Claude via `AGENTIC_OS_CLAUDE_BIN=C:\Users\spenc\.local\bin\claude.exe` (setx-persisted). Rerun `start-crons` after reboot.
- Browser control: `tool-browser` drives Chrome via CDP; profile `C:\Users\spenc\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber n8n auth = cred `NitrghZSAjZamvqp` (Auth=Body, unreliable). `job.notes` returns OLDEST-first — use `notes(last: 40)`. `visitEditAssignedUsers(visitId:, input:{assignedUserIds:[…]})`. Visits date-filter = interval-overlap.
- OptimoRoute on Pro (`OPTIMOROUTE_API_KEY` in .env): dateRange planning needs Pro; use balancing ON_FORCE; SYNC'd orders unschedule until next start_planning.

## Pending Decisions
- LinkedIn growth (from 07-06): user to fix profile, then daily connecting. Plan + targets in `projects/tool-browser/`.
