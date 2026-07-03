---
document: 2.1 — Site Structure & Navigation
project: website-rebuild-rebrand
created: 2026-03-27
status: draft — needs Roy confirmation
---

# 2.1 — Final Site Structure & Navigation

Consolidating 340 current URLs into a clean, GEO-ready architecture. Every page has one job, one primary keyword, and one URL.

---

## Design Principles

1. **One page per city** — no more 3-8 duplicate pages per city
2. **One URL pattern per page type** — no more 4+ inconsistent patterns
3. **Flat hierarchy** — max 2 levels deep from homepage
4. **Every page earns its place** — if it doesn't have a unique keyword target or conversion job, it doesn't exist
5. **GEO-first** — every page gets schema markup, BLUF opening, and entity signals

---

## Primary Navigation

| Nav Item | URL | Page Job |
|----------|-----|----------|
| Home | / | Entity clarity, trust, route to services |
| Services (dropdown) | /services/ | Overview hub |
| → Recurring Protection Plan | /services/total-mole-control-program/ | Sell TMCP subscription |
| → One-Time Removal | /services/one-time-mole-removal/ | Sell eradication program |
| → Commercial | /services/commercial-mole-control/ | B2B lead gen |
| How It Works | /how-it-works/ | Reduce anxiety, explain process |
| Service Areas | /service-areas/ | Hub linking to all city pages |
| About | /about/ | Spencer's story, team, E-E-A-T |
| Reviews | /reviews/ | Social proof, AggregateRating schema |
| Blog | /blog/ | Educational content, long-tail SEO, GEO authority |
| FAQ | /faq/ | Objection handling, GEO citations |
| Contact / Get a Quote | /contact/ | Conversion — phone + form |

**Not in nav but indexed:**
- City pages (72+)
- Blog posts (25+ existing + new)
- /author/spencer/ (E-E-A-T)

