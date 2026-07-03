# Per-Post SEO/GEO Audit Checklist

**Purpose:** Single canonical checklist run against every blog post (35 total: 19 standard + 16 legacy-root) to confirm SEO/GEO readiness before DNS flip.

**Source playbooks:**
- `projects/briefs/website-rebuild-rebrand/BUILD-PROCESS-BLOG.md`
- `projects/briefs/website-rebuild-rebrand/PAGE-BUILD-REFERENCE.md`
- `projects/briefs/website-rebuild-rebrand/2026-04-02_geo-citation-strategy.md`
- `.claude/skills/str-ai-seo/references/content-patterns.md`
- `.claude/skills/str-ai-seo/references/authority-signals.md`

**Pass criteria:** Every checkbox green or explicit waiver noted with reason.

---

## Section A — Content Structure (per content-patterns.md)

- [ ] **Definition Block lead** — Post opens (or has an H2 within first 150 wc) with `[Term] is [concise definition]` extractable sentence. AI retrieval pattern.
- [ ] **BLUF paragraph** — First 100 words contain the standalone, AI-extractable answer to the post's primary query.
- [ ] **Step-by-step block** — If post is how-to, has numbered list with bold step names. Voice/list snippet eligibility.
- [ ] **Comparison table** — If post is "X vs Y", has markdown table with criteria rows + "Best for" row + bottom-line recommendation.
- [ ] **Pros/cons block** — If post is evaluation ("Is X worth it?"), has explicit Pros and Cons sub-sections with bold benefit/drawback names.
- [ ] **FAQ block** — 3-5 Q&A at the bottom. Real homeowner questions, not made-up filler.
- [ ] **Statistics + named entities** — Specific verifiable data: percentages, counts, named species (Townsend's mole), named WA cities, dates, prices.
- [ ] **Self-contained answer block** — Each H2 section can stand alone as an answer to a sub-question. AI extracts at section level.

## Section B — GEO / AEO Signals (per geo-citation-strategy.md)

- [ ] **Specific WA city references** — At least 5 named cities from: Sammamish, Bellevue, Kirkland, Issaquah, Seattle, Tacoma, Puyallup, Federal Way, Renton, Kent, Enumclaw, Sammamish Plateau, Auburn, Burien.
- [ ] **County names** — King, Pierce, Snohomish, Thurston counties referenced where relevant.
- [ ] **Three native species references** — Townsend's mole (*Scapanus townsendii*), Pacific Coast mole (*Scapanus orarius*), Shrew mole (*Neurotrichus gibbsii*) named where relevant.
- [ ] **Soil specificity** — Glacial till, alluvial clay, Puget Lowland, amended garden soil where relevant.
- [ ] **Got Moles trust signals** — At least 2 of: "5,000 clients since 2017", "219+ five-star Google reviews", "15+ years", "chemical-free", "veteran-owned" naturally woven in (not stuffed).
- [ ] **External citations where useful** — WDFW, WSU Extension, Washington Department of Health, peer-reviewed ecology references for scientific claims.
- [ ] **Speakable schema** — JSON-LD on the post page marks the BLUF + at least 1 FAQ answer as voice-extractable via cssSelector.
- [ ] **Definition block matches AI query format** — "What is [X]?" / "How do moles [X]?" / "Are moles [X]?" formats present in H2s where natural.

## Section C — Schema (must use canonical helpers from `lib/schema.tsx`)

- [ ] **`articleSchema()`** — `JsonLd data={articleSchema({...})}` at top of post page. Author, date, image, URL.
- [ ] **`breadcrumbSchema()`** — Standard or legacy-root breadcrumb depending on `urlPattern`.
- [ ] **`faqSchema()`** — If FAQ block present, schema fires from canonical helper (NOT inline JSON-LD).
- [ ] **No inline JSON-LD** — All schema goes through helpers in `schema.tsx`. If a needed schema type doesn't have a helper, ADD one (don't write inline).
- [ ] **Rich Results Test passes** — Validate at https://search.google.com/test/rich-results. No errors. Eligible for at least: Article, BreadcrumbList. Eligible for FAQ if FAQ block present.

## Section D — Field Completeness (per BUILD-PROCESS-BLOG.md `BlogPost` interface)

Audit by querying Payload for the post's record. Each field must be populated:

- [ ] `title` — present, < 100 chars
- [ ] `slug` — kebab-case, matches URL
- [ ] `excerpt` — 100-160 chars, standalone-readable
- [ ] `publishDate` — set, not future-dated
- [ ] `author` — linked to Spencer Hill (or Cory Ventura where appropriate)
- [ ] `keywordCluster` — one of: mole-control, biology, safety, cost-value, seasonal, diy-pro
- [ ] `seoMetaTitle` — 50-60 chars, keyword-forward (`{Primary Query} | Got Moles`)
- [ ] `seoMetaDescription` — 120-160 chars, compelling, non-duplicate
- [ ] `seoPrimaryKeyword` — set
- [ ] `definitionBlock` — populated (for DefinedTerm-type schema, used in BLUF render)
- [ ] `featuredImage` OR fallback in BOTH maps (`blog/page.tsx` + `BlogPostContent.tsx`)
- [ ] Body word count appropriate to tier:
  - Cornerstone: 1,500+ wc
  - Standard: 1,200+ wc
  - Legacy-root: 1,000+ wc
