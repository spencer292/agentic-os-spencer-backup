# E. Advanced creative, reporting, audits and AI (Meta Ads Arena, Dan Edmund)

Sources: course 06 "Next Level Meta Ads" (lessons 01-07), 08 News & Updates, 09 The Vault. Cited as [06/03] = course 06, lesson 03, etc. Course 06 was still being built when recorded (Aug 2026) [06/01].

Fit labels: APPLIES = use as is. ADAPT = use with the change noted. ECOM-ONLY = skip.

Got Moles frame used throughout: local service, lead gen (calls plus web bookings), judged by cost per booked job (CPBJ). The "business source of truth" Dan keeps pointing at is Jobber (booked and completed jobs), not Ads Manager.

---

## 1. Dan's operating philosophy (applies to everything below)

- **Ads Manager is not the source of truth.** Reconcile Meta's numbers against the CRM/store over the same date range. Attribution "will never match perfectly"; the goal is consistent reporting and a directionally supported business result [06/06]. APPLIES: reconcile against Jobber booked jobs and CallRail calls.
- **The ad is responsible for less than half of the outcome.** What happens after the click (page, form, phone answer, sales process) matters as much [06/06]. APPLIES strongly: a phone-answering or booking leak looks like a bad ad in Ads Manager.
- **Do not change things because you "feel you should."** Most damaged accounts come from touching things after looking at a few moving numbers [06/05]. Read first, decide what question you are asking, then change one thing.
- **AI organizes evidence; it does not choose.** "AI is built to agree," so the operator still owns the segment choice, the claim and the decision [06/02, 06/03, 06/04]. Never paste confidential customer data into AI tools [06/03].
- **Document every change** (landing page, offer, price). Undocumented small changes are the number-one cause of unexplained breaks, e.g. a page edit that broke mobile [06/06].

---

## 2. Reporting: three saved column views [06/05]

Dan's point: advertisers have a reporting problem, not a data problem. Meta's default 30-plus columns bury the signal. Build a few narrow saved views, each answering one question. Removing columns from a view only hides them in that view.

Naming: job plus level (e.g. "operator view ad set", "creative test view ad"). Never "new columns" or a person's name. Presets are private to the user who made them; teammates cannot see them [06/05].

### View 1: Daily operator view (ad set level) - "where do I look first?"
Order, left to right, follows the story of the account:
1. Delivery (active / learning / limited / delivery problem) - check before judging performance. Do not troubleshoot an ad that is not running.
2. Budget (intended allocation, not proof of spend)
3. Amount spent (real evidence)
4. Results and Cost per result (read the label: it is whatever event the campaign optimizes for, not necessarily the business outcome; a cheap low-quality lead is still expensive)
5. Lead-gen downstream events: Qualified lead / Complete registration / Schedule, or the custom event name. Deeper reliable events beat cheap surface leads.
6. CPM (context only, not a verdict; niche CPMs range from about $20 low-ticket ecom to near $100 in premium niches)
7. Frequency (read alongside performance; no universal threshold - Dan has accounts at 8-9 with no decline, others that drop at 3)
8. Outbound CTR (use this, not "CTR all", which counts likes, comment clicks and "see more"; may be labelled "unique outbound CTR", same job)
9. Outbound clicks and cost per outbound click
10. Landing page views and cost per landing page view

Read rule: if outbound clicks far exceed landing page views, check the site (speed, redirects, pop-ups, mobile) before touching creative [06/05]. FIT: ADAPT. Drop the ecom columns (purchase ROAS, conversion value). For Got Moles, "results" should be a lead/booking event, and phone calls must be added from outside Meta (see sections 9 and 11).

### View 2: Creative test view (ad level) - "is this ad earning more testing?"
Delivery, Amount spent, Impressions, CPM, Frequency, Outbound CTR, Outbound clicks, Cost per outbound click, Landing page views, Results, Cost per result, then the rest of the downstream funnel in actual journey order (so you see where people drop) [06/05].
- An ad with $4 behind it tells you nothing. Meta does not spread spend evenly; low-spend ads look great or terrible because they are barely tested. Do not crown or kill on a small pocket of data [06/05].
- FIT: APPLIES (swap the ecom funnel for the lead funnel).

