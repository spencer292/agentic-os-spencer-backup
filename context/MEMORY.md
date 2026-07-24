# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- **Route automation:** n8n OFF. push-week→mirror-lastweek→optimize→verify-mirror→review→write; FORM WINS; Spencer=overflow. Drift 9-17/2h. Grid v3 (7/23); TODO allowedDates pre-7/31, cutover TBD.
- **Cash-flow:** n8n INACTIVE. TMCP audit CLOSED: 625 mem ~$69.7K MRR. Open: Aug1 close Muir #7150; signup fix tag+monthly+RECURRING.
- **NORTH STAR 1 — Got Moles $5-10M (got-moles-scale):** $857K T12 +37%; 69% close = lead-constrained; $5M≈2,900 members/21 techs/1,100 leads-mo. Hires: Tavis+Alias. NOW: LSA (gated: sign-in+COI+consents) + pricing A-F (+$10 ARPU≈$72K/yr). Ninety audit done, await UI pass → weekly push+backfill.
- **Org chart (Ninety):** Visionary roles 1-3 FINAL, RESUME Role 4 (draft in got-moles-scale). Spencer=ZERO bids; commercial/5+ac → Cory. Chart=browser-only.
- **Mole Busters referral (Parshall):** contract FINAL $100/close, excl W.WA; next: sign, CallRail #, W-9.
- **NORTH STAR 2 — $100K (zero-touch-business):** Spencer: letters/podcasts/legal only. Store live (/l/xolvu, /book). Ads LIVE: camp 24059425574 $2.47/day (Cleaning grp; PW/Lawn paused til kits), ROUTE_READY_ADS_* creds, Tue cron active (1st 7/28). Conv-track live site→Gumroad→upload (passthrough unverified til 1st sale). Kits 2-3 mid-build parked — resume: memory/2026-07-23.md S3.
- **Email triage:** Gmail spencer@got-moles.com LIVE (6x/day, draft-only). 2nd acct not connected (need Spencer ID). Flagged: Amex/Ninety declined; Jobber quote bounces; FleetSharp false alerts.
- **Jobber comms:** 3-hr window; Mon 06:10 sweep; Spencer tick "set default" next UI job.
- **Route Book** dp/B0H6ZX85DK: mail10; audiobook.
- **Phone ops:** CallRail VA per CLAUDE.local; sync hourly 7-18. Open: Muhammad zip email; post-call SMS; pool alert. DMARC p=none → quarantine mid-Aug.

## Environment Notes
- Cron daemon: AGENTIC_OS_CLAUDE_BIN (setx); rerun start-crons after reboot.
- tool-browser: CDP Chrome, profile ~\.agentic-chrome-profile; never bulk-automate LinkedIn.
- Jobber: job.notes returns OLDEST-first, use notes(last:40); visits date-filter=interval-overlap.
- OptimoRoute: start_planning {dateRange,balancing:'OFF'}; SYNC unschedules, UPDATE safe, timeWindows persist. Late-start: late-start-replan.mjs. Day-moves: UPDATE+allowedDates BEFORE drift-fix.

## Pending Decisions
- LinkedIn: Spencer fixes profile → daily connecting.
- Ninety financial block: rec monthly-only (Spencer confirm).
