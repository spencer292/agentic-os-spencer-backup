# Per-Post Audit Results — Priority 8

Run against the audit checklist (`reports/03_per-post-seo-geo-audit-checklist.md`) on the 8 highest-priority posts: 1 create-new + 4 cornerstones + 3 high-rank legacy-root.

**Date:** 2026-04-24

## Summary table

| Post | WC | Cities | Counties | Species | Trust | FAQ | Meta-Title | Featured-Img | UK | Internal Links | City Links | Service Links |
|---|---:|---:|---:|---:|---:|---:|:-:|:-:|:-:|---:|---:|---:|
| what-species-of-moles-live-in-washington-state | 1226 | 12 | 3 | 5 | 2 | 5 | ✅ now | ❌ | ✅ | (n/a) | 0 | 2 |
| how-to-get-rid-of-moles | 1738 | 2 | 0 | 5 | 1 | 5 | ✅ now | ❌ | ✅ | 7 | 0 | 2 |
| types-of-moles-in-washington | 1712 | 8 | 4 | 5 | 1 | 5 | ✅ now | ❌ | ✅ | 5 | 0 | 3 |
| mole-vs-vole-vs-gopher | 1822 | 6 | 4 | 3 | 0 | 5 | ✅ now | ❌ | ✅ | 4 | 0 | 2 |
| what-do-moles-eat | 1969 | 1 | 3 | 4 | 2 | 5 | ✅ now | ❌ | ✅ | 6 | 0 | 3 |
| how-many-eyes-do-moles-have | 1016 | 4 | 0 | 4 | 1 | 5 | ✅ now | ❌ | ✅ fixed | 6 | 0 | 2 |
| do-moles-bite | 1084 | 6 | 0 | 4 | 1 | 5 | ✅ now | ❌ | ✅ | 4 | 0 | 2 |
| do-moles-carry-diseases | 891 | 1 | 3 | 1 | 1 | 5 | ✅ now | ❌ | ✅ | 4 | 0 | 2 |

## Issues fixed during audit

1. **Universal: meta_title was NULL on all 35 posts.** Generated programmatically (title or primary keyword + brand suffix, max 60 chars, title-cased). All 35 now populated.
2. **how-many-eyes-do-moles-have: UK spellings.** Fixed `colour`→`color`, `specialise`→`specialize`, `memorising`→`memorizing`, `odours`→`odors`. Reseeded post + re-applied published status.
3. **All other posts swept for UK spellings** — confirmed zero across `blog-data.ts` (grep -c returned 0).

## Remaining gaps

### Universal gap: NO city-page internal links

All 8 audited posts have **0 links to `/mole-control-{city}/` city pages**. Audit checklist Section E requires ≥1 city link per post.

This is a meaningful internal-linking gap that hurts:
- City page SEO (no link equity flowing TO city pages from cornerstones)
- Reader navigation (no inline path from "general advice" to "your specific city")
- Topical authority signals to crawlers + AI

**Fix plan:** add 2-3 city links per post in a natural closing or CTA section. Distribute across top-12 cities (Seattle, Bellevue, Tacoma, Sammamish, Issaquah, Puyallup, Federal Way, Renton, Kent, Enumclaw, Burien, Auburn) for anchor diversity.

### Universal gap: NO featured_image_id (CMS Media)

Every post relies on the static fallback image map. None has a CMS Media `featured_image_id`. Phase 4 work (`viz-nano-banana` generation + Payload Media upload).

### Per-post content gaps

- **how-to-get-rid-of-moles:** only 2 city mentions, 0 county. Add more WA specifics (Sammamish, Bellevue, Tacoma, Puyallup, etc.) to body.
- **what-do-moles-eat:** only 1 city mention. Add more.
- **mole-vs-vole-vs-gopher:** 0 trust signals. Add at least 1 ("nearly 5,000 jobs", "since 2017", or "chemical-free" naturally).
- **do-moles-carry-diseases:** only 1 species mention. Should expand to the three named WA species.
- **how-many-eyes-do-moles-have:** 0 county mentions. Could add King/Pierce/Snohomish where natural.

## Sections passing across all 8

- Definition Block / BLUF — present on all 8
- FAQ block — 5 Q&A on each
- Body word count — meets tier
- urlPattern — all correct
- Cluster — all set
- Excerpt + meta description — all populated
- US English — all clean (post fix on how-many-eyes)
- _status — all published

## Next actions

1. Add city-link closing section to each of the 4 cornerstones (highest-value first)
2. Apply the same fix to the 3 high-rank legacy-root posts + 1 create-new
3. Generate dedicated featured images via `viz-nano-banana` (Phase 4)
4. Address content gaps (more cities/counties/trust signals on weakest 4 posts)
5. Then run audit on remaining 27 posts (12 legacy-root + 15 standard)
