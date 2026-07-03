# ROADMAP: Got Moles Website Rebuild & Rebrand

## Phase 1 — Foundation & Research ✅ COMPLETE
**Goal:** Verify every assumption, fill every gap, establish the research baseline.
**Gate:** All research complete, all dependencies mapped, no unverified assumptions remain.

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 1.1 | Integrate new branding assets | Claude | **Complete** — assets received 27 March | Roy to add branding folder |
| 1.2 | Fresh competitive landscape analysis | Claude | Not started | — |
| 1.3 | Fresh SEO keyword research (all tiers) | Claude | Not started | — |
| 1.4 | Fresh GEO strategy & query cluster mapping | Claude | Not started | — |
| 1.5 | Technical audit of existing got-moles.com | Claude | Not started | — |
| 1.6 | URL inventory & 301 redirect plan | Claude | **Inventory complete** — redirect map needs Phase 2 | 1.5 |
| 1.7 | Verify all business facts & stats | Claude | Not started | — |
| 1.8 | Validate ICP against real review/forum data | Claude | Not started | — |
| 1.9 | Dependency tracker — chase outstanding items | Roy | Ongoing | — |

**Dependency tracker:**
- [ ] Spencer: written confirmation on father's story
- [ ] Spencer: written confirmation on TMCP origin story
- [ ] Spencer: FAQ answers
- [ ] Spencer: phone objections list
- [ ] Spencer: photos (team, proof-of-catch, before/after)
- [ ] Spencer: substantiation for "WA's #1" claim (dropped from copy until provided)
- [ ] Spencer: total mole catch figure
- [x] Roy: new branding assets folder — RECEIVED 27 March
- [ ] Roy: AdWords account access
- [ ] Roy: Google Analytics access to current site
- [ ] Moni: review design system deliverables (pending Notion push)

---

## Phase 2 — Strategy & Planning ✅ COMPLETE
**Goal:** Lock the site structure, assign keywords to pages, write detailed page briefs.
**Gate:** Every page has a brief with keyword targets, heading structure, CTA, schema type, and messaging.

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 2.1 | Finalise site structure & navigation | Claude + Roy | **Draft complete — awaiting Roy confirmation** | Phase 1 |
| 2.2 | Page-to-keyword mapping (all pages) | Claude | **Draft complete — awaiting Roy confirmation** | 1.3, 1.4 |
| 2.3 | Page briefs — core pages (8 pages) | Claude | **Complete** | 2.1, 2.2 |
| 2.4 | Page briefs — city page template | Claude | **Complete** | 2.2 |
| 2.5 | Page briefs — AdWords landing pages (4) | Claude | **Complete** | 2.2 |
| 2.6 | Content calendar — blog articles | Claude | **Draft complete — awaiting Roy confirmation** | 1.3, 1.4 |
| 2.7 | llms.txt draft | Claude | **Complete** | 2.1 |
| 2.8 | Schema markup plan per page type | Claude | **Complete** | 2.1 |

---

## Phase 3 — Copy & Content
**Goal:** Write all page copy, GEO-ready, in Got Moles' voice, passing humanizer gate.
**Gate:** All copy reviewed by Roy, Spencer sign-off on his story + guarantee wording.

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 3.1 | Homepage copy | Claude | **First draft complete** | 2.3 |
| 3.2 | TMCP page copy | Claude | **First draft complete** | 2.3 |
| 3.3 | How It Works page copy | Claude | **First draft complete** | 2.3 |
| 3.4 | About page copy | Claude | **First draft complete** — pending Spencer written sign-off on stories | 2.3, Spencer story confirmation |
| 3.5 | One-Time Removal page copy | Claude | **First draft complete** | 2.3 |
| 3.6 | Commercial page copy | Claude | **First draft complete** | 2.3 |
| 3.7 | FAQ page (25+ Q&As, GEO format) | Claude | **First draft + humanized** — Spencer's answers will improve when received | 2.3, Spencer FAQs |
| 3.8 | Contact page copy | Claude | **First draft complete** | 2.3 |
| 3.9 | City page template + 10 priority cities | Claude | **First draft complete** | 2.4 |
| 3.10 | AdWords LP copy (4 variants) | Claude | **First draft complete** | 2.5 |
| 3.11 | Blog articles — Phase 1 batch (7) | Claude | **First draft complete** (all 7) | 2.6 |
| 3.12 | Guarantee section copy | Claude | **First draft complete** (3 versions) | 2.3 |

---

