---
name: mkt-linkedin-nurture
description: >
  Run Spencer's twice-weekly supervised LinkedIn outreach session for Got Moles corporate
  services — find commercial prospects (property management, HOA, golf, schools, municipal,
  hospitality, landscaping partners), check each one against every channel we've already
  talked to them on, research them properly, draft a message written for that specific
  person, get Spencer's approval, send at human pace, and track the whole pipeline between
  sessions. Use this skill whenever Spencer mentions LinkedIn outreach, a LinkedIn session,
  connection requests, prospecting or nurturing on LinkedIn, corporate/commercial lead
  generation, property managers or HOA managers or superintendents as prospects, "who should
  I connect with", "let's do the LinkedIn thing", "run the campaign", or asks who replied /
  who's gone quiet / who's due a follow-up. Also use it when he asks to add a new target
  profile or segment to the campaign. Does NOT trigger for posting content or writing
  LinkedIn posts (00-social-content, mkt-social-showing), for scraping a public profile
  with no outreach intent (tool-linkedin-scraper), or for residential homeowner leads
  (those come through CallRail and Jobber, not LinkedIn).
---

# LinkedIn Nurture — Got Moles Corporate

A supervised, twice-weekly outreach session. Claude does the finding, the checking, the
research and the drafting. Spencer reads, edits and approves. Sending happens at human pace
with him watching. Nothing goes out unapproved, and nothing runs in the background.

The reason it's built this way: this runs on Spencer's real LinkedIn account, which carries
his name and the company's reputation. A restricted account costs more than any single week
of outreach earns. Slow and personal beats fast and templated here — and the people we're
targeting are exactly the audience that recognises a mail-merge on sight.

## Outcome

Every session produces:

- `projects/mkt-linkedin-nurture/pipeline.json` — the living state of every prospect (updated, never replaced)
- `projects/mkt-linkedin-nurture/{YYYY-MM-DD}_session-{N}.md` — what was found, what was sent, what came back, what's queued next

