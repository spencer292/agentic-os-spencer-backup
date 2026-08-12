---
project: quo-account-appeal
status: draft
created: 2026-08-11
---

# Reinstatement email — Quo ticket 1152711

**Send from:** spencer@got-moles.com (the account owner — *not* Muhammad)
**To:** support@quo.com
**Subject:** Re: Quo Support Request — ticket 1152711 — consent documentation for account review
**Attach:** `consent-evidence.md`, `callback-pool-audit.md` (export both to PDF first)

> **Before sending, fill in the three bracketed blanks:** EIN, daily call volume, and
> confirmation that the lead-alert filter is live. Do not send with placeholders in it —
> a compliance reviewer reads that as carelessness.

---

Hi Sam,

Following up on ticket 1152711 with the documentation your team asked for. I'm Spencer Hill, the owner of the account and the person on the payment method on file. The compliance notice went to Muhammad, who is my receptionist and does not own the account, so I'm answering it myself.

**Business details**

- Legal name: Got Moles? LLC
- EIN: [YOUR EIN]
- Website: https://got-moles.com
- Business: residential mole control in King, Pierce and Thurston Counties, Washington. Founded 2017. Three Google Business Profile locations, 219+ five-star reviews, around 5,000 customers served.
- Account owner and cardholder: Spencer Hill, Managing Member

**What the account is used for**

One receptionist, one seat, answering and returning calls from homeowners who contacted us about moles in their lawn. We have never bought, rented or scraped a phone list, never run an outbound campaign, and have no autodialler. There is no marketing calling of any kind on this account.

**How recipient consent is obtained**

Homeowners reach us two ways, and both leave a record:

1. **They telephone us** on the CallRail tracking numbers published on got-moles.com and our Google Business Profiles. CallRail records and transcribes every call. When nobody is free to pick up, our CallRail receptionist takes their details and asks the caller directly for permission to call them back — the recorded line is *"Could I have the best phone number for our team to reach you?"* — and they say yes. That is explicit verbal consent, captured on audio, before any outbound call exists. I've included verbatim transcripts.

2. **They submit the service-request form on got-moles.com**, which asks for their name, address and phone number and tells them we will contact them to arrange an inspection. Each submission creates a client record in Jobber, our field-service system.

In the nine days this account was active we received **129 inbound calls** and **75 service-request submissions**. Over the wider period from June 1 we've had **737 inbound calls from 506 different households**. Attached is the full inbound ledger with timestamps and CallRail call IDs, all verifiable with audio.

**What I think went wrong, and what I found**

I understand why your system flagged us, and I don't think the flag was unreasonable given what it could see. The number was eight days old, there was one seat signing in from Pakistan, and it was dialling numbers that had never called *that* number — because our inbound calls land on CallRail tracking lines, which your platform has no visibility into. Add no A2P registration and the low answer rate that returning any lead produces, and I can see the shape it made.

But preparing this documentation turned up something worse, which I want to disclose rather than have your team find it:

**Our website form has been getting spam submissions, and our internal lead alert wasn't filtering them.** Of the 75 form leads in that window, 20 carried phone numbers outside Washington State — including one international number in Bangladesh — and 23 had no matching inbound call. Those were never real customers. My receptionist was ringing them because our own system told him to. That is my fault, not his, and it is precisely the out-of-area, unanswered dialling pattern your fraud model is built to catch.

**What we've already changed**

1. The lead alert now only raises a callback for Washington State area codes — 206, 253, 360, 425, 509 and 564. Everything else goes to a human review queue and is never dialled. [CONFIRM THIS IS LIVE BEFORE SENDING]
2. No international number will ever be dialled from a business line. No Got Moles customer has one.
3. Outbound caller ID will be set to the number the customer actually contacted, so a callback shows a Washington number they recognise.
4. We'll complete Free Caller Registry and CNAM branding, and A2P/10DLC registration before sending any SMS. I had your August 10 email about this and hadn't actioned it yet — that's on me.
5. Volume on any new number will be ramped, not switched on at full rate.

**What I'm asking for**

Please reinstate the workspace, or tell me what else you need. I'm happy to get on a call with your compliance team, and happy to accept a volume cap or a probation period while we demonstrate the pattern.

One practical thing: the ID verification link was sent to Muhammad's address, and it requires the name on the ID to match the payment method on file. That's me, not him. **Please reissue the verification link to spencer@got-moles.com** and I'll complete it immediately with my own government ID matching the Amex on the account.

For the record, I asked your team about this exact setup before we started. On August 3, ticket 1136228, Sam confirmed in writing: *"Pakistan is supported. Quo works from anywhere with an internet connection, and it's not a restricted location for calls or messages."* We built around that answer in good faith.

We're eight days into peak mole season with our phones down. I'd genuinely like to stay — but I need to know either way quickly so I can make arrangements for my customers.

Thanks for taking a look,

Spencer Hill
Managing Member, Got Moles? LLC
Office (253) 750-0211 · Cell (253) 326-1740
spencer@got-moles.com · got-moles.com

---

## Notes for Spencer — do not send this part

**Why disclose the spam-lead problem instead of hiding it.** Their compliance team will pull the dialled numbers. If your email says "we only called people who called us" and their log shows a Bangladesh number and 19 out-of-state calls, the appeal is dead and so is your credibility with them. Disclosing it first flips the story from "caught lying" to "operator who audits himself and fixes things" — which is the single strongest argument for reinstatement, because their real question is *will this account cause us problems again.*

**Do not let Muhammad reply to the compliance email or submit ID.** The ID must match the cardholder. A Pakistani ID against your Amex auto-fails and confirms their fraud theory.

**Realistic odds:** maybe one in three. Automated fraud terminations at PLG companies rarely reverse, and "suspected cold calling" plus an offshore seat is their worst-scoring combination. Send it because it costs 20 minutes and the CallRail evidence is genuinely strong — but stand up the replacement in parallel and do not wait on the answer.

**Even if they say yes,** you're on a watchlist and one more flag kills you mid-season. The pattern fixes above matter more than the provider.
