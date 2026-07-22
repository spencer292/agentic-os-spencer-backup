# Memory — Working Scratchpad

> Durable facts loaded at session start. Cap 2,500.

## Active Threads
- **Route automation:** n8n OFF. Weekly: push-week→mirror-lastweek→optimize→verify-mirror→review→write; NEVER show raw baseline. Mirror=last completed weekday+tech; new→territory-grid.json; Spencer=overflow; FORM WINS. Drift cron 9-17/2h. Open: WF-1/2 rebuild; Chirillo/Foth/Charles; calls 8102/8175/8185; 46 stale 7/22 windows.
- **Cash-flow:** n8n wf INACTIVE; Spencer to connect cred. **TMCP gap:** #8030+ untagged; K. Porter #5007 ~$2.9k uninvoiced.
- **NORTH STAR 1 — Got Moles $5-10M (`got-moles-scale`):** Diagnostic DONE: $857K trailing-12 +37%; 69% close = lead-constrained; $5M ≈ 2,900 members/21 techs/1,100 leads-mo. Founder-freeing hires MADE (Tavis+Alias). NOW: **LSA** (gated: Spencer sign-in spencer@got-moles.com + COI + bg consents; no WA mole license — flow adapts/escalate) + **pricing A-F pending** (TMCP 86% ≤$100 vs tiers; +$10 ARPU≈$72K/yr). Churn tags + lead-source attribution broken.
- **NORTH STAR 2 — $100K side project (`side-project-100k`):** Spencer: letters/podcasts/legal only. Store live (kit `/l/xolvu`, `/book`→Amazon w/ KV clicks). Ads: acct 763-085-7815, MCC 143-307-0544, GCP 377890328473, Basic Access ~5bd. Next: Search campaign via UI ($2.47/day + medical negatives), kits 2-3 + bundle, audiobook, OAuth+`.env` when API clears.
- **Jobber comms:** 3-hr window std; Mon 06:10 sweep cron. Spencer: tick "set default" next UI job.
- **Route Book:** on Amazon (dp/B0H6ZX85DK). Spencer: mail 10 copies. AI: audiobook (ElevenLabs; Audible=KDP Virtual Voice, verify Kindle ed).
- **Phone ops:** CallRail VA per CLAUDE.local tiers; sync cron hourly 7-18. Muhammad zip→Spencer to email. Open: post-call SMS; pool alert; QF deposit assumed $150. **DMARC:** p=none live; mid-Aug check alignment → quarantine.

## Environment Notes
- Cron daemon needs `AGENTIC_OS_CLAUDE_BIN` (setx); rerun start-crons after reboot.
- tool-browser: Chrome via CDP, profile `~\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber: `job.notes` returns OLDEST-first — use `notes(last: 40)`. Visits date-filter = interval-overlap.
- OptimoRoute: start_planning `{dateRange,balancing:'OFF'}`; SYNC unschedules, UPDATE safe; verify via get_routes; timeWindows persist. Late start: `late-start-replan.mjs`. Day-moves: UPDATE OR date+allowedDates BEFORE drift-fix (else dragged back).
## Pending Decisions
- LinkedIn growth (07-06): Spencer fixes profile → daily connecting; plan in `projects/tool-browser/`.