- [ ] `urlPattern` correct: `legacy-root` for indexed-URL posts, `blog` for new content

## Section E — Internal Linking (per geo-citation-strategy.md topical authority)

- [ ] **≥3 internal links to related blog posts** — same cluster preferred
- [ ] **≥1 internal link to a city page** — `/mole-control-{city}/` matching post relevance
- [ ] **≥1 internal link to a service page** — TMCP / one-time-removal / commercial as relevant
- [ ] **Reverse links exist** — at least 1 other post links TO this post (cluster cross-linking)
- [ ] **Anchor text diversity** — not all links use exact-match keyword anchor; mix natural phrasing

## Section F — Technical SEO

- [ ] **Canonical tag** — points to the correct URL (legacy-root vs `/blog/{slug}/`)
- [ ] **Meta robots** = `index, follow` — verify not noindexing (staging middleware uses host-based check; verify production)
- [ ] **OpenGraph + Twitter card** — Both present, OG image set (per-post or default `/images/og-default.webp`)
- [ ] **Image alt text** — Featured image has descriptive alt text including primary keyword (natural, not stuffed)
- [ ] **Heading hierarchy** — One H1 only; H2s for main sections; H3s for sub-sections; no heading-skip
- [ ] **No broken internal links** — every `[text](/url)` in body resolves to a 200 page
- [ ] **Lighthouse SEO ≥95** — verify on a sample run

## Section G — E-E-A-T Signals (per authority-signals.md)

- [ ] **Author byline visible** — Spencer Hill name + credentials shown on the post page (already in BlogPostContent)
- [ ] **Author schema** — Person schema embedded in articleSchema (or separate)
- [ ] **Date visible on page** — both publish date and (if updated) modified date
- [ ] **Citation chain** — body text cites at least 1 external authority (WDFW, WSU Extension, peer-reviewed) where relevant
- [ ] **First-person experience signals** — "we've seen", "across our 5,000 client jobs", "Spencer's 15 years" naturally woven where useful
- [ ] **Got Moles `LocalBusiness` referenced** — via `publisher` in articleSchema

## Section H — Brand / Voice Compliance (per CLAUDE.md client rules)

- [ ] **US English** — no "behaviour", "colour", "centre", "programme", "specialise" — sweep with grep
- [ ] **No "only mole-exclusive" claim** — competitors exist (memory `feedback_got_moles_no_only_claim.md`)
- [ ] **Guarantee scope correct** — guarantee attaches to One-Month Eradication only, not sitewide (memory `feedback_guarantee_scope.md`)
- [ ] **No "WA's #1"** — unsubstantiated (per CLAUDE.md)
- [ ] **"15+ years" = Spencer's experience** — clearly distinguished from "since 2017" (Got Moles company age)
- [ ] **"5,000 clients" OK** — confirmed safe to publish
- [ ] **"219+ five-star Google reviews"** — canonical reference
- [ ] **Brand voice** — Spencer's direct, confident, plain-language register matches `voice-profile.md`

## Section I — Humanizer Gate (mandatory)

- [ ] Post content scored ≥ 8.0 in `tool-humanizer` deep mode
- [ ] No obvious AI tells: rule-of-three lists, "Moreover/Furthermore" transitions, "delve/tapestry/multifaceted/landscape" vocabulary
- [ ] Sentence-length variance present (not all medium-length)
- [ ] Em-dash usage natural (~1 per 250-300 wc, not heavier)

---

## Audit execution

For each of the 35 posts, run this checklist. Capture results in
`reports/04_per-post-audit-results.md` with one section per post and a
pass/fail/waiver verdict per checkbox.

Posts in priority order:

**Cornerstones (4)** — biggest at-stake, audit first
- how-to-get-rid-of-moles
- types-of-moles-in-washington
- mole-vs-vole-vs-gopher
- what-do-moles-eat

**High-rank legacy-root (3)** — protect existing rankings
- how-many-eyes-do-moles-have (46 top-3 kw at risk)
- do-moles-bite (14 top-3)
- do-moles-carry-diseases (4 top-3)

**Create-new (1)** — proof-of-concept already audited live
- what-species-of-moles-live-in-washington-state

**Other legacy-root (12)** — completeness
- are-moles-nocturnal, are-moles-poisonous-or-venomous, can-moles-swim, do-moles-live-in-groups, how-deep-do-moles-dig, how-many-babies-do-moles-have, how-to-get-rid-of-ground-moles-with-vinegar, is-a-mole-a-rodent, what-attracts-moles-to-your-yard, what-do-mole-holes-look-like, what-eats-moles, why-do-moles-make-molehills

**Standard /blog/ (15)** — full audit
- are-moles-blind, are-moles-good-for-your-yard, best-mole-traps, diy-vs-professional-mole-control, do-mole-repellents-work, does-grub-control-stop-moles, how-long-do-moles-live, how-to-choose-a-mole-control-company, how-to-find-active-mole-tunnels, humane-mole-removal, mole-control-safe-for-pets, mole-removal-cost-washington, monthly-vs-one-time-mole-control, when-are-moles-most-active-washington, why-moles-keep-coming-back

---

*Checklist created 2026-04-24. Living document — extend as new playbook rules are discovered.*
