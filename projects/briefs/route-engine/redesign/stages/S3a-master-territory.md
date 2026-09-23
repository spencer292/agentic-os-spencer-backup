# S3a — The As-Built Master Route and the Territory That Actually Emerged

**Findings only. No prescriptions, no rules proposed.**

Derived 2026-09-18 from Jobber data alone. No rulebook was consulted while deriving:
not `territories.json`, not `territory-grid*.json`, not `scheduling-rules.json`, not the
territory rules in `CLAUDE.local.md`. The old files are read once, at the end, purely to
say where the file and the field disagree.

| Item | Value |
|---|---|
| Window | 2026-08-14 .. 2026-09-18 (5.14 weeks) |
| Completed visits observed | 2,924 |
| Actual throughput | 568.6 visits per week |
| Jobs in scope | 1,063 (all geocoded, all assigned a route-day) |
| Techs | 5 |
| Route-days | 25 (5 techs x 5 weekdays), all populated |

Scripts: `redesign/scripts/derive-master.mjs`, `redesign/scripts/derive-territory.mjs`.
Outputs: `redesign/data/master-asbuilt.json`, `redesign/data/territory-asbuilt.json`,
`redesign/data/territory-asbuilt.geojson`. Logs alongside them.

---

## 1. How much of the master route already exists

A job is **STABLE** when at least 80% of its completed visits fell to the same tech *and*
the same weekday. That set is the master route. It exists, but it is a minority of the book.

| Class | Jobs | Share | Meaning |
|---|---|---|---|
| STABLE | 345 | 32.5% | Tech and weekday both settled. This is the master. |
| DAY-FLIP | 291 | 27.4% | Tech settled, weekday wanders. |
| SINGLE | 224 | 21.1% | Only one completed visit; nothing to confirm yet. |
| BOTH-FLIP | 100 | 9.4% | Neither tech nor weekday settled. |
| NONE | 66 | 6.2% | Future-only. All 66 were assigned by neighbour vote and marked INFERRED. |
| TECH-FLIP | 37 | 3.5% | Weekday settled, tech wanders. |

**428 jobs flip** (day, tech, or both). **224 more are unconfirmed singles.** Together that is
**61% of the book with no settled place**. A further **200 customers sit in an overlap zone**,
where their ten nearest settled neighbours do not agree on a tech; **51 of those are held by a
tech other than the one that surrounds them**.

A handover is not counted as a flip. A single sustained tech change, with at least two visits
on the new tech afterwards, is recorded as a handover with its date. Seventy-four jobs changed
hands that way inside the window, the largest block being **Alias Franks to Tavis Alexander, 28
jobs, 19 of them on 2026-08-21**.

### The finding that dominates everything else

**Cory Ventura's book has no day structure at all.** Ten of his 223 jobs are STABLE — 4%. The
other four techs run 34% to 48%.

| Tech | Jobs | STABLE | Flipping | Single | Inferred |
|---|---|---|---|---|---|
| Alias Franks | 223 | 106 (48%) | 49 | 52 | 16 |
| Robert Norton | 193 | 80 (41%) | 60 | 39 | 14 |
| Tavis Alexander | 236 | 86 (36%) | 82 | 49 | 19 |
| Luke LaVergne | 188 | 63 (34%) | 65 | 45 | 15 |
| **Cory Ventura** | **223** | **10 (4%)** | **172** | **39** | **2** |

Four of Cory's five route-days contain zero or one stable customer: Tuesday 1, Wednesday 3,
Thursday 0, Friday 0. This is not a data artefact. Job #4515 Kelly Kunz in Kent was visited by
Cory six times and landed on Friday, Friday, Thursday, Thursday, Wednesday, Monday. Job #4545
Randy Stegmeier in Maple Valley got four visits on four different weekdays. His customers are
being worked, on time, by the right person, on whatever day there is room.

Cory also carries the second-largest book (223 jobs, 128.6 weekly-equivalent visits) at the
lowest measured hours (31.4). His ground is dense, so he absorbs the overflow — and the price
is that no customer of his can be told which day they are on.

---

## 2. Route-day load

Weekly-equivalent visits are what each job actually consumed per week in the window. Hours use
that route-day's own observed pace from `route-day-drive_2026-08-17_2026-09-17.json` (median
on-site span divided by median stops), so a dense day and a spread day are not compared at one
rate.

