# Config Conventions

## First-Run Onboarding

Every system with meaningful user-facing choices gets an **Onboarding Phase** that runs once on first invocation. This is the most interactive part of the system — afterwards, execution is fully hands-off.

### When to include onboarding

Include onboarding if the system has any of:
- External dependencies with provider choices (cloud vs local, fast vs accurate)
- Visual style choices (theme, layout, format)
- Quality/performance tradeoffs (model size, parallelism)
- Output targeting (platforms, accounts, publish mode)
- Behavioral preferences (density, clip count, duration)

Skip onboarding if the system is purely mechanical with no user-facing knobs.

### API and dependency discovery (during system creation)

Before writing the onboarding phase, the system creator MUST build a complete dependency map by:

1. **Reading every skill's SKILL.md** in the system's skill list — check `allowed-tools`, `dependencies`, and any MCP references
2. **Scanning all reference files** for API endpoint URLs, SDK imports, `*_API_KEY` patterns, and external service mentions
3. **Tracing the full pipeline flow** — if Phase 9 posts to social media, the posting skill needs an API key. That key must appear in the onboarding.
4. **Mapping choice → dependency** — for every user choice that enables a feature requiring credentials, document the conditional dependency

The result is a **dependency manifest** that feeds directly into the onboarding:

| Dependency | Required by | Always needed? | Conditional on |
|------------|------------|----------------|----------------|
| ffmpeg | Phases 2,6,8 | Yes | — |
| GROQ_API_KEY | Phase 3 | No | `transcription.provider = groq or auto` |
| ZERNIO_API_KEY | Phase 9 | No | `publishing.mode = draft or auto-post` |
| Platform account IDs | Phase 9 | No | `publishing.mode = draft or auto-post` |

This table goes into the onboarding reference file as the **Conditional dependency map**.

**Rule:** If the system creator misses a dependency, the user will hit a silent failure at runtime. Treat dependency discovery as a blocking step — do not write the onboarding until the map is complete.

### Visual example collection (during system creation)

After identifying all config questions, ask the user which visual options they want to provide example screenshots for. The flow:

1. List all visual config questions identified during spec
2. Ask: "Do you have example screenshots for these options, or should we generate them from a test run first?"
3. If screenshots exist: collect them into `skills/{entry-skill}/skill-pack/assets/examples/{concern}/`
4. If not: note which examples are needed, proceed with ASCII-only previews, and remind the user to add screenshots after their first successful run
5. Store a checklist of missing examples in `skills/{entry-skill}/skill-pack/assets/examples/README.md`

### What the onboarding phase must cover (in order)

1. **What this does** — 2-3 sentences explaining input → output in plain English
2. **Human-in-the-loop steps** — explicitly list any points where the pipeline pauses for user input or review (or state "fully automated, no pauses" if none)
3. **Dependencies & providers** — show every external tool/service the pipeline needs:
   - Current status (installed/missing, API key present/absent)
   - Available options with tradeoffs (speed, cost, accuracy)
   - Defaults and fallbacks
   - Install commands for anything missing
4. **Choices** — present every decision the user needs to make in a **single batched `AskUserQuestion` call with multiple questions** (one question per tab in the paginated UI):
   - Batch ALL decision groups into one multi-question `AskUserQuestion` — never ask one at a time
   - The user flicks between tabs, answers each, then submits all at once
   - Show the default value clearly marked `[default]`
   - Show all alternatives with one-line descriptions
   - Pre-fill from `brand_context/` where possible (tell the user what was inherited)
   - Show visual examples BEFORE the AskUserQuestion call so the user has context
5. **Where config lives** — show the exact paths to config:
   - Technical/pipeline config: `.claude/skills/{entry-skill}/skill-pack/config/pipeline.config.yaml`
   - Operational prefs: `.claude/skills/{entry-skill}/skill-pack/config/sys-config.md`
   - Explain: "Edit these files anytime to change defaults for future runs"
6. **Install missing dependencies** — run all installs after the user confirms choices
7. **Save & confirm** — write all choices to config, set `_customized: true`, summarise what was set

### Interactive questioning pattern

Batch ALL onboarding questions into a **single `AskUserQuestion` call with multiple questions**. This gives the user the tabbed/paginated UI where they can flick left and right between questions and answer them all at once before submitting.

**Never ask questions one at a time.** All decision groups go into one multi-question call — one question per tab:

```
Tab 1: Transcription provider + model
Tab 2: Clip selection (platform, count, quality)
Tab 3: Visual style (layout, format, illustrations)
Tab 4: Creative (captions, colors, logo, music) — skip if brand_context has values
Tab 5: Publishing (mode, platforms)
```

Show any visual examples (layout screenshots, caption style previews) BEFORE the AskUserQuestion call so the user has context when answering.

After the user submits all answers, check every answer for conditional dependencies (missing API keys, credentials) and surface them all together in a single consolidated follow-up — not one at a time.

