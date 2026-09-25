# Message Patterns — Got Moles Corporate LinkedIn

How the messages are built, what they may claim, and what makes them fail.

---

## The governing idea

The audience for this campaign — community managers, superintendents, facilities directors —
receives automated outreach constantly. They have developed a reliable filter for it, and that
filter is fast. The moment a message could plausibly have been sent to a hundred other people,
it stops being a message and becomes noise.

So the test for every draft is one question: **could this have been sent to anyone else in the
list?** If yes, it isn't finished. The specific detail that makes it un-sendable to anyone else
is the entire value of doing this by hand twice a week rather than buying an automation tool.

Spencer has stated this requirement directly: every single thing unique to each person. It is
the reason this skill exists in supervised form.

---

## The three-part structure

### 1. Connection request — note or no note

Decide this per prospect before writing anything. The 2026 data (in `current-benchmarks.md`)
reverses the obvious answer: a note slightly *lowers* acceptance — 24–29% against 28–38% for a
bare request — while roughly *raising* reply-once-accepted from 14% to 22%. And on a free account
only about five notes are available per month.

So: notes go to prospects with a genuine warm route or a real anchor from their activity.
Everyone else gets a bare request, and the personalization lands in the first message after
acceptance, where nothing is capped and nothing is penalized.

When you do write one, LinkedIn enforces 300 characters on every tier. Count them; a truncated
note reads as careless.

Four beats, in this order:

1. **The anchor** — the specific, true reason this person. A shared connection by name, something they posted, their firm, their certification.
2. **Who Spencer is** — one clause. "I run Got Moles, mole-only specialists in Western WA."
3. **Relevance to them** — why moles are their problem specifically, in their language.
4. **A low-friction ask** — a conversation, not a meeting. Never a pitch.

Worked example (283 characters):

> Hi Mark — Patrick LaCroix is a shared connection, which is how I found you. I run Got Moles, the mole-only specialists in Western WA. Kappes Miller manages a lot of turf that moles love right now. Would value a quick chat about keeping your communities mound-free. — Spencer

Note what it doesn't do: no compliment, no "hope this finds you well", no pitch, no pricing.

### 2. First follow-up — after they accept, never before

Sending the pitch immediately on acceptance is the most common way this goes wrong. It converts
a new connection into a lead-gen target in one move, and it's what everyone else does.

Structure:

1. Thank them for connecting, briefly, without ceremony
2. The specific reason you reached out — and it must connect to the anchor from the note
3. The specialist proof: mole-only, going on seven years, close to 5,000 properties, 283+ five-star reviews
4. The commercial shape: annual managed contract, set schedule, written report every visit
5. Chemical-free — safe around residents, kids, pets, members, students
6. A soft close scaled to the relationship — "worth 15 minutes?" or "happy to look at whichever sites give you the most grief"

### 3. Nurture ladder — for the ones who go quiet

Four touches maximum, across roughly fourteen days — days 1, 4, 9 and 14. Each rung has to
carry something new; a message whose only content is "just following up" teaches them to ignore
you.

- **Touch 2 (~day 4):** something useful, not a chase. Seasonal timing ("spring mound season starts before most boards notice"), a relevant observation about their type of property, or a genuine response to something they posted.
- **Touch 3 (~day 9):** the one that matters. The data is consistent that the first follow-up adds almost nothing on its own while the second produces the measurable lift — so this is the rung to write carefully rather than the one to skip. Bring a different angle than touch 2 used: a specific property type, a seasonal deadline, a question rather than an offer.
- **Touch 4 (~day 14):** the graceful exit. Acknowledge the timing may be wrong, leave the door open, ask them to keep Got Moles in mind. Removing the pressure is often what produces the reply.
- **After touch 4:** stop messaging. Mark dormant in `pipeline.json` and switch to engagement-only — comment when they post something worth responding to. That isn't unsolicited, so it can run indefinitely, and it keeps Spencer visible for whenever moles actually show up on one of their sites.

Engagement is the underrated half of the ladder, and the research bears it out: commenting
before or instead of messaging is associated with two to three times the reply rate. It costs
nothing against any limit, puts Spencer in front of *their* audience, and often produces the
reply four messages couldn't.

**Length is an open question, not a rule.** Several 2026 cadence guides say keep every message
under 300 characters. Our July drafts run 600–900 and they're good. That recommendation comes
from high-volume SDR campaigns aimed at a different reader than a community manager considering
their portfolio — so run both, record which gets replies in `pipeline.json`, and let our own
data settle it.

