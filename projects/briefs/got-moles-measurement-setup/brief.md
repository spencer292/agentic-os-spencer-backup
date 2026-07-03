---
project: got-moles-measurement-setup
status: active
level: 2
created: 2026-04-22
updated: 2026-04-23
parent: got-moles-marketing-os
---

# Got Moles — Measurement & Tracking Setup

## Goal

Stand up the full measurement layer the new site sits on — search presence (GSC + Bing + Apple), analytics foundation (GA4 + event model), channel tracking (Meta Pixel+CAPI, Google Ads, Bing UET), and the profile/presence updates that follow DNS switch — so that from the moment `got-moles.com` flips to the new build we have indexation, organic attribution, paid attribution, and a baseline to measure lift against.

This is the layer. Ads, SEO content, GEO, and conversion optimisation all sit on top of it. Without it, everything that lands after launch is uncaptured.

## 2026-04-23 strategy pivot

Agency recon via Google Ads Transparency Center + SpyFu Basic ($39) surfaced evidence that collapses the prior "agency handover critical, cold-start 4-6 weeks" framing. See `reports/2026-04-23_agency-recon-and-strategy-pivot.md` for full detail. Headline findings:

- **Agency identified:** White Marketing Services (small, non-national, no public pest-control portfolio).
- **Google Ads footprint:** 5 unique ad creatives across 3 years, 1 active paid keyword (295 lifetime → 99.7% wound-down), $60.36/month estimated Search spend vs $844/month reported.
- **Channel mix hypothesis:** LSAs carry ~90% of paid spend. LSAs are tied to Spencer's GBP + business verification, not to the agency's Google Ads MCC — **they transfer via Spencer's ownership, not via agency cooperation**.
- **Market is soft:** 10 direct/adjacent WA mole-control competitors, only 3 show overlapping paid-search activity in SpyFu's Venn. No competitor appears aggressive on paid.

**Decision:** Abandon the handover fight. Cold-start Google + Bing Search under Spencer's ownership, transfer LSAs directly via GBP, launch by 2026-05-05 to catch peak season (May-September). Track D (historical data recovery) becomes low-priority — nothing meaningful to recover.

## 2026-04-23 afternoon corrections

- **PPC Growth spreadsheet confirms $844/mo spend is real** ($6,127 Google + $3,159 Bing over 11 months 2025, 903 leads, $10.28 CPL). Internally consistent. Not fabricated.
- **SEO is gaining, not declining** — agency's SEO Progress sheet shows +78 top-3 keywords over 6 months (620 → 698). SpyFu's "−46" figure was a different metric. Correcting prior "agency neglecting SEO" framing.
- **LSAs likely not running** — SERP check on `mole removal seattle` shows no Google Guaranteed box for any mole company. Got Moles appears as regular Sponsored Search Ad only. Two verifications pending from Spencer: Checkr history + credit card check for `GOOGLE*ADS`/`GOOGLE*LSA` charges.
- **$557/mo Google spend likely = Performance Max** (invisible to SpyFu), not LSAs. Agency running PMax + minimal Search.
- **Launch-blocker surfaced:** site supports 1 location, Spencer has 3 GBPs. See Track E0 below.
- **New competitors surfaced from SERP recon:** Holly Moley! (added to Tier 1), Insight Pest Control (7.1K reviews, dominant WA generalist).
- **Review-volume gap:** Got Moles Seattle GBP 135 reviews vs Mole Masters 356. Launch-window lever — review-generation campaign, cheap + high ROI.

## Scope context

Supersedes and subsumes:
- `seo-geo-reinforcement/brief.md` **Track B** ("Google Ads: Campaign Type Completeness + Landing Pages") — conversion tracking hooks (B6) and the 12-row paid-readiness prerequisites inventory move here. Track B stays focused on campaign structure and LPs.
- The dormant `got-moles-ads-tracking` project scaffolded 2026-04-17 — never got briefs written. Content folded in.

Current-state anchors:
- `Analytics.tsx` exists, env-var gated: GA4, Google Ads, Meta Pixel wired (no Bing UET, no Meta CAPI, `CONVERSION_LABEL` literal placeholder on lines 96 + 120).
- `feedback_ads_tracking_two_layers.md` (memory): measurement layer (this L2) and management layer (ads campaign briefs) never conflate.
- `project_got_moles_ads_ownership.md` (memory): previous agency data flagged "unreachable — cold-start 4–6 weeks." Track D here tests whether any handoff is still recoverable before we write it off.

---

## Scope — 7 Tracks

### Track A — Search consoles + site verification

