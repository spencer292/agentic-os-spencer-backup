# _xlsx_engine.py — shared OOXML workbook writer for the Route Ready kits.
# Pure Python stdlib: hand-authored OOXML zipped into .xlsx. No openpyxl.
#
# Lifted verbatim from cleaning-kit/build-xlsx.py (which stays self-contained and
# untouched — it shipped and works). The PW and Lawn kits import this instead of
# carrying three copies of the same 240 lines that would drift apart on first edit.
#
# Cell tuple convention: (ref, kind, payload, style)
#   S/N/F/D build them. Yellow "input_*" styles = user types here.
#   Green "output_*" styles = formulas, never typed in.
import zipfile, os, datetime


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


def S(ref, text, style="default"):   return (ref, "s", text, style)
def N(ref, num, style="default"):    return (ref, "n", num, style)
def F(ref, formula, style="output"): return (ref, "f", formula, style)
def D(ref, iso, style="input_date"): return (ref, "n", dserial(iso), style)


# ---------------------------------------------------------------- styles
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
SIDX = {name: i for i, (name, *_) in enumerate(STYLES)}


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


def outdir(here):
    out = os.path.join(here, "deliverables")
    os.makedirs(out, exist_ok=True)
    return out
