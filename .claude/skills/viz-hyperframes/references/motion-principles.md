# Motion Principles

Load-bearing GSAP rules that prevent silent failures in the capture engine's non-linear seeking.

## Guardrails

1. **Ease variation** — limit identical eases to 2 per scene maximum
2. **Speed diversity** — slowest scenes 3x slower than fastest; don't default all to 0.4-0.5s
3. **Directional variety** — vary entry sources (left, right, scale, opacity-only, letter-spacing)
4. **Stagger rhythm** — each scene needs distinct stagger patterns
5. **Ambient motion** — different types per scene (pan, rotation, scale, color shift, stillness)
6. **Timeline offset** — first animation at 0.1-0.3s delay; t=0 creates jump-cut sensation

## Easing Philosophy

Easing carries semantic weight:

| Feeling | Ease | Duration |
|---------|------|----------|
| Smooth / Natural | `power2.out` | 0.4-0.6s |
| Snappy / Decisive | `power4.out` | 0.2-0.3s |
| Bouncy / Playful | `back.out(1.6)` | 0.3-0.5s |
| Dramatic / Cinematic | `expo.out` | 0.3-0.5s |
| Dreamy / Luxury | `sine.inOut` | 0.5-0.8s |
| Mechanical / Technical | `steps(5)` | 0.3-0.5s |
| Springy / Elastic | `elastic.out(1, 0.5)` | Sparingly |

**Directional conventions (non-negotiable):**
- `.out` for entrances (fast start, deceleration)
- `.in` for exits (slow start, acceleration away)
- `.inOut` for repositioning between states

## Speed Communicates Weight

- 0.15-0.3s: energy, urgency, confidence
- 0.3-0.5s: professional baseline
- 0.5-0.8s: gravity, luxury, contemplation
- 0.8-2.0s: cinematic, emotional, atmospheric

## Scene Structure: Build/Breathe/Resolve

- **Build (0-30%):** Staggered element entrances, not simultaneous
- **Breathe (30-70%):** Visible content with single ambient motion
- **Resolve (70-100%):** Exit or decisive conclusion

## Choreography as Hierarchy

First-moving elements appear most important. Stagger by significance (not DOM order), overlap entries, keep total sequences under 500ms regardless of item count.

## Asymmetry Rule

Entrances longer than exits: card takes 0.4s to appear but 0.25s to disappear.

## Image Motion Treatment

- **Perspective tilt:** `gsap.set(el, { transformPerspective: 1200, rotationY: -8 })` with box-shadow
- **Ken Burns zoom:** Scale 1 -> 1.04 over beat duration
- **Device frames:** CSS border-radius and box-shadow wrapping
- **Floating UI:** Extract key elements at different z-depths for parallax
- **Scroll reveal:** Clip images to viewport window, animate y position

## Load-Bearing GSAP Rules

### Rule 1: No iframes for captured content
Iframes do not seek deterministically. Use screenshot stacks instead.

### Rule 2: Never stack transform tweens on same element
Multiple transforms cause `immediateRender: true` conflicts.

```javascript
// BAD
tl.from(".hero", { y: 50, opacity: 0, duration: 0.6 }, 0);
tl.to(".hero", { scale: 1.04, duration: beat }, 0);

// GOOD A: single tween
tl.fromTo(".hero",
  { y: 50, opacity: 0, scale: 1.0 },
  { y: 0, opacity: 1, scale: 1.04, duration: beat }, 0);

// GOOD B: parent/child split
tl.from(".hero-wrap", { y: 50, opacity: 0, duration: 0.6 }, 0);
tl.to(".hero", { scale: 1.04, duration: beat }, 0);
```

### Rule 3: Prefer `.fromTo()` over `.from()` in clip scenes
`gsap.from()` sets `immediateRender: true` by default, writing the "from" state at timeline
construction before the clip's `data-start` is active. Explicit `fromTo` ensures deterministic
state at every position.

### Rule 4: Ambient pulses attach to seekable timeline
Standalone `gsap.to()` runs on wallclock time and doesn't scrub with capture engine.
All ambient effects must use `tl.to()`.

### Bonus: Hard-kill scene boundaries
Apply deterministic `tl.set()` kills after fade-outs to prevent resurrection by subsequent
tweens or `immediateRender` side effects.
