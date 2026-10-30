# DigiHammer — Audit and Ownership Checklist

**Opened 2026-08-26.** Standing working document for Phase 0 and Phase 1. Method behind it:
`.claude/skills/mkt-cmo/references/vendor-transition.md`.

Everything below is `UNKNOWN` until filled in. Nothing in this document should be shared with
DigiHammer, and the future of the retainer should not be raised with him, until Section B is
complete — the pixel audiences and the unsubscribe record cannot be recovered after a bad exit.

---

## A. What Spencer can answer in five minutes

| # | Question | Answer |
|---|---|---|
| A1 | What is the retainer, monthly? | |
| A2 | Is ad spend inside the retainer or billed separately? Whose card is on the ad account? | |
| A3 | Is there a written contract? Notice period, term, auto-renewal date? | |
| A4 | How long has he been engaged? | |
| A5 | What was he originally hired to do — and has that drifted? | |
| A6 | What does he report, how often, and does any of it mention booked jobs or revenue? | |
| A7 | Does Spencer have logins to Meta Business Suite and HighLevel today, or does everything go through him? | |
| A8 | Did DigiHammer build the email list, or was it exported from Jobber? | |
| A9 | Has he ever asked for customer data, photos, or field content — or does he generate everything himself? | |
| A10 | Is there anything he does that Spencer would actually miss? | |

## B. What we verify ourselves — ownership, before anything else

Check with `tool-browser` on the persistent Chrome profile. **Reading only.** Do not change or
remove any permission without Spencer's explicit yes.

| # | Asset | Who owns it | Can Got Moles log in alone | Recoverable if lost | Status |
|---|---|---|---|---|---|
| B1 | Meta Business Manager | | | Yes, painful | |
| B2 | Meta ad account | | | Yes | |
| B3 | **Meta Pixel + custom audiences + lookalikes** | | | **NO — permanent loss** | |
| B4 | Facebook Page admin | | | Slow, via support | |
| B5 | Instagram account | | | Slow, via support | |
| B6 | HighLevel sub-account | | | Depends on his agency plan | |
| B7 | **Contact list export (full, with opt-out status)** | | | **NO — permanent, and legally material** | |
| B8 | **Sending domain + DNS (SPF / DKIM / DMARC)** | | | **NO — reputation does not transfer** | |
| B9 | Creative source files, photos, video | | | No | |
| B10 | GA4 property / GTM container | | | Historical data not re-creatable | |
| B11 | Any tracking numbers he provisioned | | | Number porting is possible but slow | |
| B12 | Any domains he registered on Got Moles' behalf | | | Depends on registrar lock | |

**The three that matter most are B3, B7 and B8.** They are the ones that are gone for good.

## C. What to request from DigiHammer — ask as routine housekeeping

Ask for all of it at once, in writing, with a date. Frame it as bringing the business's own
accounts under its own ownership, which is exactly what it is. A vendor with nothing to hide
treats this as administrative.

1. Owner-level access for Spencer on the Meta Business Manager, ad account, pixel and pages —
   or transfer of the ad account and pixel into a Got Moles Business Manager.
2. Independent login to the HighLevel sub-account.
3. A **full contact export** — every contact, every field, with subscribe/unsubscribe status and
   the date of each opt-out.
4. Confirmation of the sending domain and who holds its DNS.
5. Last 12 months of ad spend by month and by campaign.
6. Last 12 months of newsletter sends: date, subject, segment, size, delivered, clicks,
   unsubscribes, complaints.
7. Creative source files — images, video, ad copy — and any before/after photography.
8. Owner access to any GA4 property, GTM container or tracking numbers he provisioned.

**Do not ask for:** his strategy documents, his internal reporting, or anything that reads as
preparation for replacing him. This is an ownership request, not a discovery request.

## D. What we work out for ourselves — performance

Not from his reports. From the platforms and from Jobber.

