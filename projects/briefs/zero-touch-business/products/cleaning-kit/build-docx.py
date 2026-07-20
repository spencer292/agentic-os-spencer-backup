#!/usr/bin/env python3
"""
build-docx.py — Cleaning Business Starter Kit .docx generator (stdlib only).

Converts the kit's markdown sources into real Word documents (hand-authored
OOXML zipped with zipfile). No third-party packages. Word + Google Docs safe.

Usage:  python build-docx.py          # build all 10 docs, then verify
        python build-docx.py --verify # verify existing outputs only
"""

import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
OUT = os.path.join(HERE, "deliverables")

GREEN = "1A7F4B"
BODY = "262626"
GRAY = "7F7F7F"

# (source file, output file, document title)
DOCS = [
    ("06-residential-service-agreement.md", "route-ready-residential-service-agreement.docx",
     "Route Ready — Residential Cleaning Service Agreement"),
    ("07-commercial-cleaning-contract.md", "route-ready-commercial-cleaning-contract.docx",
     "Route Ready — Commercial Cleaning Services Contract"),
    ("08-client-intake-forms.md", "route-ready-client-intake-forms.docx",
     "Route Ready — Client Intake Forms"),
    ("09-quote-estimate-template.md", "route-ready-quote-estimate.docx",
     "Route Ready — Quote / Estimate Template"),
    ("10-invoice-template.md", "route-ready-invoice.docx",
     "Route Ready — Invoice Template"),
    ("11-client-welcome-packet.md", "route-ready-client-welcome-packet.docx",
     "Route Ready — Client Welcome Packet"),
    ("12-policies-and-letters.md", "route-ready-policies-and-letters.docx",
     "Route Ready — Policies & Letters"),
    ("13-cleaning-checklists.md", "route-ready-cleaning-checklists.docx",
     "Route Ready — Cleaning Checklists"),
    ("14-startup-checklist.md", "route-ready-startup-checklist.docx",
     "Route Ready — Startup Checklist"),
    ("05-lead-magnet-pricing-cheatsheet.md", "route-ready-pricing-cheat-sheet.docx",
     "Route Ready — Service Business Pricing Cheat Sheet"),
]

# ---------------------------------------------------------------- markdown ---

INLINE_PAT = re.compile(r"(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)")


def parse_inline(s):
    """Return list of runs: (text, bold, italic). Backticks stripped, \\* kept."""
    s = s.replace("\\*", "\x00")
    runs = []
    pos = 0
    for m in INLINE_PAT.finditer(s):
        if m.start() > pos:
            runs.append((s[pos:m.start()], False, False))
        tok = m.group(0)
        if tok.startswith("***"):
            runs.append((tok[3:-3], True, True))
        elif tok.startswith("**"):
            runs.append((tok[2:-2], True, False))
        elif tok.startswith("*"):
            runs.append((tok[1:-1], False, True))
        else:  # `code` -> plain literal
            runs.append((tok[1:-1], False, False))
        pos = m.end()
    if pos < len(s) or not runs:
        runs.append((s[pos:], False, False))
    runs = [(t.replace("\x00", "*"), b, i) for (t, b, i) in runs if t != ""]
    return runs or [("", False, False)]


TABLE_SEP = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$")


def is_table_row(line):
    return line.strip().startswith("|")


def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in line.split("|")]


