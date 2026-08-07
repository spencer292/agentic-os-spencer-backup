# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- Routes: **TERRITORIES ARE HIGHWAY-BOUNDED** (Spencer 08-06, CLAUDE.local.md has the 4 lines). One owner each. NEXT: rebuild territories.json zips to those lines — my zip groups were invented, put 3 techs in Seattle one day. Robert starts 08-10; Tavis back 08-17, Cory out of field.
- Cadence: **miss now = activity** (fixed 08-06, decide+engine+6 tests). Miss count OVERRIDES the code. 44 visits/5wk flip monthly→weekly — Luke 31, Cory 1: the guys read "activity" as mounds. Spencer reinforcing. Open: no backfill of those 44.
- Field tech training (briefs/technician-training-program): M3/M4/M8 draft, M4 trainable ≤1ac. **Cory's notes = the note standard.** Opens: 1-5ac walk, what counts as a miss, photos, field quotes, tokens `onX`/`you`. M0,1,2,5,6,7,9,10 + Field Guide v2 not started.
- Phone training: Muhammad 7 roleplays 63→86→75; block SOLVED. Gaps: guarantee 1/7, address drops when rushed. LIVE 8/7. Canon: muhammad-portable/project-instructions.md
- TMCP 8/5: MRR $73.1K, 661 jobs/642 clients; tag=per-CLIENT NEVER=jobs. QF on-close=OUTSIDE MRR. Open: Kaiser#5390 dbl-tag.
- NS1: $857K T12 +37%; close 69%, gap=quote-ISSUE. NOW: LSA(gated)+pricing A-F. NS2: kits LIVE, $0 rev; Ads+GSC OAuth expired.
- Phone/TEXT: Quo LIVE 253-683-7555, no inbound DTMF; no-answer→CR# 253-461-0822. CUTOVER = prod Dial dest 0211→7555. CR→Jobber sync failing. Path A: briefs/jobber-text-routing.
- n8n: Jobber cred dead 7/24. Lead Alert blocked on LEAD_ALERT_SMTP_* pw. Jobber dupes 97grp — briefs/jobber-duplicate-cleanup.

## Environment Notes
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); no auto-start on reboot; scripts/start-crons.ps1 if down.
- PHONES: MAIN **253-750-0211** (CallRail+AI). **253-326-1740 = SPENCER'S CELL**, wrongly in Jobber Co.Settings — FIX to 0211. Jobber SMS 253-300-0889 text-only. CallRail READ-ONLY.
- Jobber: notes(last:40) newest; **JobNote.createdBy → `... on User { name { full } }`** = per-tech notes. visitEditAssignedUsers REPLACES. Sort: quotes CREATED_AT, clients/jobs DON'T.
- OptimoRoute: SYNC unschedules, UPDATE safe. balancing=ON_FORCE reassigns — plan --balancing=OFF.
- Routes: 40h target/42 ceil; times=PLACEHOLDERS; overflow≤15min.

## Pending Decisions
- Job durations: flat 10-min WRONG (Alias 41.5h=46h real). Tag heavy jobs/medians.
- Route redesign OPEN: region-rhythm map (1x vs 2x/wk; splits=OPPOSITE ends of wk).
- LinkedIn: profile fix → daily connects.
