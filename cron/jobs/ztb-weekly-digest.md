---
name: Route Ready Weekly Digest
time: '07:00'
days: mon
active: 'true'
model: sonnet
notify: on_finish
description: 'Route Ready (zero-touch-business): Monday business digest — Gumroad sales, content/deploy log, ad spend, Spencer-minutes, three-bucket status. Created dormant 2026-07-19 — flip active at launch.'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS: the Route Ready weekly digest.

Project context: `projects/briefs/zero-touch-business/brief.md` and `business-plan.md` (goals: first dollar ≤45 days from launch, $100/mo by month 3, $500/mo by month 6; core metric = $ per Spencer-hour).

Build the digest strictly from live data — no estimates presented as facts:

1. Readiness/health: `node projects/briefs/zero-touch-business/scripts/ztb-readiness.mjs` — include any `pending` items.
2. Sales: if GUMROAD_ACCESS_TOKEN is in `.env`, GET `https://api.gumroad.com/v2/sales` (last 7 days) via `node -e` fetch; report count, gross, refunds, and lifetime total. If the token is missing, say "Gumroad not connected."
   2b. Purchasability (mandatory): GET `https://api.gumroad.com/v2/products` and report `published` for every product. If ANY product that should be live (kit `xolvu`, freebie `vvgis`) has `published: false`, flag it at the TOP of the digest as a revenue-blocking incident — 0 sales with an unpublished product is a store-closed failure, not a demand signal. (Added 2026-07-20: the kit silently reverted to unpublished after a launch-night edit; the first digest reported "0 sales" without catching it.)
3. Content: read `projects/briefs/zero-touch-business/runs/content-log.md` — articles shipped this week, failures.
   3b. Book clicks: `node projects/briefs/zero-touch-business/scripts/rr-metrics.mjs` — report `/book` (The Route on Amazon) clicks, last 7 days + lifetime. If it returns the namespace-not-found error, report "book click tracking not yet active (KV permission pending on the Cloudflare token)" — do not fabricate counts. Amazon-side conversions are not visible without an Associates account; clicks are our only signal.
4. Ads: if `ROUTE_READY_ADS_CUSTOMER_ID` is set in `.env`, report last-7-day spend/clicks/conversions via the ops-google-ads engine pattern; else "ads not live."
5. Spencer time: read `projects/briefs/zero-touch-business/runs/spencer-minutes.md` if it exists (he logs touches there); compute cumulative $/Spencer-hour = lifetime gross ÷ (logged minutes/60). If no log, note it.
6. Three-bucket status (mandatory, per AGENTS.md):
   - Needs Spencer: approval queue items, unfinished Phase 0 boxes.
   - Paused (not cron-backed): anything currently manual.
   - Stalled-silently watchlist: Google indexing (note GSC status if configured), Gumroad account holds, ad disapprovals.

Write the digest to `projects/briefs/zero-touch-business/runs/digest-{YYYY-MM-DD}.md` and give a ≤10-line summary in your reply: revenue this week, lifetime, articles shipped, spend, $/Spencer-hour, top 3 attention items.

Rules: read-only against all external APIs (no writes to Gumroad/Ads from this job). If an API errors, report the error line — never fabricate the metric.
