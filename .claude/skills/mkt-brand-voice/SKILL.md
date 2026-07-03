---
name: mkt-brand-voice
version: 1.1.0
description: >
  Extract or build a brand's voice so every skill writes in their style.
  Triggers on: "brand voice", "writing style", "make this sound like me",
  "define our voice", "analyze my content", "voice guide", "how should we
  sound", "tone of voice", "brand personality", "analyze my website",
  "deep brand voice", "playbook mode", "agentic academy playbook".
  Four modes: Import (existing brand guidelines), Extract (analyze existing
  content), Build (interview from scratch — quick or deep Playbook variant),
  Auto-Scrape (URL provided, skill researches). Produces
  {brand_context}/voice-profile.md and {brand_context}/samples.md at project root.
  Foundation skill — run before any execution skill that reads voice context.
  Does NOT trigger for positioning, audience research, or keyword work.
---

# Brand Voice

## Outcome


## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}` to absolute paths set by the installer. Substitute these placeholders wherever they appear below.

Files saved to `<project_root>/{brand_context}/`:
- `voice-profile.md` — the full voice system (tone, vocabulary, rhythm, platform rules)
- `samples.md` — 5-10 gold-standard sentences with source and reason noted
- `assets.md` — visual brand assets (colors, sketch, logo, author, mood, fonts, icons, templates). Populated three ways:
  - **Auto-Scrape** (Mode 4) if Firecrawl available — discovered from URL
  - **Visual Brandbook UI** (Step 8) — local HTML page with drag-drop upload, recommended for first run
  - **Interactive Q&A** (Step 8 fallback) — `references/design-questions.md` flow, when no UI is wanted

Subfolders auto-created under `brand_context/` by the import scripts + Q&A flow:
- `logos/`, `fonts/`, `icons/`, `templates/`, `visual_refs/` — actual binary assets the user uploads

`<project_root>` is the working directory where Claude Code was launched. If `{brand_context}/` does not exist there, create it before writing files.

The voice profile includes a structured JSON data block validated against `references/voice-profile.schema.json`. This enables downstream skills and automation to read voice data programmatically.

Any skill in the project can reference these to write on-brand without asking the user about voice again. Multiple skill systems installed in the same project share this single source of truth.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| `{brand_context}/positioning.md` | Summary | Informs voice positioning — a challenger brand sounds different from a trusted advisor |
| `context/learnings.md` | `## mkt-brand-voice` section | Apply any previous corrections before starting |

Load if they exist. Proceed without them if not.

---

## Before You Start

**Check if `{brand_context}/voice-profile.md` exists at the project root.** If `{brand_context}/` itself does not exist, that's expected on first run — proceed; the skill will create the folder when saving.

**Invocation context:** when this skill is invoked by a parent orchestrator (e.g. `00-social-content` Phase 1 brand-context guard), do NOT print a "welcome" or "to start, run /mkt-brand-voice" message. Jump straight to mode selection via `AskUserQuestion` — the parent already confirmed the user wants to configure voice.

If it exists → **Update mode.** Read the existing profile, show a one-paragraph summary of the current voice, and ask what they'd like to change via `AskUserQuestion`. Don't rebuild from scratch. Before overwriting any section, show what changed and confirm via popup.

If it doesn't exist → **Mode selection.** ALWAYS use `AskUserQuestion` (popup) — never a text fallback, never "type 1 / 2 / 3":

```
AskUserQuestion({
  questions: [{
    question: "How do you want to configure your brand voice?",
    header: "Mode",
    multiSelect: false,
    options: [
      { label: "Import — I have guidelines",
        description: "Imports an existing brand book / style guide (PDF, doc, pasted text) and maps it to the voice-profile format." },
      { label: "Extract — I have samples",
        description: "Extracts voice from existing content (posts, emails, transcripts, website). Minimum 3 samples or 500+ words." },
      { label: "Build — start from scratch",
        description: "Question-guided interview (~5 min Quick version, ~10-15 min Playbook version)." },
      { label: "Scrape — here's my URL",
        description: "Pass the website / LinkedIn URL and the skill researches on its own. Falls back to Build if scraping fails." }
    ]
  }]
})
```

If the user provides a URL in their first message, skip mode selection and go directly to Auto-Scrape. If they attach or paste a structured brand guide, go directly to Import. Otherwise, the popup is the entry point — no plain-text alternative.

