# 00-youtube-to-ebook Configuration

_customized: false

<!-- Single source of truth for the onboarding-done flag. Set to true after first-run onboarding completes; the orchestrator skips Phase 0 when true. -->

## Paths

<!--
Set by install.sh. Don't edit by hand unless you moved the project root.
The orchestrator reads this section at Step 1 to resolve where .env,
brand_context/, and projects/ live.
-->

- decoupled_base: C:/Claude/agent-os-v3/agentic-os
- env_file: C:/Claude/agent-os-v3/agentic-os/.env
- brand_context: C:/Claude/agent-os-v3/agentic-os/brand_context
- projects_base: C:/Claude/agent-os-v3/agentic-os/projects

## Article Style
- Default style: editorial long-form (magazine feature)
- Jargon handling: explain inline on first use
- Target length: 2,000-5,000 words (scales with source)

## PDF Format
- Design: minimal
- Design options: minimal (clean serif, no branding) | branded (uses design tokens + optional assets)
- Branding intensity: subtle
- Tokens path: brand_context/visual-identity/tokens.json
- Font: serif (Georgia / Times New Roman) when minimal; from design tokens when branded
- Margins: 2.5cm
- No cover page, no headers/footers

## Header
- Show logo: no
- Show links: no
- Links to show:

## Pipeline Behavior
- Fact-check checkpoint: always pause for review
- Humanizer mode: deep (if voice-profile exists), standard (otherwise)
- Copy PDF to ~/Downloads: yes
