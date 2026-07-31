---
project: jobber-duplicate-cleanup
status: active
level: 2
created: 2026-07-29
---

# Lead alerts + duplicate client cleanup

Two problems, two different roots. **The website form creates a Jobber client and
tells nobody** — that silence is why leads get missed. Separately, **CallRail's
native Jobber integration writes a new client at the start of a call and another
one at the end** — that is what floods the client list.

## Goal

1. Spencer is notified of every new inbound lead within 10 minutes.
2. New duplicate client records stop being created.
3. The existing 114 duplicate records are resolved without losing history.

## Evidence

Audit run 2026-07-29 (`scripts/jobber-duplicate-audit.mjs`, full account scan):

| Measure | Value |
|---|---|
| Clients in account | 4,311 |
| Duplicate groups (2+ live records for one person) | 97 |
| Extra records to resolve | 114 (2.6% of the account) |
| CallRail caller-ID stubs on file | 235 |
| Website-form-shaped records | 61 |

**This is a new problem.** Grouping each duplicate by when its newest member
appeared: 44 in July 2026, 16 in June, 17 in May — versus ~19 in the whole of
2023–April 2026 combined. It began when the new website went live.

Duplicate shapes:

| Count | Shape | Cause |
|---|---|---|
| 35 | full-record + other | Call stub later name-repaired, real record already existed |
| 23 | full-record + full-record | Manual office entry on an existing customer |
| 13 | callrail-stub + full-record | CallRail native integration stub vs. real record |
| 9 | full-record + website-form | Existing customer used the website form |
| 7 | website-form only | Same person submitted the form 2–4 times |

## Root causes

**1. CallRail's native Jobber integration — 80 of 97 groups (82%).**

The integration is live: CallRail account `ACC019dc0126ade7956850fbd40239646af`,
integration `JOBBER`, id `25967`, state `active`. It creates a Jobber client
**twice per conversation** — once at call start from caller ID, once at call end
from the name captured during the call — and matches neither against the other.
Proof is the gap between the paired records equalling the call duration:

| Person | Call duration | Gap between records |
|---|---|---|
| Miwa Pugh | 521s | 8 min |
| Terence Wirth | 807s | 13 min |
| Will Reagan | 317s | 5 min |
| Vicky Marxen | 348s | 4 min |

Hence the name signature: `Kinsella John → John Kinsella`, `Burns Steven → Steve
Burns`, `Bellevue Wa → Miwa Pugh`. It also creates one per call, so a callback
or a second inbound call adds another record (Sandra Aviles: two calls 32s and
71s one minute apart, two records).

29 of the non-website groups are under 15 minutes apart (same conversation) and
43 within 24 hours (callbacks).

**2. The website form never looks first — 17 groups.** `createJobberClient` in
`site/src/lib/jobber.ts` creates unconditionally, with no phone or email lookup.
Jennifer Obrien has three records; Robert Jensen and Ed Elway two each. Existing
customers who use the form get a second record instead of a request on their
real one. A known Jobber-wide pattern, documented in Jobber's own community.

**3. Form spam is getting through.** One bot has submitted four times since May
under four names on one phone (8054002077, all `@jmailservice.com`). The
honeypot only catches bots that fill hidden fields, and the per-IP rate limit is
an in-memory `Map` on serverless — it resets on every cold start, so it does
effectively nothing.

**Cleared:** our own `callrail-jobber-sync.mjs` is not a contributor. Only 2 of
97 groups intersect its log, one of them Spencer's internal record cluster. It
matches on phone before writing, which is the behaviour the native integration
lacks.

## Hard constraint

**Jobber cannot merge clients.** Not via the API (only `clientArchive` exists —
no merge mutation) and not in the UI. Cleanup therefore means: pick the record
holding the real history, copy anything useful across to it, then archive the
loser. Choosing the keeper wrongly hides jobs, quotes and invoices, so every
group needs its attached-history counts checked before anything is archived.

## Deliverables

- `scripts/jobber-duplicate-audit.mjs` — full-account duplicate scan (done)
- `data/duplicate-report.json` — 97 groups with per-record origin (done)
- n8n workflow `LGD33gS2IupDhUi0` — 10-minute lead alert (built, awaiting Gmail)
- Website form: lookup-before-create + Request creation (staged for Roy)
- CallRail Jobber integration reconfigured or replaced (the main fix — to do)
- `callrail-jobber-sync.mjs` extended to cover all calls, not just Voice Assist,
  if the native integration is switched off (to build)
- `scripts/jobber-duplicate-resolve.mjs` — dry-run resolution planner (to build)
- Weekly duplicate-watch job (to build)

## Acceptance criteria

- A test form submission from an existing customer's phone/email attaches a
  Request to that existing client and creates no new record.
- A test submission from an unknown number creates one client, one request, and
  one email to Spencer within 10 minutes.
- Live duplicate groups drop from 97 to under 10, with zero jobs, quotes or
  invoices orphaned.
- The weekly watch reports any new duplicate group within 7 days.

## Constraints

- Site code deploys through Roy only — this install builds and stages, never deploys.
- Jobber writes need Spencer's explicit go-ahead per batch; archiving is bulk and
  user-visible.
- The Jobber app currently lacks Requests scope, so `requestCreate` is unverified.
