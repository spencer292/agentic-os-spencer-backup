<!--
product: Cleaning Business Starter Kit ($49)
file: 03 — Income & Expense Tracker (Google Sheets build spec)
version: 1.0
date: 2026-07-19
-->

# Income & Expense Tracker — Build Spec

One entry tab, everything else computes. Categories map to the common US Schedule C-style deduction buckets so tax time is a filter, not an archaeology dig. Four tabs: **Entries**, **Categories**, **Monthly P&L**, **Year Dashboard**.

Put this note in a frozen header cell on the Entries tab, visible at all times:

> Categories below are **common deduction categories for a US sole proprietor — confirm everything with your tax pro.** This sheet organizes your numbers; it is not tax advice.

Yellow fill = input, green fill = formula output. Data rows planned to row 1000.

---

## Tab 1: `Entries` (all INPUT except G)

Every dollar in or out gets one row, dated. Headers row 1, data from row 2.

| Col | Header | Type | Validation / notes |
|-----|--------|------|--------------------|
| A | Date | INPUT | Date format; validation: is valid date |
| B | Type | INPUT | Dropdown, list of items: `Income,Expense` |
| C | Category | INPUT | Dropdown, list from range: `Categories!$A$2:$A$30` |
| D | Description | INPUT | "Harmon biweekly clean", "Costco — microfiber + Barkeeper's" |
| E | Amount ($) | INPUT | Always positive; column B carries the sign logic |
| F | Payment Method | INPUT | Dropdown, list of items: `Cash,Check,Card,Zelle,Venmo,Square,Other` |
| G | Month | OUTPUT | `=IF(A2="","",EOMONTH(A2,0))` — fill down; format as `MMM YYYY`. This is the key the P&L pivots on. |
| H | Miles (if vehicle row) | INPUT | Only for `Vehicle / Mileage` rows — log **miles driven**, not dollars, in this column (leave E blank or 0 for pure mileage rows) |

Optional but recommended: View → Freeze row 1, and a filter on the header row.

### Sample rows (4)

| Date | Type | Category | Description | Amount | Method | Month | Miles |
|------|------|----------|-------------|--------|--------|-------|-------|
| 2026-07-02 | Income | Cleaning revenue | Harmon — biweekly clean | $150.00 | Zelle | Jul 2026 | |
| 2026-07-02 | Expense | Supplies | Costco — microfiber, degreaser, bags | $64.38 | Card | Jul 2026 | |
| 2026-07-03 | Expense | Vehicle / Mileage | Route miles Mon–Fri | $0.00 | — | Jul 2026 | 118 |
| 2026-07-05 | Expense | Advertising | Google Local Services ads | $75.00 | Card | Jul 2026 | |

---

## Tab 2: `Categories` (INPUT, set up once)

Column A holds the master category list (this range feeds the Entries dropdown). Column B marks type. Column C is a plain-language note about what goes in it.

| A: Category | B: Type | C: What goes here |
|-------------|---------|-------------------|
| Cleaning revenue | Income | All service income |
| Product sales | Income | If you sell anything (rare, fine to ignore) |
| Other income | Income | Referral fees, rebates |
| Supplies | Expense | Chemicals, cloths, vacuum bags, mops — consumables |
| Equipment | Expense | Vacuums, machines; big purchases may be depreciated — ask your tax pro |
| Vehicle / Mileage | Expense | Log MILES in col H; dollar value computed at year level |
| Insurance | Expense | General liability, bonding |
| Advertising | Expense | Google/Facebook ads, flyers, car magnets, website |
| Phone & Internet | Expense | Business-use share |
| Software & Subscriptions | Expense | Scheduling app, accounting, this kit's future competitors |
| Licenses & Permits | Expense | Business license, city registrations |
| Legal & Professional | Expense | Tax prep, LLC filing help |
| Contract Labor | Expense | 1099 help — talk to your tax pro before hiring |
| Bank & Processing Fees | Expense | Square/Stripe fees, account fees |
| Uniforms & Laundry | Expense | Branded shirts, shoe covers |
| Other expense | Expense | Anything that truly fits nowhere — keep this small |

