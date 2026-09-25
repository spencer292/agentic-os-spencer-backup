# GTM container notes

How to lay out a Google Tag Manager container that serves GA4 and Clarity from one
`dataLayer`, without a second hand-rolled snippet anywhere on the site. Checked September
2026.

---

## 1. Principle

One `dataLayer`. One seam in the code (`track.js` or `track.ts`). GTM does the fan-out to
GA4. Clarity is loaded either by its own component or by a GTM tag, but never by both.

Two hand-rolled GA4 snippets on the same page is the single most common cause of doubled
conversions. If GTM sends GA4, remove every `gtag.js` snippet from the templates.

---

## 2. Container layout

### Variables

| Name | Type | Notes |
|---|---|---|
| `DL - location` | Data Layer Variable | `location` |
| `DL - index` | Data Layer Variable | `index` |
| `DL - label` | Data Layer Variable | `label` |
| `DL - method` | Data Layer Variable | `method` |
| `DL - variant` | Data Layer Variable | `variant`, persists as a session cut |
| `DL - segment` | Data Layer Variable | `segment` |
| `Const - GA4 Measurement ID` | Constant | `G-XXXXXXXXXX` |
| `Const - Clarity Project ID` | Constant | Only if GTM loads Clarity |

Name every variable with the same prefix so the list stays readable at fifty variables.

### Triggers

| Name | Type | Fires on |
|---|---|---|
| `CE - cta_click` | Custom Event | `cta_click` |
| `CE - form_started` | Custom Event | `form_started` |
| `CE - form_step_completed` | Custom Event | `form_step_completed` |
| `CE - lead_captured` | Custom Event | `lead_captured` |
| `CE - booking_submitted` | Custom Event | `booking_submitted` |
| `Consent - analytics granted` | Custom Event | `consent_update` with analytics granted |

One trigger per funnel event. Do not build a single regex trigger that catches everything,
because you lose the ability to send different parameters per event.

### Tags

| Name | Type | Trigger | Notes |
|---|---|---|---|
| `GA4 - Configuration` | Google Tag | Initialisation, consent-gated | Holds the Measurement ID |
| `GA4 - cta_click` | GA4 Event | `CE - cta_click` | Params: `location`, `label` |
| `GA4 - form_started` | GA4 Event | `CE - form_started` | |
| `GA4 - form_step_completed` | GA4 Event | `CE - form_step_completed` | Param: `index` |
| `GA4 - generate_lead` | GA4 Event | `CE - lead_captured` | GA4 recommended name, mark as key event |
| `GA4 - booking_submitted` | GA4 Event | `CE - booking_submitted` | Mark as key event |
| `Clarity` | Custom HTML or the Clarity template | Initialisation | Only if the site does not load Clarity in code |

Send the site's own event name to GA4 unchanged, except where a GA4 recommended name
exists. `lead_captured` becomes `generate_lead`. Record the mapping in the setup document.

---

## 3. Consent configuration

In GTM, Admin, Container Settings, enable **Consent Overview**. Then set built-in consent
checks on every tag:

| Tag | Requires |
|---|---|
| GA4 Configuration and all GA4 events | `analytics_storage` |
| Google Ads and remarketing tags | `ad_storage`, `ad_user_data`, `ad_personalization` |
| Clarity | `analytics_storage` |

Set Consent Mode v2 defaults **before** GTM loads, in the page head, not inside a GTM tag.
A default set inside the container fires too late. The block to use is in
`references/consent-patterns.md`.

Do not rely on a tag's consent check alone for Clarity. Clarity also needs its own
`consentv2` call, because the Google consent signal does not reach Microsoft.

---

## 4. Clarity in GTM

Three routes, pick one.

1. **Clarity auto-detects the container.** In the Clarity project, Settings, Setup, GTM is
   detected and Clarity offers Create and publish. Easiest, and it publishes a container
   version, so tell the client before you click it.
2. **The Clarity community template** from the GTM gallery. Takes the project id, fires on
   initialisation.
3. **Custom HTML tag** with the standard snippet. Use when you need the `consentv2` call in
   the same tag.

If the site already loads Clarity from a component such as `assets/Clarity.tsx`, do not add
a GTM tag as well. Two tags means two sessions and a broken funnel.

---

## 5. Publish checklist

- [ ] Preview mode run against the real site, not a staging clone with different markup.
- [ ] Every funnel event fires exactly once per action. Check `form_step_completed` twice,
      it is the usual double-fire.
- [ ] GA4 DebugView shows the events with the right parameters.
- [ ] Clarity Network tab shows a POST to `https://www.clarity.ms/collect`.
- [ ] No `gtag.js` snippet left in the page templates.
- [ ] Consent defaults confirmed denied before the banner is touched, using the console
      check in `references/consent-patterns.md`.
- [ ] Consent granted path re-checked after accepting.
- [ ] Version named with the date and what changed, not "Version 14".
- [ ] Container access reviewed. Publish rights limited to the people who should have them.

---

## 6. Server-side GTM

Worth it when ad-blocker loss or first-party cookie lifetime is material to the client, and
only then. It moves the GA4 endpoint to a first-party subdomain and lets you enrich events
server side. It does not remove the consent obligation, does not make Clarity server side,
and adds a hosting cost and a failure mode. Decide it explicitly, and write the reason into
the setup document.

---

## Sources

Checked September 2026.

- Clarity GTM integration and auto-detection:
  https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
- Clarity third-party GTM guidance:
  https://learn.microsoft.com/en-us/clarity/third-party-integrations/google-tag-manager
- GTM and GA4 naming conventions:
  https://www.analyticsmania.com/post/google-analytics-and-google-tag-manager-naming-conventions/
- dataLayer structure and tagging-plan scope:
  https://www.incremys.com/en/resources/blog/google-tag-manager-data-layer