Always save both to disk. This is not optional — Claude wakes up with no memory of the last
session, so anything not written down is lost, and a lost pipeline means re-approaching
people who already said no. After saving, show Spencer the full absolute file path.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `projects/mkt-linkedin-nurture/pipeline.json` | full | Who we know, what stage they're at — read before anything else |
| `references/target-profiles.md` | full | The seven buyer profiles, search strings, qualifying signals, disqualifiers |
| `references/message-patterns.md` | full | Message shapes, voice rules, proof stack, claims that are banned |
| `references/current-benchmarks.md` | full | Live-researched 2026 limits, acceptance/reply data, cadence — re-research quarterly |
| `references/account-safety.md` | full | Volume limits, pacing, what needs confirmation |
| `references/session-runbook.md` | as needed | Browser mechanics and the extraction technique that works |
| `brand_context/icp.md` | Segment 2 + Messaging Rules | Commercial buyer psychology and the messaging rules |
| `brand_context/voice-profile.md` | tone only | So the messages sound like Spencer, not like a vendor |
| `brand_context/positioning.md` | summary | The specialist angle the whole pitch rests on |
| `context/learnings.md` | `## mkt-linkedin-nurture` only | What landed and what flopped in previous sessions |
| `assets/example-messages.md` | full | The quality bar — read before drafting anything |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-browser` | Yes | The logged-in Chrome session that drives LinkedIn | No campaign — everything here runs through it |
| `tool-jobber` | Recommended | Checks whether a prospect is already a customer | Risk of pitching an existing client |
| `tool-humanizer` | Yes | Strips AI tells from drafts before Spencer reads them | Messages read like a template, which is fatal with this audience |
| `mkt-icp` | No | Built the commercial segment this targets | Use `references/target-profiles.md` alone |

## Skill Relationships

**Upstream:** `mkt-icp` (Segment 2), `mkt-brand-voice`, `mkt-positioning` — this skill consumes their output.
**Downstream:** `00-social-content` / `mkt-social-showing` — when a prospect segment keeps raising the same objection, that's a content brief. Hand it over.
**Trigger conflicts:** `tool-linkedin-scraper` covers pulling a public profile with no outreach intent; `00-social-content` covers posting. If the request is "find and contact people", this skill wins.

## Before You Start

Three gates, every session. They take two minutes and they prevent the failures that matter.

1. **Read `pipeline.json` first.** If it doesn't exist yet, this is session one — create it from the schema in `references/session-runbook.md`, and seed it with the July 2026 research in `projects/tool-browser/` (20 researched prospects, 14 drafted messages, none contacted). Don't re-do work that's already sitting there.
2. **Confirm the browser is live and logged in.** Launch it, load LinkedIn, confirm Spencer's session is still valid. If he's been logged out, stop and tell him — don't try to log in on his behalf.
3. **Check the real invite limits on his account, don't assume them.** LinkedIn changes these and they vary by account. Open the invitation manager, read what's actually available this week, and tell Spencer the real number before planning volume. Read `references/account-safety.md` for what to look for.

## Step 1: Agree the session's target

Ask Spencer which profile we're working today, or propose one from `references/target-profiles.md`
based on what the pipeline shows — usually the segment with the thinnest coverage or the best
reply rate so far. One or two profiles per session, not seven. A session that goes deep on
HOA managers beats one that skims everybody.

If he names a new kind of buyer that isn't in `references/target-profiles.md`, build the profile
with him now and add it to that file before searching. The profile is what makes the messages
specific; searching without one produces a list nobody can write to.

## Step 2: Find the prospects

Run the LinkedIn people searches for the chosen profile using the search strings in
`references/target-profiles.md`. The extraction technique that actually works is in
`references/session-runbook.md` — anchor-map collection, not list-item scraping.

Pull 20–30 raw results. Capture for each: name, headline, company, location, connection degree,
and mutual connections. Mutual connections matter more than anything else on the row — a shared
first-degree connection is the difference between a warm approach and a cold one.

**Which surface to search on.** Extraction happens on **standard LinkedIn people search**, never
on Sales Navigator — Sales Nav runs active anti-scraping instrumentation and its terms prohibit
exporting. Sales Navigator is read visually, for its filters and signals. The full split and the
reasoning are in `references/session-runbook.md`; treat it as settled rather than re-deciding it
each session.

**Spend searches carefully.** A free account gets roughly 300 profile searches a month, and
exceeding it throttles results to three per query until the 1st — which would stop a session
dead, with no warning beforehand. This is why the extraction technique reads everything needed
for ranking off the search results page: one search yields 25 rows, and only the prospects that
survive Step 3 get their profile opened. Don't browse company People tabs or the "more profiles
for you" rail — both burn the same budget for far less information. Log roughly how many
searches a session used, so the monthly total stays visible.

## Step 3: Check whether we've already talked to them

This is the step that protects Spencer from looking careless, so do it properly rather than
skimming it. For every prospect, check all four:

- **`pipeline.json`** — have we found, contacted, or been rejected by this person before?
- **LinkedIn itself** — connection degree, any existing message thread, any pending invite
- **Gmail** — search their name, their company, and their email domain
- **Jobber** — are they, or their company, already a customer? Pitching an existing client as a
  cold prospect is the worst outcome available here

Drop anyone who fails the check into `pipeline.json` with the reason, so a future session doesn't
surface them again. Then tell Spencer plainly what got filtered and why — "four dropped, one is
already a TMCP customer" is useful information about the market, not just admin.

Be honest about the limit of this check: it can't see calls Spencer took, conversations at a
trade event, or anything that happened off these four channels. Say so rather than implying the
filter is complete.

## Step 4: Research each survivor

Open each profile and read it — the About, the work history, certifications, and especially
recent posts and activity. You're looking for one true, specific thing that justifies this
message going to this person.

Good hooks, roughly in order of strength: a recent post of theirs you can respond to; a shared
connection who's genuinely relevant; a recent role change or promotion; a certification that
signals portfolio scale (CMCA, AMS, PCAM in community management); something concrete about the
properties or grounds their organization runs.

**If there's no real hook, say so.** Some profiles are thin. When that happens the honest options
are to anchor on the company rather than the person, or to drop them from this batch. What you
must not do is manufacture flattery — "I was so impressed by your profile" is the exact tell that
marks a message as automated, and this audience reads dozens of them a week. Spencer has been
explicit that every message must be genuinely unique to the person; a fabricated compliment
violates that more than a blunt company-level hook does.

## Step 5: Warm them up before the invite

The strongest lever found in the 2026 research, and the one that fits our constraints best: a
genuine comment on a prospect's recent post, one or two days before the invite, is associated
with two to three times the reply rate. Some campaigns see prospects open the conversation
themselves before any outreach runs.

It also costs nothing we're short of. Engagement doesn't consume the note allowance, doesn't
count against the invite cap, and doesn't burn a message touch — which matters enormously on an
account with roughly five personalized notes a month. See `references/current-benchmarks.md`.

So the default sequence for a prospect who posts is: **comment first, invite second.** For a
prospect with no recent activity there's nothing to engage with, and the invite goes out cold.

Two conditions on this. The comment has to say something a person would actually want to read —
reciprocal or hollow engagement is detected and penalized, and a vacuous "Great post!" from a
business owner is worse than silence. And commenting is a write on Spencer's account, so it goes
in the approval batch like everything else.

## Step 6: Draft the messages

For each approved prospect, write:

- A **connection request** — with or without a note, decided per prospect (see below)
- A **first follow-up** — sent after they accept, not before
- A **nurture ladder** — what touches two through four look like if they go quiet

**Deciding note vs no note.** This is counterintuitive and the research is clear on it. A note
slightly *lowers* acceptance (24–29% against 28–38% bare) but materially *raises* reply rate once
accepted (22% against 14%). Combined with the ~5 notes/month allowance on a free account, the
allocation is:

- **Spend a note** on prospects with a genuine warm route — a named mutual connection — or a real anchor from something they posted. These are the rows where the note earns its scarcity.
- **Send bare** to everyone else, and put the full personalization into the first message after they accept, where there's no character limit and no acceptance penalty.

Never pitch inside the note. The data names it as the most reliable way to destroy an acceptance
rate, because it signals the request is just a wrapper for a sales sequence.

Notes are 300 characters, enforced on every tier. Count them.

Read `references/message-patterns.md` for the shapes and `assets/example-messages.md` for the
quality bar before writing a word. The commercial messaging rules from `brand_context/icp.md`
govern: lead with reliability and specialism, never with price or emotion; annual managed
contract, not call-out; written reporting; chemical-free; never quote residential pricing to a
commercial buyer.

Claims are constrained and the constraints are not negotiable — `references/message-patterns.md`
carries the full list. The short version: "283+ five-star reviews" and "nearly 5,000 properties"
are safe; "WA's #1" is unsubstantiated and banned; no I-713 compliance claims ever; "15+ years"
is Spencer's personal experience and must be phrased that way, because the company was founded
in 2017.

## Step 7: Humanize before Spencer reads them

Run the drafts through `tool-humanizer` in deep mode (`brand_context/voice-profile.md` exists, so
deep is available). This isn't ceremony — the failure mode for this campaign is a message that
smells generated, and the humanizer catches the patterns that cause it: hedging, tricolons,
inflated adjectives, em-dash overuse, corporate filler.

Only show Spencer the score if something moved materially. He wants the messages, not a report.

## Step 8: Approval gate — stop here

Present the batch to Spencer as a numbered list: prospect, why they qualify, the hook, the
connection note with its character count, and the follow-up. Then wait.

He kills the ones that don't land, edits what he wants, and approves the rest. Do not send
anything, to anyone, before he has said so for that specific batch. Approval of one batch is not
approval of the next one.

If he rejects several for the same reason, that reason is a rule — add it to `## Rules` in this
file before the session ends, not at wrap-up.

