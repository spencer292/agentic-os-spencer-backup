---
name: ops-google-ads
description: >
  Manage Google Ads accounts programmatically via the Google Ads API — audit
  campaigns, research keywords, build and restructure campaigns, manage negative
  keyword lists, review RSAs, check conversion/call tracking, and pull daily
  reporting. SDK-free engine (refresh-token OAuth + GAQL) that works against any
  account under your MCC. Carries a reusable policy-compliance framework for
  regulated/ambiguous verticals. Triggers on: "google ads", "ads audit", "ads
  review", "campaign status", "keyword research for ads", "build a campaign",
  "negative keywords", "RSA", "responsive search ads", "PPC audit", "ad spend",
  "conversion tracking check", "quality score". Does NOT trigger for Meta/Facebook
  ads (different API), organic social (str-*-planner skills), or SEO.
---

# Google Ads Management

Programmatic Google Ads management built on a tiny, dependency-free engine. Refactored
from the Got Moles paid-search operation (a regulated, ambiguous-term local-service vertical),
so it ships with a real campaign architecture and a policy-compliance framework, not just API glue.

## When to use

- Audit / review a live account (campaigns, ad groups, RSAs, keywords, negatives, spend, conversions)
- Research keywords (seed → geo-modified → symptom → competitor → cluster → funnel tiers)
- Build or restructure campaigns (tiered buyer-intent + branded architecture)
- Manage negative keyword lists (especially for ambiguous terms — see policy reference)
- Check conversion + call-tracking plumbing and quality-score diagnostics
- Pull recurring reporting (daily pulse, N-day stats, campaign status)

## Setup (one time)

1. In the MCC's **API Center**, get a **developer token**. Create an OAuth **Desktop** client (id + secret).
2. Mint a refresh token:
   ```
   node .claude/skills/ops-google-ads/scripts/get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
   ```
3. Put these in `.env` (names only — never commit values):
   ```
   GOOGLE_ADS_DEVELOPER_TOKEN=
   GOOGLE_ADS_CLIENT_ID=
   GOOGLE_ADS_CLIENT_SECRET=
   GOOGLE_ADS_REFRESH_TOKEN=
   GOOGLE_ADS_LOGIN_CUSTOMER_ID=   # the MCC/manager id, digits only
   GOOGLE_ADS_CUSTOMER_ID=         # the operating/client account, digits only
   ```
4. Smoke test: `node .claude/skills/ops-google-ads/scripts/test-connection.mjs`

## The engine

Everything goes through `scripts/lib/ads-client.mjs`:

```js
import { createClient } from './lib/ads-client.mjs'
const client = await createClient()              // or createClient({ customerId: '1234567890' })
const rows = await client.gaql(`
  SELECT campaign.name, metrics.cost_micros, metrics.conversions
  FROM campaign WHERE campaign.status != 'REMOVED'`)
// Mutations: ALWAYS dry-run first.
await client.mutate('campaigns', [{ create: {...} }], { validateOnly: true })
```

- **`API_VERSION` is a single constant** at the top of `ads-client.mjs`. Google ships ~monthly now;
  bump it when a version sunsets (v20 sunset 2026-06-10). Currently **v24**.
- `gaql()` auto-paginates. `mutate()` supports `validateOnly` and `partialFailure`.
- Multi-client: pass `customerId` to operate any account under the MCC without touching `.env`.

## Method (read the reference for each)

| Reference | What it covers |
|---|---|
| `references/campaign-methodology.md` | Tiered architecture (T1 buyer-intent → T2 → T3 + branded), geo-targeting, budget/bidding, build order, restructure phases |
| `references/keyword-research.md` | The multi-pass research process via Keyword Planner, clustering, funnel tiers, match-type strategy |
| `references/policy-compliance.md` | **The gold.** Ambiguous-term negative strategy, regulated-vertical messaging ("Posture"), medical/cosmetic negative clusters, Local Services Ads policy handling |
| `references/got-moles-worked-example.md` | The full Got Moles operation as a worked example + where the 65 original operational scripts live |

## Hard rules (non-negotiable)

1. **Always `validateOnly: true` before any real mutate.** Show the user the dry-run result and get a go before writing to a live account.
2. **Money + live accounts = confirm first.** Budget changes, enabling campaigns, and bulk keyword/RSA edits are outward-facing actions — confirm before executing, even within an authorised workstream.
3. **Negative-keyword discipline for ambiguous terms.** Before launching, apply the vertical's negative clusters (see policy reference). Skipping this burns budget on the wrong intent.
4. **Respect account policy posture.** For regulated verticals, run the banned-words audit (policy reference) over every RSA/keyword before publish.
5. **Bump `API_VERSION` when notified of a sunset.** One constant, one edit.
6. Never print or commit token/secret values. Reference env var names only.
