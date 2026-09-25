---
project: route-engine
status: active
level: 2
created: 2026-09-17
audience: Ferry (external — route engine work)
---

# Got Moles — Routes and Territories, Last 30 Days

**Window:** 2026-08-18 → 2026-09-17 (22 working days, Mon–Fri)
**Source:** every Jobber visit in the window, pulled live 2026-09-17 — 2,679 visits, 5 technicians
**Compared against:** `territories.json` v9, the "five-way highway cut", effective 2026-08-17

---

## 1. The one thing to read first

**The territory file and the board that actually ran are two different maps — and the board is the better one.**

Over 22 working days:

| Measure | Result |
|---|---|
| Visits landing on the technician the file says owns that ground | **60%** (1,600 of 2,663) |
| Visits landing on the weekday the file says that block runs | **52%** (1,391 of 2,663) |
| Visits correct on **both** owner and day | **32%** |

A 60% hit rate normally means a board in disarray. This one isn't. Dig into the misses and they are not scatter — they are whole blocks of work sitting cleanly and consistently on a *different* technician than the file names, week after week, at 90–100% consistency. Buckley/Bonney Lake/Sumner is 222 visits, the file says Cory Ventura, and Robert Norton did 206 of them — on exactly the Wednesday and Friday the file specifies. That is not drift. That is a map the file hasn't been told about.

**So the fix order matters.** If the engine is pointed at `territories.json` and told to enforce it, it will tear up a working board. The file has to be corrected to match the field first; only then is the residual disagreement real and worth chasing.

The residual is genuinely there, and section 4 isolates it: about **13% of visits** sit in zip codes worked by two or more technicians, and **29%** sit on a weekday other than that zip's dominant one.

---

## 2. What actually ran — the as-built map

This is measured, not designed. For each technician, the ground they actually covered on each weekday, ordered by volume.

### Alias Franks — the Eastside and north Seattle
*22 route-days, 25.0 stops/day average*

| Day | Stops/day | Ground |
|---|---|---|
| **Mon** | 26.7 | Bellevue 98005/98004/98008/98007, Medina 98039, Kirkland 98033/98034, Redmond 98052 |
| **Tue** | 25.4 | **North Seattle + Shoreline** — 98177, 98115, 98125, 98133, 98117, 98105, 98155, 98199, 98112, 98102 |
| **Wed** | 25.0 | Woodinville 98077/98072, Redmond 98052/98053, Snohomish 98296, Kirkland 98034, Bothell 98011/98021 |
| **Thu** | 22.8 | Redmond 98053 (56 of 114 stops), Carnation 98014, Duvall 98019, Woodinville 98077 |
| **Fri** | 26.3 | **Sammamish only** — 98075 and 98074. Two zips, 105 stops, four Fridays. The cleanest day any technician runs. |

### Tavis Alexander — Seattle west/south, Renton, Bellevue south, Snoqualmie
*22 route-days, 28.1 stops/day — the heaviest stop count on the board*

| Day | Stops/day | Ground |
|---|---|---|
| **Mon** | 28.3 | West Seattle 98146/98136/98116, Burien, Normandy Park 98166, Des Moines 98198 |
| **Tue** | 29.4 | West Seattle again 98116/98136, Georgetown/South Park 98108, 98146, Rainier 98178, Tukwila 98168 |
| **Wed** | 30.6 | **Renton 98056 + 98059, Newcastle** — 130 of 153 stops in two zips |
| **Thu** | 26.6 | Bellevue south 98006, Bellevue 98004, Mercer Island 98040, Issaquah 98027, Medina 98039 |
| **Fri** | 25.3 | **Snoqualmie Valley** — North Bend 98045, Fall City 98024, Issaquah 98029, Snoqualmie 98065 |

### Robert Norton — SR-410 country and the Federal Way / Auburn corridor
*22 route-days, 24.0 stops/day*

| Day | Stops/day | Ground |
|---|---|---|
| **Mon** | 22.0 | Auburn 98092, Black Diamond 98010, Kent 98042, Graham 98338, Puyallup 98375 |
| **Tue** | 24.8 | **Enumclaw 98022** (85 of 124 stops) + Auburn 98092. Seven zips all day. |
| **Wed** | 24.8 | **Bonney Lake 98391, Buckley 98321, Lake Tapps, Sumner 98390** — 115 of 124 stops in three zips |
| **Thu** | 24.6 | **Federal Way 98023/98003**, Auburn 98001, NE Tacoma 98422, Edgewood 98372, Pacific 98047 |
| **Fri** | 22.5 | **Buckley 98321 + Bonney Lake 98391** — 81 of 90 stops |

### Cory Ventura — Kent / Covington / Maple Valley / Renton south / Puyallup
*21 route-days (no route 2026-09-04), 26.1 stops/day*

| Day | Stops/day | Ground |
|---|---|---|
| **Mon** | 30.0 | Renton 98058, Kent 98042, Maple Valley 98038, Covington, Auburn 98092 |
| **Tue** | 23.2 | Enumclaw 98022, Orting 98360, Auburn 98092, Graham 98338, Buckley 98321, Kent. **24 zips — the most scattered day on the board.** |
| **Wed** | 27.0 | Maple Valley 98038, Auburn 98092, Kent 98031, Puyallup 98374/98375/98371/98372/98373. **26 zips.** |
| **Thu** | 26.4 | Renton 98059/98058, Issaquah 98027, Maple Valley 98038, Kent 98042 |
| **Fri** | 25.3 | Maple Valley, Renton, Issaquah, Ravensdale — **plus 12 Tacoma/Pierce zips at 1 stop each. 28 zips, 76 stops.** |