**Not indexed (noindex or excluded):**
- AdWords landing pages (/lp/*)
- /thank-you/
- /llms.txt (plain text, not HTML)
- /sitemap.xml

---

## Page Inventory — New Site

### Core Pages (12)

| Page | New URL | Old URL(s) to 301 | Schema |
|------|---------|-------------------|--------|
| Homepage | / | / | LocalBusiness, Organization, AggregateRating |
| Services Hub | /services/ | /our-services/ | Service |
| TMCP Page | /services/total-mole-control-program/ | None (NEW) | Service, Offer |
| One-Time Removal | /services/one-time-mole-removal/ | /mole-control/, /mole-trapping/, /mole-exterminator/, /mole-catcher/, /mole-removal/, /mole-repellant/, /mole-repellent/, /pest-control/, /exterminators/, all /service/* pages | Service |
| Commercial | /services/commercial-mole-control/ | None (NEW) | Service |
| How It Works | /how-it-works/ | /our-process/ | HowTo |
| About | /about/ | /about-us/ | Person (Spencer), Organization |
| Reviews | /reviews/ | None (NEW) | AggregateRating, Review |
| Service Areas Hub | /service-areas/ | /cities-served/ | LocalBusiness |
| FAQ | /faq/ | /faq/ | FAQPage |
| Blog | /blog/ | /blog/ | — |
| Contact | /contact/ | /contact-us/ | LocalBusiness |

### City Pages (~72)

**One page per city.** URL pattern: `/mole-control-{city}/`

This preserves the most common existing pattern and is the most SEO-valuable format (keyword + city in URL).

**301 redirect rules for each city:**
- `/{city}/` → `/mole-control-{city}/`
- `/city/{city}/` → `/mole-control-{city}/`
- `/mole-trapping-{city}/` → `/mole-control-{city}/`
- `/mole-repellant-{city}/` → `/mole-control-{city}/`
- `/mole-catcher-{city}/` → `/mole-control-{city}/`
- `/mole-exterminators-{city}/` → `/mole-control-{city}/`
- `/{city}-mole-control/` → `/mole-control-{city}/`
- `/{city}-mole-extermination/` → `/mole-control-{city}/`
- `/{city}-mole-exterminator` → `/mole-control-{city}/`
- `/{city}-mole-removal` → `/mole-control-{city}/`
- `/{city}-mole-trapping` → `/mole-control-{city}/`
- Any `-2` variants → primary page

**County pages (5):** Keep as `/mole-control-{county}-county/` — these serve a different search intent than city pages.

**New cities to add (from city-sitemap but not in page-sitemap):**
- Duvall, Fircrest, Mill Creek, North Bend (already have newer combo pages)

**Each city page includes:**
- LocalBusiness schema with city-specific geo coordinates
- Unique opening paragraph (not boilerplate)
- Service overview with links to TMCP and One-Time pages
- FAQ section (2-3 city-specific questions)
- Reviews from that area (if available)
- Clear CTA (phone + form)

### Blog Posts (~25 existing + new)

**Preserve all existing URLs exactly.** Clean slugs, no changes needed.

**Exception:** `/olympia-mole-exterminator/` is a city page mixed in with blog posts — 301 redirect to `/mole-control-olympia/`

**Remove:** `/?page_id=192` (draft — should never have been indexed)

### AdWords Landing Pages (4 — noindex)

| Page | URL | Campaign |
|------|-----|----------|
| Mole Removal LP | /lp/mole-removal/ | "[city] mole removal" campaigns |
| Mole Trapper LP | /lp/mole-trapper/ | "mole trapper near me" campaigns |
| Protection Plan LP | /lp/mole-protection-plan/ | Recurring/protection plan campaigns |
| Commercial LP | /lp/commercial/ | Property manager / commercial campaigns |

All noindex, minimal navigation, conversion-focused.

### Technical Pages

| Page | URL | Notes |
|------|-----|-------|
| llms.txt | /llms.txt | Plain text, GEO requirement |
| Sitemap | /sitemap.xml | Auto-generated |
| Privacy Policy | /privacy/ | Legal |
| Terms of Service | /terms/ | Legal |
| Thank You | /thank-you/ | Post-conversion, noindex |

---

## Total New Page Count

| Category | Count |
|----------|-------|
| Core pages | 12 |
| City pages | ~72 |
| Blog posts | ~25 (existing) + 7 (Phase 1 new) |
| AdWords LPs | 4 |
| Technical | 5 |
| Author | 1 |
| **Total** | **~126** |

Down from 340 → 126. Clean, no duplication, every page has a job.

---

## 301 Redirect Summary

| Redirect Type | Count | Rule |
|--------------|-------|------|
| City plain slugs → consolidated | 63 | `/{city}/` → `/mole-control-{city}/` |
| City CPT → consolidated | 72 | `/city/{city}/` → `/mole-control-{city}/` |
| City+service combos → consolidated | ~120 | All variants → `/mole-control-{city}/` |
| Service CPT → consolidated | 9 | `/service/*` → `/services/*` |
| Service keyword pages → consolidated | ~5 | Extras → `/services/one-time-mole-removal/` |
| Core page renames | 3 | /about-us/ → /about/, /our-process/ → /how-it-works/, /contact-us/ → /contact/ |
| Misspelling fixes | ~12 | `/mole-repellant*` → correct pages |
| Duplicate -2 pages | 6 | → primary page |
| Blog misplaced city page | 1 | /olympia-mole-exterminator/ → /mole-control-olympia/ |
| **Total redirects** | **~291** | |

---

## Navigation Hierarchy Diagram

```
got-moles.com
├── /services/
│   ├── /services/total-mole-control-program/    ← NEW (highest priority)
│   ├── /services/one-time-mole-removal/
│   └── /services/commercial-mole-control/       ← NEW
├── /how-it-works/
├── /service-areas/
│   ├── /mole-control-seattle/
│   ├── /mole-control-tacoma/
│   ├── /mole-control-bellevue/
│   └── ... (72 city pages)
├── /about/
├── /reviews/                                     ← NEW
├── /blog/
│   ├── /what-species-of-moles-live-in-washington-state/
│   └── ... (25+ posts)
├── /faq/
├── /contact/
├── /lp/mole-removal/                            ← noindex
├── /lp/mole-trapper/                            ← noindex
├── /lp/mole-protection-plan/                    ← noindex
├── /lp/commercial/                              ← noindex
├── /llms.txt
├── /privacy/
└── /terms/
```
