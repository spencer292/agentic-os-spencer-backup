---
name: 00-social-content
version: 2.1.0
description: >
  Orchestrator for the social content pipeline. Routes by input: text, YouTube/video
  URL, topic (trending research), "from my sources" (scrape LinkedIn + YouTube),
  existing post (repurpose), article URL, or local video/audio (transcribe) →
  post + images. Visual layer via sub-agent `ssc-designer`. Triggers:
  "run social content", "generate post", "create post", "post linkedin",
  "post instagram", "just the images", "from my sources".
  Repurposing → mkt-content-repurposing.
argument-hint: "[topic | URL | local file path | nothing]"
allowed-tools:
  - Bash(*)
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - mcp__zernio__*
dependencies:
  - mkt-brand-voice
  - mkt-content-repurposing
  - str-trending-research
  - tool-humanizer
  - tool-linkedin-scraper
  - tool-publisher
  - tool-transcription
  - tool-web-screenshot
  - tool-youtube
  - viz-image-gen
metadata:
  category: marketing
  version: 2.0
  phase: orchestrator
---

# Social Content Pipeline Orchestrator

Detects scenario from trigger, routes through the right gather phase, runs content inference, **delegates visual planning to `ssc-designer`**, runs the humanizer, dispatches `ssc-image-generator` for image execution, and writes a per-run folder with `post.yaml` + `caption.md` + image(s) + `pipeline-log.md`. Publishing is one command away.

## Input

```
/00-social-content                                    # Scenario D — auto-scrape
/00-social-content "topic or idea"                    # Scenario C — trending research
/00-social-content https://youtube.com/watch?v=...    # Scenario B — YouTube
/00-social-content https://example.com/article        # Scenario F — web page
/00-social-content /path/to/video.mp4                 # Scenario G — local file
/00-social-content "Generate image for this post: …"  # Scenario A — image only
/00-social-content "Adapt this post for instagram: …" # Scenario E — repurpose
```

## Output Directory

```
{projects_base}/00-social-content/
  {YYYY-MM-DD}/
    logs/                  <- working data ONLY (transcripts, scraped posts, screenshots, inspiration)
    {post-slug}/           <- FINAL OUTPUT (post.yaml, caption.md, image(s), pipeline-log.md)
  publish-log.md           <- aggregated publish history (system-wide, not per run)
```

**v2.0.0 change:** the per-run `pipeline-log.md` lives inside `{post-slug}/`, not in `{date}/logs/`. Two runs on the same date no longer collide.

## Configuration

Read at start, use throughout:

1. `.claude/skills/00-social-content/skill-pack/config/sys-config.md` — operational config. Extract the `## Paths` section to resolve `decoupled_base`, `env_file`, `brand_context`, `projects_base`, `output_base`. Read other sections for source toggles and publish behavior. **`## Generation > image_provider` is a soft tie-breaker preference only** — actual provider availability is detected every run by Phase 1 step 2 (validates `.env` against placeholder patterns); ssc-image-generator's Step 3 picks per slide using `ai_style` + `render_mode` criteria.
2. `.claude/skills/00-social-content/skill-pack/config/pipeline.config.yaml` — pipeline settings (defaults, format rules, humanizer mode, publishing mode).

See README.md for full schemas and config file locations.

## Pipeline Log

Create `{output_base}/{date}/{slug}/pipeline-log.md` at the start of the run (after Phase 2 settles the slug). Every phase appends a timestamped entry with `Reasoning:`. The timing table is written after Phase 8. Sub-agents (`ssc-designer`, `ssc-image-generator`) append to the same file.

---

## Phase Summary

Detailed rules per phase live in `references/pipeline-phases.md`. Read it before executing.

