# Grid v5 — four-way re-cut for the week of Aug 3–7

**Spencer, 2026-08-01:** Alias Franks = north. Cory Ventura takes everything Cammeron was on last
week. Cammeron + Luke split the south route.

Built against the live Jobber board (513 visits in the 8/2–8/9 window). Every zip with a visit next
week is in the grid — `zip-not-in-grid: 0`, `grid-day frozen: 0`.

## Built plan — stops / miles / hours (OptimoRoute, **541 of 541 routed**)

|     | Alias | Cory | Cammeron | Luke |
|-----|------|------|----------|------|
| Mon | 31 / 75mi / 8.6h | — *(no route)* | 26 / 77mi / 6.8h | 26 / 137mi / 8.4h |
| Tue | 26 / 73mi / 8.0h | 53 / 87mi / **11.1h** | 26 / 96mi / 7.5h | 23 / 115mi / 7.5h |
| Wed | 36 / 110mi / **10.4h** | 24 / 84mi / 5.8h | 25 / 35mi / 5.6h | 20 / 155mi / 8.2h |
| Thu | 29 / 75mi / 7.5h | 49 / 130mi / **11.8h** | 20 / 59mi / 5.1h | 19 / 63mi / 5.2h |
| Fri | 33 / 130mi / 9.1h | 29 / 89mi / 6.9h | 22 / 87mi / 7.0h | 24 / 176mi / 9.1h |
| **wk** | **43.6h** | **35.6h** | **32.0h** | **38.4h** |

**1,854 road miles against the 1,983 baseline (-6.5%).** 0 unrouted, 0 SETs stranded, 0 orphans.
Morning deadhead down to 7.4h/week from 10.7h — Alias's start moved from the depot to his home at
1024 Ludwig Rd, Snohomish, which cut his Monday commute from 45mi/60min to 11.7mi/18min. **Cory
still starts from the depot** (48mi/52min into West Seattle) — same fix, web UI only.

## The routes

