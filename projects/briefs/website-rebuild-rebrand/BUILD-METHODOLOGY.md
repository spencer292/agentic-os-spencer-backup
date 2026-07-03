# Build Methodology — Website Rebuild

This document captures the proven build process for rebuilding a website using the Agentic OS skill chain. It is the operating manual for any agent session working on this project. Follow this sequence. Do not skip steps. Do not jump to code before design.

---

## Build Order (Non-Negotiable Sequence)

Every step depends on the one before it. Jumping ahead caused failures on prior projects (premature homepage build before page briefs existed, keyword misalignment requiring retroactive fixes, framework boilerplate errors from not researching current docs).

```
Phase 0: Security Baseline  ← RUNS AT START OF EVERY SESSION (see below)
Phase 1: Research           ← COMPLETE
Phase 2: Strategy           ← COMPLETE
Phase 3: Copy               ← COMPLETE
Phase 4: Design Framework   ← COMPLETE
Phase 5: Production Build   ← NEAR COMPLETE (remaining: contact form handler, tracking IDs, favicon)
Phase 6: Pre-Launch         ← NEXT (CWV test, schema validation, Spencer sign-off, DNS switch)
Phase 7: Paid Ads
```

### Phase 0: Security Baseline (Every Session)

**Run this at the start of every build session.** Security is not a phase — it's continuous.

| # | Check | How | When to act |
|---|-------|-----|-------------|
| 0.1 | **Dependency audit** | `npm audit` in the site directory | Fix critical/high immediately. Medium on next deploy. |
| 0.2 | **Outdated packages** | `npm outdated` | Update if security patches available |
| 0.3 | **CVE check** | Web search for latest CVEs on Next.js, Payload CMS, Supabase | Patch or mitigate same session |
| 0.4 | **Secrets check** | Grep source for hardcoded keys/tokens. Verify `.env` not in git. | Fix immediately if found |
| 0.5 | **Security headers** | Verify `headers()` in next.config.ts is present and current | Add/update if missing |
| 0.6 | **Access control** | Verify Payload collections have correct read/write access | Fix immediately if open |
| 0.7 | **Brute force protection** | Verify `maxLoginAttempts` on Users collection | Add if missing |

**Rule:** If any critical or high finding is discovered, fix it BEFORE doing any feature work that session. Security gates everything.

### Phase 4: Design Framework (Skill-Driven)

Run these skills in this order. Each produces artifacts the next one consumes.

| Step | Skill | Inputs | Outputs | Approval |
|------|-------|--------|---------|----------|
| 4.1 | `viz-design-system` | ICP, positioning, voice profile, brand assets | `brand_context/design-system.md`, CSS tokens, Tailwind config, visual spec | Roy + Moni review |
| 4.2 | `viz-page-architect` | Design system, page briefs (Phase 2), copy (Phase 3) | Section-by-section blueprints per page type, image direction per section | Roy review |
| 4.3 | `str-cro-audit` | Homepage blueprint from 4.2 | LIFT model validation, scored audit, fix list | Roy review |
| 4.4 | `viz-component-library` | Design system, blueprints, CRO fixes | Component specs with mobile variants, conversion psychology, accessibility | Moni review |
| 4.5 | Moni design review | All Phase 4 artifacts | Figma/Wix visual templates | Roy + Spencer approval |

**Gate:** No production code until 4.5 is approved.

### Phase 5: Production Build (Skill + Tool Chain)

| Step | What | Skill/Tool | Notes |
|------|------|-----------|-------|
| 5.1 | Infrastructure | Next.js + Payload CMS scaffold | Research latest docs online first. Never assume training data is current. |
| 5.2 | Global components | Header, footer, nav, trust bar, CTA blocks | Build from component specs (4.4) |
| 5.3 | Core pages | Each page from its blueprint (4.2) + copy (Phase 3) | Run Page Build Checklist per page |
| 5.4 | City pages | Data-driven template, one build for 72 pages | City template blueprint gets dedicated attention |
| 5.5 | Blog | Template + migrate existing posts | Blog Post Build Checklist per post |
| 5.6 | AdWords LPs | Noindex, minimal nav, conversion-focused | Separate from main site nav |
| 5.7 | Schema markup | JSON-LD triple-stack on all pages | See Schema Strategy below |
| 5.8 | Technical SEO | llms.txt, robots.txt, sitemap, redirects | See SEO Preservation Rules below |
| 5.9 | Tracking | GA4, Meta Pixel, AdWords conversion | Forms + click-to-call tested |
| 5.10 | Moni review | All pages on staging | Iterate until approved |

