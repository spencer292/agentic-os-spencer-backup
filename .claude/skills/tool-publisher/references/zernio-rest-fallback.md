# Zernio REST API — Fallback (when MCP isn't loaded)

Use this when the Zernio MCP server isn't available in the current session — e.g. `/mcp` doesn't list `zernio: connected`, Claude Code wasn't restarted after `.mcp.json`/`settings.local.json` changes, or you're scripting outside Claude Code entirely. The REST endpoints below cover the exact same surface `tool-publisher` uses via MCP.

> **Bonus:** the REST flow is actually simpler than the MCP flow because it uses presigned URLs (server-to-server) instead of a browser upload — no manual "open this link and drop files" step.

---

## Setup

**Base URL:** `https://zernio.com/api/v1`
**Auth:** `Authorization: Bearer ${ZERNIO_API_KEY}`

The key lives in `.env` at the project root. Load it before running curl:

```powershell
# PowerShell — one-liner that exports ZERNIO_API_KEY from .env into the current session
Get-Content .env | Where-Object { $_ -match '^ZERNIO_API_KEY=' } | ForEach-Object {
  $env:ZERNIO_API_KEY = ($_ -split '=', 2)[1]
}
```

```bash
# Git Bash / WSL
export $(grep '^ZERNIO_API_KEY=' .env | xargs)
```

Verify:
```bash
curl -s https://zernio.com/api/v1/accounts \
  -H "Authorization: Bearer $ZERNIO_API_KEY" | jq '.accounts | length'
```
A number > 0 means auth works. `401` → key wrong. `404` → wrong URL.

---

## The publishing flow (3 steps)

### Step 1 — Find the account ID

```bash
curl -s https://zernio.com/api/v1/accounts \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  | jq '.accounts[] | {id: ._id, platform, username}'
```

Output looks like:
```json
{ "id": "abc123...", "platform": "linkedin", "username": "Your Name" }
{ "id": "def456...", "platform": "twitter", "username": "@yourhandle" }
```

Save the `id` for the platform you want. tool-publisher's `post.yaml` doesn't store this — Zernio auto-resolves it when there's only one account per platform, but for the REST flow you pass it explicitly.

### Step 2 — Upload media

#### 2a. Get a presigned URL

```bash
curl -s -X POST https://zernio.com/api/v1/media/presign \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "carousel.pdf",
    "contentType": "application/pdf"
  }'
```

Returns:
```json
{
  "uploadUrl": "https://storage.googleapis.com/...?signature=...",
  "publicUrl": "https://media.zernio.com/temp/carousel.pdf"
}
```

#### 2b. Upload the file (PUT to `uploadUrl`)

```bash
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: application/pdf" \
  --upload-file ./carousel.pdf
```

No auth header needed on the PUT — the URL itself is signed.

Save `publicUrl`. That's what goes into the post.

**Supported content types:**
- `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- `video/mp4`, `video/quicktime`, `video/webm`
- `application/pdf` (LinkedIn document carousel)

Max 5 GB per file. Files are kept ~7 days in temp storage.

### Step 3 — Create the post (publish now)

```bash
curl -s -X POST https://zernio.com/api/v1/posts \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Caption text here",
    "mediaItems": [
      { "type": "document", "url": "<publicUrl from step 2>" }
    ],
    "platforms": [
      {
        "platform": "linkedin",
        "accountId": "<account id from step 1>",
        "platformSpecificData": {
          "documentTitle": "My Carousel Title"
        }
      }
    ],
    "publishNow": true
  }'
```

Response:
```json
{
  "post": {
    "_id": "post_xxx",
    "status": "published",
    "platforms": [
      {
        "platform": "linkedin",
        "status": "published",
        "platformPostUrl": "https://www.linkedin.com/posts/..."
      }
    ]
  }
}
```

---

## Per-content-type cheat sheet

### LinkedIn carousel as PDF (recommended for document posts)
```json
{
  "mediaItems": [{ "type": "document", "url": "..." }],
  "platforms": [{
    "platform": "linkedin",
    "accountId": "...",
    "platformSpecificData": { "documentTitle": "Title shown above PDF" }
  }]
}
```

### LinkedIn carousel as individual images (up to 20)
```json
{
  "mediaItems": [
    { "type": "image", "url": "https://.../slide-1.png" },
    { "type": "image", "url": "https://.../slide-2.png" },
    { "type": "image", "url": "https://.../slide-3.png" }
  ],
  "platforms": [{ "platform": "linkedin", "accountId": "..." }]
}
```

### LinkedIn single image
```json
{
  "mediaItems": [{ "type": "image", "url": "..." }],
  "platforms": [{ "platform": "linkedin", "accountId": "..." }]
}
```

### Instagram carousel (up to 10 mixed image/video)
```json
{
  "mediaItems": [
    { "type": "image", "url": "..." },
    { "type": "image", "url": "..." }
  ],
  "platforms": [{ "platform": "instagram", "accountId": "..." }]
}
```

### Cross-post (same content to multiple platforms)
```json
{
  "platforms": [
    { "platform": "linkedin", "accountId": "..." },
    { "platform": "twitter", "accountId": "..." }
  ]
}
```

For Twitter, watch the 280-char limit — use `customContent` per platform if cross-posting from longer copy:
```json
{
  "content": "Long LinkedIn version...",
  "platforms": [
    { "platform": "linkedin", "accountId": "..." },
    {
      "platform": "twitter",
      "accountId": "...",
      "customContent": "Short tweet version"
    }
  ]
}
```

### Schedule instead of publish now
Replace `"publishNow": true` with `"scheduledFor": "2026-05-20T14:00:00Z"` (ISO 8601 UTC).

### Save as draft
Omit both `publishNow` and `scheduledFor` → defaults to draft.

---

## Mapping `post.yaml` → REST payload

`tool-publisher` reads from `post.yaml`. Here's how each field maps to the REST body:

| `post.yaml` field | REST body field |
|---|---|
| `caption.md` content | `content` |
| `platform` | `platforms[].platform` |
| account (auto-resolved by Zernio) | `platforms[].accountId` |
| `slide-N.png` files | `mediaItems[].url` (one per slide) |
| `format: carousel` + LinkedIn + PDF mode | one `mediaItems[].type: document` |
| `style.dimensions` etc. | not needed (Zernio honors source dimensions) |

---

## Updating `post.yaml` after a REST publish

The MCP flow auto-updates `post.yaml` with the publish result. With REST you do it manually:

```yaml
status: published

