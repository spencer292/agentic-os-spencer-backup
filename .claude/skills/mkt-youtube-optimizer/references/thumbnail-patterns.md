# Thumbnail Pattern Library

**Evidence refreshed: 2026-08-16** (podcast interview spec added from a four-way
live test; see that section). Solo/lesson evidence base: **2026-07-03** (29 most-viewed thumbnails pulled from DOAC, Ali Abdaal,
The Futur, Johnny Harris, Dan Martell, Y Combinator, Simon Squibb, Alex Hormozi via
`scripts/fetch-ref-thumbs.mjs`). Refresh when >60 days old: re-run the script, view the
contact sheets in `research/refs/`, update this file, and re-date this line.

## ATP SIGNATURE THUMBNAIL — v2 LOCKED 2026-07-16 (supersedes the 07-04 layout)

Research 2026-07-16 (top-performers + YouTube algorithm + internal audit). The signature is a
fixed **title-card** so recognition compounds across the grid (Daniel Priestley model, UK-validated),
executed WITH tension so it doesn't fall into the EOS "tidy but generic" trap (on-brand ≠ clickable).

**The device — same frame every video:**
- **Canvas: REAL photography only — NO AI generation (Roy, 2026-07-16).** Do NOT run the presenter or the
  scene through an image model: it reprocesses his real photo and reads as AI-generated, which he has ruled
  out (and cuts against proof-of-human). Use his ACTUAL cut-out untouched, hand-composited (PIL) on a
  DESIGNED brand background (Night Sky + olive glow + vignette + grain, not flat charcoal) or a real photo.
  Right third, chest-up, left legibility scrim. The polish comes from design + real light, never from AI.
- **Title: BN Dime Display** (the brand display font — finally wired in, not Archivo/Anton), 2–4 words,
  caps, upper-left, white + soft drop shadow. ≤5 words. Packaging: title-card promise = the video title.
- **Accent band:** a solid rounded bar directly under the title = the repeating signature mark.
- **ATP mark** top-left, ~96px.
- **Tension (mandatory — this is what beats the EOS trap):** (1) the lesson's SUBJECT is in shot as a
  real artifact (org chart on a wall; a cluster of dials for numbers) — Harris "artifact + reaction" /
  Priestley "evidence in frame"; (2) ONE visual cue only (a glowing dial, an empty highlighted seat, a
  circle/strike); (3) a genuinely caught expression.
- **Accent = A/B, NOT a fixed ban.** Render BOTH a brand-gold (#D8CE86) and a red (#E5382A) variant every
  time; run YouTube **Test & Compare** (picks by WATCH-TIME share, not CTR — desktop Studio, ~2wk). The old
  "NO red" rule is retired: red isn't banned, it's tested. Both variants must read in light AND dark mode.
- **Design for watch-time + honesty:** don't over-promise (Dec-2024 clickbait-mismatch policy is
  strike-eligible). Must be legible at **168px** (mobile feed) first.

Engine + worked example (Numbers/Scorecard, REAL-only): `projects/briefs/thumbnail-system-v2/gen-numbers-real.py`.
**Clarity gate:** the hook must land on a viewer who does NOT know the jargon. No insider terms ("scorecard") on
the thumbnail — lead with plain meaning ("Know Your Numbers") and SHOW the idea with a designed visual
(metric tiles, a trend line) so a cold viewer gets it at a glance.
Font: `brand_context/Branding/FONTS/BNDimeDisplay.otf`. Cut-outs:
`projects/briefs/core-values-cluster/thumbnails/cutouts-nologo/` (prefer caught poses 009/014).

**DRIFT — do NOT copy:** the "Brand kit (ATP)" section below and `assets/example-quote-card.png` still show
the OLD near-black / #E5382A-box / white-pill look. Historical only; superseded by this section.

## POWER MOVERS PODCAST — interview thumbnail, LOCKED 2026-08-16

The signature above is for **solo/lesson** content. Interview episodes use a different layout,
locked after a four-way test (control + three challengers) rendered across eps 83/85/87 and judged
at real feed sizes. Renderer: `scripts/podcast/thumb-challengers.py --design C2-guest-dominant`,
driven per-episode by `scripts/podcast/thumbnail-build.cjs`. Face geometry: `scripts/podcast/thumb_faces.py`.

**Layout — C2 guest-dominant:**
- **Ground:** Night Sky `#333538` with a same-hue spotlight lift. (Musk Green `#5E5C2B` is the
  sanctioned alternative but weakens the accent — see the accent note below.)
