---
name: tool-zernio-social
version: 1.0.0
description: Posts content to social media using Zernio MCP. Supports Twitter, Instagram, LinkedIn, TikTok, Bluesky, Facebook, YouTube, Pinterest, Threads, Google Business, Telegram, Snapchat, and Reddit. Use when user wants to post, schedule, draft, upload media, or manage social media content. Triggers on "post to", "schedule post", "social media", "upload to", "publish to", "cross-post", "twitter", "instagram", "linkedin", "youtube", "tiktok", "facebook", "threads", "bluesky".
argument-hint: [content] [platform]
allowed-tools:
  - mcp__zernio__*
  - Bash(curl*)
  - AskUserQuestion
---

# Zernio Social Media Posting

Post and schedule content to social media platforms using Zernio API and MCP tools.

## Configuration

### API Key
```
$ZERNIO_API_KEY
```

### Connected Accounts
Configure your accounts in `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml` under `publishing.profiles`.
Use `mcp__zernio__accounts_list` to discover your connected account IDs.

---

## CRITICAL: Pre-Post Requirements

Before posting ANY content, you MUST:

1. **Ask for thumbnail** (for YouTube/video content)
2. **Confirm title** with user
3. **Show content package** for review
4. **Get explicit approval** to post

**Never post without user confirmation.**

---

## Posting Workflow

### Step 1: Prepare Content

For each platform, prepare the required fields:

| Platform | Required | Optional |
|----------|----------|----------|
| YouTube | title, content (description), media_url | tags, firstComment |
| LinkedIn | content | media_urls |
| Twitter | content | media_urls |
| Instagram | content, media_url | - |
| TikTok | content, media_url | - |

### Step 2: Ask User for Missing Items

**Always ask for:**
- Thumbnail image (YouTube/video posts)
- Confirmation of title
- Any edits to description/content

Use AskUserQuestion tool to confirm before posting.

### Step 3: Post via Zernio API

See `references/api-examples.md` for full curl examples covering YouTube, LinkedIn, threads, cross-posting, and media upload.

---

## YouTube-Specific Fields

When posting to YouTube via REST API, use `platformSpecificData`:

| Field | Description |
|-------|-------------|
| title | Video title (required) |
| visibility | public, private, or unlisted |
| tags | Comma-separated keywords |
| firstComment | Auto-posted comment after publish |

**Tags format:** `"AI marketing, sales automation, lead generation"`

---

## Scheduling

| Mode | Parameter |
|------|-----------|
| Publish now | `"publishNow": true` |
| Draft | `"isDraft": true` |
| Schedule | `"scheduledFor": "2026-01-28T15:00:00Z"` |

---

## Supported Platforms

Twitter/X, Instagram, LinkedIn, TikTok, YouTube, Facebook, Pinterest, Reddit, Threads, Bluesky, Google Business, Telegram, Snapchat

---

## Error Handling

| Error | Solution |
|-------|----------|
| "Account not found" | Verify account ID matches connected account |
| "Invalid media" | Check file size (<500MB for video) and format |
| "Rate limited" | Wait and retry |

---

## Checklist Before Posting

- [ ] Content prepared and reviewed
- [ ] Title confirmed (YouTube)
- [ ] Tags formatted with commas (YouTube)
- [ ] Thumbnail requested/confirmed (YouTube)
- [ ] First comment CTA ready (YouTube)
- [ ] User approved posting

---

## References

| File | Contents |
|------|----------|
| `references/api-examples.md` | All curl examples: YouTube, LinkedIn, threads, cross-posting, media upload |
