---
name: mkt-whale-hunt
description: >
  Run the Great White Whale Hunt: Spencer's 10-week relationship program aimed at the 10
  commercial contacts who could grow Got Moles the most (portfolio property managers, golf
  operators, landscape partners, parks/sports venues, commercial real estate). Keeps a dossier
  per whale, drafts one useful touch per whale per week across rotating channels (LinkedIn,
  email, intro, card, drop-by, lunch ask), gets Spencer's approval, sends or schedules, and
  tracks every touch until the whale graduates (lunch held) or falls off at week 10. Use
  whenever Spencer says "whale hunt", "whales", "whale hour", "this week's whale touches",
  "who's on the whale list", "add a whale", "swap a whale", "update the dossier on X",
  "did X reply", "set up lunch with X", or asks how the top-10 relationships are going.
  Does NOT trigger for the high-volume LinkedIn invite campaign or segment messages
  (mkt-linkedin-nurture), paid campaigns or channel numbers (mkt-cmo), or residential leads.
---

# Whale Hunt

Ten people, one useful touch each per week, aiming for a lunch and then a friendship.
The deliverable is a relationship. A sale may follow later, mostly in spring.
Claude researches, drafts and tracks. Spencer approves every touch and does the lunches.

## Outcome

- **Tracker (source of truth):** the Whale Hunt app, https://claude.ai/artifact/AjQJM8aYF9YeixRFMcdLmA. It is a phone app on an artifact database, collection `whales`, one document per whale: track (hunt / maintain / bench), status, primary contact (email, phone, LinkedIn, birthday, socials, notes), others, gives, lunch angle, next_touch, touches[]. Read and write it with the `ArtifactData` tool. Spencer logs touches from his phone, so always read it before drafting.
- **Dossiers:** `projects/briefs/whale-hunt/dossiers/{slug}.md`, one per whale (template in `references/dossier-template.md`). Our Jobber footprint lives in `dossiers/_jobber-footprint.md`.
- **Weekly batch:** `projects/briefs/whale-hunt/{YYYY-MM-DD}_week-{N}-touches.md`: this week's 10 drafted touches, then the approval and send result for each.
- **Notion:** the weekly batch and a scoreboard are pushed to Notion for Spencer's review.
- **Plan of record:** `projects/briefs/whale-hunt/2026-10-21_whale-hunt-plan.md`.

## Context Needs

| File | Load level | Purpose |
|---|---|---|
| Whale Hunt app `whales` collection | Full | State: track, status, contacts, touch history (Spencer edits it on his phone) |
| `projects/briefs/whale-hunt/dossiers/{slug}.md` | Full, for each whale being touched | Person, org, history, gives |
| `references/touch-menu.md` | Full | Channels, the 10-week arc, and examples |
| `projects/mkt-linkedin-nurture/pipeline.json` | Search by name and company | Prior-contact check; whale firms are excluded from volume outreach |
| `C:\Users\spenc\.claude\projects\C--Agentic-os-got-moles\memory\spencer-dm-voice.md` | Full | Spencer's own DM register |
| `context/learnings.md` → `## mkt-whale-hunt` | Section | Past feedback |
| `brand_context/` | Not needed | DMs use Spencer's voice, not the brand voice |

## Skill Relationships

- **Shares people with:** `mkt-linkedin-nurture`. A firm on the whale list is flagged `whale: true` in `pipeline.json` and is skipped by volume batches, so each whale hears from only one source.
- **Uses:** `tool-browser` (LinkedIn reads and approved sends), the Gmail and Google Calendar connectors (drafts and reminders), `tool-jobber` (read-only footprint lookups), and Notion (review).
- **Reports to:** `mkt-cmo` (the commercial pipeline number).

## Step 1: Load state

Read every document in the app's `whales` collection (ArtifactData list), `references/touch-menu.md`, the DM-voice memory and this skill's learnings section. Compute the current week number from `program.start` (week 1 = week of 2026-10-26). Note any whale whose `status` changed since the last run.

## Step 2: Refresh the dossiers

For each active whale, check for anything new since the last touch:
- Replies in the LinkedIn inbox (`tool-browser`, read-only) and in Gmail (search by name and domain).
- Their recent LinkedIn posts, job changes and company news (web search).

Add new findings to the dossier with today's date. A job change stops the run. Flag it to Spencer: the relationship goes with the person, and the slot question is his to decide.

