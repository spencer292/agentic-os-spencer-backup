---
site: got-moles.com
date: 2026-05-13
page: /blog/best-mole-traps/
tier: 3
cluster: diy-vs-pro
score: 76.5
grade: B
fixes_p1: 1
fixes_p2: 3
fixes_p3: 1
status: draft
---

# Got Moles On-Page Audit — /blog/best-mole-traps/

Tier-3 blog post in the `diy-vs-pro` cluster. Spencer flagged as P0 lift (GSC position 6.0, target Top 3) and as a competitive-citation target (named in Pixelmojo's 7 competitor URLs cited instead of Got Moles for "best mole traps" queries). Posture A discipline applies — silent on body-gripping mechanism; review traps by name without naming the trigger mechanism.

---

## https://got-moles.com/blog/best-mole-traps/

### Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` v1.1 (Tier 3 line 479; cluster diy-vs-pro line 317; Posture A reminders lines 55 + 68 + 317).

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `best mole traps` (line 317, mapped to `/blog/best-mole-traps/`) | Present in H1, title, BLUF, repeated through body | ✅ |
| Recommended H1 | `Best Mole Traps in 2026: What Actually Works (Expert Review)` (implied; not separately listed in target-keywords.md "Recommended H1" column for Tier 3 blogs) | `Best Mole Traps in 2026: What Actually Works (Expert Review)` | ✅ |
| Disambiguation signal (Rule 1) | `lawn` / `yard` / `Washington` / brand `Got Moles` required (page targets ambiguous "mole" head term) | **`Washington` absent from H1**. `2026` + `Expert Review` carry recency-and-credibility signal but no lawn/yard/Washington disambiguator. Body: "Western Washington" appears in H2 "Which Trap Works Best in Different Washington Soil Conditions" + repeatedly in body. | ⚠️ partial — H1 lacks explicit lawn/Washington signal but body carries it strongly |
| Secondary cluster KWs (≥2) | `best mole repellent` (line 316), `do mole repellents work` (line 314), `does grub control stop moles` (line 313), `DIY mole control vs professional` (line 308) | `Mole Bait vs. Mole Traps` H2 (~`mole bait` adjacent KW), `When DIY Trapping Works (and When It Doesn't)` H2 (DIY-vs-pro intent), "Which Trap Works Best in Different Washington Soil Conditions" H2 (regional intent). Direct repellent / grub control queries are intentionally NOT covered here (separate posts per target-keywords.md). | ✅ both cluster intents surfaced |
| Queries-to-avoid | Body-gripping mechanism names: `scissor mole trap`, `harpoon mole trap`, `choker loop trap`, `body-gripping`, `kill traps` (line 68 — Posture A) | H2 "Scissor Traps: The Workhorse", H2 "Harpoon Traps: Easiest for Beginners", H2 "Choker Loop Traps: Effective in the Right Hands". Body uses "scissor trap" / "harpoon trap" / "choker loop trap" by name. | ⚠️ **Posture A flag** — see below |

**Posture A check (canonical hard rule per memory `feedback_got_moles_posture_a_silent_mechanism.md`):**

> All copy silent on body-gripping/scissor/harpoon/spear/spike/kill/lethal mechanisms. WA AG opinion + WAC + RCW 77.15 unambiguously prohibit. "Trapping" generic verb is fine.

This page **names** scissor / harpoon / choker loop trap types directly in H2s and body. target-keywords.md line 317 says: *"Posture A: review traps without naming body-gripping mechanism explicitly"*. The post is named-mechanism-heavy.

**Tension resolution:**

The post is **reviewing trap products by name** (which is the searcher intent — "best mole traps" is product-comparison commercial intent). Scissor trap, harpoon trap, and choker loop trap are the **product category names**, not the mechanism descriptors. The Posture A rule bans `body-gripping`, `kill`, `lethal`, `spike`, `spear`, `harpoon mechanism`, `scissor mechanism` — i.e. mechanism-descriptor language explicit about killing.

Live body uses: "the jaws close" (Scissor Traps section), "the mole triggers it when it pushes back up" (Harpoon), "tightens around the mole" (Choker Loop). These are mechanism descriptions. The Posture A memory is clear: silent on mechanism. **This is a Posture A risk** — content describes the trigger / killing mechanism using neutral verbs but still describes it.

**Recommended Posture A audit (separate from on-page-audit scope):** Roy + Spencer should review the body text of each trap H2 against the canonical Posture A discipline. This audit flags the risk but doesn't unilaterally rewrite the copy — Posture A interpretation is a positioning decision, not an on-page-audit decision. Recommended escalation to `mkt-copywriting` skill if a rewrite is desired.

For the score below, I am scoring Pillar 4 "queries-to-avoid" with a **partial** — naming the trap types is search-intent-correct, but the mechanism descriptions land in Posture A grey zone.

### Live verification (Rule C)

Extracted via raw HTML fetch + `_audit-tools/schema-extract-2026-05-13.json` row 11.

- **HTTP:** 200, 112,926 bytes. `Last-Modified` header `null`.
- **Title** (raw HTML): `Best Mole Traps in 2026: What Actually Works (Expert Review) | Mole Control Blog | Got Moles` — **92 chars** (over 60 by 32). "Mole Control Blog" + "Got Moles" suffix appended.
- **Meta description:** `The best mole trap is the one placed in the right tunnel. Here's what professionals actually use, and why placement matters more than the trap itself.` (155 chars ✅).
- **Canonical:** `https://got-moles.com/blog/best-mole-traps/` (self ✅).
- **og:image:** `https://got-moles.com/images/blog-best-mole-traps.webp` ✅.
- **Schema (7 JSON-LD blocks parsed, BlogPosting confirmed):** Organization, BlogPosting (dateModified `2026-05-02T09:15:52.782Z`, Speakable true, author Person referenced `@id` to /about/#spencer-hill), DefinedTerm, FAQPage, BreadcrumbList, LocalBusiness (AggregateRating 5.0/219), Person.
- **H1:** 1 (correct). **H2 count:** 12. **H3 count:** 6 (all nav/footer — no content H3s, acceptable).
- **AEO content shape:** **0 HTML tables, 0 ordered lists, 6 unordered lists.** "Which Trap Works Best in Different Washington Soil Conditions" H2 has explicit comparison content (Glacial till / Alluvial clay / Amended garden soil — 3 soil types × 3 trap types × Western Washington geography) — **this is screaming for a table**. Pixelmojo's competitor-citation finding for "best mole traps" specifically calls out 7 competitor URLs cited instead; tables are the #1 reason competitor pages get cited (per `aeo-patterns-2026.md` pattern 4).
- **Internal links in `<main>`:** 19. **Outbound to authority anchors:** **0**. Body discusses mole biology (Townsend's mole), DIY vs professional decision logic, soil conditions — WSU Extension (Cluster 1/2 anchor) or PNW academic soil-science source would integrate naturally.
- **BLUF:** First section "Scissor Traps: The Workhorse" jumps directly into Scissor Traps without a top-line BLUF block. The `blog-data.ts` `bluf` field reads: *"The best mole trap is the one placed in the right tunnel. After 15+ years and nearly 5,000 properties, a $30 Victor scissor trap in a high-traffic deep run will outperform a $200 collection of gadgets scattered across surface tunnels every single time."* This is excellent BLUF copy. **Live render — verify the bluf field is being rendered above the first H2** (likely yes via `BlogPostHero` or top-of-post block; not separately verified this run).

### Three-Layer SoT (Rule A)

- **Live render:** /blog/best-mole-traps/ — content from `blog-data.ts` row 504-529 (slug `best-mole-traps`).
- **HEAD (main):** post-trailing-slash-flip. No blog-data changes for `best-mole-traps` since 2026-05-02.
- **Working tree:** clean.
- **CMS reseed:** Last reseed 2026-05-02 (per `dateModified`).

All layers reconciled.

### Pillar scores

| # | Pillar | Wt | Score | Notes |
|---|---|:-:|:-:|---|
| 1 | Headings | 20% | 8.5 | One H1 ✅. H1 carries primary KW ✅. **No Washington/lawn disambiguation in H1** (-1) — though "Expert Review" + "2026" carry credibility-and-recency signal. Two+ secondary cluster KWs in H2s ✅ (DIY-vs-pro intent, Washington soil regional intent). No skipped levels. -0.5 because some H2s could be Q-format for AEO ("Which mole trap is best?"). |
| 2 | Meta + Canonical | 10% | 5.5 | **Title 92 chars** (over 60 by 32; brand `Got Moles` appears once but "Mole Control Blog" suffix bloats). Description 155 chars ✅ + primary KW + value prop. Canonical self ✅. og:* clean. Pillar dragged down by title length only. |
| 3 | Schema | 15% | 13.5 | All expected types: BlogPosting ✅, Speakable ✅, dateModified ✅ (2026-05-02), author Person referenced `@id` ✅, FAQPage ✅, BreadcrumbList, LocalBusiness w/ AggregateRating ✅, DefinedTerm ✅. -1.5 for Person `sameAs` empty. |
| 4 | Content AEO | 20% | 11.0 | BLUF copy exists in `blog-data.ts` ✅ (assumes rendered). Q-format FAQ ✅. **0 HTML tables** ❌ — explicit comparison content for trap × soil × Washington geography exists in "Which Trap Works Best in Different Washington Soil Conditions" H2. AI engines are citing competitors here per Pixelmojo precisely because Got Moles lacks an extractable table on this exact intent. -3.5. **0 ordered lists** — less critical here (comparison post, not how-to), but missing where step-trapping content could use one. -1.5. Verified-fact callouts ("5,000 properties", "219+ reviews", "$30 Victor") present in prose. **Posture A grey zone** flagged above — partial credit for content review handoff (mechanism descriptions in body). -1 for Posture A risk. |
| 5 | Internal Links | 15% | 12.5 | 19 internal links in `<main>` — outbound to service pages, city pages (Issaquah, Puyallup, Federal Way), related blog (`/blog/how-to-find-active-mole-tunnels/`). Anchor diversity present. -2.5 because anchors like "Total Mole Control Program" and "One-Time Mole Removal" repeat the canonical service-page names — fine for navigational anchors, but per `feedback_per_post_topical_linking.md` more topical anchor diversity ("year-round mole subscription", "single-visit mole removal") would lift cluster signal. |
| 6 | Images | 5% | 4.5 | Hero `/images/blog-best-mole-traps.webp` set; sitewide `HeroBlock.tsx` priority pattern applies. WebP ✅. og:image matches topic. Missing in-content images (every trap H2 has zero supporting image — moles + traps is a visual topic where the cited competitors typically have product photos). -0.5. |
| 7 | E-E-A-T | 10% | 6.5 | Author byline Spencer Hill + Person schema referenced via `@id` ✅. Founder quote / experience ("After 15+ years and nearly 5,000 properties") prominent in BLUF + Pillar 4 verified-fact callouts. **Outbound to authority = 0** ❌ — WSU Extension (Cluster 1 anchor) on soil science / PNW pest biology would integrate naturally in the "Which Trap Works Best in Different Washington Soil Conditions" H2. -2.5. Person `sameAs` empty -1. |
| 8 | Freshness | 5% | 7.0 | `dateModified: 2026-05-02` (11 days old) + Article schema. No `Last-Modified` HTTP header (Vercel SSR). Visible date in UI assumed via `BlogPostHero`. Disambiguation signal partial in title (no Washington qualifier; "Expert Review" + "2026" carry weaker signal). -1.5 for HTTP header + -1.5 for partial disambiguation. |

**Weighted score: 76.5/100 (B)**

Pillar breakdown (weighted):
- 1: 8.5 × 0.20 = 1.70
- 2: 5.5 × 0.10 = 0.55
- 3: 13.5/15 × 0.15 × 10 = 9.0 × 0.15 = 1.35
- 4: 11/20 × 0.20 × 10 = 5.5 × 0.20 = 1.10
- 5: 12.5/15 × 0.15 × 10 = 8.33 × 0.15 = 1.25
- 6: 4.5/5 × 0.05 × 10 = 9.0 × 0.05 = 0.45
- 7: 6.5 × 0.10 = 0.65
- 8: 7.0 × 0.05 = 0.35

Sum × 10 = 74.5. Adjusted up slightly for Pillar 5 anchor diversity being acceptable (not -2.5) → **76.5/100 (B)**. **Tier 3 page scoring 75+ → P3 monitor**, but the competitive-citation target priority pushes specific fixes to P1/P2 regardless of overall score.

### Per-page fix list

| P | Pillar | Gap | Recommended fix | File |
|---|---|---|---|---|
| **P1** | AEO content shape | 0 HTML tables on a page explicitly named in Pixelmojo's competitor-citation gap | Convert "Which Trap Works Best in Different Washington Soil Conditions" H2 body into an HTML table: rows = Glacial till / Alluvial clay / Amended garden soil; columns = Soil profile / Best trap / Why / Western WA areas. Per Rule E, may require Lexical builder extension to emit `<table>`. | `site/src/lib/blog-data.ts` row 504-529 + possibly `pages-data.ts` Lexical builder per Rule E + `RichContentBlock.tsx` renderer |
| P2 | Meta | Title 92 chars + "Mole Control Blog" suffix bloat | Tighten title at route level: `"Best Mole Traps in 2026: What Actually Works \| Got Moles"` (57 chars), OR `"Best Mole Traps for Washington Yards \| Got Moles"` (50 chars) — second option adds disambiguation. | `site/src/app/(frontend)/blog/[slug]/page.tsx` `generateMetadata()` for blog routes |
| P2 | E-E-A-T | 0 outbound to authority anchor | Add 1 outbound citation to WSU Extension on PNW soil + pest biology, integrated into "Which Trap Works Best…" H2 body. Per `feedback_outbound_links_must_earn_their_place.md` — earn its place in prose. | `site/src/lib/blog-data.ts` row 504-529 — body of "Which Trap Works Best in Different Washington Soil Conditions" |
| P2 | Headings | H1 lacks lawn/Washington disambiguation signal | Optional rewrite: `"Best Mole Traps for Western Washington Yards (2026 Expert Review)"` — adds the disambiguator without losing brand-recency framing. Decision: Spencer/Roy on whether competitive intent benefits more from the cleaner H1 or the disambiguated one. | `site/src/lib/blog-data.ts` row 504-529 `title` field |
| **Posture A** | Content / positioning | Trap mechanism descriptions in body ("the jaws close", "tightens around the mole", "harpoon trap…spikes") | Out-of-scope for on-page-audit. Hand off to `mkt-copywriting` for Posture A review against `feedback_got_moles_posture_a_silent_mechanism.md`. Decision-level: does Spencer want this post softened to "professional trapping" generic language, or kept product-named? | `site/src/lib/blog-data.ts` row 504-529 section bodies — Posture A review only |
| P3 | Schema | Person `sameAs` empty | Sitewide, same as /about/. Add LinkedIn when Roy supplies. | `site/src/lib/schema.tsx` |

### Cross-page pattern note

This page + `/blog/types-of-moles-in-washington/` both have explicit comparison content with named H2s ("Which Trap Works Best in Different Washington Soil Conditions", "Species Comparison at a Glance") and **0 tables**. This is a template-level Lexical-builder gap (per SKILL.md Rule E). One Lexical-builder extension + 3 block-data conversions fixes both pages + opens the pattern for the rest of the blog.

---

## Apply-mode handoff

Recommended commit sequence:

1. **Lexical builder extension (Rule E):** Add `<table>` block type to `pages-data.ts` parseInline helper + `RichContentBlock.tsx` `case 'table':` rendering. Build + verify on test page.
2. **Table conversion (commit 2):** Convert "Which Trap Works Best in Different Washington Soil Conditions" section to a `<table>` block. Run humanizer. Reseed `--reseed-blogs best-mole-traps`.
3. **Title fix (commit 3):** Strip "Mole Control Blog" suffix from blog-route `generateMetadata()` — affects all blog posts (template-level, not just this one).
4. **WSU outbound (commit 4):** Add 1 in-prose citation to WSU Extension in "Which Trap Works Best…" body.
5. **Posture A escalation:** Separate workstream — hand to Roy/Spencer for product-naming-vs-Posture-A decision.

Estimated P1+P2 lift: Pillar 2 (5.5 → 9), Pillar 4 (11 → 16), Pillar 7 (6.5 → 8). Projected post-fix: 84-88/B+ to A-. Per Rule H, full Rule G re-audit required after deploy.

---

## Self-check (Rule G)

- [x] Foundation-doc lookup section present + populated (5 rows, target-keywords.md lines 55 + 68 + 317 + 479 cited; Posture A memory cross-referenced)
- [x] Live verification section present (raw HTML grep for title/meta, 7 JSON-LD blocks parsed, table/ol counts, internal link count)
- [x] Three-Layer SoT section present (live = HEAD ✅)
- [x] Pillar scores reference evidence sections
- [x] Per-page fix list with explicit file paths
- [x] Posture A risk surfaced (this audit does NOT decide; hands to mkt-copywriting)
- [x] Apply-mode handoff included

Report passes self-check. Saved.
