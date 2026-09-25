# The plan to fix Mo

**For:** Spencer · **2026-09-01**
**Basis:** 74 graded sales calls (2026-08-04 → 08-31), live Jobber data refetched today,
and the plan-mix analysis in `2026-09-01_why-mo-doesnt-sell-tmcp.md`.

---

## 1. Read this first: he does not need more training

The five-beat card was written **2026-08-04**. It says, in bold, at the bottom of the page:

> **No number leaves your mouth until all 5 beats are done.**

Since then he has taken **74 graded sales calls and cleared that bar zero times.** Not once.

That is not a knowledge failure. He delivers all five beats accurately, in his own words, whenever
a customer asks him a question — Heller, Anchors and Matsuno all got beat 5 delivered perfectly on
08-31. He knows it cold. **He just never gets to say it, because the caller asks the price first
and he answers the question he was asked.**

Look at how these calls actually open:

> *"So how much do you charge to remove moles?"* — Zoe Wu
> *"I got moles. I don't know how much you guys charge to get rid of the d*** things."* — Heller
> *"So tell me your pricing. How does it work?"* — Sandra Anchors
> *"I was wondering what do you charge to come out?"* — Centralia

He has a line for every objection in the book and **no line for the price question.** So he prices.
And once the price is out, the block has nowhere to live and the plan he described first wins.

### And there is a second reason, which is our fault, not his

`muhammad-portable/project-instructions.md` is the canonical definition of his coach — the file he
pastes into his own Claude Project, and the one the `ops-phone-roleplay` skill reads. Its own
header says *"change coaching rules here and nowhere else."*

**It tells him to deliver the block and then says, three separate times:**

> *"…so there are two ways to go about this"* → the prices.

**And then it stops.** It never says which option comes first. So the coach drills him to the edge
of the pitch and goes silent exactly where the money is — and he fills the gap the only way he
knows, on 14 of 14 calls: *"the first one is a quick fix."*

We have been drilling him up to the sentence before the one that matters. **That is a hole in the
instructions, not a failure of his.**

**So the fix is not a sixth document. It is two sentences he does not currently have, and a patch
to the file that was supposed to give them to him.**

---

## 2. The two sentences

### Sentence 1 — the deferral. For when they ask the price in the first minute.

> **"I'll give you both prices in about a minute — let me just get two things first so I quote you
> right, and I'll tell you what you're actually dealing with."**

Then the three qualifiers, then the five beats, then the prices. He already runs the qualifiers
perfectly (they were fixed weeks ago). This one sentence buys him the sixty seconds the block
needs, and it is *more* professional than answering immediately, not less — it says the price
depends on their yard, which is true.

### Sentence 2 — the reorder. Replace the bridge he says on every single call.

He currently says, on **14 of 14** calls, word for word:

> ~~*"So there are two ways that you could go about with us. The first one is a quick fix…"*~~

That single memorised phrase is the whole problem. Everything downstream follows from it.
Replace it with:

> **"So there are two ways to do this, and I'll tell you which one I'd put you on.**
>
> **The one most people in your situation take is the year-round program — $100 a month, no
> deposit, nothing up front, unlimited visits. That's the one built for what I just described:
> we catch the ones you've got now, then we read the runs and set the perimeter so we're catching
> the next one before it does any damage. You're never calling us again about moles.**
>
> **There's also a one-month option — $450, five weekly visits, $150 up front, and if we catch
> nothing the $150 is all you pay. That one clears what's in your yard today. It doesn't stop the
> next one moving in.**
>
> **For a yard that's had them [this long], I'd take the year-round one."**

Same two paragraphs he already delivers. Opposite order. The guarantee stays attached to the Quick
Fix, but the Quick Fix is now the *small* option instead of the *safe* one, and the annual plan
finally arrives with a reason instead of an adjective.

**That is the entire coaching change.** Everything below is delivery, support, and measurement.

---

## 3. This week

Today is Tuesday. Labor Day is Monday 09-07, so this week is Tue–Fri.

