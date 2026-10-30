# Brief for Roy: Meta tracking on got-moles.com

From Spencer / Got Moles marketing. 2026-10-29.

We're bringing Meta (Facebook/Instagram) ads in-house. A read-only audit of the Meta account today
found that nothing on the website reports to Meta, so no website campaign can optimize and we
can't measure results. Everything below is site or DNS work, so it's yours. No Vercel or deploy
changes from our side.

**IDs:** Business portfolio `109746944543095` · Ad account `1386779432358453` · Pixel / dataset
`3297148147139092` (owned by Got Moles; "Conversions API System User" already exists in Business
Settings with access to it). You have full admin in the business portfolio. Two-factor login is now
required for everyone, so you'll need 2FA on your Facebook login to get in.

## 1. Verify the domain
Business Settings → Brand safety → Domains → Add `got-moles.com` → DNS TXT method. Add the TXT
record and confirm "Verified".

## 2. Install the pixel
Base code for pixel `3297148147139092` on every page of the live site. PageView should fire once
per page load.

## 3. Conversions API with dedup
Server-side events through the existing Conversions API System User (generate its token in Business
Settings → System users). Send the same `event_id` from browser and server so Meta deduplicates.
Include hashed email and phone where the visitor gave them, plus `fbp`/`fbc` cookies. Target:
Event Match Quality 7 or higher in Events Manager.

## 4. One Lead event, only for qualified leads
Fire `Lead` (browser + server, same `event_id`) only when a form submission is a lead we can serve:
- In the service area (zip in our list; we'll send it)
- Residential under 5 acres, OR a real commercial inquiry
Do not fire it for out-of-area or obvious junk submissions. If the form doesn't ask property type
and acreage yet, please add both. They're needed for intake anyway.
Also fire `Contact` on click-to-call taps.

## 5. Dynamic UTMs pass through
Meta ad URLs will carry
`utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}`.
Please make sure they survive redirects and get saved with form submissions (hidden fields) so
the lead in Jobber shows which ad it came from.

## 6. CallRail on Meta traffic
CallRail's website pool should swap in its number for visitors arriving with
`utm_source=facebook` / `instagram`, so calls from Meta clicks show "Facebook Ads" as the source.

## How we'll check it
Events Manager → Test events: PageView on load, one Lead on a qualified test submission (none on an
out-of-area one), Contact on a call tap, "Deduplicated" showing for browser + server.

Thanks. Please send back which files changed so we have a record, and a date we can expect it.
