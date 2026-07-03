# Got Moles Pre-Flip SEO + GEO Readiness Audit

**Date:** 2026-04-29
**Flip target:** Friday 2026-05-02 (3 days)
**Preview URL:** https://project-pf8c6.vercel.app
**Production target:** https://got-moles.com
**Scope:** Full pre-flip readiness — what must be closed before DNS, what should be, what can wait.

---

## Headline Verdict

**Site is content- and schema-ready. Tracking is the launch blocker.** The Analytics component is built correctly but **never wired to the actual phone CTAs**, and the Google Ads conversion path is still firing to a literal `CONVERSION_LABEL` placeholder. Flipping DNS today would mean three days of paid-search and direct call traffic with **zero conversion attribution and bogus GAds conversion data polluting the account from hour one**.

Schema, sitemap, robots, and content layers are launch-ready. The blockers are all in the measurement layer plus a handful of Vercel-side config items (domain not added, middleware rate-limiter still in code, BotID/WAF off).

---

## Pillar Scores

| Pillar | Weight | Score | Notes |
|--------|:-:|:-:|-----|
| GBP / Local | 35% | not re-scored | Per Step 0 — owned by `got-moles-measurement-setup` brief; GBPs not yet pointed at new domain |
| Authority (schema + citation rubric) | 25% | 88/100 | Strong. 3 GBP departments, 219 review count, speakable, BreadcrumbList. BBB missing from sameAs. |
| AI Overview presence | 20% | not re-scored | Baseline lives in 2026-04-20 report; re-test post-flip when on production domain |
| Service-area coverage | 10% | scoped elsewhere | 17 uncovered URL patterns — `seo-geo-reinforcement` Track A1 |
| Technical (render + tracking) | 10% | **40/100** | Render clean. Tracking scaffolded but unwired. |

**Composite readiness for flip: ~70/100. Pull tracking up to 80+ and you're at 88/100, which is a green-light flip.**

---

## 🔴 Launch-Blockers (must-fix before Friday)

These are real consequences, not hygiene. Each has a one-shot fix.

### 1. Phone-call tracking never wired to phone CTAs
**Severity:** Critical. Three days of paid + organic traffic with no call attribution.

`src/components/Analytics.tsx:87-111` defines `trackPhoneCall()` — it fires GA4 + Google Ads + Meta + Bing UET. But **no component in the site calls it.** Every `tel:` link is a bare `<a>`:

- `components/Footer.tsx:82`
- `components/LandingPage.tsx:28, 117`
- `components/blocks/CTABlock.tsx:29, 74`
- `components/blocks/HeroBlock.tsx:79`
- `components/CTABlock.tsx:18-19`
- `components/MobileStickyBar.tsx:9`
- `components/Header.tsx:35`
- `app/(frontend)/[citySlug]/page.tsx:181`
- Payload migration defaults: `migrations/20260406_151306.ts:122,123,149,150,377,378,406,407`

**Fix:** Add `onClick={() => trackPhoneCall()}` to every `tel:` anchor. ~10 component touches plus the migration defaults. Single PR.

### 2. `CONVERSION_LABEL` is a literal placeholder
**Severity:** Critical. Will register false conversions or silently fail.

`Analytics.tsx:99` and `:127` send to `${GADS_ID}/CONVERSION_LABEL` — `CONVERSION_LABEL` is the literal string, never replaced.

**Fix:**
1. Create two conversion actions in Google Ads: `Phone Call` and `Form Submit`
2. Copy the conversion labels into env vars: `NEXT_PUBLIC_GADS_PHONE_LABEL` and `NEXT_PUBLIC_GADS_FORM_LABEL`
3. Replace literals at `Analytics.tsx:99, 127` with the env-var refs
4. Add to Vercel production env

LAUNCH-CHECKLIST line 147 already logs this as outstanding.

### 3. `robots.txt` will block production if `VERCEL_PROJECT_PRODUCTION_URL` resolves wrong
**Severity:** Catastrophic if it triggers. Total deindex.

