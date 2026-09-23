# Memory — Scratchpad (cap 2,500)

## Active Threads
- ROUTE-ENGINE REDESIGN (09-18/19): plan = ownership register w/ coverage column -> persistent route patterns -> obligation ledger -> weekly repair + exception list -> one writer. Doc claude.ai/code/artifact/f0ea6c87-f10c-4319-96e1-65243fa7e2fd; file redesign/2026-09-19_redesign-plan.md. Codex reviewed (32 findings verified). 7 decisions pending (seams, weekday promises, exception priority, Cory float, wall definition, Alias 50 h book, monthly anchor). Seam pack: redesign/seam-pack.html (local only).
- WEEK OF 09-21 ran through the new loop: Spencer hand-sets days+techs in Jobber -> ops/2026-09-21_swap/sync-plan-times.mjs --execute [--tw=07:00-21:00] -> arrival-window-sweep -> write-authority disable. Wed 09-23 reversed (Kent 07:00 -> Algona); OR shows 27/29 (per-day hours cap). Delete anchor END-* orders if any linger.
- 07:00 FIRST-JOB RULE: driver defaults set (Alias 6:15, Cory 6:00, Luke 6:25, Robert 6:40, Spencer 6:40, Tavis 6:15) but per-day rows for 09-21..25 still 07:00 — Spencer resets them in Plan Routes dialog; next week defaults apply.
- Friday snapshot: run redesign/scripts/snapshot-week.mjs --part=all every Fri 12:00 PT (first capture 09-19).
- AUTOPAY, TEXT robot, SIP, TMCP conversion threads unchanged since 08-12 (see daily logs).

## Environment Notes
- Jobber HAS coordinates (PropertyAddress.coordinates). OR has no actual times; per-date driver hours API-immutable; SYNC unschedules, UPDATE safe; balancing OFF.
- FleetSharp = Linxup v2 API: host app02.fleetsharp.com, /ibis/rest/api/v2, Bearer = Version-2 token, POST /trips|/stops {fromDate,toDate} <=48h. Pull: redesign/scripts/gps-pull.mjs (Spencer runs it; classifier blocks this session). Stops carry geofenceName = customer.
- Paid day = first job to last job (Gusto); commute unpaid. Homes: Alias Snohomish, Tavis Auburn, Cory Buckley, Robert Maple Valley, Luke Edgewood, Spencer Enumclaw.
- ALL CRONS STOPPED. Never re-enable route-drift-check / jobber-visit-followups / route-horizon-extend.
- Codex CLI: no shell here; bundle cat -n source via stdin.

## Pending Decisions
- The 7 redesign decisions above; Alias overtime (42.6 of 61 h); Isabella Kestner placement (Robert Wed).
