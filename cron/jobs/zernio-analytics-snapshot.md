---
name: Zernio Analytics Snapshot
time: '06:00'
days: daily
active: 'true'
model: sonnet
notify: on_finish
description: 'Pulls social post performance from Zernio (getlate.dev) and appends a daily time-series snapshot per recent post to the Post Analytics Notion DB, so motion can be tracked over time.'
timeout: 20m
retry: '1'
---
You are running as a scheduled job for Agentic OS. Read CLAUDE.md for system context.

Task: capture today's performance numbers for recently-published social posts and append them as a time-series snapshot to the "Post Analytics" Notion database. This is append-only — one row per post per day — so each run adds a new dated reading and the history shows how each post moved.

Both steps are deterministic node scripts that read their keys from the project `.env` internally (never echo a key). Run from the repo root.

## 1. Fetch + snapshot (Zernio REST → JSON)

```
node .claude/skills/mkt-content-analytics/scripts/zernio_analytics.cjs --since 30d --json .tmp/zernio_analytics_latest.json > /dev/null
```

- Pulls `GET /analytics` (paginated), filtered to posts published in the last 30 days (older posts have plateaued — bounding the window keeps the DB from growing without limit).
- It checks `dataStaleness` and triggers a Zernio `?sync=true` automatically when any account is stale, so the numbers are fresh before capture.
- The stderr line reports `lastSync`, staleness, capture time, and row count — include that in the job output.
- If it errors (bad/expired `ZERNIO_API_KEY`, network), stop and report; do not write partial data.

## 2. Push to Notion (append-only time-series)

```
node .claude/skills/mkt-content-analytics/scripts/zernio_analytics_to_notion.cjs --in .tmp/zernio_analytics_latest.json
```

- Writes one row per post into the **Post Analytics** DB (`database_id f025e2e2-64a3-4b9d-bf66-239e8b32d180`, under "Social Media Workspace Overview") via the Notion REST API using `NOTION_API_TOKEN` from `.env`.
- `Captured At` is today — that's the time axis. `Post ID` is the stable Zernio key, so all snapshots for one post line up over time.
- Report how many rows were written and any failures.

## 3. Output

One block: `lastSync` + staleness from step 1, rows fetched, rows written to Notion, and any per-row failures. If zero posts matched the 30-day window, say "No recent posts to snapshot" and stop cleanly.

Rules:
- Never echo `ZERNIO_API_KEY` or `NOTION_API_TOKEN`.
- This job is read-only against Zernio and append-only against Notion — it never edits or deletes posts.
- If only one of the two steps succeeds, report exactly which, so a partial day is visible.
