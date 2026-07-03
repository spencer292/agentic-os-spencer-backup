#!/usr/bin/env node
/**
 * memory-restore — restore the memory store from a backup file.
 *
 * The inverse of memory-backup. It picks what to do from the file extension and
 * cross-checks the resolved backend so a restore never silently targets the
 * wrong place:
 *   - <name>.dump      → pg_restore into the database at MEMORY_DATABASE_URL.
 *   - <name>.tar.gz    → extract into the local PGLite data dir.
 *
 * Restore is DESTRUCTIVE (it replaces the team's source of truth / local store),
 * so it requires an explicit --yes. With no --yes it prints exactly what it would
 * run and exits, following the "no silent unsafe source of truth" rule.
 *
 * The Postgres target must run a `pgvector/pgvector` image — the dump references
 * the `vector` extension. For a bad-migration recovery, use --clean to drop and
 * recreate objects in place; for a freshly provisioned empty database, omit it.
 *
 * Usage:
 *   MEMORY_DATABASE_URL=postgres://... npm run memory:restore -- backups/memory/agentic_memory_<ts>.dump --yes
 *   MEMORY_DATABASE_URL=postgres://... npm run memory:restore -- <file>.dump --clean --yes   # replace in place
 *   npm run memory:restore -- backups/memory/pglite_memory_<ts>.tar.gz --yes                 # local PGLite
 *
 * Flags:
 *   --clean   pg_restore --clean --if-exists (drop+recreate objects before restoring)
 *   --yes     confirm the destructive restore (required to actually run)
 *   --help
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { loadTsModule } = require("../src/lib/test-utils/load-ts-module.cjs");
const { findWorkspaceRoot } = require("./workspace-root.cjs");

const MEM_DIR = path.resolve(__dirname, "../src/lib/memory");
const backend = loadTsModule(path.join(MEM_DIR, "backend.ts"));

const USAGE = `memory-restore — restore the memory store from a backup file

Usage:
  npm run memory:restore -- <file> [--clean] --yes

Picks the strategy from the file:
  *.dump     → pg_restore into MEMORY_DATABASE_URL (must be a pgvector database)
  *.tar.gz   → extract into the local PGLite data dir

Flags:
  --clean   for *.dump: pg_restore --clean --if-exists (drop+recreate in place)
  --yes     confirm the destructive restore (required to actually run)
  --help`;

function parseArgs(argv) {
  const flags = { positionals: [] };
  for (const arg of argv) {
    if (arg === "--clean") flags.clean = true;
    else if (arg === "--yes") flags.yes = true;
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown flag: ${arg}`);
    else flags.positionals.push(arg);
  }
  return flags;
}

function redact(connectionString) {
  try {
    const url = new URL(connectionString);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return "(connection string)";
  }
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

function commandExists(cmd) {
  const r = spawnSync(cmd, ["--version"], { stdio: "ignore" });
  return !r.error && r.status === 0;
}

async function restorePostgres(file, flags) {
  const resolved = backend.resolveMemoryBackend({}, process.env);
  if (resolved.kind !== "postgres") {
    console.error(
      "\nmemory-restore: this is a Postgres dump (.dump), but no hosted database is\n" +
        "  configured. Set MEMORY_DATABASE_URL (or DATABASE_URL) to the target\n" +
        "  pgvector database and retry. Refusing to guess a target.",
    );
    return 2;
  }
  if (!commandExists("pg_restore")) {
    console.error(
      "\nmemory-restore: `pg_restore` not found. Install the Postgres client tools\n" +
        "  (e.g. the `postgresql-client` package, or `brew install libpq`) and retry.",
    );
    return 2;
  }

  const args = ["--no-owner", "--no-privileges", `--dbname=${resolved.connectionString}`];
  if (flags.clean) args.push("--clean", "--if-exists");
  args.push(file);

  console.log("memory-restore (postgres)");
  console.log(`  file: ${file}`);
  console.log(`  target: ${redact(resolved.connectionString)}`);
  console.log(`  mode: ${flags.clean ? "--clean --if-exists (replace in place)" : "into existing/empty database"}`);

  if (!flags.yes) {
    console.log(
      "\nDRY RUN — re-run with --yes to apply. This will run:\n" +
        `  pg_restore ${flags.clean ? "--clean --if-exists " : ""}--no-owner --no-privileges \\\n` +
        `    --dbname='${redact(resolved.connectionString)}' ${path.basename(file)}\n\n` +
        "  The target database is overwritten. Make sure it runs a pgvector image\n" +
        "  and that you have a current backup of its present state.",
    );
    return 0;
  }

  const r = spawnSync("pg_restore", args, {
    stdio: ["ignore", "inherit", "inherit"],
    env: process.env,
  });
  // pg_restore exits non-zero on benign "already exists" warnings without --clean;
  // surface the code but treat >0 as a real failure the operator should read.
  if (r.status !== 0) {
    console.error(
      `\nmemory-restore: pg_restore exited with code ${r.status ?? "(signal)"}.\n` +
        "  If restoring into a NON-empty database, re-run with --clean to replace in place.",
    );
    return 1;
  }
  console.log("\n── restore complete ────────────────────");
  console.log("  Verify: npm run memory:migrate -- --check   (schema_migrations)");
  console.log("          npm run memory:search -- \"<query>\" --system");
  return 0;
}

async function restorePglite(file, flags) {
  if (!commandExists("tar")) {
    console.error("\nmemory-restore: `tar` not found on PATH.");
    return 2;
  }
  const rootDir = process.env.AGENTIC_OS_DIR
    ? path.resolve(process.env.AGENTIC_OS_DIR)
    : findWorkspaceRoot(__dirname);
  const dataDir = path.join(rootDir, ".command-centre", "memory");
  const parent = path.dirname(dataDir);

  console.log("memory-restore (pglite)");
  console.log(`  file: ${file}`);
  console.log(`  target: ${dataDir}`);

  if (!flags.yes) {
    console.log(
      "\nDRY RUN — re-run with --yes to apply. This will:\n" +
        (fs.existsSync(dataDir)
          ? `  1. move the current store aside to ${dataDir}.bak-<ts>\n`
          : "") +
        `  2. extract ${path.basename(file)} into ${parent}`,
    );
    return 0;
  }

  // Move the current store aside (reversible) rather than deleting it outright.
  if (fs.existsSync(dataDir)) {
    const aside = `${dataDir}.bak-${timestamp()}`;
    fs.renameSync(dataDir, aside);
    console.log(`  moved current store → ${aside}`);
  }
  fs.mkdirSync(parent, { recursive: true });
  const r = spawnSync("tar", ["-xzf", file, "-C", parent], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (r.status !== 0) {
    console.error(`\nmemory-restore: tar exited with code ${r.status ?? "(signal)"}.`);
    return 1;
  }
  console.log("\n── restore complete ────────────────────");
  console.log("  Verify: npm run memory:status");
  return 0;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(USAGE);
    return 0;
  }
  const file = flags.positionals[0];
  if (!file) {
    console.error("memory-restore: missing backup file.\n");
    console.error(USAGE);
    return 2;
  }
  if (!fs.existsSync(file)) {
    console.error(`memory-restore: file not found: ${file}`);
    return 2;
  }

  if (file.endsWith(".tar.gz") || file.endsWith(".tgz")) {
    return restorePglite(file, flags);
  }
  if (file.endsWith(".dump")) {
    return restorePostgres(file, flags);
  }
  console.error(
    `memory-restore: unrecognized backup file "${path.basename(file)}".\n` +
      "  Expected a .dump (Postgres) or .tar.gz (PGLite) produced by memory:backup.",
  );
  return 2;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`\nmemory-restore failed: ${error instanceof Error ? error.message : error}`);
    if (error && error.stack) console.error(error.stack);
    console.error(`\n${USAGE}`);
    process.exit(1);
  });
