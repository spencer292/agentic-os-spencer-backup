---
project: paid-search-landing-pages
type: build-plan
status: ready-to-build (Redmond proof first, then roll to all 23)
level: 2
created: 2026-05-24
parent_brief: brief.md
pairs_with: 2026-05-23_no-video-lp-template-spec.md · 2026-05-23_lp-copy-additions.md · 2026-05-23_lp-fixes-todo.md
keywords_source: ../../../../projects/briefs/got-moles-paid-search/2026-05-23_exact-match-universe.md
build_from: clients/got-moles/projects/briefs/website-rebuild-rebrand/site
deploy: edit code → npx next build → git push mine main → Vercel. NO staging. NO CMS/seed (LPs render from lp-city-data.ts). Two machines active — fetch + check ahead/behind before every push.
---

# Got Moles LP Conversion Build — Plan (canonical)

**Goal:** get all 23 `/lp/{city}/` pages up *correctly* — conversion-first, human/empathy-led,
QS-aware, with REAL imagery. Optimised for the worried homeowner ("honour where they are — let them
see themselves in the mirror"), not for organic SEO (LPs are noindex), but keeping enough keyword
coverage for AdWords Quality Score.

## Current state (already LIVE, 2026-05-24)
- 23 LPs render from ONE dynamic route `src/app/(frontend)/lp/[city]/page.tsx` + `src/lib/lp-city-data.ts` (`LP_CITIES` + `buildLpBlocks`). No per-city files. No CMS (the `city-pages` Payload collection is an unused footgun).
- Done + audit-clean (`scripts/_got-moles-lp-audit.mjs` = 23 · 0 flags): FAQ block + FAQPage schema (FAQBlock self-emits — do NOT add faqSchema in route), geoDefinition local-proof (Speakable), hero `fetchPriority="high"` (HeroBlock).
- The 5 originals (seattle/tacoma/kent/bellevue/kirkland) migrated into the template; custom meta tails preserved via `LpCity.metaTail`.
- **Redmond currently carries an AI after-hero + side-by-side AI before/after block — TO BE REVERTED** (see below). AI after images committed (`public/images/lp-ba-*-after.webp`, `hero-lp-*.webp`) — parked/unused under the new plan.

## Decisions locked
- **Images: REAL before photos as heroes. NO AI afters.** Real "after" photos come from Spencer later. (Roy uncomfortable with AI afters.) Befores live in `brand_context/pictures/Before Mole pics/` (14 WhatsApp photos). Chosen 5 (by look): barn `30 (1)` (landscape), landscaped-home `30`, split-level `51.05`, acreage `31 (1)`, front-yard `31 (7)`.
- **Layout:** real before = hero (top, big). NO side-by-side before/after (invites scrutiny of fakes — moot now, but keep befores-only). Real afters later go small/lower if used.
- **Hero H1 = option C:** "Moles Tearing Up Your {City} Lawn? We'll End It." (one-time-safe — "end this", not permanence).
- **Trust block** before the final CTA: ImageText with a **team group photo** (from the `145A07xx` forest shoot) + the "deal with Spencer & his crew" line. Spencer video drops here later.
- **Claim discipline** (memory `feedback_got_moles_claim_discipline`): permanence ("for good"/"never again") ONLY on TMCP block; one-time = clear CURRENT moles; "guarantee" = payment promise (pay only if we catch), never biological eradication.
- **FAQ:** replace the raw `city-data.ts` FAQs with a clean standard set (cost/safety/recurrence/speed/disease/service-area) + 1–2 curated city-specific. Fixes the live Posture-A "legal in Washington / wildlife regulations" line (in Bellevue + others).

## H2 keyword template (one template, all 23 — from the exact-match universe, 915 kw / ~7 themes)
| Section | Covers exact-match variants |
|---|---|
| H1 + hero | mole removal/control {city} + yard |
| "{City}'s Mole Control & Removal Specialists" | mole control/removal/exterminator/service {city} |
| "Not Sure It's Moles in Your Yard?" (richContent B) | moles in yard / yard mole removal / mole control in yard |
| "A Mole Specialist, Not a Pest Control Company" (richContent) | pest control mole removal / mole control companies |
| "How Your {City} Mole Service Works" (stepsProcess) | mole service / mole control service |
| "Why Moles Thrive in {City}" (geoDefinition local-proof) | {city} local relevance |
| "{City} Mole Control — Common Questions" (faq) | cost/safety/recurrence (UX) |
Note: "pest control" used ONLY as the contrast (we're specialists, not pest control) per voice profile (never use it about ourselves). "Exterminator" = service-category term, Posture-A-safe, use lightly.

## Calibrated copy (Redmond — template with {City}/{neighborhoods})
- **H1:** Moles Tearing Up Your Redmond Lawn? We'll End It.
- **Subheading (pain-first BLUF):** Fresh mounds every morning. Tunnels that collapse when you mow. A lawn you've worked hard on — going lumpy and bare. You haven't done anything wrong: moles are relentless, and they don't stop on their own. We're Redmond's mole specialists. We do one thing, we don't guess, and you only pay the balance if we actually catch them. **$150 to start. $450 max.**
- **Specialist block:** Most companies chase every bug and rodent under the sun. We don't. We do one thing — moles — across nearly 5,000 Washington yards since 2017. That focus is why we clear them when the general pest-control guys can't. We're the mole exterminators Redmond homeowners actually call.
- **"Not sure it's moles?":** Volcano mounds of fresh soil (often overnight) · spongy raised ridges underfoot · brown dying patches where roots are cut · damage that keeps spreading no matter what you try.
- **"Tried castor oil/repellents/sonic spikes?":** Most homeowners call us after the home remedies. They might shift a mole for a day or two — but they don't clear an active tunnel network. The mole routes around them and the mounds come back. We read the active runs and work them every week until your yard is clear.
- **Trust:** No call center. No franchise. Got Moles is Spencer Hill and his team — veteran-owned, Washington-based, focused on moles since 2017. When you call, you're talking to the people who'll actually clear your yard.
- **FAQ topics:** cost · safe for pets & kids · will they come back (→ honest recurrence + TMCP) · how fast · do moles bite · do you service {City}.
- **TMCP block (existing):** keeps the permanence/"never worry again / year-round" language — the ONLY place it's true.

## Voice (brand_context/voice-profile.md)
Trusted Local Expert. Confident + warm + direct. Empathy → specificity ("we only do moles") → proof → path. BLUF. Short declarative + landing lines. NEVER: "pest control" (about us), "solutions", "affordable/cheap", "try/attempt", trap-mechanism/jargon. Run all copy through **tool-humanizer ≥8.5**.

## Build sequence
**A. Redmond proof (one page, live):**
1. Make hero-sized BEFORE crops (sharp → ~1600×900 webp, mounds visible) for the 5 befores.
2. Revert Redmond: real before hero (drop AI after-hero); remove the side-by-side beforeAfter block.
3. Hero copy (C + subheading). Add richContent blocks (specialist / is-it-moles / tried-DIY) — needs Lexical builders (import/replicate makeLexical/makeParagraph from pages-data.ts).
4. FAQ → clean standard set + curated city-specific (Posture-A clean).
5. Trust ImageText block (team photo → compress to webp) before final CTA.
6. Humanizer ≥8.5. `npx next build`. Push. Verify `/lp/redmond/` live + re-audit.
**B. Roll to all 23:** template the above (H2s identical, `{City}` swapped), map 5 befores by look, push, re-audit (23 · 0 flags).

## Pair / hero mapping (5 befores → 23 cities, by look)
- barn/rural (`30 (1)`): enumclaw, buckley, woodinville, maple-valley
- landscaped suburban (`30`): bellevue, kirkland, sammamish, redmond, issaquah
- split-level home (`51.05`): seattle, shoreline, burien, kenmore, des-moines, federal-way
- acreage/wide (`31 (1)`): puyallup, south-hill, fife, tacoma
- front-yard (`31 (7)`): kent, renton, tukwila, covington

## Open / after the build
- **#4 PageSpeed mobile CWV** (redmond/puyallup/kirkland): LCP<2.5s, INP<200ms, CLS<0.1.
- **#5 Point exact-match ad groups at `/lp/{city}/`** (paid window) — this activates the QS benefit. ~3-5 days later check QS lift (`scripts/_got-moles-qs.mjs`).
- Real Spencer **after** photos + **video** → drop into trust/after slots.
- Fix **Buckley county** in `city-data.ts` (King → Pierce) — organic page.
- **Seattle** has no exact-match list — confirm its ad keywords separately.
- Decide: delete the parked AI after images or keep for reference.

## Constraints
Posture A (no trap-mechanism/kill) · US English · humanizer ≥8.5 · deploy `git push mine main` only (never Vercel CLI) · no Blob (static webp in public/images) · two machines → fetch+check before push.
