# Phases

Every phase names its entry criteria, the skills it invokes, the deliverable it produces,
where that deliverable is saved and the gate that must clear before the next phase starts.
Paths are relative to the workspace, which is `clients/{slug}/` for client work and the
Agentic OS root for own work. The project folder is `projects/briefs/{client}-website/`.

Sequence is dependency order, not effort order. Nothing here carries a duration.

---

## Phase 1: Discovery and baseline

**Entry criteria:** brief written, readiness check signed off, workspace confirmed.

**Skills:** `str-ux-research` for the discovery interview, evidence review, user interviews
and content inventory. `mkt-icp` and `mkt-positioning` when `brand_context/` has no audience
or angle. `mkt-brand-voice` when there is no voice profile.

**On a rebuild, also run the baseline audit set against the live site.** These numbers are
the before figure the rebuild is measured against:

| Baseline | Skill | Produces |
|---|---|---|
| On-page and answer-engine score | `str-onpage-audit` | Scored per-template audit of the incumbent |
| Core Web Vitals | `tool-web-performance` | Field and lab numbers against the current thresholds |
| Accessibility | `tool-accessibility-audit` | WCAG 2.2 AA findings on the live templates |
| Security posture | `tool-website-security` | Graded header, TLS and DNS report |
| Behaviour and funnel | `tool-behaviour-analytics` | What the current analytics actually show |

**Also collect, because later phases block without them:** the business facts document
(offers, prices, service area, credentials, founder bios for entity schema), the legal or
claims constraints that limit copy, and an inventory of every indexed URL taken on one dated
day from every sitemap.

**Deliverables:**
- `projects/briefs/{client}-website/{date}_discovery-brief.md`
- `projects/briefs/{client}-website/{date}_baseline-audit.md` (rebuild only)
- `projects/briefs/{client}-website/{date}_url-inventory.md` (rebuild only)

**Gate:** research report approved by the client. Locking discovery is what stops rework
later. Brand Vision's 2026 process makes the same point: decisions locked at discovery and
structure are the ones that do not get repriced downstream.

---

## Phase 2: Strategy, information architecture and URLs

**Entry criteria:** research report approved. URL inventory exists on a rebuild.

**Skills, in this order:**

1. `str-keyword-strategy`. Search Console first where history exists, otherwise the best
   ranking ground truth available. Produces clusters, the coverage gap and
   `brand_context/target-keywords.md`.
2. `str-question-harvester`. The real question set that feeds FAQ blocks and
   question-format headings.
3. `str-authority-strategy`. The off-site half, what authority each cluster needs.
4. `viz-page-architect` in sitemap and user-flow mode. Site structure, navigation, page
   list and the user paths through it.

**Then the page-to-keyword map.** Every page gets exactly one primary keyword, three or four
secondaries, a meta title built around the primary, its H1 and its schema type, in one
table. Sanity-check the phrasing against how people actually search, not how the business
describes itself.

**Then the URL and redirect strategy.** On a rebuild this is the highest-risk artifact in
the project. Full protocol in `seo-preservation.md`. Summary: classify every historical URL
by measured ranking value, keep independently ranking URLs live at their original address,
301 the safe tiers, and hand-map whatever the patterns miss.

**Then the page briefs.** One per page: primary keyword, meta title, H1, schema type,
primary CTA, section list, dependencies.

**Deliverables:**
- `brand_context/target-keywords.md`
- `projects/briefs/{client}-website/{date}_sitemap-and-flows.md`
- `projects/briefs/{client}-website/{date}_page-keyword-map.md`
- `projects/briefs/{client}-website/{date}_url-strategy-and-redirects.md`
- `projects/briefs/{client}-website/{date}_page-briefs.md`
- `projects/briefs/{client}-website/{date}_schema-plan.md`

**Gate:** page-to-keyword map, URL strategy and redirect plan approved. On a rebuild this
gate is approved by whoever owns search performance, not only by the client.

---

## Phase 3: Stack and deploy decision

