---
project: mole-content-authority
status: active
level: 2
created: 2026-04-07
parent: got-moles-marketing-os
---

# Mole Content Authority — Knowledge Base & Content Engine

## Goal

Build a comprehensive mole knowledge base from Got Moles' proprietary field guide + exhaustive search intent research, then create a content creation skill and content plan that answers every question people ask about moles.

## Context

Got Moles has a 26-page internal Technician Field Guide (Version 1.1, 2026) covering:
- Three mole species in service area (Townsend's, Pacific Coast, Shrew Mole)
- Mole biology, diet, breeding, tunnel architecture
- Seasonal behavior patterns in Western Washington
- Professional trapping methodology
- Customer communication frameworks
- Species comparison charts

This proprietary knowledge is a massive competitive advantage that isn't being used for content. Currently only 7 blog posts exist on the site.

## Deliverables

- [x] **Mole Knowledge Base** — Structured reference document extracting all publishable knowledge from the field guide + external research. Organized by topic for easy content creation. (`brand_context/mole-knowledge-base.md`)
- [x] **Search Intent Map** — Every question people ask about moles, organized by intent category, with content gap analysis against existing 7 blog posts. (`projects/briefs/mole-content-authority/search-intent-map.md`)
- [x] **Content Plan** — Blog topics, social content themes, FAQ expansions — prioritized by search volume and content gaps. (`projects/briefs/mole-content-authority/content-plan.md`)
- [x] **Authority Content Skill** — New `mkt-authority-content` skill for producing SEO/GEO-optimized informational content from the knowledge base. (`.claude/skills/mkt-authority-content/`)

## Acceptance Criteria

- Knowledge base covers all topics from the field guide that are safe to publish (no proprietary trapping techniques, no confidential business processes)
- Search intent map covers 200+ unique queries across 10+ intent categories
- Content plan has enough topics for 6+ months of weekly blog posts + daily social
- New skill produces content that passes humanizer, meets SEO/GEO standards, and draws from the knowledge base
- Everything stays away from legal claims (no Initiative 713 compliance, no "WA's #1")

## Constraints

- US English spelling throughout
- No confidential trapping techniques or business processes in published content
- No legal/compliance claims
- Content positions Got Moles as the knowledgeable authority, not a hard sell
- All content must be factually accurate — cite WSU Extension, WDFW where applicable

## Source Material

- `Got Moles Technician Field Guide v1.1` (Google Drive: 23_Got Moles/p6wrkgy_interior.pdf)
- Existing 7 blog posts in `site/src/lib/blog-data.ts`
- Brand context (voice profile, ICP, positioning)
- Search intent research (in progress)
