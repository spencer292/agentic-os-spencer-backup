# Phase 6 — POST (separate run — approval-gated)

Runs on its own (manual `/00-video-studio post` or a cron), never inline with the build. This keeps a
human between "rendered" and "published".

## Steps

1. List `4_Approved/` (`parentId = '1ERx8qZhFaQ7-3-gJrlXTc8Wc-Uc1edIL'`). Each `clip.mp4` Roy dragged
   in is greenlit.
2. For each approved clip, build platform packages (reuse `mkt-short-form-posting` / the L2S
   `l2s-content-packager` agent):
   - Title, description, hashtags per platform in `post.platforms`.
   - Pull caption/voice tone from personal `voice-profile` when present.
3. Publish via `scripts/zernio_post.cjs` (uploads the video once, creates one post per platform):
   - `--mode draft` → create drafts, return draft URLs (default — safest).
   - `--mode schedule --when <ISO>` → schedule directly.
   - `--mode now` → publish immediately on create.
4. On success, move the clip to `5_Posted/{YYYY-MM-DD}_{job}/` and write `posted.txt` with the
   platform URLs.
5. Log everything; surface draft/post URLs to the user.

## Flipping existing drafts live (`scripts/zernio_publish.cjs`)

When clips were already posted **as drafts** (the default) and the user says "publish them" /
"flip my drafts live", do NOT re-create — flip the existing drafts in place. No re-upload, no
duplicates.

```bash
# publish all drafts that mention "scammed", ~5 min out, with the book as first comment
node .claude/skills/00-video-studio/scripts/zernio_publish.cjs \
  --match "scammed" --book https://allthepower.co.uk/book

node .../zernio_publish.cjs --ids <id1>,<id2> --in 3        # explicit posts, 3 min out
node .../zernio_publish.cjs --match "scam" --dry-run         # preview, no writes
```

**Mechanism (the non-obvious part):** the getlate API only honours `publishNow` on *create*, and
exposes **no publish endpoint** (`/posts/{id}/publish` → 404). The working flip is
`PUT /posts/{id}` with `scheduledFor` + `isDraft:false`, which moves a draft → `scheduled`; Zernio's
scheduler then fires it at that time. So "publish now" = schedule a few minutes out (default +5,
API min +2). Posts are wrapped as `{post:{…}}` on GET/PUT, and `accountId` comes back as an object
— normalise it to its `_id` string before PUT (the script does this).

**First comments:** only `linkedin, instagram, facebook, youtube` get one by default (API-reliable);
Twitter/Threads/TikTok are skipped to avoid blocking the post. YouTube's existing engagement comment
is appended to, not clobbered. Override with `--comment-platforms`.

## Notes
- Idempotent: a clip already mirrored in `5_Posted` is skipped.
- If Zernio key missing: package only, leave in Approved, tell the user to upload manually.
- `zernio_post.cjs` / `zernio_publish.cjs` / `zernio_accounts.cjs` all read `ZERNIO_API_KEY` from the
  project `.env` internally via Node `fetch` — no `curl` (which is permission-blocked) and the key is
  never printed.
