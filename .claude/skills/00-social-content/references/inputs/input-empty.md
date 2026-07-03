# Input: Empty / "from my sources" (Scenario D)

Use when the user invokes the pipeline with no argument, or says `"from my sources"` / `"use my sources"`. The pipeline scrapes the user's saved sources to find what's worth posting today.

## Detection signals

- Empty message (just `/00-social-content`).
- Phrases: `"from my sources"`, `"use my sources"`, `"what should I post today"`.

## Phase 3 logic

1. Invoke `tool-linkedin-scraper` — pulls recent posts from the user's saved LinkedIn following list. Skip silently on failure (rate limits, auth issues).
2. Invoke `tool-youtube` in **digest mode** — summarizes recent videos from the user's saved channels. Skip silently on failure.
3. Merge both outputs into `inspiration_pool`. Each item carries its source URL for attribution.
4. If both fail or return empty: continue with `brand_context` only. The draft phase then leans on the voice profile + topic memory instead of fresh sources.

## Best practices

- **brand_context is mandatory here.** Without it, the pipeline has nothing to anchor on. If `voice-profile.md` is missing, prompt the user to run `/mkt-brand-voice` first.
- **Run during off-peak hours.** LinkedIn scraping is throttled; running this scenario at 9 AM Brazil time tends to hit rate limits. Document the run time in the log so retries can be scheduled.
- **Source diversity matters.** If LinkedIn returns 20 posts all from the same person, the draft will mirror that one voice. The scraper should de-duplicate; if it doesn't, the orchestrator should cap at 3-per-author before merging.
- **No fresh sources ≠ no post.** If both scrapers fail, fall through to `brand_context` only — the voice profile + saved themes still produce a viable draft, just a less timely one.
- **Reasoning log:** record how many items came from each source, which were filtered out, and what triggered the final angle choice in Phase 5.