| # | Question | Where |
|---|---|---|
| D1 | Actual Meta spend by month, 12 months | Meta Ads Manager (once B1–B2 clear) |
| D2 | What the ads actually say and show — read the live creative | Ads Manager / Ad Library |
| D3 | Leads produced, and by what definition of "lead" | Ads Manager + CallRail + form handler |
| D4 | **Booked jobs traceable to Meta** | Jobber — expect this to be near-impossible while F-01 is open. That finding *is* the answer |
| D5 | Newsletter: what was actually sent, and did anything book | HighLevel + Jobber |
| D6 | List size, engaged share, unsubscribe rate, complaint rate | HighLevel |
| D7 | Is the list synced with Jobber or a stale snapshot? | Compare export against a fresh Jobber pull |
| D8 | Pixel firing correctly? Any events at all? | Meta Events Manager |
| D9 | Retainer ÷ booked jobs = the honest cost of the arrangement | Computed |

## E. The verdict, when the data is in

Fill this in only after A–D. Three possible outcomes, and the middle one is the most likely:

- **Keep** — it is producing at a CPBJ that beats what in-house could do. Unlikely on Spencer's
  read, but the audit must be able to reach this conclusion or it is not an audit.
- **Split** — one part earns its keep and one does not. Keep the part that works, take the rest
  in-house. Be specific about which.
- **Replace** — build in-house, run parallel, cut on the agreed criterion.

| | Finding |
|---|---|
| Retainer, annualized | |
| Ad spend, annualized | |
| Booked jobs attributable | |
| Honest CPBJ | |
| Mix (Quick Fix / TMCP) | |
| What would the same money do elsewhere | |
| **Verdict** | |

## F. Parallel-run terms — agree before starting

Write these down before the first in-house campaign goes live, so the decision is not re-argued
later on feel:

- **Split by:** {geography / segment / period — pick one, never run both at the same audience}
- **Period:** {N weeks}
- **Cut criterion:** in-house holds CPBJ at or below {$X} for {N weeks} with the newsletter
  shipping on schedule.
- **Reviewed on:** {date}

---

## B — Live sweep, 2026-10-30 (`tool-browser`, read-only, logged in as Spencer)

| # | Asset | Finding | Tag |
|---|---|---|---|
| B6 | HighLevel sub-account | "Got Moles" (location `WpAGQdDIK16AtBQZbzBo`) sits under **DigiHammer's agency** (white-label "Digi Hammer Social Media Marketing / Growth Systems"). Users: **Sean Stewart, seans@digihammer.com — Agency Owner**; Spencer Hill and Roy Castleman (roy@atpbos.com) — Account admin. Spencer logs in independently, but the account lives on Sean's agency plan and billing | KNOWN |
| B7 | Contact list | **3,004 contacts.** A workflow "Assign Contacts to Spencer Hill" (Sean, 2026-05-28) enrolled all 3,004. A "Jobber Snapshot Workflows" folder suggests the list came from Jobber. Not yet exported | KNOWN |
| B8 | Sending domain | Newsletter sends on **got-moles.net** via HighLevel's Mailgun (MX mxa/mxb.mailgun.org; SPF `include:spf.leadconnectorhq.com include:mailgun.org`; **no DMARC record**). Domain was **bought inside HighLevel** (renews 2027-04-28, auto-renew on), so it's registered through the agency, and DNS is on Cloudflare nameservers (braden/love) that Got Moles doesn't control. got-moles.com is separate (GoDaddy NS, Google Workspace SPF) and untouched | KNOWN |
| — | Newsletter history | Only **2 sends ever**, both by Sean via bulk action: "Campaign May" (2026-05-25) and "Campaign August 2026" (sent **2026-09-29**). Sep send: 3K targeted, 2.4K delivered, 848 opened (35%), **20 clicks (0.83%)**, 5 replies, 13 unsubscribes, 0 complaints, 17 bounced, 590 skipped. The Email Marketing dashboard shows HighLevel sample data, not real campaigns | KNOWN |
| — | Social | Social Planner: **no accounts connected**. Sean does not post through this account | KNOWN |
| — | Websites / phone | One site, "Got Moles Privacy Policy" (1 page, 2025-06-05), on got-moles.net. No phone numbers ("phone system requires configuration") | KNOWN |
| — | Workflows | 3 total: Assign Contacts to Spencer Hill (published), Forward Inbound Emails (draft, 9 enrolled), Forward Inbound Emails 2 (published, 21 enrolled). Inbound replies to got-moles.net are forwarded — check where before the cut | KNOWN |
| — | Billing | Page does not render for an account admin; it's on Sean's agency | KNOWN |
