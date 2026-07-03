# Building New Skills

Always ask for reference skills first. Never guess at methodology.

---

## Skill structure

```text
.claude/skills/{category}-{skill-name}/
├── SKILL.md
├── references/
├── scripts/
└── assets/
```

## Auto-Setup Convention

Skills that need external binaries must include a `scripts/setup.sh` that:
- checks `command -v` first
- uses `brew` on macOS when available, with other fallbacks when needed
- reports clear success or failure
- runs only when dependencies are missing
- avoids user interaction unless absolutely necessary

## YAML frontmatter rules

- About 100 words, under 1024 characters
- Include trigger phrases and negative triggers
- Do not use XML angle brackets

## Skill Dependencies

Declare dependencies in a `## Dependencies` section in `SKILL.md`.

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-youtube` | Optional | YouTube transcript fetching | Ask the user to paste content manually |

**Rules:**
- Required dependencies must be installed for the skill to function
- Optional dependencies must declare their fallback
- If a required dependency is missing, tell the user which skill to install
- Utility (`tool-`) skills never depend on execution skills

## Registration checklist

- [ ] Folder name matches `{category}-{skill-name}`
- [ ] Frontmatter `name` matches the folder name exactly
- [ ] Add the skill to `docs/skill-registry.md` and to the Skill Registry in `AGENTS.md`
- [ ] Add a row to `docs/context-matrix.md` and to the Context Matrix in `AGENTS.md`
- [ ] Frontmatter stays under 1024 chars
- [ ] `SKILL.md` stays under 200 lines
- [ ] References are self-contained
- [ ] Dependencies are declared when needed
- [ ] Output folders use the same category prefix
- [ ] External services are registered in `AGENTS.md`, `.env.example`, and README.md
- [ ] Publishable text skills include the humanizer gate

## Folder naming

- Format: `{category}-{skill-name}` in kebab-case
- Cannot contain "claude" or "anthropic"
