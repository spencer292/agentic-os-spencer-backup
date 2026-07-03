# Pipeline Phases — 00-social-content

Detailed phase logic for the social content orchestrator. SKILL.md keeps the high-level summary; this file holds the per-phase rules.

**Ownership convention.** Some phases run in the orchestrator (the main thread); others are **delegated to `ssc-designer`** (the visual-planning sub-agent) or **`ssc-image-generator`** (the image-execution sub-agent). Each section header below tags the owner.

**Per-run log path (v2.0.0 change).** The pipeline log lives at `{output_base}/{date}/{slug}/pipeline-log.md` — **inside the per-run folder**, not inside `{date}/logs/`. This means two runs on the same date no longer overwrite each other's log. The `{date}/logs/` directory keeps working assets only (transcripts, screenshots, inspiration).

---

## Phase narration — what the user sees between phases

The user must always know **which phase they are in, what just finished, and what comes next**. Phase 0 (ONBOARD) used to be the only explicit checkpoint; everything after it ran silently and left the user guessing. Fix: every phase boundary emits a short user-facing message, and the orchestrator opens the run with an upfront multi-phase plan when brand_context is missing.

**The wording below is the contract — keep it consistent. Edit here when you need to change voice or length; never inline-improvise in SKILL.md or in code.**

### Narration 0 — Upfront multi-phase plan *(printed at the start of Phase 1 when brand_context is incomplete)*

Five flavours, picked from the brand-context check in Phase 1 step 3. Voice is binary (present/missing); visual is tri-state (`ready` / `tokens_only` / `missing`).

**Flavour A — voice missing AND visual missing (full first-time setup):**

```
Today I'll run 3 phases until your first post is out:

  1. Brand voice      → extract voice/vocabulary/platform rules (skill `mkt-brand-voice`, ~5-10 min)
  2. Visual identity  → set up palette, typography, logo, composition primitives and templates
                        (skill `mkt-visual-identity`, ~15-20 min — includes Phase 4.5+5)
  3. First content    → generate your first post (caption + images) using the templates above

Before each phase I'll let you know "Phase X starting" and "Phase X complete". You can stop
at any time.
```

**Flavour B-missing — only visual missing (voice already exists, no tokens.json):**

```
Today I'll run 2 phases until the post is out:

  1. Visual identity  → set up palette, typography, composition primitives, templates
                        (skill `mkt-visual-identity`, ~15-20 min)
  2. First content    → generate the post (caption + images) using the templates generated above
```

**Flavour B-completion — only visual partial (`tokens_only` — tokens.json exists but compositions are missing):**

```
You already have visual tokens. To unlock templates that are structurally faithful to your brand,
you still need to extract composition primitives from your references. 2 phases:

  1. Composition      → analyze brand_context/visual_refs/, extract primitives, generate templates
                        and promote the good ones to ready (skill `mkt-visual-identity` Phase 4.5+5, ~10-15 min)
  2. First content    → generate the post using the promoted templates

Alternative: skip Phase 1 and generate the post with default-generic templates (loses the editorial signature).
```

**Flavour C — only voice missing:** mirror Flavour B-missing with `mkt-brand-voice` in place of `mkt-visual-identity`.

**Flavour D — voice present AND visual ready (returning user):** skip Narration 0 entirely. Print only the environment summary from Phase 1 step 7 and continue.

### Narration 1 — Phase-boundary messages *(printed between phases for the full first-run flow)*

After each phase wraps, print one of these as plain text in chat (NOT as a markdown header — keep it inline so the user reads it like a status line).

| Boundary | Message |
|---|---|
| start of Phase 0 / 1 (brand_context check fires) | `→ Phase 1 — Brand context check.` |
| Phase 1 → invoking `mkt-visual-identity` | `Phase 1 complete · brand_context incomplete · launching mkt-visual-identity now (~10-15 min).` |
| visual identity sub-skill returns | `✓ Visual identity ready · tokens.json + brand-book.pdf written under brand_context/visual-identity/. Next: template factory.` |
| template factory starts | `→ Phase 1.5 — Template factory · generating the linkedin-carousel pool from your tokens.` |
| template factory finishes | `✓ Templates ready · 16 variations under brand_context/templates/linkedin-carousel/. PNG previews in _preview/. Next: first content.` |
| Phase 2 entering | `→ Phase 2 — Detecting scenario from your input.` |
| Phase 3 entering (B/C/D/F/G only) | `→ Phase 3 — Gathering inspiration (scenario {X}).` |
| Phase 5.0 entering | `→ Phase 5.0 — Content inference (palette · typography · entities · format).` |
| dispatching `ssc-designer` | `→ Phase 5.0.5+5.3+5.7 — Visual planning (delegating to ssc-designer; runs 4 blocking audits).` |
| `ssc-designer` returns clean | `✓ Slide plan ready · {N} slides · audits passed (real-check · floor · icons · white-space · diversity).` |
| `ssc-designer` returns with feedback request | `⚠ ssc-designer flagged: {failure summary} · re-invoking with feedback.` |
| Phase 5.5 humanize+preview | `→ Phase 5.5 — Humanize caption + show slide plan for your review.` |
| Phase 7 entering | `→ Phase 7 — Generating images (delegating to ssc-image-generator).` |
| each slide image done | `  ✓ slide-{N}.png ({Ns} · {mode} · {backend})` |
| Phase 7.5 HTML preview ready | `→ Phase 7.5 — LinkedIn preview ready at {abs path} · waiting for approval.` |
| Phase 8 save done | `✓ Post saved at {output_base}/{date}/{slug}/ · log at pipeline-log.md.` |

**Critical:**
- Print these as PLAIN TEXT lines, not headers. The user reads them mid-stream.
- Use the arrow glyphs verbatim (`→` for "starting", `✓` for "done", `⚠` for "issue") so the user can grep their transcript.
- Do NOT inline a phase-boundary message between two tool calls in the same turn just to fill silence — only print when an actual boundary crosses (a tool returned, a sub-skill exited, the orchestrator changes track).
- When a phase is SKIPPED for the current scenario (e.g., Phase 3 for Scenarios A/E), do NOT print a "→ Phase 3" line at all. Skip silently — narrating skipped phases is noise.

### Narration 2 — Sub-step transparency within a phase

Inside a phase, before any sub-step that changes scope (e.g., "going to scrape LinkedIn now", "switching to YouTube digest", "re-invoking humanizer because caption changed"), print one short line:

