#!/usr/bin/env node
/**
 * memory-upgrade-embeddings — preserve hosted memory while changing vector dim.
 *
 * Hosted Postgres can contain memory that is not rebuildable from the local
 * checkout. When the vector dimension changes, this script exports the existing
 * memory rows, embeds old chunk content with the active BGE-M3 embedder, rebuilds
 * only Agentic OS memory tables at the new dimension, and restores the rows.
 */

const fs = require("node:fs");
const path = require("node:path");

const { findWorkspaceRoot } = require("./workspace-root.cjs");
const { loadMemoryModules } = require("./load-memory-modules.cjs");

const { migrate, postgresAdapter, embedder, embedding } = loadMemoryModules({
  withCapture: false,
});

const USAGE = `memory-upgrade-embeddings — rebuild hosted memory vectors in place

Usage:
  node scripts/memory-upgrade-embeddings.cjs --yes [--batch-size N]`;

function parseArgs(argv) {
  const flags = { yes: false, batchSize: 16 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--yes") flags.yes = true;
    else if (arg === "--batch-size") {
      const value = argv[++i];
      if (!value) throw new Error("--batch-size requires a value");
      flags.batchSize = Number.parseInt(value, 10);
    } else if (arg.startsWith("--batch-size=")) {
      flags.batchSize = Number.parseInt(arg.slice("--batch-size=".length), 10);
    } else if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else {
      throw new Error(`Unknown flag: ${arg}`);
    }
  }
  if (!Number.isInteger(flags.batchSize) || flags.batchSize < 1) {
    throw new Error("--batch-size must be a positive integer");
  }
  return flags;
}

async function tableExists(client, tableName) {
  const { rows } = await client.query("SELECT to_regclass($1) AS table_name", [tableName]);
  return rows[0]?.table_name != null;
}

async function columnExists(client, tableName, columnName) {
  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT 1
         FROM information_schema.columns
        WHERE table_name = $1
          AND column_name = $2
     ) AS present`,
    [tableName, columnName],
  );
  return rows[0]?.present === true;
}

async function currentEmbedDim(client) {
  if (!(await tableExists(client, "schema_migrations"))) return null;
  const { rows } = await client.query(
    "SELECT embed_dim FROM schema_migrations ORDER BY version LIMIT 1",
  );
  return rows.length ? Number(rows[0].embed_dim) : null;
}

async function exportMemory(client) {
  const hasSources = await tableExists(client, "memory_sources");
  const hasChunks = await tableExists(client, "memory_chunks");
  const hasJobs = await tableExists(client, "index_jobs");
  const hasEvents = await tableExists(client, "search_events");

  const sources = hasSources
    ? (
        await client.query(
          `SELECT id::text, team_id, client_id, user_id, visibility, source_path,
                  source_type, title, content_date::text, authority_weight,
                  content_sha256, byte_size, metadata::text,
                  created_at::text, updated_at::text
             FROM memory_sources
            ORDER BY created_at, id`,
        )
      ).rows
    : [];

  const chunks = hasChunks ? await exportChunks(client) : [];

  const jobs = hasJobs
    ? (
        await client.query(
          `SELECT id::text, team_id, client_id, user_id, visibility, source_path,
                  source_id::text, reason, status, attempts, error_message,
                  payload::text, enqueued_at::text, started_at::text,
                  finished_at::text
             FROM index_jobs
            ORDER BY enqueued_at, id`,
        )
      ).rows
    : [];

  const events = hasEvents
    ? (
        await client.query(
          `SELECT id::text, team_id, client_id, user_id, visibility_set,
                  query_text, top_k, result_count, result_chunk_ids,
                  latency_ms, metadata::text, created_at::text
             FROM search_events
            ORDER BY created_at, id`,
        )
      ).rows
    : [];

  return { sources, chunks, jobs, events };
}

async function exportChunks(client) {
  const optional = {
    startLine: await columnExists(client, "memory_chunks", "start_line"),
    endLine: await columnExists(client, "memory_chunks", "end_line"),
    headingLevel: await columnExists(client, "memory_chunks", "heading_level"),
    contentHash: await columnExists(client, "memory_chunks", "content_hash"),
    chunkKey: await columnExists(client, "memory_chunks", "chunk_key"),
  };

  const select = [
    "id::text",
    "source_id::text",
    "team_id",
    "client_id",
    "user_id",
    "visibility",
    "chunk_index",
    "content",
    "heading",
    optional.headingLevel ? "heading_level" : "NULL::smallint AS heading_level",
    optional.startLine ? "start_line" : "NULL::integer AS start_line",
    optional.endLine ? "end_line" : "NULL::integer AS end_line",
    optional.contentHash ? "content_hash" : "NULL::text AS content_hash",
    optional.chunkKey ? "chunk_key" : "NULL::text AS chunk_key",
    "token_count",
    "source_path",
    "source_type",
    "content_date::text",
    "authority_weight",
    "metadata::text",
    "created_at::text",
  ].join(", ");

  const { rows } = await client.query(
    `SELECT ${select}
       FROM memory_chunks
      ORDER BY source_id, chunk_index, id`,
  );
  return rows;
}

function writeBackup(rootDir, payload) {
  const dir = path.join(rootDir, "backups", "memory-upgrade");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const file = path.join(dir, `hosted-memory-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