Delegate this sweep to a Sonnet subagent when running on an expensive model, and keep only the summary.

## Step 3: Draft this week's touches

One touch per whale. Pick the channel from the arc in `references/touch-menu.md`, and don't reuse last week's channel. Every touch has to be worth receiving with no pitch attached: a real comment, something useful, an introduction, a card, a lunch ask.

Write it in Spencer's DM voice: casual, warm, short sentences, one ask at most, closing with something like "give me a shout". Read his recent sent messages to that person first, if there are any.

Write the batch file. Each whale gets:
- name and company
- week number
- channel
- the draft (or the action for in-person and mail touches)
- why this touch, this week (one line)
- anything that needs a separate decision (cost, a commitment)

## Step 4: Approval gate

Present the batch. Spencer approves, edits or skips each item. Nothing goes out unapproved.

Any touch that commits Got Moles staff, time, money or free work needs that commitment approved as its own decision before the message is drafted (standing rule from 2026-09-10). Lunches are Spencer's own time and are already approved within the program budget (about $500 for the 10 weeks).

## Step 5: Send and schedule

- **LinkedIn:** send through `tool-browser` at human pace, then confirm each one in the thread.
- **Email:** create a Gmail draft from Spencer's account. Send only if he says to send; otherwise he sends it himself.
- **Card / drop-by / lunch:** add a Google Calendar reminder for Spencer with the address and the talking points from the dossier.
- **Lunch accepted:** put the event on his calendar and write a one-page lunch brief in the dossier (who they are, three things to ask about, what not to bring up).

## Step 6: Update the tracker and save

Append each sent touch to that whale's `touches` array in the app (ArtifactData update, pinned with if_version), set `next_touch` to next week's plan, and add it to the dossier's touch log. New whales: run `projects/briefs/whale-hunt/app/build-seed.mjs` logic, or set the document directly from the dossier card.
- `active`
- `lunch_scheduled`
- `graduated` (lunch held; moves to a monthly friend track and frees the slot)
- `fell_off` (week 10 with no meeting; back to quarterly nurture in `pipeline.json`)
- `paused` (job change, or Spencer's call)

When a slot frees, propose the top of the bench. Spencer confirms the swap.

Save the batch file and show its full path. Push the batch and scoreboard to Notion.

## Step 7: Feedback

After a weekly batch, ask: "How did this land? Any adjustments?" Log the answer under `## mkt-whale-hunt` in `context/learnings.md`.

## Rules

- 2026-10-21: **Hunt = people Spencer has NO relationship with yet.** Existing clients and anyone already in conversation go on the Maintain track: lighter touches (about monthly), never counted in the 10. Spencer set this after the first pick put 7 existing relationships in the hunt. Before adding a hunt whale, check pipeline.json, Gmail and Jobber for prior contact.
- 2026-10-21: The app holds whatever contact details Spencer gives it (birthday, family names he learns at lunch, cell numbers). Claude fills it only from public professional sources and our own email and calendar history.

- 2026-10-21: Relationship first. The ask is lunch or coffee, never a quote, a walk or a contract, unless the whale raises business themselves. Then follow their lead and bring Cory in for any bid.
- 2026-10-21: Whale firms are excluded from the `mkt-linkedin-nurture` volume campaign (`whale: true` in `pipeline.json`). One voice per whale.
- 2026-10-21: Landscape companies are referral partners, never buyers.
- 2026-10-21: Dossiers hold public, professional information only. No home addresses, family or personal-life digging.
- 2026-10-21: Claims guardrails apply in every touch: 283+ five-star reviews, no "WA's #1", no I-713 claims, and "15+ years" means Spencer's experience (the company was founded in 2017).
- 2026-10-21: Max 10 active whales. Week 10 with no meeting means a friendly close and fall-off, with no burned bridge.

## Self-Update

If Spencer flags a problem with a run (wrong tone, wrong channel, a touch that felt salesy, a wrong fact), add a dated line to `## Rules` above immediately, then log the broader pattern to `context/learnings.md`.

## Troubleshooting

- **LinkedIn logged out:** ask Spencer to sign in on the agent Chrome profile, then retry. Don't skip LinkedIn touches silently.
- **Whale unreachable on the planned channel** (not connected, invite pending): pick another channel from the menu that week.
- **Two whales at one firm:** that's one whale. Pick the primary person and list the other as a secondary contact.
