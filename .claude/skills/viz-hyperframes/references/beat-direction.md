# Beat Direction

How to plan and direct individual scenes (beats) in a multi-scene composition.
Read before writing any multi-scene video.

## Per-Beat Direction

Describe what viewers perceive, not technical properties. Each beat needs four components:

### 1. Concept
2-3 sentences: visual world, driving metaphor, emotional impact.

### 2. Mood Direction
Cultural and design touchstones, not colour specs.
- "Geometric, rhythmic, precise. Think Josef Albers or Bauhaus colour studies."
- "Cinematic title sequence. The kind of opening where you lean forward."

### 3. Animation Choreography

Every element needs a defined motion verb:

| Energy | Verbs |
|--------|-------|
| **High** | SLAMS, CRASHES, PUNCHES, STAMPS, SHATTERS |
| **Medium** | CASCADE, SLIDES, DROPS, FILLS, DRAWS |
| **Low** | types on, FLOATS, morphs, COUNTS UP, fades in |

### 4. Transition

**Shader transitions** for: reveals, energy shifts, "wow" moments, brand unveils.

**CSS transitions** for: continuous camera-motion beats, editorial pacing, shared motion vocabulary.

**Hard cuts** for: rapid-fire lists, percussive edits, comedic timing, sequences of 3+ quick switches.

Rule of thumb: centerpiece beats get shaders; connective beats get CSS or hard cuts.

#### CSS Transition Examples
- **Velocity-matched upward:** exit `y:-150, blur:30px, 0.33s power2.in` -> entry `y:150->0, blur:30px->0, 1.0s power2.out`
- **Whip pan:** exit `x:-400, blur:24px, 0.3s power3.in` -> entry `x:400->0, blur:24px->0, 0.3s power3.out`
- **Blur through:** exit `blur:20px, 0.3s` -> entry `blur:20px->0, 0.25s power3.out`
- **Zoom through:** exit `scale:1->1.2, blur:20px, 0.2s power3.in` -> entry `scale:0.75->1, blur:20px->0, 0.5s expo.out`

### 5. Depth Layers
Minimum two layers per beat.
Example: "BG: dark navy + subtle radial glow. MG: stat cards with drop shadow. FG: brand logo bottom-right."

## Rhythm Planning

Before implementation, declare scene rhythm as a pattern:

| Video Type | Pattern |
|---|---|
| Social ad (15s) | hook-PUNCH-hold-CTA |
| Product demo (30-60s) | slow-build-BUILD-PEAK-breathe-CTA |
| Launch teaser (10-20s) | SLAM-proof-SLAM-hold |
| Brand reel (20-45s) | drift-build-PEAK-drift-resolve |

## Velocity-Matched Transitions

Exit animations use accelerating eases (`power2.in`, `power3.in`) with blur ramping.
Entry animations use decelerating eases (`power2.out`, `power3.out`) with blur clearing.
Fastest point of both curves aligns at the cut. Exit and entry velocities match within ~5%.
