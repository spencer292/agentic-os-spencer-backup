<!-- GSD:project-start source:PROJECT.md -->
## Project

**AEO Schema Integrity & Extractability**

A comprehensive fix-and-improve pass across the Got Moles website to eliminate schema duplication bugs, establish schema discipline rules, improve AEO extractability on all page types, and update the build playbook so future pages are correct from day one. This is a brownfield project against a live Next.js + Payload CMS site with 96+ pages stored in Supabase.

**Core Value:** Every page on the site emits clean, non-duplicate structured data and presents content in formats that AI engines can extract and cite — measurably improving the site's visibility in AI-generated answers.

### Constraints

- **Staging**: No localhost dev — verify everything on Vercel staging
- **CMS seeding**: Every schema fix needs code change + CMS re-seed or Payload API script
- **Pixelmojo budget**: 9 runs remaining — Roy handles runs manually at start and end
- **AI lag**: Hallucination correction has weeks-to-months lag after content changes
- **Spencer blockers**: LinkedIn URL and free-inspection language deferred — plan around
- **Locale**: US English spelling for all content
- **Parent project**: This is a child of the website-rebuild-rebrand project
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Existing Stack (Do Not Change)
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 16+ |
| CMS | Payload CMS | 3.80 (latest: ~3.84 as of research) |
| Database | Supabase (managed Postgres) | current |
| Hosting | Vercel | current |
| UI | shadcn/ui + Tailwind v4 | current |
| Rich text | @payloadcms/richtext-lexical | bundled with Payload 3.x |
## New Tooling Required
### 1. Schema Validation — Build-Time Duplicate Detection
| Tool | Purpose | Version | Confidence |
|------|---------|---------|------------|
| `schema-dts` (Google) | TypeScript types for Schema.org JSON-LD — compile-time validation that schema objects are structurally valid | ^1.0.0 | HIGH |
| `cheerio` | Parse rendered HTML from Vercel staging, extract `<script type="application/ld+json">` blocks, count @type occurrences per URL | ^1.0.0 | HIGH |
| Custom validation script | `scripts/validate-schema.ts` — crawls a URL list, extracts JSON-LD, asserts zero duplicate @type per page | — | HIGH |
- Google Rich Results Test — manual-only, no API, cannot run in CI
- Schema Sentry (HN post) — low adoption, unverified, dependency risk on a small project
- agentmarkup — Vite/Astro/Next.js build-time toolkit with promise, but LOW confidence (new, unverified production usage)
- TestSprite — commercial AI testing platform, not appropriate for a focused schema check
### 2. Schema Type Safety — Authoring Guard
### 3. FAQPage Schema — Keep It, Re-purpose Its Function
- ChatGPT Search, Perplexity, Gemini, Claude, and Google AI Overviews all actively parse FAQPage markup for Q&A extraction — independent of the SERP rich result feature
- Pages with FAQPage schema are cited 3.2x more in Google AI Overviews than pages without it
- Google confirmed the deprecation is a "search appearance change, not an algorithmic one" — it still reads the markup
### 4. Speakable Schema — Remove from /services/
### 5. Lexical Editor — Table Block
| Status | Detail |
|--------|--------|
| Stability | Marked EXPERIMENTAL in Payload 3.x — may change without major version bump |
| HTML converter bug | Known issue: tables stored in Lexical JSON may not render in the HTML converter output (Issue #7483) |
| Latest version | @payloadcms/richtext-lexical 3.84.0 (2026-05-20) |
- Building the table block as a Payload CMS Block (not Lexical feature) — this is the workaround some teams use, but it stores data differently and breaks the inline-content UX editors expect
- A WYSIWYG table outside Lexical — creates a parallel content pathway and defeats the CMS discipline
### 6. Lexical Editor — Ordered List Block
### 7. AEO Extractability Patterns — No Library Required
| Pattern | Implementation | What NOT to do |
|---------|---------------|---------------|
| TL;DR / BLUF box | Custom shadcn-compatible React component with `role="note"` and an explicit `<strong>TL;DR</strong>` label. Payload Block type so editors can insert it. | Don't use a plugin — the component is 20 lines of JSX |
| Answer paragraphs (40-60 words) | Editorial rule enforced by a character counter in the CMS field description or a validation hook | Don't rely on AI generation to hit word counts — set the rule and audit existing content manually |
| Freshness markers | Structured `dateModified` in JSON-LD + visible "Updated [Month Year]" text component tied to Payload's `updatedAt` field | Don't use a static string — it becomes stale; derive from the CMS timestamp |
| HTML tables | Lexical EXPERIMENTAL_TableFeature (see above) + custom JSX converter on frontend | Don't render tables as styled divs — AI crawlers read raw HTML, not rendered CSS |
| Ordered lists (process steps) | Convert existing "process triad" divs to `<ol>` in the frontend component, driven by Lexical OrderedListFeature content | Don't keep the visual triad layout while emitting div soup |
### 8. CMS Re-seeding — Payload Local API Scripts
## Installation Summary
# Schema type safety (authoring guard)
# HTML parsing for custom validation script
# No new installs needed for:
# - EXPERIMENTAL_TableFeature (bundled in @payloadcms/richtext-lexical)
# - OrderedListFeature (bundled in @payloadcms/richtext-lexical)
# - TL;DR component (custom React/shadcn)
# - CMS re-seed scripts (Payload Local API, already available)
- Screaming Frog SEO Spider — for the pre- and post-fix baseline crawl (Roy has access)
- Google Rich Results Test — for spot-checking individual pages after fixes
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Schema validation | Custom script + cheerio | Screaming Frog automated | SF has no CI/CD integration; good for one-off audits, not pipeline gates |
| Schema type safety | schema-dts | Manual type annotations | schema-dts provides complete Schema.org coverage with compile-time errors; manual types drift |
| Table in Lexical | EXPERIMENTAL_TableFeature | Custom Payload Block | Block approach breaks inline-content UX; editors expect tables inside paragraphs |
| AEO testing | Pixelmojo (manual) | Automated AEO scoring API | No production-ready AEO API exists for local service sites; Pixelmojo is the best available (9 runs remain — use strategically) |
| FAQPage schema | Keep it | Remove it | Google still reads it for AI extraction even after dropping rich results; removing costs AEO citations |
## Sources
- Next.js JSON-LD guide: https://nextjs.org/docs/app/guides/json-ld
- schema-dts (Google): https://github.com/google/schema-dts
- Payload official Lexical features: https://payloadcms.com/docs/rich-text/official-features
- Payload table issue #7483: https://github.com/payloadcms/payload/issues/7483
- @payloadcms/richtext-lexical on npm (v3.84.0): https://www.npmjs.com/package/@payloadcms/richtext-lexical
- Payload Local API: https://payloadcms.com/docs/local-api/overview
- FAQPage schema dropped (May 2026): https://www.getpassionfruit.com/blog/what-changed-with-google-drops-faq-rich-results-and-what-to-do-now
- FAQPage still valuable for AEO: https://www.frase.io/blog/faq-schema-ai-search-geo-aeo
- 40-60 word rule: https://www.loudface.co/blog/how-to-structure-content-for-ai-extraction
- HTML tables preferred by AI crawlers: https://outpaceseo.com/article/how-to-structure-data-tables-for-ai-overview-extraction/
- Speakable in 2026: https://smartpubtools.com/what-is-speakable-schema-does-it-still-matter-2026/
- Screaming Frog structured data: https://www.screamingfrog.co.uk/seo-spider/tutorials/structured-data-testing-validation/
- AEO best practices 2026: https://almcorp.com/blog/answer-engine-optimization-2026/
- TL;DR for AI extraction: https://trakkr.ai/article/tldr-blocks-for-ai-overviews
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
