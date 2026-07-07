# Cron runtime can't launch Claude on Windows — fix-ready report for Roy (All The Power)

**Install:** Got Moles consumer install · Windows 11 · repo root `C:\Agentic-os-got-moles`
**Impact:** **Every** scheduled cron job fails instantly on this machine — not specific to one job.
Confirmed no cron job has ever run successfully here (no prior `cron/status/*.json` files existed).
**Date found:** 2026-07-06, while validating a new weekly job.

## Symptom

Any job (manual `run-job` or scheduled) fails in ~180 ms. Per-job log shows:

```
--- Attempt 1/2 ---
[cron-daemon] spawn C:\Users\spenc\AppData\Roaming\npm\claude ENOENT
--- Attempt 2/2 ---
[cron-daemon] spawn C:\Users\spenc\AppData\Roaming\npm\claude ENOENT
=== FAILURE (0s) ===
```

## Root cause (two compounding issues in `command-centre/src/lib/cron-runtime.js`)

1. **Missing Windows launcher.** `WINDOWS_HIDDEN_RUNNER_PATH` → `scripts/run-hidden-command.ps1`
   (referenced ~line 31) **does not exist in this install.** So the `"wrapper"` launch mode for
   `.cmd`/`.bat`/`.ps1` commands can never fire — it's guarded by `fs.existsSync(...)` at
   ~line 2478 and silently falls through to a direct spawn.

2. **Default command resolves to the extensionless npm shim.** With `AGENTIC_OS_CLAUDE_BIN` unset,
   `configuredCommand = "claude"` (line 2465). `resolveWindowsClaudeLaunchPlan` takes the
   `normalizedCommand === "claude"` branch (line 1628) → `mode: "direct"`, and
   `resolveCommandOnWindowsPath("claude")` returns the **extensionless** shim
   `C:\Users\spenc\AppData\Roaming\npm\claude`. That path is then `spawn(...)`-ed with
   `shell: false` (line 2493). Windows cannot execute an extensionless shell script directly →
   `ENOENT`.

   (The npm global bin has `claude`, `claude.cmd`, `claude.ps1` — **no `claude.exe`**. Node's
   `spawn` with `shell:false` can't run any of the three directly; it needs the `.cmd` via a shell
   or the `.ps1` via the hidden runner.)

## Two secondary install gaps found

3. **`command-centre/node_modules` was missing entirely** — deps had never been installed on this
   box (runtime errored on `gray-matter`). Worked around locally with `npm install` in
   `command-centre`, but setup/install tooling should guarantee this.
4. **The daemon (`command-centre/scripts/cron-daemon.cjs`) does not load `.env`.** So an
   `AGENTIC_OS_CLAUDE_BIN` override placed in `.env` would NOT be picked up — it must be exported
   into the daemon's process environment (or the daemon taught to load `.env`).

## Suggested fixes (any one of the first two unblocks launch)

- **A.** Ship `scripts/run-hidden-command.ps1` with the install, AND make Windows resolution prefer
  the `.cmd` sibling over the extensionless shim (so it routes through the existing `"wrapper"`
  mode).
- **B.** In `resolveWindowsClaudeLaunchPlan`, treat the extensionless npm shim as a shell/wrapper
  launch (spawn via `cmd.exe`/`shell:true`) instead of `mode:"direct"`.
- **C.** Ensure `command-centre` deps are installed during setup.
- **D.** Have the daemon load `.env` (or document that `AGENTIC_OS_CLAUDE_BIN` must be set in the
  daemon's environment) — then a per-machine override `AGENTIC_OS_CLAUDE_BIN=…\claude.cmd` is a
  clean stopgap.

## Evidence / repro

- `cron/logs/weekly-cash-flow-projection.log` — the ENOENT lines above.
- `ls scripts/run-hidden-command.ps1` → not found.
- `ls C:\Users\spenc\AppData\Roaming\npm\claude.exe` → not found (only `claude`, `claude.cmd`, `claude.ps1`).

## Current state on this machine

- Daemon **stopped** (it was started only to test; left running it would fail-spam all active jobs).
- The `Weekly Cash-Flow Projection` job is **staged inactive** — ready to flip to `active: 'true'`
  the moment the launcher is fixed.
- Nothing shipped was edited; `command-centre/node_modules` was installed (gitignored).
