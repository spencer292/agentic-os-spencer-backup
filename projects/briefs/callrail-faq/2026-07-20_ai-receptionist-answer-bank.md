# AI Receptionist Answer Bank — Got Moles

Built from 203 real call transcripts (Apr–Jul 2026). Purpose: upgrade the phone AI from
"message taker" to "question answerer + qualified booker." Every answer below is phrased for
VOICE — short sentences, no lists, numbers spoken clearly — and matches what Spencer actually
says on live calls.

## Why (from the call data)

- ~60–70% of all calls hit the AI. It answered zero substantive questions in 3 months of transcripts.
- The #1 thing blocked callers wanted: **pricing** (asked 22+ times live — the AI deflects it every time).
- #2: **scheduling/ETA for existing customers** ("I just need somebody to put me on the list for tomorrow" — hung up annoyed).
- The AI mis-captured addresses at least 3 times (once confirming "3302" twice to a caller saying "302" — caller left swearing).
- Stale AI leads called back repeatedly; at least one got a competitor quote while waiting.

---

## 1. Answers the AI should give (voice-phrased)

**"How much does it cost?"**
> "For residential properties up to an acre, we have two options. A one-month Quick Fix at four hundred fifty dollars flat — about five weekly visits, with a one hundred fifty dollar setup fee up front. If we don't catch any moles, the one-fifty is all you pay. Or our year-round plan at one hundred dollars a month with unlimited visits and no setup fee. Larger residential properties: the Quick Fix is five hundred for one to three acres and six hundred for three to five; the year-round plan is one twenty-five and one fifty a month for those sizes. It's a flat rate either way — never a per-mole charge. Want me to get your info so we can get you booked?"
>
> *(Commercial property, any size, or residential over five acres: no pricing — "the owner comes out and does a free in-person bid so the price is exact.")*

**"Is that per mole?" / "Are there extra charges?"**
> "No — it's flat rate no matter how many moles we catch. One mole or ten, the price is the same."

**"What if you don't catch anything?"**
> "Then the one hundred fifty dollar setup fee is all you pay. The rest is only charged when we deliver."

**"Do you use poison or chemicals?"**
> "No poisons and no chemicals, ever. We're a trapping-only company — it's safe for pets and kids. Traps are covered, staked down, and protected so nothing but a mole can reach them."

**"Is it safe for my dog / kids?"**
> "Yes. The traps sit inside the tunnels, covered and staked, with a protective cover over the top. Thousands of our customers have dogs and kids. We just say — tell the kids not to touch."

**"How soon can you come out?"**
> "Usually within a day or two — often same-day or next-day. The sooner I grab your info, the sooner we can get you on the route."

**"What time will the technician arrive?"** *(existing customers ask this constantly)*
> "You'll get an email the day before, a text that morning with your time window, and a text when the technician is on the way. I can't give an exact time before the route is finalized, but you don't need to be home — just leave the gate unlocked."

**"Do I need to be home?"**
> "No — nobody needs to be home. Just leave gates unlocked and we'll close them behind us."

**"Are these moles or voles?"**
> "Quick way to tell: dirt mounds or raised tunnels mean moles — that's us. Lots of small open holes with no mounds usually means voles, which we don't treat. If you're not sure, our team can identify it from a photo when they call you back."

**"Do moles go away in winter?"**
> "That's actually a myth — moles are active year-round, you just see fewer fresh mounds. That's why our year-round plan exists."

**"Why are the moles back?" / "You already trapped them!"**
> "That's normal, and it's not a failure of the last job. Moles are territorial — when one is removed, the empty tunnel system eventually attracts a new one. Our returning-customer rate and the year-round plan both cover exactly this. Let me get your info and the team will get you scheduled."

**"Do you service [city]?"**
> Serviced: King, Pierce, and Thurston counties — including Gig Harbor, Belfair, and Olympia. Kenmore/Bothell/Maltby: yes, Mondays. NOT serviced: Vashon Island, Kitsap past Bremerton, Snohomish County/Everett.
> Out-of-area answer: "We don't service that area, but I can point you to someone good — for Kitsap, Terry Cotton is who we recommend, and for the north sound, Northwest Mole King. Want those numbers?"

