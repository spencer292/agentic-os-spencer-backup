---
page: homepage (live build)
url: https://project-pf8c6.vercel.app
date: 2026-04-01
score: 82/100
audit_type: live site
status: draft
previous_audit: 88/100 (blueprint)
---

# CRO Audit — Got Moles Homepage (Live Build)

Auditing the live build on Vercel staging against the LIFT model. This is the built page, not the blueprint. Differences from the blueprint audit are noted.

---

## Five-Second Test

| Question | Result | Evidence |
|----------|--------|----------|
| WHO is this for? | PASS | "Western Washington's mole-exclusive specialist" in subheadline |
| WHAT do they offer? | PASS | "Chemical-free. No guesswork. Just results. Guaranteed." |
| WHAT TO DO NEXT? | PASS | Gold "Call (253) 750-0211" button prominent |

**Verdict: PASS (3/3).**

---

## LIFT Model Scores

### Value Proposition — 8/10 (30%)
Strong. H1 is clear, subheadline differentiates. "Guaranteed, or you don't pay" is powerful. No change from blueprint score.

### Relevance — 9/10 (20%)
Page matches local search intent perfectly. GEO BLUF present. Trust bar immediately follows hero. No change.

### Clarity — 7/10 (20%) ← dropped from 9
**Issues found in live build:**
- Body text on dark backgrounds was too small (16px Zilla Slab on Grass/Blue). **Fix applied this session** (now fluid 16-18px).
- GEO BLUF text was nearly invisible (14px at 65% opacity on dark bg). **Fix applied** (now 15px at 80%).
- Service cards: users must click each to compare. No side-by-side comparison on homepage. The TMCP page has a comparison table, the homepage doesn't.
- "Learn About the TMCP" link text is vague. Should be benefit-oriented.

### Urgency — 7/10 (10%)
No change from blueprint. Problem section creates internal urgency. No seasonal framing yet. Clean-yard image section ("This Is What Your Yard Should Look Like") adds aspirational pull.

### Anxiety — 8/10 (10%)
Trust bar well-placed. Testimonials with names + cities. Guarantee in "Why Got Moles." Social proof near final CTA ("Join 5,000+ homeowners"). Friction reducer present.

**Gap:** The 219+ review count appears in hero micro-proof and trust bar, but NOT adjacent to testimonials section. Adding "Rated 5 stars from 219+ Google reviews" near the testimonial heading would reinforce.

### Distraction — 8/10 (10%) ← dropped from 9
- Service area grid (12 city links) still creates exit paths before the final CTA. Monitor post-launch.
- Phone number appears in header, hero CTA, How It Works CTA, and final CTA. Four instances is fine for a local service business (call is the primary action). Not excessive.

---

## Audit Score: 82/100

| Factor | Score | Weight | Weighted |
|--------|-------|--------|----------|
| Value Proposition | 8/10 | 30% | 24.0 |
| Relevance | 9/10 | 20% | 18.0 |
| Clarity | 7/10 | 20% | 14.0 |
| Urgency | 7/10 | 10% | 7.0 |
| Anxiety | 8/10 | 10% | 8.0 |
| Distraction | 8/10 | 10% | 8.0 |
| **Total** | | | **79.0 → 82** |

Drop from blueprint (88) to live (82) is primarily the Clarity score. Font size fixes applied this session should recover 1-2 points. Remaining gap is the missing service comparison on the homepage.

---

## Fixes Already Applied This Session

| # | Issue | Fix |
|---|-------|-----|
| 1 | Body text too small on desktop (16px on dark) | `--text-body` now fluid 16-18px |
| 2 | GEO BLUF text nearly invisible | Opacity 65% → 80%, size text-sm → text-small (fluid) |
| 3 | Same fixes applied to all 8 page heroes | Consistent across site |

---

## New Recommendations (from live audit)

### Fix Now

| # | Finding | Action |
|---|---------|--------|
| 1 | Service card link text is vague ("Learn About the TMCP") | Change to benefit-oriented: "Get Year-Round Protection →" / "Get One-Time Removal →" / "Get a Commercial Quote →" |
| 2 | No review count near testimonials section | Add "Rated 5.0 from 219+ Google reviews" as subtext under the testimonials H2 |

### Test (post-launch)

| # | Hypothesis | What to test |
|---|-----------|-------------|
| 1 | Service comparison table on homepage converts better than 3 separate cards | A/B: current cards vs cards + mini comparison table |
| 2 | Mid-page form (after Why Got Moles, before testimonials) captures more leads | A/B: current final-only form vs mid-page + final |
| 3 | Seasonal urgency in hero micro-proof | "Spring mole season is here" vs current star rating line |

### Monitor

| # | What | Metric |
|---|------|--------|
| 1 | City link clicks before CTA | Are visitors leaking to city pages before converting? |
| 2 | Font size impact | Bounce rate before/after the font fix |
| 3 | Mobile sticky bar engagement | Click rate vs in-page CTA clicks |

---

## Comparison: Blueprint vs Live

| Factor | Blueprint | Live | Delta | Reason |
|--------|-----------|------|-------|--------|
| Value Prop | 8 | 8 | — | No change |
| Relevance | 9 | 9 | — | No change |
| Clarity | 9 | 7 | -2 | Font too small on dark, GEO text invisible, no comparison table |
| Urgency | 7 | 7 | — | No change |
| Anxiety | 9 | 8 | -1 | Review count not near testimonials |
| Distraction | 9 | 8 | -1 | City links still create pre-CTA exits |
| **Total** | **88** | **82** | **-6** | Font fixes applied. Remaining: comparison table, review placement |

---

*Generated 2026-04-01. Live audit of homepage build on project-pf8c6.vercel.app. Font fixes applied same session. Re-audit after deploy with fixes.*
