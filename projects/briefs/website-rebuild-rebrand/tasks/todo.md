# Phase 5 Polish Close-Out — COMPLETE
# Phase 7 Content — Tier 1 Cornerstones COMPLETE
# Internal Link Audit P1 Fixes — ALL 6 DONE

**Last updated:** 2026-04-20 (session 3)
**Project:** website-rebuild-rebrand

---

## Blocks 1–4 status

| Block | What | Status | Commit(s) |
|-------|------|--------|-----------|
| 1 | Schema cleanup (11 blocks — strip cream/blue) | ✅ Done 2026-04-18 | `af39000` |
| 2 | Color adjacency (Homepage, TMCP, Commercial, City) | ✅ Done 2026-04-18 | `f3e8733`, `f35c61a`, `de6e75e` |
| 3 | About CRO fixes (76→80) — testimonial + stats + rename | ✅ Done 2026-04-19 | `13b9cd1` |
| 4 | Brand `og-default.webp` | ✅ Done 2026-04-19 | `39dbc49` |

**Bonus picks (not in original 4-block plan):**
- Homepage + FAQ heroes — both swapped off generic `hero-lawn` → unique shots (0971 / 0987). ✅ Done 2026-04-19, commit `6089a9c`.

---

## Tier 1 Cornerstones — 4 of 4 COMPLETE

| # | Title | Primary Keyword | Volume | Status |
|---|-------|----------------|--------|--------|
| 1 | How to Get Rid of Moles in Your Yard | how to get rid of moles | H | ✅ 2026-04-19 (`429971f`) |
| 2 | Mole vs Vole vs Gopher | mole vs vole vs gopher | M | ✅ 2026-04-20 (`e269387`) |
| 3 | What Do Moles Eat? | what do moles eat | H | ✅ 2026-04-20 (`b830e87`) |
| 4 | The 3 Mole Species in Washington State | types of moles Washington state | L (GEO goldmine) | ✅ 2026-04-20 (`c384c57`) |

Blog count: 15 → 19.

---

## Remaining Phase 5/7 items (all unblocked)

| Item | Effort | Needs |
|------|--------|-------|
| Tracking IDs install (GA4 / Meta Pixel / Google Ads) | ~15 min | 3 env vars in Vercel from Roy — **NOT Spencer-blocked** |
| About staging verification (team photo swap from `b71a729`) | ~5 min | Roy eyeball on `project-pf8c6.vercel.app/about` |
| Methodology fixes (5-item list from brief line 130) | ~1 hr | — lower priority |

## Still blocked (third-party)

- SiteSettings logo/address/hours/GBP URLs — Spencer
- Jobber contact form wire — Spencer API key
- Shadow pages (24) — Ian sign-off
- Design unification final sign-off — Moni
- County hub pages (5) — Roy scope decision

---

## Internal Link Audit P1 Status — ALL 6 DONE

| # | Fix | Status |
|---|-----|--------|
| 1 | In-content links across 19 blog posts | ✅ `c258c31` — 2-3 markdown links per blog body, seed.ts parser + `--reseed-blogs` flag |
| 2 | Services cross-link each other | ✅ `04b0719` — featureGrid "Also Consider" on all 3 service pages |
| 3 | Service pages → city links | ✅ `04b0719` — 12-city serviceArea on all 3 services with exact-match anchors |
| 4 | How-It-Works → 3 services | ✅ `04b0719` — "Choose Your Got Moles Service" featureGrid |
| 5 | Reviews → services | ✅ `04b0719` — "Services Our Customers Review" section in reviews/page.tsx |
| 6 | Case Studies → services | ✅ `04b0719` — "Learn More" featureGrid with Commercial prioritized |

## Skill upgrades (session 3)

- `str-internal-links` — Added Apply-Fixes mode. Can now execute the fix list from a prior audit directly (block-level cross-links + in-content blog body link injection + reseed).
- `ops-blog-pipeline` — Added Step 4b "Inject Internal Links" so every NEW blog ships with 2-3 links on day one. Baked the topic → service mapping, cluster → sibling blog mapping, city-mention → city page rules.

## Next obvious work

**Structure (unblocked, priority order):**
- **P1 Fix #1 — in-content blog links**: enhance `sectionsToLexical` in seed.ts to parse markdown `[text](url)`, add 2-3 links per blog across 19 posts, write blog reseed flow. ~2-3 hrs focused session.
- P2 audit fixes: nearby-city links 2 → 5-6 per city, "Back to Blog" breadcrumb, blog cross-links, anchor text cleanup on city-service links.
- Phase 6 validation sweep: mobile audit, CWV, schema validation, 291-redirect spot-check. Read-only. ~1.5-2 hrs.

**Content (unblocked):**
- Tier 2 myth-busting (~3 posts): Sonic Repellers, Castor Oil, 10 Mole Myths. Grub Control already shipped.
- Tier 3 safety/concern (~4 posts): Foundation damage, Trapping legal in WA, Are Moles Dangerous, Dog Ate Mole Poison.
- Tier 4+ practical guides, decision-stage, deep knowledge — see `projects/briefs/mole-content-authority/content-plan.md` for full queue.

**Launch readiness:**
- Once tracking IDs + Jobber API key arrive → Phase 6 validation → DNS switch pending only Ian's sign-off on shadow pages.
