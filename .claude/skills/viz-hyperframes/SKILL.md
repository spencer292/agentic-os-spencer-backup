---
name: viz-hyperframes
version: 1.0.0
description: >
  Create professional motion-graphics videos by writing HTML compositions with GSAP animations,
  rendered to MP4 via HyperFrames. Use when: "create a video", "make a motion graphics video",
  "product video", "launch teaser", "social reel", "animated explainer", "promo video",
  "video from this content", "hyperframes", "video as code", "render a video", "brand video",
  "title sequence", "animated announcement". Also triggers for: converting URLs, transcripts,
  changelogs, or documents into video. Does NOT trigger for: UGC talking-head videos (use
  viz-ugc-heygen), long-form video editing, or clip extraction from existing footage.
---

# HyperFrames Video Creator

Create video-editor quality motion graphics by writing HTML + CSS + GSAP compositions, rendered
to pixel-perfect MP4 via HyperFrames. Every composition follows the layout-first methodology:
static design first, then choreographed motion.


## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}` to absolute paths set by the installer. Substitute these placeholders wherever they appear below.

## Outcome

A rendered MP4 video file. Save composition source to `{projects_base}/viz-hyperframes/{YYYY-MM-DD}/{name}/`
and the final render to `~/Downloads/`. Show the user the full absolute path after saving.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `{brand_context}/design-tokens.md` | full | Brand colours, fonts, spacing for design.md generation |
| `{brand_context}/voice-profile.md` | tone only | Tone for narration scripts |
| `context/learnings.md` | `## viz-hyperframes` | Past feedback and corrections |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `mkt-brand-voice` | Optional | Voice profile for narration tone | Use neutral professional tone |
| `mkt-design-tokens` | Optional | Brand design tokens | Ask user for colours/fonts or use house style |

## Before You Start

Check prerequisites:

```bash
command -v node && node --version  # Need 22+
command -v ffmpeg                   # Need FFmpeg
command -v npx                     # Need npx
```

If missing, guide the user through installation. Check if HyperFrames is initialised in the
project directory — if not, run `npx hyperframes init {name}`.

## Step 1: Gather Direction

For open-ended requests, gather context before committing:

1. **Duration** — "10 seconds", "30s", "5 scenes of 3s each"
2. **Aspect ratio** — 16:9 (default), 9:16 (social/reels), 1:1 (square)
3. **Mood/energy** — calm, medium, high (drives easing, transitions, pacing)
4. **Platform** — social, website hero, product demo, internal
5. **Content source** — from scratch, URL, transcript, document, changelog

If the user provides a clear brief, skip discovery and proceed.

Scene count defaults by video type:

| Type | Duration | Scenes | Aspect |
|------|----------|--------|--------|
| Social reel | 10-15s | 5-7 | 9:16 |
| Launch teaser | 15-25s | 7-10 | 16:9 |
| Product explainer | 30-60s | 10-18 | 16:9 |
| Cinematic title | 45-90s | 7-12 | 16:9 |

## Step 2: Establish Design System

Before writing ANY composition, establish visual identity.

If `{brand_context}/design-tokens.md` exists, generate a `design.md` in the project directory
using those tokens. If not, offer three paths:

1. User names a style -> read `references/visual-styles.md` for presets
2. User has visual preferences -> ask mood/light-or-dark/brand colours
3. Speed path -> use house style defaults from `references/house-style.md`

Set `:root` CSS variables: `--bg`, `--ink`, `--accent`, `--muted`, `--accent-dim`.

Typography rules (read `references/typography.md` for full guidance):
- Reject AI-cliche fonts (Inter, Roboto, Poppins, Syne)
- Extreme weight contrast: pair 300-weight display with 900-weight accent
- Video scale: 60px+ headlines, 20px+ body, 16px+ labels

## Step 3: Expand Prompt into Scene Plan

Run prompt expansion (read `references/prompt-expansion.md`). Transform the user's brief
into a production-ready scene plan with:

1. **Rhythm declaration** — e.g. "hook-PUNCH-breathe-CTA"
2. **Per-scene beats** — concept, mood, depth layers (8-10 elements), animation choreography
3. **Transition plan** — which scenes get shaders vs hard cuts (the 5% rule)
4. **Recurring motifs** — visual threads across scenes

Duration budgeting per scene:

| Text volume | Duration |
|-------------|----------|
| No text (hero, icon) | 1.5-2s |
| 1-3 words | 2-3s |
| 4-10 words | 3-4s |
| 11-20 words | 4-6s |
| 21-35 words | 6-8s |

Present the scene plan to the user and wait for approval before building.

## Step 4: Build Composition

Read these references before building (always):
- `references/motion-principles.md` — GSAP rules that prevent silent render failures
- `references/video-composition.md` — density, colour, scale for video medium
- `references/beat-direction.md` — per-scene direction methodology
- `references/transitions.md` — transition selection and implementation

For specific needs, also read:
- `references/captions.md` — if composition includes synced text/subtitles
- `references/techniques.md` — for SVG, Canvas, 3D, kinetic type, Lottie, etc
- `references/narration.md` — if composition includes voiceover

### Layout-First Method (Non-Negotiable)

For each scene:

1. **Identify the hero frame** — moment when most elements are simultaneously visible
2. **Build static CSS** — position everything at its most-visible state. Flexbox centering
   on wrappers, never CSS transforms for layout
3. **Add entrances** — `gsap.from()` animating FROM offscreen TO CSS position
4. **Add mid-scene motion** — minimum 2 patterns per scene (breathing, counters, Ken Burns, sweeps)
5. **No exit animations** except on final scene

### Composition Structure

```html
<!-- Root composition — NO <template> wrapper -->
<div data-composition-id="root" data-width="1920" data-height="1080">
  <div id="s1" class="scene clip" data-start="0" data-duration="3" data-track-index="0">
    <div class="scene-content">
      <!-- content here -->
    </div>
    <!-- decoratives (glows, grain, vignette) outside scene-content -->
  </div>
</div>
```

### Timeline Contract

```javascript
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
// ... tweens ...
window.__timelines["main"] = tl; // key MUST match data-composition-id
```

### Data Attributes

| Attribute | Required | Purpose |
|-----------|----------|---------|
| `data-composition-id` | Yes | Unique composition ID |
| `data-width` / `data-height` | Yes | Pixel dimensions |
| `data-start` | Yes | When clip appears (seconds) |
| `data-duration` | Yes | How long clip stays visible |
| `data-track-index` | Yes | Timeline track number |

### Animation Hard Rules

- Animate ONLY: `opacity`, `x`, `y`, `scale`, `rotation`, `color`, `backgroundColor`, transforms
- NEVER animate: `visibility`, `display`, media controls
- No `Math.random()`, `Date.now()`, `repeat: -1`, async timeline construction
- Offset first tween 0.1-0.3s (not t=0)
- Use 3+ different eases per scene
- Prefer `.fromTo()` over `.from()` in clip scenes (Rule 3 from motion-principles)
- Never stack transform tweens on same element (split to parent/child)
- All ambient effects on `tl.to()`, never standalone `gsap.to()`

### Scene Visibility (Critical for Shaders)

- Scene 1: no inline style (visible from t=0)
- Non-anchor scenes: `style="visibility:hidden;"` with `autoAlpha` toggles
- Anchor scenes (in shader array): `style="opacity:0;"`, shader manages opacity
- First anchor in each shader group: explicit `tl.set({opacity: 1})`

### Transition Selection

**The 5% Rule:** ~95% of scene changes are hard cuts. Reserve shader transitions for
2-3 key moments: hero reveal, energy shift, CTA.

14 built-in shaders by mood:
- **Calm:** `cross-warp-morph`, `light-leak`, `domain-warp`
- **Medium:** `cinematic-zoom`, `whip-pan`, `sdf-iris`
- **High:** `glitch`, `chromatic-split`, `ridged-burn`
- **Ethereal:** `gravitational-lens`, `ripple-waves`, `swirl-vortex`

