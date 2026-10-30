# Digest D: Testing, Optimization and Scaling (Meta Ads Arena, Course 05)

Source: Dan Edmund, The Meta Ads Arena, course 05. Lessons cited as [05/01]..[05/10]:
01 Test structure, 02 Judging performance, 03 Learning phase, 04 Patterns, 05 No-spend ads, 06 Click audit, 07 Kill vs let it run (+ decision card), 08 Scaling 101, 09 Vertical scaling / 20% rule (+ two structure charts), 10 Horizontal scaling.

Fit labels per section: APPLIES (use as is), ADAPT (use with the stated change for a small local-service budget), ECOM-ONLY (ignore).

Got Moles translation used throughout: "final event" = a BOOKED JOB (not a lead). "Target CPA" = target cost per booked job (CPBJ). Where the course says "purchase," read "booked job." The course's own lead-gen advice is that cost per lead is a protective stop-loss only, never the success metric [05/07].

---

## 1. Core philosophy (read first)

- Two environments with separate jobs [05/02, 03, 08]:
  - TESTING campaign (ABO): learns fast about new angles/creative. Never scaled. Never expected to exit learning.
  - SCALING campaign (CBO, or one broad ad set at small budget): holds proven winners, gets about 80 to 85% of budget, is edited as little as possible.
- Decisions come from business outcome, not platform vanity metrics. Meta distributes spend unevenly by design; uneven spend is not a verdict [05/02].
- Set the decision rule before spending ("make that decision before the data makes you uncomfortable") [05/01, 07].
- A bad result is not automatically a bad creative. Find where the funnel broke first (click audit, section 5) [05/01, 06].
- Winning ads are never edited in place. Iterate by building a new ad and keeping the original intact [05/04, 07].
- Instructor's repeated caveat: no universal numbers; every account differs. Treat numbers below as starting defaults.

Fit: APPLIES.

---

## 2. Test structure

### 2.1 Testing ladder [05/01]
1. Baseline: the thing you already know (current best ad, a proven angle, your target CPA, landing page conversion rate). A new ad can only be called good relative to a baseline. With no baseline yet, establishing one is the first job.
2. Isolation: decide the single variable before building; hold offer, landing page, audience, optimization event, CTA constant. Do not change the landing page mid-test.
3. Scale: proven concept either gets more variations or graduates into the scaling campaign. "Testing is not where winners live forever."

### 2.2 Angle test vs execution test [05/01]
- Angle test: tests the core reason to care (message, belief, problem framed). Question: which core message gives this offer its best shot. Use a small family per angle (2 to 3 creatives on a modest budget, e.g. a creator-style video, a static, a demo/testimonial), because one bad execution does not kill an angle.
- Execution test: angle already works; test hooks, first frames, creators, formats, proof elements, pacing, headlines. Example: keep the winning body and CTA, test 3 new openings.
- Ask: "Do I need a new reason for people to care, or a better way to deliver a reason that already works?" New reason = angle test. Otherwise = execution test.
- Real diversity (counts as a new creative): new core angle, different awareness level (problem-aware vs product-aware), different proof mechanism (founder story vs customer testimonial vs demo), different format (raw selfie video vs static vs carousel), different visual world (opening frame, setting, person, pacing). One-line text edits on the same video are NOT new concepts under Andromeda (Meta groups by entity, not creative ID) [05/01, 08, 10].
- 10 versions of one ad is still one idea; one genuinely new angle can beat all 10 [05/08].

Fit: APPLIES (angle/execution split and diversity rules).

### 2.3 The 5-item test checklist (write before launch) [05/01]
1. Hypothesis (what you expect and why). 2. Variable (angle, hook, creator, format, proof). 3. Constants (offer, landing page, optimization event, environment). 4. Business metric (qualified lead, booked call, booked job; early signals like hook rate/outbound CTR/LPV only locate the problem). 5. Decision rule (kill / hold / iterate / graduate, with numbers).
Action step: one spreadsheet line per test with these five fields.

### 2.4 Structure and budget [05/01 + creative test map image]
- Controlled test = ABO campaign. One ad set per materially different angle (concept A, B, C), each ad set containing ONE ad when testing different angles (test-map chart: "one ad per ad set when testing different angles"). Same broad targeting, same conversion goal, same offer/destination across ad sets. Each concept's visual, primary text, headline, proof, offer framing and destination tell the same story.
- Transcript says 2 to 3 creatives per angle family on a modest budget; the chart says 1 ad per ad set. Reconcile: 1 ad per ad set for a clean angle read; use a small family only when budget allows and the family is meant to be judged as one angle (see gaps).
- Multi-text optimization is acceptable for several text variations within ONE core angle, not for unrelated angles in one ad set [chart].
- ABO forces spend onto ads Meta would have ignored; accepted cost for a clean answer [05/01].
- Consolidated test (small budgets): do not copy large-account structure or split e.g. $50 across five ad sets. At small budget run one broad ad set and add a small number of new creatives, accepting that Meta will pick favorites. If an ignored creative strategically matters, re-run it alone in a controlled ABO test; do not label it a loser just because it was ignored [05/01].
- Test budget rule of thumb: testing budget about 2 to 3x target CPA per day (example: $50 CPA = about $100/day) [05/01].
- Underfunded tests fail: target CPA $50 with six ads on $20/day total "is buying confusion." Reduce the number of live questions instead [05/07].
- Source of test ideas: real buyer language, objections, reviews, sales conversations [chart, 05/08].

