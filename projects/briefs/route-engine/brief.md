---
project: route-engine
status: planning
level: 3
created: 2026-08-09
supersedes: technician-route-automation (archived, not deleted)
---

# Route Engine — Jobber ⇄ OptimoRoute, iteration 3

Designed with Spencer 2026-08-09. Iterations 1 and 2 are being retired, not patched.

**The bar (Spencer's words):** the week builds itself, and he approves it in ten minutes.

---

## Why 1 and 2 failed

The diagnosis is not "bad code." Two things killed them.

**1. The rules weren't finished being discovered.** In 11 days the cadence rules were rewritten six
times — the graded activity ladder (07-26), a catch overriding the activity code (08-01), *any*
activity meaning weekly and explicitly superseding the ladder (08-05), product coming from the line
item (08-05), Quick Fix always weekly (08-05), a miss counting as activity and old mounds not
counting (08-06). The territory map was re-cut six times: `territory-grid.json`, `v4`, `v5`, `v6`,
then `territories.json` v8.

Every one of those rules was discovered by an audit finding a customer who had been failed — Ashley
Wollam waiting 16 days after two catches; three techs landing in Seattle on the same Tuesday. The
automation was never buggy. It was a faithful implementation of an incomplete rulebook, and each
field discovery invalidated it everywhere at once.

**Consequence for iteration 3: rules are data, not code.** Cadence intervals, territory boundaries,
capacity ceilings and overrides live in JSON that can be read by a human and changed in seconds.
Rule #7 is coming. If absorbing it requires a rebuild, this iteration fails like the other two.

**2. Nothing could tell you it was wrong.** Every failure to date was caught because Spencer noticed
or because an audit happened to run that day: the 16-day wait, 11 visits stranded on Tavis across
the handover, 288 of 516 visits sitting on stale days after a plan was never written back, 8 ghost
OR stops inflating drive time by 189 minutes, the phone lookup mispredicting 58% of service days.
None of them raised a hand. A system that fails silently must be checked by hand — and checking it
by hand is the thing being automated away.

**Consequence: the watchdog ships before the automation.**

Structural evidence from the old folder, for the record: 57 scripts with their own Jobber OAuth, 46
calling OptimoRoute directly, 2 using the shared client, and **66 live mutation call-sites** into
customer schedules (`visitEditAssignedUsers` ×27, `visitEditSchedule` ×26, `visitCreate` ×7,
`visitDelete` ×6). Ninety scripts with opinions, sixty-six of which could move a real customer.

---

## Scope — the first visit was never the problem

Spencer, 2026-08-11: *"In almost all cases I'm manually adding a day when these people are reaching
out... the job has to get approved and we have to manually make it. **The reschedule of the second,
third, fourth, fifth, whatever visits is what needs to be addressed.**"*

The quote must be approved before the job exists, so **visit 1 is a human decision and stays one.**
The office picks the day at intake. That works and is out of scope.

**In scope: every visit after the first.** The one decision this system exists to make is:

> After a visit is completed, book the next one on the right date, the right day of week, and the
> right tech — without breaking the route.

Everything else in this document — OptimoRoute sequencing, the weekly review, the section map — is
packaging around that decision. Keeping this narrow is deliberate: iterations 1 and 2 sprawled to 90
scripts because the target was "build the week's board."

**Why the existing follow-up booker fails at exactly this.** `jobber-visit-followups` is live and
does one fifth of the job:

| The next visit needs | Current booker |
|---|---|
| Right interval | partial — free-text `Next Action` only, so a catch or miss counts only if a tech typed it there |
| Right tech | **missing** — never re-derives ownership. Stranded 11 visits on Tavis across the 08-17 handover. |
| Right day of week | **missing** — no concept of a section's day |
| Room on that day | **missing** — books a date with no view of route capacity |
| Actually running | **missing** — nightly cron logs only; last real execution 2026-08-01 |

## The assignment model — two layers, only one of them drawn

Spencer's original plan was a giant zip map with sections drawn by hand. He identified the flaw
himself on 08-11: *"as we grow and these sections get larger or smaller because we get so many more
jobs in them, we have to constantly be refining what we can do."* That is the six territory re-cuts,
diagnosed from the business side.

**A drawn boundary is a prediction about where work will be. It is obsolete the moment the
prediction is wrong, and re-cutting it moves hundreds of customers off their day at once.**

| Layer | Answers | How it's set | Changes |
|---|---|---|---|
| **Territory** — highway-bounded | which **tech** | decided deliberately by Spencer | only when hiring |
| **Route-day** — emergent | which **weekday** | each job sticks where first placed | never re-cut |

Highways don't move. That is why `territories.json` v8 works where the zip- and city-name versions
failed — I-90, SR-18, SR-410 and I-705 are permanent facts of the geography. That layer stays.

The fragile layer is the day-grid *inside* each territory. It is not drawn at all. **The atom is a
route-day: one tech, one weekday, ~8 hours.** A tech is five of them. Every job holds a sticky
assignment to one route-day — that is its "section." A new job goes to the route-day that already
has work nearby and has room, and then it stays there forever. Sections are what you see when the
board is coloured by assignment; the map is an *output*, and it redraws itself.

Consequences:
- **Day consistency is the default, not a constraint.** Nothing is ever re-cut, so nobody moves.
- **Growth stops triggering redraws.** A new job in a full area lands on the next-best route-day.
- **Hiring becomes a number.** When a route-day can't absorb work inside 8h, the overflow meter says
  so: *"T1 Tuesday has exceeded 8h for six straight weeks, averaging 9.4h, absorbing 23 new customers
  since June."* Hiring creates five new route-days seeded from the fullest ones' outer edges — only
  marginal customers move, never everyone.

**Overflow must be loud.** Spencer chose overflow as the release valve (never turn a customer away,
never make them wait, never bend a territory line). That is the right business call and a silent
failure mode: every individual decision is correct and the day drifts to 9.4h with nobody deciding
it. Which is exactly how T1 reached 40.7h. Every overflow event is therefore recorded — day, tech,
minutes over, causing customer — and that ledger *is* the staffing instrument.

### The load breathes — this is not a mapping problem

A quiet TMCP customer is monthly. One catch later the same customer is weekly: **4× the route
capacity, no new sale, no change in geography.** Across a book where activity swings seasonally, a
route-day that fits comfortably in October is 2–3× over in spring.

No drawn boundary can absorb that, which is why re-cutting never held for long. The churn is a
capacity problem wearing a mapping problem's clothes.

## What we're building

A **weekly route proposal a human approves in OptimoRoute**, plus a **watchdog** that reports when
reality has drifted from the rules.

```
JOBBER            ENGINE              OPTIMOROUTE            ENGINE           JOBBER
(intake)     →    derive        →     plan + HUMAN      →    write-back   →   (record)
                  owner, day,         APPROVES               on "go"
                  cadence adds        in the map UI
```

One loop. One direction. One gate, with a person standing in it.

### Stage 1 — Derive (read-only against Jobber)

- Pull every open visit in the window.
- `owner = territory(address, date)` — resolved from `territories.json` v8, through `geoSplitLines`
  for the three boundaries that cut through zip codes (`thurston-i5-101`, `bellevue-ne8th`,
  `sr-516`), and through `handovers` so the 08-17 Tavis change applies by itself. `jobOverrides`
  win (e.g. #8056 → Spencer).
- Cadence: for each active job, compute the required next visit from **product** (from the line
  item, not `jobType`) and **what the tech found**. Propose an interim add only when the job's
  existing next visit is later than required — never by moving the recurring visit.

**Day-of-week consistency is emergent, never pinned.** Customers should repeat on the same weekday,
but that must not be implemented as a per-job constraint — a board full of little pins is what
fought Spencer in iterations 1 and 2. Instead the **grid assigns a day to geography** and a job
inherits its day from where the property is. Consistency then comes free, and degrades exactly the
way Spencer wants: when a day is full the visit slides to another day in the same territory, and
next cycle it settles back onto the grid day because the ground hasn't moved. `geoSplitLines` is the
same idea at higher resolution (Olympia north of I-5 one day, south the other).

**Therefore every cadence interval is expressed in WEEKS, never days.** Weekly = 1, monthly = 4
(28 days, not 30). A non-multiple-of-7 interval walks a customer off their weekday every cycle: the
07-26 audit found the recurring schedule running a flat **~34-day** interval — 4 weeks plus 6 days —
which rotates a customer through the entire week in six visits and dissolves the neighborhood
grouping faster than any optimizer can rebuild it. Suspected to be a significant, self-inflicted
source of the churn. Measured in Phase 0.

### Stage 2 — Push and plan (OptimoRoute)

- **Prune ghosts first.** Push/sync cannot retire an order, so cancelled or completed visits leave
  stops behind. Nobody reviews a board containing customers no truck is visiting.
- Create/update orders with the tech locked as a hard constraint, priority always `M`, and
  **balancing OFF** — with balancing on, the optimizer hands stops across territory lines during
  review.
- Plan the week.

### Stage 3 — Review (human, in the OptimoRoute UI)

OptimoRoute's own planning UI is the review surface: map, routes, hours per driver, drag a stop to
another day or another truck. No bespoke tool to build, and Cory can own one real product.

Ten minutes is only possible if the engine does the reading. Alongside the map it posts a short
**exception list**: days over 10h, stops that wouldn't place, customers past their interval, visits
on the wrong tech, ghosts pruned, cadence adds proposed. The flags are what make it ten minutes;
the map is how you confirm them.

### Stage 4 — Write back (the only writer)

Triggered by an explicit **"go"** from Spencer, later Cory. Never on a timer, never on silence.
Reads the final OR routes and writes day, time, tech and sequence to Jobber, once.

- **Write-back is an event, never a sync.** The moment anything reconciles OR back into Jobber
  continuously and outside the gate, this is iteration 1 again.
- Hard freeze at **14:00 PT on D-1** — the Jobber arrival-window email. Today is never writable.
  This is now the *only* hard scheduling constraint (see "What we deleted").
- Write ceiling per run; exceeding it aborts with zero writes rather than truncating.
- Anything booked while the plan was under review is **not** written. It goes to the add queue.

### Always on — the watchdog (read-only)

Independent of the pipeline, daily: customers past their cadence interval, visits whose tech no
longer matches their territory, days over 10h, ghost stops, what changed since yesterday, and the
fill rate of the cadence fields per tech. Ships first, risks nothing, and becomes the acceptance
test for every later phase — when the watchdog is quiet, the automation is provably working.

### Mid-week — the add queue

New bookings since the approved plan, each with a proposed slot and what it costs in drive time.
Confirm → same write path. **This becomes Cory's job.**

---

## Decisions on record (Spencer, 2026-08-09)

| | |
|---|---|
| Control | Propose → human approves → engine executes. Nothing writes without an explicit go. |
| Approval surface | **In OptimoRoute**, in its own map UI. Not a bespoke tool, not the terminal. |
| Approval signal | Spencer says go. Never a timer — silence is not consent. |
| OptimoRoute's role | Optimizer *and* review surface. Jobber stays the record. |
| Priority when goals conflict | **Tight routes and sane hours win.** Customers can slide or move days. |
| Day consistency | Jobs should repeat on the **same day of week** wherever possible — but it yields to route tightness. Shifting a visit to a new day to keep routes tight is acceptable. |
| Full day | **~8h target.** Revised down from 9h/10h on 08-11: "if that means I have to hire more people, then I have to hire more people." |
| Route-day overflow | **Allowed, but metered.** A customer is never turned away, made to wait, or moved across a territory line to protect 8h. The day runs long — and every overflow event is recorded so the hiring signal actually fires. |
| Assignment stickiness | Permanent by default. The engine may propose small nudges (~10 jobs) for Spencer to approve. **Never a mass re-cut.** |
| Staffing | **Staff near peak**, so busy season still fits inside 8h days. Requires knowing the seasonal swing — measured in Phase 0. |
| Same-day disruption | **Out of scope.** Sick techs and blown days are Spencer's. |
| Who schedules | Spencer today, sole editor. **Cory takes over review + mid-week adds** once the roster is deep enough. |
| Roster | **Actively hiring.** Territory count is config, not an assumption. A fifth territory must be a data edit. |
| Late bookings during review | Left for the add queue. The plan writes what was approved and nothing else. |
| Success test | The week builds itself; approval takes ten minutes. |

## What we deleted, and why

Spencer's answers removed most of the complexity of iterations 1 and 2. Promised days are not
sacred — "SET" in a visit title is his guess at a day, not a commitment to a customer (confirmed
08-07; only 5 of 516 visits were SET and just 3 were off their region day). Density wins over
cadence at the margin. Same-day chaos is out of scope.

So all of this goes and does not come back: SET pinning, cross-day move reports for customer phone
calls, the delta guard, `intraday-drift`, `eod-reroute`, `late-start-replan`, `move-tech-replan`.
The old system was defending constraints that don't exist. **One hard line remains: the 14:00 D-1
email.**

The touch-ledger from the first draft of this brief is also gone. It existed because humans and the
engine edited the same surface, and Jobber's `Visit` type exposes no `updatedAt`/`updatedBy` to tell
them apart. Moving human editing into OptimoRoute separates them by construction, and the problem
dissolves.

---

## Phases

Each phase is independently valuable and the risky part comes last. No phase ships on my say-so.

**Phase 0 — Measure. Read-only. GO / NO-GO.**
Five questions, answerable from data already on this machine, before a line of engine code:

1. **Does the work fit?** Apply the real cadence rules to what techs actually found and compute
   demanded hours per route-day. Against the new **8h** target — 40h/week per tech — the last
   measurement had territories at **40.7 / 37.7 / 36.2 / 39.0h**, i.e. *at or over capacity already*,
   on an under-served board, before growth and before spring. If confirmed, the board was never
   drifting; it has been overflowing, and no scheduler fixes that.
2. **How big is the seasonal swing?** Spencer chose to staff near peak — which is unactionable
   without knowing what peak is. Pull 12 months of visit volume and measure the activity-driven
   weekly/monthly ratio across the book.
3. **Are the cadence fields usable?** `report-sync` writes `Latest Activity`, `Moles Caught`,
   `Misses`, `Next Action`. The current engine parses them and then ignores them, reading only free
   text. Measure fill rate per tech. If coverage is poor, cadence cannot be driven from structured
   data, and that is a note-convention fix that must land before any engine — no scheduler can infer
   what was never written down.
4. **How consistent are service days today?** What fraction of jobs actually recur on the same
   weekday. This is the baseline the whole design is meant to improve.
5. **What are the real recurrence intervals?** The 07-26 audit found a flat **~34-day** interval —
   four weeks *plus six days*, which rotates a customer through the entire week in six visits and
   dissolves neighbourhood grouping faster than any optimizer can rebuild it. If that is still live,
   it is the cheapest high-impact fix on the board and it is a settings change, not software.

*Deliverable: a capacity model that tells Spencer when the next tech is needed and which route-days
are the pressure points. Useful whether or not any automation ever ships.*

**Phase 1 — Watchdog.** Read-only, daily, writes nothing. Overdue customers, ownership mismatches,
over-hours days, ghosts, drift since yesterday. *Acceptance: it finds the problems Spencer already
knows about, and at least one he doesn't.*

**Phase 2 — Derive + push + plan, no write-back.** The full pipeline up to the review, running
alongside Spencer's hand-work. He reviews in OR and compares to what he'd have built.
*Acceptance: over ~3 days its proposals match his judgement, and where they differ he agrees the
engine is right.* **This phase is the whole bet.** No trust here, no write access.

**Phase 3 — Write-back on "go".** One week at a time. *Acceptance: a full week applied cleanly,
approved in under ten minutes.*

**Phase 4 — Mid-week add queue.**

**Phase 5 — Hand to Cory.** *Acceptance: he runs a week without Spencer opening it.*

---

## Open items

- **Horizon.** Bookings run to 12/31; OR review covers the near weeks only. Far-future visits carry
  a derived owner and grid day but no sequencing until their week comes up. Sizing in Phase 2.
- **Recurring generation stays Jobber's.** The engine places visits and adds interim ones; it does
  not own the recurring baseline.
- **Arrival-window sweep stays running** through all phases — narrow, well-behaved, customer-facing.
- **The office service-day lookup** currently predicts off stale grid v5 and mispredicts ~58% of
  days. It gets repointed at the same territory module in Phase 2. A tool that tells a customer a
  day no truck is running is the same failure class as a route on the wrong tech.
- **Archive, don't delete.** The old folder moves to `route-engine/archive/` intact. `territories.json`
  v8 and `geo-side-cache.json` are promoted, not archived. `build-address-day-lookup.mjs` and its
  cron keep running until Phase 2 repoints them, so the phones never go dark.
