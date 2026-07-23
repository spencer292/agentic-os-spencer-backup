# Route Density Audit & Optimization Plan — 2026-07-22

**Scope:** actual OptimoRoute plans for the two completed weeks 7/13–7/17 and 7/20–7/24 (38 routes,
~1,120 stops), audited read-only. Goal per Spencer: stop passing the same jobs repeatedly, hit far
south and far north at least twice a week, shortest possible drives for every driver.

> **STATUS (2026-07-22): APPROVED by Spencer — except P4 (peninsula biweekly), which is REJECTED;
> the peninsula run stays weekly.** The 24 territory-grid.json day flips for P1–P3 are applied
> (grid v2). Remaining implementation: push-week `allowedDates` = grid-day(s) change + scripted
> transition day-moves, both targeting the week of 8/3 (must NOT be active for the Sunday 7/26 run
> — grid-day locks would collide with Cammeron's blocked Friday 7/31).

---

## 1. What the fleet actually costs today

| Driver | Week 7/13 | Week 7/20 | mi/stop | Notes |
|---|---|---|---|---|
| Cammeron | 150 stops, 837 mi, 17h drive | 165 stops, 889 mi, 18h drive | **5.4–5.6** | The density benchmark |
| Luke | 149 stops, 968 mi, 20h drive | 152 stops, 1,120 mi, **24h drive** | 6.5–7.4 | Longest drive-hours in fleet |
| Cory | 151 stops, 1,214 mi, 17h drive | 152 stops, 1,120 mi, 16h drive | 7.4–8.0 | Highest miles in fleet |
| Spencer | 60 stops, 674 mi, 11h drive | 82 stops, 882 mi, 15h drive | 10.8–11.2 | Overflow + peninsula |

**Fleet total: ~3,700–4,000 mi and ~65–73 drive-hours per week.** Most routes are healthy
(60–70% of the day on service, tight 4–7 km spread). The waste is concentrated in four specific
patterns below — fixing those is worth roughly **400–500 mi/week**.

## 2. Findings, ranked by waste

### F1 — Cory's Monday is the most expensive route in the fleet (290–365 mi)
Sequence on 7/13: Bellevue *(49 mi stem)* → Medina → Clyde Hill → **Kenmore** → Kirkland →
Yarrow Point → back to Bellevue → Redmond → Woodinville → **Snohomish (+12 mi)** → Woodinville →
Bothell → Kirkland → Redmond → Bellevue. Two causes:
- **Far-north strays mixed into an Eastside-core day.** The far-north band (Kenmore, Bothell,
  Woodinville, Snohomish, Shoreline) is currently brushed on **three separate days** — Mon (12
  stops), Tue (11–12), Wed (17–20). Three partial trips north = the definition of "driving past
  the same jobs over and over."
- A 44–49 mi morning stem to the first stop (start-location overhead, structural).

### F2 — Luke's south structure sends him past Olympia twice but serves it once
- Mon = Olympia metro proper (~26 stops/wk, tight once there, but 33 mi stem).
- Tue = the rural arc: Olympia-edge → Tenino *(+20)* → Yelm *(+18)* → Roy *(+16)* → Graham →
  Eatonville *(+19)* → Spanaway → Orting → Puyallup. **356 mi and 7.2 drive-hours on 7/21 — only
  41% of the day was actual work.** 15–25 of those Tue stops are in the far-south band he already
  visited Monday.
- Net: the truck enters far-south territory twice a week already, but Olympia customers can still
  wait up to 7 days because only Monday truly serves the metro.

### F3 — Cammeron's Wed and Thu are the same territory twice
Wed 7/22 cities: Auburn, Kent, Renton, Issaquah, Maple Valley.
Thu 7/23 cities: Auburn, Covington, Maple Valley, Kent, Normandy Park, Renton, Issaquah.
**Identical belt two days running** — the audit found 8 jobs where one day's route came within
0.8 km of the other day's stops (Plemmons, Amy Collins, Kauzlarich, Prologis in Kent; Dendy/Roy in
Issaquah). Auburn gets touched **4 days a week**; Renton 3; Kent 3; Maple Valley 3. Also Issaquah
doesn't belong to Cammeron at all (it's Cory's Thu territory per the grid), and Normandy Park on
Thu belongs with his Tue Seattle-south day.

### F4 — Spencer's peninsula Tuesday: 23–40 miles per stop
Gig Harbor *(45 mi stem)* → Olalla → Bremerton *(+20)* → Vaughn *(+16)* → Longbranch *(+11)* →
Fox Island *(+35)*. 318 mi for 8 stops (w1), 357 mi for 15 (w2). Only ~38% of the day is work.
Geography is fixed — the only lever is **cadence** (go half as often with twice the stops).

### F5 — Small strays that add up
Orting served on 3 different days; Edgewood 3; Fall City 2; Renton hit hard by two techs on
back-to-back days (Cammeron Wed 34, Spencer Thu 27 — boundary between them is undefined).

## 3. The plan (proposal)

### P1 — Luke: two anchored far-south days (Olympia 2×/week)
| Day | Today | Proposed |
|---|---|---|
| Mon | Olympia/Lacey/Tumwater | **Olympia metro (unchanged)** |
| Tue | Yelm/Graham/Eatonville rural arc | **Enumclaw / Black Diamond** (moved from Thu) |
| Wed | Tacoma/Puyallup | Tacoma/Puyallup **+ Spanaway/Graham/Eatonville** (contiguous belt south of Puyallup) |
| Thu | Enumclaw/Black Diamond | **Far-south day #2: Yelm/Roy/Tenino/Rainier + Lacey/Olympia-east** |
| Fri | Bonney Lake/Lake Tapps/Sumner | Bonney Lake/Lake Tapps/Sumner **+ Orting** (adjacent, kills the Orting strays) |

