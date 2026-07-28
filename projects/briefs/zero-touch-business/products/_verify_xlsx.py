# _verify_xlsx.py — shared stdlib sanity checks for generated kit workbooks.
# Same checks as cleaning-kit/verify-xlsx.py, parameterized by kit so PW and Lawn
# don't each carry a copy. Usage:
#   python ../_verify_xlsx.py <kit-dir>
# Each kit dir must contain an xlsx-expect.json: {filename: {sheets, min_formulas, min_dv}}
import zipfile, sys, os, json
import xml.dom.minidom as minidom

NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def verify(kit_dir):
    out = os.path.join(kit_dir, "deliverables")
    with open(os.path.join(kit_dir, "xlsx-expect.json"), encoding="utf-8") as fh:
        expect = json.load(fh)

    fails = 0
    for fname, exp in expect.items():
        path = os.path.join(out, fname)
        problems = []
        if not os.path.exists(path):
            print("%-48s FAIL  (missing)" % fname)
            fails += 1
            continue
        with zipfile.ZipFile(path) as z:
            names = z.namelist()
            docs = {}
            for n in names:
                try:
                    docs[n] = minidom.parseString(z.read(n))
                except Exception as e:
                    problems.append("XML parse fail %s: %s" % (n, e))
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
        print("%-48s %s  (sheets=%d formulas=%d validations=%d)" % (fname, status, nsheets, nf, ndv))
        for p in problems:
            print("   -", p)
            fails += 1
    print("VERIFIER:", "ALL GREEN" if not fails else "%d PROBLEM(S)" % fails)
    return 1 if fails else 0


if __name__ == "__main__":
    kit = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    sys.exit(verify(os.path.abspath(kit)))
