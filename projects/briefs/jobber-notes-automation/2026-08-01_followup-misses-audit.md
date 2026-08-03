# Follow-up visits asked for in notes that never got added

**Window:** notes 2026-06-17 → 2026-08-01 (45 days) · **839 jobs** visited · **2,377 notes** asked for a return visit
**Result:** **86 not honoured** — 76 on live jobs, 10 on archived (closed programs, informational only).
**Still fixable today:** 37 (the late visit is still in the future — an interim visit can be added before the gap happens).

Source data: `runs/followup-misses-2026-08-01.md` / `.json`. Script: `audit-followup-misses.mjs` — **report only, nothing was written to Jobber.**

---

## The headline: two different failures, not one

### 1. The parser is blind to how some techs write intervals — confirmed

`parse-note.mjs:70` only matches the literal string `2 weeks` and the word `weekly`. Everything else returns `nextAction = null`, which `decide.mjs` turns into LEAVE. The note never even appears as an ADD line in the nightly review, so **nobody sees the miss**.

| Note says | What the automation reads |
|---|---|
| `1 week`, `1 weeks`, `1wk` | **null — dropped** |
| `one week`, `Two weeks`, `two week` | **null — dropped** |
| `2 week` (no s) | **null — dropped** |
| `10 days`, `next week` | **null — dropped** |
| `2 weeks` | `2 weeks` ✓ |
| `Add visit` / `Ad visit` | `Add visit` ✓ |

**33 notes in the window used phrasing the automation cannot read.** By author:

| Author | Follow-ups asked | Not honoured | Parser can't read | Blind **and** missed |
|---|---:|---:|---:|---:|
| Robert Norton | 56 | 7 | **16 (29%)** | 2 |
| Alias Franks | 131 | 7 | 9 | 1 |
| Cammeron Anderson | 774 | 22 | 6 | 1 |
| Luke LaVergne | 745 | 28 | 1 | 0 |
| Spencer Hill | 187 | 10 | 1 | 0 |
| Cory Ventura | 484 | 12 | 0 | 0 |

Robert is by far the worst offender proportionally — **29% of his follow-up requests are invisible to the system.**

**The honest version, though:** 14 of Robert's 16 blind notes *were* honoured — he booked them himself on-site, most landing on the exact due date. His phrasing didn't cause mass misses. What it did was **remove the safety net**: when he didn't book one, nothing caught it. Both of his invisible misses are below.

**The 4 invisible misses (blind AND never booked):**

| Job | Client | Note by | Visited | Said | Due | Got | Slip |
|---|---|---|---|---|---|---|---:|
| 5726 | Faye Houshyari | **Robert** | 2026-07-23 | `1 week` | 2026-07-30 | 2026-08-13 | **+14d** |
| 7960 | Danielle Steele | **Robert** | 2026-07-23 | `1 week` | 2026-07-30 | 2026-08-03 | +4d |
| 6450 | Ray Spencer | Alias | 2026-07-23 | `Two week` | 2026-08-06 | 2026-08-12 | +6d |
| 7963 | Adam Patton | Cammeron | 2026-06-29 | `1 week` | 2026-07-06 | **none** | job archived |

#5726 Faye Houshyari is the clearest damage: verified clean weekly cadence 6/11→7/23, then it stops dead and jumps to 8/13. A 21-day gap right after the tech asked for a 1-week return.

### 2. The bigger problem is volume, and it isn't Robert

**82 of the 86 misses were read correctly by the parser** — `Add visit` / `2 weeks`, perfectly parseable — and still never got booked. The follow-up cron (`cron/jobs/jobber-visit-followups.md`) is **dry-run by design and never passes `--execute`**, so every one of these depended on a human booking it. Fixing the regex closes a 33-note blind spot; it does not touch the other 82.

---

## What needs a visit added — by severity

### A. No follow-up visit at all, on a live job (3 jobs / 4 rows — #8089's note is duplicated)

| Job | Client | Note by | Visited | Due | Job status |
|---|---|---|---|---|---|
| 8089 | Klaudia Elam | Cammeron | 2026-07-28 | 2026-08-04 | action_required *(note is duplicated on the job)* |
| 6900 | Jeff Hunter | Cammeron | 2026-07-30 | 2026-08-06 | action_required |
| 8276 | Diana Miller | Luke | 2026-07-31 | 2026-08-07 | requires_invoicing — **only 1 visit ever on this job** |

`requires_invoicing` on #8276 means serviced but never billed — worth a second look beyond the scheduling gap.

### B. Severe — follow-up slipped 14+ days (14)

