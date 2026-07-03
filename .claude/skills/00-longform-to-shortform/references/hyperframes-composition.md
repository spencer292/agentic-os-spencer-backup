# HyperFrames Composition Template for L2S Clips

Reference for building HTML+CSS+GSAP compositions that render L2S short-form clips via `viz-hyperframes`. Claude generates the HTML dynamically per clip from word timestamps and pipeline config.

---

## Root Composition

- Canvas: 1080x1920 (9:16 portrait)
- Duration: clip length in seconds (from reframed clip metadata)
- FPS: 30
- Timeline name: `l2s-clip`

**Required root wrapper.** All layer elements must be nested inside this div. HyperFrames lint requires `data-composition-id`, `data-width`, `data-height` on the outermost element.

```html
<div id="l2s-clip"
  data-composition-id="l2s-clip"
  data-width="1080"
  data-height="1920"
  data-fps="30"
  data-duration="{clip_duration_seconds}"
  style="position:relative; width:1080px; height:1920px; overflow:hidden; background:#000;">

  <!-- All layer elements go inside this wrapper -->

</div>
```

## Font Loading

Include a system font fallback in every `font-family` declaration:
```css
font-family: 'Montserrat', 'Arial Black', 'Helvetica Neue', sans-serif;
```

If Montserrat is installed locally, skip the Google Fonts `@import`. HyperFrames' Playwright instance uses locally installed fonts.

---

## Layer Stack (z-index bottom to top)

### Video Base (z: 0)

```html
<video id="base-video" src="./reframed-clip.mp4" muted
  data-start="0" data-duration="{clip_duration_seconds}"
  style="position:absolute; top:0; left:0; width:1080px; height:1920px; object-fit:cover; z-index:0;">
</video>
```

Copy the reframed clip into the HyperFrames project directory. The video element is muted — HyperFrames handles audio muxing from the source video automatically. `data-start` and `data-duration` are required for HyperFrames to own playback.

### Captions (z: 10)

Word-level timestamps from transcription drive per-word highlight animation.

**Phrase grouping:** Split words into 3-4 word phrase groups. Only the phrase-group div gets `class="clip"` — individual word spans do NOT need it. Word spans are always visible within their phrase group; only their color changes.

**Vertical position depends on reframe mode:**

| Reframe mode | Subtitle `top` | Why |
|-------------|---------------|-----|
| Talking head (single 9:16 crop) | `75%` (lower third) | Keeps subtitles below the face, standard short-form placement |
| Split screen (screen + face) | `50%` (center) | Sits at the panel boundary between screen content and face zoom |

When a clip has mixed modes (e.g. talking head 0–41s then split screen 41–50s), set `top` per phrase group based on whether its `data-start` falls before or after the mode transition timestamp.

```html
<!-- Talking-head phrase: lower third -->
<div class="clip phrase-group" id="phrase-1"
  data-start="1.2" data-duration="1.0"
  style="position:absolute; top:75%; left:50%;
         font-family:'Montserrat','Arial Black','Helvetica Neue',sans-serif;
         font-size:80px; font-weight:800;
         color:#FFFFFF; text-shadow:0 4px 12px rgba(0,0,0,0.7);
         z-index:10;">
  <span class="word" id="w-1" data-start="1.2" data-duration="0.3">Every</span>
  <span class="word" id="w-2" data-start="1.5" data-duration="0.3">single</span>
  <span class="word" id="w-3" data-start="1.8" data-duration="0.4">skill</span>
</div>

<!-- Split-screen phrase: center -->
<div class="clip phrase-group" id="phrase-20"
  data-start="42.0" data-duration="1.0"
  style="position:absolute; top:50%; left:50%; ...">
  ...
</div>
```

**Centering:** Use `gsap.set()` for initial positioning instead of CSS `transform` (which conflicts with GSAP tweens):

```js
gsap.set(".phrase-group", { xPercent: -50, yPercent: -50 });
```

**GSAP timeline:** For each phrase group, tween word `color` from white to `highlight_color` at `data-start`, back to white at word end. Do NOT use opacity tweens on phrase groups — `class="clip"` handles visibility.

```js
const tl = window.__timelines["l2s-clip"];

// Phrase 1 — only color tweens, no opacity
tl.to("#phrase-1 .word:nth-child(1)", { color: "#F8D481", duration: 0.15 }, 1.2);
tl.to("#phrase-1 .word:nth-child(1)", { color: "#FFFFFF", duration: 0.15 }, 1.5);
tl.to("#phrase-1 .word:nth-child(2)", { color: "#F8D481", duration: 0.15 }, 1.5);
// ... continue for each word
```

**Config mapping:**
- `editing.subtitle_font` -> `font-family`
- `editing.subtitle_size` -> `font-size` (px)
- `editing.highlight_color` -> highlight tween target color
- `editing.subtitle_box_style: "backed"` -> add `background: rgba(0,0,0,0.6); border-radius: 12px; padding: 8px 24px;` to phrase group

### Hook Text (z: 20)

Use a Flexbox wrapper for centering to avoid CSS `transform` conflicts with GSAP:

```html
<div id="hook-wrapper"
  style="position:absolute; top:0; left:0; width:100%; height:640px;
         display:flex; align-items:center; justify-content:center;
         z-index:20; pointer-events:none;">
  <div id="hook-text"
    style="font-family:'Montserrat','Arial Black','Helvetica Neue',sans-serif;
           font-size:96px; font-weight:900;
           color:#FFFFFF; text-align:center; width:90%;
           text-shadow:0 6px 20px rgba(0,0,0,0.8);
           opacity:0;">
    The hook text here
  </div>
</div>
```

**Animation:** Use `gsap.set()` for initial scale:

```js
gsap.set("#hook-text", { scale: 0.8 });
tl.to("#hook-text", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)" }, 0);
tl.to("#hook-text", { opacity: 0, duration: 0.5 }, 3.0);
```

### Speaker Card (z: 30)

Lower-third name card. Only if `speaker_card_enabled: true` and speaker name exists. Use a Flexbox wrapper for horizontal centering:

```html
<div id="speaker-card-wrapper"
  style="position:absolute; bottom:180px; left:0; width:100%;
         display:flex; justify-content:center; z-index:30;">
  <div id="speaker-card"
    style="background:rgba(0,0,0,0.7); backdrop-filter:blur(12px);
           border-radius:16px; padding:16px 32px;
           font-family:'Montserrat','Arial Black','Helvetica Neue',sans-serif;
           font-size:36px; font-weight:600;
           color:#FFFFFF; opacity:0;">
    <div class="speaker-name">Speaker Name</div>
    <div class="speaker-handle" style="font-size:24px; color:rgba(255,255,255,0.7);">@handle</div>
  </div>
</div>
```

```js
gsap.set("#speaker-card", { y: 20 });
tl.to("#speaker-card", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.5);
tl.to("#speaker-card", { opacity: 0, y: 20, duration: 0.4 }, 4.0);
```

### Illustrations (z: 40)

Overlay illustration PNGs at timed moments from `moments.json`.

**Spotlight mode** (`illustration_mode: "spotlight"`):
```html
<div class="clip illustration-overlay" id="illust-1"
  data-start="{moment_start}" data-duration="{moment_duration}"
  style="position:absolute; top:0; left:0; width:100%; height:100%;
         background:rgba(0,0,0,0.5); z-index:40;
         display:flex; align-items:center; justify-content:center;">
  <img src="./illustrations/moment-1.png"
    style="width:800px; height:800px; object-fit:contain;">
</div>
```

**Float mode** (`illustration_mode: "float"`):
```html
<img class="clip illustration-float" id="illust-1"
  data-start="{moment_start}" data-duration="{moment_duration}"
  src="./illustrations/moment-1.png"
  style="position:absolute; top:120px; width:280px; height:280px;
         object-fit:contain; z-index:40;">
```

### CTA Overlay (z: 50)

End-screen call-to-action. Only if `cta_enabled: true`.

```html
<div id="cta-overlay"
  style="position:absolute; bottom:0; left:0; width:100%; height:auto;
         background:linear-gradient(transparent, rgba(0,0,0,0.85));
         padding:60px 40px 80px; text-align:center;
         opacity:0; z-index:50;">
  <div style="font-family:'Montserrat','Arial Black','Helvetica Neue',sans-serif;
              font-size:40px; font-weight:700; color:#FFFFFF;">
    Watch the full video
  </div>
  <div style="font-size:28px; color:rgba(255,255,255,0.7); margin-top:12px;">
    @handle
  </div>
</div>
```

```js
gsap.set("#cta-overlay", { yPercent: 100 });
const ctaStart = clipDuration - ctaDuration;
tl.to("#cta-overlay", { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, ctaStart);
```

---

## Layout-Specific Caption Positioning

| Layout | Caption CSS | Hook CSS |
|--------|------------|----------|
| `face-track` | `bottom: 350px; text-align: center;` | Flexbox centered (wrapper above) |
| `cursor-track` | `bottom: 350px; text-align: center;` | Flexbox centered (wrapper above) |
| `split-screen` | `top: 50%; left: 50%;` (with `gsap.set` xPercent/yPercent) | `top: 320px; text-align: center;` |

---

## Audio Handling

Do NOT add audio tracks in the HTML composition. HyperFrames automatically extracts audio from the `<video>` source and muxes it into the final render.

---

## HyperFrames Lint Checklist

Before running `npx hyperframes lint`, verify:

1. Root wrapper div has: `data-composition-id`, `data-width`, `data-height`
2. `<video>` element has: `data-start="0"`, `data-duration="{clip_duration}"`
3. Timed layer elements (phrase groups, illustrations) use `class="clip"` with `data-start`/`data-duration`
4. Use `data-duration` NOT `data-end` on all timed elements
5. NO CSS `transform` on elements that GSAP also animates — use `gsap.set()` or Flexbox wrappers
6. GSAP timeline name matches `data-composition-id` on the root wrapper
7. All `gsap.to()` calls are on the named timeline, not standalone
8. Every element with `data-start` has a unique `id` attribute

---

## Timeline Contract

The composition must expose a single paused GSAP timeline:

```js
window.__timelines = window.__timelines || {};
window.__timelines["l2s-clip"] = gsap.timeline({ paused: true });
```

HyperFrames advances this timeline frame-by-frame during render. All animations must be on this timeline — no independent `gsap.to()` calls outside it. `gsap.set()` calls for initial state are fine since they are instant.
