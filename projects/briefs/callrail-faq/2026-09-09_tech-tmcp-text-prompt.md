# The field sales-text prompt — One-Month → Total Mole Control Program

**Built 2026-09-09, rebuilt crew-wide 2026-09-10.** A prompt every technician pastes into whatever
AI they already use — ChatGPT, Claude, Gemini, Grok — to write the sales text they send a One-Month
customer after a visit. Model-agnostic on purpose: nobody has to change what's on their phone.

**Hand them this file:** `2026-09-09_tech-tmcp-text-PASTE-THIS.txt`
Paste once, answer two setup questions (name, and what he says when someone says yes), then one
line of job facts per stop.

---

## The bet

The tunnel education *is* the sale. Customers don't buy the Total Mole Control Program because it's
cheaper — they buy it the moment they understand what's actually happening under their lawn. That's
why Spencer's five beats exist on the phone, and it's why beat 5 arriving **before** the price is
the single thing separating his 48% program mix from Muhammad's 22%.

The field has never had that argument in a usable form. This gives every tech the same five beats
the phone team uses, in the one channel a tech can actually work between stops.

## The mechanic that makes it fit in a text

**One beat per message.** All five beats in one text is a lecture from your mole guy, and nobody
reads it. So each message carries exactly one beat plus the close, and the prompt tracks which beats
that customer has already had.

A One-Month series is about five weekly visits. Across the month the customer receives the entire
education in pieces — each piece landing right after someone was physically in their yard, which is
the only time they actually read it:

| | Beat | What it does |
|---|---|---|
| Visit 1 | Food or dinner bell | You didn't get unlucky; here's what they're after |
| Visit 2 | Net or new hills | The thing in your yard, explained |
| First catch | **Territorial** | The close — plus the $150 credit |
| Mid-series | Whatever the evidence fits | Teach, close again |
| Last visit | **Territorial**, full weight | Decision point, not an exit |

By the last visit the customer isn't hearing an argument for the first time — they're agreeing with
something they've been shown all month. Beat 5 can repeat, because beat 5 is the close. Beats 1–4
never repeat to the same person.

Visit 1 is the only message allowed not to close; its job is to get a reply and open the thread.
Everything after it asks.

## Naming

It is the **Total Mole Control Program**, by name, in every message. Never "the year-round plan,"
never "the monthly plan," never "the subscription," and never the letters TMCP to a customer. The
name does work that a description doesn't — it sounds like a system, because it is one. That's a
hard rule with its own line in the pre-send checklist.

---

## Why this is worth rolling to everyone

From `2026-08-18_quickfix-to-tmcp-field-upsell.md` — every matured One-Month series since January:

| Tech | Series worked | Upgraded | Rate |
|---|---:|---:|---:|
| Tavis Alexander | 59 | 17 | **29%** |
| Spencer Hill | 49 | 12 | 24% |
| Cory Ventura | 81 | 18 | 22% |
| Brayden Rich | 32 | 7 | 22% |
| Cammeron Anderson | 53 | 11 | 21% |
| Luke LaVergne | 75 | 14 | 19% |
| Robert Norton | 11 | 2 | 18% |
| Alias Franks | 13 | 2 | 15% |
| **Company** | **192** | **41** | **21%** |

Six of eight sit between 18% and 24%. A band that tight is the signature of a book upgrading *on its
own* — selling is a skill and skill varies, so a flat board means almost nobody is really selling
it. **That makes 21% a floor produced by doing nothing deliberate, not a ceiling produced by trying
hard.** Tavis at 29% is the only evidence that working it moves the number, and he's one tech.

The timing says the same thing: median lag from One-Month to upgrade is **38 days** against a 35-day
series, and only **41%** of upgrades happen while the tech is still on the property. The typical
upgrade isn't a field sale at all — it's an inbound call weeks later because the moles came back.
That's the weakest version of this sale. The strongest one is a tech in the yard holding the mole,
in front of someone who has already paid us.

**~560 One-Month jobs a year. Every point of upgrade rate is ~5.6 more program customers at ~$1,150
incremental value. 21% → 30% is on the order of $55–60k a year** — more than anything available on
the phone side.

---

## What's in the prompt

**Straight line, four moves:** Evidence → Teaching → Recommendation → Close. Spencer's phone close
compressed to SMS: never asks for a decision, states what he'd do, shrinks what's left to one word.

**Hard rules it won't break:** every message closes (except visit 1); **one option, never two** —
both prices side by side has produced the annual zero times out of nine on the phone side, so the
prompt refuses to write a menu; teaching always before the number; under 70 words; plain text; no
unconfirmed days; no invented findings; no invented discounts; no legality or I-713; no "hauled
away"; and **never the same text to two customers**, because half this book is neighbors.

**Full objection bank** — too expensive (the $1,800-vs-$1,200 argument, once), the 12-month term
answered straight rather than dodged, "I'll just call you when they come back," spouse, "let me see
if this month works," "I've only got one mole," and **"can't you just do another month?"** — which
he can sell but shouldn't, and the prompt points him back at the program. Only the discount ask is
routed away from him: any price off the sheet is your call.

**Six moments**, including the two that get skipped — the last visit as a decision point rather than
a silent exit, and the no-catch month, which becomes an honest sale instead of a wasted send.

**Back-book mode:** paste a list of old One-Month customers, get one message each, built on what
that specific yard had, with the beat varied across the list.

---

## Rolling it out

**Start with two techs, not eight.** Tavis at 29% and one of the 18–22% group — Luke or Robert. If
it works it should show up as a bigger jump on the lower rate than on Tavis's, because Tavis is
already doing some of this from instinct. Six weeks, then re-run `scripts/quickfix-to-tmcp.mjs` and
compare each man to his own prior rate with the rest of the board as the control.

**Two things the number won't tell you**, so ask directly at week one:
- **Are they pressing send?** The failure mode isn't a bad message, it's a good message sitting in
  the chat while he drives to the next stop.
- **Where do replies land?** A yes is only worth something if it gets processed the same day. Which
  number each tech texts from, and whether a yes reaches whoever raises the quote, decides whether
  this works at all.

**The one thing I still need from you:** whether a tech can raise the Total Mole Control Program
quote himself in Jobber, or whether it has to go through the office. The prompt currently asks each
tech to supply his own mechanism during setup, which is a workaround — if there's one right answer,
tell me and I'll write it into the close. It matters, because "I'll get it set up before your next
visit" only holds up if the switch really moves that fast. A yes sitting for four days is how these
die.

---

*Got Moles · rebuilt 2026-09-10 · field counterpart to `2026-09-01_the-order-card.md` — same five
beats, same one-option rule, different channel.*
