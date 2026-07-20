<!--
product: Cleaning Business Starter Kit ($49)
file: 01 — Pricing Calculator (Google Sheets build spec)
version: 1.0
date: 2026-07-19
-->

# Pricing Calculator — Build Spec

A Google Sheets workbook that turns square footage + job details into a flat-rate quote you can say out loud on the phone, with a built-in check that stops you from taking jobs that lose money. Four tabs: **Start Here**, **Calculator**, **Rate Settings**, **Quote Log**.

Convention used throughout: **input cells** get a light yellow fill (`#FFF2CC`), **output cells** get a light green fill (`#D9EAD3`) and are never typed into. Protect the output cells (Data → Protect sheets and ranges) so a stray keystroke doesn't kill a formula.

---

## Tab 1: `Start Here`

Plain text tab, no formulas. Put this copy in merged cell A1:F20 (wrap text on):

> **How to use this calculator**
>
> 1. Go to the **Rate Settings** tab first. Set your target hourly rate, your minimum job floor, and check the production rates against your own speed. Those numbers drive everything. The defaults are sane starting points for a solo operator in a 2026 US suburban market — they are not gospel.
> 2. On the **Calculator** tab, fill in the yellow cells only: square footage, cleaning type, frequency, add-ons. The green cells do the math.
> 3. Quote the **Flat-Rate Quote** number. Never quote hourly — customers shop hourly rates, they accept flat prices.
> 4. If the **Margin Check** cell says FLOOR or LOW RATE, fix the price before you quote it. That warning exists because I watched new operators book $85 jobs that cost them $95 to run.
> 5. After each quote, copy the row into the **Quote Log** tab so you can see your close rate and average job size over time.
>
> Time yourself on your first 10 jobs and update the production rates in Rate Settings. Your real numbers beat my defaults every time.

---

## Tab 2: `Calculator`

### Layout

| Cell | Label (col A) | Cell type | Content / formula (col B) |
|------|---------------|-----------|---------------------------|
| A1 | `JOB INPUTS` (header) | — | — |
| B3 | Home square footage | **INPUT** | number, e.g. `1800` |
| B4 | Cleaning type | **INPUT** | dropdown (see validation) |
| B5 | Frequency | **INPUT** | dropdown (see validation) |
| B6 | Add-on: Inside fridge | **INPUT** | dropdown Yes/No |
| B7 | Add-on: Inside oven | **INPUT** | dropdown Yes/No |
| B8 | Add-on: Interior windows | **INPUT** | dropdown Yes/No |
| B9 | Add-on: Laundry (wash/fold 1 load) | **INPUT** | dropdown Yes/No |
| B10 | Target hourly rate ($/hr) | **INPUT** | defaults from Settings: `='Rate Settings'!B3` — overtype to override per-job |
| A12 | `QUOTE OUTPUTS` (header) | — | — |
| B13 | Estimated hours | **OUTPUT** | formula below |
| B14 | Flat-rate quote | **OUTPUT** | formula below |
| B15 | Effective hourly rate | **OUTPUT** | formula below |
| B16 | Margin check | **OUTPUT** | formula below |

### Data validation (dropdowns)

- **B4** → List from a range: `'Rate Settings'!A7:A9` (Standard, Deep, Move-Out). Reject input.
- **B5** → List from a range: `'Rate Settings'!A13:A16` (One-Time, Weekly, Biweekly, Monthly). Reject input.
- **B6:B9** → List of items: `Yes,No`. Reject input.

### Formulas

**B13 — Estimated hours** (base clean time + add-on time, rounded up to the nearest quarter hour):

```
=CEILING( (B3 / VLOOKUP(B4,'Rate Settings'!A7:B9,2,FALSE))
 + IF(B6="Yes",'Rate Settings'!B20,0)
 + IF(B7="Yes",'Rate Settings'!B21,0)
 + IF(B8="Yes",'Rate Settings'!B22,0)
 + IF(B9="Yes",'Rate Settings'!B23,0), 0.25)
```

**B14 — Flat-rate quote** (hours × rate × frequency multiplier, never below the floor, rounded up to the nearest $5):

```
=MAX( CEILING(B13 * B10 * VLOOKUP(B5,'Rate Settings'!A13:B16,2,FALSE), 5),
 'Rate Settings'!B4 )
```

