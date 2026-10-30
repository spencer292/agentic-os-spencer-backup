# Digest C: AI Images (AI Video Bootcamp, Phase 3)

Source: 22 lessons in `skool-corpus/03-ai-images/`. Written in my own words for the Got Moles AI video ad skill. AI images are the start frames for AI video, so everything here is about producing a believable, controllable still. Model names reflect the course as recorded (autumn 2026); the course itself says model advice shifts every few weeks, so treat the model section as a snapshot and the technique sections as durable.

Two core ideas run through the whole phase:

1. Image quality caps video quality. Every video workflow starts from a frame, so spend effort here.
2. Prompt, model, settings and references are the four levers. Prompt says what to make, model sets how it is made, settings set format and quality, references show what to follow.

---

## 1. Image model landscape as taught

The instructor concentrates on two models and treats the rest as situational. Most access in the course runs through a hosted multi-model tool (PromptWise / "Studio") but the same models are reachable through ChatGPT and the Gemini app.

**GPT Image 2.0 / 2.5 (OpenAI)**
- Best natural-language understanding of the group. Follows long, specific instructions well.
- Best text rendering of any model. Use it for labels, signage, truck lettering, diagrams, infographics, screenshots, anything where words must be spelled right.
- Strong for realistic avatars, UGC-style social images, ad visuals, and iterative editing. It tends to change only what you asked for on a single edit.
- Slower than Nano Banana Pro.
- Tip: for realism, put the word "photorealism" (or "photorealistic") at the end of the prompt. The instructor repeats a claim that OpenAI engineers said this carries real weight.
- Recommended for character sheets, in 16:9.
- Weakness (lesson 10): when you chain many edits on the same photo, it redraws the whole picture each time. After ten edits in a row the face went orange and blotchy, textures degraded, and a pixel-diff showed about 93% of the untouched region had changed by edit nine. Not safe for client-grade repeated editing.

**Nano Banana Pro (Google, via Gemini or hosted tools)**
- Strong realism, fast, good for testing looks quickly. Use the Pro version, not the original Nano Banana.
- Strong at multi-image fusion (put a person, a car, a logo into one scene and colour-match them), multi-turn edits ("make it night", then "add rain"), keeping a character recognisable in close-ups, posing from a stick-figure sketch, perspective changes (isometric, side view), restoring old photos, changing text in an image.
- The whole UGC avatar prompt bank was generated with Nano Banana Pro, so its prompts are tuned for it.
- Gemini-app outputs carry a small corner watermark that can be removed with Canva Magic Edit.
- Gemini sometimes refuses to place many raw objects directly. The workaround is to arrange the objects on a Canva board with labels and upload that board.

**Ideogram 4.5 (editing specialist)**
- Introduced as the tool for precise edits. On its high "edit precision" setting it redraws only the area you change and copies everything else back. In the ten-edit stress test it changed about 1% of untouched pixels versus about 93% for GPT.
- Supports a paint-on mask (the area shows orange) and up to five references. Good for swapping boots to trainers, recolouring a sofa, removing a bystander and filling the background.
- The instructor says not to use it to generate the first image. Generate elsewhere, then edit here when you need several surgical changes without drift.
- Habit worth copying: end every edit prompt with "keep everything else exactly the same."

**Midjourney (optional)**
- Best for artistic, stylised, abstract, concept-art, fantasy, dramatic looks. Needs a separate subscription. Consistency is weaker, so the course says to start with GPT Image and Nano Banana Pro and treat Midjourney as optional. Used in one demo to make a logo that was then composited into a scene by Nano Banana.

**Midjourney settings and tricks (lesson 18 transcript, v6.1 era)**
- Set aspect ratio by destination (9:16 TikTok, 16:9 YouTube); leave the three "weirdness/stylise" sliders alone; Standard mode normally, **Raw** for maximum realism; always the newest version; personalisation off (instructor found it unhelpful); Relaxed speed is as fast in practice, switch to Fast only for upscales.
- Prompt skeleton: subject, setting, lighting, style, details; say what to show, how to show it, what to avoid. Add a camera angle and an emotional cue (lonely, heroic).
- Three reference types: **character reference** (same person across scenes), **style reference** (palette/lighting/texture only, no subject), **prompt reference** (keeps layout and composition, then change time of day or add elements). They can be combined: one for character, one for style, one for composition.
- Parameters: `--cw 0-100` character weight (use 100 with a character reference for consistency); negatives as `--no people, text`; weights with `::` such as `crystal::2 cave::1 darkness::0.5`.
- After generating: Vary Subtle/Strong, Upscale Subtle (realism) or Creative (adds detail), Rerun, and the **Editor** (erase-and-regenerate) to remove one unwanted detail such as a neck tattoo.
- LLM-written prompts carry fluff; trim before pasting. For Got Moles, Nano Banana Pro or GPT Image is still the default for consistency.

**Nano Banana Pro for static ads and product shots (lesson 12 transcript)**
- Static ads suit feeds because viewers give 1 to 2 s; a clean, bold, on-brand image is enough. Cheaper and faster to test than video.
- Known brands work from a one-line prompt; for your own or a client product, upload the product photo and describe it in more detail.
- **Copy-a-winning-layout:** upload the product image plus a reference static ad you like and ask for the same ad for your product. Rarely perfect first time; fix text or elements by follow-up edit, or finish in Canva.
- **Product shots:** upload the product, give a short placement prompt ("on a gym bench"), then refine. Same route gives in-hand and influencer-style website photos, or a start frame to animate.
- Best results when reference images are placed side by side in one uploaded image; separate uploads work if short on time. Ask the LLM for placement ideas.
- Got Moles: use approved copy only, no competitor brand marks, and no traps or animals in frame; typed text still needs a garble check.

**Canva (post tool, not a generator)**
- Background remover, Magic Eraser (brush out one unwanted object), Magic Expand (outpaint to fix aspect ratio), colour adjustment to harmonise a set of frames, Magic Layers (splits a flat image into movable, editable elements, useful for static ads and thumbnails). Used for quick fixes instead of regenerating.

**Other tools mentioned**
- Pinterest (free) for visual research, not generation.
- "Influencer Studio" and "Wise Chat" in the hosted platform: persistent avatar workspaces and a chat with a built-in canvas. These are platform features; the underlying technique (saved character reference plus scene prompts) transfers to any tool.

