# Voice Visit Notes

A phone app for technicians. Tap the job, talk for twenty seconds, check what it wrote, send.
The note lands in Jobber as a normal job note, in the same shorthand the crew already writes
by hand.

Part of the `jobber-notes-automation` brief. It feeds the front of that pipeline: the note it
writes is the note `report-sync.mjs` reads for the custom-field status report, and the note
`engine.mjs` reads to decide follow-up visits.

---

## Why it emits shorthand, not prose

The visit note is not a diary entry — it is the input to two live automations. So the app's
job is not "write something readable", it is "emit exactly the grammar `../parse-note.mjs`
decodes". The Worker imports that same parser and runs the generated note back through it
before the technician ever sees it. If a field is missing, the tech is told on the spot,
while they are still standing in the yard.

That is the whole design. Everything else is plumbing.

---

## What the technician sees

1. Opens the link (saved to their home screen), enters a 4-digit code once per phone.
2. Their jobs for today, pulled live from Jobber and filtered to visits assigned to them.
3. Taps a job — the previous note is there to check against, collapsed.
4. Taps record, talks, taps stop.
5. The shorthand appears with a per-field check:
   `Moles: 2 · Miss: 0 · Activity: Moderate · Traps: 3 Victor front · Next: Add visit`
   Anything missing turns amber with a plain-English prompt ("No miss count — say 'no miss'
   or 'one miss under'").
6. They can edit the text directly. Taps **Send to Jobber**.

Nothing is written to Jobber without that tap.

If signal drops, a confirmed note is held on the phone and sends itself when signal returns —
the tech is told, and can carry on to the next job.

---

## Live

**https://gm-visit-notes.route-ready.workers.dev**

Open it on the phone, sign in once with the 4-digit code, then Share → **Add to Home Screen**.
It behaves like an app from then on.

Codes are in `techs.json` (gitignored — the only readable copy). Deployed 2026-07-28 to the
`Routereadykits@gmail.com` Cloudflare account, since that is the account this install's
`CLOUDFLARE_API_TOKEN` belongs to. Nothing about it touches got-moles.com or Roy's deploy repo.

## Setup

```bash
cd projects/briefs/jobber-notes-automation/voice-notes
npm install
npm run secrets     # generates technician codes, pushes credentials to Cloudflare
npm run deploy
```

`npm run secrets` reads `JOBBER_CLIENT_ID`, `JOBBER_CLIENT_SECRET`, `JOBBER_REFRESH_TOKEN`
and `GEMINI_API_KEY` from the repo `.env`, generates a random 4-digit code per technician,
and writes them to `techs.json` — **gitignored, and the only readable copy of those codes.**
Hand each person their own.

To run it locally instead:

```bash
node dev-vars.mjs   # writes .dev.vars from .env (gitignored)
npm run dev         # code 1234 signs in as Spencer
```

Watch it in the field with `npm run tail`.

---

## Checking it still works

```bash
npm run eval        # 18 spoken phrasings -> shorthand -> parser  (text only)
node eval-audio.mjs # 6 clips through the real speech path, TTS-generated locally
```

Both assert against `parse-note.mjs`, so they fail if the app and the downstream automation
ever drift apart. Last run: **18/18** and **6/6**.

`npm run sample` re-pulls the live note corpus; `npm run analyze` re-mines it for vocabulary.
Do that again if the crew's shorthand shifts.

---

## How it is put together

| File | Does |
|------|------|
| `src/worker.js` | Routes, session tokens, the only write path (`/api/note`) |
| `src/grammar.js` | The shorthand spec, the formatter prompt, and the validator |
| `src/ai.js` | Gemini: audio → transcript, transcript → shorthand |
| `src/jobber.js` | Token refresh, today's visits per tech, `jobCreateNote` |
| `src/app.html.js` | The entire phone app, one document |
| `../parse-note.mjs` | **Imported, not copied.** One definition of the grammar. |

The phone never holds a Jobber or Gemini credential — only a signed session token tied to one
Jobber user. The Worker can post a job note and nothing else; it cannot touch schedules, jobs
or clients.

---

## Decisions worth knowing

**Gemini, not OpenAI.** This install's `OPENAI_API_KEY` returns 429 insufficient_quota on
every call. `GEMINI_API_KEY` works and `gemini-3.6-flash` takes audio natively, so one
provider covers transcription and formatting. Swap models in `wrangler.toml` — no code edit.

**No audio conversion on the phone.** Gemini was verified against `audio/webm` (Android
Chrome), `audio/mp4` (iOS Safari), `audio/ogg`, `audio/aac` and `audio/wav`. All transcribe
correctly, so the recorder ships whatever the phone gives it. Opus is ~23 KB for a 20-second
note against ~306 KB for WAV, which matters on a rural property.

**No KV, no database.** Jobber does not rotate its refresh token (verified 2026-07-28:
refreshing twice returns the same token and the old one stays valid), so the Worker shares
`JOBBER_REFRESH_TOKEN` with the repo's local scripts without the two fighting over it.
Sessions are HMAC-signed rather than stored.

**Two model calls, not one.** The transcript is kept as a faithful record of what was
actually said — shown in the app under "What you said" and logged — so a bad note can always
be traced to either mishearing or misformatting.

---

## Known limits

- **Notes are not attributed to the technician in Jobber.** `JobCreateNoteInput` has no
  author field; Jobber credits the connected API app. The tech's name is recorded in the
  Worker log (`npm run tail`) instead. If attribution in Jobber's UI matters, the only fix
  is a separate Jobber OAuth connection per technician.
- **`parse-note.mjs` does not map the compass placements.** `froh` / `floh` / `broh` / `bloh`
  are in live use (28 + 23 + 19 + 17 occurrences in a 10-day corpus) but its `POS` map only
  knows `foh`/`boh`/`loh`/`roh`. Counts and trap types still parse; only the position label
  is dropped. Left alone deliberately — that file drives live scheduling and was out of scope
  here.
- **Synthetic test audio is cleaner than a technician in the wind.** `eval-audio.mjs` is a
  lower bound on failure modes, not a substitute for the pilot week.
- `src/openai.js` is a tombstone — nothing imports it. Safe to delete (`rm` is denied by this
  install's permission settings, so it could not be removed here).
