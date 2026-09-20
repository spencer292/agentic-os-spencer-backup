# Visual Brandbook — Interactive Q&A Flow

Chat-driven flow for populating `{brand_context}/assets.md` + visual asset folders. Claude validates each input as you go — no local server or UI required.

---

## Outcome

After running this flow, the following must exist under `<project_root>/{brand_context}/`:

- `assets.md` — populated with the schema from `assets-template.md`
- `logos/` (optional but recommended) — at least one logo file
- `fonts/`, `icons/`, `templates/`, `visual_refs/` — populated as the user provides files
- Mood block — auto-generated from the palette, editable

The output schema MUST match `assets-template.md`.

---

## When to invoke

- User picks "Interactive Q&A" in Step 8 of `SKILL.md`
- User explicitly asks "set up brand visuals via chat" or "no UI, just ask me"

---

## File handling

Whenever the user provides a file path or an attachment, copy it into the right subfolder:

```
brand_context/
  logos/        ← .png .jpg .svg .webp
  fonts/        ← .ttf .otf .woff .woff2
  icons/        ← .svg .png .jpg .webp
  templates/    ← .png .jpg .html .pdf .webp
  visual_refs/  ← .png .jpg .svg .webp .pdf
```

Use `cp` (Bash) or the equivalent. Sanitize filenames: ASCII only, no spaces (`my logo.png` → `my-logo.png`). After copy, record the relative path (`logos/my-logo.png`) in the right field of `assets.md`.

If the user paste-drops files into the chat (image attachment), save them via the Write tool with raw bytes, then reference the saved path.

If the user has nothing to upload for a section (no logo file yet, no custom fonts), set the corresponding `assets.md` field to `unknown` — never invent a path.

---

## Question sequence

Run these in order. Skip any section the user says they want to defer — record `unknown` in `assets.md` and continue.

### 1. Brand identity (free text)

Ask plainly. Single message, parse the answers from the reply.

> "Let's set up your brand visuals. First, the basics:
> - **Brand name** (how it appears on slides)
> - **Author display name** (e.g., your name or company — shown in 'Written by' pills)
> - **Handle** (optional — e.g., @yourbrand)"

### 2. Colors (free text — hex codes)

Ask all four core colors in one message. Show examples so users understand the slots.

> "Now your palette. I need 4 hex codes:
> - **Primary** — main brand color (headlines, primary buttons). Example: `#0a0a0a`
> - **Secondary** — accents, decorative elements. Example: `#e0e0e0`
> - **Background** — slide background. Off-white `#f5f5f5` or dark `#0a0a0a` are common.
> - **Text** — body copy. Usually contrasts with background.
>
> Paste them in any format — I'll parse. Want to add accent colors too? Just include them."

**Validation:** if any value isn't a valid hex, ask again for that one specifically. Normalize to lowercase 6-digit `#aabbcc` format.

### 3. Sketch style (AskUserQuestion + free text follow-up)

For weight and personality, use `AskUserQuestion` with these two questions in one batch:

```
question 1: "How thick should hand-drawn annotations be?"
header: "Sketch weight"
options:
  - thin — fine pen lines
  - medium — marker thickness (recommended)
  - heavy — thick strokes, bold emphasis

question 2: "What's the sketch personality?"
header: "Sketch style"
options:
  - clean — neat, geometric, intentional
  - loose — hand-drawn, intentionally imperfect (recommended)
  - scribbled — chaotic, energetic
  - surgical — precise, ruler-straight
```

Then ask in free text:

> "Sketch color? Hex code (often the primary accent — `#e63946` red is a common pick). Plus a 1-line note on when sketches are used (default: 'emphasis on screenshots')."

### 4. Logo (file upload + AskUserQuestion + free text)

> "Do you have a logo file? Paste the path or attach it — I'll save it to `brand_context/logos/`.
> - **Primary logo**
> - **Dark-background variant** (white/light version for use on dark slides — optional)"

If no logo yet → set both paths to `unknown`, continue. Don't block.