The minute DNS flips, search engines need pointed at the new property, the sitemap, and a verified owner. Two platforms are must-have, two are optional but cheap.

- **A1 — Google Search Console (new property).** Claim `got-moles.com`. DNS TXT verification (Cloudflare / GoDaddy — depends on Ian's DNS setup). Submit `/sitemap.xml`. Request indexing on 10 priority URLs: homepage, 3 services (TMCP, One-Time, Commercial), service-areas, 5 top city pages (Seattle / Bellevue / Sammamish / Tacoma / Puyallup).
- **A2 — Bing Webmaster Tools.** Add property, verify (same DNS TXT if platform supports it, or Bing-issued token meta), submit sitemap. Bing = 34% of historical paid mix per previous-agency baseline — not optional despite being smaller than Google.
- **A3 — Apple Business Connect.** Free. Updates how the business appears in Apple Maps, Siri, Spotlight. Often missed on local-service builds. Single-city listing OK for Enumclaw HQ, mirrors GBP data.
- **A4 — Historical GSC property handoff (old site).** Previous agency controlled the old `got-moles.com` GSC. Determine whether handoff is still recoverable via Spencer or if we cold-start. Value = 2+ years of query data to compare against post-launch indexation.

**Output:** `reports/search-console-setup.md` — property IDs, verification method used, sitemap submission date, indexing request log.

### Track B — Analytics foundation

GA4 + a locked event model, modelled on the ATP taxonomy already in place (`project_atp_tracking_setup.md` — 4-action: Calendar primary / Phone primary / Quiz secondary / Contact form secondary).

- **B1 — GA4 property creation.** Roy creates new GA4 property for `got-moles.com`. No dependence on Spencer. Links to Google Ads account once that's resolved (Track C3).
- **B2 — Env var install.** `NEXT_PUBLIC_GA4_ID` into Vercel production + preview. `Analytics.tsx` picks it up conditionally.
- **B3 — Event model lock.** 4-action taxonomy mapped to Got Moles surfaces:
  - **Phone click (primary conversion)** — every `tel:` link on site fires `trackPhoneCall()`
  - **Form submit (primary conversion)** — contact form fires `trackFormSubmit()` on success
  - **Quiz start / complete (secondary)** — if we integrate ScoreApp quiz link later, quiz events flow through
  - **GBP-direct / "Get Directions" (secondary)** — GBP already tracks this natively; cross-reference only
- **B4 — GA4 → BigQuery link (optional but cheap).** Free tier. Captures raw event stream for later analysis without depending on GA4's sampling.
- **B5 — Conversion marking.** Mark `generate_lead` + phone call events as key events in GA4 UI so they appear in reports.
- **B6 — Dashboard scaffolding.** Looker Studio dashboard with traffic / conversions / per-city performance / per-page performance. Template mirrors ATP dashboard once that settles.
- **B7 — Historical GA4 handoff (old site).** Same as A4 — determine recoverability. Delta-analysis is only as good as the baseline.

**Output:** `reports/ga4-setup.md` — property ID, event model doc, dashboard URL.

### Track C — Channel tracking (tag stack)

The three tag stacks the site needs. Two have code, one is net-new.

- **C1 — Meta Pixel (install).** `NEXT_PUBLIC_META_PIXEL_ID` env var. Pixel code in `Analytics.tsx` already fires PageView. Verify via Meta Events Manager + Pixel Helper browser extension.
- **C2 — Meta CAPI (server-side — NEW code).** iOS14.5+ and browser privacy mode kill a meaningful share of Pixel events. CAPI sends the same events server-side from our Next.js API route, de-duplicated against Pixel via `event_id`. Table stakes for paid Meta. Needs:
  - `/api/meta-capi` route that accepts `{event_name, event_id, user_data, custom_data}`
  - `trackPhoneCall` / `trackFormSubmit` in `Analytics.tsx` updated to POST to that route alongside the client-side fire
  - Meta Conversions API access token (Meta Business Suite — Roy has access)
  - Business-event matching config in Meta Events Manager
- **C3 — Google Ads conversion tracking.** `NEXT_PUBLIC_GADS_ID` env var. Blocked on Spencer handoff for Google Ads account — needed to define conversion actions (phone, form) and get the real conversion labels. Once defined:
  - Replace `CONVERSION_LABEL` placeholder on `Analytics.tsx` lines 96 + 120 with real labels
  - Move labels to env vars: `NEXT_PUBLIC_GADS_CONVERSION_PHONE`, `NEXT_PUBLIC_GADS_CONVERSION_FORM`
  - Verify via Google Tag Assistant
- **C4 — Bing UET (NEW — code doesn't exist yet).** Add Bing Universal Event Tracking tag to `Analytics.tsx` behind `NEXT_PUBLIC_BING_UET_ID`. Same pattern as GA4 block. Fire equivalent events from `trackPhoneCall` / `trackFormSubmit`. Import UET events into Bing Ads as conversions.
- **C5 — Enhanced Conversions for Google Ads.** Hashed email/phone sent from form submit to improve attribution accuracy. Requires consent framework decision in Track F before it can ship cleanly in EU/CA traffic (low volume for Got Moles but the code pattern is the same).

**Output:** `reports/tag-stack.md` — per-tag install status, test protocol (Meta Pixel Helper, Tag Assistant, UET Tag Helper), event de-duplication verified.

### Track D — Historical data recovery (DOWNGRADED 2026-04-23)

**Status:** Low priority. Evidence from agency recon (see `reports/2026-04-23_agency-recon-and-strategy-pivot.md`) shows 5 ad creatives in 3 years, 1 active paid keyword, minimal optimisation equity. There is little worth recovering. Spencer sends the handover request as a formality + contract termination mechanism, not because we need the account.

- **D1 — Account handoff push (Spencer).** Confirmed list Spencer needs to chase previous agency for:
  - Google Ads account (matured Quality Scores, negative keyword list, 2+ years of history)
  - Microsoft (Bing) Ads account (34% of paid mix)
  - GA4 property (old-site traffic baseline)
  - Google Search Console property (old keyword data)
- **D2 — Deadline for handoff attempt.** If not resolved within 7 days post-DNS, we write off and cold-start. Attempting to recover accounts 6+ months later gets progressively harder — inactive accounts get reclaimed, agency stops responding.
- **D3 — Cold-start baseline capture.** In parallel (doesn't wait for D2):
  - Rankings sheet from `google-ads-campaigns/baseline-from-previous-agency.md` — already captured — becomes the organic baseline
  - `$10.28 CPL blended` from baseline — becomes the paid baseline
  - No traffic-volume baseline unless handoff succeeds — accept this gap
- **D4 — Data retention decision.** If handoff succeeds, decide export cadence (full historical pull → BigQuery) before access turns off post-handover.

**Output:** `reports/historical-data-status.md` — recovered / cold-start verdict per account, baseline anchors documented.

### Track E0 — Multi-location architecture (LAUNCH-BLOCKING, added 2026-04-23)

**Gap:** current `site/src/globals/SiteSettings.ts` only supports one phone + one GBP URL. Spencer has 3 GBPs (Seattle, Tacoma, Enumclaw). Without a Locations global:
- Footer + Contact page show one location only
- `LocalBusinessSchema` emits one JSON-LD entity instead of three — 2 of 3 local-SEO signals lost, material LSA ranking impact
- No per-location pages (`/locations/{city}`)

**Fix:** Add a `Locations` global (Payload) with an array of location records per GBP. Fields per location: name, address (street/city/state/zip), phone, hours, Google Place ID, GBP URL, service radius / counties, map embed URL. Wire:
- Footer → 3-column location block
- Contact page → 3 location cards with maps + directions
- `LocalBusinessSchema.tsx` → one JSON-LD per location, all linked to parent `Organization`
- Optional: per-location landing pages at `/locations/{slug}`

**Owner:** Claude (code) + Roy (seed data from Spencer's 3 GBPs — Place IDs, addresses, phones, hours)

**Gate:** Ships before DNS switch. This is launch-blocking for local SEO and LSA eligibility.

### Track E — Profile + presence hygiene

Every third-party place the old domain might be referenced needs pointing at `got-moles.com`. Also the owner-controllable profile set that affects local SEO directly.

- **E1 — GBP × 3 locations.** Within 24h of DNS switch, all three Google Business Profile locations (Seattle, Tacoma, Enumclaw per memory) get website field updated → `https://got-moles.com/`. Check NAP consistency while there. Owner: Roy or Spencer — whoever has GBP manager access.
- **E2 — GBP post-switch refresh.** One "new website, same team, same trucks" post per location with before/after yard photo. Low effort, strong signal to Google that the profile is active.
- **E3 — Facebook / Yelp / Nextdoor / BBB.** Website URL update across the set. Memory flags these as documented but not claimed — confirm claimed first, then update.
- **E4 — Angi profile.** Claim if not claimed. Yelp + Angi + Nextdoor were on the Track A4 "third-party presence" list in `seo-geo-reinforcement` — moved here because they're profile hygiene, not content presence.
- **E5 — NAP audit.** Citation consistency check across top 20 directories (Yelp, YellowPages, BBB, Angi, Chamber, Nextdoor, Foursquare, Mapquest, Superpages, Merchant Circle, CitySearch, etc.). Any mismatches get corrected. Cheap via Moz Local or BrightLocal free scan.
- **E6 — llms.txt + robots.txt sanity re-check.** Post-DNS, confirm robots.txt flipped from staging block to production allowlist (19 bots), sitemap URL is absolute production, llms.txt is reachable at `/llms.txt`.

**Output:** `reports/presence-audit.md` — one row per platform, status / last-updated / website-field-correct / notes.

### Track F — Legal / consent

- **F1 — Cookie consent decision.** GA4 + Meta Pixel + Google Ads all set non-essential cookies. Got Moles serves Washington State only — no CCPA obligations (California-resident service threshold unlikely hit), no GDPR. Low legal risk. BUT three reasons to still install:
  - Enhanced Conversions for Google Ads works cleaner with a documented consent signal
  - Trust polish — a light "Accept / Decline" banner reads as professional, not intrusive
  - Future-proof — WA state privacy law (My Health My Data Act + WAPA discussion) could expand
- **F2 — If installing: tool choice.** Shortlist: Cookiebot (paid, most trusted), Osano (free tier up to 5k uniques/mo, sufficient for Got Moles traffic), self-built banner (cheapest, needs maintenance). Recommend Osano free tier — maintained, GA4/Pixel/Ads preset integrations, no ongoing cost.
- **F3 — Privacy Policy update.** Update footer privacy policy to enumerate: GA4, Meta Pixel, Google Ads, Bing UET, any email service, Jobber, ScoreApp quiz. Plain language, no legal boilerplate.
- **F4 — Terms of Service review.** Light pass — check if existing ToS predates the new analytics stack.

**Output:** `reports/consent-and-legal.md` — decision log, tool chosen (if any), privacy policy revision diff.

### Track G — Other channels (plan only)

Not building. Framework for when/if.

- **G1 — Apple Search Ads.** iOS-only, Apple Maps + App Store inventory. Relevant if Got Moles builds a mobile app or sees strong iOS share in GA4. Assess at Month 3 after iOS share visible in GA4.
- **G2 — Nextdoor Ads.** Highly geo-targeted neighbourhood ads. Potentially strong fit for hyperlocal service — but Nextdoor's ad platform is thin and expensive per CPM. Assess at Month 3 based on organic Nextdoor engagement (Track E4).
- **G3 — Yelp Ads.** Yelp's paid placement on its own property. Historically poor ROI for pest control vs Google LSA. Defer unless Yelp organic impressions are high (visible in Yelp profile analytics post-claim).
- **G4 — YouTube Ads.** Mid-funnel awareness. Depends on Spencer shorts production (outside this L2). Assess at Month 3+ when video inventory exists.
- **G5 — Direct mail / postcard retargeting (LeadPops / Remail).** Pairs with Meta Pixel visitor data — postcard sent to browsers who didn't convert. Local service fit. Assess at Month 6.

**No deliverable beyond documenting the plan in this brief.**

---

## Phases

| Phase | Focus | Tracks | Gate |
|-------|-------|--------|------|
| **Phase 1 — Pre-DNS (this week)** | Install code + prep accounts that don't require live domain | C1 (Pixel), C4 (Bing UET code), B3 (event model lock), F1-F2 (consent decision + install) | Ready to flip env vars at DNS cutover |
| **Phase 2 — DNS cutover + 24h** | Everything that needs the live domain | A1 (GSC), A2 (Bing), A3 (Apple), E1 (GBP), E3-E4 (profiles), B1-B2 (GA4 install), E6 (robots sanity) | Within 24h of DNS flip |
| **Phase 3 — Week 1 post-launch** | Tag verification + baseline snapshot | C2 (Meta CAPI), B4-B6 (BigQuery, conversions, dashboard), A4+B7+D1-D3 (historical data chase + cold-start capture), E5 (NAP scan) | Pre-launch AI baseline captured, Pixel/UET fires green |
| **Phase 4 — Month 1+** | Gap-close + Spencer-dependent items | C3 (Google Ads conversions once handoff resolves), C5 (Enhanced Conversions), G1-G5 (channel plan reassessment) | Ongoing |

Phases 1 and 2 run in parallel with the DNS switch itself (week of 2026-04-27).

---

## Success Criteria

### Phase 2 (within 24h of DNS)
- GSC + Bing Webmaster properties verified, sitemaps submitted
- GA4 real-time shows traffic from production domain
- Meta Pixel fires PageView cleanly (Pixel Helper green)
- 3× GBP locations updated to `got-moles.com`
- Apple Business Connect claimed

### Phase 3 (Week 1 post-launch)
- `trackPhoneCall` and `trackFormSubmit` fire to GA4, Pixel, and (once env var set) Google Ads + Bing UET
- Meta CAPI server-side route live, events de-duplicated via `event_id`
- Pre-launch AI visibility baseline captured (15-query × 4-engine snapshot — overlaps with `seo-geo-reinforcement` A5; run once, serves both)
- NAP audit complete, any top-20-directory mismatches flagged

### Phase 4 (Month 1)
- Google Ads conversion labels replaced in code (dependent on Spencer handoff)
- Enhanced Conversions live for form submits
- Looker Studio dashboard live, refreshing daily
- Historical data verdict locked: recovered vs cold-start

---

## Dependencies

| # | Dependency | State | Owner | Blocks |
|---|-----------|-------|-------|--------|
| 1 | Ian DNS switch sign-off | Pending | Ian | All of Phase 2 |
| 2 | Spencer chase previous agency for GA4 + GSC + Ads accounts | Pending | Spencer | D1-D4 only (everything else continues without it) |
| 3 | Roy creates GA4 property | Not started | Roy | B1, B2 |
| 4 | Roy generates Meta Pixel ID | Pending | Roy | C1, C2 |
| 5 | Roy generates Bing Ads account + UET ID | Pending | Roy | C4 |
| 6 | Google Ads account + conversion actions defined | Spencer-blocked | Spencer → Roy | C3, C5 |
| 7 | Jobber API key for contact form backend | Spencer-blocked | Spencer | Not this L2, but form-submit events go nowhere until wired |
| 8 | GBP manager access for 3 locations | Confirmed (per memory) | Roy / Spencer | E1, E2 |

---

## Open Decisions

1. **Consent banner — install or skip?** Proposed: install Osano free tier pre-DNS. Cheap, future-proofs, plays well with Enhanced Conversions. Alternate: skip, accept WA-local risk. Roy decides.
2. **Historical data recovery deadline.** Proposed: 7 days post-DNS to attempt handoff before committing to cold-start. Roy confirms.
3. **BigQuery link — turn on at install or later?** Proposed: turn on at install (free, no downside, captures everything from day 1). Alternate: skip until an analysis case surfaces.
4. **Apple Business Connect priority — Phase 2 or defer?** Proposed: Phase 2 (cheap, complements GBP, ~5 min to claim). Alternate: defer to Month 1. Roy confirms.
5. **Dashboard — Looker Studio templated off ATP dashboard, or fresh build?** Proposed: clone ATP template structure once ATP stabilises, adapt for Got Moles surfaces.
6. **Call tracking — Google forwarding numbers (free) or CallRail ($45-75/mo)?** Proposed: Google forwarding by default. Revisit only if GA4 + GBP attribution shows gaps. Matches the Track B5 note in `seo-geo-reinforcement`.

---

## Supporting files

- `projects/briefs/website-rebuild-rebrand/LAUNCH-CHECKLIST.md` — DNS-day checklist. Phase 2 items here mirror its "Within 24h" section.
- `projects/briefs/seo-geo-reinforcement/brief.md` — Track B stays pointed at campaign structure + LPs; Track B6 (conversion tracking hooks) now lives in this L2's Track C.
- `projects/briefs/website-rebuild-rebrand/site/src/components/Analytics.tsx` — the component all of Track C modifies.
- `projects/briefs/google-ads-campaigns/baseline-from-previous-agency.md` — cold-start baseline numbers.
- `projects/briefs/google-ads-campaigns/brief.md` — paid search scope that uses conversion labels from Track C3.

---

## Team & ownership

| Role | Person |
|------|--------|
| Brief + scope | Roy + Claude Code |
| Track A-F execution | Claude Code (code) + Roy (account creation, env vars) |
| Spencer-dependent items (D, C3, E1) | Spencer |
| DNS switch | Ian + Roy |
| Deployment | Vercel auto-deploy from main |

---

## Notion

Push target: Got Moles Website Rebuild parent `32d3d42c-4a9c-8194-a491-f1de76439ecd`.

Notion page: `34a3d42c-4a9c-81f3-be2c-cccafcd534d9`
URL: https://www.notion.so/Brief-Measurement-Tracking-Setup-2026-04-22-34a3d42c4a9c81f3be2ccccafcd534d9
