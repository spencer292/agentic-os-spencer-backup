# build-xlsx.py — Cleaning Business Starter Kit workbook generator
# Pure Python stdlib: hand-authored OOXML zipped into .xlsx. No openpyxl.
# Idempotent: re-running regenerates all 4 deliverables.
import zipfile, os, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "deliverables")
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- helpers
def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))

def colletter(n):  # 1 -> A
    s = ""
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s

def refparse(ref):  # "B13" -> (13, 2)
    i = 0
    while ref[i].isalpha():
        i += 1
    col = 0
    for ch in ref[:i]:
        col = col * 26 + (ord(ch.upper()) - 64)
    return int(ref[i:]), col

def dserial(iso):  # ISO date -> Excel serial
    d = datetime.date.fromisoformat(iso)
    return (d - datetime.date(1899, 12, 30)).days

# cell tuple builders: (ref, kind, payload, style)
def S(ref, text, style="default"):   return (ref, "s", text, style)
def N(ref, num, style="default"):    return (ref, "n", num, style)
def F(ref, formula, style="output"): return (ref, "f", formula, style)
def D(ref, iso, style="input_date"): return (ref, "n", dserial(iso), style)

# ---------------------------------------------------------------- styles
# order defines cellXfs index
STYLES = [
    # name          font fill fmt  align
    ("default",      0, 0, 0,   None),
    ("title",        4, 0, 0,   None),
    ("header",       2, 4, 0,   None),
    ("label",        1, 0, 0,   None),
    ("input",        0, 2, 0,   None),
    ("input_num",    0, 2, 165, None),
    ("input_money",  0, 2, 164, None),
    ("input_date",   0, 2, 168, None),
    ("input_int",    0, 2, 1,   None),
    ("output",       0, 3, 0,   None),
    ("output_num",   0, 3, 165, None),
    ("output_money", 0, 3, 164, None),
    ("output_pct",   0, 3, 9,   None),
    ("output_month", 0, 3, 166, None),
    ("note",         3, 0, 0,   "wrap"),
    ("wrap",         0, 0, 0,   "wraptop"),
    ("header_month", 2, 4, 167, None),
    ("output_wrap",  0, 3, 0,   "wrap"),
]
SIDX = {name: i for i, (name, *_ ) in enumerate(STYLES)}

def styles_xml():
    numfmts = [
        (164, '"$"#,##0.00'),
        (165, "0.00"),
        (166, "mmm\\ yyyy"),
        (167, "mmm"),
        (168, "yyyy\\-mm\\-dd"),
    ]
    fonts = [
        '<font><sz val="11"/><name val="Calibri"/></font>',
        '<font><b/><sz val="11"/><name val="Calibri"/></font>',
        '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',
        '<font><i/><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font>',
        '<font><b/><sz val="14"/><name val="Calibri"/></font>',
    ]
    fills = [
        '<fill><patternFill patternType="none"/></fill>',
        '<fill><patternFill patternType="gray125"/></fill>',
        '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>',
        '<fill><patternFill patternType="solid"><fgColor rgb="FFD9EAD3"/><bgColor indexed="64"/></patternFill></fill>',
        '<fill><patternFill patternType="solid"><fgColor rgb="FF1A7F4B"/><bgColor indexed="64"/></patternFill></fill>',
    ]
    xfs = []
    for name, fo, fi, fmt, al in STYLES:
        a = ''
        if al == "wrap":
            a = ' applyAlignment="1"><alignment wrapText="1"/></xf>'
        elif al == "wraptop":
            a = ' applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>'
        else:
            a = '/>'
        xfs.append('<xf numFmtId="%d" fontId="%d" fillId="%d" borderId="0" xfId="0"'
                   ' applyNumberFormat="1" applyFont="1" applyFill="1"%s' % (fmt, fo, fi, a))
    dxfs = [
        # 0 green, 1 red, 2 yellow, 3 red text
        '<dxf><font><color rgb="FF006100"/></font><fill><patternFill><bgColor rgb="FFC6EFCE"/></patternFill></fill></dxf>',
        '<dxf><font><b/><color rgb="FF9C0006"/></font><fill><patternFill><bgColor rgb="FFFFC7CE"/></patternFill></fill></dxf>',
        '<dxf><font><color rgb="FF9C6500"/></font><fill><patternFill><bgColor rgb="FFFFEB9C"/></patternFill></fill></dxf>',
        '<dxf><font><color rgb="FFFF0000"/></font></dxf>',
    ]
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            '<numFmts count="%d">%s</numFmts>'
            '<fonts count="%d">%s</fonts>'
            '<fills count="%d">%s</fills>'
            '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            '<cellXfs count="%d">%s</cellXfs>'
            '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
            '<dxfs count="%d">%s</dxfs>'
            '</styleSheet>') % (
        len(numfmts),
        "".join('<numFmt numFmtId="%d" formatCode="%s"/>' % (i, esc(c)) for i, c in numfmts),
        len(fonts), "".join(fonts),
        len(fills), "".join(fills),
        len(xfs), "".join(xfs),
        len(dxfs), "".join(dxfs))

