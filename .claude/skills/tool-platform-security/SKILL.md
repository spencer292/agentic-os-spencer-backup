---
name: tool-platform-security
description: >
  Static security audit of THIS codebase/project — find leaked secrets,
  vulnerable dependencies, and risky config before they ship. Four checks:
  hardcoded-credential scan (tracked + untracked-not-ignored files),
  git-history secret scan (secrets committed then "removed" but still
  recoverable), dependency CVEs via npm audit, and config/permission review
  (.gitignore coverage, .claude/settings.json, sensitive files tracked by git).
  Triggers on: "security audit", "scan for secrets", "secret scan", "any leaked
  keys", "check for hardcoded credentials", "audit dependencies", "is this repo
  safe to push", "security check before commit", "scan the codebase", "check git
  history for secrets", "are my API keys exposed". Use proactively before
  committing new scripts or pushing. Does NOT audit live websites (use
  tool-website-security) and does NOT review code logic/bugs (use code-review).
---

# Platform Security

Static security audit of the codebase you're working in. Catches the three things that quietly turn into incidents: a secret hardcoded into a script, a secret sitting in git history after someone "deleted" it, and dependencies with known CVEs — plus a config/permission sanity pass. One Node script, no external tools to install (it uses `git` and `npm`, which are already here).

## Outcome

A dated markdown report at `projects/tool-platform-security/{YYYY-MM-DD}_audit.md` with findings grouped by severity (high / medium / low / info), each with location and a remediation hint. **All secrets are redacted** — the report shows `abcd…****…wxyz`, never the live value, so the report itself never becomes a new leak. Always save the report to disk; show the user the full absolute path. This is not optional.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## tool-platform-security` section | Known false-positive paths, repo-specific quirks |

## Dependencies

None external. Uses `git` (file enumeration + history) and `npm` (dependency audit), both already present. If the project isn't a git repo, the secrets check falls back gracefully and the history check is skipped.

## Skill Relationships

- **Sibling:** `tool-website-security` — same domain, but for live websites over HTTP. This skill is for code you own; that one is for a running site.
- **Complements:** `code-review` / `gsd-code-review` (logic bugs), `gsd-security-auditor` (verifies a GSD threat model). This skill is the broad, fast, repo-wide secret/dep/config sweep — run it first.
- **Trigger boundary:** "audit/security" + a *live URL* → website skill. "audit/security" + *this repo/code/commit* → this skill.

## Step 1: Run the Audit

From the repo root:

```bash
node .claude/skills/tool-platform-security/scripts/audit.cjs \
  --out projects/tool-platform-security/{YYYY-MM-DD}_audit.md
```

Run all four checks by default, or scope with `--checks`:

| Flag | Default | What it does |
|------|---------|-------------|
| `--checks` | `secrets,history,deps,config` | Comma list — any subset of the four |
| `--root <dir>` | git top-level | Audit a different repo/folder |
| `--max-commits <n>` | `1000` | How far back the history scan reads |
| `--format <md\|json>` | `md` | `json` for machine consumption / cron |
| `--out <path>` | stdout | Write report to a file |
| `--quiet` | off | Suppress progress logging |

Exit code is `2` when any **high**-severity finding exists — useful as a pre-commit / CI gate.

**The four checks:**
- **secrets** — scans every tracked file plus untracked-but-not-ignored files (so new scripts you haven't committed are caught). Respects `.gitignore`, skips `.env`/`.env.local` (those are *meant* to hold secrets), but does scan `.env.example` to catch real keys leaking into the committed example.
- **history** — reads `git log -p` and flags secrets in added lines from past commits. A secret removed in a later commit is still in history and still compromised.
- **deps** — runs `npm audit` in every directory with a `package.json` + lockfile; summarises CVE counts by severity.
- **config** — checks `.gitignore` covers `.env`/keys/certs, reviews `.claude/settings.json` allow/deny rules, and flags any sensitive file (`.env`, `*.pem`, `*.key`, `id_rsa`, service-account JSON) tracked by git.

## Step 2: Triage Findings

Read the report top-down — it's sorted by severity. Treat severities as:

- **high** — act now. A live-looking secret, a private key/`.env` tracked by git, or a critical/high dependency CVE. Assume any flagged secret is already compromised.
- **medium** — fix this session. Generic hardcoded-credential matches, JWTs, moderate CVEs, overly broad permission rules.
- **low / info** — hygiene. `.gitignore` gaps, settings notes, "no vulnerabilities" confirmations.

**False positives:** the scanner already ignores placeholders (`your_key_here`), env references (`process.env.X`, `${VAR}`), and lines marked with an inline `security-ok` / `pragma: allowlist secret` comment. If a finding is genuinely not a secret, add that comment to the line rather than weakening a rule, and note the path in learnings.

## Step 3: Remediate

For the fix recipe per finding type — **rotating** a leaked key (rotation matters more than deletion), purging a secret from git history, resolving CVEs, and tightening config — read `references/remediation.md`. The cardinal rule: a secret that was ever committed or shared must be **rotated**, not just removed. Removal hides it; rotation invalidates it.

## Step 4: Save the Report

Always write to `projects/tool-platform-security/{YYYY-MM-DD}_audit.md` (the `--out` flag does this and creates the folder). Then show the user the full absolute path so they can open it directly. If they want a re-run after fixes, regenerate and diff the counts.

## Step 5: Collect Feedback

After presenting, ask how the findings landed — any false positives to suppress, any check too noisy or too quiet. Log it to `context/learnings.md` → `## tool-platform-security` with the date, and if it's a behavioural correction, also add it to `## Rules` below.

## Schedule (optional)

This is a strong candidate for a recurring `ops-cron` job (e.g. weekly, or pre-push) using `--format json` + a check on the exit code so a high-severity finding fails the run loudly. Offer this once if the user audits regularly.

## Rules

*Updated automatically when the user flags an issue. Read before every run.*

- 2026-06-19: Never write an un-redacted secret into the report or into chat. The scanner redacts by design; preserve that. When discussing a finding, refer to its location, not its value.

## Self-Update

If the user flags an issue — a false positive that should be suppressed, a real secret the scanner missed, a check that's too noisy — fix it immediately: add an ignore comment / allowlist entry for false positives, or tighten/add a rule in `scripts/secret-rules.cjs` for misses. Record the correction in `## Rules` with today's date. Don't just log it to learnings — fix the skill so it doesn't repeat.

## Troubleshooting

- **"git log failed" / history skipped** — not a git repo, or shallow clone. The other three checks still run. For a shallow clone, `git fetch --unshallow` first to scan full history.
- **deps check says "no lockfile"** — `npm audit` needs `package-lock.json`. Run `npm install` in that directory, then re-audit. Without a lockfile the check is skipped, not failed.
- **Too many generic-credential hits** — tune by adding `security-ok` comments to known-safe lines, or narrow the generic rule's keyword list in `secret-rules.cjs`. Provider-specific rules rarely false-positive; the generic assignment rule is the noisy one.
- **Scan feels slow on a huge repo** — files over 1 MB and binaries are already skipped. Narrow with `--checks secrets` or cap history with `--max-commits`.
