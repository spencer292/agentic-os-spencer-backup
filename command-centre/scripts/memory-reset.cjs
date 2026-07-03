#!/usr/bin/env node
/**
 * memory-reset — drop only Agentic OS memory tables so they can be rebuilt.
 *
 * This is used by setup/update when an older vector dimension prevents the
 * schema from opening. It does not touch unrelated application tables.
 */

const path = require("node:path");

const { findWorkspaceRoot } = require("./workspace-root.cjs");
const { loadMemoryModules } = require("./load-memory-modules.cjs");

const { backend, adapter, postgresAdapter } = loadMemoryModules({ withCapture: false });

const DROP_MEMORY_SCHEMA_SQL = `
DROP TABLE IF EXISTS search_events CASCADE;
DROP TABLE IF EXISTS index_jobs CASCADE;
DROP TABLE IF EXISTS memory_chunks CASCADE;
DROP TABLE IF EXISTS memory_sources CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
`;

function parseArgs(argv) {
  const flags = {};
  for (const arg of argv) {
    if (arg === "--yes" || arg === "-y") flags.yes = true;
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else throw new Error(`Unknown flag: ${arg}`);
  }
  return flags;
}

const USAGE = `memory-reset — drop Agentic OS memory tables only

Usage:
  node scripts/memory-reset.cjs --yes`;

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(USAGE);
    return 0;
  }
  if (!flags.yes) {
    console.error("memory-reset: pass --yes to confirm dropping memory tables.");
    return 2;
  }

  const rootDir = process.env.AGENTIC_OS_DIR
    ? path.resolve(process.env.AGENTIC_OS_DIR)
    : findWorkspaceRoot(__dirname);
  const dataDir = path.join(rootDir, ".command-centre", "memory");
  const resolved = backend.resolveMemoryBackend({ dataDir }, process.env);

  if (resolved.kind === "postgres") {
    const pg = await postgresAdapter.openPostgres(resolved.connectionString);
    try {
      await pg.client.exec(DROP_MEMORY_SCHEMA_SQL);
    } finally {
      await pg.close();
    }
    console.log("memory-reset: dropped hosted Postgres memory tables");
    return 0;
  }

  const pg = await adapter.openPGlite(resolved.dataDir, { recreateCorruptDir: true });
  try {
    await pg.client.exec(DROP_MEMORY_SCHEMA_SQL);
  } finally {
    await pg.close();
  }
  console.log("memory-reset: dropped local PGLite memory tables");
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`\nmemory-reset failed: ${error instanceof Error ? error.message : error}`);
    if (error && error.stack) console.error(error.stack);
    console.error(`\n${USAGE}`);
    process.exit(1);
  });
