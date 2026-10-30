# Digest D: AI Video Bootcamp, Foundations (Phase 2) and Advanced Flows (Phase 6)

Source: Skool "AI Video Bootcamp" (AVB), folders 01-start-here, 02-ai-creator-foundations, 06-advanced-flows. Written for the Got Moles AI-video-ad skill. Paraphrased; short templates quoted where structure matters.

Caveat up front: the course is built around its owners' own platform, Promptwise, and its in-house chat assistant "Wise". Some claims (cheaper than competitors, "best way in 2026") are marketing. The method underneath is tool-agnostic and mostly reusable with other tools. No lesson in these three folders gives hard credit prices, a wide model comparison, or any API documentation. Where a gap matters it is flagged.

---

## 1. Production philosophy and pipeline

### Core beliefs
- **Process beats tool.** Strong AI content comes from following a sequence, not from a secret model or luck. Random generating wastes credits.
- **Define the outcome before opening any generator.** A real idea is specific: format, length, platform, audience, feeling, deliverable. "Something cool" is not an idea. Five gate questions: What am I making? Where is it going? Who is it for? What should it make people feel? What is the final output (still, video, ad, thumbnail, client asset)? If those cannot be answered, do not generate yet.
- **Use chat to think before spending credits.** The LLM is the cheapest step, so all ideation, scripting, prompt writing, and diagnosis happens there first.
- **Images first, video second.** Images are cheaper, faster, and easier to control. Lock composition, character, setting, lighting, and brand details at the still stage. If the image is wrong, video will be worse; if a face looks fake as a still it will look worse moving.
- **Fix at the right layer.** Small flaws (background, lighting, hands, a product label) get edited in the refine step. A fundamentally wrong composition, concept, or angle goes back to the chat/prompt step and gets regenerated, not polished.
- **Volume and iteration.** The tone is "create volume, iterate fast". Variation is cheap relative to a shoot, so produce many options and pick.
- **Sound is part of quality.** A good-looking clip with empty audio feels generated; layered ambience, effects, and music make it feel produced.
- **Human judgement stays.** Even the most automated flow (Magic Flow) deliberately does not auto-run the expensive video step, so a person rejects bad stills before paying for motion.

### The six-step pipeline (the course's "bulletproof workflow")
Idea -> Chat -> Image -> Refine -> Video -> Edit and Post.

1. **Idea.** Write the one-sentence outcome. Examples the course uses: a 15-second cinematic TikTok; a product photo for a client Instagram; a 30-second UGC-style ad "using a hook, problem, solution and CTA structure".
2. **Chat.** Develop the concept, script, shot list, image prompts, and video prompts in an LLM. Ask it what is weak and what could look fake; iterate.
3. **Image.** Choose the model for the job, set the correct aspect ratio, generate. QC questions: consistent with the other scenes? Lighting matches mood? Person/product/character believable? Aspect ratio right? Free of the glossy plastic "AI look"?
4. **Refine.** Edit the near-miss (image-edit models named: GPT Image 2.0 and Nano Banana Pro; Canva for small fixes) and **upscale before animating**, because more pixels gives the video model more to work with.
5. **Video.** Feed the refined image as the start frame. The video prompt should describe **motion only**: camera move (dolly, push-in, pan, tilt, orbit), subject movement, environment motion (wind, rain, steam), lighting shifts. Do not re-describe the image; the model can already see it. Skip this step entirely for static ads.
6. **Edit and post.** CapCut (or any editor) for trimming, ordering, transitions, captions, music, sound effects, export. Short-form checks: strong first second, captions where they help, ambient sound (footsteps, rain, crowd, fabric), pacing matched to music.

The course says Flows (section 3) multiplies this pipeline and can cut idea-to-post time roughly in half, but the sequence does not change.

### Aspect ratios (course guidance)
- 9:16 for short-form video, Reels, TikTok, Shorts, Facebook Reels, mobile ads, UGC.
- 4:5 for Instagram/Facebook feed images and static ads, carousels.
- 1:1 for safe/simple multi-platform statics, thumbnails.
- 16:9 for YouTube, websites, horizontal ads.
Wrong ratio at generation time is called out as a repeated mistake; pick it before generating, not in the edit.

