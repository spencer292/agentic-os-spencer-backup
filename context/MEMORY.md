# Memory — Working Scratchpad

> Curated durable facts, loaded at session start. Capped at 2,500 characters.

## Active Threads
- **Route automation (Got Moles):** n8n scheduled automation OFF — do not reactivate. 508/508 visits live in Jobber on `home-slots.json` (source of truth; `territory-grid.json` ~125 ZIPs for new customers only). Arrival-window backfill COMPLETE (07-12): 64,156 visits written, 273 failed (deleted visits, ~0.4%) — every future visit now has a window. Next: rebuild n8n WF-1/WF-2 around home-slots+grid (04:30+13:00, needs dedicated Jobber app — credential died 2x).
- **Jobber notes automation:** n8n report wf `2dxtg73X1JUvLUTr` active daily 18:00 PT + cron `jobber-visit-followups` 18:15 — confirm recent runs succeeded. `engine.mjs --execute` proven live 07-10 (follow-ups/dedupe/Sunday sweep, Spencer-approved) but not yet unattended. Pending: regenerate leaked Jobber client secret/refresh token.
- **Cash-flow projection (Got Moles):** weekly automation = n8n Cloud wf `Aly1V11tqwSQhTls` (INACTIVE) → Notion "Cash-Flow Snapshots" DB. Next: user connects Notion cred + shares DB, then Execute.
- **TMCP tagging gap:** signups #8030+ aren't auto-tagged `TMCP - Active`. Leak candidate: Karen Porter #5007 (~$2,900 owed, uninvoiced since 2024-02) — Spencer to review.

## Environment Notes
- Local cron runtime fixed (stopgap, 07-10): daemon launches Claude via `AGENTIC_OS_CLAUDE_BIN=C:\Users\spenc\.local\bin\claude.exe` (setx-persisted) — bypasses ENOENT launcher bug. Rerun `start-crons` after reboot.
- Browser control: `tool-browser` skill drives visible Chrome via zero-dep CDP (`node browser/launch.mjs` then `node browser/cdp.mjs <goto|shot|text|eval|click|type>`). Profile `C:\Users\spenc\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber n8n auth = credential `NitrghZSAjZamvqp` "Jobber OAuth2 (native)", Auth=Body. Jobber `job.notes` returns OLDEST-first — fetch `notes(last: 40)`, never `notes(first: N)`.
- OptimoRoute API live — `OPTIMOROUTE_API_KEY` in `.env`; account now on Pro (needed for dateRange planning).

## Pending Decisions
- LinkedIn growth (Got Moles, from 2026-07-06): user to paste new headline+About & fix profile, then start daily connecting. Full plan + ~55-target list + 22 outreach drafts in `projects/tool-browser/`.- **Route automation v2 (2026-07-12): WEEK OF 7/13 LIVE IN JOBBER (508/508: days+techs+times+3h windows).** Board = Spencer-approved; captured as `projects/briefs/technician-route-automation/home-slots.json` (THE template: existing customers keep this day+tech; new customers via territory-grid.json; optimizer sequences ONLY). Backfill DONE: 64,156 future visits have 7-7 placeholder windows. NEXT: (1) arrival-window per-job sweep (~5k jobs; jobEdit accepts arrivalWindow — canary #7778 first); (2) rebuild n8n WF-1/WF-2 around home-slots+grid, schedule 04:30+13:00 (needs NEW dedicated Jobber app — old cred dies); (3) freeze rule: date locks 14:00 D-1 (customer emails). OR is Pro now. Tavis out (his ZIPs→Cory temp); Brayden gone (→Luke).

> Curated durable facts, loaded at session start. Capped at 2,500 characters.

## Active Threads
- **Route automation (Got Moles):** n8n scheduled automation OFF — do not reactivate. 508/508 visits live in Jobber on `home-slots.json` (source of truth; `territory-grid.json` ~125 ZIPs for new customers only). Arrival-window backfill COMPLETE (07-12): 64,156 visits written, 273 failed (deleted visits, ~0.4%) — every future visit now has a window. Next: rebuild n8n WF-1/WF-2 around home-slots+grid (04:30+13:00, needs dedicated Jobber app — credential died 2x).
- **Jobber notes automation:** n8n report wf `2dxtg73X1JUvLUTr` active daily 18:00 PT + cron `jobber-visit-followups` 18:15 — confirm recent runs succeeded. `engine.mjs --execute` proven live 07-10 (follow-ups/dedupe/Sunday sweep, Spencer-approved) but not yet unattended. Pending: regenerate leaked Jobber client secret/refresh token.
- **Cash-flow projection (Got Moles):** weekly automation = n8n Cloud wf `Aly1V11tqwSQhTls` (INACTIVE) → Notion "Cash-Flow Snapshots" DB. Next: user connects Notion cred + shares DB, then Execute.
- **TMCP tagging gap:** signups #8030+ aren't auto-tagged `TMCP - Active`. Leak candidate: Karen Porter #5007 (~$2,900 owed, uninvoiced since 2024-02) — Spencer to review.

## Environment Notes
- Local cron runtime fixed (stopgap, 07-10): daemon launches Claude via `AGENTIC_OS_CLAUDE_BIN=C:\Users\spenc\.local\bin\claude.exe` (setx-persisted) — bypasses ENOENT launcher bug. Rerun `start-crons` after reboot.
- Browser control: `tool-browser` skill drives visible Chrome via zero-dep CDP (`node browser/launch.mjs` then `node browser/cdp.mjs <goto|shot|text|eval|click|type>`). Profile `C:\Users\spenc\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber n8n auth = credential `NitrghZSAjZamvqp` "Jobber OAuth2 (native)", Auth=Body. Jobber `job.notes` returns OLDEST-first — fetch `notes(last: 40)`, never `notes(first: N)`.
- OptimoRoute API live — `OPTIMOROUTE_API_KEY` in `.env`; account now on Pro (needed for dateRange planning).

## Pending Decisions
- LinkedIn growth (Got Moles, from 2026-07-06): user to paste new headline+About & fix profile, then start daily connecting. Full plan + ~55-target list + 22 outreach drafts in `projects/tool-browser/`.
