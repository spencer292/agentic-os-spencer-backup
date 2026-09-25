---
project: route-engine
status: draft-for-signoff
level: 3
created: 2026-08-15
supersedes: partially amends brief.md (2026-08-09) — see "What changed since v1"
reviewed_by: Codex (gpt-5.6-sol), adversarial pass 2026-08-14
---

# Route Engine — Specification v2

The v1 brief (2026-08-09) diagnosed why iterations 1 and 2 failed and set the shape of
iteration 3. This document is what changed after two things happened: a full audit of where the
rules actually live, and an adversarial review that overturned several claims in v1 — including
two of mine.

**The bar is unchanged (Spencer's words):** the week builds itself, and he approves it in ten
minutes.

**What this document is for:** it is the single design reference for the route engine. When it
disagrees with a prose rule in `CLAUDE.local.md`, a comment in a script, or a memory note, this
document and `rules/scheduling-rules.json` win — and the loser gets corrected, not left standing.

---

## What changed since v1

Five corrections, listed first because three of them were errors of mine and one materially
changes the build.

| # | v1 said | Correct as of 2026-08-15 |
|---|---|---|
| 1 | `decide.mjs` reads only free-text `Next Action` and ignores the parsed activity fields | **Wrong.** It reads `product`, `activity`, `moles` and `misses`, implements the binary-activity rule and the miss rule, and falls back to free text only for `OTHER` products |
| 2 | OptimoRoute plans every stop at one uniform service time | **Wrong since 08-11.** Per-tech duration is sent per order; per-place *cluster* pricing added 08-15 |
| 3 | The route decision can be one pure function `(job) → assignment` | **Wrong.** Packing is board-wide and combinatorial. Split into `classify` / `solve` / `diff` |
| 4 | "Google Maps is not a solver" | **Wrong.** Google Maps Platform has a fleet Route Optimization API. It is still not a replacement for the review UI or driver app |
| 5 | Record the previous value of each write and runs become reversible | **Overstated.** There is no cross-system transaction and arrival emails cannot be recalled. Compensating writes, not rollback |

Corrections 1 and 2 share a cause worth naming: **both were true when the rule was written and
false by the time it was read.** `CLAUDE.local.md` still carries a rule dated 2026-08-05 saying
the engine ignores the structured fields (fixed 08-06) and one dated 2026-08-10 saying not to set
per-driver service times (Spencer set them 08-11 and revised them 08-15). Prose rules with no
expiry are how a fixed problem keeps being reported as broken.

---

## Part 1 — Diagnosis

### The presenting symptom

Different sessions produce different, and often incorrect, routes for the same board.

### The causes, in order of contribution

**1. Rules live in six places at three vintages.** Verified this session:

| Location | Vintage | Status |
|---|---|---|
| `route-engine/rules/scheduling-rules.json` | 2026-08-09 | Correct in substance, marked **DRAFT**, read by one non-production script |
| `technician-route-automation/territories.json` v9 | 2026-08-12 | Live. What the pipeline actually reads |
| `technician-route-automation/territory-grid-v5.json` | 2026-08-01 | **Stale.** Still read every morning by an active cron |
| `CLAUDE.local.md` → `## Rules` | 07-22 → 08-10 | Prose. Contains at least two rules now false, and one superseded rule sitting beside its replacement |
| `cron/jobs/*.md` frontmatter | mixed | Guards and disable reasons |
| Claude's own memory files | mixed | e.g. "Tavis on Snoqualmie is intentional" — a real operating exception recorded nowhere else |

**2. The decision is made by a model reading prose, not by a program reading data.** There are
**108 scripts** in the routing folder, **64** carrying their own Jobber OAuth, and **43** containing
live mutation calls (`visitEditAssignedUsers` ×17, `visitEditSchedule` ×20, `visitCreate` ×2,
`visitDelete` ×3, `propertyEdit` ×1). Each session loads a different subset of rules and selects
from — or adds to — that pile.

*Honest caveat:* this mechanism is plausible and consistent with the evidence, but it has **not
been measured**. Proving it means replaying several sessions against one frozen board snapshot and
diffing the outputs. Until that is done, treat cause 1 as established and cause 2 as probable.

**3. Nothing detects a wrong answer.** Every failure to date was found by a human or a lucky audit:
a customer waiting 16 days after two catches; 11 visits stranded on the wrong tech across a
handover; 288 of 516 visits left on stale days after a plan was never written back; 8 ghost
OptimoRoute orders inflating drive time by 189 phantom minutes; an office lookup mispredicting 58%
of service days; three techs routed to Seattle on one Tuesday. **None of them raised a hand.**

### The correction to v1's framing

v1 said scatter was a symptom rather than a cause. That was too strong. The office phone sheet
reading a dead map is a scatter failure with no model involvement at all — a cron passing a stale
filename, nothing more. **Both causes are real and they need different fixes:** consolidation fixes
the first, determinism fixes the second, and detection fixes the third.

---

## Part 2 — Current state of truth

Verified 2026-08-14/15.

### What is running

| Cron | State | Note |
|---|---|---|
| `jobber-arrival-window-sweep` | **active** | Writes. 3-hour windows, twice daily |
| `service-day-sheet-refresh` | **active** | Reads `territory-grid-v5.json` — **defect, see D1** |
| `route-drift-check` | off | Retired 08-12. Only Spencer re-enables |
| `route-horizon-extend` | off | Disabled 08-12 |
| `jobber-visit-followups` | off | Disabled 08-12 — turns off **both** the report-sync and the follow-up booking |

With follow-up booking off, **no next visit is booked automatically.** Cadence is entirely manual.

### The board as routed for the week of 08-17

205.9 h across five techs. Alias 47.9, Tavis 46.6, Robert 45.2, Luke 35.2, Cory 30.9.

**Against five techs at 8 h/day the nominal ceiling is 200 h.** The board is already over it before
growth and before spring. This is the single most important number in this document: **some weeks
have no feasible 8-hour solution, and the engine must be able to say so** rather than quietly
producing a plan that runs long.

### Geocoding coverage

The coordinate cache holds **76 addresses**. On next week's 501 visits, 81 sit in a zip governed by
a highway split: **56 resolved from real coordinates, 25 (31%) fell back to a zip guess.** Fourteen
of those fallbacks are on SR-516 — the line that decides **Cory vs Robert ownership**.

Because coordinates arrive as a side effect of OptimoRoute having seen an address, and Jobber
returns no lat/lng, **a brand-new customer is always a fallback by construction.**

### Service time — already better than v1 assumed

Per-order durations have been sent since 08-11 and are read from one module
(`service-time.mjs` → `tech-service-times.json`). Values directed by Spencer 2026-08-15:

| Tech | Check | Set | Basis |
|---|---:|---:|---|
| Cory Ventura | 12 | 24 | Raised from 10 — measured 12.7 on-site over 19 days |
| Alias, Robert, Luke, Tavis, Spencer | 15 | 30 | Spencer's directed number |

Plus **cluster pricing**: a set of separate jobs at one physical place is priced by the place, not
per job. Barbee Mill (11 jobs inside a 0.18-mile radius) went from 11 × 15 = 2h45m to a declared
120 min shared across the 11.

Still unset: **acreage-scaled duration** (`scheduling-rules.json` → `duration.tiers` are all null).

---

## Part 3 — The architecture

Five components. The shape is unchanged from the design Spencer approved; the internals changed
under review.

### 1. Rules store

One versioned file — `rules/scheduling-rules.json` — signed off and published with a version
number. Every other copy becomes a pointer to it, including the mirrored `~/.codex/AGENTS.md`.

Requirements added under review:

- **Rule identity and lifecycle.** Every rule gets an ID, `effectiveFrom`, and `retiredAt`. A
  linter cannot infer from a comment that one rule supersedes another — the 07-26 / 08-05 pair is
  the proof.
- **No derived data stored.** `crossesOwners` on a geoSplit is currently stored *and* wrong
  (`sr-516` is marked `false` while it decides the Cory/Robert line). Derive it from whether the
  two sides have different owners.
- **Unknown products quarantine, never default.** `"unmatched": "TMCP"` can manufacture an
  unearned interim visit for a product nobody classified.

### 2. Decision engine — three functions, not one

v1's "one pure function" was wrong. The correct decomposition:

```
classify(job snapshot, rules)          → cadence + candidate dates       [pure, per job]
solve(candidates, locks, capacity,     → proposal | INFEASIBLE           [pure, board-wide]
      travel matrix, durations)
diff(approved proposal, fresh snapshot) → guarded writes                 [pure]
```

`classify` is genuinely pure per job and is where the cadence rules live — this is essentially what
`decide.mjs` already does well. `solve` is a board-wide optimizer and cannot be a per-job function:
which stop lands on which day depends on the whole set. `diff` is what makes approval meaningful —
the plan was approved against a snapshot, and the board has moved since.

**Conflicts need weights, not prose precedence.** The current rules genuinely contradict each
other: route tightness outranks cadence, yet overflow policy says a customer is never made to
wait; section-day placement is fixed, yet visits may move day for tightness. A precedence list
cannot resolve these — the solver needs explicit penalty weights and a defined behaviour when no
feasible solution exists.

### 3. Fixtures and property tests

Golden fixtures — real cases with known-correct answers — are the regression net. Added under
review: fixtures only protect the examples they cover. They must be paired with **property tests**
(invariants that hold for all inputs), **boundary-coordinate cases** (addresses near each highway
line), **malformed-input tests**, and **integration-failure tests** (partial batch, expired token,
API timeout).

### 4. Verifier — independent where it counts

v1 said the verifier must share no code with the planner. Refined:

- **Share** schema validation, ID normalisation, time-zone handling, and the canonical rules loader.
  Duplicating primitives creates two engines that drift.
- **Independently implement** the safety invariants, and compute territory ownership a second way.

**The existing verifier proves why.** `route-engine/scripts/verify-v9.mjs` resolves split-zip
regions with `fallbackSide` rather than coordinates (line ~73), then prints *"All structural checks
passed. v9 is safe to cut over."* It signed off Monday's five-way cut while being structurally
incapable of seeing the 14 unresolved SR-516 ownership decisions.

**Failure classes** — "any failure means zero writes" was too blunt. A frozen pre-existing defect
must not block unrelated safe work forever:

| Class | Behaviour |
|---|---|
| **Run-fatal** | Zero writes. Snapshot incomplete, rules unsigned, cutoff crossed, write ceiling exceeded |
| **Record-quarantine** | That record is skipped and queued; the rest of the run proceeds |
| **Advisory** | Logged, does not block. Over-hours days, infeasible-but-accepted overflow |

### 5. Write-ahead ledger

Not "reversible" — **compensable, with preconditions**. There is no transaction across Jobber and
OptimoRoute, batches partially succeed, and an arrival-window email cannot be recalled.

Each intended write is recorded **before** it happens with: expected current value, intended value,
source snapshot hash, approval reference, external IDs. After the write: result and a
read-after-write verification. **Compensation is permitted only when live state still equals what
this run wrote** — otherwise a human or a later run has touched it and restoring would clobber them.

**The cutoff is per-write, not per-run.** A run starting at 13:59 crosses 14:00 mid-batch.
Evaluate the freeze before every individual write, with a margin ahead of the observed email
enqueue time rather than an assumed exact 14:00.

---

## Part 4 — Geo, solver, and duration

### Keep OptimoRoute

It is a VRP solver **plus** a review map **plus** a driver app the techs already use. Replacing all
three is months of work for no gain. Google Maps Platform does have a fleet Route Optimization API
— so "not a solver" was wrong — but it replaces only the first of the three.

**The OR-Tools trigger from v1 is substantially weaker than stated.** v1 said uniform service time
would eventually force a solver swap. OptimoRoute accepts a duration per order and we already send
one per tech, plus cluster pricing. The remaining gap is acreage scaling, which is another input to
the same field. **Test acreage-scaled durations inside OptimoRoute before considering OR-Tools.**

### Geocoding must become ours — with a licensing correction

Territory ownership depends on coordinates and 31% of split-zip stops currently resolve by guess.
That must be fixed. But v1's plan — Google Geocoding, store forever — **breaches Google's terms**,
which generally restrict persistent storage of geocoding results beyond place IDs.

Revised approach:

1. Use a provider **licensed for permanent storage**. For US addresses the Census geocoder is free
   and unrestricted; commercial alternatives exist if coverage proves thin.
2. **Scope it:** properties in split zips, plus new split-zip intake. Not all 5,000.
3. **Quarantine near the line.** A result landing within a defined tolerance of the highway goes to
   a manual-review queue rather than being assigned a side by rounding.
4. Refine the boundary geometry later — the current two-point straight-line approximations of
   curved highways are a real inaccuracy, but **missing coordinates are the defect and line
   geometry is a rounding error.** Coverage first.

---

## Part 5 — The learning loop

The mechanism that has been failing: Spencer notices → a prose rule is appended to
`CLAUDE.local.md` → the contradicting older rule stays → the next session picks one.

### The replacement

1. **Capture** — the exact inputs and the wrong output
2. **Adjudicate** — Spencer states the correct answer. The only human step, and the only one that matters
3. **Classify the defect** — this step is new and load-bearing
4. **Fix at the right layer**
5. **Re-run everything** — all fixtures and property tests
6. **Log** — date, case, rule or code before and after, who decided

**Step 3 exists because "every defect becomes a rule change" is false.** Defects belong to
different layers and fixing the wrong one is how the rulebook accumulates rules that describe bugs:

| Defect layer | Example from this board |
|---|---|
| Rule | Activity should be binary |
| Code | The verifier resolving split zips by fallback |
| Data | 23 addresses never geocoded |
| Parsing | A note that does not yield an activity code |
| Snapshot | Ghost orders; incomplete pagination |
| Operations | A cron passing a stale grid filename |

**Step 5 is what makes silent rule conflict impossible.** The 07-26 graded ladder would have failed
the moment the 08-05 binary rule landed, forcing explicit retirement instead of leaving both in the
file — which is exactly the state the file is in today.

### The loop beyond the rulebook

Rules say what to do; nothing currently says whether the cadence is *right*. That is measurable: a
"weekly" customer returning `N/A` three visits running suggests the interval is too tight; a
"monthly" one active every visit suggests too loose. Not now — but it is the only path from rules
that are asserted to rules that are tuned.

---

## Part 6 — Defects found, in priority order

These are actionable now and independent of the build.

| ID | Defect | Impact | Fix |
|---|---|---|---|
| **D1** | `service-day-sheet-refresh` (active, 06:45 daily) passes `territory-grid-v5.json` — a four-tech map from 08-01 listing Cammeron Anderson, who left 08-07, and stating Robert has no truck | Office quotes service days off a dead map. Customer-facing | Repoint at `territories.json` v9, or at real visit history |
| **D2** | `verify-v9.mjs` resolves split zips by `fallbackSide`, then declares the cut safe | The verifier cannot see the 14 SR-516 ownership decisions it exists to check | Resolve from coordinates; fail on unresolved |
| **D3** | ~~`territories.json` marks `sr-516` `"crossesOwners": false` while the rulebook says it changes owner~~ **DIAGNOSIS WRONG — corrected 2026-08-21.** `false` is CORRECT from 2026-08-17: the handover table (the only thing the code reads) moves "North of SR-516" from Cory to **Robert Norton**, and the south side was already Robert, so from that date the line does not change owner. Flipping it to `true` as prescribed would have been a regression. The real defect was a different stored field: `ownerFrom20260817` claimed **Tavis Alexander** owned "North of SR-516" and "Issaquah South" while the handovers gave both to Robert — 2 of 6 instances wrong, read by nothing | Latent, but it is what produced this wrong diagnosis | **DONE.** Both stored fields deleted; `crossesOwners(T, line, date)` added to `geo-side.mjs` and `geo-cache-build.mjs` repointed. The prescription was right for the wrong reason: ownership moves on handover dates, so it is a function of the date and no stored boolean can be correct in general — `sr-516` crosses owners **before** 08-17 and not **from** 08-17 |
| **D4** | Two rules in `CLAUDE.local.md` are now false (08-05 on `decide.mjs`, 08-10 on service times) and one superseded rule sits beside its replacement | Misled this session; will mislead the next | Correct, date, and mark retired |
| **D5** | 64 scripts independently refresh and persist the **only** Jobber token; this machine is the sole holder for route automation, CallRail sync and lead alerts | Concurrent refresh can invalidate it. No documented recovery path | Centralise behind one client with locking and a health check |
| **D6** | `prune-stale-orders.mjs` aborts only above 50% of orders — on a 500-stop board it permits 250 deletions | Ghost pruning can strip a real week | Small absolute ceiling; two-pass quarantine; re-check after planning |
| **D7** | Undated OptimoRoute orders are invisible to the prune and get pulled into planning | Phantom drive time in an approved plan | Prune after planning as well as before |
| **D8** | 23 addresses have never been geocoded | Silent zip-fallback ownership | Geocode split-zip properties (see Part 4) |

---

## Part 7 — Sequencing

v1 recommended building the watchdog first. That is premature against a draft rulebook with 31%
coordinate coverage — it would produce confident noise. Revised order:

**Step 1 — Contain write authority.** Confirm the disabled crons are genuinely off. Add a global
kill switch. Make one module the only permitted writer. *Nothing else is safe until this holds.*

**Step 2 — Stop the live customer harm.** Fix D1. Cheap, and it is wrong every morning.

**Step 3 — Publish a signed rules version and one immutable board snapshot.** Sign off
`scheduling-rules.json`, resolve its open questions, correct D3 and D4, and capture a complete
paginated snapshot with a hash. Everything downstream references that hash.

**Step 4 — Narrow read-only reconciliations.** Not a broad verifier. Freeze violations, cadence
overdue, ghosts, and ownership **only where coordinates are authoritative** — with an explicit
unresolved-coordinate queue rather than a guess.

**Step 5 — Phase 0 measurement** (from v1, still valid): does the work fit, how big is the seasonal
swing, are the cadence fields usable, how consistent are service days, what are the real intervals.

**Step 6 onward** — `classify` → `solve` → shadow mode → write-back on an explicit go → mid-week
add queue → hand to Cory. Each with its own acceptance test.

### Effort

v1's "2–3 weeks" was an estimate for a **shadow-mode prototype** and should not have been presented
as the cost of the system. Realistically: steps 1–4 are days. Shadow mode is weeks. A production
writer with snapshot isolation, centralised auth, partial-failure recovery, per-write cutoff
enforcement and an acceptance period is materially more, and should be estimated separately once
steps 1–4 have run.

---

## Part 8 — Open questions

Carried from `scheduling-rules.json` and this review. Each needs Spencer.

1. **Acreage duration tiers** are null. Derive from completion timestamps joined to property
   acreage — do not guess them.
2. **Is the Federal Way 98003/98023 loan to Luke still active?** Open since 08-07, no end date.
3. **Cadence field fill rate is unmeasured.** Determines whether cadence can be driven from
   structured fields at all.
4. **A new customer's first visit can land on any day.** Should it settle onto the section day from
   visit 2, or hold the day it was sold on?
5. **How far ahead does the review window run?** Bookings exist to 12/31.
6. **Solver conflict weights.** Route tightness vs cadence vs day consistency needs numbers.
7. **Behaviour when infeasible.** The board is already over nominal capacity. What should the engine
   do — plan long, refuse, or flag and plan long?

---

## Appendix — Review record

Reviewed 2026-08-14 by Codex CLI (`gpt-5.6-sol`, high reasoning) as an adversarial pass against the
v1 design. Ten objections raised. Triage:

| Objection | Verdict |
|---|---|
| Pure-function boundary is wrong; packing is board-wide | Confirmed — Part 3 |
| "Reversible" overstated; no cross-system transaction | Confirmed — Part 3 |
| Verifier independence overdone; existing verifier is broken | Confirmed — Part 3, D2 |
| "Every zip in exactly one territory" contradicts split zips | Confirmed — invariant restated as per-address |
| Verifier-first is premature | Confirmed — Part 7 |
| Google has a fleet solver; geocoding storage is restricted | Confirmed — Part 4 |
| The `decide.mjs` claim was stale | Confirmed — correction 1 |
| Reject prompt-driven n8n, not n8n as orchestration | Fair — see below |
| Ghost deletion needs snapshot isolation | Confirmed — D6, D7 |
| 2–3 weeks is shadow-mode only | Confirmed — Part 7 |

Also surfaced: the concurrent-token-refresh risk (D5), which no prior document had named.

**Overstated by the review:** calling the 50% prune guard "catastrophically permissive" — its
purpose is bad-snapshot detection and that intent is sound; the missing absolute ceiling is the
valid half. And its claim that scatter is a direct cause rather than a symptom is right, but the
two causes are additive rather than alternatives (Part 1).

**On n8n.** Spencer's proposal was n8n driving an LLM prompt against a Markdown rules file. That is
rejected: it is the same nondeterministic mechanism relocated, running unattended against real
customer schedules. n8n as *orchestration around a deterministic service* is a different and
acceptable proposition — but it is plumbing, not a solution to any problem in this document, and
its Jobber credential is dead (re-authorising risks this machine's token, per D5).
