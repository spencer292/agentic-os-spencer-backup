# Accessibility Baseline

Checked September 2026. Sources listed in `sources-2026-09.md`. The UK public-sector position comes
from https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps,
checked September 2026.

## What to audit against

**WCAG 2.2 Level AA is the working baseline for every audit.** It is a superset of 2.1 AA, so
auditing against 2.2 satisfies anything that still formally names 2.1. Use it regardless of which
regulation applies to the client.

## The legal position, stated accurately

**United Kingdom, public sector.** Monitored against WCAG 2.2 AA since October 2024, per the GOV.UK
guidance "Understanding accessibility requirements for public sector bodies", which states plainly that
sites and apps must meet the WCAG 2.2 AA standard. The Public Sector Bodies (Websites and Mobile
Applications) Accessibility Regulations 2018 reference EN 301 549 and WCAG 2.1 AA in their original
text, and the September 2024 update to the guidance removed the transitional section explaining when
the new 2.2 success criteria would start being monitored. Treat 2.2 AA as the working baseline, because
that is what the Government Digital Service actually monitors against today.

**United Kingdom, private sector.** No WCAG version is written into statute. The Equality Act 2010 duty
to make reasonable adjustments applies, and WCAG 2.2 AA is the defensible standard, meaning the
evidence used to show the duty was met.

**European Union.** The European Accessibility Act has applied since 28 June 2025 to consumer-facing
products and services sold into the EU, including e-commerce, banking, transport and e-books. The
technical standard is EN 301 549, which currently harmonises to WCAG 2.1 AA, with a revision in
progress to bring WCAG 2.2 in. Penalties are set by each member state and vary widely. Enforcement is
live, with the first cases already filed.

A UK business selling to EU consumers is inside the EAA's scope. Do not tell a client the EAA does not
apply to them because they are outside the EU. It follows the customer, not the seller.

## What WCAG 2.2 added that pages actually fail

These are the criteria most often missed on a site built to 2.1, so check them explicitly.

| Criterion | Level | What fails in practice |
|-----------|-------|------------------------|
| Focus not obscured, minimum | AA | A sticky header or cookie bar covering the element that just received keyboard focus |
| Focus appearance | AAA | A focus ring too thin or too low-contrast to see. AA still requires a visible indicator |
| Target size, minimum | AA | Interactive targets under 24 by 24 CSS pixels with no spacing exemption. 48px remains the practical mobile target |
| Dragging movements | AA | Sliders, carousels and reorder controls with no single-pointer alternative |
| Consistent help | A | Help contact placed in a different location on different pages |
| Redundant entry | A | Asking for information the visitor already provided earlier in the same process |
| Accessible authentication | AA | A login or gate demanding a cognitive test, such as transcribing a puzzle, with no alternative |

Two criteria were removed in 2.2. Success criterion 4.1.1 Parsing is obsolete and should not be
reported as a failure.

## Where accessibility and conversion overlap

They are the same findings from a different angle, so report them once.

- Contrast failures cost readability for everyone on a phone in daylight, not only for people with low
  vision.
- Placeholder-only labels break screen readers and also erase the label the moment typing starts.
- A target under 24px fails WCAG and also produces mis-taps, which show up as rage clicks.
- Focus obscured by a sticky bar breaks keyboard use and also hides the CTA that the sticky bar was
  added to promote.
- Error text that does not say what to fix fails 3.3.3 and also abandons the form.

Where a finding is both, say both. It raises the priority without inventing a second issue.