If the user provides a URL in their first message, skip mode selection and go directly to Auto-Scrape. If they attach or paste a structured brand guide, go directly to Import.

**Playbook note:** Mode 3 (Build) has two variants — a Quick 8-question flow and a deep "Agentic Academy Playbook" flow. Playbook is an opt-in sub-variant of Build, never a separate mode. Only offer it when the user is entering Build mode, has no existing `voice-profile.md`, and hasn't already gathered a strong sample corpus from Import/Extract/Auto-Scrape. Users with an existing profile always hit **Update mode** and never see Playbook unless they explicitly ask for a "deep rebuild" or say "run the brand voice playbook".

---

## Mode 1: Import

Best for: brands that already have voice/tone guidelines, brand books, or style guides.

**Accepts:** Pasted text, PDF, or any document containing existing brand voice guidelines.

**Process:**
1. Read the provided guidelines fully
2. Map their structure into the voice-profile.md format (see `references/voice-profile-template.md`)
3. Flag any gaps — common missing pieces: real samples, anti-patterns (what the brand does NOT sound like), platform-specific rules, vocabulary lists
4. Present a summary: "Here's what your guidelines cover and what's missing"
5. **Enrich offer:** Ask if they want to layer on additional sources to fill gaps and add real-world samples:
   - "Want me to pull from your LinkedIn, website, or other content to add real samples and fill the gaps?"
   - If yes → run Auto-Scrape or Extract on the additional sources, then merge findings into the imported profile
   - If no → proceed with what's there, noting gaps in the profile

**Merge rules when enriching:**
- The imported guidelines are the authority — enriched content fills gaps, it doesn't override
- If enriched content contradicts the guidelines, flag it: "Your guidelines say X but your LinkedIn sounds more like Y — which is the real you?"
- Samples from real content always go to `samples.md`, even when the guidelines provided example copy

---

## Mode 2: Extract

Best for: raw content — website copy, emails, social posts, newsletters, transcripts.

**Sample gate:** Minimum 3 samples OR 500+ total words. Under 500 words → offer Quick mode (top 5 traits + 3 rules) or ask for more content.

**Sample priority — most to least authentic:**
1. Slack messages or casual emails (raw, unedited)
2. Podcast or call transcripts
3. Social posts (LinkedIn, Twitter)
4. Website copy (most edited, least authentic)

**Run the extraction:**
Read `references/extraction-guide.md` for the full methodology — 6 dimensions, phrase harvesting, confidence zone mapping, anti-pattern sourcing, and self-critique checklist.

After analyzing, collect 5-10 sentences that best represent the voice for `samples.md`.

---

## Mode 3: Build

Best for: starting fresh, or existing content is too generic to reliably extract from.

**Quick vs Deep fork (ask this first via `AskUserQuestion` — never plain text):**

```
AskUserQuestion({
  questions: [{
    question: "How deep should we go?",
    header: "Depth",
    multiSelect: false,
    options: [
      { label: "Quick — 5-8 questions (~5 min)",
        description: "Lean interview. Good for iterating fast." },
      { label: "Playbook — full Agentic Academy (~10-15 min)",
        description: "Deep flow, best when you're starting from scratch." }
    ]
  }]
})
```

The popup is the entry point. Do NOT echo the options as a numbered list — that's the legacy fallback and is no longer supported.

- **Quick** → use `references/build-questions.md`. Ask a maximum of 8 questions, prioritised by what context is already loaded. If `positioning.md` is loaded, skip questions it already answers. After building, ask for 2-3 sample sentences for `samples.md`.
- **Playbook** → use `references/playbook-questions.md`. Walk through Step 1 (Personality, 5 questions), Step 2 (Strategic Framework, 4 questions — skip Q1/Q2 if `icp.md`/`positioning.md` exist), and Step 3 (Example Collection). Samples collected during the interview feed directly into `samples.md`. Follow the Playbook's Synthesis Instructions — derive every characteristic from the user's actual answers, never template from the example brief.

If the user has already indicated a preference (e.g. the `/start-here` flow passed through a "deep flow" flag, or the user said "run the brand voice playbook"), skip the fork and route directly to the matching variant.

If the user already produced a strong sample corpus through Import / Extract / Auto-Scrape in this session, do **not** offer Playbook — they already have the raw material; keep Build as Quick.

---

## Mode 5: Folder Import *(v2.0.1+)*

