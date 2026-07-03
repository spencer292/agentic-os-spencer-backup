---
project: got-moles-marketing-os
status: active
level: 3
created: 2026-05-08
rescoped: 2026-05-10
parent: null
---

# Got Moles — Marketing Operating System (rescoped 2026-05-10)

Post-launch marketing GSD coordinating every workstream that touches search, AI visibility, content, measurement, conversion, trust, and authority for got-moles.com (live since 2026-05-01).

**Rescoped 2026-05-10** from a 7-phase sequential model to an 8-workstream model organised around problems, not tactics. Paid advertising removed entirely — moved to ATP root (`projects/briefs/got-moles-paid-search/`) because it's billed as ATP service work. **Standing rule: page edits stay here; ad-platform work goes to ATP root.**

## Why this rescope

The previous 7-phase ROADMAP (created 2026-05-08) sequenced workstreams by SEO foundation logic. After two weeks of execution, three things made it stale:

1. **Foundation work shipped** (Phase 0 skill audit + Phase 1 cannibalisation + authority strategy + Phase 2.1 str-onpage-audit skill all done)
2. **Paid moved out** — billed separately as ATP service work
3. **New problems surfaced** — the 7 phases didn't have a workstream for CRO (Microsoft Clarity / conversion), External Authority (social/YouTube/linkable assets), or Local Optimization (GBP/NAP)

So we re-derived the GSD from problems, not phases.

## The 7 problems this GSD solves

| # | Problem | Why it matters |
|---|---|---|
| A | Lost rank from rebuild | Homepage 6.7→8.3, -30% impressions, -75 links/post, 3 cornerstones MERGE-redirected wrong, 635 #1 keywords at risk |
| B | Pages don't earn rank | H1/title/meta/schema misalignment across 100+ pages because foundation skipped pre-launch |
| C | Invisible to AI search | Pixelmojo 27/F AEO. 0% Claude mentions. 4 live hallucinations |
| D | Can't measure what's working | GTM/Clarity/CallRail/GSC tracking half-wired; Spencer can't see ROI |
| E | Trust signals fragmented | 219 GBP reviews, only 6 on site. Reviews hub thin. Case studies missing |
| F | Local presence inconsistent | NAP drift across 3 GBPs + BBB/Apple BC/Nextdoor/Yelp citations |
| G | No conversion optimization | Structure right, but are visitors converting once they land? |

Plus two long-term levers:
- **External authority** (social/YouTube/linkable assets) — biggest 2026 AI-citation lever per `str-authority-strategy`
- **Authority content pipeline** — 35 posts queued, not flowing

## 8 Workstreams

| WS | Workstream | Solves | Page work? | Briefs absorbed |
|---|---|---|---|---|
| **0** | Reality Check (one-shot) | Drift between memory and reality | n/a | — |
| **1** | On-Page Excellence | A + B | yes | `onpage-audit-sweep`, `cornerstone-url-recovery`, `internal-linking-recovery`, `paid-search-landing-pages` |
| **2** | Measurement Layer | D | partial | `got-moles-measurement-setup`, `gsc-tracking-automation` |
| **3** | AI Visibility (AEO) | C | yes | `aeo-audit-2026`, `aeo-p0-content`, `wikidata-entity-strategy` |
| **4** | Trust Surface | E | yes | `reviews-testimonials-seo` + Spencer-led case studies |
| **5** | External Authority Building | long-term moat | no | new — social, YouTube, linkable assets, brand mentions |
| **6** | Authority Content | long-tail | yes | `mole-content-authority` |
| **7** | Local Optimization (GBP/NAP) | F | no | new — extracted from `got-moles-measurement-setup` Track E. Spencer-led review acquisition; we track |
| **8** | CRO | G | yes | `city-page-cta-audit` + Microsoft Clarity ongoing + `str-cro-audit` per page |

**Closed at rescope:** `seo-geo-reinforcement` (folded into WS5 + WS6).
**Moved to ATP root:** `meta-ads-tmcp-quiz`, `google-ads-campaigns`, `google-fb-ads-rebuild`.

## Priority frame (Roy 2026-05-10)

> "Structure is right. Now AEO/GEO and conversion are primary."

So WS3 (AEO) + WS8 (CRO) are the headline workstreams once the foundation gates clear. Order:

```
WS0 Reality Check                    ← one-shot, gates everything
WS2 Measurement Layer                ← gates WS8 + visibility into all WS
WS3 AI Visibility   ──┐              ← parallel headline priority
WS8 CRO             ──┘
WS1 On-Page Excellence               ← runs continuously, per-page review pattern
WS4 Trust Surface                    ← layered behind
WS7 Local Optimization               ← layered behind
WS5 External Authority Building      ← long-term moat
WS6 Authority Content                ← long-tail cadence
```

**Trigger event (mid-June 2026):** Pixelmojo Radar re-baseline. Evaluates WS3 deltas. Roy runs.

## 90-day operating goals (vs 2026-05-08 Pixelmojo baseline)

| Goal | Baseline | 90-day target |
|---|---|---|
| GSC homepage rank | 8.3 | ≤ 5.0 |
| Pixelmojo unifiedScore | 61 / C | 75 / B |
| Pixelmojo AEO | 27 / F | 60+ |
| Pixelmojo Answer | 46 / D | 70+ |
| Pixelmojo Citation | 44 / D | 60+ |
| High-severity hallucinations | 4 | 0 |
| Claude mention rate | 0% | non-zero |
| 635 #1 keyword footprint | 635 | ≥ 635 (defended) + 50 new top-3s |
| Lead volume (organic + GBP + referral) | (Spencer baseline) | +20% MoM |
| On-site conversion rate | (TBD post-Clarity) | +15% relative |

CPL + paid-driven lead volume tracked at ATP root, not here.

## Acceptance criteria (project complete when)

- [ ] All 8 workstreams either shipped or transitioned to BAU/monitor
- [ ] 90-day operating goals met or exceeded
- [ ] Foundation docs (target-keywords.md, authority-strategy.md, design-system.md) referenced sitewide
- [ ] BUILD-METHODOLOGY.md updated with foundation-skill gate per `feedback_run_foundation_skills_first.md`
- [ ] All Pixelmojo target deltas hit
- [ ] Microsoft Clarity producing actionable CRO insights weekly
- [ ] Spencer + Roy sign-off

## What's already shipped (carried into rescope)

- ✅ Skill currency audit (6 skills, 50 gaps, 48 patched) — 2026-05-08
- ✅ Cannibalisation cleanup — commit `2ee5eed`
- ✅ Authority strategy v1.0 — `brand_context/authority-strategy.md` 440 lines, commit `57cfe02`
- ✅ Target keywords v1.1 — `brand_context/target-keywords.md`, commit `1ee8411`
- ✅ str-onpage-audit skill built + patched with Rules A-G — commits `1d3e61f`, `6137a14`, `3e26d40`
- ✅ /about/ audit + apply at 95.5/100 (A) — 2026-05-09
- ✅ Homepage 5 commits shipped 2026-05-09 (post-fix re-audit pending)
- ✅ Sitewide schema architecture pass — commit `ccf731f`

## Reversibility

Every change is a commit-revert. Foundation docs are additive. Phase 0 reality check produces a frozen "Reality 2026-05-10" doc the rescope plans against — no re-relying on stale memory.

## Status

**Active 2026-05-10 (rescoped).** Phase 0 Reality Check is the next session's work. No execution in WS1-8 begins until the reality doc is signed off.
