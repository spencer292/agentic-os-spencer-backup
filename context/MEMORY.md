# Memory — Working Scratchpad

> Curated durable facts, loaded at session start. Capped at 2,500 characters.
> Fresh client install — start empty.

## Active Threads
- **Route automation (technician-route-automation): OFF after a live incident — do NOT reactivate.** n8n child `gr8kf904tjC2ckcA` + parent `XLhh2TB89NwSlBRX` deactivated. Live run scrambled the Jobber board (moved visits to wrong days + blanket 7am–7pm); partial recovery, Spencer fixing rest manually. REBUILD needed: Jobber→OptimoRoute ingest+re-optimize→back with real OR times/order/tech (never built ingest; tech assign unhandled). Full detail in `projects/briefs/technician-route-automation/build-notes.md` + memory `2026-07-06.md`.

- **Cash-flow projection (Got Moles):** repeatable model in `projects/briefs/cash-flow-projection/`. Weekly automation = n8n Cloud wf `Aly1V11tqwSQhTls` (INACTIVE) → Notion "Cash-Flow Snapshots" DB (`8020d3e9-b096-4d08-a9a5-eeb848ab4c1d`). Next: user connects Notion cred + shares DB, then Execute.

## Environment Notes
- **Scheduling host = n8n Cloud, NOT local cron.** Local cron can't launch Claude on Windows (missing launcher; escalated to Roy). Use n8n for unattended jobs.
- Browser control: `tool-browser` skill drives visible Chrome via zero-dep CDP. `node browser/launch.mjs` then `node browser/cdp.mjs <goto|shot|text|eval|click|type>`. Persistent profile `C:\Users\spenc\.agentic-chrome-profile` (logins persist). Real LinkedIn `/in/spencer-hill-2132b92ab/`. Never bulk-automate LinkedIn (ban risk).
- Jobber n8n auth = credential `NitrghZSAjZamvqp` "Jobber OAuth2 (native)", Authentication=**Body** (Jobber wants client creds in body, not header). Notion DB Route Sync Log `19265c126f534b8fa59b98856c42531d`.
- OptimoRoute API live — `OPTIMOROUTE_API_KEY` in `.env` valid; test via `node .claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs test`.
- viz-image-gen `sys-config.md` Paths are stale (point to `C:/Claude/agent-os-v3/...`) — ignore, use real repo root `C:/Agentic-os-got-moles`. Image scripts auto-load `.env`. For true 16:9 (YouTube banners) use the Gemini backend; GPT can't exceed 3:2.

## Pending Decisions
- LinkedIn growth (Got Moles, from 2026-07-06): user to paste new headline+About & fix profile, then start daily connecting. Full plan + ~55-target list + 22 outreach drafts in `projects/tool-browser/`. Hubs: Patrick LaCroix, Nick Granberg, Brandon Sechrist, Mark Pyrah, Michael Lai, Chris Timpson.
