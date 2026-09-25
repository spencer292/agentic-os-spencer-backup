---
name: 00-website-build
description: >
  End-to-end website build orchestrator: runs a full site build or rebuild the way a top
  agency runs it, chaining the whole skill pack in dependency order: discovery, strategy,
  information architecture, stack decision, copy, design system, components, build,
  accessibility, performance, QA, security, analytics, launch and post-launch optimisation,
  with a named client sign-off gate before each phase starts. Runs as a Level 3 GSD
  project and writes the brief and phase plan. Triggers: "build a website", "website
  build", "website rebuild", "redesign the site", "new site for", "rebuild their website",
  "site migration", "relaunch the website", "run the website process", "full website
  project", "take this site from scratch". NOT for a single page (viz-page-architect), one
  page's conversion review (str-cro-audit), copy alone (mkt-copywriting), a brand with no
  site (00-brand-build), or an audit of a live site with no build attached.
---

# Website Build Orchestrator

Runs a complete website build or rebuild as one governed project. Every phase has entry
criteria, a named skill that does the work, a deliverable saved to a known path, and a
client sign-off gate that must clear before the next phase starts. The orchestrator
sequences and gates. It never re-implements a sub-skill's method inline.

Sequence is set by dependency and risk, never by effort. Copy before design because
layouts must fit real content. Design system before components because components spend
tokens. Redirect plan before build because ranking loss is the least reversible failure
in a rebuild.

## Outcome

- A Level 3 GSD project: brief at `projects/briefs/{client}-website/brief.md`, planning at
  `{workspace}/.planning/` (the client folder for client work, never the Agentic OS root).
- A phase plan naming every gate, its owner and its deliverable.
- Phase deliverables saved inside the project folder (full list in `references/phases.md`).
- A launched site with the pre-launch checklist passed and recorded, plus a post-launch
  cadence handed to whoever owns the site.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/positioning.md` | Full, if present | Message spine for copy and page briefs |
| `brand_context/icp.md` | Full, if present | Who the site is for, drives IA and CRO calls |
| `brand_context/voice-profile.md` | Full, if present | Sets humanizer mode to deep |
| `brand_context/design-system.md` | Detect presence | Decides whether Phase 5 creates or updates |
| `brand_context/target-keywords.md` | Detect presence | Decides whether Phase 2 creates or refreshes |
| `context/learnings.md` | `## 00-website-build` section | Apply past corrections before starting |

Missing brand context does not block the build. Phase 1 collects what is missing, or the
run drops to generic defaults and says so.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `str-ux-research` | Yes | Discovery brief, evidence review, content inventory | No research base, every later phase guesses |
| `str-keyword-strategy` | Yes | Page-to-keyword map, clusters, URL demand data | No ranking plan, redirect decisions run blind |
| `viz-page-architect` | Yes | Sitemap, user flows, section-by-section blueprints | Nothing to build or write against |
| `viz-design-system` | Yes | Tokens, type scale, colour, spacing | Components have nothing to spend |
| `viz-component-library` | Yes | Component specs with mobile variants | Build drifts from the blueprints |
| `mkt-copywriting` + `tool-humanizer` | Yes | Page copy, humanizer gate before commit | No approved copy, design fits nothing real |
| `tool-web-qa` | Yes | Cross-device matrix, link and console checks, launch checklist | Launch is unverified |
| `str-onpage-audit` | Yes | Per-page on-page score, meta and heading checks | On-page regressions ship |
| `str-internal-links` | Recommended | Hub-and-spoke link graph, orphan check | Link equity stays unaudited |
| `tool-accessibility-audit` | Yes | WCAG 2.2 AA pass, axe-core run | Legal exposure, launch gate cannot clear |
| `tool-web-performance` | Yes | Core Web Vitals against LCP 2.5s, INP 200ms, CLS 0.1 | No performance gate |
| `str-security-audit` or `tool-website-security` | Yes | Headers, TLS, DNS auth, exposed paths | Launch without a security grade |
| `tool-behaviour-analytics` | Yes | GA4, GTM, consent, Clarity, funnels | Nothing to optimise against after launch |
| `str-cro-audit` | Yes | LIFT validation of blueprints, monthly post-launch audit | Conversion problems found by the client |
| `str-authority-strategy` | Recommended | Off-site authority and citation plan | Rankings rest on on-page alone |
| `str-question-harvester` | Recommended | Real question set for FAQ and question-format headings | Weaker answer-engine extractability |
| `mkt-scorecard-funnel` | Conditional | Quiz or scorecard lead magnet when one is in scope | No lead magnet, forms only |
| `mkt-quote-builder` | Conditional | Banded pricing and proposal for client work | Scope goes unpriced |
| `mkt-icp`, `mkt-positioning`, `mkt-brand-voice` | Conditional | Brand context when `brand_context/` is thin | Phase 1 gathers a light version instead |

## Skill Relationships

**Upstream:** `00-brand-build` when the brand does not exist yet. Strategy and identity lock
before a site is designed.
**Downstream:** `ops-blog-pipeline` or `mkt-longform-article` for the content engine after
launch, `ops-google-ads` for paid traffic onto the launched site.
**Boundaries:** one page, use `viz-page-architect`. One page's conversion, use
`str-cro-audit`. An audit with no build attached, use the audit skill directly. Copy only,
use `mkt-copywriting`.