publish:
  status: published
  published_at: 2026-05-15T14:32:00
  platform_post_id: "<post._id from response>"
  post_url: "<platforms[0].platformPostUrl from response>"
  error: ~
```

And append to `{output_base}/publish-log.md`:
```
| 2026-05-15T14:32 | linkedin | mercedes-benz-n8n-automacao | published | https://linkedin.com/posts/... |
```

---

## Complete worked example — Mercedes carousel as LinkedIn PDF

This is the exact sequence to publish `projects/00-social-content/2026-05-15/mercedes-benz-n8n-automacao/` via REST.

```bash
# 1. Load env
export $(grep '^ZERNIO_API_KEY=' .env | xargs)

# 2. Build PDF from slides (Pillow required)
python .claude/skills/tool-publisher/scripts/slides_to_pdf.py \
  "projects/00-social-content/2026-05-15/mercedes-benz-n8n-automacao" \
  --output "projects/00-social-content/2026-05-15/mercedes-benz-n8n-automacao/carousel.pdf"

# 3. Find LinkedIn account ID
LINKEDIN_ID=$(curl -s https://zernio.com/api/v1/accounts \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  | jq -r '.accounts[] | select(.platform == "linkedin") | ._id' \
  | head -1)
echo "LinkedIn account: $LINKEDIN_ID"

# 4. Get presigned URL for the PDF
PRESIGN=$(curl -s -X POST https://zernio.com/api/v1/media/presign \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "mercedes-carousel.pdf", "contentType": "application/pdf"}')

UPLOAD_URL=$(echo "$PRESIGN" | jq -r '.uploadUrl')
PUBLIC_URL=$(echo "$PRESIGN" | jq -r '.publicUrl')

# 5. Upload PDF
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  --upload-file "projects/00-social-content/2026-05-15/mercedes-benz-n8n-automacao/carousel.pdf"

# 6. Read caption
CAPTION=$(cat "projects/00-social-content/2026-05-15/mercedes-benz-n8n-automacao/caption.md")

# 7. Publish
curl -s -X POST https://zernio.com/api/v1/posts \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg content "$CAPTION" \
    --arg url "$PUBLIC_URL" \
    --arg accountId "$LINKEDIN_ID" \
    '{
      content: $content,
      mediaItems: [{type: "document", url: $url}],
      platforms: [{
        platform: "linkedin",
        accountId: $accountId,
        platformSpecificData: {documentTitle: "Mercedes-Benz n8n automation"}
      }],
      publishNow: true
    }')"
```

The final response contains `post._id`, `platforms[0].status`, and `platforms[0].platformPostUrl` — paste those back into `post.yaml`.

---

## Troubleshooting

| Status | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | API key missing or invalid | Check `$env:ZERNIO_API_KEY` is set; regenerate at https://zernio.com/dashboard/api-keys |
| `400 missing_required_field` | Body missing `content` or `platforms` | Most posts require either text content or media items |
| `400 ads_connection_required` | Trying to use an ads-only endpoint | Not relevant for `tool-publisher` |
| `404 account_not_found` | Wrong `accountId` | Re-run `GET /v1/accounts` |
| `429 rate_limit_error` | Too many requests | Wait for `Retry-After` header; free tier is 60 req/min, paid is 600+ |
| `502 platform_error` | Upstream platform (LinkedIn etc.) rejected | Inspect `platformError` in response; common: image too large, duplicate content, expired token |
| Post created but never publishes | Status stuck on `scheduled` or `processing` | Wait ~30s for media to process; check via `GET /v1/posts/{id}` |

For platform-specific limits (LinkedIn 3000 char, Twitter 280, Instagram requires media, etc.) see the [Platforms section](https://docs.zernio.com/platforms) of Zernio's docs.

---

## When to use REST vs MCP

| Situation | Use |
|---|---|
| Inside a Claude Code session, MCP loaded | MCP (cleaner — `tool-publisher` handles state) |
| MCP not loaded and restart not viable | REST |
| Automating from CI / cron / external script | REST (no Claude Code dependency) |
| Need an endpoint not exposed by MCP | REST (the MCP wraps a subset of the API) |
| Publishing the same post.yaml repeatedly during dev | REST (faster iteration, no browser upload step) |

For the standard `tool-publisher` flow inside Claude Code, the MCP path stays canonical — this doc is the parachute, not the main route.
