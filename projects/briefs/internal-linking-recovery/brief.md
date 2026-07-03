---
project: internal-linking-recovery
status: active
level: 2
created: 2026-05-05
parent: got-moles-marketing-os
---

# Got Moles Internal Linking Recovery

L2 project. Restore internal linking density and topical signal across got-moles.com to recover from the post-launch GSC drop (~30% impressions, sitewide position slip 4-5 → 6-7 average).

## Why this is happening

Wayback content-diff vs current live (2026-05-05) confirmed:
- **-75 internal links per blog post** (~117 → ~42)
- **-111 internal links on homepage** (~151 → ~40)
- **Schema downgrade per blog post:** lost LocalBusiness, Person, ImageObject, WebSite (kept Organization, BlogPosting, BreadcrumbList, gained FAQPage + DefinedTerm)
- **Homepage H1 changed** from keyword-targeted "Mole Control Seattle" to brand-only "Your Lawn Deserves Better Than Moles"

GSC daily chart shows clicks held but impressions dropped 30% and average position slipped 1.5-2 places sitewide post 2026-04-20 cornerstone deploy. Internal-link density is the primary cause; schema downgrade is secondary.

## Source documents

- **Strategy (canonical):** `got-moles-internal-linking-strategy.md` — Roy's authoritative plan. Read end-to-end before any work.
- **Audit:** `clients/got-moles/projects/str-internal-links/2026-04-16_got-moles-audit.md` — pre-launch internal-links audit (score 41/100). Most P1/P2 fixes never shipped.
- **Drop analysis:** `clients/got-moles/projects/str-ai-seo-local/2026-05-05_gsc-drops-v2.md`
- **Content diff:** `clients/got-moles/projects/str-ai-seo-local/2026-05-05_content-diff.md`
- **Slug review:** `clients/got-moles/projects/str-ai-seo-local/2026-05-05_slug-review-table.md`

## Goal

Execute Roy's internal-linking strategy across got-moles.com so:
1. Internal-link density per blog post returns to ~6-12 contextual links (per strategy §7)
2. Internal-link density per location page reaches ~5-8 contextual links
3. FAQ has 10-15 deep links to relevant blog/service content
4. Sitewide rank recovers to pre-Apr-20 baseline
5. New `str-internal-links` audit scores ≥75/100 (up from 41)

## Constraints (non-negotiable)

- **Per-post surgical editorial linking, NOT template footer dumps.** See `feedback_per_post_topical_linking.md`. Strategy §5.1 + §6 explicit on this.
- **Anchor diversity matters more than link volume.** Mix branded / exact-match keyword / partial / generic per strategy §6.
- **Preserve indexed URLs.** Don't redirect away from any URL with historical clicks. Slug changes ONLY restore old WordPress slugs, never invent new ones.
- **Build process discipline.** Per `PAGE-BUILD-REFERENCE.md`: code edits → `npx next build` → reseed if pages-data.ts changed → push mine main → verify staging. Templates auto-deploy. CMS richText needs reseed.
- **No Posture A violations.** Per `feedback_got_moles_posture_a_silent_mechanism.md`: silent on body-gripping/scissor/harpoon/spear mechanisms in any new copy.
- **US English** throughout (per client CLAUDE.md).

## Phases (matches strategy §8)

### Phase 0 — Schema restoration on blog template ✅ DONE

Shipped in commit 817b56c (2026-05-05):
- LocalBusiness schema added to every blog post via `BlogPostContent.tsx`
- Person schema added to every blog post
- ServiceCards card titles updated with "Mole Control" keyword anchors

The 24-city territorial block in the same commit was REVERTED (next commit) — wrong implementation per strategy §5.1 + `feedback_per_post_topical_linking.md`.

### Phase 1 — Highest impact (strategy §8 Phase 1)

**A. FAQ deep links (strategy §5.4)**
Edit FAQ richText answers in `pages-data.ts → faqBlocks` to link to relevant blog posts and service pages. ~10-15 contextual links across the page. Reseed `npm run seed -- --reseed faq`.

