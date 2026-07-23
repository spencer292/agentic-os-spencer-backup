# Memory — Working Scratchpad

> Durable facts loaded at session start. Cap 2,500.

## Active Threads
- **Route automation:** n8n OFF. Weekly: push-week→mirror-lastweek→optimize→verify-mirror→review→write; NEVER show raw baseline; mirror=last completed weekday+tech; new→grid; Spencer=overflow; FORM WINS. Drift cron 9-17/2h. Density OK'd (not P4), grid v2 live; TODO allowedDates in push-week pre-7/31 (Cammeron Fri off), 8/3 day-moves. Open: WF-1/2; calls 8102/8175/8185.
- **Cash-flow:** n8n wf INACTIVE; Spencer to connect cred. **TMCP gap:** #8030+ untagged.
- **NORTH STAR 1 — Got Moles $5-10M (`got-moles-scale`):** $857K T12 +37%; 69% close = lead-constrained; $5M≈2,900 members/21 techs/1,100 leads-mo. Hires MADE (Tavis+Alias). NOW: **LSA** (gated on Spencer: sign-in+COI+consents) + **pricing A-F** (+$10 ARPU≈$72K/yr). **Ninety:** audit done; Spencer UI pass (archive+new KPIs incl Missed Calls) → weekly push+backfill 5/1+Mon cron.
- **Mole Busters referral (Mackenzie Parshall):** contract FINAL $100/close, excl W.WA (`projects/ops-contracts/`); next: sign, CallRail #, W-9.
- **NORTH STAR 2 — $100K side project (`side-project-100k`):** Spencer: letters/podcasts/legal only. Store live (kit `/l/xolvu`, `/book`→Amazon w/ KV clicks). Ads acct 763-085-7815 (MCC 143-307-0544), Basic Access ~5bd. Next: Search campaign via UI ($2.47/day + med negatives), kits 2-3 + bundle, OAuth when API clears.
- **Jobber comms:** 3-hr window std; Mon 06:10 sweep cron. Spencer: tick "set default" next UI job.
- **Route Book:** Amazon dp/B0H6ZX85DK. Spencer: mail 10 copies. AI: audiobook next.
- **Phone ops:** CallRail VA per CLAUDE.local tiers; sync cron hourly 7-18. Open: Muhammad zip email; post-call SMS; pool alert. **DMARC:** p=none; mid-Aug check → quarantine.

## Environment Notes
- Cron daemon needs `AGENTIC_OS_CLAUDE_BIN` (setx); rerun start-crons after reboot.
- tool-browser: Chrome via CDP, profile `~\.agentic-chrome-profile`. Never bulk-automate LinkedIn.
- Jobber: `job.notes` returns OLDEST-first — use `notes(last: 40)`. Visits date-filter = interval-overlap.
- OptimoRoute: start_planning `{dateRange,balancing:'OFF'}`; SYNC unschedules, UPDATE safe; timeWindows persist. Late start: `late-start-replan.mjs`. Day-moves: UPDATE OR date+allowedDates BEFORE drift-fix.

## Pending Decisions
- LinkedIn growth: Spencer fixes profile → daily connecting (`projects/tool-browser/`).
- Ninety financial block: rec monthly-only (audit doc) — Spencer to confirm.
