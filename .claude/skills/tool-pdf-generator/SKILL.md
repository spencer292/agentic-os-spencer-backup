---
name: tool-pdf-generator
version: 1.2.0
description: >
  Generate clean, minimal PDFs from markdown content. Clean typography, readable layout, no design
  dependencies. Uses pandoc or weasyprint where available, with a Chrome-headless + Node fallback
  for Windows / locked-down machines (no installs). Use when: "generate PDF",
  "convert to PDF", "make a PDF", "export as PDF", "markdown to PDF". Also triggered in pipeline
  mode by 00-youtube-to-ebook and other systems that produce PDF output.
  Do NOT trigger for reading/extracting PDF content — that's a different tool.
---

# PDF Generator

Convert markdown content into clean, professionally typeset PDFs with minimal styling. Optimized for long-form reading — good typography, generous margins, readable line lengths.


## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}` to absolute paths set by the installer. Substitute these placeholders wherever they appear below.

## Outcome

A styled PDF file. Standalone mode saves to `{projects_base}/tool-pdf-generator/{YYYY-MM-DD}/{name}.pdf`. Pipeline mode saves to the calling system's render directory.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## tool-pdf-generator` | Past PDF generation feedback |

## Step 1: Check Prerequisites

Check for available PDF backends in order of preference:

1. **pandoc + weasyprint** — `command -v pandoc` and `python3 -c "import weasyprint"`
2. **Python weasyprint only** — `python3 -c "import weasyprint"` and `python3 -c "import markdown"`
3. **pandoc + pdflatex** — `command -v pandoc` and `command -v pdflatex`
4. **Chrome headless + Node** (no Python deps) — `command -v node` and a Chrome/Edge binary present. The reliable path on Windows, where weasyprint needs GTK and package installs are often blocked. See Step 3.

If none of 1–3 are available, do NOT assume failure — option 4 (Chrome + Node) works on a stock Windows box with no installs. Only run `scripts/setup.sh` if you genuinely need weasyprint/pandoc and installs are permitted.

## Step 2: Prepare Content

Accept markdown content as either:
- A file path to an existing `.md` file
- Raw markdown string (pipeline mode)

If the markdown has no title (no `# ` heading), extract one from the first paragraph or filename.

## Step 3: Generate PDF

Use the project's PDF generation script:

```bash
python3 .claude/skills/00-youtube-to-ebook/skill-pack/tools/md_to_pdf.py "{input_md}" "{output_pdf}"
```

**Branded theme (uses design tokens):**
```bash
python3 .claude/skills/00-youtube-to-ebook/skill-pack/tools/md_to_pdf.py "{input_md}" "{output_pdf}" --theme branded --tokens {brand_context}/visual-identity/tokens.json
```

The script handles:
- Markdown to HTML conversion
- CSS styling for clean typography (minimal) or from design tokens (branded)
- PDF rendering via weasyprint

If `.claude/skills/00-youtube-to-ebook/skill-pack/tools/md_to_pdf.py` is not available (standalone mode outside a system), fall back to:

```bash
pandoc "{input_md}" -o "{output_pdf}" --pdf-engine=weasyprint --css="{css_path}"
```

Or as last resort:
```bash
pandoc "{input_md}" -o "{output_pdf}" -V geometry:margin=1in -V fontsize=11pt
```

**Windows / no-weasyprint fallback (Chrome headless + Node) — verified working 2026-06-26:**

When weasyprint, python-markdown, and pandoc are all unavailable (common on Windows; installs often denied), render with Chrome:

0. A ready-made converter ships with this skill: `scripts/md2html.js` (`node scripts/md2html.js in.md out.html`). It implements everything in step 1 below — headings, pipe tables, fenced code, nested lists, blockquotes, frontmatter stripping, code-first escaping — plus a clean A4 serif stylesheet with a gold-accent h1. Use it as-is or copy and restyle the CSS block; only hand-write a new converter if the doc needs markdown features it lacks. Validated 2026-07-24 on a 9-document reference library.
1. Convert markdown → styled HTML with a small dependency-free Node script. Handle: headings, GitHub pipe tables, fenced code, blockquotes, lists, bold/italic/inline-code; strip YAML frontmatter; escape `& < >` *inside* code blocks first so ASCII/box-drawing diagrams aren't parsed as tables. Embed CSS with `@page { size: A4; margin: 18mm 16mm; }`, a serif body, and `table, pre, blockquote { page-break-inside: avoid; }`.
2. Print to PDF with Chrome (or Edge):
   ```bash
   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
     --no-pdf-header-footer --print-to-pdf="{output_pdf}" "file:///{absolute_html_path}"
   ```
   The `file://` URL needs forward slashes and the full absolute path.
3. There's usually no `pdftoppm` to rasterize for a visual check — verify STRUCTURALLY instead: grep the generated HTML for expected `<table>`/`<h2>`/`<h3>` counts, and confirm no frontmatter or unconverted `**` leaked through.