| When | Who | What |
|---|---|---|
| **Today, 30 min** | Spencer + Mo | Sit down. Show him the 0-for-9 number and the Heller call — he will recognise it instantly. Hand him **`2026-09-01_the-order-card.md`** (already written, one page). Do not re-teach the beats; he knows them. |
| **Today, 2 min** | Spencer → Mo | **Tell him to re-paste `project-instructions.md` into his Claude Project.** I have already patched it (see below) — but his copy is a paste, not a link, so it does not update itself. Until he re-pastes, his coach still drills the old order. |
| **Today, 15 min** | Spencer | Give him **three real field stories** (see §4). He cannot invent these and should not fake them. |
| **Today** | You/me | Restart the cron daemon — `bash scripts/start-crons.sh`. The nightly grading has been dead since 08-27, which is why 08-28 and 08-31 went ungraded and why Jean Vanwagoner sat unbooked for four days. **The three jobs that must never run again — route-drift-check, jobber-visit-followups, route-horizon-extend — are all already `active: false`, so starting the daemon will not wake them.** I checked. |
| **Wed–Fri, 10 min each morning** | Mo, alone | Ten reps of the two sentences out loud, off the page, using the `ops-phone-roleplay` skill or the ChatGPT voice prompt he already has. Scenario every time: **caller opens by asking the price.** That is the only rep that matters. |
| **Wed–Fri, 6:30pm** | Automatic | Daily grading resumes. First number to watch is not the score — it is **"did a number leave his mouth before beat 5?"** |
| **Fri 09-04** | Spencer | Five minutes on the week's mix. Nothing formal. |

**One rule for the drills:** the caller asks the price in the first 30 seconds, every single time.
Drilling anything else this week is wasted, because that is the only moment where the call is lost.

### What I already changed (revert with git if you disagree)

Four surgical edits to `muhammad-portable/project-instructions.md`, made in the canonical file
because its own header says that is the only correct place:

1. **Added the missing order** after *"there are two ways to go about this"* — annual plan first,
   with the reason and the recommendation, Quick Fix second, one quote not two. Includes the
   measured numbers so the coach knows why.
2. **Added a `recommend` drill** and made it his priority, ahead of `beat5`. Fails any rep where
   the Quick Fix is described first or that ends with *"do you want both?"*
3. **Script arc row** now reads *"annual plan pitched first with a reason, Quick Fix second."*
4. **New pass ceiling of 75** where the annual plan was never given a reason, and an automatic
   fail for any call that ends with two quotes going out.

Also copied into `muhammad-portable/`: **`2026-08-12_spencers-close-verbatim.md`** and
**`2026-08-12_spencers-story-bank.md`** — the two documents built for him on 08-12 that were
never delivered. They are staged, not sent; you still hand the folder over.

---

## 4. What only you can supply

Four things Mo cannot generate, and the plan does not work without them.

**1. Three field stories.** He has never stood in a yard. His biology is more accurate than yours
and it is textbook, which is why it persuades nobody. Flagged on 08-12; still not delivered. Give
him three, with permission to tell them as the company's ("we had one last month where…"):
- The cat-and-mouse yard — traps moved, mole reappeared, moved again.
- A property where the perimeter strategy actually stopped a recurring problem.
- One big catch that made a customer's year.

**2. Hand over the two documents he has never been given.** `2026-08-12_spencers-close-verbatim.md`
and `2026-08-12_spencers-story-bank.md` — both built 20 days ago from 47 of your own calls, and
until today neither was in `muhammad-portable/`. **I have staged both.** They go across with the
folder; that part is yours.

**3. Rule on his discount latitude, in writing.** The FAQ tells him to "ask Spencer how much
latitude you have" and nobody ever has. So he improvises — on 08-31 he invented a conversation
with you (*"I actually reached out to my boss… he gave me a go ahead"*) to justify a 10% senior
discount at age 60 that was inside policy anyway. He does not need to lie about a discount he is
allowed to give. One line: *"senior/military/veteran, up to 10%, your call, no need to ask."*

**4. Decide whether TMCP becomes the default quote.** This is the biggest lever on the page and it
is yours, not mine (recommendation in §6).

---

## 5. The bot has exactly the same bug — and it takes more calls than he does

60–70% of inbound calls hit CallRail Voice Assist, not Mo. **It pitches in the same broken order,
on every call:**

> *"Our **Quick Fix** is a flat rate for 1 month of trapping… **The other option** is our Total
> Mole Control Plan."* — Jean Vanwagoner, 08-28
>
> *"we have 2 options: the **Quick Fix**, which is a flat $450… **or** our Total Mole Control
> Program"* — Amy Taylor, 08-28
>
> *"we have 2 main options: a 1-month **quick fix** at a flat $450… **Or**, our year-round total
> mole control plan"* — Douglas Switzer, 08-31

Three for three. Fixing this is a config change to the Voice Assist script, it costs nothing, and
it reaches more callers than Mo does. Replacement text:

> *"Most customers go with our year-round Total Mole Control Program — $100 a month for up to an
> acre, no deposit, unlimited visits, because moles are territorial and once we take one out
> another moves into the same tunnels. There's also a one-month Quick Fix at $450 with a $150
> setup fee if you'd rather start smaller — and if we catch nothing, the $150 is all you pay."*

**CallRail is read-only from this install**, so this needs you or Roy. Worth doing this week.

---

## 6. Two structural decisions — my recommendations