---

## Skill Chain Map

Which skills feed which. Load context per the Context Matrix in root CLAUDE.md.

```
mkt-icp ──────────┐
mkt-positioning ──┤
mkt-brand-voice ──┤
                  ▼
        viz-design-system ──────┐
                                ▼
                    viz-page-architect ──────┐
                                            ▼
                                str-cro-audit (validates blueprint)
                                            │
                                            ▼
                            viz-component-library (specs from validated blueprint)
                                            │
                                            ▼
                                mkt-copywriting (copy to blueprint sections)
                                            │
                                            ▼
                                tool-humanizer (every publishable word)
                                            │
                                            ▼
                                    PRODUCTION BUILD
```

**Rule:** Every task starts with "what skill handles this?" Check installed skills BEFORE doing any work. Skills first, not afterthought.

---

## Page Build Checklist

**Full technical reference:** `PAGE-BUILD-REFERENCE.md` — covers the CMS/code two-layer system, image pipeline, fallbackImage pattern, Lexical JSON, seed commands, deploy flow, and all known gotchas. Read it before building or updating any page.

Run this for every page. No exceptions.

1. **Blueprint exists** — section-by-section architecture from viz-page-architect
2. **Copy approved** — reviewed copy from Phase 3, merged into blueprint sections
3. **Keywords assigned** — target keyword, secondary keywords, from page-keyword mapping
4. **Schema planned** — JSON-LD type(s) for this page from schema plan
5. **Internal links mapped** — what links TO this page, what this page links TO
6. **Image direction set** — image brief per section from blueprint
7. **Build the page** — from blueprint + copy + design system tokens
8. **Schema implemented** — JSON-LD in page route (breadcrumb + page-type + FAQ if applicable). generateSchema: false on FAQ blocks.
9. **Rich Results Test** — run https://search.google.com/test/rich-results on the staging URL. Confirm correct schema type detected, no errors, no duplicate page-types.
10. **Humanizer pass** — run all publishable text through tool-humanizer (target 8.5+)
11. **CTA check** — one primary CTA per page, no competing actions, click-to-call on mobile
12. **Mobile test** — thumb-zone CTA, 48px touch targets, single column, no horizontal scroll
13. **SEO verification** — H1 matches target keyword, meta title/description set, OG tags

### Blog Post Build Checklist

1. **Cluster assigned** — which keyword cluster does this post belong to
2. **Keywords set** — primary keyword in H1, secondary in H2s
3. **Internal links** — links UP to hub page, links across to related posts
4. **GEO elements** — definition block in first 30%, FAQ section (3-5 questions), question-format H2s
5. **Schema** — Article + Person + BreadcrumbList + FAQPage
6. **Humanizer pass** — target 8.5+
7. **CTA** — contextual CTA to primary action (call, quiz, or inspection request)

### AEO Extractability Checklist

Run this for any page that should appear in AI-generated answers (ChatGPT, Perplexity, Gemini, Google AI Overviews). Based on evidence from 14 real sites studied during the AEO Schema Integrity project (Phase 4, 2026-05-23).

| # | Check | How to Verify |
|---|-------|---------------|
| 1 | **FAQ schema wired** — page.tsx emits `<JsonLd data={faqSchema(items)} />` for any page with FAQ content | View page source, search for `FAQPage` in JSON-LD |
| 2 | **Answer-first opening** — first paragraph gives a direct factual answer (40-60 words), no hook or question opener | Read the live page — first sentence states the answer |
| 3 | **Semantic process lists** — StepsProcessBlock renders `<ol>/<li>`, not flex div wrappers | `Invoke-WebRequest` on URL, check for `<ol` in response |
| 4 | **Comparison tables use `<table>`** — ServiceComparisonBlock and blog comparison tables render `<table>/<thead>/<tbody>` | `Invoke-WebRequest` on URL, check for `<table` in response |
| 5 | **Blog BLUF populated** — cornerstone blog posts have `bluf` field populated in blog-data.ts (renders as unlabeled `<p>` summary) | Check blog-data.ts for `bluf:` field on the post |
| 6 | **No labeled TL;DR boxes** — service pages do NOT have visible "TL;DR" labels; summary is embedded in natural copy | Read live service pages — no "TL;DR" heading visible |
| 7 | **Freshness signal** — `dateModified` in schema derives from `BUSINESS.siteLastUpdated` in schema.tsx, not hardcoded | Check schema.tsx BUSINESS constant |
| 8 | **Keyword preservation** — H1, meta title, and meta description still align with primary keyword from `target-keywords.md` | Compare live page against target-keywords.md |

