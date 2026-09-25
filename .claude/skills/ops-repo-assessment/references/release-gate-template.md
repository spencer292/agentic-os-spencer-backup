# RELEASE_GATE.md — template

The `RELEASE_GATE.md` this skill drafts for a target repo. It is a human-readable description of the gate that is *actually* enforced. The iron rule: **never claim a check exists unless it really does.** Mark every item. `ops-release-assurance` reads this file to know how to gate each change.

Fill the placeholders, delete rows that don't apply, and never leave an aspirational item marked "enforced".

```markdown
# Release Gate — {repo name}

**Status legend:** ✅ automated & enforced (blocks merge) · 🟡 automated but advisory ·
✋ manual required · 🔵 conditional by risk class · ⛔ planned (not yet in place)

This document describes the gate that is really enforced. If an item is not yet
enforced it is marked ⛔ planned — this file must never overstate what runs.

## Risk classes for this repo

- **Class A (routine):** {e.g. copy, content, isolated UI, docs}. Path/glob hints: {…}
- **Class B (significant):** {business logic, API, DB/migrations, integrations, journeys}. Hints: {…}
- **Class C (critical):** {auth, tenant separation, admin, payments, PII, secrets, IAM,
  destructive ops — AND any change to this gate or CI/security config}. Hints: {…}

Automation note: {e.g. "the mail-watch lane may auto-apply Class A only; it must never
touch Class B or C unsupervised."}

## Gate items

### Build & static correctness
- [ ] clean build succeeds — {✅/🟡/⛔} — `{command}`
- [ ] type check succeeds — {…} — `{command}`
- [ ] lint passes — {…} — `{command}`

### Tests
- [ ] unit — {…} — `{command}`
- [ ] integration — {🔵 Class B+} — `{command}`
- [ ] e2e critical journeys — {🔵 Class B+} — `{command}`
- [ ] negative/abuse tests for changed surface — {🔵 Class C} — {how}

### Data & migrations
- [ ] migrations apply cleanly — {…}
- [ ] rollback path stated — {🔵 Class B+, manual}

### Security
- [ ] dependency audit — no unresolved high — {…} — `{command}`
- [ ] secret scan (tree + history) — {…} — `{command}`
- [ ] SAST — {…} — `{tool}`
- [ ] {stack-specific, e.g. RLS present on every new table} — {🔵 Class C}

### Reviews
- [ ] Claude fresh-context review — {🔵 Class B+}
- [ ] Codex independent review — {🔵 Class B+, {advisory|required}}
- [ ] third/adversarial view — {🔵 Class C / release boundary}
- [ ] gate-touching change got elevated review — {✋ always for gate/CI/IAM edits}

### Operational readiness
- [ ] rollback capability verified — {🔵 Class B+}
- [ ] observability/alerting for the changed path — {…}

### Human assurance
- [ ] release sign-off recorded — {🔵 Class C}
- [ ] human/pentest review — {🔵 Class C when externally attackable}

## Enforcement

- Required status checks on `{branch}`: {list the ✅ items}
- Branch protection: {state — and if the repo's plan can't enforce it, say so plainly}
- Bypass: {who can, and the rule that gate-config changes get independent review}
```
