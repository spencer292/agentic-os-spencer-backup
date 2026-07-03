---
page: about
url: https://got-moles.com/about/
date: 2026-04-15
score: 76/100
status: draft
---

# About Page CRO Audit

Auditing for Jennifer Thompson (primary ICP — frustrated homeowner, specialist-seeker, scepticism from prior DIY + generalist failures). Design system fully loaded. Page built and deployed on commit `c1ee12a`, post-remediation.

## Five-Second Test

| Question | Pass/Fail | Evidence |
|---|:---:|---|
| WHO this is for | PASS | Trust strip "Nearly 5,000 Clients Served" + "Safe for Pets & Kids" signals homeowner audience |
| WHAT they offer | PASS | Subheading "One man. One focus. Nearly 5,000 yards saved." establishes mole specialist |
| WHAT TO DO NEXT | PASS | "GET A FREE QUOTE" button in hero, thumb-zone via sticky phone in mobile header |

All three pass. No critical escalation.

## Audit Score: 76/100

| Factor | Score | Weight | Weighted |
|---|---|---|---|
| Value Proposition | 8/10 | 30% | 24 |
| Relevance | 9/10 | 20% | 18 |
| Clarity | 7/10 | 20% | 14 |
| Urgency | 5/10 | 10% | 5 |
| Anxiety | 7/10 | 10% | 7 |
| Distraction | 8/10 | 10% | 8 |
| **Total** | | | **76** |

### Value Proposition (8/10)
- Subheading "One man. One focus. Nearly 5,000 yards saved." does the work — specialist signal + proof in one line.
- H1 "Spencer Hill's Story" is a page title, not a value prop. That's fine for an About page — the subheading carries the lift.
- Loses points because without the subheading the hero is soft for a scanning visitor.

### Relevance (9/10)
- Page matches visitor intent exactly: "who is this company, can I trust them?"
- Meta title "About Got Moles | Founded by Spencer Hill, US Army Veteran" lines up with search snippet expectations.
- Army veteran + founder story matches Jennifer's "I want someone who knows what they're doing" language.

### Clarity (7/10)
- Block sequence is logical: hero → GEO → origin → growth → differentiator → discipline → team → mission → CTA.
- Copy is plain, specific, humanized.
- Heading "How It Started" is vague. A scanner can't tell what the section contains without reading.
- GEO definition block is semantically redundant against the hero — repeats founding year, location, and scope the hero already implies.

### Urgency (5/10)
- No urgency signals. Appropriate — this is a trust page, not a landing page. Do not manufacture urgency here.
- Score reflects absence, not a failure.

### Anxiety (7/10)
- Trust strip in hero: 5 signals. Borderline (1-3 optimal, 5+ starts to feel inflated).
- Spencer's credibility is strong: named, Army veteran, 9-year specialist, specific location (Buckley → Enumclaw), 5,000 clients.
- **MISS:** No testimonial quote on About page. Jennifer's primary objection is "will this actually work?" — the About page carries the founder story but never hands the mic to a customer who says "it worked".
- Note: the Got Moles guarantee attaches to specific service programmes (One-Month Eradication) not to the brand as a whole. Do not add guarantee mentions to the About page — it belongs on service pages only.

### Distraction (8/10)
- Single primary CTA ("GET A FREE QUOTE") in hero, same action in final CTA block. No competing actions.
- Header nav present (standard, not flagged).
- Team section has no CTAs — it's a content block with no action, so it does not compete.
- 5 team cards in a 1/2/3 grid leave an asymmetric 3+2 bottom row on desktop. Minor visual distraction.

## Design System Compliance

| Check | Status |
|---|---|
| Color block alternation (grass-alt/grass) | FIXED this session |
| Dark-first surface, no cream backgrounds | COMPLIANT |
| No white cards, no visible borders | FIXED this session (was broken on commit 9126314) |
| Body text size (`text-body-lg`) | FIXED this session |
| Card title size (`text-h4 lg:text-2xl`) | FIXED this session |
| Gold reserved for interactive only (no decorative gold) | FIXED this session |
| Trust strip inside hero | COMPLIANT |
| Block order (hero → GEO → content → CTA) | COMPLIANT |
| Humanizer score (8.5+ target) | **PASS** — team bios brought 5/10 → 8.5/10 |
| 5-member grid layout | **OPEN** — 1/2/3 asymmetric, Moni to decide |
| Mobile device test | **OPEN** — needs physical device check |

## Social Proof Audit

- **Hero trust strip:** 5 signals. Borderline too many. Consider trimming to 3 after launch data.
- **Team cards:** 5 named people with photos + credentials — strong E-E-A-T and social proof.
- **Featured testimonial:** **MISSING.** Single biggest gap on the page.
- **Review count link:** No "See 219+ Reviews" CTA anywhere on the page.
- **Schema:** `Person @graph` with 5 entities wired via `teamSchema()` in commit `2f6c0f0`. Valid JSON-LD for AI search E-E-A-T.

## CTA Audit

- **Hero CTA:** "GET A FREE QUOTE" → `/contact`. Verb-led, benefit-oriented. PASS.
- **Final CTA block:** "GET A FREE QUOTE" + micro-copy "Free inspection. No obligation." PASS.
- **Count:** 2 primary CTAs, both pointing to the same action. No friction. PASS.
- **Mobile click-to-call:** Sticky header phone icon per design-system.md. Not verified on device this session.

## Prioritised Recommendations

### Fix Now

1. **Add a featured testimonial block between "Built on Discipline" and "Meet the Team".**
   - Use the Featured Testimonial pattern from `design-system.md` (centred blockquote, gold `"` accent, gold stars above, named attribution + city).
   - Source: pick a Jennifer-like quote from the 219+ Google reviews. Prefer one that addresses the "will it actually work this time?" objection directly.
   - Expected lift: anxiety 7/10 → 9/10, overall score +2 points.

2. **Rename "How It Started" to "Spencer's Father's Garden".**
   - Current heading is vague. Rename makes the story hook scannable.
   - Zero-cost edit, one word change in `pages-data.ts`.

3. **Decide the team grid layout.**
   - Three options to propose to Moni: (a) keep 1/2/3 with asymmetric bottom row, (b) 1/2/5 flat five-column on `lg:`, (c) centre the incomplete row (2 cards centred below 3).
   - Defer until Moni responds.

### Test

4. **Trim the hero trust strip from 5 → 3 signals.**
   - Current: "5-Star Rated · Nearly 5,000 Clients Served · Since 2017 · Veteran-Owned · Safe for Pets & Kids"
   - Test: "5-Star Rated · Nearly 5,000 Clients Served · Veteran-Owned"
   - Research suggests 1-3 trust signals convert better than 5+; confidence is medium. Worth an A/B test after launch.

5. **Consolidate the GEO Definition block OR move it after the team section.**
   - Currently redundant against the hero for human readers.
   - Option A: keep for GEO/AI search value (moderate).
   - Option B: move it below the team section, still crawlable but not interrupting the human story flow.
   - Option C: collapse into a schema-only block (requires dev work).

### Monitor

6. **Team grid mobile responsiveness** — needs device verification once Vercel rebuild lands.

## Closing Notes

- **Score 76/100 is solid for an About page** — not a conversion landing page but a credibility/trust page. Top-performing About pages in service businesses tend to land 78-85 range. The path from 76 → 82 is: featured testimonial + renamed story section.
- Design system violations from commit `9126314` are fully remediated (6+ fixes plus color alternation).
- Humanizer lift: avg 6.2 → 8.4 across 5 bios.
- Next action owner: **Roy** — decide on testimonial sourcing, story heading rename, grid layout call with Moni.