Fit: ADAPT. Local budget will likely be below 2 to 3x CPBJ per day (see gaps). Use one ABO test campaign with 2 to 3 single-ad ad sets, or sequential single-concept tests, not many concurrent concepts.

---

## 3. Judging performance: level and buckets [05/02]

- Campaign level: is total budget producing cost-effective outcomes. Ad set level: the delivery environment and what Meta optimizes; "most daily performance decisions should be set at the ad set level, not the ad level" in the scaling campaign. Ad level: which creative signal (hook/angle/proof) may be driving it. Ads in a set assist each other, so low-attribution ads can still be helping.
- Ad-set-first judging order in Ads Manager every time:
  1. Is the ad set hitting the real goal (qualified lead / booked call / booked job), not clicks?
  2. Does the date range cover the conversion cycle?
  3. Which ads have enough spend to earn a verdict?
  4. What is the exact next action for each?
- Four ad buckets:
  - Delivery leader (heavy spend, at or beating target): do not make cosmetic edits; document angle/hook/proof/format; build new variations around the signal.
  - Promising, not decided (some spend, early good sign, thin data): be patient; decision window matches your sales cycle; do not crown after one good result or kill after a bad couple of days.
  - Fair test, weak result (meaningful spend, conversion window matured, outcome weak): kill, or iterate. If the whole angle shows no signal, move on; if the angle got response but execution was weak, keep the angle and fix hook/proof/creator/format.
  - Underserved (barely any spend): not a verdict. If strategically important, move to a controlled ABO test. If just another variation with no strong hypothesis, archive it.
- Judge an angle at the ad-set level when one ad set holds one angle: if the ad set gets enough spend and the whole angle consistently misses target, move on from the angle; if the ad set works but one execution is weak, keep the message and improve the execution.
- There is no universal spend threshold. Required before a serious call: a benchmark (target per qualified result), a mature conversion window, and diagnostics (outbound click quality, landing page behavior) comparing to healthy ads in the same environment.

Fit: APPLIES. For Got Moles the "scaling campaign" will often be one ad set, so ad-level judgment may be all that exists; use the buckets at the ad level and the same maturity rules.

---

## 4. Kill / hold / iterate / graduate rules (the numeric core) [05/07, decision card; 05/01]

### 4.1 Set before the first dollar [05/07]
- Allowable cost from business economics, not someone else's screenshot.
  - Ecom: contribution margin. Example $75 product, 55% kept = $41.25 breakeven CPA; target $35; ceiling $41.
  - Lead gen: work backward from max customer acquisition cost through the CRM funnel. Example: max CAC $1,000 with contact 70% x qualify 50% x book 60% x show 70% x close 25% = 3.675% raw lead to customer, so raw lead ceiling about $36.75; working target $30 per lead.
- Write down: target CPA, ceiling CPA (most the business can tolerate), and the final event.
- Three lines per ad: TARGET = 1x target CPA. REVIEW LINE = 1.5x target. STOP-LOSS = 3x target.
- The 3x rule rests on Poisson odds: for an ad truly capable of target CPA, chance of zero results after spending 1x target = about 37%, 1.5x = about 22%, 2x = about 14%, 3x = about 5%. So zero results at 3x is a justified stop-loss. The card states it is an operator rule, not a Meta rule.
- Spend, not calendar, defines the decision line ($105 stop-loss at $30/day takes 3 to 4 days; at $120/day, one day). Calendar matters only because buyers need time to convert after the click.

### 4.2 Zero-result path [05/07]
| Spend with zero final results | Action |
|---|---|
| Under 1x target | OBSERVE. Confirm delivery, tracking, page access. Do not panic-pause. |
| 1.5x target | DIAGNOSE. Trace the path (click audit), find the first meaningful leak (ad, page, offer, form, follow-up). |
| 3x target | PAUSE the exact execution (not the account, not the angle), only if: fair delivery, tracking correct, normal conversion window passed, no separate path issue. |

### 4.3 After results arrive [05/07]
- One result at 3x spend is one data point, not a winner. One result at about 1.5x spend: ask whether one more result changes the outcome.
- After 3 or more final outcomes, compute total spend / results:
| CPA vs target | Action |
|---|---|
| At or under target | KEEP LIVE. It has earned more data; not yet a scalable winner. |
| Up to 1.3x | HOLD. Do not scale; collect more evidence if the full path makes sense. |
| 1.3x to 1.5x | GRAY ZONE. Keep only with a specific reason (known conversion delay, higher downstream value, an isolated funnel issue being fixed). |
| Over 1.5x | PAUSE or ITERATE unless real downstream economics prove it is worth more than Meta shows. |
- 3 results is a triage point, not proof of a scalable winner. A winner also needs enough final outcomes, acceptable CPA and repeatability. At 3 or 4 results it is acceptable to give it one more day when one or two more conversions would change the answer.

### 4.4 Diagnostic thresholds from your own baseline [05/07]
- Compare to your own account baseline, not internet benchmarks. Example: baseline landing-page-view to add-to-cart is 10%; 5 LPVs with zero ATC = no information; 29 LPVs with zero ATC = under 5% chance if traffic were normal, so diagnose the ad-to-page path (curiosity audience, message mismatch).
- Lead gen example: normal contact rate 70%, 10 leads with zero contacts = stop blaming Meta; audit phone numbers, consent language, routing, speed to contact.

