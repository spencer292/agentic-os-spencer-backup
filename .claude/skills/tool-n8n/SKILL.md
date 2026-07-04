---
name: tool-n8n
description: Connect to and drive the company n8n instance via its REST API — create, update, list, activate workflows and check executions. Triggers on "n8n", "build a workflow", "automation workflow", "make a workflow that", "connect to n8n", "check my workflows", "workflow executions". Creates workflows INACTIVE for human review in the n8n editor. Requires N8N_BASE_URL and N8N_API_KEY in .env. Does NOT trigger for Agentic OS cron jobs (ops-cron) or one-off scripts.
---

# tool-n8n — Drive the company n8n instance

Build and manage n8n workflows programmatically against the instance configured in `.env`.
Local API documentation lives in `references/api-quick-reference.md` — read it before building
your first workflow in a session. Do not fetch web docs unless the local reference is missing
something specific.

## Setup check (run before any n8n work)

1. `.env` must contain `N8N_BASE_URL` (e.g. `https://gotmoles.app.n8n.cloud`, no trailing slash) and `N8N_API_KEY`.
2. Test: `node .claude/skills/tool-n8n/scripts/n8n-api.mjs test`
3. If either key is missing, tell the user where to create it: n8n → Settings → n8n API → Create API key.

## Hard rules

- **Create workflows INACTIVE.** Never set `active: true` on create, and never call activate
  unless the user explicitly asks. The user reviews in the n8n editor and activates there or asks you to.
- **Credentials are connected in the n8n UI only.** The API cannot and must not manage logins
  (Gmail, Sheets, etc.). When a workflow needs one, build it referencing a credential name and tell
  the user: open the node in n8n and connect the account once.
- **Always give the editor link after creating/updating:** `{N8N_BASE_URL}/workflow/{id}`.
- **Update = read-modify-write.** Fetch the current workflow JSON, change only what is needed, PUT it back.
- **Never delete a workflow without explicit confirmation naming it.**

## Script usage

```
node .claude/skills/tool-n8n/scripts/n8n-api.mjs test                     # connection check
node .claude/skills/tool-n8n/scripts/n8n-api.mjs list                     # workflows (id, name, active)
node .claude/skills/tool-n8n/scripts/n8n-api.mjs get <id>                 # full workflow JSON
node .claude/skills/tool-n8n/scripts/n8n-api.mjs create <file.json>       # create (forced inactive)
node .claude/skills/tool-n8n/scripts/n8n-api.mjs update <id> <file.json>  # replace nodes/connections/settings
node .claude/skills/tool-n8n/scripts/n8n-api.mjs activate <id>            # only on explicit user ask
node .claude/skills/tool-n8n/scripts/n8n-api.mjs deactivate <id>
node .claude/skills/tool-n8n/scripts/n8n-api.mjs executions [workflowId]  # recent runs + status
```

Write workflow JSON files to a temp path, not into the repo. The workflow's home is the n8n
instance itself — the repo only carries this skill.

## Building a workflow

1. Read `references/api-quick-reference.md` (anatomy, node types, connection format).
2. Draft the JSON: name, nodes with positions, connections, `settings: {}`.
3. `create` it, report the editor link, list any credentials the user must connect.
4. Offer a test path (webhook test URL, or manual "Execute workflow" in the editor).
5. Log learnings to `context/learnings.md` under `## tool-n8n`.
