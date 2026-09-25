#!/usr/bin/env node
// Backup coverage audit — proves every byte is in a known tier, or reports drift.
//
// The failure mode this exists to catch is SILENT absence of backup: a repo with
// no remote, a sync that stopped running, media creeping back into Git. Loss is
// rare; not knowing you were unprotected is the actual risk.
//
//   node scripts/backup-audit.cjs           # human-readable report
//   node scripts/backup-audit.cjs --json    # machine output (for cron)
//   node scripts/backup-audit.cjs --quiet   # only print on drift (cron default)
//
// Exit codes: 0 = no drift · 1 = drift found · 2 = audit itself failed.
//
// Tiers (see projects/briefs/repo-storage-architecture/brief.md):
//   1 Git      — text, code, config, memory, brand kit
//   2 Vault    — every secret, 1Password
//   3 Bulk     — media/renders, Google Drive via rclone
//   0 Disposable — rebuildable, deliberately unbacked

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const QUIET = args.includes("--quiet");

const RCLONE = "C:/Claude/tools/rclone/rclone.exe";
const RCLONE_REMOTE = "gdrive";
const SYNC_STATE = path.join(REPO, "cron", "state", "backup-sync.json");
const BIG_TRACKED_MB = 5; // a tracked file above this is media creeping back in

const findings = [];
const stats = {};
const drift = (severity, area, message, fix) =>
  findings.push({ severity, area, message, fix });