```
  · {what you're about to do} ({why})
```

Indent with 2 spaces so the line visually nests under the parent phase line. Example:

```
→ Phase 3 — Gathering inspiration (scenario D).
  · Scraping last 7 days of LinkedIn from saved sources (needed for digest).
  · Fetching latest 3 videos from saved YouTube channels.
✓ Inspiration pool ready · 12 LinkedIn posts + 3 transcripts.
```

When narrating from a delegated agent (designer, image-gen), prefix with the agent name: `  · [ssc-designer] running 7.0 cover audit`.

### When narration is suppressed

- Sub-agent / automated context (no human in the loop) → all narration is suppressed except the final summary. The pipeline-log.md still records every phase boundary.
- User passed `--quiet` or pipeline.config.yaml has `narration: off` → suppress Narrations 0/1/2; still log to pipeline-log.md.

---

## Phase 0: ONBOARD *(orchestrator — first run only)*

Skip entirely if `sys-config.md` has `_customized: true` AND `voice-profile.md` exists AND `visual_state == "ready"` (tokens.json + composition-primitives.json + ≥1 template with `status: ready`). In sub-agent / automated context: skip silently, use saved config + defaults. The `tokens_only` state does NOT count as ready — onboarding still runs and the visual-completion popup fires.

See `references/onboarding.md` for full onboarding instructions.

---

## Phase 1: CONFIG *(orchestrator — every run)*

1. Read `pipeline.config.yaml` and `.claude/skills/00-social-content/skill-pack/config/sys-config.md`. Extract: `output_base`, `defaults.platform`, `defaults.format`, `images.style`, `defaults.language`.

2. **Detect available image providers (read .env every run).**

   Resolve `.env` from `sys-config.md ## Paths: env_file`. For each line matching `OPENAI_API_KEY=...` or `GEMINI_API_KEY=...`, validate the value:

   ```
   present = (
     value is non-empty
     AND value is not in {"", "your-key-here", "xxx", "placeholder", "TODO", "REPLACE_ME"}
     AND len(value) >= 20      # real Anthropic/OpenAI/Google keys are >40 chars; <20 is placeholder
     AND not value.lower().startswith(("your-", "placeholder", "todo", "<"))
   )
   ```

   Build `available_providers` list:
   - `["openai", "gemini"]` if both pass
   - `["openai"]` or `["gemini"]` if only one
   - `[]` if neither

   Pass `available_providers` to `ssc-image-generator` in Phase 7. The image-gen agent picks per slide using documented criteria when both available; forces the only one when one available; falls back to TEMPLATE-only rendering (no AI image generation) when neither.

   **`sys-config.md image_provider` is a soft preference**, not a hard contract. The image-gen agent ignores it when (a) the preferred provider isn't in `available_providers`, or (b) the slide's `ai_style` has a documented stronger pairing with the other provider (e.g. social-design archetypes that need text fidelity always route to GPT regardless of preference).

3. **Brand context check (TWO dimensions — voice + visual; visual has THREE sub-states).**

   Voice (binary):
   - `present` if `brand_context/voice-profile.md` exists at project root, else `missing`.

   Visual (three-state — `tokens.json` alone is NOT sufficient since v3 composition system shipped):
   ```
   tokens     = exists(brand_context/visual-identity/tokens.json)
   primitives = exists(brand_context/visual-identity/composition-primitives.json)
   manifest   = exists(brand_context/templates/{any}/manifest.json)
   ready_count = count(t for t in manifest.templates if t.status == "ready") if manifest else 0

   if ready_count >= 1: visual_state = "ready"        # tokens + primitives + ≥1 promoted template
   elif tokens:         visual_state = "tokens_only"  # colors/fonts done, no composition primitives yet
   else:                visual_state = "missing"
   ```

   Why three states: `tokens.json` only carries colors + fonts + spacing. Composition primitives (`composition-primitives.json` + accepted templates in `templates/{pool}/manifest.json`) are what allow the orchestrator to actually generate a structurally-faithful carousel. A brand with only `tokens.json` produces visually-coherent-but-structurally-generic output — needs Phase 4.5 (composition extraction) and Phase 5 (template translation + acceptance) to be production-ready.

