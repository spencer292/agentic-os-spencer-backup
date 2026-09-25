# Five-territory cut — review for the week of 2026-08-17

Built 2026-08-12. **Decision needed from Spencer: pick a map, by Friday 08-14.**

Cory Ventura stays in the field instead of stepping out when Tavis returns, so the board goes from
four territories to five, effective Monday 2026-08-17.

---

## Why five is the right call, in numbers

The v8 four-way map was already full. Measured over 2026-07-27..08-07 (1,074 visits, 537/wk):

| | |
|---|---|
| Total field work | **153.7 h/wk** |
| Tech-days available at 4 techs | 20 (4 × 5) |
| Tech-days needed | 19.4 — **97% utilised before commute** |
| Plus measured drive-to-first-job | ~9 h/wk, which puts the team **over** 20 tech-days |

That is why everyone has been in overtime. It was never drift; the board has been overflowing.

At five techs the same 153.7 h/wk lands at **30.7 h/wk each — 6.1 h per route-day**, comfortably
inside your 8h target with real headroom for spring, which is what "staff near peak" requires.

---

## Two maps. They trade legibility against balance.

Both re-deal the same 22 measured region blocks. **No block is split between techs**, so no
customer changes owner mid-block.

### Option A — Highway map (recommended)

Five lines you can say out loud. This is the property that made v8 work where the city-name maps
failed, and it is what Cory has to be handed in Phase 5.

| Tech | Territory | h/wk | Home |
|---|---|---:|---|
| **Alias Franks** | **EASTSIDE** — north of I-90, east of Lake Washington | 34.1 | Snohomish 98296 ✅ in territory |
| **Tavis Alexander** | **SEATTLE + RENTON** — Seattle city both sides of I-90, Mercer Is, Renton/Newcastle | 31.8 | ⚠️ unknown |
| **Cory Ventura** | **SR-410 COUNTRY** — Buckley/Bonney Lake/Sumner, Puyallup, Graham/Orting/Eatonville | 30.2 | Buckley 98321 ✅ in territory |
| **Luke LaVergne** | **I-705 WEST AND SOUTH** — Tacoma, Peninsula, Thurston, Lakewood, Federal Way | 29.4 | Puyallup 98373 — ~12 min out, unchanged from today |
| **Robert Norton** | **SR-18 CORRIDOR** — Kent, Auburn, Maple Valley, Enumclaw, Issaquah South | 28.2 | Maple Valley 98038 ✅ in territory |

Spread 28.2–34.1. **10 of 22 blocks change owner** (72.8 h/wk of work).

### Option B — Solver map

Optimised purely for hours and contiguity: spread 29.7–33.3, and lower weekday churn (18.6% vs
26.8%). **But Tavis gets a thin north–south strip — Sammamish → Issaquah South → Bellevue South →
Enumclaw → Auburn — that crosses I-90 and cannot be described as a boundary.** It also moves more
ground: 13 of 22 blocks change owner, 98.0 h/wk.

Full detail in `data/five-way-cut.json` and `data/five-way-day-plan.json`.

| | Option A (highway) | Option B (solver) |
|---|---:|---:|
| Hours spread | 28.2 – 34.1 | 29.7 – 33.3 |
| Blocks changing owner | **10 of 22** | 13 of 22 |
| Work changing owner | **72.8 h/wk** | 98.0 h/wk |
| Visits changing weekday | 143.8 (26.8%) | **99.5 (18.6%)** |
| Worst route-day | 8.8 h | 8.7 h |
| Dead route-days | 0 | 0 |
| Boundary describable in a sentence | **yes** | no |

**Recommendation: Option A.** It moves less ground, every tech with a known address starts at their
own door, and the boundaries survive the next re-cut argument. The extra weekday churn is a one-time
cost; an illegible map is a permanent one.

---

## The part that costs customers something

Re-dealing blocks breaks the day tiling. v8 was built so each tech's blocks covered Mon–Fri exactly
one per day; five territories do not tile that way, so some blocks must change weekday or a tech
ends up with a dead day and two 9h days.

**Option A moves 143.8 visits/wk (26.8%) to a different weekday.** By tech:

| Tech | h/wk | mon | tue | wed | thu | fri | Visits changing weekday |
|---|---:|---:|---:|---:|---:|---:|---:|
| Alias | 34.1 | 8.8 | 4.6 | 8.8 | 4.6 | 7.4 | 47.0 (38%) |
| Tavis | 31.8 | 6.6 | 7.9 | 4.4 | 5.0 | 8.0 | 24.0 (19%) |
| Robert | 28.2 | 5.3 | 6.9 | 6.3 | 4.4 | 5.2 | 52.0 (50%) |
| Cory | 30.2 | 4.8 | 4.8 | 6.6 | 7.3 | 6.6 | 12.3 (12%) |
| Luke | 29.4 | 6.9 | 2.9 | 5.2 | 7.0 | 7.5 | 8.5 (10%) |

This is tuned, not accidental — the tiler was swept across churn weights and this is the cheapest
point that still leaves zero dead days and no route-day past 8.8h. Robert is the worst hit because
both SR-516 blocks currently run Monday (19.4h on one day), so one of them has to move regardless.

**This is a one-time move, and the route-engine brief explicitly warns against mass re-cuts.** The
justification is that it happens once, when the fifth territory is created — which is exactly the
event the design says is allowed to move people ("hiring creates five new route-days"). It must not
become a habit.

---

## One thing the highway map quietly fixes

