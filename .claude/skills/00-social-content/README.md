# 00-social-content

Social content pipeline — from inspiration to published post. One command, seven scenarios.

> This README is the canonical reference for the pipeline. Installation is handled by the skill installer; operational config lives in `.claude/skills/00-social-content/skill-pack/config/` (`sys-config.md` + `pipeline.config.yaml`).

---

## What it does

Takes whatever you have (a YouTube video, a topic, a web article, a local file, your LinkedIn feed, or a finished caption) and produces a post with images, ready to publish on LinkedIn, Instagram, Twitter, Threads, or any other platform via Zernio.

Every run is saved to `{output_base}/{YYYY-MM-DD}/{post-slug}/` with `post.yaml`, `caption.md`, the per-run `pipeline-log.md`, and image files. Working data only (transcripts, scraped posts, screenshots) lands in the shared `{output_base}/{YYYY-MM-DD}/logs/`.

---

## Pipeline Flow

```
/00-social-content
        │
        ▼
┌─ Phase 1: CONFIG ──────────────────────────────────────────┐
│  Load configs + brand-context guard (voice + visual)       │
│  HARD GATE: tokens.json + ≥1 ready template required       │
│  (auto-invokes mkt-brand-voice / mkt-visual-identity)      │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 2: DETECT SCENARIO ─────────────────────────────────┐
│                                                            │
│  YouTube/video URL ─────────────────────► Scenario B       │
│  Topic / idea ──────────────────────────► Scenario C       │
│  "from my sources" / empty ─────────────► Scenario D       │
│  Existing post + "adapt for X" ─────────► Scenario E       │
│  Web article URL (non-video) ───────────► Scenario F       │
│  Local video/audio file ────────────────► Scenario G       │
│  Finished caption + "generate image" ───► Scenario A       │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 3: GATHER ──────────────────────────────────────────┐
│  B → tool-youtube transcript                               │
│  C → str-trending-research                                 │
│  D → tool-linkedin-scraper + tool-youtube digest           │
│  F → tool-web-screenshot + extraction                      │
│  G → tool-transcription (WhisperX)                         │
│  A/E → skip                                                │
└────────────────────────────────────────────────────────────┘
        │
        ▼ (B/C/D/F/G)
┌─ Phase 4: BRIEFING ────────────────────────────────────────┐
│  Objective · Format · Platform                             │
│  (skipped if all three known from trigger)                 │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 5.0: CONTENT INFERENCE ─────────────────────────────┐
│  inferred_entities · inferred_palette · inferred_typography│
│  Decide: single / carousel / text                          │
│  Draft caption (single only)                               │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 5.0.5 + 5.3 + 5.7: VISUAL PLANNING ─────────────────┐
│  Spawn ssc-designer sub-agent (v1.0.0)                     │
│  • Visual Inventory (BEFORE slide plan exists)             │
│  • Slide plan (visual-first construction)                  │
│  • Blocking audits:                                        │
│    - slide-1 cover visual check        (7.0)               │
│    - per-slide real-image check        (7.1)               │
│    - visual floor ceil(2N/3)           (7.2)               │
│    - icon-anchor classification        (7.3)               │
│    - white-space audit                 (7.4)               │
│    - render-mode diversity             (7.5)               │
│    - Story Framework                   (7.9)               │
│        · headline ≤6 words                                 │
│        · body ≤3 lines                                     │
│        · standalone-in-Explore (all slides)                │
│        · energy curve HIGH-LOW-MED-MED-HIGH-MED-LOW        │
│        · build tonal alternation                           │
│        · CTA image-less                                    │
│  • Image source resolution per slide                       │
└────────────────────────────────────────────────────────────┘
        │
        ▼ (carousel only)
┌─ Phase 5.4 + 5.5: CAPTION + HUMANIZE + PREVIEW ────────────┐
│  Draft caption around slide arc                            │
│  Humanizer (silent)                                        │
│  Show plan + caption for user confirmation                 │
└────────────────────────────────────────────────────────────┘
        │
        ▼ (single only)
┌─ Phase 6: HUMANIZER ───────────────────────────────────────┐
│  Remove AI patterns · Match brand voice                    │
│  (deep mode if voice-profile exists, else standard)        │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 7: GENERATE IMAGES ─────────────────────────────────┐
│  Spawn ssc-image-generator sub-agent (v1.0.0)              │
│  Honor designer's slide_plan (no re-deciding)              │
│  Contrast gate (WCAG AA): blocks illegible                 │
│  slides + auto-remediates before preview                   │
│  Pool mode universal: every slide carries                  │
│  template_pool + template_id (no template_family)          │
└────────────────────────────────────────────────────────────┘
        │
        ▼ (skipped for text / --no-preview)
┌─ Phase 7.5: HTML PREVIEW (blocking) ───────────────────────┐
│  preview_carousel.py → LinkedIn-style index.html           │
│  Block until the user approves the rendered post           │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 8: SAVE AND PRESENT ────────────────────────────────┐
│  post.yaml · caption.md · image(s) · pipeline-log.md       │
│  All in {output_base}/{date}/{slug}/                       │
│  → /tool-publisher {slug} when ready                       │
└────────────────────────────────────────────────────────────┘
```

