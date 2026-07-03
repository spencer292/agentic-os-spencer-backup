---
name: mkt-visual-identity
version: 1.1.0
description: Build and refine a brand's visual identity from any reference (PDFs, URLs, screenshots, brand docs) — incrementally; each new reference UPDATES the existing identity (merge tokens, append moves, regen outputs), conflicts surfaced. Produces two synced outputs: machine-readable artifacts in `{brand_context}/visual-identity/` (tokens, identity, moves, fonts, logos, compositions) for downstream visual skills, and a `visual-identity.pdf` brand bible. Also a Template Factory mode generating per-format HTML templates tuned to the brand. Triggers on "visual identity", "brand identity", "design tokens", "build brand identity", "extract visual", "replicate this style", "generate templates from PDF", "create brand bible". Five modes — Extract, Import, Build, Auto-Scrape, Templates. Foundation skill — run before any skill that renders visuals. Does NOT trigger for written voice (use mkt-brand-voice), positioning, audience research, or text-only content.
---

# mkt-visual-identity

Build a brand's **visual identity contract** — typography tokens, color palette, layout rules, and ready-to-render HTML templates — from reference materials. Deterministic, no AI generation, fully reproducible.

## When to use this skill

User says any of:
- "extract the visual identity from this PDF"
- "create templates that match this style"
- "replicate this design system"
- "what fonts/colors/spacing does this brand use"
- "build a design system from these samples"
- "match this visual identity"

User provides any of: PDF carousel, screenshots, web page URL, existing post images, brand guideline document.

## When NOT to use

- User wants written voice extraction → `mkt-brand-voice`
- User wants positioning/angle → `mkt-positioning`
- User wants ICP/audience → `mkt-icp`
- User wants to generate ONE image with AI (no template needed) → `viz-image-gen`

## Output contract

This skill produces two co-located outputs that always stay in sync:

**(A) Machine-readable artifacts** under `{brand_context}/visual-identity/`:

1. **`tokens.json`** — JSON tokens (fonts, weights, type scale, colors, spacing, canvas). Consumed by `render_template.py` (via `--brand-kit`), `ssc-designer`, `ssc-image-generator`, and any other visual skill.
2. **`identity.md`** — human-readable narrative of the brand's visual identity (one-paragraph summary + per-section moves). Updated incrementally as new references arrive.
3. **`moves.md`** — per-brand catalog of design moves (paper-texture, oversized-numeral, accent-bar, etc.) that implement the 10 universal principles in `references/design-principles.md`. Each move section carries inline structured metadata in a `<!--meta ... -->` HTML comment block (fields: `name` kebab-case slug, `image_bearing` bool, `required_zone_types` list when image_bearing:true, optional `keywords`). Consumed by the brand-book PDF generator AND by `validate_brand.py` (gates G2 + G4). No separate moves.yaml — the meta block IS the contract. See `references/template-conventions.md > moves.md meta-block format`.
4. **`compositions.manifest.json`** — machine-readable index of brand-specific composition primitives.
5. **`fonts/`**, **`logos/`**, **`compositions/`** — actual font files, logo variants, and reusable composition snippets.
6. **`_analysis/`** — per-reference extraction logs (audit trail).

Plus **(B)** a structured `brand-book.pdf` brand bible at the same location, produced by `scripts/generate_brand_bible_pdf.py` after the machine-readable artifacts settle (see "### Phase 7" below). **The PDF must regenerate on ANY change to a visual-identity artifact** — not just `tokens.json`. The trigger fires for any of:

- `tokens.json` (colors, fonts, type scale, spacing, chrome)
- `identity.md` (narrative)
- `moves.md` (design moves catalog)
- `composition-primitives.json` (extracted composition primitives)
- `templates/{pool}/manifest.json` (when a template flips draft→ready, gets added, or is renamed)
- `logos/`, `fonts/`, `headshots/` (any new asset added)
- `visual_refs/` (when a new reference is added that's reflected in the bible)

After EVERY phase that mutates any of these (Phase 2/3 token consolidation, Phase 4.7 brand-book v1, Phase 5 per-template acceptance, Phase 6 regen, asset uploads), the orchestrator MUST call `scripts/generate_brand_bible_pdf.py` as the final step. If the script fails (font missing, etc.) the orchestrator surfaces the error but keeps the artifacts — the PDF is the DERIVED view; sources of truth stay machine-readable. Also re-runnable on demand ("regenerate the brand bible PDF").

**Per-output-format template pools** live under `{brand_context}/templates/{output_format}/` (NOT inside `visual-identity/`). Currently v1 ships `linkedin-carousel/` only (3 heroes + 10 bodies + 3 cta = 16 templates). The renderer (`viz-image-gen/scripts/render_template.py`) resolves brand_context first, with viz-image-gen's generic copy as fallback.

### Scope and constraints (v1)

- **FAITHFUL CAPTURE — zero-omission rule (CORE PRINCIPLE).** When extracting compositions from references, capture EVERY visible element AS-IS. Never strip, never simplify, never substitute. If a ref shows a photo → emit an `image` element with `ai-photo`/`real-photo` subtype. Icon → `vector svg-icon` or `ai-illustration`. Illustration → `vector ai-illustration`. Sketch annotation → `vector ai-illustration`. Photographic backdrop → `background ai-photo`/`real-photo`. Code block → `text code`. **ZERO of these can be silently dropped** because (a) AI gen is expensive — not your call; (b) hard to render — use the subtype's render path; (c) looks cleaner without — not the brand's voice; (d) easier to validate — fidelity > validation ease; (e) simplification — simplification is an EXPLICIT user opt-in, never automatic. When in doubt, INCLUDE IT. Better to over-capture and ask "is this load-bearing?" than to ship a generic system. The brand's identity is the SUM of its elements, not just the easy ones. This rule applies at EVERY phase: intake (Phase 1), per-ref analysis (Phase 2), composition extraction (Phase 4.5), template translation (Phase 5). If you find yourself thinking "I'll skip the photos to keep it CSS-only", STOP — that's exactly the failure mode this rule prevents.
- **Single brand per project.** One `brand_context/` per project root. No multi-tenant model yet.
- **One output format in v1.** Only `linkedin-carousel` template pool is generated by Mode T. Other formats (`instagram-carousel`, `linkedin-infographic`, etc.) are not built yet.
- **No versioning yet.** Updates overwrite in place; the skill warns the user before mutating an existing identity.
- **Manual user input always wins over extraction.** If the user types `primary is #FF0000` after the extractor read `#FF1010` from a screenshot, the user's value is stored as a locked field in `tokens.json` and never overwritten on subsequent extractions.
- **Default identity fallback (explicit only, never silent).** When the user genuinely has nothing to start from AND they confirm via the "nothing to upload" option in the guided intake, `defaults/neutral-identity/` is copied into `{brand_context}/visual-identity/` and flagged as `default — please refine when ready`. The skill MUST NOT fall through to defaults silently when the user skips a step or dismisses a popup — it announces the fallback explicitly ("I'll seed neutral-identity for you; nothing's locked, every value can be refined later") and asks for confirmation.
- **Guided intake (NOT agnostic dump).** The skill walks the user step-by-step through a conversation: required brand name first → style references → logo → headshot → "anything else". The 5 technical paths (A=URL, B=PDF, C=images, D=folder, E=Figma) still exist as the underlying handlers, but they are wrapped by the conversation flow defined in `references/intake-procedures.md` "Guided conversation". The "drop everything in a folder, I'll figure it out" pattern is REMOVED — it was the failure mode that produced posts with a hardcoded placeholder brand name because the brand name was never asked.

## Before You Start

**Check if `{brand_context}/visual-identity/tokens.json` exists at the project root.** If it does → **Update mode**: show a one-paragraph summary of the existing identity and ask via `AskUserQuestion` what to refine. Don't rebuild from scratch.

**Invocation context:** when this skill is invoked by a parent orchestrator (e.g. `00-social-content` Phase 1 brand-context guard), do NOT print a "welcome" or "to start, run /mkt-visual-identity" message. Jump straight to the guided intake — the parent already confirmed the user wants to configure visual identity.

### Step 0 — Brand name (REQUIRED first question, blocking)

Before any mode selection, before any folder suggestion, before any reference upload — ask for the brand name. Plain text question (NOT `AskUserQuestion`, because there are no enumerable options to pick from):

```
First things first: what's your brand name? It can be your personal name,
your company name, the handle you use on social — whatever you want to appear
on the posts (signature, byline, cover). Without it I can't generate any template.
```

**Rules for this step:**
- Wait for an explicit answer. Do NOT proceed with a placeholder, the user's OS username, or any other default.
- If the user says "leave it blank / no name / skip", confirm explicitly ("you prefer posts WITHOUT a byline? I can generate them, but the cover ends up unsigned — confirm?") — never assume.
- Store the answer immediately into `{brand_context}/visual-identity/tokens.json > brand` as a `locked_field`. Once stored, the extractor never overwrites it.
- If brand name contains characters that break HTML rendering (`<`, `>`, `&`), escape on render time, not at storage.
- This step CANNOT be skipped — it was the root cause of the hardcoded-placeholder failure mode (templates rendered with a placeholder brand name because the brand name was never asked).

After the brand name is stored, continue to masthead capture.

### Step 0.3 — Brand masthead labels (REQUIRED for editorial chrome)

Editorial-style carousel refs commonly carry a 3-slot masthead row at the top edge — e.g., `MAY ©2026  /  <brand-handle>  /  creative strategist`. The renderer's chrome auto-inject (`build_chrome_elements` in `primitive_to_template.py`) reads these from `tokens.json > chrome.masthead.labels[]` and prepends them as `kicker` text elements at `top-edge-{left,center,right}`. Without this step, every generated template lacks the editorial-magazine signature.

Use `AskUserQuestion` to capture the 3 labels:

```
AskUserQuestion({
  questions: [{
    question: "Editorial refs usually carry a masthead — 3 micro-labels at the top, like `MAY ©2026 / @brand / role`. Which labels do you want in your masthead? (You can use dynamic variables: {{date}}, {{month_year}}.)",
    header: "Masthead",
    multiSelect: false,
    options: [
      { label: "{{month_year}} / @{handle} / {role}",
        description: "Recommended — auto date + handle + short role/tagline." },
      { label: "@{handle} / {role}",
        description: "2 slots — no date, cleaner. The middle slot stays empty." },
      { label: "No masthead",
        description: "I don't want a masthead. Templates ship without the editorial top row. Can be enabled later." }
    ]
  }]
})
```

For the chosen pattern, ask 1-2 follow-up plain-text questions (NOT `AskUserQuestion` — these are free-form):
- "What's the @handle?" (e.g., `@<brand-handle>`)
- "Short role/tagline?" (e.g., `founder, agentic ai` or `creative strategist`)

Persist into `tokens.json > chrome.masthead.labels[]` as a 3-element array. Variables like `{{month_year}}` are resolved at slide-render time. If the user picks "No masthead", store `chrome.masthead: { labels: [], enabled: false }`.

After labels stored, ask one more question about pagination:

```
AskUserQuestion({
  questions: [{
    question: "Carousel dots in the footer to indicate progress between slides?",
    header: "Pagination",
    multiSelect: false,
    options: [
      { label: "Yes — subtle dots",
        description: "Adds a row of dots at the `bottom-edge`. Color follows tokens.text_on_dark/light." },
      { label: "No — no dots",
        description: "Bottom edge stays free. Some brands use a tagline-row instead of dots." }
    ]
  }]
})
```

Persist as `chrome.pagination: { subtype: "css-shape", count: 7, active: 1 }` if yes (count gets reset per-carousel at slide-gen time), or `chrome.pagination: null` if no.

After the brand name + masthead + pagination are stored, continue to asset classification.

### Step 0.4 — Per-file asset classification (BLOCKING when files are provided)

When the user provides files (drag-drop, path list, folder), the orchestrator MUST classify each file before routing. Two categories with very different downstream paths:

- **Brand asset** — owned by the user's brand. Logo, headshot, existing posts they made. Goes to `brand_context/visual-identity/{logos|headshots|posts-archive}/`. NOT a composition reference; the renderer treats these as content to be EMBEDDED.
- **Template reference** — inspiration the user wants to copy. Other brands, magazine spreads, screenshots from accounts they admire. Goes to `brand_context/visual_refs/`. The composition is EXTRACTED via Phase 4.5 (vision pass).

These two routes are non-fungible. A logo treated as a template ref produces "extract composition primitives from this 1cm × 1cm svg" garbage. A template ref treated as a brand asset gets baked into output as if it were the user's own image. Both are silent failure modes the previous intake had — fix is explicit classification.

**Use `AskUserQuestion` with multiSelect to classify EVERY file the user provided.** One option per file:

```python
AskUserQuestion({
  questions: [{
    question: "Before extracting, I need you to mark what's what. For each file below, what's its role?",
    header: "Classify files",
    multiSelect: true,
    options: [
      # Each file the user provided becomes ONE option labelled with the filename + sniffed category.
      # The user toggles BRAND vs REFERENCE per file via multiSelect — by default all are unchecked
      # (so the orchestrator never auto-routes); user must check ONLY the brand-asset ones.
      # Naming convention: "[BRAND] filename.ext" means brand asset; unchecked = template reference (default).
      { label: "logo-agentic-academy.jpg → MY brand (logo)",
        description: "This is my brand's OFFICIAL logo. Goes to visual-identity/logos/." },
      { label: "headshot.jpg → MY brand (founder photo)",
        description: "Original photo. Goes to visual-identity/headshots/." },
      { label: "ref-style-01.png → MY brand (existing post)",
        description: "A post from my brand that already shipped. I can copy my own visual voice." },
      # ... more options, one per file
    ]
  }]
})
```

**Heuristics to seed sensible defaults** (orchestrator pre-checks options before showing the popup, user adjusts):

| File pattern | Default category |
|---|---|
| filename contains `logo`, transparent PNG/SVG, < 200KB, square or wide | BRAND (logo) |
| filename contains `headshot|portrait|founder|me`, photo aspect, faces detected | BRAND (headshot) |
| 1080×1350 or 1080×1080 or similar carousel-canvas dimensions | TEMPLATE-REF (default) |
| comes from `~/Pictures/Screenshots/` | TEMPLATE-REF |
| comes from a user-named `my-posts/` or `archive/` folder | BRAND (own posts) |
| anything ambiguous | TEMPLATE-REF (safer default — user can toggle to BRAND in popup) |

**Routing after the popup:**

| Selected category | Destination |
|---|---|
| BRAND (logo) | `brand_context/visual-identity/logos/<slug>.png` + run `intake_logo.py` for bg cleanup |
| BRAND (headshot) | `brand_context/visual-identity/headshots/<slug>.jpg` |
| BRAND (own post / archive) | `brand_context/visual-identity/posts-archive/<slug>.png` (NOT extracted; informs voice/style only) |
| TEMPLATE-REF (default for everything unchecked) | `brand_context/visual_refs/<slug>.png` → Phase 4.5 extraction |

**Rules:**
- The popup is blocking. Don't proceed to Step 0.5 until the user has confirmed the classification.
- If the user doesn't toggle any, ALL files default to TEMPLATE-REF — safer than guessing brand ownership.
- After routing, surface a one-line summary: `Routed: 1 logo / 1 headshot / 4 template refs → Phase 4.5 will extract from the 4 refs.`
- This step REPLACES the previous "everything dumped in a folder" pattern that confused logos with style references.

After classification settles, continue to multi-brand disambiguation.

### Step 0.5 — Multi-brand disambiguation (BLOCKING when 2+ asset sets detected)

Before proceeding to mode selection, scan the user's provided material (folder contents, URLs, PDFs, attached images) for **distinct brand identities**. Signals that suggest more than one brand:

- Multiple logo files with different visual identity (not just light/dark variants of the same mark — actually different brands)
- Multiple sets of style references that don't share a visual language (different color palettes, different typographic systems, different chrome)
- Filenames/folders that name different brands (e.g., `logo-acme.svg` + `logo-zenith.svg`)
- Different `brand:` declarations across multiple uploaded tokens.json files
- The user explicitly says "here are refs from X and from Y"

**If 2+ distinct sets detected → open `AskUserQuestion` popup (NEVER text fallback):**

```
AskUserQuestion({
  questions: [{
    question: "I detected {N} distinct brands/visual sets in the material you sent: {brand-set-A}, {brand-set-B}{, brand-set-C, ...}. Which is the PRIMARY BRAND — the one that gets the brand_context and the production templates?",
    header: "Primary brand",
    multiSelect: false,
    options: [
      { label: "{brand-set-A}", description: "This becomes the production brand. The others become references or siblings." },
      { label: "{brand-set-B}", description: "This becomes the production brand. The others become references or siblings." }
      // ...one option per detected set
    ]
  }]
})
```

After the user picks the primary, for EACH non-primary set, open a follow-up popup:

```
AskUserQuestion({
  questions: [{
    question: "And {brand-set-X} — what is it?",
    header: "{brand-set-X}",
    multiSelect: false,
    options: [
      { label: "Reference / inspiration only",
        description: "I use it visually as a mood/style reference to extract composition patterns, but I do NOT create a separate brand_context for this brand. The files go to visual_refs/inspiration/." },
      { label: "Sibling production brand",
        description: "I create a SEPARATE brand_context for this brand (at another path). Templates, tokens, voice — all parallel. It generates posts too." },
      { label: "Ignore — don't use",
        description: "Discard. It enters neither as inspiration nor as a sibling." }
    ]
  }]
})
```

**Resulting routing:**

| User answer | Action |
|---|---|
| primary = X, non-primary = "reference" | X's files go to `visual_refs/`. The others' files go to `visual_refs/inspiration/{brand-slug}/` and are consumed as a style reference by the extractions, without becoming a brand identity |
| primary = X, non-primary = "sibling" | Creates `{decoupled_base}/../{sibling-slug}/brand_context/` as a parallel project. Warn the user of the path and proceed with primary only in this run |
| primary = X, non-primary = "ignore" | Move the files to `_analysis/_discarded/{brand-slug}/` (kept for audit, not consumed) |

**Rules:**
- This step is BLOCKING when 2+ brand sets are detected. Don't continue without disambiguation.
- If only 1 brand detected (or material is too sparse to tell), SKIP this step entirely.
- Log the disambiguation decision in `_analysis/extraction-log.md` with timestamp + brand classifications.
- If the user dismisses both popups: default to "everything is reference for primary". Never silent-create siblings without confirmation.

### Step 1 — Mode selection

If tokens.json doesn't exist → **Mode selection.** ALWAYS use `AskUserQuestion` (popup) — never a text fallback, never "type 1 / 2 / 3 / 4 / 5":

```
AskUserQuestion({
  questions: [{
    question: "How do you want to configure your visual identity?",
    header: "Mode",
    multiSelect: false,
    options: [
      { label: "Extract — I have visual refs",
        description: "Analysis of PDFs, screenshots, existing posts. Extracts palette, typography, layouts." },
      { label: "Import — I have a design system",
        description: "Imports already-declared tokens (brand book PDF, Figma export, Notion brand guide)." },
      { label: "Build — interview",
        description: "No refs yet. I ask about palette, typography mood, spacing rhythm, density." },
      { label: "Auto-Scrape — my URL",
        description: "Pass the URL and the skill investigates the site (Playwright + visual analysis)." }
    ]
  }]
})
```

If the user provides a URL or attaches/points to reference files in their first message, skip mode selection and route directly to the matching mode (Auto-Scrape or Extract). Otherwise, the popup is the entry point — no plain-text alternative.

## Modes

### Mode E — Extract (default when reference materials provided)

User provides PDFs/screenshots/web URL.

1. **PDF intake** — for any `.pdf` in user-provided folder, call `scripts/pdf_to_pages.py` to rasterize each page to `{brand_context}/visual-identity/_analysis/visual_refs/{pdf_slug}-p{N}.png` at canvas resolution (default 1080x1350).
2. **Pixel analysis** — call `scripts/extract_tokens.py` on each reference image. Outputs `{brand_context}/visual-identity/_analysis/{ref_name}.spec.json` with detected: dominant colors (k-means), text bounding boxes (Tesseract OCR if installed; manual mode otherwise), shape locations (contour detection).
3. **Font identification** — heuristic check (compare letter widths vs known free fonts: Geist, Inter, Inter Tight, Archivo, Anton). Report best match. If user knows the actual font, accept override.
4. **Trace overlay iteration.** For each role (cover, body, cta), build HTML template with reference image at 50% opacity overlay. Iterate until visual alignment is acceptable. Remove trace overlay → save final template.
5. **Token consolidation** — merge per-reference analyses into single `brand_context/visual-identity/tokens.json` + `identity.md` + `moves.md`. **User-locked fields** (set manually by the user) are preserved verbatim.

### Mode I — Import

User has existing brand guidelines (PDF/Figma/Notion). User pastes/uploads the document. Skill parses tokens directly from declared specs without measurement. Faster but trusts user input.

### Mode B — Build (interview)

No reference materials. Skill asks user about preferred palette, typography mood (geometric/humanist/serif), spacing rhythm, layout density. Generates a starter system.

### Mode A — Auto-Scrape (URL input)

User provides URL. Skill **does NOT screenshot by default**. The right action depends on what's at that URL:

1. **First step always: `WebFetch` the HTML** (cheap, no browser).
2. **Then decide based on what came back:**
   - URL is a text brand spec (Notion brand guide, blog post, design system in prose) → parse text for hex codes, declared fonts, size rules. Skip screenshot. Values from declarations are authoritative — no trace overlay needed for those fields.
   - URL has image references (`<img>` srcs to logo/hero/samples) → fetch those directly via curl. Prefer SVG > PNG > JPG.
   - URL has visual layout that can't be reconstructed from fetched assets → screenshot just that section via `tool-web-screenshot`.
   - Mix → do all of the above in parallel.

See `references/intake-procedures.md` "Path A" for the full decision tree.

**Anti-pattern:** screenshotting a URL whose tokens are already declared in writing on that page. Wastes a browser run and degrades precision (OCR vs literal hex string).

### Mode N — Neutral (explicit "nothing to upload" path)

Triggered when the user, after the guided intake walks them through every reference category, has uploaded NOTHING (no logo, no style refs, no headshot, no URL). The skill MUST announce this path before taking it — never silent.

1. **Announce explicitly:**

   ```
   You didn't upload any reference. I'll seed `defaults/neutral-identity/` for your brand
   ({brand_name}) — neutral palette (off-white + near-black + a neon accent), Inter typography,
   default layouts. Nothing gets locked: every value can be refined whenever you want, just
   call me again with refs.
   ```

2. **Confirm via `AskUserQuestion`:**

   ```
   AskUserQuestion({
     questions: [{
       question: "Want to seed neutral-identity now? (You can change everything later.)",
       header: "Neutral identity",
       multiSelect: false,
       options: [
         { label: "Yes, seed neutral-identity",
           description: "Copies defaults/neutral-identity to brand_context/visual-identity/ with your brand name. You can refine it later." },
         { label: "Wait — I'll upload refs now",
           description: "Cancels the seed. Goes back to Step 1 (mode selection) — try Extract with the refs you upload." }
       ]
     }]
   })
   ```

3. On confirm → copy `defaults/neutral-identity/` to `{brand_context}/visual-identity/`, inject the brand name into `tokens.json > brand`, write `_analysis/extraction-log.md` noting "Mode N seeded — no references provided", run Phase 7 (brand bible PDF) so the user has something to look at.

4. **Critical:** never reach Mode N by accident. If the user dismissed a popup or said "go" without uploading, treat that as "they want to upload, but later" — bounce back to a clarifying question, not silent defaults. The previous "agnostic intake → silent defaults" path is exactly what produced silently-defaulted output: a placeholder brand and a default palette nobody chose.

### Mode T — Template Factory (per-output-format template generation)

**Purpose:** generate a library of layout variations specific to an output format (linkedin-carousel, linkedin-infographic, instagram-carousel, etc.) from an existing visual identity. The variations are saved per-skill so downstream visual skills (00-social-content, viz-image-gen, etc.) can pick from them without inferring layouts per run.

**Input:**
- `brand_context/visual-identity/tokens.json` (must exist — run Mode E/I/B first)
- `brand_context/visual-identity/moves.md` (optional but recommended)
- `output_format` name — **`linkedin-carousel` only in v1** (other formats spec'd but deferred)

**Output:**
- `brand_context/templates/{output_format}/`
  - `heroes/` — N hero/cover variations
  - `bodies/` — N body/content variations
  - `cta/` — N closing variations
  - `manifest.json` — machine-readable index: which variation, when to pick, slot schema
  - `_shared/styles.css` — pool-level base styles consuming the brand `var(--*)` tokens

**Variation counts (defaults — overridable):**
| Output format | hero | body | cta | total |
|---|---:|---:|---:|---:|
| linkedin-carousel | 3 | 10 | 3 | 16 |
| linkedin-infographic | 2 | 6 | 2 | 10 |
| instagram-carousel | 3 | 8 | 2 | 13 |
| single-image | 4 | — | — | 4 |

**Steps:**

0. **Mode declaration (MANDATORY — print at start).** Determine mode by inspecting brand_context. Never silent-fallthrough.

   | `visual_refs/` | `composition-intents/` | Mode | Approval gate (Phase 4.9) |
   |---|---|---|---|
   | empty / missing | N/A | **GENERIC** | SKIPPED (user knew no refs were provided — generic is expected) |
   | populated | populated | **ANCHORED** | **REQUIRED** (user must approve before templates ship `ready`) |
   | populated | empty | **BLOCKED** | Hard-stop. Phase 4.5 must run first. Auto-route to it. |

   Print the declaration explicitly per Phase Contracts. Without this, the user can't tell which mode ran.

1. **Verify foundation** — confirm `brand_context/visual-identity/tokens.json` exists. If not, route user to Mode E/I/B first.
2. **Load output_format spec** — canvas dimensions, role definitions, slot budget thresholds.
3. **Generate variation HTMLs** — for each role (hero/body/cta) generate N templates by varying:
   - Composition primitive (typographic-stack / 2-col / grid / full-bleed / image-overlay / numbered-list / quote / stat / timeline / code-mock / etc.)
   - Brand moves from `brand_context/visual-identity/moves.md` applied (paper-texture, accent-bar, oversized-numeral, etc.)
   - All using the SAME type scale and palette from `brand_context/visual-identity/tokens.json` (consistency across variations)
   - Templates parameterized via CSS variables (`var(--brand-*)`, `var(--type-*)`, `var(--space-*)`) and Mustache placeholders (`{{HEADLINE}}`, `{{BODY}}`, etc.) consumed by `render_template.py`
4. **Write manifest.json** with:
   - Per variation: ID, role, primitive, design moves used, slot schema (required + optional vars + budgets), when-to-pick signals
   - In **ANCHORED** mode: all entries start `status: "draft"` until the orchestrator reviews each builder's returned preview and approves it (see Phase 5 below).
   - In **GENERIC** mode: entries ship `status: "ready"` directly (no gate — user opted out of refs).
5. **Preview render** — produced inside ssc-template-builder (per template). Every template ships with a `preview.png`.
6. **Template approval** — the orchestrator (you) reviews each builder's returned preview in ANCHORED mode. SKIPPED in GENERIC. See Phase 5 below for the agent dispatch.
7. **Audit consistency** — all variations must use same type scale, same canvas size, same brand palette. Variation is in LAYOUT, not in STYLE.

**Anti-patterns:**
- ❌ Variations that drift in font/color from tokens.json (each variation should be "same brand, different layout")
- ❌ Variations that all look the same just with text swapped (no compositional difference = not a variation)
- ❌ Generating more than the configured count (user wants exactly N — more variations = decision fatigue downstream)
- ❌ Skipping the validation preview (user MUST see and accept the library before downstream skills consume it)

Mode T is **per-(brand × output_format)**. If user has 2 brands and 3 output formats, they end up with 6 template libraries, each tuned to that combination.

## Phase Contracts (mode declaration + hard gates — no silent fallback)

Each phase declares **PRECONDITION**, **MODE**, **OUTPUTS**, **BLOCKERS**. Phases print their mode at start and hard-block when preconditions fail. The previous "silent fallback to generic" pattern is REMOVED — it caused the bug where Phase 4.5 was skipped without warning, Mode T ran in generic mode invisibly, and the user only saw the mismatch at carousel generation time.

**Universal rule:** every phase that mutates `brand_context/` MUST print at start:

```
PHASE {X} STARTING
  mode: {ANCHORED|GENERIC|BLOCKED}
  inputs: {summary of inputs}
  outputs: {what will be written}
  approval_gate: {ENABLED|SKIPPED}
```

**Contract table:**

| Phase | Precondition | Mode determinants | Hard blockers |
|---|---|---|---|
| 1 Intake | brand name set | always runs | no brand name → BLOCK |
| 2 Per-ref analysis | Phase 1 wrote `visual_refs/` | always anchored | no refs → SKIP (route to Mode B) |
| 4.5 Composition extract | `visual_refs/` populated | always anchored | refs present + intents empty → BLOCK Mode T downstream |
| 4.6 Surface extract | 4.5 wrote intents | per-intent decision | no intents → SKIP |
| 4.8 Preview render | manifest has entries | always runs | no entries → SKIP with note |
| **4.9 Template Approval Gate (NEW)** | 4.8 generated previews AND Mode T ran ANCHORED | ANCHORED only | no previews → BLOCK; GENERIC mode → SKIPPED |
| Mode T factory | `tokens.json` exists | ANCHORED if intents present, GENERIC if not, BLOCKED if refs present without intents | refs without intents → BLOCK + auto-route to 4.5 |

**Why this section exists:** without these guards, a session with refs in `visual_refs/` but zero composition-intents lets Mode T fall back to generic mode silently, producing templates that ignore the brand. Hard blockers + mandatory mode declaration prevent that class of failure.

## Step-by-step: Extract mode (the canonical flow)

### Phase 1 — Intake
- Read user input. If folder path → list contents. If single file → use directly.
- For each `.pdf`: rasterize all pages to PNGs in `{brand_context}/visual_refs/`.
- For each image: copy to `{brand_context}/visual_refs/` if not already there.
- Output: list of reference image paths.

### Phase 2 — Per-reference analysis

**TWO COMPLEMENTARY PASSES — but each runs on a DIFFERENT input set based on the Step 0.4 classification:**

| File category (set in Step 0.4) | Pass 2a (pixel extraction) | Pass 2b (vision composition) |
|---|---|---|
| BRAND assets (logo, headshot, posts-archive) | ✅ **RUNS** — these are the legitimate source for the brand's palette + canvas dimensions | ❌ skipped — not composition refs |
| TEMPLATE refs (other brands' work the user wants to copy) | ❌ **DO NOT RUN** — their palette is THEIR brand, not the user's | ✅ **RUNS** — composition primitives (where text sits, photo treatment, masthead) |

**Why this routing is non-fungible:** running k-means on a template-ref pulls in colors that belong to the OTHER brand (e.g., `<brand-handle>`'s orange becomes the user's "extracted accent" — wrong source of truth). Template refs contribute COMPOSITION ONLY (layout / hierarchy / chrome / typography ROLE). Typography exact families and palette exact hex come from the user's own brand assets OR explicit user input (Phase 3).

#### Pass 2a — Deterministic pixel extraction (`scripts/extract_tokens.py`) — **BRAND assets only**

For each file in `visual-identity/logos/`, `visual-identity/headshots/`, `visual-identity/posts-archive/`:

- **Colors**: k-means (k=6) on pixel histogram → top dominant colors with %. Save to `spec.json`.
- **Dimensions**: image size, aspect ratio.
- **Region brightness**: dark/light/mid percentages.
- **Texture detection**: sample noise variance to flag "textured" vs "flat" backgrounds.

The logo's dominant non-bg color usually wins as `colors.accent`. The headshot's bg color often informs `colors.bg_dark` or `colors.bg_light`. Posts-archive (if provided) confirms the existing brand palette. **Template refs are SKIPPED in Pass 2a** — they are processed in Pass 2b (composition only).

This handles things vision is imprecise about: exact hex codes, exact bbox pixels, color quantization.

**`colors.accent_secondary` — the swatch count must follow the brand's REAL palette, not a fixed target.** A 4-swatch brand (ink · paper · accent · accent-2) is fully first-class — populate `accent_secondary` whenever the brand genuinely has a second accent. The rule is about VALIDITY, not preferring fewer colors: set it when the second accent is real, omit it when it isn't. Every downstream consumer (brand-book swatches, ssc-designer tints, image-gen) already handles both 3- and 4-color brands, so neither count is "preferred" — match the refs.

A k-means cluster is NOT automatically a brand color. Do NOT promote to `accent_secondary` a hue that is any of:
- **trace weight** — below ~8% of pixels in the source it came from (e.g. a `#c7aca8` at 1.6% is almost always a photo artifact, not a brand decision);
- **a photographic tone** — skin, hair, desaturated rose/beige, sky, wood — these leak from headshots/scene photos and are never brand accents;
- **a near-neutral** — low-saturation greys/taupes that read as "off-white variant", not an accent.

Promote a second accent when it is designer-chosen and recurs across refs with intent (a pill fill, a kicker color, a data-viz highlight that appears on multiple slides) — then the brand book correctly shows 4 swatches and templates get the real second tint. When the only candidates are trace/photographic/near-neutral, omit it — that's a genuine 3-color brand, not a degraded one. The failure to avoid is **inventing** a phantom accent (a 1.6%-weight `#c7aca8` shipped as "Accent 2" when it existed in no ref as an accent), NOT having four colors. Validity gate in, count bias out.

#### Pass 2b — Claude vision classification (PRIMARY, the orchestrator does this)

Claude (the LLM running this skill) **reads each rendered reference image directly** and classifies it. Vision is far more accurate than regex/text analysis for understanding visual composition. Regex on body copy cannot recover designer intent like "this slide uses a filing cabinet metaphor" — but vision can.

For each reference image, Claude examines and emits this JSON briefing:

```json
{
  "page": "ref-pdf1-p4.png",
  "title": "3. Point, Don't Dump",
  "body": "Stop pasting your entire brand guide...",
  "visual_kind": "metaphor_illustration",
  "visual_evidence": "custom hand-drawn illustration of claude.md note card connected via red arrows to filing cabinet with 'Brand Voice' and 'Docs' labels. This is metaphor — claude.md is not literally a filing cabinet.",
  "has_screenshot": false,
  "has_code_block": false,
  "has_comparison": false,
  "has_sketch_overlay": false,
  "is_cover": false,
  "is_cta": false,
  "concrete_metaphor_objects": ["filing cabinet", "note card", "drawer"],
  "recommended_template": "body-illustration",
  "recommended_mode": "HYBRID_AI"
}
```

**Classification criteria Claude applies (visual checklist):**

| If I see in the image... | visual_kind | Mode | Template |
|---|---|---|---|
| Headline + decorative chrome, no body content visual | `cover_hook` | PURE_CSS | cover-dark |
| Single ALL CAPS message in a framed card | `cta_typographic` | PURE_CSS | cta-allcaps |
| A real UI screenshot (browser, IDE, app), possibly with sketch overlay | `screenshot_real` | PURE_CSS+img + overlay | body-screenshot |
| A code block / terminal / CLI command rendered as text | `code_mock` | PURE_CSS + overlay | body-screenshot (code variant) |
| Two parallel columns showing A vs B | `comparison` | PURE_CSS | body-screenshot (2-col) |
| **A custom illustration of a CONCRETE OBJECT not literally related to the topic** (cabinet for organization, wall for blocking, tower for instability) | **`metaphor_illustration`** | **HYBRID_AI** | **body-illustration** |
| **A flow/system diagram with hand-drawn feel (not boxes-and-lines schematic)** | **`concept_diagram`** | **HYBRID_AI** | **body-illustration** |
| Heavy red sketch annotations (circles, arrows, handwritten labels) overlaid on screenshot/code | (note in `has_sketch_overlay: true`) | + sketch overlay | (any of above) |

**Why vision and not regex:** regex on body text fails to recover metaphor objects (filing cabinet, brick wall) because they are NEVER in the technical copy — they're the designer's creative choice. Vision sees them immediately.

#### Output
Merge 2a + 2b → `{brand_context}/_analysis/{ref_name}.briefing.json`.

### Phase 2.5 — Capture summary (mandatory before advancing)

After completing the analysis of each reference, **present a structured summary** of what was captured and declare the execution plan. Do NOT advance to the font phase or trace overlay without this step.

**Summary format (free text + AskUserQuestion):**

First, write a chat message with the following template:

```
**Here's what I captured from your references:**

🎨 **Palette** — [N colors identified]
  • Primary: #XXXXXX (tone: dark/light/vibrant)
  • Accent: #XXXXXX
  • Background: #XXXXXX
  • [remaining colors with %, e.g.: "occupies 34% of the pixels"]

🔤 **Typography**
  • Display: [name or "not identified — best match: Geist Black"] — weight [W]
  • Body: [name or match] — weight [W]
  • Typographic style: [e.g.: "condensed and heavy", "clean geometric", "editorial serif"]

✏️ **Visual style**
  • Content density: [light / medium / dense]
  • Visual tone: [e.g.: "monochrome minimalist", "bold editorial with a warm accent", "technical with a dark background"]
  • Background texture: [flat / grainy / papery]
  • Decorative elements: [e.g.: "lateral accent bar", "slide-number pill", "none"]

📐 **Layouts identified (per slide/reference)**
  | Ref | Role | Visual kind | Render mode |
  |-----|------|-------------|----------------|
  | p1  | cover | cover_hook  | PURE_CSS       |
  | p2  | body  | code_mock   | PURE_CSS       |
  | p3  | body  | metaphor_illustration | HYBRID_AI |
  | p4  | cta   | cta_typographic | PURE_CSS   |

**What I'll do with this:**
1. Confirm the font (font identification phase)
2. Build [N] templates via trace overlay — one per unique role above
3. Consolidate everything into `brand_context/visual-identity/tokens.json` + `identity.md` + `moves.md`
```

Then ask via `AskUserQuestion`:

```
AskUserQuestion({
  questions: [{
    question: "Anything look wrong or want to fix before I build the templates?",
    header: "Review capture",
    multiSelect: false,
    options: [
      { label: "All good — proceed",
        description: "Continues to font identification and template construction." },
      { label: "I want to fix colors",
        description: "Give me the correct hex codes and I lock those fields." },
      { label: "I want to fix typography",
        description: "Tell me the font name and I use that locked value." },
      { label: "I want to fix layouts",
        description: "Point out which slide has the wrong role/mode." }
    ]
  }]
})
```

**Rules for this step:**
- If the user picks "All good", advance immediately to Phase 3.
- If they correct any field, write the value as a `locked_field` in `tokens.json` before continuing.
- If no reference produced font data (image with no legible text), omit the typography section and flag: "I didn't detect text in the refs — I need you to confirm the font before advancing."
- Never skip this step even if the references are few or simple — the user needs to validate the capture before the costly trace-overlay iteration.

### Phase 3 — Font confirmation *(user input — NEVER from template refs)*

Fonts belong to the user's BRAND, not to the template references. Even if vision can guess the font family used by `<brand-handle>`, that's <brand-handle>'s font, not the user's. Phase 3 asks the user, with sensible defaults derived from the visual MOOD of the refs (sharp vs literary vs editorial vs technical).

**Source priority (in order):**

1. **Brand-book / Figma export already declared the font** → if `visual-identity/_brand-book/*.{json,css,figma.json}` parses cleanly with declared `font-family`, use that. Lock `fonts` as `locked_field`. SKIP popup.
2. **Posts-archive shows a consistent font** → if user uploaded their own existing posts (BRAND category in Step 0.4), prefer asking them to NAME it explicitly rather than guessing. Show one of their posts cropped to the headline area as visual aid in the popup.
3. **No brand evidence** → AskUserQuestion popup with 4 curated free-font pairings, mood-tagged from the style of the template refs.

**The popup (case #3, most common):**

```python
AskUserQuestion({
  questions: [{
    question: "Which font pair do you want for your brand? Editorial templates usually use a display sans + a body sans. (I can download Google Fonts automatically — no manual install.)",
    header: "Brand fonts",
    multiSelect: false,
    options: [
      { label: "Inter Tight 900 + Inter — sharp, digital, neutral",
        description: "Condensed heavy display, legible body. Inspired by refs like Bloomberg, <brand-handle>, Stripe." },
      { label: "Fraunces italic + Inter — literary editorial",
        description: "Serif display with axes (ital, opsz, wght). Inspired by refs like The Atlantic, magazine cover hero." },
      { label: "Geist Black + Geist — clean technical",
        description: "Modern minimalist pairing. Use when the refs are clean and constructivist." },
      { label: "Custom — I'll send the .ttf/.woff2 file",
        description: "You upload the font files and I use them. I need the display + body separately." }
    ]
  }]
})
```

**After the user picks:**

- For Google Fonts pairings, download to `{brand_context}/visual-identity/fonts/` via `fetch_font.py` (stdlib-only Google Fonts CSS2 resolver, no API key). Emits one `.woff2` per weight/style (`latin` subset; covers PT-BR/ES accents). Example: `uv run .claude/skills/mkt-visual-identity/scripts/fetch_font.py --family "Inter Tight" --weights 900 --family "Inter" --weights 400,500,700 --output-dir brand_context/visual-identity/fonts`.
- For Custom, prompt the user to upload the .ttf/.woff2 files. Store in same fonts/ folder.
- Persist as `tokens.json > fonts.{display,body}` AND mark in `tokens.json > locked_fields: ["fonts.display", "fonts.body"]` — the extractor never overwrites user-confirmed fonts on re-run.

**Mood-derived defaults:** the orchestrator may pre-select the option that best matches the template refs' visual mood, but the user always confirms. Never silent-pick.

**No font extraction from template refs — ever.** The previous `identify_font.py` heuristic was both unbuilt AND architecturally wrong: it would copy other brands' fonts onto the user's brand. Removed.

### Phase 4.7 — Brand bible v1 + identity approval gate *(BLOCKS template generation)*

Before deriving any templates from the brand identity, generate a v1 brand bible PDF and get the user's explicit approval of the identity. This catches errors in tokens/fonts/colors/moves BEFORE they propagate to 5+ templates.

```bash
uv run --with playwright --with pillow python .claude/skills/mkt-visual-identity/scripts/generate_brand_bible_pdf.py \
    --brand-context brand_context/ \
    --output brand_context/visual-identity/brand-book.pdf
```

The script naturally produces a slimmer PDF in v1 (no `templates/{pool}/_preview/` files exist yet → template-gallery page is skipped automatically — there's no opt-out flag needed). The PDF will contain:
1. Cover with brand name
2. Tokens (colors, fonts, type scale)
3. Typography samples
4. Layout / canvas / spacing
5. Design moves (one page per move from `moves.md`)
6. (skipped — no templates yet)
7. What we stand against (anti-patterns)

After the PDF generates, open an `AskUserQuestion` popup:

```python
AskUserQuestion({
  questions: [{
    question: f"Brand bible v1 generated: {brand_book_path}\n\nReview tokens (palette, typography, moves) BEFORE the templates are derived. OK to proceed?",
    header: "Approve identity",
    multiSelect: False,
    options: [
      { label: "Approved — generate templates now",
        description: "Advances to Phase 5. Templates will be derived from this identity." },
      { label: "Refine tokens first",
        description: "Goes back to Phase 3 (fonts/colors) or Phase 4 (token consolidation). You say what to adjust." },
      { label: "Refine moves first",
        description: "I edit moves.md with the adjustments you indicate, regenerate the PDF, show it again." }
    ]
  }]
})
```

Loop until the user picks "Approved". ONLY after explicit approval, advance to Phase 5.

**Why this gate exists:** in the previous flow, brand-book was generated AFTER templates (Phase 5). If tokens were wrong, the user saw the impact only in the templates — by then 5+ templates had to be regenerated. Phase 4.7 catches identity errors before they propagate. Sub-skills generating downstream content (ssc-template-builder, ssc-designer) rely on tokens.json + moves.md being final.

### Phase 4.95 — Template family clustering *(recommended before Phase 5 — warning, not a hard-stop)*

> Lightweight protocol: `references/analyze-templates.md`. You (the orchestrator) are the QA. If a grouping is uncertain, proceed with your best call and let preview time correct it — never hard-stop the pipeline on a clustering doubt.

**Why this phase exists:** previously Phase 5 looped `for ref_path in visual_refs/`, spawning ONE builder per ref. The result: if the user uploaded 7 refs that were structurally 3 templates (1 cover + 5 body variants + 1 cta), the orchestrator generated 7 templates instead of 3. Each body variant was treated as a distinct template, producing N near-duplicates with no understanding that they're variants of ONE family — and the only thing that should change between bodies is the AI image subject, not the layout.

**Goal:** look at ALL refs together, cluster them into FAMILIES, and elect a canonical ref per family. Phase 5 then spawns ONE builder per FAMILY, not per ref.

**This is in-orchestrator work, NOT a sub-agent spawn.** Clustering is lightweight visual reasoning that the main orchestrator (this Claude session) does directly. You already have brand context loaded (tokens.json, identity.md, moves.md) — use it to inform clustering decisions. Spawning a sub-agent would only re-load the same context with no isolation benefit.

**Step 1 — Read each ref via the Read tool, then cluster:**

You (the orchestrator) read each file in `{brand_context}/visual_refs/` via the Read tool (vision). After all are loaded into context, group them by STRUCTURAL family, NOT by content. Two refs are the same family when they share:

- Same role (cover | body | cta)
- Same layout skeleton (text positions, image-zone presence/position, chrome layout)
- Same background route (solid | textured | scene-with-figures)
- Same number and type of slots (1 headline + 1 body + 1 image-zone, etc)

Examples of "same family":
- Two body slides with title-on-top + image-zone-in-middle, where ONLY the AI
  image subject changes → SAME family, NOT two templates.
- Three cover variants with the same hero-headline structure but different
  taglines → SAME family.

Examples of "different family":
- A cover with logo-stamp + headline vs a body with no logo and centered image
  → DIFFERENT families.
- A body with image-zone-in-middle vs a body with image-zone-as-background
  → DIFFERENT families.

For each family detected:
1. Pick the canonical ref — the one most representative of the family (clearest
   structure, least content-specific quirks).
2. List all sibling refs (variants of the same family).
3. Describe in 1 sentence what changes between siblings (almost always: the AI
   image subject or the body text content — NOT the layout).
4. **Set `has_image_zone` explicitly.** TRUE when the family contains a bounded
   region (typically ≥20% canvas area) holding an AI-generated illustration,
   photograph, or stylized scene composition that varies per slide. FALSE when
   the family is pure text + brand chrome (logo, dot-grid, frame border) with
   no AI image required. This flag drives whether Phase 4.96 includes this
   family's refs in the brand-wide AI image style extraction.

Output a YAML file written to:
{brand_context}/visual-identity/template-families.yaml

Schema:

```yaml
families:
  - id: cover-{descriptive-slug}
    role: cover | body | cta
    canonical_ref: visual_refs/{filename}.png
    siblings:                          # other refs in same family (can be empty)
      - visual_refs/{filename}.png
    has_image_zone: true | false       # explicit flag: does this family have an
                                       # AI-generated image-zone (illustration,
                                       # photo, scene)? Phase 4.96 reads this to
                                       # decide which refs feed style extraction.
    structural_summary: |
      <one paragraph describing what the family IS — layout skeleton + slots
       + background route + chrome presence. NOT content-specific.>
    variation_axis: |
      <what changes between canonical and siblings — usually "AI image subject"
       or "headline content". If only one ref in family, write "single instance".>
```

**`has_image_zone` rule:** mark TRUE when the family contains a bounded region (typically ≥20% canvas area) that holds an AI-generated illustration, photograph, or stylized scene composition that varies per slide. Mark FALSE when the family is pure text + brand chrome (logo, dot-grid, frame border) — no AI image required at content-gen time.

**Family-count expectations scale with ref count.** Don't hardcode a target — let the actual structural diversity decide:

| Ref count | Typical family count | Over-splitting flag |
|---|---|---|
| 1-3 refs | 1-2 families | More than 3 |
| 4-7 refs | 2-4 families | More than 5 |
| 8-15 refs | 3-6 families | More than 7 |
| 16+ refs | 4-8 families | More than 10 |

If you exceed the over-splitting flag, re-check: are you splitting purely on content (different headline copy, different image subject)? Those are NOT family-distinguishing — same family.

If you produce 1 family from 5+ refs, you may be under-splitting — re-check whether any ref has structurally different chrome, image-zone position, or background route.

Once you've decided the families, write the YAML directly to `brand_context/visual-identity/template-families.yaml` via the Write tool.

**Step 2 — Self-validate before proceeding:**

After writing, verify:

- `families[*].canonical_ref` points to a file that exists in `visual_refs/`
- `families[*].siblings[*]` points to files that exist in `visual_refs/`
- Every ref in `visual_refs/` appears EXACTLY once (as canonical or as sibling) across all families — no ref is in two families, no ref is dropped.
- Every family has `has_image_zone` set to a boolean (true or false), NOT missing.

If any check fails, EDIT the file to fix and re-validate. This is a quick sanity check, not a heavy retry loop — you wrote it, you have the context, you can fix it.

**Step 3 — Surface to user (optional approval gate):**

Print a one-line summary per family:

```
Detected 3 template families from 7 refs:
  • cover-dark-byline-pill   (1 canonical, 0 siblings)
  • body-text-with-ai-image  (1 canonical, 4 siblings — variation: AI image subject)
  • cta-allcaps-framed       (1 canonical, 1 sibling — variation: CTA copy)
```

Skip the approval popup unless the user opts in via a config flag. The clustering is meant to be invisible — if it's wrong, the user will see it at preview time and we re-run.

---

### Phase 4.96 — Brand-wide AI image style extraction *(recommended when a family has an image-zone — warning if skipped; the builder proceeds without it)*

**Why this phase exists:** previously `ai-image-style.md` was written by the FIRST template-builder that hit Case D-main (Step 4) — the so-called "first-encounter" logic. That meant the brand AI image style was inferred from ONE ref, in a sub-agent's narrow context, mid-template-build. Two bugs followed: (a) if the first-processed ref had an atypical image, the brand vibe was biased; (b) sibling refs in the same family could've contributed more signal but were never consulted.

**Goal:** before any builder runs, look at ALL refs that contain AI-generated imagery (across all families from Phase 4.95) and infer the brand's AI image style from the FULL sample. With 5-8 image samples the style fingerprint is much more robust than with 1.

**Step 1 — Decide if this phase is needed:**

Read `brand_context/visual-identity/template-families.yaml` (Phase 4.95 output) and filter to families where `has_image_zone: true`. If NONE of the families have it, SKIP this phase (the brand has no AI image requirement; templates are pure text + brand chrome).

If `brand_context/visual-identity/ai-image-style.md` already exists with `status: validated`, ALSO SKIP — the brand contract is locked. Re-run only when the user explicitly asks.

**Step 2 — Read the image-zone refs and extract the brand style (in-orchestrator):**

Like Phase 4.95, this is lightweight visual reasoning. You (the orchestrator) do it directly — no sub-agent spawn. The refs you read for Phase 4.95 clustering are likely still in your context; if not, re-read the ones flagged with `has_image_zone: true`.

Collect ALL ref paths from families where `has_image_zone: true`:
```
image_zone_refs = [
    family.canonical_ref
    for family in families if family.has_image_zone
] + [
    sibling
    for family in families if family.has_image_zone
    for sibling in family.siblings
]
```

For this set of refs (typically 4-8), act as a senior art director and extract the BRAND VISUAL SYSTEM that all these images share. Your job is NOT to describe what's IN each image (the subjects vary per slide). Your job IS to identify the locked style language.

Look across the full set and answer:

1. **Medium** — what rendering style? (photorealistic-3d-render | flat-illustration |
   watercolor | sketch | mixed | editorial-photo)
2. **Palette** — what 3-5 colors recur across MOST images? Include the accent color
   (the one brand pop), supporting hues, and the background neutral. Sample as hex.
3. **Lighting** — studio-flat-soft | dramatic | natural | none?
4. **Subject treatment** — isolated-on-light-bg | full-bleed | inset-with-shadow | cutout?
5. **Typical subjects** — list of recurring subject types (robot, character-with-laptop,
   tech-object, hands-holding-paper, etc). Generic categories, not specific instances.
6. **Aspect ratio** — square | 4:5 | 16:9 | other?
7. **Annotation overlay** — do the images include hand-drawn marker overlays
   (red sketch lines, handwritten labels, arrows)? If yes, capture style + color +
   stroke width.

Critical rules for the prompt_template you write:

- USE technical art-direction language: "octane render soft pastel", "flat vector",
  "editorial minimalism", "matte texture", "studio key light from upper-left".
- DO NOT use overused AI-prompt junk: "epic", "cinematic", "8k", "masterpiece",
  "ultra-detailed", "stunning". These produce generic AI slop.
- Parameterize the SUBJECT only — everything else is locked brand style:
    "Photorealistic 3D render of {{subject}}, studio lighting from upper-left,
    isolated on light grey paper background, hand-drawn coral sketch annotations
    overlaid, editorial-tech aesthetic, matte texture, no text legible."

Write the result via the Write tool to:
{brand_context}/visual-identity/ai-image-style.md

Schema (frontmatter):

```yaml
---
medium: <one of the values above>
palette:
  - "#c25849"   # accent (with role comment)
  - "#262626"   # primary text
  - "#ebebeb"   # bg
lighting: <value>
subject_treatment: <value>
typical_subjects:
  - <category 1>
  - <category 2>
aspect_ratio: <value>
prompt_template: |
  <full prompt with {{subject}} placeholder — see rules above>
annotation_overlay:
  enabled: <true|false>
  style: <if enabled, e.g., hand-drawn-marker>
  color: <hex>
  stroke_width: <0.3-1.0 in cqw>
status: first-encounter
---
```

Then a body section:

```markdown
## How this was derived

Inferred from N refs ({list refs}). Cross-reference observations:
- All N refs share <observation 1>
- M of N refs show <observation 2>
- Annotation overlay style is consistent: <details>

## Anti-patterns to avoid

When generating new images for this brand, do NOT:
- <specific failure mode 1 you'd warn against>
- <specific failure mode 2>
```

Use the Write tool to save both the frontmatter and the body to the file, then proceed to Step 3.

**Step 3 — Status tracking:**

Status starts as `first-encounter`. When the FIRST template that uses this style (via Phase 5 Case D-main) renders and the user approves it via the per-template popup, the orchestrator flips status to `validated` by editing the file's frontmatter.

If the user rejects that first template SPECIFICALLY because the AI image was off-brand (not because of layout), return `status: needs-user-decision` so the user can edit `ai-image-style.md` directly before re-running Phase 5.

**Step 4 — Generate a sample render (best-effort, non-blocking):**

Immediately after writing the style contract, attempt to generate ONE sample image using the `prompt_template` filled with `typical_subjects[0]`:

```bash
mkdir -p {brand_context}/visual-identity/_ai-style-test/
uv run .claude/skills/viz-image-gen/scripts/generate_image_gpt.py \
    --prompt "<filled prompt_template>" \
    --output {brand_context}/visual-identity/_ai-style-test/sample.png \
    --aspect <from frontmatter>
```

**Fallback rule:** if the sample generation fails (missing API key, network error, quota exceeded), log a one-line warning and proceed to Phase 5 anyway. The contract in `ai-image-style.md` IS the source of truth — the sample is just a sanity preview. Phase 5 will generate per-template AI images with the same contract; if the contract is wrong, the orchestrator will catch it when reviewing each template's preview.

Surface the sample path (or the failure) in the phase summary so the user can spot-check before Phase 5 burns API credits on N templates with a wrong style contract:

```
[ok] brand_context/visual-identity/ai-image-style.md  (status: first-encounter)
[sample] brand_context/visual-identity/_ai-style-test/sample.png — review before Phase 5
```

If the user objects to the sample, edit `ai-image-style.md` and re-generate. If the user accepts, proceed to Phase 5.

---

### Phase 4.97 — Style grouping *(NEW — runs after families are known; ALWAYS confirms with the user)*

**Why this phase exists:** a brand may carry MULTIPLE distinct looks (e.g. an editorial-paper aesthetic AND a bold-brutalist one). Family clustering (4.95) dedupes structurally-identical refs into templates, but it does not say WHICH templates belong together as a coherent set. A **style** is a curated group of families — spanning roles (its own hero(s) + bodies + cta) — that share an aesthetic; per carousel the user picks ONE style so the whole carousel coheres. This producer phase is self-contained (the grouping + role rules are inline below; the `styles.json` shape is in Phase 5.6). The carousel-time CONSUMER (picker + scoping) lives in `00-social-content` (`ssc-designer` + `references/decisions/styles.md`) when that pack is installed — slides/youtube don't consume styles.

**A style is NOT a recolor.** Refs that differ only in palette/icon are already the SAME family (4.95) → the SAME template, re-themed by tokens. A new style = a genuinely different composition / layout / type system. **Families can be shared across styles** — a neutral hero or cta family may belong to several styles. This `style` is also distinct from the per-slide `ai_style` (the AI-image style).

**This is in-orchestrator visual reasoning (no sub-agent)** — you already read every ref in Phase 4.95; reuse that context.

**Step 1 — Group families into styles.** Look at the families in `template-families.yaml` together and group them by AESTHETIC signature (texture / bg treatment, type system, density, color treatment — the "look", a level above the structural skeleton 4.95 split on). Assign each family to ≥1 style; a neutral family may be shared. Aim for the natural number of looks in the refs — usually 1-5. If the brand has ONE consistent look → ONE style (see Step 3).

**Step 2 — Role-completeness per style.** Each style MUST cover the roles a carousel needs, or it can't be built on its own. Per style verify it has: ≥1 cover family with a full-bleed image zone; ≥1 cta family that is image-less; ≥2 body families spanning light + dark tone. If a style misses a role, either (a) SHARE a suitable family from another style (preferred — heroes/ctas are often style-neutral), or (b) flag it so Phase 5 builds a fitting one in that style's type system. Record the resolution.

**Step 3 — ALWAYS confirm with the user (`AskUserQuestion`).** Unlike 4.95's invisible family clustering, the style grouping is shown for EXPLICIT approval — the user owns their styles:

```
I grouped your {N} families into {K} styles:
  • editorial-paper  — cover-dark-byline-pill, body-pullquote, body-data-stat, cta-typographic
  • bold-brutalist   — cover-fullbleed, body-comparison, cta-question   (cta-typographic shared)
Is this correct? Can I proceed like this?
```

Options: **Approved** / **Re-group** (user moves families between styles, renames, merges/splits) / **Cancel**. Loop until approved. If only ONE style is detected, still confirm ("a single visual identity, no style variations") and proceed — but write NO `styles:` section (single-look brand → flat pool, no carousel-time picker).

**Step 4 — Record the grouping.** Append a `styles:` section to `template-families.yaml` (omit entirely when there is one style):

```yaml
styles:
  - name: editorial-paper           # kebab-case id
    label: Editorial Paper          # shown in the carousel-time picker
    description: <one line>
    family_ids: [cover-dark-byline-pill, body-pullquote, body-data-stat, cta-typographic]
  - name: bold-brutalist
    label: Bold Brutalist
    description: <one line>
    family_ids: [cover-fullbleed, body-comparison, cta-typographic]   # shared cta repeats
```

`family_ids` are the slugs Phase 5 will build (= template ids). Shared families repeat across styles. The consumer-facing `templates/{pool}/styles.json` (schema in `references/decisions/styles.md`) is assembled from this AFTER Phase 5 builds the templates and previews exist — this phase only records the grouping + the user's approval.

---

### Phase 5 — Per-FAMILY template extraction *(spawn `ssc-template-builder` per family)*

**THE PER-TEMPLATE WORKFLOW lives in `.claude/agents/ssc-template-builder.md`.** For EACH family from Phase 4.95, the orchestrator spawns ONE `ssc-template-builder` agent that owns the simplified lifecycle (quick vision read → Template Card → icon assets → hero image generated **edit-from-ref** (the family ref fed back as `--input-image`, prompt = delta only) → template.html → preview → one self-QA pass → returns Template Card + HTML + preview). No clean_ref, no measurement YAML, no nested art-director QA, no approval popup inside the builder — **you, the orchestrator, are the QA.**

**Why this changed:** processing many refs inline in one thread linearizes into skip-prone behavior and near-duplicate templates. Spawning ONE agent per FAMILY gives each template a clean fresh context and a short, mechanical workflow defined by the agent file.

**Per-ref folder layout (clean root + workdir):**

```
brand_context/templates/{pool}/{slug}/
├── template.html                ← the template (slots + chrome + image-zone)
├── instructions.md              ← the Template Card (inventory + slots + summary)
├── preview.png                  ← final render
├── assets/                      ← ref-canonical.png (edit-from-ref input) + icon assets
├── _ai_bg/photo_main.png        ← hero image generated edit-from-ref
└── _workdir/                    ← optional self-QA diagnostics
```

**For each FAMILY in `template-families.yaml`, spawn ONE `ssc-template-builder` agent.** The orchestrator does NOT do any of the per-template work in its own thread — every step happens inside the spawned agent. The agent receives the canonical ref + siblings, and produces ONE template that serves the whole family.

```python
# Pseudocode — actual orchestration loops over template-families.yaml entries
families = yaml_load("brand_context/visual-identity/template-families.yaml")["families"]

for family in families:
    slug = family["id"]                      # already kebab-case from clustering
    role = family["role"]                    # cover | body | cta
    canonical_ref = family["canonical_ref"]  # the elected canonical ref
    siblings = family["siblings"]            # list of other refs in same family (for context)
    template_dir = f"brand_context/templates/{pool}/{slug}/"

    result = Agent({
      subagent_type: "general-purpose",
      description: f"Template build — {slug}",
      prompt: f"""You are ssc-template-builder (read .claude/agents/ssc-template-builder.md).

      ref_path: {canonical_ref}
      sibling_refs: {siblings}             # other refs in same family — use them ONLY to confirm
                                            # what's structural-vs-variable. Do NOT generate
                                            # multiple templates for them.
      template_dir: {template_dir}
      pool: linkedin-carousel
      slug: {slug}
      role: {role}
      brand_context: {brand_context_abs_path}
      brand_name: {brand_name}
      structural_summary: {family["structural_summary"]}    # from Phase 4.95
      variation_axis: {family["variation_axis"]}            # what changes between siblings

      notes: {any brand-aware context for this specific family}

      Run the full workflow per your <workflow> section. The output is ONE template
      that covers the canonical ref AND all siblings — the variation_axis tells you
      which slot(s) are user-editable across the family.

      Return the JSON result per <output_format>."""
    })
    # result is a JSON string: { slug, status, template_card, template_html, preview_path, self_qa, ... }
    collected_results.append(json.loads(result))
```

**Why family-mode beats per-ref mode:**
- Eliminates near-duplicate templates (7 refs → 3 templates, not 7).
- The builder USES siblings as confirmation that a slot is variable (e.g., 4 body refs with different AI image subjects → confirms the image-zone is a slot, not a fixed asset).
- Faster: 1 builder per family with siblings as supporting context, instead of N independent builders re-deriving the same layout N times.

After each agent returns, the orchestrator collects the result. After ALL agents complete, advance to Phase 5.5 (G2 + G4 brand-level gates).

**Parallel vs serial spawning:** since Phase 4.95 reduces N refs to M ≤ N families, you typically have 2-8 builders to spawn. ALWAYS prefer parallel spawning (multiple Agent calls in one message) — total wall-clock time = time of slowest builder, not sum. Serial only when one builder's output is genuinely input for another (rare; clustering already isolated families).

For M ≥ 6 families: split into 2 parallel batches to avoid hammering the API rate-limit. Batch 1 spawns concurrently, then Batch 2 spawns after Batch 1 returns.

**When a builder returns `status: needs-user-decision`:** the orchestrator surfaces the agent's `notes_for_orchestrator` to the user via popup and waits. Do NOT silently skip a problematic template.

The simplified builder returns only `ready` or `needs-user-decision` — there is no automatic regenerate loop. You look at the returned preview and decide.

**Hard rules (universal, honored by ssc-template-builder):**
- **Brand wins on font + color**: family from `tokens.json > fonts`, color from `tokens.json > colors`. Size, weight, italic, opacity, align come from the ref.
- **Natural colors preserved**: sky, grass, skin, hair, water, wood, stone — NEVER remap. Grays/blacks/whites — NEVER remap.
- **Designer-chosen colors remapped**: accent walls, pill fills, decorative tints → brand.accent or accent_secondary.
- **Gutter 10%, type scale, spacing rhythm** — see `design-fundamentals.md`.
- **Font sizes/bboxes come from the ref** — reasoned directly into `template.html` (no separate measurements file).
- **Chrome HONORS tokens.json strictly**: if `tokens.chrome.masthead.enabled:false`, templates MUST NOT inject masthead HTML — even if the ref shows one. Same for pagination.
- **Cost per family:** ~$0.30–1.00 per ssc-template-builder agent (plus any Case D-mini icon gen). No clean_ref, no QA-loop cost.

### Phase 5.5 — Brand-level gates (G2 + G4 — warning, does NOT block Phase 6)

After ALL per-template approvals settle (every entry in `manifest.json` is either `status: "ready"` or moved to `_rejected/`), run the brand-level gates BEFORE generating the brand-book PDF:

```bash
uv run .claude/skills/mkt-visual-identity/scripts/validate_brand.py \
    --brand-context brand_context/
```

Parses the `<!--meta -->` blocks in `moves.md` (G4 sanity) and cross-checks every `image_bearing: true` move against the template manifest (G2). Pass `--include-draft` during Phase 5 if you're still iterating on drafts; otherwise only `status: ready` templates count as supporters.

**On G2 failure** — one or more `image_bearing:true` moves have ZERO supporting templates — open an `AskUserQuestion` popup:

```python
AskUserQuestion({
  questions: [{
    question: f"moves.md declares {N} image_bearing moves that no template supports: {move_names}. How to resolve?",
    header: "Moves without a template",
    multiSelect: False,
    options: [
      { label: "Generate a photo-overlay template now",
        description: f"Goes back to Phase 4.5+5 and generates 1+ templates that support the zone_types {required_types}. Cost: ~$0.04-0.10 per template." },
      { label: "Reclassify move as image_bearing:false",
        description: "The move is kept in moves.md but the `<!--meta-->` block becomes `image_bearing: false`. ssc-designer will no longer look for a photo template for it. Use only if the move genuinely doesn't need a photo." },
      { label: "Discard the move",
        description: "Removes the move's section from moves.md. The brand loses that visual signature." }
    ]
  }]
})
```

G2 failure is surfaced as a WARNING — the popup above is optional, and Phase 6 proceeds regardless. You (the orchestrator) decide whether an unsupported move matters enough to add a template now or later. Don't hard-block the pipeline on it.

**Why this gate exists:** without it, refs with photo/silhouette/cutout get compressed to PURE_CSS typographic templates because "deterministic is cheaper". If `moves.md` declares "Desaturated silhouette photography" as a signature move with zero templates supporting it, ssc-designer downstream filters templates by move support, finds zero matches, and falls back to generic output — the brand ships off-brand visuals on every photo slide. G2 makes this case structurally impossible to reach.

### Phase 5.6 — Assemble `styles.json` *(only when Phase 4.97 recorded ≥2 styles)*

If `template-families.yaml` has a `styles:` section (≥2 styles approved in Phase 4.97), write the consumer-facing `brand_context/templates/{pool}/styles.json` now that every family is built and `status: ready`. The shape + role rules are specified inline below (this phase is self-contained); the file's carousel-time consumer is `00-social-content`'s `ssc-designer`, when that pack is installed.

Per style in the `styles:` section:
- `name`, `label`, `description` — copy from `template-families.yaml`.
- `template_ids` — the style's `family_ids` (= built template slugs), keeping only entries whose manifest `status == "ready"` (drop any that landed in `_rejected/`).
- `cover_preview` — the style's full-bleed cover family's `preview.png` (pool-relative); fall back to its first ready template's preview.

**Completeness re-check (per style, post-build):** each style's `template_ids` MUST still satisfy ≥1 full-bleed cover + ≥1 image-less cta + ≥2 light/dark bodies (a rejected template can break coverage). If a style fails, resolve via Phase 4.97 Step 2 (share a ready family from another style) or re-run a builder for the missing role, THEN write. Never ship a `styles.json` whose styles can't each build a carousel on their own — `ssc-designer` would dead-end on the scoped subset.

```json
{ "version": 1, "platform_pool": "{pool}", "styles": [ /* one entry per approved style */ ] }
```

If `template-families.yaml` has NO `styles:` section (single-look brand), SKIP — no `styles.json`, the pool stays flat and the carousel-time picker is suppressed.

---

### Phase 6 — Brand bible PDF regen *(MANDATORY auto-invocation — adds template gallery)*

After Phase 5 (template extraction via ssc-template-builder agents) settles — all templates are `ready` or in `_rejected/` — IMMEDIATELY regenerate the brand bible. This v2 PDF differs from v1 (Phase 4.7) by including the template gallery page (3×3 grid of `_preview/*.png`). The skill (this Claude) MUST run the script as the next action in the same turn; the user must never have to ask "did you update my brand book?". This is the #1 failure mode the auto-invocation rule prevents.

```bash
uv run --with playwright --with pillow python .claude/skills/mkt-visual-identity/scripts/generate_brand_bible_pdf.py
```

Writes `brand_context/visual-identity/brand-book.pdf` (20 pages, A4 landscape). The script automatically creates a versioned backup of any existing `brand-book.pdf` (or the legacy `visual-identity.pdf`) at `brand-book.v{N}.pdf` before overwriting — no user confirmation needed, no silent loss. Pass `--no-backup` to skip the backup step (rare; only when you know you don't need history).

**After the script returns, surface BOTH the absolute PDF path AND the backup path (if any) in the phase summary message:**

```
[ok] brand_context/visual-identity/brand-book.pdf  (20 pages, ~480 KB)
[backup] previous bible preserved at brand-book.v3.pdf
```

**If PDF generation fails** (Playwright missing, font network fetch broken, layout exception), log the error to `_analysis/extraction-log.md`, surface a one-line warning in the phase summary, but DO NOT block the rest of the pipeline — the machine-readable artifacts (tokens.json, identity.md, moves.md) are the contract; the PDF is a derivative artifact.

Page structure:

1. **Cover** — brand name + tagline + logo (rendered with the brand's own display font)
2. **Identity** — one-paragraph summary extracted from `identity.md`
3. **Palette** — color swatches with hex + per-role usage notes (consumes `tokens.json > colors`)
4. **Typography** — display + body samples using the brand's webfonts, plus the type-scale table
5. **Layout** — canvas + spacing + frame rules from `tokens.json`
6..N. **Design moves** — one page per move from `moves.md` ("what it is" + "when to apply" extracted)
N+1. **Template gallery** — 3×3 grid of representative previews from `templates/{pool}/_preview/`
N+2. **What we stand against** — anti-patterns extracted from `identity.md`
N+3. **Colophon** — source-of-truth pointers (which files to edit to update the PDF)

**When to run:**

- ✅ At the end of every Extract / Import / Build / Auto-Scrape / Folder Import that writes a new `tokens.json`
- ✅ Immediately after Mode T (template factory) produces a new pool — the gallery page picks up the new previews
- ✅ On user request ("regenerate the brand book", "update the brand bible")
- ❌ NOT every time `identity.md` or `moves.md` is hand-edited — leave that to the user's next explicit invocation, to avoid spurious overwrites mid-session

**Anti-patterns:**

- ❌ Skipping the PDF because "the user already has the markdown files" — markdown isn't shareable with designers/clients; the PDF is. This is the whole point of the brand bible.
- ❌ Hardcoding colors / fonts / sizes in the PDF script — every value must trace back to `tokens.json` so the PDF stays in sync forever.
- ❌ Producing a generic SaaS-styled PDF — it MUST look like the brand. The script applies paper-texture noise, the display font for headings, the accent color on hairlines, and renders the user's actual logo on the cover.

**Why this matters:** machine-readable artifacts alone are not shareable with designers or clients — the PDF is the single source of truth a non-engineer can open and review. Treating it as deferred leaves every brand with only raw JSON / markdown to hand around, which breaks the "single source of truth, shareable" promise. The PDF is part of the contract, not an optional extra.

### Phase 7 — CONFIG COMPLETE *(LOUD signal — boundary between config and content; FINAL phase of the skill)*

After ALL templates are approved (or discarded) AND Phase 6 brand bible v2 regenerates, emit the boundary card:

```
═══════════════════════════════════════════════════════════
  CONFIGURATION COMPLETE — {brand_name}
═══════════════════════════════════════════════════════════

  Tokens:        palette {primary}/{accent}/{bg_light}/{bg_dark}
  Chrome:        masthead [{labels}] + {pagination ? "dots" : "no dots"}
  Templates:    {N_ready} ready / {N_rejected} rejected
                 ({list_slugs})
  Brand bible:  brand_context/visual-identity/brand-book.pdf

  → Configuration locked. Ready to generate content. The next message
    is the post's topic/URL/material.
═══════════════════════════════════════════════════════════
```

After emitting, the skill EXITS. It does NOT ask "ready to generate content?" — that's the user's next action via `/00-social-content "topic"`.

**Hard rule for downstream skills (00-social-content, ssc-designer, ssc-image-generator):** they MUST check `brand_context/templates/{pool}/manifest.json` exists AND has ≥1 entry with `status: "ready"` BEFORE running content-inference / content-gen phases. If not, refuse to proceed.


## Scripts (all in `scripts/`)

| Script | Purpose | Inputs | Outputs |
|---|---|---|---|
| `pdf_to_pages.py` | Rasterize PDF → PNG per page | PDF path, target W×H | `{slug}-p{N}.png` |
| `extract_tokens.py` | Pixel analysis — **BRAND assets only** (logo, headshot, posts-archive); never template refs | PNG path | `spec.json` |

## Integration with other skills

**Called from `00-social-content` onboarding (Phase 1 intent disambiguation):**
- When `00-social-content` Phase 1 detects empty brand_context AND the user has provided reference material, it asks: BUILD brand_context first / use as INSPIRATION only / BOTH.
- On BUILD or BOTH → invoke `mkt-brand-voice` + `mkt-visual-identity` in parallel with the user-provided material.
- This skill scans for `brand_context/visual-identity/tokens.json`. If missing, runs Mode E (or Mode B if no refs).

**Consumed by:**
- `ssc-designer` reads `brand_context/visual-identity/moves.md` to apply the brand's design moves to each slide.
- `ssc-image-generator` reads `brand_context/visual-identity/tokens.json` + `brand_context/templates/{output_format}/*.html` to render slides. The renderer (`viz-image-gen/scripts/render_template.py`) resolves `brand_context/templates/{pool}/` first, with `viz-image-gen/references/templates/{pool}/` as fallback.
- `viz-image-gen` reads tokens to seed brand-aware AI prompts.

## Hybrid rendering modes

**Critical:** not every reference design can be reproduced in pure HTML/CSS. Some references include custom illustrations, hand-drawn sketches, or organic textures that resist code. This skill supports 3 rendering modes per template:

- **`PURE_CSS`** — fully deterministic HTML/CSS. Use for typography, code mocks, CTAs, geometric layouts.
- **`HYBRID_AI`** — HTML/CSS layout with an AI-generated image filling a designated slot. Use for slides with custom illustrations or diagrams.
- **`FULL_AI`** — entire slide is AI-generated. Rare. Use only when layout itself defies code.

Each template must declare its mode in the top comment. HYBRID_AI templates expose `{{ ai_image_src }}` (and optionally `{{ ai_image_prompt }}`) slots.

This taxonomy mirrors `ssc-image-generator`'s render modes (TEMPLATE / HYBRID_REAL / HYBRID_AI / FULL_AI) so downstream skills can route slides consistently.

### Layer decomposition rule (MANDATORY — apply BEFORE bg_treatment and visual_kind)

A slide is NEVER "one zone". It is a **stack of layers**, and each layer has its own render path. Decompose every ref into its layers and emit ONE entry per layer in the briefing's `layers[]` array. Never collapse layers into a single image-zone — that is the failure mode where HTML overlays get baked into an AI prompt, or text-in-a-surface is treated as a free-floating caption.

| Layer type | What it is | Render path |
|---|---|---|
| `background` | the backmost surface (see bg_treatment below) | CSS solid OR AI texture/scene |
| `image-zone` | an AI/real subject with a VARYING subject per slide — cutout figure, photo, illustration, scene | HYBRID_AI / HYBRID_REAL |
| `html-overlay` | pills, labels, badges, kickers, tags, callout chips drawn ON TOP — crisp vector edges, flat fills | HTML/CSS (NEVER baked into the AI image) |
| `physical-placeholder` | text/content composited INTO a surface depicted in the scene — a frame, canvas, screen, sign, sheet of paper | AI scene holds the surface; text is HTML registered to the surface bounds |
| `decorative-type` | oversized display words used as graphic elements ("setup", "system"), slide numerals, oversized punctuation | HTML/CSS type |

**Rules:**
- The 4 orange pills on a scene = `image-zone` (the scene) + `html-overlay` (the pills) — TWO layers, not one. The pills are crisp HTML, never part of the generated image.
- A quote that sits inside a white frame on a gallery wall = `image-zone` (the gallery scene incl. the empty frame) + `physical-placeholder` (the text registered to the frame's bounds). It is NOT a free-floating overlay.
- An oversized lowercase word anchored to a corner ("setup", "system") is a `decorative-type` layer and MUST be captured — never drop it as "just styling". This is the zero-omission rule applied to typography.

### bg_treatment rule (MANDATORY — sets the render-mode FLOOR, not the final answer)

Classify ONLY the `background` layer here. bg_treatment sets a FLOOR; image-zone presence can PROMOTE the mode above that floor.

| What you see in the background | bg_treatment | Mode floor |
|---|---|---|
| Grain, texture, paper, concrete, noise, fabric, any non-flat surface | `textured-paint` | **HYBRID_AI** |
| Photo, figure, scene, person, environment behind everything | `scene-full-bleed` | **HYBRID_AI** (HYBRID_REAL if a real asset resolves) |
| 100% solid flat color, zero texture | `solid-color` | PURE_CSS |

**Two independent dimensions — never conflate them:**
1. `bg_treatment` (what the backmost layer is)
2. `has_image_zone` (whether a varying AI/real subject sits on top)

**Final render mode = the HIGHER of: bg floor, and image-zone requirement.**
- textured/scene bg → HYBRID_AI **regardless of image-zone**. NEVER classify visible texture as PURE_CSS. A typographic slide with no photo but a paper/concrete background is `textured-paint` → HYBRID_AI.
- `solid-color` bg → PURE_CSS **only if `has_image_zone` is also false**. If a cutout figure / photo / illustration sits on the solid color, the slide is **HYBRID_AI (or HYBRID_REAL)** — driven by the image-zone, NOT the background. Record `mode_reason` naming the layer that drove the decision (e.g. "solid-color bg but cutout men image-zone → HYBRID_AI").

This block overrides the `visual_kind` table below when they disagree.

### Observe, don't assume (MANDATORY)

When describing any decorative element (badge, shape, sunburst, divider, frame), **describe the shape and sample the color you actually see** — never pattern-match to the brand accent. A slide numeral badge is not "a coral circle" just because coral is the brand accent: look — it may be a **scalloped/starburst** shape in **dark navy/black**. Wrong-shape, wrong-color descriptions propagate into templates as the wrong chrome. Record actual shape + actual sampled hex in the briefing.

### Mode-detection rules (orchestrator MUST apply these)

Before picking a template, classify the slide's visual_kind:

| visual_kind | Signals from briefing | Mode | Template |
|---|---|---|---|
| `screenshot_real` | "show the UI", "demo of", has actual UI URL | PURE_CSS+image | `body-screenshot` |
| `code_mock` | tutorial step, command, config, terminal output | PURE_CSS | `body-screenshot` with code-frame variant |
| `comparison` | A vs B, before/after, this/that | PURE_CSS | `body-screenshot` with 2-col variant |
| `metaphor_illustration` | concept is abstract → needs object metaphor (filing cabinet for organization, brick wall for blocked, tower for instability) | **HYBRID_AI** | `body-illustration` |
| `concept_diagram` | flow, system, architecture with hand-drawn feel | **HYBRID_AI** | `body-illustration` |
| `decorative_hand_drawn` | brand has hand-drawn sketch overlays as standard | HYBRID_AI overlay on PURE_CSS | `body-screenshot` + sketch SVG |
| `cta_typographic` | ALL CAPS message, single statement | PURE_CSS | `cta-allcaps` |
| `cover_hook` | opening slide | PURE_CSS | `cover-dark` |

**Detection heuristic for `metaphor_illustration`:**
- The briefing's body_text contains a CONCRETE OBJECT NOUN that has no literal connection to the technical topic (claude.md is not a filing cabinet, but the concept of organization can be drawn as one).
- OR the body_text uses analogy phrasing ("think of it like", "imagine", "it's like").
- OR the title is a directive about ABSTRACT BEHAVIOR (don't dump, don't memorize, point not paste) that benefits from visual metaphor.

**When in doubt:** ask the user. Surface "this slide could be PURE_CSS (code/diagram) OR HYBRID_AI (metaphor illustration) — which fits the post tone?"

**Anti-pattern:** defaulting a whole carousel to PURE_CSS — including slides whose concepts (e.g., "kitchen-sink server vs neat servers") would benefit from HYBRID_AI metaphor illustrations — because PURE_CSS is easier, not because it's right. The skill must enforce mode-detection — the orchestrator should NOT default to PURE_CSS when the briefing clearly calls for metaphor.

## Anti-patterns to avoid

- ❌ Don't use generative AI for layout decisions — this skill is deterministic.
- ❌ Don't guess fonts/colors without measurement — always pixel-sample.
- ❌ Don't write generic templates — every template ties to a specific role validated against the reference.
- ❌ Don't skip the trace overlay step — eyeballing is what broke us before.
- ❌ Don't store fonts as URL references — always download to `{brand_context}/visual-identity/fonts/`.
- ❌ **Don't try to brute-force pure CSS for custom illustrations** — escalate to HYBRID_AI when the reference has hand-drawn elements. Trying to reproduce a filing cabinet illustration in CSS produces ugly output.

## First-run checklist (guided intake — walk these in order)

If invoked for the first time, walk the user through this sequence. NEVER skip a step or fall through to defaults silently.

1. **Confirm `{brand_context}/` exists** at project root (created by `mkt-brand-voice` typically). If not, create it.

2. **Ask brand name (REQUIRED, blocking — see "Before You Start → Step 0").** Plain text question. Wait for an explicit answer. Store in `tokens.json > brand` as a `locked_field` immediately.

3. **Create canonical subfolders** (only after brand name is stored): `{brand_context}/visual-identity/`, `{brand_context}/visual-identity/fonts/`, `{brand_context}/visual-identity/logos/`, `{brand_context}/visual-identity/_analysis/`, `{brand_context}/templates/`.

4. **Walk reference categories — one prompt per category, in this order:**

   **4a — Style references** (the most important — drives palette, typography, mood):

   ```
   Next: upload 3-5 visual style references you admire. They can be:
     · LinkedIn carousels from people you like (PDF or screenshots)
     · Instagram posts from brands with a strong identity
     · a website URL that has the right vibe
     · PDFs of brand books you enjoy
   The more, the better — I'll extract palette, typography, and moves from each.

   If you have nothing right now, say "skip style refs" — I note it and move on.
   ```

   Wait for the user's answer. If they upload, route through the right intake path (A/B/C/D/E) per `references/intake-procedures.md`. If they say "skip", record `_analysis/intake-log.md > style_refs: skipped` and proceed to 4b.

   **4b — Logo:**

   ```
   Do you have a logo? If so, upload the file (SVG ideal, PNG/JPG works, transparent
   background preferred). If you don't have one yet, say "no logo" — I'll just use the
   wordmark of your brand name in the templates.
   ```

   **On upload — single atomic command (copy + safe bg removal):**

   ```bash
   uv run .claude/skills/mkt-visual-identity/scripts/intake_logo.py \
     --input <user-upload-path> \
     --brand-context brand_context
   ```

   This is the ONLY allowed intake path. The script atomically:
   1. Normalizes the filename (`"My Logo.JPG"` → `my-logo.jpg`)
   2. Copies to `brand_context/visual-identity/logos/`
   3. Runs `clean_logo_bg.process_one()` in-process (same rembg session) with all per-logo validations
   4. Returns a JSON decision per file (stdout) + appends to `_bg_clean/_decisions.json`

   **Never do `cp` + `clean_logo_bg.py` as two separate steps** — that's the failure mode this atomic wrapper exists to prevent. Both happen or neither does.

   Decision outcomes (from `clean_logo_bg.process_one`):
   - **ok** — saved as `{name}-transparent.png` + comparison side-by-side
   - **skip `already-has-alpha`** — PNG already has transparency, nothing to do
   - **skip `bg-too-close-to-logo`** — logo's dominant color is < 60 RGB units from the bg; removal would destroy detail
   - **skip `barely-removed` / `over-removed`** — rembg ran but opaque_ratio is outside the safe range (0.02-0.95)
   - **svg-passthrough** — SVG copied without cleanup (vector already has alpha)

   A comparison PNG is always generated (even for skips) in `_bg_clean/` for visual audit. Use the stdout JSON for orchestration — if any decision is `skip`, surface the reason to the user and offer a manual override.

   **4c — Headshot** (only ask if relevant — personal brands, founder content):

   ```
   Will you appear in the posts (avatar, cover photo, photo on some body slide)?
   If so, upload a headshot (any photo where you look good on your own, a clean
   background helps). If not — say "no headshot" and I won't reserve a photo slot.
   ```

   Same handling pattern.

   **4d — Anything else:**

   ```
   Anything left you want to hand me before I run the extraction?
   Specific fonts (`.ttf` / `.otf`), a brand book PDF, a screenshot of your
   landing page, a Figma palette — send it now or say "go" to run with what
   I already have.
   ```

5. **Decide path based on what was uploaded:**
   - User uploaded style refs / logo / anything → run Mode E (Extract) on the gathered material.
   - User uploaded NOTHING across all categories → trigger Mode N (Neutral — explicit confirmation required, see "Mode N" section above). Never silent-fall to defaults.
   - User uploaded only a URL → route to Mode A (Auto-Scrape).
   - User uploaded an existing brand spec (Notion / brand book PDF with declared hex codes & fonts) → route to Mode I (Import).

6. **Check Python deps**: `pillow`, `pymupdf`, `numpy`, `playwright`. Install if missing.
7. **Check Playwright Chromium**: `python -m playwright install chromium`.
8. **Tesseract**: optional. If missing, skill operates in manual-bbox mode.

**Anti-pattern (REMOVED in this version):** the previous "agnostic intake" step suggested a folder and walked whatever the user dumped. It looked friendly but never asked for the brand name and never confirmed that "nothing uploaded" meant "use neutral defaults" — so the orchestrator silently produced posts signed with a hardcoded placeholder brand name. Don't reintroduce that pattern. The guided walk above replaces it.

## Manual user input always wins

When a user provides explicit values (typed, pasted, or recorded in a brief), those values are written to `tokens.json` AND added to `tokens.locked_fields`. On every subsequent extraction run, locked fields are skipped — the extractor never overwrites a value the user typed. Examples:

- User says "primary is #FF0000" → `colors.primary = "#FF0000"`, `locked_fields += ["colors.primary"]`.
- User says "headline font is Inter Tight 900" → `fonts.display = {family: "Inter Tight", weight: 900}`, locked.
- User says nothing about spacing → extractor freely re-derives spacing from new references.

The conflict resolution logic in Phase 4 of the execution plan (deferred) honors this rule.