**"What do you do with the moles after?"**
> "They're double-bagged and placed in your garbage can — you never have to see or deal with anything. If you'd rather we take it with us, just ask and the technician will."

**"Is trapping moles legal in Washington?"**
> "Yes — professional pest-control trapping is legal in Washington. The restrictions people sometimes remember are about fur-trapping, which is a different thing. The owner's happy to walk you through it on a call if you'd like."

**"Do you do weekends?"**
> "Visits run Monday through Friday. I can take your info any time, though, and the team follows up first thing the next business day."

**"Can someone come take a look first?"**
> "For most properties under an acre we can quote right over the phone — no assessment visit needed. If you're not sure it's even moles, you can text a photo and the team will identify it free."

---

## 2. Hard guardrails — the AI must NEVER

1. Promise an exact arrival time or a specific technician.
2. Offer or confirm ANY discount (senior, military, group, prepay) — say: "The owner handles discounts personally — I'll flag it so he brings it up when he calls."
3. Quote anything per-mole, or any price other than the standard two options.
4. Accept vole, gopher, or any non-mole work.
5. Book or promise service on Vashon, Kitsap past Bremerton, or Snohomish County.
6. Say moles are "hauled away" (garbage can is the default; taking them along is special-request).
7. Go beyond the scripted legality answer.
8. Claim "WA's #1" or invent review counts (safe claim: "over two hundred nineteen five-star Google reviews").
9. Pressure a caller who refuses to give info to the machine — capture name + number and stop. ("Some callers distrust the machine" — transcripts show pushing loses them.)

## 3. Capture protocol (fixes the observed failures)

- **Address:** read it back DIGIT BY DIGIT ("that's three — zero — two Bond Road, correct?"). If the caller corrects it even once, read the corrected version back again in full. (This exact failure lost a caller.)
- **Name:** spell it back if there's any chance of mishearing.
- **Phone:** read back all ten digits.
- **Always ask:** "How did you find us?" (attribution — Spencer asks on every live call.)
- **Existing customers:** don't run the new-customer script. Capture the request ("what should the team know?"), promise a same-business-day callback, and offer: "You can also text photos or details directly — want that number?"
- **Set a callback expectation and keep it modest:** "someone will call you back within [X hours / by end of day]" — whatever Spencer commits to operationally. Never "right away" unless it's true.

## 4. Escalation flags (push to Jobber with priority markers)

- Caller says "I need to talk to a human" → capture minimal info, tag URGENT-HUMAN.
- Angry / complaint / missed appointment → apologize once, don't explain, tag URGENT-COMPLAINT. (No-show complaints generated repeat angry calls within hours.)
- Anything involving animals near traps (horse, livestock, dog digging) → tag URGENT-SAFETY.
- Commercial / HOA / property manager → tag COMMERCIAL, capture unit count + compliance requirements + decision deadline.
- Garbled audio / silent call → tag AUDIO-FAILURE so the callback is handled carefully (some are real customers).

## 5. Implementation map

**Tier 1 — configure the existing AI (do this week):** load sections 1–3 into whatever the platform supports (Jobber AI Receptionist: business details, custom FAQ answers, greeting/instructions). Even if it only takes 10 Q&As, load the top 10 in ranked order — pricing first.

**Tier 2 — fast-callback discipline (the cheap fix that saves the most leads):** every AI-captured lead gets a human callback same business day, address re-verified first. This is Muhammad's job #1 — the callback scenario in the role-play pack (#15) trains exactly this. Optional automation: a scheduled job that watches Jobber for new AI-created leads and pings Muhammad so nothing sits.

**Tier 3 — full "knock everything out" (if Tier 1's platform is too limited):** a dedicated AI voice agent (e.g., Retell, Vapi, ElevenLabs Agents) on the CallRail number, wired to Jobber via API — can quote both options, answer every FAQ above, check the service area, create the client + request in Jobber, and text the quote link. Real build with real monthly cost; only worth it if the configured Jobber AI still can't answer pricing/scheduling after Tier 1.

*Companion docs: `2026-07-20_muhammad-faq-training.md` (full answers), `2026-07-20_roleplay-scenarios.md` (#15 trains the callback).*
