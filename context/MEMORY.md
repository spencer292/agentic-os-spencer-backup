# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- AUTOPAY = biggest open $: TMCP 31% on (212/809 jobs); 463 jobs/449 clients billed by hand, 277 ALREADY hold a card ≈ $32k/mo manual. readable, NO mutation — manual toggle. CONSENT campaign not a sweep; keep T2 (237 current) off past-due nudges.
- TEXT robot LIVE (briefs/jobber-text-automation): browser-only, API can't send/read texts. 1st run 8/11 = 40 texts/$5,914/0 fail. Open: 28 rolled ($2,475), 8 commercial by phone ($3,580). Inbound lane unbuilt.
- QUO TERMINATED 8/11 ("Suspected Cold Calling" fraud model). Appeal + consent PDFs BUILT, NOT SENT (briefs/quo-account-appeal). Cause: lead-alerts had Muhammad calling 75 Jobber leads vs 4 real missed calls; website form takes bot spam. No line for him until resolved.
- Routes: v8-highway live. Wed/Thu/Fri 08-12..14 routed+verified, Mon untouched. BLOCKED: optimize-plan.json 08-10..14 unwritten → wk 08-17 has ZERO routes. drift-check OFF. 08-17 Tavis handover: no address, run assign-by-territory first. 14 zips have clients but no grid day.
- QuickFix overrun: only 1 of 117 stops at 5 visits; 60 visits past wk5, 11 jobs over. Engine flags, Jobber recurrence ignores it — no gate. PDF 8/11.
- TMCP 8/11: 674 JOBS vs 653 clients, MRR $74.2K. Ninety counted 26 archived (+$2.5K): fixed fwd from wk08-10, ~−15 step 08-17. Open: 6 tag mismatches, 4 dup suspects.
- TMCP-conversion: reactive pitch, not cheaper-QF; 357 targets, Phase1 texts next.
- Lead alerts FIXED 8/11 (9h overnight hole dropped 5 leads; now chains from lastRun). Gmail draft triage BLOCKED on GMAIL_* creds.
- Training: Muhammad live + daily call-grading cron. Field M3/M4/M8 draft only.
- NS1 $857K T12 +37%, gap=quote-issue. NS2 kits LIVE $0 rev; Ads+GSC OAuth expired.

## Environment Notes
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); no auto-start on reboot; scripts/start-crons.ps1.
- PHONES: MAIN 253-750-0211 (CallRail+AI). Jobber SMS 253-300-0889. CallRail READ-ONLY. Cory's On My Way sends his CELL 253-569-4822 — clear his Jobber profile phone.
- Jobber: notes(last:40) newest; createdBy → `...on User{name{full}}`. visitEditAssignedUsers REPLACES. Msg centre = drawer; panel dies after ~14 searches (reset via /home).
- OptimoRoute: SYNC unschedules, UPDATE safe. balancing=ON_FORCE reassigns — use OFF.

## Pending Decisions
- onX waypoint cleanup: gated on Spencer's onX 2FA login. 808 active vs 6,183 archived.
- Send the Quo appeal? PDFs in ~/Downloads.