async function embedChunks(emb, chunks, batchSize) {
  const vectors = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchVectors = await emb.embed(batch.map((row) => row.content));
    vectors.push(...batchVectors);
    console.error(`  re-embedded hosted chunks: ${vectors.length}/${chunks.length}`);
  }
  return vectors;
}

async function dropMemoryTables(client) {
  await client.exec(`
DROP TABLE IF EXISTS search_events;
DROP TABLE IF EXISTS index_jobs;
DROP TABLE IF EXISTS memory_chunks;
DROP TABLE IF EXISTS memory_sources;
DROP TABLE IF EXISTS schema_migrations;
`);
}

function jsonb(value) {
  if (value == null || value === "") return "{}";
  return typeof value === "string" ? value : JSON.stringify(value);
}

async function restoreSources(client, sources) {
  const sql = `
INSERT INTO memory_sources
  (id, team_id, client_id, user_id, visibility, source_path, source_type, title,
   content_date, authority_weight, content_sha256, byte_size, metadata,
   created_at, updated_at)
VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9::date, $10, $11, $12,
        $13::jsonb, $14::timestamptz, $15::timestamptz)`;

  for (const row of sources) {
    await client.query(sql, [
      row.id,
      row.team_id,
      row.client_id,
      row.user_id,
      row.visibility,
      row.source_path,
      row.source_type,
      row.title,
      row.content_date,
      row.authority_weight,
      row.content_sha256,
      row.byte_size,
      jsonb(row.metadata),
      row.created_at,
      row.updated_at,
    ]);
  }
}

async function restoreChunks(client, chunks, vectors, emb) {
  const sql = `
INSERT INTO memory_chunks
  (id, source_id, team_id, client_id, user_id, visibility, chunk_index, content,
   heading, heading_level, start_line, end_line, content_hash, chunk_key,
   token_count, source_path, source_type, content_date, authority_weight,
   embedding, embedding_model, embedding_dim, metadata, created_at)
VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18::date, $19, $20::vector, $21, $22,
        $23::jsonb, $24::timestamptz)`;

  for (let i = 0; i < chunks.length; i += 1) {
    const row = chunks[i];
    await client.query(sql, [
      row.id,
      row.source_id,
      row.team_id,
      row.client_id,
      row.user_id,
      row.visibility,
      row.chunk_index,
      row.content,
      row.heading,
      row.heading_level,
      row.start_line,
      row.end_line,
      row.content_hash,
      row.chunk_key,
      row.token_count,
      row.source_path,
      row.source_type,
      row.content_date,
      row.authority_weight,
      embedding.toVectorLiteral(vectors[i]),
      emb.model,
      emb.dim,
      jsonb(row.metadata),
      row.created_at,
    ]);
  }
}

async function restoreJobs(client, jobs, sourceIds) {
  const sql = `
INSERT INTO index_jobs
  (id, team_id, client_id, user_id, visibility, source_path, source_id, reason,
   status, attempts, error_message, payload, enqueued_at, started_at, finished_at)
VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, $8, $9, $10, $11, $12::jsonb,
        $13::timestamptz, $14::timestamptz, $15::timestamptz)`;

  for (const row of jobs) {
    await client.query(sql, [
      row.id,
      row.team_id,
      row.client_id,
      row.user_id,
      row.visibility,
      row.source_path,
      row.source_id && sourceIds.has(row.source_id) ? row.source_id : null,
      row.reason,
      row.status,
      row.attempts,
      row.error_message,
      jsonb(row.payload),
      row.enqueued_at,
      row.started_at,
      row.finished_at,
    ]);
  }
}

