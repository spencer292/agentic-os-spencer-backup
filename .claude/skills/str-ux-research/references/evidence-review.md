# Evidence review: analytics, crawl, heuristics

Self-contained reference for `str-ux-research` Mode B. Three parts. Every finding cites the page
or the export it came from, with the date range.

## Part 1: Analytics

Ask the client for exports rather than guessing. Never state a number you were not given or did
not pull yourself.

### Google Analytics 4

Ask for, or pull, these with an explicit date range. Use a period long enough to survive weekly
noise, and state the range next to every number in the brief.

| Report | What to take from it |
|--------|----------------------|
| Traffic acquisition by channel | Which channels are worth designing for, and which the client believes in but does not have |
| Landing pages by sessions and key events | Which pages actually receive people, versus which pages the client talks about |
| Key events by landing page | Whether conversion is concentrated in a few pages or spread thin |
| Device category | Mobile share. Design order follows it |
| Path exploration from the top landing pages | Where people go next, and where they stop |
| Site search terms, if enabled | The strongest top-task signal on the site |

Two 2026 notes. GA4 groups AI assistant referrals as their own source set since its June 2026
update, so check whether the site is already receiving assistant-driven traffic. Traffic arriving
from Google AI Mode cannot be attributed because it is sent without a referrer, so absence of
that traffic in GA4 is not evidence of absence.

### Google Search Console

| Report | What to take from it |
|--------|----------------------|
| Queries, by clicks and by impressions | The demand the site already touches, in the visitor's words |
| Pages, clicks against impressions | Pages with impressions and no clicks. Usually a title, intent or expectation mismatch |
| Query to page mapping | Where two pages compete for one query, which is a merge candidate |
| Devices and countries | Confirms or contradicts the GA4 device split |
| Core Web Vitals | Field data, not lab data. Targets below |

Record the property type used, domain property or URL-prefix property, because they report
different totals.

### Behaviour analytics

Microsoft Clarity is free with no traffic caps and covers heatmaps of five types, session
recordings, funnels, automatic rage-click and dead-click detection, and Copilot session
summaries. Where `tool-behaviour-analytics` is installed, use it. Where it is not, ask the client
for Clarity access or exports.

What to take from it: rage clicks and dead clicks by page, scroll depth against where the primary
call to action sits, funnel drop-off between steps, and three to five recordings of sessions that
ended without converting.

If no behaviour data exists at all, that is a finding. Record it, and put installing behaviour
analytics into the recommendations so the next audit has evidence.

### Performance targets to check against

Core Web Vitals thresholds, at the 75th percentile over 28 days of field data: largest
contentful paint at or under 2.5 seconds, interaction to next paint at or under 200 milliseconds,
cumulative layout shift at or under 0.1. Interaction to next paint replaced first input delay in
March 2024 and is the most commonly failed of the three.

## Part 2: Live crawl

Crawl with `tool-firecrawl-scraper` where a key is available. Otherwise WebFetch the top pages by
sessions plus the home page, and say in the brief that the crawl was partial and which pages it
covered.

Capture per URL: title, meta description, H1, heading structure, primary call to action, whether
the page states who it is for, word count, presence of proof, presence of a phone or contact
path, and last visible update.

Flag: pages with no call to action, duplicate H1s across pages, orphan pages with traffic,
pages whose title promises something the body does not deliver.

## Part 3: Heuristic review

Score the current site against the ten Nielsen Norman usability heuristics. They were published
in 1994, refined in wording, and are unchanged in substance. Heuristic review finds a lot of
problems without recruiting anyone, and it complements user testing rather than replacing it.
Note that distinction in the brief so nobody mistakes it for user research.

1. Visibility of system status
2. Match between the system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognise, diagnose and recover from errors
10. Help and documentation

For each, record severity as blocking, major, minor or cosmetic, name the page, and describe what
you saw. A heuristic with no observed problem is recorded as passing, not omitted.

### Mobile and accessibility pass

Run alongside the heuristics, not instead of them.

- Touch targets at least 48 pixels, with spacing between adjacent targets
- Primary action reachable in the thumb zone on a phone
- No horizontal scroll at 360 pixels wide
- Body text at 16 pixels or larger
- Contrast at 4.5 to 1 for body text and 3 to 1 for large text
- Heading levels in order, with no skipped levels
- Visible focus states on every interactive element
- Forms with labels, not placeholder-only fields
- Reduced-motion preference respected

The accessibility baseline to audit against is WCAG 2.2 level AA. It is the UK public sector
requirement, and the European Accessibility Act has applied to EU-facing services since 28 June
2025, so any client selling into the EU is in scope regardless of where they are based.

### Form friction

Where the site has a form, check field count, single-column layout, one name field rather than
two, inline validation, error wording that names the problem without blaming the user, a success
state that says what happens next and when, and privacy micro-copy near the email field.
Baymard's finding is that single-column beats multi-column, a single name field beats first plus
last, and every field beyond five costs 20 to 30 percent of completions.

## Sources

Checked September 2026.

- Ten usability heuristics for user interface design, Nielsen Norman Group:
  https://www.nngroup.com/articles/ten-usability-heuristics/
- How to conduct a heuristic evaluation, Nielsen Norman Group:
  https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/
- Microsoft Clarity, free heatmaps and session recordings: https://clarity.microsoft.com/
- Microsoft Clarity, understanding user behaviour beyond the numbers, Bounteous:
  https://www.bounteous.com/insights/2026/02/11/microsoft-clarity-understanding-user-behavior-beyond-numbers/
- GA4 and Search Console together for performance analysis:
  https://ideadigital.agency/en/blog/google-analytics-4-or-google-search-console-which-better-tracking-website-performance/
- How AI search and GA4 signals are rewriting 2026 goal setting:
  https://www.analyticsmates.com/post/ga4-goals-2026-ai-search-signals
