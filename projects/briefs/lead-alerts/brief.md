---
project: lead-alerts
status: active
level: 2
created: 2026-08-04
---

# New Lead Alert

## Goal

Spencer finds out within ~15 minutes when someone becomes a lead in Jobber — website
form fill or phone — instead of finding out days later, or not at all.

## Why this is a local cron and not n8n

The original build was n8n workflow `LGD33gS2IupDhUi0` ("Got Moles — New Lead Alert
(Jobber → Email)"), created 2026-07-29. It was correct and never ran once in production.

Root cause: n8n and this machine share a single Jobber OAuth app. Jobber invalidates the
previous refresh token whenever the app is re-authorized, so only one holder can have a
live token at a time — and this machine holds it (route automation, CallRail sync, the
notes engine all depend on it). Re-authorizing n8n would have killed those. The sibling
workflow `2dxtg73X1JUvLUTr` (Visit Notes) shows the failure mode: active, and failing
every night since 2026-07-24 with `The provided refresh token is not valid`.

Moving the poll onto the machine that already holds the working token removes the
credential conflict from this feature entirely. n8n's Jobber credential still needs
fixing for Visit Notes — that is a separate thread.

## Deliverables

- `lead-alert.mjs` — the actor. Polls Jobber, picks leads, sends the email.
- `send-mail.mjs` — dependency-free SMTP sender (npm installs are denied on this machine).
- `cron/jobs/lead-alert.md` — every 15 min, 07:00–19:00 daily.
- `state.json` — suppression state (created on first run).
- `runs/YYYY-MM-DD.jsonl` — one line per alert sent, for auditing what Spencer was told.

## How a lead is chosen

Ported verbatim from the n8n version, which was tuned against 8 days of real Jobber data
(~7 alerts/day against ~15 website + ~40 phone leads).

| Rule | Reason |
|---|---|
| Rolling 3-hour look-back, not a watermark | A missed run, restart, or outage can never lose a lead. Duplicates are suppressed downstream instead. |
| Skip `!isLead` records that already have a street address | Office data entry on an existing customer, not someone waiting for a callback. |
| Skip records with neither phone nor email | Nothing to call back on. |
| Hold caller-ID stubs ("Wireless Caller", "Kent Wa", "Smith,John N/A") for 70 min | The CallRail Voice Assist sync usually lands a properly named record for the same number within the hour. Alerting with the real name is worth the delay. Deliberately not marked seen, so a later poll picks it up either way. |
| Dedupe on last-10 phone digits for 48h | The same person calling and filling the form is one lead, not two. |
| Flag (never drop) non-US phone numbers as possible spam | Overseas SEO spam hits the form regularly — the 2026-07-28 sweep caught one in 21. A heuristic must not eat a real customer, so it sorts last and is labelled, not filtered. |
| Website-form leads sort first | Those are the ones that were going unnoticed. |
| First run primes | Marks the current window already-seen instead of blasting a backlog. |

## Delivery

Email via SMTP (`LEAD_ALERT_SMTP_*` in `.env`, Google app password). Gmail OAuth is not
available on this install — `scripts/gmail/*` reports `Missing GMAIL_CLIENT_ID`.

If email is not configured or the send fails, the script still prints every lead and the
cron prompt is written to relay the **full** lead block into the desktop notification. A
broken mailbox degrades the alert; it never silently swallows a lead.

## Acceptance criteria

- [x] Runs off the local Jobber token, no n8n dependency
- [x] Picks the same leads the n8n version would have
- [x] Flags likely spam without dropping it
- [x] Survives a failed email without losing the lead
- [ ] `--test-email` passes (needs `LEAD_ALERT_SMTP_*` — Spencer)
- [ ] First primed run completed, then a real alert observed end to end

## Known limits

- **Model:** the cron runs on `haiku` deliberately. The job makes zero Jobber mutations —
  the script is fully deterministic and Claude only relays its output — so the Opus
  field-ops floor (which exists to protect irreversible writes) does not apply. At 49 runs
  a day, Opus would cost roughly $12–98/day versus about $0.50–2.50 on haiku.
- **Coverage:** 07:00–19:00 only. A lead arriving at 21:00 alerts at 07:00 next morning.
- **Website form → Jobber is still not deployed.** The site-side fix (`createJobberRequest`
  sending invalid `description`/`source` fields to `requestCreate`) is committed locally but
  needs the Requests read/write scope on the Jobber app plus a deploy by Roy. Until then,
  website leads only reach Jobber via the paths that already work — this alert covers
  whatever lands there, but the form→Request path itself is still broken.
- **The 3h window caps at 50 client records per poll.** Well clear of real volume
  (~5–7/day), but a bulk import would overflow it.