**The simple selection rule from the course**
- Avatars and people: GPT Image 2.x or Nano Banana Pro. Test both with the same prompt and references; pick by result.
- Product images, logos, anything with accurate text: GPT Image 2.5.
- Artistic, abstract, cinematic concept work: Midjourney.
- Repeated precise edits: Ideogram 4.5.
- Upscale: Nano Banana Pro or GPT Image (see section 7).

Practical habit: when a model gives a bad result, switching model is a legitimate fix before rewriting the prompt.

**Studio settings the course stresses**
- One aspect ratio per project. Do not generate half the frames at one ratio and switch mid-stream.
- 16:9 for landscape/YouTube/website; 9:16 for Reels, TikTok, Shorts; 1:1 or 4:5 for feed and static ads. Pick by destination before generating.
- Use cheap/fast settings and 1 to 4 outputs while exploring, then high resolution (4K) on the winner.
- Generate several variations; one output should not decide whether an idea works.
- "Assist" and "enhance" features expand a rough prompt, but they can invent details you did not want, so re-read the expanded prompt.

---

## 2. Image prompt anatomy

The course gives several overlapping formulas. They reduce to one stack.

**Master stack (my consolidation)**
1. Subject and action (who or what, doing what, expression)
2. Setting / location (and what is in the foreground, midground, background)
3. Outfit, props, styling
4. Camera: angle, shot size, lens, aperture, camera body or phone
5. Lighting: source, direction, hardness, colour temperature
6. Mood / colour grade (placed near the end)
7. Realism cues: skin texture, imperfections, grain
8. Negatives: what must not appear

**Formulas as taught**
- Influencer Studio quick formula: action + location + outfit + camera style + look + lighting + mood.
- Scene prompt for an existing avatar: same woman + location + outfit + camera style + lighting + expression + realism details.
- Pinterest translation: subject + action + outfit + location + camera angle + lighting + mood + realism details.
- Cinematic framing: describe foreground, midground, background explicitly.
- Camera direction: camera position + shot size + lens.
- Colour: [scene] + [lighting source] + [colour grade style] + [film reference if needed]. Put grade and style words at the END; the course claims models weight the end of a prompt heavily. The style library repeats the rule: add style keywords after the scene, never lead with style.

**Reference usage (critical)**
- A reference does nothing useful unless the prompt says what to keep. State it: preserve face/hair/skin tone/body type (identity); preserve clothing but change location (outfit); preserve packaging, logo, shape, colour, material (product); "use as pose reference, not identity reference" (pose).
- Beginners upload a reference and the model copies the wrong thing (pose when you wanted face, background when you wanted outfit).

**Use an AI chat to write the prompt**
- The recommended workflow: send your reference images plus a plain-English request to Claude or ChatGPT, ask it to write the exact image prompt, then paste that prompt and the same references into the generator. This produces longer, more reliable prompts than typing a one-liner, especially when the product has label text.
- Ask the chat for ten different prompt variations to find a base character quickly.
- If an image looks fake, send it back to the chat and ask: "this doesn't look real enough, add more detail to the prompt."

**Prompt length**
- The course consistently says longer, more specific prompts win for consistency and realism, particularly with text, products and edits. Short prompts are fine only for quick tests inside a persona workspace that already knows the character.

**Think in a frame, not a subject**
- "Cinematic lighting" and "beautiful scene" are empty words. Name the source of light, where the subject sits in the frame, and what is in each layer. The instructor's recurring point: the model supplies prettiness; you supply logic.

**Quality lines found in many bank prompts**
- Output-quality tail: "8K, extreme realism, true-to-life textures, no stylization." Cosmetic, but present in nearly every long prompt.
- Long-form prompts in the banks use labelled blocks: Camera style, Color grading, Composition, Mood and vibe, Quality, Negative prompts. This block structure is a handy template for production prompts (see section 8).

---

## 3. Photorealism techniques

