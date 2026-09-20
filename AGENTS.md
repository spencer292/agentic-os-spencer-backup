# AGENTS.md

Shared project instructions for Agentic OS. `AGENTS.md` is the canonical instruction file for this repository — Codex reads it directly, and Claude Code reads it through `CLAUDE.md` via `@AGENTS.md`.

---

## What This Project Is

Agentic OS is an agent-first Claude Code template that turns Claude into a business assistant. Canonical operating rules, registries, and conventions live here — this file is the specification — so Codex and other AGENTS-aware tools work cleanly too.

---

## Team OS Context Snapshot

When Team OS is connected, the server is the source of truth for team, client, and private user context. The local machine receives only a filtered snapshot for the authenticated team member.

At session start, Team OS injects a server-resolved snapshot from the immutable
runtime overlay owned by the current profile and task/session. Treat that
injected snapshot as the resolved context for the fixed team, user, and client.

Rules:
- Do not manually inspect other users' private files or another team's files.
- While Team OS mode is active, the injected session-scoped runtime snapshot is
  the only runtime authority for team, client, and private-user context. Do not
  read workspace-materialized `AGENTS.local.md`, `CLAUDE.local.md`,
  `context/USER.md`, `context/MEMORY.md`, `context/learnings.md`,
  `team_context/`, or `brand_context/`; those paths may belong to another local
  session and remain available only for explicit import/sync administration.
- Do not infer `teamId`, `userId`, or client access from local paths. The Team OS server resolves those from the authenticated session.
- Later context layers may add preferences, but they cannot reduce safety, bypass permissions, or cross tenant boundaries.
- Root `.claude/skills/` remains available in every Chat UI session, including
  Team OS sessions and conversation-only continuation. Client skills are
  available only in that client's chats. Granted Team skills are loaded from a
  separate profile-and-Team cache and never replace the root skill pack.
- `team_context/AGENTS.md` is the team-level instruction layer. It extends the root `AGENTS.md` for shared team behavior, but it is not a separate Agentic OS workspace.
- If the Team OS server is unavailable, do not reuse stale Team OS context or
  local private files. Existing chats may continue only in explicit
  conversation-only mode from their saved conversation.
- If no Team OS login is active, use the current Solo Agentic OS flow unchanged.

Solo users do not need to configure anything. `context/USER.md`, `brand_context/`, `clients/`, `AGENTS.local.md`, `CLAUDE.local.md`, and `SKILL.local.md` keep their existing behavior.

To migrate existing local context into Team OS after signing in, run `npm run context:import` from `command-centre/`. This imports approved private files (`context/USER.md`, `context/MEMORY.md`, `context/learnings.md`, prompt tags, and local overrides), root `team_context/*` and `brand_context/*` as team context, and approved client context as client context. `.mcp.json` is not imported as context; it uses encrypted backup sync.

To refresh a connected workspace, run `npm run context:sync` from `command-centre/`. This pulls server-owned base files, syncs private user files, pulls team context, and restores `.mcp.json` from encrypted backup when available.

---

## Local Agent Overrides

In Solo mode, if `AGENTS.local.md` exists in this directory, read it after
`AGENTS.md`. In Team OS mode, use only the private-user rules included in the
injected runtime snapshot and do not read the workspace copy. The file remains
user-owned, synced as private Team OS context, and never overwritten by updates.

---

## Operating Rules

### Skill & MCP Reconciliation

Compare what is on disk against what is registered: fix additions silently, confirm removals with the user. **Before acting, read `docs/building-skills.md`** for the exact per-case steps (skill added, skill folder missing, MCP added or removed, new external service).

### Skill Local Overrides

Any skill may ship a `SKILL.local.md` (user-owned, never overwritten by updates) that extends or overrides its `SKILL.md` — when invoking a skill, check for it and read it alongside `SKILL.md`; local rules take precedence, but never over chat scope, permissions, or safety. Mechanics: read `docs/building-skills.md`.

