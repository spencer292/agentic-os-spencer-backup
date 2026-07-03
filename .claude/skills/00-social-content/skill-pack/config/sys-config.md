# 00-social-content — Operational Config

Edit this file to change runtime behavior. Set by the installer; update manually if you move your project folder.

This file is the **operational** config (paths, source toggles, image backend). For pipeline behavior (defaults, format rules, humanizer mode, publishing mode) edit `.claude/skills/00-social-content/skill-pack/config/pipeline.config.yaml` instead.

_customized: false

<!-- Single source of truth for the onboarding-done flag. Set to true after first-run onboarding completes; the orchestrator skips Phase 0 when true. -->

## Paths

<!--
Set by install.sh. Don't edit by hand unless you moved the project root.
The orchestrator reads this section at Phase 1 (CONFIG) to resolve where
.env, brand_context/, and projects/ live.
-->

- decoupled_base: C:/Claude/agent-os-v3/agentic-os
- env_file: C:/Claude/agent-os-v3/agentic-os/.env
- brand_context: C:/Claude/agent-os-v3/agentic-os/brand_context
- projects_base: C:/Claude/agent-os-v3/agentic-os/projects
- output_base: C:/Claude/agent-os-v3/agentic-os/projects/00-social-content

## Sources
linkedin_scraper: enabled
youtube_digest: enabled

## Generation
image_provider: gemini

## Publishing
pdf_carousel: ask
