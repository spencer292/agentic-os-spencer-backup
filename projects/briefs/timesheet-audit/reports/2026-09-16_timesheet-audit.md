# Timesheet audit — 2026-09-15 to 2026-09-16

Source: `rainier-power-wash-time-tracking-hours-2026-08-17-to-2026-09-20.csv`. Jobber completion stamps are the ground truth for when a
tech was working; a timesheet row that disagrees by more than a normal drive-in/out is a
discrepancy until a note explains it. Hours only — no rate or dollar figure appears anywhere below.

## 1. Fix before approving

Rows still unapproved in Gusto that the stamps contradict.

| Tech | Date | Flag | Detail | Est. impact |
|---|---|---|---|---|
| Alias Franks | 2026-09-16 (Wed) | LONG_DAY | paidHours:11.867 | — |
| Luke LaVergne | 2026-09-15 (Tue) | MISSED_CLOCK_OUT | clockOut:16:40, lastStamp:13:47, gapMin:173 | +2.88 h |
| Robert Norton | 2026-09-15 (Tue) | LATE_CLOCK_IN | clockIn:07:58, firstStamp:07:20, gapMin:38 | -0.63 h |
| Robert Norton | 2026-09-15 (Tue) | CORRECTION_NOT_APPLIED | mentioned:7:15 , field:clockIn, actual:07:58, diffMin:43 | -0.72 h |

## 2. Already approved, worth a word

Same class of finding on rows already paid. Nothing to edit in Gusto; raise it with the tech and,
if a pattern forms, hand it to `ops-hr`.

_None._

Tavis Alexander (2 day(s)), Alias Franks (2 day(s)), Luke LaVergne (2 day(s)), Robert Norton (2 day(s)) still unapproved in Gusto for this window — the flags above still apply once approved.

## 3. Overtime vs. stops, by tech by week

| Tech | Week of | Paid h | OT h | Stops | Stops/paid h | OT h/100 stops | Flagged days | OT from a flagged day? |
|---|---|---|---|---|---|---|---|---|
| Tavis Alexander | 2026-09-14 | 16.02 | 0 | 59 | 3.68 | 0 | 2 | no |
| Alias Franks | 2026-09-14 | 22.55 | 0 | 55 | 2.44 | 0 | 2 | no |
| Luke LaVergne | 2026-09-14 | 16.93 | 0 | 31 | 1.83 | 0 | 2 | no |
| Robert Norton | 2026-09-14 | 15.22 | 0 | 53 | 3.48 | 0 | 2 | no |
| Cory Ventura | 2026-09-14 | — | — | 59 | — | — | — | salaried |

Read this for two things: overtime with no stops behind it (a punch problem, see part 1/2 above),
and overtime at the same stop count as a tech with none (a pace question for route-engine, not
this audit).

## 4. Evening and bulk stamps noticed

Stamps after 20:00 with a gap of more than
90 minutes before them are usually office bulk edits, not field
work. They are excluded from the tech's last stamp above and listed here so nobody reads them as a
late-night job.

_None._

## 5. Method

Thresholds (edit in `rules.json`): clock-out more than 45 min
after the last stamp with no accepted-reason note = missed clock-out. Clock-in more than
20 min after the first stamp = late clock-in (underpaid). Clock-in
more than 45 min before the first stamp = early clock-in
(overpaid). A note-mentioned time off by more than 10 min
from the recorded clock time = correction not applied. A "clock out"/"punch out" note with a
clock-out more than 10 min before the last stamp =
correction set before the last job. A weekday with stops but zero paid hours = missing punch (US
holidays in `rules.json` are exempt). Paid hours with zero stops in the pulled window, any day at
11+ paid hours, a clock span vs. paid-hours gap over
0.6 h, and any weekend paid hours are flagged for a look, not
assumed wrong. Estimated impact is signed: **+ overpaid** (paid for time not worked), **−
underpaid** (worked but not paid); flags with no reliable estimate show `—`.
