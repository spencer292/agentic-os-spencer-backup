# Email and Lifecycle Playbook

Newsletter, sequences, list handling and the send gate.

Email is the highest-leverage channel Got Moles has and the one with the least oversight today.
It reaches ~2,900 customers who have already paid, it costs almost nothing per send, and it is the
only channel that can convert a one-off Quick Fix buyer into a recurring TMCP subscriber at
near-zero acquisition cost. It is also the channel where a single mistake is irreversible.

---

## The send gate — absolute

Nothing goes to a customer list without **all four**:

1. **The exact final copy approved** — not an outline, not "something like this". The words that
   will land in the inbox.
2. **The exact segment approved** — named, counted, and with the suppression list stated.
3. **A test send received and read** on a real device, links clicked, personalization checked.
4. **Spencer's yes**, on that copy and that segment.

There is no "quick send". An email cannot be recalled, it reaches customers mid-service, and a
careless one damages a relationship that took a decade to build.

**Never schedule a send in a cron.** Reporting on email can be automated; sending cannot.

---

## Before anything: the list audit

Everything in this playbook is blocked until the HighLevel audit runs — `vendor-transition.md`.
Open questions, all `UNKNOWN` as of 2026-08-26:

- Who owns the HighLevel sub-account, and can Got Moles log in without DigiHammer?
- How many contacts, and where did they come from? A list built from purchased or scraped data is a
  liability, not an asset.
- Does the list have real consent, and is there any record of it?
- What is the sending domain, and **who controls its DNS** (SPF, DKIM, DMARC)? Sender reputation is
  attached to the domain — if he sends from a subdomain he controls, none of the reputation
  transfers and a migration starts from zero.
- What has actually been sent, and what did it produce? Not opens — **booked jobs**.
- Is the list synchronized with Jobber, or is it a stale snapshot?
- Are unsubscribes being honored and recorded, and would that record survive a migration?

Export the list and the unsubscribe record **before** any conversation about ending the retainer.
An unsubscribe record that does not survive a migration means re-mailing people who opted out,
which is the one email mistake with statutory damages attached.

---

## Compliance — verify before relying on any of this

**These numbers need live verification. Do not answer a compliance question from this file if the
verify-by date has passed — look it up and update the file first.** Same discipline as
`ops-hr/references/wa-compliance.md`.

| Rule | What it requires | Tag | Verify by |
|---|---|---|---|
| **CAN-SPAM** (federal) | Accurate From/Reply-To and header info, non-deceptive subject line, a physical postal address in every commercial email, a working unsubscribe honored promptly, and no unsubscribe fee or hoops. Penalties are per-email | `ESTIMATE` — well established, but confirm current penalty figures before quoting them | 2027-01 |
| **WA Commercial Electronic Mail Act (RCW 19.190)** | Washington has its own statute covering commercial email — and commercial **text messages** — sent to WA residents, with statutory damages per message for false or misleading subject lines and transmission information. Got Moles mails almost exclusively into WA, so this applies to nearly every send | `ESTIMATE` — the shape is right; **verify the current text, scope and damages figure before relying on it** | 2027-01 |
| **TCPA / SMS** | Marketing texts need prior express written consent, distinct from consent for transactional service messages. Quiet hours apply | `ESTIMATE` — verify before any marketing SMS | 2027-01 |
| **A2P 10DLC registration** | Carriers require brand and campaign registration for business texting, using the **legal entity name and EIN** — Rainier Power Wash LLC, not the Got Moles DBA. Unregistered traffic gets filtered | `ESTIMATE` | 2027-01 |

**The line that matters most: transactional is not marketing.** The existing texting in
`projects/briefs/jobber-text-automation/` is *service* messaging — arrival windows, appointment
notices. That is a different legal footing from a promotional blast. **Never send a marketing offer
down a transactional channel** because it is available and the consent is already there. It is not
the same consent, and it puts the service messaging at risk along with the offer.

