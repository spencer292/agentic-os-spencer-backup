---
name: meta-skill-system-creator
version: 1.0.0
description: "Create skill systems — multi-skill packages that chain skills into complete workflows. Starts with a deep interview to understand the system, scans existing skills for reuse, then handles PACKAGE.yaml manifests, install.sh scripts, output directory conventions, and template rendering. Use when: 'create a system', 'package these skills', 'build a skill system', 'turn this into a system', 'system from skills'."
---

# Skill System Creator

Turn a set of related skills into a distributable skill system — a self-contained package that installs skills, framework files, templates, and assets into any Agentic OS instance or standalone project.

## Outcome

A complete system package at `.claude/skills/_systems/{system-name}/` containing:
- `PACKAGE.yaml` — manifest declaring skills, services, prerequisites
- `install.sh` — installer supporting fresh and existing-project modes
- `agents/` — sub-agent definitions (deployed to `.claude/agents/`)
- `skills/` — skill folders (deployed to `.claude/skills/`), with the entry skill containing a `skill-pack/` subfolder holding config, tools, templates, assets, and vendor libs

Installed via `bash scripts/add-system.sh {name}`. Removed via `bash scripts/remove-system.sh {name}`.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## meta-skill-system-creator` | Past system-building feedback |
| `AGENTS.md` | System Registry section | Check existing systems |

## Step 0: System Interview

Before identifying skills or writing any code, conduct a thorough interview to extract the complete system specification. Read `references/system-interview.md` for the full methodology.

**Interview phases:**

1. **Big Picture** (2-4 Qs) — What does this system do? What triggers it? What goes in/out?
2. **Process Deep-Dive** (5-12 Qs) — Walk each phase. Map human-in-the-loop checkpoints.
3. **Ecosystem Scan** (automatic) — Scan `.claude/skills/`, `brand_context/` for reuse candidates. Present a reuse map showing what exists vs. what needs building.
4. **Edge Cases** (3-5 Qs) — Failure modes, minimum inputs, abort conditions.
5. **Confirmation** — Summarize the full system spec. Get user sign-off before proceeding.

**Critical rule:** The ecosystem scan (Phase 3) must happen BEFORE proposing what to build. Never default to building from scratch. Show the user what's already available and only create new skills for genuine gaps.

Output the confirmed spec using the format in `references/system-spec-template.md`.

The interview is complete when the user confirms the system summary. Only then proceed to Step 1.

## Step 0b: Build New Skills via meta-skill-creator

For every skill marked "BUILD" or "EXTEND" in the confirmed spec, invoke the `meta-skill-creator` skill to create it. Do NOT write skills ad-hoc. The system creator handles architecture and packaging — individual skill creation is always delegated to `meta-skill-creator`.

This ensures standard structure, frontmatter, registration, and quality. Build all new skills before proceeding to Step 1.

## Step 1: Identify Skills and Entry Point

Using the confirmed system summary from Step 0, determine which skills belong in the system:

1. The **orchestrator** (entry point the user invokes) becomes `entry_skill` in PACKAGE.yaml.
2. List all dependency skills — read each skill's `dependencies:` frontmatter and recurse.
3. Identify **shared runtime** (components, libs, tools, CLI scripts).
4. Identify **assets** (audio files, logos, images).
5. Identify **templates** (config files, setup scripts for project root).
6. Identify **external services** (API keys) required or optional.
7. Cross-reference the reuse map from the interview. For each phase marked REUSE, confirm the existing skill covers the need without modification. For PARTIAL MATCH, document what needs extending.

Present the full dependency tree with reuse/build status for each skill.

**Naming rule:** System folder name, `entry_skill`, and PACKAGE.yaml `name:` must ALL match.

## Step 2: Create Package Structure

```
_systems/{system-name}/
├── PACKAGE.yaml
├── install.sh
├── README.md
├── agents/                     <- mirrors .claude/agents/ (deployed there)
│   └── {prefix}-{name}.md
└── skills/                     <- mirrors .claude/skills/ (deployed there)
    ├── {entry-skill}/
    │   ├── SKILL.md
    │   ├── references/
    │   └── skill-pack/         <- everything else packaged here
    │       ├── config/         <- pipeline config + sys-config
    │       ├── tools/          <- custom code
    │       ├── templates/      <- install-time files
    │       ├── assets/         <- static files
    │       └── vendor/         <- external libs
    └── {dep-skill-N}/
        ├── SKILL.md
        └── references/
```

**Copy, don't symlink** — the system package must be fully self-contained. Never create empty optional folders.

## Step 3: Write PACKAGE.yaml

Read `references/package-schema.md` for the full schema and field descriptions.

Key: `entry_skill` must match folder name. `skills_dir: skills`. Vendor/tools targets are relative to project root. Assets target `projects/{entry_skill}/`.

## Step 4: Write install.sh

Read `references/install-patterns.md` for the full template.

The installer supports two modes (fresh and `--target`). Must check prerequisites, merge `.env.example` keys without duplicating, validate symlinks, and work cross-platform (macOS, Linux, Git Bash).

### Architecture: Framework vs Outputs

| What | Where | Why |
|------|-------|-----|
| **Vendor** (external libs) | `skills/{entry-skill}/skill-pack/vendor/` | Co-located with entry skill |
| **Tools** (custom code) | `skills/{entry-skill}/skill-pack/tools/` | Co-located with entry skill |
| **Config** (pipeline settings) | `skills/{entry-skill}/skill-pack/config/` | User-editable, stays in package |
| **Outputs** (renders, runs) | `projects/{entry_skill}/` | User data, gitignored |
| **Skills** | `.claude/skills/` | Claude discovers them here |

