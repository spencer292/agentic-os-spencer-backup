# Quick Fix Overrun Audit

**Run:** 2026-08-11 · **Source:** Jobber, all live (non-archived) jobs · **Read-only — nothing was changed**

The Quick Fix is a five-week weekly program. This report lists every open Quick Fix job with a sixth visit or beyond — delivered or already on the calendar — ranked from most visits to least.

## Summary

| Measure | Count |
|---|---|
| Live jobs swept | 817 |
| Open Quick Fix jobs | 117 |
| Jobs past the 5-visit series (delivered or booked) | 20 |
| Jobs that have **already had** more than 5 visits | 11 |
| **Total visits beyond week 5** | **60** |
| — already delivered | 31 |
| — still scheduled ahead | 29 |
| Combined program value of these 20 jobs | $8,700 |

Product is identified by the job **line item**, not `jobType` — every Got Moles job is RECURRING, Quick Fix included. Jobs carrying both a Quick Fix and a Total Mole Control line item were excluded as conversions.

### Shape of the book

Across all 117 open Quick Fix jobs, total visits scheduled:

| Visits on the job | Jobs |
|---|---|
| 4 | 2 |
| 5 | 95 |
| 6 (over) | 9 |
| 7 (over) | 4 |
| 8 (over) | 2 |
| 9 (over) | 1 |
| 10 (over) | 1 |
| 12 (over) | 1 |
| 14 (over) | 1 |
| 17 (over) | 1 |

**95 of 117 sit at exactly five.** The program holds for the large majority. The overrun is concentrated in the twenty jobs below, and over half the excess sits in the top four.

## Ranked list — most visits to least

| # | Job | Client | Had | Total | Beyond 5 | Median gap | First visit | Last done | Next booked | Value |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | #7964 | Barbee Mill HOA | 7 | 17 | +12 | 28d | 2026-06-04 | 2026-08-05 | 2026-08-13 | $1000 |
| 2 | #7908 | Jill Robinson | 13 | 14 | +9 | 7d | 2026-05-13 | 2026-08-05 | 2026-08-12 | $425 |
| 3 | #7949 | Jim Tewillliager | 11 | 12 | +7 | 7d | 2026-05-29 | 2026-08-04 | 2026-08-13 | $450 |
| 4 | #7986 | Tai Tran | 9 | 10 | +5 | 7d | 2026-06-11 | 2026-08-05 | 2026-08-14 | $375 |
| 5 | #8047 | Jay Poole | 8 | 9 | +4 | 7d | 2026-06-24 | 2026-08-10 | 2026-08-17 | $375 |
| 6 | #8103 | Cindy Joaquin | 7 | 8 | +3 | 7d | 2026-07-03 | 2026-08-10 | 2026-08-17 | $450 |
| 7 | #8059 | Jared Barrett | 7 | 8 | +3 | 7d | 2026-06-26 | 2026-08-04 | 2026-08-11 | $375 |
| 8 | #8107 | Chris Higgs | 6 | 7 | +2 | 7d | 2026-07-07 | 2026-08-11 | 2026-08-18 | $375 |
| 9 | #8109 | Dave Gunovich | 6 | 7 | +2 | 7d | 2026-07-08 | 2026-08-10 | 2026-08-17 | $450 |
| 10 | #8116 | Tim Banning | 6 | 7 | +2 | 7d | 2026-07-07 | 2026-08-10 | 2026-08-17 | $375 |
| 11 | #8089 | Klaudia Elam | 6 | 7 | +2 | 7d | 2026-06-30 | 2026-08-04 | 2026-08-11 | $450 |
| 12 | #8140 | Hugh Downer | 5 | 6 | +1 | 7d | 2026-07-10 | 2026-08-05 | 2026-08-12 | $450 |
| 13 | #8148 | Michelle Wantuch | 5 | 6 | +1 | 7d | 2026-07-14 | 2026-08-11 | 2026-08-18 | $375 |
| 14 | #8142 | Kevin Shaver | 5 | 6 | +1 | 7d | 2026-07-14 | 2026-08-11 | 2026-08-18 | $450 |
| 15 | #8125 | Carly Klee | 5 | 6 | +1 | 7d | 2026-07-09 | 2026-08-07 | 2026-08-14 | $375 |
| 16 | #8141 | Stan Salvatto | 5 | 6 | +1 | 7d | 2026-07-13 | 2026-08-10 | 2026-08-17 | $450 |
| 17 | #8108 | Mike Marinella | 5 | 6 | +1 | 7d | 2026-07-07 | 2026-08-04 | 2026-08-11 | $375 |
| 18 | #8118 | Patty Ring | 5 | 6 | +1 | 7d | 2026-07-07 | 2026-08-04 | 2026-08-13 | $375 |
| 19 | #8228 | Matt Vega | 4 | 6 | +1 | 6d | 2026-07-24 | 2026-08-10 | 2026-08-17 | $450 |
| 20 | #8271 | Craig Nelson | 3 | 6 | +1 | 7d | 2026-07-31 | 2026-08-10 | 2026-08-17 | $300 |