| Phase | Owner | Action | Skipped when |
|-------|-------|--------|--------------|
| 0 | orq | ONBOARD — first-run setup | `_customized: true` AND voice-profile.md exists AND visual_state == "ready" (tokens.json + composition-primitives.json + ≥1 template with status:ready) |
| 1 | orq | CONFIG — load configs + brand-context guard (voice + visual 3-state via `AskUserQuestion` popup; auto-invoke missing skills via `Skill` tool — never offer `/<skill-name>` as text) + intent disambiguation | (always runs) |
| 2 | orq | DETECT SCENARIO — A/B/C/D/E/F/G | (always runs) |
| 3 | orq + sub-skills | GATHER INSPIRATION — scenario-specific source fetch | Scenarios A, E (text provided) |
| 4 | orq | PRE-GEN BRIEFING — fill missing trigger fields | Scenarios A, E |
| 5.0 | orq | CONTENT INFERENCE — **consume `visual-identity/tokens.json` if exists, else infer** palette/typography; draft caption (single only); format decision | (always runs) |
| 5.0.5 + 5.3 + 5.7 | **`ssc-designer`** | VISUAL PLANNING — Visual Inventory + Slide Plan + 4 blocking audits + image source resolution | `chosen_format == "text"` |
| 5.4 | orq | CAROUSEL CAPTION — drafted around the slide arc | single, text |
| 5.5 | orq | HUMANIZE + PREVIEW — humanizer (silent) + slide plan shown for confirmation | single, text |
| 6 | orq | HUMANIZER — remove AI tells (deep or standard) | carousel (ran in 5.5); Scenarios A, E |
| 7 | **`ssc-image-generator`** | GENERATE IMAGES — execute the slide_plan the designer produced | `chosen_format == "text"` |
| **7.5** | **orq** | **HTML PREVIEW — generate LinkedIn-style `index.html` mocking the post; block until user approves** | `chosen_format == "text"`; user opts out via `--no-preview` |
| 8 | orq | SAVE + PRESENT — write `post.yaml` + `caption.md`, log timing, hand off to publisher | (always runs) |

Phase 1 brand-context guard: validate BOTH dimensions on first interaction — voice (`{brand_context}/voice-profile.md`, binary present/missing) AND visual (3-state: `ready` / `tokens_only` / `missing`, computed from tokens.json + composition-primitives.json + count of templates with `status: ready`). For each missing-or-partial dimension, open an `AskUserQuestion` popup (NEVER a text fallback, NEVER a `/<skill-name>` command suggestion). If the user accepts, the orchestrator invokes the corresponding skill DIRECTLY via the `Skill` tool — `Skill(skill: "mkt-brand-voice")` and/or `Skill(skill: "mkt-visual-identity")` — and waits for it to return before continuing. The `tokens_only` state has its own popup that offers running Phase 4.5+5 of mkt-visual-identity (composition extraction + template promotion) instead of starting from scratch. Only fall through to neutral defaults when the user explicitly opts out via the popup. Never block on its absence. See `references/pipeline-phases.md` Phase 1 for the 3-state detection block + popup copy.

#### Phase 1 HARD GATE — config-vs-content boundary

After the brand-context guard settles, **before** moving to Phase 2 (scenario detection), the orchestrator MUST validate that the visual identity is shippable. The validation is binary:

```
shippable = (
    (brand_context / "visual-identity" / "tokens.json").exists()
    AND
    any(t.status == "ready" for t in manifest["templates"])
)
```

**Voice is NOT a hard gate.** `voice-profile.md` is a SOFT enhancement, not a blocker:
- Present → drafting + humanizer run in the brand's voice (humanizer `deep`).
- Missing → the pipeline STILL ships. It drafts from generic best practices, runs humanizer `standard`, and sets `brand_name = ""` for the AI-image-prompt layer (Rule 8). Visual brand chrome (wordmark, masthead, palette, fonts) still comes from `tokens.json`, so the post stays visually on-brand — only the caption voice is generic.

The visual dimension (tokens + ≥1 `status: ready` template) is the ONLY hard requirement for image content.

