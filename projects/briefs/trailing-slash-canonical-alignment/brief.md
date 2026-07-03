---
project: trailing-slash-canonical-alignment
status: active
level: 2
created: 2026-05-12
parent: got-moles-marketing-os
related:
  - onpage-audit-sweep
  - internal-linking-recovery
  - paid-search-landing-pages
---

# Trailing Slash + Canonical Alignment — Got Moles

## Goal

Resolve the sitewide URL canonicalization conflict on got-moles.com by aligning Next.js routing, sitemap, canonical link tags, and historical WordPress URL form. Stop the ongoing bleed of ranking signal across slash and no-slash variants. Single-hop redirect chains for all 8 years of historical inbound URLs.

## Problem (one paragraph)

Every URL on got-moles.com has a three-way contradiction: the **sitemap** declares trailing-slash form, the **canonical link tag** declares trailing-slash form, but **Next.js routing** (default `trailingSlash: false`) serves the no-slash form via 308 redirect. Result: every sitemap URL costs Googlebot a 308 hop on every crawl, every historical WordPress URL bleeds through 2-hop chains (`/about-us/` → `/about-us` → `/about`), and Google indexes both URL variants in parallel, splitting click counts across duplicate URLs (per GSC report 2026-05-12). Most damaging: the routing decision was made 2026-05-03 in `redirects.ts` without realizing the sitemap and canonical tags weren't updated to match — the contradiction has been live for 9 days.

## Evidence

### GSC (28 days, 2026-04-13 → 2026-05-10) — `2026-05-12_gsc-comprehensive-report.md`

- 88% of clicks (414/626) anchored on **slash form** URLs
- 9% (41/626) on no-slash variants
- Same-page click ratio favors slash: `/do-moles-bite/` 60 vs `/do-moles-bite` 8 (7.5×); `/do-moles-carry-diseases/` 33 vs 2 (16×); `/how-many-eyes-do-moles-have/` 30 vs 2 (15×)
- GSC report Finding 3 explicitly identifies "URL canonicalization fragmentation" and recommends "audit canonical tags + add 301 redirects from non-slash → slash variants (or whichever variant is canonical)"
- Mobile rank deteriorating 40% in last 14 days (3.14 → 4.40) — likely partly attributable to canonical conflict signals

### Wayback Machine (WordPress historical, 2017-2025)

- WordPress page-sitemap.xml (2025): 191/200 URLs trailing slash (95.5%)
- WordPress city-sitemap.xml (2025): 69/69 URLs trailing slash (100%)
- WordPress homepage internal links (Aug 2025): 75/76 content URLs trailing slash (98.7%)
- 8 years of indexing means external backlinks, GBP citations, customer shares all anchor on slash form

### Current redirect chain analysis (live test, 2026-05-12)

| Historical WP URL | Hops to canonical | After flip |
|---|---|---|
| `/about-us/` | 2 hops (→ `/about-us` → `/about`) | 1 hop |
| `/our-services/` | 2 hops | 1 hop |
| `/city/seattle/` | 2 hops | 1 hop |
| `/mole-trapping-tacoma/` | 2 hops | 1 hop |
| `/are-moles-poisonous-or-venomous/` | 1 hop (slash strip only) | 0 hops (200 direct) |
| `/mole-control-seattle/` (sitemap) | 1 hop | 0 hops (200 direct) |

### Decision documented in `src/lib/redirects.ts` line 113-118 (2026-05-03)

> "Trailing-slash sources removed 2026-05-03: Next.js (trailingSlash: false) strips trailing slashes BEFORE redirect rules fire... Destinations are no-slash for the same reason."

This decision optimized chain length assuming no-slash incoming requests. The Wayback + GSC evidence shows real-world incoming requests are 88-100% slash form. The decision's premise was wrong.

## Recommendation

Set `trailingSlash: true` in `next.config.ts`. Single config line. Aligns reality with declared intent across sitemap, canonical, and routing layers.

## Phases

Sequential. No phase begins until prior phase verified.

### Phase 0 — Decision doc + stakeholder alignment
- Create decision doc capturing: rationale, GSC evidence, Wayback evidence, impact assessment, rollback plan
- Plain-English summary for Spencer (no jargon)
- Update `redirects.ts` header comment to flag the 2026-05-03 decision is being revisited
- **Gate:** Roy approves decision doc. Spencer briefed. Ian (SEO) briefed if available.

### Phase 1 — Branch + isolated config change on staging
- Create branch `slash-canonical-alignment` off `mine/main`
- Single change: add `trailingSlash: true` to `next.config.ts`
- Push branch → Vercel auto-creates preview URL
- Smoke test: 10 sample pages return 200 with slash form, no-slash form 308s to slash, canonical link matches served URL
- **Gate:** Preview deploy succeeds. Sample pages clean. No 500s.

