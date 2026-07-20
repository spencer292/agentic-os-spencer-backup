<!--
product: Cleaning Business Starter Kit ($49)
file: 04 — Job Costing Sheet (Google Sheets build spec)
version: 1.0
date: 2026-07-19
-->

# Job Costing Sheet — Build Spec

Most operators know their quoted rate. Almost none know their **true hourly** — what a job pays after you count the drive there, the drive to the next stop, and the supplies it burned. This sheet computes it per job and then ranks your clients by it, so you know exactly who to keep, who to re-price, and who to hand to a competitor you don't like. Two tabs: **Job Log** and **Client Ranking**.

Yellow fill = input, green fill = output. Ranges planned to row 1000.

---

## Tab 1: `Job Log`

One row per completed job. Log it the same day — drive minutes evaporate from memory by morning.

| Col | Header | Type | Notes / formula (row 2 shown) |
|-----|--------|------|-------------------------------|
| A | Date | INPUT | |
| B | Client | INPUT | Use the exact same spelling every time — the ranking tab groups on this text. Best move: dropdown from your Route Tracker roster (`Clients!$A$2:$A$200` if in the same workbook). |
| C | Revenue ($) | INPUT | What the job actually paid |
| D | On-Site Minutes | INPUT | Door to door |
| E | Drive Minutes | INPUT | Your share of drive for this job — the leg TO this job (plus the leg home if it's the last stop) |
| F | Supplies Cost ($) | INPUT | Direct consumables; use a flat per-job estimate (e.g. $4–6) if you don't itemize |
| G | Total Minutes | OUTPUT | `=IF(B2="","",D2+E2)` |
| H | Total Hours | OUTPUT | `=IF(B2="","",ROUND(G2/60,2))` |
| I | Net Revenue ($) | OUTPUT | `=IF(B2="","",C2-F2)` |
| J | True Hourly ($/hr) | OUTPUT | `=IF(OR(B2="",G2=0),"",ROUND(I2/H2,2))` |

Fill G2:J2 down through row 1000. Freeze row 1, filter on headers.

Conditional formatting on column J (apply to J2:J1000):
- Less than `40` → red fill. Below a real-wage line once self-employment tax and overhead bite.
- Between `40` and `55` → yellow fill. Survivable, not where you want to live.
- Greater than `55` → green fill.

Tune those bands to your market — the point is the color pattern, not my thresholds.

### Sample rows (4)

| Date | Client | Revenue | On-Site Min | Drive Min | Supplies | Total Min | Total Hrs | Net Rev | True $/hr |
|------|--------|---------|-------------|-----------|----------|-----------|-----------|---------|-----------|
| 2026-07-07 | Harmon, K. | $150.00 | 130 | 15 | $5.00 | 145 | 2.42 | $145.00 | $59.92 |
| 2026-07-07 | Ortiz, R. | $220.00 | 175 | 40 | $8.00 | 215 | 3.58 | $212.00 | $59.22 |
| 2026-07-09 | Trask, M. | $130.00 | 95 | 55 | $5.00 | 150 | 2.50 | $125.00 | $50.00 |
| 2026-07-10 | Bishop Dental | $175.00 | 140 | 10 | $6.00 | 150 | 2.50 | $169.00 | $67.60 |

Read those four rows: Trask pays a fine rate on paper ($130 for ~1.5 hours of cleaning) but the 55-minute drive drags true hourly to $50. Bishop Dental pays less per visit than Ortiz but earns more per hour because it's 10 minutes away. **Drive time is the silent rate cut.**

---

## Tab 2: `Client Ranking` (all OUTPUT)

Groups the log by client and sorts best-to-worst by true hourly. One QUERY does the heavy lifting.

**A1:**

```
=QUERY(Job Log range as follows)
```

Exact formula:

```
=SORT(
 QUERY('Job Log'!$A$2:$J$1000,
  "select B, count(B), sum(C), sum(F), sum(G), sum(I)
   where B is not null
   group by B
   label B 'Client', count(B) 'Jobs', sum(C) 'Revenue', sum(F) 'Supplies', sum(G) 'Total Min', sum(I) 'Net Rev'",
  1),
 0, TRUE)
```

Then add computed columns to the right of the spill (assuming the QUERY lands in A1:F and data starts row 2):

| Col | Header (type in row 1) | Row 2 formula |
|-----|------------------------|---------------|
| G | Total Hours | `=IF($A2="","",ROUND(E2/60,2))` |
| H | True Hourly ($/hr) | `=IF(OR($A2="",E2=0),"",ROUND(F2/G2,2))` |
| I | Verdict | `=IF(H2="","", IF(H2>=55,"KEEP — protect this slot", IF(H2>=40,"RE-PRICE at next renewal","RE-PRICE OR RELEASE")))` |

Fill G2:I2 down ~50 rows. To get the table actually sorted by true hourly (QUERY can't sort on a column it didn't compute), sort the finished block with a helper view, or replace the whole thing with this single-formula version once the concept is comfortable:

```
=SORT(
 {QUERY('Job Log'!$A$2:$J$1000,
   "select B, count(B), sum(C), sum(I), sum(G) where B is not null group by B label B '', count(B) '', sum(C) '', sum(I) '', sum(G) ''", 0),
  ARRAYFORMULA(ROUND(
   QUERY('Job Log'!$A$2:$J$1000,"select sum(I) where B is not null group by B label sum(I) ''",0)
   / (QUERY('Job Log'!$A$2:$J$1000,"select sum(G) where B is not null group by B label sum(G) ''",0)/60), 2))},
 6, FALSE)
```

Headers typed manually in row 1: `Client | Jobs | Revenue | Net Rev | Total Min | True $/hr`. The simpler two-step build (QUERY + helper columns) is the one to ship in the template — it's easier for buyers to repair.

Same conditional-formatting bands on the True Hourly column as the Job Log tab.

### What to do with the ranking (put this note on the tab)

> Review monthly, act quarterly. Bottom client gets one of three moves: **re-zone** (move them to a day when you're already nearby), **re-price** (a $20 bump fixes most of these), or **release**. You are not obligated to keep a client whose real pay is under your floor — that slot is inventory, and inventory should earn.
