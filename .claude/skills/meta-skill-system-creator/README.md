# Skill System Creator

Create distributable skill systems — multi-skill packages that chain skills into complete automated workflows.

## What It Does

Takes a set of related skills and packages them into a self-contained system that installs into any Agentic OS instance. The process is interview-driven: Claude extracts the full specification through conversation before writing a single line of code.

## User Experience

### Phase 1: The Interview

The bulk of the interaction. Claude asks 10-25 questions (one at a time) across five phases:

**Big Picture (2-4 Qs)** — What problem does this solve? What triggers it? What goes in/out?

**Process Deep-Dive (5-12 Qs)** — Walk each phase of the workflow. Map every human checkpoint. Push for specifics — no vague answers accepted.

**Ecosystem Scan (automatic)** — Claude silently scans installed skills, brand context, and sys-config, then presents a reuse map showing what exists vs what needs building.

**Edge Cases (3-5 Qs)** — Failure modes, minimum inputs, abort conditions.

**Confirmation** — Full system summary presented for sign-off. Nothing gets built until the user confirms.

### Phase 2: Build

Once confirmed, Claude executes in sequence:

1. **Dependency tree** — presents the full skill graph with reuse/build status
2. **Build new skills via meta-skill-creator** — any skill marked "BUILD" in the reuse map is created using the `meta-skill-creator` skill (not written ad-hoc). This ensures every skill follows standard structure, frontmatter, registration, and quality checks.
3. **Package structure** — creates the system folder with all components
4. **PACKAGE.yaml** — writes the manifest
5. **install.sh** — writes the installer (fresh + existing-project modes)
6. **Documentation** — SKILL.md (agent-facing), README.md (user-facing), onboarding guide
7. **Config** — sys-config file for operational settings
8. **Skill updates** — existing skills joining the system get paths updated
9. **Register & verify** — runs `add-system.sh`, updates AGENTS.md, runs checklist

### Skill Creation Rule

When the system needs new skills (orchestrator or dependencies), they are **always created through `meta-skill-creator`**. This is not optional. The system creator handles architecture, packaging, and wiring — it delegates individual skill creation to the dedicated skill-building skill. This guarantees:

- Correct YAML frontmatter and trigger phrases
- Proper folder structure (`SKILL.md`, `references/`, etc.)
- Registration in the Skill Registry and Context Matrix
- Learnings section created in `context/learnings.md`
- Quality checks (under 200 lines, under 1024 char description)

## Canonical Package Structure

The end result lives at `.claude/skills/_systems/{system-name}/`:

```
.claude/skills/_systems/{system-name}/
├── PACKAGE.yaml          <- manifest (entry skill, skills list, services, targets)
├── install.sh            <- installer script (fresh + --target modes)
├── README.md             <- user-facing documentation
│
├── skills/               <- the skills themselves (copied to .claude/skills/ on install)
│   ├── {entry-skill}/    <- orchestrator skill the user invokes
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── onboarding.md
│   │       └── ...
│   └── {dep-skill}/      <- dependency skills
│       ├── SKILL.md
│       └── references/
│
├── agents/               <- sub-agent definitions (prefixed with system short name)
│   ├── {prefix}-{agent-name}.md
│   └── ...
│
├── config/               <- technical runtime config (stays in package)
│   └── ...
│
├── vendor/               <- external libraries/frameworks (installed to project root)
│   └── ...
│
├── tools/                <- custom code owned by this system (installed to project root)
│   └── ...
│
├── templates/            <- config/setup files rendered at install time
│   └── ...
│
└── assets/               <- static files copied to output dirs (audio, images, logos)
    └── ...
```

Only populated folders are created. Empty optional folders are never included.

## Where Things Land After Install

| Component | Install Location | Why |
|-----------|-----------------|-----|
| Skills | `.claude/skills/{skill-name}/` | Claude discovers skills here |
| Vendor libs | Project root (e.g., `remotion/`) | Build systems need them at known paths |
| Tools | Project root (`tools/`) | Runs during pipeline execution |
| Config | `skills/{entry-skill}/skill-pack/config/` | User-editable, deployed with skill |
| Operational config | `skills/{entry-skill}/skill-pack/config/sys-config.md` | User preferences for how the system runs |
| Creative prefs | `brand_context/` | Inherited from existing brand context |
| Outputs | `projects/{entry-skill}/` | User data, gitignored |
| Agents | `.claude/agents/` | Flat folder, files prefixed with system short name |

## Output Directory Convention

When the system runs, outputs land here:

```
projects/{entry-skill}/
├── renders/{run-name}/        <- FINAL OUTPUT (what the user wants)
├── runs/{run-name}/           <- pipeline working data + pipeline-log.md
├── audio/                     <- shared audio assets
└── logos/                     <- shared brand assets
```

Run names follow: `YYYY-MM-DD-{sanitized-title}`.

## Key Principles

- **Reuse first** — never build from scratch when an existing skill covers the need
- **Interview before building** — the ecosystem scan must happen before proposing architecture
- **Self-contained packages** — copy, don't symlink; packages work independently
- **Naming consistency** — system folder, entry_skill, PACKAGE.yaml name, and sys-config file must all match
- **Cross-platform** — installers work on macOS, Linux, and Git Bash

## Install & Remove

```bash
# Install a system package
bash scripts/add-system.sh {system-name}

# Remove a system and its skills
bash scripts/remove-system.sh {system-name}

# List installed systems
bash scripts/list-systems.sh
```
