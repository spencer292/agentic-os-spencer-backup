---
project: internal-linking-recovery
type: architecture-spec
created: 2026-05-24
status: APPROVED 2026-05-24 (Roy) — ready for implementation from clients/got-moles workspace
priority_cities: [seattle, tacoma, bellevue, kent, renton, federal-way, puyallup, everett, olympia, kirkland]
grounded_in:
  - GSC 2026-02-23→05-23 (sc-domain:got-moles.com) — top pages + queries
  - 2026-05-23 internal-links audit + full inbound sweep
  - Roy's model (2026-05-24): every blog + location page must pass SEO value AND customers to the 3 money pages; build for the future
---

# Got Moles — Internal Linking Architecture

A durable rule set for how link equity and visitors flow through got-moles.com. Designed to be
enforced at the **template level** so every current *and future* page complies automatically.
This is the spec. Implementation follows approval.

## The objective (Roy's model)

Every blog and every location page does two jobs for the **3 money pages**:
1. **Pass SEO value** (link equity) toward them.
2. **Pass customers** toward them.

Money pages, in priority order: **TMCP** (Total Mole Control Program — highest LTV) → **One-Time
Removal** → **Commercial**.

## What the data says (so we don't build on assumptions)

- **The authority lives in informational blogs.** Top organic pages are mole-biology content:
  how-deep-do-moles-dig (37.7k impr), how-many-eyes (61.9k impr), voles-vs-moles (49.8k),
  what-do-mole-holes-look-like (30.1k), do-moles-bite (24.7k). They rank positions 2–5.
- **The commercial pages don't rank.** Homepage pos ~19; city pages pos 20–60; **no money page in
  the top 60.** Blog traffic is national + informational — most won't convert.
- **Two honest implications:**
  - The reliable win is **equity transfer** (helps money pages rank for real buyer queries), not
    routing informational visitors to checkout.
  - Internal links to the money pages **already exist** via templates, yet the money pages still
    don't rank → internal linking is **necessary but not sufficient**. Page-1 commercial rankings
    need **external authority** (separate Half-2 track). This spec is the foundational layer.

## Page-type roles

| Type | Count | Role in the graph |
|---|---|---|
| **Money pages** (TMCP, One-Time, Commercial) | 3 | **Equity sinks** — receive, don't leak. Convert. |
| **Homepage** | 1 | Top hub → money pages + cornerstone + service-areas. |
| **Location pages** | 92 | Dual: commercial *targets* (want to rank) AND *distributors* to money pages. |
| **Blog/info pages** | 34 | **Authority reservoirs** — distribute equity to money pages + priority cities + cornerstone. |
| **Supporting hubs** | — | service-areas, blog index, FAQ, reviews, about, how-it-works, author. Route equity, don't trap it. |

## The rules

### R1 — Every content page declares ONE primary money page
A `primaryMoneyPage` field on each blog + city (data layer the templates read):
- **Blogs:** by topic — TMCP for ongoing/prevention/recurrence topics; One-Time for removal/cost/how-to;
  Commercial for B2B. **Default: TMCP.**
- **Cities:** TMCP primary (highest LTV), One-Time + Commercial secondary.
New pages set this field once and inherit the whole linking behaviour.

### R2 — Money-page links must be PROMINENT, not just boilerplate
The equity upgrade. Today's money links sit in a low template block (weak weight). Rule:
- A **contextual link to the page's primary money page, high in the body** (within the first third),
  with a descriptive offer anchor.
- The existing bottom "all 3 services" block stays as the catch-all.
- Contextual + high placement passes materially more equity than a sitewide footer-style block.

