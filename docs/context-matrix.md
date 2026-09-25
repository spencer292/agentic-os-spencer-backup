# Context Matrix

Load only the `brand_context/` files listed for each skill.

| Skill | voice-profile | positioning | icp | samples | assets | learnings |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| `mkt-brand-voice` | **writes** | summary | — | **writes** | **writes** (via firecrawl branding) | `## mkt-brand-voice` |
| `mkt-positioning` | — | **writes** | full | — | — | `## mkt-positioning` |
| `mkt-icp` | — | summary | **writes** | — | — | `## mkt-icp` |
| `mkt-brand-strategy` | tone only | summary | summary | — | — | `## mkt-brand-strategy` |
| `mkt-quote-builder` | tone only | summary | — | — | — | `## mkt-quote-builder` |
| `mkt-youtube-optimizer` | tone only | summary | full | — | — | `## mkt-youtube-optimizer` |
| `mkt-visual-identity` | tone only | summary | full | — | colours + logo + type (visual-identity tokens) | `## mkt-visual-identity` |
| `str-trending-research` | — | summary | — | — | — | `## str-trending-research` |
| `fin-invoice-reconciliation` | — | — | — | — | — | `## fin-invoice-reconciliation` |
| `fin-month-end-reporting` | — | — | — | — | — | `## fin-month-end-reporting` |
| `00-brand-build` | — | — | — | — | — | `## 00-brand-build` |
| `meta-wrap-up` | — | — | — | — | — | `## meta-wrap-up` |
| `meta-goal-breakdown` | — | summary | summary | — | — | `## meta-goal-breakdown` |
| `meta-memory-write` | — | — | — | — | — | `## meta-memory-write` |
| `meta-memory-recall` | — | — | — | — | — | `## meta-memory-recall` |
| `str-ai-seo` | tone only | summary | full | — | — | `## str-ai-seo` |
| `str-board-sitting` | `board/seats.md`, `board/STATE.md`, `board/decision-log.md`, `board/brief.md` (if present) |
| `writ-review` | full (baseline texture) | — | summary | — | — | `## writ-review` |
| `writ-draft` | full (writes in it) | summary | full | — | — | `## writ-draft` |
| `writ-editor` | full (baseline texture) | — | summary | — | — | `## writ-editor` |
| `tool-stitch` | — | — | — | — | — | `## tool-stitch` |
| `viz-stitch-design` | tone only | summary | language section | — | — | `## viz-stitch-design` |
| `viz-interface-design` | tone only | summary | language section | — | — | `## viz-interface-design` |
| `ops-cron` | — | — | — | — | — | `## ops-cron` |
| `ops-google-ads` | — | — | — | — | — | `## ops-google-ads` |
| `ops-new-feature` | — | — | — | — | — | `## ops-new-feature` |
| `ops-release` | — | — | — | — | — | `## ops-release` |

| `ops-repo-assessment` | — | — | — | — | — | `## ops-repo-assessment` |
| `ops-release-assurance` | — | — | — | — | — | `## ops-release-assurance` |
| `tool-infra-security` | — | — | — | — | — | `## tool-infra-security` |
| `00-website-build` | sets humanizer depth | summary | summary | — | design-system.md, target-keywords.md (presence check) | `## 00-website-build` |
| `str-ux-research` | tone only | summary | full | — | — | `## str-ux-research` |
| `str-cro-audit` | — | summary | full | — | design-system.md, target-keywords.md | `## str-cro-audit` |
| `str-keyword-strategy` | tone only | summary | full | — | — | `## str-keyword-strategy` |
| `str-question-harvester` | — | summary | full | — | — | `## str-question-harvester` |
| `str-authority-strategy` | tone only | summary | full | — | — | `## str-authority-strategy` |
| `str-onpage-audit` | tone only (apply-fixes prose) | summary | summary | — | design-system.md image and schema rules | `## str-onpage-audit` |
| `str-internal-links` | — | summary | summary | — | target-keywords.md, authority-strategy.md | `## str-internal-links` |
| `str-security-audit` | — | — | — | — | client AGENTS.md, prior audit report | `## str-security-audit` |
| `viz-design-system` | tone + rhythm | summary | full | — | colours + brand name (visual-identity tokens) | `## viz-design-system` |
| `viz-page-architect` | tone only | summary | full | — | — | `## viz-page-architect` |
| `viz-component-library` | — | summary | summary + language | — | — | `## viz-component-library` |
| `viz-nano-banana` | tone only | — | — | — | colours + brand name (visual-identity tokens) | `## viz-nano-banana` |
| `mkt-scorecard-funnel` | full | summary | full | — | design-system (CTA colours, type scale) | `## mkt-scorecard-funnel` |
| `tool-accessibility-audit` | — | — | summary | — | design-system.md | `## tool-accessibility-audit` |
| `tool-web-performance` | — | — | — | — | design-system.md (performance rules, optional) | `## tool-web-performance` |
| `tool-web-qa` | — | summary | — | — | design-system.md (breakpoints, optional) | `## tool-web-qa` |
| `tool-behaviour-analytics` | — | summary | summary | — | design-system.md CTA rules only | `## tool-behaviour-analytics` |

**Matrix key:** `writes` = creates file | `full` = entire file | `summary` = 1-2 sentences | `tone only` = tone + vocabulary | `language section` = words-they-use section | `## skill-name` = read only that section from `context/learnings.md`

**Learnings rule:** Every skill reads and writes to its own section in `context/learnings.md`. Cross-skill insights go under `# General`. Skill-specific entries go under `# Individual Skills` → `## {folder-name}`.