### 4.5 Lead gen runs two clocks [05/07]
- Raw-lead clock (protects budget now). Example with $30 target: $30 spent with no lead = observe; $45 (1.5x) = diagnose (lead forms, delivery, location, audience fit); $90 (3x) = pause if fair delivery and tracking OK.
- Quality clock (CRM): review a mature cohort weekly (example: leads that entered 7 days ago), comparing contact, qualified, booked, show, and sale rate against control. Two questions: is Meta acquiring leads at a viable cost, and are those leads creating the business outcome. "A $12 lead that never answers is not cheaper than a $35 lead that becomes a customer." Send qualified lead and later CRM stages back to Meta when the setup supports it.

### 4.6 The four decisions [05/01, 07]
- KILL: exact execution hits the stop-loss with no result, or has 3+ results and is materially outside target with no downstream reason to keep it. Record what failed.
- HOLD: needs a specific next review condition, e.g. "until $105 spend, or 30 LPVs, or 48 hours after normal conversion window, whichever first" or "until 10 leads have had 3 business days for contact and qualification." A hold without a condition "is just hope." Rule of thumb: hold only if one more conversion would put it within target CPA.
- ITERATE: core idea has signal, one element weak (stale hook, weak proof, wrong format). Keep original intact, launch a new ad with ONE meaningful change as a new intentional test.
- GRADUATE: produces the final business outcome at acceptable CPA with enough spend behind it. Spent about 2 to 3x CPA before declaring winner or loser [05/01]. Not on one sale, one lead, or high CTR.

### 4.7 When NOT to apply the stop-loss mechanically [05/07]
1. No fair delivery (e.g. Meta spent $6 in a consolidated campaign): no verdict; use a controlled ABO test if it matters.
2. Real, historically evidenced conversion delay.
3. Funnel or landing page changed mid-test (mark the change; avoid big ad changes at the same time).
4. Strong path evidence but weak attribution (long consideration cycles): use blended data and CRM cohorts; unsupported, it remains a hypothesis.
5. Account underfunded for the question (see 2.4).

Fit: APPLIES, ADAPT on the numbers. The 3x logic scales to any CPA. For Got Moles the target must be CPBJ and the booked-job event is rare at small budgets, so the zero-result stop-loss at 3x CPBJ may take many days; run the lead-gen two-clock version: raw-lead lines (1x/1.5x/3x of target cost per qualified lead) plus a weekly booked-job cohort review.

---

## 5. Click audit: diagnose before blaming the ad [05/06, 05/01]

Principle: ads only deliver people to the page; where along the journey does it first break? Audit at the ad-set level, over a date range that matches the conversion cycle (7 days if sales cycle is 7 days; 14 to 30+ for long cycles). Start at the outcome you want and work backward. Mark each stage healthy / uncertain / leaking and fix the FIRST meaningful leak, one layer at a time.

Column order (left to right matches the journey): Delivery status, Budget, Amount spent, Reach, Impressions, Frequency, CPM | CTR (all), Outbound clicks, Cost per outbound click, Outbound CTR, Landing page views, Cost per LPV | lead-gen path: Leads, Cost per lead, Complete registration, Schedule/appointment events, Cost per schedule | (ecom: ATC, Initiate checkout, Purchase, ROAS: ECOM-ONLY). CRM then covers: qualified, contacted, booked, showed, closed.

Diagnosis table [05/06]:
| Pattern | Meaning | Action |
|---|---|---|
| High CTR(all), low outbound CTR | Entertaining/curiosity ad, no intent to visit the offer | Rework hook/visual/copy; ad attracting non-buyers |
| Low CTR(all), strong outbound CTR | Fewer people, but the ones who click want it | Do not kill for a weak vanity metric |
| Low on both | Creative/message not working | Test new hook or angle |
| Strong outbound CTR, weak downstream | Ad is doing its job | Move down the path, find the next leak; do not rebuild creative |
| Wide gap outbound clicks vs landing page views | Speed, in-app browser, broken redirect, popup, mobile load | Fix the page first; open it on mobile and in the FB/IG in-app browser |
| LPV healthy, leads/applications weak | Message match, offer clarity, proof, form friction | Fix page/form before more ads |
| Ad promise differs from page headline | "Broke the conversation" | Fix the handoff |
| Leads fine in Meta, weak in CRM | Wrong audience or slow follow-up | Check speed to lead, follow-up attempts, booking page, reminders, call recordings |

Other points [05/06]:
- High CPM alone is context, not a problem (diagnose the path before blaming the auction).
- A good ROAS can hide a funnel leak.
- Lead forms: use higher-intent settings and qualification questions when quality matters; higher-friction forms or landing pages screen for quality when quality matters more than volume.
- Do not call a checkout leak an ad problem until you have gone through the funnel as a customer.

Fit: APPLIES. The lead-gen path maps directly to Got Moles (ad click -> LPV or call -> lead/booking -> estimate/visit -> booked job). Phone calls and CallRail data are outside Meta, so the agent needs CallRail/Jobber for the downstream steps.

---

## 6. Learning phase [05/03]

