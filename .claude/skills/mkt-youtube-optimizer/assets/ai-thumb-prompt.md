# AI Thumbnail Prompt Template (house style — proven 2026-07-04)

Reference inputs, in order: (1) real cut-out photo, (2) ATP mark PNG
(`brand_context/Branding/ALL THE POWER LOGO/PNG/ALL THE POWER LOGO-17.png`).
Engines: Nano Banana `gemini-3-pro-image-preview` (generationConfig.imageConfig.aspectRatio
"16:9") · GPT `images/edits` model `gpt-image-2` size 1536x1024.
Worked script: `projects/mkt-youtube-optimizer/2026-07-04_ai-gen-thumbs/gen-ai-thumbs.py`.

## Base (always)

> Premium YouTube thumbnail, exactly 16:9 landscape. Brand style: deep charcoal background
> (#26272A) with a soft olive-green radial glow, editorial and minimal, high contrast, no
> clutter, no watermarks. The FIRST reference image is the real presenter: use him EXACTLY
> as photographed - do not regenerate, beautify or alter his face in any way; place him
> chest-up on the right third with subtle rim light and a soft drop shadow. The SECOND
> reference image is the brand logo capsule: place it small (about 8% of frame width) in
> the top-left corner, tinted muted olive-gold (#B9B47B), subtle.

## Per-concept addition (pattern)

> Left two-thirds: bold clean sans-serif sentence-case text: '{plain words}' (white) then
> '{emphasis phrase}' inside a rounded rectangle highlight filled muted olive-gold #B9B47B
> with dark charcoal text{, then '{closing words}' (white)}. Large readable type, perfectly
> spelled, nothing else.
> Optional depth: "Behind the text, very faint, {relevant artifact} in shadow."

## After generation — non-negotiable QA

1. Face crop side-by-side vs source cut-out (reject on any likeness drift)
2. Spelling of every rendered word
3. 168px legibility strip
4. Resize/crop to exactly 1280x720
