# Skill Registry

Auto-populated as skills are installed. Each entry includes its name and trigger conditions.

---

## Meta Skills

| Skill | Triggers on |
|-------|-------------|
| `meta-skill-creator` | "create a skill", "build a skill", "new skill", "make a skill", "optimize skill description" |
| `meta-wrap-up` | "wrap up", "close session", "end session", "we're done", "session done" |
| `meta-goal-breakdown` | "break this down", "plan this out", "subtasks", "scope this work", "task breakdown", goal bar submissions |
| `meta-memory-write` | "remember this", "remember that", "note that", "save this to memory", "update memory", "log this", "forget about", "remove from memory" |

## Foundation Skills

| Skill | Triggers on | Writes to |
|-------|-------------|-----------|
| `mkt-brand-voice` | "tone", "writing style", "brand voice", "how we sound" | `voice-profile.md`, `samples.md` |
| `mkt-positioning` | "differentiation", "angle", "hooks", "USP" | `positioning.md` |
| `mkt-icp` | "target audience", "buyer persona", "ideal customer" | `icp.md` |

## Strategy Skills

| Skill | Triggers on |
|-------|-------------|
| `str-ai-seo` | "AI SEO", "AEO", "GEO", "LLMO", "answer engine optimization", "AI citations", "AI visibility", "optimize for ChatGPT/Perplexity/Claude", "show up in AI answers" |

## Visual Skills

| Skill | Triggers on |
|-------|-------------|
| `viz-stitch-design` | "design a UI", "create a screen", "stitch design", "UI mockup", "app design", "landing page design", "mobile screen", "web layout", "wireframe to UI", "design this page" |
| `viz-interface-design` | "dashboard", "admin panel", "SaaS UI", "data interface", "metrics display", "control panel", "monitoring UI", "analytics view", "settings page", "interactive tool interface" |

## Operations Skills

| Skill | Triggers on |
|-------|-------------|
| `ops-new-feature` | "new feature", "start feature", "add feature", "begin work on", "start working on", "finish feature", "done with feature", "merge feature", "feature done", "merge this" |
| `ops-release` | "release", "cut a release", "bump version", "ship it", "new version", "tag a release" |
| `ops-cron` | "schedule a job", "cron job", "run this every morning", "automate daily", "recurring task", "scheduled job", "check scheduled jobs", "list jobs", "run job manually", "start crons", "stop crons", "cron status", "cron logs" |
| `ops-google-ads` | "google ads", "ads audit", "ads review", "campaign status", "keyword research for ads", "build a campaign", "negative keywords", "RSA", "PPC audit", "ad spend", "conversion tracking check", "quality score" |

## Utility Skills

| Skill | Triggers on |
|-------|-------------|
| `tool-stitch` | "fetch stitch design", "get stitch screens", "stitch project", "pull from stitch", "stitch code", "export stitch" |

---

*Optional skills are auto-registered by reconciliation when their folders appear on disk. Install with `bash scripts/add-skill.sh <name>`. See `.claude/skills/_catalog/catalog.json` for the full list.*