`src/app/robots.ts` returns `disallow: /` on any host other than `got-moles.com`. Post-flip, `VERCEL_PROJECT_PRODUCTION_URL` must equal `got-moles.com`.

**Fix:** In Vercel Settings → Domains, set `got-moles.com` as the **Production Domain** (the primary, not just an alias) before flipping DNS. Verify via `curl https://got-moles.com/robots.txt` immediately after flip — must show `User-agent: * / Allow: /`. LAUNCH-CHECKLIST line 33 calls this out.

### 4. `got-moles.com` not yet added to Vercel
**Severity:** Hard blocker.

LAUNCH-CHECKLIST line 34. DNS flip without the domain registered in Vercel = SSL fails = site down.

**Fix:** Add domain in Vercel Domains tab now, before flip. Vercel will issue cert when DNS propagates.

### 5. In-memory rate limiter in `middleware.ts`
**Severity:** High. Doesn't crash, but causes inconsistent rate-limiting on Vercel serverless (each cold start = new memory). Will produce false 429s under traffic.

LAUNCH-CHECKLIST line 38 already flags removal.

**Fix:** Delete the rate-limiter block from `src/middleware.ts`. Replace with Vercel WAF Rate Limiting (Pro feature, point-and-click) post-flip.

---

## 🟡 Should-Fix Before Flip (high leverage, low effort)

### 6. Add BBB to `sameAs`
`src/lib/schema.tsx:25-36` lists Facebook, Instagram, LinkedIn, Yelp, Nextdoor, 3 GBP URLs. Missing BBB profile URL. BBB is a top disambiguation signal for AI assistants in the US service-business category.

**Fix:** One line add. Get Spencer to confirm BBB profile URL.

### 7. Define `WebSite` schema with `@id`
`schema.tsx:546` references `${BUSINESS.url}/#website` in `isPartOf` but the WebSite entity is never defined. AI parsers will silently drop the relationship.

**Fix:** Add a `WebSite` `@graph` node with matching `@id`, `name`, `url`, and a `potentialAction` SearchAction pointing at `/search?q={search_term_string}` (or omit if no internal search).

### 8. Vercel BotID + WAF baseline rules
LAUNCH-CHECKLIST lines 35-37. Off by default. Without them, the contact form will be scraped within hours of flip.

**Fix:** Enable BotID in Vercel Firewall → toggle on. Add 3 WAF rules: block `/api/contact` POSTs without referer match, rate-limit `/api/*` to 10 rpm/IP, block known scrapers user-agent list. Point-and-click in dashboard.

### 9. DNS records pre-stage
SPF, DKIM, DMARC pending Spencer pull (memory 2026-04-27). DMARC currently routes to old agency. Without correct email auth, Jobber-form-driven emails may end up in spam from day one.

**Fix:** Get DKIM value from Spencer, push SPF/DKIM/DMARC into GoDaddy DNS today, verify with mxtoolbox, before DNS flip Friday.

---

## 📞 Phone Tracking — Strategic Note

You asked specifically about phone tracking. Here's the full picture beyond the wiring blocker:

**What you have:**
- One phone number `(253) 750-0211` hardcoded sitewide and across all 3 GBP locations
- GA4 / Google Ads / Meta Pixel / Bing UET helpers ready (just unwired)

**What you don't have:**
- **Per-location attribution.** All 3 GBPs (Seattle / Tacoma / Enumclaw) ring the same number. You cannot tell which GBP drove a call.
- **Source attribution at the call level.** No Dynamic Number Insertion (DNI), no CallRail / WhatConverts / Invoca. A call from a Google Ads click looks identical to a call from organic.
- **Server-side conversion tracking.** No Meta CAPI. iOS 14.5+ ATT-blocked Pixel events are lost.
- **GTM container.** Direct gtag means every tracking change requires a deploy.

