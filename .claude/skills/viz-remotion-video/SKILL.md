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
  Rendered by `ConversationalLesson`.

## Asset generators (read keys from repo .env)

- **Voice (ElevenLabs):** `scripts/elevenlabs/` — `generate-from-plan.mjs`,
  `generate-lesson.mjs`, `audition.mjs`. Voices live in `src/voices.json`
  (roy5 clone + host voices). Word timings come from the with-timestamps endpoint
  (drives captions). Needs `ELEVENLABS_API_KEY`.
- **Illustrations (Nano Banana Pro / Gemini 3 Pro Image):**
  `node scripts/images/gen-image.mjs <list.json>` → `public/img/`. Brand style baked
  into `scripts/images/lib.mjs`. OpenAI `gpt-image-1` fallback. Needs `GEMINI_API_KEY`
  (or `OPENAI_API_KEY`).
- **Veo 3.1 hero clips (image-to-video):**
  `node scripts/veo/gen-veo.mjs <img> <id> "<motion>"` → `public/veo/`. Needs
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

## Notes / learnings

- Output length ≈ script length. Faithful-but-tight transcripts run ~3–4 min; for
  8–10 min write richer scripts and pace VO ~135 wpm with pauses.
- Two-host conversational format (Roy + Applewood) is the main engagement driver
  (NotebookLM-style); illustrations + continuous motion make it feel instructional.
- See `projects/briefs/remotion-explainer-studio/` for the design + production-script
  format and the QBM Week 1 worked example.
- Licensing: Remotion free ≤3 employees (incl. automation). Music via ElevenLabs
  Music API is commercially cleared.
- Read `context/learnings.md` → `## viz-remotion-video` before running.
