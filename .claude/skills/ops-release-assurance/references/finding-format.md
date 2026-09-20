# Finding Format & Severity

Every source — Claude fresh pass, Codex, deterministic checks, attached `tool-*-security` scans — normalises to this one structure so findings are comparable and the package is auditable. This is the same format `tool-infra-security` uses, so a host finding and a code finding read alike.

## Structured finding

```
ID:                 {RA-01, RA-02, … unique in the package}
Severity:           Critical | High | Medium | Low | Advisory
Confidence:         High | Medium | Low
Category:           {e.g. auth, ssrf, injection, data-integrity, concurrency, dependency, cost/dos}
Affected files:     {path(s), ideally with line ranges}
Requirement:        {which requirement or invariant this touches}
Finding:            {what is wrong, stated plainly}
Why it matters:     {the user/business/security consequence}
Exploit/failure:    {concrete inputs/state → wrong output, crash, or compromise}
How to reproduce:   {steps, or the command}
Suggested test:     {a failing test that would catch it — turns a finding into a guard}
Remediation:        {the fix}
Found by:           {claude-fresh | codex | deterministic | tool-infra | tool-platform | tool-website}
Release blocking:   Yes | No
```

Two fields carry most of the weight: **Exploit/failure** (a finding without a concrete failure scenario is a guess — make the reviewer show the path to breakage) and **Found by** (records which source caught it, which is how you learn where each reviewer is strong and whether the independent pass is earning its keep).

## Severity definitions

- **Critical** — plausible catastrophic outcome: remote compromise, auth bypass, cross-tenant data access, uncontrolled destructive data loss, financial-integrity failure, secret/key exposure enabling compromise. **Blocks release.**
- **High** — serious security, correctness, or operational defect with meaningful impact. **Normally blocks release.**
- **Medium** — real problem, limited impact / lower likelihood / has a workaround. **Must be resolved or deliberately accepted (recorded).**
- **Low** — small correctness/quality/maintainability concern. **May be deferred with tracking.**
- **Advisory** — a suggestion, not a demonstrated defect. **Does not block by default.**

## Confidence

Separate from severity. A High-severity / Low-confidence finding ("this *might* be an auth bypass, unverified") is not the same as High/High. Confidence tells the reconciliation step what to reproduce first: high-severity + low-confidence findings are exactly what Step 6 exists to settle by evidence before they block or get dismissed.

## Context-dependent severity

Severity is not intrinsic — it moves with deployment context. The same finding can be Medium in one environment and High in another (an SSRF that reaches a limited metadata surface on a managed host becomes High on a bare VPS with a live credential-serving metadata endpoint). Always state severity *for the environment the change is shipping to*, and note when a planned environment change would re-rank it.
