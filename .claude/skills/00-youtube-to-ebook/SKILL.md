---
name: 00-youtube-to-ebook
version: 1.1.0
description: >
  End-to-end pipeline: YouTube URL to fact-checked long-form editorial PDF. Fetches transcript,
  transforms it into a magazine-style article, fact-checks all claims, pauses for human review,
  humanizes the writing, and renders a clean PDF. Use when: "turn this video into an ebook",
  "youtube to article", "video to PDF", "make an ebook from this video", "youtube to ebook",
  "convert video to long-form", "article from youtube". Do NOT trigger for short-form content,
  social posts, or video editing tasks.
argument-hint: [youtube_url]
---

# YouTube to Ebook

Transforms a YouTube video into a fact-checked, humanized, long-form editorial PDF with embedded screenshots. Seven phases, one human checkpoint.

## Outcome

A polished PDF article in `{projects_base}/00-youtube-to-ebook/{YYYY-MM-DD}/{ebook-slug}/` plus the markdown draft and fact-check report in `{projects_base}/00-youtube-to-ebook/{YYYY-MM-DD}/logs/`.

Output convention:

```
{projects_base}/00-youtube-to-ebook/
  {YYYY-MM-DD}/
    logs/                  ← transcript.txt, draft-article.md, fact-check-report.md, pipeline-log.md, screenshots/
    {ebook-slug}/          ← {ebook-slug}.pdf (final)
```

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `.claude/skills/00-youtube-to-ebook/skill-pack/config/sys-config.md` | full (Paths + settings) | Resolve `decoupled_base`, `brand_context`, `env_file`, `projects_base`; load PDF/header/behaviour preferences |
| `{brand_context}/voice-profile.md` | tone only | Passed to article writer and humanizer |
| `{brand_context}/visual-identity/tokens.json` | full (branded mode) | PDF typography, colours, spacing |
| `{brand_context}/assets.md` | logo + links only | Logo URL and business links for PDF header |
| `{decoupled_base}/context/learnings.md` | `## 00-youtube-to-ebook` | Past pipeline feedback |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-youtube` | Required | YouTube transcript fetching | No fallback — transcript is the input |
| `tool-video-screenshots` | Optional | Key frame extraction from video | Article renders without images |
| `mkt-longform-article` | Required | Transcript to editorial article | No fallback |
| `tool-fact-checker` | Required | Claim verification | No fallback |
| `tool-humanizer` | Required | AI pattern removal | Falls back to skipping humanization |
| `tool-pdf-generator` | Required | Markdown to PDF rendering | No fallback |

## Step 1: Setup Run Directory

First, read `.claude/skills/00-youtube-to-ebook/skill-pack/config/sys-config.md` and extract the `## Paths` section to resolve `decoupled_base`, `env_file`, `brand_context`, `projects_base`.

Then create the run directories for this pipeline execution:

```
DATE       = {YYYY-MM-DD}
SLUG       = {sanitized-video-title}
LOG_DIR    = {projects_base}/00-youtube-to-ebook/{DATE}/logs/
OUTPUT_DIR = {projects_base}/00-youtube-to-ebook/{DATE}/{SLUG}/
```

Create both directories. Start `pipeline-log.md` in `LOG_DIR`:

```markdown
# Pipeline Log: {video title}
Source: {youtube_url}
Started: {timestamp}
```

## Step 2: Fetch Transcript

Invoke `tool-youtube` to extract the transcript from the YouTube URL.

- Pass the URL directly
- Save transcript to `{LOG_DIR}/transcript.txt`
- Log phase timing to `pipeline-log.md`

**If no transcript is available:** Inform the user: "This video has no captions available. The pipeline can't proceed without a transcript." Stop the pipeline.

## Step 3: Write Article (text-first, no images yet)

Invoke `mkt-longform-article` in pipeline mode:

- Pass the transcript content
- Pass `{brand_context}/voice-profile.md` if it exists
- Do NOT pass any screenshots at this stage — write the article from text alone
- Receive markdown article back
- Save to `{LOG_DIR}/draft-article.md`
- Log phase timing

Read `references/pipeline-phases.md` for detailed phase configuration.

## Step 3.5: Extract & Embed Screenshots (Optional)

If `tool-video-screenshots` is installed, use the article to drive image selection:

1. **Identify visual moments** — Scan the draft article for 4-8 passages that describe something visual: a UI, diagram, architecture, workflow, demo, or on-screen content. For each, note the passage text and find the closest transcript timestamp.

2. **Extract frames at those timestamps** — Run in timestamp mode:
   ```bash
   python3 .claude/skills/tool-video-screenshots/scripts/extract_frames.py \
     "{youtube_url}" --timestamps "{comma_separated_timestamps}" --output-dir "{LOG_DIR}/screenshots"
   ```

3. **Verify each frame** — View each extracted frame. If a frame is a talking head or doesn't show the visual content the passage describes, drop it. Don't force a bad image — it's better to have 4 great images than 8 mediocre ones.

