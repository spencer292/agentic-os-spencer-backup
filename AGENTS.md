# AGENTS.md

Shared project instructions for Agentic OS.

`AGENTS.md` is the canonical instruction file for this repository. Codex reads it directly. Claude Code reads it through `CLAUDE.md` via `@AGENTS.md`.

---

## What This Project Is

Agentic OS is a Claude Code project template that turns Claude into an intelligent business assistant. It is **agent-first**: personality lives in `context/SOUL.md`, user preferences in `context/USER.md`, session continuity in `context/memory/`, accumulated learnings in `context/learnings.md`, brand memory in `brand_context/`, and functionality in `.claude/skills/`.

Claude remains the primary runtime interface. `AGENTS.md` exists so the shared operating rules, registries, and project conventions also work cleanly in Codex and other tools that support the standard file.

The full specification lives in `PRD.md`. Read it when building any new component.

---

## Operating Rules

### Skill & MCP Reconciliation

Compare what is on disk against what is registered. Fix additions silently. Confirm removals with the user. Full registration steps in `docs/building-skills.md`.

- **New skill on disk, not registered?** Read its frontmatter + `SKILL.md`, add to Skill Registry and Context Matrix in `AGENTS.md` (and their mirrors in `docs/`), add section to `context/learnings.md`, scan for external service dependencies, update README. Tell the user what was registered.
- **Skill registered but folder missing?** Ask before removing from `AGENTS.md`, README, and `context/learnings.md`.
- **New MCP in `settings.json`, not in README?** Add it under a Connected Tools section and tell the user.
- **Documented MCP removed from `settings.json`?** Ask before removing from README.
- **New external service detected?** Add to Service Registry, `.env.example`, and README. Tell the user the fallback.

### Skill Local Overrides

Every skill can have a `SKILL.local.md` alongside its `SKILL.md`:

- `SKILL.md` — base definition, shipped by upstream, never modified by the user
- `SKILL.local.md` — user-owned additions: extra `## Rules` entries, section overrides, context notes

**When invoking any skill:** check if `.claude/skills/{skill-name}/SKILL.local.md` exists. If it does, read it alongside `SKILL.md`. Local rules take precedence over the base. This file is never overwritten by updates.

**Format:** same structure as `SKILL.md`. At minimum, a `## Rules` section with dated entries:
```
## Rules
- 2026-05-03: always do X when Y
```

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
| "remove a skill", "uninstall {skill}" | Run `bash scripts/remove-skill.sh {skill-name}` |
| "add a skill", "install {skill}" | Run `bash scripts/add-skill.sh {skill-name}` |
| "synthesize skills", "sync local overrides", "clean up local files" | Run `meta-synthesize-locals` skill |
| "list skills", "what skills are installed" | Run `bash scripts/list-skills.sh` |
| "start crons", "start scheduled jobs" | Run `bash scripts/start-crons.sh` |
| "stop crons", "stop scheduled jobs" | Run `bash scripts/stop-crons.sh` |
| "cron status", "status crons" | Run `bash scripts/status-crons.sh` |
| "cron logs", "logs crons" | Run `bash scripts/logs-crons.sh` |
| "setup memory", "memory setup", "enable searchable memory" | Run `bash scripts/setup-memory.sh` |

### Add Client Flow

When the user asks to add a client:
1. Ask for the client name if not provided.
2. Run `bash scripts/add-client.sh "{name}"`.
3. Tell them how to switch: `cd {absolute path}/clients/{slug} && claude`
4. Link to `docs/multi-client-guide.md` for the full structure.

### Branching Policy

**Trunk-based. `main` is the only long-lived branch — commit everything directly to it.**

There are no `dev` or `feature/*` branches in the normal workflow. Content, config, and code all
commit straight to `main`. Push after committing so work is backed up to GitHub.

**What "protected" means here (soft-safe, not a PR gate):**
- **CI runs on every push to `main`** (`.github/workflows/ci.yml`) — that is the safety net.
- Every commit is pushed to `origin` so nothing lives only on the local machine.
- **Never force-push and never delete `main`.**
- There is no GitHub-enforced PR gate (the repo is private on a free plan, so branch protection
  rules are unavailable — and a hard PR gate would contradict committing directly to `main`).

**The one judgement call:** for a genuinely risky, multi-commit **code** change (`command-centre/src/**`,
`.claude/hooks/*.js`) that could leave `main` broken mid-way, use a short-lived local branch and merge
it back when it's green. Everything else — content, skills, docs, config — goes straight to `main`.

**Note:** the `ops-new-feature` and `ops-release` skills still exist and work if invoked directly, but
the default workflow no longer routes through them. Don't auto-suggest creating feature branches.

