# build-xlsx.py — Pressure Washing Business Starter Kit workbook generator
# Uses the shared OOXML engine in ../_xlsx_engine.py. Idempotent: re-running
# regenerates all 4 deliverables.
#
# Trade model note: pressure washing prices off SURFACE AREA and PRODUCTION RATE
# (sq ft per hour), not rooms or hours quoted. Flow rate, setup time, and drive
# time are the three things new operators leave out of a quote.
import os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _xlsx_engine import S, N, F, D, write_xlsx, outdir  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = outdir(HERE)


# ================================================================ WB 1: Pricing Calculator
def build_pricing():
    start_text = (
        "How to use this calculator\n\n"
        "1. Go to the Rate Settings tab first. Set your target hourly rate, your minimum job floor, and check "
        "the production rates against your own speed. Those numbers drive everything. The defaults are sane "
        "starting points for a solo operator in a 2026 US suburban market — they are not gospel.\n\n"
        "2. On the Calculator tab, fill in the yellow cells only: service type, square footage, condition, "
        "setup and drive time. The green cells do the math.\n\n"
        "3. Quote the Flat-Rate Quote number. Never quote hourly — customers shop hourly rates, they accept "
        "flat prices. And never quote by the hour on a job where you're getting faster every month.\n\n"
        "4. If the Margin Check cell says FLOOR or LOW RATE, fix the price before you quote it.\n\n"
        "5. After each quote, copy the row into the Quote Log tab so you can see your close rate and average "
        "job size over time.\n\n"
        "The number new washers forget is SETUP AND TEARDOWN. Hoses out, hoses in, mixing, protecting "
        "landscaping, and the walkthrough are real hours you don't spend spraying. This calculator bills them "
        "because your day does.\n\n"
        "Time yourself on your first 10 jobs and update the production rates. Your real numbers beat my "
        "defaults every time.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F22"],
             "widths": {c: 18 for c in "ABCDEF"}}

    calc_cells = [
        S("A1", "JOB INPUTS", "header"), S("B1", "", "header"),
        S("A3", "Service type", "label"), S("B3", "House Wash (Soft Wash)", "input"),
        S("C3", "Drives the production rate pulled from Rate Settings", "note"),
        S("A4", "Surface area (sq ft)", "label"), N("B4", 2000, "input_int"),
        S("C4", "Siding: approx. wall area. Flatwork: length x width. Measure, don't eyeball.", "note"),
        S("A5", "Condition factor", "label"), S("B5", "Normal", "input"),
        S("C5", "Heavy growth or set-in staining takes longer at the same square footage", "note"),
        S("A6", "Setup + teardown (hours)", "label"), N("B6", 0.75, "input_num"),
        S("C6", "Hoses out and back, mixing, protecting plants, the walkthrough. Real time. Bill it.", "note"),
        S("A7", "Drive time (hours, round trip)", "label"), N("B7", 0.5, "input_num"),
        S("A8", "Two-story / height access?", "label"), S("B8", "No", "input"),
        S("C8", "Ladder or extension work slows production — adds the Rate Settings multiplier", "note"),
        S("A9", "Chemical cost estimate ($)", "label"), N("B9", 15, "input_money"),
        S("A10", "Target hourly rate ($/hr)", "label"),
        F("B10", "'Rate Settings'!B3", "input_money"),
        S("C10", "Defaults from Rate Settings — overtype to override per-job", "note"),

        S("A12", "QUOTE OUTPUTS", "header"), S("B12", "", "header"),
        S("A13", "Production hours", "label"),
        F("B13", "ROUND((B4/VLOOKUP(B3,'Rate Settings'!A7:B12,2,FALSE))"
                 "*VLOOKUP(B5,'Rate Settings'!A16:B18,2,FALSE)"
                 "*IF(B8=\"Yes\",'Rate Settings'!B21,1),2)", "output_num"),
        S("A14", "Billable hours (production + setup)", "label"),
        F("B14", "CEILING(B13+B6,0.25)", "output_num"),
        S("C14", "Drive time is recovered in the floor and the margin, not billed as a line item", "note"),
        S("A15", "Flat-rate quote", "label"),
        F("B15", "MAX(CEILING(B14*B10+B9,5),'Rate Settings'!B4)", "output_money"),
        S("A16", "Effective $/hr (incl. drive)", "label"),
        F("B16", "IF((B14+B7)=0,\"\",ROUND((B15-B9)/(B14+B7),2))", "output_money"),
        S("C16", "This is the honest number — what the whole trip paid you per hour", "note"),
        S("A17", "Price per sq ft", "label"),
        F("B17", "IF(B4=0,\"\",ROUND(B15/B4,3))", "output_money"),
        S("A18", "Margin check", "label"),
        F("B18", "IF(B15<='Rate Settings'!B4,\"FLOOR — priced at your minimum. Fine if it's on-route, "
                 "skip it if it's a drive.\",IF(B16<B10*0.9,\"LOW RATE — effective hourly is more than 10% "
                 "under target once drive time is counted. Raise the price or tighten the route.\",\"OK\"))",
          "output_wrap"),
    ]
    calc = {"name": "Calculator", "cells": calc_cells,
            "widths": {"A": 34, "B": 28, "C": 58},
            "merges": ["A1:B1", "A12:B12"],
            "validations": [
                {"sqref": "B3", "type": "list", "f1": "'Rate Settings'!$A$7:$A$12"},
                {"sqref": "B5", "type": "list", "f1": "'Rate Settings'!$A$16:$A$18"},
                {"sqref": "B8", "type": "list", "f1": '"Yes,No"'},
            ],
            "cf": [{"sqref": "B18", "rules": [
                {"type": "containsText", "text": "FLOOR", "dxf": 1},
                {"type": "containsText", "text": "LOW RATE", "dxf": 1},
                {"type": "containsText", "text": "OK", "dxf": 0},
            ]}]}

    rs_cells = [
        S("A1", "RATE SETTINGS — all yellow, all yours", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Target hourly rate ($/hr revenue)", "label"), N("B3", 85, "input_money"),
        S("C3", "Solo washers: 75-125 is the workable band. Higher than interior trades because the "
                "equipment, insurance, and risk are higher. This is revenue per labor hour, not take-home.", "note"),
        S("A4", "Minimum job floor ($)", "label"), N("B4", 175, "input_money"),
        S("C4", "The least you'll roll a trailer for. Covers drive, setup, chemical, and still pays you.", "note"),

        S("A6", "PRODUCTION RATES (sq ft per hour)", "header"), S("B6", "", "header"), S("C6", "", "header"),
        S("A7", "House Wash (Soft Wash)", "label"), N("B7", 900, "input_int"),
        S("C7", "Wall area. Soft wash including dwell time — the solution works while you stage the next elevation.", "note"),
        S("A8", "Driveway / Flatwork (Surface Cleaner)", "label"), N("B8", 1100, "input_int"),
        S("C8", "With a 16-20\" surface cleaner. Free-wanding open concrete is half this speed and looks worse.", "note"),
        S("A9", "Roof (Soft Wash)", "label"), N("B9", 700, "input_int"),
        S("C9", "Slower and priced higher — access, fall protection, and risk, never pressure.", "note"),
        S("A10", "Deck / Fence (Wood)", "label"), N("B10", 350, "input_int"),
        S("C10", "Slow work: cleaner, dwell, low pressure with the grain, brightener. Price accordingly.", "note"),
        S("A11", "Gutter Face Brightening", "label"), N("B11", 250, "input_int"),
        S("C11", "Linear feet, not square feet — it's hand work with a brush.", "note"),
        S("A12", "Concrete Sealing", "label"), N("B12", 800, "input_int"),

        S("A15", "CONDITION FACTORS", "header"), S("B15", "", "header"), S("C15", "", "header"),
        S("A16", "Light", "label"), N("B16", 0.85, "input_num"), S("C16", "Recently maintained, light film", "note"),
        S("A17", "Normal", "label"), N("B17", 1.00, "input_num"),
        S("A18", "Heavy", "label"), N("B18", 1.40, "input_num"),
        S("C18", "Years of growth, thick algae, set-in staining. Walk away from anything worse or price it as restoration.", "note"),

        S("A20", "ACCESS MULTIPLIERS", "header"), S("B20", "", "header"), S("C20", "", "header"),
        S("A21", "Two-story / ladder work", "label"), N("B21", 1.25, "input_num"),
        S("C21", "Applied to production hours when height access is required", "note"),

        S("A23", "REFERENCE — common add-on prices", "header"), S("B23", "", "header"), S("C23", "", "header"),
        S("A24", "Gutter face brightening (per linear ft)", "label"), N("B24", 1.25, "input_money"),
        S("A25", "Rust removal treatment (per spot)", "label"), N("B25", 45, "input_money"),
        S("A26", "Oil stain treatment (per stain)", "label"), N("B26", 35, "input_money"),
        S("C26", "Set expectations: treatment lightens oil, it rarely removes it completely", "note"),
    ]
    rs = {"name": "Rate Settings", "cells": rs_cells,
          "widths": {"A": 36, "B": 12, "C": 62},
          "merges": ["A1:C1", "A6:C6", "A15:C15", "A20:C20", "A23:C23"]}

    ql_cells = [
        S("A1", "Date", "header"), S("B1", "Customer", "header"), S("C1", "Service", "header"),
        S("D1", "Sq Ft", "header"), S("E1", "Condition", "header"), S("F1", "Quote Given ($)", "header"),
        S("G1", "Billable Hrs", "header"), S("H1", "Effective $/hr", "header"), S("I1", "Won?", "header"),
        S("K1", "Close rate", "label"),
        F("L1", "IFERROR(COUNTIF(I2:I500,\"Won\")/COUNTA(I2:I500),\"\")", "output_pct"),
        S("K2", "Average quote", "label"),
        F("L2", "IFERROR(AVERAGE(F2:F500),\"\")", "output_money"),
        S("K3", "Average $/hr", "label"),
        F("L3", "IFERROR(AVERAGE(H2:H500),\"\")", "output_money"),

        D("A2", "2026-07-06"), S("B2", "Alvarez, R.", "input"), S("C2", "House Wash (Soft Wash)", "input"),
        N("D2", 2200, "input_int"), S("E2", "Normal", "input"), N("F2", 350, "input_money"),
        N("G2", 3.25, "input_num"), S("I2", "Won", "input"),
        D("A3", "2026-07-08"), S("B3", "Nguyen, T.", "input"), S("C3", "Driveway / Flatwork (Surface Cleaner)", "input"),
        N("D3", 900, "input_int"), S("E3", "Heavy", "input"), N("F3", 225, "input_money"),
        N("G3", 1.75, "input_num"), S("I3", "Won", "input"),
        D("A4", "2026-07-11"), S("B4", "Whitaker, J.", "input"), S("C4", "Deck / Fence (Wood)", "input"),
        N("D4", 600, "input_int"), S("E4", "Normal", "input"), N("F4", 320, "input_money"),
        N("G4", 2.50, "input_num"), S("I4", "Lost", "input"),
    ]
    for r in range(2, 501):
        ql_cells.append(F("H%d" % r, "IF(G%d=0,\"\",ROUND(F%d/G%d,2))" % (r, r, r), "output_money"))
    ql = {"name": "Quote Log", "cells": ql_cells, "freeze": True,
          "widths": {"A": 12, "B": 20, "C": 32, "D": 9, "E": 11, "F": 14, "G": 12, "H": 13, "I": 10,
                     "K": 14, "L": 12},
          "autofilter": "A1:I500",
          "validations": [
              {"sqref": "C2:C500", "type": "list", "f1": "'Rate Settings'!$A$7:$A$12"},
              {"sqref": "E2:E500", "type": "list", "f1": "'Rate Settings'!$A$16:$A$18"},
              {"sqref": "I2:I500", "type": "list", "f1": '"Won,Lost,Pending"'},
          ]}
    write_xlsx(os.path.join(OUT, "route-ready-pw-pricing-calculator.xlsx"), [start, calc, rs, ql])


# ================================================================ WB 2: Job & Client Tracker
def build_jobtracker():
    start_text = (
        "Job & Client Tracker — how to use\n\n"
        "Pressure washing is mostly one-off work, which means the money is in the FOLLOW-UP. A house washed "
        "this year needs it again in 12-24 months; a driveway sooner. The operators who build a real business "
        "are the ones who call back — everyone else starts from zero every spring.\n\n"
        "Jobs tab: log every completed job with the date, service, and price. The Next Service Due column "
        "calculates automatically from the service interval you set.\n\n"
        "Follow-Up tab: shows what's due. Work this list every month — it is the cheapest lead source you "
        "will ever have, and those customers already trust you.\n\n"
        "Referral column: track who sent you. When you know your top referrers, you know exactly who deserves "
        "the holiday card and the discount.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F16"],
             "widths": {c: 18 for c in "ABCDEF"}}

    jobs_cells = [
        S("A1", "Date", "header"), S("B1", "Customer", "header"), S("C1", "Address", "header"),
        S("D1", "Phone", "header"), S("E1", "Service", "header"), S("F1", "Price ($)", "header"),
        S("G1", "Hours", "header"), S("H1", "$/hr", "header"), S("I1", "Interval (months)", "header"),
        S("J1", "Next Service Due", "header"), S("K1", "Referred By", "header"), S("L1", "Notes", "header"),

        D("A2", "2026-05-14"), S("B2", "Alvarez, R.", "input"), S("C2", "418 Maple Ct", "input"),
        S("D2", "555-0141", "input"), S("E2", "House Wash (Soft Wash)", "input"), N("F2", 350, "input_money"),
        N("G2", 3.25, "input_num"), N("I2", 18, "input_int"), S("K2", "Google", "input"),
        S("L2", "Chalky aluminum on south side — soft wash only, noted on file", "input"),
        D("A3", "2026-06-02"), S("B3", "Nguyen, T.", "input"), S("C3", "77 Birchwood Dr", "input"),
        S("D3", "555-0177", "input"), S("E3", "Driveway / Flatwork (Surface Cleaner)", "input"),
        N("F3", 225, "input_money"), N("G3", 1.75, "input_num"), N("I3", 12, "input_int"),
        S("K3", "Alvarez, R.", "input"), S("L3", "Oil stain at apron — treated, lightened not removed", "input"),
    ]
    for r in range(2, 401):
        jobs_cells.append(F("H%d" % r, "IF(G%d=0,\"\",ROUND(F%d/G%d,2))" % (r, r, r), "output_money"))
        jobs_cells.append(F("J%d" % r, "IF(OR(A%d=\"\",I%d=\"\"),\"\",EDATE(A%d,I%d))" % (r, r, r, r),
                            "output" if r > 400 else "output"))
    jobs = {"name": "Jobs", "cells": jobs_cells, "freeze": True,
            "widths": {"A": 12, "B": 20, "C": 24, "D": 12, "E": 32, "F": 11, "G": 8, "H": 10,
                       "I": 15, "J": 16, "K": 16, "L": 44},
            "autofilter": "A1:L400"}

    fu_cells = [
        S("A1", "FOLLOW-UP DASHBOARD", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Jobs logged", "label"), F("B3", "COUNTA(Jobs!A2:A400)", "output"),
        S("A4", "Total revenue logged", "label"), F("B4", "SUM(Jobs!F2:F400)", "output_money"),
        S("A5", "Average job size", "label"), F("B5", "IFERROR(AVERAGE(Jobs!F2:F400),\"\")", "output_money"),
        S("A6", "Average $/hr", "label"), F("B6", "IFERROR(AVERAGE(Jobs!H2:H400),\"\")", "output_money"),

        S("A8", "DUE NOW", "header"), S("B8", "", "header"), S("C8", "", "header"),
        S("A9", "Due in the next 30 days", "label"),
        F("B9", "COUNTIFS(Jobs!J2:J400,\"<=\"&(TODAY()+30),Jobs!J2:J400,\">=\"&TODAY())", "output"),
        S("C9", "Call these this week. They already know you.", "note"),
        S("A10", "Overdue (past due date)", "label"),
        F("B10", "COUNTIFS(Jobs!J2:J400,\"<\"&TODAY(),Jobs!J2:J400,\">0\")", "output"),
        S("C10", "Every one of these is a job someone else is about to get", "note"),

        S("A12", "REFERRAL SOURCES", "header"), S("B12", "", "header"), S("C12", "", "header"),
        S("A13", "Source", "label"), S("B13", "Jobs", "label"), S("C13", "Revenue", "label"),
        S("A14", "Google", "input"),
        F("B14", "COUNTIF(Jobs!K2:K400,A14)", "output"),
        F("C14", "SUMIF(Jobs!K2:K400,A14,Jobs!F2:F400)", "output_money"),
        S("A15", "Referral", "input"),
        F("B15", "COUNTIF(Jobs!K2:K400,A15)", "output"),
        F("C15", "SUMIF(Jobs!K2:K400,A15,Jobs!F2:F400)", "output_money"),
        S("A16", "Door hanger", "input"),
        F("B16", "COUNTIF(Jobs!K2:K400,A16)", "output"),
        F("C16", "SUMIF(Jobs!K2:K400,A16,Jobs!F2:F400)", "output_money"),
        S("A17", "Facebook", "input"),
        F("B17", "COUNTIF(Jobs!K2:K400,A17)", "output"),
        F("C17", "SUMIF(Jobs!K2:K400,A17,Jobs!F2:F400)", "output_money"),
        S("A18", "Repeat customer", "input"),
        F("B18", "COUNTIF(Jobs!K2:K400,A18)", "output"),
        F("C18", "SUMIF(Jobs!K2:K400,A18,Jobs!F2:F400)", "output_money"),
        S("A20", "Overtype the source names in column A to match how you actually track leads. "
                 "Whatever you type here is counted against the Referred By column on the Jobs tab.", "note"),
    ]
    fu = {"name": "Follow-Up", "cells": fu_cells,
          "widths": {"A": 30, "B": 14, "C": 46},
          "merges": ["A1:C1", "A8:C8", "A12:C12", "A20:C20"]}

    write_xlsx(os.path.join(OUT, "route-ready-pw-job-tracker.xlsx"), [start, jobs, fu])


# ================================================================ WB 3: Income & Expense Tracker
def build_income():
    start_text = (
        "Income & Expense Tracker — how to use\n\n"
        "One row per transaction. Money in on the Income tab, money out on the Expenses tab, and the Summary "
        "tab totals it by month and by category.\n\n"
        "Do this weekly, not at tax time. Fifteen minutes on a Friday beats a lost weekend in April, and the "
        "expenses you forget are the deductions you donate to the IRS.\n\n"
        "The categories are set up for this trade — chemicals, equipment repair, fuel, and insurance are where "
        "your money actually goes. Change them to match your accountant's chart of accounts if you have one.\n\n"
        "This is a bookkeeping aid, not tax advice. Talk to a CPA about what's deductible in your situation.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F16"],
             "widths": {c: 18 for c in "ABCDEF"}}

    inc_cells = [
        S("A1", "Date", "header"), S("B1", "Customer", "header"), S("C1", "Service", "header"),
        S("D1", "Amount ($)", "header"), S("E1", "Method", "header"), S("F1", "Paid?", "header"),
        S("G1", "Notes", "header"),
        D("A2", "2026-07-06"), S("B2", "Alvarez, R.", "input"), S("C2", "House Wash", "input"),
        N("D2", 350, "input_money"), S("E2", "Card", "input"), S("F2", "Yes", "input"),
        D("A3", "2026-07-08"), S("B3", "Nguyen, T.", "input"), S("C3", "Driveway", "input"),
        N("D3", 225, "input_money"), S("E3", "Check", "input"), S("F3", "Yes", "input"),
        D("A4", "2026-07-12"), S("B4", "Whitaker, J.", "input"), S("C4", "Deck", "input"),
        N("D4", 320, "input_money"), S("E4", "Invoice", "input"), S("F4", "No", "input"),
    ]
    inc = {"name": "Income", "cells": inc_cells, "freeze": True,
           "widths": {"A": 12, "B": 22, "C": 22, "D": 13, "E": 12, "F": 9, "G": 40},
           "autofilter": "A1:G500",
           "validations": [
               {"sqref": "E2:E500", "type": "list", "f1": '"Cash,Check,Card,Invoice,Other"'},
               {"sqref": "F2:F500", "type": "list", "f1": '"Yes,No"'},
           ]}

    CATS = ["Chemicals", "Fuel", "Equipment purchase", "Equipment repair/maintenance",
            "Insurance", "Vehicle/trailer", "Licenses & fees", "Marketing", "Software/apps",
            "Supplies", "Labor", "Other"]
    exp_cells = [
        S("A1", "Date", "header"), S("B1", "Vendor", "header"), S("C1", "Category", "header"),
        S("D1", "Amount ($)", "header"), S("E1", "Notes", "header"),
        D("A2", "2026-07-01"), S("B2", "Supply house", "input"), S("C2", "Chemicals", "input"),
        N("D2", 145, "input_money"), S("E2", "SH, surfactant, gutter cleaner", "input"),
        D("A3", "2026-07-03"), S("B3", "Fuel stop", "input"), S("C3", "Fuel", "input"),
        N("D3", 78, "input_money"),
        D("A4", "2026-07-05"), S("B4", "Insurance co.", "input"), S("C4", "Insurance", "input"),
        N("D4", 165, "input_money"), S("E4", "Monthly GL premium", "input"),
    ]
    exp = {"name": "Expenses", "cells": exp_cells, "freeze": True,
           "widths": {"A": 12, "B": 24, "C": 28, "D": 13, "E": 44},
           "autofilter": "A1:E500",
           "validations": [
               {"sqref": "C2:C500", "type": "list", "f1": "'Summary'!$A$14:$A$25"},
           ]}

    sum_cells = [
        S("A1", "SUMMARY", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Total income", "label"), F("B3", "SUM(Income!D2:D500)", "output_money"),
        S("A4", "Collected", "label"),
        F("B4", "SUMIF(Income!F2:F500,\"Yes\",Income!D2:D500)", "output_money"),
        S("A5", "Outstanding (unpaid)", "label"),
        F("B5", "SUMIF(Income!F2:F500,\"No\",Income!D2:D500)", "output_money"),
        S("C5", "Chase anything here older than your terms — today, not next month", "note"),
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

    write_xlsx(os.path.join(OUT, "route-ready-pw-income-expense-tracker.xlsx"), [start, inc, exp, summary])


# ================================================================ WB 4: Job Costing
def build_jobcost():
    start_text = (
        "Job Costing — how to use\n\n"
        "Quoting is a guess. Job costing is the truth. After a job is done, put the ACTUAL numbers in here and "
        "find out what you really made.\n\n"
        "Do this on every job for your first season. The pattern that shows up will surprise you — usually that "
        "one service type you enjoy is quietly your worst earner, and the boring one pays the bills.\n\n"
        "Chemical cost is the number washers guess at. Work out your real cost per mixed gallon once, put it in "
        "Cost Rates, and let the sheet do it from there.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F14"],
             "widths": {c: 18 for c in "ABCDEF"}}

    jl_cells = [
        S("A1", "Date", "header"), S("B1", "Customer", "header"), S("C1", "Service", "header"),
        S("D1", "Quoted ($)", "header"), S("E1", "Actual Hours", "header"), S("F1", "Drive Hrs", "header"),
        S("G1", "Chem Gallons", "header"), S("H1", "Chem Cost ($)", "header"),
        S("I1", "Fuel ($)", "header"), S("J1", "Labor Cost ($)", "header"),
        S("K1", "Total Cost ($)", "header"), S("L1", "Profit ($)", "header"),
        S("M1", "Margin", "header"), S("N1", "True $/hr", "header"),

        D("A2", "2026-07-06"), S("B2", "Alvarez, R.", "input"), S("C2", "House Wash", "input"),
        N("D2", 350, "input_money"), N("E2", 3.5, "input_num"), N("F2", 0.5, "input_num"),
        N("G2", 12, "input_num"), N("I2", 14, "input_money"),
        D("A3", "2026-07-08"), S("B3", "Nguyen, T.", "input"), S("C3", "Driveway", "input"),
        N("D3", 225, "input_money"), N("E3", 2.0, "input_num"), N("F3", 0.4, "input_num"),
        N("G3", 4, "input_num"), N("I3", 11, "input_money"),
    ]
    for r in range(2, 301):
        jl_cells.append(F("H%d" % r, "IF(G%d=\"\",\"\",ROUND(G%d*'Cost Rates'!$B$3,2))" % (r, r), "output_money"))
        jl_cells.append(F("J%d" % r, "IF(E%d=\"\",\"\",ROUND((E%d+F%d)*'Cost Rates'!$B$4,2))" % (r, r, r), "output_money"))
        jl_cells.append(F("K%d" % r, "IF(D%d=\"\",\"\",SUM(H%d,I%d,J%d)+'Cost Rates'!$B$5)" % (r, r, r, r), "output_money"))
        jl_cells.append(F("L%d" % r, "IF(D%d=\"\",\"\",D%d-K%d)" % (r, r, r), "output_money"))
        jl_cells.append(F("M%d" % r, "IF(OR(D%d=\"\",D%d=0),\"\",L%d/D%d)" % (r, r, r, r), "output_pct"))
        jl_cells.append(F("N%d" % r, "IF((E%d+F%d)=0,\"\",ROUND(L%d/(E%d+F%d),2))" % (r, r, r, r, r), "output_money"))
    jl = {"name": "Job Log", "cells": jl_cells, "freeze": True,
          "widths": {"A": 12, "B": 20, "C": 20, "D": 12, "E": 12, "F": 10, "G": 13, "H": 13,
                     "I": 10, "J": 13, "K": 13, "L": 12, "M": 10, "N": 11},
          "autofilter": "A1:N300",
          "cf": [{"sqref": "M2:M300", "rules": [
              {"type": "cellIs", "op": "lessThan", "formulas": ["0.2"], "dxf": 1},
              {"type": "cellIs", "op": "greaterThanOrEqual", "formulas": ["0.4"], "dxf": 0},
          ]}]}

    cr_cells = [
        S("A1", "COST RATES — set these once, revisit quarterly", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Chemical cost per mixed gallon ($)", "label"), N("B3", 0.85, "input_money"),
        S("C3", "Work this out once from your concentrate cost and dilution ratio. Guessing here makes every "
                "row below a guess.", "note"),
        S("A4", "Labor cost per hour ($)", "label"), N("B4", 25, "input_money"),
        S("C4", "What the hour costs you. If you're solo, use what you'd pay someone to replace you — "
                "otherwise you'll think you're profitable when you've just worked for free.", "note"),
        S("A5", "Equipment reserve per job ($)", "label"), N("B5", 12, "input_money"),
        S("C5", "Pumps, hoses, and surface cleaners wear out. Charge yourself for it now so the replacement "
                "isn't a crisis later.", "note"),

        S("A8", "TOTALS", "header"), S("B8", "", "header"), S("C8", "", "header"),
        S("A9", "Jobs costed", "label"), F("B9", "COUNT('Job Log'!D2:D300)", "output"),
        S("A10", "Total quoted", "label"), F("B10", "SUM('Job Log'!D2:D300)", "output_money"),
        S("A11", "Total cost", "label"), F("B11", "SUM('Job Log'!K2:K300)", "output_money"),
        S("A12", "Total profit", "label"), F("B12", "SUM('Job Log'!L2:L300)", "output_money"),
        S("A13", "Average margin", "label"), F("B13", "IFERROR(AVERAGE('Job Log'!M2:M300),\"\")", "output_pct"),
        S("A14", "Average true $/hr", "label"), F("B14", "IFERROR(AVERAGE('Job Log'!N2:N300),\"\")", "output_money"),
        S("A16", "Margins under 20% show red on the Job Log. Two or three reds on the same service type is not "
                 "bad luck — it's a pricing problem, and the fix is the Pricing Calculator, not working faster.", "note"),
    ]
    cr = {"name": "Cost Rates", "cells": cr_cells,
          "widths": {"A": 34, "B": 14, "C": 62},
          "merges": ["A1:C1", "A8:C8", "A16:C16"]}

    write_xlsx(os.path.join(OUT, "route-ready-pw-job-costing.xlsx"), [start, jl, cr])


if __name__ == "__main__":
    build_pricing()
    build_jobtracker()
    build_income()
    build_jobcost()
    print("\nPW workbooks: 4 written to", OUT)