### Phase 2 — Redirect destination audit (no edits)
- Grep all destinations in `src/lib/redirects.ts`
- For each destination, test source→destination chain on preview URL with new config
- Produce a diff plan: "destination X currently `/about`, needs `/about/`"
- **Gate:** Roy reviews diff plan (~30 entries). Approve specific edits.

### Phase 3 — Apply redirect updates
- Mechanical edits per approved Phase 2 list
- Re-test all 291 redirects on preview URL (build gate per BUILD-METHODOLOGY line 141)
- Document validation output (CSV: source URL → status → destination → final canonical)
- **Gate:** All 291 redirects produce 1-hop chains to 200 destinations. Zero 404s. Zero infinite loops.

### Phase 4 — Internal `<Link href>` consistency sweep
- Grep all `<Link href="..."` and bare `href="/..."` usages in `src/`
- Standardize to slash form
- Verify on preview URL — no internal click incurs 308
- **Gate:** Per-page spot-check on top 10 GSC traffic earners (6 informational posts + top 4 city pages)

### Phase 5 — Production deploy + monitoring
- Spencer + Roy explicit sign-off
- Push branch to `mine/main` (production deploy)
- Day 1: monitor Vercel logs for 5xx, monitor GTM Tag Coverage (the original symptom)
- Day 1-7: monitor GSC URL Inspection on top 10 pages
- Day 1-30: track GSC Performance daily for click trajectory on slash vs no-slash variants
- 30-day post-deploy retrospective per BUILD-METHODOLOGY line 179

### Phase 6 — Memory + playbook update
- Add memory entry: `feedback_trailing_slash_canonical` with decision rationale
- Update `redirects.ts` header comment to reflect new decision
- Update PAGE-BUILD-REFERENCE.md if needed
- Log lessons to BUILD-METHODOLOGY.md if process improvements emerged

## Acceptance criteria

- [ ] All 139 sitemap URLs return 200 directly (zero 308 from sitemap)
- [ ] All canonical link tags on rendered pages match the served URL exactly
- [ ] All 291 redirects in `redirects.ts` resolve in 1 hop to a 200 destination
- [ ] Top 10 historical WordPress URLs (per Wayback evidence) reach canonical in 1 hop max
- [ ] Zero internal `<Link href>` causes a 308 hop on first click
- [ ] GTM Tag Coverage report: zero "Not tagged" pages from sitemap-source URLs (excluding intentional 308s for legacy URL cleanup)
- [ ] GSC URL Inspection: top 10 pages show consistent canonical, no "User-declared canonical" mismatch warnings
- [ ] 30-day post-deploy: combined click count for slash + no-slash variants is ≥ pre-deploy combined count

## Risks + mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Day 1 redirect loop | <3% | High (5xx errors) | Phase 1+3 staging tests catch every chain. Rollback = single commit revert (~2 min). |
| No-slash variants lose ranking during reindex | 95% (expected) | ~20-30 clicks at temporary risk over 4 weeks | Equity transfers to slash form via 308. Self-resolves. |
| Mobile rank decline (already trending down) misattributed to flip | 60% | Stakeholder confusion | Track mobile trajectory separately. Decline started before flip. |
| Compounding flux (site only 12 days post-launch) | 30% | Extends recovery window | Document baseline metrics before flip. Monitor trends not snapshots. |
| Edge-case page breaks | <2% | Page-level | Per-page smoke test on staging |

## Rollback plan

Single commit revert + push to `mine/main`. Restores previous state in one Vercel build cycle (~2 min). No data changes, no irreversible actions, no DNS work, no customer-facing artifact changes.

## Dependencies / sign-off chain

| Person | What they approve | Phase |
|---|---|---|
| Roy | Decision doc, redirect diff plan, internal link sweep, production push | 0, 2, 4, 5 |
| Spencer | Plain-English brief acknowledgment, production push | 0, 5 |
| Ian (SEO, if available) | Decision doc review, post-deploy GSC interpretation | 0, 5 |

## Constraints (from playbook + memory)

- **Ask-first on every code change** (`feedback_no_unauthorized_build_actions`) — audit freely, no edits/commits/pushes without explicit go-ahead
- **Per-page review pattern on live sites** (`feedback_per_page_review_pattern`) — audit → present → explain → approve → apply → verify → commit
- **Staging before production** (BUILD-METHODOLOGY line 142, 171)
- **Redirect validation is a build gate** (BUILD-METHODOLOGY line 141)
- **635 #1 keywords must be protected** (BUILD-METHODOLOGY line 134)
- **Notion is the review mechanism** (client CLAUDE.md) — push this brief + status updates
- **US English** throughout (client CLAUDE.md)

## Outputs

This brief + all phase artifacts (decision doc, redirect diff plan, validation CSVs, monitoring snapshots) live in this folder. Code changes land in `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/`. Build session runs from the got-moles client window: `cd clients/got-moles && claude`.