- Learning = Meta calibrating delivery at the ad set level for the chosen optimization event. Early swings in CPA and spend are normal.
- Meta's benchmark: about 50 optimization events within 7 days after the last significant edit to exit learning. Count only the chosen event (lead events count if optimizing for leads; clicks/LPVs do not). Not a score to chase; not a reason to turn off a profitable campaign on day 7.
- TESTING campaigns: not designed to exit learning; will sit in "Learning" or "Learning limited"; ignore it and focus on target CPA, downstream quality, and enough spend per concept.
- SCALING campaigns: learning matters; keep a clean environment, make minimal changes, aim to exit learning.
- "Learning limited" = Meta does not expect enough events to exit. It is a warning, not a kill switch. If CPA is acceptable, spend delivers, and results are not wildly unstable: leave it. Investigate account structure when it persists.
- Significant edits (reset learning): audience change, creative change, optimization event change, bid strategy change, large budget change, long pause. Rule: "don't edit ads out of boredom"; every change needs a decision.
- Fragmenting into many small ad sets or constantly swapping creative resets learning; consolidate.
- Optimization event for low volume: if the final event is rare, optimize for the event just upstream with real commercial intent (lead before qualified application/booked call; add-to-cart before purchase for a new pixel). Never traffic or video views. Move deeper down the funnel as pixel and volume mature.
- Operating standard: set up tracking/pixel/events and budget-to-event fit first, then leave alone for several days. Do not judge on one day (good or bad). Make budget changes deliberately, never double/triple. Document the state before touching anything.
- Columns to add: Delivery, Cost per result, Amount spent, Last significant edit ("what changed?").
- Action: list every ad set in Learning/Learning limited with event, results since last significant edit, edit date, can the budget reach 50/7 days; pick one deliberate action (leave, consolidate, fix funnel, change optimization event intentionally, or turn off); then no random edits.
- Panic-edit cycle to avoid: day 2 change budget, day 3 add ad, day 4 change audience, day 5 declare dead.

Fit: ADAPT. 50 events/7 days is likely unreachable for a booked-job optimization event at Got Moles volume. Optimize for lead (or contact/schedule event) instead, accept "Learning limited," and judge on CPBJ and cohorts.

---

## 7. No-spend ads [05/05]

Decision tree:
1. Locate the problem: whole campaign, one ad set, or one ad (ad-level is usually normal allocation).
2. Read the Delivery column: Active? Not "preparing", "in review", "scheduled", "rejected"? Not date-expired, not blocked by billing? If preparing/in review, wait and do not edit (edits delay it). If rejected, fix the policy issue once.
3. Budget vs event: a budget that cannot realistically buy the optimization event (example: $10/day on a $50 CPA purchase event) will not spend. Match budget to event and expected cost; use the deepest event the account can support.
4. Bid/cost controls: bid cap, cost cap or ROAS goal too restrictive ("bid limited"/"cost limited" in Delivery). Remove or loosen the control, then watch before changing anything else.
5. Fragmentation: too many small ad sets, small retargeting windows, duplicate audiences, tiny budgets across many tests = underfunded environments competing. Consolidate.
6. One new ad in a mature ad set gets $0: usually Meta protecting known winners, not an error. If the ad is not strategically important (not a genuinely new angle/proof/format/awareness level), leave it. If it matters, options:
   - Move it to a controlled ABO test and force spend.
   - Or give it its own ad set INSIDE the scaling campaign and set an ad-set minimum spend (example: $100/day campaign, existing winners ad set minimum $75/day, new-ad ad set minimum $25/day).
   - Some accounts have a "Push delivery to this ad" toggle at the ad level (percentage allocation and duration).
   - Do not scale an ABO ad set with one creative as a long-term plan.
7. Mistakes: several edits at once; duplicating the ad (a duplicate is just another unproven ad); narrowing targeting to force spend (reduces room to find converters and increases overlap).
Principle: usually Meta has a reason it is not spending. Make one deliberate change, then allow time.

Fit: APPLIES. Minimum-spend ad set and "push delivery" options are the right small-budget levers.

---

## 8. Pattern recognition [05/04]