For placement and size, use `AskUserQuestion`:

```
question 1: "Where should the logo appear on slides?"
header: "Logo position"
options:
  - top-left (recommended)
  - top-right
  - bottom-left
  - bottom-right
  - center

question 2: "How big should it be relative to slide width?"
header: "Logo size"
options:
  - 6% — subtle corner mark
  - 8% — standard (recommended)
  - 12% — prominent
  - 16% — large, hero-style
```

Then free text:

> "Alt text for accessibility (1 short sentence describing the logo)?"

### 5. Fonts (file upload + free text)

> "Custom fonts? If you have TTF/OTF/WOFF files for headline and body, paste the paths or attach them — I'll save to `brand_context/fonts/`.
>
> Then tell me:
> - Headline family name (e.g., 'Inter Bold')
> - Body family name (e.g., 'Inter Regular')
> - Source: Google Fonts URL, vendor license, or 'uploaded' if you provided files
>
> Skip if you want to use system defaults."

### 6. Icons (multi-file upload)

> "Got a set of icons you want available for slides? Drop the files (SVG preferred) or paste paths — I'll save to `brand_context/icons/`. The designer can reference them by filename stem when slides mention specific entities or concepts.
>
> Optional: a 1-line note per icon describing what it represents."

If batch upload, accept all and ask the note question only for ambiguous filenames (e.g., `icon-1.svg` needs a note; `claude-logo.svg` doesn't).

### 7. Templates (multi-file upload)

> "Any layout references you love? Screenshots of slides/posts you want me to take cues from — drop the files or paste paths, I'll save to `brand_context/templates/`. These are soft hints for the designer.
>
> Optional: when each template applies (e.g., 'hook slides', 'data viz')."

### 8. Visual references (free text — URLs)

> "Any inspiration URLs? Pinterest boards, posts, sites — paste them with 1-line notes. These get listed in `assets.md` as soft hints. Skip if none."

Accept any number, store as `{url, note}` pairs.

### 8b. Design tokens (type scale, spacing, layout)

Tokens are structural — they govern proportions, grids, motion. Beginners can skip this entirely; the loader falls back to `mkt-brand-voice/references/defaults/anthropic-ish/tokens.md`.

**Decision question first** — use `AskUserQuestion`:

```
question: "Want to adjust the design tokens (type scale, spacing, grid)?"
header: "Tokens"
options:
  - keep-defaults — Use the Anthropic-ish default (recommended for MVP)
  - tune-tone — Just tweak the overall vibe (editorial/bold/playful/minimal)
  - full-custom — I want to define each token
```

If `keep-defaults` → skip to step 9. Write `tokens.md` by copying `defaults/anthropic-ish/tokens.md` verbatim.

If `tune-tone` → ask ONE question:

```
question: "What's the overall vibe?"
header: "Tone"
options:
  - editorial — Serif display, generous space, refined (Anthropic-ish, The Gentlewoman)
  - bold — Heavy weights, tight space, high contrast (Apple keynote, sports brands)
  - playful — Mixed weights, irregular space, color-forward (Stripe, Notion)
  - minimal — One weight, lots of space, monochrome (Linear, Mercury)
```

Apply preset tokens for the chosen tone. Each preset is a small variation of the defaults — only type weights, density, and tracking change. Persist to `tokens.md`.

If `full-custom` → walk through these questions:

**Q1 — canvas:**
```
question: "Slide aspect ratio?"
header: "Canvas"
options:
  - 4:5 portrait (1080×1350) — LinkedIn/Instagram carousel (recommended)
  - 1:1 square (1080×1080) — classic Instagram feed
  - 9:16 story (1080×1920) — Stories, Reels
  - Custom — paste WIDTHxHEIGHT
```

**Q2 — type scale** (free text):

> "Type scale in px. Confirm or adjust (you can say 'use default'):
> - Display: 96 (hero, cover)
> - H1: 64 (section openers)
> - H2: 48 (slide titles)
> - Body M: 18 (standard copy)
> - Caption: 11 (eyebrows, footers)"

Validate inputs — must be positive integers, ordered descending. If user says "use default", load the defaults verbatim.

**Q3 — density:**
```
question: "Visual density of the slides?"
header: "Density"
options:
  - sparse — Lots of air, focus on 1 idea per slide (recommended for LinkedIn)
  - balanced — Balanced default
  - dense — More info per slide (data viz, long lists)
```

**Q4 — motion** (optional, only ask if user mentioned video/animated output):

> "Will you use this for video/slide-to-video? If so, what's the default transition duration between slides? (default: 480ms; slower = elegant; faster = energetic)"

### Writing tokens.md

After answers, write `<project_root>/{brand_context}/tokens.md` following `tokens-template.md` schema. Required sections in order:

1. `## Last Updated`
2. `# {Brand} — Design Tokens`
3. `## Type Scale` + sub-section `### Type rules`
4. `## Spacing Scale` + sub-section `### Padding rules`
5. `## Layout Grid` + sub-section `### Grid rules`
6. `## Motion` (if asked)
7. `## Density & Tone`
8. `## Visual Aspect Ratios (per skill)`

Always include the YAML loader extraction example at the bottom of `tokens-template.md` style — even if all defaults, write the file so future skills can read it.

### 9. Mood block (auto-generate + confirm)

After collecting everything above, **auto-build** the Mood block from the palette and sketch settings:

```
Brand: {brand_name}.
Palette: {primary} primary, {secondary} secondary, {background} background, {text} text{, {accents} accents if any}.
Sketch annotations: {sketch_color}, {weight}-weight {personality}.
Mood: confident, modern, on-brand.
Art direction: consistent campaign — slide N of M.
```

Show the user the draft and ask:

> "Here's the Mood block that gets injected into every AI image prompt:
> ```
> [draft]
> ```
> Look right? Or want to tweak the adjectives (`confident, modern, on-brand` → your call)?"

Accept their edit verbatim if provided.

---

## Writing assets.md

After all questions answered, write `<project_root>/{brand_context}/assets.md` using the exact schema in `assets-template.md`. Required order of sections:

1. `## Last Updated` — today's date + " by interactive-qa"
2. `# {brand_name} — Visual Assets`
3. `## Colors` — Primary, Secondary, Background, Text, optional Accents
4. `## Sketch Style` — color, weight, personality
5. `## Logo` — primary path, dark variant, placement, size, alt
6. `## Author` — display name, handle, headshot
7. `## Mood (AI Prompt Block)` — the verbatim code block
8. `## Visual References (Optional)` — bullet list
9. `## Fonts (Active)` — headline + body + source
10. `## Icons` — file list with optional notes
11. `## Templates` — file list with optional notes

Hex codes always lowercase. Empty values use `unknown` — never leave a section header without at least one bullet underneath.

---

## After saving

Show the user a confirmation with:

- Absolute path to `assets.md`
- Count of files in each subfolder
- Reminder: "Anytime you want to update visuals, just ask me to update specific fields."

---

## Skip rules

- If the user says "skip visuals" / "no visuals yet" → set everything to `unknown`, still write `assets.md` with the schema intact (so future runs can fill it in). Don't block other skills.
- If the user only wants to update one field → load existing `assets.md`, jump to that section, ask only the relevant questions, rewrite the file preserving the rest.

---

## Edge cases

- **User pastes a hex without `#`** → add it. `0a0a0a` becomes `#0a0a0a`.
- **User pastes RGB or HSL** → convert to hex; show the converted value and confirm.
- **User attaches a non-image as a logo** → reject, ask for `.png/.jpg/.svg/.webp`.
- **User provides a path that doesn't exist** → flag it, ask for the right path or to skip.
- **Multiple logo variants beyond primary/dark** → save all to `logos/`, but only record primary + dark in `assets.md` fields. Mention the extras in a `## Other Notes` section at the bottom.
- **User wants to re-run the brandbook later** → both UI and this Q&A flow are idempotent: re-reading `assets.md` prefills, then asks what to change.