**Alias Franks — NORTH** (the standing day pattern, restored — Spencer 2026-08-01: *"that's where
those people think they're getting their visit"*)
- Mon — Bellevue / Kirkland / Redmond / Medina
- Tue — Seattle north of the Ship Canal + Shoreline
- Wed — Bothell / Kenmore / Woodinville / Duvall / Carnation / Snohomish
- Thu — Sammamish / Issaquah + Bellevue-S / Mercer Island
- Fri — I-90: Fall City / Snoqualmie / North Bend

**Cory Ventura — Cammeron's last-week belt (South King)**
- Mon — I-5 belt: Des Moines / Normandy Park → Federal Way → Auburn 98001 → Milton → NE Tacoma
- Tue — West Seattle / Burien / SeaTac / Tukwila / south Seattle *(Mon+Tue combined)*
- Wed — Kent + Renton valley
- Thu — **south of I-90**: Bellevue-S / Mercer Island / Newcastle / Renton highlands
- Fri — Covington / Maple Valley

**Cammeron Anderson — south route, east half**
- Mon — Auburn-east 98002/98092 / Pacific
- Tue — Enumclaw plateau / Black Diamond / Ravensdale
- Wed — Buckley / South Prairie / Wilkeson
- Thu — Bonney Lake / Lake Tapps
- Fri — Sumner / Orting / Edgewood

**Luke LaVergne — south route, west half**
- Mon — Thurston: Olympia / Tumwater
- Tue — I-5: Tacoma proper / Fife
- Wed — peninsula + University Place / Steilacoom / Lakewood
- Thu — Puyallup / South Hill / Spanaway
- Fri — Graham / Eatonville / Yelm / Roy / Lacey

## ROUTING OBJECTIVES (Spencer 2026-08-01) — the spec the weekly run must satisfy

These are the acceptance criteria for an unattended run. If they all pass, the week goes to Spencer
as a single approve/reject. If any fails, retune and re-check BEFORE showing him anything.

1. **Target 40 hours per week per tech; up to 2 hours of overtime is APPROVED** (Spencer
   2026-08-01). The hard ceiling is **42h**. Aim at 40, never exceed 42. Not a daily measure.
1b. **Do not make an extra trip to an area to avoid a small amount of overtime** (Spencer
   2026-08-01). A second run out to a district costs more than an hour of overtime. If the work can
   be reached inside the 42h ceiling on a route already going there, do that.
1c. **Overflow cascades.** If the nearest tech is also over, that tech sheds to ITS nearest
   neighbour first, freeing room. Rebalance in rounds until nobody exceeds the ceiling or no move
   inside the detour limit exists.
2. **A 9-hour day is acceptable** provided that tech's week stays under 40h.
3. **Hours are measured first stop to last stop** — that is the paid day. Commute to the first stop
   and home from the last are NOT paid and NOT counted (Spencer 2026-08-01).
4. **Day and tech stability is the PREFERENCE, not a hard constraint** (relaxed by Spencer
   2026-08-01: *"it's ok if the days shift, I think I'm past that"*). Try to keep a house on the same
   day with the same tech; where that cannot be made to work, shift it and report the change. Same-day
   is the tie-break when two candidate moves cost the same.
5. **No driving past jobs.** Minimise miles per stop, and flag any stop whose nearest neighbour that
   day sits on a different tech's route.
6. **Stale duplicates are deleted automatically** when a confirmed surviving visit exists on the same
   job — no per-batch approval. Report what was deleted (Spencer 2026-08-01).
7. **The Jobber write always needs Spencer's yes.** It reassigns visits and sends arrival windows.
7b. **Never write one day of a plan that moves visits between days.** `--date=` only writes visits
   arriving INTO that day; anything leaving stays put with its old tech, and that day's arrival
   emails have usually already gone. This stranded 53 visits on 2026-08-03 — 11 on Tavis, 5
   unassigned, 1 on Spencer — and 52 customers had to be emailed a new day. `optimize-week write`
   now refuses a scoped write when the plan moves anything off that date (2026-08-02).
8. **Level the days WITHIN each tech, not just the week** (Spencer 2026-08-01). A 9h day next to a
   5h day is a failure even when the week totals under 40. Where a tech has an unbalanced pair of
   days, work slides between them — but only where the geography allows it:
   - **15 minutes' drive is the hard ceiling** between the sliding work and the receiving day's
     cluster. Under 15 is better; prefer the closest candidate first.
   - Encode it as a TWO-DAY ZONE (`days: [a, b]` on the zip) so the optimizer splits the zip across
     both of that tech's days and finds the balance itself, rather than hand-picking stops.
   - Never slide work between two different technicians to fix a day imbalance — that breaks rule 4.
   - Target: no two days for the same tech more than ~2h apart.

## Standing rules set 2026-08-01

- **Thursday I-90 rule:** Cory takes everything south of I-90, Alias everything north. Standing
  until Cory is replaced. Encoded as zip rules (98006/98040 → Cory thu), not job overrides.
- **Duplicate keeper rule:** when a job has two visits the same day, the one whose title carries a
  parenthetical — "(set)", "(problem job)", "(5th visit)" — always survives. It beats roster,
  committed window, and visit age. `find-dup-visits.mjs` enforces the order; it never deletes.
- **Multi-visit jobs keep their own days.** `push-week` no longer grid-forces a job that has more
  than one visit in the window — that was stacking two visits to the same customer ten minutes
  apart (6 jobs on 2026-08-01).
- **An explicit jobOverride beats the committed-window pin.** A person deciding outranks the rule,
  but anything moved that way needs the customer re-notified — the pipeline cannot do that.

## Calls made inside the instruction

- **The Auburn / Federal Way / Edgewood tail came off Cory.** Cammeron ran it last week, but it
  adjoins Pierce, and handing all of it to Cory put him at 153 stops against ~100 for each of the
  south trucks. Auburn/Pacific went to Cammeron's Monday, Federal Way/Milton to Luke's I-5 Tuesday.
  Cory keeps the core: West Seattle/Burien/SeaTac → Kent/Renton/Covington/Maple Valley/Newcastle.
- **The peninsula sits on Luke's Wednesday** (Gig Harbor, Fox Island, Olalla, Longbranch, Vaughn,
  Bremerton, Port Orchard). It was Spencer's standing run; he is out of field, and Luke's Wednesday
  is the only day already crossing the Narrows.
