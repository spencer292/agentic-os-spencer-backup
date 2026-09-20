# Thumbnail & Hook Metrics Framework

The two failure modes are different and need different metrics:
**A. didn't earn the click** (packaging) · **B. didn't deliver the promise** (hook↔content gap).
Optimising A alone breeds clickbait; the north-star is the **Qualified Click Rate = CTR ×
30-second survival** — clicks that stayed.

## A. Click metrics (does the thumbnail earn attention?)

| Metric | Source | Read it as |
|---|---|---|
| Impressions | Studio (Analytics API needs owner OAuth) | reach YouTube is willing to give |
| CTR **by traffic source** | Studio → Reach | NEVER blended: search 8–15% good, browse 3–6% good. Compare vs OWN per-source baseline |
| Test & Compare winner + share | Studio experiment panel | the only clean A/B YouTube offers — one variable per test |
| First 48h CTR | Studio | earliest packaging verdict; propose variant swap if <2% |

## B. Promise metrics (does the video deliver the hook?)

| Metric | Source | Read it as |
|---|---|---|
| 30s survival ("intro" retention) | Studio retention curve | <55% at 0:30 = hook broken or open weak |
| AVD % | Studio / public-ish | ≥40% target for 10-min lessons |
| **Hook-gap diagnosis** | derived | high CTR + low 30s = clickbait gap → soften hook or re-open video; low CTR + high retention = thumbnail undersells → bolder hook; both low = repackage |
| Promise location check | pre-publish (spec field) | the hook must be answered in the FIRST THIRD of the video — enforced in thumb-spec.hook.promiseLocation |

**Data reality:** impressions/CTR/retention need channel-owner analytics (Studio). Until the
n8n YouTube credential gains `yt-analytics.readonly`, Roy pastes the three numbers per
checkpoint (impressions, CTR by source, 30s survival) — 60 seconds of copying that powers the
whole loop. Public API fills views/likes/comments automatically.

## C. Engine scoring (score nano-banana / gpt-image / PIL against each other)

Every engine renders the SAME spec; each output is scored on:

| Check | Pass condition |
|---|---|
| Brand compliance | canvas/box colours within tolerance of spec, ATP mark present at spec position, nothing from `brand.forbidden` |
| Text fidelity | rendered words EXACTLY match spec lines; spelling perfect |
| Face integrity | side-by-side crop vs source cut-out — zero likeness drift |
| Layout adherence | subject position, face ≥ spec faceMinFrac, text zone respected |
| 168px legibility | readable in contact-sheet strip |
| Craft (0–10) | light integration, depth, edge quality — the subjective residue, judged on the sheet |

Log per-engine results in the ledger (`engineWins`). An engine that fails face-integrity or
text fidelity twice in a row on a spec type gets demoted for that spec type. This is how
"what Nano Banana creates" is scored against "what we're doing" — same spec, same rubric.

## D. Hook management (making hooks more powerful)

1. **Hook bank per cluster** — `projects/mkt-youtube-optimizer/hook-bank.md`. Source hooks
   from ICP pains (brand_context/icp.md) and video content, typed (curiosity-gap / threat /
   outcome-promise / contrarian / specific-number / identity-callout).
2. **Pre-use scoring (1–5 each):** specificity (numbers beat adjectives), ICP-pain match,
   believability (past the "yeah right" reflex), compressibility (survives 4–6 words),
   promise-deliverability (video answers it in the first third). <4 on pain-match or
   deliverability → rewrite.
3. **Post-use logging:** every used hook gets its CTR + 30s survival appended in the bank.
   Hooks that win twice become templates; hooks that clickbait-gap get retired with a note.
4. **Alignment rule:** hook text, title, thumbnail and the video's first 30 seconds are ONE
   promise expressed four ways. If any of the four tells a different story, fix before publish.

## E. The operating loop (per video)

spec (JSON) → render all engines → engine-score → pick top 2 variants → publish with
Test & Compare → 48h/7d/28d checkpoints → winner + hook outcome + engine wins → ledger →
misses become dated Rules. One variable per experiment, always.