## Step 9: Send, at human pace, one at a time

Send only the approved messages, through the browser, one at a time, with a natural gap between
each. Confirm each send landed before moving to the next.

Stop immediately and tell Spencer if: LinkedIn shows a warning or a captcha, the invite limit is
reached, a profile no longer matches what we researched, or anything at all looks different from
the last session. An unexpected interface is a reason to pause and ask, not to guess and click.

## Step 10: Work the follow-up queue

The other half of every session, and the half that actually produces calls. From `pipeline.json`:

- **Accepted, not yet messaged** → send the drafted follow-up (same approval gate)
- **Replied** → draft a response, and if there's genuine interest, move toward a call
- **Quiet** → next rung on the ladder, on roughly a days 1 / 4 / 9 / 14 rhythm. The 2026 data
  is specific here and worth knowing: the *first* follow-up adds almost nothing on its own, while
  the *second* is where the measurable lift appears. That's the argument for working the ladder
  properly rather than sending one chaser and giving up.
- **Quiet after four touches** → stop messaging. Mark them dormant, keep them in the file, and
  switch to engagement-only nurture — commenting on their posts when they say something worth
  responding to. That can continue indefinitely without being intrusive, because it isn't
  unsolicited. Past four unanswered messages the reported cost is reputational, and in an
  industry this regionally small, that cost is real.