---

## Scenarios

| # | You provide | What happens |
|---|-------------|--------------|
| **A** | Finished caption + "generate image" | Humanizer (optional) → Images |
| **B** | YouTube or video URL (Vimeo, Loom, TikTok, etc.) | Transcript (yt-dlp) → Draft → Humanizer → Images |
| **C** | Topic, angle, or idea | Trending research → Draft → Humanizer → Images |
| **D** | Nothing / "from my sources" | Scrape LinkedIn + YouTube → Draft → Humanizer → Images |
| **E** | Existing post + "adapt for X" | Routes to `/mkt-content-repurposing` → Images |
| **F** | Article, blog, thread, or any non-video URL | Screenshot → Extract content → Draft → Humanizer → Images |
| **G** | Local video/audio file (.mp4, .mov, .mp3, etc.) | Transcribe (WhisperX) → Draft → Humanizer → Images |

---

## Output Structure

```
{output_base}/
├── publish-log.md                          ← system-wide publish history
└── {YYYY-MM-DD}/                           ← one folder per run date
    ├── logs/                               ← pipeline working data (shared by all runs of the day)
    │   ├── inspiration/                    ← saved transcripts (Scenarios B/F/G)
    │   └── screenshots/                    ← video frame manifests (Scenarios B/G)
    └── {post-slug}/                        ← FINAL OUTPUT (per-run)
        ├── post.yaml                       ← metadata
        ├── caption.md                      ← post text only
        ├── pipeline-log.md                 ← per-run phase timing + reasoning (v2.0.0: moved here from logs/)
        ├── sourced/                        ← real images resolved by ssc-designer (logos, photos, screenshots)
        └── image.png                       ← single image, OR
            slide-1.png, slide-2.png ...    ← carousel
```


`{output_base}` resolves from `.claude/skills/00-social-content/skill-pack/config/sys-config.md` (set by installer to `projects/00-social-content/`).

### post.yaml schema

```yaml
slug: 2026-05-01-autonomous-agents
platform: linkedin
date: 2026-05-01
status: draft                 # draft | published | failed
inspiration_source: youtube   # from_user | youtube | linkedin | linkedin,youtube | trending_research | screenshot | local_file | none
format: carousel              # single | carousel | text
slides: 4                     # carousel only
ratio: "4:5"
width: 1080
height: 1350

publish:
  status: ~
  published_at: ~
  platform_post_id: ~
  post_url: ~
  error: ~
```

---

## Visual Templates

Image rendering is executed by `ssc-image-generator` (Phase 7), which renders the brand's HTML templates. **Templates are per-brand** — there is no fixed, built-in set. They are generated by `mkt-visual-identity` (Template Factory mode) from the brand's own references and written to:
`brand_context/templates/<pool>/`

### Pool model *(Stage 2 — pool mode universal)*

Templates are addressed by `template_id`, never by `(template_family + layout)`. Each surface has ONE pool named `<platform>-<format>` (e.g. `linkedin-carousel`, `instagram-carousel`, `linkedin-single`). A pool is a folder of template directories plus a `manifest.json` that declares every available `template_id` and its metadata (slot vocab, `role`, `image_zone`, `render_mode`, `compatible_ai_styles`, `status`).

