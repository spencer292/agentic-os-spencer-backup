/**
 * server.ts tests — the node:http transport of the hosted memory API.
 *
 * Real HTTP round trips against a server on port 0 (ephemeral): auth
 * (fail-closed construction, 401s, constant-time check), routing (404/405),
 * body handling (bad JSON → 400, oversized → 413), and the happy paths
 * (health, ingest → search). Handler-level contract details live in
 * api.test.cjs; this file pins the transport.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadTsModule } = require("../test-utils/load-ts-module.cjs");

// Leaf-first loading — the api.test.cjs graph plus server.ts on top.
const types = { ALL_VISIBILITIES: ["private", "client", "team", "system"] };
const embedding = loadTsModule(path.resolve(__dirname, "embedding.ts"));
const scope = loadTsModule(path.resolve(__dirname, "scope.ts"), {
  stubs: { "./types": types },
});
const migrate = loadTsModule(path.resolve(__dirname, "migrate.ts"));
const adapter = loadTsModule(path.resolve(__dirname, "pglite-adapter.ts"));
const postgresAdapter = loadTsModule(path.resolve(__dirname, "postgres-adapter.ts"));
const backend = loadTsModule(path.resolve(__dirname, "backend.ts"));
const rowMappers = loadTsModule(path.resolve(__dirname, "row-mappers.ts"), {
  stubs: { "./types": types, "./embedding": embedding },
});
const store = loadTsModule(path.resolve(__dirname, "store.ts"), {
  stubs: {
    "./types": types,
    "./migrate": migrate,
    "./scope": scope,
    "./embedding": embedding,
    "./row-mappers": rowMappers,
    "./pglite-adapter": adapter,
    "./postgres-adapter": postgresAdapter,
    "./backend": backend,
  },
});
const embedder = loadTsModule(path.resolve(__dirname, "embedder.ts"));
const chunker = loadTsModule(path.resolve(__dirname, "chunker.ts"));
const ingest = loadTsModule(path.resolve(__dirname, "ingest.ts"), {
  stubs: { "./scope": scope, "./embedding": embedding, "./chunker": chunker },
});
const reranker = loadTsModule(path.resolve(__dirname, "reranker.ts"));
const search = loadTsModule(path.resolve(__dirname, "search.ts"), {
  stubs: { "./types": types, "./reranker": reranker, "./row-mappers": rowMappers },
});
const api = loadTsModule(path.resolve(__dirname, "api.ts"), {
  stubs: { "./types": types, "./search": search, "./ingest": ingest, "./scope": scope },
});
const server = loadTsModule(path.resolve(__dirname, "server.ts"), {
  stubs: { "./api": api },
});

const EMBED_DIM = 8;
const TOKEN = "test-token-153";

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aios-srv-"));
}
function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Start a server on port 0 with an ephemeral PGLite store; run fn(baseUrl). */
async function withServer(fn, serverOverrides = {}) {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  const httpServer = server.createMemoryApiServer({
    deps: { store: s, embedder: new embedder.HashEmbedder({ dim: EMBED_DIM }) },
    token: TOKEN,
    backendKind: "pglite",
    logError: () => {}, // keep expected-failure tests quiet
    ...serverOverrides,
  });
  await new Promise((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => httpServer.close(resolve));
    await s.close();
    rmDir(dataDir);
  }
}

function post(baseUrl, pathname, body, headers = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const INGEST_BODY = {
  scope: { teamId: null, clientId: null, userId: null, visibility: "system" },
  sourcePath: "context/memory/2026-06-10.md",
  sourceType: "memory",
  content: "# Release\n\nThe release process uses tagged dev builds.",
};

// ---------------------------------------------------------------------------
// fail-closed construction
// ---------------------------------------------------------------------------

test("createMemoryApiServer refuses to build without a token", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    const deps = { store: s, embedder: new embedder.HashEmbedder({ dim: EMBED_DIM }) };
    assert.throws(() => server.createMemoryApiServer({ deps, token: "" }), /MEMORY_API_TOKEN/);
    assert.throws(() => server.createMemoryApiServer({ deps, token: "   " }), /MEMORY_API_TOKEN/);
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

// ---------------------------------------------------------------------------
// auth
// ---------------------------------------------------------------------------

test("memory routes 401 without a token, with a wrong token, and with a non-Bearer header", async () => {
  await withServer(async (baseUrl) => {
    for (const headers of [
      { authorization: "" },
      { authorization: "Bearer wrong-token" },
      { authorization: `Basic ${TOKEN}` },
    ]) {
      const res = await post(baseUrl, "/v1/memory/search", { query: "q", scope: {} }, headers);
      assert.equal(res.status, 401, JSON.stringify(headers));
      const body = await res.json();
      assert.equal(body.error.code, "unauthorized");
    }
  });
});

// ---------------------------------------------------------------------------
// routing + body handling
// ---------------------------------------------------------------------------

test("unknown routes 404; wrong methods 405", async () => {
  await withServer(async (baseUrl) => {
    const missing = await post(baseUrl, "/v1/memory/nope", {});
    assert.equal(missing.status, 404);

    const get = await fetch(`${baseUrl}/v1/memory/search`, {
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    assert.equal(get.status, 405);

    const postHealth = await post(baseUrl, "/v1/health", {});
    assert.equal(postHealth.status, 405);
  });
});

test("bad JSON → 400; oversized body → 413", async () => {
  await withServer(
    async (baseUrl) => {
      const badJson = await post(baseUrl, "/v1/memory/search", "{not json");
      assert.equal(badJson.status, 400);
      assert.equal((await badJson.json()).error.code, "invalid_request");

      const huge = await post(baseUrl, "/v1/memory/ingest", {
        ...INGEST_BODY,
        content: "x".repeat(4096),
      });
      assert.equal(huge.status, 413);
    },
    { maxBodyBytes: 1024 },
  );
});

// ---------------------------------------------------------------------------
// happy paths
// ---------------------------------------------------------------------------

test("GET /v1/health reports backend + embedder without auth", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/v1/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.backend, "pglite");
    assert.equal(body.embedder.dim, EMBED_DIM);
  });
});

test("ingest → search round trip over real HTTP", async () => {
  await withServer(async (baseUrl) => {
    const ingested = await post(baseUrl, "/v1/memory/ingest", INGEST_BODY);
    assert.equal(ingested.status, 200);
    const ingestBody = await ingested.json();
    assert.ok(ingestBody.sourceId);
    assert.ok(ingestBody.chunksInserted >= 1);

    const searched = await post(baseUrl, "/v1/memory/search", {
      query: "release process tagged builds",
      scope: {},
    });
    assert.equal(searched.status, 200);
    const searchBody = await searched.json();
    assert.ok(searchBody.results.length >= 1);
    assert.equal(searchBody.results[0].sourcePath, INGEST_BODY.sourcePath);
    assert.ok(searchBody.eventId, "audit event must be recorded");

    // Scope is still required over HTTP.
    const noScope = await post(baseUrl, "/v1/memory/search", { query: "q" });
    assert.equal(noScope.status, 400);
    assert.equal((await noScope.json()).error.code, "invalid_scope");
  });
});
