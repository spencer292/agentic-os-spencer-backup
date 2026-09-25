---
project: marketing-in-house
status: active
level: 2
created: 2026-08-26
---

# Marketing In-House — fill the Marketing seat and exit the DigiHammer retainer

## Goal

Bring marketing in-house. Fill the **vacant Marketing seat** on the Ninety accountability chart
with an agent that owns paid acquisition, email and lifecycle, reviews and reputation, social
distribution, offers, and the channel numbers — and retire the DigiHammer retainer once the
in-house replacement is proven to beat it.

Skill: `.claude/skills/mkt-cmo/`. Third seat filled this way, after `acc-cfo` (Finance) and
`ops-hr` (HR), both 2026-08-26.

## Why now

Spencer's assessment of the current arrangement: DigiHammer runs a monthly newsletter out of
HighLevel and some Facebook ads that are "pretty awful… all pretty crappy AI-driven."

Three things make that worth acting on beyond the quality complaint:

1. **The seat is vacant, so nobody owns the numbers.** The Ninety card for Marketing covers paid
   ads, local search, reviews, seasonal and program campaigns, and marketing ROI / cost-per-lead
   tracking. With the seat empty, a vendor has been executing tactics with nobody above him asking
   what a booked job costs.
2. **The best marketing asset Got Moles has is its own book, and it is untouched.** 700 customers
   have bought a one-month Quick Fix twice or more and have never been offered the program. Reaching
   them costs an email and converts transaction revenue into recurring revenue.
3. **Nothing can be judged, because attribution is broken.** 85% of Jobber client records carry
   `leadSource: unknown`. No channel — vendor-run or in-house — can be evaluated until that is
   fixed, which makes it the first real piece of work, ahead of any campaign.

## Decisions taken 2026-08-26 (Spencer)

| Decision | Choice |
|---|---|
| Scope of the seat | **Everything except the website.** Website code, page SEO, schema, blog publishing and all deploys stay with Roy (All The Power). This seat briefs him and holds the numbers |
| DigiHammer transition | **Parallel, then cut.** He keeps running while the in-house replacement is built and proven. No gap in the newsletter or in Meta leads |
| Email platform | **Audit first.** Do not decide HighLevel-vs-migrate before establishing who owns the account, what is in it, and who controls the sending domain |
| Meta ads | **Rebuild in-house, gated.** Agent researches, writes creative and targeting, drafts the campaign; Spencer approves every launch and every budget change |

## Phases

### Phase 0 — Ownership inventory and reclamation *(blocking, do first)*
Establish who owns the Meta Business Manager, the ad account, the pixel and its audiences, the
Facebook and Instagram pages, the HighLevel sub-account, the contact list and unsubscribe record,
the sending domain's DNS, the creative source files, and the analytics properties. Reclaim
everything that is not already Got Moles' — as routine housekeeping, before any audit findings are
shared and long before cancellation is mentioned.

**Why this is first:** the pixel's custom audiences and the unsubscribe record cannot be recovered
after a bad exit. Method in `references/vendor-transition.md`; live checklist in
`2026-08-26_digihammer-audit.md`.

### Phase 1 — Audit
What DigiHammer costs, what he runs, and what it produces — retainer, ad spend, leads, and booked
jobs. Read the actual creative and the actual emails, not the reports about them. Establish an
honest CPBJ per channel or state plainly that attribution does not support one. Findings to
`open-findings.md`.

### Phase 2 — Fix attribution (F-01)
Make lead source required at intake, land CallRail source on the Jobber client record, and close
the ScoreApp quiz-completion loop. This is worth more than any campaign runnable in the same week,
and everything downstream is measured against it.

### Phase 3 — Build the replacement
**Email first**, because it is the highest-return and lowest-risk: the Quick Fix → TMCP conversion
sequence against the 700, then the post-job review ask. **Meta second**: ownership, then Pixel +
CAPI tracking (a brief for Roy), then real local creative — photographed damage, before-and-afters,
the guarantee, named technicians — targeting the book and lookalikes off TMCP subscribers.

### Phase 4 — Parallel run
Both running, split by segment or geography so they never bid against each other. Scoreboard in
`vendor-transition.md` §5, with the cut criterion — a specific CPBJ and a specific date — written
down *before* the parallel run starts.

### Phase 5 — Cut and go BAU
Contract check, handover verification, written notice, ordered access removal, two-week
verification. Then the standing cadence: weekly channel flash, monthly review, quarterly
allocation.

## Acceptance criteria

- [ ] Got Moles owns its Business Manager, ad account, pixel, pages, list and sending domain
- [ ] Full contact list and unsubscribe record exported and verified to open correctly
- [ ] An honest CPBJ baseline exists per channel, or the gap is documented with the fix
- [ ] Lead source captured at intake and landing on the Jobber record — F-01 closed
- [ ] Quick Fix → TMCP conversion sequence live and producing measurable conversions
- [ ] Newsletter shipping in-house on schedule, through the send gate
- [ ] Meta rebuilt in-house at equal or better CPBJ than the incumbent over the agreed period
- [ ] DigiHammer retainer canceled with nothing lost, or deliberately retained for a named part
      of the work with the reason written down
- [ ] Weekly flash and monthly review running on cadence

## Constraints

- **Agent drafts, Spencer decides.** No launch, no budget change, no send without an explicit yes.
- **Claims gate on every customer-facing word** — `.claude/skills/mkt-cmo/references/claims-gate.md`.
  No I-713 claims, no "WA's #1", 283 five-star / 289 total (not "219+"), 15+ years is Spencer's
  experience and the company was founded 2017, moles go in the customer's garbage can.
- **Posture A on all paid** — no mechanism language; the ~120 medical-cluster negatives are mandatory.
- **Website deploys via Roy only.** This seat writes briefs, never ships site code.
- **No cron may spend, bid, publish or send.** Reporting automates; sending does not.
- **US English throughout.**
- Marketing spend ceiling comes from `acc-cfo`; allocation inside it comes from here.

## Dependencies

`acc-cfo` (margin, LTV, the spend ceiling) · `ops-google-ads` (account 1665761172) · `tool-jobber`
and `tmcp-conversion` (book segments) · CallRail · `tool-browser` (platform logins) ·
`mkt-copywriting` + `tool-humanizer` (copy) · Roy (landing pages, tracking, CAPI) ·
`got-moles-marketing-os` (website-lane context; not owned here) ·
`mkt-linkedin-nurture` (commercial outreach; directed here, executed there)

## Status

**Active 2026-08-26.** Skill built. Phase 0 is the next session's work and it is blocking —
no audit conclusions, and no conversation with DigiHammer about the future of the retainer, until
ownership of the pixel, the list and the sending domain is established.
