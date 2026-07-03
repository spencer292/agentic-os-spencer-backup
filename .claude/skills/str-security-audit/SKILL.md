---
name: str-security-audit
description: >
  Full website security audit AND phased apply-fixes skill for production sites — codebase-accessible or black-box. Audit mode runs eleven areas: transport/TLS, HTTP security headers + CSP, DNS + email authentication (SPF/DKIM/DMARC/CAA/DNSSEC), sensitive-path exposure, third-party script trust, dependency vulnerabilities (npm audit), application-layer injection/open-redirect probes, form security (CSRF/rate-limit/CAPTCHA), WAF/bot/rate-limit posture, cookie flags, and redirect-chain abuse surface. Produces a scored, severity-ranked audit report with a prioritised remediation checklist. Apply-fixes mode executes remediation on a LIVE site under strict phased discipline — one change, build, test, verify, commit, monitor, next — never bulk. Use when the user mentions: "security audit", "security review", "pen test", "vulnerability scan", "npm audit", "dependency vulnerabilities", "CSP audit", "header security", "DMARC / SPF / DKIM check", "is the site secure", "harden the site", "fix security findings", "apply security fixes". Use for both fresh audits and post-fix re-audits. Does NOT trigger for: SEO/AEO audits (use str-onpage-audit / str-ai-seo-local), conversion audits (use str-cro-audit), or code-quality review of a feature branch (use the built-in /security-review command for pending-change diffs).
---

# Website Security Audit / Hardening

Full-surface security audit and phased apply-fixes skill for production websites. Audits eleven areas against current best practice, emits a scored severity-ranked report with a prioritised remediation checklist. Apply-fixes mode executes the remediation on a live site under strict one-change-at-a-time discipline.

This is the **audit-skill pattern** (per `meta-skill-creator`): structured area-by-area audit + severity scoring + structured handoff to a phased apply-mode. Modeled on `str-onpage-audit`.

## Outcome