4. **Brand-context guard (ALWAYS opens an `AskUserQuestion` popup — NEVER prints `/<skill-name>` as a text command, NEVER asks via plain text).**

   On the FIRST interaction of a project, for each missing dimension the orchestrator opens an `AskUserQuestion` popup. The skills are then invoked DIRECTLY through the `Skill` tool — `Skill(skill: "mkt-brand-voice")` and/or `Skill(skill: "mkt-visual-identity")` — never as a typed slash command.

   Decision table (apply in order; stop at first match):

   | Voice | Visual | Action |
   |---|---|---|
   | present | ready | Skip popup. Print environment summary. Continue. |
   | present | tokens_only | Open the **visual completion** popup (offer Phase 4.5+5 extraction OR continue with tokens-only). |
   | present | missing | Open the **visual missing** popup → `Skill(skill: "mkt-visual-identity")` from Phase 1. |
   | missing | ready | Open the **voice missing** popup → `Skill(skill: "mkt-brand-voice")`. |
   | missing | tokens_only | Open voice popup, WAIT for the user to answer, THEN open visual-completion popup as a SEPARATE `AskUserQuestion` call (never combined). |
   | missing | missing | Open voice popup, WAIT for the user to answer, THEN open visual-missing popup as a SEPARATE `AskUserQuestion` call (never combined). For each accepted → `Skill(skill: <name>)`. |

   **Popup copy — voice missing:**

   ```
   AskUserQuestion({
     questions: [{
       question: "You don't have a brand voice configured yet. Want to set it up now so your posts sound like you?",
       header: "Brand voice",
       multiSelect: false,
       options: [
         { label: "Yes, set it up now",
           description: "Runs mkt-brand-voice automatically (~5-10 min). All future text generation will be in your voice." },
         { label: "Skip for now",
           description: "Continues with neutral defaults. You can run it later — the current post ships without a personalized voice." }
       ]
     }]
   })
   ```

   **Popup copy — visual missing (no tokens.json):**

   ```
   AskUserQuestion({
     questions: [{
       question: "You don't have a visual identity configured yet. Want to fill it in now so the images follow your visual style (palette, typography, templates)?",
       header: "Visual identity",
       multiSelect: false,
       options: [
         { label: "Yes, set it up now",
           description: "Runs mkt-visual-identity automatically (~10-15 min). Carousels and generated images will start using your tokens." },
         { label: "Skip for now",
           description: "Continues with per-post inference (palette/typography derived from the content). You can run it later." }
       ]
     }]
   })
   ```

   **Popup copy — visual completion (`tokens_only` state: tokens.json exists but composition primitives + ready templates are missing):**

   ```
   AskUserQuestion({
     questions: [{
       question: "You have visual tokens (colors + fonts) but haven't extracted compositions from references yet. The posts will come out with your palette but with generic layouts. Want to extract composition primitives now to unlock templates that are structurally faithful to your style?",
       header: "Composition",
       multiSelect: false,
       options: [
         { label: "Yes, extract compositions",
           description: "Runs mkt-visual-identity Phase 4.5 + 5 (~10-15 min) — analyzes brand_context/visual_refs/, extracts primitives, generates templates, marks one or more as status: ready. Carousels become structurally faithful." },
         { label: "Continue with tokens only",
           description: "Uses the current tokens. The post's templates will be default-generic (gradient + serif title + body). It works, but loses your brand's editorial signature. You can run Phase 4.5+5 later." }
       ]
     }]
   })
   ```

   **Critical rules:**
   - The popup IS the prompt — never echo the options as text in chat first.
   - If the user picks "Yes", invoke the corresponding skill via `Skill(skill: ...)` in the SAME turn and wait for it to return before continuing the pipeline.
   - NEVER suggest `/mkt-brand-voice` or `/mkt-visual-identity` as a command the user should type. The orchestrator owns the invocation.
   - NEVER block: "Skip for now" is always a valid answer — continue with neutral defaults / per-content inference.
   - **NEVER combine voice + visual into a single `AskUserQuestion` call.** Each dimension is its own decision with its own trade-offs. When both are missing, the orchestrator emits the voice popup as its OWN `AskUserQuestion` tool call, AWAITS the user's answer, THEN emits the visual popup as a SEPARATE `AskUserQuestion` tool call. Reasoning: a combined "configure everything / only voice / cancel" popup forces the user to bundle decisions that should be independent, and removes the option of "voice yes, visual no" (or vice versa).

   **Anti-pattern (DO NOT DO THIS):**

   ```
   AskUserQuestion({
     questions: [{
       question: "Brand context is empty. How do you want to proceed?",
       options: [
         { label: "Build everything now (voice + visual)", ... },
         { label: "Just the voice for now", ... },
         { label: "Cancel", ... }
       ]
     }]
   })
   ```

   This is wrong because (a) it bundles two independent decisions, (b) the user can't pick "visual yes, voice no", (c) "Cancel" is not a valid answer for the guard — "Skip for now" is the correct skip option per popup.

   **Correct pattern (sequential, separate calls):**

   ```
   // Turn N
   AskUserQuestion({ questions: [<voice missing popup>] })
   // Wait for response

   // Turn N+1 (or same turn if user responded inline)
   AskUserQuestion({ questions: [<visual missing popup>] })
   // Wait for response

   // Then invoke Skill() for whichever the user accepted
   ```

5. **Intent disambiguation (CRITICAL — was missing in v2.0.0, caused the Simon-Scrapes / Anthropic-terracotta bug).**

   If the user's request mentions a folder, file path, URL, or PDF AS REFERENCE MATERIAL **AND** brand_context is empty in either dimension (no voice-profile and/or no typography-tokens), open an `AskUserQuestion` popup BEFORE assuming intent. This popup REPLACES the per-dimension popups above for the missing dimensions involved.

   ```
   AskUserQuestion({
     questions: [{
       question: "You pointed to {path/URL}. Before I generate anything, I need to know what this material is for:",
       header: "Material intent",
       multiSelect: false,
       options: [
         { label: "BUILD brand_context",
           description: "Extracts voice + visual identity from these materials and generates posts in your style. Runs mkt-brand-voice + mkt-visual-identity (~10-15 min). Every future post benefits." },
         { label: "INSPIRATION (1 post)",
           description: "Uses it as topical/conceptual inspiration for THIS post, without building brand_context. Visual inferred from the content (generic). Faster, but the output ends up 'AI-generic' without brand tokens." },
         { label: "BOTH",
           description: "Builds brand_context now AND uses this material as inspiration for the next post." }
       ]
     }]
   })
   ```

   - **Default when user dismisses the popup or replies 'go'/'ok' without picking:** treat as **BUILD**. Investing 10 min upfront beats producing brand-inconsistent posts.
   - If **BUILD** → invoke `Skill(skill: "mkt-brand-voice")` and `Skill(skill: "mkt-visual-identity")` with the provided material, then return here for next step (no post generation yet — wait for user to request a post).
   - If **INSPIRATION** → continue current flow as Scenario D (inspiration), brand_context stays empty.
   - If **BOTH** → invoke both build skills via `Skill(...)`, THEN continue with current request as Scenario D using the freshly-built brand_context.

6. **If NO files mentioned AND brand_context is empty:** the per-dimension popups in step 4 cover this case. The intent question in step 5 only fires when files ARE mentioned — otherwise nothing to disambiguate.

7. Print:
   ```
   Environment:
     voice-profile.md            [loaded | MISSING]
     visual-identity/tokens.json [loaded | MISSING]
     composition-primitives.json [loaded | MISSING]
     templates ready             [N | none]
     visual_state                [ready | tokens_only | missing]
     Image providers             [openai+gemini | openai only | gemini only | NONE (HTML-only mode)]
     Mode                        [full brand | voice only | visual partial | visual only | NEUTRAL]
   ```

This guard runs before scenario detection. Scenarios A and E benefit from brand context if available, but never block on its absence.

---

## Phase 2: DETECT SCENARIO *(orchestrator)*

Platform detection order: (1) explicit in trigger → (2) `defaults.platform` from pipeline.config.yaml → (3) `linkedin`.

| Signal | Scenario |
|--------|----------|
| Full post text + "just the image(s)" / "generate image" | A — images only |
| `youtube.com/watch?v=` or `youtu.be/` URL | B — YouTube |
| Video URL (vimeo.com, loom.com, tiktok.com, instagram.com/reel, .mp4, etc.) | B — video URL |
| Local file path (`.mp4`, `.mov`, `.mp3`, `.wav`, `.m4a`, etc.) | G — local file |
| Any non-video URL (article, blog, thread, landing page, tweet) | F — web page |
| Topic, angle, or idea (no URL, no full post) | C — topic |
| Empty message / "from my sources" / "use my sources" | D — auto-scrape |
| References existing post + "adapt for" / "repurpose" / "version for" | E — repurpose |

