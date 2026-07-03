# 00-slides Configuration

_customized: false

<!-- Single source of truth for the onboarding-done flag. Set to true after first-run onboarding completes; the orchestrator skips Phase 0 when true. -->

## Paths

<!--
Set by install.sh. Don't edit by hand unless you moved the project root.
The orchestrator reads this section at Phase 1 to resolve where .env,
brand_context/, and projects/ live. Replaces the old runtime.env approach.
-->

- decoupled_base: C:/Claude/agent-os-v3/agentic-os
- env_file: C:/Claude/agent-os-v3/agentic-os/.env
- brand_context: C:/Claude/agent-os-v3/agentic-os/brand_context
- projects_base: C:/Claude/agent-os-v3/agentic-os/projects

## Defaults

- **Style preset:** auto (matches presentation type)
- **Max slide count:** 20
- **PDF export:** on request only
- **Auto-open browser:** yes

## Style Preferences

When style is set to "auto", the system maps presentation type to mood:

| Presentation Type | Default Mood | Default Preset |
|-------------------|-------------|----------------|
| Pitch deck | Impressed / Confident | Bold Signal |
| Conference talk | Inspired / Moved | Dark Botanical |
| Knowledge share | Calm / Focused | Swiss Modern |
| Internal update | Calm / Focused | Notebook Tabs |
| Workshop | Excited / Energized | Creative Voltage |
| Case study | Calm / Focused | Paper & Ink |

Override by setting a specific preset name above.

## Brand Context

Design tokens are read from `brand_context/visual-identity/tokens.json` when available.
Brand tokens override preset colours and typography but not layout principles.
