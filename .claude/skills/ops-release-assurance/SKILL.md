---
name: ops-release-assurance
description: >
  Per-change release gate for a code change before it ships. Classifies change risk A/B/C, runs the
  deterministic checks that class requires (build, type, lint, tests, dependency + secret scan),
  then layers independent review: a fresh-context Claude pass and, for significant/critical changes,
  an independent OpenAI Codex review (`codex review`) that does not see Claude's conclusions,
  reconciled by evidence not majority vote. Emits one structured evidence package (severity,
  confidence, finding, impact, exploit scenario, suggested test, remediation, release-blocking) and
  a ship / hold verdict. Triggers on: "review this before we ship", "release review", "is this
  change safe to merge/deploy", "run the release gate", "get a second AI to review this", "codex
  review this", "gate this change", before merging to a protected branch. Reads the repo's
  RELEASE_GATE.md. Does NOT design the process (ops-repo-assessment).
---

# Release Assurance — Per-Change Gate

Takes one change — a diff, a branch, a PR, or the working tree — and runs it through the release gate its risk class requires: deterministic checks, a fresh-context Claude review, and (for anything significant) an independent Codex review that never sees Claude's answer. It reconciles the sources by evidence and produces a single evidence package plus a ship/hold call.

The point is defence-in-depth, not more opinions. Deterministic checks and independent reasoning catch *different* classes of fault; the value is combining them and recording what each found.

## Outcome

An evidence package at `projects/ops-release-assurance/{YYYY-MM-DD}_{change}.md`: the change and its risk class, every check run and its result, all findings in the structured format (below), the reconciliation of any disagreement, and a **verdict — SHIP / HOLD / SHIP-WITH-CONDITIONS**. Always save it and show the full absolute path — this record is the whole point; it's what lets a handover recipient or a future reader trust the release without re-doing it.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## ops-release-assurance` section | Prior calls, false-positive patterns, per-repo review notes |
| the target repo's `RELEASE_GATE.md` | full, if present | Defines this repo's A/B/C boundaries and which checks are required — the gate this skill enforces |
| `references/finding-format.md` | full | The structured finding schema + severity definitions every source normalises to |
| `references/review-charters.md` | full | The Claude-fresh-context and Codex independent-review charters (what each reviewer is told) |

## Dependencies

| Tool | Required? | What it provides | Without it |
|------|-----------|------------------|------------|
| the repo's own build/test/lint scripts | Yes | the deterministic layer | can't run deterministic checks — report that gap loudly; a gate with no deterministic evidence is mostly opinion |
| `codex` CLI (`codex review`) | For Class B/C | the independent-vendor review pass | fall back: generate the Codex review pack for manual paste, or mark the independent pass as NOT DONE and cap the verdict at SHIP-WITH-CONDITIONS |
| `/code-review` (inline) | Helpful | a fast Claude author-side pass on the diff | do the fresh-context read directly per the charter |
| `gh` CLI | For PR targets | fetch the PR diff/metadata | pass a branch/commit/working-tree target instead |
| `ops-repo-assessment` output | Strongly recommended | the `RELEASE_GATE.md` this skill reads | fall back to `references/default-classes.md` and say the gate is un-tuned for this repo |

## Skill Relationships

- **Consumes `ops-repo-assessment`.** That skill (run once per repo) writes the `RELEASE_GATE.md` and A/B/C boundaries this skill reads per change. If it hasn't run, this skill uses conservative defaults and says so.
- **Orchestrates, doesn't replace, `/code-review`.** The inline reviewer is one input (the Claude fresh pass); this skill wraps it with classification, deterministic checks, the independent Codex pass, reconciliation, and the saved record.
- **Sibling of the host/site/repo skills.** `tool-platform-security` (code scan), `tool-website-security` (live site), `tool-infra-security` (host) each produce findings in the same format — attach their output to this package when relevant. This skill is the *change*-level gate; they are surface-level scans.
- **Independence rule (critical):** the Codex pass must not be shown Claude's findings before it produces its own. Different sources inheriting one conclusion is worth much less. See `references/review-charters.md`.

## Before You Start

1. **Identify the change precisely.** A PR number, a branch vs base, a commit SHA, or the uncommitted working tree. Everything downstream reviews exactly this diff — get it unambiguous. Prefer `--base <default-branch>` for a branch, `--uncommitted` for local work, `--commit <sha>` for one commit.
2. **Locate the gate.** Read the target repo's `RELEASE_GATE.md`. No gate? Use `references/default-classes.md` and note the gate is un-tuned — recommend running `ops-repo-assessment` once.

