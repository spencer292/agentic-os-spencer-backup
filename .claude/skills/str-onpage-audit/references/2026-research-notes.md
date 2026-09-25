# Research Notes — pointer and retired-claims register

**Status: this file is no longer a research source.** It was the skill's recency anchor until 2026-09-02. Every landscape claim now lives in one place.

> **The landscape authority is `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`** at the install root. It is sourced, dated and confidence-labeled, and it is shared by every skill in the chain. Read it instead of this file. Where anything here and that file disagree, that file wins.

**Last refresh:** 2026-09-02 (rewritten as a pointer; supersedes the 2026-05-31 METHOD.md pass and the 2026-05-08 Pixelmojo-only baseline).
**Next refresh trigger:** the landscape file's own quarterly cadence, or a named Google core or spam update.

Confidence keys: **[P]** primary documentation, **[S]** named study with a stated sample, **[U]** unverified or unreachable primary.

---

## Why this file was gutted

A September 2026 audit found this file carrying roughly twenty dated statistics, several of which contradicted each other, contradicted the root skill, or had no reachable primary source. The scoring rubric was rewarding at least one signal the skill's own rule had already deprecated. Rather than patch numbers in four places, the chain now keeps landscape facts in one file and skills keep only their own rules.

## What this skill still acts on

Five numbers, all in the landscape file, all repeated in SKILL.md where they are used:

| Fact | Tier | Where it bites |
|---|---|---|
| 73% of sites block AI crawlers somewhere (Otterly, 1M+ citations, Jan–Feb 2026) | [S] | Pillar 1 exists and runs first |
| Schema shows no citation uplift: Ahrefs difference-in-differences, 1,885 treated vs 4,000 control, 2026-05-11, −4.6% / +2.4% / +2.2% | [S] | Pillar 6 demoted to correctness and entity binding |
| Word count vs AI Overview citation correlation 0.04 (Ahrefs, 174,048 pages) | [S] | No word-count targets anywhere |
| FAQ rich results removed: notice 2026-05-07, features gone June 2026, API data gone August 2026 | [P] | FAQPage not scored, not a deliverable |
| AI-cited content is 25.7% fresher on average (Ahrefs); 65% of AI bot hits target past-year content (Seer, Oct 2025) | [S] | Pillar 7 requires a substantive change, not a timestamp bump |

Everything else — surface prevalence, local ranking weights, engine-by-engine behavior, measurement limits — is read from the landscape file at run time.

---

## Retired claims register

These were asserted in this file before 2026-09-02 and are now wrong, unsourced, or owned elsewhere. Listed so that a future reader who finds them quoted in an old audit knows why they disappeared.

| Retired claim | Verdict | Replacement |
|---|---|---|
| "Top-10 to AI-Overview overlap collapsed ~76% → 17–38%, so ranking is no longer the gate to citation" | **Retired.** Single-source, and it conflicts with a larger-sample finding | **[S]** seoClarity, 432,000 keywords: 97% of AI Overviews cite a top-20 source. Resolution: **AI Overviews are organic-rank coupled, AI Mode is fan-out coupled** |
| "~50% of AI citations are under 13 weeks old" | **Retired.** No traceable methodology | **[S]** AI-cited content 25.7% fresher on average, ~368-day gap (Ahrefs); 65% of AI bot hits target past-year content (Seer) |
| "Cited-statistic cadence of one per 150–200 words; Princeton +40% generative visibility" | **Retired as a scored rule.** The principle survives, the cadence and the figure do not | Pillar 2.3 scores "at least one specific, attributable, quotable claim per major section" |
| "Pure transactional Map Pack queries trigger AI Overviews only 7%" | **Retired.** Not reproduced anywhere reachable | **[S]** Whitespark 540-query study: transactional local fires the Local Pack ~93%; informational local fires AI Overviews ~92%; hybrid ~97% |
| "Helpful Content Update Dec 2025 made hub-spoke topical authority a ranking signal" | **Retired.** No such named update | **[S]** The helpful content system was folded into core ranking; the cadence is now near-continuous rather than named updates |
| "Eight query intent categories per a 2026 quality rater guidelines evolution" | **Retired.** No 2026 revision found | **[P]** The September 2025 Quality Rater Guidelines edition is current |
| "Google March 2026 core update down-weights templated/scaled pages 30–60%" | **Retired.** Google publishes no winners-and-losers data and the third-party volatility figures are unverified | **[P]** Doorway and scaled-content policies still apply, enforcement is unchanged, and **[U, practitioner consensus]** the common 2026 outcome for thin location pages is silent suppression rather than a manual action. This is now the blocking doorway gate |
| "llms.txt is becoming standard" | **Debunked** | **[P]** Google, 2026-06-15: not required for Search visibility or rankings. No engine documents consuming it. Do not build one; if one exists, leave it |
| "Speakable schema rewards measurably" | **Retired** | Optional, never scored. See `aeo-patterns-2026.md` |
| "Brand mentions correlate 0.664 with AI visibility versus 0.218 for backlinks" | **Kept, re-sourced and relabeled** | **[S]** Ahrefs, 75,000 brands, published 2025-12-12: YouTube mentions 0.737, branded web mentions 0.664, branded anchors 0.511–0.628, backlinks and referring domains ~0.218–0.27. Ahrefs' own caveat: "correlation isn't causation." **This drives `str-authority-strategy`, not this skill.** On-page work does not move it |
| "'Near me' informational queries trigger AI Overviews 76.9%" | **Kept, re-sourced** | **[S]** Search Engine Land zero-click study. Still true, now read from the landscape file |
| Anchor distribution 40% branded / 30% keyword / 30% generic; exact-match anchors get 5x traffic; 76.6% of orphan pages improve; cross-linking nearby cities gives +7% | **Moved out of this skill** | Owned by `str-internal-links`. Two of them conflicted with each other in that skill's own references, and the city cross-linking figure now conflicts with the city-page linking cap. Do not quote any of them from here |
| Local ranking weights: proximity ~55%, GBP 32%, reviews 16–20%, on-page 19% | **Retired.** They summed to 122% | **[S]** Whitespark 2026 weights, owned by `str-ai-seo-local`: GBP ~32%, reviews ~20%, on-page ~15%, behavioral ~9%, links ~8%, citations ~6%, social ~5% |
| "Professional photos give +35% click-through rate" | **Retired.** Unverified | Nothing. Do not quote it |
| "1–3 trust signal types optimal; 7+ hurts credibility by ~8%" | **Moved out** | Conversion territory. Owned by `str-cro-audit` |
| "Pixelmojo Radar is the recurring third-party AEO benchmark" | **Retired as the primary** | DataForSEO AI Optimization (`llm_mentions`, `llm_responses`) is the primary recency benchmark. Pixelmojo is optional and its absence is not a finding |

---

## Still true, still used

- **[P] Core Web Vitals are unchanged: LCP, INP, CLS.** LCP under 2.5s, INP under 200ms, CLS under 0.1. INP replaced FID in March 2024. **[S]** INP is the most commonly failed metric at around 43% of sites over threshold, so it carries the most weight in Pillar 9. Numbers now come from the Lighthouse endpoint rather than being deferred to `str-cro-audit`.
- **[P] Bing Webmaster Tools AI Performance** shipped as a public preview on 2026-02-10, including Grounding Queries — the phrasing AI used to retrieve a page. UI only, no API. Accept it as a manual paste.
- **[P] Googlebot fetches the first 2MB of HTML**, clarified February 2026. This is the JavaScript payload check in Pillars 1 and 9.
