# August 2026 — moles caught per tech

Source: Jobber job notes (the tech's visit checklist), 2026-08-01 → 2026-08-31 PT.
2,507 visits / 946 jobs / 2,505 notes in the window. Attribution = the note's author
(`createdBy`), which matched the visit's `completedBy` on essentially every row.

| Tech | Moles | Completed visits | Per visit | % of visits with a catch |
|------|------:|-----------------:|----------:|-------------------------:|
| Cory Ventura | **181** | 635 | 0.29 | 24.9% |
| Alias Franks | 175 | 576 | 0.30 | 25.9% |
| Luke LaVergne | 110 | 413 | 0.27 | 22.9% |
| Tavis Alexander | 91 | 308 | 0.30 | 25.2% |
| Robert Norton | 90 | 394 | 0.23 | 20.7% |
| Cammeron Anderson | 33 | 139 | 0.24 | 23.4% |
| Spencer Hill | 9 | 32 | 0.28 | 29.0% |
| **Total** | **689** | 2,497 | 0.28 | — |

Biggest single visits (3 each): #8290 Joseph Shannon (Luke, 08-05), #8249 John Shepard
(Alias, 08-21 and again 08-28), #8256 Doug Crow (Alias, 08-06), #6737 Kristina Rollings
(Luke, 08-20). Nothing above 3 in the month.

## Method

`catch-tally.mjs` pages every visit in the window (job ids + `completedBy`), pulls the last
8 notes per job, keeps notes created inside the window, and counts catches line by line —
`3 mole`, `2 caught`, `Caught 1`, `1 mole caught` all count; `No mole` / `0 mole` count zero;
trap-inventory lines (`2 TL`, `1 voos`) never match. Multi-property notes ("1st house… 2nd
house…") sum per line. Resumable via `stage1.json` / `notes.json`; paced against Jobber's
cost bucket (10,000 max, 500/s restore) — without that pacing the run crawls.

Run: `node projects/briefs/jobber-notes-automation/catch-tally/catch-tally.mjs 2026-09-01 2026-09-30`

## Caveats

- **Volume drives the top spot.** Cory leads on total but not on rate — he also worked the
  most visits. On catches per visit the month is a three-way tie: Alias .30, Tavis .30, Cory .29.
- **Partial months:** Cammeron left mid-month (139 visits); Tavis ramped from the 08-17
  handover. Neither total is comparable to a full-month tech.
- **714 of 2,505 notes (28%) never mention moles at all** — they open on misses or the
  activity code. Those are scored 0. If a tech ever omits the catch line when they did catch,
  this undercounts them; the note convention is the only guard against that.
- Two notes needed a human read and were counted as 1 each: #5511 "customer uncovered dead
  mole", #8185 "animal must have ate it and pulled trap out".
