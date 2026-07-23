# Memory — Working Scratchpad

> Durable facts loaded at session start. Cap 2,500.

## Active Threads
- **Route automation:** n8n OFF. Weekly: push-week→mirror-lastweek→optimize→verify-mirror→review→write; NEVER show raw baseline; mirror=last completed weekday+tech; new→grid; Spencer=overflow; FORM WINS. Drift cron 9-17/2h. Density OK'd (not P4), grid v2 live; TODO allowedDates pre-7/31 (Cam Fri off), 8/3 day-moves. Open: WF-1/2.
- **Cash-flow:** n8n INACTIVE (Spencer cred). **TMCP audit DONE 7/22:** 625 mem ~$69.7K MRR; Aug 1 close Muir #7150; signup fix: tag+monthly+RECURRING.
- **NORTH STAR 1 — Got Moles $5-10M (`got-moles-scale`):** $857K T12 +37%; 69% close = lead-constrained; $5M≈2,900 members/21 techs/1,100 leads-mo. Hires: Tavis+Alias. NOW: **LSA** (gated: Spencer sign-in+COI+consents) + **pricing A-F** (+$10 ARPU≈$72K/yr). **Ninety:** audit done; Spencer UI pass → weekly push+backfill.
- **Org chart (Ninety):** Visionary roles 1-3 FINAL, RESUME Role 4 (draft in got-moles-scale). Spencer=ZERO bids; commercial/5+ac → Cory. Chart=browser-only; login in agentic Chrome.
- **Mole Busters referral (Parshall):** contract FINAL $100/close, excl W.WA (ops-contracts); next: sign, CallRail #, W-9.
- **NORTH STAR 2 — $100K side project (`side-project-100k`):** Spencer: letters/podcasts/legal only. Store live (kit `/l/xolvu`, `/book`→Amazon). Ads acct 763-085-7815 (MCC 143-307-0544), Basic ~5bd. Next: Search campaign ($2.47/day + med negatives), kits 2-3 + bundle, OAuth when API clears.
- **Jobber comms:** 3-hr window; Mon 06:10 sweep; Spencer tick "set default" next UI job.
- **Route Book** dp/B0H6ZX85DK: mail 10; audiobook.
- **Phone ops:** CallRail VA per CLAUDE.local tiers; sync cron hourly 7-18. Open: Muhammad zip email; post-call SMS; pool alert. **DMARC:** p=none; mid-Aug → quarantine.

## Environment Notes
- Cron daemon: AGENTIC_OS_CLAUDE_BIN (setx); rerun start-crons after reboot.
- tool-browser: CDP Chrome, profile `~\.agentic-chrome-profile`; never bulk-automate LinkedIn.
- Jobber: `job.notes` returns OLDEST-first — use `notes(last: 40)`. Visits date-filter = interval-overlap.
- OptimoRoute: start_planning `{dateRange,balancing:'OFF'}`; SYNC unschedules, UPDATE safe; timeWindows persist. Late start: `late-start-replan.mjs`. Day-moves: UPDATE OR date+allowedDates BEFORE drift-fix.

## Pending Decisions
- LinkedIn: Spencer fixes profile → daily connecting.
- Ninety financial block: rec monthly-only (Spencer confirm).
