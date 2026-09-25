# Org Chart Redefinition — Got Moles, 2026-09-01

Supersedes the 2026-07-22 snapshot and picks up the unfinished Visionary redraft.
Nothing here is in Ninety yet. Approve it in this file first, then enter it in the UI
(the Ninety public API has no org-chart endpoints — chart edits are browser-only).

**Decisions taken this session (Spencer):**

1. Cory comes **completely out of the field** — gradually, not at once.
2. No hire needed — four technicians carry the board once the season turns.
3. Lead Technician owns field standard + training + bids; 4 field days off-season.
4. Muhammad grows **sales depth first**, admin breadth second.
5. The chart is **rebuilt around the roles that actually exist**, not four vacant function seats.

---

## Part 1 — The chart

### Before (2026-07-22)

```
Visionary — Spencer Hill
└── Operator — Cory Ventura
    ├── Marketing — VACANT
    ├── Sales — VACANT
    ├── Operations — VACANT
    └── Finance — VACANT
```

Four of six seats empty. In practice that meant all four functions defaulted back to Spencer,
and Cory's Operator seat was a title sitting on top of a full technician route.

### After

```
Visionary — Spencer Hill
│   holds: Marketing · Finance  (agent-assisted, see note)
└── Integrator — Cory Ventura
    │   holds: Operations
    ├── Lead Technician — Tavis Alexander
    │   └── Technicians — Alias Franks · Robert Norton · Luke LaVergne
    └── Office & Sales — Muhammad Javed
            holds: Sales
```

Five seats, five names, nobody unaccounted for. The four function accountabilities did not
disappear — they were folded into the seat that actually performs them, with the succession
note written beside each:

| Function | Held by | Comes out when |
|---|---|---|
| Marketing | Spencer, drafted by `mkt-cmo` | A marketing hire, or the DigiHammer exit stabilises and it stays in-house |
| Sales | Muhammad, coached by Spencer | Muhammad's TMCP mix reaches Spencer's — then it is fully his |
| Operations | Cory | Never — this is the Integrator's core |
| Finance | Spencer, drafted by `acc-cfo` | A bookkeeper or controller, or it stays modelled and Spencer only approves |

The agent skills draft, model and check. A **person is accountable for the number**. That
distinction is what keeps this an org chart rather than a tooling diagram.

---

## Part 2 — The constraint that drives everything: the season

Cory's exit is gated on volume, so the volume curve had to be measured rather than assumed.
Pulled 2026-09-01 from live Jobber: **27,733 visits across 24 months**
(`data/visit-seasonality.csv`, rebuild with `scripts/visit-seasonality.mjs`).

| Month | 2025 visits | 2026 visits | YoY |
|---|---:|---:|---:|
| June | 1,057 | 1,616 | +53% |
| July | 1,556 | 2,372 | +52% |
| August | 1,451 | 2,506 | +73% |
| September | 1,479 | — | |
| **October** | **1,697** ← peak | — | |
| November | 1,107 | — | |
| December | 972 | — | |
| January | 902 ← trough | — | |

### The correction

**Peak season does not end in September. October is the single biggest month of the year.**
In 2025 October ran 15% above August and 15% above September. The board does not shrink until
**November**, where it drops 35% in one month, and it keeps falling to a January trough.

This matters because the plan as first stated — start stepping Cory out now, as it begins to
rain — would step him out *into* the heaviest four weeks of the year. Rain and mole activity are
not the same signal: the rain arrives in October, the workload relief arrives in November.

### What four technicians can carry

Current board, week of 2026-08-31: 556 visits across five techs.

| Tech | Visits/wk | Hours/wk | Note |
|---|---:|---:|---|
| Tavis Alexander | 123 | 47h30 | Three days past 9 hours |
| Alias Franks | 122 | 41h01 | Best catch rate, 0.30/visit |
| Robert Norton | 118 | 38h46 | Most efficient, 355 mi |
| Luke LaVergne | 97 | 39h54 | 48% drive time — peninsula geography |
| **Cory Ventura** | **96** | **28h52** | Salaried, no Friday, Wednesday ends 12:49 |

