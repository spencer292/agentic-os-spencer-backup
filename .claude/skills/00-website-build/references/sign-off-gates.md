# Sign-off gates

A gate is a named person approving a named deliverable. Nothing else counts. Verbal
enthusiasm on a call is not a gate. "Looks good" on a link with no deliverable attached is
not a gate. Record every approval in the brief with the deliverable, the approver and the
date.

The reason gates matter more than the work: every phase after a gate is built on the
assumption behind it. A page-to-keyword map approved late is a rewrite of the copy, the
blueprints and the redirect plan. Agency practice in 2026 converges on the same point,
which is that decisions locked at discovery and structure are the ones that do not get
repriced later.

---

## The gate table

| Gate | Deliverable approved | Who approves | What it unlocks | What breaks if it is skipped |
|---|---|---|---|---|
| G1 | Discovery brief, plus the baseline audit set on a rebuild | Client owner | Strategy phase | Every later phase guesses at goals, audience and constraints |
| G2 | Page-to-keyword map, sitemap and user flows, URL strategy, redirect plan | Client owner, plus whoever owns search performance | Stack decision and copy | Ranking loss on launch, and it is the least reversible failure here |
| G3 | Stack decision | Client owner, plus whoever will maintain the site | Build setup | The stack gets re-litigated mid-build, which is the most expensive avoidable rework |
| G4 | The complete copy set, humanizer passed, stats sourced | Client owner | Design | Layouts get designed against content that does not exist, then fail to fit the real thing |
| G5 | Design system, blueprints, conversion audit of the blueprints, component specs, reviewed on a preview URL | Designer, then client owner | Production build | Components get built and then respecced |
| G6 | Per-page checklist complete for every page | Build owner | Pre-launch audit | Audit findings scatter across pages that were never finished |
| G7 | Pre-launch audit set, every audit scored and dated | Search owner is the hard blocker, then client owner | Launch | Launching with unknown accessibility, performance, security or redirect state |
| G8 | Launch runbook, blockers cleared, rollback plan written | Client owner authorises the flip | The flip | An unauthorised, unrecoverable domain change |
| G9 | Measurement plan, conversion events verified firing | Client owner | Post-launch cadence | Nothing to optimise against, and no evidence the build worked |
| G10 | Post-launch cadence with a named owner per tempo | Client owner | Handover | The cadence quietly stops and the site decays |

---

## Asking for a gate

Give the approver three things and nothing else:

1. The deliverable, at its full absolute path or its preview URL.
2. What approving it locks, in one sentence.
3. What changes if they want something different, framed by dependency and reversibility,
   never by effort. "Changing the URL strategy after copy is written means rewriting the
   page briefs and the copy set" is the right shape. Anything with a duration in it is not.

Then wait. Do not start the next phase on a partial approval, and do not start it "at risk"
without saying plainly that you are doing so and getting that agreed.

---

## Which gates can be pre-approved

Some clients will pre-approve a class of decision to keep the run moving. That is fine as
long as it is explicit and recorded. Pre-approval is realistic on:

- G3, the stack decision, when the client has no maintenance preference and accepts the
  house default.
- G6, the per-page checklist, when the build owner is Claude and the client only wants to
  see the finished set.

Never pre-approve G2, G7 or G8. Those three carry the irreversible outcomes: lost rankings,
an unaudited launch, and an unauthorised domain flip.

---

## Readiness buckets

State these at Step 0 and report against the same three buckets whenever the run pauses or
ends. This is the format the workspace rules require for any goal that runs unattended.

### Needs client approval

Every gate in the table above. G1, G2, G4, G5, G7 and G8 are the ones that reliably wait on
a human. Get as many pre-approved as the client is willing to pre-approve at Step 0, and
list the rest as known pauses so nobody is surprised when the run stops.

### Pauses when Claude stops

All of it. This process has no background engine. Nothing in it is backed by a cron job or a
deployed workflow. Specifically:

- Chasing a gate, and every phase that follows one.
- Discovery interviews, blueprint work, copy, design decisions and the build itself.
- The per-page checklist and the pre-launch audit set.
- The launch runbook and the flip.
- Every tempo in the post-launch cadence. Weekly recording review, monthly conversion audit
  and quarterly refresh all happen only when someone runs them.

If the client wants any of this to survive Claude stopping, it has to become a real
automation before the run, not a promise inside it. Two candidates are worth building when
the engagement justifies it: a scheduled crawl that alerts on new 404s and redirect breaks,
and a scheduled performance and accessibility check against the launched templates.

### Can stall silently

Each of these can drop work without raising an error. Each needs a detection method and a
retry, not hope.

| Dependency | How it stalls | Detection | Retry |
|---|---|---|---|
| Client content and assets | Promised and never arrives | Named item on the copy status list stays open | Chase against the list, and build with a marked placeholder so the phase is not blocked |
| Third-party crawls and scrapes | Rate limited, or returns partial results that look complete | Row count against the URL inventory | Re-run scoped to the gap, fall back to direct fetches |
| Search Console data | Reporting lag, and a newly verified property has no history at all | Compare the latest available date against today | Wait for the window rather than reading a partial one as a result |
| Core Web Vitals field data | The 28-day rolling window still contains the old site | Check the window start against the launch date | Read lab numbers meanwhile, and say which you are quoting |
| Preview and production deploys | Queued, or succeeded while serving stale cached pages | Check the deployed commit against local | Redeploy through git, never through a platform CLI |
| DNS propagation | Resolves for some resolvers and not others | Query several public resolvers directly | Wait, and hold the rollback plan open |
| External design review | Reviewer never opens the preview | No comments and no approval on the deliverable | Chase with the specific URL and the specific question |
| Answer-engine and rich-results verification | A tool reports schema missing when it is present | Fetch raw HTML rather than a converted version | Re-verify by direct request with the right user agent |

---

## Sources

Checked September 2026.

- Brand Vision, Web Design Agency Process: Discovery to Launch, Step by Step, 2026. Locking
  decisions at discovery and structure to prevent later rework.
  https://www.brandvm.com/post/web-design-agency-process-2026
- Clique Studios, The 7 Key Stages of Every Web Design Process. Client commitments per
  phase, including feedback rounds at each phase completion and stakeholder availability.
  https://cliquestudios.com/clique-university/web-design-process
- LightspeedWP, Website Discovery Process. Discovery deliverables as a refined brief, a
  defined sitemap or page list, and requirements split into must-have and nice-to-have ready
  for prioritisation and sign-off.
  https://lightspeedwp.agency/website-discovery-process/
