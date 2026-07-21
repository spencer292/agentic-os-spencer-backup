# Memory — Working Scratchpad

> Durable facts loaded at session start. Cap 2,500.

## Active Threads
- **Route automation:** n8n OFF. Weekly: push-week→mirror-lastweek→optimize→verify-mirror→review→write; NEVER show raw baseline. Mirror=last completed weekday+tech; day=Jobber promise; explicit assignedTo; new→territory-grid.json; Spencer=overflow; FORM WINS over note. Drift cron 9-17/2h. Open: re-verify OR vs Jobber; WF-1/2 rebuild; jobs Chirillo/Foth/Charles; Spencer calls 8102/8175/8185. EOD→`eod-reroute.mjs`.
- **Cash-flow:** n8n wf INACTIVE; Spencer to connect cred.
- **TMCP gap:** #8030+ untagged; Karen Porter #5007 ~$2.9k uninvoiced; drop 7 stale tags.
- **Route Ready (LAUNCHED 07-19):** routereadykits.com CF Worker (`cf-deploy.mjs`). Gumroad: kit $49 `/l/xolvu`, cheatsheet `/l/vvgis`. Crons: content M/W/F, digest Mon; ads dormant. Brief: `projects/briefs/zero-touch-business/`. GSC verified 07-20. Next: PW kit, DNSSEC, dup PDF fix, verify KYC.
- **Jobber comms (07-20):** 3-hr arrival window = standard; templates rewritten (SMS ≤250). Mon 06:10 sweep cron backfills. Spencer: tick "set as default" on next job in UI.
- **Route Book Launch:** *The Route* live on Amazon (dp/B0H6ZX85DK). `projects/briefs/route-book-launch/`. Next: verify Tier-1 addresses; mail 10 copies; ask-first DMs; guest apps. AUDIOBOOK 07-20: ElevenLabs voice clone (~30min recording) → Spotify/Google/Gumroad; Audible = KDP Virtual Voice (needs Kindle ed — verify). ACX bans 3rd-party AI.
- **Phone ops (07-20):** CallRail Voice Assist reconfigured: answers pricing per CLAUDE.local tiers (commercial/>5ac = in-person bid), intake size/type/email/source. VA→Jobber repair-sync cron hourly 7-18 (`callrail-faq` brief). Muhammad: training zip in Downloads — Spencer to email; scorecards→roleplay-log.md. Open: post-call SMS; number-pool alert; deposit at new tiers assumed $150.

## Environment Notes
- Cron daemon needs `AGENTIC_OS_CLAUDE_BIN` (setx-persisted); rerun start-crons after reboot.
- `tool-browser` drives Chrome via CDP, profile `C:\Users\spenc\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber: `job.notes` returns OLDEST-first — use `notes(last: 40)`. Visits date-filter = interval-overlap.
- OptimoRoute: start_planning `{dateRange,balancing:'OFF'}`; SYNC unschedules, UPDATE safe on planned; verify via get_routes.

## Pending Decisions
- LinkedIn growth (07-06): Spencer fixes profile → daily connecting; plan in `projects/tool-browser/`.