## Step 0: Scope, readiness check and project setup

Read `references/sign-off-gates.md` first. Then:

1. Confirm the workspace. Client work runs from `clients/{slug}/`, own work from the root.
2. Establish whether this is a new build or a rebuild. A rebuild activates the SEO
   preservation protocol in `references/seo-preservation.md`, which changes Phase 2.
3. Client work: run `mkt-quote-builder` on the scope before any build phase starts. Scope
   and the brief feed the bands. Nothing gets built against an unpriced scope.
4. Write `projects/briefs/{client}-website/brief.md` with the Level 3 frontmatter, then run
   `/gsd-new-project` from the workspace so `.planning/` lands at the workspace root.
5. Run the readiness check below and get sign-off before Phase 1.

## Step 0.1: Pre-goal readiness check (mandatory, blocking)

This build is attended. It is a chain of interactive skills with human gates, not a cron
job. Never describe it as hands-off. State the three buckets and get a go:

- **Needs client approval:** research report, page-to-keyword map, URL and redirect plan,
  stack decision, copy set, design on preview, pre-launch audit set, the launch flip.
- **Pauses when Claude stops:** every phase. There is no background engine driving the
  chain. Gate chasing, blueprint work, copy, build and QA all run only while Claude works.
- **Can stall silently:** third-party crawls and scrapes, Search Console and CrUX data
  latency, DNS propagation, preview deploy queues, external design review, client content
  and asset delivery. Each is named with its detection and retry in
  `references/sign-off-gates.md`.

## Step 1 to Step 10: the phases

Full detail for every phase, its entry criteria, the skills it invokes, the deliverable and
its save path is in `references/phases.md`. The order:

| # | Phase | Skills | Gate |
|---|-------|--------|------|
| 1 | Discovery and baseline | `str-ux-research`, baseline audits | Research report approved |
| 2 | Strategy, IA, URLs | `str-keyword-strategy`, `str-question-harvester`, `str-authority-strategy`, `viz-page-architect` sitemap mode | Keyword map, URL strategy and redirect plan approved |
| 3 | Stack and deploy decision | none, a written decision | Stack decision recorded and approved |
| 4 | Copy | `mkt-copywriting`, `tool-humanizer`, `mkt-scorecard-funnel` if in scope | Copy set approved |
| 5 | Design | `viz-design-system`, `viz-page-architect`, `str-cro-audit`, `viz-component-library` | Design approved on preview |
| 6 | Build | build to spec, technical SEO layer, `str-onpage-audit`, `str-internal-links`, `tool-behaviour-analytics` | Every page passes the per-page checklist |
| 7 | Pre-launch audit | `tool-web-qa`, `tool-accessibility-audit`, `tool-web-performance`, `str-security-audit` or `tool-website-security`, redirect validation | Full audit set scored and signed off |
| 8 | Launch | `tool-web-qa` launch checklist, flip runbook | Client authorises the flip |
| 9 | Measurement | `tool-behaviour-analytics` | Tracking verified live |
| 10 | Post-launch | weekly, monthly, quarterly cadence | Cadence owner named |

Invoke every sub-skill with the `Skill` tool directly. Never tell the user to type a slash
command, and never re-implement a sub-skill inline.

## Rules

*Updated when the user flags an issue. Read before every run.*

- 2026-09-02: Built as the orchestrator for the root web design skill pack. Phases and gates
  derive from the shipped All The Power process and the Got Moles build methodology, checked
  against September 2026 agency sources cited in `references/phases.md`.
- 2026-09-02: No time or effort estimates anywhere in this skill's output. Sequence and rank
  by dependency, risk and reversibility. Windows that are measurement periods, such as the
  28-day Core Web Vitals window, are not estimates and stay.
- 2026-09-02: A gate is a gate. The next phase does not start until the named approver has
  approved the named deliverable. Record who approved what, and when, in the brief.
- 2026-09-02: On a rebuild, the redirect plan and the ranking-value classification exist
  before any page is built. Ranking loss is the least reversible failure in this process.
- 2026-09-02: Deploys go through git push to the connected branch. Never a platform CLI
  deploy. See `references/stack-and-deploy.md`.
- 2026-09-02: Preview branches isolate code, not data. A preview pointed at the production
  database is production. Seed and migration runs against a shared database are production
  actions and need the same care as a live change.
- 2026-09-02: Every publishable word passes `tool-humanizer` before commit, deep mode when
  `brand_context/voice-profile.md` exists, standard otherwise.
- 2026-09-02: Every claim and statistic on the site needs a named source and a year before
  it ships. Unverified superlatives do not go live.
- 2026-09-02: Never flip DNS on a Friday.

## Self-Update

If the user flags a problem with the process, a gate that was skipped, a phase that ran out
of order, a deliverable that landed in the wrong place, add a dated entry to `## Rules`
immediately and fix the phase in `references/phases.md`. Log the feedback to
`context/learnings.md` under `## 00-website-build` as well, but fix the orchestrator first.

## References

| File | Read when |
|------|-----------|
| `references/phases.md` | Before Phase 1, and at the start of every phase |
| `references/sign-off-gates.md` | At Step 0, and before asking for any approval |
| `references/stack-and-deploy.md` | At Phase 3, and before any deploy |
| `references/seo-preservation.md` | At Phase 2 on any rebuild, and at Phase 7 and 10 |
