---
project: got-moles-marketing-plan
type: meeting-prep
status: ready
created: 2026-04-17
for: Spencer meeting (same day)
covers: Ads (Meta + Google) | SEO | GEO | Analytics
---

# Spencer Meeting — Full Pre-Launch Playbook

## The Narrative for Spencer

> "Clean slate. Your current site has zero tracking, zero analytics, zero ads measurement. We're not migrating or untangling anything — we're building four things from scratch, all under your ownership:
> 1. **Ads measurement** — proper Pixel/CAPI/Tag/Enhanced Conversions. Recovers 30–72% of mobile signal that even most ad setups lose.
> 2. **SEO protection** for your 635 #1-ranked keywords — 291 redirects already audited.
> 3. **GEO** — first-mover on AI citations. Zero competitors doing this.
> 4. **Analytics** — leads, calls, rankings, ad spend in one place. Built from zero because there's nothing to inherit.
>
> You own the DNS. You'll own the new Meta space. You'll own the new Google Ads account. No agency dependency. Worst case we cancel tomorrow: delete a set of unused accounts."

### Baseline (so Spencer understands where we start)
- **Current site tracking:** none
- **Current site analytics:** none
- **Current ads tracking:** none (outsourced agency holds the current Google Ads account — we cannot access their data and won't chase it)
- **DNS:** Spencer owns it → cutover is clean
- **Blog author:** Spencer is the named author on blog content → author schema/E-E-A-T ready
- **New Meta Business Manager:** will be created under Spencer's login
- **New Google Ads Customer ID:** will be created under Spencer's login
- **Past-client CSV + Roy's prior keyword report:** the two assets we start with

---

## Access Spencer Must Grant — Complete Checklist

### Ads

| Platform | What we need | Format |
|---|---|---|
| Meta Business Manager (NEW) | Spencer's Facebook login — we create a new BM under his account | Spencer's FB login |
| Facebook Page | Page ID / URL + Admin role for Roy | got-moles FB page |
| Google Ads (NEW account) | Spencer's personal Google account email + business billing info — new Customer ID under his ownership | Spencer's Gmail + business details |
| Google Business Profile | Manager access, all 3 locations | For call-tracking attribution |
| Past-client CSV | ~3,000 clients — first name, last name, email, phone, city, zip | CSV, emailed |

**Already with Roy:** Prior keyword report (feeds into new campaign keyword plan).
**Not pursuing:** Historical data from outsourced Google Ads agency — we can ask but won't get it; don't build the plan around it.

### SEO

| What | Why | Format |
|---|---|---|
| Google Search Console (NEW) | Baseline organic traffic, queries, CTR, indexing status | Add Roy as Owner — Spencer verifies domain via DNS |
| Bing Webmaster Tools (NEW) | Secondary search engine (Perplexity uses Bing index) | Add Roy as Admin |
| Current site sitemap URL | Map every existing URL against the 291 redirects | `got-moles.com/sitemap.xml` |
| DNS action on cutover day | Spencer owns DNS — just needs to action the switch when we're ready | Spencer executes, we coordinate timing |
| SEMrush / Ahrefs (if Spencer has one) | Backlink audit, historical rank data | Read access (or confirm "none") |

### GEO

Spencer is already the named blog author — that settles the author-schema question. Still need:

| What | Why | Format |
|---|---|---|
| Spencer's expertise credentials | "15+ years personal experience", trade certs, awards — for author schema + E-E-A-T | List via email |
| Industry body memberships | Authority signals (NWCOA, NPMA, WA state licences) | List |
| Author bio paragraph | Canonical bio we embed on every blog + author page | Roy drafts, Spencer approves |

### Analytics

We're starting from zero. Nothing to inherit or preserve.

| What | Why | Format |
|---|---|---|
| GA4 property (NEW) | Create fresh under Spencer's Google login; add Roy as Admin | New `G-XXXXXXXXX` |
| Current call routing | Where do phone calls forward to today? We need to maintain the forwarding + layer call tracking on top | Verbal — current phone flow |
| Current lead inbox / routing | Where do form leads go today? Same — maintain + layer analytics | Verbal — current lead flow |
| Email for new lead routing | Spencer's preferred inbox for new-site contact form submissions (Resend handler) | Email address |

---

## Phase A — Safe To Do NOW (Before Site Launch)

**None of these touch the live site's code. All are either new accounts, read-only audits, or separate entities.**

### Ads (safe now)
- **Set up NEW Google Ads account** under Spencer's own Google login (he retains ownership)
- **Set up NEW Meta Business Manager + Pixel + Ad Account** under Spencer's login
- Upload past-client CSV → Custom Audience + 1/3/5% Lookalikes
- Create NEW Google Conversion Actions in the new account — leave inactive until cutover
- Enable Enhanced Conversions toggle in Google Ads (inert without data wiring)
- Link GA4 ↔ new Google Ads account
- Build new campaign keyword plan from Roy's prior keyword report + fresh research (no agency data expected)

### SEO (safe now)
- Claim Google Search Console + Bing Webmaster for Spencer's domain (fresh accounts under Spencer)
- Snapshot current rankings: all 635 #1 keywords + top 100 traffic pages + top 50 backlinks (via Ahrefs/SEMrush — no dependency on current-site tracking because there is none)
- Finalise the 291-redirect map against the current live sitemap
- GBP optimisation for all 3 locations — safe, decoupled from site: products/services, posts, Q&A, photos, hours, review response cadence
- Competitor backlink audit (read-only) — find link gap opportunities
- Re-check internal link audit (41/100) against new site IA to fix orphan pages

### GEO (safe now)
- **Baseline AI citation test** — run 50 mole-control queries across ChatGPT, Perplexity, Claude, Gemini; record who's cited today. Our before-state.
- Draft `llms.txt` content (goes live on new site at cutover, but we write it now)
- Author schema prep — write Spencer's authoritative bio paragraph + credentials, ready to wire into new site
- Content audit of existing 15 live blogs — flag which need expansion for AI citation depth (longer-form, question-driven, fact-dense)
- Reddit/Quora/Houzz presence audit — find threads where Got Moles should be cited. (Engagement happens after launch.)
- Local citation audit (Yelp, BBB, HomeAdvisor, Thumbtack) — consistency of NAP (Name/Address/Phone) across all 3 locations

### Analytics (safe now)
- Set up Microsoft Clarity (free, heatmaps + session recording) — config now, fires at cutover
- Create fresh GA4 property under Spencer's login; configure custom events
- Baseline current organic traffic in GSC (for rank-dip detection later) — starts from zero in Spencer's GSC since he's never claimed it
- Document current lead flow: where do phone calls and form enquiries land today? Map before we change anything.
- Stand up a simple rank-tracking dashboard (Google Sheets or Looker Studio) seeded with today's positions from Ahrefs/SEMrush

---

## Phase B — Happens AT Cutover (New Site Go-Live Day)

**Sequence matters. Do these in order on DNS switch day.**

### Pre-switch (day before)
- [ ] Final staging check: Pixel, Tag, CAPI, forms, schema, redirects all tested
- [ ] `llms.txt` deployed on staging, confirmed reachable
- [ ] 291 redirects tested on staging (every old URL → new URL, 301 status)
- [ ] XML sitemap generated + ready to submit

### Switch day
- [ ] DNS cutover
- [ ] Verify Pixel firing (Meta Events Manager, 30 min)
- [ ] Verify Google Tag firing (Tag Assistant)
- [ ] Verify CAPI server events arriving + deduping via `event_id`
- [ ] Fire test lead → confirm Meta + Google Ads conversions column populates
- [ ] Activate new Google Conversion Actions (inactive → primary)
- [ ] Submit new sitemap to Google Search Console
- [ ] Submit new sitemap to Bing Webmaster
- [ ] Request Google re-indexing for top 20 priority pages
- [ ] Verify all 291 redirects returning 301 in production (automated check)
- [ ] Verify `llms.txt` reachable at `got-moles.com/llms.txt`
- [ ] Verify schema markup live on every priority page (Rich Results Test)
- [ ] Confirm GA4 firing, Clarity recording, Search Console pulling data

### Cutover-day fallback
- Keep old conversion tracking data in Google Ads for 48h as fallback
- Keep old contact form routing live for 48h (belt and braces)

---

## Phase C — 2 Weeks Post-Launch

### Ads
- Validate CAPI dedup ≥80%, EMQ ≥7.0, Enhanced Conversions match rate ≥80%
- Install Pipeboard Meta Ads MCP + Google's official `google_ads_mcp`
- **Unblock TMCP+Quiz campaign** (was blocked on Pixel)

### SEO
- Rank monitoring — expect 10–20% dip in weeks 1–3, full recovery by week 6–8 (normal for migration)
- Fix anything GSC flags (crawl errors, indexing issues)
- Internal link fixes against new IA — push score from 41 → 80+
- Begin link-building on identified gaps
- Disavow spammy backlinks if audit flagged any

### GEO
- Re-run the 50-query AI citation baseline — measure lift
- Expand content on AI-citable topics (question-led, fact-dense, schema-backed)
- Reddit/Quora engagement on identified threads (Spencer or Roy — who answers?)
- Monitor weekly citation frequency across 4 AI engines

### Analytics
- Full lead-to-customer attribution dashboard (source → lead → booking → revenue)
- LTV by channel
- Monthly review rhythm — what's working, what to cut

---

## The SEO Ranking Risk — Address This Head-On

**Spencer will ask: "Will my rankings drop?"**

> "Short answer: yes, temporarily. Every site migration causes a 10–20% dip for 2–4 weeks. Full recovery by week 6–8. We've done three things to minimise it:
> 1. **Mapped 291 redirects** — every old URL has a new home. No dead ends.
> 2. **Preserved structure** — the new IA keeps your 635 #1-ranked pages' URLs where Google expects them, or redirects cleanly.
> 3. **Ian is signing off** on the SEO migration audit before cutover.
>
> What we won't do: cutover until that sign-off is in. This is the one blocker that delays launch."

---

## Non-Breaking Guarantee (All 4 Streams)

- **Ads**: New Pixel, new Ad Account, new Conversion Actions — all separate entities from current site.
- **SEO**: Every Phase A action is read-only or happens off-site (GBP, citations, GSC setup). Zero edits to live site code.
- **GEO**: Baseline testing is passive. Author bio + `llms.txt` deploy with new site only.
- **Analytics**: Clarity, GA4 config, dashboards all sit alongside — no overwrite of anything Spencer has today.

Old site keeps running exactly as it is today until DNS switch.

---

## Risks & Watch-Outs

1. **Don't cutover without Ian's SEO sign-off.** 635 #1 rankings at stake.
2. **Don't cutover during an active paid campaign spike.** Plan DNS for a low-ad-spend window.
3. **No "run in parallel" at cutover — there IS no old tracking.** Clean cutover, but that also means no fallback if new tracking fails on day one. Test thoroughly on staging.
4. **Don't add new Pixel to old site.** New Pixel = new site only. (Irrelevant but worth saying: there's no Pixel there now anyway.)
5. **Keep old contact form alive** until new form tested on staging + first post-cutover lead confirmed.
6. **No "WA's #1"** claims in ads, SEO copy, or schema until Spencer provides evidence.
7. **No Initiative 713 compliance** claims — ever. Client rule.
8. **GBP NAP consistency** — if Spencer has even minor inconsistencies across directories, fix NOW, not at cutover. Local SEO is hypersensitive to this.
9. **Don't let Spencer cancel the past-client CSV.** That list powers Custom Audiences AND Enhanced Conversions seed data AND lookalike targeting. It's the single most valuable asset in this whole plan.
10. **Cold-start penalty on new Google Ads account.** New Customer ID = zero conversion history. Smart Bidding needs 30–50 conv/month to train. **Expect 4–6 weeks of higher CPA** before bidding stabilises. Flag upfront — non-negotiable.
11. **No historical data from the agency.** We can ask but won't get it. Plan accordingly — keyword research starts from Roy's prior report + fresh Ahrefs/SEMrush research, not agency handovers.