**What NOT to do (dropped after evidence review):**
- Do NOT add labeled TL;DR callout boxes with visible "TL;DR" headings — no top-ranking real site uses these
- Do NOT add speakable schema to service pages — Google says "no special schema needed"
- Do NOT count entity density per page — the "15+ entities" metric was fabricated
- Do NOT wrap content in `<aside role="note">` — no real site uses this pattern

### Change Verification Protocol

**Mandatory for any schema change or content structure change.** This 6-step protocol was established during the AEO Schema Integrity project and applies to all future changes that touch schema functions, CMS blocks, page components, or pages-data.ts.

| Step | Action | Details |
|------|--------|---------|
| 1 | **Code change** | Edit source files (schema functions, blocks, components, pages-data.ts) |
| 2 | **CMS fix script** | Write Payload Local API PATCH script with `--dry-run` default; run dry-run first, review output, then `--apply`. Skip only if no CMS data changed. |
| 3 | **Vercel deploy** | `git push mine main` — wait for rebuild; verify rendered output in browser |
| 4 | **Rich Results Test** | Run Google Rich Results Test (https://search.google.com/test/rich-results) on affected URLs; confirm correct schema type, no errors, no duplicates |
| 5 | **Keyword check** | Verify H1 text, page titles, and meta descriptions still align with `target-keywords.md` primary keywords for that page |
| 6 | **Regression check** | `Invoke-WebRequest` spot-check 2-3 unrelated pages to confirm no cascade damage |

Do not skip steps. Step 4 (Rich Results Test) has no API — it requires a manual browser visit to Google's test tool.

---

## SEO Preservation Rules

**This project has 635 #1 keywords. Protecting existing rankings is as important as adding new ones.**

### Redirect Strategy
- 340 existing URLs consolidating to ~126 pages + ~291 redirects
- Every old URL must resolve via 301 redirect to the correct new URL
- Redirect map is in `phase-2-site-structure.md` (URL inventory)
- Redirects configured in `next.config.js` (not server-level)
- **Redirect validation is a build gate** — test every redirect before DNS switch
- Use a staging deployment to validate all redirects before go-live

### Content Preservation
- City pages are the SEO backbone (~72 pages). The city template needs as much design attention as the homepage.
- Existing blog posts that rank must keep their content substance. New design wraps around content, does not replace it.
- H1 tags must match target keywords exactly (from page-keyword mapping)
- Meta titles and descriptions from Phase 2 keyword mapping

### Schema Strategy (Additive, Not Replacement)
Current site has zero schema (scored 2.7/10). Adding schema is pure upside.

**Triple-stack approach:**
1. **Entity schema** — Person (Spencer Hill), Organization (Got Moles), connected via `@id`
2. **Page-type schema** — LocalBusiness, Service, FAQPage, Article, HowTo per page type
3. **Engagement schema** — Review, AggregateRating, BreadcrumbList

Shared entity definitions live in a single `schema.ts` file. All pages reference the same Person and Organization `@id` so AI engines see a coherent entity graph.

### GEO Strategy (First-Mover Advantage)
Zero competitors are doing GEO. Every page must include:
- Definition blocks in first 30% of content (AI engines cite from early content)
- Question-formatted H2/H3 headers matching user queries
- FAQ sections (3-7 questions per page, FAQPage schema)
- Specific, citable statistics (5,000 clients, 219 reviews, 7 years)
- Named entities with credentials (Spencer Hill, US Army veteran, founder)
- llms.txt at /llms.txt (AI engine entity description)
- robots.txt allowing AI crawlers (GPTBot, ClaudeBot, PerplexityBot)

### Soft Launch Protocol

**Note:** Got Moles deploys directly to production on `git push mine main`. There is no separate staging environment. Deploy during US off-hours (UK morning) for lower-risk windows. If a deploy breaks the site, revert the commit immediately.

1. Validate all 291 redirects resolve correctly
2. Run schema validation on all pages
3. Run internal link check (no 404s)
4. Mobile responsiveness audit
5. Core Web Vitals test
6. Spencer + Roy final sign-off
7. DNS switch
8. 30-day post-launch monitoring

---

## Tech Stack

### Production Platform

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Next.js 16+ (App Router) | Server-side rendering, static generation, API routes |
| **CMS** | Payload CMS 3.80 | Content management, admin panel, collections, blocks |
| **Database** | Supabase (managed PostgreSQL) | Payload data store, city page data. IPv4 pooler port 6543. |
| **Hosting** | Vercel | Production + staging. Preview deployments for team review. |
| **Storage** | Vercel Blob | Media uploads (images, PDFs). Auto-configured in Vercel dashboard. |
| **Components** | shadcn/ui + Tailwind v4 | UI components, design system implementation |

### Why This Stack
- **Next.js 16** — SEO-first (SSR/SSG), React 19, excellent Core Web Vitals, image optimization built in
- **Payload CMS 3.80** — headless, block-based content (matches our blueprint approach), built on Next.js (single deployment), admin panel included
- **Supabase** — managed PostgreSQL, no VPS maintenance, built-in auth, free tier for staging. Proven on ATP website build.
- **Vercel** — zero-config deploy, preview URLs for every push, edge network for performance
- **Vercel Blob** — CDN-backed media storage, auto-configured, no S3 setup needed

### Stack Precedent
This exact stack is running in production on the ATP website (allthepower.co.uk). Block types, collection patterns, and deployment flow are proven. Got Moles replicates the infrastructure and adds domain-specific collections (CityPages, Services).

### Critical Build Rules
1. **Always research latest docs online before ANY build step.** Framework APIs change. Payload CMS 3.0 has breaking changes from 2.x. Never assume training data is current.
2. **Use official scaffolding tools** (e.g., `npx create-payload-app`). Never hand-write framework boilerplate. This caused multiple build failures on prior projects.
3. **When hitting 2+ errors, STOP and review fundamentals.** Don't patch. Go back to docs.
4. **All source code, configs, dependencies inside the project folder.** Never at the agentic-os root.
5. **NEVER deploy via Vercel CLI.** No `vercel deploy`, no `vercel --prod`, no Vercel CLI commands. The only deploy path is `git push mine main` → GitHub → Vercel auto-deploy. CLI deploys caused a site-wide 404 on 2026-05-21. If a deploy breaks the site, revert the commit and push the revert — never redeploy from CLI.
6. **Vercel: set Framework Preset to "Next.js" BEFORE first deploy.** Blank Vercel projects default to "Other", which serves static files and returns 404 on every route. Verify in Project Settings → General → Framework Preset. Or import from Git (auto-detects). Learned: Got Moles deploy 2026-04-01.
7. **Vercel: add environment variables BEFORE first deploy.** DATABASE_URI and PAYLOAD_SECRET must be set in Vercel dashboard (Settings → Environment Variables) before deploying. Without them, Payload can't initialize at runtime.
8. **New block types need DB tables BEFORE deploy.** Adding a block to `allBlocks` without its tables in Supabase causes runtime 404 (build succeeds, serverless cold start fails). Run local dev server first (Payload auto-syncs schema) or use `npx payload migrate:create` + `npx payload migrate`. Three failed deploys in 2026-05-22 taught this.
9. **Always reseed AND push.** Reseeding updates Supabase but Vercel caches pages at build time. A reseed without `git push mine main` leaves the live site showing stale data. Both steps are mandatory — see PAGE-BUILD-REFERENCE.md Pre-Deploy Checklist.
10. **Never modify importMap.js or payload.config.ts for default features.** OrderedListFeature is a Payload default. importMap.js is auto-generated by dev mode. Revert any dev-mode changes before committing.

### Deployment Tools

| Tool | URL | Purpose | Access |
|------|-----|---------|--------|
| **Vercel** | vercel.com | Production hosting. Auto-deploys on `git push mine main`. | Roy's account |
| **Payload Admin** | {domain}/admin | CMS content management, Spencer/Roy trained | Auto-created by Payload |
| **Google Search Console** | search.google.com/search-console | SEO monitoring, indexing, search performance | Roy to claim after DNS switch |
| **Google Analytics 4** | analytics.google.com | Traffic, conversions, user behavior | Roy to set up |
| **Google Ads** | ads.google.com | Paid search campaigns | Spencer to grant Roy access |
| **Meta Business Suite** | business.facebook.com | Meta Ads, Facebook/Instagram management | Spencer to set up |

### Content & Review Tools

| Tool | URL | Purpose |
|------|-----|---------|
| **Notion** | notion.so | Review mechanism. All deliverables pushed here for team review. |
| **Figma** (or Wix prototype) | figma.com | Moni's design tool. Visual references for Claude to build from. |
| **ScoreApp** | score.got-moles.com | Lead gen quiz. Live design reference for new brand implementation. |

### SEO & Validation Tools

| Tool | Purpose | When |
|------|---------|------|
| **Google Rich Results Test** | Schema validation | After every page build |
| **PageSpeed Insights** | Core Web Vitals | Pre-launch audit |
| **Screaming Frog / Sitebulb** | Redirect validation, broken link check | Pre-launch (Ian runs this) |
| **ahrefs / Semrush** | Keyword tracking, ranking verification | Post-launch monitoring |

#### AEO Baseline vs Final (Pixelmojo)

Pixelmojo AEO benchmark comparison for the AEO Schema Integrity project. Roy runs Pixelmojo manually — fill in scores when available.

| Metric | Pre-Project Baseline | Post-Phase 4 | Final (Post-Phase 5) |
|--------|---------------------|--------------|---------------------|
| Overall AEO Score | _pending_ | _pending_ | _pending_ |
| Schema Score | _pending_ | _pending_ | _pending_ |
| Extractability Score | _pending_ | _pending_ | _pending_ |
| Date Run | _pending_ | _pending_ | _pending_ |

**What changed between runs:** Phases 1-4 fixed duplicate schema on 5 page types, added dateModified/aggregateRating/Person enrichment, built TableBlock and TLDRBlock, converted StepsProcessBlock to semantic ol/li, added FAQ schema to service pages, added answer-first paragraphs, fixed blog title double suffix, and added comparison tables.

### Image & Media Tools

| Tool | Purpose | Rules |
|------|---------|-------|
| **WebP conversion** | Image optimization | All images served as WebP, explicit width/height |
| **Hero images** | LCP element | Preloaded with `fetchpriority="high"`, NEVER lazy-loaded |
| **Below-fold images** | Non-critical | `loading="lazy"` always |
| **Target** | Page weight | Under 1MB total per page |

---

## Design-to-Code Workflow

**Updated 2026-04-01:** Moni reviews in-browser on staging, not upfront in Figma. Claude builds from specs. This removes the Figma gate and lets building start immediately.

```
1. Claude runs viz-design-system ✅ COMPLETE
   → design-system.md, CSS tokens, Tailwind config, visual spec

2. Claude runs viz-page-architect ✅ COMPLETE
   → Section-by-section blueprints for all page types
   → CRO audit applied to homepage + TMCP blueprints

3. Claude runs viz-component-library ✅ COMPLETE
   → 7 component specs with mobile variants

4. Claude builds production pages ← NOW
   → FROM: blueprints + approved copy + design tokens + component specs
   → Pages deployed to staging (Vercel)
   → Moni reviews in browser, requests adjustments
   → Claude implements adjustments
   → Iterate until approved

5. Technical SEO layer
   → Schema, redirects, llms.txt, robots.txt, sitemap
   → Ian validates SEO implementation

6. Pre-launch audit
   → Mobile, performance, links, redirects, schema
   → Spencer + Roy final sign-off
   → DNS switch
```

---

## Build Session Startup

**Run this every time you start a build session.** Copy-paste friendly.

### 1. Make changes

Edit files in `site/src/`. No localhost dev server — all verification happens on the live Vercel deployment after push.

### 2. Deploy to production

```bash
cd "C:\Claude\Agent-os-v2\agentic-os"
git add clients/got-moles/projects/briefs/website-rebuild-rebrand/site/...
git commit -m "Description of changes"
git push mine main
```

Vercel auto-deploys from `freeflyroy/agent-os` on every push to `main`. Build takes 1-2 minutes. Production URL: `got-moles.com`.

**NEVER use `vercel deploy --prod` or any Vercel CLI deploy command.** The only deploy path is `git push mine main` → GitHub → Vercel. CLI deploys bypass the git pipeline and have caused site-wide 404s (2026-05-21 incident). This rule applies to all agents and all sessions — no exceptions, no fallbacks.

If the build is suspiciously fast (under 30 seconds), check Vercel dashboard → Project Settings → General → Framework Preset = "Next.js". The `vercel.json` should prevent this, but verify if it happens.

### Git remotes

See root `CLAUDE.md` → **Git & Deployment** section for the two-remote setup. Key rule: push to `mine`, never to `origin`.

### 3. Environment variables

These must be set in TWO places:

| Variable | Local (`.env`) | Vercel (dashboard → Environment Variables) |
|----------|---------------|-------------------------------------------|
| `DATABASE_URI` | Your Supabase connection string (Transaction pooler, port 6543) | Same value |
| `PAYLOAD_SECRET` | Any random string | Same value |
| `BLOB_READ_WRITE_TOKEN` | Not needed locally | Auto-set when Blob enabled in Vercel |

### 4. If something breaks

- **Admin panel error:** Run `npx payload generate:importmap` then restart dev server
- **Vercel 404 after deploy:** DO NOT redeploy via CLI. Revert the commit on main (`git revert HEAD && git push mine main`) and investigate. Check Framework Preset = "Next.js" in Vercel dashboard. Check `vercel.json` exists.
- **Database connection error:** Check `.env` has the Supabase Transaction pooler URI (port 6543, not 5432)
- **2+ build errors:** Stop. Research latest docs online. Don't patch.

### Key files

| File | Purpose |
|------|---------|
| `site/.env` | Local secrets (gitignored) |
| `site/.env.example` | Template for secrets |
| `site/vercel.json` | Forces Next.js framework on Vercel |
| `site/src/payload.config.ts` | CMS configuration (collections, globals, plugins) |
| `site/src/app/globals.css` | Design system tokens (colors, fonts, spacing) |
| `site/src/components/` | Shared components (Header, Footer, TrustBar, etc.) |
| `site/src/app/(frontend)/` | Page routes |
| `site/src/app/(payload)/` | Admin panel routes |
| `site/public/fonts/` | Self-hosted font files |
| `site/public/images/` | Static images |

---

## Process Discipline Rules

Learned from prior builds. Non-negotiable.

1. **Skills first.** Every task starts with "what skill handles this?" Check installed skills before doing any work.
2. **Research before build.** Always look up latest framework docs online before any significant technical work.
3. **SEO/GEO front of mind.** Not a second pass. Every page: what keyword? What schema? What internal links? Check BEFORE building.
4. **Humanizer gate.** Every publishable word runs through tool-humanizer. Target score 8.5+. No exceptions.
5. **Three-beat rule.** All content follows Recognition (here's what you're feeling) → Reframe (here's what's actually happening) → Utility (here's what to do). Applies to every page, every section.
6. **One GSD project at a time.** `.planning/` is shared. Finish or archive before starting another.
7. **Notion is the review mechanism.** Push every deliverable to Notion when created or updated. Team reviews there.
8. **Update memory incrementally.** Log deliverables and decisions to `context/memory/` as they happen, not just at wrap-up.
9. **Stop on errors.** When hitting 2+ errors, stop and review fundamentals. Don't patch.
10. **Project containment.** All source code, configs, dependencies, build artifacts inside the project folder. Never at the agentic-os root.

---

## Team Roles in Build Phase

| Person | Role | Involvement |
|--------|------|-------------|
| **Roy** | Project Lead | Reviews blueprints, approves designs, coordinates team, manages Spencer |
| **Spencer** | Client/Owner | Approves designs, provides photos/content, final sign-off |
| **Moni** | Designer | Creates visual designs from specs, reviews browser builds, requests adjustments |
| **Ian** | SEO Specialist | Reviews blueprints for SEO, validates schema, runs pre-launch SEO audit |
| **Claude** | AI Assistant | Runs skills, generates specs, builds production code, implements adjustments |

**Human-in-the-loop rule:** Claude produces, humans approve. No page goes live without Roy + Spencer sign-off. No design decision without Moni review. No SEO change without Ian check.

---

## Quick Reference: Skill Triggers

| When you need to... | Run this skill |
|---------------------|---------------|
| Build design tokens, typography, color system | `viz-design-system` |
| Create section-by-section page blueprint | `viz-page-architect` |
| Validate a page blueprint for conversion | `str-cro-audit` |
| Generate component specs with mobile variants | `viz-component-library` |
| Write page copy to a blueprint | `mkt-copywriting` |
| Score/fix AI patterns in text | `tool-humanizer` |
| Optimize for AI search engines | `str-ai-seo` |
| Extract/build brand voice | `mkt-brand-voice` |
| Build ICP profile | `mkt-icp` |
| Find positioning angles | `mkt-positioning` |
| Scrape competitor sites | `tool-firecrawl-scraper` |
| Generate images | `viz-nano-banana` |
| Create diagrams | `viz-excalidraw-diagram` |
| Create UGC video scripts | `mkt-ugc-scripts` |
| Research trending topics | `str-trending-research` |

---

*This document is the operating manual for any agent session working on this project. It is reusable across similar website rebuild projects. Update it when process improvements are discovered.*
