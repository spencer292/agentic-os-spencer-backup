# Memory — Scratchpad (cap 2,500)

## Active Threads
- ROUTE-ENGINE REDESIGN (09-18/19): plan = ownership register w/ coverage column -> persistent route patterns -> obligation ledger -> weekly repair + exception list -> one writer. Doc claude.ai/code/artifact/f0ea6c87-f10c-4319-96e1-65243fa7e2fd; file redesign/2026-09-19_redesign-plan.md. Codex reviewed (32 verified). 7 decisions pending. Seams: redesign/seam-pack.html.
- WEEK 09-21 loop: Spencer hand-sets days+techs in Jobber -> ops/2026-09-21_swap/sync-plan-times.mjs --execute [--tw=07:00-21:00] -> arrival-window-sweep -> write-authority disable. OR shows 27/29 (per-day hours cap); delete lingering END-* anchors.
- 07:00 FIRST-JOB: defaults set (Alias/Tavis 6:15, Cory 6:00, Luke 6:25, Robert/Spencer 6:40); per-day rows override — Spencer sets in Plan Routes.
- Fri 12:00 PT: redesign/scripts/snapshot-week.mjs --part=all (from 09-19).
- COLLECTIONS 09-15: 40 texts, $5,120. Open $18,163/89. UNWORKED call list 23/$6,633 (data/2026-09-16_call-list.md) — 3 chronic never contacted (~107d, $1,115) first. W.Plaza $1,700 blocked on COI/DBA. Marius $100 parked.
- LINKEDIN (09-15, STALE): Ryan Gordon (Regional, Arcis Golf) wants a site visit; Wed/Fri offer lapsed. READ INBOX BEFORE pipeline.json. 12 invites pending. SalesNav trial ended 09-21, undecided. Golf >> HOA.
- TMCP: 11 clients tagged Autopay w/ card on file but autopay OFF = $983/mo, one switch each (09-15 audit §3; not in 09-25 report).
- COFFEE (personal): plan+model in projects/briefs/coffee-roasting/. Bullet after 4 sold-out wks.

## Environment Notes
- Jobber HAS coordinates (PropertyAddress.coordinates). OR has no actual times; per-date driver hours API-immutable; SYNC unschedules, UPDATE safe; balancing OFF.
- FleetSharp = Linxup v2 API: host app02.fleetsharp.com, /ibis/rest/api/v2, Bearer = Version-2 token, POST /trips|/stops {fromDate,toDate} <=48h. Pull: redesign/scripts/gps-pull.mjs (Spencer runs it; classifier blocks us). Stops carry geofenceName = customer.
- Paid day = first job to last job (Gusto); commute unpaid. Homes: Alias Snohomish, Tavis Auburn, Cory Buckley, Robert Maple Valley, Luke Edgewood, Spencer Enumclaw.
- ALL CRONS STOPPED. Never re-enable route-drift-check / jobber-visit-followups / route-horizon-extend.
- Codex CLI: no shell; bundle cat -n source via stdin.

## Pending Decisions
- The 7 redesign decisions above; Alias overtime (42.6 of 61 h); Isabella Kestner placement (Robert Wed).
