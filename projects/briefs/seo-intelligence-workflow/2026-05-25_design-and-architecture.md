---
project: seo-intelligence-workflow
type: design-brainstorm-capture
status: BRAINSTORM / DESIGN — not yet approved for build
created: 2026-05-25
origin: Got Moles session (2026-05-24/25) after the str-ai-seo-local full audit surfaced
  deferred stages (GBP, multi-LLM citation, GSC) → Roy wants a substantial, Pixelmojo-style,
  end-to-end SEO/GEO/AEO intelligence system that runs on any website, stage by stage.
intended_scope: site-agnostic (works on any website / client), proven first on Got Moles.
---

# Website Intelligence Audit — Design & Architecture (brainstorm capture)

A backup of the full brainstorm. Captures the vision, the reasoning behind each decision, the
funnel reframe, the full-range additions, the API feasibility, and the agreed **three-workflow**
architecture. Nothing here is built yet — this is the thinking, to be turned into a build plan later.

---

## 1. The vision (what Roy asked for)

Upgrade our SEO/GEO/AEO capability into a **substantial, end-to-end workflow** that can run on a
**full website across the whole range** — almost a **Pixelmojo-type approach** (Pixelmojo Radar is
the recurring third-party AI-visibility benchmark we already track), but in-house and broader.

Key requirements Roy stated:
- Run stage by stage, **each stage potentially its own skill**, producing **one report at the end**.
- Answer well-defined **SEO / GEO / AEO questions**.
- Cover **SERP response** (what shows up when people search) and **what people are searching for** (demand).
- Be **modular** — one giant workflow would be too heavy to run all at once.
- **Link the pieces together** and "put them in motion" so we keep a good running track per client.

---

## 2. The reframe — an audit is a FUNNEL, not a checklist

The biggest conceptual shift. SEO/GEO/AEO only answers **"can we be found?"** — the top of a funnel.
A complete picture follows the visitor all the way to money:

```
DEMAND → DISCOVERY → ARRIVAL → CONVERSION → OUTCOME
            (SEO/GEO/AEO)  (perf/UX/a11y)  (CRO/funnel)  (leads/$)
            └──── under all of it: MEASUREMENT INTEGRITY + COMPETITIVE CONTEXT ────┘
```