# ---------------------------------------------------------------- sheet xml
def sheet_xml(sh):
    # group cells by row
    rows = {}
    for ref, kind, payload, style in sh["cells"]:
        r, c = refparse(ref)
        rows.setdefault(r, []).append((c, ref, kind, payload, style))
    body = []
    for r in sorted(rows):
        cells = []
        for c, ref, kind, payload, style in sorted(rows[r]):
            s = SIDX[style]
            if kind == "s":
                cells.append('<c r="%s" s="%d" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>'
                             % (ref, s, esc(payload)))
            elif kind == "n":
                cells.append('<c r="%s" s="%d"><v>%s</v></c>' % (ref, s, payload))
            else:  # formula
                assert not str(payload).startswith("="), "formula must not start with '=': %s" % payload
                cells.append('<c r="%s" s="%d"><f>%s</f></c>' % (ref, s, esc(payload)))
        body.append('<row r="%d">%s</row>' % (r, "".join(cells)))

    parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
             '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">']
    if sh.get("freeze"):
        parts.append('<sheetViews><sheetView workbookViewId="0">'
                     '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'
                     '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>'
                     '</sheetView></sheetViews>')
    else:
        parts.append('<sheetViews><sheetView workbookViewId="0"/></sheetViews>')
    if sh.get("widths"):
        cols = "".join('<col min="%d" max="%d" width="%s" customWidth="1"/>'
                       % (refparse(w + "1")[1], refparse(w + "1")[1], wd)
                       for w, wd in sh["widths"].items())
        parts.append("<cols>%s</cols>" % cols)
    parts.append("<sheetData>%s</sheetData>" % "".join(body))
    if sh.get("autofilter"):
        parts.append('<autoFilter ref="%s"/>' % sh["autofilter"])
    if sh.get("merges"):
        parts.append('<mergeCells count="%d">%s</mergeCells>'
                     % (len(sh["merges"]),
                        "".join('<mergeCell ref="%s"/>' % m for m in sh["merges"])))
    pri = 1
    for cf in sh.get("cf", []):
        rules = []
        for rule in cf["rules"]:
            if rule["type"] == "containsText":
                first = cf["sqref"].split(":")[0].split(" ")[0]
                rules.append('<cfRule type="containsText" dxfId="%d" priority="%d"'
                             ' operator="containsText" text="%s">'
                             '<formula>NOT(ISERROR(SEARCH(&quot;%s&quot;,%s)))</formula></cfRule>'
                             % (rule["dxf"], pri, esc(rule["text"]), esc(rule["text"]), first))
            else:  # cellIs
                fx = "".join("<formula>%s</formula>" % esc(f) for f in rule["formulas"])
                rules.append('<cfRule type="cellIs" dxfId="%d" priority="%d" operator="%s">%s</cfRule>'
                             % (rule["dxf"], pri, rule["op"], fx))
            pri += 1
        parts.append('<conditionalFormatting sqref="%s">%s</conditionalFormatting>'
                     % (cf["sqref"], "".join(rules)))
    if sh.get("validations"):
        dvs = []
        for v in sh["validations"]:
            attrs = 'type="%s" allowBlank="1" showInputMessage="1" showErrorMessage="1"' % v["type"]
            if v.get("op"):
                attrs += ' operator="%s"' % v["op"]
            inner = "<formula1>%s</formula1>" % esc(v["f1"])
            if v.get("f2"):
                inner += "<formula2>%s</formula2>" % esc(v["f2"])
            dvs.append('<dataValidation %s sqref="%s">%s</dataValidation>' % (attrs, v["sqref"], inner))
        parts.append('<dataValidations count="%d">%s</dataValidations>' % (len(dvs), "".join(dvs)))
    parts.append("</worksheet>")
    return "".join(parts)

def write_xlsx(path, sheets):
    n = len(sheets)
    ct = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          '<Default Extension="xml" ContentType="application/xml"/>'
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>']
    for i in range(n):
        ct.append('<Override PartName="/xl/worksheets/sheet%d.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' % (i + 1))
    ct.append("</Types>")

    root_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                 '</Relationships>')

    wb_rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
               '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
    for i in range(n):
        wb_rels.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/>' % (i + 1, i + 1))
    wb_rels.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' % (n + 1))
    wb_rels.append("</Relationships>")

    wb = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
          ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>']
    for i, sh in enumerate(sheets):
        wb.append('<sheet name="%s" sheetId="%d" r:id="rId%d"/>' % (esc(sh["name"]), i + 1, i + 1))
    wb.append('</sheets><calcPr calcId="171027" fullCalcOnLoad="1"/></workbook>')

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", "".join(ct))
        z.writestr("_rels/.rels", root_rels)
        z.writestr("xl/workbook.xml", "".join(wb))
        z.writestr("xl/_rels/workbook.xml.rels", "".join(wb_rels))
        z.writestr("xl/styles.xml", styles_xml())
        for i, sh in enumerate(sheets):
            z.writestr("xl/worksheets/sheet%d.xml" % (i + 1), sheet_xml(sh))
    print("wrote", path)

