# Phase 0 — Spencer's Setup Checklist (one-time, ~2-3 hrs total)

_Everything on this list is identity/KYC work only you can do. Nothing here blocks Claude's Phase 1 build (kit content + articles are being drafted in parallel). Items are ordered — top items unblock the most._

## Do first (~45 min)
- [x] **Pick the brand** — DONE 2026-07-19: Route Ready / routereadykits.com
- [x] **Buy the domain** — DONE 2026-07-19: routereadykits.com (Squarespace; NS moved to Cloudflare)
- [x] **Create a business Google account** — DONE 2026-07-19: routereadykits@gmail.com (holds master Drive templates + GSC)
- [x] **Create Gumroad account** — DONE 2026-07-19: username `routeready`, payout setup done per Spencer (verify KYC cleared — post-launch queue)

## Do second (~45 min)
- [x] **Hosting** — DONE 2026-07-19: Vercel skipped (Hobby ToS); Cloudflare free plan, site deployed as Worker `route-ready-site`, live on routereadykits.com
- [ ] **Google Ads**: new account under the business Google login. Add billing + set a $75/mo budget cap at account level. I'll wire it into the ops-google-ads engine after (same creds pattern as Got Moles, separate account).

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