### R3 — Authority reservoirs feed the commercial layer
The highest-authority blogs (rank by GSC impressions, refreshed quarterly) link to:
- their **primary money page** (prominent, R2), **+**
- **2–3 priority commercial city pages** (see R6 — the concentrate-don't-spread rule), **+**
- the **cornerstone** ("how to get rid of moles in your yard").

### R4 — Location pages pass equity + a clear path to money
Each city page (template-enforced): all 3 money pages (ServiceCards ✓) + **primary-money emphasis**
(R2) + 6 nearest cities (proven +7%, keep) + service-areas hub. No blanket footer city dumps.

### R5 — Hub-and-spoke integrity
- **Cornerstone** is the content hub: every blog links up to it; it links prominently to the 3 money
  pages. Target ≥8 inbound from spokes.
- **Homepage** → 3 money pages (✓) + cornerstone + service-areas.
- **service-areas** → all cities (✓).
- **Money pages stay tight** — link to each other + cities + FAQ; at most 1–2 supporting authority
  blogs for topical proof. Do not leak to dead-ends.

### R6 — Concentrate equity; don't spread it across 92 weak cities
All 92 cities rank 20–60. Spreading reservoir links evenly moves nothing. Concentrate authority-page
links on the **priority subset** until they reach page 1, then rotate the next tier in.
**Priority cities (APPROVED 2026-05-24):** Seattle, Tacoma, Bellevue, Kent, Renton, Federal Way,
Puyallup, Everett, Olympia, Kirkland. Each authority blog links to the 2–3 of these most topically/
geographically relevant to it (not all 10).

### R7 — Anchor rules
Descriptive + varied. Money anchors carry the offer ("year-round mole protection", "one-time mole
removal", "commercial mole control"). City anchors carry geo+service. Never "click here / learn
more". No identical anchor >5× sitewide (interpolate city/topic where templated). Apply the
lawn-signal disambiguation rule (never bare "mole removal").

### R8 — Template enforcement (the future-proof core)
- **Blog template** (`BlogPostContent`): reads `primaryMoneyPage` → renders prominent contextual
  money CTA high + 3-money block low + author byline link (`/author/spencer/`) + cluster RelatedPosts.
- **City template** (`[citySlug]`): ServiceCards (3 money) + primary-money emphasis + 6 nearby +
  (priority cities only) reservoir/cross links.
- Result: a new blog or city written next year inherits correct equity flow by setting one field.

## What NOT to do (lessons banked)
- No blanket footer city-link blocks (anchor spam to crawlers).
- Don't over-engineer visitor routing for informational/national blog traffic — it won't convert;
  optimise for equity + the small WA slice.
- Don't spread reservoir links across all 92 cities (R6).
- Don't let money pages leak equity to low-value pages.

## Honest ceiling
This architecture is the **foundational layer**. It will strengthen the equity the money + priority
city pages receive and make the structure self-maintaining. It will **not, alone, lift a position-60
page to page 1** — that needs the **Half-2 external authority track** (`str-authority-strategy`:
backlinks, brand mentions, citations) + on-page strength. Sequence: ship this foundation, then
external authority, measured in GSC.

## Implementation phases (APPROVED — execute from clients/got-moles workspace)

Each phase: edit → `npx next build` (must pass, no staging) → Roy sign-off → `git push mine main`
(LIVE, US off-hours) → verify on got-moles.com → revert-on-break. Commit per phase.

**Phase 0 — Hygiene baseline first (GSC-driven, cheap, protects equity).**
Investigate the GSC duplicate/legacy URLs before adding links (no point pumping equity into a graph
with leaks):
- Trailing-slash duplicates both indexed (`/do-moles-bite/` vs `/do-moles-bite`, `/what-do-mole-holes-look-like/` vs no-slash, etc.) — confirm canonical + 301 the non-canonical.
- Legacy URLs still getting clicks (`/our-process/`, `/about-us/`, bare `/des-moines/`, `/bothell/`, `/lake-stevens/`, `/olympia-mole-exterminator/`, `/mole-trapping-olympia/`, `/mole-control-edgewood-2/`) — verify redirects fire; fix if not.
- `/what-species-of-moles-live-in-washington-state/` still pulling 23 clicks — confirm the 301 to `/blog/types-of-moles-in-washington/` actually works live.
- Determine live-vs-historical via a last-14-day GSC pull. Files: `src/lib/redirects.ts`, `next.config.ts`.

**Phase 1 — Data layer (R1).** Add `primaryMoneyPage: 'tmcp'|'one-time'|'commercial'` to the blog +
city data shapes. Populate: cities → `tmcp`; blogs by topic (default `tmcp`, removal/cost → `one-time`,
B2B → `commercial`). Files: `src/lib/blog-data.ts`, `src/lib/city-data.ts` (+ interfaces).

**Phase 2 — Template enforcement (R2/R8) — the future-proof core.**
- `BlogPostContent.tsx`: render a prominent contextual money CTA after the first content section,
  pointing at the post's `primaryMoneyPage` (varied offer anchor); keep the bottom 3-money block;
  add `/author/spencer/` byline link. Needs `--reseed-blogs all`.
- `[citySlug]/page.tsx`: add primary-money emphasis (ServiceCards already renders all 3). No reseed.
- This makes every current + future page compliant by data alone.

**Phase 3 — Reservoir links (R3/R6).** Top ~10 blogs by GSC impressions (how-deep-do-moles-dig,
how-many-eyes, what-do-mole-holes-look-like, do-moles-bite, voles-vs-moles, do-moles-carry-diseases,
what-eats-moles, is-a-mole-a-rodent, when-are-moles-most-active, how-to-get-rid-of-...-vinegar) get a
prominent in-content link to their primary money page + 2–3 of the 10 priority cities most relevant
+ cornerstone. Per-post body edits in `blog-data.ts` → `--reseed-blogs`.

**Phase 4 — Hub + anchor hygiene (R5/R7).** Cornerstone inbound ≥8; anchor diversity pass (rotate
exact-repeat service anchors); homepage → cornerstone link.

**Phase 5 — Measure + handoff to external authority.** GSC money + priority-city positions at
30/60/90 days. Then scope the Half-2 `str-authority-strategy` track — the lever that actually moves
position-60 pages to page 1.

### Prior Phase 1C (city→blog) — DECISION
The drafted city→blog code (`city-data.ts` `cityArchetype`/`getCityBlogLinks` + the `[citySlug]`
"Learn About Moles" block) is **superseded** by this architecture (city→blog sends weak city equity
to blogs that don't need it). It's uncommitted on disk. **Recommendation: revert it** so the working
tree is clean for the new direction (the 92-city archetype data can be re-derived if ever needed).
Confirm with Roy at implementation start.

## Deploy discipline (unchanged)
Run from the `clients/got-moles` workspace. `git push mine main` = LIVE production, no staging →
`npx next build` must pass; Roy sign-off; US off-hours; revert-on-break; no Vercel CLI. City pages
read `city-data.ts` directly (no reseed); blog body changes need `--reseed-blogs`.

## Status of prior in-flight work
- **Phase 1C (city→blog) code is drafted on disk** (`city-data.ts` + `[citySlug]/page.tsx`),
  type-clean, not shipped. Under this architecture it's **lower priority** (city→blog sends weak
  city equity to blogs that don't need it). **Decision pending:** keep for topical-depth/navigation
  value, or revert. Recommend revert or hold until R2/R3/R8 land.
