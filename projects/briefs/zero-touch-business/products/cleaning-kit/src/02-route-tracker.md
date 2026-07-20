<!--
product: Cleaning Business Starter Kit ($49)
file: 02 — Recurring Client & Route Tracker (Google Sheets build spec)
version: 1.0
date: 2026-07-19
-->

# Recurring Client & Route Tracker — Build Spec

The roster is the business. This workbook keeps every recurring client in one tab, auto-builds your Monday–Saturday route board from it, and shows you which route days earn and which ones are a car payment disguised as a schedule. Three tabs: **Clients**, **Route Grid**, **Day Summary**.

Same convention as the pricing calculator: yellow fill = input, green fill = formula output. Only the **Clients** tab gets typed into — the other two build themselves.

---

## Tab 1: `Clients` (roster — all INPUT)

One row per recurring client. Row 1 is headers, data starts row 2. Plan the ranges to row 200.

| Col | Header | Type | Validation / notes |
|-----|--------|------|--------------------|
| A | Client Name | INPUT | |
| B | Address | INPUT | Street + city is enough |
| C | Zone | INPUT | Dropdown, list of items: `North,South,East,West,Core` — rename to your own map. Zones are how you keep drive time down. |
| D | Frequency | INPUT | Dropdown, list of items: `Weekly,Biweekly,Monthly` |
| E | Rate per Visit ($) | INPUT | Number |
| F | Day Assigned | INPUT | Dropdown, list of items: `Mon,Tue,Wed,Thu,Fri,Sat` |
| G | Est. Visit Hours | INPUT | Number (e.g. 2.5) — used for day-load math |
| H | Notes | INPUT | Gate codes, pets, alarm quirks, "park in back" |
| I | Monthly Revenue ($) | OUTPUT | `=IF(E2="","",E2*SWITCH(D2,"Weekly",4.33,"Biweekly",2.17,"Monthly",1))` |

Column I uses average visits per month (52 weeks / 12 months = 4.33 weekly, 2.17 biweekly). Fill the formula down through I200.

**Rule the tab enforces by existing:** every client gets a Zone and a Day. If you can't answer "what day and what part of town," you don't have a route — you have a pile of appointments.

### Sample rows (3)

| Client Name | Address | Zone | Frequency | Rate | Day | Est. Hours | Notes | Monthly Rev |
|-------------|---------|------|-----------|------|-----|-----------|-------|-------------|
| Harmon, K. | 412 Cedar Loop, Maple Grove | North | Biweekly | $150 | Tue | 2.25 | Dog (friendly), key under mat — replace with lockbox | $325.50 |
| Bishop Dental (office) | 88 Commerce Way, Maple Grove | Core | Weekly | $175 | Thu | 2.50 | After 6pm only, alarm code in phone | $757.75 |
| Ortiz, R. | 1509 Fairfield Dr, Lakewood | South | Monthly | $220 | Fri | 3.00 | Deep-ish monthly, garage entry 4482 | $220.00 |

---

## Tab 2: `Route Grid` (all OUTPUT)

A Monday–Saturday board that fills itself from the roster. Six columns of client names, one per day, with a load line underneath the headers.

### Layout

- Row 1: day headers — A1 `Mon`, B1 `Tue`, C1 `Wed`, D1 `Thu`, E1 `Fri`, F1 `Sat`.
- Row 2: booked hours for that day (formula below).
- Rows 3+: client list for that day (spill formula in row 3 of each column).

### Formulas

**A3 (Monday client list)** — one formula, spills down. Sorted by zone so the board naturally clusters:

```
=IFERROR(SORT(FILTER(Clients!$A$2:$A$200, Clients!$F$2:$F$200=A$1),
 FILTER(Clients!$C$2:$C$200, Clients!$F$2:$F$200=A$1), TRUE), "—")
```

Copy A3 to B3, C3, D3, E3, F3 — the mixed references (`A$1` relative column, `$A$2` locked ranges) make each column pull its own day.

**A2 (Monday booked hours):**

```
=SUMIFS(Clients!$G$2:$G$200, Clients!$F$2:$F$200, A$1)
```

Copy across B2:F2. Conditional formatting on A2:F2: value greater than `7` → red fill (day is overbooked for a solo operator once you add drive time); value between `5` and `7` → green (healthy full day); below `5` → no fill (room to sell).

If you want the zone visible next to each name, use a two-column spill instead in A3:

```
=IFERROR(SORT(FILTER({Clients!$A$2:$A$200, Clients!$C$2:$C$200},
 Clients!$F$2:$F$200=A$1), 2, TRUE), "—")
```

(Then give each day two columns — Mon in A:B, Tue in C:D, etc. Pick one style and keep it.)

---

## Tab 3: `Day Summary` (all OUTPUT)

Answers one question: **what is each route day worth per month, and per hour?**

| Col | Header | Row 2 formula (Mon) |
|-----|--------|----------------------|
| A | Day | Type the list: `Mon` … `Sat` in A2:A7 |
| B | Clients on Day | `=COUNTIF(Clients!$F$2:$F$200, A2)` |
| C | Booked Hours | `=SUMIFS(Clients!$G$2:$G$200, Clients!$F$2:$F$200, A2)` |
| D | Monthly Revenue ($) | `=SUMIFS(Clients!$I$2:$I$200, Clients!$F$2:$F$200, A2)` |
| E | Revenue per Booked Hour | `=IF(C2=0,"",ROUND(D2/(C2*SWITCH(A2,A2,4.33)),2))` — simpler and better: `=IF(C2=0,"",ROUND((D2/4.33)/C2,2))` (weekly revenue on that day ÷ hours on that day) |
| F | Note | `=IF(C2=0,"open day", IF(E2<50,"weak day — tighten zone or raise rates",""))` |

Fill B2:F2 down through row 7. Total row 8: `=SUM(D2:D7)` under Monthly Revenue — that's your recurring monthly base, the number that makes this business sellable someday.

Adjust the `50` in column F to about 80% of your target hourly from the pricing calculator.

**How to read it:** a day with 5 clients and $58/booked-hour beats a day with 7 clients and $41/booked-hour. The fix for a weak day is almost never "add more stops" — it's re-zoning the scattered ones and re-pricing the old ones.