### Client Skill Visibility

Shared skills live only at the Agentic OS root and are never copied into `clients/`. A session started in a client folder inherits them through Claude Code's parent-directory discovery. A client's `.claude/skills/` holds only client-owned material: client-only skills and `SKILL.local.md` overrides.

When the user is working inside a client and asks to remove, hide, or stop using a skill there, treat it as **client-scoped visibility**, not uninstallation. Add the skill to `skillOverrides` in that client's `.claude/settings.local.json`:

```json
{ "skillOverrides": { "skill-name": "off" } }
```

That file is user-owned and no script ever overwrites it, so the setting survives every update. Merge into the existing JSON, never replace the file.

Only run `remove-skill.sh` from the root, and only when the user wants the skill gone for themselves and for every client. If the request is ambiguous, ask which one they mean before acting.

Creating a full `SKILL.md` inside a client with the same name as a root skill also shadows it locally, but that copy stops receiving root updates. Prefer `SKILL.local.md` to extend a root skill, and `skillOverrides` to hide one.

### Skill origins in Chat UI

- `.claude/skills/` in the installation is the permanent local source and does
  not require Team OS `skill.*` permissions.
- Client skill folders are scoped to their client and override the root version
  when that client is active.
- Team skill copies live under the current local profile in a Team-ID-hashed
  cache. `skill.use/read/edit/admin` applies only to these Team copies.
- On a name collision, `/skill-name` uses Team by default, `/team:skill-name`
  forces Team, and `/local:skill-name` forces the local/client version.
- A connected response refreshes authorized Team copies. Conversation-only
  continuation may use the last authorized Team copy, while local and client
  skills remain available. Revocation is applied on the first response after
  reconnection.

---

### Task Routing

When the user asks a question or requests a task:
1. Check system operations first. If the request matches a built-in operation, execute it directly.
2. Search installed skills by checking `.claude/skills/` frontmatter for a matching skill.
3. If a skill exists, invoke it. Check for `SKILL.local.md` and load it alongside `SKILL.md`.
4. If no skill matches, say so explicitly and offer either:
   - Find or build a skill so the system handles the task well every time
   - Handle it now with base knowledge

Never silently fall back to base knowledge when a skill exists. Never silently handle a task without making the skill gap explicit.

### Built-in Operations

These are core system functions handled by scripts. Check them before searching skills.

| User says | Action |
|-----------|--------|
| "add a client", "new client", "set up a client" | See **Add Client Flow** below |
| "remove a skill", "uninstall {skill}" | At the root: run `bash scripts/remove-skill.sh {skill-name}`. Inside a client: see **Client Skill Visibility** below — never remove from the root to satisfy a client-scoped request |
| "add a skill", "install {skill}" | Run `bash scripts/add-skill.sh {skill-name}` |
| "synthesize skills", "sync local overrides", "clean up local files" | Run `meta-synthesize-locals` skill |
| "list skills", "what skills are installed" | Run `bash scripts/list-skills.sh` |
| "start crons", "start scheduled jobs" | Run `bash scripts/start-crons.sh` |
| "stop crons", "stop scheduled jobs" | Run `bash scripts/stop-crons.sh` |
| "cron status", "status crons" | Run `bash scripts/status-crons.sh` |
| "cron logs", "logs crons" | Run `bash scripts/logs-crons.sh` |
| "setup memory", "memory setup", "enable searchable memory" | Run `bash scripts/setup-memory.sh` |

### Add Client Flow

Add a client → run `bash scripts/add-client.sh "{name}"` (ask for the name if not given), then tell them to switch with `cd {absolute path}/clients/{slug} && claude`. Full structure: read `docs/multi-client-guide.md`.

### Branching Policy — CONSUMER INSTALL (Claude: read carefully)

This machine runs a consumer copy of the Got Moles Agentic OS with a **split-direction git setup**:

- **Pull from `origin`** (the shared Got Moles repo) — this is where Roy (All The Power) publishes
  skills, brand context, and system updates. Origin's push URL is deliberately disabled on this
  machine: pushing to it is impossible, by design.
- **Push to `backup`** (this user's own private GitHub repo) — personal session memory, learnings,
  and deliverables are backed up there. `git push` goes to `backup` automatically
  (`remote.pushDefault`); nothing this machine does can reach the shared repo.

Rules:

- **Commit freely, as designed.** `meta-wrap-up` commits session work to local `main` and pushes —
  the push lands on `backup`. Full wrap-up behavior is correct on this install.
- **Never edit shipped files** (`.claude/skills/` shipped skills, `brand_context/`, `docs/`,
  `AGENTS.md`, `CLIENT-SETUP.md`). Personal rules go in `CLAUDE.local.md` or a skill's
  `SKILL.local.md`. Shipped-file edits are the one thing that can make a pull conflict.
- `git pull` rebases local personal commits on top of Roy's updates (`pull.rebase=true`). If a
  pull ever conflicts, a shipped file was edited locally — undo that edit (or stash), pull again,
  and mention it to the user.
- If the `backup` remote isn't configured yet, wrap-up still commits locally — skip the push and
  tell the user their backup repo needs setting up (see CLIENT-SETUP.md "Personal backup").

### Before Major Deliverables

- Load the relevant `brand_context/` files per `docs/context-matrix.md`
- Check `context/learnings.md` for the current skill's section
- If brand context is missing, offer to build it; never block work because context is incomplete

### After Major Deliverables

- Ask: "How did this land? Any adjustments?"
- Log feedback to `context/learnings.md` under the skill's section
- If gaps were spotted, mention once with opportunity framing

---

### Autonomous Goals — Pre-Goal Readiness Check

When a goal is set that will run **unattended** — the user steps away, says "run until done," sets a `/goal` with autonomous intent, or otherwise expects completion without supervision — produce a **Pre-Goal Readiness Check and get sign-off BEFORE starting the run.** Never begin an unattended run without it. The point is that the user learns *up front* exactly what will need them, so nothing blocks silently while they are away.

The readiness check states three buckets explicitly, every time:

1. **Needs your approval / decision** — every gate only the user can clear. Get each one pre-approved now, or list it as a known pause.
2. **Pauses if I stop running** — every step that is **not** backed by a cron job or a deployed workflow, i.e. that only happens while Claude is actively working (driving gates, rendering, choosing titles, looping). These are **not** unattended-safe. State them plainly.
3. **Can stall silently** — external dependencies that can drop work without erroring (flaky n8n/Notion triggers, third-party async processing like Descript/transcription, Drive sync lag, API rate limits), each with how it will be detected and retried.

**Hard rule:** never describe a goal as "fully hands-off / you can walk away" unless **every** step is genuinely cron- or workflow-backed. If bucket 2 is non-empty, either (a) build that step into a real automation *before* the run, or (b) tell the user up front which parts will wait for them or for Claude. Self-resumption timers are not a dependable unattended engine — treat anything that depends on Claude looping as bucket 2.

When the run ends or pauses, report back **against the same three buckets** so the user sees exactly what completed, what is waiting on them, and what stalled.

---

---

## Memory System

Layered memory architecture. Different files serve different roles, with explicit caps on the ones loaded at session start to keep the prefix cache stable.

### File Roles

Loaded at session start: `context/SOUL.md`, `context/USER.md`, `context/MEMORY.md` (**2,500-char cap**), and today's daily log `context/memory/{YYYY-MM-DD}.md`. Lazy / per-skill: `context/learnings.md`. Not loaded at start: `context/memory/{YYYY-MM-DD}.aos.md` (machine-owned Stop-hook capture, indexed only) and `context/transcripts/` (raw archives, gitignored).

### Automatic Capture

<!-- Automatic capture runs via the Stop hook (memory-capture.js): it summarizes each turn into context/memory/{date}.aos.md, keyed by a SHA-256 hash so re-runs don't duplicate. Config: context/memory-config.json. Full mechanics: docs/memory/session-capture.md. The agent does not run this; the hook does. -->

### Memory Budget

`context/MEMORY.md` is capped at **2,500 characters**. Before any write:

1. Read the file in full
2. Check character count:
   - Bash: `wc -c < context/MEMORY.md`
   - PowerShell: `(Get-Item context/MEMORY.md).Length`
3. If the new content would push over the cap, consolidate existing entries first — merge similar lines, remove stale ones, tighten verbose entries. Only then add.
4. If still over after consolidation, ask the user which entry to drop.

**Mid-session writes persist to disk but only take effect on the next session.** This is intentional: it preserves the prefix cache (lower cost, faster startup). Always tell the user this in confirmation messages so they know why a just-saved fact isn't immediately visible.

### Memory Write

Triggers ("remember this", "note that", "save this to memory", "log this", "forget about") route to the `meta-memory-write` skill. Actions: **add** (append under the right section after a dedup check), **replace** (find substring + swap), **remove** (show the line and confirm before deleting). Sections in `context/MEMORY.md`: `## Active Threads`, `## Environment Notes`, `## Pending Decisions` — do not create new ones; if a fact doesn't fit, ask where it belongs. After a write, confirm `Saved — will be active from next session.` Never store secret values — reference env var names only (e.g., `FIRECRAWL_API_KEY in .env`).

### Memory Retrieval

**Ground-truth rule — memory is a hint, live state is the truth.** Memory files (`MEMORY.md`, daily logs, recall results) are point-in-time snapshots that can go stale silently. Before acting on any memory claim about *current* state — a folder is empty, a step is undone, a tool is broken, a file is missing — verify against live state first (`ls` the folder, run a memory recall, read the file). Never trigger a redundant or destructive action (re-run `/start-here`, re-index, reset) on the strength of a remembered claim alone. If live state contradicts memory, trust live state and fix the note.

When the user asks about past context, decisions, or facts: **Tier 0** — use the resolved context already loaded for the session. **Tier 1** — run `npm run memory:recall -- "query"` from `command-centre/`; when Team OS is signed in, the hosted Memory API resolves the permitted team, user, and client scope. When signed out, provide an explicit local scope such as `--system` or `--client <slug>` (this install's frozen command-centre build has no `--local` flag — the scope flag alone selects local search). If connected Team OS is unavailable, fail clearly instead of using stale local data. Always cite the source and temporal context; if nothing is found, say so rather than inventing an answer. Full ladder (search / expand / transcript), citation patterns, backfill (`memory:import-sessions`), eval (`memory:eval`) and the scope/no-leak model: read `docs/memory-retrieval.md`.

---

## Multi-Client Architecture

Agentic OS supports multiple clients from a single install: a shared root (methodology, skills, scripts) plus one folder per client under `clients/{slug}/` with its own `brand_context/`, `context/`, `projects/` and `.claude/skills/`. Full structure and the directory tree: read `docs/multi-client-guide.md`.

---

## Three-Layer Architecture

| Layer | Files | Purpose |
|-------|-------|---------|
| **Agent Identity** | `AGENTS.md`, `CLAUDE.md`, `context/SOUL.md`, `context/USER.md` | Shared operating rules plus Claude-specific runtime behavior |
| **Skills Pack** | `.claude/skills/{category}-{skill-name}/` | Capabilities that grow over time |
| **Brand Context** | `brand_context/` | Client brand data |

Which paths are tracked vs gitignored (secrets and machine stores are ignored; memory source content, `brand_context/` and `projects/` are tracked for private backups): see `.gitignore`.

---

## Skill Categories

Every skill and its output folder uses a category prefix: `mkt` (marketing) · `str` (strategy) · `ops` (operations / file mgmt) · `viz` (visual / video) · `acc` (accounting) · `fin` (finance) · `meta` (system / meta) · `tool` (utility / integration).

**Rules:**
- Skill folder name = `{category}-{skill-name}` in kebab-case
- YAML frontmatter `name` field must match the folder name exactly
- Output folders use the same category prefix: `projects/{category}-{output-type}/`
- Learnings sections in `context/learnings.md` use `## {folder-name}`
- Add new categories only when the first skill in a new domain is built

Examples per prefix and the full skill list: `docs/skill-registry.md`.

---

## Skill Registry

Full registry in `docs/skill-registry.md`. Auto-populated by reconciliation — add entries there when registering new skills.

---

---

## System Registry

Packaged skill systems live in `.claude/skills/_systems/{name}/` — self-contained, distributable bundles (PACKAGE.yaml + install.sh + skills + agents). Install into this project with `bash scripts/add-system.sh {name}`; remove with `bash scripts/remove-system.sh {name}`. To share one, zip the system folder — the recipient runs `bash install.sh --target /their/project`.

| System | Version | Entry skill | Contents |
|--------|---------|-------------|----------|
| `00-brand-build` | 1.0.0 | `00-brand-build` | Full brand-from-scratch pipeline: 9 skills (icp, strategy, positioning, voice, visual identity + image-gen/humanizer/pdf utilities) + `ssc-template-builder` agent. Installer renders per-install paths and merges `.env.example` keys. |

---


## Context Matrix

Full matrix in `docs/context-matrix.md`. Load only the `brand_context/` files listed for each skill. Every skill also reads its own section from `context/learnings.md`.

---

## Output Standards

- **Single tasks (Level 1):** Save to `projects/{category}-{output-type}/`
- **Planned/GSD projects (Level 2/3):** Save all outputs inside `projects/briefs/{project-name}/`
- Filename format: `{YYYY-MM-DD}_{descriptive-name}.md`
- Folders are created on first use by the skill
- Default format: markdown unless the user specifies otherwise
- After major deliverables: ask for feedback and log it to `context/learnings.md`
- **Auto-download binary outputs:** after saving a non-markdown file, copy it to `~/Downloads/`
- **Show clickable file paths:** always show the full absolute path after saving output

### Projects

Three levels: **L1** single task → `projects/{category}-{type}/`; **L2** planned project (benefits from a brief) and **L3** GSD project (multi-phase, dependencies) → `projects/briefs/{project-name}/`, with L3 adding a `.planning/` folder under `clients/{name}/.planning/`. The Agentic OS root must never hold `.planning/`, and all project files stay inside the project folder. Level 2 brief requirements, the brief frontmatter schema, and the full GSD rules: read `docs/projects-guide.md`.

### Humanizer Gate

Every skill that produces publishable text must run its output through `tool-humanizer` before saving — `deep` mode when `brand_context/voice-profile.md` exists, otherwise `standard`. Research briefs, ICP profiles and positioning docs can skip this step.

---

## Building New Skills

Full guide in `docs/building-skills.md`. Always ask for reference skills first. Never guess at methodology. After building, add rows to the Skill Registry (`docs/skill-registry.md`) and Context Matrix (`docs/context-matrix.md`).

---

## Graceful Degradation

Skills work at all context levels: no `brand_context/` → ask what's needed and produce solid generic output; partial context → use what exists and default the rest; full context → personalise fully. Brand context enhances output, it never gates functionality.

---

## External Services & API Keys

Some skills use external services for enhanced functionality; keys live in `.env` (gitignored) and are documented in `.env.example`. For any skill that uses one: check the key exists first, tell the user what it does / what they lose without it / where to sign up, and always define a fallback — never block work when the fallback produces usable output. The full registry of services, keys and who uses them is `.env.example`; each skill documents its own fallback. Update `.env.example` when adding a new service.

<!-- Permissions are defined and enforced in .claude/settings.json (permissions.allow / permissions.deny) — see that file. This section is informational only and was removed to keep always-on context small. -->