Shader placement: `transition.time = scene_boundary - (transition.duration / 2)`

Read `references/transitions.md` for the full catalog, CSS vs shader rules, and
shader-compatible CSS constraints.

### Visual Density

Every scene needs 8-10 visual elements across three layers:
1. **Background** — radial glow, ghost type, colour panel, grain (never flat solid)
2. **Midground** — core message via cards, stats, code blocks
3. **Foreground** — dividers, labels, data bars, metadata

"A beat with 3 elements looks empty. A beat with 8-10 feels alive."

### Mid-Scene Motion (No Static Slides)

Every visible element must keep moving after entrance. Patterns:
- Counter animation (numbers counting up)
- Ken Burns zoom on images (scale 1 -> 1.03)
- Breathing float (`y: -5, yoyo: true`)
- Bar chart sequential fills
- Character stagger on text
- Background glow pulses
- Accent sweeps across text

## Step 5: Validate

Run all quality checks:

```bash
npx hyperframes lint          # Structural validation
npx hyperframes validate      # WCAG contrast audit
npx hyperframes inspect       # Overflow detection
```

Fix any issues before previewing.

## Step 6: Preview and Iterate

```bash
npx hyperframes preview       # Live browser preview with HMR
```

Tell the user to preview and provide feedback. Iterate with small targeted edits — don't
re-prompt from scratch.

## Step 7: Render

```bash
npx hyperframes render --quality standard --output final.mp4
```

| Quality | Use case |
|---------|----------|
| `draft` | Fast iteration |
| `standard` | Review (CRF 18, visually lossless) |
| `high` | Final delivery |

For transparent output: `--format webm` or `--format mov` (ProRes 4444).
For CI consistency: `--docker`.

Copy the rendered file to `~/Downloads/` and show the absolute path.

## Step 8: Collect Feedback

Ask: "How does the video look? Any adjustments to pacing, transitions, or motion?"

Log feedback to `context/learnings.md` under `## viz-hyperframes` with date and context.

If the user flags an issue with the output — wrong approach, bad format, missing context,
incorrect tone — update the `## Rules` section in this SKILL.md immediately with the
correction. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.

## Rules

- Always establish design system before writing any composition
- Layout-first: static CSS positioning before any GSAP animation
- No element may appear fully-formed — every element animates in
- No exit animations except on final scene
- The 5% rule: hard cuts for most transitions, shaders for 2-3 key moments
- Minimum 2 mid-scene animation patterns per scene — no static slides
- 8-10 visual elements per scene across 3 depth layers
- Video-scale typography: 60px+ headlines, 20px+ body
- No AI-cliche fonts (Inter, Roboto, Poppins, Syne)
- Never use `Math.random()`, `Date.now()`, or `repeat: -1`
- All timelines synchronous, paused, registered on `window.__timelines`
- Prefer `.fromTo()` over `.from()` in clip scenes
- Never stack transforms on the same element
- All ambient effects on timeline (`tl.to()`), never standalone `gsap.to()`
- Grain via CSS radial-gradient, never SVG filter data URLs
- No linear gradients on dark backgrounds (H.264 banding) — use radial

## Self-Update

If the user flags an issue with the output — wrong approach, bad format, missing context,
incorrect tone — update the `## Rules` section in this SKILL.md immediately with the
correction, dated as `{YYYY-MM-DD}: {rule}`.

## Troubleshooting

- **Black frame on scene 1:** Check script load order and `__timelines` key match
- **Blink at shader transition:** Check for exit tweens before transition or duration < 0.3s
- **Scene disappears mid-video:** Verify `autoAlpha` toggles on non-anchor scenes tile end-to-end
- **Animation frozen in render:** Ambient effects using standalone `gsap.to()` don't seek — move to timeline
- **Banding on dark gradients:** Switch from linear to radial gradient or use solid + localized glow
- **Shader texture artifacts:** Check for `transparent` keyword in gradients, CSS variables, or thin gradient elements
