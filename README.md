# Agentic OS

Turn Claude Code into your Agentic Operating System.

Agentic OS gives Claude Code personality, memory, and skills so it works like a team member, not a chatbot. It remembers your brand voice, learns your preferences over time, and runs proven methodologies instead of winging it every session.

---

## Quickstart

Install [Git](https://git-scm.com/downloads) first. Git is required to clone Agentic OS and receive updates.

```bash
git clone https://<YOUR-TOKEN>@github.com/simonc602/agentic-os.git
cd agentic-os
bash scripts/centre.sh
```

**Test edit**: Added this line to test file editing permissions at 2026-04-16.

Replace `<YOUR-TOKEN>` with the access token from the [Agentic Academy classroom](https://www.skool.com/scrapes/classroom/d1cfafed?md=552b0ba753df4c738843913fb3eb8312).

On first launch, `centre.sh` runs the guided bootstrap automatically. It checks your system, prepares the local files Agentic OS needs, repairs missing dependencies when needed, and asks the one-time setup questions.

For private GitHub backup, the installer recommends [GitHub CLI](https://cli.github.com/). It can help create a private backup repository in your GitHub account. If it is missing, the installer offers to install it or shows a manual fallback. The backup includes memory source files under `context/memory/`, including `.aos.md` auto-captures used for future reindexing; raw transcripts and built memory stores stay local.

When it finishes, open Claude Code. It automatically detects you're new and walks you through building your brand foundation -- voice, positioning, and ideal customer profile.

On Windows, use:

```powershell
powershell -File scripts\centre.ps1
```

### Launching the command centre

After the first guided launch, you can keep using:

```bash
centre
```

That's it. The `centre` command reuses the saved launcher state, repairs missing bootstrap files silently when needed, starts the Next.js dev server, and opens `http://localhost:3000` in your browser.

`install.sh` and `setup.sh` still exist for manual maintenance:
- `bash scripts/install.sh` runs the guided installer directly.
- `bash scripts/install.sh --repair` repairs only the local bootstrap files.
- `bash scripts/setup.sh` refreshes dependency checks without launching the UI.

On Windows, the guided install can optionally add `centre` to both Windows PowerShell and PowerShell 7 profiles. If you prefer not to install the shortcut, keep using `powershell -File scripts\centre.ps1`.

Compatibility note: Agentic OS remains Claude-first, but the shared project instructions now live in `AGENTS.md`. Claude reads them through `CLAUDE.md`, and Codex can read `AGENTS.md` directly.

---

## What You Get

Agentic OS is built on three layers:

1. **Agent Identity** -- Personality (SOUL.md), your profile (USER.md), and session memory. This is what makes it feel like working with someone who knows your business.

2. **Skills** -- Modular capabilities that can be added or removed. Each skill follows a tested methodology and self-improves as you give feedback -- corrections go directly into the skill, not just a note.

3. **Brand Context** -- Your voice, positioning, and ideal customer profile. Skills load only what they need, so output stays focused and on-brand.

---

## Core Skills (always installed)

| Skill | What it does |
|-------|-------------|
| `meta-skill-creator` | Build custom skills for your business |
| `meta-wrap-up` | End-of-session memory and learning capture |
| `meta-memory-write` | Save durable facts to the curated memory scratchpad |
| `mkt-brand-voice` | Extract your brand voice from content or build it from scratch |
| `mkt-positioning` | Find angles that make your offer stand out |
| `mkt-icp` | Define your ideal customer so every skill speaks to them |

---

## Optional Skills

| Skill | What it does | API key needed |
|-------|-------------|----------------|
| `tool-humanizer` | Strip AI patterns from any output | -- |
| `tool-firecrawl-scraper` | Scrape JS-heavy websites | `FIRECRAWL_API_KEY` |
| `tool-youtube` | Pull YouTube transcripts and channel listings | `YOUTUBE_API_KEY` (channel mode only) |
| `str-trending-research` | Research trending topics across Reddit, X, and the web | `OPENAI_API_KEY` + `XAI_API_KEY` |
| `mkt-copywriting` | Sales copy with 7-dimension scoring | -- |
| `mkt-content-repurposing` | Turn one piece of content into posts for 8 platforms | -- |
| `mkt-ugc-scripts` | Short-form video scripts with hook library | -- |
| `mkt-social-showing` | Finished clip → ICP-sharp, hook-first post package + viral scorecard | -- |
| `viz-excalidraw-diagram` | Architecture and workflow diagrams | -- |
| `viz-nano-banana` | AI image generation in 5 visual styles | `GEMINI_API_KEY` |
| `str-ai-seo` | Optimize content for AI search engines and LLM citations | -- |
| `viz-interface-design` | Design dashboards, admin panels, and SaaS UIs | -- |
| `ops-cron` | Schedule recurring Claude Code tasks | -- |
| `ops-google-ads` | Manage Google Ads -- audit, keyword research, campaigns, negatives, reporting | `GOOGLE_ADS_*` |
| `tool-stitch` | Fetch UI designs from Google Stitch projects | gcloud auth |
| `viz-stitch-design` | Design and iterate on UI screens with Google Stitch | gcloud auth |

---

## Extended Skills (installed in this workspace)

Skills added beyond the catalog — registered in `AGENTS.md` via reconciliation.

**Content pipelines (00-*)**

| Skill | What it does | API key needed |
|-------|-------------|----------------|
| `00-longform-to-shortform` | YouTube/video → transcribe → select clips → reframe → captioned shorts | `GROQ_API_KEY`, `ZERNIO_API_KEY` (posting) |
| `00-slides` | Topic/outline/transcript → researched, branded HTML slide deck | -- |
| `00-social-content` | Any input (URL, topic, sources) → platform post + images | `ZERNIO_API_KEY` (posting) |
| `00-video-studio` | Drop videos/photos → auto-cut 9:16 clip (talking-head / highlight / assembly) → review → post | `ASSEMBLYAI_API_KEY`, `ELEVENLABS_API_KEY` (music), `ZERNIO_API_KEY` (posting) |
| `00-youtube-to-ebook` | YouTube video → fact-checked long-form editorial PDF | -- |

**Marketing & strategy**

| Skill | What it does | API key needed |
|-------|-------------|----------------|
| `mkt-content-analytics` | Post performance review and improvement suggestions | `ZERNIO_API_KEY` |
| `mkt-longform-article` | Transcript → magazine-style editorial article | -- |
| `mkt-short-form-posting` | Publish shorts/reels with per-platform content packages | `ZERNIO_API_KEY` |
| `mkt-visual-identity` | Build a brand visual identity + design tokens from any reference | -- |
| `mkt-youtube-content-package` | Title, description, keywords, timestamps, thumbnails for YouTube | `ZERNIO_API_KEY` |

**Video**

| Skill | What it does | API key needed |
|-------|-------------|----------------|
| `vid-clip-extractor` | Reframe 16:9 video to 9:16 with face tracking | -- |
| `vid-clip-selection` | Score and select the best short-form clips from a transcript | -- |
| `vid-condensed-edit` | Condensed 10-15 min best-bits YouTube edit from a full episode | -- |
| `vid-ffmpeg-edit` | Captions, subtitles, and edits via ffmpeg | -- |

**Visual**

| Skill | What it does | API key needed |
|-------|-------------|----------------|
| `viz-frontend-slides` | Render production-quality HTML slide decks | -- |
| `viz-hyperframes` | Motion-graphics videos (teasers, explainers) | -- |
| `viz-image-gen` | Image/infographic generation backend | `OPENAI_API_KEY` or `GEMINI_API_KEY` |

**Utilities**

| Skill | What it does | API key needed |
|-------|-------------|----------------|
| `tool-fact-checker` | Evidence-based claim verification | -- |
| `tool-image-search` | Stock photo search (Unsplash/Pexels/Openverse) | `UNSPLASH_ACCESS_KEY` / `PEXELS_API_KEY` (optional) |
| `tool-linkedin-scraper` | Fetch LinkedIn posts and profiles | `APIFY_API_KEY` |
| `tool-pdf-generator` | Markdown → styled PDF | -- |
| `tool-platform-security` | Static security audit of this codebase (secrets, git-history secrets, dependency CVEs, config/permissions) | -- |
| `tool-publisher` | One-command social publishing | `ZERNIO_API_KEY` |
| `tool-screenshot-annotator` | Numbered annotations on screenshots | -- |
| `tool-transcription` | Transcribe local video/audio (WhisperX) | `GROQ_API_KEY` (optional, faster) |
| `tool-video-screenshots` | Extract frames/slides from video | -- |
| `tool-video-upload` | Compress and upload video | `ZERNIO_API_KEY` |
| `tool-web-screenshot` | Capture webpage screenshots | `SCREENSHOTONE_API_KEY` (optional) |
| `tool-website-security` | Passive security audit of a live website (TLS, headers, cookies, SPF/DMARC, exposure) | -- |
| `tool-zernio-social` | Cross-platform post scheduling | `ZERNIO_API_KEY` |
| `meta-skill-system-creator` | Package multiple skills into installable systems | -- |
| `meta-synthesize-locals` | Clean up verbose SKILL.local.md overrides | -- |

---

## GSD (Get Stuff Done)

GSD is a project management framework for Claude Code. It's a separate install (not bundled with Agentic OS) that adds structured planning, execution, and verification for complex multi-step projects.

**Install GSD:**
```bash
npx -y @opengsd/get-shit-done-redux@latest --global --claude
```

Use it when you're building something with multiple phases -- a product launch, a new feature, a migration. It handles planning, execution, verification, and session continuity. Agentic OS install and update scripts can detect legacy GSD packages/artifacts and ask before cleanup. They never remove `.planning/` folders.

**Key commands:**

| Command | What it does |
|---------|-------------|
| `/gsd-new-project` | Start a new project with deep context gathering |
| `/gsd-plan-phase` | Plan a phase with research, task breakdown, and verification |
| `/gsd-execute-phase` | Execute a plan with atomic commits and state tracking |
| `/gsd-progress` | Check where you are and what's next |
| `/gsd-debug` | Systematic debugging with persistent state |
| `/gsd-quick` | Quick task with GSD guarantees (commits, tracking) |
| `/gsd-verify-work` | Validate features through conversational testing |
| `/gsd-pause-work` | Save context for resuming later |
| `/gsd-resume-work` | Pick up where you left off |
| `/gsd-help` | See all available commands |

GSD and Agentic OS complement each other. Agentic OS handles brand context and skill-driven content production. GSD handles structured project execution when you're building something with phases and milestones.

---

## Managing Skills

```bash
bash scripts/list-skills.sh                  # See what's installed and available
bash scripts/add-skill.sh mkt-copywriting    # Add a skill
bash scripts/remove-skill.sh viz-nano-banana # Remove a skill
```

Dependencies are resolved automatically. If you add a skill that needs another skill, both get installed.

---

## Updating

```bash
bash scripts/update.sh
```

This pulls the latest changes from upstream -- new skills, improved methodologies, bug fixes.

Updates never overwrite your root or client data. For clients, Agentic OS does sync shared system files from the root, including skills, scripts, hooks, settings, and cron templates. Client context, brand data, memory, projects, cron jobs, `.env`, `.claude/settings.local.json`, client-only skills, and `SKILL.local.md` files are preserved.

Updates always come from the official Agentic OS upstream repo. If you set up a private GitHub backup, that repo is usually `origin`; it stores your copy, but `update.sh` does not push there automatically. If your branch has local commits, the updater preserves them. When an upstream merge cannot be completed safely, it stops, keeps your branch at the pre-update commit, and prints recovery steps instead of resetting your branch to upstream.

If you've customised any skills (via feedback, Rules additions, or direct edits), the update script detects this and shows you a diff for each changed skill. You choose per skill: accept our upstream changes, or keep your version. Either way, your version is backed up.

If new skills are available, the script tells you what was added and how to install them.

If the access token has expired or rotated, the update script stops before changing local files and asks for a fresh token. Paste the latest token from the [Agentic Academy classroom](https://www.skool.com/scrapes/classroom/d1cfafed?md=552b0ba753df4c738843913fb3eb8312). The token is visible while you paste it so you can confirm it pasted correctly.

You can also update the remote manually:

```bash
git remote set-url upstream https://<NEW-TOKEN>@github.com/simonc602/agentic-os.git
bash scripts/update.sh
```

If your install does not have an `upstream` remote, use `origin` in that command instead.

---

## Semantic Memory (optional)

Agentic OS includes a semantic recall layer (Tier 1) that lets Claude Code or Codex search across past sessions, transcripts, and learnings -- not just today's log.

**Recall runs on a local PGLite + pgvector store by default** -- no external vector service, and memory is scope-isolated per team/client/user. The default embedding model is **BGE-M3** with 1024-dimensional vectors, and recall uses the same model that built the index. Search is hybrid: BGE-M3 vector search plus scoped keyword search, then reranking and audit logging. If `MEMORY_DATABASE_URL` or `DATABASE_URL` is set, the same commands use hosted Postgres instead.

The installer and updater run memory setup as part of the update flow unless `AGENTIC_OS_SKIP_MEMORY_PROMPT=1` is set. Agentic OS will warn when the BGE-M3 model needs to be downloaded; the first setup can take several minutes. If an older 384-dim local store exists, setup rebuilds a fresh 1024-dim BGE-M3 store, reindexes it, validates it, and removes the old store only after success. Hosted Postgres upgrades preserve existing memory rows, re-embed hosted chunks with BGE-M3, then run the normal reindex. If old `.memsearch` data exists, setup imports it during the migration and archives it only after the import succeeds.

Manual setup:

```bash
bash scripts/setup-memory.sh
```

Diagnostics only:

```bash
bash scripts/setup-memory.sh --check
```

PowerShell on Windows:

```powershell
powershell -File scripts\setup-memory.ps1
```

Setup chooses the backend this way:

1. If `MEMORY_DATABASE_URL` or `DATABASE_URL` exists, it uses hosted Postgres and runs BGE-M3 setup, migration, and forced reindexing.
2. If `.command-centre/memory` already exists, it validates the embedding model. Older or mismatched local stores are rebuilt and reindexed.
3. If neither exists, it asks which backend to use. Press Enter for local PGLite.

The normal reindex pass includes `context/memory/` and `context/learnings.md`. That includes the machine-owned `context/memory/*.aos.md` summaries, which are tracked in private GitHub backups so the memory index can be rebuilt later with a new model or pipeline. During setup migration only, old root `.memsearch/memory/` and client `clients/*/.memsearch/memory/` folders are passed explicitly for import. Old `.memsearch` folders are moved to `backups/memsearch-migration/{timestamp}/...` only after that import succeeds.

The old commands still work as compatibility wrappers:

```bash
bash scripts/setup-memsearch.sh
```

Semantic recall is **optional**. Without it, Tier 0 recall (`MEMORY.md` + today's log) still works. Older semantic recall, transcript drill-down, expanded memory search, and stronger citations stay unavailable until you enable searchable memory.

### Hosted team memory (optional)

The memory store also runs on **hosted Postgres + pgvector** — the same schema as local PGLite — so a team can share one central source of truth on Railway or a VPS. Point `MEMORY_DATABASE_URL` (or `DATABASE_URL`) at a `pgvector/pgvector` Postgres and apply the schema:

```bash
cd command-centre
docker compose up -d   # local pgvector for development, or use Railway/VPS
MEMORY_DATABASE_URL=postgres://postgres:postgres@localhost:5432/agentic_memory npm run memory:migrate
```

Once `MEMORY_DATABASE_URL` is set, every memory command (`memory:index`, `memory:search`, `memory:recall`) automatically runs against hosted Postgres; unset it to use local PGLite. Pin the choice with `MEMORY_STORE_BACKEND=pglite|postgres` — `postgres` errors rather than silently using the local store. Seed a fresh hosted database with the memory you already have using `npm run memory:reindex` (idempotent — re-running never duplicates chunks), and expose ingest/search over HTTP with `npm run memory:api`. Back the database up with `npm run memory:backup` and restore it with `npm run memory:restore -- <file> --yes`. See [`docs/memory/hosted-postgres-setup.md`](docs/memory/hosted-postgres-setup.md) and [`docs/memory/backup-restore.md`](docs/memory/backup-restore.md).

---

## API Keys

Most skills work without any API keys. Some are enhanced with external services (web scraping, image generation, video creation). All keys go in your `.env` file.

To see every available key with descriptions and signup links:

```bash
cat .env.example
```

Skills will tell you when they could use a key you haven't added yet, and they always offer a fallback so your work isn't blocked.

---

## Scheduled Jobs (Cron)

Run tasks automatically through a managed runtime shared by the Command Centre and the CLI daemon. Drop a markdown file into `cron/jobs/`, then choose which host should keep the scheduler alive.

### How it works

1. The same cron core discovers jobs from the root workspace and every `clients/*` workspace
2. It evaluates schedules, catch-up windows, dedupe, retries, heartbeat, and leadership in one place
3. Matching jobs enqueue tasks and execute them headlessly via `claude -p`
4. Per-job status still lands in `cron/status/`, logs still land in `cron/logs/`, and runtime state lives in `.command-centre/`
5. Only one runtime host becomes leader at a time, so the UI and daemon never double-fire the same minute

### Choose the host

**Command Centre UI**
- The scheduler runs in-process while the Command Centre server is running
- It stops with the server
- It always starts the queue watcher, but only schedules jobs if it wins the leader lock

**CLI daemon**
- Use this when you want scheduling to continue while the UI is closed
- Start and stop it manually
- It writes PID, lock, heartbeat, and logs to `.command-centre/`

### Manage the daemon

**Mac/Linux**
```bash
bash scripts/start-crons.sh
bash scripts/status-crons.sh
bash scripts/logs-crons.sh
bash scripts/stop-crons.sh
```

**Windows (PowerShell)**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-crons.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\status-crons.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\logs-crons.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stop-crons.ps1
```

Compatibility note: `install-crons` and `uninstall-crons` still exist, but they are deprecated wrappers around `start-crons` and `stop-crons`. They no longer register anything with Task Scheduler, launchd, or crontab.

The managed runtime uses your Claude plan credits. Each run costs roughly $0.01-0.05 (haiku), $0.05-0.25 (sonnet), or $0.25-2.00 (opus) depending on the model and task complexity.

### Create a job

Each job is a markdown file in `cron/jobs/` with YAML frontmatter and a prompt body:

```markdown
---
name: "My Daily Research"
time: "09:00"
days: "weekdays"
active: "true"
model: "sonnet"
# Optional
# notify: "on_finish"
# description: "Researches trending topics and saves a daily briefing"
# timeout: "30m"
# retry: "0"
---

You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context.

Task: [Your task here]

Save output to: projects/[folder]/{today's date}_[name].md
```

Or just ask Claude: "schedule a job to [do something] every morning" -- the `ops-cron` skill handles the rest.

### Schedule options

| Setting | Examples |
|---------|----------|
| **Exact time** | `time: "09:00"` or `time: "09:00,13:00,17:00"` |
| **Every N minutes** | `time: "every_5m"`, `"every_10m"`, `"every_30m"` |
| **Every N hours** | `time: "every_1h"`, `"every_2h"`, `"every_4h"` |
| **Days** | `days: "daily"`, `"weekdays"`, `"weekends"`, `"mon,wed,fri"` |
| **Model** | `model: "haiku"` (cheap), `"sonnet"` (default), `"opus"` (powerful) |

Full reference: `cron/templates/schedule-reference.md`

### Notifications & status

- **OS notifications** -- jobs send a native notification when they finish. Control this with the `notify` field: `"on_finish"` (default, notifies on success and failure), `"on_failure"` (errors and timeouts only), or `"silent"` (never notify).
- **Smart silence** -- monitoring jobs that find nothing to report can suppress their notification automatically. The job's prompt tells Claude to end with `[SILENT]` when there's nothing actionable. The job still logs normally -- you just don't get pinged for "all clear" results.
- **No duplicate runs** -- if a job is still running when the next scheduled trigger fires, the new run is skipped. This prevents slow jobs from piling up. If a previous run crashed without cleaning up, the system detects the stale state and recovers automatically.
- **Status tracking** -- each job writes its result to `cron/status/`. The managed runtime also tracks leadership, heartbeat, PID, and daemon logs in `.command-centre/`.
- **Catch-up on wake** -- if your laptop was closed during a scheduled fixed-time job, it runs automatically when the machine wakes up. Interval jobs (`every_Nh`) resume on the next matching interval without catching up.
- **Timeout** -- prevents runaway jobs. Default is 30 minutes. Configure per job with the `timeout` field (e.g., `"5m"`, `"1h"`, `"90s"`). If a job exceeds its timeout, the process is killed and the result is recorded as `timeout`.
- **Retry** -- set `retry: "1"` (or higher) to automatically re-run a job on failure. Each retry gets the full timeout. Default is 0 (no retries).

### Manage jobs

| Action | How |
|--------|-----|
| **Pause a job** | Set `active: "false"` in the job file |
| **Resume a job** | Set `active: "true"` in the job file |
| **Run a job now** | `bash scripts/run-job.sh {job-name}` on macOS/Linux or `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run-job.ps1 {job-name}` on Windows |
| **Check logs** | `cat cron/logs/{job-name}.log` |
| **List all jobs** | `ls cron/jobs/` or ask Claude "what's scheduled?" |
| **Start the daemon** | `bash scripts/start-crons.sh` or `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-crons.ps1` |
| **Stop the daemon** | `bash scripts/stop-crons.sh` or `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stop-crons.ps1` |
| **Check runtime status** | `bash scripts/status-crons.sh` or `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\status-crons.ps1` |
| **Show daemon logs** | `bash scripts/logs-crons.sh` or `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\logs-crons.ps1` |

Stopping the daemon only stops automatic scheduling. Your job files in `cron/jobs/` are never deleted.

### Important notes

- **No OS scheduler fallback** -- automatic scheduling no longer depends on Task Scheduler, launchd, or crontab.
- **UI behavior** -- if you rely on the Command Centre host, scheduling stops when the server stops.
- **CLI behavior** -- the daemon is manual. Start it when you want background scheduling and stop it explicitly when you do not.
- **Leader lock** -- if the UI and daemon coexist, only one of them schedules jobs. The other host stays passive.
- **Legacy scripts** -- `run-crons` is deprecated and no longer performs scheduling.
- **Existing sessions:** Jobs run as separate headless processes -- they don't interfere with any open Claude Code session.

---

## Windows Notification Theme

Windows notification visuals and default copy live in `scripts/windows-notify.config.json`.

- `app` controls the Windows app identity, display name, Start Menu shortcut name, generated asset cache version, optional attribution, default toast duration, and the default layout (`compact` or `hero`).
- `assets.logoPath` should point to the toast logo image. `assets.shortcutIconPath` should point to the Windows shortcut icon and must be an `.ico` file.
- The repo-tracked asset folder for Windows branding is `scripts/assets/windows-notify/`.
- `assets.heroPaths.*` can point to optional background images for hero mode. If blank or missing, the helper generates the hero background and overlays the event-specific text on top.
- `assets.generatedLogo` controls the fallback logo artwork when the configured toast logo image is missing.
- `assets.variants.*` controls the gradient palette, accent colors, sound, and emoji for each notification variant.
- `copy.interactive.*` and `copy.cron.*` define the default `status`, `subject`, `detail`, `variant`, `duration`, and `layout` for each Windows notification event.
- Supported template placeholders are `{project}`, `{seq}`, `{duration}`, `{rawMessage}`, `{jobName}`, `{timeout}`, `{exitCode}`, and `{catchUpSuffix}`.

Preview the default compact toast with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/test-windows-notify.ps1 -Variant success
```

Preview hero mode explicitly with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/test-windows-notify.ps1 -Variant success -Layout hero
```

If you change generated colors, layout, or badge text, either bump `app.assetVersion` in `scripts/windows-notify.config.json` or delete the cached folder under `%LOCALAPPDATA%\AgenticOS\notifications\` so Windows rebuilds the generated assets.

---

## Multiple Clients

If you work with more than one client or brand, just tell Claude: **"add a client called [name]"**. It creates the workspace, and offers to switch you into it.

You can also do it manually:

```bash
bash scripts/add-client.sh "Client Name"
cd clients/client-name
claude
```

Each client has its own brand context, memory, and output. Shared methodology now lives in `AGENTS.md` at the root, with `CLAUDE.md` importing it for Claude Code. Skills and scripts sync automatically when you run `update.sh`.

For the full setup guide, see [docs/multi-client-guide.md](docs/multi-client-guide.md).
For how projects work (single tasks, planned projects, GSD), see [docs/projects-guide.md](docs/projects-guide.md).
For a quick reference, see [docs/cheat-sheet.md](docs/cheat-sheet.md).

---

## File Structure

```
├── context/
│   ├── SOUL.md            <- Agent personality and behaviour rules
│   ├── USER.md            <- Your preferences and working style
│   ├── learnings.md       <- Accumulated skill feedback (gets smarter over time)
│   └── memory/            <- Daily session logs (auto-links to active projects)
├── brand_context/         <- Your brand data (voice, positioning, ICP)
├── .claude/skills/        <- Installed skill packs
├── command-centre/        <- Local UI and runtime app (versioned with the repo)
├── cron/jobs/             <- Scheduled job definitions
├── projects/              <- All generated output
│   ├── mkt-copywriting/   <- Single task category folders (Level 1)
│   └── briefs/            <- Multi-deliverable projects (Level 2/3)
│       └── q2-launch/     <- Project folder with brief.md
│           └── .planning/ <- GSD artifacts (Level 3, per project)
├── scripts/               <- Install, update, manage skills, watchdog
├── AGENTS.md              <- Canonical shared instructions
└── CLAUDE.md              <- Claude wrapper that imports AGENTS.md
```

---

## Quality of Life

A few things baked in to make the day-to-day smoother:

- **CC Notify** -- native OS notifications (Mac & Windows) when Claude finishes a task, needs permission, or is waiting for input. No more checking back every 30 seconds.
- **Auto-download** -- binary outputs (images, videos, PDFs) auto-copy to your Downloads folder.
- **Humanizer gate** -- every skill that produces publishable text automatically strips AI writing patterns before saving.
- **Clickable file paths** -- every saved file shows the full path so you can click to open it.
- **Graceful degradation** -- no skill breaks because something is missing. No API key? Free fallback. No brand context? Solid generic output.

---

## Your Data is Safe

Updates never overwrite your root or client data.

At the root, these are preserved:

- **.env** and **.mcp.json** -- your local keys and tool config
- **.claude/settings.local.json** -- your personal Claude Code settings
- **brand_context/** -- your voice profile, positioning, ICP
- **context/** -- your memory, learnings, session history, and `.aos.md` summarized memory captures
- **projects/** -- everything the system generates for you
- **cron/jobs/** -- your scheduled jobs
- **.planning/** -- your active GSD planning state

For clients, Agentic OS does sync shared system files from the root, including skills, scripts, hooks, settings, and cron templates. Client context, brand data, memory, projects, cron jobs, `.env`, `.claude/settings.local.json`, client-only skills, and `SKILL.local.md` files are preserved.

---

## Need Help?

Head to the Agentic Academy Skool community. Post your question and the team or another member will help you out.

---

Built by Simon Scrapes @ Agentic Academy
