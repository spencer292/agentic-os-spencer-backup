# Memory — Scratchpad (cap 2,500)

## Active Threads
- ROUTE-ENGINE REDESIGN (09-18/19): plan = ownership register w/ coverage column -> persistent route patterns -> obligation ledger -> weekly repair + exception list -> one writer. Doc claude.ai/code/artifact/f0ea6c87-f10c-4319-96e1-65243fa7e2fd; file redesign/2026-09-19_redesign-plan.md. Codex reviewed (32 findings verified). 7 decisions pending (seams, weekday promises, exception priority, Cory float, wall definition, Alias 50 h book, monthly anchor). Seam pack: redesign/seam-pack.html (local only).
- WEEK OF 09-21 ran through the new loop: Spencer hand-sets days+techs in Jobber -> ops/2026-09-21_swap/sync-plan-times.mjs --execute [--tw=07:00-21:00] -> arrival-window-sweep -> write-authority disable. OR shows 27/29 (per-day hours cap); delete lingering END-* anchors.
- 07:00 FIRST-JOB RULE: driver defaults set (Alias 6:15, Cory 6:00, Luke 6:25, Robert 6:40, Spencer 6:40, Tavis 6:15) per-day rows override them — Spencer sets those in Plan Routes.
- Fri 12:00 PT: redesign/scripts/snapshot-week.mjs --part=all (first 09-19).
- COLLECTIONS 09-15: 40 texts sent, $5,120, 0 doubles. Open $18,163/89 clients. UNWORKED: call list 23/$6,633 (data/2026-09-16_call-list.md) — start w/ Deborah Larry, Nancy Parkes, Dennis Scroggins (~107d, $1,115, NEVER contacted). W.Plaza $1,700 blocked on COI/DBA. Marius $100 parked. Not yet measured. AUTOPAY/SIP unchanged since 08-12.
- COFFEE (personal, not GM): Behmor plan + live margin model, projects/briefs/coffee-roasting/. Bullet only after 4 sold-out wks.

## Environment Notes
- Jobber HAS coordinates (PropertyAddress.coordinates). OR has no actual times; per-date driver hours API-immutable; SYNC unschedules, UPDATE safe; balancing OFF.
- FleetSharp = Linxup v2 API: host app02.fleetsharp.com, /ibis/rest/api/v2, Bearer = Version-2 token, POST /trips|/stops {fromDate,toDate} <=48h. Pull: redesign/scripts/gps-pull.mjs (Spencer runs it; classifier blocks this session). Stops carry geofenceName = customer.
- Paid day = first job to last job (Gusto); commute unpaid. Homes: Alias Snohomish, Tavis Auburn, Cory Buckley, Robert Maple Valley, Luke Edgewood, Spencer Enumclaw.
- ALL CRONS STOPPED. Never re-enable route-drift-check / jobber-visit-followups / route-horizon-extend.
- Codex CLI: no shell here; bundle cat -n source via stdin.

## Pending Decisions
- The 7 redesign decisions above; Alias overtime (42.6 of 61 h); Isabella Kestner placement (Robert Wed).
