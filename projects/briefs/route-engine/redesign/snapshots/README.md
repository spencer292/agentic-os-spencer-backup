# Route-engine snapshots

Each folder here is one capture of the whole book — Jobber jobs, visits and notes,
the user list, the OptimoRoute plan, and the config files the engine reads — exactly
as they stood at one moment.

Produced by `../scripts/snapshot-week.mjs`. Run by a **person**, by hand, every
**Friday at 12:00 PT**. It is not scheduled and must not be put on a cron.

## Snapshots are immutable

**Never edit a snapshot. Never re-run a part over a good one to "correct" it. Never
hand-patch a value.**

A snapshot is not a working dataset — it is the record of what was true at that
moment. If a snapshot is wrong, that fact is itself the finding: it tells you the
book was wrong, or the pull was wrong, on that Friday. Fixing it in place destroys
the only evidence of that.

**A wrong snapshot gets a NEW snapshot. The old one stays.**

The only writes into an existing folder that are legitimate are *completing* it —
resuming a part that never finished, or adding a part that was not pulled in the
first pass. That is what `--dir=` and `--force` are for, and it is meant for the same
sitting, not for revising a snapshot weeks later.

## Folder naming

```
<YYYY-MM-DD>T<HHMM>-<hash8>
e.g. 2026-09-19T1200-4f8a1c92
```

- `<YYYY-MM-DD>` and `<HHMM>` are **Pacific** at capture start (UTC-7 for Sep 2026,
  the same `PAC_OFFSET_H = 7` convention the other redesign scripts use).
- `<hash8>` is the first 8 hex characters of `sha256(captureStartISO + '|' + gitHead)`.
  Two captures started in the same minute against different code get different
  folders; the hash also ties the snapshot to the commit that produced it.

## Parts

| File | What it holds |
|---|---|
| `jobs.json` | **All** jobs — the `visitsScheduledBetween` pass over the snapshot window unioned with the `status: active` pass. Per job: identity, status, client, property (incl. lat/lng and `geoStatus`), line items, `visitSchedule.assignedTo`, and every custom field flattened with its label trimmed. |
| `visits.json` | Every visit with `startAt` from 14 days before the capture date to 45 days after, Pacific. |
| `notes.json` | Job notes created in the last 21 days, across **all** jobs (not a sample). Only jobs with at least one in-window note are kept. |
| `users.json` | The user list. The script tries the richest field set first and degrades field-by-field if Jobber rejects one; `fieldsCaptured` and `attempts` record exactly what was obtained. |
| `optimo.json` | OptimoRoute routes as currently held for the next 21 weekdays from the capture date, with the order records. Dates that returned no routes are recorded in `gaps` — **never filled in**. |
| `config/` | Copies of `territories.json`, `tech-service-times.json` and `cycle-times-gps.json` as they stood, plus `_config-manifest.json` noting any that were missing. |
| `capture.log` | Everything the run printed. |
| `manifest.json` | See below. |

Gaps are recorded, never invented. An empty OptimoRoute date means OptimoRoute held
no plan for that date — that is a real fact about the book, and the snapshot says so
rather than guessing a route.

## manifest.json

Written last on every run, so it always describes what is actually on disk. It carries:

- the snapshot id, capture start and end in **both** Pacific and ISO UTC
- the git HEAD at capture
- the exact `argv` of each run, in `runs[]` (a resumed folder accumulates runs)
- per part: status, record count, elapsed seconds, and when it ran
- `fileDigests` — the **SHA-256 of every file in the folder**, keyed by relative path

`manifest.json` cannot hash itself, so it is the one file excluded. `capture.log` is
hashed at manifest-write time and nothing is appended to it afterwards.

### Verifying a snapshot has not been tampered with

From the repo root:

```bash
node -e "
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const dir=process.argv[1];
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
let bad=0;
for(const [rel,want] of Object.entries(m.fileDigests)){
  const p=path.join(dir,rel);
  if(!fs.existsSync(p)){console.log('MISSING '+rel);bad++;continue;}
  const got=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  if(got!==want){console.log('CHANGED '+rel);bad++;}
}
console.log(bad?bad+' file(s) differ from the manifest':'all '+Object.keys(m.fileDigests).length+' files match');
" projects/briefs/route-engine/redesign/snapshots/<folder>
```

Any `CHANGED` line means the snapshot was altered after capture. That is a defect in
the process, not something to repair by recomputing the manifest.

## Captures so far

| Snapshot | Parts | Records | Duration | State |
|---|---|---|---|---|
| `2026-09-19T1047-d12e475b` | all six | jobs 951, visits 2,846, notes 1,689 over 841 jobs, users 20, optimo 471 stops (5 of 21 weekdays had routes, 16 gaps), config 3 | 15 m 26 s | **complete** — all 10 file digests re-verified against the manifest on 2026-09-19 |

This one was a proof capture, run part by part because the visits pull hit Jobber
throttling and backed off to 90 s. The weekly ritual starts Friday 2026-09-25.

## Commands

```bash
# from the repo root C:\Agentic-os-got-moles, so .env resolves
node projects/briefs/route-engine/redesign/scripts/snapshot-week.mjs --part=all
node projects/briefs/route-engine/redesign/scripts/snapshot-week.mjs --part=notes --dir=<folder>
node projects/briefs/route-engine/redesign/scripts/snapshot-week.mjs --part=all   --dir=<folder>   # resume
```

Never pipe a live run through `head` or a line-capped `sed -n` — closing the pipe can
SIGPIPE the process mid-write (CLAUDE.local.md, 2026-08-09). The script tees its own
output to `capture.log` inside the folder.

## Read-only

The capture cannot write to Jobber or OptimoRoute. Jobber is queried with GraphQL
`query` operations only and every request body is checked for the string `mutation`
before it leaves the process. OptimoRoute goes through the same read-only endpoint
allow-list as `pull-optimo-history.mjs` — `get_routes`, `search_orders`,
`get_completion_details`, `get_depots` — and the transport throws on anything else.
