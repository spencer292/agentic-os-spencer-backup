# Input: Text already provided (Scenarios A + E)

Use when the caption text is already final — either pasted by the user (A) or being repurposed from an existing post (E). No drafting phase needed for the text; the pipeline still runs **content inference + visual planning** so the images aren't generated blind.

## Detection signals

| Scenario | Trigger pattern |
|----------|-----------------|
| A — images only | Full post text + "just the image(s)" / "generate image" / "image for this post" |
| E — repurpose | References existing post + "adapt for" / "repurpose" / "version for" / "convert to" |

## Phase 3 logic

### Scenario A
1. Store the trigger's post body as `post_text`.
2. Skip Phase 4 (briefing) — trigger already carries enough intent.
3. Continue to Phase 5.0 (content inference on `post_text`) so the designer has `inferred_entities`, `inferred_palette`, `inferred_typography` to work with.
4. Then Phase 5.0.5+5.3+5.7 (designer) → Phase 5.5 (preview) → Phase 7 (images).

### Scenario E
1. Identify source: pasted text OR `{output_base}/{date}/{slug}/caption.md`. If unclear, ask once.
2. Invoke `mkt-content-repurposing` with `source_text` + `target_platform(s)`. The returned text is the new `post_text`.
3. Continue to Phase 5.0 (content inference on the repurposed text), then designer → preview → images. Do not pause between phases.
4. Skip Phase 7 only if `chosen_format == "text"`.

## What gets skipped

- **Phase 4 briefing** — no clarifying questions; trigger already carries intent.
- **Phase 5.0 draft caption step** — caption is final; only the inference (entities/palette/typography) and format decision run.
- **Phase 5.4 carousel caption draft** — caption is final, the designer's slide plan adapts to it (not the other way around).
- **Phase 6 humanizer** — text is already in the user's voice (Scenario A) or already platform-adapted by `mkt-content-repurposing` (Scenario E).

**What does NOT get skipped (v2.0.0 change):**
- **Phase 5.0 content inference.** Even though the caption is final, the designer needs `inferred_entities` to build the Visual Inventory. Skipping this is what produced the "all-AI-cliché" failure mode in v1.x.
- **Phase 5.0.5 + 5.3 + 5.7 designer.** The visual layer is planned end-to-end, same as any other scenario.
- **Phase 5.5 preview.** The user confirms the slide plan before image generation runs.

## Best practices

- **Validate slide-worthiness before generating images.** If the caption is < 250 words AND has no enumerated structure, default to single image, not carousel.
- **Repurposing implies platform rewriting, not literal copy.** The repurpose tool adapts tone + length. Don't generate slides for a LinkedIn post and reuse them on a Twitter thread without re-checking aspect ratio in `pipeline.config.yaml`.
- **Inference on final text still earns its keep.** When a user pastes "Anthropic just released Claude Code v2" — even though they wrote it themselves — the inference step extracts `brands: [Anthropic]`, `products: [Claude Code]` and the designer can resolve the Anthropic logo from `icons/commons/ai/anthropic.svg` instead of AI-generating a generic "tech announcement" cover.
- **Reasoning log:** record why the carousel/single decision was made even though there was no draft phase (the structure of the existing text is the signal).
