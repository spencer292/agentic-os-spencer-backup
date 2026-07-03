---
name: mkt-youtube-content-package
version: 1.0.0
description: Creates complete YouTube video packages including title, description, keywords, timestamps, thumbnail concepts, and posting via Zernio MCP. Use when user wants to publish a video, create YouTube content, or needs help with video SEO.
---

# YouTube Content Package

Create complete YouTube video packages with optimized titles, descriptions, keywords, timestamps, and thumbnail concepts.

## Workflow Overview

0. **Check & compress video** - Must be under 500MB, compress with HandBrake if needed
1. **Upload to Zernio storage** - Get presigned URL and upload video
2. **Extract transcript** - Local faster-whisper with GPU via `tool-transcription`
3. **Create title** - 5 options using proven patterns (60 char max)
4. **Research tags** - Simple, short, psychologically aligned (see tag-strategy ref)
5. **Create description** - Lead magnet CTA, overview, social links, timestamps, hashtags
6. **Create first comment CTA** - Engagement-formatted CTA
7. **ASK USER FOR THUMBNAIL** - REQUIRED before posting
8. **Get user approval** - Show complete package for review
9. **Post via Zernio API** - Publish to YouTube with all fields
10. **Log to database** - Supabase + local JSON for analytics

---

## CRITICAL: Pre-Post Requirements

**NEVER post without:**
1. Asking user for thumbnail image
2. Confirming the title with user
3. Showing complete content package for review
4. Getting explicit approval to post

---

## Configuration

### Zernio API
```
API Key: $ZERNIO_API_KEY
YouTube Account ID: $YT_ACCOUNT_ID
```

### Social Links
```
Subscribe: {your_youtube_url}
LinkedIn: {your_linkedin_url}
Instagram: {your_instagram_url}
```

### Branding Colors
- **Brand color (thumbnails):** Orange `#F97316`
- **IX System logo:** Mint green `#4ADE80` on black `#000000`
- **Text:** Black `#000000` on white, or white `#FFFFFF` on dark

### Lead Magnet (current)
```
YOUR_LEAD_MAGNET_URL
```

---

## Description Style Rules

- No em-dashes (use colons or periods instead)
- No emojis unless specifically requested
- Simple, conversational language
- Short paragraphs (2-3 sentences max)
- Blank lines between sections

---

## Timestamp Creation Guidelines

From SRT file, consolidate into 10-15 meaningful sections:

1. **Group related content** - Don't list every topic change
2. **Use clear labels** - "Setting Up X" not "X Setup Process Begins"
3. **Round timestamps** - Use :00, :30 increments when possible
4. **Start with context** - First timestamp explains what video covers
5. **End with value** - Last timestamps should highlight key outcomes

---

## Thumbnail Text-to-Image Template

```
Clean minimalist YouTube thumbnail, [BACKGROUND_COLOR] background, bold [TEXT_COLOR] sans-serif text on the left side reading "[LINE_1]" with the word "[HIGHLIGHT_WORD]" in [ACCENT_COLOR] with subtle underline, modern tech aesthetic, professional typography, high contrast, clean layout with empty space on right side for logo placement, 1280x720 aspect ratio, no gradients, flat design, editorial style
```

**Phrase guidelines:**
- 4-6 words maximum
- Benefit-focused (what they GET)
- Power words: Free, New, Easy, Fast, Automated, AI
- Avoid: "How to", "Tutorial", generic terms

---

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-transcription` | Required | Transcript extraction with timestamps | Cannot generate timestamps or content from video |
| `tool-video-upload` | Optional | Streamlined video upload | Fall back to manual Zernio API calls |
| `tool-zernio-social` | Required | Zernio API posting | Cannot publish to YouTube |
| `mkt-content-analytics` | Optional | Post tracking and analytics | Local JSON logging still works |

---

## Downstream Skills

| Skill | Relationship |
|-------|-------------|
| `vid-editing-router` | Provides edited video ready for packaging |
| `00-longform-to-shortform` | Provides short-form clips from long-form content |
| `mkt-short-form-posting` | Posts short-form clips to social platforms |

---

## References

| File | Contents |
|------|----------|
| `references/workflow-steps.md` | Detailed steps 0-9 with API examples, curl commands, Supabase logging |
| `references/tag-strategy.md` | Tag philosophy, structure, rules, and validation |
| `references/example-package.md` | Complete example output package |
