#!/usr/bin/env node
/**
 * memory-api — the hosted memory ingest/search API server.
 *
 * Runs the node:http transport (src/lib/memory/server.ts) over the same memory
 * store every memory:* command uses. Deploy it NEXT TO the hosted Postgres
 * (Railway/VPS): consumers then reach team memory with a URL + token instead of
 * raw database credentials, and scope filtering + audit happen server-side.
 *
 * Environment:
 *   MEMORY_API_TOKEN        REQUIRED. Bearer token for /v1/memory/*. The server
 *                           refuses to start without it (fail closed).
 *   MEMORY_API_PORT         Port to listen on. Falls back to PORT (the Railway
 *                           convention), then 8787.
 *   MEMORY_DATABASE_URL     Hosted Postgres URL (or DATABASE_URL). With neither
 *                           set, the server runs on local PGLite — fine for dev,
 *                           not what you want hosted.
 *   MEMORY_STORE_BACKEND    auto | pglite | postgres (see backend.ts).
 *   MEMORY_EMBEDDER         bge-m3 (default) | hash. Must match what indexed the
 *                           data — vectors from different models don't mix.
 *   PGSSLMODE               disable | require | no-verify (see postgres-adapter).
 *
 * Usage:
 *   MEMORY_API_TOKEN=... npm run memory:api
 *   MEMORY_API_TOKEN=... MEMORY_API_PORT=9000 node scripts/memory-api.cjs
 *
 * Endpoints (full contract in docs/memory/hosted-api.md):
 *   GET  /v1/health          liveness + backend/embedder info (no auth)
 *   POST /v1/memory/search   { query, scope, topK?, storeQueryText? }
 *   POST /v1/memory/ingest   { scope, sourcePath, content, sourceType?, ... }
 *
 * The .ts library is loaded the same way the other memory commands load it —
 * via loadTsModule, leaf-first (scripts/load-memory-modules.cjs). There is no
 * build step in this repo; this is the supported runtime path.
 */

const path = require("node:path");

const { loadMemoryModules } = require("./load-memory-modules.cjs");
const { findWorkspaceRoot } = require("./workspace-root.cjs");

const USAGE = `memory-api — hosted memory ingest/search API server

Usage:
  MEMORY_API_TOKEN=<token> node scripts/memory-api.cjs

Environment:
  MEMORY_API_TOKEN       required — bearer token for /v1/memory/* (fail closed)
  MEMORY_API_PORT        port (default 8787)
  MEMORY_DATABASE_URL    hosted Postgres URL; unset = local PGLite (dev only)
  MEMORY_STORE_BACKEND   auto | pglite | postgres
  MEMORY_EMBEDDER        bge-m3 (default) | hash`;

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(USAGE);
    return 0;
  }

  const token = (process.env.MEMORY_API_TOKEN ?? "").trim();
  if (token === "") {
    console.error(
      "memory-api: MEMORY_API_TOKEN is required — the hosted memory API never " +
        "serves unauthenticated. Set a strong token (e.g. `openssl rand -hex 32`).\n",
    );
    console.error(USAGE);
    return 1;
  }

  // MEMORY_API_PORT wins; PORT is the Railway/PaaS convention; 8787 the default.
  const rawPort = process.env.MEMORY_API_PORT ?? process.env.PORT ?? "8787";
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`memory-api: invalid port "${rawPort}".`);
    return 1;
  }

  const rootDir = process.env.AGENTIC_OS_DIR
    ? path.resolve(process.env.AGENTIC_OS_DIR)
    : findWorkspaceRoot(__dirname);
  process.env.MEMORY_MODEL_CACHE_DIR =
    process.env.MEMORY_MODEL_CACHE_DIR || path.join(rootDir, ".command-centre", "models");

  const modules = loadMemoryModules({ withApi: true, withCapture: false });
  const { backend, embedder, reranker, store, server } = modules;

  const dataDir = path.join(rootDir, ".command-centre", "memory");
  // Resolve the engine up front (same pure rule openMemoryStore applies) so the
  // startup log says what this deployment actually serves. A failed resolution
  // (e.g. MEMORY_STORE_BACKEND=postgres with no URL) propagates as a hard error.
  const resolvedBackend = backend.resolveMemoryBackend({ dataDir }, process.env);

  const emb = await embedder.createEmbedder({});
  const rerankConfig = reranker.loadRerankerConfig(rootDir);

  console.log(`memory-api → ${rootDir}`);
  console.log(`  backend:  ${resolvedBackend.kind}`);
  console.log(`  embedder: ${emb.model} (dim ${emb.dim})`);
  if (resolvedBackend.kind === "pglite") {
    console.log(
      "  note: serving from LOCAL PGLite — set MEMORY_DATABASE_URL for hosted team memory.",
    );
  }

  // Pooled serving: migrations run on a dedicated single connection, then a
  // pg.Pool takes over (a dropped pinned connection would otherwise kill a
  // long-lived server). PGLite ignores the flag.
  const memStore = await store.openMemoryStore({ dataDir, embedDim: emb.dim, pool: true });

  const httpServer = server.createMemoryApiServer({
    deps: { store: memStore, embedder: emb, rerankConfig },
    token,
    backendKind: resolvedBackend.kind,
  });

  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, () => resolve());
  });
  console.log(`  listening on :${port}  (GET /v1/health)`);

  // Graceful shutdown — stop accepting, then release the store/pool.
  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nmemory-api: ${signal} — shutting down.`);
    httpServer.close(() => {
      memStore
        .close()
        .catch(() => {})
        .finally(() => process.exit(0));
    });
    // Hard stop if connections linger past 5s.
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  return -1; // keep running (the listener holds the event loop open)
}

main()
  .then((code) => {
    if (code >= 0) process.exit(code);
  })
  .catch((error) => {
    console.error(`\nmemory-api failed: ${error instanceof Error ? error.message : error}`);
    if (error && error.stack) console.error(error.stack);
    process.exit(1);
  });
