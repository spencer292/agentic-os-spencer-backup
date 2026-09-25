# Google review replies — posted

**Date:** 2026-09-14
**Account:** spencer@got-moles.com (Business Profile Manager, **authuser=0** — moved from 2, see run notes)
**Profiles:** 3 (Seattle/SeaTac, Tacoma, Enumclaw)
**Unreplied backlog:** 5 (all 5-star)
**Status:** POSTED — all 5 verified live by a fresh re-pull and by reading the owner-reply text back off each card; 0 unreplied in the newest 60 reviews

---

## Seattle / SeaTac — 4 replies

### 1. Jenna Elberts — 5★ · today

> They got our moles! Also, very helpful and always showed up when they said they would, provided updates along the way.

**Reply:** Jenna, thank you. Half of this job is the trapping and the other half is just doing what we said we'd do - showing up on the day and telling you what we found. Glad both of those landed for you.

### 2. Martha Dawson — 5★ · today

> We hired Got Moles to address a major mole issue in our 114 home community. The service is top notch and the results are impressive. And the pricing is very fair. Highly recommend their service.

**Reply:** Martha, 114 homes is a completely different problem than a single yard - the moles just move between properties, so covering the whole community at once is the only thing that actually works. Glad the results are showing and that the pricing made sense for the group. Thank you for trusting us with something that size.

### 3. Frank Ciaramello — 5★ · today

> Spencer and team were really great to work with, and they efficiently handled our mole invasion. I would highly recommend.

**Reply:** Thank you, Frank - good working with you as well. When several move in at once it usually means the soil is holding a lot of worms: great for the lawn, unfortunately popular with the moles. Getting on them quickly is what stops the runs from spreading. Glad it's handled.

### 4. David Alexander — 5★ · today (rating only, no text)

**Reply:** Thanks for the 5 stars, David. Appreciate it.

## Tacoma — 1 reply

### 5. Samantha Sieverling — 5★ · today

> Great Service, from great folks. I live out on a prairie, so it's a constant service for me, the moles get "taken care of" and a month or two later, they are right back because of the area I live in. I signed up for a whole years service and they are consistently pulling moles, so glad that they have the yearly option. The gentlemen that come to do the service are friendly and helpful and understand the situation and do the right things. Thank you Got Moles!

**Reply:** Samantha, out on a prairie there's no such thing as a permanent clear-out - open ground on every side keeps feeding them right back in. That's exactly what the year-round program is built for: we're not chasing one mole, we're holding the line so they never get established again. And I'll make sure the guys hear the kind words - thank you.

---

## Worth acting on

- **Martha Dawson is the strongest public commercial/HOA proof we have.** A named 114-home community saying the results are impressive *and* the pricing is fair, unprompted, on Google. That belongs in the LinkedIn corporate campaign (`mkt-linkedin-nurture`), on any HOA/commercial page, and in the commercial bid packet. It is a review, so it can be quoted verbatim with attribution.
- **Samantha names the year-round option as the reason it works** — that is the TMCP pitch in a customer's own words, useful for the TMCP conversion work.
- Four of the five arrived inside four hours, which looks like a review request going out in a batch rather than organic drift. If that was deliberate, it worked; worth knowing which lever pulled it.

## Run notes

- **The authuser index moved.** `authuser=2` (the September index for spencer@got-moles.com) now renders "You have no reviews for this location group"; the profiles are at **`authuser=0`**. Chrome renumbers signed-in accounts, so the index belongs to the browser profile, not the account — probe `/u/0..3/reviews` and confirm the identity from the account aria-label before assuming anything is wrong with the listings.
- **Both halves of the run are now saved scripts** instead of scratchpad code rebuilt each time:
  - `node scripts/gbp-pull-review-feed.mjs --pages 6` → writes `<date>_review-feed.json` with an `unreplied` flag per card
  - `node scripts/gbp-post-review-replies.mjs --file replies.json [--dry]` → posts, reading the textarea back and refusing to submit on a mismatch
- 60 reviews pulled, back 6 weeks. Everything older than 1 week was already answered — the 2026-09-10 run held.
- **The false-negative trap fired again, and it is now timed.** The poster reported all 5 as `still-reply`. An immediate re-pull showed 4 of 5 live; 75 seconds later all 5 were live. Propagation is roughly a minute. Never retry on the poster's verdict, and don't trust a re-pull taken seconds after either.
