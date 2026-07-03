/**
 * Memory Schema — the single-source ingest pipeline.
 *
 * The per-source half of the indexer, extracted so the SAME pipeline serves two
 * transports:
 *
 *   - the filesystem indexer (indexer.ts) — discovery feeds it file contents
 *   - the hosted memory API (api.ts) — an HTTP body feeds it raw content
 *
 * One pipeline, two entry points — CLI-indexed and API-ingested memory can
 * never drift apart (the same philosophy as the backend-selection seam in
 * backend.ts: one rule, not parallel code paths).
 *
 * The pipeline, per source:
 *
 *   sha256 (computed when absent) → skip-if-unchanged → upsert source →
 *   chunk → embed in batches → upsert chunks → prune stale chunks →
 *   record an index_jobs audit row.
 *
 * Scope is REQUIRED and validated up front — explicit scope at ingest time, not
 * a default.
 */

import crypto from "node:crypto";

import type { MemoryStore } from "./store";
import type { Embedder } from "./embedder";
import { assertValidScope } from "./scope";
import { parseVectorLiteral } from "./embedding";
import { chunkMarkdown, type Chunk } from "./chunker";
import type { IndexJobReason, Scope, SourceType } from "./types";

export interface IngestContentOptions {
  store: MemoryStore;
  embedder: Embedder;
  /** The source's scope. REQUIRED and validated. */
  scope: Scope;
  /** Repo-relative, forward-slash path identifying the source (UNIQUE per scope). */
  sourcePath: string;
  sourceType: SourceType;
  title?: string | null;
  /** ISO `YYYY-MM-DD`, or null. Drives recency reranking downstream. */
  contentDate?: string | null;
  authorityWeight?: number;
  /** The normalized source text to chunk + embed. */
  content: string;
  /** sha256 of `content`. Computed here when omitted (the API path). */
  contentSha256?: string;
  /** Byte size of `content`. Computed here when omitted. */
  byteSize?: number | null;
  /** Re-embed even when the content hash is unchanged. */
  force?: boolean;
  /** Record index_jobs audit rows. Default true. */
  trackJobs?: boolean;
  /** Why this ingest ran — tagged on the index_jobs row. Default 'manual'. */
  reason?: IndexJobReason;
  /** Chunks embedded per model call. Default 32. */
  batchSize?: number;
}

export interface IngestContentResult {
  /** The source row id (existing id when skipped). */
  sourceId: string;
  /** True when the content hash was unchanged and nothing was re-embedded. */
  skipped: boolean;
  chunksInserted: number;
  chunksPruned: number;
}

interface ExistingSource {
  id: string;
  contentSha256: string;
  modelCompatible: boolean;
}

interface KeyedChunk extends Chunk {
  chunkKey: string;
}

