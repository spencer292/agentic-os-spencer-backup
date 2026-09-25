# Timesheet audit — 2026-08-17 to 2026-09-20

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

| Tech | Date | Flag | Detail | Est. impact |
|---|---|---|---|---|
| Tavis Alexander | 2026-08-24 (Mon) | MISSED_CLOCK_OUT | clockOut:16:09, lastStamp:15:12, gapMin:57 | +0.95 h |
| Tavis Alexander | 2026-08-28 (Fri) | CORRECTION_BEFORE_LAST_STAMP | clockOut:16:18, lastStamp:16:49 | -0.52 h |
| Tavis Alexander | 2026-08-31 (Mon) | MISSED_CLOCK_OUT | clockOut:16:34, lastStamp:15:10, gapMin:84 | +1.4 h |
| Alias Franks | 2026-08-18 (Tue) | LONG_DAY | paidHours:11.867 | — |
| Alias Franks | 2026-08-19 (Wed) | LONG_DAY | paidHours:12.283 | — |
| Alias Franks | 2026-08-26 (Wed) | LONG_DAY | paidHours:12.517 | — |
| Alias Franks | 2026-08-27 (Thu) | LONG_DAY | paidHours:11.05 | — |
| Alias Franks | 2026-08-28 (Fri) | LONG_DAY | paidHours:11.383 | — |

Tavis Alexander (5 day(s)), Alias Franks (5 day(s)), Luke LaVergne (5 day(s)), Robert Norton (5 day(s)) still unapproved in Gusto for this window — the flags above still apply once approved.

## 3. Overtime vs. stops, by tech by week

| Tech | Week of | Paid h | OT h | Stops | Stops/paid h | OT h/100 stops | Flagged days | OT from a flagged day? |
|---|---|---|---|---|---|---|---|---|
| Tavis Alexander | 2026-08-17 | 40.82 | 0.82 | 136 | 3.33 | 0.6 | 0 | no |
| Tavis Alexander | 2026-08-24 | 43.37 | 3.37 | 149 | 3.44 | 2.26 | 2 | no |
| Tavis Alexander | 2026-08-31 | 43.52 | 3.52 | 137 | 3.15 | 2.57 | 1 | no |
| Tavis Alexander | 2026-09-07 | 30.9 | 0 | 103 | 3.33 | 0 | 0 | no |
| Tavis Alexander | 2026-09-14 | 40.97 | 0.97 | 142 | 3.47 | 0.68 | 5 | no |
| Alias Franks | 2026-08-17 | 51.9 | 11.9 | 132 | 2.54 | 9.02 | 2 | no |
| Alias Franks | 2026-08-24 | 54.2 | 14.2 | 128 | 2.36 | 11.09 | 3 | no |
| Alias Franks | 2026-08-31 | 45.38 | 5.38 | 120 | 2.64 | 4.49 | 0 | no |
| Alias Franks | 2026-09-07 | 38.87 | 0 | 94 | 2.42 | 0 | 0 | no |
| Alias Franks | 2026-09-14 | 51.1 | 11.1 | 138 | 2.7 | 8.04 | 5 | no |
| Luke LaVergne | 2026-08-17 | 39.85 | 0 | 104 | 2.61 | 0 | 0 | no |
| Luke LaVergne | 2026-08-24 | 33.13 | 0 | 75 | 2.26 | 0 | 0 | no |
| Luke LaVergne | 2026-08-31 | 43.65 | 3.65 | 104 | 2.38 | 3.51 | 0 | no |
| Luke LaVergne | 2026-09-07 | 37.7 | 0 | 86 | 2.28 | 0 | 0 | no |
| Luke LaVergne | 2026-09-14 | 42 | 2 | 107 | 2.55 | 1.87 | 5 | yes |
| Robert Norton | 2026-08-17 | 39.12 | 0 | 109 | 2.79 | 0 | 0 | no |
| Robert Norton | 2026-08-24 | 41.97 | 1.97 | 125 | 2.98 | 1.57 | 0 | no |
| Robert Norton | 2026-08-31 | 41.98 | 1.98 | 121 | 2.88 | 1.64 | 0 | no |
| Robert Norton | 2026-09-07 | 33.8 | 0 | 94 | 2.78 | 0 | 0 | no |
| Robert Norton | 2026-09-14 | 35.48 | 0 | 116 | 3.27 | 0 | 5 | no |
| Cory Ventura | 2026-08-17 | — | — | 128 | — | — | — | salaried |
| Cory Ventura | 2026-08-24 | — | — | 127 | — | — | — | salaried |
| Cory Ventura | 2026-08-31 | — | — | 101 | — | — | — | salaried |
| Cory Ventura | 2026-09-07 | — | — | 99 | — | — | — | salaried |
| Cory Ventura | 2026-09-14 | — | — | 141 | — | — | — | salaried |

Read this for two things: overtime with no stops behind it (a punch problem, see part 1/2 above),
and overtime at the same stop count as a tech with none (a pace question for route-engine, not
this audit).

## 4. Evening and bulk stamps noticed

Stamps after 20:00 with a gap of more than
90 minutes before them are usually office bulk edits, not field
work. They are excluded from the tech's last stamp above and listed here so nobody reads them as a
late-night job.

| Tech | Date | Stamp(s) excluded | Last real stamp used |
|---|---|---|---|
| Tavis Alexander | 2026-08-25 (Tue) | 21:09 | 18:00 |
| Alias Franks | 2026-08-25 (Tue) | 21:16 | 17:15 |
| Luke LaVergne | 2026-09-09 (Wed) | 20:38 | 17:14 |
| Robert Norton | 2026-08-25 (Tue) | 21:27 | 14:58 |

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
