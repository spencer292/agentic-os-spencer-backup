---
name: mkt-ai-video-ads
description: >
  Make AI-generated video ads for Got Moles: Reels/Facebook, YouTube Shorts and TikTok, 9:16.
  Runs the AI Video Bootcamp method end to end, adapted to a local, trust-led, chemical-free mole
  control brand. Steps: awareness level and framework, hooks and a timed script, consistent passports and
  a PNW look block, start-frame images (Nano Banana Pro), image-to-video clips (Veo 3.1, or
  Seedance/Kling via PromptWise), ElevenLabs voiceover, ffmpeg assembly with a branded end card,
  and an AI ad gate for Posture A in pictures, no fake customers, disclosure and claims. Formats:
  podcast-style expert, claymation, 2D animated story, presenter/clone talking head, cinematic hero
  spot, B-roll fast cut, static image ads. Triggers on "AI video ad", "AI ad", "make a video ad",
  "claymation ad", "podcast ad", "animated ad", "UGC ad", "avatar ad", "AI commercial",
  "Veo", "Seedance", "Kling", "Nano Banana ad", "ad creative", "hook variations", "video ad variants",
  "clone Spencer for ads". Does NOT trigger for spending, launching or channel numbers
  (mkt-cmo, ops-got-moles-ads), editing real camera footage (00-video-studio, vid-*), animated
  explainers in the All The Power brand (viz-remotion-video), or posting (mkt-short-form-posting).
---

# AI Video Ads

The creative workshop. It makes the ad and stops. Spencer approves, and `mkt-cmo` decides
spend and placement. **This skill never spends on ads, uploads to an ad account, or posts.**

Source: AI Video Bootcamp on Skool (Spencer is a member). Harvested 2026-10-29, 130 lessons. The
course's method is digested in `references/`. Those digests repeat course advice, and
**`references/ai-ad-gate.md` overrides them** wherever they disagree.

## Outcome

One folder per ad: `projects/mkt-ai-video-ads/{YYYY-MM-DD}_{slug}/` containing `plan.md`
(strategy, script, shot list, prompts), `gate.md` (filled checklist), `frames/`, `clips/`,
`audio/`, and `final/{slug}-A.mp4` (plus variants). Copy finals to `~/Downloads/`.
Show the absolute path.

## Context Needs

| File | Load | Why |
|---|---|---|
| `references/ai-ad-gate.md` | always | Hard rules |
| `.claude/skills/mkt-cmo/references/claims-gate.md` | always | Numbers, forbidden claims, Posture A |
| `references/master-prompt-got-moles.md` | always | Prefilled planning brief |
| `references/got-moles-passports.md` | always | Look block, characters, colors, logo |
| `references/ad-strategy-frameworks-hooks.md` | step 2 | 16 frameworks, awareness levels, psychology, hooks |
| `references/ad-formats-and-master-prompts.md` | step 2–4 | Per-format workflow and rules |
| `references/image-prompting.md` | step 4 | Image prompt anatomy, realism, consistency |
| `references/video-prompting.md` | step 5 | Model choice, prompt anatomy, 37 camera moves, failures |
| `references/social-and-clone.md` | as needed | Platform norms, cloning Spencer, organic series |
| `references/pipeline-and-flows.md` | as needed | PromptWise Flows, batch variants |
| `brand_context/voice-profile.md`, `positioning.md` | step 3 | Voice and angles (take numbers from the claims gate) |
| `context/learnings.md` → `## mkt-ai-video-ads` | start | What's worked |

## Workflow