# ================================================================ WB 1: Pricing Calculator
def build_pricing():
    start_text = (
        "How to use this calculator\n\n"
        "1. Go to the Rate Settings tab first. Set your target hourly rate, your minimum job floor, "
        "and check the production rates against your own speed. Those numbers drive everything. The "
        "defaults are sane starting points for a solo operator in a 2026 US suburban market — they are not gospel.\n\n"
        "2. On the Calculator tab, fill in the yellow cells only: square footage, cleaning type, frequency, "
        "add-ons. The green cells do the math.\n\n"
        "3. Quote the Flat-Rate Quote number. Never quote hourly — customers shop hourly rates, they accept flat prices.\n\n"
        "4. If the Margin Check cell says FLOOR or LOW RATE, fix the price before you quote it. That warning "
        "exists because I watched new operators book $85 jobs that cost them $95 to run.\n\n"
        "5. After each quote, copy the row into the Quote Log tab so you can see your close rate and average "
        "job size over time.\n\n"
        "Time yourself on your first 10 jobs and update the production rates in Rate Settings. Your real "
        "numbers beat my defaults every time.\n\n"
        "Convention: yellow cells = inputs (type here), green cells = outputs (never type here)."
    )
    start = {"name": "Start Here",
             "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F20"],
             "widths": {c: 18 for c in "ABCDEF"}}

    calc_cells = [
        S("A1", "JOB INPUTS", "header"), S("B1", "", "header"),
        S("A3", "Home square footage", "label"),            N("B3", 1800, "input_int"),
        S("A4", "Cleaning type", "label"),                  S("B4", "Standard", "input"),
        S("A5", "Frequency", "label"),                      S("B5", "Biweekly", "input"),
        S("A6", "Add-on: Inside fridge", "label"),          S("B6", "No", "input"),
        S("A7", "Add-on: Inside oven", "label"),            S("B7", "No", "input"),
        S("A8", "Add-on: Interior windows", "label"),       S("B8", "No", "input"),
        S("A9", "Add-on: Laundry (wash/fold 1 load)", "label"), S("B9", "No", "input"),
        S("A10", "Target hourly rate ($/hr)", "label"),
        F("B10", "'Rate Settings'!B3", "input_money"),
        S("C10", "Defaults from Rate Settings — overtype to override per-job", "note"),
        S("A12", "QUOTE OUTPUTS", "header"), S("B12", "", "header"),
        S("A13", "Estimated hours", "label"),
        F("B13", "CEILING((B3/VLOOKUP(B4,'Rate Settings'!A7:B9,2,FALSE))"
                 "+IF(B6=\"Yes\",'Rate Settings'!B20,0)"
                 "+IF(B7=\"Yes\",'Rate Settings'!B21,0)"
                 "+IF(B8=\"Yes\",'Rate Settings'!B22,0)"
                 "+IF(B9=\"Yes\",'Rate Settings'!B23,0),0.25)", "output_num"),
        S("A14", "Flat-rate quote", "label"),
        F("B14", "MAX(CEILING(B13*B10*VLOOKUP(B5,'Rate Settings'!A13:B16,2,FALSE),5),'Rate Settings'!B4)", "output_money"),
        S("A15", "Effective hourly rate", "label"),
        F("B15", "IF(B13=0,\"\",ROUND(B14/B13,2))", "output_money"),
        S("A16", "Margin check", "label"),
        F("B16", "IF(B14<='Rate Settings'!B4,\"FLOOR — this job is priced at your minimum. "
                 "Fine if it's on-route, skip it if it's a drive.\","
                 "IF(B15<B10*0.9,\"LOW RATE — effective hourly is more than 10% under target. "
                 "Re-check hours or raise the price.\",\"OK\"))", "output_wrap"),
    ]
    calc = {"name": "Calculator", "cells": calc_cells,
            "widths": {"A": 34, "B": 46, "C": 40},
            "merges": ["A1:B1_x", "A12:B12_x"],  # placeholder replaced below
            "validations": [
                {"sqref": "B4", "type": "list", "f1": "'Rate Settings'!$A$7:$A$9"},
                {"sqref": "B5", "type": "list", "f1": "'Rate Settings'!$A$13:$A$16"},
                {"sqref": "B6:B9", "type": "list", "f1": '"Yes,No"'},
            ],
            "cf": [{"sqref": "B16", "rules": [
                {"type": "containsText", "text": "FLOOR", "dxf": 1},
                {"type": "containsText", "text": "LOW RATE", "dxf": 1},
                {"type": "containsText", "text": "OK", "dxf": 0},
            ]}]}
    calc["merges"] = ["A1:B1", "A12:B12"]

    rs_cells = [
        S("A1", "RATE SETTINGS — all yellow, all yours", "header"), S("B1", "", "header"), S("C1", "", "header"),
        S("A3", "Target hourly rate ($/hr revenue)", "label"), N("B3", 60, "input_money"),
        S("C3", "Solo operators: 50-75 is the workable band. This is revenue per labor hour, not your take-home.", "note"),
        S("A4", "Minimum job floor ($)", "label"), N("B4", 130, "input_money"),
        S("C4", "The least you'll roll a vehicle for. Covers drive, setup, supplies, and still pays you.", "note"),
        S("A6", "PRODUCTION RATES (sq ft per hour)", "header"), S("B6", "", "header"), S("C6", "", "header"),
        S("A7", "Standard", "label"), N("B7", 1000, "input_int"), S("C7", "Maintenance clean of a kept-up home", "note"),
        S("A8", "Deep", "label"), N("B8", 500, "input_int"), S("C8", "First-time or seasonal deep clean", "note"),
        S("A9", "Move-Out", "label"), N("B9", 400, "input_int"), S("C9", "Empty house, inside everything", "note"),
        S("A12", "FREQUENCY MULTIPLIERS", "header"), S("B12", "", "header"), S("C12", "", "header"),
        S("A13", "One-Time", "label"), N("B13", 1.00, "input_num"),
        S("A14", "Weekly", "label"), N("B14", 0.85, "input_num"), S("C14", "Discount earned by route density, not generosity", "note"),
        S("A15", "Biweekly", "label"), N("B15", 0.90, "input_num"),
        S("A16", "Monthly", "label"), N("B16", 0.95, "input_num"), S("C16", "Monthly homes get dirty — small discount only", "note"),
        S("A19", "ADD-ON TIMES (hours)", "header"), S("B19", "", "header"), S("C19", "", "header"),
        S("A20", "Inside fridge", "label"), N("B20", 0.5, "input_num"),
        S("A21", "Inside oven", "label"), N("B21", 0.5, "input_num"),
        S("A22", "Interior windows", "label"), N("B22", 0.75, "input_num"), S("C22", "Reachable interior glass only", "note"),
        S("A23", "Laundry (1 load, wash/fold)", "label"), N("B23", 0.5, "input_num"),
    ]
    rs = {"name": "Rate Settings", "cells": rs_cells,
          "widths": {"A": 34, "B": 12, "C": 60},
          "merges": ["A1:C1", "A6:C6", "A12:C12", "A19:C19"]}

    ql_cells = [
        S("A1", "Date", "header"), S("B1", "Customer", "header"), S("C1", "Sq Ft", "header"),
        S("D1", "Type", "header"), S("E1", "Frequency", "header"), S("F1", "Quote Given ($)", "header"),
        S("G1", "Est. Hours", "header"), S("H1", "Effective $/hr", "header"), S("I1", "Won?", "header"),
        S("K1", "Close rate", "label"),
        F("L1", "IFERROR(COUNTIF(I2:I500,\"Won\")/COUNTA(I2:I500),\"\")", "output_pct"),
        S("K2", "Average quote", "label"),
        F("L2", "IFERROR(AVERAGE(F2:F500),\"\")", "output_money"),
        # sample rows
        D("A2", "2026-07-06"), S("B2", "Harmon, K.", "input"), N("C2", 1800, "input_int"),
        S("D2", "Standard", "input"), S("E2", "Biweekly", "input"), N("F2", 150, "input_money"),
        N("G2", 2.25, "input_num"), S("I2", "Won", "input"),
        D("A3", "2026-07-08"), S("B3", "Ellis, D.", "input"), N("C3", 2400, "input_int"),
        S("D3", "Deep", "input"), S("E3", "One-Time", "input"), N("F3", 315, "input_money"),
        N("G3", 5.25, "input_num"), S("I3", "Won", "input"),
        D("A4", "2026-07-10"), S("B4", "Trask, M.", "input"), N("C4", 1100, "input_int"),
        S("D4", "Standard", "input"), S("E4", "One-Time", "input"), N("F4", 130, "input_money"),
        N("G4", 1.50, "input_num"), S("I4", "Lost", "input"),
    ]
    for r in range(2, 501):
        ql_cells.append(F("H%d" % r, "IF(G%d=0,\"\",ROUND(F%d/G%d,2))" % (r, r, r), "output_money"))
    ql = {"name": "Quote Log", "cells": ql_cells, "freeze": True,
          "widths": {"A": 12, "B": 20, "C": 8, "D": 12, "E": 12, "F": 14, "G": 10, "H": 13, "I": 10, "K": 14, "L": 12},
          "autofilter": "A1:I500",
          "validations": [
              {"sqref": "D2:D500", "type": "list", "f1": "'Rate Settings'!$A$7:$A$9"},
              {"sqref": "E2:E500", "type": "list", "f1": "'Rate Settings'!$A$13:$A$16"},
              {"sqref": "I2:I500", "type": "list", "f1": '"Won,Lost,Pending"'},
          ]}
    write_xlsx(os.path.join(OUT, "route-ready-pricing-calculator.xlsx"), [start, calc, rs, ql])