Best for: user has an existing folder of brand assets (logos, fonts, icons, brand guidelines PDF, screenshots) and wants the skill to ingest it all at once.

**Trigger phrases:** "import this folder", "I have a folder with my assets", "grab from `<path>`".

**Flow:**

1. Ask user for the folder path (absolute, or `~/...`).
2. Run dry-run:
   ```
   python .claude/skills/mkt-brand-voice/scripts/import_folder.py <path>
   ```
   The script walks recursively, auto-classifies each file by name + extension, and prints a plan grouped by category (logos/ fonts/ icons/ templates/ visual_refs/ components/). Filenames are sanitized (ASCII, no spaces).
3. Show the plan to the user. If they want to change any classification, edit the rules table mentally and adjust manually after copy. If they confirm:
   ```
   python .claude/skills/mkt-brand-voice/scripts/import_folder.py <path> --apply
   ```
4. After copy completes, **continue to the normal voice flow** (Mode 2 Extract if they have content, or Mode 3 Build) since folder import only covers visual assets, not voice.

**Classification rules** (script auto-applies, in priority order):

| Pattern | Lands in |
|---|---|
| `.ttf .otf .woff .woff2` | `fonts/` |
| Image with `logo` / `logomark` / `wordmark` in filename | `logos/` |
| Image with `headshot` / `portrait` / `avatar` in filename | `logos/` (used by author chip) |
| Image under `*/icons/*` path | `icons/` |
| Image starting with `icon-` or `ic-` | `icons/` |
| Image with `button` / `card` / `nav` / `hero` / `cta` in filename | `components/` |
| `.pdf` | `templates/` (brand guidelines etc.) |
| `.html` / `.htm` | `templates/` (layout references) |
| Other images | `visual_refs/` (fallback) |
| Hidden files, `.DS_Store`, `Thumbs.db`, > 50 MB | skipped |

If a target filename collides with an existing file in brand_context, the script appends `-1`, `-2`, etc. (never overwrites).

After Mode 5, the user typically runs Step 8 (Visual Brandbook UI or interactive Q&A) to fill the metadata side of `assets.md` (color hex codes, mood block, etc.) — the import handles the FILES, the brandbook handles the TEXT.

---

## Mode 4: Auto-Scrape

Best for: user provides a URL and wants research done for them.

### Scraping Strategy

Try sources in this order, using the cheapest tool that works:

1. **WebFetch first** (free) — try homepage, About page, 2-3 blog posts, LinkedIn
2. **If WebFetch fails** (JS-heavy site, bot protection, empty content) → fall back to `tool-firecrawl-scraper` skill
   - Check `{env_file}` for `FIRECRAWL_API_KEY` first
   - If missing → trigger the **Fallback** flow below (offer API key or build assets now). Do NOT stop here.
   - If present, use Firecrawl scrape endpoint with `formats=["markdown"]`

### Brand Asset Extraction

Two paths, run in this order:

**Path A — Playwright scrape (no API key needed, v2.0.1+):**
```
uv run .claude/skills/mkt-brand-voice/scripts/import_url.py <URL> --apply
```
Captures via headless Chromium:
- **Logo** — first `<img alt*=logo>` / `<img class*=logo>` (saved to `logos/primary-<slug>.png`) + favicon backup
- **Hero** — top-fold screenshot at 1440×900 (saved to `visual_refs/homepage-<slug>.png`)
- **Components** — screenshots of the first `<button>`, `.card`, and `<nav>` (saved to `components/`)
- **Colors** — computed background/text/accent from the rendered page (written to seed observations file)
- **Fonts** — Google Fonts `<link>` + computed `font-family` of body and headings (written to seed observations file)

The script writes a **seed observations file** at `brand_context/_import-observations-<slug>.md`. Don't write `assets.md` from this directly — the user reviews the observations + then runs the Q&A flow (`design-questions.md`) to fill `assets.md` with confirmed hex codes and brand structure.

**Path B — Firecrawl branding extraction (if API key available):**
```
formats=["branding"]  →  colors, fonts, logos, spacing, brand traits
```
Useful as a second pass when Path A missed something (e.g., site is JS-heavy and Playwright timed out). Cross-reference its output against the observations file.

