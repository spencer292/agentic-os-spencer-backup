---
name: viz-remotion-video
description: Build premium animated explainer and course videos from a script, in the All The Power brand, using the Remotion studio. Produces narrated, captioned, music-scored videos with on-brand motion-graphic scenes, AI illustrations (Nano Banana / Gemini), optional Veo 3.1 hero clips, and single- or two-host voiceover (ElevenLabs cloned voices). Triggers on "remotion video", "explainer video", "course video", "animated explainer", "build a lesson video", "two-host explainer", "notebooklm-style video", "turn this transcript into a video", "motion graphics from script", "make a course video". Does NOT trigger for editing existing camera footage (use 00-video-studio or vid-* skills), YouTube-URL-to-shorts automation (use 00-longform-to-shortform), or static social images (use viz-image-gen / 00-social-content).
---

# viz-remotion-video

Turns a transcript or script into a finished, on-brand explainer/course video. The
render engine is a Remotion project (React → MP4). Claude authors the plan and the
generative assets; Remotion assembles and renders with full control over timing,
brand, text, captions and music.

## Studio location

`projects/viz-remotion-video/studio/` (a Node/Remotion project; `node_modules` is
local-only). Run commands from there. Live preview: `npm run dev`.

## Pipeline

```
source (transcript / topic) → production script (narration + visual direction)
  → plan (scene plan OR conversational lesson plan)  ← human reviews/edits
  → generate assets: VO (ElevenLabs), illustrations (Nano Banana), Veo hero clips
  → render (long YouTube + shorts)
```

## Two plan formats

- **Scene plan** (`vo/*.plan.json`, single-narrator): `scenes[]` with `type`,
  `narration`, `data`. Voice + manifest: `node scripts/elevenlabs/generate-from-plan.mjs <plan>`.
  Rendered by the `QBMWeek1` composition pattern (data-driven via `SceneRouter`).
- **Conversational lesson plan** (`vo/*-lesson.plan.json`, two-host): `segments[]`
  each a `visual` backing (`video` Veo / `illustration` Nano Banana / `scene` hero)
  with `turns[]` of two-host dialogue. Voice: `node scripts/elevenlabs/generate-lesson.mjs <plan>`.
  Rendered by `ConversationalLesson`. Plan `meta` pins the engine per lesson:
  `model` (e.g. `eleven_flash_v2_5`), `languageCode` (`en` — turbo/flash only),
  and `voiceSettings` per-speaker overrides (e.g. `{ "roy": { "speed": 0.96 } }`)
  merged over the `voices.json` bucket.
  **TWO VOICE ENGINES** (manifest shape identical, compositions don't care):
  **`v3-dialogue` = THE STANDARD for two-host lessons (LOCKED, Roy 07-31)** —
  meta `engine:"v3-dialogue"`, `model:"eleven_v3"`, `dialogueStability: 0.5`
  (Natural) **and a pinned `seed`** (both REQUIRED since 08-06 — seedless calls
  at lower stability audibly drift between segments): ONE Text-to-Dialogue call
  per segment, Eleven v3 native multi-speaker prosody, **audio tags in turn
  text = the directing layer** ([curious] [laughs] [pause] [whispers]… —
  sparingly, at emotional beats; stripped from captions automatically). v3 has
  no `speed` param — pace via script + stability. Segment budget ~1,900 chars
  (script enforces). Re-do one segment: `--seg=<segId,...>`.
  **The take plays UNCUT (fix 08-06, commit dd3479c5):** the generator keeps
  each segment's dialogue audio as one continuous `seg-<id>.mp3` (loudness-
  normalized once), and manifest turns carry NO file — they're gapless time
  windows (`durationInFrames` telescoped to the audio) that drive visuals,
  captions and callouts while `ConversationalLesson` plays the segment file
  whole. Never reintroduce per-turn slicing, per-slice loudnorm, or GAP_TURN
  spacing for v3 segments — that combination clips word tails, flattens
  dynamics and destroys v3's conversational timing (what Roy heard on the
  first Meetings render).
  `stitched` = per-turn TTS + request stitching + warm-start — legacy engine for
  existing lessons and any v2-model re-voice (--speaker/--only surgical fixes).
- **Cadence overlay** (`vo/*-cadence.json`): re-cut visuals (shot pools, cutaways,
  word-synced callouts) WITHOUT re-voicing — `node scripts/merge-cadence.mjs <slug> <overlay>`.
  Re-run the merge after ANY re-voice (the manifest is rewritten from the plan).

## Asset generators (read keys from repo .env)