### View 3: Click audit / funnel diagnosis view (from an earlier course, referenced here)
Saved as a preset per business type: ecom = LPV > add to cart > initiate checkout > purchase; lead gen = LPV > lead/application > qualified lead > booked call > showed call > cash/closed [06/05, 06/06]. Use when someone says "we have traffic but weak results." Monitoring view = what deserves attention; this view = diagnosis.

### Level rule [06/05]
- Campaign level: broad allocation decisions.
- Ad set level: budget environment, optimization event, conversion path.
- Ad level: judge the creative asset.
Do not use an ad-level CTR to justify a campaign budget change, and do not credit one creative for a campaign-level total.

### Breakdowns [06/05]
Not a daily dashboard. Open only when the main view gives a reason (result shifted, frequency climbed). Placement breakdown can show, e.g., Reels at a very high cost per result while Facebook Feed is cheap; consider turning off or testing out the bad placement. Also by age, country, day, time. Remember all of it is averages.

### Date ranges and comparison [06/05]
- Pick a window that matches the sales cycle: ecom 7 days or less; high ticket two weeks or more; often 14 and 30 days to avoid reacting to a bad week.
- Compare 7 days against the previous 7, 30 against the previous 30. Never compare a partial Monday with a full week. Watch seasonality and note the date of any landing-page change.
- FIT: ADAPT. Mole control is seasonal and has a lag from lead to booked job to completed job; use 14 and 30 day windows and compare to the same period in the prior year when possible.

---

## 3. Account audit method [06/06]

Goal: one ranked repair plan, not a list of 30 changes. Single question for every audit: **what is the biggest thing holding this account back right now?** Often it is not the ads. Date-stamp the audit file name. Resources: Account Audit Scorecard, Click Audit Quick Reference, Pattern Log (links in section 10).

The six-step ladder (order matters; do not start with creative or budgets):

1. **Business truth.** Real outcome (for lead gen: qualified application, booked call, showed call, closed deal or cash), target cost to acquire it, average revenue per sale and margin, normal lag from click to outcome, recent changes (offer, price, page), and a healthy baseline (last unproblematic 30 days: cost per lead, qualified rate, book rate). "Without these, every number is emotional." A 14-day cycle cannot be judged from yesterday's spend.
2. **Signal integrity.** Events Manager > pixel > Diagnostics: no critical errors, no missing parameters, no duplicate events, no events that stopped firing (thank-you page edits often drop the event). Run Test Events by performing the action yourself. If browser pixel and Conversions API both send the same action, confirm deduplication (one real purchase must not count as two). Event match quality is a tracking-health clue, not proof of profitability. Optimize for the deepest event volume allows (lead, then application, then booked call or qualified). Reconcile Meta against CRM over the same dates. If signal is broken, mark it a **blocker** and stop: do not treat unreliable data as a creative or budget problem. Fixing pixel/CAPI may need a developer.
3. **Account design.** For each campaign: its job (test, scale, offer, retargeting), optimization event, budget, spend, one-line finding. Under Andromeda the question is whether the structure gives Meta clean signal and gives you a clean decision. Look for avoidable fragmentation: duplicate campaigns chasing the same event and people, near-identical ad sets, ad duplication, tiny budgets spread across many decisions, old campaigns with no purpose. Every control (bid cap, placement or audience restriction) needs a business reason. Check naming; an account of "final V7s" teaches nothing. Consolidation is the usual recommendation; multiple campaigns are fine if each has a clear job.
4. **Creative signal.** Sort ads by spend, last 30 days. Record per top ad: angle, awareness level, hook, proof type, format, business outcome, largest constraint. Ask whether "12 live ads" are 12 distinct ideas or 12 cosmetic copies of one. No fixed creative-count rule. Fatigue = a trend (e.g. conversion rate falling over about 14 days), not "seen three times." Open the landing page after each ad: does it continue the same promise, proof and awareness level? Strong clicks plus weak conversion usually means a broken ad-to-page handoff.
5. **Customer path.** Trace the funnel from the final business outcome backward, mark each step healthy or weak, name the first meaningful break. Dan's example: application volume healthy but CRM qualification weak. If tracking is clean, structure simple, creative earns qualified clicks, and several angles all die at the same page, the problem is the offer or path, not Meta. Document honestly when the leak is lead response, no-shows or the sales process; "you can't solve every account problem inside Ads Manager."
6. **Repair plan.** Every finding goes in one bucket: **Blocker** (makes data or delivery unreliable: broken event, CAPI issue, wrong optimization event, checkout or booking calendar that does not work on mobile or has no availability) - fix first. **Performance lever** (biggest likely result gain after blockers: creative angle, landing page, less fragmentation, better qualification, clearer offer). **Future opportunity** (new market, bid strategy, format) - list it, do not let it distract. Write the plan as one sentence: primary constraint, evidence, owner, next action, **due date** ("if you don't put a date it never gets done"), review date (Dan used 14 days).

