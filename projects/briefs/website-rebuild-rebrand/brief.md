---
project: website-rebuild-rebrand
status: complete
level: 3
created: 2026-03-27
completed: 2026-05-08
---

# Got Moles — Website Rebuild & Rebrand

## Project Goal

Rebuild got-moles.com from the ground up with a full rebrand, world-class SEO, and GEO (Generative Engine Optimisation) built in from day one. The new site must preserve and strengthen the existing SEO footprint (635 keywords at #1, 1,409 in top 3) while positioning Got Moles as the default AI-cited answer for mole control in Western Washington.

## Client

- **Business:** Got Moles — mole-exclusive control company, Western Washington
- **Owner:** Spencer Hill (Enumclaw, WA)
- **Founded:** 2017 | ~4,973 clients | 219+ five-star reviews | ~500 active TMCP subscribers
- **Domain:** got-moles.com (confirmed — new build replaces existing site)

## Team

| Role | Person | Responsibility |
|------|--------|---------------|
| Project Lead | Roy Castleman | Strategy, copy, coordination, quality control |
| Client / Owner | Spencer Hill | Approvals, content input, photos, FAQs |
| SEO | Ian | Keyword research, technical SEO, schema strategy |
| Design | Moni | Brand identity, UI/UX, Wix prototype, production build |
| AI Assistant | Claude | Research, copy, SEO/GEO strategy, content production |

## Deliverables

### Phase 1 — Foundation & Research ✅ COMPLETE
- [x] Spencer review document — confirmed (stories pending written sign-off)
- [x] New branding assets integrated (logo, colors, typography, guidelines)
- [x] Fresh SEO keyword research — 180 keywords, 18 blog posts prioritized
- [x] Fresh GEO strategy and query cluster mapping
- [x] Competitive landscape analysis (redone from scratch)
- [x] Technical SEO audit of existing site
- [x] URL preservation plan — 500+ 301 redirects covering all old WordPress URLs

### Phase 2 — Strategy & Planning ✅ COMPLETE
- [x] Final site structure confirmed
- [x] Page-to-keyword mapping (all pages)
- [x] Page briefs for all core pages (keyword targets, heading structure, CTA, schema, messaging)
- [x] AdWords landing page strategy
- [x] Content calendar — 12-batch pre/post-launch content plan
- [x] llms.txt draft — 71 lines, comprehensive
- [x] Schema markup plan per page type — 13 schema types

### Phase 3 — Copy & Content ✅ COMPLETE
- [x] Homepage copy
- [x] TMCP (Total Mole Control Program) page copy
- [x] How It Works page copy
- [x] About page copy (Spencer's story, team bios)
- [x] One-Time Removal / Eradication page copy
- [x] Commercial page copy
- [x] FAQ page (26 questions across 5 groups)
- [x] Contact / Get a Quote page copy
- [x] City page template + 77 cities with unique content (expanded from 10 → 77)
- [x] AdWords landing page copy (4 variants)
- [x] Blog articles — 7 articles with images, FAQs, schema

### Phase 4 — Design & Prototype ✅ COMPLETE
- [x] Brand identity applied (new logo, colors, typography) — design system with 6 principles
- [x] Homepage design — 11-section blueprint + CRO audit (88/100)
- [x] How It Works design — 7 sections
- [x] TMCP page design — 9 sections
- [x] About page design — 8 sections
- [x] Mobile-first review — MobileStickyBar, responsive grid throughout
- [x] Trust badge designs — TrustBar component with metrics
- [x] City page template design — county-specific hero images

### Phase 5 — Production Build 🔶 NEAR COMPLETE
- [x] Production platform — Next.js 16 + Payload CMS 3.81 + Supabase + Vercel
- [x] Design migration to production — all design tokens in globals.css
- [x] All copy populated — CMS blocks for core pages, city-data.ts for 77 cities
- [x] Schema markup — LocalBusiness, Service, FAQ, HowTo, Review, Person, Article, Speakable, Breadcrumb
- [x] llms.txt published at /llms.txt
- [x] robots.txt — staging blocks crawlers, production allows AI crawlers
- [x] XML sitemap — dynamic, 77 cities + all pages
- [x] 77 city pages built — all 5 counties, county hero images, GEO definition blocks
- [x] AdWords landing pages (4, noindex, minimal nav)
- [x] OG images — default + 5 county heroes
- [x] GEO definition blocks with Speakable schema on all city pages + 3 service pages
- [x] Security — 7 headers, brute force protection, rate limiting, honeypot
- [x] Favicon — SVG icon + Apple touch icon
- [x] FAQ expanded to 26 questions (was 20)
- [x] Blog internal links — Related Services & Resources section on every post
- [x] 500+ redirects covering all old WordPress URLs
- [ ] **Contact form handler** — currently logs to console only. Roy decided 2026-04-18: direct Jobber `clientCreate` API (no Resend/SendGrid). Blocked on Spencer API key only. See `feedback_jobber_contact_form.md`.
- [ ] **GA4 installed** — `Analytics.tsx` complete (env-var gated via `NEXT_PUBLIC_GA4_ID`). **NOT Spencer-blocked** — Roy has direct access to GA4 per 2026-04-18 memory. ~15 min Vercel env var paste when ready.
- [ ] **Meta Pixel installed** — `Analytics.tsx` complete (env-var gated via `NEXT_PUBLIC_META_PIXEL_ID`). **NOT Spencer-blocked** — Roy has direct access. ~15 min Vercel env var paste.
- [ ] **AdWords conversion tracking** — `Analytics.tsx` complete (env-var gated via `NEXT_PUBLIC_GADS_ID`). **NOT Spencer-blocked** — Roy has direct access. `CONVERSION_LABEL` placeholder to be replaced once Google Ads conversion actions are defined (downstream).
- [x] **Favicon** — SVG + Apple touch icon, brand G monogram
- [ ] **Logo upload to CMS** — SiteSettings.logo field empty
- [ ] **Physical address + business hours** — need adding to SiteSettings global
- [ ] **Social/GBP profile URLs** — fields exist but empty in SiteSettings
- [x] **Photo library processed** ✅ 2026-04-15 — 97 professional photos compressed (311 MB → 42.3 MB WebP, hero + content tiers), catalogued in `photo-catalogue.md`, 20 best-picks copied to `site/public/images/` with descriptive names. Full library in `brand_context/pictures/optimized/`. Route A (static) confirmed — Vercel Blob dormant, `fallbackImage` pattern used.
- [x] **Team IDs confirmed** ✅ Spencer, Cory, Tavis, Brayden (0784), Lukas (0756) — all five team member photos identified. Renamed team files in optimized library.
- [x] **Team bios for Tavis, Brayden, Lukas** ✅ 2026-04-15 — Roy provided all three verbatim.
- [x] **TeamCards block — REMEDIATED** ✅ 2026-04-15 (commits `2f6c0f0`, `c1ee12a`). Design-system violations fixed: `grass-alt` default, cream+blue options stripped, `bg-white/5 rounded-2xl hover:bg-white/10` cards (no borders), `text-body-lg` bios, `text-h4 lg:text-2xl` names, `text-cream-200/60` role (no gold). Added `teamSchema()` JSON-LD @graph with 5 Person entities linked via `worksFor/@id`. Color block alternation fixed (was 4 adjacent `grass-alt`, now alternates cleanly). Humanizer pass on all 5 bios brought avg 6.2 → 8.4. Commit `c1ee12a` live on staging.
- [x] **About hero rewired** ✅ 2026-04-15 (commit `56e85f6`). `clean-yard` → `hero-team-line` (0744). Desktop good, mobile crops outer 2 team members — flagged for Spencer review, kept for now.
- [x] **About team photo labels fixed** ✅ 2026-04-17 (commit `b71a729`). Swapped `team-brayden.webp` ↔ `team-lukas.webp` in `site/public/images/`, `public/media/`, and `brand_context/pictures/optimized/`. Bearded = Lukas, moustache = Brayden.
- [x] **Block schema cleanup** ✅ 2026-04-18 (commit `af39000`). Stripped `cream`/`blue` options from 11 block schemas. Payload types regenerated, TS clean. Zero visible change — pure drift protection from admin UI.
- [x] **Schema defaults normalized** ✅ 2026-04-18 (commit `fad05dd`). Hero default 100vh→85vh, FeatureGrid/ImageText renderer fallback cream→grass-alt, 7 showDivider defaults true→false (TeamCards already at false). Zero visible change.
- [x] **Homepage hero 100vh→85vh** ✅ 2026-04-18 (commit `a68ee86`). Fixed "extra space above title" — every other page was at 85vh; homepage was the 100vh outlier.
- [x] **Homepage color adjacency** ✅ 2026-04-18 (commit `f3e8733`). painPoints → grass-alt; featureGrid #1 grass-alt→grass. 2 flat transitions removed. Reseeded.
- [x] **Section gradient rhythm fixed** ✅ 2026-04-18 (commits `d44d28c`, `c2cf6a2`, `d54c7b6`). Previous full-section gradients stitched seamlessly at boundaries — entire page read as one continuous dark bar. Updated Section.tsx + PainPointsBlock.tsx + GEODefinitionBlock.tsx + city inline GEO def to flat body (top 65%) + soft fade (bottom 35%) matching design-system.md line 213 ("last ~8% gradient"). 35% chosen after tuning — 8% was too harsh, 50% too blurry.
- [x] **Final CTA gradient** ✅ 2026-04-18 (iterations → commit `70f04b8`). Blue-to-rust gradient felt disconnected from page rhythm. Replaced with grass (#184241) body + 4-stop gradient: fades IN from #153635 at top (15%), flat grass in middle (15-65%), fades OUT to footer #0E2A28 at bottom (35%). Gold buttons still provide conversion punch on the grass body.
- [x] **Service Areas page polish** ✅ 2026-04-18 (commits `04d5fb8`, `135d2af`, `c9825dd`). Page was using PageHero but missing trust strip + hero CTA + hero-tier image. Added canonical trust strip, hero CTA button, and generated custom landscape image via viz-nano-banana (hero-service-areas.webp, 1920×1288). Brings composition in line with every other sub-page hero.
- [x] **6 sub-page heroes rewired** ✅ 2026-04-15 (commit `7acdcbe`). Copied 6 new hero-tier 1920×1280 photos from library, reseeded pages: How It Works → `hero-overhead-digging` (1011), Contact → `hero-team-candid-3` (0981), Reviews → `hero-team-laughing` (0791), TMCP → `hero-team-tools-mole` (0929), One-Time Removal → `hero-spencer-team` (0968), Commercial → `hero-commercial-crew` (0802). Each page gets a unique shot — no two adjacent pages share imagery. Each needs a final eyeball on staging for desktop + mobile.
- [x] **About page CRO audit** ✅ 2026-04-15 — score 76/100. Saved to `projects/str-cro-audit/2026-04-15_about-page-audit.md`.
- [x] **About CRO Fix Now #1 + #2 applied** ✅ 2026-04-19 (commit `13b9cd1`). Inserted featured testimonial (Sabra Bösewicht, Seattle) between "Built on Discipline" and "Meet the Team" — addresses primary Jennifer objection ("will it actually work this time?"). Added "By The Numbers" stats block (219+ / 70+ / 100% mole focus) to preserve unified alternation rule parity (2-block insertion, no downstream flip). Renamed "How It Started" → "Spencer's Father's Garden". Humanizer self-scored 8.9/10 on all new copy. Expected lift 76 → 80.
- [x] **Homepage hero** ✅ 2026-04-19 (commit `6089a9c`). `hero-home.webp` — 145A0971 (5-person team in forest clearing, balanced composition). Differentiated from About's `hero-team-line` (0744). Wired via `fallbackImage: 'hero-home'` + `HeroBlock.tsx` FALLBACK_IMAGES map + `seed-media.ts` PAGE_HERO_IMAGES/IMAGE_ALT. Roy flagged potential ICP-driven revisit — swap is reversible via `fallbackImage` edit + reseed.
- [x] **FAQ hero** ✅ 2026-04-19 (commit `6089a9c`). `hero-faq.webp` — 145A0987 (Spencer mid-explanation to the team). Visually mirrors FAQ heading "Your Mole Questions, Answered. Answers from Spencer Hill."
- [x] **`og:image` site-wide** ✅ 2026-04-16 (commit `cd0c09e`). `buildMetadata` in `cms-page.tsx` now includes `openGraph.images` with `DEFAULT_OG_IMAGE` fallback (`/images/og-default.webp`, 1200×630). Every CMS page social link preview now works.
- [x] **`og-default.webp` branded** ✅ 2026-04-19 (commit `39dbc49`). Branded 1200×630 WebP: grass #184241 canvas + PRIMARY LOGO FILES-02.svg (cream variant) centered. Hand-composited via sharp from authoritative brand SVG (nano-banana avoided — brand rules forbid altering logo). 8.6 KB. Reusable generator: `src/scripts/build-og-default.mjs`. Social preview refresh can take up to 24h on LinkedIn caches.
- [x] **Schema-level cleanup** ✅ 2026-04-18 (commit `af39000`). Stripped `cream`+`blue` options from 11 block schemas. Payload types regenerated, TS clean. Zero visible change — pure drift protection.
- [x] **Schema defaults normalized** ✅ 2026-04-18 (commit `fad05dd`). Hero default 100vh→85vh; FG/IT renderer fallback cream→grass-alt; 7 showDivider defaults true→false.
- [x] **Homepage hero 100vh→85vh** ✅ 2026-04-18 (commit `a68ee86`). Every other page was 85vh; homepage was the outlier creating extra space above title.
- [x] **Color adjacency — Homepage** ✅ 2026-04-18 (commit `f3e8733`). painPoints → grass-alt, featureGrid #1 grass-alt → grass. Reseeded.
- [x] **Color adjacency — TMCP** ✅ Already clean, no edits needed.
- [x] **Color adjacency — Commercial** ✅ 2026-04-18 (commits `f35c61a`, `de6e75e`). Added testimonial block + case-studies link to fix 5-block odd parity → 6 blocks clean alternation. B2B proof added as bonus.
- [x] **Color adjacency — City template** ✅ 2026-04-18 (commit `f35c61a`). Inline GEO def reverted to grass pattern matching shared component. Unified rule applied.
- [x] **Section gradient rhythm (BIG UNLOCK)** ✅ 2026-04-18 (commits `d44d28c`, `c2cf6a2`, `d54c7b6`). Full-section gradients replaced with flat body (top 65%) + 35% bottom fade. Before: whole page read as one continuous dark bar. After: visible bands with soft transitions. Matches design-system.md line 213 intent.
- [x] **Final CTA integrated** ✅ 2026-04-18 (commits `07adcc6` → `70f04b8`). Blue→rust slab replaced with 4-stop grass gradient that fades from grass-alt at top, flat grass middle, to footer #0E2A28 at bottom. Gold button still provides conversion punch.
- [x] **Unified alternation rule** ✅ 2026-04-18. Universal rule: hero → GEO def (grass locked) → alternate → end in grass → CTA. Odd-count pages resolve via added value blocks. Documented in `feedback_unified_alternation_rule.md`.
- [x] **Service Areas hero + trust strip + CTA** ✅ 2026-04-18 (commits `04d5fb8`, `135d2af`, `c9825dd`). Added canonical trust strip, hero CTA, generated custom Western Washington landscape via viz-nano-banana.
- [x] **Service Areas full SEO/GEO enrichment** ✅ 2026-04-18 (commit `e616f5a`). Added intro+GEO Def with Speakable schema, stats band, county descriptions (5 counties), 3 testimonials, 8-item FAQ with FAQPage schema, ItemList JSON-LD for all 90 cities, CollectionPage JSON-LD with areaServed by AdministrativeArea.
- [x] **13 missing cities added to city-data.ts** ✅ 2026-04-18 (commit `5f422b0`). 8 King (algona, clyde-hill, fairwood, green-river, lake-city, medina, ravensdale, white-center) + 5 Pierce (fairfax, fife, lake-tapps, prairie-ridge, roy). All full sammamish/bellevue-depth with WebSearch-grounded content. Closes 404 gap from old-site redirects. Total cities now 90.
- [ ] **Methodology fixes — Roy to confirm scope** (noted 2026-04-15 end of Session 3). Sessions 2 and 3 both derailed because BUILD-METHODOLOGY.md + design-system.md + design-principles.md weren't loaded on session start. 5 fixes proposed: (1) strengthen client CLAUDE.md with loud "first action of any session touching `site/`" block; (2) new `feedback_resume_is_a_fresh_session.md` memory; (3) log both incidents to learnings (done); (4) propose SOUL.md behavioural rule for cross-project resume-with-reload; (5) update heartbeat to explicitly enforce manual reload on `/compact`, `/clear`, or topic shift. Full detail in `context/memory/2026-04-15.md` Session 3.

### Phase 6 — Pre-Launch & Launch ✅ LIVE (2026-05-01)

got-moles.com live since 2026-05-01. Push to `mine` = production deploy. Full runbook: `LAUNCH-CHECKLIST.md`.

- [x] **All internal links checked** ✅ 2026-04-20 — 6 P1 items shipped (commits `04b0719`, `c258c31`, `9938804`). ~500 contextual body links sitewide. Full report `projects/str-ai-seo/2026-04-20_full-seo-geo-report.md`.
- [x] **Full SEO + GEO audit** ✅ 2026-04-20 — baseline 78/100 → ~87/100 post-fixes. Commit `0fcb4cf`. Pushed to Notion.
- [x] **Old site redirects coded** ✅ 291 redirects in `next.config.ts`. **Live spot-check pending DNS switch.**
- [ ] Mobile responsiveness audit — captured in launch checklist
- [ ] Core Web Vitals test (LCP < 2.5s target) — requires live environment
- [ ] Schema validation (Google Rich Results Test) — requires live URL
- [ ] Spencer final sign-off
- [ ] DNS switch to got-moles.com
- [ ] Google Search Console + Bing Webmaster claim + sitemap submission
- [ ] AdWords campaigns pointed to new LPs (requires separate Google Ads campaign brief — see "Missing" below)
- [ ] 30-day post-launch monitoring plan — drafted in launch checklist Part 5 (Week 1 / 2-4 / Month 2+)

### Phase 7 — Content Expansion (Post-Launch)
- [x] FAQ page expansion to 26 questions ✅ Done in Phase 5
- [x] Service page GEO definition blocks ✅ Done in Phase 5
- [x] Internal linking in blog posts to service/city pages ✅ Done in Phase 5 + Phase 6 P1 fixes (~50 in-content links across 19 posts)
- [x] **Tier 1 cornerstone #1: "How to Get Rid of Moles in Your Yard"** ✅ 2026-04-19 (commit `429971f`). ~1,486 words, 8 sections, 5 FAQs.
- [x] **Tier 1 cornerstone #2: "Mole vs Vole vs Gopher"** ✅ 2026-04-20 (commit `e269387`). ~1,802 words. Sleeper insight: true pocket gophers rare in Western WA.
- [x] **Tier 1 cornerstone #3: "What Do Moles Eat?"** ✅ 2026-04-20 (commit `b830e87`). ~1,900 words. Busts grub-killer myth with WSU Extension citations.
- [x] **Tier 1 cornerstone #4: "The 3 Mole Species in Washington State"** ✅ 2026-04-20 (commit `c384c57`). ~1,678 words. GEO goldmine — zero competitor coverage.
- [ ] Tier 2 myth-bust blogs (3 remaining: Sonic Repellers, Castor Oil, 10 Mole Myths). Grub Control already done.
- [ ] Tier 3 safety/concern blogs (4 planned: Foundation damage, Trapping legal in WA, Are Moles Dangerous, Dog Ate Mole Poison).
- [ ] Tier 4+ practical guides, decision-stage, deep knowledge — see `projects/briefs/mole-content-authority/content-plan.md`.
- [ ] Unique hero images for top 7-10 priority cities — currently all cities in a county share one image. Alt tags are unique but images aren't. Replace with Spencer's real job photos when available.
- [ ] Replace all AI-generated hero images with real before/after photos from Spencer (best local SEO signal).

### Phase 8 — Post-Launch Content Hygiene & Audit Infrastructure

- [x] **Trap-language site-wide cleanup** ✅ 2026-05-04. Removed all mechanism descriptions ("body-gripping", "neck-or-chest", "kill the animal instantly", "death is instantaneous", "fraction of a second"). Word "trapping" retained per Roy's call. Replacement vocabulary: "professional traps", "professional methods", "professional, mechanical placement", "work instantly", "immediate result". 24 CMS records patched in-place via `payload.update()` (14 blog posts + 4 pages + 6 city-pages). Live verified across 6 sample URLs.
- [x] **Drift tools added (`site/src/scripts/`)** ✅ 2026-05-04. Five npm scripts: `patch-trap` (surgical Payload patches with --scan + --apply batch modes), `diff-cms` (source vs CMS), `audit-live` (CMS vs live HTML), `audit-jsonld` (parse validity + forbidden terms + FAQ count drift across all 45 routes), `fix-faq-flags` (one-shot multi-block FAQ schema aggregator).
- [x] **PAGE-BUILD-REFERENCE.md updated** ✅ 2026-05-04. Source-of-truth-per-route table + ⚠ city-pages CMS collection footgun warning (collection has 92+ records but isn't wired to render — `[citySlug]/page.tsx` reads `city-data.ts` directly).
- [x] **`/faq/` JSON-LD aggregation fix** ✅ 2026-05-04 (commit `5c2a702`). Page had 5 topic-grouped FAQ blocks; only first emitted FAQPage schema. 21 of 26 FAQs were silently dropped from JSON-LD (invisible to AI engines, voice, Google rich snippets). Refactored `faq/page.tsx` to walk layout + emit one combined FAQPage. All 5 blocks set to `generateSchema: false`. Now 26/26 questions in schema.
- [x] **Full audit baseline established** ✅ 2026-05-04. 45/45 CMS routes match live HTML (zero CMS-vs-live drift). 226/226 JSON-LD blocks parse cleanly. 0 forbidden terms across all schemas. Audit reproducible via `npm run audit-live` + `npm run audit-jsonld`.
- [ ] **city-pages CMS collection cleanup** — decide wire-in vs delete. 92 records sitting unused; future devs will hit the footgun.
- [ ] **Pre-deploy drift hook** — wire `audit-live` + `audit-jsonld` as CI step so drift is caught before push, not after.
- [ ] **Generic-strip blog records (10)** — currently using fallback "professional traps". If consistent "professional methods" / "mechanical placement" preferred, extend rule table + re-run patch.
- [ ] **humane-mole-removal source backport** — 1 cosmetic source-vs-CMS drift (CMS has better "trapping approach", source has older "trap approach"). Roy declined backport.

---

## Items Missing from the Original Plan (surfaced 2026-04-20 brief review)

### Launch-Critical — Redirect Coverage Gap (found 2026-04-20)

Cross-referenced all 111 unique old-site URL paths from the previous agency's ranking spreadsheet against `src/lib/redirects.ts`. **15 genuine gaps** — each one represents ranked keywords that will 404 on DNS switch if not patched.

- [ ] **Add missing cities to `citySlugs` in `redirects.ts`:** `algona`, `fairwood`, `lake-tapps`, `medina` (all recently added to `city-data.ts` but not mirrored in the redirect list).
- [ ] **Add `mole-extermination-*` prefix** to `service_prefixes` (only `mole-exterminator` is there, misses the `-ation` spelling).
- [ ] **Add `mole-repellent-*` prefix** (E spelling — only A spelling `mole-repellant` is covered).
- [ ] **Add reverse patterns** `{slug}-mole-exterminator` and `{slug}-mole-extermination`.
- [ ] **Add `-2` suffix handler for non-core city pages** (e.g. `/mole-control-seatac-2`, `/mole-control-sumner-2`).
- [ ] **Add spelling-variant redirect:** `/mole-control-southhill` → `/mole-control-south-hill`.
- [ ] **Decide on `centralia` + `eatonville`** — neither is on the new site (out of core 5-county service area). Either add to `city-data.ts` OR redirect to `/service-areas`.

Full breakdown: `projects/briefs/google-ads-campaigns/baseline-from-previous-agency.md`.

### Previous Agency Handoff — Accounts to Obtain

- [ ] **Google Ads account** — matured Quality Scores, keyword history, negative keyword list built over years. Don't start fresh. Owner: Spencer.
- [ ] **Microsoft Ads (Bing) account** — 34% of paid spend in 2025 at matching $10 CPL. Owner: Spencer.
- [ ] **GA4 property (current site)** — traffic baseline for post-launch comparison. Owner: Spencer.
- [ ] **Google Search Console property** — old keyword data. Owner: Spencer.

### Ad Infrastructure

- [x] **Google Ads campaign brief scoped** ✅ 2026-04-20 (commit `02bdca9`, rewritten `TBD` after baseline data surfaced). Draft at `projects/briefs/google-ads-campaigns/brief.md` includes Google + Bing channels, campaign structure, keyword strategy, negative keyword list, bidding phases, conversion actions, call tracking decision, budget forecast anchored to $10.28 CPL baseline from previous agency.
- [ ] **Google Ads `CONVERSION_LABEL`** in `Analytics.tsx` lines 96 + 120 is still a literal placeholder. Once Google Ads conversion actions are defined (form submit, click-to-call), replace placeholder. Consider moving to env var for portability.
- [ ] **Tracking ID env vars** (GA4, Meta Pixel, Google Ads) — Roy-unblocked, not yet pasted into Vercel. ~15 min when ready. `Analytics.tsx` is env-var gated and ready.

### Legal / Compliance

- [ ] **Cookie consent banner** — site uses GA4, Google Ads, Meta Pixel but has no cookie consent UI. Low legal risk for a WA-local service business (no CCPA/GDPR obligations unless targeting CA/EU residents), but adds trust polish. Consider light "Accept / Decline" banner gated on tracking cookies.

### Client Dependencies (still outstanding from original brief)

- [ ] **SiteSettings population** — Spencer — logo file, physical address, business hours, GBP URLs. Sitewide footer + contact page show empty states until done.
- [ ] **Jobber API key** — Spencer — contact form backend destination. Form currently has no backend; submissions log to console only (per the Phase 5 note).
- [ ] **AdWords account access** — original brief dependency, still pending. Required for running campaigns against the LPs.
- [ ] **Google Analytics (current site) access** — pending per original brief. Useful for traffic baseline comparison post-launch.

### Small Polish / Nice-to-Have

- [ ] **favicon.ico fallback** — site has SVG icon + Apple touch icon but no `.ico` at `/favicon.ico`. Modern browsers use SVG, but RSS readers, older bots, and some OG preview tools expect `.ico`. Trivial fix.
- [ ] **Image sitemap** — separate XML for images at `/sitemap-images.xml`. Optional. Marginal gain for image-search traffic.
- [ ] **security.txt** — `/.well-known/security.txt` for responsible disclosure. Low priority for a local service business.
- [ ] **Methodology fixes (5-item list)** — from Session 3 2026-04-15. Roy scope decision pending.

## Acceptance Criteria

1. **SEO preservation:** No drop in existing keyword positions for Tier 1 city terms within 30 days of launch
2. **GEO readiness:** Got Moles cited in at least 2 of 4 major AI systems (ChatGPT, Perplexity, Google AI Overview, Claude) for "best mole control in [top 5 cities]" within 60 days
3. **Page speed:** Core Web Vitals green on all core pages (mobile + desktop)
4. **Schema:** Valid structured data on every page (zero errors in Rich Results Test)
5. **Conversion:** Click-to-call and form submissions tracked in GA4 + AdWords from day one
6. **Brand:** New brand identity consistently applied across all pages, consistent with rebrand guidelines

## Dependencies

| Dependency | Status | Blocker? |
|-----------|--------|----------|
| Spencer confirms father's story | Verbally confirmed, awaiting written | No — copy can be drafted, finalised on confirmation |
| Spencer confirms TMCP origin story | Verbally confirmed, awaiting written | No — same as above |
| Spencer provides FAQs + objections | Pending | Yes for FAQ page, not for other pages |
| Spencer provides photos | Pending | Yes for design, not for copy |
| New branding assets from Roy | Incoming | Yes for design phase, not for research/copy |
| Production platform decision | Not yet made | Yes for Phase 5, not before |
| AdWords account access | Pending | Needed for audit and LP optimisation |
| Google Analytics access (current site) | Pending | Needed for traffic baseline |

## Constraints

- URL preservation is non-negotiable — existing city page URLs must be preserved or 301 redirected
- TMCP methodology is proprietary — never publish operational details
- Residential pricing ($450 eradication, $100/month TMCP) must not appear on commercial pages
- "WA's #1" claim needs substantiation before using on production site
- All copy must pass humanizer gate before delivery

## Review & Collaboration

**Notion is the review and client review mechanism for this project.** All deliverables must be pushed to Notion when created or updated. Spencer and the team review work in Notion — not in local files.

- Every deliverable gets a Notion page under the Got Moles Website Rebuild project
- Updates to deliverables must be reflected in Notion (not just local files)
- Notion is where Roy, Spencer, Ian, and Moni see and comment on work
- Local files in `projects/briefs/website-rebuild-rebrand/` are the working copies; Notion is the review copy

**Notion project:** https://www.notion.so/ea4988835e2f4dfa8994df3d707f8e38?v=f7db373473d34c2cbad6ea24f27bfe25

## Planning

Full GSD planning artifacts in `.planning/`:
- `PROJECT.md` — project overview and current state
- `ROADMAP.md` — phase-by-phase execution plan
- `phases/` — detailed phase breakdowns

---

## Session log

### 2026-04-21 session 2 — Track D infrastructure + 5 blogs + 2 cities + redirect refactor

Shipped the launch-critical backlog for DNS switch week of 2026-04-27.

**Track D — Old blog migration (infrastructure + 5 of 18 blogs)**

Added `BlogPosts.urlPattern` field (`'blog'` | `'legacy-root'`, default `'blog'`) with Payload migration `20260421_082108_urlpattern_field`. Extended `[citySlug]` catch-all route to branch: `mole-control-*` → city page; else → lookup blog-posts with `urlPattern='legacy-root'`; else 404. Shared `BlogPostContent.tsx` component renders from both routes. Sitemap emits `/{slug}/` for legacy-root posts. This is the permanent pattern for URL-preservation migrations.

5 legacy blogs migrated (all at `urlPattern='legacy-root'` serving `/{slug}/`):

| Slug | Ranked kw | Top-3 | Cluster |
|---|--:|--:|---|
| /how-many-eyes-do-moles-have/ | 90 | 46 | Biology |
| /do-moles-bite/ | 33 | 14 | Safety |
| /do-moles-carry-diseases/ | 25 | 4 | Safety |
| /are-moles-nocturnal/ | 17 | 4 | Biology |
| /how-to-get-rid-of-ground-moles-with-vinegar/ | 9 | 0 | Mole Control |

Each preserves original H2 structure (keyword equity), expands with PNW-specific depth (Townsend's mole biology, 55-93% earthworm diet, 35-60" PNW rainfall, 6-18" tunnel depth), humanized against brand voice, grep-cleared of banned "only mole-exclusive" claims, 2-3 internal links each, 5 FAQs each. Excerpt capped at 160 chars per Payload SEO.metaDescription validator. Hero images are thematic placeholders — Gemini API was 503 UNAVAILABLE during session, tracked as Task #12 for regen.

Commits: `cdcaf17` (infrastructure) → `db94e9b` (blog 1) → `aa1bb9b` (blogs 2-5).

**Track C1 — Centralia + Eatonville city pages**

Added to `city-data.ts` with full template content (intro, communityDescription, whyMolesThrive, localDetails, localTip, 5 FAQs). Pages render direct from city-data.ts at request time — no CMS seed required. Centralia mapped to Lewis County (outside current seed enum — falls back to King County hero gracefully). Messaging geography-neutral on service scope pending Spencer confirmation.

Commit: `cff6919`.

**Track A/B — citySlugs + redirect patches + middleware noindex**

First attempt (`7c9d19a`) + query fix (`20cb8d7`) BOTH FAILED to deploy — total route count hit 2,876, exceeding Vercel's hard cap of 2,048. Root cause: per-city × per-verb × trailing-slash × direction enumeration loops.

**Permanent fix (`fed3667`):** Replaced enumeration with `path-to-regexp` alternation groups. One rule per pattern covers all ~90 cities × all verbs:

- `/:slug(sammamish|bellevue|...)` → `/mole-control-:slug`
- `/:verb(mole-trapping|...)-:slug(cityAlt)` → `/mole-control-:slug`
- Same for reverse, `/city/:slug`, E-spelling

Result: 2,876 → ~85 routes. Below Next.js 1,000-route performance warning. Same Pattern 2/3/5/6/7 coverage per redirect-audit_2026-04-20.md. Track D MIGRATE blogs excluded from blogSlugs so legacy-root rendering works.

Also in `fed3667`: citySlugs derived from `city-data.ts` (fixes 77→90 drift), explicit `-2` duplicates for seatac/sumner/lake-city (Pattern 5), southhill→south-hill spelling (Pattern 6), middleware `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` on non-prod hosts with site-wide matcher.

**"Only mole-exclusive" unsubstantiated claim removal (session 1, commit `3f5e7b6`)**

15 files cleaned: pages-data.ts (reviews + commercial reseeded to CMS), llms.txt, test/city, positioning.md, copy-city-template.md, phase-2 briefs, GEO citation strategy, 4 reviews-testimonials-seo files, 7 meta-ads variants, homepage blueprint, GBP strategy. Memory rule `feedback_got_moles_no_only_claim.md` saved + indexed.

### Staging verified

- `/how-many-eyes-do-moles-have/` — renders with migrated content, BLUF, FAQs, internal links, CTA
- `/mole-control-centralia/` — renders Centralia city page
- `/mole-control-eatonville/` — renders Eatonville city page
- `/algona/` — 308 redirect to `/mole-control-algona/` (was 404 before citySlugs alignment)

### Track D closed: MERGE redirects + olympia one-off (commit `2b874fc`)

Completes the old-blog-migration-plan_2026-04-20.md inventory. Caught a math error in my earlier reporting: I'd been subtracting from the plan's header "18 MIGRATE" but the per-row verdict count is 16. MIGRATE was already 100% complete after Block 6.

Added in this commit:
- **8 MERGE 301s** per redirect-audit Pattern 1 hand-map: voles-vs-moles-whats-the-difference → mole-vs-vole-vs-gopher; moles-vs-gopher-mounds → mole-vs-vole-vs-gopher; what-species-of-moles-live-in-washington-state → types-of-moles-in-washington; do-moles-hibernate → when-are-moles-most-active-washington; when-are-moles-most-active → when-are-moles-most-active-washington; how-to-get-rid-of-moles-in-your-yard → how-to-get-rid-of-moles; what-works-for-mole-extermination → best-mole-traps; what-do-moles-eat handled via existing blogSlugs same-slug auto-redirect.
- **One-off city redirect** (row 20): /olympia-mole-exterminator/ → /mole-control-olympia/

Old-blog-inventory final state (25 rows):
- MIGRATE: 16/16 live (15 content pages + 1 consolidation redirect)
- MERGE: 8/8 redirected (7 high-confidence topical, 1 medium — Ian can refine)
- Row 20 (city): redirected

**Track D is closed.** No blog inventory items remain.

### Final 10 MIGRATE blogs with GEO built in (commit `2869a70`)

Completes Track D MIGRATE to 15 of 18 blogs live. All render at their indexed WordPress URLs via `urlPattern='legacy-root'`. Same H2 structure as original (keyword equity preserved), expanded with PNW-specific depth, BLUF, 5 FAQs each, 2-3 internal links, question-format H2s built in from the start.

Migrated this block:
- /what-do-mole-holes-look-like/
- /is-a-mole-a-rodent/
- /what-attracts-moles-to-your-yard/
- /can-moles-swim/
- /how-deep-do-moles-dig/
- /why-do-moles-make-molehills/
- /what-eats-moles/
- /how-many-babies-do-moles-have/
- /do-moles-live-in-groups/
- /are-moles-poisonous-or-venomous/

Content corrections made during migration:
- `how-many-babies-do-moles-have` and `do-moles-live-in-groups`: old source cited Eastern, star-nosed, and hairy-tailed moles — none of which live in Washington. Rewrote to focus on Townsend's (2-4 pups, once yearly, Mar-Apr) which IS the PNW species.
- `can-moles-swim`: old source called moles "digging rodents" — they aren't rodents. Fixed.
- `are-moles-poisonous-or-venomous`: honest nuance — some mole/shrew species globally have mild worm-paralyzing toxins, but Washington species don't.
- All: stripped any "Got Moles?" question-mark references; no banned "only mole-exclusive" claims.

Added in same commit:
- `/are-moles-venomous/` → `/are-moles-poisonous-or-venomous/` 308 redirect (content duplicate consolidation)
- `BlogPostContent.tsx` fallback image map extended for all 10 new slugs (thematic placeholders reusing existing images, pending Gemini regen)

Track D MIGRATE total ranked keywords preserved: ~230 across 15 blogs with ~70 in top-3. Biggest single save: /how-many-eyes-do-moles-have/ at 90 kw / 46 top-3.

### GEO pass on migrated blogs (commit `94c0c09`)

After the initial migration, audited against BUILD-METHODOLOGY.md Blog Post Build Checklist GEO requirements. Two gaps:

**1. No Speakable schema site-wide.** articleSchema didn't emit a `speakable` field. Added:
```
speakable: {
  '@type': 'SpeakableSpecification',
  cssSelector: ['h1', '#blog-definition-block', '.blog-faq-answer']
}
```
BlogPostContent updated with matching id/class. Applies to all 24 blogs automatically.

**2. Question-format H2 coverage uneven.** Rewrote declarative H2s as questions on 4 migrated blogs — 14 H2 edits total across do-moles-bite (2), do-moles-carry-diseases (3), are-moles-nocturnal (5), vinegar (4). Preserves keyword equity; reframes as natural voice/search queries. All reseeded.

### Outstanding work (not launch-critical)

- 13 remaining MIGRATE blogs — infrastructure proven, next session execution
- 7 MERGE blogs — blocked on Ian validating hand-mapped target slugs
- Gemini hero image regen — 5 migrated blogs currently on thematic placeholders
- H2 question-format pass on the 19 original blogs — same pattern inconsistency. Optional. Speakable schema already covers them.
- Lewis County hero image — Centralia falls back to King County (nice-to-have)
- Spencer messaging confirmation for Centralia/Eatonville (active service vs referral)
- Notion push for migrated blog content (if Spencer wants content-level review)
- llms.txt individual blog listing — currently company-overview only
