---
project: cornerstone-url-recovery
status: active
level: 2
created: 2026-05-02
parent: got-moles-marketing-os
---

# Cornerstone URL Recovery — Reverse High-Value MERGE Redirects

L2 sub-brief of `website-rebuild-rebrand`. Recover ~30% impressions loss caused by MERGE redirects on high-value cornerstone URLs that violated the standing `feedback_preserve_indexed_urls.md` rule.

## Goal

Restore the 3 highest-value MERGE-redirected cornerstones (and 2-4 lower-value ones) to their original SEO-equity URLs by changing `urlPattern` from `'blog'` to `'legacy-root'` on the existing new-build cornerstone records. Augment content where the new build doesn't fully cover the historical keyword footprint. Recover the ~1,500 impressions/day lost since 2026-04-20.

## Why now (the data)

GSC API queried 2026-05-02:

| Period | Daily impressions | State |
|---|---|---|
| Apr 11-19 (pre-redirect) | 4,367–6,045 (avg ~5,200) | Healthy baseline |
| Apr 20-22 (transition) | 3,941 → 3,713 → 3,514 | Drop happens here |
| Apr 23 – May 1 (post) | 3,507–3,785 (avg ~3,610) | New, 30% lower baseline holds |

**~1,500 impressions/day lost** = ~45,000/month. Caused by 3 MERGE redirects on high-value cornerstones that should have been preserved per the standing rule. Stable at the lower baseline for 12 days = not a temporary blip, this is the new normal until we fix it.

## Acceptance criteria

