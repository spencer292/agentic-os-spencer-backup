# Account Safety — the constraint that governs everything else

Spencer's LinkedIn account carries his name, his network, and the company's reputation. It is
also the only asset this campaign runs on. A restricted or banned account ends the campaign
permanently and takes the network with it — there is no version of this work that's worth that
trade.

So the rule underneath every other rule here: **when something looks unusual, stop and ask.**
Guessing costs more than pausing.

---

## What LinkedIn actually restricts

LinkedIn's enforcement targets automation patterns rather than volume alone. What triggers it:

- Requests fired faster than a human could plausibly click
- Perfectly regular timing — one action every 30 seconds for an hour looks like a script because it is one
- High volume sustained across many days without a break
- Low acceptance rates (lots of ignored invites signals spam to their systems)
- Recognised automation tooling — third-party senders, headless browsers, injected scripts that click for you

This campaign avoids all of it by construction: Spencer is present, sends are one at a time,
and Claude does research and drafting rather than bulk clicking. That's not a workaround, it's
the actual design — the campaign's value comes from personalization, which can't be automated
anyway.

---

## Account tier: Sales Navigator Core, active 2026-08-21

Trial through **2026-09-21**, then $119.99/month (switched off annual billing the same day).
What changed against the free-account assumptions this file was written under:

- **Personalized notes are no longer rationed** — the ~5/month cap is gone. The note-vs-no-note decision is now a judgment per prospect rather than a rationing problem, and the data still says bare requests accept better. Don't start noting everything just because it's possible.
- **Search headroom jumps from ~300/month to roughly 2,500** — the commercial use limit that could have stopped a session mid-flight is no longer the binding risk. Still log search counts; the cap is raised, not removed.
- **The invite cap is unchanged at ~100/week.** Paying bought no extra sending volume, as expected.

**What did not change: extraction still happens on standard LinkedIn search only.** See the tool
split in `session-runbook.md`. Sales Navigator carries active anti-scraping instrumentation and
terms that prohibit exporting; a paid subscription is a reason to protect the account more
carefully, not less.

## The numbers as of 2026-08-21

Researched live, with sources and the full picture in `current-benchmarks.md`:

- **~100 connection requests per rolling 7-day window**, the same on Free, Premium and Sales Navigator
- **150–200/week** is granted to accounts with an active profile, acceptance above ~30%, and a strong Social Selling Index
- **~5 personalized notes per month** on a free account — this, not the invite cap, is what actually limits us
- **300 characters** for a note, now on every tier

The invite cap is not our constraint: at 10–15 sends a session we're nowhere near 100 a week.
The note allowance is. And because LinkedIn raises limits for accounts above ~30% acceptance and
tightens them below, sending carefully to well-qualified people protects the account's standing
as well as its reputation.

Verify these live anyway — they change without notice, and the point of dating this file is that
it will go stale.

## Verify limits live, every session

Do not assume a number, including the ones above. At the start of each session:

1. Open the invitation manager (`linkedin.com/mynetwork/invitation-manager/sent/`)
2. Read how many invites are pending and whether any warning banner is showing
3. Attempt one connection note and observe whether the note field is offered or restricted
4. Tell Spencer the real number before planning the session's volume

The number that matters most for this campaign isn't the invite cap — it's how many invites can
carry a **personal note**. On free accounts that allowance is small and it resets monthly. The
note is the whole campaign, so this figure sets the real pace.

If notes are scarce, the session shape changes rather than the campaign stopping:

- Spend noted invites only on 2nd-degree prospects with a genuine warm route — the highest-value rows
- Send bare invites to lower-priority prospects (they accept at a decent rate cold, and the personalized message lands on acceptance instead)
- Put the remaining session time into engagement, which is unlimited and produces replies

---

## Session pacing

- **10–15 connection requests per session** is the working target, well under any cap
- **A natural gap between each send** — vary it. Perfectly even spacing is itself a pattern
- **Confirm each send landed** before starting the next one
- **Stop at the first sign of friction** rather than pushing to a planned number

Volume is not the lever here. Twelve researched, specific messages will beat sixty templated
ones on reply rate, and they don't put the account at risk.

---

## What always needs Spencer's explicit confirmation

Per `tool-browser`'s rules, reads are free and writes are not. Free: navigating, searching,
reading profiles, screenshots, extracting text. Requires his approval, every time, per batch:

- Sending a connection request
- Sending any message or InMail
- Accepting an incoming request on his behalf
- Liking, commenting, or following
- Any change to his profile or settings

Approval for one batch never carries to the next. "Yes, send those twelve" means those twelve.

---

## Stop conditions — halt and tell Spencer immediately

- Any warning banner, restriction notice, or "you're moving too fast" message
- A captcha or identity verification prompt
- The account being logged out mid-session
- An unexpected interface change where the right click isn't obvious
- Invite limit reached
- A prospect's profile no longer matching the research (job change, deleted account)

In every one of these cases the correct action is to stop and report, not to work around it.
Clicking through a captcha on his behalf is exactly the behavior that gets accounts flagged.

---

## Handling incoming

Accepting relevant incoming requests is good for the account — it raises acceptance signals and
grows the network without spending invites. But it's still a write, so surface them to Spencer
in the session and let him decide. Irrelevant or spammy incoming requests should simply be left.

---

## If something goes wrong anyway

If the account picks up a restriction:

1. Stop all outreach immediately — no further sends of any kind
2. Tell Spencer plainly what happened and what the last actions were
3. Don't attempt an appeal or a workaround without him deciding
4. Note it in `pipeline.json` and the session log so the history is intact

The pipeline survives a restriction. The relationships survive. Only the sending pauses — which
is exactly why the state file exists.