### Luke LaVergne — Thurston, Pierce west, the peninsula
*21 route-days (no route 2026-08-28), 20.6 stops/day — the lightest stop count*

| Day | Stops/day | Ground |
|---|---|---|
| **Mon** | 22.0 | Olympia 98502/98501/98513/98506, Lacey 98516, Lakewood/Tacoma 98498/98499. **20 zips.** |
| **Tue** | 19.4 | **Graham 98338, Eatonville 98328, Spanaway 98387** (67 of 97), plus a Thurston tail |
| **Wed** | 17.0 | **Gig Harbor 98332/98335/98329 + peninsula** — Bremerton, Port Orchard, Vaughn, Longbranch, Fox Island. 100% of this block, every week. |
| **Thu** | 21.8 | Olympia 98513/98501/98512, Yelm 98597, Lacey, Tumwater, Roy 98580 |
| **Fri** | 25.3 | **Tacoma** 98445/98407/98406/98403/98404/98443/98444 + Puyallup 98371/98375/98374 |

---

## 3. Where the file is simply out of date — fix the file, not the board

Ten block transfers were written into `territories.json` as handovers effective 2026-08-17. **Four of them happened. Six did not.** Every block that was supposed to move *from Cory to Tavis* moved. Nothing else did.

| Block | File says | Actually ran | Verdict |
|---|---|---|---|
| West Seattle / Burien / Normandy Park | Tavis | **Tavis 179 of 179** | ✅ landed |
| Bellevue South / Mercer Island | Tavis | **Tavis 81 of 94** | ✅ landed |
| Tukwila / Skyway / Rainier Valley | Tavis | **Tavis 36 of 39** | ✅ landed |
| Renton / Newcastle | Tavis | Tavis 144, Cory 112 | ⚠️ half landed — see 4.1 |
| **North Seattle / Shoreline** | Tavis, Monday | **Alias 123 of 137, Tuesday** | ❌ never moved |
| **North of SR-516** (Kent N / Maple Valley) | Robert | **Cory 110 of 121** | ❌ never moved |
| **Issaquah South (98027)** | Robert | **Cory 27, Tavis 22, Robert 0** | ❌ never moved |
| **Buckley / Bonney Lake / Lake Tapps / Sumner** | Cory | **Robert 206 of 222** | ❌ never moved |
| **Puyallup / Edgewood / Milton** | Cory | Cory 55, Robert 44, Luke 20 | ❌ never moved |
| **Graham / Orting / Eatonville / Roy** | Cory | **Luke 89**, Cory 41, Robert 11 | ❌ never moved |

Two further disagreements were never handovers at all — the field invented them:

- **Federal Way (98003, 98023)** — the file has it on loan to Luke, Tuesday and Friday. Robert has run **100% of it, every Thursday, 50 visits**, without exception. Clean, stable, undocumented.
- **Snoqualmie Valley / Duvall** — the file gives it to Alias on Tue+Thu. **Tavis runs 69 of 99, on Friday.** This one is live: ten Snoqualmie jobs were pinned to Tavis as job-level overrides on 2026-09-17. Treat the file as mid-correction here, not stale.

**Net effect on the roster:** Cory and Robert have effectively swapped halves of their v9 territories. The file has Cory in SR-410 country (Buckley, Puyallup, Graham) and Robert in the SR-18 corridor. On the ground it is the reverse — Robert owns SR-410 and Federal Way, Cory owns Kent/Covington/Maple Valley/Renton-south. Both arrangements are coherent; only one is written down.

**Worth knowing before choosing which way to reconcile:** Cory lives in Buckley (98321) and Robert lives in Maple Valley (98038). The *file's* v9 map put each of them on their own doorstep — that was one of its stated design wins. The *as-built* map puts each of them at the far end of the other's ground. Whatever else the reconciliation decides, this is a real, recurring commute cost that the as-built map is paying and the file's map was designed to avoid.

---

## 4. The genuine defects — these are field problems, not file problems

### 4.1 Zips worked by more than one technician

51 of 121 zips were touched by two or more technicians. **352 visits (13.1%) sat on someone other than that zip's dominant technician.** Ranked by contested volume:

| Zip | Area | Total | Split |
|---|---|---|---|
| 98059 | Renton | 117 | Tavis 73 / **Cory 44** |
| 98092 | Auburn | 81 | Robert 46 / **Cory 35** |
| 98027 | Issaquah | 49 | Cory 27 / **Tavis 22** |
| 98022 | Enumclaw | 105 | Robert 86 / **Cory 19** |
| 98004 | Bellevue | 38 | Tavis 22 / **Alias 16** |
| 98338 | Graham | 64 | Luke 42 / Cory 14 / Robert 8 |
| 98042 | Kent/Covington | 78 | Cory 66 / Robert 10 / Tavis 2 |
| 98321 | Buckley | 90 | Robert 78 / Cory 12 |
| 98075 | Sammamish | 66 | Alias 55 / Tavis 9 / Cory 2 |
| 98371 / 98374 / 98375 | Puyallup | 73 | Cory 38 / Robert 19 / Luke 12 |
| 98372 | Puyallup / Edgewood | 34 | Robert 23 / Cory 9 / Luke 2 |
| 98005 | Bellevue | 31 | Alias 23 / Tavis 8 |
| 98010 | Black Diamond | 24 | Robert 17 / Cory 7 |
| 98039 | Medina | 18 | Alias 11 / Tavis 7 |
| 98051 | Ravensdale | 17 | Robert 10 / Cory 7 |
| 98006 | Bellevue | 49 | Tavis 44 / Cory 5 |
| 98360 | Orting | 32 | Cory 27 / Robert 3 / Luke 2 |
| 98407 | Tacoma | 15 | Luke 10 / Cory 5 |

