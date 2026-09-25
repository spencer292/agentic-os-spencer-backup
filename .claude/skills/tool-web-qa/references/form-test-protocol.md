# Form test protocol

`qa-run.mjs` finds forms, counts their fields, checks labels and looks for a honeypot. It does
not submit anything. Submitting is a side effect on someone's inbox and someone's CRM, so it
stays a human decision. This file is the protocol for doing it properly.

The failure this protocol exists to catch: a form that validates, shows a success message, and
silently drops the lead. Nothing alerts anyone. The first sign is a quiet month.

Sources checked September 2026:

- Brand Vision, "Website QA Checklist Before Launch" — https://www.brandvm.com/post/website-qa-checklist
- Digital Applied, "Form Bot Defense: Honeypot First, CAPTCHA Last" — https://www.digitalapplied.com/blog/form-bot-defense-honeypot-first-playbook
- Growform, "Anti-Spam Honeypot" — https://www.growform.co/glossary/anti-spam-honeypot/
- Splitforms, "Honeypot vs reCAPTCHA" — https://splitforms.com/blog/honeypot-vs-recaptcha

Current position on bot defence: a hidden honeypot field catches most spam on a low-volume form
with no user friction and no cost, and it is the cheapest check, so it runs server-side first,
before anything else touches the submission. Hide it with CSS or ARIA, never with
`type="hidden"`, because bots skip genuinely hidden inputs. Give it an inconspicuous name that a
browser autofill will not target. Layer a denylist or a challenge on top only when a high-volume
form is actually being hit.

---

## Before you start

Write down, for each form, the answers to these. If nobody can answer them, that is the first
finding.

| Question | Why it matters |
|---|---|
| Where is the lead supposed to land? | Inbox, CRM, spreadsheet, webhook. Name the destination. |
| Who owns that destination? | Someone has to confirm the test lead arrived. |
| What is the person told after submitting? | The success state is part of the form. |
| What automated email fires, to whom? | Both the internal alert and the person's confirmation. |
| What conversion event should fire? | So tracking can be verified in the same pass. |
| What is the bot defence? | Honeypot, challenge, rate limit, or nothing. |

Use a recognisable test identity so the test leads can be found and deleted afterwards. A tagged
address such as `you+qa-2026-09-02@yourdomain.com` works, and the tag survives most CRM imports.

---

## Test 1: the happy path, on a real phone

Do this one first and do it on a physical device, not an emulator. Most leads arrive from a
phone on a poor connection.

1. Fill every field with realistic values.
2. Submit.
3. Confirm the success state appears, and read what it says.
4. Confirm the internal notification email arrives.
5. Confirm the person's confirmation email arrives, and check it is not in spam.
6. **Confirm the record exists in the destination system.** Open the CRM. Look at the actual
   record. An email notification arriving is not proof the CRM write succeeded.
7. Confirm every field in the destination matches what was typed, with nothing truncated and
   nothing shifted into the wrong column.
8. Confirm the conversion event fired, once, in analytics.

If any step fails, stop. Fix it before running the rest. Everything below assumes the happy
path works.

## Test 2: validation

Each of these gets its own submission attempt.

- Submit the form completely empty. Every required field should be flagged at once, in place,
  and the first invalid field should receive focus.
- Submit with one required field missing. Only that field is flagged.
- Submit with an invalid email, `not-an-email`. The error names the problem specifically. "Enter
  an email address like name@company.com" beats "Invalid input".
- Submit with a valid but unusual email: a plus tag, a long subdomain, a country TLD. Over-eager
  email regexes reject real addresses.
- Submit with a phone number in every format your audience actually uses: spaces, brackets, a
  leading zero, a country code. A UK mobile as `07700 900123` and as `+447700900123` should both
  be accepted.
- Paste 5,000 characters into a text area and submit. Confirm the server accepts or rejects it
  cleanly, and that nothing downstream truncates mid-record.
