# RR — Search Launch (Templates) — Built PAUSED, Awaiting Sign-off

_Built overnight 2026-07-22 → 07-23 via API. Campaign id `24059425574`, account 763-085-7815. **Nothing spends until you enable it.**_

## What's live in the account (verified by post-build audit)

| Setting | Value |
|---|---|
| Campaign | `RR — Search Launch (Templates)` — **PAUSED** |
| Budget | $2.47/day (≈ $75/mo), unshared |
| Bidding | Maximize Clicks, **$1.25 max CPC ceiling** |
| Network | Google Search only (no partners, no display) |
| Geo / language | United States / English |
| Campaign negatives | jobs, job, hiring, salary, career, careers, employment, **free** |
| Conversion action | `Gumroad Purchase (uploaded)` — click uploads, $49 default value, 30-day window |

## Ad groups (12 ★ keywords, each in exact + phrase)

| Ad group | State | Keywords | Lands on |
|---|---|---|---|
| Cleaning Kit — Templates | **ENABLED** (runs when campaign enables) | cleaning business contract template, commercial cleaning contract template, cleaning service price list template, cleaning business client intake form, cleaning quote template, airbnb cleaning checklist template | `/kits/cleaning-business-starter-kit/` ($49 kit) |
| Pressure Washing — Templates | **PAUSED** | pressure washing contract/quote/liability waiver template | `/guides/pressure-washing-contract-template/` |
| Lawn Care — Templates | **PAUSED** | lawn care contract/quote template, landscaping estimate template | `/guides/lawn-care-contract-template/` |

**Why PW + Lawn are paused:** those clusters have no kit to sell yet — their guide pages only feed the email list. With $2.47/day total, every click should go where a $49 sale can happen. Enable them when Kits 2/3 launch (or sooner if you want list-growth clicks).

**Deviation from the backlog note:** the backlog sketched "one ad group per trade + one cross-trade contract group." I grouped purely by trade — a cross-trade group would need one landing page serving all trades, which doesn't exist, and per-trade grouping keeps ad relevance higher.

## Cleaning ad copy (the one that will run)

Headlines: Cleaning Business Contract Kit · 14 Templates — One $49 Kit · Contracts, Pricing & Forms · Paperwork Done on Day One · Built by a Real Operator · Instant Download Today · Stop Guessing What to Charge · Editable Docs and Sheets

Descriptions: "Contracts, pricing calculator, intake forms, invoices — 14 editable files, instant access." · "Skip the $500 lawyer draft. Field-tested cleaning business paperwork, ready to customize." · "Built from a real 5,000-client service business. No course — templates you use today." · "Price with confidence: margin-guarded calculator plus agreements that protect you."

## Morning decisions

1. **Enable the campaign?** Say "enable it" and I flip it on + activate the Tuesday `ztb-ads-manager` cron (negatives, $15/0-conv pauses, spend-vs-cap report).
2. **The `free` negative.** I blocked searches containing "free" — at this budget, free-template hunters would eat most clicks. Tradeoff: it also blocks "free vs paid" comparison searches that the SEO guide deliberately targets. My call: keep it; overrule if you'd rather harvest those clicks for the email list.
3. **Conversion tracking gap (known, not blocking).** Purchases happen on Gumroad, off-site, and the site doesn't yet capture/pass the Google click id (gclid), so the upload conversion action has nothing to match against. Launch is fine without it — at this volume I'll judge by clicks vs. Gumroad sales timestamps in the weekly report. Proper fix (recommended within ~2 weeks): small site tweak to store the gclid and pass it through Gumroad's checkout as a URL param, then the weekly cron uploads real conversions. I can build that as a follow-up.

## Notes

- Ad approval status was `UNKNOWN` right after creation — Google policy review usually clears within a day, including while paused. I'll confirm approvals before/at enable time.
- Build + audit scripts: `scripts/rr-build-launch-campaign.mjs` (idempotent, refuses to touch a non-paused campaign), `scripts/rr-ads-smoke-test.mjs`. A transient duplicate budget from a partial first run was removed; final state audited clean.
