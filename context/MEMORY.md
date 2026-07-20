# Memory — Working Scratchpad

> Curated durable facts, loaded at session start. Capped at 2,500 characters.

## Active Threads
- **Route automation (Got Moles):** n8n OFF. **Weekly flow: push-week → mirror-lastweek → optimize → verify-mirror → Spencer review → write. NEVER present raw optimize baseline.** Territory map+rules in tech-route-automation brief folder (07-19 file). Mirror=last completed weekday+tech (hand edits persist); day=Jobber promise; tech needs explicit assignedTo; new customers→territory-grid.json; Spencer=overflow, ask first; priority always M. Wk 07-20 written+verified+reconciled (drift 21:45: 526/526 clean). Jobber churns visits — diff manifest vs live before writes; write BEFORE 14:00 PT Sun. Drift cron 9-17/2h auto-fix. Open: WF-1/2 rebuild; Spencer calls 8102/8175/8185 + new jobs Chirillo/Foth/Charles; arrival-window sweep (canary #7778). EOD tag=last stop→`eod-reroute.mjs`.
- **Cash-flow projection:** n8n wf `Aly1V11tqwSQhTls` INACTIVE → Notion DB; Spencer to connect cred.
- **TMCP gap:** #8030+ not auto-tagged `TMCP - Active`; Karen Porter #5007 ~$2.9k uninvoiced (Spencer to review); drop Kaiser `TMCP Churned` + 6 stale tags.
- **Route Ready (zero-touch biz, LAUNCHED 07-19):** routereadykits.com live = Cloudflare Worker (`cf-deploy.mjs` one-call deploy, acct routereadykits@gmail.com — Drive masters + Apps Script + Chrome session). Gumroad `routeready`: kit $49 `/l/xolvu`, free cheatsheet `/l/vvgis` (email capture). Tokens stored: GUMROAD_* + CLOUDFLARE_* (env file). Crons ACTIVE: content M/W/F 06:30, digest Mon 07:00 (ads dormant). Brief: `projects/briefs/zero-touch-business/`. Next: PW kit (publish on traffic signal), GSC+sitemap, DNSSEC, verify KYC. 70 Spencer-min.

## Environment Notes
- Cron stopgap (07-10): daemon launches Claude via `AGENTIC_OS_CLAUDE_BIN=C:\Users\spenc\.local\bin\claude.exe` (setx-persisted). Rerun `start-crons` after reboot.
- `tool-browser` drives Chrome via CDP, profile `C:\Users\spenc\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber n8n auth = cred `NitrghZSAjZamvqp` (Auth=Body, unreliable). `job.notes` returns OLDEST-first — use `notes(last: 40)`. Visits date-filter = interval-overlap.
- OptimoRoute Pro (`OPTIMOROUTE_API_KEY`): start_planning `{dateRange:{from,to},balancing:'OFF'}`; SYNC unschedules, op UPDATE safe on planned orders; verify via get_routes.

## Pending Decisions
- LinkedIn growth (07-06): Spencer fixes profile → daily connecting; plan in `projects/tool-browser/`.