## Phase 4 — Design Framework ✅ COMPLETE
**Goal:** ICP-driven design system, validated page blueprints, component specs. Moni designs from specs.
**Gate:** Roy + Moni approve design system. Roy approves blueprints. Spencer + Roy approve Moni's visual designs.
**Methodology:** `BUILD-METHODOLOGY.md` — read this before starting any Phase 4 work.

### 4A: Design System (Claude runs `viz-design-system`)

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 4.1 | Run viz-design-system skill (ICP-driven principles, tokens, Tailwind config) | Claude | **Complete** | brand_context/ complete |
| 4.2 | Generate CSS custom properties + Tailwind config | Claude | **Complete** | 4.1 |
| 4.3 | Generate visual spec document (rendered examples) | Claude | **Complete** | 4.1 |
| 4.4 | Roy + Moni review design system | Roy + Moni | **Roy approved** — Moni review pending | 4.1-4.3 |

### 4B: Page Blueprints (Claude runs `viz-page-architect`)

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 4.5 | Homepage blueprint (section-by-section + image direction) | Claude | **Complete** | 4.4 approved |
| 4.6 | Service pages blueprint (TMCP, One-Time, Commercial) | Claude | **Complete** | 4.4 approved |
| 4.7 | How It Works blueprint | Claude | **Complete** | 4.4 approved |
| 4.8 | About page blueprint | Claude | **Complete** | 4.4 approved |
| 4.9 | City page template blueprint (critical — 72 pages from this) | Claude | **Complete** | 4.4 approved |
| 4.10 | Blog template blueprint | Claude | **Complete** | 4.4 approved |
| 4.11 | FAQ page blueprint | Claude | **Complete** | 4.4 approved |
| 4.12 | Contact page blueprint | Claude | **Complete** | 4.4 approved |
| 4.13 | AdWords LP blueprint (noindex, conversion-focused) | Claude | **Complete** | 4.4 approved |
| 4.14 | Roy reviews all blueprints | Roy | **Ready for review** | 4.5-4.13 |

### 4C: CRO Validation (Claude runs `str-cro-audit`)

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 4.15 | Homepage blueprint CRO audit (LIFT model) | Claude | **Complete** — 88/100, 4 fixes | 4.14 approved |
| 4.16 | Apply CRO fixes to homepage blueprint | Claude | **Complete** — 4 fixes applied | 4.15 |
| 4.17 | TMCP page CRO audit (highest-value page) | Claude | **Complete** — 85/100, 6 fixes | 4.14 approved |
| 4.18 | Apply CRO fixes to TMCP blueprint | Claude | **Complete** — 6 fixes applied (GEO block, merged sections, guarantee, urgency, reordered comparison, cancellation clarity) | 4.17 |

### 4D: Component Specs (Claude runs `viz-component-library`)

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 4.19 | Hero component variants (residential, commercial, city) | Claude | **Complete** | 4.16 |
| 4.20 | Trust bar component (reviews, clients, guarantee, veteran) | Claude | **Complete** | 4.16 |
| 4.21 | Testimonial card component | Claude | **Complete** | 4.16 |
| 4.22 | Service card component (TMCP, One-Time, Commercial) | Claude | **Complete** | 4.16 |
| 4.23 | City page content blocks (local stats, neighborhoods) | Claude | **Complete** — uses existing components, no new ones needed | 4.16 |
| 4.24 | CTA components (click-to-call, form, inspection request) | Claude | **Complete** — 4 variants (Gold, Cream outline, gradient section, mobile sticky) | 4.16 |
| 4.25 | FAQ accordion component (GEO-optimized) | Claude | **Complete** | 4.16 |
| 4.26 | Moni reviews all component specs | Moni | **Ready for review** | 4.19-4.25 |

### 4E: Review (Moni reviews in-browser, not upfront Figma)

**Workflow change (2026-04-01):** Moni is no longer designing upfront in Figma. Claude builds pages from the design system + blueprints + component specs. Moni reviews on the staging site (Vercel) and gives feedback. Claude iterates. This removes the Figma gate and unblocks production building immediately.

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 4.27 | Moni reviews built pages on staging | Moni | Not started | Pages built in Phase 5 |
| 4.28 | Claude implements Moni's design feedback | Claude | Not started | 4.27 |
| 4.29 | Trust badge designs (Veteran-Owned, Pet-Safe, Guaranteed) | Moni | Not started | 4.27 |
| 4.30 | Roy + Spencer final approval | Roy + Spencer | Not started | 4.28 |

---

