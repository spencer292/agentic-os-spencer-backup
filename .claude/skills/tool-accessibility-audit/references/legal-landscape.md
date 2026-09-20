# Which accessibility law applies, September 2026

Work out which of these applies before you audit. It sets the standard, the evidence you need to keep, and who can act if the site fails.

## Summary

| Regime | Who it covers | Standard | Must publish a statement | Enforcer |
|---|---|---|---|---|
| UK Public Sector Bodies Accessibility Regulations 2018 | UK public sector bodies and some bodies mostly publicly funded | WCAG 2.2 AA | Yes, prescribed format | EHRC in England, Scotland and Wales. ECNI in Northern Ireland. Monitored by GDS. |
| UK Equality Act 2010 | Everyone providing goods, services or facilities in the UK | No named standard. Reasonable adjustments duty. | No, but publish one anyway | Individual claims in the county court or sheriff court |
| European Accessibility Act, Directive (EU) 2019/882 | Consumer-facing products and services sold into the EU, in named sectors | EN 301 549 | Yes, accessibility information | National market surveillance authorities in each Member State |
| EU Web Accessibility Directive 2016/2102 | EU public sector bodies | EN 301 549 | Yes | National monitoring bodies |
| US Section 508, and ADA Title II rule | US federal agencies, and US state and local government | WCAG 2.1 AA under the 2024 ADA Title II rule | Varies | DOJ, and the relevant agency |

## UK public sector

The Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 have required WCAG 2.1 AA since 23 September 2020. The baseline moved to **WCAG 2.2 AA**, and GDS has been testing against 2.2 since October 2024 following the standard 12-month grace period from publication of WCAG 2.2.

What the regulations require:

1. Meet WCAG 2.2 AA, so far as reasonably practicable.
2. Publish an accessibility statement in the prescribed format, and keep it current.
3. Provide an accessible alternative where content is exempt or a disproportionate burden is claimed.
4. Respond to requests for content in an accessible format, and to complaints.

Who is in scope. Central government, local government, the NHS, emergency services, most arm's-length bodies, and non-government organisations that are mostly publicly funded or that provide services essential to the public and are aimed at disabled people.

Who is partly or wholly out. Public sector broadcasters and their subsidiaries. Schools and nurseries, except for content people need to use the service, such as term dates, admissions and closure notices. Charities, unless mostly publicly funded or providing essential services.

Content exemptions, which still have to be named in the statement. Documents published before 23 September 2018 that are not needed for an active service. Pre-recorded media published before 23 September 2020. Live media. Online maps, unless used for navigation, in which case essential information must also exist in an accessible format. Third-party content that you neither fund nor develop nor control. Heritage collections and archives. Intranets and extranets published before 23 September 2019 until they are substantially revised.

**Disproportionate burden.** A body may claim that a specific fix is disproportionate, weighing the burden on the organisation against the benefit to disabled users, taking account of its size, resources and nature. The assessment must be carried out and documented before the claim is published. An undocumented claim is itself a failure, and it is one of the things GDS looks for.

**Monitoring.** GDS samples public sector sites and apps each year. It runs a simplified test on a large sample and a detailed test on a smaller one, publishes the outcomes, and gives failing bodies a period to fix. Persistent failure is escalated to the EHRC, which can investigate, issue an unlawful act notice, and go to court.

## UK private sector

No sector-specific web accessibility regulation. The Equality Act 2010 applies. Section 20 sets an anticipatory duty to make reasonable adjustments for disabled people, meaning it applies before any individual asks. WCAG 2.2 AA is the accepted evidence of what is reasonable, because it is what the public sector is held to and what procurement asks for.

Practical consequences. Claims are brought by individuals and are usually settled. The larger commercial exposure is procurement. Public sector buyers require WCAG 2.2 AA conformance and an accessibility statement, and large private buyers increasingly copy that requirement.

## European Accessibility Act

Directive (EU) 2019/882 has applied since **28 June 2025**. Unlike the Web Accessibility Directive, it reaches the private sector.

Covered services, when offered to consumers in the EU. E-commerce. Consumer banking. E-books and dedicated software. Electronic communications. Access to audiovisual media services. Passenger transport for air, bus, rail and waterborne services, including websites, apps, ticketing and information. Covered products include computers, smartphones, e-readers, payment terminals, ATMs and ticketing machines.

It applies on the basis of where the consumer is, not where the seller is. A UK or US business selling into the EU is in scope.

Exemptions. Microenterprises providing services, meaning under 10 staff and annual turnover or balance sheet total at or under 2 million euro. A fundamental alteration or a disproportionate burden may be claimed, with documentation, and the assessment reviewed at least every five years. There is a transition allowing service contracts concluded before 28 June 2025 to continue unchanged until they end, and no later than 28 June 2030, plus a longer window for self-service terminals in use before that date.

**The standard.** Conformity is presumed by meeting the harmonised standard, EN 301 549. As of September 2026 the harmonised version is **v3.2.1**, which incorporates WCAG 2.1 AA. **v4.1.1** incorporates WCAG 2.2 AA and is expected to be cited in the Official Journal later in 2026. WCAG 2.2 is backward compatible with 2.1, so testing to WCAG 2.2 AA satisfies the current requirement and prepares for the next one. Do not claim conformance to a version that is not yet harmonised. Re-check the citation status before naming a version in any statement.

**Enforcement.** Each Member State designates market surveillance authorities and sets its own penalties. Non-conforming services can be withdrawn from the market. Complaints can be brought by consumers and by representative bodies.

## United States, in brief

Section 508 of the Rehabilitation Act binds US federal agencies and their suppliers, referencing WCAG 2.0 AA through the 2017 refresh. The Department of Justice's 2024 ADA Title II rule sets **WCAG 2.1 AA** for state and local government, with compliance dates staggered by entity size, in April 2026 and April 2027. Title III, covering places of public accommodation, has no adopted technical standard, and courts have generally treated WCAG AA as the benchmark. Testing to WCAG 2.2 AA covers all of these.

## What this means for an audit

- Establish the regime first, because it decides the standard you test against and whether a statement is legally required.
- Test to **WCAG 2.2 AA** in every case. It is the UK public sector baseline, it satisfies WCAG 2.1 AA for the EAA and the US rules, and it is where EN 301 549 is heading.
- Keep the evidence. Which pages, which date, which method, which criteria passed and failed. The statement is built from it, and a regulator will ask for it.
- Never issue a conformance claim from an automated run. Automation decides about a third of the criteria.

## Sources

- The Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018. https://www.legislation.gov.uk/uksi/2018/952/contents/made — checked September 2026
- GOV.UK, Understanding accessibility requirements for public sector bodies. https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps — checked September 2026
- GOV.UK, Sample accessibility statement. https://www.gov.uk/guidance/model-accessibility-statement — checked September 2026
- GOV.UK, Public sector website and mobile application accessibility monitoring. https://www.gov.uk/government/collections/public-sector-website-and-mobile-application-accessibility-monitoring — checked September 2026
- Equality Act 2010. https://www.legislation.gov.uk/ukpga/2010/15/contents — checked September 2026
- Directive (EU) 2019/882, the European Accessibility Act. https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32019L0882 — checked September 2026
- ETSI EN 301 549 and the v4.1.0 final draft. https://www.etsi.org/deliver/etsi_en/301500_301599/301549/ — checked September 2026
- US Department of Justice, ADA Title II web and mobile accessibility rule. https://www.ada.gov/resources/2024-03-08-web-rule/ — checked September 2026