### Before Major Deliverables

- Load the relevant `brand_context/` files per `docs/context-matrix.md`
- Check `context/learnings.md` for the current skill's section
- If brand context is missing, offer to build it; never block work because context is incomplete

### After Major Deliverables

- Ask: "How did this land? Any adjustments?"
- Log feedback to `context/learnings.md` under the skill's section
- If gaps were spotted, mention once with opportunity framing

### Autonomous Goals — Pre-Goal Readiness Check

When a goal is set that will run **unattended** — the user steps away, says "run until done," sets a `/goal` with autonomous intent, or otherwise expects completion without supervision — produce a **Pre-Goal Readiness Check and get sign-off BEFORE starting the run.** Never begin an unattended run without it. The point is that the user learns *up front* exactly what will need them, so nothing blocks silently while they are away.

The readiness check states three buckets explicitly, every time:

1. **Needs your approval / decision** — every gate only the user can clear. Get each one pre-approved now, or list it as a known pause.
2. **Pauses if I stop running** — every step that is **not** backed by a cron job or a deployed workflow, i.e. that only happens while Claude is actively working (driving gates, rendering, choosing titles, looping). These are **not** unattended-safe. State them plainly.
3. **Can stall silently** — external dependencies that can drop work without erroring (flaky n8n/Notion triggers, third-party async processing like Descript/transcription, Drive sync lag, API rate limits), each with how it will be detected and retried.

**Hard rule:** never describe a goal as "fully hands-off / you can walk away" unless **every** step is genuinely cron- or workflow-backed. If bucket 2 is non-empty, either (a) build that step into a real automation *before* the run, or (b) tell the user up front which parts will wait for them or for Claude. Self-resumption timers are not a dependable unattended engine — treat anything that depends on Claude looping as bucket 2.

When the run ends or pauses, report back **against the same three buckets** so the user sees exactly what completed, what is waiting on them, and what stalled.

---

## Memory System

Layered memory architecture. Different files serve different roles, with explicit caps on the ones loaded at session start to keep the prefix cache stable.

### File Roles

