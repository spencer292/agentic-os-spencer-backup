/**
 * ingest.ts tests — the shared single-source pipeline.
 *
 * ingestContent() is the seam both the filesystem indexer and the hosted API
 * ingest through. These tests pin its contract directly, content-in (no
 * filesystem): idempotent skip, force re-embed, stale-chunk pruning, scope
 * validation, sha256 computation, and the index_jobs audit trail.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadTsModule } = require("../test-utils/load-ts-module.cjs");

// Leaf-first loading, same as indexer.test.cjs.
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

const EMBED_DIM = 8;

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aios-ingest-"));
}
function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}
function sysScope(overrides = {}) {
  return { teamId: null, clientId: null, userId: null, visibility: "system", ...overrides };
}
function newEmbedder() {
  return new embedder.HashEmbedder({ dim: EMBED_DIM });
}
function newCountingEmbedder() {
  const inner = newEmbedder();
  return {
    model: inner.model,
    dim: inner.dim,
    calls: 0,
    texts: [],
    async embed(texts) {
      this.calls += texts.length;
      this.texts.push(...texts);
      return inner.embed(texts);
    },
  };
}
function baseOpts(s, overrides = {}) {
  return {
    store: s,
    embedder: newEmbedder(),
    scope: sysScope(),
    sourcePath: "context/memory/2026-06-10.md",
    sourceType: "memory",
    content: "# A\n\naaa body\n\n## B\n\nbbb body\n\n## C\n\nccc body",
    ...overrides,
  };
}

test("ingestContent inserts a source with chunks and an audit row", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    const result = await ingest.ingestContent(
      baseOpts(s, { title: "Daily", contentDate: "2026-06-10", authorityWeight: 1.5 }),
    );

    assert.ok(result.sourceId);
    assert.equal(result.skipped, false);
    assert.equal(result.chunksInserted, 3); // three heading sections
    assert.equal(result.chunksPruned, 0);

    const src = await s.client.query(
      "SELECT title, content_date::text AS d, authority_weight, content_sha256, byte_size " +
        "FROM memory_sources WHERE id = $1",
      [result.sourceId],
    );
    assert.equal(src.rows[0].title, "Daily");
    assert.equal(src.rows[0].d, "2026-06-10");
    assert.ok(Math.abs(Number(src.rows[0].authority_weight) - 1.5) < 1e-6);
    // sha256 computed from the content when not provided.
    assert.equal(src.rows[0].content_sha256, ingest.sha256Hex(baseOpts(s).content));
    assert.equal(Number(src.rows[0].byte_size), Buffer.byteLength(baseOpts(s).content));

    const chunks = await s.client.query(
      "SELECT heading, heading_level, start_line, end_line, content_hash, chunk_key " +
        "FROM memory_chunks WHERE source_id = $1 ORDER BY chunk_index",
      [result.sourceId],
    );
    assert.equal(chunks.rows[0].heading, "A");
    assert.equal(Number(chunks.rows[0].heading_level), 1);
    assert.equal(Number(chunks.rows[0].start_line), 3);
    assert.equal(Number(chunks.rows[0].end_line), 3);
    assert.match(chunks.rows[0].content_hash, /^[0-9a-f]{64}$/);
    assert.match(chunks.rows[0].chunk_key, /^chunk:v1:[0-9a-f]{64}$/);

    const jobs = await s.client.query(
      "SELECT count(*)::int AS n FROM index_jobs WHERE status = 'succeeded'",
    );
    assert.equal(Number(jobs.rows[0].n), 1);
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

test("ingestContent skips unchanged content and records the skip", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    const first = await ingest.ingestContent(baseOpts(s));
    const second = await ingest.ingestContent(baseOpts(s));

    assert.equal(second.skipped, true);
    assert.equal(second.sourceId, first.sourceId); // same row, not a duplicate
    assert.equal(second.chunksInserted, 0);

    const skipped = await s.client.query(
      "SELECT count(*)::int AS n FROM index_jobs WHERE status = 'skipped'",
    );
    assert.equal(Number(skipped.rows[0].n), 1);
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

test("ingestContent reuses unchanged chunk embeddings by stable key", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  const emb = newCountingEmbedder();
  try {
    const firstContent = "# A\n\nsame body\n\n## B\n\nold body";
    const secondContent = "# A\n\nsame body\n\n## B\n\nnew body";

    await ingest.ingestContent(baseOpts(s, { embedder: emb, content: firstContent }));
    assert.equal(emb.calls, 2);

    const firstRows = await s.client.query(
      "SELECT chunk_key, embedding::text AS embedding FROM memory_chunks ORDER BY chunk_index",
    );
    const unchangedKey = firstRows.rows[0].chunk_key;
    const unchangedEmbedding = firstRows.rows[0].embedding;

    const second = await ingest.ingestContent(
      baseOpts(s, { embedder: emb, content: secondContent }),
    );
    assert.equal(second.skipped, false);
    assert.equal(second.chunksInserted, 2);
    assert.equal(emb.calls, 3, "only the changed B section should be embedded again");

    const afterRows = await s.client.query(
      "SELECT chunk_key, embedding::text AS embedding, content FROM memory_chunks ORDER BY chunk_index",
    );
    assert.equal(afterRows.rows.length, 2);
    assert.equal(afterRows.rows[0].chunk_key, unchangedKey);
    assert.equal(afterRows.rows[0].embedding, unchangedEmbedding);
    assert.equal(afterRows.rows[0].content, "same body");
    assert.equal(afterRows.rows[1].content, "new body");
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

test("ingestContent force re-embeds unchanged content", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    await ingest.ingestContent(baseOpts(s));
    const forced = await ingest.ingestContent(baseOpts(s, { force: true }));
    assert.equal(forced.skipped, false);
    assert.equal(forced.chunksInserted, 3);
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

test("ingestContent prunes stale chunks when content shrinks", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    const first = await ingest.ingestContent(baseOpts(s));
    assert.equal(first.chunksInserted, 3);

    const smaller = await ingest.ingestContent(
      baseOpts(s, { content: "# A\n\njust one section now" }),
    );
    assert.equal(smaller.skipped, false);
    assert.equal(smaller.chunksInserted, 1);
    assert.equal(smaller.chunksPruned, 3);

    const remaining = await s.client.query(
      "SELECT count(*)::int AS n FROM memory_chunks WHERE source_id = $1",
      [smaller.sourceId],
    );
    assert.equal(Number(remaining.rows[0].n), 1);
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

test("ingestContent rejects an invalid scope", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    await assert.rejects(
      () =>
        ingest.ingestContent(
          // private visibility with no userId → invalid.
          baseOpts(s, { scope: sysScope({ visibility: "private" }) }),
        ),
      /Invalid memory scope/,
    );
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

test("ingestContent rejects an embedder/store dimension mismatch", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    await assert.rejects(
      () =>
        ingest.ingestContent(
          baseOpts(s, { embedder: new embedder.HashEmbedder({ dim: EMBED_DIM + 1 }) }),
        ),
      /must match/,
    );
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});

test("ingestContent with trackJobs=false writes no index_jobs rows", async () => {
  const dataDir = tempDir();
  const s = await store.openMemoryStore({ dataDir, embedDim: EMBED_DIM });
  try {
    await ingest.ingestContent(baseOpts(s, { trackJobs: false }));
    const jobs = await s.client.query("SELECT count(*)::int AS n FROM index_jobs");
    assert.equal(Number(jobs.rows[0].n), 0);
  } finally {
    await s.close();
    rmDir(dataDir);
  }
});