**#7964 Barbee Mill HOA is a different animal.** It carries a Quick Fix line item at $1,000 but runs on a 28-day cadence with ten more visits scheduled out — a commercial account priced and structured as monthly service under a Quick Fix label. It tops the table on raw visit count but it is not a weekly-series overrun. Excluding it, the ten true weekly overruns account for 29 delivered visits beyond week 5.

**Two jobs were created oversized rather than overrun.** #8228 Matt Vega (4 delivered of 6 booked) and #8271 Craig Nelson (3 of 6) have a sixth visit on the calendar before the fifth has happened — a setup problem at job creation, not a series that ran long. Worth checking how the recurrence was built.

**#8151 Chuck Blevens** (not in this table) is the only one of 117 open Quick Fix jobs that stopped cleanly: 5 of 5 delivered, no sixth booked, sitting in `requires_invoicing`. That is the correct end state.

## Visit-by-visit detail

Every visit on each job, in date order. Visits 1–5 are the program the customer bought; **visit 6 onward is the overrun** and is flagged in the Beyond column.

### 1. #7964 — Barbee Mill HOA

**17 visits total** (7 delivered, 10 scheduled) · **12 beyond week 5** · median gap 28 days · $1000

4205 Williams Avenue North, Renton, 98056
Line items: The Quick Fix — One-Month Mole Control Program ($1000)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-06-04 | Complete | — | Cory Ventura, Spencer Hill |
| 2 | 2026-06-11 | Complete | — | Cammeron Anderson, Spencer Hill |
| 3 | 2026-06-18 | Complete | — | Cammeron Anderson, Spencer Hill |
| 4 | 2026-06-25 | Complete | — | Spencer Hill |
| 5 | 2026-07-02 | Complete | — | Spencer Hill |
| 6 | 2026-07-09 | Complete | **yes** | Spencer Hill |
| 7 | 2026-08-05 | Complete | **yes** | Cory Ventura |
| 8 | 2026-08-13 | Scheduled | **yes** | Cory Ventura |
| 9 | 2026-09-03 | Scheduled | **yes** | Tavis Alexander |
| 10 | 2026-10-01 | Scheduled | **yes** | Tavis Alexander |
| 11 | 2026-11-05 | Scheduled | **yes** | Tavis Alexander |
| 12 | 2026-12-03 | Scheduled | **yes** | Tavis Alexander |
| 13 | 2027-01-07 | Scheduled | **yes** | Spencer Hill |
| 14 | 2027-02-04 | Scheduled | **yes** | Spencer Hill |
| 15 | 2027-03-04 | Scheduled | **yes** | Spencer Hill |
| 16 | 2027-04-01 | Scheduled | **yes** | Spencer Hill |
| 17 | 2027-05-06 | Scheduled | **yes** | Spencer Hill |

### 2. #7908 — Jill Robinson

**14 visits total** (13 delivered, 1 scheduled) · **9 beyond week 5** · median gap 7 days · $425

