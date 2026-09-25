---
project: timesheet-audit
status: active
level: 2
created: 2026-09-19
---

# Timesheet Audit — every timesheet checked against the stamps before it is approved

## Goal

Stop paying for hours the work does not support, and stop underpaying techs whose corrections were
never applied, by checking every Gusto timesheet row against Jobber visit completion stamps before
Spencer approves payroll each week. Show overtime next to visits completed so overtime that is not
backed by work is visible the week it happens, not five weeks later.

## Why now

A five-week check on 2026-09-19 (Aug 17 to Sep 18) found four punch errors that Gusto could not see:

| Tech | Date | Error | Hours effect |
|---|---|---|---|
| Luke | Tue Sep 15 | Forgot to clock out; last job 13:48, clock-out 16:40, 12 stops | about +2.9 h, created 2.0 h OT for the week |
| Robert | Tue Sep 15 | "7:15 correction" note written, clock-in still 07:58, first job 07:20 | about -0.7 h |
| Tavis | Fri Aug 28 | Clock-out corrected to 16:18, last job stamped 16:50 | about -0.5 h at OT rate |
| Tavis | Mon Aug 31 | Clock-out 16:34, last job 15:10, no note | 84 min unexplained |

The heaviest overtime (Alias, 42.6 h of the company's 60.9 h) was checked the same way and is real:
every long day stamps stops every 20 to 40 minutes to within a minute of the clock-out. That is a
pace question for the route-engine work, not a timesheet question.

## Deliverables

- `scripts/audit-timesheets.mjs` — parses the Gusto export, pulls Jobber stamps for the window,
  joins per tech per day, applies `rules.json`, writes the report and the private JSON.
- `rules.json` — thresholds, accepted-note patterns, holidays, Gusto-to-Jobber name map.
- `reports/{to}_timesheet-audit.md` — weekly report, hours only, tracked in git.
- `punch-policy.md` — the one-page rule the techs are told, so a flag is against a known standard.
- `.claude/skills/ops-timesheet-audit/SKILL.md` — the skill that runs it and reads the report.
- Registry row in `CLAUDE.local.md`.

## Acceptance criteria

- Running against the Aug 17 to Sep 20 export reproduces the four findings above and does not flag
  Tavis Aug 19 (note: T-Mobile meeting) or Labor Day.
- Report contains no rate or dollar figure.
- The whole loop from export to approval takes Spencer under ten minutes on a Monday.

## Constraints

- Gusto has no API here. The CSV export is manual and is the only step that cannot be automated.
  A cron cannot run this unattended; the skill runs when Spencer drops the file and asks.
- `private/` is gitignored. Reports carry hours only.
- The script never writes to Gusto or Jobber.

## Dependencies

- Jobber credentials (already in place for tool-jobber).
- Gusto export access (Spencer).