---

## Voice

Spencer's: confident, warm, direct, plain language. He's a former Army officer who started this
in his own yard in Buckley — that's the register. Short sentences. No throat-clearing.

Read `brand_context/voice-profile.md` for tone before drafting.

**Spencer's own DM register (set 2026-09-09, overrides the polish rules below).** He read a batch
of cold notes and said "make it sound more like me." His real sent messages are casual and
unpolished, and they look nothing like the drafts this file used to produce:

- **"Hey [Name]!"** openers — never a name followed by an em-dash
- **Exclamation marks are his**, and they stay. The kill-list below used to ban them; it was wrong.
- **Zero em-dashes.** He does not use them at all. The "one per message" allowance is now zero.
- Short plain sentences. No literary constructions, no "X is a different conversation than Y".
- His own closers, rotated so a batch never repeats one: "Any chance you'd want to grab a coffee
  sometime?" · "Available next week?" · "shoot me some dates" · "give me a shout"

Read his actual sent messages in the LinkedIn thread list before drafting. `voice-profile.md` is
the BRAND voice and is the wrong register for a 1:1 message.

**Kill on sight:**
- "I hope this message finds you well"
- "I wanted to reach out"
- "I came across your profile and was impressed"
- "synergy", "leverage", "solutions", "circle back", "touch base"
- Anything with three parallel adjectives in a row
- Em-dashes anywhere (Spencer uses none — see his DM register above)
- ~~Exclamation marks~~ — RETIRED 2026-09-09, they are part of his real voice

**Keep:**
- Contractions. "We're", "you're", "that's".
- Specifics over adjectives. "283+ five-star reviews" beats "highly rated".
- The plain-language version of the pain: "before someone on the board spots the mounds on the entry lawn."

---

## The proof stack

What's available, and exactly how it may be phrased:

| Claim | Status | How to phrase it |
|-------|--------|------------------|
| Mole-only specialist | Core differentiator, lead with it | "we do moles and nothing else" |
| ~5,000 properties | Safe to publish | "close to 5,000 properties" |
| Five-star Google reviews | Safe — measured 2026-08-21 | "283+ five-star reviews" |
| Total Google reviews | Safe — measured 2026-08-21 | "289 Google reviews" or "5.0 across three locations" |
| Company age | Founded 2017 | "going on seven years" |
| Spencer's experience | **Personal, not company** | "15+ years of my own experience" — never "we've been doing this 15 years" |
| Chemical-free | Core, always | "chemical-free, safe around kids and pets" |
| 3 GBP locations | Safe | Only if geography is relevant |
| **"WA's #1"** | **Banned** | Unsubstantiated. Never use, in any variation. |
| **I-713 compliance** | **Banned** | Got Moles uses professional body-gripping traps. Never claim I-713 compliance. |

**Method language:** don't describe traps or mechanism in outreach. The positioning is
chemical-free and safe, and the method is a conversation for later, in person. This mirrors the
Posture-A rule that governs the Google Ads account, and it applies here for the same reason —
the mechanism reads badly out of context.

**Never quote residential pricing to a commercial prospect.** Commercial and any property over
five acres is quoted after a site inspection, on an annual contract. There is no phone or
message price.

---

## Handing off the call

When a prospect wants to move forward: Spencer takes the relationship call. The in-person
commercial or 5+ acre bid belongs to **Cory Ventura** (Tavis Alexander when he's back). Don't
draft a message committing Spencer to attend a site visit — book the conversation, and let the
bid route where it belongs.

---

## Failure modes worth naming

**The manufactured compliment.** "Your work at [Company] is really impressive" applied to someone
whose profile you skimmed. This is the single clearest automation tell, and it's dishonest, which
is a separate and better reason not to do it. If there's no real hook, anchor on the company or
drop the prospect.

**The instant pitch.** Full sales message inside the connection note. Converts the request into
spam before it's read.

**The template with a name slot.** If two drafts in a batch share a sentence, one of them isn't
finished.

**The wrong frame for landscapers.** Pitching a landscaping company as a customer reads as a
competitor prospecting them. They're partners — that has to be explicit and early.

**Pestering.** Four or more touches on someone who never replied. It damages a personal brand in
a small regional industry where these people all know each other, and Western WA property
management is exactly that kind of small.