6607 Cliff Avenue Southwest, Longbranch, 98351
Line items: The Quick Fix — One-Month Mole Control Program ($500); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-05-13 | Complete | — | Luke LaVergne |
| 2 | 2026-05-20 | Complete | — | Luke LaVergne |
| 3 | 2026-05-27 | Complete | — | Luke LaVergne |
| 4 | 2026-06-03 | Complete | — | Luke LaVergne |
| 5 | 2026-06-10 | Complete | — | Luke LaVergne |
| 6 | 2026-06-17 | Complete | **yes** | Cory Ventura |
| 7 | 2026-06-23 | Complete | **yes** | Spencer Hill |
| 8 | 2026-06-30 | Complete | **yes** | Spencer Hill |
| 9 | 2026-07-07 | Complete | **yes** | Spencer Hill |
| 10 | 2026-07-14 | Complete | **yes** | Spencer Hill |
| 11 | 2026-07-21 | Complete | **yes** | Spencer Hill |
| 12 | 2026-07-29 | Complete | **yes** | Robert Norton, Spencer Hill |
| 13 | 2026-08-05 | Complete | **yes** | Luke LaVergne |
| 14 | 2026-08-12 | Scheduled | **yes** | Luke LaVergne |

### 3. #7949 — Jim Tewillliager

**12 visits total** (11 delivered, 1 scheduled) · **7 beyond week 5** · median gap 7 days · $450

12825 Emerald Ridge Boulevard East, Puyallup, 98374
Line items: The Quick Fix — One-Month Mole Control Program ($450)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-05-29 | Complete | — | Luke LaVergne |
| 2 | 2026-06-02 | Complete | — | Luke LaVergne |
| 3 | 2026-06-09 | Complete | — | Luke LaVergne |
| 4 | 2026-06-16 | Complete | — | Luke LaVergne |
| 5 | 2026-06-23 | Complete | — | Luke LaVergne |
| 6 | 2026-06-30 | Complete | **yes** | Luke LaVergne |
| 7 | 2026-07-07 | Complete | **yes** | Luke LaVergne |
| 8 | 2026-07-15 | Complete | **yes** | Luke LaVergne |
| 9 | 2026-07-22 | Complete | **yes** | Spencer Hill |
| 10 | 2026-07-29 | Complete | **yes** | Luke LaVergne |
| 11 | 2026-08-04 | Complete | **yes** | Luke LaVergne |
| 12 | 2026-08-13 | Scheduled | **yes** | Robert Norton |

### 4. #7986 — Tai Tran

**10 visits total** (9 delivered, 1 scheduled) · **5 beyond week 5** · median gap 7 days · $375

2425 Northeast 16th Street, Renton, 98056
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-06-11 | Complete | — | Spencer Hill, Cammeron Anderson |
| 2 | 2026-06-18 | Complete | — | Cammeron Anderson, Spencer Hill |
| 3 | 2026-06-25 | Complete | — | Spencer Hill |
| 4 | 2026-07-02 | Complete | — | Cammeron Anderson |
| 5 | 2026-07-09 | Complete | — | Spencer Hill |
| 6 | 2026-07-16 | Complete | **yes** | Spencer Hill |
| 7 | 2026-07-23 | Complete | **yes** | Robert Norton, Spencer Hill |
| 8 | 2026-07-30 | Complete | **yes** | Spencer Hill |
| 9 | 2026-08-05 | Complete | **yes** | Cory Ventura |
| 10 | 2026-08-14 | Scheduled | **yes** | Cory Ventura |

### 5. #8047 — Jay Poole

**9 visits total** (8 delivered, 1 scheduled) · **4 beyond week 5** · median gap 7 days · $375

38215 42nd Avenue South, Auburn, 98001
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-06-24 | Complete | — | Cammeron Anderson |
| 2 | 2026-06-29 | Complete | — | Cammeron Anderson |
| 3 | 2026-07-06 | Complete | — | Cammeron Anderson |
| 4 | 2026-07-13 | Complete | — | Cammeron Anderson |
| 5 | 2026-07-20 | Complete | — | Cammeron Anderson |
| 6 | 2026-07-27 | Complete | **yes** | Cammeron Anderson |
| 7 | 2026-08-03 | Complete | **yes** | Cory Ventura |
| 8 | 2026-08-10 | Complete | **yes** | Robert Norton |
| 9 | 2026-08-17 | Scheduled | **yes** | Robert Norton |

