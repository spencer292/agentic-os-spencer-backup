# PACKAGE.yaml Schema

The manifest declares everything the system contains and where it goes.

```yaml
name: {entry-skill-name}                # MUST match folder name
version: 1.0.0
description: One-line description of what the system does
entry_skill: {entry-skill-name}          # MUST match name and folder
category: {category-prefix}
skills_dir: skills                        # was: framework/skills
get_started: "Ready? Try: /{entry-skill} {typical-argument}"

summary: |
  Multi-line ASCII diagram or description of the pipeline flow.
  Keep it scannable — this prints in the terminal after install.

skills:
  - {entry-skill}
  - {dep-skill-1}
  - {dep-skill-2}

directories:
  - projects/{entry_skill}/renders/
  - projects/{entry_skill}/runs/

services:
  - key: {API_KEY_NAME}
    required: false
    description: What it enables

prerequisites:
  - system: [ffmpeg, node, python3]
  - python: [whisperx, yt-dlp]
```

## Key Rules

- `entry_skill` is the skill the user invokes (e.g., `00-longform-to-shortform`)
- `skills_dir` tells the installer where to find skills within the package
- All system resources (vendor, tools, templates, assets, config) live inside `skills/{entry-skill}/skill-pack/` — no top-level resource mapping sections in PACKAGE.yaml
- `directories` lists empty dirs the installer should create
- `name`, folder name, and `entry_skill` must ALL match
- `services` with `conditional_on` are only required when the user enables that feature (e.g., publishing mode = draft requires posting API key). Onboarding must check these AFTER the relevant question is answered, not upfront