Three of these are not really contested — they are **boundaries that exist in the field but not in the file**, and should be written down as splits rather than resolved as errors:

1. **Renton.** The file treats "Renton / Newcastle" as one block. The field split it cleanly by zip: **Tavis owns 98056 (99%) and 98059-north/Newcastle, on Wednesday. Cory owns 98055 and 98058 (both 100%), on Monday.** Two technicians, one label. Split the block, don't reassign it.
2. **Bellevue 98004.** The NE 8th St geo-split line is already modelled — Clyde Hill/Yarrow Point north to Alias, downtown south to Tavis — and the 22/16 split is roughly what that line predicts. Working as designed.
3. **Puyallup (98371/98372/98373/98374/98375).** Genuinely three-way between Cory, Robert and Luke with no pattern. This one is a real hole in the map.

The rest — Auburn 98092, Enumclaw 98022, Issaquah 98027, Graham 98338, Black Diamond 98010, Ravensdale 98051 — are Cory reaching across into Robert's and Luke's ground, or the reverse. **Cory is a party to 14 of the 18 contested zips.** That is the single clearest signal on this board.

### 4.2 Zips that move around the week

75 of 121 zips were worked on two or more weekdays. **765 visits (28.6%) landed on a day other than that zip's dominant day.** This is the bigger number of the two, and it is the one customers feel — it is what makes "what day are you in my area?" unanswerable on the phone.

Worst offenders by volume:

| Zip | Area | Total | Dominant day | Also ran |
|---|---|---|---|---|
| 98038 | Maple Valley | 67 | wed **31%** | thu 19, fri 14, mon 11, tue 2 |
| 98092 | Auburn | 81 | tue **43%** | mon 25, wed 18, thu 3 |
| 98042 | Kent / Covington | 78 | mon **42%** | tue 14, wed 14, thu 12, fri 5 |
| 98321 | Buckley | 90 | fri **51%** | wed 32, tue 7, thu 5 |
| 98059 | Renton | 117 | wed **56%** | thu 42, fri 10 |
| 98375 | Puyallup | 28 | wed **36%** | mon 7, fri 6, tue 5 |
| 98371 | Puyallup | 18 | fri **39%** | wed 6, thu 5 |
| 98051 | Ravensdale | 17 | fri **35%** | mon 5, tue 5, thu 1 |
| 98030 | Kent | 14 | tue **36%** | mon 5, thu 3, wed 1 |
| 98052 | Redmond | 35 | wed **49%** | mon 12, thu 6 |
| 98058 | Renton | 52 | mon **52%** | thu 12, wed 7, fri 6 |
| 98010 | Black Diamond | 24 | mon **50%** | tue 11, wed 1 |
| 98168 | SeaTac / Tukwila | 22 | tue **50%** | mon 6, wed 3, fri 1, thu 1 |

Buckley (wed/fri) and Renton 98059 (wed/thu) are deliberate two-day blocks and are fine. Maple Valley at 31% across five days, and Kent 98042 at 42% across five days, are not.

### 4.3 Zips not on the map at all

16 visits landed in zips no territory block claims. Small, but they route by accident:

| Zip | Written as | Visits | Who took it |
|---|---|---|---|
| 98119 | Seattle (Queen Anne / Magnolia) | 7 | Tavis 3, Alias 4 — on the same Tuesday, split between two techs |
| 98444 | Tacoma (Parkland) | 4 | Luke 3, Cory 1 |
| 98363 | written "Puyallup" — 98363 is **Port Angeles** | 3 | Cory |
| 98012 | Bothell / Mill Creek | 1 | Alias |
| 98272 | Monroe | 1 | Alias |

98119 is the one to fix — seven real visits, no owner, and it is already being split between two technicians on the same day.

### 4.4 Address data quality

Not cosmetic — anything that groups by city string will mis-group:

- **98391 is written six ways**: Bonney Lake 69, Lake Tapps 27, Sumner 4, "BonneyLake" 4, "Pierce County" 3, Tehaleh 2
- **98168 four ways**: SeaTac 8, Tukwila 7, Burien 4, Seattle 3
- **98198 three ways**: Des Moines 7, Normandy Park 3, SeaTac 1
- **Case variants**: "Maple Valley" / "Maple valley", "North Bend" / "North bend", "Graham" / "graham"
- **"Pierce County" used as a city** 4 times; **"Unit A Seattle"** 3 times
- **98363 labelled Puyallup** — a wrong zip on a live record, 3 visits

**168 of 2,679 addresses (6%) are missing from the coordinate cache** the current splitter reads, so where a highway split line cuts through a zip they fall back to the zip's default side rather than being resolved by coordinate. That matters most on the NE 8th St line, where the side decides the *owner*, not just the day.

**This is a cache limitation, not a data gap.** Verified 2026-09-18: Jobber exposes `PropertyAddress.coordinates` plus `geoStatus` on 100% of jobs and visits (1,063 of 1,063 jobs, 4,290 of 4,290 visits; `geoStatus = FOUND` on all but one). The existing splitter was built around a cache derived from OptimoRoute, on the since-disproved assumption that Jobber returns no lat/lng. Every address-level territory line can be resolved straight from Jobber, and the zip-fallback path can be retired — treat `geoStatus != FOUND` as the only genuinely ungeocoded case.

---

## 5. Load

