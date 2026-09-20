---
name: mkt-youtube-optimizer
description: >
  Score, package, and review YouTube videos for performance before AND after publishing.
  Modes: (1) pre-publish scorecard — rates title, thumbnail, hook, description, search
  targeting, ICP fit and funnel against the channel's REAL baseline and live competition
  (YouTube Data API), with a predicted 28-day outcome; (2) thumbnail engine — spec-driven
  brand-locked thumbnails rendered by nano-banana / gpt-image / PIL and scored on one
  rubric; (3) post-publish review — 48h/7d/28d checkpoints logging predicted vs actual so
  scoring calibrates. Use for "will this perform", "score this video", "youtube audit",
  "review this video/channel", "make/fix the thumbnail", "why did this video flop", before
  ANY YouTube upload, and from mkt-youtube-content-package's thumbnail/approval steps. NOT
  for publishing (tool-publisher), clip picking (vid-clip-selection), or non-YouTube posts
  (mkt-social-showing).
---

# YouTube Performance Optimizer

Makes every video earn its place: scored against the channel's reality before it ships,
packaged with thumbnails built from current evidence, and reviewed against its own
prediction after it ships — so the scoring gets sharper with every upload.

## Outcome

- **Score mode:** `projects/mkt-youtube-optimizer/{YYYY-MM-DD}_{slug}-scorecard.md` — weighted
  score /100, top-3 named fixes, and a falsifiable 28-day prediction. Prediction is also
  appended to `projects/mkt-youtube-optimizer/prediction-ledger.json`.
- **Thumbnail mode:** 3–5 variants (1280×720 PNG) + contact sheet with 168px legibility strip
  in `projects/mkt-youtube-optimizer/{YYYY-MM-DD}_{slug}-thumbs/`, copied to `~/Downloads/`.
- **Review mode:** checkpoint report appended to the scorecard file + ledger updated with
  actuals; calibration notes logged to `## Rules` / learnings when predictions miss.

Always save output to disk. This is not optional. After saving, show the user the full
absolute file path so they can click it directly.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/icp.md` | full | ICP-fit scoring dimension + thumbnail/title language |
| `brand_context/positioning.md` | summary | promise/angle coherence check |
| `context/learnings.md` → `## mkt-youtube-optimizer` | own section | prior calibration lessons |
| `projects/mkt-youtube-optimizer/prediction-ledger.json` | full | calibration history |

## Dependencies

| Skill / service | Required? | What it provides | Without it |
|-----------------|-----------|------------------|------------|
| YouTube Data API (`YOUTUBE_API_KEY`) | Required for score/review | channel baseline, competition, live stats | rubric-only scoring — say so explicitly, mark score "uncalibrated" |
| `mkt-content-analytics` (Zernio) | Optional | CTR/AVD-adjacent metrics for review mode | public stats only (views/likes/comments) |
| `viz-nano-banana` / `viz-image-gen` | Optional | generated artifact imagery for thumbnails | photographic assets + text-led patterns |

## Skill Relationships

- **Upstream:** `mkt-icp` (audience), `mkt-brand-voice` (tone words on thumbnails),
  the video itself (from `viz-remotion-video`, podcast pipeline, or camera footage).
- **Downstream / callers:** `mkt-youtube-content-package` MUST call this skill at its
  thumbnail step (mode 2) and before its posting approval (mode 1, score gate).
  `00-longform-to-shortform` and the podcast pipeline should call mode 1 on hero uploads.
- **Boundaries:** `mkt-social-showing` scores social POST packages; this scores YOUTUBE
  VIDEOS with API data. `vid-clip-selection` picks clip moments; this judges finished packages.

## Step 1: Detect mode and gather the package

Modes: **score** (pre-publish), **thumbs** (thumbnail build), **review** (post-publish).
A bare video URL + "how will this do" = score mode on a published video (score it as-is,
then offer review checkpoints).

For score mode collect: working title(s), thumbnail file(s) or concept, target search
query, the first-60-seconds content (script or description of the open), description draft,
CTA destination URL, and the video's runtime. Missing pieces score zero on their dimension —
tell the user which are missing rather than guessing.

## Step 2: Pull channel reality and competition (never skip)

Run `node scripts/channel-context.mjs [videoId-or-channel-handle] "[target query]"`.
It returns: subscriber count, upload count, lifetime views, recent uploads, and the top
search results for the target query (age, views, channel, angle).

Why this matters: a 100-sub channel and a 100k-sub channel need opposite advice. Every
score and prediction is calibrated to THIS channel's gravity, and every search-targeting
judgment is made against the actual incumbents, not imagined ones.

## Step 3 (score mode): Run the scorecard

Read `references/scorecard.md` and score the six dimensions exactly as specified there
(Packaging-CTR 25 · Search fit 20 · Hook & retention structure 20 · ICP fit 15 ·
Funnel 10 · Prediction calibration 10). Check the CTA URL actually resolves before
scoring Funnel. Produce:

1. Score /100 with per-dimension evidence (one line each — cite, don't vibe)
2. **Top 3 fixes ranked by leverage**, each with the expected effect
3. **A falsifiable prediction**: 28-day view range, expected CTR band, target AVD —
   append to `prediction-ledger.json` (schema inside the file; create from
   `assets/ledger-template.json` on first run)

Gate: below 70/100, say plainly "fix before publishing" and name the blocking dimension.
The user can override — record the override in the scorecard file.

## Step 4 (thumbs mode): Build thumbnails from evidence

1. Read `references/thumbnail-patterns.md` — the maintained pattern library with hard
   rules (face ≥35% frame height, ≤3 big words or a boxed-phrase quote, one idea,
   one visual cue, brand chip, 168px legibility).
2. **Refresh check:** if the patterns file is >60 days old, first run
   `node scripts/fetch-ref-thumbs.mjs` (pulls the CURRENT most-viewed thumbnails from the
   reference channels into `research/refs/`), view the contact sheets, and update the
   patterns file with anything that has changed. Date-stamp the refresh at the top.
3. Write a **thumb-spec JSON** per variant (`references/thumb-spec.schema.json`) — the
   structured prompt: layout, brand tokens, hook text + emphasis, subject, engines, and the
   ONE variable this variant tests. Render the spec through ALL listed engines (AI prompt
   template in `assets/ai-thumb-prompt.md`; PIL via `scripts/thumb_lib.py`), then score every
   output with the engine rubric in `references/metrics-framework.md` §C. Use the logo-free
   cut-outs (path in the patterns file), never the branded-tee originals. Match the quality
   bar in `assets/` examples.
4. VIEW every variant yourself before showing the user — check text clipping, collisions
   with the caption zone, stray artifacts, and the 168px strip. Fix before presenting.
5. Present with a one-line rationale per variant + a recommendation. The user picks.

## Step 5 (review mode): Checkpoints and calibration

Read `references/review-checkpoints.md` AND `references/metrics-framework.md` (click metrics
vs promise metrics, hook-gap diagnosis, hook bank logging). At 48h / 7d / 28d pull live stats
(`scripts/channel-context.mjs <videoId>`) and Zernio analytics if available. At 28d:
compare actuals against the ledger prediction, mark the entry `hit | over | under`, and
when the miss is structural (not noise), add a dated calibration rule to `## Rules`
(e.g., "predictions for search-play videos were 2× too optimistic — halve the range").
This loop is the whole point: scores that never meet reality are decoration.

## Step 6: Save, show paths, collect feedback

Save all outputs per **Outcome**. Show full absolute paths. After a major deliverable ask:
"How did this land? Any adjustments?" — log the answer to `context/learnings.md` under
`## mkt-youtube-optimizer`.

## Rules

- 2026-07-04: Title and thumbnail must make the SAME promise unless the channel has brand
  gravity (>10k subs). Split-promise packaging (searchable title + unrelated curiosity
  thumbnail) costs CTR on small channels — flag it as a Packaging fix, not a style choice.
- 2026-07-04: Never present a thumbnail you haven't visually inspected at full size AND in
  the 168px strip. Generated images get lettering/artifact QA every time (Nano Banana adds
  text ~1 in 6 even when told not to).
- 2026-07-04: The ATP branded t-shirts are retired — thumbnails use the logo-free cut-outs
  only (`projects/briefs/core-values-cluster/thumbnails/cutouts-nologo/`).
- 2026-07-04: Predictions must be ranges with a date, never point estimates — otherwise
  the calibration loop can't score itself.
- 2026-07-15: For how-to / instructional videos, LEAD WITH THE ARTIFACT, not a face + phrase.
  Roy rejected a talking-head "Take the people out" thumb — "the thumbnail doesn't demonstrate
  what this is, why would people click?" A face + boxed phrase (the DOAC pattern) only works
  with brand gravity OR a self-explanatory hook; "Take the people out" is meaningless until you
  already know it's about org charts. Fix that shipped: an actual org-chart diagram as the hero
  (empty seats / every box = YOU / labelled), subject smaller on the right. The topic must be
  readable in the frame before the hook does its job. Default how-to thumbs to pattern C (artifact)
  unless the channel has >10k subs.

## Self-Update

If the user flags an issue with the output — wrong approach, bad format, missing context,
incorrect tone — update the `## Rules` section in this SKILL.md immediately with the
correction. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.
Calibration misses from Step 5 also land here as dated rules.

## Troubleshooting

- **`YOUTUBE_API_KEY` missing/quota exhausted:** say so, score rubric-only, mark the
  scorecard "uncalibrated — no channel/competition data", skip predictions.
- **Subscriber count hidden:** some channels hide it; fall back to median views of the
  last 10 uploads as the baseline.
- **Thumbnail fonts missing:** Anton/Archivo live in `.claude/skills/_assets/fonts/`;
  Windows fallbacks: `arialbd.ttf`, `Inkfree.ttf` (handwritten).
- **Zernio metrics unavailable in review mode:** public stats only — note that CTR/AVD
  are estimates inferred from views vs impressions proxies, and say so in the report.
