# Paid Playbook

Google Search, Local Services Ads, Bing, and Meta. Read before touching any ad account.

The hard constraints are in `claims-gate.md` §4 — Posture A, the medical-cluster negatives, and
the LSA rodent classification. They are not optional and they are not restated here in full.

---

## The launch gate

Nothing goes live without all six. No exceptions, including for "just a test at $10/day".

1. **The offer is decided** — what the click gets, in one sentence.
2. **The landing destination exists and converts** — a real page with a phone number, the guarantee,
   reviews, and a form. If it needs building, that is a brief for Roy with a date on it, not a
   maybe.
3. **Tracking is wired end to end** — click → call or form → Jobber record with a source on it.
   A campaign that cannot be traced to a booked job is a donation. See F-01.
4. **Claims gate passed** — Posture A holds, negatives attached, mechanism language absent,
   numbers current.
5. **Kill criterion written down** — the number it must hit, by when, and what happens if it does
   not. In the campaign brief, before spend.
6. **Spencer has said yes** — to this budget and this creative, specifically.

## The kill criterion, in practice

Every campaign gets one at launch. Format: *"$X/day for N days. If CPBJ is above $Y at N days, it
pauses and we reallocate."* Absent a real CPBJ (F-01), use the closest measurable proxy — booked
jobs from the tracking number, or quote requests — and say explicitly that it is a proxy.

Campaigns without a written kill criterion run forever on hope, which is how the previous agency's
account ended up throttled and unnoticed.

---

## Google Search

Driven through `ops-google-ads` (account `1665761172`, API v24). Never hand-edit in the UI what a
script can do reproducibly.

**Structure.** Tight themes, few campaigns. This is a local service business with a small budget —
sprawl is the enemy. Buyer-intent terms and city terms live in separate campaigns because they
behave differently and deserve different budgets.

**The intent gap is the opportunity.** As of 2026-05-31: *"mole exterminator near me"* sat at
position 28 organically and *"mole control near me"* at 38, while biology content ranked at the
top and converted nothing. Paid search exists to own the queries organic cannot reach yet. Bid on
buyer intent, not on education.

**Negatives.** The ~120 medical-cluster negatives in `scripts/_got-moles-existing-negatives.json`
are mandatory on every campaign — "mole" collides with skin moles, mole removal surgery and
dermatology, and without them the account pays for dermatology traffic. Review the search-terms
report every month and add.

**The silent-throttle check.** Read keyword *status* every month, not just performance. Google's
failure mode is **"Eligible (limited)"** — delivery throttled, dashboard green, nobody notices.
That is what happened to the previous agency's account. It is the single most important recurring
check in this playbook.

**Geography.** Target by the actual service map, not by metro name. Territories are bounded by
highways and the peninsula/Thurston edges are expensive to serve — spending to acquire a customer
90 minutes from the nearest route is a marketing win and an operations loss.

## Local Services Ads

Highest-intent inventory available and it works on a per-lead basis with the Google Guaranteed
badge, which pairs naturally with the existing 5.0 across three listings.

**Classification: rodent, not wildlife.** Google removed the Wildlife Removal job type from the
Pest Control vertical in June 2024. Wildlife language on the landing page can take LSA dark with
no error state. `ESTIMATE`, sourced 2026-05-04 — verify against the live LSA vertical before
relying on it.

**LSA disputes are free money.** Wrong-service and out-of-area leads can be disputed and credited.
Nobody does it and it directly reduces CPBJ. Make it a weekly five-minute task.

A launch checklist already exists at `projects/briefs/got-moles-scale/2026-07-21_lsa-launch-checklist.md`.
Read it before starting from scratch.

## Bing

Historically ~25–35% of paid spend and cheap. Older, wealthier, desktop-heavy audience —
which is a reasonable match for the ICP (homeowner, 40s, $700K+ home, cares about the lawn).
Do not dismiss it because it looks unfashionable. Import from Google, then prune separately;
never let it run as an unattended mirror.

---

## Meta — the rebuild

Currently run by DigiHammer and rated poor by Spencer. Rebuild in-house, gated, per the
2026-08-26 decision. Keep the existing spend running until the replacement beats it.

### Before creative: get ownership right

This is the part that cannot be undone later. Do it first — details and the full checklist in
`vendor-transition.md`.

- **Business Manager.** If the ad account sits inside DigiHammer's Business Manager, Got Moles is a
  guest on its own advertising. Got Moles must own a Business Manager and the ad account must live
  in it.
- **The Pixel.** The pixel and everything built on it — custom audiences, lookalikes, retargeting
  pools, learned optimization — is the compounding asset. A pixel owned by an agency may not
  transfer, and audiences built on it generally do not. **Losing this is permanent.** Establish who
  owns it before any conversation about ending the retainer.
- **The Page.** Got Moles must hold admin on its own Facebook and Instagram pages.

### Then: tracking

Browser-side pixel alone loses 30–72% of mobile signal (`ESTIMATE`, sourced 2026-04-17). Meta needs
**Pixel + Conversions API with event dedup** to optimize properly, and CAPI needs server-side
work — that is a brief for Roy, not something this seat ships. Until CAPI is live, Meta
optimization is flying on partial data and the results should be read with that stated.

### Then: what "good" looks like here

The problem with the current ads is not that they are AI-generated — it is that they are generic.
Mole control on Meta is **interruption** advertising: nobody is searching, so the creative has to
stop a homeowner mid-scroll with something they recognize from their own yard.

What works for this business:

- **The damage, photographed.** Real mole hills in a real Western Washington lawn. A homeowner
  scrolling recognizes it instantly. Stock imagery of a cartoon mole does not.
- **Before and after.** The most persuasive asset a mole company owns and the cheapest to produce —
  a tech's phone, two photographs, a date.
- **The guarantee, stated plainly.** $150 setup, pay only that if nothing is caught and the problem
  resolves. Competitors do not offer it.
- **The named technician.** Real people, real trucks, veteran-owned. Local service sells on trust.
- **The quiz as the soft entry.** ScoreApp is a lower-friction yes than "call us" for a homeowner
  who is not ready to book — provided the completion is tracked (OI-02, currently it is not).

What does not work: generic pest-control stock, AI-obvious imagery, mechanism language of any kind
(claims gate §4), and anything that reads like it was written about a category rather than about
a mole in someone's lawn.

### Audiences

The strongest Meta audiences Got Moles has are not interest targets — they are its own book.

- **Customer list uploads** from the Jobber segments (`channel-economics.md`): repeat Quick Fix
  never on a program, ex-program winback, single-job customers.
- **Lookalikes off TMCP subscribers** — the highest-value segment, so model on it, not on all
  customers.
- **Exclusions matter as much as targets.** Never spend to acquire an existing active customer.
  Suppress the active-program list from every acquisition campaign.
- **Geo:** the actual service map, same rule as search.

Customer-list uploads are a data handling step — hashed on upload, and the list itself never enters
the repo. Same discipline as `hr-private/` and `cfo-private/`.

---

## Monthly paid review — the standing checklist

1. Keyword **status** sweep — anything "Eligible (limited)"? (the silent throttle)
2. Search-terms report → new negatives, medical cluster especially
3. CPBJ per campaign vs. last month, with the mix (Quick Fix vs TMCP)
4. LSA disputes filed and credited
5. Landing pages still live, still fast, still carrying current review numbers
6. Budget pacing vs. season — are we spending trough money at peak rates?
7. Anything hitting its kill criterion → recommend the cut, name the reallocation
