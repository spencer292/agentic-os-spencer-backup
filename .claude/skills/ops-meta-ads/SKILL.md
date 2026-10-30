---
name: ops-meta-ads
description: >
  Plan, build, run, optimize and report Got Moles' Meta (Facebook/Instagram) ads, so Spencer never
  has to learn Meta ads himself. Built from The Meta Ads Arena course (Dan Edmund, Skool, harvested
  2026-10-29: 96 lessons, ~206k words) and adapted to a local, phone-first, seasonal service with a
  small budget. Modes: SETUP (Business Manager, pixel/CAPI, account safety), PLAN (offer, angle,
  campaign brief with kill criterion), BUILD (field-by-field campaign build in Ads Manager, drafted
  paused), OPTIMIZE (weekly two-clock review: raw-lead clock + booked-job cohort from Jobber/
  CallRail, kill/hold/iterate/graduate, scaling gate), REPORT, RESCUE (restricted account, appeals).
  Drives Ads Manager through tool-browser, or the Meta Marketing API once a token exists. Triggers on
  "meta ads", "facebook ads", "instagram ads", "run the meta campaign", "build a facebook campaign",
  "check the facebook ads", "how are the meta ads doing", "weekly meta review", "kill or keep",
  "scale the meta ads", "ad account restricted", "facebook rejected my ad", "set up the pixel",
  "meta ads report". Spencer approves every launch, budget change and spend. Does NOT trigger for
  making the creative itself (mkt-ai-video-ads), marketing strategy and channel budget split
  (mkt-cmo, which directs this skill), Google Ads (ops-got-moles-ads), or site code / pixel install
  on the website (Roy).
---

# ops-meta-ads: run Got Moles' Meta ads

Spencer's instruction (2026-10-29): *"I don't want to learn anything here. I want you to learn
everything, and when we decide to make Meta ads, you either tell me what to do or just drive the
browser."* This skill is that knowledge, in operating form. Spencer's job is approvals, logins and
real photos. Everything else is the agent's.

## Chain of command

- **`mkt-cmo`** owns strategy: whether Meta gets budget, how much, which offer, and the CPBJ target.
  It hands this skill a decision; this skill turns it into campaigns and numbers.
- **`mkt-ai-video-ads`** makes video creative. Static images and copy can be produced here using
  course-b, through the same gates.
- **Roy** owns the website: pixel install, CAPI, landing pages, CallRail number insertion on pages.
  This skill writes the brief; Roy ships it.

## Hard rules (never relaxed)

1. **Spencer approves before any spend.** Every launch, budget change, new ad going live, audience
   upload and un-pause. Build everything as paused drafts; show the build; wait for a yes that
   names the budget. No cron ever spends, launches, edits or uploads.
2. **Claims gate on every word and picture**: `mkt-cmo/references/claims-gate.md`. AI creative also
   passes `mkt-ai-video-ads/references/ai-ad-gate.md`. Posture A covers images: no traps, no dead
   moles, no mechanism. The skin-mole homograph: every ad reads as lawn and yard in the first second.
3. **No fake customers.** No invented reviews or testimonials, no AI person speaking as a customer.
   The course recommends fake-review-style ads; that tactic is banned here.
4. **CPBJ, not CPL.** Report cost per booked job, payback and mix effect. Every figure is tagged
   `KNOWN` / `ESTIMATE` / `UNKNOWN`.
5. **One change at a time, logged** in `projects/briefs/meta-ads/change-log.md`.
6. **Account safety first.** A restricted ad account costs more than any bad campaign. Never make
   bulk or rapid edits, never use automation that looks like a bot, never retry a rejected appeal
   more than once.

Where the course and Got Moles disagree, **`references/got-moles-operating-rules.md` wins.** Read it
before any mode.

## How the agent drives Meta

| Route | When | Notes |
|---|---|---|
| Tell Spencer what to click | Spencer prefers it, or the account isn't accessible to the agent | Give numbered click paths from course-c, one screen at a time |
| `tool-browser` (Ads Manager in the persistent Chrome profile) | Default today: no API token exists | Human pace, one action per step, screenshot before and after each write. Read-only browsing is free; **every write needs Spencer's explicit yes for that specific change.** Meta renames fields often: screenshot, reconcile against course-c, then act. |
| Meta Marketing API | Once a System User token is set up in Business Manager (`META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` in `.env`) | The sanctioned automation route and the safer one for the account. Reads for reporting; writes only after approval. Not built yet. |

