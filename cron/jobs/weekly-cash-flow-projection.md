---
name: Weekly Cash-Flow Projection
time: '08:00'
days: mon
active: 'false'
model: sonnet
notify: on_finish
description: 'Weekly Jobber-driven cash-flow projection + collections snapshot. Read-only pull, deposit-aware model, updates the Notion page, and posts a chase list. Writes nothing to Jobber.'
timeout: 20m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context.

Task: Refresh the Got Moles cash-flow projection and collections snapshot from live Jobber
data, update the Notion review page, and summarise for Spencer. This is READ-ONLY against
Jobber — never run a Jobber mutation. See `projects/briefs/cash-flow-projection/brief.md` for
the model.

Steps:

1. From the repo root, pull 12 months of invoices (this takes several minutes and self-throttles —
   let it finish):
   `node projects/briefs/cash-flow-projection/scripts/pull-invoices.mjs 12`

2. Build the projection (instant):
   `node projects/briefs/cash-flow-projection/scripts/build-projection.mjs`
   This writes `projects/briefs/cash-flow-projection/cash-flow-projection_{today}.md` and
   `data/projection.json`, and appends a snapshot to `data/collections-history.json` (so the
   week-over-week collections trend builds over time).

3. Update the existing Notion page (do NOT create a new one). Page ID:
   `39555c8a-8324-8132-937c-d5453a6cc7a1`. Use the Notion update-page tool with the
   `replace_content` command, using the freshly generated report body (everything below the H1
   title). If the Notion tool is unavailable in this headless run, skip this step and say so in
   the summary — the local report is still fresh either way.

4. Summarise for Spencer (keep it short and skimmable), leading with collections:
   - **Collections:** total outstanding, not-yet-due vs past-due, and the week-over-week change
     in past-due if a prior snapshot exists.
   - **Chase list:** the top past-due accounts from the report's Collections snapshot.
   - **Planning:** the next 2-3 months of the forward cash view (total cash in per month).
   - Point to the saved report file path and the Notion page.

Rules:
- Read-only. Never pass a write/mutation to Jobber. Never edit invoices, clients, or quotes.
- If the pull errors on a Jobber token (HTTP 401 / token refresh failed), the refresh token has
  expired and needs a one-time browser re-auth that only Spencer can do. Note this clearly in the
  summary — tell him to run `node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth` — and
  stop. Do NOT retry destructively.
- If Jobber throttles, the pull script backs off and retries on its own; allow the time.
- If any step fails, report what failed and what still succeeded (e.g. local report built but
  Notion update skipped). Do not fail silently.
