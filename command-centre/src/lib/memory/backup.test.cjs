/**
 * backup.test.cjs — a backup can be restored, and the memory comes back.
 *
 * It drives the REAL scripts (memory-backup.cjs / memory-restore.cjs) end to end,
 * the same way an operator runs `npm run memory:backup` / `memory:restore`:
 *   - PGLite (default suite): a file-based store survives a tar backup → wipe →
 *     restore round-trip.
 *   - Postgres (gated on TEST_DATABASE_URL + pg_dump/pg_restore on PATH): seed a
 *     corpus, back it up, DROP everything, restore, and prove the rows return —
 *     the disaster-recovery path.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const { loadTsModule } = require("../test-utils/load-ts-module.cjs");

const SCRIPTS = path.resolve(__dirname, "../../../scripts");
const BACKUP = path.join(SCRIPTS, "memory-backup.cjs");
const RESTORE = path.join(SCRIPTS, "memory-restore.cjs");

const EMBED_DIM = 8;
const TEST_URL = process.env.TEST_DATABASE_URL;

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aios-backup-"));
}
function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}
function run(args, env) {
  return spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}
function commandExists(cmd) {
  return !spawnSync(cmd, ["--version"], { stdio: "ignore" }).error;
}
function newestMatching(dir, predicate) {
  return fs
    .readdirSync(dir)
    .filter(predicate)
    .sort()
    .map((f) => path.join(dir, f))
    .pop();
}

// ---------------------------------------------------------------------------
// PGLite — runs in the default suite. No database, no external binaries beyond
// tar; proves the script's backup → wipe → restore mechanics preserve the store.
// ---------------------------------------------------------------------------
test("backup then restore round-trips the local PGLite store", { skip: commandExists("tar") ? false : "tar not found" }, () => {
  const root = tempDir();
  const dataDir = path.join(root, ".command-centre", "memory");
  const outDir = path.join(root, "backups", "memory");
  fs.mkdirSync(dataDir, { recursive: true });
  // A known marker standing in for the PGLite data files.
  fs.writeFileSync(path.join(dataDir, "probe.txt"), "memory-lives-here");

  const env = { AGENTIC_OS_DIR: root, MEMORY_DATABASE_URL: "", DATABASE_URL: "" };
  try {
    const b = run([BACKUP, "--out", outDir], env);
    assert.equal(b.status, 0, `backup failed:\n${b.stderr}`);
    const archive = newestMatching(outDir, (f) => f.startsWith("pglite_memory_") && f.endsWith(".tar.gz"));
    assert.ok(archive, "a pglite tar.gz backup was written");

    // Lose the store entirely, then restore from the archive.
    rmDir(dataDir);
    const r = run([RESTORE, archive, "--yes"], env);
    assert.equal(r.status, 0, `restore failed:\n${r.stderr}`);
    assert.equal(
      fs.readFileSync(path.join(dataDir, "probe.txt"), "utf8"),
      "memory-lives-here",
      "the store came back from the backup",
    );
  } finally {
    rmDir(root);
  }
});

test("restore refuses without --yes (dry run writes nothing)", { skip: commandExists("tar") ? false : "tar not found" }, () => {
  const root = tempDir();
  const dataDir = path.join(root, ".command-centre", "memory");
  const outDir = path.join(root, "backups", "memory");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "probe.txt"), "v1");
  const env = { AGENTIC_OS_DIR: root, MEMORY_DATABASE_URL: "", DATABASE_URL: "" };
  try {
    run([BACKUP, "--out", outDir], env);
    const archive = newestMatching(outDir, (f) => f.endsWith(".tar.gz"));
    fs.writeFileSync(path.join(dataDir, "probe.txt"), "v2-uncommitted");
    const dry = run([RESTORE, archive], env); // no --yes
    assert.equal(dry.status, 0);
    assert.match(dry.stdout, /DRY RUN/);
    assert.equal(
      fs.readFileSync(path.join(dataDir, "probe.txt"), "utf8"),
      "v2-uncommitted",
      "dry run left the live store untouched",
    );
  } finally {
    rmDir(root);
  }
});

// ---------------------------------------------------------------------------
// Hosted Postgres — the engine this backup/restore path actually protects.
// Gated on TEST_DATABASE_URL (a throwaway pgvector database) AND the client tools.
// ---------------------------------------------------------------------------
const pgSkip = !TEST_URL
  ? "set TEST_DATABASE_URL to run against a real Postgres"
  : !commandExists("pg_dump") || !commandExists("pg_restore")
    ? "pg_dump/pg_restore not on PATH"
    : false;

test("backup then restore brings the hosted corpus back (Postgres)", { skip: pgSkip }, async () => {
  // Build the same leaf-first module graph the other memory tests use.
  const types = { ALL_VISIBILITIES: ["private", "client", "team", "system"] };
  const embedding = loadTsModule(path.resolve(__dirname, "embedding.ts"));
  const scope = loadTsModule(path.resolve(__dirname, "scope.ts"), { stubs: { "./types": types } });
  const migrate = loadTsModule(path.resolve(__dirname, "migrate.ts"));
  const adapter = loadTsModule(path.resolve(__dirname, "pglite-adapter.ts"));
  const postgresAdapter = loadTsModule(path.resolve(__dirname, "postgres-adapter.ts"));
  const backend = loadTsModule(path.resolve(__dirname, "backend.ts"));
  const rowMappers = loadTsModule(path.resolve(__dirname, "row-mappers.ts"), {
    stubs: { "./types": types, "./embedding": embedding },
  });
  const store = loadTsModule(path.resolve(__dirname, "store.ts"), {
    stubs: {
      "./types": types, "./migrate": migrate, "./scope": scope, "./embedding": embedding,
      "./row-mappers": rowMappers, "./pglite-adapter": adapter,
      "./postgres-adapter": postgresAdapter, "./backend": backend,
    },
  });
  const embedder = loadTsModule(path.resolve(__dirname, "embedder.ts"));
  const chunker = loadTsModule(path.resolve(__dirname, "chunker.ts"));
  const ingest = loadTsModule(path.resolve(__dirname, "ingest.ts"), {
    stubs: { "./scope": scope, "./embedding": embedding, "./chunker": chunker },
  });
  const discovery = loadTsModule(path.resolve(__dirname, "discovery.ts"));
  const indexer = loadTsModule(path.resolve(__dirname, "indexer.ts"), {
    stubs: { "./scope": scope, "./ingest": ingest, "./discovery": discovery },
  });

  const sysScope = { teamId: null, clientId: null, userId: null, visibility: "system" };
  const corpus = tempDir();
  fs.writeFileSync(path.join(corpus, "note.md"), "# Note\n\nThe hosted backup restores the team memory.");
  const outDir = tempDir();

  async function chunkCount() {
    const s = await store.openMemoryStore({ backend: "postgres", connectionString: TEST_URL, embedDim: EMBED_DIM });
    try {
      const { rows } = await s.client.query("SELECT count(*)::int AS n FROM memory_chunks");
      return Number(rows[0].n);
    } finally {
      await s.close();
    }
  }
  async function dropEverything() {
    const raw = await postgresAdapter.openPostgres(TEST_URL);
    try {
      await raw.client.exec(
        "DROP TABLE IF EXISTS memory_chunks, memory_sources, index_jobs, " +
          "search_events, schema_migrations CASCADE; DROP EXTENSION IF EXISTS vector CASCADE;",
      );
    } finally {
      await raw.close();
    }
  }

  const env = { MEMORY_DATABASE_URL: TEST_URL };
  try {
    await dropEverything();

    // Seed a real corpus into the hosted DB.
    const s = await store.openMemoryStore({ backend: "postgres", connectionString: TEST_URL, embedDim: EMBED_DIM });
    try {
      await indexer.indexSources({
        store: s, embedder: new embedder.HashEmbedder({ dim: EMBED_DIM }),
        scope: sysScope, rootDir: corpus, reason: "backfill",
      });
    } finally {
      await s.close();
    }
    const before = await chunkCount();
    assert.ok(before > 0, "seeded chunks exist");

    // Back up via the real script.
    const b = run([BACKUP, "--out", outDir], env);
    assert.equal(b.status, 0, `backup failed:\n${b.stderr}`);
    const dump = newestMatching(outDir, (f) => f.endsWith(".dump"));
    assert.ok(dump, "a .dump backup was written");

    // Disaster: lose everything. Then restore from the dump.
    await dropEverything();
    const r = run([RESTORE, dump, "--yes"], env);
    assert.equal(r.status, 0, `restore failed:\n${r.stdout}\n${r.stderr}`);

    assert.equal(await chunkCount(), before, "the corpus came back after restore");
  } finally {
    await dropEverything().catch(() => {});
    rmDir(corpus);
    rmDir(outDir);
  }
});
