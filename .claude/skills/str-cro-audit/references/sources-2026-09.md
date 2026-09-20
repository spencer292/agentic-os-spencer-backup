# Sources and Verification Log

Every number this skill cites, where it came from, and when it was last checked. Re-verify on the next
currency pass and update the checked column. A claim that cannot be re-sourced gets softened or
removed, not carried forward.

Checked: September 2026.

## Core Web Vitals

| Claim | Verdict | Source |
|-------|---------|--------|
| LCP at or under 2.5s, INP at or under 200ms, CLS at or under 0.1 | Confirmed | https://www.corewebvitals.io/core-web-vitals |
| Judged at the 75th percentile of real Chrome users over a rolling 28-day window | Confirmed | https://www.corewebvitals.io/core-web-vitals and https://www.rivuletiq.com/core-web-vitals-2026-whats-changed-and-how-to-pass/ |
| INP is the most commonly failed of the three, usually from third-party JavaScript | Confirmed across 2026 guides | https://www.rivuletiq.com/core-web-vitals-2026-whats-changed-and-how-to-pass/ |

## Forms

| Claim | Verdict | Source |
|-------|---------|--------|
| Completion about 23% at three fields, 17% at five, 11% at seven, 7% at ten or more | Confirmed, benchmark aggregation | https://foundrycro.com/blog/form-conversion-rate-benchmarks-2026/ and https://www.digitalapplied.com/blog/form-conversion-rate-benchmarks-2026-data-points |
| Single column with full-width inputs | Confirmed, Baymard | https://baymard.com/learn/input-fields |
| One full-name field rather than first and last | Confirmed, Baymard | https://baymard.com/learn/input-fields |
| "Every field over five costs 20 to 30%" | Softened. The direction holds and the cliff is real, but the cited figure varies by source. The checklist now quotes the measured curve instead | as above |
| Progress indicators cut abandonment 20 to 30% | Not confirmed. Vendor-reported figures range from 10% to over 200% and none is independently replicated. The checklist keeps the practice and drops the number | https://heyflow.com/blog/reduce-form-abandonment-progress-indicators/ |

## Calls to action and trust

| Claim | Verdict | Source |
|-------|---------|--------|
| Outline buttons underperform solid for a primary action | Confirmed, two named tests: about 20% fewer clicks in a CXL A/B over 10,000 visits, and 7% behind solid in an Elevated Third email test | https://cxl.com/blog/ghost-buttons/ and https://blog.logrocket.com/ux-design/using-ghost-buttons-effective-ctas/ |
| Sticky mobile CTA lifts conversion | Direction confirmed, size varies widely by page type and test: roughly 5% to 31% across published cases, with about 20% in a controlled A/B | https://convertibles.dev/blogs/case-studies/homepage-sticky-cta-case-study and https://www.stickyctas.com/articles/sticky-ctas-data |
| "Micro-copy adds 10 to 20% click lift" | Not confirmed as a specific number. Kept as practice, dropped as a statistic | no primary source found |
| Two or three trust signals beside the action, not six | Confirmed as current placement guidance | https://www.digitalapplied.com/blog/social-proof-trust-signals-2026-conversion-placement-framework and https://ecomdesignpro.com/ecommerce-trust-signals/ |
| "7+ trust signal types hurts credibility by about 8%" | Not confirmed. Replaced with the qualitative clutter guidance above | as above |
| A perfect five-star rating converts no better than a strong imperfect one | Confirmed | https://ecomdesignpro.com/ecommerce-trust-signals/ |

## Quiz and lead-magnet funnels

| Claim | Verdict | Source |
|-------|---------|--------|
| 40.1% start to lead, 65% start to finish | Confirmed, Interact 2026 report, corpus of more than 80 million leads | https://www.tryinteract.com/blog/quiz-conversion-rate-report/ |
| Service providers around 42% start to lead and 47% start to finish | Confirmed, same report | as above |
| Interactive assets convert a far larger share of visitors than gated PDFs | Confirmed in direction across 2026 benchmark write-ups. The exact multiple varies by source, so quote it as a direction | https://www.digitalapplied.com/blog/lead-magnet-conversion-benchmarks-2026-b2b-data-reference |
| Contact form after the questions and before the results | Consensus across current guides, not a published A/B. Recorded as consensus in the reference | https://www.tryinteract.com/blog/quiz-conversion-rate-report/ |
| Personalised CTAs convert better than generic | Direction confirmed across 2026 CTA benchmarks | https://foundrycro.com/blog/cta-button-conversion-rate-benchmarks-2026/ |

## Mobile

| Claim | Verdict | Source |
|-------|---------|--------|
| Mobile is the majority of traffic and converts at roughly half the desktop rate on lead forms | Confirmed in direction across 2026 landing-page benchmarks. Always replace with the client's own device split when it exists | https://www.digitalapplied.com/blog/landing-page-statistics-2026-conversion-data-points |

## Accessibility

| Claim | Verdict | Source |
|-------|---------|--------|
| EAA applies since 28 June 2025 to EU-facing consumer services | Confirmed | https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/ |
| EN 301 549 currently harmonises to WCAG 2.1 AA, with a revision in progress to bring 2.2 | Confirmed | https://getwcag.com/en/what-is-european-accessibility-act-eaa |
| UK public sector bodies are monitored against WCAG 2.2 AA since October 2024 | Confirmed against the primary source. The GOV.UK guidance states sites and apps must meet WCAG 2.2 AA, and its 30 September 2024 update note records the removal of the transitional section on when the new 2.2 criteria would start being monitored. This supersedes an earlier, softer reading of this file that leant on the 2018 regulation text and secondary commentary | https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps |
| The 2018 regulations themselves reference EN 301 549 and WCAG 2.1 AA in their original text | Confirmed, and this is why secondary sources still describe 2.1 AA as the UK standard. The regulation text and what the Government Digital Service monitors are not the same thing, so cite the guidance, not the regulation | https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps |
| UK private sector: no WCAG version in statute, Equality Act 2010 duty applies, WCAG 2.2 AA is the defensible standard | Confirmed | https://www.akoode.com/blog/uk-web-accessibility-eaa-wcag |
| Enforcement is live, first EAA cases filed November 2025 | Confirmed | https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/ |

## Behavioural analytics

| Claim | Verdict | Source |
|-------|---------|--------|
| Microsoft Clarity is free with no traffic cap, five heatmap types, session replay, automatic rage-click and dead-click detection, funnels from Smart Events, Copilot summaries and an AI bot report | Confirmed September 2026 | Microsoft Learn Clarity documentation, Copilot overview and Smart Events guide |

## How to use this file

- Quote a number only if it appears here with a Confirmed verdict.
- A claim marked Not confirmed stays in the checklist as practice, with no number attached.
- When a client's own analytics contradict a benchmark, the client's data wins and the benchmark
  becomes context.
