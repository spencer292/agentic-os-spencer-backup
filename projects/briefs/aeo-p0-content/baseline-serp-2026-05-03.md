---
title: AEO P0 — Pre-Phase-4 Google SERP Baseline
date: 2026-05-03
phase: Phase 4 measurement (SERP half)
ai_baseline: pending — needs Roy's browser session for Perplexity/ChatGPT/Claude/Gemini
---

# Pre-Phase-4 Google SERP Baseline

Snapshot of organic Google rankings for each of the 9 P0 page target queries, captured immediately after Phases 1-3 content/schema work shipped (commits 3e763d2 → b9b2b38). Citation schema (b9b2b38) had only been live ~10 minutes at capture time, so this is effectively a pre-AEO baseline for measuring lift over the next 4-6 weeks as Google re-crawls and AI engines re-index.

## Per-Page Position (Google.com, US locale, May 3 2026)

| # | Page | Target Query | got-moles position | Ranking page | Above Got Moles |
|---|---|---|---|---|---|
| 1 | /what-do-moles-eat | what do moles eat western washington | **4** | /what-do-moles-eat/ ✅ | WDFW (1), SCCP PDF (2), pesticide.org (3) |
| 2 | /voles-vs-moles-whats-the-difference | mole vs vole vs gopher western washington | **NOT IN TOP 10** | — | farmstore.com, volecontrol.com, prioritypest, victorpest |
| 3 | /do-moles-hibernate | when are moles most active washington state | **NOT IN TOP 10** for this slug | /what-species-of-moles-live-in-washington-state/ ranks at 1 (wrong cornerstone) | — |
| 4 | /how-to-get-rid-of-moles-in-your-yard | how to get rid of moles in your yard western washington | **NOT IN TOP 10** | — | pesticide.org (1), WSU Hortsense (2), WSU FS146E (3), Scotts (4), Western Exterminator (5) |
| 5 | /blog/types-of-moles-in-washington | types of moles in washington state species | **4** but for different slug — `/what-species-of-moles-live-in-washington-state/` (cornerstone slug doesn't surface) | WSU Hortsense (1), WDFW (2), SCCP (3) |
| 6 | /services/total-mole-control-program | total mole control program western washington | Service page **not in top 10**. Blog `/what-attracts-moles-to-your-yard` ranks 1 + `/how-many-eyes-do-moles-have` at 2 (cannibalization) | — |
| 7 | /services/one-time-mole-removal | professional mole removal western washington one time service | Service page **not in top 10**. Homepage at 9 + `/what-attracts-moles` at 1 + `/mole-repellant` at 8 | — |
| 8 | /services/commercial-mole-control | commercial mole control HOA western washington | Service page **not in top 10**. `/what-species-of-moles-live-in-washington-state` ranks at 2 (random match) | Sunrise Pest (1), Mole Pros (6), Mole Patrol (9) |
| 9 | /about | spencer hill got moles founder washington | **Old /about-us/ ranks 1**. New canonical /about/ NOT in top 10. Spencer author archive `/author/spencer/` at 6 | — |

## Top SERP Patterns Observed

**Cornerstones either rank at top of page or not at all** — no middle ground. Pages 4, 6 win on their target queries. Pages 2, 3, 4 (different page than 4!), 5, 9 don't.

**Cannibalization is the dominant losing pattern.** On 5 of 9 queries, a different Got Moles page than the target cornerstone is ranking — and usually a less-relevant blog page is winning over the dedicated cornerstone or service page. AEO won't compound until canonical signals are clean.

**Service pages are entirely absent from SERP for service-intent queries.** All 3 service pages (TMCP, One-Time, Commercial) fail to appear in top 10 even on direct service-intent searches with "western washington" qualifier. The blog content is winning intent the services should own.

**Old /about-us/ URL still ranks above the new /about/.** Indicates either the 301 isn't passing equity correctly, or Google still has /about-us/ in primary index and /about/ as secondary.

## Three Content-Correctness Issues Surfaced (NOT in SERP scope but found mid-search)

### Issue A — Conflicting "body-gripping traps illegal in WA" claim from competing source
Multiple non-WSU sources state: *"In Washington, body-gripping or body-piercing mole traps are illegal."* (eHow, 2026 SERP result for query #4).

Got Moles content + Stats blocks repeatedly say "physical body-gripping traps." If WAC actually prohibits body-gripping mole traps for unlicensed use, Got Moles either:
- Has a special pest-control license that exempts the company → safe to claim
- Uses scissor/harpoon traps that aren't classified as "body-gripping" under Washington law → terminology should change
- Is operating in violation → unlikely given 8 years + GBP reputation

**Action needed:** verify with Spencer / WAC 220-417 (body-gripping trap prohibition under I-713). Update Stats block + content terminology if the law specifically bans the phrase "body-gripping" for retail/unlicensed use.

### Issue B — Moody Moles claims 10,000+ properties cleared
Direct competitor claim: *"perfecting removing moles for 10+ years and have successfully cleared over 10,000 Properties mole infestations."*

Got Moles' canonical "5,000+ properties since 2017" sits below this competitor's claim numerically (regardless of whether 10k is real). Worth being aware of when Spencer talks about competitive positioning.

### Issue C — Old /about-us/ URL outranks /about/
Pre-existing migration carry-over. Either redirect chain is broken, redirect was 302 not 301, or Google is taking time to recanonicalize. **Should check:** `curl -I https://got-moles.com/about-us/` — confirm 301 to /about/ + check sitemap.xml only lists /about/.

## What I CAN'T Run From Here (Needs Roy's Browser)

AI engine baseline — Perplexity / ChatGPT / Claude / Gemini all require interactive sessions or paid API keys. Per memory `feedback_anthropic_default_for_text_gen.md`, OpenAI etc. require explicit per-use approval, and the public Perplexity/Claude/ChatGPT consumer endpoints aren't WebFetch-able for clean structured baseline.

**Roy: paste these 9 queries into each of Perplexity, ChatGPT, Claude.ai (with web search on), Gemini. For each, capture: (1) does got-moles.com appear in cited sources? (2) is the answer factually correct vs the WSU castor-oil claim? (3) any competitor cited above us?**

Suggested test queries (slug-aligned for direct cornerstone testing):
1. "What do moles eat in Washington state?"
2. "What's the difference between moles and voles?"
3. "Do moles hibernate in winter?"
4. "How do I get rid of moles in my yard in Washington?"
5. "What species of moles live in Washington state?"
6. "What's the best mole control service in Western Washington?"
7. "Who offers one-time mole removal near Seattle?"
8. "What companies do commercial mole control for HOAs in Washington?"
9. "Who is Spencer Hill from Got Moles?"

Capture screenshots into `projects/briefs/aeo-p0-content/ai-baseline-2026-05-03/` — I'll diff against the same queries in 4-6 weeks once the WSU citation + Spencer attribution propagates through AI training/index refresh.

## What's Also Missing (Needs Roy's GSC Browser Session)

GSC MCP isn't surfaced in this client workspace. For the 9 pages, Roy needs to run URL Inspection in Google Search Console UI and capture:
- Indexing status (Indexed / Crawled-not-indexed / Not indexed)
- Last crawl date
- Canonical URL Google chose vs what we declared
- Mobile usability + Core Web Vitals score
- Coverage issues / structured-data warnings (the new Citation schema should appear here for the 3 cornerstones with WSU)

The structured-data section is specifically valuable now — confirms whether Google ate our new BlogPosting + Citation schema or rejected it.

## Bottom Line

Phases 1-3 shipped real AEO content surface area. Phase 4 first slice (b9b2b38) shipped real Citation schema. But this baseline shows Google is still indexing primarily the OLD pre-AEO URLs and OLD blog cannibalization patterns. Expect 4-6 weeks for Google re-crawl + canonical recalculation to even start surfacing Phase 1-3 changes. AI engines lag Google by another 4-12 weeks for index refresh.

Real measurement window starts ~mid-June 2026. This document is the t=0 marker.
