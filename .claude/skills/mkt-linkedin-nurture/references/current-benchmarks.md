# Current LinkedIn Benchmarks — researched 2026-08-21

Live research, not training memory. Re-run this research roughly quarterly, or whenever a
session hits a limit that doesn't match what's written here. Update the date above when you do.

**Read the caveat before trusting the numbers.** Almost every source publishing LinkedIn outreach
benchmarks sells LinkedIn outreach tooling. They have a commercial interest in the activity
looking effective, their samples are their own customers, and none of them are auditable. Treat
these as directional — they tell you which way to lean when you have no data of your own. Once
`pipeline.json` holds thirty or forty real outcomes, **our own numbers beat every figure on this
page** and this file becomes background reading.

---

## Platform limits (2026)

| Limit | Current figure | Notes |
|-------|---------------|-------|
| Connection requests | **~100 per rolling 7-day window** | Same cap across Free, Premium and Sales Navigator |
| Higher threshold | 150–200/week | Granted to accounts with an active profile, acceptance above ~30%, and a strong Social Selling Index |
| Personalized notes (free account) | **~5 per month** | The binding constraint for this campaign |
| Note character limit | **300 characters** | Now reported on every tier; older sources claiming 200 for free accounts appear out of date |

Two consequences worth sitting with. First, the invite cap is not what limits us — 100/week is
far above the 10–15 per session this campaign runs. Second, **the note allowance is the real
ceiling**, and roughly five a month means notes are a scarce resource to be spent deliberately,
not a default.

The acceptance-rate threshold matters more than it looks. LinkedIn raises limits for accounts
above ~30% acceptance and tightens them for accounts below. Sending carefully to well-qualified
people isn't only the ethical choice — it's the one that protects the account's standing.