Routed day = first visit start → last visit start, plus on-site time. **Commute to the first job and home from the last is excluded** — add roughly an hour a day for that. Jobber visit records carry a 3-hour arrival window, not a service duration, so window end times are not day end times.

| Tech | Route-days | Stops/day | Avg day | Median | Longest | Days >9h | Avg first stop | Avg last stop |
|---|---|---|---|---|---|---|---|---|
| Tavis Alexander | 22 | **28.1** | **8.9h** | 8.9h | 11.2h | **10** | 07:35 | 16:16 |
| Alias Franks | 22 | 25.0 | **8.8h** | 8.8h | 10.9h | **8** | 07:13 | 15:47 |
| Luke LaVergne | 21 | **20.6** | 8.5h | 8.5h | 10.6h | 4 | 07:29 | 15:47 |
| Robert Norton | 22 | 24.0 | 8.0h | 8.0h | 9.4h | 2 | 07:21 | 15:06 |
| Cory Ventura | 21 | 26.1 | **7.3h** | 7.2h | 8.8h | **0** | 07:23 | 14:27 |

**24 of 108 tech-days ran over 9 hours.** 18 of those 24 belong to Tavis and Alias.

Average routed hours by weekday:

| Tech | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| Alias | 8.8 | **9.3** | 8.9 | 8.3 | 8.8 |
| Tavis | **9.1** | **9.7** | 8.7 | 8.6 | 8.7 |
| Luke | 8.9 | **9.0** | 8.4 | 8.4 | 7.8 |
| Robert | 7.5 | 8.2 | 7.8 | 8.1 | 8.2 |
| Cory | 8.4 | 6.9 | 7.2 | 7.0 | 7.3 |

Two things stand out.

**Stops are not hours.** Luke runs the fewest stops on the board (20.6/day) and the third-longest day (8.5h); Cory runs 26.1 stops in 7.3h. Luke's ground is Thurston and the peninsula — long legs between doors. Cory's is Kent/Covington — dense. Any rebalancing done on stop count will move work the wrong way. Compare hours.

**Tuesday is the spike.** Three of five technicians hit their longest average day on Tuesday, and Tuesday is also where the scatter lives: Cory's Tuesday touches 24 zips, Luke's Tuesday mixes Graham/Eatonville with a Thurston tail. Tuesday is where a reconciliation would pay back fastest.

Two full route-days were empty in the window: **Cory on 2026-09-04** and **Luke on 2026-08-28**. Not investigated here — flagging in case they were absences rather than a routing failure.

---

## 6. What we would ask Ferry to weigh in on

**Read these against Spencer's stated objective, set 2026-09-19:** super dense routes, even hours worked per day, technician-owned territories with no criss-crossing, as little overtime as possible. When one technician is overloaded, the fix is to shift *edge* jobs to the closest technician and move the territory line with them — contiguous blocks only, never interior houses. Territory lines are allowed to move; technicians are not allowed to cross them. Levelling inside a single technician's week is explicitly not an answer. That settles question 4 below in both directions — day discipline and ownership discipline are both required — and it makes question 1 a question about *where the lines go*, not whether they may move.

1. **Which map wins?** The file's v9 (each of Cory and Robert on their own doorstep, never executed) or the as-built (working, stable, but paying a commute penalty for both of them). Our read: adopt as-built as the baseline *because it demonstrably runs*, then treat the Cory/Robert commute cost as a separate, explicit decision rather than a reason to re-tear the board.
2. **Renton needs splitting, not assigning.** 98056/98059 (Tavis, Wed) and 98055/98058 (Cory, Mon) are two blocks wearing one name. Same question for Puyallup, which is a genuine three-way hole.
3. **Cory's reach.** He is a party to 14 of 18 contested zips, runs the two most scattered days on the board (24 and 26 zips), and has the lightest hours (7.3h average, zero days over 9h). Is he absorbing overflow by design, or is his territory simply not drawn?
4. **Day discipline vs. technician discipline.** The day number (29% off-day) is worse than the ownership number (13% off-tech), and it is the one customers experience. Worth knowing which one the engine should optimise first.
5. **Enforcement.** Nothing currently locks a visit to its territory owner — assignment is advisory. Whether the reconciled map should be *enforced* at write time, or stay a report, is a policy call, not a technical one.

---

## Appendix A — Method

- Every Jobber visit with a start time in 2026-08-18 → 2026-09-17, pulled live on 2026-09-17 via the Jobber GraphQL API (`fetch-window-visits.mjs`). 2,679 visits, 22 working days.
- Dates and weekdays converted to Pacific. **No weekend visits, no unassigned visits, no multi-technician visits in the window** — the board is clean on all three.
- Each visit resolved to a territory block by zip, using `territories.json` v9, with the three highway geo-split lines (`bellevue-ne8th`, `sr-516`, `thurston-i5-101`) resolved per address from cached coordinates where available.
- Expected owner = block owner with the 2026-08-17 handovers applied by visit date, with job-level overrides taking precedence. Expected weekday = `rhythmChanges.byRegion[].newRhythm`, the post-08-17 rhythm.
- All counts are measured — **KNOWN**. Routed hours are **ESTIMATE**: first-start to last-start plus a 15-minute on-site assumption (12 minutes for Cory), commute excluded.

## Appendix B — Every route-day in the window

Stop counts per technician per day:

