---
name: Meeting Clips Lane
time: '09:00'
days: daily
active: 'true'
model: opus
notify: on_finish
description: 'Renders social shorts for meetings that are cleared (Clip for Social ticked) and have a clip plan but no rendered clips yet, using the exact planned windows, and drops them into the Video Intake inbox. Armed 2026-06-25 after the THRIVE render was validated attended (Roy approved 4 clips; Gemini QA 8/10).'
timeout: 120m
retry: '0'
---
You are running as a scheduled job for Agentic OS. Read CLAUDE.md for system context.

Task: turn the cleared, planned marketing-snippet moments from meetings into captioned 9:16 shorts and
hand them to the social system - the same way the Podcast Shorts Lane does, but driven off the meeting's
**clip plan** instead of fresh selection.

**PRIVACY GATE - never break this:** only ever process meetings whose Notion row has **`Clip for Social`
ticked**. That tick is Roy's explicit clearance that the people on that private call are OK to clip
(this is the "third parties in private call recordings need human review" rule from
`.claude/skills/00-longform-to-shortform/SKILL.local.md`, satisfied). An un-ticked meeting is NEVER clipped.

## 1. Find meetings ready to clip
Query the Notion Meetings DB (data source `be8400c3-cbbe-43f8-bfd9-32f18730b153`) via `NOTION_API_TOKEN`
(write a small node script; never echo the token):
- Filter: `Clip for Social` == true AND `Clips Rendered` == false.
- If none: output "No meetings ready to clip." and stop.

## 1b. SELECT (edge-first - capture only high-value shares)
Dump the timestamped transcript and pick the clips YOURSELF with the edge-first model - do NOT use the
old marketing-snippet match (that surfaces tidy-but-forgettable clips AND can grab third-party demo audio):
```
node scripts/meetings/meeting-transcript.cjs --uuid "<uuid>" --out .tmp/clips/<slug>.timed.txt
```
Then read it and score every candidate per `.claude/skills/vid-clip-selection/references/performance-scoring.md`:
`performance = edge*0.45 + viral*0.35 + content*0.20`; **hunt for spikes, not summaries** (tension, emotional
spike/confession, identity "that's so me", open loop, quotable). Then:
- **EXCLUDE third-party content**: any cue labelled "Audio shared by ..." or otherwise played as a demo is
  someone else's footage on a shared screen - NEVER clip it. Same for screen-share-only stretches.
- **Sensitivity gate**: flag money/failure/mental-health/conflict; `high` never auto-posts (the opt-in tick is the clearance, but still skip third-party sensitive clips entirely).
- Keep only clips scoring well (roughly `performance >= 65`); a sales/onboarding call may yield just 3-4.
- Write `clip_candidates.json` = `[{rank,start_sec,end_sec,hook,score,why,sensitivity}]`. Hooks are short
  title-card lines (3-8 words), NOT transcript excerpts.
- **If nothing qualifies** (every candidate excluded as third-party/sensitive or below the threshold), this
  is NOT an error: tick `Clips Rendered` on the row, report "no qualifying clips for this meeting", and move
  on — otherwise the cleared meeting re-surfaces in the step-1 filter on every run.

## 2. For each matching meeting (usually one)
1. **Stage the inputs** (downloads the face-view MP4 + the clip plan):
   ```
   node scripts/meetings/meeting-clip-fetch.cjs --uuid "<uuid>"
   ```
   It prints `SOURCE=<source.mp4>` and `PLAN=<clips.json>` under
   `projects/00-longform-to-shortform/_inbox/meetings/{date}_{slug}/`.
2. **Render the planned windows** through `00-longform-to-shortform` - read its `SKILL.md` AND
   `SKILL.local.md` first and follow them. **Do NOT auto-select clips** - use the EXACT `start`/`end`
   windows in `clip_candidates.json` from step 1b (the edge-first picks). Per window:
   - **Reframe** to 9:16 with `--layout face-track` on the active-speaker source the fetch helper pulls.
     (Meetings usually carry a notetaker / extra gallery tile, so the clean two-up `stacked` layout
     rarely applies - validated 2026-06-25; use `stacked` only for a genuine clean two-up.)
   - **Transcribe** the reframed clip for word timing with `node scripts/meetings/eleven-words.cjs`
     (ElevenLabs Scribe - this account's speech model, high-accuracy word timing). Falls back to
     `node scripts/meetings/groq-words.cjs` if ElevenLabs errors. (WhisperX isn't installed here.)
   - **Caption + burn** via `captions_from_words.py --kinetic` + the gold progress-bar overlay, with a
     short white hook card from the clip's `caption`. Honour every SKILL.local caption rule (white bold
     hook, gold word highlight, contact-sheet covers - do NOT blind-auto-pick a cover).
     **Burn at `-preset slow -crf 18` with a light `unsharp=5:5:0.8:5:5:0.0`** - Zoom sources are 720p
     and get upscaled, so the sharpen + higher-quality encode is what takes a clip from soft to crisp
     (validated 8/10 with `gemini-review.cjs` 2026-06-25). Every clip MUST carry burned captions.
   - **QA before intake**: run `node scripts/meetings/gemini-review.cjs --file <clip>` and only pass
     clips Gemini rates postable; fix or drop the rest.
3. **Hand to the social system**: copy the rendered clips into the Video Intake inbox
   `G:\Shared drives\Elevate 360\24_Video Drops\Inbox\`, named `{date}_{slug}_clip{N}.mp4`. The existing
   "Video Intake: Analyse & Score v2" workflow takes them from there (Gemini score -> Video Library ->
   approval -> Zernio). Do not create Video Library rows yourself.
4. **Mark done**: tick `Clips Rendered` on the meeting's Notion row.

## 3. Report
One line per meeting: title, clips rendered, copied to inbox yes/no, cover-sheet location. Plus any
meeting skipped and why. If a render errors mid-meeting, leave `Clips Rendered` unticked so the next run
retries, and say what failed.

Notes:
- Renders stay inside `projects/00-longform-to-shortform/` (no Downloads copies - per the skill's local rule).
- ACTIVE since 2026-06-25: the first meeting (THRIVE / Dave Chametzky) was rendered attended and the framing
  + captions were signed off (Roy approved 4 clips; Gemini QA 8/10), same rollout the podcast lane had.
- **Unattended job - report in plain declarative statements.** Do NOT end the report with a question, an
  offer, or anything that reads as awaiting input ("happy to...", "if you'd like...", "let me know...",
  "want me to..."). The cron runtime reclassifies any run whose final message looks like a question as
  **needs-input -> FAILURE**, even when every meeting was handled correctly. State follow-ups as flat
  observations ("Note: X"), never as questions or offers.
