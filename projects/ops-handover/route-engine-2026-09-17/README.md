# Got Moles — route engine handover

Built 2026-09-17. Everything here drives the weekly technician routing for Got Moles: it reads jobs
and visits from **Jobber**, plans them in **OptimoRoute**, and writes the chosen day, time and
technician back to Jobber.

23 code and config files, no credentials, no customer data. See **What was withheld** at the end.

---

## 1. Layout — keep the folder depth

```
<bundle root>/                 <- .env goes HERE
├── .env.example
├── MANIFEST.json
├── .claude/skills/tool-jobber/scripts/jobber-api.mjs
└── projects/briefs/
    ├── route-engine/          <- the safety layer
    │   ├── write-authority.json
    │   ├── lib/write-gate.mjs
    │   └── scripts/
    └── technician-route-automation/   <- the chain + config
```

The nesting is not decoration. Every script finds `.env` with `path.resolve(__dirname, '../../../.env')`
and the write gate finds its state file by walking up from `lib/`. **Move a script out of its
directory and it stops finding both** — the gate fails closed and refuses all writes, which is the
designed behaviour but will look like a broken install.

Requires **Node 18+** (the gate patches global `fetch` and throws without it). Built and run on
Node 24. No `npm install` — there are no third-party dependencies.

---

## 2. Read this before running anything: the write model

Writes are **off by default** and every write is refused unless authority is currently granted.

`lib/write-gate.mjs` patches `globalThis.fetch` and classifies every outbound request to Jobber or
OptimoRoute as READ or WRITE. Reads pass through. A write is refused unless `write-authority.json`
grants it *right now*. It is enforced at the **transport**, not the call site, so a script cannot
sidestep it by adding a new mutation.

```bash
cd projects/briefs/route-engine
node scripts/write-authority.mjs status
node scripts/write-authority.mjs enable --reason "why" --ttl 30m [--ceiling 2000]
node scripts/write-authority.mjs disable
node scripts/check-write-gate.mjs     # proves no writing script is missing the gate
node scripts/test-write-gate.mjs      # 10 containment assertions
```

Three things worth knowing:

- **Grants are time-boxed and lapse on their own.** An open-ended grant (`enabledUntil: null`) is
  refused even when `writesEnabled` is true. This exists because the original incident was a grant
  made for one run and never revoked.
- **The per-run ceiling aborts, it does not truncate.** Default 700. `rebalance-week.mjs` rewrites
  every order *and* writes back to Jobber in a single process — that is ~950 writes for a 480-visit
  week, so **pass `--ceiling 2000`** or it will abort mid-plan.
- **Every attempt is ledgered before the request leaves**, with the outcome recorded after, in
  `ledger/YYYY-MM-DD.jsonl`. Jobber returns HTTP 200 carrying `userErrors`, so the gate inspects the
  body — status alone does not mean applied.

`check-write-gate.mjs` detects coverage by matching the literal path `route-engine/lib/write-gate.mjs`
in the import. A shorter relative import gates correctly but reports as UNGATED — keep the long form.

---

## 3. Back up and restore — do this before every run

`snapshot.mjs` takes a content-addressed picture of the board. `restore-from-snapshot.mjs` puts it
back. Both are in `route-engine/scripts/`.

```bash
node scripts/snapshot.mjs --from=2026-09-21 --to=2026-09-25 --label="pre-run"
node scripts/restore-from-snapshot.mjs baseline <hash>   # captures OptimoRoute orders — run BEFORE the chain
node scripts/restore-from-snapshot.mjs dry     <hash>    # plan the restore, write nothing
node scripts/restore-from-snapshot.mjs live    <hash> [--optimoroute] [--max N] [--ignore-freeze] [--allow-missing]
node scripts/restore-from-snapshot.mjs verify  <hash>
```

An exact restore is possible because **the whole chain makes only two kinds of Jobber change** —
`visitEditSchedule` and `visitEditAssignedUsers`. Nothing creates or deletes a Jobber visit, so a
restore is field-for-field rather than a replay of a log.

What it deliberately will not do: delete a visit; touch a visit booked *after* the snapshot; guess
when a technician name will not resolve to a user id; or delete OptimoRoute orders without a
`baseline` sidecar (a snapshot records *routed* stops only, so a pushed-but-unplanned order is
indistinguishable from one the run created).

