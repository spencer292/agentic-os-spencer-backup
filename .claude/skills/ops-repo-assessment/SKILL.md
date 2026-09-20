---
name: ops-repo-assessment
description: >
  One-time engineering and release-assurance assessment of a code repository. Inspects what a repo
  already has (tests, CI, lint/type/build, security scanning, agent instructions, branch protection,
  deploy/rollback, observability), classifies every recommended control as implemented / partial /
  missing, ranks the biggest production risks, and designs the LIGHTEST practical release process
  for THIS repo. Delivers a gap-analysis report plus a drafted RELEASE_GATE.md and A/B/C risk-class
  boundaries that ops-release-assurance then consumes. Assessment only: it proposes and waits for
  approval, it does not modify the repo. Triggers on: "assess this repo", "release assurance
  assessment", "gap analysis on the codebase", "is this repo production-ready", "what CI/gates do we
  need", "set up a release gate", "review our build/release process", before a client repo handover.
  Does NOT review a specific diff/PR (ops-release-assurance).
---

# Repository Release-Assurance Assessment

A one-time, whole-repo assessment that answers: *how much release assurance does this project already have, what's missing, and what's the lightest process that would make it genuinely production-ready?* It ends with a drafted release gate the per-change skill can enforce — so the assessment produces a control, not just a critique.

Assessment, not surgery. It reads the repo and proposes; it changes nothing until the user approves the file plan.

## Outcome

Two things, both saved:

1. **The assessment report** — `projects/ops-repo-assessment/{YYYY-MM-DD}_{repo}.md`: current state, gap analysis (every control classified), top-10 risks ranked, the proposed lightest-practical process, a file plan, CI/enforcement plan, multi-model review plan, security plan for this exact stack, test-improvement plan, and an ordered roadmap.
2. **A drafted `RELEASE_GATE.md` + risk classes** — proposed for the target repo's root (shown for approval, not committed), stating for every gate item whether it's *automated & enforced*, *automated but advisory*, *manual*, or *conditional by risk class*. This is the file `ops-release-assurance` reads to know how to gate each change.

