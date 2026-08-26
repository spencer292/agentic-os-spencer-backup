# Memory — Scratchpad (cap 2,500)

## Active Threads
- AUTOPAY = biggest open $: TMCP 31% on (212/809); 277 hand-billed ALREADY hold a card ≈ $32k/mo. Manual toggle only. Keep T2 (237) off past-due nudges.
- TEXT robot LIVE (jobber-text-automation), browser-only. 8/11 = 40 texts/$5,914/0 fail. Open: 28 rolled, 8 comml ($3,580).
- SIP LIVE (Quo dead): Telnyx Paid, gotmolesmuhammad@sip.telnyx.com. All CallRail → Muhammad Workflow (Greeting→SIP→20s→VA), screening OFF. Mac+audio UNPROVEN.
- Wk 08-17 SHIPPED: 565 timed, 34 windows. OT 8.8→4.2h; Alias 3.4h unfixable. Cluster pricing live — sweep for more.
- ALL CRONS STOPPED — restart `scripts/start-crons.sh`. Never re-enable: route-drift-check, jobber-visit-followups, route-horizon-extend.
- Mo vs Spencer close = artifact; real gap = Spencer BOOKS on the call (64% vs 17%). quote-chase cron LIVE 09:00 wkdys.
- Phone training: close-verbatim + story bank from 47 Spencer calls (callrail-faq); neither in muhammad-portable.
- QuickFix overrun: 1 of 117 at 5 visits; 60 past wk5, no Jobber gate.
- TMCP 8/11: 674 JOBS vs 653 clients, MRR $74.2K; 6 tag mismatches, 4 dup suspects. Conversion: reactive pitch, 357 targets, Phase1 texts.
- NS1 $857K T12 +37%, gap=quote-issue. NS2 kits LIVE, 0 sales @8/12; Ads+GSC OAuth dead.
- SYPERFORMANCE site: phases 0-7 live on syperformance-build (theme 157001318557, pwd dadiat). Read docs/checklist.md + docs/ia.md §4 first. COPY RULE: SY IS the manufacturer — never claim a shop floor.

## Environment Notes
- SERVICE DAYS from real Jobber visits, NOT the grid (90% vs 73%): build-zip-day-lookup.mjs
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); no auto-start on reboot. Restart does NOT fire a backlog.
- PHONES: MAIN 253-750-0211 (CallRail+AI). Jobber SMS 253-300-0889. CallRail READ-ONLY. Cory's On My Way leaks CELL 253-569-4822.
- Jobber: notes(last:40) newest; visitEditAssignedUsers REPLACES. Quote.linkedCommunications = count only.
- OptimoRoute: SYNC unschedules, UPDATE safe. balancing=ON_FORCE reassigns — use OFF. stop.distance=METRES, route.distance=KM.
- HOURS = job 1 → last job; commute unpaid. route.duration is NOT the working day. CORY IS SALARIED. Tavis on Snoqualmie is deliberate (vs territories.json).

## Pending Decisions
- Techs' 5 home cities? Commute = "distance from the OR start location", proven wrong (Robert=Maple Valley).
- Open-route (payroll) routing: test 1 driver, 1 day, in the OR UI. Prize 3-6 h/wk.
- onX cleanup: gated on 2FA.
