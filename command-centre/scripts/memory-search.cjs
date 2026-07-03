#!/usr/bin/env node
/**
 * memory-search — the replacement for `memsearch search`.
 *
 * Embeds a query, runs a scope-filtered nearest-neighbour search over the local
 * PGLite + pgvector store, reranks the hits (authority + recency + floor-ratio),
 * and records a `search_events` audit row.
 *
 * Scope is the searcher's IDENTITY and is REQUIRED — like the indexer's
 * --visibility, the search refuses to run without an explicit scope. Use
 * --system for the local
 * baseline, or --team/--client/--user to search as that tenant; each identity
 * flag also includes the `system` baseline (system is visible to everyone). The
 * store's leak boundary keeps everyone else's rows out.
 *
 * Privacy: by default the audit row stores NEITHER the query text nor its
 * embedding. --store-query-text opts the text in; the embedding is never stored.
 *
 * Usage:
 *   node scripts/memory-search.cjs "how did we scope memory?" --system
 *   node scripts/memory-search.cjs "billing flow" --client acme --top-k 5
 *   node scripts/memory-search.cjs "release process" --system --json
 *   node scripts/memory-search.cjs "onboarding" --system --embedder local
 *
 * Flags:
 *   <query>                positional; the search text (required)
 *   --system               search the local system baseline
 *   --team <id>            search as this team (adds system + team)
 *   --client <slug>        search as this client (adds system + client)
 *   --user <id>            include this user's private rows (adds system + private)
 *   --include <list>       set visibility layers explicitly (system,team,client,private)
 *   --top-k <n>            number of results to return (default 10)
 *   --embedder <bge-m3|hash>  default: bge-m3 (or $MEMORY_EMBEDDER); hash is explicit offline mode
 *   --json                 emit the reranked results as JSON (machine output)
 *   --store-query-text     persist the query text on the audit row (off by default)
 *   --no-events            do not write a search_events audit row
 *   --help
 *
 * At least one scope flag (--system / --team / --client / --user / --include) is
 * required; without one the command errors.
 *
 * The .ts library is loaded the same way the indexer and tests load it — via
 * loadTsModule, leaf-first, injecting each module as a stub into its dependents.
 * There is no build step in this repo; this is the supported runtime path.
 */

const path = require("node:path");

const { loadTsModule } = require("../src/lib/test-utils/load-ts-module.cjs");
const { findWorkspaceRoot } = require("./workspace-root.cjs");

const MEM_DIR = path.resolve(__dirname, "../src/lib/memory");
const resolve = (file) => path.join(MEM_DIR, file);

// ── Load the memory module graph (leaf-first). ──────────────────────────────
const types = { ALL_VISIBILITIES: ["private", "client", "team", "system"] };
const embedding = loadTsModule(resolve("embedding.ts"));
const scope = loadTsModule(resolve("scope.ts"), { stubs: { "./types": types } });
const migrate = loadTsModule(resolve("migrate.ts"));
const adapter = loadTsModule(resolve("pglite-adapter.ts"));
const postgresAdapter = loadTsModule(resolve("postgres-adapter.ts"));
const backend = loadTsModule(resolve("backend.ts"));
const rowMappers = loadTsModule(resolve("row-mappers.ts"), {
  stubs: { "./types": types, "./embedding": embedding },
});
const store = loadTsModule(resolve("store.ts"), {
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
const embedder = loadTsModule(resolve("embedder.ts"));
const reranker = loadTsModule(resolve("reranker.ts"));
const search = loadTsModule(resolve("search.ts"), {
  stubs: { "./types": types, "./reranker": reranker, "./row-mappers": rowMappers },
});

// ── Flag parsing. ───────────────────────────────────────────────────────────
const VALID_VISIBILITIES = ["system", "team", "client", "private"];

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[(i += 1)];
    switch (arg) {
      case "--system": flags.system = true; break;
      case "--team": flags.team = next(); break;
      case "--client": flags.client = next(); break;
      case "--user": flags.user = next(); break;
      case "--include": flags.include = next(); break;
      case "--top-k": flags.topK = Number(next()); break;
      case "--embedder": flags.embedder = next(); break;
      case "--json": flags.json = true; break;
      case "--store-query-text": flags.storeQueryText = true; break;
      case "--no-events": flags.noEvents = true; break;
      case "--help": case "-h": flags.help = true; break;
      default:
        if (arg.startsWith("--")) throw new Error(`Unknown flag: ${arg}`);
        positional.push(arg);
    }
  }
  flags.query = positional.join(" ").trim();
  return flags;
}

