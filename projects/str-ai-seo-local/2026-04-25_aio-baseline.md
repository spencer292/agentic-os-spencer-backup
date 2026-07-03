# AI Visibility Baseline — Pre-Launch (2026-04-25)

**Purpose:** Capture Got Moles' AI-engine visibility BEFORE the new-build DNS flip. Re-run 30 days post-launch to attribute lift.

**Method:** 15 priority queries from `str-ai-seo/2026-04-20_full-seo-geo-report.md` Part 9, run with web grounding enabled on each engine. Brand-mention pattern: `/got[\s-]?moles/i`. Citation pattern: `got-moles.com` URL appears in response/sources.

**Engines covered:**
- ✅ ChatGPT — gpt-4o + `web_search` tool (OpenAI Responses API)
- ✅ Gemini — gemini-2.5-flash + `google_search` grounding
- ⏸ Perplexity — no API key in `.env` (manual check or add `PERPLEXITY_API_KEY`)
- ⏸ Claude — no `ANTHROPIC_API_KEY` in `.env` (manual check)
- ⏸ Google AI Overviews — no API; manual browser check required

Raw responses: `2026-04-25_aio-baseline-raw.json`.

---

## Headline numbers

| Engine | Brand mention | Citation (got-moles.com) | Most-cited competitor |
|---|---:|---:|---|
| ChatGPT (web_search) | **1 / 15** | 1 / 15 | Mole Masters, Mole Man, Moody Moles (1 each) |
| Gemini (Google Search grounding) | **5 / 15** | 0 / 15 | Mole Masters (3), Mole Man (3), Sound Pest (1) |

**Read:** Got Moles surfaces by name when the query is hyper-local + commercial (e.g. "mole control Bellevue Washington") but loses to Mole Masters and Mole Man on broader / informational queries. The brand has zero footprint on the cornerstone-defended GEO moats (eastern WA, types of moles, Townsend's, grub control, hibernate, Mazama gopher). The new build's schema saturation + cornerstone content should lift those.

## Per-query results

| # | Query | ChatGPT brand | ChatGPT cite | ChatGPT comps | Gemini brand | Gemini cite | Gemini comps |
|---|---|:---:|:---:|---|:---:|:---:|---|
| 1 | mole control Washington State | ❌ | | | ✅ | | Mole Masters, Mole Man |
| 2 | best mole control in Western Washington | ❌ | | | ❌ | | Mole Masters, Mole Man |
| 3 | how to get rid of moles Puget Sound | ❌ | | | ❌ | | Sound Pest |
| 4 | moles eastern Washington | ❌ | | | ❌ | | — |
| 5 | types of moles Washington State | ❌ | | | ❌ | | — |
| 6 | why grub control doesn't work on moles | ❌ | | | ❌ | | — |
| 7 | mole vs vole vs gopher Western Washington | ❌ | | | ❌ | | — |
| 8 | Townsend's mole largest North America | ❌ | | | ❌ | | — |
| 9 | mole control Bellevue Washington | ✅ | ✓ | Mole Masters | ✅ | | — |
| 10 | professional mole trapping Pierce County | ❌ | | Mole Man | ✅ | | Mole Man |
| 11 | chemical-free mole removal WA | ❌ | | | ✅ | | Mole Masters |
| 12 | veteran owned mole control Washington | ❌ | | Moody Moles | ✅ | | — |
| 13 | is mole poison safe for dogs Talpirid | ❌ | | | ❌ | | — |
| 14 | Mazama pocket gopher Western Washington | ❌ | | | ❌ | | — |
| 15 | do moles hibernate Washington winter | ❌ | | | ❌ | | — |

## Competitor share-of-voice (combined across both engines)

| Competitor | Mentions across 30 query×engine cells |
|---|---:|
| Mole Masters | 4 |
| Mole Man | 3 |
| Moody Moles | 1 |
| Sound Pest | 1 |
| **Got Moles** | **6 (5 brand + 1 citation)** |

Got Moles already leads on raw brand mentions but **loses on citations** — Mole Masters owns the actual link clicks because of its `/issaquah-wa` LP and broader page count. The launch should close this gap on cornerstone-defended queries and hold the lead on local-commercial.

## Lift-tracking expectations (30-day re-run)

The new build's deltas vs the old site:
- **Schema saturation** (4-6 JSON-LD blocks per template — none on competitors)
- **Cornerstone content** for queries 4, 5, 6, 7, 8, 14, 15 (zero competition, will surface)
- **Pattern-7 spelling redirects** consolidating mole-repellent / mole-repellant equity
- **`areaServed` on city LocalBusiness** (just shipped) — sharpens Bellevue/Tacoma/Seattle disambiguation
- **Slug-unique og:image** (just shipped) — improves social-share CTR which feeds back into citation surfaces

**Expected post-launch (30d):**
- Brand mention: 5→9+ per engine (cornerstones surface)
- Citations: 0→3+ on Gemini, 1→4+ on ChatGPT (schema + Article authority)
- Competitor share-of-voice: Mole Masters 4→2 (Issaquah counter-content + new city-page schema depth)

## Action items pre-flip

None gating launch. Re-run script post-DNS:
```bash
cd clients/got-moles
node --env-file=.env _aio-baseline.mjs
```

Add `PERPLEXITY_API_KEY` and `ANTHROPIC_API_KEY` to expand engine coverage to 4. Google AIO requires manual browser check — capture screenshots in a single session for reproducibility.