## Step 1: Read Prior Context

Read `## ops-release-assurance` in `context/learnings.md` (false-positive patterns for this repo save you re-flagging accepted things), the repo's `RELEASE_GATE.md`, `references/finding-format.md`, and `references/review-charters.md`.

## Step 2: Classify the Change (A / B / C)

Using the repo's gate (or defaults), classify by what the diff actually touches — not its size. A one-line change to an auth check is Class C; a 500-line copy update is Class A. Apply the two hard rules:

- **Any change to the gate itself** — `.github/workflows/**`, `RELEASE_GATE.md`, CI/security config, CODEOWNERS, IAM/permissions — is **automatically Class C** and needs elevated review. This stops a change (or an agent) from weakening a failing gate by editing the gate.
- **When in doubt, round up.** The cost of over-reviewing a Class A change is minutes; the cost of under-reviewing a Class C change is a production incident.

State the class and the one-sentence reason at the top of the package. The class decides which of the following steps run.

## Step 3: Deterministic Checks (all classes)

Run the repo's own checks and record each result verbatim — pass/fail is fact, not opinion, and it's the strongest evidence you'll gather:

- build, type check, lint;
- tests appropriate to the class (unit for A; + integration/e2e for B; + negative/abuse tests for the changed surface for C);
- dependency audit (`npm audit` or stack-native) and secret scan (tree + history) for B/C;
- migration apply/rollback check if the diff touches schema.

A failing deterministic check is usually a **HOLD** on its own — don't proceed to nuanced review to rationalise around a red build. If a required check *can't* run (no script, broken harness), that gap is itself a finding: a gate with no deterministic evidence is mostly opinion.

## Step 4: Claude Fresh-Context Review

Review the diff against the requirements as a *fresh reviewer*, not the author — per the Claude charter in `references/review-charters.md`. The reviewer's job is to *falsify*: find untested behaviour, broken auth boundaries, unhandled errors, unsafe data mutations, concurrency assumptions, migration/rollback gaps. Use inline `/code-review` as a fast first pass if available, then apply the charter's deeper questions yourself. Emit findings in the structured format. Do not yet look at Codex's output.

## Step 5: Codex Independent Review (Class B/C)

Run the independent-vendor pass. Codex sees the same diff and the repo's engineering standard — **not** Claude's findings (independence).

**Use `codex exec`, not `codex review --base`.** The `review` subcommand's `--base` flag refuses a custom prompt (`--base <BRANCH>` cannot be combined with a `[PROMPT]`/stdin), so it can only run Codex's built-in generic review — you can't inject our charter or the structured-output format. `codex exec` takes the charter as its prompt and lets Codex run `git diff` itself to scope the review. Run it read-only so it cannot write:

```bash
codex exec --sandbox read-only --skip-git-repo-check - <<'CHARTER'
<paste the Codex charter from references/review-charters.md, and tell it the scope
explicitly, e.g. "Review ONLY what this branch introduces relative to main — run
`git diff main...navigator` yourself and review those changes." Then:
"Return each finding in this exact structure: Severity / Confidence / Category /
Affected files / Finding / Why it matters / Exploit or failure scenario /
Suggested failing test / Suggested remediation / Release-blocking (yes/no)."
CHARTER
```

Scope by naming the diff in the prompt (`main...<branch>` for a feature branch — three-dot, i.e. what the branch *introduces*; a two-dot `main..<branch>` or `--base` view is noisy when the branch is behind its base). For a single commit or the working tree, tell Codex to review `git show <sha>` or `git diff` respectively.

**Sandbox caveat:** an agent given repo access in `read-only` will still *execute* repo scripts while exploring (e.g. an `inspect`/`costs` npm script that loads `.env` and prints customer data to its own console). Read-only blocks writes, not reads/exec. If the repo has scripts that surface sensitive data on run, say so in the charter and treat any data Codex echoes as already-exposed-to-the-review, not as a new leak.

If `codex` isn't available or errors, fall back: generate the same charter as a **review pack** (diff + requirements + charter) for the user to paste into Codex manually, OR mark the independent pass **NOT DONE** and cap the verdict at SHIP-WITH-CONDITIONS — never silently skip it and call the gate complete. Capture Codex's findings in the same structured format.

## Step 6: Reconcile — by Evidence, Not Vote

Now put all sources side by side: deterministic results, Claude findings, Codex findings, and any attached scan output (`tool-*-security`). **Disagreement is signal, not noise** — resolve it by evidence, never by majority:

- reproduce the issue, or
- write a failing test that proves/disproves it, or
- inspect the runtime behaviour, or
- consult the spec/docs, or
- escalate to a human when it genuinely can't be settled.

Deduplicate findings that describe the same defect. For each surviving finding, set the final severity and confidence, and whether it's release-blocking per `references/finding-format.md`. A finding only Codex saw that reproduces is *more* valuable than one both agreed on — record who found what; it's how the gate improves.

## Step 7: Verdict

Close with one, and the reasons:

- **SHIP** — deterministic checks green; no Critical/High finding open; the class's required reviews done.
- **SHIP-WITH-CONDITIONS** — ready once a named short list is resolved (fix these, add this test), or a required independent pass couldn't run. List the conditions as imperatives.
- **HOLD** — a Critical/High stands, a required check failed, or a Class C change lacks its required sign-off. Name the blocker.

For Class C, the verdict is a *recommendation* until the human sign-off the gate requires is recorded — say so; don't imply an AI gate cleared a critical change on its own.

## Step 8: Save the Evidence Package

Write to `projects/ops-release-assurance/{YYYY-MM-DD}_{change}.md` (create the folder). Show the full absolute path. This package — what was reviewed, by whom, what was found, what was accepted and why, the verdict — IS the deliverable; a green gate with no record is not much better than no gate. If any outbound artifact ships on the back of this (a client note, a handover), follow the outbound-disclosure rule.

## Step 9: Feedback

Ask whether the classification felt right and whether any finding was a false positive for this repo. Log to `context/learnings.md` → `## ops-release-assurance` — a repo's accepted-risk list and false-positive patterns are what stop the gate from crying wolf and being ignored, which is the failure mode that kills gates.

## Rules

*Read before every run. Updated when the user flags a miss.*

- 2026-08-18: Any change to the gate itself — CI workflows, RELEASE_GATE.md, security/IAM config, CODEOWNERS — is automatically Class C. Never let a change weaken the gate that judges it without elevated, independent review.
- 2026-08-18: The Codex pass must not see Claude's findings before producing its own. Independence is the whole reason a second source is worth running; a Codex that's been shown Claude's answer just agrees.
- 2026-08-18: Never silently skip the independent pass. If Codex can't run, either produce a manual review pack or mark it NOT DONE and cap the verdict at SHIP-WITH-CONDITIONS. A gate that quietly drops a required layer is lying about its own coverage.
- 2026-08-18: Reconcile disagreement by evidence — reproduce, write a failing test, check the spec — never by majority vote. Three sources agreeing on a wrong conclusion is still wrong; one source finding a real reproducible bug is still right.
- 2026-08-18: A failed deterministic check is a HOLD by default. Don't reason around a red build with nuanced review.
- 2026-08-18: For Class C, an all-AI pass is a recommendation, not a clearance. State that the human sign-off the gate requires is still owed.
- 2026-08-18: No time estimates anywhere in the package. Size findings by severity, blocking-status, and reversibility.
- 2026-08-18: Invoke Codex with `codex exec --sandbox read-only`, NOT `codex review --base` — the latter rejects a custom prompt, so it can't carry our charter or structured-output format. Scope the review by naming the three-dot diff (`main...<branch>`) in the prompt. (Learned on the first live run — navigator gate.)
- 2026-08-18: Verify every independent-reviewer finding against the actual source before it enters the package — reproduce it, read the named lines. On the navigator run both Codex findings were real and confirmed, but the gate's credibility depends on never passing a claim through unchecked. Confirmed > asserted.

## Self-Update

If the user flags a miss — wrong classification, a false positive that should be an accepted-risk, a check that should have run — update `## Rules` here immediately, and if it's a durable per-repo fact, note it for that repo's `RELEASE_GATE.md` (owned by `ops-repo-assessment`) too. Fix the skill, not just the run.

## Troubleshooting

- **No `RELEASE_GATE.md` in the target repo** — use `references/default-classes.md`, state the gate is un-tuned, and recommend a one-time `ops-repo-assessment` pass so future gates fit the repo.
- **`codex review` errors or isn't logged in** — check `codex login`. If it can't be fixed now, produce the manual review pack and mark the independent pass NOT DONE (Rule 3). Don't block the whole gate on it; cap the verdict instead.
- **Huge diff** — classify and review by area; the highest class touched sets the gate for the whole change. Don't average risk across files — one Class C file makes the change Class C.
- **The change IS the repo's first gate setup** — that's a Class C, gate-touching change reviewed against the assessment, not against a gate that doesn't exist yet. Lean on `ops-repo-assessment`'s output as the standard.