Also on this tab:

| Cell | Label | Default | Note |
|------|-------|---------|------|
| F2 | IRS standard mileage rate ($/mile) | `0.70` | **Update yearly** — check the current IRS standard mileage rate each January and type it here. Recent years have been around $0.65–0.70/mile. |

---

## Tab 3: `Monthly P&L` (all OUTPUT)

Rows = categories, columns = months. Build the month header row with dates so SUMIFS can match.

### Layout

- A1: `Category`. B1:M1: the 12 month keys — B1 `=DATE(2026,1,31)`, C1 `=EOMONTH(B1,1)` filled across to M1. Format row 1 as `MMM`.
- A2: `INCOME` (section header). A3:A5: pull income categories: `=FILTER(Categories!A2:A30, Categories!B2:B30="Income")`
- A6: `Total Income`
- A8: `EXPENSES` (section header). A9 spill: `=FILTER(Categories!A2:A30, Categories!B2:B30="Expense")`
- Below the expense block: `Total Expenses`, then `Net Profit`, then `Miles Driven` and `Mileage Deduction (est.)`.

### Formulas (B column shown; fill across B:M)

**B3 — category × month cell** (works for every category row; fill through the whole grid):

```
=SUMIFS(Entries!$E$2:$E$1000, Entries!$C$2:$C$1000, $A3, Entries!$G$2:$G$1000, B$1)
```

**B6 — Total Income:** `=SUM(B3:B5)` (adjust range to your income rows)

**Total Expenses row:** `=SUM(B9:B24)` (adjust to your expense rows)

**Net Profit row:** `=B6 - B25` (Total Income minus Total Expenses)

**Miles Driven row:**

```
=SUMIFS(Entries!$H$2:$H$1000, Entries!$G$2:$G$1000, B$1)
```

**Mileage Deduction (est.) row:**

```
=ROUND(SUMIFS(Entries!$H$2:$H$1000, Entries!$G$2:$G$1000, B$1) * Categories!$F$2, 2)
```

Note under the table: *Mileage deduction shown for planning only — it is not included in Net Profit above because it's a deduction, not a cash expense. Your tax pro reconciles this at filing.*

Conditional formatting on the Net Profit row: value < 0 → red text.

---

## Tab 4: `Year Dashboard` (all OUTPUT)

Big-picture block, top-left of the tab:

| Cell | Label | Formula |
|------|-------|---------|
| B2 | YTD Revenue | `=SUMIFS(Entries!$E$2:$E$1000, Entries!$B$2:$B$1000,"Income")` |
| B3 | YTD Expenses | `=SUMIFS(Entries!$E$2:$E$1000, Entries!$B$2:$B$1000,"Expense")` |
| B4 | YTD Net Profit | `=B2-B3` |
| B5 | Profit Margin | `=IF(B2=0,"",B4/B2)` — format percent |
| B6 | YTD Miles | `=SUM(Entries!$H$2:$H$1000)` |
| B7 | Est. Mileage Deduction | `=ROUND(B6*Categories!$F$2,2)` |
| B8 | Best Month (profit) | `=IFERROR(TEXT(INDEX('Monthly P&L'!$B$1:$M$1, MATCH(MAX('Monthly P&L'!$B$27:$M$27), 'Monthly P&L'!$B$27:$M$27, 0)),"MMM"),"")` — point row 27 at your Net Profit row |
| B9 | Tax set-aside (25% of net) | `=ROUND(MAX(B4,0)*0.25,2)` — label it: *rough set-aside so quarterly estimates don't ambush you; your tax pro sets the real number* |

**Top expense categories block** (answers "where is the money going"):

- D2: `=SORT(QUERY(Entries!$C$2:$E$1000, "select C, sum(E) where B='Expense' group by C label sum(E) ''", 0), 2, FALSE)`

**Chart:** insert a column chart over the Monthly P&L Net Profit row (months on the X axis). One glance tells you whether the business is growing or you're just busy.

**Habit that makes this work:** enter every transaction within 48 hours. Ten minutes on Sunday beats four miserable days in April.