- **Guest:** real photograph, full-bleed on the right ~56% of canvas, feathered into the ground.
  **No matting, ever** — see the retirement note in `SKILL.local.md`. Face is sized to **38% of
  FRAME height** (`face_h_frac=0.38`), which clears the ≥35% hard rule. The first locked pass sat
  at 30% and failed it — measure this against frame height, not against the guest's own panel.
- **Headline:** BN Dime Display, stacked left, payoff word in the accent. The accent word is set
  with `--highlight` and **must be the Path word, never the wound** — it defaults to the last word,
  which is correct for most hooks (`THE HANDOVER THAT **HELD**`, `CAGES HAVE **DOORS**`) but not
  all: `ROWING THE SAME WAY` needs `--highlight SAME`, `942 DAYS` needs `--highlight 942`. A
  highlight word that is not in the hook is refused rather than silently accenting nothing.
- **Host:** 208px circle bottom-left with an accent ring, from the **approved logo-free cut-outs**
  (`projects/briefs/core-values-cluster/thumbnails/cutouts-nologo/`), rotating per episode.
- **Studio microphone** beside the circle at 206px — keyed from the official
  `brand_context/Branding/PODCAST POST AND STORY/PODCAST COVER DARK.png` and saved as
  `mic-cutout.png`. This is the show signal: two faces read as an interview, not necessarily a
  podcast. The same template also carries a **player progress bar + transport controls**, which is
  the sanctioned second cue if one is ever wanted.
- **Guest name:** Montserrat Bold 36pt, bottom-right, auto-shrinking to fit. **No credential line** —
  every credential in the live eps 61–87 set degraded into an unreadable grey smear at 168px.
- **Logo:** secondary lockup (mark + wordmark), variant 16 on dark. **Not** variant 22 — that is the
  confined-spaces mark for favicons and profile pictures and it renders as a smudge at thumbnail size.

**Framing rules — measured, never guessed:**
1. **Never crop by a hardcoded bias.** A resize-to-cover with a fixed vertical fraction has no idea
   where a face is; it cropped the host's head off above the eyes on ep 83 and clipped his scalp
   inside the circle on ep 85.
2. **Cut-outs:** measure the head box off the **alpha channel** — deterministic, free, no API.
3. **Photographs:** get a bounding box from one cached vision call. This is the model *measuring* —
   four numbers, no pixel touched — which is why it does not breach the no-AI-on-people rule.
4. **Headroom is pinned to the TOP OF THE HEAD, not the centre of the face.** How much scalp sits
   above the face varies with pose, so face-centred positioning gives a different gap on every shot.
   Head top sits at 15% of the circle height.
5. **Headroom must be ADDED, not found.** The host cut-outs are trimmed flush to the scalp, so there
   is no space in the source to reveal. The crop window is allowed to sit above the image and pad with
   the brand fill. Clamping the window to the image edge is what made three successive attempts at
   "more space above his head" silently do nothing.
6. **Always fill the frame.** Scale is `max(face-size-wanted, cover-scale)` — a letterboxed portrait
   with grey margins reads as a mistake.
7. **Full-bleed does not work with portrait sources.** Forcing a portrait to cover 16:9 always yields
   an enormous face with the chin off-canvas; blur-filling around it leaves a hard edge where the
   photo stops. A portrait *panel* is the geometry that matches the source material.

**Typography rules:**
- **Balanced line breaking, not greedy.** Greedy first-fit packs line 1 then strands the remainder —
  it produced `STOP BEING / THE / BOTTLENECK`. Weigh every legal partition by squared slack so lines
  come out even, and penalise a lone short function word (THE, A, TO, OF, AND, YOUR…) hard enough
  that it is never stranded. Correct output: `STOP / BEING THE / BOTTLENECK`.
