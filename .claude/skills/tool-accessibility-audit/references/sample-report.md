# Sample output

Real output from `scripts/a11y-audit.mjs`, captured 2 September 2026 while building this skill. Two runs: one against a live site pulled from its sitemap, one against a local development build. Nothing below is edited except the removal of the long target-size table from the first run, which repeated the same three components across all three pages.

Read the first as the shape of a report on a site with real problems, and the second as the shape of a near-clean report where the interesting content is what automation could not decide.

---

## Run 1: live site, three pages from the sitemap

Command:

```bash
node .claude/skills/tool-accessibility-audit/scripts/a11y-audit.mjs \
  --sitemap https://www.bobsbusiness.co.uk/sitemap.xml \
  --limit 3 \
  --out projects/tool-accessibility-audit/2026-09-02_bobsbusiness-audit.md
```

Exit code 2, because critical and serious violations were found.

```markdown
---
standard: WCAG 2.2 AA
date: 2026-09-02
pages_audited: 3
viewports: desktop, mobile
automated_violations: 3
status: automated pass only, manual checks outstanding
---

# Accessibility audit: www.bobsbusiness.co.uk

Automated WCAG 2.2 AA pass using axe-core 4.13.0 through Playwright, at desktop and mobile viewports.

Automation reaches roughly a third of the WCAG 2.2 AA criteria. A clean automated run is not a
conformance claim. The manual checks in `references/manual-checklist.md` have to be worked
through before any claim is made.

## Summary

| Measure | Value |
|---|---|
| Pages audited | 3 |
| Distinct rule failures | 3 |
| Critical | 2 |
| Serious | 1 |
| Moderate | 0 |
| Minor | 0 |
| Needs manual review (axe incomplete) | 1 |
| WCAG criteria with an automated failure | 3 |

## Criteria with an automated failure

| Criterion | Level | Worst impact | Failing rules |
|---|---|---|---|
| 1.1.1 Non-text Content | A | critical | image-alt |
| 3.1.1 Language of Page | A | serious | html-has-lang |
| 4.1.2 Name, Role, Value | A | critical | input-button-name |

## Findings by impact

### Critical

#### image-alt

- **What fails.** Images must have alternative text.
- **WCAG criterion.** 1.1.1 Non-text Content (A)
- **Reach.** 6 elements across 3 pages, seen at desktop.
- **Example.** `.PromotionBannerAnimation__LineLeft4-sc-w8i6eq-16`
  ```html
  <img src="/static/929cc01ad8a288c41e5e9475ecefdfd3/2bec2/red-lines-right.webp" class="PromotionBannerAnimation__LineLeft1-sc-w8i6eq-15 ...">
  ```
- **Reference.** https://dequeuniversity.com/rules/axe/4.13/image-alt?application=playwright

#### input-button-name

- **What fails.** Input buttons must have discernible text.
- **WCAG criterion.** 4.1.2 Name, Role, Value (A)
- **Reach.** 3 elements across 3 pages, seen at desktop and mobile.
- **Example.** `.SubscribeBox__ArrowButton-sc-1pfyiqj-7`
  ```html
  <input type="submit" value="" disabled="" class="SubscribeBox__ArrowButton-sc-1pfyiqj-7 hWOnXX">
  ```
- **Reference.** https://dequeuniversity.com/rules/axe/4.13/input-button-name?application=playwright

### Serious

#### html-has-lang

- **What fails.** <html> element must have a lang attribute.
- **WCAG criterion.** 3.1.1 Language of Page (A)
- **Reach.** 3 elements across 3 pages, seen at desktop and mobile.
- **Example.** `html`
  ```html
  <html>
  ```
- **Reference.** https://dequeuniversity.com/rules/axe/4.13/html-has-lang?application=playwright

## WCAG 2.2 checks axe does not run by default

| Check | Criterion | Result |
|---|---|---|
| Reflow, no horizontal scroll at 320 CSS px | 1.4.10 Reflow (AA) | pass on every page audited |
| Target size, 24 by 24 CSS px minimum at mobile | 2.5.8 Target Size (Minimum) (AA) | 3 of 3 pages have undersized targets |
| Stylesheets answer prefers-reduced-motion | 2.3.3 and 2.2.2 signal | 3 of 3 pages animate without a reduced-motion query |

**Targets under 24 by 24 CSS px**

Inline links inside body text are exempt and excluded here.

| Page | Target | Size | Label |
|---|---|---|---|
| /courses/breach-the-ultimate-cybersecurity-awareness-game/ | `... > a.Breadcrumb__LinkBreadcrumb-sc-18kyn50-1` | 28 x 11 | Home |
| /courses/breach-the-ultimate-cybersecurity-awareness-game/ | `... > a.Breadcrumb__LinkBreadcrumb-sc-18kyn50-1` | 36 x 11 | Courses |
| /courses/breach-the-ultimate-cybersecurity-awareness-game/ | `... > a.Disclaimer__StyledLink-sc-8he11q-4` | 40 x 23 | Terms |
| /courses/breach-the-ultimate-cybersecurity-awareness-game/ | `... > a.Disclaimer__StyledLink-sc-8he11q-4` | 46 x 23 | Privacy |
| /courses/ai-deepfakes/ | `... > a.Breadcrumb__LinkBreadcrumb-sc-18kyn50-1` | 28 x 11 | Home |

[the same three components repeat across the other two pages]

## Structure snapshot

| Page | Title | lang | h1 | Landmarks (main/nav/header/footer) | Inputs (with autocomplete) | Video (with captions track) | PDF links |
|---|---|---|---|---|---|---|---|
| /courses/breach-the-ultimate-cybersecurity-awareness-game/ | Mobile Phishing Awareness \| Courses \| Bob's Busine | **missing** | 2 | 0/1/1/2 | 5 (0) | 0 (0) | 0 |
| /courses/ai-deepfakes/ | Bobs Business | **missing** | 2 | 0/1/1/2 | 5 (0) | 0 (0) | 0 |
| /courses/mobile-phishing-awareness/ | Mobile Phishing Awareness \| Courses \| Bob's Busine | **missing** | 2 | 0/1/1/2 | 5 (0) | 0 (0) | 0 |

## Needs a human decision (axe could not be certain)

| Rule | Criterion | Elements | What to check |
|---|---|---|---|
| color-contrast | 1.4.3 Contrast (Minimum) (AA) | 10 | Elements must meet minimum color contrast ratio thresholds |

## Fix list, ordered by impact then dependency

Ordering rule: user-blocking failures before hardening, sitewide template fixes before single-page
fixes, and anything a later fix depends on first. No effort estimates.

1. **Images must have alternative text** — critical, sitewide, likely a shared template or
   component. 1.1.1 Non-text Content (A). 6 elements. Rule `image-alt`.
2. **Input buttons must have discernible text** — critical, sitewide, likely a shared template or
   component. 4.1.2 Name, Role, Value (A). 3 elements. Rule `input-button-name`.
3. **<html> element must have a lang attribute** — serious, sitewide, likely a shared template or
   component. 3.1.1 Language of Page (A). 3 elements. Rule `html-has-lang`.
4. **Target size** — structural, do before component polish. 2.5.8 Target Size (Minimum) (AA).
   Undersized tap targets on 3 pages. Usually a shared component, so one fix clears many pages.
5. **Reduced motion** — structural, do before component polish. 2.3.3 Animation from Interactions
   (AAA). Animation runs with no prefers-reduced-motion query. Add the query at the stylesheet root.

## Conformance claim you can make today

**Not compliant with WCAG 2.2 AA.** 3 critical or serious automated failures stand, across 3
criteria. Automated evidence alone is enough to rule out a full-compliance claim.

Whatever the outcome, the published statement has to name the criteria that fail and the reason,
per `references/accessibility-statement-template.md`.

## What this run did not check

Automation cannot judge whether alt text is accurate, whether focus order matches reading order,
whether captions match the audio, whether an error message helps, whether colour is the only
carrier of meaning, or whether a screen reader announces a component sensibly. Those are in
`references/manual-checklist.md` and none of them are optional.

---

Generated by `tool-accessibility-audit` on 2026-09-02. axe-core 4.13.0.
```

