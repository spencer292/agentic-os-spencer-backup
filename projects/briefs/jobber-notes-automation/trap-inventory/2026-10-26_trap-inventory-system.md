# Trap Inventory System

Set by Spencer 2026-10-26. Starting count: **Friday 2026-10-30.**

## Why

No Victors bought in years, so the fleet is fixed. Jobber notes show ~1,240 Victors in the ground
today and never more than ~1,390 at once (Oct 2025). The rest of the fleet is on trucks, in the shop,
or gone, and nothing tracks which. Notes are not trusted as the count of record.

## Locations and who answers for them

| Location | Responsible |
|---|---|
| Shop | Cory |
| Truck | That tech |
| In the ground on a job | Tech assigned to the job's next visit |
| Lost / broken | Written off, reason required |

## Data sources

- **Truck counts** — every tech counts their truck Friday; **Tavis enters all of them into the sheet**
  (Spencer 2026-10-26). Only Cory and Tavis have sheet access.
- **Shop count** — Cory, every Friday, into the sheet. Cory also logs every issue (shop to truck) and return.
- **In-ground** — what the tech *claims*, read from visit notes (`trap-inventory.mjs`). Treated as a claim, not a fact. Verified by:
  - **Closeout** — traps pulled at job close must show up as a rise in that tech's next truck count.
  - **Spot audits** — Cory or Spencer counts traps on a few random jobs a week, against what the notes claim.
    Jobs that recently changed tech (detected from Jobber, not logged by techs) are audited first.
  - Techs do NOT log handovers and there is no Job # column (Spencer 2026-10-26). Audits name the client in Notes.

Sheet: [Got Moles Trap Inventory](https://docs.google.com/spreadsheets/d/1QsKV2XjWrQbXulEE22V3btUkotqmyGgiDk-rCzg9TlA/edit)

| Type | Who | Fill in |
|---|---|---|
| Truck count | Tavis enters for every tech, Fridays | Victors, TL, broken |
| Shop count | Cory, Fridays | Victors, TL, broken |
| Issue | Cory | Name = tech receiving; Victors, TL |
| Return | Cory | Name = tech returning; Victors, TL |
| Audit | Cory / Spencer | Victors and TL found; client name in Notes |
| Lost / broken | Anyone | Victors, TL, what happened in Notes |

## The weekly check

Per tech:

    tech total = Friday truck count + traps claimed in the ground on their jobs
    expected   = last week's total + issued - returned - written off

`expected - tech total` is that tech's unexplained gap for the week. Overclaiming in-ground hides a
gap only until a closeout or an audit hits that job.

Fleet:

    fleet = shop + all trucks + all in-ground + left on closed jobs

Friday 10/30 sets the baseline fleet number. Every week after is checked against it.

## Color codes (zip ties)

One colored zip tie per trap, one color per tech, put on every trap on the truck at the 10/30 count
(Spencer chose zip ties over paint 2026-10-26). Shop stock stays untagged until issued. A trap keeps
its tie until it comes back to the shop, so a stray trap traces to the tech who carried it. A missing
tie gets replaced at the next visit. Colors are Spencer's call — proposal:

| Tech | Color |
|---|---|
| Alias Franks | Blue |
| Tavis Alexander | Orange |
| Robert Norton | Green |
| Luke LaVergne | Yellow |
| Cory Ventura | Red |
| Spencer Hill | White |

## Still to build

- Weekly report: reads the sheet + runs `trap-inventory.mjs`, prints the per-tech gap, flags closed jobs
  with traps still listed, handover/audit mismatches. Build after 10/30 data exists.