The `MAX` against the floor means the sheet physically will not produce a quote below your minimum. A recurring discount can shave the rate, but never below the floor.

**B15 — Effective hourly rate** (what you actually earn per labor hour at this quote):

```
=IF(B13=0,"",ROUND(B14/B13,2))
```

**B16 — Margin check:**

```
=IF(B14<='Rate Settings'!B4,"FLOOR — this job is priced at your minimum. Fine if it's on-route, skip it if it's a drive.",
 IF(B15<B10*0.9,"LOW RATE — effective hourly is more than 10% under target. Re-check hours or raise the price.",
 "OK"))
```

Conditional formatting on B16: text contains `OK` → green fill; anything else → red fill, white bold text.

---

## Tab 3: `Rate Settings`

All cells on this tab are **INPUT** (yellow). Defaults below are realistic 2026 US suburban starting points for a solo operator — the "How to use" tab tells the buyer to replace them with their own timed numbers.

| Cell | Label (col A) | Default (col B) | Note (col C) |
|------|---------------|-----------------|--------------|
| B3 | Target hourly rate ($/hr revenue) | `60` | Solo operators: 50–75 is the workable band. This is revenue per labor hour, not your take-home. |
| B4 | Minimum job floor ($) | `130` | The least you'll roll a vehicle for. Covers drive, setup, supplies, and still pays you. |
| A6 | `PRODUCTION RATES (sq ft per hour)` | — | header row |
| A7 / B7 | Standard | `1000` | Maintenance clean of a kept-up home |
| A8 / B8 | Deep | `500` | First-time or seasonal deep clean |
| A9 / B9 | Move-Out | `400` | Empty house, inside everything |
| A12 | `FREQUENCY MULTIPLIERS` | — | header row |
| A13 / B13 | One-Time | `1.00` | |
| A14 / B14 | Weekly | `0.85` | Discount earned by route density, not generosity |
| A15 / B15 | Biweekly | `0.90` | |
| A16 / B16 | Monthly | `0.95` | Monthly homes get dirty — small discount only |
| A19 | `ADD-ON TIMES (hours)` | — | header row |
| A20 / B20 | Inside fridge | `0.5` | |
| A21 / B21 | Inside oven | `0.5` | |
| A22 / B22 | Interior windows | `0.75` | Reachable interior glass only |
| A23 / B23 | Laundry (1 load, wash/fold) | `0.5` | Active time; machine runs while you clean |

---

## Tab 4: `Quote Log`

One row per quote given. Columns:

| Col | Header | Type | Formula (row 2 shown) |
|-----|--------|------|------------------------|
| A | Date | INPUT | — |
| B | Customer | INPUT | — |
| C | Sq Ft | INPUT | — |
| D | Type | INPUT (same dropdown as Calculator B4) | — |
| E | Frequency | INPUT (same dropdown as Calculator B5) | — |
| F | Quote Given ($) | INPUT | — |
| G | Est. Hours | INPUT (copy from Calculator B13) | — |
| H | Effective $/hr | OUTPUT | `=IF(G2=0,"",ROUND(F2/G2,2))` |
| I | Won? | INPUT dropdown: `Won,Lost,Pending` | — |

Summary block at the top right (F1 area or a small header row above the table):

- **Close rate:** `=IFERROR(COUNTIF(I2:I500,"Won")/COUNTA(I2:I500),"")` — format as percent
- **Average quote:** `=IFERROR(AVERAGE(F2:F500),"")`

### Sample rows (3)

| Date | Customer | Sq Ft | Type | Frequency | Quote | Est. Hours | Eff. $/hr | Won? |
|------|----------|-------|------|-----------|-------|-----------|-----------|------|
| 2026-07-06 | Harmon, K. | 1800 | Standard | Biweekly | $150 | 2.25 | $66.67 | Won |
| 2026-07-08 | Ellis, D. | 2400 | Deep | One-Time | $315 | 5.25 | $60.00 | Won |
| 2026-07-10 | Trask, M. | 1100 | Standard | One-Time | $130 | 1.50 | $86.67 | Lost |

(That third row is the floor doing its job — a small one-time house priced at $130 minimum instead of the $90 the raw math produced. Some of those will lose. Let them.)