**Reasoning:** an audit that stops at rankings misses whether traffic *arrives well*, *converts*, and
*produces revenue* — and whether the tracking is even trustworthy. The funnel framing forces the
workflow to connect rankings to business outcomes, which is what makes it genuinely useful (and
what most SEO tools, including Pixelmojo, don't do — they score findings, not money).

---

## 3. What we already have vs. what's genuinely missing

**We are NOT starting from zero — ~70% of the stage logic exists as skills:**

| Concern | Existing skill |
|---|---|
| Keyword/intent foundation | `str-keyword-strategy` |
| Questions people ask (PAA) | `str-question-harvester` (already uses SerpAPI) |
| On-page SEO (+ apply-fixes) | `str-onpage-audit` |
| AEO/GEO audit | `str-ai-seo` (generic) + `str-ai-seo-local` (Got Moles) |
| Internal links (+ apply-fixes) | `str-internal-links` |
| Conversion (heuristic LIFT) | `str-cro-audit` |
| Off-page/authority | `str-authority-strategy` |
| Trend/demand | `str-trending-research` |
| Security | `str-security-audit` |

**The TWO things that don't exist — and they're the exact "Pixelmojo" differentiators:**
1. **Live SERP-response analysis** — per target query: who ranks, is there an AI Overview, who's
   *cited* in it, featured snippet, PAA, related searches. (Yesterday's audit had to defer to a
   "SERP proxy" because we lack this.)
2. **AI-citation testing** — actually asking ChatGPT / Gemini / Perplexity / Claude the queries and
   recording whether the brand is cited + a hallucination/fact-check matrix.

**Conclusion:** the build is mostly **orchestration of existing skills + these 2 new intelligence
skills + a synthesis stage** — not a rebuild.

---

## 4. API feasibility (Roy's real uncertainty: "will the API let us do this?")

**Answer: yes, ~85% is automatable with keys we already hold.** Per stage:

| Capability | API | Status |
|---|---|---|
| What we already rank for | GSC API | ✓ have (MCP; root-only — wrap as script) |
| What people search for (volume) | Google Ads / Keyword Planner | ✓ have (Got Moles account) |
| **SERP response** (organic + **AI Overview** + PAA + related + autocomplete) | **SerpAPI** | ✓ have `SERPAPI_API_KEY` (returns AI Overview + PAA directly) |
| **AI-citation test** (ChatGPT/Gemini/Claude cite us?) | OpenAI web_search, Gemini grounding, Anthropic web search | ✓ have OpenAI + Gemini keys; Claude here |
| Perplexity citation | Perplexity Sonar API | ✗ needs a key (cheap, optional) |
| Crawl / render / schema | Firecrawl + own node fetch | ✓ have (proven 2026-05-24) |
| CWV — field (real users) | **CrUX API (public, free)** | ✓ no client access needed |
| CWV — lab | PageSpeed Insights API | ✓ free |
| Accessibility | Lighthouse / axe-core | ✓ |
| Behavioral UX | **MS Clarity API** (heatmaps, rage/dead clicks, scroll) | ✓ have (GM Clarity live, project wndo291wli) — needs client access |
| Conversion / funnel | **GA4 Data API** + **CallRail** | ✓ have on GM — needs client access |
| Backlinks / off-page | DataForSEO or Ahrefs API | ✗ the one real gap — needs paid 3rd-party key |
| GBP (local) | Google Business Profile API | ✗ needs owner OAuth |

**Only two stages can't be automated without new spend/access:** backlinks (DataForSEO/Ahrefs) and
GBP (owner OAuth). Everything else — including the AI-Overview + multi-LLM citation testing we had
to *manually defer* in the 2026-05-24 audit — is doable now.

---

## 5. The three layers of questions (Demand / SERP / Citation)

What Roy explicitly wants surfaced, framed as crisp questions:

**A. DEMAND — "what are people actually searching for?"**
- What does the site already rank for, and where? (GSC)
- Volume + intent of the target cluster? (Keyword Planner)
- What questions are being asked? (PAA + autocomplete + related via SerpAPI; Reddit/forums via `str-trending-research`)
- Gap between what they search and what we've published?

**B. SERP RESPONSE — "what shows up when they search?"**
- Who ranks top-10 per money/info query? (SerpAPI)
- Is there an AI Overview — and who's cited, us or a competitor?
- Featured snippet / PAA / local pack — do we own any?
- For each competitor cited instead of us: what structural thing do they have that we don't? (citation-gap loop)

**C. AI / GEO READINESS + CITATION — "will engines quote us, and get us right?"**
- Do ChatGPT/Gemini/Perplexity/Claude cite us for our queries? (live API test)
- Do they state our facts correctly? (hallucination matrix)
- Is the page *built* to be cited — schema, BLUF, speakable, extractable tables/lists, llms.txt, entity graph?

---

## 6. The full-range additions (answer to "what else are we missing?" — UX/CRO and beyond)

The high-value additions, most of which use **data we already pay for but don't feed into audits**
(MS Clarity, GA4, CallRail all have APIs):

| Layer | Question | Data / API | Skill today? |
|---|---|---|---|
| **UX (behavioral)** | Where do users hesitate, rage/dead-click, scroll-stall, abandon forms? | MS Clarity API + recordings | ✗ new |
| **CRO (data-driven)** | Which pages convert, where's the drop-off, what's the lead path? | GA4 Data API + CallRail (calls = the real GM lead) | partial — `str-cro-audit` is heuristic only |
| **Performance (field)** | Real-user CWV, and does speed cost conversions? | CrUX (field) + PageSpeed (lab) | ✗ |
| **Accessibility** | WCAG failures (legal + UX + some SEO) | Lighthouse/axe | ✗ |
| **Content quality/decay** | Thin/dup content, **keyword cannibalization**, pages *losing* rankings over time | GSC trend + own crawl | partial |
| **Trust / reputation** | Brand-SERP ownership, review velocity + sentiment, on-page social proof | SerpAPI + GBP/Yelp + Clarity | partial (local) |
| **Competitive share-of-voice** | Across the query set, what % do we own vs each rival? new SERP features they're taking? | SerpAPI | ✗ |

**The two most-overlooked — and foundational:**
1. **Measurement integrity — verify FIRST.** If GA4/GTM/Pixel/CallRail/conversion tags aren't firing,
   every downstream CRO/funnel number is garbage. (We've hit this: the GTM install, FB-insights scope
   loss.) The workflow should *open* with a tracking-health check, not assume clean data.
2. **Outcome / business-impact tie-back — the "so what" lens.** Rank every fix by estimated
   lead/revenue impact, not just severity. E.g. "Page X: 60k impressions at pos 4 but 0.3% CTR and a
   rage-click cluster on the form" = a money-shaped, prioritised insight. That's the synthesis layer's job.

**Forward-looking:** **AI-agent readiness** — as agents start *acting* (not just citing): can an agent
understand the offer and complete a booking? (llms.txt + structured actions + clean entity data.) v2 stage.

**Discipline note:** this could balloon into "audit the entire internet." The protection is the
**modular-stage architecture** — each layer is an opt-in stage that **degrades gracefully if its
key/data is absent**, and synthesis weights only the stages that ran. Profile-driven (local plumber
gets GBP+reviews+CWV; SaaS gets funnel+content depth).

---

## 7. THE ARCHITECTURE DECISION — three separate, linkable workflows

Roy's call (agreed): **don't build one heavy monolith.** Three modular workflows that run
independently, on different cadences, and link via shared state. **The seam between them is DATA
ACCESS** — an elegant organising principle that also matches the real client lifecycle
(onboard → optimise → grow).

### Workflow 1 — BASELINE (outside-in). "Where are they now?"
- **Runs with ZERO access to client accounts** — the onboarding scenario. Everything knowable from
  the outside: our crawl, technical/schema, on-page SEO, GEO/AEO readiness, SERP-response (SerpAPI),
  AI-citation test (LLM APIs), competitive position, plus the **public** UX/perf slices — **field CWV
  via CrUX (public)**, accessibility, heuristic CRO/UX from the rendered page.
- **Output:** starting-state scorecard + "here's where you stand" + an **access wishlist** ("grant
  GA4/Clarity/CallRail/GBP/GSC and we unlock X"). A strong **onboarding/sales deliverable**.
- **Why this design:** it deliberately *resolves* the "deferred for access" problem from the
  2026-05-24 audit — those aren't failures, they're the intended boundary of WF1.

### Workflow 2 — MONITOR / PROGRESS (inside-data, over time). "How are they improving?"
- **Switches on once access is granted.** Layers in behavioral + outcome data — **GA4, Clarity,
  CallRail, GBP, GSC** — and diffs every run vs the baseline + prior runs. Tracks
  score/ranking/citation/conversion **movement over time** per client.
- **The "track each client over time" loop. The SCHEDULABLE one** ("put in motion"). Plumbing note:
  recurring local runs = **Windows Task Scheduler** (cloud `/schedule` can't reach local keys/GSC per
  our setup — see `feedback_schedule_skill_remote_only`).
- **Opens with the measurement-integrity check** (don't trust the data until tracking is verified).

### Workflow 3 — OPPORTUNITY / DEMAND. "What should they go after?"
- The forward engine: what they search now (GSC) + what they *should* target (Keyword Planner volume
  + intent) + questions asked (PAA/autocomplete/related via SerpAPI) + content gaps vs competitors +
  the honest **"what's actually winnable"** filter (given their authority). Ends in a ranked,
  money-shaped **roadmap**.

### The "4th / final stage" = EXECUTION, which we ALREADY own
Roy trailed off on a 4th. Resolution: it's not a new *intelligence* workflow — it's **execution**, and
we already have the tooling: **`str-onpage-audit` + `str-internal-links` apply-fixes modes**, plus
`str-cro-audit` etc. So the three workflows are the **brain**; existing apply-fixes skills are the
**hands**. WF3 roadmap → executors → result shows up in WF2's next run. Loop closed, nothing extra to build.

### How they link (the "good track of what's going on")
A per-client **state store** every workflow reads + writes —
e.g. `clients/{slug}/projects/seo-intelligence/state.json` + dated run folders. WF1 writes baseline +
profile; WF3 reads it to pick targets; WF2 appends each run's deltas. Shared state = separate yet
linked + a running per-client timeline.

```
WF1 Baseline ──writes──▶ [client state] ◀──reads── WF3 Opportunity ──▶ roadmap ──▶ apply-fixes skills
                              ▲                                                          │
                              └──────────── WF2 Monitor (scheduled) ◀──── re-measures ──┘
```

### Funnel layers mapped across the three
- **Discovery (SEO/GEO/AEO)** → mostly WF1, tracked in WF2.
- **Arrival (perf/UX/a11y)** → public parts in WF1 (CrUX, a11y), real-user parts in WF2 (Clarity).
- **Conversion (CRO/funnel)** → heuristic in WF1, data-driven in WF2 (GA4/CallRail).
- **Demand** → WF3.
- **Measurement integrity** → first check WF2 runs when access lands.

---

## 8. Recommended build order
1. **WF1 (Baseline) first** — highest leverage (every new client needs it), needs no client access so
   nothing blocks it, and most pieces were *proven 2026-05-24* (live crawl, schema, SERP proxy, sitemap).
   Ship it → instant onboarding weapon.
2. **WF3 (Opportunity)** next — also mostly external data.
3. **WF2 (Monitor)** last — most access-/plumbing-dependent; benefits from a stable baseline to diff against.

**Within the builds, build the 2 missing intelligence skills early** (`str-serp-response` =
SerpAPI AIO/PAA/competitors; `str-ai-citation` = multi-LLM citation + hallucination) — they're the
Pixelmojo differentiators and unlock the deferred parts of the 2026-05-24 audit.

---

## 9. Open decisions still to resolve (before a build plan)
- **Split principle:** access-seam (chosen) vs pure funnel-stage? (Leaning access-seam.)
- **WF1 audience:** polished client-facing onboarding/sales doc vs internal working artifact? (Affects report polish.)
- **Behavioral data (Clarity/GA4/CallRail):** core vs optional? (Biggest differentiator, most client-specific plumbing.)
- **Generalisation floor:** Got-Moles internal weapon vs productised audit for other clients? (Affects config/abstraction.)
- **WF2 cadence:** per-client (monthly? weekly for movers?) + single cross-client dashboard vs one report per client.
- **Backlinks gap:** buy a DataForSEO key (cheapest) or leave off-page manual/deferred?
- **Perplexity:** worth a Sonar key for the citation test, or skip?

---

## 10. Next steps (when ready to move from brainstorm → build)
1. Pin the open decisions in §9.
2. Turn this into a Level 2/3 build brief with phased tasks.
3. Build the 2 new intelligence skills (`str-serp-response`, `str-ai-citation`) as standalone, testable units.
4. Assemble WF1 as the first orchestrator over existing + new skills; prove on Got Moles (we have all keys + a known baseline).
5. Then WF3, then WF2 (+ scheduling).

---

*Captured from the 2026-05-24/25 Got Moles brainstorm. Backup of the full thinking; not an approved build.*