const USAGE = `memory-search — scoped, reranked search over the PGLite memory store

Usage:
  node scripts/memory-search.cjs "<query>" <scope> [options]

Scope (at least one required):
  --system               search the local system baseline
  --team <id>            search as this team (adds system + team)
  --client <slug>        search as this client (adds system + client)
  --user <id>            include this user's private rows (adds system + private)
  --include <list>       set visibility layers explicitly (system,team,client,private)

Options:
  --top-k <n>            results to return (default 10)
  --embedder <bge-m3|hash>   default: bge-m3 (or $MEMORY_EMBEDDER); hash is explicit offline mode
  --json                 emit reranked results as JSON
  --store-query-text     persist the query text on the audit row (off by default)
  --no-events            skip the search_events audit row
  --help`;

/**
 * Build the SearchScope from the CLI flags. An explicit scope is REQUIRED: at
 * least one of --system / --team / --client / --user / --include. The identity
 * flags set teamId/clientId/userId; the searched visibility layers are taken
 * from --include when given, else derived from the identity flags with `system`
 * as the always-present baseline.
 */
function buildSearchScope(flags) {
  const hasIdentity =
    flags.system === true ||
    flags.team != null ||
    flags.client != null ||
    flags.user != null;
  const hasInclude = flags.include != null;

  if (!hasIdentity && !hasInclude) {
    throw new Error(
      "explicit search scope required: pass one of --system, --team <id>, " +
        "--client <slug>, --user <id>, or --include <layers>",
    );
  }

  const searchScope = {
    teamId: flags.team ?? null,
    clientId: flags.client ?? null,
    userId: flags.user ?? null,
  };

  if (hasInclude) {
    const parts = flags.include.split(",").map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (!VALID_VISIBILITIES.includes(p)) {
        throw new Error(
          `--include has invalid visibility "${p}" (allowed: ${VALID_VISIBILITIES.join(", ")})`,
        );
      }
    }
    searchScope.include = parts;
  } else {
    // Derive layers from the identity flags; system is the baseline everyone sees.
    const include = ["system"];
    if (flags.team != null) include.push("team");
    if (flags.client != null) include.push("client");
    if (flags.user != null) include.push("private");
    searchScope.include = include;
  }

  return searchScope;
}

function snippet(text, max = 160) {
  const collapsed = String(text).replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed;
}

function toJson(r) {
  return {
    chunk_id: r.id,
    source_id: r.sourceId,
    source: r.sourcePath,
    source_path: r.sourcePath,
    source_type: r.sourceType,
    content_date: r.contentDate,
    heading: r.heading,
    heading_level: r.headingLevel,
    start_line: r.startLine,
    end_line: r.endLine,
    content_hash: r.contentHash,
    chunk_key: r.chunkKey,
    content: r.content,
    score: Number((1 - r.distance).toFixed(6)),
    distance: r.distance,
    match_type: r.matchType,
    vector_rank: r.vectorRank,
    keyword_rank: r.keywordRank,
    keyword_score: r.keywordScore,
    fusion_score: r.fusionScore,
    final_score: r.finalScore,
    reranked: r.reranked,
  };
}

