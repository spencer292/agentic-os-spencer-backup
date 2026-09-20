# CLAUDE.md

Keeps Claude Code compatible with the shared `AGENTS.md` and adds Claude-only
runtime behavior.

@AGENTS.md
@GOT-MOLES.md
---

## Local Overrides

Local override loading follows the canonical rule in AGENTS.md ("Local Agent
Overrides"). Claude-only addition: also read `CLAUDE.local.md` before this file
when present. Both files are user-owned, never updated.

---

## Claude Runtime

### Session Type Detection

Solo mode only: scan `brand_context/` for populated `.md` files (ls, not read).
Team OS mode receives session type from the injected overlay — never inspect the
workspace `brand_context/`.
- **No files** → first run → run `/start-here` onboarding. The
  `detect-first-run.js` SessionStart hook fires this automatically; begin at once.
- **Files exist** → returning mode → silent startup (below).

### Returning Mode (silent startup)

Run these steps silently, then stop: no greeting, no recap, no capabilities list.

1. Use the Team OS snapshot injected at SessionStart. Never read
   `.agentic-os/context-snapshot/current.md` or workspace context as a fallback.
2. Read `context/SOUL.md` (~3 KB). Fall back to `../../context/SOUL.md`.
3. Solo only: read `context/USER.md`. Fall back to `../../context/USER.md`.
4. Solo only: read today's `context/memory/{YYYY-MM-DD}.md` (yesterday's only if
   today has none). Load any `### Project` brief; note `### Open threads`.
5. Solo only: read `context/MEMORY.md` (~2.5 KB working scratchpad). Fall back to
   `../../context/MEMORY.md`. It is a frozen snapshot — mid-session writes apply
   next session.
6. Solo only: open a `## Session N` block in today's memory file and `ls`
   `.claude/skills/`. Team OS mode: never read workspace `SKILL.local.md`.

At startup load only the files listed above. Defer everything else to wrap-up or
on demand: `brand_context/` (skills lazy-load per Context Matrix),
`context/learnings.md` (per-skill), stale-context flags, project scans,
reconciliation, cron status.

**GitHub backup check (once per day):** only on the day's first session. If
`.env` has `IS_TEMPLATE_MAINTAINER=true`, skip. Else, if `origin` still points at
the upstream template repo, warn once; otherwise stay silent.

### Greeting & Checkpoint

- Don't greet proactively. If the user greets casually and open threads exist,
  mention them in one line. If they state a task, begin immediately.
- After a major deliverable (file saved to `projects/`, skill built/modified),
  run the post-deliverable question from AGENTS.md ("How did this land? Any
  adjustments?") and log feedback per that rule. Skip this for quick answers or
  small edits.

### Daily Memory

Each session appends a numbered `## Session N` block to
`context/memory/{YYYY-MM-DD}.md`, tracking goal, deliverables, decisions and open
threads silently as they happen (never announce). A `### Project` reference means
load that brief. On sign-off, run `meta-wrap-up`, finalising the current block.
Template + tracked events: `docs/daily-memory.md`.