- **Every v4 jobOverride was dropped.** All 32 came from the 7/26 day-review of a three-truck
  structure that no longer exists, and each would now drag a stop across the new lines. SETs keep
  their day through `push-week`'s pin rule (67 pinned, 4 sets next week), not through overrides.
- **Roster:** Spencer Hill, Tavis Alexander and Robert Norton are all in `notWorking`, so
  `set-driver-days` disables them in OptimoRoute for the week. Norton stays a ride-along.

## Open — needs Spencer

- **Alias carries 44.0h against 30.7h (Cory) and 31.0h (Cammeron), and still drops 6 stops.** The
  north has always been one truck's worth of standing days; it is now one truck's worth for a tech
  running solo for the first time. Monday is 10.0h and Thursday 9.7h before commute.
- **6 stops did not fit** — 4 Kirkland 98034 on Monday, Mercer Island #8171 and Issaquah #8213 on
  Thursday. All Alias overflow. They stay in Jobber on their day but get no arrival window.
  - *Option A* — accept, and let the 6 roll to the following week.
  - *Option B* — Kirkland 98033/98034 (7 stops) Mon → Wed. Wednesday is his lightest day (7.7h) and
    Kirkland adjoins Kenmore/Bothell. Costs Kirkland's standing Monday.
  - *Option C* — Mercer Island 98040 → Cory's Thursday (6 mi from Newcastle over I-90). Clears one
    stop, not the Monday four.
- **West Seattle 98106/98116/98126/98136/98146 moved Tue → Mon** on Cory's route. Cammeron ran
  Seattle-west + Burien + Normandy Park on one Tuesday while Cory covered the rest of Seattle the
  same day; one truck cannot hold both halves (57 stops), so the compact West Seattle block moved.
- **Maple Valley 98038 (was Wed) and Covington 98042 (was Thu) both moved to Friday** on Cory's
  route, for the same reason — together they are 34 stops and neither of his other days has room.
- **Job #8056 Madera West Condos** was Spencer's personal account (98023 Federal Way). With Spencer
  out of field it now falls to Luke's Tuesday under the zip rule. Needs a decision.
- Robert Norton has no OptimoRoute driver record at all — `ERR_DRIVER_NOT_FOUND` on all 5 days.
  Correct for a ride-along, but it means nothing stops Jobber assigning him solo visits (he had 22
  last week, 18 of them Buckley).

## Build sequence (OptimoRoute only — nothing reaches customers)

```
node set-driver-days.mjs   live --grid=territory-grid-v5.json --week=2026-08-03
node prune-stale-orders.mjs live 2026-08-03 2026-08-07 --visits=<fresh>
node push-week.mjs         live --grid=territory-grid-v5.json
node lock-techs-to-grid.mjs live --grid=territory-grid-v5.json --visits=<fresh>
node optimize-week.mjs     plan --grid=territory-grid-v5.json
node week-miles.mjs 2026-08-03 2026-08-07 grid-v5
node verify-week.mjs --grid=territory-grid-v5.json --week=2026-08-03
```

`lock-techs-to-grid` replaces `lock-techs-to-jobber --fallback=grid` this week: Jobber still has
Cammeron on 79 South-King visits, and Jobber-authoritative resolution would keep them there —
exactly the thing this re-cut moves to Cory.

Only `optimize-week.mjs write` touches Jobber and triggers arrival-window emails. It is held for
sign-off. **Deadline: Sun 8/2 14:00 PT.**