**Verification is semantic, not by hash.** The board is live — during one 7-minute test on
2026-09-17, four visits were booked into the target week, each legitimately changing the hash. The
pass condition is *"do any of the visits the snapshot owns still differ?"*; the hash is reported
underneath as information.

---

## 4. The weekly chain

Run from `projects/briefs/technician-route-automation/`. **Stop any scheduler first** — a job that
re-plans on a timer will re-sequence the board underneath you while you work.

```bash
# 1. OWNERSHIP — who owns which visit. Writes the assignee only; no dates, no times.
node assign-by-territory.mjs dry  --from=2026-09-21 --to=2026-09-25
node assign-by-territory.mjs live --from=2026-09-21 --to=2026-09-25

# 2. PUSH — Jobber visits become OptimoRoute orders.
node push-week.mjs dry  --from=2026-09-21 --to=2026-09-25
node push-week.mjs live --from=2026-09-21 --to=2026-09-25

# 3. DEFRAG — lock the tech, free the day, let OptimoRoute level the week, write days+times back.
node rebalance-week.mjs dry  --from=2026-09-21 --to=2026-09-25 --max-day-hours=9
node rebalance-week.mjs live --from=2026-09-21 --to=2026-09-25 --max-day-hours=9 --balancing=ON
```

`--from/--to` are mandatory in practice: without them `push-week` uses its own week rule
(Mon–Thu → this Sunday, Fri–Sun → next Sunday) and will not reach a future week.

**After any live write pass, re-run the same command in `dry` and confirm it reports zero.** That is
the only reliable completion check — see the SIGPIPE note below for why the log alone is not.

`rebalance-week` is the one that matters. It is the only combination that levels lumpy days:
`push-week` floats the day but leaves the tech free, `jobber-to-optimo-sync` locks the tech but
keeps whatever lumps Jobber holds; this one locks the tech and frees the day. Continuity is safe by
construction — `assignedTo` is set on every order, so the optimizer may choose the day and the
sequence but can never hand a customer to someone else.

---

## 5. Measurement

```bash
node _wd_week.mjs 2026-09-21 2026-09-25 <visits.json>   # working day per tech, in HOURS
node fetch-window-visits.mjs 2026-09-21 2026-09-25 <visits.json>
node overtime-relief.mjs 2026-09-21 2026-09-25 --ceiling=9   # read-only; suggests, never moves
node _mismatch0918.mjs                                  # OptimoRoute driver vs Jobber assignee
node _jobchk.mjs 8396 5515 ...                          # job/visit status by job number
```

"Working day" means **first job to last job**. Commute is unpaid and excluded, and `route.duration`
is *not* the working day — it includes the run out from the start location and back.

`_wd_week.mjs` exists because the in-repo equivalent reads a hard-coded visits snapshot that goes
stale and silently prices every stop at the 15-minute default — wrong for any technician on a
different rate and wrong for clustered sites.

Field notes on OptimoRoute `get_routes`, verified 2026-09-04: `route.distance` is **kilometres and
includes the commute legs**; `stop.distance` is **metres**, the leg *into* that stop;
`stop.travelTime` is **seconds**, so stop 1's is the unpaid morning commute; stops carry **no**
service duration — on-site time is whatever was pushed.

---

## 6. Configuration

| File | What it decides |
|---|---|
| `territories.json` | The territory map (v9, five territories). Region → owner, handovers applied *per visit date*, `geoSplitLines` for boundaries that cut through zips, `jobOverrides` (job→tech) and `dayOverrides` (job→weekday). |
| `territory-grid.json` | Zip → (day, tech) grid used by `push-week`. |
| `tech-service-times.json` | Per-technician on-site minutes, `set` (first visit) at 2×, plus site clusters and dated `dayOverrides`. Precedence: cluster > dayOverride > tech > default. |
| `geo-side.mjs` + `geo-side-cache.json` | Resolves the three boundaries that cannot be expressed as a zip list. **The cache is not in this bundle** — see below. |

**Territories are bounded by highways, not zips or city names.** I-90 splits north from south;
SR-18, SR-410/SR-167 and I-705 carry the rest; Lake Washington/I-405 splits the north. Three lines
cut *through* zip codes and are resolved per address from coordinates: **NE 8th St** in Bellevue
(changes the owner, not just the day), **SR-516** from I-5 to Landsburg, and **I-5/US-101** through
Thurston. Coordinates come from OptimoRoute — Jobber returns no lat/lng. An address with no cached
side falls back to its zip's `fallbackSide` and **is logged, never silently defaulted**.

---

