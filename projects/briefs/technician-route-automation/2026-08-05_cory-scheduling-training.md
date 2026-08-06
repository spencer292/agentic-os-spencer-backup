# Jobber for Cory — Approved Quote to Scheduled Job

**For:** Cory · **Date:** 2026-08-05
**Scope:** you own scheduling for **brand-new customers** — a quote gets approved, you turn it
into a job that lands on the right day with the right tech.

Muhammad builds the client and sends the quote. Existing customers — next visit, reschedules,
someone on file with nothing booked — stay with Muhammad off the address lookup. **New approved
quotes are yours.**

Everything in here is measured off how the account is actually being built right now, including
what's currently being built wrong.

---

## Why this job exists

I audited the last 45 jobs created since the new territory grid went live on 2026-08-01:

| What should happen | How often it does |
|---|---|
| Job recurs on the day we're actually in that zip | **64%** |
| Job assigned to the tech who owns that zip | 80% |
| First visit marked `(SET)` | 84% |
| New TMCP gets 5 weekly visits before going monthly | **50%** |

The two weak ones are the two that cost money. A job recurring on the wrong day means a truck
leaves its territory for one stop, or the visit gets dragged onto another day and the customer
hears a date that doesn't happen. A TMCP customer who skips the weekly ramp goes straight to
monthly visits while their moles are still active — which is not the program we sold them.

**Getting those two right is the whole job.**

---

# The daily loop

1. Open **Quotes → Approved** in Jobber. These are customers who said yes and are waiting.
2. For each one: look up the route day and tech, then convert it to a job.
3. Check it against the address lookup.
4. Tell Muhammad it's booked so he can tell the customer if they call.

---

# Step 1 — Look up the day and the tech

**Before you touch the job**, get the property ZIP and look up two things: which day we're in
that area, and whose territory it is.

Use the address lookup: https://claude.ai/code/artifact/20e073bc-db4d-4f9c-b49e-9adc55725fba

Or the territory card at the end of this doc.

> **Don't go off the city name.** 16 of the 78 cities we serve are split across different route
> days — Tacoma is on three of them. Bellevue is split between two techs on three different days.
> The ZIP is what decides, never the city.

---

# Step 2 — Build the job

Convert the quote to a job in Jobber (**Convert to Job** on the approved quote). That carries the
line items and pricing over. Then set the schedule — this is the part that matters.

Both products are **Recurring** jobs. Every Got Moles job is recurring; that's not what tells you
which product it is. **The line item tells you the product.**

## The Quick Fix

```
Job type:    Recurring
Recurrence:  Weekly on {the zip's route day}
Duration:    5 visits  (start date -> 5 weeks later)
Tech:        the zip's tech
First visit: title it "(SET)"
Last visit:  title it "(5th Visit)"
```

Five weekly visits, and that's the whole program. The Quick Fix is weekly by construction —
activity codes and catches don't change it.

**When the 5 weeks run out and there's still activity, that is a sales decision, not an automatic
booking.** Don't quietly add a sixth visit. Flag it — either we add one, or we sell them a TMCP or
another month. That call goes to Spencer.

## The Total Mole Control Program

```
Job type:    Recurring
Recurrence:  Monthly on the {nth} {the zip's route weekday}
Duration:    long-horizon (the account uses ~10 years)
Tech:        the zip's tech
First visit: title it "(SET)"

THEN: add 5 WEEKLY visits at the front, before the monthly recurrence takes over.
```

**The weekly ramp is the part that gets missed — half the time.** TMCP promises weekly service
visits until the property is under control, then monthly evaluations once activity stops. If you
set up the monthly recurrence and stop, a customer who is paying for year-round control gets their
second visit a month after their first, while the moles are still working.

A correctly built TMCP looks like this — this is a real one from the account:

```
Aug 6  Thu    <- SET
Aug 13 Thu     |
Aug 20 Thu     |  five weekly
Aug 27 Thu     |
Sep 4  Thu    <-
Oct 2  Thu    <- monthly from here
Nov 6  Thu
```

## Setups are pinned — everything else floats

The first visit (the SET) **stays exactly where you put it.** It does not get pulled onto the
route day by the route system. Every later visit does float onto the zip's day.

So: **book the SET on the zip's route day by default.** If you put a setup on a Tuesday in a
Friday zip, a truck leaves its territory to service one property.

