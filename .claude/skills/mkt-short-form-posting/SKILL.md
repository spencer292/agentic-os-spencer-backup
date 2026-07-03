---
name: mkt-short-form-posting
version: 1.0.0
description: Posts short-form video (Shorts/Reels/TikTok) with platform-specific content packages. Transcribes video, creates tailored titles/descriptions/hashtags per platform, handles thumbnails, and publishes via Zernio API. Triggers on "post short", "post reel", "post shorts", "upload short", "short-form", "reels", "post to youtube instagram tiktok".
argument-hint: [video_file_path]
dependencies:
  - tool-transcription (for transcript extraction)
  - tool-video-upload (for compression + upload)
  - tool-zernio-social (for account IDs, retry logic, API reference)
allowed-tools:
  - mcp__zernio__*
  - Bash(*)
  - AskUserQuestion
  - Read
---

# Short-Form Video Posting

Post short-form video content (YouTube Shorts, Instagram Reels, TikTok) with unique, transcript-driven content per platform.

---

## Workflow Overview

```
1. Transcribe video (WhisperX)
2. Confirm profile (from pipeline.config.yaml)
3. Create platform-specific content package
4. Show package to user for approval
5. Upload video to Zernio storage
6. Post via REST API (single multi-platform request)
7. Verify all posts succeeded
```

---

## Platform Algorithm Intelligence

Each platform's algorithm prioritizes different signals. Content packages must be optimized for each platform's specific ranking factors, not just formatted differently.

See platform-specific algorithm guides:
- `references/tiktok-posting-guide.md` — cold start system, micro-niche strategy, hashtag rules, loop optimization
- `references/youtube-shorts-posting-guide.md` — retention benchmarks, title strategy, CTA effectiveness, freshness factor
- `references/instagram-reels-posting-guide.md` — sends-per-reach optimization, 3/8/12 rule, keyword SEO shift, Trial Reels

### Key Differences in Content Strategy

| Aspect | TikTok | YouTube Shorts | Instagram Reels |
|--------|--------|---------------|-----------------|
| **#1 Signal** | Watch time + replays | Completion rate | Sends per reach |
| **Caption Strategy** | Match algorithm categories, niche hashtags | Keyword-rich title, #Shorts | Keyword SEO, minimal hashtags |
| **CTA Focus** | Loop/replay hook | Subscribe + long-form tease | "Send to a friend" framing |
| **Hashtags** | 3-5 micro-niche | In tags field, not caption | 3-5 keyword-relevant only |

---

## Step 1: Transcribe the Video

Use WhisperX (preferred) via the `tool-transcription` skill:

```bash
source tools/venv.sh
whisperx "VIDEO_PATH" --model small --output_format json --language en
```

Read the transcript output to understand:
- **Core message:** What problem does the video solve?
- **Key points:** What are the 2-4 main takeaways?
- **CTA mentioned:** What does the speaker tell viewers to do?
- **Hook:** What's the opening line/stat that grabs attention?

This transcript drives ALL content creation. Do not write generic descriptions.

---

## Step 2: Confirm Profile

Ask the user which profile to use. Reference the `tool-zernio-social` skill for current account IDs.

Account IDs are loaded from `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml` under `publishing.profiles`.
Use `mcp__zernio__accounts_list` to discover connected accounts. **Always verify before posting.**

**Pipeline mode:** When invoked by `00-longform-to-shortform` or any automated orchestrator, use the profile specified in `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml` (`publishing.profile`) without asking the user.

---

## Step 3: Create Platform-Specific Content

**CRITICAL: Each platform MUST have unique wording.** Same core message, different phrasing. Never copy-paste the same text across platforms.

See `references/platform-content.md` for full specs per platform (YouTube Shorts, Instagram Reels, TikTok).

### Content Variation Rules

| Aspect | YouTube Shorts | Instagram Reels | TikTok |
|--------|---------------|-----------------|--------|
| **Tone** | Professional, detailed | Casual, direct | Punchy, conversational |
| **Description length** | 4-6 sentences + links | 1-3 sentences | 1-2 sentences |
| **Hashtags** | 3-5 in description + tags field | ~3 in caption | 3-5 in caption |
| **CTA style** | Subscribe / Comment / Link in bio | Save / Share / Link in bio | Follow / Link in bio |
| **First comment** | Engagement question | Save/share prompt | Not supported via API |

---

## Step 4: Show Content Package to User

Present all 3 platforms clearly:

```
--- YOUTUBE SHORTS ---
Title options:
  1. [Title option 1]
  2. [Title option 2]
  3. [Title option 3]

Description:
[Full description]

Tags: [tag1, tag2, tag3, ...]
First comment: [comment text]

--- INSTAGRAM REELS ---
Caption:
[Full caption with hashtags]

First comment: [comment text]
Thumbnail: [thumbOffset suggestion or ask for custom]

--- TIKTOK ---
Caption:
[Full caption with hashtags]

Cover frame: [suggested timestamp in ms]
```

**Ask for:**
1. Title selection (YouTube -- pick 1 of 3)
2. Thumbnail preference per platform
3. Any edits to captions
4. Explicit approval to post

**Standalone mode:** NEVER post without user saying "yes" or "publish" or "go ahead".

**Pipeline mode:** When invoked by `00-longform-to-shortform` or any automated orchestrator, skip user approval. Auto-select the first title option, use default thumbnail offset from config, and proceed to post based on `publishing.mode` in `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml`.

---

## Steps 5-7: Upload, Post, Verify

See `references/api-posting.md` for upload, REST API curl examples, and verification steps.

---

## Social Links

Configure your social links in `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml` under `publishing.profiles.{profile}.social_links`.

## Branding
- **Brand color:** Orange `#F97316`
- **IX System:** Mint green `#4ADE80` on black `#000000`

---

## References

| File | Contents |
|------|----------|
| `references/platform-content.md` | YouTube Shorts, Instagram Reels, TikTok content specs and variation rules |
| `references/tiktok-posting-guide.md` | TikTok algorithm signals, cold start, micro-niche, hashtag strategy |
| `references/youtube-shorts-posting-guide.md` | YouTube Shorts retention benchmarks, title strategy, CTA data |
| `references/instagram-reels-posting-guide.md` | Instagram sends-per-reach, 3/8/12 rule, keyword SEO, Trial Reels |
| `references/api-posting.md` | Upload, REST API curl examples, verification steps |
| `references/example-package.md` | Complete example content package |
