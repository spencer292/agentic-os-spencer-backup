# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- Routes: **JOBBER=TRUTH for day+tech; Optimo only re-sequences** (`jobber-to-optimo-sync.mjs`; grid-tech-realign is the reverse — don't run). Cadence engine FIXED+LIVE nightly. PENDING: 16-visit Aug3-4 catch-up needs `--execute` OK (5 catches, worst 36d); wk Aug10-14 still on grid rules. Plan: 2026-08-04_routing-redesign-plan.md. Tavis/Robert/Spencer off-roster but still on visits.
- Tech training: Muhammad roleplay 63→70/100; coaching plan built; gap=5-beat block undelivered.
- Cash-flow: ~$69.7K MRR/625 mem. Open: signup fix tag+monthly+RECUR.
- NS1 $5-10M: $857K T12 +37%. Close 69%; gap=quote-ISSUE rate. NOW: LSA(gated)+pricing A-F(~$72K/yr). TMCP: 437 QF→TMC prospects, $72-168K/yr.
- NS2 $100K: kits LIVE Gumroad, $0 rev. Ads+GSC OAuth BOTH expired 4wk — budget-guard may not fire.
- Phone ops: Quo REJECTED for Muhammad (no inbound DTMF) — eval JustCall $29/mo. CallRail→Jobber sync failing (bad email) — manual fix. Open: post-call SMS, DMARC→quarantine mid-Aug.
- n8n: Jobber cred dead 7/24 → Visit Notes failing nightly; new app rejected. Lead Alert LOCAL cron `briefs/lead-alerts` — blocked on LEAD_ALERT_SMTP_* app pw.
- Jobber dupes: 97grp/114 extra; 82% CallRail double-writes. Brief: jobber-duplicate-cleanup. GBP 270 rev/4.96 ("219+" stale).

## Environment Notes
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); no auto-start on reboot — restarted 8/3, daemon running; scripts/start-crons.ps1 if down.
- CallRail READ-ONLY. Jobber phone 253-326-1740. Muhammad line: Quo 253-683-7555; SMS swap target 253-553-6866.
- Jobber: notes(last:40) newest; visitEditAssignedUsers REPLACES; NO job-level assign mutation.
- OptimoRoute: SYNC unschedules, UPDATE safe. No create_driver/get_drivers. balancing=ON_FORCE reassigns stops — plan --balancing=OFF for territory ownership.
- Routes: 40h target/42 ceiling; times=PLACEHOLDERS; overflow 1 job ≤15min. `get_drivers`=AUTH_KEY_UNKNOWN; commute to 1st job=22% of miles (Cory 36%).

## Pending Decisions
- LinkedIn: Spencer fixes profile then daily connects. RR ads: keep/cut after a week of CPC data.
- Job durations: flat 10-min guess WRONG (Alias 41.5h model = ~46h real). Tag heavy jobs or take medians.
- Route redesign: ANSWERED — continuity soft/approval, 5-day week (4 impossible), new cust→nearest route, nightly re-plan OK, freeze removed. OPEN: region-rhythm map (which areas 1x vs 2x/wk; 2-day splits go to OPPOSITE ends of the week).