| Job | Client | Note by | Visited | Said | Due | Got | Slip |
|---|---|---|---|---|---|---|---:|
| 4479 | Charles Bender | Luke | 2026-07-23 | `Add visit` | 2026-07-30 | 2026-08-27 | **+28d** |
| 5328 | Dave Belmont | Luke | 2026-07-23 | `Add visit` | 2026-07-30 | 2026-08-27 | **+28d** |
| 7937 | Dave Kenney | Luke | 2026-07-21 | `Add visit` | 2026-07-28 | 2026-08-24 | **+27d** |
| 7063 | Robert Saeman | Luke | 2026-07-22 | `Add visit` | 2026-07-29 | 2026-08-25 | **+27d** |
| 7788 | Bonnie Mccracken | Cammeron | 2026-07-28 | `Ad visit` | 2026-08-04 | 2026-08-25 | +21d |
| 8224 | Kelsey Peck | Alias | 2026-07-31 | `Add visit` | 2026-08-07 | 2026-08-28 | +21d |
| 6355 | Julie James | Alias | 2026-07-23 | `Add visit` | 2026-07-30 | 2026-08-19 | +20d |
| 7202 | Josh Trachtenberg | Cory | 2026-07-29 | `Add visit` | 2026-08-05 | 2026-08-24 | +19d |
| 7639 | Marla Poor | Cory | 2026-07-29 | `Add visit` | 2026-08-05 | 2026-08-24 | +19d |
| 6338 | Barbara Wood | Luke | 2026-07-27 | `Add visit` | 2026-08-03 | 2026-08-18 | +15d |
| 7997 | Anita Leigh | Luke | 2026-06-30 | `Add visit` | 2026-07-07 | 2026-07-22 | +15d *(past)* |
| 5676 | Clark Potter | Cammeron | 2026-07-22 | `Ad visit` | 2026-07-29 | 2026-08-12 | +14d |
| 5726 | Faye Houshyari | **Robert** | 2026-07-23 | `1 week` | 2026-07-30 | 2026-08-13 | +14d |
| 7842 | Rodrigo Vidal | Cammeron | 2026-06-22 | `2 weeks` | 2026-07-06 | 2026-07-20 | +14d *(past)* |

**Four of these overlap the 7/26 cadence audit** (#4479, #5328, #7063, #7937 — all in `technician-route-automation/followup-gaps-0726.json`) and were flagged then as 27–35 day waits. They are still unfixed.

### C. Moderate — slipped 7–13 days (44)

Overwhelmingly a **skipped week** on a weekly cadence: tech says `Add visit`, the customer gets 14 days instead of 7. Full list in `runs/followup-misses-2026-08-01.md` §B. Concentrated in mid-to-late June (Luke and Cammeron) and the 7/21–7/31 stretch.

### D. Minor — slipped 4–6 days (14)

Within normal route slack. Listed for completeness; I would not chase these.

### E. Archived jobs (10) — informational, no action

Note asked for a follow-up, then the job was closed. Per the existing precedent in `audit-schedule.mjs`, a completed Quick Fix correctly ends with nothing upcoming. Worth a spot-check only if any of these were closed *prematurely*: #7945 Anne Nguyen (asked twice, 6/18 and 6/25), #7925 Virgil Holman, #7963 Adam Patton, #8027 Shelly Coleman, #7992 Louis Chirillo, #7993 John & Jasmine Foth, #7150 Justin Muir, #8037 Marian and Phil Thom, #8041 Mike Schuppert.

---

## Recommended fixes

1. **Widen the parser** — `detect-followup.mjs` is written, unit-tested (16/16), and is a drop-in superset of the current next-action regex. Swapping it into `parse-note.mjs` closes the 33-note blind spot permanently. It also feeds the voice-notes app, so techs get told in the yard when an interval didn't register.
2. **Decide whether the follow-up cron should execute.** It has been dry-run since build. 82 correctly-parsed follow-ups went unbooked in 45 days — that is the actual leak, and no regex fixes it.
3. **Book the 37 still-fixable gaps** — sections A and B first. `add-cadence-visit.mjs` already does interim ADDs (recurring visit left intact, so no downstream gap), and it refuses to double-book.

Nothing above has been actioned. Say which of the three you want and I'll take it.

---

## Method / caveats

- A follow-up counts as **honoured** if *any* visit landed between the noted visit and target+3 days — deliberately generous, so a tech returning early still passes.
- `completed` is anchored to the real visit on/before the note date (techs often write the note next morning), falling back to the note date.
- Slip is measured against the *next* visit after the noted one, from full Jobber visit history — spot-verified against unfiltered visit lists for #5084, #7869, #5726, #7937, #4479, #8276, #7960; all confirmed.
- Duplicate rows (#8089, #7945) are genuine duplicate notes on the job, not a script artifact.
- `3 weeks`+ intervals and bare `monthly` are treated as no-change, matching the canonical rules in `brief.md`.
