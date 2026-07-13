# Morning Review — Week of 7/13 Routing (written overnight 7/10→7/11)

## Where it stands

The **mirror-history board** is loaded in OptimoRoute: every customer on **their own historical
weekday** (439 of 473 have a clear habit; 93%), sets + 27 hand-scheduled promises pinned, no
optimizer inventions. Two variants were tested overnight:

| Variant | Result |
|---|---|
| Days + techs both mirrored | 61 stops don't fit; 4 days past 18:00 |
| **Days mirrored, techs flex** (currently loaded) | **Everything fits days; Mon → 20:36, Wed → 20:05** |

## The one real problem (it was never routing)

**Monday holds 111 stops and Wednesday 106 — but only 3 trucks work those days.**
Your customers' historical Monday/Wednesday rhythm was built when the roster had more
Monday/Wednesday capacity (Tavis 5 days/wk + your days). Today: Tavis out, you on Tue/Thu/Fri.
3 trucks × 18:00 cap ≈ 95 stops/day. Monday is ~16 over, Wednesday ~11 over.
Tuesday (94 with FOUR trucks) and Friday (73) are light. That's the whole story —
every "wrong-looking" board tonight was some tool's attempt to hide this shortage.

## Your options (pick one, or mix)

**A. Shift your driving days to Mon/Wed (+Thu or Fri) this week.** — RECOMMENDED
Every day then fits under 18:00 with zero customer moves: Mon 111/4≈28 each, Wed 106/4≈27,
Tue 94/3≈31, Thu 125/4≈31, Fri 73/3≈24. Peninsula stops (8) ride on whichever day you work —
they're your area. One roster tweak in OR (2 min via API once you confirm), one re-sequence.

**B. Move whole small areas off Mon/Wed to Tuesday.**
e.g. Federal Way + Newcastle (Mon→Tue), Woodinville + Duvall + Carnation (Wed→Tue).
Customers' days change (they're "anytime" customers, so no promises broken), Tuesday fills to ~130/4.

**C. Accept overtime Mon/Wed this week** (20:30 / 20:00 finishes). It is what it is until Tavis returns.

## Once you pick, the finish is
1. (A: I set your OR days / B: I move those areas / C: nothing) → re-sequence (~3 min)
2. You eyeball the board in OR — it should finally look like YOUR week
3. Say "send it" → 473+36 visits written to Jobber (times + days + techs), day-move list exported
4. Sunday 2 p.m.: Monday's customers get correct arrival-window emails

**Deadline math:** write-back must finish before Sunday ~13:30 PT. Everything above fits Saturday.

## Also parked, not lost
- **Backfill (WF-3):** 64,429 future visits still need placeholder windows — canary + overnight
  drain, any evening. Until then, only optimized-this-week customers get correct email windows.
- **Zone calendar:** `zone-map.json` + `zone-map-draft.md` (12-mo history) — for LATER, one area
  at a time, when you choose. Not in play for this week anymore.
- **n8n Jobber credential:** dead again; durable fix = dedicated second Jobber app (5-min setup).
  The scheduled 2×/day automation waits on this; scripts cover everything meanwhile.
- Jobber cleanup: double-booking job 7735 (two Fri visits).
- Tavis's return instantly adds ~2 truck-days/week — the structural fix for Mon/Wed.
