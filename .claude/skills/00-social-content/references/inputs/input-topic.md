# Input: Topic or idea (Scenario C)

Use when the user provides a topic, angle, or idea in free text — no URL, no full post. The pipeline runs trending research to find the strongest angle before drafting.

## Detection signals

- Free-text input that's not empty, not a URL, not a full post.
- Examples: `"AI agents for marketing"`, `"why founders shouldn't outsource sales"`, `"the future of meetings"`.

## Phase 3 logic

1. Check `projects/str-trending-research/` for a brief younger than `sources.trending_research_freshness_days` (from `pipeline.config.yaml`).
2. If a fresh brief exists that matches the topic semantically → use it (skip the trending research call).
3. Otherwise invoke `str-trending-research` with `{topic}`. Store its output in `projects/str-trending-research/` for future cache hits.
4. Build `inspiration_pool` from:
   - Trending research findings (angles, hooks, data points, contrarian takes)
   - The user's original topic phrase (preserved verbatim)
5. Save to `{output_base}/{date}/logs/inspiration/{slug}.md`.

## Best practices

- **Cache hits are the goal.** Trending research is expensive (web calls + LLM). If the user already researched "AI agents for marketing" yesterday, reuse that brief — fresh data isn't usually 1-day-relevant.
- **The brief is a starting point, not the script.** Trending research gives angles; the draft phase picks the strongest one and commits. Don't try to use every angle the brief found.
- **Topic-to-angle mapping happens in draft, not gather.** Phase 3 only collects raw inspiration. Phase 5 chooses which angle the post takes.
- **If brand_context exists:** filter the brief's angles against the brand voice. Contrarian takes that don't fit the brand should be flagged, not silently dropped.
- **Reasoning log:** record both the brief source (fresh call vs cache) AND the angle chosen in Phase 5 (so the audit trail connects topic → brief → angle → draft).
