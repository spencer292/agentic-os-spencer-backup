---
site: got-moles.com
date: 2026-05-31
mode: single-page audit (QW-01 diagnosis — NO fixes applied)
page: /how-to-get-rid-of-moles-in-your-yard/
tier: 1 (cornerstone / cluster pillar)
page_score: 77.8/100
band: Good (75-89) — Tier 1, so remaining gaps escalate to P1
fixes_p1: 2
fixes_p2: 4
fixes_p3: 3
status: draft
---

# QW-01 — Cornerstone On-Page Audit: `/how-to-get-rid-of-moles-in-your-yard/`

**Diagnosis only. No edits made. No deploy.** Pairs with `projects/str-ai-seo-local/2026-05-31_cornerstone-full-scan.md` (GSC: 512 imp / **0 clicks** / avg pos **26.6** across 92 queries; page indexed clean, 7,750 words, page-2-stuck).

> **Correction note (Rule C earned its keep):** an earlier draft of this audit claimed the cornerstone was "orphaned — zero inbound links" and that `how-deep-do-moles-dig` had an H1 cannibalization bug. **Both were wrong** and were overturned by live extraction + source grep before saving. The cornerstone has ~11 inbound internal links in source (2 of the 3 rivals link to it live); how-deep's live H1 is correctly "How Deep Do Moles Dig?". Those false findings are removed. This is the corrected version.

**Verdict in one line:** The cornerstone is **well-built** (good schema, BLUF, E-E-A-T, 48 outbound + ~11 inbound links). Its 0-clicks-at-pos-26.6 problem is **query-level cannibalization + youth**, not page quality or link architecture: the older, higher-equity **vinegar page (published 2024-08-29, ranks pos 3)** intercepts the cornerstone's own head term, while the cornerstone (published 2026-04-19) is still accruing authority. The surgical levers are anchor-signal concentration, closing the one missing rival→pillar link, and AEO on-page refinements — **not** "add more links."

---

## Three-Layer Source-of-Truth reconciliation (Rule A)

| Layer | State |
|---|---|
| **Live render** | `https://got-moles.com/how-to-get-rid-of-moles-in-your-yard/` → 200, `x-vercel-cache=HIT`, no `Last-Modified` header. 131,516 bytes. 1 H1, 15 H2, 6 JSON-LD blocks, 48 internal links. |
| **HEAD / working tree** | `src/lib/blog-data.ts:938–998`. Title correct & exact-match to recommended H1. Last touched by commit `0e9a3502` (internal-linking Phase 3). Working tree clean for this entry. |
| **CMS (Payload/Supabase)** | NOT probed — and **not required this run**: live render fully reconciles with source (H1, schema, links all match expectations), so no divergence signal. A CMS probe is only needed in the fix phase if a reseed is involved. |