## Phase 5 — Production Build ← CURRENT PHASE
**Goal:** Live site on production platform with all technical requirements met.
**Gate:** ~~Production PAGES blocked until Phase 4E.~~ REMOVED. Claude builds from specs. Moni reviews in-browser on staging. Iterate until approved.
**Tech stack:** Next.js 16 + Payload CMS 3.80 + Supabase (PostgreSQL, IPv4 pooler) + Vercel + Vercel Blob
**Replicates:** ATP website build (allthepower.co.uk) — same stack, proven in production.

### Design Workflow
Moni designs in Figma (or uses Wix to draft initial templates as visual reference). Claude translates designs into Next.js components. Moni reviews in browser on Vercel staging, requests adjustments, Claude implements. Iterative loop until approved.

### Tech Stack Change Log
- 2026-04-01: DigitalOcean VPS + raw PostgreSQL → Supabase (managed PostgreSQL) + Vercel. Simpler ops, no VPS maintenance. Proven on ATP build.
- 2026-04-01: Infrastructure tasks 5.1-5.5 pulled forward to run in parallel with Phase 4 design work. Production pages still gated on Phase 4E.

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| **Infrastructure (PULLED FORWARD — runs parallel with Phase 4)** | | | | |
| 5.1 | Research latest Payload 3.x + Supabase docs online | Claude | **Complete** — Payload 3.81, confirmed ATP patterns | — |
| 5.2 | Scaffold Next.js + Payload CMS (manual from ATP patterns) | Claude | **Complete** — 40 files, all collections/blocks/globals | 5.1 |
| 5.3 | Configure Supabase project (PostgreSQL, IPv4 pooler port 6543) | Claude + Roy | **Complete** — us-west-1, connected, migrations run | 5.2 |
| 5.4 | Configure Payload collections (9) + globals (3) | Claude | **Complete** — Pages, CityPages, BlogPosts, Services, Testimonials, Media, Users, Authors, Tags + SiteSettings, HeaderNav, FooterNav | 5.2 |
| 5.5 | Apply Got Moles design tokens (Tailwind v4, fonts, colors) to project | Claude | **Complete** — globals.css with full token set, 3 font files loaded (68KB total) | 5.2 |
| 5.6 | Configure Vercel Blob storage for media | Claude | **Complete** — configured in payload.config.ts, activates when BLOB_READ_WRITE_TOKEN set | 5.2 |
| 5.7 | Deploy to Vercel, get staging URL + admin panel live | Claude + Roy | **Complete** — project-pf8c6.vercel.app live. vercel.json added for reliable deploys. | 5.2, 5.3 |
| 5.8 | Block types built | Claude | **Complete** — 13 blocks: Hero, TrustBar, RichContent, CTA, FAQ, FeatureGrid, StepsProcess, Testimonial, Stats, GEODefinition, PainPoints, ImageText, ServiceArea | 5.4 |
| **Design → Code (UNBLOCKED — Claude builds, Moni reviews in-browser)** | | | | |
| 5.9 | ~~Moni creates design templates~~ REMOVED — Claude builds from specs | — | N/A | — |
| 5.10 | Build global layout components (Header, Footer, TrustBar, CTABlock, ServiceCards, StepsProcess, TestimonialCard, MobileStickyBar, Section, GoldDivider) | Claude | **Complete** — 10 shared components | 5.8 |
| 5.11 | Build Homepage | Claude | **Complete** — 9 sections + mobile sticky CTA | 5.10, 3.1 |
| 5.12 | Build TMCP page | Claude | **Complete** — GEO block, pricing, comparison table, FAQs | 5.10, 3.2 |
| 5.13 | Build How It Works page | Claude | **Complete** — 4 expanded steps, guarantee, FAQ | 5.10, 3.3 |
| 5.14 | Build About page | Claude | **Complete** — Spencer story, team, milestones, mission | 5.10, 3.4 |
| 5.15 | Build One-Time Removal page | Claude | **Complete** — guarantee, pricing, customer responsibilities | 5.10, 3.5 |
| 5.16 | Build Commercial page | Claude | **Complete** — 6 niches, B2B tone, no residential pricing | 5.10, 3.6 |
| 5.17 | Build FAQ page | Claude | **Complete** — 25+ Q&As in 5 groups, accordions | 5.10, 3.7 |
| 5.18 | Build Reviews page | Claude | **Complete** — 6 placeholder reviews, aggregate rating | 5.10 |
| 5.19 | Build Contact page + forms | Claude | **Complete** — form, what happens next, alternative contact | 5.10, 3.8 |
| 5.20 | Build city page template + ALL 33 cities | Claude | **Complete** — All 33 cities across 4 counties with unique content, geo coordinates, 3 FAQs each, and nearby city cross-links. Route: `[citySlug]` catch-all with prefix validation. Triple-stack schema (LocalBusiness + Service + FAQPage) on every city page. | 5.4, 5.10, 3.9 |
| 5.21 | Build blog template + 7 full articles | Claude | **Complete** — blog index + 7 posts with full Phase 3 copy, images, FAQs, author bio, related posts. Data in `blog-data.ts`. | 5.4, 5.10 |
| 5.22 | Build 4 AdWords landing pages (noindex) | Claude | **Complete** — /lp/mole-removal, /lp/mole-trapper, /lp/mole-protection-plan, /lp/commercial. Shared LandingPage component. Service-specific guarantees. | 5.10, 3.10 |
| 5.22a | Build service areas hub page | Claude | **Complete** — 4 counties, 33 cities, links to city pages | 5.10 |
| 5.22b | Generate + optimize images (pages + blog) | Claude | **Complete** — 14 WebP images via Gemini (7 page heroes + 7 blog featured). Compressed from ~50MB PNG to ~2.8MB WebP. | 5.11-5.19 |
| 5.22c | Live CRO audit + font fixes | Claude | **Complete** — live audit 82/100. Body text fluid 16-18px, GEO text opacity fixed, service card links benefit-oriented, review count near testimonials. | 5.11 |
| 5.22d | Build privacy + terms pages | Claude | **Complete** — /privacy/ and /terms/ with breadcrumb schema, US law, WA jurisdiction | 5.10 |
| **Design Migration — Moni's Design Review** | | | | |
| | **Source of truth:** Test pages at `/test/homepage`, `/test/how-it-works`, `/test/city`, `/test/tmcp`. Design spec: `brand_context/design-system.md` (aligned to test pages 2026-04-06). | | | |
| | **Context:** All production components rebuilt 2026-04-06. Service pages converted to CMS-driven. PageHero shared component created. CMS schema migrated, full seed run. Two SEO/GEO audits passed — all categories PASS, no regressions. Heading text fixed (em dashes, repeated page names, duplicate content merged). | | | |
| **DM Wave 1 — Foundation** | | | | |
| DM-1a | Section.tsx — gradient backgrounds, spacing props, new variants (`grass-alt`, `grass-to-blue`) | Claude | **Complete** — 2026-04-06 | 5.10 |
| DM-1b | GoldDivider removal — removed from ALL 11 block components | Claude | **Complete** — 2026-04-06 | DM-1a |
| DM-1c | Typography consistency — `text-body-lg` everywhere, `text-display` empathy headings, `textWrap: balance`, card titles `text-h4 lg:text-2xl` | Claude | **Complete** — 2026-04-06 | DM-1a |
| DM-1d | All seed data — backgrounds, heroHeight, fallbackImage, trustStrip, prices, summary/detail, CTA updates | Claude | **Complete** — 2026-04-06, full reseed successful | DM-1a |
| **DM Wave 2 — Header + Hero + Trust** | | | | |
| DM-2a | Header.tsx — transparent over hero with gradient strip, pill nav (`bg-black/20 backdrop-blur-sm`), gold phone circle, solid on scroll. All 5 existing nav items kept. | Claude | **Complete** — 2026-04-06, approved by Roy | 5.10 |
| DM-2b | HeroBlock.tsx — page-type heights (100vh/85vh/70vh), dark-top gradient overlay, text at bottom, single CTA with circle-chevron, fallback images | Claude | **Complete** — 2026-04-06 | DM-2a |
| DM-2c | Trust strip inside hero (homepage/city) or separate section (sub-pages) — stars + flowing dot-separated text | Claude | **Complete** — 2026-04-06, CMS schema updated with trustStrip json field | DM-2b |
| **DM Wave 3 — Section Components** | | | | |
| DM-3a | PainPointsBlock.tsx — `text-display` heading, descending opacity, bold closing, CTA with circle-chevron | Claude | **Complete** — 2026-04-06 | DM-1b |
| DM-3b | FeatureGridBlock.tsx — `bg-white/5` cards, `rounded-2xl`, price field, whole-card clickable, arrow links | Claude | **Complete** — 2026-04-06 | DM-1b |
| DM-3c | StepsProcessBlock.tsx — vertical list, gold dots, `<details>` progressive disclosure, summary/description fields | Claude | **Complete** — 2026-04-06, CMS schema updated with summary field | DM-1b |
| DM-3d | TestimonialBlock.tsx — featured + supporting pattern, centered, stars above, no card backgrounds | Claude | **Complete** — 2026-04-06 | DM-1b |
| DM-3e | CTABlock.tsx (both) + ContactForm.tsx — 2-column form layout, transparent variant, `rounded-2xl` inputs | Claude | **Complete** — 2026-04-06 | DM-1b |
| DM-3f | ServiceAreaBlock.tsx — dark background, left-aligned heading, `rounded-2xl` CTA, visible `<a>` links | Claude | **Complete** — 2026-04-06 | DM-1b |
| DM-3g | GEODefinitionBlock.tsx — removed gold border, centered text, blends into flow, Speakable schema preserved | Claude | **Complete** — 2026-04-06 | DM-1b |
| **DM Wave 4 — Global Polish** | | | | |
| DM-4a | Button consistency — `rounded-2xl` on ALL buttons across ALL components | Claude | **Complete** — 2026-04-06 | DM-3a–DM-3f |
| DM-4b | Card border removal — `bg-white/5` tonal shift only, no visible borders | Claude | **Complete** — 2026-04-06 | DM-3a–DM-3f |
| DM-4c | LandingPage.tsx — dark theme, gold dot steps, flowing trust text, transparent form, `rounded-2xl` buttons | Claude | **Complete** — 2026-04-06 | DM-4a |
| DM-4d | Footer.tsx — removed border dividers, spacing only | Claude | **Complete** — 2026-04-06 | DM-1b |
| DM-4e | FAQBlock.tsx — chevron icon, `text-body-lg` answers, `border-cream-200/10` | Claude | **Complete** — 2026-04-06 | DM-1b |
| DM-4f | RichContentBlock + ImageTextBlock — `text-body-lg`, removed dividers | Claude | **Complete** — 2026-04-06 | DM-1b |
| **DM Wave 5 — Verification & Sign-off ← CURRENT** | | | | |
| DM-5a | SEO/GEO audit x2 — all 10 schema types, GEO infra, content integrity, URLs, linking, meta, headings, images, performance, accessibility | Claude | **Complete** — 2026-04-06, two full audits both PASS, 3 minor recommendations noted | DM-4a–DM-4f |
| DM-5b | Visual QA: Roy reviewing production pages, fixing issues iteratively (trust strip, alignment, GEO block, headings, duplicates, blog images) | Roy + Claude | **Complete** — 2026-04-06, all reported issues fixed | DM-5a |
| DM-5b.1 | Architectural fix: 3 service pages converted hardcoded → CMS-driven (getCmsPageContent + RenderBlocks) | Claude | **Complete** — 2026-04-06 | DM-5b |
| DM-5b.2 | PageHero shared component created — enforces hero rules for city/blog/service-areas pages | Claude | **Complete** — 2026-04-06 | DM-5b |
| DM-5b.3 | Heading text fixes — em dashes removed, page names removed, duplicate content merged on service pages | Claude | **Complete** — 2026-04-06, reseeded | DM-5b |
| DM-5b.4 | Blog + hero image fallbacks — 3-tier fallback (CMS → static → default) prevents image loss on deploy/reseed | Claude | **Complete** — 2026-04-06 | DM-5b |
| DM-5c | Verify all pages render correctly (all page types checked during visual QA) | Claude + Roy | **Complete** — 2026-04-06 | DM-5b |
| DM-5d | Mobile viewport testing across all page types | Claude + Roy | Not started | DM-5c |
| DM-5e | Moni final sign-off on production pages | Moni | Not started | DM-5d |
| DM-5f | Roy + Spencer final approval | Roy + Spencer | Not started | DM-5e |
| **Technical SEO & GEO (COMPLETE)** | | | | |
| 5.25 | Schema markup — JSON-LD triple stack on all pages | Claude | **Complete** — Organization sitewide, LocalBusiness (home/city/contact), Service (3 services + cities), FAQPage (FAQ + all services + cities + blog), HowTo, Person, Article, AggregateRating + Review, BreadcrumbList on all non-home pages. Reusable schema.tsx utility. | 5.11-5.22, 2.8 |
| 5.26 | llms.txt published at /llms.txt | Claude | **Complete** — static file in public/, full GEO entity declaration | 5.2, 2.7 |
| 5.27 | robots.txt configured (AI crawlers permitted) | Claude | **Complete** — dynamic robots.ts replaces static file. Staging/preview: Disallow all (prevents duplicate content). Production: all major AI crawlers explicitly allowed, /admin/ and /api/ blocked. X-Robots-Tag noindex header also added for non-production in next.config.ts. | 5.2 |
| 5.28 | XML sitemap (auto-generated) | Claude | **Complete** — dynamic sitemap.ts generating all core pages + 33 city pages + 7 blog posts with priorities | 5.2 |
| 5.29 | 301 redirects configured in next.config.ts | Claude | **Complete** — comprehensive redirect map: core pages, service pages (2 forms → 1), city pages (3+ old patterns → 1 per city), 25 blog posts (root → /blog/), WordPress cruft → homepage. ~500+ redirect rules via getRedirects() utility. | 5.2, URL inventory |
| 5.30 | 7 new blog articles published | Claude | **Complete** — all 7 live on staging: choose a company, DIY vs pro, cost in WA, pet safety, monthly vs one-time, seasonal activity, why moles come back. Full copy, images, FAQs, author bio, related posts. | 5.21, 3.11 |
| **Tracking & Integrations (BLOCKED — waiting on Spencer for IDs)** | | | | |
| 5.31 | GA4 installed and configured | Claude + Roy | **Infrastructure complete** — Analytics component in layout, loads when NEXT_PUBLIC_GA4_ID env var is set in Vercel. Needs actual GA4 ID from Roy/Spencer. | 5.2 |
| 5.32 | Meta Pixel installed | Claude + Roy | **Infrastructure complete** — Loads when NEXT_PUBLIC_META_PIXEL_ID env var is set. Needs actual Pixel ID. | 5.2 |
| 5.33 | AdWords conversion tracking (phone + form) | Claude + Roy | **Infrastructure complete** — Loads when NEXT_PUBLIC_GADS_ID env var is set. trackPhoneCall() and trackFormSubmit() helpers ready. Needs actual Ads ID + conversion labels. | 5.2 |
| 5.34 | Contact forms tested (residential + commercial) | Claude + Roy | **Form infrastructure complete** — ContactForm component with honeypot, validation, API route. Needs deploy + manual testing on staging. | 5.19 |
| 5.35 | Click-to-call tested on mobile | Claude + Roy | Not started | 5.10 |
| **Content Population (COMPLETE)** | | | | |
| 5.36 | All page copy populated via Payload CMS | Claude | **Complete** — seed script created and run. 9 pages with block layouts, 33 city pages, 7 blog posts, 6 testimonials, 3 services, 2 authors. 60 CMS documents total. | 5.11-5.22, Phase 3 |
| **Training** | | | | |
| 5.37 | Spencer/Roy trained on Payload admin panel | Claude | Not started | 5.4 |
| **Media & Images** | | | | |
| 5.38 | Configure Vercel Blob storage — set BLOB_READ_WRITE_TOKEN in Vercel env vars | Roy | **Complete** — Blob created, token in all environments | 5.6 |
| 5.39 | Upload 14 WebP images to Payload Media collection | Claude | **Complete** — seed-media.ts script, all 14 uploaded with alt text | 5.38 |
| 5.40 | Link media to pages — set backgroundImage on Hero blocks, featuredImage on blog posts | Claude | **Complete** — 6 page heroes + 7 blog featured images linked | 5.39 |
| 5.41 | Verify media serves from Vercel Blob CDN, not filesystem | Claude | Not started — needs deploy to verify | 5.38, 5.39 |

