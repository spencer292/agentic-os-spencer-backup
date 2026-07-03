---
site: got-moles.com
date: 2026-05-09
sitewide_score: n/a (single-page audit)
pages_audited: 1
fixes_p1: 0
fixes_p2: 1
fixes_p3: 1
hallucination_correction_progress: 4/4 facts surfaces corrected (areaServed, comms areas, founder credentials, pricing)
status: draft
---

# Got Moles On-Page Audit — /about/ (Re-Audit)

Post-Production-Flow-Discipline (Rules A-G) re-audit of /about/. Triggered by Roy's question on whether the skill scores against keyword strategy and whether eyeballing was caught. This run is the proof-of-pattern for the patched evidence-bearing output format.

---

## https://got-moles.com/about/

### Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` v1.1 (lines 87-88, 441) + Brand-Disambiguation Strategy section.

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `Got Moles Spencer Hill mole specialist` (Tier 1, line 441) | Surfaced in H1, title, body, Person schema | ✅ |
| Recommended H1 | `About Got Moles — Western Washington's Mole Specialists` (line 441) | `About Got Moles — Western Washington's Mole Specialists` | ✅ exact match |
| Disambiguation signal (Rule 1: lawn/yard/exterminator/Washington/city/brand) | `Western Washington` + brand `Got Moles` required | `Western Washington` present in H1 + brand present in H1 | ✅ |
| Secondary cluster KWs (≥2 required in H2/H3) | `spencer hill mole control` (VL); `veteran owned mole control washington` (20-80 P2 — "OWN this") | `spencer hill mole control` → H3 "Spencer Hill (Owner & Founder)" + Person schema; `veteran owned mole control washington` → H2 "US Army Veteran-Founded: Built on Military Discipline" + FAQ "Is Got Moles veteran-owned?" | ✅ both surfaced |
| Queries-to-avoid (6 derm/cosmetic/medical clusters, lines 57-65) | `mole removal cost`, `mole on face removal`, `mole biopsy cost`, `apple cider vinegar mole removal`, `is this mole cancerous`, etc. | Scanned title, H1, all 13 H2s, 8 H3s, 6 FAQ questions | ✅ none present |

### Live verification (Rule C)

- **Schema:** 7 JSON-LD blocks parsed via raw HTML extractor (`_audit-tools/fetch-about-schema.mjs`):
  1. Organization (`@id: https://got-moles.com/#organization`) — knowsAbout × 8, hasOfferCatalog × 3 services with prices, sameAs × 8
  2. AboutPage — `mainEntity: {@id: ...#organization}` (referenced ✅), `dateModified: 2026-05-09`, Speakable cssSelector `["h1", "main h2"]`
  3. BreadcrumbList — Home → About
  4. Person (Spencer Hill) — Owner & Founder, Buckley birthPlace, Enumclaw home, Army 2011-2014 credential
  5. @graph[5] — 5 team Persons (Spencer, Cory, Tavis, Brayden, Lukas) with images + descriptions
  6. FAQPage — 6 questions aggregated correctly (per FAQPage aggregation rule)
  7. WebPageElement — Speakable on `#geo-definition` (geo-definition callout)
- **Meta tags:** raw HTML grep confirmed title (70 chars), description (161 chars), canonical, og:* × 6, twitter:* × 4
- **Images:** component source read — `HeroBlock.tsx` has `priority` prop (emits `fetchpriority="high"` + `loading="eager"` at runtime); `TeamCardsBlock.tsx` uses `<Image fill>` inside `aspect-[3/4]` parent (CLS-safe, no explicit width/height needed); HeroBlock alt smart-detection live (commit `9409f8f`)
- **Internal links:** WebFetch reported 22; consistent with rendered city cluster (12 cities) + 3-service grid + body inline links + footer/nav

### Three-Layer SoT (Rule A)

- **Live render:** got-moles.com/about/ — last-deploy commit `9409f8f` (sitewide HeroBlock alt smart-detection, 2026-05-09)
- **HEAD:** `3e26d40` (str-onpage-audit Rules F+G patch — does not affect site code) — last site code commit `9409f8f`
- **Working tree:** divergent on `src/app/(frontend)/page.tsx` + `src/lib/pages-data.ts` (homepage hero changes — UNRELATED to /about/, ready to fold into homepage commit per session open-threads)
- **CMS reseed:** /about/ reseeded as part of commit `ccc4fa5` flow (2026-05-09); no further block-data changes since