### What that run tells you, in the language to use with a client

Three template-level failures, each on every page, each fixable in one place.

- The `html` element carries no `lang` attribute. A screen reader picks a voice from the browser default rather than the content, so an English page can be read aloud with a Spanish pronunciation model. One attribute in the layout component fixes it sitewide.
- Decorative banner images have no `alt` attribute at all. Absent is not the same as empty. A screen reader falls back to reading the filename, so it announces "red lines right dot webp". `alt=""` makes them silent, which is what decorative images should be.
- The newsletter submit button is an `input type="submit"` with an empty `value`, so it has no accessible name. A screen reader announces "button" with nothing else. Anyone navigating by keyboard or voice cannot tell what it does.

Two structural items. Breadcrumb and footer links are 11 to 23 CSS pixels tall, under the 24 pixel minimum that WCAG 2.2 introduced, and they are not inline in a sentence so no exception applies. Nothing in the stylesheets answers `prefers-reduced-motion`, so animation runs at full strength for people who asked their operating system to reduce it.

Note the page title on the first URL. It reads "Mobile Phishing Awareness" on the Breach page, and a second page is titled just "Bobs Business". That is 2.4.2 Page Titled, a Level A criterion, and it comes from the structure snapshot rather than from axe. Automated rules only check that a title exists.

