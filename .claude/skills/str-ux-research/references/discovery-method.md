# What a discovery phase contains (September 2026)

Self-contained reference for `str-ux-research`. Read before running any mode.

## The shape of the work

A credible agency discovery phase answers four questions before design starts.

1. **What does the business need this site to do?** Answered by the client and stakeholder
   interviews. Output: goals, success measures, constraints, conflicts between stakeholders.
2. **What is actually happening now?** Answered by evidence. Analytics exports, a crawl of the
   live site, and a heuristic review. Output: current-state findings, each tied to something
   observed.
3. **What are users trying to get done?** Answered by user interviews and jobs-to-be-done
   synthesis. Output: top tasks, objections, the language they use, the forces that make them
   switch.
4. **What already exists and is it worth keeping?** Answered by the content inventory and
   audit. Output: a verdict per URL and the traffic and conversions at risk.

Anything a discovery phase produces that does not trace back to one of these four is decoration.

## Discovery sprint framing

The 2026 agency pattern is a compressed discovery sprint rather than an open-ended research
project. Stakeholder interviews, customer research, analytics review, competitor benchmarking
and a collaborative workshop run against a fixed question list, and the sprint ends with a
shared brief rather than a pile of artefacts. Two named deliverables recur across agency
descriptions: a project alignment brief covering core goals, technical constraints and target
measures, and a stakeholder alignment map naming where departments want different things.

Practical consequence for this skill: the brief is the deliverable. Interim artefacts exist to
feed it, not to be shipped separately.

## Evidence versus hypothesis

The single most common discovery failure is presenting an assumption in the voice of a finding.
Guard against it with two mechanical rules.

- Every claim about users carries a source. An interview, an analytics export with its date
  range, a recorded session, a review, a support ticket, or a search query.
- Every claim without one of those is prefixed `Hypothesis:` and carries the test that would
  settle it.

Where a brief is assembled without user interviews, the header states that user research is
outstanding. A page architecture built on unlabelled guesses fails silently, because nobody
downstream knows which parts were invented.

## Top tasks

Rank what visitors come to do, highest first, and keep the list short. A top-task list that
names more than seven things has not been prioritised. Sources for the list, in order of
strength: user interviews, site search queries, Search Console queries that land on the site,
support tickets and sales call recordings, then the client's opinion. The client's opinion goes
last because it is usually a list of what the business wants to say.

Every recommended page in the final brief names the task it serves. A page that serves no task
comes out of the recommendation.

## Conversion map

Not a funnel diagram. A table saying, per audience, what the primary action is, what the
secondary action is for people not ready, and how each is measured. Most sites fail because
they offer one action at one commitment level, so anybody not ready to take it leaves with
nothing.

## The five-second test

Show a first-time visitor the page for five seconds and ask three questions: who is this for,
what do they offer, what do I do next. Pass or fail each. This is the cheapest signal in
discovery and it predicts more variance than any single design factor. Run it on the current
home page and the two highest-traffic pages.

## What must be true

Borrowed from strategy practice, and the most useful framing to put in front of a client.
Write the statements that must hold for the recommended approach to work, each testable and
each with a named owner who can prove or disprove it. Statements that fail become the risk
register. Statements that are unproven become the research backlog.

Example set for a service business:

- Buyers compare at least two providers before enquiring. Provable from switch interviews.
- Most first contact happens on mobile. Provable from the GA4 device split.
- Price is the second objection, not the first. Provable from sales call notes.
- Organic search is the largest acquisition channel worth designing for. Provable from GA4
  channel data over a stated range.

## Where this sits in the chain

`mkt-icp` and `mkt-positioning` run before this skill and are read, not rebuilt. This skill runs
before `viz-page-architect`, `str-keyword-strategy` and `mkt-copywriting`, which all read the
research brief. `str-cro-audit` runs after the build and re-audits against the current-state
findings recorded here.

## Sources

Checked September 2026.

- UX agency process and methodology in 2026, discovery sprints and design QA:
  https://techbullion.com/ux-agency-process-and-methodology-in-2026-how-discovery-sprints-and-design-qa-can-reduce-product-risk/
- UX discovery deliverables, process and importance, Upsilon:
  https://www.upsilonit.com/blog/ux-discovery-deliverables-process-and-importance
- What is discovery phase UX, Userpeek: https://userpeek.com/blog/what-is-discovery-phase-ux/
- Website redesign discovery phase, what to expect:
  https://www.lowcode.agency/blog/website-redesign-discovery-phase-what-to-expect
- UX design process, what to expect working with a UX agency:
  https://agency.uxplanet.org/blog/ux-design-process/