- **Wants a call** → book it. Note that in-person commercial and 5+ acre bids belong to Cory
  (Tavis when he's back) — Spencer takes the relationship call, not the bid.

## Step 11: Save state and log the session

Update `pipeline.json` with every change — new prospects, stage moves, sends, replies, rejections,
dormant marks. Write the session log to
`projects/mkt-linkedin-nurture/{YYYY-MM-DD}_session-{N}.md` covering what was searched, who was
filtered and why, what was sent, what came back, and what the next session should pick up.

Show Spencer both absolute paths. Then give him the one-line state of the pipeline: how many
active, how many awaiting reply, how many warm.

## Step 12: Ask how it landed

Ask what he'd change about the messages or the targeting. Log it to `context/learnings.md` under
`## mkt-linkedin-nurture` with the date. If a message he edited came out better than the draft,
save it to `assets/example-messages.md` — the quality bar should rise over time rather than sit
frozen at the July 2026 batch.

## Rules

- 2026-08-21: Nothing sends without Spencer's explicit approval of that specific batch. Approval never carries forward to the next batch or the next session.
- 2026-08-21: No background or scheduled sending, ever. This skill only runs when Spencer is at the keyboard. If he asks for automation, the answer is that the pipeline surfaces what's due — a human still clicks.
- 2026-08-21: Never manufacture a compliment or a fake reason for reaching out. If there's no real hook, anchor on the company or drop the prospect and say why.
- 2026-08-21: Claims guardrails — "283+ five-star reviews" and "nearly 5,000 properties" are safe. "WA's #1" is banned. No I-713 compliance claims. "15+ years" is Spencer's personal experience, not company age (founded 2017).
- 2026-08-21: Never quote residential pricing to a commercial prospect. Commercial is quoted after site inspection, on an annual contract.
- 2026-08-21: US English throughout — Got Moles is a US company.
- 2026-08-21: Stop at four unanswered touches over ~14 days (days 1/4/9/14). Mark dormant, then engagement-only. Revised from three on 2026-08-21 research: the second follow-up is where the response lift appears, so stopping at three leaves it on the table — but four is a hard ceiling, not a target.
- 2026-08-21: Notes are scarce (~5/month on a free account) and slightly *reduce* acceptance while raising reply rate. Spend them on warm routes and real anchors; send bare invites otherwise and personalize the first message after acceptance. Never pitch inside a note.
- 2026-08-21: Comment before inviting whenever the prospect has recent activity — 2-3x reply rates, and it costs nothing against any limit. Hollow engagement is worse than none.
- 2026-08-21: The campaign runs on a FREE account by design, not by default. Paying buys no extra invite volume (the ~100/week cap is identical on every tier) and the biggest lever — engagement before inviting — is free. Don't recommend an upgrade without one of the four triggers in `current-benchmarks.md` being true.
- 2026-08-21: NEVER run DOM extraction against Sales Navigator. It loads a PerimeterX bot-detection iframe (`li.protechts.net`, `uc=scraping`) that standard people search does not, and its terms prohibit exporting. Extract on standard LinkedIn search; read Sales Nav visually. The fields are addressable there — that is not permission.
- 2026-08-21: Sales Navigator's job is intelligence, not list-building: "Changed jobs" and "Posted on LinkedIn" filters, saved-search notifications, and richer per-prospect context. Narrow its Geography filter to Washington — it defaults to North America.
- 2026-08-21: Guard the ~300 searches/month commercial use limit. Rank off the search results page, open only survivors' profiles, never browse company People tabs or the "more profiles for you" rail, and log the session's search count. Hitting the cap throttles results to three per query until the 1st, with no warning.
- 2026-08-21: Re-research `references/current-benchmarks.md` quarterly, or whenever a live limit contradicts it. LinkedIn changes these without notice and the file is dated for that reason. Our own pipeline data outranks published benchmarks as soon as we have thirty-plus outcomes.
- 2026-08-21: In-person commercial and 5+ acre bids route to Cory, not Spencer. Spencer takes the relationship call.
- 2026-09-10: **Never draft a message that commits Got Moles staff, time, or free work.** Not a free property check, not "my techs will flag X for you", not a discount. Spencer killed two of these in one session (a striping/ADA flag offer to Nick Granberg, a free fall check for Adam Goodenow). If an offer like that would genuinely strengthen a message, raise it with Spencer as a SEPARATE decision before writing it in - a message costs nothing, an operational promise to a partner costs real money and an unkept one costs the relationship.
- 2026-09-09: **An archived Jobber job means the JOB ended, not that the RELATIONSHIP is dormant.** Never build a reactivation approach on job status alone. Spencer killed four warm names sourced this way in one line - "those warm leads are effectively dead and i am consistently working with brandon" - because he knows which relationships are live from calls and in-person contact that the four-channel check cannot see. Ask him before drafting anything premised on a client having gone quiet.
- 2026-09-09: **Spencer's 1st-degree network has been fully enumerated and worked. Do not re-run the warm-route sweep.** All 35 connections were checked against Jobber and the target profiles on 2026-09-09; results and the do-not-resurface list are in `pipeline.json` under `warm_route_sweep`. Nine are green-industry and every live one is already in motion. The warm well is dry - new prospects come from cold sourcing now.
- 2026-09-09: **`/mynetwork/invite-connect/connections/` renders only 10 rows and will not lazy-load** - programmatic scroll and a real CDP mouse-wheel both fail. To enumerate connections use people search filtered to 1st degree: `/search/results/people/?network=%5B%22F%22%5D`, which paginates normally and costs 1 search for the whole network.
- 2026-09-15: **The peninsula, the islands, and anything reached by ferry are OUT of the campaign.** Spencer: *"right now those are a little far for us."* Kitsap, Jefferson and Mason County clubs fail on drive time no matter how good the fit reads. Four named prospects are parked in `pipeline.json` under `excluded` - Shawn Vetterick (Port Ludlow), Erik Linsenmayer (Kingston), Michael Goldsberry (Bainbridge), Anton Diaz (Salish Cliffs). **Gig Harbor is IN** - Pierce County, reached by bridge, and Renee Geyer at Canterwood is a live invite; do not let the word "peninsula" sweep it out. Full boundary in `references/target-profiles.md` under Geography. When a prospect is borderline on distance, ask Spencer before researching them - the research is the expensive part.
- 2026-09-15: **ONE APPROACH PER FIRM, PER CLUB.** Never have two live approaches inside the same organization. Already applied to Natalie/Jari at The Management Trust; now also Sarah Teriele (held - same firm as Samantha Oldham at Trestle), Juliana Loken (held - same firm as Shannon Patterson at Associa-EMB), Mitchell Cook (skipped - assistant super at Overlake where Cory Brown is pending) and John Hicks (skipped - same club as Renee Geyer at Canterwood). Pick the stronger profile, send to them alone, and hold the rest until that outcome is known. In an industry this regionally small, two simultaneous pitches into one office reads as a mail-merge.
- 2026-09-15: **Search Jobber for the prospect street or neighborhood BEFORE drafting - it is the campaign most reliable active ingredient.** It produced the Oien conversion (two homes on Sahalee Drive West) and it anchored all four 09-15 golf notes: Sand Point CC is on 55th Ave NE and Got Moles has live clients on 56th and 58th; Tacoma C&GC is ringed by Interlaaken and American Ave; Gig Harbor 98332 covers Canterwood; Puyallup is 227 records. Where a street anchor does not exist, density or Spencer own locality substitutes. Do this before writing a word.
- 2026-09-15: **Do not name a mutual connection in a note until that person is actually a customer.** Oien and Gordon accepting turned the whole golf segment warm and both now appear as mutual connections in search - but neither has signed. LinkedIn surfaces the mutual on the invite by itself, so the warmth lands without being claimed, and nothing is borrowed that cannot be repaid. Revisit once one of them is on the books.
- 2026-09-15: **The LinkedIn inbox is ground truth, not `pipeline.json`. Read it FIRST, every session.** Spencer messages prospects himself between sessions, so the pipeline is always behind. On 2026-09-15 the file said Ryan Gordon was a pending invite; he had actually accepted on the 13th, been messaged by Spencer at 6:42 PM, and replied at 6:43 PM with "let's connect next week to set up a visit" — the hottest reply in the campaign, sitting unanswered for two days because the send was never logged. Session opening order is now: (1) sent-invitations page, (2) messaging inbox, (3) recent-connections list, THEN pipeline.json — and reconcile the file to what LinkedIn shows before planning anything.
- 2026-09-15: **Never infer a prospect's status from silence on the four channels — ask Spencer.** He had already spoken with Patrick Oien by phone and they were "working to make something happen," while the pipeline had him on a chase ladder due a nudge that day. Same shape as the 2026-09-09 archived-job rule: phone and in-person contact are invisible here, and a nudge premised on silence makes him look like he is not tracking his own conversations. Before sending any chase, confirm the prospect has actually gone quiet.
- 2026-09-15: **`/mynetwork/invite-connect/connections/` DOES render the full list sorted by Recently added** — the 10-row limit noted on 2026-09-09 applies to lazy-loading the whole network, not to reading recent accepts. For "who accepted since last session" this page is free, instant, and costs no search budget. Use it instead of spending a people search per name.
- 2026-08-21: Verify invite limits live at the start of each session rather than assuming a number — LinkedIn varies them by account and changes them without notice.

## Self-Update

If Spencer flags something wrong during a session — a message that missed, a segment that isn't
worth working, a hook type he keeps killing, a claim he doesn't want made — add it to `## Rules`
above immediately, in that session, with the date. Don't wait for wrap-up and don't only log it to
learnings. The point is that the same mistake can't survive to the next session, and since the
next session starts from a blank context, this file is the only thing that remembers.

## Troubleshooting

**Logged out of LinkedIn.** Stop and tell Spencer. Don't attempt to log in — that's his to do.

**Search returns nothing / the page looks different.** LinkedIn changes its DOM often. Fall back to
the screenshot route in `references/session-runbook.md` and read the results visually, then tell
Spencer the extraction technique needs updating.

**Invite limit hit mid-session.** Stop sending. Switch the remaining time to engagement — commenting
on prospects' posts costs nothing against the limit and warms the next approach. Queue the rest.

**A warning or captcha appears.** Stop everything and tell Spencer immediately. Do not click through.
This is the signal that matters most — account health outranks the campaign.

**`pipeline.json` is missing or corrupt.** Rebuild from the session logs in
`projects/mkt-linkedin-nurture/`, which are written precisely so this is recoverable. Tell Spencer
what was lost.
