#!/usr/bin/env node
/**
 * memory-recall - primary recall entry point.
 *
 * Recall now uses the scoped PGLite/pgvector memory store only. The legacy
 * MemSearch rollback was removed because it was not scope-isolated. If an old
 * environment still sets MEMORY_BACKEND=memsearch, this script exits with a
 * migration warning instead of querying the old backend.
 */

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const VALID_BACKENDS = ["pglite"];

// Flags that consume the following token as their value. We must know these so a
// value like `acme` in `--client acme` is not mistaken for the positional query.
const VALUE_FLAGS = ["--team", "--client", "--user", "--include", "--embedder", "--top-k"];

const USAGE = `memory-recall - primary recall (PGLite/pgvector backend)

Usage:
  node scripts/memory-recall.cjs "<query>" <scope> [options]            # rung: search (default)
  node scripts/memory-recall.cjs --expand <chunk-id> <scope> [options]      # rung: expand
  node scripts/memory-recall.cjs --transcript <chunk-id> <scope> [options]  # rung: transcript

The recall ladder: search for a chunk_id, expand it for surrounding source
context if the hit is too small, or drill into its transcript window if exact
wording is needed. Use the same scope flags across all three rungs.

Scope (forwarded to the rung's script; at least one required):
  --system               search the local system baseline
  --team <id>            search as this team (adds system + team)
  --client <slug>        search as this client (adds system + client)
  --user <id>            include this user's private rows (adds system + private)
  --include <list>       set visibility layers explicitly (system,team,client,private)

Rung selection (mutually exclusive; default is search):
  --expand <chunk-id>    expand this chunk to its surrounding source context
  --transcript <chunk-id>   drill into this chunk's original transcript window

Options:
  --top-k <n>            results to return (search rung; default 10)
  --embedder <bge-m3|hash>   default: bge-m3 (or $MEMORY_EMBEDDER); hash is explicit offline mode
  --json                 emit results as JSON (machine output)
  --store-query-text     persist the query text on the audit row (off by default)
  --no-events            skip the search_events audit row
  --backend <pglite>     compatibility option; memsearch is no longer supported
  --help

Run scripts/setup-memory.sh to migrate old .memsearch data into the new store.`;

/**
 * Split argv into the chosen backend/rung and passthrough argv handed
 * verbatim to the rung's script. `--backend`, `--expand`, and `--transcript`
 * are consumed here and not forwarded.
 */
function parseArgs(argv) {
  const passthrough = [];
  const positional = [];
  let backend;
  let topK;
  let json = false;
  let help = false;
  let expandChunkId;
  let transcriptChunkId;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--backend") {
      backend = argv[(i += 1)];
      continue;
    }
    if (arg === "--expand") {
      expandChunkId = argv[(i += 1)];
      continue;
    }
    if (arg === "--transcript") {
      transcriptChunkId = argv[(i += 1)];
      continue;
    }
    if (arg === "--top-k") {
      topK = Number(argv[i + 1]);
      passthrough.push(arg, argv[(i += 1)]);
      continue;
    }
    if (arg === "--json") {
      json = true;
      passthrough.push(arg);
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (VALUE_FLAGS.includes(arg)) {
      passthrough.push(arg, argv[(i += 1)]);
      continue;
    }
    if (arg.startsWith("--")) {
      passthrough.push(arg); // bare flags + unknowns: let the rung's script judge
      continue;
    }
    positional.push(arg);
    passthrough.push(arg);
  }

  const bothGiven = expandChunkId !== undefined && transcriptChunkId !== undefined;
  const rung = expandChunkId !== undefined ? "expand" : transcriptChunkId !== undefined ? "transcript" : "search";
  const rungChunkId = expandChunkId ?? transcriptChunkId;

  return {
    backend,
    topK,
    json,
    help,
    rung,
    rungChunkId,
    bothGiven,
    query: positional.join(" ").trim(),
    passthrough,
  };
}

/**
 * The dispatch decision, factored out and dependency-injected so it can be unit
 * tested without spawning real processes. `runPrimary(passthrough)` returns
 * `{ code, stdout, stderr }`.
 */
function decideAndRun({ flags, env, runPrimary, out, err }) {
  const write = out ?? ((s) => process.stdout.write(s));
  const warn = err ?? ((s) => process.stderr.write(s.endsWith("\n") ? s : `${s}\n`));

  if (flags.bothGiven) {
    warn("memory-recall: --expand and --transcript are mutually exclusive.");
    return 1;
  }

  const backend = (flags.backend ?? env.MEMORY_BACKEND ?? "pglite").toLowerCase();
  if (backend === "memsearch") {
    warn(
      "memory-recall: the legacy memsearch backend has been removed. " +
        "Run scripts/setup-memory.sh to migrate old .memsearch data into PGLite/Postgres.",
    );
    return 2;
  }
  if (!VALID_BACKENDS.includes(backend)) {
    warn(
      `memory-recall: --backend / MEMORY_BACKEND must be ${VALID_BACKENDS.join(", ")} ` +
        `(got "${backend}")`,
    );
    return 1;
  }

  const rung = flags.rung ?? "search";
  const args = rung === "search" ? flags.passthrough : [flags.rungChunkId, ...flags.passthrough];

  const primary = runPrimary(args, rung);
  if (primary.code === 0) {
    write(primary.stdout ?? "");
    return 0;
  }

  if (primary.stderr) warn(primary.stderr.trimEnd());
  if (primary.code === 3) {
    warn("memory-recall: memory store unavailable. Run scripts/setup-memory.sh to set it up.");
  }
  return primary.code;
}

/** Spawn the rung's CLI and capture its result. */
function runPrimary(args, rung, { searchScript, expandScript, transcriptScript }) {
  const script = rung === "expand" ? expandScript : rung === "transcript" ? transcriptScript : searchScript;
  const res = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  if (res.error) {
    return {
      code: 1,
      stdout: "",
      stderr: `memory-recall: failed to run ${path.basename(script)}: ${res.error.message}\n`,
    };
  }
  return { code: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  const scripts = {
    searchScript: path.join(__dirname, "memory-search.cjs"),
    expandScript: path.join(__dirname, "memory-expand.cjs"),
    transcriptScript: path.join(__dirname, "memory-transcript.cjs"),
  };

  return decideAndRun({
    flags,
    env: process.env,
    runPrimary: (args, rung) => runPrimary(args, rung, scripts),
  });
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { parseArgs, decideAndRun, runPrimary };