async function restoreEvents(client, events) {
  const sql = `
INSERT INTO search_events
  (id, team_id, client_id, user_id, visibility_set, query_text, query_embedding,
   top_k, result_count, result_chunk_ids, latency_ms, metadata, created_at)
VALUES ($1::uuid, $2, $3, $4, $5::text[], $6, NULL, $7, $8, $9::uuid[], $10,
        $11::jsonb, $12::timestamptz)`;

  for (const row of events) {
    await client.query(sql, [
      row.id,
      row.team_id,
      row.client_id,
      row.user_id,
      row.visibility_set ?? [],
      row.query_text,
      row.top_k,
      row.result_count,
      row.result_chunk_ids ?? [],
      row.latency_ms,
      jsonb(row.metadata),
      row.created_at,
    ]);
  }
}

async function validate(client, emb) {
  const { rows } = await client.query(
    `SELECT count(*)::int AS bad
       FROM memory_chunks
      WHERE embedding IS NULL
         OR embedding_model <> $1
         OR embedding_dim <> $2`,
    [emb.model, emb.dim],
  );
  return Number(rows[0]?.bad ?? 0) === 0;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(USAGE);
    return 0;
  }
  if (!flags.yes) {
    console.error("memory-upgrade-embeddings requires --yes because it rebuilds memory tables.");
    console.error(USAGE);
    return 2;
  }

  const connectionString = process.env.MEMORY_DATABASE_URL || process.env.DATABASE_URL || "";
  if (!connectionString) {
    throw new Error("Set MEMORY_DATABASE_URL or DATABASE_URL for hosted memory upgrade.");
  }

  const rootDir = process.env.AGENTIC_OS_DIR
    ? path.resolve(process.env.AGENTIC_OS_DIR)
    : findWorkspaceRoot(__dirname);
  process.env.MEMORY_MODEL_CACHE_DIR =
    process.env.MEMORY_MODEL_CACHE_DIR || path.join(rootDir, ".command-centre", "models");

  const pg = await postgresAdapter.openPostgres(connectionString);
  try {
    const beforeDim = await currentEmbedDim(pg.client);
    if (beforeDim === migrate.DEFAULT_EMBED_DIM) {
      console.log(
        `memory-upgrade-embeddings: schema already uses ${beforeDim} dimensions; no rebuild needed.`,
      );
      return 0;
    }

    const existing = await exportMemory(pg.client);
    if (existing.sources.length === 0 && existing.chunks.length === 0) {
      console.log("memory-upgrade-embeddings: no existing memory rows; applying schema only.");
      await migrate.applyMigrations(pg.client, { embedDim: migrate.DEFAULT_EMBED_DIM });
      return 0;
    }

    const backupFile = writeBackup(rootDir, {
      exportedAt: new Date().toISOString(),
      previousEmbedDim: beforeDim,
      ...existing,
    });
    console.log(`memory-upgrade-embeddings: exported hosted memory to ${backupFile}`);

    const emb = await embedder.createEmbedder({ kind: "bge-m3" });
    const vectors = await embedChunks(emb, existing.chunks, flags.batchSize);

    await dropMemoryTables(pg.client);
    await migrate.applyMigrations(pg.client, { embedDim: emb.dim });

    await restoreSources(pg.client, existing.sources);
    const sourceIds = new Set(existing.sources.map((row) => row.id));
    await restoreChunks(pg.client, existing.chunks, vectors, emb);
    await restoreJobs(pg.client, existing.jobs, sourceIds);
    await restoreEvents(pg.client, existing.events);

    if (!(await validate(pg.client, emb))) {
      throw new Error("Restored hosted memory did not validate with the active embedder.");
    }

    console.log(
      `memory-upgrade-embeddings: restored ${existing.sources.length} sources, ` +
        `${existing.chunks.length} chunks, ${existing.jobs.length} jobs, ` +
        `${existing.events.length} search events at ${emb.model}/${emb.dim}.`,
    );
    return 0;
  } finally {
    await pg.close();
  }
}

main()
  .then((code) => {
    // Drain the event loop instead of process.exit(): forcing exit aborts
    // onnxruntime-node's native teardown (mutex lock failed → SIGABRT / Abort trap 6).
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(
      `\nmemory-upgrade-embeddings failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    if (error && error.stack) console.error(error.stack);
    console.error(`\n${USAGE}`);
    process.exitCode = 1;
  });