The four without Cory carry **460 visits/week ≈ 2,000/month** at 39–47 hours. That is the
ceiling before overtime. Projecting 2025's shape onto 2026's growth (×1.6):

| Month | Projected volume | Four techs cover it? |
|---|---:|---|
| Sept 2026 | ~2,370 | **No** — Cory stays on route |
| Oct 2026 | ~2,715 | **No** — peak, Cory stays on route |
| Nov 2026 | ~1,770 | **Yes** — first month it fits |
| Dec 2026 | ~1,555 | Yes, with room |
| Jan 2027 | ~1,350 | Yes, comfortably |

**November is the month Cory can start coming off the route.** Not September.

### The finding nobody asked for

Run the same projection forward to next peak. July–October 2027 at continued growth lands around
**3,500–4,000 visits/month**. Four technicians top out near 2,000. Even at flat growth, next peak
needs a fifth technician — and the only sane time to hire and certify one is the **trough,
February–May 2027**, when there is capacity to train and a Lead Technician free to do it.

Hire in the trough, or Cory goes back on a route next August. That is the whole reason the Lead
Technician seat exists.

---

## Part 3 — The seats

### Seat 1 — VISIONARY · Spencer Hill

Roles 1–3 were approved 2026-07-22 and carry forward unchanged. Roles 4–7 are the unfinished
work, rewritten here against current reality.

#### 1. VISION & STRATEGIC DIRECTION — approved 2026-07-22

- Own the growth model: set the annual revenue target and the 3-year picture ($857K trailing-12 → the $5M path), updated each December
- Decide which territories and markets we expand into and when
- Set quarterly strategic priorities and translate them into Rocks at the quarterly session
- Watch the market — competitors, pricing, demand shifts — and reposition before we are forced to
- Balance growth pace against field capacity: growth never outruns our ability to serve

**Measurables:** annual target and 3-year picture written and reviewed at annual planning · every quarterly Rock traces to a stated priority · weekly leadership scorecard reviewed.

#### 2. BUSINESS DEVELOPMENT & PARTNERSHIPS — approved 2026-07-22

- Be the face of Got Moles — public presence, veteran-owned story, community visibility, the networking circuit, and on-camera talent; production is the marketing function's job, not Spencer's
- Own the relationships that open commercial doors: HOAs, municipalities, golf courses, property management. **Bids themselves go to Tavis, backed by Cory**
- Build referral partnerships that feed leads: pest control, landscaping, real estate
- Keep the bid function healthy — pricing guardrails, documented process, a trained bidder
- Negotiate partnership terms and first-of-kind commercial contracts only

**Measurables:** zero bids performed by Spencer · partnership leads visible in lead-source tracking · at least one new partnership conversation per quarter.

#### 3. MARKET POSITIONING & BRAND STRATEGY — approved 2026-07-22

- Own positioning and messaging — chemical-free, safe for pets and children, professional methods — and approve any change to core claims
- Set pricing strategy and the phone-quote tier card; review at least annually
- Own marketing strategy and budget: decide the channel mix and what gets funded
- Approve, do not produce, campaigns and customer-facing work that touches brand claims
- Monitor competitors and adjust positioning before we are undercut

**Measurables:** claims guardrail doc current · pricing card reviewed annually against margin data · marketing spend and cost per booked job on the scorecard · review count growing (289 total / 283 five-star baseline).

#### 4. INNOVATION, SYSTEMS & AUTOMATION — needs your react

Renamed from "Innovation & New Opportunities". The 2026 reality is that the innovation *is* the
automation stack, and it deserves to be named in the seat rather than implied.

