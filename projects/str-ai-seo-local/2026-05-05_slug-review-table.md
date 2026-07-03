---
project: str-ai-seo-local
date: 2026-05-05
type: slug-review-table
---

# Slug Review — Side-by-Side

Every URL that had ≥3 historical clicks (pre-drop window). Compare what was indexed vs where the page lives now, then decide which slugs to flip back per preserve-indexed-URLs rule.

**Windows:**  PRE = 2026-02-12 → 2026-04-19 (67d, healthy)  ·  POST = 2026-04-20 → 2026-05-05 (16d, drop+launch)

**Categories:**
- 🔴 **404** — page is gone, restore at indexed URL
- 🔴 **slug-leak** — slug renamed, rank dropped — revert slug per the rule
- 🟡 **rank-drop** — same URL, position slipped — investigate content/schema (URL is fine)
- 🟡 **redirect** — redirected to different slug, minor traffic, review case-by-case
- 🟡 **service-norm** — /mole-trapping/ → /mole-control/ (deliberate naming change)
- 🟡 **city-norm** — short slug → /mole-control-{city} (deliberate canonicalisation)
- ✅ **recovered** — cornerstone-url-recovery handled this; monitor
- 🟢 **stable / mild-drop** — within normal volatility

---

## Action-required URLs (🔴 + 🟡 rank-drop)

| Cat | Indexed URL | Current Live URL | Pre-clk | Post-clk | Pre-pos | Post-pos | Recommended Action |
|---|---|---|---:|---:|---:|---:|---|
| 🟡 rank-drop | `/how-to-get-rid-of-ground-moles-with-vinegar/` | `(same)` | 189 | 34 | 3.6 | 6.2 | INVESTIGATE content/schema/internal-link changes (URL is fine, position dropped) |
| 🟡 rank-drop | `/what-do-mole-holes-look-like/` | `(same)` | 164 | 29 | 4.6 | 7.2 | INVESTIGATE content/schema/internal-link changes (URL is fine, position dropped) |
| 🟡 rank-drop | `/voles-vs-moles-whats-the-difference/` | `(same)` | 63 | 7 | 2.0 | 3.4 | INVESTIGATE content/schema/internal-link changes (URL is fine, position dropped) |
| 🟡 rank-drop | `https://www.got-moles.com/` | `(same)` | 55 | 10 | 6.7 | 8.3 | INVESTIGATE content/schema/internal-link changes (URL is fine, position dropped) |
| 🔴 slug-leak | `/are-moles-venomous/` | `/are-moles-poisonous-or-venomous` | 34 | 2 | 2.6 | 4.8 | FLIP back to indexed URL (preserve-indexed-URLs rule) |
| 🟡 rank-drop | `/what-eats-moles/` | `(same)` | 33 | 5 | 3.3 | 4.5 | INVESTIGATE content/schema/internal-link changes (URL is fine, position dropped) |
| 🟡 rank-drop | `/do-moles-live-in-groups/` | `(same)` | 17 | 1 | 3.1 | 5.0 | INVESTIGATE content/schema/internal-link changes (URL is fine, position dropped) |
| 🟡 rank-drop | `/are-moles-nocturnal/` | `(same)` | 16 | 2 | 3.9 | 5.9 | INVESTIGATE content/schema/internal-link changes (URL is fine, position dropped) |
| 🟡 rank-drop | `/do-moles-hibernate/` | `(same)` | 7 | 0 | 5.5 | 14.6 | INVESTIGATE content/schema/internal-link changes (URL is fine, position dropped) |

## Cornerstone-recovered URLs (monitor only)

| Indexed URL | Pre-clk | Post-clk | Pre-pos | Post-pos | Status |
|---|---:|---:|---:|---:|---|
| `/moles-vs-gopher-mounds/` | 20 | 4 | 3.0 | 4.3 | re-indexing post May 2 deploy |
| `/when-are-moles-most-active/` | 17 | 3 | 4.7 | 8.6 | re-indexing post May 2 deploy |

## Deliberate redirects (KEEP — no action)

| Indexed URL | → Current | Pre-clk |
|---|---|---:|
| `/mole-trapping-olympia/` | `/mole-control-olympia` | 14 |
| `/des-moines/` | `/mole-control-des-moines` | 5 |
| `/olympia-mole-exterminator/` | `/mole-control-olympia` | 5 |
| `/tumwater/` | `/mole-control-tumwater` | 3 |

## Stable URLs (no action)

17 URLs healthy or within normal volatility. Listed in JSON output for completeness.

---

## Getting Google to Re-Index After Slug Flips

For each URL we restore to its indexed slug:

1. **Make the slug change in CMS** (Payload `urlPattern` flip, or slug edit on the post record)
2. **Update redirects.ts** — old /blog/{slug} → /{slug} 301 (so internal links don't break)
3. **Verify sitemap regenerates** — should auto-update from CMS data on next deploy
4. **Submit to GSC URL Inspection → Request Indexing** for the restored URL (manual, ~3 min per URL)
5. **Audit internal links** — make sure other site pages now point to the restored URL, not /blog/{slug}
6. **Monitor GSC daily** for 7-14 days — recovery typically lands within 1-2 weeks

Sitewide reindex: send the updated sitemap.xml to GSC via Sitemaps tab to flag the freshness signal.

