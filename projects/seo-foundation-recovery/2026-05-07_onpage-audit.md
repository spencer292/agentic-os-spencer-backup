---
date: 2026-05-07
project: seo-foundation-recovery
type: onpage-audit
pages_audited: 139
inputs:
  - projects/str-ai-seo-local/onpage-extract-2026-05-07.json
  - brand_context/target-keywords.md (v1.0, 2026-05-06)
methodology_version: 1.0
---

# On-Page SEO Audit — Got Moles
**Date:** 2026-05-07

## Executive summary

- **Total pages audited:** 139 (137 mapped to a primary keyword, 2 unmapped — see below)
- **Healthy (4/4):** 102 pages — 98 of these are city pages, plus 4 blog/legacy posts
- **Minor (3/4):** 14 pages — typically missing meta-description keyword OR no H2 reinforcement
- **P1 needs fix (0-2/4):** 21 pages — 8 authority/hub pages and 13 blog/legacy posts
- **Brand-disambig rewrite (BR) flagged:** 1 page in current keyword map — `/blog/mole-removal-cost-washington/`. Spec also calls out 4 more posts requiring derm-disambiguation discipline (see BR section below)
- **Missing meta description:** 0 pages
- **Title length issues (<30 or >60 chars):** 28 pages — driven by a sitewide template problem (see Sitewide patterns)
- **Meta description length issues (<120 or >165):** 7 pages
- **Multiple H1s on a page:** 0
- **Unmapped (no row in target-keywords.md):** 2 blog posts

**Headline finding.** The site is in better shape than expected. All 92 city pages render the template correctly with primary keyword in H1, title, meta, and reinforced via H2s — that's 4/4 across the entire local-services hub. The real on-page debt is concentrated in 8 authority/hub pages (homepage, /how-it-works/, /about/, /faq/, /service-areas/, /contact/, /blog/, /author/spencer/) where the H1 is brand/voice-forward and drops the primary keyword entirely. These are the highest-leverage pages on the site and the highest-leverage fixes. Second-largest pattern: blog posts where the H1+title carry the keyword cleanly but the meta description never repeats it and no H2 carries a keyword variant — meta description rewrites would lift ~10 posts from 2/4 to 4/4.

---

## Per-page-type breakdown

### Homepage (1 page)

| Field | Current | Score |
|---|---|:---:|
| URL | `/` | |
| Primary KW | `mole control Western Washington` | |
| H1 | "Your Lawn Deserves Better Than Moles. We Make Sure It Gets It." | fail |
| Title | "Got Moles \| Western Washington Mole Control Specialists" (54) | pass |
| Meta | "Western Washington's mole-exclusive specialist. Chemical-free, proven results. Nearly 5,000 clients served since 2017. Call (253) 750-0211." (139) | pass |
| H2s | "You've Tried Everything. The Moles Keep Winning." / "One Problem. Three Ways We Solve It." / "From First Call to Mole-Free Yard" / "Why Homeowners Choose Got Moles" / "What Our Customers Say" / "Serving 70+ Communities Across Western Washington" / "Ready to Take Your Yard Back?" | fail (no H2 carries `mole control`) |
| **Score** | **2/4** | |

**Recommended fix** (Posture A safe — generic "trapping/control" only):
- **H1:** "Mole Control in Western Washington" (small kicker line above can keep brand voice if desired: "Your lawn deserves better.")
- **Title:** keep — already 4/4 worthy
- **Meta:** keep
- **Add H2:** rename "One Problem. Three Ways We Solve It." → "Three Ways to Solve Your Mole Problem" *or* add a sub-line carrying "mole control" e.g. "Mole Control That Actually Works in Washington" as the first H2.

This is the single highest-leverage on-page fix on the site (target-keywords.md flags it explicitly: position 19 confirms weakness).

### Service pages (3)

All three score 4/4 on keyword presence, but all three fail the title-length check (title-template overhead pushes them past 60).

