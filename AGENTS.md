# AGENTS.md

Canonical instruction file for Agentic OS. Codex and other AGENTS-aware tools
read this directly; Claude Code reads it through `CLAUDE.md` via `@AGENTS.md`.

## What This Project Is

Agentic OS is an agent-first Claude Code template that turns Claude into a
business assistant. Operating rules, registries and conventions live here.

---

## Task Routing

When the user asks for something:
1. Check **Built-in Operations** first — if it matches, execute directly.
2. Otherwise search `.claude/skills/` frontmatter for a matching skill.
3. If a skill matches, invoke it (and read its `SKILL.local.md` alongside).
4. If none matches, say so and offer to either build a skill or handle it now
   with base knowledge.

Never fall back to base knowledge when a skill exists, and never handle a task
without naming the skill gap, so the user gets the maintained methodology and can
choose to build a skill when none matches.

## Answer vs Action

When the user is describing a problem, asking a question, or thinking out loud, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one. This is the default for conversational turns; it does not apply to an explicitly requested task or to a scheduled/autonomous job, which carries its own instruction.

## Built-in Operations

Core system functions handled by scripts. Check these before searching skills.

| User says | Action |
|-----------|--------|
| "add a client", "new client" | See **Add Client Flow** below |
| "remove a skill", "uninstall {skill}" | Root: `bash scripts/remove-skill.sh {skill-name}`. Inside a client: hide it by adding `{ "skillOverrides": { "{skill-name}": "off" } }` to that client's `.claude/settings.local.json` (merge into the existing JSON, don't replace) — never remove from root, run `remove-skill.sh`, or write a "do not use" note in the client's `AGENTS.md`. Details: `docs/multi-client-guide.md` |
| "add a skill", "install {skill}" | `bash scripts/add-skill.sh {skill-name}` |
| "synthesize skills", "sync local overrides" | Run `meta-synthesize-locals` skill |
| "list skills", "what skills are installed" | `bash scripts/list-skills.sh` |
| "start / stop / status / logs crons" | `bash scripts/{start,stop,status,logs}-crons.sh` |
| "setup memory", "enable searchable memory" | `bash scripts/setup-memory.sh` |

### Add Client Flow

Run `bash scripts/add-client.sh "{name}"` (ask for the name if missing), then
tell them to switch: `cd {absolute path}/clients/{slug} && claude`. Full
structure: `docs/multi-client-guide.md`.

---

## Team OS Context Snapshot

When Team OS is connected, the injected session-scoped snapshot is the only
runtime authority for team, client and private-user context. Safety invariants:
- Do not read other users' or other teams' files; do not infer `teamId`,
  `userId` or client access from local paths — the server resolves them.
- Do not read workspace `AGENTS.local.md`, `CLAUDE.local.md`, `context/*`,
  `team_context/`, `brand_context/` while Team OS is active.
- Later context layers add preferences only — never reduce safety, bypass
  permissions, or cross tenant boundaries.
- If the server is unavailable, do not reuse stale context; continue only in
  explicit conversation-only mode. No Team OS login → Solo flow unchanged.

Import local context after signing in: `npm run context:import` from
`command-centre/`; refresh a connected workspace with `npm run context:sync`.
Snapshot resolution and Chat-UI skill scoping: `docs/team-os-identity-and-scope.md`.

## Local Agent Overrides

Solo mode: read `AGENTS.local.md` after this file when present. Team OS mode: use
only the private-user rules in the injected snapshot. User-owned, never updated.

---

## Operating Rules

- **Skill & MCP reconciliation:** compare disk against what's registered — fix
  additions silently, confirm removals. Per-case steps: `docs/building-skills.md`.
- **Skill mechanics** (local overrides, categories, naming, three-layer,
  registry): `docs/building-skills.md`.
- **Client scoping** (hide vs uninstall, `skillOverrides`): `docs/multi-client-guide.md`.
- **Before a major deliverable:** load `brand_context/` per `docs/context-matrix.md`
  and read the skill's section in `context/learnings.md`. Missing context never
  blocks work — offer to build it.
- **After a major deliverable:** ask "How did this land? Any adjustments?" and
  log feedback to `context/learnings.md` under the skill's section.

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

Loaded at session start: `context/SOUL.md`, `context/USER.md`, `context/MEMORY.md`
(**2,500-char hard cap**), today's daily log. Lazy: `context/learnings.md`.
Automatic capture runs via the Stop hook, not the agent.

