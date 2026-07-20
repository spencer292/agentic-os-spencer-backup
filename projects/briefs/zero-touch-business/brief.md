---
project: zero-touch-business
status: active
level: 2
created: 2026-07-19
---

# Zero-Touch Business Experiment

## Goal
Build a near-fully-automated business from zero — digital products sold on Gumroad, fed by an automated SEO/GEO content engine and a small ad budget — to prove Claude + AI can run a passive-income business with minimal human time. The experiment metric is **dollars earned per hour of Spencer's time**.

## Model (decided 2026-07-19)
- Digital products (template bundles, guides, spreadsheets) on Gumroad — platform handles checkout, delivery, refunds.
- Traffic: automated SEO/GEO content site + Pinterest + small Google Ads spend.
- Budget: ~$100-150/mo including ad spend.
- Niche sequencing (decided 2026-07-19): **A → B → C.** Start with A = service-business-in-a-box kits for the trades (leverages Spencer's real operating authority). When A is producing (trigger: first-dollar gate passed and ~$100/mo trajectory), fire up B = landlord/rental templates on the same engine; when B produces, C = homestead/chicken printables. One engine, three product lines.

## Financial goals
- First organic dollar ≤ 45 days after launch
- $100/mo by month 3; $500/mo by month 6
- Spencer time < 30 min/week after setup; log all Spencer-touch time

## Deliverables
- `business-plan.md` — full plan (this folder)
- Product line v1 (3 products) + Gumroad listings (via Gumroad Product API)
- Content site (separate repo/hosting — NOT part of got-moles.com or Roy's deploy pipeline)
- Cron jobs: content publisher, product factory, sales/metrics digest
- Weekly automated report incl. Spencer-minutes counter

## Acceptance criteria
- Every recurring step is cron- or platform-backed (no "Claude looping" dependencies)
- Spencer's only recurring role: weekly approval batch
- Honest reporting: three-bucket status (needs Spencer / paused / stalled) in every digest

## Constraints
- No outward action (publishing, posting, ad spend) without Spencer's initial authorization per channel; once authorized per channel, cron runs are pre-approved.
- Separate accounts from Got Moles (new Gumroad, new domain, new ads account). Keep the experiment's identity distinct.
- No fake reviews/testimonials, no fabricated authority claims. AI-assisted is fine; fraudulent is not.

## Dependencies (Spencer-only, one-time)
- Gumroad account + payout details (KYC)
- Domain purchase + hosting account (Vercel/Netlify/GitHub Pages under Spencer's own login)
- New Google Ads account (engine/creds pattern already proven via ops-google-ads)
- Optional: Pinterest business account
