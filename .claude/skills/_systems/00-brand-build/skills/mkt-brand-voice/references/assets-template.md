# Visual Assets Template

This is the canonical format for `<project_root>/{brand_context}/assets.md` — the brand's visual identity. Consumed by `00-social-content` v2.0.0+ for template-based carousels and AI image generation.

All four core sections (Colors, Sketch Style, Logo, Author) should be present. Use empty placeholders or `unknown` when info isn't available — never omit a section.

---

```markdown
## Last Updated
{YYYY-MM-DD} by {source: brand-voice auto-scrape | manual | onboarding}

# {Brand or Person Name} — Visual Assets

## Colors

Brand palette as hex codes. Used by HTML templates AND AI prompt brand-token blocks.

- **Primary:** `#RRGGBB` — {1-line note: e.g., "headlines, primary buttons"}
- **Secondary:** `#RRGGBB` — {note: e.g., "accent, highlights"}
- **Background:** `#RRGGBB` — {note: e.g., "slide background — usually white #FFFFFF or near-black #0A0A0A"}
- **Text:** `#RRGGBB` — {note: e.g., "body copy color"}

Optional additional palette colors:
- **Accent 1:** `#RRGGBB` — {note}
- **Accent 2:** `#RRGGBB` — {note}

## Sketch Style

Color and style for hand-drawn annotations on content slides (used by Bold Statement / Technical Annotation / Notebook templates).

- **Sketch color:** `#RRGGBB` — {e.g., "red #E63946 for emphasis"}
- **Sketch weight:** {thin / medium / heavy}
- **Sketch personality:** {clean / loose / scribbled / surgical} — {1-line note on the feel}

## Logo

Logo file(s) used in front/CTA slides and corner overlays.

- **Primary logo path:** `<absolute or project-relative path>` — {format: PNG/SVG/JPG}
- **Logo on dark background:** `<path>` — {if different — e.g., white version for dark slides}
- **Preferred placement:** {top-left / top-right / bottom-left / bottom-right / center} — {default position on slides}
- **Preferred size:** {percentage of slide width, e.g., "8% width"}
- **Alt text:** {accessibility text describing the logo}

If logo not yet available: `Not yet — skip logo on slides until file is provided.`

## Author

Author signature shown in "Written by" pills and CTA slides.

- **Display name:** {e.g., "Simon Scrapes" or "Acme Co."}
- **Handle (optional):** {e.g., "@simonscrapes" — used in CTA "Follow me at..."}
- **Headshot path (optional):** `<path>` — {if a small photo should appear next to the name}

## Mood (AI Prompt Block)

This block is concatenated into every AI image generation prompt as the brand-tokens header. Keep it short, descriptive, and prompt-friendly.

```
Brand: {Brand Name}.
Palette: {primary hex} primary, {secondary hex} accent, {background hex} background, {text hex} text.
Sketch annotations: {sketch color hex}, {weight/personality}.
Mood: {3-5 adjectives — e.g., "confident, modern, fintech, urban, premium"}.
Art direction: consistent campaign — slide N of M.
```

## Visual References (Optional)

Links to inspiring visual references. Used as soft prompt hints, NOT as reference images (unless Mode B / Mode C is explicitly selected).

- {URL or local path} — {1-line description of what to take from it}
- {URL or local path} — {description}

## Fonts (Optional — for v2.1.0+)

Reserved for future iteration. Current templates use system fonts with sensible defaults.

- **Headline:** {font family}
- **Body:** {font family}
- **Source:** {Google Fonts URL / local path / system}
```

---

## Schema rules

1. **All hex codes lowercase, 6 digits, with `#` prefix.** (`#a1b2c3`, not `#A1B2C3` or `a1b2c3`.)
2. **The Mood block is the only multi-line code block in the file.** It's parsed verbatim and injected into AI prompts.
3. **File paths can be absolute, project-relative, or `unknown`.** Loader resolves project-relative paths against `<project_root>`.
4. **Sections may have arbitrary `## Other` blocks after the canonical ones** — ignored by the loader, useful for user notes.
5. **Empty values:** Use `unknown` (lowercase), `tbd`, or leave the bullet line. Never delete the section header.

## Loader extraction (informational — for skill implementers)

The orchestrator extracts a structured `brand_kit` object from `assets.md`:

```yaml
colors:
  primary: "#hex"        # required (fall back to #000000 if unknown)
  secondary: "#hex"      # required (fall back to primary)
  background: "#hex"     # required (fall back to #ffffff)
  text: "#hex"           # required (fall back to #0a0a0a)
  accents: ["#hex", ...] # optional list
sketch:
  color: "#hex"          # required (fall back to primary)
  weight: "thin|medium|heavy"
  personality: "string"
logo:
  primary_path: "path|null"
  dark_variant_path: "path|null"
  placement: "top-left|top-right|bottom-left|bottom-right|center"
  size_pct_width: 8
  alt: "string"
author:
  display_name: "string"
  handle: "string|null"
  headshot_path: "path|null"
mood_block: "verbatim text from the Mood code block"
visual_refs: ["url|path", ...]
```

Parser is liberal — missing fields fall back to sensible defaults. The Mood block is grabbed verbatim and injected into every AI prompt as the brand-tokens header.
