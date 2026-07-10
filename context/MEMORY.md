# Memory — Working Scratchpad

> Curated durable facts, loaded at session start. Capped at 2,500 characters.
> Fresh client install — start empty.

## Active Threads
- **Route automation: n8n scheduled automation stays OFF — do NOT reactivate** (parent `XLhh2TB89NwSlBRX` + child `gr8kf904tjC2ckcA` deactivated after a live run scrambled the board). 2026-07-09: ran a SUPERVISED manual one-day route for Fri 07-10 (Jobber→OptimoRoute→optimize→write times back) = 90/90 OK. **Rebuild method (proven):** create OR orders with UNIQUE orderNo `<job>-<date>` + `operation:CREATE` via `create_order` (geocodes; bulk doesn't + orderNo update-matches across dates → drags other days' orders in). Lock techs: `assignedTo.serial=<full name>`. Detail in build-notes.md.

- **Cash-flow projection (Got Moles):** repeatable model in `projects/briefs/cash-flow-projection/`. Weekly automation = n8n Cloud wf `Aly1V11tqwSQhTls` (INACTIVE) → Notion "Cash-Flow Snapshots" DB (`8020d3e9-b096-4d08-a9a5-eeb848ab4c1d`). Next: user connects Notion cred + shares DB, then Execute.

## Environment Notes
- **Scheduling host = n8n Cloud, NOT local cron.** Local cron can't launch Claude on Windows (missing launcher; escalated to Roy). Use n8n for unattended jobs.
- Browser control: `tool-browser` skill drives visible Chrome via zero-dep CDP. `node browser/launch.mjs` then `node browser/cdp.mjs <goto|shot|text|eval|click|type>`. Persistent profile `C:\Users\spenc\.agentic-chrome-profile` (logins persist). Real LinkedIn `/in/spencer-hill-2132b92ab/`. Never bulk-automate LinkedIn (ban risk).
- Jobber n8n auth = credential `NitrghZSAjZamvqp` "Jobber OAuth2 (native)", Authentication=**Body** (Jobber wants client creds in body, not header). Notion DB Route Sync Log `19265c126f534b8fa59b98856c42531d`.
- OptimoRoute API live — `OPTIMOROUTE_API_KEY` in `.env`; test via `optimoroute-api.mjs test`.
- viz-image-gen `sys-config.md` Paths are stale (point to `C:/Claude/agent-os-v3/...`) — ignore, use real repo root `C:/Agentic-os-got-moles`. Image scripts auto-load `.env`. For true 16:9 (YouTube banners) use the Gemini backend; GPT can't exceed 3:2.

## Pending Decisions
- LinkedIn growth (Got Moles, from 2026-07-06): user to paste new headline+About & fix profile, then start daily connecting. Full plan + ~55-target list + 22 outreach drafts in `projects/tool-browser/`. Hubs: Patrick LaCroix, Nick Granberg, Brandon Sechrist, Mark Pyrah, Michael Lai, Chris Timpson.