Far south gets Mon + Thu — max wait for an Olympia-area customer drops from ~7 days to ~4. The
second Olympia stem (~+55 mi) is paid for by killing the Tue far-south re-entry and shortening the
rural arc (−80–120 mi). Net miles ≈ flat-to-down with **response time halved** — this is the
"go to Olympia twice a week" ask, funded by waste elsewhere in the same routes.

### P2 — Cory: two clean far-north days, Monday becomes pure Eastside core
- **Tue** (Seattle day) formally owns **Shoreline + north Seattle** — far-north visit #1.
- **Wed** owns **everything north of Kirkland**: Woodinville, Bothell, Kenmore, Snohomish, Duvall,
  Carnation — far-north visit #2.
- **Mon** loses ALL of the above and becomes Bellevue/Medina/Clyde Hill/Kirkland/Redmond-south
  only. This deletes the Mon criss-cross (Kenmore/Bothell/Snohomish detours) — expected
  **−70–100 mi/week** on the fleet's worst route.

### P3 — Cammeron: draw the Wed/Thu line and purge foreign cities
- **Wed = valley west**: Renton + Kent valley (98030/98032/98055/98057/98058).
- **Thu = east hill**: Kent 98042, Covington, Maple Valley.
- **Issaquah → Cory Thu** (his Sammamish/Issaquah day, per the existing grid).
- **Normandy Park → Tue** (his Seattle-south/Burien day).
- **Auburn consolidates onto Mon** (98002 stays Wed per grid if needed).
Kills the confirmed pass-by cluster and stops Auburn being visited 4 days a week.

### ~~P4 — Spencer: peninsula goes biweekly~~ — REJECTED 2026-07-22
Spencer: the service model doesn't allow the peninsula to go biweekly. **Peninsula stays a weekly
Tuesday run as-is.** (Original idea kept here for the record: alternate Tuesdays batching two weeks
of Kitsap/Gig Harbor stops, ~160 mi/wk saved — not viable.)

### P5 — Renton boundary (Cammeron Wed vs Spencer Thu)
Define it once: Spencer Thu = Newcastle/Mercer Island/Bellevue-south + Renton Highlands north of
NE 4th; Cammeron Wed = Renton proper/valley. No shared streets.

### P6 — Make it stick (systemic enforcement)
The optimizer will re-sprinkle strays unless the push encodes the grid:
1. Update `territory-grid.json` day assignments per P1–P3 (specific ZIP flips listed above).
2. **Push-week change:** anytime visits get `allowedDates` = their zone's grid day(s) — 2-day
   zones get both days — instead of the whole-week float. The optimizer still packs and sequences,
   but can no longer put a Woodinville job on Monday.
3. One transition week (**week of 8/3**): scripted day-moves for affected visits; after one
   completed week the mirror bakes the new pattern in automatically. Move report to Notion so the
   team can handle any customer comms.

## 4. Expected impact

| Change | Miles/week | Drive-hours/week |
|---|---|---|
| P2 Cory Mon de-stray | −70–100 | −2 to −3 |
| P1 Luke south restructure | −80–120 (net of 2nd Olympia stem) | −2 to −3 |
| ~~P4 Peninsula biweekly~~ | ~~−160~~ rejected — stays weekly | — |
| P3/P5 dedup + strays | −30–50 | −1 |
| **Fleet (approved scope)** | **≈ −180–270 mi/wk (−5–7%)** | **≈ −5 h/wk** |

At ~12 mpg truck economy and ~$4.50/gal that's **≈ $3,500–5,300/year in fuel**, plus ~5
drive-hours/week converted into capacity — roughly **15–20 additional stops/week without adding
hours**. Olympia and the far north both move to 2×/week service.

## 5. What this does NOT touch
- Next week (7/27) — Cammeron's 4×10 compression proceeds as already set; transition targets 8/3.
- Tech ownership — nobody changes techs, only which of their own days a zone lands on.
- Sets/promised visits — day-pinned as always.

**Decisions (resolved 2026-07-22):** (a) P1 Luke restructure — **approved, grid updated**;
(b) P4 peninsula biweekly — **rejected, stays weekly**; (c) P3 Issaquah→Cory — **approved** (grid
already had 98027/98029 on Cory Thu; the Cammeron-Issaquah stops were mirror artifacts, fixed by
the 8/3 transition moves); (d) P5 Renton boundary — **approved**; the grid ZIP split already
encodes it (Spencer Thu = 98056/98059 north/highlands, Cammeron Wed = 98055/98058 valley/south).

## 6. Implementation state
- **DONE 2026-07-22:** territory-grid.json v2 — 24 ZIP day-flips (listed in git diff), new
  bookings now route to the new days immediately.
- **TODO before Fri 7/31 baseline (for week 8/3):** push-week.mjs — anytime visits get
  `allowedDates` = zone grid-day(s) instead of full-week float; must except any tech-disabled day.
- **TODO week of 8/3:** scripted one-time day-moves for existing visits to the new pattern
  (delta-guarded, move report to Notion); after one completed week the mirror bakes it in.
- **Watch after transition:** Luke's Wed (Tacoma + Puyallup + Graham belt) may run heavy — if so,
  shift South Hill (98373/98374/98375) between Wed/Thu via 2-day allowedDates rather than re-mapping.
