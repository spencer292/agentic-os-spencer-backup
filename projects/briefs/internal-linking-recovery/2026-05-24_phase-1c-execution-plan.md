---
project: internal-linking-recovery
type: execution-plan
created: 2026-05-24
status: ready to build (run from clients/got-moles workspace)
run_from: C:\Claude\agent-os\clients\got-moles   # cd here && claude — NOT the repo root
supersedes_premise_in: 2026-05-23_power-to-money-link-plan.md (premise corrected by audit)
audit: clients/got-moles/projects/str-internal-links/2026-05-23_got-moles-audit.md
---

# Phase 1C Execution Plan — City → Blog Internal Links

**Run this from the Got Moles workspace** (`cd C:\Claude\agent-os\clients\got-moles && claude`),
not the agent-os root. The site files are shared on disk, but the client session loads the
client CLAUDE.md (US-English, Notion review, deploy rules) + client memory/learnings.

## What the 2026-05-23 audit established (read first)

Re-audit scored **75/100** (up from 58). The 2026-05-23 power-to-money premise was **half wrong**:

- ✅ **Blog/info "power pages" already funnel to money pages** — all 32 posts link TMCP/One-Time/
  Commercial + cities. Funnel-to-money is solved. Plan's "Phase B" is redundant.
- ✅ Service↔service, city→service, city→nearby-city, FAQ→content (16 deep links), Reviews→services.
- ✅ URL canonical hygiene near-perfect (1 mismatch sitewide).
- ❌ **City pages → blog/content = ZERO** ← the real gap (this plan).
- ❌ Homepage → cornerstone/content = none (next P1).
- ❌ Blog → /author/spencer = none, E-E-A-T near-orphan (next P1).

**The leverage is distributing equity from the big reservoirs (homepage 142 top-3; Redmond 85,
Renton 74…) INTO the content cluster — not funnelling to money (done).**

## Phase 1C scope — city → blog

Every city page (92) gets a "Learn About Moles in {City}" block with **4 contextual blog links**:
2 archetype-specific (strategy §5.2) + 2 universal (cornerstone + cost). Anchors interpolate the
city name → every one of ~368 links is unique (passes the sitewide <5× anchor-diversity rule the
audit flagged) and carries a local-relevance signal.

**Archetype → blogs (canonical URLs verified: legacy-root → /{slug}/, else /blog/{slug}/):**

| Archetype (count) | Blog 1 | Blog 2 |
|---|---|---|
| eastside (19) | `/what-attracts-moles-to-your-yard/` | `/blog/why-moles-keep-coming-back/` |
| valley (21) | `/do-moles-hibernate/` (When Active) | `/how-deep-do-moles-dig/` |
| waterfront (13) | `/what-attracts-moles-to-your-yard/` | `/can-moles-swim/` |
| urban (21) | `/voles-vs-moles-whats-the-difference/` | `/what-do-mole-holes-look-like/` |
| rural (18) | `/how-many-babies-do-moles-have/` | `/blog/are-moles-good-for-your-yard/` |

Universal (all): `/how-to-get-rid-of-moles-in-your-yard/` (cornerstone) + `/blog/mole-removal-cost-washington/`.

## CURRENT STATE — code already drafted (review before building)

Edits are **applied on disk** (same repo, shared with root). **Type-check clean.** NOT built,
committed, or pushed.

1. `site/src/lib/city-data.ts` — appended:
   - `export type CityArchetype = 'eastside'|'valley'|'waterfront'|'urban'|'rural'`
   - `export const cityArchetype: Record<string, CityArchetype>` — all 92 cities mapped
     (validated: 92/92 covered, split 19/21/13/21/18, no missing/extra).
   - `export function getCityBlogLinks(slug, cityName): CityBlogLink[]` — returns the 4 links.
2. `site/src/app/(frontend)/[citySlug]/page.tsx` — added `getCityBlogLinks` import + a new
   `<Section background="grass">` "Learn About Moles in {cityName}" before `<CTABlock>`
   (grass keeps the grass-alt→grass alternation and ends-in-grass before the CTA).

