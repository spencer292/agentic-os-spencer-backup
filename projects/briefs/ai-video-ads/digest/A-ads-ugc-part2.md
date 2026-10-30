# AI Video Bootcamp, Phase 5 (Part 2): Cinematic Ads, Static Ads, and the Strategy Core

Source: Skool "AI Video Bootcamp", course "AI Advertising & UGC", lessons 09 to 16. Digest written for building a Got Moles AI-video-ads skill. Course text paraphrased; short formula templates kept verbatim where structure matters.

## Source reality check (read first)

- Lessons 09 to 14 (Nike advert, car advert, GTA-style ads, Nano Banana Pro static ads, Nike example, BMW example) are **video-only lessons with almost no text**. The corpus holds only a one-paragraph description for each (and two bare Vimeo links for the example ads). There is no transcript, prompt text, or shot list in these files. Sections 1 and 2 therefore contain only what the descriptions say, plus clearly labelled "standard practice" scaffolding that is NOT from the course.
- Lesson 15 is a progress checklist and homework (post a short video or static ad, titled "Phase 5 Homework").
- Lesson 16 (Resources) holds the real value: five documents, about 21,000 words. Sections 3 to 7 below distil them.
- If the skill needs the actual cinematic workflow, the Nike/car/GTA video transcripts would have to be fetched separately (they are Skool-hosted videos).

---

## 1. Product/brand cinematic ad workflow (Nike, car, GTA-style lessons)

### What the course text actually says

- The three lessons ("Making A Nike Advert" 7 min, "Making A Car Advert" 11 min, "GTA Style Video Ads" 9 min) are labelled "older videos but still valuable." Technique is unchanged; only the tool names are outdated.
- **Tool substitutions the instructor gives:**
  - Midjourney (used in the original videos for key stills) is replaced by **Nano Banana Pro** or **ChatGPT Image 2.0**, "way better consistency."
  - Video generation: **Kling 3.0** or **Seedance 2.0** (Nike, car); **Kling 3.0** or **Veo 3.1** (GTA-style).
  - Everything can be run in one place on **promptwise.com**, positioned as a cheaper alternative to Higgsfield.
- Two example finished spots are provided as showcases: a Nike ad and a BMW ad (1 min).

### The implied pipeline (inferred from the tool swap; standard AI-ad practice, not course-verified)

1. **Concept and one-line promise.** One desire, one message (see Principle 1 below).
2. **Key stills first.** Generate hero frames of the product/subject in the target style with Nano Banana Pro or ChatGPT Image 2.0. Image models are used first because they hold character/product consistency better than text-to-video.
3. **Animate stills to video.** Feed each still into Kling 3.0 / Seedance 2.0 / Veo 3.1 as a start frame with a short motion prompt (camera move plus subject action).
4. **Shot list of about 6 to 10 shots** of 3 to 5 seconds each; hard cuts between them.
5. **Edit and finish.** Cut, add music/sound design, text overlays, CTA end card.

### Prompt structure to carry into the skill (general practice)

- Image prompt: subject + environment + lighting + lens/camera + style + "photorealistic, product-accurate."
- Video prompt: start from the still; describe one camera move (push in, orbit, tracking) and one subject action; keep it to one idea per clip.
- The "GTA style" variant means an illustrated, stylised look (game loading-screen poster aesthetic) applied to a normal ad structure. The style is a novelty/camouflage device, not a different strategy.

### Relevance to Got Moles

Cinematic brand spots (Nike/BMW) are awareness-level, high-polish formats. The course's own strategy material (sections 4 and 5) says polish converts worse than native-looking content in 2026. Treat cinematic as a brand-film option, not the core ad engine.

---

## 2. Static ads with Nano Banana Pro

### What the course text says

- Lesson 12 description in full: you can create "ultra realistic avatars and product images with Nano Banana Pro or ChatGPT Image 2.0." No prompts or workflow text provided (video lesson).

### Static ad formats the course does specify (Bonus section of the scripting playbook)