```
date        dow     Alias   Tavis  Robert    Cory    Luke   total
2026-08-18  tue        28      30      20      18      17     113
2026-08-19  wed        27      32      23      28      19     129
2026-08-20  thu        23      24      26      19      22     114
2026-08-21  fri        26      25      19      31      24     125
2026-08-24  mon        27      27      23      31      23     131
2026-08-25  tue        21      32      29      23      17     122
2026-08-26  wed        25      33      26      20      14     118
2026-08-27  thu        25      28      25      34      22     134
2026-08-28  fri        29      30      22      21       0     102
2026-08-31  mon        25      29      21      27      20     122
2026-09-01  tue        28      32      25      22      25     132
2026-09-02  wed        22      25      22      29      17     115
2026-09-03  thu        21      27      26      24      20     118
2026-09-04  fri        25      25      27       0      23     100
2026-09-08  tue        22      26      27      25      22     122
2026-09-09  wed        24      30      23      27      16     120
2026-09-10  thu        23      26      22      24      19     114
2026-09-11  fri        25      21      22      24      29     121
2026-09-14  mon        28      29      22      32      23     134
2026-09-15  tue        28      27      23      28      16     122
2026-09-16  wed        27      33      30      31      19     140
2026-09-17  thu        22      28      24      31      26     131
```

The only weekday missing from the window is **Monday 2026-09-07 — Labor Day**. That is why Mondays appear three times and the other weekdays four or five. 22 working days in total.

Day-by-day detail follows.

#### 2026-08-18 — Tuesday — 113 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 28 | Seattle 18, Shoreline 8, Lake Forest Park 2 | 98102, 98105, 98112, 98115, 98117, 98122, 98125, 98133, 98155, 98177, 98199 |
| Tavis Alexander | 30 | Seattle 24, Burien 6 | 98108, 98116, 98126, 98136, 98146, 98166 |
| Robert Norton | 20 | Enumclaw 19, Auburn 1 | 98022, 98092 |
| Cory Ventura | 18 | Kent 13, Auburn 4, Des Moines 1 | 98002, 98030, 98031, 98032, 98042, 98092, 98198 |
| Luke LaVergne | 17 | Graham 8, Eatonville 5, Spanaway 4 | 98328, 98338, 98387 |

#### 2026-08-19 — Wednesday — 129 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 27 | Woodinville 13, Redmond 7, Snohomish 4, Bothell 2, Seattle 1 | 98011, 98021, 98052, 98053, 98072, 98077, 98125, 98296 |
| Tavis Alexander | 32 | Renton 19, Newcastle 7, Issaquah 6 | 98027, 98056, 98059 |
| Robert Norton | 23 | Bonney Lake 10, Sumner 9, Lake Tapps 3, Tehaleh 1 | 98390, 98391 |
| Cory Ventura | 28 | Puyallup 21, Tacoma 5, Orting 2 | 98360, 98363, 98371, 98372, 98373, 98374, 98375, 98443, 98446 |
| Luke LaVergne | 19 | Gig Harbor 11, Bremerton 2, Fircrest 2, Port Orchard 1, Vaughn 1, Longbranch 1, Tacoma 1 | 98310, 98329, 98332, 98335, 98351, 98366, 98394, 98465, 98466 |

#### 2026-08-20 — Thursday — 114 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 23 | Redmond 11, Carnation 3, Duvall 3, Woodinville 2, Sammamish 2, Fall City 2 | 98014, 98019, 98024, 98052, 98053, 98074, 98077 |
| Tavis Alexander | 24 | Bellevue 16, Issaquah 4, Mercer Island 2, Newcastle 1, Renton 1 | 98004, 98006, 98008, 98027, 98040, 98056 |
| Robert Norton | 26 | Federal Way 12, Edgewood 5, Auburn 4, Pacific 2, Tacoma 2, Sumner 1 | 98001, 98003, 98023, 98047, 98092, 98371, 98372, 98390, 98422 |
| Cory Ventura | 19 | Orting 5, Graham 5, Buckley 5, Auburn 1, Lake Tapps 1, Bonney Lake 1, Pierce County 1 | 98092, 98321, 98338, 98360, 98391 |
| Luke LaVergne | 22 | Olympia 12, Yelm 3, Lacey 3, Roy 2, Tumwater 2 | 98501, 98503, 98512, 98513, 98580, 98597 |

#### 2026-08-21 — Friday — 125 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 26 | Sammamish 26 | 98074, 98075 |
| Tavis Alexander | 25 | North Bend 14, Fall City 6, Snoqualmie 3, Issaquah 2 | 98024, 98027, 98029, 98045, 98065 |
| Robert Norton | 19 | Buckley 13, Bonney Lake 4, Enumclaw 1, Maple Valley 1 | 98022, 98038, 98321, 98391 |
| Cory Ventura | 31 | Renton 18, Kent 4, Issaquah 3, Sammamish 3, Covington 1, Tukwila 1, Newcastle 1 | 98027, 98029, 98042, 98055, 98056, 98058, 98059, 98075, 98168 |
| Luke LaVergne | 24 | Tacoma 19, Puyallup 3, Spanaway 1, Graham 1 | 98338, 98371, 98372, 98375, 98387, 98403, 98404, 98406, 98407, 98443, 98444, 98445, 98498 |

#### 2026-08-24 — Monday — 131 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 27 | Bellevue 16, Redmond 5, Medina 3, Clyde Hill 2, Kirkland 1 | 98004, 98005, 98007, 98008, 98033, 98039, 98052 |
| Tavis Alexander | 27 | Seattle 16, Burien 7, Des Moines 2, Normandy Park 2 | 98116, 98136, 98146, 98148, 98166, 98168, 98198 |
| Robert Norton | 23 | Auburn 8, Black Diamond 7, Ravensdale 5, Kent 3 | 98010, 98042, 98051, 98092 |
| Cory Ventura | 31 | Kent 11, Maple Valley 7, Covington 6, Auburn 4, Renton 3 | 98002, 98030, 98032, 98038, 98042, 98058, 98092 |
| Luke LaVergne | 23 | Olympia 10, Tacoma 4, University Place 2, Lakewood 2, Lacey 2, Tumwater 2, Steilacoom 1 | 98388, 98466, 98467, 98498, 98499, 98501, 98502, 98503, 98506, 98512, 98513, 98516 |

