---
project: meta-ads-tmcp-quiz
status: superseded
level: 2
created: 2026-04-03
completed: 2026-05-10
superseded-by: ../../../../projects/briefs/got-moles-paid-search/ (ATP root — Meta layer when ready)
---

> **MOVED 2026-05-10.** Meta ad creative + audience targeting is ad-platform work, not page work. Per the rule "page edits stay here, ad-platform work moves to ATP root," this brief moves to the ATP-root paid-search project. The marketing-os GSD here covers organic / on-page / measurement / authority only. Retained for history.


# Meta Ads Campaign: TMCP + Quiz Lead Gen

## Goal
Build and launch a Meta (Facebook/Instagram) ad campaign with two objectives: (1) drive quiz completions that convert to quote requests, and (2) capture emails from future-problem homeowners for TMCP nurture.

## Campaign Strategy

### Two Objectives, Two Campaign Types

**Campaign 1: Quiz → Quote (Immediate Conversion)**
- Objective: Lead Generation
- Funnel: Ad → ScoreApp Quiz (score.got-moles.com) → Quiz result → Quote request CTA
- Target: Homeowners with active mole problems NOW
- Messaging angle: "Find out how bad your mole problem really is" / urgency + specialist credibility
- Success metric: Cost per quote request

**Campaign 2: Email Capture → TMCP (Nurture)**
- Objective: Lead Generation
- Funnel: Ad → ScoreApp Quiz → Quiz result → Email capture → TMCP drip sequence
- Target: Homeowners who KNOW moles come back seasonally — they'll need help eventually
- Messaging angle: Prevention, ongoing protection, "never deal with moles again"
- Success metric: Cost per email capture, TMCP conversion rate from email list

### Audience Structure

| Audience | Type | Campaign | Notes |
|----------|------|----------|-------|
| Custom: 3,000 past clients | Warm | TMCP only | They already know Spencer. Perfect for TMCP upsell. |
| Lookalike: 1% of past clients | Cold | Both | Meta's best signal — people who look like proven buyers |
| Lookalike: 3-5% of past clients | Cold | Quiz only | Broader reach for quiz, lower intent |
| Interest: Homeowners + Lawn/Garden + Western WA | Cold | Quiz only | Broad awareness, test against lookalikes |
| Retargeting: Quiz starters who didn't finish | Warm | Both | Cheapest conversions — they already showed intent |
| Retargeting: Website visitors (once pixel is live) | Warm | Both | Requires Meta Pixel on got-moles.com |

**Critical setup:** Meta Pixel MUST be on the site + ScoreApp quiz for retargeting and conversion tracking. This is a blocker for campaign optimization.

### Ad Format Recommendation

At $600/month starting budget, focus beats breadth. Here's the priority order:

| Priority | Format | Specs | Why |
|----------|--------|-------|-----|
| 1 | **Static image (feed)** | 1080x1080 | Cheapest to produce, fastest to test. Start here. |
| 2 | **Static image (stories/reels)** | 1080x1920 | Same creative adapted vertical. Free incremental reach. |
| 3 | **Short-form video (15-30s)** | 1080x1920 | UGC-style talking head. Highest engagement potential. |
| 4 | **Carousel** | 1080x1080 x3-5 | Good for "before/after" or "3 signs you have moles" |

**Recommendation: Start with 3 static + 1 video per campaign.** That gives Meta's algorithm enough creative variety to optimize without spreading $600 too thin.

### Variant Strategy

**6 static image ads (3 per campaign):**

Campaign 1 — Quiz → Quote:
1. **Problem-aware hook:** "Your yard didn't do this to itself" (damage visual + quiz CTA)
2. **Social proof hook:** "219+ five-star reviews. Zero moles left behind." (trust + quiz CTA)
3. **Specialist hook:** "WA's mole-exclusive company" (differentiation + quiz CTA)

Campaign 2 — TMCP Email Capture:
4. **Prevention hook:** "Moles come back. We don't let them." (protection angle + quiz CTA)
5. **Cost-of-inaction hook:** "$15,000 lawn. $100/month to protect it." (investment framing)
6. **Seasonal hook:** "Spring is mole season in Western WA" (timely urgency)

**2 video ads (1 per campaign):**
7. **Quiz driver video (15s):** "Take the 60-second quiz — find out if you have a mole problem" (UGC-style avatar)
8. **TMCP video (30s):** "Why 500 homeowners pay $100/month for mole protection" (credibility + social proof)

**Total: 8 ad creatives to start.**

### Budget Allocation ($600/month)

| Campaign | Monthly Budget | Daily | Rationale |
|----------|---------------|-------|-----------|
| Quiz → Quote | $400 | ~$13 | Primary revenue driver. Direct ROI. |
| TMCP Email Capture | $200 | ~$6.50 | List building. Longer payback. Scale once proven. |

**Testing phase (first 2 weeks):** Run all 8 creatives. Kill anything with CTR < 1% after 1,000 impressions. Double down on winners.

**Scale trigger:** If cost per quote < $50 (or whatever Spencer's acceptable CPA is), increase budget. At $450 average job value, even $100 CPA is profitable.

## Deliverables

- [ ] Campaign brief (this document)
- [ ] 6 static image ads (1080x1080 + 1080x1920 versions)
- [ ] 2 UGC video scripts
- [ ] 2 avatar video ads (15s + 30s)
- [ ] Ad copy for all 8 variants (primary text, headline, description, CTA)
- [ ] Audience targeting specs for Meta Ads Manager setup
- [ ] Notion page with all assets for Spencer/Roy review

## Acceptance Criteria

- All visuals match Got Moles brand (Grass #184241, Blue #182034, Cream #FFF1D9, Gold #E68C04)
- Copy follows brand voice (direct, no-nonsense, specialist authority)
- US English throughout
- No I-713 compliance claims
- "219+ five-star Google reviews" (exact phrasing)
- "Nearly 5,000 clients" (confirmed safe)
- Quiz URL: score.got-moles.com on all ads
- Phone: (253) 750-0211 where applicable

## Blockers / Dependencies

- **Meta Pixel:** Needs to be installed on got-moles.com AND score.got-moles.com for conversion tracking + retargeting. Without this, we're flying blind. (Still flagged as missing from website rebuild project.)
- **ScoreApp quiz flow:** Need to confirm the quiz endpoint captures emails AND has a quote-request CTA. If not, we need to adjust.
- **Spencer's face/brand photos:** No current assets. We'll generate all visuals. If Spencer can provide on-site photos later, we swap them in — real photos always outperform generated ones.

## Timeline

Session 1 (today): Brief + all ad copy + static visuals
Session 2: Video scripts + avatar videos + Notion push
Launch: As soon as Spencer approves + Meta Pixel is installed