**Entry criteria:** IA and page count known, so the content-editing question can be answered.

No skill runs here. The output is a written decision. Read `stack-and-deploy.md` for the
house default, the cases where another platform is the better call, what to do with a legacy
codebase nobody can edit, and the deploy rules.

**Deliverable:** `projects/briefs/{client}-website/{date}_stack-decision.md`, recording the
platform, the content model, who edits content after launch, the hosting and deploy path,
and the reason for each.

**Gate:** stack decision recorded and approved. Re-litigating the stack mid-build is the
most expensive avoidable rework in this process.

---

## Phase 4: Copy

**Entry criteria:** page briefs approved. Voice profile present or accepted as absent.

**Skills:** `mkt-copywriting` per page against its brief. `tool-humanizer` on every
publishable word, deep mode when `brand_context/voice-profile.md` exists, standard
otherwise. `mkt-scorecard-funnel` when a quiz or scorecard lead magnet is in scope, because
its questions and result copy are part of the copy set, not a bolt-on after launch.

Copy comes before design because layouts have to fit real content. This is the ordering
Brand Vision, UXPin and the shipped All The Power process all land on independently.

Every statistic gets a named primary source, a year and an outbound link, logged in one
place. Nothing unverified proceeds.

**Deliverables:**
- `projects/briefs/{client}-website/copy/{page-slug}.md` per page
- `projects/briefs/{client}-website/{date}_copy-status.md`, the page-by-page pass list
- `projects/briefs/{client}-website/{date}_stats-index.md`

**Gate:** the full copy set approved. Not a sample. Design does not start against partial
copy.

---

## Phase 5: Design

**Entry criteria:** copy set approved.

**Skills, strictly in this order, each consuming the last:**

1. `viz-design-system`. Tokens, type scale, colour with an explicit ratio, spacing, motion.
   If brand guidelines exist externally, transcribe them rather than invent.
2. `viz-page-architect` in page-blueprint mode. Section-by-section blueprint per page type,
   built from the design system, the page briefs and the approved copy.
3. `str-cro-audit` on the highest-value blueprints before components are specced. Validating
   a blueprint is cheap. Rebuilding a specced component set is not.
4. `viz-component-library`. Component specs with mobile variants, the conversion reasoning
   per component, and the accessibility requirements each component must meet.

**Review happens in the browser on a preview deploy, not in a static mockup tool.** The
static-mockup gate was removed from this process during a real build because what shipped
was never quite what was approved. Build to a preview URL and let the designer iterate
against the real thing.

**Deliverables:**
- `brand_context/design-system.md` plus the token files
- `projects/briefs/{client}-website/{date}_page-blueprints.md`
- `projects/briefs/{client}-website/{date}_cro-audit-blueprints.md`
- `projects/briefs/{client}-website/{date}_component-specs.md`

**Gate:** designer and client approve on the preview URL.

---

## Phase 6: Build

**Entry criteria:** design approved on preview. Stack decision recorded.

**Order of work:** infrastructure, then global components including the tracking shell, then
core pages from blueprint plus copy plus tokens, then templated page sets driven by data
records rather than hand-built, then the blog template and any content migration, then any
noindexed ad landing pages, then the technical search layer, then tracking.

**Skills during build:** `str-onpage-audit` per template as it lands, `str-internal-links`
once enough pages exist to have a link graph, `tool-behaviour-analytics` for the tracking
shell.

**The technical search layer.** Three distinct disciplines, worked and measured separately:

- Ranking in classic search: keywords, redirects, internal links, Core Web Vitals.
- On-page extractability: answer-first opening paragraphs as plain prose with no labelled
  summary box, question-format headings, schema, honest freshness signals.
- Being cited by answer engines: an AI-crawler allowlist in robots.txt, a hand-curated
  llms.txt kept in sync with the sitemap, and off-site corroboration.

Schema is one entity graph in one file. Person and Organization defined once and referenced
by identifier, page-type schema per the Phase 2 matrix, engagement schema on top. Render it
as inline JSON-LD. Verify by fetching raw HTML, because HTML-to-markdown converters strip
script tags and report schema as missing when it is present.

