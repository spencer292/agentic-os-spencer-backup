# Digest A: Foundation & Setup (Meta Ads Arena, Dan Edmund)

Source: `skool-corpus/01-1-foundation-setup-start-here/` (26 lesson files). Lesson numbers in brackets are the file prefixes, e.g. [07] = `07-1-6-installing-the-pixel-conversions-api.md`. The transcripts are auto-captioned and garbled in places ("Cappy" = CAPI, "Hiva" = HiVA, "cells" = sells, "Andromeda" = Meta's ad-retrieval AI). Where a number looks suspect I say so.

Fit labels: **APPLIES** (use as taught), **ADAPT** (use with a stated change for a local lead-gen service business), **ECOM-ONLY** (skip).

Got Moles context assumed: lead gen, phone calls plus web form bookings, King/Pierce/Thurston counties, modest budget, no checkout. Per the Got Moles rules, Spencer approves every spend, launch and send; the agent drafts only.

---

## 1. Operating mindset and the 90-day timeline [02, 03] (APPLIES)

- Dan's framing: the course is an operating system for Meta ads. Go in order; each module references earlier ones. [02]
- **Expect to lose money in the first 30 days.** Phase 1 (days 1-30) is buying data: which hooks convert, which audiences respond, what real cost per acquisition (CPA) is. Goal is signal, not profit. Killing campaigns early or changing many variables at once is the main failure. [03]
- Phase 2 (days 31-60): iterate on the hooks and angles that showed promise; CPA should start falling. Phase 3 (days 61-90): scaling, defined as predictability ("for every dollar in, I expect X back"), not three good days. Budget is pushed systematically, not randomly. [03]
- Before launch, write down one number: the **target CPA** (or target ROAS). Every Ads Manager decision is one question: am I moving toward or away from the target? Every change needs a stated reason. [03]
- **Daily scorecard** (Dan provides a Google Sheet, "Meta Ad Arena Scorecard"). Minimum six columns: Spend, Impressions, Link Clicks, Conversions, CPA, ROAS (optional CPM). Track daily; make decisions on weekly numbers. Use the CRM/true source of truth, not just Ads Manager, because Ads Manager delays and models conversions: the 2 p.m. number differs from the 10 p.m. number. [03]
- Dan says "I'd rather you not quit": most accounts that work are ones that got through 30-90 days of testing. One caveat he gives himself: results depend on the offer being something the market wants. [03]

**Got Moles use:** Target number = max cost per booked job (see section 8), not ROAS. Expect a loss-making first 30 days; the agent should tell Spencer this up front and not recommend pausing on days 1-30 on cost alone.

---

## 2. Business Manager setup (account foundation) [04] (APPLIES)

Dan's rule: nothing is built before this is done. Running ads from a personal ad account is "a huge liability" because a personal-profile restriction locks you out of everything. Warning that Meta's UI changes often, so labels may differ.

Click paths and settings (checklist PDF embedded in [04] plus the video):

1. **Create the portfolio:** go to business.facebook.com > create a business portfolio (business name, your name, business email) > Create.
2. **Ad account:** Business Settings > Accounts > Ad accounts > Add. Three options: create new, add existing, request access (for someone else's account). **Time zone and currency are chosen here and cannot be changed later without Meta creating a brand-new ad account and losing history.** Pick the account's primary market (Pacific for Got Moles) and USD the first time.
3. **Two-factor authentication:** Business Settings > Security Center > Two-Factor Authentication > set to **"Everyone."** This forces anyone added later to enable 2FA. Dan: hacked business managers can spend $100,000 in a day; he estimates 2FA cuts hack risk about 90%.
4. **Domain verification:** Business Settings > Brand Safety > Domains > Create/Add domain (the button says "create" but you are assigning a domain you own) > enter domain > choose **DNS TXT record** method (most reliable, no website changes) > copy the TXT record into the DNS host (GoDaddy, Namecheap, Cloudflare) > return and click Verify. Propagation is usually minutes; Dan has not seen it exceed 2 hours; officially up to 24-48 hours. Retry in a few minutes, then a few hours, then 24-48 hours. Not strictly required but protects the domain from use by others and keeps attribution clean.
5. **Admins:** at least **two** full admins (Dan elsewhere says two, preferably three) so a restricted personal profile does not lock everyone out. Backup admin can be a spouse or trusted team member. [04, 16]
6. **Adding people:** Business Settings > People > invite by email and assign assets (including a Page). Alternative: add from inside the ad account. **Agencies/freelancers (Roy):** use **Partners** and share specific assets by their Business Manager ID; never give outside contractors admin. [04]
7. **Asset assignment:** assign yourself/team to the Ad Account, the Facebook Page, the Instagram account, and the Pixel/Dataset. [04]
8. **Ad account spending limit:** Billing & Payments > set a monthly account spending limit as a runaway-spend guard. A limit is a hard cap; when hit, all campaigns pause automatically (a common reason ads "randomly" stop). [04, 10]

Got Moles notes: verify `got-moles.com`; Spencer's DNS is possibly in Cloudflare (a TXT record is a DNS change that Roy may control; flag for Spencer). Roy at All The Power should be added via Partners, not as admin, if he touches the site pixel.

---

## 3. Billing and payment [10, 04, 16] (APPLIES)

Dan: "nine times out of ten" new advertisers lose accounts to billing, not policy.

- **Mechanism:** new accounts start with a low daily spend limit (about $50/day on average, varies) and a low billing threshold (about $25-50; charge fires each time that much is spent). At $200/day and a $25-50 threshold, the card is charged several times a day (he says 8x). Banks read identical repeated charges as fraud, decline the card, Meta's retry fails, campaigns pause and the account gets restricted.
- **Payment method rules:** dedicated **business credit card** as primary. Not debit (daily transaction limits), **not prepaid**, not PayPal, not virtual cards if avoidable. High spenders may be forced to invoicing. [10, 04, 16]
- **Always add a backup card.** Meta tries primary, then backup; if both fail, campaigns pause, account health drops, restriction often follows. [10]
- If a virtual card is used, the **billing address and zip must exactly match** the address on the Business Manager; one wrong digit triggers an automatic payment-risk restriction when budget is scaled. [16]
- **Call the card issuer before launch** and say you will make frequent Meta charges. Dan: this single call prevents about 90% of billing problems. [10]
- Thresholds and daily limits rise automatically with successful charges; he raises them every couple of weeks until the threshold is $500+ (fewer charges, fewer declines). [10]
- Initial billing threshold advice in the checklist: set low (25-50) to "build billing trust." [04]

---

## 4. Account hierarchy and naming [05, 06] (APPLIES)

- **Hierarchy:** Campaign (objective) > Ad set (who and where: location, age, custom audiences, placements, budget type) > Ad (creative and copy). Each level inherits from above. Diagnosis map: high cost per click or creative problems live at the ad level; audience fatigue at ad set level. [05]
- **Objective:** choose **Leads** or **Sales** in ~99% of accounts. Do not use Traffic (finds clickers) or Engagement. [05]
- **Naming (your own convention; only you see it):** [05/06 description versions differ slightly, use one consistently]
  - Campaign: `[Objective] — [Campaign Type/Audience] — [Date]`. Example: `SALES — Prospecting — Jul 2026`; slide examples: `Leads | Retargeting | Aug 1`.
  - Ad set: `[Audience Type] — [Description] — [Placement]` and/or budget type (CBO/ABO). Example: `BROAD — US 25-54 — All Placements`; slide: `US Broad 18-65 | Feed & Reels Only | ABO`.
  - Ad: `[Creative Type] — [Hook/Concept] — [Version/Identifier]`. Example: `VID — Dog on Couch Hook — v1`; slide: `Video | "3 Reasons Why" Hook | V1_Blue_Background`.
  - Always include a date at campaign level. Never name things "test 1" or "video ad". Reason: pulling a 60-day report and filtering by format or audience must work. [06]

**Got Moles adaptation:** objective token `LEADS`; audience token should carry the geography (`KING-PIERCE-THURSTON` or a county/city cluster, e.g. `BROAD — Puget Sound 25+ — All Placements`); ad token should carry the hook plus the proof type (e.g., `VID — Lawn Damage Hook — v1`).

---

## 5. Tracking: Pixel, CAPI, test events, UTMs, custom conversions [07, 08, 09, 04] (APPLIES, with ADAPT noted)

### 5a. Pixel (Dataset) and Conversions API
- Meta Pixel = browser JavaScript; CAPI = server-side backup that ad blockers and iOS restrictions cannot block. **Run both on every site.** Meta deduplicates the two (the shared `event_id` must be passed). [07, 04]
- **Create:** business.facebook.com > Events Manager > Connect Data Sources (green plus) > **Web** > name it with the business name > enter the site URL > Create. Save the Pixel ID. "Pixel" is now called a **Dataset** in some UI. [07]
- **Install on site:** Shopify (Online Store > Preferences, paste ID); WordPress/WooCommerce (plugins "Pixel Your Site" or "Meta Pixel for WordPress"); **Google Tag Manager** (custom HTML base-code tag, trigger All Pages, then separate tags for each conversion event); or send the code to a developer ("Send instructions to a developer"). [07]
- **CAPI:** Events Manager > pixel > Settings > Conversions API, or the **Integrations** tab for partner setups (Shopify "Set up through partner"). Non-supported platforms: Meta's **Gateway** (no-code) or a developer. Confirm server events appear in Events Manager next to pixel events. [07]
- **Verify:** Events Manager > pixel > **Test Events** tab > enter site URL > Open Website > walk the whole flow and watch events appear in real time. Chrome extension **Meta Pixel Helper** also highlights firing events. [07]
- **Event Match Quality: target 7 or higher; if below 6, pass email, phone and name parameters** with events; confirm dedup is active. [07]
- Standard events table: PageView/ViewContent (page view), AddToCart, InitiateCheckout, Purchase (confirmation page), **Lead** (form submission), CompleteRegistration (signup). Lead gen needs PageView, ViewContent, and Lead/CompleteRegistration. [04, 07]
- Dan: if the pixel only sees 1 of 10 real conversions, Meta reads that as a broken page or unwanted product, and costs rise. "Treat your pixel like your baby." [09]

**Got Moles adaptation:** the site is Next.js on Vercel, deployed by Roy, not this install. Pixel/CAPI install on the site is a Roy task; the agent briefs Roy and verifies via Test Events. The key conversions are a **form submission (Lead)** and a **phone call**. Course gives no call-tracking method; see Open Questions.

### 5b. UTM parameters [08]
- UTMs are mandatory. Add to every ad: **Ads Manager > Ad level > scroll to "URL parameters" field** under the destination URL. Use **dynamic** parameters so Meta fills them (source, campaign name, ad name, placement) rather than hard-coding "facebook". Minimum set: utm_source, utm_campaign, utm_content (ad name), utm_term/placement. The advanced set adds ad set and event strings. Read results in **Google Analytics > Reports > Traffic Acquisition**. Dan names Hyros as a paid third-party attribution tool. [08]
- Dan said he would paste the exact UTM string below the video; **it is not in the text.** Standard Meta dynamic string (not from the course): `utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&utm_id={{campaign.id}}`. Placement macro: `{{placement}}`.
- Dan states: "you cannot depend on what Ads Manager tells you at all." Use UTMs/GA and the CRM as the check. [08, 10]

### 5c. Custom conversions [09]
- Standard events cover most; use a **URL-based custom conversion** when funnels do not map (multi-step quiz, webinar sign-up, thank-you page more reliable than standard Lead). Rule of thumb: if unsure, use the URL-based rule.
- **Create:** Events Manager > **Custom Conversions** > Create > name (e.g., "Lead from quiz funnel") > select Dataset > Action source: Website > Rule: URL contains the thank-you URL (e.g., `/thank-you`) > optionally set a **conversion value** (e.g., $100 per lead) > Create. Test by visiting the thank-you URL and refreshing; the event shows in the custom conversion's panel.
- **Use:** Ad set > Edit > Conversion section > select the Dataset > pick the custom conversion in the "Conversion event" dropdown. [09]
- Dan's logic: the optimization event is the instruction to the algorithm (Andromeda). Wrong event = money spent chasing the wrong people. [09]

**Got Moles use:** a `/thank-you` page after the booking/contact form is the simplest reliable lead signal if the form has a distinct confirmation URL. Confirm with Roy that one exists.

---

## 6. Numbers and economics [11] (ADAPT)

- **ROAS** = revenue / ad spend. **Break-even ROAS = 1 / gross margin.** Target ROAS = 1.5x to 2x break-even. Example: $100 price, $60 margin: break-even 1.67. Supplement example: $60 price, $20 fulfillment, margin 66.7%: break-even 1.5.
- **CPA** = ad spend / number of acquisitions. **Target (max) CPA = gross margin per unit x target profit margin.** Example: $40 margin x 50% = $20 max CPA.
- **LTV**: total revenue per customer over the relationship. Example: $240 LTV with 40% target profit margin allows $96 max CPA, even if the first sale loses money. LTV decides how aggressive spending can be; subscription/repeat businesses outspend one-off competitors.
- Meta-reported CPA is "almost always understated" (attribution gaps); treat Ads Manager as directional only.
- Break-even calculator Google Sheet has tabs for e-commerce, high ticket, coaching and service, and lead generation (link in lesson).

**Got Moles adaptation (math only, agent must source the inputs):** first-visit revenue is a priced program (residential Quick Fix $450-$600; Total Mole Control $100-$150/month). LTV for TMCP customers is a multi-month stream, which supports a CPA ceiling above the first-job margin. Max CPA must be computed per **booked job**, including the lead-to-booked rate; coordinate with `acc-cfo`. Tag every figure KNOWN/ESTIMATE/UNKNOWN per the `mkt-cmo` rule.

---

## 7. Metrics and Ads Manager columns [12] (ADAPT: use the lead-gen half)

Dan: default Ads Manager columns "tell you nothing"; build custom ones and **save as a preset**. Click path: Ads Manager > Columns dropdown > **Customize columns** > remove ~80% of defaults, drag into funnel order > **Create custom metric** (formula builder: pick metric, divide, pick metric, set format to percentage, name, Create) > Apply > **Save** the preset (name it e.g. "LeadGen Master") and use it as default.

### Lead-gen preset (use this)
Order: Amount spent first, then Leads, Cost per lead, (Applications submitted + cost, if a multi-step form), Landing page views + cost per landing page view, Unique outbound CTR + cost per unique outbound click.
Custom metrics:
- **Click to Lead CVR** = Leads / Unique outbound clicks (percentage). If low, the ad got them there and the landing page copy is losing them.
- **Lead to Application CVR** = Applications submitted / Leads (only if applicable).
Diagnostic add-ons to end of both presets: **CPM**, **Frequency**, **Unique outbound CTR** vs all-CTR.

### Interpretation rules (numbers and thresholds)
- **Landing page views vs link clicks:** 200 link clicks but 80 landing page views means the site is slow or broken; roughly 60% lost before the page loads. A website problem, not a Meta problem.
- **CPM:** brand-new accounts commonly have very high CPMs (he says even $100 CPM is normal at first). Competitive niches run $50-$100. Learn your own baseline to spot anomalies.
- **Frequency:** no hard kill rule. He rejects "kill at 3." At 3-4 results sometimes drop, but he has seen frequency 8 with stable performance. Refresh ads only when frequency is above 3 **and** performance falls.
- **CTR (all) vs Unique outbound CTR:** all-CTR includes likes, comments, shares; outbound is real link clicks. High CTR(all) with low outbound = entertaining but not selling (copy/offer problem).
- Check these three (CPM, frequency, CTR) before panicking about a rising CPA.
- **Native Meta lead forms ("instant forms")** "typically don't bring in the highest quality"; he generally recommends not leaning on them for service/high-ticket. [12, 13]
- **Most important lead-gen metric lives outside Ads Manager: lead-to-close rate.** A $2 CPL closing at 1% is far worse than a $20 CPL closing at 15%. Connect CRM data to ad spend. [12]
- Ecommerce preset (purchase ROAS, click-to-purchase CVR, add-to-cart CVR, checkout metrics) is **ECOM-ONLY**; skip. Underlying idea to keep: pinpoint the leak in the click-to-conversion path.

**Got Moles use:** "Leads" in Ads Manager is not the goal; booked jobs from Jobber are. The agent should join Ads Manager spend to CallRail/Jobber outcomes weekly.

---

## 8. How Meta's auction and delivery work [13] (APPLIES)

Five-step loop for each impression: (1) eligibility (active, approved, funded, within targeting/exclusions/placements, budget left, no restrictive bid control); (2) retrieval (Andromeda narrows eligible ads to a candidate set from creative and conversion signals); (3) ranking on three families: willingness to pay (budget and bid strategy), predicted desired action, and quality of ad experience (relevance, credibility, destination matches promise); (4) delivery; (5) the result becomes feedback. Meta does not hand the placement to the highest bidder.

Key operating rules:
- **Budget floor for learning:** budget should be a minimum of **2x, possibly 3x your CPA** to know if anything is working. For a controlled creative test, give each concept 2-3x CPA. High-ticket example: $300 per booked call on a $300/day budget means long learning; optimize for a step earlier (e.g., "submit application") first, move to the deeper event (book a call) once Meta has enough data.
- **Optimization event = the instruction.** Optimizing for a basic form lead returns people who fill forms ($5-$8 leads who never answer the phone). Closer the event is to the real outcome, the better, as long as enough volume exists. Adding qualification questions to the form raises CPL and lead quality. New e-com stores sometimes start at add-to-cart for faster signal (ECOM-ONLY).
- **Uneven spend is normal in always-on (CBO) campaigns.** One ad getting $70, another $25, another $5 is the system optimizing. For a fair creative test use the ABO controlled-test structure (covered in a later course): separate concepts, forced budget, other variables stable.
- **Bid caps / cost controls** restrict opportunities; campaigns with them are "very hard to scale." Highest-volume bidding gives the most freedom.
- **Diagnose five inputs before touching settings:** (1) offer and economics, (2) optimization event and feedback, (3) creative and message clarity (under Andromeda, creative carries the targeting signal; long interest stacks no longer create relevance), (4) conversion path (ad and landing page are one promise), (5) delivery guardrails (location, exclusions, budget, placements; add only for a documented business reason, because each constraint reduces opportunity).
- **Andromeda reality check:** it does not mean 30 random ads on $50, does not mean broad targeting works for everyone, and does not let you ignore service area or exclusions. Build very distinct concepts around real buyer tension; changing a word or background does not create a new idea.
- Early data is noise: one sale or two expensive days proves nothing.
- **Five-line delivery input check (action step):** write down (1) the optimization event, (2) the real business outcome it represents, (3) the downstream data that validates it, (4) the core promise in the creative and whether it matches ad-to-page-to-outcome, (5) every delivery constraint and its business reason. If you cannot explain one, do not change settings. [13]

**Got Moles use:** service-area geography is a legitimate guardrail (documented reason). Everything else should be left broad. Expect budget minimum = 2-3x CPA per test cell, which constrains how many concepts a modest budget can test.

---

## 9. Change control [14] (APPLIES, high value for the agent)

- Rule: **one meaningful change at a time**, logged, with a fair review window. Do not judge off 24 hours. Do not run a campaign rebuild while also changing the landing page, price, or sales process.
- About 50% of performance swings originate outside the ad account. Four things to investigate when performance moves: ad account (budget, bidding, edits), message/creative/hook, conversion path (landing page, speed, form, mobile), business operations (lead response time, follow-up, staffing, price, guarantee).
- **What to log:** any edit/pause/new ad, budget change, landing-page change, price, shipping, checkout, email automation, lead response time, key sales staff absence, tracking change. Skip typos.
- **Change log columns** (Google Sheet "Change Control Log"): date and time; exact change (specific, e.g., "moved shipping info above add-to-cart" not "updated landing page"); where (ad account / creative / conversion path / business ops); why (evidence); expected result; what stays fixed; go-live time and review date; primary metric and guardrail metric; observed result and next decision (keep / reverse / iterate / retire / inconclusive).
- Three reasons for changes: repair (confirmed problem), controlled test, reaction (bad day; discouraged). Urgent break: fix first, document right after.
- Cadence: daily = log changes and check for delivery/tracking/checkout problems; weekly = review the timeline against full-path outcomes. Lead gen: qualified leads, booked calls, show rate, close rate, cash collected, response time.
- Lead-gen example: removing the qualifier question to cut CPL leads to unqualified leads; log it, put the question back, judge on qualified-lead rate.

**Got Moles use:** the log should include website changes by Roy, phone-answering changes, pricing/offer changes, and crew capacity. Keep it in `projects/briefs/meta-ads/`.

---

## 10. Account survival: HiVA score, safety, policy [16 Vault 1] (APPLIES: read in full)

### 10a. The hidden trust score
- Meta has an internal advertiser trust score called **HiVA (High Value Advertiser)**. Never visible to advertisers. Four unofficial tiers: **Bronze** (new/restricted accounts: slow reviews, tight budget caps, borderline ads flagged instantly, high CPMs), **Silver** (most active advertisers, neutral), **Gold** (faster approvals, better delivery, sometimes a dedicated rep), **Platinum** (rare, huge spend; can run ads that would get a Bronze account banned). Higher tier lowers costs. Dan says you move from Silver to Gold over about 12 months; there is no overnight route.
- **How to check (unofficial; the claim is Dan's, not confirmed by Meta):** (a) in Ads Manager, right-click > View page source > Ctrl+F > search `ads_trust` (does not appear on every account); (b) Chrome extension "AdsTrust": install, open Ads Manager, click the extension icon in the top right.
- **Five levers to raise it:**
  1. Consistent spend over time ($10,000/month for 12 months beats $100,000 in one month then silence).
  2. Policy compliance: every disapproved ad or unappealed rejection is a strike.
  3. User feedback: hides, reports, and scrolling past hurt; creative quality is an account-health issue.
  4. Pixel and CAPI health: properly installed and active signals a real business.
  5. **Personal profile health:** a history of community-standards violations, bans, or a fake-looking profile carries over to the Business Manager. Dan says Meta reps confirmed a client's ad account was banned over the owner's personal posts. Keep controversial content off the profile used to run ads.

### 10b. Asset protection rules
- Never run ads from a personal ad account. Use Business Manager.
- **2 to 3 admins** (Dan's own 15-year profile was hacked and unrecoverable; other admins re-added him).
- Payment hygiene: physical business card, no prepaid, exact address/zip match (see section 3).
- **2FA bug:** Meta may restrict an account for "no 2FA" even when 2FA is on, creating a loop. Fix on the **mobile app via Meta Accounts Center** (Privacy/security area): turn 2FA off and back on using an **authenticator app** (e.g., Google Authenticator), **not SMS** (SMS is less secure and more prone to the sync glitch). Also keep Business Settings > Security Center > 2FA required for "Everyone."

### 10c. Policy landmines (AI scans copy, images, landing page, no human)
1. **Personal attributes:** do not imply you know something about the viewer (e.g., "Are you a tired mom struggling to lose weight?" implies gender, parental status, medical situation). Avoid the word **"you"** where it implies a personal trait; talk about who the product is for ("designed for busy moms").
2. **Misleading/claims:** no guaranteed results or miracle outcomes. Swaps: "guaranteed" to "designed to help," "proven" to "built for." Meta defines a **claim as any statement that the product does X, true or not.** Dan suggests running copy through an AI compliance check.
3. **Landing page:** no broken links or redirects; privacy policy and terms of service in the footer; all links on the page compliant; headline matches the ad promise (e.g., ad says 50% off, page says 50% off).
4. **Circumventing systems** (most serious, nearly impossible to appeal): obfuscating banned words with symbols (F.R.E.E.), launching a new ad right after a ban, redirecting checkout. Do not try to outsmart the system.
- Delayed-fuse risk: ads with the same violating copy can run for a year, then one flag cascades into 30 restrictions in 24 hours. Follow policy from day one.
- **Hardware fingerprint contamination ("chain ban"):** Meta logs device fingerprints (canvas, WebRTC, hardware concurrency), not only IP. A VPN does not help. Logging into another account from the same laptop after a ban can trigger a chain ban. Relevant to agencies and banned-account recovery (anti-detect browser plus static residential proxies, one container per account). Dan says it applies to ~0.01% of advertisers; not expected to matter here.

### 10d. Vault 1 self-audit (his action step)
Second admin on the Business Manager? Physical business card as payment? Landing page has a privacy policy? Pixel firing? 2FA on an authenticator app, not SMS? Check HiVA tier. Aim for steady, clean campaigns and consistent spend.

**Got Moles use (ties to existing rules):** Got Moles' existing Posture-A, claims gate and guarantee rules map directly onto the claims and personal-attribute landmines. Mole-related ad copy must avoid kill/lethal and body-gripping wording (already mandatory in Google Ads) and avoid health-implication language ("skin mole" homograph; also "are you worried about..." second-person framing). Avoid "guaranteed" unless the claims gate approves the specific "no-catch guarantee" phrasing. The agent must run every draft through `mkt-cmo/references/claims-gate.md`.

---

## 11. Appeals protocol and account recovery [17 Vault 2] (APPLIES: full procedure)

Dan's premise: suspensions are probable the more you spend; about 90% of rejections are false positives from Meta's AI; most advertisers lose accounts because they handle it wrong (one bot-reviewed appeal, then give up). No guarantee; these are things he did personally.

### Level 1: single disapproved ad
1. **Never delete a disapproved ad** and launch a replacement. Every disapproval is a strike on the hidden quality score; deleting leaves the strike on the permanent record and unappealed rejection counts as accepted. Do not rely on the Account Quality tab to show everything.
2. In Ads Manager, **filter by errors/issues** and select the disapproved ad. Re-read the ad, headline, video content, and the full landing page (including footer links) for claims (even true ones).
3. **If clearly compliant (false positive):** use the human-support route below, not the "Request review" button, which often returns to the same AI bot and loops.
4. **If it actually violates policy:** fix the offending words (sometimes only 4 words), edit the ad and hit Publish; that resubmits it. **Submit exactly once.** If it fails again, stop and let it die; build a **new ad from scratch**. Repeated resubmission of a flagged ad reads as circumvention and can shut the account down and tank HiVA.
5. **Human support script** (use via Meta chat support; polite, play-dumb, ask for help, never angry or threatening):
   > "Hi, I need some help. I have an ad that was disapproved for [policy name], but I've reviewed the policy and I believe this was flagged in error by the automated system. Can you please help me submit this for a manual review?"
   Frames it as a false positive, acknowledges the policy, asks the rep to be a hero by manually pushing it past the bot.
   (`AI Prompt Library` #14 "Policy Appeal Writer" drafts this: give it the policy name and ad copy.) [26]

### Meta Verified
- Paid subscription (Dan: about $15/month, "don't quote me"). Gives a blue check and access to a live-chat support tier. Useful for minor issues (billing glitch, basic disapproval). **Not a magic bullet:** for severe cases (circumventing systems) reps are tier one, read scripts, "escalate to a specialized team" and often nothing follows. They can open tickets faster but do not make decisions. Dan recommends it anyway (blue check lifted ad trust in his tests).

### Level 2: ad account disabled, personal profile still works
- Use the chat support route above repeatedly (see golden rule). Study ads and landing page for hidden claims. Do not use a VPN.

### Level 3: personal profile also suspended (cannot log in)
1. You cannot do this yourself. Have a **friend, family member or colleague** open chat from their own account at **facebook.com/business-startup-support-home** (as given in the transcript; verify the URL before use).
2. They send this template (fill in brackets):
   > "Hi, my name is [name]. I'm reaching out on behalf of a colleague whose Facebook profile has been fully suspended. Because of the suspension, they have no way to contact support themselves. Our business has invested [amount] in Meta advertising over the last [period]. My colleague manages our account and was suspended without any policy violation that we can identify. Their email address is [email]. We need this resolved as a priority; it directly impacts our ability to run our business. Please connect us with a human support specialist who can review this case directly."
   Why it works: establishes spend history (leverage), frames suspension as an error, asks for a human specialist.
3. **Attach a selfie holding a piece of paper with the account email address written on it** (proves a real person is tied to the profile).
4. Admins who still have access can pause ads or add a new profile as admin while recovery proceeds.

### Golden rule
Expect **2-3 separate conversations**; reinstatement after a single chat essentially never happens. **Open a new chat every day.** Be polite, persistent, professional, relentless; playing dumb helps; anger or threats get the case closed. Reinstatements have taken 2 days to 2 months; accounts that never return are usually ones the owner gave up on. Never use a VPN or any trick to bypass the ban (circumvention is the most serious flag).

### Last resorts (after weeks of failure)
- **Reputation-management firm / high-level agency** with internal Meta contacts. Dan labels it **gray hat**, not supported by Facebook, typically **about $2,000-$3,000**, worthwhile only for large revenue accounts. He names no vendors.
- **Start fresh:** only as the absolute last resort. A new Business Manager on the same computer, same card, or tied to the banned personal profile is detected and banned for circumvention. A clean start needs a new Facebook account with a new email, a different device, a different payment method, a different admin profile, and a new landing page. Dan says it takes about a day of work.

### Prevention (from Vault 2)
Keep the personal profile clean; keep several admins ("backups to backups"); build account health before anything goes wrong because suspensions tend to hit when a campaign has momentum.

---

## 12. Offer and buyer psychology (Module 2) [18-25]

Fit overall: **ADAPT**. The material is generic direct response with ecommerce and fitness examples. The principles apply to local services; the examples do not.

- **Ads are amplifiers:** about 8 in 10 failing accounts fail on the offer, not the ad. Three things must align: audience (and their state of mind), offer (price, guarantee, bonuses, urgency), messaging. Do not touch Ads Manager before the offer is solid. [18]
- **Offer equation: Motivation = (Value − Friction) × Trust.** Value stacking: core product plus high-margin bonuses solving the next problem. Friction types: financial risk (guarantee), time delay (speed, "results in 14 days"), effort (steps; simplify). Trust via social proof (reviews, testimonials), authority proof (certifications, press), demonstration proof (show it working). **Urgency** = time limit; **scarcity** = quantity limit; both must be **genuine** (fake timers destroy trust). Lesson 2.3 on guarantees/urgency/scarcity is empty. Offer Builder Worksheet PDF unreadable. [19]
- **Customer awareness ladder (Eugene Schwartz):** Unaware, Problem aware, Solution aware, Product aware, Most aware. **You cannot skip steps; match the message to the stage.** Unaware: story/secret/shocking, no product mention. Problem aware: agitate with the customer's own words, introduce the solution category. Solution aware: old way vs. new way, your mechanism. Product aware: social proof, guarantees, demonstrations. Most aware: direct offer, stacked value, deadline. If you only run "20% off today" ads, you leave most of the market unaddressed. Homework: label each current ad with its stage. [21]
- **Market sophistication (5 levels):** L1 simple direct promise; L2 stronger/specific promise (specific, true, not just bigger); L3 real mechanism; L4 demonstrate the mechanism with proof; L5 new entry point (identity, point of view, contrarian). Distinct from awareness. A bad result is not automatically a sophistication problem (check offer, hook, landing page first). **Sophistication audit:** review 10 competitor ads in the Facebook Ads Library; make a 5-column doc (core promise; bigger/specific version; mechanism/reason why; proof format; identity/new angle); mine customer language for lines starting "I tried," "I was tired of," "I didn't realize"; decide what the market has not heard. Creative pipeline needs message variety, not just new colors/thumbnails. [22]
- **Customer avatar (empathy map), psychographics over demographics:** four quadrants: pain and frustration (what wakes them at 3 a.m., what failed before), desired outcome (emotional, not functional), objections (every reason they say no), status shift (how others see them after). Source answers from reviews and customer calls, not guesses. Template PDF unreadable. [24]
- **Voice-of-customer research:** read 1-3-star reviews of competitors (Trustpilot, Amazon), Reddit threads, and Facebook groups; use your own reviews/support tickets. Customers write your hooks. AI workflow: paste 20-50 negative reviews into an LLM and ask for the 3 top frustrations, 10 verbatim phrases, the unmet expectation, and 5 hooks; then feed that research into a copy prompt (3 variations: story, direct/punchy, contrarian; headline under 40 characters). Never ask AI to "write a Facebook ad" with no research. Read output aloud; rewrite robotic hooks. [23, 26]
- **AI Prompt Library (15 prompts)** in [26]: Review Miner, Competitor Gap Finder, Empathy Map Generator, 30 Hook Generator (10 pain, 10 desire, 10 pattern-interrupt), Creative Brief Builder, Format Translator, Awareness Stage Adapter, Framework Applier (PAS), Objection Destroyer, Headline Tester (15 under 40 characters), Click Audit Diagnostician, Ad Account Summarizer, Copy Teardown, Policy Appeal Writer, Offer Equation Optimizer.
- Course 1 recap [25]: next course is Creative Strategy and Production.

**Got Moles adaptation:** the local-service stage mapping is mostly Problem aware (they have seen mounds/ruined lawn) and Solution aware (they are weighing traps vs. poison vs. a pro); few are Unaware, many search Google for "moles in my yard" so Meta is a demand-creation channel. Voice-of-customer sources: Got Moles' own 283+ five-star Google reviews, call transcripts (CallRail), and competitors' 1-3 star reviews. Offer levers already in house: no-catch guarantee, chemical-free/pet-safe, setup fee, program tiers. Use the claims gate for all guarantee language.

---

## 13. Lessons that are ECOM-ONLY or low-value here

- Shopify pixel steps, purchase/checkout/add-to-cart columns and custom metrics, click-to-purchase CVR, ROAS-led targets, "new e-com stores optimize for add-to-cart" [07, 12, 13]: skip.
- Hardware fingerprint / anti-detect browser section [16]: only if a banned account must be replaced.
- [02] community navigation and [01] symbol legend: no operating content.

---

## Setup checklist for Got Moles

Pre-launch (all require Spencer's go-ahead before any spend):

1. **Economics first.** Compute with `acc-cfo`: gross margin per first job, TMCP monthly value and expected retention (LTV), lead-to-booked-job rate, and a **max cost per booked job**. Write that single target number where the agent sees it daily. Tag each input KNOWN/ESTIMATE/UNKNOWN. [03, 11]
2. **Business Manager.** Confirm a Business Manager exists and nothing runs from a personal ad account. If creating: business.facebook.com > create portfolio. [04]
3. **Ad account.** Business Settings > Accounts > Ad accounts. Confirm **Pacific time zone and USD** (permanent). [04]
4. **Security.** Business Settings > Security Center > Two-Factor Authentication = **Everyone**. Move each admin's 2FA to an **authenticator app, not SMS** (Accounts Center on mobile). [04, 16]
5. **Admins.** At least **two** full admins (a trusted second person, not Roy). Add Roy/All The Power via **Partners** with specific assets only. [04, 16]
6. **Assets assigned.** Ad account, Facebook Page, Instagram account, Pixel/Dataset assigned to the right people. [04]
7. **Domain.** Brand Safety > Domains > add `got-moles.com` > verify with **DNS TXT** (find who controls DNS first; flag to Spencer/Roy). [04]
8. **Billing.** Billing & Payments: **physical business credit card** primary (no debit/prepaid/PayPal), a **backup card**, an **account spending limit** matching the approved monthly budget, address and zip matching the Business Manager exactly. **Call the card issuer** to warn of repeated Meta charges. [04, 10, 16]
9. **Pixel/Dataset.** Events Manager > Connect Data Sources > Web > create with business name and URL; hand Pixel ID to Roy for install on all pages. [07]
10. **CAPI.** Request server-side CAPI (Gateway or developer) from Roy; confirm dedup via `event_id`. [07]
11. **Events.** Define the Lead event (form) and decide how phone calls are signaled (see Open Questions). Verify in **Test Events** by walking the real form flow; use Meta Pixel Helper. **Event Match Quality at least 7**; pass email, phone, name. [07]
12. **Custom conversion.** If the form lands on a unique thank-you URL: Events Manager > Custom Conversions > URL contains that path; optionally set value = estimated lead value. [09]
13. **UTMs.** In every ad: URL parameters field with dynamic source/campaign/ad/placement. Confirm GA4 receives them (Traffic Acquisition). [08]
14. **Naming convention.** Adopt: Campaign `LEADS — [Audience/Geo] — [Mon YYYY]`; Ad set `[Audience] — [Geo] — [Placements] — CBO/ABO`; Ad `[VID/IMG] — [Hook] — vN`. [05, 06]
15. **Ads Manager columns.** Build and save a **LeadGen Master** preset: Amount spent, Leads, Cost per lead, Landing page views + cost, Unique outbound CTR + cost, Click-to-Lead CVR (custom), CPM, Frequency. [12]
16. **Scorecard.** Copy the Meta Ad Arena Scorecard (Spend, Impressions, Link Clicks, Conversions, CPA, ROAS, optional CPM) and add booked jobs from Jobber and calls from CallRail. Daily entry, weekly decisions. [03, 12]
17. **Change Control Log.** Copy the template; log every ad, budget, landing-page, price, response-time and tracking change with expected result, what stays fixed, review date. One meaningful change at a time. [14]
18. **Delivery input check.** Fill the five-line check for the first campaign before launch. [13]
19. **Policy pre-flight on every ad and landing page.** Run through the claims gate and Posture-A: no "you" implying personal traits or health; no "guaranteed"/"proven" unless approved; no lethal/body-gripping wording; privacy policy and terms in footer; no broken links or redirects; ad promise equals page headline. [16]
20. **Appeal kit.** Save the chat-support script, the profile-suspension template, and the "once only" rule where the agent can find them. Never delete a disapproved ad. [17]
21. **Offer and avatar docs.** Offer Equation pass (value, friction, trust) and a 4-quadrant avatar for the main buyer (rural/suburban homeowner with lawn damage), built from Google reviews and CallRail transcripts. Label planned ads by awareness stage. [19, 21, 24]
22. **Launch budget math.** Per test cell, budget is at least 2-3x CPA; expect to lose money and gather signal for 30 days; do not pause or rebuild on days 1-30 on cost alone. [03, 13]

---

## Open questions / gaps

1. **Phone calls.** The entire course tracks web events. It says nothing about call tracking, call-only ads, click-to-call or Click-to-Message ad formats, or feeding call outcomes to Meta. Got Moles' main conversion is a phone call (CallRail). Need a method (CallRail integration, a tracked call-click event, or offline conversion upload).
2. **Offline/CRM feedback.** Dan says lead-to-close must be connected but never shows how to send booked-job data back to Meta (offline events via CAPI). Matters for Jobber outcomes.
3. **Attribution window.** No attribution window is set in these lessons ("one-day or seven-day click" is mentioned in passing only). Defaults and rationale are probably in a later course.
4. **Budget, CBO/ABO, bidding.** References to "the lesson on budget strategy," "ABO controlled creative test," and "bid caps" point to other courses. Only the 2-3x CPA budget floor is stated here.
5. **UTM string missing** (shown on a slide, not transcribed). The one in this digest is the standard Meta string, not Dan's.
6. **Unreadable/empty items:** [15] Metrics & Lingo Guide PDF ("could not open"); [20] Guarantees, Urgency & Scarcity (empty, "coming soon"); Offer Builder Worksheet PDF and Customer Avatar Template PDF ([19], [24], "could not open"; the Google Doc links exist but are not in the corpus); the e-commerce and lead-gen column list that Dan said he would drop below the video is not included.
7. **Instant forms vs. website.** Dan disfavors native lead forms for quality, but this is for high-ticket funnels. For a $450-$600 residential service the right form type is untested here.
8. **Local-service specifics.** Nothing on geo-targeting radius, zip/county targeting, special ad categories (not required for pest control, but verify), or service-area exclusions beyond "use guardrails only for real reasons."
9. **Facebook Page / Instagram.** The course assumes a Page exists; no guidance on Page setup, reviews on the Page, or whether Got Moles has a Page and admin roles in order.
10. **HiVA claims** (score tiers, `ads_trust` source tag, AdsTrust extension, personal-profile effect) are Dan's experience, not published by Meta. Treat as heuristics; do not let the agent claim them as fact to Spencer.
11. **Support URL** for suspended-profile help (`facebook.com/business-startup-support-home`) is spelled out in a noisy transcript; verify before use. The Meta Verified price (~$15/month) is also unconfirmed ("don't quote me").
12. **Date drift.** Lesson text refers to 2026 and a recent Andromeda state; Ads Manager labels (Dataset vs. Pixel, Business Portfolio vs. Business Manager) change often, so click paths may differ slightly.
