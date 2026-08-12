---
name: Gmail Draft Pass (Spencer)
time: '07:00'
days: daily
active: 'false'
model: opus
notify: on_finish
description: 'Reads new mail in spencer@got-moles.com since the last run, writes reply DRAFTS in Spencer''s voice for anything from a real person that needs an answer, files the rest, and reports. Never sends, never deletes. INACTIVE until GMAIL_* OAuth is set up — see projects/briefs/gmail-draft-triage/brief.md.'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS. Read CLAUDE.md for system context.

Task: triage **Spencer's** Gmail (`spencer@got-moles.com`). Write reply **drafts** (never send) for mail
from real people that needs an answer, file the rest, and report what is waiting on him.

**Hard rules — never break these:**
- **Never send.** Replies are created as Gmail drafts only. Spencer reviews and sends himself.
- **Never delete.** Junk/FYI are *archived* (removed from INBOX) — they stay in All Mail, recoverable.
- The scripts read their keys from `.env` internally. Never echo a token. Run from the repo root.
- If a step errors, stop and report — do not apply partial labels or guess.

## 0. Preflight

```
node scripts/gmail/gmail-check.cjs
```
If this reports missing credentials, output exactly:
"Gmail credentials not configured — see projects/briefs/gmail-draft-triage/brief.md" and stop.
Do not attempt any other step. This job is inactive until that passes.

## 1. Fetch new mail (read-only)
```
node scripts/gmail/gmail-fetch.cjs --full --out .tmp/gmail/inbox.json
```
- Lists new INBOX messages since the last run (a `.last-run.json` marker; falls back to the last 24h).
- Already-triaged messages (carrying any `Triage/*` label) are skipped automatically.
- Read `.tmp/gmail/inbox.json`. If `counts.returned` is 0, output "Inbox clear — nothing new to triage." and stop.

## 2. Classify — read every message with judgement

**FIRST, read `projects/briefs/gmail-draft-triage/inbox-rules-got-moles.md` in full.** It is the single
source of truth: golden rules, the three outcomes, Spencer's voice, the pricing policy, the claims
guardrails, who bids, and the people list. Note it is the **Got Moles** rules file — do NOT read
`scripts/gmail/inbox-rules.md`, which belongs to Roy's separate install and uses British English.

Then read **the actual content** of each message (subject + body, never sender or keywords alone) and
assign exactly one outcome: `TO-RESPOND` (draft a reply), `ACTION` (needs action, no reply → `Action`
folder), or file/archive (`JUNK`/`FYI`/area).

Two things drive most of the value here, so weight them:
- **Customer and lead mail outranks everything.** A homeowner or property manager waiting on an answer
  is the most expensive thing in the inbox. On 2026-08-11 a returning customer had been waiting 8 days.
- **Read inside forwards.** `office@got-moles.net` forwards real customer mail out of HighLevel.

Be **conservative**: when unsure whether to draft, choose `ACTION`, not `TO-RESPOND`.

Write `.tmp/gmail/decisions.json` = `[{ id, class, reason }]` for all messages.

For `TO-RESPOND` only, also write `.tmp/gmail/drafts.json` =
`[{ id, threadId, to, subject, messageIdHeader, body }]` where `to` = the message's `replyToEmail`,
`subject` = its `subject`, `messageIdHeader` = its `messageIdHeader`, and `body` = a **short** reply per
§2 of the rules file — three to six lines, US English, signed with Spencer's block. A long draft is a
wrong draft; he will not send it.

## 3. Apply triage labels
```
node scripts/gmail/gmail-label.cjs --in .tmp/gmail/decisions.json
```
- JUNK/FYI are labelled and archived out of the inbox; NEEDS-YOU/TO-RESPOND are labelled and stay.
- Idempotent — safe to re-run.

## 4. Create drafts (only if there are TO-RESPOND items)
```
node scripts/gmail/gmail-draft.cjs --in .tmp/gmail/drafts.json
```
- Creates threaded drafts in Drafts and tags each source message `Triage/Drafted`. **Never sends.**

## 5. Report
Post one summary block:
- Counts per class (JUNK archived, FYI archived, NEEDS-YOU in inbox, TO-RESPOND drafted).
- **Customer/lead items first**, each with how long it has been waiting.
- For each NEEDS-YOU: sender + subject + why it needs him.
- For each draft: sender + subject, so he knows which Drafts to review.
- Anything skipped or errored, named explicitly.
- End with: "Drafts are waiting in Gmail — review and send the ones you want. Nothing was sent."

Notes:
- Incremental: only processes mail newer than the last successful run.
- Run it attended a few times (`--dry-run` on the label step first) before trusting it unattended —
  the same way Roy's version was brought up.
