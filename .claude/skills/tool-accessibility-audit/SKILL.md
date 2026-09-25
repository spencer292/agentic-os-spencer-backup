---
name: tool-accessibility-audit
description: >
  WCAG 2.2 AA accessibility audit of a live site or local build. Runs axe-core
  through Playwright at desktop and mobile viewports, adds the reflow, target-size
  and reduced-motion checks automation skips, then drives the manual pass: keyboard
  walk, screen reader, focus order, 320 px reflow, 200 percent zoom, forms, errors,
  colour-only meaning, captions, PDFs. Produces a per-criterion scorecard, a
  severity-ranked fix list, the conformance claim today's evidence supports, and an
  accessibility statement. Use when the user says "accessibility audit", "WCAG
  audit", "is this site accessible", "a11y audit", "screen reader test", "keyboard
  accessibility", "axe scan", "WCAG 2.2 AA", "accessibility statement", "contrast
  check", "are we compliant", "European Accessibility Act", "EAA compliance",
  "public sector accessibility regulations". Do NOT use for conversion audits, SEO
  audits, security headers, or Core Web Vitals work.
---

# Accessibility Audit

WCAG 2.2 AA audit of any site you can load in a browser. Automation clears the repeated mechanical failures. A person decides the rest. This skill does both and keeps them clearly separated, because conformance claims made from a scan alone are how organisations end up publishing a statement that is not true.

Automation decides roughly a third of the 56 Level A and AA criteria. Never report a clean scan as compliance.

## Outcome

An audit report at `projects/tool-accessibility-audit/{YYYY-MM-DD}_{site}-audit.md`, containing a per-criterion scorecard across all 56 Level A and AA criteria, findings grouped by severity, a fix list ordered by impact and dependency, and the conformance claim that today's evidence supports. Optionally a drafted accessibility statement alongside it.

Always save to disk and show the full absolute path.

## Context Needs

| File | Load level | Purpose |
|---|---|---|
| `brand_context/design-system.md` | colour tokens, type scale, focus and motion rules | The tokens a contrast or focus failure has to be fixed in, rather than patching one component |
| `brand_context/icp.md` | summary | Who the audience is, and whether assistive technology use or the regulatory regime is already known |
| `context/learnings.md` | `## tool-accessibility-audit` section | Accepted findings, known false positives, past audits of this site |
| `references/legal-landscape.md` | full, at Step 1 | Which regime applies and what it demands |
| `references/wcag22-criteria.md` | full, at Step 4 | The 56 criteria, what changed in 2.2, and what automation can decide |
| `references/manual-checklist.md` | full, at Step 5 | The checks automation cannot make |
| `references/accessibility-statement-template.md` | at Step 8 | The statement format and its rules |

## Dependencies

| Skill or tool | Required? | What it provides | Without it |
|---|---|---|---|
| Node 18 or newer, plus npm | Required | Runs the audit script | The automated pass cannot run. Do the manual checklist by hand and say the automated pass is missing |
| `playwright` and `@axe-core/playwright` | Required | The scan engine, installed into this skill's own `scripts/` by `scripts/setup.sh` | `setup.sh` reports what failed and why |
| NVDA, VoiceOver, or JAWS | Required for a conformance claim | The screen-reader pass at Step 5 | Report the audit as incomplete. A conformance claim without a screen-reader pass is not defensible |
| `tool-humanizer` | Required when drafting the statement | Cleans the published statement text | Only matters if no statement is drafted |
| `viz-design-system` | Optional | Contrast, focus and motion tokens to fix against | Fix at the component level and flag that the tokens are unknown |

## Skill Relationships

**Upstream, reads from:** `viz-design-system` for the tokens a fix belongs in. `str-ux-research` for the audience and the regulatory regime.

**Downstream, feeds into:** `viz-design-system` and `viz-component-library` when a failure is a token or component problem. `str-cro-audit`, because target size, focus visibility and form errors move conversion as well as conformance. `00-website-build`, which runs this as its accessibility gate before launch.

**Sibling:** `tool-website-security` audits the same live site for a different property. Both are passive and safe to run on any URL.

**Trigger boundaries:** "why isn't this page converting" goes to `str-cro-audit`. "Audit my site" plus rankings goes to `str-ai-seo`, plus headers or TLS goes to `tool-website-security`. "The site is slow" is Core Web Vitals work, not this skill. "Design a component" goes to `viz-component-library`, though its accessibility requirements come from here.

## Step 1: Establish the regime and the scope

Read `references/legal-landscape.md`. Ask or determine:

- Is the organisation a UK public sector body? Then WCAG 2.2 AA and a statement in the prescribed format are legally required, and GDS samples sites annually.
- Does it sell into the EU in a covered sector? Then the European Accessibility Act has applied since 28 June 2025.
- Otherwise the UK Equality Act 2010 duty applies, or the equivalent where the business operates.

Test to WCAG 2.2 AA in every case. It is the UK public sector baseline and it satisfies the WCAG 2.1 AA that EN 301 549 and the US rules currently name.

Then agree the page set. Not the whole site. The home page, one page per template, the primary conversion form, the search or listing page, any authenticated page, and anything with video or a PDF. Say which pages were chosen and why, because the statement has to.

## Step 2: Install the scanner

Once per machine:

```bash
bash .claude/skills/tool-accessibility-audit/scripts/setup.sh
```

It checks for Node and npm, installs `playwright` and `@axe-core/playwright` into the skill's own `scripts/` folder, downloads Chromium, and smoke-tests the pair. Nothing lands in the repo root. Re-running when everything is present does nothing.

## Step 3: Run the automated pass

```bash
node .claude/skills/tool-accessibility-audit/scripts/a11y-audit.mjs <url> [more urls] \
  --out projects/tool-accessibility-audit/{YYYY-MM-DD}_{site}-audit.md \
  --json projects/tool-accessibility-audit/{YYYY-MM-DD}_{site}-audit.json
```

| Flag | Default | What it does |
|---|---|---|
| `<url>` | — | One or more targets. A bare domain gets `https://` |
| `--sitemap <url>` | — | Pull pages from a sitemap, following sitemap indexes |
| `--limit <n>` | 10 | Cap on pages taken from the sitemap |
| `--out <path>` | stdout | Markdown report, folder created if needed |
| `--json <path>` | — | Raw result, for cron or a diff against the last run |
| `--viewport <v>` | both | `desktop`, `mobile`, or `both` |
| `--timeout <ms>` | 45000 | Per-page navigation timeout |
| `--quiet` | off | No progress logging |

Exit code is 2 when any critical or serious violation exists, so it works as a build gate.

It runs axe-core against `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` at 1440 by 900 and at 390 by 844, then adds three checks axe does not run by default: horizontal scrolling at 320 CSS px for 1.4.10, every pointer target measured against 24 by 24 CSS px for 2.5.8, and whether the stylesheets answer `prefers-reduced-motion` at all. It also captures a structure snapshot per page, covering title, language, heading count, landmarks, form fields with autocomplete, video caption tracks and PDF links.

`references/sample-report.md` holds real output from both a live site and a local build, with the plain-language reading of each finding.

## Step 4: Read the automated result properly

Three rules, and they are where most audits go wrong.

1. **Conformance is measured in criteria, not rules.** Ten failures of one axe rule is one failing criterion. Report the criterion number and name.
2. **Incomplete is not pass.** axe returns an incomplete set for checks it started and could not finish, almost always text over an image, a gradient or video. Resolve each by hand.
3. **Impact is axe's word, not WCAG's.** WCAG has no severity levels. A minor-impact rule can fail a Level A criterion. Use impact to sequence work, never to decide whether a criterion passes.

Read `references/wcag22-criteria.md` for the full list and which criteria automation can and cannot decide.

## Step 5: Run the manual pass

Work through `references/manual-checklist.md` on the agreed page set. Twelve sections: keyboard-only walk, focus order and visibility, screen reader, reflow and zoom and text spacing, colour and contrast, motion and timing, forms and labels and errors, target size and pointer input, media, PDFs and documents, third-party embeds, and recording the result.

Non-negotiables before any conformance claim:

- A keyboard-only walk of the full primary journey, mouse unplugged.
- A screen-reader pass with NVDA or VoiceOver, at least one run with the screen off.
- Reflow at 320 CSS px and zoom to 200 percent, checking for lost content and function, not just for scrollbars.
- 2.4.11 Focus Not Obscured, tested by tabbing through a long page with sticky headers, cookie banners and chat widgets present. This is new in WCAG 2.2 and it fails often.
- The cookie banner, because it is the first thing a keyboard user meets and it fails constantly.

Record pass, fail or not-applicable per criterion, with the page and the evidence.

## Step 6: Score by criterion

Build the scorecard across all 56 Level A and AA criteria. Four states only.

| State | Meaning |
|---|---|
| Pass | Checked and met on every page in the set |
| Fail | Checked and not met on at least one page. Name the page and the evidence |
| Not applicable | The page set contains nothing the criterion applies to. Say why |
| Not verified | Not yet checked. Never report this as a pass |

