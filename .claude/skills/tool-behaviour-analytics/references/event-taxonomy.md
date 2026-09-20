# Event taxonomy

One vocabulary for the whole site. Clarity, GA4 and any future tool read the same names.
Checked against Google and Microsoft documentation in **September 2026**.

---

## 1. Naming rules

1. **snake_case, lowercase.** Matches GA4's own recommended events. GA4 event names are
   case sensitive, so `DemoRequest` and `demo_request` are two different events and one of
   them is a mistake.
2. **The name is the action. Context goes in parameters.** Use `cta_click` with
   `{ location: "hero" }`, never `hero_cta_click`. Otherwise the name space explodes and no
   report can group anything.
3. **Object then action, or verb-first, but pick one and keep it.** `form_submitted` and
   `submit_form` are both fine. A site with both is not.
4. **No dynamic values in names.** No ids, no prices, no page slugs. Those are parameters.
5. **No personal data anywhere.** Not in a name, not in a parameter, not in a tag. See
   `consent-patterns.md`.
6. **Cap the plan.** Five to eight funnel events and roughly ten to twenty parameters is a
   plan a team maintains. Forty is a plan that rots.

---

## 2. The standard funnel spine

Every funnel, whatever the business, has the same six rungs. Name the real thing at each
rung using the site's own language, but keep the shape.

| Rung | Meaning | Generic name | Example on a quiz funnel | Example on a service site |
|---|---|---|---|---|
| 1 Page | Arrived on the page | `page_view` (automatic) | `page_view` | `page_view` |
| 2 Engage | Did something non-trivial | `engage` | `quiz_intro_scrolled` | `pricing_expanded` |
| 3 Start | Entered the funnel | `start` | `quiz_start_click` | `quote_form_started` |
| 4 Step n | Progressed inside it | `step_n` | `question_answered` | `quote_step_completed` |
| 5 Lead | Gave contact details | `lead` | `lead_captured` | `lead_captured` |
| 6 Conversion | The money action | `conversion` | `booking_submitted` | `booking_submitted` |

Rung 4 repeats. Send the same event name every time with an index parameter, for example
`question_answered` with `{ index: 3 }`. Do not create `question_3_answered`.

A worked eight-event set from a live scorecard build, kept exactly as shipped:

```
quiz_start_click -> sector_selected -> question_answered (repeats)
-> quiz_completed -> lead_captured -> results_viewed
-> book_cta_click -> booking_submitted
```

Those names are the contract. The Clarity funnel is built on them, so renaming one breaks
the funnel silently. Change names only with a dated note in the setup document.

---

## 3. Parameters

| Parameter | Type | Use |
|---|---|---|
| `location` | string | Where on the page the interaction happened: `hero`, `sticky_bar`, `footer` |
| `index` | number | Position in a repeating step |
| `label` | string | Which of several identical controls, from a fixed list |
| `value` | number | Only where a real number belongs, never a person's data |
| `method` | string | How, for example `phone`, `form`, `whatsapp` |

Every parameter value must come from a fixed vocabulary you wrote down. Free text from a
user is never a parameter.

---

## 4. Custom tags: the cut, not the step

Tags describe the session so you can slice heatmaps, recordings and funnels. Set them once,
as early as you know them.

| Tag | Values | Why |
|---|---|---|
| `segment` | Fixed list, for example `smb`, `enterprise`, `public_sector` | Compare behaviour between audiences |
| `tier` | Fixed list, for example `low`, `mid`, `high` | Compare behaviour by outcome or score band |
| `variant` | Fixed list, for example `a`, `b`, `control` | The only A/B lever, one flag |
| `device_class` | `mobile`, `tablet`, `desktop` | Clarity already filters by device, but this keeps the funnel cut consistent with GA4 |
| `page_type` | `home`, `service`, `pricing`, `article`, `results` | Read a heatmap by template rather than by URL |

```javascript
tag("segment", "smb");
tag("variant", "b");
```

Tag limits: 255 characters per key and per value, 128 tags per page.

---

## 5. GA4 mapping

Send the GA4 recommended name wherever one exists. The lead-generation lifecycle:

| GA4 event | Fires when |
|---|---|
| `generate_lead` | A visitor submits a lead or requests contact |
| `qualify_lead` | The lead is marked as meeting the qualification criteria |
| `working_lead` | Sales contacts, or is contacted by, the lead |
| `disqualify_lead` | The lead is explicitly marked disqualified |
| `close_convert_lead` | The lead becomes a customer |
| `close_unconvert_lead` | The pipeline closes lost |

Sending these populates GA4's Lead acquisition report and the lead-stage audience
templates. The last four normally arrive from the CRM through the Measurement Protocol,
not from the browser.

Map the site vocabulary to GA4 in the setup document:

| Site event | GA4 event | Clarity Smart Event | Marked as key event in GA4 |
|---|---|---|---|
| `quiz_start_click` | `quiz_start_click` (custom) | API event | No |
| `lead_captured` | `generate_lead` | API event | Yes |
| `booking_submitted` | `purchase` or custom | API event | Yes |

Mark only real business outcomes as GA4 key events. A key event on `engage` makes every
report meaningless.

---

## 6. The one seam

Never call vendors directly from a component. One function, called everywhere.

```javascript
track("lead_captured", { method: "form" });
```

`assets/track.js` and `assets/track.ts` implement it. The seam:

- pushes `{ event: name, ...props }` to `window.dataLayer` for GTM and GA4,
- calls `window.clarity("event", name)` so the step becomes a Clarity Smart Event,
- swallows every error so a missing or blocked vendor never breaks a page,
- is a no-op during server rendering.

A separate `tag(key, value)` helper wraps `clarity("set")`.

Two rules that keep the seam honest. Nothing outside the seam may call `clarity` or
`dataLayer`. The event-name union type is the tracking plan, so adding an event means
editing the plan.

---

## 7. Documenting the plan

The setup document carries one table, and it is the deliverable:

| Event | Fires when | Parameters | Goes to | Business purpose |
|---|---|---|---|---|

That is enough. A short plan that stays true beats a long one nobody updates.

---

## Sources

Checked September 2026.

- GA4 recommended events, including the lead lifecycle:
  https://support.google.com/analytics/answer/9267735
- GA4 lead-generation reports and audience templates:
  https://www.lovesdata.com/blog/google-analytics-lead-reports/
- GTM and GA4 naming conventions:
  https://www.analyticsmania.com/post/google-analytics-and-google-tag-manager-naming-conventions/
- dataLayer structure and tagging-plan scope:
  https://www.incremys.com/en/resources/blog/google-tag-manager-data-layer
- Clarity custom tags and event API limits:
  https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