#### 2026-08-25 — Tuesday — 122 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 21 | Seattle 11, Shoreline 7, Lake Forest Park 2, Kenmore 1 | 98028, 98105, 98115, 98117, 98125, 98133, 98155, 98177 |
| Tavis Alexander | 32 | Seattle 26, Tukwila 2, SeaTac 2, Burien 1, Renton 1 | 98057, 98102, 98108, 98109, 98112, 98116, 98119, 98122, 98126, 98136, 98144, 98168, 98178, 98188, 98199 |
| Robert Norton | 29 | Enumclaw 24, Auburn 4, Kent 1 | 98002, 98022, 98042, 98092 |
| Cory Ventura | 23 | Graham 9, Orting 8, Puyallup 3, Buckley 2, Pierce County 1 | 98321, 98338, 98360, 98372, 98374 |
| Luke LaVergne | 17 | Graham 7, Eatonville 6, Spanaway 4 | 98328, 98338, 98387 |

#### 2026-08-26 — Wednesday — 118 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 25 | Woodinville 10, Kirkland 5, Bothell 4, Snohomish 3, Redmond 2, Bellevue 1 | 98008, 98011, 98021, 98033, 98034, 98052, 98072, 98077, 98296 |
| Tavis Alexander | 33 | Renton 27, Newcastle 6 | 98056, 98059 |
| Robert Norton | 26 | Buckley 11, Bonney Lake 9, Lake Tapps 5, Pierce County 1 | 98321, 98391 |
| Cory Ventura | 20 | Puyallup 19, Tacoma 1 | 98363, 98371, 98372, 98373, 98374, 98375, 98446 |
| Luke LaVergne | 14 | Gig Harbor 10, Port Orchard 1, Bremerton 1, Vaughn 1, Fox Island 1 | 98310, 98329, 98332, 98333, 98335, 98366, 98394 |

#### 2026-08-27 — Thursday — 134 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 25 | Redmond 14, Duvall 4, Carnation 4, Woodinville 3 | 98014, 98019, 98053, 98072, 98077 |
| Tavis Alexander | 28 | Bellevue 17, Mercer Island 5, Issaquah 4, Medina 1, Newcastle 1 | 98004, 98006, 98008, 98027, 98039, 98040, 98059 |
| Robert Norton | 25 | Auburn 7, Federal Way 7, Tacoma 4, Edgewood 3, Pacific 1, Milton 1, Puyallup 1, Sumner 1 | 98001, 98003, 98023, 98047, 98092, 98354, 98371, 98372, 98390, 98422 |
| Cory Ventura | 34 | Maple Valley 11, Renton 11, Issaquah 6, Kent 4, Seattle 1, Ravensdale 1 | 98027, 98031, 98038, 98042, 98051, 98055, 98058, 98059, 98168 |
| Luke LaVergne | 22 | Olympia 12, Yelm 3, Tumwater 3, Lacey 3, Roy 1 | 98501, 98502, 98503, 98512, 98513, 98516, 98580, 98597 |

#### 2026-08-28 — Friday — 102 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 29 | Sammamish 28, Issaquah 1 | 98074, 98075 |
| Tavis Alexander | 30 | North Bend 12, Fall City 6, Issaquah 5, Sammamish 4, Snoqualmie 3 | 98024, 98027, 98029, 98045, 98065, 98075 |
| Robert Norton | 22 | Bonney Lake 11, Buckley 10, Sumner 1 | 98321, 98391 |
| Cory Ventura | 21 | Tacoma 17, Fircrest 2, Puyallup 1, Spanaway 1 | 98371, 98387, 98403, 98404, 98405, 98406, 98407, 98443, 98444, 98445, 98446, 98466, 98499 |
| Luke LaVergne | 0 | *no route* | — |

#### 2026-08-31 — Monday — 122 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 25 | Bellevue 14, Redmond 5, Medina 4, Clyde Hill 2 | 98004, 98005, 98007, 98008, 98039, 98052 |
| Tavis Alexander | 29 | Seattle 12, Burien 6, Normandy Park 4, SeaTac 3, Tukwila 2, Des Moines 2 | 98136, 98146, 98148, 98166, 98168, 98178, 98188, 98198 |
| Robert Norton | 21 | Auburn 11, Black Diamond 5, Kent 4, Maple Valley 1 | 98010, 98038, 98042, 98092 |
| Cory Ventura | 27 | Kent 11, Renton 10, Auburn 5, Covington 1 | 98001, 98002, 98030, 98031, 98032, 98042, 98055, 98058, 98092 |
| Luke LaVergne | 20 | Olympia 10, Lakewood 2, Tacoma 2, Lacey 2, Tumwater 2, Fircrest 1, University Place 1 | 98466, 98498, 98499, 98501, 98502, 98503, 98512, 98513, 98516 |

