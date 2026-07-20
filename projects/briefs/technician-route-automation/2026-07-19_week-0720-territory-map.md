# Territory Map — Week of 2026-07-20 (canonical "who owns what, when")

> Spencer's directive (2026-07-19): **techs own their spaces.** No random technicians in random
> places — every assignment has a rhyme and reason. This map is the reference for what "right"
> looks like. The weekly mirror perpetuates it automatically (each job returns to the weekday +
> tech of its last completed visit), so Spencer's 07-19 hand edits are now baked in going forward.
> Raw data: `density-snapshot-raw.json`.

## The ownership grid

| Day | Cammeron Anderson | Cory Ventura | Luke LaVergne | Spencer Hill |
|-----|-------------------|--------------|---------------|--------------|
| **Mon** | Federal Way / Auburn / Edgewood (28) | Bellevue / Redmond / Kirkland Eastside core (33) | Olympia / Lacey / Tumwater (32) | **OFFICE** |
| **Tue** | Seattle S + Burien / Normandy Park / SeaTac (34) | Seattle city + Shoreline (31) | Puyallup / Graham / Yelm / Eatonville rural south (31) | Gig Harbor / Kitsap peninsula (9) |
| **Wed** | Renton / Kent / Auburn (39) | Redmond / Woodinville / Snoqualmie Valley N (34) | Tacoma / Puyallup (41) | — |
| **Thu** | Maple Valley / Kent / Covington (28) | Sammamish / Issaquah (31) | Enumclaw / Black Diamond (31) | Renton / Bellevue / Newcastle / Mercer Island (29) |
| **Fri** | Auburn / Covington / Black Diamond / Maple Valley (23) | Buckley (21) | Bonney Lake / Lake Tapps / Sumner / Buckley (33) | North Bend / Snoqualmie / Fall City (17) |

Broad strokes: **Cammeron = south King County core** (Federal Way→Kent→Renton→Maple Valley belt).
**Cory = Eastside + Seattle** (Bellevue/Redmond/Sammamish, Seattle Tue, Buckley Fri outlier run).
**Luke = Pierce/Thurston south** (Olympia, rural south, Tacoma, Enumclaw, Bonney Lake).
**Spencer = overflow + fringes** (peninsula Tue, close-in Eastside Thu, upper valley Fri) around
office/admin days.

## Density check (2026-07-19 plan, 525 stops)

- 14 of 18 routes have mean spread ≤ 9 km from route center — tight, single-area routes.
- Tightest: Cory Fri Buckley (3.2 km mean), Spencer Thu (3.6), Cammeron Fri (4.3), Luke Fri (4.6).
- Widest (structural, not errors): Luke Tue rural south 14.8 km mean / 67 km span — Yelm–Eatonville
  geography is inherently spread; Spencer Tue peninsula 14.1 km mean / 45 km span — 9-stop
  Gig Harbor/Bremerton run; Cory Tue 10.4 km — Seattle N–S with Shoreline tail.
- City-purity: most routes are 1–3 adjacent cities; Seattle is split Cammeron-south/Cory-north on
  Tuesdays.

## Rules going forward (why this stays touch-free)

1. **Weekly flow is ALWAYS:** `push-week.mjs live` → `mirror-lastweek.mjs live` →
   `optimize-week.mjs plan` → `verify-mirror.mjs` → Spencer review → `optimize-week.mjs write`.
   The raw push alone is a baseline that floats everything — NEVER present it as the plan
   (07-18 mistake: optimizer re-dealt the board, made Spencer the workhorse).
2. **Mirror = memory.** Completed reality this week becomes next week's default. Hand edits are
   one-time corrections that persist automatically once the week runs.
3. **Committed/promise visits:** day follows the Jobber promise (never moved silently); tech
   follows last week's owner — committed orders need explicit `assignedTo` because the mirror
   skips them (the 07-19 gap that put 9 jobs on the wrong techs).
4. **New customers:** territory grid (ZIP → day+tech) via `territory-grid.json`; returning
   customers rebooked mid-week: mirror history first, grid second.
5. **Spencer is overflow, not a route.** Office Mon (this week), light Tue/Wed; his days can vary
   week to week — check with him before planning him a full day.
