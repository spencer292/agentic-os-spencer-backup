# 00-brand-build — System Config

Paths used by this orchestrator. Set by the system installer; do not edit by hand
unless you moved the project root.

## Paths

- decoupled_base: {{TARGET}}
- env_file: {{TARGET}}/.env
- brand_context: {{TARGET}}/brand_context
- projects_base: {{TARGET}}/projects
- output_base: {{TARGET}}/projects/00-brand-build

## Settings

<!-- Pipeline defaults. Edit freely. -->

- stop_after: none        <!-- or a stage key (icp|strategy|positioning|voice|visual|book) to halt the pipeline early -->
- assemble_brand_book: true
- brand_book_path: brand_context/brand-book.pdf   <!-- combined 11-section book; distinct from visual-identity/brand-book.pdf -->
