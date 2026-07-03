# Hosted Memory API — ingest & search endpoints

The hosted memory API is a small HTTP service that runs **next to the hosted
Postgres** (Railway or a VPS) and exposes team memory as two endpoints:
**ingest** (write a scoped source) and **search** (scoped, reranked recall).

Why it exists: without it, every consumer of hosted memory needs the raw
`MEMORY_DATABASE_URL` — full database credentials, no permission boundary. With
it, consumers get a **URL + token** instead. The server validates scope, runs
the embedder, writes the audit trail, and keeps database credentials to itself.
It is also the boundary where per-user permissions will plug in.

- Part 1 is for the **stakeholder / account owner**: set up Railway, pick a
  plan, invite the developer. No technical steps.
- Part 2 is for the **developer**: deploy the two services, configure env vars,
  verify, and consume the API.

---

## Part 1 — Stakeholder setup (Railway account, plan, access)

You do this once. It takes about 10 minutes and requires a credit card.

### 1. Create the Railway account

1. Go to [railway.com](https://railway.com) and sign up — use a company email
   (or the company GitHub account; GitHub sign-in keeps deploys simpler later).
2. Verify the account when prompted.

### 2. Pick a plan

Check current pricing at [railway.com/pricing](https://railway.com/pricing).
What matters for this deployment:

| Plan | Fits | Why |
|------|------|-----|
| **Hobby** (~$5/month, includes usage credit) | Solo pilot | One member only — you cannot invite the developer. Fine if the developer owns the account. |
| **Pro** (~$20/seat/month, includes usage credit) | **Team — recommended** | Required to invite team members (the developer) into a shared workspace. More resources and support. |

Expected monthly usage for this stack (one small Postgres + one small Node
service) is modest — typically inside the plan's included usage credit during a
pilot. Costs scale with memory volume and traffic; review Railway's usage page
after the first month.

**Recommendation:** Pro, so the developer works in the company workspace and
the company keeps ownership of the database and its data.

### 3. Add the developer

1. In Railway: **Workspace → Settings → Members → Invite**.
2. Enter the developer's email, role **Member** (or **Admin** if they should
   manage billing-adjacent settings too).
3. The developer accepts the invite — they can now create the services in
   Part 2.

### 4. What you hand over

Send the developer:

- Confirmation they are in the Railway workspace.
- A decision on the database password and API token storage (use a password
  manager; they will generate the values).

That's it — everything below is the developer's job.

---

## Part 2 — Developer setup

### What you will deploy

Two Railway services in one project:

```text
Railway project "agentic-memory"
├── postgres      pgvector/pgvector:pg16 image + persistent volume
└── memory-api    this repo, command-centre/, `npm run memory:api`
```

The database is **never** exposed publicly; the API talks to it over Railway's
private network. Consumers talk to the API only.

### 1. Provision Postgres + pgvector

Follow [`hosted-postgres-setup.md`](hosted-postgres-setup.md) — Railway section.
Summary: **New → Deploy a Docker Image → `pgvector/pgvector:pg16`**, set
`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`, and attach a persistent
volume at `/var/lib/postgresql/data`.

### 2. Deploy the API service

1. **New → GitHub Repo** → select this repository.
2. Service settings:
   - **Root directory:** `command-centre`
   - **Start command:** `npm run memory:api`
   - **Healthcheck path:** `/v1/health`
3. Variables on the **memory-api** service:

| Variable | Value | Notes |
|----------|-------|-------|
| `MEMORY_API_TOKEN` | `openssl rand -hex 32` | REQUIRED — the server refuses to start without it. Store it in the team password manager. |
| `MEMORY_DATABASE_URL` | the Postgres service's **private** URL (`postgres://postgres:PASSWORD@postgres.railway.internal:5432/agentic_memory`) | Use Railway's variable references to compose it from the database service. |
| `PGSSLMODE` | `disable` | Railway's private network does not offer SSL. |
| `MEMORY_EMBEDDER` | `bge-m3` (default) | Must match whatever indexed the data — vectors from different embedders don't mix. See "Embedder consistency" below. |

   `PORT` is injected by Railway automatically; the server picks it up
   (`MEMORY_API_PORT` overrides it if you ever need to).

4. Generate a public domain for the service (**Settings → Networking →
   Generate Domain**). This URL + the token is what consumers get.

### 3. Apply the schema and verify

The server runs migrations automatically at startup (idempotent). Verify from
the deploy logs:

```text
memory-api → /app
  backend:  postgres
  embedder: bge-m3 (dim 1024)
  listening on :XXXX  (GET /v1/health)
```

Then from your machine:

```bash
curl https://<your-domain>/v1/health
# {"ok":true,"backend":"postgres","embedder":{"model":"bge-m3","dim":1024}}
```

### 4. VPS instead of Railway

Run the same two pieces: the `docker compose` Postgres from
[`hosted-postgres-setup.md`](hosted-postgres-setup.md), plus
`MEMORY_API_TOKEN=... MEMORY_DATABASE_URL=... npm run memory:api` under a
process manager (systemd, pm2). Front it with a TLS reverse proxy (Caddy,
nginx) — the API itself serves plain HTTP.

### Local development

No Postgres needed — the API serves the local PGLite store when no connection
string is set:

```bash
cd command-centre
MEMORY_API_TOKEN=dev npm run memory:api
# memory-api → ...
#   backend:  pglite
#   note: serving from LOCAL PGLite — set MEMORY_DATABASE_URL for hosted team memory.
```

To exercise the hosted path locally, start the repo's compose file
(`docker compose up -d`) and set
`MEMORY_DATABASE_URL=postgres://postgres:postgres@localhost:5432/agentic_memory`.

---

## API reference

All bodies are JSON. Authenticated routes require
`Authorization: Bearer <MEMORY_API_TOKEN>`.

Errors always look like:

```json
{ "error": { "code": "invalid_scope", "message": "…" } }
```

| Status | Code | When |
|--------|------|------|
| 400 | `invalid_request` | Malformed body / missing or invalid fields |
| 400 | `invalid_scope` | Missing scope, or a scope that breaks the visibility invariants |
| 401 | `unauthorized` | Missing or wrong bearer token |
| 404 | `not_found` | Unknown route |
| 405 | `method_not_allowed` | Wrong HTTP method |
| 413 | `payload_too_large` | Body over 5 MB |
| 500 | `internal` | Unexpected server failure (logged server-side) |

### GET `/v1/health` (no auth)

```json
{ "ok": true, "backend": "postgres", "embedder": { "model": "bge-m3", "dim": 1024 } }
```

Use it as the Railway healthcheck.

### POST `/v1/memory/search`

Embeds the query **server-side** with the active BGE-M3 model, runs hybrid search
(scope-filtered vector search plus scoped keyword search), reranks (authority +
recency), and records a `search_events` audit row.
Audit is mandatory on the hosted API — unlike the local CLI, there is no
`--no-events` equivalent. By default the audit row stores **neither** the query
text nor its embedding; `storeQueryText: true` opts the text in.

Request:

```json
{
  "query": "release process",
  "scope": { "teamId": "team-42", "clientId": null, "userId": null },
  "topK": 10,
  "storeQueryText": false
}
```

- `scope` is **required**. Same semantics as the CLI's scope flags: identity
  fields set who is asking; the searched visibility layers derive from them
  with `system` always present (`teamId` adds `team`, `clientId` adds `client`,
  `userId` adds `private`). Pass `include` (e.g. `["system","team"]`) to pin
  the layers explicitly. `{ "scope": {} }` = system-baseline search. A request
  without `scope` is a 400, never an implicit search-everything.
- `topK`: 1–100, default 10.

Response:

```json
{
  "results": [
    {
      "chunkId": "…", "sourceId": "…",
      "sourcePath": "context/memory/2026-06-10.md",
      "sourceType": "memory", "contentDate": "2026-06-10",
      "heading": "Release", "content": "…",
      "score": 0.83, "distance": 0.17, "finalScore": 0.91, "reranked": true
    }
  ],
  "visibilitySet": ["system", "team"],
  "latencyMs": 12,
  "eventId": "…"
}
```

`results` carries everything a caller needs for citations (path, type, date,
heading); `eventId` is the audit row for traceability.

### POST `/v1/memory/ingest`

Chunks, embeds (server-side), and upserts one source through the **same
pipeline** the filesystem indexer uses (`ingest.ts`). Idempotent: re-sending
identical content is a no-op.

Request:

```json
{
  "scope": { "teamId": "team-42", "clientId": null, "userId": null, "visibility": "team" },
  "sourcePath": "context/memory/2026-06-10.md",
  "sourceType": "memory",
  "title": "Daily log",
  "contentDate": "2026-06-10",
  "authorityWeight": 1.0,
  "content": "# Daily\n\n…markdown…",
  "force": false,
  "reason": "manual"
}
```

- `scope` (with `visibility`), `sourcePath`, and `content` are required. The
  scope is validated against the same invariants the database enforces
  (`private` needs `userId`, `client` needs `clientId`, `team` needs `teamId`).
- `sourceType`: `memory | learnings | brand | transcript | session | other`
  (default `other`). `contentDate`: `YYYY-MM-DD`. `reason`: an `index_jobs`
  reason tag (default `manual`).
- `force: true` re-embeds even when the content hash is unchanged.

Response:

```json
{ "sourceId": "…", "skipped": false, "chunksInserted": 3, "chunksPruned": 0 }
```

---

## Consuming the API

- **Search from anywhere** — a thin client needs only `fetch`; no embedding
  model, no `pg`, no PGLite. The query is embedded server-side.
- **Scope is the caller's identity.** Always send the narrowest scope that
  serves the request. The server filters; it does not yet verify the caller
  *is* who the scope claims — that is a planned enhancement. Until then the
  bearer token is the trust boundary: anyone holding it is trusted at team level.
- **Ingest from agents/services** — anything that produces memory (session
  capture, learnings, brand notes) can POST it. Use a stable `sourcePath` per
  document so re-ingestion upserts instead of duplicating.
- Re-indexing existing local memory into hosted Postgres can target this
  endpoint or go direct-to-DB with `MEMORY_DATABASE_URL`.

### Embedder consistency (important)

Vectors from different embedders live in different spaces — searching with one
against chunks embedded with another silently returns garbage. The rule: **all
writers and the API server must use the same `MEMORY_EMBEDDER`** against the
same database. The default everywhere is `bge-m3` at 1024 dimensions. If an
older database was built with hash or a 384-dim model, run the Agentic OS update
or `scripts/setup-memory.sh` / `scripts/setup-memory.ps1` so the store is rebuilt
and fully reindexed before serving recall.

## Security notes

- The server is **fail-closed**: it refuses to start without `MEMORY_API_TOKEN`,
  and token comparison is constant-time.
- `/v1/health` is unauthenticated by design (healthchecks) and exposes no data.
- Keep Postgres off the public internet; only the API needs to reach it.
- Per-user authentication and grant checks are a planned enhancement at this
  boundary; they are not yet implemented.
- Rotate the token by updating the service variable and redeploying; hand the
  new value to consumers via the password manager.

## Related

- Database provisioning: [`hosted-postgres-setup.md`](hosted-postgres-setup.md)
- Schema & scope model: [`memory-schema.md`](memory-schema.md)
- Backend selection (PGLite ↔ Postgres): [`hosted-postgres-setup.md`](hosted-postgres-setup.md#backend-selection)
- Re-index existing memory into hosted Postgres: [`hosted-postgres-setup.md`](hosted-postgres-setup.md#seed-the-store-with-existing-memory)
- Backup & restore: [`backup-restore.md`](backup-restore.md)
- Permissions / per-user grants: a planned enhancement, not yet implemented
