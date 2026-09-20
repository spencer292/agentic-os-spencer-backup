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

1. Convert markdown → styled HTML with a small dependency-free Node script. Handle: headings, GitHub pipe tables, fenced code, blockquotes, lists, bold/italic/inline-code; strip YAML frontmatter; escape `& < >` *inside* code blocks first so ASCII/box-drawing diagrams aren't parsed as tables. Embed CSS with `@page { size: A4; margin: 18mm 16mm; }`, a serif body, and `table, pre, blockquote { page-break-inside: avoid; }`.
2. Print to PDF with Chrome (or Edge):
   ```bash
   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
     --no-pdf-header-footer --print-to-pdf="{output_pdf}" "file:///{absolute_html_path}"
   ```
   The `file://` URL needs forward slashes and the full absolute path.
3. There's usually no `pdftoppm` to rasterize for a visual check — verify STRUCTURALLY instead: grep the generated HTML for expected `<table>`/`<h2>`/`<h3>` counts, and confirm no frontmatter or unconverted `**` leaked through.

## Step 4: Deliver

- Save PDF to the appropriate output directory
- Copy to `~/Downloads/` for easy access
- Show the full absolute file path

Always save output to disk. This is not optional.

## Step 5: Collect Feedback

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

## Self-Update

If the user flags an issue with the output — bad formatting, wrong fonts, broken layout — update the `## Rules` section in this SKILL.md immediately with the correction.