def parse_markdown(text):
    """Parse the markdown subset into a list of block tuples."""
    # strip leading HTML comment header block
    text = re.sub(r"^﻿?\s*<!--.*?-->\s*\n", "", text, count=1, flags=re.S)
    lines = text.split("\n")
    # skip YAML frontmatter
    if lines and lines[0].strip() == "---" and any(
            l.strip() == "---" for l in lines[1:20]):
        # only treat as frontmatter if line 1 looks like "key: value"
        if len(lines) > 1 and re.match(r"^[A-Za-z_-]+\s*:", lines[1]):
            for j in range(1, len(lines)):
                if lines[j].strip() == "---":
                    lines = lines[j + 1:]
                    break

    blocks = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()
        if stripped == "":
            i += 1
            continue
        # table
        if is_table_row(line) and i + 1 < n and is_table_row(lines[i + 1]) \
                and TABLE_SEP.match(lines[i + 1].strip()):
            header = split_row(line)
            aligns = []
            for cell in split_row(lines[i + 1]):
                if cell.startswith(":") and cell.endswith(":"):
                    aligns.append("center")
                elif cell.endswith(":"):
                    aligns.append("right")
                else:
                    aligns.append("left")
            rows = [header]
            i += 2
            while i < n and is_table_row(lines[i]):
                if not TABLE_SEP.match(lines[i].strip()):
                    rows.append(split_row(lines[i]))
                i += 1
            blocks.append(("table", aligns, rows))
            continue
        # horizontal rule
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            blocks.append(("hr",))
            i += 1
            continue
        # headings
        m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if m:
            level = min(len(m.group(1)), 3)
            blocks.append(("h%d" % level, parse_inline(m.group(2).strip())))
            i += 1
            continue
        # blockquote
        if stripped.startswith(">"):
            content = stripped[1:].strip()
            if content == "":
                i += 1
                continue
            hm = re.match(r"^(#{1,6})\s+(.*)$", content)
            if hm:
                blocks.append(("quoteh", parse_inline(hm.group(2).strip())))
            else:
                blocks.append(("quote", parse_inline(content)))
            i += 1
            continue
        # checkbox
        m = re.match(r"^(\s*)- \[([ xX])\]\s*(.*)$", line)
        if m:
            lvl = min(len(m.group(1)) // 2, 2)
            mark = "☐" if m.group(2) == " " else "☑"
            blocks.append(("check", lvl, mark, parse_inline(m.group(3))))
            i += 1
            continue
        # bullet
        m = re.match(r"^(\s*)[-*]\s+(.*)$", line)
        if m:
            lvl = min(len(m.group(1)) // 2, 2)
            blocks.append(("bullet", lvl, parse_inline(m.group(2))))
            i += 1
            continue
        # numbered
        m = re.match(r"^(\s*)\d+\.\s+(.*)$", line)
        if m:
            lvl = min(len(m.group(1)) // 2, 2)
            new_list = not (blocks and blocks[-1][0] == "num")
            blocks.append(("num", lvl, new_list, parse_inline(m.group(2))))
            i += 1
            continue
        # plain paragraph (one source line = one paragraph; keeps form layout)
        blocks.append(("p", parse_inline(stripped)))
        i += 1
    return blocks

# ------------------------------------------------------------------- ooxml ---


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def run_xml(text, bold=False, italic=False, force_bold=False, force_italic=False,
            color=None, sz=None):
    props = []
    if bold or force_bold:
        props.append("<w:b/>")
    if italic or force_italic:
        props.append("<w:i/>")
    if color:
        props.append('<w:color w:val="%s"/>' % color)
    if sz:
        props.append('<w:sz w:val="%d"/><w:szCs w:val="%d"/>' % (sz, sz))
    rpr = "<w:rPr>%s</w:rPr>" % "".join(props) if props else ""
    return '<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>' % (rpr, esc(text))


def para_xml(runs, style=None, jc=None, ind_left=None, hanging=None,
             numid=None, ilvl=None, force_bold=False, force_italic=False,
             border_bottom=False, prefix=None, color=None, sz=None,
             space_after=None):
    ppr = []
    if style:
        ppr.append('<w:pStyle w:val="%s"/>' % style)
    if numid is not None:
        ppr.append('<w:numPr><w:ilvl w:val="%d"/><w:numId w:val="%d"/></w:numPr>'
                   % (ilvl or 0, numid))
    if border_bottom:
        ppr.append('<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" '
                   'w:color="%s"/></w:pBdr>' % GREEN)
    if space_after is not None:
        ppr.append('<w:spacing w:after="%d"/>' % space_after)
    if ind_left is not None:
        h = ' w:hanging="%d"' % hanging if hanging else ""
        ppr.append('<w:ind w:left="%d"%s/>' % (ind_left, h))
    if jc:
        ppr.append('<w:jc w:val="%s"/>' % jc)
    pprx = "<w:pPr>%s</w:pPr>" % "".join(ppr) if ppr else ""
    body = ""
    if prefix:
        body += run_xml(prefix, force_bold=force_bold, force_italic=force_italic,
                        color=color, sz=sz)
    for (t, b, it) in runs:
        body += run_xml(t, b, it, force_bold=force_bold,
                        force_italic=force_italic, color=color, sz=sz)
    return "<w:p>%s%s</w:p>" % (pprx, body)


def table_xml(aligns, rows):
    ncols = max(len(r) for r in rows)
    aligns = (aligns + ["left"] * ncols)[:ncols]
    header = rows[0]
    header_has_text = any(c.strip() for c in header)
    grid = "<w:tblGrid>%s</w:tblGrid>" % ("<w:gridCol/>" * ncols)
    borders = "".join(
        '<w:%s w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/>' % side
        for side in ("top", "left", "bottom", "right", "insideH", "insideV"))
    tblpr = ('<w:tblPr><w:tblW w:w="0" w:type="auto"/>'
             "<w:tblBorders>%s</w:tblBorders>"
             '<w:tblCellMar><w:left w:w="108" w:type="dxa"/>'
             '<w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr>'
             % borders)
    out = ["<w:tbl>", tblpr, grid]
    for ridx, row in enumerate(rows):
        cells = (row + [""] * ncols)[:ncols]
        is_head = ridx == 0 and header_has_text
        out.append("<w:tr>")
        for cidx, cell in enumerate(cells):
            tcpr = "<w:tcPr>"
            if is_head:
                tcpr += ('<w:shd w:val="clear" w:color="auto" w:fill="E7F2EC"/>')
            tcpr += "</w:tcPr>"
            jc = {"left": None, "center": "center", "right": "right"}[aligns[cidx]]
            p = para_xml(parse_inline(cell), jc=jc, force_bold=is_head,
                         space_after=40)
            out.append("<w:tc>%s%s</w:tc>" % (tcpr, p))
        out.append("</w:tr>")
    out.append("</w:tbl>")
    return "".join(out)


def build_document_xml(blocks, num_alloc):
    """num_alloc: dict mapping numbered-list start block index -> numId."""
    parts = []
    current_num_id = None
    for idx, blk in enumerate(blocks):
        kind = blk[0]
        if kind == "h1":
            parts.append(para_xml(blk[1], style="KitTitle"))
        elif kind == "h2":
            parts.append(para_xml(blk[1], style="KitH2"))
        elif kind == "h3":
            parts.append(para_xml(blk[1], style="KitH3"))
        elif kind == "p":
            parts.append(para_xml(blk[1], space_after=120))
        elif kind == "hr":
            parts.append(para_xml([("", False, False)], border_bottom=True,
                                  space_after=160))
        elif kind == "quote":
            parts.append(para_xml(blk[1], ind_left=432, force_italic=True,
                                  color="4A4A4A", space_after=120))
        elif kind == "quoteh":
            parts.append(para_xml(blk[1], ind_left=432, force_italic=True,
                                  force_bold=True, color=GREEN, space_after=120))
        elif kind == "bullet":
            lvl, runs = blk[1], blk[2]
            parts.append(para_xml(runs, numid=1, ilvl=lvl, space_after=60))
        elif kind == "check":
            lvl, mark, runs = blk[1], blk[2], blk[3]
            parts.append(para_xml(runs, prefix=mark + "  ",
                                  ind_left=360 + 360 * lvl, hanging=360,
                                  space_after=60))
        elif kind == "num":
            lvl, new_list, runs = blk[1], blk[2], blk[3]
            if new_list:
                current_num_id = num_alloc[idx]
            parts.append(para_xml(runs, numid=current_num_id, ilvl=lvl,
                                  space_after=60))
        elif kind == "table":
            parts.append(table_xml(blk[1], blk[2]))
            # empty spacer paragraph after each table (Word requires a <w:p>
            # between/after tables; also gives breathing room)
            parts.append('<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>')
    sectpr = ('<w:sectPr><w:footerReference w:type="default" r:id="rId3"/>'
              '<w:pgSz w:w="12240" w:h="15840"/>'
              '<w:pgMar w:top="1080" w:right="1080" w:bottom="1080" '
              'w:left="1080" w:header="720" w:footer="576" w:gutter="0"/>'
              "</w:sectPr>")
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/'
            'wordprocessingml/2006/main" xmlns:r="http://schemas.'
            'openxmlformats.org/officeDocument/2006/relationships">'
            "<w:body>%s%s</w:body></w:document>" % ("".join(parts), sectpr))


def build_numbering_xml(num_ids):
    """numId 1 = shared bullet list; each id in num_ids = decimal, restarts."""
    bullet_lvls = ""
    chars = ["•", "◦", "▪"]
    for lvl in range(3):
        bullet_lvls += (
            '<w:lvl w:ilvl="%d"><w:start w:val="1"/>'
            '<w:numFmt w:val="bullet"/><w:lvlText w:val="%s"/>'
            '<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="%d" w:hanging="360"/>'
            "</w:pPr></w:lvl>" % (lvl, chars[lvl], 360 + 360 * lvl))
    dec_lvls = ""
    for lvl in range(3):
        dec_lvls += (
            '<w:lvl w:ilvl="%d"><w:start w:val="1"/>'
            '<w:numFmt w:val="decimal"/><w:lvlText w:val="%%%d."/>'
            '<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="%d" w:hanging="360"/>'
            "</w:pPr></w:lvl>" % (lvl, lvl + 1, 360 + 360 * lvl))
    abstracts = (
        '<w:abstractNum w:abstractNumId="0">'
        '<w:multiLevelType w:val="hybridMultilevel"/>%s</w:abstractNum>'
        '<w:abstractNum w:abstractNumId="1">'
        '<w:multiLevelType w:val="hybridMultilevel"/>%s</w:abstractNum>'
        % (bullet_lvls, dec_lvls))
    nums = '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'
    for nid in num_ids:
        nums += ('<w:num w:numId="%d"><w:abstractNumId w:val="1"/>'
                 '<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/>'
                 "</w:lvlOverride></w:num>" % nid)
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:numbering xmlns:w="http://schemas.openxmlformats.org/'
            'wordprocessingml/2006/main">%s%s</w:numbering>'
            % (abstracts, nums))


STYLES_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/'
    '2006/main">'
    "<w:docDefaults><w:rPrDefault><w:rPr>"
    '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'
    '<w:color w:val="' + BODY + '"/>'
    '<w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault>'
    "<w:pPrDefault><w:pPr>"
    '<w:spacing w:after="120" w:line="264" w:lineRule="auto"/>'
    "</w:pPr></w:pPrDefault></w:docDefaults>"
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">'
    '<w:name w:val="Normal"/></w:style>'
    '<w:style w:type="paragraph" w:styleId="KitTitle">'
    '<w:name w:val="Title"/><w:basedOn w:val="Normal"/>'
    '<w:pPr><w:spacing w:before="120" w:after="160"/>'
    '<w:outlineLvl w:val="0"/></w:pPr>'
    '<w:rPr><w:b/><w:color w:val="' + GREEN + '"/>'
    '<w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>'
    '<w:style w:type="paragraph" w:styleId="KitH2">'
    '<w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>'
    '<w:pPr><w:spacing w:before="240" w:after="80"/>'
    '<w:outlineLvl w:val="1"/></w:pPr>'
    '<w:rPr><w:b/><w:color w:val="' + GREEN + '"/>'
    '<w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>'
    '<w:style w:type="paragraph" w:styleId="KitH3">'
    '<w:name w:val="heading 3"/><w:basedOn w:val="Normal"/>'
    '<w:pPr><w:spacing w:before="180" w:after="60"/>'
    '<w:outlineLvl w:val="2"/></w:pPr>'
    '<w:rPr><w:b/><w:color w:val="404040"/>'
    '<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>'
    "</w:styles>")