- **Voice (ElevenLabs):** `scripts/elevenlabs/` — `generate-from-plan.mjs`,
  `generate-lesson.mjs`, `audition.mjs`, `audition-models.mjs` (same line across
  TTS models — the model shootout). Voices live in `src/voices.json` (roy5/roy6
  clones + host voices). Word timings come from the with-timestamps endpoint
  (drives captions + callout anchors). Needs `ELEVENLABS_API_KEY`.
  **Model ladder (verified 07-31):** `eleven_v3` (GA, most expressive, 70+ langs,
  5k chars, dialogue endpoint) top of tree for two-host · `eleven_flash_v2_5`
  workhorse for single-VO/bulk (40k chars, cheap, low latency) ·
  `eleven_multilingual_v2` long-block fallback (10k chars) · turbo deprecated,
  v1 models removed. STT: `scribe_v2` exists (90+ langs, diarization) — candidate
  to replace WhisperX in transcription flows if ever needed here.
  `generate-lesson.mjs` also does per-speaker request stitching (accent/prosody
  continuity across turns) and per-turn EBU R128 loudness normalization to
  -16 LUFS (raw per-turn TTS wanders up to 16 LU — never skip this).
- **Illustrations (Nano Banana Pro / Gemini 3 Pro Image):**
  `node scripts/images/gen-image.mjs <list.json>` → `public/img/`. Brand style baked
  into `scripts/images/lib.mjs`. Model = `gemini-3-pro-image` (GA; the `-preview`
  id was retired 2026-07-17). OpenAI `gpt-image-2` fallback. Needs `GEMINI_API_KEY`
  (or `OPENAI_API_KEY`).
- **Veo 3.1 hero clips (image-to-video):**
  `node scripts/veo/gen-veo.mjs <img> <id> "<motion>"` → `public/veo/`. Model =
  `veo-3.1-fast-generate-preview` (Veo 3.0 ids shut down 2026-06-30;
  `veo-3.1-lite-generate-preview` = new cheapest tier, untested by us). Needs
  `GEMINI_API_KEY`. Expensive (~£1–3 / 8s) — use for a few hero moments only.

## Scene catalogue (`src/scenes/`, routed by `src/SceneRouter.tsx`)

12 generic: sting, title, chapter, statement, stat, points, comparison, diagram,
quote, image, lowerthird, end. 4 bespoke heroes: `double-slit` (observer effect),
`funnel` (filter), `reframe` (fear↔opportunity toggle), `callback` (wave→particle).
Add new bespoke scenes per lesson (Tier 3) and register them in `SceneRouter`.

## Brand

Tokens in `src/brand.ts` (from `brand_context/design-system.md`): Musk Green,
Night Sky, Light Green, Dusty Blue, Sky; Montserrat + BN Dime Display. Two output
profiles in `src/theme.tsx`: `youtube` (16:9, corner mark) and `shorts` (9:16, no
persistent logo, captions on). Captions auto-off on text-heavy + hero scenes;
contrast scrim keeps them legible over illustrations.

## Render

`npx remotion render <CompositionId> out/<name>.mp4`. Copy finished files to
`~/Downloads/`. Output project folder: `projects/viz-remotion-video/`.

**QA gate before anything ships (Roy standing rule 2026-08-11):** run
`node scripts/meetings/gemini-review.cjs --file <exact-file-being-sent>` (repo
root) on the FINAL artifact — after any compression, the very bytes going out —
and require a SEND-QUALITY/postable verdict. Show Roy the verdict in the
message that delivers the file. DEGRADED blocks the send until fixed or Roy
overrides. If compressing for email, keep audio at AAC 128k minimum.

## Notes / learnings

- Output length ≈ script length. Faithful-but-tight transcripts run ~3–4 min; for
  8–10 min write richer scripts and pace VO ~135 wpm with pauses.
- Two-host conversational format (Roy + Applewood) is the main engagement driver
  (NotebookLM-style); illustrations + continuous motion make it feel instructional.
- Pacing is per-model: `eleven_turbo_v2_5` runs slower than multilingual at the same
  `speed` — 0.96 is the tuned turbo reference for Roy's clone. NOTE 2026-07-31:
  ElevenLabs deprecated Turbo in favour of `eleven_flash_v2_5` (like-for-like;
  turbo still works — existing plans fine, prefer flash for new lessons and
  re-audition). v1 models (`eleven_monolingual_v1`/`eleven_multilingual_v1`)
  removed 2026-07-09. Full lesson production
  run-order + quality gates: `projects/briefs/core-values-cluster/lesson-video-playbook.md`.
- See `projects/briefs/remotion-explainer-studio/` for the design + production-script
  format and the QBM Week 1 worked example.
- Licensing: Remotion free ≤3 employees (incl. automation). Music via ElevenLabs
  Music API is commercially cleared.
- Read `context/learnings.md` → `## viz-remotion-video` before running.