- **Primary location (per-brand):** `brand_context/templates/<pool>/manifest.json` — what *this* brand actually ships. The set of `template_id`s is entirely brand-specific: two brands installed in two repos will have different pools, because `mkt-visual-identity` builds them from each brand's references.
- **Fallback:** `viz-image-gen/references/templates/<pool>/manifest.json`, when present.

`ssc-designer` reads the manifest at plan time and assigns every slide a concrete `template_id`. **Only templates with `status: ready` are usable** — drafts and rejects are filtered out. There is no legacy `template_family` fallback: if a pool is missing or empty, Phase 5.0.5 fails loudly (this is the Phase 1 HARD GATE).

> A typical pool covers three slide roles — a **hero/cover** template (slide 1, full-bleed image zone), one or more **body/content** templates (one per communication shape: numbered list, comparison, screenshot, pull-quote, scene overlay…), and a **CTA** template (usually an image-less closing slide). The exact names, looks, and count depend on the brand — read that pool's `manifest.json` to see what is available. To inspect a brand's pool: `cat brand_context/templates/<pool>/manifest.json`.

### Shared utility classes (inline emphasis inside `html`-type slots)

Slot vocabulary moved to manifest schema in Stage 1 — the canonical headline/body slots (`HEADLINE`, `BODY`, `SUPPORT`, etc.) are declared per template_id with explicit `allowed_tags`. Common inline utilities defined in `brand_context/templates/_shared/styles.css`:

| Class | Effect | Example |
|---|---|---|
| `<mark>word</mark>` | Renders `word` in `var(--brand-accent)`, weight 700-900 | `"The <mark>media</mark> was free"` |
| `<em>word</em>` | Italic serif (Fraunces) accent | `"<em>That</em> was the old shape"` |
| `<strong>word</strong>` | Bold emphasis | `"<strong>10x</strong> faster"` |

Slots typed `html` use `{{{NAME}}}` (triple-brace, raw pass-through) in the template HTML; slots typed `string` use `{{NAME}}` (HTML-escaped). The renderer's mustache parser handles both correctly. Use `<br>` for line breaks inside `html` slots.

### Per-template slot vocabulary

Each pool template_id has its own entry in the pool's `manifest.json` (id, role, `file`, `bg_subject_type`, required/optional slot ids, `status`). The manifest is (re)built from each template's `_measurements.yaml` by `mkt-visual-identity/scripts/build_manifest.py --pool-dir brand_context/templates/<pool>` — it emits a `templates[]` list and preserves each entry's `status`. Per-template slot vocabulary + types live in that template's `instructions.md > ## Slots`.

### Brand kit color mapping (CSS custom properties)

`render_template.py` builds `:root { ... }` CSS variables from the `--brand-kit` JSON. The variable names map as follows:

| `brand_kit.colors.*` | CSS variable | Used for |
|---|---|---|
| `primary` | `--brand-primary` | Background of dark templates (dark text slides, dark CTA pill, etc.) |
| `secondary` | `--brand-secondary` | Default headline color on text slides |
| `background` | `--brand-background` | Reserved (not used by current templates) |
| `text` | `--brand-text` | Reserved |
| `accents[0]` | `--brand-accent` | `<mark>`, `.handwrite`, `.arr`, eyebrows, step-numbers |

**Common mistake:** if the post is about a brand with a strong color (e.g. Budweiser red `#CC0000`), do NOT put that color in `primary` — it would become the slide background. Put it in `accents[0]` and keep `primary: #0a0a0a` for the dark editorial background.

**Fonts come from `brand_context/visual-identity/tokens.json` (Stage 2).** `build_brand_tokens_css` in `render_template.py` reads `fonts.headline_family` / `fonts.body_family` (and the type scale) and emits CSS variables (`--font-display`, `--font-body`, `--type-display`, etc.). To change fonts brand-wide, edit `tokens.json` and re-render. Per-template font overrides live in each template's inline `<style>` block.