## Modes

### SETUP: before the first campaign
Read course-a (§ account setup, tracking, Vault 1). Produce a checklist with the current state of
each item, verified live, not from memory:
- Business Manager and ad account **owned by Got Moles**, not DigiHammer (see `mkt-cmo/references/
  vendor-transition.md`). Who owns the pixel. Admin on the Facebook and Instagram pages.
- 2FA required for everyone; domain verified; two admins; payment method and threshold.
- Pixel + CAPI with dedup, firing once on a real lead (Events Manager test events, match quality
  7+). Custom conversion for the lead. Dynamic UTMs. → Brief for Roy if anything is missing.
- CallRail number insertion on the Meta landing page so calls carry a source.
- Naming convention (course-a) and the change log file created.

### PLAN: one campaign brief per launch
Write `projects/briefs/meta-ads/campaigns/{YYYY-MM-DD}_{name}.md` with: the one offer, the angle(s)
(course-b angle card + five filters), target and ceiling CPBJ, derived target CPL
(operating-rules §1), budget, test structure (course-d five-item test checklist), the kill
criterion in `mkt-cmo` paid-playbook format, the landing page, creative list, and the launch gate
from `mkt-cmo/references/paid-playbook.md` (all six items). Spencer signs off on the brief.

### BUILD: field by field
Follow course-c §15 (first-launch build spec) and its §2 "make sure this is OFF" audit, with
operating-rules §5 geography. Build paused. After Spencer approves and it goes live, reopen every
level and re-check the OFF list (Meta flips some settings back on publish).

### OPTIMIZE: weekly (plus a light daily check)
Run course-d §13 weekly routine with the decision table in course-d §12, on the two clocks from
operating-rules §1. Daily check is read-only: delivery, spend, rejected ads, anything broken. No
structural edits mid-week. Output: what is working by angle, proposed kills/holds/iterations/
graduations, budget changes that need approval, next test queued.

### REPORT
Course-e reporting template mapped to CPBJ: spend, CPM, frequency, outbound CTR, LPV, leads, calls
(CallRail, Meta source), contacted, quoted, booked (Jobber), CPL, CPBJ, payback. Weekly to Spencer;
monthly into the `mkt-cmo` marketing report.

### RESCUE: rejected ads, restricted account
Course-a Vault 2 appeal ladder exactly as written: diagnose, one clean appeal, identity
verification steps, Meta Verified support. Never spin up a new account to dodge a restriction.

## References

| File | Read when |
|---|---|
| `references/got-moles-operating-rules.md` | **Always.** Overrides the course. |
| `references/course-a-setup-tracking-safety.md` | SETUP, RESCUE, metrics and break-even math, offer/avatar work |
| `references/course-b-creative-copy.md` | Writing copy, briefing creative, choosing angles and formats |
| `references/course-c-campaign-build-local.md` | PLAN and BUILD; settings, local targeting, landing pages |
| `references/course-d-testing-scaling.md` | OPTIMIZE; kill/hold/scale rules, click audit, decision table |
| `references/course-e-reporting-ai.md` | REPORT, account audits, AI prompt library, Meta platform changes |
| `references/course-q-and-a-calls.md` | Edge cases from 5 live calls (9/25–10/29): member cases, rules not in the lessons, questions to ask Dan |

Raw lesson transcripts (for detail beyond the digests): `projects/briefs/meta-ads/skool-corpus/`
(gitignored; one .md per lesson with an `index.json`). Re-harvest new lessons with
`node projects/briefs/meta-ads/harvest/harvest-arena.mjs` (skips lessons already saved), and the
Skool-hosted Q&A videos with `harvest-skool-video.mjs`.

## Known gaps (not in the course)

- Phone calls as conversions, call ads, and sending CallRail/Jobber outcomes back to Meta.
- Seasonality for a mole business; budgets far below the course's assumptions.
- Dan's Google Docs/Sheets (scorecard, prompt library, creative brief, swipe file, local market
  launch card) are recorded as links only; opening the "/copy" ones creates files in Drive.
- Prerequisite status as of 2026-10-29:
  - **Ownership:** Spencer confirmed Got Moles owns the Business Manager, ad account, pixel and pages,
    not DigiHammer. Verify it in SETUP, but it is not a blocker.
  - **Unknown:** DigiHammer's remaining access, pixel/CAPI health, budget, CPBJ target. SETUP
    mode establishes them.
