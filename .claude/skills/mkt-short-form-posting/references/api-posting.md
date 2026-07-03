# API Posting Reference

## Step 5: Upload Video

### Check size
```bash
du -m "VIDEO_PATH" | cut -f1
```

- Under 500MB: Upload directly
- Over 500MB: Use `tool-video-upload` skill to compress first

### Upload to Zernio storage
```bash
# Get presigned URL
curl -s -X POST "https://getlate.dev/api/v1/media/presign" \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "video.mp4", "contentType": "video/mp4"}'

# Upload
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: video/mp4" \
  --upload-file "VIDEO_PATH" \
  --progress-bar
```

### Upload thumbnail (if custom cover image provided)
```bash
curl -s -X POST "https://getlate.dev/api/v1/media/presign" \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "thumbnail.jpg", "contentType": "image/jpeg"}'
```

---

## Step 6: Post via REST API

Use a single multi-platform request with `customContent` per platform:

```bash
curl -s -X POST "https://getlate.dev/api/v1/posts" \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "[FALLBACK_CONTENT]",
    "mediaItems": [{
      "url": "[VIDEO_PUBLIC_URL]",
      "thumbnail": {"url": "[YT_THUMBNAIL_URL]"},
      "instagramThumbnail": "[IG_COVER_URL]"
    }],
    "platforms": [
      {
        "platform": "youtube",
        "accountId": "[YT_ACCOUNT_ID]",
        "customContent": "[YOUTUBE_DESCRIPTION]",
        "platformSpecificData": {
          "title": "[SELECTED_TITLE]",
          "visibility": "public",
          "tags": ["tag1", "tag2", "..."],
          "firstComment": "[YT_FIRST_COMMENT]",
          "categoryId": "[CATEGORY_ID]"
        }
      },
      {
        "platform": "instagram",
        "accountId": "[IG_ACCOUNT_ID]",
        "customContent": "[IG_CAPTION]",
        "platformSpecificData": {
          "shareToFeed": true,
          "firstComment": "[IG_FIRST_COMMENT]",
          "thumbOffset": [THUMB_OFFSET_MS]
        }
      },
      {
        "platform": "tiktok",
        "accountId": "[TT_ACCOUNT_ID]",
        "customContent": "[TIKTOK_CAPTION]",
        "platformSpecificData": {
          "privacy_level": "PUBLIC_TO_EVERYONE",
          "allow_comment": true,
          "allow_duet": true,
          "allow_stitch": true,
          "content_preview_confirmed": true,
          "express_consent_given": true,
          "video_cover_timestamp_ms": [COVER_MS]
        }
      }
    ],
    "publishNow": true
  }'
```

**Reading the API key at runtime:**
```bash
ZERNIO_API_KEY="${ZERNIO_API_KEY:-$(cat .env | grep ZERNIO_API_KEY | cut -d= -f2)}"
```

---

## Step 7: Verify Posts

After posting, verify each platform succeeded:

```
mcp__zernio__posts_list(status=published, limit=5)
```

**Check that you see entries for all 3 platforms.** If any are missing, follow the retry protocol from `tool-zernio-social` skill:

1. Check `posts_list` -- maybe it posted despite timeout
2. Only retry if confirmed NOT published
3. Maximum 3 attempts per platform
4. STOP and report after 3 failures

Report to user:
- Post IDs for each platform
- Platform URLs (from `platformPostUrl` in response)
- Any failures
