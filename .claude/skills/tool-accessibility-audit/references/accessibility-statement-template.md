# Accessibility statement template

The UK public-sector model format, which is also the clearest structure for a private-sector or EU-facing statement. Fill every bracket. An unfilled bracket published live is worse than no statement.

Publish it at a stable URL, link it from every page (the footer is the convention), and make sure the page itself is accessible.

---

## When a statement is legally required

**UK public sector.** The Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 require every in-scope body to publish and maintain an accessibility statement in this format, and to meet WCAG 2.2 AA. The Government Digital Service monitors a sample every year. The Equality and Human Rights Commission enforces in England, Scotland and Wales, the Equality Commission for Northern Ireland in Northern Ireland.

**EU-facing services.** The European Accessibility Act has applied since 28 June 2025 to consumer-facing services including e-commerce, banking, e-books, transport ticketing, telecoms and audiovisual media, sold into the EU regardless of where the seller is based. It requires published accessibility information. Microenterprises providing services, meaning fewer than 10 staff and turnover or balance sheet at or under 2 million euro, are exempt from the service obligations.

**UK private sector.** No statement is mandated, but the Equality Act 2010 duty to make reasonable adjustments applies, and a statement is the practical evidence that the duty was considered. Publish one.

---

## Template

```markdown
# Accessibility statement for [website name or URL]

This statement applies to [name the exact scope: the website at example.org,
its subdomains, the iOS and Android apps. Say plainly what is NOT covered].

This website is run by [organisation name]. We want as many people as possible
to be able to use it. For example, that means you should be able to:

- change colours, contrast levels and fonts using browser or device settings
- zoom in up to 400% without the text spilling off the screen
- navigate most of the website using just a keyboard
- navigate most of the website using speech recognition software
- listen to most of the website using a screen reader, including the most
  recent versions of JAWS, NVDA and VoiceOver

We have also made the website text as simple as possible to understand.

[AbilityNet](https://mcmw.abilitynet.org.uk/) has advice on making your device
easier to use if you have a disability.

## How accessible this website is

[Say in plain language what does not work. Two or three sentences. For example:
"Some pages are not fully accessible. You cannot modify the line height or
spacing of text. Most older PDF documents are not fully accessible to screen
reader software. Live video streams do not have captions."]

## Feedback and contact information

If you need information on this website in a different format, such as
accessible PDF, large print, easy read, audio recording or braille:

- email [address]
- call [phone number]
- [any other contact route, and the postal address if you have one]

We will consider your request and get back to you in [number] days.

[If any part of the service is unavailable in an accessible format, say here
what alternative route exists.]

## Reporting accessibility problems with this website

We are always looking to improve the accessibility of this website. If you find
any problems not listed on this page, or think we are not meeting accessibility
requirements, contact [contact route, which must be the same as or clearly
linked to the one above].

## Enforcement procedure

The Equality and Human Rights Commission (EHRC) is responsible for enforcing the
Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility
Regulations 2018 (the 'accessibility regulations'). If you are not happy with how
we respond to your complaint, contact the
[Equality Advisory and Support Service (EASS)](https://www.equalityadvisoryservice.com/).

[In Northern Ireland, replace the EHRC with the Equality Commission for Northern
Ireland (ECNI), and point complaints to ECNI rather than the EASS.]

## Technical information about this website's accessibility

[Organisation name] is committed to making its website accessible, in accordance
with the Public Sector Bodies (Websites and Mobile Applications) (No. 2)
Accessibility Regulations 2018.

### Compliance status

[Pick exactly one of the three.]

**Fully compliant.** This website is fully compliant with the Web Content
Accessibility Guidelines version 2.2 AA standard.

**Partially compliant.** This website is partially compliant with the Web Content
Accessibility Guidelines version 2.2 AA standard, due to the non-compliances
listed below.

**Not compliant.** This website is not compliant with the Web Content
Accessibility Guidelines version 2.2 AA standard. The non-compliances are listed
below.

## Non-accessible content

The content listed below is non-accessible for the following reasons.

### Non-compliance with the accessibility regulations

[One entry per known failure. Each entry names what fails, which success
criterion, and when it will be fixed. Do not give an effort estimate. Give a
date or a milestone.]

1. [What fails, and where. For example: "Contrast between the button text and
   the button background falls below 4.5 to 1 on the course listing pages."]
   This fails WCAG 2.2 success criterion [number and name, for example
   1.4.3 Contrast (Minimum)]. We plan to fix this by [date or named release].

2. [Next failure.] This fails WCAG 2.2 success criterion [number and name].
   We plan to fix this by [date or named release].

[When new content is published, add it here if it introduces a new failure.]

### Disproportionate burden

[Only if you have actually carried out and documented an assessment. If you have
not, delete this section. An undocumented claim of disproportionate burden is
itself a compliance failure.]

[Name the specific content. Summarise the assessment: the size and resources of
the organisation, the estimated cost, and the estimated benefit to disabled
users. State that the assessment will be reviewed on [date].]

### Content that is not within the scope of the accessibility regulations

[Common exclusions. Delete anything that does not apply.]

**PDFs and other documents.** [Some or all] of our PDFs and Office documents do
not meet accessibility standards. The accessibility regulations do not require us
to fix PDFs or other documents published before 23 September 2018 if they are not
essential to providing our services. Any new PDFs or Word documents we publish
will meet accessibility standards.

**Live video.** Live video streams do not have captions. This is exempt under
the accessibility regulations.

**Maps.** [Online maps are exempt where they are not used for navigational
purposes. If a map is used to find a service, essential information must also be
given in an accessible format such as a postal address.]

**Third-party content.** [Name any third-party content that you do not fund,
develop or control. Content you paid for and configured is not exempt.]

## What we're doing to improve accessibility

[The plan. Name the next audit date, the retest cycle, and how new content is
checked before publication. A date or a milestone, not an effort estimate.]

## Preparation of this accessibility statement

This statement was prepared on [date]. It was last reviewed on [date].

This website was last tested on [date]. The test was carried out by
[who: an internal team, or a named external auditor].

[Say how pages were chosen. For example: "We tested a representative sample
covering the home page, one page of each template, the contact form, the search
results page and the checkout, chosen because they carry the highest traffic and
every shared component."]

[Name the method: automated testing with axe-core through Playwright at desktop
and mobile viewports, plus manual keyboard-only, screen-reader, zoom, reflow and
content review against WCAG 2.2 AA.]
```