**Why AI looks fake (the instructor's top three tells)**
1. Airbrushed plastic skin. Real people have pores, asymmetry, a wonky brow, slight redness. Zero imperfection is the biggest giveaway.
2. Studio-perfect lighting where it could not exist (ring-light glow on someone standing outdoors). Lighting must match the situation.
3. Perfect camera and background. Most influencer and UGC content is shot on a phone with no control over the background. Over-composed framing and a flawless backdrop read as AI. Adding "shot on an iPhone 15, candid scene, natural framing" changes the result dramatically.

**The Realism Lock (a reusable tail clause from the avatar lesson)**
Append to the end of a scene description: authentic everyday photorealism, candid and unposed, natural ambient light appropriate to the setting, realistic skin and material texture, muted true-to-life colours, low contrast, subtle softness, slight phone-camera or real-camera imperfection, believable exposure, lived-in details, natural body language, ordinary real-life styling, imperfect composition, no glamour retouching, no beauty filter, no cinematic colour grading, no hyper-polished AI look.

**Cheat-sheet vocabulary (organised)**
- Core triggers: photorealistic, real-world photography, cinematic realism, lifelike details, natural imperfections, true-to-life textures, realistic skin / materials / surfaces.
- Camera language: DSLR photography, mirrorless camera, cinematic film still, documentary-style photography, street photography, studio portrait photography.
- Lenses and optics: 35mm (most natural realism), 50mm (human-eye look), 85mm (portraits/faces), shallow depth of field, natural bokeh, realistic focal length. Example tail: "shot on a 35mm lens, shallow depth of field, natural bokeh."
- Lighting (realistic only): natural light, soft window light, golden hour sunlight, overcast daylight, practical lighting, studio softbox, subtle rim light, realistic shadows. Avoid neon glow, magical light, fantasy light unless intended. Natural daylight is the instructor's most-used realism phrase because daylight shows every real imperfection.
- Texture and detail: high-detail textures, visible pores, fabric grain, skin micro-details, dust/scratches/wear, slight imperfections, tactile materials.
- Colour and tone: natural colour grading, muted tones, earthy palette, realistic contrast, soft highlights and deep shadows. Avoid hyper-saturation, neon, cartoon colour. "Realism equals restraint."
- Composition: rule of thirds, eye-level, candid moment, unstaged composition, natural framing, foreground/background separation.
- Grain and finish: subtle film grain, light HDR, sharp focus, "clean but not overly polished."
- Negatives: no cartoon, no CGI, no 3D render, no game engine, no plastic skin, no unrealistic lighting, no text/logo/watermark (omit the last one when you want legitimate text or a logo).

**The "iPhone UGC" look, specifically**
Recurring ingredients across the UGC bank and prompt bank 2:
- Phone camera named with a model and lens: "shot on iPhone 15 Pro rear camera, 24mm" or "front camera, 26mm", sometimes f/1.6 to f/1.8.
- Perspective cues: arm extended, slight wide-angle distortion near the edges, phone held slightly above eye line angled down, mirror selfie with the phone visible, or a third-person photo "taken by a friend a few steps ahead."
- Physical-world flaws: fingerprint smudge on the mirror, thumb visible at frame edge, crooked framing, slight motion blur on the hand, window glare, dust specks on glass, mild iPhone HDR lift, over-sharpening on textures, clipped highlights on white clothing, flash blow-out for night shots.
- Lighting that exists in the room: overhead LED, window light, warm tungsten bulbs, fluorescent tubes, car windshield light, sodium-vapour streetlight. Mixed colour temperatures are named with Kelvin values (2700K bedside lamp, 3000K vanity, 5200K window, 5600K daylight).
- Skin specifics (the realism payload): visible pores on the T-zone and nose, peach fuzz, faint redness around the nose, slight under-eye creasing, small healing blemish, uneven tone, sweat sheen, tan lines, baby hairs, uneven stubble, chapped lips, teeth not over-white, tiny asymmetry.
- Lived-in background clutter: half-finished coffee, open laptop, a candle, mismatched objects, a crooked poster. Prompt bank 2 uses an extreme density of such props, each one named, so the model has no room to default to a clean stock backdrop.
- Colour grade as a phone would render it: warm highlights with soft shadows, "mild iPhone HDR lift", "slight halation around bright lights", "heavy ISO grain in darks."

**Prompt-bank 2 style insight**
Those GPT Image 2.0 prompts read like a casting-and-set-design brief: age, ethnicity, city, time of day ("11:05am", "7:55am"), exact clothing brands, named props, a precise phone model and focal length, a skin section, then a colour grade section. The specific time and place plus concrete flaws appear to be what pushes the model away from generic output. A lesson for Got Moles: specify the actual street, weather, hour and mess of a real Washington yard.

**Upscale before animate**
Run the keeper through an upscale pass (section 7) so the video model has more pixels to work with. The author does this for portraits, films, ads, product shots and any frame sent for animation.

---

## 4. Lighting and mood vocabulary (condensed reference)

**The three questions:** Where is the light coming from? What is it doing to the frame? Does it hold in the next shot?

**Source (motivated light)**
- Light must come from somewhere: window, sun, lamp, headlights, doorway, fire, neon, practical bulb, screen. Name it. The source can sit off-frame; shadows reveal it.
- "Soft cinematic lighting" gives the model nothing, so it lights everything evenly and the frame looks like a render. Replace with: "soft daylight from a large window on the left, falling across one side of the face and body, the other side dropping into soft shadow."

**Quality**
- Hard light (small direct source: bare sun, single sharp lamp): crisp edged shadows; dramatic, tense, raw.
- Soft light (large or diffused: big window, overcast sky): gentle transitions; calm, expensive, intimate. Overcast is the PNW default and works for reassurance.

**Direction**
- Side light: carves shape and texture; the most cinematic.
- Backlight: separates subject from background, rim light, silhouettes, depth. Needs a real source behind.
- Front light: flat; wrong for drama, right for clean beauty and fashion.
- Pair a light side with a shadow side; shadow gives shape. A useful block: "hard side light from the left, deep shadow on the right, background darker than the subject."

**Colour temperature and emotion**
- Warm (golden, orange): alive, intimate, nostalgic, inviting.
- Cool (blue, grey): distant, lonely, modern, controlled.
- Green tint: uneasy, artificial, sick, industrial.
- Red: danger, alarm, tension; must be motivated (alarm, brake light, exit sign) or it looks like a cheap filter.
- Warm subject against cool background (orange vs blue) is the classic cinematic contrast.
- Repeat one accent colour somewhere else in the frame so it feels composed.

**Materials**
- Metal: hard sharp highlight. Glass: transmits and catches. Glossy paint: mirror reflection. Stone: deep smooth sheen. Fabric: absorbs, soft and matte. Wet ground: soft reflection. Skin: warm light, catchlights in eyes that match the real source (no catchlight = dead eyes).
- For products, describe how light behaves on each surface.

**Continuity across shots**
- Anchor the main source in the establishing shot. Keep four things constant in every shot: where the light comes from, which side is lit, warm or cool, how deep the shadows are. Write the lighting as one block at the end of the prompt, copy-paste it into every shot, vary only action and shot size.

**Depth and atmosphere (cinematic framing lesson)**
- Three layers: foreground, midground (subject), background. The fastest fix for a flat shot is a foreground element, slightly out of focus and close to the lens: leaves, grass, window frame, railing, smoke, a shoulder.
- Atmosphere separates layers: light haze (scale), dust in a shaft of light (god rays), low fog (clean layer separation), smoke or exhaust (movement and mood). The rule: ask "what's in my foreground and what's in the air?"
- Rule of thirds: place the subject on a third or a crossing point; dead centre is deliberate, not default. Lead room: leave open space in the direction the subject faces or moves. Leading lines: roads, fences, rails, curbs, light beams pointing at the subject.

**Mood-to-colour map (grading reference)**
Use these as end-of-prompt phrases.
- Epic / heroic: warm golden highlights, deep blue shadows.
- Dark / moody: desaturated, heavy shadows, teal and orange.
- Romantic / dreamy: soft pink and gold, gentle haze.
- Horror / unsettling: cold green tint, sickly yellow, crushed blacks.
- Sci-fi / cyberpunk: neon blue and magenta against dark.
- Vintage / nostalgic: faded warm tones, lifted blacks, 35mm grain.
- Clean / corporate: bright, slightly cool, high key, minimal shadow.
- Nature / documentary: rich greens, warm earth tones, natural saturation.
- Melancholy / lonely: desaturated blue-grey, cold, overcast.
- High energy: punchy contrast and saturation, warm with cool accents.
- Luxury: deep blacks, gold accents.
- Surreal: shifted palette, pastel plus deep tones.
- Film-look shortcuts (use one, not many): Dune (amber and sand, hazy), Revenant (cold natural, blue-grey shadows, earthy), Ozark / Gone Girl (steel blue, flat, oppressive), La La Land (saturated primaries, golden hour), Wes Anderson (pastel, symmetrical).
- Mistakes: "colourful" means nothing; do not stack many colour references; keep grade and lighting compatible (no warm golden grade with harsh fluorescent light); do not over-describe.

---

## 5. Camera angles and shot types (condensed reference)

The course frames camera as language: angle answers "where is the viewer standing", shot size answers "what do we need to read", lens answers "how does the space feel." No angle has a fixed meaning; character, light and moment decide.

**Angles (height)**
- Eye level: honest, equal, baseline.
- Low angle: subject towers; powerful, heroic, threatening. Worm's-eye (floor, aiming straight up): extreme, good for vehicles and buildings.
- High angle: subject shrinks; vulnerable or ordered. Overhead / top-down: geometry, diagram feel.
- Dutch angle: tilted horizon; tension, instability.

**Angles (side of subject)**
- Frontal: direct, symmetrical, iconic; eye contact with the lens is talking to the viewer.
- Three-quarter: most natural and cinematic, adds depth and shape.
- Profile: distant, closed off.
- Back shot: mystery; follow them in.
- Over-the-shoulder: conversation and power; the bigger shoulder holds power.
- POV: camera as character eyes; sold by what they see (hands, steering wheel, glasses frame, helmet visor, scope, keyhole).

**Shot sizes**
- Extreme wide: environment is the subject; small person, scale.
- Wide: person and place together; put a threat and a character in one wide frame for suspense.
- Full shot: head to toe, owns the frame; posture and outfit.
- Medium-wide (about the knees): action and movement.
- Medium (waist up): versatile conversation distance; monotonous if overused.
- Medium close-up (chest up): reaction and connection.
- Close-up: face fills the frame; emotion.
- Extreme close-up: one detail (an eye, a drop, a crack). Use sparingly.
- Principle: shot size is information, not closeness. A close-up only lands after a wider shot has held distance. Build contrast between wides and tights.

**Lenses**
- 16 to 24mm wide: deep, immersive, exaggerated foreground. Good for interiors, POV, cars, action.
- 35mm: the natural realism workhorse.
- 40 to 50mm normal: calm, eye-like.
- 85mm portrait: narrower view, subject separation, compresses background.
- 135 to 200mm+ telephoto: stacks planes, flattens, watching from far away.
- Focal length controls field of view, camera position controls perspective. A wide lens only distorts a face when the camera is shoved close. Describe both lens and camera position.
- Example combination: "low angle medium close-up, camera close to the subject, 24mm wide lens, exaggerated foreground depth, subject towering over the viewer."

**Aperture**
- f/1.4: shallow, background melts, but only if the background is far behind the subject (a subject against a wall stays sharp even at 1.4; 10m away it melts). Describe distance too.
- f/8: most of the scene sharp.

**Camera bodies as look shortcuts**
- ARRI Alexa: serious drama, soft highlight roll-off, all-rounder.
- Sony Venice 2: clean low light and night.
- RED V-Raptor: sharp modern digital, action, vehicles (the instructor's favourite).
- Hasselblad / medium format: glossy premium product, jewellery, cosmetics, luxury surfaces.
- Lens character: clean modern, warm organic (Cooke), vintage, anamorphic.
- The bank adds phone and stills bodies for realism: iPhone 15 Pro, Sony A7 series, Canon R5/R6, Fujifilm X-T4/X100V, Leica M10 Monochrom.

**Style library (24 looks, append at the end of a prompt)**
35mm film, Polaroid, cinematic widescreen (2.39:1), anime, oil painting, watercolour, pencil sketch, pop art, film noir, vintage magazine, editorial fashion, street photography, drone photography, macro, double exposure, long exposure, tilt-shift, golden-hour portrait, studio lighting, dark academia, vaporwave, cottagecore, cyberpunk, minimalist. Most relevant to a local-service ad: street photography (candid, real world), golden-hour portrait (warm, lifestyle), drone photography (aerial of a property, scale), macro (texture of grass, droplets), studio lighting (clean product), 35mm film (nostalgic realism).

---

## 6. Character and avatar consistency

**Goal:** a digital person who can appear again and again across settings, outfits and poses and still read as the same person. Do not try to finish it in one generation; build up reference points.

**Step-by-step workflow**
1. Rough concept. Decide identity, niche, vibe, what content they would naturally post. Keep it simple. Choose the persona to suit the brand (a muscular gym persona does not sell makeup).
2. Turn the idea into a detailed prompt using an AI chat. Include age, vibe, platform, realism, "shot on an iPhone", suitable for a consistent avatar.
3. Generate a first batch with no reference (you are still discovering the face). Use GPT Image 2.x and/or Nano Banana Pro, several variations, even ten different character prompts. Add "photorealism" for GPT.
4. Review hard. Check skin texture and small imperfections, eyes, asymmetry, expression, lighting that fits the setting. Reject plastic faces. Pick a face that could plausibly exist on Instagram, TikTok or in a UGC ad and that can survive many outfits and locations (not one narrow scene).
5. Choose a clean base reference: sharp, naturally lit, clear face, not over-filtered, not studio-glossy. A bad reference gives bad consistency nearly every time.
6. Build a character sheet from that base (below).
7. Generate scenes: upload the avatar or sheet as the reference and prompt "same woman + location + outfit + camera + lighting + expression + realism".
8. Build a content library (lifestyle, product, fitness, travel, UGC) and keep it together in one folder or persona workspace. Later these become video start frames.

**Character reference sheet prompt (structure taught)**
- Treat the uploaded image as source of truth for face, body proportions, hair, skin tone, outfit, materials, accessories. Preserve all of it except what the description section changes. Do not change costume, colours, hairstyle, age, build or facial structure.
- Neutral plain studio background, clean lighting, no environment or props unless part of the design.
- Layout: one sheet, six vertical columns with thin borders; each column has a full-body view on top and a matching close-up portrait below whose rotation must equal the full-body rotation.
- Column order left to right: front 0 degrees, 45 degrees left, 90 degrees left profile, 90 degrees right profile, 45 degrees right, back 180 degrees (back of head only, no face).
- Consistency rules written as hard "do not" lines: same character, outfit, hairstyle, proportions and facial identity in every column; never mirror or flip angles; no text, labels, numbers, logos or watermarks.
- Camera: strict orthographic turnaround, no wide-angle distortion, consistent camera height and portrait crop, photorealistic DSLR studio lighting, realistic fabric/skin/hair.
- Generate in 16:9 with GPT Image 2.x. Edit the character-description and outfit fields for each new look, then use the sheet as the reference on every later generation.
- Simpler sheet alternative in the lesson guide: front, side profile, three-quarter, full body.

**Saved characters and persona workspaces**
- The hosted tools let you save a character or product and call it with an "@" mention, so you do not re-upload references. In a persona workspace, the prompt bar already knows the avatar, so short scene prompts work ("at the beach holding a cocktail"), though longer ones still win.
- Pre-made vs custom avatars: custom form takes name, gender, age range, aesthetic, hair/eye colour, extra details (tattoos, haircut) and optional reference images; it returns four options to pick from. References must be clear, well-lit and consistent; conflicting or filtered references hurt.
- Presets (daily aesthetic, luxury, fitness, night out, product placement) generate batches; a caption tool writes captions and hashtags.

**Multi-image consistency in Nano Banana**
- A single strong portrait reused as a reference kept tattoos, an ear piercing and face identity through close-ups and different scenes. Close-ups are the usual place consistency fails, so test them.
- Change outfit, hair, even age on a locked portrait to explore variants, then reuse the chosen look.

**Scene-level consistency (lighting and grading)**
- Keep one aspect ratio; reuse one lighting block; harmonise colour in Canva (warmth, brightness) so frames look like they belong to one world. The instructor's point: if the stills are inconsistent, the video will be worse.

**Avatar rules for Got Moles (my application):** create one or two reusable people (a technician and a homeowner) once, build a sheet for each, and reuse them across every ad. See section 9.

---

## 7. Editing, inpainting, product placement, reference images

**Edit patterns**
- Prompt edit with an explicit preservation clause. Example given: "change a grey off-shoulder dress to a red satin off-shoulder dress with the same cut and length, keep everything else exactly the same."
- Masked edit (Ideogram): paint over the region (boots, sofa, a person), type the replacement. Up to five references can supply the actual replacement item.
- Object removal: mask the object and ask to fill naturally, or use Canva Magic Eraser for one stray object. A brush is often faster and more accurate than a regeneration.
- Time and weather shifts: take a good scene and ask for night, rain, fog, crowds, different clothing era, dramatic red lighting. Nano Banana handles these as multi-turn edits.
- Perspective change: ask for an isometric view, a side view, or a zoom-out that shows the surrounding set.
- Edit chaining: edit, drag the result back as a reference, edit again. Beware GPT drift on long chains; use Ideogram or accept a fresh generation with the original references.
- Outpainting: Canva Magic Expand to convert 9:16 to 4:5 or reveal more body.
- Rearranging: Canva Magic Layers turns a flat image into separate movable parts, handy for static ads (move text, resize, recolour).

**Multi-object composition trick**
Gather the objects on a Canva board, label each one, and upload that single board. In the prompt refer to the objects by label. Reported near-100% accuracy for placing many items on one table, versus frequent misses or refusals from uploading loose objects.

**Product placement workflow**
1. Make or choose the person (the avatar first, for control).
2. Gather product images (several angles; include a size reference if scale matters).
3. Upload both to an AI chat and ask for a detailed prompt: "avatar holding the product toward the camera, label sharp, readable and consistent, proportions accurate, include all label text." Paste the prompt and references into the generator.
4. Always type the label text into the prompt and tell the model the text must be exact and correctly spelled. Without it you are hoping.
5. The supplement-bottle example: before/after shows blurry gibberish text fixed by a prompt that listed each text line, label colours and layout, product position (centred, held at chest height, nearer the camera than the face), hand in sharp focus, lighting setup (soft key on label, fill, rim), depth-of-field plan (bottle and hand razor sharp, face slightly soft, background bokeh), a 50mm eye-level lens look, and explicit bans (no glare obscuring text, no warped label, no extra logos, no watermark).
6. If proportions drift, add more reference images with scale comparisons.
7. Check hands, label, scale and angle before animating.

**Recreating a reference ad without copying it**
- Find a campaign image on Pinterest. Upload it alongside your product. Prompt: describe the inspiration, say which product replaces the original, give the label text, and name what must change (different model, colours, setting) so the output is original. The instructor warns not to copy real people's faces or one exact photo; put your own spin and improve it with foreground, better lighting, etc.
- Fashion swaps: model image plus garment image through an AI chat to write the edit prompt; both GPT Image and Nano Banana held shirt designs perfectly.
- Brand-logo placement: upload the logo and describe where it appears (on a bag, a sign, a truck door).

**Reference-based creative techniques**
- Draw a stick figure to dictate a pose; upload with the character.
- Use Pinterest as a reference bank: search the style, break each image into outfit / pose / background / lighting / framing / palette, combine ideas, save as a board or Canva moodboard, then translate into prompt language. Use references as inspiration, not for copying a real person.
- Memes, comic strips, whiteboard summaries of a long document, annotated callout images (arrows with handwritten labels) are possible with text-strong models.

**Upscale to true 4K**
- Upload a good-but-soft image to Nano Banana Pro or GPT Image and prompt: "Upscale this image to true ultra-realistic 4K. Preserve the original composition, lighting, and character identity." These models add micro-detail (pores, hair texture, fabric fibres, fine edges), clean compression noise, and keep composition, unlike classic upscalers. Always upscale before animating; the video model gets more pixels. The hosted platform also has a built-in upscaler.

---

## 8. Best prompt patterns from the banks (17 templates)

The main bank is a mix of influencer/fashion/editorial/product/documentary prompts. The UGC avatar bank (Nano Banana Pro) is portrait and selfie focused. Prompt bank 2 (GPT Image 2.0) is long "casting brief" candids. Templates below are abstracted structures, with brackets for your variables. I have dropped anything sexualised and kept the useful skeletons.

**T1. Phone selfie, hotel/home bathroom (UGC avatar bank)**
"Extremely realistic close-up, looking toward the camera, of a [age] [descriptor] [person] in a [setting], camera slightly above eye level looking down, intimate framing. 50mm lens, shallow depth of field, warm [light source] behind them, natural skin texture with visible micro details and pores, sharp [eye colour] eyes with strong catchlights, relaxed expression mid-sentence, creamy warm background blur, [colour temperature], soft shadow gradients across cheekbones, no over-smoothing, no CGI feel, vertical TikTok-style composition."

**T2. Outdoor drink selfie with measured phone optics**
"Ultra-realistic vertical selfie of [person] [doing small action], arm extended holding phone, [location]. Camera slightly above eye line angled down, smartphone wide-angle lens (26mm equivalent), mild distortion on extended arm. Natural midday daylight (5600K), soft open-shade lighting. Reflection of [scene detail] in the eyes. Condensation on the cup. Skin real but attractive: visible pores not exaggerated, faint freckles, no heavy makeup. Background: [place], blurred people, phone-lens compression. Feels spontaneous and unfiltered."

**T3. Car interior "quick story" selfie**
"Ultra-photorealistic vertical selfie of [person] in the [passenger/driver] seat of a parked car, arm extended, slight downward tilt, 26mm phone lens distortion visible. Daylight through the windshield giving soft top-front illumination. Real reflections of dashboard and sky in pupils. Skin natural: visible pores on nose, uneven tone, soft baby hairs. Car interior slightly blurred, seat stitching and windshield glare streak. Feels like a quick story before going inside." (The driver-seat male variant adds side-window rim light, stubble asymmetry, teeth not over-white, "raw social rant content.")

**T4. Third-person candid taken by a friend (prompt bank 2)**
"Third-person photo of a [age] [person] [doing activity] at [specific place] at [exact time], taken by a friend a few steps ahead. [Hair, accessories, clothing with specifics]. [Props in hand]. Mid-stride, looking [direction], small natural smile. Behind her: [five to eight concrete background items]. Shot on iPhone 15 Pro rear camera, 24mm, [light type], no flash, slight motion blur on [part]. Skin: [three to five flaws]. Color grade: [highlight colour], [shadow colour], [phone processing quirk]." This is the single most transferable realism template.

**T5. Mirror selfie with fixed phone optics**
"A realistic handheld mirror selfie of [person] in [room], framed mid-torso to top of head, front-facing camera, standing slightly angled with left shoulder forward, arm extended. Rear camera around 26 to 28mm equivalent, eye-level, arm-length distance. Soft warm overhead lighting, gentle highlights, minimal shadows, neutral white balance. Preserve skin texture: pores, natural blush, subtle redness, no smoothing, no filters. [Clothing and accessories.] Clean background, doorway visible, background softly out of focus, face sharp. Candid, believable smartphone photography with no retouching."

**T6. Candid podcast / talking-head frame**
"Ultra-realistic podcast studio scene, cinematic photography. A [person] seated on the left of the frame, facing slightly right as if speaking to someone off-camera, mid-conversation, mouth slightly open, natural expression. Boom-arm microphone in front, acoustic foam and warm studio light behind. Shallow depth of field, soft rim light on hair, realistic skin texture, 50mm lens, eye level. Candid, not posed." (Good template for a talking-head to-camera shot.)

**T7. Environmental portrait (documentary)**
Block structure: opening sentence with camera position and distance; subject physical description with specific age/wear; environment that tells the story; lighting with source and quality; "Camera style" (body, lens, aperture); "Color grading" (muted natural, reference photographer); "Composition" (subject at right third, horizon at upper third, lead-in element); "Mood and vibe"; "Quality"; "Negative prompts." The Icelandic fisherman and boxing-gym prompts follow this to the letter.

**T8. Action / sports freeze-frame**
"Dramatic freeze-frame of [subject] [at peak moment]. Camera courtside/low angle, [distance], telephoto compressing the background. Subject focus details [expression, form, sweat droplets]. Stakes visible in the background through bokeh. Lighting [description]. Camera style [body, lens, aperture, shutter 1/4000s]. Composition [subject on left two-thirds, line toward off-frame goal]. Negatives: no CGI, no motion blur on subject, no posed shot." Useful for dynamism (a technician mid-task).

**T9. On-camera-flash night snapshot with annotations**
"A raw night-time iPhone flash photo taken at [place]. The framing is slightly crooked like a rushed paparazzi snap. [Subject caught mid-action]. The flash blows out highlights on skin and [object] while the background fades into shadow. Concrete/asphalt texture sharp and gritty, harsh shadows. Feels spontaneous and unplanned." Followed by "On-image handwritten annotations" with arrow labels such as "flash blown highlights -> arrow to her face." The annotation layer is a rendering trick that doubles as a self-check of what the model understood.

**T10. Hero product on a surface (GPT Image 2.0)**
"Editorial hero shot of a single [container] with [cap], standing centred on [surface] wet with a thin film of water. Label: [exact text]. [One organic prop] beside it. [Liquid caught mid-fall]. Soft directional morning light from camera-left, warm amber reflection on the shoulder, long cool shadow to the right. Shot on Hasselblad X2D with 90mm macro, tack sharp on [focal point], f/5.6, luxury campaign tone. Visible surface realism: [water tension, glass diffusion, pulp]."

**T11. Flat-lay / prop / text-heavy objects**
"Flat-lay of a [paper object] resting on [surface]... masthead reading '[text]', headline '[text]', body text in 9pt, caption '[text]', coffee-cup ring in the corner. Shot on iPhone overhead, natural window light, slight paper grain." Quote every piece of text exactly; GPT renders it well.

**T12. POV object-storytelling scene**
"First-person dashboard POV from the driver's seat of [vehicle], parked at night at [place]. The dash clock reads [time]. [List of narrative objects with readable text]. Through the windshield: [scene]. Shot on [camera], 24mm, mixed fluorescent canopy and dashboard glow, the story written in the objects." Shows how listing readable objects creates narrative without a face.

**T13. UI/screenshot generation**
"iPhone screenshot of an iMessage conversation, iOS 17 style, contact name '[name]'. Status bar: [time], [battery], [signal]. Incoming grey bubbles with these exact messages: [list]. Typing indicator shows. Clean iOS rendering, crisp SF Pro font, correct bubble tails." Good for hook frames that look like a text from a customer.

**T14. Fashion/lifestyle editorial with colour hero**
"Full-body fashion editorial of [model] standing in [location] at golden hour. Wearing [garment with colour hero]. Low hard golden sun rakes from camera-right, throwing a long sharp shadow, igniting the [colour] against the neutral setting. Shot on Canon R5 with 85mm f/1.4. Color grade: saturated [hero colour], desaturated [neutral] background, deep honey sun highlights." The one-saturated-element-against-muted-ground structure works for a branded green lawn against grey weather.

**T15. Macro texture close-up**
"Macro-style close-up of [subject action] with focus on [texture, shine]. Eyes slightly out of focus. Handheld on iPhone, very shallow depth of field. Mixed bathroom light and window light. Ultra-detailed [texture detail]." Adaptable to soil, grass blades, water droplets.

**T16. Character-sheet scene follow-up**
"Create a realistic iPhone-style photo of the same [person] [action] in [place], wearing [outfit], soft natural daylight through the window, bright room, natural expression, candid lifestyle photo, realistic skin texture, no studio lighting." The canonical consistency prompt.

**T17. Depth rewrite (flat to cinematic)**
Weak: "[subject] standing beside [object] in [place], cinematic lighting." Better: "[object] close to the camera in the foreground, [subject] standing beside it in the midground, [place] falling away into the background, [named light source and direction], out-of-focus [leaves/grass] near the lens, light haze in the distance, subject on the right third looking into open space on the left." Use this to upgrade any start frame.

**T18. Colour-grade tail**
"[Scene], [light source], [grade style words], [one film reference]." e.g. "volumetric light from the setting sun, warm amber and teal cinematic colour grading, Dune-inspired look."

**T19. Reference-driven garment/product swap (edit)**
"Use the first image as the scene and subject, the second as the [garment/product]. Replace [item A] with [item B], keep the same cut/length/fit/label, keep face, pose, lighting and background exactly the same."

**Pattern observations worth encoding in the skill**
- The best prompts carry concrete, mundane detail (the 7-Eleven price sticker, a taped poster, a coffee ring). Specificity beats adjectives.
- Flaws are specified, not left to chance: write the freckle, the chapped lip, the fingerprint.
- Many bank prompts use explicit negative blocks. A good reusable negative set: no cartoon, no CGI, no plastic skin, no over-smoothing, no glamour lighting, no artificial glow, no studio backdrop, no fake bokeh, no distorted face, no extra fingers, no warped eyes.
- Bank prompts are stylistically loud (fashion, glamour, edgy). Do not import their content; import their structure.

---

## 9. Got Moles applicability

### 9.1 Principles for Got Moles start frames

- Subject focus: the customer problem (mole hills in a lawn) and the outcome (a smooth, healthy lawn), not the animal. No images of moles being killed or trapped, no dead animals, and no traps, hardware or tools that read as traps. Show the damage and the result, never the mechanism.
- Positioning language: lead with "chemical-free and safe mole control." Visuals support that: kids and pets safe on grass, a calm technician, natural light.
- Setting: Western Washington suburbs (Puget Sound area: Bellevue, Kent, Puyallup, Gig Harbor, Olympia). Cues: tall Douglas fir and western red cedar, rhododendrons, moss on fences, wet green lawns, craftsman and 1990s subdivision houses with cedar siding, overcast soft light, wet pavement.
- Style choice: iPhone-UGC realism for customer/homeowner testimonial frames; documentary-clean realism for the technician. Avoid the glossy glamour in the banks. Avoid the AI-perfect lawn; real turf has patchy colour and weeds.
- Mole hill accuracy: the damage signature is conical or volcano-shaped mounds of fine, loose, darker soil, 6 to 12 inches across, often in a line or cluster, with no visible hole; raised surface ridges across the turf. Describe it in the prompt; the model otherwise draws gopher-style fan mounds or anthills.
- Text: any signage or truck lettering must be typed exactly in the prompt, and only with approved copy ("Got Moles" and a service name). Use GPT Image for these frames. Do not put claims or numbers into image text unless supplied from the approved guardrails (e.g. no "WA's #1", no I-713 claims; use approved review counts only).
- Wording safety: the posture-A rule for ads (no body-gripping/scissor/harpoon/spike/kill/lethal wording) applies to image prompts and any text rendered in images too. Keep prompts to "mole hills", "lawn damage", "healthy lawn", "technician inspecting."
- Format: render all start frames for one video at 9:16 (Reels/Shorts/TikTok) or 1:1 / 4:5 (feed). Upscale to 4K before animating. Use US English in any visible text.
- Consistency: build one technician avatar and one homeowner avatar (plus dog), generate a six-column character sheet for each, and reuse them. Brand cues: uniform colours and logo placement must follow `brand_context/` (not specified in the course; confirm before locking the technician sheet).

### 9.2 Example start-frame prompts

Brackets mark choices to confirm. All prompts are written for GPT Image 2.x or Nano Banana Pro. Append the Realism Lock clause or the negatives block as needed.

**Prompt 1: The problem (suburban lawn with fresh mole hills, overcast PNW)**
"Photorealistic wide shot of a typical Western Washington suburban backyard on an overcast spring morning, shot as a homeowner's iPhone 15 Pro photo, 24mm, eye level, held at chest height looking across the lawn. In the foreground, slightly out of focus, wet blades of grass and two small mounds of fresh dark loose soil; in the midground, a cluster of six to eight cone-shaped mole hills, fine crumbly dark soil, no visible holes, several raised ridges running across the turf; in the background a cedar-sided craftsman house, a wet cedar fence with moss, and tall Douglas fir trees fading into light mist. Soft diffused overcast daylight from above, no harsh shadows, damp lawn with water droplets, slightly patchy green with a few clover patches. Muted natural colour grade, true-to-life greens, mild iPhone HDR, subtle sensor grain. 9:16 vertical. No animals in frame, no tools, no traps, no people, no text, no watermark, no cartoon, no CGI."

**Prompt 2: Close-up of damage detail (macro, hook frame)**
"Macro-style close-up of a single fresh mole hill on a green lawn, a cone of fine dark crumbly soil pushed up through the grass, a few blades of grass bent at the base, tiny raindrops on the soil and leaves. Shot handheld on a phone at ground level, 35mm lens look, very shallow depth of field so the background lawn and a blurred garden fence melt away, soft overcast light from the left, cool-green and earthy brown palette, subtle film grain. Shows damage only: no animal, no tools, no traps, no text. 4:5 vertical."

**Prompt 3: The result (pristine lawn after service, same yard)**
"The same suburban Western Washington backyard as the problem shot, same house, fence and Douglas fir line, same camera position and angle, now with a smooth, even, healthy green lawn with no mounds or ridges, fresh mower stripes, a few crisp dewdrops. Soft overcast morning light with a gentle break of sun lighting the far fence, subtle warm highlights, natural colour, looks like a real homeowner's iPhone photo, 24mm eye-level. Foreground has out-of-focus blades of grass close to the lens for depth. No people, no animals, no tools, no text. 9:16 vertical." (Use the first image as a reference: "keep the house, fence, trees and camera position exactly the same; remove the mole hills and ridges, restore smooth lawn." For a clean before/after, do this edit with Nano Banana Pro or Ideogram 4.5 to prevent drift.)

**Prompt 4: Friendly technician in uniform (reference sheet source)**
"Photorealistic candid portrait of a friendly male technician in his mid-30s in a clean [brand colour] polo shirt with a small [Got Moles logo, exact as supplied] on the chest and dark work pants, standing on a healthy green suburban lawn in Western Washington, smiling naturally toward the camera with a relaxed, trustworthy expression, slight sun-weathered skin with visible pores, short stubble, real asymmetry. Shot on a full-frame mirrorless camera, 50mm lens, f/2.8, eye level, shot slightly from the three-quarter angle. Soft overcast daylight, gentle shadow on one side, a craftsman house and Douglas fir softly blurred behind him, light mist, out-of-focus rhododendron leaves in the foreground. A white work truck with the company logo faintly visible, out of focus, behind him. Hands empty and relaxed or holding a clipboard. No tools that look like traps, no animals, no equipment in hand. Natural colour grade, no beauty filter, no studio lighting. 9:16 vertical." (Then generate the six-column character sheet from the chosen image and reuse it for every technician shot.)

**Prompt 5: Technician inspecting the lawn (action, midground)**
"Same technician (reference sheet attached, keep face, build, uniform identical), crouched on one knee at the edge of a lawn, looking down at a mole hill and calmly pointing to the damaged turf as if explaining the situation to someone off-camera. Shot from a low three-quarter angle, 35mm lens, shallow depth of field, camera 1.5 meters away. Subject on the right third, open lawn space to the left, house in the background fading into soft rain mist. Overcast soft light, wet grass, a few raindrops on his jacket sleeve. Foreground: out-of-focus blades of grass near the lens. No tools in the frame, no traps, no animals, no text. 9:16."

**Prompt 6: Homeowner with dog on healthy lawn (aftermath, emotional payoff)**
"Candid iPhone-style photo, 26mm, of a homeowner in her 40s, relaxed in a rain jacket over a sweater, laughing mid-sentence while a golden retriever bounds across a smooth, healthy green lawn toward her, tail wagging, in a Western Washington backyard in early evening. Warm late-afternoon light breaking through thin cloud from camera-left, rim light on the dog's fur, long soft shadows on the grass, cedar fence and tall evergreens behind, a wooden deck with a patio chair to the side. Natural skin texture, faint smile lines, no makeup polish. Slight motion blur on the dog's legs, foreground blades of grass out of focus. Mild iPhone HDR, warm highlights with cool-green shadows. Safe and calm mood. No tools, no signs, no text. 9:16 vertical." (Saves the 'safe for pets and children' proof with no words.)

**Prompt 7: Rainy PNW mood, homeowner at the window**
"Cinematic documentary-style medium shot through a kitchen window at dusk on a rainy Pacific Northwest day, a homeowner in a wool cardigan holding a mug looking out at a backyard lawn with a few visible mounds of soil, rain streaks on the glass and raindrops on the pane. Camera at eye level indoors, 50mm lens, f/1.8, shallow depth of field, subject on the left third with open space to the right toward the garden. Practical warm lamp inside giving a warm key light on the face, cool blue-grey daylight from the window as rim, orange against blue contrast. Condensation on the glass, soft haze over the wet lawn and a fir-tree line in the background. Muted desaturated cool grade, subtle film grain. Mood: quiet concern, the lawn seems to be a problem but is solvable. No animals, no tools, no traps, no text. 16:9." (Use for an emotional hook or a mid-video tonal shift. Pairs with Prompt 3 as the relief.)

**Prompt 8: Aerial before/after property establishing shot (scale)**
"Drone-style aerial shot, 60 meters up, looking down at a Western Washington suburban lot with a half-acre lawn, a craftsman house, a cedar fence and mature evergreen trees, early morning mist rising over the neighbourhood. In the lawn, a visible pattern of dark mole hills and raised ridges leading across the turf; the right half of the same lawn is smooth and uniformly green, with a clean straight line between the two areas to read as a before-and-after split. Even soft overcast light, natural colour, muted greens, subtle film grain, drone photography look, sharp focus. No people, no animals, no tools, no traps, no text. 16:9." (Reference-edit variant: generate the full-damage aerial first, then edit the right half to smooth turf; use a mask in Ideogram 4.5 for the cleanest split.)

### 9.3 Workflow recommendations for the Got Moles image-to-video skill

1. Fix aspect ratio per project and name it in the first line of every prompt.
2. Generate two or three damage-lawn plates and one pristine-lawn plate from the same camera position so the video can cut or morph between them; use the original as the reference with an explicit "keep exactly the same" clause.
3. Build a six-column character sheet for the technician and one for the homeowner (and a dog sheet if the dog recurs), then use them as references for every shot.
4. Keep a single lighting block per scene (overcast, soft window, or golden break) and paste it into each prompt. PNW overcast is a feature: soft light, no ring-light look, good realism.
5. For any lettering (truck, shirt, yard sign, door hanger), spell the exact text inside the prompt, use GPT Image, and verify the output before upscaling. Skip lettering if a clean version does not appear in two attempts; add text in Canva later.
6. Run a safety pass on every frame: no animals harmed, no dead animals, no traps, no tools resembling traps, no I-713 claims, no unapproved numbers, no ad copy that implies lethal methods.
7. Upscale the final frame to 4K, then send to the video model.
8. Use real-condition flaws (moss on the fence, uneven grass, damp patios) to avoid the AI "perfect lawn" tell.