Performance settings (parallelism, batch sizes) use sensible defaults and are never asked about unless the user brings them up.

**Fallback (Codex, sub-agents, or when AskUserQuestion is unavailable):**
Present all choices in a single structured message with clear defaults marked. Accept a single response covering all groups. If no response or in automated context, use all defaults.

### Visual examples for config questions

Any question where the user is choosing between visual options (layouts, styles, themes, caption animations, illustration types) must include example images so the user can see what they're picking.

**Asset convention:**

```
skills/{entry-skill}/skill-pack/assets/examples/
├── {concern}/
│   ├── option-a.png
│   ├── option-b.png
│   └── option-c.png
└── ...
```

These are shipped with the system package and deployed during install.

**During onboarding:**
1. Before asking a visual question, use `Read` to show the relevant example images inline
2. Also include ASCII wireframe previews in the `AskUserQuestion` `preview` field (works in all environments)
3. Images are the primary reference; ASCII is the fallback

**Which questions need visual examples:**

| Question type | Visual? | Example |
|---------------|---------|---------|
| Provider/engine choice | No | Groq vs WhisperX |
| Numeric thresholds | No | Max clips, min score |
| Layout/framing | **Yes** | Split-screen vs face-track |
| Caption style | **Yes** | Highlight vs pop vs typewriter |
| Theme/color | **Yes** | Orange vs blue vs custom |
| Illustration style | **Yes** | Flat vs hand-drawn vs none |
| Logo placement | Mild | ASCII wireframe is enough |
| Publishing mode | No | Skip vs draft vs auto |

**Rule:** When creating a new system, identify all visual config questions during the spec phase. Create or capture example images for each option BEFORE writing the onboarding flow. Store them in `skills/{entry-skill}/skill-pack/assets/examples/`.

### Conditional dependency gating

After the user submits ALL answers from the batched multi-question AskUserQuestion, check every answer for conditional dependencies and surface them all together in a single consolidated follow-up. Never drip-feed missing requirements one at a time.

**Pattern:**

```
User submits all answers from batched AskUserQuestion
  → Check each answer for unmet requirements
  → Collect all missing items into one list
  → Present them together:
       1. What's needed and why
       2. Where to get it (signup URL, install command)
       3. Where to put it (.env key name, config field)
```

**Common conditional dependencies:**

| User choice | Creates requirement for |
|-------------|------------------------|
| Cloud provider (API-based) | API key in `.env` |
| Publishing to platforms | Posting service API key + account IDs |
| Specific platform selection | That platform's account ID configured |
| External storage/CDN | Access credentials |
| Notifications/webhooks | Endpoint URLs |

**Rule:** Never let the user finish onboarding with a configuration that will silently fail at runtime. If they chose a mode that needs credentials, confirm the credentials exist or clearly warn them before saving config.

**Implementation in the onboarding phase reference file:**

Document a "Conditional dependency map" table listing every choice → requirement pair:

```markdown
### Conditional dependency map

| User choice | Requires | How to check | What to tell them |
|-------------|----------|-------------|-------------------|
| Provider: `cloud-x` | `CLOUD_X_API_KEY` | grep in .env | signup URL + .env location |
| Publishing: `draft`/`auto` | `POSTING_API_KEY` | grep in .env | signup URL + .env location |
| Publishing: `draft`/`auto` | Account IDs | check config fields | which fields to fill |
```

### Python Version Constraints

If any dependency has a Python version ceiling (e.g., mediapipe <=3.13):
1. `setup.sh` searches for compatible versions in priority order (3.12 first)
2. Rejects incompatible versions with clear error + install instructions
3. Prints resolved version for user verification
4. Adds post-install verification that imports all key packages

### Dependency check paths

When checking if tools are installed, use the DEPLOYED location — not the `_systems/` template source:

| Tool type | Deployed location | NOT this (template source) |
|-----------|-------------------|---------------------------|
| Python tools (venv) | `.claude/skills/{entry-skill}/skill-pack/tools/.venv/bin/` | `_systems/{name}/skills/{entry-skill}/skill-pack/tools/` |
| Python packages | `.claude/skills/{entry-skill}/skill-pack/tools/` | package source |
| Node modules | `node_modules/` at project root | package source |
| System binaries | System PATH (`command -v`) | — |
| API keys | `.env` at project root | `skills/{entry-skill}/skill-pack/templates/.env.example` |

### Subsequent runs

After onboarding completes (`_customized: true` and `skill-pack/config/sys-config.md` exists):
- Skip the entire onboarding phase silently
- Read config and proceed directly to execution
- In sub-agent/automated context: always skip silently, use saved config

### Config file format

Config files live in `skills/{entry-skill}/skill-pack/config/` and always start with a `_customized` flag:

```yaml
# {System Name} Configuration
# Edit this file anytime to change pipeline behavior.
# All options are documented inline below.

_customized: false    # Set to true after first-run onboarding

# ---
# Provider & Dependencies
# ---

transcription:
  provider: "auto"              # How speech is converted to text
                                #   "auto"   = use Groq if API key exists, else local [default]
                                #   "groq"   = cloud API (~22s for 60min, $0.04/hr, needs GROQ_API_KEY)
                                #   "local"  = WhisperX on your machine (15-30min on CPU, free)

  whisper_model: "small"        # Local WhisperX model size (ignored when using Groq)
                                #   "tiny"     = fastest, least accurate (~1GB RAM)
                                #   "small"    = good balance (~2GB RAM) [default]
                                #   "large-v3" = best accuracy, slowest (~10GB RAM)

# ---
# Output Format
# ---

format: "9x16"                  # Aspect ratio for output clips
                                #   "9x16" = vertical/portrait (Reels, Shorts, TikTok) [default]
                                #   "1x1"  = square (Instagram feed, LinkedIn)
                                #   "16x9" = landscape (YouTube, Twitter)

# ... etc
```

### Config file requirements

The config file IS the documentation. A user who opens it cold must understand every option:

- **Every setting gets a plain-English description** — what it does and why you'd change it
- **Fixed-choice settings list ALL options with descriptions** (see example above)
- **Mark defaults clearly** with `[default]` tag
- **Boolean settings explain both states**
- **Numeric settings explain the tradeoff** (higher = slower but better, etc.)
- **Group settings into logical sections** with `# ---` header comments
- **Visual/aesthetic settings link to previews** — reference playbook/examples folder
- **Include `[recommended]` tags** where relevant (may differ from default)

## System Config (`skill-pack/config/sys-config.md`)

Every `sys-*` skill system with operational preferences stores them in `skills/{entry-skill}/skill-pack/config/sys-config.md`, co-located with the entry skill.

### Three types of shared context

| What | Where | Examples |
|------|-------|---------|
| **Brand identity** — who you are | `brand_context/` | Voice, ICP, positioning, samples, visual refs |
| **System config** — how the pipeline behaves | `skill-pack/config/sys-config.md` | Default platform, image ratios, format thresholds, cadence |

### Naming convention

The config file is always `sys-config.md` inside the entry skill's `skill-pack/config/` directory:
- `00-social-content` → `.claude/skills/00-social-content/skill-pack/config/sys-config.md`
- `00-longform-to-shortform` → `.claude/skills/00-longform-to-shortform/skill-pack/config/sys-config.md`

### What goes where

| Setting | Location | Why |
|---------|----------|-----|
| Default platform, image ratios, provider | `skill-pack/config/sys-config.md` | Operational — controls routing |
| Carousel threshold, cadence, clip count | `skill-pack/config/sys-config.md` | Operational — controls output |
| Caption style, fonts, color palette | `skill-pack/config/sys-config.md` | System-specific creative prefs |
| Voice, tone, vocabulary, ICP | `brand_context/` | Identity — shared across all systems |

### Brand context inheritance

Before creating or populating a system config, **always read `brand_context/` first** and inherit anything already defined. Check:
- `brand_context/voice-profile.md` → Tone, vocabulary
- `brand_context/assets.md` → Colors, logo, fonts
- `brand_context/icp.md` → Audience targeting
- `brand_context/positioning.md` → Content angle

**Rules:**
- If `assets.md` has brand colors → pre-fill in sys-config, don't ask
- If a value exists in `brand_context/` but needs a system-specific override → note inherited value and ask
- Only ask about genuinely system-specific settings with no equivalent in `brand_context/`

### Installer responsibility

The system installer copies the entire `skill-pack/` directory as part of the skill folder. Config files inside `skill-pack/config/` are preserved on reinstall (skip existing unless `--force`).

### Skill references

Skills reference sys-config using: `skill-pack/config/sys-config.md` → `## Section` → field.

## Creative Preferences

Systems producing branded visual or audio content store creative preferences in `skill-pack/config/sys-config.md` alongside operational settings. Brand identity (voice, ICP, positioning, colors) lives in `brand_context/` and is inherited.

### First-run interview pattern for creative prefs

1. Check if `skill-pack/config/sys-config.md` has populated creative sections
2. If not: ask 3-5 focused questions covering key creative decisions (batched into a single multi-question AskUserQuestion call)
3. Pre-fill from `brand_context/assets.md` where possible (colors, fonts, logo)
4. Save answers to `skill-pack/config/sys-config.md`
5. Subsequent runs read directly, skip the interview
6. In sub-agent/automated context: skip silently, use defaults

### Why skill-pack/config (not brand_context)

Creative prefs like caption animation, illustration style, and music are system-specific — they don't apply across all skills. Brand identity (voice, colors, fonts) stays in `brand_context/` and is inherited into system config during onboarding.
