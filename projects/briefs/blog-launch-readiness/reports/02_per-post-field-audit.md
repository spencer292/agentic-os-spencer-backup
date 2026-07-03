# Phase 2 — Per-Post Field Audit

**Date:** 2026-04-24 (after Phase 1 URL fixes applied)
**Source:** Live Payload DB query against `blog_posts` table

## Universal gaps (all 34 posts)

| Gap | Impact | Phase to fix |
|---|---|---|
| `seo_meta_title` empty on all 34 | Browser `<title>` tag falls to template — SEO weak per-post optimisation | Phase 3 (per-post generation) |
| `featured_image_id` NULL on all 34 | No CMS-linked hero. 19 have static fallback paths in `blog/page.tsx:24-44`; 15 legacy-root have zero fallback | Phase 4 (viz-nano-banana per post) |

## Fields currently complete (all 34 posts)

- `title` ✓
- `slug` ✓ (urlPattern now correct after Phase 1)
- `excerpt` ✓ (verify length per post in Phase 3)
- `publishDate` ✓
- `author_id` ✓
- `seo_meta_description` ✓
- `seo_primary_keyword` ✓
- `keyword_cluster` ✓
- `body` ✓ (content present, quality varies)

## Word count distribution

| Band | Count | Posts |
|---|---|---|
| Cornerstone (≥1,500 wc) | 5 | how-to-get-rid-of-moles (1522), mole-vs-vole-vs-gopher (1822), types-of-moles-in-washington (1712), what-do-moles-eat (1659), best-mole-traps (681 — close) |
| Medium-strong (700-1,000 wc) | 11 | how-to-choose-a-mole-control-company (829), how-many-babies-do-moles-have (852), are-moles-poisonous-or-venomous (819), do-moles-bite (807), how-deep-do-moles-dig (801), are-moles-nocturnal (795), can-moles-swim (797), what-eats-moles (795), what-attracts-moles-to-your-yard (787), how-many-eyes-do-moles-have (781), how-to-get-rid-of-ground-moles-with-vinegar (773) |
| Medium (600-750 wc) | 8 | do-moles-live-in-groups (739), are-moles-blind (724), why-do-moles-make-molehills (691), best-mole-traps (681), what-do-mole-holes-look-like (675), do-moles-carry-diseases (626), is-a-mole-a-rodent (605), does-grub-control-stop-moles (598) |
| Thin (<500 wc) | 10 | how-long-do-moles-live (360), how-to-find-active-mole-tunnels (333), are-moles-good-for-your-yard (315), do-mole-repellents-work (426), diy-vs-professional-mole-control (370), humane-mole-removal (345), mole-removal-cost-washington (251), monthly-vs-one-time-mole-control (271), why-moles-keep-coming-back (265), when-are-moles-most-active-washington (264), mole-control-safe-for-pets (233) |

## Content uplift scope per segment

| Segment | Posts | Current WC | Target WC | Effort per post |
|---|---|---|---|---|
| **CREATE-NEW** (from Phase 1) | 1 | 0 | 1,000+ | ~45-60 min full write |
| **THIN uplift to cornerstone tier** | 10 | ~300 avg | 1,500+ | ~60-90 min full rewrite |
| **LEGACY-ROOT GEO refresh** | 15 (13 already in DB as legacy-root, 1 flipped from blog in Phase 1) | ~750 avg | 1,000-1,200 | ~20-30 min expand |
| **MEDIUM standard polish** | 3 | ~650 avg | 1,200+ | ~30-45 min expand |
| **CORNERSTONE GEO audit + polish** | 5 | ~1,500 avg | 1,500+ | ~15-20 min polish |

## Content structural gaps (to be verified per post during Phase 3)

Can't be audited programmatically from DB fields alone — needs per-post body inspection:

- [ ] Answer-first BLUF paragraph (AI-extractable first 100 words)
- [ ] FAQ block with 3-5 Q&A pairs (FAQ schema eligibility)
- [ ] Internal links to ≥3 related blog posts
- [ ] Internal links to ≥1 city page
- [ ] Internal links to ≥1 service page
- [ ] Bullet-list summaries for key facts (AI extractability)
- [ ] Citation-worthy stat with source (.gov, Wikipedia, academic, or Got Moles CRM)
- [ ] WA-specific geographic context (Townsend's mole, county soil, Puget Sound, earthworm 55-93%)
- [ ] Chemical-free / veteran-owned trust signals
- [ ] Definition block populated (DefinedTerm schema)
- [ ] Call-to-action footer (soft — phone + estimate link)

## Field audit next steps

Per-post body inspection happens in Phase 3 during the `mkt-authority-content` pass. Each post archive file in `projects/mkt-authority-content/{YYYY-MM-DD}_{slug}.md` will document:
- Before/after word count
- BLUF presence (yes/no)
- FAQ count
- Internal link count (blog / city / service)
- Citation count
- GEO-WA signals count
- Humanizer score (must be ≥8.0)

## Phase 2 definition of done

✅ Gap matrix complete — see tables above
✅ Content uplift scope confirmed per segment
✅ Priority order matches Phase 3 plan (create-new → thin → legacy → medium → cornerstone polish)

Ready for Phase 3.

---

*Phase 2 complete. No code/DB changes — this is a read-only audit.*
