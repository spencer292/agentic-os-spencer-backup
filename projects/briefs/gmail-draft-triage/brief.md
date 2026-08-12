---
project: gmail-draft-triage
status: blocked
level: 2
created: 2026-08-11
---

# Gmail Draft Triage — Spencer

## Goal

Anything in `spencer@got-moles.com` that needs a reply gets a draft written for it, waiting in Drafts,
before Spencer opens his inbox. He reviews and sends. Nothing is ever sent automatically.

## Why this exists

On 2026-08-11 a returning customer (Sarah Jeffers, 9706 Vickery Ave E, Tacoma) had been waiting **8 days**
for an answer to "we'd like to begin service again". A commercial referral from Peak Landscape had been
sitting the same length of time. Both were buried under roughly 200 automated messages a week — Amex,
Gusto, Citi, credit-report alerts, Thumbtack marketing, Good To Go.

The inbox is not short of attention because Spencer is careless. It is short of attention because real
customer mail is about 1% of what lands there.

## Deliverables

- `inbox-rules-got-moles.md` — the judgement layer: Spencer's actual voice, the pricing policy, the
  claims guardrails, who bids, who the real people are, what must never be drafted.
- `cron/jobs/gmail-draft-pass.md` — the daily job, 07:00, drafts-only. **Currently `active: 'false'`.**
- Reuses the shipped `scripts/gmail/*.cjs` pipeline unchanged (fetch → label → draft). No script edits
  were needed: they read whichever account the `GMAIL_*` credentials authorize.

## Status: blocked on credentials

The scripts need a Google OAuth client. Verified live on 2026-08-11:

```
$ node scripts/gmail/gmail-check.cjs
✗ Missing GMAIL_CLIENT_ID in .env
```

### Setup (about 10 minutes, one time)

1. Go to `console.cloud.google.com` → **APIs & Services → Library** → enable **Gmail API**.
2. **Credentials → Create Credentials → OAuth client ID → Desktop app**. Name it anything.
3. Copy the client ID and secret into `.env`:
   ```
   GMAIL_CLIENT_ID=...
   GMAIL_CLIENT_SECRET=...
   ```
4. From the repo root, run `node scripts/gmail/gmail-auth.cjs`. It opens a browser — **approve as
   spencer@got-moles.com**. It writes `GMAIL_REFRESH_TOKEN` back into `.env` itself.
5. Confirm with `node scripts/gmail/gmail-check.cjs`.
6. Run the job attended two or three mornings before flipping `active: 'true'` in
   `cron/jobs/gmail-draft-pass.md`.

Scope requested is `gmail.modify` — read, label, and draft. It **cannot hard-delete**.

Alternative: Roy already has a working OAuth app for the same pipeline on his install. Reusing that
client ID/secret works, and Spencer's own refresh token keeps the two accounts separate.

## Until then

The in-session path works today and needs no setup: ask for a draft pass and it runs against the
Gmail connector — read, judge, draft into Drafts. First live pass on 2026-08-11 produced the two
drafts above. The catch, stated plainly: it only happens when Spencer asks, because it depends on
Claude actively running. It is not unattended.

## Acceptance criteria

- [x] Rules file encodes voice, pricing, bid routing, claims guardrails, never-draft list
- [x] Cron job written, drafts-only, reuses shipped scripts unmodified
- [x] In-session drafting proven end to end (2 drafts, 2026-08-11)
- [ ] `gmail-check.cjs` passes — needs `GMAIL_*` in `.env` (Spencer)
- [ ] Three attended runs reviewed before `active: 'true'`

## Known limits

- **Not unattended until step 6 above.** Until the cron is live and green, no lead or customer email is
  guaranteed a draft. Do not describe this as hands-off.
- The shipped `cron/jobs/gmail-daily-triage.md` (Roy's, `roy@atpbos.com`) is still `active: 'true'` on
  this install and fails every morning on the same missing credentials. It is a shipped file, so editing
  it locally risks a `git pull` conflict — left alone deliberately. Spencer's call whether to disable it.
- Drafting quality depends on `inbox-rules-got-moles.md` staying current. Append a dated bullet whenever
  a draft comes out wrong; that file is the fix, not the prompt.
