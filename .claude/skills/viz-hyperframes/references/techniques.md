# Visual Techniques

11 production-proven motion design techniques. Compositions should use 2-3 minimum.

## 1. SVG Path Drawing
Paths animate as if hand-drawn via `stroke-dasharray` and `stroke-dashoffset`.
Calculate values dynamically: `path.getTotalLength()`.

## 2. Canvas 2D Procedural Art
Frame-by-frame noise, particle fields, data viz. Use GSAP proxy with deterministic hash
functions (never `Math.random()`).

## 3. CSS 3D Transforms
Perspective rotations for product displays and card flips. Needs `perspective` on parent
and `transform-style: preserve-3d` on children.

## 4. Per-Word Kinetic Typography
Words appear sequentially, synced to transcript timestamps. Cascading slide decay
(80->12px) mimics camera settlement. Core technique for narration-driven content.

## 5. Lottie Animation
Vector animations via dotlottie-player or lottie-web. For logos, characters, icons.
Add GSAP entry animations on top.

## 6. Video Compositing
Real footage with `muted playsinline`. Playback controlled by runtime -- never call `play()`.

## 7. Character-by-Character Typing
Terminal typing via `tl.call()` for per-character updates. Blinking cursor: `ease: "steps(1)"`.

## 8. Variable Font Axis Animation
Real-time glyph reshaping via `font-variation-settings`. Animate optical size, weight axes.

## 9. GSAP MotionPathPlugin
Elements follow SVG paths. For guided reveals, curved trajectories, slider animations.

## 10. Velocity-Matched Transitions
Paired eases (`.in` exits, `.out` entries) create continuous motion across cuts.

## 11. Audio-Reactive Animation
Properties driven by extracted audio frequency bands. Pre-extract via Python to JSON.
Subtle: 3-5% scale on text, 10-30% on backgrounds. No visualiser cliches.

## Recommended Combinations

| Video Type | Techniques |
|-----------|------------|
| High-impact promos | Per-word typography + velocity transitions + counters |
| Cinematic narratives | SVG drawing + video compositing + 3D transforms |
| Technical tutorials | Character typing + Canvas procedural + MotionPath |
| Premium luxury | Variable fonts + Lottie + slow transitions |
| Data-focused | Canvas procedural + counters + SVG paths |
