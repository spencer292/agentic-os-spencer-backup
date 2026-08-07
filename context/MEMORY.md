# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- Routes: **TERRITORIES ARE HIGHWAY-BOUNDED** (Spencer 08-06, see CLAUDE.local.md): N of I-90 / I-90-SR18 / SR18-410 to I-705 / I-705 west+south. One owner each. NEXT: rebuild territories.json zips to those lines — my zip groups were invented, put 3 techs in Seattle one day. Cadence engine LIVE nightly. Robert starts 08-10; Tavis back 08-17 into Cory arc, Cory out of field.
- Training: Muhammad 7 roleplays 63→86→75; block SOLVED. Gaps: guarantee 1/7, address drops when rushed, no day w/o lookup 7/7. LIVE 8/7: resi ≤5ac; commercial+new-quote sched→Cory. Canon: muhammad-portable/project-instructions.md.
- TMCP 8/5: MRR $73.1K, 661 jobs/642 clients; tag=per-CLIENT(643) NEVER=jobs. QF 113/$48.8K on-close=OUTSIDE MRR. Open: Kaiser#5390 dbl-tag; sweep "FINAL BILL" phantoms.
- NS1 $5-10M: $857K T12 +37%; close 69%, gap=quote-ISSUE. NOW: LSA(gated)+pricing A-F(~$72K/yr).
- NS2 $100K: kits LIVE Gumroad, $0 rev. Ads+GSC OAuth expired 4wk.
- Phone/TEXT: Quo LIVE 253-683-7555; no inbound DTMF; Quo no-answer FORWARDS to VA-only CR# **253-461-0822**. CUTOVER = 1 field: prod Dial dest 0211→7555, keep timeout 20. CR→Jobber sync failing (bad email). Jobber=closed box for texts (no webhook/assign); cust reply to SENDER. Path A: briefs/jobber-text-routing. Open: post-call SMS, DMARC, Muhammad not in texts.
- n8n: Jobber cred dead 7/24; new app rejected. Lead Alert blocked on LEAD_ALERT_SMTP_* pw.
- Jobber dupes: 97grp/114 extra; 82% CallRail. Brief: jobber-duplicate-cleanup.

## Environment Notes
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); no auto-start on reboot; scripts/start-crons.ps1 if down.
- PHONES: MAIN **253-750-0211** (CallRail+AI). **253-326-1740 = SPENCER'S CELL**, wrongly in Jobber Co.Settings — FIX to 0211. Jobber SMS **253-300-0889** text-only/unportable; calls forward to Co.Settings. CallRail READ-ONLY.
- Jobber: notes(last:40) newest; visitEditAssignedUsers REPLACES; no job-level assign. Tech phones = TEAM FIELD "Work Cell" (profile leaks to On My Way). Sort: quotes have CREATED_AT, clients/jobs DON'T (JOB_NUMBER desc).
- OptimoRoute: SYNC unschedules, UPDATE safe. No create_driver/get_drivers. balancing=ON_FORCE reassigns — plan --balancing=OFF.
- Routes: 40h target/42 ceil; times=PLACEHOLDERS; overflow≤15min. commute-to-1st 22%mi.

## Pending Decisions
- LinkedIn: profile fix → daily connects. RR ads: keep/cut after wk CPC.
- Job durations: flat 10-min WRONG (Alias 41.5h=46h real). Tag heavy jobs/medians.
- Route redesign OPEN: region-rhythm map (1x vs 2x/wk; splits=OPPOSITE ends of wk).
