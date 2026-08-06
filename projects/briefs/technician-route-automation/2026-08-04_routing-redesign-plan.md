---
project: technician-route-automation
status: proposal — awaiting decisions
level: 2
created: 2026-08-04
supersedes: the `--grid` day-pinning layer added 2026-07-11..07-22
---

# Routing Redesign — plan for discussion

Written 2026-08-04 after Spencer: *"this right now is a failure… we need to re-evaluate what we're
doing, what the rules are, and see if there's a better way."*

Goal in his words: **most jobs, fewest days, least miles, everyone near an eight-hour day, and not
driving past a bunch of houses we're right there at — and as hands-off as possible.**

---

## 1. Where it stands today (measured, week of 08-10)

| Tech | Days | Stops | Avg h/day | Miles | Commute to 1st job | Commute share |
|------|-----:|------:|----------:|------:|-------------------:|--------------:|
| Alias Franks | 5 | 94 | 6.6 | 390 | 91 mi / 2.5 h | 23% |
| Cammeron Anderson | 5 | 97 | 6.2 | 339 | 48 mi / 1.3 h | 14% |
| Cory Ventura | 5 | 112 | 6.7 | 443 | 161 mi / 2.9 h | **36%** |
| Luke LaVergne | 5 | 87 | 7.1 | 569 | 79 mi / 2.2 h | 14% |

- **1,742 miles/week. 380 of them (22%) are the drive to the first job**, before any work happens.
- **Day lengths run 4.0 h to 8.8 h**, averaging 6.6. ~133 h of work is spread over 20 tech-days;
  at 8 h days that is closer to 17.
- **Same area approached repeatedly:** Alias hits Redmond Wed+Thu+Fri; Cory hits Renton on two days
  (36 stops) and Newcastle on two.
- **Continuity is 50%.** 178 of 356 repeat customers are booked with a tech other than the one who
  last served them. 68 of those are forced (Robert Norton and Spencer Hill are out of the field);
  **110 are avoidable handovers between the four active techs.**

## 2. Root cause

Three separate decisions are each being made in the wrong place.

| Decision | Made today by | Should be made by |
|----------|---------------|-------------------|
| **Which tech** | a zip→tech table (and, when the tech lock is missing, by the optimizer) | **the customer's own history** |
| **Which day** | a zip→day table, fixed when the visit is created | **the optimizer**, free inside a deadline |
| **Sequence / time** | the optimizer | the optimizer (correct today) |
| **How often we drive to a far region** | the zip table, as a side effect | **an explicit region cadence rule** |

Consequences that follow directly:

1. **The day is spent before the route exists.** The biggest lever on miles and on full days — *which
   day a visit happens* — is consumed by a lookup table. Four-hour days beside nine-hour days, and
   three separate approaches to Redmond, are what that produces.
2. **Two systems both own day and tech,** so every tool in this folder is a translator between them
   (`push-week`, `drift-check`, `grid-tech-realign`, `jobber-to-optimo-sync`, `move-order`). On
   2026-08-04 three of them ran in opposite directions in one evening. Nothing was broken; two
   databases disagreed and Spencer refereed. That is the daily headache, and it is structural.
3. **Re-cutting the grid is a mass customer handover.** v1→v6 in four weeks. Each re-cut silently
   moves hundreds of customers to a different tech. This is the direct cause of the 50% continuity
   figure, and it is invisible at the time it happens.
4. **Nothing owns the start of the day.** 22% of miles are commute. Sequencing cannot touch that; it
   is set by which tech gets which cluster — decided by the table.

### What the grid was actually for

The v2 architecture agreed 2026-07-10 already specified the right model:

> **Territory lock:** `assignedTo.serial = <Jobber tech full name>` — hard constraint; the optimizer
> can never hand a job to a different tech.
> **Day flexibility:** regular visits get `allowedDates {from: today+1, to: +7}` (any day that week).
> Sets are date-fixed.

The `--grid` layer was added 07-11..07-22 to fix a real and different problem: **far-south and
far-north need a guaranteed rhythm** (2×/week) instead of being visited by luck. That is a coverage
requirement, not a routing rule — and it only applies to distant, thin regions. It got applied to all
126 zips, which suppressed the day flexibility everywhere.

`extend-horizon` (built 08-04) then planned forward weeks through `push-week --grid` **without** the
tech lock, so the optimizer reassigned freely — producing the 160-stop Cory↔Luke territory swap.

## 3. Proposed model

Each decision gets exactly one owner.

