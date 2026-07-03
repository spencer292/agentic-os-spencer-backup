---
site: got-moles.com
page: /
date: 2026-05-09
mode: post-fix re-audit (Rule G evidence-bearing)
sitewide_score: n/a (single-page)
page_score_pre_p1: 89.5/100 (B+)
page_score_post_p1: 91.5/100 (A) — VERIFIED LIVE 2026-05-09 19:13 UTC
target: ≥ 90/100 (Tier 1)
status: ✅ TARGET MET (A) — P1 WSU placement fix landed, value-driven citation in FAQ
fixes_p1: 0 remaining (P1 closed via commit 5ccc071)
fixes_p2: 2 (Spencer Person sameAs, giant pricing-card anchors)
fixes_p3: 2 (city-anchor trailing-slash diversity, hero priority attr verification)
supersedes: 2026-05-09_got-moles-homepage-audit.md (pre-fix 58.6/D+)
related_commits: c4f4a88, 8211472, edd8fa2, 51fe902, 65f8a78, 3c02d5f, 5ccc071
---

# Got Moles Homepage — Post-Fix Re-Audit (Rule G evidence-bearing)

This audit re-runs the full Rule G chain against post-fix live state. The pre-fix audit (`2026-05-09_got-moles-homepage-audit.md`) scored 58.6/D+. After 5 commits applied, an estimated 89.4/B+ was reported but never live-verified — Roy caught the hand-wave + flagged the WSU outbound link placement as bolted-on. This file replaces that estimate with live evidence.

**Verified score: 89.5/100 (B+).** 0.5 below the Tier 1 ≥90 target.

## Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` (Tier 1 row "Homepage", line 434), `authority-strategy.md` (Cluster 1).

| Field | target-keywords.md says | Live | Match |
|---|---|---|---|
| Primary KW | yard mole control / mole exterminators Western Washington | "Yard Mole Control" in H1 + title; "Exterminators" in title | ✅ |
| Recommended H1 | "Yard Mole Control in Western Washington" | "Yard Mole Control in Western Washington" | ✅ EXACT |
| Recommended title | "Yard Mole Control & Exterminators in Western Washington \| Got Moles" | "Yard Mole Control & Exterminators in Western Washington \| Got Moles" (67 chars decoded) | ✅ EXACT |
| Disambiguation Rule 1 (yard / lawn / exterminator / Washington) | required in title + H1 | "Yard" + "Western Washington" in H1; "Yard" + "Exterminators" + "Western Washington" in title | ✅ |
| Anchor-city seeding (first 200 words) | Seattle / Tacoma / Bellevue / Sammamish / Puyallup / Renton | all 6 present in BLUF block | ✅ all 6 |
| County seeding (first 200 words) | King / Pierce / Snohomish / Thurston / Kitsap / Lewis | all 6 present | ✅ all 6 |
| Secondary cluster KWs in H2/H3 | "professional mole control", "how … removes moles", "serving X communities" | "What Is Professional Mole Control?", "How Got Moles Removes Moles", "Serving 92+ Communities Across Western Washington" | ✅ all 3 |
| Queries-to-avoid scan | no "WA's #1", no I-713 claims, no "free inspection/quote/estimate", no "only mole-exclusive" | none present | ✅ clean |
| canonical_facts (founded 2017, ~5,000 clients, 92+ communities, 6 counties, Spencer Hill US Army veteran 2011-2014, $100/mo TMCP, $450 OMP + $150 setup, 219+ reviews) | required visible | all present in BLUF + stats + service cards + founder voice + LocalBusiness schema | ✅ all 9 |

**Hallucination-correction status:** all 9 canonical facts are now correctly stated in live HTML. Pre-fix had "70+ communities" + "4 counties"; both corrected to "92+" + "6". Spencer Hill (not "Spencer Andrews"). Footer global also fixed (commit `edd8fa2`).

## Live verification (Rule C)

Method: `_audit-tools/fetch-home-schema.mjs` extended this session with word count + anchor-text capture + anchor-city scan. Run timestamp: 2026-05-09 17:53 UTC. Vercel cache HIT.

### Headings
- H1 count: 1 ("Yard Mole Control in Western Washington")
- H2 count: 11 (intent + service + how + why + reviews + service area + stats + FAQ + founder + CTA)
- H3 count: 14 (service tiers + 4-step process + value props + footer columns)
- No skipped levels.

### Meta
- title: 71 raw chars (`&amp;` encoded), 67 decoded → at upper SERP cutoff (50-60 ideal)
- description: 160 chars → at exact upper bound, OK
- canonical: `https://got-moles.com` (NO trailing slash; URL is `https://got-moles.com/`) — minor canonical-form drift
- og:title / og:description / og:image / twitter:card all present
- og:image: `/images/og-default.webp` ✅

