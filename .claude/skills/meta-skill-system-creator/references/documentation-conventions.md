# Documentation Conventions

## Docs Split

Every entry skill has TWO documentation files:

**`SKILL.md` (~150 lines) — agent-facing orchestrator:**
- YAML frontmatter
- One-paragraph description
- Sub-agent dispatch table (what to call, what to pass, what comes back)
- Why Sub-Agents rationale
- Phase summary table with references
- Error handling summary
- Output summary

**`README.md` — user-facing documentation:**
- `## About` — 2-4 sentences explaining what the system does end-to-end
- `## Key Features` — 6-8 concrete capabilities
- `## Use Cases` — 3-5 real-world scenarios
- `## Pipeline Flow` — ASCII diagram showing full input-to-output flow
- `## Output Structure` — folder tree with plain-English annotations

The SKILL.md 200-line guideline is for agent instructions. User-facing docs have no line limit but should stay scannable.

## Pipeline Flow Diagram (in README.md)

Every `sys-*` entry skill MUST include a `## Pipeline Flow` section with an ASCII diagram showing the full input-to-output flow. Place it after the description, before `## Input`.

The diagram must show:
- Input format at the top
- Every numbered phase as a box with its name and a plain-English description explaining why that step exists
- Parallel phases shown as branching paths
- Output format at the bottom, described in plain English (not file paths)

**Rules:**
- Include an `## Approximate Timings` section after the Pipeline Flow diagram (populated after first run — see Pipeline Timing below)
- Use box-drawing characters for clean rendering
- Each phase box must explain **why** that step exists in plain English — not just what it does
- Annotate every phase with `IN:` and `OUT:` to the right of the box showing exact file names and paths
- Show parallelism with branching connectors
- INPUT and OUTPUT are full-width boxes at top and bottom
- Add a footer noting the path root (`projects/{skill-name}/`) and the `{run}` format

Example (abbreviated):

```
┌──────────────────────────────────────────────┐
│  INPUT: YouTube URL or local .mp4 file        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  2. DOWNLOAD                                 │  IN:  YouTube URL or local path
│  Downloads the source video and saves it as  │  OUT: runs/{run}/source.mp4
│  a local file because every later phase      │
│  needs to read from a file on disk           │
└──────────────────────┬───────────────────────┘
                       │
                   ... phases ...
                       │
┌──────────────────────▼───────────────────────┐
│  OUTPUT                                       │
│  Finished clips in renders/{run}/             │
└──────────────────────────────────────────────┘

All paths relative to projects/{skill-name}/
{run} = YYYY-MM-DD-{sanitized-title}
```

## Output Structure (required in README.md)

After the pipeline diagram, include an `## Output Structure` section showing the folder tree with plain-English annotations:

```
projects/{skill-name}/
├── renders/YYYY-MM-DD-title/       <- The finished videos, ready to upload
│   ├── clip-1.mp4                      Fully edited with captions and branding
│   └── clip-2.mp4
│
├── runs/YYYY-MM-DD-title/          <- Working data from the pipeline run
│   ├── source.mp4                      The original downloaded video
│   ├── transcript.srt                  Word-level transcript for captions
│   └── pipeline-log.md                 Timestamped record of every phase
│
├── audio/                          <- Shared sound effects and music
└── logos/                          <- Brand logos for visual overlays
```

Every file and folder gets a one-line plain-English description. The user should understand what everything is without reading the code.

## Static Asset Path Documentation

Systems using frameworks with static file resolution (Remotion `staticFile()`, Next.js `public/`, etc.) MUST include a `references/static-file-conventions.md` documenting:
1. Resolution root directory
2. Every asset category with exact path (including whether subdirectories exist)
3. File naming conventions (zero-padding, kebab-case)
4. Setup steps to place files at correct paths

This file MUST be referenced in sub-agent instructions.

## Pipeline Timing (required for all `sys-*` systems)

Every multi-phase system must track and report phase durations. This gives the user visibility into what happened, how long each step took, and what was produced.

### Per-phase timing

Every phase records wall-clock bookends and appends to `{run_dir}/phase-timings.txt`:

```bash
PHASE_START=$(date +%s)

# ... phase work ...

PHASE_END=$(date +%s)
echo "Phase N {NAME} ({provider_or_note}): $((PHASE_END - PHASE_START))s" >> "$RUN_DIR/phase-timings.txt"
```

### Pipeline log

Create `{run_dir}/pipeline-log.md` at the start of each run. Append timestamped entries as each phase completes, including:
- Phase name and duration
- Key outputs produced (file paths)
- Provider/mode used (e.g. "local WhisperX" vs "Groq API")
- Errors or skipped steps

### Timing summary table

After the final phase, write a formatted summary table to `pipeline-log.md`:

```markdown
## Timing Summary

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 2 DOWNLOAD | 0:12 | yt-dlp |
| Phase 3 TRANSCRIBE | 1:28 | local, small model |
| Phase 6 REFRAME | 0:45 | 3 clips, parallel |
| **Total** | **4:32** | |
```

### End-of-run output summary

Print a human-readable summary to the user after every run:

```
Pipeline Complete
-----------------
Source: {title}
Outputs: N files in {output_dir}
Total time: M:SS

Phase Breakdown:
  1. {Phase Name} — M:SS ({notes})
  2. {Phase Name} — M:SS ({notes})
  ...

Log: {run_dir}/pipeline-log.md
```

### First-run README timing update

After the first successful run completes, the orchestrator must update the entry skill's `README.md` with an `## Approximate Timings` section. This gives users realistic expectations before they run the system.

**When:** After the first run that produces a complete `phase-timings.txt` (all phases succeeded).

**Where:** Insert after the `## Pipeline Flow` section in README.md (or after `## Output Structure` if Pipeline Flow is absent).

**Format:**

```markdown
## Approximate Timings

Measured on first run with a {duration} source video on {hardware description}.

| Phase | Duration | Notes |
|-------|----------|-------|
| Download | ~12s | yt-dlp |
| Transcribe | ~1m 28s | WhisperX small, CPU |
| Select | ~3s | 5 candidates |
| Reframe | ~45s | 3 clips, parallel |
| Edit | ~2m 10s | 3 compositions |
| Render | ~3m 45s | 1080p |
| **Total** | **~8m 23s** | |

_Timings vary with video length, hardware, model size, and provider. Cloud transcription (Groq) reduces Phase 3 to ~22s. GPU acceleration reduces transcription and rendering significantly._
```

**Rules:**
- Use `~` prefix on all durations — these are approximations, not guarantees
- Include the source video duration and hardware context (CPU/GPU, macOS/Linux)
- Note which provider/model was used for variable phases (transcription, rendering)
- Add a footnote explaining what affects timing (video length, hardware, provider choice)
- Only write this section once — do not overwrite on subsequent runs
- If the section already exists in README.md, skip the update

## Entry Skill Onboarding Guide

Every entry skill must include a `references/onboarding.md` file — a non-technical walkthrough for first-time users.

**Required sections:**
- `## What This Does` — 2-3 sentences, plain English
- `## Inputs` — what you provide, required vs optional, examples
- `## Outputs` — what the system produces, where to find it, what format
- `## How It Works (Phases)` — high-level walkthrough, no code, no file paths
- `## Checkpoints` — where the system pauses for input
- `## Setup Checklist` — API keys, config, prerequisites

The installer copies this file with the skill. The entry skill's SKILL.md references it during first-run.
