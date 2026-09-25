# Google review replies — posted

**Date:** 2026-09-15
**Account:** spencer@got-moles.com (Business Profile Manager, authuser=0 — unchanged from 09-14)
**Profiles:** 3 (Seattle/SeaTac, Tacoma, Enumclaw)
**Pulled:** 40 reviews, back 4 weeks
**Unreplied backlog:** 3
**Status:** POSTED — all 3 verified live by a fresh re-pull (`replied=true`, card now shows Edit/Delete)

---

## Seattle / SeaTac — 2 replies

### 1. Amy B - Tiny Habits Coach — 5★ · 11 mins ago

> We've been using Got Moles? for about 6 weeks and have not had so few new mole hills pop up. Whatever magic these guys are doing, it works!!!

**Reply:** Amy, no magic unfortunately - just traps set in the active runs and coming back often enough that nothing gets re-established. Six weeks is usually right about where it goes quiet, and from here most of what we catch is new ones wandering in from the neighbors. Glad it's working.

### 2. Joyce Moen — 4★ · 13 hours ago (rating only, no text)

**Reply:** Joyce, thank you for the rating. If there's something that would have made it a five, I'd genuinely like to hear it - call the office at 253-750-0211 and ask for Spencer. Either way, thanks for having us out.

## Tacoma — 1 reply

### 3. Chad — 5★ · 16 hours ago

> Great Service- used them a few times over the years and they get the job done!

**Reply:** Thanks Chad. Moles turning up again a few years later isn't the last job failing - it's good ground that keeps pulling new ones in from around you. Happy to keep coming back whenever they do, and appreciate you calling us each time.

---

## Worth acting on

- **Joyce Moen is the only non-5★ in the last four weeks** and she left no text, so there is nothing public to diagnose from. The reply invites her to call. Open follow-up: pull her Jobber history to see which tech ran the last visit and whether anything on the account explains it. Not done this session.
- **Chad is multi-year repeat proof** ("used them a few times over the years"). Useful for the TMCP conversion pitch — a customer who keeps coming back is the argument for buying the year-round program instead of re-buying Quick Fix.
- Review velocity looks normal: 3 new in ~24 h, nothing older than a week unanswered. The 09-14 run held.

## Run notes

- `authuser=0` still correct — no index drift since 09-14.
- Both scripts ran clean on their second outing: `gbp-pull-review-feed.mjs --pages 4` then `gbp-post-review-replies.mjs --file replies.json`.
- **The false-negative trap fired again, third run running.** The poster reported all 3 as `still-reply`; a re-pull 95 s later showed all 3 `replied=true`. Propagation is consistently around a minute. The poster's own verdict is still not ground truth.
- Gap found: the pull script's card extractor does not capture the **owner reply text**, so a text-level read-back after posting has to be done by hand. Adding an `ownerReply` field to `EXTRACT` would make verification a one-liner.
