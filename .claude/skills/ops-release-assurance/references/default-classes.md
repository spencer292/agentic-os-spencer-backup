# Default Risk Classes (fallback)

Use these ONLY when the target repo has no `RELEASE_GATE.md` yet. They are conservative — when a repo hasn't had a `ops-repo-assessment` pass, err toward more review, not less. Say in the package that the gate is un-tuned and recommend running `ops-repo-assessment` once so the classes fit the repo.

## Class A — routine / low risk
Copy, content, docs, isolated UI/styling, non-functional refactor under existing test cover, low-risk internal tooling.
**Gate:** build + type + lint + unit tests green · one review pass (Claude fresh) · protected merge.

## Class B — significant
New business logic, DB/schema changes, API behaviour, integrations, background jobs, important user journeys, material architecture change.
**Gate:** Class A **plus** integration/e2e tests · dependency + secret scan · Codex independent review · explicit rollback/migration note.

## Class C — high risk / critical
Auth, authorisation, admin privilege, multi-tenant separation, payments, PII/regulated data, encryption/keys, IAM, destructive bulk ops, financial calculation, critical external APIs — **and any change to CI workflows, RELEASE_GATE.md, security/IAM config, or CODEOWNERS.**
**Gate:** Class B **plus** negative/abuse tests for the changed surface · threat-model touch · third/adversarial view · recorded human sign-off. An all-AI pass here is a recommendation, not a clearance.

## Classification hints (path-based, adjust per repo)
- `**/auth/**`, `**/middleware/**`, `**/rls*`, `**/*permission*`, `**/admin/**` → C
- `**/api/**`, `**/migrations/**`, `**/lib/**` (business logic) → B (C if it also matches the C hints)
- `.github/workflows/**`, `RELEASE_GATE.md`, `**/CODEOWNERS`, security config → **always C**
- `**/*.md` (docs), `**/content/**`, `**/*.css`, copy-only diffs → A

When a diff spans classes, the **highest class touched** sets the gate for the whole change. Don't average.