Today Cory lives in Buckley (T3 ground) and Robert lives in Maple Valley (T2 ground) — **both commute
out of their own territory every morning.** Option A puts each of them on their own doorstep.

It also retires a per-address boundary: with both SR-516 blocks going to Robert, the `sr-516`
geo-split no longer decides *ownership*, only which day. `bellevue-ne8th` still decides ownership
(Points/NE 8th → Alias, Bellevue South/Mercer → Tavis), and `thurston-i5-101` stays day-only.

---

## Before anything deploys

**Blocking:**
1. **Pick Option A or B.** Everything below waits on this.
2. **Tavis's home address** — still unknown, flagged in the roster since 08-07. He is being handed
   Seattle + Renton partly *because* it is central, but the commute is unmeasured.
3. **`territories.json` v9** — the map is 4-territory today. `assign-by-territory.mjs` reads it, so
   the file has to be rewritten to five before any assignment pass runs.

**Defects on next week's board, independent of the map:**
- 2 **Saturday** visits (Robert ×1, Tavis ×1) — Got Moles is Mon–Fri
- 1 **unassigned** visit, 1 pinned to **Spencer Hill** (should be zero)
- Cory currently holds 47 visits next week under the old handover assumption; Tavis holds 57

**Known and unchanged:**
- All five techs already exist as OptimoRoute drivers — no UI work needed
- Federal Way 98003/98023 is still on loan to Luke with **no end date** (open question since 08-07)
- `route-drift-check` stays off

**Timing:** the 14:00 PT D-1 arrival-window email means Monday's routes must be written by Friday
08-14. That is the real deadline, not Sunday.

---

## Caveats on these numbers

- Hours come from the **measured 07-27..08-07 zip census** (537 visits/wk), not from next week's
  board. Next week currently has **381 visits booked** — roughly 150 more will land from cadence
  adds and new bookings before Monday. The map is built on typical volume, which is correct for a
  territory decision, but next week's actual day loads will differ.
- Drive time is the census's `driveMinPerStop` per block, which blends drive with on-site time and
  assumes one pace for every tech. Measured pace varies 23% (Cory 17.3 min/stop → Alias 21.3), so
  Alias's 34.1 h/wk is effectively heavier than it reads and Cory's 30.2 lighter. Per-driver service
  times are deliberately **not** set in OptimoRoute yet — Robert and Tavis are too new.
- This is territory and weekday only. Within-day sequencing is OptimoRoute's job at plan time.

---

---

## DECIDED 2026-08-12 (Spencer)

**Option A, and absorb the weekday churn in one move.** `territories.json` v9 built and verified.

### Verification against the real board

`scripts/verify-v9.mjs`, read-only, replaying `assign-by-territory.mjs`'s own resolution logic:

| Check | Result |
|---|---|
| Handover uniqueness | ok — 10 regions handed over, each exactly once |
| Owner resolution both sides of 08-17 | ok — all 22 regions resolve to exactly one field tech |
| **Live week of 08-10 protected** | **ok — no region changes owner before 08-17** |

Ownership is encoded as **handovers effective 2026-08-17, with v8's `owner` values left untouched.**
Rewriting `owner` directly would have retro-assigned this week's already-routed live board — the
single most dangerous mistake available here.

### Dry-run, week of 2026-08-17 (381 visits booked)

**142 visits would be reassigned, 238 are already on the right tech.**

| From → To | Visits |
|---|---:|
| Cory → Tavis | 32 |
| Alias → Tavis | 28 |
| Robert → Cory | 28 |
| Luke → Cory | 21 |
| Tavis → Robert | 17 |
| Cory → Robert | 14 |
| (unassigned) → Cory | 1 |
| Spencer Hill → Tavis | 1 |

The cut clears both stragglers on its own: the unassigned visit and the one still pinned to Spencer.

### Four defects found on next week's board

| Job | What | Fix |
|---|---|---|
| #8230 Scott Jennings, Bonney Lake 98391 | **Saturday** 08-22, Robert | Move to a weekday |
| #8204 Michael Marquez, Maple Valley 98038 | **Saturday** 08-22, Tavis | Move to a weekday |
| #8351 Tanya O'Bannon, Lakemont Community Association, Bellevue | **postal code is empty in Jobber** — unroutable, maps to no region | Set to 98006 in Jobber |
| #8353 Jake Fox, Graham 98338 | unassigned | Resolved by the cut → Cory |

53 visits sit on geoSplit zips and need per-address coordinate resolution at run time
(`geo-side-cache.json`); the dry-run used `fallbackSide`, so the live figure will shift slightly.

### What is NOT yet done

`assign-by-territory` writes **the assignee only — no dates, no times.** The 143.8 visits/wk of
weekday moves are a separate and much riskier write (`visitEditSchedule`), and they are not built.
That is the remaining gap between here and a routed week.

## Files

- `scripts/five-way-cut.mjs` — solver (seeded region-growing + hill-climb, contiguity-constrained)
- `scripts/five-way-highway.mjs` — hand-drawn highway map, same output schema
- `scripts/day-tile.mjs` — day re-tiling pass with churn weighting; consumes either map
- `data/five-way-highway.json`, `data/five-way-highway-day-plan.json` — **Option A**
- `data/five-way-cut.json`, `data/five-way-day-plan.json` — Option B
- `../technician-route-automation/week-0817.json` — 381 live visits, week of 08-17

All read-only. Nothing has been written to Jobber or OptimoRoute.
