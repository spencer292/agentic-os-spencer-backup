# OpenAI Advertiser API: notes (researched 2026-10-22)

Sources:
- https://developers.openai.com/ads/api-overview
- https://developers.openai.com/ads/campaign-management
- The changelog's latest entry, 2026-09-30, added attribution-window and time-basis options to the GET Insights endpoints.

This platform changes monthly. Re-check the docs before building anything new.

## Access
- **Base URL:** `https://api.ads.openai.com`, all paths under `/v1`.
- **Auth:** `Authorization: Bearer <OPENAI_ADS_API_KEY>`.
- **The key:** created in Ads Manager > Settings (`https://ads.openai.com/settings`). It is NOT the platform.openai.com developer key, and each key covers one ad account.
- **Key terms:** under OpenAI's Advertising Terms, keys must not be shared, sold or transferred to third parties without OpenAI's written approval. The key stays on the Got Moles machine.
- **Verify a key:** `GET /v1/ad_account` returns currency, timezone, account status and reviews.
- **Rate limits:** 600 requests/min per endpoint and 1,200/min overall, per ad account and per IP. Bulk job creation is limited to 10 per 10 s.
- **Retries:** create endpoints accept an `Idempotency-Key` header. Reuse it only when retrying the same create.

## Structure
An ad account holds campaigns, each campaign holds ad groups, and each ad group holds ads. Pausing a campaign stops all of its ads.

| Resource | Endpoints |
|---|---|
| Campaigns | `POST /v1/campaigns` (create) · `GET /v1/campaigns[?name=]` · `GET/POST /v1/campaigns/{id}` (read/update) · `POST /v1/campaigns/{id}/activate`, `/pause`, `/archive` |
| Ad groups | `POST /v1/ad_groups` · `GET /v1/ad_groups[?campaign_id=&name=]` · `GET/POST /v1/ad_groups/{id}` · `/activate`, `/pause`, `/archive` |
| Ads | `POST /v1/ads` · `GET /v1/ads/{id}[?include[]=serving_issues]` · `POST /v1/ads/{id}` (an update creates a new version and sends it back to review) · `/activate`, `/pause`, `/archive` · `POST /v1/ads/{id}/preview` |
| Images | `POST /v1/upload`, as multipart `file` or JSON `image_url`; returns a `file_id` |
| Bulk | `POST /v1/bulk_mutation_jobs` (up to 1,000 operations) · `GET .../{job_id}` · `GET .../{job_id}/operations` |
| Locations | `geo_lookup/search` |
| Insights | Four GET Insights endpoints exist per the changelog. Their paths weren't on the pages fetched, so look them up before building reporting. |

## Key fields
- **Campaign:**
  - `name`, `status`, `bidding_type` (`impressions` | `clicks` | `conversions`; always set it explicitly)
  - `budget.daily_spend_limit_micros`, where $30 = `30000000`
  - `targeting.locations` (countries, regions or markets) and `landing_page_configuration`
  - A `conversions` campaign needs an eligible conversion event first.
- **Ad group:**
  - `campaign_id`, `name`, `status` and `context_hints[]`. An update replaces the whole list, so send every hint you want to keep.
  - `bidding_config`: `billing_event_type` (`click`), `strategy`, and `max_bid_micros` for a fixed bid. Omit it for Maximize Results.
- **Ad:**
  - `ad_group_id`, `name`, `status`
  - `creative`: `type: "chat_card"`, `title` (3–50 characters), `body` (up to 100), `target_url`, `file_id`
- **Platforms:** `desktop_web`, `ios_web`, `android_web`, `web`.
