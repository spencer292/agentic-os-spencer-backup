# n8n Public API — local quick reference

Stored locally so no web fetch is needed. Verified against the n8n source OpenAPI spec
(github.com/n8n-io/n8n, packages/cli/src/public-api/v1) on 2026-07-04.
If something here fails against the live instance, verify at https://docs.n8n.io/api/ and update this file.

## Auth

Every request: header `X-N8N-API-KEY: <key>`. Base path: `{N8N_BASE_URL}/api/v1`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/workflows` | List workflows (`?active=true/false`, `?limit=`, cursor paging) |
| GET | `/workflows/{id}` | Full workflow JSON |
| POST | `/workflows` | Create. Body: `{name, nodes, connections, settings}` — do NOT send `active` |
| PUT | `/workflows/{id}` | Replace. Body must include `name`, `nodes`, `connections`, `settings` |
| DELETE | `/workflows/{id}` | Delete (confirm with user first) |
| POST | `/workflows/{id}/activate` | Turn on |
| POST | `/workflows/{id}/deactivate` | Turn off |
| POST | `/workflows/{id}/archive` / `/unarchive` | Archive/restore |
| GET / PUT | `/workflows/{id}/tags` | Read/set a workflow's tags |
| GET | `/executions` | Recent runs (`?workflowId=`, `?status=error/success/waiting`) |
| GET | `/executions/{id}` | One run's detail (`?includeData=true` for node output) |
| POST | `/executions/{id}/retry` / `/{id}/stop` | Retry or stop a run |
| GET / POST | `/credentials` | List / create credentials (values are WRITE-ONLY — never readable back) |
| GET | `/credentials/schema/{credentialTypeName}` | Field schema for a credential type |
| POST | `/credentials/{id}/test` | Test a credential |
| GET / POST | `/tags` | Workflow tags |

Credential notes: the API CAN create simple credentials (e.g. SMTP, API-key types) by POSTing
values — but values can never be read back, and OAuth credentials (Gmail, Google Sheets, etc.)
still require the user to click "connect" in the n8n UI to complete sign-in. Default to UI
connection; only create credentials via API when the user hands you the values explicitly.

Workflow schema facts (from source spec): required fields are exactly `name, nodes, connections,
settings`; `active`, `id`, `isArchived` are read-only (workflows CANNOT be created active — n8n
enforces arrive-inactive); extra top-level fields are rejected (`additionalProperties: false`).

## Workflow JSON anatomy

```json
{
  "name": "Missed call alert",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 0],
      "parameters": { "httpMethod": "POST", "path": "missed-call" }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [220, 0],
      "parameters": {
        "toEmail": "owner@example.com",
        "subject": "Missed call: {{ $json.caller_number }}",
        "text": "={{ $json.body }}"
      }
    }
  ],
  "connections": {
    "Webhook": { "main": [[ { "node": "Send Email", "type": "main", "index": 0 } ]] }
  },
  "settings": {}
}
```

- `connections` is keyed by the SOURCE node's `name`; `main` is an array of output-slots, each an
  array of `{node, type:"main", index}` targets.
- `position` is `[x, y]`; space nodes ~220px apart horizontally so the editor view is readable.
- Expressions use `{{ $json.field }}`; prefix a whole parameter value with `=` to make it an expression.

## Common node types

| Node | `type` | Use |
|------|--------|-----|
| Webhook | `n8n-nodes-base.webhook` | Inbound HTTP trigger. Test URL: `{base}/webhook-test/{path}`, live: `{base}/webhook/{path}` |
| Schedule | `n8n-nodes-base.scheduleTrigger` | Cron/interval trigger |
| HTTP Request | `n8n-nodes-base.httpRequest` | Call any API |
| Edit Fields (Set) | `n8n-nodes-base.set` | Shape/rename data |
| IF | `n8n-nodes-base.if` | Branch on condition (two outputs: true=0, false=1) |
| Code | `n8n-nodes-base.code` | JavaScript on items |
| Send Email | `n8n-nodes-base.emailSend` | SMTP send (needs SMTP credential) |
| Gmail | `n8n-nodes-base.gmail` | Gmail send/read (OAuth credential in UI) |
| Google Sheets | `n8n-nodes-base.googleSheets` | Append/read rows (OAuth credential in UI) |
| Slack | `n8n-nodes-base.slack` | Post messages |

## Webhook testing

A webhook node only listens on the TEST url while "Execute workflow" is running in the editor;
the LIVE url works when the workflow is active. Tell the user which one applies.