# ================================================================ WB 2: Route Tracker
def build_route():
    start_text = (
        "Recurring Client & Route Tracker — how to use\n\n"
        "The roster is the business. This workbook keeps every recurring client in one tab, builds your "
        "Monday-Saturday route board from it, and shows you which route days earn and which ones are a car "
        "payment disguised as a schedule.\n\n"
        "1. Type only on the Clients tab (yellow columns). Every client gets a Zone and a Day — if you can't "
        "answer \"what day and what part of town,\" you don't have a route, you have a pile of appointments.\n\n"
        "2. Route Grid fills itself: booked hours per day on row 2, the client list for each day below. "
        "Red day = overbooked for a solo operator once you add drive time; green = healthy full day.\n\n"
        "3. Day Summary answers one question: what is each route day worth per month, and per hour? A day with "
        "5 clients at $58/booked-hour beats a day with 7 clients at $41/booked-hour. The fix for a weak day is "
        "almost never \"add more stops\" — it's re-zoning the scattered ones and re-pricing the old ones.\n\n"
        "Note: the \"Day Slot\" column on Clients is a helper the Route Grid reads — leave it alone. "
        "Yellow = input, green = formula output."
    )
    start = {"name": "Start Here", "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F20"], "widths": {c: 18 for c in "ABCDEF"}}

    cl_cells = [
        S("A1", "Client Name", "header"), S("B1", "Address", "header"), S("C1", "Zone", "header"),
        S("D1", "Frequency", "header"), S("E1", "Rate per Visit ($)", "header"), S("F1", "Day Assigned", "header"),
        S("G1", "Est. Visit Hours", "header"), S("H1", "Notes", "header"), S("I1", "Monthly Revenue ($)", "header"),
        S("J1", "Day Slot (helper — do not edit)", "header"),
        # sample rows
        S("A2", "Harmon, K.", "input"), S("B2", "412 Cedar Loop, Maple Grove", "input"),
        S("C2", "North", "input"), S("D2", "Biweekly", "input"), N("E2", 150, "input_money"),
        S("F2", "Tue", "input"), N("G2", 2.25, "input_num"),
        S("H2", "Dog (friendly), key under mat — replace with lockbox", "input"),
        S("A3", "Bishop Dental (office)", "input"), S("B3", "88 Commerce Way, Maple Grove", "input"),
        S("C3", "Core", "input"), S("D3", "Weekly", "input"), N("E3", 175, "input_money"),
        S("F3", "Thu", "input"), N("G3", 2.50, "input_num"),
        S("H3", "After 6pm only, alarm code in phone", "input"),
        S("A4", "Ortiz, R.", "input"), S("B4", "1509 Fairfield Dr, Lakewood", "input"),
        S("C4", "South", "input"), S("D4", "Monthly", "input"), N("E4", 220, "input_money"),
        S("F4", "Fri", "input"), N("G4", 3.00, "input_num"),
        S("H4", "Deep-ish monthly, garage entry 4482", "input"),
    ]
    for r in range(2, 201):
        cl_cells.append(F("I%d" % r,
            "IF(E{r}=\"\",\"\",E{r}*IF(D{r}=\"Weekly\",4.33,IF(D{r}=\"Biweekly\",2.17,1)))".format(r=r),
            "output_money"))
        cl_cells.append(F("J%d" % r,
            "IF(A{r}=\"\",\"\",F{r}&\"-\"&COUNTIF($F$2:F{r},F{r}))".format(r=r),
            "output"))
    clients = {"name": "Clients", "cells": cl_cells, "freeze": True,
               "widths": {"A": 22, "B": 30, "C": 10, "D": 12, "E": 14, "F": 12, "G": 14, "H": 42, "I": 18, "J": 14},
               "autofilter": "A1:J200",
               "validations": [
                   {"sqref": "C2:C200", "type": "list", "f1": '"North,South,East,West,Core"'},
                   {"sqref": "D2:D200", "type": "list", "f1": '"Weekly,Biweekly,Monthly"'},
                   {"sqref": "F2:F200", "type": "list", "f1": '"Mon,Tue,Wed,Thu,Fri,Sat"'},
               ]}

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    rg_cells = []
    for i, d in enumerate(days):
        L = colletter(i + 1)
        rg_cells.append(S(L + "1", d, "header"))
        rg_cells.append(F(L + "2", "SUMIFS(Clients!$G$2:$G$200,Clients!$F$2:$F$200,%s$1)" % L, "output_num"))
        for r in range(3, 23):
            rg_cells.append(F("%s%d" % (L, r),
                "IFERROR(INDEX(Clients!$A$2:$A$200,MATCH({L}$1&\"-\"&(ROW()-2),Clients!$J$2:$J$200,0)),\"\")".format(L=L),
                "output"))
    rg = {"name": "Route Grid", "cells": rg_cells,
          "widths": {c: 22 for c in "ABCDEF"},
          "cf": [{"sqref": "A2:F2", "rules": [
              {"type": "cellIs", "op": "greaterThan", "formulas": ["7"], "dxf": 1},
              {"type": "cellIs", "op": "between", "formulas": ["5", "7"], "dxf": 0},
          ]}]}

    ds_cells = [
        S("A1", "Day", "header"), S("B1", "Clients on Day", "header"), S("C1", "Booked Hours", "header"),
        S("D1", "Monthly Revenue ($)", "header"), S("E1", "Revenue per Booked Hour", "header"), S("F1", "Note", "header"),
    ]
    for i, d in enumerate(days):
        r = i + 2
        ds_cells += [
            S("A%d" % r, d, "label"),
            F("B%d" % r, "COUNTIF(Clients!$F$2:$F$200,A%d)" % r, "output"),
            F("C%d" % r, "SUMIFS(Clients!$G$2:$G$200,Clients!$F$2:$F$200,A%d)" % r, "output_num"),
            F("D%d" % r, "SUMIFS(Clients!$I$2:$I$200,Clients!$F$2:$F$200,A%d)" % r, "output_money"),
            F("E%d" % r, "IF(C{r}=0,\"\",ROUND((D{r}/4.33)/C{r},2))".format(r=r), "output_money"),
            F("F%d" % r, "IF(C{r}=0,\"open day\",IF(E{r}<50,\"weak day — tighten zone or raise rates\",\"\"))".format(r=r), "output"),
        ]
    ds_cells += [
        S("A8", "TOTAL (recurring monthly base)", "label"),
        F("D8", "SUM(D2:D7)", "output_money"),
        S("A10", "Tip: adjust the 50 in the Note column to about 80% of your target hourly from the pricing calculator.", "note"),
    ]
    ds = {"name": "Day Summary", "cells": ds_cells,
          "widths": {"A": 26, "B": 14, "C": 13, "D": 18, "E": 22, "F": 38},
          "merges": ["A10:F10"]}
    write_xlsx(os.path.join(OUT, "route-ready-route-tracker.xlsx"), [start, clients, rg, ds])