Determine the slug now (`{YYYY-MM-DD}-{topic-slug}`) so the per-run log path is ready: `{output_base}/{date}/{slug}/pipeline-log.md`. Create the run folder and initialize the log file with the detected scenario, source, and start timestamp.

**Reasoning-log requirement (applies to every phase below):** every decision-making phase must record both the **decision** AND the **reasoning** in the per-run `pipeline-log.md`. Use this format:

```markdown
## Phase N — NAME [done]
- Decision: {what was chosen}
- Reasoning: {1-line why — what signals led to this}
- Alternatives rejected: {what was considered and not chosen, with 1-line why}
- Elapsed: {seconds}
```

Do NOT just log the outcome — always include the WHY. If a decision was forced by config (no real choice), log `Reasoning: pinned in config`.

---

## Phase 3: GATHER INSPIRATION *(orchestrator)*

Based on the scenario detected in Phase 2, read the matching input spec and follow its Phase 3 logic. Each input file documents the tools to invoke, the output location, fallback rules, and best practices:

| Scenario | Read this file |
|----------|----------------|
| A, E (text already provided) | `references/inputs/input-text.md` |
| B, G (video — URL or local) | `references/inputs/input-video.md` |
| C (topic / idea) | `references/inputs/input-topic.md` |
| D (empty / "from my sources") | `references/inputs/input-empty.md` |
| F (article / web page) | `references/inputs/input-article.md` |

After the input-specific gather completes:
- Scenarios B, C, D, F, G → continue to Phase 4 (briefing).
- Scenarios A, E → jump directly to Phase 5.0 (content inference) → designer dispatch → Phase 5.5 (preview).

Log Phase 3 completion in `pipeline-log.md` with elapsed seconds AND the reasoning line (which input file was followed, what was gathered, any fallbacks triggered).

---

## Phase 4: PRE-GENERATION BRIEFING *(orchestrator — Scenarios B, C, D, F, G only)*

Skip items already known from the trigger. If all three are known, skip the briefing entirely.

Ask only what's missing:
> Quick briefing before I start:
> 1. **Objective** — teach / engage / generate leads / brand awareness / announce?
> 2. **Format** — carousel, single image, or text only? (or "auto")
> 3. **Platform** — confirm {target_platform}, or different?
>
> Say **"defaults"** to use saved preferences.

Store: `post_objective`, `chosen_format`, `target_platform`.

---

## Phase 5.0: CONTENT INFERENCE *(orchestrator — every scenario)*

Read `voice-profile.md` fully (tone, vocabulary, platform adaptations). Read `visual_refs/` text files if present.

### Phase 5.0.A — CONSUME tokens before inferring (NEW in v2.0.1)

**Before running any inference**, check if `brand_context/visual-identity/tokens.json` exists.

```
if {project_root}/brand_context/visual-identity/tokens.json exists:
    tokens = read(brand_context/visual-identity/tokens.json)
    inferred_palette       = tokens.colors    # verbatim, no inference
    inferred_typography    = tokens.fonts + tokens.type_scale
    canvas_size            = tokens.canvas
    templates_available    = list of brand_context/templates/{output_format}/ pools (if present)
    inference_mode         = "consume_brand_tokens"
    log: "Consuming brand tokens from brand_context/visual-identity/tokens.json — skipping palette/typography inference"
    → SKIP the inference tables below
    → still run inferred_entities (different concern)
else:
    inference_mode = "infer_per_content"
    → run the inference tables below
```

This is the rule that prevents the failure mode: user builds brand_context with `mkt-visual-identity`, then runs `00-social-content` — and the orchestrator overrides their tokens with content-inferred Anthropic-terracotta. **Brand tokens always win**.

### Phase 5.0.B — INFER (only when no brand tokens)

Derive three context blocks from the gathered inspiration. These are the **inputs the designer needs** to build the Visual Inventory and Slide Plan.

### 1. `inferred_entities` — what real things does the post talk about?

Scan the inspiration source (article body, transcript, topic, scraped posts) and the working draft. Extract — case-sensitive where it matters:

```yaml
inferred_entities:
  brands:    [Anthropic, AcmeCorp, ...]         # companies, products, SaaS, AI tools
  people:    [Jane Doe, Sam Altman, ...]         # named real people
  events:    [ProductLaunch 2026]                # named real events / news beats
  products:  [Claude Code, Cursor, ...]          # tools / apps / specific products
  teams:     [Team Alpha, Team Beta, ...]        # sports clubs / org units with their own crest colors
  ui:        [https://app.example.com/...]       # if a specific live URL appears, capture it for tool-web-screenshot
```

Every entry here becomes a candidate for tier 1–4 of `image-source-matrix.md` in the designer's Visual Inventory.

### 2. `inferred_palette` — what colors should this post wear?

Priority order (stop at first match):

| If… | Palette source |
|---|---|
| `brand_context/assets.md` exists with a defined palette | Use it verbatim |
| Post centers on a known brand from `inferred_entities.brands` (one strong protagonist) | Brand's official colors (e.g., Anthropic → `#CC785C` orange + warm off-white) |
| Post centers on a sport team from `inferred_entities.teams` | Team's crest colors (e.g., a red+black+white club → red `#E10000` + black + white) |
| Post is dramatic / emotional / news-of-failure | Dark base + 1 strong accent (red for tension, white text for starkness) |
| Post is tech-minimal (comparing tools, integration news) | Off-white bg + near-black text + 1 subtle neon (editorial-tech look) |
| No signal | Default: `#fafaf8` bg + `#0a0a0a` text + `#a3ff00` neon accent |

Output:
```yaml
inferred_palette:
  primary:           "#E10000"
  background:        "#0a0a0a"
  text:              "#ffffff"
  accent:            "#ffffff"
  accent_secondary:  "#E8B23E"   # OPTIONAL — populate only when the brand or content
                                  # signals a clear second accent. When omitted, downstream
                                  # consumers fall back to 3-color mode. See Issue 05.
  reasoning:         "Sport-team palette — red dominates because the post is about the team's crisis moment"
```

### 3. `inferred_typography` — what font feels right?

