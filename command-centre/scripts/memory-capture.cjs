#!/usr/bin/env node
/**
 * memory-capture — Agentic-OS-owned session capture + memory refresh.
 *
 * The runtime replacement for the legacy memsearch Stop hook + background
 * indexing. Two modes:
 *
 *   --session   archive the raw transcript, summarize the transcript's last
 *               turn into context/memory/{date}.aos.md, then run a debounced
 *               incremental index of the memory sources (reason:
 *               session_capture). This is what the .claude/hooks/memory-capture.js
 *               Stop hook spawns.
 *   (default)   just run the debounced/forced incremental index (reason: refresh).
 *               This is what the nightly cron runs.
 *
 * No Memsearch: capture shells out to the configured summarizer, with a raw
 * fallback. Indexing uses the BGE-M3 embedder by default. Scope is explicit
 * (like memory-index), and defaults to --visibility system.
 *
 * Usage:
 *   node scripts/memory-capture.cjs --session --session-id <id> --transcript <path>
 *   node scripts/memory-capture.cjs --reason refresh --force
 *   node scripts/memory-capture.cjs --session --transcript <path> --client acme
 *
 * Flags:
 *   --session                capture the transcript's last turn before indexing
 *   --session-id <id>        session id for the capture block (default "session")
 *   --transcript <path>      transcript JSONL to capture from (required with --session)
 *   --visibility <system|team|client|private>   default system
 *   --team <id> / --client <slug> / --user <id> scope ids (per visibility)
 *   --reason <session_capture|refresh|...>       index_jobs tag (default by mode)
 *   --debounce <seconds>     skip indexing if it ran within N seconds (default 30)
 *   --embedder <bge-m3|hash>  default: bge-m3 (or $MEMORY_EMBEDDER); hash is explicit offline mode
 *   --force                  re-embed + bypass the debounce
 *   --help
 *
 * The .ts library is loaded via the shared loader (loadTsModule, leaf-first) —
 * there is no build step; this is the supported runtime path.
 */

const fs = require("node:fs");
const path = require("node:path");

const { findWorkspaceRoot } = require("./workspace-root.cjs");
const { loadMemoryModules } = require("./load-memory-modules.cjs");

const { scope, store, embedder, capture } = loadMemoryModules({ withCapture: true });

// ── Flag parsing. ───────────────────────────────────────────────────────────
function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[(i += 1)];
    switch (arg) {
      case "--session": flags.session = true; break;
      case "--session-id": flags.sessionId = next(); break;
      case "--transcript": flags.transcript = next(); break;
      case "--visibility": flags.visibility = next(); break;
      case "--team": flags.team = next(); break;
      case "--client": flags.client = next(); break;
      case "--user": flags.user = next(); break;
      case "--reason": flags.reason = next(); break;
      case "--debounce": flags.debounce = Number(next()); break;
      case "--embedder": flags.embedder = next(); break;
      case "--force": flags.force = true; break;
      case "--help": case "-h": flags.help = true; break;
      default:
        throw new Error(`Unknown flag: ${arg}`);
    }
  }
  return flags;
}

const USAGE = `memory-capture — AOS session capture + debounced memory refresh

Modes:
  --session     capture the transcript's last turn, then index (reason session_capture)
  (default)     debounced/forced incremental index only (reason refresh)

Options:
  --session-id <id>        session id for the capture block (default "session")
  --transcript <path>      transcript JSONL (required with --session)
  --visibility <system|team|client|private>   default system
  --team <id> / --client <slug> / --user <id>  scope ids (per visibility)
  --reason <...>           index_jobs tag (default by mode)
  --debounce <seconds>     skip indexing if it ran within N seconds (default 30)
  --embedder <bge-m3|hash>  default: bge-m3 (or $MEMORY_EMBEDDER); hash is explicit offline mode
  --force                  re-embed + bypass the debounce
  --help`;

function buildScope(flags) {
  const visibility = flags.visibility ?? "system";
  const valid = ["system", "team", "client", "private"];
  if (!valid.includes(visibility)) {
    throw new Error(`--visibility must be one of: ${valid.join(", ")}`);
  }
  const s = {
    teamId: flags.team ?? null,
    clientId: flags.client ?? null,
    userId: flags.user ?? null,
    visibility,
  };
  scope.assertValidScope(s); // throws if a required id is missing for the visibility
  return s;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(USAGE);
    return 0;
  }

  const rootDir = process.env.AGENTIC_OS_DIR
    ? path.resolve(process.env.AGENTIC_OS_DIR)
    : findWorkspaceRoot(__dirname);
  process.env.MEMORY_MODEL_CACHE_DIR =
    process.env.MEMORY_MODEL_CACHE_DIR || path.join(rootDir, ".command-centre", "models");
  const baseScope = buildScope(flags);
  const now = new Date();
  const debounceMs = Number.isFinite(flags.debounce) ? Math.max(0, flags.debounce) * 1000 : undefined;
  const reason = flags.reason ?? (flags.session ? "session_capture" : "refresh");

  // 1. Archive the raw transcript, summarize the last turn, and append it.
  if (flags.session) {
    const turn = flags.transcript ? capture.extractLastTurn(flags.transcript) : null;
    if (turn) {
      const res = await capture.captureSessionTurn({
        rootDir,
        sessionId: flags.sessionId ?? "session",
        turn,
        transcriptPath: flags.transcript,
        now,
      });
      console.log(
        res.written
          ? `memory-capture: captured ${res.summarySource} session ${flags.sessionId ?? "session"} → ${res.filePath}`
          : `memory-capture: session ${flags.sessionId ?? "session"} already captured (no change)`,
      );
    } else {
      // Headless / missing / corrupt transcript: nothing to capture, but the
      // index refresh below still runs. Never crash the Stop chain.
      console.log("memory-capture: no capturable turn in transcript — refreshing index only");
    }
  }

  // 2. Debounced incremental index of the memory sources.
  const emb = await embedder.createEmbedder({ kind: flags.embedder });
  const dataDir = path.join(rootDir, ".command-centre", "memory");
  fs.mkdirSync(dataDir, { recursive: true }); // PGLite's own mkdir is not recursive
  const memStore = await store.openMemoryStore({ dataDir, embedDim: emb.dim });

  try {
    const { summary, skipped } = await capture.refreshIndex({
      store: memStore,
      embedder: emb,
      scope: baseScope,
      rootDir,
      reason,
      force: flags.force === true,
      debounceMs,
      now,
    });

    if (skipped) {
      console.log(`memory-capture: index ${skipped} (reason ${reason})`);
      return 0;
    }
    console.log(
      `memory-capture: indexed ${summary.sourcesIndexed} / skipped ${summary.sourcesSkipped} / ` +
        `+${summary.chunksInserted} chunks / errors ${summary.errors.length} (reason ${reason})`,
    );
    for (const err of summary.errors) console.log(`  ! ${err.sourcePath}: ${err.message}`);
    return summary.errors.length > 0 ? 1 : 0;
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
    console.error(`\nmemory-capture failed: ${error instanceof Error ? error.message : error}`);
    if (error && error.stack) console.error(error.stack);
    console.error(`\n${USAGE}`);
    process.exitCode = 1;
  });