FOOTER_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/'
    '2006/main">'
    '<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="0"/></w:pPr>'
    '<w:r><w:rPr><w:color w:val="' + GRAY + '"/>'
    '<w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>'
    '<w:t xml:space="preserve">Route Ready — routereadykits.com</w:t>'
    "</w:r></w:p></w:ftr>")

CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/'
    'content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-'
    'package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/word/document.xml" ContentType="application/vnd.'
    'openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.'
    'openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.'
    'openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
    '<Override PartName="/word/footer1.xml" ContentType="application/vnd.'
    'openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.'
    'openxmlformats-package.core-properties+xml"/>'
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.'
    'openxmlformats-officedocument.extended-properties+xml"/>'
    "</Types>")

ROOT_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/'
    'relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/'
    'officeDocument/2006/relationships/officeDocument" '
    'Target="word/document.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/'
    '2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/'
    'officeDocument/2006/relationships/extended-properties" '
    'Target="docProps/app.xml"/>'
    "</Relationships>")

DOC_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/'
    'relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/'
    'officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/'
    'officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/'
    'officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
    "</Relationships>")

APP_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/'
    '2006/extended-properties">'
    "<Application>Route Ready Kit Builder</Application></Properties>")


def core_xml(title):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/'
        'package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        "<dc:title>%s</dc:title><dc:creator>Route Ready</dc:creator>"
        '<dcterms:created xsi:type="dcterms:W3CDTF">%s</dcterms:created>'
        '<dcterms:modified xsi:type="dcterms:W3CDTF">%s</dcterms:modified>'
        "</cp:coreProperties>" % (esc(title), now, now))

