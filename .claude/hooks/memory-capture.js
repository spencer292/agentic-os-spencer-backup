#!/usr/bin/env node
// Stop hook — Agentic-OS-owned session capture + memory refresh.
//
// Replaces the legacy user-level memsearch plugin Stop hook. On every Stop it
// spawns memory-capture.cjs detached: that captures the transcript's last turn
// as a summarized block in context/memory/{date}.aos.md, archives the raw
// transcript, and runs a debounced incremental index into the local PGLite
// memory store. No Memsearch.
//
// Fire-and-forget: parses stdin, spawns a detached+unref child, and returns
// immediately so it never blocks the session. Silent and exit-0 on anything
// missing (no transcript path, headless runs) so the Stop chain is never broken.

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    return;
  }

  const sessionId = data.session_id;
  const transcript = data.transcript_path;
  // Without a transcript there is nothing to capture; the agent wrap-up + nightly
  // cron cover those sessions. No-op cleanly.
  if (!sessionId || !transcript) return;

  const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const root = findRoot(cwd);
  if (!root) return;

  const script = path.join(root, "command-centre", "scripts", "memory-capture.cjs");
  if (!fs.existsSync(script)) return;

  const child = spawn(
    process.execPath,
    [
      script,
      "--session",
      "--visibility",
      "system",
      "--session-id",
      String(sessionId),
      "--transcript",
      String(transcript),
    ],
    {
      cwd: root,
      stdio: "ignore",
      windowsHide: true,
      detached: true,
    },
  );
  child.unref();
});

// Walk up to find the Agentic OS root (AGENTS.md/CLAUDE.md + .claude present),
// so the hook works from client subfolders or projects/briefs/ subfolders.
function findRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    const hasAgents = fs.existsSync(path.join(dir, "AGENTS.md"));
    const hasClaude = fs.existsSync(path.join(dir, "CLAUDE.md"));
    const hasClaudeDir = fs.existsSync(path.join(dir, ".claude"));
    if ((hasAgents || hasClaude) && hasClaudeDir) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// Safety net — if stdin never delivers, exit silently.
setTimeout(() => process.exit(0), 4000);
