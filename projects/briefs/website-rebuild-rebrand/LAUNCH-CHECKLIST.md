# Got Moles — Launch Week Checklist

**Launch window:** Targeting week of 2026-04-27 (DNS switch)
**Pending external:** Ian's SEO migration sign-off
**Current staging:** https://project-pf8c6.vercel.app
**Target production:** https://got-moles.com

> **Notion runbook:** [Flip Day Plan — Got Moles Website Launch](https://www.notion.so/Flip-Day-Plan-Got-Moles-Website-Launch-34f3d42c4a9c815c9ba1f697e44e735d) (page ID `34f3d42c-4a9c-815c-9ba1-f697e44e735d`)

---

## Architecture (final, post-research 2026-04-27)

**No Cloudflare account required.** Research confirmed Vercel actively recommends against Cloudflare proxy in front of their platform — degrades Bot Protection accuracy, masks `X-Forwarded-For`, double-cache layer, and Bot Protection literally doesn't work with a reverse proxy in front (Vercel docs verbatim).

**Final stack:**
- **Registrar + DNS:** GoDaddy (Spencer owns) — keeps DNS at the registrar, Spencer can self-serve, no third-party in the path
- **Hosting / CDN / SSL:** Vercel — automatic
- **Security:** Vercel native — DDoS mitigation (free, all plans), Vercel WAF Custom Rules (Pro), Vercel BotID (Pro) — invisible bot detection, no CAPTCHA widget
- **Form spam protection:** Existing honeypot field in code + Vercel BotID + Vercel Custom Rule rate limit on `/api/contact`
- **Email:** Spencer's existing Google Workspace MX records preserved verbatim

What's NOT in this stack: Cloudflare (any tier), Cloudflare Turnstile, Cloudflare proxy, Cloudflare WAF, Cloudflare Page Rules. None of it needed.

---

## Pre-DNS (do anytime this week)

These can be done before DNS switch — they don't affect the live site.

- [ ] **Tracking IDs into Vercel env vars** — GA4, Meta Pixel, Google Ads, CallRail. Five env vars: `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GADS_ID`, `NEXT_PUBLIC_CALLRAIL_COMPANY_ID`, `NEXT_PUBLIC_CALLRAIL_KEY`. Analytics.tsx + layout.tsx read these conditionally. **Status 2026-04-30:** GA4 + GAds live; Meta Pixel Spencer-blocked; CallRail values: `NEXT_PUBLIC_CALLRAIL_COMPANY_ID=438678888`, `NEXT_PUBLIC_CALLRAIL_KEY=d7c60fc985ac8f0eda75`.
- [ ] **Final staging smoke test on mobile** — Spencer or Roy eyeball on `project-pf8c6.vercel.app` from a phone. **Status:** complete 2026-04-25.
- [ ] **Confirm `VERCEL_PROJECT_PRODUCTION_URL` will resolve to `got-moles.com` post-flip** — `robots.ts` uses this to decide staging vs production. Pre-flip the value is `project-pf8c6.vercel.app`; post-flip auto-becomes `got-moles.com` (shortest custom domain wins per Vercel docs). Action: add `got-moles.com` to Vercel project Domains tab pre-flip with TXT verification.
- [ ] **Add `got-moles.com` to Vercel project Domains tab** — pre-flip step. Vercel asks for a `_vercel` TXT verification record. Without this, post-flip requests hit Vercel and 404. **B4 from launch-readiness brief.**
- [ ] **Enable Vercel BotID** on the project — Project Settings → Bot Protection → Challenge mode. Replaces Cloudflare Turnstile. Free toggle on Pro plan.
- [ ] **Add Vercel WAF Custom Rule:** rate limit `/api/contact` to 3 req / 10 min / IP → 429. One-time setup in Vercel Firewall dashboard.
- [ ] **Add Vercel WAF Custom Rule:** rate limit `/admin/*` to 10 req / 1 min / IP → 429.
- [ ] **Simplify `src/middleware.ts`** — delete the in-memory rate limiter (broken on Vercel serverless per its own code comment). Keep the `noindex-non-prod-host` logic. The Vercel Custom Rules above replace it cleanly.
- [ ] **Confirm GBP locations ready to update** — 3 Google Business Profile locations (Seattle, Tacoma, Enumclaw) will need website field updated to got-moles.com within 24 hours of DNS switch.

---

## Jobber Integration

**Status 2026-04-25:** Spencer authorized; contact form lead-capture wired and working on staging. Open: D1a quote-option flow decision (Roy decision pending).

Original setup notes preserved below for reference.

### Setup completed

- [x] Developer app registered at `developer.getjobber.com` with `client_id` + `client_secret`
- [x] `src/app/(frontend)/api/jobber/authorize` deployed
- [x] `src/app/(frontend)/api/jobber/callback` deployed
- [x] `src/collections/Leads.ts` deployed — Payload collection as lead source-of-truth
- [x] Vercel env vars set: `JOBBER_CLIENT_ID`, `JOBBER_CLIENT_SECRET`, `JOBBER_REFRESH_TOKEN`
- [x] Spencer authorized OAuth handshake; refresh token captured and installed
- [x] Contact form wired end-to-end and confirmed working on staging

### Post-flip task

- [x] ~~Register `https://got-moles.com/api/jobber/callback` as a second redirect URI~~ — N/A. OAuth setup routes removed 2026-05-01 (refresh token already issued and in Vercel env). If re-auth ever needed, temporarily restore routes from git history, run flow, re-delete.

---

## DNS Migration to GoDaddy (replaces previous "Cloudflare Setup" section)

The domain `got-moles.com` is registered at GoDaddy (Spencer owns) but currently uses agency Cloudflare nameservers (`asa.ns.cloudflare.com` / `guss.ns.cloudflare.com`). The agency owns those records — we don't have access. Migration plan:

1. Spencer changes nameservers at GoDaddy from agency CF → GoDaddy's own nameservers (`ns73.domaincontrol.com` + similar) at flip time
2. GoDaddy initially has no DNS records for `got-moles.com` (it was using external NS) — Spencer (or Roy via screen-share / temp DNS edit access) manually adds the 13 records below
3. Vercel auto-handles SSL once DNS resolves to it

### Records to add at GoDaddy DNS panel (post-NS-change)

> **Capture verified 2026-04-27 via dns.google live query.** All MX, TXT, CNAME values preserved verbatim from current Cloudflare zone. Three new/updated records flagged.

| # | Type | Host | Value | Priority | Notes |
|---|---|---|---|---|---|
| 1 | A | `@` | `76.76.21.21` | — | Vercel apex IP |
| 2 | CNAME | `www` | `cname.vercel-dns.com` | — | Vercel CDN |
| 3 | MX | `@` | `aspmx.l.google.com` | 10 | Google Workspace |
| 4 | MX | `@` | `alt1.aspmx.l.google.com` | 20 | Google Workspace |
| 5 | MX | `@` | `alt2.aspmx.l.google.com` | 30 | Google Workspace |
| 6 | MX | `@` | `alt3.aspmx.l.google.com` | 40 | Google Workspace |
| 7 | MX | `@` | `alt4.aspmx.l.google.com` | 50 | Google Workspace |
| 8 | TXT | `@` | `google-site-verification=tnRJRvBh5x06FycvEEJwgFLw0rKFaRYeHEhibtOfOFc` | — | GSC ownership #1 |
| 9 | TXT | `@` | `google-site-verification=ZHhsFF89Wxq1iiSMD0DTE_qTpxwphGxwXTaOijMDB38` | — | GSC ownership #2 |
| 10 | TXT | `@` | `v=spf1 include:_spf.google.com ~all` | — | **NEW** — SPF was missing, this is a deliverability fix |
| 11 | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:spencer@got-moles.com` | — | **UPDATED 2026-05-01** — was sending reports to agency emails (`titus.whitemarketing@gmail.com`, `mitch@white.am`), now Spencer only (Roy removed from public DNS for privacy). |
| 12 | TXT | `google._domainkey` | (Spencer copies from Google Workspace admin) | — | **VERIFY** — Spencer pulls from Apps → Google Workspace → Gmail → Authenticate email. If never set up, generate now. |
| 13 | CNAME | `score` | `dns.scoreapp.net` | — | ScoreApp quiz subdomain |

### Records NOT migrated

- AAAA — Vercel doesn't support IPv6
- NS — replaced by GoDaddy's own nameservers
- CAA — none currently set; not needed (Vercel auto-creates Let's Encrypt CAA)

### Cutover flow

- [ ] **T-72h:** Spencer pulls DKIM TXT value from Google Workspace admin, sends to Roy
- [ ] **T-72h:** Roy adds `got-moles.com` to Vercel project Domains tab → captures `_vercel` TXT verification record
- [ ] **T-24h:** Spencer logs into GoDaddy, confirms login works, locates Nameserver settings page
- [ ] **T0:** Spencer changes GoDaddy nameservers from `asa.ns.cloudflare.com` / `guss.ns.cloudflare.com` → GoDaddy's default nameservers
- [ ] **T0+5min:** Spencer (or Roy via screen-share) adds the 13 records above to GoDaddy DNS panel
- [ ] **T+30min:** Verify each record resolves: `nslookup got-moles.com 1.1.1.1`, `nslookup -type=mx got-moles.com 1.1.1.1`, `nslookup -type=txt got-moles.com 1.1.1.1`, `nslookup -type=cname score.got-moles.com 1.1.1.1`
- [ ] **T+1h:** Send a test email to `spencer@got-moles.com` from external address — verify delivery (no spam folder, no auth failures in headers)
- [ ] **T+1h:** Verify ScoreApp quiz still loads at `score.got-moles.com`
- [ ] **T+24h:** Verify Vercel SSL cert issued automatically for `got-moles.com` + `www.got-moles.com` (browser test — no warnings)

### Rollback

If anything goes wrong: Spencer reverts GoDaddy nameservers to `asa.ns.cloudflare.com` / `guss.ns.cloudflare.com`. Old WordPress + Google Workspace email resume working (~5-30 min propagation back). Diagnose, retry next day.

---

## DNS Switch Day Order

### T-1h: Pre-flight

- [ ] Roy + Spencer + Ian on call/Slack channel
- [ ] Confirm Vercel Domains tab shows `got-moles.com` "Valid Configuration"
- [ ] Spencer logged into GoDaddy, on the nameservers page
- [ ] Final go/no-go from Ian

### T0: The flip

- [ ] Spencer changes GoDaddy nameservers (~2 min)
- [ ] Roy starts polling: `nslookup got-moles.com 1.1.1.1` every 30s
- [ ] Roy opens [whatsmydns.net](https://whatsmydns.net) NS propagation map

### T+5min to T+1h: propagation + verification

- [ ] Wait for ~50% global propagation
- [ ] Spencer/Roy add 13 DNS records at GoDaddy (per migration table above)
- [ ] `curl https://got-moles.com/robots.txt` shows 19-bot allowlist + production sitemap URL (NOT `disallow: /`)
- [ ] `curl https://got-moles.com/sitemap.xml` returns ~110 URLs
- [ ] Spot-check 10 redirects: `curl -I -L https://got-moles.com/<old-url>` → 301 → 200. Any 404, escalate.
- [ ] Verify HTTPS cert is valid
- [ ] Test email to `spencer@got-moles.com` from external address — verify delivery
- [ ] Verify ScoreApp at `score.got-moles.com`

**Decision gate:** If any verification fails → rollback. If all pass → proceed.

### T+1h to T+4h: tracking + indexing kickoff

- [ ] **F8.** Connect CallRail Google Ads integration (CallRail Settings → Integrations → Google Ads). CallRail auto-creates the `Phone Call` and `Form Capture` conversion actions in GAds and imports calls/form submissions natively. Verify both actions appear in Google Ads → Conversions panel with source "Import from clicks". Note: the previous `CONVERSION_LABEL` placeholder approach in `Analytics.tsx` was removed 2026-04-30 — CallRail owns GAds call/form conversions now. Connect CallRail's GA4 integration in the same step (needs GA4 Measurement ID + API Secret).
- [ ] GSC: add property `got-moles.com`, DNS TXT verify, submit sitemap
- [ ] GSC: request indexing on 10 priority URLs (homepage, 3 services, service-areas, top 5 cities)
- [ ] Bing Webmaster Tools: add property, verify, submit sitemap
- [ ] Run [Rich Results Test](https://search.google.com/test/rich-results) on 7 page templates
- [ ] PageSpeed Insights mobile + desktop on homepage and 1 city page
- [ ] Verify GA4 Realtime shows production traffic
- [ ] Verify Tag Assistant + DevTools Network tab finds GA4 + GAds on production homepage

### T+24h: profile + presence

- [ ] Update 3 GBP locations website field → `https://got-moles.com/`
- [ ] GBP "new website, same team" post on each location with before/after photo
- [ ] Facebook page website URL → `got-moles.com`
- [ ] Instagram bio URL → `got-moles.com`
- [ ] LinkedIn company page → `got-moles.com`
- [ ] Yelp Enumclaw website URL → `got-moles.com`
- [ ] Nextdoor Enumclaw website URL → `got-moles.com`
- [ ] Apple Business Connect — claim 3 locations (if not done pre-flip)
- [ ] Re-run `str-ai-seo-local` audit on production

---

## Week 1 Post-Launch

- [ ] **Daily GSC check** — indexation progress. Expect 40-60% of URLs indexed within 7 days.
- [ ] **Core Web Vitals field data** — check CrUX / GSC Experience report day 3 and day 7.
- [ ] **Watch for 404s** — GSC Coverage report flags unexpected 404s.
- [ ] **Monitor `robots.txt` requests in Vercel logs** — confirm GPTBot, ClaudeBot, PerplexityBot, Googlebot, Bingbot are hitting.
- [ ] **Monitor Vercel Firewall observability** — WAF blocks, rate-limit 429s, BotID challenges. Adjust rules if false positives appear.

---

## Week 2-4 Post-Launch

- [ ] **AI visibility baseline** — run the 15 priority queries from `projects/str-ai-seo/2026-04-20_full-seo-geo-report.md` Part 9 against Google AI Overviews, ChatGPT, Perplexity, Claude. Record citation presence per engine per query.
- [ ] **Schema errors zero** — GSC Enhancements > FAQ / Breadcrumb / Product / LocalBusiness all at 0 errors.
- [ ] **Organic traffic trajectory** — compare to old site. Ranking shifts take 2-4 weeks to stabilise.
- [ ] **Review per-URL changes** — any URL that lost a position vs old site flagged for investigation.

---

## Month 2+ (Ongoing)

- [ ] **30-day AI visibility re-check** — same 15 queries, measure lift.
- [ ] **Monthly GSC review** — impressions, clicks, CTR per page type.
- [ ] **Tier 2 myth-bust blogs** — 3 posts queued.
- [ ] **Tier 3 safety/concern blogs** — 4 posts queued.
- [ ] **County hub pages** — 5 planned, Roy scope decision pending.
- [ ] **Shadow pages (24)** — Ian sign-off separate deliverable.

---

## Blockers That Won't Resolve in Launch Week

- **Meta Pixel** — Spencer-blocked (Business Portfolio admin access pending).
- **SiteSettings remainder** — Spencer owes default OG image, social URLs confirm.
- **Design unification final sign-off** — Moni. Site ships without her final stamp; post-launch touch-ups can happen without rework.

---

## Owner Map

| Task | Owner |
|---|---|
| Tracking IDs (Vercel env) | Roy |
| DNS switch (GoDaddy nameservers) | Spencer |
| GoDaddy DNS records (13 entries) | Roy via screen-share with Spencer, or Spencer with dictation |
| DKIM lookup from Google Workspace admin | Spencer |
| Vercel BotID + WAF Custom Rules setup | Roy |
| GSC / Bing setup | Roy |
| Rich Results / PageSpeed | Roy or Claude Code |
| GBP website updates | Roy or Spencer |
| Jobber API | Spencer (auth done) → Roy (post-flip callback URL update) |
| SiteSettings data | Spencer |
| Ian SEO migration sign-off | Ian |
| AI visibility monitoring | Claude Code (monthly re-run) |
| Tier 2+ blog production | Claude Code via `ops-blog-pipeline` |

---

*Last updated 2026-04-27. Architecture pivot: dropped Cloudflare entirely (Vercel docs explicitly recommend against CF proxy in front), DNS at GoDaddy, Vercel BotID + native WAF replaces Turnstile + CF WAF.*