- Identify and green-light new offerings and revenue streams — TMCP is the model: recurring beats one-off
- Own the test / scale / kill decision on anything new. No experiment runs without an owner, a budget and a kill criterion
- Drive systematisation and automation — routing, cadence, phone training, marketing ops, the CFO and HR seats — so revenue grows faster than headcount
- Evaluate expansion opportunities as they arise: adjacent territories, competitor books of business
- Bring outside ideas in

**Measurables:** every active experiment has an owner and a kill criterion · at least one meaningful system shipped per year (2026: the routing and cadence engine, the in-house CFO/HR/CMO seats) · **revenue per field technician climbing year over year** — the honest test of whether the automation is working.

> Open: is acquisition genuinely on your radar, or should that bullet be cut?

#### 5. CULTURE, VALUES & TEAM LEADERSHIP — needs your react

- Articulate and reinforce the core values; set the cultural tone
- Define culture fit for hiring, and hold final say on any leadership hire
- Recognise wins publicly — catch leaderboards, review mentions, clean-note streaks
- Model the behaviour expected: the standard is what Spencer does, not what he says
- Keep the veteran-owned identity authentic rather than decorative
- Handle culture issues Cory escalates — and **only** those he escalates

**Measurables:** core values documented and referenced in reviews · retention: no regretted departure in a rolling 12 months · every technician has had a documented conversation about their own numbers this quarter.

> The core values exist — they are on the poster behind Spencer's desk. They are not anywhere in
> this system, which means no skill can reference them, they cannot appear in a job description,
> an interview guide, or a review, and a technician in Gig Harbor has never seen them. Getting
> them off the wall and into `brand_context/` is a ten-minute job, not a Rock.

#### 6. FINANCIAL STRATEGY — needs your react

- Set financial goals beyond revenue: gross margin per job, cash reserve floor, owner draw floor
- Decide capital allocation — growth vs. reserves vs. distributions
- Approve capital expenditure above a stated threshold (**set the number; it does not exist yet**)
- Set the guardrails: minimum reserve, maximum debt
- Decide build-to-sell vs. lifestyle, and let that decision drive everything else
- Review the monthly close and the weekly cash flash produced by `acc-cfo`

**Measurables:** monthly close reviewed within 10 days of month end · cash reserve at or above the floor · every recommendation seen through all three lenses — cash this year, profit, enterprise value.

> Open: three numbers are missing and only you can set them — the capex approval threshold, the
> cash reserve floor, and the owner draw floor. `acc-cfo` cannot model against blanks.

#### 7. SUPPORT & EMPOWER THE INTEGRATOR — needs your react

- Weekly Level 10 with Cory — non-negotiable, and the first thing that must survive a busy week
- Decide within 48 hours when Cory is blocked on a decision
- Remove roadblocks: budget, authority, tools, people
- Give the "why" behind strategic direction, not just the "what"
- Listen to operational reality and adjust strategy when it says you are wrong
- **Stay out of operations unless Cory escalates** — this is the role that fails most often, and it fails by good intentions

**Measurables:** L10 held every week (attendance tracked) · decisions returned inside 48 hours · Cory's Rocks on track · quarterly check-in where Cory says plainly whether he feels supported.

---

### Seat 2 — INTEGRATOR · Cory Ventura

Renamed from Operator. The word matters: Operator implies running the day, Integrator implies
making the parts fit and holding people accountable. Cory is moving from the first to the second.

**The seat's one job:** the business runs correctly without Spencer in it.

#### 1. RUN THE OPERATING RHYTHM

- Own the weekly Level 10: agenda, scorecard review, issues list, and closing every issue to done
- Hold the quarterly Rock process — set them, track them, call them on or off track honestly
- Run a documented one-to-one with each technician and with Muhammad, monthly minimum
- Own the scorecard weekly: visits completed, catch rate, hours by tech, TMCP mix, close rate, review velocity, AR

**Measurables:** L10 held 48+ weeks a year · every Rock has a status every week · every direct report has a documented monthly conversation.

#### 2. OWN OPERATIONS END TO END

