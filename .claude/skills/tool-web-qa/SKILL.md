---
name: tool-web-qa
description: >
  Pre-launch and post-change QA for a whole website. Screenshot matrix at mobile, tablet and
  desktop, console errors and failed requests, title, meta description, canonical, meta robots,
  Open Graph and h1 count, every internal link with redirect chains, robots.txt against the
  sitemap, the 404 handler, and a pixel-diff against a previous run. Produces a graded report,
  a launch checklist and a form test protocol. Use for "QA the site", "pre-launch check",
  "launch checklist", "ready to launch", "check for broken links", "did anything break", "visual
  regression", "screenshot every page", "check the redirects", "did we leave noindex on",
  "post-deploy check", "site health check". NOT for one screenshot (tool-web-screenshot), one
  page's conversion audit (str-cro-audit), security (tool-website-security), accessibility
  (tool-accessibility-audit), or SEO (str-onpage-audit).
---

# Web QA

Catch the things that break a launch: a staging noindex left on, a redirect map with a hole, a
form that succeeds and drops the lead, a console error that only fires on mobile, a page that
shifted when nobody meant it to. The script does the mechanical sweep. This skill turns its
output into a decision, and owns the two checks a script must not make alone: submitting forms,
and calling a launch.

## Outcome

**Produces:** a QA report and screenshots at `projects/tool-web-qa/{YYYY-MM-DD}_{site-slug}/`,
containing `report.md`, `manifest.json`, `screenshots/{viewport}/{page}.png`, and `diffs/` when
a baseline was supplied. Always save to disk, then show the full absolute path.

Every finding is graded **Blocker**, **Warning** or **Note**, and the report states one of three
verdicts: `DO NOT LAUNCH`, `LAUNCH WITH FIXES`, `CLEAR`.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/design-system.md` | tokens and breakpoints | Confirm the viewport matrix matches the real breakpoints |
| `brand_context/positioning.md` | summary | Judge whether titles and Open Graph copy say the right thing |
| `context/learnings.md` | `## tool-web-qa` section | Past findings and site-specific quirks |
| `references/launch-checklist.md` | full, before any launch call | The staged checklist the report feeds |
| `references/form-test-protocol.md` | full, when the site has forms | The manual form pass |

No brand context is required. Without it the run produces the full technical report.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-website-security` | Optional | Full TLS, header, cookie and DNS grading of a live site | This skill checks https enforcement, mixed content and HSTS only |
| `tool-accessibility-audit` | Optional | WCAG 2.2 AA audit with axe and a manual pass | Only alt text, lang, labels and heading order are covered here |
| `tool-platform-security` | Optional | Secret and dependency scan of the codebase behind the site | Code-side risk is not covered |
| `str-cro-audit` | Optional | Conversion scoring of the pages this run screenshots | Report covers correctness, not persuasion |
| `tool-screenshot-annotator` | Optional | Numbered callouts on a captured screenshot | Screenshots ship unannotated |

External binaries: Node 18 or newer, plus `playwright`, `pixelmatch` and `pngjs` installed into
this skill's own `scripts/` folder by `scripts/setup.sh`, never at the repo root. No API keys.

## Skill Relationships

**Upstream (reads from):** `viz-design-system` for the real breakpoints, so the viewport matrix
matches the build, and `00-website-build`, the build phase this QA gate closes.

**Downstream (feeds into):** `str-cro-audit`, which uses the screenshots and page inventory this
run produces, `tool-website-security` and `tool-accessibility-audit` on anything flagged here,
and `str-onpage-audit`, because the SEO findings here are shallow by design.

**Trigger boundaries:**
- One screenshot, or an interactive capture, goes to `tool-web-screenshot`
- Why a page does not convert goes to `str-cro-audit`
- TLS grading, security headers, SPF and DMARC go to `tool-website-security`
- WCAG conformance and screen reader testing go to `tool-accessibility-audit`
- Leaked keys and vulnerable dependencies go to `tool-platform-security`
- Keyword targeting, schema depth and fan-out coverage go to `str-onpage-audit`

## Step 1: Establish the target and the mode

Ask, or infer from what the user said, three things.

1. **The base URL.** Staging, local dev, or production. Say which one you are testing, out loud,
   before you run. A staging pass is a rehearsal. Only the production run is the launch gate.
2. **The mode.** Pre-launch is a full sweep against the checklist. Post-change is a narrower run
   against a baseline, where the question is what moved.
3. **The page set.** Named paths for a post-change run, the sitemap for a pre-launch sweep.
   Cover every distinct template, not every page. Ten pages spanning ten templates beats a
   hundred pages of one template.

If this is a rebuild, ask for the old URL list now. Without it the redirect map cannot be
checked at all, and that is the highest-cost failure on the list.

## Step 2: Run the sweep

First run only: `bash .claude/skills/tool-web-qa/scripts/setup.sh`

```bash
# pre-launch, sitemap driven
node .claude/skills/tool-web-qa/scripts/qa-run.mjs --base https://example.com --limit 20

# named paths
node .claude/skills/tool-web-qa/scripts/qa-run.mjs --base https://example.com --paths "/,/pricing,/contact"

