---
project: str-ai-seo-local
date: 2026-05-05
type: gsc-deep-pull
---

# GSC Deep Pull — Candidate Legacy-Root URLs

**Window:** 2026-02-02 → 2026-04-30 (88 days, OLD WordPress site, pre-launch)
**Purpose:** Apply preserve-indexed-URLs rule. Any URL with non-trivial historical equity should stay at its indexed slug — content moves to match, not the URL.

## Summary

| URL | Clicks | Impressions | Avg pos | Verdict |
|---|---:|---:|---:|---|
| `/can-moles-see/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/author/spencer/` | 7 | 207 | 20.6 | KEEP — preserve at indexed URL |
| `/mole-control-edgewood-2/` | 9 | 1,107 | 25.4 | KEEP — preserve at indexed URL |
| `/are-moles-blind/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/are-moles-good-for-your-yard/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/best-mole-traps/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/diy-vs-professional-mole-control/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/do-mole-repellents-work/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/does-grub-control-stop-moles/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/how-long-do-moles-live/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/how-to-find-active-mole-tunnels/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/humane-mole-removal/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/mole-control-safe-for-pets/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/mole-removal-cost-washington/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/monthly-vs-one-time-mole-control/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/types-of-moles-in-washington/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |
| `/why-moles-keep-coming-back/` | 0 | 0 | 0.0 | no equity — safe to leave 404 or simple redirect |

## Top queries per URL with equity

### `/author/spencer/` (7 clicks / 207 imp)

| Query | Clicks | Imp | CTR | Pos |
|---|---:|---:|---:|---:|
| are moles nocturnal | 0 | 1 | 0.00% | 47.0 |
| are moles rodents | 0 | 1 | 0.00% | 3.0 |
| do moles bite | 0 | 1 | 0.00% | 11.0 |
| do moles run fast | 0 | 1 | 0.00% | 1.0 |
| got moles | 0 | 1 | 0.00% | 1.0 |

### `/mole-control-edgewood-2/` (9 clicks / 1,107 imp)

| Query | Clicks | Imp | CTR | Pos |
|---|---:|---:|---:|---:|
| ant control edgewood | 0 | 3 | 0.00% | 23.7 |
| clyde hill mole control | 0 | 1 | 0.00% | 102.0 |
| clyde hill mole extermination | 0 | 25 | 0.00% | 91.8 |
| companies that get rid of moles | 0 | 1 | 0.00% | 1.0 |
| des moines mole pest removal | 0 | 2 | 0.00% | 75.0 |


## Decision framework (preserve-indexed-URLs rule)

For each URL with verdict KEEP:

1. Read the corresponding NEW-build page (`/blog/{slug}/`) and compare keyword coverage against the top queries above.
2. If new page covers all top queries: flip `urlPattern` from `'blog'` to `'legacy-root'` in CMS — slug moves from `/blog/{slug}/` to `/{slug}/`. Sitemap regenerates automatically.
3. If new page is missing keyword coverage: augment first (see cornerstone-url-recovery Phase 2 methodology), THEN flip urlPattern.
4. Add a redirect from `/blog/{slug}` → `/{slug}` so internal links don't break.

