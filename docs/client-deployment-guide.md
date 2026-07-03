# Client Deployment Guide

How to stand up a **dedicated Agentic OS install for a single client** in its own
GitHub repo, on its own machine ("the client site"), and how to push curated
improvements to it later.

> This is the **Path A / frozen-snapshot** model: each client is its own repo,
> cloned to its own environment, and only changes when you deliberately ship an
> **update pack**. It is *not* the built-in `update.sh` flow — see
> [Why not `update.sh`?](#why-not-the-built-in-updatesh) below.

---

## Mental model (read this once)

There are three things, not one:

| Thing | What it is | Lives where |
|---|---|---|
| **Master OS** | `freeflyroy/agent-os-v3` — your source of truth. Where you build and improve skills. | Your machine + GitHub |
| **Client snapshot** | A frozen copy of the master, blanked of your data, in the client's own repo | A new private GitHub repo per client |
| **Client install** | The clone running on the client site, with their brand data filled in | The client's machine / your sibling folder |

The repo already separates **the OS** from **client data** via `.gitignore`:

- **Tracked (the OS — travels):** `AGENTS.md`, `CLAUDE.md`, `context/SOUL.md`, all 52 skills, all scripts, `docs/`, `.env.example`, `.mcp.example.json`, cron jobs.
- **Gitignored (stays local, never travels):** `brand_context/`, `projects/`, `.env`, `.mcp.json`, `context/memory/*` daily logs are *committed* (see gotcha), `.memsearch/`, `settings.local.json`, `installed.json`.

### The gotcha — a plain clone is *not* fully blank

A handful of files are **tracked but personal to you** and would ride along into a
client unless reset. `scripts/blank-for-client.sh` handles all of them:

| Carries your data | Blanking action |
|---|---|
| `context/USER.md` | reset to stub |
| `context/MEMORY.md` | reset to empty scratchpad |
| `context/learnings.md` | reset to generic stub |
| `context/memory/*.md` (daily logs) | wiped |
| `CLAUDE.local.md` (**tracked!**) | reset — otherwise your session rules leak |
| `cron/jobs/youtube-newsletter.md`, `podcast-shorts-lane.md` | removed (personal) |
| `.claude/skills/*/SKILL.local.md` (×2) | removed |
| `context/SOUL.md` | **kept** — generic agent identity, a good base |

---

## One-time prep on the master

1. **Confirm zero skill drift** — make sure every skill on disk is registered in
   `AGENTS.md` (Skill Registry + Context Matrix) so the client inherits a
   correctly-registered OS. Ask Claude to "run a reconciliation pass" or compare
   `ls .claude/skills/` against the registry tables.

2. **Tag a baseline** so update packs have something to diff against later:

   ```bash
   git tag -a client-base-v$(cat VERSION) -m "Baseline for client snapshots"
   git push origin --tags
   ```

3. **(Optional) Mark the master as a GitHub *template repository*** —
   GitHub → repo **Settings → Template repository → ✓**. This enables the
   one-click "Use this template" path below and gives each client a clean,
   single-commit history (none of your master's history leaks).

---

## Spinning up a new client

### Step 1 — Create the client's repo (clean snapshot)

**Option A — "Use this template" (recommended):**
GitHub → your master repo → **Use this template → Create a new repository** →
name it `agentic-os-<client>` → **Private**. Because client-data dirs are
gitignored, the new repo already excludes your `brand_context/` and `.env`. It
will still contain the tracked-personal files — Step 2 strips those.

**Option B — Clean local snapshot, no master history (what we use for local-first builds):**
```bash
SRC=/c/Claude/agent-os-v3/agentic-os
DST=/c/Claude/agent-os-v3/agentic-os-<client>
mkdir -p "$DST"
git -C "$SRC" archive HEAD | tar -x -C "$DST"     # tracked files only — no history, no .env, no brand data
cd "$DST" && git init -q
bash scripts/blank-for-client.sh --apply --client "<Name>"   # strips personal data + projects/ content
git add -A && git commit -q -m "chore: initial <Name> snapshot"
gh repo create freeflyroy/agentic-os-<client> --private --source=. --remote=origin --push
```
> `git archive` carries master's *tracked* `projects/` outputs onto disk — the
> blanking script wipes them. And master's `.gitignore` anchors `/projects/` to
> the root so nested dirs (e.g. `command-centre/.../projects/`) aren't dropped
> from the snapshot. Both are handled automatically now.

### Step 2 — Blank it

```bash
cd agentic-os-<client>
bash scripts/blank-for-client.sh              # preview what will change
bash scripts/blank-for-client.sh --apply --client "Acme Co"
git add -A && git commit -m "chore: blank snapshot for client"
git push -u origin main
```

The script guards against running in your master repo by mistake.

### Step 3 — Clone & install on the client site

```bash
git clone https://github.com/freeflyroy/agentic-os-<client>.git
cd agentic-os-<client>

# Installer (sets up .env from .env.example, dependencies, etc.)
bash scripts/install.sh         # macOS/Linux
powershell -File scripts/install.ps1   # Windows
```

### Step 4 — Plugins (these do NOT travel with the repo)

GSD and memsearch are **Claude Code plugins**, installed per-machine — not part of
this repo. Install them on the client site separately:

- **memsearch** (semantic memory recall): `bash scripts/setup-memory.sh` /
  `scripts/setup-memory.ps1`. On Windows this needs a free Zilliz cluster — fill
  `ZILLIZ_URI` / `ZILLIZ_TOKEN` in `.env`.
- **GSD** (planning/build system): install via your Claude Code plugin
  marketplace as you did on the master.

### Step 5 — Keys & MCP

- Fill in `.env` with the client's API keys (all optional — skills degrade
  gracefully and tell you what's missing).
- If the client uses HeyGen or other MCP servers: `cp .mcp.example.json .mcp.json`
  and fill in.

### Step 6 — Onboard from the Notion form

Open Claude in the client folder and run **`/start-here`**. Feed it the client's
Notion onboarding form (paste the page, or connect the Notion MCP and give the
URL). It builds `brand_context/` — voice profile, ICP, positioning, etc. — from
their answers. This is what makes the OS *theirs*.

---

## Pushing improvements later — update packs

You chose **frozen snapshot**: clients don't auto-pull. When you improve a skill
on the master and want a specific client to get it, you ship an **update pack** —
a self-contained overlay of just the changed OS files plus a manifest. It's
history-independent, so it applies cleanly even though the client repo has its own
unrelated history, and it never touches `brand_context/`, `context/`, `projects/`,
or `.env`.

```
update-pack-2026-06-20/
├── MANIFEST.md            # what changed, why, which version
├── files/                 # the changed OS files, in repo-relative paths
│   ├── .claude/skills/mkt-copywriting/SKILL.md
│   └── AGENTS.md
└── apply.sh               # copies files in, shows a git diff, commits
```

Two ways to decide *what* goes in a pack:

- **By tag-diff (automated):** everything that changed on the master since the
  client's baseline tag, restricted to OS paths. Best for "bring this client up to
  date."
- **By hand-pick (surgical):** name the skills/files to include. Best when each
  client should get a *different* subset (your stated reason for going frozen).

> **Status:** `scripts/make-update-pack.sh` (generate) and the bundled `apply.sh`
> (apply on the client) are the next tooling to build — see
> [Build status](#build-status).

---

## Why not the built-in `update.sh`?

The repo ships `scripts/update.sh`, but it's the wrong tool for master→client:

- It resolves its update remote **by URL to `simonc602/agentic-os`** — the
  *original* template author, not you. A client running it would pull the
  upstream author's changes, not your improvements.
- It's a **live 3-way merge**, the opposite of the frozen model you chose.

It *does* protect `context/`, `brand_context/`, `projects/`, and `.env` during a
pull — useful prior art that the update-pack `apply.sh` mirrors — but the
client-facing flow is update packs, not `update.sh`.

---

## Multi-client alternative (for reference)

If you ever want to run several clients **from one machine that you operate**, the
repo also supports an in-repo `clients/<slug>/` layout via
`bash scripts/add-client.sh "Name"` (shared skills at root, per-client data
underneath). That's lower-overhead but keeps everything on your machine — see
[multi-client-guide.md](multi-client-guide.md). This guide covers the
separate-repo, separate-site model instead.

---

## Quick reference

```bash
# ─ Master: prep once ─
git tag -a client-base-v$(cat VERSION) -m "baseline"; git push origin --tags

# ─ New client ─
# 1. GitHub: "Use this template" → agentic-os-<client> (private)
git clone .../agentic-os-<client>.git && cd agentic-os-<client>
bash scripts/blank-for-client.sh --apply --client "Acme Co"
git add -A && git commit -m "chore: blank snapshot for client" && git push

# ─ Client site ─
git clone .../agentic-os-<client>.git && cd agentic-os-<client>
bash scripts/install.sh            # or install.ps1
bash scripts/setup-memory.sh       # memsearch (plugin, per-machine)
cp .env.example .env               # fill in keys
# open Claude → /start-here  (feed the Notion onboarding form)
```

## Build status

- [x] `scripts/blank-for-client.sh` — strip personal data + projects/ from a snapshot
- [x] `docs/client-deployment-guide.md` — this runbook
- [x] `.gitignore` anchored to `/projects/` `/brand_context/` (fixes nested-dir drop)
- [x] First client **eldercare**: repo created (`freeflyroy/agentic-os-eldercare`, private), blanked, verified, pushed
- [ ] eldercare: onboard from the Notion form (`/start-here` in the folder)
- [ ] eldercare: set up the brain (memsearch/Zilliz) — after onboarding
- [ ] Baseline tag on master (`client-base-v0.2.3`)
- [ ] `scripts/make-update-pack.sh` + bundled `apply.sh` — curated update packs