Worked example [06/06]: clean tracking, simple structure, strong outbound clicks, but CRM shows 70% of leads never answer the call and the ads never state commitment level. Blocker: weak lead-quality feedback. Lever: qualify harder in the ad and form. Future: objection-handling retargeting. Next move: not 10 new ads; add the qualifier, improve the form, send qualified-lead data back, re-review after enough volume.

FIT: APPLIES, almost whole. Got Moles translation: "qualified lead" = in-service-area, real mole problem, with property type (residential/commercial) and approximate acreage captured; "showed call" = answered call; booked job from Jobber. Leak candidates to test per this ladder (inference): missed or unanswered calls, out-of-area calls, skin-mole homograph traffic, commercial or 5+ acre leads that need an in-person bid and cannot be booked by phone.

---

## 4. Creative: 30 frameworks [06/02]

Core claim: most accounts have an idea problem, not a volume problem. Changing the hook, creator or background makes five executions of one idea, not five ads. Andromeda needs real signal variety.

- UGC, static and video are **formats**, not frameworks. The framework is the argument inside the ad; the same argument can be a founder video, selfie video, split-screen static or carousel.
- Pick by the buyer's actual barrier, not all 30. Choose about three frameworks matching the current friction and build a real concept around each.

Selector:
| Buyer barrier | Framework family |
|---|---|
| Does not feel the problem sharply | Pain / tension / diagnosis (1-5) |
| Believes the problem, doubts your answer | Belief shift / mechanism (6-10) |
| Needs confidence before acting | Proof and credibility (11-15) |
| Cannot see themselves in the result | Identity / desire / aspiration (16-20) |
| Close but hesitating | Decision and objection (21-25) |
| Needs to understand or experience it | Demonstration / participation (26-30) |

The 30: 1 specific symptom; 2 cost of inaction; 3 hidden problem (the obvious problem is a symptom); 4 problem stack; 5 moment of friction; 6 myth vs fact; 7 why the old way fails; 8 new mechanism; 9 counterintuitive truth; 10 before-you-buy lesson; 11 customer transformation; 12 case study breakdown; 13 proof stack (layered proof, not one circled screenshot); 14 founder conviction; 15 expert explanation; 16 identity mirror (situation or choice, not a personal-attribute callout); 17 desired future snapshot; 18 people-like-me mirror; 19 confidence shift; 20 values alignment; 21 with vs without; 22 comparison chart; 23 objection answer (real objections only); 24 FAQ / ask me anything; 25 risk reversal; 26 problem-solution demo; 27 product in real life; 28 behind the scenes; 29 "X reasons Y" list; 30 decision flowchart.