### 6. #8103 — Cindy Joaquin

**8 visits total** (7 delivered, 1 scheduled) · **3 beyond week 5** · median gap 7 days · $450

10510 Southeast 250th Place M108, Kent, 98030
Line items: The Quick Fix — One-Month Mole Control Program ($450)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-03 | Complete | — | Cammeron Anderson |
| 2 | 2026-07-09 | Complete | — | Cammeron Anderson |
| 3 | 2026-07-15 | Complete | — | Cammeron Anderson |
| 4 | 2026-07-22 | Complete | — | Cammeron Anderson |
| 5 | 2026-07-29 | Complete | — | Cammeron Anderson |
| 6 | 2026-08-05 | Complete | **yes** | Cory Ventura |
| 7 | 2026-08-10 | Complete | **yes** | Cory Ventura |
| 8 | 2026-08-17 | Scheduled | **yes** | Cory Ventura |

### 7. #8059 — Jared Barrett

**8 visits total** (7 delivered, 1 scheduled) · **3 beyond week 5** · median gap 7 days · $375

24218 Southeast 463rd Street, Enumclaw, 98022
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-06-26 | Complete | — | Cammeron Anderson |
| 2 | 2026-07-02 | Complete | — | Luke LaVergne |
| 3 | 2026-07-09 | Complete | — | Luke LaVergne |
| 4 | 2026-07-16 | Complete | — | Luke LaVergne |
| 5 | 2026-07-23 | Complete | — | Luke LaVergne |
| 6 | 2026-07-28 | Complete | **yes** | Robert Norton, Luke LaVergne |
| 7 | 2026-08-04 | Complete | **yes** | Cammeron Anderson |
| 8 | 2026-08-11 | Scheduled | **yes** | Robert Norton |

### 8. #8107 — Chris Higgs

**7 visits total** (6 delivered, 1 scheduled) · **2 beyond week 5** · median gap 7 days · $375

5042 30th Avenue South, Seattle, 98108
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-07 | Complete | — | Cory Ventura |
| 2 | 2026-07-14 | Complete | — | Cory Ventura |
| 3 | 2026-07-21 | Complete | — | Alias Franks, Cory Ventura |
| 4 | 2026-07-28 | Complete | — | Alias Franks, Cory Ventura |
| 5 | 2026-08-04 | Complete | — | Cory Ventura |
| 6 | 2026-08-11 | Complete | **yes** | Cory Ventura |
| 7 | 2026-08-18 | Scheduled | **yes** | Cory Ventura |

### 9. #8109 — Dave Gunovich

**7 visits total** (6 delivered, 1 scheduled) · **2 beyond week 5** · median gap 7 days · $450

1049 63rd Avenue West, Fircrest, 98466
Line items: The Quick Fix — One-Month Mole Control Program ($450)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-08 | Complete | — | Luke LaVergne |
| 2 | 2026-07-15 | Complete | — | Luke LaVergne |
| 3 | 2026-07-22 | Complete | — | Luke LaVergne |
| 4 | 2026-07-27 | Complete | — | Robert Norton, Luke LaVergne |
| 5 | 2026-08-05 | Complete | — | Luke LaVergne |
| 6 | 2026-08-10 | Complete | **yes** | Luke LaVergne |
| 7 | 2026-08-17 | Scheduled | **yes** | Luke LaVergne |

### 10. #8116 — Tim Banning

**7 visits total** (6 delivered, 1 scheduled) · **2 beyond week 5** · median gap 7 days · $375

20703 15th Avenue South, SeaTac, 98198
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-07 | Complete | — | Cammeron Anderson |
| 2 | 2026-07-14 | Complete | — | Cammeron Anderson |
| 3 | 2026-07-21 | Complete | — | Cammeron Anderson |
| 4 | 2026-07-27 | Complete | — | Cammeron Anderson |
| 5 | 2026-08-03 | Complete | — | Cory Ventura |
| 6 | 2026-08-10 | Complete | **yes** | Cory Ventura |
| 7 | 2026-08-17 | Scheduled | **yes** | Cory Ventura |