- A data point is not a pattern. A pattern must be (1) repeated (e.g. 3 customer-story ads beating 3 direct-offer ads), (2) comparable (same outcome, same date window, same campaign role; do not compare cold with retargeting, or 2 days with 30), (3) meaningful (tied to a business outcome). If any is missing, log it as an observation only.
- Five pattern families: creative/angle, click quality (attention vs intent), funnel (same leak across multiple angles = fix the page, not the ads; same post-lead break = fix handoff), delivery (CPM, frequency, placement, spend distribution), business/operational (offer, response time, fulfillment).
- Delivery caution: Meta treats a daily budget as a weekly average (a $100/day budget can spend $200 one day, with a 7-day cap of $700). Never judge one or two days; typically use last 7 days or the conversion cycle.
- Fatigue pattern = CPM climbing over a meaningful period plus cost per result worsening across the same creative family. Not one or two bad days. (No numeric thresholds given; see gaps.)
- Placement pattern = one placement keeps taking spend but yields low-quality clicks or weak conversion; if it repeats, consider placement-specific handling or deeper traffic-quality investigation.
- Tag every creative by angle, awareness level, proof mechanism, hook, format via naming convention (example: Pain / Problem Aware / Customer Story / Missed Calls / Hook / UGC). Enables 4 to 8 week questions: customer story vs founder story, demo vs talking head, pain messaging cheaper but lower quality?
- Pattern log: for each creative family record angle, awareness level, format, hook, business outcome; then write Observation (what repeats), Hypothesis (why), Next test (one deliberate action).
- Home-service example from the lesson: a generic "free estimate today" creative produced cheaper leads but weak answer/qualification rates in the CRM; a proof-based creative (homeowner avoiding an expensive repair) cost more per lead but a much higher share answered and became opportunities. Lesson: measure by CRM quality, then try to lower the front-end cost of the proof-based concept without losing quality. "I can get leads for a few dollars each, but they will be very low quality."
- Weekly review (at least weekly): 1) start from the business outcome; 2) compare comparable ad groups; 3) separate observation from hypothesis; 4) turn into a decision (more of the winner, improve a weak execution, fix a repeated funnel leak, test a competing explanation, stop investing in a failing signal).
- Patterns that fool you: one bad/good day; one outlier ad (different creator, post history, placement mix); vanity metrics (CTR, CPC, CPM); several simultaneous changes.
- AI prompt suggested: paste the pattern log and ask for one repeated pattern that is comparable and meaningful, observations separate from hypotheses, flag insufficient data, three next tests (one iteration of a winner, one challenge test), "don't invent results." The model cannot know your sales quality unless you supply it.

Fit: APPLIES, ADAPT on volume. A local account will rarely have 3 comparable ads with enough booked jobs. Pattern log is still worth keeping; label most entries "observation" until repeated.

---

## 9. Scaling framework [05/08]

Definition: predictable scaling, knowing week over week roughly what the account will deliver. Not a budget button.
Four parts: proven offer and funnel; stable delivery environment; repeatable decision process; creative pipeline.

### 9.1 Scaling gate (all four must pass)
1. The business result works (purchases/margin; for lead gen: qualified leads, booked calls, show rate, sales; not cheap leads).
2. It has worked through enough of the conversion cycle (not one good day).
3. You can name why: angle, format, hook, proof, offer.
4. The business can handle volume: landing page converts, can fulfill, sales team can call back fast, service can be delivered. Otherwise "expensive chaos."
Rejected thresholds: no fixed "5 purchases" or "2x CPA" rule; depends on price point, cycle, margin, volume, budget. (Lesson 01 does say about 2 to 3x CPA spend before declaring winner; read as a minimum.)

### 9.2 Four scaling types
Vertical (more budget on the same winners), horizontal (more independent ways to win), creative (new distinct concepts; the main lever under Andromeda), operational (funnel, site speed, offer, fulfillment must carry the demand). Many advertisers vertically scale when their real constraint is creative.

### 9.3 Architecture
- Testing campaign (new ideas, fair test) + scaling campaign (proven winners, about 80 to 85% of budget). Should have only a few campaigns total; possibly a dedicated remarketing campaign or one per offer.
- Small budget: one campaign, one ad set, winners dropped into it. Do not build a complex structure; keep the creative pool diverse and the testing process intentional.
- Higher budget (chart, $1,000+/day): ABO testing lane (concepts A, B, C, one ad each) feeding ONE stable CBO scaling campaign with several proven-angle ad sets (angle 1 to 4); add ad sets only when earned by proven angles and supported by spend.
- Chart, $0 to $1,000/day structure by budget:
  - $0 to $100/day: prioritize ABO testing; keep active concepts few enough that each gets a fair read.
  - $100 to $300/day: maintain the CBO scaling campaign (one broad ad set, graduate proven ads, vertical scale on stable performance) while ABO keeps testing the next concepts.
  - $300 to $1,000/day: controlled vertical scaling; add complexity only when several angles have earned a place.
  - Do not launch a scaling campaign before proof; do not keep adding every new test into it. Keep targeting broad, same conversion goal, destination matching the angle in testing.
  - Optional warm/retargeting layer only when meaningful warm demand exists and it has a clear job.
  - Cadence from charts: DAILY = check delivery, spend, major business signals, no rebuilds because of one odd day. WEEKLY = compare cohorts, record learning, decide what proved itself, build next concepts (at $1,000+: portfolio review: which angles create quality revenue, what is tiring, which hypothesis earns the next test).
- Not every winner must move automatically; some accounts can scale a proven winner in place, preserving social proof and delivery history. Do not turn the scaling campaign into a testing campaign by accident.

### 9.4 Creative pipeline (the real scaling engine)
- Every creative has an expiration date (days to months, depends on budget and audience size). Do not wait until creatives die to start new ones; always have a test running, even when scaling is going well.
- Five stages: 1) mindset, 2) signal (winning hooks, comments, customer interviews, support tickets, competitor ads, customer language, competitor/own negative reviews; human feedback is the number one input), 3) brief with three lanes (winner iteration: new hook/headline/format on a proven body; angle expansion: same offer, different customer state, pain, desire, objection; net-new concepts: new creator format or use case, which can occasionally halve CPA), 4) produce for diversity, 5) feed learnings into the next brief.
- Test things you think won't work; the market thinks differently from the owner ("don't think like your customer, you're a business owner").
- Budget-based cadence: at about $50/day, one genuinely strong new concept per week beats 15 random variants; at $10,000/day, multiple distinct concepts per week. Always know what is being researched, produced, ready to launch, being tested, and what you learned from the last batch.
- Keep a change log (you will test 50 things in a few months and forget them).
- Diversity beats volume; higher-budget accounts can split ad sets by angle/awareness level; small budgets keep one ad set with a diverse pool.