- Submit a value containing an apostrophe and a non-ASCII character, for example `O'Brien` and
  `Renée`. Encoding faults surface here and nowhere else.
- Confirm error messages are specific and do not blame the person.
- Confirm errors appear inline as you leave a field, not only after pressing submit.

## Test 3: the honeypot

The honeypot is the field most likely to be broken in the direction nobody notices, because a
broken honeypot rejects real people silently.

1. Find the honeypot field in the page source. If there is not one, that is a finding.
2. Confirm it is hidden with CSS or ARIA, not with `type="hidden"`.
3. Confirm its name is not something a browser autofill will target. A field named `url`,
   `website` or `company` is a trap for autofill as much as for bots.
4. Confirm it carries `tabindex="-1"` and `autocomplete="off"` so keyboard users and password
   managers cannot reach or fill it.
5. **Submit the form with the honeypot filled in**, using the browser developer tools to set a
   value. The submission should be rejected or silently discarded, and no lead should reach the
   CRM. Confirm in the CRM, not in the browser.
6. **Submit the form normally with autofill enabled** on a browser that has stored an address.
   The lead must arrive. This is the test that catches a honeypot eating real leads.
7. Repeat step 6 with a screen reader running, or at minimum with keyboard-only navigation.
   Assistive technology that fills or focuses the honeypot will block real users.
8. Confirm the honeypot check runs server-side. A client-side-only honeypot stops nothing.

## Test 4: consent, privacy and blocked cookies

- Load the page in a private window, refuse all cookie consent, and submit. The form must still
  work. A form that depends on an analytics cookie breaks for every privacy-conscious visitor.
- Confirm what happens to the conversion event under refused consent, and that the behaviour is
  the intended one rather than an accident.
- Confirm the form states what happens to the data, near the submit button, not only in the
  privacy policy.
- Confirm any marketing consent checkbox is unticked by default and separate from the submit
  action.
- Confirm the data being collected is data somebody actually uses. Every unused field costs
  completion for nothing.

## Test 5: accessibility

- Complete the entire form using only the keyboard, from the first field to a successful
  submission.
- Confirm focus is visible on every field, and that focus order matches the visual order.
- Confirm every field has a real label, not a placeholder standing in for one. A placeholder
  disappears as soon as typing starts.
- Confirm error messages are associated with their field programmatically, so a screen reader
  announces them.
- Confirm the success message is announced, not just rendered. A visually-only success state
  leaves a screen reader user unsure whether anything happened.
- Confirm tap targets are at least 48 pixels with clear spacing between them.

## Test 6: failure and abuse behaviour

- Submit twice in quick succession. Confirm you get one lead, not two. Double-submission is the
  most common source of duplicate CRM records.
- Submit, then press the browser back button, then forward. Confirm nothing resubmits.
- Submit with the network throttled to a slow connection. Confirm the button disables and shows
  a pending state rather than inviting a second press.
- Submit with the backend deliberately unreachable, if you can arrange it. Confirm the person
  sees a real error and a way to reach you another way, rather than a spinner forever.
- Submit ten times in a minute. Confirm rate limiting exists on any public endpoint.

## Test 7: the destination, end to end

This is the step teams skip.

1. Open the destination system as the person who works the leads, not as an admin.
2. Confirm the test lead is visible in the view they actually use.
3. Confirm it is routed to the right owner, queue or pipeline stage.
4. Confirm any automation the lead is meant to trigger has run.
5. Confirm the lead source is attributed correctly, so the form can be measured later.
6. Delete the test records, and note who deleted them and when.

---

## Recording the result

Add a table like this to the QA report for the site, one row per form.

| Form | Page | Happy path | Validation | Honeypot | Consent off | Keyboard only | Lead in CRM | Event fired | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Book a walkthrough | /book | pass | pass | pass | pass | fail | pass | pass | Focus order jumps to the footer after field 3 |

Any `fail` in the happy path, honeypot, or lead-in-CRM columns blocks the launch. A failure
anywhere else is a warning with a named owner.