- Max 3 lines. Largest point size that fits wins; balance is chosen at that size.
- Hook is **3–4 words**, ALL CAPS. Locked 2026-08-17 after measuring, not asserting.
- **90pt legibility gate, enforced in code.** `check_hook_gate()` in
  `scripts/podcast/thumb-challengers.py` measures the point size the hook would actually render
  at in the C2 headline box and **refuses to render below 90pt** (exit 2; override with
  `--allow-small-hook`, which records the override).

  **Word COUNT is not the constraint and this was tested.** Same headline box, achieved size:

  | Hook | Words | Renders at |
  |---|---:|---:|
  | THE HANDOVER THAT HELD | 4 | 100pt |
  | THE HANDOVER HELD | 3 | 100pt |
  | SELL WHAT YOU KNOW | 4 | **104pt** |
  | YOUR KNOWLEDGE PAYS | 3 | **94pt** |
  | ROWING THE SAME WAY | 4 | 100pt |
  | ALL ROWING TOGETHER | 3 | 100pt |

  Two pairs are identical and in the third the FOUR-word hook is 10pt larger. What forces the
  type down is the **longest single word**, because it sets the minimum line width —
  `ENTREPRENEURSHIP` (16 chars) collapses a hook to 60pt. So the gate names the offending word
  in its failure message and asks for a reword, not for fewer words.

  **Do not reinstate a "≤3 words" rule.** The only source supporting it (BananaThumbnail, Feb
  2026, "73% of top thumbnails use 2–3 bold words") is a vendor blog with no method, and the
  2026-08-17 hook research graded it LOW and explicitly wrote *"not a reason for it"*. The
  library's own long-standing rule says ≤3 is the TARGET and **>4 loses** — i.e. five or more.
  Four has never been the failure case.

**Accent:** Light Green `#B9B47B` on Night Sky is the only strong pairing the palette offers; Light
Blue `#A3B5B8` is a weak second. Rotation is therefore two-wide and variety comes from the host shot
and guest photo. Colour-usage rules from the brand guidelines are enforced in code.

**Caption zone:** nothing critical in the bottom ~12% — YouTube overlays the progress bar and
duration badge there.

**Known gap:** the host shot rotates by episode number, which gives variety but ignores the
expression guide. Ep 87's hard-truth hook drew the arms-crossed shot rather than the wry lean-in.
Selecting the cut-out by hook tone is the obvious next improvement.

---

## ATP HOUSE STYLE — LOCKED 2026-07-04 (SUPERSEDED by v2 above for the signature layout; kept for reference)

Every ATP thumbnail uses ONE layout so recognition compounds. Generic patterns below are
reference evidence only — the house style is what ships.