### 9.5 Four bottlenecks (diagnose before raising budget)
Creative (ads tired or too similar: fix the pipeline), funnel (clicks but no next step: click audit), demand (angle saturated: expand horizontally), operational (cannot convert leads: fix fulfillment, speed to lead, follow-up). Wrong response to all four: keep raising budget.

Fit: ADAPT. Gate, pipeline, bottleneck diagnosis APPLY. Structure: use the $0 to $100/day pattern (one ABO test lane + one broad scaling ad set). "80 to 85% in scaling" is for budgets where both campaigns can function.

---

## 10. Vertical scaling and the 20% rule [05/09, 05/08, structure charts]

- Definition: raise budget on a campaign/ad set already winning; same offer, structure and creative. It asks Meta to expand delivery into pricier inventory and less obvious matches, so performance typically wobbles for 24 hours or so after a change. A single great creative reaches the end of its demand faster than expected.
- The 20% rule is a broad guardrail/ceiling, not a law. Many accounts cannot take 20% without a performance drop; some handle 20% every 24 hours. Conservative default for stable but sensitive or new scaling campaigns: 10% every 48 hours. Mature, high-volume, well-fed pixel accounts can tolerate 20% every 24 hours. Retargeting audiences: 5 to 10% at most (small audiences exhaust and spike frequency; sometimes audience is just too small to scale).
- Meta publishes no universal safe percentage; recommendations "are never accurate"; large jumps send delivery back into learning. Never double or triple (example given: $30 CPA, budget tripled overnight, CPA went to $90 and never came back).
- First scaling campaign needs a budget of at least a few conversions per day to stabilize; early life is rocky.
- Process:
  1. Baseline written down: daily budget, target CPA, number of results, cost per result, downstream business result.
  2. One controlled increase: 10% (new/sensitive account) up to 20% (mature, high volume). Change nothing else (no new creatives, no audience changes).
  3. Log date, time, old budget, new budget, reason.
  4. Observation window: about 48 hours after the first increase (sometimes 72); do not judge or revert on the first 24 to 48 hours.
  5. Evaluate the whole result: volume, CPA/ROAS within range, lead quality/conversion quality, sales, frequency, CPM.
- Three outcomes:
  - Holds: keep new budget until stable, then take another controlled step ("a staircase, not a rocket").
  - Softens but stays profitable (e.g. CPA 40 to 46 against a target of 55 with quality OK): acceptable; marginal customers cost more.
  - Breaks (CPA blows past range, quality drops): do not stack edits; return to the last stable budget if evidence is clear; hold; then diagnose the bottleneck (audience/creative limit, need new angle). Never "keep doubling until it works."
- CBO: budget change at campaign level; Meta redistributes; evaluate the whole campaign and watch whether one ad set takes most of the budget. ABO ad set changes are more contained.
- Pair every budget increase with the next winner already in the pipeline.
- Pre-increase gate: business result (not platform result), enough conversion cycle, know what you are scaling, business can absorb demand.

Fit: ADAPT. For a seasonal local service the binding constraints are crew capacity and service area demand (finite zip codes and homeowners), not Meta's algorithm. 10% steps on a $30 to $60/day budget are a few dollars; Meta likely will not register them as significant, so larger steps at small budgets may be fine; confirm with data (see gaps). Always check technician capacity before raising spend.

---

## 11. Horizontal scaling [05/10]

- Reached only after vertical scaling stalls: CPA climbs, frequency rises, same creative hits the same pool.
- Horizontal = adding independent paths to revenue, not splitting budget. Not horizontal: duplicating the same broad ad set with the same creative, 20 interest stacks, one video with 10 near-identical hooks. Test: can you explain what is different about the new path and why it reaches a different buyer?
- Expansion ladder (closest first):
  1. Concept expansion: new angle, awareness level, emotional trigger, proof mechanism.
  2. Customer state expansion: other people with the problem for a different reason, other use cases, what a skeptical buyer needs vs an eager one.
  3. Offer/product expansion: bundle, new collection, lower-friction lead magnet for colder audiences.
  4. Market expansion: new city/state/country/language (not a targeting setting alone; the business must be ready for it).
  5. Audience hypothesis: lookalike, relevant interest cluster, demographic group, only with a clear hypothesis.
  Creative and customer-state expansion are the highest leverage today.
- Expansion map per winner: write the control (angle/offer/audience); what you believe worked; a horizontal hypothesis (not "more ads"); the asset needed; the business metric that decides success. Four-row exercise: new concept from the same insight; new customer state/awareness/use case; new proof mechanism or format; one offer/product/market/audience hypothesis. Launch ONE properly, not all four.
- Each new route needs its own research, proof, execution. Ad copy must respect Meta's personal-attributes policy (do not say "are you a menopausal woman"; describe the situation, routine or benefit instead).
- Structure: keep the core campaign intact; new concept enters the existing test or scale environment. New campaign/ad set only for a real reason (different objective, retargeting function, new offer/landing page, isolated test unanswerable in core). Same objective + customer + message = consolidate.
- Measure incremental value: new-customer CPA, blended CAC, total revenue; for lead gen qualified applications and downstream quality, not CPL. New audiences/retargeting windows can claim purchases that would have happened anyway. Judge combined numbers, not per ad set (ad sets assist each other).
- Operating loop: diagnose the constraint -> hypothesize one independent path -> build -> test with a clean environment and enough budget -> decide (kill/hold/iterate/move to scaling) -> repeat.
- Instructor: horizontal scaling depends on budget, lifetime value and average order value; not being at this level is normal.

