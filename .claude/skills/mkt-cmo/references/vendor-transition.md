# Vendor Transition

How to audit, run parallel to, and eventually exit a marketing supplier without losing anything
on the way out.

Written for the DigiHammer transition, but the method is general — use it for any future vendor.
The live instance lives in `projects/briefs/marketing-in-house/2026-08-26_digihammer-audit.md`.

---

## The one rule that governs the order of operations

**Reclaim ownership before you renegotiate, and long before you cancel.**

A marketing vendor holds assets that look like services but are actually property — an ad account,
a pixel and the audiences trained on it, a contact list, a sending domain's reputation, a page's
admin rights. While the relationship is good, transferring them is administrative. After a
cancellation conversation, some of them are simply gone, and no amount of goodwill recovers a
custom audience that was deleted with an ad account.

So the sequence is fixed:

```
1. Inventory access        ← what do we hold, what does he hold
2. Reclaim ownership       ← get on the accounts as owner, quietly and normally
3. Audit performance       ← what is it producing
4. Build the replacement   ← in-house, gated
5. Run in parallel         ← prove it beats the incumbent
6. Cut                     ← notice, handover, verification
```

Steps 1–2 happen **before** step 3's findings are shared with anyone outside the business, and
long before step 6 is mentioned to the vendor. This is not deception — it is ordinary
housekeeping that any business should already have done. A vendor with nothing to hide will
process an ownership request as routine.

---

## Step 1 — inventory access

For every platform, establish three things: **who owns it**, **who can log in**, and **what happens
to it if the relationship ends today.**

| Asset | The question | Loss if it goes wrong |
|---|---|---|
| **Meta Business Manager** | Is the ad account inside Got Moles' Business Manager or the vendor's? | If it is his, Got Moles is a guest on its own advertising and can be removed |
| **Meta Pixel + custom audiences** | Who owns the pixel? Do audiences and lookalikes live under it? | **Permanent.** Audiences generally do not transfer between business managers. This is the compounding asset and it is the easiest one to lose |
| **Facebook / Instagram Pages** | Does Got Moles hold full admin? | Losing admin on your own page is a support-ticket nightmare with no guaranteed outcome |
| **HighLevel sub-account** | Whose agency account is it under? Can Got Moles log in independently? | Everything inside it — list, automations, history — may be inaccessible |
| **Contact list + unsubscribe record** | Can it be exported now, in full, with opt-out status? | **Permanent, and legally material.** Losing the unsubscribe record means re-mailing people who opted out |
| **Sending domain + DNS** | Which domain sends the email, and who controls its SPF/DKIM/DMARC records? | Sender reputation is attached to the domain. If he owns it, a migration starts from zero deliverability |
| **Creative assets** | Where are the source files, photos, videos? | Re-shooting is expensive; the before/after library is irreplaceable |
| **Ad account billing** | Whose card is on it? | A card removed mid-flight stops delivery without warning |
| **Analytics + tracking** | Who owns the GA4 property, GTM container, tracking numbers? | Historical data is not re-creatable |

Use `tool-browser` to check what Got Moles can actually reach today — the persistent Chrome
profile keeps platform logins. **Do not change permissions or remove anyone without Spencer's
explicit yes**; reading is free, writing is a mutation and needs confirmation.

## Step 2 — reclaim ownership

Ask for it as normal business hygiene, not as a prelude to anything. Ask in writing, ask for all of
it at once, and give a date.

The minimum acceptable end state:

- Got Moles owns a Business Manager; the ad account, pixel and pages live inside it; the vendor has
  partner access, not ownership.
- Got Moles can log into HighLevel independently, and holds a fresh full export of contacts with
  opt-out status.
- The sending domain is a Got Moles domain with DNS Got Moles controls.
- Got Moles is owner (not editor) on GA4, GTM and the ad accounts.
- Creative source files are delivered.

Anything the vendor cannot or will not transfer is a **finding**, logged with a severity in
`open-findings.md`. Reluctance here is itself information about the relationship.

## Step 3 — audit what it produces

Only once ownership is secure. The honest question is not "is this good work" — it is **"what did
this cost per booked job, and what would that money do somewhere else."**

