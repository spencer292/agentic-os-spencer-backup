# Workflow Steps

## Step 0: Check & Compress Video

### Check Size
```bash
du -m "VIDEO_PATH" | cut -f1
```

**If over 500MB, compress locally:**

```bash
$(command -v HandBrakeCLI || echo "HandBrakeCLI") \
  -i "INPUT_PATH" \
  -o "OUTPUT_PATH" \
  -e nvenc_h264 \
  -q 28 \
  -B 128 \
  --encoder-preset medium \
  -O
```

Use higher -q values (24-28) to get under 500MB. Monitor progress:
```bash
tail -1 "OUTPUT_PATH"
```

### Upload to Zernio Storage

Get presigned URL:
```bash
curl -s -X POST "https://getlate.dev/api/v1/media/presign" \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "video-name.mp4", "contentType": "video/mp4"}'
```

Upload file:
```bash
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: video/mp4" \
  --upload-file "COMPRESSED_VIDEO_PATH" \
  --progress-bar
```

---

## Step 1: Extract Transcript with Timestamps

Use local faster-whisper with GPU (~10x faster than cloud):

```bash
source tools/venv.sh && whisperx "VIDEO_PATH" --model small --output_format srt --language en
```

**Output:** Creates `.txt` (full transcript) and `.srt` (timestamps) in same directory.

**Processing time:** ~2 minutes for 30-minute video with GPU.

See `tool-transcription` skill for details and troubleshooting.

---

## Step 2: Analyze Content & Create Title

Based on transcript, create 5 title options following these patterns:
- How-to: "How to [Outcome] in [Timeframe] ([Qualifier])"
- Curiosity: "I [Did Something Unexpected] and [Result]"
- Direct benefit: "[Outcome] with [Method/Tool]"
- Question: "Can [Tool/Method] Really [Achieve Outcome]?"
- Statement: "The [Adjective] Way to [Outcome]"

**Title rules:**
- 60 characters max (ideal for display)
- Front-load keywords
- Include power words: Free, New, Proven, Easy, Fast, Simple
- Add parenthetical qualifiers: (Full Demo), (Step-by-Step), (2026)

---

## Step 3: Research Tags

See `references/tag-strategy.md` for full tag philosophy, structure, and validation rules.

---

## Step 4: Create Description

**Structure (in order):**

1. **Lead Magnet CTA** (first 2 lines - visible before "Show more")
   ```
   [Hook sentence with value proposition]
   {your_lead_magnet_url}
   ```

2. **Quick Overview** (100-150 words)
   - Simple, digestible language
   - What they'll learn/see
   - Why it matters to them
   - No em-dashes, keep punctuation simple

3. **Social Links**
   ```
   My Links:
   Subscribe: {your_youtube_url}
   LinkedIn: {your_linkedin_url}
   Instagram: {your_instagram_url}
   ```

4. **Timestamps** (consolidated into 10-15 key sections)
   ```
   Timestamps:
   0:00 Section Name
   1:23 Next Section
   ```

5. **Hashtags** (3-5 at the end)
   ```
   #Keyword1 #Keyword2 #Keyword3
   ```

---

## Step 5: Create First Comment CTA

Same CTA as description intro, formatted for engagement:
```
[Question or hook]

{your_lead_magnet_url}

[Brief value statement + call to action]
```

---

## Step 6: ASK USER FOR THUMBNAIL (REQUIRED)

**This step is MANDATORY before posting.**

Use AskUserQuestion tool to ask user:
1. Do you have a thumbnail ready to upload?
2. Or post UNLISTED now and add thumbnail later (two-phase publishing)?

If user provides thumbnail:
- Upload to Zernio storage and get URL
- Include in post

If user wants to post unlisted first:
- Post without thumbnail (unlisted)
- User adds thumbnail manually via YouTube Studio
- Switch to public

---

## Step 7: Get User Approval

**Before posting, show user:**
1. Title (confirm it's correct)
2. Description preview
3. Tags list
4. First comment CTA
5. Thumbnail status

Use AskUserQuestion to confirm: "Ready to post this to YouTube?"

---

## Step 8: Post via Zernio API

**Use REST API for full YouTube features (title, tags, firstComment):**

```bash
curl -s -X POST "https://getlate.dev/api/v1/posts" \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "[DESCRIPTION]",
    "mediaItems": [{"url": "[VIDEO_URL]", "type": "video"}],
    "platforms": [{
      "platform": "youtube",
      "accountId": "$YT_ACCOUNT_ID",
      "platformSpecificData": {
        "title": "[VIDEO_TITLE]",
        "visibility": "public",
        "tags": ["tag1", "tag2", "tag3"],
        "firstComment": "[FIRST_COMMENT_CTA]"
      }
    }],
    "publishNow": true
  }'
```

---

## Step 9: Log Post to Content Database

After successful posting, log the post in **two places**: Supabase (for analytics queries) and a local JSON file (for quick reference and backup).

### 9A. Insert into Supabase

Use the Supabase REST API with the service role key to bypass RLS:

```bash
curl -s -X POST "$SUPABASE_URL/rest/v1/cf_content_posts_log" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "late_post_id": "LATE_POST_ID",
    "external_post_id": "YOUTUBE_VIDEO_ID",
    "platform": "youtube",
    "title": "VIDEO_TITLE",
    "content": "FULL_DESCRIPTION",
    "media_url": "VIDEO_URL",
    "post_url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "status": "published",
    "published_at": "ISO_DATETIME",
    "tags": ["tag1", "tag2", "tag3"],
    "hashtags": ["Hashtag1", "Hashtag2"],
    "thumbnail_url": "THUMBNAIL_URL",
    "lead_magnet_url": "YOUR_LEAD_MAGNET_URL"
  }'
```

**Keys** (from `backend/.env`):
- `SUPABASE_URL`: `$SUPABASE_URL`
- `SUPABASE_ANON_KEY`: `$SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`: `$SUPABASE_SERVICE_ROLE_KEY`

### 9B. Save local JSON log file

Save a JSON file to the `post-logs/` folder inside this skill directory:

**Folder:** `.claude/skills/mkt-content-analytics/post-logs/`

**Filename format:** `YYYY-MM-DD_yt_short-slug.json`
- Date: publish date
- `yt`: platform abbreviation
- `short-slug`: 2-4 word kebab-case summary of the video topic

**Example:** `2026-01-27_yt_ai-sales-campaign.json`

**Required fields in the JSON file:**
```json
{
  "supabase_record_id": "UUID from Supabase insert response",
  "late_post_id": "Zernio API post ID",
  "external_post_id": "YouTube video ID",
  "platform": "youtube",
  "post_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "published_at": "ISO_DATETIME",
  "title": "Full video title",
  "description": "Full YouTube description",
  "tags": ["tag1", "tag2"],
  "hashtags": ["Hashtag1", "Hashtag2"],
  "first_comment": "First comment CTA text",
  "thumbnail_url": "URL to uploaded thumbnail",
  "media_url": "URL to uploaded video",
  "lead_magnet_url": "Current lead magnet URL",
  "source_video": "Local file path to original video"
}
```

### Why both?
- **Supabase:** Enables analytics queries, joins with other tables, used by the `mkt-content-analytics` skill
- **Local JSON:** Lives in `mkt-content-analytics/post-logs/` for quick reference without database access, easy to grep/search across all posts, stores the full content package in one place

This enables analytics tracking via the `mkt-content-analytics` skill.