### Output Directory Structure

```
projects/{entry_skill}/
├── renders/{run-name}/     <- FINAL OUTPUT
├── runs/{run-name}/        <- pipeline working data
├── audio/                  <- shared audio assets
└── logos/                  <- shared brand assets
```

Run names: `YYYY-MM-DD-{sanitized-title}`. Each run gets a `pipeline-log.md`.

## Step 4b: Documentation Conventions

Split entry skill docs into SKILL.md (agent-facing, ~150 lines) and README.md (user-facing). Every entry skill needs `references/onboarding.md`.

Read `references/documentation-conventions.md` for full requirements including Pipeline Flow diagram rules, Output Structure format, and onboarding guide sections.

## Step 4c: Config & Onboarding Conventions

Read `references/config-conventions.md` for the first-run onboarding pattern, sys-config convention, brand context inheritance, and config file requirements.

**Key principle:** The first run is the most interactive part. All dependencies, provider choices, and preferences are surfaced upfront in a single onboarding phase — including human-in-the-loop checkpoints and where config files live for future edits. After onboarding, execution is fully hands-off.

Only add config when meaningful user-facing settings exist. Operational settings go in `skills/{entry-skill}/skill-pack/config/sys-config.md`. Creative prefs go in `brand_context/`.

## Step 4d: Sub-Agent Conventions

Read `references/agent-conventions.md` for sub-agent definitions, file structure, and naming convention.

Agent files are prefixed with system short name (e.g., `l2s-clip-editor.md`).

## Step 5: Update Skill Docs for System Context

When skills move into a system, update their docs:
1. **Output paths** — Use `projects/{skill-name}/renders/` and `projects/{skill-name}/runs/`
2. **Framework paths** — Reference at root (e.g., `remotion/`, `tools/`)
3. **Run directory** — `$RUN_DIR = projects/{skill-name}/runs/YYYY-MM-DD-{title}`
4. **Variable names** — Use `{skill-name}`, `{run-dir}`, `{entry_skill}` placeholders

## Step 6: Register & Verify

1. Run `bash scripts/add-system.sh {system-name}`
2. Verify skills appear in `.claude/skills/`
3. Verify framework files land at root
4. Verify output dirs and symlinks created
5. Verify `.env.example` has service keys (not duplicated)
6. Update **System Registry** in `AGENTS.md`
7. Test entry skill end-to-end

**Checklist:**
- [ ] SKILL.md under 200 lines, README.md has About/Features/Use Cases/Pipeline Flow/Approximate Timings/Output Structure
- [ ] PACKAGE.yaml has all skills, `entry_skill` matches folder name
- [ ] `install.sh` works in both modes, cross-platform
- [ ] Skills install to `.claude/skills/`, framework to root, outputs to `projects/`
- [ ] `renders/` top-level in output dir, `runs/` separate
- [ ] Dynamic output dir (read from `entry_skill`), no hardcoded paths
- [ ] Agents prefixed with system short name
- [ ] `references/onboarding.md` exists in entry skill
- [ ] `skills/{entry-skill}/skill-pack/config/sys-config.md` exists
- [ ] No empty asset/vendor/tools folders
- [ ] `.gitignore` covers system packages, outputs, and symlinks

## Rules

- 2026-04-29: Framework code stays at project root. Only outputs go to `projects/{entry_skill}/`.
- 2026-04-29: Never hardcode entry skill name. Read from PACKAGE.yaml dynamically.
- 2026-04-29: Renders get own top-level `renders/` dir, separate from `runs/`.
- 2026-04-29: All scripts fall back to direct python3/python resolution for portability.
- 2026-04-29: Manifest is `PACKAGE.yaml`, not `SYSTEM.yaml`.
- 2026-04-29: System config lives in `skills/{entry-skill}/skill-pack/config/`, not project root.
- 2026-04-29: All installers must work cross-platform using helpers from `references/install-patterns.md`.
- 2026-04-30: First-run config gate is optional. When present, run interactive onboarding (all choices upfront), then hands-off thereafter.
- 2026-05-02: Docs split into SKILL.md (agent) and README.md (user). Pipeline Flow goes in README.
- 2026-05-02: Heavy phases use sub-agents in `subagents/`. Creative prefs go in `brand_context/`.
- 2026-05-05: Operational config goes in `skills/{entry-skill}/skill-pack/config/sys-config.md`.
- 2026-05-05: System folder name MUST match entry_skill across all locations.
- 2026-05-05: Skills at `skills/`, external deps at `skills/{entry-skill}/skill-pack/vendor/`, custom code at `skills/{entry-skill}/skill-pack/tools/`.
- 2026-05-05: Agent files prefixed with system short name for flat `.claude/agents/` folder.
- 2026-05-05: Every entry skill needs `references/onboarding.md`.
- 2026-05-05: System tiers: Lite/Standard/Full. Never create empty optional folders.
- 2026-05-05: Always interview before building. The ecosystem scan (existing skills, brand_context, sys-config) must happen BEFORE proposing new skills. Never default to building from scratch — show the reuse map first.
- 2026-05-05: Every sys-* system must implement per-phase timing, pipeline-log.md, end-of-run summary, and first-run README timing update. See `references/documentation-conventions.md` § Pipeline Timing.
- 2026-05-07: All system resources live inside entry skill folder under skill-pack/. sys-config/ no longer used — operational config goes in skills/{entry-skill}/skill-pack/config/sys-config.md.

## Self-Update

If the user flags an issue with system creation — wrong paths, missing convention, broken install — update the `## Rules` section immediately with the correction.
