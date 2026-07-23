# Phase 0 — Spencer's Setup Checklist (one-time, ~2-3 hrs total)

_Everything on this list is identity/KYC work only you can do. Nothing here blocks Claude's Phase 1 build (kit content + articles are being drafted in parallel). Items are ordered — top items unblock the most._

## Do first (~45 min)
- [x] **Pick the brand** — DONE 2026-07-19: Route Ready / routereadykits.com
- [x] **Buy the domain** — DONE 2026-07-19: routereadykits.com (Squarespace; NS moved to Cloudflare)
- [x] **Create a business Google account** — DONE 2026-07-19: routereadykits@gmail.com (holds master Drive templates + GSC)
- [x] **Create Gumroad account** — DONE 2026-07-19: username `routeready`, payout setup done per Spencer (verify KYC cleared — post-launch queue)

## Do second (~45 min)
- [x] **Hosting** — DONE 2026-07-19: Vercel skipped (Hobby ToS); Cloudflare free plan, site deployed as Worker `route-ready-site`, live on routereadykits.com
- [x] **Google Ads** — DONE 2026-07-20 night: account 763-085-7815 (billing in, no campaign yet), MCC 143-307-0544, developer token (Test level), GCP project route-ready-ads/377890328473, Basic Access application submitted (~5 business days). Budget cap enforced at campaign level ($2.47/day) when campaign is built — account-level caps aren't available on non-invoiced accounts.
- [x] **Google Ads Basic Access APPROVED** — 2026-07-21 05:30 UTC (next-day, vs ~5-day estimate). Tool type: internal full service. Dev token on MCC 143-307-0544 can now hit production accounts.
- [ ] **Spencer: mint OAuth creds + fill `.env`** (~10 min, unblocks the launch campaign):
  1. In GCP project `route-ready-ads` (377890328473), APIs & Services → Credentials → Create OAuth client ID, type **Desktop app** (configure the consent screen as Internal/Testing with routereadykits@gmail.com if prompted). Copy client ID + secret.
  2. Run `node .claude/skills/ops-google-ads/scripts/get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>` and complete the browser consent **signed in as routereadykits@gmail.com** (the MCC admin).
  3. Add to `.env` (namespaced — the generic `GOOGLE_ADS_*` keys stay reserved for Got Moles):
     `ROUTE_READY_ADS_DEVELOPER_TOKEN` (from MCC 143-307-0544 → API Center), `ROUTE_READY_ADS_CLIENT_ID`, `ROUTE_READY_ADS_CLIENT_SECRET`, `ROUTE_READY_ADS_REFRESH_TOKEN`, `ROUTE_READY_ADS_LOGIN_CUSTOMER_ID=1433070544`, `ROUTE_READY_ADS_CUSTOMER_ID=7630857815`
  4. Then Claude: verify 763-085-7815 is linked under the MCC (`scripts/ads-link-invite.mjs`), smoke-test GAQL, build the launch Search campaign ($2.47/day cap) for sign-off, flip `ztb-ads-manager` cron active.

## Post-launch (added 2026-07-20)
- [x] **GSC property + sitemap** — DONE 2026-07-20: sc-domain:routereadykits.com verified via Cloudflare TXT record; sitemap.xml submitted (status will read "Couldn't fetch" until first crawl)
- [x] **Spencer: add `ROUTE_READY_GSC_SITE_URL` to `.env`** — DONE 2026-07-20; readiness `ga_or_gsc` green, digests now report GSC as connected

## Optional / later
- [ ] Pinterest business account (channel #3; can wait until content exists)
- [ ] Simple business entity/tax note: sole-prop under your name is fine for the experiment; talk to your accountant about whether to fold revenue into an existing entity. (Not legal advice.)

## What happens the moment each box is ticked
- Domain + hosting → I deploy the site skeleton and launch articles
- Google account → I build the master template Sheets/Docs
- Gumroad → I create Kit #1 via API (unpublished) for your approval
- Ads account → launch campaign goes live at $75/mo cap after first products are up