## Workstreams (scoped 2026-05-12 session 1)

| WS | What | Files | Effort | Blocked by |
|---|---|---|---|---|
| **D** | Build verification harness (10-page check) | `scripts/verify-canonical.mjs` new | 30 min | — |
| **A** | Flip `trailingSlash: true` on branch | `next.config.ts` (1 line) | 5 min | D baseline |
| **B** | Redirect destination audit + edits | `src/lib/redirects.ts` (~30 edits) | 1 hour | A on staging |
| **C** | Internal `<Link href>` sweep | `src/components/**`, `src/app/(frontend)/**` (~50 edits) | 1 hour | B clean |
| **E** | Production push + 14-day monitoring | — | manual | C clean + sign-off |
| **F** | Memory + playbook update | memory/, `redirects.ts` header | 15 min | E stable |

**Total Claude time: ~3 hours over 2-3 sessions.** Real-world calendar: 1 week (depending on timing decision below).

## Top 10 test pages

| # | URL | Why |
|---|---|---|
| 1 | `/how-deep-do-moles-dig/` | #1 earner (136 clicks) |
| 2 | `/do-moles-bite/` + `/do-moles-bite` | Same-page split (60 vs 8) |
| 3 | `/how-many-eyes-do-moles-have/` | Highest impressions (17k) |
| 4 | `/` | Homepage edge case |
| 5 | `/voles-vs-moles-whats-the-difference/` | Clean single-URL case |
| 6 | `/mole-control-seattle/` | Top city page |
| 7 | `/mole-trapping-sumner/` | Only city ranking well (pos 6) |
| 8 | `/about-us/` | Tests 2-hop chain shortening |
| 9 | `/blog/best-mole-traps` | Only case where no-slash wins |
| 10 | `/services/total-mole-control-program/` | Top service page |

## Open decisions before WS-A starts

1. **Timing** — start now (T+12 from launch, migration still settling) or wait 2-3 weeks for migration to stabilize?
   - Cost of waiting: ~30-50 clicks bled during wait
   - Cost of starting now: compound flux risk
2. **`/blog/best-mole-traps`** — only page where no-slash currently winning (8 vs 5 clicks). Accept the ~5 click hit?

## Out of scope (track separately)

- `www.got-moles.com/` duplicate index (18 clicks bleed) — separate canonical issue
- `/about` + `/about-us/` both ranking pos 3 with 0% CTR — title/meta refresh
- Mobile rank -40% trend — independent investigation
- `/lp/*` LP pages — noindex, irrelevant to organic
- Post-deploy `redirects.ts` dead-rule cleanup — backlog

## Status (2026-05-13)

**WS-A + WS-B + WS-D shipped to production. Live and healthy.**

| WS | Status | Commit | Result |
|---|---|---|---|
| WS-D | ✅ done | (script in `_audit-tools/`) | Built `verify-canonical.mjs` harness — pre-flip / post-flip / post-WSB baselines captured |
| WS-A | ✅ live | `9348db5` | `trailingSlash: true` flipped |
| WS-B | ✅ live | `c0a46f1` | ~44 redirect destinations slash-ified + species sitemap anomaly removed |
| WS-C | 🟡 next | — | Internal `<Link href>` sweep across components + app routes |
| WS-E | ⏳ passive | — | 14-day GSC + Vercel logs monitoring |
| WS-F | 🟡 in progress | — | Memory updated, playbook update pending |

### Live metrics (post-WS-B vs pre-flip baseline)

| Metric | Pre-flip | Post-WS-B | Δ |
|---|---|---|---|
| Sitemap 200 in 0 hops | 1/139 | **138/138** | +137 |
| Canonical mismatch | 138 | **0** | ✅ |
| Historical 1-hop | 6/22 | **16/22** | +10 |
| Historical 3-hop | 0 | **0** | ✅ |
| 5xx / errors | 0 | **0** | clean |

### Decisions made (resolved)

1. **Timing** — flipped now (T+12 from launch). Compound flux acceptable.
2. **`/blog/best-mole-traps`** — flipped with rest; ~5 click hit accepted.

### Manual GSC actions queued for Roy

1. Resubmit sitemap.xml (Index → Sitemaps → ↻)
2. URL Inspection + Request Indexing on top 10 traffic earners (list in WS-D section)
3. Performance baseline export 2026-05-13 for retrospective
4. Watch Coverage 7-14 days for "Page with redirect" spike then normalize
5. Mobile rank trajectory (was -40% pre-flip — watch for stabilization)

### Rollback (still available)

- WS-B only: `git revert c0a46f1`
- WS-A+WS-B: `git revert c0a46f1 9348db5`
- Push to `mine/main` → ~2 min Vercel build to restore prior state. No data changes to roll back.