4. **Write contextual captions** — Each caption should connect the image to the article passage it illustrates, not just describe the frame generically.

5. **Embed in the article** — Insert `![caption](absolute_path)` directly after the passage each image illustrates. Save the updated article back to `{LOG_DIR}/draft-article.md`.

6. **Save manifest** — Write `{LOG_DIR}/screenshots/manifest.json` with absolute paths:
   ```json
   [{"timestamp": "00:02:35", "frame_path": "/absolute/path/to/frame.png", "caption": "...", "after_passage": "first 10 words of the passage..."}]
   ```

7. Log phase timing.

**If `tool-video-screenshots` is not installed or extraction fails:** Skip this step. The article renders without images.

## Step 4: Fact-Check Claims

Invoke `tool-fact-checker` in pipeline mode:

- Extract all factual claims from the draft article
- Pass claims to fact-checker
- Receive structured verdicts back
- Save fact-check report to `{LOG_DIR}/fact-check-report.md`
- Log phase timing

Format the report clearly showing each claim, its verdict, and any corrections.

## Step 5: Human Review (CHECKPOINT)

Present the user with:

1. **The draft article** — full text or a summary with key sections highlighted
2. **The fact-check report** — claims with verdicts, flagging any FALSE/MOSTLY FALSE/MIXED
3. **Suggested corrections** — from fact-checker's `corrected_text` fields

Ask: "Here's the draft and fact-check results. Want me to apply the corrections and proceed, make specific edits, or stop here?"

**On approve:** Apply any accepted corrections to the article, save updated version as `{LOG_DIR}/reviewed-article.md`, proceed to Step 6.

**On edit:** Apply the user's requested changes, save, proceed.

**On reject:** Stop the pipeline. Log to `pipeline-log.md`.

## Step 6: Humanize

Invoke `tool-humanizer` on the reviewed article:

- Use `deep` mode if `{brand_context}/voice-profile.md` exists
- Use `standard` mode otherwise
- Save humanized version as `{LOG_DIR}/final-article.md`
- Log phase timing

If `tool-humanizer` is not available, skip this step and use the reviewed article as-is.

## Step 7: Generate PDF

Read `.claude/skills/00-youtube-to-ebook/skill-pack/config/sys-config.md` for `Design`, `Branding intensity`, `Show logo`, `Show links`, and `Links to show` fields.

**If `design: minimal` (default):**
```bash
python3 .claude/skills/00-youtube-to-ebook/skill-pack/tools/md_to_pdf.py "{LOG_DIR}/final-article.md" "{OUTPUT_DIR}/{slugified-title}.pdf"
```

**If `design: branded`:**
```bash
python3 .claude/skills/00-youtube-to-ebook/skill-pack/tools/md_to_pdf.py "{LOG_DIR}/final-article.md" "{OUTPUT_DIR}/{slugified-title}.pdf" \
  --theme branded --tokens {brand_context}/visual-identity/tokens.json \
  --intensity {subtle|heavy}
```

Add these flags when enabled in the config:
- `--logo {logo_url_or_path}` — if `Show logo: yes`, read the Logo URL from `{brand_context}/assets.md`
- `--links "Label1=url1,Label2=url2"` — if `Show links: yes`, read the matching links from `{brand_context}/assets.md` using the labels listed in `Links to show`

- Save PDF to `{OUTPUT_DIR}/`
- Copy PDF to `~/Downloads/`
- Log phase timing

## Step 8: Pipeline Summary

Write timing summary to `pipeline-log.md` and print to user:

```
Pipeline Complete
-----------------
Source: {video title}
Output: {absolute path to PDF}
Total time: M:SS

Phase Breakdown:
  1. Fetch Transcript — M:SS
  2. Write Article — M:SS
  3. Extract & Embed Screenshots — M:SS (or skipped)
  4. Fact-Check — M:SS
  5. Human Review — (user time)
  6. Humanize — M:SS
  7. Generate PDF — M:SS

Files:
  PDF:    {OUTPUT_DIR}/{title}.pdf
  Draft:  {LOG_DIR}/draft-article.md
  Report: {LOG_DIR}/fact-check-report.md
  Log:    {LOG_DIR}/pipeline-log.md
```

Show the full absolute path to the PDF. Confirm it was copied to `~/Downloads/`.

## Rules

- No transcript available = stop immediately, don't fall back to audio transcription
- Human checkpoint is mandatory — never skip Step 5
- Always save intermediate files (draft, fact-check report) even if pipeline fails partway
- Pipeline log must be written to even on failure (record which phase failed and why)
- PDF styling: clean, minimal, serif typography, no cover page, no headers/footers

## Self-Update

If the user flags an issue with the pipeline — wrong phase order, missing files, bad output — update the `## Rules` section in this SKILL.md immediately with the correction.