| Signal | Display font | Body font | Notes |
|---|---|---|---|
| Post about code / CLI / dev tools | `'JetBrains Mono', monospace` for headlines | Inter for body | Mono headers tell the reader "this is technical" without saying it |
| Post about news / drama / sport | Editorial chunky sans (`'Inter Tight', 900`) | Inter | Big bold display, editorial-magazine feel |
| Post about brand identity / agency content | Same as default | Same as default | Brand kit overrides anyway |
| Default | `Inter`, weight 800 for display | `Inter`, weight 500 for body | The current template default |

Output:
```yaml
inferred_typography:
  display_family: "'Inter Tight', 'Inter', system-ui, sans-serif"
  display_weight: 900
  body_family:    "'Inter', system-ui, sans-serif"
  body_weight:    500
  reasoning:      "Dramatic news content — chunky editorial display, no monospace"
```

**Log all three blocks to `pipeline-log.md` under `## Phase 5.0 — CONTENT INFERENCE [done]`** with reasoning lines.

**Brand name rule:** if `brand_context/voice-profile.md` exists with a defined `display_name`, store it as the brand handle. **If not, `brand_name` is empty string** — NEVER a placeholder. The template render layer handles empty handles gracefully; the AI image prompt layer treats it as a hard "no text" constraint.

### Format decision (still in 5.0, before dispatching the designer)

Override if `chosen_format` was already set by user:
- **Carousel** if input > 250 words OR content has process / comparison / named list of 3+ / multi-moment story
- **Single** otherwise
- **Text** if user explicitly asked for text-only

Assign slug if not already set: `{YYYY-MM-DD}-{topic-slug}`.

### Draft caption *(only for single image; carousel caption comes after the slide plan)*

For `chosen_format == "single"` or `chosen_format == "text"`:

**Draft rules:** declarative hook, no question openers, platform length from voice-profile, hashtags per `drafting.hashtag_strategy`, flowing paragraphs, declarative close.

**Calibrate via `post_objective`:** teach → insight close; engage → surprising angle; lead gen → soft CTA; brand awareness → conviction lead; announce → announcement first + why-it-matters.

Store as `draft_caption`. The designer receives it as input.

For `chosen_format == "carousel"`: do NOT draft the caption yet. The designer will return a `slide_plan` first; the orchestrator drafts the caption around the slide arc (see Phase 5.4 below).

Log Phase 5.0 completion with elapsed seconds.

---

## Phase 5.0.5 + 5.3 + 5.7: VISUAL PLANNING *(delegated to `ssc-designer`)*

**This is the single delegation point for the visual layer.** The orchestrator dispatches `ssc-designer` once with the full Phase 5.0 outputs and receives a validated `slide_plan` + `visual_inventory` + `reasoning` block back. The designer handles, internally:

- **Phase 5.0.5 — Visual Inventory:** scan `icons/commons/`, `brand_context/visual_refs/`, video frame manifests, and pre-form `tool-image-search` / `tool-web-screenshot` queries for entities not yet found locally. Built BEFORE the slide plan exists — visuals lead, text follows.
- **Phase 5.3a — Arc + hook stress-test:** pick the narrative arc from `post_objective`, draft slide 1 hook via `carousel-first-slide-copywriting.md` formulas, validate (≤8 words, declarative, concrete, earns the swipe). Also: emotional journey check (no 3 consecutive slides with same feeling; arc must crescendo; one pivot mid-arc) and progressive disclosure (each slide adds exactly one new idea).
- **Phase 5.3b — Slide outline (visual-first):** for each slide, pull from the inventory FIRST, then write headline/body around the chosen visual. `image_concept` is a searchable term + a reason, NOT a generative scene description. Every slide gets a `visual_weight` tag: `anchor | supporting | template`.
- **Phase 5.3b.0 + 5.7 — Four audits (BLOCKING):**
  1. **Per-slide logo/photo real check** — walk image-source-matrix tiers 1–6 before settling on render_mode (no walk = slide rejected, plan rebalanced).
  2. **Visual floor** — `ceil(2 × N / 3)` slides must have `visual_weight ∈ {anchor, supporting}`. For 6 slides → 4 minimum; for 8 → 6. If under floor, promote the TEMPLATE slide with the most concrete `image_concept` until satisfied.
  3. **Icon-anchor classification** — icons that occupy ≥25% of canvas AND are integrated to the composition count as `supporting` (or `anchor`). Decorative icons (corner marks, bullets, dividers) do NOT count toward the floor.
  4. **White-space audit** — every slide's canvas must be occupied by image, icon-anchor, dense typography (multiple weights, bold keywords, marginalia, dividers), or a pattern/color block background. Headline floating on empty canvas is rejected.
- **Diversity enforcement (existing rule kept):** no carousel where every content slide shares the same render_mode; no 2 consecutive slides share the same `template_id`; ≥1 TEMPLATE typographic slide; Scenario F mandate (≥1 slide with tier 2 or 3 source).
- **FULL_AI eligibility gate:** strict — see `references/decisions/render-mode-matrix.md`. Any failure → fall back to `HYBRID_AI`.

### What the orchestrator passes to the designer

```yaml
caption:              {draft_caption or "" for carousel}
inspiration_pool:     {scenario-dependent gather output}
inferred_entities:    {from Phase 5.0}
inferred_palette:     {from Phase 5.0}
inferred_typography:  {from Phase 5.0}
brand_name:           {string or ""}
brand_context_path:   {absolute path to brand_context/ or null}
manifest_path:        {absolute path to {date}/logs/screenshots/manifest.json or null}
scenario:             {A..G}
post_objective:       {teach|engage|lead_gen|brand_awareness|announce}
chosen_format:        {carousel|single|text}
target_platform:      {linkedin|...}
template_pool:        {"linkedin-carousel" | "instagram-carousel" | null}   # v2.0.1+
pipeline_config:      {parsed pipeline.config.yaml}
date:                 {YYYY-MM-DD}
slug:                 {post slug}
working_dir:          {abs path}
log_path:             "{output_base}/{date}/{slug}/pipeline-log.md"
```

**`template_pool` resolution rule (Stage 2 — pool mode universal):**

```
if chosen_format == "carousel" and target_platform == "linkedin":
    template_pool = "linkedin-carousel"
elif chosen_format == "carousel" and target_platform == "instagram":
    template_pool = "instagram-carousel"   # added when the pool ships (Phase 9+)
elif chosen_format == "carousel" and target_platform == "youtube":
    template_pool = "youtube-slideshow"    # added when the pool ships
elif chosen_format == "single":
    template_pool = "{target_platform}-single"   # pool for single-image posts
else:
    raise SystemExit(f"No template_pool for format={chosen_format} platform={target_platform} — add a pool under brand_context/templates/ or viz-image-gen/references/templates/")
```

