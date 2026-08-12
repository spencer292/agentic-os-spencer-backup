---
name: Muhammad — Daily Call Grading
time: '18:30'
days: weekdays
active: 'true'
model: opus
notify: on_finish
description: 'Weekdays 6:30pm PT: pulls every CallRail call Muhammad answered today with full transcripts, grades each one against the pinned rubric, cross-checks in Jobber that every quote he promised actually went out with the right plan and deposit, and writes Spencer a report of what he did well and what needs work — with running tallies so the trend is visible.'
timeout: 25m
retry: '0'
---
You are running as a scheduled job for Agentic OS. Read `CLAUDE.md` for system context.

**Task: grade Muhammad's phone calls for today and write Spencer a coaching report.**

Muhammad ("Mo") answers the Got Moles phones. He is being coached and the point of this
report is to make his week-over-week movement visible — so be specific, quote him, and
never pad. Spencer reads this to decide what to drill tomorrow.

---

## Step 1 — Assemble the evidence

From the repo root, run:

```
node projects/briefs/callrail-faq/scripts/fetch-day-calls.mjs
```

It defaults to today (America/Los_Angeles), takes 1–3 minutes, and writes a briefing to
`projects/briefs/callrail-faq/call-grading/_briefings/{today}.md`. Read that file in full.
It contains every call with its transcript, who answered, the service-day sheet's answer for
every zip mentioned, and every Jobber quote created today.

- If the script fails, **report the failure and stop** — do not grade from memory.
- Surface anything in its `⚠ Warnings` section in your report.

## Step 2 — Load the standard

Read, in this order:

1. `projects/briefs/callrail-faq/GRADING-RUBRIC.md` — **the scoring is pinned. Follow it exactly.**
   A score only means something if it means the same thing as last week's.
2. `projects/briefs/callrail-faq/call-grading/_tallies.json` — the running counters.
3. The last three entries in `projects/briefs/callrail-faq/roleplay-log.md` — trajectory and
   what he was told to work on.
4. `projects/briefs/callrail-faq/2026-07-20_muhammad-faq-training.md` — **check every price,
   term and policy claim against this file, not against memory.**

## Step 3 — Grade

Grade **only the calls the briefing attributes to MO**. Ignore Spencer's calls, the after-hours
Voice Assist, and anything under ~30 seconds. Count a flagged duplicate **once**.

For each call, work through the transcript properly — read it, don't skim for keywords:

- Score sales calls out of 100 on the five dimensions. Letter-grade service calls.
- Apply the hard gates and the block-before-price ceiling exactly as the rubric defines them.
- **Quote him verbatim** for anything you praise or criticise. A claim without a quote is not
  a finding.
- Check every day-of-week claim against the zip lines the briefing prints. Check every price
  and policy claim against the FAQ training file.
- Log the no-catch guarantee — said or missed — on **every** sales call.

## Step 4 — Cross-check Jobber

For every quote he promised on a call, find it in the briefing's quote table and confirm:
sent at all, sent inside the window he promised, correct plan (read the **line item**, not the
total), correct deposit (Quick Fix **$150**, TMCP **$0**), discounts as line items, correct
property address.

**A promised quote that never went out leads the report.** So does a live lead who gave no
email or address — check the transcript against the quote table for exactly that.

## Step 5 — Write the report

Save to `projects/briefs/callrail-faq/call-grading/{today's date in YYYY-MM-DD}.md`, in this
order:

1. **Verdict** — two sentences. Today's average, the direction, the single thing that matters most.
2. **Scores table** — call, caller, type, length, score, outcome.
3. **What he did well** — with quotes. Be genuinely specific; "good tone" is worthless, the
   sentence he said is not. If he fixed something he was told to fix, lead with it and say how
   long it had been outstanding.
4. **What needs work** — ranked by cost to the business, not by severity of the mistake. For
   each: what he said, what it cost or risked, and the exact sentence he should have used.
5. **Running tallies** — a table carrying today plus the prior rows from `_tallies.json`:
   sales calls, average, guarantee said / asked, full block before price, address read back,
   service day correct, capture complete, quotes promised vs sent on time.
6. **Quote follow-through** — the Jobber cross-check.
7. **Needs Spencer** — open loops, callbacks Mo owed, policy questions, operational red flags a
   customer raised (missed visits, missing traps, billing confusion). Anything only Spencer can clear.
8. **Tomorrow's 10 minutes** — at most three drills, ranked. Say explicitly what to **stop**
   drilling because it is now landing.

Write it the way a good sales manager talks: direct, evidence-first, no praise sandwich, no
padding. Do not soften a real problem and do not manufacture one to look balanced. **If he had
a clean day, say so plainly** — inventing criticism to fill a section destroys the report's value.

## Step 6 — Update the running records

**This step must be safe to run twice on the same day.** The job can be re-run manually, and a
duplicated row or a second log heading for the same date silently corrupts the trend. Before
writing either file, check whether today's date is already in it:

1. `projects/briefs/callrail-faq/call-grading/_tallies.json` — if a row for today already exists,
   **replace it in place**. Otherwise append one, matching the existing shape. Never touch earlier
   rows unless one is factually wrong.
2. `projects/briefs/callrail-faq/roleplay-log.md` — if a `## {today's date}` heading already
   exists, **replace that whole section**. Otherwise append a compact dated entry in the same
   style as the entries already there, ending with the trajectory line and the next drill.

The report file at `call-grading/{today}.md` is simply overwritten — that one is safe already.

## Step 7 — Output

Print a short summary for the notification: number of calls graded, today's average, the
trajectory, the one thing needing work, and anything in **Needs Spencer**. Then the full path
to the report.

---

## Rules

- **Reads only.** Never create, edit or send anything in Jobber. Never call a customer.
  You are grading, not operating.
- **Never invent a fact about Got Moles.** If the transcript raises something the FAQ file
  doesn't cover, flag it as an open question for Spencer rather than ruling on it.
- Muhammad is a real person being coached, not a defect list. Report accurately — including
  when he is doing well.
- If **no calls** were answered by Mo today (day off, no volume), write no report file, say so
  in one line, and end your output with `[SILENT]`.
- If CallRail returns calls but none have transcripts, say so and stop — transcripts are the
  evidence and there is no grading without them.
