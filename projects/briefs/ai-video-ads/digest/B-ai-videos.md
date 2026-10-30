# Digest B: AI Videos (AI Video Bootcamp, Phase 4)

Source: `skool-corpus/04-ai-videos/` (14 lessons). Written in my own words for the Got Moles AI video ad skill. Model names and versions are as the course names them in late 2026 (Seedance 2.0/2.5, Kling 3.0/4.0, Gemini Omni 1.1, Veo 3.1). Prices are never given as numbers in the course; only relative cost. Treat the course's rankings as one instructor's opinion, re-test before committing budget.

The course's core claim in one line: the better your input, the better your output. Get a strong still image first, then tell the video model only what should move.

---

## 1. Video model landscape as taught

### Course's own quick-pick rule
- Do not ask "which is best", ask "what am I making".
- Avatars and talking people (premium): **Seedance 2.5**.
- B-roll and slower cinematic shots: **Kling 4.0** (4K).
- Good at most things, cheaper, strong at lip-sync and video editing: **Google Gemini Omni 1.1**.
- Cloning yourself and talking-head: **HeyGen** (covered in a later phase, not in this folder).
- Cheap lip-sync and general scenes: **Veo 3.1** (a step below Seedance and Omni).
- For quick tests use cheap/fast models; once an idea works, regenerate the winner in the premium model.

### Seedance (ByteDance), 2.0 and 2.5
- **Strengths:** the course's top model. Best at movement, emotion, acting, camera motion, special effects, prompt accuracy, expressive believable avatars, lip-sync (face feels alive, mouth cleaner, expressions match the sentence), action and fight scenes, product ads.
- **Weaknesses:** the most expensive video model "by far". Course says it is worth it even for just the hero scenes. Reported content-safety refusals on a "spill coffee and react" edit (Gemini Omni allowed it). Can still glitch or morph when overloaded. Slightly over-saturated/over-smooth look on some edits, and the "too clean" AI polish is worst here (see section 6, realism pass).
- **Inputs:** text-to-video, image-to-video, start frame, end frame, and Omni Reference with up to **9 images, 3 videos, 3 audio clips** at once. 2.5 is described as slightly better than 2.0 at audio-driven speech.
- **Duration:** up to **15 seconds** per generation. Resolution 1080p and 4K available.
- **Audio:** native sound toggle on the prompt bar; accepts an uploaded audio file so the character speaks your lines (good for non-English).
- **Best use:** hero versions of avatar ads, UGC with lip-sync, action/VFX shots, 15-second product ads from one hero image, anything the client will see first.
- **Prompting style:** timestamped "time sequence" prompts for 15-second clips (see section 3).