The one incomplete result matters as much as the failures. Ten elements where axe started a contrast check and could not finish, which is almost always text sitting over an image, a gradient or a video. Those are unresolved, not passes.

---

## Run 2: local development build, single page

Command:

```bash
node .claude/skills/tool-accessibility-audit/scripts/a11y-audit.mjs \
  http://localhost:3020/ \
  --out projects/tool-accessibility-audit/2026-09-02_local-build-audit.md \
  --json projects/tool-accessibility-audit/2026-09-02_local-build-audit.json
```

Trimmed to the parts that differ from run 1.

```markdown
## Summary

| Measure | Value |
|---|---|
| Pages audited | 1 |
| Distinct rule failures | 1 |
| Critical | 0 |
| Serious | 1 |
| Moderate | 0 |
| Minor | 0 |
| Needs manual review (axe incomplete) | 1 |
| WCAG criteria with an automated failure | 1 |

## Criteria with an automated failure

| Criterion | Level | Worst impact | Failing rules |
|---|---|---|---|
| 1.4.3 Contrast (Minimum) | AA | serious | color-contrast |

## Findings by impact

### Serious

#### color-contrast

- **What fails.** Elements must meet minimum color contrast ratio thresholds.
- **WCAG criterion.** 1.4.3 Contrast (Minimum) (AA)
- **Reach.** 2 elements across 1 page, seen at desktop and mobile.
- **Example.** `.lg\:py-16 > h2`
  ```html
  <h2 class="text-2xl sm:text-3xl">Three minutes now, or a very long day later.</h2>
  ```
- **Reference.** https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright

## WCAG 2.2 checks axe does not run by default

| Check | Criterion | Result |
|---|---|---|
| Reflow, no horizontal scroll at 320 CSS px | 1.4.10 Reflow (AA) | pass on every page audited |
| Target size, 24 by 24 CSS px minimum at mobile | 2.5.8 Target Size (Minimum) (AA) | pass on every page audited |
| Stylesheets answer prefers-reduced-motion | 2.3.3 and 2.2.2 signal | 1 of 1 pages animate without a reduced-motion query |

## Structure snapshot

| Page | Title | lang | h1 | Landmarks (main/nav/header/footer) | Inputs (with autocomplete) | Video (with captions track) | PDF links |
|---|---|---|---|---|---|---|---|
| / | Security Culture Score \| Bob's Business | en-GB | 1 | 1/1/1/1 | 0 (0) | 0 (0) | 0 |

## Conformance claim you can make today

**Not compliant with WCAG 2.2 AA.** 1 critical or serious automated failure stands, across 1
criterion. Automated evidence alone is enough to rule out a full-compliance claim.
```

### What that run tells you

Structurally sound. A language attribute, one h1, all four landmarks, no reflow failure, no undersized targets. The single automated failure is a heading whose colour falls under 4.5 to 1 against its background, which is a design token problem rather than a markup problem, so fixing the token clears it everywhere the token is used.

The reduced-motion result is the more interesting one. Nothing in the stylesheets responds to the setting, and the page animates. Add the query and check that it changes behaviour, because the script can only see whether the query exists.

This is what a report looks like when the automated pass is close to clean, and it is exactly the point at which the manual checklist starts doing the real work. One failing criterion out of 56 is known. The other 55 are unverified until a person walks the page with a keyboard and a screen reader.

---

## Reading any run

- **Criteria, not rules, are what conformance is measured in.** Ten failures of one rule is one failing criterion. Report the criterion.
- **Incomplete is not pass.** Work through every one by hand.
- **Impact is axe's word, not WCAG's.** WCAG has no severity levels. A minor-impact rule can still fail a Level A criterion. Use impact to sequence the work, never to decide whether a criterion passes.
- **A clean run is the floor.** It means the mechanical failures are gone. It says nothing about the two thirds of criteria only a person can decide.
