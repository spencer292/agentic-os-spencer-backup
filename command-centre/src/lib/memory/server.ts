/**
 * Memory Schema — the hosted memory API server.
 *
 * A deliberately small node:http transport over the handlers in api.ts. No
 * framework, no new dependencies — this is the service that runs NEXT TO the
 * hosted Postgres (Railway/VPS) so consumers get a URL + token instead of raw
 * database credentials.
 *
 * Routes:
 *   GET  /v1/health          — liveness + backend/embedder info (no auth)
 *   POST /v1/memory/search   — scoped, reranked search (Bearer auth)
 *   POST /v1/memory/ingest   — scoped single-source ingest (Bearer auth)
 *
 * Auth is fail-closed: createMemoryApiServer REFUSES to build without a token —
 * a hosted deployment never quietly serves unauthenticated. Token comparison is
 * constant-time. Fine-grained per-user grants are a planned enhancement at
 * exactly this boundary.
 */

import http from "node:http";
import crypto from "node:crypto";

import {
  handleIngestRequest,
  handleSearchRequest,
  type ApiResponse,
  type MemoryApiDeps,
} from "./api";

export interface CreateMemoryApiServerOptions {
  deps: MemoryApiDeps;
  /** The Bearer token every /v1/memory/* request must present. REQUIRED. */
  token: string;
  /** Reported by /v1/health (resolved by the runner). */
  backendKind?: string;
  /** Max accepted request body size. Default 5 MB. */
  maxBodyBytes?: number;
  /** Error logger for unexpected (500) failures. Default console.error. */
  logError?: (msg: string) => void;
}

const DEFAULT_MAX_BODY_BYTES = 5 * 1024 * 1024;

/** Constant-time token check (hash both sides so length differences don't leak). */
function tokenMatches(provided: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function send(res: http.ServerResponse, response: ApiResponse): void {
  const payload = JSON.stringify(response.body);
  res.writeHead(response.status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function errorBody(status: number, code: string, message: string): ApiResponse {
  return { status, body: { error: { code, message } } };
}

/** Read the request body, enforcing the size cap. Resolves to the raw string. */
function readBody(
  req: http.IncomingMessage,
  maxBytes: number,
): Promise<{ ok: true; raw: string } | { ok: false; response: ApiResponse }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let done = false;

    req.on("data", (chunk: Buffer) => {
      if (done) return;
      received += chunk.length;
      if (received > maxBytes) {
        done = true;
        // Drain (don't destroy) the rest: killing the socket here would also
        // kill the response before the client can read the 413.
        chunks.length = 0;
        req.removeAllListeners("data");
        req.resume();
        resolve({
          ok: false,
          response: errorBody(
            413,
            "payload_too_large",
            `request body exceeds ${maxBytes} bytes`,
          ),
        });
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (done) return;
      done = true;
      resolve({ ok: true, raw: Buffer.concat(chunks).toString("utf-8") });
    });
    req.on("error", () => {
      if (done) return;
      done = true;
      resolve({
        ok: false,
        response: errorBody(400, "invalid_request", "failed to read request body"),
      });
    });
  });
}

/**
 * Build the HTTP server (without listening — callers own the lifecycle, tests
 * listen on port 0). Throws when no token is configured: fail closed.
 */
export function createMemoryApiServer(
  opts: CreateMemoryApiServerOptions,
): http.Server {
  if (!opts.token || opts.token.trim() === "") {
    throw new Error(
      "createMemoryApiServer: MEMORY_API_TOKEN is required — the hosted memory " +
        "API never serves unauthenticated. Set a strong token and pass it here.",
    );
  }
  const token = opts.token.trim();
  const maxBodyBytes = opts.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const logError = opts.logError ?? ((msg: string) => console.error(msg));

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const route = `${req.method} ${url.pathname}`;

      // Liveness — unauthenticated by design (Railway healthchecks).
      if (url.pathname === "/v1/health") {
        if (req.method !== "GET") {
          send(res, errorBody(405, "method_not_allowed", "use GET /v1/health"));
          return;
        }
        send(res, {
          status: 200,
          body: {
            ok: true,
            backend: opts.backendKind ?? "unknown",
            embedder: { model: opts.deps.embedder.model, dim: opts.deps.embedder.dim },
          },
        });
        return;
      }

      const isSearch = url.pathname === "/v1/memory/search";
      const isIngest = url.pathname === "/v1/memory/ingest";
      if (!isSearch && !isIngest) {
        send(res, errorBody(404, "not_found", `no route for ${route}`));
        return;
      }
      if (req.method !== "POST") {
        send(res, errorBody(405, "method_not_allowed", `use POST ${url.pathname}`));
        return;
      }

      // Bearer auth — before the body is even read.
      const header = req.headers.authorization ?? "";
      const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
      if (provided === "" || !tokenMatches(provided, token)) {
        send(res, errorBody(401, "unauthorized", "missing or invalid bearer token"));
        return;
      }

      const body = await readBody(req, maxBodyBytes);
      if (!body.ok) {
        send(res, body.response);
        return;
      }

      let parsed: unknown;
      try {
        parsed = body.raw === "" ? {} : JSON.parse(body.raw);
      } catch {
        send(res, errorBody(400, "invalid_request", "request body must be valid JSON"));
        return;
      }

      const response = isSearch
        ? await handleSearchRequest(opts.deps, parsed)
        : await handleIngestRequest(opts.deps, parsed);
      send(res, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError(`[memory-api] ${req.method} ${req.url} failed: ${message}`);
      if (!res.headersSent) {
        send(res, errorBody(500, "internal", "internal error"));
      } else {
        res.end();
      }
    }
  });
}