### Kling 3.0 and 4.0 (Kuaishou)
- **Strengths:** cinematic feel, emotional performance, fluid natural movement, long scenes (up to 15 s), native 2K to 4K output, accurate response to named camera movements, good at specific sound effects (e.g. "explosions in the background"), works for animation, cheap multi-shot.
- **Weaknesses:** for talking avatars it is not the strongest. Mouth feels disconnected from audio; **lip-sync and timing fall apart after about 10 seconds**; voices sound robotic. Videos "go glitchy" toward the end, so do not put key dialogue at the end of a clip. The instructor says Seedance 2.0 is "a lot better" for consistency, while multi-shot is cheap and still useful.
- **Key features:**
  - **Omni Reference / "Elements":** select Kling Omni, open the Omni Reference tab, upload up to **7 reference images**, tag them as elements (a named character, product, prop) and refer to the tag in the prompt. Fixes the classic "character turns around and the face changes" problem. Build the references by generating several angles of the same character/product in an image model first (front, side, three-quarter).
  - **Multi-shot:** toggle on; **Auto** (Kling picks cuts) or **Custom** (you set the number of shots, each shot's prompt and length). Max total 15 s; **each shot is at least 3 s**. One start frame can seed several camera angles with strong consistency, removing most of the "make consistent images and stitch" labor. Add shots with the add-shot button.
  - **Start and end frames** both supported.
  - **Motion Control:** transfers body movement from a reference video onto a character image (performance capture without a suit). See section 2.
  - Longer than 5 shots? Skip the multi-shot UI and write one long prompt with "Shot 1... Shot 8" labels.
- **Best use:** B-roll, cinematic and slower shots, product beauty/environment shots, multi-angle story sequences from one frame, motion transfer. Works on kling.ai or via aggregators (Promptwise). Same settings everywhere.
- **Cost:** instructor spent about 150 GBP testing 3.0 in a few days; no per-clip figure. Multi-shot described as cheap relative to Seedance.

### Google Veo 3.1
- **Strengths:** cheaper lip-sync and scenes; good enough that "layering music and editing" makes it useful. Native voice.
- **Weaknesses:** **only 8-second clips**; some mouth glitches; voice needs work; the voice drifts if the description changes between prompts.
- **Settings:** two modes, **Fast** and **Quality**. Quality costs more credits and was only very slightly better at word sync, so the instructor does not think the price gap is justified for most work.
- Output carries a watermark. The resource page links a watermark-removal site (removewatermark.dev) for Veo and Gemini output. For paid ads, confirm licensing/terms before using a watermark remover.

### Google Gemini Omni (Flash, 1.1) via Google Flow
- **Strengths:** second choice for lip-sync (ahead of Veo 3.1 per the instructor), natural-sounding voices that do not sound robotic, consistent lip-sync across lighting conditions, strong **video-to-video editing** (see below), cheaper, "underrated for avatars". Accepts image, audio and video references. Can sync visuals to music (e.g. apartment lights turning on to the beat) when you upload both clip and track as references.
- **Weaknesses:** during edits it sometimes changes things you did not ask for (swapped a background person from woman to man, changed what was happening behind the subject, lip-sync drifted after a background swap). Verify against the original every time.
- **Best use:** cheap variants to find the best hook, then rebuild the winner in Seedance if you need premium finish. Also the editing workhorse.
- **Cost:** Seedance is "at least three times" the price of Gemini Omni for editing.

### Grok Imagine 1.5
- Lip-sync was clean but the voice sounded like a robotic voiceover. Ranked in the same tier as Kling for avatars: decent, needs work.

### Runway
- Mentioned once, in passing, as another tool that can do AI video editing but "really isn't great in comparison". No detail.

### Sora, Hailuo
- Not covered anywhere in this section.

### Lip-sync ranking (instructor's order, same character and script each time)
1. Seedance (best; hero version)
2. Gemini Omni (backup to Seedance, ahead of Veo)
3. Veo 3.1 Quality, then Veo 3.1 Fast (close)
4. Kling 3.0 / Kling Omni and Grok Imagine 1.5 (same tier)

### General model-selection tips
- Cheap-test, expensive-final workflow: draft in Fast/Omni, finish in Seedance.
- Models are short-clip tools. "No video model can generate over 15 to 30 seconds"; think shot by shot, then edit.
- Aggregators (Promptwise) offer most of these models in one subscription and include ElevenLabs audio, so you do not need separate accounts.

---

## 2. Image-to-video vs text-to-video, start/end frames, consistency

### The input options and when to use each
| Input | What it does | Use when | Risk |
|---|---|---|---|
| **Text to video** | Prompt only; model invents everything | Concept exploration, fast idea testing, scenes where exact character/product/layout does not matter | Maximum variation; may not match your mental picture |
| **Image to video** | Your image defines character, product, lighting, angle, composition; the prompt defines motion | Almost everything commercial: ads, avatars, product shots, teaching material | If the image is bad, the video is bad. Image is the most important step |
| **Start frame** | The first frame of the clip | Locking opening composition, subject, outfit, product, lighting, pose | Beginners re-describe the image in the prompt. Do not. The model can see it. Say only what happens |
| **End frame** | The frame the clip moves toward | Transitions, transformations, before/after, product reveals, controlled camera moves, scene changes | Start and end must feel connected. Wildly different frames produce morphing and weird motion |
| **Omni Reference (reference pack)** | Several references at once: character, product, location, style, pose/movement, video, audio/voiceover | Complex scenes: UGC ad with a specific bottle + specific person + specific kitchen + specific voice | Need to say which reference goes where |

Typical prompt bar: two drop zones (start/end), multi-shot toggle, aspect ratio, duration, quality (720p/1080p/4K), sound on/off, reference uploader, and an "Assist" button that suggests camera moves.

### Image-first workflow (the course's default)
1. Write a rough idea for a chat assistant (ChatGPT/Claude) and have it draft the start-frame image prompt.
2. Generate the still in an image model (Nano Banana Pro, GPT Image 2.0, or similar).
3. Bring the image back to the chat assistant and ask for the video prompt based on that image. For Seedance add: "give me this prompt in a 15-second time sequence layout".
4. Upload image as start frame, set aspect ratio, toggle sound, generate.
5. Review, tweak, regenerate. Use the best take.

### Extending a scene beyond one clip
- Export the **last frame** of a finished clip (in CapCut: load the video, use the menu at the top, "export still frame") and use it as the **start frame** of the next generation. Chain these to build "infinite length".
- Cost of this method: slight drift each hop. Re-check the face/product every second or third clip.

### Consistency techniques
- **Multi-angle reference sets:** generate front/side/three-quarter versions of a character or product with an image model, upload as one named element (Kling) or references (Seedance). Test with and without elements; the course shows the face visibly changes without them.
- **Same character image as start frame for every clip** in a set.
- **Voice blueprint:** define the voice once and paste it verbatim into every prompt (section 5).
- **Multi-shot from a single start frame** (Kling) for coherent coverage of one scene.
- **Reference packs ordered by beat** (Seedance): tell the assistant which uploaded image appears in which part of the timeline, and label them so there is no ambiguity. Example in the course: line cut scene first, product scene in the middle, person drinking at the end.
- **Edit instead of regenerate:** if a clip is almost right, use video-to-video editing to fix one thing rather than rolling the dice again (section 6).

### Motion Control (Kling) as a consistency tool
- Inputs: **one character image + one reference video**. The video supplies movement; the image supplies identity.
- Mistakes that break it:
  - Character image at a different angle or in a different setting than the reference video's first frame. Fix: screenshot or export the first frame of the reference video, give it to the image model with the avatar, and ask for the same pose/setting/lighting with the avatar swapped in.
  - Reference clip too complicated: person occluded, multiple people, props, moving or messy camera, unclear body.
  - Poor lighting causes glitches.
  - Forcing a full-body dance onto a tight face portrait.
- Check output for warped limbs, broken clothing, identity drift, and that hands and arms follow the reference.
- Course's monetization angle is copying viral social formats with an AI avatar and posting twice daily. Not relevant to a local service ad, but the underlying move (record a person doing the gesture on a phone, then transfer it) is useful for a consistent brand presenter or mascot without re-shooting.

### Editing existing video (Gemini Omni vs Seedance)
"AI video editing" here means changing things inside the footage, not trimming and cutting. Same source clip and prompt were run through both:
- Object removal (remove the piano): Gemini fully removed it; Seedance left traces.
- Clothing recolor (red coat to blue): both good; Gemini changed a background person's sex.
- Background replacement (home gym to luxury gym): both good; Gemini's lip-sync drifted slightly.
- Action edit (spill coffee and react): Gemini did it; Seedance refused with a safety message.
- Atmosphere (sunny to rainy): Gemini more cinematic but altered background activity; Seedance more faithful but smoother and over-saturated.
- Object insertion (shark behind divers): works in both; useful commercial VFX.
- Moving-object replacement (liquid to water): both handled physics well.
- Text replacement ("happy birthday" to "worst birthday ever"): both rendered it; inspect letters.
- Camera angle change (move to elevated left): both moved right instead of left, kept identity, one flubbed a prop. POV conversion also works.
- Iterative approach: change one thing, inspect, then the next. Do not stack unrelated edits.
- Sync-to-audio: upload clip and music together as references and describe what should react to the beat.

QA checklist from the lesson: Did the requested edit happen? Did the subject stay consistent? Is the motion believable? Did the face, hands, lips, clothes or background drift? Did the model regenerate too much of the clip? Is the cost sustainable across repeated edits? Always compare to the original, not just to the other model.

---

## 3. Video prompt anatomy and templates

### Core principles
1. **Tell the model what happens, not what it already sees.** With an image attached, do not describe the image.
2. **One main subject action + one main camera move + one clear scene.** More than that and you get glitching and morphing.
3. **Think in shots.** Each generated clip has one purpose. Edit them together.
4. **Decide the beginning and end of every movement yourself** or the model starts mid-move and stops awkwardly.
5. **Control time explicitly.** Models drift into slow motion on their own, especially on spectacular moves. Say "real time, normal speed, no slow motion" unless you want slow motion, and if you do, say what slows.
6. **Start camera-heavy prompts with the camera angle/shot type** (Kling instruction) so the model locks onto it. Make sure the image supports the move: no "over-the-shoulder" without a person, no "dive underwater" without water.
7. **Put dialogue in quotes and keep it short** to match clip length.
8. **Avoid important dialogue or complex action in the last seconds** on Kling.
9. Use a chat assistant to write detailed prompts. Show it the start frame and a rough story; ask for structured shot prompts with timing and camera direction.

### The 6-slot camera sentence (from the catalogue)
**Movement / Start / Speed / Framing / End / Time.** Name the move and what it rides on (rails, shoulder, crane, drone); how it begins (locked, or already moving on frame one); speed curve (ease in, build, decelerate, constant, violent, creeping); what stays stable; the final frame and hold; real-time or exact slow-motion scope.

### Kling multi-shot shot-block structure
```
Shot N (Ns): [shot type and angle] [subject + position] [action beats]
Details: [textures, light, tiny motions]
Camera: [lens, movement]
Mood: [one line]
```
Beats: Shot 1 setup and subject position; Shot 2 camera cut or movement; Shot 3 action/reaction; Shot 4 payoff or final moment. Keep each shot at least 3 seconds; total 15 s.

### Seedance timed-sequence structure
```
Style: [look keywords]
Environment: [place, light]
Characters / consistency: [same person as image: key identifying features]
Tone: [arc, e.g. grounded -> dramatic -> heroic]

0:00-0:03 (beat name)
Shot: [framing + camera move]
[what happens, 2-4 short sentences]
SFX: [sounds]

0:03-0:06 ...
```
Course beat shape for 15 s: 0-3 s setup, 3-7 s action, 7-12 s escalation, 12-15 s final hero moment. Slow motion on one beat adds contrast. Include an SFX line per beat since Seedance generates audio.

### UGC realism prompt style (Kling multi-shot example)
Long, physical, imperfection-heavy: describes micro-shake, autofocus breathing, exposure shifts, asymmetric smiles, visible pores, wrinkled clothes, readable label, "natural daylight only, no studio light, no cinematic grading". Ends each shot with a no-list: no beauty filter, no artificial smoothing, no cinematic effects, no perfect symmetry.

### Realism-lock add-on (appendable to any prompt)
"{what you want} - authentic everyday photorealism, candid and unposed, natural ambient light appropriate to the setting, realistic skin texture and material texture, muted true-to-life colours, low contrast, subtle softness, slight phone-camera or real-camera imperfection, believable exposure, lived-in details, natural body language, ordinary real-life styling, imperfect composition, no glamour retouching, no beauty filter, no cinematic colour grading, no hyper-polished AI look."

### Representative prompt templates (12)

1. **Start-frame action line (minimal).** "Steam gently rises from the coffee while the camera slowly pushes in. Real time, normal speed."
2. **Dialogue/vlog (basic lip-sync test).** "She is vlogging, she says: '[short line, two sentences max].'" (course used exactly this shape to compare models; no elaborate prompt needed).
3. **Kling multi-shot block.** "Shot 2 (3s): Medium close-up from the side as [action]. Details: [two sensory details]. Camera: slow push-in, 50mm. Mood: calm, professional."
4. **Seedance 15 s beats.** See structure above; name beats (Setup, Action, Escalation, Hero Moment) and include SFX per beat.
5. **Product ad from one hero frame (Seedance).** "Start frame: [clean product hero image]. 15-second ad: 0-3 s product reveal with slow push-in; 3-7 s ingredient/feature macro shots; 7-12 s [splash/use] with fast tracking; 12-15 s final hero shot, product centered, logo-safe space. SFX per beat."
6. **Reference-pack ad (Seedance Omni).** "Reference 1 [image: line/ingredient shot] appears 0-4 s. Reference 2 [product] appears 4-11 s. Reference 3 [person drinking/using] appears 11-15 s." Upload in that order.
7. **UGC to-camera (Seedance/Kling).** "Ultra-realistic smartphone selfie footage, handheld at eye level with micro-shake and autofocus breathing. She says '[line].' Natural daylight only, no beauty filter, no cinematic grading." Then append the realism-lock.
8. **Slow motivated push-in (F1).** "Begin on [frame A]. After [trigger], start a slow physical dolly in toward [subject]. Subtle ease-in, precise ease-out into [frame B]. Real-time action, no slow motion."
9. **Pull-out reveal (F2).** "Begin tight on [detail]. Perform a smooth dolly out or crane out to reveal [environment]. Preserve real perspective change, end on a stable readable wide frame."
10. **Crane from character to world (F5).** "Start close to [person] at [shot size], then a controlled crane up and out to reveal [environment]. Preserve the emotional connection at the start and land on a clear large-scale final frame."
11. **Foreground-occlusion transition (F12).** "Let a close foreground object fully cover the lens, then use that occlusion to transition into [new scene]; clear the frame to reveal the next shot." (useful for stitching clips invisibly)
12. **Static lock.** "Locked static shot, camera on tripod, no camera movement of any kind. Hold the exact same composition for the entire clip. Real time, normal speed."
13. **Audio-synced edit (Gemini Omni).** Upload clip + music as references: "Make the [lights/lanterns/etc.] turn on in sync with the beat of the soundtrack."
14. **Edit prompt (video-to-video).** "Change [one specific thing] to [new thing]. Keep everything else exactly the same: face, motion, camera angle, background." One change per pass.
15. **Motion-control replacement prompt.** "Replace the person with [avatar]. Keep lighting, position, framing and movement identical to the reference." Keep it practical, not cinematic.

### Reference list of the 30 "high-impact framework" moves (F1-F30)
Course supplies full templates for each; the ones most useful to commercial work are in section 4. Index: slow motivated push-in; pull-out scale reveal; layered parallax push-in; meaning-changing arc; crane from character to world; top-down graphic tracking; whip-pan reveal/match cut; dolly zoom; elastic wide-close-wide; camera leaves the hero; moving master through several beats; foreground occlusion transition; rig pass-off; reactive handheld snap zoom; macro-to-world transition; vehicle-to-character handoff; ground-level hard-mount; bullet time; environment-triggered camera reaction; low-to-high stabilized reveal; time-layer pass; creature/gravity roll; focus-led move; reaction-led push-in; environment-first slow advance; blocking-driven invisible reframe; probe fly-through; motion-control timeline change; static-to-handheld state change; anticipatory arrival.

Useful ones in plain words:
- **F23 Focus-led move:** shift focus first, then move the camera. "Begin focused on [foreground object]. Shift focus to [subject behind] first, then begin a slow push-in."
- **F24 Reaction-led push-in:** push into a person's face as they notice something off-screen; reveal the cause later. Good for a "huh, what's that?" beat.
- **F28 Motion-control timeline change:** repeat the identical camera path while time or condition changes. Ideal for before/after (see section 8).
- **F21 Time-layer pass:** camera passes behind a column/object and the same path continues in a changed state (era, season, condition).
- **F26 Blocking-driven invisible reframe:** wide to medium to close with no visible cut, driven by the person stepping forward.
- **F30 Anticipatory arrival:** camera reaches the destination before the person and waits there.

---

## 4. Camera movement guide (reference)

Why it matters: when you do not specify, models default to a slow sideways drift. Every shot should name a move, its start, its end, and the pace.

### Four final rules from the lesson
1. Every movement needs a clear beginning and ending.
2. One main movement per shot (push-in becoming orbit becoming crane usually collapses).
3. The bigger the face in frame, the simpler the move. Wide shots forgive anything; close-ups need gentle moves.
4. Control timing: say "real time, normal speed, no slow motion", or ask for slow motion and say exactly what slows.

### Group 1: camera stays put (rotation only)
| Move | What it conveys | Prompt wording that triggers it | AI note |
|---|---|---|---|
| **Static** | Lets the audience absorb the frame; clean cut point | "locked static shot, camera on a tripod, no camera movement of any kind... same composition for the entire clip" | Without "no camera movement, hold the same framing" the model adds a slow drift |
| **Pan** | Follow action or move attention between subjects in one space | "pan right from a fixed camera position... keep the horizon level... settle on the final composition and hold" | Give the pan a destination or it becomes drift |
| **Tilt** | Introduce a subject piece by piece (feet to face); land on a floor detail | "tilt up from a fixed camera position... hold on her shoes, then tilt... land on her eyes" | Name both ends; keep to one axis, mixed pan-tilt warps faces |
| **Whip pan** | Punctuation; hidden transition between clips | "fast whip pan to the right... violent near-instant rotation with heavy motion blur... land sharp on the new subject" | Always whip toward a target |

### Group 2: closer and further
| Move | Conveys | Wording | AI note |
|---|---|---|---|
| **Dolly in** | Realization, importance; context falls away | "dolly in toward her face, camera on rails... ease into the move... settle into a close-up and hold" | "slow push-in" alone leaves start/end to the model; fill both |
| **Dolly out / reveal** | Isolation, endings, revealing hidden context | "dolly out from her face, camera on rails, straight backward... settle on a wide shot" | Describe what the wide opens onto; the reveal is the shot |
| **Zoom in/out** | Frame tightens without moving through space (flat, no parallax) | "zoom in... camera fixed in place, optical zoom only" | Say camera stays fixed or the model blends zoom and dolly |
| **Slow zoom** | Quietly rising tension | "slow zoom in on his face... almost imperceptible... never accelerating" | Safest for faces |
| **Fast zoom** | Sudden discovery | "fast zoom in onto the object in her hands... fires on the trigger" | Fast moves push everything into slow motion; use the time slot |
| **Crash zoom in** | Shock, punchline, hard emphasis | "crash zoom in onto his face... snaps with no ramp... land sharp on his eyes" | Land on eyes/hands/object or it reads as glitch |
| **Crash zoom out** | Comedy and shock reveal of context | "crash zoom out from her calm face... from close-up to a wide shot in one hit" | Describe what the wide reveals |

Dolly vs zoom: dolly physically travels (near objects sweep past, perspective changes); zoom magnifies from a fixed spot (flat). Choose dolly to move the viewer through the environment.

### Group 3: traveling past
| Move | Conveys | Wording | AI note |
|---|---|---|---|
| **Truck** | Environment unfolds like a panorama | "truck right along the scene on a straight path, lens facing forward" | Describe the space or it invents geometry mid-slide |
| **Slider** | Small slide that adds parallax depth; tabletop/product/interior | "slow slider move to the left, short controlled slide past the objects in the foreground" | Needs real foreground objects |
| **Pedestal** | Elevator-style vertical rise/drop, level | "pedestal up from the desk to his face, straight vertical rise, no tilt" | Say "no tilt" |
| **Push past** | Slipping into a space through a foreground object | "camera pushes forward past the doorframe into the room... passes close to the lens" | Foreground must clear the frame fully |

### Group 4: around
| Move | Conveys | Wording | AI note |
|---|---|---|---|
| **Arc** | See it from another side; background reveals new info | "arc right around her, a quarter turn on a curved path... keep distance and height constant" | 90-180 degrees hold identity best |
| **Orbit** | Grandeur, introduction, showing an object from all sides | "orbit clockwise around her at a consistent radius, stabilized rig... end on the figure standing behind her" | Full orbits melt faces; wider shot is safer; something must change during the circle |
| **Spiral** | Inward = obsession/pull; outward/upward = release | "spiral around her circling clockwise while slowly closing in... end on a close-up" | Maximum one revolution |

### Group 5: tracking (camera borrows the character's pace)
| Move | Conveys | Wording |
|---|---|---|
| **Follow from behind** | Discovering a place with them; what lies ahead | "follow her from behind at shoulder height... match her walking pace... when she stops, the camera stops" |
| **Reverse tracking (in front)** | Face, determination | "reverse tracking in front of him, the camera moving backward... distance constant" (most stable for faces) |
| **Side tracking** | The journey, the stride | "side tracking shot, camera moving parallel to her... side profile at constant distance" (describe background layers) |
| **Low tracking** | Mystery, details before the face | "low tracking shot at knee height, following her heels... face never shown" |
| **Vehicle tracking** | Speed | "vehicle tracking shot, camera traveling alongside the car... from a chase car alongside" (anchor the camera) |
| **Chase shot** | Panic, pursuit | "handheld chase shot, the operator running behind... framing slips and corrects" (corrections need causes) |

### Group 6: the human camera (makes AI footage look filmed)
| Move | Conveys | Wording |
|---|---|---|
| **Handheld** | Witnessed rather than staged | "handheld shot at chest height, a human operator holding the camera... sway is present from frame one" (describe the person carrying it, not "shakiness") |
| **Reactive snap zoom (documentary)** | Chain: event, late turn, fast zoom, overshoot, correction, settle | "documentary handheld shot with a reactive snap zoom... reacts a beat late... heavy motion blur... focus arriving a moment late" |
| **Snorricam** | Panic, drunkenness, euphoria | "snorricam shot, camera rigidly mounted on her body, facing her... face locked centered" ("rigidly" matters) |

The instructor calls the documentary snap zoom the single strongest trick for grounding unreal footage, since AI defaults to slow, sterile smoothness that reads as a render.

### Group 7: the air
| Move | Conveys | Wording |
|---|---|---|
| **Crane up** | Place swallows the person; endings | "crane up from her, rising and pulling away on a long arm... keep her in frame as the camera climbs" |
| **Crane down** | Picking one story out of a world; openings | "crane down from above the rooftops toward one window..." |
| **Drone** | Geography and scale | "aerial drone shot flying forward over [terrain]... constant altitude, horizon level" (give it a road/river line to follow) |
| **Fly-through** | Outside to inside, no cut | "camera flies through the open window into [room]... window frame passes fully around the lens" (boundary must be fully crossed) |
| **FPV dive** | Adrenaline | "FPV drone shot diving over the edge of the rooftop... horizon tilting" (tilting horizon is the signature) |

### Group 8: the impossible
| Move | Conveys | Wording |
|---|---|---|
| **Dolly zoom** | Reality shifts; subject constant, background warps | "camera dollies in while the lens zooms out... keep her exact size constant" (needs background depth) |
| **Macro exit** | Scale shock; start inside the thing you sell | "camera starts inside [mechanism] at macro scale and travels outward... one unbroken move" |
| **Probe lens** | Impossible access | "probe lens shot, camera flies through the keyhole into the room" (one readable route) |
| **Bullet time** | One decisive instant | "bullet time, the camera orbits through the frozen scene... every droplet holding its place" (freeze must be total) |
| **Gravity roll** | World stops being reliable | "camera travels forward along the floor, rolls up onto the wall then the ceiling" (needs clear geometry) |
| **Infinite zoom** | Dream transition | "infinite zoom, the camera dives continuously into her eye..." (two worlds per clip max) |

### Kling toolkit: 30 core techniques (shorter, older style)
Rule: start the prompt with the camera angle. Handheld; slow dolly in; slow dolly out; crane up; crane down; over-the-shoulder; 360 orbit; smooth tracking behind; slow pan right; first-person POV; top-down bird's-eye; low angle (powerful/iconic); high angle (small/vulnerable); push-in on face; pull-out environmental reveal; wide static with foreground movement; over-the-head tracking; reveal from behind an object; first-person falls to ground; upward tilt while approaching; move through a window/portal; follow around a corner; medium tracking alongside; slow descend from above behind subject; time-lapse pull-out; push through fog/mist; spiral around object on ground; reverse tracking; tracking with foreground obstructions; rising reveal from behind shoulder.

Niche: dive underwater; follow into water; pass through fire/smoke; pass through mirror/portal; surface from underwater; fall from sky.

Combos: push-in plus tilt up (grandeur); crane down plus orbit (mythic entrance); first-person plus handheld plus sudden fall (chaos); track behind then push-in reveal.

Example wordings: "cinematic slow dolly in toward [subject], camera begins far and pushes in toward his face, moody lighting"; "top-down view of..."; "camera slowly pushes through thick mist to reveal..."; "starts on close-up of [detail], slowly pulls out to reveal..."

### Glossary terms the course expects you to use
Framing; montage; blocking; jump cut; match cut; rack focus; chiaroscuro; Dutch angle; practical lighting; extreme close-up; over-the-shoulder; tilt; pan; zoom; cutaway; whip pan; low/high angle; wide shot; insert shot; reverse shot; handheld; eye-level; establishing shot; close-up; crane shot; medium shot; depth of field; color grading; J cut and L cut (audio leads or trails the picture); Foley; diegetic vs non-diegetic sound; ambient sound; overcranking (slow motion) and undercranking (fast); POV shot; storyboard; cross-cutting.

---

## 5. Audio, lip-sync, voice, sound design

### Lip-sync findings
- Test method: same character, same framing, same script across models; simple prompt ("She is vlogging, she says: ...") is enough. Do not over-engineer.
- Time limits: Kling loses timing after about 10 s; Veo caps at 8 s so shorten the script; Seedance and Omni hold up best.
- Seedance 2.5 > Gemini Omni > Veo 3.1 (Quality marginally above Fast) > Kling/Grok.
- Cheap-first strategy: draft hooks in Omni, rebuild the winner in Seedance.

### Giving the character your exact voice and words
- **Seedance accepts an uploaded audio clip as a reference** and makes the character speak it. Workflow: write dialogue, generate in ElevenLabs, download, add as audio reference. Especially good for non-English.
- **ElevenLabs Voice Changer** (speech-to-speech): upload the finished video, pick a voice, generate; keeps one voice consistent across all clips. Use it when you cannot get consistent voices otherwise, or to anonymize a real voice.
- Voice cloning exists but is deferred to a later phase.

### Consistent character voices (Veo, applies to other models)
- Treat the voice as a locked asset. Do not re-describe it differently between prompts; even a word swap changes tone or pitch.
- Define a voice blueprint once, for example: "light Australian accent, relaxed and confident, medium pace, bit of vocal rasp", then paste it at the end of every prompt for that character.
- Choosing an accent narrows the voice pool (Veo has only 2-3 voices per accent per gender), which makes consistency easier. The accent must match the character.
- Keep dialogue short. An 8-second clip with a long script produces rushed speech.
- Use ellipses and punctuation heavily to create natural pauses. No punctuation sounds like reading a script.
- Voice style presets (swap in [accent]): conversational, confident, energetic, casual (with filler sounds), storytelling, calm/thoughtful, persuasive, professional, dramatic, curious, friendly/warm, sarcastic/playful, authority/leader, reflective/emotional, conversational story mode, fast social-media style. Examples of the pattern: "Friendly/warm: light [accent], gentle rhythm, soft welcoming tone. Speech flows smoothly with small pauses that feel natural and reassuring." "Professional: subtle [accent], clean controlled delivery, medium pace. Clear pronunciation with slight pauses between sentences."
- Why default AI voices sound bad: every word gets equal weight, no breath or melody; accent and pacing micro-detail fixes it.
- Sound-effect cues inside the video prompt work in Kling ("explosions in the background") and Seedance (SFX line per beat).

### ElevenLabs voiceover and sound effects
- Voices tab: pick a voice (Rachel = neutral American; Adam = deeper professional). Up to about 5,000 characters per generation. Adjust variability and speed. Punctuation guides pacing; write the way people speak; break long thoughts into short lines. Listen before downloading.
- Sound effects tab: set length to 4-5 seconds, type the exact sound ("ocean waves", "footsteps", "door creak", "rain", "crowd noise", "engine rumble"), generate four samples, pick one.
- Included in a Promptwise subscription (audio tab) so no separate ElevenLabs plan is needed. **Pixabay** offers free copyright-free music and effects.
- Place sound design **last** in the edit so every sound lands on a finished picture.
- Keep effects natural; too loud or too obvious makes it feel cheap.
- Layer sounds with volume hierarchy: the sound closest to the camera loud, ambience underneath, quieter.
- Voice gives information, music gives emotion, effects make the scene physical.

---

## 6. Editing/assembly and upscaling

### Assembly workflow
1. Generate shot by shot (3-15 s each).
2. Download everything, drag into CapCut (capcut.com, desktop). Set the project aspect ratio **first**: 9:16 for TikTok/Reels/Shorts, 16:9 for YouTube.
3. Trim clips by dragging edges; split at the playhead; layer clips (higher track wins on screen); use masks (rectangle) for split-screen.
4. Speed menu for pace; ignore curves/velocity (over-complicated). Freeze frames for cinematic holds.
5. Transitions: **Black Fade** and **Mix** are the two the instructor recommends; drag between clips and lengthen or shorten. A shake effect between clips can serve as a hit transition.
6. Text: add via text tab; use styled presets (stand out on TikTok); outline/background/glow/shadow for legibility; animate in/out; opacity for watermarks.
7. Captions: Text > Advanced > auto-generate, correct misheard words, apply style to all captions, and use word-by-word animated styles for short-form retention.
8. Stickers and effects sparingly (an arrow or sticker to point at something).
9. Add sound design last (section 5). Vocals and separate removes background noise from a speech clip. Noise reduction is available.
10. Export: **1080p at 30 fps maximum for TikTok** (4K/60 gets downgraded to 720p there). YouTube accepts 4K 60 fps. Audio-only export possible by unticking video.
11. Platform-evasion tips in the lesson (changing audio pitch to dodge reuse detection) apply to other people's content. Not relevant to original ad work; ignore.

CapCut notes: the built-in CapCut lip-sync is "really bad"; do lip-sync in the video model. Low-quality preview mode only speeds editing and does not affect export.

### Continuity techniques between clips
- Last-frame to next start-frame chaining (section 2).
- Foreground-occlusion or whip-pan transitions, with matched blur direction and density, hide the cut between clips.
- Match-cut on a similar shape/motion.
- Start-frame reuse of the same character image for every shot.

### The "realism pass" (remove the AI look), in the editor
Raw AI output is too contrasty, too saturated, too stable and too clean, which reads as a render. For UGC, iPhone-style and native social ads, soften it:
1. Add an adjustment layer/filter.
2. **Lower contrast** first (heavily, until it stops looking like a render but is not washed out).
3. **Lower saturation slightly** (take the edge off, do not grey it).
4. **Lift highlights slightly** (soft, less dense, less fake-cinematic).
5. **Add a subtle shake effect**, dialed way down so the viewer feels handheld but cannot spot the effect.
6. Compare before and after. Without these the clip snaps back to over-saturated AI look.
This is the post-production partner to the realism-lock prompt in section 3.

### Upscaling
- The course does not teach a separate upscaler. Resolution is chosen at generation (720p/1080p/4K), and Kling 3.0/4.0 and Seedance now offer 2K-4K or 1080p/4K natively. Plan for 1080p delivery and generate at the highest native setting for hero shots. Test-render at lower quality to save credits.

---

## 7. Common failure modes and fixes

| Symptom | Cause | Fix |
|---|---|---|
| Video looks great but is not what you pictured | Pure text-to-video freedom | Use image-to-video with a strong start frame |
| Bad video from a bad image | The image controls the whole clip | Fix the image first (multiple tries in the image model) |
| Model re-invents what is already in the image | Prompt re-describes the image | Describe only motion and change |
| Glitching and morphing | Too many simultaneous actions (run, jump, turn, talk, camera flies) | One subject movement + one camera movement + one scene |
| Slow lazy sideways drift | No camera instruction | Name the move, start, end, pace; or "locked static, no camera movement" |
| Fake slow motion on spectacular/fast moves | Model default | "Real time, normal speed, no slow motion"; or specify exactly what slows |
| Start/end frames morph strangely | Frames too different | Make end frame a natural continuation of the start |
| Face changes when character turns | No identity anchor | Multi-angle references, Kling elements/Omni Reference, same start frame |
| Lip-sync drifts late in the clip | Kling over about 10 s; Veo 8 s cap | Keep dialogue short and early; no key lines at the end; shorter scripts; use Seedance/Omni; or generate shorter clips |
| Voice changes between clips | Re-described voice, random voice pick | Voice blueprint pasted verbatim; fix an accent; ElevenLabs voice changer on the finished clip |
| Rushed, robotic speech | Too many words, no punctuation | Fewer words, ellipses and commas, style preset line |
| Too polished / obviously AI | Contrast, saturation, stability | Realism-lock prompt + contrast/saturation/highlights/shake pass |
| Hands, label text, bottle details wrong | Complex hands/props, weak reference | Product reference images; readable label described in prompt; check text letters; regenerate or edit |
| Orbit melts the face | Full 360 near a close-up | Quarter/half arc, wider shot, or reverse tracking |
| Pan/whip goes nowhere | No target | Name the destination |
| Zoom and dolly blend into a mongrel | Ambiguous wording | "camera fixed, optical zoom only" or "physical dolly on rails" |
| Fly-through or push-past looks half-done | Boundary/foreground not fully crossed | State the opening/foreground fully passes the lens |
| Camera move doesn't make sense | Image lacks what the move needs | Compose the image for the move before generating |
| Dolly zoom does nothing | Flat background | Pick a scene with depth layers |
| Edit looks good but changed other things | Over-regeneration (background people, face, lip-sync, camera) | Compare against the original; one change per pass; use the model that preserves better |
| Safety refusal | Content policy (Seedance blocked a mild spill-and-react edit) | Soften the action or try another model; keep Got Moles prompts positive and non-violent |
| Chaotic shake in chase/handheld | Constant shaking | Give corrections a cause (turn, obstacle); describe the person carrying the camera |
| Motion Control fails | Messy reference, mismatched avatar/angle, bad light | Clean single-person clip, avatar image matched to the video's first frame, good lighting |
| Quality drops on upload | Exported 4K/60 for TikTok | Export 1080p/30 |
| Extended chain drifts | Repeated last-frame handoffs | Re-anchor to the master character image periodically |

---

## 8. Got Moles applicability

### Fit assessment
The course is built around cinematic, UGC and product ads. Got Moles' needs are quieter: trust, cleanliness, a calm professional arriving, a yard that looks good. Mostly slow, simple shots with one clear move. The hard constraint: **no moles being killed or trapped, no dead animals, no trap mechanisms**. Everything below shows the outcome (a healthy lawn), the person (homeowner and technician), and the promise (chemical-free, safe for pets and children). Also: US English, no I-713 claims, no "WA's #1", nothing about "hauled away" disposal.

### Recommended model per shot type
| Shot | Model | Why |
|---|---|---|
| Pristine lawn reveal, drone/crane | **Kling 4.0** (or 3.0) | Slow cinematic environments are its strength; 4K; accurate camera moves |
| Before/after lawn (damaged turf to repaired) | **Kling or Seedance** with start + end frames, or motion-control timeline-change framework | End frame gives control; the same camera path repeated |
| Homeowner reaction / testimonial-style talking | **Seedance 2.5** (hero), **Gemini Omni** (cheap drafts) | Lip-sync and natural voice; best expression |
| Technician arriving, walking to the door, friendly handshake | **Seedance** for people and acting; Kling for the truck/road establishing shot | Best at acting; Kling for B-roll |
| Technician walking the yard with a clipboard/inspecting turf | Kling multi-shot from one start frame | Multi-angle coverage with consistency |
| Pet/kids playing on lawn (safety message) | Seedance, with text-only safe actions | Motion and emotion; must avoid any animal-harm reading |
| Voiceover with B-roll | Kling/Seedance for visuals; ElevenLabs for voice | Cheaper and more consistent than model-generated speech |
| A/B hooks quickly | Gemini Omni, then upgrade winners to Seedance | Cost control |

### Practical workflow for a 15-second ad
1. Pick the one message (for example, "Chemical-free, safe mole control for your yard").
2. Generate hero start frames in an image model: the lawn, the technician (consistent face; generate multi-angle set), the homeowner. Put the Got Moles uniform/truck decal as a reference image so branding is accurate. Do not let the model invent a logo; add the logo and text in the editor.
3. For each shot write: movement line (6-slot), one subject action, "real time", realism-lock.
4. Generate 3 takes each, pick best, chain with matched cuts or occlusion transitions.
5. Voiceover in ElevenLabs (calm, friendly American voice), SFX of birds, lawn mower far away, a truck door, light wind; sound last.
6. Realism pass in CapCut for phone-style variants; leave cinematic footage cleaner.
7. Export 1080p/30 for social, vertical 9:16 for Reels/TikTok/Shorts, plus a 16:9 for web.
8. QA checklist: face and uniform consistent? Labels and text accurate? No animal depicted, no trap, no dead animal, no digging tool used aggressively? No claim text generated by the model (add compliant text in the editor)?

### Cautions specific to this account
- **Skin-mole homograph:** never prompt just "mole" near a person's face; describe "lawn damage", "raised ridges and soil mounds in the turf", "yard".
- **No animal on screen** is the safest policy (the brief forbids killing or trapping depictions; a live mole shown cartoonishly is also a risk for implied threat). Show the lawn evidence (mounds) in the "before" and a clean lawn in the "after".
- **Do not depict the method.** Technician work is shown as walking the property, kneeling to inspect soil, talking with the homeowner, checking the lawn. No tools that read as traps.
- **Claims:** captions and voiceover reference only approved facts (three locations, review counts per `CLAUDE.local.md`, not "WA's #1", chemical-free/safe for pets and children).
- **Look:** a Pacific Northwest yard (Douglas fir, cedar fence, overcast soft light, green lawn). Keep US spelling in all on-screen text.
- Real photos of real clients are not to be used as start frames without permission.

### Five example prompts (image-to-video; start frame described but not re-described)

**1. Pristine lawn reveal (Kling 4.0, 8-10 s, 16:9 or 9:16)**
Start frame: close-up of fresh green grass blades with dew and a hint of soft Pacific Northwest morning light.
> Begin tight on the grass blades. Perform a smooth crane up and pull out to reveal a large, perfectly even, healthy lawn behind a craftsman home with a cedar fence and Douglas firs. Preserve real perspective change and layered depth, and end in a stable readable wide frame, golden morning light, a few birds in the distance. Real time, normal speed, no slow motion. Ambient audio: birdsong, light breeze.

**2. Technician arrives (Seedance 2.5, 8 s, uses the technician image as start frame)**
Start frame: Got Moles technician in a clean branded shirt and cap beside a plain white work truck on a residential street, overcast daylight.
> Medium shot, side tracking at a steady pace. The technician closes the truck door, picks up a small canvas bag, and walks up a driveway toward a front porch. Natural walking, slight friendly nod toward the camera. Handheld sway from frame one, subtle. Real time. SFX: truck door closing, footsteps on concrete, neighborhood ambience. Ends with him stopping at the walkway and holding.

**3. Homeowner reaction (Seedance 2.5 with audio reference, 10 s, 9:16)**
Start frame: smiling woman in her thirties standing on her lawn in daylight, phone-camera selfie framing.
> Ultra-realistic smartphone selfie footage, handheld at eye level, micro-shake and autofocus breathing. She turns slightly to show the lawn behind her and says: "It's been a month, and the yard looks like our yard again. And the dog can run on it without me worrying." Warm, relaxed, natural voice, medium pace. Natural daylight only, no beauty filter, no cinematic grading. (Upload the ElevenLabs line as an audio reference so the lines match the compliant script.) Append the realism-lock.

**4. Technician and homeowner conversation (Kling 3.0 multi-shot custom, 3 shots of 4-5 s)**
Start frame: technician and homeowner standing on a porch, medium two-shot.
> Shot 1 (4s): Medium two-shot, static, the technician explains and gestures lightly toward the yard; the homeowner nods. Details: soft overcast light, calm. Camera: locked, 35mm. Mood: reassuring.
> Shot 2 (4s): Close-up on the homeowner, slow push-in as she smiles and relaxes. Camera: 50mm, slow dolly in, ease out, hold. Mood: relief.
> Shot 3 (4s): Over-the-shoulder looking at the neat lawn beyond the railing, a child's bike and a golden retriever resting on the grass. Camera: static, shallow depth of field. Mood: peace.
(Do not put dialogue in the final seconds; add voiceover in post.)

**5. Before/after lawn (Seedance or Kling, start + end frames, 6-8 s; framework F28/F21 motion-control timeline change)**
Start frame: lawn with raised soil ridges and patchy turf. End frame: the identical camera position, lawn smooth, thick and green.
> Keep the camera locked in the same position and height. The lawn transforms gradually: ridges flatten, grass thickens and greens, light shifts from flat grey to warm sunlight. No people or animals in frame. The camera performs a very slow push-in only to the final frame. Real time, normal speed, no slow motion. SFX: soft wind, birds slowly increasing.
(Use an end frame generated from the start frame in the image model so the composition matches; do not show any animal, tool or trap.)

### Quick shot-list library for the skill
- Establishing: drone shot along the street to the house (Kling).
- Dolly in on front door and technician knocking (Seedance).
- Technician kneeling to touch the soil, looking at the lawn (static or slow zoom).
- Slider move across garden bed to a neat lawn (product-style depth).
- Low tracking shot on boots across grass (face never shown).
- Pull-out reveal from a hand touching lush grass to the full yard.
- Pet/children on lawn, slow rack focus from foreground flowers to them playing.
- Homeowner phone-style testimonial with realism pass.
- Logo/outro: static lock on a clean end card (added in editor, not generated).
