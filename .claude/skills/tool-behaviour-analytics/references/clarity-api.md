# Microsoft Clarity: client API, features and limits

Self-contained reference. Every fact below was checked against Microsoft Learn in
**September 2026**. Sources are listed at the end with the page they came from.

Clarity is free with no traffic cap and no paid tier. The project id is the API key. There
is no separate key and no cost for the client APIs.

---

## 1. Install routes

| Route | When to use | Notes |
|---|---|---|
| Third-party platform | WordPress, Shopify, Wix, Squarespace and others | Settings, Setup, View all platforms. Follow the per-platform instructions |
| Manual script | Any site where you control `head` | Paste the snippet into `head`. Needs `head` access |
| NPM `@microsoft/clarity` | JS or TS apps that prefer a package to a snippet | Client side only. Init once on mount |
| Google Tag Manager | A container already exists | Clarity auto-detects GTM in Settings, Setup and offers Create and publish |

**Verify the install two ways.** Open the Clarity dashboard and look for live users. Then
open devtools, Network tab, and confirm a POST to `https://www.clarity.ms/collect` while
you interact with the page.

**Not captured:** anything inside a `canvas` element or a third-party `iframe`. Heatmaps on
those regions will look empty and that is expected, not a bug.

**Not permitted:** sites or apps targeting users under 18, anywhere in the world.

**Bot detection** is on by default and excludes bot sessions from the session count. The
count of excluded bot sessions shows at the top of the dashboard. A separate **AI Bot
Activity report** (released January 2026) shows which automated systems are hitting the
site, how often, and which pages they touch.

---

## 2. JavaScript client API

All calls are `window.clarity(command, ...args)`. The tag defines a queue, so calls made
before the script loads are not lost.

### `clarity("event", name)`

Logs a custom event. It appears alongside Smart Events in Filters, Dashboard, Settings and
Recordings, and can be used as a funnel step.

```javascript
window.clarity("event", "lead_captured");
```

Can be called many times per page. Each call is logged individually. Events created this way
are **API events**: they cannot be hidden or deleted from the Clarity settings page, only by
removing the code.

### `clarity("set", key, value)`

Attaches a custom tag to the session, which becomes a filter.

```javascript
window.clarity("set", "segment", "smb");
window.clarity("set", "variant", ["a", "control"]); // array is allowed
```

| Limit | Value |
|---|---|
| Key length | 255 characters |
| Value length | 255 characters |
| Tags per page | 128, further tags ignored |
| Distinct tag names per project | No documented limit |

Passing an array is the same as calling `set` once per array member.

### `clarity("identify", customId, customSessionId, customPageId, friendlyName)`

Only `customId` is required. Clarity hashes `customId` on the client before it leaves the
browser. Call it on every page for reliable joining.

```javascript
window.clarity("identify", hashedUserRef, sessionRef, pageRef, "Pricing");
```

Use an opaque internal reference, not an email address, even though Clarity hashes it. See
`consent-patterns.md` for why.

### `clarity("consentv2", { ad_Storage, analytics_Storage })`

The current consent call. Both keys are required strings, `"granted"` or `"denied"`. Note
the capital S in both parameter names.

```javascript
window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
```

`clarity("consent")` and `clarity("consent", true)` are the **deprecated v1 API**. The v1
boolean applies one state to both consent types. `clarity("consent", false)` still works as
the documented way to erase Clarity cookies and stop tracking until consent is granted
again. Full detail in `consent-patterns.md`.

### `clarity("upgrade", reason)`

Prioritises the current session for recording. Clarity keeps up to 100,000 recordings per
project per day and samples beyond that, so `upgrade` protects sessions you care about.

```javascript
window.clarity("upgrade", "checkout_started");
```

### `clarity("metadata", callback, ...)`

Used for verification, not instrumentation. Run this in the console to see the live consent
state:

```javascript
clarity('metadata', (d, upgrade, consent) => { console.log('consentStatus:', consent); }, false, true, true);
```

Expect `{ analytics_storage: "DENIED", ad_storage: "DENIED" }` before the banner is
accepted, and `GRANTED` after.

---

## 3. HTML attributes

| Attribute | Effect |
|---|---|
| `data-clarity-mask="true"` | Masks the element and its contents. Masked content is never uploaded |
| `data-clarity-unmask="true"` | Unmasks an element that default masking would hide |

