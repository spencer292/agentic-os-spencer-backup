# Service Day — What to Say, What to Book

Companion to the FAQ training guide. Covers the question that guide doesn't: **"what day will you be here?"**

Open the lookup before your first call of the day and leave it open:

**https://claude.ai/code/artifact/20e073bc-db4d-4f9c-b49e-9adc55725fba**

**Type the address.** If they're already on our books you get their real next visit date; if they're
not, you get the route day for their zip. It's rebuilt every morning at 6:45.

`address-day-lookup.html` is the same tool as a file, for when you have no internet. It goes stale
the moment it's saved, so use the link unless you have to.

`service-day-lookup.html` is the older zip-only version. Keep it as a backup — it's the same route
days without the customer records — but the address one is what you should have open on a call.

---

## The one rule that makes all of this work

**Get the street address before you quote a day.** Not the city. Ask for it in the first thirty
seconds — you need it to book anyway.

The address does two jobs at once: it tells you whether they're already a customer (which changes
the whole call), and it carries the zip, which is what actually resolves to a route day.

City names mostly don't resolve to a route day. Tacoma spans 13 zips across three days, Olympia 7 across
two, Puyallup 6 across three, Renton 5, Bellevue 4, Kent 4. **16 of the 78 cities we serve are split this
way** — and they're the busy ones. If you answer "Bellevue? That's Monday," you'll be wrong most of the time.

Some cities are safe — Seattle is 21 zips but every one of them is Tuesday. The lookup knows which is
which: type a city and it either gives you a day or tells you to ask for the zip. Trust it over memory.

Type it the way they say it — "15706 SE 376th" finds "15706 Southeast 376th Street". The house
number alone is usually enough to bring them up.

**Read the address back.** We have lost callers over a mis-heard house number — one heard "3302 Bond
Road" confirmed back when the caller had said "302," and they hung up angry.

---

## The four calls

### 1. New customer, zip is in the grid

> "We run that area on **Wednesdays**. Once you're set up, your visits land on that day so we're already
> in the neighborhood — that's how we keep the price where it is."

Then the timing question, which is different (below). Do **not** name the technician — assignments move
week to week, and a promised name that doesn't show up is a complaint.

### 2. Caller names a city, not a zip

The lookup will tell you when a city is split. Don't guess:

> "Let me grab your zip code so I give you the right day — Puyallup splits across a couple of our routes."

### 3. Zip is not in the grid

Never say yes, and never say no.

> "Let me confirm coverage for that address and call you right back today."

Take the full address and phone, then flag it to Spencer. Some of these are real (we cover 125 zips and
the website lists more cities than that), and some are genuinely out of area. Guessing either direction
costs us.

### 4. Existing customer: "when are you next coming?"

Type their **house number and street** into the address lookup. If we have them, you get the day a
truck is actually routed to their house — not the area day — plus the visits after it:

> "You're on the schedule for **Thursday the 6th**. You'll get an email the day before and a text
> the morning of."

This is the call we handled worst — a missed appointment with no text generated two angry calls from
the same customer in one morning. The date is now on your screen, so give it.

**The big date at the top is the routed day.** Two systems hold a date for every visit: Jobber has
what was booked, OptimoRoute has where the trucks are actually going this week. The lookup shows you
OptimoRoute's answer whenever the routes are planned, because that's the day someone turns up. Give
that date.

Four things the card can tell you, and what each one means:

| What you see | What to do |
|---|---|
| **Confirmed on the planned route** | Both systems agree, a truck is assigned. Give the date, no caveats. |
| **The two systems disagree** (red) | Jobber says one date, the truck is routed to another. Give the **routed** date on the card — that's when someone comes. Then tell Spencer, because the customer got their email and text off the Jobber date and is expecting the wrong day. |
| **Not on the planned route for that day** (red) | The date is in Jobber but no truck is going. **Do not confirm the date.** Say you'll double-check the schedule and call back today, then flag it to Spencer. |
| **No visit currently scheduled** (amber) | They're on file but nothing is booked. Book on the zip's route day shown right under it. |
| **This one falls on a [day], but the zip normally runs [day]s** (amber) | Give them the date on the card — it's what's scheduled. Flag the mismatch to Spencer afterwards. |