**Recommendation for the launch window:**
- Wire `trackPhoneCall()` and replace `CONVERSION_LABEL` (Blocker #1 + #2) — this is the minimum to call the site "tracked."
- **Defer** call-tracking provider, DNI, CAPI, GTM container to post-flip. They are leverage upgrades, not launch requirements. Add to `got-moles-measurement-setup` Phase 2.
- For per-location attribution, the cheapest first move is a CallRail account ($45/mo for 3 numbers) and DNI on the city pages by detected GBP region. Single sprint, post-flip.

---

## 📋 Post-Flip Backlog (first 30 days)

These are real but not flip-blocking. Cluster them for Week 1 / Week 2-4.

### Week 1 (post-flip stabilization)
- Verify `robots.txt` serves `Allow: /` on production
- Submit sitemap to GSC + Bing Webmaster Tools (the latter unlocks AI Performance report after 7 days)
- Verify GA4 + GAds + Meta + Bing UET firing on real traffic
- Point all 3 GBPs at `https://got-moles.com` (not the old domain)
- Add Apple Business Connect listing (3 locations)
- Spot-test 5 redirects from the 291-redirect map

### Weeks 2-4 (depth)
- Launch CallRail (3 numbers) + DNI on city pages
- Implement Meta CAPI (server-side)
- Add BBB sameAs (#6 if deferred)
- Re-run AI Overview citation sweep (Step 5 of skill) on production domain — compare vs 2026-04-20 baseline
- Service-area reconciliation: 17 uncovered URL patterns (Track A1 of `seo-geo-reinforcement`)
- 24 shadow review pages (Track of `reviews-testimonials-seo`, awaiting Ian sign-off)
- Bing AI Performance report check (after 7+ days of property verification)
- Per-location phones if Spencer agrees — strongest local-entity signal you can buy

---

## 🔄 Already In Flight (Step 0 register — annotated, not duplicated)

The audit found these gaps but they live inside other briefs. Not relisting them as findings:

| Gap | Lives in |
|-----|---------|
| GBP audit per location, review velocity, Apple Business Connect, Bing Places | `got-moles-measurement-setup` |
| Service-area URL coverage (17 uncovered) | `seo-geo-reinforcement` Track A1 |
| Reviews hub + 24 shadow pages | `reviews-testimonials-seo` (Ian sign-off) |
| Meta Pixel access | `meta-ads-tmcp-quiz` (Spencer-blocked on Business Portfolio) |
| Bing UET | `google-ads-campaigns` (Spencer to create Bing Ads account) |
| GA4 / GAds env wiring | `got-moles-measurement-setup` Track A — env vars live in Vercel as of 2026-04-26 |
| Blog launch readiness (35 posts, schema, internal links) | `blog-launch-readiness` ✅ COMPLETE 2026-04-24 |

---

## Friday-Morning Smoke Test (run before flipping DNS)

Five-minute pre-flight on `project-pf8c6.vercel.app`:

1. Click a phone CTA on `/`, `/locations/seattle`, and a blog post. Open GA4 DebugView in another tab — confirm `phone_call` event fires three times.
2. Submit the contact form with test data. Confirm `form_submit` event fires.
3. `curl -A "GPTBot" https://project-pf8c6.vercel.app | grep "@type"` — confirm Organization, LocalBusiness, BreadcrumbList JSON-LD render.
4. `curl https://project-pf8c6.vercel.app/robots.txt` — confirm `Disallow: /` on staging (correct behavior).
5. Check Vercel Domains tab — confirm `got-moles.com` is added as Production Domain.

If any of these fail, do not flip.

---

## Top 5 Fixes — Priority Stack

1. **Wire `trackPhoneCall()` to all `tel:` links** — 10 components + migration defaults
2. **Replace `CONVERSION_LABEL` placeholder** — create GAds conversion actions, env vars, code update
3. **Add `got-moles.com` to Vercel Domains as Production Domain** — unblocks robots.txt + SSL
4. **Remove in-memory rate-limiter from middleware.ts**
5. **Pre-stage SPF / DKIM / DMARC in GoDaddy** — needs Spencer DKIM pull

Items 1, 2, 4 = code (one PR). Items 3, 5 = config + Spencer.

---

*Next re-audit: 2026-05-09 (one week post-flip) — re-score AI Overview citations on production domain, verify GBP migration, baseline call-tracking volume.*