Setting either attribute to `false` does nothing. To reverse a mask, use `unmask`.

By default Clarity masks all input box content, numbers and email addresses.

---

## 4. Smart Events

Smart Events are named user actions built from signals: button clicks, page visits, auto
events and API events.

- **Auto events**, detected and named by Clarity, currently nine types: Purchase, Add to
  Cart, Begin Checkout, Contact Us, Submit Form, Request Quote, Sign Up, Login, Download.
- **User-defined events** are built code free in Settings, Smart events, New event, either
  starting from an auto event or from scratch.
- **API events** are the ones your code sends with `clarity("event", name)`.

| Limit | Value |
|---|---|
| Custom Smart Events per project | 20 |
| Who can create or edit | Project admins only |

Auto events can be hidden and unhidden. User-defined events can be deleted, permanently and
irreversibly. API events can be neither hidden nor deleted from settings, only removed from
the code.

A hidden auto event can still be used as a building block for a new event.

---

## 5. Funnels

Funnels are an ordered set of Smart Events or page visits, built with no code. Steps are
added by drag or select, reordered by drag, renamed inline, removed with the x icon.

For each step Clarity reports the count and percentage of sessions that progressed and the
count and percentage that dropped. The headline metric is the conversion rate, meaning the
share of sessions that completed every step.

Each step links straight to the filtered recordings and heatmaps for the sessions that
dropped there. That link is the reason to build the funnel at all.

---

## 6. Heatmaps

Five types.

| Type | What it shows | Read it for |
|---|---|---|
| Click map | Where clicks land, per element | False affordances, ignored CTAs |
| Scroll map | How far down sessions get | Whether a section is reachable at all |
| Area map | Clicks aggregated per region | The honest view on a responsive layout |
| Attention map | Where time is spent | Confusion when attention is high and clicks are zero |
| Conversion map | Which elements converting sessions touched | What the winners actually used |

Heatmaps can be filtered by device, segment and custom tag, compared side by side, and
downloaded.

**Heatmaps Insights** (Copilot) summarises a heatmap in prose. Copilot also summarises
grouped session recordings, up to 250 recordings at a time, and answers chat questions
about the project.

---

## 7. Data retention

| Data | Retained |
|---|---|
| Session recordings (playback) | 30 days |
| Heatmap data | 9 months |
| Labelled or favourited sessions | 9 months |

Retention is fixed and cannot be extended. After the period the data is deleted from
Clarity servers including backups and cannot be recovered. Favourite or label anything you
will want later, and screenshot anything that has to outlive 9 months.

---

## 8. GA4 integration

Clarity links to a GA4 property so recordings and heatmaps can be reached from GA data.
Settings, Setup, Google Analytics integration, Get started, then sign in to Google and pick
the property. Manual setup asks for the Account ID, Measurement ID and Property ID.

The integration adds a Google Analytics dashboard inside Clarity showing sessions by
country and device and an acquisition report, with Clarity recordings and heatmaps
reachable from each cut.

The division of labour worth stating to a client: GA4 tells you how many, Clarity shows you
why.

---

## 9. Data Export API

Clarity has a Data Export API for pulling project metrics into a warehouse or a report.
Use it when a client wants Clarity numbers inside their own reporting, not to replace
reading the recordings.

---

## Sources

Checked September 2026.

- Clarity client API: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
- Consent Mode: https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode
- Consent API v2: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2
- Smart Events: https://learn.microsoft.com/en-us/clarity/setup-and-installation/smart-events
- Funnels: https://learn.microsoft.com/en-us/clarity/setup-and-installation/funnels
- Heatmaps hub and types: https://learn.microsoft.com/en-us/clarity/heatmaps/
- Heatmaps Insights (Copilot): https://learn.microsoft.com/en-us/clarity/heatmaps-insights
- Manual setup and verification: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
- Data retention: https://learn.microsoft.com/en-us/clarity/setup-and-installation/data-retention
- GA4 integration: https://learn.microsoft.com/en-us/clarity/ga-integration/ga4-integration
- NPM package: https://www.npmjs.com/package/@microsoft/clarity
- AI Bot Activity report, January 2026, reported by Bounteous:
  https://www.bounteous.com/insights/2026/02/11/microsoft-clarity-understanding-user-behavior-beyond-numbers/
