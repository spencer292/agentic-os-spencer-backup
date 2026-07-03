---
name: mkt-content-analytics
version: 1.0.0
description: Retrieve and analyze social media post performance using Zernio MCP. Use when user wants to check analytics, review post performance, get improvement suggestions, or compare content metrics across platforms.
---

# Content Analytics

Retrieve analytics for logged posts and provide data-driven improvement recommendations.

## Working path: Zernio REST (use this first)

The MCP workflow below assumes the Zernio MCP is connected. In most environments it is **not** (posting/publishing run over the getlate.dev REST API via Node). When the MCP is unavailable, use these scripts — they read `ZERNIO_API_KEY` / `NOTION_API_TOKEN` from `.env` internally:

```
# Read performance for any posts (table + JSON). Zernio aggregates all platforms server-side.
node scripts/zernio_analytics.cjs --since 30d
node scripts/zernio_analytics.cjs --ids <latePostId,...> --json out.json   # specific posts
node scripts/zernio_analytics.cjs --match "scammed" --sync                 # force a fresh sync first

# Append a time-series snapshot to the "Post Analytics" Notion DB
node scripts/zernio_analytics_to_notion.cjs --in out.json
```

**Key facts about Zernio analytics (learned 2026-06-15):**
- All metrics live in the paginated `GET /analytics` feed, one row per post keyed by `latePostId`. There is **no** `/posts/{id}/analytics` endpoint (404) and the post object carries no metrics.
- The feed has `overview.lastSync` + `dataStaleness`; numbers are **synced periodically, not real-time**. `zernio_analytics.cjs` auto-triggers `?sync=true` when stale.
- **Field population is uneven** — `reach` is often 0 on YouTube/TikTok/X/Threads; `views` is the meaningful number there. Don't benchmark engagement on a denominator a platform doesn't report (see the caveat under Step 3).

### Motion / time-series tracking

The **`Zernio Analytics Snapshot`** cron job (`cron/jobs/zernio-analytics-snapshot.md`, daily 06:00) runs the two scripts above and appends one row per recent post per day to the **Post Analytics** Notion DB (`database_id f025e2e2-64a3-4b9d-bf66-239e8b32d180`, under *Social Media Workspace Overview*). Filter that DB by `Post ID` to see a single post's curve over time; group by `Captured At` for a daily cross-section.

## Quick Commands

- "Check my YouTube analytics" - Get recent YouTube video performance
- "How did my last post do?" - Analyze most recent post
- "Compare my posts" - Side-by-side performance comparison
- "What's working?" - Identify top-performing content patterns

## Workflow

### Step 1: List Logged Posts

Query recent posts from cf_content_posts_log (if connected to Supabase) or use Zernio MCP:

```
Use mcp__zernio__posts_list with:
- status: "published"
- limit: 10
```

### Step 2: Fetch Analytics

**For All Platforms:**
```
Use mcp__zernio__analytics_get_analytics with:
- platform: "youtube" (or linkedin, instagram, twitter, etc.)
- limit: 50
- sort_by: "date"
- order: "desc"
```

**For Specific Post:**
```
Use mcp__zernio__analytics_get_analytics with:
- post_id: "LATE_POST_ID"
```

**For YouTube Daily Breakdown:**
```
Use mcp__zernio__analytics_get_you_tube_daily_views with:
- video_id: "YOUTUBE_VIDEO_ID"
- account_id: "LATE_ACCOUNT_ID"
- start_date: "YYYY-MM-DD" (optional, defaults to 30 days ago)
```

**For LinkedIn Aggregate:**
```
Use mcp__zernio__analytics_get_linked_in_aggregate_analytics with:
- account_id: "LATE_ACCOUNT_ID"
- aggregation: "TOTAL" or "DAILY"
- metrics: "IMPRESSION,REACTION,COMMENT,RESHARE"
```

**For Follower Growth:**
```
Use mcp__zernio__accounts_get_follower_stats with:
- from_date: "YYYY-MM-DD"
- to_date: "YYYY-MM-DD"
- granularity: "daily"
```

### Step 3: Analyze Performance

Compare metrics against benchmarks:

| Metric | Good | Great | Excellent |
|--------|------|-------|-----------|
| YouTube CTR | 4-6% | 6-10% | 10%+ |
| YouTube Retention | 40% | 50% | 60%+ |
| LinkedIn Engagement | 2% | 5% | 10%+ |
| Instagram Engagement | 3% | 6% | 10%+ |

### Step 4: Generate Recommendations

Based on data patterns, suggest:
- **Title improvements** - If CTR is low
- **Thumbnail changes** - If impressions high but clicks low
- **Content structure** - If retention drops early
- **Posting time** - Based on engagement patterns
- **Hashtag optimization** - If reach is limited

## Metrics by Platform

### YouTube
- views, likes, comments, shares
- watch_time_minutes, average_view_duration
- subscribers_gained, subscribers_lost
- impressions, click_through_rate
- Daily breakdown available

### LinkedIn
- impressions, reach (unique members)
- likes, comments, shares
- clicks (organization accounts only)
- engagement_rate

### Instagram
- likes, comments
- reach, saves
- shares (story replies)

### Twitter/X
- impressions
- likes, retweets, replies
- profile_visits, link_clicks

## Analysis Templates

### Weekly Performance Report
```
## Weekly Content Performance

**Period:** [DATE] to [DATE]

### Top Performing Post
- Title: [TITLE]
- Platform: [PLATFORM]
- Views: [X] | Likes: [X] | Comments: [X]
- Why it worked: [ANALYSIS]

### Metrics Summary
| Platform | Posts | Total Views | Avg Engagement |
|----------|-------|-------------|----------------|
| YouTube  | X     | X           | X%             |
| LinkedIn | X     | X           | X%             |

### Recommendations
1. [RECOMMENDATION]
2. [RECOMMENDATION]
```

### Post-by-Post Analysis
```
## Post Analysis: [TITLE]

**Published:** [DATE]
**Platform:** [PLATFORM]

### Performance
- Views: [X]
- Likes: [X]
- Comments: [X]
- Shares: [X]
- Engagement Rate: [X]%

### What Worked
- [INSIGHT]

### What to Improve
- [SUGGESTION]
```

## Zernio MCP Account Info

To get account IDs for analytics:
```
Use mcp__zernio__accounts_list
```

Current connected accounts:
Use `mcp__zernio__accounts_list` to discover your connected account IDs.

## Notes

- YouTube analytics have 2-3 day data latency
- LinkedIn personal accounts don't have click metrics
- Analytics add-on required for Zernio MCP ($1/social set/month)
- Store analytics_raw JSONB for historical comparison