Rules: a winner that fatigues should be re-expressed through a different framework for the same barrier (case study becomes transformation, demo becomes myth-vs-fact, objection answer becomes FAQ), not a color or word swap. The creative matrix (persona, format, environment, angle) expands delivery; frameworks expand the reason to care; the creative test says whether the concept has signal [06/02].

AI shortcut [06/02]: feed reviews, sales notes, support tickets, comments and DMs to AI; ask for recurring pains, objections, desired outcomes, failed solutions and exact customer language, then three recommended frameworks. Validate yourself.

FIT: APPLIES. Likely candidates for Got Moles (inference, not from the course): specific symptom (ridges, mounds, dead patches), cost of inaction (damage continues), why the old way fails (DIY traps, repellents), objection answer (price, "will it work", pet/child safety), risk reversal (no-catch guarantee), behind the scenes (tech at work), customer transformation (before/after lawn). The Got Moles claims gate and Posture A wording rules override any framework.

---

## 5. Competitor research and the swipe file [06/03]

Purpose is not to copy a hook. It is to learn what the market has already seen, what proof the category relies on, and where you can say something that is yours.

Method:
1. Start with one question tied to the account (e.g. "what proof does this market use at a higher price point?", "what objections are competitors answering before the buyer asks?", "what is every competitor repeating, and what are they barely mentioning?"). No question means a pile of screenshots.
2. Sample about 10 brands: direct competitors, adjacent competitors (same buyer problem, different solution), aspirational examples (good at the communication problem). Example split: 3 direct, 3 adjacent, 4 aspirational.
3. Use Meta Ad Library (facebook.com/ads/library): select country, All ads, search one brand at a time, sort by impressions high to low if the option shows (it does not appear for everyone). Long-running ads are a clue the ad converts, not proof. Library shows no spend, ROAS, targeting, bids, structure or profit.
4. Capture the full chain, same fields every time: brand, category, date first seen, hook, underlying angle, buyer tension, promise and mechanism, proof type, format and visual world, offer and CTA, landing-page observation (does the page continue the same argument?).
5. One ad is an idea; the same thing across three or four brands is a pattern. Then look for the gap (what is barely handled). A gap is only usable if you hold real proof for it; if not, it is a research note. Brands sometimes skip a subject because they cannot prove it, buyers do not care, or it is a policy issue.
6. Write one original test hypothesis: because the market repeatedly shows [pattern], and buyers still have [unresolved tension], we will test [original angle] using [our real proof]. That sentence is the creative brief. One next test, not 20 ads because you looked at 20.
7. Cadence: 30 to 45 minutes a week, same research question for the week, tag new examples. Own customers (reviews, calls, support, comments, DMs) matter more than competitors.
8. Do not copy testimonials, footage, founder stories, invented mechanisms or landing pages.

AI prompt (pasted after filling the worksheet): list only observations supported by the material; group into repeated buyer problems, promises, proof formats, creative formats, objections, possible gaps; state the proof needed before making a claim; propose three original hypotheses each with buyer tension, angle, required proof, one recommended framework; never claim a competitor ad is profitable; write "not enough evidence" when thin [06/03].

FIT: APPLIES. For Got Moles, competitors are other Western Washington mole and wildlife control operators and pest companies. Expect small local samples; widen to adjacent (lawn care, pest control) and out-of-area mole control as aspirational.

---

## 6. Partnership ads (whitelisting) [06/04]

Meta's current product name is "partnership ads" (Partnership Ads Hub: business.facebook.com/partnership_ads_hub). The ad runs from your ad account but displays as coming from a creator's or partner's Facebook/Instagram identity ("[Creator] with [Brand]").

