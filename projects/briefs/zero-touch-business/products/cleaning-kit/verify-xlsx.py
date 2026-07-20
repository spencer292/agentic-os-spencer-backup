# verify-xlsx.py — stdlib sanity checks for the generated kit workbooks
import zipfile, sys, os, re
import xml.dom.minidom as minidom

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "deliverables")

EXPECT = {
    "route-ready-pricing-calculator.xlsx": {"sheets": 4, "min_formulas": 400, "min_dv": 5},
    "route-ready-route-tracker.xlsx":      {"sheets": 4, "min_formulas": 500, "min_dv": 3},
    "route-ready-income-expense-tracker.xlsx": {"sheets": 5, "min_formulas": 1100, "min_dv": 4},
    "route-ready-job-costing.xlsx":        {"sheets": 3, "min_formulas": 5000, "min_dv": 0},
}

NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
fails = 0

for fname, exp in EXPECT.items():
    path = os.path.join(OUT, fname)
    problems = []
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        # (a) all XML parses
        docs = {}
        for n in names:
            try:
                docs[n] = minidom.parseString(z.read(n))
            except Exception as e:
                problems.append("XML parse fail %s: %s" % (n, e))
        # (b) every sheet referenced in workbook.xml exists
        wb = docs.get("xl/workbook.xml")
        rels = docs.get("xl/_rels/workbook.xml.rels")
        rid_target = {}
        if rels:
            for rel in rels.getElementsByTagName("Relationship"):
                rid_target[rel.getAttribute("Id")] = rel.getAttribute("Target")
        nsheets = 0
        if wb:
            for sh in wb.getElementsByTagName("sheet"):
                nsheets += 1
                rid = sh.getAttributeNS(NS_R, "id") or sh.getAttribute("r:id")
                tgt = rid_target.get(rid)
                if not tgt or ("xl/" + tgt) not in names:
                    problems.append("sheet %r -> missing part %r" % (sh.getAttribute("name"), tgt))
        if nsheets != exp["sheets"]:
            problems.append("expected %d sheets, found %d" % (exp["sheets"], nsheets))
        # (c) formula count and (d) no '=' prefix
        nf, ndv = 0, 0
        for n in names:
            if not n.startswith("xl/worksheets/"):
                continue
            for f in docs[n].getElementsByTagName("f"):
                nf += 1
                txt = "".join(t.data for t in f.childNodes if t.nodeType == t.TEXT_NODE)
                if txt.startswith("="):
                    problems.append("formula starts with '=' in %s: %s" % (n, txt[:60]))
            ndv += len(docs[n].getElementsByTagName("dataValidation"))
        if nf < exp["min_formulas"]:
            problems.append("formula count %d < min %d" % (nf, exp["min_formulas"]))
        if ndv < exp["min_dv"]:
            problems.append("dataValidation count %d < min %d" % (ndv, exp["min_dv"]))
    status = "OK" if not problems else "FAIL"
    print("%-45s %s  (sheets=%d formulas=%d validations=%d)" % (fname, status, nsheets, nf, ndv))
    for p in problems:
        print("   -", p)
        fails += 1

sys.exit(1 if fails else 0)