**Decision needed from Roy:** keep these drafted edits and have the GM-session build+ship them, OR
revert and rebuild from scratch in the client session. (Edits are correct + additive; keeping them
saves a rebuild.)

## Deploy discipline — CRITICAL (per BUILD-METHODOLOGY)

- **`git push mine main` = LIVE PRODUCTION (got-moles.com). THERE IS NO STAGING.** The
  PAGE-BUILD-REFERENCE "staging/project-pf8c6" line is stale — BUILD-METHODOLOGY line 172/307 is
  authoritative.
- **`npx next build` MUST pass before any push** — it's the only safety gate (no staging net).
- **No reseed** — city pages read `city-data.ts` directly (PAGE-BUILD-REFERENCE line 49-52 footgun).
- **Human-in-the-loop:** no production push without Roy (+ Spencer) sign-off (line 378).
- Push in a **US off-hours window (UK daytime)**. If it breaks: `git revert HEAD && git push mine main`.
  **NEVER** deploy via Vercel CLI (caused a site-wide 404 on 2026-05-21).
- Commit only the two specific files. Descriptive message referencing the audit + Phase 1C.

## Remaining steps (Phase 1C)

1. `cd C:\Claude\agent-os\clients\got-moles && claude` (run from here).
2. Review the two drafted edits (or revert + rebuild per Roy's decision).
3. `cd …/site && npx next build` → must pass clean.
4. `git add` the two files → commit.
5. Roy approves + picks a low-risk window → `git push mine main` (LIVE).
6. Verify on got-moles.com: spot-check 5 cities (Redmond/Auburn/Seattle/Olympia/Enumclaw — one per
   archetype) render the block with correct city-interpolated anchors + working links. Revert on any breakage.
7. Update the audit `status` + LOG; note the deploy commit.

## ⚠ RE-RANKED 2026-05-24 after the full inbound sweep (do P0 BEFORE Phase 1C)

The full per-page inbound sweep (audit "FULL SWEEP ADDENDUM") found the internal linking is
**lumpy**: the powerhouse `/how-many-eyes-do-moles-have/` (46 top-3) has **1 inbound link**, the
cornerstone has 4, and **8 blog posts have zero editorial inbound**. Phase 1C does NOT fix the
powerhouse pages. So the order changed — feed the winners first (cheaper, higher ROI):

| New priority | Work | Files |
|---|---|---|
| **P0** | Feed reservoirs: within-cluster biology cross-links → `how-many-eyes`, `do-moles-bite`, cornerstone; homepage → cornerstone + how-many-eyes | `blog-data.ts`, `pages-data.ts` homepageBlocks |
| **P0** | Fix the 8 editorial-orphan blogs (within-cluster cross-links) | `blog-data.ts` |
| **P1** | **Phase 1C city→blog** (already coded — see CURRENT STATE) | `city-data.ts`, `[citySlug]/page.tsx` |
| **P1** | Blog → `/author/spencer/` (E-E-A-T byline) | `BlogPostContent.tsx` |
| **P2** | Canonical fix `/blog/are-moles-nocturnal/`→root; anchor diversity on service links | `blog-data.ts` |
| **P3** | About→money; service→content depth; case-studies inbound | `pages-data.ts` |

Target: internal-links audit 72 → ~85+.

**8 editorial-orphan blogs (P0):** how-to-choose-a-mole-control-company, are-moles-good-for-your-yard,
how-long-do-moles-live, is-a-mole-a-rodent, why-do-moles-make-molehills, what-eats-moles,
do-moles-live-in-groups, are-moles-poisonous-or-venomous.

**Half 2 (external authority — separate track):**

**Half 2 (external authority — separate track, NOT in this project):**
- Owned by `str-authority-strategy` (brand mentions, digital PR, citations, entity/Wikidata).
- Internal linking redistributes existing authority; external link building grows the pool.
- Scope as its own brief when Roy is ready.

## Notion
Per client rule, push the audit + this plan summary to Notion (Got Moles Website Rebuild) for the team.