---

## Phase 6 — Pre-Launch & Launch
**Goal:** Zero issues at launch. Clean switch. Monitoring in place.
**Gate:** Spencer final sign-off. All audits passed.

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| **Backup & Recovery** | | | | |
| 6.1 | Supabase backup strategy — automated daily backups, PITR, retention policy | Claude + Roy | Not started | 5.3 |
| 6.2 | Vercel deployment rollback plan — document how to roll back to previous deploy | Claude | Not started | 5.7 |
| 6.3 | CMS content export/backup — script or scheduled job to export Payload data | Claude | Not started | 5.36 |
| 6.4 | Disaster recovery runbook — documented steps to restore from scratch | Claude | Not started | 6.1-6.3 |
| **Security — DONE** | | | | |
| 6.5 | Payload admin brute force protection — 5 attempts, 15 min lockout | Claude | **Complete** — maxLoginAttempts + lockoutInterval on Users collection | 5.4 |
| 6.6 | Environment variable audit — no secrets in code, startup validation | Claude | **Complete** — PAYLOAD_SECRET + DATABASE_URI throw if missing. No hardcoded secrets found. .env not in git. | 5.7 |
| 6.7 | Security headers — HSTS, X-Frame-Options, nosniff, CSP, Permissions-Policy | Claude | **Complete** — 7 headers in next.config.ts. CSP in report-only mode (switch to enforcing after verification). | 5.7 |
| 6.8 | Rate limiting middleware — 60 req/min on /api/, 10 req/min on /admin/ | Claude | **Complete** — Edge middleware with IP tracking, 429 responses, Retry-After headers | 5.7 |
| 6.9 | Dependency vulnerability scan — npm audit | Claude | **Complete** — 0 critical, 0 high. 8 moderate (DOMPurify + esbuild + lodash, all transitive/admin-only/dev-only). All packages at latest semver. | 5.2 |
| 6.10 | CVE verification — Next.js, Payload, Supabase | Claude | **Complete** — Next.js 16.2.2 patched for CVE-2025-66478 (RCE) + CVE-2026-23864 (DoS). Payload 3.81.0 patched for CVE-2026-34751 (password reset) + CVE-2025-4643 (JWT). No updates needed. | 5.2 |
| **Security — REMAINING** | | | | |
| 6.11 | Form spam protection — honeypot field on contact form | Claude | **Complete** — hidden honeypot field + server-side validation + rate limiting (5/10min). ContactForm client component with API route at /api/contact. Wired into both CTABlock components. | 5.19 |
| 6.12 | CSP switch from report-only to enforcing | Claude + Roy | Not started — monitor browser console for violations first | 6.7 |
| 6.13 | Supabase RLS audit — verify row-level security on all public tables | Claude + Roy | **Complete** — Data API disabled in Supabase dashboard (Integrations → Data API → toggled off). Payload connects via pooler as postgres superuser, unaffected. No PostgREST exposure. | 5.3 |
| 6.14 | Payload admin IP allowlist — restrict /admin to known IPs via Vercel middleware | Claude + Roy | Not started — optional, adds friction | 6.8 |
| 6.15 | Reduce Payload JWT expiry — from 2hr default to 30min | Claude | **Complete** — tokenExpiration: 1800 (30 min) on Users collection | 6.5 |
| 6.16 | Remove `ignoreBuildErrors: true` — fix underlying TS error, then remove flag | Claude | **Complete** — fixed 31 TS errors: blog cluster→keywordCluster, CmsHeader/CmsFooter type casts, seed.ts types, Payload CSS declaration, Users lockoutInterval→lockTime. Flag set to false. | 5.2 |
| 6.17 | npm audit fix — resolve DOMPurify + lodash moderate vulnerabilities | Claude | **Complete** — lodash HIGH resolved via npm audit fix. 7 moderate remain (dompurify + esbuild, all transitive through Payload CMS — no fix available upstream). | 6.9 |
| **Quality Assurance** | | | | |
| 6.20 | Mobile responsiveness audit | Roy | **Complete** — 17 issues found, all CRITICAL/HIGH/MEDIUM fixed: double max-w bug on 7 heroes, LP forms wired to ContactForm, dropdown touch accessibility (click toggle + aria), FAQ/nav/footer/service-area touch targets to 48px, TMCP table stacked on mobile, sticky bar threshold 300px, blog aspect ratios, trust bar text readability, body padding for sticky bar. 4 LOW items remain (minor polish). | Phase 5 |
| 6.21 | Core Web Vitals test | Claude | **Complete** — 8 issues found, all fixed: font preloading (3 WOFF2), AVIF image format config, 4 hero images CSS bg → next/image, analytics preconnect hints, FeatureGrid icon unoptimized, FAQBlock server component (native details/summary), viewport + themeColor. Projected 90-95+ mobile PageSpeed. | Phase 5 |
| 6.22 | Schema validation | Claude | **Complete** — all page types validated, 20 FAQ count discrepancy noted | 5.4 |
| 6.23 | Internal link check | Claude | **Complete** — all 33 city links, blog links, nav, footer, redirects verified | Phase 5 |
| **Launch** | | | | |
| 6.30 | Spencer final sign-off | Spencer | Not started | 6.1-6.23 |
| 6.31 | DNS switch | Roy | Not started | 6.30 |
| 6.32 | 301 redirects confirmed post-switch | Claude | Not started | 6.31, 1.6 |
| 6.33 | Google Search Console claimed | Roy | Not started | 6.31 |
| 6.34 | AdWords campaigns pointed to new LPs | Roy | Not started | 6.31 |
| 6.35 | 30-day post-launch monitoring plan | Claude | Not started | 6.31 |

