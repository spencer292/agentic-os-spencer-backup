# Memory — Scratchpad (cap 2,500)

## Active Threads
- ROUTE-ENGINE REDESIGN: register -> patterns -> ledger -> weekly repair -> one writer. Doc artifact/f0ea6c87-f10c-4319-96e1-65243fa7e2fd; redesign/2026-09-19_redesign-plan.md. 7 decisions pending.
- TERRITORY TRUTH (30d audit to 09-17): only 4 of 10 v9 handovers executed; Cory & Robert swapped halves. Off-tech 13%, off-day 29%. Ferry doc artifact/7Ai7GUQHnFrJoFHZ3sNtoF.
- WEEK LOOP: Spencer sets days+techs in Jobber -> copy ops/2026-10-05_week/sync-plan-times.mjs --execute --no-times -> first stops >=7:00 -> --from-saved -> arrival-window-sweep -> build-timetable.mjs, republish artifact/1nAEZLZxLiwR9VTQT2X8nS. Wk 10-19 done.
- LOOKUP: weekly rebuild, Spencer runs scripts/run-service-day-refresh.ps1 -Install.
- OR driver defaults: Alias 6:35-6:35p, Cory 6:35-4:35p, Luke 6:25, Robert 6:40, Tavis 6:15. Per-day rows freeze old hours.
- Fri 12:00 PT: redesign/scripts/snapshot-week.mjs --part=all.
- COLLECTIONS 10-20: 38 texted $4,820 + AUTOPAY invite (consent: data/autopay-consent-reply.md). 14 texted-unpaid + 6 commercial need calls.
- WHALE HUNT: starts 10-26, 10 wks. App artifact/AjQJM8aYF9YeixRFMcdLmA Wk1 touches + Kidder call await Spencer.
- LINKEDIN: 80 invites/wk, parks primary; 10-22 queue in 2026-10-20_session-5.md.
- TMCP: 11 tagged Autopay, card on file, autopay OFF = $983/mo (09-15 audit §3).
- MO GRADING 10-17: avg 69.9 (Aug 76.2), 0/92 beats pre-price. callrail-faq/call-grading/2026-10-16_month.md
- DIGIHAMMER EXIT: $300/mo, ads extra, Spencer owns Meta. Next: read-only HighLevel sweep + DND export. Plan in marketing-in-house/
- REVIEWS 10-19: 350 total/340 five-star (pull-review-feed --pages 60). CLAUDE.local still 289/283, update awaits OK.

## Environment Notes
- OptimoRoute: no actual times; per-date driver hours API-immutable; SYNC unschedules, UPDATE safe; balancing OFF.
- FleetSharp = Linxup v2: app02.fleetsharp.com /ibis/rest/api/v2, Bearer Version-2 token, POST /trips|/stops {fromDate,toDate} <=48h. redesign/scripts/gps-pull.mjs (Spencer runs it). Stops carry geofenceName = customer.
- ALL CRONS STOPPED. Never re-enable route-drift-check / jobber-visit-followups / route-horizon-extend.

## Pending Decisions
- The 7 redesign decisions above; Alias overtime (42.6 of 61 h); Isabella Kestner placement (Robert Wed).
- Mo rulings: month report §6 (acreage tier, $375 deposit, QF senior, edge zips).
- v9 file vs as-built map: which becomes canonical (Ferry input pending).
