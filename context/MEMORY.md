# Memory — Working Scratchpad

> Durable facts loaded at session start. Cap 2,500.

## Active Threads
- **Route automation:** n8n OFF. Weekly: push-week→mirror-lastweek→optimize→verify-mirror→review→write; NEVER show raw baseline. Mirror=last completed weekday+tech; day=Jobber promise; new→territory-grid.json; Spencer=overflow; FORM WINS. Drift cron 9-17/2h. Open: WF-1/2 rebuild; jobs Chirillo/Foth/Charles; Spencer calls 8102/8175/8185. Tue 07-21 shaped: 07:00 floors, Spencer GH-first (self-expires).
- **Cash-flow:** n8n wf INACTIVE; Spencer to connect cred.
- **TMCP gap:** #8030+ untagged; Karen Porter #5007 ~$2.9k uninvoiced; drop 7 stale tags.
- **Route Ready:** Site+store fully live 07-20: kit `/l/xolvu` published (digest checks purchasability), payouts unpaused, GSC+DNSSEC done, `/book`→Amazon w/ KV clicks (`rr-metrics.mjs`). ADS: acct 763-085-7815 (billed, no campaign), MCC 143-307-0544, GCP 377890328473, Basic Access ~5bd (watch gmail). Next: Search campaign via UI ($2.47/day + medical negatives); OAuth+`.env` when API clears; PW kit.
- **Jobber comms (07-20):** 3-hr arrival window = standard; templates rewritten (SMS ≤250). Mon 06:10 sweep cron backfills. Spencer: tick "set as default" on next job in UI.
- **Route Book Launch:** *The Route* live on Amazon (dp/B0H6ZX85DK). `projects/briefs/route-book-launch/`. Next: verify Tier-1 addresses; mail 10 copies; ask-first DMs; guest apps. AUDIOBOOK 07-20: ElevenLabs voice clone → Spotify/Google/Gumroad; Audible = KDP Virtual Voice (needs Kindle ed — verify).
- **Phone ops (07-20):** CallRail VA reconfigured per CLAUDE.local tiers; VA→Jobber sync cron hourly 7-18 (`callrail-faq`). Muhammad zip in Downloads — Spencer to email. Open: post-call SMS; pool alert; QF deposit assumed $150.

## Environment Notes
- Cron daemon needs `AGENTIC_OS_CLAUDE_BIN` (setx-persisted); rerun start-crons after reboot.
- `tool-browser` drives Chrome via CDP, profile `C:\Users\spenc\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber: `job.notes` returns OLDEST-first — use `notes(last: 40)`. Visits date-filter = interval-overlap.
- OptimoRoute: start_planning `{dateRange,balancing:'OFF'}`; SYNC unschedules, UPDATE safe on planned; verify via get_routes. Drivers: `{updates:[{driver:{serial},date,workTime:{from,to}}]}`; timeWindows persist.

## Pending Decisions
- LinkedIn growth (07-06): Spencer fixes profile → daily connecting; plan in `projects/tool-browser/`.
