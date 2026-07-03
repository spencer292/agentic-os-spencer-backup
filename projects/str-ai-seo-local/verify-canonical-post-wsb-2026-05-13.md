# Canonical Verification — post-wsb

**Run:** 2026-05-13T07:24:14.279Z
**Target:** https://got-moles.com

## Sitemap URLs (canonical set — must return 200 in 0 hops)

| Metric | Count |
|---|---|
| Total sitemap URLs | 138 |
| 200 in 0 hops | 138 |
| Returning 308 first (hop > 0) | 0 |
| Non-200 final | 0 |
| Errors | 0 |
| Canonical tag missing | 0 |
| Canonical ≠ final URL | 0 |
| Missing JSON-LD | 0 |

### Sitemap URLs requiring attention

_All sitemap URLs return 200 in 0 hops._

### Canonical/final mismatches (top 20)

_All canonical tags align with served URL._

## Historical WordPress URLs (must redirect in 1 hop to 200)

| Metric | Count |
|---|---|
| Sampled | 22 |
| 1-hop to 200 (target state) | 16 |
| Multi-hop (>1) | 3 |
| Failed (non-200 or error) | 0 |

### Multi-hop chains (need shortening after flip)

- `https://got-moles.com/about-us` — 2 hops: 308 https://got-moles.com/about-us → 308 https://got-moles.com/about-us/ → 200 https://got-moles.com/about/
- `https://got-moles.com/city/seattle` — 2 hops: 308 https://got-moles.com/city/seattle → 308 https://got-moles.com/city/seattle/ → 200 https://got-moles.com/mole-control-seattle/
- `https://got-moles.com/mole-trapping-seattle` — 2 hops: 308 https://got-moles.com/mole-trapping-seattle → 308 https://got-moles.com/mole-trapping-seattle/ → 200 https://got-moles.com/mole-control-seattle/

### Failed historical URLs

_All historical samples return 200 at end of chain._

## Errors

_No fetch errors._

## Files

- Full data: `verify-canonical-post-wsb-2026-05-13.csv`
- This summary: `verify-canonical-post-wsb-2026-05-13.md`