Sitemap dates are truthful and hand-maintained. Generating them at build time makes every
page look updated on every deploy and flattens the freshness signal.

**Per-page checklist, every page, no exceptions:** blueprint exists, copy approved, keywords
assigned from the map, schema planned, internal links mapped both directions, built from
blueprint plus copy plus tokens, JSON-LD implemented, rich results verified, humanizer
passed, one primary call to action with click-to-call on mobile where phone is the
conversion, mobile check for thumb-zone placement and 48 pixel touch targets, and the
on-page check that the H1, meta title and description still match the target keyword.

**Deliverable:** the site itself in its own repo, plus
`projects/briefs/{client}-website/{date}_build-log.md` recording per-page checklist status.

**Gate:** every page passes the per-page checklist. Track it as a list, not a feeling.

---

## Phase 7: Pre-launch audit

**Entry criteria:** all pages built and checklisted.

Every audit is scored and dated. "Looks done" is not a result.

| # | Audit | Skill | Threshold |
|---|---|---|---|
| 1 | Redirect validation | script plus `seo-preservation.md` | Zero unexplained 404s across the historical URL list |
| 2 | Schema validation | `str-onpage-audit` plus rich results check | Correct type per template, no errors, no duplicate page-type schema |
| 3 | Internal links | `str-internal-links` | No 404s, no orphans, hub-and-spoke intact |
| 4 | Cross-device and QA | `tool-web-qa` | Device matrix clean, no console errors, forms submit |
| 5 | Core Web Vitals | `tool-web-performance` | LCP 2.5s, INP 200ms, CLS 0.1 at the 75th percentile |
| 6 | Accessibility | `tool-accessibility-audit` | WCAG 2.2 AA, axe-core clean, keyboard path verified |
| 7 | Security | `str-security-audit` or `tool-website-security` | Graded, with critical and high findings closed |
| 8 | Rebuild comparison | `str-onpage-audit` | New score compared against the Phase 1 baseline |
| 9 | Render-as-bot | `tool-web-qa` | Key pages fetched with answer-engine user agents return the H1, body and JSON-LD |

**Deliverable:** `projects/briefs/{client}-website/{date}_pre-launch-audit.md` with every
score, the date it was taken and the fix list for anything below threshold.

**Gate:** the search owner's approval is the hard launch blocker. Then the client approves
the flip. Both recorded.

---

## Phase 8: Launch

**Entry criteria:** pre-launch audit set signed off.

Launch is a runbook. Use the launch checklist that ships with `tool-web-qa` as the
authoritative list and work it in order.

**Soft launch where the shape allows it.** A soft launch means a limited-audience release
that proves the build in real conditions before the full switch. On a website that usually
means the new build live on a preview or subdomain with search engines blocked, driving a
narrow real audience through the conversion paths, before DNS moves. Where a soft launch is
not possible, and a domain flip often makes it impossible, say so and compensate with a
tighter rollback plan.

**Flip-day sequence:**
1. Blockers cleared: search sign-off, domain verified, rate limiting and firewall rules
   live, every DNS record pre-staged at the registrar including mail authentication.
2. Staged checklist down to the flip.
3. Immediately after the flip, verify by direct request: robots.txt, sitemap.xml, a sample
   of redirects, the certificate, and mail deliverability.
4. Rollback plan written down before the flip, not improvised after it.
5. Next day: Search Console and Bing verified on the production domain, sitemap submitted,
   indexing requested on the priority URLs.

Never flip on a Friday.

**Deliverable:** `projects/briefs/{client}-website/{date}_launch-runbook.md`, completed and
ticked.

**Gate:** the client authorises the flip. This is the least reversible action in the
project.

---

## Phase 9: Measurement

**Entry criteria:** site live on the production domain.

