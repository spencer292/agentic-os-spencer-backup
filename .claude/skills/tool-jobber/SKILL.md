---
name: tool-jobber
description: Connect to the company's Jobber account (field service management — clients, requests, quotes, jobs, visits, invoices) via Jobber's GraphQL API with OAuth2. Triggers on "jobber", "check my jobs", "today's visits", "create a quote in jobber", "jobber clients", "invoices", "connect jobber", "jobber report". Read operations are free; MUTATIONS (create/update quotes, jobs, invoices, clients) always require explicit user confirmation — this is live business data. Requires JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, JOBBER_REFRESH_TOKEN in .env (one-time OAuth setup below). Does NOT trigger for n8n workflow building (tool-n8n) — though the two combine: Jobber webhooks can feed n8n.
---

# tool-jobber — Drive the company Jobber account

Jobber's API is **GraphQL only**: every request is a POST to `https://api.getjobber.com/api/graphql`.
Local API documentation lives in `references/api-quick-reference.md` (researched and source-verified
2026-07-04) — read it before your first Jobber operation in a session. The GraphQL schema itself is
the full documentation: when unsure about fields, run an introspection query or tell the user to open
the app's "Test in Playground" (GraphiQL) in the Developer Center.

## One-time setup (walk the user through this)

1. **Two accounts** (both free):
   - Jobber developer account: https://getjobber.com/developer-sign-up/
   - Developer Center: https://developer.getjobber.com/signup/
2. **Create an app** at https://developer.getjobber.com/apps → NEW. Name it "{Company} Internal".
   Select scopes: read clients, requests, quotes, jobs, invoices (add write scopes only for what
   the user will actually automate). Set the OAuth callback URL to `http://localhost:8734/callback`.
3. Copy the **Client ID** and **Client Secret** into `.env`:
   ```
   JOBBER_CLIENT_ID=
   JOBBER_CLIENT_SECRET=
   ```
4. **Authorize once:** `node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth`
   — it prints the authorization URL, the user opens it in a browser signed into the COMPANY
   Jobber account, approves, and the script catches the callback and writes
   `JOBBER_REFRESH_TOKEN` into `.env` automatically.
5. Test: `node .claude/skills/tool-jobber/scripts/jobber-api.mjs test`

If tokens ever stop working (secret rolled, scopes changed, app disconnected), rerun step 4.

## Hard rules

- **Reads are free; writes need a yes.** Never run a mutation (createQuote, jobCreate, invoice
  edits, client edits…) without the user explicitly confirming THAT operation in this conversation.
  Quotes and invoices reach real customers.
- **Stay cheap.** Rate limits are per-app: 2,500 requests / 5 min AND a query-cost budget
  (leaky bucket). Paginate with cursors (`first: 50, after: $cursor`), never deep-nest, never
  fetch fields you don't need.
- **Schema doubts → introspect,** don't guess field names. `query <<'…introspection…'` or Playground.
- **Version pinning:** if `JOBBER_GRAPHQL_VERSION` is set in `.env`, the script sends it as
  `X-JOBBER-GRAPHQL-VERSION`. Versions are dated (YYYY-MM-DD) and supported ~12 months — check the
  Playground for the current one and pin it.

## Script usage

```
node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth            # one-time OAuth (writes refresh token)
node .claude/skills/tool-jobber/scripts/jobber-api.mjs test            # who am I / account check
node .claude/skills/tool-jobber/scripts/jobber-api.mjs query <file>    # run a GraphQL query from a file
node .claude/skills/tool-jobber/scripts/jobber-api.mjs query '<gql>'   # or inline
node .claude/skills/tool-jobber/scripts/jobber-api.mjs clients [n]     # quick: recent clients
node .claude/skills/tool-jobber/scripts/jobber-api.mjs jobs [n]        # quick: recent jobs
```

The script refreshes the access token on every run (access tokens are short-lived) and persists a
rotated refresh token back to `.env` when Jobber issues one.

## Combining with n8n (see tool-n8n)

- **Inbound (events):** configure webhooks on the Jobber app (Developer Center → app → webhooks;
  topics like `CLIENT_CREATE`, `JOB_CREATE`, `INVOICE_UPDATE`) pointing at an n8n webhook URL.
  This is the clean path for "when something happens in Jobber, do X".
- **Outbound (n8n → Jobber):** n8n has NO native Jobber node. Community nodes exist but are
  awkward on n8n Cloud, and n8n's GraphQL node has a known OAuth-refresh gotcha (GraphQL errors
  return HTTP 200, so n8n never refreshes). Prefer doing outbound Jobber calls HERE via this skill,
  or in n8n use an HTTP Request node with a preceding token-refresh call.

## After significant use

Log learnings (query shapes that worked, schema surprises, cost limits hit) to
`context/learnings.md` under `## tool-jobber`.
