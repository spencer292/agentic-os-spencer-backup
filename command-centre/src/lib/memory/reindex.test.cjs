/**
 * reindex.test.cjs — re-indexing existing memory does NOT duplicate chunks.
 *
 * `memory:reindex` runs the same indexSources pass as `memory:index`, so the
 * guarantee under test is the indexer's idempotency: index the SAME corpus
 * twice and the chunk count must not grow, and a forced full re-index must
 * replace chunks in place (not pile new ones on top).
 *
 * The PGLite case runs in the default suite. The Postgres case (gated on
 * TEST_DATABASE_URL) proves the SAME on the hosted engine.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadTsModule } = require("../test-utils/load-ts-module.cjs");

// Leaf-first stub graph — store + indexer (the same union no-leak.test.cjs uses).
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
const discovery = loadTsModule(path.resolve(__dirname, "discovery.ts"));
const indexer = loadTsModule(path.resolve(__dirname, "indexer.ts"), {
  stubs: { "./scope": scope, "./ingest": ingest, "./discovery": discovery },
});

const EMBED_DIM = 8;
const TEST_URL = process.env.TEST_DATABASE_URL;

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aios-reindex-"));
}
function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}
function write(root, rel, content) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}
function newEmbedder() {
  return new embedder.HashEmbedder({ dim: EMBED_DIM });
}
function sysScope() {
  return { teamId: null, clientId: null, userId: null, visibility: "system" };
}

/** Seed a small multi-source corpus that mirrors the real default roots. */
function seedCorpus(root) {
  write(root, "context/memory/2026-06-10.md", "# Daily\n\nThe pglite pgvector memory store works.\n\n## Notes\n\nMore detail here.");
  write(root, "context/learnings.md", "# Learnings\n\nSomething learned about indexing.");
}

async function chunkCount(s, visibility = "system") {
  const { rows } = await s.client.query(
    "SELECT count(*)::int AS n FROM memory_chunks WHERE visibility = $1",
    [visibility],
  );
  return Number(rows[0].n);
}

/**
 * The core assertion shared by both engines: index the same corpus three times
 * (plain, plain-again, forced) and prove the chunk count never grows.
 */
async function assertNoDuplicateOnReindex(s) {
  const root = tempDir();
  seedCorpus(root);
  try {
    const run1 = await indexer.indexSources({
      store: s, embedder: newEmbedder(), scope: sysScope(), rootDir: root, reason: "backfill",
    });
    assert.equal(run1.sourcesIndexed, 2);
    const afterFirst = await chunkCount(s);
    assert.ok(afterFirst >= 2, "first index seeds chunks");
    assert.equal(afterFirst, run1.chunksInserted, "chunk table matches what run1 inserted");

    // Re-index identical content → every source skipped, ZERO new chunks.
    const run2 = await indexer.indexSources({
      store: s, embedder: newEmbedder(), scope: sysScope(), rootDir: root, reason: "backfill",
    });
    assert.equal(run2.sourcesSkipped, 2);
    assert.equal(run2.sourcesIndexed, 0);
    assert.equal(run2.chunksInserted, 0);
    assert.equal(await chunkCount(s), afterFirst, "re-index added no duplicate chunks");

    // Forced full re-index → re-embeds, but replaces in place (no growth).
    const run3 = await indexer.indexSources({
      store: s, embedder: newEmbedder(), scope: sysScope(), rootDir: root, force: true, reason: "backfill",
    });
    assert.equal(run3.sourcesIndexed, 2);
    assert.equal(await chunkCount(s), afterFirst, "forced re-index did not duplicate chunks");

    // index_jobs are tagged as the backfill pass.
    const jobs = await s.client.query(
      "SELECT count(*)::int AS n FROM index_jobs WHERE reason = 'backfill'",
    );
    assert.ok(Number(jobs.rows[0].n) >= 4, "backfill jobs recorded");
  } finally {
    rmDir(root);
  }
}

// ---------------------------------------------------------------------------
// PGLite — runs in the default suite.
// ---------------------------------------------------------------------------
test("re-index does not duplicate chunks (PGLite)", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    await assertNoDuplicateOnReindex(s);
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

// ---------------------------------------------------------------------------
// Hosted Postgres — the engine this re-index path actually targets.
// Gated on TEST_DATABASE_URL (a throwaway pgvector database).
// ---------------------------------------------------------------------------
test(
  "re-index does not duplicate chunks (hosted Postgres)",
  { skip: TEST_URL ? false : "set TEST_DATABASE_URL to run against a real Postgres" },
  async () => {
    // Clean slate so the count assertions are exact on a reused database.
    const raw = await postgresAdapter.openPostgres(TEST_URL);
    try {
      await raw.client.exec(
        "DROP TABLE IF EXISTS memory_chunks, memory_sources, index_jobs, " +
          "search_events, schema_migrations CASCADE",
      );
    } finally {
      await raw.close();
    }

    const s = await store.openMemoryStore({
      backend: "postgres",
      connectionString: TEST_URL,
      embedDim: EMBED_DIM,
    });
    try {
      await assertNoDuplicateOnReindex(s);
    } finally {
      await s.close();
    }
  },
);