| Format | Layout and content | Best when |
|---|---|---|
| **Offer Card** | One bold benefit-driven headline, the offer (price/discount/bonus), product visual, high-contrast CTA, urgency/deadline | A genuinely compelling offer exists |
| **Golden Review** | One strong customer review as the entire ad: large readable text, star rating, customer name/photo, small product image, CTA "See more reviews" | A standout review that reads like a mini-story |
| **Editorial Callout** | Looks like a magazine feature: "As seen in" banner, pull quote, editorial-style product photo, subtle logo | Real press, awards, expert endorsements exist |
| **Notes Screenshot** | Realistic phone Notes-app screenshot with a raw personal message; no brand imagery; CTA embedded naturally. Static twin of the Grit Ad | Maximum "anti-ad" authenticity |
| **Side-by-Side** | Two panels: "Without [X]" vs "With [X]" (or competitor, or before/after), clear labels, CTA below | Clear visual advantage over alternatives |

### Static guidance from the psychology playbook

- **Camouflage:** on Meta feed the winning static is a "photo with text underneath, like a friend's post" or a carousel, not a designed banner. A simple native-looking image plus caption lets you test dozens of angles with no production.
- Testing velocity is the point: write the ad, pair with an image, publish, learn which belief/pain/redefinition works.

### Suggested prompt pattern for the skill (general practice, not course text)

`[Format] static ad. Scene: [real, specific setting]. Subject: [what is in frame]. Look: phone-photo realism, natural light, slight imperfection. Text overlay: "[headline]" in [simple font], placed [position]. No logos unless supplied. Aspect 4:5 or 9:16.` Inspect output for garbled text; image models still mangle small text, so add copy in an editor if needed.

---

## 3. Scripting frameworks (16 frameworks plus combos)

All 16 come with a psychology rationale, an acronym flow, a fill-in template, a full example script (30 to 60 seconds, time-coded), and a 10-hook bank (folded into section 6). Convention: HOOK (0 to 5s), BODY, CTA, one message per ad.

### Group A: Proof and momentum

**1. SPARK (Social Proof Momentum)**, S.P.A.R.K.
Signal the Shift (point at a trend among a relevant group) > Puncture the Old Way (why the common solution fails) > Announce the Alternative (reveal, do not sell) > Reinforce with Receipts (stats, reviews, press) > Kick Open the Door (CTA as invitation to join).
Use when: a real migration or shift exists and you hold real numbers. Tribal psychology.

**13. WITNESS (Testimonial Cascade)**, V.O.I.C.E.
Verify the Pain (customer describes problem, raw) > Open the Discovery (how they found it) > Illustrate the Change (timeline with specifics) > Cascade the Social Proof (4 to 6 quick cuts of different people) > Endorse and Encourage (original customer returns with risk-reversal CTA).
Use when: you have real customer voices. **Risk flag: the course example uses invented personas and quotes. We can only do this with real, consenting customers.**

**15. TIME MACHINE (Before/After)**, S.H.I.F.T.
Show the Starting Point > Highlight the Breaking Point > Introduce the Change (one change) > Flash Forward (same specificity as the before, with metrics) > Transfer the Possibility ("if I can, you can," low-risk CTA).
Use when: the transformation is visually obvious.

### Group B: Challenge and contrarian

**2. MYTH KILLER (Contrarian Authority)**, E.X.P.O.S.E.
Expose the Lie > X-ray the Problem (specifics build trust) > Present the Pivot > Offer the Evidence > Show the Difference (categorically, not incrementally) > Enlist the Viewer (CTA that makes them feel smart).
Use when: the category is full of misconceptions you can document. Creates cognitive dissonance, which holds attention.

**9. CONVICTION (Founder Objection Crusher)**, S.T.E.E.L.
State the Harsh Truth > Tell Your Identity (why you have credibility) > Echo the Exact Doubt (say the objection aloud, in their words) > Eliminate with Evidence > Launch the Bigger Play (movement, not moment).
Use when: retargeting warm people stuck on a known objection; founder on camera.

**10. FACE-OFF (Versus/Challenge)**, R.I.N.G.
Raise the Stakes (fun visual challenge) > Initiate the Showdown (split screen, timer) > Name the Winner (then explain why) > Go Get Yours.
Use when: product has a demonstrable, visual advantage. **Risk flag: comparisons must be fair, real and verifiable; no rigged tests.**

### Group C: Pain, desire, and gap

**7. PRESSURE COOKER (Problem, Tension, Relief)**, W.O.U.N.D.
Where It Hurts (emotional wound, not feature gap) > Open the Wound (ripple effects) > Understand Their Failures (what they already tried, builds empathy) > Name the New Way (mechanism) > Deliver Proof + CTA (risk reversal).
Use when: a strong, specific emotional pain exists. Classic problem-agitate-solve.