| File | Purpose | Cap | Loaded when |
|------|---------|-----|-------------|
| `context/SOUL.md` | Agent identity | ~3 KB | Session start (silent) |
| `context/USER.md` | User profile and preferences | ~1.5 KB | Session start (silent) |
| `context/MEMORY.md` | Curated working scratchpad — durable facts, active threads, environment notes, pending decisions | **2,500 chars** | Session start (silent) |
| `context/memory/{YYYY-MM-DD}.md` | Daily session log (chronological, per-session blocks) | unbounded | Session start (today's only) |
| `context/memory/{YYYY-MM-DD}.aos.md` | Machine-owned Stop-hook capture: one summarized block per turn; tracked for private GitHub backup and reindexing | unbounded | Indexed only; not loaded at session start |
| `context/transcripts/{YYYY-MM-DD}/*.jsonl` | Raw transcript archives for captured turns | unbounded | Local audit/deep-search source; not committed |
| `context/learnings.md` | Skill-specific learnings | unbounded | Per-skill (lazy) |

### Automatic Capture

On each Stop hook, Agentic OS archives the raw transcript locally, summarizes the last turn into 2-10 third-person bullets, appends that block to `context/memory/{YYYY-MM-DD}.aos.md`, and refreshes the memory index in the background. Re-running the same turn is safe: the capture is keyed by a SHA-256 hash of the source turn, so it does not create duplicate blocks. The `.aos.md` summaries are tracked so private GitHub backups can rebuild memory with a new chunking or embedding pipeline later; raw transcripts remain local and gitignored.

Capture summary settings live in `context/memory-config.json` under `capture.summarize`. Defaults: `provider=claude`, `model=haiku`, `timeout_ms=120000`. If summarization fails, capture falls back to a bounded raw-turn summary so the Stop hook still preserves the turn.

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

Triggered by phrases like "remember this", "remember that", "note that", "save this to memory", "update memory", "log this", "forget about", "remove from memory". Routes to the `meta-memory-write` skill.

Three actions:

- **add** — append under the appropriate section (after a substring dedup check)
- **replace** — find substring + swap
- **remove** — show the line to the user and confirm before deleting

Sections in `context/MEMORY.md`:

- `## Active Threads` — current work, open questions
- `## Environment Notes` — URLs, configs, tool versions, project structure quirks
- `## Pending Decisions` — decisions waiting on input

Do not create new sections. If a fact doesn't fit, ask the user where it belongs.

After a write, confirm with: `Saved — will be active from next session.`

Never store secret values in `context/MEMORY.md` — reference env var names only (e.g., `FIRECRAWL_API_KEY in .env`).

### Memory Retrieval

**Ground-truth rule — memory is a hint, live state is the truth.** Memory files (`MEMORY.md`, daily logs, recall results) are point-in-time snapshots that can go stale silently. Before acting on any memory claim about *current* state — a folder is empty, a step is undone, a tool is broken, a file is missing — verify against live state first (`ls` the folder, run a memory recall, read the file). Never trigger a redundant or destructive action (re-run `/start-here`, re-index, reset) on the strength of a remembered claim alone. If live state contradicts memory, trust live state and fix the note.

When the user asks about past context, decisions, or facts:

1. **Tier 0** — Check `context/MEMORY.md` and today's daily log. Already in context, zero cost. Covers most durable-fact lookups.
2. **Tier 1** — If Tier 0 has nothing, run semantic search over the PGLite/pgvector store (the default backend). From `command-centre/`:
   - Run `npm run memory:recall -- "query" --system` (or `--team <id>` / `--client <slug>` / `--user <id>` to search as that tenant — each also includes the `system` baseline). Results come back scope-filtered and re-ranked by source authority and recency. Summarise the top 5. Add `--json` for machine-readable output.
   - The search is scope-isolated by construction (one tenant never sees another's memory) and writes a max-privacy `search_events` audit row (no query text or embedding stored by default).
   - _Backend:_ all memory commands run against **local PGLite** by default, or **hosted Postgres** when `MEMORY_DATABASE_URL` (or `DATABASE_URL`) is set — same schema either way. Pin it with `MEMORY_STORE_BACKEND=pglite|postgres`; `postgres` refuses to fall back to the local store if no URL is set.
   - Legacy `MEMORY_BACKEND=memsearch` is no longer supported. If old `.memsearch` folders exist, run `bash scripts/setup-memory.sh` to index them into PGLite/Postgres and archive them.
   Indexed sources: `context/memory/` and `context/learnings.md`. Old `.memsearch/memory/` folders are import-only and are passed explicitly during `scripts/setup-memory.*` migration.
3. **Cite sources** — structure every recall response based on what was found:

   **Found:** answer + cite source inline ("Based on the session log from 2026-05-11 and a decision in MEMORY.md...") + temporal context ("This was last discussed 3 days ago"). If the source is >14 days old: "Note: this information is from [date] — it may be outdated."

   **Partial:** state what you know + what you don't + where you looked + temporal gap ("Last mention of [topic] was [date]. No records since then.") + what might fill the gap.

   **Absent:** "I checked MEMORY.md, daily logs back to [earliest date], and ran semantic search across all indexed sources. No mentions of [topic]. If discussed, it may predate capture or occurred in a session that wasn't logged."

   For partial or absent responses: run `bash scripts/lib/memory-meta.sh "[topic]"` to get exact coverage before responding.

Tiers 2-3 (expanded chunks, raw transcript deep-search) are deferred. Do not fabricate sources.

---

## Multi-Client Architecture

Agentic OS supports multiple clients from a single install. The root folder holds shared methodology, shared skills, and shared scripts. Each client gets a subfolder under `clients/` with its own brand context, memory, projects, and learnings.

```text
agentic-os/
├── AGENTS.md                     <- canonical shared instructions
├── CLAUDE.md                     <- Claude wrapper that imports AGENTS.md
├── clients/
│   ├── abc-client/
│   │   ├── AGENTS.md             <- client-specific instructions
│   │   ├── CLAUDE.md             <- Claude wrapper importing local AGENTS.md
│   │   ├── brand_context/
│   │   ├── context/
│   │   ├── projects/
│   │   └── .claude/skills/
│   └── xyz-agency/
│       └── ...
├── brand_context/
├── context/
└── .claude/skills/
```

Full guide: [docs/multi-client-guide.md](docs/multi-client-guide.md)

---

## Three-Layer Architecture

| Layer | Files | Purpose |
|-------|-------|---------|
| **Agent Identity** | `AGENTS.md`, `CLAUDE.md`, `context/SOUL.md`, `context/USER.md` | Shared operating rules plus Claude-specific runtime behavior |
| **Skills Pack** | `.claude/skills/{category}-{skill-name}/` | Capabilities that grow over time |
| **Brand Context** | `brand_context/` | Client brand data |

Secrets and machine-generated stores are gitignored: `.env`, `.mcp.json`, `installed.json`, the runtime memory stores (`**/.command-centre/`, `.memsearch/`), raw transcripts (`context/transcripts/`), and database backups (`backups/`). The **source content** — `context/memory/*.md` daily logs, `context/memory/*.aos.md` summarized captures, `context/learnings.md`, `context/MEMORY.md`, `brand_context/`, and `projects/` — is **tracked** for private GitHub backups, so keep personal or client data out of public commits. See `.gitignore` for the full list.

---

## Skill Categories

Every skill and its output folder uses a category prefix.

| Prefix | Domain | Examples |
|--------|--------|----------|
| `mkt` | Marketing | `mkt-brand-voice`, `mkt-positioning`, `mkt-icp`, `mkt-email-sequence` |
| `str` | Strategy | `str-keyword-plan`, `str-competitor-analysis` |
| `ops` | Operations / File Mgmt | `ops-client-onboarding`, `ops-gdrive-sync` |
| `viz` | Visual / Video | `viz-thumbnail-creator`, `viz-ugc-generator` |
| `acc` | Accounting | `acc-invoice-generator`, `acc-expense-tracker` |
| `meta` | System / Meta | `meta-skill-creator`, `meta-wrap-up` |
| `tool` | Utility / Integration | `tool-firecrawl-scraper` |
| `vid` | Video Processing | `vid-clip-extractor`, `vid-clip-selection`, `vid-ffmpeg-edit` |
| `00` | Pipelines / Orchestrators | `00-longform-to-shortform`, `00-social-content`, `00-slides` |

**Rules:**
- Skill folder name = `{category}-{skill-name}` in kebab-case
- YAML frontmatter `name` field must match the folder name exactly
- Output folders use the same category prefix: `projects/{category}-{output-type}/`
- Learnings sections in `context/learnings.md` use `## {folder-name}`
- Add new categories only when the first skill in a new domain is built

---

## Skill Registry

*Auto-populated as skills are installed. Each entry includes its name and trigger conditions.*

### Pipeline Skills (00-*)

End-to-end orchestrators that chain multiple skills.

| Skill | Triggers on |
|-------|-------------|
| `00-longform-to-shortform` | "full pipeline", "process video", "long to short", "YouTube to shorts", "create short-form content from" |
| `00-slides` | "create a presentation", "create slides", "make a deck", "slide deck", "presentation about" |
| `00-social-content` | "run social content", "generate post", "create post", "post linkedin", "from my sources", "just the images" |
| `00-video-studio` | "process studio inbox", "studio video", "make a clip from", "turn this footage into a reel", "video studio", "process my drops" |
| `00-youtube-to-ebook` | "turn this video into an ebook", "youtube to article", "video to PDF", "youtube to ebook" |

### Meta Skills

| Skill | Triggers on |
|-------|-------------|
| `meta-skill-creator` | "create a skill", "build a skill", "new skill", "make a skill", "optimize skill description" |
| `meta-skill-system-creator` | "create a system", "package these skills", "build a skill system", "system from skills" |
| `meta-synthesize-locals` | "synthesize skills", "sync local overrides", "clean up local files" |
| `meta-wrap-up` | "wrap up", "close session", "end session", "we're done", "session done" |
| `meta-memory-write` | "remember this", "remember that", "note that", "save this to memory", "update memory", "log this", "forget about", "remove from memory" |

### Foundation Skills

| Skill | Triggers on | Writes to |
|-------|-------------|-----------|
| `mkt-brand-voice` | "tone", "writing style", "brand voice", "how we sound" | `voice-profile.md`, `samples.md` |
| `mkt-positioning` | "differentiation", "angle", "hooks", "USP" | `positioning.md` |
| `mkt-icp` | "target audience", "buyer persona", "ideal customer" | `icp.md` |
| `mkt-visual-identity` | "visual identity", "brand identity", "design tokens", "brand bible", "replicate this style" | `visual-identity/` (tokens, identity, moves, fonts, logos) |

### Marketing Skills

| Skill | Triggers on |
|-------|-------------|
| `mkt-content-analytics` | "check analytics", "how did my post do", "post performance", "compare my posts" |
| `mkt-content-repurposing` | "repurpose this", "turn this into social posts", "atomize this", "LinkedIn post from this", "thread from this" |
| `mkt-copywriting` | "write copy for", "landing page copy", "sales page", "make this convert", "ad copy", "score this copy" |
| `mkt-longform-article` | "write an article from this transcript", "turn this video into a long-form piece", "magazine-style article" |
| `mkt-short-form-posting` | "post short", "post reel", "upload short", "post to youtube instagram tiktok" |
| `mkt-ugc-scripts` | "write a script", "UGC script", "TikTok script", "Reels script", "batch scripts" |
| `mkt-social-showing` | "social showing", "make this post viral", "optimize this post", "write the hook for", "package this for social", "make this travel" |
| `mkt-youtube-content-package` | "publish a video", "create YouTube content", "video SEO" |

### Strategy Skills

| Skill | Triggers on |
|-------|-------------|
| `str-ai-seo` | "AI SEO", "AEO", "GEO", "LLMO", "answer engine optimization", "AI citations", "AI visibility", "optimize for ChatGPT/Perplexity/Claude", "show up in AI answers" |
| `str-trending-research` | "research", "what's trending", "what are people saying about", "last 30 days", "community sentiment on" |

### Visual Skills

| Skill | Triggers on |
|-------|-------------|
| `viz-excalidraw-diagram` | "excalidraw diagram", "draw a diagram", "architecture diagram", "visualize this workflow" |
| `viz-frontend-slides` | "build slides", "render presentation", "HTML deck", "slide design" |
| `viz-hyperframes` | "make a motion graphics video", "product video", "launch teaser", "animated explainer" |
| `viz-image-gen` | "generate an image", "create an infographic", "make an image of", "sketchnote" |
| `viz-nano-banana` | "nano banana", "notebook sketch", "comic strip", "hand-drawn diagram", "illustrated diagram" |
| `viz-stitch-design` | "design a UI", "create a screen", "stitch design", "UI mockup", "app design", "landing page design", "mobile screen", "web layout", "wireframe to UI", "design this page" |
| `viz-interface-design` | "dashboard", "admin panel", "SaaS UI", "data interface", "metrics display", "control panel", "monitoring UI", "analytics view", "settings page", "interactive tool interface" |
| `viz-remotion-video` | "remotion video", "explainer video", "course video", "animated explainer", "build a lesson video", "two-host explainer", "notebooklm-style video", "turn this transcript into a video", "motion graphics from script", "make a course video" |

### Video Skills

| Skill | Triggers on |
|-------|-------------|
| `vid-clip-extractor` | "extract clips", "reframe video", "portrait crop", "face tracking", "16:9 to 9:16" |
| `vid-clip-selection` | "select clips", "find best clips", "extract shorts from transcript" |
| `vid-condensed-edit` | "condensed edit", "best bits edit", "highlight episode", "condensed YouTube version", "cut this episode down for YouTube" |
| `vid-ffmpeg-edit` | "edit clip", "add subtitles", "burn captions", "edit short-form" |

### Operations Skills

| Skill | Triggers on |
|-------|-------------|
| `ops-new-feature` | "new feature", "start feature", "add feature", "begin work on", "start working on", "finish feature", "done with feature", "merge feature", "feature done", "merge this" |
| `ops-release` | "release", "cut a release", "bump version", "ship it", "new version", "tag a release" |
| `ops-cron` | "schedule a job", "cron job", "run this every morning", "automate daily", "recurring task", "scheduled job", "check scheduled jobs", "list jobs", "run job manually", "start crons", "stop crons", "cron status", "cron logs" |
| `ops-google-ads` | "google ads", "ads audit", "ads review", "campaign status", "keyword research for ads", "build a campaign", "negative keywords", "RSA", "PPC audit", "ad spend", "conversion tracking check", "quality score" |

### Utility Skills

| Skill | Triggers on |
|-------|-------------|
| `tool-fact-checker` | "fact check", "verify this", "is this true", "check these claims" |
| `tool-firecrawl-scraper` | "scrape website", "crawl site", "monitor content changes", "extract brand/design systems" |
| `tool-humanizer` | "humanize this", "de-AI this", "make this sound human", "remove AI patterns" |
| `tool-image-search` | "find images of", "search images", "stock photo of" |
| `tool-linkedin-scraper` | "scrape linkedin", "linkedin posts", "fetch linkedin profile" |
| `tool-pdf-generator` | "generate PDF", "convert to PDF", "markdown to PDF" |
| `tool-platform-security` | "security audit", "scan for secrets", "secret scan", "any leaked keys", "audit dependencies", "is this repo safe to push", "security check before commit", "check git history for secrets" |
| `tool-publisher` | "post this", "publish this", "post now" |
| `tool-screenshot-annotator` | "annotate this screenshot", "add numbered circles", "mark up this image" |
| `tool-stitch` | "fetch stitch design", "get stitch screens", "stitch project", "pull from stitch", "stitch code", "export stitch" |
| `tool-transcription` | "transcribe this file", "local video", "from this recording" |
| `tool-video-screenshots` | "screenshot from video", "extract frames", "capture slides from video" |
| `tool-video-upload` | "upload video", "compress video for YouTube" |
| `tool-web-screenshot` | "screenshot this website", "capture this page", "screenshot URL" |
| `tool-website-security` | "website security audit", "audit this site", "is this website secure", "check security headers", "scan this URL for security", "TLS/SSL check", "check SPF/DMARC" |
| `tool-youtube` | "latest youtube video", "youtube transcript", "channel updates" |
| `tool-zernio-social` | "post to", "schedule post", "cross-post", "publish to twitter/instagram/linkedin" |

*Optional skills are auto-registered by reconciliation when their folders appear on disk. Install optional skills with `bash scripts/add-skill.sh <name>`. See `.claude/skills/_catalog/catalog.json` for the full list.*

---

## Context Matrix

Load only the `brand_context/` files listed for each skill.

| Skill | voice-profile | positioning | icp | samples | assets | learnings |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| `mkt-brand-voice` | **writes** | summary | — | **writes** | **writes** (via firecrawl branding) | `## mkt-brand-voice` |
| `mkt-positioning` | — | **writes** | full | — | — | `## mkt-positioning` |
| `mkt-icp` | — | summary | **writes** | — | — | `## mkt-icp` |
| `meta-wrap-up` | — | — | — | — | — | `## meta-wrap-up` |
| `meta-memory-write` | — | — | — | — | — | `## meta-memory-write` |
| `str-ai-seo` | tone only | summary | full | — | — | `## str-ai-seo` |
| `tool-stitch` | — | — | — | — | — | `## tool-stitch` |
| `viz-stitch-design` | tone only | summary | language section | — | — | `## viz-stitch-design` |
| `viz-interface-design` | tone only | summary | language section | — | — | `## viz-interface-design` |
| `viz-remotion-video` | tone only | — | language section | — | tokens (design-system) | `## viz-remotion-video` |
| `ops-cron` | — | — | — | — | — | `## ops-cron` |
| `ops-google-ads` | — | — | — | — | — | `## ops-google-ads` |
| `ops-new-feature` | — | — | — | — | — | `## ops-new-feature` |
| `ops-release` | — | — | — | — | — | `## ops-release` |
| `00-longform-to-shortform` | — | — | — | — | — | `## 00-longform-to-shortform` |
| `00-slides` | tone only | — | — | — | — | `## 00-slides` |
| `00-social-content` | full | summary | summary | full | — | `## 00-social-content` |
| `00-video-studio` | tone only | — | — | — | tokens + music | `## 00-video-studio` |
| `00-youtube-to-ebook` | tone only | — | — | — | logo + links | `## 00-youtube-to-ebook` |
| `meta-skill-creator` | — | — | — | — | — | `## meta-skill-creator` |
| `meta-skill-system-creator` | — | — | — | — | — | `## meta-skill-system-creator` |
| `meta-synthesize-locals` | — | — | — | — | — | `## meta-synthesize-locals` |
| `mkt-content-analytics` | — | — | — | — | — | `## mkt-content-analytics` |
| `mkt-content-repurposing` | full | summary | summary | full | — | `## mkt-content-repurposing` |
| `mkt-copywriting` | full | summary | full | full | — | `## mkt-copywriting` |
| `mkt-longform-article` | tone only | — | — | — | — | `## mkt-longform-article` |
| `mkt-short-form-posting` | — | — | — | — | — | `## mkt-short-form-posting` |
| `mkt-ugc-scripts` | full | summary | language section | full | — | `## mkt-ugc-scripts` |
| `mkt-visual-identity` | — | — | — | — | **writes** (visual-identity/) | `## mkt-visual-identity` |
| `mkt-social-showing` | full | summary | full | — | — | `## mkt-social-showing` |
| `mkt-youtube-content-package` | — | — | — | — | — | `## mkt-youtube-content-package` |
| `str-trending-research` | — | — | language section | — | — | `## str-trending-research` |
| `tool-fact-checker` | — | — | — | — | — | `## tool-fact-checker` |
| `tool-firecrawl-scraper` | — | — | — | — | — | `## tool-firecrawl-scraper` |
| `tool-humanizer` | full | — | — | full | — | `## tool-humanizer` |
| `tool-image-search` | — | — | — | — | — | `## tool-image-search` |
| `tool-linkedin-scraper` | — | — | — | — | — | `## tool-linkedin-scraper` |
| `tool-pdf-generator` | — | — | — | — | — | `## tool-pdf-generator` |
| `tool-platform-security` | — | — | — | — | — | `## tool-platform-security` |
| `tool-publisher` | — | — | — | — | — | `## tool-publisher` |
| `tool-screenshot-annotator` | — | — | — | — | accent color | `## tool-screenshot-annotator` |
| `tool-transcription` | — | — | — | — | — | `## tool-transcription` |
| `tool-video-screenshots` | — | — | — | — | — | `## tool-video-screenshots` |
| `tool-video-upload` | — | — | — | — | — | `## tool-video-upload` |
| `tool-web-screenshot` | — | — | — | — | — | `## tool-web-screenshot` |
| `tool-website-security` | — | — | — | — | — | `## tool-website-security` |
| `tool-youtube` | — | — | — | — | — | `## tool-youtube` |
| `tool-zernio-social` | — | — | — | — | — | `## tool-zernio-social` |
| `vid-clip-extractor` | — | — | — | — | — | `## vid-clip-extractor` |
| `vid-clip-selection` | — | — | — | — | — | `## vid-clip-selection` |
| `vid-condensed-edit` | — | — | language section | — | — | `## vid-condensed-edit` |
| `vid-ffmpeg-edit` | — | — | — | — | highlight color | `## vid-ffmpeg-edit` |
| `viz-excalidraw-diagram` | — | — | — | — | — | `## viz-excalidraw-diagram` |
| `viz-frontend-slides` | tone only | — | — | — | tokens (full) | `## viz-frontend-slides` |
| `viz-hyperframes` | tone only | — | — | — | tokens (full) | `## viz-hyperframes` |
| `viz-image-gen` | — | — | — | — | — | `## viz-image-gen` |
| `viz-nano-banana` | — | — | — | — | — | `## viz-nano-banana` |

**Matrix key:** `writes` = creates file | `full` = entire file | `summary` = 1-2 sentences | `tone only` = tone + vocabulary | `language section` = words-they-use section | `## skill-name` = read only that section from `context/learnings.md`

**Learnings rule:** Every skill reads and writes to its own section in `context/learnings.md`. Cross-skill insights go under `# General`. Skill-specific entries go under `# Individual Skills` → `## {folder-name}`.

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

| Level | Name | When | Where |
|-------|------|------|-------|
| **1** | Single task | One or a few small deliverables | `projects/{category}-{type}/` |
| **2** | Planned project | Multi-deliverable work that benefits from a brief | `projects/briefs/{project-name}/` |
| **3** | GSD project | Complex multi-phase work with dependencies | `projects/briefs/{project-name}/` + `.planning/` |

**Level 2 brief requirements:** goal, deliverables, acceptance criteria, constraints, and dependencies. Keep it to one page.

**Level 3 rule:** GSD's `.planning/` folder lives at the root of each client workspace — `clients/{name}/.planning/`. Each client runs its own independent GSD project; multiple clients can be active in parallel. The root `agentic-os/` folder must never have `.planning/` — keeping it clean is what allows per-client isolation. To start a GSD project for a client, select that client in the command-centre and run `/gsd-new-project`. Archive finished GSD work with `/archive-gsd` (flips the brief's status to complete and keeps `.planning/` in place).

**Project containment rule:** The Agentic OS root is the operating system, not a place for project outputs. All project source code, configs, manifests, build artifacts, and data files must live inside the project folder.

**Brief frontmatter:**

```yaml
---
project: q2-product-launch
status: active
level: 2
created: 2026-03-24
---
```

### Humanizer Gate

Every skill that produces publishable text must run its output through `tool-humanizer` before saving.

- Use `deep` mode when `brand_context/voice-profile.md` exists, otherwise `standard`
- Only show the score summary if the delta is significant
- Research briefs, ICP profiles, and positioning docs can skip this step

---

## Building New Skills

Full guide in `docs/building-skills.md`. Always ask for reference skills first. Never guess at methodology. After building, add rows to the Skill Registry (`docs/skill-registry.md`) and Context Matrix (`docs/context-matrix.md`).

---

## Graceful Degradation

Skills work at all context levels:
- **No `brand_context/`:** ask what is needed and produce solid generic output
- **Partial context:** use what exists and default the rest
- **Full context:** personalise fully

Brand context enhances output. It never gates functionality.

---

## External Services & API Keys

Some skills use external services for enhanced functionality. API keys are stored in `.env` (gitignored). `.env.example` documents all available keys.

### Service Registry

| Service | API Key | Used by | What it enables | Without it |
|---------|---------|---------|-----------------|------------|
| Firecrawl | `FIRECRAWL_API_KEY` | `tool-firecrawl-scraper`, `mkt-brand-voice` (Auto-Scrape) | JS-heavy site scraping, anti-bot bypass, brand asset extraction | Falls back to WebFetch and then manual paste |
| OpenAI | `OPENAI_API_KEY` | `str-trending-research`, `viz-remotion-video` (image fallback) | Reddit search via Responses API with `web_search`; `gpt-image-1` illustration fallback | Falls back to WebSearch / Gemini images |
| xAI | `XAI_API_KEY` | `str-trending-research` | X/Twitter search via xAI API with `x_search` | Falls back to WebSearch without engagement metrics |
| YouTube Data API v3 | `YOUTUBE_API_KEY` | `tool-youtube` | Channel video listing, handle resolution, search | Direct URL transcript mode still works |
| Google Gemini | `GEMINI_API_KEY` | `viz-nano-banana`, `viz-remotion-video` (illustrations + Veo) | Image generation (Nano Banana / Gemini 3 Pro Image) and Veo 3.1 image-to-video hero clips | OpenAI `gpt-image-1` fallback for images; no Veo fallback |
| Google Stitch | gcloud auth | `tool-stitch`, `viz-stitch-design` | UI design generation and export | No fallback |
| Zernio | `ZERNIO_API_KEY` | `tool-zernio-social`, `tool-publisher`, `tool-video-upload`, `mkt-short-form-posting`, `mkt-content-analytics`, `mkt-youtube-content-package`, `00-longform-to-shortform` | Social media posting, scheduling, video upload, and analytics across YouTube/Instagram/TikTok/LinkedIn | Content packages are generated but not published — manual posting |
| Groq | `GROQ_API_KEY` | `00-longform-to-shortform`, `tool-transcription` | Fast Whisper transcription | Falls back to local WhisperX (slower) |
| AssemblyAI | `ASSEMBLYAI_API_KEY` | `00-video-studio` (talking-head captions + smart cut), podcast video render | Cloud transcription with word-level timestamps | Falls back to Groq, then local WhisperX |
| ElevenLabs | `ELEVENLABS_API_KEY` | `00-video-studio` (music beds), `viz-remotion-video` (voiceover + music) | AI music generation (Eleven Music), cloned/host voiceover with word-level timestamps | No music bed / no narration — use a library track or skip |
| Apify | `APIFY_API_KEY` | `tool-linkedin-scraper` | LinkedIn profile/post scraping | No fallback — ask user to paste content |
| ScreenshotOne | `SCREENSHOTONE_API_KEY` | `tool-web-screenshot` | Rendered webpage screenshots | Falls back to local Playwright capture |
| Unsplash / Pexels | `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY` | `tool-image-search` | Stock photo search | Falls back to Openverse (no key needed) |
| Descript | `DESCRIPT_API_TOKEN` | podcast ingest daemon, `vid-condensed-edit` flow | Auto-import recordings, programmatic filler-word removal, composition export | Manual import/edit/export in Descript app |
| Zoom | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` | podcast ingest daemon | Cloud-recording listing/download + backfill (S2S OAuth) | Webhook download token only (24h window) |
| Google Ads | `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_CUSTOMER_ID` | `ops-google-ads` | Programmatic Google Ads management — audit, keyword research, campaign build/restructure, negative-list management, RSA review, conversion checks, reporting (Google Ads API, no SDK) | No fallback — manual management in the Google Ads UI |
| Local PGLite + pgvector | _(none — keyless, default)_ | `npm run memory:recall` / `memory:index` (command-centre) | Default semantic memory store. Local, scope-isolated, BGE-M3 embeddings. Set up/reindex with `scripts/setup-memory.sh`. | n/a — this is the default |
| Hosted Postgres + pgvector | `MEMORY_DATABASE_URL` (or `DATABASE_URL`); optional `MEMORY_STORE_BACKEND` | `npm run memory:migrate` / `memory:index` / `memory:search` / `memory:recall` / `memory:backup` / `memory:restore` (command-centre) | Optional hosted team memory: same schema + pgvector as local PGLite, as a central source of truth on Railway/VPS. When the URL is set, every memory command routes to hosted Postgres. | Local PGLite memory still works fully; no shared/team memory |
| Hosted Memory API | `MEMORY_API_TOKEN` (+ optional `MEMORY_API_PORT`) | `npm run memory:api` (command-centre) | Optional HTTP boundary over the hosted memory store (`POST /v1/memory/search` + `/v1/memory/ingest`) with server-side scope validation, embedding, and audit. | Direct DB access via `MEMORY_DATABASE_URL`, or local PGLite via the CLI |

### Rules for Skills Using External Services

1. Check for the required key before using any external API
2. Tell the user clearly what the service does, what they lose without it, where to sign up, and where to put the key
3. Always define a fallback whenever possible
4. Do not block work when the fallback produces usable output
5. Update `.env.example` when adding a new external service

---

## Permissions

`.claude/settings.json` allows: `cat`, `ls`, `npm run *`, basic git commands, and edits to `/src/**`

Denied: package installs, `rm`/`curl`/`wget`/`ssh`, reading `.env`/`.env.local` or credential files. `.env.example` is readable and editable.
