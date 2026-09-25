# YouTube OAuth Write Client

Two zero-dependency Node scripts. Together they are the only write path in the estate for
YouTube video tags and (eventually) thumbnails — Zernio's publish path silently drops both.
n8n never holds the OAuth token; every OAuth write runs from a local Node script only, never
from a cloud workflow.

## Prerequisite: GCP consent screen at Production status

Before the first `--authorize` run for either channel, the GCP OAuth consent screen must be
switched to **Production** publishing status, in a specific order relative to that first
authorize run. See
`../../projects/briefs/breathwork-channel-engine/RUNBOOK.md` for the exact step order and why
it matters — read that before running `--authorize` for the first time; the order is not
restated here.

## `youtube-oauth.cjs` — consent, token exchange, credential smoke check

```
node youtube-oauth.cjs --authorize --channel breathwork
node youtube-oauth.cjs --authorize --channel main
node youtube-oauth.cjs --check --channel breathwork
node youtube-oauth.cjs --check --channel main
```

- `--authorize --channel <breathwork|main>` runs the one-time browser consent flow. A one-shot
  loopback listener on `http://localhost:8765` captures the callback and exchanges the code for
  a refresh token. It never writes `.env` itself — it prints the target variable name and the
  exact line to paste, with the value elided, so saving the secret into `.env` stays a
  deliberate human action.
- `--check --channel <breathwork|main>` is the credential smoke path and the default mode when
  no `--authorize` flag is given. If `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`,
  or the channel's refresh-token variable is missing, it prints one `MISSING: <NAME>` line per
  absent variable and makes no network call. If all three are present, it exchanges the refresh
  token for an access token and confirms the granted scope matches exactly.
- Requests exactly one OAuth scope: `https://www.googleapis.com/auth/youtube.force-ssl`. No
  broader scope is ever requested.
- Exports `getAccessToken(channel)` — `youtube-write.cjs` refreshes through this one function
  rather than duplicating the exchange.

## `youtube-write.cjs` — tamper-safe write with read-back verification

```
node youtube-write.cjs --noop-proof --channel breathwork --video <videoId>
node youtube-write.cjs --set-tags --channel breathwork --video <videoId> --tags "a,b,c"
```

- Both modes read the video's current snippet before writing (`videos.list part=snippet`),
  echo the whole snippet object back on write plus only the intended delta — never a partial
  object, because `videos.update` overwrites the entire requested part — then read again and
  deep-compare six fields (title, description, categoryId, tags, defaultLanguage,
  defaultAudioLanguage). The run prints `WRITE VERIFIED` or `WRITE MISMATCH` and exits non-zero
  on any mismatch, on a non-2xx response, on an empty result (video not found or not owned by
  the consented channel), or on missing credentials.
- `--noop-proof` writes the snippet back unchanged and confirms nothing drifted.
- `--set-tags` merges the supplied comma-separated tags into the existing tag array and
  confirms the merged array lands exactly.
- `--video` may be omitted for the breathwork channel if
  `YOUTUBE_OAUTH_TEST_VIDEO_ID_BREATHWORK` is set.
- `--set-thumbnail` is deliberately unimplemented: it prints that the thumbnail write path is
  deferred to Phase 6, because it depends on the channel completing phone verification, and
  exits non-zero. It is a guard, not a stub of the real call.

## Environment variables

Names only — never set a value in a tracked file:

- `YOUTUBE_OAUTH_CLIENT_ID`
- `YOUTUBE_OAUTH_CLIENT_SECRET`
- `YOUTUBE_OAUTH_REFRESH_TOKEN_BREATHWORK`
- `YOUTUBE_OAUTH_REFRESH_TOKEN_MAIN`
- `YOUTUBE_OAUTH_TEST_VIDEO_ID_BREATHWORK` (optional — `youtube-write.cjs` fallback target)

## Quota

- `videos.list`: 1 unit per call
- `videos.update`: 50 units per call

`youtube-write.cjs` appends one entry per API call to
`../../projects/briefs/breathwork-channel-engine/ledger/quota.jsonl` — endpoint, method, units,
channel, video id — and prints a run total at the end.

## Secrets

At most the last four characters of any token are ever printed by either script. Neither
script writes a secret into `.env`; the consent flow prints the variable name and an elided
line for a human to paste in.