Fit: ADAPT / mostly later-stage. Concept and customer-state expansion APPLY (e.g. new homeowner scenarios: lawn damage, pets/kids safety, mole vs gopher/vole confusion, seasonal triggers). Market expansion maps to adding a service area/GBP location only if crews can reach it. ECOM-ONLY: bundles, collections, add-to-cart/checkout parts.

---

## 12. Decision table for daily/weekly numbers

Replace TARGET with the target cost per booked job (CPBJ) or, on the raw-lead clock, target cost per qualified lead. Apply only if the ad had fair delivery, tracking is correct, and the normal conversion window has passed. Pause only the exact ad, never the whole account/angle.

| # | Situation / metric | Threshold | Action |
|---|---|---|---|
| 1 | Ad, zero results | Spend < 1x target | Observe; verify delivery, tracking, page loads. No pause. |
| 2 | Ad, zero results | Spend about 1.5x target | Diagnose via click audit; find first leak. |
| 3 | Ad, zero results | Spend >= 3x target and conditions above | Pause the execution; log why; plan an iteration. |
| 4 | Ad, 1 to 2 results | Any | Not a winner. Hold with a written review condition (spend, LPVs, or days). |
| 5 | Ad, >= 3 results | CPA <= target | Keep live; earned more data; candidate for graduation. |
| 6 | Ad, >= 3 results | CPA <= 1.3x target | Hold; do not scale; gather evidence. |
| 7 | Ad, >= 3 results | CPA 1.3x to 1.5x | Gray zone: keep only with a named reason. |
| 8 | Ad, >= 3 results | CPA > 1.5x | Pause or iterate, unless downstream value proves it out. |
| 9 | Graduation | Meets target on final event with spend >= about 2 to 3x CPA, repeatable, you can name the angle/hook/proof | Move to scaling campaign (do not edit the original). |
| 10 | Ad barely spending (underserved) | Any | No verdict. If strategic: controlled ABO test or own ad set with minimum spend. Else archive. |
| 11 | CTR(all) high, outbound CTR low | Compare within the ad set | Curiosity/non-intent traffic; rework hook. |
| 12 | Outbound CTR strong, downstream weak | Any | Leave the ad; audit page/form/follow-up. |
| 13 | Outbound clicks >> LPVs | Wide gap | Page speed/in-app/redirect fix before any creative change. |
| 14 | Funnel stage vs own baseline | e.g. 29 LPVs, zero conversions at 10% baseline | Diagnose ad-to-page path; fewer than ~5 events = no information. |
| 15 | Lead contact rate | Zero contacted of 10 leads vs 70% baseline | Audit phone/consent/routing/speed to lead; not the ad. |
| 16 | Raw lead, no lead yet (lead clock) | 1x / 1.5x / 3x raw-lead target | Observe / diagnose form, delivery, location / pause. |
| 17 | Cohort quality (weekly) | Leads aged about 7 days | Compare contact, qualified, booked, show, sale vs control. |
| 18 | Ad set learning status (testing) | Learning / Learning limited | Ignore; judge by CPA and quality. |
| 19 | Ad set learning status (scaling) | Learning limited | Leave if CPA OK and stable; else check event/structure/fragmentation. Fewer than 50 events/7 days: consider upstream event, consolidation. |
| 20 | Any ad set | Last significant edit < several days ago | No further edits except planned ones. |
| 21 | Daily spend vs budget | One day over/under | Ignore; judge on 7-day average. |
| 22 | Performance judged | 1 to 2 days of data | No decision. Use 7 days or the conversion cycle. |
| 23 | Vertical scale, stable campaign | CPA <= target, business can absorb, window passed | +10% (+20% if mature); change nothing else; log; wait 48 to 72 h. |
| 24 | Vertical scale, retargeting | Any | +5 to 10% max; watch frequency. |
| 25 | After increase: holds | CPA in range, quality OK, volume up | Hold until stable; then next step. |
| 26 | After increase: softens | CPA up but under ceiling, quality OK | Accept; continue only if marginal CPBJ below ceiling. |
| 27 | After increase: breaks | CPA > acceptable range or quality drops | Revert to last stable budget; hold; diagnose bottleneck. |
| 28 | Fatigue | CPM rising over a meaningful period AND cost per result worsening in the same creative family | Launch new concepts; do not edit the fatigued ad. (No numeric cutoff given.) |
| 29 | Frequency/CPM spike after scaling | Sharp | Evaluate as part of whole result; likely saturation; more creative diversity. |
| 30 | Ad set hits ceiling | CPA climbing, frequency rising despite small steps | Stop vertical; start horizontal (new concept/customer state). |
| 31 | Ad not spending | Delivery not Active / bid limited / budget too small for event | Fix status/controls/budget first; one change at a time. |
| 32 | New ad $0 in mature ad set | After about a week | Leave it, or own ad set with minimum spend, or ABO test. Never duplicate. |
| 33 | Same downstream leak across angles | Repeated | Fix page/offer/handoff; stop rebuilding ads. |

