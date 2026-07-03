---
name: tool-publisher
version: 1.1.0
description: >
  Publishes a generated social media post via Zernio (MCP first, REST fallback).
  Reads from {output_base}/{date}/{slug}/ (default: {projects_base}/00-social-content/),
  handles image upload, publishes the post, and updates post.yaml + publish-log.md.
  Double-checks with the user before publishing to a platform that doesn't match
  post.yaml — offers to repurpose via mkt-content-repurposing first.
  Triggers on: "post", "publish", "post now", "publish post",
  "I want to post", "post this", "publish this".
---

# tool-publisher

Publishes a draft post from `{output_base}/` (default: `{projects_base}/00-social-content/`) via Zernio.

## Transport selection (MCP first, REST fallback)

Before running, verify:
1. `ZERNIO_API_KEY` is set in `{env_file}`
2. The target social account is connected at https://zernio.com/dashboard

Then pick the transport for this run:

- **If Zernio MCP tools are available in the session** (e.g. `media_generate_upload_link`, `posts_publish_now`): use the MCP flow described in Steps 3–4 below. This is the canonical path.
- **If Zernio MCP tools are NOT available**: fall back to the REST API via the template script `.claude/skills/tool-publisher/scripts/publish_rest.py`. Tell the user once:
  ```
  Zernio MCP isn't loaded — using REST API fallback instead.
  ```
  The script handles presign + upload + create-post in one call. See Step 3–4 (REST path) for the exact invocation. For the underlying HTTP shape (debugging, custom flows), see `.claude/skills/tool-publisher/references/zernio-rest-fallback.md`. Steps 1, 2, 5, 6, 7 below are transport-agnostic.

Do not abort just because the MCP is offline — REST is a first-class path, not a workaround.

### Checking connected accounts

