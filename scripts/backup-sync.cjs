#!/usr/bin/env node
// Tier 3 bulk sync — pushes media, renders and the transcript archive to Google Drive.
//
//   node scripts/backup-sync.cjs                 # copy everything due
//   node scripts/backup-sync.cjs --dry-run       # show what would move, touch nothing
//   node scripts/backup-sync.cjs --only transcripts
//   node scripts/backup-sync.cjs --prune         # ALSO trim local transcripts >RETAIN_DAYS
//
// Design decisions worth knowing:
//
// * `rclone copy`, never `sync`. sync mirrors deletions to the remote, which for a
//   BACKUP is the wrong default — a local accident would propagate. copy is additive,
//   so the remote is a superset of local. Cost is orphaned files remotely; that is
//   the correct trade for an archive.
//
// * Pruning is opt-in and verified. Local transcript day-folders older than
//   RETAIN_DAYS are only removed after `rclone check` confirms the remote copy
//   matches. Never delete on the strength of "the copy said ok".
//
// * State is written to cron/state/backup-sync.json, which backup-audit.cjs reads.
//   A sync that never runs must be VISIBLE, so the audit fails on a stale timestamp.

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const RCLONE = "C:/Claude/tools/rclone/rclone.exe";
const REMOTE = "gdrive";
const REMOTE_ROOT = "AgenticOS-Backup";
const STATE = path.join(REPO, "cron", "state", "backup-sync.json");
const RETAIN_DAYS = 60;

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const PRUNE = args.includes("--prune");
const ONLY = (() => { const i = args.indexOf("--only"); return i >= 0 ? args[i + 1] : null; })();

// Directories that hold Tier 3 content. Text/source inside them is already in Git;
// copying it twice is cheap and keeps each destination independently restorable.
const TARGETS = [
  { name: "transcripts", local: "context/transcripts", remote: "transcripts", prunable: true },
  { name: "projects",    local: "projects",            remote: "projects" },
  { name: "clients",     local: "clients",             remote: "clients" },
  { name: "brand",       local: "brand_context",       remote: "brand_context" },
  // Outside-repo assets (abs: true = absolute path, not repo-relative).
  // Added 2026-08-18 after the coverage review found them in no lane at all.
  { name: "photography",    local: "C:/photography",           remote: "assets/photography",    abs: true },
  { name: "laura-pictures", local: "C:/Claude/Laura Pictures", remote: "assets/laura-pictures", abs: true },
  { name: "obsidian",       local: "C:/Claude/Obsidian",       remote: "assets/obsidian",       abs: true },
  { name: "lessons",        local: "C:/Claude/Lessons",        remote: "assets/lessons",        abs: true },
];

const EXCLUDES = [
  "node_modules/**", ".next/**", ".git/**", "**/.command-centre/**",
  "**/.memsearch/**", "__pycache__/**", "**/.playwright-mcp/**", "**/.worktrees/**",
];

function rclone(rcArgs, { capture = false } = {}) {
  const full = [...rcArgs, ...EXCLUDES.flatMap((e) => ["--exclude", e]),
    "--transfers", "8", "--checkers", "16", "--drive-chunk-size", "64M",
    "--retries", "3", "--low-level-retries", "10"];
  if (DRY) full.push("--dry-run");
  const r = spawnSync(RCLONE, full, {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
    maxBuffer: 64 * 1024 * 1024,
  });
  return r;
}

function preflight() {
  if (!fs.existsSync(RCLONE)) {
    console.error(`rclone not found at ${RCLONE}`);
    process.exit(2);
  }
  const r = spawnSync(RCLONE, ["listremotes"], { encoding: "utf8" });
  const remotes = (r.stdout || "").split("\n").map((s) => s.trim().replace(/:$/, "")).filter(Boolean);
  if (!remotes.includes(REMOTE)) {
    console.error(`\nrclone remote "${REMOTE}" is not configured — nothing can sync.\n`);
    console.error(`Authorise it once (opens a browser):\n`);
    console.error(`  "${RCLONE}" config create ${REMOTE} drive scope=drive\n`);
    process.exit(2);
  }
}

function pruneTranscripts(localAbs, remotePath) {
  const cutoff = Date.now() - RETAIN_DAYS * 86400000;
  const removed = [];
  const kept = [];
  for (const entry of fs.readdirSync(localAbs)) {
    const m = entry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) continue;
    const day = Date.parse(`${entry}T00:00:00Z`);
    if (isNaN(day) || day >= cutoff) { kept.push(entry); continue; }

    // Verify the remote genuinely has it before removing anything local.
    const check = spawnSync(RCLONE, [
      "check", path.join(localAbs, entry), `${REMOTE}:${REMOTE_ROOT}/${remotePath}/${entry}`,
      "--one-way",
    ], { encoding: "utf8" });

    if (check.status !== 0) {
      console.log(`  prune SKIPPED ${entry} — remote copy did not verify`);
      kept.push(entry);
      continue;
    }
    if (DRY) { console.log(`  would prune ${entry}`); removed.push(entry); continue; }
    fs.rmSync(path.join(localAbs, entry), { recursive: true, force: true });
    console.log(`  pruned ${entry} (verified on remote)`);
    removed.push(entry);
  }
  return { removed: removed.length, kept: kept.length };
}

function main() {
  preflight();
  const started = new Date().toISOString();
  const results = [];
  let ok = true;

  for (const t of TARGETS) {
    if (ONLY && ONLY !== t.name) continue;
    const localAbs = t.abs ? t.local : path.join(REPO, t.local);
    if (!fs.existsSync(localAbs)) { results.push({ target: t.name, status: "absent" }); continue; }

    console.log(`\n── ${t.name}: ${t.local} → ${REMOTE}:${REMOTE_ROOT}/${t.remote}${DRY ? "  (dry run)" : ""}`);
    const r = rclone(["copy", localAbs, `${REMOTE}:${REMOTE_ROOT}/${t.remote}`, "--progress"]);
    const status = r.status === 0 ? "ok" : "failed";
    if (status !== "ok") ok = false;

    const entry = { target: t.name, status };
    if (t.prunable && PRUNE && status === "ok") {
      console.log(`  pruning local copies older than ${RETAIN_DAYS} days…`);
      entry.prune = pruneTranscripts(localAbs, t.remote);
    }
    results.push(entry);
  }

  const state = {
    startedAt: started,
    completedAt: new Date().toISOString(),
    result: ok ? "ok" : "failed",
    dryRun: DRY,
    pruned: PRUNE,
    remote: `${REMOTE}:${REMOTE_ROOT}`,
    targets: results,
  };

  if (!DRY) {
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  }

  console.log(`\n${ok ? "Sync complete" : "SYNC FAILED"} — ${results.map((r) => `${r.target}:${r.status}`).join(" ")}`);
  if (!DRY) console.log(`State: ${STATE}`);
  process.exit(ok ? 0 : 1);
}

main();
