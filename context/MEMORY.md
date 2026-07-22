# Memory — Working Scratchpad

> Durable facts loaded at session start. Cap 2,500.

## Active Threads
- **Route automation:** n8n OFF. Weekly: push-week→mirror-lastweek→optimize→verify-mirror→review→write; NEVER show raw baseline. Mirror=last completed weekday+tech; day=Jobber promise; new→territory-grid.json; Spencer=overflow; FORM WINS. Drift cron 9-17/2h. Open: WF-1/2 rebuild; jobs Chirillo/Foth/Charles; calls 8102/8175/8185; 46 visits stale 7/22 windows (Spencer notify).
- **Cash-flow:** n8n wf INACTIVE; Spencer to connect cred. **TMCP gap:** #8030+ untagged; K. Porter #5007 ~$2.9k uninvoiced.
- **TWO NORTH STARS (07-21):** (1) Got Moles → $5-10M/yr in 2-3yrs @30% EBITDA, Cory ops, Spencer visionary — `got-moles-scale`; Phase 0 = full Jobber/CallRail/Ads diagnostic first. (2) Route Ready + The Route → $100K gross, max hands-off — `side-project-100k`; Spencer: letters/podcasts/legal only.
- **Route Ready ops:** store live (kit `/l/xolvu`, `/book`→Amazon w/ KV clicks). ADS: acct 763-085-7815, MCC 143-307-0544, GCP 377890328473, Basic Access ~5bd. Next: Search campaign via UI ($2.47/day + medical negatives); kits 2-3 + bundle; OAuth+`.env` when API clears.
- **Jobber comms:** 3-hr window std; Mon 06:10 sweep cron. Spencer: tick "set default" on next UI job.
- **Route Book:** live on Amazon (dp/B0H6ZX85DK). Spencer: mail 10 copies. AI: audiobook (ElevenLabs→Spotify/Gumroad; Audible=KDP Virtual Voice, verify Kindle ed).
- **Phone ops (07-20):** CallRail VA per CLAUDE.local tiers; VA→Jobber sync cron hourly 7-18 (`callrail-faq`). Muhammad zip in Downloads — Spencer to email. Open: post-call SMS; pool alert; QF deposit assumed $150.
- **DMARC (07-21):** fixed @GoDaddy (p=none live, reports→spencer@). Mid-Aug: check sender alignment → quarantine.

## Environment Notes
- Cron daemon needs `AGENTIC_OS_CLAUDE_BIN` (setx); rerun start-crons after reboot.
- tool-browser: Chrome via CDP, profile `~\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber: `job.notes` returns OLDEST-first — use `notes(last: 40)`. Visits date-filter = interval-overlap.
- OptimoRoute: start_planning `{dateRange,balancing:'OFF'}`; SYNC unschedules, UPDATE safe; verify via get_routes; timeWindows persist. Late start: `late-start-replan.mjs`. Day-moves: UPDATE OR date+allowedDates BEFORE drift-fix (else dragged back).
## Pending Decisions
- LinkedIn growth (07-06): Spencer fixes profile → daily connecting; plan in `projects/tool-browser/`.