# ------------------------------------------------------------------- build ---


def build_doc(src_path, out_path, title):
    with open(src_path, "r", encoding="utf-8") as f:
        text = f.read()
    blocks = parse_markdown(text)
    # allocate a fresh numId (restarting at 1) per numbered list
    num_alloc = {}
    next_id = 2
    for idx, blk in enumerate(blocks):
        if blk[0] == "num" and blk[2]:  # new_list flag
            num_alloc[idx] = next_id
            next_id += 1
    doc_xml = build_document_xml(blocks, num_alloc)
    numbering = build_numbering_xml(sorted(num_alloc.values()))
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", ROOT_RELS)
        z.writestr("docProps/core.xml", core_xml(title))
        z.writestr("docProps/app.xml", APP_XML)
        z.writestr("word/document.xml", doc_xml)
        z.writestr("word/styles.xml", STYLES_XML)
        z.writestr("word/numbering.xml", numbering)
        z.writestr("word/footer1.xml", FOOTER_XML)
        z.writestr("word/_rels/document.xml.rels", DOC_RELS)
    return blocks

# ------------------------------------------------------------------ verify ---

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
BAD_ARTIFACTS = ["**", "|---", "##", "<!--", "- [ ]", "](http"]


def verify_doc(src_path, out_path):
    errors = []
    with open(src_path, "r", encoding="utf-8") as f:
        src_text = f.read()
    blocks = parse_markdown(src_text)
    src_tables = sum(1 for b in blocks if b[0] == "table")
    src_paras = sum(1 for b in blocks if b[0] != "table")
    src_has_checkbox = "- [ ]" in src_text or "☐" in src_text
    src_has_attorney = "Have a local attorney review before use." in src_text

    with zipfile.ZipFile(out_path) as z:
        names = z.namelist()
        for name in names:
            if name.endswith(".xml") or name.endswith(".rels"):
                try:
                    ET.fromstring(z.read(name))
                except ET.ParseError as e:
                    errors.append("%s: XML parse error: %s" % (name, e))
        doc = ET.fromstring(z.read("word/document.xml"))
        footer = z.read("word/footer1.xml").decode("utf-8")

    body = doc.find(W + "body")
    n_paras = len(body.findall(".//" + W + "p"))
    n_tables = len(body.findall(".//" + W + "tbl"))
    if n_paras < max(10, int(src_paras * 0.9)):
        errors.append("paragraph count %d < expected ~%d" % (n_paras, src_paras))
    if n_tables != src_tables:
        errors.append("table count %d != source %d" % (n_tables, src_tables))

    # per-paragraph text: no raw markdown artifacts
    for p in body.findall(".//" + W + "p"):
        ptext = "".join(t.text or "" for t in p.findall(".//" + W + "t"))
        for bad in BAD_ARTIFACTS:
            if bad in ptext:
                errors.append("raw artifact %r in text: %r" % (bad, ptext[:80]))

    full_text = "".join(t.text or ""
                        for t in body.findall(".//" + W + "t"))
    if src_has_checkbox and "☐" not in full_text:
        errors.append("source has checkboxes but no ☐ glyph in output")
    if src_has_attorney and \
            "Have a local attorney review before use." not in full_text:
        errors.append("attorney-review sentence missing from output")
    if not src_has_attorney and \
            "Have a local attorney review before use." in full_text:
        errors.append("attorney-review sentence added where source lacks it")
    if "routereadykits.com" not in footer:
        errors.append("footer missing Route Ready branding")
    return errors, n_paras, n_tables


def main():
    verify_only = "--verify" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    all_ok = True
    for src_name, out_name, title in DOCS:
        src_path = os.path.join(SRC, src_name)
        out_path = os.path.join(OUT, out_name)
        if not verify_only:
            build_doc(src_path, out_path, title)
        errors, n_paras, n_tables = verify_doc(src_path, out_path)
        status = "OK " if not errors else "FAIL"
        print("[%s] %s  (%d paragraphs, %d tables)"
              % (status, out_name, n_paras, n_tables))
        for e in errors:
            print("       - " + e)
            all_ok = False
    print("\nVERIFIER: " + ("ALL GREEN" if all_ok else "FAILURES FOUND"))
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
