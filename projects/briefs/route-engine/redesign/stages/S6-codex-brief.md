# Review brief: Got Moles route-engine REDESIGN (design + backtest)

You are an independent senior reviewer: vehicle routing / field-service scheduling plus integration engineering. You have NO file or shell access; everything you may cite is in this bundle, with line numbers. Cite `bundle file:line`. Never invent a file. Budget: about 45 minutes. Be willing to say the design is wrong. No praise, no summary of what you read. US English.

## Context
Got Moles: mole-control company, Western Washington. Five field techs, ~600 customer visits a week, ~120 stops a weekday, Mon–Fri. Jobber is the CRM and system of record for visits; OptimoRoute sequences days; FleetSharp (Linxup) GPS on the trucks is being connected. Customer arrival-window texts leave Jobber at 14:00 PT the day before, so a day freezes then.

Ten weeks of a previous pipeline produced no plan the owner would run. Your predecessor review (Codex, 2026-09-18, on the OLD pipeline) found competing scheduling authorities, no approval-protected state, conflicting inputs, and 21 code defects. The owner then said: ignore the old rulebook, derive a new system from the data, backtest it against weeks that ran well, and get it reviewed.

The bundle contains, in order: S4 the design; S2/S3a/S3b the measured findings it rests on; S5 the backtest harness description and results including the design's own policy (`week-solve`); the harness source and policies; the travel model notes. Data files are summarized in the stage docs, not included.

## Owner-fixed facts (not up for review)
Five techs and their homes; Mon–Fri; the 14:00 D-1 freeze; products as sold (TMCP monthly, weekly when active, Quick Fix = 5 weekly visits then a sales decision); the owner does no field work beyond one Tuesday route. Zero automated writes until proven.

## What I want, in this structure

### A. Is the model right? (one page)
S4 claims the business has a master TERRITORY (customer → tech) not a master ROUTE (customer → tech + weekday), and that weekday should be solved weekly inside a due window under capacity and compactness costs. Argue for or against from the evidence in S2/S3/S5. Name what the model gets wrong, what it leaves undefined, and what a Rollins/Terminix-style operation would do differently at this size.

### B. The week-solve policy (concrete)
For each of: owner map without lookahead, day-zones (k-medoids, k=5), due windows, the cost function and its weights, the hard wall, overflow handling, the add-queue — say whether it is sound, what input it silently depends on, and one concrete case where it produces a bad week. Cite the harness code where the implementation deviates from S4.

### C. The backtest
Is the harness a fair test? Check: as-of-Friday reconstruction, the join key, lookahead leaks, the scorecard gates in S4 §5, the sequencer comparison (the travel estimator covers only ~12% of pairs; whole-route error ~2%, per-leg ~20%). Say whether the reported scores support the claims, and what test is missing before a live shadow run.

### D. Cadence policy P2 and capacity
S3b says weekly-after-any-activity fits 200 h with 11 route-days over 8 h. Is that arithmetic trustworthy given the cycle-time method (span/stops from completion stamps)? What changes when FleetSharp replaces stamps? Is the float-tech idea sound?

### E. What would you build first, and what would you refuse to build
Ranked by value/effort, at most eight items, each one sentence with the reason. Include what to keep from the old pipeline, if anything.

### F. Questions only the owner can answer
Max 6, one sentence each, with why it matters.

Rules: cite `file:line` from the bundle for every claim about the design or code; quote at most 3 lines per finding; mark anything you could not verify from the bundle as SUSPECTED.
