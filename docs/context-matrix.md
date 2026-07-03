# Context Matrix

Load only the `brand_context/` files listed for each skill.

| Skill | voice-profile | positioning | icp | samples | assets | learnings |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| `mkt-brand-voice` | **writes** | summary | — | **writes** | **writes** (via firecrawl branding) | `## mkt-brand-voice` |
| `mkt-positioning` | — | **writes** | full | — | — | `## mkt-positioning` |
| `mkt-icp` | — | summary | **writes** | — | — | `## mkt-icp` |
| `meta-wrap-up` | — | — | — | — | — | `## meta-wrap-up` |
| `meta-goal-breakdown` | — | summary | summary | — | — | `## meta-goal-breakdown` |
| `meta-memory-write` | — | — | — | — | — | `## meta-memory-write` |
| `str-ai-seo` | tone only | summary | full | — | — | `## str-ai-seo` |
| `tool-stitch` | — | — | — | — | — | `## tool-stitch` |
| `viz-stitch-design` | tone only | summary | language section | — | — | `## viz-stitch-design` |
| `viz-interface-design` | tone only | summary | language section | — | — | `## viz-interface-design` |
| `ops-cron` | — | — | — | — | — | `## ops-cron` |
| `ops-google-ads` | — | — | — | — | — | `## ops-google-ads` |
| `ops-new-feature` | — | — | — | — | — | `## ops-new-feature` |
| `ops-release` | — | — | — | — | — | `## ops-release` |

**Matrix key:** `writes` = creates file | `full` = entire file | `summary` = 1-2 sentences | `tone only` = tone + vocabulary | `language section` = words-they-use section | `## skill-name` = read only that section from `context/learnings.md`

**Learnings rule:** Every skill reads and writes to its own section in `context/learnings.md`. Cross-skill insights go under `# General`. Skill-specific entries go under `# Individual Skills` → `## {folder-name}`.