# ================================================================ WB 3: Income & Expense Tracker
INCOME_CATS = [("Cleaning revenue", "All service income"),
               ("Product sales", "If you sell anything (rare, fine to ignore)"),
               ("Other income", "Referral fees, rebates")]
EXPENSE_CATS = [("Supplies", "Chemicals, cloths, vacuum bags, mops — consumables"),
                ("Equipment", "Vacuums, machines; big purchases may be depreciated — ask your tax pro"),
                ("Vehicle / Mileage", "Log MILES in col H; dollar value computed at year level"),
                ("Insurance", "General liability, bonding"),
                ("Advertising", "Google/Facebook ads, flyers, car magnets, website"),
                ("Phone & Internet", "Business-use share"),
                ("Software & Subscriptions", "Scheduling app, accounting, this kit's future competitors"),
                ("Licenses & Permits", "Business license, city registrations"),
                ("Legal & Professional", "Tax prep, LLC filing help"),
                ("Contract Labor", "1099 help — talk to your tax pro before hiring"),
                ("Bank & Processing Fees", "Square/Stripe fees, account fees"),
                ("Uniforms & Laundry", "Branded shirts, shoe covers"),
                ("Other expense", "Anything that truly fits nowhere — keep this small")]

def build_income():
    start_text = (
        "Income & Expense Tracker — how to use\n\n"
        "One entry tab, everything else computes. Every dollar in or out gets one row on Entries, dated. "
        "Categories map to the common US Schedule C-style deduction buckets so tax time is a filter, not an "
        "archaeology dig.\n\n"
        "IMPORTANT: Categories are common deduction categories for a US sole proprietor — confirm everything "
        "with your tax pro. This sheet organizes your numbers; it is not tax advice.\n\n"
        "1. Entries: fill the yellow columns. Amount is always positive — the Type column carries the sign logic. "
        "For Vehicle / Mileage rows, log MILES DRIVEN in the Miles column (leave Amount 0).\n\n"
        "2. Categories: set up once. Update the IRS standard mileage rate each January.\n\n"
        "3. Monthly P&L and Year Dashboard build themselves.\n\n"
        "Habit that makes this work: enter every transaction within 48 hours. Ten minutes on Sunday beats "
        "four miserable days in April."
    )
    start = {"name": "Start Here", "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F22"], "widths": {c: 18 for c in "ABCDEF"}}

    en_cells = [
        S("A1", "Date", "header"), S("B1", "Type", "header"), S("C1", "Category", "header"),
        S("D1", "Description", "header"), S("E1", "Amount ($)", "header"), S("F1", "Payment Method", "header"),
        S("G1", "Month", "header"), S("H1", "Miles (if vehicle row)", "header"),
        S("J1", "Categories are common deduction categories for a US sole proprietor — confirm everything with "
                "your tax pro. This sheet organizes your numbers; it is not tax advice.", "note"),
        # sample rows
        D("A2", "2026-07-02"), S("B2", "Income", "input"), S("C2", "Cleaning revenue", "input"),
        S("D2", "Harmon — biweekly clean", "input"), N("E2", 150.00, "input_money"), S("F2", "Zelle", "input"),
        D("A3", "2026-07-02"), S("B3", "Expense", "input"), S("C3", "Supplies", "input"),
        S("D3", "Costco — microfiber, degreaser, bags", "input"), N("E3", 64.38, "input_money"), S("F3", "Card", "input"),
        D("A4", "2026-07-03"), S("B4", "Expense", "input"), S("C4", "Vehicle / Mileage", "input"),
        S("D4", "Route miles Mon–Fri", "input"), N("E4", 0.00, "input_money"), S("F4", "—", "input"),
        N("H4", 118, "input_int"),
        D("A5", "2026-07-05"), S("B5", "Expense", "input"), S("C5", "Advertising", "input"),
        S("D5", "Google Local Services ads", "input"), N("E5", 75.00, "input_money"), S("F5", "Card", "input"),
    ]
    for r in range(2, 1001):
        en_cells.append(F("G%d" % r, "IF(A%d=\"\",\"\",EOMONTH(A%d,0))" % (r, r), "output_month"))
    entries = {"name": "Entries", "cells": en_cells, "freeze": True,
               "widths": {"A": 12, "B": 10, "C": 22, "D": 36, "E": 12, "F": 15, "G": 12, "H": 18, "J": 60},
               "autofilter": "A1:H1000",
               "validations": [
                   {"sqref": "A2:A1000", "type": "date", "op": "between",
                    "f1": str(dserial("2000-01-01")), "f2": str(dserial("2099-12-31"))},
                   {"sqref": "B2:B1000", "type": "list", "f1": '"Income,Expense"'},
                   {"sqref": "C2:C1000", "type": "list", "f1": "Categories!$A$2:$A$30"},
                   {"sqref": "F2:F1000", "type": "list", "f1": '"Cash,Check,Card,Zelle,Venmo,Square,Other"'},
               ]}

    cat_cells = [
        S("A1", "Category", "header"), S("B1", "Type", "header"), S("C1", "What goes here", "header"),
        S("E2", "IRS standard mileage rate ($/mile)", "label"), N("F2", 0.70, "input_num"),
        S("G2", "Update yearly — check the current IRS standard mileage rate each January and type it here. "
                "Recent years have been around $0.65–0.70/mile.", "note"),
    ]
    r = 2
    for name, note in INCOME_CATS:
        cat_cells += [S("A%d" % r, name, "input"), S("B%d" % r, "Income", "input"), S("C%d" % r, note, "note")]
        r += 1
    for name, note in EXPENSE_CATS:
        cat_cells += [S("A%d" % r, name, "input"), S("B%d" % r, "Expense", "input"), S("C%d" % r, note, "note")]
        r += 1
    cats = {"name": "Categories", "cells": cat_cells,
            "widths": {"A": 26, "B": 10, "C": 60, "E": 30, "F": 10, "G": 55}}

    # Monthly P&L: income rows 3-5, expense rows 9-21, totals 6/22, net 23, miles 24, deduction 25
    pl_cells = [S("A1", "Category", "header")]
    for i in range(12):
        L = colletter(2 + i)
        if i == 0:
            pl_cells.append(F("B1", "DATE(2026,1,31)", "header_month"))
        else:
            prev = colletter(1 + i)
            pl_cells.append(F(L + "1", "EOMONTH(%s1,1)" % prev, "header_month"))
    pl_cells.append(S("A2", "INCOME", "label"))
    for i in range(3):
        pl_cells.append(F("A%d" % (3 + i), "Categories!A%d" % (2 + i), "output"))
    pl_cells.append(S("A6", "Total Income", "label"))
    pl_cells.append(S("A8", "EXPENSES", "label"))
    for i in range(13):
        pl_cells.append(F("A%d" % (9 + i), "Categories!A%d" % (5 + i), "output"))
    pl_cells += [S("A22", "Total Expenses", "label"), S("A23", "Net Profit", "label"),
                 S("A24", "Miles Driven", "label"), S("A25", "Mileage Deduction (est.)", "label")]
    for i in range(12):
        L = colletter(2 + i)
        for r in list(range(3, 6)) + list(range(9, 22)):
            pl_cells.append(F("%s%d" % (L, r),
                "SUMIFS(Entries!$E$2:$E$1000,Entries!$C$2:$C$1000,$A{r},Entries!$G$2:$G$1000,{L}$1)".format(r=r, L=L),
                "output_money"))
        pl_cells.append(F(L + "6", "SUM(%s3:%s5)" % (L, L), "output_money"))
        pl_cells.append(F(L + "22", "SUM(%s9:%s21)" % (L, L), "output_money"))
        pl_cells.append(F(L + "23", "%s6-%s22" % (L, L), "output_money"))
        pl_cells.append(F(L + "24", "SUMIFS(Entries!$H$2:$H$1000,Entries!$G$2:$G$1000,%s$1)" % L, "output_num"))
        pl_cells.append(F(L + "25",
            "ROUND(SUMIFS(Entries!$H$2:$H$1000,Entries!$G$2:$G$1000,{L}$1)*Categories!$F$2,2)".format(L=L),
            "output_money"))
    pl_cells.append(S("A27", "Mileage deduction shown for planning only — it is not included in Net Profit above "
                            "because it's a deduction, not a cash expense. Your tax pro reconciles this at filing.", "note"))
    pl = {"name": "Monthly P&L", "cells": pl_cells,
          "widths": dict([("A", 26)] + [(colletter(2 + i), 11) for i in range(12)]),
          "merges": ["A27:H27"],
          "cf": [{"sqref": "B23:M23", "rules": [
              {"type": "cellIs", "op": "lessThan", "formulas": ["0"], "dxf": 3}]}]}

    yd_cells = [
        S("A1", "YEAR DASHBOARD", "header"), S("B1", "", "header"),
        S("A2", "YTD Revenue", "label"),
        F("B2", "SUMIFS(Entries!$E$2:$E$1000,Entries!$B$2:$B$1000,\"Income\")", "output_money"),
        S("A3", "YTD Expenses", "label"),
        F("B3", "SUMIFS(Entries!$E$2:$E$1000,Entries!$B$2:$B$1000,\"Expense\")", "output_money"),
        S("A4", "YTD Net Profit", "label"), F("B4", "B2-B3", "output_money"),
        S("A5", "Profit Margin", "label"), F("B5", "IF(B2=0,\"\",B4/B2)", "output_pct"),
        S("A6", "YTD Miles", "label"), F("B6", "SUM(Entries!$H$2:$H$1000)", "output_num"),
        S("A7", "Est. Mileage Deduction", "label"), F("B7", "ROUND(B6*Categories!$F$2,2)", "output_money"),
        S("A8", "Best Month (profit)", "label"),
        F("B8", "IFERROR(TEXT(INDEX('Monthly P&L'!$B$1:$M$1,MATCH(MAX('Monthly P&L'!$B$23:$M$23),"
                "'Monthly P&L'!$B$23:$M$23,0)),\"MMM\"),\"\")", "output"),
        S("A9", "Tax set-aside (25% of net)", "label"),
        F("B9", "ROUND(MAX(B4,0)*0.25,2)", "output_money"),
        S("C9", "Rough set-aside so quarterly estimates don't ambush you; your tax pro sets the real number.", "note"),
        S("D1", "TOP EXPENSE CATEGORIES", "header"), S("E1", "", "header"), S("F1", "", "header"),
        S("D2", "Category", "label"), S("E2", "Total ($)", "label"), S("F2", "Rank (1 = biggest)", "label"),
        S("A11", "Tip: insert a column chart over the Monthly P&L Net Profit row (row 23, months on the X axis). "
                 "One glance tells you whether the business is growing or you're just busy.", "note"),
    ]
    for i in range(13):
        r = 3 + i
        yd_cells += [
            F("D%d" % r, "Categories!A%d" % (5 + i), "output"),
            F("E%d" % r, "SUMIFS(Entries!$E$2:$E$1000,Entries!$C$2:$C$1000,$D%d)" % r, "output_money"),
            F("F%d" % r, "IF(E{r}=0,\"\",RANK(E{r},$E$3:$E$15))".format(r=r), "output"),
        ]
    yd = {"name": "Year Dashboard", "cells": yd_cells,
          "widths": {"A": 26, "B": 14, "C": 40, "D": 26, "E": 12, "F": 16},
          "merges": ["D1:F1", "A11:F11"]}
    write_xlsx(os.path.join(OUT, "route-ready-income-expense-tracker.xlsx"),
               [start, entries, cats, pl, yd])

