# Digest A: AI Advertising and UGC, Part 1 (AI Video Bootcamp, Phase 5)

Source: `skool-corpus/05-ai-advertising-ugc/` files 01 to 08 (strategy lesson, Seedance avatar ads, UGC Factory, Seedance 2.5 short-film workflow, podcast, 2D animation, claymation). Written in my own words; short prompt skeletons quoted where the structure matters. The course is built around its own platform (PromptWise) and its own resource PDFs (frameworks, psychology bible, hook library, awareness-levels guide), which are covered by another digest.

Note on file 05: the lesson video has no transcript in the corpus. What exists is a ~500 KB PDF documenting a 72-generation short film ("Bootcamp vs Slop Dawgz") shot by shot, plus five sample UGC/hook prompts in the lesson description. The method is clear from it; the story content is irrelevant to us.

---

## 1. What makes an ad good: the principles taught

**The core claim.** Tool skill is half the job. AI gives speed (hundreds of variations a week), but "speed without strategy is noise." Every ad needs a reason to exist: a target audience, one desire, one emotion, one conversion goal.

**Pre-production checklist (the "prompt input checklist").** Before any script, define: product, audience, awareness stage, pain points, desired outcome, proof, mechanism (why it works), offer, CTA, format, tone. These are the same fields the master prompts ask for (see section 2).

**1. Match the awareness level** (five stages):
- Unaware: pattern interrupt or a named problem.
- Problem-aware: frame the pain clearly and specifically.
- Solution-aware: show a better mechanism or "new way."
- Product-aware: proof and differentiation.
- Most-aware: offer, urgency, retargeting.
The ad's job (educate, create desire, prove the mechanism, push the offer) follows from the stage. Three campaign objectives are also named: awareness ads, converting ads, retargeting ads. Ask: who is this for, what do they already know, what must it achieve.

**2. One ad = one audience, one dominant desire, one main message.** Do not list every benefit. The same product can sell on different desires (attractiveness vs. confidence). Desires named: health, status, control, comfort, belonging, attractiveness, confidence, relief, identity, curiosity, fear, proof, transformation.

**3. Sell the feeling, not the product.** "The goal of an ad is not to explain the product; it is to make the viewer feel something strong enough to keep watching." Car ads sell freedom/status; Nike sells discipline/identity; skincare sells confidence.

**4. Market sophistication and belief management.** In a new market you can just explain the product. In a crowded market you need a stronger mechanism, a more specific angle, better proof or a different presentation. Never open with a huge claim the viewer does not believe; start from something they already agree with and walk them to the conclusion.

**5. Pick a framework first, then write the script.** Sixteen named frameworks (listed in section 2 under "Shared Framework Engine"). Rule from the master prompts: choose the framework that gives the strongest reason to keep watching and act, not the one that sounds interesting. Each ad also gets a backup framework for a second variation.

**6. Hooks (first 3 seconds).**
- The first 3 seconds must stop the scroll; "if it's boring you've already lost."
- Open on the sharpest line of the conversation, never an intro ("Welcome back..." and "Today we're talking about..." are banned).
- Hook types by format: contrarian claim, reaction shot ("wait, say that again"), forbidden-insider ("nobody in X wants to admit..."), expert correction (podcast); named relatable character, social tension, fourth-wall look, visualised inner thought (2D); before/after in frame one, character visibly suffering the problem, provocative on-screen question, timer transformation ("this becomes this in 10 seconds"), miniature-world metaphor (claymation).
- "Visual chaos hooks" for Seedance: physical accident or impossible event filmed as raw phone footage (example: a woman crashes through the ceiling, then deadpan: "It's okay... I'm only AI."), because Seedance is strong at physical action and destruction. Formula: 1-2 s of stillness or normal, violent pattern interrupt, messy human reaction, one calm line, no polish.

**7. Script timing skeleton (all master prompts use this).**
- 0 to 3 s: hook
- 3 to 10 s: problem, tension or curiosity
- 10 to 25 s: product, method, story or mechanism
- 25 to 40 s: proof, demo, transformation or reason to believe
- Final seconds: one clear CTA, natural not desperate
Lengths offered: 15, 30, 45, 60 s (formats run to roughly 80 s for story ads). Dialogue should sound spoken: contractions, not every sentence short and punchy, no robotic ad language.

**8. Platform-native feel.** TikTok/Reels: fast, vertical, hook-first, native. YouTube: more room for story and explanation. Instagram: visual, aesthetic, identity-driven. Meta ads: direct, conversion-focused. UGC should not look like a polished commercial; podcast ads should look like a clipped expert conversation; clay/2D ads rely on a strong visual pattern interrupt. "Create one ad and expect it to work everywhere" is the named mistake. All master prompts are explicitly "for Meta paid ads only." Format is always 9:16 vertical.

**9. Test, don't bet.** Test: hooks on the same concept, same script in different visual styles, formats against each other (UGC vs podcast vs animated vs demo), different voiceovers, different CTAs. Rule: not "is this ad good?" but "what are we testing, what metric proves it, what do we change next." Use winners to seed the next round. The master prompt itself asks for 3 extra variations (aggressive direct-response, organic/native, visually creative).

