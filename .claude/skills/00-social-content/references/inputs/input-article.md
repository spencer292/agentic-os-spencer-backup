# Input: Article / web page (Scenario F)

Use when the input is a non-video URL — an article, blog post, thread, landing page, tweet, or any web page worth turning into a post.

## Detection signals

Any URL that does NOT match the video URL patterns in `input-video.md`. Specifically:
- Blog/article URLs (`.com/blog/...`, `medium.com/...`, `substack.com/p/...`)
- News sites (`techcrunch.com`, `theverge.com`, etc.)
- Threads (`twitter.com/.../status/...`, `x.com/.../status/...`)
- Landing pages, product pages, docs

## Phase 3 logic

1. Invoke `tool-web-screenshot` with `{URL}` — captures full-page screenshot at desktop viewport.
2. Read the captured screenshot. Extract:
   - **Page title** (the H1 or `<title>`).
   - **Main argument** (the thesis — what is this article saying?).
   - **4–6 key points** (subheadings, bullet lists, callouts).
   - **Notable quotes or data** (numbers, names, dates — these become "anchor" claims for the slides).
   - **Publication date** if visible (signals "newsy" content for `template-matrix.md`).
3. Save extracted content as a structured markdown summary at `{output_base}/{date}/logs/inspiration/{slug}.md`.
4. Build `inspiration_pool` from the extracted content + the original URL as the source.

## Best practices

- **Quote, don't paraphrase.** When the article has a tagline, hero copy, or a punchy stat — preserve the exact wording. That's the post's hook.
- **Anchor claims to dates.** If the article cites "in 2026" or "last quarter", surface that to the orchestrator — it informs whether the post should be `editorial-news` (recent) vs `social-design` (evergreen).
- **Twitter/X threads:** the screenshot may only show the first few tweets. The rest is collapsed. Note this limitation and ask the user whether to thread-unroll if the article is clearly a long thread.
- **Paywalled articles:** the screenshot will only show the preview/lede. Document this in the inspiration log so the draft doesn't claim insights it can't see.
- **Tracking parameters:** strip `?utm_*` and `?ref=*` from the URL before saving — keeps logs clean.
- **Reasoning log:** record what made the URL Scenario F vs B (e.g., "URL contains `youtube.com` but path is `/about` — not a video → Scenario F").
