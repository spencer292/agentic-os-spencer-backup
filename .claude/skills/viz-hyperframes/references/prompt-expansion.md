# Prompt Expansion

Mandatory preprocessing step that enriches user briefs into production-ready scene specs.
Runs after design direction is established, before scene construction.

## Purpose

Transforms seed prompts into detailed per-scene breakdowns grounded against:
- `design.md` (brand colours, fonts, mood constraints)
- `beat-direction.md` (scene planning format)
- `house-style.md` (background layers, motion, typography rules)

The expansion is never pass-through. Even detailed briefs lack atmosphere layers, secondary
motion, micro-details, and exact transition choreography.

## Required Output Sections

1. **Title + style block** -- cite exact hex values and font names from design.md
2. **Rhythm declaration** -- establish pacing (e.g., "hook-PUNCH-breathe-CTA")
3. **Global rules** -- parallax, micro-motion, transition style
4. **Per-scene beats** -- concept, mood, depth layers (8-10 elements), animation choreography
   with specific verbs, transition parameters
5. **Recurring motifs** -- visual threads across scenes
6. **Negative prompt** -- constraints to avoid

## Delivery

Write output to `.hyperframes/expanded-prompt.md` in the project directory.
Inform the user of scene count, duration, and specific elements.
Pause for approval before proceeding to construction.

## Expansion Adds

- Atmosphere layers (background glows, grain, ghost type)
- Secondary motion (breathing, floating, pulsing)
- Micro-details (data labels, accent lines, metadata)
- Exact transition choreography with shader/CSS selection
- Depth layer assignments for each scene