Sources: [Taplio](https://taplio.com/blog/linkedin-connection-request-limit) · [LeadLoft](https://www.leadloft.com/blog/linkedin-limits) · [LinkedSDR](https://www.linkedsdr.com/blog/linkedin-limits-complete-guide-to-connection-message-view-restrictions) · [Konnector](https://konnector.ai/linkedin-weekly-connection-request/)

---

## Account tiers — what paying actually buys (researched 2026-08-21)

| | Free | Premium Business | Sales Navigator Core |
|---|---|---|---|
| Price | — | ~$60–70/mo | ~$100/mo, ~$80/mo billed annually |
| Connection requests | ~100/week | ~100/week | ~100/week |
| Personalized notes | **~5/month** | No monthly cap | No monthly cap |
| Searches | **~300/month** (commercial use limit) | Raised | ~2,500/month + advanced filters |
| Profile views | 500/day | Higher | ~2,000/day |
| InMail credits | 0 | 15/mo | 50/mo, refunded when they reply |
| Lead lists, saved searches, job-change alerts | No | No | Yes |

The two lines that matter for this campaign are **notes** and **searches**. Everything else is
either identical across tiers (the invite cap — paying buys no extra volume) or irrelevant to
how we work (InMail, which at 15 credits for $60 works out to roughly $4 a message against
connection requests that cost nothing).

Note that Premium Business sits awkwardly: it removes the note cap but unlocks no prospecting
tools, and the consistent advice across sources is to skip it — stay free, or go to Sales
Navigator Core.

**The verdict for us: start free.** The invite cap is identical, our volume is a fraction of it,
the engagement-first tactic that produces the biggest reported lift costs nothing, and the note
scarcity is survivable because bare requests accept *better* anyway — the personalization just
moves to the first message after acceptance, which is unlimited on every tier.

**Upgrade triggers — revisit when any of these is true:**

1. The commercial use limit bites before month-end. Being throttled to three results per query mid-campaign is the one failure that actually stops the work.
2. More than about five prospects a month genuinely warrant a noted invite — i.e. the warm-route pipeline outgrows the free allowance.
3. We want job-change alerts and saved lead lists. A community manager moving firms is the single best buying signal available, and Sales Navigator is the only tier that surfaces it automatically. This is the strongest reason to pay for a *nurture* campaign specifically.
4. Reply data proves the campaign is producing commercial work. Pay for it out of what it earns, not before.

Sources: [EmailChaser](https://www.emailchaser.com/learn/linkedin-sales-navigator-vs-linkedin-premium) · [LaGrowthMachine](https://lagrowthmachine.com/linkedin-premium-cost/) · [ConnectSafely](https://connectsafely.ai/articles/linkedin-premium-pricing-cost-guide-2026) · [PhantomBuster](https://phantombuster.com/blog/social-selling/how-many-messages-can-you-send-on-linkedin/) · [Dripify](https://help.dripify.com/en/articles/8490987-limited-personalized-connection-request-notes-for-free-linkedin-accounts)

---

## The commercial use limit — the free account's real constraint

Free accounts get roughly **300 profile searches per month** (LinkedIn doesn't publish the exact
figure; reported at 250–350). Hit it and you're throttled to **three results per query** until
the first of the next month — which would effectively end a session mid-flight.

**What burns the budget:** searching for profiles, browsing profiles from "More profiles for
you", and viewing people from a company page's People tab.

**What doesn't:** browsing 1st-degree connections, and searching for someone by name.

There's also a hard 500 profile views per day, which we'll never approach.

**How this shapes our sessions.** The extraction technique in `session-runbook.md` already
conserves the budget by design: one search returns 25 rows carrying name, headline, degree and
mutual connections, which is enough to rank and filter *without opening anybody's profile*. Only
the survivors get opened. A session that runs four searches and opens fifteen profiles spends
roughly nineteen; eight sessions a month lands near 150, comfortably inside 300.

Where it goes wrong is careless browsing — clicking through company People tabs or the
"more profiles like this" rail. Avoid both. If a session needs wide browsing, do it deliberately
and log it, because LinkedIn gives no warning and no counter before the limit lands.

Sources: [LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a564226) · [PhantomBuster](https://phantombuster.com/blog/social-selling/linkedin-commercial-use-limit/) · [LeadLoft](https://www.leadloft.com/blog/linkedin-limits) · [LinkedSDR](https://www.linkedsdr.com/blog/linkedin-limits-complete-guide-to-connection-message-view-restrictions)

---

## The note trade-off — this reverses the obvious assumption

The intuitive strategy is to personalize every connection request. The 2026 data says that's
wrong, in an interesting way:

| Approach | Acceptance rate | Reply rate once accepted |
|----------|----------------|--------------------------|
| Request **with** a note | 24–29% | **22%** |
| Request **without** a note | 28–38% | 14% |

A note slightly *lowers* the chance they accept, and materially *raises* the chance they engage
once they have. The likely mechanism: a note makes the request feel like the opening of a sales
sequence, so more people decline — but the ones who accept have self-selected as willing to have
the conversation.

Separately, personalization quality still matters enormously where it's used: personalized
requests are reported at ~45% acceptance against ~15% for generic ones, and short, specific,
non-salesy notes land around 35%.

**What this means for us.** Given roughly five notes a month, spend them on the highest-value
rows — a 2nd-degree prospect with a genuine mutual connection, or someone whose recent post gives
a real anchor. Everyone else gets a bare invite, and the personalization lands in the first
message after they accept, where there's no character limit and no acceptance penalty.

The one behavior the data condemns without qualification: **pitching inside the note**. It is
described as the most consistent way to tank an acceptance rate, because it signals the request
is a vehicle for what follows.

Sources: [Overloop](https://overloop.com/blog/linkedin-outreach-benchmarks) · [Cleverly](https://www.cleverly.co/blog/linkedin-benchmarks) · [SmartReach](https://smartreach.io/reports/state-of-linkedin-outreach/) · [Salesforge](https://www.salesforge.ai/blog/linkedin-conection-acceptance-rate)

---

## Engagement before the invite — the biggest single lever found

Commenting on a prospect's post before any outreach is reported at **2–3x higher reply rates**,
with some campaigns seeing up to 20% of prospects open the conversation themselves before a
sequence ever ran.

The recommended shape is light and short: view their profile, follow their company page, or
leave a genuinely useful comment on a recent post a day or two before the invite goes out.

Why this fits our situation better than anyone else's. Engagement doesn't consume the note
allowance, doesn't count against the invite cap, and doesn't burn one of the limited message
touches. For an account with roughly five notes a month, engagement is the only unconstrained
lever available — which makes it the backbone of the campaign rather than a nice-to-have.

Two supporting facts: LinkedIn's 2026 algorithm counts comments about twice as heavily as likes
in distribution, and engagement from established industry figures reportedly carries 7–9x the
algorithmic weight of random interactions. A thoughtful comment from Spencer on a superintendent's
post is seen by that superintendent's whole audience.

**The hard limit on this tactic:** it only works when it's real. Engagement pods and reciprocal
patterns are detected and shadowbanned without notice. Comments must say something worth reading
or they do more harm than nothing at all.

Sources: [Salesforge](https://www.salesforge.ai/blog/linkedin-commenting-strategies) · [HyperClapper](https://www.hyperclapper.com/blog-posts/linkedin-engagement-tactics-2026) · [Digital Applied](https://www.digitalapplied.com/blog/linkedin-algorithm-2026-engagement-strategy-guide) · [Extrovert](https://www.goextrovert.com/blog/how-to-grow-on-linkedin)

---

## Follow-up cadence

The 2026 consensus is tighter and slightly longer than instinct suggests:

- **Four touches maximum, across roughly 14 days** — commonly days 1, 4, 9 and 14
- Past four messages without a reply, the reported effect is damage to the personal brand rather than diminishing returns
- Follow-ups sent 3–7 days after silence get 2–3x the replies of the first touch
- **The first follow-up adds almost nothing on its own; the second lifts responses by around 4%** — which is the argument for not stopping at two
- One nurturing action produces ~1.07% reply; five produce ~5.26%
- Average LinkedIn message response sits around 10.3%, roughly double cold email's 5.1%
- After the sequence, the advice is to keep nurturing with relevant content at 7–10 day intervals with no meeting pressure

**Our adaptation.** Four messages over about fourteen days, then stop messaging entirely and move
to engagement-only nurture, which can continue indefinitely without being intrusive. The "second
follow-up is where the lift is" finding is the reason to go to four rather than the three this
skill originally specified — but the ceiling stays hard, because the reputational cost lands in a
small regional industry where these people all know each other.

Sources: [Belkins](https://belkins.io/blog/linkedin-outreach-study) · [Chattie](https://www.trychattie.com/blog/linkedin-b2b-prospecting-cadence) · [Overloop](https://overloop.com/blog/linkedin-outreach-benchmarks) · [Prospeo](https://prospeo.io/s/follow-up-messages)

---

## Message length — an open question, not a settled rule

Several 2026 cadence guides recommend keeping every message under 300 characters, including the
follow-ups after acceptance.

Our drafted follow-ups from July run 600–900 characters. They're good — specific, well-argued,
in Spencer's voice — but they are two to three times the recommended length.

This is left deliberately unresolved rather than silently rewritten, because the recommendation
comes from high-volume SDR campaigns targeting a different audience than ours. A community
association manager reading a considered message about their portfolio is not the same reader as
a startup founder receiving forty pitches a day.

**Treat it as the campaign's first real experiment.** Run some short and some long, record which
gets replies in `pipeline.json`, and let our own data settle it within a few sessions.

Source: [Chattie](https://www.trychattie.com/blog/linkedin-b2b-prospecting-cadence)

---

## Reply-rate benchmarks to measure ourselves against

- Post-connection messages average ~10.4% reply
- A good B2B LinkedIn reply rate is 10–25%; strong performers 25–35%; top-tier 35–50%
- Connection acceptance averages 28–30% overall in 2026

Given this campaign is low-volume, hand-researched and frequently warm-routed through mutual
connections, landing at the average would be an underperformance. The relevant comparison isn't
an SDR blasting 500 invites a month — it's what a specialist with a genuine referral network
should expect, which is higher.

Sources: [SmartReach](https://smartreach.io/reports/state-of-linkedin-outreach/) · [Sbl](https://sbl.so/blog/linkedin-outreach-benchmarks-reply-rates/) · [Overloop](https://overloop.com/blog/linkedin-outreach-benchmarks)
