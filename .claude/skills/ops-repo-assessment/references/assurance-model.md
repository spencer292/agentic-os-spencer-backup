# Release-Assurance Model (assessment reference)

The defence-in-depth model this skill assesses a repo against. Distilled from the AI-Assisted Software Engineering & Production Release Assurance research brief, with the house calibration applied. Cite the brief; don't treat it as scripture.

## The core principle

Production readiness must not rest on the judgement of any single model, person, or checklist. Combine four *different kinds* of evidence, because each catches what the others miss:

1. **Independent reasoning** — another model/person tries to find faults (Claude fresh pass, Codex, a human).
2. **Deterministic verification** — machine checks with a defined pass/fail (build, types, lint, tests, migrations, scans). Stronger than opinion *for the properties actually tested*.
3. **Enforced process** — the platform prevents the process being skipped (branch protection, required checks).
4. **Independent human assurance** — a person accountable for the release, at the risk classes that earn it.

"Multiple AIs looked at it" is not any of these on its own. The best third view is a third model **plus non-AI evidence plus enforcement**.

## The controls to classify (implemented / partial / missing / N/A / can't-determine)

| Layer | Control |
|---|---|
| Build correctness | clean build, type check, lint all pass |
| Behaviour correctness | unit, integration, contract, e2e, negative tests — testing *requirements*, not mirroring the implementation |
| Static security | SAST / code scanning appropriate to the stack |
| Dependency risk | SCA / dependency + lockfile policy |
| Secrets | secret scanning (tree + git history) |
| Data | migration apply/rollback checks |
| Author-side review | fresh-context review by the builder ecosystem |
| Independent AI review | a separate model/vendor (Codex) |
| Third / adversarial view | a separate model or specialist, at risk classes that warrant it |
| Enforcement | protected branch + required status checks |
| Human assurance | expert review / pentest for high-risk releases |
| Runtime | logs, metrics, error tracking, alerts, rollback |

## Risk classes (the most important output to define per-repo)

Don't run the most expensive process on every typo. Classify each change:

- **Class A — routine / low risk:** copy, isolated UI, docs, tooling, refactor under strong tests. → implementation + normal automated checks + one independent review + protected merge.
- **Class B — significant:** new business logic, DB changes, API behaviour, integrations, important journeys, background jobs, material architecture. → Class A **plus** fresh-context review, integration/e2e, dependency+SAST scan, explicit rollback/migration plan, third-model adversarial review, staging validation.
- **Class C — high risk / critical:** auth, authorisation, admin privilege, multi-tenant separation, payments, PII/regulated data, encryption/keys, IAM, destructive bulk ops, financial calculation, critical external APIs. → Class B **plus** updated threat model, security acceptance criteria, focused verification, human review where appropriate, pentest when externally attackable, rollback rehearsal, documented sign-off.

Defining where A/B/C sit *for this specific repo* is the assessment's key judgement. A repo whose automation auto-applies changes to production must state which class that automation is allowed to touch (and never let it reach Class C unsupervised).

## House calibration (where we depart from the raw model)

- **Human/third-model review is not routine.** It earns its place at release boundaries and Class C, not on every PR. Under-scoping this is process theatre.
- **Security tooling: minimum that covers real risk.** For a typical Node/Next stack that's the OSS trio — Semgrep, gitleaks/secret scan, `npm audit`/Dependabot — not a paid four-vendor stack. Recommend by fit; reject the rest out loud.
- **Branch protection is repo-scoped, not global.** The house default is trunk-based / commit-to-main (correct for the OS repo and content). A customer-facing, multi-tenant, or changing-owner application repo is the justified exception — say why when recommending it.
- **The critical enforcement rule (always applies):** the identity that changes application code must not be able to change the controls that judge it — `.github/workflows/**`, `RELEASE_GATE.md`, CI/security config, CODEOWNERS, IAM — without independent review. Otherwise an agent "fixes" a failing gate by weakening the gate.

## What good looks like at the end

The lightest process where: deterministic gates are enforced in CI and required to merge; each change is classified and gets the review its class earns; the gate doc states only what's actually true; and the controls themselves are protected from casual edit. Not more than that.