**If `shippable` is FALSE** — even if `mkt-visual-identity` was just invoked in this same session — the orchestrator MUST stop the pipeline and surface:

```
═══════════════════════════════════════════════════════════
  CONFIG INCOMPLETE — can't generate content yet
═══════════════════════════════════════════════════════════

  Pending items (visual — hard requirement):
  {- tokens.json missing → run mkt-visual-identity Mode E}
  {- 0 templates with status: ready (manifest has {N_draft} draft, {N_rejected} rejected) → templates not yet reviewed and marked ready}

  (voice-profile.md missing is NOT a blocker — the post ships in a generic voice; run mkt-brand-voice later to upgrade.)

  Resolve the pending visual items and come back with:
  /00-social-content "topic" — once tokens + ≥1 template are READY
═══════════════════════════════════════════════════════════
```

Then EXIT. Do NOT ask "what topic do you want?" in the same turn — that's the confusion this gate prevents. The user resolves the pending item (likely via the popup from the brand-context guard) and re-invokes when ready.

**Why this is non-optional:** in the old flow, the orchestrator ran `mkt-visual-identity` mid-pipeline, then immediately asked "what's your topic?" while templates were still draft (not approved). The user answered the topic question, the orchestrator proceeded to Phase 5 content inference using template_id values that pointed at draft entries, and the downstream `ssc-designer` filtered those out → fell back to generic → produced off-brand output. The gate exists because "tokens.json exists" is NOT enough — templates must be approved (status:ready) by the user before they're usable. Templates must be reviewed and marked status:ready before they're usable — the orchestrator does that review from the builder's returned preview; Phase 1 gate here is downstream's enforcement.

**Exception — single-text-only scenarios:** if `chosen_format == "text"` is inferable from the trigger (no images needed), the visual dimension can be skipped. Voice is soft, so a text-only post with no brand_context at all still ships in a generic voice.

Phase 2 platform detection order: (1) explicit in trigger → (2) `defaults.platform` from pipeline.config.yaml → (3) `linkedin`.