The designer reads `manifest.json` from the pool and picks specific `template_id`s per slide. The designer's return payload ALWAYS includes `template_id` per slide — there is no legacy fallback. If the pool doesn't exist or contains no `status: "ready"` templates, fail loudly (no silent degradation to legacy mode).

### What comes back

`{ visual_inventory, slide_plan, reasoning }` — see `agents/ssc-designer.md` for the full schema.

### Re-invocation rule for user adjustments

After Phase 5.5 preview, if the user requests a change:

- **Light adjustment** (rename headline, tweak body, swap layout on one slide) → orchestrator edits the returned `slide_plan` object inline. No re-invocation.
- **Heavy adjustment** (regen all slides, change the arc, add/remove ≥2 slides) → re-invoke `ssc-designer` with the same inputs + a `feedback` string describing the requested change.

Log the decision per adjustment.

---

## Phase 5.4: CAROUSEL CAPTION *(orchestrator — carousel format only; skipped for Scenarios A and E)*

**Skip entirely for Scenarios A and E** — the caption is already final (pasted by the user or returned by `mkt-content-repurposing`). The designer's slide plan adapts to the existing caption; the caption is NOT redrafted.

For Scenarios B, C, D, F, G: after the designer returns, draft the LinkedIn (or platform) caption AROUND the slide arc:

- Pull the hook from slide 1
- Reference the arc tension in 1–2 lines
- Surface the key insight (insight slide)
- Close with the solution or takeaway
- CTA matches the last slide

**Caption rules:** declarative hook, no question openers, platform length from voice-profile, hashtags per `drafting.hashtag_strategy`.

**Slide body HTML rules (the designer follows these too, but verify on read-back):**
- CLI commands, keyboard shortcuts, and code references must use `<code>` tags — never backtick markdown.
- Multi-item body content uses `<br>` line breaks between items.

Log Phase 5.4 completion with elapsed seconds. Store as `draft_caption`. Next phase (5.5) runs the humanizer on it.

---

## Phase 5.5: HUMANIZE + SLIDE PLAN PREVIEW *(orchestrator — carousel format only)*

Skip if `chosen_format == "single"` or `chosen_format == "text"`.

**Step 1 — Run humanizer silently *(skip for Scenarios A and E)*.** For Scenarios B, C, D, F, G: invoke `tool-humanizer` on `draft_caption` (mode: `deep` if voice-profile exists, `standard` otherwise, or override from `drafting.humanizer_mode`). This produces the final caption. The user never sees the un-humanized draft.

For Scenarios A and E: the caption is already final (user-pasted or `mkt-content-repurposing` output). Use it as-is — do NOT invoke the humanizer. Proceed directly to Step 2 with `caption = post_text`.

> ⚠️ **Critical — do NOT end the turn after `Skill(tool-humanizer)` returns.** The humanizer may print its score summary — that's NOT the deliverable for this phase. After the humanizer invocation completes, continue immediately in the same response to build the preview and present it as Step 2. The turn must end with the slide plan visible to the user, not with the humanizer score.

**Step 2 — Present humanized caption + slide plan:**

```
Caption:
{humanized caption — full text}

---
Slide plan ({N} slides) · Visual floor: {visual_slides}/{floor_required}

  [FRONT]   "{headline}" — {template_id} · anchor: {image_source.type or "—"}
  [Slide 2] role: {role} · feeling: {feeling} · {visual_weight}
            Title: "{headline}"
            Body: "{body}"
            Image: {image_concept} · zone: {image_zone} · {render_mode}
            Source: {image_source.type} (tier {N}) → {path or query}
  [Slide 3] ...
  [CTA]     "{cta text}" — template cta

Audits: real-check ✓ · floor ✓ · icons ✓ · white-space ✓ · diversity ✓

Looks good? Adjust any slide or say "generate" to continue.
```

On confirmation → run Phase 7 in the SAME turn (image sources are already resolved inside the slide_plan; the orchestrator just dispatches `ssc-image-generator`).
On adjustment → apply the change per the re-invocation rule above. If the caption changed, re-run humanizer on it.

---

## Phase 6: HUMANIZER *(orchestrator — single image and text formats only — Scenarios B, C, D, F, G)*

**Skip if `chosen_format == "carousel"`** — humanizer already ran inside Phase 5.5. Also skip for Scenarios A and E (text is final).

**Critical: Phase 6 is NOT a turn-ending phase for single image.** After `tool-humanizer` returns, your very next tool call in the SAME turn must be the `Agent` invocation for `ssc-image-generator` (Phase 7). Do not pause to show the humanized caption — it is an INPUT to Phase 7, not an output to the user.

**Required sequence — execute as a single uninterrupted chain:**

1. Invoke `tool-humanizer` in pipeline mode. Mode: `deep` if voice-profile exists, `standard` otherwise (or override from `drafting.humanizer_mode`).
2. Log Phase 6 elapsed seconds + reasoning to `pipeline-log.md`.
3. In the SAME turn, immediately invoke the `Agent` tool for `subagent_type: "ssc-image-generator"` (Phase 7).

**The ONLY case where Phase 6 can be the last action of the turn is when `chosen_format == "text"`** (text-only post, no images needed).

**Common failure mode to avoid:** the humanizer's polished output LOOKS like a finished deliverable — well-formatted caption with hashtags. Do not treat it as a stopping point.

---

## Phase 7: GENERATE IMAGES *(orchestrator → `ssc-image-generator`)*

Skip if `chosen_format == "text"`. Spawn sub-agent `subagent_type: "ssc-image-generator"`. Pass:

- `template_pool` *(REQUIRED — Stage 2 pool mode universal)* — name of the per-skill template pool to use. Defaults: LinkedIn carousel → `"linkedin-carousel"`. Instagram carousel → `"instagram-carousel"` (once available). YouTube slideshow → `"youtube-slideshow"`. Ebook page → `"ebook"`. The orchestrator resolves the pool per the rule in Phase 5.0.5 above. If no pool exists for the format/platform, fail in Phase 5.0.5 — do NOT pass `null` to the image-gen.
- `slide_plan` — the full slide outline from the designer. Each slide carries `template_id` (e.g., `"hero-typographic"`, `"body-numbered-list"`, `"cta-question"`, `"photo-overlay-front"`, `"editorial-news-image-top"`) chosen from the pool's `manifest.json`. Slides always carry: `role, headline, body, image_concept, image_zone, render_mode, image_source, transformation, frame_path, visual_weight, template_pool, template_id`.
- `visual_inventory` — for transparency / fallback. The image-generator may consult it but the designer already resolved sources.
- `caption` — humanized post text (from Phase 5.5 or Phase 6)
- `inferred_palette`, `inferred_typography`, `inferred_entities`, `brand_name` — passed through unchanged (image-generator builds `brand_kit` from them, never re-derives)
- `available_providers` *(REQUIRED)* — list detected in Phase 1 step 2: `["openai", "gemini"]` / `["openai"]` / `["gemini"]` / `[]`. The image-gen agent picks per slide using documented criteria when both available; forces the only one when one available; downgrades HYBRID_AI / FULL_AI / HYBRID_FROM_REAL to TEMPLATE (or HYBRID_REAL if a real source resolved) when the list is empty.
- `date`, `slug`, `format`, `aspect_ratio`, `working_dir`

The image-generator does **not** make planning decisions (no more `template-matrix.md` / `image-source-matrix.md` reads at execution time). It honors what the designer set. The two overrides allowed: (a) `FULL_AI` → `HYBRID_AI` when headline fails sanitization (per `render-mode-matrix.md`), and (b) AI-requiring render modes → TEMPLATE (or HYBRID_REAL when a real source resolved) when `available_providers` is empty.

**Renderer invocation (`render_template.py`).** Stage 2 — pool mode only.

```bash
# Pool mode (Stage 2, every invocation)
uv run .claude/skills/viz-image-gen/scripts/render_template.py \
  --template-pool "linkedin-carousel" \
  --template-id   "hero-typographic" \
  --data '<slide JSON>' \
  --output "<working_dir>/images/slide-01.png"
  # brand_kit auto-loaded from <project_root>/brand_context/visual-identity/tokens.json
  # falls back to mkt-visual-identity defaults
```

The legacy `--template <family>/<page>` form is still accepted by `render_template.py` for in-flight migration; Phase 10 removes it. Phase 7 of this pipeline never emits it.

The renderer resolves the pool manifest, loads `_shared/styles.css` from the pool, supports Mustache sections (`{{#X}}…{{/X}}`, `{{^X}}…{{/X}}`, `{{.}}` for list items), and injects CSS variables for cosmetic tokens (colors, fonts) AND structural tokens (type scale, spacing, grid) from the loaded brand_kit.

If both image API keys are missing, skip and notify.

**Phase 7 logging (per-slide rationale)** — same as v1.0.1 format, appended to the per-run `pipeline-log.md`:

```
## Phase 7 — IMAGES [in progress]
- Slide N/M [role]:
    - Render mode: {HYBRID_AI | HYBRID_REAL | HYBRID_FROM_REAL | FULL_AI}
    - Template family: {family} ({front | content | cta})
    - Backend: {gpt-image-2 | gemini-3-pro-image}
    - Image source: {type — AI generated | path/to/asset}
    Started.
```

After each slide, append `Done in {N}s. Output: slide-N.png`. If a fallback fires (FULL_AI → HYBRID_AI), log it.

Sub-agent writes images directly to `{output_base}/{date}/{slug}/` and streams progress lines as it goes.

**Clean output policy (enforced by `ssc-image-generator` rule 8).** The final `{slug}/` folder MUST contain only:

```
slide-1.png … slide-N.png       # final slides only
caption.md
post.yaml
pipeline-log.md                  # ONE consolidated log for the entire run
```

After EACH slide render, `ssc-image-generator`:
1. **Consolidates** the slide's companion `.log.md` (auto-produced by `generate_image_gpt.py` / `generate_image_gemini.py`) into `pipeline-log.md` under a `## slide-{N}` section (prompt, backend, model, params, reasoning).
2. **Deletes** the companion `.log.md`.
3. **Deletes** intermediates: `_tmp-*.png`, `*-illustration.png`, `*-illustration.log.md`, and any other working artifacts left by HYBRID_AI composition.

End state: zero `*.log.md` companions, zero `*-illustration.*` artifacts. Just the slides + the consolidated pipeline-log.md.

---

## Phase 7.5: HTML PREVIEW *(orchestrator — blocking, between Phase 7 and Phase 8)*

**Purpose:** show the user how the post will actually look on LinkedIn BEFORE saving the final `post.yaml`. Catches layout/text issues at the cheapest possible moment.

**Skipped when:** `chosen_format == "text"`, or user passed `--no-preview` flag.

### HARD-WON RULE — NEVER write HTML inline for Phase 7.5

**The ONLY allowed action in Phase 7.5 is calling `preview_carousel.py` via `Bash`.**

- DO NOT use the `Write` tool to author `index.html`, `preview.html`, or any LinkedIn-mock markup yourself
- DO NOT "supplement" the script's output with extra inline HTML
- DO NOT write a custom preview because you think the script's layout is missing something — if it's missing something, **fix the script** (`preview_carousel.py`) and re-run. The script is the canonical source.
- DO NOT generate the HTML as a fallback because the script fails — surface the error to the user and stop

The script accepts a run folder and resolves: slide PNGs, caption.md, voice-profile.md, post.yaml. All variables come from those files — there is nothing the orchestrator knows that the script can't read. If you find yourself reaching for `Write` here, you're about to duplicate work that already exists; stop and call the script instead.

**Self-improvement on script gap:** if you genuinely encounter a case the script doesn't cover (e.g., the brand wants a custom platform mock that isn't LinkedIn), the correct action is to extend `preview_carousel.py` with a new flag/template, not to write inline HTML. Then the next run benefits.

### Steps

1. Call `python .claude/skills/mkt-visual-identity/scripts/preview_carousel.py {output_base}/{date}/{slug}/` — this script:
   - Reads `slide-*.png` files from the slug folder
   - Reads `caption.md` if present
   - Reads `voice-profile.md` (for author handle/avatar if available)
   - Generates `{slug}/preview/index.html` simulating a LinkedIn post: author header + carousel viewer (left/right arrows + dot indicators) + caption with hashtags + reactions row
   - Returns the absolute path to the generated HTML

