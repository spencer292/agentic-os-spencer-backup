# Phase 0: ONBOARD (first run only)

Runs once on first invocation. Surfaces everything the user needs to know and decide before the pipeline can run hands-off. Skip entirely if `pipeline.config.yaml` has `_customized: true` AND `.claude/skills/00-longform-to-shortform/skill-pack/config/sys-config.md` exists with populated sections.

In sub-agent/automated context: skip silently, use saved config + defaults.

## Interaction Style

**Preferred (Claude Code with AskUserQuestion available):**
Batch ALL onboarding questions into a single `AskUserQuestion` call with multiple questions. This gives the user the tabbed/paginated UI where they can flick left and right between questions and answer them all at once before submitting. The flow is:

1. Show the overview (0a)
2. Show dependency status (0b) — no question needed, just inform
3. Show visual examples for any visual questions (layout, captions, illustrations, themes)
4. Ask ALL choice groups in ONE multi-question `AskUserQuestion` call (0c) — one question per tab
5. After submission, check all answers for conditional dependencies (0c-gate) and surface any missing keys/credentials in a single follow-up
6. Confirm and save (0d/0e)

**Never ask questions one at a time.** The user must see all decisions in a single paginated view so they can review, compare, and submit together.

**Fallback (Codex, sub-agents, or when AskUserQuestion is unavailable):**
Present all choices in a single structured message with clear defaults marked. Accept a single response covering all groups. If no response or in automated context, use all defaults.

Always show the default clearly and explain what each option does in one line. If brand_context/ or sys-config/ already has a value, pre-fill it and say so.

## Visual Examples for Config Questions

Visual questions (layout, caption style, theme, illustrations) must include example images or screenshots so the user can see what they're choosing — not just read about it.

### Where examples live

```
_systems/00-longform-to-shortform/assets/examples/
├── layouts/
│   ├── split-screen.png
│   ├── face-track.png
│   └── cursor-track.png
├── captions/
│   ├── highlight.png
│   ├── pop.png
│   └── typewriter.png
├── illustrations/
│   ├── flat.png
│   ├── hand-drawn.png
│   └── none.png
└── themes/
    ├── orange.png
    ├── blue.png
    └── custom.png
```

### How to use in onboarding

When presenting a visual question via `AskUserQuestion`:
1. Use the `preview` field to render an ASCII wireframe (works in all environments)
2. ALSO use `Read` to load the relevant example image and show it to the user inline before the question
3. Say: "Here's what each option looks like:" followed by the images, then ask the question

When AskUserQuestion is unavailable (fallback mode):
1. Show the example images inline using `Read`
2. List the options with descriptions

### Which questions need visual examples

| Question | Visual? | Example files needed |
|----------|---------|---------------------|
| Layout (reframe) | **Yes** | `layouts/*.png` |
| Renderer | No | — |
| Illustrations | **Yes** | `illustrations/*.png` |
| Caption style | **Yes** | `captions/*.png` |
| Theme/colors | **Yes** | `themes/*.png` |
| Logo placement | Mild | ASCII preview sufficient |
| Publishing mode | No | — |

## 0a. Explain what this does

Present to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Long-Form to Short-Form — First-run setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What this does:
  YouTube URL (or local video) → edited short-form clips → posted to socials

Pipeline: Download → Transcribe → Select best clips → Reframe to
portrait → Edit with captions & branding → Render → Post

Human-in-the-loop: NONE after setup. Fully automated.

Output:
  - Rendered clips in projects/00-longform-to-shortform/renders/{run}/
  - Pipeline log in projects/00-longform-to-shortform/runs/{run}/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 0b. Check dependencies & show status

Check each dependency at its correct deployed location and present a status table.

**Important:** This is the INITIAL dependency check. Some dependencies are conditional on user choices (e.g., Zernio API key is only needed if publishing mode is "draft" or "auto-post"). Conditional dependencies are checked AFTER the relevant question is answered (see 0c-gate below).

### Dependency check locations

| Dependency | How to check | Deployed location |
|------------|-------------|-------------------|
| ffmpeg | `command -v ffmpeg` | System PATH |
| Python 3 | `command -v python3` (or `py` on Windows) | System PATH |
| Node.js | `command -v node` | System PATH |
| Reframe Python deps (cv2, numpy, scipy) | `projects/tools/.venv/bin/python -c "import cv2, numpy, scipy"` (or `.venv/Scripts/python.exe` on Windows) | Project venv |
| uv (transcription package manager) | `command -v uv` | System PATH or `~/.local/bin` |
| yt-dlp | Check system PATH first, then `projects/tools/.venv/bin/yt-dlp` | Either system or project venv |
| WhisperX | Check `projects/tools/.venv/bin/whisperx`; falls back to lazy install via `uv run` on first Phase 3 | Project venv (or lazy via uv cache) |
| Clip extractor | Check `projects/tools/clip_extractor/` exists | Project tools dir |