| Tech | Day | Customers | Weekly-eq visits | Min/stop | Hours |
|---|---|---:|---:|---:|---:|
| Alias Franks | mon | 47 | 26.1 | 19.2 | 8.4 |
| Alias Franks | tue | 54 | 28.0 | 23.6 | 11.0 |
| Alias Franks | wed | 40 | 24.1 | 28.3 | 11.4 |
| Alias Franks | thu | 38 | 22.9 | 25.3 | 9.7 |
| Alias Franks | fri | 44 | 26.4 | 22.4 | 9.8 |
| Cory Ventura | mon | 62 | 40.2 | 12.8 | 8.6 |
| Cory Ventura | tue | 34 | 14.2 | 15.1 | 3.6 |
| Cory Ventura | wed | 40 | 19.8 | 15.2 | 5.0 |
| Cory Ventura | thu | 33 | 20.6 | 16.0 | 5.5 |
| Cory Ventura | fri | 54 | 33.8 | 15.5 | 8.7 |
| Luke LaVergne | mon | 49 | 23.3 | 22.1 | 8.6 |
| Luke LaVergne | tue | 31 | 17.9 | 28.9 | 8.6 |
| Luke LaVergne | wed | 32 | 18.3 | 32.1 | 9.8 |
| Luke LaVergne | thu | 37 | 19.4 | 27.4 | 8.9 |
| Luke LaVergne | fri | 39 | 22.4 | 20.0 | 7.5 |
| Robert Norton | mon | 20 | 14.6 | 21.5 | 5.2 |
| Robert Norton | tue | 36 | 21.0 | 19.9 | 7.0 |
| Robert Norton | wed | 40 | 23.1 | 20.1 | 7.7 |
| Robert Norton | thu | 44 | 26.6 | 21.1 | 9.4 |
| Robert Norton | fri | 53 | 29.4 | 23.7 | 11.6 |
| Tavis Alexander | mon | 50 | 28.0 | 16.4 | 7.6 |
| Tavis Alexander | tue | 53 | 31.3 | 18.2 | 9.5 |
| Tavis Alexander | wed | 37 | 23.9 | 15.0 | 6.0 |
| Tavis Alexander | thu | 50 | 24.3 | 18.7 | 7.6 |
| Tavis Alexander | fri | 46 | 26.0 | 21.1 | 9.2 |
| **Total** | | **1,063** | **605.6** | | **205.9** |

Weekly totals by tech: Alias 50.3 h, Luke 43.4 h, Robert 40.9 h, Tavis 39.9 h, Cory 31.4 h.
The spread between the heaviest and lightest tech is **18.9 hours a week**, roughly two and a
half working days.

Four route-days sit above 10 hours: Robert Friday 11.6, Alias Wednesday 11.4, Alias Tuesday
11.0, Luke Wednesday 9.8 is just under. Four sit below 6: Cory Tuesday 3.6, Cory Wednesday 5.0,
Robert Monday 5.2, Cory Thursday 5.5.

The 605.6 weekly-equivalent total exceeds the 568.6 actually worked because the 66 future-only
jobs are costed at their product's median observed rate.

---

## 3. The territories that emerged

Geometry is taken from STABLE customers only, so it describes settled ground rather than
wherever an overflow visit happened to land.

| Tech | Jobs | Stable | Hull km2 | The ground, in words |
|---|---|---:|---:|---|
| Alias Franks | 223 | 106 | 779 | The Eastside and north Seattle. Seattle 39, Sammamish 39, Redmond 30, Bellevue 22, Woodinville 21. |
| Tavis Alexander | 236 | 86 | 951 | Seattle both sides of I-90, plus Renton/Newcastle and a Snoqualmie Valley outpost. Seattle 63, Bellevue 31, Renton 29, Burien 16, Issaquah 15. |
| Robert Norton | 193 | 80 | 518 | SR-410 country and the Enumclaw plateau. Buckley 37, Enumclaw 31, Bonney Lake 26, Auburn 23, Federal Way 16. |
| Luke LaVergne | 188 | 63 | 2,739 | Thurston, Tacoma and the peninsula. Olympia 48, Tacoma 32, Gig Harbor 20, Graham 19, Lacey 13. |
| Cory Ventura | 223 | 10 | 454 | Renton, Kent, Maple Valley, Puyallup, Auburn. Compact, and the least settled. |

Luke's hull is five times Robert's for fewer customers. That is the peninsula and Thurston
reach, and it is why his minutes per stop run 20 to 32 against Cory's 13 to 16.

### Weekday structure inside each territory

Some techs run a clean day grid; some do not.

**Luke LaVergne — the cleanest.** Peninsula/Gig Harbor is 29 of 29 on Wednesday. Thurston runs
Monday north / Thursday south, 35 and 24. Only 25 cross-day pairs within 1.5 km on his whole
territory.

