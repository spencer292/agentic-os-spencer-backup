# Sub-Agent Conventions

## When to use sub-agents

Extract a phase into a sub-agent when:
- It loads heavy context (skill references, playbooks, TSX patterns) that would bloat the orchestrator
- It runs in parallel (multiple instances for batch processing)
- Its concerns are independent from the orchestrator (editing vs packaging vs posting)

## Package-level agent structure

Agent definitions live at the **package root** in `agents/`, mirroring `.claude/agents/` where they deploy. The install script copies them to `.claude/agents/` so Claude discovers them.

```
_systems/{system-name}/
├── agents/                     <- deployed to .claude/agents/
│   ├── {prefix}-{phase}.md
│   └── ...
└── skills/
    └── {entry-skill}/
        ├── SKILL.md            <- orchestrator (references agents by prefix)
        ├── README.md
        └── references/
            ├── pipeline-phases.md
            └── conventions.md
```

## Sub-agent file format

Each file in `subagents/` must include:

1. **`# {Agent Name} Sub-Agent`** — clear title
2. **`## Context References`** — files the agent must read before starting
3. **`## Agent Prompt Template`** — full prompt with `{placeholder}` variables the orchestrator fills in
4. **`## Dispatch`** — how the orchestrator launches this agent (Agent tool type, parallelism, what it returns)

## Orchestrator dispatch table

The entry skill's SKILL.md includes:

```markdown
| Phase | Sub-Agent | Definition | What to pass | What comes back |
|-------|-----------|------------|-------------|-----------------|
| 7 | Clip Editor | `subagents/clip-editor.md` | clip path, theme | composition files |
```

Pipeline-phases.md references the sub-agent file instead of embedding the prompt inline.

## Agent naming convention

Agent files are prefixed with the system's short prefix to avoid collisions in the flat `.claude/agents/` folder. The prefix is derived from the entry skill name by dropping `sys-` and taking the first distinctive segment.

| System | Prefix | Agent files |
|--------|--------|-------------|
| `00-longform-to-shortform` | `l2s-` | `l2s-clip-editor.md`, `l2s-content-packager.md` |
| `00-social-content` | `social-` | `social-image-generator.md` |