### Roadmap context
Nine phases: basics, foundations, images, video, ads and UGC (goal: a 10-20 second ad), advanced flows, social media, filmmaking, cloning/scaling. Phases 3, 4, 5 are outside this digest, so detail on UGC ad structure, image-model comparison, and video prompting depth lives elsewhere. One UGC structure surfaces in the chat prompt pack (below).

---

## 2. Foundations

### Model categories (the "workshop" mental model)
Do not ask which model is best; ask what job it does at this stage.
- **Chat/LLM** (planning layer): ChatGPT (all-rounder), Claude (longer, more natural writing; good for scripts and detailed breakdowns), Gemini (research/factual), DeepSeek, and Wise (the in-platform assistant, free inside Promptwise, aware of the platform's models, and able to trigger image/video generation).
- **Image** (visual foundation): realism and faces vary by model. Names mentioned: GPT Image 2.0 ("ChatGPT Image 2.0"), Nano Banana Pro, Midjourney (optional, artistic, weak at realism and consistency per the instructor).
- **Video** (motion layer): Seedance, Kling, Veo, "Gemini Omni" named. Differences: cinematic quality, lip-sync, face/human motion handling, speed-vs-final-quality tradeoff.
- **Voice/audio** (immersion layer): ElevenLabs (voice, SFX, music) is integrated in the platform; Pixabay for free sound effects.

### The tool stack (course's recommended minimal set)
- **Promptwise** (generation hub: all models, Wise chat, prompt library, assets, seeds, Flows, Influencer Studio, UGC Factory). 50 free trial credits at signup.
- **CapCut** (mostly free, desktop and mobile) for editing. Any editor is fine if already known.
- **Canva** (free) for resizing, background removal, text, small image edits.
- **Midjourney** optional.
- Advice: do not spend weeks researching tools; the best tool is the one learned and used consistently.

Platform features worth knowing:
- **My Prompts:** one-click save of any prompt that worked (with the output). The instructor calls the library the most valuable long-term asset because a new job starts from a proven prompt.
- **Assets:** saved generations, characters, products.
- **Seeds:** reusable consistency elements (a product, a person), referenced with an @ mention so the same subject recurs.
- **UGC Factory / Influencer Studio:** specialised pages for batch UGC-style content and consistent characters. Not taught in these folders.

### Credits and cost management (what the course actually says)
There is no price table in these folders. The cost-control habits that appear:
- Chat first, because chat is free or near-free and generation costs credits.
- Images before video, because video is the expensive stage.
- Do not regenerate blindly; paste the prompt and the problem into chat and get a diagnosis.
- Run one node at a time when testing, full flow only when committed. The platform computes cost from the selected models and settings before a run.
- More scenes in Magic Flow means more generations and credits; scene count is a budget lever.
- Video nodes in Magic Flow do not auto-run, so rejected stills never get animated.
- Save good prompts so repeats do not need re-exploration.
- Pick the right ratio up front to avoid re-generation.

### Talking to LLMs (the chat discipline)
Five rules: (1) give context about what you are working on; (2) be specific about outcome (length, platform, audience, tone, hook style, goal); (3) iterate, since the first output is a draft; (4) paste your own work in for critique; (5) when something comes out bad, paste the prompt plus a description of what went wrong and ask for a diagnosis and a rewrite.

**Four-part formula for any request:** Context, Goal, Details, Output format.

**The Master Prompt template** (quoted because the structure is the useful part):
> "I'm working on [what you are creating]. My goal is [outcome]. The audience is [who]. The style should be [tone, mood, visual style, pacing, realism]. I want to avoid [what you do not want]. Help me by [exact task]. Please format the answer as [ideas / script / prompt / table / checklist / JSON / step-by-step plan]."

The same pack provides ready templates for: ideas (10 original ideas each with concept, visual hook, why it stops the scroll, how to make it with AI); improving a weak idea; writing image prompts (subject, environment, composition, camera, lens feel, lighting, textures, mood, realism details, what to avoid); fixing fake-looking images; video prompts (camera movement, subject movement, environmental motion, lighting change, realism, sound direction; avoid overdramatic movement, fake slow-mo, warped faces, rubbery motion); troubleshooting bad video; scripts; critique; humanizing; variations ("same core concept, change angle, mood, setting, hook, visual style and execution"); messy idea to plan; convert to JSON.

**Follow-up commands** worth hard-coding into any agent loop: make it more specific / less generic / give 5 stronger versions / make the hook stronger / cut by 30% / less corporate / explain what is weak / now turn it into a prompt I can use / now convert to JSON.

**20-prompt starter pack** (role-prompt style: "You are an expert X... audience... goal... avoid... give me N options and rank them"). Most relevant for ads:
- *Ad Strategist:* inputs product, audience, desired outcome, problem, main objection, platform; asks for 20 angles, each with hook, core message, emotional trigger, visual idea, script direction, why it could work, what to avoid; then rank the top 5. Explicitly bans fake urgency and exaggerated claims.
- *UGC Scriptwriter:* speaker persona; structure **Hook, Relatable problem, Discovery, Benefit, Specific detail, CTA**; outputs 5 hooks, 3 full scripts, 3 CTAs, a casual and a direct version. Avoids "paid actor" and fake-testimonial sound.
- *Hook Writer:* 40 hooks across eight categories (curiosity, pain-point, contrarian, direct benefit, story, slightly funny, beginner-friendly, authority), then pick the best 10 with reasons; supply a banned-cliche list.
- *Customer Research:* 20 pain points, desires, objections, emotional triggers, and customer phrases, plus 10 content ideas and 10 ad angles derived from them.
- *Creative Director / Brutally Honest Reviewer / Script Doctor / Natural Voice Rewriter:* critique-and-rewrite passes. The Natural Voice prompt bans robotic wording, corporate phrases, and choppy sentences.
- Others (copywriter, brand strategist, offer, landing page, email, sales page critic, product description, consultant, teacher, idea generator) are general marketing helpers.

The pack is a generic copywriting prompt library. For Got Moles, copy and claims must still pass the house claims guardrails and positioning rules before anything is produced.

### Image/video prompting fundamentals
**AVB 6-part framework: Subject, Environment, Camera, Lighting, Mood, Style.** If a result is poor, one of these is missing or weak.
- **Subject:** specific physical detail (age, hair, clothing, expression, posture, action; for products shape, material, colour, texture, packaging, position). A vague subject gives a vague image.
- **Environment:** specific place, time of day, weather, background objects, textures, atmosphere. Context makes it look expensive and tells a story.
- **Camera:** shot size and angle (wide, medium, close-up, low angle for power, high angle for vulnerability, over-the-shoulder, POV). For video, state what the camera does (push in, handheld follow, slow orbit, locked tripod).
- **Lighting:** name the *source and direction*, not "cinematic lighting". Pattern: a small warm lamp left of frame lighting her face; red neon from a sign on the right. Bad lighting is the main cause of plastic AI looks; real photos have uneven, imperfect light.
- **Mood:** one or two words max.
- **Style:** optional. For realism, plain "realistic iPhone photo" often suffices; words like cinematic masterpiece, hyper-detailed, ultra-glossy, award-winning, perfect lighting push toward a fake polished look.

**Recipe:** [Subject] in [environment], [camera angle/framing], [lighting source and direction], [mood], [visual style]. For video, take the image prompt and add what moves; keep it simple and specific.

**Prompt ladder:** start with the seed idea and add layers one at a time (subject, environment, camera, lighting, mood, style) rather than writing a perfect prompt at once.

**Diagnosis table:**
- Generic -> more specific subject, environment, story detail.
- Fake -> remove over-polished style words, add natural imperfections (natural skin texture, candid phone photo, uneven light, motion blur, compression).
- Wrong lighting -> describe the real source and direction.
- Boring composition -> add shot size, angle, framing.
- Ignored detail -> move it earlier in the prompt.
- Too busy -> cut details.
A prompt is better when intentional, not longer; 35 sharp words beat 200 random ones.

**Platform aids:** "Wise Enhance" rewrites a rough prompt and takes attached reference images into account; an "Assist" panel offers clickable additions. The instructor's position: you barely need to write prompts by hand now, but you must know what good looks like so you can judge output.

**JSON prompting:** structure a prompt into labelled fields (subject, environment, camera, lighting, style, motion, mood, negative instructions, final prompt). The course does not claim it always beats prose, but it makes gaps visible (an empty camera field means the model will guess framing) and makes prompts repeatable and swappable field by field. Any LLM can convert a prose prompt to this format on request. This is directly useful for scripted pipelines (section 4).

---

## 3. Advanced node-based workflows (Phase 6)

### Platform
**Flows inside Promptwise.** A visual canvas of nodes connected by lines, positioned by the instructor as the fastest way to make content in 2026. It is a proprietary canvas; Weavy, ComfyUI, and Freepik Spaces are not mentioned in these folders. Everything doable in Promptwise Studio works inside Flows with the same models and settings; Flows adds chaining. The concept (node graph, outputs feed inputs, dependency-ordered runs) is the same as ComfyUI/Weavy-style systems, so the design ideas port.

### Canvas mechanics
- Pan, zoom, drag, resize, multi-select (Shift), delete, centre, clear canvas, delete connection lines by click.
- Drag files from the desktop onto the canvas (or right-click upload). Uploads sit as inspiration/reference tiles until you press **Convert** to make them live nodes.
- **Run one node** (testing a step, checking before committing) or **Run Flow** (runs everything connected in dependency order: the image completes before the video that needs it starts). **Rerun selection** redoes the nodes on the canvas. A Stop button cancels. Estimated cost is shown from the chosen models and settings before running.
- A working flow becomes a **reusable template**; swap the inputs (product image, character, prompt text) and rerun. That is the batch-production primitive.

### Node types
- **Image generator node:** prompt, model, ratio, quality, Wise Enhance. Up to **8 image references** per node, uploaded or wired from other image nodes (example: character node + product node -> third node "same character holding that product"). Every run **adds to a carousel** inside the node instead of overwriting; the currently selected carousel item is what flows downstream. Quick actions after generating:
  - *Animate:* spawns a connected video node with the image as start frame.
  - *Remove Background.*
  - *Variations:* N alternatives keeping the concept (changes pose, outfit, lighting, colours); spawns an image gallery.
  - *Angles:* N different camera angles of the same scene; good for a consistent shot set and carousels.
  - *Edit:* loads the image as reference and you type the change ("make the ice cream pink").
  - *Rerun:* regenerates the original with its references (a redo, as opposed to Edit which modifies the current image).
- **Video generator node:** text-to-video, start frame, end frame, or Omni Reference models (e.g. Seedance, up to 9 references; audio can be a reference). Wiring one image puts it in start-frame; a second goes to end-frame. **"Generate prompt for me"** analyses the connected image and writes the motion prompt. Kling has a multi-shot toggle.
- **Audio node:** ElevenLabs voices, sound effects, music. Audio mostly does not chain into the image/video path; it is generated and then taken into the final edit, apart from models that accept audio as an Omni reference.
- **Prompt node:** a text box that feeds one prompt to many nodes; edit once and all connected generators update (one-directional: editing downstream does not alter the source). Use it to test the same concept across several models and to store reusable prompts.
- **Upscale node:** 2x (1K to 2K) or 4x (1K to 4K). Do it before animating and for hero/static ads.
- **Remove Background node:** cutouts for product shots and thumbnails.
- **Storyboard node:** takes one image (or several, e.g. influencer + product) and writes a set of continuation prompts that keep subject and style consistent; you choose how many to turn into images, plus ratio and quality; can enhance all prompts; output lands in an image gallery. Different from Angles: it continues the story with new scenes rather than re-shooting one scene.
- **Image/Video galleries:** collector nodes that tidy the canvas, compare options, and act as **reference banks** (connect a gallery to an image or video node and pick which items to use as references or start/end frames). The image gallery has **Animate All**: turn every image in the gallery into a video in one action. The video gallery collects finished clips for a multi-shot piece.

### Magic Flow (automated canvas builder)
Powered by Wise. You write a short concept ("a cinematic sports drink advert set in a hot desert focused on energy, endurance and speed"), choose **number of scenes, aspect ratio, image quality, default video model**, and optionally upload **reference images** (product, character, style). Magic Flow builds the canvas, runs the image nodes immediately, and fills the video nodes with motion prompts but leaves them **unrun** for your approval. Then you extend with Angles, Storyboard, Variations. Reference quality directly controls output quality. Keep the prompt short; scene count drives cost.

### The "ad in under 10 minutes" worked example
Brief: a face oil ad. Inputs: avatar image + product image + one short Magic Flow prompt; 8 scenes.
1. Magic Flow generated 8 consistent stills (avatar identity stable, bottle and label text correct) with video nodes pre-prompted.
2. Reviewed the stills; ran all video nodes.
3. Picked the best product close-up, ran **Angles** (4 more shots), converted to an image node, animated using "Generate prompt for me".
4. Ran **Storyboard** on the best character still for continuation shots, then **Animate All** with Kling on the gallery: about 10 more clips.
5. Audio node generated music.
6. Downloaded all clips into CapCut, shortened, reordered, added transitions and the music.
Total about 10 minutes; the only prompt written by hand was the Magic Flow prompt. The instructor notes it could be improved with extra sound effects and a tighter edit. Takeaway for ad work: the cost is mostly review and edit time, not generation time.

### How to batch ad variants with this system
Derived from the course mechanics (the course has no explicit "variant" lesson):
1. Build once: reference stills (product, location, character) -> image node -> Storyboard/Angles -> gallery -> Animate All -> video gallery.
2. Put the brief/hook/script/prompt text in a **Prompt node** so one change reruns many generators.
3. Variant axes change by swapping a single input: hook text and script, location/property image, season, character reference, aspect ratio (9:16 vs 4:5 vs 16:9), video model, music.
4. Use Variations for visual alternatives and Angles for shot coverage; use the node carousel to keep alternatives together and send the winner downstream.
5. Use the chat-pack prompts to generate 20 angles and 40 hooks in one pass, rank them, and feed the top N into the template as separate runs.
6. Save the working canvas as the template and the winning prompts to My Prompts.
Limits: Run Flow regenerates the whole chain (credit cost), so test single nodes first. Audio does not chain. Final assembly still happens outside Flows in CapCut.

---

## 4. API and automation relevant items

What the folders state:
- **Promptwise MCP server:** the lesson "Connecting Claude and ChatGPT to Promptwise (MCP)" holds only a link, `https://app.promptwise.com/mcp`, plus "more MCP stuff coming soon". The video is Skool-hosted and not transcribed, so tool names, auth method, and capabilities are **unknown** from this corpus. This is the only first-party programmatic route mentioned, and it would let Claude call Promptwise generation tools directly, which fits a Claude-driven skill. Action item: open that lesson video, note the setup steps, scopes and tool list, and test before the skill depends on it.
- **No REST API or endpoint documentation** for Promptwise, Flows, or Magic Flow appears here. Flows is a UI canvas; no import/export of flow JSON is described.
- **Model names that could be called through their own vendors or aggregators** (names as the course gives them; verify current availability and IDs separately): Seedance (9-reference Omni mode, audio references), Kling (multi-shot), Veo, "Gemini Omni", GPT Image 2.0, Nano Banana Pro, Midjourney (no official public API assumed), ElevenLabs (voice, SFX, music).
- **Prompt format for automation:** the JSON prompt structure (subject, environment, camera, lighting, style, motion, mood, negative instructions, final prompt) is the course's own scriptable schema. A script can template these fields and hand them to whichever generation API is used.
- **Claude can already do the chat layer:** every LLM step in the course (ideas, hooks, UGC script, image prompt, video prompt, diagnosis, JSON conversion, humanizing) is plain prompting a Claude skill can run locally with the Master Prompt template.
- **Non-API tools:** CapCut (manual), Canva (manual), Pixabay (free sound effects). For a no-editor setup, ffmpeg or an editing skill on the Got Moles side could replace the CapCut step; the course does not cover this.

---

## 5. Got Moles applicability: a repeatable weekly ad-variant pipeline without an editor

These are proposals built from the course method, not course statements. House rules from GOT-MOLES.md and CLAUDE.local.md apply throughout: US spelling; chemical-free and safe-for-pets-and-kids positioning; no I-713 claims; no body-gripping, kill, or lethal wording in ads (silent-mechanism posture); review count 289 total / 283 five-star (never the stale 219+); "WA's #1" and unqualified "15+ years" are out; never write "hauled away" (dead moles are double-bagged into the customer's can); lead with "chemical-free and safe mole control" rather than "mole trapping" in headlines; residential pricing only as the confirmed tiers; commercial and 5+ acre never priced in an ad; bids route to Cory. AI imagery of animals, traps, or outcomes needs a claims check: do not show or imply results the company cannot guarantee, and avoid AI visuals that pose as real customer property or real testimonial footage. Spencer approves before any spend or send.

### Weekly cadence (about 60-90 minutes of human time)
**Monday, plan (Claude, chat layer):**
- One-line outcome per ad: platform, ratio, length (15-20 s), audience (residential homeowner, property manager), single message.
- Run Customer Research and Ad Strategist prompts with Got Moles inputs (audience, pain points such as lawn damage, pets, chemical worries, the objection "does it work"), then Hook Writer (40 hooks), rank, choose 3-5 hooks for the week.
- Run the UGC Scriptwriter structure (Hook, Relatable problem, Discovery, Benefit, Specific detail, CTA) for each chosen hook; then Script Doctor and Natural Voice passes, then the house humanizer.
- Claims gate pass: strip banned phrasing, check numbers against current rules, attach the correct CTA.

**Tuesday, stills (image tool):**
- Maintain a small **reference bank**: Got Moles branding/vehicle/uniform shots, real lawn photos (real photos make better references than invented ones), a consistent "homeowner" character, a "technician" character. Reference quality drives output quality.
- Use the 6-part framework with a Got Moles scene library (Pacific Northwest suburban lawn, wet early-morning light, lawn with fresh molehill ridges, golden retriever on a clean lawn, tech kneeling at a lawn edge). Name light sources specifically and use realism cues; avoid glossy style words.
- Produce stills per variant, QC with the course checklist, upscale winners.

**Wednesday, motion:**
- Animate winners with motion-only prompts (slow push-in, handheld follow, subtle wind). Keep clips short; choose models on a cost/quality tradeoff.
- Add audio: ambient outdoor sound, music; voiceover only where it reads as plain narration, not as a fake customer testimonial.

**Thursday, assembly (the "no editor" question):**
- The course uses CapCut manually. Options without an editor: (a) CapCut templates or auto-captions with a fixed layout, (b) the ffmpeg or Remotion/Hyperframes skills already in this repo stitching clips, burning captions, adding music, and exporting 9:16 and 4:5 from one timeline, (c) outsource only the final cut. Option (b) can be reduced to a script with fixed hook-card and CTA-card templates so assembly takes minutes.

**Friday, review and ship:**
- Spencer reviews the batch (Notion is the stated review surface); approved ads go to the ad platform by a human. Record what ran and the results in a variant log so next Monday's hooks learn from the numbers (cost per booked job, not just cost per lead).

### Variant structure (hook-swap method)
Hold the middle constant and vary one axis at a time:
- **Hook:** pain, curiosity, contrarian, benefit, story.
- **Visual:** lawn only, pet on lawn, technician, close-up on soil/mound.
- **Audience:** homeowner vs property manager vs golf/HOA (commercial angle only drives to a call, no price).
- **Season / seasonal offer.**
- **Ratio:** 9:16, 4:5.
- **CTA:** call, book, ask.
Three hooks x two visuals x two ratios gives 12 outputs, but only about six need new generations if the template is reused.

### Where each course idea slots in
- Master Prompt and prompt pack -> all copy and prompt generation (Claude runs these directly).
- 6-part framework and diagnosis table -> the image/video prompt template in the skill, plus an automatic QC checklist.
- JSON prompt schema -> store each variant as a JSON file (scene, camera, lighting, motion, negatives) so a script can regenerate or modify variants.
- Prompt node / templates -> one master brief file that downstream steps read.
- Storyboard + Animate All -> bulk generation of a shot set from one approved still.
- Magic Flow -> fastest first-draft canvas for an unfamiliar ad idea (brief + 2 references + scene count); good for concepting, then hand-curated.
- Images-first and no-auto-run-of-video rule -> keeps credit spend low.
- My Prompts library -> becomes the repo's prompt library of proven Got Moles prompts.

### Risks and open questions
- The course glosses over **disclosure and realism norms** for AI ads. Ad platforms may require AI-content labelling; check current Google and Meta rules before running. Do not fabricate customers, testimonials, or before/after results.
- Fake-looking lawns or animals undermine trust; use real photos as references where possible.
- Promptwise dependency and pricing are unspecified here; confirm credit cost per image and video before committing a weekly budget, and whether an MCP connection can run generation unattended. If not, generation stays semi-manual (Claude prepares prompts and briefs; a human clicks Run).
- Per the standing autonomy rule: any unattended run needs a Pre-Goal Readiness Check; generation, review, and publishing are not cron-safe by default, and no cron should spend, publish, or send.