### 11. #8089 — Klaudia Elam

**7 visits total** (6 delivered, 1 scheduled) · **2 beyond week 5** · median gap 7 days · $450

4439 Southwest Rose Street, Seattle, 98136
Line items: The Quick Fix — One-Month Mole Control Program ($450)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-06-30 | Complete | — | Cammeron Anderson |
| 2 | 2026-07-07 | Complete | — | Cammeron Anderson |
| 3 | 2026-07-14 | Complete | — | Cammeron Anderson |
| 4 | 2026-07-21 | Complete | — | Cammeron Anderson |
| 5 | 2026-07-28 | Complete | — | Cammeron Anderson |
| 6 | 2026-08-04 | Complete | **yes** | Cory Ventura |
| 7 | 2026-08-11 | Scheduled | **yes** | Cory Ventura |

### 12. #8140 — Hugh Downer

**6 visits total** (5 delivered, 1 scheduled) · **1 beyond week 5** · median gap 7 days · $450

6309 228th Avenue East, Buckley, 98321
Line items: The Quick Fix — One-Month Mole Control Program ($450)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-10 | Complete | — | Luke LaVergne |
| 2 | 2026-07-17 | Complete | — | Luke LaVergne |
| 3 | 2026-07-24 | Complete | — | Luke LaVergne |
| 4 | 2026-07-31 | Complete | — | Robert Norton |
| 5 | 2026-08-05 | Complete | — | Cammeron Anderson |
| 6 | 2026-08-12 | Scheduled | **yes** | Robert Norton |

### 13. #8148 — Michelle Wantuch

**6 visits total** (5 delivered, 1 scheduled) · **1 beyond week 5** · median gap 7 days · $375

6743 Sycamore Avenue Northwest, Seattle, 98117
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-14 | Complete | — | Cory Ventura |
| 2 | 2026-07-21 | Complete | — | Alias Franks, Cory Ventura |
| 3 | 2026-07-28 | Complete | — | Alias Franks, Cory Ventura |
| 4 | 2026-08-04 | Complete | — | Alias Franks |
| 5 | 2026-08-11 | Complete | — | Alias Franks |
| 6 | 2026-08-18 | Scheduled | **yes** | Alias Franks |

### 14. #8142 — Kevin Shaver

**6 visits total** (5 delivered, 1 scheduled) · **1 beyond week 5** · median gap 7 days · $450

8830 40th Avenue Southwest, Seattle, 98136
Line items: The Quick Fix — One-Month Mole Control Program ($450)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-14 | Complete | — | Cammeron Anderson |
| 2 | 2026-07-21 | Complete | — | Cammeron Anderson |
| 3 | 2026-07-28 | Complete | — | Cammeron Anderson |
| 4 | 2026-08-04 | Complete | — | Cory Ventura |
| 5 | 2026-08-11 | Complete | — | Cory Ventura |
| 6 | 2026-08-18 | Scheduled | **yes** | Cory Ventura |

### 15. #8125 — Carly Klee

**6 visits total** (5 delivered, 1 scheduled) · **1 beyond week 5** · median gap 7 days · $375

23404 253rd Avenue Southeast, Maple Valley, 98038
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-09 | Complete | — | Cammeron Anderson |
| 2 | 2026-07-16 | Complete | — | Cammeron Anderson |
| 3 | 2026-07-23 | Complete | — | Cammeron Anderson |
| 4 | 2026-07-29 | Complete | — | Cammeron Anderson |
| 5 | 2026-08-07 | Complete | — | Cammeron Anderson |
| 6 | 2026-08-14 | Scheduled | **yes** | Cory Ventura |

### 16. #8141 — Stan Salvatto

**6 visits total** (5 delivered, 1 scheduled) · **1 beyond week 5** · median gap 7 days · $450

1243 Milbanke Drive Southeast, Olympia, 98513
Line items: The Quick Fix — One-Month Mole Control Program ($450)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-13 | Complete | — | Luke LaVergne |
| 2 | 2026-07-20 | Complete | — | Luke LaVergne |
| 3 | 2026-07-30 | Complete | — | Luke LaVergne, Robert Norton |
| 4 | 2026-08-06 | Complete | — | Luke LaVergne |
| 5 | 2026-08-10 | Complete | — | Luke LaVergne |
| 6 | 2026-08-17 | Scheduled | **yes** | Luke LaVergne |