function printHuman(query, searchScope, res) {
  console.log(`memory-search → "${query}"`);
  console.log(
    `  scope: team=${searchScope.teamId ?? "-"} client=${searchScope.clientId ?? "-"} ` +
      `user=${searchScope.userId ?? "-"} layers=${res.visibilitySet.join("+") || "-"}`,
  );
  const eventNote = res.event ? `event ${res.event.id}` : "no event recorded";
  console.log(`  ${res.results.length} result(s) in ${res.latencyMs}ms (${eventNote})`);
  if (res.results.length === 0) {
    console.log("  (no matches in scope)");
    return;
  }
  res.results.forEach((r, i) => {
    console.log(
      `\n  ${i + 1}. [${r.finalScore.toFixed(4)}] ${r.sourcePath}  ` +
        `(${r.contentDate ?? "-"}, ${r.matchType ?? "vector"})`,
    );
    if (r.startLine != null && r.endLine != null) {
      console.log(`     lines ${r.startLine}-${r.endLine}`);
    }
    if (r.heading) console.log(`     # ${r.heading}`);
    console.log(`     ${snippet(r.content)}`);
  });
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(USAGE);
    return 0;
  }
  if (!flags.query) {
    console.error("memory-search: a query is required.\n");
    console.error(USAGE);
    return 1;
  }

  const rootDir = process.env.AGENTIC_OS_DIR
    ? path.resolve(process.env.AGENTIC_OS_DIR)
    : findWorkspaceRoot(__dirname);
  process.env.MEMORY_MODEL_CACHE_DIR =
    process.env.MEMORY_MODEL_CACHE_DIR || path.join(rootDir, ".command-centre", "models");

  let searchScope;
  try {
    searchScope = buildSearchScope(flags);
  } catch (error) {
    console.error(`memory-search: ${error instanceof Error ? error.message : error}\n`);
    console.error(USAGE);
    return 1;
  }

  const topK = Number.isFinite(flags.topK) && flags.topK > 0 ? Math.floor(flags.topK) : 10;

  // Diagnostics go to stderr in --json mode so stdout stays pure JSON.
  const info = flags.json ? (m) => console.error(m) : (m) => console.log(m);

  const emb = await embedder.createEmbedder({ kind: flags.embedder });
  info(`memory-search → ${rootDir}`);
  info(`  embedder: ${emb.model} (dim ${emb.dim})`);

  const cfg = reranker.loadRerankerConfig(rootDir);
  const dataDir = path.join(rootDir, ".command-centre", "memory");

  // Which engine will openMemoryStore pick? Resolve it here (same pure rule) so
  // we can decide how a store-open failure is reported. A failed resolution
  // (e.g. MEMORY_STORE_BACKEND=postgres with no URL) propagates as a hard error.
  const resolvedBackend = backend.resolveMemoryBackend({ dataDir }, process.env);
  info(`  backend: ${resolvedBackend.kind}`);

  // A store-open failure on the LOCAL engine is the "backend unavailable" signal:
  // tag it so the top-level handler surfaces exit 3. For the HOSTED engine this
  // stays a hard error (exit 1), preserving the no-silent-local-fallback rule.
  let memStore;
  try {
    memStore = await store.openMemoryStore({ dataDir, embedDim: emb.dim });
  } catch (error) {
    if (resolvedBackend.kind === "pglite") {
      error.code = "MEMORY_BACKEND_UNAVAILABLE";
    }
    throw error;
  }

  try {
    const res = await search.searchMemory({
      store: memStore,
      embedder: emb,
      query: flags.query,
      searchScope,
      topK,
      rerankConfig: cfg,
      recordEvent: flags.noEvents !== true,
      storeQueryText: flags.storeQueryText === true,
    });

    if (flags.json) {
      console.log(JSON.stringify(res.results.map(toJson), null, 2));
    } else {
      printHuman(flags.query, searchScope, res);
    }
    return 0;
  } finally {
    await memStore.close();
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
      `\nmemory-search failed: ${error instanceof Error ? error.message : error}`,
    );
    if (error && error.stack) console.error(error.stack);
    console.error(`\n${USAGE}`);
    // Store-open failure -> exit 3 ("backend unavailable"). All else stays exit 1.
    process.exitCode = error && error.code === "MEMORY_BACKEND_UNAVAILABLE" ? 3 : 1;
  });