The three decision matrices that govern visual choices live under `references/decisions/`:
- **`template-matrix.md`** — per slide, which `template_id` (from the pool's `manifest.json`) fits the communication shape. Slide 1 always picks a hook template with a full-bleed image zone. Carousel diversity is enforced.
- **`image-source-matrix.md`** — seven-tier source priority: brand logos → real person photos → news events → real UI screenshots → user assets → video frames → AI gen (last resort).
- **`render-mode-matrix.md`** — TEMPLATE / HYBRID_REAL / HYBRID_FROM_REAL / HYBRID_AI / FULL_AI per slide.

In v2.0.0 these matrices are read by `ssc-designer`, not by the orchestrator or the image-generator at execution time. The orchestrator only consults them to interpret what the designer returned.

### Template pool selection *(Stage 2 — pool mode universal)*

The orchestrator ALWAYS passes a `template_pool` name to the designer at Phase 5.3b based on `(chosen_format, platform)`:

| Format | Platform | `template_pool` |
|---|---|---|
| carousel | linkedin | `linkedin-carousel` |
| carousel | instagram | `instagram-carousel` *(Phase 9 migration target — fails loudly if pool missing)* |
| carousel | youtube | `youtube-slideshow` *(Phase 9+ migration target)* |
| single | any | `{platform}-single` |
| text | — | n/a |

The designer reads `brand_context/templates/<pool>/manifest.json` (per-brand) with `viz-image-gen/references/templates/<pool>/manifest.json` as fallback. `ssc-designer` assigns every slide a specific `template_id` from the pool. There is no legacy `template_family` fallback — if a pool is missing or empty, Phase 5.0.5 fails loudly.

### Style picker *(per-carousel — when the pool has styles)*

A **style** is a curated SUBSET of the pool's templates (a coherent composition family). After resolving `template_pool` and BEFORE dispatching `ssc-designer`, check for `{brand_context}/templates/<pool>/styles.json` (schema + flow: `references/decisions/styles.md`).

- **Present AND ≥2 styles** → open an `AskUserQuestion` popup "Which style for this carousel?", one option per style (`label` + `description`; surface the `cover_preview` path so the user can glance at it). **ALWAYS ask — never auto-pick.** Pass the chosen style to the designer as `template_style` (its `name`) + `allowed_template_ids` (its `template_ids`).
- **Absent or ≤1 style** → no picker; the designer uses the full pool (legacy behaviour). The generic fallback pool is always flat.

A style scopes WHICH templates the designer may pick — every designer audit runs unchanged over the subset. A style is a composition family, NOT a palette/icon recolor (those stay brand-token variations of the same template). This `template_style` is distinct from the per-slide `ai_style`.

---

## Hard-Won Rules (Never Break These)

1. **Brand context guard runs before scenario detection.** Humanizer + image-generator both need it, even on Scenarios A and E.
2. **Always log phase timings AND reasoning to the per-run `pipeline-log.md`.** Every phase records `date +%s` bookends AND a `Reasoning:` line explaining the decision (what was chosen + why + what was rejected). The timing table is written after Phase 8.
3. **Sub-agents write to `{date}/{slug}/`, not `{date}/logs/`.** Working data (transcripts, frames, scraped inspiration) goes to `logs/`. Final output (images, captions, post.yaml, pipeline-log.md) goes to `{slug}/`.
4. **Never skip the humanizer on a generated draft.** Even at "standard" mode it catches the worst AI tells.
5. **Humanizer placement differs by format — never show the user an un-humanized caption.**
   - **Carousel:** humanizer runs silently inside Phase 5.5, before showing the plan. After `Skill(tool-humanizer)` completes — even if it printed a score summary — do NOT end the turn. Continue immediately in the same response to present the slide plan.
   - **Single image / text:** humanizer runs in Phase 6. After `tool-humanizer` returns, your very next tool call in the SAME turn must be the `Agent` invocation for `ssc-image-generator` (or save, if `text`).
   - The only case where Phase 6 can be the last action of the turn is `chosen_format == "text"`.
6. **The designer's audits are blocking.** The orchestrator must not show a slide plan to the user (Phase 5.5) if the designer reports any failing audit (per-slide real check, visual floor, white-space, diversity). If the designer returns with failures, re-invoke once with explicit feedback before falling back.
7. **Light slide-plan edits stay in the orchestrator; heavy edits re-invoke the designer.** Light = single slide tweak (rename, body edit, layout swap). Heavy = arc change, regen all, add/remove ≥2 slides.
8. **`brand_name` is empty string when no voice-profile exists.** Never a placeholder. The template handles empty handles gracefully; the AI image prompt must contain ZERO brand references regardless.
9. **Palette and typography: brand_context tokens win, content inference is fallback.** Phase 5.0 first checks for `brand_context/visual-identity/tokens.json` (produced by `mkt-visual-identity`). If present, consume those tokens verbatim — they are the brand's design contract. **Only when tokens are missing**, infer per-post from entities/tone. The orchestrator passes the resolved palette/typography to `ssc-designer` and `ssc-image-generator` either way. This prevents the failure mode where a brand-context user gets generic Anthropic-terracotta defaults instead of their own brand palette.
10. **Intent disambiguation when user points to files with empty brand_context.** If the user provides a folder/PDF/URL AND `brand_context/voice-profile.md` is missing AND `brand_context/visual-identity/tokens.json` is missing, the orchestrator MUST open an `AskUserQuestion` popup (NOT a text prompt) with three options: BUILD brand_context (auto-invokes `Skill(mkt-brand-voice)` + `Skill(mkt-visual-identity)`), INSPIRATION only, or BOTH. Defaulting to inspiration silently is the bug that produced terracotta-Anthropic output when the user wanted Simon Scrapes style. Never offer `/<skill-name>` as a typed command — the orchestrator invokes skills directly via the `Skill` tool.
11. **Phase 7.5 HTML preview is blocking AND script-only.** After `ssc-image-generator` returns PNGs, call `preview_carousel.py` via `Bash` — that's the ONLY allowed action. **Never use `Write` to author `index.html` inline.** The script reads slide PNGs + caption.md + voice-profile.md from the run folder and emits the LinkedIn-mock HTML. If the script doesn't cover your case, EXTEND THE SCRIPT, don't bypass it. Print the absolute file path the script returns. Wait for explicit user approval before Phase 8. The user double-clicks the file to open in browser — no server needed.
12. **AI prompts never use "cinematic" / "epic" / "8k" / "masterpiece" tone.** Every HYBRID_AI prompt opens with documentary-photography keywords and ends with the strict no-text negative prompt.

13. **Visual planning MUST dispatch `ssc-designer` via the `Agent` tool — never inline.** Phase 5.0.5 + 5.3 + 5.7 are NOT optional skip steps. Even when the orchestrator has just generated the templates and feels familiar with the pool, the dispatch is mandatory. ssc-designer's audits (7.0 cover, 7.1 per-slide real check, 7.2 visual floor, 7.3 icon-content, 7.4 white-space) are the only place those checks actually execute — running them "inline" means running them under the orchestrator's confirmation bias, which silently degrades quality (typographic-only carousels with zero images ship through). Acceptable shortcuts: (a) light edits to a returned slide plan stay in the orchestrator (see Rule 7); (b) re-invoking the designer with feedback when audits fail. Never acceptable: skipping the dispatch and writing the plan inline.

14. **Brand chrome ≠ visual content.** Paper texture, slide frame, page-pill, kicker label, halftone dot grid, oversized typographic numeral, and two-tone headline color split are BRAND CHROME — they do NOT count toward the visual floor (audit 7.2 in ssc-designer.md). A slide earns `visual_weight: supporting` only when an `image_zone` slot is filled with a real or AI-generated image (≥25% canvas). Pure-typographic bodies remain `visual_weight: template` no matter how heavy the typography. When the brand's `moves.md` lists ANY image-bearing move (keywords: `sketch`, `photo`, `screenshot`, `illustration`, `overlay`, `annotation`, `image`), the floor `ceil(2N/3)` is enforced regardless of post objective — body slides without images are off-brand.

15. **Real brand logos always — human-feel principle.** When a slide mentions a company, tool, or product (OpenAI, Cursor, Notion, GitHub, AWS, Anthropic, etc.), the slide MUST render the real brand logo, never a generic icon, never "[Brand]" text, never a substitute emoji. Real logos are the cheapest, highest-leverage "human-made" signal — they show the creator actually USES the tools instead of writing about them abstractly. Resolution chain enforced in `ssc-designer.md` Step 4.1: local commons → `fetch_icon.py` (Simple Icons ~3,300 brands CC0, Lobehub AI tools, Devicon dev tools) → `tool-image-search` last resort. The orchestrator MUST escalate to the user (`AskUserQuestion`) before falling through to a text label — *never* silently degrade. If the entity is too niche for any source AND no upload exists, surface it: "I couldn't resolve a logo for {brand} from Simple Icons / Lobehub / Devicon. Want to (a) upload the SVG, (b) skip the logo on this slide, or (c) try `tool-image-search` (lower quality)?"

16. **Narrate every phase boundary.** The user must always know which phase is running, what just finished, and what comes next. On first run without brand_context, open Phase 1 with the upfront multi-phase plan (Narration 0). Between every phase, print the boundary line (Narration 1). Inside a phase, announce sub-steps that change scope (Narration 2). The exact wording lives in `references/pipeline-phases.md` (section "Phase narration") — never improvise it inline. Skipped phases are suppressed (no `→ Phase 3` line when Phase 3 doesn't run for the scenario). Narration is suppressed in sub-agent context and when `--quiet` is passed. Without this, only Phase 0 onboarding is a checkpoint and every subsequent phase happens silently — that's the bug Issue 01 fixed.

17. **Style picker is always-ask when the pool has styles.** If `{brand_context}/templates/<pool>/styles.json` exists with ≥2 styles, the orchestrator MUST open an `AskUserQuestion` style picker before dispatching `ssc-designer`, and pass the chosen style as `template_style` + `allowed_template_ids`. Never auto-pick a style; never skip the picker when styles exist. When no `styles.json` exists, proceed with the full pool (no popup). A `template_style` is a coherent composition family (a template subset), NOT a palette/icon recolor — and is distinct from the per-slide `ai_style`. See `references/decisions/styles.md`.

---

## Sub-Agent Dispatch

| Phase | Sub-Agent | Agent File | What to pass | What comes back |
|-------|-----------|------------|--------------|-----------------|
| 5.0.5 + 5.3 + 5.7 | Visual Planner | `.claude/agents/ssc-designer.md` | `caption, inspiration_pool, inferred_entities, inferred_palette, inferred_typography, brand_name, brand_context_path, manifest_path, scenario, post_objective, chosen_format, target_platform, pipeline_config, template_style, allowed_template_ids, date, slug, working_dir, log_path` | `{ visual_inventory, slide_plan, reasoning }` |
| 7 | Image Generator | `.claude/agents/ssc-image-generator.md` | `slide_plan, visual_inventory, caption, inferred_palette, inferred_typography, inferred_entities, brand_name, date, slug, format, aspect_ratio, working_dir` | File paths of generated images |

---

## Self-Improvement *(after any user adjustment)*

Apply the adjustment first. Then identify the root file:
- voice-profile.md → tone/vocabulary/platform rules
- this SKILL.md → orchestration behavior
- ssc-designer.md → visual planning rules (inventory, audits, diversity)
- ssc-image-generator.md → image execution logic
- tool-humanizer/SKILL.md → humanizer behavior

Propose the permanent fix, get confirmation, then edit the file directly. Skip silently if declined.

---

## References

| File | Purpose |
|------|---------|
| `references/pipeline-phases.md` | Phase-by-phase orchestration logic; routes to inputs/ and decisions/ files |
| `references/onboarding.md` | First-run setup guide |
| `references/inputs/input-text.md` | Scenarios A + E (text already provided / repurpose) |
| `references/inputs/input-video.md` | Scenarios B + G (YouTube/Vimeo URL / local video file) — transcripts + frames |
| `references/inputs/input-article.md` | Scenario F (article / web page) — `tool-web-screenshot` |
| `references/inputs/input-topic.md` | Scenario C (topic / idea) — `str-trending-research` |
| `references/inputs/input-empty.md` | Scenario D (empty / "from my sources") — LinkedIn + YouTube digest |
| `references/decisions/template-matrix.md` | Caption → style + template family (closed taxonomy). Consumed by `ssc-designer`. |
| `references/decisions/styles.md` | Brand styles = curated template subsets + the per-carousel style picker & scoping rules. Consumed by the orchestrator (picker) + `ssc-designer` (scoping). |
| `references/decisions/image-source-matrix.md` | Per-slide image source order (7 tiers). Consumed by `ssc-designer`. |
| `references/decisions/render-mode-matrix.md` | TEMPLATE / HYBRID_REAL / HYBRID_FROM_REAL / HYBRID_AI / FULL_AI per slide. Consumed by `ssc-designer`. |
| `references/carousel-first-slide-copywriting.md` | 5 hook formulas + cognitive mechanisms + validation checklist. Consumed by `ssc-designer`. |
| `README.md` | Pipeline Flow diagram, Output Structure, post.yaml schema |
