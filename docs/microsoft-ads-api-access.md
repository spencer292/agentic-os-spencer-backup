---
source: session-research
captured: 2026-07-30
topic: Microsoft Advertising API + third-party OAuth
status: raw
---

# Microsoft Ads accounts created via Google sign-in cannot complete OAuth

## The finding

Microsoft Advertising now permits account signup with a Google account. When you do,
Microsoft creates the ad account but **the identity remains federated to Google — it is
never provisioned in Microsoft Entra ID**. Any flow that asks Microsoft to authenticate
that user therefore fails: Microsoft has no credential to check.

Symptoms (all the same root cause, commonly misdiagnosed as separate bugs):
- Third-party integrations (CallRail, Optmyzr, reporting tools) fail at the Authorize
  step with "we can't find that account" / "Try entering your Microsoft Account again"
- The Microsoft Advertising developer portal shows "no user found" even though the user
  signs into the Microsoft Ads UI normally
- The Bing Ads API OAuth consent flow cannot issue a refresh token for that user

This is a documented limitation of Microsoft's OAuth flow for federated identities, not
a misconfiguration. It also affects company SSO generally (Okta, Google Workspace), not
just consumer Google accounts.

## The fix

Invite a **Microsoft-authenticatable user** to the ad account as Super Admin
(Settings → Account access / User management → Invite user). The email must be a real
Microsoft identity — an Entra (M365 work) account or a free MSA (outlook.com). Not
another federated one. All downstream OAuth then authenticates as that user.

One fix clears every symptom above simultaneously.

## Microsoft Ads API access — full credential chain

Three credentials are required **together**; none works alone:

1. **Universal developer token** — free, instant, no review process (unlike Google's MCC
   review). Sign in as Super Admin → `https://ads.microsoft.com/cc/Settings/DevSettings`
   → select user → Request Token. Verify it returns **Universal**, not Single-user
   (Single-user is deprecated). One universal token covers every linked account and every
   supported user. The old `developers.ads.microsoft.com/Account` portal was deprecated
   2025-05-31.
2. **Entra app registration** — portal.azure.com → App registrations → client ID +
   client secret + redirect URI.
3. **User refresh token** — run the OAuth consent flow once as the Super Admin user,
   store the refresh token.

## Version warning

Build against the **REST API**, not SOAP. SOAP enters feature freeze **1 Oct 2026** and
is fully decommissioned **31 Jan 2027**.

## Sources

- https://learn.microsoft.com/en-us/advertising/guides/get-started?view=bingads-13
- https://learn.microsoft.com/en-us/advertising/guides/authentication-oauth?view=bingads-13
- https://learn.microsoft.com/en-us/advertising/guides/authentication-oauth-register?view=bingads-13
- https://help.cometly.com/en/articles/14533547-connecting-microsoft-ads-when-your-account-uses-google-sign-in-sso
- https://help.optmyzr.com/en/articles/8019069-linking-a-microsoft-advertising-login-to-optmyzr-troubleshooting

## Applied context

Got Moles Microsoft Ads (aid 188373735 / cid 254854977) is exactly this case — signed up
via Google as roy@atpbos.com. Blocked the CallRail→Microsoft call-tracking integration
since launch (2026-07-24) and blocks all API plumbing. Fix is ATP-side, needs no client
involvement.