### 17. #8108 — Mike Marinella

**6 visits total** (5 delivered, 1 scheduled) · **1 beyond week 5** · median gap 7 days · $375

745 North 195th Street, Shoreline, 98133
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-07 | Complete | — | Cory Ventura |
| 2 | 2026-07-14 | Complete | — | Cory Ventura |
| 3 | 2026-07-21 | Complete | — | Alias Franks, Cory Ventura |
| 4 | 2026-07-28 | Complete | — | Alias Franks, Cory Ventura |
| 5 | 2026-08-04 | Complete | — | Alias Franks |
| 6 | 2026-08-11 | Scheduled | **yes** | Alias Franks |

### 18. #8118 — Patty Ring

**6 visits total** (5 delivered, 1 scheduled) · **1 beyond week 5** · median gap 7 days · $375

6810 162nd Street Court East, Puyallup, 98375
Line items: The Quick Fix — One-Month Mole Control Program ($450); Repeat Customer Discount ($-75)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-07 | Complete | — | Luke LaVergne |
| 2 | 2026-07-14 | Complete | — | Luke LaVergne |
| 3 | 2026-07-21 | Complete | — | Luke LaVergne |
| 4 | 2026-07-31 | Complete | — | Luke LaVergne |
| 5 | 2026-08-04 | Complete | — | Luke LaVergne |
| 6 | 2026-08-13 | Scheduled | **yes** | Robert Norton |

### 19. #8228 — Matt Vega

**6 visits total** (4 delivered, 2 scheduled) · **1 beyond week 5** · median gap 6 days · $450

16644 Southeast 235th Street, Kent, 98042
Line items: The Quick Fix — One-Month Mole Control Program ($450)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-24 | Complete | — | Cammeron Anderson |
| 2 | 2026-07-30 | Complete | — | Cammeron Anderson |
| 3 | 2026-08-07 | Complete | — | Cammeron Anderson |
| 4 | 2026-08-10 | Complete | — | Cory Ventura |
| 5 | 2026-08-17 | Scheduled | — | Tavis Alexander |
| 6 | 2026-08-21 | Scheduled | **yes** | Tavis Alexander |

### 20. #8271 — Craig Nelson

**6 visits total** (3 delivered, 3 scheduled) · **1 beyond week 5** · median gap 7 days · $300

9081 Eagle Point Loop Road Southwest, Lakewood, 98498
Line items: The Quick Fix — One-Month Mole Control Program ($450); Cash/check deposit ($-150)

| Visit | Date | Status | Beyond 5 | Technician |
|---|---|---|---|---|
| 1 | 2026-07-31 | Complete | — | Luke LaVergne |
| 2 | 2026-08-03 | Complete | — | Luke LaVergne |
| 3 | 2026-08-10 | Complete | — | Luke LaVergne |
| 4 | 2026-08-17 | Scheduled | — | Luke LaVergne |
| 5 | 2026-08-21 | Scheduled | — | Luke LaVergne |
| 6 | 2026-08-28 | Scheduled | **yes** | Luke LaVergne |

## Method

- Swept every job in a live Jobber status (`active`, `upcoming`, `today`, `late`, `on_hold`, `action_required`, `requires_invoicing`, `unscheduled`). Archived jobs are excluded: a closed Quick Fix correctly ends with nothing upcoming.
- Product classified from the line item (`quick fix`), with `total mole control` used to exclude conversions.
- "Had" counts a visit as delivered if it is marked complete **or** its date is in the past — a past visit never marked complete still consumed a week of the series.
- Median gap is the median days between consecutive visits on that job, used to confirm the series really is weekly.

Generated by `projects/tool-jobber/scripts/quickfix-overrun-audit.mjs`. Raw data: `projects/tool-jobber/data/quickfix-overrun-2026-08-11.json` and `quickfix-overrun-visits-2026-08-11.json`.