**Skill:** `tool-behaviour-analytics` for the full wiring: one data layer with tags managed
in a tag manager rather than hardcoded per vendor, analytics with a small locked event
taxonomy, consent mode behind a consent banner, session recording and heatmaps, and funnels
defined against the conversion paths from Phase 2.

Also verify: search consoles claimed and sitemaps submitted, the local and citation set with
the business name, address and phone locked in writing before any submission, and a written
list of channels deliberately not being built yet, each with the trigger that would change
that.

**Deliverable:** `projects/briefs/{client}-website/{date}_measurement-plan.md`.

**Gate:** tracking verified live by firing each conversion event and seeing it arrive.

---

## Phase 10: Post-launch

**Entry criteria:** measurement verified.

**The watch window.** For the first four weeks after the flip, check Search Console against
the pre-launch ranking baseline and watch the redirect report. Redirect issues on more than
one percent of URLs point at a mapping problem, not noise. Core Web Vitals field data moves
on a 28-day rolling window at the 75th percentile, so the first trustworthy post-launch
reading arrives once that window has cleared the old site.

**Then the standing cadence.** Continuous cycles beat one-off projects, and 2026 practice
converges on three tempos:

| Tempo | Work | Skill |
|---|---|---|
| Weekly | Review session recordings, heatmaps and funnel drop-off. Log what you see, do not fix on impulse. | `tool-behaviour-analytics` |
| Monthly | Conversion audit of the pages the weekly review flagged, with a prioritised fix list and a test where traffic supports one. | `str-cro-audit` |
| Quarterly | Keyword refresh against what actually ranked, plus a re-run of the security audit and the performance and accessibility checks. | `str-keyword-strategy`, `str-security-audit`, `tool-web-performance`, `tool-accessibility-audit` |

Security in particular does not stay fixed. A site graded clean can be back at a poor grade
within a couple of months after a real incident, so the quarterly re-run is not optional.

**Change verification protocol** for any post-launch change to schema or content structure:
make the change, run any content-store fix script in dry-run then apply, deploy and wait for
it, verify rich results on the affected URLs, check the H1 and metas still match the target
keywords, then spot-check two or three unrelated pages for cascade damage.

**Deliverable:** `projects/briefs/{client}-website/{date}_post-launch-cadence.md`, naming
the owner of each tempo.

**Gate:** cadence owner named and briefed. A cadence with no owner is a cadence that stops.

---

## Sources

Checked September 2026.

- UXPin, The Web Design Process: 8 Essential Steps From Strategy to Launch, 2026 guide.
  https://www.uxpin.com/studio/blog/web-design-process/
- Brand Vision, Web Design Agency Process: Discovery to Launch, Step by Step, 2026. Six
  phases, deliverables per phase, decisions locked at discovery and structure.
  https://www.brandvm.com/post/web-design-agency-process-2026
- TechBullion, UX agency process and methodology in 2026: how discovery sprints and design
  QA reduce product risk. Design QA before launch rather than defect triage after.
  https://techbullion.com/ux-agency-process-and-methodology-in-2026-how-discovery-sprints-and-design-qa-can-reduce-product-risk/
- Clique Studios, The 7 Key Stages of Every Web Design Process. Feedback rounds at each phase
  completion as an explicit client commitment.
  https://cliquestudios.com/clique-university/web-design-process
- Improvado, Ecommerce CRO 2026. Continuous cycles of quarterly funnel audits, monthly tests
  and ongoing monitoring outperform one-off optimisation projects.
  https://improvado.io/blog/ecommerce-cro
- Contentsquare, How to perform a CRO audit. Analytics to find the drop-off, then heatmaps
  and session replay to see it, then a survey to learn why, then prioritise and test.
  https://contentsquare.com/guides/conversion-rate-optimization/audit/
- Internal, verified against shipped builds:
  `C:\Claude\agent-os-v3\agentic-os\projects\briefs\website-build-process\2026-08-10_atp-website-build-guide.md`
  and
  `C:\Claude\agent-os-v3\agentic-os\clients\got-moles\projects\briefs\website-rebuild-rebrand\BUILD-METHODOLOGY.md`