If the customer genuinely needs it sooner, that's fine — but check with Spencer before committing
to an off-route setup, and don't promise the date on the call first.

## What the nightly engine does — so you don't double-book

Since 2026-08-05 an automated job runs at **6:15pm daily**. It reads the day's visit notes and
**books the follow-up visits itself**, based on what the tech actually found:

| What the tech found | What the engine books |
|---|---|
| Caught a mole — any product | Next visit ~1 week |
| TMCP with any activity | Next visit ~1 week |
| TMCP genuinely quiet (`N/A`, no catch, no miss) | Monthly |
| Quick Fix, mid-series | Weekly — it's weekly by construction |
| Quick Fix, 5 weeks done, still active | **A task, not a visit** — sales decision |

**"Activity" is binary — there is no light-vs-heavy ladder.** It's activity if there's fresh
sign, **or** a catch, **or** a miss. A trap that was hit but didn't hold means a mole was working
that run and got away, so the property is not quiet. Going the other way: **old mounds are not
activity** — dried, crusted, grass growing through means moles *were* there. A yard covered in old
sign can still be a true `N/A`.

**So the ongoing cadence is not your job. The initial build is.** You set up the job correctly and
the engine keeps it correct from there.

Two things follow from that:

- **Don't hand-add follow-up visits** to a job that's already running. The engine will add one
  too, and the customer gets two trucks or a duplicate that someone has to delete.
- **The engine will not touch a SET.** It's specifically guarded against rescheduling setups —
  which means a setup you place wrong stays wrong until a human fixes it. Get the SET right.

It's also capped at 25 writes a day and aborts rather than exceed it, so if a big backlog builds
up it stops instead of flooding the calendar. If you see it abort, tell Spencer.

---

# Step 3 — Check the tech is real

> ### ⚠ Never assign a tech who isn't in the field
>
> **Not working:** Spencer Hill (permanently out of field since 2026-07-29), Tavis Alexander,
> Robert Norton (rides along, never his own truck).
>
> **In the field:** Alias Franks, Cory Ventura, Cammeron Anderson, Luke LaVergne.

**This is already a live problem.** As of today there are **68 upcoming visits across 24 jobs
still assigned to Spencer Hill**, starting August 17. Nobody is going to those. They look
scheduled in Jobber and no truck is routed to them.

**Your first cleanup task** — reassign these to the tech who owns the ZIP:

| Job | Customer | City / ZIP | Upcoming | Next |
|---|---|---|---|---|
| #8298 | Melinda Holland | Redmond 98052 | 3 | Aug 17 |
| #8275 | Damien Romanik | Issaquah 98029 | 3 | Aug 20 |
| #8270 | Brian Meadows | Renton 98058 | 9 | Sep 4 |
| #8267 | Matt Kirk | Tacoma 98499 | 2 | Aug 21 |
| #8266 | Darren Mccullough | Ravensdale 98051 | 2 | Aug 21 |
| #8258 | Ken Larson | Fall City 98024 | 9 | Aug 21 |
| #8250 | Donna Youngblood | Bellevue 98006 | 2 | Aug 20 |
| #8249 | John Shepard | Sammamish 98074 | 1 | Aug 19 |
| #8244 | Nora Beckman | Gig Harbor 98335 | 9 | Aug 18 |
| #8243 | Jody Sanders | Maple Valley 98038 | 2 | Aug 20 |
| #8242 | Troy Deimarly | Federal Way 98023 | 2 | Aug 17 |
| #8241 | Tang, Zhaohui | Bellevue 98006 | 2 | Aug 20 |
| #8240 | Joyce Moen | Bellevue 98006 | 2 | Aug 20 |
| #8229 | Mary Yu | Lacey 98516 | 2 | Aug 17 |
| #8228 | Matt Vega | Kent 98042 | 1 | Aug 21 |
| #8226 | Cliff Weiss | Bellevue 98006 | 1 | Aug 21 |
| #8224 | Kelsey Peck | North Bend 98045 | 9 | Aug 28 |
| #8223 | Anastasia Piakarskaya | North Bend 98045 | 1 | Aug 21 |
| #8220 | Lily Tsai | Newcastle 98059 | 1 | Aug 20 |
| #8208 | Jakob Laroche | Graham 98338 | 1 | Aug 18 |
| #8207 | Amy Tang | Newcastle 98056 | 1 | Aug 20 |
| #8206 | Aaron Rutledge | Gig Harbor 98332 | 1 | Aug 18 |
| #8205 | Jake Fox | Graham 98338 | 1 | Aug 18 |
| #8204 | Michael Marquez | Maple Valley 98038 | 1 | Aug 22 |