If it says "routes for that week are not planned yet," that's normal for anything past this Friday.
The date is the booked one and it's fine to give.

If nothing comes up for the address, they're not on file. That's a new customer — you'll get the
zip's route day instead, which is the right answer for them.

Two names, one address? You'll only ever see one card. We hold duplicate records for about 80
addresses and the lookup merges them for you.

On timing within the day, the existing answer still stands (FAQ question #4): never promise an exact time.
Quote is approved → route is optimized → they get an email the day before, a text the morning of, and a
text when the tech is en route.

---

## Booking rules — now that you can write to Jobber

> **Scoped 2026-08-05:** these rules apply to **customers already on the books** — next
> visit, reschedules, on file with nothing booked. That is still your job and nothing here
> has changed.
>
> **Brand-new customers are now Cory's.** When a new customer's quote is approved, tag the
> client `Schedule requested` and hand it to Cory — don't book the first visit yourself.
> See `2026-08-05_muhammad-jobber-training.md` for the client-and-quote process that runs
> ahead of that handoff.

You have write access. That means a mistake here doesn't just misinform a customer, it drags a truck
across the map. Four rules.

**1. Book service visits on that zip's route day.**
The route system automatically pulls flexible visits onto the zip's day. If you book one somewhere else,
it gets moved and the customer hears a different day than the one you promised.

**2. Setups are the exception — and they're pinned.**
A first-visit setup stays exactly where you put it. It does *not* get pulled onto the route day. So if you
book a setup for Tuesday in a Friday zip, a truck leaves its territory to service one property.

Book setups on the zip's route day by default. If someone needs it sooner than that, that's fine — say
"I can get you on the schedule this week" and check with Spencer before committing to an off-route day.
Don't promise a specific date on the call and then find out it doesn't work.

**3. New activity between visits → ADD a visit, never move the existing one.**
Customer calls with fresh mounds? Add an interim visit on the zip's route day. Do not drag their recurring
visit forward. Moving it just relocates the gap — the customer gets seen sooner now and then waits seven
weeks for the next one.

How soon the interim visit goes:

| What the last visit found | Next visit |
|---|---|
| **Caught anything at all** | ~1 week — a catch overrides everything below |
| Moderate activity (M/A) | this week |
| Light activity (L/A) | next week or the week after |
| No activity (N/A) | ~2 weeks out |

**4. Don't touch anything with a narrow time window on it.** Those are committed appointments the customer
has already been told about.

---

## Pricing recap (so you're not flipping documents mid-call)

Residential, phone-quotable:

| Property | Quick Fix | Total Mole Control |
|---|---|---|
| Up to 1 acre | $450 | $100/mo |
| 1–3 acres | $500 | $125/mo |
| 3–5 acres | $600 | $150/mo |

$150 setup fee and the no-catch guarantee apply at every size.

**Never quote by phone:** commercial of any size, or residential over 5 acres. Those need an in-person bid
— that's Cory. Always capture property type and rough acreage at intake so you know which lane you're in.

---

## When the lookup is stale

Both files carry their build time in the footer. **The address lookup is a snapshot, not a live
window into Jobber** — it is rebuilt every morning at 6:45, so a visit booked at 10am won't be in
your copy until tomorrow.

- **Footer says today?** Trust it.
- **Footer says yesterday or older?** Route days change when the territory is re-cut, and it has
  been re-cut three times in two weeks — the four-truck split (Alias north, Cory South King,
  Cammeron and Luke splitting the south) only went live this week. Get a fresh copy before quoting.
- **You just booked something yourself?** You already know the date — don't go looking for it in the
  lookup and get confused when it isn't there yet.

The footer also says how far ahead routes are planned (usually the end of the current week). Past
that date the lookup can still give you the booked date, it just can't confirm a truck is routed to
it yet. That's normal, not a problem.