1. All 5-7 selected old URLs return **200 OK with self-canonical** (not 301)
2. All corresponding new `/blog/*` URLs return **301 to old URL** (no orphan content)
3. **138-URL sitemap** updated to reflect new URL structure (legacy-root URLs in, /blog/* slugs removed where moved)
4. **Schema integrity**: BlogPosting / FAQPage / DefinedTerm / SpeakableSpecification / BreadcrumbList all valid on the restored URLs (Rich Results Test passes)
5. **Internal cross-links** in other blog posts point directly to new (legacy-root) URLs — no redirect chains
6. **All 58 missing keywords** from the audit are present in augmented cornerstone content (per re-run of audit script post-augmentation)
7. **GSC URL inspection** on the affected old URLs shows "URL is on Google" or "Crawled" within 7 days of deploy
8. **Impressions baseline** recovers toward ~5,000/day average by 30 days post-deploy (full recovery 60-90 days)

## Scope (decision pending — see Phase 1)

**Confirmed in scope (5 URLs, high+medium SEO value):**

| Rank | OLD URL | NEW slug (current) | KW | Augment? |
|---|---|---|---:|---|
| 1 | `/what-do-moles-eat/` | `what-do-moles-eat` | 102 | YES — 22 missing food queries |
| 4 | `/voles-vs-moles-whats-the-difference/` | `mole-vs-vole-vs-gopher` | 80 | YES — 32 missing vocabulary variants |
| 19 | `/do-moles-hibernate/` | `when-are-moles-most-active-washington` | 35 | YES — 4 minor (typo + "snow moles") |
| m6 | `/what-species-of-moles-live-in-washington-state/` | `types-of-moles-in-washington` | 9 | NO — coverage adequate |
| m10 | `/how-to-get-rid-of-moles-in-your-yard/` | `how-to-get-rid-of-moles` | 3 | NO — coverage adequate |

**Bottom 2 (zero ranked KW each) — DECISION 2026-05-02: Option A (skip, leave existing MERGE redirects in place):**

| Rank | URL | KW | Decision |
|---|---|---:|---|
| ~~m16~~ | ~~`/moles-vs-gopher-mounds/`~~ | 0 | **OUT OF SCOPE** — leave existing MERGE redirect, no SEO equity to recover |
| ~~m17~~ | ~~`/what-works-for-mole-extermination/`~~ | 0 | **OUT OF SCOPE** — same |

## Out of scope

- Content rewrite of NEW `/blog/*` cornerstones (only augmentation — adding missing keywords)
- Other migration plan classifications beyond these 7 (16 legacy-root posts already preserved correctly; 18 MIGRATE blogs already at original URLs)
- City page changes (already canonical-on-same-URL)
- New blog content production
- Any other SEO work outside this specific recovery

## Phases

### Phase 1 — Discovery & decision lock (gate)

- [x] Audit complete — 229 historical KW across 7 URLs, 58 missing from new content
- [x] Per-URL gap analysis — 3 need augmentation, 2 are clean, 2 have zero value
- [x] **GATE: Roy confirmed scope 5 (m16/m17 Option A — out of scope) on 2026-05-02**
- [x] Brief reviewed and locked. Augmentation approach confirmed (c) mixed body+FAQ for #1, #4, #19.

### Phase 2 — Content augmentation (#1, #4, #19) — ✅ COMPLETE 2026-05-02

For each of 3 cornerstones with content gaps:

- [x] **#1** Wrote "Specific Foods People Ask About" body section + 2 FAQs (water/drinking, geographic). Garlic added in follow-up. 22 → 6 missing (script artifacts only).
- [x] **#4** Added 5 FAQs: 3 standard + 2 GEO/AEO-tuned phrasing variants. 32 → 6 missing (script artifacts only).
- [x] **#19** Added "What People Mean by 'Snow Moles'" body section + "Do moles hibernate?" FAQ. 4 → 1 missing (typo Google handles).
- [x] All augmentations voice-matched per Got Moles voice-profile.md, Spencer-as-Founder authority + practical-empathic. Humanizer ≥ 8.0 (self-checked).
- [x] Re-run keyword audit — 58 → 13 missing total (all artifacts, not real gaps).
- [x] Roy approved each cornerstone diff before commit.

Detailed results: `phase-2-audit-results.md` in this folder.

### Phase 3 — Code changes (slug + redirects) — ✅ COMPLETE 2026-05-02

- [x] Edited `src/lib/blog-data.ts` urlPattern + slug on 4 entries (m6 reverted — existing legacy-root post already serves the URL). Detail in `phase-3-5-execution-log.md`
- [x] Edited `src/lib/redirects.ts` — removed 5 MERGE rules, updated 1 dependent destination, added 8 reverse 301s, removed `what-do-moles-eat` from blogSlugs array
- [x] Diff shown via direct edits during execution

### Phase 4 — Cross-link updates in other blog posts — ✅ COMPLETE 2026-05-02

- [x] Used `replace_all` on 5 URL patterns across blog-data.ts (22+ inline references updated)
- [x] llms.txt verified clean — no affected URLs there
- [x] sitemap.ts auto-handles urlPattern transition — no code change needed

### Phase 5 — Reseed & verify (staging) — IN PROGRESS

- [x] Reseeded via `npm run seed -- --reseed-blogs all` (32 reseeded)
- [x] Discovered + fixed orphan-slug bug — ran `_delete-orphan-slugs.mjs` to clean 3 orphaned DB records left by slug renames
- [x] `npm run build` clean — 4 affected URLs correctly moved out of `/blog/[slug]` (was 19, now 15) into `/[citySlug]` legacy-root routes (now 112)
- [ ] Push to `mine/main`
- [ ] Wait for Vercel staging deploy
- [ ] Run probe script against staging
- [ ] Schema verification via Rich Results Test on samples

### Phase 6 — Production deploy & re-indexing

- [ ] Already deployed via push (Vercel auto-deploys main → production)
- [ ] In GSC: URL Inspection → "Request Indexing" on each affected old URL (forces Google re-crawl)
- [ ] In GSC: re-submit sitemap (`https://got-moles.com/sitemap.xml`)
- [ ] In Bing Webmaster: URL Submission → submit affected old URLs
- [ ] Update Notion `URL Indexing Priority — Top 30 (Spencer punch list)` page — flag affected URLs as recovered, no longer needs separate handling

### Phase 7 — Monitor recovery (30-60 days)

- [ ] Day 7: GSC check — affected URLs showing up in coverage report as indexed
- [ ] Day 14: GSC performance — early ranking signal recovery on the augmented keywords
- [ ] Day 30: GSC impressions — average daily impressions trending toward pre-redirect ~5,000 baseline
- [ ] Day 60: GSC impressions — full recovery confirmed or partial-recovery analysis
- [ ] Day 90: final report — actual vs predicted SEO recovery, lessons logged to `feedback_preserve_indexed_urls.md` if needed

## Risks

- **Slug uniqueness**: Payload BlogPosts collection has `unique: true` on slug. If a slug change collides with an existing slug, reseed fails. Mitigation: pre-check slug availability before edit.
- **Internal link rot**: Other blog posts cross-link to current `/blog/*` URLs. Phase 4 catches these but easy to miss new ones. Mitigation: post-deploy probe checks for broken internal links.
- **Reverse 301 oversight**: External sites (BBB, Yelp, social) may have linked to `/blog/*` URLs that we just moved. Reverse 301 ensures those keep working. Without it = 404s on inbound links.
- **Augmentation introduces AI-detected content**: humanizer must score 8.0+ on all 3 augmented cornerstones. If below, iterate before commit per standing rule.
- **Reseed of large blog set**: `--reseed-blogs all` may take time and could fail mid-run. Mitigation: test with single-slug reseed first, then full.
- **Recovery slower than predicted**: 30-day full recovery is optimistic. Realistic range 30-90 days. Manage expectations with Spencer.

## Dependencies

- **No external blockers.** Roy + Claude can complete all 7 phases independently.
- **Cloudflare zone removal** (separate ongoing task with agency) unrelated — Vercel + GoDaddy DNS already authoritative for site changes.
- **DKIM Start Authentication** unrelated — email layer.

## Owner map

| Phase | Owner |
|---|---|
| 1 — Discovery & decision | Roy + Claude |
| 2 — Content augmentation | Claude (writes), Roy (approves diff) |
| 3 — Code changes | Claude (writes), Roy (approves diff) |
| 4 — Cross-link updates | Claude (executes), Roy (approves diff) |
| 5 — Reseed & verify | Claude (executes), Roy (gate before push) |
| 6 — Production deploy + re-indexing | Claude (executes deploy + GSC API calls) |
| 7 — Monitor | Claude (runs 30/60/90-day reports), Roy (decisions on partial recovery) |

## Success metrics

- **Hard:** all 5-7 affected URLs return 200 self-canonical, schema valid, sitemap clean (Phase 5 gate)
- **Soft:** GSC daily impressions average ≥ 4,500/day by Day 30 (~85% of pre-drop baseline)
- **Soft:** GSC daily impressions average ≥ 4,800/day by Day 60 (~95% of pre-drop baseline)
- **Quality:** humanizer score ≥ 8.0 on all augmented content
- **No regressions:** other URLs (city pages, other blog posts, services) maintain their current rankings throughout recovery period

## References

- `feedback_preserve_indexed_urls.md` — the standing rule that was violated
- `feedback_audit_against_rule_not_label.md` — the audit-against-rule-not-label memory created from this incident
- `clients/got-moles/projects/briefs/seo-geo-reinforcement/reports/old-blog-migration-plan_2026-04-20.md` — original migration plan that mis-classified these as MERGE
- `clients/got-moles/projects/briefs/website-launch-readiness/keyword-corpus-brief.md` — Top 30 keyword value data
- `clients/got-moles/projects/briefs/website-launch-readiness/keyword-corpus-raw.json` — full keyword corpus
- `clients/got-moles/_keyword-audit.mjs` — audit script (re-runnable to verify post-augmentation coverage)
- `clients/got-moles/_audit-other-4.mjs` — secondary audit confirming m16/m17 zero-value finding
- `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/collections/BlogPosts.ts` — has the `urlPattern` field already supporting legacy-root
- `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/lib/blog-data.ts` — source of truth, edit target for Phase 3
- `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/lib/redirects.ts` — redirect rules to update in Phase 3

## Notion link

[L2: Cornerstone URL Recovery — Reverse High-Value MERGE Redirects](https://www.notion.so/L2-Cornerstone-URL-Recovery-Reverse-High-Value-MERGE-Redirects-3543d42c4a9c81c5ba1ee985361eea27) — page ID `3543d42c-4a9c-81c5-ba1e-e985361eea27`
