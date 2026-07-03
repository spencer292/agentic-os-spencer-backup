---
project: onpage-audit-sweep
status: active
level: 2
created: 2026-05-09
parent_gsd: got-moles-marketing-os
parent_phase: 2.2
target_score: 90+ per Tier 1 page; 80+ per Tier 2; 75+ per Tier 3
---

# Got Moles On-Page Audit Sweep (L2)

Per-page on-page SEO/GEO/AEO audit + apply tracker. Sub-project under `got-moles-marketing-os` Phase 2.2 ("Per-page audit + apply"). Each page is a row in the queue table below.

## Purpose

Bring every page on got-moles.com to its target on-page score using the patched `str-onpage-audit` skill (Rules A-G). One audit per page → one or more apply commits → live verification → row updated to ✅ COMPLETE.

This L2 exists because Phase 2.2 spans 130+ pages across multiple weeks and needs page-level status tracking. The L3 GSD's `.planning/PROJECT.md` is too coarse for that.

## Methodology

1. Audit produced via `str-onpage-audit` skill → saved to `projects/str-onpage-audit/{date}_{site}-{slug}-audit.md`
2. Audit must include all three Rule G evidence sections (Foundation-doc lookup, Live verification, Three-Layer SoT)
3. Apply via The Only Flow (Rule B): Edit → Humanize → Build → Reseed → Stage → Commit → Push → Verify
4. Post-apply verification via raw HTML extraction (Rule C), not WebFetch alone
5. Update this brief's queue table: status + score + audit-file + commit refs + verification confirmation

## Per-page review pattern (Rule)

Per `feedback_per_page_review_pattern.md`: no bulk sweeps. Each page is audited, presented, approved, applied, verified, committed individually. High-risk pages (635 #1 keyword equity at stake) get a 7-14 day monitoring window before the next page in the same cluster.

## Page Queue

### Tier 1 — Authority pages (per target-keywords.md)

| Page | Audit file | Pre-score | Post-score | Status | Commits |
|---|---|:-:|:-:|---|---|
| `/about/` | `2026-05-09_got-moles-about-audit.md` | 68 (C+) | **95.5 (A)** | ✅ COMPLETE 2026-05-09 | `b00d348`, `ccc4fa5`, `9409f8f`, `b40f2d5` |
| `/` (homepage) | — | — | — | 🔴 NEXT | uncommitted hero changes ready to fold |
| `/services/total-mole-control-program/` | — | — | — | ⚪ queued | — |
| `/services/one-time-mole-removal/` | — | — | — | ⚪ queued | — |
| `/services/commercial-mole-control/` | — | — | — | ⚪ queued | — |
| `/how-to-get-rid-of-moles-in-your-yard/` | — | — | — | ⚪ queued (cornerstone — high risk) | — |

### Tier 2 — Supporting hubs

| Page | Audit file | Pre-score | Post-score | Status | Commits |
|---|---|:-:|:-:|---|---|
| `/reviews/` | — | — | — | ⚪ queued | — |
| `/reviews/commercial-case-studies/` | — | — | — | ⚪ queued | — |
| `/service-areas/` | — | — | — | ⚪ queued | — |
| `/faq/` | — | — | — | ⚪ queued | — |
| `/contact/` | — | — | — | ⚪ queued | — |
| `/author/spencer/` | — | — | — | ⚪ queued | — |
| `/blog/` | — | — | — | ⚪ queued | — |

### Tier 3a — City pages, Tier A (12 priority cities)

| City pattern | Audit | Pre | Post | Status |
|---|---|:-:|:-:|---|
| Tier A template + 12 cities (Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton, ...) | — | — | — | ⚪ queued — template-first approach (audit one, apply pattern, repeat) |

### Tier 3b — City pages, Tier B (~81 cities)

| City pattern | Audit | Pre | Post | Status |
|---|---|:-:|:-:|---|
| Tier B template (programmatic) | — | — | — | ⚪ queued — sample 3-5 cities per template change |

### Tier 3c — Blog posts (35 total)

| Post | Audit | Pre | Post | Status |
|---|---|:-:|:-:|---|
| All blog posts | — | — | — | ⚪ queued — batch audit then prioritise |

## Sequencing rules

1. **Tier 1 first** — homepage + 3 service pages + cornerstone before anything else (highest equity, biggest score lift, biggest risk if wrong)
2. **Cornerstone last in Tier 1** — `/how-to-get-rid-of-moles-in-your-yard/` has 8+ inbound links from blog; touch only after pattern is proven on lower-risk Tier 1 pages
3. **City template before bulk** — audit one Tier A city, perfect the template, then propagate to the other 11 + Tier B
4. **Blog batch audit** — single audit run across all 35 posts to identify common gaps; apply per-cluster not per-post
5. **7-14 day monitor** — after Tier 1 page deploy, watch GSC for ranking shifts before moving to next high-risk page

## Foundation gates

- ✅ `brand_context/target-keywords.md` v1.1 (2026-05-08)
- ✅ `brand_context/authority-strategy.md` v1.0 (2026-05-08)
- ✅ `str-onpage-audit` skill at `.claude/skills/str-onpage-audit/` with Rules A-G (2026-05-09)
- ✅ Recurring benchmark: Pixelmojo Radar (latest in `~/Downloads/`)

## Acceptance criteria

- All Tier 1 pages ≥ 90/100
- All Tier 2 pages ≥ 80/100
- All Tier 3 templates ≥ 75/100 (then propagate)
- Hallucination-correction matrix (4 facts × all relevant surfaces) → 100% corrected
- Each row has audit file path + commit refs + live-verified post-score

## Open threads

- Spencer Person `sameAs` URL needed (LinkedIn or other professional profile) — blocks /about/ Person schema lift from 9 → 10
- Last-Modified HTTP header — server config workstream (not page-level)
- Pre-existing em dashes in /about/ untouched copy (13 instances) — optional cleanup

## Related

- Parent GSD: `projects/briefs/got-moles-marketing-os/brief.md`
- Audit outputs: `projects/str-onpage-audit/`
- Per-page link plans (consumed): `projects/internal-linking-recovery/`
- Foundation docs: `brand_context/target-keywords.md`, `brand_context/authority-strategy.md`
- Skill: `.claude/skills/str-onpage-audit/`
