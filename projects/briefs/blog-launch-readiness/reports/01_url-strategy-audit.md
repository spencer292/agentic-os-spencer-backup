# Phase 1 — URL Strategy Audit

**Date:** 2026-04-24
**Source data:** Agency Rankings sheet (3,025 rows) + Payload DB (34 posts) + `city-data.ts` (276 slugs) + `redirects.ts` (Patterns 1-7)

## TL;DR

Of the ~111 unique URLs with any indexed rank on the old site:

| Action | URLs | Top-3 | Top-10 |
|---|---|---|---|
| ✅ **OK as-is** (canonical page exists on new site) | 46 | 911 | 1,143 |
| ✅ **OK via existing 301** (pattern-consolidation is correct) | 59 | 439 | 534 |
| ⚠️ **FLIP to legacy-root** (post exists at wrong URL) | 1 | 7 | 31 |
| ⚠️ **Verify spelling redirect** | 1 | 40 | 40 |
| ⚠️ **Create new legacy-root post** (in scope per top-10 rule) | 1 | 2 | 9 |
| ⚠️ **Out-of-scope tail (0 rank)** — redirect or let 404 | 3 | 0 | 0 |

**Total top-3 at risk if actions not taken: 50 top-3 + 80 top-10**. Preserves 1,409 total top-3 if all actions applied.

## Actions required

### Action 1 — Flip `what-do-moles-eat` from `blog` to `legacy-root`

**URL at risk:** `https://got-moles.com/what-do-moles-eat/` — 7 top-3 keywords, 31 top-10

**Current state:** Post exists in DB with `url_pattern='blog'`, rendering at `/blog/what-do-moles-eat/`. `redirects.ts` `blogSlugs` list has this slug, which 301s `/what-do-moles-eat/` → `/blog/what-do-moles-eat/`. That's a redirect away from the indexed URL — violates Roy's migrate-don't-redirect rule.

**DB change:**
```sql
UPDATE blog_posts SET url_pattern = 'legacy-root' WHERE slug = 'what-do-moles-eat';
```

**Code change:** Remove `'what-do-moles-eat'` from `blogSlugs` array in `src/lib/redirects.ts` (line 79).

**Impact:** Content renders at `/what-do-moles-eat/` (matches old URL). `/blog/what-do-moles-eat/` will 404 — verify no internal links point there.

### Action 2 — Verify `southhill` spelling redirect is active

**URL at risk:** `https://got-moles.com/mole-control-southhill/` — 40 top-3 keywords, 40 top-10

**Current state:** `redirects.ts` Pattern 6 (spelling variants) has the entry:
```
['/mole-control-southhill', '/mole-control-south-hill']
['/mole-control-southhill/', '/mole-control-south-hill/']
['/southhill-mole-control', '/mole-control-south-hill']
['/southhill-mole-control/', '/mole-control-south-hill/']
```
Destination slug `south-hill` verified present in `city-data.ts` line 1085. Redirect should work.

**Action:** Live-test after DNS flip (or via `curl -I https://project-pf8c6.vercel.app/mole-control-southhill/`) to confirm 301 lands on `/mole-control-south-hill/`. No code change needed — just verification.

### Action 3 — Create new legacy-root post at `/what-species-of-moles-live-in-washington-state/`

**URL at risk:** `https://got-moles.com/what-species-of-moles-live-in-washington-state/` — 2 top-3 keywords, 9 top-10

**Current state:** No post exists in DB at this slug. Content equivalent exists at `/blog/types-of-moles-in-washington/` (different slug).

**Action:** Create new blog_posts row with:
- `slug: 'what-species-of-moles-live-in-washington-state'`
- `url_pattern: 'legacy-root'`
- Content: either duplicate-but-canonicalise from `types-of-moles-in-washington`, OR write fresh focused content targeting the question keyword exactly