2. **Relay the script's stdout to the user.** `preview_carousel.py` prints both the HTML path AND a pre-filled feedback template (the user can fill it directly in chat without opening the HTML if they want). Show this output as-is in chat, then add one sentence: *"Visual review optional in the HTML above; type 'approve' in chat to ship, or fill the template to request edits."*

   Expected output looks like:
   ```
   Preview generated: C:\...\preview\index.html
   Open with: file:///C:/.../preview/index.html

   ------------------------------------------------------------
   FEEDBACK TEMPLATE - fill in only the lines you care about, paste back in chat.
   (Skip this if you want to review visually in the HTML first.)
   ------------------------------------------------------------

   Action: edit  # or 'approve' if everything looks good
   Run folder: ...
   Slug: ...

   Per-slide feedback (leave empty to skip):
   Slide 1:
   Slide 2:
   ...

   General feedback:


   ------------------------------------------------------------
   Shortcut: just type 'approve' in chat to send the minimal approve action.
   ------------------------------------------------------------
   ```

3. **WAIT for explicit user response.** Do not call Phase 8 automatically.

4. **Handle the response:**
   - "approve" / "go" / "ok" / "save" → proceed to Phase 8
   - Specific edit ("change slide 3 title to X", "swap palette") → route back to the right phase:
     - Caption fix → re-run humanizer + regenerate preview
     - Single slide tweak → re-invoke `ssc-image-generator` for that slide only
     - Multi-slide / arc change → re-invoke `ssc-designer` then `ssc-image-generator`
     - Color/font change → adjust `inferred_palette` / `inferred_typography` and re-render
   - "redo from scratch" → ask what to change in briefing, restart from Phase 5.0

5. Log to `pipeline-log.md`:
   ```
   ## Phase 7.5 — HTML PREVIEW [done]
   - Decision: generated preview at {path}
   - User feedback: {approve | specific edit | rejected}
   - Iterations: {n} (Phase 7.5 may loop with Phase 7 if edits needed)
   - Elapsed: {s}
   ```

### Why this matters

The pre-v2.0.1 flow went Phase 7 → Phase 8 → "here's a markdown summary, want to publish?". The user had to visually parse 6 PNGs in their file explorer one by one + read the caption from caption.md to evaluate. That's error-prone. The preview puts both in one LinkedIn-shaped page so the user evaluates the post AS A POST, not as a folder of artifacts.

---

## Phase 8: SAVE AND PRESENT *(orchestrator)*

Write to `{output_base}/{date}/{slug}/`: `post.yaml` (see README for schema), `caption.md`. Sub-agent already wrote the images. The `pipeline-log.md` is already in the same folder.

Append the run summary to `pipeline-log.md` with the timing table:

```
| Phase | Action | Elapsed |
|-------|--------|---------|
| 1 | CONFIG | 1s |
| 2 | DETECT (Scenario {X}) | <1s |
| 3 | GATHER | {N}s |
| 4 | BRIEFING | {N}s |
| 5.0 | CONTENT INFERENCE | {N}s |
| 5.0.5+5.3+5.7 | DESIGNER (visual plan) | {N}s |
| 5.4 | CAROUSEL CAPTION | {N}s |
| 5.5 | HUMANIZE + PREVIEW | {N}s |
| 6 | HUMANIZER (single only) | {N}s |
| 7 | IMAGES | {N}s |
| 8 | SAVE | <1s |
| Total | | {N}s |
```

Report to the user:
```
{slug}
Platform: {platform} · Format: {format} · Source: {source}
Elapsed: {total}s

{full post text}

Saved to: {output_base}/{date}/{slug}/
Log:      {output_base}/{date}/{slug}/pipeline-log.md
```

Then offer **two follow-up actions**:

1. **Review + iterate visually** *(v2.0.1+, recommended for carousels)*:
   ```
   👀 Preview as it'll look on LinkedIn:
      python .claude/skills/viz-image-gen/preview/server.py
      → opens http://127.0.0.1:8766 in your browser, auto-detects this run
      → edit caption inline, edit slide text, re-render individual slides
   ```

2. **Publish**:
   ```
   📤 Publish via Zernio:
      /tool-publisher
   ```

For single image and text formats, skip the preview offer — it's specifically for multi-slide carousels.

Ask: "Any adjustments before publishing? When ready: `/tool-publisher {slug}`"

---

## Cross-scenario coverage map

Quick reference — which phases run per scenario, and who owns each. Used in the validation pass; also a fast lookup when debugging.

| Phase | A (img only) | B (video URL) | C (topic) | D (sources) | E (repurpose) | F (article) | G (local file) |
|---|---|---|---|---|---|---|---|
| 0 ONBOARD | first run | first run | first run | first run | first run | first run | first run |
| 1 CONFIG | orq | orq | orq | orq | orq | orq | orq |
| 2 DETECT | orq | orq | orq | orq | orq | orq | orq |
| 3 GATHER | **skip** | orq (tool-youtube + tool-video-screenshots) | orq (str-trending-research) | orq (tool-linkedin-scraper + tool-youtube digest) | orq (mkt-content-repurposing) | orq (tool-web-screenshot) | orq (tool-transcription + tool-video-screenshots) |
| 4 BRIEFING | **skip** | orq | orq | orq | **skip** | orq | orq |
| 5.0 INFERENCE | orq | orq | orq | orq | orq | orq | orq |
| 5.0.5+5.3+5.7 DESIGNER | designer | designer | designer | designer | designer | designer | designer |
| 5.4 CAROUSEL CAPTION (carousel only) | **skip** (caption already final) | orq | orq | orq | **skip** (caption already final) | orq | orq |
| 5.5 PREVIEW (carousel only) | orq (no humanizer — caption final) | orq + tool-humanizer | orq + tool-humanizer | orq + tool-humanizer | orq (no humanizer — caption final) | orq + tool-humanizer | orq + tool-humanizer |
| 6 HUMANIZER (single/text only) | **skip** | orq + tool-humanizer | orq + tool-humanizer | orq + tool-humanizer | **skip** | orq + tool-humanizer | orq + tool-humanizer |
| 7 IMAGES | image-gen | image-gen | image-gen | image-gen | image-gen | image-gen | image-gen |
| 8 SAVE | orq | orq | orq | orq | orq | orq | orq |

**Rule:** no phase has two owners. Each cell is one of: skipped, orchestrator, designer, image-generator, or a named sub-skill invoked by the orchestrator.

**Scenarios A and E share a pattern:** text is final on arrival, so all draft/humanize phases skip. They still run the full visual planning (Phase 5.0 → designer → preview → image-gen) because picking visuals without knowing what the post talks about is what produced the "AI-cliché default" failure in v1.x.
