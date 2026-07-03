/**
 * api.ts tests — the hosted memory API handlers.
 *
 * The handlers are transport-agnostic, so these tests exercise the full
 * contract WITHOUT a network: scope rejection (requests that do not carry
 * enough scope information are refused), citation metadata + audit event in
 * the search response, ingest validation, and — critically — the no-leak
 * guarantee through the API surface: what the CLI no-leak tests pin for the
 * store, these pin end-to-end for the HTTP contract.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadTsModule } = require("../test-utils/load-ts-module.cjs");

// Leaf-first loading — the union of the search graph and the ingest graph.
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

const EMBED_DIM = 8;

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aios-api-"));
}
function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

async function withDeps(fn) {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  const deps = { store: s, embedder: new embedder.HashEmbedder({ dim: EMBED_DIM }) };
  try {
    await fn(deps);
  } finally {
    await s.close();
    rmDir(dataDir);
  }
}

function ingestBody(overrides = {}) {
  return {
    scope: { teamId: null, clientId: null, userId: null, visibility: "system" },
    sourcePath: "context/memory/2026-06-10.md",
    sourceType: "memory",
    contentDate: "2026-06-10",
    content: "# Release\n\nThe release process uses tagged dev builds.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ingest — validation
// ---------------------------------------------------------------------------

test("ingest: rejects a body without a scope (400 invalid_scope)", async () => {
  await withDeps(async (deps) => {
    const res = await api.handleIngestRequest(deps, ingestBody({ scope: undefined }));
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "invalid_scope");
  });
});

test("ingest: rejects a scope that breaks the visibility invariants", async () => {
  await withDeps(async (deps) => {
    // private visibility with no userId — assertValidScope must trip, as 400.
    const res = await api.handleIngestRequest(
      deps,
      ingestBody({ scope: { teamId: null, clientId: null, userId: null, visibility: "private" } }),
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "invalid_scope");
    assert.match(res.body.error.message, /Invalid memory scope/);
  });
});

test("ingest: rejects missing/invalid fields with 400 invalid_request", async () => {
  await withDeps(async (deps) => {
    for (const bad of [
      ingestBody({ sourcePath: "" }),
      ingestBody({ content: "" }),
      ingestBody({ sourceType: "nope" }),
      ingestBody({ contentDate: "June 10" }),
      ingestBody({ authorityWeight: -1 }),
      ingestBody({ reason: "because" }),
      "not an object",
    ]) {
      const res = await api.handleIngestRequest(deps, bad);
      assert.equal(res.status, 400, JSON.stringify(bad).slice(0, 60));
      assert.equal(res.body.error.code, "invalid_request");
    }
  });
});

test("ingest: inserts, skips unchanged, and forces re-embeds", async () => {
  await withDeps(async (deps) => {
    const first = await api.handleIngestRequest(deps, ingestBody());
    assert.equal(first.status, 200);
    assert.ok(first.body.sourceId);
    assert.equal(first.body.skipped, false);
    assert.ok(first.body.chunksInserted >= 1);

    const again = await api.handleIngestRequest(deps, ingestBody());
    assert.equal(again.status, 200);
    assert.equal(again.body.skipped, true);
    assert.equal(again.body.sourceId, first.body.sourceId);

    const forced = await api.handleIngestRequest(deps, ingestBody({ force: true }));
    assert.equal(forced.status, 200);
    assert.equal(forced.body.skipped, false);
  });
});

// ---------------------------------------------------------------------------
// search — scope rejection ("reject requests without enough scope information")
// ---------------------------------------------------------------------------

test("search: rejects a body without a scope (400 invalid_scope)", async () => {
  await withDeps(async (deps) => {
    const res = await api.handleSearchRequest(deps, { query: "anything" });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "invalid_scope");
  });
});

test("search: rejects invalid include layers and identity types", async () => {
  await withDeps(async (deps) => {
    for (const badScope of [
      { include: [] },
      { include: ["everything"] },
      { teamId: 42 },
      "system",
    ]) {
      const res = await api.handleSearchRequest(deps, { query: "q", scope: badScope });
      assert.equal(res.status, 400, JSON.stringify(badScope));
      assert.equal(res.body.error.code, "invalid_scope");
    }
  });
});

test("search: rejects a missing query and an out-of-range topK", async () => {
  await withDeps(async (deps) => {
    const noQuery = await api.handleSearchRequest(deps, { scope: {} });
    assert.equal(noQuery.status, 400);
    assert.equal(noQuery.body.error.code, "invalid_request");

    const badTopK = await api.handleSearchRequest(deps, {
      query: "q",
      scope: {},
      topK: 0,
    });
    assert.equal(badTopK.status, 400);
    assert.equal(badTopK.body.error.code, "invalid_request");
  });
});

// ---------------------------------------------------------------------------
// search — round trip with citation metadata + mandatory audit
// ---------------------------------------------------------------------------

test("search: returns citation-ready hits and records the audit event", async () => {
  await withDeps(async (deps) => {
    await api.handleIngestRequest(deps, ingestBody());

    const res = await api.handleSearchRequest(deps, {
      query: "release process tagged builds",
      scope: {}, // empty object = explicit system-baseline search
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.visibilitySet, ["system"]);
    assert.ok(res.body.results.length >= 1);
    assert.ok(typeof res.body.latencyMs === "number");

    // Citation metadata, field by field.
    const hit = res.body.results[0];
    assert.equal(hit.sourcePath, "context/memory/2026-06-10.md");
    assert.equal(hit.sourceType, "memory");
    assert.equal(hit.contentDate, "2026-06-10");
    assert.ok(hit.chunkId && hit.sourceId);
    assert.equal(hit.headingLevel, 1);
    assert.equal(hit.startLine, 3);
    assert.equal(hit.endLine, 3);
    assert.match(hit.contentHash, /^[0-9a-f]{64}$/);
    assert.match(hit.chunkKey, /^chunk:v1:[0-9a-f]{64}$/);
    assert.ok(hit.content.includes("release process"));
    assert.ok(typeof hit.score === "number" && typeof hit.finalScore === "number");

    // Audit is mandatory: the event exists and (by default) stores NO query text.
    assert.ok(res.body.eventId, "search must record a search_events row");
    const event = await deps.store.client.query(
      "SELECT query_text, result_count FROM search_events WHERE id = $1",
      [res.body.eventId],
    );
    assert.equal(event.rows[0].query_text, null, "max-privacy default");
    assert.equal(Number(event.rows[0].result_count), res.body.results.length);
  });
});

test("search: storeQueryText opts the query text into the audit row", async () => {
  await withDeps(async (deps) => {
    await api.handleIngestRequest(deps, ingestBody());
    const res = await api.handleSearchRequest(deps, {
      query: "release process",
      scope: {},
      storeQueryText: true,
    });
    const event = await deps.store.client.query(
      "SELECT query_text FROM search_events WHERE id = $1",
      [res.body.eventId],
    );
    assert.equal(event.rows[0].query_text, "release process");
  });
});

// ---------------------------------------------------------------------------
// no-leak through the API surface
// ---------------------------------------------------------------------------

test("no-leak (api): client A search never returns client B memory", async () => {
  await withDeps(async (deps) => {
    const clientScope = (slug) => ({
      teamId: null,
      clientId: slug,
      userId: null,
      visibility: "client",
    });
    // Identical content for both tenants — only the scope filter can keep them
    // apart (similarity can't).
    const content = "# Billing\n\nThe shared billing flow notes.";
    await api.handleIngestRequest(
      deps,
      ingestBody({ scope: clientScope("acme"), sourcePath: "clients/acme/notes.md", content }),
    );
    await api.handleIngestRequest(
      deps,
      ingestBody({ scope: clientScope("globex"), sourcePath: "clients/globex/notes.md", content }),
    );

    const asAcme = await api.handleSearchRequest(deps, {
      query: "billing flow",
      scope: { clientId: "acme", include: ["client"] },
    });
    assert.equal(asAcme.status, 200);
    assert.ok(asAcme.body.results.length >= 1, "acme must see its own memory");
    assert.ok(
      asAcme.body.results.every((r) => !r.sourcePath.includes("globex")),
      "acme must never see globex rows",
    );

    // A search that names no client gets NEITHER client's rows.
    const asSystem = await api.handleSearchRequest(deps, { query: "billing flow", scope: {} });
    assert.equal(asSystem.body.results.length, 0);
  });
});

test("no-leak (api): team search omits other users' private memory", async () => {
  await withDeps(async (deps) => {
    const content = "# Plan\n\nQ3 hiring plan draft.";
    await api.handleIngestRequest(
      deps,
      ingestBody({
        scope: { teamId: "t1", clientId: null, userId: "alice", visibility: "private" },
        sourcePath: "private/alice.md",
        content,
      }),
    );

    // Bob searches the team — alice's private rows must not surface.
    const asBob = await api.handleSearchRequest(deps, {
      query: "hiring plan",
      scope: { teamId: "t1", userId: "bob" },
    });
    assert.equal(asBob.status, 200);
    assert.deepEqual(asBob.body.visibilitySet, ["system", "team", "private"]);
    assert.ok(
      asBob.body.results.every((r) => r.sourcePath !== "private/alice.md"),
      "bob must never see alice's private memory",
    );

    // Alice herself does see it.
    const asAlice = await api.handleSearchRequest(deps, {
      query: "hiring plan",
      scope: { teamId: "t1", userId: "alice" },
    });
    assert.ok(asAlice.body.results.some((r) => r.sourcePath === "private/alice.md"));
  });
});