**A. Make TMCP the default quote. → I'd do it.**
Right now the default is whatever the customer says on the phone, which is whatever he described
first. Make the rule: *TMCP unless the customer gives a reason not to* (selling the house, a
one-off problem, genuine budget refusal). Kathleen Rosmon on 08-31 gave a real reason — she's
selling — and Quick Fix was right for her. Craig Suffian, Tanner Aden and Aaron Burke gave none.

**B. Stop sending both quotes. → I'd make this a hard rule, today.**
He is **0 for 9** when both go out; you are 14-to-3 the other way. Two quotes is not a choice, it
is a deferral — and it is how Stephen Heller ended up holding three quotes, no service, and a
competitor's phone number. One recommendation, one quote, sent on the call.

**C. Worth asking yourself: does anything in his pay distinguish a $450 from a $1,200?**
I don't know how he's compensated. If the answer is no, then everything above is asking him to do
the harder sale for the same money, and coaching alone will fight that forever. Not my call, but
it belongs on the list.

---

## 7. How we'll know it worked

| Measure | Now | Target | When |
|---|---:|---:|---|
| **Beats before the price** (leading indicator) | **0 of 74** | **>half of sales calls** | Fri 09-04 |
| Quotes sent that include TMCP | 29% | 45% | Fri 09-11 |
| **TMCP share of wins** (the real number) | **22%** | **35%** | **Fri 09-18** |
| Both-quotes-sent leads | 8% | ~0% | immediately |
| Daily average score | 76 (30-day) | **do not chase this** | — |

35% rather than your 48% on purpose: it is roughly halfway, it clears the ~33% "effective" number
the field-upsell study computed, and it is worth about **$8,000 a month** on his current volume.
48% is the destination, not the three-week target.

The daily grading cron measures all of this automatically once the daemon is back up. **Beats
before the price is the one to watch this week** — it moves in days, where the mix takes weeks,
and if it doesn't move nothing else will.

---

## 8. What not to touch

He had his best day on record on 08-31 — average 82.0, eleven sales calls, three TMCPs. Do not
break that reaching for the mix. **All of this is landing and should be left completely alone:**

- The no-catch guarantee — 54 of 86 lifetime, 9 of 10 on Monday, all volunteered
- The service-day lookup — 5 of 5 on Monday and used as a closing line every time
- Capture and the address read-back — 9 of 10 and 9 of 9
- Acreage bands — he self-corrected a misquote live and unprompted, twice in one day
- The DIY teardown, the flat-rate save, the $150 credit bridge, the qualifiers
- Tone — 15/15 on forty-plus consecutive calls
- Refusing things he shouldn't do — he shut down a social-engineering caller cold on Monday

**Three drills maximum, and this week it should really be one.** Every previous time the list grew
past three, something already fixed regressed.

---

## 9. Riding alongside — not coaching, just broken

These cost money this week and none of them are Mo's technique:

1. **Jean Vanwagoner** — approved $1,200 TMCP on 08-28, still no job, no visits. Oldest open item.
2. **Robert Evans** — promised free monthly visits forever on a $450 Quick Fix. First visit
   Wednesday. Fix it or upgrade him and honour it.
3. **Aaron Burke** — full close, no quote, no collection path for the $150.
4. **Carl Iverson** — told two months ago he was on autopay, never was, two invoices past due.
5. **Discounts as line items** — fourth instance on 08-31 (#14104, $1,080 with no discount line).
   Luke built the identical discount correctly the same day. This has been flagged on 08-10,
   08-17, 08-24 and 08-31 and has never once been fixed.
6. **Quote attribution** — Heller's #14117/#14118 and Glorias House #14116 are filed under
   Spencer though Mo took the calls. Every mix and close-rate number is measured off this field,
   including the ones in this plan.
7. **Cascade Pest and Eastside Exterminators** have now referred work three weeks running and
   nobody has thanked either of them.

---

## 10. If the number hasn't moved by 09-18

Then the diagnosis in §1 is wrong, and the honest next step is to stop coaching and change the
structure instead: make TMCP the only quote he is permitted to send without asking, and route
price-shopper calls to you. I don't think that will be necessary — he fixed the guarantee in nine
days, the service day in three, and the acreage bands in four. But it should be said now, before
the third month of the same finding.

---

## Proposed rubric amendment

The scoring cannot currently see this problem: Matthew Young scored **84** on 08-31 on a call
where one plan was presented, zero beats were delivered, and the customer interrupted the TMCP
sentence to buy the $450. Suggested dated entry for `GRADING-RUBRIC.md`:

> **2026-09-01 —** A sales call where the annual plan was never given a *reason* before the
> customer chose is capped at **75**, however good the rest of the call was. A plan named without
> an argument does not count as offered. (Added after the 08-31 plan-mix analysis: 22% TMCP
> against Spencer's 48%, and 0-for-9 on leads sent both quotes.)

Your call — the rubric is pinned and I have not touched it.
