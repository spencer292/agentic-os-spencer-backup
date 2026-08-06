# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- Routes: **JOBBER=TRUTH day+tech; Optimo only re-sequences** (don't run grid-tech-realign). Cadence engine LIVE nightly; TMCP ramp miss 50%. PENDING: 16-visit Aug3-4 catch-up needs --execute; wk Aug10-14 on grid rules. 68 visits on out-of-field Spencer, sweep pending.
- Training: Muhammad roleplay 63→70; gap=5-beat block undelivered. Jobber SOPs built (client+quote / Cory scheduling). SPLIT: new approved quotes→Cory, existing-customer scheduling→Muhammad.
- Cash-flow: ~$69.7K MRR/625mem. Open: signup fix tag+monthly+RECUR.
- NS1 $5-10M: $857K T12 +37%; close 69%, gap=quote-ISSUE rate. NOW: LSA(gated)+pricing A-F(~$72K/yr). TMCP conv: 357 targets+CSV.
- NS2 $100K: kits LIVE Gumroad, $0 rev. Ads+GSC OAuth expired 4wk — budget-guard may not fire.
- Phone ops: Quo REJECTED (no inbound DTMF). CallRail→Jobber sync failing (bad email). Open: post-call SMS, DMARC.
- Client TEXTS: Jobber=closed box (no inbound webhook/msg reads/per-conv assign); per-tech #s useless, customers reply to SENDER. DECIDED Path A = text desk: briefs/jobber-text-routing.
- n8n: Jobber cred dead 7/24; new app rejected. Lead Alert cron blocked on LEAD_ALERT_SMTP_* pw.
- Jobber dupes: 97grp/114 extra, 82% CallRail double-writes. GBP 270rev/4.96 ("219+" stale).

## Environment Notes
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); no auto-start on reboot — daemon active; scripts/start-crons.ps1 if down.
- PHONES (3, distinct): MAIN **253-750-0211** (CallRail + AI). **253-326-1740 = SPENCER'S CELL**, wrongly set as Jobber Co.Settings — FIX to 0211. Jobber SMS **253-300-0889** text-only/unportable; calls forward to Co.Settings. CallRail READ-ONLY. Muhammad Quo 253-683-7555.
- Jobber: notes(last:40) newest; visitEditAssignedUsers REPLACES; no job-level assign. Tech phones = TEAM FIELD "Work Cell" (profile phone leaks to On My Way). Sort keys: quotes have CREATED_AT, clients/jobs DON'T (JOB_NUMBER desc).
- OptimoRoute: SYNC unschedules, UPDATE safe. No create_driver/get_drivers. balancing=ON_FORCE reassigns — plan --balancing=OFF.
- Routes: 40h target/42 ceiling; times=PLACEHOLDERS; overflow≤15min. commute-to-1st=22%mi (Cory 36%).

## Pending Decisions
- LinkedIn: Spencer fixes profile then daily connects. RR ads: keep/cut after wk of CPC data.
- Job durations: flat 10-min WRONG (Alias 41.5h model≈46h real). Tag heavy jobs or medians.
- Route redesign OPEN: region-rhythm map (1x vs 2x/wk; splits→OPPOSITE ends of week).