**11. BRIDGE (Goal, Gap, Gain)**, B.R.I.D.G.E.
Broadcast the Goal (timely) > Reveal the Real Block (not laziness, an identifiable gap) > Introduce the Bridge > Detail the Proof > Glimpse the Transformation > Encourage Action (tie back to the hook's goal).
Use when: audience wants a specific outcome and feels stuck; makes them feel understood.

**5. SHORTCUT (How to X without Y)**, E.S.C.A.P.E.
Establish the Escape (result without 2 or 3 pains) > Specify the Suffering > Cut to the Core (one product) > Articulate Why It Works (cause/effect) > Paint the New Life > Exit with the Escape ("if you're a [type] who [pain]...").
Use when: the selling point is simplicity or avoiding something hated.

### Group D: Curiosity and education

**12. CLIFFHANGER (Curiosity Loop)**, L.O.O.P.
Launch the Impossible Claim > Orchestrate the Story (beats that add context without resolving) > Offer the Value (benefits emerge inside the story) > Pay Off the Promise.
Use when: you need retention. **Risk flag: the claim must be literally true by the end. The course example is a fabricated income story; never fabricate.**

**3. COUNTDOWN (Listicle)**, S.T.A.C.K.
Set the Number (odd numbers, with emotional qualifier) > Tear Down the Familiar (each item is an "oh no, that's me") > Arrive at the Answer > Certify with Credibility > Kick to Action referencing the list.
Use when: you have 3 to 5 genuine mistakes/reasons. Gives multiple chances to hook.

**16. EDUCATOR (Value-First Teaching)**, T.E.A.C.H.
Teach Something Real (useful even without buying) > Expand with Depth > Align with Your Product > Credentialize > Hand Off the Action (next step in their education).
Use when: building trust with cold audiences. The course calls it the highest-trust format.

**14. DEMO DROP (Product in Action)**, P.R.O.O.F.
Problem in Progress (show, do not tell) > Reveal the Product (clean, no intro) > Operate in Real Time (minimal voiceover, ideally one unbroken shot) > Observe the Result (hold on the payoff, show the before beside it) > Frame the Features.
Use when: the product has a visible, satisfying result.

### Group E: Native and authentic

**6. RAW TAKE (Organic/Native)**, B.L.E.N.D.
Begin Like Content (no brand, no product in first 3s) > Lead with a Relatable Moment > Ease in the Product (feels incidental: "someone told me about...") > Narrate the Experience (honest timeline including initial skepticism) > Deliver a Soft Close (no urgency, no scarcity).
Use when: ad blindness is the problem. Selfie style, imperfect framing.

**4. ORIGIN STORY (Founder-Led Narrative)**, B.U.I.L.T.
Begin with the Human > Uncover the Enemy (a systemic problem the founder lived) > Ignition Moment > Lay Out the Wins (3 to 4 metrics) > Tomorrow's Vision.
Use when: a real founder story exists. Narrative transportation plus identification.

**8. GRIT AD (Lo-Fi/Anti-Production)**: three rules, not a step flow. A filter laid over any other framework.
1. How can I make this SIMPLER? (cut 70% of words; a 10-year-old should get it; e.g., "ANGER JOURNAL + CBT PROMPTS = CALM")
2. How can I show this CHEAPLY? (phone, harsh light, notes-app text, MS-Paint arrows; tired parent in a messy kitchen)
3. What is the OPPOSITE of what competitors do? (they show perfection, show reality; they go long, go brutally short)
Course claim: Meta research shows creator-style lo-fi ads beat studio ads by 63% in direct response. Unverified; do not repeat externally.

### Combining frameworks (the course's pairings)

- SPARK + COUNTDOWN: momentum, then a numbered list of why people switch.
- MYTH KILLER + PRESSURE COOKER: shatter a belief, then agitate the cost of having held it.
- ORIGIN STORY + CONVICTION: founder narrative, then objection demolition.
- RAW TAKE + WITNESS: native opener, then stacked real voices.
- SHORTCUT + BRIDGE: easy path, then close the gap to action.
- CLIFFHANGER + DEMO DROP: impossible claim, proved live.
- GRIT AD + anything: simplify, cheapen, flip expectations.
- EDUCATOR + SPARK: teach, then show a wave already using it.

### Fast chooser (from the quick reference)

SPARK = momentum; MYTH KILLER = challenge lies; COUNTDOWN = listicle; ORIGIN = founder authenticity; SHORTCUT = results without pain; RAW TAKE = native feel; PRESSURE COOKER = agitate deep pain; GRIT = lo-fi; CONVICTION = crush objections; FACE-OFF = comparison; BRIDGE = desire-to-action gap; CLIFFHANGER = curiosity/retention; WITNESS = testimonial trust; DEMO DROP = show it working; TIME MACHINE = before/after proof; EDUCATOR = value-first authority.

---

## 4. Awareness levels strategy

### The five levels (Schwartz-derived)

| Level | Who they are | Ad job |
|---|---|---|
| 1 Unaware | No idea they have a problem; scrolling | Interrupt the scroll, make them notice something is off |
| 2 Problem aware | Feel the pain, not yet seeking solutions | Name and validate the pain; hint at a path |
| 3 Solution aware | Know solutions exist, maybe googled or tried a competitor; most of the audience sits here | Show why your solution/mechanism beats the rest |
| 4 Product aware | Know you; something stalled them (price, timing, trust) | Nudge: proof, objection handling, risk reversal |
| 5 Most aware | Past customers, subscribers, engaged followers | Right offer at right time; easiest conversion |

### Three ad objectives mapped to levels and frameworks

**1. Awareness ads (levels 1 to 2, cold).** Entertain or educate first, product second; pattern interrupts, bold claims, curiosity, story; broad targeting. Measure views, reach, engagement, CPM.
Frameworks: SPARK, MYTH KILLER, RAW TAKE, EDUCATOR, PRESSURE COOKER, CLIFFHANGER.

**2. Converting ads (levels 2 to 4).** Clear demos, testimonial cascades, side-by-sides, before/after, feature-to-benefit, strong CTA with urgency or risk reversal. Measure CTR, CPC, conversion rate, ROAS.
Frameworks: COUNTDOWN, SHORTCUT, WITNESS, DEMO DROP, TIME MACHINE, FACE-OFF, BRIDGE.

**3. Retargeting ads (warm, levels 4 to 5).** Objection handling, social proof stacking, limited offers, behind-the-scenes and founder content, "still thinking about it?" reminders, UGC "I almost didn't buy this." Measure ROAS, CPA, frequency (do not burn people out). Usually the cheapest conversions.
Frameworks: CONVICTION, ORIGIN STORY, WITNESS, GRIT AD.

### System and quick match

Run awareness ads to cold, retarget engaged viewers with converting ads, retarget site visitors/cart abandoners with retargeting ads. Biggest mistake named: **converting ads to cold audiences** ("proposing on the first date").

Quick match: Unaware = awareness; Problem aware = awareness or converting; Solution aware = converting; Product aware = converting or retargeting; Most aware = retargeting.

### Desire-to-framework pairing (psychology doc)

- Health desire + problem aware: PRESSURE COOKER or SHORTCUT
- Status desire + unaware: CLIFFHANGER or EDUCATOR
- Comfort desire + solution aware: FACE-OFF or DEMO DROP
- Belonging desire + any: WITNESS or SPARK
- Control desire + problem aware: MYTH KILLER or BRIDGE

"The desire tells you WHAT to say. The framework tells you HOW to say it."

---

## 5. Ad psychology principles (10, from Schwartz's *Breakthrough Advertising*)

**Before writing**
1. **Mass desire.** You cannot create desire, only channel an existing one. Six permanent desires: health, sex/attraction, status, belonging, control, comfort. The vehicles that fulfil them shift with mass education and style trends (post-2020 distrust of pharma pushed natural remedies; loungewear peaked with lockdown comfort). Research where desire is rising. **One ad, one desire**; pick the dominant desire of the specific avatar (a single 35-year-old and a married one want different things from the same hair-loss product).
2. **Market sophistication** (how tired the market is). L1 new category: just state what it does. L2 stronger claim. L3 **new mechanism** (sweet spot for launches). L4 better mechanism (L2 emphasizes the claim, L4 the mechanism). L5 identity marketing, because nobody believes claims anymore; a new mechanism then resets the cycle to L3. To place your market: find what is unique, catalogue competitors' claims, include indirect competitors.
3. **Beliefs.** Accept beliefs as they are; do not fight them. Reinforce, or shift gradually. An opening claim that contradicts what they believe kills the whole ad.

**While writing**
4. **Gradualization.** Start from a belief they hold, get a head nod, stack agreements, arrive at the big claim as the obvious conclusion. Never open with the unbelievable promise.
5. **Intensification.** Do not state the benefit; put them in the morning after (the mattress example: waking without back pain, partner says "you seem different").
6. **Identification.** People buy who it makes them: the good parent, the disciplined person. Ask what kind of person the buyer sees themselves becoming. Every ad should carry a touch of it.
7. **Redefinition.** Kill objections by changing the comparison, not by arguing (a $79 posture corrector vs $240/month of chiropractor visits).
8. **Mechanization.** Show how it works so they believe that it works; a mental model creates belief.
9. **Concentration.** Destroy the alternatives: compare on cost, time, effort, results. Competitors are the other ten ways to solve it, not "nothing."

**While producing**
10. **Camouflage.** Once it looks like an ad, it is dead. Match platform-native format. TikTok/Reels: selfie, phone-shot, casual. YouTube: educational, face-to-camera or screen recording. Meta feed: photo with text underneath, carousels. Stories: quick, poll/question stickers, lo-fi. Camouflage also enables fast testing; the course claims 10+ AI video ads a day is feasible.

Pre-writing checklist the doc ends with: what do they want deep down, how tired is the market, what do they already believe.

---

## 6. Hook library

You have 1 to 2 seconds. A hook must do one of three things: create curiosity, trigger emotion, or promise value. Adapt the bracketed formula to your niche; structure matters, not wording.

### 6a. Library categories (formula patterns)

**Curiosity**
1. "Nobody is talking about this and it's a problem"
2. "I just found out something that changes everything"
3. "This is the part they don't show you"
4. "I wasn't supposed to share this but"
5. "What happens when you [do unexpected thing]"
6. "I tested this for 30 days and the results were insane"
7. "You've been doing [thing] wrong your entire life"
8. "I bet you didn't know [thing] could do this"
9. "There's a reason why [thing] looks like that"
10. "What nobody tells you about [topic]"
11. "POV: You just discovered [surprising thing]"
12. "This is either genius or insane. You decide"

**Shock and controversy**
13. "Unpopular opinion: [bold claim]"
14. "I'm about to ruin [thing] for you forever"
15. "Stop doing [popular thing]. Here's why"
16. "Everyone is lying to you about [topic]"
17. "The [industry] doesn't want you to see this"
18. "This is the worst advice on the internet"
19. "If you're still doing [thing] in 2026, we need to talk"
20. "I used to believe [thing], then I learned this"
21. "Hot take: [controversial opinion about your niche]"

**Value and educational**
22. "Here's how to [achieve result] in [short time]"
23. "[Number] mistakes that are killing your [thing]"
24. "3 things I wish I knew before starting [thing]"
25. "I spent [time/money] learning this so you don't have to"
26. "If you're a [type of person], watch this"
27. "Why your [thing] isn't working (and how to fix it)"
28. "Do this instead of [common approach]"
29. "Free game: How to [achieve result] without [common requirement]"
30. "The difference between [amateur thing] and [pro thing]"
31. "I found the secret to [thing] and it's embarrassingly simple"
32. "Save this for later, you're going to need it"

**Story and emotional**
33. "I almost gave up. Then this happened"
34. "A year ago I was [bad situation]. Today [good situation]"
35. "I have a confession to make"
36. "What would you do if [hypothetical scenario]?"
37. "I didn't believe it until I saw it with my own eyes"
38. "I never post stuff like this but this is too important"

**Engagement/CTA (organic more than paid)**
39. "Which one is better? 1 or 2? (comment below)"; "Comment [word] and I'll send you the guide"; "Share this with someone who needs to see it"; "Rate this 1-10"; "Tag someone who would love this."

**AI-content-specific (for creator education content, not for us):** "Real or AI? Comment your guess", "This would have cost $50,000 to film two years ago." For a local service, do not make "this is AI" the point.

### 6b. Per-framework hook formulas (from the 16 hook banks, adapted)

- Momentum: "Why is everyone in [niche] suddenly talking about [X]?"; "I asked 20 [professionals] what they use. Every one said the same thing"; "The #1 thing [authority group] stopped doing this year."
- Contrarian: "I worked in [industry] for [X] years. Here's what they hide"; "Everything you've been told about [topic] is backwards"; "Why [common advice] is making your [problem] worse."
- List: "[X] things you're doing every [time] that are sabotaging your [goal]"; "[X] signs your [routine] is working against you."
- Origin: "Meet [Name], [unexpected relatable detail]"; "The founder of [Brand] used to be a [relatable job]."
- Shortcut: "How to [result] without [hated activity]"; "The laziest way to [result] (and it actually works)"; "I replaced [X] things with one."
- Raw take: "Okay wait I need to talk about something"; "Okay storytime, because this genuinely surprised me"; "Can we talk about [topic] for a second? Because I have thoughts."
- Pain: "If you know what it feels like to [vivid pain moment], keep watching"; "The worst part about [problem] isn't the [obvious]. It's the [hidden emotional cost]"; "POV: [painful scenario], and nothing you try works."
- Grit: "[Handwritten note] Dear [audience], stop buying [type]. Sincerely, someone who wasted $[X]"; "I filmed this on my phone in my kitchen because you need to see this."
- Conviction: "They said [objection]. They were wrong. Here's the proof"; "I'll say what no one in [industry] will."
- Face-off: "Can I [fun task] before [time]? Let's find out"; "[A] vs [B], this wasn't even close"; "Side by side, no tricks, no editing."
- Bridge: "You're not lazy. Your [tool/system] just doesn't fit your life"; "What if the reason [goal] feels impossible is that you're using the wrong approach?"
- Cliffhanger: "I accidentally [amazing outcome] by [mundane action]"; "The dumbest thing I ever bought ended up [result]."
- Witness: "I was the biggest skeptic. [X] weeks later..."; "Real talk: I almost returned this. Then week [X] happened"; "Don't take my word for it. Take theirs."
- Demo: "Watch this."; "I didn't believe it either. Then I pressed record."; "[X] seconds. That's all it takes."
- Time machine: "Same person. Same life. One change"; "Day 1 vs Day 90. Same camera. Same lighting."
- Educator: "You're probably doing [activity] wrong. Here's why and the fix"; "[X]% of people don't know this about [category]"; "Free lesson: the [X] about [topic] nobody teaches you."

---

## 7. UGC example scripts: structural patterns

Ten fill-in-the-blank scripts. All share one skeleton: **HOOK (one line, casual, platform-native) > BODY (personal, specific, honest reaction) > CTA (low-pressure, friend voice, "link in bio").** Language: spoken, not written; contractions and fillers ("okay so", "honestly", "literally").

| # | Script | Best for | Beat structure |
|---|---|---|---|
| 1 | Unboxing | Physical goods, gadgets | Excited arrival > packaging reaction > reveal > first impression > the one reason you bought > honest quality/price verdict |
| 2 | Testimonial | Services, courses, software | "I never do these" > timeframe ago I was [before] > skeptical > [after] with before/after metric > unique selling point > beat a named alternative > low-risk CTA |
| 3 | Day in my life | Lifestyle, apps, supplements | Morning use > midday fit > original problem > favourite moment > "can't imagine routine without it" |
| 4 | Problem-Solution | Clear pain points | "If you deal with X, stop scrolling" > the struggle > two failed attempts > doubt > demo > "haven't had it since" |
| 5 | Before/After | Visual transformation | Show before > describe problem > simple steps > show after > honest reaction |
| 6 | GRWM | Beauty, fashion | Routine on camera > product woven in > compare to old product > final look |
| 7 | Comparison/Review | Products with alternatives | "I tested A vs B" > pros/cons each > winner by use case and price > honest pick |
| 8 | Street interview | Awareness, virality | Approach 3 people of different demographics > let them try > best reaction last. Note says to generate different AI "people" for this |
| 9 | Tutorial/How-to | Tools, techniques | "Stupid easy" > 3 steps > result > common mistake > time saved |
| 10 | Story time | Emotional, premium | Timeframe ago situation > emotional state > discovery > initial reaction > turning point > specific result > "wish I'd known sooner" |

Takeaways for the skill:
- Every script embeds an **honest skepticism beat** ("I was skeptical") and a **specific result**; that supplies realism.
- CTAs are soft, first-person and low-risk framed ("worst case you...").
- The course frames AI UGC as recreating a real person talking to a friend. **Risk: scripts 2, 4, 5, 6, 10 are first-person claims of personal use. An AI avatar saying "I used this for six months" is a fabricated testimonial.** See section 8.

---

## 8. Got Moles applicability

### Ground rules for every Got Moles ad

- Lead with **chemical-free, safe for pets and kids**. Identity is "chemical-free and safe mole control," not "trapping."
- Never mention killing, trap mechanism, lethal, poison, or the body-gripping/scissor/harpoon/spike family (Posture-A). Mechanization (Principle 8) must therefore explain the *service* (we find the active tunnels, we return on a schedule, we follow up) rather than the device.
- No fake testimonials, no AI avatars posing as customers, no invented reviews or counts. Use only measured numbers (CLAUDE.local rule: 283+ five-star reviews, 289 Google reviews, 5.0 across three locations; re-measure before publishing). No I-713 claims. No "WA's #1." "15+ years" must be clarified as Spencer's personal experience (company founded 2017).
- Commercial and over-5-acre work is an in-person bid; do not quote prices in ads for those. Any residential price claim in an ad needs Spencer's approval.
- US English. Spencer approves before any spend, launch or send.
- Disposal: do not mention it in copy.

### Audience situation

A homeowner in Western Washington who sees fresh mole hills, ridges, or soft spots in the lawn. Pain: ruined yard, kids and dogs twisting ankles on tunnels, mowing around mounds, frustration with fixes that did not last. Dominant desire: **control** (get the yard back), with **comfort** and **status** (curb appeal) secondary. One ad, one desire.

Market sophistication: the DIY mole market is saturated with claims (castor oil, sonic spikes, gum, flooding), roughly L3 to L4. Our differentiator is the *professional follow-up service* plus the safety angle, not a gadget claim.

### Awareness map

| Level | Homeowner state | Ad approach | Frameworks |
|---|---|---|---|
| 1 Unaware | Has not noticed fresh sign; scrolling | Teach early signs; lawn pattern interrupt | EDUCATOR, CLIFFHANGER |
| 2 Problem aware | Sees mounds, hates them, not searching | Name the pain; validate; common in WA | PRESSURE COOKER, MYTH KILLER (home-remedy myths), COUNTDOWN |
| 3 Solution aware | Googled "get rid of moles," tried a remedy | Redefine and concentrate: why DIY repeats the cycle; follow-up plan; chemical-free safety | SHORTCUT, FACE-OFF (service vs DIY, honest and verifiable), BRIDGE |
| 4 Product aware | Visited site or called, hesitating | Objection crush: "is it safe around my dog," "will they come back," process and bid clarity; real review stack | CONVICTION, ORIGIN STORY (Spencer, honest framing), WITNESS (real reviews only) |
| 5 Most aware | Past customers | Referral nudge, seasonal reminders, plan renewal (Total Mole Control Program) | RAW TAKE (Spencer talking), GRIT AD |

Funnel rule: do not run hard-sell conversion ads to cold audiences. Cold = signs and myths; warm = proof and process; hot = booking and reviews.

### Where each principle lands for Got Moles

- **Mass desire:** control over your own yard, family safety, comfort (no more bumps).
- **Beliefs:** homeowners believe "chemicals work faster" or "I can fix it myself." Do not argue; open with what they already believe ("you've probably tried something already").
- **Gradualization:** "Mole hills pop up fast in fall and spring" > "Home remedies rarely make them leave for good" > "A visit schedule beats a one-time fix" > the offer.
- **Intensification:** the Saturday morning with the kids and dog on a flat lawn.
- **Identification:** the careful parent/pet owner who keeps the yard chemical-free.
- **Redefinition:** compare against repeated store-bought fixes and reseeding, using only verifiable costs.
- **Mechanization:** the process of finding active tunnels and scheduled follow-ups, never the device.
- **Concentration:** list common DIY options and why they repeat; factual only.
- **Camouflage:** Spencer or a tech on a phone in a real yard; Notes-app static; neighbor-style post. Still label paid placements per platform rules.

### Course advice that is risky for us

1. **Fabricated personas and testimonials.** Nearly every example script invents a person, review count, lab study or doctor. Do not reproduce. Use real permitted reviews, Spencer as himself, or non-claim visuals.
2. **AI avatars voicing first-person experience** ("I've used this for 3 weeks") is a fake testimonial. An AI presenter is acceptable only as an obvious explainer reading company claims, not as a purported customer. Consider disclosure.
3. **Invented stats** (e.g., "93% see results in two weeks," "63% lo-fi advantage," "60,000x faster visual processing"). Treat every course number as unverified; use none unless we measured it.
4. **Rigged FACE-OFF tests and staged "street interview" reactions** present manufactured evidence as real.
5. **"Industry hides the truth" tone (MYTH KILLER)** is fine for documentable myths (home remedies); do not disparage competitors by implication or imply our method is hidden.
6. **"Not sponsored, not an ad" hooks** are deceptive on paid placements and break platform and FTC rules. Skip.
7. **CLIFFHANGER impossible claims** must be literally true; skip income-style stories.
8. **Urgency/scarcity** only when real (seasonal booking capacity is real; invented deadlines are not).
9. **Camouflage** must not become deception about who is speaking.
10. **Guarantee language** (our pricing policy has a no-catch guarantee) must be worded without implying kill or lethal outcomes; get Spencer's wording.

### Ten-plus example hooks for Got Moles (all within guardrails)

Curiosity / unaware
1. "That raised ridge in your lawn is a tunnel. Here's what it tells you."
2. "Nobody tells you the first sign of moles isn't the mound."
3. "Fresh mole hill or old one? Here's how to tell, and why it matters."

Pain / problem aware
4. "POV: your dog just twisted a paw on a tunnel you didn't see."
5. "If you've mowed around the same mounds three weekends in a row, keep watching."
6. "The worst part of a mole-torn lawn isn't the dirt. It's not letting the kids play on it."

Myth killer
7. "Castor oil, gum, and sonic spikes. Here's why the mounds keep coming back."
8. "Everything you've been told about getting moles to leave is backwards."

Shortcut / solution aware
9. "How to get your lawn back without spreading chemicals where your kids and pets play."
10. "Chemical-free. Safe for pets and kids. Here's the whole process in 30 seconds."

Bridge / education
11. "You want your yard back by spring. Here's the gap nobody mentions."
12. "Moles are most active after rain and in fall and spring. Here's what to watch for."

Conviction / product aware (Spencer on camera)
13. "I'll answer the question every Western Washington homeowner asks first: is it safe for my dog?"
14. "You've tried the hardware-store fixes. Here's why a follow-up plan works when a one-time fix doesn't."

Demo / time machine (real jobs only, owner permission)
15. "Same yard, a few weeks later."

Retargeting / most aware
16. "Still thinking about it? Here are the three questions people ask before they call."

Raw take (Spencer or a tech as themselves)
17. "Okay, I'm standing in a yard right now. Here's what these ridges are telling me."

Social proof (real numbers only, re-measured)
18. "Five stars across three Western Washington locations. Here's what homeowners keep saying."

### Framework drafts adapted (outlines)

**EDUCATOR (cold, 30 to 40s):** Teach the signs (fresh vs old mound, surface ridge vs deep tunnel). Depth: why the pattern matters for timing a visit. Align: Got Moles reads that pattern. Credentials: only verified (founded 2017; 289 Google reviews, 5.0 across three locations, re-measured). CTA: free quote, soft.

**PRESSURE COOKER (problem aware):** Wound = the yard the kids can't play on. Ripple = ankle twists, mowing around mounds, embarrassment. Failures = remedies already tried. New way = professional, chemical-free service with scheduled follow-ups. Proof = real review counts. CTA with the booking path.

**CONVICTION (retargeting, Spencer on camera):** Harsh truth: quick fixes come back. Identity: real local operator. Echo doubts: "is it safe for my dog, will it come back, what does it cost." Evidence: real review figures, process steps. Bigger play: ongoing yard protection. CTA.

**RAW TAKE:** field clip from a real visit; casual voice; no urgency.

**Static ads (Nano Banana Pro):** Notes-screenshot "myth vs reality" card; Golden Review using a real, permitted Google review; Side-by-Side as an educational diagram of fresh vs old mound; Offer Card only with an approved offer. Never generate fake "after" lawns presented as customer results.

### Skill-building guidance

1. Start every brief by choosing awareness level, then desire, then framework, then hook (the course's own order).
2. Hard-code a claims gate: no mechanism words, safety-first lead, verified numbers only, no persona testimonials, US English.
3. Default to native, phone-shot, Spencer/tech-voiced content; use AI for B-roll, explainers and static visuals, not for fake people vouching.
4. Test many cheap variants (static plus short vertical) per awareness tier, all approved by Spencer before spend, consistent with mkt-cmo rules.
5. Fetch the Nike/car/GTA video transcripts separately if cinematic brand films become a goal.
