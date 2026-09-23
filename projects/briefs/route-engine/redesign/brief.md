---
project: route-engine-redesign
status: active
level: 3
created: 2026-09-18
parent: route-engine
---

# Route Engine Redesign — from-scratch design, backtested against weeks that worked

**Goal (Spencer, 2026-09-18):** ignore the current rulebook. Derive a new routing system — rules, structure, data model, pipeline — from the data: client contracts, 2,793 completed visits (08-17..09-17), the OptimoRoute routes actually driven with distances and durations, FleetSharp vehicle GPS (true on-site / drive / day span), Gusto timesheets (paid hours = the success metric). Validate the design with Codex (gpt-6-astra). Prove it by backtest: feed the system only what was known the Friday before a golden week and check it reproduces the routes that ran.

**Zero writes.** Nothing in this goal writes to Jobber or OptimoRoute. Write gate stays `writesEnabled:false`. Backtest sequencing runs offline on a travel matrix built from legs OptimoRoute already drove.

## Decisions taken (defaults accepted by Spencer 2026-09-18)

1. **Fixed facts, not up for redesign:** five techs and their homes; Mon–Fri; the 14:00 PT day-before freeze; products as sold (TMCP monthly, weekly after a catch, Quick Fix = 5 weekly visits); Spencer does no field work beyond peninsula Tuesday. **Everything else is derived from data:** territory shape, day assignment, the activity trigger for weekly cadence, the hours target, priority order.
2. **Golden weeks:** 2026-08-24 and 2026-08-31 (full weeks, 99% on-day / on-tech adherence). Match target: ≥95% same tech, ≥95% same day, hours per route-day within ±10%, sequence compared by total route distance not stop order.
3. **Backtest sequencing offline** (local VRP over OR-derived travel matrix). OptimoRoute validated later on one real future week, on Spencer's go.
4. **Tech homes:** Cory = Buckley 98321; Robert = Maple Valley; Luke = Puyallup; Tavis = Auburn / Lake Tapps (inferred from route starts, to confirm); Alias = unknown (derive from FleetSharp first-ignition location).

## New inputs

- **FleetSharp API** — key in `.env` as `FLEETSHARP_API_KEY` (+ `FLEETSHARP_API_URL` if account-specific). Raw pulls land in `private/fleetsharp/` (gitignored).
- **Gusto timesheets** — Spencer uploads exports to `private/gusto/` (gitignored). Paid hours per tech per day. Never a per-person pay line in git.

## Stages (each writes its output to disk; a restart resumes at the last completed stage)

| # | Stage | Output |
|---|---|---|
| S0 | Inventory of inputs already on disk (today's audit outputs, notes data, snapshots) | `stages/S0-inventory.md` |
| S1 | Data lake: OR routes as driven 08-17..09-17; Jobber jobs+contracts+visits 08-14..10-16; FleetSharp trips/stops; Gusto hours | `data/`, `private/` |
| S2 | Ground truth: per route-day true span / on-site / drive (FleetSharp) reconciled to stamps and timesheets; success/failure label per week | `stages/S2-ground-truth.md` + json |
| S3 | Derived rules: as-built master (customer → route-day), emergent territory geometry, cycle times, real cadence intervals vs activity, capacity | `stages/S3-derived-rules.md` + `rules.json` |
| S4 | Design: the new system spec written fresh (data model, rules, pipeline, gates) | `stages/S4-design.md` |
| S5 | Backtest harness + run on golden weeks; scorecard | `backtest/`, `stages/S5-backtest.md` |
| S6 | Codex (gpt-6-astra) hostile review of S4+S5; triage | `stages/S6-codex-review.md` |
| S7 | Plan + scorecard for Spencer; published page | `2026-09-XX_redesign-plan.md` |

## Readiness check (given to Spencer 2026-09-18 before start)

- **Needs approval:** the four defaults above (accepted); FleetSharp key + Gusto upload (Spencer providing).
- **Pauses if Claude stops:** all of it — no cron, no workflow. State on disk per stage.
- **Can stall silently:** Jobber throttling (two other sessions pulled today); Codex run without shell (bundle source, one retry); past OR dates with no routes (recorded as gaps, not filled).