### Gradient overlay intensity

Templates with a full-bleed background image place a gradient overlay in front of it so text stays legible. The overlay is a multi-stop `linear-gradient` (typically ~0.85 opacity at the text edge fading to 0 at the opposite edge), defined **inside each template's own HTML `<style>` block** — there is no shared overlay file.

To make the image more visible at the expense of text contrast, lower the gradient's opacity stops in that template's HTML (`brand_context/templates/<pool>/<template_id>/template.html`); to hide the image more, raise them. The legibility gate (`measure_text_contrast.py`) runs inside Phase 7 — `ssc-image-generator` re-checks WCAG AA on every rendered slide and auto-remediates BEFORE the Phase 7.5 HTML preview, so an overlay that drops too far is caught before you ever see it.

---

## Required API Keys

| Key | Used for | Required? |
|-----|----------|-----------|
| `GEMINI_API_KEY` | Image generation (default) | Yes (or OpenAI) |
| `OPENAI_API_KEY` | Image generation + Reddit research | Yes (or Gemini) |
| `APIFY_API_KEY` | LinkedIn scraping | Scenario D |
| `YOUTUBE_API_KEY` | YouTube channel digest | Scenario D |
| `XAI_API_KEY` | X/Twitter research | Optional (Scenario C) |
| `SCREENSHOTONE_API_KEY` | Cloud screenshots (bot bypass, ad blocking) | Scenario F — falls back to local Playwright |
| `ZERNIO_API_KEY` | Publishing | `/tool-publisher` only |

---

## Dependent Skills

| Skill | Used in |
|-------|---------|
| `mkt-brand-voice` | Phase 0 onboarding, Phase 1 voice guard (soft), Phase 5 draft |
| `mkt-visual-identity` | Phase 0 onboarding, Phase 1 visual guard + HARD GATE (tokens + templates) |
| `str-trending-research` | Scenario C |
| `tool-linkedin-scraper` | Scenario D |
| `tool-youtube` | Scenarios B and D |
| `tool-web-screenshot` | Scenario F (articles, blogs, threads, any non-video URL) |
| `tool-transcription` | Scenario G (local video/audio files) |
| `tool-humanizer` | Phase 6 |
| `viz-image-gen` | Phase 7 (via ssc-image-generator) |
| `mkt-content-repurposing` | Scenario E |
| `tool-publisher` | Post-pipeline publishing |

---

## Self-Improvement

After any correction, the pipeline proposes a permanent fix to the source file (voice-profile.md, SKILL.md, or ssc-image-generator.md). Confirmed fixes are applied immediately — no separate logging.

---

## Sub-agents & versioning

The pipeline delegates to two specialized sub-agents under `.claude/agents/`. Both carry a `version:` field in their frontmatter so changes are traceable and the orchestrator can refuse to run against an incompatible agent.

| Agent | Version | Phase | Responsibility |
|---|---|---|---|
| `ssc-designer` | **1.0.0** | 5.0.5 + 5.3 + 5.7 | Visual inventory, slide planning, blocking audits, image-source resolution |
| `ssc-image-generator` | **1.0.0** | 7 | Render templates, construct AI prompts, stitch final images |

Bump the agent's `version:` in its frontmatter whenever you change its contract (inputs, outputs, audit rules). Use semver:
- **major** — breaking input/output shape change (orchestrator must adapt)
- **minor** — new audit, new optional field, new feature flag (orchestrator unchanged)
- **patch** — internal logic tightening, prompt rewording, log format only

---

## Changelog

### Pipeline + agents — 2026-05-26 (legibility gate, image-routing, brand-fidelity)

Cross-cutting hardening of the visual layer. No breaking input/output changes.

