# Briefing for Roy: what we learned from three Skool courses (2026-10-29)

From Spencer / Got Moles. Prepared 2026-10-30.

## Why you're getting this

On 2026-10-29 we went through three paid Skool communities from start to finish. We pulled every
lesson, transcribed the video-only lessons ourselves, and digested the content into working
methods for Got Moles. Each course now drives a skill in our Agentic OS install. You run the site,
SEO and site tracking, and most of what follows depends on that work, so you should see the full
picture: what each course teaches, where we follow it, where we override it, and what it needs
from you.

| Course | Instructor | Size | What it became | Status |
|---|---|---|---|---|
| The Meta Ads Arena | Dan Edmund | 96 lessons + 5 live Q&A calls, ~254k words | `ops-meta-ads` skill: SETUP / PLAN / BUILD / OPTIMIZE / REPORT / RESCUE for Facebook/Instagram ads | Membership: keep-or-cancel still open |
| AI Video Bootcamp | (course team; built around their PromptWise platform) | 130 lessons, 40 of them video-only and transcribed locally | `mkt-ai-video-ads` skill: AI ad creative pipeline | Cleared to cancel ($9/mo); content fully captured |
| HSA Starter Program | Steve Hunsaker | 93 lessons across 14 open courses, ~250k words | `local-growth-playbook.md` inside the marketing (CMO) skill | Cancelled 2026-10-29; access runs to ~11-29 |

## The rules that sit above all three courses

Where any course conflicts with these, Got Moles wins:

- **The outcome is a booked job in Jobber.** We judge cost per booked job (CPBJ), payback and mix
  effect, never cost per lead alone.
- **Spencer approves every spend, every launch and every send.** The agents draft. No cron ever
  spends, bids, publishes or sends.
- **Posture A in paid ads, for words and pictures.** No traps, no dead moles, no mechanism, no
  kill/lethal/body-gripping/scissor/harpoon/spike wording, no "snap" sound effects.
- **Homograph gate.** "Mole" also means a skin mole. Every ad, image and caption has to read as
  lawn and yard in the first second.
- **Claims gate.** No I-713 compliance claims. No "WA's #1". "15+ years" is Spencer's personal
  experience; the company was founded in 2017. Re-measure the review count live before each new
  use, and never present the total count as a five-star count. Don't claim "5.0 across three
  locations". Lead with "chemical-free and safe mole control", not "trapping". Dead moles are
  double-bagged into the customer's garbage can, never "hauled away".
- **Honesty.** No fake reviews and no AI person speaking as a customer. Cloning a real person
  needs their written consent. Several courses teach the opposite; we don't follow them on this.
- **US English** everywhere, with an American accent on any voiceover.

## Decisions made yesterday that touch your lane

1. Meta is held to Google parity. Real Google CPBJ for May–Oct is about $180–221 ($27,170
   spend). Spencer's ~$63 figure is cost per conversion, not cost per booked job. The Meta target
   is ≤$220 per booked job, with a $300 ceiling.
2. Every Meta ad that shows or dials a number uses the CallRail Facebook tracker, (253) 528-8152.
   It never uses (253) 321-1024, the untracked main line that DigiHammer's call ads used.
3. The Meta ad destination is a landing page with click-to-call, dynamic number insertion and a
   short form. Instant forms and the Calls objective wait until attribution works.
4. Meta 2FA is now required for everyone. Business verification was submitted as Rainier Power
   Wash LLC (Got Moles is a DBA) and is in review; we re-check around 11-02.
5. You already have two emails from 10-29. One covers the Meta tracking work: pixel, CAPI, domain
   verification, a qualified Lead event, and swapping in the CallRail number. The other covers the
   Google call asset (253) 331-2772, disapproved since Jul 23, and the CallRail import conversions
   that show "Needs attention". Part 1 explains why each item matters.

The three parts follow: Meta, then AI video, then HSA. Each one ends with a "What this means for
Roy" list.

---

## Part 1: The Meta Ads Arena (Dan Edmund)

**What this is.** A Skool course by Dan Edmund, harvested and digested on 2026-10-29: 96 lessons (~206k words) plus 5 live Q&A calls (9/25, 10/8, 10/15, 10/22, 10/29). From it we built the `ops-meta-ads` skill, which plans, builds, runs and reports Got Moles' Facebook/Instagram ads. Spencer's instruction: he does not learn Meta ads; the agent learns them and either tells him what to click or drives the browser. His job is approvals, logins and real photos.

**How to read it.**
- Dan's examples are e-commerce, coaching and ~$10k high-ticket lead gen. Mechanics transfer; examples do not.
- Marks: **APPLIES** (use as taught), **ADAPT** (use with a change), **ECOM-ONLY** (skip).
- Where Got Moles overrides the course, the course rule comes first, then the Got Moles version. The override file (`ops-meta-ads/references/got-moles-operating-rules.md`) wins over the course.
- Dan says repeatedly there are no universal numbers. Some claims (HiVA trust score, "10 to 1" instant-form quality gap) are his experience, not Meta's published facts.
- Got Moles frame: local, phone-first, King/Pierce/Thurston, small budget, seasonal. The real outcome is a **booked job in Jobber**, which happens offline days after the click. The course never covers phone calls.

---

### Module A: Foundation and setup (26 lessons)

#### Mindset and timeline (APPLIES)
- **Expect to lose money in the first 30 days.** Days 1-30 buy data; days 31-60 iterate on promising hooks and angles; days 61-90 scale, defined as predictability ("for every dollar in, I expect X back"), not three good days.
- Write one target number (CPA) before launch. Every decision asks "toward or away from target?" Daily scorecard (Spend, Impressions, Link Clicks, Conversions, CPA, ROAS); decide weekly; use the CRM as truth because Ads Manager models and delays conversions.
- Got Moles: target = max cost per booked job (CPBJ). The agent tells Spencer up front that month one loses money and does not recommend pausing on cost alone in that window.

#### Business Manager setup (APPLIES)
Nothing is built before this. A personal ad account is "a huge liability" (a profile restriction locks you out).
1. Create the portfolio at business.facebook.com. Ad account under Business Settings > Accounts. **Time zone and currency are permanent** (Pacific, USD).
2. **2FA:** Security Center > Two-Factor > **Everyone** (Dan: cuts hack risk ~90%).
3. **Domain verification:** Brand Safety > Domains > **DNS TXT** record > Verify. Usually minutes; officially up to 24-48 hours.
4. **At least two full admins** (he says 2-3). Agencies and freelancers join as **Partners** with specific assets, never as admin.
5. Assign people to the ad account, Page, Instagram and pixel/dataset.
6. Set an **account spending limit** (hard cap; hitting it pauses all campaigns, a common cause of "random" stops).

#### Billing (APPLIES)
Dan: "nine times out of ten" new advertisers lose accounts to billing, not policy.
- New accounts start with a ~$50/day limit and a $25-50 billing threshold; at high spend the card is charged many times a day, the bank reads it as fraud, retries fail, campaigns pause, account restricts.
- Primary = business credit card; not debit, **not prepaid**, not PayPal. Always add a **backup card**. Virtual-card billing address and zip must match exactly. **Call the card issuer before launch** (prevents ~90% of problems). Thresholds rise with successful charges.

#### Hierarchy and naming (APPLIES)
- Campaign (objective) > Ad set (who/where/budget) > Ad (creative). Objective: **Leads or Sales in ~99% of accounts**; never Traffic or Engagement.
- Names must be filterable in a 60-day report: campaign `[Objective] — [Audience] — [Date]`; ad set `[Audience] — [Description] — [Placement/CBO-ABO]`; ad `[Format] — [Hook] — [Version]`. Never "test 1".