function sh(cmd, cmdArgs, cwd = REPO) {
  return execFileSync(cmd, cmdArgs, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function trySh(cmd, cmdArgs, cwd = REPO) {
  try {
    return sh(cmd, cmdArgs, cwd);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- Tier 1: Git
function auditGitRepos() {
  const repos = [{ path: REPO, label: "root" }];

  // nested repos (a .git directory that is not the root's)
  const nested = trySh("git", ["ls-files", "--others", "--exclude-standard", "--directory"]) || "";
  const candidates = new Set();
  for (const line of nested.split("\n")) {
    const p = path.join(REPO, line.trim());
    if (line.trim() && fs.existsSync(path.join(p, ".git"))) candidates.add(p);
  }
  // also walk known project/client dirs shallowly — untracked-dir listing misses ignored ones
  for (const base of ["projects/briefs", "clients"]) {
    const dir = path.join(REPO, base);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const p = path.join(dir, entry);
      if (fs.existsSync(path.join(p, ".git"))) candidates.add(p);
      // one level deeper (clients/x/projects/briefs/y/app)
      const deep = path.join(p, "projects", "briefs");
      if (fs.existsSync(deep)) {
        for (const e2 of fs.readdirSync(deep)) {
          const p2 = path.join(deep, e2);
          if (fs.existsSync(path.join(p2, ".git"))) candidates.add(p2);
          const app = path.join(p2, "app");
          if (fs.existsSync(path.join(app, ".git"))) candidates.add(app);
        }
      }
    }
  }
  // A .git directory can exist but be empty (leftover artifact) — in that case git
  // walks UP and reports the parent repo, which silently double-counts the root.
  // Only accept a candidate whose own toplevel is itself.
  for (const p of candidates) {
    const top = trySh("git", ["rev-parse", "--show-toplevel"], p);
    if (!top) continue;
    if (path.resolve(top) !== path.resolve(p)) continue;
    repos.push({ path: p, label: path.relative(REPO, p) });
  }

  stats.repos = [];
  for (const r of repos) {
    const remotes = (trySh("git", ["remote"], r.path) || "").split("\n").filter(Boolean);
    const branch = trySh("git", ["rev-parse", "--abbrev-ref", "HEAD"], r.path);
    const commits = trySh("git", ["rev-list", "--count", "HEAD"], r.path);
    const dirty = (trySh("git", ["status", "--porcelain"], r.path) || "").split("\n").filter(Boolean).length;

    let unpushed = null;
    if (remotes.length) {
      const up = trySh("git", ["rev-list", "--count", "@{u}..HEAD"], r.path);
      unpushed = up === null ? "no-upstream" : Number(up);
    }

    stats.repos.push({ repo: r.label, remotes: remotes.length, branch, commits: Number(commits || 0), dirty, unpushed });

    if (!remotes.length) {
      drift("CRITICAL", "tier1", `${r.label}: git repo with ${commits} commits and NO REMOTE — exists only on this disk`,
        `cd "${r.path}" && gh repo create <name> --private && git remote add origin <url> && git push -u origin HEAD`);
    } else if (unpushed === "no-upstream") {
      drift("HIGH", "tier1", `${r.label}: branch ${branch} has no upstream — pushes go nowhere`,
        `cd "${r.path}" && git push -u origin ${branch}`);
    } else if (unpushed > 0) {
      drift("HIGH", "tier1", `${r.label}: ${unpushed} commit(s) not pushed`, `cd "${r.path}" && git push`);
    }
    if (dirty > 0) {
      drift("LOW", "tier1", `${r.label}: ${dirty} uncommitted change(s)`, `cd "${r.path}" && git status`);
    }
  }
}

// -------------------------------------------- Tier 1 hygiene: media in Git
function auditTrackedSizes() {
  const files = (trySh("git", ["ls-files"]) || "").split("\n").filter(Boolean);
  let total = 0;
  const big = [];
  for (const f of files) {
    const abs = path.join(REPO, f);
    let st;
    try { st = fs.statSync(abs); } catch { continue; }
    total += st.size;
    if (st.size > BIG_TRACKED_MB * 1024 * 1024) big.push({ file: f, mb: +(st.size / 1048576).toFixed(1) });
  }
  stats.tracked = { files: files.length, mb: +(total / 1048576).toFixed(1) };
  stats.oversized = big.sort((a, b) => b.mb - a.mb).slice(0, 10);

  if (big.length) {
    drift("MEDIUM", "tier1", `${big.length} tracked file(s) over ${BIG_TRACKED_MB} MB — bulk belongs in Tier 3`,
      `Largest: ${big[0].file} (${big[0].mb} MB). Move to Drive and git rm --cached.`);
  }
}

// ------------------------------------------------------------- Tier 2: Vault
function auditVault() {
  const examplePath = path.join(REPO, ".env.example");
  let keys = [];
  if (fs.existsSync(examplePath)) {
    keys = fs.readFileSync(examplePath, "utf8")
      .split("\n")
      .map((l) => (l.match(/^([A-Z][A-Z0-9_]+)=/) || [])[1])
      .filter(Boolean);
  }
  stats.vault = { documentedKeys: keys.length, opInstalled: false, verified: false };

  const opVersion = trySh("op", ["--version"]);
  if (!opVersion) {
    drift("HIGH", "tier2", `1Password CLI not installed — ${keys.length} documented secrets cannot be verified against the vault`,
      "Install the op CLI, then .env becomes a generated rendering of the vault instead of a hand-copied file.");
    return;
  }
  stats.vault.opInstalled = true;
  stats.vault.opVersion = opVersion;

  // Never reads secret VALUES — only item titles, to confirm each key has a home.
  const items = trySh("op", ["item", "list", "--format=json"]);
  if (!items) {
    drift("MEDIUM", "tier2", "op CLI installed but not signed in — vault coverage unverified", "op signin");
    return;
  }
  let titles = [];
  try { titles = JSON.parse(items).map((i) => (i.title || "").toUpperCase()); } catch { /* ignore */ }
  const missing = keys.filter((k) => !titles.some((t) => t.includes(k) || k.includes(t.replace(/\s+/g, "_"))));
  stats.vault.verified = true;
  stats.vault.missing = missing;
  if (missing.length) {
    drift("HIGH", "tier2", `${missing.length} of ${keys.length} documented secrets have no vault item`,
      `Missing: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? " …" : ""}`);
  }
}

// -------------------------------------------------------------- Tier 3: Bulk
function auditBulk() {
  stats.bulk = { rclone: false, remote: RCLONE_REMOTE, lastSync: null };

  if (!fs.existsSync(RCLONE)) {
    drift("HIGH", "tier3", "rclone not found — bulk media has no off-machine copy", `Expected at ${RCLONE}`);
    return;
  }
  stats.bulk.rclone = true;

  const remotes = (trySh(RCLONE, ["listremotes"]) || "").split("\n").map((s) => s.trim().replace(/:$/, "")).filter(Boolean);
  stats.bulk.remotes = remotes;
  if (!remotes.includes(RCLONE_REMOTE)) {
    drift("CRITICAL", "tier3", `rclone remote "${RCLONE_REMOTE}" not configured — nothing is syncing to Drive`,
      `Run: "${RCLONE}" config create ${RCLONE_REMOTE} drive scope=drive   (opens a browser to authorise)`);
    return;
  }

  if (!fs.existsSync(SYNC_STATE)) {
    drift("HIGH", "tier3", "no record of a completed sync — backup-sync has never run",
      "node scripts/backup-sync.cjs");
    return;
  }
  try {
    const state = JSON.parse(fs.readFileSync(SYNC_STATE, "utf8"));
    stats.bulk.lastSync = state.completedAt || null;
    stats.bulk.lastResult = state.result || null;
    const ageDays = state.completedAt ? (Date.now() - Date.parse(state.completedAt)) / 86400000 : Infinity;
    if (state.result !== "ok") {
      drift("HIGH", "tier3", `last sync did not complete cleanly (${state.result})`, "Check cron/logs for backup-sync");
    } else if (ageDays > 8) {
      drift("HIGH", "tier3", `last successful sync was ${Math.floor(ageDays)} days ago`, "node scripts/backup-sync.cjs");
    }
  } catch (e) {
    drift("MEDIUM", "tier3", `sync state unreadable: ${e.message}`, `Inspect ${SYNC_STATE}`);
  }
}

// ------------------------------------------------------------------- Report
function main() {
  try {
    auditGitRepos();
    auditTrackedSizes();
    auditVault();
    auditBulk();
  } catch (e) {
    console.error("AUDIT FAILED:", e.message);
    process.exit(2);
  }

  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const blocking = findings.filter((f) => f.severity !== "LOW").length;

  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: blocking === 0, stats, findings }, null, 2));
    process.exit(blocking ? 1 : 0);
  }

  if (QUIET && blocking === 0) process.exit(0);

  const line = "─".repeat(72);
  console.log(`\n${line}\nBACKUP COVERAGE AUDIT\n${line}`);
  console.log(`\nTier 1 — Git: ${stats.tracked.files} files, ${stats.tracked.mb} MB tracked across ${stats.repos.length} repo(s)`);
  for (const r of stats.repos) {
    const flag = r.remotes === 0 ? "NO REMOTE" : r.unpushed === "no-upstream" ? "no upstream" : r.unpushed > 0 ? `${r.unpushed} unpushed` : "pushed";
    console.log(`         ${r.repo.padEnd(46)} ${String(r.commits).padStart(5)} commits  ${flag}`);
  }
  console.log(`\nTier 2 — Vault: ${stats.vault.documentedKeys} documented secrets · op CLI ${stats.vault.opInstalled ? "present" : "NOT INSTALLED"} · ${stats.vault.verified ? "verified" : "UNVERIFIED"}`);
  console.log(`Tier 3 — Bulk:  rclone ${stats.bulk.rclone ? "present" : "MISSING"} · remote "${stats.bulk.remote}" ${(stats.bulk.remotes || []).includes(stats.bulk.remote) ? "configured" : "NOT CONFIGURED"} · last sync ${stats.bulk.lastSync || "never"}`);

  if (stats.oversized.length) {
    console.log(`\nOversized tracked files (>${BIG_TRACKED_MB} MB):`);
    for (const o of stats.oversized) console.log(`         ${String(o.mb).padStart(7)} MB  ${o.file}`);
  }

  console.log(`\n${line}`);
  if (!findings.length) {
    console.log("No drift. Every tier accounted for.\n");
  } else {
    console.log(`${findings.length} finding(s), ${blocking} blocking:\n`);
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.area} — ${f.message}`);
      if (f.fix) console.log(`            fix: ${f.fix}`);
    }
    console.log("");
  }
  process.exit(blocking ? 1 : 0);
}

main();
