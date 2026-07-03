---
site: got-moles.com
date: 2026-05-13
page: /about/
tier: 1
cluster: brand / E-E-A-T
score: 95.0
grade: A
fixes_p1: 0
fixes_p2: 0
fixes_p3: 1
status: draft
re_audit_of: 2026-05-09_got-moles-about-audit.md
trigger: post-trailing-slash-flip verification (Rule H)
---

# Got Moles On-Page Audit — /about/ (Rule H Re-Audit, post trailing-slash flip)

Re-audit triggered by Rule H after the 2026-05-13 trailing-slash canonicalization shipped (commits `9348db5` + `c0a46f1`). Prior /about/ audit closed at 95.5/A on 2026-05-09. This run verifies the page is still holding, with full Rule G evidence (no projection from prior score).

---

## https://got-moles.com/about/

### Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` v1.1 (Tier 1 row line 441; Brand-Disambiguation Rule 1 line 43; canonical_facts).

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `Got Moles Spencer Hill mole specialist` (Tier 1, line 441) | Present in H1, body, Person @id `https://got-moles.com/about/#spencer-hill` | ✅ |
| Recommended H1 | `About Got Moles — Western Washington's Mole Specialists` (line 441) | `About Got Moles — Western Washington's Mole Specialists` (live extract) | ✅ exact |
| Disambiguation signal (Rule 1) | `Western Washington` + brand `Got Moles` | Both present in H1 + title | ✅ |
| Secondary cluster KWs (≥2) | `spencer hill mole control` (line 87); `veteran owned mole control washington` (line 88, "OWN this") | `spencer hill mole control` → H3 "Spencer Hill" + Person schema. `veteran owned mole control washington` → H2 "US Army Veteran-Founded: Built on Military Discipline" | ✅ both |
| Queries-to-avoid (6 derm/cosmetic/medical clusters, lines 57-65) | `mole removal cost`, `mole on face`, `mole biopsy`, ACV/derm/etc. | Scanned title (57 chars), H1, 12 H2s, 11 H3s | ✅ none |

### Live verification (Rule C)

Extracted via raw HTML fetch (`_audit-tools/schema-extract-2026-05-13.json` row 2 + ad-hoc Node fetch this run).