No unexpected divergence. (The earlier draft's "divergence" was an artifact of writing before fetching — disproven.)

---

## Foundation-doc lookup (Rule F)

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | how to get rid of moles in your yard | H1 "How to Get Rid of Moles in Your Yard: The Complete Guide" | ✅ |
| Recommended H1 | "How to Get Rid of Moles in Your Yard: The Complete Guide" | exact string live | **exact** |
| Disambiguation signal | Rule 1: yard/lawn/Washington | "in Your Yard" + "Western Washington" throughout | ✅ |
| Secondary cluster KWs (≥2) | "how to get rid of moles", "how to get rid of moles in lawn", "best way to get rid of moles" | None carried verbatim in H2/H3 — H2s are step-labels / statements | ❌ **MISSING** |
| Queries-to-avoid | derm / cosmetic / body-gripping / DIY-product | none in title/H1/FAQ | ✅ none |

---

## Live verification log (Rule C)

- **Schema:** 6 JSON-LD blocks parsed via raw-HTML extractor: `Organization`, `BlogPosting`, `DefinedTerm`, `FAQPage`, `BreadcrumbList`, `Person`. No parse errors. BlogPosting carries author `@id`→`/about/#spencer-hill`, publisher `@id`, `dateModified`, `mainEntityOfPage`, `speakable` (h1 + #blog-definition-block + .blog-faq-answer), and `citation` (WSU FS146E via `blog-citations.ts`).
- **Headings:** 1× H1 (exact-match ✅). 15× H2 — only **1** is question-format ("Does the Method Change Based on Which Mole Species You Have?"); rest are step-labels/statements. (Skill 2.4 wants ≥half as natural-language questions.)
- **Internal links (raw HTML):** **48 outbound** internal links (services ×, 3 city pages, voles/gophers, what-do-moles-eat, grub-control, types-of-moles, author, service-areas, contact — strong + diverse). **Inbound (source grep, blog-data.ts):** ~11 contextual links from sibling posts (lines 402, 1044, 1119, 1254, 1308, 1374, 1499, 1559, 1613, 1739, 1919) + 301 from `/blog/how-to-get-rid-of-moles` (`redirects.ts:267`). `target-keywords.md:111` "linked from 8+ posts" = **TRUE**.
- **Headers:** `x-vercel-cache=HIT`; no `Last-Modified`.

**Cannibalization rival cross-check (live + source):**

| Rival page | Published | Live H1 | Links TO cornerstone (live) |
|---|---|---|---|
| `how-to-get-rid-of-ground-moles-with-vinegar` | **2024-08-29** | "How to Get Rid of Ground Moles with Vinegar" | ✅ 1 — anchor "what actually works to get rid of moles" |
| `how-deep-do-moles-dig` | 2025-04-01 | "How Deep Do Moles Dig?" (correct) | ✅ 1 — anchor "how to get rid of moles in your yard" |
| `are-moles-nocturnal` | 2025-02-01 | "Are Moles Nocturnal?" (correct) | ❌ **0** |

> **The cannibalization is query-level, not H1-level.** Each rival has its own correct primary keyword. But the vinegar page is 8 months older with more accrued equity, so per the GSC scan it **outranks the cornerstone (pos 3 vs ~17) for the cornerstone's own head term "how to get rid of moles in your yard"**. The cornerstone is the newest page in the cluster (2026-04-19) and still climbing (pos 34→26).

---

## Pillar scores

| # | Pillar | Wt | Score | Notes |
|---|---|---|---|---|
| 1 | Headings | 20% | **16.0** | 1 H1, exact-match + disambiguation ✅; no skipped levels ✅. But no H2/H3 carries a secondary cluster KW (Rule F row 4) ❌ |
| 2 | Meta + Canonical | 10% | **8.5** | No `seo` object → title falls back to post.title (52 chars, carries KW ✅, **no brand**). Meta desc = excerpt (~140 chars, under 150–160, leads "Most DIY…" not KW, has an em dash) 0.5. Canonical self-ref ✅, OG ✅, Twitter ✅, og:image ✅ |
| 3 | Schema | 15% | **14.0** | 6 blocks incl BlogPosting + Breadcrumb + FAQPage + Organization (knowsAbout + hasOfferCatalog) + Speakable + DefinedTerm + author/publisher `@id` + WSU citation ✅. Minor: `dateModified`=publishDate (no real modified date); `wordCount` not passed |
| 4 | Content shape (AEO) | 20% | **14.0** | BLUF present but **~85 words (target 40–60) + em dash** 0.5. H2 sections open narrative, not a 40–75w direct answer 0.5. Question-format H2s ❌ (1 of 15). Cited-stat cadence ✅ (WSU FS146E, 55–93%, 60–80%). Structured asset: stat block ✅ but **no comparison table** (`post.table` absent — and the renderer fully supports it) 0.5. Verified-fact callouts ✅. No queries-to-avoid ✅. No visible TL;DR ✅ |
| 5 | Internal links | 15% | **12.5** | **Inbound ✅ (~11, >2 required)** — corrected. Outbound ✅ (48). Anchor diversity ✅ (varied: "how to clear moles from your yard", "getting rid of moles in your yard", "what actually works", "how to get rid of moles"). No 301-hop targets spotted ✅. Hub-spoke: receives spoke links ✅ BUT one direct rival (`are-moles-nocturnal`) doesn't link up ❌; head-term anchor signal is diffuse rather than concentrated |
| 6 | Images | 5% | **3.5** | Hero is a styled gradient header (text H1, not `<img>`); featured image used for og only (`.webp` ✅, og:image ✅). No inline body images to alt-audit. Hero not `<Image priority>` (CSS gradient) |
| 7 | E-E-A-T | 10% | **6.0** | Byline "Spencer Hill"→`/author/spencer/` ✅; author Person `@id` ✅; founder quotes in body ✅. But Person schema has **no `sameAs`** (LinkedIn) ❌; WSU cited as **plain text, not an outbound `<a>`** ❌ (Pillar wants ≥1 outbound authority link in body) |
| 8 | Freshness + disambiguation | 5% | **3.3** | Visible "Updated {date}" ✅ (from updatedAt); title+H1 disambiguation ✅. But Article `dateModified` defaults to publishDate 0.5; **no `Last-Modified` header** ❌ |
| | **TOTAL** | | **77.8/100** | Band: Good — Tier 1, so the 2 structural gaps are treated P1 |

---

## Prioritised fix list (for the fix phase — NOT applied here)

### P1 — addresses the 0-clicks / page-2 problem directly
1. **Concentrate the head-term anchor signal + close the missing rival link (Pillar 5).**
   - Add a contextual inbound link from **`are-moles-nocturnal`** (currently 0 → cornerstone) with anchor **"how to get rid of moles in your yard"** (Rule 5).
   - On the **vinegar page** (the pos-3 interceptor), strengthen/foreground its existing cornerstone link so the *head-term* intent visibly defers to the pillar (it already links with a softer "what actually works" anchor — add/upgrade one exact-match "how to get rid of moles in your yard" anchor high in the body). Goal: pass head-term equity from the older page *to* the pillar rather than competing.
   - *File: `src/lib/blog-data.ts` section bodies; markdown links already supported by the Lexical renderer.*
2. **H2 secondary-keyword alignment (Pillar 1 + 4).** Reshape 2–3 step-label H2s into question/keyword form carrying secondary cluster KWs — e.g. "How Do You Get Rid of Moles in a Lawn?", "What's the Best Way to Get Rid of Moles in Your Yard?" — without restructuring the article. Directly targets the secondary head terms the page currently rank-buries.

### P2 — on-page AEO focus (surgical, no rewrite)
3. **Tighten BLUF to 40–60 words + remove em dash (Pillar 4).** Lead with the direct answer; humanizer ZERO-em-dash rule.
4. **Add one comparison table (Pillar 4).** A works-vs-doesn't / DIY-vs-pro table (`post.table` is fully supported by `BlogPostContent` renderer) — high AI-extraction value, currently absent.
5. **E-E-A-T outbound link (Pillar 7).** Convert the WSU FS146E *text* mention into an outbound `<a>` to the WSU Extension fact sheet (Cluster-1 authority anchor in `authority-strategy.md`).
6. **Make a few H2 sections open with a 40–75-word direct answer (Pillar 4)** before elaborating — chunked self-contained extraction.

### P3 — hygiene
7. **Add `seo.metaTitle` + `metaDescription`** to the cornerstone entry: brand in title ("…| Got Moles"), KW-led 150–160-char meta.
8. **Add a real `dateModified`** (refreshes the freshness signal; surfaces "Updated" honestly).
9. **Person `sameAs`** (Spencer LinkedIn) in `schema.tsx` — sitewide E-E-A-T lift, not cornerstone-specific.

---

## What this audit did NOT do
- No code edits, no reseed, no deploy (diagnosis only).
- Did not CMS-probe Supabase (live↔source reconciled cleanly; only needed if the fix phase reseeds).
- Live evidence gathered via temporary `site/_qw01-extract.mjs` + `site/_qw01-h1probe.mjs` (read-only fetches). **Cleanup pending:** `rm` is denied by sandbox policy — these two temp files should be deleted manually, or left alongside the existing `site/_probe-*.mjs` family.

## Methodology honesty note
This audit's first draft asserted two findings ("orphaned"/"H1 bug") that live verification disproved. Per skill Rule C and Rule H, the scores and verdict above derive **only** from captured live evidence (extractor output + source grep), not from pre-fetch assumptions. The 0-clicks cause is reframed: query-level cannibalization by an older sibling + page youth, on an otherwise healthy page.