### Schema (raw HTML JSON-LD parse)
6 blocks emitted:

| # | @type | Notes |
|---|---|---|
| 1 | Organization (`#organization`) | sameAs (8 URLs incl. FB/IG/LI/Yelp/Nextdoor + 3 Google KP), knowsAbout (8 items), hasOfferCatalog (3 services with prices) |
| 2 | WebPage | mainEntity uses `{@id: #organization}` reference (not embedded), dateModified `2026-05-09`, speakable `[h1, main h2]` |
| 3 | LocalBusiness (`#business`) | aggregateRating 5.0/219, geo coords, openingHoursSpecification, founder Spencer Hill (no sameAs LinkedIn) |
| 4 | BreadcrumbList | single Home item (homepage) |
| 5 | WebPageElement | Speakable companion targeting `#geo-definition` |
| 6 | FAQPage | mainEntity array of Question/Answer (6 Qs) |

All blocks parse without error. mainEntity uses `@id` reference per `feedback_one_organization_per_page` pattern. No duplicate Organization or LocalBusiness embeds.

### Images (3 total in HTML)
1. Header logo `logo-cream.svg` alt="Got Moles", no loading/priority attrs surfaced (SVG, OK)
2. Hero `_next/image?url=%2Fimages%2Fhero-home.webp` alt="Yard Mole Control in Western Washington" — `loading` + `fetchpriority` attrs not surfaced in raw extraction. Must verify via component source (`HeroBlock.tsx` `priority` prop) — Next.js `<Image priority>` should emit `fetchpriority="high"`. Open thread P3.
3. Footer logo alt="Got Moles" `loading="lazy"` ✅

### Internal links (anchor-text + destination capture)
- 42 internal anchors, 31 unique destinations
- 1 external anchor (WSU Extension)
- 4 tel: anchors

**Distribution by destination cluster:**
- Service pages: 6 (each of 3 services × 2 = pricing card + footer; pricing card anchor wraps the entire card body, ~30+ words of text)
- City pages (Tier 3): 17 (12 in serviceArea block + 5 in footer)
- Hub pages (about/contact/how-it-works/service-areas/reviews/faq/blog): 13
- Author: 1 (`/author/spencer/`)
- Legal: 2 (privacy/terms)
- Self / nav: 3

**Anchor diversity findings:**
- City links: GOOD diversity — 12 distinct city anchors in serviceArea block use bare city names. Footer repeats 5 of these — minor duplication.
- Service links: BAD — 3 pricing cards each wrap entire card body in a single `<a>`. Anchor text becomes a 30-word string ("Total Mole Control ProgramYear-round mole control for $100/month. Regular monitoring, immediate response, and a written report after every visit. The only year-round mole subscription in Western Washington.Get Year-Round Protection"). Diversity OK across the 3, but each individual anchor is an oversized blob. Same destinations also linked from footer with concise anchors ("Year-Round Protection (TMCP)" etc.) which mitigates.
- Trailing-slash drift: service URLs use trailing slash (`/services/total-mole-control-program/`), city URLs do not (`/mole-control-sammamish`). Inconsistent canonical form. Verify which form 301s to which (P3).

### External links (1 total)
- WSU Extension `https://pubs.extension.wsu.edu/product/mole-management-in-washington-backyards-home-garden-series/` — anchor text "WSU Extension"