## 7. Known defects and hard-won gotchas

Read this section before trusting any output.

1. **`--max-day-hours` is report-only.** It counts breaches after the fact; it does not constrain the
   planner. A run can print *"9 tech-day(s) over the 9h ceiling"* and write the plan back anyway.
2. **`rebalance-week` shipped with `balancing: 'OFF'` hard-coded** while `--balancing` (default ON)
   was wired only to the log lines — so it announced `balancing=ON` and planned with it off, which
   defeats the one thing the script exists for. **Fixed 2026-09-17**; the fix is commented in place.
   Treat it as a warning about the other flags.
3. **Never compare technician load by visit count.** Drive minutes per stop range from ~4.5 in dense
   suburbs to ~18 on the peninsula, so 111 visits can outweigh 146. Always compare hours.
4. **Never pipe a live write script through `head` or a line-capped `sed`.** Closing the pipe can
   SIGPIPE the process mid-write, truncating the log with no completion line and leaving it unknowable
   whether the writes landed. Redirect to a file and grep the file. Re-run in `dry` to confirm.
5. **OptimoRoute orders can go stale as "ghost stops."** The push and sync paths only ever create or
   update — they cannot retire an order — so a visit that is cancelled, completed early or moved out
   of the window leaves its stop behind, consuming route capacity and drive time for a customer
   nobody is visiting. Reconcile against Jobber before judging any day's balance.
6. **`visitEditAssignedUsers` fails transiently on recurring visits** with "required to handle future
   items", then succeeds on an identical later attempt. The mutation takes only `visitId` and
   `assignedUserIds` — there is no scope argument to supply. Re-run; do not hand-edit.
7. **An email freeze governs writes**: date D locks at 14:00 PT on D-1, because that is when the
   customer is told their arrival window. Past that point a board change cannot un-send the text.
8. **Booking a visit does not reconcile its owner.** Cadence bookings inherit the previous assignee,
   so ownership rots continuously — re-run `assign-by-territory` after anything that pulls visits
   forward, especially across a technician handover date.
9. **The v9 capacity model is stale.** It forecasts ~30.7 h/week per territory from a census taken
   before the 2026-08-15 service-time increase. Measured against the week of 2026-09-21 it
   understates hours by roughly a third — one territory came out at 44 h against a forecast 31.8 h
   on almost exactly the forecast visit count. Re-derive capacity before trusting it.
10. **OptimoRoute plans every technician at one uniform pace**, so a per-person hour figure means
    "hours at the average pace". Measured medians have spanned ~17 to ~21 minutes per stop.

---

## 8. What was withheld, and how to regenerate it

Nothing here is a credential and nothing is customer data. Specifically removed:

| Withheld | Why | To restore |
|---|---|---|
| `.env` | Live Jobber and OptimoRoute credentials | Fill in `.env.example` |
| `geo-side-cache.json` | Keyed by **76 customer street addresses** | `node geo-cache-build.mjs --from=<date> --to=<date> --write` rebuilds it from OptimoRoute coordinates. Until then, split zips fall back to `fallbackSide` and log it. |
| `snapshots/`, `ledger/`, `drift-runs/` | Board snapshots and run reports carry visit ids, technician names, customer names and addresses | Regenerated on first run |
| `jobOverrides[].client` in `territory-grid.json` | ~40 customer names. `push-week` reads only `.day`/`.days` from these entries, so behaviour is unchanged | Unredacted file remains in the Got Moles repo |
| One street address in `territories.json` `dayOverrides` | The routing reason is kept; the address is not | As above |

`write-authority.json` ships with writes **disabled**. Enable it through the script, never by
editing the file.

---

## 9. First run, start to finish

```bash
cp .env.example .env && $EDITOR .env
cd projects/briefs/route-engine
node scripts/check-write-gate.mjs && node scripts/test-write-gate.mjs
node scripts/snapshot.mjs --from=<mon> --to=<fri> --label="pre-run"
node scripts/restore-from-snapshot.mjs baseline <hash>
node scripts/restore-from-snapshot.mjs dry <hash>     # must report 0 differences
node scripts/write-authority.mjs enable --reason "first run" --ttl 90m --ceiling 2000
cd ../technician-route-automation
# ... the three chain steps, dry then live ...
cd ../route-engine && node scripts/write-authority.mjs disable
```

A `dry` restore against an untouched board must report **0 differences**. A restore that correctly
does nothing to an unchanged board is the test that it will do the right thing to a changed one.
