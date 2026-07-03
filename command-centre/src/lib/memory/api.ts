/**
 * Memory Schema — hosted memory API handlers.
 *
 * The transport-agnostic core of the hosted ingest/search API. Each handler is
 * a plain async function `(deps, body) → { status, body }` — no HTTP types, no
 * framework. server.ts mounts them on node:http; they could be mounted as
 * Next.js route handlers with a dozen lines. That keeps the contract testable
 * without a network and keeps this module focused on the two things the task
 * demands: scope validation and response shaping.
 *
 * Scope rules (the reason this API exists):
 *   - search REQUIRES an explicit `scope` object — same semantics as the CLI's
 *     buildSearchScope: identity fields set teamId/clientId/userId, and the
 *     searched visibility layers derive from them with `system` always present,
 *     unless `include` pins them explicitly. A request without a scope is a 400,
 *     never an implicit "search everything".
 *   - ingest validates its scope through assertValidScope — the same invariants
 *     the store and the DB CHECK constraints enforce.
 *
 * The handlers NEVER reimplement filtering or the pipeline: search goes through
 * searchMemory (scope.ts buildScopeWhere is the only leak boundary) and ingest
 * goes through ingestContent (the same pipeline the filesystem indexer uses).
 *
 * Audit: unlike the local CLI (--no-events), the hosted API always records
 * search_events — a shared source of truth does not let callers opt out of the
 * audit trail. `storeQueryText` stays opt-in (max-privacy default).
 */

import { searchMemory } from "./search";
import { ingestContent } from "./ingest";
import { assertValidScope } from "./scope";
import type { MemoryStore } from "./store";
import type { Embedder } from "./embedder";
import type { RerankConfig } from "./reranker";
import type {
  IndexJobReason,
  Scope,
  SearchScope,
  SourceType,
  Visibility,
} from "./types";

/** Everything a handler needs — owned by the server, injected per call. */
export interface MemoryApiDeps {
  store: MemoryStore;
  embedder: Embedder;
  rerankConfig?: RerankConfig;
}

/** A transport-neutral response: HTTP status + JSON-serializable body. */
export interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

/** Client errors carry the status + machine-readable code the transport emits. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const MAX_TOP_K = 100;

// Runtime mirrors of the types.ts unions (which are erased at compile time).
// Same pattern as scope.ts's VISIBILITY_RULES and the CLI's VALID_VISIBILITIES.
const VALID_VISIBILITIES: readonly Visibility[] = ["private", "client", "team", "system"];
const VALID_SOURCE_TYPES: readonly SourceType[] = [
  "memory",
  "learnings",
  "brand",
  "transcript",
  "session",
  "other",
];
const VALID_REASONS: readonly IndexJobReason[] = [
  "manual",
  "file_change",
  "session_capture",
  "refresh",
  "backfill",
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Shape an {@link ApiError} as the transport-level error body. */
export function errorResponse(error: ApiError): ApiResponse {
  return {
    status: error.status,
    body: { error: { code: error.code, message: error.message } },
  };
}

// ── field validators ─────────────────────────────────────────────────────────

