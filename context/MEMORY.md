# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- AUTOPAY = biggest open $: TMCP 31% on (212/809); 463 jobs billed by hand, 277 ALREADY hold a card ≈ $32k/mo manual. NO mutation — manual toggle. Keep T2 (237) off past-due nudges.
- TEXT robot LIVE (jobber-text-automation): browser-only. 1st run 8/11 = 40 texts/$5,914/0 fail. Open: 28 rolled ($2,475), 8 commercial ($3,580). Inbound lane unbuilt.
- QUO TERMINATED 8/11. Appeal + consent PDFs BUILT, NOT SENT (quo-account-appeal). Cause: lead-alerts had Muhammad calling 75 Jobber leads vs 4 real missed calls.
- Routes: v8-highway live. 08-12..14 routed+verified. BLOCKED: optimize-plan.json 08-10..14 unwritten (2 writes, dates passed) → horizon frozen 08-14, wk 08-17 ZERO routes on Tavis's first day. Run assign-by-territory first. 14 zips have clients but no grid day.
- CRONS OFF (Spencer — never re-enable during reconciliation): route-drift-check, jobber-visit-followups (cadence booking; costs ~4-5 slips/day), route-horizon-extend. Nothing auto-writes the schedule. Still writing: callrail-jobber-sync, arrival-window-sweep.
- Muhammad 38% vs Spencer 73% was a MEASUREMENT artifact (5-day vs 10-wk quotes); age-matched 47% vs 50%. Real gap: Spencer BOOKS on the call (64% vs 17%) + 3.3 vs 1.7 follow-up touches. Muhammad closes 82% of quotes that get OPENED = Spencer's 81%.
- quote-chase cron LIVE 09:00 wkdys → emails Spencer+Muhammad open quotes 24h+ unopened/un-followed.
- QuickFix overrun: 1 of 117 stops at 5 visits; 60 visits past wk5. Jobber recurrence has no gate.
- TMCP 8/11: 674 JOBS vs 653 clients, MRR $74.2K. Open: 6 tag mismatches, 4 dup suspects.
- TMCP-conversion: reactive pitch; 357 targets, Phase1 texts next. Gmail triage BLOCKED on GMAIL_* creds.
- NS1 $857K T12 +37%, gap=quote-issue. NS2 kits LIVE, 0 sales @8/12; Ads+GSC OAuth dead 2wk.

## Environment Notes
- SERVICE DAYS come from real Jobber visits, NOT the territory grid (90% vs v8's 73%): build-zip-day-lookup.mjs → claude.ai/code/artifact/2b11dddd-f39b-488d-b32b-f9aed6f3be76
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); no auto-start on reboot; scripts/start-crons.ps1. Restarting does NOT fire a backlog (lastSweepAt is in-memory).
- PHONES: MAIN 253-750-0211 (CallRail+AI). Jobber SMS 253-300-0889. CallRail READ-ONLY. Cory's On My Way sends his CELL 253-569-4822.
- Jobber: notes(last:40) newest; visitEditAssignedUsers REPLACES. Quote.linkedCommunications = count only, no bodies/channel.
- OptimoRoute: SYNC unschedules, UPDATE safe. balancing=ON_FORCE reassigns — use OFF.

## Pending Decisions
- "Voip Passwords.txt" sits UNTRACKED + UNIGNORED in repo root — never `git add -A`. Delete or ignore.
- Archive the stale optimize-plan.json and plan wk 08-17?
- onX cleanup: gated on Spencer's onX 2FA. Send the Quo appeal? PDFs in ~/Downloads.
