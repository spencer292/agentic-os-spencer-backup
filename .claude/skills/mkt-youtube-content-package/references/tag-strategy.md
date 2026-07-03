# Tag Strategy

Tags should be **simple, short, and psychologically aligned** with how real people search and how AI agents categorize content.

## Tag Philosophy

1. **Think like the searcher.** What would someone literally type into YouTube? Not full sentences. Short, simple words and phrases. "AI sales" not "AI powered sales campaign automation system."
2. **SEO layer.** Cover the core topic, the tools/methods, and the outcome. YouTube matches tags to search queries. Simple tags cast a wider net.
3. **AI agent layer.** AI systems (Google Discover, YouTube recommendations, ChatGPT search, Perplexity) categorize content semantically. Use clean, unambiguous terms that make it easy for agents to understand what the video is about and who it is for.

## Tag Structure

**Core topic tags (3-5):** The simplest words describing what the video IS about.
- One or two words max. The obvious stuff.
- Example: "AI sales", "sales campaign", "AI marketing"

**Outcome tags (2-3):** What the viewer GETS from watching.
- Example: "get clients", "book appointments", "client acquisition"

**Identity tags (2-3):** WHO is this for. How the target audience describes themselves.
- Example: "agency owner", "lead generation", "marketing agency"

**Tool/method tags (2-3):** Specific tools, systems, or methods shown.
- Example: "AI agent", "sales automation", "outreach system"

**Discovery tags (2-3):** Adjacent topics that bring in related audiences.
- Example: "AI tools", "business growth", "sales system"

## Tag Rules

- **HARD LIMIT: Each tag must be under 28 characters** -- YouTube API rejects tags at or near 30 chars. Stay safely under.
- Keep tags simple: 1-3 words each (4 words ONLY if total stays under 28 chars)
- No filler words ("how to use", "best way to")
- No duplicating the title verbatim as a tag
- Prioritize words people actually type, not marketing jargon
- Total of all tags combined must be under 500 characters
- **Before posting, validate every tag:** `tag.length < 28` -- if ANY tag fails, shorten it

## Zernio API Format

Tags are a **string array** in the Zernio API:
```json
["AI sales", "sales campaign", "AI agent", "get clients", "agency owner", "sales automation"]
```

**Pre-flight check before posting:** Loop through all tags and verify each is under 28 characters. YouTube API will reject the entire post with `invalidTags` error if any single tag is too long.
