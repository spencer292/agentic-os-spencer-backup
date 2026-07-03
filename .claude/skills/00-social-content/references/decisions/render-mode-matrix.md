# Decision: Render mode

**Owner:** `ssc-designer` (v2.0.0). The designer picks the render mode per slide during Phase 5.3b (initial assignment) and Phase 5.7 (promotion after source resolution). The `ssc-image-generator` honors the chosen mode — it does NOT re-decide. The only override allowed at execution time: `FULL_AI` → `HYBRID_AI` when the headline fails sanitization.

For every slide the designer picks **how the background gets composed and whether text is baked into the image.** There are five modes — picked per slide, not per carousel.

## Mode definitions

| Mode | Background origin | Text on slide | When the AI runs | Typical example |
|------|-------------------|---------------|------------------|-----------------|
| `TEMPLATE` | Solid color / typographic composition | HTML template only (large headline + body + optional icons/dividers) | Never | A statement slide. Just words, weights, and a small icon — editorial-magazine feel. |
| `HYBRID_REAL` | Real image (icon, logo, user asset, web-search result, video frame) — used **as-is** | HTML template overlays | Never | "Tool A × Brand B" comparison slide where two brand logos sit in a frame; a news slide using a real press photo of a named figure. |
| `HYBRID_FROM_REAL` | Real image → AI transforms it (image-to-image via `--input-image`) | HTML template overlays | AI modifies an existing photo (does not invent from scratch) | "From villain to hero" panel using the real person's photo, AI restyles to heroic pose; product photo with background removed + recomposed scene. |
| `HYBRID_AI` | AI generates the background from a prompt | HTML template overlays | Yes, full generation | Abstract concept slide with no real reference photo available. |
| `FULL_AI` | AI generates the whole slide | Text baked **into** the AI image | Yes, including text fidelity | Strictly gated — only social-design archetypes that hold short headlines well (≤ 8 words, ≤ 60 chars), only slide 1 of a carousel. |

Legacy aliases: `HYBRID` → `HYBRID_AI`, `AI` → `FULL_AI`. The orchestrator normalizes these to the new names before dispatch.

## Decision tree (per slide)

Read top to bottom — stop at the first match.

```
1. image_zone == "none"?                                                          → TEMPLATE
2. Slide's `image_concept` resolves to a REAL asset via image-source-matrix?
   (icon library / user asset / video frame / tool-image-search)
   a. AI restyling would clearly improve the result (wrong tone, wrong context,
      needs background removal, pose change, character transformation)?           → HYBRID_FROM_REAL
   b. The real image works as-is                                                  → HYBRID_REAL
3. Slide is eligible for FULL_AI (see eligibility)?                               → FULL_AI
4. Default for any remaining slide that needs an image                            → HYBRID_AI
```

The new step **2.a** is the meat of this refactor — before falling to AI generation, ask whether a real image (cheaper, more authentic) exists and whether AI-modifying it produces a better story-fit than generating from scratch.

## When `HYBRID_FROM_REAL` beats the alternatives

`HYBRID_FROM_REAL` is the right call when **a real photo carries the truth of the story but its current state doesn't fit the slide's emotional or narrative role.** Examples:

| Caption beat | Real image available | What AI does | Result |
|---|---|---|---|
| "From villain to hero" | Press photo of the person looking grim | Restyle into a heroic pose / dramatic light | Keeps the recognizable face, fits the slide's arc |
| "His stage isn't what you think" | Photo of a normal-looking room | Composite into a dramatic stage with lighting | Anchored in something real, but on-tone |
| "The product, unboxed" | Product photo on white | Background removal → composite into a richer scene | Real product, real shape, on-brand context |
| "He didn't hide" | Press photo of the figure facing a crowd | Keep the face, restyle into editorial black-and-white | Looks shot by a press photographer, not by an AI |
| "Two worlds collide" | Logo A + Logo B as flat assets | Composite together with depth + shadow + dotted bg | Editorial-tech style: brand logos as the visual punchline |

Default rule: **if the post is about a real person, event, product, or brand and a usable real image is found by image-source-matrix, prefer `HYBRID_REAL` first. Only escalate to `HYBRID_FROM_REAL` when the slide's emotional intent demands a transformation that the original photo cannot deliver.** Never escalate "just to make it look prettier" — that's the road back to AI-cliché images.

## FULL_AI eligibility (unchanged but tightened)

All of these must be true:

- `style == social-design` AND archetype is in `{03, 05, 09, 17, 20, 23}` (text-baking friendly).
- Slide is **slide 1 of a carousel** OR a single-image post.
- Headline ≤ 8 words AND ≤ 60 characters.
- Headline passes sanitization: no leading hyphens, no curly quotes, no ellipses, no emoji, no leftover brand placeholders.
- No body text — FULL_AI handles headline only.
- **The brand_name (if any) is not allowed in the prompt as a literal string.** If `brand_context/voice-profile.md` has no defined display_name, the slide's text MUST NOT include any placeholder like `[Brand Name]`, `@brand`, or any guessed handle. The brand handle is rendered later by the template, never baked into the AI image.

Any failure → fall back to `HYBRID_AI` and log the reason in `pipeline-log.md`.

## Why this matters (the brand-name-leak bug)

A past run came back with the brand placeholder baked as visible text directly inside the AI image — even though the slide was supposed to be `HYBRID_AI`, not `FULL_AI`. Root cause: the brand_name leaked into the mood block injected into the prompt, and the image model rendered it as a sign/title in the scene. The fix is enforced at three layers:

1. **Render-mode-matrix (here):** `HYBRID_AI` MUST end its prompt with the strict no-text guard. The orchestrator never sends brand_name to AI prompts — it lives only in the HTML template render step.
2. **ssc-image-generator Step 5.5a:** mood block is sanitized — strip any occurrence of the brand_name before injecting.
3. **Onboarding / config:** brand_name is empty string when no voice-profile exists. No placeholders allowed (see `feedback_visual_consistency` memory).

## Per-slide decision log format

```
- Slide N:
    Render mode: HYBRID_FROM_REAL
    Reasoning: image_concept resolved to a real press photo of the named public figure via tool-image-search
               (intent=news); base photo shows them in a neutral pose — slide's emotional role is "moved",
               needs editorial B&W treatment, so AI transforms the original photo rather than generating
               from scratch.
    Original mode considered: HYBRID_REAL (rejected — base photo tonally too neutral for the slide's arc beat)
    Original mode considered: HYBRID_AI (rejected — would lose the face recognition, falls to generic stock vibe)
```
