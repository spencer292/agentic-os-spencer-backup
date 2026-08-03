# Memory — Working Scratchpad (cap 2,500)

## Active Threads
- **Routes:** SPENCER OUT OF FIELD (perm). Alias=4th truck (home start Snohomish). grid-v5 LIVE, week 8/3-7 pushed: 36.8/37.9/37.5/33.4h, 1,828mi vs 1,983 base. TAVIS NOT WORKING: 3,982 future visits→Dec27 / 240 recur jobs; office must re-point in Jobber UI or they regenerate.
- **Tech training:** L3 brief+modules live. M3 DONE; M4 SKELETON, 8 Qs PENDING (blocks M8). Field Guide=manual, program on top.
- **Cash-flow:** ~$69.7K MRR/625 mem. Open: Aug1 Muir #7150; signup fix tag+monthly+RECUR. Mole Busters $100/close FINAL — sign, CallRail#, W9.
- **NS1 $5-10M:** $857K T12 +37%. Close 69%; real gap=quote-ISSUE rate. NOW: LSA(gated)+pricing A-F(~$72K/yr). Roles1-3 FINAL, next Role4.
- **NS2 — $100K:** kits LIVE Gumroad, $0 rev. Ads $11/$75; REFRESH_TOKEN expired→rr-mint-refresh-token.mjs. GSC blocked (enable API, proj 377890328473).
- **Email triage:** spencer@ LIVE 6x/day drafts-only. SEND: D.Moore, J.Chao. Open: ~17 bounced, Kristine/Cheng unquoted.
- **Phone ops:** CallRail VA sync hourly; ads bypass CallRail, tracker 253-331-2772 SWAP pending. Open: Muhammad zip email, post-call SMS, DMARC→quarantine mid-Aug.
- **n8n DOWN:** Jobber cred dead ≤7/24 → Visit Notes silent-failed 7 nights; Lead Alert INACTIVE. New app: connect fails id/secret (Auth=Body, Scope blank).
- **Jobber dupes:** 97grp/114 extra; 82% CallRail(25967) double-writes. Brief: jobber-duplicate-cleanup.
- GBP 270 rev/4.96 (GOT-MOLES.md "219+" stale). gm-visit-notes worker LIVE.

## Environment Notes
- Cron: AGENTIC_OS_CLAUDE_BIN (setx); dies on reboot.
- CallRail READ-ONLY. Jobber phone 253-326-1740. tool-browser: CDP Chrome profile.
- Jobber: notes(last:40) newest; visitEditAssignedUsers REPLACES; NO job-level assign mutation.
- OptimoRoute: SYNC unschedules, UPDATE safe. No create_driver/get_drivers. Any ENABLED driver collects stops → set-driver-days weekly. **balancing=ON_FORCE reassigns stops ACROSS techs after the grid** — plan `--balancing=OFF` for territory ownership.
- **Routes (grid v5, spec in briefs/technician-route-automation/2026-08-01_...md):** 40h target/42 ceiling; visit times are PLACEHOLDERS not promises; overflow = one job at a time to nearest route, ≤15min detour; problem jobs → Cory. Never `write --date=` on a plan with day-moves (guard added).

## Pending Decisions
- LinkedIn: Spencer fixes profile then daily connects. RR ads: keep/cut after a week of CPC data.
- **Job durations: flat 10-min guess is WRONG** (Alias 41.5h model = ~46h real). Tag heavy jobs or take medians from completed visits — every balance decision inherits this error.