Report back to the user:
> **Found from your site:**
> - Logo: [path or "not found"]
> - Hero screenshot: [path]
> - Components captured: [button / card / navbar]
> - Computed colors: [from seed observations]
> - Fonts detected: [from seed observations]
>
> **Next step:** Run the Q&A flow (read `design-questions.md`) to confirm hex codes and fill `assets.md`. The seed observations file at `_import-observations-<slug>.md` shows what was auto-detected.

If both Path A and B fail (site blocks bots, JS-heavy with no fallback), skip and note: "I couldn't auto-detect your visual brand assets. Use Mode 5 (Folder Import) if you have a local folder, or fill the brandbook manually."

### Voice Extraction Process

1. Fetch content from: homepage, About page, 2-3 blog posts, LinkedIn bio + recent posts, Twitter/X
2. Report what was found (pages, word count, quality signal)
3. Feed all content into Extract mode (Mode 2)
4. Follow up with 2-3 gap-filling questions: evolution intent, hated phrases, voice inspiration

### Fallback — Never Block Brand Asset Creation

If scraping fails for any reason (missing API key, site blocks requests, JS-heavy page), **always offer to build brand assets anyway**. Never stop the flow because a URL couldn't be scraped.

**When a URL can't be scraped**, ask the user:

> "I couldn't scrape that URL — [reason]. Two options:
> 1. **Add your API key now** — paste your `FIRECRAWL_API_KEY` and I'll retry immediately
> 2. **Build your brand assets now** — I'll ask you a few questions instead, and we can scrape the URL later to enrich everything"