---

## Questions To Get Answered At The Meeting

### Ads
1. Current monthly Google Ads spend (rough number from Spencer's memory is fine — agency won't share detail)?
2. Will Spencer upload the past-client CSV this week?
3. When does Spencer want to move the Google Ads work off the current agency? (Sequence — new account builds now; actual spend cuts over when Spencer's ready.)

### SEO
4. Is Ian on schedule for SEO sign-off? Hard blocker on cutover.
5. Any existing Ahrefs/SEMrush subscriptions we can use, or do we subscribe?
6. When does Spencer want to action the DNS switch? (We coordinate timing.)

### GEO
7. Is Spencer willing to engage on Reddit/Quora threads post-launch, or does that fall to Roy?
8. Can Spencer send his credentials + industry body memberships for author schema this week?

### Analytics
9. Where do phone calls forward to today?
10. Where do form enquiries land today?
11. Preferred inbox for new-site form leads?

### Cross-cutting
12. Target cutover date? Everything sequences back from this.
13. Who else gets dashboard visibility — Moni, Ian, Cory, Spencer's team?

---

## Suggested 45-Minute Meeting Flow

| Min | What | Outcome |
|-----|------|---------|
| 0–5 | Framing: 4 parallel streams, nothing breaks live site | Spencer understands scope |
| 5–12 | Ads: 30–72% signal loss + Phase A plan | Buy-in on Pixel/CAPI work |
| 12–20 | SEO: ranking protection + 291 redirects + dip expectation | Spencer confident, Ian sign-off confirmed |
| 20–25 | GEO: first-mover opportunity, zero competitors | Spencer sees the upside |
| 25–30 | Analytics: single pane of glass | Understands attribution plan |
| 30–40 | Access checklist handover — work through it live | Every item either granted in room or dated for follow-up |
| 40–45 | Cutover timing + next meeting | Locked date, clear owner per item |

---

## What You're NOT Committing To In This Meeting

- Ad campaign creative or launch date (`meta-ads-tmcp-quiz` brief owns that)
- Ad budget decisions (master marketing plan covers)
- Content calendar or blog cadence (`mole-content-authority` brief owns)
- Zernio integration for ads (post-boost only, not a Pixel replacement — not on table)
- Any promise that rankings won't dip (they will, temporarily, and that's normal)