- **Canvas:** Night Sky charcoal (#26272A base) with a musk-green radial energy glow behind
  the subject (`thumb_lib.atp_dark_bg()`). Light mode for whiteboard content: musk-50 paper
  #F4F3EC with musk-200 border.
- **ATP mark on every thumbnail** (`thumb_lib.atp_icon()`): the mitochondria/energy capsule,
  top-left, ~112px, Light Green tint on dark / Musk on paper. Subtle, never front-and-centre.
  It replaces the text chip. (The mark = ATP the molecule = energy = the driving force.)
- **Text:** <=5 words, sentence case, Archivo Bold ~82px, white; ONE phrase boxed in
  Light Green #B9B47B with Night Sky text (`thumb_lib.atp_quote()`).
- **Colours: brand only.** Musk #5E5C2B · Night Sky #333538 · Light Green #B9B47B ·
  paper #F4F3EC · Sky #E4EAE8 · Dusty Blue #5E6D76. **NO red** — not an ATP colour
  (2026-07-04 correction: v2 red boxes were off-brand). Cues (circle/strike/underline) in
  Musk on light, Light Green on dark.
- **Subject:** right side, chest-up, face >=35% frame height, drop shadow, never mirrored.
- **Title and thumbnail promise the same video** (small-channel rule).
- Worked examples: `projects/mkt-youtube-optimizer/2026-07-04_core-values-house-thumbs/`.

## Rendering pipeline (decided by shootout, 2026-07-04)

1. **Primary: AI generation with reference inputs** — Nano Banana (gemini-3-pro-image-preview,
   16:9 aspectRatio) first, GPT Image (images/edits, gpt-image-2) as the second engine.
   ALWAYS pass two reference images: the real cut-out photo + the ATP mark PNG, with the
   house-style prompt template in `assets/ai-thumb-prompt.md`. AI wins on light integration,
   glow depth, and background ghosting — PIL compositing reads flat next to it.
2. **Mandatory face-integrity QA:** AI edits can subtly alter a real face. Before shipping,
   crop the face from the generated image and the source cut-out, view side by side. Any
   drift in likeness = reject the variant. Also QA spelling of every rendered word.
3. **Fallback: PIL compositing** (`thumb_lib` atp_* helpers) when APIs are down, for rapid
   drafts, and as the layout baseline the AI prompt describes.
4. Generate 2 engines x 1-2 concepts per video, contact-sheet them, pick, then split-test
   (YouTube Test & Compare) the top two.

## Hard rules (from the evidence, enforced on every variant)

1. **Face large** — chest-up crop, face ≥35% of frame height, real expression, rim-lit or
   high-key. Faces with emotion lift CTR 20–35%. No face only when the artifact IS the story.
2. **Text = conversational quote or ≤3 big words.** Sentence case beats caps for quotes.
   ONE phrase in a filled highlight box (the DOAC signature). >4 words of display text loses.
3. **One idea per thumbnail.** If it needs explaining, it fails at 168px.
4. **One visual cue max** — red circle, cross-out, arrow, underline (+25% when it directs
   attention, clutter when it decorates).
5. **Physical artifacts beat abstract graphics** — whiteboard handwriting, a crossed-out photo,
   comparison cards, real screenshots.
6. **Channel chip** top-left, identical across all videos (consistency compounds recognition).
7. **168px test** — every variant must read in the contact-sheet small strip before presenting.
8. **QA every image by eye** — AI-generated imagery adds stray lettering ~1 in 6; check full
   size AND small.
9. **Caption-zone clearance** — nothing critical in the bottom ~12% (progress bar + duration
   badge overlay it).

## The four proven patterns (worked example: `assets/`)

### A. Quote card (DOAC style) — default for lesson/opinion content
Near-black bg (#1E1F22→#45474C radial glow behind face) · subject right, chest-up, drop
shadow · left: 3–5 sentence-case lines ~80px Archivo Bold, ONE phrase in filled box
(brand green #A3D654 w/ charcoal text, or red #E5382A w/ white) · chip top-left.

### B. Whiteboard rewrite (Abdaal style) — for "stop doing X, do Y" teaching
Paper bg · handwritten word struck through in red (Ink Free font) · handwritten green
replacement · subject pointing at it. Bright, warm, high-key.

### C. Artifact + reaction (Harris style) — when a photo/document IS the story
The artifact as a tilted white-border card, crossed out or circled · subject reacting/pointing ·
short flat-caps line with red underline, heavy stroke for legibility over busy areas.

### D. Comparison cards (Martell style) — for either/or, before/after
Two rounded cards: red-edged ✗ vs green-edged ✓, handwritten-style body lines · subject beside.

## Brand kit (ATP)

- Cut-outs: `projects/briefs/core-values-cluster/thumbnails/cutouts-nologo/` — **logo-free
  versions only; the branded-tee originals are retired.** Expression guide: 014 wry lean-in
  (hard truths), 010 calm direct (default), 009/011 pointing up (whiteboard/artifact),
  007 arms crossed (authority). Full inventory sheet:
  `projects/briefs/core-values-cluster/thumbnails/research/roy-cutouts-sheet.jpg`.
- Fonts: Anton (display caps), Archivo Bold (quotes/chip) in `.claude/skills/_assets/fonts/`;
  Ink Free (Windows) for handwriting.
- Palette: near-black #1E1F22 / charcoal #333538 / paper #FAFAF8 / green #A3D654 /
  red #E5382A / white. Chip: white pill, charcoal Archivo text, "ALL THE POWER".
- Compositing helpers: `scripts/thumb_lib.py`. Worked generator that produced the live
  proof (youtube.com/watch?v=KS2yc2di9PA):
  `projects/briefs/core-values-cluster/thumbnails/make-thumbs-v2.py`.

## Anti-patterns (rejected by the user or the evidence — do not produce)

- Stock-photo scene + giant amber display caps pasted on top (the "generic clickbait
  template" — rejected 2026-07-03).
- Mirrored cut-outs (shirt/logo text reverses — instant tell).
- Lower-third text without checking the caption-zone rule.
- >2 colours of accent in one thumbnail; acid-lime green.
- Branded-tee cut-outs (brand retired the shirts). The approved set is
  `projects/briefs/core-values-cluster/thumbnails/cutouts-nologo/` — the raw
  `C:\photography\Me pics` folder is the retired branded originals, not the approved cut-outs.
- **Matting a person with a generative image model** (Gemini chroma-isolate, or any "remove the
  background" prompt to an image generator). It redraws them: softened skin, deformed shoulders,
  and on ep 87 it deleted the host entirely and pasted a second copy of the guest. Use a frame or
  full-bleed instead, or a real matting model — never a generator.
- **Letting an image model render display text.** Ep 71 shipped "AI FREED MIY TIME" baked into the
  pixels. Text is drawn deterministically with the real font, or not at all.
- The bare logo **mark** at thumbnail size (variant 22 / favicon lockup) — unreadable smudge.
  Use the mark + wordmark lockup.
- Greedy first-fit line breaking on the headline — strands short function words on their own line.
- Credential / subtitle lines under the guest name — unreadable at 168px, pure noise.
- Locking a layout that has never been rendered across at least three real episodes and viewed at
  168px. This estate has done it twice.