If the user picks option 2 (or doesn't have a key), switch to **Build mode (Mode 3)** and complete the full voice profile, samples, and any other brand assets. The URL stays noted in the profile so it can be scraped in a future session to enrich the existing profile.

**Critical rule:** The user should always leave the onboarding flow with complete brand assets — voice-profile.md, samples.md — regardless of whether scraping worked. Scraping enriches the output; it never gates it.

---

## Step 5: Voice Test (All Modes)

After producing any voice profile, validate before saving. Do not skip.

Write 3 samples using the extracted or built profile:
- A 3-4 sentence email opening
- A social post (match their most-used platform)
- A landing page headline + 2 supporting sentences

Ask: *"Does this sound like you when you're not overthinking it?"*

- **Yes** → save
- **Close but off** → ask what's wrong, adjust specific sections, retest
- **Not right** → ask for an example that IS right, re-extract from it

Cap at 3 rounds. If still unresolved, offer to save current version and refine over time using `/brand-voice` again.

---

## Step 6: Save Output

First, ensure `<project_root>/{brand_context}/` exists. If it doesn't, create it (`mkdir -p {brand_context}/`).

**`{brand_context}/voice-profile.md`**
Read `references/voice-profile-template.md` for the exact format. All sections required.
Include a structured JSON data block at the end (inside a `<details>` tag) that conforms to `references/voice-profile.schema.json`. Read the schema before generating the JSON to ensure all required fields are present.

If Playbook mode was used, ensure every section in `voice-profile.md` is traceable to a specific answer — no templated language from the example brief. Core Voice Characteristics must be named from the user's actual words; signature phrases must be their actual phrases; the never list must reflect their Q1 anti-corporate answer.

**`{brand_context}/samples.md`**
5-10 sentences. For each, note: source type, and why it's representative.

```
## [Source] — [e.g., email to list / LinkedIn post / homepage]
"[Sentence exactly as written]"
*Why it's representative: [1 sentence]*
```

After saving, show the user actual excerpts — not just confirmation of file paths.

---

## Step 7: Optional Context Enrichment

After saving the voice profile, offer to deepen brand context with audience and positioning data. This step is **optional** — the user can skip both offers and proceed immediately.

**ICP offer** — if `{brand_context}/icp.md` does not exist:

> "Want to also define your ideal customer profile? A sharp ICP helps the pipeline write copy that resonates with the right person — 5-8 questions, ~5 min. (yes / skip)"

If yes → invoke the `mkt-icp` skill. It handles the full process and writes `{brand_context}/icp.md`.

**Positioning offer** — if `{brand_context}/positioning.md` does not exist:

> "Want to define a positioning angle? This tells the pipeline what makes you different and how to frame content. (yes / skip)"

If yes → invoke the `mkt-positioning` skill. It handles the full process and writes `{brand_context}/positioning.md`.

If both files already exist, skip this step silently — do not ask again.

If the user skips either offer → continue without it. Both files enrich the pipeline but are never required.

---

## Step 8: Visual Brandbook *(CLI-first)*

After voice is saved, offer to populate the visual layer (`assets.md` + `tokens.md` + logos/fonts/icons/templates folders). The carousel templates and AI image generation both read from these, so it's worth doing — but never required.

**Skip if** `{brand_context}/assets.md` already exists AND has populated Colors/Logo sections (not just `unknown` placeholders). In that case ask "Want to update your visual brandbook?" instead of starting fresh.

**This step is entirely CLI/conversational.** No HTML upload UI — the system is CLI-first. Three paths:

> "Want to set up your visual brandbook? Three ways:
> 1. **Folder import** — if you have a folder of brand assets (logos, fonts, icons, brand guidelines PDF), point me at it and I'll classify+copy automatically
> 2. **URL import** — if you have a website, I'll scrape logo / hero / components / colors / fonts via Playwright
> 3. **Interactive Q&A** — I ask you questions here in chat, you paste hex codes / file paths"

Use `AskUserQuestion` with these three options; user can pick more than one (they often combine, e.g., URL import to get the basics, then Q&A to fill gaps).

### Option 1 — Folder import (Mode 5)

See **Mode 5** above. Runs `import_folder.py` on a path; auto-classifies + dry-run + apply.

After copy, continue to Q&A to fill `assets.md` metadata (the import handles files, Q&A handles text).

### Option 2 — URL import (Path A of Mode 4)

See **Mode 4** above. Runs `import_url.py` on a URL; captures logo + hero + components + computed colors/fonts via Playwright. Writes a seed observations file (does NOT write `assets.md` directly).

After import, run Q&A to confirm the observations and turn them into `assets.md`.

### Option 3 — Interactive Q&A (no upload needed)

Read `references/design-questions.md` and follow it step-by-step. That doc has the full sequenced question flow including Step 8b (tokens.md), file-handling rules, and the assets.md writing instructions.

### Skip path

Write a minimal `assets.md` and copy `references/defaults/anthropic-ish/tokens.md` to `brand_context/tokens.md` so downstream skills always have something to read. The user can fill in later.

---

## Step 9: Custom Templates from References (opt-in)

After the visual brandbook is populated (or even later, anytime), the user can extend their template pool by uploading **reference images** of layouts they want to mimic — a slide they made, a Stripe/Notion/Dribbble screenshot, a competitor's carousel. The output is a new entry in their `viz-image-gen/references/templates/<pool>/` library that respects THEIR brand tokens.

**Trigger phrases:** "extract a template from this ref", "make a template like this", "save this layout", "I want to use this structure as a template".

**Flow:** read `.claude/skills/viz-image-gen/references/ref-to-template.md` and follow it step by step. Five phases:

1. **What did you like?** — multi-select what to extract: composition, copy, colors, typography, image style, ornaments. Never copy everything.
2. **Where will it live?** — pick pool (linkedin-carousel / ebook / one-pager / etc.) + role (hero / body / cta) + give it a slug id.
3. **The plan** — show the file diff (NEW HTML, MODIFY manifest.json, optionally MODIFY assets.md if user wanted the ref's colors). Wait for explicit confirm.
4. **Extract** — Claude looks at the image and writes the new HTML using brand-token CSS variables (NEVER hardcoded colors/sizes). Adds the manifest entry with `tone: ["user-uploaded"]`.
5. **Validate** — render with sample data, show user, iterate up to 3 rounds.

After extraction the template is live — the designer picks it like any curated one. Over time the user's pool reflects their actual taste.

This step is **always optional** — never required by any downstream skill. The curated pool already covers the basics.

---

## Rules

*Updated automatically when the user flags issues. Read before every run.*

---

## Self-Update

If the user flags an issue with the output — wrong tone, bad format, missing context, incorrect assumption — update the `## Rules` section in this SKILL.md immediately with the correction and today's date. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.

---

## Troubleshooting

**Not enough samples:** Request more content, or switch to Build mode.
**Voice feels generic after extraction:** Website copy is often sanitised. Ask for emails or Slack messages.
**User can't decide on tone:** Write two contrasting versions of the same sentence, ask which is closer.
**Positioning not loaded:** Proceed, but note it would sharpen the voice positioning.
**Profile already exists but user wants to start over:** Confirm before overwriting. Offer to save old version with a date suffix.