**Alias Franks — clean.** Sammamish/Issaquah Highlands is 55 of 56 Friday. North Seattle is 57
of 57 Tuesday. Redmond/Woodinville splits Wednesday 21 / Thursday 22, which is a real two-day
block, not scatter. 30 cross-day pairs.

**Robert Norton — mostly clean, one real seam.** Buckley/Bonney Lake/Lake Tapps/Sumner runs
Friday 53 / Wednesday 38. That is a genuine two-day block, but the two days interleave on the
ground: 33 of his 43 cross-day pairs are Wednesday-against-Friday inside Buckley and Lake Tapps.

**Tavis Alexander — two blocks, badly interleaved.** 151 cross-day pairs. Ninety-four of them
are Monday-against-Tuesday inside Seattle (41), Burien (12) and Normandy Park (9). West
Seattle/Burien splits almost exactly in half, Tuesday 35 / Monday 34, with no line between them.
A further 45 are Wednesday-against-Thursday across Renton and Newcastle.

**Cory Ventura — no structure.** 142 cross-day pairs across all ten day-combinations. The
largest is Friday-against-Monday, 43 pairs, in Maple Valley, Renton and Kent.

---

## 4. The seams

A seam is where two techs' customers sit within 1.5 km of each other. Note: run against STABLE
customers only, the 1.5 km test returns nothing at all — the closest cross-tech stable pair in
the whole fleet is 1.94 km apart, in Seattle. The scan below therefore runs over all 1,063
assigned customers, with a stable-only tier at 3 km reported in the JSON (26 pairs).

| Seam | Pairs < 1.5 km | Customers | Closest | Where it actually runs |
|---|---:|---:|---:|---|
| Cory Ventura / Robert Norton | 93 | 97 | 0.00 km | Buckley around Connells Prairie Road and 78th St E (14); Enumclaw around Cole St (8); Buckley around 241st Ave Ct E (8) |
| Alias Franks / Tavis Alexander | 45 | 45 | 0.15 km | Medina/Clyde Hill around Evergreen Point Road and NE 28th St (14); North Bend around NE 12th St (6); Seattle around 40th Ave W (6) |
| Cory Ventura / Tavis Alexander | 32 | 33 | 0.00 km | Renton/Newcastle around SE 100th St and 148th Ave SE (11); Issaquah/Sammamish around 238th Pl SE (6); Renton around SE 128th St (6) |
| Cory Ventura / Luke LaVergne | 18 | 22 | 0.00 km | North Tacoma around N 33rd and N 39th St (8); Graham/Orting around 150th Ave E (6); Orting-Kapowsin Highway (3) |
| Luke LaVergne / Robert Norton | 7 | 10 | 0.25 km | Puyallup/Edgewood around Valley Ave E (5); Federal Way around SW 349th St (5) |
| Alias Franks / Cory Ventura | 1 | 2 | 0.75 km | Sammamish, SE 36th Ct / SE 30th St |

A closest distance of 0.00 km means two customers at effectively the same address are held by
different techs.

### Overlap zones

Two hundred customers have neighbours who disagree about who owns the ground. Fifty-one are
held by a tech other than the one that surrounds them.

| Zone | Customers | Held against their neighbours | Cities |
|---|---:|---:|---|
| Alias / Tavis | 52 | 10 | Bellevue 14, Seattle 12, Issaquah 9, Sammamish 6, Clyde Hill 4 |
| Cory / Robert | 51 | 13 | Maple Valley 16, Kent 13, Auburn 7, Covington 7, Ravensdale 5 |
| Cory / Tavis | 46 | 4 | Renton 18, Kent 15, Maple Valley 8, Issaquah 5 |
| Luke / Robert | 36 | 19 | Tacoma 15, Graham 11, Puyallup 4, Orting 4 |
| Robert / Tavis | 14 | 4 | Normandy Park 7, SeaTac 2, Kent 2, Des Moines 2 |
| Luke / Tavis | 1 | 1 | Port Orchard 1 |

The single worst pocket: **21 customers held by Cory sit inside ground that Robert's settled
work surrounds** — Auburn 5, Graham 4, Ravensdale 3, Orting 3, Kent 3.

### Zip codes that do not resolve

Of 123 zips, **24 are not tech-clean** and **49 are not day-clean**. The largest splits:

| Zip | City | Jobs | Tech split | Day split |
|---|---|---:|---|---|
| 98022 | Enumclaw | 41 | Robert 31, Cory 10 | tue 41 (clean) |
| 98059 | Renton | 38 | Cory 19, Tavis 19 | wed 16, thu 13, fri 9 |
| 98092 | Auburn | 28 | Cory 14, Robert 14 | mon 15, wed 6, tue 6, thu 1 |
| 98338 | Graham | 25 | Luke 19, Cory 6 | tue 20, thu 3, mon 2 |
| 98075 | Sammamish | 24 | Alias 19, Tavis 5 | fri 24 (clean) |
| 98045 | North Bend | 19 | Tavis 15, Alias 4 | fri 19 (clean) |
| 98004 | Bellevue | 14 | Tavis 7, Alias 7 | mon 9, thu 5 |
| 98027 | Issaquah | 14 | Cory 9, Tavis 5 | thu 13, fri 1 |
| 98023 | Federal Way | 13 | Robert 9, Luke 4 | thu 9, fri 4 |

98059 Renton and 98092 Auburn are exact ties. Neither zip has an owner in the field.

---

## 5. File versus field

`territories.json` v9 (2026-08-12, effective 2026-08-17) applied to the same 1,063 jobs, using
each region's `ownerFrom_2026_08_17`. **The file predicts the right tech for 606 of 1,063
customers — 57%.** Eight regions match at 95% or better; six match below 35%. A further six
customers sit in zips that no region in the file covers at all.

| Region | File says | Jobs | Match | The field actually runs |
|---|---|---:|---:|---|
| Buckley / Bonney Lake / Lake Tapps / Sumner | Cory Ventura | 93 | **6%** | Robert 87, Cory 6. Days fri 53 / wed 38, not the file's wed+fri under Cory. |
| North of SR-516 (Des Moines / Kent North / Maple Valley) | Robert Norton | 88 | **6%** | Cory 77, Tavis 6, Robert 5 |
| North Seattle / Shoreline | Tavis Alexander | 57 | **11%** | Alias 51, Tavis 6. Tuesday is clean, 57 of 57. |
| Federal Way | Luke LaVergne | 20 | **20%** | Robert 16, Luke 4 |
| Issaquah South | Robert Norton | 14 | **0%** | Cory 9, Tavis 5. Thursday 13 of 14. |
| Graham / Orting / Eatonville / Roy | Cory Ventura | 53 | 34% | Luke 34, Cory 18 |
| Snoqualmie Valley / Duvall | Alias Franks | 48 | 40% | Tavis 29, Alias 19 |
| Renton / Newcastle | Tavis Alexander | 83 | 51% | Tavis 42, Cory 41 — an even split |
| Puyallup / Edgewood / Milton | Cory Ventura | 48 | 58% | Cory 28, Robert 16, Luke 4 |
| Peninsula / Gig Harbor / Kitsap | Luke LaVergne | 29 | 100% | Luke 29, Wednesday 29 of 29 |
| West Seattle / Burien / Normandy Park | Tavis Alexander | 69 | 100% | Tavis 69 |
| Thurston North | Luke LaVergne | 59 | 100% | Luke 59 |
| Redmond / Woodinville | Alias Franks | 51 | 100% | Alias 51 |

### Worked example — Tavis on Snoqualmie Valley

The file puts the whole valley on Alias Franks as one unit, on Thursday. `CLAUDE.local.md`
records this as a deliberate Spencer decision from 2026-08-07: North Bend, Snoqualmie, Fall
City and Carnation go to T1 as one block, because the valley sits on I-90 east of the SR-18
junction and the highway line cannot resolve it.

The field runs it differently. Of 39 customers in those four cities, **28 are Tavis Alexander
on Friday**, 7 are Alias on Thursday, 4 are Alias on Friday. North Bend 98045 alone is Tavis 15
/ Alias 4, and Friday 19 of 19 — the weekday is completely clean, only the tech is contested.

The existing memory note "Tavis on Snoqualmie is intentional" is confirmed by the data. Its
warning is also confirmed: `assign-by-territory` reading v9 would hand all 39 back to Alias on
Thursday, moving 28 customers and changing their service day.

### Worked example — Robert on Buckley / Bonney Lake / Sumner

The file gives this block to **Cory Ventura**, on Wednesday and Friday, as part of the v9
five-way cut. Cory lives in Buckley 98321, which is the stated reason: it puts him on his own
doorstep, the lowest commute on the board at 42 miles a week.