**1. Brief (≤3 questions, skip any already answered).** Goal and placement (cold Reels,
retargeting, organic)? Format preference? Any real assets (tech photos, yard before/after
photos, Spencer's consented clone)? Default when silent: cold Meta Reels, 15 s, podcast or
claymation, since those fit best (`ad-formats-and-master-prompts.md` §4).

**2. Strategy.** Work through `master-prompt-got-moles.md` steps 1–4: angle, awareness level,
primary and backup framework, five hooks, and the pick. Format fit for us:

| Format | Fit | Note |
|---|---|---|
| Podcast expert clip (Myth Killer / Educator) | High | Busts DIY myths (castor oil, spikes, poison). The expert is honestly labelled |
| Claymation | High | Charming, obviously stylized, no animal-harm risk |
| 2D named-homeowner story | High | Relatable and obviously fictional |
| Presenter or consented clone of Spencer/tech | Medium–High | "3 signs it's moles, not voles". Never a customer voice |
| Cinematic hero spot (passports + look block) | Medium | 1–2 brand films, not volume |
| B-roll fast cut + VO | Medium | Best with real job footage plus a few AI inserts |
| Fake-customer avatar UGC | **Never** | FTC endorsement risk. See the gate |

**3. Script and shot list.** Steps 5–9 of the master prompt, written to `plan.md`. Keep to the
word budget (≈2.3 words/s). Mark every shot as AI, real footage, or card.
**Checkpoint: show Spencer the hook, script and shot list before generating anything.**

**4. Start frames.** One image per AI shot, using the passport + look block + shot prompt
(anatomy in `image-prompting.md`). Pass real photos as `--ref` for consistency. Check each frame:
if you can tell it's AI, or if any text or logo is rendered, regenerate.
```
node .claude/skills/mkt-ai-video-ads/scripts/gen-image.mjs --prompt "<p>" --out <dir>/frames/s01.png [--ref passport.png] --aspect 9:16
```

**5. Clips.** Image-to-video, one shot per call. Movement and camera wording come from
`video-prompting.md` §3–4. Always `--dry` first. **Read Spencer the batch cost and get a yes
before the first paid run.**
```
node .claude/skills/mkt-ai-video-ads/scripts/gen-video.mjs --image frames/s01.png --prompt "<motion>" --out clips/s01.mp4 --seconds 8 --dry
```
Model routing: **Veo 3.1** (here via Gemini API) for realistic shots, dialogue up to 8 s, and
native ambient audio. **Seedance 2.x / Kling** for multi-reference consistency, longer 15 s
shots, and clay/2D. They're available through PromptWise (web or its MCP at
`https://app.promptwise.com/mcp`), only if Spencer has an account. Otherwise stay on Veo.

**6. Voice.** `gen-voice.mjs --list` to pick an American voice, then generate VO. Skip it when
Veo's native dialogue is the point (podcast format).

**7. Assemble.**
```
node .claude/skills/mkt-ai-video-ads/scripts/assemble.mjs --clips clips/s01.mp4,clips/s02.mp4 --vo audio/vo.mp3 --card "Call or text Got Moles" --out final/<slug>-A.mp4
```
Then burn captions with `vid-ffmpeg-edit` (most viewers watch muted). The edit removes the
"AI look": lower the contrast slightly and keep the grade muted and natural.

**8. Variants.** Hook-swap: same body, three hooks. Change one variable per variant
(`pipeline-and-flows.md` §5). Name them `-A`, `-B`, `-C`, and log the variable in `plan.md`.

**9. Gate and hand-off.** Fill `gate.md` from `ai-ad-gate.md` §4. Hand to Spencer, and point
spend and placement to `mkt-cmo`, measured on cost per booked job.

## Static ads

Same strategy steps, then `gen-image.mjs` at 4:5 and 9:16 with no text in the frame. Add
headline and logo in the edit (Canva or ffmpeg drawtext), never by the model. Patterns:
`ad-strategy-frameworks-hooks.md` §2.

## Dependencies

`GEMINI_API_KEY` (images and Veo; no key = plan-only mode, which writes `plan.md` with prompts
ready to paste into PromptWise). `ELEVENLABS_API_KEY` (VO; fallback is Veo audio or a phone
recording). `ffmpeg`/`ffprobe` on PATH. Optional: a PromptWise account for Seedance/Kling.
Related skills: `mkt-cmo`, `vid-ffmpeg-edit`, `tool-humanizer` (run `deep` on VO and caption
copy), `mkt-short-form-posting` (organic posting, after approval).

## Corpus and gaps

Raw harvest: `projects/briefs/ai-video-ads/skool-corpus/` (gitignored; re-run with
`node projects/briefs/ai-video-ads/harvest/harvest-skool.mjs`). The 40 video-only lessons
(Loom, Vimeo, Skool-hosted) were transcribed locally with Whisper on 2026-10-29. Each one is the
`## Video transcript` section of its lesson `.md`, and the audio is in `skool-corpus/_audio/`.
Coverage is complete. The other 29 short lessons are text-only. Spencer planned to cancel the
Skool membership after the harvest. Assume the corpus can't be re-pulled.

## Rules

- 2026-10-29: Built. `assemble.mjs` was tested end to end on synthetic clips: 1080x1920, VO
  ducking, end card with the Cream logo and Gold CTA. `gen-image.mjs` reached the API, and
  `gemini-3-pro-image` was accepted (HTTP 402, not 404), but **the Gemini prepay credits were
  depleted**, so no image or Veo clip has been generated yet. Top up at ai.studio/projects
  before the first run. `gen-video.mjs` and `gen-voice.mjs` have not been run live. Record the
  first real result here.

## Self-Update

When Spencer flags a problem with an ad (claim, look, voice, format) add a dated rule above, and
log what worked to `context/learnings.md` → `## mkt-ai-video-ads`.
