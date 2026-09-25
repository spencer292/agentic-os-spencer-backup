# 00-brand-build — System Config

Paths used by this orchestrator. Set by the parent system's installer; do not edit by hand
unless you moved the project root.

## Paths

- decoupled_base: C:/Claude/agent-os-v3/agentic-os
- env_file: C:/Claude/agent-os-v3/agentic-os/.env
- brand_context: C:/Claude/agent-os-v3/agentic-os/brand_context
- projects_base: C:/Claude/agent-os-v3/agentic-os/projects
- output_base: C:/Claude/agent-os-v3/agentic-os/projects/00-brand-build

## Settings

<!-- Pipeline defaults. Edit freely. -->

- stop_after: none        <!-- or a stage key (icp|strategy|positioning|voice|visual|book) to halt the pipeline early -->
- assemble_brand_book: true
- brand_book_path: brand_context/brand-book.pdf   <!-- combined 11-section book; distinct from visual-identity/brand-book.pdf -->
