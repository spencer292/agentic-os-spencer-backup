---
project: gsc-tracking-automation
status: active
level: 2
created: 2026-05-02
parent: cornerstone-url-recovery
---

# Got Moles GSC Daily Tracking — Notion DB + n8n Automation

L2 project. Pull GSC daily metrics into a Notion DB on a daily schedule via n8n. Provides a queryable, trendable, annotatable record of search performance over time — replaces ad-hoc API queries.

## Goal

Single Notion DB holds one row per day with daily GSC metrics for got-moles.com. n8n workflow runs daily, fetches yesterday's GSC data, computes deltas + 7-day rolling average, upserts to Notion. Roy (and Spencer) can view a timeline chart, filter, annotate inflection points, and spot trends without re-running CLI scripts.

## Status

| Phase | Status |
|---|---|
| 1 — Notion DB schema | ✅ Done — 14 properties added via PATCH /v1/data_sources/ |
| 2 — 90-day backfill | ✅ Done — 88 rows created, milestones flagged |
| 3 — n8n workflow JSON | ✅ Done — `workflow.json` ready to import |
| 4 — Workflow import + activation | 🔴 Roy to import into n8n cloud |
| 5 — Verification (run manually first time) | 🔴 Pending Phase 4 |
| 6 — Schedule activation (daily 09:00 UTC) | 🔴 Pending Phase 5 |

## Notion DB

- **Title:** Website tracking - Got Moles
- **DB ID:** `3543d42c-4a9c-8091-bff7-e213a048c965`
- **Data source ID:** `3543d42c-4a9c-8083-b92a-000bad01dce2`
- **URL:** https://www.notion.so/3543d42c4a9c8091bff7e213a048c965

### Schema (14 properties)

| Property | Type | Purpose |
|---|---|---|
| Name | title | Auto-set to date string (YYYY-MM-DD) |
| Date | date | Sortable date prop, primary axis for charts |
| Clicks | number | Daily click count |
| Impressions | number (with commas) | Daily impression count |
| CTR | number (%) | Daily clickthrough rate |
| Avg Position | number | Daily average ranking position |
| Δ Clicks | number | Day-over-day click change |
| Δ Impressions | number | Day-over-day impressions change |
| Δ Position | number | Day-over-day position change |
| 7-day Avg Clicks | number | Rolling 7-day average |
| 7-day Avg Impressions | number | Rolling 7-day average |
| Status | select | Auto-flag: stable / growth / position-drop / click-collapse / milestone / first-week |
| Notes | rich text | Manual annotations or auto-set milestone notes |
| Period | select | daily / weekly / monthly (always 'daily' for now) |

## n8n Workflow

**File:** `workflow.json` in this folder.

### Architecture (per `feedback_n8n_json_golden_rule.md` — JSON pre-built in Code nodes)

1. **Daily 09:00 UTC** — schedule trigger
2. **Calc Dates** — code node, computes target date (T-2 due to GSC lag) + 9-day window for delta + 7-day avg
3. **Refresh GSC Token** — code node, OAuth refresh
4. **Build GSC Body** — code node, pre-builds the API payload JSON
5. **GSC searchAnalytics** — HTTP request, fetches 9 days of daily data
6. **Transform → Notion Props** — code node, extracts target day, computes deltas + 7-day avg, builds Notion properties payload, auto-flags status
7. **Check Existing Row** — code node, queries Notion DB for existing row at target date (avoids duplicates)
8. **Upsert Notion Row** — code node, PATCH if exists, POST if new

### Required n8n environment variables

Set these in n8n cloud → Credentials → Variables:

| Variable | Value |
|---|---|
| `GSC_CLIENT_ID` | `495073686992-1r7bkh528vdcd7d57n1la12r3qh99std.apps.googleusercontent.com` |
| `GSC_CLIENT_SECRET` | `{GSC_CLIENT_SECRET — in .env}` |
| `GSC_REFRESH_TOKEN` | `{GSC_REFRESH_TOKEN — in .env}` |
| `NOTION_TOKEN` | `{NOTION_TOKEN — in .env}` |

(Same credentials as in root `.mcp.json` — keeps single source of truth for these creds.)

## Import instructions for Roy

1. Open n8n cloud at https://allthepower.app.n8n.cloud
2. Top right → **Workflows** → **Import from file**
3. Select `workflow.json` from this folder
4. Add the 4 environment variables above (Settings → Variables)
5. **Manually execute first** to verify: click "Execute Workflow" → check Notion DB has yesterday's row added/updated
6. **Activate** the workflow (toggle top-right of canvas) → schedule fires daily 09:00 UTC

## Verification checklist (Phase 5)

- [ ] First manual execution succeeds
- [ ] Row appears/updates in Notion DB for the target date
- [ ] All 11 numeric properties populated (clicks, impressions, CTR, position, 3 deltas, 2 7-day avgs)
- [ ] Status auto-flagged correctly
- [ ] No errors in n8n execution log

## Out of scope (future v2)

- URL-level tracking (separate DB for the 5 cornerstone URLs' daily performance)
- Top query tracking (separate DB)
- Multi-property support (extending to ATP, Rossair etc — straightforward refactor when needed)
- Slack/email summary on inflection events
- Weekly/monthly aggregates rolled up in the same DB

## Related

- L2 parent: `cornerstone-url-recovery/brief.md`
- 90-day baseline doc: `../cornerstone-url-recovery/gsc-baseline-2026-05-02.md`
- Backfill script: `_backfill-90-days.mjs` in this folder
- Schema setup script: `_setup-notion-schema.mjs` in this folder