*Scanned across jobs #8201–#8325. There may be more further back — worth a full sweep once these
are clear.*

**Careful in Jobber:** editing a visit's assigned users **replaces** them, it doesn't add. And
there's no job-level reassign that fixes existing visits — changing the job's default tech does
not move visits already on the calendar. You have to touch the visits.

---

# Step 4 — Verify before you move on

1. **Right day?** Recurrence weekday = the zip's route day.
2. **Right tech?** Matches the zip, and they're actually working.
3. **SET on the route day?** Unless Spencer approved an exception.
4. **TMCP — are the 5 weekly visits there?** Look at the visit list, don't assume.
5. **Check the address lookup tomorrow.** It rebuilds at 6:45am, so something you book at 10am
   shows up the next morning. If it comes back red — "not on the planned route" or "the two
   systems disagree" — the job is booked but no truck is going to it.

**Visit times are placeholders.** The times on visits are not real appointment times and arrival
windows are handled separately. Don't quote a time off a visit.

---

# Capacity

Target is **40 hours a week per tech, 42 is the ceiling.** If a day is already full, don't just
stack another stop on it — an overflowed day means someone gets pushed, and the customer who gets
pushed is usually the one who was booked correctly.

Overflow rule: one job, and only if it's within about a 15-minute detour of the route.

If a day is genuinely over, that's an escalation, not a judgment call you make alone.

---

# Escalate, don't guess

- The 5 weeks of a Quick Fix are used up and there's still activity → **sales decision**
- A customer wants a setup off the route day → **Spencer**
- A route day is over capacity → **Spencer**
- A ZIP that isn't in the grid at all → **Spencer** (there's at least one)
- Commercial or over-5-acre bids → **that's your other job** — in-person, you own it
- The lookup shows red on something you booked → **Spencer**, same day

---

# Territory card

Grid v5, effective 2026-08-01. Ask before working from an older copy.

**Alias Franks — north (Seattle north, Eastside, Snoqualmie Valley)**

| Day | Area |
|---|---|
| Mon | Bellevue, Kirkland, Medina |
| Tue | Seattle, Shoreline |
| Wed | Bothell, Carnation, Duvall, Kenmore, Woodinville, Monroe, Snohomish |
| Thu | Redmond, Sammamish |
| Fri | Fall City, Issaquah, North Bend, Snoqualmie |

**Cory Ventura — south King**

| Day | Area |
|---|---|
| Mon | Federal Way, Pacific, Burien, Normandy Park, Milton, Tacoma |
| Tue | Seattle, SeaTac |
| Wed | Kent, Renton |
| Thu | Bellevue, Mercer Island |
| Fri | Bellevue, Renton |

**Cammeron Anderson — south, east half**

| Day | Area |
|---|---|
| Mon | Auburn, Edgewood, Sumner |
| Tue | Black Diamond, Enumclaw, Ravensdale |
| Wed | Buckley, South Prairie, Wilkeson |
| Thu | Orting, Bonney Lake |
| Fri | Maple Valley, Kent |

**Luke LaVergne — south, west half (I-5 Tacoma, Puyallup, Thurston, peninsula)**

| Day | Area |
|---|---|
| Mon | DuPont, Steilacoom, Tacoma, Olympia |
| Tue | Puyallup, Edgewood, Tacoma, Fife |
| Wed | Bremerton, Gig Harbor, Fox Island, Port Orchard, Olalla, Vaughn, Tacoma, Fircrest, University Place |
| Thu | Olympia, Tenino |
| Fri | Eatonville, Graham, Roy, Yelm |

*Cities appear under more than one tech — Bellevue, Tacoma, Kent and Auburn are all split. **Always
resolve by ZIP, never by city name.***

---

## The card

**Look up the ZIP → get day + tech · Quick Fix = weekly ×5 · TMCP = 5 weekly THEN monthly · SET is
pinned, book it on the route day · Never assign Spencer, Tavis or Robert · Check the lookup the
next morning**

*You build the job. The 6:15pm engine keeps the cadence. Don't hand-add follow-ups.*