- The route board: territory integrity, day balance, hours by tech, cadence compliance
- Scheduling and dispatch standards — and the escalation path when a day breaks
- Field quality through the Lead Technician: note standards, catch rate, callbacks, complaints
- Equipment, traps, vehicles, supplies — nobody starts a day short
- Customer escalations that a technician or Muhammad cannot close

**Measurables:** no technician over 45 hours outside peak · zero weekend visits · cadence compliance ≥ 95% (any activity → weekly; `N/A` with no catch → monthly; a catch → weekly regardless of code; Quick Fix always weekly) · escalations closed within 48 hours.

#### 3. LEAD THE TEAM

- Own hiring for every field and office seat below him — Spencer approves the finalist only
- Own onboarding through to solo certification, delivered by the Lead Technician
- Own performance: the coaching conversation, the written warning, the improvement plan, the exit — drafted with `ops-hr`, decided by Spencer where the legal risk is real
- Hold the standard when it is inconvenient

**Measurables:** every new tech certified against the sign-off sheet before running a route solo · every performance conversation documented the same day · no personnel decision made without a written record.

#### 4. SYSTEMS AND PROCESS

- Every recurring operational task is documented, owned and repeatable — the test is whether a stranger could run it from the file
- Own the field-facing side of the automation stack: routing, cadence, texting, the service-day sheet
- Kill process that has stopped earning its keep

**Measurables:** every core operational process has a written owner and a written procedure · no process runs only because Cory remembers it.

#### 5. COMMERCIAL BIDS — backstop

- Tavis is the bidder. Cory is the second pair of eyes on price, scope and terms, and the bidder of last resort when Tavis is unavailable
- Own the bid template, the pricing guardrails and the win/loss record

**Measurables:** every commercial bid logged with its outcome · bid response inside 48 hours of the request.

#### The field exit ladder — the part that will be tempting to skip

Cory is the highest-producing technician on the board: 635 visits and 181 catches in August, more
than anyone. Removing him from production is a real cost, paid deliberately, because an Integrator
who runs a route does the route and postpones the integrating. Every week.

| Stage | Window | Field days | Management time | Gate to advance |
|---|---|---:|---|---|
| **0 — now** | Sept–Oct | 4 (unchanged) | Protect the existing headroom: Friday and Wednesday afternoon become management time, blocked on the calendar and never backfilled with stops | Peak passes |
| **1** | November | 3 | +1 day | No tech over 45h for two consecutive weeks |
| **2** | December | 2 | +1 day | Cadence compliance holding ≥ 95%; catch rate steady |
| **3** | January | 1 — float only, covering absence | +1 day | L10 and one-to-ones running every week without Spencer chasing |
| **4** | February | 0 | Full seat | Fifth-technician hire opened for the spring training window |

Two rules make the ladder real rather than aspirational:

1. **A stage never advances on the calendar alone** — the gate has to be met. If November is heavier than projected, Stage 1 waits.
2. **A stage never reverses to absorb overflow.** If a day is short, the answer is the route board, the cadence rules, or the float — not Cory's calendar. The single exception is genuine emergency cover, logged as an exception, and never twice in a row.

Stage 0 starts now and costs nothing: his Friday is already empty and Wednesday already ends at
12:49. That headroom exists — it has simply never been *named* as management time, so it gets
eaten. Naming it is the whole intervention.

---

### Seat 3 — LEAD TECHNICIAN · Tavis Alexander (new seat)

This seat exists because Cory is leaving the field and field quality has to survive him. It is not
a reward for being busy; it is the seat that owns whether a Got Moles visit is done right.

**Territory:** T2 — I-90 south to SR-18 (Renton, Newcastle, Maple Valley, Covington, south
Issaquah, Seattle south of I-90, Burien, Tukwila, SeaTac, Des Moines), taken over from Cory on
2026-08-17. Snoqualmie stays deliberately his despite the territory map — do not let
`assign-by-territory` hand it back to Alias.

#### 1. HOLD THE FIELD STANDARD

