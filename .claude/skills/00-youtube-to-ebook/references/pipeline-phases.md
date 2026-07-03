# Pipeline Phases — Detailed Configuration

## Phase 2: Fetch Transcript

**Skill:** `tool-youtube`

Invoke in transcript-only mode. The system needs text, not video.

**What to pass:**
- YouTube URL
- Request: transcript extraction only

**What comes back:**
- Raw transcript text with timestamps
- Video title and metadata

**Save to:** `{LOG_DIR}/transcript.txt`

**Failure mode:** If the video has no captions, stop immediately. Display: "This video has no captions available. The pipeline requires a transcript to proceed."

## Phase 3: Write Article (text-first)

**Skill:** `mkt-longform-article`

Invoke in pipeline mode — pass transcript, receive markdown. No images at this stage.

**What to pass:**
- Full transcript text
- Video title (for article context)
- Voice profile path (if exists)
- Do NOT pass screenshots — the article is written from text alone

**What comes back:**
- Markdown article (2,000-5,000 words) without images

**Save to:** `{LOG_DIR}/draft-article.md`

**Quality gate:** Before proceeding, verify the article:
- Has a title (H1 heading)
- Is at least 1,500 words
- Contains direct quotes from the speaker

## Phase 3.5: Extract & Embed Screenshots (Optional)

**Skill:** `tool-video-screenshots`

The article drives image selection — not the other way around.

**Step 1 — Identify visual moments:**
Scan the draft article for 4-8 passages that describe something visual (UI, diagram, architecture, workflow, demo, on-screen content). For each, find the closest transcript timestamp.

**Step 2 — Extract frames:**
```bash
python3 .claude/skills/tool-video-screenshots/scripts/extract_frames.py \
  "{youtube_url}" --timestamps "{comma_separated_timestamps}" --output-dir "{LOG_DIR}/screenshots"
```

**Step 3 — Verify and caption:**
- View each frame — drop talking heads and frames that don't match the passage
- Write captions that connect the image to the article passage it illustrates

**Step 4 — Embed in article:**
- Insert `![caption](absolute_path)` directly after each passage the image illustrates
- Save the updated article back to `{LOG_DIR}/draft-article.md`

**What comes back:**
- Selected PNG frames in `{LOG_DIR}/screenshots/frames/`
- `manifest.json` with `[{timestamp, frame_path (absolute), caption, after_passage}]`
- Updated `draft-article.md` with embedded image references

**Save to:** `{LOG_DIR}/screenshots/`

**Failure mode:** If `tool-video-screenshots` is not installed or extraction fails, skip silently. The article renders without images.

## Phase 4: Fact-Check

**Skill:** `tool-fact-checker`

Invoke in pipeline mode — pass article text, receive structured verdicts.

**Claim extraction approach:**
Read through the article and identify all verifiable factual assertions. Focus on:
- Statistics and numbers
- Named claims ("X said Y")
- Causal claims ("A causes B")
- Temporal claims ("In 2024, X happened")
- Technical claims about how things work

Skip opinion, editorial framing, and subjective assessments.

**What to pass:**
- Extracted claims as structured list
- Source context (video title, speaker)

**What comes back:**
- Structured verdict per claim (rating, evidence, corrected text)
- Overall reliability score

**Save to:** `{LOG_DIR}/fact-check-report.md`

**Report format:**
```markdown
# Fact-Check Report: {title}

## Summary
{X} claims checked | {Y} verified | {Z} flagged

## Flagged Claims (require attention)
{Only FALSE, MOSTLY_FALSE, MIXED claims — with corrections}

## All Claims
{Full list with verdicts}
```

## Phase 5: Human Review

**No skill — orchestrator handles directly.**

Present a clear review to the user:
1. Article word count and structure overview
2. Fact-check summary (how many verified vs flagged)
3. Any flagged claims with suggested corrections
4. Clear options: approve / edit / reject

## Phase 6: Humanize

**Skill:** `tool-humanizer`

**Mode selection:**
- If `brand_context/voice-profile.md` exists → `deep` mode
- Otherwise → `standard` mode

**What to pass:**
- The reviewed/corrected article markdown

**What comes back:**
- Humanized markdown with AI patterns removed

**Save to:** `{LOG_DIR}/final-article.md`

## Phase 7: Generate PDF

**Tool:** `.claude/skills/00-youtube-to-ebook/skill-pack/tools/md_to_pdf.py`

Read `.claude/skills/00-youtube-to-ebook/skill-pack/config/sys-config.md` for `Design`, `Branding intensity`, `Show logo`, `Show links`, and `Links to show`.

**Minimal (default):**
```bash
python3 .claude/skills/00-youtube-to-ebook/skill-pack/tools/md_to_pdf.py "{LOG_DIR}/final-article.md" "{OUTPUT_DIR}/{title}.pdf"
```

**Branded (uses design tokens):**
```bash
python3 .claude/skills/00-youtube-to-ebook/skill-pack/tools/md_to_pdf.py "{LOG_DIR}/final-article.md" "{OUTPUT_DIR}/{title}.pdf" \
  --theme branded --tokens brand_context/visual-identity/tokens.json \
  --intensity {subtle|heavy} \
  --logo "{logo_url}" \
  --links "YouTube=https://...,LinkedIn=https://..."
```

- `--intensity`: read from config `Branding intensity` field (default: subtle)
- `--logo`: only include if `Show logo: yes` — read logo URL from `brand_context/assets.md` Visual Brand table
- `--links`: only include if `Show links: yes` — build from `Links to show` labels matched against `brand_context/assets.md` Business Links and Personal Links tables

**Save to:** `{OUTPUT_DIR}/{slugified-title}.pdf`
**Also copy to:** `~/Downloads/{slugified-title}.pdf`
