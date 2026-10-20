# Memory — Scratchpad (cap 2,500)

## Active Threads
- ROUTE-ENGINE REDESIGN (09-18/19): ownership register w/ coverage -> route patterns -> obligation ledger -> weekly repair + exceptions -> one writer. Doc artifact/f0ea6c87-f10c-4319-96e1-65243fa7e2fd; redesign/2026-09-19_redesign-plan.md. 7 decisions pending.
- TERRITORY TRUTH (30d audit to 09-17): only 4 of 10 v9 handovers executed; Cory & Robert swapped halves. Off-tech 13%, off-day 29%. Ferry doc artifact/7Ai7GUQHnFrJoFHZ3sNtoF.
- WEEK LOOP: Spencer sets days+techs in Jobber -> copy ops/2026-10-05_week/sync-plan-times.mjs --execute --no-times -> first stops >=7:00 -> --from-saved -> arrival-window-sweep -> build-timetable.mjs, republish artifact/1nAEZLZxLiwR9VTQT2X8nS. Wk 10-19 done.
- LOOKUP: Muhammad lookup needs weekly rebuild; Spencer to run scripts/run-service-day-refresh.ps1 -Install.
- OR driver defaults: Alias 6:35-6:35p, Cory 6:35-4:35p, Luke 6:25, Robert 6:40, Tavis 6:15. Per-day rows freeze old hours.
- Fri 12:00 PT: redesign/scripts/snapshot-week.mjs --part=all.
- COLLECTIONS 09-15: open $18,163/89; 23 unworked $6,633 (data/2026-09-16_call-list.md), 3 chronic first. W.Plaza $1,700 COI/DBA.
- LINKEDIN (STALE 09-15): Ryan Gordon (Arcis) site visit lapsed. READ INBOX FIRST. 12 invites pending. Golf >> HOA.
- TMCP: 11 clients tagged Autopay w/ card on file but autopay OFF = $983/mo, one switch each (09-15 audit §3).
- MO GRADING 10-17: avg 69.9 (Aug 76.2), 0/92 beats pre-price. callrail-faq/call-grading/2026-10-16_month.md
- COFFEE (personal): projects/briefs/coffee-roasting/.
- REVIEWS 10-19: 350 total/340 five-star (SeaTac 201/193, Tacoma 118/117, Enumclaw 31/30) via pull-review-feed --pages 60. CLAUDE.local still 289/283, update awaits OK.

## Environment Notes
- OptimoRoute: no actual times; per-date driver hours API-immutable; SYNC unschedules, UPDATE safe; balancing OFF.
- FleetSharp = Linxup v2: app02.fleetsharp.com /ibis/rest/api/v2, Bearer Version-2 token, POST /trips|/stops {fromDate,toDate} <=48h. redesign/scripts/gps-pull.mjs (Spencer runs it). Stops carry geofenceName = customer.
- ALL CRONS STOPPED. Never re-enable route-drift-check / jobber-visit-followups / route-horizon-extend.

## Pending Decisions
- The 7 redesign decisions above; Alias overtime (42.6 of 61 h); Isabella Kestner placement (Robert Wed).
- Mo rulings: month report §6 (acreage tier, $375 deposit, QF senior, edge zips).
- v9 file vs as-built map: which becomes canonical (Ferry input pending).
