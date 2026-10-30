# Meta Setup Audit: 2026-10-29

Read-only. Checked live in Business Settings, Ads Manager, Events Manager and Billing, logged in as
spencer@got-moles.com. Nothing was changed.

## Ownership: OK

| Asset | ID | Owner |
|---|---|---|
| Business portfolio "Got Moles" (created 2021-03-28) | 109746944543095 | Got Moles |
| Ad account "Got Moles?" | 1386779432358453 | Got Moles |
| Facebook Page "Got Moles" (primary) | 109729334544856 | Got Moles |
| Instagram @got_moles (4.9K followers) | 17841447318910663 | Got Moles |
| Pixel "pixel" | 3297148147139092 | Got Moles |

## Who has access

| Who | Access | Note |
|---|---|---|
| Spencer (spencer@got-moles.com) | Full, everything | Active |
| Roy Castleman | Full, everything | Never active; Security Center flags him as an inactive user. He is also the backup admin. |
| Partner: Digi Hammer (271062297103346) | Full on the ad account; full on the Page except sensitive actions | Runs the live campaign |
| System user: Conversions API System User | Pixel only | Set up, but no CAPI events have ever arrived |
| System user: Roy Castleman | Admin, no assets | Can generate API tokens |

## Security gaps

1. **Two-factor login required for: no one.** It should be required for everyone (course-a, Vault 1).
2. **Business is unverified.** The legal business name is blank. Meta is warning that ad accounts
   will soon need verification "to keep running ads". Verification must use the legal entity,
   **Rainier Power Wash LLC** dba Got Moles. Verifying also raises the daily spending limit, which
   Meta currently sets at $47.16.
3. **got-moles.com is not added or verified.** No trusted domains, no peer approval on ads.

## Tracking: not working

- The pixel is **not installed on got-moles.com**. No events in October, no website connected, no
  integrations. There are no custom conversions and no offline event sets.
- Consequence: a website-lead campaign cannot optimize right now. DigiHammer's April "Website Lead"
  campaign (off) never had a working event behind it.
- → Brief for Roy: install pixel + CAPI with dedup on the live site; one Lead event that fires only
  on a qualified submission; CallRail number insertion on the landing page; DNS TXT for domain
  verification.

## What's running

One active campaign, DigiHammer's **"Got Moles May 2026 Calls Campaign"**: Calls objective, one
ad set, $6.67/day, est. audience 3.5M, live since 2026-05-14.

| Aug 1 – Oct 28, 2026 | Value | Tag |
|---|---|---|
| Spend | $592.42 | KNOWN |
| Impressions / reach | 38,410 / 11,478 (frequency ~3.3 over 3 months) | KNOWN |
| Calls of 20+ seconds (Meta's count) | 14, at $42.32 each | KNOWN (Meta) |
| Video Ad August 2026 v1 | 8 calls, $38.19 each; Meta quality "below average, bottom 20%" | KNOWN |
| Carousel Ad May 2026 | 6 calls, $45.35 each | KNOWN |
| Booked jobs from those calls / CPBJ | — | UNKNOWN: needs CallRail + Jobber match |

The ads call (253) 321-1024. Whether that number is a CallRail tracking number with a Meta source is
`UNKNOWN`.

The other campaigns (June 2025 calls/forms, April 2026 website leads) are off.

## Billing

PayPal is the default payment method, with Amex ···1008 (expires 1/30) as backup. Balance $104.43, billed at the
$165 threshold or on Nov 15. No account spending limit is set.

## Also seen

10 unread Page comments, including "Do not kill moles please!!" and "Shoot on site !!". On a
chemical-free brand, comments like these sit under the ads. Worth a reply policy (Posture A).

## Actions (each needs Spencer's OK; none taken)

| # | Action | Who | Type |
|---|---|---|---|
| 1 | Require two-factor for everyone | Agent, in browser | Write, 1 setting |
| 2 | Start business verification as Rainier Power Wash LLC dba Got Moles | Spencer (needs LLC documents) | Write |
| 3 | Add + verify got-moles.com (DNS TXT) | Roy | Site/DNS |
| 4 | Pixel + CAPI + qualified Lead event + CallRail on landing page | Roy (brief from this skill) | Site |
| 5 | Baseline: match the 14 Meta calls in CallRail to Jobber bookings → current CPBJ | Agent | Read-only |
| 6 | DigiHammer partner access: keep until their campaign is replaced, then remove | Spencer decides timing | Write |
| 7 | Roy's inactive login: keep as backup admin (needed for pixel/domain work) or remove | Spencer | Write |

## Follow-up (same day, after Spencer approved)

- **2FA:** required for Everyone, done and verified on reload (change log). 1 of 3 users still has to set it up.
- **Roy brief:** `2026-10-29_brief-for-roy-meta-tracking.md`; sent by Spencer to roy@allthepower.co.uk on 2026-10-29. Waiting on Roy for files changed + a date.
- **Baseline (`2026-10-29_meta-calls-baseline.md`):** (253) 321-1024, the number in the call ads, is **not a CallRail tracker**. Meta's 14 "20-second calls" ring the main line and are invisible in CallRail, so the live campaign's CPBJ is `UNKNOWN` and cannot be measured as built. The 17 calls CallRail tags as Facebook are organic, and 15 of them come from one repeat caller. One booked job ($100 TMCP, #8137).
- **Fix:** a CallRail "Facebook" tracker already exists, (253) 528-8152 (active since 2026-04-24, 18 calls, none from the ads). Every call ad in the rebuild uses it. DigiHammer's live ad is left alone (editing it restarts learning).
- **Business verification:** Spencer's to start (Security Center → Business Verification → Start verification). It needs the legal name Rainier Power Wash LLC, the address, a phone, the website, and one document showing name + address (WA business license / UBI or EIN letter), plus a DBA document linking it to "Got Moles".
