---
name: tool-optimoroute
description: Connect to the company's OptimoRoute account (route optimization — orders, route planning, drivers, completion tracking) via its REST API. Triggers on "optimoroute", "optima route", "plan routes", "today's routes", "driver routes", "route optimization", "add order to route", "route completion". Reads are free; MUTATIONS (create/delete orders, start planning, driver changes) require explicit user confirmation — this drives real field operations. Requires OPTIMOROUTE_API_KEY in .env. Does NOT trigger for Jobber job management (tool-jobber) or n8n workflow building (tool-n8n) — though all three combine.
---

# tool-optimoroute — Drive the company OptimoRoute account

REST + JSON, base `https://api.optimoroute.com/v1/`, auth = `?key=` query parameter on every
request. Local API documentation lives in `references/api-quick-reference.md` (researched from the
official API reference, v1.36, on 2026-07-04) — read it before the first OptimoRoute operation in
a session.

## Setup (one-time)

1. In the OptimoRoute web app: **Administration → Settings → WS API** → generate/copy the key.
   (If that section isn't visible, the account's plan may not include API access — check the plan.)
2. `.env`: `OPTIMOROUTE_API_KEY=<key>`
3. Test: `node .claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs test`

## Hard rules

- **Reads free, writes confirmed.** Never create, update, or delete orders, start planning, or
  change driver parameters without the user explicitly confirming that operation in this
  conversation. These change what drivers do in the field.
- **`delete_all_orders` is forbidden** unless the user names it explicitly and confirms twice —
  it wipes a whole day.
- **Limits:** max 5 concurrent requests; bulk endpoints cap at 500 items; geocoding happens only
  in single `create_order` (bulk needs lat/long or pre-geocoded addresses).
- Route dates are `YYYY-MM-DD`.

## Script usage

```
node .claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs test               # key check
node .claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs routes [date]      # planned routes (default today)
node .claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs raw <endpoint> [json-file]
#   e.g. raw get_scheduling_info payload.json   |   raw start_planning plan.json
```

`raw` POSTs the JSON file body (or GETs if no file) to any endpoint in the reference — that's the
general mechanism; the reference documents each endpoint's fields.

## The three-system pattern (Jobber + n8n + OptimoRoute)

- OptimoRoute has **no webhooks** — it's called, it doesn't call out. Poll `get_events` /
  `get_completion_details` if event-like behavior is needed.
- Natural automation (build in n8n via tool-n8n): **Jobber webhook (e.g. JOB_CREATE) → n8n →
  OptimoRoute `create_order`** (HTTP Request node; key auth is n8n-friendly, no OAuth pain).
- Completion flowing back: n8n schedule → `get_completion_details` → update Jobber / notify.

## After significant use

Log learnings to `context/learnings.md` under `## tool-optimoroute`.