#### Tracking (APPLIES; ADAPT for calls)
- **Pixel (now "Dataset") is browser code; CAPI is the server-side backup** ad blockers and iOS cannot block. Run both; Meta deduplicates only when both send the same `event_id`.
- Install via plugins, **Google Tag Manager**, a developer, or Meta's no-code Gateway for CAPI. Verify in Events Manager > **Test Events** plus the Meta Pixel Helper extension. **Event Match Quality target 7+; below 6, pass email, phone, name.**
- Lead gen needs PageView, ViewContent, Lead/CompleteRegistration. A pixel seeing 1 of 10 real conversions reads as a broken page and costs rise.
- **UTMs are mandatory**, dynamic, in the ad-level URL parameters field; read in GA > Traffic Acquisition. Standard string: `utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}` (Dan's slide was not transcribed).
- **Custom conversions:** Events Manager > Custom Conversions, rule "URL contains" the thank-you path, optional value. The optimization event is the instruction to the algorithm; the wrong event buys the wrong people.

#### Economics (ADAPT)
- Break-even ROAS = 1 / gross margin; target = 1.5-2x that. Max CPA = margin per unit x target profit margin. LTV sets aggressiveness ($240 LTV at 40% margin allows a $96 CPA). Meta-reported CPA is "almost always understated."
- Got Moles: compute per **booked job** including lead-to-booked rate; TMCP's multi-month stream supports a ceiling above first-job margin (`acc-cfo`).

#### Metrics and columns (ADAPT, lead-gen half)
- Build a saved preset: Amount spent, Leads, Cost per lead, Landing page views + cost, Unique outbound CTR + cost, custom **Click-to-Lead CVR**, plus CPM and Frequency.
- 200 link clicks but 80 landing page views = ~60% lost before load (a site problem). New-account CPMs can be $100; competitive niches $50-100. **No frequency kill rule** (he has run frequency 8 stable); refresh only if above 3 **and** performance falls. High CTR (all) with low outbound CTR = entertaining, not selling.
- Native instant forms "typically don't bring in the highest quality." **The key lead-gen metric is outside Ads Manager: lead-to-close.** A $2 CPL closing at 1% loses to a $20 CPL closing at 15%. Ecom columns: ECOM-ONLY.

#### How the auction works (APPLIES)
- Five steps: eligibility, retrieval (Andromeda), ranking (willingness to pay, predicted action, ad experience), delivery, feedback.
- **Budget floor: 2x, possibly 3x CPA per test cell.** Optimizing a basic form returns people who fill forms ($5-8 leads who never answer). Bid caps and cost controls restrict opportunity.
- Diagnose five inputs before touching settings: offer/economics, optimization event, creative clarity, conversion path, delivery guardrails (add only with a documented business reason).
- **Five-line delivery check** before any change: event, the outcome it represents, the validating data, the creative promise, every constraint and its reason.

#### Change control (APPLIES, high value)
- **One meaningful change at a time**, logged, with a fair window; never judge off 24 hours. ~50% of swings come from outside the ad account (page, phone response, staffing, price).
- Log columns: date/time, exact change, where, why, expected result, what stays fixed, review date, primary and guardrail metric, outcome, decision. Got Moles file: `projects/briefs/meta-ads/change-log.md`; it also covers Roy's site changes and crew capacity.

#### Account survival: HiVA, policy (APPLIES)
- **HiVA** is a hidden trust score (Dan's claim): Bronze/Silver/Gold/Platinum, Silver to Gold ~12 months. Levers: consistent spend, policy compliance (every unappealed disapproval is a strike), user feedback, pixel/CAPI health, and **personal profile health** (reps reportedly banned an ad account over the owner's posts).
- Safety: 2-3 admins; physical business card; the **2FA bug** (restricted for "no 2FA" while it is on) is fixed in the mobile Accounts Center by toggling 2FA with an **authenticator app, not SMS**.
- **Policy landmines** (AI scans copy, images, page): (1) **personal attributes**: don't imply you know something about the viewer; avoid "you" tied to a trait or condition; (2) **claims**: no guarantees, "guaranteed" becomes "designed to help"; Meta counts any statement that the product does X as a claim; (3) **landing page**: no broken links or redirects, privacy policy and terms in footer, headline matches the ad; (4) **circumventing systems** (obfuscated words, relaunching after a ban) is the worst and nearly unappealable.
- Delayed fuse: violating copy can run a year, then one flag cascades into 30 restrictions in a day.

#### Appeals and recovery (APPLIES, full procedure)
- ~90% of rejections are AI false positives. **Never delete a disapproved ad.** If compliant, use **human chat support**, not "Request review." If it violates, fix, publish **once**; if it fails again, build a new ad from scratch.
- Script: polite, play-dumb: "I believe this was flagged in error by the automated system; can you help me submit it for manual review?"
- Account disabled: repeat chat daily; expect 2-3 conversations (reinstatement took 2 days to 2 months). Profile also suspended: a colleague opens chat from their own account with a template citing spend history, plus a selfie holding paper with the account email. **Meta Verified** (~$15/month) helps minor issues only. Last resorts: a gray-hat reputation firm (~$2,000-3,000) or a true fresh start. Never a VPN.

#### Offer and buyer psychology (ADAPT)
- **Ads are amplifiers:** ~8 in 10 failing accounts fail on the offer. **Motivation = (Value − Friction) x Trust.** Urgency and scarcity must be genuine.
- **Awareness ladder:** Unaware, Problem, Solution, Product, Most aware; you cannot skip steps. **Market sophistication** has 5 levels (simple promise, specific promise, mechanism, demonstrated mechanism, new identity).
- **Avatar:** pain, emotional outcome, objections, status shift, sourced from reviews and calls. **Voice-of-customer:** mine competitors' 1-3 star reviews and your own; AI extracts verbatim phrases and hooks.
- Got Moles stage: mostly Problem aware (seen mounds) and Solution aware (trap vs poison vs pro). Sources: Google reviews, CallRail transcripts.
- Gaps Dan leaves: calls, offline conversions, attribution windows, service-area/special-category guidance, UTM string.

---

### Module B: Creative strategy and copywriting (27 lessons)

#### Creative is the lever (APPLIES)
- Andromeda reads the ad itself; "creative is the targeting" (~95% of results, his figure). Broad targeting wins ~98% of the time; consolidate to roughly one prospecting + one retargeting campaign; ~90% of effort goes into the ad.
- Ads sharing key visual attributes count as **one ad (one entity ID)**.

#### Creative matrix and pipeline (APPLIES)
- Real variety differs on four dimensions: **Persona, Format, Environment, Benefit**. Typical account runs 15-30 distinct concepts; start with 5 on a small budget. Andromeda backs 2-3 and starves the rest; normal.
- **Three buckets, always active:** new angles, angle extensions, proven workhorses (leave alone). Only workhorses means one fatigue event from a crash. Execution fatigue (new visual) vs message fatigue (new angle).

#### Static vs video, and formats (APPLIES)
- Video educates and builds trust; static lands in under a second and suits simple offers and guarantees. A basic local service doesn't need a 60-second video. **Test with ~5 statics, translate the winner to video.**
- **Eight static formats:** native camouflage (raw phone photo; APPLIES), high-contrast callout (APPLIES), text-heavy informational (ADAPT: moles vs voles checklist), notes-app screenshot (APPLIES), tweet screenshot (ECOM-ONLY), email/DM screenshot (ADAPT: real customer text with permission), us vs. them (ADAPT: DIY vs professional, no trap wording), founder selfie + long copy (APPLIES). The 20% text rule is gone; "ugly" native ads win.
- **Specs:** 4:5 (1080x1350) and 9:16 (1080x1920); headline and CTA clear of the top and bottom quarter; PNG; ask AI images for negative space and proof the spelling.
- **Video structure:** hook (first 3 s), bridge (~7 s, empathy or authority), body (Problem-Agitation-Solution + named mechanism), CTA (last 5-15 s). Film one body, many hooks.

#### UGC and hooks (ADAPT / APPLIES)
- UGC must look native. Founder story: APPLIES (Spencer). **"Fake customer review": BANNED here** (Dan has staff play a customer). **B-roll hack:** ~5 minutes of B-roll plus 5 recorded voice hooks gives 5 ads. Outside creators (~$150/video) are unnecessary; the owner and technicians are the creators.
- 90% of weak ads lose people at the hook. Winning hooks: **direct call-out**, **dilemma/pain point**, **counter-narrative**. Static headline = the hook and must carry the value alone.

#### Angles and swipe file (APPLIES)
- An angle is an argument for why this buyer cares now; a hook, face or background is execution. Parts: buyer tension, one promise, reason to believe. Find angles in buyer tension, purchase moment, complaints, mechanism, proof story.
- **Angle Opportunity Card** (evidence, market default, gap, angle statement, proof, execution, priority). **Five filters:** True, Distinct, Relevant, Provable, Practical (assume 9 in 10 tests lose).
- Swipe file: Capture Inbox, Evidence Library, Next Briefs; weekly 20-minute review; promote **one** pattern; never copy wording or testimonials. Got Moles' richest source is first-party: CallRail transcripts, reviews, Jobber notes.

#### Brief and AI production (APPLIES)
- **Five-section brief** (avatar/funnel stage, assets, modular video script, static direction, copy: 3 short + 2 long captions, 5 headlines). A vague brief gives a vague ad. **Variation matrix:** 3 hooks x 3 visuals x 2 formats = 18 ads from one brief.

#### Copy (APPLIES)
- Direct response: the ad sells the click, the page sells the booking. Frameworks: **AIDA, PAS, BAB, Story/epiphany**. Four mandatory AI inputs: avatar, awareness stage, offer, framework.
- **Strip from AI copy:** emoji overload, cliche openers, "not X, it's Y," fake empathy, weak CTAs, word-salad transitions. Read aloud.
- **24 techniques** (e.g. "How to [result] without [objection]," be specific, future pacing, proof stacking, reason-why, address the skeptic, loss aversion, genuine scarcity only, risk-reversal guarantee). Ask AI for one by name.
- **Story copy:** founder, customer transformation, moment of realization; keep a story bank; "do not invent results or testimonials."
- **Diagnostics:** every line must raise perceived value, cut cost/friction, or raise acceptability ("call us" is a high mental cost). Ads running 30+ days in the Ad Library likely convert.
- **Funnel copy:** TOF problem-first, MOF proof, BOF direct. 80% of failures are marketing, 20% media buying. Got Moles: retargeting pools are small, so one prospecting pool plus a simple warm follow-up is enough.
- **Testing:** isolate one variable; test angles, not synonyms; never edit a live ad; **80/20 duplication** of winners. **Multi-text:** up to 5 primary texts and 5 headlines (under 40 characters), mixing short and long, five different psychological angles. **Dan does not use flexible/dynamic creative.**

#### Got Moles overrides for creative
- **Posture A:** no kill, trap, lethal, body-gripping, scissor, harpoon or spike wording or imagery; mechanism is stated only as chemical-free, pet/child safe, professional method.
- **Skin-mole homograph:** every visual reads lawn, mounds or a technician in a yard.
- Lead with "chemical-free and safe mole control," not "trapping."
- Claims gate: re-measure the review count live before each use and never state the total as a five-star count (never the shipped 219+, never "5.0 across three locations"); no I-713 claim; no "WA's #1"; "15+ years" is Spencer's personal experience (company founded 2017).
- Dead moles go in the customer's garbage can; never default to "hauled away." No bid price for commercial or 5+ acres. Real customers only; no AI person speaks as a customer; no AI-faked before/afters. US English.
- Draft angles (unapproved, not claims-checked): chemical-free lawn recovery (pets/kids), "what is digging up your lawn" (moles vs voles), technician story, guarantee-led (wording must match the gate), "why your neighbor's problem keeps coming back."

---

### Module C: Campaign architecture and local setup (14 lessons + 2 YouTube transcripts)

#### "Make sure this is OFF" (APPLIES, the highest-value checklist)
Meta defaults are tuned for the lowest-common-denominator advertiser. Re-check at launch **and after publish** (Meta re-enables some).
- **Ad:** all Standard Enhancements/Advantage+ creative OFF (keep only **Relevant comments**); Meta AI generated text OFF ("always garbage"); multi-advertiser ads OFF; translate OFF; decline AI image upsells.
- **Ad set:** detailed targeting expansion ("use as suggestion") OFF; **Advantage+ audience OFF** for local; **Audience Network OFF**; the location setting that includes people outside the area unchecked.

#### Structure (ADAPT)
- **Testing vault: ABO**, 10-20% of spend once winners exist. **Scaling: CBO**, broad, proven ads only, 70-80%. Retargeting 10-15%, only with warm volume. For one market and one offer, one testing + one scaling campaign is enough.
- **Never a campaign per town or radius** (~98% of local businesses need one). **Never test in CBO** (it puts ~95% on the first ad to get a click); **never scale with ABO.** Max 3-4 ad sets.
- Creative test = 3-4 fresh creatives for a known angle in one ad set; angle test = one ad set per angle.
- Objective **Leads**; no special ad category; conversion location **Website** (instant forms "usually don't bring in the best quality"); **Maximize conversions**, never clicks. A Lead event firing on landing on the form page is not a lead. Attribution: Standard, 7-day click.

#### Bid strategy (APPLIES)
**Highest volume** for new accounts, tests and most scaling. Cost-per-result goal only when proven and stable with healthy volume (Meta suggests 50-100 conversions/week); it sets an average, not a ceiling. ROAS goal: ECOM-ONLY. Bid cap: advanced; setting it too low stalls spend.

#### Audience and location (APPLIES, the local core)
- Start broad inside the service area; no interests ("the local boundary, the offer and the creative is enough filtering"). Location is "not a perfect fence." Don't fragment a modest budget across towns, radii or interests.
- Locations: exact cities/counties/ZIPs; Dan once picked the country Georgia instead of the state and refunded the client, so triple-check. Location type "people living in." **Age minimum 25** (18-year-olds rarely own homes). Gender open. Detailed targeting empty. Placements: all except Audience Network; 4:5 feed, 9:16 Stories/Reels.
- Advantage+ audience left on "can and will likely show your ad to people outside of your service area."

#### Budget (ADAPT)
- Buckets 10-20 / 70-80 / 10-15 hold from $1,000/month up. **Test unit: $10/day per ABO ad set for ~5 days (~$50).** "You do not scale to find winners, you scale winners you've found." Shift toward testing if new, fatiguing, or no winner in 60 days. Distrust automated rules ("my most expensive mistakes").
- No lead-gen numeric KPIs; they come from your own break-even.

#### Conversion path and lead quality (APPLIES)
- Website over instant form; test **one path at a time**, compare downstream. One unnecessary form question can cut conversion ~30%.
- Track Lead > Contacted > Qualified > Booked > Showed > Sold > Collected. "Leads from a different state" means default location settings. Diagnose in order: location, message, page/form, follow-up.
- **Page diagnosis:** clicks healthy but LPVs weak = handoff (speed, redirects, in-app browser, pop-ups); LPVs healthy but no action = message match/proof/price; leads fine but quality weak = form too easy or slow follow-up; page converts but business result weak = economics or sales process.
- Compare Meta to Google Local Services Ads on the same outcome path. Retargeting often shows the best CPA by claiming people who would have converted anyway.

#### Existing customers and retargeting (ADAPT, later)
- **Customer lifecycle strategy** ("acquire new customers"): Meta guesses who your customers are, so upload a list; leave "exclude engaged audiences" OFF. Described for Sales campaigns; may not appear for Leads. Got Moles: TMCP is recurring for the same households, so waste on current clients is plausible; needs a hashed Jobber list, Spencer's OK first.
- Retargeting: the old three-campaign funnel is outdated. Small accounts: at most one campaign with one high-intent warm ad set; standalone needs Advantage+ audience OFF and exclusion from cold. Warm copy answers the blocking objection. High-ticket pre-call engagement campaigns and dynamic catalogs do not fit.

#### Landing page (APPLIES; Roy owns the site)
1. **Message match** to the ad. 2. Answer in order: right place, why care, believable, what do I do, cost, why trust. 3. Action above the fold; direct headline, no curiosity. 4. Proof where doubt appears. 5. Useful qualification (service area, timeline), not waste. 6. **Mobile first** (80-90% on phones); test the real link in the in-app browser; PageSpeed. 7. Short form. 8. Never the homepage. 9. Thank-you page says what happens next. 10. Show the service area. One change at a time, logged.

#### Ad fields (APPLIES)
Page + Instagram identity; first line of primary text is the hook (feed cuts at "See more"); up to 5 texts (2 short, 3 long) and 5 headlines; URL matches the promise; **CTA "Get quote"**; UTMs on; preview every placement. Every local ad needs a real local signal (city, recognizable setting, authentic proof).

#### Graduating a winner (APPLIES, later)
Prove a repeatable viable CPA with downstream quality. Preferred method: copy the **post ID** and "Use existing post" in the scaling ad set (keeps likes and comments; copy cannot be edited). Then **pause the original** in testing. Results often look worse for a few days.

#### Expansion and Q4 (ADAPT)
Add a market only if the current one yields qualified opportunities, crews have capacity, there is a hypothesis, and proof supports it; one at a time. Q4 for a local service: prioritize response capacity over Black Friday discounts; baseline against your own prior seasons. Advantage+ Shopping/Catalog: ECOM-ONLY.

#### First-launch build spec (course-derived; every number to confirm with Spencer)
Leads objective; **CBO OFF (ABO)**; Highest volume; Website conversion; Maximize conversions; **$10/day per ad set, ~5 days**, max 3 ad sets; served ZIPs only; age 25+; Advantage+ OFF; Audience Network OFF; 5 texts, up to 5 headlines; CTA Get quote; enhancements OFF; published **paused**; re-verify OFF settings after going live. Judge on cost per booked job from Jobber.
Gaps: no call ads or click-to-call guidance, no lead-gen benchmarks, instant form vs website for a $450-600 phone-quoted service untested, priced vs bid-only offers not addressed, no mole seasonality.

---

### Module D: Testing, optimization and scaling (10 lessons)

Translation: "final event" = booked job; "target CPA" = target CPBJ.

#### Philosophy and test structure (APPLIES / ADAPT)
- **Testing campaign (ABO)** is never scaled and not expected to exit learning. **Scaling campaign** holds winners, ~80-85% of budget, edited as little as possible. Decide from business outcome; set the decision rule before spending. Winners are never edited in place.
- **Test ladder:** baseline, isolation (hold offer, page, audience, event, CTA), scale. **Angle test** (reason to care) vs **execution test** (hook, creator, format, proof). One-line text edits are not new concepts.
- **Five-item checklist before launch:** hypothesis, variable, constants, business metric, decision rule.
- One ad set per angle, same broad targeting and goal. (The chart says 1 ad per ad set; the transcript says 2-3 creatives per angle at modest budget; unresolved.) At small budgets do not split $50 across five ad sets; an ignored creative is not a loser.
- Test budget ~2-3x target CPA per day; "six ads on $20/day with a $50 CPA is buying confusion."

#### Judging (APPLIES)
Ad set level for most decisions; ads in a set assist each other. **Four buckets:** delivery leader (don't edit), promising not decided (be patient), fair test + weak result (kill or iterate), underserved (no verdict).

#### Kill / hold / iterate / graduate (the numeric core)
- Set target, ceiling and final event first. **Three lines per ad: TARGET 1x, REVIEW 1.5x, STOP-LOSS 3x.** Poisson basis: for an ad truly capable of target, zero results after 1x spend ~37%, 1.5x ~22%, 2x ~14%, 3x ~5%. An operator rule, not Meta's.
- **Zero results:** under 1x observe (check delivery, tracking, page); 1.5x diagnose via click audit; 3x pause that execution only if delivery was fair, tracking right, window passed.
- **3+ results** (spend / results): at or under target keep live; up to 1.3x hold; 1.3-1.5x gray zone (named reason only); over 1.5x pause or iterate. One result is a data point.
- **Four decisions:** KILL; HOLD (needs a written review condition; "a hold without a condition is just hope"); ITERATE (original untouched, one change); GRADUATE (~2-3x CPA spent, repeatable). Don't apply stop-loss mechanically with no fair delivery, a known conversion lag, a mid-test page change, weak attribution, or underfunding.
- **Lead gen runs two clocks:** raw-lead (for a $30 target: observe $30, diagnose $45, pause $90) and a weekly quality cohort of leads ~7 days old (contact, qualified, booked, show, sale). "A $12 lead that never answers is not cheaper than a $35 lead that becomes a customer."
- Compare diagnostics to your own baseline (10 leads with zero contacts against a 70% norm means audit phone, routing and speed).

#### Click audit (APPLIES)
Audit the ad set over the conversion cycle; fix the **first** leak only.
- High CTR (all), low outbound CTR: curiosity traffic, rework the hook. Low CTR, strong outbound: don't kill. Strong outbound, weak downstream: the ad is fine. Outbound clicks far above LPVs: fix speed/redirect/in-app first. LPV fine, leads weak: message match, offer, proof, form. Ad promise differs from page: fix the handoff. Leads fine in Meta, weak in CRM: audience or follow-up. High CPM alone is context.

#### Learning phase (ADAPT)
~**50 optimization events in 7 days** exits learning. Ignore "Learning limited" on testing campaigns; in scaling it is a warning, not a kill switch. Significant edits (audience, creative, event, bid strategy, big budget change, long pause) reset learning. Avoid the panic cycle: day 2 budget, day 3 add ad, day 4 audience, day 5 declare dead. For a rare final event, optimize the upstream event with real intent. Got Moles: 50/7 is unreachable on booked jobs; optimize on lead.

#### No-spend ads and patterns (APPLIES)
- **No spend:** read Delivery; match budget to event; loosen bid controls; consolidate. One new ad getting $0 in a mature ad set is usually Meta protecting winners: leave it, or give it its own ad set with an ad-set **minimum spend** (e.g. $75 winners / $25 new on $100/day), or use "push delivery." Never duplicate or narrow targeting to force spend.
- **Patterns** must be repeated, comparable and meaningful; otherwise log an observation. **A daily budget is a weekly average** ($100/day can spend $200 one day). Fatigue = CPM rising plus cost per result worsening over a meaningful period. Tag creatives by angle, awareness, proof, hook, format; keep a log (observation, hypothesis, next test).
- Home-service lesson: a generic "free estimate" ad was cheaper per lead but weak on answered calls; a proof-based ad cost more per lead and converted far more.

#### Scaling (ADAPT)
- **Gate, all four:** business result works; enough conversion cycle; you can name why; the business can handle volume.
- Types: vertical, horizontal, creative (the main lever), operational. **By budget:** $0-100/day mostly ABO testing; $100-300 add a one-ad-set CBO scaling campaign; $300-1,000 controlled vertical; $1,000+ several angle ad sets.
- Creatives expire; always run a test. At ~$50/day, one genuinely new concept a week beats 15 variants. **Four bottlenecks** before raising budget: creative, funnel, demand, operations.
- **Vertical:** the 20% rule is a ceiling, not a law. Conservative default **10% every 48 hours**; mature accounts 20% every 24; retargeting 5-10%. Never double or triple (a tripled $30-CPA budget went to $90 and never recovered). One change, logged, observe 48-72 hours. Outcomes: holds, softens but profitable (acceptable), breaks (revert to the last stable budget).
- **Horizontal** only after vertical stalls: concept, customer state, offer, market, audience hypothesis; launch one. Measure incremental value, not per ad set.
- Got Moles binds on crew capacity and a finite service area, not the algorithm.
- The module ends with a **33-row decision table** and a **12-step weekly routine** (outcome first, cohort check, what changed, ad-set judgment, click audit, four decisions, fatigue, budget, pattern log, next test, report). Daily is read-only.
- Gaps: 2-3x CPA a day is out of reach when CPBJ is in the hundreds; most ads never reach "3 results"; no numeric fatigue thresholds; 10% of $30-100/day is a few dollars.

---

### Module E: Advanced creative, reporting, audits and AI (courses 06, 08, 09)

Course 06 was still being built at harvest; announced attribution and deep-creative lessons are missing.

#### Philosophy (APPLIES)
**Ads Manager is not the source of truth;** reconcile to the CRM. **The ad is responsible for less than half the outcome** (a phone or booking leak looks like a bad ad). **AI organizes evidence; it does not choose.** Never paste confidential customer data into AI tools.

#### Three saved column views (ADAPT)
- **Operator view (ad set):** Delivery, Budget, Amount spent, Results/Cost per result (read the label), downstream events, CPM, Frequency, **Outbound CTR** (not CTR all), Outbound clicks + cost, LPVs + cost. **Creative test view (ad level)** adds Impressions; an ad with $4 behind it tells you nothing. **Click audit view** follows the funnel in journey order.
- Level rule: campaign for allocation, ad set for environment/event/path, ad for the creative. Breakdowns only on a trigger. Compare 7 vs prior 7, 30 vs prior 30; never a partial Monday against a full week. Got Moles: use 14/30-day windows and same-period-last-year.

#### Six-step account audit (APPLIES)
One question: **what is the biggest thing holding this account back?**
1. **Business truth:** real outcome, target cost, margin, lag, recent changes, healthy 30-day baseline.
2. **Signal integrity:** Events Manager diagnostics, Test Events, dedup; a thank-you page edit often drops the event. Broken signal is a **blocker**: stop.
3. **Account design:** each campaign's job; avoidable fragmentation.
4. **Creative signal:** are "12 live ads" 12 ideas or 12 copies? Fatigue is a ~14-day trend.
5. **Customer path:** trace backward from the outcome; name the first break.
6. **Repair plan:** Blocker / Performance lever / Future opportunity; one sentence with owner, **due date**, review date (Dan: 14 days).
Got Moles leak candidates (our inference): missed calls, out-of-area calls, skin-mole homograph traffic, commercial/5+ acre leads needing an in-person bid.

#### 30 creative frameworks (APPLIES)
Most accounts have an idea problem, not a volume problem. UGC/static/video are formats; the framework is the argument. Pick ~3 by the buyer's barrier: doesn't feel the problem (1-5 pain/tension), doubts your answer (6-10 belief/mechanism), needs confidence (11-15 proof), can't see themselves (16-20 identity), hesitating (21-25 objection/risk reversal), needs to experience it (26-30 demonstration). Re-express a fatigued winner through a different framework, not a color swap. Got Moles candidates: specific symptom, cost of inaction, why DIY fails, objection answer, risk reversal, behind the scenes, before/after lawn.

#### Competitor research, partnership ads, platform changes
- **Competitors (APPLIES):** start with one question; sample ~10 brands (3 direct, 3 adjacent, 4 aspirational) in the Ad Library; one ad is an idea, 3-4 brands a pattern; a gap is usable only with proof. Hypothesis form: "because the market shows [pattern], we test [angle] using [our proof]." 30-45 minutes a week.
- **Partnership ads (ADAPT, low priority):** the ad runs from your account under a creator's identity. Choose on buyer/proof/delivery/working fit, not followers; content-level permission first; written terms for usage period, scope, claim guardrails, fee, renewal. No creator speaks as a fabricated customer.
- **Platform:** Andromeda is the repeating theme (real concept variety, consolidated structure). The **Oct 2, 2026 customer lifecycle update** is a 3-minute video with no transcript; its content is unknown. The News & Updates page overrides older lessons; check weekly.

#### AI Prompt Library and attribution
Same 15 prompts as Module A/B. Best fits: **#1 Review Miner**, **#12 Ad Account Summarizer** (the weekly report), #11 Click Audit Diagnostician (booked job for purchase), #9 Objection Destroyer. #14 Policy Appeal Writer only for compliant ads; #15 Offer Equation is Spencer's and the CFO lane. Meta ROAS is "directional platform evidence." No coverage of call tracking, offline upload mechanics or local specifics; the CallRail/Jobber mapping is ours.

#### Reporting template
- **CPBJ = Meta spend / booked jobs attributed to Meta in Jobber.** Weekly joins from outside Meta: web leads, CallRail calls, qualified leads, bid-required leads (commercial/5+ acres, separate bucket), booked jobs, billed revenue, CPBJ, cost per qualified lead, lead-to-qualified and qualified-to-booked rates. Tag KNOWN/ESTIMATE/UNKNOWN.
- Cadence: daily 5-minute read-only check; weekly core report; monthly full CPBJ/payback. **Monthly standing checks:** Events Manager diagnostics clean; Lead event firing; **call-number swap working on the landing page**; Meta leads directionally match the CRM. If broken, stop analyzing.

---

### Live Q&A calls (9/25 to 10/29)

Dan: "just my experience." Where calls conflict with the operating rules, the rules win until Spencer approves edits.
- **Pixel first:** confirm it fires on every page (not just home) before spend; verify the live ad after every publish (Meta silently auto-applies settings).
- **Events:** optimize the event that gives volume; the "50 events" rule "doesn't mean what it used to" (~20 leads/week does about as much); under a couple a week Meta "is just guessing." **Send Meta only qualified events**, easier on a landing page than an instant form. **Pixel reset** only when history is ~90% junk (not half), and only when CPL is low enough to retrain fast.
- **Structure:** no Traffic/link-click campaigns for business; start broad (one county-level ad set beats many ZIP sets); age 25+; Advantage+ audience off.
- **Budget and kill:** tests at 2-3x target CPA (winners show in 3-4 days); never launch at the full budget; daily spend is a weekly average; **kill at ~3x CPA with no result; early panic is the main error; don't pause a winner, trickle the budget down** (paused campaigns may relearn); one major change a week; wait until booked dates have happened; judge at ad-set level; one extra lead swings CPL, so wait for 10-20 leads. "Outspending people is the number one way to win."
- **Fatigue:** the "3x frequency" rule is false. Frequency up with CPA flat = keep running; both up = refresh. One ad ran 16-17 months at frequency 17 and still won.
- **Creative:** near-identical ads group as one entity; Ads Manager added a **creative diversity rating** (~10/22-10/29). State what you sell in the first half-second and first image; skip the logo; fill all five human-written texts and headlines; no Meta AI copy; no dynamic creative for images; upload 9:16, 4:5, 1:1 and uncheck the auto aspect-ratio box.
- **Lead quality:** instant forms ~"10 to 1 lower quality" and landing pages ~3x the cost per lead but "90% answer the phone" (his accounts only; he concedes forms can work and a verdict needs 10-20 leads). Add honest friction ("Do you own your home?"). Never send traffic to a home page. Unanswered leads are a follow-up problem, not an ad problem.
- **Local:** household-income targeting (top 5/10/25%) is Dan's first move for high-ticket work (watch audience size); no interest targeting; local audiences saturate fast, refresh every 1-2 weeks at higher budgets. **Q4 and election noise** inflated costs (one member's CPL went $6 to $10 and volume halved).
- **Closest analogues:** a phone-first retailer whose owner refused tracking numbers (Dan: switch to a conversion objective and track everything; he never answered how to attribute calls without a tracking number) and a tree contractor steering toward bigger jobs (income filter, then qualify on job size and send only the qualified event), the model for Got Moles' commercial and 5-acre work.
- **Proposed rule edits awaiting Spencer** (in `Q-live-calls.md`): kill only after 3x target CPL, size tests at 2x or more; frequency alone never triggers a refresh; step down, don't pause; one ad set across the service area; qualified-only Lead event; October-Q4 caveat; verify the live ad after every publish; creative diversity check.
- **Questions for Dan:** how to optimize toward calls Meta can't see at 10-20 booked jobs a month; the smallest budget where one ad set exits learning-limited at a $450-600 job; seasonal trickle vs pause; clean pixel vs agency-era history; frequency and "mole" homograph waste in a small geography.

---

### How Got Moles adapts the course

The course assumes budgets of 2-3x CPA a day, an online conversion and a large audience. Got Moles has a small budget, an offline phone-first conversion, a finite service area and seasonal demand. Figures tagged `ESTIMATE` are working rules set 2026-10-29, to be replaced by Got Moles' own baselines after 60 days.

- **Outcome and two clocks.** Course: judge the final event. Got Moles: a **booked job in Jobber**, never a lead or Meta's "Results." Meta cannot see booked jobs yet, so booked jobs are reconciled by hand until offline conversions exist. **Clock 1 (raw lead)** protects budget now; **Clock 2 (booked-job cohort, leads 7-14 days old, judged after quote/booking dates pass)** decides what works. Clock 1 kills an execution; Clock 2 kills or keeps an angle. **Lead fires only on qualified leads** (in area; residential under 5 acres or a real commercial inquiry). Target CPL = target CPBJ x lead-to-booked rate (`UNKNOWN` for Meta until the first cohort; use the blended CallRail-to-Jobber rate as a stated proxy).

| Course rule | Got Moles version |
|---|---|
| Zero results: observe <1x, diagnose 1.5x, pause at 3x CPA | Same lines on **target CPL**; pause the ad, never the angle, on Clock 1 alone |
| 3+ results: keep/hold/gray/pause at 1x/1.3x/1.5x | Same on CPL per ad; for angles, same bands on CPBJ once the cohort has 3+ booked jobs; fewer = observation only |
| 50 events / 7 days to exit learning | Unreachable; accept "learning limited" on tests |
| Test budget 2-3x CPA a day | Not affordable: each ad set must be able to spend at least 2x (ideally 3x) target CPL; $10/day x 5 days reaches 3x only if target CPL is under ~$17, else run longer, never judge earlier; max 3 ad sets; never kill before 3x CPL with no lead |
| Vertical 10%/48h (20%/24h mature) | 10% steps, minimum $5, every 72 hours (`ESTIMATE`), only when the gate passes; step down a working ad rather than pause |
| No numeric fatigue rule | Frequency alone never triggers; refresh with a new concept when CPL and frequency rise together over the week; judge weekly |

- **Scaling gate (all five):** cohort meets target CPBJ with 3+ booked jobs; **crew capacity** (next two weeks of routes not already full); healthy speed to lead; nothing changed in 72 hours; Spencer approves the budget.
- **Seasonality.** Demand peaks spring and fall, dips in summer dry spells and hard freezes. Compare like season to like season; raise budget ~2 weeks before the historical rise (Jobber new-client counts); off-season is retargeting and the existing-customer program only.
- **Geography.** ZIPs actually serviced (last 12 months of Jobber property zips; live data beats `territories.json`), "people living in," Advantage+ OFF, no interests. **One ad set for the whole area, split by angle, never by city or ZIP.** One household-income top-25% test for commercial/5-acre. **Exclude active customers** (TMCP, open Quick Fix) via hashed lists that never enter the repo. Age 25+ (`ESTIMATE`).
- **Calls.** Every Meta ad that shows or dials a number uses the CallRail Facebook tracker **(253) 528-8152** (source facebook_all, rings the main line), never (253) 321-1024, which is the untracked main line. Destination is a landing page with click-to-call and a short form, not an instant form or a Calls objective. Instant form only as a separate labeled test later. No Calls objective until calls attribute to an ad.
- **Offer and claims.** Residential is phone-priced (Quick Fix tiers, TMCP monthly). Commercial and 5+ acres are in-person bids routed to Cory. One campaign = one offer; never mix bid-only and priced offers. Claims gate on every word and picture. No fake customers (Dan's fake-review tactic is banned).
- **Hard rules.** Spencer approves before any spend: every launch, budget change, new live ad, audience upload, un-pause. Everything is built as a **paused draft**; no cron ever spends or edits. CPBJ not CPL, tagged KNOWN/ESTIMATE/UNKNOWN. Appeals once only. The agent drives Ads Manager via `tool-browser` at human pace (every write needs Spencer's yes), or via the Marketing API once a System User token exists (not built). Chain of command: `mkt-cmo` sets strategy and budget; `mkt-ai-video-ads` makes video; Roy owns the site.

#### Where the account stands (read-only setup audit, 2026-10-29)
- **Ownership OK.** Business portfolio `109746944543095`, ad account `1386779432358453`, Page, Instagram (@got_moles, 4.9K followers) and pixel `3297148147139092` are owned by Got Moles. DigiHammer is a Partner with full ad-account access and runs the one live campaign. A "Conversions API System User" exists but no CAPI event has ever arrived.
- **Gaps:** 2FA was required for no one (now required for Everyone; one of three users still must set it up). The business is unverified (legal entity Rainier Power Wash LLC dba Got Moles; the daily spending limit is $47.16 until verified). **got-moles.com is not added or verified.**
- **Tracking is not working:** the pixel is **not installed on got-moles.com**; no October events, no custom conversions, no offline event sets. A website-lead campaign cannot optimize today.
- **Live campaign:** DigiHammer's "May 2026 Calls Campaign," $6.67/day, live since 2026-05-14. Aug 1 to Oct 28: $592.42 spend, 14 Meta-counted 20-second calls at $42.32. Booked jobs and CPBJ: `UNKNOWN`. Its ads dial (253) 321-1024, **not a CallRail tracker**, so Meta's calls ring the main line unseen; the 17 CallRail "Facebook" calls are organic (15 from one repeat caller). DigiHammer's ad is left alone (editing restarts learning).
- Billing: PayPal default, backup card, no account spending limit. Ten unread Page comments include "Do not kill moles please!!"; a reply policy under Posture A is needed.

---

### What this means for Roy

The Meta lane depends on site and DNS work only Roy can do. We write briefs and verify in Events Manager; we do not edit or deploy the site. Full brief: `projects/briefs/meta-ads/2026-10-29_brief-for-roy-meta-tracking.md`, sent by Spencer on 2026-10-29; we are waiting on a date and the list of files changed. Roy has full admin in the portfolio; 2FA is now required, and his login has never been active (Security Center flags it), so he needs 2FA on his Facebook login.

**Build list, in order.**
1. **Verify got-moles.com:** Business Settings > Brand safety > Domains > DNS TXT.
2. **Pixel `3297148147139092` base code on every page;** PageView fires once per load.
3. **Conversions API with dedup** through the existing Conversions API System User (token from Business Settings > System users). Same `event_id` from browser and server; hashed email/phone where given; `fbp`/`fbc`. Target Event Match Quality 7+.
4. **One Lead event, fired only on qualified leads** (browser + server, same `event_id`): in the service area (we send the ZIP list) and either residential under 5 acres or a real commercial inquiry. Not for out-of-area or junk. If the form lacks property type and acreage, add both. Also fire `Contact` on click-to-call taps.
5. **Dynamic UTMs survive** redirects and are saved as hidden fields with the form, so the Jobber lead shows the ad: `utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}`.
6. **CallRail dynamic number insertion** for visitors with `utm_source=facebook`/`instagram`, so calls show "Facebook Ads." The Meta tracker is **(253) 528-8152**.
- **Our check:** Events Manager > Test events shows PageView on load, one Lead on a qualified test and none on an out-of-area one, Contact on a call tap, and "Deduplicated" for browser + server.

**Landing-page needs (Module C, delivered as a brief).** A page matched to each ad, never the homepage; visible click-to-call above the fold; short form (service-area ZIP, property type, acreage); mobile-first and clean in the Facebook/Instagram in-app browser; privacy policy and terms in the footer; no broken links or redirects; headline equals the ad promise; service area shown; a distinct thank-you URL that says what happens next (also usable for a URL-based custom conversion). Later: Jobber bookings sent back as offline conversions/CAPI events (not built; the course gives no method).

**Open Google items that route through Roy** (Google Ads audit, 2026-10-29; Spencer emailed Roy and is waiting).
- **Call asset disapproved.** The account's only call asset, **(253) 331-2772** (a CallRail tracker forwarding to the main line), is "Not eligible: Disapproved (Unverified phone number)," added 2026-07-23, 0 impressions. No ad has shown a call button since July 23. Fix: verify the number (on the landing page, or a code by call/SMS). The audit judges this likely worth more than any budget change.
- **CallRail import conversions "Needs attention":** "First Time Phone Call" (Primary, in the account goal) and "Repeat Phone Call" (Secondary) both flag; "Text Message" is Misconfigured; "Phone call leads" is Active but starved without a call asset. The imports still log conversions (5 and 4 last week); the reason did not surface in the UI, so Roy/CallRail should check the integration. Target CPA bidding optimizes on this signal, so a broken call conversion misleads the bidder.
- The Ads API still returns 401, so reads came from the UI. Google "conversions" are leads; uploading Jobber bookings as offline conversions would improve bidding.

**Budget proposals awaiting Spencer's approval** (draft; nothing changes in the ad account until he approves a specific budget).
- **CPBJ target ≤ $220, ceiling $300.** The draft first proposed $200 / $300 / $400 TMCP allowance; after the Google check Meta is held to **Google parity**. Google's real cost per booked job, May 1 to Oct 28, is about **$180-221**: spend $27,169.93; 452 conversions at $60.11 (that is cost per lead, not per booked job); 123 new-customer bookings from Google Ads calls = $221; $180 counting all 151 bookings (mix 96 Quick Fix / 53 TMCP / 2 other). It may be slightly high (web-form bookings not yet matched, October maturing) but Brand spend flatters the blend. Target CPL derives at ~25% lead-to-booked (`ESTIMATE`): the draft used $200 x 0.25 = $50 target and $75 ceiling.
- **Phase 0 baseline, ~$7/day (~$200/month), approval through Jan 31:** a copy of the call campaign on the (253) 528-8152 tracker; DigiHammer's version is paused the day ours goes live. It needs only the phone tracker, so it can start before Roy's pixel work. First measured Meta CPBJ.
- **Feb 15 to Mar 31 angle test, ~$1,900:** $45/day (3 ad sets x $15), three angles, 2-3 ads each, broad across the service area, under Meta's $47/day cap. Ads go to Spencer for sign-off in early February. **Roy's pixel/CAPI/Lead-event work must be live and verified before this phase.**
- Later: spring scale up to $3,000/month only if CPBJ beats target and the techs have room. Through March the total is ~$2,500.
- **Program kill line:** if measured Meta CPBJ is above $300 after $1,500 of spend by Mar 31, stop Meta prospecting (keep retargeting and existing-customer ads) and move the money to Google/LSA.
- Why not test now: December prices are inflated by holiday retail, January has almost no new customers (last winter: Nov 56, Dec 30, Jan 6, Feb 14), and crews could not absorb a spike before February. Winter is for tracking, creative, the landing page and the customer list.

**Summary of the ask:** domain verification; pixel on every page; CAPI with dedup; qualified-only Lead plus `Contact`, with property-type and acreage fields; UTMs stored with the lead; CallRail swap on Meta traffic; a landing page to our brief; verify the Google call asset (253) 331-2772 and check the CallRail imports; and tell us which files changed and when. Any edits under `projects/briefs/website-rebuild-rebrand/site/` are reported to Roy and never deployed from here.


---

## Part 2: AI Video Bootcamp

On 2026-10-29 Spencer had us harvest the "AI Video Bootcamp" Skool course: 130 lessons, plus 40 video-only lessons we transcribed locally with Whisper. We digested it and built the `mkt-ai-video-ads` skill. This part covers what the course taught, how Got Moles adapts it, and what we reject. The course is a creator/agency course built around its own platform (PromptWise); parts are marketing for that platform and for viral accounts. The method underneath works with any tool. Where the course and our rules disagree, our rules win.

### 1. What the course taught

#### 1.1 Foundations and production philosophy

- **Process beats tool.** Strong output comes from a fixed sequence, not a secret model.
- **Define the outcome first.** Five gate questions: what am I making, where does it go, who is it for, what should it make them feel, what is the deliverable.
- **Think in chat before spending credits.** The LLM step is cheapest: ideation, scripts, prompts, diagnosis.
- **Images first, video second.** Lock composition, character, light and brand details in the still. A bad still becomes a worse video. Small flaws get edited; a wrong concept goes back to the prompt.
- **Volume and iteration.** Variation is cheap next to a shoot. Make many, pick the best.
- **Sound is quality.** Empty audio feels generated; layered ambience, effects and music feel produced.
- **A human stays in the loop.** Even the automated flow won't auto-run the expensive video step, so someone rejects bad stills first.
- **Six-step pipeline:** Idea, Chat, Image, Refine (including upscale before animating), Video, Edit and Post. Static ads skip video.
- **Aspect ratio is chosen at generation.** 9:16 Reels/TikTok/Shorts; 4:5 feed statics; 1:1 safe statics; 16:9 YouTube/web. One ratio per project.
- **Model categories are jobs, not rankings:** chat/LLM, image, video, voice/audio. Tool stack: PromptWise (hub, prompt library, Flows), CapCut, Canva, optional Midjourney, Pixabay for free SFX. Save every prompt that worked; the library is the long-term asset.
- **Cost habits:** chat first, images before video, diagnose instead of regenerating, test one node before a full flow, pick the ratio up front. The course gives no dollar prices, only relative cost.

**LLM discipline.** Give context, specify outcome, iterate, paste your own work for critique, and paste failures with a request to diagnose. Request formula: Context, Goal, Details, Output format. Master Prompt template: "I'm working on [what]. My goal is [outcome]. The audience is [who]. The style should be [tone, visuals, pacing, realism]. I want to avoid [x]. Help me by [task]. Format as [format]." Reusable follow-ups: more specific, less generic, 5 stronger versions, stronger hook, cut 30%, less corporate, explain what's weak, now make it a prompt, now convert to JSON.

**Starter prompt pack** (generic copywriting library). Ad-relevant: Ad Strategist (20 angles with hook, trigger, visual idea, why it works; rank top 5), UGC Scriptwriter (Hook, Relatable problem, Discovery, Benefit, Specific detail, CTA), Hook Writer (40 hooks across curiosity, pain, contrarian, benefit, story, funny, beginner, authority), Customer Research, plus Script Doctor, Brutally Honest Reviewer and Natural Voice Rewriter passes.

**Prompt fundamentals.** Six-part frame: Subject, Environment, Camera, Lighting, Mood, Style; a poor result means one is missing.
- Lighting: name source and direction ("small warm lamp left of frame"), never "cinematic lighting." Bad lighting causes the plastic look.
- "Masterpiece / hyper-detailed / ultra-glossy" push a fake polish; "realistic iPhone photo" often does more.
- Build as a ladder, one layer at a time. 35 sharp words beat 200 random ones.
- Diagnosis: generic = add specifics; fake = remove polish words, add imperfections; wrong light = name the source; boring = add shot size/angle; ignored detail = move it earlier; busy = cut.
- JSON prompting (subject, environment, camera, lighting, style, motion, mood, negatives) exposes gaps and makes prompts repeatable and scriptable.

#### 1.2 Image models and prompting technique

| Model | Strengths | Weaknesses | Use for |
|---|---|---|---|
| GPT Image 2.0/2.5 | Best language understanding and text rendering; strong avatars | Slower. Chained edits redraw the whole image (after 10 edits about 93% of untouched pixels had changed) | Sheets, lettering, labels, signage. End prompt with "photorealism" |
| Nano Banana Pro | Fast, realistic, multi-image fusion, multi-turn edits, holds a face in close-ups | May refuse many loose objects (workaround: label them on one Canva board and upload it) | Location plates, character stills, start frames |
| Ideogram 4.5 | Precise masked edits, up to 5 references, about 1% of untouched pixels changed | Not for first images | Surgical edits without drift |
| Midjourney | Stylized/concept art | Weak consistency | Optional |
| Canva | Background remover, Magic Eraser, Magic Expand, Magic Layers | Not a generator | Quick fixes, statics |

Rule: people go to GPT Image or Nano Banana Pro (test both); accurate text goes to GPT Image; repeated edits to Ideogram. Switching model is a legitimate fix. Explore cheap at 1 to 4 outputs, render winners at 4K. Re-read any "enhanced" prompt; it invents details.

**Prompt stack:** subject/action; setting (foreground, midground, background); outfit/props; camera (angle, size, lens, aperture); lighting (source, direction, hardness, temperature); mood/grade at the end (models weight the end); realism cues; negatives. A reference does nothing unless the prompt says what to keep (identity, outfit, product, or pose only). Have Claude/ChatGPT write the exact prompt from the references.

**Photorealism.**
- Three AI tells: airbrushed skin, studio lighting where none could exist, a perfect camera and backdrop. Fix: "shot on an iPhone 15, candid, natural framing."
- **Realism Lock** (append to any scene): authentic everyday photorealism, candid, natural ambient light appropriate to the setting, realistic skin and material texture, muted true-to-life colors, low contrast, slight phone-camera imperfection, lived-in details, imperfect composition, no beauty filter, no cinematic grading, no hyper-polished AI look.
- Lenses: 35mm natural, 50mm human-eye, 85mm faces. Natural daylight is the top realism phrase.
- iPhone UGC look: name the phone and lens, arm-extended perspective, thumb at frame edge, window glare, mild HDR, Kelvin values for mixed light. Specify skin flaws (pores, peach fuzz, redness, uneven tone) and room clutter. A specific hour, place and mess pushes the model off generic output.
- Reusable negatives: no cartoon, CGI, plastic skin, over-smoothing, glamour lighting, studio backdrop, fake bokeh, distorted face, extra fingers, warped eyes.
- Upscale before animating: "true ultra-realistic 4K, preserve composition, lighting and identity" adds real micro-detail.

**Light, depth and camera.** Ask where the light comes from, what it does, and whether it holds next shot. Hard light is dramatic; soft/overcast reassures. Side light carves, backlight separates, front light flattens; warm is alive, cool distant; red must be motivated; catchlights must match the source. Across shots keep source, lit side, warm/cool and shadow depth constant, with one lighting block pasted into every prompt. Always include a foreground element, a midground subject, a background, and something in the air (haze). Angle = where the viewer stands; shot size is information; 16-24mm immersive, telephoto flattens; f/1.4 only melts a background that is far behind. Camera bodies and style tags (35mm film, street photography, golden hour, drone, macro) are look shortcuts placed at the end. Use one film-look reference, not several.

**Character consistency.** Pick a simple persona; generate a first batch with no reference; reject plastic faces; choose a clean, naturally lit base (a bad reference means bad consistency); build a **character sheet** (six columns, full-body over matching close-up: front, 45 L, 90 L, 90 R, 45 R, back; orthographic, neutral background, never mirrored, no text; 16:9 in GPT Image); use it as the reference for every scene ("same woman + location + outfit + camera + lighting + expression"); test close-ups; harmonize color in Canva.

**Editing and product placement.** End every edit with "keep everything else exactly the same." Masked edits (Ideogram), Magic Eraser, multi-turn time/weather shifts, perspective changes. Product placement: person first, several product angles, LLM-written prompt, and type the label text with "must be exact and correctly spelled." Recreate a reference ad by naming what changes; never copy a real person's face. Static ads: viewers give 1 to 2 seconds, so a clean bold image is enough; upload your product plus a winning layout and ask for the same ad.

**Midjourney notes:** Raw mode for realism; character, style and prompt/composition references; `--cw 100`; `--no` negatives; Vary Subtle, Upscale Subtle, Editor.

**Prompt banks (17+ templates):** phone selfie, outdoor and car selfies, third-person candid "taken by a friend" (most transferable realism template), mirror selfie, podcast frame, documentary portrait (labelled blocks), freeze-frame, night flash, hero product, flat-lay with exact text, POV object story, iMessage screenshot, one-saturated-color editorial, macro, character follow-up, depth rewrite, color-grade tail. Import structure, not glamour. Concrete mundane detail beats adjectives; flaws are specified.

#### 1.3 Video models and motion prompting

Rule: ask what you are making, not which model is best.

| Model | Strengths | Limits |
|---|---|---|
| Seedance 2.0/2.5 | Top for talking people: lip-sync, acting, emotion, camera, action. Omni Reference up to 9 images, 3 videos, 3 audio clips (50 refs in the 2.5 short-film flow). Uploaded audio makes the character say exact lines | Most expensive. About 15 s per generation. Refused a mild "spill coffee" edit. Can over-smooth |
| Kling 3.0/4.0 | Cinematic B-roll, 15 s scenes, 2K-4K, obeys named camera moves, Elements (7 refs) fix face change on turns, multi-shot (min 3 s per shot), Motion Control | Weak avatars: lip-sync fails after about 10 s, robotic voice, glitchy endings |
| Veo 3.1 | Cheaper lip-sync, native voice | 8 s clips only. Voice drifts if the description changes. Quality barely beats Fast. Watermarked |
| Gemini Omni 1.1 | Second-best lip-sync, natural voices, best video-to-video editing, cheaper, syncs visuals to music | Edits can change unrequested things (drift); compare to the original |
| Grok Imagine 1.5 | Clean lip-sync | Robotic voice |

Lip-sync order: Seedance, Gemini Omni, Veo 3.1, then Kling/Grok. Cheap-first workflow: draft hooks in Omni or Veo Fast, rebuild the winner in Seedance. No model exceeds 15 to 30 s, so think shot by shot.

**Inputs.** Text-to-video for exploration. **Image-to-video for nearly everything commercial**: the image sets the scene, the prompt only the motion. Beginners re-describe the image; don't. Start frame locks the opening; end frame drives transitions and before/after but must feel connected to the start. Omni packs combine character, product, location, voice, in beat order. To extend: export a clip's last frame as the next start frame, and re-anchor to the master image every second or third hop.

**Prompt rules.** Say what happens, not what's visible. One subject action + one camera move + one scene. Decide each movement's start and end. Say "real time, normal speed, no slow motion" (models drift to slow motion). Start camera-heavy prompts with the angle. Dialogue in quotes, short; none in the last seconds on Kling.
- **Six-slot camera sentence:** Movement / Start / Speed / Framing / End / Time.
- **Kling shot block:** `Shot N (Ns): [type/angle] [subject] [action] / Details / Camera / Mood`.
- **Seedance timed sequence:** Style, Environment, Characters, Tone, then `0:00-0:03 (beat) Shot / action / SFX`. 15 s shape: 0-3 setup, 3-7 action, 7-12 escalation, 12-15 hero moment; SFX per beat.
- **Video realism lock:** image lock plus micro-shake, autofocus breathing, asymmetric smiles, "natural daylight only, no studio light."
- Templates: product ad from one hero frame, reference-pack ad, UGC selfie, motivated push-in, pull-out reveal, crane from character to world, foreground-occlusion transition (hides cuts), static lock, audio-synced edit, one-change edit, motion-control replacement.

**Camera moves** (each needs a start and end; one main move per shot; bigger face = simpler move):
- Stay put: static (add "hold the same framing" or it drifts), pan/tilt/whip pan (name a destination).
- Closer/further: dolly vs zoom (dolly travels, zoom is flat; say "camera fixed, optical zoom only"), slow zoom (safest for faces), crash zoom (land on eyes or object).
- Past: truck, slider (needs foreground), pedestal ("no tilt"), push past a foreground object.
- Around: arc (90-180 degrees holds identity), orbit (full circles melt faces), spiral (one turn).
- Tracking: from behind, reverse (most stable for faces), side, low (face never shown), vehicle, chase.
- Human camera: handheld (describe the operator, not "shakiness"), reactive snap zoom (strongest realism trick), snorricam.
- Air: crane, drone, fly-through (boundary must fully cross), FPV.
- Impossible: dolly zoom (needs depth), macro exit, probe lens, bullet time, gravity roll, infinite zoom.
Also 30 "framework" moves (F1-F30, e.g. focus-led, reaction-led push-in, motion-control timeline change for before/after) and a 30-move Kling list.

**Motion Control (Kling):** one character image + one reference video; the video gives movement, the image identity. Breaks when angles/settings differ (fix: pull the reference's first frame and have the image model swap the avatar in), when the reference is cluttered, or light is poor.

**Video editing (Omni vs Seedance):** Omni removed objects cleanly; both handled recolor, background swap, insertion, text and angle changes with drift. One change per pass; check face, hands, lips, clothes, background.

**Common fixes.** Not what you pictured: strong start frame. Face changes on turn: multi-angle references/Elements. Lip-sync drift: short early dialogue, Seedance/Omni. Voice changes between clips: paste a voice blueprint verbatim or run ElevenLabs Voice Changer. Rushed speech: fewer words, ellipses. Orbit melts face: quarter arc. Quality drop on upload: export 1080p/30.

**Voice and sound.**
- Treat a Veo voice as a locked asset: write a **voice blueprint** once ("light [accent], relaxed, medium pace") and paste it verbatim. An accent narrows the voice pool (2-3 per accent per gender), helping consistency. Default AI voices sound flat because every word has equal weight; use ellipses, commas, short lines.
- **Dialogue-to-duration rule:** too many words rush or cut off; too few produce gibberish. Our budget is about 2.3 words per second (about 34 words in 15 s).
- ElevenLabs: about 5,000 characters per generation; voices tab (Rachel neutral American, Adam deeper), sound-effects tab (4-5 s, type the exact sound, pick one of four), Voice Changer. Course settings: Stability 78, Similarity 75, Style 22, Speed 1.05 (voices "George" for clay, "Elise" for 2D).
- Sound goes last in the edit; closest sound loudest, ambience under it; stack many layers (one scene had 13). Voice informs, music emotes, effects make it physical.

**Assembly and realism pass.** CapCut: set ratio first, trim, layer, masks, Black Fade and Mix transitions, word-by-word captions, export 1080p/30. Hide cuts with occlusion/whip transitions and match cuts. **Remove the AI look:** raw output is too contrasty, saturated, stable and clean. Lower contrast first, lower saturation slightly, lift highlights slightly, add very subtle shake. Keep clip prompts simple (subject, one subtle motion, "muted colors"); result is proportional to edit time, not generation count.

#### 1.4 Ad strategy: awareness, frameworks, hooks, psychology

**Principles.** "Speed without strategy is noise." One audience, one dominant desire, one message. Sell the feeling. Don't open with a claim the viewer won't believe. Pick a framework first; each ad gets a backup for variant B. Test purposefully: what, which metric, what changes next. All course master prompts target Meta, 9:16.

**Five awareness levels (Schwartz).** 1 Unaware: interrupt the scroll. 2 Problem aware: name and validate the pain. 3 Solution aware (most of the audience): show why your mechanism wins. 4 Product aware: proof, objections, risk reversal. 5 Most aware: the right offer at the right time.

Three objectives: **awareness** (levels 1-2, cold: SPARK, Myth Killer, Raw Take, Educator, Pressure Cooker, Cliffhanger), **converting** (2-4: Countdown, Shortcut, Witness, Demo Drop, Time Machine, Face-Off, Bridge), **retargeting** (4-5: Conviction, Origin Story, Witness, Grit Ad). Biggest named mistake: converting ads to cold audiences ("proposing on the first date"). The desire says what to say; the framework says how.

**The 16 frameworks** (each has an acronym flow, template, example and 10-hook bank):
- Proof/momentum: SPARK (a shift is underway), Witness (testimonial cascade), Time Machine (before/after).
- Challenge: Myth Killer (expose the lie, evidence, enlist the viewer), Conviction (founder crushes an objection), Face-Off (versus).
- Pain/gap: Pressure Cooker (wound, ripple, failed attempts, new way, proof), Bridge (goal, block, bridge, proof), Shortcut (result without the pains).
- Curiosity/education: Cliffhanger (open loop, must be literally true), Countdown (3-5 mistakes), Educator (value-first; "highest-trust format"), Demo Drop.
- Native: Raw Take (begins like content, soft close), Origin Story, Grit Ad (a filter: simpler, cheaper-looking, opposite of competitors).
- Pairings: SPARK+Countdown, Myth Killer+Pressure Cooker, Origin+Conviction, Raw Take+Witness, Shortcut+Bridge, Cliffhanger+Demo Drop, Educator+SPARK.

**Ten psychology principles (Schwartz, *Breakthrough Advertising*).** Before writing: (1) mass desire (channel, don't create; six: health, attraction, status, belonging, control, comfort); (2) market sophistication (L1 state it, L2 bigger claim, L3 new mechanism, L4 better mechanism, L5 identity); (3) beliefs (accept, don't fight). Writing: (4) gradualization; (5) intensification (put them in the morning after); (6) identification; (7) redefinition (change the comparison); (8) mechanization (show how it works); (9) concentration (destroy alternatives). Producing: (10) camouflage (once it looks like an ad it's dead).

**Hooks.** First 1-3 seconds must create curiosity, trigger emotion or promise value; open on the sharpest line, never an intro. The library has about 40 formula hooks (curiosity, shock, value, story, engagement) plus a bank per framework. Format hook types: podcast = contrarian claim, reaction shot, expert correction; 2D = named character, social tension, visualized inner thought; clay = before/after in frame one, visibly suffering character, timer transformation. "Visual chaos" hooks (crash through a ceiling, then deadpan "I'm only AI") exist; we exclude them.

**Script skeleton:** 0-3 s hook; 3-10 problem/tension; 10-25 method/story; 25-40 proof/transformation; final beat one natural CTA. 15/30/45/60 s. Spoken English with contractions.

**Master prompt:** role line, format definition and rules, input block (brand, what it does, audience, stage, pains, outcome, proof, mechanism, offer, CTA, length, tone), the 16 frameworks, a 10-step process (angle; primary framework; backup; five hooks; pick one; timed script; shot blueprint; image/video prompt per scene; three variations: direct-response, organic, visually creative; "why this could work"), integrity rules (no fake proof, no invented stats, label assumptions).

**Static formats:** Offer Card, Golden Review, Editorial Callout, Notes Screenshot (static twin of Grit Ad), Side-by-Side. On Meta feed the winner is usually a photo with text below, like a friend's post.

**UGC patterns (10):** unboxing, testimonial, day in my life, problem-solution, before/after, GRWM, comparison, street interview, tutorial, story time. All use Hook, Body, soft first-person CTA with an honest-skepticism beat. Most are first-person claims of use, so they are unusable for AI people here.

#### 1.5 Ad formats

**Avatar/UGC (Seedance).** Character image + product photos, UGC master prompt, clips, stitch. Prompt clauses: preservation (exact shape/label), "real creator on a phone" feel, arc, banned influencer phrases ("game changer," "I'm obsessed"), must-haves (9:16, handheld, natural light, ambient SFX, no music/VO/text). Seedance caps near 15 s, so 30/45/60 s ads split into 15 s parts with different jobs (hook; product use; proof; payoff). B-roll variants: fast cut (cut every 1-2 s) or normal (5-6 shots). Samples used six hard jump cuts, `@image1 ... appearance ONLY` slots, "ONLY @image1 SPEAKS," acting blocks, strict negatives. PromptWise's "UGC Factory" automates this (Premium = Seedance; Standard = Veo 3.1 + Kling) with a per-clip word counter.

**Podcast ("overheard authority").** Viewer catches the best 20-40 s of an expert conversation. HOST asks and reacts, GUEST carries the insight, the product is the answer to "what do you use," not a sponsor read; open mid-conversation. Spec: Seedance, 1080p, 9:16, audio on; sample = five 15 s shots + 6 s product shot. Per-shot template: continuity header, an identical setting block every shot (softbox light, same sofa/mics, room tone, no music), locked characters, skin/realism clause, pacing (words per shot; "hold a silent beat, never slow the speech"), audio under cutaways, gesture logic, 12-14 cuts per 15 s (CAM-A host, CAM-B guest, CAM-C reactions, wide), verbatim dialogue with voice casting, negatives. Use a real packshot, never an AI product.

**2D animation.** Relatability: a named character stuck in a relatable problem. Inside the problem from frame one; pain through action; expressive faces; simple world; the product changes the day. Characters as 7-panel collages at 4K with a style anchor ("hand-painted, gouache brushwork... NOT a photograph, 3D render or Pixar"). Video prompts: repeated style header, BASELINE emotion line, scenes with lens/f-stop, explicit TRANSITION per cut (match cut, whip-pan; never dissolve), SOUND line with "NO MUSIC." Lip-sync is often skipped (stylized mouths); cut to other angles when not speaking.

**Claymation.** Charm and pattern interrupt among talking heads. One clay world, extremely simple story (problem, struggle, product as the turn, result), imperfection as the asset (fingerprints, seams, jitter), first frame stops the scroll. 3x2 character sheets ("SAME CHARACTER, only the costume changes," "NO goofy expressions"). Six clips of 13-15 s, each with a repeated style paragraph ("ABSOLUTELY NOT Pixar CGI"), "SINGLE CHARACTER @X" tags, effects kept off the skin, final packshot held static 2 s. Seedance standard, 720p for tests.

**Cinematic spot (Nike, car, GTA walkthroughs).** Stills-first: customer profile, LLM shot list, image prompts that repeat the key subject, pick frames by matching tone (harmonize in Canva), upscale, animate with minimal prompts ("muted colors, subtle motion at the end"), VO in ElevenLabs. In CapCut add transitions after order is final, speed-ramp, flash-cut stills, 2-3 SFX layers per scene, transparent-logo end card. The 20 s car spot sold feeling, not features. Filter: "would a different brand do this ad?" Add numbers/text after animating (models glitch digits). Veo annotated-image trick: a still with written notes, and Veo performs them. The course's own strategy says polish converts worse than native-looking content, so this is a brand-film option, not the engine.

**Seedance short-film consistency method.** "Never let the model invent anything." Character passport sheet (CHARACTER + WARDROBE slots; decide once on hats/glasses, since on-then-off breaks a film fastest; models make everyone slimmer and taller); a **LOOK block** (stock, time, sun, light color, grain, what to avoid) pasted word for word into every prompt; location master plates and "rotate the camera in place" views; object passports (six orthographic views, five macro details). Ten-part shot prompt: stock/look; scene; reference slots; strict headcount; camera; staging; timed action with exact lines; who speaks; acting; SFX and strict negatives. Chain shots by passing the previous shot's frame as "exact starting frame, light and location continuity only."

#### 1.6 Advanced flows

- **Flows:** node canvas (image, video, audio, prompt, upscale, background-remove, storyboard, galleries). Outputs feed inputs; Run Flow executes in dependency order; run one node to test; cost shown first. A working flow is a template; swapping inputs is the batch primitive.
- **Image node:** up to 8 references; runs add to a carousel. Actions: Animate, Remove Background, Variations (same concept), Angles (new camera angles), Edit, Rerun. **Video node:** text/start/end/Omni; "Generate prompt for me" reads the image. **Prompt node:** edit once, all linked nodes update. **Storyboard node:** continuation scenes. **Gallery:** reference bank plus Animate All.
- **Magic Flow:** concept + scene count + ratio + references builds the canvas, runs images, leaves videos unrun for approval.
- **"Ad in under 10 minutes":** avatar + product + one prompt, 8 scenes, review stills, run videos, Angles and Storyboard on the best frames, Animate All with Kling, music, CapCut. Cost is review and edit time.
- **Batching variants:** keep brief/hook/script in a Prompt node and swap one input per variant (hook, location, season, character, ratio, model, music).
- **PromptWise MCP** (`https://app.promptwise.com/mcp`) lets Claude/ChatGPT generate media using the user's credits. Add as a custom connector. State model, ratio and resolution in the prompt or it guesses; references must be re-dragged into the video uploader; approve the exact prompt before it runs because credits burn on mismatches. No REST API or flow export is documented.
- **Live-call scraps:** research competitors in the Meta Ad Library first; test a few ads at about $5-10 a day each and improve one thing per round; keep a prompt library; platform guardrails stack on model guardrails, don't route around them; tell clients the work is AI.

#### 1.7 Social, virality and filmmaking

The goal is viral AI-content accounts, then agency sales. Every concrete rule is for TikTok.
- **Platforms:** TikTok = discovery, short shelf life; Reels = slower, reliably reaches followers; YouTube = slowest, evergreen. Cross-post everything (about 5 minutes per extra platform).
- **TikTok rules:** one fixed post time, 3-5 posts a day, 1-2 hours apart, four hashtags max, export 1080p/30, no copyrighted audio over 60 s, no off-niche posts. Unverified folklore: never use Promote, never delete videos, warm new accounts 7 days.
- **Upload:** tick TikTok's AI-content toggle, Instagram's AI label, YouTube "Altered content = Yes" and "not made for kids." The author says labels don't affect reach.
- **Retention:** first clip under 3 s; watch time is the key metric; on-screen text keeps people reading; consistent covers.
- **Honest engagement:** reply to every comment (with a question), spend the first hour after posting replying, engage niche content daily, real friends commenting.
- **Niche lane:** anthropomorphic animals, fusions, sea monsters, POV, "brainrot" characters. Transferable mechanics only: idea batching, reference-first generation, start/end-frame morphs, split-screen masks, one prompt skeleton with one variable swapped.
- **Mindset:** Builder (volume, expect 10-50 low-traction posts), Experimenter (test hooks and formats against drop-off data), Operator (calendar, workflow).
- **Filmmaking:** hook in 2 s, conflict in the middle, close the loop. Draft in few LLM messages, then ask for a spoken-VO version. Shot-list prompt: "Turn this script into a cinematic shot list. Break each of N scenes into 2 camera angles. For each give angle, movement, emotional tone and a matching image prompt." Revise by shot number. Wide aerial = small and lost; close-up = inside the head; slow pan builds tension; handheld = raw. Per scene: image prompt, still, camera prompt into the video model, assemble. Later tool notes: Gemini Omni/Seedance replace Hedra for lip-sync; Kling 3.0 for movement.

#### 1.8 Cloning and voice

- **HeyGen visual clone:** 2-3 minutes of 1080p footage, tripod, soft even light, solid background, contrasting solid top, HDR off, look down the lens, gestures modest and below the chest (big repeated gestures get overused). The cloned person does the on-screen identity verification, a built-in consent gate. Free tier = 3 videos a month; Creator is the minimum for one owner clone.
- **Voice:** ElevenLabs links to HeyGen by API key. Professional Voice Clone needs 30+ minutes of clean speech (instant clone is lower quality). HeyGen settings quoted: Multilingual v2, similarity 75, stability 65-70, style 0.12, speaker boost.
- **Render rules:** segments of four lines or fewer; preview audio first (remove commas for odd pauses); Avatar IV is more realistic but credit-limited, III is unlimited; never post the raw render.
- **Look changes:** edit a frame with Nano Banana Pro, one change per prompt, studio lighting only. A recorded video avatar beats a photo avatar. Photo lip-sync via HeyGen, or Veo 3.1 (more movement, 8 s limit).
- **Quality tips:** never leave a clone talking alone for a minute; lay B-roll over weak sections with the audio running (also hides lip-sync glitches and joins between 8 s Veo clips); write for the ear; 1.1-1.2x speed if slow; when the speaker mentions a thing, show it.
- **Script multiplication:** one idea into five tones; 3 hooks x 2 pacings x 2 tones x 2 CTAs = 12 variants by regenerating only the first 2 seconds or the end. Save a master persona system prompt. Treat ChatGPT as a creative director: ask for angles, not "a script."
- **Course uses:** daily shorts, ad variants and fatigue refreshes, FAQ/objection clips, intros, localization, funnel greeters.
- **Omitted:** any consent checklist or disclosure guidance. It says brands "don't really care about authenticity" and that with B-roll "no one will be able to tell it's fake." We reject that.

### 2. How Got Moles adapts it

The skill (`.claude/skills/mkt-ai-video-ads/`) makes creative and stops. It never spends, uploads to an ad account, or posts. Spencer approves every ad. `mkt-cmo` decides spend and placement, judged on cost per booked job, never cost per lead alone.

#### 2.1 The AI ad gate (overrides the course)

Every ad passes this gate and a filled `gate.md` before Spencer sees it. It sits on top of the marketing seat's shared claims gate.

**Claims.** No I-713 claims. No "WA's #1," best or largest. "15+ years" is Spencer's personal experience; the company was founded in 2017. Re-measure the review count before every new use and never state the total as a five-star count. No client count until a known conflict in the claims gate is resolved. Prices only from the published residential tiers; commercial and over-5-acre properties sell the visit, never a price. Lead with "chemical-free, safe for pets and kids"; trapping is the method, not the identity. Dead moles go double-bagged into the customer's garbage can; never show or say "hauled away." US English and an American accent on every voice.

**Posture A applies to the picture too.** Paid ads never name the mechanism and never show it, in any frame, style (photoreal, 2D, clay, cartoon) or sound effect.
- No traps, trap-setting, probes beside a trap, or tool kits that read as traps. No dead, injured or suffering mole. No "snap" SFX, no comic violence toward the mole.
- A cartoon or clay mole is fine as a cheeky character (popping up, smug, packing a suitcase, outsmarted). The story is the tech solving the problem and the lawn recovering, never the mole being harmed.
- No chaos or injury hooks (falling, crashing). The course rewards them; we don't.
- Banned in VO, captions and on-screen text: kill, lethal, body-gripping, scissor, harpoon, spike, poison, bait, exterminate, eradicate.
- **Homograph check:** "mole" also means a skin mole. Nothing in an image, caption or hook may read as skin, dermatology or medical. Write "moles in your lawn/yard," not "get rid of moles."

**AI people and honesty (FTC endorsement rules, platform AI policies).**

| Allowed | Never |
|---|---|
| An AI presenter clearly framed as a brand spokesperson explaining things | An AI person speaking as a customer ("We had moles for years until...") |
| Spencer or a real tech cloned with written consent, saying what they'd say | Cloning anyone without written consent on file |
| Real reviews, verbatim, first name and town as published | Invented or AI-voiced reviews; a made-up testimonial cascade |
| A podcast expert labelled honestly ("mole-control specialist" = the real team) | A fake doctor, fake credential, or expert who isn't on the team |
| Claymation, 2D or obviously stylized characters, including fictional homeowners | Photoreal "hidden camera" or "not an ad" hooks posing as real customer footage |
| Real before/after lawn photos from our jobs | AI before/after presented as a real customer's yard |

- **Disclosure:** photoreal AI people get a visible "AI-generated" label in the caption or on screen. Tick the platform AI-content disclosure when offered. Clone ads carry a plain line ("AI-assisted video of Spencer, from his own script"). Check Meta's and Google's current policy before the first spend on a photoreal AI person.
- No invented statistics; if a course template wants proof we lack, delete the line. No competitor names, third-party brands or celebrities in prompts or frames (the course names real brands and franchises to pull a look; we use generic descriptors).
- No fake engagement: no second accounts arguing, no planted errors, no filters hiding "this is AI" comments.

**Pre-ship checklist (one line each in `gate.md`):** claims gate cleared; no mechanism in words, frames or SFX, homograph-safe; every person is a consenting real person, a labelled AI spokesperson or an obviously stylized character; every number traced to a dated source or removed; logo, colors and van/uniform match the passports, no warped text; lip-sync, hands and identity drift checked shot by shot; US English and accent; AI disclosure decided; spend and launch are Spencer's call.

#### 2.2 Best-fit formats

| Format | Fit | Why |
|---|---|---|
| Podcast expert clip (Myth Killer / Educator) | High | Busts DIY myths (castor oil, sonic spikes, poison); expertise is our differentiator |
| Claymation | High | Charming, obviously stylized, no animal-harm risk, can't be mistaken for a testimonial |
| 2D named-homeowner story | High | Relatable and obviously fictional ("This is Dana. Every morning Dana counts the new hills.") |
| Presenter / consented clone of Spencer or a tech | Medium-High | "3 signs it's moles, not voles." Never a customer voice |
| Cinematic hero spot | Medium | One or two brand films, not volume |
| B-roll fast cut + VO | Medium | Best with real job footage plus a few AI inserts |
| Static image ads | Medium | No text in frame; headline and logo added in the edit |
| Fake-customer avatar UGC | Never | FTC endorsement risk |

Default when Spencer is silent: cold Meta Reels, 15 s, podcast or claymation. Example ideas: a podcast where the host asks "Wait, castor oil doesn't work?" and the expert explains moles travel in tunnels and eat earthworms, so you find the active runs; "Why do moles keep coming back?" (monitoring, no prices); claymation "Tiny Yard Rescue" (sad clay homeowner, smug clay mole, calm clay tech, smooth lawn, dog and kid, "Chemical-free. Safe for pets and kids."). Funnel map: unaware = odd-ridge hook ("What's making these lines in your lawn?"); solution-aware = podcast Myth Killer; product-aware = real reviews only; most-aware = seasonal retargeting with a real tech clip. Frameworks used freely: Educator, Myth Killer, Pressure Cooker, Bridge, Shortcut, Conviction (Spencer on camera), Raw Take. Restricted: Witness (real reviews only), Face-Off (fair, verifiable), Cliffhanger (literally true), Time Machine (real jobs, owner permission). Seasonal hooks (fall rains, spring green-up) are inferred from regional knowledge and need checking against call and job data.

#### 2.3 Passports and the PNW look block

Every recurring person, object and place gets a "passport": the same text in every prompt plus the same reference image. Real photos beat descriptions.

**Look block (every photoreal prompt):** Western Washington suburb in the Puget Sound area, soft overcast Pacific Northwest daylight, diffused light with no harsh shadows, damp deep-green lawn, Douglas firs and cedars in the background, wet pavement sheen, natural muted color grade, realistic smartphone or documentary camera, slight handheld movement, real textures, no teal-orange grade, no studio lighting. Variants: fall (wet leaves, low gray sky, early dusk), spring (bright-green growth, sun breaks), winter (frost, bare maples).

**Brand colors:** Grass `#184241`, Blue `#182034`, Cream `#FFF1D9`, Gold `#E68C04` (CTA), Rust `#8F2A2D`. End cards: Grass background, Cream text, Gold CTA button; the Cream logo (variant 02) is the default because variant 01 nearly vanishes on Grass. **A video model never renders the logo**; the real PNG is composited in the edit.

**Passports.**
- *Technician (an assumption to confirm):* friendly man in his 30s, short beard, dark forest-green polo with a small cream chest patch (left blank, logo added in the edit), tan pants, waterproof boots, ball cap, kneels to read the ground, never holds or sets a trap. Preference: real photos of Spencer, Cory, Alias, Robert, Luke or Tavis with written consent; then Spencer's consented clone; then the generic tech as a labelled AI spokesperson.
- *Spencer (consent on file only):* owner, Army veteran (2011-2014), started in his own Buckley/Enumclaw yard. "Veteran-owned" is true and safe to lead with.
- *Homeowner:* fictional and stylized where possible, named in 2D/clay. In photoreal they only react or enjoy the lawn, never testify.
- *Family dog:* golden retriever or lab on a smooth lawn, the "safe for pets" visual; never near a mole or tunnel.
- *Van:* UNKNOWN. Keep out of frame or use an unbranded dark-green pickup and add branding in the edit.
- *Lawn before:* ridges and volcano-shaped mounds of fresh dark soil 8-12 inches wide, no visible entry hole (holes read gopher or vole). Describe it explicitly or models draw gopher fans or anthills. *Lawn after:* same lawn and angle, mounds raked flat, dog and kids running, evening light.
- *Clay mole:* small, round, velvety dark-gray plasticine, oversized pink paddle hands, tiny pink nose, squinting eyes, smug grin, fingerprint texture. Cheeky, never harmed. *2D style:* flat-color editorial illustration, thick clean outlines, palette from Grass/Cream/Gold, PNW suburb.

**Prefilled master prompt.** Claude runs the course brief itself with Got Moles fields set: homeowners 35-70 in Puget Sound suburbs, pet owners, parents; pains (mounds, failed DIY repellents, poison worries near dogs and kids, embarrassment, tripping); viewer-facing mechanism "we find the active tunnels and work them until the activity stops; no poison, no chemicals" (never the device); CTA "Call or text Got Moles"; about 2.3 words per second; test metric cost per booked job.

#### 2.4 The pipeline we run

1. **Brief** (three questions or fewer): goal and placement, format, real assets.
2. **Strategy:** angle, awareness level, primary and backup framework, five hooks, one pick, in `plan.md`.
3. **Script and shot list**, each shot marked AI, real footage or card. **Spencer sees hook, script and shot list before anything is generated.**
4. **Start frames, Nano Banana Pro:** passport + look block + shot prompt, real photos as `--ref`. Regenerate if it looks AI or any text or logo renders.
5. **Clips, Veo 3.1:** image-to-video, one shot per call, motion-only prompts, 8 s max, native ambient audio and dialogue. Always `--dry` first; **Spencer gets the batch cost and says yes before the first paid run.** Seedance/Kling (cross-shot consistency, 15 s clips, clay and 2D) only through a PromptWise account; otherwise stay on Veo.
6. **Voice, ElevenLabs:** American voice, course settings (Stability 78, Similarity 75, Style 22, Speed 1.05). Skip when Veo's native dialogue is the point (podcast).
7. **Assembly, ffmpeg:** `assemble.mjs` normalizes clips to 1080x1920/30 fps, lays the VO with clip audio ducked, appends the branded end card (Grass, Cream logo, Gold CTA). Captions are burned afterward (most viewers watch muted). A light realism pass (lower contrast, muted grade).
8. **Variants:** hook-swap, one variable each, named `-A/-B/-C`, logged in `plan.md`.
9. **Gate and hand-off:** `gate.md` filled, Spencer approves, spend goes to `mkt-cmo`.

Output: `projects/mkt-ai-video-ads/{date}_{slug}/` with `plan.md`, `gate.md`, `frames/`, `clips/`, `audio/`, `final/`. Static ads use `gen-image.mjs` at 4:5 and 9:16 with no text in frame; headline and logo are added in an editor.

#### 2.5 Course tactics we reject

- Fake-customer avatars, testimonial-style selfies, the Witness cascade, any AI voice saying "I used this for six months." Fake authority ("doctor," non-existent expert).
- "I'm only AI" reveals and "not an ad" hooks.
- Chaos, injury and destruction hooks; any depiction of harm to an animal, even in clay or 2D.
- Hiding AI use: skipping the label, filtering "this is AI" comments, "no one will be able to tell."
- Manufactured engagement: second-account arguments, planted factual errors, seeded comment rings.
- Cloning without written consent, or cloning a customer, employee, competitor or public figure; voice clones on a phone line posing as a live person.
- Invented statistics ("63% lo-fi advantage," "93% see results," "10 million views"); treat every course number as unverified. Rigged Face-Off tests and staged street interviews. Fake urgency (seasonal booking capacity is real; invented deadlines are not).
- Real brands, franchises or celebrities in prompts; ripping copyrighted music for a paid ad (licensed or generated only); platform-evasion tricks and TikTok folklore.
- The viral AI-niche lane, which builds audiences with no purchase intent. Posting 3-5 times a day; our target is 3-4 shorts a week at a fixed time.
- Hard-sell converting ads to cold audiences.

#### 2.6 Organic series ideas

One script, multiplied across platforms: "Mole or vole?"; "Myth Monday" (gum, castor oil, sonic spikes, poison); "What I'm seeing in [city] this week" (real, current observations only); "Reading the yard" (fresh sign vs old crusted mounds); "Ask Spencer" shorts (price tiers by acreage, time to results, the no-catch guarantee, dog safety; commercial and over-5-acre go to an in-person bid with Cory); an objection library; a 30-second veteran origin film shot for real. A cloned Spencer handles explaining beats only, cut over real B-roll, never more than a few seconds alone, with a disclosure line.

### Status and open items

- **No image or video has been generated yet.** The Gemini prepay credits were depleted. `gen-image.mjs` reached the API and `gemini-3-pro-image` was accepted (HTTP 402, not 404). Top up at ai.studio/projects before the first run. `gen-video.mjs` and `gen-voice.mjs` have not run live. `assemble.mjs` was tested end to end on synthetic clips (1080x1920, VO ducking, end card).
- **Technician uniform and van look are unconfirmed.** The technician passport is an assumption; the van is UNKNOWN until Spencer supplies a photo.
- **Real photos are needed for the passports:** technicians (with written consent), Spencer, the van, real lawn before/after shots.
- **A PromptWise account is needed for Seedance and Kling.** Without one we stay on Veo 3.1. The course gives no prices, so budgets can't be planned until we see real credit costs. The PromptWise MCP is untested.
- **Clone prerequisites unmet:** Spencer's written consent, a HeyGen plan (Creator minimum), a clean 2-3 minute recording, 30+ minutes of clean speech for a professional ElevenLabs clone. Meta and Google AI-disclosure rules need a fresh check before any photoreal AI person runs.
- **Scope:** the skill only makes creative. It never spends, uploads to an ad account, or posts, and no cron may spend, publish or send. Spend and placement go to `mkt-cmo`.
- Spencer may cancel the Skool membership, so the raw corpus (gitignored, with transcripts of the 40 video-only lessons) can't be re-pulled.

### What this means for Roy

Little direct site work. The skill makes social and paid video and static creative; it doesn't touch site code, schema or deploys, which stay with you.

What may reach you:
- **Landing pages the ads point at.** The page has to match the ad's promise and carry the same claims. We'll brief you rather than edit site code, and any tracking or call-button changes on those pages are your lane.
- **The claims rules apply site-wide:** no I-713 claims, no "WA's #1," "15+ years" clarified as Spencer's personal experience, no "hauled away," a currently measured review count, lead with "chemical-free and safe mole control," no mechanism language. Worth a pass on any page an ad lands on.
- **Video on site pages.** If an approved ad should live on a page, we'll hand you the file and its AI-disclosure line.
- **Real photography.** Technician and before/after photos would improve both the ads and probably the site.

Nothing needs action from you until Spencer approves a first ad.


---

## Part 3: HSA Starter Program (Steve Hunsaker)

On 2026-10-29 Spencer had us harvest the "HSA Starter Program" Skool course (Steve Hunsaker, home-service coach): 93 lessons, 14 courses. He then cancelled it. Our assessment: it targets businesses under $15K/month. Steve's trades are Christmas lights, junk removal and pressure washing, with larger one-off tickets than a $100-150/month mole plan. No new skill was built. What transfers went into `.claude/skills/mkt-cmo/references/local-growth-playbook.md`. Digests: `projects/briefs/hsa-starter/digest/` (A marketing, B lead handling/CRM, C coaching calls). Raw transcripts are gitignored.

All course statistics below are as Steve states them, self-reported by a coach selling a paid tier, and **unverified**. We use his methods, not his numbers, as targets. Playbook tags: `KNOWN` (live data), `ESTIMATE` (planning number), `UNKNOWN`.

### What the course teaches

#### The HSA cycle ("building a fire")
1. **Fire pit:** look credible everywhere (Google Maps, website, Facebook/IG, Nextdoor). Free.
2. **Logs:** organic neighborhood tactics plus Google reviews. Every job is the marketing event; turn 1 job into 2-3 via neighbors.
3. **Gasoline:** Facebook ads, optionally Local Services Ads (LSA).
4. **Measure:** speed to lead and close rate (per 10 quotes in 30 days, how many yes). If healthy, raise all prices 5%, re-measure a month, repeat until close rate drops.
5. **Nurture:** email everyone who got a quote; review automation for stragglers.

Touch-point stack per job: branded vehicle, visible work, A-frame, door hangers, location-tied Google reviews, a neighborhood Facebook-group post by a champion customer, gift cards. Steve: do all of them every job. Claimed: reviews from about 4 of 5 customers, photo reviews about 1 of 5.

#### Yard signs
- **Unbranded "public" signs:** service on top, phone at bottom, one color, no brand, so complaints and one-star reviews cannot attach (Steve: about 1 in 10 calls is an angry neighbor). Phone is a free Google Voice number on a personal account. Vendor Dope Marketing (HSA page): 100 one-color 18x24 signs with stakes $315, 500 for $1,575. Place where cars are stopped (exits, stop signs, store and gas station entrances); he concedes they get pulled, so "drip" them out. Calls add: 150 in a first month, about $4 each, about half gone by day 2; $300 of signs returned $1,800-1,900.
- **Branded customer-yard signs:** service, brand, phone plus QR, 18x24, 24-inch stakes, roughly $4.34-7.45 each (price transcript garbled); Canva or Fiverr ($10-55). Script: "Want $10 or $15 off your invoice? I'll give you that if I can put this sign in your yard until the next time you mow." Steve claims about 90% yes (calls say 3 of 4).
- **QR:** point at the quote page, not the homepage; generate once and reuse.
- **Targeting:** USPS EDDM tool, Table view sorted by household income, routes at $100K+, same ZIPs for ad geo-targeting.

#### A-frames
UZ Marketing, 24x36, same design both sides, buy two. Brand-color background, logo, "[service] in progress", bottom half is phone, website, QR to quote page, "Ask us for a free quote". Placed 2 feet in front of the truck and 2 feet out, half into the roadway "so traffic slows", second one behind. Pitch: looks like a "men at work" sign but invites neighbors to talk. Steve claims Pro members get 3-5+ jobs a week and rates it above a wrap. Tracking is QR scans only.

#### Door hangers
- 15 hangers to the nearest 15 neighbors per job, built into the SOP or don't start. His math: 18 jobs/week x 15 = about 1,080/month. Claimed 2-3% return; many calls come weeks later; 5 months compounds to 5,000 homes holding your piece. Door-knocking first is optional (he never did).
- Content: brand, contact, free-quote invitation, expiring offer. Print "offer expires by ____" and hand-write the date. Back: handwritten note ("I was just doing a roof down the road and wanted to introduce myself").
- Cost: UZ Marketing 1,000 for $210; or Canva (about $9/month) or Fiverr (insist on the editable file). One member closed a $2,576 quote from a hanger left a month earlier. No dedicated tracking taught.

#### Gift card referral
At completion hand the customer 3 branded $100-off "gift cards" with an end date, with the customer's name handwritten ("gifted by ____"). Each redemption on a booked job earns the original customer a real reward ($50-100 steakhouse card for his $3,300 ticket; coffee or fast-food cards, or a local collaboration, for lower tickets). Rules: named person cannot use their own card; match by written name; give more only after one of the first three redeems ("never hand out ten"); pay rewards weekly. Cost only on a booked job. Assets: Canva template, glossy FAQ sheet ("What are these cards? What's in it for me? How do you track redemptions? Can I have more?"), 250-500 at about $0.37.

#### Branded truck and uniform
A branding play: a prospect sees the brand 4-6 times in a day. Show the tech's face and uniform. A-frame is the "instant action" counterpart. Train techs to do small unrequested things (drag trash bins up) and say so (reciprocity).

#### Facebook/IG and Google Business lessons
- **Facebook/IG starter lesson (mechanics only; Steve holds real strategy for the paid PRO tier):** Ads Manager, objective Leads, manual campaign, one ad set, instant forms or a dedicated landing page (never the homepage), city plus 10 miles, original audience not Advantage+, min age 30, ChatGPT-drafted copy, Meta's AI text variations off, one change per test, form fields name/email/phone, "call now" button. Calls add: $10/day cannot exit learning, $30-50/day to start; 3+ creatives; an address field made cost per lead 4x; rich-ZIP narrowing doubled CPL but jobs were $15-20K; kill if no lead for $100 after 4-5 days; pre-qualify in copy; mid-2025 still-image CPMs ran a third to half of video; cost per lead is a vanity number; judge recurring plans on month-3 payback; 5x return on spend is good; Christmas season $12K spend returned about $130K; a $1,000/month agency retainer on $1,500 of spend is 40% sunk cost.
- **Google Business Profile (Steve's highest-rated free channel):** claims 145 calls and 970 site visits in two months (about $91.8K revenue) and, elsewhere, 145 Q4 calls and about $120K. Name exactly as on state/IRS documents; a listing with a pin outranks service-area-only; Regus virtual mailbox suggested (about $250-300/month; some got suspended). Levers: review volume and recency, replying to every review, photo reviews (strongest; 4 of 14 photo reviews took a new brand to top 1-3 in a month), keywords in services/Q&A, about 15 photo reviews, link socials, answer Q&A. Review capture: NFC tap cards in person (claimed 4-5x text automation: about 5 vs 25 reviews/month; a window cleaner got 240 in 6 months); selfie with customer and truck; about 1 in 5-8 reviews carries a photo. Rank check: SEMrush Local Map Rank Tracker, 9x9 or 11x11 grid, 10-15 miles, monthly, about $10/month. Risk: his junk-removal listing was banned and 30% of revenue vanished overnight. He also mentions a $5 coffee card for a review and $5 to a tech named in a review; both conflict with policy (rejected below).
- **LSA and Yelp:** LSA is pay per call; messaging off; manual bidding; direct business search on. Junk removal in Phoenix cost $120-180 per job, so he shut it off; works or fails by trade. Yelp: claim it, get 5-10 reviews, don't advertise.
- **Nextdoor:** named only as a "fire pit" credibility profile. The digests contain no Nextdoor lesson.

### Speed to lead and the lead sequence

Steve: speed to lead is "the singularly most important thing." Unverified claims: 78% buy from the first responder; 8x conversion in the first 5 minutes; only 30% of companies respond within an hour; an unnamed Harvard Business Review study at "391%"; close rate +15-20%. Rule: call back, don't text back.

**Sequence (SnipeyLead, a HighLevel white-label):**
1. Form creates a lead tagged by source; email alert to owner.
2. Business-hours gate (example 7 AM-8 PM). Text alert, then about 1 minute later a call: "You have a new lead, press any key to connect," which dials the lead so a human answers live.
3. No answer: pre-recorded voicemail drop, then auto text. Voicemail: "Hey, this is the team over at X. We just saw you submitted a form on our site, and we're going to shoot you a text right after this voicemail. Feel free to call me back directly on this number or reply to the text and we'll get you started." Text: "Hey [first name], this is Jack with X. We left you a voicemail as well. Please feel free to reach back out at your earliest convenience and we'll get you started on your quote."
4. No reply: text 2 at about 12 hours ("still want to get this done?"), text 3 about 24 hours later ("keep me posted"). Lessons vary (1 h then 26 h). Cap at 4-5 touches or "you get blocked." Any reply or answered call exits the sequence and moves the card to "Hot inbound."
5. After hours: no call or voicemail; instant text "we just saw your form come in after business hours... How does your schedule look after 9 AM to chat?"
6. Missed-call text-back: "Hey, this is [business]. I saw we just missed your call. How can I help you?" Default 10-20 second ring timeouts push calls to voicemail.
7. Day-30 text to never-reached leads: "You reached out on one of our ads. Is this something you want right now, or should I stop bothering you?" About 10 replies from 50, about 3 interested. Longer 30-45 day blast ("I'm going to cross this off my list...") claimed 10-15 replies from 143.
8. **Open-appointment winback text** (from a mobile dog groomer): "We'll be in your area next Wednesday May 14, arrival window 12:15-2:15, want to book this spot?" plus an expiring incentive. 3-10 replies per 100; split by ZIP so responders cluster. Jobs from your own list earn about 20% more margin than ad-sourced ones at 5x.

Tuning problems from support calls: messages fired after the owner already spoke to the lead, 10 PM texts, booked customers still receiving "still interested?" texts. Fixes: wait steps, business-hours branches, remove on reply, test with a `name+test@gmail.com` address. Conversation AI looped and "got spammy."

### Nurture, reviews and referrals
- **Nurture:** one value email a week for two years (12 monthly folders of about 8 emails, year-one/year-two). Warm contacts only; no scraped lists. Drip bulk adds (50 per 30 minutes; one user had about 200 emails flagged as spam); filter "DND not enabled." Monthly email or text to the whole database. Invoice reminders: day 5, up to 4, then alert the owner.
- **Reviews:** trigger on "Job completed," wait about 3 days, email plus one text with a rating form; 4-5 stars go to Google, 1-3 to a private form. That is review gating, which Google prohibits; not adopted.
- **Referrals:** only after a 4-5 star rating; thank-you email, text 3 minutes later, referral email a day later; referred person gets automated outreach naming the referrer. No reward taught in the CRM lessons; the coaching calls say reward the next service free when lifetime value is high. Don't ask realtors for referrals; offer them leads.
- **Neighbor mailer:** Dope Marketing mails the nearest 10-20 houses after each scheduled job (cost not quoted). His EDDM test (25,000 postcards, about $6K) returned under $5K.

### CRM, Jobber and SnipeyLead/HighLevel (method yes, tool no)
- Jobber habits: save every caller as a client at first contact; lead-source field; stages Quote, Approved, Job, schedule, complete, invoice, payment; reminders; map view of unscheduled jobs; dollar values on open quotes; send only qualified leads in.
- SnipeyLead beside Jobber: the form posts to both; SnipeyLead handles nurture, Jobber handles quote/schedule/pay (instructor: Jobber nurtures poorly). Sync via Zapier, matching stages; quotes from Jobber go out on a different number.
- Pipeline: Lead, Hot inbound, Made contact, Estimate scheduled, Quote sent, Won/Lost, "Ghosted."
- Source-tag loss: forwarding CallRail numbers into a CRM phone system drops the source tag. His pool-company example uses one tracking number per location, listing and truck (about $5/month each).
- Facebook lead-ad hookup: map each form question; leads sit unmapped in Meta; the connection silently expires about every 90 days.
- A2P 10DLC registration is required to text; the support lead's thin "A2P funnel" page is a shortcut.
- Instructor claims, unverified: 25-35% more sales from speed to lead plus nurture; a $5,000 job closed on the 4th automated touch.

### Coaching-call lessons
- **Commercial:** 5-10 gift drops a week (donuts, about $8); little for 2 weeks, then a random inbound call citing a drop; at 1 a week "don't bother." Be who they call when the incumbent fails. Commercial jobs run 5-10x bigger. Collaborative reels with commercial clients become proof. AI cold email: about $400-500/month or about $80 per response.
- **Scale what works:** if a channel works at 50 signs or $50/day, ask why you did the same next month; avoid "D+ effort at every channel." Ignore directories, Yelp ads, Thumbtack, Angie.
- **Pricing:** raise about 20% when booked out 3-4 weeks; discount to fill an empty week. Lead with a monthly payment; printed leave-behind folder for the second spouse.
- **Owner role:** at $20-50K/month owners plateau because marketing, sales and fulfillment all degrade when one person does all three.
- **Door knocking:** avoided; a $1M/month window installer got one-star reviews from solicitation complaints.
- **Mindset:** "They already haven't given you money, so the worst case is they continue not giving you money."

### The Got Moles playbook (what we kept)

Context: about $1.1M in 2026, about $2.05M 2027 plan (residential TMCP +25%, winter/spring selling, Jan-Mar Quick Fix to TMCP winback, 1.5 commercial accounts/month). The measure is cost per booked job (CPBJ), payback and mix, never cost per lead. Attribution is broken today (F-01: 85% of Jobber clients have `leadSource: unknown`), so tracking comes first. **Nothing here authorizes spending, printing, posting or sending**; Spencer approves exact amount, copy and audience, and no cron may do these things. Neighbor tactics fire on new starts and first catches only, not every recurring stop. Moles cross lot lines, so the 10-15 homes nearest an active job are the best prospect list.

### Neighbor marketing
**Door hangers (first).** Trigger: first visit of a new Quick Fix or TMCP start, and first visit with a catch; Monday Jobber batch as fallback. Nearest 10-15 single-family homes, door handle only, never a mailbox (federal postal rule). Tech walks it in 8-10 minutes, hand-writes first name and expiry date, logs "Door hanger drop, N hung" plus streets in Jobber. Never imply a specific neighbor has moles.
- Copy: "Chemical-free mole control, now serving your street." / "Safe for pets and children." / "We're working in your neighborhood this week." Brand, dedicated tracking number, QR to quote page, "283+ five-star Google reviews" (re-measure before each print), "Founded 2017" if age appears, never a bare "15 years." Offer with handwritten expiry, set by Spencer inside published tiers (e.g. waived $150 setup fee, first-month TMCP credit); no commercial or over-5-acre pricing. Back: "This is [first name] with Got Moles. I was just working a lawn down the road and wanted to introduce myself." Banned: trap, kill, lethal, body-gripping, bait, poison, spike, harpoon, I-713, "#1"/"best," client count, "hauled away." Claims gate, then humanizer.
- Print: 3.5x8.5 die-cut, 2-sided, 1,000 minimum, 1-2 weeks; course price $210 per 1,000 (re-quote). Cost `ESTIMATE`: $0.21 each plus $3-5 labor per start; at an assumed 40 starts/month (`UNKNOWN`), about 600 hangers = about $130 print + $150 labor.
- Return `ESTIMATE`: plan on 0.5-1% calls (3-6 per 600), 1-3 booked jobs/month plus late calls. Judge after 90 days or about 2,000 hangers. Stop if CPBJ exceeds the Quick Fix first-month margin ceiling set by `acc-cfo`. Run now to mid-Nov, lean on TMCP offer Dec-Feb, resume Mar-May.

**Customer-lawn yard signs (pilot).** 50 signs, 18x24, 2-3 color, "Chemical-free mole control / Got Moles / phone + QR," about $225-300. Tech asks at a visit ("Could we leave this sign in your front lawn between visits?"), only where visible from the street and already treated; property line, away from right-of-way; HOA lots only if the customer confirms. Retrieved at the next visit; logged in Jobber. Any $10-15 discount stays separate from review asks. Pilot 60 days on its own tracker; scale only if CPBJ beats hangers.

**A-frame.** Roadway version rejected. Allowed only in the customer's own lawn or driveway, with permission, as a yard-sign variant. No purchase until the pilot reports.

**Tracking (before any print order).** (1) CallRail trackers per source: Door Hanger, Yard Sign, Gift Card/Referral, Gift Drop (about $5/month each). (2) One QR per source to the quote page with its own UTM (`hanger`, `yardsign`, `giftcard`). (3) Promo-phrase fallback ("Mention NEIGHBOR"). (4) Jobber source values: Door hanger, Yard sign, Referral, Gift drop, Review/GBP, Missed-call text, Winback text; blank at intake is a defect. (5) Gitignored drop log: date, job number, street, count, tech. (6) Monthly: hangers hung, calls by tracker, booked jobs, CPBJ, TMCP vs Quick Fix mix.

**Targeting.** Mole damage tracks lawn size, irrigation and soil, not income. Use EDDM Table view for single-family density and larger lots, cross-checked to Jobber density and the service-day lookup. EDDM mass mail and door knocking skipped; a CRM-triggered neighbor mailer is the only mailer worth pricing (cost `UNKNOWN`).

### Referrals and gift cards
Reward is paid only on a **booked job** from someone else, never tied to or mentioned with a review; separate messages on separate days.
1. Each new TMCP enrollee, and each Quick Fix customer at the first-catch visit, gets 2 cards (not 3): "A gift from [giver's first name]: [dollar-off] your first mole control service," giver's name and expiry handwritten.
2. Single use, residential only, not by the giver.
3. Office records giver at booking; Jobber source = Referral plus giver's name.
4. Weekly reward after the referred job is booked: $25-50 (`ESTIMATE`; coffee/restaurant card or TMCP bill credit). Spencer sets it; `acc-cfo` checks against lifetime value. Replacement cards only after a first redemption.
5. Terms printed on the FAQ sheet so the incentive is disclosed.

Print 250 cards (about $100). Expect 10-20% of givers to yield one booked neighbor within 90 days (`ESTIMATE`; real rate `UNKNOWN`); at $25-50 against $1,200-1,800 a year TMCP, payback is inside one billing month. Hand over after the first catch, at enrollment, and in the winback. Never auto-text a referred person who has not opted in.

### Speed to lead, quote follow-up, winback texts
Course tool rejected; rebuilt on CallRail, Jobber and the office. Targets (all `ESTIMATE`): missed call, text within 1 minute; form in business hours, human call back within 5 minutes; after-hours form, acknowledgment text now and call by 9 AM next business day; any customer message, same business day. Course stats are not quoted; we measure minutes to first human contact weekly from CallRail and Jobber timestamps.

- **Missed-call text-back** (CallRail text feature or no-answer branch; plan support `UNKNOWN`): "Hey, this is Got Moles. Sorry we missed your call. Is this for a home or a business, and about how many acres?" One message, no offer, no price. Raise ring timeouts.
- **Quote follow-up** (Jobber, tier `UNKNOWN`): day 2 "any questions?", day 5 one more, 3-4 touches max, stop on reply or booking, 8 AM-8 PM only, never a price in an automated message. Commercial and over-5-acre: no automation; Cory owns bid follow-up. "Ghosted" = request or quote older than 14 days with no response.
- **Day-30 text** (consent only): "Hi [first name], it's Got Moles. You asked about mole control about a month ago. Is this still something you want to handle, or should I stop bothering you? Reply STOP to opt out." Plan on 3-10 replies per 100; one send per person, ever.
- **"Tech in your area" winback text.** Service day comes from actual Jobber visit history by ZIP (about 90% match vs 73% for the territory grid), never `territories.json`; Spencer and the route owner verify; no day moves promised; the office confirms capacity in OptimoRoute/Jobber first, no false scarcity; residential only, segmented by service day. Draft: "Hi [first name], it's Got Moles. Our tech will be in your area [Tuesday, Nov 11]. If moles are back on your lawn, we can fit you in that day. [Offer, e.g. waived setup fee] if you book by [date]. Reply YES and we'll confirm a time. Reply STOP to opt out." Expect 3-10 replies per 100; if full, offer the next route day.

**Consent gate (before any marketing text).** Express written consent with disclosure (who, what, frequency, message and data rates, STOP/HELP); form submission alone is not consent; record the `sms-marketing-ok` tag with date and source. A2P 10DLC brand and campaign registration under Rainier Power Wash LLC (EIN, not the DBA) approved first. Transactional texts (arrival windows, reminders) are a separate lane; never send an offer through it. Voicemail drops and prerecorded calls banned. WA RCW 19.190, CAN-SPAM and TCPA verify-by dates sit in `email-playbook.md` (2027-01). Current consent coverage of the Jobber/CallRail lists is `UNKNOWN`: audit before the first send, counsel confirms wording. Opt-outs honored same day, stored outside any one tool. First sends throttled to about 50 per 30 minutes.

### Seasonal nurture and the Jan-Mar winback
No 96-email program. A seasonal calendar of about 12-20 emails a year, quarterly minimum, monthly in Sept-Nov and Mar-May. Segments by Jobber tag (counts from 2026-08-06, `KNOWN` then; re-pull): TMCP active 642 (retention, seasonal expectations, referral card, review ask in a separate message); repeat Quick Fix never on a program 700 (winback); ex-program 84 (soft "moles return"); single-job or none 1,831 (educational, low frequency); unconverted estimates (educational, then day-30 text).

Winback sequence (draft): start about 30 days after the last Quick Fix visit and again early January; 3-4 emails plus 1-2 texts (consented only), 1-2 weeks apart; message is moles return, monthly protection $100/$125/$150 by acreage tier, chemical-free, safe for pets and children (Posture A); setup fee and no-catch guarantee worded as in the claims gate, never "money-back"; expiring offer by Spencer inside published tiers; over 5 acres routes to Cory; the "tech in your area" text as last touch; a referral card in the packet; stop at reply, booking or two unanswered texts. Metric: signups / contacted, CPBJ (print and tool costs, not labor), payback. Targets `UNKNOWN` until a baseline exists; hand to `acc-cfo`. Texts cost about $0.01-0.02 each plus A2P fees.

### Reviews and GBP
State (`KNOWN` 2026-08-21): 3 listings, 289 total / 283 five-star, about 7 new a week.
- **Policy floor (P0):** ask every completed customer; no satisfaction screening or rate-first flow; no incentive of any kind (discount, gift card, coffee, cash); no quotas; no technician-naming credit; a private "tell us how we did" option may sit alongside the Google link, never instead.
- **Ask:** in person at the end of a first visit or after a catch via NFC tap card or QR to that location's direct review link (the 4-5x claim is `UNKNOWN`; test on one tech for 60 days); follow-up email 1-3 days later, one reminder, stop; wording "Thanks for choosing Got Moles. If you have a minute, a Google review helps neighbors find us: [link]." Photos are requested, never required or rewarded; no customer faces without consent.
- **GBP hygiene (GBP belongs to the marketing seat; site changes go to Roy):** reply to every review within 2 business days with no boilerplate, claims or mechanism wording (negative: apology plus phone number); specific service terms in Posture A wording; hours only when the phone is answered; seeded Q&A; regular photos; linked socials; claim and complete Yelp without advertising or soliciting; documented recovery contacts if a listing is suspended.
- **Map-rank grid:** SEMrush Local Map Rank Tracker or equivalent, 11x11, 10-15 miles around each of the 3 locations, monthly, keywords like "mole control near me," "mole removal [city]," "get rid of moles"; about $30/month for three. Fix gaps via services-list terms; never edit reviews or ask for keywords. The "145 calls in two months" claim does not transfer; expect slow compounding.

### Commercial gift drops
Supports 1.5 accounts/month; Cory owns every bid.
1. Targets only from `mkt-whale-hunt` (10 whales) and the `mkt-linkedin-nurture` pipeline.
2. A drop is a small gift, a one-page card (who we are, chemical-free, insurance certificate on request, Cory's contact) and a handwritten note. No pricing or mechanism wording.
3. Up to 5 drops a week, one per account per quarter unless a conversation is open (`ESTIMATE`). Lag: 2-3 weeks to a response, 2-3 months to a bid.
4. Log each drop in `pipeline.json` or the whale tracker with the "Gift Drop" tracker; never "I sent you donuts" as a LinkedIn hook.
5. Public-sector gifts may be restricted by ethics rules (`UNKNOWN`); default to none.
6. Proof loop: ask commercial customers (not as a condition of service) to name the property in a review; share published reviews with same-sector prospects.
7. Keep the insurance certificate and vendor packet ready; leave-behind folder for Cory's bids under $5 each.
Cost about $160/month; cost per commercial account `UNKNOWN` until three close.

### Paid-ad pointers
Detail lives in `ops-meta-ads` and `paid-playbook.md`. Forwarded: no address field (collect property type and approximate acreage); 3+ creatives, show the tech and truck; pre-qualify in copy; $30-50/day is a guide, not a budget; judge by CPBJ and month-3 payback; income is not the driver; check LSA status via `ops-got-moles-ads` first (moles classed under rodent); test, don't assume, the still-image CPM claim; skip false-urgency prompts.

### Rejected tactics and reasons
| Rejected | Reason |
|---|---|
| Review gating (rate first, 4-5 stars to Google) | Violates Google policy and a Got Moles P0 |
| $5 to the tech for a named review; any per-name bonus or quota | Review-policy P0 |
| $5 coffee for a review | An incentive, disclosed or not |
| Texting on form-submit consent; automated multi-touch texts to form leads | Needs express written consent and A2P registration |
| Voicemail drops, "press any key" whisper call | TCPA risk; text plus email is enough |
| Unbranded roadside signs with a Google Voice number | WA right-of-way rules (`ESTIMATE`, verify locally); about half pulled by day 2; anonymous number; one angry post drags down the rating on all 3 listings |
| Roadway A-frame styled as a work-zone sign | Misleading; traffic and liability risk; visits last 15-30 minutes |
| SnipeyLead, HighLevel, Conversation AI | Stack is Jobber plus CallRail; DigiHammer exit retires HighLevel; AI auto-reply looped and risks price or mechanism statements |
| Two-year weekly nurture, birthday messages | Over-built for about 2,900 customers |
| Door knocking, EDDM mass mail, public signs at volume | Brand and ordinance risk; weak evidence for a $100-150/month product |
| Purchased lists, AI cold email | Consent and reputation risk; commercial stays supervised on LinkedIn |
| Anything breaking the claims gate or Posture A | Trap/kill/lethal/body-gripping/bait wording, I-713, "#1," bare "15 years," client count, "money-back," "hauled away" |
| Course statistics as targets | Single-source claims from a coach selling a paid tier |
| Price-raise loop, virtual-office GBP tricks, ghost-list blasts without consent | Pricing belongs to `acc-cfo`; listings already verified; consent first |

### 90-day rollout
Day counts from Spencer's approval of each line. S = Spencer approves, O = office, T = techs. Metric on every line: CPBJ, payback, mix at day 90. Costs `ESTIMATE`.

| # | Item | Days | Owner | Cost |
|---|---|---|---|---|
| 1 | Tracking: CallRail trackers, Jobber source values, UTM brief to Roy | 0-14 | S, O, Roy | about $20-25/mo |
| 2 | Jan-Mar Quick Fix to TMCP winback (email first; texts after consent audit and A2P) | 14-90 | S copy/segment; O sends | per `email-playbook.md`; texts $0.01-0.02 |
| 3 | Speed to lead: missed-call text, 5-minute callback, ring timeouts | 0-30 | O; S wording | about $0 beyond plan |
| 4 | Door hangers at new starts and first catches | 14-90 | T, O logs, S print | about $130 + $150 labor/mo |
| 5 | Review velocity: tap cards/QR, reply discipline, grid | 0-30, then monthly | T ask; O reply; S card print | about $30/mo + $50-100 cards |
| 6 | Referral cards (2 per enrollee/first catch) | 21-90 | S reward/print; O pays weekly | $100 + $25-50 per booked referral |
| 7 | Estimate follow-up plus day-30 text (consent-gated) | 30-90 | O; S | $0 beyond plan |
| 8 | Commercial gift drops (up to 5/week) | 14-90 | O; Cory bids; S | about $160/mo |
| 9 | Yard sign pilot (50, permission only) | 45-90 | T, O, S | $225-300 |
| 10 | Meta/LSA notes to `ops-meta-ads` / `ops-got-moles-ads` | 0-30 | S every launch | per those skills |

Order: tracking, then the existing-book winback and lead-speed items (cheapest, biggest effect on TMCP), then neighbor and review tactics that need 60-90 days to read, then commercial and pilots. Items 2, 3, 5 and 7 run through Jan-Mar. Results go in a "Local growth" block of the monthly marketing review and feedback in `context/learnings.md`.

### Open items
Nothing is approved or spent. Pending Spencer: (1) tracking setup; (2) Jan-Mar Quick Fix to TMCP winback copy and segment; (3) door hanger print order (copy, offer, quantity, vendor re-quote, fresh review count); (4) tap cards and the 60-day one-tech test. Also still open: referral reward amount and card print, the yard sign pilot, the commercial gift list and budget.

**Gate before any marketing text:** a texting consent audit of the Jobber and CallRail lists, and A2P 10DLC registration. Until both are done, the winback runs email only.

### What this means for Roy
Only items the playbook assigns to or touches the website lane:
- **Quote page tracking.** Every QR (hanger, yard sign, card) lands on the quote page with its own UTM (`hanger`, `yardsign`, `giftcard`). The site needs UTM capture and a "how did you hear" field. This is the one explicit brief to Roy; the date asked is logged in `open-findings.md`.
- **Form routing.** The website form should alert the office instantly and feed Jobber, so a human calls back within 5 minutes in business hours and after-hours forms get an acknowledgment. A webhook or Zapier/Make bridge is the suggested route if the form tool needs one. The form should collect property type and approximate acreage.
- **Consent wording.** Any site form feeding text marketing needs the express-consent disclosure (who texts, what, frequency, message and data rates, STOP/HELP); counsel confirms wording. Texting registration may also need terms and privacy pages (the course's A2P workaround used a thin landing page; the playbook says register honestly).
- **GBP and reviews.** GBP and review asks sit with the marketing seat; Roy edits site pages and schema only. Tap cards and QR use each location's direct Google review link. Gaps from the map-rank grid are fixed in the GBP services list and review replies, not site edits.
- **Claims on pages.** Re-measure the review count live before using it (the August figures, 283 five-star / 289 total, are out of date), never "219+." No "#1," client count or bare "15 years." Posture A applies to landing and QR pages.
- **Tracked numbers.** Hangers, signs, cards and drops carry their own CallRail numbers. If one appears on a landing page it should not replace the main number sitewide.
- **Ad landing pages.** Any Meta or LSA landing page is a site task routed through `ops-meta-ads` and `ops-got-moles-ads`.
