---
name: vid-clip-selection
version: 1.0.0
description: "Analyze long-form video transcripts to identify, score, and extract the best short-form clips. Uses 5-category scoring framework. Use for 'select clips', 'find best clips', 'clip selection', 'extract shorts from transcript', 'analyze transcript for clips', 'which clips should I extract'."
argument-hint: [transcript_file_path]
allowed-tools:
  - Bash(python:*)
  - Bash(ffmpeg:*)
  - Read
  - Write
metadata:
  category: video-production
  version: 1.0
  phase: 3
---

# Clip Selection Engine

Transcript-based clip selection: parse word-level transcripts, identify the best short-form moments, score them with a 5-category framework, resolve to exact timestamps, and hand off to batch reframe + `/edit`.

**Python package:** `.claude/skills/00-longform-to-shortform/skill-pack/tools/clip_extractor/selection/`
**Config:** `.claude/skills/00-longform-to-shortform/skill-pack/tools/clip_extractor/config.yaml` → `selection:` section
**Frameworks:** `.claude/skills/vid-clip-selection/references/`

## Prerequisites

```bash
pip install -r .claude/skills/00-longform-to-shortform/skill-pack/tools/clip_extractor/requirements.txt
```

Requires: `rapidfuzz>=3.0.0` (fuzzy matching)

## 8-Phase Workflow

### Phase 0: CONTEXT
1. Read this skill file
2. Read `references/selection-framework.md` and `references/scoring-framework.md`
3. Confirm parameters with user (skip if called from pipeline with all parameters provided):
   - Transcript file path (.srt or .json)
   - Source video file path (for reframe step)
   - Desired clip count (default: 7)
   - Duration range (default: 45-90s)
   - Any focus areas or topics to prioritize

**Pipeline mode:** When invoked by `00-longform-to-shortform` or any automated orchestrator, all parameters are provided programmatically. Skip user confirmation and proceed directly.

### Phase 1: PARSE
Run the parser to get formatted transcript:
```bash
PYTHONPATH=".claude/skills/00-longform-to-shortform/tools" python -m clip_extractor select parse --transcript "PATH_TO_SRT"
```
This outputs sentence-grouped text with timestamps like:
```
[00:00:00 - 00:00:06] This is Zach. This is one of our partners...
```

### Phase 2: SELECT
Apply the **selection-framework.md** to the formatted transcript.

YOU (Claude) are the LLM. Analyze the transcript and identify the best moments:
- Read the full formatted transcript from Phase 1
- Apply the selection criteria from `references/selection-framework.md`
- For each selected clip, provide:
  - `id`: sequential number
  - `title`: 6-8 word kebab-case title
  - `srt_start_words`: **5-8 verbatim words** from where the clip should start
  - `srt_end_words`: **5-8 verbatim words** from where the clip should end
  - `time_start_estimate`: estimated start time in seconds
  - `time_end_estimate`: estimated end time in seconds
  - `hook_summary`: what makes this moment compelling
  - `category`: educational | tactical | inspirational | personal_story | entertaining
  - `best_platform`: tiktok | instagram | youtube — based on clip duration (see selection-framework.md)

**CRITICAL:** Anchor words must be **EXACT verbatim quotes** from the transcript (5-8 words). These get fuzzy-matched to SRT timestamps. More words = more reliable matching.

**Platform duration awareness:** When `target_platform` is set in pipeline config, adjust duration targets per `references/selection-framework.md` Platform Duration Targeting section before selecting clips.

### Phase 3: SCORE
Apply the **scoring-framework.md** to each selection.

For each clip, score across 5 categories (0-20 each, max 100):
- **Hook Strength** (0-20): First 3 seconds grab attention?
- **Value Delivery** (0-20): Teaches something actionable?
- **Clarity** (0-20): Single clear message, no confusion?
- **Shareability** (0-20): Would someone share/save this?
- **Completeness** (0-20): Starts and ends naturally?

Also provide:
- `total_score`: sum of all 5 categories
- `rank`: position by score (ties broken by hook_strength)
- `caption`: social media caption (hook + value + CTA, <150 words)
- `best_improvement`: what would make this clip score higher

### Phase 3.5: VIRAL SCORE
Apply the **viral-scoring-framework.md** to each selection.