**10. Integrity rules baked into the prompts.** "Don't use fake proof. Don't invent statistics unless I gave them to you. Label assumptions." The UGC script prompt bans invented transformations, fake results, medical or financial claims, and exaggerated promises. (Contrast with the course's own sample outputs; see section 4 risk flags.)

**11. Realism rules (for photoreal formats).**
- Reference image quality is "by far the most important thing." Without a reference, Seedance gives a less realistic random person.
- Check every generated character still: does it look real, is the skin natural, can you tell it's AI? If you can, regenerate.
- Imperfection sells: handheld shake, uneven framing, pores, flyaway hair, uneven blinking, ambient sound only, no music, no generic influencer phrases ("game changer," "you need this," "I'm obsessed," "changed my life").
- Reduce contrast, add a colour grade and captions in the edit to remove the "AI look" (referenced separate lesson).

---

## 2. Ad formats taught: workflows, prompts, tips

### 2.0 Shared planning layer (all formats): the "Master Prompt" system

Each format has a one-page "Master Prompt" you paste into a chat model (ChatGPT or Claude) with placeholders filled in. All six share one skeleton:

1. **Role line:** "You are an expert direct-response ad strategist, scriptwriter and AI video director specialising in [FORMAT] ads for Meta. Meta paid ads only. Creative format locked as: [FORMAT]."
2. **Format definition and why it works** (podcast = overheard authority; 2D = relatability via a named character; claymation = charm and pattern interrupt).
3. **"What the LLM needs to know"** rules for the style (see per-format sections).
4. **Visual rules, sound rules, best hook types** for that format.
5. **Input fields** to fill in: Brand/Product; What it does; Target audience; Audience stage (cold/warm/retargeting); Pain points; Desired outcome; Main proof (delete if none); Key mechanism; Offer; CTA; Video length (15/30/45/60 s); Tone. Plus format-specific fields: podcast adds "Expert identity" (who the guest is); 2D adds "Character name / description / daily struggle" and "Restrictions: words, claims, visuals to avoid"; claymation adds "Clay character or metaphor" (what represents the problem).
6. **Shared Framework Engine:** the 16 frameworks, each with a when-to-use and a beat structure:
   1. SPARK (social proof momentum: a shift is already happening)
   2. Myth Killer (challenge a belief)
   3. Countdown (listicle: number, mistakes, then the product as answer)
   4. Origin Story (founder-led)
   5. Shortcut (how to X without Y)
   6. Raw Take (organic/native, soft recommendation close)
   7. Pressure Cooker (problem, tension, relief)
   8. Grit Ad (lo-fi anti-production filter laid over another framework)
   9. Conviction (founder objection crusher)
   10. Face-Off (versus/challenge)
   11. Bridge (goal, gap, gain)
   12. Cliffhanger (curiosity loop)
   13. Witness (testimonial cascade)
   14. Demo Drop (product in action)
   15. Time Machine (before/after)
   16. Educator (value-first teaching)
7. **A 10-step process the LLM must follow:**
   1. One-sentence core selling angle.
   2. Primary framework plus why it fits.
   3. One backup framework for variation 2.
   4. Five hook options (specific, native to platform).
   5. Pick the strongest hook and say why.
   6. Full timestamped script (the 0-3 / 3-10 / 10-25 / 25-40 / CTA skeleton).
   7. Video blueprint: shot-by-shot plan, what the viewer sees, dialogue/VO, on-screen text, camera style, pacing, props/locations, B-roll, where product appears, how to keep it native.
   8. A separate AI image/video prompt per scene (subject, setting, camera angle, lighting, motion, realism, composition, mood).
   9. Three extra variations (aggressive direct-response, organic/native, visually creative).
   10. "Why this could work": psychological trigger, retention mechanism, main conversion lever.
8. **Closing rules:** no vague copy, no fake proof, no invented stats, label assumptions, clarity over cleverness, make it easy to film or generate, first 3 seconds strong, natural CTA, output must be handable to a creator/editor/AI tool.

Usage notes: attach the frameworks PDF (and optionally the psychology/awareness PDFs) to the chat, or paste the master prompt alone. The instructor's demo: podcast master prompt for a gummy brand, claymation master prompt for a fragrance brand; output includes script, alternates, hooks, and scene prompts.

**Reproducible skeleton (our version):** Role + format definition + format rules + input block + framework list + 10-step process + integrity rules. Input block is the 12 to 15 fields above.

### 2.1 Avatar / UGC talking head (Seedance 2.0, manual pipeline) , lesson "Insane Avatar Adverts"

**Pipeline (4 steps):**
1. Generate the character image and prepare product photos.
2. Script the whole ad with the UGC master prompt (below), attaching character and product reference images to the chat.
3. Take the character reference + product reference(s) into Seedance 2.0 and generate each clip.
4. Stitch and edit in CapCut.

**Step 1: character.** Preferred image models: ChatGPT Image 2.0 and Nano Banana Pro. Prompt pattern for the influencer still: "Ultra-realistic vertical smartphone photo of [person], natural influencer selfie perspective, [pose], [hair/skin with pores, freckles, under-eye detail], [outfit], [expression: candid, mid-sentence, direct eye contact], [lived-in believable setting with specific materials and natural window light], shot on iPhone-style camera 9:16, wide-angle phone lens, no heavy makeup, no airbrushed or plastic-smooth skin, no beauty filter, raw phone-photo realism." Method: give example prompts to a chatbot and ask for more like them. Reality gate: if you can tell it is AI, regenerate.

**Step 2: the UGC script + Seedance prompt ("master prompt").** Structure (paste with character and product images attached):
- Persona: "expert UGC ad director, TikTok scriptwriter, direct-response marketer, Seedance 2.0 prompt engineer."
- Deliverable: one polished 15-second Seedance prompt for a realistic UGC product ad, 9:16.
- **Preservation clause:** study the product image and keep exact shape, colour, packaging, label, logo, visible text, proportions. Use the character reference for identity only, not location/pose/framing.
- **Feel clause:** real creator filmed on a phone in an everyday situation; not a commercial, studio, stock video or obvious AI.
- **Arc clause:** strong opening, natural product introduction, believable use, grounded benefit/payoff, casual final beat or CTA, without being formulaic.
- Natural dialogue, specific to product and audience; banned generic influencer phrases.
- Product used realistically; no invented transformations, fake results, medical or financial claims.
- Must include: 9:16, phone-shot UGC style, believable location, natural light, handheld movement, imperfect composition, realistic hands, skin texture, expressions, exact product preservation, ambient SFX only, product SFX, no music, no voiceover, no on-screen text.
- Avoid list: cinematic commercial lighting, studio backgrounds, glossy ad shots, perfect skin, fake hands, floating products, warped labels, exaggerated claims, music, VO, text.
- Output: only the final prompt, divided into timestamped scenes with dialogue, leave room for natural variation in shots/transitions.
- **Optional add-on at the bottom:** "Target customer is [X]. Main problem or desire is [Y]. Advert angle: [authority & expert / before-and-after / problem-solution / comparison / founder story / testimonial-style / demo / routine / unboxing / reaction / educational / social proof / day in the life]."

**Longer ads (30 / 45 / 60 s).** Same prompt but splits into 15 s parts, because Seedance caps at about 15 s per generation. Each part has a different purpose instead of repeating hook-reveal-demo:
- Part 1: hook + context (problem/desire; product not forced yet).
- Part 2: product use + explanation.
- Part 3 (45 s+): proof, benefit, objection or comparison (grounded).
- Part 4 (60 s): lifestyle payoff + soft CTA.
Each part uses flexible timestamps (0:00-0:03, 0:03-0:06, 0:06-0:10, 0:10-0:13, 0:13-0:15) and per timestamp specifies: visual action, what is said, camera, hand/product interaction, expression, ambient SFX, product SFX. Keep creator, location, light and product constant across parts; generate each separately and edit together.

**B-roll-only variants (15 s, no dialogue):**
- *Fast cut:* new cut every 1 to 2 s: product grabs, label close-ups, texture, hand interaction, demo, satisfying movement, lifestyle context, final clean hero shot. Camera vocabulary: quick push-ins, whip pans, snap zooms, rack focus.
- *Normal cut:* 5 to 6 distinct shots, 2 to 3 s each, gentle push-ins, slow tilts, small pans.
Both: ambient + product SFX only, no music/VO/text, no floating product, no warped labels.

**Step 3: Seedance settings and tips.**
- Seedance 2.0 normal (better) vs 2.0 fast (cheaper). Highest quality setting.
- Drag the reference photos in; if the product opens or has a packet, also upload an inside photo (e.g., the actual sweets).
- **Dialogue-to-duration balance:** too much dialogue for the clip length makes the voice speed up or get cut off; too little makes the character speak gibberish. Match words to seconds.
- Custom audio: you can upload your own audio (own voice or an ElevenLabs voice) and tag it with the "@" reference.
- Cheaper alternative stated: Veo 3.1 ("still amazing") if budget matters; Seedance is "quite expensive" but best.
- Hook generation: give the ceiling-fall prompt to a chatbot, or use the "hook generator" template: "Act as an expert viral short-form creative director, Seedance 2.0 prompt engineer and TikTok hook strategist. Create hyper-original hooks... for each: title, idea summary, why it stops scrolling, full Seedance prompt, suggested final line, ambient-only sound design, ways to make it more chaotic/realistic." Style rules: vertical 9:16, hyper-real raw phone footage, natural light, camera shake, imperfect framing, believable setting, good lip sync, begin with the pattern interrupt in the first 1 to 2 s.
- Example of a worked hook prompt anatomy (ceiling fall): camera locked on the floor pointing up; 2 to 3 s of tension stillness; staged failure in stages (stress cracks, snap, break); messy non-stunt body movement; consequences on the camera (shake, skid, dust, autofocus struggle, exposure shift, audio clipping); calm deadpan line to lens; explicit style negatives (no slow motion, no CGI look); explicit sound design list.

**Sample prompts in the lesson description (patterns worth reusing):**
- *Selfie testimonial-style (30 s, six hard jump cuts):* camera spec (flagship phone front camera, ~22-24 mm, 30 fps, 1/60 shutter), natural window light, strict realism list (pores, peach fuzz, no beauty filter/HDR/oversharpening); reference-slot tags `@image1 THE WOMAN: appearance ONLY`, `@image2 THE PRODUCT: appearance ONLY`; "she physically holds the phone, never gimbal-smooth"; "six casual HARD JUMP CUTS, never morph or glide"; timed beat list with exact spoken lines per beat; ACTING block (understated, restrained smile, uneven blinking, no presenter delivery); "ONLY @image1 SPEAKS AND ONLY THE SCRIPTED LINES"; SFX (phone-mic room tone, product sounds); STRICT NEGATIVES (no glossy ad look, no floating product, no identity drift between edits, no captions generated). The script itself is a low-key "I fully expected to forget about this in three days... annoyingly I like it" arc.
- *Two friends overheard conversation (30 s):* two women at a tennis club; "performance lock: never perform dialogue like an advertisement, underplay everything"; continuity lock (same faces, hair, outfits, objects; no duplicates, no morphing hands). The payoff reveals the product/course in a one-line aside ("They teach you the whole thing") and the friend says "You're sending me that." This is a soft-sell "overheard" ad.
- *"Self-aware AI" bedroom demo and street-vlog:* the character states she is AI and demonstrates realism; negatives insist nothing visually changes at the reveal. Useful for novelty hooks only.
- *Slow-motion hero moment (20 s):* walking tracking shot, small collision, time decelerates, camera continues moving through the frozen moment. Illustrates a staged-timing prompt (0 to 5 / 5 to 6 / 6 to 16 s sections with camera direction).

**Failure modes noted:** weak reference images; leaving identity to chance; dialogue/length mismatch; warped labels or packaging (mitigate with exact-preservation clause, inside photo, and "label text large and legible"); hands; floating product; identity drift across cuts; generic influencer language.

### 2.2 Avatar ads on autopilot: "UGC Factory" (PromptWise feature)

Platform shortcut that automates the above. Described as a form-driven generator.

- **Two tiers.** *Standard:* fewer credits; uses Veo 3.1 for lip-sync and Kling for B-roll. *Premium:* latest Seedance model, best lip-sync, "does more of the work", usually better output. Model names are said to change over time.
- **Premium flow:** pick a video type from a grid (standard UGC talking + B-roll, fast-cut B-roll, avatar talks with or without the product, day in the life, problem-solution story templates, etc.; some have fast/normal cut and voiceover/no-VO toggles). Upload a clean product image (plus an inside-the-packaging image if packaging hides the product). Upload an avatar or pick a pre-made one (strongly recommended over leaving it blank). Optionally add label text, aspect ratio, resolution, a one-line product description (e.g., "a pack of chewy sweets"). Custom script is optional: blank means the AI writes it.
- Output can run as an ad with zero editing (B-roll of her using the product plus VO). Problem-solution templates give built-in storylines (example: a man tired all the time until he takes the pills).
- **Talking avatar mode:** reference image + the line = direct lip-sync clip (hooks, claims, testimonials).
- **Standard flow:** lock one influencer/premade avatar (reused in all generations); script writer (describe product, optionally upload a reference to analyse); click each script line to generate hook, body and CTA clips separately; **built-in word counter** per clip duration (too many or too few words makes Veo speak too fast or produce gibberish); choose accent, settings, product image; then generate B-roll from premade moves (handheld etc.) and the product image; download and stitch in CapCut.
- **Check list before shipping:** product accuracy and packaging, avatar believability, B-roll fit, VO naturalness, lip sync, mouth shape, facial stability, pacing.

### 2.3 Seedance "short-film" workflow, applied to ads (Seedance 2.5 Omni-reference)

This is the most advanced, consistency-driven method. The film is a 72-generation narrative, but the pipeline is exactly what a multi-shot story ad needs. Core idea: **never let the model invent anything; give it a reference image for every person, object and place, and paste the same "look" block into every prompt.**

**Step 1: Character passports (GPT Image 2.0, 16:9).** One image per character: a sheet with the same person from multiple angles in the same outfit and light. Two templates:
- *Basic passport:* clean horizontal grid on seamless off-white; panels: full-body front, full-body back, large chest-up three-quarter, right column of three head-and-shoulders (profile, 3/4, frontal). Fill two slots: CHARACTER (age, build, ethnicity, hair, facial hair, skin, tattoos, scars, expression) and WARDROBE (every garment with colour, material, logo and exact placement, footwear, jewellery, headwear, eyewear). Add "identical clothing, hair, jewellery and proportions in every panel; no text, labels or borders." Avoid list: illustration/3D render, waxy skin, outfit change, cropped feet, duplicated limbs.
- *Extended passport:* labelled technical sheet (FRONT/BACK/SIDE/3-4 views, face-detail portraits, material specs, accessory and footwear panels, four macro close-ups).
- **Lock-downs to decide once:** wardrobe, hair, skin/tattoos, jewellery, eyewear/headwear (decide once whether worn, since on-in-one-shot-off-in-next breaks a film faster than anything), proportions (the model otherwise makes everyone slimmer and taller). Give each group its own strict colour palette so they are identifiable in wide shots where faces are unreadable.

**Step 2: Locations (Nano Banana Pro, 16:9).**
- **"Visual DNA / LOOK block":** one paragraph describing film stock, time of day, sun height/direction, light colour, halation, grain and what to avoid (no teal-orange, no HDR, no lens flare). Paste it word-for-word, never edited, into every location prompt and every shot prompt.
- *Location master plate:* LOOK block + PLACE block (what it is, lens in mm, eye-level camera, level horizon, sun direction; foreground/midground/background; real-world imperfection; "reads as a photograph, not a render"; nobody in frame).
- *Rotate the camera in place:* "Same location as the reference image. The camera has not moved, it has rotated N degrees to the left/right and now faces [X]." with KEEP IDENTICAL (look block, sun, shadows, ground, horizon, lens), WHAT STAYS VISIBLE (a piece of the previous frame at the edge so the two views connect) and WHAT IS NEW.
- *Another view of the same place:* master plate as reference, new camera position described like a cinematographer ("camera has turned 180 degrees and looks back out of the street"). Fill: where the camera stands, which way it faces, sun, time of day, camera height, lens, materials, sky, emptiness.
- Rule: cover a main location "in the round" in advance (five views from one 360-degree turn). Think like a cinematographer ("camera is here, facing that way"), not like someone ordering a picture.

**Step 3: Object passports (GPT Image 2.0, 4:3).** For any prop that appears in more than one shot (vehicle, product, tool): top row six orthographic views (front, 3/4 left, left, right, rear 3/4, rear) labelled, bottom row five macro details of what makes it recognisable; object described by material, finish, colour, scale vs a human, wear. Lock one background, one light, one wear level per object across the whole film. An "object state" prompt makes variants (new paint, damaged) while keeping geometry. Markings (logo, number, lettering) let viewers recognise an object faster than its shape.

**Step 4: Generate each shot in Seedance 2.5 Omni-reference** (up to 50 reference images at once). Shots are 5 to 16 s, mostly "one take." Each shot's prompt has a fixed 10-part anatomy:
1. Stock and look (lens mm, film stock, light, "photorealistic live-action, raw documentary realism, no 3D render/game engine/plastic skin/retouch/HDR", 24 fps 180-degree shutter, "SFX only no music, no subtitles", accent, duration).
2. Scene context (what happens, plain language).
3. Reference slots: `@image1 = [short physical description]` for each person, object, location. Location slot states "THE LOCATION AND THE EXACT DIRECTION THE CAMERA IS FACING, use it for everything."
4. STRICT headcount (exactly N people, no extras).
5. Camera (by phase if it moves; handheld/shoulder-mounted; "no cuts").
6. Staging (where everyone and everything sits at frame one, parked vehicles stationary).
7. Action, timed in sub-second ranges (0.0-1.2 s ... ), with exact spoken lines attributed to a tagged character; "every beat lands on the tail of the one before, no dead air"; "speech is never sped up."
8. Who speaks (only X speaks; others listen, never mouth along).
9. Acting notes (underplayed, no meaningful looks held too long, background people alive).
10. SFX list and STRICT NEGATIVES (no third-person view, no cuts, no morphing, no lip-sync from non-speakers, object can't change state, etc.).
- **Chaining shots:** for continuity, feed a frame from the previous shot as `@image1 "FRAME FROM SHOT 08"` and say "exact starting frame; light, colour and location continuity only; do not reproduce the people or angle from this image."
- **Prompt-writing shortcut:** copy a few of the course prompts into an AI chat and ask it to structure all your shots the same way.
- **Detail principles:** state what must stay constant ("headcount," "wardrobe," "reflection must be synchronous"), describe motion physically (hand/object physics), give background life ("nobody sits like a mannequin"), close with a quiet visual ending rather than explaining.

**How this maps to ads:** use passports for a recurring brand character and van/truck/trap props, one LOOK block for the whole campaign, and 5 to 8 s one-take shots stitched into a 30 to 45 s story ad.

### 2.4 Podcast ads (Seedance 2.0, "AI Podcast")

**Why it works:** "overheard authority." The viewer feels they caught the best 20 to 40 seconds of a long expert conversation. Sample lesson: Grüns greens gummies, with a host (blonde, red top) and an expert (brunette, beige tank), both in a white boucle-chair studio.

**Workflow:**
1. Create character images (inspiration from Pinterest), GPT Image 2.0 or Nano Banana Pro, vertical 9:16 studio portrait of each person seated with a boom-arm mic in frame (prompt includes pose, outfit, high-key daylight, 50 mm f/2.8, "avoid plastic skin, warped mic arm, AI glamour face").
2. Product: use the **real packshot photo**, not an AI-generated product (front-facing clean crop) as a reference element.
3. Write the script with the Podcast master prompt (HOST and GUEST labels; guest carries the insight/mechanism/proof; host reacts, asks follow-ups; product appears as the answer to "what do you use / recommend," not a sponsor read; open mid-conversation; reaction shots (eyebrows, leaning in, laughing, pausing)).
4. Convert to video prompts using the guide's examples: feed the guide prompts to a chat model as a style reference and ask for the same for your product.
5. In PromptWise: Create Video, select Omni-reference, upload character images, paste prompt, attach elements as `@image1`, `@image2` (order matters, and the prompt uses those tags), generate.
6. Edit in CapCut: reduce contrast, colour grade, add captions; apply the "remove the AI look" method.

**Production spec:** Seedance 2.0, 1080p, 9:16, audio on. The sample ad is six clips: five 15 s Seedance shots (0:00-1:12) plus a 6 s product shot (1:12-1:18); a CapCut end card is added after the final shot.

**Per-shot prompt structure (the "DUO PODCAST" template):**
- Header: `[SEEDANCE 2.0, DUO PODCAST, SHOT n/5, DURATION 15s, 9:16, CONTINUING FROM: Shot n-1 ("last line..."), CONTINUES INTO: ...]`
- SETTING fixed and identical in every shot (professional softbox studio light, not window light, no window glare, ceiling not in frame, same sofa, gallery wall, two mic booms already positioned, natural room tone, no music, no reverb).
- CHARACTERS locked (identity, wardrobe, pose, skin) "zero restyle across the sequence."
- SKIN and REALISM clause (visible pores, irregular blinking never synced, micro-expressions tied to word meaning).
- Optional WIDE TWO-SHOT block using a reference image; mic brand lettering locked ("one RODE wordmark, legible, never morphing"), water glasses at different levels, pose continuity, emotional continuity ("direct continuation of the laugh building in the close-up, not a fresh establishing shot").
- PACING PRIORITY (e.g., "54 words in this shot: brisk, like friends talking over each other; if ahead of schedule, hold a silent beat, never slow the speech").
- AUDIO-CONTINUES-UNDER-CUTAWAY (reaction shots while the speaker's voice continues; lip-sync only for whoever is speaking on screen).
- GESTURE LOGIC (gestures tied to words).
- VISUAL CUT SEQUENCE: a timed list of 12 to 14 cuts per 15 s (average ~1.3 s), labelled CAM-A (host), CAM-B (guest), CAM-C (reaction inserts), CAM-VIEW (wide), each with what's said.
- DIALOGUE verbatim, attributed with voice casting ("warm American female voice, brisk and articulate, NOT slow").
- NEGATIVE/AVOID: stretched speech, dead air, plastic skin, robotic synchronised blinking, mismatched lip-sync, morphing face, wardrobe or lighting changes between cuts, text overlays, subtitles, watermark, music, looping gestures.
- Final shot: single continuous handheld pull-back to reveal the table and product, with a human-imperfect arc and a final focus pull; product only exact via the real packshot.

**Sample dialogue arc (educational, myth-killer style):** expert states the problem ("everyone starts a habit motivated, three days later it's in the cupboard"); host jokes ("I have three green powders in my cupboard"); expert reframes ("it's not you, the experience is the problem"); shared laugh about the competitor's bad taste; stat; product appears; soft CTA.

**Tips:** keep each shot's setting block identical; give word budgets per 15 s; keep the wide shot short and continuous with the laugh; use real product photo.

### 2.5 2D animation ads (Seedance 2.0, "Ghibli / Prince of Egypt" painted look)

**Why it works:** relatability. A named character is stuck in a relatable problem; the viewer sees themselves without being attacked. Rules from the master prompt: named character, inside the problem from frame one, show pain through actions not narration, expressive faces (flat faces kill it), simple readable world, consistent design, can become recurring, product enters as the thing that changes the character's day. Sound: warm narration, light cartoon transitions, UI-style sounds, simple music bed. Best hooks: named relatable ("This is Maya. Maya [painful thing] every day."), social tension (two characters in conflict), fourth-wall look with blunt caption, visualised inner thought (stress meter, money leak).

**Sample (AURA calming supplement):** the core visual metaphor is a personal rain cloud above the protagonist; the cloud thins and turns white as she takes the product, and a bystander's own cloud fades when he takes it too. Structure: ~5 generations of 8 to 13 s, 10 scenes, total ~60 s: reveal, starting point, origin flashback (soft nostalgic haze marks the memory), therapist scene, breaking point, product introduced, results, a date, an emotional close with the product label as the CTA beat.

**Workflow:**
1. Characters and product as **7-panel reference collages** in GPT Image 2.0 (16:9, generate at 4K): two-row grid on parchment, panels = full-body front, 3/4 portrait, back view, side profile, extreme face, two macro texture panels. Give every prompt the style anchor: "2D animated film still, hand-painted, gouache brushwork, painterly outline with line-weight variation, flat-to-soft gradient colour fields (warm palette against cool accents), painted chiaroscuro with rim light, paper-grain, 3% grain; explicitly NOT a photograph, 3D render or Pixar; EXCLUDE: photorealistic, skin pores, DSLR, anime screentone, chibi, glossy, plastic shading." Character prompt gives a personality line so the design reads specific, not generic.
2. **Product bottle reference** rules: label text large, bold, legible, no fine print (fine print morphs when regenerated); state exactly what is inside (opaque powder capsules, "NOT oily softgels") and what props represent each ingredient; include a back-label panel with big block text.
3. Video prompts per generation: style header repeated verbatim; "Characters in this generation: @a, @b"; BASELINE line (the emotional state to establish first); numbered SCENES with timestamp ranges, each broken into SHOTS with seconds, **lens in mm and f-stop**, camera movement (parallax drift, orbital arc, rack focus, crane rise), the acting, and an explicit TRANSITION line for each cut (match cut on a physical object, whip-pan on eyeline, hard graphic cut timed to a gust, never blur or cross-dissolve; one transition is a single push-through-the-object).
4. **SOUND line** specifying ambient and character sounds with "NO MUSIC anywhere" (music added in edit).
5. Product-lock-in standalone shot used for the label card.
6. Final assembly in CapCut: import generations in order, lay a voiceover track generated in ElevenLabs (voice "Elise") over the top.

**Tips:** quote exact spoken lines inside the shot; keep the product visible with label facing camera "no morphing of text or capsules"; physical consequences link scenes (the leaf that gets kicked carries into the next scene).

### 2.6 Claymation ads (Seedance 2.0, Laika/Aardman stop-motion)

**Why it works:** charm and pattern interrupt in a feed of talking heads. Rules from the master prompt: whole ad inside one consistent clay world; extremely simple story (problem, struggle, product as the turn, result); product physically exists in the miniature world; imperfection is the asset (visible fingerprints, clay seams, handmade props, slightly jittery movement); first frame must stop the scroll before the voiceover registers; sound design matters (clay squish, tiny footsteps, tactile foley, crisp reveal sound). Visual rules: handmade clay characters, miniature props, warm lamp-like lighting, shallow depth of field, cosy set, frame-by-frame movement. Best hooks: before/after in frame one, visibly suffering clay character, provocative on-screen question, timer-based transformation, miniature-world metaphor.

**Sample (SIR SCENT men's body butter, ~1:26):** a medieval knight who slew a dragon but offends a princess with his smell; cut to the modern version (same face, new wardrobe), office/gym/home scenes where the problem shows, a hermit "scent keeper" with a key, a "tree of memory," a shower scene where the problem's aura is recoloured, then a transformed hero in a city and a coffee-shop meeting, a mirror reveal of the knight with family, a horse-riding packshot of the bottle. Voiceover lines set the narrative beats.

**Workflow:**
1. **Character reference sheets**: 6 panels in a 3x2 grid (front, 3/4 portrait, back / side profile, extreme face, two detail panels). Style anchor: "3D claymation animation style, Laika/Aardman quality, visible clay surface texture with fingerprint impressions." A recurring character appears in several costumes: later sheets say "SAME CHARACTER as @Hero-Modern: same hair, same face, only the costume changes." Each sheet also describes the emotion/energy the character must hold (nervous vs. settled and powerful) with explicit "NO goofy expressions" negatives. Metal and fabric rendered as clay.
2. **Product sheet** (6 panels: hero 3/4, side, top, base close-up, cap close-up, label close-up): describe the silhouette (chess-king bottle), cap shape, body material (matte obsidian clay), embossed label with exact text and a "text clearly readable" instruction, and context props.
3. **Clip prompts**, six clips of 13 to 15 s (0:00-1:26): header "Attach: @a | @b", "5 shots, 15 seconds, 9:16"; a **CLAYMATION STYLE** paragraph repeated every clip ("real physical stop-motion clay puppet animation like Laika; skin shows fingerprints; fabric folds stiff rounded clay; rounded oversized heads; frame-by-frame micro-tremor; ABSOLUTELY NOT Pixar CGI or smooth 3D"); then Shots 1 to 5 with seconds, "SINGLE CHARACTER @X" tag (limits who is in each shot), setting, action, speech ("Mouth moves speaking: ..."), camera, lighting, AUDIO list. Special effects kept physical: e.g., "aromatic wisps float 25 cm AROUND his body, not touching skin or armor." Final line per clip: "Style: ... Avoid: ..." (golden outlines on bodies, VFX touching skin, mirror showing two versions of one character, Pixar plastic, jitter, warped faces). A last "packshot" shot: product dead centre, held static 2 s, single chime then silence.
4. **Settings (stated):** Seedance 2.0 standard, 720p, 9:16, generate_audio on.
5. **Voiceover:** ElevenLabs, voice "George" (warm, captivating storyteller), Stability 78, Similarity 75, Style 22, Speed 1.05. Script given with timestamps tied to scenes (e.g., "Scent isn't chemistry. It's memory." / closing tagline).
6. Edit in CapCut.

---

## 3. Tools and models named

| Tool / model | Used for | Notes |
|---|---|---|
| **Seedance 2.0 / 2.0 Fast** (ByteDance) | Main video model: talking-avatar UGC, B-roll, podcast, 2D, clay. Strong lip-sync, physical action, audio generation | ~15 s max per generation; "quite expensive"; Fast is cheaper, normal is better. Supports `@image` reference tagging, custom audio via @, 720p/1080p, 9:16, audio on |
| **Seedance 2.5 Omni-reference** | Multi-shot short films; up to 50 references per generation; used for the 72-shot workflow | Shots 5 to 16 s |
| **Veo 3.1** (Google) | Cheaper lip-sync/dialogue option; "Standard" UGC Factory tier | Dialogue word count must match clip length or it rushes/gibberish |
| **Kling** | B-roll in UGC Factory Standard | Only mentioned in that context |
| **GPT Image 2.0 (ChatGPT Image)** | Character passports, object passports, reference collages, product sheets | Preferred for realism and sheets |
| **Nano Banana Pro** (Google) | Character photos, location plates and viewpoint rotation | Equal preference to GPT Image for realism |
| **ElevenLabs** | Voiceover (voices Elise, George named; settings Stability 78 / Similarity 75 / Style 22 / Speed 1.05) and custom audio fed into Seedance | |
| **CapCut** | Assembly, captions, colour grade, end card, VO layering | Reduce contrast, grade to cut the AI look |
| **ChatGPT / any LLM** | Run the master prompts: scripts, hooks, per-shot prompts | Attach reference images and PDFs |
| **PromptWise** (course platform) | Hosts the models, the UGC Factory, reference-element library, project generations panel | Credits-based; Premium costs more than Standard. We can reproduce the pipeline with direct access to the underlying models |
| **UGC Factory** (inside PromptWise) | Form-based automated avatar ads: Premium (Seedance) and Standard (Veo 3.1 + Kling) | No prices given in these lessons |

Credit/cost notes: only qualitative ("Seedance quite expensive, Fast cheaper, Veo 3.1 cheaper, Standard tier fewer credits"). No dollar figures. The course also recommends 720p std for claymation test runs and 1080p for podcast and 2D.

---

## 4. Got Moles applicability

### Fit assessment (local home-service brand, Meta/Google-adjacent, Western Washington, chemical-free mole control)

| Format | Fit | Why |
|---|---|---|
| **Podcast ad (expert + host)** | High | Our differentiator is expertise (professional, chemical-free, no-catch guarantee). An overheard "expert corrects the myth" clip builds trust; no product packshot needed, and the "myth killer" and "educator" frameworks fit mole control (castor oil, sonic spikes, poison all fail). Easiest to keep honest if characters are framed as host/expert and not as customers. |
| **Claymation** | High | Moles are a naturally cute, charming subject for clay; the format is a pattern-interrupt, obviously stylised (nobody mistakes it for a testimonial), cheap to iterate, and removes any need to show real animals dying. Fits "lead with chemical-free and safe." |
| **2D animation (named character)** | High | Relatable homeowner story (a named homeowner whose lawn is wrecked) with a visualised metaphor. Obvious illustration also avoids realism problems. |
| **Avatar UGC talking head** | Medium, with guardrails | Strong for Facebook/Reels lead gen, but it is the format most at risk of looking like a fake customer review (see risks). Works if the avatar is clearly a brand presenter or if we use real photos/voices of our techs and customers. |
| **Seedance short-film story ads** | Medium | Great brand-film or YouTube pre-roll quality; passports + look block give consistency for a recurring tech character, van and yard. Costly per shot. Best for 1 to 2 hero spots rather than volume. |
| **Avatar autopilot (UGC Factory)** | Low to medium | Built for physical consumer products with packshots; we sell a service. Could do "tech talking to camera + B-roll of a yard" but needs real footage. |
| **B-roll-only fast cut** | Medium | We do not have a packshot product, but the idea transfers to service-process B-roll (trap kit, yard walk, lawn restoration), ideally real footage with AI used only for stylised inserts. |

### Concrete mole-control ad ideas, by format

Guardrails baked in: US English, lead with "chemical-free and safe mole control," trapping only as method explanation, no I-713 claims, no body-gripping/kill wording in ads (Posture-A silent mechanism), no "WA's #1," review count per current rules (283+ five-star, not 292), "15+ years" is Spencer's experience (company founded 2017), pricing only as confirmed, commercial and 5+ acres is a bid.

1. **Podcast, "The lawn myths mole expert" (Myth Killer / Educator, 30 to 45 s).** Host asks, "Wait, castor oil doesn't work?" Expert (positioned as "mole-control specialist," not a customer) explains why repellents, sonic spikes and poison miss the problem: moles move through tunnels and eat earthworms, so you need to find the active runs. Product-as-answer: "That's why we use professional methods, chemical-free, safe around pets and kids." CTA: call/text for a free quote. Hook: "Everything on your hardware-store shelf for moles is a waste of money." (Only claim what we can back; keep the word "waste" to Spencer's approval.) Audience: problem-aware, cold.
2. **Podcast, "Why do moles keep coming back?" (Educator).** Guest explains that a single catch doesn't equal gone; monitoring and follow-up visits matter, introducing the monitoring plan without quoting prices. Use only confirmed program facts.
3. **Claymation, "Mole vs. Mowers" or "Tiny Yard Rescue" (problem, struggle, product as the turn, result, 15 to 30 s).** A sad clay homeowner staring at a ridge-pocked lawn; a clay mole smugly popping up like whack-a-mole; a clay Got Moles tech arrives with a toolkit and calm confidence; the final frame is a smooth clay lawn, a dog and kid running on it, packshot "Chemical-free. Safe for pets and kids." Hook: before/after in frame one, or the timer idea ("This lawn becomes this."). No clay mole harmed on screen; the "turn" is the tech identifying active tunnels and the lawn recovering. Keep the van/logo as a recurring object passport.
4. **2D animation, named homeowner story (60 s Meta/YouTube).** "This is Dana. Every morning Dana walks her yard and counts the new hills." Visual metaphor: little dirt-mound tally on a sticky note that grows. Scenes: neighbour's lush lawn (social tension), dog digging, kid tripping on tunnel, fix: tech visit, lawn flattened and green, Dana relaxed on the lawn. Brand-voice lines carry the claims, ending with a simple CTA card. Obviously fictional, so no fake-review issue.
5. **Avatar UGC talking head (only with disclosure or a real person).** Safest versions: (a) a **real tech or Spencer** as the talking head (photo-real clone only with their consent), delivering "3 signs you have moles, not voles"; (b) a presenter-style brand explainer, not a testimonial. Mole-specific B-roll via fast-cut prompt adapted to service: close-up of a fresh ridge, soil texture, probing the ground, walking the yard at dusk, a clean final hero shot of a tidy lawn.
6. **Seedance short film (hero brand spot, 30 to 45 s).** Passports for "the tech," the van, the lawn, a pet. A dusk yard in Western Washington, rain-soaked soil, ridges threading across the lawn, the tech reading the ground, a homeowner relieved. Use the look block (overcast PNW light) and one-take shots chained with frame-from-previous. Skip any trap close-ups; show monitoring and a healed lawn.
7. **Hook library (Seedance chaos hooks, applied honestly).** Examples: a hand-held floor-level cam of a lawn where a clay or CGI-free "ridge" travels across the grass (a harmless "something under the lawn" gag, no animal injury), deadpan homeowner line ("I was told that's a drainage issue"). Test five hooks against one body ad per the testing rule.
8. **Awareness-ladder mapping for the funnel.** Unaware: odd-ridge hook video ("What's making these lines in your lawn?"). Problem-aware: Pressure Cooker or 2D story. Solution-aware: podcast Myth Killer. Product-aware: Witness-style real review compilation (real reviews only). Most-aware: seasonal offer retargeting, text-only plus a real tech clip.

### Suggested testing plan (course method, applied)
Same body, three hooks; same script, podcast vs claymation; track cost per booked job (our standing metric), not just leads. Keep variations purposeful; one variable at a time.

### Risk flags: course advice we must NOT follow or must adapt

1. **Fake testimonials and AI people posing as real customers.** The course repeatedly produces "I've been using this for two weeks, I really like it" selfie videos from AI avatars, and one framework (13 Witness, Testimonial Cascade) tells the AI to "start with a real person describing the pain... stack multiple voices." Avatar ads with "testimonial-style," "authority" (a fake doctor delivering health advice, as in the massage-gun sample), and "social proof" angles invite deceptive endorsements. For us: no AI-generated "customers," no invented reviews, no fabricated results; FTC endorsement rules apply, and our claims guardrails (only real, current review figures) override. If a human-looking presenter is used, make it clearly a brand spokesperson, or a real person who consented, and keep the content to educational explanations rather than first-person experience claims. Meta's policy on AI/manipulated media and personal-experience claims also needs checking before spend.
2. **The "I'm only AI" and "AI avatar clone" reveals** are novelty hooks aimed at selling the course; do not use the AI-reveal gimmick for a local service brand where trust matters.
3. **Fake authority ("doctor," "expert")** for non-expert actors. Our podcast "expert" must not be portrayed as a credentialed professional or a Got Moles employee who does not exist; label as "mole-control specialist" only if backed by the real team, or use a real tech's likeness with consent.
4. **Unsubstantiated outcomes.** Sample outputs include "10 million views," "190 posts," supplements that make a cloud of anxiety vanish. The course's own prompts say no fake results, so enforce that: no guarantees beyond our confirmed no-catch policy, no health or safety claims beyond "chemical-free; safe for pets and children," no invented stats (framework rule).
5. **Depicting animal harm.** The ad-hook generator rewards "visual chaos, destruction, violent impact." Our brand guidance is Posture-A silent-mechanism: no body-gripping/kill/lethal wording or visuals; do not show mole death, traps snapping, or dead moles; do not show harmed animals even in clay or 2D. Anthropomorphised moles as gag characters are fine only if the story is about the tech solving the problem, never about the mole suffering. The ceiling-crash-style "someone is injured" hooks are not on-brand either.
6. **Platform realism tricks designed to defeat ad review or viewer detection** ("remove the AI look," raw phone footage styling, no labels). For us, consider disclosing AI-generated content where platform rules require it.
7. **Brand/third-party likeness and names.** Sample prompts use real brands (Grüns, Summer Fridays, Nike, BMW). Do not mimic third-party brands or celebrities; do not write competitor names into prompts.
8. **PromptWise dependence.** All workflows reference PromptWise credits; we can reproduce the pipeline with the underlying models (Seedance, Veo 3.1, Kling, GPT Image 2.0, Nano Banana Pro, ElevenLabs, CapCut) via other access, but the UGC Factory automation (video-type grid, word counter, built-in templates) has no direct equivalent, so we would replicate it with our own prompts (word counter rule: roughly speech-rate-matched words per second).
9. **Mixed claims in samples.** Medical-adjacent product claims appear in examples (supplement, muscle, skincare). Not our category, but the same "no medical/financial claims" clause should be copied into our skill's guardrail block.
10. **UK spellings and accents** appear in some prompts; our content must be US English and US accent ("American accent" token).

### What to carry into the skill (summary)
- A master-prompt pack: one skeleton, six format variants, the 16-framework engine, the 10-step process, with Got Moles fields prefilled (audience, claims, restrictions, CTA).
- A "look block" and passport system for any recurring character, van and yard.
- A per-clip prompt template with word-count-to-duration rule, locked negatives, ambient-only sound design and SFX lists.
- A hook generator prompt (adapted: pattern interrupt without injury or animal harm).
- A pre-ship checklist (product/logo accuracy, lip sync, identity drift, claims, US English, no animal harm, disclosure).
- A testing log keyed to cost per booked job.
