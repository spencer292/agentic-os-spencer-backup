# Platform Content Specifications

## YouTube Shorts

**Title (3 options for user to pick):**
- Max 100 characters
- Front-load the keyword/hook
- Include power words: Free, Proven, Easy, Fast
- Include #Shorts in title for discovery
- Patterns that work:
  - "[Stat] -- Here's Why" (curiosity)
  - "Stop [Bad Thing] -- Do This Instead" (contrarian)
  - "How [Outcome] in [Timeframe]" (how-to)
- Tease long-form content: "Full tutorial on my channel" (41% faster channel growth)
- CTA is mandatory — 22% engagement boost

**Description:**
```
[Hook sentence -- restate the problem or stat from the video]

[2-3 sentences expanding on the value/solution. Reference specific points from the transcript.]

[CTA -- use the exact CTA mentioned in the video, e.g., "Link in bio to try the IX system free"]

My Links:
Subscribe: {your_youtube_url}
LinkedIn: {your_linkedin_url}
Instagram: {your_instagram_url}

#Hashtag1 #Hashtag2 #Hashtag3
```

**Tags:** Array of 10-15 researched keywords
- Primary (5-7): High-volume, directly relevant to the video topic
- Secondary (3-5): Related topics, medium volume
- Long-tail (2-3): Specific phrases people search for

**firstComment:** Engagement question directly related to the video topic
```
"What's the #1 thing killing your [topic] results? Drop it below."
```

**categoryId:** Match to content
- `"28"` Science & Technology
- `"22"` People & Blogs
- `"26"` Howto & Style
- `"27"` Education

---

## Instagram Reels

**Caption -- KEEP IT MINIMAL:**
- **1-3 sentences maximum** (hook + value + CTA)
- **1 call to action** (link in bio / follow / save)
- **3-5 keyword-relevant hashtags** (IG shifting to keyword-based SEO — not 30, targeted only)
- The caption should be readable in 2 seconds
- Frame caption for "send-worthiness" — sends-per-reach is Instagram's #1 distribution signal
- Write searchable, descriptive captions — think "what would someone search for?"

**Format:**
```
[One punchy sentence about the problem/solution from the video.]
[Optional second sentence with the key insight.]
[CTA -- "Link in bio" or "Save this for later."]

#hashtag1 #hashtag2 #hashtag3
```

**firstComment:** Engagement prompt
```
"Save this and share it with someone who needs to hear it."
```

**Thumbnail options:**
- `thumbOffset`: Milliseconds from video start (ask user which moment looks best)
- `instagramThumbnail`: Custom cover image URL (upload via presign if user provides one)

**IMPORTANT:** Instagram caption must be DIFFERENT wording from YouTube. Same message, different angle.

---

## TikTok

**Caption -- SHORT AND PUNCHY:**
- **1-2 sentences max**
- **1 CTA** (link in bio / follow for more)
- **3-5 micro-niche hashtags** (micro-niche = 2.5x distribution vs broad hashtags)
- TikTok users scroll fast -- every word must earn its place
- Captions must match your content niche — algorithm reads captions for categorization
- Consider loop potential — replays are the highest-weight algorithm signal

**Format:**
```
[Punchy hook or stat.] [Key takeaway in one sentence.] Link in bio.

#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
```

**Required platformSpecificData:**
```json
{
  "privacy_level": "PUBLIC_TO_EVERYONE",
  "allow_comment": true,
  "allow_duet": true,
  "allow_stitch": true,
  "content_preview_confirmed": true,
  "express_consent_given": true,
  "video_cover_timestamp_ms": 5000
}
```

**IMPORTANT:** TikTok caption must be DIFFERENT wording from both YouTube and Instagram.

---

## Content Variation Rules

| Aspect | YouTube Shorts | Instagram Reels | TikTok |
|--------|---------------|-----------------|--------|
| **Tone** | Professional, detailed | Casual, direct | Punchy, conversational |
| **Description length** | 4-6 sentences + links | 1-3 sentences | 1-2 sentences |
| **Hashtags** | 3-5 in description + tags field | ~3 in caption | 3-5 in caption |
| **CTA style** | Subscribe / Comment / Link in bio | Save / Share / Link in bio | Follow / Link in bio |
| **First comment** | Engagement question | Save/share prompt | Not supported via API |