function asRecord(value: unknown, code: string, what: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, code, `${what} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function optionalId(raw: Record<string, unknown>, key: string): string | null {
  const value = raw[key];
  if (value == null) return null;
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "invalid_scope", `scope.${key} must be a non-empty string or null`);
  }
  return value.trim();
}

function requiredString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "invalid_request", `${key} is required and must be a non-empty string`);
  }
  return value;
}

// ── search ───────────────────────────────────────────────────────────────────

/**
 * Build the SearchScope from a request body's `scope` object. Mirrors the CLI's
 * buildSearchScope: an explicit scope object is REQUIRED; `include` (when
 * given) pins the visibility layers, else they derive from the identity fields
 * with `system` as the always-present baseline.
 */
export function buildSearchScopeFromBody(rawScope: unknown): SearchScope {
  if (rawScope == null) {
    throw new ApiError(
      400,
      "invalid_scope",
      "scope is required: pass a scope object with teamId/clientId/userId " +
        'and/or an explicit include list (e.g. {"include":["system"]})',
    );
  }
  const raw = asRecord(rawScope, "invalid_scope", "scope");

  const searchScope: SearchScope = {
    teamId: optionalId(raw, "teamId"),
    clientId: optionalId(raw, "clientId"),
    userId: optionalId(raw, "userId"),
  };

  if (raw.include != null) {
    if (!Array.isArray(raw.include) || raw.include.length === 0) {
      throw new ApiError(400, "invalid_scope", "scope.include must be a non-empty array");
    }
    for (const layer of raw.include) {
      if (!VALID_VISIBILITIES.includes(layer as Visibility)) {
        throw new ApiError(
          400,
          "invalid_scope",
          `scope.include has invalid visibility "${String(layer)}" ` +
            `(allowed: ${VALID_VISIBILITIES.join(", ")})`,
        );
      }
    }
    searchScope.include = raw.include as Visibility[];
  } else {
    // Derive layers from the identity fields; system is the baseline everyone sees.
    const include: Visibility[] = ["system"];
    if (searchScope.teamId != null) include.push("team");
    if (searchScope.clientId != null) include.push("client");
    if (searchScope.userId != null) include.push("private");
    searchScope.include = include;
  }

  return searchScope;
}

/**
 * POST /v1/memory/search — embed the query server-side, run the scoped +
 * reranked search, and return citation-ready hits plus the audit event id.
 */
export async function handleSearchRequest(
  deps: MemoryApiDeps,
  rawBody: unknown,
): Promise<ApiResponse> {
  try {
    const body = asRecord(rawBody, "invalid_request", "request body");
    const query = requiredString(body, "query");
    const searchScope = buildSearchScopeFromBody(body.scope);

    let topK = 10;
    if (body.topK != null) {
      const n = Number(body.topK);
      if (!Number.isInteger(n) || n < 1 || n > MAX_TOP_K) {
        throw new ApiError(
          400,
          "invalid_request",
          `topK must be an integer in [1, ${MAX_TOP_K}]`,
        );
      }
      topK = n;
    }

    const res = await searchMemory({
      store: deps.store,
      embedder: deps.embedder,
      query,
      searchScope,
      topK,
      rerankConfig: deps.rerankConfig,
      recordEvent: true, // audit is mandatory on the hosted API
      storeQueryText: body.storeQueryText === true,
    });

    return {
      status: 200,
      body: {
        results: res.results.map((r) => ({
          chunkId: r.id,
          sourceId: r.sourceId,
          sourcePath: r.sourcePath,
          sourceType: r.sourceType,
          contentDate: r.contentDate,
          heading: r.heading,
          headingLevel: r.headingLevel,
          startLine: r.startLine,
          endLine: r.endLine,
          contentHash: r.contentHash,
          chunkKey: r.chunkKey,
          content: r.content,
          score: Number((1 - r.distance).toFixed(6)), // cosine similarity
          distance: r.distance,
          finalScore: r.finalScore,
          reranked: r.reranked,
        })),
        visibilitySet: res.visibilitySet,
        latencyMs: res.latencyMs,
        eventId: res.event ? res.event.id : null,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error);
    throw error; // transport maps unexpected failures to 500
  }
}

// ── ingest ───────────────────────────────────────────────────────────────────

/** Build and validate the ingest Scope from a request body's `scope` object. */
function buildIngestScopeFromBody(rawScope: unknown): Scope {
  if (rawScope == null) {
    throw new ApiError(
      400,
      "invalid_scope",
      "scope is required: pass {teamId, clientId, userId, visibility}",
    );
  }
  const raw = asRecord(rawScope, "invalid_scope", "scope");

  if (!VALID_VISIBILITIES.includes(raw.visibility as Visibility)) {
    throw new ApiError(
      400,
      "invalid_scope",
      `scope.visibility must be one of ${VALID_VISIBILITIES.join(", ")}`,
    );
  }

  const scope: Scope = {
    teamId: optionalId(raw, "teamId"),
    clientId: optionalId(raw, "clientId"),
    userId: optionalId(raw, "userId"),
    visibility: raw.visibility as Visibility,
  };

  try {
    assertValidScope(scope); // the same invariants the store + DB enforce
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ApiError(400, "invalid_scope", message);
  }
  return scope;
}

/**
 * POST /v1/memory/ingest — chunk + embed + upsert one source's content through
 * the shared ingest pipeline (the same one the filesystem indexer uses).
 * Idempotent: re-sending identical content is a no-op (`skipped: true`).
 */
export async function handleIngestRequest(
  deps: MemoryApiDeps,
  rawBody: unknown,
): Promise<ApiResponse> {
  try {
    const body = asRecord(rawBody, "invalid_request", "request body");
    const scope = buildIngestScopeFromBody(body.scope);
    const sourcePath = requiredString(body, "sourcePath").trim();
    const content = requiredString(body, "content");

    let sourceType: SourceType = "other";
    if (body.sourceType != null) {
      if (!VALID_SOURCE_TYPES.includes(body.sourceType as SourceType)) {
        throw new ApiError(
          400,
          "invalid_request",
          `sourceType must be one of ${VALID_SOURCE_TYPES.join(", ")}`,
        );
      }
      sourceType = body.sourceType as SourceType;
    }

    let contentDate: string | null = null;
    if (body.contentDate != null) {
      if (typeof body.contentDate !== "string" || !DATE_RE.test(body.contentDate)) {
        throw new ApiError(400, "invalid_request", "contentDate must be YYYY-MM-DD");
      }
      contentDate = body.contentDate;
    }

    let authorityWeight: number | undefined;
    if (body.authorityWeight != null) {
      const w = Number(body.authorityWeight);
      if (!Number.isFinite(w) || w <= 0) {
        throw new ApiError(400, "invalid_request", "authorityWeight must be a positive number");
      }
      authorityWeight = w;
    }

    let reason: IndexJobReason = "manual";
    if (body.reason != null) {
      if (!VALID_REASONS.includes(body.reason as IndexJobReason)) {
        throw new ApiError(
          400,
          "invalid_request",
          `reason must be one of ${VALID_REASONS.join(", ")}`,
        );
      }
      reason = body.reason as IndexJobReason;
    }

    let title: string | null = null;
    if (body.title != null) {
      if (typeof body.title !== "string") {
        throw new ApiError(400, "invalid_request", "title must be a string or null");
      }
      title = body.title;
    }

    const result = await ingestContent({
      store: deps.store,
      embedder: deps.embedder,
      scope,
      sourcePath,
      sourceType,
      title,
      contentDate,
      authorityWeight,
      content,
      force: body.force === true,
      reason,
    });

    return {
      status: 200,
      body: {
        sourceId: result.sourceId,
        skipped: result.skipped,
        chunksInserted: result.chunksInserted,
        chunksPruned: result.chunksPruned,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error);
    throw error; // transport maps unexpected failures to 500
  }
}