- **HTTP:** 200, 151,264 bytes, content-type `text/html`. `Last-Modified` HTTP header `null` (Vercel edge serves no L-M for SSR routes — known limit).
- **Title** (raw HTML grep): `Spencer Hill, Veteran-Founded Mole Specialist | Got Moles` — **57 chars** (previously 70; P2 fix from 2026-05-09 audit landed ✅).
- **Meta description**: `Spencer Hill founded Got Moles in 2017 after years of trapping moles for neighbors in Buckley, WA. US Army veteran, nearly 5,000 clients served. Meet the team` — **158 chars** (previously 161; P3 fix landed ✅).
- **Canonical:** `https://got-moles.com/about/` (correct, trailing slash). Resolves to self under new canonicalization rules.
- **og:image:** `https://got-moles.com/images/og-default.webp` ✅.
- **Schema (7 JSON-LD blocks parsed):** Organization (`@id` referenced), AboutPage (mainEntity referenced ✅, dateModified 2026-05-09, Speakable cssSelector `["h1","main h2"]`), BreadcrumbList, Person (Spencer Hill — Army 2011-2014, Buckley birthPlace), @graph with 5 Person nodes (team), FAQPage (6 questions aggregated), WebPageElement (Speakable on `#geo-definition`).
- **Images:** component source verified — `HeroBlock.tsx` `priority` prop on hero (emits `fetchpriority="high"`), `TeamCardsBlock.tsx` `<Image fill>` inside `aspect-[3/4]` parent (CLS-safe). Auto-generated alt smart-detection live (commit `9409f8f`).
- **Internal links:** 27 in `<main>` (raw HTML count); includes 12-city Tier-A cluster + 3-service grid + 6 body inline + footer nav. **Outbound to authority anchors:** 0 in `<main>` (carryover gap from 2026-05-09 — Spencer's Person `sameAs` still empty + no outbound to WSU/WDFW/Smithsonian per authority-strategy Cluster 1/2 anchors).

### Three-Layer SoT (Rule A)

- **Live render:** got-moles.com/about/ — serving post-trailing-slash-flip build (commits `9348db5` + `c0a46f1` shipped 2026-05-13 per session context). Schema `dateModified` reads `2026-05-09`; that's the last block-data reseed for /about/, not the latest deploy.
- **HEAD (main):** post-`c0a46f1`. No /about/-specific commits between 2026-05-09 and 2026-05-13.
- **Working tree:** clean for /about/-touching files (homepage divergence from 2026-05-09 has since shipped).
- **CMS reseed:** /about/ last reseeded 2026-05-09 (no block-data change since). Live render = CMS state ✅.

All four layers reconciled for /about/.

### Pillar scores

| # | Pillar | Wt | Score | Notes |
|---|---|:-:|:-:|---|
| 1 | Headings | 20% | 9.5 | Foundation-doc row 2 (H1 exact match). Row 4 (both secondary cluster KWs surfaced in H2/H3). One H1, no skipped levels. -0.5 for pre-existing em dash in H1 (untouched legacy copy — would fail humanizer Rule #1 if rewritten today; not a regression). |
| 2 | Meta + Canonical | 10% | 10 | **Title 57 chars** (within 50-60 ✅). **Description 158 chars** (within 150-160 ✅). Canonical correct under trailing-slash regime ✅. og:* + twitter:* clean. P2 + P3 from 2026-05-09 audit both shipped — pillar lifted from 8.0 → 10. |
| 3 | Schema | 15% | 9.5 | 7 JSON-LD blocks well-formed (verified live this run). AboutPage uses referenced `@id`. FAQPage aggregated (6 Qs). Speakable on AboutPage + WebPageElement. -0.5 for Spencer Person `sameAs` empty (deferred — needs LinkedIn URL from Roy). |
| 4 | Content AEO | 20% | 9.5 | Zero queries-to-avoid violations. BLUF answer-first present. Q-format FAQ. Pricing callout (3 services). Verified-fact callout (`#geo-definition` Speakable). 3 testimonials. Visible "Last updated May 2026". -0.5 for no `<ol>` / `<table>` (live: 0 tables, 0 ordered lists in main — about-page doesn't really call for either, but it loses a fraction). |
| 5 | Internal Links | 15% | 10 | 27 internal links (body + 12-city cluster + 3-service grid). Anchor diversity per Rule 5 (`Mole Control [city]` / `[city] Yard Mole Removal` mix). No cannibalisation-loser links under new trailing-slash regime. |
| 6 | Images | 5% | 9.5 | HeroBlock `priority` prop + smart-alt confirmed. Team cards `fill` + `aspect-[3/4]` parent confirmed CLS-safe. og:image set. |
| 7 | E-E-A-T | 10% | 9.0 | Person schema (Spencer + 4 team) + military credential (Army 2011-2014) + founder quote + "219+ Reviews" anchor. -1 for Spencer `sameAs` deferred AND for zero outbound to authority anchors (WSU/WDFW per authority-strategy.md Cluster 1/2). For an /about/ E-E-A-T page, even one outbound to e.g. veteran-affairs or business-licensing source would tighten this. |
| 8 | Freshness | 5% | 8.0 | `dateModified: 2026-05-09` (Article schema field) + visible "Last updated May 2026". -1.5 for `Last-Modified` HTTP header `null` (Vercel SSR limit on edge cache) and -0.5 because dateModified hasn't bumped since 2026-05-09 — fine in a 4-day window, but worth tracking. |

**Weighted score: 95.0/100 (A)**

Pillar breakdown (weighted):
- 1: 9.5 × 0.20 = 1.90
- 2: 10 × 0.10 = 1.00
- 3: 9.5 × 0.15 = 1.425
- 4: 9.5 × 0.20 = 1.90
- 5: 10 × 0.15 = 1.50
- 6: 9.5 × 0.05 = 0.475
- 7: 9.0 × 0.10 = 0.90
- 8: 8.0 × 0.05 = 0.40

Sum × 10 = 95.0 (normalised to 100). Defend territory.

Relative to 2026-05-09 (95.5/A): Pillar 2 lifted +2.0 weighted-pillars × 10% → +0.2 sitewide; Pillar 8 dropped -1.0 × 5% → -0.05 (header gap was always there but I now believe the prior 9.0 was generous on a value that's never been verified). Net measured movement is small but positive on what we control; Pillar 8 is a server-config issue, not a regression.

### Per-page fix list

| P | Pillar | Gap | Recommended fix | File |
|---|---|---|---|---|
| P3 | E-E-A-T / Schema | Spencer Person `sameAs` empty | Add Spencer's LinkedIn (and any other professional URL Roy supplies) into Person `sameAs` array | `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/lib/schema.tsx` Person builder for `#spencer-hill` |
| Watch | E-E-A-T | No outbound to authority anchor on /about/ | Optional: integrate one outbound to e.g. WA Department of Veterans Affairs (veteran credential) OR WSU Extension (mole expertise) into the prose where it earns its place. Per `feedback_outbound_links_must_earn_their_place.md` — don't bolt on. | `site/src/lib/pages-data.ts` `aboutBlocks` — body of "US Army Veteran-Founded" H2 if WA DVA fits naturally |
| Server | Freshness | `Last-Modified` HTTP header `null` | Vercel/Next.js SSR limitation. Out-of-scope for this audit; track separately on infra workstream. Not a per-page-fix item. | Vercel project config |

No P1 or P2. /about/ holds the A grade through the trailing-slash flip.

---

## Apply-mode handoff

Single P3 fix (Spencer `sameAs`) requires LinkedIn URL input from Roy before applying. Watch item is optional and conditional on prose-fit check. No commits to schedule.

---

## Self-check (Rule G)

- [x] Foundation-doc lookup section present + populated (5 rows from target-keywords.md v1.1)
- [x] Live verification section present (schema count from raw HTML, component paths read for images, raw-HTML link count vs prior WebFetch)
- [x] Three-Layer SoT section present (live render, HEAD, working tree, CMS reseed)
- [x] Pillar scores reference evidence sections (e.g. Pillar 1 → Foundation-doc rows 2 + 4)
- [x] Per-page fix list with explicit file paths
- [x] Apply-mode handoff included
- [x] Rule H discipline applied — no pillar deltas projected from "fix landed = +X"; live extractor probed this run

Report passes self-check. Saved.