The field never did it. Across Buckley, Bonney Lake, Lake Tapps and Sumner, **87 of 93
customers are Robert Norton**; Cory holds 6. The days are Friday 53 / Wednesday 38, so the v9
rhythm survived the cut but the owner did not. This block is the single largest disagreement
between the file and the field, and it is also the largest seam on the board: 93 customer pairs
within 1.5 km split between Cory and Robert, 14 of them clustered around Connells Prairie Road
in Buckley, some at effectively the same address.

Cory's compensating load is the Kent/Maple Valley block the file assigned to Robert, where 77
of 88 customers are Cory. In effect the two men swapped the two blocks the cut gave them and
nobody wrote it down.

---

## 6. What this leaves for the owner

Stated as open questions, not recommendations.

1. **Cory Ventura's route-days have no day structure.** 4% stable against a fleet average of
   40%. Either his book becomes a day grid like everyone else's, or it is formally the overflow
   lane and his customers are never given a day.
2. **The Buckley block and the Kent block are swapped** against the file, for 165 customers
   between them. One of the two records is wrong.
3. **Two zips are exact ties**, 98059 Renton (Cory 19 / Tavis 19) and 98092 Auburn (Cory 14 /
   Robert 14). No owner exists in the field to derive.
4. **Load spread is 18.9 hours a week**, Alias 50.3 against Cory 31.4.
5. **51 customers are held by a tech their neighbours contradict**, the worst pocket being 21
   Cory customers inside Robert's settled ground.

---

## Appendix A — jobs needing a decision, by route-day

Counts of jobs that are neither STABLE nor future-only, i.e. every job whose tech or weekday
the field has not settled. Full per-job detail, including each job's own tech and weekday
tally, is in `redesign/data/master-asbuilt.json` under `jobs[]`.

| Route-day | Undecided jobs |
|---|---:|
| Cory Ventura / mon | 54 |
| Cory Ventura / fri | 54 |
| Tavis Alexander / mon | 44 |
| Alias Franks / mon | 39 |
| Cory Ventura / wed | 37 |
| Luke LaVergne / mon | 35 |
| Cory Ventura / tue | 33 |
| Cory Ventura / thu | 33 |
| Tavis Alexander / thu | 32 |
| Tavis Alexander / tue | 32 |
| Robert Norton / fri | 29 |
| Luke LaVergne / fri | 28 |
| Luke LaVergne / thu | 24 |
| Robert Norton / wed | 19 |
| Robert Norton / mon | 19 |
| Luke LaVergne / tue | 18 |
| Alias Franks / tue | 17 |
| Alias Franks / thu | 17 |
| Robert Norton / thu | 16 |
| Robert Norton / tue | 16 |
| Alias Franks / wed | 16 |
| Alias Franks / fri | 12 |
| Tavis Alexander / wed | 12 |
| Tavis Alexander / fri | 11 |
| Luke LaVergne / wed | 5 |

Every Monday except Robert's is in the top six. Monday is where the board absorbs whatever the
previous week did not finish.

## Appendix B — method notes and cautions

- **Weekday** is the Pacific (UTC-7) date of the visit's `startAt`. The whole window is PDT.
- **Tech** is `techs[0]` on completed visits. Every completed visit in the window carries
  exactly one tech; the standalone `completed-visits_2026-08-17_2026-09-17.json` file agrees
  with `visits.json` on all 2,793 shared rows, with zero disagreements.
- **Weekly-equivalent visits** are observed throughput (completed visits divided by window
  weeks), not a cadence rule. Future-only jobs fall back to their product's median observed
  rate. The spacing-derived alternative is kept per job as `weeklyEqSpacing` and runs about 15%
  higher, because a job's scheduled forward visits are denser than what actually gets worked.
- **Hours** use each route-day's own observed median span per stop. They are not comparable to
  a flat service time, and they blend drive with on-site time, so dense ground flatters a tech
  and spread ground penalises one. Luke and Alias are penalised by this; Cory is flattered.
- **Inference** for the 66 future-only jobs is an inverse-distance-weighted vote of the 10
  nearest STABLE jobs. Each carries `inferredFrom.confidence` and its runner-up route-day.
- **The 1.5 km seam radius cannot be run on STABLE customers alone.** The settled set is too
  sparse: its closest cross-tech pair is 1.94 km. Seams are therefore computed over all
  assigned customers, which includes flipping ones whose tech is less certain.
- **Convex hulls overstate territory.** They are a reach measure, not a boundary. Luke's 2,739
  km2 hull spans water it contains no customers on.
- **Archived jobs are included.** 177 of the 1,063 are archived; per-route-day active counts
  are in `master-asbuilt.json` as `activeJobs`.