**Placement assessment (Roy's flag):** Located in BLUF block, 3rd paragraph. The BLUF answers "What is professional mole control?" The 3rd paragraph reads: *"Western Washington's dominant species is the Townsend's mole, the largest mole in North America (per WSU Extension)."* This is a non-sequitur — the BLUF defines the SERVICE ("finding active tunnels, placing traps, removing moles, no chemicals, no general pest treatment"); a biology factoid about Townsend's mole at the end has no narrative connection. Per `feedback_outbound_links_must_earn_their_place.md`, this is a checkbox-driven citation, not value-driven. Mechanically counts for Pillar 7, but content-quality fail.

### Word count
- Visible body: **1,359 words** (after stripping nav, scripts, styles, SVG, footer attribution lines aren't fully removed but minor)
- Solid homepage length. Not flagged.

### Headers
- `cache-control: public, max-age=0, must-revalidate`
- `x-vercel-cache: HIT` (CDN-cached)
- No `Last-Modified` header (Vercel default; visible date string + schema dateModified compensate)

## Three-Layer SoT (Rule A)

| Layer | State |
|---|---|
| Live render | Vercel CDN HIT, deploy `dpl_4S6iY1KG3hyedSe4jXy9VTXnaLh2` (build from latest main) |
| HEAD | `3c02d5f` (Commit 4 — Founder Voice + dateModified + Last updated string) |
| Working tree | divergent — `pages-data.ts` + `page.tsx` both M (this session's evidence-extending edits to `_audit-tools/fetch-home-schema.mjs`; pages-data.ts edits were committed in commits above; verify before next commit) |
| CMS reseed | last reseed: post-Commit 4 (`npm run seed -- --reseed home`); confirms live block content matches HEAD |

Live = HEAD = CMS data: ✅ aligned. Working-tree divergence is in `_audit-tools/` (auditing scripts, not site code) + page.tsx may have leftover edits — verify before next commit per Rule D.

## Pillar scores

| # | Pillar | Wt | Score | Weighted | Notes |
|---|---|---:|---:|---:|---|
| 1 | Headings | 20% | 20/20 | 20.0 | H1 exact match, all secondary KWs in H2/H3, no skipped levels, disambiguation present |
| 2 | Meta | 10% | 9/10 | 9.0 | Title 67 chars (slightly over 60), canonical form drift (no trailing slash on `got-moles.com` while URL has it). All other meta perfect. |
| 3 | Schema | 15% | 14/15 | 14.0 | 6 blocks all valid, mainEntity `@id` ref pattern, Speakable + FAQPage + Breadcrumb + LocalBusiness aggregateRating + dateModified all present. **Gap:** Spencer Person `sameAs` (LinkedIn) not populated. |
| 4 | Content AEO | 20% | 18/20 | 18.0 | BLUF answers intent, question H2s, stat block, verified-fact callouts, no queries-to-avoid, 1,359 words. **Gap:** no comparison table for service tiers (would lift +1); WSU citation a checkbox not a value-add (-1 quality). |
| 5 | Internal Links | 15% | 13/15 | 13.0 | 42 internal links, strong cluster coverage (services + 12 cities + 7 hubs). **Gaps:** giant pricing-card anchors (-1), service vs city trailing-slash drift (-1). |
| 6 | Images | 5% | 4/5 | 4.0 | Hero alt matches H1, footer logo lazy-loaded. **Gap:** hero `priority` attr not surfaced in raw HTML — needs component-source verification (likely fine, but unverified = -1). |
| 7 | E-E-A-T | 10% | 7/10 | 7.0 | Founder Voice block + author byline link to `/author/spencer/`, founder schema in LocalBusiness, outbound to authority anchor present. **Gaps:** Spencer Person `sameAs` LinkedIn missing (-1), WSU citation placement bolted-on per `feedback_outbound_links_must_earn_their_place.md` (-2). |
| 8 | Freshness | 5% | 4.5/5 | 4.5 | dateModified in WebPage schema, "Last updated May 2026." visible in geoDefinition. **Gap:** no `Last-Modified` HTTP header (Vercel limitation). |
| | **TOTAL** | 100% | | **89.5** | **B+** — 0.5 below Tier 1 ≥90 target |

## Path to ≥90

The page is one **content-quality fix** + one **structured-data field** away from A:

### P1 — WSU outbound link earns its place (Pillar 7)

**Problem:** "Western Washington's dominant species is the Townsend's mole, the largest mole in North America (per WSU Extension)." parachuted into BLUF as 3rd paragraph. Doesn't connect to the BLUF's claim ("what is professional mole control"). Roy: "randomly dropped in the middle of the page with very little thought."

**Three options, ranked:**

**Option A (RECOMMENDED) — Move to FAQ as a science-backed answer.** The page already has a "Common Questions" FAQ block. Add a new Q: *"What kind of moles do you find in Western Washington?"* Answer: *"The dominant species is the Townsend's mole — the largest mole species in North America, native to the wet soils of the Pacific Northwest. It's a native, non-invasive animal, which is why our methods focus on physical control rather than chemicals. (Per [WSU Extension's Mole Management in Washington Backyards](https://pubs.extension.wsu.edu/product/mole-management-in-washington-backyards-home-garden-series/).)"* This is a question users actually ask, the species fact directly answers it, and the WSU citation backs the species claim. Fix in `pages-data.ts` homepage FAQ block + reseed.

**Option B — Rewrite BLUF 3rd paragraph to make a methodology citation.** Replace the Townsend's factoid with: *"Our chemical-free approach follows the trapping protocol described in WSU Extension's [Mole Management in Washington Backyards](...) — physical control sized to the active tunnels we find."* This makes the citation methodology-backed (per the rule's good-citation patterns: methodology). Same destination, but earns its place because the sentence makes a citation-worthy methodology claim.

**Option C — Remove WSU outbound entirely + replace with a WDFW regulatory citation in a different block.** WDFW's regulatory guidance on traps in Washington could anchor a "Why we use the methods we use" sentence (regulatory citation = good pattern). But this means losing the WSU anchor, which is a Cluster 1 priority anchor in `authority-strategy.md`.

**Recommendation: Option A.** It keeps WSU (Cluster 1 priority), the citation earns its place (answers a real species question), and adds a high-AEO-value FAQ entry that AI engines can extract verbatim. **Pillar 7 lifts +2 → 9/10**, total **91.5/A**.

### P2 — Spencer Person sameAs LinkedIn (Pillar 3 + Pillar 7)

LocalBusiness `founder` is a Person object with name + jobTitle + description, but no `sameAs`. Add `sameAs: ["https://www.linkedin.com/in/{spencer-handle}/"]` once Roy provides the URL. Lifts Pillar 3 +1 + Pillar 7 +1.

(Same open thread carried over from /about/ audit.)

### P3 — Polish (defer)

- **Giant pricing-card anchors:** the 3 service cards each wrap the full card body in `<a>`. Either restructure to wrap only the card heading (cleaner anchor) or accept (UX pattern is intentional — full-card click target). Not blocking ≥90.
- **Trailing-slash drift:** verify city URLs canonicalize with vs without trailing slash. Sitewide redirect rule decision; not page-level.
- **Hero `priority` attr verification:** read `HeroBlock.tsx` to confirm `priority` prop is set. Likely fine.
- **Title 67 chars:** within Google's actual SERP rendering tolerance (~70). Not worth trimming if it loses "Exterminators" KW.

## Open threads

1. Apply P1 Option A — add Townsend's-mole FAQ Q with WSU citation; reseed; verify via extractor; expect 91.5/A
2. Apply P2 — Spencer Person `sameAs` LinkedIn (awaits URL from Roy; same thread as /about/)
3. Defer P3 to next homepage touch
4. After P1+P2 land + 7-day monitor → next Tier 1 page (Total Mole Control Program service page)

## P1 verification (commit `5ccc071`, deployed 2026-05-09 19:13 UTC)

**Live extractor re-run after deploy** (`x-vercel-id: lhr1::2lkxb-1778350387492-9c20e74a4367`):

| Check | Pre-P1 | Post-P1 | Verdict |
|---|---|---|---|
| BLUF paragraphs | 3 (Townsend's mole non-sequitur as 3rd) | 2 (clean — defines service then states scale) | ✅ removed |
| WSU outbound link | 1 in BLUF prose, anchor "WSU Extension" | 1 in FAQ answer, anchor "WSU Extension's Mole Management in Washington Backyards" | ✅ relocated + descriptive anchor |
| FAQ items | 6 | 7 (added "What kind of moles do you find in Western Washington?") | ✅ added |
| FAQPage schema mainEntity | 6 Q/A | 7 Q/A | ✅ schema picked up new entry |
| Word count | 1,359 | 1,404 (+45 net: new FAQ Q+A minus removed BLUF para) | ✅ |
| H2/H3 counts | 11 / 14 | 11 / 14 | ✅ unchanged |
| JSON-LD blocks | 6 | 6 | ✅ unchanged |

**Pillar 7 re-score:** 7/10 → 9/10 (+2). The outbound to authority anchor is now value-driven (citation backs a species claim that directly answers the user's question) rather than checkbox-driven (parachuted factoid). Still −1 for Spencer Person `sameAs` LinkedIn (P2 open thread, awaits URL from Roy).

**Total page score:** 89.5 → **91.5/100 (A)**. Tier 1 target ≥90 met.

| # | Pillar | Wt | Pre-P1 | Post-P1 | Δ |
|---|---|---:|---:|---:|---:|
| 7 | E-E-A-T | 10% | 7/10 (7.0) | 9/10 (9.0) | +2.0 |
| | **TOTAL** | | **89.5** | **91.5** | **+2.0** |

All other pillar scores unchanged (no other fixes shipped in commit 5ccc071).

## Hand-wave audit (the lesson)

Pre-fix audit ran full Rule G → 58.6/D+. After 5 commits, I claimed 89.4/B+ as the new score. That number was projected ("Commit 1 lifts Pillar 1 from x to y, Commit 2 lifts Pillar 4 by z, …") not measured. This re-audit measures: 89.5/B+ — accidentally close, but the WSU placement issue was completely invisible to the projection because projection only counts what code CHANGED, not what code now SAYS in context.

Logged as `feedback_post_audit_must_be_rule_g_too.md`. Re-scoring must run the same evidence chain as the original. Always.