Always save both and show the full absolute paths. This is not optional.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## ops-repo-assessment` section | Prior assessments, house conventions, what "lightest practical" has meant before |
| `references/assurance-model.md` | full | The defence-in-depth model, risk classes, and gate structure this skill assesses against |
| the research brief (if present in the client's briefs) | reference | `AI_SOFTWARE_ENGINEERING_RELEASE_ASSURANCE_RESEARCH.md` is the source model — cite it, don't treat it as gospel |

## Dependencies

| Tool | Required? | What it provides | Without it |
|------|-----------|------------------|------------|
| read access to the target repo | Yes | the whole assessment is repo inspection | can't run — this is a repo skill |
| `gh` CLI | Helpful | reads branch protection / rulesets / Actions state | infer repo controls from files on disk and note what couldn't be verified |
| `npm audit` / stack-native audit | Helpful | dependency-risk evidence for the security plan | note deps as unverified |

## Skill Relationships

- **Produces the input for `ops-release-assurance`.** That skill reads the `RELEASE_GATE.md` and risk classes this one drafts. Run this first, once per repo; run that one per change.
- **Complements `tool-infra-security`.** This assesses the repo's process; that assesses the host it deploys to. A handover wants both.
- **Delegates, doesn't duplicate.** It recommends *which* security/test/review tools fit — it doesn't run the deep code scan (`tool-platform-security`), the live-site scan (`tool-website-security`), or the per-diff review (`ops-release-assurance`). It designs the process those slot into.
- **Respects house policy.** The root `AGENTS.md` mandates trunk-based, commit-to-main, no PR gate — correct for the OS repo and content work. A customer-facing application repo is the justified exception. When this assessment recommends branch protection, it must say *why this repo is the exception*, not silently contradict house policy. See `references/assurance-model.md`.

## Before You Start

Get three things straight — they set the whole altitude of the assessment:

1. **Which repo, and where is it going?** A repo staying internal to a solo operator needs far less than one about to be handed to a client or opened to a team. The destination sets the bar. For a handover, the assessment is also a trust artifact the recipient reads.
2. **What's the highest risk class the repo actually contains?** Auth, multi-tenant data separation, payments, PII, destructive bulk ops → the repo has Class C surface and the process must cover it. A static marketing site does not. Don't design a Class C process for a Class A repo — that's the "process theatre" the model explicitly warns against.
3. **What already runs?** Skim for CI config, test scripts, lockfiles, agent instruction files before forming any opinion. Assess what's there, not what you assume.

## Step 1: Read Prior Context

Read `## ops-repo-assessment` in `context/learnings.md` and `references/assurance-model.md`. If a prior assessment of this repo exists, read it — this becomes a delta, not a from-scratch rerun.

## Step 2: Establish Current State (evidence, not assumption)

Inspect and record what actually exists. Read files; run read-only commands. Cover:

- **Stack & architecture** — languages, framework, data layer, external services, entry points.
- **Tests** — what kinds exist (unit/integration/e2e), what they actually cover, and — critically — whether they test *requirements* or merely *mirror the implementation* (the central AI-generated-code risk).
- **Deterministic checks** — build, typecheck, lint scripts present? Do they pass right now?
- **CI/CD** — `.github/workflows/` (or equivalent). What runs, on what trigger, and is any of it a *required* check?
- **Security tooling** — any SAST, dependency scanning, secret scanning wired in?
- **Agent instructions** — `AGENTS.md` / `CLAUDE.md` / `REVIEW.md` present and meaningful?
- **Repo controls** — branch protection / rulesets (via `gh` if available; note the plan tier — a free private repo *cannot* have rulesets, which is itself a finding).
- **Deploy & rollback** — how does code reach production, and how is it reverted?
- **Observability** — logs, error tracking, alerts, audit trail.

Record positives as explicitly as gaps. An honest current-state is the foundation everything else stands on.

## Step 3: Gap Analysis

For each control in `references/assurance-model.md`, classify: **Implemented · Partially implemented · Missing · Not applicable · Cannot determine.** Use a table. "Not applicable" is a real, valuable answer — mark it and say why (it's how you avoid recommending tools the repo doesn't need). "Cannot determine" is honest when a control lives outside the repo (in a CI provider, a cloud console) — say what you'd need to see.

## Step 4: Rank the Top-10 Risks

The ten most important *current* production risks, each: Critical/High/Medium/Low + the concrete evidence + the failure scenario. Rank by real exposure, not by how many boxes are unticked. A missing CSP on a static site ranks below an unauth endpoint that spends money. Ground each risk in something you actually observed in Step 2.

## Step 5: Design the Lightest Practical Process

This is the skill's judgement, and where it must resist the source model's maximalism. Design the *smallest* process that gives this repo strong assurance:

- Which risk classes (A/B/C) does this repo actually need? Define the A/B/C boundary **for this repo** — what auto-merges, what needs review, what needs sign-off. This is the most important output; `ops-release-assurance` runs on it.
- Which deterministic gates become *required* CI checks (start here — they're objective and cheap).
- When does each review run — Claude self-review, Codex independent, a third adversarial view, a human? Recommend a human/third-model view **only at the risk classes that earn it**, not as routine.
- Which security tools fit *this exact stack* — recommend the minimum that covers the real risks, and explicitly reject tools from the model that don't earn their place here. Say what you rejected and why.

## Step 6: File Plan & Enforcement Plan

Recommend which governance files should exist and what each contains — but only the ones this repo needs. For most repos that's `RELEASE_GATE.md` + risk classes and a lean `REVIEW.md`; a substantial multi-tenant app also wants `THREAT_MODEL.md`. Don't recommend all eight files from the model reflexively; each one that exists must earn its maintenance. For each recommended file, note whether it's new or a merge into an existing file (e.g. the repo's `CLAUDE.md`/`AGENTS.md` may already carry half of it).

Then the enforcement plan: the *exact* checks that should become required status checks and block merge, versus advisory. Follow the model's guidance — deterministic gates mandatory first, AI-review enforcement hardened later once false-positive behaviour is understood. Flag the **critical rule**: changes to the gate itself (`.github/workflows/**`, `RELEASE_GATE.md`, CI/security config) must get elevated review so the agent can't weaken a failing gate by editing the gate.

## Step 7: Draft the RELEASE_GATE.md

Produce the actual proposed `RELEASE_GATE.md` for the target repo, following `references/release-gate-template.md`. The iron rule: **it must not claim a check exists unless it really does (or is in the roadmap, clearly marked "planned").** A gate doc that lies is worse than none — it manufactures false confidence. Mark every item *enforced / advisory / manual / conditional*. This file is the assessment's most durable deliverable.

## Step 8: Roadmap

Order the recommended changes into three phases by dependency and risk, **not by time** (never quote durations):
- **Phase 1 — essential before the next production release / handover.**
- **Phase 2 — high-value hardening.**
- **Phase 3 — mature controls.**

Each item notes what it unblocks and how reversible it is.

## Step 9: Present — Do NOT Implement

Present the report, the drafted `RELEASE_GATE.md`, and a concrete file/change list. **Make no changes to the target repo until the user explicitly approves.** This skill assesses and proposes; implementation is a separate, approved act (often handed to `ops-release-assurance` or an execution skill). Challenge the source model where this repo justifies a different call, and say what you changed and why — the model is input, not scripture.

## Step 10: Save & Feedback

Save the report and the drafted gate to `projects/ops-repo-assessment/{YYYY-MM-DD}_{repo}/` (both files). Show full absolute paths. Ask the user whether the risk ranking and the lightest-process call matched their read of the repo, and log the answer to `context/learnings.md` → `## ops-repo-assessment` — especially any place they thought the process was too heavy or too light, since calibrating "lightest practical" is this skill's hardest and most valuable judgement.

## Rules

*Read before every run. Updated when the user flags a miss.*

- 2026-08-18: Assessment only — never modify the target repo in this skill. Propose a file plan and wait for explicit approval. The whole value is a clear-eyed read before anyone changes anything.
- 2026-08-18: Never recommend a tool or governance file just because the source model lists it. Every recommendation must earn its place against THIS repo's real risk. Reject the rest out loud, with the reason. Unneeded process is the failure mode the model itself warns about.
- 2026-08-18: A `RELEASE_GATE.md` must never claim a check that isn't actually enforced. Mark each item enforced / advisory / manual / planned. A gate that overstates itself creates false confidence — strictly worse than an honest "we don't check this yet".
- 2026-08-18: When recommending branch protection / a PR gate, state explicitly why this repo is the exception to the house trunk-based / commit-to-main policy. Don't silently contradict `AGENTS.md`; justify the exception (customer-facing, multi-tenant, changing owner).
- 2026-08-18: No time estimates on the roadmap or anywhere else. Order by risk, dependency, and reversibility.

## Self-Update

If the user says the assessment was miscalibrated — too heavy, too light, missed a control that mattered, flagged one that didn't — update `## Rules` here immediately with the correction, and if it's a control the model should always check, add it to `references/assurance-model.md`. Fix the skill, don't just log it.

## Troubleshooting

- **`gh` can't read rulesets / branch protection** — often a plan-tier limit (free private repos can't have rulesets) or missing scope. That limitation is itself a Step-2 finding: the repo *cannot* enforce a gate on its current plan. Record it as a blocking gap for the enforcement plan, not a tooling error to skip.
- **No CI, no tests, no agent files** — a common and fine starting point. The assessment is most valuable here; don't treat emptiness as failure, treat it as a clean Phase-1 roadmap.
- **Repo is huge / unfamiliar stack** — assess breadth first (does each control class exist at all), then depth only where risk concentrates. Spawn a read-only explore agent for the current-state sweep if the repo is large; keep the judgement (Steps 5–8) in your own hands.