### 3.1 Tech follows the customer

- The tech for a visit is **whoever last served that property**. Stored on the customer, derived from
  visit history, not from a zip.
- Passed to OptimoRoute as a **hard constraint** (`assignedTo.serial`) so the optimizer can never
  reassign — restoring the original v2 rule.
- **New customers** are assigned at booking: whichever tech's existing routes pass nearest, subject to
  capacity.
- **Reassignment is deliberate and individual**, never a side effect of a table change. A tech leaving
  the field is the obvious legitimate case (Robert, Spencer).

### 3.2 Day is a deadline, not an assignment  *(this is the "due window" idea, restated)*

Today every visit is stamped with an exact day the moment it is created. Instead, each visit carries
**two dates: the earliest it may happen, and the date it must happen by.** The optimizer places it on
whichever day inside that range is cheapest to reach.

The cadence rules Spencer already set define the widths:

| Last visit outcome | Meaning | Proposed window |
|---|---|---|
| Caught ≥1 mole | property is active | due within ~7 days |
| `M/A` moderate activity | active | due this week |
| `L/A` light activity | quieting | due within 1–2 weeks |
| `N/A` no activity | quiet | due within ~2 weeks |
| **SET** (first visit) | customer was promised a day | **exact date, no float** |

A visit does not move once it has been driven to; it moves only before it is slated. SETs never float.

### 3.3 Region cadence — the grid's surviving job

For distant, low-density regions only (Thurston/Olympia, the peninsula, Enumclaw plateau, far north),
an explicit rule: *this region is served on N specific days per week.* Everything in that region
batches onto those days. Dense core regions carry no day rule at all and float freely.

This keeps the guarantee the grid was invented for, on the ~20% of the map that needs it, without
freezing the other 80%.

### 3.4 One direction of truth

- **Jobber owns:** customer, property, cadence intent, SET dates, the assigned tech.
- **OptimoRoute owns:** day, sequence, time.
- Plans flow **one way**: OptimoRoute decides → Jobber receives.
- Nobody hand-edits day in Jobber. Drift becomes structurally impossible and the reconciliation tools
  are retired.

## 4. Open decisions — to talk through before anything is built

1. **How hard is continuity?** Never reassign an existing customer? Or allow it when the customer sits
   more than X minutes outside that tech's normal ground? And: **do we restore the 110 broken pairings
   for next week, or let them stand?**
2. **Cory's role.** He carries the most stops (112) *and* the worst commute (36%) while also being the
   person who covers field problems. Should he be deliberately planned lighter — say a 6-hour target —
   so he has capacity to absorb issues? Or should the reserve be an explicit block in his day?
3. **Four-day field week?** ~133 h of work across 4 techs is roughly 4 days each at 8 h. Do we want
   Friday as a deliberate flex / emergency / overflow day, or keep 5 lighter days?
4. **Which regions get a fixed rhythm, and how often** — the grid's surviving job. Needs Spencer's map
   knowledge, not a calculation.
5. **Confirm the window widths** in 3.2.
6. **New-customer assignment rule** — nearest existing route, or nearest tech home, or lightest tech?
7. **Re-plan rhythm.** Spencer 08-04: *"I don't care if it's frozen… the route changes all the time."*
   That allows a nightly full re-plan. Arrival windows would then be sent evening-before or
   morning-of so they are accurate.
8. **Guardrails** — what should abort a run rather than write? (Proposed: any SET moved off its date,
   any continuity break not explicitly approved, any day over N hours, >X% of a day moved.)
9. **Scorecard** — the numbers in §1 become the acceptance test.

## 5. How it ships

1. Build the planner as a **parallel dry run** against a real week.
2. Publish the §1 table for both the current plan and the proposed plan.
3. Ship only if it wins on miles, day-length spread, repeat approaches, and continuity.
4. Retire on success: the `--grid` day pinning in `push-week`, `lock-techs-to-grid`,
   `grid-tech-realign`, `jobber-to-optimo-sync`.
5. Keep: `drift-check` (new bookings only), `arrival-window-sweep`, `move-order` (manual exceptions).

## 6. Tools built 2026-08-04 that stay useful as measurement

- `grid-alignment-audit.mjs` — three-way Jobber / OptimoRoute / grid diff
- `area-frequency.mjs` — repeat approaches, stops, miles, minutes per tech-day
- `continuity-check.mjs` — upcoming tech vs. who actually served the customer
- `commute-audit` (scratch) — first-leg miles as a share of total