Establish, for the newsletter and for Meta separately:

- Retainer cost, and what is bundled inside it versus billed on top (ad spend is usually separate).
- Ad spend, by month, for at least 12 months.
- Leads, and — the part vendors rarely report — **booked jobs**.
- CPBJ, or the honest statement that attribution does not support one (F-01).
- Mix: did it bring Quick Fix one-offs or TMCP subscribers?
- List growth, engagement, unsubscribes, complaints.
- What is actually being sent and run — read the real creative and the real emails, not a report
  about them.

**Be fair.** Spencer's assessment of the ads is that they are poor; the audit's job is to confirm
that with numbers or to correct it. It is entirely possible the newsletter is doing more than it
looks like, or that a $10 CPL account is producing real jobs. Bring back what is true, including
the parts that are inconvenient. A vendor doing one thing well and one thing badly should be
partially kept, not reflexively fired.

## Step 4 — build the replacement

In-house, gated, per the launch gate in `paid-playbook.md` and the send gate in
`email-playbook.md`. Build it against the same segments and the same offers, so the comparison in
step 5 is real.

## Step 5 — run in parallel

Decided with Spencer 2026-08-26: **parallel, then cut.** The vendor keeps running while the
in-house replacement is built and proven. No gap in the newsletter, no gap in Meta leads.

**The scoreboard.** Same period, same segments where possible, three columns:

| | Incumbent | In-house | Delta |
|---|---|---|---|
| Spend | | | |
| Leads | | | |
| **Booked jobs** | | | |
| **CPBJ** | | | |
| Mix (QF / TMCP) | | | |
| Cost of the seat (retainer vs. time) | | | |

**Do not run both against the same audience at the same time.** Two campaigns bidding for the same
homeowner raise each other's costs and make the comparison meaningless. Split by geography,
segment or period — and write down which, before starting.

**The cut criterion, agreed in advance:** the in-house replacement holds for a full agreed period
at equal or better CPBJ, with the newsletter shipping on schedule. Write the specific number and
the specific date into the project brief before parallel running starts, so the decision is not
re-argued later on feel.

## Step 6 — the cut

1. **Check the contract** — notice period, auto-renewal date, and whether anything (a domain, a
   HighLevel account, an ad account) is contractually his. Do this before giving notice, not after.
2. **Verify the handover list is complete** and every export is in hand and *opens correctly*. A
   corrupt CSV discovered a week later is a lost list.
3. **Give written notice**, professionally and without a grievance narrative. Thank, state the date,
   confirm the handover items and the final invoice. Never burn a supplier — Western Washington is
   a small market and vendors talk to the same customers you do.
4. **Remove access in the right order** — after the final invoice clears, and after confirming
   nothing still runs through his credentials (billing cards, DNS, integrations, phone numbers).
   Removing access from something that is still delivering leads is a self-inflicted outage.
5. **Verify nothing broke** for two weeks: sends still delivering, ads still serving, tracking
   still recording, forms still arriving. Then log the transition and its numbers to
   `context/learnings.md` → `## mkt-cmo`.

---

## What to watch for in the audit

Not accusations — these are the ordinary ways small-business marketing retainers underdeliver, and
each has a specific tell:

- **Reporting on leads, never on jobs.** The tell: reports full of impressions, reach, clicks and
  "leads" with no revenue anywhere.
- **Spend that mostly buys the vendor's own convenience** — one broad campaign, no negatives, no
  landing-page work, automatic placements everywhere.
- **AI-generated content at volume with no local specificity.** For a mole company in Western
  Washington that is a real failure, not a stylistic one: the entire advantage is local, seasonal
  and photographic, and generic content throws it away.
- **Assets accumulating under the vendor's name** rather than the client's.
- **Silent throttling nobody checked** — "Eligible (limited)" keywords, LSA misclassification, a
  dead pixel. Delivery drops, the dashboard stays green, the retainer keeps billing.
- **A list that only grows** — no unsubscribe hygiene, no bounce cleanup, no engagement segmentation.

Log each confirmed instance as a finding with the evidence attached. The audit's output is a
findings list and a number, not an opinion.