# post-change, against the last run
node .claude/skills/tool-web-qa/scripts/qa-run.mjs --base https://example.com --limit 20 \
  --baseline projects/tool-web-qa/2026-09-01_example-com
```

`--base` is the only required flag. `--paths` skips sitemap discovery, `--sitemap` overrides
discovery, `--limit` caps the crawl at 10 pages by default, `--out` moves the output directory,
`--baseline` turns on the pixel diff, `--diff-threshold` sets the changed-pixel ratio that flags
a page (0.01), `--viewports` overrides the matrix (390x844, 820x1180, 1440x900),
`--link-limit` caps the link check at 300, and `--strict` exits 1 on any blocker for CI. Run
`--help` for the current list.

On Git Bash a bare `/` in `--paths` is rewritten by the shell. Prefix the command with
`MSYS_NO_PATHCONV=1`, or pass an empty first entry. The script detects the rewrite and says so.

## Step 3: Read the report, do not just forward it

Work the findings in order. Three judgements the script cannot make. **Is a canonical pointing
elsewhere wrong, or deliberate?** Paginated and filtered pages legitimately canonicalise to a
parent. **Is a noindex wrong, or deliberate?** A thank-you page or a gated asset should carry
it, and every other noindex on a production run is a blocker. **Is a visual diff a regression,
or the change you shipped?** Open the diff image, and say so when it matches the intent.

Open at least one screenshot per viewport per template with your own eyes. The script cannot see
that the hero image is the wrong one.

## Step 4: Test the forms by hand

The script finds forms, counts fields, checks labels and looks for a honeypot. It never submits
one, because submitting writes to somebody's inbox and CRM.

Read `references/form-test-protocol.md` and run it for every form the report lists. The pass
that matters is the last one: open the destination system and confirm the test lead is actually
there. A success message is not evidence. Paste that file's result table into the report.

## Step 5: Work the launch checklist

Read `references/launch-checklist.md` in full. It is staged by risk and dependency: irreversible
items first, then content and legal, search carry-over, forms, analytics, performance and
security, cross-device QA, the launch-day sequence, then the seven-day and thirty-day watches.
Mark every item pass, fail or not applicable. Items marked BLOCKING there block the launch
regardless of what the script reported, because several are things no script can see, such as
whether a redirect map exists at all.

## Step 6: Call it, and say what is not covered

State the verdict plainly, and name what the run did not cover, every time: pages outside the
tested set, browsers other than Chromium (Safari in particular), real-device rendering as
against emulated viewports, Core Web Vitals field data which needs 28 days of real traffic,
anything behind a login, and forms unless Step 4 was actually run. Never say a site is ready to
launch on the strength of a script run alone. Say what passed, what did not, and what nobody
has checked yet.

## Step 7: Save, present, keep the baseline

Confirm the output path and show it in full. Present the verdict, the blocker count, and the
three findings that matter most. Keep this run as the baseline for the next one and say where it
is. Then ask "How did this land? Anything it missed or over-flagged?" and log the answer to
`context/learnings.md` under `## tool-web-qa`.

## Rules

*Updated when the user flags an issue. Read before every run.*

- 2026-09-02: Built as a root skill for the web-design skill pack, against September 2026
  sources listed in `references/launch-checklist.md` and `references/form-test-protocol.md`.
  Core Web Vitals held at LCP 2.5 s, INP 200 ms, CLS 0.1 at the 75th percentile over 28 days.
  WCAG 2.2 AA is the UK public-sector baseline and the European Accessibility Act has applied
  to EU-facing services since 28 June 2025.
- Name the environment before every run. A staging pass is never a launch gate.
- A blocker blocks. Do not soften it because a deadline is close. Say what shipping it costs.
- Never report a form as tested unless a human confirmed the lead in the destination system.
- Never claim a page is fine on the strength of a screenshot you have not opened.
- Report what was not covered, every time, without being asked.
- Rank findings by impact, risk, dependency order and reversibility. Never by how long a fix
  takes, and never with a time estimate attached.
- Blocked third-party ad and analytics beacons are notes. First-party failures are warnings.
- A missing URL that returns HTTP 200 is a soft 404 and is a real defect, not a curiosity.
- Keep every run. The value of the screenshot matrix is the diff against the next one.
- No em dashes in the report or the summary.

## Self-Update

If the user flags an issue with the output, a missed check, a false alarm, a wrong severity or a
bad format, add a dated entry to `## Rules` above immediately, and change the script or the
references so it cannot recur. Do not only log it to learnings.

Format: `- {YYYY-MM-DD}: {what was wrong and the rule that prevents it}`

## References

| File | What it holds | When to read it |
|------|---------------|-----------------|
| `references/launch-checklist.md` | Ten stages from irreversible items through launch day to the thirty-day watch, BLOCKING items marked | Step 5, and before any launch call |
| `references/form-test-protocol.md` | Seven tests per form, including the honeypot false-positive test and the destination check | Step 4, whenever the site has a form |
| `references/sample-report.md` | A real unedited run, plus what a baseline diff and a live https run add | Once, to see the output shape |
| `scripts/qa-run.mjs`, `scripts/setup.sh` | The sweep, and the installer for its Node packages and Chromium | Step 2, and the first run |
