---
project: google-fb-ads-rebuild
status: superseded
level: 2
created: 2026-05-04
client: got-moles
owner: Roy
superseded-by: projects/briefs/got-moles-paid-search/ (under ATP root, 2026-05-04)
---

> **SUPERSEDED 2026-05-04.** This work is now run as ATP service work for Got Moles, not Got Moles internal work. Active project: `projects/briefs/got-moles-paid-search/` at the ATP root. This folder retained for history only. Do not edit.

# Google + Facebook Ads Rebuild — Got Moles

## Goal
Build a policy-clean, ground-up Google Ads + Meta Ads plan that can be imported the day Spencer grants account access — instead of inheriting the previous agency's silently throttled keywords and broken LSA tagging.

## Why now
Previous agency keywords are flagged non-usable. Google's tightened animal-cruelty + dangerous-products NLP enforcement plus the June 2024 LSA "Wildlife Removal" purge mean the existing account is likely sitting in "Eligible (limited)" status across multiple ad groups. We have no account access (1-2 week ETA) but can build the right architecture now.

## Deliverables
- [x] Discovery + strategy document — `00-discovery-and-strategy.md`
- [ ] Phase 1 — LP policy audit — `01-lp-policy-audit.md`
- [ ] Phase 2 — Policy-safe keyword universe — `02-keyword-universe.md` + filtered CSV
- [ ] Phase 3 — Negative keyword list (formalized) — `03-negative-keywords.md`
- [ ] Phase 4 — Campaign structure + ad-group architecture — `04-campaign-structure.md`
- [ ] Phase 5 — Ad copy templates — `05-ad-copy.md`
- [ ] Phase 6 — Meta Ads parallel track — `06-meta-ads-plan.md`
- [ ] Phase 7 — Account-access audit kit — `07-account-audit-kit.md`

## Acceptance criteria
- Every keyword + every line of ad copy + every LP rewrite traceable to a specific Google Ads policy URL
- Account-level negative list ≥120 negatives covering medical/cosmetic moles, DIY-product searchers, and adjacent species
- Ready to import into Google Ads Editor (campaign structure + RSAs + keyword lists exportable as CSV)
- Bing parity noted but not blocking — Bing enforces less aggressively
- LSA re-categorization request prepared (rodent, not wildlife) for the day access lands

## Constraints
- US English throughout (Got Moles is WA-based)
- No "WA's #1" claims, no "only mole-exclusive" claims, no Initiative 713 claims (per client CLAUDE.md)
- No claim of guaranteed eradication / 100% removal — describe the warranty, not the biological outcome
- Audit-only on site code until Roy gives go-ahead per `feedback_no_unauthorized_build_actions.md`

## Dependencies
- **Spencer**: Google Ads + Bing Ads account access, lead-quality definition behind the $10.28 CPL, LSA listing status
- **Roy**: go-ahead at each phase gate

## Out of scope (this project)
- Meta Pixel / CAPI implementation (separate plumbing project)
- Google Analytics 4 + CallRail conversion wiring (already tracked elsewhere)
- Organic SEO defense of the 635 #1 keywords (separate)
