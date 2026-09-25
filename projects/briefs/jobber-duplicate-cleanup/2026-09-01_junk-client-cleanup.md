# Junk client records in Jobber — audit and cleanup plan

Run 2026-09-01 against the live account.

**Status: 309 of 322 junk records removed. 13 left, all needing a human.**

| | Count | How |
|---|---|---|
| Batch A — nothing attached | 204 | archived, then permanently deleted |
| Batch B — one CallRail request | 84 | permanently deleted |
| Duplicate stubs colliding with a real client | 21 | merged into the real client |
| **Removed** | **309** | |
| **Remaining** | **13** | see below |

All verified live: `verify-deleted.mjs` reports 288 deleted / 0 still present,
`verify-merges.mjs` reports 21 merged / 0 problems.

The 13 left are deliberate holds: 7 real customers with a thin name who need
RENAMING not deleting (`Adam`, `Stas`, `Charles`, `Jonae` $100 owed, `Sauce`,
`Fumiyo`, `Tang,Zhaohui N/A` $150 credit), 2 household-member stubs holding text
threads (`Politeo,Elizabe N/A`, `Ceres,Jessica N/A`), and 4 with a real street
address.

- Report: `data/junk-client-report.json`
- Spreadsheet: `data/junk-client-report.csv`
- Audit script: `scripts/jobber-junk-client-audit.mjs` (re-runnable)
- Archive script: `scripts/jobber-junk-client-archive.mjs` (dry-run by default)

## The API and the UI disagree — trust the UI

**The API cannot delete or merge a client. The UI can do both.** The GraphQL
schema offers only `clientArchive` / `clientUnarchive`, which is what made this
look archive-only at first. The client page's `More` menu actually carries
**Send Login Email / Log in as Client / Merge Client / Delete Client**.

So all three operations are available, just browser-driven rather than API-driven:

| Operation | Route | Reversible |
|---|---|---|
| Archive | API (`clientArchive`) | yes — `clientUnarchive`, and we log every id |
| Delete | UI only, via `tool-browser` | **no** |
| Merge | UI only, via `tool-browser` | no |

Merge matters more than it looks: it moves the phone number **and the SMS
thread** onto the keeper, which archiving does not. That makes it the correct
fix for the text-message problem below, not a nice-to-have.

The delete dialog will not submit until every consequence checkbox is ticked
("Access to their Client Hub", "1 property"). The automation ticks them all and
treats the dialog closing as the success signal.

## What is actually in the account

4,670 client records, 3,231 of them live. 322 live records have a junk name:

| Shape | Count | Example |
|---|---|---|
| `city-stub` — caller's city written as the name | 220 | `Tacoma Wa`, `Puyallup Wa` |
| `half-name` — real name plus `N/A` | 53 | `King,Shelby N/A`, `Zones N/A` |
| `wireless-caller` | 40 | `Wireless Caller` |
| `first-name-only` | 9 | `Alison`, `Justin` |

**There are zero records named "Unknown"** — not live, not archived. In this
account the caller-ID junk shows up as the city name instead.

## What is safe to archive

Every candidate was checked for attached jobs, quotes, invoices, requests,
properties, notes and outstanding balance.

| Batch | Count | What it is |
|---|---|---|
| **A — SAFE-archive** | **204** | Nothing attached at all. No job, no quote, no invoice, no request, no real address, $0 balance. Pure litter. |
| **B — request-only** | **107** | Holds one Request and nothing else. The integration files a request per call, so this is still a stub — but 25 of them share a phone number with a real client record, i.e. they are duplicates of customers you already have. |
| **C — has real work** | 7 | Holds jobs or invoices. **Do not archive** — these need renaming. |
| **D — has a street address** | 4 | Someone typed a real property in. Worth a look before deciding. |

Batch C in full, all of them real customers with a thin name:

| Name | Jobs | Invoices | Balance |
|---|---|---|---|
| Fumiyo | 0 | 0 (1 quote) | 0 |
| Adam | 1 | 1 | 0 |
| Stas | 2 | 0 | 0 |
| Sauce | 1 | 0 | 0 |
| Charles | 1 | 2 | 0 |
| Jonae | 1 | 2 | **100 owed** |
| Tang,Zhaohui N/A | 1 | 0 (2 quotes) | **-150 credit** |

## The source is still running

This is the part worth acting on. CallRail's native Jobber integration reports
`state=disabled` on the API (it was `active` at the 2026-07-31 audit), **but junk
records are still being created**: 4 on 2026-08-31, 1 today at 10:08 PT
(`P,Jess N/A`), roughly 4 a day through late August.

The `Last,First N/A` and `Wireless Caller` signatures are caller-ID derived, and
our own `callrail-jobber-sync.mjs` is cleared — it reads the Voice Assist intake
only and repairs junk names rather than writing them. So something on the
CallRail side is still pushing, and the API's integration config comes back
empty, which means **this has to be checked in the CallRail UI**.

At ~4/day, archiving 204 records today buys back about seven weeks before the
list looks the same again. The audit is re-runnable, so worst case this is a
two-minute monthly chore — but killing the source is the actual fix.

## Running it

```bash
# refresh the audit (about 12 minutes; Jobber throttles hard)
node projects/briefs/jobber-duplicate-cleanup/scripts/jobber-junk-client-audit.mjs --refresh

# see what would happen — this is the default, it never writes
node projects/briefs/jobber-duplicate-cleanup/scripts/jobber-junk-client-archive.mjs

# a small live batch first
node projects/briefs/jobber-duplicate-cleanup/scripts/jobber-junk-client-archive.mjs --limit 25 --execute

# the rest
node projects/briefs/jobber-duplicate-cleanup/scripts/jobber-junk-client-archive.mjs --execute

# batch B, once approved
node .../jobber-junk-client-archive.mjs --verdict REVIEW-request-only --execute

# put any batch back
node .../jobber-junk-client-archive.mjs --undo data/archive-log-<stamp>.jsonl --execute
```

Every archived id is appended to `data/archive-log-<stamp>.jsonl` as it happens,
so a batch can be reversed even if the run dies halfway. The archive script also
re-asserts the safety rule itself: it refuses to run if any target holds a job,
quote, invoice or balance, whatever the report file says.
