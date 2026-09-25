# Design under review — Got Moles route engine

You are reviewing an ARCHITECTURE ARGUMENT, not code. Be adversarial. Your job is to find
where the reasoning is wrong, unsupported, or where a materially better option was missed.
Do not be agreeable. If a claim does not follow from the evidence, say so.

NOTE: `~/.codex/AGENTS.md` on this machine is stale (last updated 2026-08-01, missing ~18
rule changes). Ignore it for domain rules. The current rules are stated inline below.

---

## Business context

Got Moles: mole control, Washington State. ~5,000 clients. 5 field techs. Jobber is the
system of record (jobs, visits, clients). OptimoRoute is the route optimizer + review map +
driver mobile app. Techs visit properties, check/reset traps, and the next visit's timing
depends on what they found.

## Current domain rules (as of 2026-08-10, authoritative)

- Product comes from the job's LINE ITEM, never `jobType` (all jobs are "Recurring" in Jobber).
  `total mole control` -> TMCP. `quick fix` -> Quick Fix (a 5-week weekly series).
- Activity is BINARY. L/A, M/A, H/A all mean the same thing. Activity = fresh sign OR a catch
  OR a miss (trap hit but didn't hold). Old dried mounds are NOT activity.
- TMCP: any activity or any catch -> next visit ~1 week. Quiet (N/A, no catch) -> monthly.
- Quick Fix: always weekly. When the 5 weeks are exhausted with activity remaining, FLAG a
  sales task — never auto-book.
- Intervals expressed in WEEKS, never days, so a customer never walks off their weekday.
- Add an INTERIM visit; never move the existing recurring visit (moving it relocates the gap).
- Territories are bounded by HIGHWAYS (I-90, SR-18, SR-410, I-705), not zip or city names.
  One tech owns one territory. 5 territories as of 2026-08-17.
- Some highway boundaries cut THROUGH zip codes, so those must be resolved per-address from
  real coordinates (lat/lng), not by zip. Three such lines: thurston-i5-101 (changes DAY),
  bellevue-ne8th (changes OWNER), sr-516 (changes OWNER — the Cory/Robert line).
- Compare tech load by HOURS PER WEEK, never visit count (drive-min/stop ranges 4.5 to 18).
- Target 8h day. Overflow allowed but must be metered — it's the hiring signal.
- Hard constraint: Jobber emails arrival windows at 14:00 PT on D-1. A date locks then.
  Today is never writable.

## Measured evidence (all verified this session)

- 108 scripts in the routing folder; 64 carry their own Jobber OAuth; 43 files contain live
  Jobber mutation calls (visitEditAssignedUsers x17, visitEditSchedule x20, visitCreate x2,
  visitDelete x3, propertyEdit x1).
- The cadence engine (`decide.mjs`) lives in a DIFFERENT project folder from the territory
  logic. It derives its interval only from a free-text "Next Action" field; it parses the
  structured activity/moles fields and then ignores them.
- Rules currently live in 5 places at 3 different vintages: `scheduling-rules.json` (correct,
  but marked DRAFT and read by only 1 non-production script), `territories.json` v9 (live),
  `territory-grid-v5.json` (stale 4-tech map from 08-01, still read every morning by an ACTIVE
  cron that feeds the office phone lookup — it still lists a tech who left on 08-07),
  `CLAUDE.local.md` prose rules, and cron job frontmatter.
- `CLAUDE.local.md` contains a rule dated 07-26 (graded activity ladder: L/A -> 1-2 weeks,
  N/A -> 2 weeks) AND a rule dated 08-05 that explicitly supersedes it (activity is binary,
  any activity -> weekly). Both are still present as readable text.
- Geocoding coverage: the coordinate cache holds 76 addresses total. On next week's board of
  501 visits, 81 sit in a zip governed by a highway split; 56 resolved from real coordinates,
  25 (31%) fell back to a zip guess. 14 of those fallbacks are on SR-516, which decides
  Cory vs Robert ownership.
- Coordinates come from OptimoRoute as a side effect (Jobber returns no lat/lng), so a
  brand-new customer is ALWAYS a coordinate-fallback by construction.
- `territories.json` marks sr-516 `"crossesOwners": false`, while the rulebook and the
  boundary notes both say it changes the OWNER. Three files, two answers.
- Measured tech pace over days actually worked (494 completed visits): Cory 15.3 min/stop,
  Alias 19.7, Luke 20.9, Robert 21.2. A 28% spread. OptimoRoute plans everyone at one
  uniform service time.
- Last week's plan: 205.9 h across 5 techs. Alias 47.9h, Tavis 46.6, Robert 45.2 vs
  Cory 30.9 and Luke 35.2 — a 17h spread that is geographic, not schedulable.
- Historical failures, each found by a human or a lucky audit, none self-reported: a customer
  waited 16 days after two catches; 11 visits stranded on the wrong tech across a handover
  date; 288 of 516 visits left on stale days after a plan was never written back; 8 ghost
  OptimoRoute orders inflating drive time by 189 phantom minutes; an office phone lookup
  mispredicting 58% of service days; three techs routed to Seattle on the same Tuesday.
- n8n is present but its Jobber OAuth credential is DEAD (refresh token invalid) and
  re-authorizing the shared Jobber app would invalidate this machine's token, which route
  automation, the CallRail sync and the lead alert all depend on. This machine is the only
  Jobber token holder.

## The problem being solved

Different Claude Code sessions produce different — and often incorrect — routes for the same
board. The user's hypothesis was "because the rules are scattered across many files."

## My argument (review this)

**Claim 1 — the scatter is a symptom, not the cause.** Consolidating five rule files into one
would not fix session variance, because the routing DECISION is being made by a language model
reading prose and then choosing among 108 scripts. The variance sources are: (a) each session
loads a different subset of rules, (b) superseded rules are still readable, (c) 108 scripts to
choose from, (d) nothing detects a wrong answer. Consolidation fixes only (a) and (b).

**Claim 2 — reject n8n as the execution engine.** The user proposed moving this to n8n with
"a decent prompt and a decent MD file of rules." I argue an LLM node in n8n reading an MD file
is the identical nondeterministic mechanism, relocated — same model, same prose, same drift —
but now unattended and writing to real customer schedules, where today a human can see the
reasoning and stop it. Plus the dead Jobber credential is a hard blocker.

**Claim 3 — rules are data, the decision is code, the LLM is neither.** Route assignment is a
deterministic function: (address, date, product, last visit, activity) -> (tech, weekday, date).
There is no judgment in it once the rules are written down. It should be one pure function with
no API calls and no side effects, so identical inputs always give identical outputs. The LLM's
only legitimate job is turning a tech's free-text note into structured fields ("hit but didn't
hold" -> miss=true), plus explaining an exception list to a human.

**Claim 4 — five components.** (1) one versioned rules store; (2) a pure decision engine;
(3) a golden-fixture regression suite; (4) an INDEPENDENT verifier that gates every write;
(5) a run ledger recording inputs, rules version, every decision, and the PREVIOUS value of
every write so runs are reversible.

**Claim 5 — the verifier must not share code with the planner.** If the verifier calls the same
territory-resolution function the planner used, it validates its own bugs. It should read the
finished plan plus the rules and assert invariants independently. Any hard failure = zero
writes, not warn-and-continue.

**Claim 6 — two separate checks on the rules themselves.** A LINTER for internal coherence
(every zip in exactly one territory; every referenced tech exists and is active; every
geoSplit's crossesOwners flag agrees with whether the two sides actually have different owners;
no superseded rule still present) AND golden FIXTURES for correctness against reality. A
coherent rulebook can still be wrong.

**Claim 7 — the learning loop is "every defect becomes a fixture."** Capture inputs -> human
adjudicates the right answer -> write a failing fixture -> change the RULES FILE (data, not
code) -> re-run ALL fixtures -> log the change. Step 5 is what makes a silent rule conflict
impossible: the 07-26 rule would have failed the moment 08-05 landed, forcing explicit
retirement.

**Claim 8 — keep OptimoRoute as the solver; bring GEOCODING in-house.** OptimoRoute is a VRP
solver plus a review UI plus a driver app that techs already use; Google Maps is geocoding plus
a distance matrix and is not a solver. They are not alternatives. But geocoding must become
ours (~$25 one-time for 5,000 addresses via Google Geocoding) because territory ownership
depends on coordinates and we currently borrow them from OptimoRoute as a side effect, which
guarantees every new customer is a fallback.

**Claim 9 — the trigger to outgrow OptimoRoute is specific:** when uniform service time becomes
the binding constraint (given the measured 28% pace spread plus acreage-scaled durations), at
which point OR-Tools models per-driver and per-property duration exactly. That is a solver swap
behind the same interface, not a rebuild. Not now.

**Claim 10 — build estimate:** rules + engine + fixtures + verifier + ledger is roughly 2-3
weeks of focused work. Replacing OptimoRoute's solver and driver app would be months and is
not advised.

**Recommended first step:** build the verifier alone, read-only, and run it against next week's
board. It writes nothing, so it cannot break anything, and it immediately quantifies how far
the live board is from the rulebook.

---

## What I want from you

1. Which claims are WRONG or unsupported by the evidence? Be specific.
2. What did I MISS — a failure mode, a component, or a materially better approach?
3. Is "the verifier must not share code with the planner" right, or is it purity that costs
   more than it earns? Consider that both read the same rules file.
4. Is the pure-function framing actually achievable here, given capacity/packing decisions
   (which stop goes on which day) are combinatorial and depend on the whole set, not one job?
   This is the claim I am least sure of. Attack it.
5. Is the recommended first step (verifier only, read-only) the right one, or is there a
   cheaper/higher-value first move?
6. Anything about the 14:00 D-1 email freeze, reversibility, or the ghost-order problem that
   the design handles badly?

Answer in prioritized order, strongest objection first. Be concise and concrete.