#### 2026-09-01 — Tuesday — 132 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 28 | Seattle 18, Shoreline 8, Lake Forest Park 2 | 98102, 98105, 98115, 98117, 98125, 98133, 98155, 98177 |
| Tavis Alexander | 32 | Seattle 31, Normandy Park 1 | 98108, 98112, 98116, 98119, 98122, 98126, 98136, 98144, 98166, 98199 |
| Robert Norton | 25 | Enumclaw 18, Ravensdale 5, Auburn 2 | 98022, 98051, 98092 |
| Cory Ventura | 22 | Puyallup 14, Orting 6, Pierce County 1, Tacoma 1 | 98360, 98363, 98372, 98373, 98374, 98375, 98446 |
| Luke LaVergne | 25 | Graham 14, Eatonville 6, Spanaway 4, Orting 1 | 98328, 98338, 98360, 98387 |

#### 2026-09-02 — Wednesday — 115 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 22 | Woodinville 9, Kirkland 5, Snohomish 3, Redmond 3, Bothell 2 | 98011, 98021, 98033, 98034, 98052, 98072, 98077, 98296 |
| Tavis Alexander | 25 | Renton 19, Newcastle 5, Bellevue 1 | 98006, 98056, 98057, 98059 |
| Robert Norton | 22 | Bonney Lake 6, Lake Tapps 6, Buckley 5, Sumner 4, Auburn 1 | 98092, 98321, 98390, 98391 |
| Cory Ventura | 29 | Maple Valley 20, Covington 4, Auburn 3, Black Diamond 1, Kent 1 | 98010, 98038, 98042, 98092 |
| Luke LaVergne | 17 | Gig Harbor 13, Olalla 1, Port Orchard 1, Bremerton 1, Vaughn 1 | 98310, 98329, 98332, 98335, 98359, 98366, 98394 |

#### 2026-09-03 — Thursday — 118 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 21 | Redmond 10, Woodinville 4, Duvall 3, Carnation 2, Sammamish 2 | 98014, 98019, 98052, 98053, 98072, 98074, 98077 |
| Tavis Alexander | 27 | Bellevue 13, Renton 4, Newcastle 4, Mercer Island 3, Clyde Hill 2, Issaquah 1 | 98004, 98006, 98008, 98027, 98040, 98056, 98059 |
| Robert Norton | 26 | Federal Way 10, Tacoma 4, Auburn 4, Edgewood 4, Puyallup 3, Pacific 1 | 98001, 98003, 98023, 98047, 98371, 98372, 98422 |
| Cory Ventura | 24 | Renton 14, Issaquah 7, Kent 2, Maple Valley 1 | 98027, 98038, 98042, 98058, 98059 |
| Luke LaVergne | 20 | Olympia 11, Lacey 4, Yelm 2, Tumwater 2, Roy 1 | 98501, 98502, 98503, 98512, 98513, 98516, 98580, 98597 |

#### 2026-09-04 — Friday — 100 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 25 | Sammamish 24, Issaquah 1 | 98074, 98075 |
| Tavis Alexander | 25 | North Bend 9, Issaquah 7, Fall City 4, Snoqualmie 3, Sammamish 2 | 98024, 98027, 98029, 98045, 98065, 98075 |
| Robert Norton | 27 | Buckley 12, Bonney Lake 11, Puyallup 2, Sumner 1, Tehaleh 1 | 98321, 98374, 98391 |
| Cory Ventura | 0 | *no route* | — |
| Luke LaVergne | 23 | Tacoma 19, Puyallup 3, Lakewood 1 | 98371, 98403, 98404, 98405, 98406, 98407, 98443, 98444, 98445, 98446, 98499 |

#### 2026-09-08 — Tuesday — 122 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 22 | Seattle 15, Shoreline 6, Lake Forest Park 1 | 98102, 98115, 98117, 98119, 98125, 98133, 98155, 98177, 98199 |
| Tavis Alexander | 26 | Seattle 25, Burien 1 | 98108, 98116, 98126, 98136, 98144, 98146 |
| Robert Norton | 27 | Enumclaw 17, Auburn 10 | 98022, 98092 |
| Cory Ventura | 25 | Auburn 9, Black Diamond 6, Covington 6, Kent 3, Maple Valley 1 | 98002, 98010, 98038, 98042, 98092 |
| Luke LaVergne | 22 | Olympia 15, Lacey 6, Tumwater 1 | 98501, 98502, 98503, 98512, 98513, 98516 |

#### 2026-09-09 — Wednesday — 120 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 24 | Kirkland 8, Woodinville 8, Redmond 6, Bothell 1, Snohomish 1 | 98011, 98033, 98034, 98052, 98072, 98077, 98296 |
| Tavis Alexander | 30 | Renton 13, Normandy Park 4, Newcastle 4, Mercer Island 3, Burien 2, SeaTac 2, Tukwila 1, Seattle 1 | 98040, 98056, 98059, 98146, 98166, 98168, 98178, 98188 |
| Robert Norton | 23 | Buckley 8, Bonney Lake 7, Lake Tapps 6, Pierce County 1, Sumner 1 | 98321, 98390, 98391 |
| Cory Ventura | 27 | Kent 14, Renton 10, Enumclaw 1, Covington 1, Maple Valley 1 | 98022, 98030, 98031, 98032, 98038, 98042, 98055, 98057, 98058 |
| Luke LaVergne | 16 | Gig Harbor 11, Olalla 1, Port Orchard 1, Bremerton 1, Vaughn 1, Longbranch 1 | 98310, 98329, 98332, 98335, 98351, 98359, 98366, 98394 |

