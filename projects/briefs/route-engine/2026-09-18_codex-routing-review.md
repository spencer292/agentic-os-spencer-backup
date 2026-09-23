# Routing pipeline review: Codex second opinion, triaged

**Date:** 2026-09-18
**Scope:** Jobber -> n8n -> OptimoRoute -> Jobber routing pipeline. Why no usable weekly plan comes out yet, and what to change.
**Method:** Independent review by OpenAI Codex (model gpt-6-astra, reasoning effort xhigh, 187k tokens) from a numbered bundle of the specs, the core scripts, the write gate, the API clients, the cron specs, and the live n8n exports. Every blocker-level finding was then re-verified line by line against the working tree by a separate Claude pass. Raw Codex output: `2026-09-18_codex-routing-review-RAW.md`. Brief: `2026-09-18_codex-routing-review-BRIEF.md`.

---

## 1. Verdict

The pipeline does not fail because OptimoRoute is the wrong tool or because n8n is misconfigured. It fails because **three different scripts implement three different answers to "who decides the day and the tech"**, and the chain that extends the horizon picks the most dangerous combination: an unlocked push into an `ON_FORCE` plan whose assignee is then written back into Jobber. On top of that, the writers apply saved plans without re-reading the board, five of them have no 14:00 freeze check at all, and success is reported even when writes fail. n8n is not in the loop at all and should be archived.

The good news: the correct patterns already exist in this codebase (freeze check in `jobber-to-optimo-sync.mjs`, day-move refusal in `write-times-from-plan.mjs`, per-order driver lock in `rebalance-week.mjs`). They were never applied consistently. Getting one trustworthy week out is a narrowing job, not a rebuild.

## 2. Live state measured today (ground truth, not from the docs)