---

## An EU-facing addition

For a service in EAA scope, add this section. Keep the UK sections if the UK regulations also apply.

```markdown
## European Accessibility Act

This service is offered to consumers in the European Union and is within the
scope of the European Accessibility Act (Directive (EU) 2019/882), which has
applied since 28 June 2025.

We assess this service against EN 301 549, the harmonised European standard for
ICT accessibility. Clauses 9, 10 and 11 of that standard set the requirements
for web content, documents and software.

[State the current position. For example: "We test against WCAG 2.2 AA, which
covers and exceeds the WCAG 2.1 AA requirements in the currently harmonised
version of EN 301 549."]

If you have a complaint about the accessibility of this service under the
European Accessibility Act, contact us at [address]. If you are not satisfied
with our response, you can escalate to the market surveillance authority in your
Member State.
```

**Version note, September 2026.** The harmonised version of EN 301 549 is still v3.2.1, which incorporates WCAG 2.1 AA. Version 4.1.1 incorporates WCAG 2.2 AA and is expected to be cited in the Official Journal of the European Union later in 2026. Testing against WCAG 2.2 AA today satisfies both, because 2.2 is backward compatible with 2.1. Do not claim conformance to EN 301 549 v4.1.1 until it is harmonised. Re-check the citation status before making any statement that names a version.

---

## Rules for filling this in

- Every claimed non-compliance is listed. A statement that says "partially compliant" and lists nothing is a failure in itself, and it is the single most common problem GDS reports.
- Every entry names the success criterion by number and name.
- Every entry has a date or a named release, never an effort estimate.
- The contact route must work and must be monitored.
- Review and update the statement whenever the site changes materially, and at least once a year. Both dates go in.
- Do not claim disproportionate burden without a documented assessment.
- Do not claim full compliance from an automated scan. Automation decides about a third of the criteria.

## Sources

- GOV.UK, Understanding accessibility requirements for public sector bodies. https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps — checked September 2026
- GOV.UK, Sample accessibility statement. https://www.gov.uk/guidance/model-accessibility-statement — checked September 2026
- The Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018. https://www.legislation.gov.uk/uksi/2018/952/contents/made — checked September 2026
- Directive (EU) 2019/882, the European Accessibility Act. https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32019L0882 — checked September 2026
- ETSI EN 301 549, harmonised European accessibility requirements for ICT. https://www.etsi.org/standards — checked September 2026