#### 2026-09-10 — Thursday — 114 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 23 | Redmond 11, Woodinville 5, Snohomish 3, Duvall 3, Carnation 1 | 98014, 98019, 98053, 98072, 98077, 98296 |
| Tavis Alexander | 26 | Bellevue 17, Medina 5, Clyde Hill 3, Redmond 1 | 98004, 98005, 98007, 98008, 98039, 98052 |
| Robert Norton | 22 | Federal Way 8, Auburn 5, Tacoma 4, Edgewood 2, Puyallup 2, Pacific 1 | 98001, 98003, 98023, 98047, 98371, 98372, 98422 |
| Cory Ventura | 24 | Renton 14, Bellevue 6, Newcastle 3, Issaquah 1 | 98006, 98008, 98027, 98058, 98059 |
| Luke LaVergne | 19 | Graham 10, Eatonville 5, Spanaway 3, Orting 1 | 98328, 98338, 98360, 98387 |

#### 2026-09-11 — Friday — 121 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 25 | Sammamish 24, Issaquah 1 | 98074, 98075 |
| Tavis Alexander | 21 | Issaquah 8, Sammamish 4, Fall City 4, North Bend 4, Snoqualmie 1 | 98024, 98029, 98045, 98065, 98075 |
| Robert Norton | 22 | Buckley 11, Bonney Lake 9, Sumner 1, Orting 1 | 98321, 98360, 98391 |
| Cory Ventura | 24 | Maple Valley 13, Ravensdale 6, Issaquah 5 | 98027, 98038, 98051 |
| Luke LaVergne | 29 | Puyallup 14, Tacoma 13, Steilacoom 1, University Place 1 | 98371, 98372, 98373, 98374, 98375, 98388, 98403, 98404, 98405, 98406, 98407, 98443, 98444, 98445, 98446, 98466, 98498 |

#### 2026-09-14 — Monday — 134 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 28 | Kirkland 11, Bellevue 8, Medina 4, Clyde Hill 2, Redmond 2, Yarrow Point 1 | 98004, 98005, 98008, 98033, 98034, 98039, 98052 |
| Tavis Alexander | 29 | Seattle 25, Burien 4 | 98116, 98126, 98136, 98146 |
| Robert Norton | 22 | Puyallup 12, Graham 8, Orting 2 | 98338, 98360, 98373, 98374, 98375 |
| Cory Ventura | 32 | Renton 21, Kent 7, Maple Valley 3, Covington 1 | 98038, 98042, 98055, 98057, 98058 |
| Luke LaVergne | 23 | Olympia 17, Lacey 4, DuPont 1, Tumwater 1 | 98327, 98501, 98502, 98506, 98512, 98516 |

#### 2026-09-15 — Tuesday — 122 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 28 | Seattle 21, Shoreline 6, Bothell 1 | 98021, 98102, 98105, 98112, 98115, 98117, 98119, 98125, 98133, 98177, 98199 |
| Tavis Alexander | 27 | Seattle 10, Normandy Park 7, Tukwila 5, Burien 2, SeaTac 2, Renton 1 | 98057, 98108, 98144, 98148, 98166, 98168, 98178, 98188, 98198 |
| Robert Norton | 23 | Auburn 8, Enumclaw 7, Black Diamond 5, Kent 2, Maple Valley 1 | 98010, 98022, 98038, 98042, 98092 |
| Cory Ventura | 28 | Enumclaw 18, Buckley 5, Orting 3, Pierce County 1, Bonney Lake 1 | 98022, 98321, 98360, 98391 |
| Luke LaVergne | 16 | Eatonville 5, Yelm 5, Spanaway 3, Graham 2, Roy 1 | 98328, 98338, 98387, 98580, 98597 |

#### 2026-09-16 — Wednesday — 140 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 27 | Woodinville 13, Snohomish 4, Redmond 4, Bothell 3, Duvall 2, Monroe 1 | 98011, 98012, 98019, 98021, 98052, 98053, 98072, 98077, 98272, 98296 |
| Tavis Alexander | 33 | Renton 24, Newcastle 7, Kent 2 | 98042, 98056, 98059 |
| Robert Norton | 30 | Sumner 8, Buckley 8, Lake Tapps 6, Bonney Lake 4, Puyallup 3, Edgewood 1 | 98321, 98372, 98374, 98390, 98391 |
| Cory Ventura | 31 | Auburn 16, Kent 12, Des Moines 2, SeaTac 1 | 98001, 98002, 98031, 98032, 98092, 98188, 98198 |
| Luke LaVergne | 19 | Gig Harbor 12, Tacoma 2, Fox Island 1, Olalla 1, Port Orchard 1, Bremerton 1, Longbranch 1 | 98310, 98329, 98332, 98333, 98335, 98351, 98359, 98366, 98405, 98465 |

#### 2026-09-17 — Thursday — 131 stops

| Tech | Stops | Where (city x stops) | Zips |
|---|---|---|---|
| Alias Franks | 22 | Redmond 15, Carnation 3, Sammamish 2, Bellevue 1, Kirkland 1 | 98005, 98014, 98033, 98052, 98053, 98074 |
| Tavis Alexander | 28 | Bellevue 15, Mercer Island 7, Issaquah 5, Medina 1 | 98004, 98005, 98006, 98008, 98027, 98029, 98039, 98040 |
| Robert Norton | 24 | Federal Way 13, Edgewood 5, Pacific 2, Auburn 2, Tacoma 2 | 98001, 98003, 98023, 98047, 98371, 98372, 98422 |
| Cory Ventura | 31 | Maple Valley 7, Issaquah 7, Renton 7, Kent 5, Covington 5 | 98027, 98030, 98038, 98042, 98059 |
| Luke LaVergne | 26 | Olympia 19, Lacey 4, Tumwater 3 | 98501, 98502, 98503, 98512, 98513 |