- Own what a correct visit looks like: the two-loop walk, the read, the set, the departure, the note
- Ride along with each technician at least monthly and score against the ride-along card
- Own note quality — the note is the only evidence a visit happened correctly, and it is what the cadence engine reads. A miss that goes unrecorded is a visit that never gets followed up
- Investigate catch-rate outliers before anyone concludes anything about effort. Robert sits at 0.23 catches per visit against a 0.25 pack average — quiet ground and slow hands look identical on a spreadsheet and completely different in person

**Measurables:** every technician ridden with monthly · note completeness ≥ 95% of completed visits (August baseline: 28% of notes had no mole mention at all) · pack catch rate flat or rising month over month.

#### 2. TRAIN

- Own the technician training program end to end — the field guide, the modules, the ride-along cards, the competency sign-off
- Take every new hire from day one to solo-certified, and be the one who signs the certification
- Deliver the correction when a technician drifts off standard, before it becomes Cory's problem

**Measurables:** training materials current, with every confirmed erratum folded in · nobody runs a route solo without a signed sign-off sheet · new hire to solo-certified inside the agreed window.

#### 3. COMMERCIAL AND LARGE-PROPERTY BIDS

- Perform in-person bids: all commercial, and all residential over 5 acres. Never quoted by phone
- Walk the property, price against the guardrails, and record the outcome
- Log every bid. Cory reviews price and terms

**Measurables:** bid delivered within 48 hours of request · win rate tracked · zero commercial jobs priced over the phone.

#### 4. RUN A ROUTE

- Full route through peak. **4 field days + 1 lead day from November**, when the season makes room — the same month Cory begins stepping off, which is exactly when field quality is most at risk

**Measurables:** own route hours under 45 outside peak · lead day protected and never backfilled with stops.

> **Capacity note.** Tavis is currently the busiest tech on the board at 47h30 with three days past
> nine hours. This seat adds no field duties during peak — Stage 0 for him is the same as for Cory:
> nothing changes until November. Loading a lead day onto a 47-hour week means the lead work never
> happens.

---

### Seat 4 — OFFICE & SALES · Muhammad Javed

Live on the phones since 2026-08-07. Today: answers calls, quotes, books. That is roughly a third of
the seat. The growth is staged deliberately — **sales depth first, admin breadth second** — because
widening scope while the core number is half Spencer's only spreads the gap wider.

#### The number this seat lives on

Measured 2026-09-01 against live Jobber quotes since June, plus 15 sales calls read in full:

| | Muhammad | Spencer |
|---|---:|---:|
| Wins | 85 | 227 |
| …that are TMCP | **22%** | **48%** |
| Quotes sent that are TMCP | 29% | 47% |
| Leads who never receive a TMCP quote at all | **69%** | 48% |
| Both quotes sent → TMCP won | **0 of 9** | 14 of 17 |