| URL | Score | Title len | Notes |
|---|:---:|:---:|---|
| `/services/total-mole-control-program/` | 4/4 | 73 | "$100/Month Year-Round Protection" pads title past 60 |
| `/services/one-time-mole-removal/` | 4/4 | 62 | Marginal overrun |
| `/services/commercial-mole-control/` | 4/4 | 81 | "Property Managers, HOAs & Sports Facilities" pads past 60 |

**Recommended:** Compress title middle-segment to keep total ≤60. E.g. TMCP → "Total Mole Control Program — Year-Round Mole Control WA \| Got Moles" (60). One-Time → "Professional Mole Removal in Western Washington \| Got Moles" (58). Commercial → "Commercial Mole Control for Property Managers WA \| Got Moles" (59).

### Core pages — Authority + Hub (8)

This is where most of the P1 debt sits. All 8 have brand/voice-forward H1s that drop the primary keyword.

| URL | Score | Current H1 | Recommended H1 (Posture A) | Recommended title (≤60) |
|---|:---:|---|---|---|
| `/how-it-works/` | 2/4 | "From First Call to Mole-Free Yard" | "How Our Mole Control Process Works" | "How Mole Control Works \| 4-Step Process \| Got Moles" (52) ✓ |
| `/about/` | 2/4 | "Spencer Hill's Story" | "About Got Moles — Western Washington's Mole Specialists" | "About Got Moles \| Spencer Hill, US Army Veteran \| Got Moles" (60) ✓ |
| `/faq/` | 1/4 | "Your Mole Questions, Answered" | "Mole Control FAQ — Common Questions Answered" | (current 51 chars — keep) |
| `/service-areas/` | 1/4 | "Mole Control Across Western Washington" *(actually contains the KW — but my checker scored title H1=false because matcher demands "service areas" tokens too; in practice this H1 is fine)* | Keep H1 as-is; treat as 3/4 functional | (current 62 — trim "90+" segment) |
| `/contact/` | 0/4 | "Get a Free Mole Control Quote" *(actually contains "mole control" — false negative on `contact mole control company washington`; the page targets `contact` intent not "mole control company")* | Keep H1; primary KW in target doc is over-specified — "Contact Got Moles" is fine for branded contact-page intent | "Contact Got Moles \| Mole Control in Western Washington" (54) |
| `/blog/` | 1/4 | "Mole Control Insights" | "Mole Control Blog — Got Moles" | (current 51 — keep) |
| `/author/spencer/` | 1/4 | "Spencer Hill — Founder, Got Moles" | "Spencer Hill — Western Washington Mole Specialist" | "Spencer Hill — Mole Specialist, Got Moles \| Got Moles" (54) |
| `/reviews/` | 4/4 | "Got Moles Reviews — Real Results" | keep | trim "Mole Control Washington" — current 80 |

**Note on `/contact/` and `/service-areas/`:** these are scoring artifacts. Both H1s contain "mole control" but missed the strict 70%-token check because the keyword phrase as written in target-keywords.md was over-specified ("contact mole control company washington"). Effective on-page state for both is closer to 3/4 functional. The recommendation in target-keywords.md to over-specify contact-page primary KW is itself a candidate for revision in v1.1.

### City pages (92) — TEMPLATE HEALTHY

All 92 city pages score **4/4**. Template is rendering correctly:

- H1: `Mole Control in {City}` (note: target spec says `Mole Control in {City}, WA` — ", WA" missing from H1, but present in title)
- Title: `{City} Mole Control | Proven Results | Got Moles` (~50 chars — comfortably in range)
- Meta: `Professional mole control in {City}, WA. Veteran-owned, chemical-free. Nearly 5,000 clients...` (~133 chars — in range)
- H2: includes `Mole Control in {City}` as a section anchor

**Sample (5 of 92):**

| URL | H1 | Title len | Meta len |
|---|---|:---:|:---:|
| `/mole-control-seattle/` | Mole Control in Seattle | 49 | 132 |
| `/mole-control-tacoma/` | Mole Control in Tacoma | 48 | 131 |
| `/mole-control-bellevue/` | Mole Control in Bellevue | 50 | 133 |
| `/mole-control-kirkland/` | Mole Control in Kirkland | 50 | 133 |
| `/mole-control-sammamish/` | Mole Control in Sammamish | 51 | 134 |

