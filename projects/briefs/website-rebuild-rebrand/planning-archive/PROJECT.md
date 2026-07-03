# PROJECT: Got Moles — Website Rebuild & Rebrand

**Brief:** `projects/briefs/website-rebuild-rebrand/brief.md`
**Status:** QA & Repairs — fixing production issues found during review. Design migration complete.
**Created:** 2026-03-27
**Updated:** 2026-04-08

## Summary

Full website rebuild and rebrand for got-moles.com. World-class SEO preserving an existing dominant footprint (635 #1 keywords). GEO built from scratch to make Got Moles the default AI-cited answer for mole control in Western Washington. New brand identity applied across all touchpoints.

## Current State

- Phase 1 (Research): **COMPLETE**
- Phase 2 (Strategy): **COMPLETE**
- Phase 3 (Copy): **COMPLETE** — 18 copy files (~17,500 words), all humanized. 7 blog articles.
- Phase 4 (Design Framework): **COMPLETE** — design system, 9 blueprints, CRO audits, 7 component specs
- Phase 5 (Infrastructure): **COMPLETE** — Next.js 16 + Payload 3.81 + Supabase + Vercel + Vercel Blob
- Phase 5 (Production Pages): **ALL PAGES BUILT** — 9 core pages + 77 city pages + blog (7 articles) + 4 AdWords LPs. Live on project-pf8c6.vercel.app.
- Phase 5 (Technical SEO): **COMPLETE** — schema, llms.txt, robots.txt, sitemap, 500+ redirects
- Phase 5 (Content/Media): **COMPLETE** — 60 CMS documents, 14 WebP images, Vercel Blob
- Phase 5 (Reviews): **COMPLETE** — 183 real Spencer-ranked reviews replacing all placeholders
- Phase 5 (Design Migration): **COMPLETE** — DM-1 through DM-5 done. All components rebuilt to Moni's design principles.
- **Phase 5 (QA & Repairs): ← ACTIVE** — Production issues found during Roy review (2026-04-08). Mobile menu, testimonial lines, guarantee language, trust strips, cream sections, city content enrichment all fixed. Contact page under review.
- Phase 5 (Tracking): **BLOCKED** — GA4, Meta Pixel, AdWords infrastructure ready, waiting on IDs from Spencer
- Phase 5 (Training): Not started — Spencer/Roy Payload admin training
- Phase 6 (Pre-Launch): Not started — depends on QA completion + tracking IDs

## Active Work — Design Migration

**Plan:** `projects/briefs/website-rebuild-rebrand/DESIGN-MIGRATION-PLAN.md`
**Source of truth:** `brand_context/design-principles.md` (16 rules)
**Reference:** Figma screenshots (`brand_context/moni-design-input/Moni notes/FigmaScreeshots/`), test pages (`/test/homepage`, `/test/how-it-works`, `/test/city`)

| Wave | What | Tasks | Status |
|------|------|-------|--------|
| DM-1 | Foundation (Section, dividers, typography, data) | DM-1a through DM-1d | Not started |
| DM-2 | Header + Hero + Trust (interdependent cluster) | DM-2a through DM-2c | Not started |
| DM-3 | Section components (independent) | DM-3a through DM-3f | Not started |
| DM-4 | Global polish (buttons, borders, landing pages, footer) | DM-4a through DM-4e | Not started |
| DM-5 | Verification + sign-off | DM-5a through DM-5f | Not started |

**Key lesson (2026-04-06):** Phase 5 components were built from Phase 4 blueprints before Moni's design review. The design review introduced 16 structural principles (transparent header, trust-in-hero, no dividers, no card borders, progressive disclosure, dark-first surfaces, etc.) that require component rewrites, not CSS patches. Attempting piecemeal changes without a plan caused drift and was reverted.

- New branding assets: RECEIVED 27 March
- Spencer review meeting: completed 25 March. Stories verbally confirmed, awaiting written sign-off.
- Spencer's curated reviews (183, ranked): RECEIVED 2026-04-05, stored in reference-data/

## Build Methodology

**Read `projects/briefs/website-rebuild-rebrand/BUILD-METHODOLOGY.md` before starting any build work.** Contains the full skill chain, page build checklist, SEO preservation rules, and process discipline.

## What's Confirmed

- Domain stays as got-moles.com
- Two residential programmes: Eradication ($450) and TMCP ($100/month) for properties under 1 acre
- Commercial: quoted on inspection, annual contracts
- Guarantee: $150 setup fee only if no moles caught (eradication programme only)
- ~500 active TMCP clients, ~4,973 total clients, 219+ reviews
- Team: Spencer Hill (owner), Cory Ventura (lead tech)
- Service area: 60+ cities across Western Washington
- Five differentiators confirmed by Spencer

## What's Pending

- Spencer's written confirmation on father's story and TMCP origin story
- Spencer's FAQs and phone objections (not yet provided)
- Spencer's photos (not yet provided)
- ~~New branding assets from Roy~~ RECEIVED 27 March
- AdWords account access
- Google Analytics access to current site
- ~~Production platform decision~~ DECIDED: Next.js + Payload CMS 3.0 + PostgreSQL + DigitalOcean
- Moni review of design system (3 deliverables need pushing to Notion)
- Spencer: substantiation for "WA's #1" claim (dropped from all copy until substantiated)

## Key Principles

**Research:** Notion's original project docs were reference only. Claude redid all research as the source of truth.

**Review & Collaboration:** Notion is the review and client review mechanism. All deliverables are pushed to Notion for Roy, Spencer, Ian, and Moni to review. When deliverables are updated locally, Notion must also be updated. Local files are working copies; Notion is the review copy.

**Notion project:** https://www.notion.so/ea4988835e2f4dfa8994df3d707f8e38?v=f7db373473d34c2cbad6ea24f27bfe25