For each clip, score across 6 viral categories (0-100):
- **1.3s Hook Type Match** (0-20): Does the opening match a proven hook type?
- **Hook Success Cascade** (0-20): Visual grab → value prop → curiosity gap?
- **Retention Curve Shape** (0-20): Will this achieve 70%+ completion?
- **Loop & Replay Potential** (0-20): Does the ending trigger replay?
- **Platform Duration Fit** (0-10): Does duration hit platform sweet spots?
- **Share/Send Trigger** (0-10): Is this "send to a friend" content?

Also provide:
- `hook_type`: classified hook type (curiosity | controversy | story | result | fomo | self_id)
- `viral_total`: sum of all 6 categories
- `combined_score`: `(total_score * 0.6) + (viral_total * 0.4)`

**Platform Algorithm Data:** Read `.claude/skills/viral-short-form-video-master/references/` for current platform specs.

### Phase 4: RESOLVE
Save selections + scores to a JSON file, then run resolver:
```bash
PYTHONPATH=".claude/skills/00-longform-to-shortform/tools" python -m clip_extractor select resolve \
  --transcript "PATH_TO_SRT" \
  --selections "PATH_TO_SELECTIONS_JSON" \
  --output "OUTPUT_DIR" \
  --source-title "Video Title"
```

The selections JSON format:
```json
{
  "selections": [
    {
      "id": 1,
      "title": "from-zero-to-90k",
      "srt_start_words": "This is Zach This is one of",
      "srt_end_words": "Zach wasn't good at very",
      "time_start_estimate": 0.0,
      "time_end_estimate": 75.0,
      "category": "personal_story"
    }
  ],
  "scores": [
    {
      "id": 1,
      "rank": 1,
      "title": "from-zero-to-90k",
      "hook_strength": 18,
      "value_delivery": 17,
      "clarity": 19,
      "shareability": 18,
      "completeness": 18,
      "total_score": 90,
      "viral_scores": {
        "hook_type": "story",
        "hook_type_score": 18,
        "hook_cascade_score": 16,
        "retention_curve_score": 17,
        "loop_potential_score": 12,
        "platform_duration_fit": 8,
        "share_trigger_score": 7
      },
      "viral_total": 78,
      "combined_score": 85.2,
      "category": "personal_story",
      "caption": "He made $90K in 90 days..."
    }
  ]
}
```

Outputs:
- `clip_definitions.json` — compatible with `batch` command
- `clips-metadata.json` — tracking format
- `selection-report.md` — human-readable report

### Phase 5: REVIEW
Present the **selection report** to the user for approval:
- Show each clip with score, timestamps, category, and transcript preview
- Flag any warnings (low confidence anchors, duration issues, overlaps)
- Ask user to approve, modify, or re-select

**Pipeline mode:** When invoked by `00-longform-to-shortform` or any automated orchestrator, skip this phase entirely. The orchestrator's Phase 5 (AUTO-APPROVE) handles filtering automatically.

**Standalone mode:** NEVER proceed to reframe without user approval.

### Phase 6: REFRAME
After approval, run batch reframe on the source video:
```bash
PYTHONPATH=".claude/skills/00-longform-to-shortform/tools" python -m clip_extractor batch \
  --video "SOURCE_VIDEO.mp4" \
  --clips "OUTPUT_DIR/clip_definitions.json" \
  --output "OUTPUT_DIR/reframed"
```

This extracts each clip and applies face-tracking 9:16 reframe.

### Phase 7: HANDOFF
Each reframed clip is ready for the editing pipeline:
1. Invoke `/vid-edit` for each clip
2. The vid-editing-router will detect these as **short-form pipeline clips** (source: long-form extract)
3. Route to `vid-short-form-editing` skill with pipeline clip sub-type
4. CTA: "WATCH THE FULL VIDEO" + source video title

## Config Reference

```yaml
selection:
  clip_count: 7          # Target clips
  min_duration: 45       # Seconds
  max_duration: 90       # Seconds
  padding: 1.0           # Breathing room at boundaries
  target_platform: "all" # "all" | "youtube" | "tiktok" | "instagram" — adjusts duration targets
  anchor:
    search_window_sec: 15.0  # ±seconds search range
    min_confidence: 0.5      # Warn below this
    fuzzy_threshold: 75      # rapidfuzz min score
  scoring:
    min_total_score: 50      # Flag clips below this
```

## Anti-Patterns
- **NEVER** use 1-2 word anchors — too ambiguous, use 5-8 words
- **NEVER** skip the resolve step — always validate timestamps against SRT
- **NEVER** proceed to reframe without user reviewing the selection report (unless in pipeline mode)
- **NEVER** guess timestamps — always anchor to verbatim transcript words
- **NEVER** select clips that start mid-sentence or end mid-thought