# ================================================================ WB 4: Job Costing
def build_jobcost():
    start_text = (
        "Job Costing Sheet — how to use\n\n"
        "Most operators know their quoted rate. Almost none know their TRUE HOURLY — what a job pays after you "
        "count the drive there, the drive to the next stop, and the supplies it burned. This sheet computes it "
        "per job and then ranks your clients by it, so you know exactly who to keep, who to re-price, and who "
        "to hand to a competitor you don't like.\n\n"
        "1. Job Log: one row per completed job, yellow columns only. Log it the same day — drive minutes "
        "evaporate from memory by morning. Use the exact same client spelling every time; the ranking tab "
        "groups on that text.\n\n"
        "2. Client Ranking builds itself from the log. Use the Rank column (1 = best true hourly) or the "
        "filter arrows to sort. Color bands: green above $55/hr, yellow $40-55 (survivable, not where you "
        "want to live), red under $40. Tune those bands to your market.\n\n"
        "3. Review monthly, act quarterly. Bottom client gets one of three moves: re-zone (move them to a day "
        "when you're already nearby), re-price (a $20 bump fixes most of these), or release. That slot is "
        "inventory, and inventory should earn.\n\n"
        "Drive time is the silent rate cut. Yellow = input, green = formula output. The \"Client #\" column on "
        "Job Log is a helper the ranking tab reads — leave it alone."
    )
    start = {"name": "Start Here", "cells": [S("A1", start_text, "wrap")],
             "merges": ["A1:F24"], "widths": {c: 18 for c in "ABCDEF"}}

    jl_cells = [
        S("A1", "Date", "header"), S("B1", "Client", "header"), S("C1", "Revenue ($)", "header"),
        S("D1", "On-Site Minutes", "header"), S("E1", "Drive Minutes", "header"),
        S("F1", "Supplies Cost ($)", "header"), S("G1", "Total Minutes", "header"),
        S("H1", "Total Hours", "header"), S("I1", "Net Revenue ($)", "header"),
        S("J1", "True Hourly ($/hr)", "header"), S("K1", "Client # (helper — do not edit)", "header"),
        # sample rows
        D("A2", "2026-07-07"), S("B2", "Harmon, K.", "input"), N("C2", 150.00, "input_money"),
        N("D2", 130, "input_int"), N("E2", 15, "input_int"), N("F2", 5.00, "input_money"),
        D("A3", "2026-07-07"), S("B3", "Ortiz, R.", "input"), N("C3", 220.00, "input_money"),
        N("D3", 175, "input_int"), N("E3", 40, "input_int"), N("F3", 8.00, "input_money"),
        D("A4", "2026-07-09"), S("B4", "Trask, M.", "input"), N("C4", 130.00, "input_money"),
        N("D4", 95, "input_int"), N("E4", 55, "input_int"), N("F4", 5.00, "input_money"),
        D("A5", "2026-07-10"), S("B5", "Bishop Dental", "input"), N("C5", 175.00, "input_money"),
        N("D5", 140, "input_int"), N("E5", 10, "input_int"), N("F5", 6.00, "input_money"),
    ]
    for r in range(2, 1001):
        jl_cells += [
            F("G%d" % r, "IF(B{r}=\"\",\"\",D{r}+E{r})".format(r=r), "output"),
            F("H%d" % r, "IF(B{r}=\"\",\"\",ROUND(G{r}/60,2))".format(r=r), "output_num"),
            F("I%d" % r, "IF(B{r}=\"\",\"\",C{r}-F{r})".format(r=r), "output_money"),
            F("J%d" % r, "IF(OR(B{r}=\"\",G{r}=0),\"\",ROUND(I{r}/H{r},2))".format(r=r), "output_money"),
            F("K%d" % r, "IF(B{r}=\"\",\"\",IF(COUNTIF($B$2:B{r},B{r})=1,MAX($K$1:K{p})+1,\"\"))".format(r=r, p=r - 1), "output"),
        ]
    jl = {"name": "Job Log", "cells": jl_cells, "freeze": True,
          "widths": {"A": 12, "B": 20, "C": 12, "D": 15, "E": 13, "F": 15, "G": 13, "H": 11, "I": 14, "J": 15, "K": 12},
          "autofilter": "A1:K1000",
          "cf": [{"sqref": "J2:J1000", "rules": [
              {"type": "cellIs", "op": "lessThan", "formulas": ["40"], "dxf": 1},
              {"type": "cellIs", "op": "between", "formulas": ["40", "55"], "dxf": 2},
              {"type": "cellIs", "op": "greaterThan", "formulas": ["55"], "dxf": 0},
          ]}]}

    cr_cells = [
        S("A1", "Client", "header"), S("B1", "Jobs", "header"), S("C1", "Revenue ($)", "header"),
        S("D1", "Supplies ($)", "header"), S("E1", "Total Min", "header"), S("F1", "Net Rev ($)", "header"),
        S("G1", "Total Hours", "header"), S("H1", "True Hourly ($/hr)", "header"),
        S("I1", "Verdict", "header"), S("J1", "Rank (1 = best)", "header"),
        S("A54", "Review monthly, act quarterly. Bottom client gets one of three moves: re-zone (move them to a "
                 "day when you're already nearby), re-price (a $20 bump fixes most of these), or release. You are "
                 "not obligated to keep a client whose real pay is under your floor — that slot is inventory, and "
                 "inventory should earn.", "note"),
    ]
    for r in range(2, 52):
        cr_cells += [
            F("A%d" % r, "IFERROR(INDEX('Job Log'!$B$2:$B$1000,MATCH(ROW()-1,'Job Log'!$K$2:$K$1000,0)),\"\")", "output"),
            F("B%d" % r, "IF($A{r}=\"\",\"\",COUNTIF('Job Log'!$B$2:$B$1000,$A{r}))".format(r=r), "output"),
            F("C%d" % r, "IF($A{r}=\"\",\"\",SUMIF('Job Log'!$B$2:$B$1000,$A{r},'Job Log'!$C$2:$C$1000))".format(r=r), "output_money"),
            F("D%d" % r, "IF($A{r}=\"\",\"\",SUMIF('Job Log'!$B$2:$B$1000,$A{r},'Job Log'!$F$2:$F$1000))".format(r=r), "output_money"),
            F("E%d" % r, "IF($A{r}=\"\",\"\",SUMIF('Job Log'!$B$2:$B$1000,$A{r},'Job Log'!$G$2:$G$1000))".format(r=r), "output"),
            F("F%d" % r, "IF($A{r}=\"\",\"\",SUMIF('Job Log'!$B$2:$B$1000,$A{r},'Job Log'!$I$2:$I$1000))".format(r=r), "output_money"),
            F("G%d" % r, "IF($A{r}=\"\",\"\",ROUND(E{r}/60,2))".format(r=r), "output_num"),
            F("H%d" % r, "IF(OR($A{r}=\"\",E{r}=0),\"\",ROUND(F{r}/G{r},2))".format(r=r), "output_money"),
            F("I%d" % r, "IF(H{r}=\"\",\"\",IF(H{r}>=55,\"KEEP — protect this slot\","
                         "IF(H{r}>=40,\"RE-PRICE at next renewal\",\"RE-PRICE OR RELEASE\")))".format(r=r), "output"),
            F("J%d" % r, "IF(H{r}=\"\",\"\",RANK(H{r},$H$2:$H$51))".format(r=r), "output"),
        ]
    cr = {"name": "Client Ranking", "cells": cr_cells,
          "widths": {"A": 20, "B": 8, "C": 13, "D": 13, "E": 11, "F": 13, "G": 12, "H": 16, "I": 28, "J": 14},
          "merges": ["A54:H57"],
          "autofilter": "A1:J51",
          "cf": [{"sqref": "H2:H51", "rules": [
              {"type": "cellIs", "op": "lessThan", "formulas": ["40"], "dxf": 1},
              {"type": "cellIs", "op": "between", "formulas": ["40", "55"], "dxf": 2},
              {"type": "cellIs", "op": "greaterThan", "formulas": ["55"], "dxf": 0},
          ]}]}
    write_xlsx(os.path.join(OUT, "route-ready-job-costing.xlsx"), [start, jl, cr])

if __name__ == "__main__":
    build_pricing()
    build_route()
    build_income()
    build_jobcost()
    print("done")