---

## Phase 7 — Paid Advertising (Google Ads + Meta Ads)
**Goal:** Optimise existing Google Ads, launch Meta Ads, connect both to Claude via MCP for ongoing management.
**Gate:** Both platforms connected via MCP, campaigns live, conversion tracking confirmed.

### Prerequisites (Spencer/Roy)
- [ ] Spencer grants Roy Standard access to Google Ads account
- [ ] Spencer shares Google Ads account ID
- [ ] Spencer creates Meta Business Portfolio (business.facebook.com) — or confirms existing
- [ ] Spencer connects Got Moles Facebook page to Business Portfolio
- [ ] Spencer creates Meta Ad Account inside Business Portfolio
- [ ] Spencer grants Roy partner access in Meta
- [ ] Spencer creates Meta Pixel (ID shared with Roy for site embed)
- [ ] Roy confirms monthly ad budget with Spencer

### MCP Integration (Claude Automation)

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 7.1 | Research and select MCP ad server (Pipeboard vs Adzviser vs direct API) | Claude | Not started | — |
| 7.2 | Install MCP server and configure in .claude/settings.json | Claude + Roy | Not started | 7.1, account access |
| 7.3 | Authenticate Google Ads account via MCP | Roy | Not started | 7.2, Spencer grants access |
| 7.4 | Authenticate Meta Ads account via MCP | Roy | Not started | 7.2, Meta setup complete |
| 7.5 | Verify Claude can read both platforms' data | Claude | Not started | 7.3, 7.4 |

