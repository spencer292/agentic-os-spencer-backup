# Deploy paths

Two shapes, both proven in production. The instrument and the copy set are identical across them.
What differs is where the result lives and where the lead goes.

Pick the path first. It decides the result-link mechanism, and that is the one thing that is
awkward to change later because links are already in the wild.

---

## Choosing

| Question | Path A | Path B |
|----------|--------|--------|
| Does the client own the site the quiz sits on? | Yes | No, or not yet |
| Do leads need to land in the client's own database? | Yes | Webhook only |
| Is there an existing design system to inherit? | Yes | Build or fork one |
| Is this a demo or a pilot? | No | Often |
| Is there a database and a migration path? | Yes | No database at all |

Path A when the quiz becomes a permanent part of a site the client already runs. Path B for a
demo, a subdomain, a pilot, or a client whose main site you do not control.

Both keep the same principle: the client owns the funnel, the domain, the data and the leads. No
quiz SaaS seat, no off-domain data, no vendor able to close an account and take the leads with it.

---

## Path A: inside a site the client owns

Shape: a framework app with a database, most often Next.js with a content backend.

**Routes**
- `/{quiz-slug}` the landing page
- `/{quiz-slug}/take` the question flow and the gate
- `/{quiz-slug}/results/[resultKey]` the results page
- `/api/{quiz-slug}/submit` the submit handler

Keep existing URLs working byte-for-byte if a quiz is being replaced. Result links exist in the
wild and they must keep resolving.

**Submit handler, in order**
1. Parse the body through the submission guard, which derives valid question and answer ids from
   the definition at call time. Never hard-code the ids in the guard, or a content change
   desynchronises it silently.
2. Check the honeypot field. A filled honeypot returns a normal-looking success and stores nothing.
3. Score on the server. Never trust a score computed in the browser.
4. Persist the lead, the answers and the frozen score together, keyed by a result key.
5. Mirror to whatever the client already uses for records, if anything, from a background task.
6. Fire the email seam. Build it as a seam even when nothing is wired to it, so wiring it later
   changes one file.
7. Redirect to the results page.

**Result key**
A random, non-enumerable identifier. A UUID v4 from the platform crypto API is enough, and the
database column default is the durable generator of record. Never derive the key from a row id, an
email or a name. An enumerable key means anyone can walk the whole lead list.

**Data rules**
- The result page reads a frozen score, never a recomputation from a mutable row.
- No email address, no name and no other personal data in the result URL or in its link-preview
  metadata. A shared link must be safe to share.
- Access control on the stored rows is deny-by-default. A quiz response collection readable by the
  public is a lead-list leak.

**Sharp edge.** If development and production share one database, do not run migrations or start a
dev server without checking what it would push. This has bitten a real build.

---

## Path B: standalone stateless app

Shape: a framework app with no database at all.

**Result links are signed tokens.** The URL carries the answer ids in question order, the segment
and a timestamp, signed with an HMAC. The results page verifies the signature and re-scores from
the answers with the same pure engine the submit route used.

Three properties fall out of that and they are the reason to choose it:
- The score cannot be edited in the URL, because the signature covers the payload.
- No contact detail ever appears in the link.
- Swapping to a database later means replacing the sign and verify pair with a create and fetch
  pair, and nothing else moves.

Keep the payload versioned with a `v` field so a later shape change can be detected rather than
mis-parsed. Reject any token over a sane length before doing any work on it.

**The signing secret** is read from the environment by name. Set it before anything is public. Ship
a development fallback if you must, but make the fallback obviously not a production value and say
so in the handover notes.

**Leads go to one seam.** A single `deliverLead` function logs a structured line and, when a webhook
URL is set in the environment, forwards the same JSON. That covers an automation platform, a
spreadsheet sync, or a records database. Call it from a background task so a slow or failing
destination never delays the visitor, and never let a webhook failure surface as an error to them.

**Demo hygiene.** If this is a demo rather than a launch, every page carries a noindex meta tag and
the response carries an `X-Robots-Tag: noindex` header, so the demo never enters search. List
everything demo-only in the README: illustrative benchmarks, a booking page that logs rather than
schedules, any ribbon that has to come off at launch.

---

## Shared: funnel event taxonomy

One tracking seam for the whole funnel, fanning out to whatever is present on the page. Analytics
setup, consent and the funnel build itself belong to `tool-behaviour-analytics`. This section is
only the vocabulary the funnel is built on.

```
quiz_start_click
  -> segment_selected
  -> question_answered   (once per question, carrying the question number)
  -> quiz_completed
  -> lead_captured
  -> results_viewed
  -> cta_click
  -> cta_submitted
```

Rules that make the funnel readable later:
- snake_case, one vocabulary, no synonyms. Renaming an event breaks every historical funnel.
- One `track()` function is the only place any vendor is named. Nothing else in the app knows what
  analytics is installed.
- Nothing in the seam blocks rendering and nothing throws when a vendor is absent.
- Attach session tags for the segment and the score tier, so sessions can be filtered by them.
- Never put an email address, a name or any other personal data in an event property or a tag.

Build the funnel on these eight steps. `question_answered` firing per question is what makes
per-question drop-off readable, and per-question drop-off is the only way to find the single
question that is losing people.

---

## Shared: interface rules

These carry across both paths.

**Sector or segment first.** Screen one is the segment picker, before any question and before the
gate. It is not personal data, so it costs nothing to ask early, and it drives the benchmark
comparison on the results page. Tappable cards, not a dropdown.

**Gate after the questions, by default.** Put the position behind a single config constant so
flipping it is a one-line change and an A/B arm, not a rebuild:

```ts
export const LEAD_GATE_POSITION: "before" | "after" = "after";
```

Document both positions in the file's own comment, including what each costs. Gate-after means
people who abandon mid-quiz leave no email. Gate-before captures every starter at the price of a
colder ask on screen one. The evidence does not settle it. See `funnel-benchmarks.md` section 3.

**Mobile first, and mean it.**
- Single column everywhere, including the gate form
- Answer cards large enough to tap comfortably, at least 48 px of target with space between them
- Sticky bottom call to action on landing and results, hidden from desktop widths
- The primary action sits in the thumb zone
- Decorative imagery hides below the large breakpoint so the headline and button own the first
  screen
- No two-column inputs at any width

**Progress indication.** Show position in the flow and allow going back. Treat it as good practice
rather than a numbered claim, because the commonly quoted abandonment figure has no traceable
source.

**Results page layout.** Score, then the tier-matched overall copy, then the category blocks, with
the call to action repeated after the overall block and after the categories. One destination.
Greet by first name from device-local storage rather than from the URL, so a shared link never
carries a name.

**Performance.** The funnel is usually judged on a mid-range phone. Keep the font weights to the
few you actually use, preconnect to any font host, set the viewport and theme colour, and keep
third-party tags off the critical path. Interaction responsiveness is the vital most often failed,
and heavy third-party script is the usual cause.

---

## Handover

Whichever path, the handover states:

- Where the quiz content lives and that changing a question is a content edit, not a code change
- The command that validates the config, and that it must pass before any push
- Which environment variables must be set, by name, never by value
- Everything labelled illustrative or demo-only, and what has to change at launch
- Who owns the leads, and where they arrive
- The eight funnel events, so whoever builds the dashboard uses the same names