Rules from the lesson:
- Works only when five things line up: right creator, credible message, real proof, clear rights, a controlled paid test. A famous creator does not rescue weak content or a claim they cannot credibly make.
- Choose on four fits, not follower count: buyer proximity, proof proximity, delivery fit (matches their organic style), working fit (responsive, follows claim guardrails, OK with paid usage). A creator with 8,000 relevant followers can beat one with 800,000 vague ones.
- Permission: start with **content-level** (one defined reel/story/post, partnership ad code, one-time fee, creator records from a brief, you get permission to run it). Move to **account-level** (ongoing, create ads from the partner identity via the hub) only after trust and clear scope. Never ask for a password; use the Meta permission flow. Permissions can be removed.
- Set written terms before launch: paid-usage period (30/90/180 days or longer), scope of use (original post only, edits and cut-downs, placements), deliverables and approvals and claim guardrails, exclusivity, compensation (flat fee or affiliate), renewal cost and exit path. "A $250 creator fee becomes expensive fast if you bought 30 days and it is your best ad." Dan states he is not giving legal advice; have a lawyer review.
- Creator brief has six parts: buyer tension, one argument, available proof, claim guardrails, visual moments that make it believable, deliverables plus signed paid-use scope. Do not hand over a 900-word script; give the truth, proof, do/do-not-say list, and room to sound like themselves. Send a few hook options.
- Outreach: short, direct DM; state brand, angle, asset wanted, paid collaboration; no discovery call; one follow-up after a few days, then move on. Start with smaller creators; big ones sit behind agencies.
- Setup: Partnership Ads Hub > Add partnership > partner accepts > request review. In the ad, switch on the partnership identity; everything else (structure, copy, testing) is unchanged. Ad policy still applies in full.
- First test question: does this creator carrying this angle and proof produce a stronger downstream response than our brand-identity version? Pay for 1-2 videos before a bigger commitment.
- AI prompt: build the brief using only supplied evidence and facts; do not invent the creator's experience, testimonials or legal terms [06/04].

FIT: ADAPT, low priority. Could suit a trusted local voice (gardening or lawn-care creator, a homeowner with visible before/after) with the Got Moles claims gate applied. Not a first-month priority at modest budget. No creator may speak as a fabricated customer.

---

## 7. Meta platform changes and what to do

