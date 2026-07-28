# build-xlsx.py — Lawn Care Business Starter Kit workbook generator
# Uses the shared OOXML engine in ../_xlsx_engine.py. Idempotent: re-running
# regenerates all 4 deliverables.
#
# Trade model note: lawn care prices off TURF AREA and MOWING TIME, and the whole
# economics of the business is ROUTE DENSITY — ten lawns on one street beats twenty
# across town. The Route Tracker exists to make that visible in dollars per hour.
import os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _xlsx_engine import S, N, F, D, write_xlsx, outdir  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = outdir(HERE)

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


# ================================================================ WB 1: Pricing Calculator
def build_pricing():
    start_text = (
        "How to use this calculator\n\n"
        "1. Go to the Rate Settings tab first. Set your target hourly rate, your minimum stop price, and check "
        "the mowing production rate against your own speed with your own mower. Those numbers drive everything. "
        "The defaults are sane starting points for a solo operator in a 2026 US suburban market — not gospel.\n\n"
        "2. On the Calculator tab, fill in the yellow cells only: turf area, obstacle level, service type, "
        "frequency. The green cells do the math.\n\n"
        "3. Quote the Per-Visit Price. Never quote hourly — customers shop hourly rates, they accept flat "
        "prices, and you're going to get faster at this every month.\n\n"
        "4. If the Margin Check cell says FLOOR or LOW RATE, fix the price before you quote it.\n\n"
        "5. Log every quote on the Quote Log tab to see your close rate and average stop value.\n\n"
        "The number new operators get wrong is TRIM TIME. A small lawn with a fence, a swing set, six trees, "
        "and a flower bed border takes longer than a big open lawn. That's what the obstacle factor is for — "
        "use it honestly and you'll stop losing money on 'small' yards.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F22"],
             "widths": {c: 18 for c in "ABCDEF"}}

    calc_cells = [
        S("A1", "PROPERTY INPUTS", "header"), S("B1", "", "header"),
        S("A3", "Turf area to mow (sq ft)", "label"), N("B3", 8000, "input_int"),
        S("C3", "Turf only — subtract the house, drive, beds, and pool. A quarter-acre lot is rarely more "
                "than 8,000 sq ft of actual grass.", "note"),
        S("A4", "Obstacle level", "label"), S("B4", "Average", "input"),
        S("C4", "Trees, beds, fences, play sets, and tight gates. This is the factor that makes small yards "
                "unprofitable when you ignore it.", "note"),
        S("A5", "Service type", "label"), S("B5", "Mow / Trim / Edge / Blow", "input"),
        S("A6", "Frequency", "label"), S("B6", "Weekly", "input"),
        S("A7", "Gate access (walk-behind only)?", "label"), S("B7", "No", "input"),
        S("C7", "If the rider can't fit, production drops to the walk-behind rate", "note"),
        S("A8", "Drive time from previous stop (min)", "label"), N("B8", 8, "input_int"),
        S("C8", "The whole business is route density — this is where it shows up", "note"),
        S("A9", "Target hourly rate ($/hr)", "label"),
        F("B9", "'Rate Settings'!B3", "input_money"),

        S("A11", "QUOTE OUTPUTS", "header"), S("B11", "", "header"),
        S("A12", "Mowing minutes", "label"),
        F("B12", "ROUND((B3/VLOOKUP(IF(B7=\"Yes\",\"Walk-behind\",\"Standard\"),"
                 "'Rate Settings'!A19:B20,2,FALSE))*60*VLOOKUP(B4,'Rate Settings'!A13:B15,2,FALSE),1)",
          "output_num"),
        S("A13", "Total on-site minutes", "label"),
        F("B13", "ROUND(B12*VLOOKUP(B5,'Rate Settings'!A7:B10,2,FALSE)+'Rate Settings'!B4,1)", "output_num"),
        S("C13", "Includes unload/load time from Rate Settings", "note"),
        S("A14", "Per-visit price", "label"),
        F("B14", "MAX(CEILING((B13/60)*B9*VLOOKUP(B6,'Rate Settings'!A24:B27,2,FALSE),5),'Rate Settings'!B5)",
          "output_money"),
        S("A15", "Effective $/hr (incl. drive)", "label"),
        F("B15", "IF((B13+B8)=0,\"\",ROUND(B14/((B13+B8)/60),2))", "output_money"),
        S("C15", "The honest number — drive time is unpaid time, and it's why density is everything", "note"),
        S("A16", "Monthly (avg 4.33 visits)", "label"),
        F("B16", "IF(B6=\"Weekly\",ROUND(B14*4.33,2),IF(B6=\"Biweekly\",ROUND(B14*2.17,2),B14))",
          "output_money"),
        S("A17", "Season estimate", "label"),
        F("B17", "IF(B6=\"Weekly\",ROUND(B14*'Rate Settings'!B30,2),"
                 "IF(B6=\"Biweekly\",ROUND(B14*'Rate Settings'!B30/2,2),B14))", "output_money"),
        S("A18", "Margin check", "label"),
        F("B18", "IF(B14<='Rate Settings'!B5,\"FLOOR — priced at your minimum stop. Fine if it's on-route, "
                 "skip it if it's a drive.\",IF(B15<B9*0.9,\"LOW RATE — effective hourly is more than 10% under "
                 "target once drive time is counted. Raise the price or don't take the stop.\",\"OK\"))",
          "output_wrap"),
    ]
    calc = {"name": "Calculator", "cells": calc_cells,
            "widths": {"A": 36, "B": 26, "C": 58},
            "merges": ["A1:B1", "A11:B11"],
            "validations": [
                {"sqref": "B4", "type": "list", "f1": "'Rate Settings'!$A$13:$A$15"},
                {"sqref": "B5", "type": "list", "f1": "'Rate Settings'!$A$7:$A$10"},
                {"sqref": "B6", "type": "list", "f1": "'Rate Settings'!$A$24:$A$27"},
                {"sqref": "B7", "type": "list", "f1": '"Yes,No"'},
            ],
            "cf": [{"sqref": "B18", "rules": [
                {"type": "containsText", "text": "FLOOR", "dxf": 1},
                {"type": "containsText", "text": "LOW RATE", "dxf": 1},
                {"type": "containsText", "text": "OK", "dxf": 0},
            ]}]}

    rs_cells = [
        S("A1", "RATE SETTINGS — all yellow, all yours", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Target hourly rate ($/hr revenue)", "label"), N("B3", 70, "input_money"),
        S("C3", "Solo operators: 55-90 is the workable band. This is revenue per on-site hour, not take-home.", "note"),
        S("A4", "Unload / load time per stop (min)", "label"), N("B4", 5, "input_int"),
        S("C4", "Ramps down, ramps up, every single stop. Twenty stops a week is over an hour of unpaid time "
                "if you don't bill it.", "note"),
        S("A5", "Minimum stop price ($)", "label"), N("B5", 45, "input_money"),
        S("C5", "The least you'll drop a ramp for. Below this, the stop costs you money no matter how small "
                "the yard is.", "note"),

        S("A6", "SERVICE MULTIPLIERS (x mowing time)", "header"), S("B6", "", "header"), S("C6", "", "header"),
        S("A7", "Mow / Trim / Edge / Blow", "label"), N("B7", 1.55, "input_num"),
        S("C7", "The full standard visit — trimming and edging are roughly half again the mow time", "note"),
        S("A8", "Mow / Trim / Blow (no edging)", "label"), N("B8", 1.35, "input_num"),
        S("A9", "Mow only", "label"), N("B9", 1.00, "input_num"),
        S("A10", "Full service + bed maintenance", "label"), N("B10", 2.10, "input_num"),

        S("A12", "OBSTACLE FACTORS", "header"), S("B12", "", "header"), S("C12", "", "header"),
        S("A13", "Open", "label"), N("B13", 0.85, "input_num"),
        S("C13", "Wide open turf, few trees, no fence, straight passes", "note"),
        S("A14", "Average", "label"), N("B14", 1.00, "input_num"),
        S("A15", "Heavy", "label"), N("B15", 1.35, "input_num"),
        S("C15", "Fenced, many trees and beds, play equipment, tight corners. Price this honestly — it is the "
                 "single most common reason a route is busy and broke.", "note"),

        S("A18", "MOWING PRODUCTION (sq ft per hour)", "header"), S("B18", "", "header"), S("C18", "", "header"),
        S("A19", "Standard", "label"), N("B19", 32000, "input_int"),
        S("C19", "A 48\" stand-on or rider on open residential turf", "note"),
        S("A20", "Walk-behind", "label"), N("B20", 20000, "input_int"),
        S("C20", "36\" walk-behind, or any yard where the gate forces the small mower", "note"),

        S("A23", "FREQUENCY MULTIPLIERS", "header"), S("B23", "", "header"), S("C23", "", "header"),
        S("A24", "Weekly", "label"), N("B24", 1.00, "input_num"),
        S("C24", "The baseline. Weekly clients are the route you're actually building.", "note"),
        S("A25", "Biweekly", "label"), N("B25", 1.30, "input_num"),
        S("C25", "Costs MORE per visit, not less — double the growth, double the mess, same drive.", "note"),
        S("A26", "Monthly", "label"), N("B26", 1.60, "input_num"),
        S("A27", "One-Time", "label"), N("B27", 1.85, "input_num"),
        S("C27", "Overgrown one-offs are usually two cuts of work. Price them like it or decline them.", "note"),

        S("A29", "SEASON", "header"), S("B29", "", "header"), S("C29", "", "header"),
        S("A30", "Mowing weeks per season", "label"), N("B30", 30, "input_int"),
        S("C30", "Varies hugely by region — 26 in the north, 40+ in the south. Set yours.", "note"),
    ]
    rs = {"name": "Rate Settings", "cells": rs_cells,
          "widths": {"A": 34, "B": 12, "C": 62},
          "merges": ["A1:C1", "A6:C6", "A12:C12", "A18:C18", "A23:C23", "A29:C29"]}

    ql_cells = [
        S("A1", "Date", "header"), S("B1", "Customer", "header"), S("C1", "Turf Sq Ft", "header"),
        S("D1", "Obstacles", "header"), S("E1", "Frequency", "header"), S("F1", "Price/Visit ($)", "header"),
        S("G1", "On-site Min", "header"), S("H1", "Effective $/hr", "header"), S("I1", "Won?", "header"),
        S("K1", "Close rate", "label"),
        F("L1", "IFERROR(COUNTIF(I2:I500,\"Won\")/COUNTA(I2:I500),\"\")", "output_pct"),
        S("K2", "Average stop", "label"),
        F("L2", "IFERROR(AVERAGE(F2:F500),\"\")", "output_money"),
        S("K3", "Average $/hr", "label"),
        F("L3", "IFERROR(AVERAGE(H2:H500),\"\")", "output_money"),

        D("A2", "2026-04-14"), S("B2", "Okafor, D.", "input"), N("C2", 8000, "input_int"),
        S("D2", "Average", "input"), S("E2", "Weekly", "input"), N("F2", 55, "input_money"),
        N("G2", 34, "input_int"), S("I2", "Won", "input"),
        D("A3", "2026-04-16"), S("B3", "Ruiz, M.", "input"), N("C3", 14000, "input_int"),
        S("D3", "Open", "input"), S("E3", "Weekly", "input"), N("F3", 65, "input_money"),
        N("G3", 41, "input_int"), S("I3", "Won", "input"),
        D("A4", "2026-04-19"), S("B4", "Bell, S.", "input"), N("C4", 5000, "input_int"),
        S("D4", "Heavy", "input"), S("E4", "Biweekly", "input"), N("F4", 60, "input_money"),
        N("G4", 38, "input_int"), S("I4", "Lost", "input"),
    ]
    for r in range(2, 501):
        ql_cells.append(F("H%d" % r, "IF(G%d=0,\"\",ROUND(F%d/(G%d/60),2))" % (r, r, r), "output_money"))
    ql = {"name": "Quote Log", "cells": ql_cells, "freeze": True,
          "widths": {"A": 12, "B": 20, "C": 12, "D": 11, "E": 11, "F": 14, "G": 12, "H": 13, "I": 10,
                     "K": 14, "L": 12},
          "autofilter": "A1:I500",
          "validations": [
              {"sqref": "D2:D500", "type": "list", "f1": "'Rate Settings'!$A$13:$A$15"},
              {"sqref": "E2:E500", "type": "list", "f1": "'Rate Settings'!$A$24:$A$27"},
              {"sqref": "I2:I500", "type": "list", "f1": '"Won,Lost,Pending"'},
          ]}
    write_xlsx(os.path.join(OUT, "route-ready-lawn-pricing-calculator.xlsx"), [start, calc, rs, ql])


# ================================================================ WB 2: Route Tracker
def build_route():
    start_text = (
        "Recurring Client & Route Tracker — how to use\n\n"
        "The route IS the business. This workbook keeps every recurring client in one tab and shows you which "
        "route days earn and which ones are a truck payment disguised as a schedule.\n\n"
        "Clients tab: one row per recurring client. Set their service day, price, and on-site minutes.\n\n"
        "Route Days tab: totals each day automatically — stops, revenue, hours, and revenue per hour. A day "
        "under your target hourly rate is a day you're subsidizing with the good days.\n\n"
        "Density tab: the number that decides whether this business works. Drive time between stops is unpaid, "
        "and it is the difference between a $70/hr route and a $40/hr route with the same customers.\n\n"
        "Rule of thumb: if a prospect is more than 10 minutes off your existing route for that day, they need "
        "to pay a premium or wait until you have neighbors near them. Saying no to scattered work is how you "
        "build a tight route.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F20"],
             "widths": {c: 18 for c in "ABCDEF"}}

    cl_cells = [
        S("A1", "Client", "header"), S("B1", "Address", "header"), S("C1", "Phone", "header"),
        S("D1", "Service Day", "header"), S("E1", "Frequency", "header"), S("F1", "Price/Visit ($)", "header"),
        S("G1", "On-site Min", "header"), S("H1", "Drive Min", "header"), S("I1", "$/hr", "header"),
        S("J1", "Billing", "header"), S("K1", "Status", "header"), S("L1", "Notes", "header"),

        S("A2", "Okafor, D.", "input"), S("B2", "12 Larkspur Ln", "input"), S("C2", "555-0112", "input"),
        S("D2", "Monday", "input"), S("E2", "Weekly", "input"), N("F2", 55, "input_money"),
        N("G2", 34, "input_int"), N("H2", 6, "input_int"), S("J2", "Monthly", "input"),
        S("K2", "Active", "input"), S("L2", "Invisible fence marked — see walkthrough form", "input"),
        S("A3", "Ruiz, M.", "input"), S("B3", "28 Larkspur Ln", "input"), S("C3", "555-0128", "input"),
        S("D3", "Monday", "input"), S("E3", "Weekly", "input"), N("F3", 65, "input_money"),
        N("G3", 41, "input_int"), N("H3", 2, "input_int"), S("J3", "Monthly", "input"),
        S("K3", "Active", "input"), S("L3", "Two doors down from Okafor — this is what density looks like", "input"),
        S("A4", "Bell, S.", "input"), S("B4", "903 Highfield Rd", "input"), S("C4", "555-0193", "input"),
        S("D4", "Tuesday", "input"), S("E4", "Biweekly", "input"), N("F4", 60, "input_money"),
        N("G4", 38, "input_int"), N("H4", 18, "input_int"), S("J4", "Per visit", "input"),
        S("K4", "Active", "input"), S("L4", "18 min off route — first stop that day or it doesn't pay", "input"),
    ]
    for r in range(2, 301):
        cl_cells.append(F("I%d" % r, "IF(OR(G%d=\"\",(G%d+H%d)=0),\"\",ROUND(F%d/((G%d+H%d)/60),2))"
                          % (r, r, r, r, r, r), "output_money"))
    clients = {"name": "Clients", "cells": cl_cells, "freeze": True,
               "widths": {"A": 20, "B": 24, "C": 12, "D": 13, "E": 11, "F": 14, "G": 12, "H": 10,
                          "I": 10, "J": 11, "K": 10, "L": 46},
               "autofilter": "A1:L300",
               "validations": [
                   {"sqref": "D2:D300", "type": "list", "f1": '"%s"' % ",".join(DAYS)},
                   {"sqref": "E2:E300", "type": "list", "f1": '"Weekly,Biweekly,Monthly"'},
                   {"sqref": "J2:J300", "type": "list", "f1": '"Monthly,Per visit,Seasonal"'},
                   {"sqref": "K2:K300", "type": "list", "f1": '"Active,Paused,Cancelled"'},
               ],
               "cf": [{"sqref": "I2:I300", "rules": [
                   {"type": "cellIs", "op": "lessThan", "formulas": ["50"], "dxf": 1},
                   {"type": "cellIs", "op": "greaterThanOrEqual", "formulas": ["70"], "dxf": 0},
               ]}]}

    rd_cells = [
        S("A1", "ROUTE DAY BOARD", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("D1", "", "header"), S("E1", "", "header"), S("F1", "", "header"),
        S("A2", "Day", "label"), S("B2", "Active Stops", "label"), S("C2", "Revenue/Visit", "label"),
        S("D2", "On-site Hrs", "label"), S("E2", "Total Hrs (incl drive)", "label"), S("F2", "$/hr", "label"),
    ]
    for i, day in enumerate(DAYS):
        r = 3 + i
        rd_cells.append(S("A%d" % r, day, "label"))
        rd_cells.append(F("B%d" % r, "COUNTIFS(Clients!D2:D300,A%d,Clients!K2:K300,\"Active\")" % r, "output"))
        rd_cells.append(F("C%d" % r, "SUMIFS(Clients!F2:F300,Clients!D2:D300,A%d,Clients!K2:K300,\"Active\")" % r,
                          "output_money"))
        rd_cells.append(F("D%d" % r, "ROUND(SUMIFS(Clients!G2:G300,Clients!D2:D300,A%d,"
                                     "Clients!K2:K300,\"Active\")/60,2)" % r, "output_num"))
        rd_cells.append(F("E%d" % r, "ROUND((SUMIFS(Clients!G2:G300,Clients!D2:D300,A%d,Clients!K2:K300,\"Active\")"
                                     "+SUMIFS(Clients!H2:H300,Clients!D2:D300,A%d,Clients!K2:K300,\"Active\"))/60,2)"
                          % (r, r), "output_num"))
        rd_cells.append(F("F%d" % r, "IF(E%d=0,\"\",ROUND(C%d/E%d,2))" % (r, r, r), "output_money"))
    rd_cells += [
        S("A10", "TOTALS", "label"),
        F("B10", "SUM(B3:B8)", "output"), F("C10", "SUM(C3:C8)", "output_money"),
        F("D10", "SUM(D3:D8)", "output_num"), F("E10", "SUM(E3:E8)", "output_num"),
        F("F10", "IF(E10=0,\"\",ROUND(C10/E10,2))", "output_money"),
        S("A12", "Weekly revenue (weekly clients)", "label"),
        F("B12", "SUMIFS(Clients!F2:F300,Clients!E2:E300,\"Weekly\",Clients!K2:K300,\"Active\")", "output_money"),
        S("A13", "Monthly recurring estimate", "label"),
        F("B13", "ROUND(SUMIFS(Clients!F2:F300,Clients!E2:E300,\"Weekly\",Clients!K2:K300,\"Active\")*4.33"
                 "+SUMIFS(Clients!F2:F300,Clients!E2:E300,\"Biweekly\",Clients!K2:K300,\"Active\")*2.17"
                 "+SUMIFS(Clients!F2:F300,Clients!E2:E300,\"Monthly\",Clients!K2:K300,\"Active\"),2)",
          "output_money"),
        S("A15", "Any day showing under $50/hr is being carried by your good days. Either raise those prices, "
                 "tighten the stops, or move them to a day where they're on the way.", "note"),
    ]
    rd = {"name": "Route Days", "cells": rd_cells,
          "widths": {"A": 22, "B": 14, "C": 16, "D": 14, "E": 21, "F": 12},
          "merges": ["A1:F1", "A15:F15"],
          "cf": [{"sqref": "F3:F8", "rules": [
              {"type": "cellIs", "op": "lessThan", "formulas": ["50"], "dxf": 1},
              {"type": "cellIs", "op": "greaterThanOrEqual", "formulas": ["70"], "dxf": 0},
          ]}]}

    ds_cells = [
        S("A1", "ROUTE DENSITY — the number that decides this business", "header"),
        S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Active clients", "label"),
        F("B3", "COUNTIF(Clients!K2:K300,\"Active\")", "output"),
        S("A4", "Total on-site hours per week", "label"),
        F("B4", "ROUND(SUMIF(Clients!K2:K300,\"Active\",Clients!G2:G300)/60,2)", "output_num"),
        S("A5", "Total drive hours per week", "label"),
        F("B5", "ROUND(SUMIF(Clients!K2:K300,\"Active\",Clients!H2:H300)/60,2)", "output_num"),
        S("A6", "Drive time as % of the day", "label"),
        F("B6", "IF((B4+B5)=0,\"\",B5/(B4+B5))", "output_pct"),
        S("C6", "Under 15% is a tight route. Over 25% means you're being paid to drive, which nobody is.", "note"),
        S("A7", "Average drive between stops (min)", "label"),
        F("B7", "IFERROR(ROUND(SUMIF(Clients!K2:K300,\"Active\",Clients!H2:H300)/B3,1),\"\")", "output_num"),
        S("A8", "Average stop value", "label"),
        F("B8", "IFERROR(ROUND(SUMIF(Clients!K2:K300,\"Active\",Clients!F2:F300)/B3,2),\"\")", "output_money"),
        S("A9", "Blended $/hr (incl. drive)", "label"),
        F("B9", "IF((B4+B5)=0,\"\",ROUND(SUMIF(Clients!K2:K300,\"Active\",Clients!F2:F300)/(B4+B5),2))",
          "output_money"),

        S("A11", "WHAT TO DO WITH THIS", "header"), S("B11", "", "header"), S("C11", "", "header"),
        S("A12", "If drive time is over 25%: stop taking scattered work. Fill in around the clients you already "
                 "have — door hangers on the same street, a neighbor discount, and a polite 'not yet' to anyone "
                 "across town. Density is worth more than the discount costs you.", "note"),
        S("A15", "If blended $/hr is under your target: it is almost never the mowing that's slow. It's drive "
                 "time, trim time on obstacle-heavy yards, and stops priced years ago that never got raised. "
                 "Raise prices annually — every year you don't is a pay cut.", "note"),
    ]
    ds = {"name": "Density", "cells": ds_cells,
          "widths": {"A": 34, "B": 16, "C": 54},
          "merges": ["A1:C1", "A11:C11", "A12:C14", "A15:C17"]}

    write_xlsx(os.path.join(OUT, "route-ready-lawn-route-tracker.xlsx"), [start, clients, rd, ds])


# ================================================================ WB 3: Income & Expense Tracker
def build_income():
    start_text = (
        "Income & Expense Tracker — how to use\n\n"
        "One row per transaction. Money in on the Income tab, money out on the Expenses tab, and the Summary "
        "tab totals it by month and by category.\n\n"
        "Do this weekly, not at tax time. Fifteen minutes on a Friday beats a lost weekend in April, and the "
        "expenses you forget are the deductions you donate to the IRS.\n\n"
        "The categories are set up for this trade. Blades, parts, and fuel are constant; equipment repair is "
        "the one that ambushes people mid-season. Change them to match your accountant's chart of accounts "
        "if you have one.\n\n"
        "This is a bookkeeping aid, not tax advice. Talk to a CPA about your situation.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F16"],
             "widths": {c: 18 for c in "ABCDEF"}}

    inc_cells = [
        S("A1", "Date", "header"), S("B1", "Client", "header"), S("C1", "Service", "header"),
        S("D1", "Amount ($)", "header"), S("E1", "Method", "header"), S("F1", "Paid?", "header"),
        S("G1", "Notes", "header"),
        D("A2", "2026-07-06"), S("B2", "Okafor, D.", "input"), S("C2", "Monthly mowing", "input"),
        N("D2", 238, "input_money"), S("E2", "Card", "input"), S("F2", "Yes", "input"),
        D("A3", "2026-07-06"), S("B3", "Ruiz, M.", "input"), S("C3", "Monthly mowing", "input"),
        N("D3", 281, "input_money"), S("E3", "Card", "input"), S("F3", "Yes", "input"),
        D("A4", "2026-07-11"), S("B4", "Bell, S.", "input"), S("C4", "Mulch install", "input"),
        N("D4", 425, "input_money"), S("E4", "Invoice", "input"), S("F4", "No", "input"),
    ]
    inc = {"name": "Income", "cells": inc_cells, "freeze": True,
           "widths": {"A": 12, "B": 22, "C": 24, "D": 13, "E": 12, "F": 9, "G": 40},
           "autofilter": "A1:G500",
           "validations": [
               {"sqref": "E2:E500", "type": "list", "f1": '"Cash,Check,Card,Invoice,Other"'},
               {"sqref": "F2:F500", "type": "list", "f1": '"Yes,No"'},
           ]}

    CATS = ["Fuel", "Blades & parts", "Equipment purchase", "Equipment repair/maintenance",
            "Fertilizer & chemicals", "Mulch & materials", "Insurance", "Vehicle/trailer",
            "Licenses & fees", "Dump/disposal fees", "Marketing", "Software/apps", "Labor", "Other"]
    exp_cells = [
        S("A1", "Date", "header"), S("B1", "Vendor", "header"), S("C1", "Category", "header"),
        S("D1", "Amount ($)", "header"), S("E1", "Notes", "header"),
        D("A2", "2026-07-01"), S("B2", "Fuel stop", "input"), S("C2", "Fuel", "input"),
        N("D2", 96, "input_money"), S("E2", "Mowers + truck", "input"),
        D("A3", "2026-07-02"), S("B3", "Dealer", "input"), S("C3", "Blades & parts", "input"),
        N("D3", 64, "input_money"), S("E3", "Two sets, 48\"", "input"),
        D("A4", "2026-07-05"), S("B4", "Insurance co.", "input"), S("C4", "Insurance", "input"),
        N("D4", 140, "input_money"), S("E4", "Monthly GL premium", "input"),
    ]
    exp = {"name": "Expenses", "cells": exp_cells, "freeze": True,
           "widths": {"A": 12, "B": 24, "C": 28, "D": 13, "E": 44},
           "autofilter": "A1:E500",
           "validations": [
               {"sqref": "C2:C500", "type": "list", "f1": "'Summary'!$A$14:$A$27"},
           ]}

    sum_cells = [
        S("A1", "SUMMARY", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Total income", "label"), F("B3", "SUM(Income!D2:D500)", "output_money"),
        S("A4", "Collected", "label"),
        F("B4", "SUMIF(Income!F2:F500,\"Yes\",Income!D2:D500)", "output_money"),
        S("A5", "Outstanding (unpaid)", "label"),
        F("B5", "SUMIF(Income!F2:F500,\"No\",Income!D2:D500)", "output_money"),
        S("C5", "Chase anything older than your terms — today, not next month", "note"),
        S("A6", "Total expenses", "label"), F("B6", "SUM(Expenses!D2:D500)", "output_money"),
        S("A7", "Net (income - expenses)", "label"), F("B7", "B3-B6", "output_money"),
        S("A8", "Margin", "label"), F("B8", "IF(B3=0,\"\",B7/B3)", "output_pct"),
        S("A10", "Set aside for taxes", "label"), F("B10", "IF(B7<0,0,ROUND(B7*B11,2))", "output_money"),
        S("A11", "Tax set-aside rate", "label"), N("B11", 0.25, "input_num"),
        S("C11", "Common rule of thumb for self-employment; confirm with your CPA", "note"),

        S("A13", "EXPENSES BY CATEGORY", "header"), S("B13", "", "header"), S("C13", "", "header"),
    ]
    for i, cat in enumerate(CATS):
        r = 14 + i
        sum_cells.append(S("A%d" % r, cat, "input"))
        sum_cells.append(F("B%d" % r, "SUMIF(Expenses!C2:C500,A%d,Expenses!D2:D500)" % r, "output_money"))
        sum_cells.append(F("C%d" % r, "IF($B$6=0,\"\",B%d/$B$6)" % r, "output_pct"))
    summary = {"name": "Summary", "cells": sum_cells,
               "widths": {"A": 32, "B": 16, "C": 52},
               "merges": ["A1:C1", "A13:C13"]}

    write_xlsx(os.path.join(OUT, "route-ready-lawn-income-expense-tracker.xlsx"), [start, inc, exp, summary])


# ================================================================ WB 4: Job Costing
def build_jobcost():
    start_text = (
        "Job Costing — how to use\n\n"
        "Quoting is a guess. Job costing is the truth. After a visit, put the ACTUAL numbers in and find out "
        "what that stop really paid.\n\n"
        "Do this for a full month across your whole route. The pattern that shows up will surprise you — "
        "usually a handful of long-standing clients whose price hasn't moved in three years are quietly the "
        "worst-paying stops on the route.\n\n"
        "Those are the ones to raise first. Use the price-increase letter in File 12; it's written for exactly "
        "this conversation.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F14"],
             "widths": {c: 18 for c in "ABCDEF"}}

    jl_cells = [
        S("A1", "Date", "header"), S("B1", "Client", "header"), S("C1", "Service", "header"),
        S("D1", "Price ($)", "header"), S("E1", "On-site Min", "header"), S("F1", "Drive Min", "header"),
        S("G1", "Fuel ($)", "header"), S("H1", "Materials ($)", "header"), S("I1", "Labor Cost ($)", "header"),
        S("J1", "Equip Reserve ($)", "header"), S("K1", "Total Cost ($)", "header"),
        S("L1", "Profit ($)", "header"), S("M1", "Margin", "header"), S("N1", "True $/hr", "header"),

        D("A2", "2026-07-06"), S("B2", "Okafor, D.", "input"), S("C2", "Mow/Trim/Edge", "input"),
        N("D2", 55, "input_money"), N("E2", 34, "input_int"), N("F2", 6, "input_int"),
        N("G2", 4.5, "input_money"),
        D("A3", "2026-07-06"), S("B3", "Ruiz, M.", "input"), S("C3", "Mow/Trim/Edge", "input"),
        N("D3", 65, "input_money"), N("E3", 41, "input_int"), N("F3", 2, "input_int"),
        N("G3", 4.5, "input_money"),
    ]
    for r in range(2, 401):
        jl_cells.append(F("I%d" % r, "IF(E%d=\"\",\"\",ROUND(((E%d+F%d)/60)*'Cost Rates'!$B$3,2))" % (r, r, r),
                          "output_money"))
        jl_cells.append(F("J%d" % r, "IF(D%d=\"\",\"\",'Cost Rates'!$B$4)" % r, "output_money"))
        jl_cells.append(F("K%d" % r, "IF(D%d=\"\",\"\",SUM(G%d,H%d,I%d,J%d))" % (r, r, r, r, r), "output_money"))
        jl_cells.append(F("L%d" % r, "IF(D%d=\"\",\"\",D%d-K%d)" % (r, r, r), "output_money"))
        jl_cells.append(F("M%d" % r, "IF(OR(D%d=\"\",D%d=0),\"\",L%d/D%d)" % (r, r, r, r), "output_pct"))
        jl_cells.append(F("N%d" % r, "IF((E%d+F%d)=0,\"\",ROUND(L%d/((E%d+F%d)/60),2))" % (r, r, r, r, r),
                          "output_money"))
    jl = {"name": "Visit Log", "cells": jl_cells, "freeze": True,
          "widths": {"A": 12, "B": 20, "C": 18, "D": 11, "E": 12, "F": 10, "G": 10, "H": 13,
                     "I": 13, "J": 16, "K": 13, "L": 11, "M": 10, "N": 11},
          "autofilter": "A1:N400",
          "cf": [{"sqref": "M2:M400", "rules": [
              {"type": "cellIs", "op": "lessThan", "formulas": ["0.25"], "dxf": 1},
              {"type": "cellIs", "op": "greaterThanOrEqual", "formulas": ["0.45"], "dxf": 0},
          ]}]}

    cr_cells = [
        S("A1", "COST RATES — set these once, revisit quarterly", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Labor cost per hour ($)", "label"), N("B3", 24, "input_money"),
        S("C3", "What the hour costs you. If you're solo, use what you'd pay someone to replace you — "
                "otherwise you'll think you're profitable when you've just worked for free.", "note"),
        S("A4", "Equipment reserve per stop ($)", "label"), N("B4", 4, "input_money"),
        S("C4", "Mowers, trimmers, and blades wear out on a schedule. Charge yourself now so June's repair "
                "isn't a crisis.", "note"),

        S("A7", "TOTALS", "header"), S("B7", "", "header"), S("C7", "", "header"),
        S("A8", "Visits costed", "label"), F("B8", "COUNT('Visit Log'!D2:D400)", "output"),
        S("A9", "Total revenue", "label"), F("B9", "SUM('Visit Log'!D2:D400)", "output_money"),
        S("A10", "Total cost", "label"), F("B10", "SUM('Visit Log'!K2:K400)", "output_money"),
        S("A11", "Total profit", "label"), F("B11", "SUM('Visit Log'!L2:L400)", "output_money"),
        S("A12", "Average margin", "label"), F("B12", "IFERROR(AVERAGE('Visit Log'!M2:M400),\"\")", "output_pct"),
        S("A13", "Average true $/hr", "label"),
        F("B13", "IFERROR(AVERAGE('Visit Log'!N2:N400),\"\")", "output_money"),
        S("A15", "Margins under 25% show red on the Visit Log. If the same client is red every week, that is "
                 "not a bad week — that's a price that stopped working. Raise it or release the stop.", "note"),
    ]
    cr = {"name": "Cost Rates", "cells": cr_cells,
          "widths": {"A": 34, "B": 14, "C": 62},
          "merges": ["A1:C1", "A7:C7", "A15:C15"]}

    write_xlsx(os.path.join(OUT, "route-ready-lawn-job-costing.xlsx"), [start, jl, cr])


if __name__ == "__main__":
    build_pricing()
    build_route()
    build_income()
    build_jobcost()
    print("\nLawn workbooks: 4 written to", OUT)