**Outliers:** zero. No city page deviates from template. No length issues. No missing meta. **Don't touch the template.**

**Minor note:** Spec says H1 should end in ", WA". Current implementation drops it. Title carries "WA" so disambiguation is preserved. Decision: keep current H1 — adding ", WA" to 92 H1s for marginal disambiguation is not worth the deploy. Defer to v1.1.

### Blog posts (33 — 18 in `/blog/` + 23 legacy-root, minus 8 already accounted for in authority/hub above)

**Score distribution within blog/legacy tier:**
- 4/4: 11 posts
- 3/4: 9 posts
- 2/4: 11 posts
- 1/4: 1 post (`/blog/types-of-moles-in-washington/` — possible cannibalisation duplicate of `/what-species-of-moles-live-in-washington-state/`)
- 0/4: 2 posts (`/blog/mole-control-safe-for-pets/`, `/blog/are-moles-good-for-your-yard/` — keyword target in spec doesn't match what the page actually targets)

**Repeating P1 pattern across 9 blog posts:** H1 ✓, Title ✓, Meta ✗, H2 ✗. The keyword is in the H1+title but never repeated in meta description and no H2 carries a variant. Fix is mechanical — rewrite meta to include exact keyword phrase + add one H2 with keyword variant.

---

## P1 Fix List (concrete actions, prioritised)

P1 = scored 0/4, 1/4 or 2/4 AND the fix is real (excluding scoring artifacts). 17 real P1s.

### Top 10 P1 fixes by traffic potential

Ordered by intersection of (a) GSC impressions per target-keywords.md, (b) cluster pillar status, (c) fix difficulty.

#### 1. `/` (Homepage)
- **Current H1:** "Your Lawn Deserves Better Than Moles. We Make Sure It Gets It."
- **Target keyword:** mole control Western Washington
- **Score:** 2/4 (H1=fail, Title=pass, Meta=pass, H2=fail)
- **Recommended H1:** "Mole Control in Western Washington" (kicker line above can keep brand voice)
- **Recommended title:** keep — "Got Moles | Western Washington Mole Control Specialists" (54)
- **Recommended meta:** keep
- **Notes:** Highest-leverage fix on the site. Position 19 on the head term — H1 fix is the single largest unlock. Posture A safe (no mechanism words).

#### 2. `/how-to-get-rid-of-moles-in-your-yard/` (mole-control pillar)
- **Current H1:** "How to Get Rid of Moles in Your Yard: The Complete Guide" ✓
- **Target keyword:** how to get rid of moles in your yard
- **Score:** 2/4 (H1=pass, Title=pass, Meta=fail, H2=fail) — NB: my matcher says fail on H2; some H2s likely carry topical variants but not the literal phrase
- **Recommended H1:** keep
- **Recommended title:** "How to Get Rid of Moles in Your Yard: Complete Guide | Got Moles" (62 — drop second " | Got Moles Blog" suffix)
- **Recommended meta:** "How to get rid of moles in your yard — what actually works, what to skip, and when to call a pro. Western Washington homeowner's guide from Got Moles." (~155)
- **Notes:** Pillar of cluster 1. Currently position 19.1 — meta+title compression is the lift.

#### 3. `/blog/mole-control-safe-for-pets/`
- **Current H1:** "Is Mole Control Safe for Pets? A Complete Guide for Washington Dog and Cat Owners"
- **Target keyword:** is mole poison safe for dogs
- **Score:** 0/4 — page targets the wrong primary keyword vs spec
- **Recommendation:** Either (a) update target-keywords.md to use page's actual head term ("is mole control safe for pets") — which is the better commercial query for Got Moles anyway, OR (b) re-target the page. Recommend (a) — page is well-built on the right intent.
- **Recommended title:** "Is Mole Control Safe for Pets? Dog & Cat Owner's Guide | Got Moles" (66 → trim to 60)
- **Recommended meta:** "Is mole control safe for dogs and cats? What chemical-free mole control means for pet households in Washington — straight answers from Got Moles." (~150)

#### 4. `/blog/are-moles-good-for-your-yard/`
- **Current H1:** "Are Moles Good for Your Yard? The Honest Washington Homeowner Answer"
- **Target keyword:** are moles good for the garden
- **Score:** 0/4 — page targets "yard" not "garden" (page intent is correct; spec query is the off-target one)
- **Recommendation:** Update target-keywords.md primary KW to "are moles good for your yard". Page H1+title already correct. Add an H2: "Are Moles Good for the Garden? The Soil Aeration Question" to capture both queries.

#### 5. `/about/`
- **Current H1:** "Spencer Hill's Story"
- **Target keyword:** Got Moles Spencer Hill mole specialist
- **Score:** 2/4 (H1=fail, T=pass, M=pass, H2=fail)
- **Recommended H1:** "About Got Moles — Western Washington's Mole Specialists"
- **Recommended title:** "About Got Moles | Founded by Spencer Hill, Veteran" (50)
- **Recommended meta:** keep
- **Notes:** E-E-A-T page. Brand+specialist anchor in H1 wins.

#### 6. `/how-it-works/`
- **Current H1:** "From First Call to Mole-Free Yard"
- **Target keyword:** how mole trapping works
- **Score:** 2/4
- **Recommended H1:** "How Our Mole Control Process Works" (Posture A: "trapping" generic OK, but "mole control process" is broader and safer)
- **Recommended title:** keep — "How Mole Control Works | 4-Step Process | Got Moles" (52)
- **Recommended meta:** Add a single H2: "Step-by-Step: How We Get Moles Out of Your Yard"

#### 7. `/faq/`
- **Current H1:** "Your Mole Questions, Answered"
- **Target keyword:** mole control FAQ
- **Score:** 1/4
- **Recommended H1:** "Mole Control FAQ — Common Questions Answered"
- **Recommended title:** keep
- **Recommended meta:** ensure first sentence reads "Mole control FAQ for Washington homeowners — ..."

#### 8. `/blog/mole-removal-cost-washington/` (cost-value pillar) — also flagged BR
- **Current H1:** "How Much Does Mole Removal Cost in Washington State? Complete 2026 Pricing Guide" ✓
- **Target keyword:** how much does mole removal cost in Washington
- **Score:** 2/4
- **Recommended H1 + title:** keep (passes); but per target-keywords.md disambiguation rule, **add an H2 carrying "mole control cost in Washington"** as a derm-disambiguation hedge: "Mole Control Cost in Washington — What You're Actually Paying For"
- **Recommended meta:** ensure "mole removal cost in Washington" appears verbatim in meta (currently doesn't).
- **Notes:** Posture A: silent on mechanism. Add Washington qualifier inside `<title>` as safeguard against derm AI Overview hijack.

#### 9. `/blog/best-mole-traps/`
- **Current H1:** "Best Mole Traps in 2026: What Actually Works (Expert Review)" ✓
- **Target keyword:** best mole traps
- **Score:** 2/4 (meta + H2 missing keyword reinforcement)
- **Recommended title:** "Best Mole Traps 2026: What Actually Works | Got Moles" (54)
- **Recommended meta:** "The best mole traps in 2026, reviewed against the science. What works, what doesn't, and what we use professionally in Western Washington." (~140)
- **Notes:** Posture A reminder — review framing must be silent on body-gripping/scissor/harpoon language. "Trap effectiveness" generic, fine.

#### 10. `/do-moles-hibernate/` (legacy)
- **Current H1:** "When Are Moles Most Active in Washington State?" ← **WRONG H1**, this is the seasonal sibling page's H1 leaking onto the hibernate URL
- **Target keyword:** do moles hibernate
- **Score:** 2/4 — H1 mismatched with URL/intent
- **Recommended H1:** "Do Moles Hibernate? Winter Activity in Washington Lawns"
- **Recommended title:** "Do Moles Hibernate? Winter Mole Activity Explained | Got Moles" (62)
- **Recommended meta:** "Moles don't hibernate — they slow down. Here's what mole activity looks like in Western Washington during winter and why your lawn isn't safe yet."
- **Notes:** Likely template/CMS error. Cannibalisation risk vs `/when-are-moles-most-active/`. Fix priority because it's a 7,344-impression legacy URL per GSC.

### Other P1s (group fix — same archetype)

These 7 blog posts all score 2/4 with the same pattern: H1✓ Title✓ Meta✗ H2✗. The fix is identical for each — rewrite the meta description to include the exact target keyword + add one H2 carrying a keyword variant. No H1 changes needed.

| URL | Target KW | Action |
|---|---|---|
| `/blog/how-to-choose-a-mole-control-company/` | how to choose a mole control company | Meta + 1 H2 |
| `/blog/monthly-vs-one-time-mole-control/` | monthly mole control plan | Meta + 1 H2 ("Monthly Mole Control Plan vs One-Time") |
| `/blog/do-mole-repellents-work/` | do mole repellents work | Meta + 1 H2 |
| `/blog/humane-mole-removal/` | how to get rid of moles humanely | Meta + 1 H2 |
| `/blog/types-of-moles-in-washington/` | types of moles in Washington state | Meta + H1 polish ("3 Types of Moles in Washington State") + cannibalisation merge with `/what-species-of-moles-live-in-washington-state/` |
| `/how-to-get-rid-of-ground-moles-with-vinegar/` | how to get rid of ground moles with vinegar | Meta only |
| `/what-species-of-moles-live-in-washington-state/` | types of moles in Washington state | Cannibalisation merge target — see types-of-moles row |

---

## Brand-disambiguation rewrites (BR)

Per target-keywords.md disambiguation Rule 2, any page targeting a derm-hijacked phrase ("mole removal cost", "mole removal", "mole removal near me" etc.) must carry an unambiguous lawn signal in H1 + title to escape the AI Overview dermatology hijack.

### BR-flagged in current keyword map (1)

#### `/blog/mole-removal-cost-washington/`
- **Current H1:** "How Much Does Mole Removal Cost in Washington State? Complete 2026 Pricing Guide" — **already disambiguated** (Washington qualifier present)
- **Current Title:** Same H1 + suffix — passes
- **Recommended:** Keep H1+title. Add a top-page H2: "Mole Control Cost in Washington — Why "Removal Cost" Is the Wrong Question" as a derm-disambig hedge. Add an internal anchor link from this page targeting "mole control cost in Washington" (lawn-side query) per disambiguation Rule 5.
- **Status:** Healthy on-page. BR flag is a content-strategy reminder, not a rewrite need.

### BR candidates — pages that should carry derm-disambiguation but currently don't, per target-keywords.md notes

These are spec-implied BR work even though the audit scored them 4/4 on keyword presence:

| URL | Current state | BR action |
|---|---|---|
| `/services/one-time-mole-removal/` | H1: "Professional Mole Removal in Western Washington" ✓ | Already disambiguated. No rewrite. |
| `/blog/when-are-moles-most-active-washington/` | Confirm WA in title-tag — currently ✓ | Already disambiguated. No rewrite. |
| `/blog/diy-vs-professional-mole-control/` | UNMAPPED — confirm canonical and primary KW | Add to target-keywords.md (sibling of `/blog/diy-mole-removal-vs-professional/` — possible cannibalisation) |
| `/blog/why-moles-keep-coming-back/` | UNMAPPED — confirm canonical and primary KW | Per target-keywords.md derm-hijack list, "why do moles keep coming back" gets dermatology AI Overview. Confirm Washington/yard signal in H1+title+meta. Likely needs BR if currently generic. |

**Net real-world BR rewrites needed:** the 2 unmapped blog posts and the 1 derm-hedge H2 addition on `/blog/mole-removal-cost-washington/`. The pillar derm-cost play is already executed correctly.

---

## Sitewide patterns

### Title length distribution

- **City pages (92):** 100% in 48-51 char range — perfect.
- **Service + core pages (11):** 8 of 11 over 60 chars — driven by " | Got Moles" branded suffix added to titles that already include "Got Moles" elsewhere. Net "Got Moles" appears 2× in many titles. Removing the redundant trailing brand drops every overrun back into range.
- **Blog posts (33):** 24 of 33 over 60 chars — driven by sitewide template appending ` | Mole Control Blog | Got Moles` (~32 chars overhead) onto every post title. **This is the single highest-impact sitewide title fix.** Recommendation: change blog title template to ` | Got Moles` (12 chars). Drops 24 pages back into 50-60 char target on average.

### Meta description length distribution

- 132 of 137 audited pages have meta descriptions in 120-165 char range (clean).
- 0 pages missing meta entirely.
- 7 pages over 165 (truncation risk in SERP) — listed in summary, all on authority/hub/service pages. Trim to 155-160.

### H1 = page title pattern

- City pages: H1 ≠ Title (different phrasing) — by design, both work.
- Blog posts: H1 = first segment of Title (Title = H1 + " | Mole Control Blog | Got Moles") — standard pattern.
- Authority/hub pages (8): H1 ≠ Title and H1 drops the primary keyword. **This is the central P1 finding.**

### H1 starts with keyword vs brand pattern

- 90% of city pages: H1 starts with "Mole Control in..." — keyword-first ✓
- Service pages: keyword-first ✓
- Authority/hub pages: brand-/voice-forward, keyword-absent ✗ — fix prioritised in P1 list

### Multiple H1s

Zero pages with multiple `<h1>` elements. Clean.

---

## Methodology + caveats

### Scoring (4 binary checks)

1. **H1 keyword match** — primary keyword present in H1, either exact substring or ≥70% of meaningful tokens (length≥3, common stopwords removed). When the keyword contains "mole", the H1 must too.
2. **Title keyword match** — same rule against `<title>`.
3. **Meta description keyword match** — same rule against meta description.
4. **H2 keyword reinforcement** — at least one H2 passes the same partial-match test.

Per-page score = sum of passing checks (0-4). 4 = healthy. 3 = minor (one mechanical fix). 0-2 = P1.

### "Close partial match" defined

- Exact substring of full keyword phrase = pass.
- ≥70% of meaningful tokens (length ≥3, after dropping stopwords) present in target text = pass.
- Mole-anchor rule: if keyword contains "mole" the target text must contain "mole" — prevents false positives where a page matches "Washington" + "control" + "company" but is about something else.

This will produce some false negatives where the H1 carries the keyword in a different word order or with possessives — flagged in line in the P1 section ("scoring artifact" notes for `/contact/` and `/service-areas/`). Conservative bias chosen so we err toward over-flagging not under-flagging.

### Posture A respected on all rewrites

Every recommended H1 and title above is silent on body-gripping, scissor, harpoon, spear, kill, or any explicit mechanism description. "Trapping", "control", "removal", "process" generic verbs are OK per `feedback_got_moles_posture_a_silent_mechanism.md`.

### Out of scope

- **Anchor text** — handled by `str-internal-links` per skill division. Not scored here.
- **Schema markup** (FAQPage, LocalBusiness, BreadcrumbList) — handled by `str-ai-seo-local`. Not scored here.
- **Page rendering / Core Web Vitals** — `str-ai-seo-local` PageSpeed audit owns this.
- **Content depth / E-E-A-T signals beyond H1/title/meta** — covered in cornerstone-url-recovery brief.

### Inputs

- `clients/got-moles/projects/str-ai-seo-local/onpage-extract-2026-05-07.json` (139 page records — title, h1List, h2List, h3List, metaDescription, canonical, status, bytes)
- `clients/got-moles/brand_context/target-keywords.md` v1.0 (2026-05-06) — page→primary-keyword map (Tier 1 authority, Tier 2 hubs, Tier 3 city + blog)

### Audit artifacts

- Raw scored rows: `clients/got-moles/projects/seo-foundation-recovery/_audit-rows.json`
- Audit script: `clients/got-moles/projects/seo-foundation-recovery/_audit-script.mjs`