The gap is not closing ability. It is **what gets offered.** Seven of ten of his leads never receive
a TMCP quote, so the decision is over before anything reaches an inbox. And on 14 of 14 calls Quick
Fix went first, with the full apparatus attached — price, deposit, split, and the no-catch guarantee
— while TMCP arrived second as a feature list with no argument in it. Beat 5 ("it is not if they
come back, it is when") arrived before the price **zero times** in fifteen calls. That beat is the
entire reason to buy the annual plan.

At roughly $6,400 a year of value per point of TMCP mix, closing half this gap is worth $55–60k a
year. It is the largest single unclaimed number in the business.

#### Stage 1 — Sales depth (now → the gate)

- Answer every inbound call to the five-beat standard, **beat 5 before any number**
- Lead with TMCP. Quick Fix is the fallback for a customer who declines the program, not the opening offer
- Send both quotes only when the customer genuinely needs the comparison — and when both go out, the call has already decided it
- Own quote follow-up: no quote sits unchased (`quote-chase` runs 09:00 weekdays)
- Work the daily call grading and the coaching plan; keep the role-play log moving

**Gate to Stage 2:** TMCP share of quotes sent ≥ 40% **and** TMCP share of wins ≥ 35%, held three
consecutive weeks. Reviewed in his monthly one-to-one with Cory.

#### Stage 2 — Billing and money (after the gate)

- Own the autopay conversion. **277 hand-billed clients already hold a card on file — roughly $32k a month** sitting on manual toggles, and TMCP autopay is only 31% on (212 of 809). This is money already agreed, simply not automated
- Own AR: what is owed, who is late, who gets the call
- Own billing accuracy — the right product on the right job

**Measurables:** TMCP autopay share climbing weekly · AR over 30 days falling · zero billing corrections triggered by a customer complaint.

#### Stage 3 — Scheduling and dispatch (later)

- Book into the correct service day using the service-day lookup — **built from real Jobber visit history at 90% accuracy, not the territory grid at 73%**
- Handle reschedules, cancellations and arrival-window questions
- Be the first line on customer escalation, passing to Cory only what he cannot close

**Measurables:** bookings landing on the correct service day · reschedules handled without breaking a route.

#### Standing rules for this seat

- Residential 5 acres and under is quoted by phone: Quick Fix $450 / $500 / $600 by acreage plus the $150 setup fee; TMCP $100 / $125 / $150 a month
- **Commercial of any size, and residential over 5 acres, is never quoted by phone.** Capture property type and acreage, then hand to Tavis for an in-person bid
- Never claim I-713 compliance. Chemical-free, safe for pets and children, professional methods
- Dead moles are double-bagged into the customer's own garbage can. Never say "hauled away"

---

### Seat 5 — TECHNICIANS · Alias Franks · Robert Norton · Luke LaVergne

One shared role. One territory each, one owner each, no shared ground.

| Tech | Territory | Boundary |
|---|---|---|
| Alias Franks | T1 — North | Everything north of I-90; the Bellevue line runs to NE 8th St; Snoqualmie Valley as one unit **except Snoqualmie itself, which is Tavis's** |
| Tavis Alexander | T2 — Central | I-90 south to SR-18 (see Lead Technician) |
| Robert Norton | T3 — South | SR-18 to SR-410, west along SR-167 to Tacoma/I-705; Kent splits at SR-516 |
| Luke LaVergne | T4 — West and South | From I-705 west and south: Tacoma, the Gig Harbor peninsula, Thurston, Eatonville, Graham, Orting |

Three boundaries cannot be expressed as zip lists and resolve per address from coordinates:
`thurston-i5-101`, `bellevue-ne8th`, `sr-516`. Federal Way (98003/98023) is lent to Luke as a
temporary override, not a boundary — it returns to Robert.

#### The role

**1. Run the route to standard.** Every scheduled visit, every day. The two-loop walk, the read, the
set, the departure. Knock on the first visit only; repeat visits go straight to the property
evaluation. No answer plus service completed means send a text — we do not have door hangers.

**2. Write the note.** Non-negotiable, and the most under-performed part of the job today. The note
is the only record that the visit happened correctly, and it is the input the cadence engine reads.
Activity code, catch count, **misses**, next action. A miss is activity — a trap hit that did not
hold means a mole was working and got away. Old dried mounds are not activity. In August, 28% of
notes contained no mention of moles at all.

**3. Serve the customer in front of you.** The conversation at the door is the marketing budget we
do not have to spend. Answer honestly, explain the method, never overclaim. Reviews come from here.

**4. Sell what you see.** A Quick Fix customer with continuing activity is a TMCP conversation, and
the technician standing in the yard is the most credible person alive to have it — the field upsell
converts at 21% today with a 38-day median lag, and only 41% of upgrades happen inside the five-week
series. When a Quick Fix series is exhausted with activity outstanding, **flag it — never auto-add a
sixth visit.** That is a sales decision.

**5. Look after the truck and the kit.** Traps, tools, vehicle. Nobody starts a day short.

#### Measurables — the same four for every technician

| Measure | Standard |
|---|---|
| Visits completed vs. scheduled | ≥ 98% |
| Catch rate per visit | At or above pack average (currently 0.25) |
| Note completeness | ≥ 95% of completed visits, with activity, catches and misses |
| Callbacks and complaints | Trending to zero |

#### What each one is carrying right now

- **Alias** — 122 visits a week, 41h. Best catch rate on the board at 0.30 per visit. The benchmark, and the ride-along the other techs should get.
- **Robert** — 118 a week, 38h46. Most efficient router at 355 miles. Catch rate 0.23 against a 0.25 average — **investigate the ground before the person.** T3 may simply be quieter.
- **Luke** — 97 a week, 39h54, but 585–1,010 miles and 48% drive time. Fewest stops for the most hours, and that is geography, not pace. The peninsula is the structural inefficiency on this board and deserves a routing review of its own.

> Never compare technicians by visit count. Drive minutes per stop range from 4.5 to 18 across this
> board — 97 stops can outweigh 146. Compare hours.

---

## Part 4 — What each seat works on next

| Seat | Now (Sept–Oct, peak) | From November |
|---|---|---|
| **Spencer** | Finish roles 4–7 in this file · write the core values down · set the three missing numbers (capex threshold, reserve floor, draw floor) · hold the weekly L10 | Hand Marketing and Finance decisions to the modelled recommendation; approve rather than produce |
| **Cory** | Stage 0: block Friday and Wednesday afternoon as management time and defend it · stand up the L10 and the monthly one-to-ones · take the scorecard | Stage 1: 3 field days · own hiring for the spring fifth tech |
| **Tavis** | Full route · take bids over from Cory · start monthly ride-alongs with the existing four | Stage 1: 4 field days + 1 lead day · own the training program · prepare to train the fifth tech |
| **Muhammad** | Stage 1 only: TMCP mix. Beat 5 before the price, lead with the program · daily grading · quote follow-up | Stage 2 on gate: autopay conversion and AR — the off-season is the training window |
| **Technicians** | Route to standard · **note completeness is the one thing to fix this quarter** · flag exhausted Quick Fix series with activity | Field upsell push into the quiet months · ride-alongs |

### The three things that decide whether this works

1. **Cory's calendar gets defended, or it does not.** Everything else follows from that single habit.
2. **Note completeness.** At 28% of notes silent on moles, the cadence engine is running on partial information and the catch numbers are estimates. Cheapest fix on the list.
3. **The fifth technician is hired in the trough, not in the panic.** February–May 2027. Miss that window and Cory is back on a route next August, and this document was a nice afternoon.

---

## Part 5 — Open items

**Needs Spencer's decision:**

- Roles 4–7 of the Visionary seat: approve, amend or cut
- Core values: they exist on the poster behind your desk. Photograph it or type them out and they go into `brand_context/` — after that they can be quoted in job descriptions, interview guides, reviews and onboarding, none of which can reference a poster
- Capex approval threshold · cash reserve floor · owner draw floor
- Is acquisition genuinely on the radar, or cut that bullet from role 4?
- Titles: "Integrator" over "Operator", and "Office & Sales" over "Office Manager" — your call

**Needs doing, gated on approval:**

- Enter the chart and every seat's role text into Ninety (browser UI — the public API has no org-chart endpoints)
- Update the phone scripts and the callrail-faq answer key: bids route to **Tavis**, not Cory
- Update `CLAUDE.local.md` — the 2026-07-22 bid-ownership rule still reads "Cory (Tavis when he returns)"; he has returned
- Create personnel files under `projects/briefs/hr-in-house/people/` for all six. None exist yet
- Add TMCP mix by seller, note completeness, and hours-by-tech to the Ninety scorecard

**Assumption flagged:** the November projection applies 2025's monthly shape scaled by 1.6. If growth
holds at August's +73%, November lands nearer 1,900 and Stage 1 tightens. Re-run
`scripts/visit-seasonality.mjs` at the end of October and check the gate against the real number
before Cory drops a day.