**Legibility contrast gate (NEW — blocking, pre-preview).** `ssc-image-generator` Step 9 now runs `mkt-visual-identity/scripts/measure_text_contrast.py` on every rendered slide BEFORE the Phase 7.5 preview. Text below WCAG AA fails the slide; a 3-step remediation ladder runs (per-element color flip → regenerate bg honoring the template's bg identity → scrim/plate), max 3 attempts, else `needs-user-decision`. The user only ever sees contrast-clean slides. Gate refinements: elements with their own fill (pills, seals, cards) are skipped; logos/accent graphics and bg-adaptive (`auto`) colors are advisory, not blocking; large display text uses the WCAG-AA-Large 3.0:1 floor.

**Image generation routing (Routes A/B/C).** The canonical reference IS the composition guide AND the generation input. `ssc-template-builder` Step 3 + `[ai-image-zone]` blocks now declare a `generation_route`: **edit-from-ref** (default — ref as `--input-image`, prompt states only the per-post delta), **texture-extract** (textured bg generated once, fixed), **pure-CSS** (solid bg). `ssc-image-generator` Step 5.8 branches on it. Prevents composition hallucination and ghost baked-text.

**Brand-fidelity rules.**
- **bg_treatment first:** visible texture → HYBRID_AI, never PURE_CSS (overrides the visual_kind table).
- **Local-commons icon search is mandatory FIRST** (before any fetch/gen) — real brand marks always.
- **`brand-badge`** — a per-post slot (`BRAND_LOGO_PATH`) that holds the logo of whatever tool the post is about (resolved commons→fetch→text), positioned in a clear zone (never over the subject); never a hardcoded mock, never in brand chrome.
- **Brand headshot = tier 1** for creator/setup slides (`HYBRID_REAL` / `HYBRID_FROM_REAL` — real photo, optionally AI-restyled), AI-portrait only as fallback.
- **physical-placeholder** text sits inside the scene's surface bounds with no HTML card.
- Decorative text slots (oversized scale-word, kicker, etc.) are content-derived or omitted — never the template's editorial sample; duplicate entity across slots de-duped.
- New `body-screenshot` template shape: real UI in a contained card on the brand surface, text on the surface (not overlaid).

**Brand-context gate.** Voice (`voice-profile.md`) is now a SOFT enhancement, not a blocker — posts ship in a generic voice when it's absent; only the visual dimension (tokens + ≥1 `status: ready` template) is hard-required.

**Renderer/manifest bug fixes** (`render_template.py`, `build_manifest.py`): pool `_shared/styles.css` (with brand `@font-face`) now loads in `--template-dir` mode (was falling back to serif); Mustache image slots inline correctly from the template dir and from `--bg-override` (paths with spaces fixed); auto-luminance samples full-bleed bg slots + the override; `manifest.json` emitted as a list with a `file` field (dict form broke pool rendering).

### ssc-designer 1.0.0 — 2026-05-19

Initial versioned release. Adds **Audit 7.9 — Story Framework** (BLOCKING, carousels only, applies to Instagram/LinkedIn/Threads):

- **7.9.1** Headline ≤ 6 words (tightened from 8) — Instagram mobile render + non-native English readers
- **7.9.2** Body ≤ 3 lines (~25 words) — opinion-bearing slides may extend to 4 lines when the argument needs 2 reasons + POV
- **7.9.3** Standalone-in-Explore check applied to **all** slides (was slide-1 only) — Instagram resurfaces individual slides
- **7.9.4** Visual energy curve HIGH-LOW-MED-MED-HIGH-MED-LOW — silence (LOW slides) makes HIGH slides hit
- **7.9.5** Build tonal alternation — no two consecutive build slides may share `background_tone` (dark/light)
- **7.9.6** CTA image-less — last slide stripped to typographic call-to-action on solid brand background
- **7.9.7** Source-material verbatim check (audit, not blocking) — flags ≥12-word matches against `inspiration_pool[]` so the humanizer focuses attention

Also adds new roles to the slide vocabulary: `context | build | payoff` (alongside existing `hook | tension | insight | solution | proof | cta`). The Story Framework canonical 7-slide arc (Hook → Context → Build → Build → Tension → Payoff → CTA) is now the preferred arc when slide count == 7 on Instagram/LinkedIn carousels — +23% engagement vs shorter carousels per the framework.

### ssc-image-generator 1.0.0 — 2026-05-19

Initial versioned release. No behavioral changes from the prior unversioned state — bumped to 1.0.0 alongside `ssc-designer` to establish the versioning convention.