| Signal | Measured 2026-09-18 |
|---|---|
| n8n routing workflows | All 6 inactive. Zero executions ever. Last edited 2026-07-10. Only active n8n workflow is an unrelated bare webhook. |
| OptimoRoute planned horizon | Routes through Fri 2026-09-25 only. 2026-09-28 to 2026-10-09 (10 weekdays) unplanned. Target is 21 days. |
| `extend-horizon.mjs dry` | ABORTS on `optimize-plan.json` (window 09-15..09-20, 332 writes). |
| Was that plan applied? | **Yes.** Ledger 2026-09-14: `optimize-week.mjs` 332 `visitEditSchedule` ATTEMPT + 332 APPLIED (Jobber body-checked, http 200), 18:36 to 19:05Z. The abort is a bookkeeping stall, not a Jobber/OptimoRoute disagreement. |
| Write gate | `writesEnabled=false`, "Revoked", 2026-09-17 18:45Z. One standing grant (arrival-window sweep, jobEdit only). |
| Last live routing writes | 2026-09-17: `rebalance-week.mjs` 3,476 ledger lines, `push-week.mjs` 958, `assign-by-territory.mjs` 406, under Spencer's time-boxed grant. |
| Routing crons | drift-check retired, horizon-extend disabled, visit-followups disabled (all by Spencer's decision). Arrival-window sweep active. |

## 3. Root causes, ranked (Codex, verified)

1. **DESIGN: competing scheduling authorities.** `push-week` creates orders with no driver lock (there is no `assignedTo` anywhere in the file and no flag to add one). `optimize-week` defaults balancing to `ON_FORCE` and writes the optimizer's chosen tech back to Jobber. `jobber-to-optimo-sync` does the opposite and preserves Jobber's day and tech. `extend-horizon` chains the first two. Verified: `push-week.mjs:14`, `optimize-week.mjs:199`, `optimize-week.mjs:378-380`, `extend-horizon.mjs:145-146`.
2. **DEFECT: approval does not protect the approved state.** Writers apply disk snapshots without re-reading Jobber, cross the 14:00 freeze, partially succeed and still exit 0. Verified B02, B03, B10 below.
3. **DATA: the planning inputs describe conflicting businesses.** The territory file, the as-built board (60% owner agreement, 52% weekday agreement per the 09-17 Ferry review) and the rules file disagree. That needs adjudication by Spencer, not automatic enforcement by `assign-by-territory live`.
4. **OPERATIONAL: no completion or recovery state.** A plan applied by standalone `optimize-week write` leaves no trace, so the next horizon run aborts on it forever. That is exactly today's abort. Verified B09.
5. **DESIGN: "planned" is mistaken for "usable".** One routed stop makes a day count as planned; unrouted visits and ghosts are advisory; the hours ceiling only prints. Verified B12.

## 4. Confirmed defects (line-verified)

| ID | Sev | Finding | Verdict | Where |
|---|---|---|---|---|
| B01 | Blocker | `drift-check fix` locks existing orders to the OptimoRoute date and writes it back, reversing a manual Jobber day move once a new booking lands on the old day. (Cron is retired; logic still in the file.) | CONFIRMED | `drift-check.mjs:368,372,413-421` |
| B02 | Blocker | No freeze check at all in `rebalance-week`, `write-times-from-plan`, `assign-by-territory`, `replan-day`, `set-driver-days`. `optimize-week` checks once, before the loop, destination date only. | CONFIRMED | `optimize-week.mjs:363-364`, grep zero hits in the five |
| B03 | Blocker | `optimize-week write` executes the saved plan with no Jobber refetch. `write-optimo-times` is documented as a times writer but writes the OR **date** when it differs from Jobber. | CONFIRMED | `optimize-week.mjs:335`, `write-optimo-times.mjs:95,99` |
| B04 | Blocker | Horizon chain = unlocked push + `ON_FORCE` plan + assignee write-back. | PARTIAL: substance confirmed; Codex wrongly implied a lock flag exists in push-week, and got the 09-17 balancing change backwards (see section 5) | `push-week.mjs:14`, `optimize-week.mjs:199`, `extend-horizon.mjs:145-146` |
| B05 | Major | All three push paths use `operation: 'SYNC'`, which unschedules a routed order (`scheduling-rules.json:292` records this). A skipped or failed replan leaves it off the route. Nothing uses `UPDATE` for existing orders. | CONFIRMED | `push-week.mjs:293`, `rebalance-week.mjs:428`, `jobber-to-optimo-sync.mjs:302` |
| B08 | Major | `push-week --grid` computes one MONDAY from the window start, so a 2-week window pulls week-2 flexible visits into week 1. Only SET/multi-visit pins escape. | CONFIRMED | `push-week.mjs:204,217-218,285-287,300` |
| B09 | Blocker | Standalone `optimize-week write` never archives the plan; only extend-horizon does, and only after running the writer itself. Cause of today's abort. | CONFIRMED | `optimize-week.mjs:326,335`, `extend-horizon.mjs:127-138,187-190` |
| B10 | Blocker | `push-week`, `set-driver-days`, `optimize-week write` print failures and exit 0; extend-horizon treats 0 as success and archives. | CONFIRMED | `push-week.mjs:356`, `set-driver-days.mjs:78-81`, `optimize-week.mjs:396`, `extend-horizon.mjs:164` |
| B12 | Major | Any positive stop count = "planned"; today is surveyed; an earlier empty weekday makes a later planned day an "intruder" and aborts. | CONFIRMED | `extend-horizon.mjs:83-109` |
| B16 | Major | Ledger stores a 12-char payload digest, no visit id or before/after; swallows its own write failures; treats OptimoRoute HTTP 200 as APPLIED without reading `success:false`; ceiling rejects request N+1 rather than preflighting. | CONFIRMED | `write-gate.mjs:120-124,139-142,155,170-171` |
| B17 | Major | The tool-optimoroute and tool-jobber skill clients never import the write gate and expose `raw` / `query`. The gate is a per-process fetch patch, so anything driven through the skills bypasses it. Only `write-times-from-plan.mjs` imports the gate at all. | CONFIRMED | `optimoroute-api.mjs:61`, `jobber-api.mjs:121`, `write-times-from-plan.mjs:16` |
| B19 | Major | Hard-coded `-07:00` everywhere. No DST-aware helper, no `-08:00` anywhere. Every written `endAt` and every query bound is one hour wrong from 2026-11-01. | CONFIRMED, wider than cited: 84 occurrences in 38 files plus 9 `- 7 * 3600e3` | `optimize-week.mjs:374`, `write-optimo-times.mjs:76,98`, `push-week.mjs:132` |

Codex also reported B06, B07, B11, B13, B14, B15, B18, B20, B21 (rebalance day-selection, series spacing, ghost handling, service-time propagation, crew handling, split-zip fallback, snapshot boundaries, n8n dry-run planning live, overtime-relief heuristics). These were not re-verified in this pass and stand as Codex CONFIRMED / Claude unverified. Full text in the RAW file.

## 5. Corrections to the Codex text before anyone acts on it

- **B04, the 09-17 balancing change is the opposite of what Codex implies.** `rebalance-week.mjs:445-452` deliberately replaced a hard-coded `balancing:'OFF'` with `BALANCING` (default `ON`), and the in-code comment explains why it is safe there: `assignedTo` is set on every order first, so the optimizer can move a stop between one tech's days but cannot hand the customer to another tech. This change is uncommitted. The real exposure is in `extend-horizon`, not `rebalance-week`.
- **B04, there is no driver-lock flag in `push-week`.** Codex's fix ("require a verified driver lock") means adding one, not passing one.
- **B02 mis-cite.** `write-times-from-plan.mjs:69` is the day-move refusal, not a freeze check. The claim that the script has no freeze check still holds.
- **B16 nuance that protects the ledger as evidence.** The `success:false` blind spot is OptimoRoute-only. Jobber responses are body-checked, so the 332 APPLIED Jobber writes on 09-14 are real.
- **B19 scope.** Codex cited 3 sites. It is 38 files. Any fix is a shared helper plus a sweep, not three edits.

## 6. What to do this week (Codex E1, adjusted after verification)

1. **Clear the stall without replaying anything.** Rename `optimize-plan.json` to `optimize-plan.2026-09-15_2026-09-20.done.json` and keep the ledger extract beside it as the receipt. Never pass `--discard-plan`. Never run `optimize-week write` on it.
2. **Make 09-21 to 09-25 the acceptance week, on the existing routes.** Those days are already planned. Do not re-push, do not re-plan. Review hours per tech (first job to last job) and exceptions only.
3. **Extend 09-28 to 10-02 one week at a time through `jobber-to-optimo-sync.mjs`, not `extend-horizon`.** Reasons: it is the one push path that preserves Jobber's day and tech and enforces the freeze (`:242,257`). Before using it, patch two things: use `UPDATE` for existing orders (B05) and pass `visitDate` so per-tech and dated service times reach OR (B13). Run `fetch-window-visits.mjs` then `prune-stale-orders.mjs dry` first, and read the prune list by hand before applying.
4. **Write back times with `write-times-from-plan.mjs` only.** It is the one writer that refuses day moves and imports the write gate. Add a per-mutation freeze check (copy `emailCutoffOk` from `optimize-week.mjs`) before granting it a write window. Retire `write-optimo-times.mjs` (B03).
5. **Do not run `assign-by-territory live` against the current map.** The 09-17 Ferry review shows the map and the board disagree on 6 of 10 handovers. Spencer adjudicates which map wins first (open thread from yesterday).
6. **Grant writes per batch, time-boxed, and reconcile immediately after.** Re-run the same command in dry mode; "0 writes" is the proof it landed.
7. **Stop using** `extend-horizon live`, `push-week` + `optimize-week` as a pair, `rebalance-week live`, `write-optimo-times`, and `drift-check fix`. Keep `drift-check check` (report-only) for the diff.
8. **Archive the six n8n routing workflows.** Exports are saved in `.scratch-n8n/live-2026-09-18/`. Nothing depends on them.

Smallest code changes that unblock the above, in order: B09 (archive on standalone write, 5 lines), B10 (`process.exit(failed ? 1 : 0)` in three scripts, 3 lines), B05 (`SYNC` to `UPDATE` for existing orders in `jobber-to-optimo-sync`), B02 (freeze check inside the write loop of `write-times-from-plan`), B16 (check `success` on OptimoRoute bodies in the gate). B19 is a separate sweep before November 1.

## 7. How to know it worked

| Check | Pass condition |
|---|---|
| Visit coverage | Every eligible Jobber visit in the week has exactly one OR stop; zero ghosts after prune. |
| Day and tech agreement | Zero unapproved Jobber-vs-OR date or primary-tech differences. |
| Working hours | First-job to last-job per tech per day, commute excluded; every day over 8h explicitly accepted by Spencer. |
| Territory integrity | Zero unexplained off-territory stops against the map Spencer picks; split-zip fallbacks listed, not hidden. |
| Freeze and weekdays | Zero Sat/Sun visits; zero mutations to frozen dates. |
| Horizon | Zero unexplained unplanned weekdays through 10-09. |
| Idempotence | Unchanged rerun proposes zero writes. |
| Ledger | Every OR write has a body-checked `success:true`; every Jobber write has a visit id (after B16 fix). |

## 8. Questions only Spencer can answer

1. Which map wins for the acceptance week: territories.json v9 or the as-built board? Reconciliation triggers a mass reassignment otherwise.
2. What daily hours excess is acceptable for the trial, with Cory reported separately as salaried?
3. What start/end location and earliest first-job time per driver? Commute assumptions distort both sequencing and capacity.
4. Which visits carry a genuine customer time restriction beyond the standard 3-hour window?
5. Can Jobber edits to the affected week pause during each approved write batch? A reread alone cannot close the race.
6. Should the 25-write ceiling in `scheduling-rules.json` stay per batch, or become a per-week ceiling? The authority file currently says 2,000.

## 9. Limits of this review

- Codex had no shell on this machine (its PowerShell calls are rejected by its own execution policy), so it reviewed inline source. Failure cases are constructed, not executed. The Claude verification pass read the working tree directly.
- Not in the bundle: `rebalance-overflow.mjs`, `analyze-route-quality.mjs`, snapshot/restore scripts, the full tails of `territories.json` and `territory-grid.json`. Findings that depend on them are marked SUSPECTED in the RAW file.
- No live OptimoRoute driver settings (homes, work windows) were inspected. Codex flags them as a suspected, unverified input.
- This is one of two parallel reviews. The Claude-side review in the other session covers capacity (205.9h against a 200h ceiling) and the live probes; the two should be read together.