**Produces:** A scored audit report saved to `projects/str-security-audit/{YYYY-MM-DD}_{site-name}-security-audit.md` (or, for a Level 2/3 project, inside the project's brief folder).

Includes:
- Headline verdict + letter grade (A–F)
- Severity summary table (Critical / High / Medium / Low / Pass counts)
- Per-area findings with evidence (actual probe output, not assertions)
- Prioritised remediation checklist (This week / This month / When convenient)
- Phased apply-fixes queue ordered low-risk → high-risk
- "Could not cover from here" scope notes (black-box limits)

Always save to disk. After saving, show the user the full absolute file path and push to Notion if the client uses Notion review.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## str-security-audit` section | Past audit feedback, site-specific gotchas |
| Prior security audit report | full, if exists | Baseline for diff — what changed / regressed / fixed |
| Client `AGENTS.md` | full | Stack, hosting, deploy flow, push remote, review mechanism |
| Memory: deferred-security / patch notes | if exists | Known-outstanding items already triaged |

No `brand_context/` files required — security is content-agnostic. This skill works in standalone mode on any site.

## Before You Start

Confirm scope:
1. **Run mode:** "Fresh audit, post-fix re-audit, or apply-fixes from an existing audit?"
2. **Access level:** "Codebase access (full audit incl. dependency + form-handler + cookie review) or black-box only (external probes)?"
3. **Live-site confirmation:** Is the target in production? If yes, apply-fixes mode runs under Phased Remediation Discipline (below) — confirm the user accepts one-change-at-a-time pacing.
4. **Baseline:** Is there a prior audit report? Load it — the new audit reports deltas, not just absolute state.
5. **Push authorization:** Per live-site rules, never edit/commit/push without explicit per-phase go-ahead. Confirm the deploy path (see client AGENTS.md "Website Deploy" — this repo does NOT deploy; rewire pending) and the revert path before Phase 1.

## Step 0: Load Context + Baseline

1. Read `context/learnings.md` → `## str-security-audit` section.
2. Read the most recent prior audit in `projects/str-security-audit/` (or the project brief folder). Note its grade + open findings.
3. Read the client `AGENTS.md` for stack / hosting / deploy flow.
4. Check memory for any deferred-security or patch-triage notes — items already known-outstanding should be carried into the new report, not rediscovered as if new.
5. Output a status line: "Baseline: {prior grade} from {date}, {N} open findings. Auditing {site} — {access level}."

## Step 1: Run the Eleven Audit Areas

Run every area. Score each finding by severity. Capture **evidence** — actual probe output, header dumps, `npm audit` JSON, DNS records — not assertions. An audit area with no evidence is incomplete.

| # | Area | Reference | Key checks |
|---|------|-----------|-----------|
| 1 | Transport / TLS | `references/external-probes.md` | HTTPS enforced, HSTS + preload, TLS 1.3, cipher, cert chain + expiry, mixed content |
| 2 | HTTP security headers + CSP | `references/headers-csp.md` | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP enforced vs Report-Only, `unsafe-inline`/`unsafe-eval`, `x-powered-by` |
| 3 | DNS + email authentication | `references/dns-email-auth.md` | SPF, DKIM, **single** DMARC record + policy, CAA, DNSSEC, AAAA |
| 4 | Sensitive-path exposure | `references/external-probes.md` | `.env`, `.git/`, `package.json`, `.aws/`, admin login surface, `security.txt`, legacy CMS paths |
| 5 | Third-party script trust | `references/external-probes.md` | count of external script origins, SRI, iframes, supply-chain surface |
| 6 | Dependency vulnerabilities | `references/dependency-audit.md` | `npm audit --json`, severity triage, prod vs dev vs admin-surface scoping, fix-path mapping |
| 7 | Application-layer probes | `references/app-layer-probes.md` | open-redirect params, XSS reflection, SQLi tautology, path traversal — **non-destructive only** |
| 8 | Form security | `references/app-layer-probes.md` | CSRF token, rate limiting, CAPTCHA/honeypot, server-side validation, method/enctype |
| 9 | WAF / bot / rate-limit | `references/external-probes.md` | suspicious-UA handling, rapid-request handling, platform-native DDoS/bot protection |
| 10 | Cookies | `references/headers-csp.md` | `Secure`, `HttpOnly`, `SameSite`, `Path` scoping on any auth cookie |
| 11 | Redirect-chain abuse | `references/app-layer-probes.md` | open-redirect amplification, param reflection into `Location:` header |

The probe script `scripts/probe.mjs` automates areas 1–5, 7, 9, 11 (all non-destructive HTTP/TLS/DNS probes). Run it first, then audit areas 6, 8, 10 require codebase access.

**Evidence rule:** every finding cites its probe. "CSP in Report-Only mode" must show the actual header name returned. "12 npm vulns" must show the `npm audit` summary. No evidence = not a finding yet.

## Step 2: Score + Grade

Severity scale: **Critical** (active compromise / data exposure), **High** (exploitable gap or compliance failure), **Medium** (defence-in-depth gap), **Low** (hygiene / hardening), **Pass**.

Letter grade from the severity mix:
- **A** — 0 Critical, 0 High, ≤2 Medium
- **B** — 0 Critical, ≤2 High, fixable gaps
- **C** — 0 Critical, 3–5 High
- **D** — 0 Critical, 6+ High
- **F** — any Critical

## Step 3: Prioritised Remediation Checklist

Three tiers:
- **This week** — all High + any Critical
- **This month** — all Medium
- **When convenient** — all Low

Each item: finding, severity, fix, file path or DNS record to change, reversibility note, whether it needs codebase access / DNS-panel access / a vendor dashboard.

## Step 4: Phased Apply-Fixes Queue

Order the remediation **low-risk → high-risk**, not by severity. On a live site, a low-severity code change is safer to ship first than a high-severity dependency bump. Group into phases. Each phase is one logical change with its own test + verify + commit + monitor cycle.

Default ordering:
1. **Low-risk code config** — header flags (`poweredByHeader: false`), `security.txt`, CORS tightening
2. **Dependency patches** — `npm audit fix` patch-bumps first, then minor/major framework bumps separately
3. **CSP enforcement** — deploy to PREVIEW first, watch for blocked-script violations, fix allowlist, then promote
4. **CSP tightening** — nonce-based `script-src`, removing `unsafe-inline`/`unsafe-eval`
5. **DNS / email auth** — DMARC dedupe, SPF hardening, CAA, DNSSEC (usually a DNS-panel handoff)
6. **Application-layer code** — CSRF, rate limiting, CAPTCHA, admin auth hardening

## Step 5: Save Report

Save to `projects/str-security-audit/{YYYY-MM-DD}_{site-name}-security-audit.md` (or project brief folder for L2/L3) with frontmatter:

```yaml
---
site: [domain]
date: [YYYY-MM-DD]
grade: [A-F]
audit_type: [black-box | codebase | hybrid]
critical: [n]
high: [n]
medium: [n]
low: [n]
status: draft
---
```

Show the full absolute path. Push to Notion if the client reviews there. Present: grade, severity summary, top findings to act on this week.

## Phased Remediation Discipline (Mandatory for Live Sites)

Non-negotiable for any production site. Apply-fixes mode on a live site follows this exactly.

### Rule A — One Phase at a Time
Never bulk-apply the remediation checklist. One phase = one logical change. Finish, verify, monitor, then move to the next. The user explicitly asked for "one step at a time, test at each phase" — this rule encodes that.

### Rule B — The Only Flow per phase
1. **Baseline** — `git rev-parse HEAD` + capture current state (audit JSON / header dump / `npm audit` snapshot) so you can prove the delta and revert cleanly.
2. **Confirm** — state the change, the test, the revert path. Get explicit go-ahead. Never edit/commit/push without it — unauthorized build/push actions are a standing violation.
3. **Edit** — make the smallest change that closes the finding.
4. **Build** — `npm run build` (or `npx next build`) MUST pass locally. Never push a broken build.
5. **Test locally** — smoke-test the affected surface (admin panel, sample pages, the changed header/behaviour).
6. **Commit + push** — descriptive message referencing the audit + phase. Push to origin for backup. DEPLOY CAVEAT: this repo has NO Vercel wiring — the live site deploys from the ORIGINAL freeflyroy/agent-os repo (client AGENTS.md "Website Deploy"; rewire pending). Shipping the fix live means pushing the site tree through that deploy repo — surface this as an explicit user step; never use the Vercel CLI.
7. **Verify deployed** — once the change is actually LIVE via the deploy repo, re-run the relevant probe against production (deploy settles ~2 min). Confirm the finding is closed AND nothing else regressed. If the fix is committed here but not yet shipped, report it as STAGED, not deployed.
8. **Monitor** — watch deploy logs + analytics (Clarity, Vercel logs) for the agreed window before starting the next phase.
9. **If broken** — `git revert` and push immediately. Diagnose before retrying. Don't push through repeated errors.

### Rule C — CSP and Other "Enforcement Flips" Go to Preview First
Any change that moves from observe-mode to enforce-mode (CSP Report-Only → enforcing, SPF `~all` → `-all`, DMARC `p=none` → `p=quarantine`) can break things that were silently tolerated. Deploy to a preview/staging environment first, observe, fix the allowlist/config, THEN promote. Never flip enforcement straight to production.

### Rule D — Dependency Bumps Are Their Own Phase
Never bundle a dependency bump with feature work or other security fixes — it compounds the regression surface. Patch-level `npm audit fix` bumps can be one phase; minor/major framework bumps (Next.js, Payload) are each their own phase with a full local build + admin + page smoke test before push. Read the changelog for breaking changes first.

### Rule E — DNS Changes Are Usually a Handoff
SPF / DKIM / DMARC / CAA / DNSSEC live in the registrar's DNS panel (GoDaddy, Cloudflare, etc.), not the codebase. Attempt a CLI/API path first before handing off to a UI-only flow. If none exists, produce the exact records to add/remove/change and hand off to whoever holds DNS access — clearly, with the specific blocker named. Don't pretend a DNS change shipped when it's actually pending a handoff.

### Rule F — Post-Fix Re-Audit Runs the Full Probe
Re-scoring after a phase ships runs the actual probe again — never project "fix landed therefore grade went up". Capture live evidence in the re-audit the same way the original audit did. If self-talk says "should be an A now with these fixes" — stop and run `probe.mjs`. The re-audit is bound by Rule G evidence discipline like any audit.

### Rule G — Evidence in the Report
Every finding in the saved report carries its probe evidence inline (header value, DNS record, `npm audit` line, probe response). A finding with no evidence is an assertion, not a finding — re-run the probe before saving.

## Apply-Fixes Mode

When the user asks to apply / implement / fix findings from an existing audit:

1. **Find the audit** — most recent in `projects/str-security-audit/` or the project brief folder. If multiple, ask which.
2. **Present the phased queue** (Step 4 ordering). Confirm: "Start with Phase 1, or a specific phase?"
3. **Run one phase** under Phased Remediation Discipline (Rules A–G). Stop at the end of the phase. Report: what changed, evidence it worked, what's next.
4. **Wait for go-ahead** before the next phase.
5. **Update audit status** — `status: partially-remediated` → `remediated`. Append a remediation log at the bottom: phase, commit SHA, date, verification evidence.

## References

| File | Topic |
|------|-------|
| `references/external-probes.md` | Transport/TLS, sensitive paths, third-party trust, WAF/bot — probe methods + pass criteria |
| `references/headers-csp.md` | HTTP security headers, CSP modes + tightening, cookie flags |
| `references/dns-email-auth.md` | SPF / DKIM / DMARC / CAA / DNSSEC — how to query + fix |
| `references/dependency-audit.md` | `npm audit` triage, severity scoping, framework-bump discipline |
| `references/app-layer-probes.md` | Non-destructive injection / open-redirect / form-security probes |
| `scripts/probe.mjs` | Automated non-destructive HTTP/TLS/DNS probe — dumps JSON |

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-05-14: Skill created. Modeled on `str-onpage-audit` audit-skill pattern. Eleven audit areas + severity grading + phased apply-fixes. Phased Remediation Discipline (Rules A–G) is non-negotiable for live sites — one phase at a time, preview-first for enforcement flips, dependency bumps isolated, DNS changes handed off cleanly, re-audits run the real probe. Built from the Got Moles 2026-05-12 external review methodology.

## Self-Update

If the user flags an issue with the output — wrong severity, missed area, bad phase ordering, false finding — update the `## Rules` section immediately with the correction and today's date. Fix the skill, don't just log to learnings.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`

## Troubleshooting

- **No codebase access:** run black-box mode — areas 1–5, 7, 9, 11 via `probe.mjs`. Areas 6 (dependency), 8 (form internals), 10 (cookie code) get noted as "needs codebase access" in the scope section.
- **`probe.mjs` blocked by the target's WAF:** that's itself a finding (good WAF posture). Note it, fall back to manual `curl`/`dig`, document what was reachable.
- **`npm audit` shows vulns with no fix path:** scope them — is the package in the production bundle, dev-only, or admin-surface-only? A dev-only vuln is Low, not High. Map the real fix path (transitive dep → which parent pins it).
- **CSP flip breaks the site:** revert immediately (Rule B step 9). The blocked scripts in the preview violation log are the allowlist additions you missed — add them, re-test in preview, retry.
- **DNS change "didn't take":** DNS propagation lags. Re-query after the TTL window before assuming failure. Confirm you edited the right zone (apex vs subdomain).