Headline figures: criteria failing, criteria not verified, and pass rate over the criteria actually assessed. Do not invent a score out of 100. A percentage implies partial credit and conformance has none.

## Step 7: Order the fix list

Rank by impact, risk, dependency order and reversibility. Never by effort or duration.

1. Failures that block a user completely. No keyboard access, a keyboard trap, an unlabelled control on the conversion path, a form that cannot be completed.
2. Failures on the primary journey, then on secondary pages.
3. Structural and template fixes before component polish, because one change to a design token or a layout component clears the same failure on every page.
4. Anything a later fix depends on. Focus styles come from the token layer, so fix the token first.
5. Hardening.

Per item state: what fails, which criterion, where, the fix, and whether it is a token, a component, a template or a content change. Mark reversibility, because a token change touches everything and a single alt attribute does not.

## Step 8: Write the conformance claim, and the statement

State plainly which of the three claims the evidence supports: fully compliant, partially compliant, or not compliant. Anything unverified means no full-compliance claim.

If a statement is wanted, draft from `references/accessibility-statement-template.md`. Every known failure is listed with its criterion. Every fix carries a date or a named release, never an effort estimate. Do not claim disproportionate burden without a documented assessment. Run the drafted statement through `tool-humanizer`, deep mode when `brand_context/voice-profile.md` exists, standard otherwise, since it is published text.

## Step 9: Save, present, and log

Save to `projects/tool-accessibility-audit/{YYYY-MM-DD}_{site}-audit.md` and show the full absolute path. Present the criteria failing, the top three fixes, and the honest conformance claim. Ask what landed and what did not, and log it to `context/learnings.md` under `## tool-accessibility-audit`, including any finding the user accepts as a known risk so the next audit reads it in context.

Offer an `ops-cron` job on `--json` for a site that is audited repeatedly. Accessibility regresses with every deploy, and a diff against the last run catches it.

## Rules

*Updated when the user flags an issue. Read before every run.*

- 2026-09-02: Built at root. Currency pass against September 2026 sources: WCAG 2.2 AA is the UK public sector baseline and GDS has tested against it since October 2024; the European Accessibility Act has applied since 28 June 2025; EN 301 549 is still harmonised at v3.2.1, which names WCAG 2.1 AA, with v4.1.1 carrying WCAG 2.2 AA expected to be cited later in 2026.
- 2026-09-02: Never report a clean automated scan as WCAG compliance. Automation decides about a third of the criteria. Say what was and was not checked, every time.
- 2026-09-02: axe "incomplete" results are unresolved, not passes. Carry them into the report as items needing a human decision.
- 2026-09-02: Report failures by WCAG criterion, not by axe rule id. Conformance is measured in criteria.
- 2026-09-02: Do not treat 2.4.13 Focus Appearance as an AA requirement. It is AAA. The AA criterion is 2.4.7 Focus Visible, which only requires a visible indicator.
- 2026-09-02: Never quote effort or duration in the fix list or the statement. Rank by impact, risk, dependency order and reversibility. Statements carry a date or a named release.
- 2026-09-02: Do not claim disproportionate burden unless an assessment has actually been carried out and documented. An undocumented claim is itself a compliance failure and is one of the things GDS looks for.
- 2026-09-02: Dependencies install into this skill's `scripts/` folder only, never the repo root.
- 2026-09-02: Apply the four 2.5.8 exceptions by hand before reporting a target-size failure: inline in a sentence, browser-determined size, an equivalent target elsewhere on the page, and essential presentation. The script already excludes inline links inside text blocks.

## Self-Update

If the user flags a false positive, a missed check or a wrong severity, fix the cause. Tighten the check in `scripts/a11y-audit.mjs`, correct the reference file, or adjust the ordering, then add a dated entry to `## Rules`. Do not only log it to learnings.

## References

| File | What it holds |
|---|---|
| `references/wcag22-criteria.md` | All 56 Level A and AA criteria, what changed from 2.1, and what automation can decide per criterion |
| `references/manual-checklist.md` | The twelve-section manual pass, with the failure pattern for each check |
| `references/accessibility-statement-template.md` | UK public-sector statement format, plus the EAA section for EU-facing services |
| `references/legal-landscape.md` | UK regulations, Equality Act, EAA, EN 301 549, US rules, and which applies |
| `references/sample-report.md` | Real output from a live site and a local build, with the plain-language reading |
| `scripts/setup.sh` | Installs Node dependencies and Chromium into this skill's folder |
| `scripts/a11y-audit.mjs` | The automated pass |
