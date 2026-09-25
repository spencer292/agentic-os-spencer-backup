---
name: ops-timesheet-audit
description: "Audits Gusto timesheets against Jobber visit completion stamps before Spencer approves payroll. Catches forgotten clock-outs, corrections that were never applied, punches that land before the last job, off-the-clock days, and long days, and shows overtime hours next to visits completed per tech per week so overtime that is not backed by work stands out. Triggers on: 'audit timesheets', 'timesheet audit', 'check the timesheets', 'payroll check', 'before I approve payroll', 'who forgot to clock out', 'overtime vs jobs', 'is the overtime real'. Does NOT trigger for pay rates, payroll processing or tax filing (payroll provider), route pace or day-length analysis (route-engine), or discipline over time theft (ops-hr, which this skill hands evidence to)."
---

# ops-timesheet-audit — Timesheets checked against the work before payroll is approved

The Jobber completion stamp is the ground truth for when a tech was working. A timesheet row that
disagrees with the stamps by more than a normal drive-in or drive-out is an error until a note
explains it. This skill finds those rows every pay week, before Spencer approves them in Gusto,
and shows overtime next to the visits that supposedly caused it.

## Why it exists

Found 2026-09-19 across five weeks of timesheets: one forgotten clock-out that paid 2.9 hours for
no work and created a whole week of overtime on its own, one correction note that was written but
never applied, one correction applied to a time before the tech's last job, and one 84-minute
unexplained tail. All four were invisible in Gusto and obvious next to the stamps. The 42.6 hours
of overtime on the heaviest earner, by contrast, were real: every long day stamped stops all the
way to the clock-out.

## Inputs

1. **Gusto export.** Gusto has no API on this install, so this is the one manual step. In Gusto:
   Time tools -> Time tracking -> Hours -> set the range -> Export CSV. Drop the file in
   `projects/briefs/timesheet-audit/private/` (gitignored; never leaves this machine).
2. **Jobber stamps.** Pulled live by the script for the export's date window using the Jobber
   credentials already configured for `tool-jobber`. Offline runs can pass `--visits <json>`.

## Run

```
node projects/briefs/timesheet-audit/scripts/audit-timesheets.mjs
```

Defaults to the newest export in `private/`. Options: `--csv <path>`, `--from/--to`, `--visits <path>`.
Thresholds live in `projects/briefs/timesheet-audit/rules.json`. Adjust there, never in the script.

## Output

- `projects/briefs/timesheet-audit/reports/{to}_timesheet-audit.md` — hours only. Never a rate, never
  a dollar amount. Safe in git.
- `projects/briefs/timesheet-audit/private/{to}_audit.json` — full detail, gitignored.

The report has four parts and Claude walks Spencer through them in this order:

1. **Fix before approving.** Rows still unapproved in Gusto that the stamps contradict. Each one
   states what the stamps say, what the sheet says, and the estimated hours impact, signed
   (+ overpaid, - underpaid). Spencer edits these in Gusto, then approves.
2. **Already approved, worth a word.** Same class of finding on rows already paid. Nothing to
   edit; these go into the conversation with the tech and, if a pattern forms, to `ops-hr`.
3. **Overtime vs visits, by tech by week.** Paid hours, OT hours, visits completed, visits per
   paid hour, OT hours per 100 visits, and whether a flagged day is what tipped the week over 40.
   Read this for two things: OT with no visits behind it (a punch problem) and OT with the same
   visit count as a tech who has none (a pace problem, which belongs to route-engine, not here).
4. **Evening and bulk stamps.** Stamps after 20:00 with a long gap before them are usually office
   edits, not field work. They are excluded from the tech's last stamp and listed so nobody reads
   them as a 9pm job.

## Rules Claude follows

- Never state a pay rate, an hourly cost, or a dollar figure in anything under `reports/` or in
  chat unless Spencer supplies the rate in that session. Hours only.
- Never edit Gusto. The script reads an export; Spencer makes every correction and every approval.
- A flag is a discrepancy, not a verdict. Say "the sheet and the stamps disagree by N minutes",
  not "he padded his hours". Underpayment gets reported with the same weight as overpayment.
- Salaried staff (Cory Ventura) have no clock and get a visits-only row. That is by design.
- If the export window and the stamps window differ, say which days are compared and which are not.
- When a tech's overtime is backed by stamps, say so plainly. The audit exists to separate real
  overtime from punch errors, not to argue every hour.
- After the run, log the week's findings count and any new failure pattern to `context/learnings.md`
  under `## ops-timesheet-audit`.

## Weekly procedure (Spencer)

Monday morning, before approving the previous week in Gusto:

1. Export last week's hours CSV from Gusto and drop it in `private/`.
2. Say "audit timesheets".
3. Fix the rows in part 1 in Gusto. Approve.
4. Anything in part 2 or a repeat name in part 1: one sentence to the tech that day, citing the
   stamp times. The punch policy in `projects/briefs/timesheet-audit/punch-policy.md` is what they
   were told.

## Hand-offs

- Pace or day-length questions (why 25 stops takes 11 hours) -> route-engine redesign, stage S2b.
- A tech who repeats the same error after being told -> `ops-hr` for a documented coaching note.
- Adding a new tech: add the Gusto "Last, First" to Jobber name mapping in `rules.json`.
