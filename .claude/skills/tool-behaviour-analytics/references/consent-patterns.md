# Consent patterns for UK and EU sites

Google Consent Mode v2 and Microsoft Clarity consent, plus what UK law actually requires.
Checked **September 2026**. This is an engineering reference, not legal advice. Where a
client has counsel, their counsel decides.

---

## 1. Two separate obligations

They get conflated constantly, and the conflation causes broken builds.

| | What decides it | What it governs |
|---|---|---|
| **The law** | UK PECR and UK GDPR, policed by the ICO. In the EU, the ePrivacy Directive and GDPR | Whether you may store or read anything on the visitor's device, and on what basis |
| **Consent Mode v2** | Google's own advertiser policy | Whether you may keep using personalised advertising and full conversion measurement with Google |

UK law does not mention Consent Mode. PECR requires consent and is indifferent to how you
signal it to a vendor. Google requires the signal, and the UK is explicitly in scope.
Consent Mode v2 has been mandatory under Google policy since March 2024 with enforcement
from July 2025. Without it you lose remarketing audiences, personalised advertising and
full conversion measurement for UK and EEA visitors.

So a compliant site needs both: a lawful banner, and the signal wired to Google and to
Clarity.

---

## 2. What the ICO expects of a banner

- Non-essential tags **blocked until consent is given**, not fired then retracted.
- Accept and Reject offered with **equal visual prominence and equal accessibility**. A
  bright Accept next to a grey text link is not equal.
- **No pre-ticked boxes** and no implied consent from continued browsing.
- **Category-level controls**, so a visitor can accept some purposes and refuse others.
- An easy way to **change the decision later**.
- Consent must be freely given, specific, informed and unambiguous.

The ICO's 2025 refresh widened the language from "cookies" to all storage and access
technologies, which pulls in pixels, fingerprinting, web storage, link decoration and
SDK-like tags. Anything that writes to or reads from the device is in scope.

Penalties under the 2026 regime reach £17.5 million or 4 percent of global turnover.

---

## 3. The 2026 UK exemption, and why analytics still needs consent

The Data (Use and Access) Act 2025 inserted **Schedule A1 into PECR**, in force **5 February
2026** (Commencement No. 6 Regulations). It creates narrow consent exemptions, including:

- **Statistical purposes.** First-party analytics collecting statistics about visitors for
  the sole purpose of improving the service. The information must not be shared with anyone
  else except to help improve that service, and users must get clear information and a
  simple, free means of objecting.
- **Appearance and preferences**, for example language or dark mode, adapting to the
  device's own preferences rather than to browsing history.
- **Emergency assistance** location data. Narrow, rarely relevant commercially.

**Neither GA4 nor Clarity fits the statistical exemption.** Both send data to a third party,
Google and Microsoft respectively, and both feed advertising infrastructure. The exemption
covers first-party statistics only. Treat both as consent-required in the UK.

Clarity settles the argument independently: since **31 October 2025** it enforces a consent
signal for visits from the UK, EEA and Switzerland, and withholds full functionality
without one.

Further ICO guidance on storage and access technologies is expected after a public
consultation. Re-check this section when it lands.

---

## 4. Google Consent Mode v2

Four signals. Set defaults **before** the Google tag loads, then update on the banner
decision.

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }

  // Defaults: deny everything until the visitor decides.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });
</script>
<!-- GTM or gtag.js loads after this block -->
```

On acceptance:

```javascript
gtag('consent', 'update', {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted'
});
```

**Basic versus advanced.** Basic mode blocks Google tags entirely until consent, so denied
visitors send nothing. Advanced mode loads the tags in a cookieless state and sends
pings that Google models into modelled conversions. Advanced recovers more measurement.
Basic is the more conservative reading of "blocked until consent". Choose deliberately, and
write the choice into the setup document with the reason.

---

## 5. Clarity consent

Two steps, both required.

**Step one, turn off default cookies.** Clarity project Settings, Setup, toggle cookies
off. Consent Mode is already on by default for visitors from the EEA, UK and Switzerland,
but set it explicitly so behaviour is the same everywhere.

**Step two, pass the signal** with `consentv2`. Note the capital S in both parameter names.

```javascript
window.clarity('consentv2', {
  ad_Storage: 'granted',
  analytics_Storage: 'granted'
});
```

Deny before the decision, grant after:

```javascript
window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
// ... visitor accepts ...
window.clarity('consentv2', { ad_Storage: 'granted', analytics_Storage: 'granted' });
```

**`clarity('consent')` and `clarity('consent', true)` are the deprecated v1 API.** The
boolean applies one state to both consent types. Any live site still calling it should be
migrated. `clarity('consent', false)` remains the documented way to erase Clarity cookies
and stop tracking until consent is granted again, so keep it on the withdraw path.

**What happens without consent.** Clarity runs in no-consent mode: no first-party or
third-party cookies, a unique id per page view, and no linking of page views into one
session. Recordings still arrive, but multi-page journeys and funnels degrade. No-consent
mode persists on future visits until consent is given.

**Withdrawal.** When a visitor revokes, Clarity deletes the existing cookie, ends the
session and restarts in no-consent mode. You are responsible for telling Clarity that the
state changed.

**Verify in the console:**

```javascript
clarity('metadata', (d, upgrade, consent) => { console.log('consentStatus:', consent); }, false, true, true);
```

Expect `{ analytics_storage: "DENIED", ad_storage: "DENIED" }` before acceptance. Then clear
cookies, reload, decline, and confirm no `_clck` or `_clsk` cookie exists while `/collect`
calls still fire.

---

## 6. Consent Management Platforms

A supported CMP passes the signal automatically. Clarity documents a CookieYes integration
with more CMPs in progress. Most mainstream CMPs already emit Google Consent Mode v2
signals. Whatever the CMP, verify the Clarity call actually fires, because CMP support for
Google does not imply support for Clarity.

If the site has no CMP, a hand-rolled banner is fine provided it meets the ICO rules in
section 2 and calls both `gtag('consent', 'update', ...)` and `clarity('consentv2', ...)`
from the same handler.

---

## 7. Data that must never be collected

Never place any of this in an event name, a parameter, a `dataLayer` key, a Clarity custom
tag, or an unmasked element:

- Email address, phone number, postal address, full name.
- Payment details of any kind, including the last four digits.
- Health, biometric, political, religious or sexual-orientation data.
- Free text a visitor typed, including search boxes, message fields and support forms.
- Any id that resolves to a person without a lookup you control.

Clarity masks input content, numbers and email addresses by default. Do not unmask a form
field to "see what people type". If you need to join a session to a CRM record, pass an
opaque internal reference through `clarity("identify")`, which hashes the id on the client
before it leaves the browser. An opaque reference is still safer than a hashed email.

Mask more with `data-clarity-mask="true"` around any region that can render user content:
account areas, order confirmations, dashboards, comment threads.

Retention is fixed: recordings 30 days, heatmaps and favourited sessions 9 months. That is
a control in your favour, so do not try to route Clarity data into longer-lived storage.

Clarity must not be used on sites or apps targeting under-18s.

---

## 8. Setup checklist

- [ ] Banner blocks non-essential tags before any decision.
- [ ] Accept and Reject have equal prominence, no pre-ticked boxes, category controls present.
- [ ] Consent Mode v2 defaults set before the Google tag loads, all four ad and analytics
      signals denied by default.
- [ ] Basic or advanced mode chosen deliberately and written down.
- [ ] Clarity project cookies toggled off in Settings.
- [ ] `consentv2` called on load with denied, and again on accept with granted.
- [ ] Withdraw path calls `clarity('consent', false)` and re-denies Consent Mode.
- [ ] Console verification run, `_clck` and `_clsk` absent before acceptance.
- [ ] No personal data in any event, parameter or tag. Sensitive regions masked.
- [ ] Privacy policy names Microsoft Clarity and Google Analytics, what they collect and how
      to opt out.

---

## Sources

Checked September 2026.

- Clarity Consent Mode, including the 31 October 2025 enforcement for EEA, UK and CH:
  https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode
- Clarity Consent API v2, syntax, deprecation of v1, no-consent behaviour:
  https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2
- Clarity masking defaults and the identify API:
  https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
- Clarity data retention:
  https://learn.microsoft.com/en-us/clarity/setup-and-installation/data-retention
- ICO PECR cookie guidance, banner expectations and analytics position:
  https://usercentrics.com/knowledge-hub/ico-pecr-cookie-guidance/
- Data (Use and Access) Act 2025, PECR Schedule A1, statistical-purposes exemption and the
  5 February 2026 commencement:
  https://uk.practicallaw.thomsonreuters.com/w-049-0580 and
  https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2026/02/key-aspects-of-the-data--use-and-access--act-take-effect.html
- Why GA4 and Clarity fall outside the statistical exemption:
  https://consentpixel.com/blogs/uk-cookie-law-pecr-2026/
- Consent Mode v2 for UK advertisers, mandatory March 2024, enforced July 2025:
  https://searchlucid.com/blog/consent-mode-v2-uk/