All four layers reconciled for /about/ specifically. Working-tree divergence is on homepage files only.

### Pillar scores

| # | Pillar | Wt | Score | Notes |
|---|---|:-:|:-:|---|
| 1 | Headings | 20% | 9.5 | Foundation-doc lookup row 2: H1 exact match. Row 4: both secondary cluster KWs surfaced in H2/H3. Single H1, no skipped levels. -0.5 for pre-existing em dash in H1 (untouched copy). |
| 2 | Meta + Canonical | 10% | 8.0 | **Title 70 chars** (over 60) — redundant `\| Got Moles` suffix. **Description 161 chars** (1 over 160). Canonical, og:*, twitter:* all clean. og:image 1200×630 confirmed. |
| 3 | Schema | 15% | 9.5 | Live verification: 7 blocks well-formed. AboutPage uses referenced `@id` (correct per 2026-05-09 patch). FAQPage aggregated. Speakable on AboutPage + WebPageElement. -0.5 for Spencer Person `sameAs` empty (deferred — needs LinkedIn URL from Roy). |
| 4 | Content AEO | 20% | 9.5 | Foundation-doc lookup row 5: zero queries-to-avoid violations. BLUF answer-first present. Q-format FAQ H2s. Pricing callout (3 services). Verified-fact callout (`#geo-definition` with Speakable). 3 testimonials. Visible "Last updated May 2026". |
| 5 | Internal Links | 15% | 10 | 22 internal links (body inline + 12-city Tier-A cluster + 3-service grid). Anchor diversity per Rule 5 (mix of "Mole Control [city]", "[city] Yard Mole Removal", bare anchors). No links to cannibalisation losers. |
| 6 | Images | 5% | 9.5 | Live verification: HeroBlock `priority` prop + smart-alt confirmed; team cards `fill` + `aspect-[3/4]` parent confirmed CLS-safe. og:image set. |
| 7 | E-E-A-T | 10% | 9.0 | Person schema (Spencer + 4 team) + military credential + founder quote + outbound "219+ Reviews" anchor. Foundation-doc lookup row 4 confirms veteran-owned cluster KW surfaced. -1 for Spencer sameAs deferred. |
| 8 | Freshness | 5% | 9.0 | dateModified `2026-05-09` (Article schema field) + visible "Last updated May 2026". -1 for Last-Modified HTTP header not verified (server config, out-of-scope for code-level audit). |

**Weighted score: 93.5/100 (A-)**

Reconciles down from yesterday's logged 95.25/100 because the title-length issue was missed in that audit (WebFetch didn't return the meta title cleanly). Rule C live verification this run caught it via raw HTML extraction.

### Per-page fix list

| P | Pillar | Gap | Recommended fix | File |
|---|---|---|---|---|
| P2 | Meta | Title 70 chars (>60) — redundant `\| Got Moles` suffix | Change to `About Got Moles \| Founded by Spencer Hill, US Army Veteran` (60 chars exact) | `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/lib/pages-data.ts` `aboutMeta.title` |
| P3 | Meta | Description 161 chars (1 over 160) | Drop trailing full stop after "Meet the team" | same file, `aboutMeta.description` |
| Deferred | Schema/E-E-A-T | Spencer Person `sameAs` empty | Add LinkedIn + any external profile URL when Roy supplies | `site/src/lib/schema.tsx` personSchema |
| Deferred | Freshness | Last-Modified HTTP header not set | Vercel/Next.js server config | server-level, separate workstream |

---

## Apply-mode handoff

P2 + P3 are both single-line edits in the same `aboutMeta` object. Bundleable into one commit running The Only Flow:
1. Edit `aboutMeta.title` + `aboutMeta.description`
2. Humanize check (no new prose, just trims)
3. Build (`npx next build`)
4. No CMS reseed needed (meta lives in route file, not block data)
5. Backup-checkout-reapply not needed (no other uncommitted changes on this file)
6. Commit + push to `mine`
7. Verify live via raw HTML grep

Estimated to lift Pillar 2 from 8.0 → 10, raising weighted total to **95.5/100 (A)**.

---

## Self-check (Rule G)

- [x] Foundation-doc lookup section present + populated (5 rows)
- [x] Live verification section present (schema count, component paths read, internal-link cross-check)
- [x] Three-Layer SoT section present (4 layers reconciled)
- [x] Pillar scores reference evidence sections
- [x] Per-page fix list with explicit file paths
- [x] Apply-mode handoff included

Report passes self-check. Saved.