/** sha256 hex digest of a string (the content-change detection key). */
export function sha256Hex(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export interface BuildChunkKeyInput {
  sourcePath: string;
  startLine: number;
  endLine: number;
  contentHash: string;
  embeddingModel: string;
}

/** Stable chunk identity for one source line range + content + embedding model. */
export function buildChunkKey(input: BuildChunkKeyInput): string {
  const material = JSON.stringify([
    input.sourcePath,
    input.startLine,
    input.endLine,
    input.contentHash,
    input.embeddingModel,
  ]);
  return `chunk:v1:${sha256Hex(material)}`;
}

/**
 * Ingest ONE source's content into the store: skip-if-unchanged, upsert the
 * source row, chunk + embed + upsert chunks, prune stale chunks, and record the
 * index_jobs audit trail. Idempotent — re-ingesting identical content is a
 * no-op (`skipped: true`) unless `force` is set.
 */
export async function ingestContent(
  opts: IngestContentOptions,
): Promise<IngestContentResult> {
  const {
    store,
    embedder,
    scope,
    sourcePath,
    sourceType,
    content,
    force = false,
    trackJobs = true,
    reason = "manual",
    batchSize = 32,
  } = opts;

  assertValidScope(scope);
  if (embedder.dim !== store.embedDim) {
    throw new Error(
      `ingestContent: embedder dim ${embedder.dim} != store embedDim ` +
        `${store.embedDim}. They must match.`,
    );
  }

  const contentSha256 = opts.contentSha256 ?? sha256Hex(content);
  const byteSize = opts.byteSize ?? Buffer.byteLength(content, "utf-8");

  const existing = await findExistingSource(store, scope, sourcePath, embedder);

  // Idempotent skip — content unchanged since the last ingest and the current
  // chunks were produced by the same embedding model/dimension.
  if (existing && existing.contentSha256 === contentSha256 && existing.modelCompatible && !force) {
    if (trackJobs) {
      await recordJob(store, scope, sourcePath, reason, "skipped", existing.id);
    }
    return {
      sourceId: existing.id,
      skipped: true,
      chunksInserted: 0,
      chunksPruned: 0,
    };
  }

  const jobId = trackJobs
    ? await recordJobStart(store, scope, sourcePath, reason)
    : null;

  try {
    const src = await store.insertSource({
      scope,
      sourcePath,
      sourceType,
      title: opts.title ?? null,
      contentDate: opts.contentDate ?? null,
      authorityWeight: opts.authorityWeight,
      contentSha256,
      byteSize,
    });

    const chunks = chunkMarkdown(content).map((chunk): KeyedChunk => ({
      ...chunk,
      chunkKey: buildChunkKey({
        sourcePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        contentHash: chunk.contentHash,
        embeddingModel: embedder.model,
      }),
    }));
    const embeddingsByKey = force
      ? new Map<string, number[]>()
      : await findReusableChunkEmbeddings(
          store,
          src.id,
          chunks.map((chunk) => chunk.chunkKey),
        );
    const chunksToEmbed = chunks.filter((chunk) => !embeddingsByKey.has(chunk.chunkKey));
    let chunksInserted = 0;

    for (let start = 0; start < chunksToEmbed.length; start += batchSize) {
      const batch = chunksToEmbed.slice(start, start + batchSize);
      const embeddings = await embedder.embed(batch.map((c) => c.content));
      for (let i = 0; i < batch.length; i += 1) {
        const chunk = batch[i];
        const embedding = embeddings[i];
        if (embedding.length !== store.embedDim) {
          throw new Error(
            `embedder returned dim ${embedding.length}, expected ${store.embedDim}`,
          );
        }
        embeddingsByKey.set(chunk.chunkKey, embedding);
      }
    }

    for (const chunk of chunks) {
      const embedding = embeddingsByKey.get(chunk.chunkKey);
      if (!embedding) {
        throw new Error(`Missing embedding for chunk key ${chunk.chunkKey}`);
      }
      await store.insertChunk({
        sourceId: src.id,
        sourceScope: scope,
        chunkScope: scope,
        chunkIndex: chunk.index,
        content: chunk.content,
        heading: chunk.heading,
        headingLevel: chunk.headingLevel,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        contentHash: chunk.contentHash,
        chunkKey: chunk.chunkKey,
        tokenCount: chunk.tokenCount,
        sourcePath,
        sourceType,
        contentDate: opts.contentDate ?? null,
        authorityWeight: opts.authorityWeight,
        embedding,
        embeddingModel: embedder.model,
        embeddingDim: embedder.dim,
      });
      chunksInserted += 1;
    }

    // Prune stale chunks left from previous versions of this source.
    const chunksPruned = await pruneChunks(
      store,
      src.id,
      chunks.map((chunk) => chunk.chunkKey),
    );

    if (jobId) await recordJobFinish(store, jobId, "succeeded", src.id, null);

    return { sourceId: src.id, skipped: false, chunksInserted, chunksPruned };
  } catch (error) {
    if (jobId) {
      const message = error instanceof Error ? error.message : String(error);
      await recordJobFinish(store, jobId, "failed", existing?.id ?? null, message);
    }
    throw error;
  }
}

async function findExistingSource(
  store: MemoryStore,
  scope: Scope,
  sourcePath: string,
  embedder?: Embedder,
): Promise<ExistingSource | null> {
  const { rows } = await store.client.query<{
    id: string;
    content_sha256: string;
  }>(
    `SELECT id, content_sha256 FROM memory_sources
      WHERE source_path = $1 AND visibility = $2
        AND COALESCE(team_id, '')   = COALESCE($3, '')
        AND COALESCE(client_id, '') = COALESCE($4, '')
        AND COALESCE(user_id, '')   = COALESCE($5, '')
      LIMIT 1`,
    [sourcePath, scope.visibility, scope.teamId, scope.clientId, scope.userId],
  );
  if (rows.length === 0) return null;
  if (!embedder) {
    return { id: rows[0].id, contentSha256: rows[0].content_sha256, modelCompatible: true };
  }

  const chunkCheck = await store.client.query<{ n: number }>(
    `SELECT count(*)::int AS n
      FROM memory_chunks
      WHERE source_id = $1
        AND embedding IS NOT NULL
        AND (COALESCE(embedding_model, '') <> $2 OR COALESCE(embedding_dim, -1) <> $3)`,
    [rows[0].id, embedder.model, embedder.dim],
  );

  return {
    id: rows[0].id,
    contentSha256: rows[0].content_sha256,
    modelCompatible: Number(chunkCheck.rows[0]?.n ?? 0) === 0,
  };
}

async function findReusableChunkEmbeddings(
  store: MemoryStore,
  sourceId: string,
  chunkKeys: string[],
): Promise<Map<string, number[]>> {
  if (chunkKeys.length === 0) return new Map();
  const { rows } = await store.client.query<{ chunk_key: string; embedding: unknown }>(
    `SELECT chunk_key, embedding::text AS embedding
       FROM memory_chunks
      WHERE source_id = $1
        AND chunk_key = ANY($2::text[])
        AND embedding IS NOT NULL`,
    [sourceId, pgTextArrayLiteral(chunkKeys)],
  );

  const out = new Map<string, number[]>();
  for (const row of rows) {
    const embedding = parseVectorLiteral(row.embedding);
    if (embedding) out.set(row.chunk_key, embedding);
  }
  return out;
}

async function pruneChunks(
  store: MemoryStore,
  sourceId: string,
  keepChunkKeys: string[],
): Promise<number> {
  const { rows } = await store.client.query<{ id: string }>(
    `DELETE FROM memory_chunks
      WHERE source_id = $1
        AND (chunk_key IS NULL OR NOT (chunk_key = ANY($2::text[])))
      RETURNING id`,
    [sourceId, pgTextArrayLiteral(keepChunkKeys)],
  );
  return rows.length;
}

function pgTextArrayLiteral(items: string[]): string {
  if (items.length === 0) return "{}";
  return `{${items
    .map((item) => `"${String(item).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(",")}}`;
}

async function recordJobStart(
  store: MemoryStore,
  scope: Scope,
  sourcePath: string,
  reason: IndexJobReason,
): Promise<string> {
  const { rows } = await store.client.query<{ id: string }>(
    `INSERT INTO index_jobs
       (team_id, client_id, user_id, visibility, source_path, reason, status,
        attempts, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'running', 1, now())
     RETURNING id`,
    [scope.teamId, scope.clientId, scope.userId, scope.visibility, sourcePath, reason],
  );
  return rows[0].id;
}

async function recordJobFinish(
  store: MemoryStore,
  jobId: string,
  status: "succeeded" | "failed",
  sourceId: string | null,
  errorMessage: string | null,
): Promise<void> {
  await store.client.query(
    `UPDATE index_jobs
        SET status = $2, source_id = $3, error_message = $4, finished_at = now()
      WHERE id = $1`,
    [jobId, status, sourceId, errorMessage],
  );
}

/** Record a terminal job in one statement (used for skipped sources). */
async function recordJob(
  store: MemoryStore,
  scope: Scope,
  sourcePath: string,
  reason: IndexJobReason,
  status: "skipped",
  sourceId: string | null,
): Promise<void> {
  await store.client.query(
    `INSERT INTO index_jobs
       (team_id, client_id, user_id, visibility, source_path, source_id, reason,
        status, attempts, started_at, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, now(), now())`,
    [scope.teamId, scope.clientId, scope.userId, scope.visibility, sourcePath, sourceId, reason, status],
  );
}