- **Andromeda** (Meta's delivery/retrieval system) is the repeating theme. Meta reads the message, first frame, visual world, voice, format, proof and overall concept to decide who may respond. It learns from what you give it but "cannot create range you never produce" [06/02, 06/03, 06/04, 06/05]. Actions: produce genuinely different concepts (angle, awareness level, proof, persona, format), not cosmetic variants; keep structure consolidated enough to give clean signal; stop building elaborate targeting stories around small results; audit for "12 ads = 1 idea" [06/06].
- **Customer lifecycle strategy (Oct 2, 2026 update)** [08/03]: a 3-minute YouTube video (https://www.youtube.com/watch?v=vIMWP07fgSA) with **no transcript in the corpus and no description**. Nothing about its content can be stated. Gap: watch it or pull the transcript before building any lifecycle (new vs returning vs lapsed customer) structure.
- **News & Updates policy** [08/01]: if an update conflicts with an older lesson, the update wins. Dan posts platform changes, live-account observations (his agency runs high-spend accounts and tests early), Meta announcements and "what it means for campaigns" there first; flags affected lessons. Check at least weekly. "New Lesson Drops in Last 7 Days" [08/02] was empty at capture.
- Fame or creator status does not exempt anything from Meta ad policy [06/04].
- Ad Library "sort by impressions" availability varies by account [06/03]; Ads Manager labels change often (e.g. "unique outbound CTR") [06/05].

---

## 8. AI workflows and the AI Prompt Library

The PDF "AI Prompt Library" is one document embedded identically in 01/26, 02/16 and 06/07 (same file size, same text). Fifteen copy-paste prompts in five sections: Research & Avatar Building (1-3), Creative & Hooks (4-6), Copywriting (7-10), Diagnostics & Analysis (11-13), The Vault Advanced (14-15). Full text is in `skool-corpus/06-.../07-download-the-ai-prompt-library-pdf.md`. Each uses bracketed placeholders.

| # | Prompt | Use | Fit |
|---|---|---|---|
| 1 | Review Miner | Extract exact pain-before and payoff-after phrases from pasted reviews into "Pain Language" and "Payoff Language"; explicitly "do not summarize" | APPLIES (best-value prompt given Got Moles' review volume) |
| 2 | Competitor Gap Finder | 3 marketing gaps competitors ignore | ADAPT (ground in real Ad Library evidence, not model memory) |
| 3 | Empathy Map Generator | 3 AM worries, what failed before, emotional payoff, status shift | ADAPT (homeowner problem, not lifestyle) |
| 4 | 30 Hook Generator | 10 pain, 10 desire, 10 pattern-interrupt hooks | APPLIES (run claims gate after) |
| 5 | Creative Brief Builder | Concept to production brief: visual hook, first 5 seconds, narrative, B-roll, CTA | APPLIES |
| 6 | Format Translator | Static winner to 30-second vertical video script | APPLIES |
| 7 | Awareness Stage Adapter | Rewrite for problem / solution / unaware | APPLIES |
| 8 | Framework Applier | Force PAS structure | APPLIES (light use) |
| 9 | Objection Destroyer | Retargeting copy dismantling three named objections | APPLIES (price, pets, "will it work") |
| 10 | Headline Tester | 15 headlines under 40 characters (urgency / benefit / question) | ADAPT (no false urgency) |
| 11 | Click Audit Diagnostician | Paste CTR-all, outbound CTR, CPC, cost per result; diagnose creative vs copy vs landing page | APPLIES (replace purchase with booked job) |
| 12 | Ad Account Summarizer | Weekly data to a 3-paragraph report: what happened, why, next week's plan | APPLIES, core to reporting |
| 13 | Copy Teardown | Why a competitor ad works: hook, triggers, awareness stage, CTA | APPLIES |
| 14 | Policy Appeal Writer | Appeal to Meta chat support for a rejected ad, asking for manual human review | APPLIES with caution: only appeal ads that are genuinely compliant |
| 15 | Offer Equation Optimizer | (Value minus Friction) times Trust: 3 ways each to raise value, cut friction, add trust | ADAPT (pricing and guarantees are Spencer's call; CFO lane) |

Other AI workflows in the lessons:
- Customer-evidence mining then framework recommendation [06/02].
- Competitor evidence clustering and hypothesis generation [06/03].
- Creator brief organizer [06/04].
- Standing guardrails across all: use only supplied evidence, do not invent customers or testimonials, say "not enough evidence," human decides [06/03, 06/04].
- An avatar-to-AI template (01/23) and an AI copy-scaling prompt (03/08) exist as PDFs in other courses; outside this digest.

Inference for Got Moles (not from the course): prompt 12 is the natural way to turn the section 11 table into the weekly summary, with KNOWN / ESTIMATE / UNKNOWN tags.

---

## 9. Attribution, tracking and lead gen specifics

What the lessons actually say:
- Meta-reported conversion value and ROAS are "directional platform evidence"; reconcile against Shopify/Stripe/CRM [06/05].
- Attribution never matches perfectly; aim for consistent reporting [06/06].
- Third-party attribution tools (Hyros, Triple Whale) are named only in passing [06/05]. No setup guidance.
- Lead gen: send Meta the deepest event volume allows (lead, application, booked call, qualified). No qualified-lead event returned = a blocker; add qualification in the form and send qualified-lead feedback back if possible [06/05, 06/06].
- Pixel plus Conversions API: dedupe, check diagnostics, test events [06/06].
- Long cycles: judge with lag; never evaluate off yesterday's spend [06/06].

Not covered in these lessons: call tracking, offline conversion upload mechanics, or local-service specifics. ADAPT for Got Moles: phone is likely a large conversion path and ad-platform "results" will undercount it. The mapping to CallRail (call source) and Jobber (booked job) has to be built by us; the course supplies only the principle (CRM is truth, send the deeper event back).

---

## 10. Resource index (Vault and lesson resources)

All are Google Doc/Sheet "make a copy" links unless noted. None were opened.

| Resource | Where | Link | Purpose |
|---|---|---|---|
| The Daily Scorecard (Vault) | [09/01] | https://docs.google.com/spreadsheets/d/1IgXSTPK6WHmHr6oIrQNxG2RwolfiMk6IcQSHuYTbfEw/copy | Daily account tracking sheet. Lesson says "in progress"; columns unknown from corpus. |
| AI Prompt Library (Vault, doc form) | [09/02] | https://docs.google.com/document/d/1u6ePNc0-FqOVhvzGmWdxkpTfCpcS9uL3XsVKkp7f9yo/copy | Editable copy of the 15-prompt library (section 8). |
| Creative Brief Template (Vault) | [09/03] | https://docs.google.com/document/d/1EoAyWNm_Bh3V_uEtMfKc4tbi9W7u4vBbzUkeuiFVKEg/copy | Brief for editors or creators; contents not in corpus. |
| Winning Ad Swipe File (Vault) | [09/04] | https://drive.google.com/file/d/1lYsF3LIexG8xKfQwiNjGVzarybmBHqmL/view?usp=sharing | Drive file (view link, not /copy) of example winning ads. |
| Competitor Evidence to Test | [06/03] | https://docs.google.com/spreadsheets/u/1/d/1JWFebyEemhwUcvhVFw8eS0GKYjsDto1cpdmjhf0-V_k/copy | Worksheet: research question, brand type, per-ad fields, pattern / gap / required proof / hypothesis (section 5). |
| Partnership Ad Campaign Brief and Rights Checklist | [06/04] | https://docs.google.com/document/u/1/d/15knQKmvLbNEHPqhK8PCxV9vjzCLfYwdKhPdvO8is-Cg/copy | Creator brief plus rights and terms checklist (section 6). |
| Account Audit Scorecard | [06/06] | https://docs.google.com/document/u/1/d/1oKTZhjLMOdGBcX9pDgbszKCW1ooWtzxYm5dhH2ILNoc/copy | Six-section audit ladder document (section 3). |
| Click Audit Quick Reference | [06/06] | https://docs.google.com/document/u/1/d/1bq7NMIdbjqkyTitTY8-dVckwxCA2RoExagi92hkhK9U/copy | Column sets and funnel-diagnosis reference. |
| Pattern Log | [06/06] | https://docs.google.com/spreadsheets/u/1/d/1-Cn1VrKnvnHvTLSS3Zwpe9qfTzypM4HxaIMcjU9fOn0/copy | Log of repeating account patterns. |
| AI Prompt Library PDF | [06/07] (also 01/26, 02/16) | none; PDF text embedded | Same 15 prompts in PDF form. |
| Lifecycle update video | [08/03] | https://www.youtube.com/watch?v=vIMWP07fgSA | 3 min; no transcript in corpus. |
| Tools named | [06/03], [06/04] | facebook.com/ads/library ; business.facebook.com/partnership_ads_hub | Ad Library research; Partnership Ads Hub setup. |

---

## 11. Reporting template for Got Moles

Principle from Dan: three views, one question each; read in funnel order; reconcile to the source of truth; compare like periods; write a ranked fix plan with owner and due date. Mapped to the Got Moles metric: **CPBJ = Meta spend / booked jobs attributed to Meta in Jobber.** The mapping below is inference built on Dan's structure; thresholds are not from the course.

### Columns
Ads Manager (from the saved views):
- Ad set view: Delivery, Budget, Amount spent, Results (lead event), Cost per result, CPM, Frequency, Outbound CTR, Outbound clicks, Cost per outbound click, Landing page views, Cost per LPV.
- Ad view: Delivery, Amount spent, Impressions, CPM, Frequency, Outbound CTR, Outbound clicks, Cost per outbound click, LPV, Results, Cost per result.
- Breakdown only on a trigger: placement, age, day.

Joined from outside Meta each week:
| Column | Source | Why |
|---|---|---|
| Web leads / form bookings from Meta | Site form, CRM | Meta's Results may not equal real leads |
| Calls attributed to Meta | CallRail | Likely a large path that Meta does not see |
| Qualified leads | Intake (in service area, mole problem, property type, acreage) | Dan's "qualified lead" step |
| Bid-required leads (commercial or 5+ acres) | Intake | Separate bucket; not phone-bookable |
| Booked jobs | Jobber | CPBJ numerator |
| Completed job and billed revenue | Jobber | Payback and mix effect |
| CPBJ, cost per qualified lead, lead-to-qualified %, qualified-to-booked % | Computed | Locates the leak: ad, page, intake or phone |

Tag every figure KNOWN / ESTIMATE / UNKNOWN (e.g. calls from Meta are ESTIMATE if CallRail source matching is imperfect).

### Cadence (adapted from Dan)
- **Daily (5 minutes, operator view):** delivery status, spend vs budget, anything not delivering or learning-limited. No edits from one day's numbers.
- **Weekly (core report):** operator and creative views, last 7 days against prior 7; join CallRail and Jobber; AI summary via the Ad Account Summarizer prompt; name the single biggest bottleneck; at most one change per area. Include 30 to 45 minutes of competitor and customer-language research [06/03].
- **Monthly:** full CPBJ and payback; 30 days against prior 30 and, where possible, same month last year; creative audit ("distinct ideas or copies?") [06/06]; short run of the six-step ladder; update the repair plan with owner and due date.
- **After any site or offer change:** log the date; check events and mobile before reading results.
- **Decision gates:** do not kill or crown ads on thin spend; do not judge lagged outcomes on partial periods; do not act on frequency or CPM alone.

### Standing checks (signal integrity), monthly
Events Manager diagnostics clean; lead event firing on the confirmation page; call-tracking number swap working on the landing page; Meta lead counts directionally match CRM. If broken, stop analyzing performance until fixed.

### Report sections for Spencer
1. Spend, booked jobs, CPBJ vs target (target is a Spencer/CFO decision; not in course).
2. Where the funnel leaks (ad / page / intake / phone).
3. Creative: distinct angles live, top spenders, next test as a hypothesis ("because the market shows... we will test... using our proof").
4. Blockers, levers, future opportunities, each with owner and due date.
5. Decisions needed from Spencer (any spend or launch needs his approval).

---

## 12. Open questions and gaps

- **Lifecycle strategy update [08/03]**: no transcript or description. Its content is unknown. Highest-value gap in this chunk.
- **Daily Scorecard sheet** [09/01] is "in progress"; its columns are not in the corpus. The Got Moles table above is our own construction.
- **Vault docs not opened** (brief template, swipe file, audit scorecard, pattern log, click audit reference, competitor worksheet, partnership brief). Field lists are known only where Dan reads them aloud.
- **No local-service content in this chunk.** Nothing on call tracking, offline conversions, call ads, lead forms vs landing pages for service businesses, geographic or ZIP targeting, or seasonality. A "Local Business Meta Ads" guide PDF exists in course 04 (04/07), outside this digest.
- **No benchmark numbers** for CTR, CPM, frequency, cost per result or CPBJ. Dan refuses universal thresholds; build baselines from the account's own first 30 days.
- **Prior lessons referenced but not here** ("click audit", "ad performance and pattern", "creative matrix", "market sophistication"): exact column sets and pattern method live in other courses.
- **Attribution tooling** (Hyros, Triple Whale) only named. For Got Moles the practical tools are CallRail and Jobber source tagging; confirm how Jobber captures lead source.
- **Course 06 was incomplete** at capture; announced lessons on attribution, deep creative analysis and practical AI systems are not present [06/01]. Re-harvest later.
- **Claims and policy**: partnership ads and AI-written scripts both need the Got Moles claims gate (no I-713 claim, no "WA's #1", review count per CLAUDE.local.md) and Posture A ad wording (no lethal-mechanism words). Dan's lessons do not address these.