**Approach:** Fresh content is cleaner (no canonical ambiguity) and the question-phrasing gives us a separate AI-answer surface. The old URL's 2 top-3 keywords are:
- "washington state what species of moles live in" (rank #3)
- "what species of moles live in washington state" (rank #5, #7)

Post scope: ~1,000 wc, answer-first BLUF ("Three mole species live in Washington State: Townsend's mole, Pacific Coast mole, and Shrew mole..."), species-by-species breakdown, WA-range geography, FAQ, internal links to `/blog/types-of-moles-in-washington/` as the deeper cornerstone. Plus internal link to `/mole-control-seattle/` + TMCP service page.

### Action 4 — Out-of-scope tail (0-rank URLs)

Three URLs are tracked in the Rankings sheet but currently rank nowhere (bestRank > 100). Per the scope decision ("any indexed URL with top-10 rank"), these are out of scope for create-new. Safe to treat as:

| URL | Current content | Action |
|---|---|---|
| `/do-moles-hibernate/` | None | Let 404. Add to optional post-launch content queue — topic has GEO value but no ranking equity today. |
| `/voles-vs-moles-whats-the-difference/` | Equivalent at `/blog/mole-vs-vole-vs-gopher/` | Add `redirects.ts` entry → `/blog/mole-vs-vole-vs-gopher/` (safe — zero equity to redirect away) |
| `/how-to-get-rid-of-moles-in-your-yard/` | Equivalent at `/blog/how-to-get-rid-of-moles/` | Add `redirects.ts` entry → `/blog/how-to-get-rid-of-moles/` (safe — zero equity) |

Both redirects are pure-additive — they route dead URLs to the closest-intent new page rather than 404. No existing equity is lost.

## DB posts not in Rankings sheet (new content, not at risk)

26 of the 34 posts in DB have no corresponding URL in the agency Rankings sheet — these are newly-written content (cornerstones + supporting). They're at safe URLs (`/blog/{slug}/` for 16 standard posts, `/{slug}/` for 10 legacy-root). No risk to existing rankings because no ranking exists yet. All must still hit the cornerstone-tier bar for launch quality.

### Standard `/blog/{slug}/` (new content):
- how-to-get-rid-of-moles (cornerstone)
- mole-vs-vole-vs-gopher (cornerstone)
- types-of-moles-in-washington (cornerstone)
- are-moles-blind
- best-mole-traps
- diy-vs-professional-mole-control
- do-mole-repellents-work
- does-grub-control-stop-moles
- how-long-do-moles-live
- how-to-choose-a-mole-control-company
- how-to-find-active-mole-tunnels
- humane-mole-removal
- mole-control-safe-for-pets
- mole-removal-cost-washington
- monthly-vs-one-time-mole-control
- when-are-moles-most-active-washington
- why-moles-keep-coming-back
- are-moles-good-for-your-yard

### Legacy-root `/{slug}/` (migrated from old WP but some have no current rank):
- are-moles-nocturnal
- are-moles-poisonous-or-venomous
- can-moles-swim
- do-moles-bite (has rank — 14 top-3)
- do-moles-carry-diseases (has rank — 4 top-3)
- do-moles-live-in-groups
- how-deep-do-moles-dig
- how-many-babies-do-moles-have
- how-many-eyes-do-moles-have (has rank — 46 top-3)
- how-to-get-rid-of-ground-moles-with-vinegar
- is-a-mole-a-rodent
- what-attracts-moles-to-your-yard
- what-do-mole-holes-look-like
- what-eats-moles
- why-do-moles-make-molehills

## Change summary for execution

Four discrete changes:

1. **DB SQL** (applied via one-off pg script):
   ```sql
   UPDATE blog_posts SET url_pattern = 'legacy-root' WHERE slug = 'what-do-moles-eat';
   -- New post creation is more complex — handled in Phase 3 content uplift via ops-blog-pipeline
   ```

2. **`src/lib/redirects.ts` edits:**
   - Remove `'what-do-moles-eat'` from `blogSlugs` array (line 79)
   - Add to coreRedirects:
     ```
     ['/voles-vs-moles-whats-the-difference', '/blog/mole-vs-vole-vs-gopher'],
     ['/voles-vs-moles-whats-the-difference/', '/blog/mole-vs-vole-vs-gopher'],
     ['/how-to-get-rid-of-moles-in-your-yard', '/blog/how-to-get-rid-of-moles'],
     ['/how-to-get-rid-of-moles-in-your-yard/', '/blog/how-to-get-rid-of-moles'],
     ```

3. **New post queued for Phase 3:** `/what-species-of-moles-live-in-washington-state/` — ~1,000 wc, legacy-root, WA species breakdown

4. **Verification test (post-deploy):**
   ```
   curl -I https://project-pf8c6.vercel.app/mole-control-southhill/
   # expect: 308 → /mole-control-south-hill/
   curl -I https://project-pf8c6.vercel.app/what-do-moles-eat/
   # expect: 200 (after flip)
   curl -I https://project-pf8c6.vercel.app/voles-vs-moles-whats-the-difference/
   # expect: 308 → /blog/mole-vs-vole-vs-gopher
   ```

## Risk assessment

| Change | Risk | Mitigation |
|---|---|---|
| Flip `what-do-moles-eat` to legacy-root | Low. Reversible via SQL. `/blog/what-do-moles-eat/` will 404 — check no internal links point there. | Grep codebase before deploy for `/blog/what-do-moles-eat` references. |
| Remove from `blogSlugs` | Low. Reversible via git. | Git commit documents change. |
| Add 2 new coreRedirects | Low. Pure additive. | — |
| Create new `/what-species.../` post | Low — new content, no existing conflict. | Phase 3 handles via ops-blog-pipeline. |

---

*Phase 1 complete. Pending Roy approval to apply DB change + redirects.ts edits + queue create-new post into Phase 3. All 4 changes reversible.*
