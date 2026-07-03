/**
 * bootstrap.test.cjs — first-run auto-index of the LOCAL store.
 *
 * Drives the real memory-bootstrap.cjs the way the SessionStart hook does, and
 * proves the three decisions that make it safe to fire on every session start:
 *   - empty local store → indexes from disk, writes the run-once sentinel;
 *   - sentinel present → skips without re-indexing;
 *   - hosted backend → does nothing (the shared corpus is seeded deliberately
 *     via memory:reindex, never auto-pushed per user).
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT = path.resolve(__dirname, "../../../scripts/memory-bootstrap.cjs");

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aios-bootstrap-"));
  fs.mkdirSync(path.join(root, "context", "memory"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "context", "memory", "2026-06-10.md"),
    "# Daily\n\nThe memory store works.\n\n## Notes\n\nRelease process detail here.\n",
  );
  fs.writeFileSync(path.join(root, "context", "learnings.md"), "# Learnings\n\nSomething learned.\n");
  return root;
}
function run(root, env) {
  return spawnSync(process.execPath, [SCRIPT, "--verbose"], {
    encoding: "utf8",
    env: { ...process.env, AGENTIC_OS_DIR: root, ...env },
  });
}
const sentinelPath = (root) => path.join(root, ".command-centre", "memory", ".bootstrap-done");
const localEnv = { MEMORY_DATABASE_URL: "", DATABASE_URL: "" };

test("bootstrap indexes an empty local store, then is idempotent", () => {
  const root = tempRoot();
  try {
    const r1 = run(root, localEnv);
    assert.equal(r1.status, 0, r1.stderr);
    assert.match(r1.stdout, /indexed \d+ source/);
    assert.ok(fs.existsSync(sentinelPath(root)), "sentinel written");
    assert.match(fs.readFileSync(sentinelPath(root), "utf8"), /chunk/);

    const r2 = run(root, localEnv);
    assert.equal(r2.status, 0);
    assert.match(r2.stdout, /already bootstrapped/, "second run short-circuits on the sentinel");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("bootstrap skips the hosted backend (local-only guard)", () => {
  const root = tempRoot();
  try {
    const r = run(root, { MEMORY_DATABASE_URL: "postgres://u:p@db.example.com:5432/agentic_memory" });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /backend is postgres/);
    assert.ok(!fs.existsSync(sentinelPath(root)), "no sentinel — hosted is seeded deliberately, not here");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