**Important:** Do NOT check `tools/clip_extractor/venv/` (that's the _systems template source path). The deployed location is `projects/tools/.venv/`.

### Auto-trigger setup scripts on first run

If reframe deps OR `uv` are missing, run the matching setup script BEFORE proceeding to Phase 1. Don't ask the user — just do it and print the resulting deps table:

```bash
# Reframe deps (~100MB: opencv-python + numpy + scipy)
if ! projects/tools/.venv/bin/python -c "import cv2, numpy, scipy" 2>/dev/null \
   && ! projects/tools/.venv/Scripts/python.exe -c "import cv2, numpy, scipy" 2>/dev/null; then
  bash .claude/skills/00-longform-to-shortform/scripts/setup.sh
fi

# uv (light — WhisperX/torch download lazily on first Phase 3 call without GROQ_API_KEY)
if ! command -v uv >/dev/null 2>&1; then
  bash .claude/skills/tool-transcription/scripts/setup.sh
fi
```

Both scripts are idempotent — safe to re-run. They install into `projects/tools/.venv/` (reframe deps) and `$HOME/.local/bin` (uv binary).

### Present the table

| Dependency | Status | What it does | Install |
|------------|--------|--------------|---------|
| ffmpeg | installed/MISSING | Video processing (extract, reframe, burn subtitles) | `brew install ffmpeg` / `winget install Gyan.FFmpeg` |
| Reframe venv (cv2/numpy/scipy) | ready/MISSING | Phase 6 face detection + reframe | `bash .claude/skills/00-longform-to-shortform/scripts/setup.sh` |
| uv | installed/MISSING | Lazy Python env manager (for WhisperX) | `bash .claude/skills/tool-transcription/scripts/setup.sh` |
| WhisperX | installed/lazy | Word-level transcription for captions | Auto-downloads on first Phase 3 call without `GROQ_API_KEY` |
| yt-dlp | installed/MISSING | Downloads YouTube videos | Auto via setup.sh or `pip install yt-dlp` |
| Clip extractor | ready/MISSING | Face-tracking reframe | `projects/tools/clip_extractor/` (ships with skill) |

If anything else is missing after the auto-setup, tell the user what to install manually.

## 0c. Present choices (batched in one multi-question AskUserQuestion)

Read `.claude/skills/00-longform-to-shortform/skill-pack/config/sys-config.md` and `brand_context/assets.md` first — pre-fill anything already defined.

Show visual example images from `assets/examples/` BEFORE calling AskUserQuestion so the user has context.

Then ask ALL questions below in a **single `AskUserQuestion` call with multiple questions** — one question per tab. The user flicks between tabs, answers each, then submits all at once. Include defaults and one-line explanations for each option.

### Question 1: Visual Style (VISUAL — show examples first)

Show example images from `assets/examples/layouts/` before asking.

```
Layout — how the video is reframed for portrait:
  • split-screen — top: screen content, bottom: speaker [default]
  • face-track — always follows the speaker's face
  • cursor-track — face segments follow speaker, screen segments follow cursor

Renderer — how clips are composited and rendered:
  • hyperframes — HTML+CSS+GSAP compositions via headless Chrome (richer motion, smoother captions) [default]
  • ffmpeg — FFmpeg ASS subtitle burn + drawbox overlays (simpler, faster, no Node dependency)

Illustrations — visual diagrams overlaid at key concept moments (built with FFmpeg drawbox/drawtext, free, no API key needed):
  • on — shapes, charts, wireframes, stacked layers, crowd grids — matched to what the speaker describes
  • off — no illustrations, subtitles only [default]

If illustrations are on:

  Display mode — how illustrations appear on the video:
    • spotlight — illustration shown large and centered on a cream card with rounded
      corners and drop shadow. Video dims behind it (50% dark overlay). Holds for
      ~2-4 seconds per moment then fades out. Best for key concept reveals that
      deserve the viewer's full attention. [default]

    • float — illustration shown small (280px) in the top-right corner with no
      background. Video plays uninterrupted underneath. Subtle reinforcement that
      doesn't break the viewing flow. Good for supporting visuals.
```

#### How split-screen detection works

If you choose the `split-screen` layout, the reframe tool decides per-scene whether to compose a top/bottom split or do a single 9:16 face crop. **Face position is the primary signal**:

- **Face off to one side of the frame** (cx < 0.30 or cx > 0.70) → classified as **screen-share** → triggers split-screen: top half shows your screen content, bottom half shows a face closeup
- **Face centered** (cx between 0.35 and 0.65) → classified as **talking-head** → full 9:16 crop on your face
- **Ambiguous zone** (cx 0.30–0.35 or 0.65–0.70) → face width is used as a tiebreaker
- **Majority vote**: a clip only locks into uniform mode (all split-screen or all face-crop) when 90%+ of frames agree on the same classification. Mixed content (some talking-head, some screen-share) is handled per-scene.

If your recording setup doesn't fit these thresholds (different camera angle, side-by-side layout, unusual framing), you can ask Claude to update `skill-pack/tools/reframe/split_screen.py` to match your layout.

### Question 2: Creative (VISUAL — show examples first, skip if brand_context/assets.md has values)

Show example images from `assets/examples/captions/` before asking.

```
Caption style:
  • Font: (pre-fill from assets.md fonts if available)
  • Animation: highlight [default] / pop / typewriter / bounce
  • Position: bottom [default] / center / top
  • Active word color: (pre-fill from assets.md accent color)

Logo: include in clips? If yes, which corner?
Music: genre + energy level, or skip entirely?
```

### Question 3: Publishing

```
After rendering, what should happen?
  • skip — just save rendered files locally [default]
  • draft — upload as drafts for review before publishing
  • auto-post — publish immediately to all platforms

Which platforms? all [default] / youtube / instagram / tiktok
```

**Conditional gate:** If user chooses `draft` or `auto-post`:
1. Check `.env` for `ZERNIO_API_KEY` — if missing, tell them:
   - What Zernio does (social media posting API)
   - Where to sign up (zernio.com)
   - Where to add the key (`.env` → `ZERNIO_API_KEY=your-key`)
2. Check `pipeline.config.yaml` → `publishing.profiles.default` for account IDs
   - If all account IDs are empty, tell them they need to configure at least one platform account
   - Link to the config file location

Do NOT silently continue with publishing enabled but no API key. The user must know their clips won't actually upload.

### Performance (don't ask — use defaults)

Performance settings (parallel_reframes: 3, parallel_edits: 3, parallel_renders: 2) use sensible defaults. Only mention them if the user asks about speed or if their machine is constrained.

## 0c-gate: Conditional Dependency Checks

After the user submits ALL answers from the batched AskUserQuestion, check every answer for conditional dependencies and surface them all together in a single follow-up. If any missing credentials are found, present them as one consolidated list — not one at a time.

```
User submits all answers → check each answer for unmet requirements → present all missing items together
```

### Conditional dependency map

| User choice | Requires | How to check | What to tell them |
|-------------|----------|-------------|-------------------|
| Renderer: `hyperframes` | `hyperframes` npm package + Node 22+ | `command -v npx && npx hyperframes --version` | How to install (`npm install -g hyperframes`) or switch to `ffmpeg` renderer |
| Publishing: `draft` or `auto-post` | `ZERNIO_API_KEY` in `.env` | `grep ZERNIO_API_KEY .env` | Where to sign up, where to add key |
| Publishing: `draft` or `auto-post` | Platform account IDs configured | Check `publishing.profiles.default` in config | Which fields to fill in the config |
| Publishing: specific platform | That platform's account ID | Check the specific field | Which field is empty |

Transcription is resolved automatically: Groq is used when `GROQ_API_KEY` is present in `.env`, otherwise local WhisperX. No onboarding question is asked for transcription provider.

**Rule:** Never let the user finish onboarding with a configuration that will silently fail at runtime. If they chose a mode that needs credentials, confirm the credentials exist or clearly warn them.

## 0d. Show where config lives

After all questions are answered, show:

```
Your choices are saved in two places:

  Pipeline config (technical settings):
    .claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml

  Creative preferences (style, captions, branding):
    .claude/skills/00-longform-to-shortform/skill-pack/config/sys-config.md

Edit these files anytime to change defaults for future runs.
All options are documented with inline comments.
```

## 0e. Install & save

1. Install any missing dependencies (ffmpeg error if not present, others auto-install)
2. Save technical choices to `pipeline.config.yaml`, set `_customized: true`
3. Save creative choices to `.claude/skills/00-longform-to-shortform/skill-pack/config/sys-config.md`
4. Log what was installed and configured