---

## 13. Weekly optimization routine for Got Moles

Assumes small budget, one ABO testing lane and one broad scaling ad set, booked job as the real outcome. Agent drafts and recommends; Spencer approves every change that spends money (per mkt-cmo rule).

1. Pull the 7-day window (or the full conversion cycle if longer). Do not make decisions from single days.
2. Pull the business outcome first: leads, calls, booked jobs (Jobber/CallRail), CPBJ for the window. Tag each KNOWN / ESTIMATE / UNKNOWN. Compare against target CPBJ and ceiling.
3. Run the mature cohort check: leads that entered about 7 days ago, by ad/angle: contacted, estimate booked, job booked. Compute cost per qualified lead and cost per booked job by angle. Note speed-to-contact; a response problem is not an ad problem.
4. Check what changed: last significant edit dates, budget changes, landing page/offer changes, season/weather shifts. Do not touch anything edited in the past several days.
5. Judge at the ad-set level first; then label each ad: leader / promising / weak after fair test / underserved. Apply the table in section 12 (zero-result lines at 1x/1.5x/3x target; post-3-results lines at 1x/1.3x/1.5x).
6. For any ad at 1.5x with no result or a weak outcome: run the click audit in order (outbound CTR -> LPV gap -> page/form -> call/lead handling -> CRM). Fix the first leak. Do not replace the ad for a page or follow-up problem.
7. Execute the four decisions: kill (record why), hold (write the review condition), iterate (new ad, one change, original untouched), graduate (move proven ad to the scaling ad set).
8. Check for fatigue: CPM trend and cost per result across the same creative family over the week. If both worsen, queue new concepts rather than editing the ad.
9. Decide on budget: if the scaling ad set meets target on booked jobs, the gate passes (including crew capacity and speed to lead), and nothing else changed in the last 48 to 72 hours, increase 10% (retargeting 5 to 10%); log date, old/new budget, reason. If performance broke after the last increase, revert to the last stable budget.
10. Update the pattern log: tags (angle, awareness, proof, format, hook), outcome, observation / hypothesis / next test. Mark anything not yet repeated as observation only.
11. Queue the next test: write the 5-item checklist (hypothesis, variable, constants, business metric, decision rule). One new genuinely distinct concept per week at small budget, drawn from customer language (calls, reviews, objections) and seasonal triggers.
12. Report to Spencer: results by angle, decisions proposed, spend changes needing approval, tests queued. Daily light check only: delivery status, spend, rejected ads, major signals; no structural edits.

---

## 14. Open questions / gaps

Budget mismatch
- Course test budget guidance is 2 to 3x CPA per day. If Got Moles' CPBJ is in the hundreds of dollars, that implies a testing budget of hundreds per day; unlikely. Needs an explicit CPBJ target and budget to see which rules are runnable. Possible workaround: judge tests on the raw-lead / qualified-call clock and review booked jobs in cohorts, not per ad.
- The 3x zero-result stop-loss and "3 results" triage assume a final event that occurs often. At a small local budget, booked jobs per ad per week may be 0 to 2, so most ads will never reach 3 results. The course gives no rule for this case beyond "use the raw-lead clock" and "hold with a condition."
- 50 events/7 days learning exit is unreachable on booked jobs; the course says optimize an upstream event but does not say how deep (lead vs call vs schedule) is acceptable for a service business or how to import booked jobs back to Meta (offline conversions/CRM events were mentioned only in passing).
- 10% vs 20% steps at $30 to $100/day budget: the lesson does not address tiny budgets; absolute dollar changes may be too small to matter, or too large relative to the learning budget. Test empirically.
- No numeric fatigue thresholds (frequency level, CPM % rise, window length). Only "trend over a meaningful period plus rising cost per result." Agent should set a working rule from Got Moles data (suggest 7-day trend minimum) and mark it ESTIMATE.
- Creative pace: course suggests one genuinely strong new concept per week at about $50/day; producing that weekly may exceed what Got Moles can make; the AI-ad rules in mkt-ai-video-ads and claims-gate review also limit speed.
- Test-map chart says 1 ad per ad set per angle; transcript suggests 2 to 3 creatives per angle family at modest budgets. Unresolved; choose by budget.
- Local-service specifics not covered: seasonality (spring/fall peaks; comparing weeks across season changes), geographic saturation (small, finite service area makes frequency rise quickly), call-driven conversions (phone calls not visible in Meta without call tracking), appointment lag between inquiry and job, and crew capacity as a hard ceiling on scaling. Horizontal "market expansion" for a local company means new zip codes, constrained by territories.
- Instant forms vs landing page: course says forms bring lower-quality leads and recommends higher-intent settings and qualifying questions; no numbers on how much quality drops.
- Attribution: lesson assumes the CRM shows source by creative. Got Moles must confirm that Jobber/CallRail can attribute a booked job back to a specific Meta ad.
- Retargeting window sizes and warm-layer rules are only mentioned in passing; no thresholds for when a warm audience is "meaningful."
- Compliance: personal-attribute copy restriction was mentioned (horizontal scaling); no other policy detail in this course module.
