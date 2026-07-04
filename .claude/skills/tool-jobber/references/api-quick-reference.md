# Jobber API — local quick reference

Researched 2026-07-04 from Jobber's official sources: developer.getjobber.com docs, Jobber's own
"Building an App in Jobber Platform" guide (dev.to/jobber), and the official
GetJobber/Jobber-AppTemplate-RailsAPI repo. If something fails against the live API, verify in the
app's GraphiQL Playground (Developer Center → app menu → Test in Playground) and update this file.

## The shape of the API

- **GraphQL only.** Single endpoint, every request a POST:
  `https://api.getjobber.com/api/graphql`
- Headers: `Authorization: Bearer <ACCESS_TOKEN>`, `Content-Type: application/json`,
  optionally `X-JOBBER-GRAPHQL-VERSION: <YYYY-MM-DD>`.
- **Versioning:** date-formatted versions, published irregularly, supported ~12 months after a
  newer release. Unpinned/expired versions auto-upgrade (can break). Pin the current version from
  the Playground.

## OAuth 2.0 (authorization code)

| Step | URL |
|------|-----|
| Authorize (browser) | `https://api.getjobber.com/api/oauth/authorize?client_id=<ID>&redirect_uri=<CB>&state=<STATE>` |
| Callback receives | `<CB>?code=<AUTHORIZATION_CODE>&state=<STATE>` |
| Token exchange (POST) | `https://api.getjobber.com/api/oauth/token` with `client_id, client_secret, grant_type=authorization_code, code, redirect_uri` |
| Refresh (POST) | same URL with `grant_type=refresh_token, refresh_token, client_id, client_secret` |

- Access tokens are short-lived; refresh before working.
- Refresh tokens can expire/invalidate on: app disconnection, client-secret roll, re-auth after a
  scope change, or Refresh Token Rotation (app setting — if rotation is on, every refresh returns a
  NEW refresh token that must be persisted).
- Apps are created in the Developer Center (https://developer.getjobber.com/apps); scopes chosen
  there define what the OAuth screen requests. Editing scopes on a published app forces re-auth.

## Rate limits (two independent limiters)

1. **DDoS guard:** 2,500 requests per 5 minutes per app+account.
2. **Query cost:** each query costs points against a leaky-bucket budget; deep nesting and big
   pages cost more. Use cursor pagination (`first: N, after: $cursor`), request only needed fields.

## Core objects (via GraphQL schema)

clients, properties, requests, quotes, jobs, visits, invoices, payments, users/account, custom
fields (definable on Clients, Properties, Quotes, Jobs, Invoices, Team members; types: boolean,
numeric, area, dropdown, text, link).

Field names and mutation signatures: **introspect, don't guess** — the schema in the Playground is
authoritative for the pinned version.

## Verified query shape (from Jobber's official template)

```graphql
query ($limit: Int, $cursor: String, $filter: ClientFilterAttributes) {
  clients(first: $limit, after: $cursor, filter: $filter) {
    nodes { id name }
    pageInfo { endCursor hasNextPage }
  }
}
```

Relay-style: `nodes` + `pageInfo{endCursor hasNextPage}` is the pagination pattern across list
queries. Keep `first:` ≤ 50 to stay inside cost limits (official template uses 50).

## Introspection starter (when unsure of fields)

```graphql
query { __type(name: "Client") { fields { name type { name kind ofType { name } } } } }
```

## Webhooks (Jobber → outside, e.g. n8n)

Configured at the APP level in the Developer Center (webhooks section of the app config).
Topics follow `OBJECT_ACTION` naming, e.g. `CLIENT_CREATE` fires when an account with the app
installed creates a client. Point them at an n8n webhook URL for event-driven automations.
Enumerate available topics in the app's webhook config UI.

## n8n integration reality check (researched 2026-07-04)

- No native Jobber node in n8n.
- Community nodes exist (`@kobami/n8n-nodes-jobber`, `@arisegroup/n8n-nodes-jobber`) — community
  nodes are limited/awkward on n8n Cloud; verify before relying on them.
- Known gotcha from the n8n community: GraphQL errors come back HTTP 200, so n8n's OAuth2
  credential never auto-refreshes on the GraphQL node — refresh must be forced manually before the
  call. Prefer inbound webhooks + outbound via this skill.