**B. Top 10 blog posts get 2-4 location-page links (strategy §5.1)**
Per-post topical mapping. Edit blog content via CMS or blog-data.ts (verify which is canonical for live posts). Apply to:
1. How to Choose a Mole Control Company → Service Areas hub
2. What Attracts Moles to Your Yard → Sammamish, Bellevue, Kirkland
3. When Are Moles Most Active → Puyallup, Tacoma, Auburn
4. Why Do Moles Keep Coming Back → Sammamish, Mill Creek, Ravensdale
5. Mole vs Vole vs Gopher → Federal Way, Kent, Auburn
6. How Deep Do Moles Dig → Enumclaw, Bonney Lake, Graham
7. What Do Moles Eat → Bellevue, Kirkland, Redmond
8. Does Grub Control Stop Moles → Seattle, Tacoma, Olympia
9. Mole Removal Cost Washington → TMCP + One-Time service pages
10. Monthly vs One-Time Control → TMCP + One-Time

**C. All 92+ location pages get 3-5 blog links (strategy §5.2)**
Programmatic via `city-data.ts` + `[citySlug]/page.tsx` since cities are data-driven (per the runbook footgun about city-pages collection). Use the archetype mapping:
- Eastside cities → "What Attracts Moles", "Why Moles Keep Coming Back"
- Valley cities → "When Are Moles Most Active", "How Deep Do Moles Dig"
- Waterfront/high-moisture → "What Attracts Moles", "Can Moles Swim"
- Urban → "Mole vs Vole vs Gopher", "What Do Mole Holes Look Like"
- Rural/acreage → "How Many Babies Do Moles Have", "Are Moles Good for Your Yard"

### Phase 2 — Strong impact (strategy §8 Phase 2)

D. Within-cluster blog cross-linking (strategy §5.6) — every biology post links to 2+ other biology posts, every safety post to other safety posts, etc. Per-post body edits.
E. "Related Articles" section per blog post (strategy §3 Gap 8). Template-level addition to `BlogPostContent.tsx`. Already partially exists as `RelatedPosts` component — enrich.
F. "Nearby Service Areas" section bump on location pages — already done at 6/page pre-launch (verified during this session).

### Phase 3 — Refinement

G. About page contextual links (strategy §5.5) — Spencer's narrative gets contextual links to How It Works, TMCP, key locations.
H. Reviews page → service + city links (strategy §5.7).
I. Anchor text variety audit across all internal links.
J. Documented monthly maintenance per strategy §9.

## Acceptance criteria

- [ ] Phase 1A: FAQ has 10-15 contextual deep links rendered on `/faq/`
- [ ] Phase 1B: Top 10 blog posts each have 2-4 in-content location links per strategy §5.1
- [ ] Phase 1C: All 92+ city pages each have 3-5 contextual blog links per archetype mapping
- [ ] Phase 2D: Every blog post within a cluster links to ≥2 other posts in the same cluster
- [ ] Phase 2E: Every blog post has a "Related Articles" section with 3-4 cluster-matched posts
- [ ] Phase 3G: About page has 5-8 contextual links (Spencer narrative + How It Works + TMCP)
- [ ] Phase 3H: Reviews page has 5-10 contextual links to service + city pages
- [ ] Anchor text variety: no anchor used >5x sitewide (audit pass)
- [ ] Re-run `str-internal-links` audit scores ≥75/100
- [ ] GSC 30-day post-deploy: clicks ≥25/day, impressions ≥4,500/day
- [ ] Schema render check: every blog post shows LocalBusiness + Person + BlogPosting + FAQPage + DefinedTerm + BreadcrumbList + Organization

## Open questions / dependencies

1. **Where do live blog posts actually live?** The runbook says blog posts are seeded via `seed.ts` in "all mode only, 7 posts" but production has 35. Need to confirm whether blog content edits go via `blog-data.ts` + reseed, or directly via Payload CMS admin. Affects Phase 1B implementation path.
2. **City pages render path footgun.** Per `PAGE-BUILD-REFERENCE.md`, the `city-pages` Payload collection is unused — public route reads from `city-data.ts` directly. So Phase 1C is data-file edits + push, no reseed.
3. **Homepage H1 change** — strategy doesn't explicitly address but content-diff flagged it. Separate sub-decision: keep brand H1 + add keyword H2, or revert H1 to keyword-rich. Not in scope of this brief; deferred.

## Reversibility

Every phase is a single-commit revert. Worst case: revert the most recent commit, traffic returns to current state. No destructive data changes (no slug deletes, no CMS data wipes).