If a compliance question goes past "is this allowed" into "we may already have a problem", say so
plainly and escalate to counsel — the same rule `ops-hr` applies to employment law.

---

## What the newsletter is for

A monthly newsletter to a mole-control customer base is not a brand exercise. It has three jobs,
in this order:

1. **Convert one-off buyers to the program.** 700 customers have bought a Quick Fix twice or more
   and have never been on TMCP. Every one of them has proved by their own behavior that the
   problem recurs. That is the argument, and it writes itself.
2. **Earn reviews.** Review velocity is a ranking and conversion asset across three GBP listings
   currently at 5.0. A well-timed ask after a good job is the cheapest marketing Got Moles does.
3. **Generate referrals.** A satisfied homeowner in Sammamish knows six neighbors with the same
   lawn and the same problem. Mole damage is visible from the sidewalk.

"Staying top of mind" is not a job. If a newsletter issue does not visibly do one of the three,
it should not be sent.

**Content that earns the open** in this business is seasonal and useful: what the moles are doing
this month, what the damage means, what a homeowner should do now, one real before-and-after from
a real customer, one named technician. Got Moles has a genuine knowledge base
(`brand_context/mole-knowledge-base.md`) and a field guide written by people who do the work —
that is a real advantage over a vendor generating generic pest-control content.

Every issue runs through `tool-humanizer` in **deep** mode (a voice profile exists) and through
`claims-gate.md` before it goes near an approval.

---

## The sequences worth building, in priority order

| # | Sequence | Segment | Why first |
|---|---|---|---|
| 1 | **Quick Fix → TMCP conversion** | 700 repeat Quick Fix, never on a program (357 with a job inside 24 months) | Highest-value, lowest-cost conversion available. Turns transaction revenue into recurring revenue — the mix effect at its strongest |
| 2 | **Post-job review ask** | Every completed job | Compounds forever across three listings. Currently ~7 reviews/week; this is how that number moves |
| 3 | **Seasonal pre-fall activation** | Lapsed and single-job customers | Demand peaks in fall. Reaching the book before the season beats bidding against everyone during it |
| 4 | **Winback** | 84 ex-program, none active | They already chose the program once. Ask why they left — the answer is worth more than the reactivation |
| 5 | **Referral ask** | Active TMCP subscribers | Highest-trust segment. Neighbors share the same soil, the same moles and the same fence line |
| 6 | **Quote follow-up** | Open quotes | **Already exists** as the `quote-chase` cron. Do not build a second one — coordinate with it or the customer gets chased twice |

Segment counts come from the 2026-08-06 Jobber pull in `projects/briefs/tmcp-conversion/`.
Re-pull before a send; the book moves.

---

## Suppression — check every time

Before any send, suppress:

- Anyone who unsubscribed, ever, from any list or system.
- Active TMCP subscribers, from any acquisition or conversion offer — never sell someone what they
  already pay for.
- Anyone with an open complaint or an unresolved service issue. Ask the office; the CRM will not
  know.
- Anyone mid-service on a job the offer contradicts.

## Measurement

Report booked jobs, not opens. **Apple Mail Privacy Protection inflates open rates and makes them
close to meaningless** — an email program judged on opens will optimize for subject-line
cleverness and produce nothing. Clicks are directional; booked jobs are the number.

Minimum reporting per send: segment and size, delivered, clicks, unsubscribes, complaints, quotes
requested, **jobs booked**, and revenue attributed. If the last two cannot be tracked, that is
finding F-01 again and it should be said out loud in the report rather than replaced with an open
rate.

---

## Platform decision — deferred deliberately

Whether to stay on HighLevel or migrate is **not decided** and should not be decided before the
audit. The inputs that decide it: who owns the account, whether the list and unsubscribe record
export cleanly, who controls the sending domain's DNS, what it costs standalone, and whether it
talks to Jobber. Bring the answer back with those five facts, not before.