## Step 4: Review Every Page (mandatory)

A PDF is not done when it renders; it is done when every page has been LOOKED AT and
passes. This step exists because spot-checking failed in practice: a footer overlap
shipped to the user on 2026-07-02 after only the "dense" pages were reviewed, and a
thumbnail-scale glance missed a box running through a footer.

After the FINAL render (any edit after review invalidates the review — re-render and
re-review):

1. Screenshot the rendered HTML at full page scale: Chrome headless `--screenshot`
   with `--window-size=794,{page_count*1123}` (A4 at 96dpi).
2. Crop into individual pages with PIL at 1123px steps.
3. View EVERY page image at full size — never judge from the tall strip thumbnail;
   at that scale overlaps are invisible.
4. Check each page for: content colliding with the running header or footer; boxes or
   text clipped at the page edge; absolutely-positioned elements overlapping text
   (e.g. a centred footer icon vs a long footer line); `nowrap` lines clipping at a
   container edge; em dashes or other brand-rule violations in client-facing text.
5. Fix, re-render, and re-review every page whose layout inputs changed (a shared CSS
   edit means all pages using that class).

Only deliver when every page has passed on the final render.

## Step 5: Deliver

- Save PDF to the appropriate output directory
- Copy to `~/Downloads/` for easy access
- Show the full absolute file path

Always save output to disk. This is not optional.

## Step 6: Collect Feedback

Ask: "How does the PDF look? Any adjustments to formatting or layout?"

Log feedback to `context/learnings.md` under `## tool-pdf-generator` with date and context.

## Rules

- Default style: clean, minimal, optimized for reading (not presentation)
- Body font: serif, 11-12pt equivalent
- Line height: 1.5-1.6 for readability
- Margins: generous (at least 1 inch / 2.5cm)
- Max line width: ~70 characters for comfortable reading
- No headers/footers unless explicitly requested
- No cover page unless explicitly requested
- 2026-06-26: On Windows / locked-down machines the fallback is Chrome headless + a Node md→HTML step (Step 3) — weasyprint/pandoc are not installed and installs are blocked. Don't claim PDF generation is impossible; reach for Chrome.
- 2026-07-02: Visual verification without pdftoppm: Chrome headless `--screenshot` with `--window-size=794,{pages*1123}` captures the whole fixed-page document as one tall PNG; crop per page with PIL (installed) at 1123px steps and Read the crops. Caught a page-overflow that a structural grep could not. Note: Chrome cannot write to the 8.3-short-form scratchpad path (Access denied); use the long-form C:/Users/roy.castleman/... path.
- 2026-07-02: ATP branded docs: source logos ONLY from the official pack at `brand_context/Branding/ALL THE POWER LOGO/PNG/` — horizontal wordmark #01-08 (01 musk, 06 sky, 07 black, 08 white), icon+wordmark lockup #09-16, icon-only #17-24 (17 musk, 18 gold, 24 white outline). Firefly assets now carry official art (logo-musk=#01, logo-sky=#06, icon-musk=#17, icon-gold=#18, icon-white=#24).
- 2026-07-02: ROOT CAUSE of the "squashed logo" Roy caught (initially misdiagnosed as a bad asset): an `<img>` that is a DIRECT child of a column flex container gets cross-axis stretched to full width by the default `align-items:stretch`, distorting its aspect ratio — even with `height:Xmm;width:auto`. Fix: give the img `align-self:flex-start` or wrap it in a row-flex div. Check every logo/img inside `display:flex;flex-direction:column` containers; verify the rendered aspect ratio matches the source file's.
- 2026-07-04: Never size the review screenshot from `grep -c 'class="page"'` — compound classes (e.g. `class="page cover"`) make it undercount; the 9-page Firefly proposal counted as 6 and three pages went unreviewed until re-measured. Grep `'class="page'` (no closing quote), or better: screenshot tall, derive pages = image height ÷ 1123, and review them ALL. Also: Chrome `--screenshot` needs an ABSOLUTE output path (a relative path fails "Access is denied" even after cd; an absolute 8.3 short-form path works). And fixed-height A4 sections CLIP overflow silently (no reflow) — overflow eats the footer first, so check every page's footer is present at its normal height.

- 2026-08-13: Flowing (non-fixed-height) branded docs need `break-inside:avoid` on EVERY callout box (`.ask`, `.flag`, `.mark`, `.okn`, `.callsheet`, `.legend`) plus `break-after:avoid` on headings. Without it a dark recommendation panel split across a page boundary, and because an explicit `.pgbrk` followed it, page 3 rendered almost entirely blank. Rule of thumb: **never combine a manual page break with content that is allowed to split** — set the avoid rules and let the flow paginate itself. Caught by the mandatory page review on the Bob's Business audit; 7 pages became a clean 6.

## Self-Update

If the user flags an issue with the output — bad formatting, wrong fonts, broken layout — update the `## Rules` section in this SKILL.md immediately with the correction.
