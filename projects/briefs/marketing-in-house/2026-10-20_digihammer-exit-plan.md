# DigiHammer Exit Plan — social, video, email in-house

**Date:** 2026-10-20 · **Owner:** Spencer (Marketing seat, drafted by `mkt-cmo`)
**Status:** DRAFT — awaiting Spencer's answers to Step 1
**Supersedes nothing.** Executes Phases 0–5 of `brief.md`, which have not started since 2026-08-26.
Working checklist: `2026-08-26_digihammer-audit.md`.

## The order, and why it matters

1. Take ownership of everything first, quietly.
2. Get our own content and email running alongside Sean's.
3. Cut once ours is shipping on schedule.

Three assets are lost for good if the exit goes badly: the **unsubscribe record**, the **email
sending domain's reputation**, and the **Meta pixel's audiences**. None of them gets mentioned
to Sean until they are secured.

---

## Step 1 — Spencer, 10 minutes (this week)

| # | Question | Why |
|---|---|---|
| 1 | What do you pay Sean per month, and is ad spend inside that or billed separately? | Sets the savings and the budget we inherit |
| 2 | Is there a contract? Notice period, renewal date? | Decides the cut date |
| 3 | Your HighLevel login — is it your own user, and is the sub-account under his agency? | Decides whether we keep HighLevel or migrate |
| 4 | Are you admin on the Facebook Page, Instagram and Meta Business Manager, or does he hold them? | Ownership check |
| 5 | Is anything he does worth keeping? | The honest answer may be "none of it" — fine |

## Step 2 — Ownership sweep (this week, Claude, read-only)

Using `tool-browser` on the logged-in Chrome profile. Nothing is changed or removed without your yes.

- **HighLevel:** contact count, sources, unsubscribe/DND status, what the last 12 newsletters said
  and what they got (delivered, clicks, unsubscribes), which domain sends, whose agency owns the
  sub-account.
- **Export, then verify:** full contact list with every field and opt-out status. Saved to a
  gitignored folder and checked that it opens. This is the item that matters most.
- **Sending domain:** which domain the newsletter goes out on and who controls its DNS
  (SPF/DKIM/DMARC). If it's a subdomain of got-moles.com, we control it through Cloudflare. If
  it's his domain, the reputation stays with him and we start fresh.
- **Meta:** who owns the Business Manager, ad account, pixel, Page, Instagram. Monthly ad spend for
  12 months and the live creative.
- **Leftovers:** creative files, tracking numbers, any domains he registered for us.

Result: the B-table in the audit doc filled in, and new findings added to `open-findings.md`.

## Step 3 — Reclaim (week 2)

One written request to Sean, framed as routine admin: owner access on Meta, independent HighLevel
login, a full contact export with opt-out dates, 12 months of ad spend and send stats, creative
source files. I draft it; you send it. No mention of ending the retainer.

## Step 4 — Email in-house (weeks 2–4)

**Platform choice after Step 2:**
- Sub-account transferable to you → keep HighLevel on your own plan. Least disruption, same list.
- Not transferable → move to a simpler sender. Import **with the unsubscribes suppressed before
  the first send**, warm the domain on engaged contacts first.

**What we send:**
| Send | Audience | Job |
|---|---|---|
| Quick Fix → TMCP offer, 3 emails | 357 repeat Quick Fix customers with a job in the last 24 months (`KNOWN` 08-06, re-pull before send) | Turn one-off buyers into monthly subscribers. Biggest return available |
| Monthly newsletter | Whole opted-in list minus active collections | One seasonal tip, one local photo/story, one offer. Short |
| Winback | 84 ex-program customers | Spring restart before mole season |

Every send: you approve the exact copy and the exact segment, test send to your phone, then go.
Nothing is ever scheduled by a cron.

## Step 5 — Social and video in-house (start now, in parallel)

Social doesn't depend on Sean's accounts, as long as you're admin on the Page and Instagram.

**The machine:**
1. **Shoot.** You and the techs film 20–60 second vertical clips on your phones in the field. No
   editing, no script needed.
2. **Drop.** Upload to the Studio Drive Inbox (`31_Studio` — the `00-video-studio` skill already
   exists).
3. **Cut.** Claude picks the best part, frames it 9:16, adds captions, writes the post text, and
   puts it in Review.
4. **Approve.** You watch it and say yes or no.
5. **Post.** Facebook Reels, Instagram Reels, YouTube Shorts (TikTok optional). Posting goes
   through Zernio, which needs `ZERNIO_API_KEY` (not set up on this install yet). Until it is,
   you post the approved files by hand.

**Target:** 3 videos a week. Each tech films 1 clip a week, you film 1–2.

**What to film** (local, seasonal, real, which is everything Sean's AI posts aren't):
- "Here's what fresh mole activity looks like vs. old mounds" (a yard walk)
- Before/after lawns from Total Mole Control customers
- Quick myth-busters: castor oil, grubs, sonic stakes, gum
- Seasonal: "why moles blow up in fall in Western Washington"
- A tech's day: the truck, the route, the customer handshake
- You answering the top 10 phone questions on camera (the CallRail FAQ is already written)

**Rules on camera:** lead with "chemical-free and safe mole control". Explaining the method is fine
when someone asks how it works. No dead moles, no kill/trap close-ups, no I-713 claims, no
"WA's #1". Review count: "283+ five-star reviews", re-checked before it's used. Get the
customer's OK before showing their house or address.

## Step 6 — Parallel run, then cut

- **Split:** Sean keeps the newsletter until ours ships; our social starts now. We don't send two
  newsletters in the same month.
- **Cut criterion:** two in-house newsletters shipped on time **and** 6 straight weeks at 3
  videos/week. Then give notice.
- **Cut checklist:** contract notice → confirm every export opens → written notice, professional,
  no grievances → remove his access only after the final invoice clears and nothing runs through
  his logins → watch for 2 weeks that email, forms and ads still work.
- **Meta ads:** if he runs paid ads, pause rather than cancel at the cut, and rebuild in-house
  later behind the launch gate. Paid ads can't be judged anyway until lead-source tracking (F-01)
  is fixed.

## Timeline

| Week of | What happens |
|---|---|
| Oct 20 | Step 1 answers, Step 2 ownership sweep + list export, first field clips filmed |
| Oct 27 | Reclaim request sent; first 3 videos posted; email platform decided |
| Nov 3 | Quick Fix → TMCP sequence drafted for approval; November newsletter is ours if ready |
| Nov–Dec | Parallel run; Zernio connected; 3 videos/week |
| Early Jan | Cut criterion checked → notice to Sean |

Nov–May is the slow season, so this is the right time to build. The pipeline should be running
before spring activity starts.

## Who does what

| You | Claude |
|---|---|
| Answer Step 1, approve every send and post, send the reclaim email, film 1–2 clips/week, get techs filming | Ownership sweep, exports, all copy and post text, video cuts, list segments, the scoreboard, the cut checklist |