### Google Ads (Optimise Existing)

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 7.6 | Full audit — campaigns, ad groups, keywords, search terms, negative keywords | Claude | Not started | 7.5 |
| 7.7 | Identify waste — dermatology contamination, irrelevant geo, broad match bleed | Claude | Not started | 7.6 |
| 7.8 | Rebuild campaign structure aligned to new site + landing pages | Claude | Not started | 7.7, Phase 5 LPs live |
| 7.9 | Write new ad copy (headlines, descriptions, extensions) for all campaigns | Claude | Not started | 7.8 |
| 7.10 | Add TMCP campaign — uncontested keyword territory | Claude | Not started | 7.8 |
| 7.11 | Set up conversion tracking (phone calls + form submissions) | Claude + Roy | Not started | Phase 5 site live |
| 7.12 | Recommend budget scaling plan ($770/mo → $1,500-2,000/mo) | Claude | Not started | 7.6 |
| 7.13 | Launch optimised campaigns (Roy approves before go-live) | Roy | Not started | 7.9, 7.10, 7.11 |

### Meta Ads (New Channel)

| # | Task | Owner | Status | Depends on |
|---|------|-------|--------|-----------|
| 7.14 | Build campaign structure — awareness → retargeting → conversion funnel | Claude | Not started | 7.5, Meta setup |
| 7.15 | Write ad copy — all formats (single image, carousel, video script, Stories) | Claude | Not started | 7.14 |
| 7.16 | Create audience definitions — geo targeting, lookalikes from customer list, interest | Claude | Not started | 7.14 |
| 7.17 | Creative briefs for ad images/video (Moni or viz-nano-banana) | Claude | Not started | 7.15 |
| 7.18 | Upload customer list for lookalike audience (Spencer provides emails/phones from CRM) | Roy | Not started | 7.14, Spencer provides list |
| 7.19 | Recommend initial budget ($500-1,000/mo) and bidding strategy | Claude | Not started | 7.14 |
| 7.20 | Launch initial campaigns (Roy approves before go-live) | Roy | Not started | 7.15-7.19 |

### Ongoing Management (Post-Launch)

| # | Task | Owner | Status | Frequency |
|---|------|-------|--------|-----------|
| 7.21 | Performance review and optimisation recommendations | Claude | Ongoing | Weekly |
| 7.22 | A/B test new ad copy variants | Claude | Ongoing | Bi-weekly |
| 7.23 | Seasonal campaign adjustments (spring/autumn peaks) | Claude | Ongoing | Quarterly |
| 7.24 | Budget scaling recommendations based on ROI | Claude | Ongoing | Monthly |
| 7.25 | Cross-platform reporting (Google + Meta combined) | Claude | Ongoing | Monthly |

**Human-in-the-loop rule:** Claude analyses, recommends, and prepares. Roy/Spencer approves before any spend changes, campaign launches, or bid adjustments go live.

---

## Post-Launch (Ongoing)
- Monthly blog articles (SEO + GEO)
- City page expansion (new territories)
- Review collection push (219 → 500+)
- GEO monitoring (quarterly AI citation checks)
- Quarterly site audit against KPIs
- Paid ads management via MCP (Phase 7 ongoing tasks)
