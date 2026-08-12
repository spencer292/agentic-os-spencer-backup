# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- AUTOPAY = biggest open $: TMCP 31% on (212/809); 277 hand-billed clients ALREADY hold a card ≈ $32k/mo. Manual toggle only. Keep T2 (237) off past-due nudges.
- TEXT robot LIVE (jobber-text-automation): browser-only. 8/11 = 40 texts/$5,914/0 fail. Open: 28 rolled ($2,475), 8 commercial ($3,580).
- QUO TERMINATED 8/11. Appeal + consent PDFs BUILT, NOT SENT (quo-account-appeal). Cause: lead-alerts had Mo calling 75 Jobber leads vs 4 real missed calls.
- Routes: v8-highway live, 08-12..14 verified. BLOCKED: stale optimize-plan.json → horizon frozen 08-14, wk 08-17 ZERO routes on Tavis's 1st day. Run assign-by-territory first.
- CRONS OFF (never re-enable in reconciliation): route-drift-check, jobber-visit-followups (cadence; ~4-5 slips/day), route-horizon-extend. Nothing auto-writes the schedule. Still writing: callrail-sync, arrival-sweep.
- Mo 38% vs Spencer 73% = artifact (5-day vs 10-wk quotes); age-matched 47/50. Real gap: Spencer BOOKS on the call (64% vs 17%) + 3.3 vs 1.7 touches. Mo closes 82% of OPENED quotes ≈ Spencer's 81%.
- quote-chase cron LIVE 09:00 wkdys → emails Spencer+Mo quotes 24h+ unopened/un-followed.
- Phone training: close-verbatim + story bank built from Spencer's own 47 calls (callrail-faq). Neither is in muhammad-portable yet.
- QuickFix overrun: 1 of 117 stops at 5 visits; 60 past wk5, no Jobber gate.
- TMCP 8/11: 674 JOBS vs 653 clients, MRR $74.2K; 6 tag mismatches, 4 dup suspects. Conversion: reactive pitch, 357 targets, Phase1 texts next. Gmail triage BLOCKED on GMAIL_* creds.
- NS1 $857K T12 +37%, gap=quote-issue. NS2 kits LIVE, 0 sales @8/12; Ads+GSC OAuth dead 2wk.

## Environment Notes
- SERVICE DAYS from real Jobber visits, NOT the grid (90% vs v8 73%): build-zip-day-lookup.mjs → claude.ai/code/artifact/2b11dddd-f39b-488d-b32b-f9aed6f3be76
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); no auto-start on reboot; start-crons.ps1. Restart does NOT fire a backlog (lastSweepAt in-memory).
- PHONES: MAIN 253-750-0211 (CallRail+AI). Jobber SMS 253-300-0889. CallRail READ-ONLY. Cory's On My Way leaks his CELL 253-569-4822.
- Jobber: notes(last:40) newest; visitEditAssignedUsers REPLACES. Quote.linkedCommunications = count only.
- OptimoRoute: SYNC unschedules, UPDATE safe. balancing=ON_FORCE reassigns — use OFF.

## Pending Decisions
- Archive the stale optimize-plan.json and plan wk 08-17?
- onX cleanup: gated on onX 2FA. Send Quo appeal? PDFs in ~/Downloads.