To verify that the target platform is connected before publishing (or to surface what's available during onboarding/debug), run:

```bash
python .claude/skills/tool-publisher/scripts/list_accounts.py [--platform PLATFORM] [--table]
```

Default output is JSON (`{ok, count, accounts: [{id, platform, username}]}`) — easy to parse during Step 2.5. Add `--table` when showing the list to the user. The script also works standalone for debugging.

## Invocation

```
/tool-publisher                             ← lists draft posts, user picks one
/tool-publisher karpathy-quote              ← match by slug across dates
/tool-publisher 2026-05-02 karpathy-quote   ← exact date + slug
```

---

## Step 1: Identify the Post

### Resolve output path

Read `.claude/skills/tool-publisher/skill-pack/config/sys-config.md` → `## Paths` → `output_base` (and `decoupled_base`/`env_file` if needed). When this tool runs as part of `00-social-content`, the orchestrator's sys-config has the same values — installer keeps them in sync.
All slug resolution below uses `{output_base}/{date}/{slug}/` (date is the run date, slug is the post folder).

### With slug argument
Search `{output_base}/*/{slug}/post.yaml`. If multiple dates match, prefer the most recent. If not found, tell the user and stop.

### Without argument
Find all `post.yaml` files under `{output_base}/` where `status: draft` or `status: failed`.
Sort by date descending, limit to 30 days. List them, marking failed ones with `[failed]`:

```
Posts available to publish:

1. 2026-05-02-autoresearch-karpathy  —  linkedin · carousel · 4 slides
2. 2026-05-02-brucer-esa-arena-top1  —  linkedin · single image  [failed]

Which one do you want to publish? (number or slug)
```

If none found: "No posts with status draft or failed found in the last 30 days."

---

## Step 2: Load and Preview

Read:
- `{output_base}/{date}/{slug}/post.yaml` → `platform`, `format`, `slides` (if carousel)
- `{output_base}/{date}/{slug}/caption.md` → post text
- Detect images in `{output_base}/{date}/{slug}/`:
  - Single: `image.png`
  - Carousel: `slide-1.png`, `slide-2.png`, ... (enumerate until file not found)

Check `post.yaml` status field:
- If already `published`: warn the user — "This post has already been published. Do you want to publish it again?" — require explicit confirmation before continuing.
- If `failed`: proceed normally (retry).

Show preview:
```
---
{slug}
Platform: {platform} · Format: {single image | carousel — N slides}
Images: {count}
---
{first 150 chars of caption}...
---
Publish now? (yes / no)
```

If user says no: stop. No changes made.

---

## Step 2.5: Platform mismatch check

Compare the **user-requested platform** (from the invocation — e.g. "publica no instagram") against `post.yaml`'s `platform` field.

- **If they match** (or the user didn't name a platform): continue to Step 3.
- **If they differ**: stop and double-check with the user before changing anything. The caption, hashtags, length, and tone were tuned for the original platform — publishing as-is to a different one usually reads wrong.

Before showing the options, you may run `list_accounts.py --platform <requested>` to confirm the requested platform actually has a connected account — if it doesn't, mention that in the prompt so the user can fix the connection before deciding.

Ask:
```
Heads up: this post was generated for {post.yaml platform},
but you asked me to publish to {requested platform}.

The caption/hashtags/length were tuned for {original}. How do you want to proceed?

1. Repurpose for {requested} first  (recommended — runs mkt-content-repurposing)
2. Publish as-is to {requested}  (I'll just switch the platform field)
3. Publish to the original {original} instead
4. Cancel
```

- **Option 1**: invoke the `mkt-content-repurposing` skill with the source folder and target platform. When it finishes, re-read the new `post.yaml`/`caption.md` and resume at Step 2 (preview the repurposed version).
- **Option 2**: update `post.yaml` `platform:` to the requested value, then continue. Warn the user the content wasn't adapted.
- **Option 3**: continue with the original platform from `post.yaml`.
- **Option 4**: stop. No changes made.

---

## Step 3: Upload Images

### If post has images (image.png or slide-N.png exist)

### LinkedIn carousel → PDF option

If `platform` is `linkedin` AND `format` is `carousel`:

Ask the user:
```
LinkedIn carousels publish best as a PDF (swipeable document post).
How do you want to upload?
1. PDF (recommended — better engagement on LinkedIn)
2. Individual images (faster, works everywhere)
```

**If PDF:**
```bash
python .claude/skills/tool-publisher/scripts/slides_to_pdf.py "{output_base}/{date}/{slug}" --output "{output_base}/{date}/{slug}/carousel.pdf"
```
If the script fails (Pillow not installed or other error): fall back to individual images automatically and warn: "PDF packaging failed, uploading individual images instead."

Upload `carousel.pdf` as a single file instead of individual slides. Set `media_urls` from the single upload response.

**If individual images:** continue to upload normally.

For all other platforms or single-image posts: skip this section.

### Upload path

**MCP path** (Zernio MCP tools available):

1. Call `media_generate_upload_link` → receive `upload_url` and `token`
2. Tell the user:
   ```
   Open this link in your browser to upload the images:
   {upload_url}

   Files to upload (in order):
   {list of filenames, one per line}

   Files are located at: {output_base}/{date}/{slug}/

   Confirm here when done.
   ```
3. Wait for user confirmation ("done", "ok", "ready")
4. Call `media_check_upload_status` with the token
   - If not complete yet: "Upload still processing, wait a few seconds and confirm again."
   - If complete: extract `media_urls` (comma-separated list of uploaded file URLs)

**REST path** (Zernio MCP not available): Steps 3 and 4 happen in one shot via the template script. **Skip to Step 4 (REST path)** — it handles upload + publish together.

### If post has no images

Skip. Set `media_urls = ""`

---

## Step 4: Publish

### MCP path

Call `posts_publish_now` with:
- `content`: full text from `caption.md` (verbatim — no truncation)
- `platform`: value from `post.yaml` (post-mismatch-check)
- `media_urls`: from Step 3 (or `""` if no images)

If `posts_publish_now` is not available, call `posts_create` with `publish_now=true` and same parameters.

Capture the response: `post_id` and `post_url` (if returned).

### REST path (one-shot publish)

Run the template script. It loads the API key from `.env`, presigns + uploads each media file, and creates the post.

```bash
python .claude/skills/tool-publisher/scripts/publish_rest.py "{output_base}/{date}/{slug}"
```

Common flags:
- `--platform instagram` — override `post.yaml` platform (use this when the user explicitly chose a different target via Step 2.5 option 2).
- `--pdf` — for LinkedIn carousels: build a PDF from the slides and upload as a document post. Adds `--document-title` automatically (defaults to the slug).
- `--schedule-for 2026-05-20T14:00:00Z` — schedule instead of publish now (ISO 8601 UTC).
- `--account-id <id>` — needed only if multiple accounts are connected for the same platform.

The script prints a single JSON object on stdout:
```json
{"ok": true, "post_id": "...", "platform": "instagram", "status": "published",
 "post_url": "https://...", "scheduled_for": null, "transport": "rest", "media_count": 5}
```

On failure: `{"ok": false, "error": "..."}` with exit code 1. Parse the JSON to fill Step 5.

**Windows console gotcha:** the script forces UTF-8 stdout, so emoji/arrow characters in the response won't crash the parent shell.

---

## Step 5: Update post.yaml

### On success

Update `post.yaml` — change top-level `status` and add/update `publish` block:

```yaml
status: published

publish:
  status: published
  published_at: {ISO 8601 timestamp, e.g. 2026-05-02T14:32:00}
  platform_post_id: {post_id from Zernio response}
  post_url: {url if returned, else ~}
  error: ~
```

### On failure

```yaml
status: failed

publish:
  status: failed
  published_at: ~
  platform_post_id: ~
  post_url: ~
  error: "{error message}"
```

---

## Step 6: Log

Append one line to `{output_base}/publish-log.md`.

**Success:**
```
| {YYYY-MM-DDTHH:MM} | {platform} | {slug} | published | {post_url or —} |
```

**Failure:**
```
| {YYYY-MM-DDTHH:MM} | {platform} | {slug} | failed | {error summary} |
```

---

## Step 7: Report

### Success
```
Published to {platform}!
Post ID: {platform_post_id}
{post_url, if available}
```

### Failure
```
Failed to publish: {error}

post.yaml updated with status: failed.
```

Common fixes by error type:
- `401` / `Invalid API key`: check `ZERNIO_API_KEY` in `{env_file}`
- `No account connected`: connect `{platform}` at https://zernio.com/dashboard
- `Media upload failed` / `Upload not complete`: retry the upload
- `Rate limit`: wait a few minutes and try again
