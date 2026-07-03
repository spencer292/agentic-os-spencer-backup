# Scene Transitions

A transition tells the viewer how two scenes relate. Choose transitions that match what the
content is doing emotionally, not just technically.

## Animation Rules (Non-Negotiable)

1. **Every composition uses transitions.** No jump cuts.
2. **Every scene uses entrance animations.** Elements animate IN via `gsap.from()`.
3. **Exit animations BANNED** except on final scene. The transition IS the exit.
4. **Final scene exception:** May fade elements out (e.g., to black).

## Energy -> Transition Type

| Energy | CSS Primary | Shader Primary | Duration | Easing |
|--------|-------------|----------------|----------|--------|
| **Calm** | Blur crossfade, focus pull | Cross-warp morph, thermal distortion | 0.5-0.8s | `sine.inOut`, `power1` |
| **Medium** | Push slide, staggered blocks | Whip pan, cinematic zoom | 0.3-0.5s | `power2`, `power3` |
| **High** | Zoom through, overexposure | Ridged burn, glitch, chromatic split | 0.15-0.3s | `power4`, `expo` |

Pick ONE primary (60-70% of changes) + 1-2 accents. Never a different transition per scene.

## Mood -> Transition Type

| Mood | Options | Why |
|------|---------|-----|
| **Warm / inviting** | Light leak, blur crossfade, thermal distortion, cross-warp morph | Soft edges, warm washes |
| **Cold / clinical** | Squeeze, zoom out, gravitational lens | Mechanical compression |
| **Editorial / magazine** | Push slide, vertical push, whip pan | Like turning a page |
| **Tech / futuristic** | Grid dissolve, staggered blocks, glitch, chromatic split | Digital data patterns |
| **Dramatic / cinematic** | Zoom through, gravity drop, cinematic zoom, domain warp | Scale, weight, light |
| **Premium / luxury** | Focus pull, blur crossfade, cross-warp morph | Restraint, organic flow |
| **Playful / fun** | Elastic push, circle iris, ripple waves, swirl vortex | Bounce, rotation |
| **Tense / edgy** | Glitch, chromatic aberration, ridged burn, domain warp | Instability, distortion |

## Narrative Position

| Position | Use | Duration |
|----------|-----|----------|
| **Opening** | Most distinctive transition | 0.4-0.6s |
| **Between related points** | Primary transition, consistent | 0.3s |
| **Topic change** | Different from primary — signals "new section" | 0.3-0.5s |
| **Climax / hero reveal** | Boldest accent, fastest or most dramatic | 0.2-0.4s |
| **Wind-down** | Return to gentle (blur crossfade) | 0.5-0.7s |
| **Outro** | Slowest, simplest (crossfade, dip to black) | 0.6-1.0s |

## Presets

| Preset | Duration | Easing |
|--------|----------|--------|
| `snappy` | 0.2s | `power4.inOut` |
| `smooth` | 0.4s | `power2.inOut` |
| `gentle` | 0.6s | `sine.inOut` |
| `dramatic` | 0.5s | `power3.in` -> out |
| `instant` | 0.15s | `expo.inOut` |
| `luxe` | 0.7s | `power1.inOut` |

## CSS vs Shader

CSS transitions animate scene containers with opacity, transforms, clip-path, and filters.
Shader transitions composite both scene textures per-pixel on a WebGL canvas.

**Both are first-class.** When a composition uses shader transitions, ALL transitions in that
composition should be shader-based. Don't mix CSS and shader in the same composition.

## Shader-Compatible CSS Rules

When using shaders, these rules prevent artifacts at transition boundaries:

1. No `transparent` keyword in gradients — use target colour at zero alpha
2. No gradient backgrounds on elements thinner than 4px — use solid colour
3. No CSS variables (`var()`) on elements visible during capture — use literal values
4. Mark uncapturable elements with `data-no-capture`
5. No gradient opacity below 0.15
6. Every `.scene` div needs explicit `background-color` AND matching `bgColor` in `init()` config

## Category Reference

| Category | CSS | Shader |
|----------|-----|--------|
| Push/slide | Push slide, vertical push, elastic push | Whip pan |
| Scale/zoom | Zoom through, zoom out, gravity drop | Cinematic zoom, gravitational lens |
| Reveal/mask | Circle iris, diagonal split, clock wipe | SDF iris |
| Dissolve | Crossfade, blur crossfade, focus pull | Cross-warp morph, domain warp |
| Cover | Staggered blocks, blinds | -- |
| Light | Light leak, overexposure, film burn | Light leak, thermal distortion |
| Distortion | Glitch, chromatic aberration, ripple | Glitch, chromatic split, ridged burn, ripple waves, swirl vortex |