`context/MEMORY.md` writes ("remember this", "note that", "forget about") route to
`meta-memory-write` — add / replace / remove under `## Active Threads`,
`## Environment Notes`, `## Pending Decisions` (no new sections). Over the cap,
consolidate first, then ask which entry to drop. Never store secret values, only
env var names. Mid-session writes take effect next session (prefix cache) — always
say so when confirming: `Saved — will be active from next session.`

**Ground-truth rule — memory is a hint, live state is the truth.** Memory files (`MEMORY.md`, daily logs, recall results) are point-in-time snapshots that can go stale silently. Before acting on any memory claim about *current* state — a folder is empty, a step is undone, a tool is broken, a file is missing — verify against live state first (`ls` the folder, run a memory recall, read the file). Never trigger a redundant or destructive action (re-run `/start-here`, re-index, reset) on the strength of a remembered claim alone. If live state contradicts memory, trust live state and fix the note.

Recall a past fact or decision: **Tier 0** — use the resolved context already loaded for the session. **Tier 1** — run `npm run memory:recall -- "query"` from `command-centre/`, or the `meta-memory-recall` skill; when Team OS is signed in, the hosted Memory API resolves the permitted team, user, and client scope. When signed out, provide an explicit local scope such as `--system` or `--client <slug>` (this install's frozen command-centre build has no `--local` flag — the scope flag alone selects local search). If connected Team OS is unavailable, fail clearly instead of using stale local data. Always cite the source and temporal context; if nothing is found, say so rather than inventing an answer. Full retrieval ladder, capture mechanics and budget procedure: `docs/memory-retrieval.md`, `docs/memory/session-capture.md`.

---

## System Registry

Packaged skill systems live in `.claude/skills/_systems/{name}/` — self-contained, distributable bundles (PACKAGE.yaml + install.sh + skills + agents). Install into this project with `bash scripts/add-system.sh {name}`; remove with `bash scripts/remove-system.sh {name}`. To share one, zip the system folder — the recipient runs `bash install.sh --target /their/project`.

| System | Version | Entry skill | Contents |
|--------|---------|-------------|----------|
| `00-brand-build` | 1.0.0 | `00-brand-build` | Full brand-from-scratch pipeline: 9 skills (icp, strategy, positioning, voice, visual identity + image-gen/humanizer/pdf utilities) + `ssc-template-builder` agent. Installer renders per-install paths and merges `.env.example` keys. |

---

## Output Standards

- Level 1 (single task) → `projects/{category}-{output-type}/`. Level 2/3 (brief /
  GSD project) → `projects/briefs/{project-name}/`. Rules: `docs/projects-guide.md`.
- Filename: `{YYYY-MM-DD}_{descriptive-name}.md`. Default format markdown.
- Show the full absolute path after saving. Copy non-markdown outputs to `~/Downloads/`.
- **Humanizer gate:** every skill producing publishable text runs `tool-humanizer`
  before saving (`deep` when `brand_context/voice-profile.md` exists, else
  `standard`). Research briefs, ICP profiles and positioning docs skip it.
- **Graceful degradation:** no `brand_context/` → produce solid generic output;
  partial → default the rest; full → personalise. Context enhances, never gates.

## Writing

Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend most of the response on the main answer. When asked to explain something, give a high-level summary unless an in-depth explanation is specifically requested. Please remove all mannered prose.

For documents Claude writes to disk (posts, reports, drafts), match the length to what the task needs: cover the substance, but do not pad with filler sections, redundant summaries, or boilerplate. This length guidance is about conversational responses; it does not cap the deliverables a skill is asked to produce.

## External Services & API Keys

Some skills use external services; keys live in `.env` (gitignored), documented in
`.env.example`. Per skill: check the key exists, tell the user what it does and the
fallback, never block when the fallback is usable. Full registry: `.env.example`.

## Reference Index

- Multi-client structure → `docs/multi-client-guide.md`
- Skill registry → `docs/skill-registry.md` (add rows when registering skills)
- Context matrix → `docs/context-matrix.md`
- Skill categories, naming, three-layer architecture → `docs/building-skills.md`
- Building skills → `docs/building-skills.md`

<!-- Permissions live in .claude/settings.json (permissions.allow / deny). -->
